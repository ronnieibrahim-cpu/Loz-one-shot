// Stranded-cell checker for the overworld. Plain Node, no browser.
//
// WHY THIS EXISTS, AND WHY check-overworld CANNOT DO ITS JOB.
//
// check-overworld's flood is tile-by-tile, but its `reached` set is keyed on
// the ROOM. A screen counts as reached the moment ONE of its cells is, so a
// screen whose only reachable cells are the four tiles of a doorway is
// indistinguishable from a screen you can walk all of. Every assertion there
// stays green while a room quietly loses half of itself.
//
// That is not hypothetical. The tree-crown collision fix (`quadCanopySolid`)
// severed The Gyre's entire southern lobe from its western verge — row 6, the
// row-7 doorway, and Drowned Hollow's row-0 doorway on the far side of the
// seam, fifteen cells and a corridor between two screens. Everything in
// CLAUDE.md's table was green: check-overworld reached 120/120 screens,
// check-progression reached 120/120 with 6/6 dungeons, walk-dungeons, gates,
// towns, placement and playthrough all passed. The cell that was lost was the
// SIGN that teaches the Kelp-Soled Cleats, and swimming is what the Cleats
// grant — so the screen explaining the item had become readable only by a
// player who already had it. Nothing in the table could see it, because
// nothing in the table asks a room whether it still owns its own floor.
//
// So: flood on foot, and report the foot-passable cells the flood never
// reaches, grouped into connected regions.
//
// A STRANDED CELL IS NOT AUTOMATICALLY A BUG, which is why this is a BASELINE
// and not a zero-assertion. Two kinds are legitimate and both are in the
// recorded set:
//
//   - Water. The flood walks; it does not swim (`swim` is the Cleats, not the
//     base moveset). The Gyre's riptide ring is meant to be unreachable on
//     foot — that is the screen's whole argument.
//   - One-cell root pockets. A border treeline is two rows deep, and
//     `quadCanopySolid` solidifies the canopy (even) row while leaving the
//     root (odd) row walkable on purpose. Where a one-tile verge ran up
//     alongside such a line, the odd rows survive as isolated single cells.
//     They render as tree roots inside the treeline, hold no entity, and
//     being unreachable is correct.
//
// What is NEVER legitimate is a region GROWING, or a new multi-cell one
// appearing: that is a lobe of a room, or a corridor between two rooms, that
// the player used to be able to walk and now cannot. Diff against the
// baseline and look at what moved.
//
// All four gates are held OPEN here on purpose. This tool asks "does the
// terrain strand anything", and a gate is meant to strand things —
// check-overworld is where a gate is proved, one drop at a time.
//
// PASSABILITY IS NEVER RE-DERIVED HERE. Every "can something stand on this
// tile" question goes to tools/lib/collision.mjs, which asks the real
// `Room.solidAt` — the same function `canOccupy`/`moveEntity` use in the
// running game. See CLAUDE.md, Hard rules.
//
// Usage: node tools/check-strands.mjs [--record] [--verbose]

import { readFileSync, writeFileSync } from 'node:fs';
import { installData } from '../src/data/index.js';
import { MAPS, getRoom } from '../src/world/maps.js';
import { F } from '../src/world/tileset.js';
import { GAP_HOP_MAX_SPAN } from '../src/data/feel.js';
import { tileWalkable, ROUTE_AVOID } from './lib/collision.mjs';

installData();

const W = 10, H = 8, OW = 12, OH = 10;
const BASELINE = new URL('./strands-baseline.json', import.meta.url);
const RECORD = process.argv.includes('--record');
const VERBOSE = process.argv.includes('--verbose');

const m = MAPS.get('overworld');
const ROOMS = new Map();
for (const k of Object.keys(m.roomDefs)) {
  const [f, rx, ry] = k.split(',').map(Number);
  ROOMS.set(k, getRoom('overworld', f, rx, ry));
}

// Every gate held open: this tool is about terrain, not gates.
const openMask = F.HEAVY | F.BOMBABLE | F.VANE;
const openStory = new Set(['makuOpenedKeep']);
// On foot. No swimming (that is the Cleats), no jumping, no cutting.
const CAPS = { jumping: false, swim: false, cutting: false };

function walkableAt(room, x, y, t) {
  if (openMask && (room.flagsAt(x, y, t) & openMask)) return true;
  const d = room.tile(x, y, t);
  if (d && d.openFlag) return openStory.has(d.openFlag);
  return tileWalkable(room, x, y, t, CAPS, ROUTE_AVOID);
}

// The base hop, modelled the way check-overworld models it: a gap tile is
// crossable when the run containing it is shorter than GAP_HOP_MAX_SPAN along
// at least one axis. Read from feel.js rather than written down here.
const isGap = (r, x, y) => !!(r.flagsAt(x, y, 1) & F.JUMPABLE);
function runLen(r, x, y, dx, dy) {
  let n = 1;
  for (let i = 1; ; i++) { const nx = x + dx * i, ny = y + dy * i; if (nx < 0 || ny < 0 || nx >= W || ny >= H || !isGap(r, nx, ny)) break; n++; }
  for (let i = 1; ; i++) { const nx = x - dx * i, ny = y - dy * i; if (nx < 0 || ny < 0 || nx >= W || ny >= H || !isGap(r, nx, ny)) break; n++; }
  return n;
}
const hoppable = (r, x, y) => isGap(r, x, y)
  && (runLen(r, x, y, 1, 0) < GAP_HOP_MAX_SPAN || runLen(r, x, y, 0, 1) < GAP_HOP_MAX_SPAN);
// The player controls the tide, so a tile is passable if any level allows it.
const passable = (r, x, y) => [0, 1, 2].some(t => walkableAt(r, x, y, t));
const passableAt = (r, x, y) => passable(r, x, y) || hoppable(r, x, y);

/** Where a step off the edge of a screen lands, or null at the world's rim. */
function step(rk, x, y, dx, dy) {
  const [, rx, ry] = rk.split(',').map(Number);
  const nx = x + dx, ny = y + dy;
  if (nx >= 0 && ny >= 0 && nx < W && ny < H) return [rk, nx, ny];
  const trk = `0,${rx + (nx < 0 ? -1 : nx >= W ? 1 : 0)},${ry + (ny < 0 ? -1 : ny >= H ? 1 : 0)}`;
  if (!m.roomDefs[trk]) return null;
  return [trk, (nx + W) % W, (ny + H) % H];
}
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// --- the flood, from Tidewatch Village -------------------------------------
function flood() {
  const seen = new Set();
  const start = '0,4,7', sr = ROOMS.get(start), q = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (passableAt(sr, x, y)) { const k = `${start}:${x},${y}`; if (!seen.has(k)) { seen.add(k); q.push([start, x, y]); } }
  }
  while (q.length) {
    const [rk, x, y] = q.pop();
    for (const [dx, dy] of DIRS) {
      const s = step(rk, x, y, dx, dy);
      if (!s) continue;
      const [trk, tx, ty] = s, tr = ROOMS.get(trk);
      if (!tr || !passableAt(tr, tx, ty)) continue;
      const k = `${trk}:${tx},${ty}`;
      if (seen.has(k)) continue;
      seen.add(k); q.push([trk, tx, ty]);
    }
  }
  return seen;
}

const seen = flood();

// --- every foot-passable cell the flood never reached ----------------------
const stranded = new Set();
for (let ry = 0; ry < OH; ry++) for (let rx = 0; rx < OW; rx++) {
  const rk = `0,${rx},${ry}`, r = ROOMS.get(rk);
  if (!r) continue;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (passableAt(r, x, y) && !seen.has(`${rk}:${x},${y}`)) stranded.add(`${rk}:${x},${y}`);
  }
}

// --- grouped into connected regions, ACROSS seams --------------------------
// A severed corridor spans two screens (The Gyre's row 7 and Drowned Hollow's
// row 0 were one region), so grouping per-room would report it as two small
// pockets rather than one lost road.
const regions = [];
const grouped = new Set();
for (const cell of stranded) {
  if (grouped.has(cell)) continue;
  const region = [], q = [cell];
  grouped.add(cell);
  while (q.length) {
    const c = q.pop(); region.push(c);
    const [rk, xy] = c.split(':');
    const [x, y] = xy.split(',').map(Number);
    for (const [dx, dy] of DIRS) {
      const s = step(rk, x, y, dx, dy);
      if (!s) continue;
      const nk = `${s[0]}:${s[1]},${s[2]}`;
      if (stranded.has(nk) && !grouped.has(nk)) { grouped.add(nk); q.push(nk); }
    }
  }
  region.sort();
  regions.push(region);
}
regions.sort((a, b) => a[0].localeCompare(b[0]));

const asJson = regions.map(r => r.join(' '));

if (RECORD) {
  writeFileSync(BASELINE, JSON.stringify({ regions: asJson }, null, 2) + '\n');
  console.log(`check-strands: recorded ${regions.length} region(s), ${stranded.size} cell(s)`);
  process.exit(0);
}

let base;
try { base = JSON.parse(readFileSync(BASELINE, 'utf8')).regions; }
catch { console.error('check-strands: no baseline. Run with --record once, and READ what it records.'); process.exit(2); }

const now = new Set(asJson), was = new Set(base);
const added = asJson.filter(r => !was.has(r));
const removed = base.filter(r => !now.has(r));

console.log(`check-strands: ${regions.length} stranded region(s), ${stranded.size} foot-passable cell(s) the flood never reaches`);
if (VERBOSE) for (const r of asJson) console.log(`  ${r.split(' ').length} cell(s): ${r}`);

// Naming the room makes a diff readable without opening overworld.js.
const nameOf = r => { const k = r.split(':')[0]; return `${k} ${m.roomDefs[k]?.name || '?'}`; };

let bad = 0;
for (const r of added) {
  const n = r.split(' ').length;
  console.log(`  ${n > 1 ? 'FAIL' : 'NEW '} stranded region (${n} cell(s)) ${nameOf(r)}: ${r}`);
  if (n > 1) bad++;
}
for (const r of removed) console.log(`  GONE stranded region (${r.split(' ').length} cell(s)) ${nameOf(r)}: ${r}`);

if (added.length || removed.length) {
  console.log('\n  A region that GREW or APPEARED with more than one cell is a lobe of a');
  console.log('  room, or a corridor between two rooms, that can no longer be walked.');
  console.log('  One that shrank or went away is usually good news. Re-record with');
  console.log('  --record only once you have looked at what moved and believe it.');
}
if (bad) { console.log(`\ncheck-strands: FAILED — ${bad} new multi-cell stranded region(s)`); process.exit(1); }
console.log('check-strands: OK — no new multi-cell stranded region');
