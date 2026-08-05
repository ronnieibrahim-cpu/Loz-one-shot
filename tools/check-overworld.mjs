// Overworld checker. Plain Node, no browser.
//
// Asserts all 120 screens exist, every seam's walkable edge tiles agree at all
// three tide levels, the world border is solid, and a TILE-BY-TILE flood from
// Tidewatch Village reaches every screen. Tile-by-tile matters: a screen-level
// flood misses an interior wall stranding an exit.
//
// The flood treats a tile as passable if it is walkable at ANY tide level — the
// player controls the tide — which is also why this cannot prove the swim or
// feather gates, only the ones expressed as a solid tile with a flag.
//
// THREE such gates exist, and this proves each one twice: that the region is
// sealed without its item, and that it opens with it.
//   Bombs           F.BOMBABLE   Sunken Marsh
//   Magic Boomerang F.VANE       Salt Pans
//   Magnetic Gloves F.MAGNETIC   Abyssal approach
//
// Usage: node check-overworld.mjs [--bombs] [--items=bombs,boomerang,magnet]
// `--bombs` is kept as an alias for `--items=bombs`.

import { installData } from '../src/data/index.js';
import { MAPS } from '../src/world/maps.js';
import { getLegend } from '../src/world/room.js';
import { getTileDef, F } from '../src/world/tileset.js';

installData();
// Each gate: the flag its tile carries, and the region it holds shut.
// `covers` is every screen the gate may legitimately shut: its own region, plus
// any region that can ONLY be entered through it. The Salt Pans gate covers the
// Reef Palace too, because the Palace's own gate is the Hookshot and the
// Hookshot is in D6, inside the Pans — so the whole branch hangs off one vane.
// Asserting the sealed set falls inside `covers` is the point: "the count went
// down" also passes when a gate accidentally strands an unrelated corner.
const GATES = {
  bombs: {
    flag: F.BOMBABLE, region: 'Sunken Marsh',
    covers: [[0, 2, 6, 9]],
  },
  boomerang: {
    flag: F.VANE, region: 'Salt Pans',
    covers: [[4, 7, 0, 2], [8, 11, 0, 3]],
  },
  magnet: {
    flag: F.MAGNETIC, region: 'Abyssal approach',
    covers: [[0, 3, 0, 1]],
  },
  feather: {
    flag: F.GAP, region: 'Coral Reef',
    covers: [[8, 11, 4, 6]],
  },
  bracelet: {
    flag: F.HEAVY, region: 'Cliffs of Kell',
    // The Cliffs are the only way up to the Abyssal approach, and the Marsh's
    // two northern screens hang off the Bog Stair rather than off the Marsh
    // proper, so both sit behind this gate as well.
    covers: [[0, 3, 2, 5], [0, 3, 0, 1], [0, 2, 6, 6]],
  },
};
const covered = (g, k) => {
  const [, x, y] = k.split(',').map(Number);
  return GATES[g].covers.some(([x0, x1, y0, y1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1);
};
const ALL = Object.keys(GATES);
const argItems = process.argv.find(a => a.startsWith('--items='));
let HELD = argItems ? argItems.slice(8).split(',').filter(Boolean)
         : process.argv.includes('--bombs') ? ['bombs'] : [];
for (const it of HELD) if (!GATES[it]) { console.error(`unknown item '${it}'`); process.exit(2); }
const BOMBS = HELD.includes('bombs');
// The mask of gate flags the current run may walk through.
let openMask = HELD.reduce((m, it) => m | GATES[it].flag, 0);
const W = 10, H = 8, OW = 12, OH = 10;
const m = MAPS.get('overworld');

let pass = 0; const fail = [];
const check = (n, c, d) => c ? pass++ : (fail.push(n + (d ? ' — ' + d : '')), console.log('  FAIL ' + n + (d ? ' — ' + d : '')));

const legendOf = (def) => getLegend(def.legend || m.legend);
function defAt(legend, ch, tide) {
  let d = getTileDef(legend[ch]);
  for (let i = 0; i < 4 && d && d.tide; i++) d = getTileDef(d.tide[tide]);
  return d;
}
function walkableAt(legend, ch, tide) {
  const d = defAt(legend, ch, tide);
  if (!d) return false;
  if (openMask && (d.flags & openMask)) return true;
  return !(d.flags & (F.VOID | F.SOLID | F.PIT | F.DEEP | F.LEDGE | F.HAZARD | F.JUMPABLE));
}
// The player controls the tide, so a tile is passable if any level allows it.
const passable = (legend, ch) => [0, 1, 2].some(t => walkableAt(legend, ch, t));

// --- 1. every screen exists ------------------------------------------------
const missing = [];
for (let y = 0; y < OH; y++) for (let x = 0; x < OW; x++) {
  if (!m.roomDefs[`0,${x},${y}`]) missing.push(`0,${x},${y}`);
}
check(`all ${OW * OH} screens exist`, missing.length === 0, missing.join(','));

// --- 2. grids are 8 rows of 10 ---------------------------------------------
const shape = [];
for (const [k, d] of Object.entries(m.roomDefs)) {
  if (!Array.isArray(d.map) || d.map.length !== H || d.map.some(r => r.length !== W)) shape.push(k);
}
check('every grid is 8 rows of 10', shape.length === 0, shape.join(','));

// --- 3. seams agree at all three tide levels -------------------------------
// If A's east edge tile is walkable at tide t, B's west edge tile at the same
// row must be too, or the player walks off the screen into a wall.
const seams = [];
for (let y = 0; y < OH; y++) for (let x = 0; x < OW; x++) {
  const a = m.roomDefs[`0,${x},${y}`];
  if (!a) continue;
  const la = legendOf(a);
  for (const [dx, dy] of [[1, 0], [0, 1]]) {
    const b = m.roomDefs[`0,${x + dx},${y + dy}`];
    if (!b) continue;
    const lb = legendOf(b);
    const n = dx ? H : W;
    for (let i = 0; i < n; i++) {
      const ca = dx ? a.map[i][W - 1] : a.map[H - 1][i];
      const cb = dx ? b.map[i][0] : b.map[0][i];
      for (const t of [0, 1, 2]) {
        if (walkableAt(la, ca, t) !== walkableAt(lb, cb, t)) {
          seams.push(`0,${x},${y}->${dx ? 'E' : 'S'} row ${i} tide ${t}: '${ca}' vs '${cb}'`);
        }
      }
    }
  }
}
check('every seam agrees at all three tide levels', seams.length === 0, seams.slice(0, 4).join(' | '));

// --- 4. the world border is solid ------------------------------------------
const leaks = [];
for (let y = 0; y < OH; y++) for (let x = 0; x < OW; x++) {
  const d = m.roomDefs[`0,${x},${y}`];
  if (!d) continue;
  const l = legendOf(d);
  if (x === 0) for (let i = 0; i < H; i++) if (passable(l, d.map[i][0])) leaks.push(`0,${x},${y} W row ${i}`);
  if (x === OW - 1) for (let i = 0; i < H; i++) if (passable(l, d.map[i][W - 1])) leaks.push(`0,${x},${y} E row ${i}`);
  if (y === 0) for (let i = 0; i < W; i++) if (passable(l, d.map[0][i])) leaks.push(`0,${x},${y} N col ${i}`);
  if (y === OH - 1) for (let i = 0; i < W; i++) if (passable(l, d.map[H - 1][i])) leaks.push(`0,${x},${y} S col ${i}`);
}
check('the world border is solid', leaks.length === 0, leaks.slice(0, 4).join(' | '));

// --- 5. tile-by-tile flood from Tidewatch Village --------------------------
//
// Wrapped in a function so the same flood can be run under several item sets:
// proving a gate needs BOTH directions — that the region opens with the item,
// and that it is actually shut without it. A gate only checked one way is a
// gate that might not be a gate.
function flood() {
  const seen = new Set();
  const start = '0,4,7';
  const sd = m.roomDefs[start], sl = legendOf(sd);
  const q = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (passable(sl, sd.map[y][x])) { const k = `${start}:${x},${y}`; if (!seen.has(k)) { seen.add(k); q.push([start, x, y]); } }
  }
  while (q.length) {
    const [rk, x, y] = q.pop();
    const def = m.roomDefs[rk], l = legendOf(def);
    const [, rx, ry] = rk.split(',').map(Number);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      let trk = rk, tx = nx, ty = ny;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) {
        trk = `0,${rx + (nx < 0 ? -1 : nx >= W ? 1 : 0)},${ry + (ny < 0 ? -1 : ny >= H ? 1 : 0)}`;
        if (!m.roomDefs[trk]) continue;
        tx = (nx + W) % W; ty = (ny + H) % H;
      }
      const k = `${trk}:${tx},${ty}`;
      if (seen.has(k)) continue;
      if (!passable(legendOf(m.roomDefs[trk]), m.roomDefs[trk].map[ty][tx])) continue;
      seen.add(k); q.push([trk, tx, ty]);
    }
  }
  const reached = new Set([...seen].map(k => k.split(':')[0]));
  const unreached = [];
  for (let y = 0; y < OH; y++) for (let x = 0; x < OW; x++) {
    if (!reached.has(`0,${x},${y}`)) unreached.push(`0,${x},${y}`);
  }
  return { reached, seen, unreached };
}

// The run the caller asked for, reported the way this tool always has.
{
  const { reached, seen, unreached } = flood();
  const label = HELD.length ? ` (with ${HELD.join(', ')})` : '';
  console.log(`  flood${label}: ${reached.size}/120 screens, ${seen.size} tiles`);
  if (unreached.length) console.log('  gated: ' + unreached.join(','));
}

// Holding everything must open the whole world. If this fails, some region is
// walled off by terrain rather than by a gate, which no item will fix.
{
  openMask = ALL.reduce((mask, it) => mask | GATES[it].flag, 0);
  const { unreached } = flood();
  check('with every gate item, all 120 screens are reachable',
    unreached.length === 0, unreached.join(','));
}

// ...and dropping each item in turn must shut its region, and ONLY its region.
// Checking that the count goes down is not enough: an unrelated screen falling
// off the map also makes the count go down.
for (const drop of ALL) {
  openMask = ALL.filter(it => it !== drop).reduce((mask, it) => mask | GATES[it].flag, 0);
  const { unreached } = flood();
  check(`without ${drop}, the ${GATES[drop].region} is sealed`,
    unreached.length > 0, 'nothing was gated');
  // Every other gate is open, so anything unreachable must be behind this one —
  // and must therefore lie inside the branch this gate is allowed to hold shut.
  const stray = unreached.filter(k => !covered(drop, k));
  check(`without ${drop}, nothing outside its branch is sealed`,
    stray.length === 0, stray.join(','));
  openMask = ALL.reduce((mask, it) => mask | GATES[it].flag, 0);
  console.log(`    ${drop}: seals ${unreached.length} screen(s)`);
}
openMask = HELD.reduce((mask, it) => mask | GATES[it].flag, 0);

// --- 6. no ledge is the only way anywhere ----------------------------------
// A ledge is impassable to the flood above, so if the flood reaches every screen
// the ledges cannot be load-bearing. Assert the ledge tiles themselves are all
// approachable from the north and land on ground the flood already reached.
const ledgeBad = [];
for (const [rk, def] of Object.entries(m.roomDefs)) {
  const l = legendOf(def);
  def.map.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch !== '_') return;
      if (y === 0 || y === H - 1) { ledgeBad.push(`${rk} ${x},${y}: on the border ring`); return; }
      if (!passable(l, def.map[y - 1][x])) ledgeBad.push(`${rk} ${x},${y}: nothing to approach from`);
      for (const t of [0, 1, 2]) {
        if (!walkableAt(l, def.map[y + 1][x], t)) ledgeBad.push(`${rk} ${x},${y}: landing not dry at tide ${t}`);
      }
    });
  });
}
check('every overworld ledge is approachable and lands on dry ground', ledgeBad.length === 0, ledgeBad.slice(0, 4).join(' | '));

console.log(`\n=== ${pass} passed, ${fail.length} failed ===`);
process.exit(fail.length ? 1 : 0);
