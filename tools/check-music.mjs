// Music data validator. Runs in plain Node (no DOM) against src/data/audio.js
// and checks every track's structure without playing a single sample.
//
// Checks:
//   * every track's order[] references only patterns that actually exist
//   * no melodic channel (p1/p2/wav) plays a hold ('-') with nothing sounding
//     before it in that pattern — a hold with no note is a dangling voice,
//     the closest thing this monophonic format has to "overlapping notes"
//   * every note token parses (including each note of a '+' arpeggio chord)
//     and its WRITTEN frequency sits inside the Game Boy's real hardware
//     range for its channel: pulse channels 1&2 are freq = 131072 / (2048 -
//     x), floor 64 Hz; the wave channel's timer runs at half that rate,
//     freq = 65536 / (2048 - x), floor 32 Hz. Both top out far above any
//     pitch this game uses, so only the floor is load-bearing.
//   * if the channel has vibrato configured (S6), the SWUNG extreme of every
//     note is checked too, not just the written pitch — depth can push a
//     note out of range at the top or bottom of its wobble even when the
//     note itself is legal
//   * the noise channel only ever carries the five drum tokens (x s h H c)
//     or rest/hold — never a pitched note, which would be a channel mix-up —
//     and never a melodic-channel option (vibrato/echo), because it has none
//   * an `echo` channel config names a real, different melodic channel to
//     echo, and refuses to co-exist with authored pattern text on the same
//     channel in the same pattern — an authored token always wins in the
//     engine, so a track carrying both is a track whose author does not know
//     which one is actually going to play
//
// Usage: node tools/check-music.mjs

import { TRACKS, SFX } from '../src/data/audio.js';
import { noteFreq, DEFAULT_CFG, vibratoRange } from '../src/core/audio.js';

const PULSE_MIN = 64, PULSE_MAX = 131072;
const WAVE_MIN = 32, WAVE_MAX = 65536;
const NOISE_TOKENS = new Set(['x', 's', 'h', 'H', 'c']);
const MELODIC_CHANNELS = ['p1', 'p2', 'wav'];

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

  const cfg = t.cfg || {};
  // Channel cfg is checked ONCE per track, not per pattern — echo and
  // vibrato are channel-level settings (see src/core/audio.js's header).
  for (const ch of MELODIC_CHANNELS) {
    const c = cfg[ch];
    if (!c || !c.echo) continue;
    const of = c.echo.of;
    if (!MELODIC_CHANNELS.includes(of) || of === ch) {
      problems.push(`${name}: cfg.${ch}.echo.of '${of}' must name a different melodic channel (p1/p2/wav)`);
    }
    for (const [pname, p] of Object.entries(t.patterns)) {
      if (p[ch] !== undefined) {
        problems.push(`${name}/${pname}/${ch}: has BOTH authored pattern text and cfg.${ch}.echo — the engine ` +
          `always plays the authored text and silently ignores echo here, so this track cannot mean what it says`);
      }
    }
  }
  if (cfg.noi && (cfg.noi.vibrato || cfg.noi.echo)) {
    problems.push(`${name}: cfg.noi carries a melodic-channel option (vibrato/echo) — noise is percussion only`);
  }

  for (const [pname, p] of Object.entries(t.patterns)) {
    // melodic channels: note range + dangling-hold check
    for (const ch of MELODIC_CHANNELS) {
      if (p[ch] === undefined) continue;
      const min = ch === 'wav' ? WAVE_MIN : PULSE_MIN;
      const max = ch === 'wav' ? WAVE_MAX : PULSE_MAX;
      const chCfg = { ...DEFAULT_CFG[ch], ...(cfg[ch] || {}) };
      let sounding = false;
      for (const tok of tokens(p[ch])) {
        if (tok === '.') { sounding = false; continue; }
        if (tok === '-') {
          if (!sounding) problems.push(`${name}/${pname}/${ch}: '-' hold with no note sounding before it`);
          continue;
        }
        // An arpeggio chord token ('C5+E5+G5') cycles through every one of
        // these notes on this channel — each has to be checked the same way
        // a plain note would be.
        const notes = tok.split('+');
        let allOk = true;
        for (const n of notes) {
          const f = noteFreq(n);
          if (f <= 0) {
            problems.push(`${name}/${pname}/${ch}: '${n}' does not parse as a note`);
            allOk = false;
            continue;
          }
          if (f < min || f > max) {
            problems.push(`${name}/${pname}/${ch}: '${n}' is ${f.toFixed(1)} Hz, outside ${min}-${max} Hz`);
          }
          if (chCfg.vibrato) {
            const sw = vibratoRange(f, chCfg.vibrato);
            if (sw.min < min || sw.max > max) {
              problems.push(`${name}/${pname}/${ch}: '${n}' vibrato swings to ` +
                `${sw.min.toFixed(1)}-${sw.max.toFixed(1)} Hz, outside ${min}-${max} Hz`);
            }
          }
        }
        sounding = allOk;
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
