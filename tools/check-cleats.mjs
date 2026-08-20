// Kelp-Soled Cleats prover. Plain Node, no DOM, no browser. The third of the
// item provers, after check-anchor.mjs and check-lens.mjs, and the first one
// that can swim.
//
// WHAT IT IS FOR
//
// The Cleats are two items on one button. Swim is what the flippers were. Sink
// is the new half: you walk the floor UNDER the water, slowly, immune to
// currents and to knockback, unable to draw the sword, on a breath timer.
//
// So "this room requires the Cleats" is nearly free — deep water is a wall
// without them and floor with them, and every checker in the repo already
// knows it. The claim worth proving is the one the dungeon is actually built
// on, and it is a claim about the TWO MODES rather than about the item:
//
//   the surface route does not get there, and the floor route does.
//
// That is provable statically because the difference between the modes is
// data. A tile carries a `push`; `Player.updateTerrain` applies it only while
// `inDeep && !underwater`, so a current moves a swimmer and never a walker.
// Compare the push against SWIM_SPEED and the answer is arithmetic:
//
//   |push| >= SWIM_SPEED   a swimmer cannot make headway against it, ever
//   |push| <  SWIM_SPEED   a swimmer is slowed and gets there anyway
//
// An ordinary riptide is 0.55 px/f against a swimmer's 0.75, so it is a tax on
// the surface and not a barrier. `TORRENT_PUSH` is deliberately the other side
// of that line. BOTH NUMBERS ARE READ OUT OF feel.js HERE, so retuning
// SWIM_SPEED re-proves every declared room against the new ratio rather than
// leaving a dungeon whose rooms quietly stopped meaning what they say.
//
// WHAT IS PROVED, per room declaring `cleatRoom: { from, to }`
//
//   1. NOT WITHOUT THE ITEM. With no Cleats at all, `to` is unreachable from
//      `from` at every tide level. Deep water is a wall and the conch cannot
//      open it.
//   2. NOT ON THE SURFACE. Swimming, with the currents applied, `to` is still
//      unreachable at every tide level. This is the assertion with teeth and
//      the one a later session will be tempted to weaken by dropping a
//      still-water tile into the torrent, which is the same mistake as the
//      forgiving tile that broke all three of D1's anchor gates.
//   3. ON THE FLOOR, YES. In sink mode `to` is reachable, at some tide level,
//      and the tool prints which.
//   4. AND THE AIR LASTS. The longest unbroken deep crossing on that route
//      fits inside CLEATS_BREATH_FRAMES at SINK_SPEED, with the margin
//      printed. Breath starts when you go under and `Player.updateBreath`
//      surfaces you the moment you are not in deep water, so a route's cost is
//      its longest deep RUN, not its total length.
//
// THE MODEL, and where its edges are
//
//   * A state is a tile; the level is a parameter, and every claim is made at
//     all three independently. There is no conch axis: unlike an anchor gate,
//     nothing here is opened by changing the level, so proving each level
//     separately is both simpler and stricter.
//   * THE SWIMMER IS MODELLED GENEROUSLY, on purpose. On a torrent tile they
//     may move in any direction except directly into the push. A real swimmer
//     is also dragged sideways while crossing, which would make them weaker
//     than this; assertion 2 says "even a swimmer better than the engine's
//     cannot get there", and that is the direction an unreachability claim has
//     to err in.
//   * The walker on the floor ignores `push` entirely, which is exactly what
//     `Player.updateTerrain` does.
//   * Neither mode jumps: `tryLedgeHop` and `tryGapHop` both refuse while
//     `inDeep` or `underwater`, so a route that needs a hop needs dry land,
//     and the flood only hops from tiles that are not deep.
//
// Usage: node tools/check-cleats.mjs [--verbose]

import { MAPS } from '../src/world/maps.js';
import { getLegend } from '../src/world/room.js';
import { F, getTileDef } from '../src/world/tileset.js';
import { installData } from '../src/data/index.js';
import { defWalkable, capsForMode, ROUTE_AVOID } from './lib/collision.mjs';
import {
  SWIM_SPEED, SINK_SPEED, CLEATS_BREATH_FRAMES, TORRENT_PUSH,
  JUMP_POWER, JUMP_GRAVITY, WALK_SPEED,
} from '../src/data/feel.js';

installData();

const VERBOSE = process.argv.includes('--verbose');
const LEVELS = [0, 1, 2];
const LEVEL_NAME = ['LOW', 'MID', 'HIGH'];
const TILE = 16;

let passed = 0; const failures = [];
function check(name, cond, detail) {
  if (cond) { passed++; console.log('  ok   ' + name); }
  else { failures.push(name + (detail ? ' — ' + detail : '')); console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); }
}

// --- the numbers, all derived rather than remembered ------------------------
const SWIM_PXF = SWIM_SPEED / 256;
const SINK_PXF = SINK_SPEED / 256;
const HOP_TILES = Math.floor(((2 * JUMP_POWER / JUMP_GRAVITY) * (WALK_SPEED / 256)) / TILE);
// How far sink mode carries you on one breath, in whole tiles.
const BREATH_TILES = Math.floor((CLEATS_BREATH_FRAMES * SINK_PXF) / TILE);

console.log(`  swim ${SWIM_PXF.toFixed(3)} px/f, sink ${SINK_PXF.toFixed(3)} px/f, `
  + `torrent ${TORRENT_PUSH} px/f (${TORRENT_PUSH >= SWIM_PXF ? 'unswimmable' : 'SWIMMABLE'}), `
  + `one breath = ${CLEATS_BREATH_FRAMES}f = ${BREATH_TILES} tiles of seafloor`);

// The inequality the whole dungeon rests on, asserted once and globally rather
// than per room: if this ever goes the other way, every torrent in the game is
// a tax instead of a wall and every assertion below is proving nothing.
check('a torrent is stronger than a swimmer', TORRENT_PUSH >= SWIM_PXF,
  `TORRENT_PUSH ${TORRENT_PUSH} px/f vs SWIM_SPEED ${SWIM_PXF.toFixed(3)} px/f — a swimmer can fight this current`);

// --- tiles ------------------------------------------------------------------
function defAt(legend, ch, level) {
  let d = getTileDef(legend[ch]);
  for (let i = 0; i < 4 && d && d.tide; i++) d = getTileDef(d.tide[level]);
  return d;
}

const isDeep = (d) => !!d && !!(d.flags & F.DEEP);

/** Walkable on foot: no swimming, nothing equipped. */
function walkableDef(d) {
  if (!d) return false;
  if (d.flags & F.STAIRS) return true;
  return defWalkable(d, capsForMode('foot'), ROUTE_AVOID);
}

/**
 * Can a body of this mode occupy the tile at all? Asked of the engine's own
 * `tileDefSolid` (via `defWalkable`/`capsForMode`, tools/lib/collision.mjs)
 * rather than a private re-derivation of which flags block a mover — 'swim'
 * and 'sink' both cross F.DEEP, matching the Cleats' two modes.
 */
function occupiable(d, mode) {
  if (!d) return false;
  if (d.flags & F.STAIRS) return true;
  return defWalkable(d, capsForMode(mode), ROUTE_AVOID);
}

/**
 * The push a tile applies to a SWIMMER, in px/f. Zero for a walker on the
 * floor, which is the entire trade sink mode offers.
 */
const pushOf = (d, mode) => (mode === 'swim' && d && d.push) ? d.push : [0, 0];

/**
 * Reachability in one room at one tide level, for one mode.
 *
 *   'foot'  no Cleats: deep water is a wall
 *   'swim'  the surface: deep water is floor, and currents apply
 *   'sink'  the seafloor: deep water is floor, and nothing pushes you
 *
 * `maxRun` caps the number of deep tiles that may be crossed WITHOUT COMING UP
 * — one dive. It defaults to no limit; `minDive` below binary-walks it to find
 * what a room actually asks of the player's air. Counting the run at the
 * DESTINATION instead of along the path was the first version of this and it
 * reported every route in the dungeon as a nought-tile dive, because every
 * route ends on dry land: the number that matters is the worst point of the
 * crossing, not its last tile.
 */
function flood(room, start, level, mode, maxRun = Infinity) {
  const { grid, legend, W, H } = room;
  // A dive longer than the room has tiles is not a dive, it is a walker
  // swimming in circles to inflate the count. Capping it also keeps the state
  // space (tile x run) finite, which an unbounded run does not.
  maxRun = Math.min(maxRun, W * H);
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? null : defAt(legend, grid[y][x], level));
  const ok = (x, y) => occupiable(at(x, y), mode);

  const best = new Set();                 // 'x,y,run' states seen
  const tiles = new Set();                // 'x,y' reached at all
  const q = [];
  const push = (x, y, run) => {
    if (run > maxRun) return;
    const k = x + ',' + y + ',' + run;
    if (best.has(k)) return;
    best.add(k); tiles.add(x + ',' + y); q.push([x, y, run]);
  };
  if (!ok(start[0], start[1])) return tiles;
  push(start[0], start[1], isDeep(at(start[0], start[1])) ? 1 : 0);

  while (q.length) {
    const [x, y, run] = q.pop();
    const here = at(x, y);
    const [px, py] = pushOf(here, mode);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      // A current you cannot out-swim: no move with a component into it.
      if (mode === 'swim' && ((dx && Math.sign(px) === -Math.sign(dx) && Math.abs(px) >= SWIM_PXF)
        || (dy && Math.sign(py) === -Math.sign(dy) && Math.abs(py) >= SWIM_PXF))) continue;
      const nx = x + dx, ny = y + dy;
      if (ok(nx, ny)) {
        const deep = isDeep(at(nx, ny));
        push(nx, ny, deep ? run + 1 : 0);
        continue;
      }
      // A hop, and only from dry footing: both hop paths refuse in the water.
      if (isDeep(here) || mode === 'sink') continue;
      for (let n = 1; n <= HOP_TILES; n++) {
        let clear = true;
        for (let i = 1; i <= n; i++) {
          const d = at(x + dx * i, y + dy * i);
          if (!d || (d.flags & (F.VOID | F.SOLID))) { clear = false; break; }
        }
        if (!clear) break;
        const lx = x + dx * (n + 1), ly = y + dy * (n + 1);
        if (walkableDef(at(lx, ly))) push(lx, ly, 0);
      }
    }
  }
  return tiles;
}

/**
 * The shortest air the room can be crossed on: the smallest single-dive length
 * that still gets `to` from `from`. Walked upward from zero rather than solved,
 * because a room is a hundred and sixty tiles and the answer is always small.
 * Infinity means no route at any dive length.
 */
function minDive(room, from, to, level, mode) {
  const cap = room.W * room.H;
  for (let L = 0; L <= cap; L++) {
    if (flood(room, from, level, mode, L).has(to.join(','))) return L;
  }
  return Infinity;
}

// --- collect the declared rooms --------------------------------------------
const rooms = [];
for (const [mapId, m] of MAPS) {
  for (const [key, def] of Object.entries(m.roomDefs || {})) {
    if (!def.cleatRoom) continue;
    const sz = def.size || [1, 1];
    rooms.push({
      mapId, key, name: def.name || key, kind: m.kind,
      W: (sz[0] | 0) * 10, H: (sz[1] | 0) * 8,
      grid: def.map, legend: getLegend(def.legend || m.legend),
      noTide: !!def.noTide, def, C: def.cleatRoom,
    });
  }
}

check('at least one room declares a cleat room', rooms.length > 0, 'nothing to prove');
// Every torrent in the game should be inside a room that claims to be about
// them. A torrent laid as decoration somewhere else is a wall nothing proves
// the player can get past.
const strays = [];
for (const [mapId, m] of MAPS) {
  for (const [key, def] of Object.entries(m.roomDefs || {})) {
    if (def.cleatRoom) continue;
    const legend = getLegend(def.legend || m.legend);
    for (const row of def.map) {
      for (const ch of row) {
        const d = getTileDef(legend[ch]);
        if (d && d.push && Math.abs(d.push[0]) + Math.abs(d.push[1]) >= SWIM_PXF) {
          strays.push(`${mapId} ${key}`);
        }
      }
    }
  }
}
check('every torrent is in a room that declares itself', strays.length === 0,
  [...new Set(strays)].join(', ') + ' — a torrent nothing proves a way past');

// --- per room ---------------------------------------------------------------
for (const r of rooms) {
  const where = `${r.mapId} ${r.key} (${r.name})`;
  const { from, to } = r.C;

  const reaches = (mode) => LEVELS.filter(l => flood(r, from, l, mode).has(to.join(',')));

  const onFoot = reaches('foot');
  check(`${where}: no route without the Cleats`, onFoot.length === 0,
    'reached at ' + onFoot.map(l => LEVEL_NAME[l]).join('/') + ' with no item at all');

  const swum = reaches('swim');
  check(`${where}: the surface route does not get there`, swum.length === 0,
    'swimming reaches it at ' + swum.map(l => LEVEL_NAME[l]).join('/') + ' — the current is not a barrier');

  const sunk = reaches('sink');
  check(`${where}: the seafloor route does`, sunk.length > 0,
    'sink mode cannot reach it either — the room is impossible, not layered');

  if (sunk.length) {
    // The air. Measured as the longest unbroken deep run on the best route
    // found, because breath starts when you go under and ends the moment you
    // are out of deep water again.
    let worst = Infinity;
    for (const l of sunk) worst = Math.min(worst, minDive(r, from, to, l, 'sink'));
    const frames = Math.ceil((worst * TILE) / SINK_PXF);
    check(`${where}: one breath covers the crossing`, worst <= BREATH_TILES,
      `${worst} tiles of seafloor needs ${frames}f and a breath is ${CLEATS_BREATH_FRAMES}f`);
    console.log(`       floor route at ${sunk.map(l => LEVEL_NAME[l]).join('/')}, `
      + `longest dive ${worst} tiles (${frames}f of ${CLEATS_BREATH_FRAMES}, `
      + `${Math.round(100 - frames / CLEATS_BREATH_FRAMES * 100)}% margin)`);
  }

  if (VERBOSE) {
    for (const l of LEVELS) {
      console.log(`       @${LEVEL_NAME[l]}: foot ${flood(r, from, l, 'foot').size} tiles, `
        + `swim ${flood(r, from, l, 'swim').size}, sink ${flood(r, from, l, 'sink').size}`);
    }
  }
}

console.log(`\n=== ${passed} passed, ${failures.length} failed ===`);
for (const f of failures) console.log('  ' + f);
process.exit(failures.length ? 1 : 0);
