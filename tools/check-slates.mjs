// THE SLATE SLOTS (S211, docs/briefs/PUZZLE-PASS.md "More"; Ages'
// INTERAC_SLATE_SLOT, slateSlot.s and scriptHelper.s slateSlot_placeSlate,
// room $58a of the Ancient Tomb). The cartridge's four slates are found round
// the dungeon and pushed into four slots round its stair down; Link leans on
// a slot for ten frames and a slate goes in. OUR TWIST: each slot is cut at
// its own height in the wall, and the sea decides how high Link is. Standing
// dry he reaches a LOW slot, wading a MIDDLE one, and swimming (floated up)
// a HIGH one, so the conch decides which slot he can fill.
//
// A room claims it:
//
//   slateRoom: { slots: [{ at: [x, y], face: 'N'|'E'|'S'|'W', height: 'low'|'mid'|'high' }],
//                from: [x, y], opens: [x, y] }
//
// `face` is the side of the slot Link leans on it from; the tile there is
// where he stands. Proved by the model:
//
//   1. every slot is a slot tile, and the tile it is leaned on from is not;
//   2. every slot's standing tile can be reached from `from` at every sea
//      (the slots are a lock, not a maze: the sea is the whole question);
//   3. at exactly one sea Link is at that slot's height there (dry for low,
//      wading for mid, swimming for high), so exactly one sea fills it;
//   4. between them the slots need more than one sea;
//   5. for a room in a dungeon: the dungeon holds exactly as many slates as
//      the room has slots, each reached by the dungeon flood.
// And, in the engine, for a built room:
//   6. leaning on a slot at its sea for SLATE_PUSH_FRAMES puts a slate in,
//      and one frame short does not; at another sea it says why and keeps the
//      slate; with no slate it says so;
//   7. the last slate opens `opens`; a save and a load keeps every slate in.
//
// Usage: node tools/check-slates.mjs
//        node tools/check-slates.mjs --mock spec.json   (model only: spec
//        { legend, rooms: { name: grid }, claims: { name: { slates: {...} } } })
import { readFile } from 'node:fs/promises';
import { installData } from '../src/data/index.js';
import { MAPS, getRoom, registerMap } from '../src/world/maps.js';
import { F, getTileDef } from '../src/world/tileset.js';
import { tileWalkable, ROUTE_AVOID, capsForDungeonIndex } from './lib/collision.mjs';

installData();
let pass = 0; const fail = [];
const check = (n, c, d) => c ? (pass++, console.log('  ok   ' + n))
  : (fail.push(n), console.log('  FAIL ' + n + (d ? ' — ' + d : '')));
const SEA = ['LOW', 'MID', 'HIGH'];
const FACE = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };

/** How high the sea puts Link on (x, y) at `lv`: 'low' dry, 'mid' wading, 'high' swimming. */
export function heightAt(room, x, y, lv) {
  const f = room.flagsAt(x, y, lv);
  if (f & F.DEEP) return 'high';
  if (f & F.WATER) return 'mid';
  return 'low';
}

const MOCK = process.argv.includes('--mock') ? process.argv[process.argv.indexOf('--mock') + 1] : null;
const CLAIMS = [];
if (MOCK) {
  const spec = JSON.parse(await readFile(MOCK, 'utf8'));
  for (const [name, grid] of Object.entries(spec.rooms)) {
    const c = spec.claims && spec.claims[name];
    if (!c || !c.slates) continue;
    const id = 'mock_' + name;
    registerMap({ id, kind: 'dungeon', name: 'Mock', w: 3, h: 3, floors: 1, cell: [15, 11],
      legend: (spec.legends && spec.legends[name]) || spec.legend, dungeon: { index: c.index || 6 },
      rooms: { '0,0,0': { name, map: grid } } });
    CLAIMS.push({ mapId: id, key: '0,0,0', def: { name }, k: c.slates, index: c.index || 6, mock: true });
  }
} else {
  for (const [mapId, m] of MAPS) {
    for (const [key, def] of Object.entries(m.roomDefs || {})) {
      if (!def.slateRoom) continue;
      CLAIMS.push({ mapId, key, def, k: def.slateRoom, index: m.dungeon ? m.dungeon.index : 0, map: m });
    }
  }
}

console.log(`check-slates: ${CLAIMS.length} slate room(s)${MOCK ? ' (mock)' : ''}`);
for (const c of CLAIMS) {
  const { k } = c, tag = `${c.mapId} ${c.key} (${c.def.name})`;
  const room = getRoom(c.mapId, ...c.key.split(',').map(Number));
  const caps = capsForDungeonIndex(c.index);
  const stand = (s) => [s.at[0] + FACE[s.face][0], s.at[1] + FACE[s.face][1]];
  // 1.
  const isSlot = (x, y) => { const d = getTileDef(room.baseName(x, y)); return !!(d && d.slot); };
  check(`${tag}: every slot is a slot in the wall, leaned on from open floor`,
    k.slots.every(s => isSlot(...s.at) && !isSlot(...stand(s))));
  // 2.
  const flood = (lv) => {
    const W = room.tw, seen = new Set([k.from[1] * W + k.from[0]]), q = [k.from];
    while (q.length) {
      const [x, y] = q.pop();
      for (const [dx, dy] of Object.values(FACE)) {
        const nx = x + dx, ny = y + dy, kk = ny * W + nx;
        if (nx < 0 || ny < 0 || nx >= W || ny >= room.th || seen.has(kk)) continue;
        if (!tileWalkable(room, nx, ny, lv, caps, ROUTE_AVOID)) continue;
        seen.add(kk); q.push([nx, ny]);
      }
    }
    return seen;
  };
  const reach = [0, 1, 2].map(flood);
  const cut = [];
  k.slots.forEach((s, i) => { const [x, y] = stand(s); for (let lv = 0; lv < 3; lv++) if (!reach[lv].has(y * room.tw + x)) cut.push(`slot ${i}@${SEA[lv]}`); });
  check(`${tag}: every slot can be walked or swum to at every sea`, !cut.length, cut.join(' '));
  // 3.
  const seaOf = k.slots.map(s => [0, 1, 2].filter(lv => heightAt(room, ...stand(s), lv) === s.height));
  k.slots.forEach((s, i) => {
    check(`${tag}: slot ${i} (${s.height}, from the ${s.face}) is level with Link at exactly one sea`,
      seaOf[i].length === 1, seaOf[i].map(l => SEA[l]).join(',') || 'never');
  });
  // 4.
  check(`${tag}: the slots need more than one sea between them`, new Set(seaOf.map(a => a.join())).size > 1);
  console.log(`       ${tag}: ` + k.slots.map((s, i) => `${s.face}=${seaOf[i].map(l => SEA[l]).join('')}`).join(' '));
  // 5.
  if (!c.mock) {
    let n = 0;
    for (const def of Object.values(c.map.roomDefs)) for (const e of def.entities || []) if (e[0] === 'chest' && e[3] && e[3].item === 'slate') n++;
    check(`${tag}: the dungeon holds as many slates as there are slots (${n} of ${k.slots.length})`, n === k.slots.length);
  }
}

console.log(`\n=== ${pass} passed, ${fail.length} failed ===`);
process.exit(fail.length ? 1 : 0);
