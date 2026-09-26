// WIDEN THE OVERWORLD (S157): insert whole columns of screens so the towns can
// be the size of the source games' towns. The human chose Horon's size for
// Tidewatch (five screens by two) and three screens for Sandpiper Row, which
// is three new columns after the village (old x=5) and two after Sandpiper
// Row (old x=9): 12 screens across becomes 17.
//
// A column cannot be inserted in two rows only — the grid is a grid, and a
// screen's north and south neighbours are the screens at the same x — so
// every row gets the new cells. This script does the mechanical half:
//
//   1. SHIFT every reference to an overworld screen east of an insertion:
//      room keys, warps back out of dungeons, caves and houses, the new-game
//      position and respawn, test setups, the playthrough route's `travel`
//      steps that are taken ON THE OVERWORLD (a `travel` inside a dungeon
//      names a dungeon room and must not move — the route's own trace says
//      which map each step starts in), the strands baseline, the room audit.
//   2. FILL each new cell with a PLACEHOLDER that carries the old crossing
//      through: every tile row is the west neighbour's east-edge tile,
//      repeated. So a crossing that was open at rows 2-5 at MID is open at
//      rows 2-5 at MID across the new screens, and nothing new connects to
//      anything. Placeholders are scaffolding: each is re-authored by hand.
//
//   node tools/oneshot/widen-overworld.mjs <route-trace.txt>
//
// The trace is `node tools/route-prefix.mjs 0 > trace.txt`, taken BEFORE the
// widening. Running this twice widens twice: it refuses if OVERWORLD_W is not
// the width it expects.
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');
const OLD_W = 12;
const INSERTS = [{ after: 5, count: 3 }, { after: 9, count: 2 }];
const NEW_W = OLD_W + INSERTS.reduce((a, i) => a + i.count, 0);
const sx = (x) => x + INSERTS.filter(i => x > i.after).reduce((a, i) => a + i.count, 0);

const read = (p) => readFile(join(ROOT, p), 'utf8');
const write = (p, s) => writeFile(join(ROOT, p), s);
const changed = [];
async function edit(p, fn) {
  const a = await read(p); const b = fn(a);
  if (a !== b) { await write(p, b); changed.push(p); }
}

// ---------------------------------------------------------------- rules
const R_WARP = /(map:\s*'overworld',\s*floor:\s*0,\s*rx:\s*)(\d+)/g;          // { map: 'overworld', floor: 0, rx: N
const R_ENTER = /((['"])overworld\2,\s*0,\s*)(\d+)(,\s*\d+)/g;                   // 'overworld', 0, x, y
const shiftWarp = (s) => s.replace(R_WARP, (m, a, x) => a + sx(+x));
const shiftEnter = (s) => s.replace(R_ENTER, (m, a, q, x, rest) => a + sx(+x) + rest);

const ow = await read('src/data/overworld.js');
if (!ow.includes(`export const OVERWORLD_W = ${OLD_W};`)) throw new Error('OVERWORLD_W is not ' + OLD_W + ' — already widened?');

// ------------------------------------------------ 1a. the overworld file
// Read the rooms BEFORE the edit, for the placeholders.
const { OVERWORLD_ROOMS: OLD } = await import(join(ROOT, 'src/data/overworld.js'));

await edit('src/data/overworld.js', (s) => {
  s = s.replace(`export const OVERWORLD_W = ${OLD_W};`, `export const OVERWORLD_W = ${NEW_W};`);
  // Room keys: two spaces deep inside `const rooms = {`.
  s = s.replace(/^( {2}')0,(\d+),(\d+)(':)/gm, (m, a, x, y, b) => `${a}0,${sx(+x)},${y}${b}`);
  // A house's way back out: `home(..., [...], { rx: 4, ry: 7, px, py })`.
  s = s.replace(/(\],\s*\{\s*rx:\s*)(\d+)(,\s*ry:)/g, (m, a, x, b) => a + sx(+x) + b);
  s = shiftWarp(s);
  return s;
});

// ------------------------------------------------ 1b. everything else in src
async function walk(dir, ext) {
  const out = [];
  for (const e of await readdir(join(ROOT, dir), { withFileTypes: true })) {
    const p = dir + '/' + e.name;
    if (e.isDirectory()) out.push(...await walk(p, ext));
    else if (ext.some(x => e.name.endsWith(x))) out.push(p);
  }
  return out;
}
for (const p of await walk('src', ['.js'])) {
  if (p === 'src/data/overworld.js') continue;
  await edit(p, (s) => shiftEnter(shiftWarp(s)));
}
for (const p of await walk('tools', ['.mjs'])) {
  if (p.startsWith('tools/oneshot/') || p === 'tools/playthrough-route.mjs') continue;
  await edit(p, (s) => shiftEnter(shiftWarp(s)));
}
// Named town keys in the town checker.
await edit('tools/check-towns.mjs', (s) => s.replace(/(key: '0,)(\d+)(,\d+')/g, (m, a, x, b) => a + sx(+x) + b));
// The strands baseline and the room audit key rooms as "0,x,y".
await edit('tools/strands-baseline.json', (s) => s.replace(/"0,(\d+),(\d+):/g, (m, x, y) => `"0,${sx(+x)},${y}:`)
  .replace(/ 0,(\d+),(\d+):/g, (m, x, y) => ` 0,${sx(+x)},${y}:`));
await edit('docs/AUDITED-ROOMS.md', (s) => s.replace(/^\|\s*0,(\d+),(\d+)\s*\|/gm, (m, x, y) => `| 0,${sx(+x)},${y} |`));
// Replay SETUPS enter the overworld with ["overworld",0,x,y,...]; the recorded
// checkpoints are re-recorded, not rewritten.
for (const p of await walk('tools/replays', ['.json'])) await edit(p, shiftEnter);

// ------------------------------------------------ 1c. the playthrough route
// Map at the START of directive i = the room the trace says directive i-1 left
// the player in.
const trace = await readFile(process.argv[2], 'utf8');
const after = [];
for (const line of trace.split('\n')) {
  const m = line.match(/^\s*(\d+)\s+\S+\s+f\s*\d+\s+(\S+)\s/);
  if (m) after[+m[1]] = m[2];
}
const { ROUTE } = await import(join(ROOT, 'tools/playthrough-route.mjs'));
const travelMaps = [];
ROUTE.forEach((d, i) => { if (d[0] === 'travel') travelMaps.push(i === 0 ? 'overworld' : after[i - 1]); });
if (travelMaps.some(m => !m)) throw new Error('the trace does not cover every travel step');
await edit('tools/playthrough-route.mjs', (s) => {
  let k = 0;
  const t = s.replace(/(\['travel',\s*)(\d+)(,\s*\d+)/g, (m, a, x, b) => {
    const map = travelMaps[k++];
    return map === 'overworld' ? a + sx(+x) + b : m;
  });
  if (k !== travelMaps.length) throw new Error(`route has ${k} travel steps in text, ${travelMaps.length} in ROUTE`);
  return t;
});

// ------------------------------------------------ 2. the placeholders
const oldAt = (x, y) => OLD[`0,${x},${y}`];
const newCols = [];
for (const ins of INSERTS) for (let c = 1; c <= ins.count; c++) newCols.push({ x: sx(ins.after) + c, west: ins.after });
let block = '\n  // ---- S157: the widened columns ----------------------------------------\n'
  + '  // PLACEHOLDERS, written by tools/oneshot/widen-overworld.mjs. Each tile row\n'
  + '  // is its west neighbour\'s east-edge tile repeated, so every crossing the old\n'
  + '  // seam had is carried through at the same rows and the same tides, and\n'
  + '  // nothing new connects to anything. Every one is to be re-authored by hand.\n';
for (const { x, west } of newCols) {
  for (let y = 0; y < 10; y++) {
    const W = oldAt(west, y);
    const map = W.map.map(row => row[row.length - 1].repeat(10));
    block += `  '0,${x},${y}': {\n    name: ${JSON.stringify(W.name)},\n    legend: ${JSON.stringify(W.legend || 'coast')},`
      + (W.music ? ` music: ${JSON.stringify(W.music)},` : '') + '\n    placeholder: true,\n    map: [\n'
      + map.map(r => `      ${JSON.stringify(r).replace(/"/g, "'")},`).join('\n') + '\n    ],\n  },\n';
  }
}
await edit('src/data/overworld.js', (s) => {
  const end = s.indexOf('\n};\n', s.indexOf('const rooms = {'));
  return s.slice(0, end) + '\n' + block.replace(/\n$/, '') + s.slice(end);
});

console.log(`widened ${OLD_W} -> ${NEW_W}; changed:\n  ` + changed.join('\n  '));
