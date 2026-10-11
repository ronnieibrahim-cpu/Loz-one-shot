// Spike prover — the Cliffside Cistern's spike pools (S183). Plain Node.
//
// The Dancing Dragon's own spike floor (tileTypeMappings.s @dungeons: $60
// TILETYPE_SPIKE) does Seasons' damage and knock-back (Player.updateHazards,
// HAZARD_DAMAGE, SPIKE_*_FRAMES). Ours adds the SPIKE POOL, a tide tile: bare
// spikes at LOW and MID, deep water over them at HIGH — the top of the tide
// is the only sea it is safe at.
//
// WHAT IS PROVED
//   1. Every tile in the world that is spikes at some sea is a HAZARD there and
//      nothing else walkable, and every spike-pool tile (spikes at some sea and
//      not at all) is deep water at the seas it is not spikes.
//   2. Every room declaring `spikeRoom: { from, target, sea }`: within the
//      room, from `from`, `target` is reached at `sea` and at no other single
//      sea — on foot, swimming, or on the seafloor (the Cleats are held from
//      D3), with spikes as walls, the way the route planner treats them.
import { installData } from '../src/data/index.js';
import { MAPS, getRoom } from '../src/world/maps.js';
import { F } from '../src/world/tileset.js';
import { tileWalkable, ROUTE_AVOID, capsForDungeonIndex } from './lib/collision.mjs';

installData();
let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) { pass++; console.log('  ok   ' + msg); } else { fail++; console.log('  FAIL ' + msg); } };

let tiles = 0, pools = 0, bad = [];
const claims = [];
for (const m of MAPS.values()) {
  for (const [rk, def] of Object.entries(m.roomDefs || {})) {
    if (def.spikeRoom) claims.push({ m, rk, c: def.spikeRoom });
    if (m.kind !== 'dungeon') continue;
    const [f, rx, ry] = rk.split(',').map(Number);
    const room = getRoom(m.id, f, rx, ry);
    for (let y = 0; y < room.th; y++) for (let x = 0; x < room.tw; x++) {
      const at = [0, 1, 2].map(t => room.tile(x, y, t));
      const spiky = at.map(d => !!(d.flags & F.HAZARD) && /Spike/i.test(d.name || ''));
      if (!spiky.some(Boolean)) continue;
      tiles++;
      if (!spiky.every(Boolean)) {
        pools++;
        at.forEach((d, t) => { if (!spiky[t] && !(d.flags & F.DEEP)) bad.push(`${m.id} ${rk} ${x},${y} sea ${t}`); });
      }
    }
  }
}
ok(tiles > 0, `${tiles} spike tiles in the dungeons, ${pools} of them spike pools`);
ok(!bad.length, `every spike pool is deep water wherever it is not spikes${bad.length ? ': ' + bad.slice(0, 4).join('; ') : ''}`);

for (const { m, rk, c } of claims) {
  const [f, rx, ry] = rk.split(',').map(Number);
  const room = getRoom(m.id, f, rx, ry);
  const caps = capsForDungeonIndex(m.dungeon ? m.dungeon.index : 0);
  const reach = (t) => {
    const seen = new Set([c.from.join(',')]), q = [c.from];
    while (q.length) {
      const [x, y] = q.pop();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
        if (nx < 0 || ny < 0 || nx >= room.tw || ny >= room.th || seen.has(k)) continue;
        if (!tileWalkable(room, nx, ny, t, caps, ROUTE_AVOID)) continue;
        seen.add(k); q.push([nx, ny]);
      }
    }
    return seen.has(c.target.join(','));
  };
  for (const t of [0, 1, 2]) {
    if (t === c.sea) ok(reach(t), `${m.id} ${rk}: at sea ${t} ${c.target} is reached from ${c.from}`);
    else ok(!reach(t), `${m.id} ${rk}: at sea ${t} the spikes keep ${c.target} from ${c.from}`);
  }
}
console.log(`\n=== ${pass} passed, ${fail} failed ===`);
process.exit(fail ? 1 : 0);
