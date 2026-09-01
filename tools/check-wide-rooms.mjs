// A room that declares a size in screens is internally consistent.
//
// WHY THIS EXISTS. Multi-screen rooms shipped to `main` without their checkers
// (`A9`). `check-wide-rooms.mjs` was written on a branch and never merged, and
// that branch is ~90 commits behind, so this is a rewrite from scratch against
// the current engine rather than a port of code nobody can read (`T56`).
//
// It never re-derives collision: passability comes from `tools/lib/collision.mjs`,
// which composes the engine's own `Room.solidAt` (`R4`). It never re-derives
// room geometry either — sizes come from `normaliseSize` and cell ownership from
// the maps module's own occupancy index, so a change to either rule fails here
// instead of quietly disagreeing.
//
// What it proves, and the failure each one is guarding against:
//
//   1. THE GRID FILLS THE ROOM. `Room`'s constructor reads `row[x]` and falls
//      back to a space — which the legend turns into `void` — for anything the
//      authored text does not cover. A 2x1 room needs 20 columns and 8 rows; a
//      row one character short becomes a column of void down the seam, and a
//      missing row becomes a void band across the bottom. Both render as a hole
//      and neither throws.
//   2. NOTHING SPILLS OFF THE MAP. A room whose cells run past the map's own
//      w/h claims coordinates no neighbour lookup can reach.
//   3. NO TWO ROOMS CLAIM A CELL. Two rooms overlapping means one silently wins
//      the occupancy index and the other is unreachable from that cell.
//   4. EVERY COVERED CELL RESOLVES BACK TO THE ROOM. The engine keys a room by
//      its top-left cell and covers `sw x sh`; a cell that resolves elsewhere is
//      a room with a hole punched in it.
//   5. AN INTERNAL SEAM IS NOT A BOUNDARY. This is the whole point of a wide
//      room. `Game.checkRoomExit` deliberately measures against the ROOM's
//      extent and never looks for a seam, so if the tiles either side of a seam
//      cannot be crossed for its entire length the room is really two rooms that
//      a player can never get between — and every other checker in the table
//      says it is fine, because they flood a room as one object.
//
//      CROSSABLE BY SOME VERB, not on foot. The first cut of this asked
//      bare-foot solidity and immediately flagged two perfectly good rooms: the
//      Kelp Locks' seam is a torrent you cross with the Cleats, and the Shrine
//      Ford's is a snarl you cut and then swim. `everPassable` in the collision
//      shim carries the list of verbs — if you give the player a new way to
//      move, add it THERE, in the same commit.
//   6. THE OUTER EDGE IS WHERE THE EXITS ARE. For each cell on the room's
//      perimeter the neighbour beyond it must be somebody else's cell or
//      nothing at all — never one of this room's own. A room that neighbours
//      itself would walk you out of one screen and back into the same room.
//
// Usage: node tools/check-wide-rooms.mjs [--verbose]

import { installData } from '../src/data/index.js';
import { MAPS, getRoom, roomKeyAt } from '../src/world/maps.js';
import { normaliseSize } from '../src/world/room.js';
import { everPassable } from './lib/collision.mjs';
import { TIDE_COUNT } from '../src/game/tide.js';

const VERBOSE = process.argv.includes('--verbose');
installData();

const ROOM_W = 10, ROOM_H = 8;      // tiles per screen; Room derives tw/th from these
const problems = [];
let sized = 0, seamsChecked = 0;

for (const m of MAPS.values()) {
  // --- 3. cell ownership, across the whole map ------------------------------
  const claimed = new Map();        // "f,x,y" -> [roomKey, ...]
  for (const [key, def] of Object.entries(m.roomDefs || {})) {
    const [f, x, y] = key.split(',').map(Number);
    let sw = 1, sh = 1;
    try { [sw, sh] = normaliseSize(def.size, `${m.id}/${key}`); }
    catch (e) { problems.push(`${m.id}/${key}: ${e.message}`); continue; }
    for (let j = 0; j < sh; j++) {
      for (let i = 0; i < sw; i++) {
        const cell = `${f},${x + i},${y + j}`;
        if (!claimed.has(cell)) claimed.set(cell, []);
        claimed.get(cell).push(key);
      }
    }
  }
  for (const [cell, keys] of claimed) {
    if (keys.length > 1) {
      problems.push(`${m.id}: cell ${cell} is claimed by ${keys.length} rooms (${keys.join(' and ')}) — ` +
        `one of them silently wins the occupancy index and the other is unreachable there`);
    }
  }

  for (const [key, def] of Object.entries(m.roomDefs || {})) {
    const [f, x, y] = key.split(',').map(Number);
    let sw, sh;
    try { [sw, sh] = normaliseSize(def.size, `${m.id}/${key}`); } catch { continue; }
    if (sw === 1 && sh === 1) continue;      // 1 and 2 below still apply, but see note
    sized++;
    const where = `${m.id}/${key} (${sw}x${sh})`;

    // --- 2. it fits on the map ---------------------------------------------
    if (x + sw > m.w || y + sh > m.h) {
      problems.push(`${where}: covers up to ${x + sw - 1},${y + sh - 1} but the map is ${m.w}x${m.h}`);
    }

    // --- 1. the authored grid fills it -------------------------------------
    const tw = sw * ROOM_W, th = sh * ROOM_H;
    const rows = def.map || [];
    if (rows.length !== th) {
      problems.push(`${where}: needs ${th} rows of map text and has ${rows.length} — ` +
        `the missing rows become a band of void and nothing throws`);
    }
    rows.forEach((row, i) => {
      const len = row.replace(/\s+$/, '').length;
      if (len < tw) {
        problems.push(`${where}: row ${i} is ${len} characters and needs ${tw} — ` +
          `the short end becomes void, which renders as a hole`);
      } else if (row.length > tw) {
        problems.push(`${where}: row ${i} is ${row.length} characters, over the ${tw} the room can ` +
          `hold; the extra is silently ignored`);
      }
    });

    const room = getRoom(m.id, f, x, y);
    if (!room) { problems.push(`${where}: does not instantiate`); continue; }

    // --- 4. every covered cell resolves back here ---------------------------
    for (let j = 0; j < sh; j++) {
      for (let i = 0; i < sw; i++) {
        const got = roomKeyAt(m.id, f, x + i, y + j);
        if (got !== key) {
          problems.push(`${where}: its cell ${f},${x + i},${y + j} resolves to '${got}', not '${key}'`);
        }
      }
    }

    // --- 5. internal seams are crossable ------------------------------------
    // At least one tile pair across each seam must be mutually standable, at
    // some tide. Solidity is the engine's, via the collision shim.
    for (let i = 1; i < sw; i++) {
      const col = i * ROOM_W;                 // first column of the next screen
      seamsChecked++;
      let open = 0;
      for (let ty = 0; ty < th; ty++) {
        for (let lv = 0; lv < TIDE_COUNT; lv++) {
          if (everPassable(room, col - 1, ty, lv) && everPassable(room, col, ty, lv)) { open++; break; }
        }
      }
      if (!open) {
        problems.push(`${where}: the vertical seam at column ${col} is solid for all ${th} rows at ` +
          `every tide — the two halves are separate rooms wearing one key, and no other checker ` +
          `can see it because they all flood this as a single room`);
      } else if (VERBOSE) {
        console.log(`  ${where} vertical seam at ${col}: ${open}/${th} rows crossable`);
      }
    }
    for (let j = 1; j < sh; j++) {
      const row = j * ROOM_H;
      seamsChecked++;
      let open = 0;
      for (let tx = 0; tx < tw; tx++) {
        for (let lv = 0; lv < TIDE_COUNT; lv++) {
          if (everPassable(room, tx, row - 1, lv) && everPassable(room, tx, row, lv)) { open++; break; }
        }
      }
      if (!open) {
        problems.push(`${where}: the horizontal seam at row ${row} is solid for all ${tw} columns at ` +
          `every tide — the two halves are separate rooms wearing one key`);
      } else if (VERBOSE) {
        console.log(`  ${where} horizontal seam at ${row}: ${open}/${tw} columns crossable`);
      }
    }

    // --- 6. the room never neighbours itself --------------------------------
    for (let j = 0; j < sh; j++) {
      for (let i = 0; i < sw; i++) {
        const edges = [
          [x + i - 1, y + j, 'left', i === 0],
          [x + i + 1, y + j, 'right', i === sw - 1],
          [x + i, y + j - 1, 'up', j === 0],
          [x + i, y + j + 1, 'down', j === sh - 1],
        ];
        for (const [nx, ny, dir, onEdge] of edges) {
          if (!onEdge) continue;               // interior neighbours ARE this room, by design
          const got = roomKeyAt(m.id, f, nx, ny);
          if (got === key) {
            problems.push(`${where}: stepping ${dir} off its own outer edge at ${f},${x + i},${y + j} ` +
              `lands back in the same room`);
          }
        }
      }
    }
  }
}

console.log(`check-wide-rooms: ${sized} multi-screen room(s), ${seamsChecked} internal seam(s)`);
if (!sized) {
  problems.push('no multi-screen room exists, so this tool proved nothing — either the feature ' +
    'was lost or the size field changed name');
}
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log('check-wide-rooms: OK — every wide room fills its grid, owns its cells alone, is ' +
  'crossable at every seam, and never neighbours itself');
