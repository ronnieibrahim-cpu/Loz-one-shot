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
//   }
//
// TIDE VARIANTS
//   A tile with `tide` is a *virtual* tile: at runtime it resolves to one of three
//   concrete tiles depending on the global tide level (0 = low, 1 = mid, 2 = high).
//   Variant targets must be concrete (no nested `tide`); validate() enforces this.
//   This is how the whole world reshapes: authors place one char and the tide
//   system decides whether it is dry sand, wadeable shallows, or deep sea.

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
  HOOKABLE:  1 << 15,  // hookshot can latch
  BOMBABLE:  1 << 16,  // cracked wall
  DOOR:      1 << 17,  // dungeon door (state in room)
  SWITCHF:   1 << 18,  // floor switch
  CURRENT:   1 << 19,  // pushes the player while swimming (see `push`)
  WHIRL:     1 << 20,  // whirlpool: pulls in, warps
  VOID:      1 << 21,  // outside the map: solid and never rendered as floor
  SANDBAR:   1 << 22,  // marks tiles whose walkability depends on tide (for hints)
  TALLGRASS: 1 << 23,  // hides the player's feet, drops rupees when cut
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
      push: def.push || null,
      ledge: def.ledge || null,
      depth: def.depth || 0,
    });
  }
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

/** The art name to draw for a tile at a given tide + frame counter. */
export function tileArt(def, frame) {
  if (def.anim && def.anim.length) {
    const i = Math.floor(frame / def.animRate) % def.anim.length;
    return def.anim[i];
  }
  return def.name;
}

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
    } else if (!d.art && !d.anim) {
      problems.push(`${name}: concrete tile has neither art nor anim`);
    }
    if (d.anim) {
      for (const a of d.anim) {
        if (!TILES.has(a) && !ANIM_ART.has(a)) problems.push(`${name}: anim frame '${a}' has no art`);
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
// Actions: 'cut' (sword), 'bomb', 'fire' (ember seed / flame), 'lift' (bracelet),
// 'dig' (shovel), 'hook' (hookshot), 'magnet'.
// `fx` names an effect to spawn, `drop` a drop table to roll, `flagged` a save
// flag so the change persists.
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
  return { to, fx: r.fx || null, drop: r.drop || null, sfx: r.sfx || null, persist: !!r.persist };
}
