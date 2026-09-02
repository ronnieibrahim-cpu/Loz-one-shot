// Take the one-tile ground specks out of the overworld.
//
// There are no transition tiles between two grounds — a boundary between grass
// and sand is a straight pixel edge — so a single tile of one material inside
// another does not read as a patch of anything. It reads as a mistake, and at
// 16x16 it is exactly the size of the thing the player is looking at.
//
// A SPECK IS NOT A BEACH. What is removed here is deliberately the narrowest
// case: a connected run of one or two tiles of a ground whose PALETTE nothing
// else on that screen shares nearby, that touches no water at any tide level,
// and that does not touch the screen's border — because a border patch is the
// corner of the next screen's beach and is that screen's to answer for. Sand
// beside a channel is a shore and stays; sand alone in a lawn goes.
//
// It is applied by RE-LETTERING, never by moving or deleting anything: the
// speck becomes whichever plain-ground character its own neighbours mostly
// are, which is a ground the screen already has. Passability cannot change,
// because every character involved is plain ground with no flags.
//
// Usage: node tools/oneshot/despeckle-ground.mjs [--dry]
import { readFileSync, writeFileSync } from 'node:fs';
import { installData } from '../../src/data/index.js';
import { MAPS, getRoom } from '../../src/world/maps.js';
import { F, getTileDef } from '../../src/world/tileset.js';

installData();
const DRY = process.argv.includes('--dry');
const RW = 10, RH = 8;

// The plain-ground characters a speck may be re-lettered to. Every legend maps
// these to something flagless, so the substitution cannot change what can be
// walked on; which of them wins is decided by the speck's own neighbours.
const GROUND = new Set(['g', 'G', 'f', 'v', '.', ',', ':', 'd', 'm', 'R', 'r']);

const m = MAPS.get('overworld');
const touched = [];
let specks = 0;

for (const [key, def] of Object.entries(m.roomDefs)) {
  const room = getRoom('overworld', ...key.split(',').map(Number));
  if (!room) continue;
  const g = def.map.map(r => r.split(''));
  const before = def.map.slice();

  // What the engine paints, per cell: null for anything that is not ground.
  const pal = [];
  const wet = [];
  for (let y = 0; y < RH; y++) {
    pal.push([]); wet.push([]);
    for (let x = 0; x < RW; x++) {
      const d = room.tile(x, y, 1);
      // WET AT ANY LEVEL, not at this one: a sandbar is dry at LOW and deep at
      // HIGH, and sand beside it is a shore at every level in between.
      wet[y].push([0, 1, 2].some(t => room.tile(x, y, t).flags & F.WET));
      if (d.flags & (F.VOID | F.SOLID | F.WARP | F.WET)) { pal[y].push(null); continue; }
      pal[y].push((d.underArt ? room.underGround(d, x, y, 1) : d).pal);
    }
  }

  const seen = new Set();
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
    const p = pal[y][x];
    if (p == null || seen.has(`${x},${y}`)) continue;
    const q = [[x, y]], cells = [];
    seen.add(`${x},${y}`);
    while (q.length) {
      const [cx, cy] = q.pop();
      cells.push([cx, cy]);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= RW || ny >= RH) continue;
        if (pal[ny][nx] !== p || seen.has(`${nx},${ny}`)) continue;
        seen.add(`${nx},${ny}`); q.push([nx, ny]);
      }
    }
    if (cells.length > 2) continue;
    if (cells.some(([cx, cy]) => cx === 0 || cy === 0 || cx === RW - 1 || cy === RH - 1)) continue;
    // Touching water at any tide: this is a shore, and a shore is the one place
    // a different ground belongs.
    const shore = cells.some(([cx, cy]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
      const nx = cx + dx, ny = cy + dy;
      return nx >= 0 && ny >= 0 && nx < RW && ny < RH && wet[ny][nx];
    }));
    if (shore) continue;
    // Only re-letter cells that ARE plain ground in the grid. A prop standing
    // on the wrong ground is check-ground.mjs's business, not this tool's.
    if (!cells.every(([cx, cy]) => GROUND.has(g[cy][cx]))) continue;

    // What the neighbours mostly are, counted over the whole patch.
    const votes = new Map();
    for (const [cx, cy] of cells) {
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= RW || ny >= RH) continue;
        if (cells.some(([ax, ay]) => ax === nx && ay === ny)) continue;
        const ch = g[ny][nx];
        if (!GROUND.has(ch)) continue;
        if (pal[ny][nx] === p) continue;
        votes.set(ch, (votes.get(ch) || 0) + 1);
      }
    }
    if (!votes.size) continue;
    const win = [...votes].sort((a, b) => (b[1] - a[1]) || (a[0] < b[0] ? -1 : 1))[0][0];
    for (const [cx, cy] of cells) g[cy][cx] = win;
    specks++;
  }

  const after = g.map(r => r.join(''));
  if (after.some((r, i) => r !== before[i])) touched.push({ key, before, after });
}

console.log(`${specks} ground speck(s) re-lettered across ${touched.length} screen(s)`);
for (const t of touched) {
  console.log(`  ${t.key}`);
  for (let i = 0; i < RH; i++) if (t.before[i] !== t.after[i]) console.log(`     ${t.before[i]}  ->  ${t.after[i]}`);
}
if (DRY) process.exit(0);

// ---- write it back --------------------------------------------------------
// Positional row replacement: a screen with two identical rows had the wrong
// one rewritten when rows were matched by content (docs/HANDOFF.md).
const FILE = 'src/data/overworld.js';
let text = readFileSync(FILE, 'utf8');
for (const t of touched) {
  const i = text.indexOf(`'${t.key}': {`);
  if (i < 0) throw new Error(`no room block for ${t.key}`);
  const j = text.indexOf('\n  },', i);
  const body = text.slice(i, j);
  const ms = body.indexOf('map: [');
  const me = body.indexOf('],', ms);
  let row = 0;
  const nseg = body.slice(ms, me).replace(/'[^']*'/g, (lit) => (row < RH ? `'${t.after[row++]}'` : lit));
  if (row !== RH) throw new Error(`${t.key}: found ${row} rows in its map array`);
  text = text.slice(0, i) + body.slice(0, ms) + nseg + body.slice(me) + text.slice(j);
}
writeFileSync(FILE, text);
console.log(`rewrote ${touched.length} screens in ${FILE}`);
