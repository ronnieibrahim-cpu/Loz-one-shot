// Stranded-cell checker for dungeon interiors. Plain Node, no browser.
//
// WHY THIS EXISTS, AND WHY walk-dungeons.mjs CANNOT DO ITS JOB.
//
// tools/check-strands.mjs already fixed this for the overworld: check-overworld
// floods tile-by-tile but keys `reached` on the ROOM, so a screen whose only
// reachable cells are a four-tile doorway reads as fully walkable. The same
// construction is true of tools/walk-dungeons.mjs's dungeon flood — it walks
// cell-by-cell internally but the assertion it reports is "every ROOM reached",
// which is exactly the blind spot that let the tree-crown fix sever fifteen
// overworld cells while every other tool stayed green.
//
// This asks the dungeon equivalent: flood every dungeon on foot (plus the
// verbs each dungeon has actually handed the player by that point — the
// Cleats' swim from D3 on, the Dredge Line's mooring from D6 on, every ledge,
// every puzzle/wheel/snarl door, every locked door spent against the
// dungeon's own key count), then report which cells in the dungeon's own
// "floor universe" the flood never actually stood on, grouped into connected
// regions ACROSS room seams and warps (a severed corridor spans two rooms, so
// grouping per-room would report it as two innocent pockets).
//
// The flood itself is tools/lib/dungeon-flood.mjs, shared with
// tools/walk-dungeons.mjs so the two tools cannot silently diverge on which
// movement verbs a dungeon actually grants. PASSABILITY IS NEVER RE-DERIVED
// HERE — see CLAUDE.md, Hard rules, and tools/lib/collision.mjs.
//
// A STRANDED CELL IS NOT AUTOMATICALLY A BUG, exactly as for the overworld:
// this is a BASELINE, not a zero-assertion. A dungeon floor holds plenty of
// legitimately-unreached cells — deep water in a dungeon entered before the
// Cleats, an alcove behind a door this particular flood's key count could not
// afford alongside another lock, a boss-room floor beyond a door the flood
// cannot open without combat. What is NEVER legitimate is a region GROWING or
// a new multi-cell one appearing: that is floor, or a corridor between two
// rooms, that the player used to be able to reach and now cannot.
//
// Usage: node tools/check-dungeon-strands.mjs [--record] [--verbose]

import { readFileSync, writeFileSync } from 'node:fs';
import { installData } from '../src/data/index.js';
import { MAPS } from '../src/world/maps.js';
import { floodDungeon } from './lib/dungeon-flood.mjs';

installData();

const BASELINE = new URL('./dungeon-strands-baseline.json', import.meta.url);
const RECORD = process.argv.includes('--record');
const VERBOSE = process.argv.includes('--verbose');

// Six dungeons, and six is what the data holds today (the Reef Palace and the
// Abyssal Keep were folded into d6). Read out of the registry rather than
// listed, so the next fold needs no edit here.
const DUNGEONS = [...MAPS.values()]
  .filter(m => m.dungeon)
  .sort((a, b) => (a.dungeon.index | 0) - (b.dungeon.index | 0))
  .map(m => m.id);

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const allRegions = [];

for (const mapId of DUNGEONS) {
  const { seen, dims, floorAt, stepOut, warpsOut } = floodDungeon(mapId);

  // Every cell in the dungeon's own floor universe that the flood never stood
  // on.
  const stranded = new Set();
  for (const rk of dims.keys()) {
    const D = dims.get(rk);
    for (let y = 0; y < D.H; y++) for (let x = 0; x < D.W; x++) {
      if (floorAt(rk, x, y) && !seen.has(`${rk}:${x},${y}`)) stranded.add(`${rk}:${x},${y}`);
    }
  }

  // Warps make a region-spanning edge too — a corridor can be severed on one
  // side of a staircase as easily as across a screen seam. Build the reverse
  // map alongside the forward one so grouping can follow either direction.
  const warpsIn = new Map();
  for (const [from, to] of warpsOut) warpsIn.set(to, from);

  // Grouped into connected regions, ACROSS seams and warps.
  const grouped = new Set();
  for (const cell of stranded) {
    if (grouped.has(cell)) continue;
    const region = [], q = [cell];
    grouped.add(cell);
    while (q.length) {
      const c = q.pop(); region.push(c);
      const [rk, xy] = c.split(':');
      const [x, y] = xy.split(',').map(Number);
      const neighbours = [];
      for (const [dx, dy] of DIRS) {
        const s = stepOut(rk, x + dx, y + dy);
        if (s) neighbours.push(`${s[0]}:${s[1]},${s[2]}`);
      }
      const w1 = warpsOut.get(c); if (w1) neighbours.push(w1);
      const w2 = warpsIn.get(c); if (w2) neighbours.push(w2);
      for (const nk of neighbours) {
        if (stranded.has(nk) && !grouped.has(nk)) { grouped.add(nk); q.push(nk); }
      }
    }
    region.sort();
    allRegions.push({ mapId, cells: region });
  }
}

allRegions.sort((a, b) => a.cells[0].localeCompare(b.cells[0]));
const asJson = allRegions.map(r => `${r.mapId} ${r.cells.join(' ')}`);

if (RECORD) {
  writeFileSync(BASELINE, JSON.stringify({ regions: asJson }, null, 2) + '\n');
  const cellCount = allRegions.reduce((n, r) => n + r.cells.length, 0);
  console.log(`check-dungeon-strands: recorded ${allRegions.length} region(s), ${cellCount} cell(s)`);
  process.exit(0);
}

let base;
try { base = JSON.parse(readFileSync(BASELINE, 'utf8')).regions; }
catch { console.error('check-dungeon-strands: no baseline. Run with --record once, and READ what it records.'); process.exit(2); }

const now = new Set(asJson), was = new Set(base);
const added = asJson.filter(r => !was.has(r));
const removed = base.filter(r => !now.has(r));

const totalCells = allRegions.reduce((n, r) => n + r.cells.length, 0);
console.log(`check-dungeon-strands: ${allRegions.length} stranded region(s), ${totalCells} floor cell(s) the flood never reaches`);
if (VERBOSE) for (const r of asJson) console.log(`  ${r.split(' ').length - 1} cell(s): ${r}`);

let bad = 0;
for (const r of added) {
  const n = r.split(' ').length - 1;
  console.log(`  ${n > 1 ? 'FAIL' : 'NEW '} stranded region (${n} cell(s)): ${r}`);
  if (n > 1) bad++;
}
for (const r of removed) console.log(`  GONE stranded region (${r.split(' ').length - 1} cell(s)): ${r}`);

if (added.length || removed.length) {
  console.log('\n  A region that GREW or APPEARED with more than one cell is floor, or a');
  console.log('  corridor between two rooms, that can no longer be reached. One that');
  console.log('  shrank or went away is usually good news. Re-record with --record only');
  console.log('  once you have looked at what moved and believe it.');
}
if (bad) { console.log(`\ncheck-dungeon-strands: FAILED — ${bad} new multi-cell stranded region(s)`); process.exit(1); }
console.log('check-dungeon-strands: OK — no new multi-cell stranded region');
