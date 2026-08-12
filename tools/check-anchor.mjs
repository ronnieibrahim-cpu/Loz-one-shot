// Anchor-gate prover. Runs in plain Node (no DOM, no browser) against the
// game's own data modules and feel constants.
//
// WHAT IT IS FOR
//
// P8 says a dungeon's item is found halfway through and every room after it
// requires the verb that item introduced. Nothing could check that. The dungeon
// walker deliberately floods with "walkable at ANY tide level", because the
// player controls the conch — which makes it an UPPER BOUND on reachability and
// therefore blind to the difference between a room the conch crosses and a room
// only the Tidewright's Anchor crosses. Both look reachable. So a dungeon could
// claim to be built around its item while every gate in it fell to two presses
// of the conch, and every checker would stay green.
//
// This tool closes that. For every room declaring `anchorGate` or
// `anchorGauges` it proves BOTH directions:
//
//   1. impossible with the conch alone — no sequence of walking, hopping and
//      sounding the conch gets from the room's entrance to its far side;
//   2. possible with ONE anchor placement — there is a tile the player can
//      stand on, a direction to throw in, and a level to have the sea at when
//      the iron bites, after which the far side is reachable.
//
// It prints the solution it found for each room, so the tool output is also the
// record of what the room's intended answer is.
//
// THE MODEL, and where its edges are
//
//   * A state is (tile, base level). Walking moves between adjacent states;
//     sounding the conch changes the base and is allowed only while the tile
//     the player is standing on survives the change, which is the same rule
//     check-overworld.mjs floods with.
//   * A hop clears up to HOP_TILES of anything that is not SOLID — deep water,
//     a pit, a gap — and must land on a tile that is walkable. Both numbers
//     come out of feel.js rather than being written down here, because a jump's
//     reach is a function of WALK_SPEED and moves whenever that does.
//   * NO SWIMMING. The Kelp-Soled Cleats are the D3 item, so in D1 deep water
//     is a wall. A room in a later dungeon that declares an anchorGate would
//     need this relaxed, and the assertion below about which dungeons are
//     covered is what will catch that.
//   * The patch is ANCHOR_RADIUS_TILES / ANCHOR_SHAPE, read from feel.js, so
//     retuning the radius re-proves every gate instead of quietly breaking it.
//   * The throw reach is derived from the arc constants and rounded DOWN to
//     whole tiles, and every distance from 1 to that is tried: the engine's
//     anchor lands where its arc puts it or where a wall stops it, and a prover
//     that insisted on one exact distance would be testing arithmetic rather
//     than the room.
//
// Usage: node tools/check-anchor.mjs [--verbose]

import { MAPS } from '../src/world/maps.js';
import { getLegend } from '../src/world/room.js';
import { F, getTileDef } from '../src/world/tileset.js';
import { installData } from '../src/data/index.js';
import {
  ANCHOR_RADIUS_TILES, ANCHOR_SHAPE, ANCHOR_THROW_SPEED,
  THROW_ARC_RISE, THROW_ARC_GRAVITY, JUMP_POWER, JUMP_GRAVITY, WALK_SPEED,
} from '../src/data/feel.js';

installData();

const VERBOSE = process.argv.includes('--verbose');
const LEVELS = [0, 1, 2];

let passed = 0; const failures = [];
function check(name, cond, detail) {
  if (cond) { passed++; console.log('  ok   ' + name); }
  else { failures.push(name + (detail ? ' — ' + detail : '')); console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); }
}

// --- the two reaches, both derived from constants rather than remembered ----
//
// A hop: airtime is 2 * JUMP_POWER / JUMP_GRAVITY frames, covering WALK_SPEED
// subpixels of ground per frame. FEEL-SPEC.md carries the same arithmetic.
const HOP_PX = (2 * JUMP_POWER / JUMP_GRAVITY) * (WALK_SPEED / 256);
const HOP_TILES = Math.floor(HOP_PX / 16);
// A throw: the anchor leaves the hand at z = 12px with vz = THROW_ARC_RISE and
// falls at THROW_ARC_GRAVITY, travelling ANCHOR_THROW_SPEED along the ground.
const Z0 = 12 * 256;
const AIRTIME = (THROW_ARC_RISE + Math.sqrt(THROW_ARC_RISE * THROW_ARC_RISE + 2 * THROW_ARC_GRAVITY * Z0))
  / THROW_ARC_GRAVITY;
const THROW_TILES = Math.max(1, Math.floor(AIRTIME * (ANCHOR_THROW_SPEED / 256) / 16));

console.log(`  hop reach ${HOP_PX.toFixed(1)}px (${HOP_TILES} whole tiles), `
  + `throw reach ${(AIRTIME * ANCHOR_THROW_SPEED / 256).toFixed(1)}px (${THROW_TILES} whole tiles), `
  + `patch r=${ANCHOR_RADIUS_TILES} ${ANCHOR_SHAPE}`);

// --- tiles ------------------------------------------------------------------
function defAt(legend, ch, level) {
  let d = getTileDef(legend[ch]);
  for (let i = 0; i < 4 && d && d.tide; i++) d = getTileDef(d.tide[level]);
  return d;
}

/** Walkable on foot, with no swimming and nothing equipped. */
function walkableDef(d) {
  if (!d) return false;
  if (d.flags & F.STAIRS) return true;
  return !(d.flags & (F.VOID | F.SOLID | F.PIT | F.DEEP | F.LEDGE | F.HAZARD));
}

/** A hop passes over anything that is not a wall. */
function hoppableDef(d) {
  return !!d && !(d.flags & (F.VOID | F.SOLID));
}

/** The patch's footprint, matching Tide.levelAt's own two shapes. */
function inPatch(x, y, patch) {
  if (!patch) return false;
  const dx = x - patch.tx, dy = y - patch.ty, r = ANCHOR_RADIUS_TILES;
  return ANCHOR_SHAPE === 'disc' ? (dx * dx + dy * dy <= r * r)
    : (Math.abs(dx) <= r && Math.abs(dy) <= r);
}

/**
 * The state space. Returns the set of reachable "x,y,base" keys, given a room,
 * a start tile, and optionally one held patch.
 *
 * `openTiles` names tiles to treat as walkable whatever they are — the door a
 * puzzle has just opened.
 */
function flood(room, start, patch, openTiles = new Set()) {
  const { grid, legend, noTide, W, H } = room;
  const levelAt = (x, y, base) => (inPatch(x, y, patch) ? patch.level : base);
  const walk = (x, y, base) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return false;
    if (openTiles.has(x + ',' + y)) return true;
    return walkableDef(defAt(legend, grid[y][x], levelAt(x, y, base)));
  };
  const hopOver = (x, y, base) =>
    x >= 0 && y >= 0 && x < W && y < H
    && hoppableDef(defAt(legend, grid[y][x], levelAt(x, y, base)));

  const seen = new Set(), q = [];
  const push = (x, y, base) => {
    const k = `${x},${y},${base}`;
    if (seen.has(k)) return;
    seen.add(k); q.push([x, y, base]);
  };
  for (const b of LEVELS) if (walk(start[0], start[1], b)) push(start[0], start[1], b);
  while (q.length) {
    const [x, y, base] = q.pop();
    // Sounding the conch: only where the ground under you survives it. A room
    // with `noTide` refuses the conch outright.
    if (!noTide) for (const b of LEVELS) if (b !== base && walk(x, y, b)) push(x, y, b);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (walk(x + dx, y + dy, base)) { push(x + dx, y + dy, base); continue; }
      for (let n = 1; n <= HOP_TILES; n++) {
        // Every tile up to the landing must be hoppable, and the landing walkable.
        let clear = true;
        for (let i = 1; i <= n; i++) if (!hopOver(x + dx * i, y + dy * i, base)) { clear = false; break; }
        if (!clear) break;
        if (walk(x + dx * (n + 1), y + dy * (n + 1), base)) push(x + dx * (n + 1), y + dy * (n + 1), base);
      }
    }
  }
  return seen;
}

const reaches = (seen, [x, y]) => LEVELS.some(b => seen.has(`${x},${y},${b}`));

/**
 * Every placement the player could actually make from a state in `seen`: throw
 * in a cardinal direction, 1..THROW_TILES tiles, stopped short by a wall. The
 * level captured is the level at the bite tile BEFORE the bite, which with one
 * anchor is the base.
 */
function placements(room, seen) {
  const { grid, legend, W, H } = room;
  const out = [];
  for (const key of seen) {
    const [sx, sy, base] = key.split(',').map(Number);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      for (let n = 1; n <= THROW_TILES; n++) {
        const tx = sx + dx * n, ty = sy + dy * n;
        if (tx < 0 || ty < 0 || tx >= W || ty >= H) break;
        const d = defAt(legend, grid[ty][tx], base);
        // A wall stops the anchor in flight; it never lands beyond one.
        if (!d || (d.flags & (F.VOID | F.SOLID))) break;
        out.push({ tx, ty, level: base, fromX: sx, fromY: sy, fromBase: base });
      }
    }
  }
  return out;
}

// --- collect the declared rooms --------------------------------------------
const gates = [], gauges = [];
for (const [mapId, m] of MAPS) {
  for (const [key, def] of Object.entries(m.roomDefs || {})) {
    // The room's extent in tiles, from its declared size in screens. A gate
    // written across a 2x1 room is twenty tiles wide, and a prover that stopped
    // at ten would call its far side unreachable and pass for the wrong reason.
    const sz = def.size || [1, 1];
    const room = {
      mapId, key, name: def.name || key,
      W: (sz[0] | 0) * 10, H: (sz[1] | 0) * 8,
      grid: def.map, legend: getLegend(def.legend || m.legend), noTide: !!def.noTide, def,
    };
    if (def.anchorGate) gates.push({ ...room, gate: def.anchorGate });
    if (def.anchorGauges) gauges.push({ ...room, g: def.anchorGauges });
  }
}

check('at least one room declares an anchor gate', gates.length > 0, 'nothing to prove');
// The model has no swimming in it, so it is only sound for a dungeon reached
// before the Cleats. If a later dungeon declares a gate, this fires rather than
// silently proving the wrong thing.
const late = [...gates, ...gauges].filter(r => !['d1', 'd2'].includes(r.mapId));
check('every declared anchor room is in a pre-Cleats dungeon', late.length === 0,
  late.map(r => `${r.mapId} ${r.key}`).join(', ') + ' — teach this tool to swim first');

// --- part 1: the gates ------------------------------------------------------
for (const r of gates) {
  const where = `${r.mapId} ${r.key} (${r.name})`;
  const conchOnly = flood(r, r.gate.from, null);
  check(`${where}: the conch alone does not cross it`, !reaches(conchOnly, r.gate.to),
    `reached ${r.gate.to} from ${r.gate.from} with no anchor`);

  let solved = null;
  for (const p of placements(r, conchOnly)) {
    if (reaches(flood(r, r.gate.from, p), r.gate.to)) { solved = p; break; }
  }
  check(`${where}: one anchor placement crosses it`, !!solved,
    'no reachable bite tile at any level opens a route');
  if (solved) {
    console.log(`       solution: stand ${solved.fromX},${solved.fromY} at `
      + `${['LOW', 'MID', 'HIGH'][solved.fromBase]}, bite ${solved.tx},${solved.ty}, then sound the conch`);
  }
  if (VERBOSE) {
    const all = placements(r, conchOnly).filter(p => reaches(flood(r, r.gate.from, p), r.gate.to));
    console.log(`       ${all.length} of ${placements(r, conchOnly).length} placements work`);
  }
}

// --- part 2: the gauge rooms ------------------------------------------------
//
// A gauge room's door reads two tiles and wants them at two DIFFERENT levels.
// One base cannot be two levels, so the door needs an override; the geometry
// check is what proves one patch cannot cover both gauges and hand the puzzle
// back to the conch.
for (const r of gauges) {
  const where = `${r.mapId} ${r.key} (${r.name})`;
  const { a, b, aLevel, bLevel, door } = r.g;
  check(`${where}: the two gauges want different levels`, aLevel !== bLevel,
    `both want ${aLevel}`);
  const span = Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]));
  check(`${where}: no one patch can cover both gauges`, span > 2 * ANCHOR_RADIUS_TILES,
    `they are ${span} tiles apart and the patch is ${2 * ANCHOR_RADIUS_TILES + 1} across`);

  // And the room has to be solvable: reach a tile at base aLevel from which the
  // iron bites a tile whose patch covers gauge a and not gauge b, then take the
  // base to bLevel and walk to the door. Tried both ways round, because either
  // gauge may be the one held.
  const start = r.g.from || [4, 4];
  const startTile = walkableDef(defAt(r.legend, r.grid[start[1]][start[0]], 1)) ? start : null;
  let solved = null;
  for (const [g1, l1, g2, l2] of [[a, aLevel, b, bLevel], [b, bLevel, a, aLevel]]) {
    const seen = flood(r, startTile || a, null);
    for (const p of placements(r, seen)) {
      if (p.level !== l1) continue;                       // must capture g1's level
      if (!inPatch(g1[0], g1[1], p)) continue;            // covering g1
      if (inPatch(g2[0], g2[1], p)) continue;             // and not g2
      // The player must survive taking the base to l2 and then reach the door.
      const after = flood(r, [p.fromX, p.fromY], p, new Set([door.join(',')]));
      if (!after.has(`${p.fromX},${p.fromY},${l2}`)) continue;
      if (!reaches(after, door)) continue;
      solved = { p, held: g1, heldLevel: l1, base: l2 };
      break;
    }
    if (solved) break;
  }
  check(`${where}: one anchor placement opens the door`, !!solved,
    'no reachable bite covers one gauge at its level with the base at the other');
  if (solved) {
    console.log(`       solution: hold ${solved.held} at ${['LOW', 'MID', 'HIGH'][solved.heldLevel]} `
      + `(bite ${solved.p.tx},${solved.p.ty} from ${solved.p.fromX},${solved.p.fromY}), `
      + `then take the sea to ${['LOW', 'MID', 'HIGH'][solved.base]}`);
  }
}

console.log(`\n=== ${passed} passed, ${failures.length} failed ===`);
for (const f of failures) console.log('  ' + f);
process.exit(failures.length ? 1 : 0);
