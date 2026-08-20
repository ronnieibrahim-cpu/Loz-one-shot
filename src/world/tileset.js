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
