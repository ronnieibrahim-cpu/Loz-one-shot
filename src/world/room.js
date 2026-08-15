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
import { F, resolveTile, getTileDef, tileArt, blockRef } from './tileset.js';

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

  /** Render (and cache) the static tile layer for a tide level or field. */
  render(tide, frame) {
    if (!this._cache) this._cache = offscreen(this.pw, this.ph);
    const key = this.cacheKeyFor(tide);
    if (this._cacheDirty || this._cacheTide !== key) {
      const ctx = this._cache.ctx;
      ctx.clearRect(0, 0, this.pw, this.ph);
      this.animCells.length = 0;
      this.overCells.length = 0;
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
            const u = getTileDef(d.underArt);
            tileSheet.draw(ctx, d.underArt, x * TILE, y * TILE, { pal: u.pal });
          }
          if (d.over) { this.overCells.push({ x, y, def: d }); continue; }
          if (d.anim) { this.animCells.push({ x, y, def: d }); continue; }
          tileSheet.draw(ctx, d.name, x * TILE, y * TILE, { pal: d.pal });
        }
      }
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
      for (let y = 0; y < this.th; y++) {
        for (let x = 0; x < this.tw; x++) {
          const d = this.tile(x, y, tide);
          if (d.flags & F.VOID) continue;
          if (d.underArt) {
            const u = getTileDef(d.underArt);
            tileSheet.draw(ctx, d.underArt, x * TILE, y * TILE, { pal: u.pal });
          }
          tileSheet.draw(ctx, tileArt(d, frame), x * TILE, y * TILE, { pal: d.pal });
        }
      }
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
    const f = d.flags;

    if (f & F.VOID) return true;
    if (f & F.SOLID) {
      if (d.mask === 15) return true;
      if (d.mask === 0) return false;
      const qx = (px % TILE) >= 8 ? 1 : 0;
      const qy = (py % TILE) >= 8 ? 1 : 0;
      const bit = 1 << (qy * 2 + qx);
      return (d.mask & bit) !== 0;
    }
    // Deep water is impassable on foot but fine while swimming.
    if (f & F.DEEP) return !(caps && (caps.swim || caps.jumping));
    // Gaps are crossed by jumping only.
    if (f & F.JUMPABLE) return !(caps && caps.jumping);
    // A ledge is the lip of a drop, not a floor. Nothing stands on it: the
    // player clears it in a hop (Player.tryLedgeHop) and is airborne while it
    // happens, so caps.jumping is what lets the hop through. Blocking it on
    // the ground is the half that makes the ledge one-way — otherwise you
    // could walk back up the drop or stroll along the lip.
    if (f & F.LEDGE) return !(caps && caps.jumping);
    if (f & F.BUSH) return !(caps && caps.cutting);
    if (f & F.ROCK) return true;
    return false;
  }
}
