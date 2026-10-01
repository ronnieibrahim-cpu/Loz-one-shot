// The game's sound: its music (every track played through the Game Boy's own
// sound engine, src/core/gbsound.js — Seasons' ripped tracks as they are, and
// ours compiled to the same channel scripts by `compileForGb`, S164) and its
// sound effects (the cartridges' own, and a small synthesiser for the few
// that are ours). Our music is written in the pattern format below: two
// pulse channels, the wave channel for bass, the noise channel for drums.
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
//   vibrato: { depth }
//     A pitch wobble on the notes the channel holds. Played as the Oracle
//     leads' own `vibrato $e1` (S164): it starts GB_OURS_VIBRATO_DELAY_FRAMES
//     into a held note and steps on the engine's frame grid; a `depth` over
//     0.3 asks for the deeper $e2.
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
//     `compileForGb` in this file, which writes the echo out as notes.
//
// The noise channel is percussion only and takes none of the above.

import { renderSeasons, renderGbJob, renderSeasonsJob, sfxVoices } from './gbsound.js';
import { GB_RENDER_RATE, GB_FRAME_RATE, GB_OURS_VIBRATO_DELAY_FRAMES, GB_RENDER_BUDGET_MS, GB_PRERENDER_BUDGET_MS, GB_RENDER_SLICE_GAP_MS } from '../data/feel.js';
import { Stream } from './rng.js';
import { VIBRATO_DEPTH_SEMITONES, ARPEGGIO_STEP_FRAMES } from '../data/feel.js';

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

// ---------------------------------------------------------------------------
// OUR MUSIC ON THE CARTRIDGE'S ENGINE (S164). The human: keep our own tunes,
// "with the fidelity of the oracles music". So a track written in the
// pattern format above is compiled, note for note, into the same channel
// script the ripper makes of a Seasons track (tools/rip-music.py's event
// encoding), and src/core/gbsound.js plays it through the Game Boy's own
// sound engine and hardware: real pulse duties, the wave channel's own
// waveforms, the noise channel's own drum table. What the pattern format
// asks for that the cartridge has no word for is translated to what the
// Oracle tracks themselves do:
//   - vol (0..1) -> the engine's `vol` (0..15) at VOL_SCALE; the Oracle
//     leads sit at 6 and their echoes at 3, which our 0.15 / 0.07 land on.
//   - decay -> `env $0 $00`: a held note sustains and a rest cuts it with
//     the engine's own quick fade, as nearly every Oracle melody line does.
//     (Our synth's decay only ever settled a note at 55% of its peak.)
//   - the wave channel's vol picks the waveform: the Oracles' wave channel
//     is loudness by waveform, not by a volume command.
//   - vibrato -> `vibrato $e1`, the Oracle leads' own (a deeper one $e2).
//   - a chord token -> the same notes struck in turn, ARPEGGIO_STEP_FRAMES
//     apart, which is how the cartridge fakes a chord on one channel.
//   - echo -> the source line written out again on the echo channel, rows
//     later, at its own lower volume.
//   - drums -> notes of the noise channel's own table (audio/common/noise.s).
// The loop is a `goto` back to where `order` starts; the intro is before it.
const GB_CH = { p1: 0, p2: 1, wav: 4 };
const VOL_SCALE = 40;
const GB_DUTY = { 0.125: 0, 0.25: 1, 0.5: 2, 0.75: 3 };
// Waveforms (audio/common/waveforms.s) by amplitude: each is a square of the
// stated height, which is all the loudness the Oracles' wave channel has.
const GB_WAVE_BY_LEVEL = [[8, 0x0e], [5, 0x17], [3, 0x0f], [1, 0x0c]];
// Noise table notes: a short low thump, a snare, a tight hat, an open hat, a
// long crash — each with its own decaying envelope in the table.
const GB_DRUM = { x: 0x23, s: 0x32, h: 0x2a, H: 0x27, c: 0x2e };

const cartNote = (freq) => Math.round(69 + 12 * Math.log2(freq / 440)) - 24;

/** Compile a pattern-format track to `{ ch, events }` for gbsound.renderGb. */
export function compileForGb(t) {
  const intro = t.intro || [];
  const order = t.order || Object.keys(t.patterns || {});
  const seq = intro.concat(order);
  const pats = seq.map((n) => t.patterns[n]);
  const lens = pats.map((p) => {
    let n = 0;
    for (const ch of ['p1', 'p2', 'wav', 'noi']) if (p && p[ch]) n = Math.max(n, tokens(p[ch]).length);
    return n;
  });
  const total = lens.reduce((a, b) => a + b, 0);
  const loop = t.loop !== false;
  const loopRow = lens.slice(0, intro.length).reduce((a, b) => a + b, 0);
  const fpr = 60 / (t.bpm || 120) / (t.rowsPerBeat || 4) * GB_FRAME_RATE;
  const fr = (row) => Math.round(row * fpr);
  const cfg = t.cfg || {};
  const cfgOf = (ch) => ({ ...DEFAULT_CFG[ch], ...(cfg[ch] || {}) });

  // Each melodic channel as one row event per row of the whole sequence.
  const rowsOf = {};
  const raw = (ch) => {
    const out = [];
    pats.forEach((p, i) => {
      const toks = p && p[ch] !== undefined ? tokens(p[ch]) : null;
      for (let r = 0; r < lens[i]; r++) {
        out.push(toks ? resolveEvent(parseToken(toks[r]), r) : (cfgOf(ch).echo ? null : (r === 0 ? { kind: 'off' } : { kind: 'hold' })));
      }
    });
    return out;
  };
  for (const ch of ['p1', 'p2', 'wav']) rowsOf[ch] = raw(ch);
  for (const ch of ['p1', 'p2', 'wav']) {
    const echo = cfgOf(ch).echo;
    if (!echo) continue;
    const e = { ...ECHO_DEFAULT, ...echo };
    const src = rowsOf[e.of];
    rowsOf[ch] = rowsOf[ch].map((ev, i) => {
      if (ev) return ev;
      let j = i - e.rows;
      if (j < loopRow && i >= loopRow && loop) j += total - loopRow;
      const s = j >= 0 ? src[j] : null;
      if (!s) return { kind: 'hold' };
      return s.kind === 'on' ? { kind: 'on', freq: s.freq, echoVolMul: e.volMul } : { kind: s.kind };
    });
  }

  const events = [], ch = {};
  const emitLine = (name, rows) => {
    const c = cfgOf(name);
    const k = GB_CH[name];
    const wave = k === 4;
    ch[k] = events.length;
    const baseVol = Math.max(1, Math.min(15, Math.round((c.vol ?? 0.18) * VOL_SCALE)));
    if (wave) {
      const lvl = (c.vol ?? 0.24) * VOL_SCALE;
      let best = GB_WAVE_BY_LEVEL[0];
      for (const w of GB_WAVE_BY_LEVEL) if (Math.abs(w[0] - lvl) < Math.abs(best[0] - lvl)) best = w;
      events.push([4, best[1]]);
    } else {
      events.push([4, GB_DUTY[c.duty ?? 0.5] ?? 2], [3, 0, 0]);
      if (c.vibrato) {
        const x = Math.min(15, Math.round(GB_OURS_VIBRATO_DELAY_FRAMES / 2));
        events.push([5, (x << 4) | ((c.vibrato.depth ?? 0) > 0.3 ? 2 : 1)]);
      }
    }
    let vol = -1;
    const setVol = (v) => { if (!wave && v !== vol) { events.push([2, v]); vol = v; } };
    // The state sounding after the loop's last row, for a hold that opens it.
    let wrap = { kind: 'off' };
    for (const ev of rows.slice(loopRow)) if (ev.kind !== 'hold') wrap = ev;
    let loopAt = null;
    let i = 0;
    while (i < total) {
      if (i === loopRow) loopAt = events.length;
      let ev = rows[i];
      // A hold that opens the loop continues whatever the loop ended on, as
      // the tracker's wrap did; anywhere else (the very start) it is silence.
      if (ev.kind === 'hold') ev = (i === loopRow && loop) ? wrap : { kind: 'off' };
      let j = i + 1;
      while (j < total && rows[j].kind === 'hold' && j !== loopRow) j++;
      const frames = fr(j) - fr(i);
      if (ev.kind === 'on') {
        setVol(ev.echoVolMul ? Math.max(1, Math.round(baseVol * ev.echoVolMul)) : baseVol);
        const notes = (ev.chord || [ev.freq]).map(cartNote);
        if (notes.length > 1) {
          let left = frames, n = 0;
          while (left > 0) {
            const d = Math.min(ARPEGGIO_STEP_FRAMES, left);
            events.push([0, notes[n++ % notes.length], d]);
            left -= d;
          }
        } else events.push([0, notes[0], frames]);
      } else events.push([1, frames]);
      i = j;
    }
    if (loopAt == null) loopAt = events.length;
    events.push(loop ? [6, loopAt] : [7]);
  };
  for (const name of ['p1', 'p2', 'wav']) emitLine(name, rowsOf[name]);

  // The noise channel: each hit rings until the next row that says anything.
  const nc = cfgOf('noi');
  ch[6] = events.length;
  events.push([2, Math.max(1, Math.min(15, Math.round((nc.vol ?? 0.15) * VOL_SCALE)))]);
  const hits = [];
  pats.forEach((p, i) => {
    const toks = tokens(p && p.noi);
    for (let r = 0; r < lens[i]; r++) hits.push(toks[r] && toks[r] !== '-' ? toks[r] : (r === 0 && !toks[r] ? '.' : '-'));
  });
  let loopAt = null, i = 0;
  while (i < total) {
    if (i === loopRow) loopAt = events.length;
    let j = i + 1;
    while (j < total && hits[j] === '-' && j !== loopRow) j++;
    const frames = fr(j) - fr(i);
    const h = hits[i];
    if (h === '.' || h === '-') events.push([1, frames]);
    else events.push([0, GB_DRUM[h] ?? GB_DRUM.h, frames]);
    i = j;
  }
  if (loopAt == null) loopAt = events.length;
  events.push(loop ? [6, loopAt] : [7]);
  return { ch, events };
}

/** The render job for what `gbSource` names. */
const gbJob = (g) => (typeof g === 'string' ? renderSeasonsJob(g, GB_RENDER_RATE) : renderGbJob(g.track, g.key, GB_RENDER_RATE));

const COMPILED = new Map();
/** What `_startGb` plays for track `name`: a Seasons track's name, or one of
 *  ours compiled (once) to a channel script. Null for nothing playable. */
function gbSource(name, t) {
  if (!t) return null;
  if (t.seasons) return t.seasons;
  if (!t.patterns) return null;
  let c = COMPILED.get(t);
  if (!c) { c = compileForGb(t); COMPILED.set(t, c); }
  return { track: c, key: '$ours:' + name };
}

export class Audio {
  constructor() {
    this.ctx = null;
    this.ok = false;
    this.muted = false;
    this.musicVol = 0.75;
    this.sfxVol = 0.9;
    this.tracks = new Map();
    this.sfxDefs = new Map();
    this._waves = new Map();
    this._noise = null;
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
      // Render every track ahead of need, a sliver of a frame at a time
      // (`update`), so the first step into a place finds its song ready.
      if (!ctxOverride) {
        this._prerender = [...this.tracks.entries()].map(([n, t]) => gbSource(n, t)).filter(Boolean).map(gbJob).filter(Boolean);
      }
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
    this._releaseAll();
    // Oracle of Seasons' own track, or one of ours compiled to a channel
    // script (S164): either way the cartridge's engine renders it
    // (gbsound.js) and it loops where that engine loops it.
    const gb = gbSource(name, t);
    if (gb) this._startGb(gb);
  }

  stop() {
    this.trackName = null;
    this._releaseAll();
  }

  /** Play a short jingle, suspending the music until it finishes. */
  jingle(name) {
    if (!this.ok) return;
    const gb = gbSource(name, this.tracks.get(name));
    if (!gb) return;
    const resume = this._jingle ? this._jingle.resume : this.trackName;
    this._releaseAll();
    this._jingle = { resume };
    this.trackName = '$jingle:' + name;
    this._startGb(gb, () => {
      if (this.trackName !== '$jingle:' + name) return;
      this._jingle = null;
      this.trackName = null;
      if (resume) this.play(resume, { restart: true });
    });
  }

  /**
   * Play a track through a buffer source on the music bus: looped at the
   * engine's own loop points, or once (a jingle) with `onEnd` after. A track
   * not yet rendered is rendered over the next few frames (`update`) and
   * starts when it is ready.
   */
  _startGb(gb, onEnd) {
    const job = gbJob(gb);
    if (!job) return;
    if (job.done) this._playBuffer(job.result, onEnd);
    else this._pendingGb = { job, onEnd };
  }

  _playBuffer(r, onEnd) {
    const buf = this.ctx.createBuffer(1, r.data.length, GB_RENDER_RATE);
    buf.getChannelData(0).set(r.data);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    if (r.loopEnd) { src.loop = true; src.loopStart = r.loopStart; src.loopEnd = r.loopEnd; }
    src.connect(this.musicBus);
    if (onEnd) src.onended = () => { if (this._gbSrc === src) { this._gbSrc = null; onEnd(); } };
    src.start(this.ctx.currentTime + 0.02);
    this._gbSrc = src;
  }

  _releaseAll() {
    this._pendingGb = null;
    if (this._gbSrc) {
      const src = this._gbSrc;
      this._gbSrc = null;
      try { src.onended = null; src.stop(); } catch (e) { /* already stopped */ }
    }
  }

  /** Called every frame: renders the track waiting to start, a few
   *  milliseconds' worth, and when none is waiting, the next track ahead of
   *  need, a sliver's worth (GB_RENDER_BUDGET_MS, GB_PRERENDER_BUDGET_MS). */
  update() {
    if (!this.ok) return;
    // At most one slice per drawn frame: a game catching up runs several
    // updates in one, and a slice in each would make it fall further behind.
    const now = typeof performance !== 'undefined' ? performance.now() : 0;
    if (now - (this._lastSlice || -1e9) < GB_RENDER_SLICE_GAP_MS) return;
    this._lastSlice = now;
    const p = this._pendingGb;
    if (p) {
      if (p.job.step(GB_RENDER_BUDGET_MS)) { this._pendingGb = null; this._playBuffer(p.job.result, p.onEnd); }
      return;
    }
    const q = this._prerender;
    if (q && q.length && q[0].step(GB_PRERENDER_BUDGET_MS)) q.shift();
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
    if (d.seasons) {
      // The cartridge's own sound effect, rendered once per channel by its
      // own engine (gbsound.js) and replayed from buffers on the effects bus.
      // playSound's arbitration, channel by channel: a channel still held by
      // a sound of HIGHER priority is not taken (that part of the new sound
      // is simply not heard), and one that is taken cuts its old sound off.
      this._gbSfx = this._gbSfx || new Map();
      this._gbVoice = this._gbVoice || {};
      const voices = sfxVoices(d.seasons);
      if (!voices) return;
      for (const { k, prio, secs } of voices) {
        const held = this._gbVoice[k];
        if (held && held.end > t0 && held.prio > prio) continue;
        if (held && held.end > t0) { try { held.src.stop(t0); } catch (e) { /* already stopped */ } }
        const key = d.seasons + '#' + k;
        let buf = this._gbSfx.get(key);
        if (!buf) {
          const r = renderSeasons(d.seasons, GB_RENDER_RATE, k);
          if (!r) return;
          buf = ctx.createBuffer(1, r.data.length, GB_RENDER_RATE);
          buf.getChannelData(0).set(r.data);
          this._gbSfx.set(key, buf);
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const g = ctx.createGain();
        g.gain.value = (d.vol ?? 1) * volMul;
        src.connect(g); g.connect(this.sfxBus);
        src.start(t0);
        this._gbVoice[k] = { src, prio, end: t0 + secs };
      }
      return;
    }
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
