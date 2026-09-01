// The camera behaves at every room size in the game.
//
// WHY THIS EXISTS. Multi-screen rooms shipped to `main` without their checkers
// (`A9`): `check-camera.mjs` was written on a branch and never merged, and that
// branch is now ~90 commits behind, so this is a rewrite from scratch against
// the current engine rather than a port of code nobody can read (`T56`).
//
// It drives the REAL `Camera` (`src/game/camera.js`) against the REAL rooms of
// the real maps. It does not model the deadzone, it does not recompute where
// the camera ought to be; it calls `snap` and `update` and checks the promises
// those two make. Same rule as a collision checker calling `solidAt` (`R4`): a
// private copy of the rule does not fail when the real rule moves.
//
// The promises, all of which are load-bearing somewhere:
//
//   1. In a room no bigger than the view, the camera is PINNED at 0,0 — a
//      genuine no-op. Almost every room in the game is this size, including
//      all six boss rooms, so a camera that drifted even a pixel here would
//      shake the entire game. (This is also the fact that killed the idea of a
//      cutscene pan step — see `T81`.)
//   2. Neither `snap` nor `update` ever puts the camera outside the room.
//      Outside means drawing the void beyond the room's edge.
//   3. `update` moves at most CAM_MAX_SPEED pixels per axis per frame. A
//      camera that could jump is a camera that can teleport the view mid-walk.
//   4. Both always produce whole pixels. A fractional camera resamples every
//      tile in the room and turns the whole screen soft (`R2` in spirit).
//   5. In a room bigger than the view the follower actually FOLLOWS: walk from
//      one end to the other and the camera ends clamped at the far edge.
//   6. A player moving inside the deadzone does not move the camera. That is
//      what the deadzone is; without this the camera is just a centring rule.
//
// Usage: node tools/check-camera.mjs [--verbose]

import { installData } from '../src/data/index.js';
import { MAPS, getRoom } from '../src/world/maps.js';
import { Camera } from '../src/game/camera.js';
import { VIEW_W, VIEW_H } from '../src/core/screen.js';
import { CAM_DEADZONE_W, CAM_DEADZONE_H, CAM_MAX_SPEED } from '../src/data/feel.js';

const VERBOSE = process.argv.includes('--verbose');
installData();

const problems = [];
let checked = 0, wide = 0, oneScreen = 0;

/** The only thing Camera reads off a player. */
const at = (cx, cy) => ({ cx, cy });

function isInt(v) { return Number.isInteger(v); }

for (const m of MAPS.values()) {
  for (const key of Object.keys(m.roomDefs || {})) {
    const [f, x, y] = key.split(',').map(Number);
    const room = getRoom(m.id, f, x, y);
    if (!room) continue;
    checked++;
    const where = `${m.id}/${key}`;
    // The limits come from the ROOM's geometry, not from the camera's own
    // maxX/maxY — and then the camera's answer is checked AGAINST them. Asking
    // the camera for its own limits and then judging it by them is circular:
    // a first cut of this did exactly that, and a deliberately broken maxX
    // (returning 8 instead of 0 for a one-screen room) passed cleanly, because
    // "is this room pinned" was being answered by the very function under test.
    const mx = Math.max(0, room.pw - VIEW_W), my = Math.max(0, room.ph - VIEW_H);
    const pinned = mx === 0 && my === 0;
    if (pinned) oneScreen++; else wide++;
    const cam = new Camera();
    if (cam.maxX(room) !== mx || cam.maxY(room) !== my) {
      problems.push(`${where}: room is ${room.pw}x${room.ph} in a ${VIEW_W}x${VIEW_H} view, so the ` +
        `camera's limits should be ${mx},${my} — it says ${cam.maxX(room)},${cam.maxY(room)}`);
    }

    // A spread of positions including well outside the room, because a
    // transition legitimately puts the player at negative coordinates.
    const probes = [
      [0, 0], [room.pw, room.ph], [room.pw / 2, room.ph / 2],
      [-40, -40], [room.pw + 40, room.ph + 40], [8, room.ph - 8], [room.pw - 8, 8],
    ];

    for (const [px, py] of probes) {
      // --- snap ---
      const c = new Camera().snap(room, at(px, py));
      if (c.x < 0 || c.x > mx || c.y < 0 || c.y > my) {
        problems.push(`${where}: snap at (${px},${py}) put the camera at ${c.x},${c.y}, ` +
          `outside 0..${mx} x 0..${my}`);
      }
      if (!isInt(c.x) || !isInt(c.y)) {
        problems.push(`${where}: snap at (${px},${py}) produced a fractional camera ${c.x},${c.y}`);
      }
      if (pinned && (c.x !== 0 || c.y !== 0)) {
        problems.push(`${where}: room is one screen but snap moved the camera to ${c.x},${c.y} — ` +
          `it must be pinned at 0,0`);
      }

      // --- update, from a cold camera and from a displaced one ---
      for (const start of [[0, 0], [mx, my], [Math.round(mx / 2), Math.round(my / 2)]]) {
        const u = new Camera();
        u.x = start[0]; u.y = start[1];
        const bx = u.x, by = u.y;
        u.update(room, at(px, py));
        if (u.x < 0 || u.x > mx || u.y < 0 || u.y > my) {
          problems.push(`${where}: update from ${bx},${by} toward (${px},${py}) left the room ` +
            `at ${u.x},${u.y} (limits ${mx},${my})`);
        }
        if (!isInt(u.x) || !isInt(u.y)) {
          problems.push(`${where}: update produced a fractional camera ${u.x},${u.y}`);
        }
        if (Math.abs(u.x - bx) > CAM_MAX_SPEED || Math.abs(u.y - by) > CAM_MAX_SPEED) {
          problems.push(`${where}: update moved ${Math.abs(u.x - bx)},${Math.abs(u.y - by)} px in ` +
            `one frame, over CAM_MAX_SPEED (${CAM_MAX_SPEED})`);
        }
        if (pinned && (u.x !== 0 || u.y !== 0)) {
          problems.push(`${where}: room is one screen but update moved the camera to ${u.x},${u.y}`);
        }
      }
    }

    // --- the deadzone is a deadzone -----------------------------------------
    // A player nudged around the middle of the view must not move the camera.
    {
      const u = new Camera();
      u.x = Math.min(mx, 8); u.y = Math.min(my, 8);
      const bx = u.x, by = u.y;
      // Dead centre of the view, then a step that stays inside the deadzone.
      const cx = u.x + VIEW_W / 2, cy = u.y + VIEW_H / 2;
      for (const [dx, dy] of [[0, 0], [CAM_DEADZONE_W / 2 - 2, 0], [0, CAM_DEADZONE_H / 2 - 2],
                              [-(CAM_DEADZONE_W / 2 - 2), 0], [0, -(CAM_DEADZONE_H / 2 - 2)]]) {
        u.update(room, at(cx + dx, cy + dy));
      }
      if (u.x !== bx || u.y !== by) {
        problems.push(`${where}: the camera moved (${bx},${by} -> ${u.x},${u.y}) for a player that ` +
          `never left the deadzone`);
      }
    }

    // --- in a big room the follower actually follows -------------------------
    if (!pinned) {
      const u = new Camera().snap(room, at(8, 8));
      // Walk to the far corner, a pixel at a time, and let the camera chase.
      for (let i = 0; i < room.pw + room.ph + 600; i++) {
        u.update(room, at(room.pw - 8, room.ph - 8));
      }
      if (u.x !== mx || u.y !== my) {
        problems.push(`${where}: room is ${room.pw}x${room.ph} but after walking to the far corner ` +
          `the camera stopped at ${u.x},${u.y} instead of ${mx},${my} — the follower does not follow`);
      }
      if (VERBOSE) console.log(`  wide ${where} ${room.pw}x${room.ph} maxes ${mx},${my}`);
    }
  }
}

console.log(`check-camera: ${checked} rooms (${oneScreen} one-screen, ${wide} bigger than the view)`);
if (!wide) {
  problems.push('no room in the game is bigger than the view, so promises 3 and 5 were never ' +
    'exercised — either a multi-screen room was lost, or this tool is checking nothing');
}
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems.slice(0, 40)) console.error('  ' + p);
  if (problems.length > 40) console.error(`  ... and ${problems.length - 40} more`);
  process.exit(1);
}
console.log('check-camera: OK — pinned in one-screen rooms, inside the room and whole-pixel ' +
  'everywhere, and it follows in the rooms that are bigger');
