// Drift dashboard for the standing session charter (docs/prompts/CHARTER.md).
// Plain Node, no browser, no Playwright. Prints one table and exits non-zero
// ONLY if the SELF-CHECKS at the bottom fail — everything above that line is
// a measurement, not a judgement, and a "bad" number up there (low item
// reuse, zero measured feel.js constants, few audited rooms) is exactly what
// the rotation objectives in STATE.md exist to move. This tool does not
// referee that; it only referees whether the charter's own documents
// (NEXT-PROMPT.md, STATE.md) are still the shape a session can act on.
//
// Usage: node tools/check-drift.mjs

import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { installData } from '../src/data/index.js';
import { MAPS, dungeons } from '../src/world/maps.js';
import { getLegend, normaliseSize } from '../src/world/room.js';
import { F, resolveTile } from '../src/world/tileset.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

installData();

// ---------------------------------------------------------------------
// 1. Sized rooms by size, across all dungeons.
// ---------------------------------------------------------------------
const SIZES = ['1x1', '2x1', '1x2', '2x2', '3x1'];
const sizeCounts = Object.fromEntries(SIZES.map(s => [s, 0]));
for (const m of dungeons()) {
  for (const def of Object.values(m.roomDefs)) {
    const [sw, sh] = normaliseSize(def.size, m.id);
    const key = `${sw}x${sh}`;
    sizeCounts[key] = (sizeCounts[key] || 0) + 1;
  }
}

// ---------------------------------------------------------------------
// 2. Per-item capability reuse.
// ---------------------------------------------------------------------
// The six dungeon items (docs/ITEMS.md) do not all leave the same trace in
// room data, so this uses two different signals rather than forcing one:
//
//   - Cleats and the Dredge Line change what a TILE's own flags allow
//     (deep water; a snag/mooring, a dragged boulder, a dredged span)
//     wherever such a tile is placed, home dungeon or not — so their reuse
//     is read by resolving every room's tiles at all three tide levels and
//     checking the engine's own flag bits (`F.DEEP`, `F.SNAG`, `F.HEAVY`,
//     `F.GRAPPLE` — see the comments on those flags in tileset.js for why
//     each one is unambiguously "only this item").
//   - The Anchor, Lens, Bellows and Reefseed leave no such flag: nothing
//     about a tile changes because a room happens to need them. Their only
//     formal signal in the data is the declared puzzle-room object
//     (`anchorGate`/`anchorGauges`, `lensRoom`, `bellowsRoom`,
//     `reefseedRoom`) that tools/check-anchor.mjs, check-lens.mjs,
//     check-bellows.mjs and check-reefseed.mjs already read as their own
//     ground truth. Reused here rather than re-derived.
//
// A consequence worth knowing rather than being surprised by: those four
// declared-gate fields are, as the data stands, only ever written inside
// each item's OWN dungeon file — so until a future room somewhere else
// declares one, this measurement will honestly read zero dungeon and zero
// overworld reuse for those four items. That is not this tool being wrong;
// it is item-reuse (STATE.md rotation #3) having real work to do.
const ITEM_HOME = { anchor: 1, lens: 2, cleats: 3, bellows: 4, reefseed: 5, dredge: 6 };
const FLAG_ITEMS = {
  cleats: F.DEEP,
  dredge: F.SNAG | F.HEAVY | F.GRAPPLE,
};
const GATE_ITEMS = {
  anchor: ['anchorGate', 'anchorGauges'],
  lens: ['lensRoom'],
  bellows: ['bellowsRoom'],
  reefseed: ['reefseedRoom'],
};

function roomHasFlag(def, legend, mask) {
  const rows = def.map || [];
  for (const row of rows) {
    for (const ch of row) {
      const name = legend[ch];
      // `block:*` entries are town-building footprint markers consumed by
      // `Room.expandBlocks` (CLAUDE.md: "a building is not a tile") — not a
      // real tiledef, so resolving one only produces tileset.js's own
      // "undefined tile" warning for no measurement benefit.
      if (!name || name.startsWith('block:')) continue;
      for (let lvl = 0; lvl < 3; lvl++) {
        if (resolveTile(name, lvl).flags & mask) return true;
      }
    }
  }
  return false;
}

const reuse = {};
for (const item of Object.keys(ITEM_HOME)) reuse[item] = { dungeons: new Set(), overworldScreens: 0 };

for (const m of MAPS.values()) {
  const isDungeon = m.kind === 'dungeon' && m.dungeon;
  const isOverworld = m.kind === 'overworld';
  if (!isDungeon && !isOverworld) continue; // caves/interiors aren't "a dungeon" or "an overworld screen"
  for (const def of Object.values(m.roomDefs)) {
    const legend = getLegend(def.legend || m.legend);
    for (const [item, mask] of Object.entries(FLAG_ITEMS)) {
      if (!roomHasFlag(def, legend, mask)) continue;
      if (isDungeon) { if (m.dungeon.index !== ITEM_HOME[item]) reuse[item].dungeons.add(m.dungeon.index); }
      else reuse[item].overworldScreens++;
    }
    for (const [item, keys] of Object.entries(GATE_ITEMS)) {
      if (!keys.some(k => def[k] != null)) continue;
      if (isDungeon) { if (m.dungeon.index !== ITEM_HOME[item]) reuse[item].dungeons.add(m.dungeon.index); }
      else reuse[item].overworldScreens++;
    }
  }
}

// ---------------------------------------------------------------------
// 3. feel.js constants by provenance tag.
// ---------------------------------------------------------------------
// Delegates to tools/check-feel.mjs's own parser rather than re-deriving
// which word in a comment counts as the provenance tag — that tool already
// has to get "the provenance POSITION, not any occurrence of the word in
// prose" right to do its own job (see its own file header), and a second,
// slightly different regex here would be exactly the kind of private copy
// CLAUDE.md's Hard rules warn about for collision logic. Its summary line
// is parsed from stdout whether it exits 0 or not — a real problem there
// (an undocumented constant, an unattributed `measured` claim) is its job
// to fail on, not this tool's to hide or duplicate.
let feelCensus = { total: 0, measured: 0, derived: 0, guessed: 0 };
{
  const PATTERN = /(\d+) constants — (\d+) measured, (\d+) derived, (\d+) guessed/;
  let out = '';
  try {
    out = execFileSync(process.execPath, [resolve(HERE, 'check-feel.mjs')], { cwd: ROOT, encoding: 'utf8' });
  } catch (e) {
    out = (e.stdout || '').toString();
  }
  const m = out.match(PATTERN);
  if (m) feelCensus = { total: +m[1], measured: +m[2], derived: +m[3], guessed: +m[4] };
}

// ---------------------------------------------------------------------
// 4. Overworld room audits.
// ---------------------------------------------------------------------
// docs/AUDITED-ROOMS.md is the only source of truth here — a raw tally of
// what has actually been written down, not a model of what should be
// there. No canonical partition of the overworld into named art regions
// exists anywhere in src/ (docs/ART-BACKLOG.md names regions like "the
// wood region" or "the marsh region" in prose only, with no room-by-room
// mapping) — so "per region" below means grouped by whatever region label
// an audited row itself carries, and there is deliberately no fixed
// per-region denominator claimed. The one hard number is the overall
// total, read straight off the registered overworld room count.
const overworldMap = MAPS.get('overworld');
const totalOverworldRooms = overworldMap ? Object.keys(overworldMap.roomDefs).length : 0;

const auditedPath = resolve(ROOT, 'docs/AUDITED-ROOMS.md');
const auditedRows = [];
try {
  const text = await readFile(auditedPath, 'utf8');
  for (const line of text.split('\n')) {
    const cells = line.split('|').map(s => s.trim()).filter(Boolean);
    // A real data row's first cell is a room key like "0,4,4"; header and
    // separator rows are anything else and are skipped.
    if (!/^\d+,\d+,\d+$/.test(cells[0] || '')) continue;
    auditedRows.push({ key: cells[0], region: cells[1] || '(none)' });
  }
} catch (e) { /* missing file is reported by its own absence below, not hidden */ }

const byRegion = new Map();
for (const row of auditedRows) byRegion.set(row.region, (byRegion.get(row.region) || 0) + 1);

// ---------------------------------------------------------------------
// Print the table.
// ---------------------------------------------------------------------
console.log('=== check-drift ===\n');

console.log('Sized rooms by size, across all dungeons:');
for (const s of SIZES) console.log(`  ${s.padEnd(4)} ${sizeCounts[s]}`);

console.log('\nPer-item capability reuse (dungeons other than home / overworld screens):');
for (const [item, home] of Object.entries(ITEM_HOME)) {
  const r = reuse[item];
  console.log(`  ${item.padEnd(9)} home D${home}   dungeons: ${r.dungeons.size} of 5   overworld screens: ${r.overworldScreens}`);
}

console.log(`\nfeel.js provenance: ${feelCensus.total} constants — ${feelCensus.measured} measured, `
  + `${feelCensus.derived} derived, ${feelCensus.guessed} guessed`);

console.log(`\nOverworld room audits: ${auditedRows.length} of ${totalOverworldRooms} rooms in docs/AUDITED-ROOMS.md`);
if (byRegion.size) {
  for (const [region, n] of [...byRegion.entries()].sort()) console.log(`  ${region.padEnd(28)} ${n}`);
} else {
  console.log('  (none audited yet)');
}

// ---------------------------------------------------------------------
// SELF-CHECKS — the only thing that can fail this tool. It measures the
// game above; here it judges the charter's own documents, because those
// are the ones that decay silently (docs/prompts/CHARTER.md's own step 2:
// "a 200-line prompt or an overflowing STATE.md is a defect with the same
// standing as a red test").
// ---------------------------------------------------------------------
const problems = [];

const nextPromptPath = resolve(ROOT, 'docs/prompts/NEXT-PROMPT.md');
const statePath = resolve(ROOT, 'docs/prompts/STATE.md');

function contentLines(raw) {
  const lines = raw.split('\n');
  // A trailing newline is not a line of content.
  if (lines.length && lines[lines.length - 1] === '') lines.pop();
  return lines;
}

let nextPromptLines = null;
try { nextPromptLines = contentLines(await readFile(nextPromptPath, 'utf8')); }
catch (e) { problems.push('docs/prompts/NEXT-PROMPT.md is missing'); }
if (nextPromptLines) {
  if (nextPromptLines.length > 150) {
    problems.push(`docs/prompts/NEXT-PROMPT.md is ${nextPromptLines.length} lines, over the 150-line cap`);
  }
  const taskHeadings = nextPromptLines.filter(l => l.trim() === '## The task').length;
  if (taskHeadings !== 1) {
    problems.push(`docs/prompts/NEXT-PROMPT.md has ${taskHeadings} '## The task' headings, needs exactly 1`);
  }
}

let stateLines = null;
try { stateLines = contentLines(await readFile(statePath, 'utf8')); }
catch (e) { problems.push('docs/prompts/STATE.md is missing'); }
if (stateLines) {
  if (stateLines.length > 60) {
    problems.push(`docs/prompts/STATE.md is ${stateLines.length} lines, over the 60-line cap`);
  }
  const logRows = stateLines.filter(l => /^S\d+\s*\|\s*(objective|detour)\s*\|/.test(l.trim()));
  const lastTwo = logRows.slice(-2);
  if (lastTwo.length === 2 && lastTwo.every(l => /^S\d+\s*\|\s*detour\s*\|/.test(l.trim()))) {
    problems.push('docs/prompts/STATE.md: last two session log rows are both `detour`');
  }
}

console.log('\n=== self-checks ===');
if (problems.length) {
  for (const p of problems) console.log(`  FAIL  ${p}`);
  console.log(`\ncheck-drift: ${problems.length} self-check(s) failed`);
  process.exit(1);
}
console.log('  OK — NEXT-PROMPT.md and STATE.md are both within shape');
console.log('\ncheck-drift: OK');
