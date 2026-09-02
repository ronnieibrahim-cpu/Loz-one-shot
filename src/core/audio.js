// Game Boy style 4-channel synthesiser: two pulse channels with selectable duty,
// one wave (triangle) channel for bass, one noise channel for percussion.
//
// MUSIC FORMAT (contract for track data files):
//
//   {
//     bpm: 140,
//     rowsPerBeat: 4,          // 4 = each row is a 16th note
//     loop: true,
//     cfg: {                   // optional per-channel overrides
//       p1: { duty: 0.5,  vol: 0.20, decay: 0.10 },
//       p2: { duty: 0.25, vol: 0.14, decay: 0.14 },
//       wav:{ vol: 0.26, decay: 0.06 },
//       noi:{ vol: 0.16 }
//     },
//     patterns: {
//       A: {
//         p1:  "C5 .  E5 .  G5 -  -  .   F5 .  D5 .  C5 -  -  .",
//         p2:  "G4 .  .  .  C5 .  .  .   A4 .  .  .  G4 .  .  .",
//         wav: "C3 -  -  -  G2 -  -  -   F2 -  -  -  G2 -  -  -",
//         noi: "x  .  h  .  s  .  h  .   x  .  h  .  s  .  h  h"
//       }
//     },
//     order: ['A','A','B','A'],
//     intro: ['I']            // optional, see below
//   }
//
// `intro` is a sequence of pattern names played ONCE, as a non-looping
// lead-in, before `order` begins — the flourish a source track opens on and
// never returns to. It is deliberately NOT expressible as `order` plus a
// loop point: `order` is the loop, and a track that wants a lead-in wants
// exactly one pattern list that is left behind and one that repeats forever.
// The intro is left behind on the first wrap and is never scheduled again for
// the life of that playback; restarting the track (`play(name,{restart:true})`,
// or resuming after a jingle) plays it again from the top, because that IS a
// fresh playback. A one-shot track (`loop:false`, i.e. a jingle) has no loop
// for an intro to lead into, so it must not declare one — check-music.mjs
// enforces that.
//
// Token grammar (whitespace separated):
//   'C4' 'C#4' 'Db4'  start a note at that pitch
//   'C4+E4+G4'        a CHORD token: arpeggiate through the notes on this one
//                      channel, cycling at ARPEGGIO_STEP_FRAMES. Real hardware
//                      has no polyphony; this is how the source games fake a
//                      chord on a single channel, and it is why this is the
//                      per-NOTE technique — plain notes on the same channel are
//                      unaffected, only a token you write with '+' arpeggiates.
//   '-'               hold the previous note (or arpeggio) through this row
//   '.'               silence from this row
//   noise channel:    'x' kick, 's' snare, 'h' closed hat, 'H' open hat, 'c' crash
//
// Rows are looked up per-pattern; a channel may be omitted or shorter than the
// pattern's longest channel, in which case it is silent for the remainder.
//
// cfg per channel also takes two more (optional, S6) techniques, both
// PER-CHANNEL rather than per-note:
//
//   vibrato: { delayFrames, stepFrames, depth }
//     A pitch wobble on notes the channel holds long enough to reach
//     `delayFrames` (the source almost never wobbles from the attack). It
//     STEPS on a `stepFrames` grid via repeated `setValueAtTime` calls, never
//     a continuous ramp — real hardware retriggers pitch on a frame grid, and
//     a smooth LFO reads as a synth pad, not a Game Boy. `depth` is in
//     semitones above/below the written pitch. Defaults come from feel.js
//     (VIBRATO_DELAY_FRAMES/STEP_FRAMES/DEPTH_SEMITONES) — it is a timing
//     constant (R3). It is "per-note" in effect anyway: the delay is measured
//     from each note's own onset, so a channel with vibrato configured only
//     ever wobbles the notes actually held long enough, never a passing stab.
//
//   echo: { of: 'p1', rows: 2, volMul: 0.45 }
//     The classic quieter, delayed repeat of another channel's line — usually
//     the lead on the second pulse channel. This is a CHANNEL CONFIG, not a
//     pattern-authoring convention: hand-copying the lead line into p2's
//     pattern text with a row offset would double the pattern data and let
//     the two drift the moment either is edited, and `rows` is expressed in
//     ROWS (not a feel.js frame count) because the delay has to track the
//     track's own tempo — an eighth-note echo is a different frame count at
//     88bpm than at 132bpm, and rows are already the track's native clock.
//     Only usable on a channel whose PATTERN OMITS that channel entirely for
//     the pattern in question (an authored token always wins) — see
//     `_echoEvent` in this file.
//
// The noise channel is percussion only and takes none of the above.

import { Stream } from './rng.js';
import { VIBRATO_DELAY_FRAMES, VIBRATO_STEP_FRAMES, VIBRATO_DEPTH_SEMITONES, ARPEGGIO_STEP_FRAMES } from '../data/feel.js';

const NOTE_BASE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function noteFreq(tok) {
  const m = /^([A-Ga-g])([#b]?)(-?\d)$/.exec(tok);
  if (!m) return 0;
  let semi = NOTE_BASE[m[1].toUpperCase()];
  if (m[2] === '#') semi++;
  else if (m[2] === 'b') semi--;
  const oct = parseInt(m[3], 10);
  // MIDI note number: C4 = 60
  const midi = (oct + 1) * 12 + semi;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Fourier series for a pulse wave of the given duty cycle.
function pulseWave(ctx, duty, harmonics = 28) {
  const real = new Float32Array(harmonics + 1);
  const imag = new Float32Array(harmonics + 1);
  for (let n = 1; n <= harmonics; n++) {
    // Pulse = difference of two saws; amplitude of harmonic n
    imag[n] = (2 / (n * Math.PI)) * Math.sin(Math.PI * n * duty);
  }
  return ctx.createPeriodicWave(real, imag, { disableNormalization: false });
}

function noiseBuffer(ctx, seconds = 1) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  // Emulate the LFSR-ish character of GB noise with a coarse sample-and-hold.
  // This is a fixed waveform, not a gameplay roll, so it gets its own stream on
  // a constant seed rather than the save's: the drum hiss should be the same
  // sound in every run, and it must not perturb anything the game rolls.
  const noise = new Stream(0x5EED10FF, 'noise');
  let v = 0;
  for (let i = 0; i < len; i++) {
    if ((i & 3) === 0) v = noise.float() * 2 - 1;
    d[i] = v;
  }
  return buf;
}

const DRUMS = {
  x: { freq: 120, sweep: 46, dur: 0.11, q: 1.1, gain: 1.0, lp: true },   // kick
  s: { freq: 1500, sweep: 900, dur: 0.10, q: 0.9, gain: 0.72 },          // snare
  h: { freq: 6200, sweep: 6000, dur: 0.035, q: 2.0, gain: 0.42 },        // closed hat
  H: { freq: 5200, sweep: 4600, dur: 0.13, q: 1.6, gain: 0.46 },         // open hat
  c: { freq: 3400, sweep: 2600, dur: 0.34, q: 0.7, gain: 0.5 },          // crash
};

// Exported so tools/check-music.mjs merges channel cfg the same way the
// engine does, instead of keeping a second copy of the defaults that could
// drift from these (the same reason a checker must call the engine's own
// collision code rather than re-deriving it).
export const DEFAULT_CFG = {
  // No `glide` here. Each of these carried one, set to 0, and nothing in the
  // engine ever read it — a portamento that was configured and never
  // implemented, which reads to the next person as a feature that is switched
  // off rather than one that does not exist.
  p1: { duty: 0.5, vol: 0.20, decay: 0.10 },
  p2: { duty: 0.25, vol: 0.13, decay: 0.14 },
  wav: { vol: 0.24, decay: 0.05 },
  noi: { vol: 0.15 },
};

// `rows`/`volMul` defaults for an echo channel. Deliberately not in feel.js —
// see the `echo` comment in the header above.
const ECHO_DEFAULT = { rows: 2, volMul: 0.45 };

/** The frequency range a vibrato-configured note swings across, so a checker
 *  can validate the SWUNG extreme rather than just the written pitch. */
export function vibratoRange(freq, vcfg) {
  const depth = (vcfg && vcfg.depth) ?? VIBRATO_DEPTH_SEMITONES;
  return { min: freq * Math.pow(2, -depth / 12), max: freq * Math.pow(2, depth / 12) };
}

function tokens(s) {
  return s ? s.trim().split(/\s+/) : [];
}

// Parses one pattern-row token into a scheduling event. Shared by the normal
// per-channel path and, indirectly, by check-music.mjs's chord validation —
// see the '+' case, the arpeggio's per-NOTE token (S6's MUSIC FORMAT comment).
function parseToken(tok) {
  if (tok === undefined) return { kind: 'undef' };
  if (tok === '.') return { kind: 'off' };
  if (tok === '-') return { kind: 'hold' };
  if (tok.indexOf('+') !== -1) {
    const freqs = tok.split('+').map(noteFreq);
    if (freqs.length > 1 && freqs.every(f => f > 0)) return { kind: 'on', freq: freqs[0], chord: freqs };
    return { kind: 'hold' };
  }
  const f = noteFreq(tok);
  return f > 0 ? { kind: 'on', freq: f } : { kind: 'hold' };
}

// A pattern's channel key can be entirely absent from a shorter channel, or
// past its own token count — both cases used to be an inline `undefined ||
// '.'` check. `parseToken` returns 'undef' for a missing token; this turns
// that into the ORIGINAL rule for what happens next: cut the voice only on
// row 0 (matches a channel that never had anything to say this pattern),
// otherwise leave a still-ringing note alone instead of a channel that ran
// out of authored rows early.
function resolveEvent(raw, row) {
  return raw.kind === 'undef' ? { kind: row === 0 ? 'off' : 'hold' } : raw;
}

export class Audio {
  constructor() {
    this.ctx = null;
    this.ok = false;
    this.muted = false;
    this.musicVol = 0.75;
    this.sfxVol = 0.9;
    this.track = null;
    this.tracks = new Map();
    this.sfxDefs = new Map();
    this._waves = new Map();
    this._noise = null;
    this._nextRowTime = 0;
    this._row = 0;
    this._orderIdx = 0;
    // Whether this playback has already spent the track's `intro`. The
    // sequence being stepped is intro+order until it wraps once, order after.
    this._introDone = false;
    this._seq = null;
    this._held = { p1: null, p2: null, wav: null };
    this._voices = { p1: null, p2: null, wav: null };
    // Recent per-channel row events (kind + freq), pruned to a small window.
    // This is the only thing an echo channel reads — see `_echoEvent`.
    this._rowLog = { p1: [], p2: [], wav: [] };
    this._globalRow = 0;
    this._jingle = null;
    this._pendingTrack = undefined;
    this._fade = 1;
  }

  /** Must be called from a user gesture (browser autoplay policy) for real
   *  playback. `ctxOverride` lets a render/test harness pass in an
   *  OfflineAudioContext instead, so it exercises this exact setup path
   *  rather than a second copy of it. */
  init(ctxOverride) {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return this.ok; }
    try {
      let ctx = ctxOverride;
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        ctx = new AC();
      }
      this.ctx = ctx;
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = this.musicVol;
      this.musicBus.connect(this.master);
      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = this.sfxVol;
      this.sfxBus.connect(this.master);
      // Gentle lowpass gives the whole mix a small-speaker character.
      this.tone = this.ctx.createBiquadFilter();
      this.tone.type = 'lowpass';
      this.tone.frequency.value = 9000;
      this.tone.connect(this.master);
      this._noise = noiseBuffer(this.ctx);
      this.ok = true;
    } catch (e) {
      console.warn('[audio] unavailable', e);
      this.ok = false;
    }
    return this.ok;
  }

  addTracks(defs) { for (const [k, v] of Object.entries(defs)) this.tracks.set(k, v); return this; }
  addSfx(defs) { for (const [k, v] of Object.entries(defs)) this.sfxDefs.set(k, v); return this; }

  wave(duty) {
    let w = this._waves.get(duty);
    if (!w) { w = pulseWave(this.ctx, duty); this._waves.set(duty, w); }
    return w;
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.9;
  }
  toggleMute() { this.setMuted(!this.muted); return this.muted; }

  /** Start a named track. No-op if it is already playing. */
  play(name, { restart = false } = {}) {
    if (!this.ok) { this._pendingTrack = name; return; }
    if (this.trackName === name && !restart) return;
    const t = this.tracks.get(name);
    this.trackName = name;
    this.track = t || null;
    this._row = 0;
    this._orderIdx = 0;
    this._nextRowTime = this.ctx.currentTime + 0.06;
    this._releaseAll();
  }

  stop() {
    this.track = null;
    this.trackName = null;
    this._releaseAll();
  }

  /** Play a short jingle, suspending the music until it finishes. */
  jingle(name) {
    if (!this.ok) return;
    const t = this.tracks.get(name);
    if (!t) return;
    this._jingle = { resume: this.trackName, track: t };
    this.trackName = '$jingle:' + name;
    this.track = t;
    this._row = 0;
    this._orderIdx = 0;
    this._nextRowTime = this.ctx.currentTime + 0.02;
    this._releaseAll();
  }

  _releaseAll() {
    for (const ch of ['p1', 'p2', 'wav']) {
      const v = this._voices[ch];
      if (v) { this._endVoice(v); this._voices[ch] = null; }
      this._held[ch] = null;
    }
    // A fresh track start is a fresh echo phase — an echo channel reading
    // stale rows from whatever last played would repeat the wrong lead.
    this._rowLog = { p1: [], p2: [], wav: [] };
    this._globalRow = 0;
    // Every call site of this is a track boundary (start, stop, or a
    // one-shot finishing), and every track boundary owes the next playback
    // its intro back — the same reasoning as the echo phase above.
    this._introDone = false;
    this._seq = null;
  }

  _endVoice(v) {
    try {
      const t = this.ctx.currentTime;
      v.gain.gain.cancelScheduledValues(t);
      v.gain.gain.setTargetAtTime(0, t, 0.012);
      v.osc.stop(t + 0.08);
    } catch (e) { /* already stopped */ }
  }

  /** Called every frame; schedules rows slightly ahead of the audio clock. */
  update() {
    if (!this.ok || !this.track) return;
    const t = this.track;
    const rowsPerBeat = t.rowsPerBeat || 4;
    const rowDur = 60 / (t.bpm || 120) / rowsPerBeat;
    const now = this.ctx.currentTime;
    const horizon = now + 0.12;
    let guard = 0;
    while (this._nextRowTime < horizon && guard++ < 64) {
      this._scheduleRow(this._nextRowTime, rowDur);
      this._nextRowTime += rowDur;
    }
  }

  /** The pattern sequence for the pass currently playing: `intro` prepended
   *  to `order` until the first wrap, `order` alone from then on. Cached
   *  because this is consulted on every scheduled row, and a track with no
   *  intro returns the track's own `order` array untouched — the no-intro
   *  path allocates nothing and behaves exactly as it did before intros
   *  existed, which is what check-audio-render.mjs is holding it to. */
  _sequence() {
    const t = this.track;
    const order = t.order || Object.keys(t.patterns || {});
    if (this._introDone || !t.intro || !t.intro.length) return order;
    if (!this._seq) this._seq = t.intro.concat(order);
    return this._seq;
  }

  _currentPattern() {
    const seq = this._sequence();
    if (!seq.length) return null;
    const name = seq[this._orderIdx % seq.length];
    return this.track.patterns[name] || null;
  }

  _patternLength(p) {
    if (!p) return 0;
    let n = 0;
    for (const ch of ['p1', 'p2', 'wav', 'noi']) {
      if (p[ch]) n = Math.max(n, tokens(p[ch]).length);
    }
    return n;
  }

  _scheduleRow(time, rowDur) {
    const t = this.track;
    let pat = this._currentPattern();
    if (!pat) { this.track = null; return; }
    let len = this._patternLength(pat);
    if (this._row >= len) {
      this._row = 0;
      this._orderIdx++;
      if (this._orderIdx >= this._sequence().length) {
        if (t.loop === false) {
          // jingle or one-shot finished
          const j = this._jingle;
          this.track = null; this.trackName = null;
          this._releaseAll();
          if (j && j.resume) { this._jingle = null; this.play(j.resume, { restart: true }); }
          return;
        }
        // The lead-in has now had its one pass; from here the loop is
        // `order` alone. Setting this AFTER the length test above is what
        // makes the intro count toward the first wrap and no other.
        this._introDone = true;
        this._orderIdx = 0;
      }
      pat = this._currentPattern();
      len = this._patternLength(pat);
      if (!pat || !len) { this.track = null; return; }
    }

    const cfg = t.cfg || {};
    for (const ch of ['p1', 'p2', 'wav']) {
      const chCfg = { ...DEFAULT_CFG[ch], ...(cfg[ch] || {}) };
      // An echo channel has NO pattern text of its own for this pattern — an
      // authored token always wins, even a lone rest, which is why this only
      // triggers when the whole channel key is absent (see the `echo`
      // comment in this file's header).
      const ev = (pat[ch] === undefined && chCfg.echo)
        ? this._echoEvent({ ...ECHO_DEFAULT, ...chCfg.echo })
        : resolveEvent(parseToken(tokens(pat[ch])[this._row]), this._row);
      this._logRow(ch, ev);
      if (ev.kind === 'off') this._noteOff(ch, time);
      else if (ev.kind === 'on') {
        // A quieter repeat, per the `echo` comment: the echo channel's own
        // vol is its pre-attenuation level, and volMul is the "quieter" in
        // "quieter, delayed repeat".
        const onCfg = ev.echoVolMul ? { ...chCfg, vol: (chCfg.vol ?? 0.18) * ev.echoVolMul } : chCfg;
        this._noteOn(ch, ev.freq, time, rowDur, onCfg, ev.chord);
      }
      else this._sustainRow(ch, time, rowDur);  // hold: keep vibrato/arpeggio ticking, otherwise no-op
    }
    const ntoks = tokens(pat.noi);
    const nt = ntoks[this._row];
    if (nt && nt !== '.' && nt !== '-') {
      this._drum(nt, time, { ...DEFAULT_CFG.noi, ...(cfg.noi || {}) });
    }
    this._row++;
    this._globalRow++;
  }

  /** What an echo channel plays this row: whatever its source channel did
   *  `rows` rows ago. Reads `_rowLog` only — it never re-derives note
   *  scheduling, it replays what actually happened. */
  _echoEvent(echoCfg) {
    const log = this._rowLog[echoCfg.of];
    if (!log) return { kind: 'hold' };
    const targetRow = this._globalRow - echoCfg.rows;
    const hit = log.find(e => e.row === targetRow);
    if (!hit) return { kind: 'hold' };
    return hit.kind === 'on'
      ? { kind: 'on', freq: hit.freq, echoVolMul: echoCfg.volMul }
      : { kind: hit.kind };
  }

  _logRow(ch, ev) {
    const log = this._rowLog[ch];
    log.push({ row: this._globalRow, kind: ev.kind, freq: ev.freq || 0 });
    if (log.length > 64) log.shift();
  }

  /** A row where a channel neither starts nor stops a note (a '-' hold, or a
   *  pattern that has simply run out of tokens for it). The original engine
   *  did nothing at all here; this is the hook that lets a still-ringing
   *  voice keep stepping its vibrato or arpeggio — it is a no-op for any
   *  voice that has neither. */
  _sustainRow(ch, time, rowDur) {
    const v = this._voices[ch];
    if (!v) return;
    if (v.vibrato) this._scheduleVibrato(ch, time, rowDur);
    if (v.arp) this._scheduleArp(ch, time, rowDur);
  }

  _noteOff(ch, time) {
    const v = this._voices[ch];
    if (!v) return;
    try {
      v.gain.gain.cancelScheduledValues(time);
      v.gain.gain.setTargetAtTime(0, time, 0.012);
      v.osc.stop(time + 0.09);
    } catch (e) { /* noop */ }
    this._voices[ch] = null;
  }

  _noteOn(ch, freq, time, rowDur, c, chord) {
    this._noteOff(ch, time);
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    if (ch === 'wav') {
      osc.type = 'triangle';
    } else {
      osc.setPeriodicWave(this.wave(c.duty ?? 0.5));
    }
    osc.frequency.setValueAtTime(freq, time);
    const gain = ctx.createGain();
    const peak = (c.vol ?? 0.18);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(peak, time + 0.006);
    // Sustained decay toward a floor; the note is cut when the next row says so.
    gain.gain.setTargetAtTime(peak * 0.55, time + 0.008, Math.max(0.02, c.decay ?? 0.1));
    osc.connect(gain);
    gain.connect(this.musicBus);
    osc.start(time);
    osc.stop(time + rowDur * 64);           // safety stop; normally cut by _noteOff
    const voice = {
      osc, gain, baseFreq: freq, onsetTime: time,
      vibrato: c.vibrato || null,
      arp: (chord && chord.length > 1) ? { notes: chord } : null,
    };
    this._voices[ch] = voice;
    // Neither of these does anything unless the channel's cfg actually asked
    // for it, so a track that never sets `vibrato`/a chord token never pays
    // for this — see the byte-identical-render proof in tools/test.mjs.
    if (voice.vibrato) this._scheduleVibrato(ch, time, rowDur);
    if (voice.arp) this._scheduleArp(ch, time, rowDur);
  }

  /** Steps a held note's pitch up/down on a frame grid — never a smooth ramp,
   *  which is this session's whole failure condition (see the header
   *  comment). Stateless: it recomputes the step phase from `onsetTime` on
   *  every call, so calling it once per row from both `_noteOn` and
   *  `_sustainRow` cannot drift or double-schedule a step. */
  _scheduleVibrato(ch, time, rowDur) {
    const v = this._voices[ch];
    const cfg = v.vibrato;
    const stepSec = (cfg.stepFrames ?? VIBRATO_STEP_FRAMES) / 60;
    const delaySec = (cfg.delayFrames ?? VIBRATO_DELAY_FRAMES) / 60;
    const depth = cfg.depth ?? VIBRATO_DEPTH_SEMITONES;
    const start = v.onsetTime + delaySec;
    const rowEnd = time + rowDur;
    if (start >= rowEnd) return;    // hasn't earned the wobble yet this row
    const from = Math.max(time, start);
    let n = Math.max(0, Math.ceil((from - start) / stepSec - 1e-9));
    let stepTime = start + n * stepSec;
    let guard = 0;
    while (stepTime < rowEnd && guard++ < 32) {
      const dir = (n % 2 === 0) ? 1 : -1;
      v.osc.frequency.setValueAtTime(v.baseFreq * Math.pow(2, (dir * depth) / 12), Math.max(stepTime, time));
      n++; stepTime = start + n * stepSec;
    }
  }

  /** Cycles a chord token's notes on one channel — the per-NOTE technique,
   *  since only a token written with '+' ever reaches this. Stateless in the
   *  same way as vibrato, phased from the note's own onset. */
  _scheduleArp(ch, time, rowDur) {
    const v = this._voices[ch];
    const notes = v.arp.notes;
    const stepSec = ARPEGGIO_STEP_FRAMES / 60;
    const rowEnd = time + rowDur;
    let n = Math.max(0, Math.ceil((time - v.onsetTime) / stepSec - 1e-9));
    let stepTime = v.onsetTime + n * stepSec;
    let guard = 0;
    while (stepTime < rowEnd && guard++ < 32) {
      v.osc.frequency.setValueAtTime(notes[n % notes.length], Math.max(stepTime, time));
      n++; stepTime = v.onsetTime + n * stepSec;
    }
  }

  _drum(kind, time, c) {
    const d = DRUMS[kind] || DRUMS.h;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this._noise;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = d.lp ? 'lowpass' : 'bandpass';
    f.frequency.setValueAtTime(d.freq, time);
    f.frequency.exponentialRampToValueAtTime(Math.max(60, d.freq - d.sweep), time + d.dur);
    f.Q.value = d.q;
    const g = ctx.createGain();
    const peak = (c.vol ?? 0.15) * d.gain;
    g.gain.setValueAtTime(peak, time);
    g.gain.exponentialRampToValueAtTime(0.0005, time + d.dur);
    src.connect(f); f.connect(g); g.connect(this.musicBus);
    src.start(time);
    src.stop(time + d.dur + 0.02);
    if (kind === 'x') {
      // add a pitched thump so kicks read on tiny speakers
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.setValueAtTime(150, time);
      o.frequency.exponentialRampToValueAtTime(52, time + d.dur);
      const og = ctx.createGain();
      og.gain.setValueAtTime(peak * 1.5, time);
      og.gain.exponentialRampToValueAtTime(0.0005, time + d.dur);
      o.connect(og); og.connect(this.musicBus);
      o.start(time); o.stop(time + d.dur + 0.02);
    }
  }

  // --- sound effects -------------------------------------------------------
  //
  // SFX FORMAT: { type, ... }
  //   { type:'blip',  freq, freq2, dur, duty, vol }        pitch sweep pulse
  //   { type:'arp',   notes:['C5', 'E5', 'G5'], step, dur, duty, vol }
  //   { type:'noise', freq, freq2, dur, q, vol, lp }       filtered noise burst
  //   { type:'chord', notes:[...], dur, duty, vol }
  //   { type:'multi', parts:[ {delay, ...sfx} ] }
  sfx(name, { pitch = 1, vol = 1 } = {}) {
    if (!this.ok || this.muted) return;
    const d = this.sfxDefs.get(name);
    if (!d) return;
    this._renderSfx(d, this.ctx.currentTime + 0.001, pitch, vol);
  }

  _renderSfx(d, t0, pitch, volMul) {
    const ctx = this.ctx;
    switch (d.type) {
      case 'multi':
        for (const p of d.parts || []) this._renderSfx(p, t0 + (p.delay || 0), pitch, volMul);
        return;
      case 'arp': {
        const step = d.step ?? 0.045;
        (d.notes || []).forEach((n, i) => {
          this._renderSfx({ type: 'blip', freq: noteFreq(n), dur: d.dur ?? step * 1.4, duty: d.duty, vol: d.vol },
            t0 + i * step, pitch, volMul);
        });
        return;
      }
      case 'chord':
        for (const n of d.notes || []) {
          this._renderSfx({ type: 'blip', freq: noteFreq(n), dur: d.dur, duty: d.duty, vol: (d.vol ?? 0.12) * 0.7 },
            t0, pitch, volMul);
        }
        return;
      case 'noise': {
        const src = ctx.createBufferSource();
        src.buffer = this._noise; src.loop = true;
        const f = ctx.createBiquadFilter();
        f.type = d.lp ? 'lowpass' : 'bandpass';
        const dur = d.dur ?? 0.12;
        f.frequency.setValueAtTime(Math.max(40, (d.freq ?? 2000) * pitch), t0);
        f.frequency.exponentialRampToValueAtTime(Math.max(40, (d.freq2 ?? d.freq ?? 2000) * pitch), t0 + dur);
        f.Q.value = d.q ?? 1;
        const g = ctx.createGain();
        const peak = (d.vol ?? 0.16) * volMul;
        g.gain.setValueAtTime(peak, t0);
        g.gain.exponentialRampToValueAtTime(0.0005, t0 + dur);
        src.connect(f); f.connect(g); g.connect(this.sfxBus);
        src.start(t0); src.stop(t0 + dur + 0.02);
        return;
      }
      case 'blip':
      default: {
        const osc = ctx.createOscillator();
        if (d.wave === 'tri') osc.type = 'triangle';
        else if (d.wave === 'saw') osc.type = 'sawtooth';
        else osc.setPeriodicWave(this.wave(d.duty ?? 0.5));
        const dur = d.dur ?? 0.09;
        const f1 = Math.max(20, (d.freq ?? 660) * pitch);
        const f2 = Math.max(20, (d.freq2 ?? d.freq ?? 660) * pitch);
        osc.frequency.setValueAtTime(f1, t0);
        if (f2 !== f1) osc.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
        const g = ctx.createGain();
        const peak = (d.vol ?? 0.14) * volMul;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.linearRampToValueAtTime(peak, t0 + 0.004);
        g.gain.exponentialRampToValueAtTime(0.0005, t0 + dur);
        osc.connect(g); g.connect(this.sfxBus);
        osc.start(t0); osc.stop(t0 + dur + 0.02);
        return;
      }
    }
  }
}

export const audio = new Audio();
