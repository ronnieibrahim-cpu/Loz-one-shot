// LOCAL TIDE OVERRIDES — and the one place P5 has to touch.
//
// ---------------------------------------------------------------------------
// READ THIS BEFORE MERGING P5.
//
// P5 ("the tide becomes a field") turns `game.tide.level` into
// `tide.levelAt(tx, ty)`: a base level plus a list of active local overrides,
// registered by the Tidewright's Anchor. That work is being done in a parallel
// session and is NOT in this file. Nothing here is a second implementation of
// it and nothing here should be merged with it.
//
// This file exists because ONE item in the P6 roster — the Squall Bellows —
// holds the tide back a level inside a cone, which is a local override and
// cannot be expressed against a scalar. Rather than refactor the sixty
// `tide.level` call sites out from under P5, the Bellows registers its cone in
// `game.tideHolds` and everything that needs a level AT A PLACE asks
// `tideLevelAt`. There are five such call sites and they are listed below.
//
// WHEN P5 LANDS:
//
//   1. Delete `tideLevelAt`'s body and forward to `game.tide.levelAt(tx, ty)`.
//      The Bellows' cone becomes an ordinary entry in P5's override list — it
//      is the same shape: a region, a level, and a lifetime.
//   2. Keep `Game.tideAt`. It is the indirection that made this a one-function
//      change instead of a sixty-call-site one, and the Anchor wants it too.
//   3. Do NOT keep both override lists. `game.tideHolds` is a stand-in for
//      P5's list, not a companion to it.
//
// The call sites that are spatial today, all of which route through
// `Game.tideAt`:
//
//   src/game/entity.js  canOccupy       — can this entity stand here
//   src/game/entity.js  canOccupy       — the `avoid` flag test
//   src/game/entity.js  groundFlags     — what is under this entity
//   src/game/entity.js  findSafeTile    — where a tide change puts you
//   src/game/player.js  tileDefAt       — the ledge-hop probe
//   src/game/player.js  updateTerrain   — the current under a swimmer
//
// Everything else in the game still reads `tide.level` and is correct to: the
// music, the HUD, the save, the sweep, and every boss that pins the tide are
// all asking about the BASE level, which is exactly what P5 keeps `tide.level`
// for.
// ---------------------------------------------------------------------------

import { TIDE_COUNT } from './tide.js';

/**
 * The tide level at a tile, honouring any local overrides currently in force.
 *
 * `game.tideHolds` is a list of `{ shape, delta }`. A hold is created by the
 * item that owns it and removed by that item; nothing persists across a room
 * change, because a hold belongs to a thing standing in the room.
 */
export function tideLevelAt(game, tx, ty) {
  const base = game.tide.level;
  const holds = game.tideHolds;
  if (!holds || holds.length === 0) return base;
  let lv = base;
  for (const h of holds) {
    if (!h.covers(tx, ty)) continue;
    lv += h.delta;
  }
  return lv < 0 ? 0 : (lv >= TIDE_COUNT ? TIDE_COUNT - 1 : lv);
}

/** Is any part of the room currently overridden? Cheap test for the renderer. */
export function hasTideHolds(game) {
  return !!(game.tideHolds && game.tideHolds.length);
}

/**
 * A cone of held-back water in front of an entity, as the Squall Bellows makes.
 *
 * The cone is tested in TILE space rather than pixel space, deliberately: the
 * thing being decided is what a tile resolves to, and a cone whose edge fell
 * mid-tile would put half a tile of water against half a tile of sand and
 * neither the renderer nor the collision could agree on which.
 */
export class ConeHold {
  constructor(o) {
    this.ox = o.ox; this.oy = o.oy;        // origin, in tiles
    this.dx = o.dx; this.dy = o.dy;        // unit facing
    this.range = o.range;                  // tiles
    this.delta = o.delta != null ? o.delta : -1;
  }

  covers(tx, ty) {
    const rx = tx - this.ox, ry = ty - this.oy;
    // Distance along the facing axis, 1..range.
    const along = rx * this.dx + ry * this.dy;
    if (along < 0 || along > this.range) return false;
    // Half-width grows one tile every two tiles out, so the near end is a
    // single tile wide and the far end is a mouth you can aim at something.
    const across = Math.abs(rx * this.dy - ry * this.dx);
    return across <= Math.floor(along / 2);
  }
}
