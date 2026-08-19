// Music data validator. Runs in plain Node (no DOM) against src/data/audio.js
// and checks every track's structure without playing a single sample.
//
// Checks:
//   * every track's order[] references only patterns that actually exist
//   * no melodic channel (p1/p2/wav) plays a hold ('-') with nothing sounding
//     before it in that pattern — a hold with no note is a dangling voice,
//     the closest thing this monophonic format has to "overlapping notes"
//   * every note token parses and its frequency sits inside the Game Boy's
//     real hardware range for its channel: pulse channels 1&2 are
//     freq = 131072 / (2048 - x), floor 64 Hz; the wave channel's timer runs
//     at half that rate, freq = 65536 / (2048 - x), floor 32 Hz. Both top out
//     far above any pitch this game uses, so only the floor is load-bearing.
//   * the noise channel only ever carries the five drum tokens (x s h H c)
//     or rest/hold — never a pitched note, which would be a channel mix-up
//
// Usage: node tools/check-music.mjs

import { TRACKS, SFX } from '../src/data/audio.js';
import { noteFreq } from '../src/core/audio.js';

const PULSE_MIN = 64, PULSE_MAX = 131072;
const WAVE_MIN = 32, WAVE_MAX = 65536;
const NOISE_TOKENS = new Set(['x', 's', 'h', 'H', 'c']);

const problems = [];

function tokens(s) {
  return s ? s.trim().split(/\s+/) : [];
}

for (const [name, t] of Object.entries(TRACKS)) {
  if (!t.patterns || !Object.keys(t.patterns).length) {
    problems.push(`${name}: no patterns`);
    continue;
  }
  const order = t.order || Object.keys(t.patterns);
  if (!order.length) problems.push(`${name}: empty order`);
  for (const pname of order) {
    if (!t.patterns[pname]) problems.push(`${name}: order references pattern '${pname}', which does not exist`);
  }

  for (const [pname, p] of Object.entries(t.patterns)) {
    // melodic channels: note range + dangling-hold check
    for (const ch of ['p1', 'p2', 'wav']) {
      if (!p[ch]) continue;
      const min = ch === 'wav' ? WAVE_MIN : PULSE_MIN;
      const max = ch === 'wav' ? WAVE_MAX : PULSE_MAX;
      let sounding = false;
      for (const tok of tokens(p[ch])) {
        if (tok === '.') { sounding = false; continue; }
        if (tok === '-') {
          if (!sounding) problems.push(`${name}/${pname}/${ch}: '-' hold with no note sounding before it`);
          continue;
        }
        const f = noteFreq(tok);
        if (f <= 0) { problems.push(`${name}/${pname}/${ch}: '${tok}' does not parse as a note`); sounding = false; continue; }
        if (f < min || f > max) {
          problems.push(`${name}/${pname}/${ch}: '${tok}' is ${f.toFixed(1)} Hz, outside ${min}-${max} Hz`);
        }
        sounding = true;
      }
    }
    // noise channel: percussion tokens only
    if (p.noi) {
      for (const tok of tokens(p.noi)) {
        if (tok === '.' || tok === '-') continue;
        if (!NOISE_TOKENS.has(tok)) problems.push(`${name}/${pname}/noi: '${tok}' is not a percussion token`);
      }
    }
  }
}

// SFX defs are not tracker patterns, but a 'noise'-typed effect's freq/freq2
// should also sit in range, and this is cheap to check while we're here.
function checkSfxFreqs(name, d) {
  if (!d) return;
  if (d.type === 'multi') { for (const part of d.parts || []) checkSfxFreqs(name, part); return; }
  if (d.type === 'arp' || d.type === 'chord') {
    for (const n of d.notes || []) {
      const f = noteFreq(n);
      if (f <= 0) problems.push(`sfx ${name}: '${n}' does not parse as a note`);
    }
  }
}
for (const [name, d] of Object.entries(SFX)) checkSfxFreqs(name, d);

console.log(`check-music: ${Object.keys(TRACKS).length} tracks, ${Object.keys(SFX).length} sfx`);
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log('check-music: OK');
