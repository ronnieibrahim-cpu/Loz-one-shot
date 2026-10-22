// Print an overworld room definition without its map (S203): every claim,
// script, warp and entity, to read before redrawing the screen.
//   node tools/oneshot/room-info.mjs 0,4,0 0,5,0
import { installData } from '../../src/data/index.js';
import { MAPS } from '../../src/world/maps.js';
installData();
const defs = MAPS.get('overworld').roomDefs;
for (const k of process.argv.slice(2)) {
  const d = { ...defs[k] }; delete d.map;
  console.log(k, JSON.stringify(d, (kk, v) => typeof v === 'function' ? 'fn' : v));
}
