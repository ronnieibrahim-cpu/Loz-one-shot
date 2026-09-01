// Tile registry.
//
// TILE DEFINITION FORMAT (contract for tile data files):
//
//   'grass': {
//     art: `...16 rows of 16 chars...`,   // see gfx/art.js for the pixel grammar
//     pal: 'grass',                       // palette name from gfx/palettes.js
//     flags: 0,                           // bitwise OR of F.* below
//     mask: 15,                            // sub-tile solid quadrants, only if SOLID
//     tide: ['sandLow','sandMid','waterDeep'],  // variant per tide level 0/1/2
//     anim: ['water0','water1','water2','water1'], animRate: 10,
//     over: true,                          // draw above entities (treetops, arches)
//     push: [dx, dy],                      // water current, pixels/frame
//     openFlag: 'makuOpenedKeep',          // story gate: opens when the save
//     openTo: 'rockFloorDk',               //   carries this flag (see below)
//     openDeny: 'Iron, sunk deep.',        //   said if you press A on it first
//   }
//
// STORY GATES
//   `openFlag` is the third kind of gate this game has, next to a flag an item
//   answers (F.BOMBABLE, F.VANE) and terrain an item crosses (F.DEEP). It is
//   not answered by an item at all: the tile becomes `openTo` on room entry
//   once the save carries the named flag, and nothing the player is holding
//   changes that. `Game.applyStoryGates` is the whole implementation and it
//   runs alongside `restoreRoomState`, so a story gate opens the moment you
//   walk in rather than when you touch it.
//
//   It exists because a region can be owed to the STORY rather than to an
//   item, and expressing that as an item flag is how a progression lock gets
//   built: the Keep's road was sealed by a tile only the Dredge Line opened,
//   and the Dredge Line is inside the Keep.
//
// TIDE VARIANTS
//   A tile with `tide` is a *virtual* tile: at runtime it resolves to one of three
//   concrete tiles depending on the global tide level (0 = low, 1 = mid, 2 = high).
//   Variant targets must be concrete (no nested `tide`); validate() enforces this.
//   This is how the whole world reshapes: authors place one char and the tide
//   system decides whether it is dry sand, wadeable shallows, or deep sea.

import { hash32 } from '../core/rng.js';

export const F = {
  SOLID:     1 << 0,   // blocks movement
  WATER:     1 << 1,   // shallow: walkable, wading animation, slight slowdown
  DEEP:      1 << 2,   // deep water: needs Flippers, enters swim state
  PIT:       1 << 3,   // fall in, take damage, respawn at room edge
  HAZARD:    1 << 4,   // lava / spikes: damage on contact
  LEDGE:     1 << 5,   // one-way hop-down ledge (direction in `ledge`)
  STAIRS:    1 << 6,   // auto-warp on step (stairs, doorway)
  BUSH:      1 << 7,   // destructible by sword/bomb
  ROCK:      1 << 8,   // liftable with Power Bracelet
  ICE:       1 << 9,   // slippery
  SLOW:      1 << 10,  // deep sand / mud
  NOFLY:     1 << 11,  // cannot be crossed even with Roc's Feather
  JUMPABLE:  1 << 12,  // 1-tile gap that Roc's Feather clears
  WARP:      1 << 13,  // cave mouth / door: triggers the room's warp list
  NOSPAWN:   1 << 14,  // enemies never spawn or wander here
  // A fixed thing a thrown line catches on: a post, a ring, a mooring. The
  // Dredge Line hauls Link to it rather than hauling it to Link, which is the
  // crossing verb it inherits. Declared by a tile rather than discovered,
  // because being yanked somewhere you did not choose is a bug.
  SNAG:      1 << 15,
  BOMBABLE:  1 << 16,  // cracked wall
  DOOR:      1 << 17,  // dungeon door (state in room)
  SWITCHF:   1 << 18,  // floor switch
  CURRENT:   1 << 19,  // pushes the player while swimming (see `push`)
  WHIRL:     1 << 20,  // whirlpool: pulls in, warps
  VOID:      1 << 21,  // outside the map: solid and never rendered as floor
  SANDBAR:   1 << 22,  // marks tiles whose walkability depends on tide (for hints)
  TALLGRASS: 1 << 23,  // hides the player's feet, drops rupees when cut
  VANE:      1 << 24,  // salt vane: only the Resonance Rod rings it open
  // 1 << 25 was MAGNETIC — "iron plug: the Dredge Line hauls it out of the
  // way". The Keep's seal is the only thing that ever carried it, and the seal
  // is now opened by the story rather than by an item (see `openFlag` below),
  // so nothing carries it and the bit is free. A flag whose comment names a
  // gate the world no longer has is the same drift as a tiledef field the
  // registrar drops: it reads as true and is not.
  // Region-gate markers. These do NOT drive traversal — the engine already
  // knows how to cross each of these tiles, because each one also carries the
  // ordinary flag for what it is (a chasm is JUMPABLE, a channel is DEEP, a
  // boulder is SOLID+ROCK). The marker exists so a checker can say *which item*
  // a given impassable tile is holding shut, which is the whole difference
  // between "the region is unreachable" and "the region is gated on the
  // Dredge Line". Reusing JUMPABLE or DEEP for that would make every gap and
  // every stretch of ocean in the world read as the same gate.
  HEAVY:     1 << 26,  // boulder: only the Dredge Line drags it clear
  SWIMGATE:  1 << 27,  // deep channel: only Zora's Flippers cross it
  GRAPPLE:   1 << 28,  // span crossed by dredging a fixed snag on the far side
  GAP:       1 << 29,  // chasm: only Roc's Feather clears it
  // Metal, crystal, or grown coral: the Resonance Rod makes it answer. Not a
  // traversal flag — a ringable tile also carries whatever it actually is.
  RING:      1 << 30,
};

// Convenient composites
F.BLOCKED = F.SOLID | F.VOID;
F.WET = F.WATER | F.DEEP;

export const TILES = new Map();

/** Register a batch of tile definitions. Later registrations override earlier. */
export function registerTiles(defs) {
  for (const [name, def] of Object.entries(defs)) {
    if (!def) continue;
    TILES.set(name, {
      name,
      art: def.art,
      // Tiles with transparency (trees, bushes, rocks) name a tile to draw beneath.
      underArt: def.underArt || null,
      pal: def.pal || 'stone',
      flags: def.flags || 0,
      mask: def.mask == null ? 15 : def.mask,
      tide: def.tide || null,
      anim: def.anim || null,
      animRate: def.animRate || 10,
      over: !!def.over,
      // A TILE THAT IS ONE CELL OF A BIGGER OBJECT. `quad` names a set of four
      // 16x16 arts — `<quad>TL`, `TR`, `BL`, `BR` — cut from one 32x32 source
      // tree. Which one this cell draws is decided by its NEIGHBOURS at render
      // time, not by its coordinates: see `Room.render`.
      //
      // The top and bottom rows carry separate palettes (`quadPalTop`,
      // `quadPalBot`) because a canopy and its roots do not fit in one
      // four-colour palette. On hardware they are separate tiles with separate
      // palettes, and this is the same split.
      //
      // An earlier cut of this drew the whole 32x32 tree from one tile,
      // overhanging its neighbours. It clipped the canopy off every tree on a
      // screen's top row and double-drew every run. Quadrants keep each cell
      // inside itself.
      //
      // NAMED HERE ON PURPOSE: this registrar copies field by field, so a
      // field it does not name is silently DISCARDED — that is how `liftLevel`
      // sat in the data unread for the life of the project.
      quad: def.quad || null,
      quadPalTop: def.quadPalTop || null,
      quadPalBot: def.quadPalBot || null,
      // GROUND VARIANTS: other art names this tile may be drawn as. Purely a
      // draw-time substitution — same flags, same palette, same everything the
      // simulation can see — so a field of grass stops being one 16x16 cell
      // repeated across the screen. `tileVariant` picks one, and it MUST be
      // named here or `registerTiles` would discard it silently, the way it
      // discarded `liftLevel` for the life of the project (see below).
      variants: def.variants || null,
      // AUTOTILING. `family` groups tiles that are the same MASS — every
      // palette-swap of a cliff is still cliff, so a `cliffDk` beside a `cliff`
      // is not an edge. `edgeArt` names the art to draw instead of this tile's
      // own when the neighbour in that direction is a DIFFERENT family:
      // `{ up: 'cliffTop' }` puts a lip on the top row of every cliff mass in
      // the game without a single room grid changing. Draw-time only, like
      // `variants` — nothing the simulation can see moves.
      family: def.family || null,
      edgeArt: def.edgeArt || null,
      // 1 in `variantOdds` cells shows a variant. See `tileVariant` for why
      // this is a SCATTER and not an even mix.
      variantOdds: def.variantOdds || 8,
      push: def.push || null,
      ledge: def.ledge || null,
      depth: def.depth || 0,
      // How strong you have to be to pick this up, against LIFT_STRENGTH and
      // any item that raises it, and what it looks like once lifted.
      //
      // THESE TWO WERE MISSING and had been since tiledefs existed. This
      // function copies field by field rather than spreading, so a tiledef key
      // it does not name is silently discarded — `boulder` has declared
      // `liftLevel` the whole time and `Game.liftTile` has read it the whole
      // time, and the two never met. Nothing validated it, because the boulder
      // was ALSO gated behind an item the player did not have yet, so the
      // symptom never showed. Same class as the `giver` options in
      // docs/HANDOFF.md: data contracts drift from engine contracts silently.
      liftLevel: def.liftLevel || 0,
      liftSprite: def.liftSprite || null,
      // A story gate: see the contract at the top of this file. THESE THREE
      // HAVE TO BE NAMED HERE. This function copies field by field, so a
      // tiledef key it does not list is silently discarded — which is exactly
      // how `liftLevel` sat in the data unread for the life of the project.
      openFlag: def.openFlag || null,
      openTo: def.openTo || null,
      openDeny: def.openDeny || null,
    });
  }
}

// --------------------------------------------------------------------------
// BLOCKS: objects bigger than a tile.
//
// A building is three cells wide and three tall. Cutting one into nine loose
// tiles gives an author nine characters that mean something in exactly one
// arrangement, with nothing to catch a wrong one — the roof laid on upside
// down validates, renders and strands the screen behind it.
//
// So a block is registered once, as its grid of cell tiles, and PLACED once. A
// room grid draws the building's footprint as a rectangle of a single legend
// character:
//
//     'ggHHHggg'          H is 'block:bShop', 3x3, so this is one shop
//     'ggHHHggg'          with grass either side — not nine tiles that
//     'ggHHHggg'          happen to line up.
//
// `Room` claims each rectangle top-left-first and resolves every cell to the
// tile named here (see the footprint pass in src/world/room.js). A footprint
// that is not exactly w x h THROWS at construction, which is the whole point:
// a mis-drawn building is a typo, and a typo should be an error and not a
// screen you have to look at to discover is wrong.
//
// The cell tiles are ordinary tiles with ordinary flags. Nothing downstream —
// collision, rendering, the tide field, every checker — knows a block exists.
export const BLOCKS = new Map();

/** Register a batch of block definitions: { name: { w, h, tiles: [[name]] } }. */
export function registerBlocks(defs) {
  for (const [name, def] of Object.entries(defs)) {
    const { w, h, tiles } = def;
    if (!w || !h || tiles.length !== h || tiles.some(r => r.length !== w)) {
      throw new Error(`block ${name}: declares ${w}x${h} and lists `
        + `${tiles.length} rows of ${tiles.map(r => r.length).join('/')}`);
    }
    BLOCKS.set(name, { name, w, h, tiles: tiles.map(r => r.slice()) });
  }
}

/** The block a legend entry names, or null if it names an ordinary tile. */
export function blockRef(tileName) {
  if (typeof tileName !== 'string' || !tileName.startsWith('block:')) return null;
  return BLOCKS.get(tileName.slice(6)) || null;
}

const EMPTY = {
  name: '__missing', pal: 'stone', flags: 0, mask: 0, tide: null,
  anim: null, animRate: 10, over: false, push: null, ledge: null, depth: 0,
};

const warned = new Set();

export function getTileDef(name) {
  const d = TILES.get(name);
  if (!d) {
    if (!warned.has(name)) { warned.add(name); console.warn('[tiles] undefined tile:', name); }
    return EMPTY;
  }
  return d;
}

/** Resolve a possibly-virtual tile name to its concrete tile at a tide level. */
export function resolveTile(name, tide) {
  const d = getTileDef(name);
  if (!d.tide) return d;
  const target = d.tide[Math.max(0, Math.min(2, tide))] ?? d.tide[d.tide.length - 1];
  const r = getTileDef(target);
  // One level of indirection only; a nested tide tile is a data bug.
  return r.tide ? getTileDef(r.tide[Math.max(0, Math.min(2, tide))]) : r;
}

/**
 * Whether a resolved tile definition blocks a mover with the given
 * capabilities — the same rule `Room.solidAt` applies at a pixel, pulled out
 * here so anything that already has a concrete `TileDef` (rather than a pixel
 * to sample) can ask the identical question instead of re-deriving it from
 * raw flags. `Room.solidAt` calls this; nothing should define its own copy.
 *
 * `quadSolid` is the SOLID flag's own verdict for the quadrant being asked
 * about — `Room.solidAt` passes the correct one for a pixel's sub-tile
 * position; a caller with no pixel (a tile-granularity checker) passes
 * `d.mask !== 0`, which is exactly right for every tile in this game today,
 * since no tile uses a mask other than 0 (a doorway cut into a SOLID tile) or
 * 15 (uniformly solid) — see docs/ART-DIRECTION.md and CLAUDE.md.
 */
export function tileDefSolid(d, caps, quadSolid) {
  const f = d.flags;
  if (f & F.VOID) return true;
  if (f & F.SOLID) return quadSolid;
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

/** The art name to draw for a tile at a given tide + frame counter. */
export function tileArt(def, frame) {
  if (def.anim && def.anim.length) {
    const i = Math.floor(frame / def.animRate) % def.anim.length;
    return def.anim[i];
  }
  return def.name;
}


/**
 * Which art to draw for a tile at (tx, ty) in a room, when the tile declares
 * interchangeable ground variants.
 *
 * A PURE HASH OF THE TILE'S ADDRESS, never a draw from an RNG stream. This is
 * `T2` exactly: `Room.render` runs at display rate, so a variant drawn from a
 * stream would desync every replay AND make the ground flicker as the cache
 * rebuilt. `every(e, n)` is the existing precedent for hashing instead.
 *
 * The room key is part of the hash so the same coordinates in two rooms do not
 * pick the same variant, which would put an identical pattern of tufts in the
 * same place on every screen — a subtler grid than the one this replaces.
 *
 * A SCATTER, NOT A MIX, and this is the part that was measured rather than
 * assumed. Picking evenly among a base and three variants does not remove the
 * grid; it replaces it with a patchwork quilt, and a quilt is WORSE, because
 * `rip-terrain.py` quantises each tile against its own four colours, so two
 * tiles that look alike on the sheet can land on different palette indices and
 * their shared edge becomes a hard tonal seam. Rendered as a full 10x8 room,
 * an even four-way mix of good candidates read as a chessboard. One variant in
 * seven read as a meadow. So: most cells are the base, and the variants are
 * occasional detail — which is also what the source games do, except that
 * there a person places each tuft by hand.
 *
 * Two independent hashes, not one divided: the gate decides WHETHER this cell
 * is a variant and the pick decides WHICH, and deriving the second from the
 * quotient of the first correlates them.
 */
export function tileVariant(def, roomKey, tx, ty) {
  const v = def.variants;
  if (!v || !v.length) return def.name;
  if (hash32('tilevar', roomKey, tx, ty) % def.variantOdds !== 0) return def.name;
  return v[hash32('tilepick', roomKey, tx, ty) % v.length];
}

/**
 * Which art to draw for a tile whose look depends on its neighbours.
 *
 * `neighbourFamily(dir)` is supplied by the caller — `Room` owns the grid, and
 * a checker may never re-derive a rule the engine already owns (`R4`).
 *
 * OUT OF BOUNDS COUNTS AS THE SAME MASS, and this is the decision that makes
 * the feature usable rather than a disaster. A cliff running along the top row
 * of a screen continues into the screen above it in every source game, and the
 * room has no way to see that room's grid — so treating "off the edge" as a
 * different family would draw a lip along the top of every screen in the game,
 * on cliff that visibly carries on. The caller returns the tile's own family
 * for a neighbour it cannot see.
 *
 * Only ONE edge wins, in the order the directions are listed. A cliff cell that
 * is both the top of its mass and the left of it draws the top lip: this game
 * has no corner pieces (see docs/ART-BACKLOG.md) and picking two edges would
 * need one.
 */
export function tileEdgeArt(def, neighbourFamily) {
  const e = def.edgeArt;
  if (!e || !def.family) return null;
  for (const dir of EDGE_DIRS) {
    const art = e[dir];
    if (art && neighbourFamily(dir) !== def.family) return art;
  }
  return null;
}

const EDGE_DIRS = ['up', 'down', 'left', 'right'];

/** True if any tile in the set changes appearance with the tide. */
export function isTideSensitive(name) {
  return !!getTileDef(name).tide;
}

/** Data-integrity check; run once at boot and surfaced in the dev overlay. */
export function validateTiles() {
  const problems = [];
  for (const [name, d] of TILES) {
    if (d.tide) {
      if (d.tide.length !== 3) problems.push(`${name}: tide must have exactly 3 entries`);
      for (const t of d.tide) {
        if (!TILES.has(t)) { problems.push(`${name}: tide variant '${t}' is not registered`); continue; }
        if (TILES.get(t).tide) problems.push(`${name}: tide variant '${t}' is itself a tide tile (nesting not allowed)`);
      }
      if (d.art) problems.push(`${name}: tide tiles must not define art`);
      if (d.variants) problems.push(`${name}: tide tiles must not declare variants`);
    } else if (!d.art && !d.anim) {
      problems.push(`${name}: concrete tile has neither art nor anim`);
    }
    if (d.anim) {
      for (const a of d.anim) {
        if (!TILES.has(a) && !ANIM_ART.has(a)) problems.push(`${name}: anim frame '${a}' has no art`);
      }
    }
    // GROUND VARIANTS ARE A DRAW-TIME SUBSTITUTION AND NOTHING ELSE. A variant
    // whose flags differed from its base would make a patch of a field solid,
    // or wet, or a pit, in a pattern nobody authored and no room grid shows —
    // a bug that would render perfectly and be nearly impossible to find from
    // the symptom. So the invariant is asserted here rather than trusted.
    if (d.edgeArt) {
      if (!d.family) problems.push(`${name}: edgeArt needs a family to compare against`);
      for (const [dir, art] of Object.entries(d.edgeArt)) {
        if (!EDGE_DIRS.includes(dir)) problems.push(`${name}: edgeArt direction '${dir}' is not up/down/left/right`);
        if (!TILES.has(art) && !ANIM_ART.has(art)) problems.push(`${name}: edgeArt '${art}' has no art`);
      }
    }
    if (d.variants) {
      if (d.anim) problems.push(`${name}: animated tiles cannot have variants`);
      if (!(d.variantOdds >= 1)) problems.push(`${name}: variantOdds must be >= 1`);
      for (const v of d.variants) {
        const t = TILES.get(v);
        if (!t) { problems.push(`${name}: variant '${v}' is not a registered tile`); continue; }
        if (t.variants) problems.push(`${name}: variant '${v}' declares variants of its own (no nesting)`);
        if (t.flags !== d.flags) problems.push(`${name}: variant '${v}' has different flags`);
        if (t.mask !== d.mask) problems.push(`${name}: variant '${v}' has a different solid mask`);
        if (t.anim) problems.push(`${name}: variant '${v}' is animated`);
        if (t.over !== d.over) problems.push(`${name}: variant '${v}' disagrees about 'over'`);
      }
    }
  }
  return problems;
}

// Animation frames may be pure art (registered on the tiles Sheet) without being
// full tile definitions; data files declare them here.
export const ANIM_ART = new Set();
export function declareAnimArt(names) { for (const n of names) ANIM_ART.add(n); }

// --------------------------------------------------------------------------
// Tile transforms: what a tile becomes when acted upon.
//
//   registerTransforms({
//     bush:         { cut: 'grass', bomb: 'grass', fire: 'grass', fx: 'cut' },
//     dWallCracked: { bomb: 'dFloor', fx: 'boom' },
//     torchUnlit:   { fire: 'torchLit', quiet: true },
//   });
//
// Actions: 'cut' (sword), 'bomb', 'fire' (flame), 'lift' (bare hands, base
// moveset), 'dredge' (the Dredge Line), 'ring' (the Resonance Rod).
// `fx` names an effect to spawn, `drop` a drop table to roll, `flagged` a save
// flag so the change persists.
//
// `level` is the minimum item level the action must carry. It is what lets a
// gate name a SPECIFIC item rather than a category: the Salt Pans vane wants
// `ring`, so only the Resonance Rod opens the region. Without a named action
// on the transform, every "needs item X" gate
// degrades to "needs anything in X's family".
// --------------------------------------------------------------------------

export const TRANSFORMS = new Map();

export function registerTransforms(defs) {
  for (const [tile, rules] of Object.entries(defs)) {
    TRANSFORMS.set(tile, { ...(TRANSFORMS.get(tile) || {}), ...rules });
  }
}

export function transformFor(tileName, action) {
  const r = TRANSFORMS.get(tileName);
  if (!r) return null;
  const to = r[action];
  if (to === undefined) return null;
  return {
    to, fx: r.fx || null, drop: r.drop || null, sfx: r.sfx || null,
    persist: !!r.persist, level: r.level || 0, deny: r.deny || null,
  };
}
