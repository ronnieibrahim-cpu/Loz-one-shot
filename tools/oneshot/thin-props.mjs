// Take the rows of four out of the overworld.
//
// Sixteen screens have their rocks laid out as `oooo` — four identical boulders
// in a straight line, and on five screens TWO such rows with an `o..o` between
// them, which is a hollow rectangle of boulders standing in the middle of open
// ground with the player walking about inside it. Six more do it with bushes
// and seven with posts. Thirty-two straight runs of three or more in all.
//
// The source games do not place props like this. A rock in Holodrum is one
// rock, or two, set against something — the foot of a cliff, the end of a
// hedge — and it is there to shape where you walk. A line of four in open sand
// is a fence, or a chessboard, and what it reads as from inside is Link
// standing on a field of rocks.
//
// So: no three props of the same kind in a straight line, anywhere. The rule is
// applied by removal only — nothing is moved, nothing is added — because a
// removed prop leaves ground the room already has, and a moved one is a new
// placement decision that wants an eye on it.
//
// WHICH ONE GOES is chosen to break the most runs at once, tie-broken by the
// project's own `hash32` so the answer is deterministic and is not the middle
// every time (removing the middle of every run leaves the ends, which is its
// own regular pattern — a row of gaps).
//
// WHAT IS NEVER TOUCHED:
//   * trees, which are 32x32 and are the border of nearly every screen — a
//     treeline is a wall and thinning it would open the world up;
//   * town screens, whose props sit inside authored building blocks;
//   * anything that is not one of the six prop characters below. Gates,
//     boulders, cracked cliffs and vanes are all single placements that mean
//     something, and none of them run in fours.
//
// Usage: node tools/oneshot/thin-props.mjs [--dry]
import { readFileSync, writeFileSync } from 'node:fs';
import { installData } from '../../src/data/index.js';
import { MAPS } from '../../src/world/maps.js';
import { hash32 } from '../../src/core/rng.js';

installData();
const DRY = process.argv.includes('--dry');

const W = 12, H = 10, RW = 10, RH = 8;
const m = MAPS.get('overworld');
const PROPS = new Set(['o', 'O', 'b', 'B', 'q', 'Q']);
const TOWN_LEGENDS = new Set(['town', 'townDunes']);
// The characters a removed prop may become: plain ground in every legend the
// overworld uses. A prop is replaced by whichever of these its own neighbours
// mostly are, so the hole it leaves is the ground already around it.
const GROUND = new Set(['g', 'G', 'f', 'v', '.', ',', ':', 'd', 'm', 'R', 'r']);

let removed = 0;
const touched = [];

for (let ry = 0; ry < H; ry++) for (let rx = 0; rx < W; rx++) {
  const key = `0,${rx},${ry}`;
  const def = m.roomDefs[key];
  if (TOWN_LEGENDS.has(def.legend || m.legend)) continue;
  const g = def.map.map(r => r.split(''));
  const before = def.map.slice();

  /** Every straight run of 3+ of `ch` still standing, as arrays of cells. */
  const runsOf = (ch) => {
    const out = [];
    for (let y = 0; y < RH; y++) {
      let run = [];
      for (let x = 0; x <= RW; x++) {
        if (x < RW && g[y][x] === ch) run.push([x, y]);
        else { if (run.length >= 3) out.push(run); run = []; }
      }
    }
    for (let x = 0; x < RW; x++) {
      let run = [];
      for (let y = 0; y <= RH; y++) {
        if (y < RH && g[y][x] === ch) run.push([x, y]);
        else { if (run.length >= 3) out.push(run); run = []; }
      }
    }
    return out;
  };

  /** The ground this cell should become: what its own neighbours mostly are. */
  const groundFor = (x, y) => {
    const n = new Map();
    for (const [dx, dy] of [[0, 1], [0, -1], [-1, 0], [1, 0]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= RW || ny >= RH) continue;
      const c = g[ny][nx];
      if (GROUND.has(c)) n.set(c, (n.get(c) || 0) + 1);
    }
    if (n.size) return [...n].sort((a, b) => (b[1] - a[1]) || (a[0] < b[0] ? -1 : 1))[0][0];
    // No plain ground beside it at all: fall back to the screen's commonest.
    const all = new Map();
    for (let j = 0; j < RH; j++) for (let i = 0; i < RW; i++) {
      const c = g[j][i];
      if (GROUND.has(c)) all.set(c, (all.get(c) || 0) + 1);
    }
    return all.size ? [...all].sort((a, b) => (b[1] - a[1]) || (a[0] < b[0] ? -1 : 1))[0][0] : 'g';
  };

  for (const ch of PROPS) {
    for (let guard = 0; guard < 40; guard++) {
      const runs = runsOf(ch);
      if (!runs.length) break;
      // Score every cell by how many live runs it would break, so one removal
      // can settle a row and a column at once.
      const score = new Map();
      for (const run of runs) {
        for (const [x, y] of run) {
          const k = `${x},${y}`;
          score.set(k, (score.get(k) || 0) + 1);
        }
      }
      let best = null, bestN = -1, bestH = -1;
      for (const [k, n] of score) {
        const [x, y] = k.split(',').map(Number);
        const h = hash32('propthin', key, x, y);
        if (n > bestN || (n === bestN && h > bestH)) { best = [x, y]; bestN = n; bestH = h; }
      }
      const [bx, by] = best;
      g[by][bx] = groundFor(bx, by);
      removed++;
    }
  }

  const after = g.map(r => r.join(''));
  if (after.some((r, i) => r !== before[i])) touched.push({ key, before, after });
}

console.log(`removed ${removed} prop cells from straight runs across ${touched.length} screens`);
for (const t of touched) {
  console.log(`  ${t.key}`);
  for (let i = 0; i < RH; i++) {
    if (t.before[i] !== t.after[i]) console.log(`     ${t.before[i]}  ->  ${t.after[i]}`);
  }
}
if (DRY) process.exit(0);

// ---- write it back --------------------------------------------------------
// Positional row replacement, for the reason recorded in HANDOFF: a screen with
// two identical rows had the wrong one rewritten when rows were matched by
// content.
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
