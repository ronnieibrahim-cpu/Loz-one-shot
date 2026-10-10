// Our dungeons measured the same way as tools/oneshot/oracle-dungeon-stats.py
// (S179): rooms, screens, floors, enemies, chests, keys, puzzle rooms and the
// terrain families each room uses at any tide. Asserts nothing.
//   node tools/oneshot/our-dungeon-stats.mjs out.json
import { installData } from '../../src/data/index.js';
import { MAPS, getRoom } from '../../src/world/maps.js';
import { F } from '../../src/world/tileset.js';
import { writeFileSync } from 'node:fs';
installData();
const out = {};
const ENEMY_SKIP = new Set(['chest','pickup','switch','block','wheel','torch','valve','bell','sign']);
for (const m of MAPS.values()) {
  if (!m.dungeon) continue;
  const r = { floors: new Set(), rooms: 0, screens: 0, enemies: 0, chests: {}, keys: 0, puzzleRooms: 0, verbs: {}, terrain: {}, names: new Set(), minis: 0, readable: 0 };
  for (const [k, d] of Object.entries(m.roomDefs)) {
    const [f] = k.split(',').map(Number); r.floors.add(f); r.rooms++;
    const sz = d.size || [1, 1]; r.screens += sz[0] * sz[1];
    let puz = false;
    for (const e of d.entities || []) {
      const o = e[3] || {};
      if (e[0] === 'chest') { const c = o.item || o.pickup || (o.rupees ? 'rupees' : o.charm ? 'charm' : '?'); r.chests[c] = (r.chests[c] || 0) + 1; if (c === 'key') r.keys++; }
      else if (e[0] === 'pickup' && o.kind === 'key') r.keys++;
      else if (!ENEMY_SKIP.has(e[0])) r.enemies++;
      if (['switch','block','wheel','torch','valve'].includes(e[0])) { puz = true; r.verbs[e[0]] = (r.verbs[e[0]] || 0) + 1; }
    }
    if (d.puzzle) { puz = true; const p = d.puzzle; const kind = p.switches ? 'switches' : p.enemies ? 'clear-room' : p.torches ? 'torches' : Object.keys(p).filter(x => !['flag','reward'].includes(x)).join('+') || 'other';
      r.verbs['puzzle:' + kind] = (r.verbs['puzzle:' + kind] || 0) + 1;
      const sp = (p.reward && p.reward.spawn) || []; for (const s of sp) if (s[3] && s[3].kind === 'key') r.keys++; }
    for (const c of ['anchorGate','anchorGauges','lensRoom','lensHunt','cleatRoom','bellowsRoom','reefseedRoom','dredgeRoom','kilnRoom','coinRoom','whirlRoom','sunkPlates','tideForce']) if (d[c]) { puz = true; r.verbs[c] = (r.verbs[c] || 0) + 1; }
    if (puz) r.puzzleRooms++;
    if (d.readable) r.readable++;
    // terrain, across all three tides
    const room = getRoom(m.id, f, Number(k.split(',')[1]), Number(k.split(',')[2]));
    if (room) {
      const seen = new Set();
      for (let t = 0; t < 3; t++) for (let y = 0; y < room.th; y++) for (let x = 0; x < room.tw; x++) {
        const td = room.tile(x, y, t); const n = td.name || ''; const fl = td.flags | 0;
        let fam = null;
        if (fl & F.DEEP) fam = 'deep water'; else if (fl & F.WATER) fam = 'shallow water';
        if (/pit|hole|chasm|drain/i.test(n)) fam = 'pit/drain';
        if (/ledge/i.test(n)) fam = 'ledge';
        if (/current|riptide/i.test(n)) fam = 'current';
        if (/well/i.test(n)) fam = 'well';
        if (/spike/i.test(n)) fam = 'spikes';
        if (/stair/i.test(n)) fam = 'stairs';
        if (/crack/i.test(n)) fam = 'cracked/bombable';
        if (/whirl/i.test(n)) fam = 'whirlpool';
        if (/grate|bar|bole|snarl|shutter|gate/i.test(n)) fam = 'tide/item barrier';
        if (/lava|fire/i.test(n)) fam = 'lava';
        if (/ice/i.test(n)) fam = 'ice';
        if (/convey/i.test(n)) fam = 'conveyor';
        if (fam) seen.add(fam);
        r.names.add(n);
      }
      for (const s of seen) r.terrain[s] = (r.terrain[s] || 0) + 1;
    }
  }
  r.floors = r.floors.size; r.tileKinds = r.names.size; delete r.names;
  out[m.id] = r;
}
writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
for (const [k, v] of Object.entries(out)) console.log(k, JSON.stringify(v));
