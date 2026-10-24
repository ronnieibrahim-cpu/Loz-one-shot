// scratch: run the cube model over a proposed grid. node tools/lib/cube-design.mjs spec.json
import { readFile } from 'node:fs/promises';
import { installData } from '../../src/data/index.js';
import { registerMap, getRoom } from '../../src/world/maps.js';
import { capsForDungeonIndex } from './collision.mjs';
import { makeCubeModel, describeCube } from './cube-flood.mjs';
installData();
const spec = JSON.parse(await readFile(process.argv[2], 'utf8'));
for (const [name, r] of Object.entries(spec.rooms)) {
  if (process.argv[3] && name !== process.argv[3]) continue;
  const grid = r.map, id = 'mockc_' + name;
  const size = grid[0].length > 15 || grid.length > 11 ? { size: [grid[0].length / 15, grid.length / 11] } : {};
  registerMap({ id, kind: 'dungeon', name: 'Mock', w: 3, h: 3, floors: 1, cell: [15, 11], legend: spec.legend,
    dungeon: { index: 4 }, rooms: { '0,0,0': { name, map: grid, ...size } } });
  const room = getRoom(id, 0, 0, 0);
  const caps = capsForDungeonIndex(4);
  const run = (o, sea) => makeCubeModel(room, r.cube, r.plates, { caps, ...o }).solve(r.from, sea, r.limit || 300000);
  console.log('==', name);
  for (const sea of [0, 1, 2]) {
    const s = run({ bellows: !!r.bellows }, sea);
    console.log(` start ${sea}:`, s ? (s.gaveUp ? 'GAVE UP ' + s.states : `${s.presses} presses ${s.moves} moves (${s.states} st)`) : 'NONE');
    if (s && !s.gaveUp && (sea === 0 || process.env.ALL)) console.log('   ', describeCube(s));
  }
  for (const fs of [0, 1, 2]) { const s = run({ bellows: !!r.bellows, fixedSea: fs }, 0); console.log(` fixed ${fs}:`, s ? (s.gaveUp ? 'gave up' : 'SOLVES ' + s.moves) : 'no'); }
  const nf = run({ bellows: !!r.bellows, noFloat: true }, 0); console.log(' noFloat:', nf ? (nf.gaveUp ? 'gave up' : 'SOLVES') : 'no');
  { const ns = run({ bellows: !!r.bellows, noStand: true }, 0); console.log(' noStand:', ns ? (ns.gaveUp ? 'gave up' : 'SOLVES') : 'no'); }
  if (r.bellows) { const nb = run({}, 0); console.log(' no bellows:', nb ? (nb.gaveUp ? 'gave up' : 'SOLVES') : 'no'); }
}
