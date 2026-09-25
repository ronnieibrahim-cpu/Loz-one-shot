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
//   * a track's `intro` (the non-looping lead-in, S7) is a non-empty list of
//     patterns that exist, shares no pattern with `order` (a pattern in both
//     is heard again on every loop, which is the one thing a lead-in is
//     defined by not doing), and is absent from one-shot `loop:false` tracks,
//     which have no loop for it to lead into
//   * every pattern a track defines is reached by `intro` or `order` — an
//     authored pattern nothing plays is silent work, and an intro makes that
//     easy to write by accident
//   * IN THE ENGINE, not just in the data: each intro'd track is actually
//     driven through enough rows for two full loops, and the patterns it
//     schedules must be exactly `intro` once followed by `order` repeating.
//     A structural check cannot see an off-by-one in the wrap that replays
//     the lead-in every loop or drops the first bar of the body — and that
//     failure is inaudible in any check that only reads the data
//   * an `echo` channel config names a real, different melodic channel to
//     echo, and refuses to co-exist with authored pattern text on the same
//     channel in the same pattern — an authored token always wins in the
//     engine, so a track carrying both is a track whose author does not know
//     which one is actually going to play
//   * a SEASONS track (S151: `{ seasons: name }`, the cartridge's own channel
//     scripts played by src/core/gbsound.js) names a track the ripper emitted;
//     every goto lands inside its stream; every note is inside the engine's
//     frequency table (or, on the noise channel, in its drum table); every
//     waveform the wave channel selects exists; a looped track finds its loop
//     on every channel and every channel loops in the SAME length (the buffer
//     loops them together, so a mismatch would drift a channel a little more
//     each time round); and the render is not silence
//
// Usage: node tools/check-music.mjs

import { TRACKS, SFX } from '../src/data/audio.js';
import { Audio, noteFreq, DEFAULT_CFG, vibratoRange } from '../src/core/audio.js';
import { mockCtx } from './lib/mock-audio-ctx.mjs';
import { SEASONS_MUSIC, GB_FREQ, GB_WAVEFORMS, GB_NOISE } from '../src/data/music-seasons.js';
import { renderSeasons, runEngine, loopOf } from '../src/core/gbsound.js';

const PULSE_MIN = 64, PULSE_MAX = 131072;
const WAVE_MIN = 32, WAVE_MAX = 65536;
const NOISE_TOKENS = new Set(['x', 's', 'h', 'H', 'c']);
const MELODIC_CHANNELS = ['p1', 'p2', 'wav'];

const problems = [];

function tokens(s) {
  return s ? s.trim().split(/\s+/) : [];
}

let seasonsCount = 0;
function checkSeasons(name, t) {
  seasonsCount++;
  const tr = SEASONS_MUSIC[t.seasons];
  if (!tr) { problems.push(`${name}: seasons track '${t.seasons}' was not ripped`); return; }
  const ev = tr.events;
  const kind = (k) => (k <= 3 ? 'sq' : k <= 5 ? 'wave' : k === 6 ? 'noise' : 'raw');
  for (const [k, start] of Object.entries(tr.ch)) {
    // Walk every event this channel can reach.
    const seen = new Set(), todo = [start];
    while (todo.length) {
      let pc = todo.pop();
      while (pc < ev.length && !seen.has(pc)) {
        seen.add(pc);
        const e = ev[pc];
        if (e[0] === 7) break;
        if (e[0] === 6) {
          if (!(e[1] >= 0 && e[1] < ev.length)) problems.push(`${name}: ch${k} goto ${e[1]} outside the stream`);
          else todo.push(e[1]);
          break;
        }
        if (e[0] === 0) {
          const kk = kind(Number(k));
          if (kk === 'noise' && !GB_NOISE[e[1]]) problems.push(`${name}: ch${k} noise note $${e[1].toString(16)} not in the drum table`);
          if (kk === 'sq' && !(e[1] - 12 >= 0 && e[1] - 12 < GB_FREQ.length)) problems.push(`${name}: ch${k} note ${e[1]} off the frequency table`);
          if (kk === 'wave' && !(e[1] >= 0 && e[1] < GB_FREQ.length)) problems.push(`${name}: ch${k} note ${e[1]} off the frequency table`);
          if (!(e[2] > 0)) problems.push(`${name}: ch${k} note of length ${e[2]}`);
        }
        if (e[0] === 4 && kind(Number(k)) === 'wave' && !GB_WAVEFORMS[e[1]]) {
          problems.push(`${name}: ch${k} selects waveform $${e[1].toString(16)}, which was not ripped`);
        }
        pc++;
      }
    }
  }
  const jingle = t.seasons === 'getItem';
  const loop = loopOf(tr);
  if (!jingle && !loop) problems.push(`${name}: no loop found on every channel`);
  if (loop) {
    // Every channel's own loop must be the same length.
    const lens = [];
    for (const [k, start] of Object.entries(tr.ch)) {
      let pc = start, target = null;
      for (let i = 0; i < 100000 && pc < ev.length; i++) {
        const e = ev[pc];
        if (e[0] === 7) break;
        if (e[0] === 6) { if (e[1] <= pc) { target = e[1]; break; } pc = e[1]; continue; }
        pc++;
      }
      if (target == null) continue;
      const { firstVisit } = runEngine(tr, loop.intro + loop.length + 1);
      const a = firstVisit[k].get(target), b = firstVisit[k].get(pc);
      if (a != null && b != null) lens.push(b - a);
    }
    if (new Set(lens).size > 1) problems.push(`${name}: channels loop in different lengths ${lens.join('/')}`);
  }
  const r = renderSeasons(t.seasons, 8192);
  let peak = 0;
  for (const x of r.data) peak = Math.max(peak, Math.abs(x));
  if (!(peak > 0.01)) problems.push(`${name}: renders as silence`);
}

for (const [name, t] of Object.entries(TRACKS)) {
  if (t.seasons) { checkSeasons(name, t); continue; }
  if (!t.patterns || !Object.keys(t.patterns).length) {
    problems.push(`${name}: no patterns`);
    continue;
  }
  const order = t.order || Object.keys(t.patterns);
  if (!order.length) problems.push(`${name}: empty order`);
  for (const pname of order) {
    if (!t.patterns[pname]) problems.push(`${name}: order references pattern '${pname}', which does not exist`);
  }

  // --- the non-looping lead-in ---------------------------------------------
  const intro = t.intro;
  if (intro !== undefined) {
    if (!Array.isArray(intro) || !intro.length) {
      problems.push(`${name}: intro must be a non-empty array of pattern names`);
    } else {
      if (t.loop === false) {
        problems.push(`${name}: has an intro but loop:false — a one-shot track has no loop for a ` +
          `lead-in to lead into, so put the lead-in at the front of order instead`);
      }
      for (const pname of intro) {
        if (!t.patterns[pname]) problems.push(`${name}: intro references pattern '${pname}', which does not exist`);
        if (order.includes(pname)) {
          problems.push(`${name}: pattern '${pname}' is in BOTH intro and order — it would be heard again on ` +
            `every loop, which is exactly what a lead-in is not`);
        }
      }
    }
  }

  // A pattern nothing plays. Cheap here, and an intro makes it easy to write
  // one by renaming half a sequence.
  const reached = new Set([...order, ...(Array.isArray(intro) ? intro : [])]);
  for (const pname of Object.keys(t.patterns)) {
    if (!reached.has(pname)) {
      problems.push(`${name}: pattern '${pname}' is defined but neither intro nor order ever plays it`);
    }
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

// --------------------------------------------------------------------------
// The intro, in the engine
// --------------------------------------------------------------------------
//
// Everything above reads the data. This DRIVES `Audio._scheduleRow` — the
// same code path a real browser runs, against the mock context from
// tools/lib/mock-audio-ctx.mjs — and asks the engine itself which pattern it
// played on each row, rather than re-deriving where the wrap ought to fall.
// (Same rule as a collision checker calling `solidAt` instead of modelling
// it: a private model of the wrap would not fail when the real wrap changed.)

/** The exact sequence of patterns `name` schedules over `passes` loops of its
 *  body, read out of the engine as it plays. */
function playedPatterns(name, passes) {
  const t = TRACKS[name];
  const { ctx } = mockCtx();
  const a = new Audio();
  a.init(ctx);
  a.addTracks(TRACKS);
  a.play(name);

  // Ask the engine which pattern is current; never guess. Keeping only the
  // LAST value per row matters because `_scheduleRow` may consult this twice
  // on a row that wraps into the next pattern.
  const byPattern = new Map(Object.entries(t.patterns).map(([k, v]) => [v, k]));
  const orig = a._currentPattern.bind(a);
  let lastName = null;
  a._currentPattern = () => { const p = orig(); if (p) lastName = byPattern.get(p) ?? '?'; return p; };

  const order = t.order || Object.keys(t.patterns);
  const intro = Array.isArray(t.intro) ? t.intro : [];
  const rowsOf = pname => a._patternLength(t.patterns[pname]);
  const total = [...intro, ...order].reduce((n, p) => n + rowsOf(p), 0)
    + (passes - 1) * order.reduce((n, p) => n + rowsOf(p), 0);

  const rowDur = 60 / (t.bpm || 120) / (t.rowsPerBeat || 4);
  const played = [];
  let prevIdx = null;
  let time = a._nextRowTime;
  for (let i = 0; i < total && a.track; i++) {
    a._scheduleRow(time, rowDur);
    time += rowDur;
    // After the call, `_orderIdx` is the index of the pattern that row
    // belonged to — the wrap happens at the top of `_scheduleRow`.
    if (prevIdx === null || a._orderIdx !== prevIdx) played.push(lastName);
    prevIdx = a._orderIdx;
  }
  return played;
}

const PASSES = 2;
for (const [name, t] of Object.entries(TRACKS)) {
  if (!Array.isArray(t.intro) || !t.intro.length) continue;
  if (t.intro.some(p => !t.patterns[p])) continue;   // already reported above
  const order = t.order || Object.keys(t.patterns);
  const want = [...t.intro, ...order, ...order];
  const got = playedPatterns(name, PASSES);
  if (JSON.stringify(got) !== JSON.stringify(want)) {
    problems.push(`${name}: over ${PASSES} loops the engine played [${got.join(' ')}] but the ` +
      `track says intro+order+order = [${want.join(' ')}] — the lead-in is not being spent exactly once`);
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

const introCount = Object.values(TRACKS).filter(t => Array.isArray(t.intro) && t.intro.length).length;
console.log(`check-music: ${Object.keys(TRACKS).length} tracks (${seasonsCount} of them Seasons' own, ${introCount} with an intro), ` +
  `${Object.keys(SFX).length} sfx`);
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log('check-music: OK');
