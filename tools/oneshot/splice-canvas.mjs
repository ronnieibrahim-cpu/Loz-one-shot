// Splice a hand-drawn CANVAS of several overworld screens into overworld.js.
// S197 drew the Drowned Wood's edges this way: two neighbouring screens drawn
// as one picture, so a pond or a trail can run across the edge between them.
//
//   node tools/oneshot/splice-canvas.mjs canvas.txt 4,5 3,4,5,6
//
// canvas.txt: rows of 2-letter groups ("TT gg .. | gg ..", spaces and | are
// ignored), 8 rows per screen row and 10 characters per screen. Each named
// room's `map` is replaced. It then lints the TREE LATTICE (Room.drawQuads):
// a tree is drawn per fixed 2x2 block (even x, even y), so every T must sit
// in a block whose top row is TT, and no rock, bush or cliff may share one.
import { readFileSync, writeFileSync } from 'node:fs';
const [file, cols, rows] = [process.argv[2], process.argv[3].split(',').map(Number), process.argv[4].split(',').map(Number)];
const lines = readFileSync(file, 'utf8').split('\n').filter(l => l.trim()).map(l => l.replace(/[ |]/g, ''));
if (lines.length !== rows.length * 8) throw new Error('rows ' + lines.length);
for (const l of lines) if (l.length !== cols.length * 10) throw new Error('width ' + l);
let src = readFileSync('src/data/overworld.js', 'utf8');
rows.forEach((ry, j) => cols.forEach((rx, i) => {
  const key = `'0,${rx},${ry}': {`;
  const at = src.indexOf(key); if (at < 0) throw new Error(key);
  const ms = src.indexOf('map: [', at), me = src.indexOf(']', ms);
  const ind = src.slice(src.lastIndexOf('\n', ms) + 1, ms);
  const grid = lines.slice(j * 8, j * 8 + 8).map(l => l.slice(i * 10, i * 10 + 10));
  src = src.slice(0, ms) + 'map: [\n' + grid.map(g => `${ind}  '${g}',`).join('\n') + '\n' + ind + src.slice(me);
}));
writeFileSync('src/data/overworld.js', src);
// lattice lint
lines.forEach((l, y) => [...l].forEach((c, x) => {
  if (c !== 'T') return;
  const bx = x & ~1, by = y & ~1;
  if (lines[by][bx] !== 'T' || lines[by][bx + 1] !== 'T') console.log(`lint: tree at ${x},${y} block top not TT`);
  for (const [ox, oy] of [[0,0],[1,0],[0,1],[1,1]]) { const d = lines[by+oy][bx+ox]; if ('ob#Db'.includes(d) && d !== 'T') console.log(`lint: ${d} in tree block at ${bx+ox},${by+oy}`); }
}));
