// Scratch: print a room's grid and entity list. `node tools/oneshot/dump-rooms.mjs d6,1,3,1`
import { installData } from '../../src/data/index.js';
import { MAPS } from '../../src/world/maps.js';
installData();
for (const spec of process.argv.slice(2)) {
  const [mapId, ...rest] = spec.split(',');
  const key = rest.join(',');
  const m = MAPS.get(mapId);
  const d = m.roomDefs[key];
  console.log(`\n=== ${mapId}/${key}  ${d.name || ''}  legend=${d.legend || m.legend}`);
  console.log('    ' + [...Array((d.map[0] || '').length).keys()].join(''));
  d.map.forEach((r, i) => console.log(String(i).padStart(2) + '  ' + r));
  for (const e of d.entities || []) console.log('   ' + JSON.stringify(e));
}
