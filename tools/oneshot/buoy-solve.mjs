// Scratch (S201): for a drafted bay, where Link can stand at each sea and
// which buoys the Resonance Rod reaches from there. Asserts nothing.
//   node tools/oneshot/buoy-solve.mjs draft.json
// draft.json: { room: '0,15,9', map: [8 rows], buoys: [[x,y],...] }
import { readFileSync } from 'node:fs';
import { installData } from '../../src/data/index.js';
import { MAPS, getRoom } from '../../src/world/maps.js';
import { tileWalkable, ROUTE_AVOID } from '../lib/collision.mjs';
import { ROD_RANGE, ROD_RANGE_HIGH } from '../../src/data/feel.js';
installData();
const d = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const def = MAPS.get('overworld').roomDefs[d.room];
if (d.map) def.map = d.map;
const [, rx, ry] = d.room.split(',').map(Number);
const room = getRoom('overworld', 0, rx, ry);
const names = 'ABCDEFGH';
const DUMP = process.argv[3] === '--reach';
const CAPS = { jumping: false, swim: false, cutting: false };
// On foot from the seam at the top of the screen, per sea.
function flood(tide) {
  const seen = new Set(), q = [];
  for (let x = 0; x < 10; x++) if (tileWalkable(room, x, 0, tide, CAPS, ROUTE_AVOID)) { seen.add(`${x},0`); q.push([x, 0]); }
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
      if (nx < 0 || ny < 0 || nx > 9 || ny > 7 || seen.has(k)) continue;
      if (!tileWalkable(room, nx, ny, tide, CAPS, ROUTE_AVOID)) continue;
      seen.add(k); q.push([nx, ny]);
    }
  }
  return seen;
}
if (DUMP) { console.log(JSON.stringify([0, 1, 2].map(t => [...flood(t)]))); process.exit(0); }
for (const tide of [0, 1, 2]) {
  const range = tide >= 2 ? ROD_RANGE_HIGH : ROD_RANGE;
  console.log(`\n-- tide ${tide} (reach ${range / 16} tiles)`);
  const solo = {};
  const rows = [];
  const reach = flood(tide);
  for (let y = 0; y < 8; y++) {
    let s = '';
    for (let x = 0; x < 10; x++) {
      const ok = reach.has(`${x},${y}`);
      if (!ok) { s += d.buoys.some(([bx, by]) => bx === x && by === y) ? 'o' : '#'; continue; }
      const hit = d.buoys.map(([bx, by], i) => Math.hypot(bx - x, by - y) * 16 <= range ? names[i] : '').join('');
      if (hit.length === 1) (solo[hit] = solo[hit] || []).push(`${x},${y}`);
      s += hit.length === 0 ? '.' : hit.length === 1 ? hit : hit.length === d.buoys.length ? '*' : String(hit.length);
    }
    rows.push(s);
  }
  rows.forEach((r, i) => console.log(i + ' ' + r));
  for (const k of names.slice(0, d.buoys.length)) console.log(`  ${k} alone from: ${(solo[k] || []).join(' ') || '—'}`);
}
