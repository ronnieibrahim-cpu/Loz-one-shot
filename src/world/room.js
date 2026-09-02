// Room: one or more 10x8 tile screens. Owns its tile grid, collision queries, a
// cached render of its static layer, and its spawn lists.
//
// ROOM DEFINITION FORMAT (contract for map data files):
//
//   {
//     size: [2, 1],                 // OPTIONAL, in SCREENS. Default [1,1].
//     map: [                        // 8*sh rows of 10*sw characters
//       'TTTTTTTTTT',
//       'Tgggggggg T',              // (extra whitespace is stripped)
//       ...
//     ],
//     legend: 'coast',              // name from LEGENDS, or an inline {char:tile} object
//     entities: [                   // compact tuples: [type, tileX, tileY, opts?]
//       ['octorok', 3, 4],
//       ['chest', 5, 2, { item: 'bombs' }],
//     ],
//     warps: [                      // [tileX, tileY, mapId, floor, roomX, roomY, opts?]
//       [4, 7, 'd1', 0, 3, 7],
//     ],
//     music: 'overworld',           // optional music override
//     tint: 'cave',                 // optional palette tint key
//     dark: false,                  // unlit room (needs a lit torch / Light Ring)
//     name: 'Tidewatch Village',    // optional display name for the map screen
//   }
//
// Coordinates: tileX 0..room.tw-1, tileY 0..room.th-1. Pixel space within a
// room is tileX*16 .. tileX*16+15 and tileY*16 .. tileY*16+15.
//
// A ROOM'S SIZE IS IN SCREENS, AND ITS GRID IS ONE GRID.
//
// A 2x1 room's `map` is eight rows of TWENTY characters — not two 10-wide grids
// laid side by side. That is deliberate: the parser asserts the grid matches the
// declared size exactly, which is the thing that stops a 3x1 room being authored
// as three separate screens by accident and then silently read as one.
//
// The internal seams between screens are not boundaries. Nothing in the engine
// knows where they are; `checkRoomExit` fires on the room's own extent
// (`room.pw` / `room.ph`) and the camera slides across the seams. The screen
// grid survives only as the unit the size is counted in.

import { TILE, ROOM_W, ROOM_H, offscreen } from '../core/screen.js';
import { tiles as tileSheet } from '../gfx/art.js';
import { F, resolveTile, getTileDef, tileArt, tileVariant, tileEdgeArt, blockRef, tileDefSolid } from './tileset.js';

export const LEGENDS = new Map();

/**
 * The sizes a room may declare, in screens.
 *
 * Closed on purpose. An unbounded room size is a different game: the render
 * cache, the minimap's cell spanning and the camera clamp are all sized against
 * this list, and "whatever the author typed" is not a size any of them were
 * designed for. A size outside the set THROWS at construction rather than
 * warning — a room that is silently the wrong shape strands the dungeon around
 * it and looks like a tile bug.
 */
export const ROOM_SIZES = ['1x1', '2x1', '1x2', '2x2', '3x1'];

/** Validate and normalise a `size` field. Returns [sw, sh]. Throws if illegal. */
export function normaliseSize(size, where = 'room') {
  if (!size) return [1, 1];
  const sw = size[0] | 0, sh = size[1] | 0;
  if (!ROOM_SIZES.includes(`${sw}x${sh}`)) {
    throw new Error(`${where}: illegal room size ${size[0]}x${size[1]}`
      + ` (allowed: ${ROOM_SIZES.join(', ')})`);
  }
  return [sw, sh];
}

/** Register a char->tile legend. `base` names another legend to inherit from. */
export function registerLegend(name, mapping, base) {
  const parent = base ? (LEGENDS.get(base) || {}) : {};
  LEGENDS.set(name, { ...parent, ...mapping });
}

export function getLegend(nameOrObj) {
  if (!nameOrObj) return LEGENDS.get('base') || {};
  if (typeof nameOrObj === 'object') return nameOrObj;
  return LEGENDS.get(nameOrObj) || LEGENDS.get('base') || {};
}

export class Room {
  constructor(def, key, mapDef) {
    this.def = def;
    this.key = key;                       // "floor,x,y"
    this.mapId = mapDef ? mapDef.id : '?';
    this.floor = 0; this.rx = 0; this.ry = 0;
    if (key) {
      const p = key.split(',').map(Number);
      this.floor = p[0]; this.rx = p[1]; this.ry = p[2];
    }
    const legend = getLegend(def.legend || (mapDef && mapDef.legend));
    this.legend = legend;

    // Size in screens, and the four derived extents everything else asks for.
    // A room with no `size` is 1x1 and every one of these is the old constant,
    // which is how an existing grid parses byte-identically.
    const [sw, sh] = normaliseSize(def.size, `${this.mapId}/${key}`);
    this.sw = sw; this.sh = sh;
    this.tw = sw * ROOM_W; this.th = sh * ROOM_H;      // tiles
    this.pw = this.tw * TILE; this.ph = this.th * TILE; // pixels

    // Base grid of tile *names* as authored (may be virtual tide tiles).
    this.base = new Array(this.tw * this.th);
    const rows = (def.map || []);
    const chars = new Array(this.tw * this.th);
    for (let y = 0; y < this.th; y++) {
      const row = (rows[y] || '').replace(/\s+$/, '');
      for (let x = 0; x < this.tw; x++) {
        const ch = row[x] !== undefined ? row[x] : ' ';
        const t = legend[ch];
        chars[y * this.tw + x] = ch;
        this.base[y * this.tw + x] = t || legend[' '] || 'void';
      }
    }
    this.expandBlocks(chars, `${this.mapId}/${key}`);
    // Runtime overrides (opened doors, smashed bushes, lifted rocks).
    this.override = new Array(this.tw * this.th).fill(null);

    this.music = def.music || null;
    this.tint = def.tint || null;
    this.dark = !!def.dark;
    this.name = def.name || null;

    this.warps = (def.warps || []).map(w => Array.isArray(w)
      ? { x: w[0], y: w[1], to: { map: w[2], floor: w[3] | 0, rx: w[4], ry: w[5] }, ...(w[6] || {}) }
      : w);

    this._cache = null;
    this._cacheTide = -1;
    this._cacheDirty = true;
    this._alt = new Map();        // parallel caches, keyed like `render`'s
    this.animCells = [];      // [{x,y,def}] refreshed with the cache
    this.overCells = [];      // tiles drawn above entities
    this.visited = false;
    this.cleared = false;     // all enemies defeated at least once (for locked rooms)
  }

  /**
   * Resolve every block footprint in the grid to its cells.
   *
   * A block character marks the FOOTPRINT of one object, so a 3x3 shop is nine
   * of the same character and the loader decides which cell each one is. The
   * scan runs in reading order and CLAIMS a whole w x h rectangle the first
   * time it meets an unclaimed cell of that character, which is what makes two
   * shops side by side — six characters in a row — two shops rather than an
   * ambiguity. Anything that does not fit throws, naming the room: a building
   * one row short renders as a roof with no front, strands whatever was behind
   * it, and validates perfectly.
   */
  expandBlocks(chars, where) {
    const claimed = new Uint8Array(this.tw * this.th);
    for (let y = 0; y < this.th; y++) {
      for (let x = 0; x < this.tw; x++) {
        const i = y * this.tw + x;
        if (claimed[i]) continue;
        const b = blockRef(this.base[i]);
        if (!b) continue;
        const ch = chars[i];
        for (let dy = 0; dy < b.h; dy++) {
          for (let dx = 0; dx < b.w; dx++) {
            const jx = x + dx, jy = y + dy, j = jy * this.tw + jx;
            if (jx >= this.tw || jy >= this.th || chars[j] !== ch || claimed[j]) {
              throw new Error(`${where}: block '${b.name}' at ${x},${y} needs a `
                + `${b.w}x${b.h} footprint of '${ch}' and does not have one`
                + ` (fails at ${jx},${jy})`);
            }
            claimed[j] = 1;
            this.base[j] = b.tiles[dy][dx];
          }
        }
      }
    }
  }

  inBounds(tx, ty) { return tx >= 0 && ty >= 0 && tx < this.tw && ty < this.th; }

  /** Authored (possibly virtual) tile name. */
  baseName(tx, ty) {
    if (!this.inBounds(tx, ty)) return 'void';
    return this.override[ty * this.tw + tx] || this.base[ty * this.tw + tx];
  }

  /**
   * The tide level to resolve one tile against.
   *
   * Every query below takes a `tide` that is EITHER a plain 0/1/2 or the Tide
   * field itself. The field is what the running game passes, and it answers per
   * tile, which is what makes a room able to be dry in one half and flooded in
   * the other. The plain number is what the offline checkers and the
   * level-by-level probes in the harnesses pass, and it stays supported on
   * purpose — "what would this room be at HIGH everywhere" is a question worth
   * being able to ask.
   *
   * `this` is handed to the field so it resolves against THIS room's overrides.
   * A room being drawn during a transition must not pick up the overrides of
   * the room sliding in beside it.
   */
  levelAt(tide, tx, ty) {
    return typeof tide === 'number' ? tide : tide.levelAt(tx, ty, this);
  }

  /** Concrete tile definition at the given tide level or field. */
  tile(tx, ty, tide) {
    if (!this.inBounds(tx, ty)) return getTileDef('void');
    return resolveTile(this.baseName(tx, ty), this.levelAt(tide, tx, ty));
  }

  flagsAt(tx, ty, tide) { return this.tile(tx, ty, tide).flags; }

  setTile(tx, ty, name) {
    if (!this.inBounds(tx, ty)) return;
    this.override[ty * this.tw + tx] = name;
    this.invalidate();
  }

  clearTile(tx, ty) {
    if (!this.inBounds(tx, ty)) return;
    this.override[ty * this.tw + tx] = null;
    this.invalidate();
  }

  warpAt(tx, ty) {
    for (const w of this.warps) if (w.x === tx && w.y === ty) return w;
    return null;
  }

  invalidate() {
    this._cacheDirty = true;
    for (const a of this._alt.values()) a.dirty = true;
  }

  /**
   * The cache key for a tide argument.
   *
   * For a plain level it is the level. For the field it is the field's stamp,
   * which bumps on every change to the base OR to the override list — so an
   * anchor thrown, recalled or resized re-renders the room. Getting this wrong
   * is silent: the room keeps drawing the old water while collision uses the
   * new one, which looks like an art bug and fails no test.
   */
  cacheKeyFor(tide) {
    return typeof tide === 'number' ? tide : 'f' + tide.stamp;
  }

  /**
   * The art to draw for the cell at (x, y): its edge piece if it is on the
   * boundary of its own mass, otherwise one of its ground variants.
   *
   * The neighbour lookup is HERE rather than in `tileset.js` because the room
   * owns the grid — the same reason `solidAt` lives here. Off the edge of the
   * room reports the tile's OWN family, so a cliff running along a screen
   * boundary does not sprout a lip on cliff that carries on into the next
   * screen; see `tileEdgeArt`.
   */
  artAt(d, x, y, tide) {
    if (d.edgeArt) {
      const edge = tileEdgeArt(d, (dir) => {
        const nx = x + (dir === 'left' ? -1 : dir === 'right' ? 1 : 0);
        const ny = y + (dir === 'up' ? -1 : dir === 'down' ? 1 : 0);
        if (nx < 0 || ny < 0 || nx >= this.tw || ny >= this.th) return d.family;
        return this.tile(nx, ny, tide).family;
      });
      if (edge) return edge;
    }
    return tileVariant(d, this.key, x, y);
  }

  /**
   * Lay whole 32x32 objects over the cells that asked for one.
   *
   * The room is divided into fixed 2x2 blocks. Every block holding at least one
   * cell of a given quad set draws that set's four quadrants, whether or not
   * all four cells are trees — which is the whole point: a tree at the bottom
   * edge of a mass gets its trunks and root mound drawn on the ground below it
   * instead of being cut off flat, and one at the end of a row gets its far
   * half instead of a hard vertical edge down the middle of the canopy.
   *
   * The lattice is fixed to the room rather than walked out from each mass, and
   * that is deliberate: two cells of the same tree must never disagree about
   * which half of it they are, and a per-row or per-run parity lets exactly
   * that happen wherever a mass is ragged — which is how a left-half root mound
   * ended up under a right-half canopy.
   *
   * A block is keyed by quad set, so a palm standing against an oak draws both
   * trees rather than one hybrid. Palette comes from the first cell found for
   * that set, so a block straddling `tree` and `treeDark` picks one wood and
   * stays one object rather than changing colour down its own middle.
   */
  drawQuads(ctx, cells, tide) {
    if (!cells.length) return;
    const blocks = new Map();
    for (const c of cells) {
      const q = c.def.quad || c.def.big;
      const bx = c.x & ~1, by = c.y & ~1;
      const key = `${bx},${by},${q}`;
      if (!blocks.has(key)) blocks.set(key, { bx, by, q, def: c.def });
    }
    for (const b of blocks.values()) {
      const top = b.def.quadPalTop, bot = b.def.quadPalBot;
      const put = (qx, qy, ox, oy) => {
        const x = b.bx + ox, y = b.by + oy;
        if (!this.quadMayCover(x, y, tide, b.q)) return;
        tileSheet.draw(ctx, b.q + qy + qx, x * TILE, y * TILE,
          { pal: oy ? bot : top });
      };
      put('L', 'T', 0, 0); put('R', 'T', 1, 0);
      put('L', 'B', 0, 1); put('R', 'B', 1, 1);
    }
  }

  /**
   * May a tree overhang this cell?
   *
   * A tree's own cells always may. Beyond them the answer is PLAIN GROUND ONLY,
   * and the village is the reason: the Maku Tree's hollow sits in the tree line
   * at the top of the square, so the block holding it drew a whole oak straight
   * over the doorway and the way in vanished — art covering a warp, which
   * nothing in the checker table can see because the tile is still there and
   * still warps. Anything a player has to be able to SEE — a doorway, a prop, a
   * cliff, water, an animated cell — keeps its pixels, and the tree is cut
   * against it instead. That trade is the right way round: a tree with a flat
   * side is a blemish, a door nobody can find is a dead end.
   */
  quadMayCover(x, y, tide, q) {
    if (x < 0 || y < 0 || x >= this.tw || y >= this.th) return false;
    const d = this.tile(x, y, tide);
    if ((d.quad || d.big) === q) return true;
    if (d.flags & (F.VOID | F.WARP | F.SOLID)) return false;
    return !(d.over || d.anim || d.underArt || d.quad || d.big);
  }

  /**
   * The ground to draw under a prop.
   *
   * A prop names one — `rock` stands on grass, `rockSand` on sand — and where
   * the room disagrees with the name, the prop brings its own ground with it
   * and lands as a HARD GREEN SQUARE in the middle of a beach. The Bluff
   * Hollow had a boulder doing exactly that, and it is the same class of fault
   * as a cave mouth with no rock round it: art that does not know what it is
   * standing on.
   *
   * The declared ground is kept unless the room OUTVOTES it, and the bar is
   * deliberately high: two or more plain-ground neighbours, all of them the
   * same ground, and not one neighbour of any kind carrying the declared one.
   * A single dissenting neighbour is not evidence — the Drowned Wood's snarl
   * stands in a channel with walls on three sides and one plank floor on the
   * fourth, and a one-vote rule walked it out of the water and onto the
   * floorboards. Water and other props never get a vote for the substitute
   * (this canvas is the static layer; animated cells are drawn over it later),
   * but they do count for the match, or a prop standing in water could never
   * find its own ground beside it.
   *
   * AND WHERE THE DECLARED GROUND IS NOWHERE ON THE SCREEN AT ALL, keeping it
   * is not caution, it is the bug. The vote above needs two neighbours that
   * AGREE, and a tree in a treeline has trees either side (which never vote,
   * being 32x32 objects) while a rock in a row of rocks has rocks — so the
   * commonest prop arrangements in this world reach `declared` by default. In
   * the marsh that meant every oak stood on a square of bright Holodrum grass
   * in the middle of `grassDark` and `mud`; on the reef, four posts and four
   * boulders each carried a hard green rectangle across a rust-and-sand floor.
   * 274 cells did it, and each one is the boulder-on-a-beach fault the
   * paragraph above is about, arrived at from the other direction.
   *
   * So the last resort is the screen's OWN commonest ground rather than the
   * tile table's idea of one. It fires only when the declaration is dry (a
   * prop that stands in water keeps its water — see the snarl) and the screen
   * has no ground of that palette anywhere, which is exactly the case where
   * the declaration cannot be describing this place.
   */
  underGround(d, x, y, tide) {
    const declared = getTileDef(d.underArt);
    let cand = null, agree = 0, disagree = false;
    for (const [dx, dy] of [[0, 1], [0, -1], [-1, 0], [1, 0]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= this.tw || ny >= this.th) continue;
      const n = this.tile(nx, ny, tide);
      if (n.name === d.underArt) return declared;
      if (n.underArt || n.over || n.anim || n.quad || n.big) continue;
      if (n.flags & (F.VOID | F.SOLID | F.WARP)) continue;
      // A DISAGREEMENT NO LONGER SHORT-CIRCUITS. It used to return `declared`
      // on the spot, and that is the path most of this world's props take: a
      // tree on the edge of a wood has mud on one side and dark grass on the
      // other, which is a disagreement about WHICH ground and not evidence
      // that the declared one is right. It still refuses to pick a winner —
      // `agree` stays below two and `cand` is discarded — but it now falls
      // through to the screen-wide test below, which is the only one that can
      // tell "these two grounds disagree" from "neither of them is grass".
      if (!cand) { cand = n; agree = 1; } else if (n.name === cand.name) agree++;
      else { disagree = true; }
    }
    if (agree >= 2 && !disagree) return cand;
    if (declared.flags & F.WET) return declared;
    const g = this.groundCensus(tide);
    if (!g.dominant || g.pals.has(declared.pal)) return declared;
    // A NEIGHBOUR BEATS THE SCREEN. Once the declaration is disqualified the
    // question is no longer "is one vote enough" — it is "which of the grounds
    // that ARE here", and the one touching this cell is the right answer. The
    // screen's commonest ground is only the fallback for a prop with no plain
    // ground beside it at all: the Bog Causeway's tree line is `grassDark` on
    // the outside and the screen's commonest ground is the `mud` band through
    // its middle, so taking the screen's answer planted every oak in a beach.
    for (const [dx, dy] of [[0, 1], [0, -1], [-1, 0], [1, 0]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= this.tw || ny >= this.th) continue;
      const n = this.tile(nx, ny, tide);
      if (n.underArt || n.over || n.anim || n.quad || n.big) continue;
      if (n.flags & (F.VOID | F.SOLID | F.WARP | F.WET)) continue;
      return n;
    }
    return g.dominant;
  }

  /**
   * What ground this screen is actually made of: the set of palettes its plain
   * ground uses, and the commonest ground tile.
   *
   * PALETTE, NOT NAME, IS THE TEST. `sand` and `sandRipple` are one material in
   * two dressings and read identically under a boulder; `grass` on a screen of
   * `grassDark` does not. Counting names would call the first pair a fault and
   * would keep re-substituting between them for ever.
   *
   * Memoised on the same key the render cache uses (`cacheKeyFor`), because the
   * answer moves with the tide — a screen that is sand at LOW and seafloor at
   * HIGH is two different grounds — and because `render` asks it once per prop.
   */
  groundCensus(tide) {
    const key = this.cacheKeyFor(tide);
    if (this._groundKey === key && this._groundCensus) return this._groundCensus;
    const pals = new Set();
    const n = new Map();
    for (let y = 0; y < this.th; y++) {
      for (let x = 0; x < this.tw; x++) {
        const d = this.tile(x, y, tide);
        if (d.underArt || d.over || d.anim || d.quad || d.big) continue;
        if (d.flags & (F.VOID | F.SOLID | F.WARP | F.WET)) continue;
        pals.add(d.pal);
        n.set(d.name, (n.get(d.name) || 0) + 1);
      }
    }
    let dominant = null, best = 0;
    // Ties break on the name, so a screen with two grounds in equal measure
    // draws the same one every time it is rendered.
    for (const [name, c] of [...n].sort((a, b) => a[0] < b[0] ? -1 : 1)) {
      if (c > best) { best = c; dominant = getTileDef(name); }
    }
    this._groundKey = key;
    this._groundCensus = { pals, dominant };
    return this._groundCensus;
  }

  /** Render (and cache) the static tile layer for a tide level or field. */
  render(tide, frame) {
    if (!this._cache) this._cache = offscreen(this.pw, this.ph);
    const key = this.cacheKeyFor(tide);
    if (this._cacheDirty || this._cacheTide !== key) {
      const ctx = this._cache.ctx;
      ctx.clearRect(0, 0, this.pw, this.ph);
      this.animCells.length = 0;
      this.overCells.length = 0;
      // Trees are drawn AFTER every ground cell, not in step with them. They
      // overhang their own cells, and a ground tile painted afterwards would
      // scrub the overhang off again — silently, and only at the edges.
      const quadCells = [];
      for (let y = 0; y < this.th; y++) {
        for (let x = 0; x < this.tw; x++) {
          const d = this.tile(x, y, tide);
          if (d.flags & F.VOID) {
            ctx.fillStyle = '#000';
            ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
            continue;
          }
          // Tiles with transparent pixels sit on top of a base tile.
          if (d.underArt) {
            const u = this.underGround(d, x, y, tide);
            // The ground under a tree or a bush varies too, or every prop in
            // the game would stand on the one unvaried cell and re-draw the
            // grid this exists to remove.
            tileSheet.draw(ctx, tileVariant(u, this.key, x, y), x * TILE, y * TILE, { pal: u.pal });
          }
          if (d.over) { this.overCells.push({ x, y, def: d }); continue; }
          if (d.anim) { this.animCells.push({ x, y, def: d }); continue; }
          // ONE CELL OF A TREE. A tree is 32x32 in every Oracle sheet and there
          // is no 16x16 tree to find, so a tree cell is one QUADRANT of one —
          // but WHICH quadrant is not a question about this cell, and asking it
          // per cell is what put jagged edges on half the woods in the game.
          //
          // The source draws whole trees. Look at any Holodrum screen: the
          // canopies of a wood overlap, every one of them shows its own root
          // mound, and not one is cut off flat. This engine was instead
          // choosing a quadrant from the neighbours of each cell, so a tree
          // whose mass did not happen to be an even 2x2 came out sliced: a
          // canopy over open sand ended in a dead-straight horizontal line
          // because there was no cell below it to draw the trunks in, and a
          // root row one tile shorter than its canopy drew half a mound with a
          // hard vertical edge — sometimes the LEFT half under the RIGHT half
          // of the canopy, because the two rows voted separately.
          //
          // So the quadrants are not picked here at all. Tree cells are
          // collected, and `drawQuads` below lays whole 32x32 trees on a fixed
          // 2x2 lattice over the room: a block with any tree cell in it draws
          // ALL FOUR quadrants, overhanging onto the ground beside or below it
          // where the mass runs out. Overhang is what the source does with a
          // 32x32 object and it is why every tree there has roots.
          if (d.big || d.quad) { quadCells.push({ x, y, def: d }); continue; }
          // A ground tile may declare interchangeable art. The choice is a pure
          // hash of this room and this cell, so it is stable across every cache
          // rebuild and consumes nothing — see `tileVariant` and `T2`.
          tileSheet.draw(ctx, this.artAt(d, x, y, tide), x * TILE, y * TILE, { pal: d.pal });
        }
      }
      this.drawQuads(ctx, quadCells, tide);
      this._cacheTide = key;
      this._cacheDirty = false;
    }
    return this._cache.canvas;
  }

  /**
   * Render the room at a tide level OTHER than the one it is currently being
   * played at, into a cache of its own.
   *
   * The Brineglass Lens needs a second version of the same room on screen at
   * the same time as the real one. Asking `render()` for it would work exactly
   * once and then thrash: it holds ONE canvas keyed on the tide argument, so
   * two arguments alternating every frame re-render the whole grid twice a
   * frame and throw the animated-cell lists away in between.
   *
   * KEYED THE SAME WAY `render` IS, via `cacheKeyFor`, so it takes a plain
   * level or the field and a field entry re-renders when the field's stamp
   * moves. Keying this on the raw argument instead would cache a field render
   * forever under the key "[object Object]" and draw water that stopped being
   * true several anchors ago — silently, because a stale canvas throws nothing.
   *
   * It deliberately does NOT touch `animCells` or `overCells`: the preview is a
   * still, and the room's own animation belongs to the level actually played.
   */
  renderAt(tide, frame) {
    const key = this.cacheKeyFor(tide);
    let a = this._alt.get(key);
    if (!a) { a = offscreen(this.pw, this.ph); a.dirty = true; this._alt.set(key, a); }
    if (a.dirty) {
      const ctx = a.ctx;
      ctx.clearRect(0, 0, this.pw, this.ph);
      // The same deferred pass `render` uses. Without it this canvas drew every
      // tree as the 16x16 fallback art the tiledef keeps for previews and the
      // map screen's colour sampler — so holding the Lens up in a wood put a
      // row of lollipops on sticks over the real trees, at every tide, for as
      // long as the trees have been 32x32.
      const quadCells = [];
      for (let y = 0; y < this.th; y++) {
        for (let x = 0; x < this.tw; x++) {
          const d = this.tile(x, y, tide);
          if (d.flags & F.VOID) continue;
          if (d.underArt) {
            const u = this.underGround(d, x, y, tide);
            tileSheet.draw(ctx, tileVariant(u, this.key, x, y), x * TILE, y * TILE, { pal: u.pal });
          }
          if (d.big || d.quad) { quadCells.push({ x, y, def: d }); continue; }
          // Same hash as `render`, or the Lens's preview of the room would
          // draw a DIFFERENT field of grass from the room behind it.
          tileSheet.draw(ctx, d.anim ? tileArt(d, frame) : this.artAt(d, x, y, tide),
            x * TILE, y * TILE, { pal: d.pal });
        }
      }
      this.drawQuads(ctx, quadCells, tide);
      a.dirty = false;
    }
    return a.canvas;
  }

  /** Draw animated tiles (water, lava, torches) that sit below entities. */
  drawAnim(ctx, ox, oy, tide, frame) {
    for (const c of this.animCells) {
      tileSheet.draw(ctx, tileArt(c.def, frame), ox + c.x * TILE, oy + c.y * TILE, { pal: c.def.pal });
    }
  }

  /** Draw tiles that occlude entities (treetops, arches, pillars). */
  drawOver(ctx, ox, oy, tide, frame) {
    for (const c of this.overCells) {
      tileSheet.draw(ctx, tileArt(c.def, frame), ox + c.x * TILE, oy + c.y * TILE, { pal: c.def.pal });
    }
  }

  /**
   * Solidity of a single pixel, honouring sub-tile quadrant masks.
   * `caps` describes what the player can currently traverse.
   */
  solidAt(px, py, tide, caps) {
    const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
    if (tx < 0 || ty < 0 || tx >= this.tw || ty >= this.th) return true;
    // The tile is resolved at ITS OWN tide level, so a hitbox spanning the edge
    // of a frozen patch is solid on one side and wadeable on the other.
    const d = this.tile(tx, ty, tide);
    let quadSolid;
    if (d.mask === 15) quadSolid = true;
    else if (d.mask === 0) quadSolid = false;
    else {
      const qx = (px % TILE) >= 8 ? 1 : 0;
      const qy = (py % TILE) >= 8 ? 1 : 0;
      const bit = 1 << (qy * 2 + qx);
      quadSolid = (d.mask & bit) !== 0;
    }
    return tileDefSolid(d, caps, quadSolid);
  }
}
