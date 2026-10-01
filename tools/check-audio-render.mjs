// Proves OUR music still compiles to exactly the channel scripts it compiled
// to when the baseline was recorded — so a change to the compiler, to the
// pattern format's reading, or to a track's data is never a SILENT change to
// what the player hears.
//
// Since S164 every one of our tracks plays through the cartridge's own sound
// engine: `compileForGb` (src/core/audio.js) writes it out as a channel script
// in the ripper's event encoding, and src/core/gbsound.js renders that. The
// render is pure arithmetic on the script, so the SCRIPT is the whole of what
// a track sounds like, and comparing scripts is comparing the music. (Before
// S164 this file traced the Web Audio calls of the tracker synthesiser our
// tracks used to play on, which no longer exists.)
//
// Usage:
//   node tools/check-audio-render.mjs             compare against the baseline
//   node tools/check-audio-render.mjs --record     (re)write the baseline

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileForGb } from '../src/core/audio.js';
import { TRACKS } from '../src/data/audio.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const BASELINE = resolve(HERE, 'audio-render-baseline.json');
const RECORD = process.argv.includes('--record');

const names = Object.keys(TRACKS).filter((n) => !TRACKS[n].seasons && TRACKS[n].patterns).sort();
const current = {};
for (const name of names) current[name] = compileForGb(TRACKS[name]);

if (RECORD) {
  await mkdir(dirname(BASELINE), { recursive: true });
  // Compact: machine-compared, never hand-read.
  await writeFile(BASELINE, JSON.stringify(current) + '\n');
  console.log(`check-audio-render: recorded baseline for ${names.length} tracks`);
  process.exit(0);
}

let baseline;
try {
  baseline = JSON.parse(await readFile(BASELINE, 'utf8'));
} catch (e) {
  console.error(`No baseline at ${BASELINE}. Run with --record first.`);
  process.exit(1);
}

const problems = [];
for (const name of names) {
  const want = baseline[name];
  const got = current[name];
  if (!want) { problems.push(`${name}: no baseline recorded (run --record)`); continue; }
  if (JSON.stringify(want.ch) !== JSON.stringify(got.ch)) {
    problems.push(`${name}: channels start at ${JSON.stringify(got.ch)}, baseline ${JSON.stringify(want.ch)}`);
    continue;
  }
  // Find the first differing event so a failure is diagnosable, not just red.
  let i = 0;
  while (i < want.events.length && i < got.events.length
    && JSON.stringify(want.events[i]) === JSON.stringify(got.events[i])) i++;
  if (i < want.events.length || i < got.events.length) {
    problems.push(`${name}: diverges at event ${i} of ${want.events.length} — ` +
      `want ${JSON.stringify(want.events[i])}, got ${JSON.stringify(got.events[i])}`);
  }
}
for (const name of Object.keys(baseline)) {
  if (!names.includes(name)) problems.push(`${name}: in baseline but no longer one of our tracks (stale baseline entry)`);
}

console.log(`check-audio-render: ${names.length} of our tracks compiled against baseline`);
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error('  ' + p);
  console.error('\nIf this is an intended change to the music, listen to it, then re-record with:');
  console.error('  node tools/check-audio-render.mjs --record');
  process.exit(1);
}
console.log('check-audio-render: OK — every track compiles to the same channel script as its baseline');
