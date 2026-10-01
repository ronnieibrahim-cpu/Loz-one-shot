// Oracle of Seasons' own music, played the way its sound engine plays it (S151).
//
// The tracks are the cartridge's channel scripts (src/data/music-seasons.js,
// ripped by tools/rip-music.py). This file is the two halves of what the Game
// Boy did with them:
//
//   1. THE ENGINE (code/audio.s in oracles-disasm), stepped once a frame for
//      each channel: read commands until a note or a rest sets the wait
//      counter; otherwise hold, run the envelopes (handleEnvelopes) and the
//      vibrato (updateSoundFrequencyAndPlay). What it would write to the
//      sound registers is recorded as a list of register events per frame.
//   2. THE HARDWARE, sample by sample: two pulse channels (duty, 64 Hz volume
//      envelope), the wave channel (32 four-bit samples) and the noise channel
//      (LFSR), mixed, and the DC taken out the way the console's output
//      capacitor takes it out.
//
// The whole track is rendered once, offline, into a buffer with its loop
// points, so a Web Audio source can loop it with no scheduling at play time.
// No DOM, no randomness: the same buffer on every machine, in a browser or in
// Node (tools/check-music.mjs renders through it).

import { GB_FREQ, GB_ENV_WAIT, GB_VIBRATO, GB_WAVEFORMS, GB_NOISE, SEASONS_MUSIC } from '../data/music-seasons.js';
import { GB_FRAME_RATE, GB_MIX_LEVEL, GB_HPF_CHARGE } from '../data/feel.js';

const DUTY = [0.125, 0.25, 0.5, 0.75];

// Channels 0-3 are squares (0/1 music, 2/3 sound effects), 4-5 the wave
// channel, 6 the music's noise through noiseFrequencyTable, 7 a sound
// effect's noise written straight to NR43 (code/audio.s standardSoundCmd).
const KIND = { 0: 'sq', 1: 'sq', 2: 'sq', 3: 'sq', 4: 'wave', 5: 'wave', 6: 'noise', 7: 'raw' };

/** The engine's state for one channel. */
function newChannel(k, start) {
  return {
    k, pc: start, on: start != null, wait: 0,
    // playSound starts every channel at volume 8 (code/audio.s).
    vol: 8, env1: 0, env2: 0, envState: 0, envWait: 0,
    duty: 0, vib: 0, vibActive: false, vibCount: 0,
    sweep: 0, shift: 0, freq: 0, rest: true, nr42: 0, lastOff: 0,
    // channelCmdf0 (sound effects, S163): `arb` reads notes as raw frequency
    // registers; `len` is the hardware length timer's NR11 value, 0 for off;
    // `trig7` is wChannel7TriggerOnNextSound.
    arb: false, len: 0, trig7: false,
  };
}

/**
 * Run the engine for `frames` frames and return, per channel, the register
 * writes it made: [frame, kind, ...]. Kinds: 'trig' (vol, envDir, envPace,
 * freqReg, duty/wave/noise), 'freq' (freqReg), 'mute'.
 */
function runEngine(track, frames) {
  const ev = track.events;
  const keys = Object.keys(track.ch).map(Number);
  const chans = keys.map((k) => newChannel(k, track.ch[k]));
  const out = {}, firstVisit = {};
  for (const k of keys) { out[k] = []; firstVisit[k] = new Map(); }

  const trigSquare = (c, f, v, up, pace) =>
    out[c.k].push([f, 'trig', v, up, pace, c.freq, c.duty, c.len ? 64 - c.len : 0]);

  for (let f = 0; f < frames; f++) {
    for (const c of chans) {
      if (!c.on) continue;
      if (c.wait > 0) {
        // continuePlayingSound
        c.wait--;
        if (KIND[c.k] === 'noise' || KIND[c.k] === 'raw') continue;
        // A channel on the length timer is left to the hardware: no
        // envelope, no sweep, no vibrato (continuePlayingSound).
        if (c.len) continue;
        if (KIND[c.k] === 'sq') {
          // handleEnvelopes, states 1 -> 2/3
          if (c.envState === 1) {
            if (c.envWait === 0) {
              c.envState = c.env2 ? 3 : 2;
              trigSquare(c, f, c.vol, false, c.env2);
            } else c.envWait--;
          }
        }
        stepPitch(c, f, out);
        continue;
      }
      // doNextChannelCommand until a note or a rest
      for (let guard = 0; guard < 4096; guard++) {
        const e = ev[c.pc];
        if (!firstVisit[c.k].has(c.pc)) firstVisit[c.k].set(c.pc, f);
        c.pc++;
        const op = e[0];
        if (op === 2) { if (c.k !== 4) c.vol = e[1]; continue; }
        if (op === 10) { c.nr42 = e[1]; c.trig7 = true; continue; }
        if (op === 11) {
          c.arb = true;
          if (KIND[c.k] === 'sq') c.duty = e[1] >> 6;
          c.len = e[1] & 63;
          continue;
        }
        if (op === 13) { c.wait = e[1] - 1; break; }
        if (op === 3) { c.env1 = e[1]; c.env2 = e[2]; continue; }
        if (op === 4) { c.duty = e[1]; continue; }
        if (op === 5) { c.vib = e[1]; continue; }
        if (op === 8) { c.sweep = e[1]; continue; }
        if (op === 9) { c.shift = e[1]; continue; }
        if (op === 10) continue;
        if (op === 6) { c.pc = e[1]; continue; }
        if (op === 7) { c.on = false; out[c.k].push([f, 'mute']); break; }
        if (op === 1) {
          // rest
          c.wait = e[1] - 1;
          if (KIND[c.k] === 'sq') {
            if (c.env2 === 0) {
              c.envState = 2;
              trigSquare(c, f, c.vol, false, 1);     // a quick fade to nothing
            }
          } else if (KIND[c.k] === 'wave') {
            c.rest = true; out[c.k].push([f, 'mute']);
          }
          break;
        }
        // a note ([0, note, frames], or [12, register, frames] in arbitrary mode)
        c.wait = e[2] - 1;
        if (KIND[c.k] === 'noise') {
          const n = GB_NOISE[e[1]];
          if (n) out[c.k].push([f, 'trig', c.vol, !!(n[0] & 8), n[0] & 7, n[1]]);
          break;
        }
        if (KIND[c.k] === 'raw') {
          // standardCmdChannel7: the note IS NR43, and the channel retriggers
          // only on the first note after a cmdf0 — the rest of a sweep moves
          // the noise's pitch under an envelope that keeps running.
          const x = c.nr42 || 0;
          if (c.trig7) out[c.k].push([f, 'trig', x >> 4, !!(x & 8), x & 7, e[1]]);
          else out[c.k].push([f, 'nr43', e[1]]);
          c.trig7 = false;
          break;
        }
        const wave = KIND[c.k] === 'wave';
        let reg;
        if (op === 12) reg = e[1];
        else {
          const idx = wave ? e[1] : e[1] - 12;
          reg = GB_FREQ[Math.max(0, Math.min(GB_FREQ.length - 1, idx))];
        }
        reg = (reg + ((c.shift << 24) >> 24)) & 0xffff;
        c.freq = reg;
        c.vibActive = false;
        c.vibCount = (c.vib >> 4) * 2;
        if (wave) {
          c.rest = false;
          out[c.k].push([f, 'trig', 15, false, 0, c.freq, c.duty]);
        } else if (c.env1) {
          c.envState = 1;
          const row = Math.min(13, c.vol);
          c.envWait = GB_ENV_WAIT[row * 8 + c.env1] || 0;
          trigSquare(c, f, 1, true, c.env1);
        } else {
          c.envState = c.env2 ? 3 : 2;
          trigSquare(c, f, c.vol, false, c.env2);
        }
        break;
      }
    }
  }
  return { out, firstVisit };
}

/** updateSoundFrequencyAndPlay: sweep, then vibrato, onto the held note. */
function stepPitch(c, f, out) {
  if (KIND[c.k] === 'wave' && c.rest) return;
  if (c.sweep & 0x7f) c.freq = (c.freq + ((c.sweep << 24) >> 24)) & 0xffff;
  let off = 0;
  if (!c.vibActive) {
    if (c.vibCount > 0) { c.vibCount--; }
    else { c.vibActive = true; c.vibCount = 0; }
  }
  if (c.vibActive) {
    if (c.vibCount === 8) c.vibCount = 0;
    off = GB_VIBRATO[c.vibCount] * (c.vib & 15);
    c.vibCount++;
  }
  if (off || (c.sweep & 0x7f)) out[c.k].push([f, 'freq', c.freq + off]);
  else if (c.lastOff) out[c.k].push([f, 'freq', c.freq]);
  c.lastOff = off;
}

/**
 * Where the track loops: each channel's first `goto` back to something it
 * already played, as a frame. Returns { intro, length } in frames, or null for
 * a track that ends (a jingle).
 */
function loopOf(track) {
  const probe = 60 * 60 * 6;
  const { firstVisit } = runEngine(track, probe);
  let intro = 0, length = 0;
  for (const k of Object.keys(track.ch).map(Number)) {
    const start = track.ch[k];
    // Walk the channel's own script: the first goto whose target is at or
    // before it is the loop.
    let pc = start, target = null;
    for (let i = 0; i < 100000 && pc < track.events.length; i++) {
      const e = track.events[pc];
      if (e[0] === 7) break;
      if (e[0] === 6) { if (e[1] <= pc) { target = e[1]; break; } pc = e[1]; continue; }
      pc++;
    }
    if (target == null) return null;
    const visits = firstVisit[k];
    const t0 = visits.get(target);
    const t1 = visits.get(pc);
    if (t0 == null || t1 == null) return null;
    // The loop length is from the target's first frame to the frame the goto
    // is read, plus the rest of that frame's note — i.e. to the target's
    // second visit, which is the goto's own frame.
    intro = Math.max(intro, t0);
    length = Math.max(length, t1 - t0);
  }
  return { intro, length };
}

/** The hardware: turn register events into samples, one channel at a time. */
function synth(events, ch, frames, rate, mix) {
  const k = { sq: 0, wave: 4, noise: 6, raw: 6 }[KIND[ch]];
  const spf = rate / GB_FRAME_RATE;
  const n = Math.ceil(frames * spf);
  let ei = 0;
  let vol = 0, up = false, pace = 0, envT = 0, reg = 0, duty = 0, on = false;
  let phase = 0, lfsr = 0x7fff, nr43 = 0, noiseT = 0, lenLeft = Infinity;
  let wave = GB_WAVEFORMS[0x0e] || new Array(16).fill(0);
  const envStep = rate / 64;
  for (let i = 0; i < n; i++) {
    const f = i / spf;
    while (ei < events.length && events[ei][0] <= f) {
      const e = events[ei++];
      if (e[1] === 'mute') { on = false; continue; }
      if (e[1] === 'freq') { reg = e[2]; continue; }
      if (e[1] === 'nr43') { nr43 = e[2]; continue; }
      // trig
      vol = e[2]; up = e[3]; pace = e[4]; envT = 0; on = true;
      if (k === 6) { nr43 = e[5]; lfsr = 0x7fff; noiseT = 0; }
      else {
        reg = e[5];
        if (k === 4) wave = GB_WAVEFORMS[e[6]] || wave;
        else duty = DUTY[e[6] & 3];
      }
      // The length timer, in 256ths of a second (NR11's low six bits).
      lenLeft = e[7] ? e[7] * rate / 256 : Infinity;
    }
    if (!on) continue;
    if (--lenLeft < 0) { on = false; continue; }
    // The 64 Hz volume envelope.
    if (pace) {
      envT++;
      if (envT >= envStep * pace) {
        envT -= envStep * pace;
        if (up && vol < 15) vol++;
        else if (!up && vol > 0) vol--;
      }
    }
    let d;
    if (k === 6) {
      const r = nr43 & 7, s = nr43 >> 4;
      const hz = 524288 / (r === 0 ? 0.5 : r) / Math.pow(2, s + 1);
      noiseT += hz / rate;
      while (noiseT >= 1) {
        noiseT -= 1;
        const bit = (lfsr ^ (lfsr >> 1)) & 1;
        lfsr = (lfsr >> 1) | (bit << 14);
        if (nr43 & 8) lfsr = (lfsr & ~0x40) | (bit << 6);
      }
      d = (lfsr & 1) ? 0 : vol;
    } else if (k === 4) {
      const hz = 65536 / (2048 - (reg & 0x7ff));
      phase = (phase + hz / rate) % 1;
      const s = Math.floor(phase * 32);
      const b = wave[s >> 1];
      d = (s & 1) ? (b & 15) : (b >> 4);
    } else {
      const hz = 131072 / (2048 - (reg & 0x7ff));
      phase = (phase + hz / rate) % 1;
      d = phase < duty ? vol : 0;
    }
    mix[i] += (d / 7.5 - 1) * GB_MIX_LEVEL;
  }
}

const CACHE = new Map();

/**
 * Render a Seasons track at `rate`. Returns { data: Float32Array, loopStart,
 * loopEnd } (seconds; loopEnd null for a jingle that plays once). `only`
 * renders one channel of it alone — how a sound effect is played, because on
 * the cartridge each of its channels is won or lost separately (sfxVoices).
 */
export function renderSeasons(name, rate, only = null) {
  const key = name + '@' + rate + (only == null ? '' : '#' + only);
  if (CACHE.has(key)) return CACHE.get(key);
  const track = SEASONS_MUSIC[name];
  if (!track) return null;
  const loop = loopOf(track);
  const frames = loop ? loop.intro + loop.length : jingleFrames(track);
  const { out } = runEngine(track, frames);
  const n = Math.ceil(frames * rate / GB_FRAME_RATE);
  const mix = new Float32Array(n);
  for (const k of Object.keys(track.ch)) {
    if (only == null || Number(k) === only) synth(out[k], Number(k), frames, rate, mix);
  }
  // The console's output capacitor: a first-order high-pass that removes the
  // DC every channel's 0..15 output carries (GB_HPF_CHARGE per sample).
  let cap = 0;
  const charge = Math.pow(GB_HPF_CHARGE, 4194304 / rate);
  for (let i = 0; i < n; i++) {
    const x = mix[i];
    const y = x - cap;
    cap = x - y * charge;
    mix[i] = y;
  }
  const r = {
    data: mix,
    loopStart: loop ? loop.intro / GB_FRAME_RATE : 0,
    loopEnd: loop ? frames / GB_FRAME_RATE : null,
  };
  CACHE.set(key, r);
  return r;
}

/** A channel's frames to its cmdff (Infinity if it loops for ever). */
function channelFrames(track, k) {
  let pc = track.ch[k], t = 0;
  const seen = new Set();
  for (let i = 0; i < 10000; i++) {
    const e = track.events[pc];
    if (!e || e[0] === 7) return t;
    if (e[0] === 6) { if (seen.has(e[1])) return Infinity; seen.add(e[1]); pc = e[1]; continue; }
    if (e[0] === 0 || e[0] === 12) t += e[2];
    if (e[0] === 1 || e[0] === 13) t += e[1];
    pc++;
  }
  return t;
}

/** A jingle's length: the longest channel's frames to its cmdff. */
function jingleFrames(track) {
  let most = 0;
  for (const k of Object.keys(track.ch)) {
    const t = channelFrames(track, Number(k));
    if (t !== Infinity) most = Math.max(most, t);
  }
  return most + 30;
}

/**
 * A sound effect's channels as playSound sees them: [{ k, prio, secs }], the
 * hardware channel, the priority it holds it with, and how long it holds it
 * (to its cmdff). Null for a name that is not a ripped sound effect.
 */
export function sfxVoices(name) {
  const track = SEASONS_MUSIC[name];
  if (!track || !track.prio) return null;
  return Object.keys(track.ch).map(Number).map((k) => ({
    k, prio: track.prio[k], secs: channelFrames(track, k) / GB_FRAME_RATE,
  }));
}

export { runEngine, loopOf, channelFrames };
