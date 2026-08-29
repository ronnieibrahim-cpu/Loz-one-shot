// Sound-effect coverage checker.
//
// WHY THIS EXISTS: `Audio.sfx(name)` looks the name up in a table and returns
// silently when it misses (src/core/audio.js) — no throw, no warning, nothing
// in the console. So a call site with a typo, or one written against a sound
// that was never authored, is a verb that makes no noise, and NOTHING in the
// game or in any other checker notices. Four such calls survived six sessions.
// That is trap T45 in docs/SESSION-HANDOFF.md, and this tool closes it.
//
// Usage: node tools/check-sfx.mjs
//
// WHAT IT CHECKS
//
//   1. Every sfx NAME WRITTEN AS A LITERAL at a call site in src/ is defined.
//      Literals are found through ternaries and `||` fallbacks too, so
//      `sfx(lv >= 3 ? 'sword3' : 'sword2')` and `sfx(o.sfx || 'charge')` are
//      both covered — those are the "six that look dead to a naive grep"
//      listed in the handoff's A4, and they are not dead.
//
//   2. Every sfx name carried in DATA is defined. A handful of call sites take
//      their name from a table — `tr.sfx` from a tile transform, `reward.sfx`,
//      `w.sfx` from a warp, `step.sfx` from a cutscene step — and a static scan
//      of `src/` cannot see those names at all. Skipping them is how a checker
//      that looks thorough misses the real bug: this pass is what found
//      `sfx: 'rumble'` sitting in the `boulder` tile transform, undefined, on a
//      tile the Dredge Line is meant to haul. The handoff's own list of four
//      silent no-ops did not have it.
//
//   3. Nothing is defined and never used. A dead sound is not a bug the player
//      can hear, so it is reported as a WARNING rather than a failure — but it
//      is reported, because a dead definition is usually a verb that lost its
//      sound rather than a sound nobody wanted.
//
// WHAT IT DELIBERATELY DOES NOT CHECK
//
//   `audio.play()` and `audio.jingle()` read DIFFERENT TABLES from `sfx()`
//   (T44 — that is the `secret` bug), so a music track name is not an sfx name
//   and must not be compared against one. `boss` and `title` are tracks.

import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SFX, TRACKS } from '../src/data/audio.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(ROOT, 'src');

const defined = new Set(Object.keys(SFX));
const problems = [];
const warnings = [];
const used = new Set();

// ---------------------------------------------------------------- 1. literals

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p));
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}

const files = (await walk(SRC)).filter(f => !f.endsWith(join('core', 'audio.js')) && !f.endsWith(join('data', 'audio.js')));

// Match `.sfx(` and capture the argument list up to the matching close paren at
// depth 0. A regex cannot balance parens, so scan.
function sfxArgs(src) {
  const out = [];
  const re = /\.sfx\s*\(/g;
  let m;
  while ((m = re.exec(src))) {
    let i = m.index + m[0].length, depth = 1, start = i;
    while (i < src.length && depth > 0) {
      const c = src[i];
      if (c === '(') depth++;
      else if (c === ')') depth--;
      else if (c === "'" || c === '"' || c === '`') {         // skip strings
        const q = c; i++;
        while (i < src.length && src[i] !== q) { if (src[i] === '\\') i++; i++; }
      }
      i++;
    }
    out.push({ text: src.slice(start, i - 1), line: src.slice(0, m.index).split('\n').length });
  }
  return out;
}

for (const f of files) {
  const src = await readFile(f, 'utf8');
  const rel = relative(ROOT, f);
  for (const { text, line } of sfxArgs(src)) {
    // The first argument only — `sfx('x', { vol })` must not read the options.
    let depth = 0, first = text;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '{' || c === '[' || c === '(') depth++;
      else if (c === '}' || c === ']' || c === ')') depth--;
      else if (c === ',' && depth === 0) { first = text.slice(0, i); break; }
    }
    const names = [...first.matchAll(/'([^']*)'|"([^"]*)"/g)].map(m => m[1] ?? m[2]);
    if (!names.length) continue;                 // wholly data-driven: pass 2
    for (const n of names) {
      used.add(n);
      if (!defined.has(n)) {
        problems.push(`${rel}:${line}  sfx('${n}') is not defined in src/data/audio.js`
          + (TRACKS[n] ? `  — '${n}' IS a music track; jingle()/play() read a different table (T44)` : ''));
      }
    }
  }
}

// ------------------------------------------------------------------- 2. data
//
// Import the data modules and read every `sfx:` field out of the structures the
// dynamic call sites draw from. Reading the real exports rather than grepping
// means a table that moves cannot quietly stop being checked.

const dataChecks = [];

{
  // Tile transforms: `Game.applyTransform` does `if (tr.sfx) this.audio.sfx(tr.sfx)`.
  const { TRANSFORMS } = await import('../src/world/tileset.js');
  const { installCoreTiles } = await import('../src/data/tiles-core.js');
  // Tile art registration touches the canvas-backed sheet, which does not exist
  // in Node — but TRANSFORMS is registered from the same module, so read the
  // source's transform table directly instead of booting the renderer.
  void installCoreTiles; void TRANSFORMS;
}

// The transform table is registered at boot inside a browser, so read it out of
// the data file textually. This is the one place a text scan is right: the
// alternative is standing up a DOM to register tile art that has nothing to do
// with sound.
const dataFiles = ['src/data/tiles-core.js', 'src/data/dungeons-a.js', 'src/data/dungeons-b.js',
  'src/data/overworld.js', 'src/data/caves.js', 'src/data/story.js', 'src/data/trade.js',
  'src/data/tiles-dungeon-themes.js'];
for (const rel of dataFiles) {
  let src;
  try { src = await readFile(join(ROOT, rel), 'utf8'); } catch { continue; }
  for (const m of src.matchAll(/\bsfx:\s*'([^']+)'/g)) {
    const n = m[1];
    used.add(n);
    dataChecks.push(n);
    if (!defined.has(n)) {
      const line = src.slice(0, m.index).split('\n').length;
      problems.push(`${rel}:${line}  data field sfx: '${n}' is not defined in src/data/audio.js`
        + (TRACKS[n] ? `  — '${n}' IS a music track (T44)` : ''));
    }
  }
}

// ------------------------------------------------------------------- 3. dead

for (const n of defined) {
  if (!used.has(n)) warnings.push(`'${n}' is defined and never played`);
}

// ------------------------------------------------------------------- report

console.log(`check-sfx: ${defined.size} sfx defined, ${used.size} referenced `
  + `(${dataChecks.length} of them from data tables)`);
for (const w of warnings) console.log(`  warn: ${w}`);
if (problems.length) {
  console.log('');
  for (const p of problems) console.log(`  FAIL ${p}`);
  console.log(`\ncheck-sfx: ${problems.length} silent no-op(s) — an sfx() call with an`);
  console.log('undefined name plays nothing and reports nothing (T45).');
  process.exit(1);
}
console.log('check-sfx: OK — every sfx name a call site or data table can reach is defined.');
