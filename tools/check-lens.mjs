// Lens-room prover. Runs in plain Node (no DOM, no browser) against the game's
// own data modules and feel constants. The sibling of tools/check-anchor.mjs,
// and written for the same reason: check-anchor failed all three of D1's gates
// on its first run, after they had been designed carefully by someone who
// believed they worked.
//
// WHAT IT IS FOR
//
// P8 says every room after a dungeon's item requires the verb that item
// introduced. docs/ITEMS.md says the Brineglass Lens is NEVER a gate. Those
// only read as a contradiction until you notice they are about different
// things: the Lens cannot make a tile passable, so a Lens room cannot be built
// like an anchor gate. The verb the Lens introduces is KNOWING BEFORE YOU
// COMMIT, so the room has to make you commit.
//
//   A room offers a choice that cannot be taken back, and the branch you want
//   depends on what the room will be at the NEXT tide level, which is exactly
//   what is invisible while you are standing at this one.
//
// The failure mode this tool exists to catch is a Lens room that is really a
// convenience: one where the player can scout the branch, walk back round, or
// die cheaply and retry from the same side. Then the information is free and
// the requirement is decoration. Every assertion below is aimed at one of the
// ways that happens.
//
// THE DECLARATION
//
//   lensRoom: {
//     pin: 0,                 // the tide level the room is pinned to
//     reveals: 1,             // the level the choice resolves at
//     decide: [x, y],         // the tile the player chooses from
//     branches: [
//       { name: '…', land: [x, y], probe: [x, y], onward: [x, y], escape: true },
//       …
//     ],
//   }
//
//   `land`    where the player ends up having taken this branch
//   `probe`   the tile that decides the branch — the one the Lens is read for
//   `onward`  the tile this branch is trying to reach
//   `escape`  this branch has a way out that is not `onward` (a return stair),
//             so being wrong is a walk back rather than a soft lock
//
// WHAT IS PROVED, per declared room
//
//   1. THE ROOM PINS THE TIDE. `tideForce` is set to `pin` and equals the
//      level the branches are chosen at, and `reveals` is exactly the level a
//      level-1 Lens draws — (pin + 1) % 3. This is the assertion with the most
//      teeth in the whole file, and it is the one a later session will be
//      tempted to drop: a room the conch can reach is a room the player can
//      preview for free by sounding it, looking, and sounding it back, and
//      then the Lens is a shortcut rather than the answer.
//   2. THE CHOICE IS ONE-WAY. Every branch's `land` is reachable from `decide`
//      at the pinned level, and `decide` is reachable from NO branch at ANY of
//      the three levels. Nor may one branch reach another.
//   3. THE PINNED LEVEL ANSWERS NOTHING. From no branch's `land` is its own
//      `onward` reachable at `pin`. If it were, the room would be solvable
//      without the water ever moving.
//   4. THE CHOICE MATTERS AT THE LEVEL IT RESOLVES AT. At `reveals`, at least
//      one branch reaches its `onward` and at least one does not — so there is
//      a right answer and a wrong one.
//   5. THE BRANCHES ARE INDISTINGUISHABLE WHERE THE PLAYER DECIDES. Every
//      branch's `probe` resolves to THE SAME TILE at `pin` — the same tile, not
//      a lookalike — and the winning branch's probe differs from every losing
//      branch's at `reveals`. This is the one that is tempting to weaken, and
//      weakening it is the difference between a room that rewards the Lens and
//      a room that rewards remembering.
//   6. BEING WRONG IS A COST, NOT A LOCK. Every losing branch declares an
//      `escape`, and the tile it names is reachable from that branch's `land`.
//
// THE MODEL, and where its edges are
//
//   * Walking is 4-neighbour. A hop is the ENGINE's hop, not a generous
//     approximation of one: `tryGapHop` clears exactly one F.JUMPABLE tile
//     (GAP_HOP_MAX_SPAN), and a dungeon pit is not JUMPABLE at all, so pits
//     and deep water are walls to a walker. `tryLedgeHop` fires only into the
//     FACE of a ledge and carries up to LEDGE_MAX_SPAN. Both spans come out of
//     feel.js rather than being written down here.
//   * NO SWIMMING and NO ANCHOR. The Cleats are D3 and the Anchor cannot be
//     thrown into a pinned room to any effect the pin does not already have.
//     The assertion that every declared lensRoom is in D2 is what will catch a
//     later dungeon that needs this relaxed.
//   * The conch does not appear in the model at all, because assertion 1 has
//     already established that the room refuses it.
//
// Usage: node tools/check-lens.mjs [--verbose]

import { MAPS } from '../src/world/maps.js';
import { getLegend } from '../src/world/room.js';
import { F, getTileDef } from '../src/world/tileset.js';
import { installData } from '../src/data/index.js';
import { LEDGE_MAX_SPAN, GAP_HOP_MAX_SPAN } from '../src/data/feel.js';
import { defWalkable, capsForMode, ROUTE_AVOID } from './lib/collision.mjs';

installData();

const VERBOSE = process.argv.includes('--verbose');
const LEVELS = [0, 1, 2];
const LEVEL_NAME = ['LOW', 'MID', 'HIGH'];
const DIRS = [[1, 0, 'right'], [-1, 0, 'left'], [0, 1, 'down'], [0, -1, 'up']];

let passed = 0; const failures = [];
function check(name, cond, detail) {
  if (cond) { passed++; console.log('  ok   ' + name); }
  else { failures.push(name + (detail ? ' — ' + detail : '')); console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); }
}

console.log(`  a gap hop clears ${GAP_HOP_MAX_SPAN - 1} tile(s) of JUMPABLE, `
  + `a ledge hop carries ${LEDGE_MAX_SPAN}; both from feel.js`);

// --- tiles ------------------------------------------------------------------

/** The concrete tile a legend character resolves to at a level. */
function defAt(legend, ch, level) {
  let d = getTileDef(legend[ch]);
  for (let i = 0; i < 4 && d && d.tide; i++) d = getTileDef(d.tide[level]);
  return d;
}

/** The NAME of that tile — what the room actually draws in that cell. */
function nameAt(legend, ch, level) {
  let name = legend[ch];
  let d = getTileDef(name);
  for (let i = 0; i < 4 && d && d.tide; i++) { name = d.tide[level]; d = getTileDef(name); }
  return name;
}

/** Walkable on foot, with no swimming and nothing equipped. */
function walkableDef(d) {
  if (!d) return false;
  if (d.flags & F.STAIRS) return true;
  return defWalkable(d, capsForMode('foot'), ROUTE_AVOID);
}

/**
 * Reachability inside one room at ONE fixed tide level. The room is pinned, so
 * there is no level axis in this state space — which is the point, and the
 * reason this tool is so much simpler than check-anchor.mjs.
 */
function flood(room, start, level) {
  const { grid, legend, W, H } = room;
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? null : defAt(legend, grid[y][x], level));
  const walk = (x, y) => walkableDef(at(x, y));

  const seen = new Set(), q = [];
  const push = (x, y) => { const k = x + ',' + y; if (!seen.has(k)) { seen.add(k); q.push([x, y]); } };
  if (!walk(start[0], start[1])) return seen;
  push(start[0], start[1]);

  while (q.length) {
    const [x, y] = q.pop();
    for (const [dx, dy, facing] of DIRS) {
      if (walk(x + dx, y + dy)) { push(x + dx, y + dy); continue; }

      // A ledge, taken in the face. Player.tryLedgeHop clears the lip plus any
      // further LEDGE tiles behind it, up to LEDGE_MAX_SPAN, and refuses to
      // fire unless the landing tile is standable.
      const lip = at(x + dx, y + dy);
      if (lip && (lip.flags & F.LEDGE) && lip.ledge === facing) {
        let n = 1;
        while (n < LEDGE_MAX_SPAN) {
          const d = at(x + dx * (n + 1), y + dy * (n + 1));
          if (!d || !(d.flags & F.LEDGE)) break;
          n++;
        }
        if (walk(x + dx * (n + 1), y + dy * (n + 1))) push(x + dx * (n + 1), y + dy * (n + 1));
        continue;
      }

      // A gap. Player.tryGapHop refuses once the run of JUMPABLE reaches
      // GAP_HOP_MAX_SPAN, so at the shipped value it clears exactly one tile.
      if (lip && (lip.flags & F.JUMPABLE) && !(lip.flags & F.NOFLY)) {
        let n = 1;
        while (n < GAP_HOP_MAX_SPAN) {
          const d = at(x + dx * (n + 1), y + dy * (n + 1));
          if (!d || !(d.flags & F.JUMPABLE)) break;
          n++;
        }
        if (n >= GAP_HOP_MAX_SPAN) continue;             // too wide to clear
        if (walk(x + dx * (n + 1), y + dy * (n + 1))) push(x + dx * (n + 1), y + dy * (n + 1));
      }
    }
  }
  return seen;
}

const has = (seen, [x, y]) => seen.has(x + ',' + y);

// --- collect the declared rooms --------------------------------------------
const rooms = [];
for (const [mapId, m] of MAPS) {
  for (const [key, def] of Object.entries(m.roomDefs || {})) {
    if (!def.lensRoom) continue;
    const sz = def.size || [1, 1];
    rooms.push({
      mapId, key, name: def.name || key,
      W: (sz[0] | 0) * 10, H: (sz[1] | 0) * 8,
      grid: def.map, legend: getLegend(def.legend || m.legend), def, L: def.lensRoom,
    });
  }
}

// A prover with nothing to prove passes vacuously and says nothing.
check('at least one room declares a Lens fork', rooms.length > 0, 'nothing to prove');

// The Lens is never a gate at region scope (docs/ITEMS.md), and this tool has
// no swimming in it, so a declaration outside the Lens's own dungeon is either
// a scope violation or a model the tool cannot honour. Either way, say so.
const strays = rooms.filter(r => r.mapId !== 'd2');
check('every declared Lens fork is inside the Lens\'s own dungeon', strays.length === 0,
  strays.map(r => `${r.mapId} ${r.key}`).join(', ') + ' — the Lens is never a gate outside D2');

// --- the proof --------------------------------------------------------------
for (const r of rooms) {
  const where = `${r.mapId} ${r.key} (${r.name})`;
  const { pin, reveals, decide, branches } = r.L;

  // 1. the room refuses the conch, and `reveals` is what a level-1 Lens draws
  check(`${where}: the room pins the tide, so the conch cannot preview it`,
    r.def.tideForce === pin,
    `tideForce=${r.def.tideForce}, pin=${pin}`);
  check(`${where}: the level it resolves at is the level the Lens shows`,
    reveals === (pin + 1) % 3,
    `pin=${LEVEL_NAME[pin]}, reveals=${LEVEL_NAME[reveals]}, Lens shows ${LEVEL_NAME[(pin + 1) % 3]}`);

  const fromDecide = flood(r, decide, pin);

  // 2. every branch is taken from the decision tile, and none of them leads back
  const unreached = branches.filter(b => !has(fromDecide, b.land));
  check(`${where}: every branch can be taken from the decision tile`,
    unreached.length === 0,
    unreached.map(b => b.name).join(', ') + ` not reachable from ${decide} at ${LEVEL_NAME[pin]}`);

  const leaksBack = [];
  const leaksAcross = [];
  for (const b of branches) {
    for (const lv of LEVELS) {
      const seen = flood(r, b.land, lv);
      if (has(seen, decide)) leaksBack.push(`${b.name}@${LEVEL_NAME[lv]}`);
      for (const o of branches) {
        if (o === b) continue;
        if (has(seen, o.land)) leaksAcross.push(`${b.name}->${o.name}@${LEVEL_NAME[lv]}`);
      }
    }
  }
  check(`${where}: no branch leads back to the decision tile`, leaksBack.length === 0,
    leaksBack.join(', ') + ' — the choice can be taken back, so it is not a choice');
  check(`${where}: no branch leads to another branch`, leaksAcross.length === 0,
    leaksAcross.join(', ') + ' — the player can walk round and try the other one');

  // 3. the pinned level answers nothing
  const earlyWins = branches.filter(b => has(flood(r, b.land, pin), b.onward));
  check(`${where}: no branch pays off at the level it is chosen at`, earlyWins.length === 0,
    earlyWins.map(b => b.name).join(', ') + ` reaches its way on at ${LEVEL_NAME[pin]}`);

  // 4. the choice matters one level up
  const winners = branches.filter(b => has(flood(r, b.land, reveals), b.onward));
  const losers = branches.filter(b => !winners.includes(b));
  check(`${where}: one level up, at least one branch pays off`, winners.length > 0,
    `no branch reaches its way on at ${LEVEL_NAME[reveals]} either — the room is a dead end`);
  check(`${where}: one level up, at least one branch does not`, losers.length > 0,
    'every branch works, so there is nothing to get wrong');

  // 5. indistinguishable where you decide, distinguishable one level up
  const atPin = branches.map(b => nameAt(r.legend, r.grid[b.probe[1]][b.probe[0]], pin));
  const same = atPin.every(n => n === atPin[0]);
  check(`${where}: every branch is the same tile where the player decides`, same,
    branches.map((b, i) => `${b.name}=${atPin[i]}`).join(', ') + ` at ${LEVEL_NAME[pin]}`);

  const atRev = branches.map(b => nameAt(r.legend, r.grid[b.probe[1]][b.probe[0]], reveals));
  const muddled = [];
  for (const w of winners) {
    for (const l of losers) {
      if (atRev[branches.indexOf(w)] === atRev[branches.indexOf(l)]) muddled.push(`${w.name}/${l.name}`);
    }
  }
  check(`${where}: one level up the Lens tells them apart`, muddled.length === 0,
    muddled.join(', ') + ` draw the same tile at ${LEVEL_NAME[reveals]}`);

  // 6. being wrong is a walk back, not a soft lock
  const trapped = losers.filter(b => !b.escape || !has(flood(r, b.land, reveals), b.escape));
  check(`${where}: the wrong branch is a cost, not a soft lock`, trapped.length === 0,
    trapped.map(b => b.name).join(', ') + ' has no way out at the level it resolves at');

  console.log(`       ${LEVEL_NAME[pin]}: ${branches.length} ways on, all drawn as ${atPin[0]}. `
    + `${LEVEL_NAME[reveals]}: ${winners.map(b => b.name).join(' / ') || 'none'} pays off; `
    + `${losers.map(b => `${b.name} (${atRev[branches.indexOf(b)]})`).join(', ') || 'none'} does not.`);
  if (VERBOSE) {
    for (const b of branches) {
      console.log(`         ${b.name}: land ${b.land}, probe ${b.probe} `
        + `(${nameAt(r.legend, r.grid[b.probe[1]][b.probe[0]], pin)} -> `
        + `${nameAt(r.legend, r.grid[b.probe[1]][b.probe[0]], reveals)}), way on ${b.onward}`);
    }
  }
}

console.log(`\n=== ${passed} passed, ${failures.length} failed ===`);
for (const f of failures) console.log('  ' + f);
process.exit(failures.length ? 1 : 0);
