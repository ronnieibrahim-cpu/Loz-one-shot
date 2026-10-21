// Scratch: one line per room of a map — key, name, size, and what it holds
// (chests, keys, signs, bosses). `node tools/oneshot/list-rooms.mjs d6`
import { installData } from '../../src/data/index.js';
import { MAPS } from '../../src/world/maps.js';
installData();
const m = MAPS.get(process.argv[2]);
for (const [k, d] of Object.entries(m.roomDefs)) {
  const ents = (d.entities || []).map(e => {
    const o = e[3] || {};
    const what = o.item || o.charm || o.pickup || o.kind || o.text || o.say || o.dialogue || '';
    return `${e[0]}@${e[1]},${e[2]}${what ? '[' + String(what).slice(0, 60) + ']' : ''}${o.needFlag ? '{needFlag ' + o.needFlag + '}' : ''}`;
  });
  const extra = ['puzzle', 'holdRoom', 'dredgeRoom', 'reward', 'boss', 'miniboss', 'size']
    .filter(f => d[f]).map(f => f + '=' + JSON.stringify(d[f]).slice(0, 160));
  console.log(`${k}  ${d.name || ''}  ${d.w || 1}x${d.h || 1}\n   ${ents.join(' ')}\n   ${extra.join(' ')}`);
}
