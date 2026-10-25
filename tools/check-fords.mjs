// THE FORDS (S210, docs/briefs/PUZZLE-PASS.md step 6's leftovers): a stake
// grown inside another puzzle. Until S210 five Shrine rooms were one sentence
// — throw a stake at HIGH, stand on it or push a block over it at LOW — and
// a pillar's other two lives (a wall at MID, deep water at HIGH) were in no
// puzzle at all. Every room declaring
//
//   fordRoom: { from: [x, y], seas: [..], stakes: [[x, y]], cut?: [x, y],
//               anchor?: { at, from, level }, without?: [what-if, ..] }
//
// is proved by the model (tools/lib/ford-flood.mjs: the engine's own
// collision, PushBlock / Statue / IceBlock rules and the seed's own flight):
//
//   1. it can be solved walking in from `from` at every sea;
//   2. no single sea solves it, and the fewest-press solution from LOW sounds
//      the conch for exactly `seas`;
//   3. it cannot be solved with no stake grown — the pillar is the puzzle;
//   4. every what-if the claim names in `without` leaves it unsolvable:
//      'pillarSoft' (a pillar never catches a seed or stops an ice block: its
//      MID wall is no part of it), 'statueWades' (a statue walks onto water:
//      the pillar is no road for it), 'noFall' (a block on a hole stays: the
//      drain is scenery), 'noAnchor';
//   5. a pillar grown anywhere else near the puzzle that a seed can reach, one
//      at a time, neither solves it at one sea nor saves a press;
//   6. no reachable state shuts Link in: from every one he can still get back
//      to `from`, walking or within a few moves.
//
// Usage: node tools/check-fords.mjs
//        node tools/check-fords.mjs --mock spec.json   (model only: spec
//        { legend, rooms: { name: grid }, claims: { name: { from, seas,
//        stakes, blocks?, ice?, statues?, plates?, cut?, anchor?, walls?,
//        noPlant?, without? } } })
import { readFile } from 'node:fs/promises';
import { installData } from '../src/data/index.js';
import { MAPS, getRoom, registerMap } from '../src/world/maps.js';
import { capsForDungeonIndex } from './lib/collision.mjs';
import { makeFordModel, describeFord } from './lib/ford-flood.mjs';

installData();

let pass = 0; const fail = [];
const check = (n, c, d) => c ? (pass++, console.log('  ok   ' + n))
  : (fail.push(n), console.log('  FAIL ' + n + (d ? ' — ' + d : '')));
const SEA = ['LOW', 'MID', 'HIGH'];

const arg = (f) => process.argv.includes(f) ? process.argv[process.argv.indexOf(f) + 1] : null;
const MOCK = arg('--mock'), ONLY = arg('--only');
const FAST = process.argv.includes('--fast');   // skip clauses 5 and 6 while drafting
const CLAIMS = [];
if (MOCK) {
  const spec = JSON.parse(await readFile(MOCK, 'utf8'));
  for (const [name, grid] of Object.entries(spec.rooms)) {
    const k = spec.claims && spec.claims[name];
    if (!k || !k.stakes || (ONLY && ONLY !== name)) continue;
    const id = 'mock_' + name;
    const w = Math.ceil(grid[0].length / 15), h = Math.ceil(grid.length / 11);
    registerMap({ id, kind: 'dungeon', name: 'Mock', w: w + 2, h: h + 2, floors: 1, cell: [15, 11], legend: k.legend || spec.legend,
      dungeon: { index: k.index || 5 }, rooms: { '0,0,0': { name, map: grid, size: [w, h] } } });
    CLAIMS.push({ mapId: id, key: '0,0,0', def: { name }, k, spec: k, index: k.index || 5 });
  }
} else {
  for (const [mapId, m] of MAPS) {
    for (const [key, def] of Object.entries(m.roomDefs || {})) {
      if (!def.fordRoom) continue;
      const ents = def.entities || [];
      const pz = def.puzzle || {};
      const spec = {
        ...def.fordRoom,
        blocks: ents.filter(e => e[0] === 'block').map(e => [e[1], e[2]]),
        ice: ents.filter(e => e[0] === 'iceblock').map(e => [e[1], e[2]]),
        statues: ents.filter(e => e[0] === 'statue').map(e => [e[1], e[2]]),
        plates: (pz.blocks || []).map(([x, y]) => ({ x, y })),
        cut: def.fordRoom.cut ? { snarl: def.fordRoom.cut } : null,
        walls: ents.filter(e => ['chest', 'torch', 'sign', 'cube'].includes(e[0])
          && !(e[3] && pz.flag && e[3].needFlag === pz.flag)).map(e => [e[1], e[2]]),
        noPlant: ents.filter(e => e[0] === 'switch' && !(e[3] && e[3].stake)).map(e => [e[1], e[2]]),
      };
      CLAIMS.push({ mapId, key, def, k: def.fordRoom, spec, index: m.dungeon ? m.dungeon.index : 0 });
    }
  }
  check('at least one room claims a ford', CLAIMS.length > 0);
}

for (const c of CLAIMS) {
  const name = `${c.mapId} ${c.key} (${c.def.name})`;
  const room = getRoom(c.mapId, ...c.key.split(',').map(Number));
  const caps = capsForDungeonIndex(c.index);
  const spec = { ...c.spec, cut: c.spec.cut && !c.spec.cut.snarl ? { snarl: c.spec.cut } : c.spec.cut };
  const model = (o = {}) => makeFordModel(room, spec, { caps, ...o });
  const run = (o, sea, limit) => model(o).solve(c.k.from, sea, limit);
  // 1.
  const starts = [0, 1, 2].map(sea => run({}, sea));
  check(`${name}: solvable walking in at LOW, MID and HIGH`, starts.every(r => r && !r.gaveUp),
    starts.map(r => (r ? (r.gaveUp ? 'gave up' : r.presses) : 'none')).join(' / '));
  const best = starts[0];
  let bestPresses = Infinity;
  if (best && !best.gaveUp) {
    bestPresses = best.presses;
    console.log(`       from LOW (${best.presses} presses, ${best.moves} moves, ${best.states} states): ${describeFord(best)}`);
    // 2.
    const seas = [...new Set([0, ...best.steps.filter(s => s.conch != null).map(s => s.conch)])].sort();
    check(`${name}: the fewest-press solution sounds the conch for ${c.k.seas.join('/')}`,
      JSON.stringify(seas) === JSON.stringify([...c.k.seas].sort()), JSON.stringify(seas));
  }
  for (const sea of [0, 1, 2]) {
    const r = run({ fixedSea: sea }, sea);
    check(`${name}: not with the sea held at ${SEA[sea]}`, !r || r.gaveUp, r && !r.gaveUp ? describeFord(r) : '');
  }
  // 3.
  {
    const r = [0, 1, 2].map(sea => run({ noStakes: true }, sea)).find(r => r && !r.gaveUp);
    check(`${name}: not with no stake grown`, !r, r ? describeFord(r) : '');
  }
  // 4.
  for (const w of c.k.without || []) {
    const r = [0, 1, 2].map(sea => run({ [w]: true }, sea)).find(r => r && !r.gaveUp);
    check(`${name}: not ${({ pillarSoft: 'if a pillar never stopped anything', statueWades: 'if the statue waded',
      noFall: 'if a block on a hole stayed', noAnchor: 'without the Anchor' })[w] || w}`, !r, r ? describeFord(r) : '');
  }
  // 5.
  if (!FAST) {
    // Near the puzzle: within four tiles of a stake, a block, a statue, a
    // plate, the snarl or the Anchor. A pillar further off is only a wall at
    // MID in open floor, which can take a way from Link but give him none.
    const near = [...(spec.stakes || []), ...(spec.blocks || []), ...(spec.ice || []), ...(spec.statues || []),
      ...(spec.plates || []).map(p => [p.x, p.y]), ...(spec.cut ? [spec.cut.snarl] : []),
      ...(spec.anchor ? [spec.anchor.at] : [])];
    const cells = model().seedCells(c.k.from).filter(([x, y]) => !(c.spec.stakes || []).some(s => s[0] === x && s[1] === y)
      && near.some(([nx, ny]) => Math.max(Math.abs(nx - x), Math.abs(ny - y)) <= 4));
    const bad = [];
    for (const cell of cells) {
      const m = model({ stray: [cell] });
      const r = m.solve(c.k.from, 0, 150000);
      if (r && !r.gaveUp && r.presses < bestPresses) bad.push(`${cell}: ${r.presses} presses`);
      for (const sea of [0, 1, 2]) {
        const f = model({ stray: [cell], fixedSea: sea }).solve(c.k.from, sea, 150000);
        if (f && !f.gaveUp) bad.push(`${cell}: solved at ${SEA[sea]} alone`);
      }
    }
    check(`${name}: no stray pillar (${cells.length} cells a seed reaches) saves a press or solves it at one sea`,
      bad.length === 0, bad.slice(0, 4).join('; '));
  }
  // 6.
  if (!FAST) {
    const states = [];
    const m = makeFordModel(room, { ...spec, plates: [{ x: -1, y: -1 }], cut: null }, {
      caps, visit: (s) => states.push(s) });
    for (const sea of [0, 1, 2]) m.solve(c.k.from, sea, 60000);
    let stuck = null;
    for (const s of states) if (!m.canLeave(s, c.k.from, c.k.trapDepth || 3)) { stuck = s; break; }
    check(`${name}: no reachable state shuts Link in (${states.length} states)`, !stuck, stuck ? JSON.stringify(stuck) : '');
  }
}

console.log(`\n=== ${pass} passed, ${fail.length} failed ===`);
process.exit(fail.length ? 1 : 0);
