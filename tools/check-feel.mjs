// Every timing and feel constant carries a unit and an honest provenance.
//
// `R3`/`T4`: every timing and speed constant lives in `src/data/feel.js` with a
// unit and one of three provenance words — `measured`, `derived`, `guessed` —
// and **`measured` means somebody actually frame-stepped a reference and wrote
// the number down**. The rule has always been prose in CLAUDE.md and nothing
// enforced it, which is a strange gap for a file whose entire value is that you
// can trust the word next to a number.
//
// S11's own stated failure condition was "marking constants `measured` without
// actually frame-stepping a reference — that word has a specific meaning here
// and inflating it destroys the file's value permanently". This is that failure
// condition, made mechanical.
//
// WHAT IT REQUIRES
//
//   1. Every exported constant has a doc comment above it. A bare number with
//      no comment has no unit and no provenance and is exactly what `R3` is
//      against.
//   2. That comment carries at least one provenance word.
//   3. A constant that CLAIMS to be measured must name its reference. A comment
//      is read as a measured claim when it says `measured` and does NOT also
//      say `guessed` or `derived` — which correctly exempts the two constants
//      whose prose happens to contain the word ("derived from the 8.8 grid",
//      and "guessed, but MEASURED AGAINST A ROOM"). A measured claim must also
//      carry a `reference:` note saying WHAT was stepped, so the claim can be
//      re-checked by somebody who was not there.
//
// It deliberately does NOT require a particular unit vocabulary. The file uses
// `sp/f`, `f`, `px`, `x` and several more, and inventing a closed list here
// would fail honest comments for the wrong reason.
//
// Usage: node tools/check-feel.mjs [--verbose]

import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const FEEL = resolve(HERE, '../src/data/feel.js');
const VERBOSE = process.argv.includes('--verbose');

const src = await readFile(FEEL, 'utf8');
const lines = src.split('\n');

const problems = [];
const census = { measured: 0, derived: 0, guessed: 0 };
const measuredClaims = [];
let total = 0;

for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(/^export const ([A-Z0-9_]+)\s*=/);
  if (!m) continue;
  const name = m[1];
  total++;

  // The comment block covering this declaration.
  //
  // A COMMENT MAY COVER A GROUP. The file documents amplitude/duration pairs
  // together under one `px, f —` comment (`SHAKE_BOSS_SLAM` and
  // `SHAKE_BOSS_SLAM_FRAMES`, and two more like them), so the second of a pair
  // has no comment of its own and is not undocumented. A first cut of this
  // tool walked only the lines immediately above and reported all three as
  // missing — the convention was real and the checker was wrong. So skip back
  // over any run of adjacent `export const` lines before looking for prose.
  const block = [];
  let j = i - 1;
  while (j >= 0 && /^export const [A-Z0-9_]+\s*=/.test(lines[j])) j--;
  for (; j >= 0; j--) {
    const t = lines[j].trim();
    if (t.startsWith('*') || t.startsWith('/**') || t.startsWith('*/') || t.startsWith('//')) block.unshift(t);
    else break;
  }
  const comment = block.join(' ');
  const c = comment.toLowerCase();

  if (!block.length) {
    problems.push(`${name} (line ${i + 1}): no comment — R3 requires a unit and a provenance word`);
    continue;
  }

  const saysGuessed = /\bguessed\b/.test(c);
  const saysDerived = /\bderived\b/.test(c);
  const saysMeasured = /\bmeasured\b/.test(c);

  if (!saysGuessed && !saysDerived && !saysMeasured) {
    problems.push(`${name} (line ${i + 1}): comment carries no provenance word ` +
      `(measured / derived / guessed)`);
    continue;
  }

  // A claim to be MEASURED is the one that has to be defended.
  const claimsMeasured = saysMeasured && !saysGuessed && !saysDerived;
  if (claimsMeasured) {
    census.measured++;
    measuredClaims.push(name);
    if (!/reference:/i.test(comment)) {
      problems.push(`${name} (line ${i + 1}): claims to be MEASURED but names no reference. ` +
        `Add "reference: <what was frame-stepped>" to the comment — that word means somebody ` +
        `actually stepped a recording, and an unattributed claim is how the whole file stops ` +
        `being trustworthy.`);
    }
  } else if (saysDerived) census.derived++;
  else census.guessed++;

  if (VERBOSE) {
    const tag = claimsMeasured ? 'measured' : saysDerived ? 'derived' : 'guessed';
    console.log(`  ${tag.padEnd(8)} ${name}`);
  }
}

console.log(`check-feel: ${total} constants — ${census.measured} measured, ` +
  `${census.derived} derived, ${census.guessed} guessed`);
if (measuredClaims.length) console.log(`  measured: ${measuredClaims.join(' ')}`);
else {
  console.log('  NOTE: nothing in this file is measured against a reference yet. That is the ' +
    'standing debt (A1) — it is not a failure, and it must not be papered over by relabelling.');
}

if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log('check-feel: OK — every constant has a comment and a provenance word, and every ' +
  'measured claim names what was stepped');
