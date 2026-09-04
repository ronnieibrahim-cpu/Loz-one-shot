// Ripper reproducibility harness. Re-runs every extraction tool and asserts the
// generated module it emits does not change.
//
//   node tools/check-rippers.mjs
//
// WHY THIS EXISTS. CLAUDE.md states the rule plainly — "extraction lands in a
// generated file, never hand-edit one", and "run the ripper once before you
// change anything to confirm it reproduces byte-identically" — and NOTHING
// ENFORCED IT. `check-tilesets.mjs` verifies exactly one ripper
// (rip-dungeon-maps.py, with its own --verify flag); the eight that emit the
// modules the game actually draws from were on the honour system.
//
// Two different faults hide in that gap, and only one of them is a hand-edit:
//
//   1. somebody edits a generated file directly. The next regeneration throws
//      the edit away silently, which is the failure CLAUDE.md's rule is about;
//   2. A RIPPER STOPS BEING DETERMINISTIC. This is the worse one, because
//      nothing about it looks like a mistake. `rip-hud.py`'s own header records
//      that its rip "was three pixels unstable across runs" before it stopped
//      using ripkit's nearest-colour search — ties in that search are broken by
//      whichever colour is scanned first, so the same cell could emit different
//      indices run to run. A checker that only diffed a committed file against
//      itself would never see that; re-RUNNING the ripper is what catches it.
//
// What this asserts, per ripper: the tool runs without error, and the file it
// emits is byte-for-byte what is committed. On a mismatch the committed file is
// restored from git, so a failing run leaves the tree exactly as it found it —
// a checker that dirties the working copy is one people stop running.
//
// Pillow is required (the rippers read PNGs). Without it this SKIPS with exit
// code 2 rather than passing, the same contract check-tilesets.mjs uses: a
// green tick for a check that did not run is worse than no check.

import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Every ripper and the module it owns. This list IS the coverage claim, so a
// new ripper belongs here in the same commit that adds it — the sweep below
// fails if a tools/rip-*.py exists that this table does not name.
const RIPPERS = [
  ['rip-link.py',            'src/data/sprites-player.js'],
  ['rip-npcs.py',            'src/data/sprites-npcs.js'],
  ['rip-races.py',           'src/data/sprites-races.js'],
  ['rip-enemies.py',         'src/data/sprites-enemies.js'],
  ['rip-hud.py',             'src/data/sprites-hud.js'],
  ['rip-fairies.py',         'src/data/sprites-fairies.js'],
  ['rip-terrain.py',         'src/data/tiles-terrain.js'],
  ['rip-dungeon-themes.py',  'src/data/tiles-dungeon-themes.js'],
];
// Verified by check-tilesets.mjs through its own --verify flag, and it emits a
// PNG plus a manifest rather than a module, so it is not this tool's business.
const ELSEWHERE = new Set(['rip-dungeon-maps.py']);

let pass = 0; const fail = [];
const check = (n, c, d) => c
  ? (pass++, console.log('  ok   ' + n))
  : (fail.push(n), console.log('  FAIL ' + n + (d ? ' — ' + d : '')));

let hasPillow = true;
try { execFileSync('python3', ['-c', 'import PIL'], { stdio: 'ignore' }); }
catch { hasPillow = false; }
if (!hasPillow) {
  console.log('  SKIP no Pillow — `pip install pillow` and re-run.');
  console.log('\n=== 0 passed, 0 failed (skipped: no Pillow) ===');
  process.exit(2);
}

const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

for (const [tool, out] of RIPPERS) {
  const toolPath = resolve(ROOT, 'tools', tool);
  const outPath = resolve(ROOT, out);
  if (!existsSync(toolPath)) { check(`${tool}: exists`, false); continue; }
  if (!existsSync(outPath)) { check(`${tool}: ${out} is committed`, false); continue; }
  const before = sha(outPath);
  let ran = true, err = '';
  try {
    execFileSync('python3', [toolPath], { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' });
  } catch (e) {
    ran = false; err = ((e.stdout || '') + (e.stderr || '')).trim().split('\n').slice(-1)[0];
  }
  check(`${tool}: runs`, ran, err);
  if (!ran) continue;
  const after = sha(outPath);
  check(`${tool}: re-emits ${relative('src/data', out)} byte-identically`, before === after,
    before === after ? '' : 'the committed file is not what this ripper produces — '
      + 'either it was hand-edited, or the ripper is not deterministic');
  if (before !== after) {
    // Leave the tree as we found it. A red run must not also be a dirty one.
    try { execFileSync('git', ['checkout', '--', out], { cwd: ROOT, stdio: 'ignore' }); }
    catch { console.log(`       (could not restore ${out} — check it by hand)`); }
  }
}

// A ripper this table does not name is a ripper nobody is checking.
const listed = new Set(RIPPERS.map(r => r[0]));
const found = execFileSync('bash', ['-c', 'ls tools/rip-*.py | xargs -n1 basename'],
  { cwd: ROOT, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
const unlisted = found.filter(f => !listed.has(f) && !ELSEWHERE.has(f));
check('every ripper in tools/ is covered here', unlisted.length === 0,
  unlisted.join(' '));

console.log(`\n=== ${pass} passed, ${fail.length} failed ===`);
if (fail.length) process.exit(1);
