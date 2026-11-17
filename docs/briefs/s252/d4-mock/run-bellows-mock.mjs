// Runs tools/check-bellows.mjs over PROPOSED rooms only (check-bellows has no
// --mock of its own). It empties the map table, registers each room of a spec
// as a one-room map of dungeon four (the Bellows' own dungeon), and then lets
// check-bellows run its usual claims over that table.
//
//   node docs/briefs/s252/d4-mock/run-bellows-mock.mjs option-a-bellows.json [more.json ...]
//
// spec: { legend, rooms: { name: grid }, bellowsRoom: {...} | [...], entities?: [...] }
// Nothing under src/ or tools/ is changed.
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const { installData } = await import(ROOT + '/src/data/index.js');
const { MAPS, registerMap } = await import(ROOT + '/src/world/maps.js');
installData();
MAPS.clear();

let n = 0;
for (const p of process.argv.slice(2)) {
  const spec = JSON.parse(await readFile(p, 'utf8'));
  for (const [name, grid] of Object.entries(spec.rooms)) {
    const ents = spec.entities || [['wheel', ...(Array.isArray(spec.bellowsRoom) ? spec.bellowsRoom[0].wheel : spec.bellowsRoom.wheel), { needTurns: 40 }]];
    registerMap({
      id: 'mock_d4_' + (n++), kind: 'dungeon', name: 'Mock ' + name, w: 1, h: 1, floors: 1, cell: [15, 11],
      legend: spec.legend, dungeon: { index: 4, item: 'bellows', itemLevel: 1 },
      rooms: { '0,0,0': { name, map: grid, bellowsRoom: spec.bellowsRoom, entities: ents } },
    });
  }
}
process.argv.length = 2;
await import(ROOT + '/tools/check-bellows.mjs');
