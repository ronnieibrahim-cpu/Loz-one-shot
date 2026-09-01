// The one place a checker asks "can something stand here" — by calling the
// engine's own Room.solidAt, never by re-deriving the formula from raw tile
// flags. See CLAUDE.md, Hard rules: a checker may never define its own
// collision, passability or push logic; it calls the engine's.
//
// Importable from plain Node (check-overworld.mjs, find-crossings.mjs import
// it directly) and from inside a live page via
// `await import('/tools/lib/collision.mjs')` — every tool that boots the game
// in headless Chromium serves the whole repo statically from its root, so
// this resolves the same way `/src/...` does inside `page.evaluate`.
//
// This module invents no rules of its own. It composes the engine's own
// functions with an explicit `avoid` flag mask, the same way `canOccupy`
// (src/game/entity.js) already composes `Room.solidAt` with an enemy's
// `avoidFlags` — that is the sanctioned way to make a checker more
// restrictive than raw collision without forking the collision rule itself.

import { TILE } from '../../src/core/screen.js';
import { F, tileDefSolid, resolveTile, transformFor } from '../../src/world/tileset.js';

export { F };

/**
 * Whether the tile at (tx, ty) is solid under the engine's own rule, asked at
 * the tile's centre pixel — the same question `canOccupy` asks of a whole
 * hitbox (src/game/entity.js), reduced to one point for tools that reason
 * tile-by-tile rather than pixel-by-pixel. `caps` is the same shape
 * `Room.solidAt` already takes: `{ jumping, swim, cutting }`.
 */
export function tileSolid(room, tx, ty, tide, caps) {
  return room.solidAt(tx * TILE + 8, ty * TILE + 8, tide, caps);
}

/**
 * Whether a route-planner may step onto (tx, ty): not solid, AND not carrying
 * any flag in `avoid`. `avoid` exists for exactly the reason `canOccupy`'s own
 * `avoid` parameter exists — F.PIT and F.HAZARD are not solid (the engine
 * lets the player walk into them, then punishes them for it), so a
 * connectivity flood that wants to treat "walkable but harmful" as a wall has
 * to say so explicitly, via this parameter, rather than folding it into a
 * private solidity formula.
 */
export function tileWalkable(room, tx, ty, tide, caps, avoid = 0) {
  if (tileSolid(room, tx, ty, tide, caps)) return false;
  if (avoid && (room.flagsAt(tx, ty, tide) & avoid)) return false;
  return true;
}

/**
 * The flags a connectivity flood should additionally treat as "don't route
 * through this", on top of hard collision — falling in a pit or standing in a
 * hazard is not blocked by the engine, but it is not a route either.
 */
export const ROUTE_AVOID = F.PIT | F.HAZARD;

/**
 * The `caps` shape for one of the game's named traversal modes, so a checker
 * that reasons in terms of "on foot" / "swimming the surface" / "sunk to the
 * seafloor" (the Kelp-Soled Cleats' own two modes) can ask for it by name
 * instead of writing out a capability object at every call site.
 *   'foot'  no items: deep water is a wall
 *   'swim'  the surface: deep water is floor, currents apply (the caller's own
 *           concern, not this function's — this only says the tile can be
 *           occupied)
 *   'sink'  the seafloor: deep water is floor, nothing pushes you
 */
export function capsForMode(mode) {
  return { jumping: false, swim: mode !== 'foot', cutting: false };
}

/**
 * Whether an already-resolved tile definition (from `resolveTile`/`getRoom`'s
 * own `room.tile(...)`) blocks a mover with `caps` — the engine's own
 * `tileDefSolid` (src/world/tileset.js), which `Room.solidAt` itself calls,
 * for a checker that has a `TileDef` in hand rather than a pixel to sample.
 * Every tile in this game today carries `mask` 0 or 15 (see CLAUDE.md), so
 * "solid at all" is exactly `d.mask !== 0` — there is no quadrant a
 * tile-granularity checker could ask about that a pixel-sampling one could
 * not already answer identically.
 */
export function defSolid(d, caps) {
  if (!d) return true;
  return tileDefSolid(d, caps, d.mask !== 0);
}

/** As `tileWalkable`, but for a resolved `TileDef` rather than a room tile. */
export function defWalkable(d, caps, avoid = 0) {
  if (defSolid(d, caps)) return false;
  if (avoid && d && (d.flags & avoid)) return false;
  return true;
}


/**
 * Every capability set a player can actually be in, for a checker that has to
 * ask "is this crossable by ANYONE, ever" rather than "can you walk here now".
 *
 * This list is the thing the project's own trap note is about: *a checker's
 * flood only knows the movement verbs somebody taught it*, and
 * `walk-dungeons.mjs` treated a one-way ledge as a wall for the life of the
 * project because nobody had taught it that verb. `check-wide-rooms.mjs` was
 * written with only the first entry here and immediately reported two hand-
 * authored rooms as broken: the Kelp Locks' seam is a torrent you cross with
 * the Cleats, and the Shrine Ford's is a snarl you cut and then swim.
 *
 * If you give the player a new way to move, add it here in the same commit.
 */
export const ALL_CAPS = [undefined, { swim: true }, { jumping: true }, { cutting: true },
                         { swim: true, jumping: true }];

/**
 * Can a mover EVER get onto this tile — under any capability set above, or
 * after the tile has been transformed by something the player can do to it
 * (cutting a snarl, bombing a crack)?
 *
 * Transforms are read from the engine's own `transformFor` table and the
 * result re-resolved through `resolveTile`, so this never guesses what a tile
 * becomes. It answers "is this passable in principle", which is the right
 * question for a structural checker and the wrong one for a route planner —
 * a route planner must keep asking `tileWalkable` with the caps actually held.
 */
export function everPassable(room, tx, ty, tide) {
  const d = room.tile(tx, ty, tide);
  for (const caps of ALL_CAPS) if (!defSolid(d, caps)) return true;
  for (const action of ['cut', 'bomb', 'fire', 'dredge', 'ring', 'seed', 'lift']) {
    const t = transformFor(d.name, action);
    if (!t || !t.to) continue;
    const after = resolveTile(t.to, tide);
    for (const caps of ALL_CAPS) if (!defSolid(after, caps)) return true;
  }
  return false;
}
