// SIDE-VIEW PASSAGES (S241, docs/briefs/SIDE-VIEW.md): Link's movement in a
// room that declares `side: true`, read from the cartridges' own
// link.s (oracles-disasm, object_code/common/specialObjects/):
//
//   linkState01_sidescroll       on the ground he moves left and right only;
//                                 in water he swims; leaving the water at the
//                                 top he hops (SV_HOP)
//   linkUpdateInAir_sidescroll    off the ground and off a ladder he falls,
//                                 gaining SV_GRAVITY a frame to SV_FALL_MAX;
//                                 pressing UP over a ladder catches it
//   a ladder ($18) is climbed in all four directions and nothing falls on one;
//   a ladder's top ($19) is also stood on, and Link's middle never rises above
//   y&15 = 9 standing on one (the cap after linkUpdateMovement)
//
// Our addition is the tide: the waterline is ordinary tide tiles (the side
// legends' digits), so the conch and the Anchor move it. Without the Cleats
// water is drowned in, as Ages' side view without flippers is
// (linkUpdateSwimming_sidescroll @drown): Link is washed back to the last
// place he stood. With them he swims; floor mode sinks him to the bed.
//
// Collision is the engine's own: `moveEntity` / `canOccupy` against the
// room's tiles, with Link's side-view box. Nothing here decides what is solid.

import { F } from '../world/tileset.js';
import { TILE } from '../core/screen.js';
import { moveEntity, canOccupy } from './entity.js';
import {
  WALK_SPEED, SWIM_SPEED, SINK_SPEED, SV_GRAVITY, SV_FALL_MAX, SV_HOP,
} from '../data/feel.js';

/** Link's box in side view, from his sprite's top-left: the cartridge's
 *  calculateAdjacentWallsBitset @sidescrollOffsets test points, -3..+7 down
 *  and -5..+4 across his middle (his middle being 8,8 of the sprite), so his
 *  head counts as well as his feet. */
export const SIDE_HB = { x: 3, y: 5, w: 10, h: 11 };
/** Standing on a ladder's top his middle is at 9 in the tile above it, which
 *  puts the bottom of SIDE_HB on the ladder top's top edge. */
const LADDER_TOP_STAND = 9;

export function isSideRoom(game) {
  return !!(game.room && game.room.def && game.room.def.side);
}

function tileAtPx(game, px, py) {
  return game.room.tile(Math.floor(px / TILE), Math.floor(py / TILE), game.tide);
}

/** The tile at Link's middle, the cartridge's wActiveTile. */
function activeTile(game, p) { return tileAtPx(game, p.x + 8, p.y + 8); }
/** The tile 8 px under his middle, the cartridge's wLastActiveTileType. */
function underTile(game, p) { return tileAtPx(game, p.x + 8, p.y + 16); }

const isLadder = d => d.sv === 'ladder' || d.sv === 'ladderTop';

/** Is he standing: something solid, or a ladder's top, right under his box? */
export function sideGrounded(game, p, climbing = false) {
  const r = p.hb;
  const y = p.y + r.y + r.h;              // the first row of pixels under him
  for (const x of [p.x + r.x, p.x + r.x + r.w - 1]) {
    const d = tileAtPx(game, x, y);
    if (d.flags & (F.SOLID | F.VOID)) return true;
  }
  if (!climbing) {
    const d = tileAtPx(game, p.x + 8, y);
    if (d.sv === 'ladderTop' && (y % TILE) === 0) return true;
  }
  return false;
}

/** One frame of Link in a side-view room. Called from Player.update in place
 *  of the top-down terrain, movement, jump and hazard steps. */
export function updateSideView(p, game) {
  const inp = game.input;
  const dx = (inp.down('right') ? 1 : 0) - (inp.down('left') ? 1 : 0);
  const dyIn = (inp.down('down') ? 1 : 0) - (inp.down('up') ? 1 : 0);
  if (dx) p.dir = dx < 0 ? 'left' : 'right';

  const here = activeTile(game, p);
  const wet = !!(here.flags & F.DEEP);
  const wasWet = p.inDeep;
  p.inShallow = false;

  // ------------------------------------------------------------- water
  if (wet) {
    if (!wasWet) {
      game.audio.sfx('splash');
      game.spawnEffect('splash', p.x, p.y + 2);
      p.svFall = 0;
    }
    p.inDeep = true;
    if (p._cleats <= 0) { p.beginWash(game); return; }
    if (!wasWet && p.cleatMode === 'sink' && !p.underwater) p.underwater = true;
    if (p.underwater) {
      // FLOOR MODE: weighted, he walks the bed and climbs nothing.
      p.svFall = Math.min(SV_FALL_MAX >> 2, (p.svFall || 0) + SV_GRAVITY);
      const res = move(game, p, dx * SINK_SPEED, p.svFall);
      if (res.hitY) p.svFall = 0;
      p._lastDx = dx; p._lastDy = 0;
      if (dx) p.animT++;
      return;
    }
    // UP on a ladder through the surface climbs out of the water, with no
    // hop (@notInWater skips it for an underwater ladder).
    if (here.sv === 'ladder' && dyIn < 0) {
      p.svFall = 0; p.svClimb = true; p.dir = 'up';
      move(game, p, 0, -WALK_SPEED);
      p._lastDx = 0; p._lastDy = dyIn; p.animT++;
      return;
    }
    // Swimming: every direction, facing left or right
    // (linkUpdateSwimming_sidescroll @swimmingState2).
    p.svFall = 0; p.svClimb = false;
    move(game, p, dx * SWIM_SPEED, dyIn * SWIM_SPEED);
    p._lastDx = dx; p._lastDy = dyIn;
    p.animT++;
    return;
  }

  // ------------------------------------------------- out of the water
  if (wasWet) {
    p.inDeep = false;
    p.underwater = false;
    game.spawnEffect('splash', p.x, p.y + 2);
    game.audio.sfx('splash', { pitch: 1.2, vol: 0.8 });
    // The hop out (@notInWater), unless he climbed out up a ladder.
    if (!isLadder(underTile(game, p)) && !isLadder(here)) p.svFall = -SV_HOP;
  }

  const onLadder = isLadder(here) || isLadder(underTile(game, p));
  if (onLadder && (dyIn || p.svClimb) && !(p.svFall < 0)) {
    // CLIMBING: four ways at the walking pace, and nothing falls.
    p.svClimb = true;
    p.svFall = 0;
    const res = move(game, p, dx * WALK_SPEED, dyIn * WALK_SPEED);
    // Off the top of the ladder: stand on its top.
    const now = activeTile(game, p);
    if (!isLadder(now) && underTile(game, p).sv === 'ladderTop') {
      const row = Math.floor((p.y + 16) / TILE);
      p.y = Math.min(p.y, row * TILE - 16 + (LADDER_TOP_STAND - 8));
      p.svClimb = false;
    }
    // Off the foot of it onto ground: walking again.
    if (dyIn > 0 && res.hitY) p.svClimb = false;
    if (!isLadder(now) && !isLadder(underTile(game, p))) p.svClimb = false;
    if (dyIn) p.dir = 'up';
    p._lastDx = dx; p._lastDy = dyIn;
    if (dx || dyIn) p.animT++;
    return;
  }
  p.svClimb = false;

  // Standing on a ladder's top, DOWN climbs down it.
  if (dyIn > 0 && sideGrounded(game, p) && tileAtPx(game, p.x + 8, p.y + 16).sv === 'ladderTop') {
    p.svClimb = true;
    move(game, p, 0, WALK_SPEED);
    p.dir = 'up';
    return;
  }

  // ------------------------------------------------------- walking / air
  if (dx) move(game, p, dx * WALK_SPEED, 0);
  p._lastDx = dx; p._lastDy = 0;
  if (dx) p.animT++;

  if (sideGrounded(game, p) && !(p.svFall < 0)) {
    p.svFall = 0;
    rememberSafe(game, p);
  } else {
    // UP over a ladder catches it (@positiveSpeedZ).
    if (dyIn < 0 && isLadder(activeTile(game, p)) && p.svFall >= 0) { p.svClimb = true; p.svFall = 0; return; }
    p.svFall = Math.min(SV_FALL_MAX, (p.svFall || 0) + SV_GRAVITY);
    fall(game, p);
  }

  // Off the bottom of the room: Seasons' hole tile is a death line
  // (TILETYPE_SS_HOLE, respawnLink with SND_DAMAGE_LINK).
  if (p.y + 8 >= game.room.ph) { p.beginWash(game); return; }

  // Spikes where he stands (dealSpikeDamageToLink).
  if ((activeTile(game, p).flags & F.HAZARD) && p.invuln <= 0) {
    p.takeDamage(game, 2, null, { noKnockDir: true });
  }
}

/** Apply this frame's fall, landing on solid ground or a ladder's top. */
function fall(game, p) {
  const v = p.svFall;
  if (v <= 0) {
    const res = move(game, p, 0, v);
    if (res.hitY) p.svFall = 0;           // the ceiling (@applyGravity)
    return;
  }
  // Down, a pixel at a time so a ladder's top (not solid) can catch him.
  let left = v;
  while (left > 0) {
    const step = Math.min(256, left);
    const before = p.y;
    const res = move(game, p, 0, step);
    left -= step;
    if (res.hitY) { p.svFall = 0; return; }
    const feet = p.y + p.hb.y + p.hb.h;
    const crossed = Math.floor((before + p.hb.y + p.hb.h - 1) / TILE) !== Math.floor((feet - 1) / TILE);
    if (crossed && (feet % TILE) <= 2 && tileAtPx(game, p.x + 8, feet).sv === 'ladderTop') {
      const row = Math.floor(feet / TILE);
      p.y = row * TILE - p.hb.y - p.hb.h;
      p.svFall = 0;
      return;
    }
  }
}

/** The engine's mover, with water never in the way: in side view he falls
 *  or walks INTO water and the water decides (drowned without the Cleats),
 *  where top-down a non-swimmer is stopped at the bank. */
function move(game, p, dx, dy) {
  return moveEntity(game, p, dx, dy, { ...p.caps, swim: true });
}

/** Is the tile at his middle water at this sea? */
export function sideWet(game, p) { return !!(activeTile(game, p).flags & F.DEEP); }

/** Put him on a ladder as climbing if he is on one (arriving, or washed back
 *  to the ladder he came in on), so he holds there and does not fall. */
export function settleSideView(game, p) {
  const on = isLadder(activeTile(game, p)) || isLadder(underTile(game, p));
  p.svClimb = on && !sideGrounded(game, p, true);
  if (p.svClimb) p.dir = 'up';
}

/** Into a side-view room (Game.enterMap, S242): where he arrives is where the
 *  passage washes him back to, and on the ladder he is climbing. */
export function arriveSideView(game, p) {
  if (!isSideRoom(game)) { p.svEntry = null; p.svClimb = false; p.svFall = 0; return; }
  p.svEntry = { x: p.x, y: p.y };
  p.hb = SIDE_HB;
  p.svFall = 0; p.inDeep = false; p.underwater = false;
  settleSideView(game, p);
}

function rememberSafe(game, p) {
  if (canOccupy(game, p, p.x, p.y)) { p.lastSafe.x = p.x; p.lastSafe.y = p.y; }
}
