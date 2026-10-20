// Every crossing between screens round a set of overworld screens, per tide.
// NOT a checker — it asserts nothing; check-overworld is what proves seams.
// S197 wrote it to diff a region redraw: run it before and after, and only
// the region's own inner seams may change.
//
//   node tools/oneshot/dump-seams.mjs '0,4,3;0,5,3;...' > before.json
//
// Prints {"<room> <side> <neighbour>": "cell:tides ..."} for every seam of
// the listed screens (inner seams once), and on stderr any cell the two
// sides disagree on. Walkability is the engine's, via tools/lib/collision.mjs.
import { installData } from '../../src/data/index.js';
import { MAPS, getRoom } from '../../src/world/maps.js';
import { tileWalkable, ROUTE_AVOID } from '../lib/collision.mjs';
installData();
const CAPS = { jumping: false, swim: false, cutting: false };
const D = new Set(process.argv[2].split(';'));
const out = {};
const w = (r, x, y, t) => tileWalkable(r, x, y, t, CAPS, ROUTE_AVOID);
const lint = [];
for (const k of D) {
  const [, x, y] = k.split(',').map(Number);
  const r = getRoom('overworld', 0, x, y);
  // east and south seams, plus west/north if neighbour not in D
  const nb = [[1,0,'E'],[0,1,'S'],[-1,0,'W'],[0,-1,'N']];
  for (const [dx,dy,n] of nb) {
    const k2 = `0,${x+dx},${y+dy}`;
    if (!MAPS.get('overworld').roomDefs[k2]) continue;
    if ((n === 'W' || n === 'N') && D.has(k2)) continue;
    const r2 = getRoom('overworld', 0, x+dx, y+dy);
    const cells = [];
    for (let i = 0; i < (dx ? 8 : 10); i++) {
      const tides = [];
      for (const t of [0,1,2]) {
        let a, b;
        if (n==='E') { a = w(r,9,i,t); b = w(r2,0,i,t); }
        if (n==='W') { a = w(r,0,i,t); b = w(r2,9,i,t); }
        if (n==='S') { a = w(r,i,7,t); b = w(r2,i,0,t); }
        if (n==='N') { a = w(r,i,0,t); b = w(r2,i,7,t); }
        if (a && b) tides.push(t);
        if (a !== b) lint.push(`${k} ${n} cell ${i} tide ${t}: ${a}/${b}`);
      }
      if (tides.length) cells.push(i + ':' + tides.join(''));
    }
    out[`${k} ${n} ${k2}`] = cells.join(' ');
  }
}
console.log(JSON.stringify(out, null, 1));
if (lint.length) console.error('MISMATCH\n' + lint.join('\n'));
