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
//     order: ['A','A','B','A']
//   }
//
// Token grammar (whitespace separated):
//   'C4' 'C#4' 'Db4'  start a note at that pitch
//   '-'               hold the previous note through this row
//   '.'               silence from this row
//   noise channel:    'x' kick, 's' snare, 'h' closed hat, 'H' open hat, 'c' crash
//
// Rows are looked up per-pattern; a channel may be omitted or shorter than the
// pattern's longest channel, in which case it is silent for the remainder.

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
  let v = 0;
  for (let i = 0; i < len; i++) {
    if ((i & 3) === 0) v = Math.random() * 2 - 1;
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

const DEFAULT_CFG = {
  p1: { duty: 0.5, vol: 0.20, decay: 0.10, glide: 0 },
  p2: { duty: 0.25, vol: 0.13, decay: 0.14, glide: 0 },
  wav: { vol: 0.24, decay: 0.05, glide: 0 },
  noi: { vol: 0.15 },
};

function tokens(s) {
  return s ? s.trim().split(/\s+/) : [];
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
    this._held = { p1: null, p2: null, wav: null };
    this._voices = { p1: null, p2: null, wav: null };
    this._jingle = null;
    this._pendingTrack = undefined;
    this._fade = 1;
  }

  /** Must be called from a user gesture (browser autoplay policy). */
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return this.ok; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
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

  _currentPattern() {
    const t = this.track;
    const order = t.order || Object.keys(t.patterns || {});
    if (!order.length) return null;
    const name = order[this._orderIdx % order.length];
    return t.patterns[name] || null;
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
      const order = t.order || Object.keys(t.patterns || {});
      if (this._orderIdx >= order.length) {
        if (t.loop === false) {
          // jingle or one-shot finished
          const j = this._jingle;
          this.track = null; this.trackName = null;
          this._releaseAll();
          if (j && j.resume) { this._jingle = null; this.play(j.resume, { restart: true }); }
          return;
        }
        this._orderIdx = 0;
      }
      pat = this._currentPattern();
      len = this._patternLength(pat);
      if (!pat || !len) { this.track = null; return; }
    }

    const cfg = t.cfg || {};
    for (const ch of ['p1', 'p2', 'wav']) {
      const toks = tokens(pat[ch]);
      const tok = toks[this._row];
      if (tok === undefined || tok === '.') {
        if (tok !== undefined || this._row === 0) this._noteOff(ch, time);
        continue;
      }
      if (tok === '-') continue;               // hold
      const f = noteFreq(tok);
      if (f > 0) this._noteOn(ch, f, time, rowDur, { ...DEFAULT_CFG[ch], ...(cfg[ch] || {}) });
    }
    const ntoks = tokens(pat.noi);
    const nt = ntoks[this._row];
    if (nt && nt !== '.' && nt !== '-') {
      this._drum(nt, time, { ...DEFAULT_CFG.noi, ...(cfg.noi || {}) });
    }
    this._row++;
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

  _noteOn(ch, freq, time, rowDur, c) {
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
    this._voices[ch] = { osc, gain };
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
  //   { type:'arp',   notes:['C5','E5','G5'], step, dur, duty, vol }
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
