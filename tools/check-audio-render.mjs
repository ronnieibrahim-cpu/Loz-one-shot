// Proves the music ENGINE (src/core/audio.js) schedules the exact same Web
// Audio instructions it always did for every track that does not opt into a
// S6 technique (vibrato/echo/arpeggio) — the "a track that does not ask for
// the new options must sound byte-identical" rule from the S6 session prompt.
//
// WHY THIS DOES NOT RENDER ACTUAL AUDIO SAMPLES
//
// The first approach tried here was rendering real PCM through an
// OfflineAudioContext in a real browser and hashing the samples. That FAILED
// even for two runs of the IDENTICAL code: Web Audio's own internals are not
// specified to be bit-reproducible across separate page/script contexts (the
// exact float rounding order inside the browser's own DSP is allowed to
// differ), so a naive sample hash flags a false regression on a change to
// completely unrelated code, purely because it shifted what the JS engine
// happened to optimise. That is exactly the "test that fails intermittently
// is a real bug" trap in spirit, just triggered by content instead of load —
// a checker that cries wolf on unrelated commits gets ignored, which is worse
// than not having it.
//
// What IS fully deterministic, in pure JS with no browser and no DSP at all,
// is the SEQUENCE OF INSTRUCTIONS the engine hands to the Web Audio graph —
// every `osc.frequency.setValueAtTime(freq, time)`, every gain ramp, every
// `start`/`stop` — because those are plain arithmetic on the track data, not
// audio synthesis. Two runs that issue the identical instructions in the
// identical order WILL sound identical; the browser's own contribution from
// there on is out of this project's hands and not what changed. So this tool
// swaps in a tiny mock AudioContext (createGain/createOscillator/etc. all
// return objects that just RECORD what was called on them) and traces
// `Audio._scheduleRow` for a fixed number of rows, entirely in Node.
//
// This was cross-checked once by hand against commit 64a6561 (pre-S6): with
// this exact harness, all 22 pre-S6 tracks produced byte-identical traces
// before and after the S6 engine change. That is the proof this file exists
// to keep proving on every future change to src/core/audio.js.
//
// Usage:
//   node tools/check-audio-render.mjs             compare against the baseline
//   node tools/check-audio-render.mjs --record     (re)write the baseline

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Audio } from '../src/core/audio.js';
import { TRACKS } from '../src/data/audio.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const BASELINE = resolve(HERE, 'audio-render-baseline.json');
const ROWS = 128; // generous: covers a full loop (or several) of every track
const RECORD = process.argv.includes('--record');

function mockCtx() {
  let nodeId = 0;
  const trace = [];
  function param(tag) {
    return {
      value: 0,
      setValueAtTime(v, t) { trace.push([tag, 'set', v, t]); return this; },
      linearRampToValueAtTime(v, t) { trace.push([tag, 'lin', v, t]); return this; },
      exponentialRampToValueAtTime(v, t) { trace.push([tag, 'exp', v, t]); return this; },
      setTargetAtTime(v, t, c) { trace.push([tag, 'tgt', v, t, c]); return this; },
      cancelScheduledValues(t) { trace.push([tag, 'cancel', t]); return this; },
    };
  }
  const ctx = {
    sampleRate: 44100, currentTime: 0, destination: {},
    createGain() { const id = nodeId++; return { gain: param('gain' + id), connect() {} }; },
    createBiquadFilter() {
      const id = nodeId++;
      return { type: '', frequency: param('bqf' + id), Q: param('bqq' + id), connect() {} };
    },
    createOscillator() {
      const id = nodeId++;
      return {
        type: '', frequency: param('osc' + id),
        setPeriodicWave(w) { trace.push(['osc' + id, 'wave', w.imag]); },
        connect() {}, start(t) { trace.push(['osc' + id, 'start', t]); }, stop(t) { trace.push(['osc' + id, 'stop', t]); },
      };
    },
    createBufferSource() {
      const id = nodeId++;
      return {
        buffer: null, loop: false, connect() {},
        start(t) { trace.push(['src' + id, 'start', t]); }, stop(t) { trace.push(['src' + id, 'stop', t]); },
      };
    },
    createBuffer(ch, len) { return { getChannelData: () => new Float32Array(len) }; },
    // The real wave() caches a PeriodicWave per duty, derived from `imag` by
    // pure arithmetic on the duty value — carrying the coefficients forward
    // lets the trace tell two timbres apart without needing to know "duty"
    // is the thing that produced them.
    createPeriodicWave(real, imag) { return { imag: Array.from(imag) }; },
  };
  return { ctx, trace };
}

function renderTrace(trackName) {
  const { ctx, trace } = mockCtx();
  const t = TRACKS[trackName];
  const rowDur = 60 / (t.bpm || 120) / (t.rowsPerBeat || 4);
  const a = new Audio();
  a.init(ctx);
  a.addTracks(TRACKS);
  a.play(trackName);
  let time = a._nextRowTime;
  for (let i = 0; i < ROWS && a.track; i++) { a._scheduleRow(time, rowDur); time += rowDur; }
  return trace;
}

const names = Object.keys(TRACKS).sort();
const current = {};
for (const name of names) current[name] = renderTrace(name);

if (RECORD) {
  await mkdir(dirname(BASELINE), { recursive: true });
  await writeFile(BASELINE, JSON.stringify(current, null, 1) + '\n');
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
  const wantStr = JSON.stringify(want);
  const gotStr = JSON.stringify(got);
  if (wantStr === gotStr) continue;
  // Find the first differing call so a failure is diagnosable, not just red.
  let i = 0;
  while (i < want.length && i < got.length && JSON.stringify(want[i]) === JSON.stringify(got[i])) i++;
  problems.push(`${name}: diverges at call ${i} of ${want.length} — ` +
    `want ${JSON.stringify(want[i])}, got ${JSON.stringify(got[i])}`);
}
for (const name of Object.keys(baseline)) {
  if (!TRACKS[name]) problems.push(`${name}: in baseline but no longer a track (stale baseline entry)`);
}

console.log(`check-audio-render: ${names.length} tracks traced against baseline`);
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error('  ' + p);
  console.error('\nIf this divergence is an intended change to the music engine, re-record with:');
  console.error('  node tools/check-audio-render.mjs --record');
  process.exit(1);
}
console.log('check-audio-render: OK — every track schedules the same Web Audio calls as its baseline');
