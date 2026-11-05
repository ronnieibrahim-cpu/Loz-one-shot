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
import { OVERWORLD_W, OVERWORLD_H } from '../src/data/overworld.js';
import { MAPS } from '../src/world/maps.js';
import { passableAt, stepScreen, floodScreens, screenRooms, allCells, DIRS, SCREEN_W, SCREEN_H } from './lib/screen-flood.mjs';

installData();

const W = SCREEN_W, H = SCREEN_H, OW = OVERWORLD_W, OH = OVERWORLD_H;
const BASELINE = new URL('./strands-baseline.json', import.meta.url);
const RECORD = process.argv.includes('--record');
const VERBOSE = process.argv.includes('--verbose');

const m = MAPS.get('overworld');
const ROOMS = screenRooms('overworld');

// The flood itself (gates held open, on foot, any sea, the base hop) lives in
// tools/lib/screen-flood.mjs since S240, shared with check-placement's cave
// chests. Every gate held open there on purpose: this tool is about terrain.
const step = (rk, x, y, dx, dy) => stepScreen(m, rk, x, y, dx, dy);

const seen = floodScreens('overworld', allCells('0,4,7'), ROOMS);

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
