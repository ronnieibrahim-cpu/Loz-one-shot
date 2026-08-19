// Music and sound effects. See core/audio.js for the tracker and SFX formats.

import { audio } from '../core/audio.js';

const SFX = {
  // --- Link ---------------------------------------------------------------
  sword1: { type: 'noise', freq: 3200, freq2: 900, dur: 0.09, q: 1.4, vol: 0.16 },
  sword2: { type: 'noise', freq: 3800, freq2: 800, dur: 0.11, q: 1.6, vol: 0.18 },
  sword3: {
    type: 'multi', parts: [
      { type: 'noise', freq: 4200, freq2: 700, dur: 0.12, q: 1.8, vol: 0.18 },
      { type: 'blip', freq: 1400, freq2: 2600, dur: 0.1, duty: 0.25, vol: 0.08, delay: 0.01 },
    ],
  },
  spin: {
    type: 'multi', parts: [
      { type: 'noise', freq: 3000, freq2: 1400, dur: 0.3, q: 1.2, vol: 0.15 },
      { type: 'arp', notes: ['C5', 'E5', 'G5', 'C6'], step: 0.05, duty: 0.5, vol: 0.1, delay: 0.02 },
    ],
  },
  charged: { type: 'blip', freq: 900, freq2: 1800, dur: 0.14, duty: 0.125, vol: 0.07 },
  linkHurt: { type: 'blip', freq: 420, freq2: 130, dur: 0.24, duty: 0.5, wave: 'saw', vol: 0.15 },
  jump: { type: 'blip', freq: 500, freq2: 950, dur: 0.11, duty: 0.25, vol: 0.11 },
  land: { type: 'noise', freq: 700, freq2: 240, dur: 0.07, q: 0.9, vol: 0.1, lp: true },
  splash: { type: 'noise', freq: 2400, freq2: 400, dur: 0.2, q: 0.8, vol: 0.13 },
  dive: { type: 'blip', freq: 700, freq2: 220, dur: 0.22, duty: 0.5, wave: 'tri', vol: 0.12 },
  lift: { type: 'blip', freq: 380, freq2: 720, dur: 0.1, duty: 0.5, vol: 0.1 },
  throw: { type: 'blip', freq: 800, freq2: 340, dur: 0.09, duty: 0.25, vol: 0.1 },
  shatter: { type: 'noise', freq: 4200, freq2: 1100, dur: 0.14, q: 2.0, vol: 0.14 },
  dig: { type: 'noise', freq: 900, freq2: 300, dur: 0.14, q: 0.7, vol: 0.12, lp: true },
  fall: { type: 'blip', freq: 900, freq2: 90, dur: 0.55, duty: 0.5, wave: 'tri', vol: 0.13 },

  // --- items --------------------------------------------------------------
  conch: {
    type: 'multi', parts: [
      { type: 'blip', freq: 392, freq2: 523, dur: 0.28, duty: 0.5, wave: 'tri', vol: 0.14 },
      { type: 'blip', freq: 523, freq2: 659, dur: 0.3, duty: 0.5, wave: 'tri', vol: 0.12, delay: 0.16 },
      { type: 'noise', freq: 1600, freq2: 500, dur: 0.5, q: 0.6, vol: 0.07, delay: 0.28 },
    ],
  },
  catch: { type: 'blip', freq: 900, freq2: 1300, dur: 0.06, duty: 0.5, vol: 0.09 },
  dredgeCast: { type: 'noise', freq: 2600, freq2: 1800, dur: 0.24, q: 3.0, vol: 0.1 },
  hookHit: { type: 'blip', freq: 1600, freq2: 500, dur: 0.09, duty: 0.25, vol: 0.12 },
  place: { type: 'blip', freq: 300, freq2: 200, dur: 0.07, duty: 0.5, vol: 0.1 },
  explode: {
    type: 'multi', parts: [
      { type: 'noise', freq: 900, freq2: 60, dur: 0.42, q: 0.5, vol: 0.26, lp: true },
      { type: 'blip', freq: 220, freq2: 40, dur: 0.34, duty: 0.5, wave: 'tri', vol: 0.14 },
    ],
  },
  fire: { type: 'noise', freq: 1800, freq2: 700, dur: 0.28, q: 0.8, vol: 0.11 },
  seed: { type: 'blip', freq: 1200, freq2: 1700, dur: 0.07, duty: 0.25, vol: 0.09 },
  shoot: { type: 'blip', freq: 1500, freq2: 900, dur: 0.07, duty: 0.125, vol: 0.1 },
  pegasus: { type: 'arp', notes: ['C5', 'E5', 'G5'], step: 0.04, duty: 0.25, vol: 0.09 },
  valve: { type: 'noise', freq: 700, freq2: 260, dur: 0.4, q: 1.4, vol: 0.12 },

  // --- combat -------------------------------------------------------------
  enemyHit: { type: 'noise', freq: 2000, freq2: 600, dur: 0.08, q: 1.2, vol: 0.13 },
  enemyDie: {
    type: 'multi', parts: [
      { type: 'noise', freq: 2600, freq2: 300, dur: 0.16, q: 1.0, vol: 0.15 },
      { type: 'blip', freq: 700, freq2: 180, dur: 0.14, duty: 0.5, vol: 0.09, delay: 0.02 },
    ],
  },
  bossDie: {
    type: 'multi', parts: [
      { type: 'noise', freq: 1200, freq2: 80, dur: 0.7, q: 0.5, vol: 0.24, lp: true },
      { type: 'blip', freq: 300, freq2: 50, dur: 0.6, duty: 0.5, wave: 'tri', vol: 0.16, delay: 0.05 },
    ],
  },
  enemyShoot: { type: 'blip', freq: 700, freq2: 420, dur: 0.09, duty: 0.125, vol: 0.09 },
  block: { type: 'noise', freq: 3600, freq2: 2600, dur: 0.06, q: 3.0, vol: 0.13 },
  ricochet: { type: 'blip', freq: 2000, freq2: 1200, dur: 0.05, duty: 0.25, vol: 0.1 },
  charge: { type: 'blip', freq: 200, freq2: 480, dur: 0.16, duty: 0.5, wave: 'saw', vol: 0.1 },
  hop: { type: 'blip', freq: 420, freq2: 700, dur: 0.07, duty: 0.5, vol: 0.07 },

  // --- pickups & UI -------------------------------------------------------
  rupee: { type: 'arp', notes: ['E6', 'B6'], step: 0.05, duty: 0.5, vol: 0.09 },
  rupeeBig: { type: 'arp', notes: ['E6', 'G6', 'B6'], step: 0.05, duty: 0.5, vol: 0.1 },
  heart: { type: 'arp', notes: ['G5', 'C6'], step: 0.06, duty: 0.5, vol: 0.1 },
  fairy: { type: 'arp', notes: ['C6', 'E6', 'G6', 'C7'], step: 0.05, duty: 0.25, vol: 0.09 },
  key: { type: 'arp', notes: ['A5', 'D6'], step: 0.07, duty: 0.5, vol: 0.1 },
  unlock: { type: 'arp', notes: ['D5', 'A5', 'D6'], step: 0.07, duty: 0.5, vol: 0.11 },
  chest: { type: 'arp', notes: ['C5', 'F5', 'A5'], step: 0.07, duty: 0.5, vol: 0.1 },
  puzzle: { type: 'arp', notes: ['C5', 'E5', 'G5', 'C6'], step: 0.08, duty: 0.5, vol: 0.11 },
  switchOn: { type: 'blip', freq: 900, freq2: 1300, dur: 0.07, duty: 0.5, vol: 0.1 },
  switchOff: { type: 'blip', freq: 1300, freq2: 900, dur: 0.07, duty: 0.5, vol: 0.09 },
  push: { type: 'noise', freq: 500, freq2: 300, dur: 0.22, q: 0.8, vol: 0.09, lp: true },
  cut: { type: 'noise', freq: 3000, freq2: 1400, dur: 0.08, q: 1.6, vol: 0.12 },
  break: { type: 'noise', freq: 2200, freq2: 500, dur: 0.16, q: 1.0, vol: 0.14 },
  stairs: { type: 'blip', freq: 600, freq2: 900, dur: 0.1, duty: 0.5, vol: 0.09 },
  whirl: { type: 'noise', freq: 400, freq2: 2200, dur: 0.6, q: 1.6, vol: 0.14 },
  text: { type: 'blip', freq: 1500, dur: 0.014, duty: 0.5, vol: 0.05 },
  textNext: { type: 'blip', freq: 1000, freq2: 1400, dur: 0.04, duty: 0.5, vol: 0.07 },
  cursor: { type: 'blip', freq: 1200, dur: 0.03, duty: 0.5, vol: 0.08 },
  confirm: { type: 'arp', notes: ['C6', 'G6'], step: 0.045, duty: 0.5, vol: 0.09 },
  deny: { type: 'blip', freq: 300, freq2: 180, dur: 0.12, duty: 0.5, vol: 0.09 },
  pause: { type: 'blip', freq: 800, freq2: 1200, dur: 0.06, duty: 0.25, vol: 0.08 },
};

// --------------------------------------------------------------------------
// Music
// --------------------------------------------------------------------------

const TRACKS = {
  title: {
    bpm: 96, rowsPerBeat: 4, loop: true,
    cfg: { p1: { duty: 0.5, vol: 0.15, decay: 0.3 }, p2: { duty: 0.25, vol: 0.09, decay: 0.35 }, wav: { vol: 0.2, decay: 0.4 } },
    patterns: {
      A: {
        p1: 'C5 -  -  -  -  -  -  -  G4 -  -  -  -  -  -  -  A4 -  -  -  -  -  -  -  E4 -  -  -  -  -  -  -',
        p2: 'E4 -  -  -  -  -  -  -  C4 -  -  -  -  -  -  -  F4 -  -  -  -  -  -  -  C4 -  -  -  -  -  -  -',
        wav: 'C3 -  -  -  -  -  -  -  E3 -  -  -  -  -  -  -  F3 -  -  -  -  -  -  -  G3 -  -  -  -  -  -  -',
      },
      B: {
        p1: 'F5 -  -  -  E5 -  -  -  D5 -  -  -  C5 -  -  -  D5 -  -  -  E5 -  -  -  G5 -  -  -  -  -  -  -',
        p2: 'A4 -  -  -  G4 -  -  -  F4 -  -  -  E4 -  -  -  F4 -  -  -  G4 -  -  -  B4 -  -  -  -  -  -  -',
        wav: 'F3 -  -  -  -  -  -  -  G3 -  -  -  -  -  -  -  A3 -  -  -  -  -  -  -  G3 -  -  -  -  -  -  -',
      },
      // Bridge: the melody thins to one held tone at a time, climbing back
      // toward the opening, with a single soft tick on the pickup into A.
      C: {
        p1: 'E4 -  -  -  -  -  -  -  F4 -  -  -  -  -  -  -  G4 -  -  -  -  -  -  -  B4 .  C5 .  .  .  .  .',
        p2: '.  .  .  .  .  .  .  .  A3 -  -  -  -  -  -  -  .  .  .  .  .  .  .  .  G3 .  .  .  .  .  .  .',
        wav: 'C3 -  -  -  -  -  -  -  F2 -  -  -  -  -  -  -  G2 -  -  -  -  -  -  -  C3 -  -  -  -  -  -  -',
        noi: '.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  h  .  .  .',
      },
    },
    order: ['A', 'B', 'A', 'C'],
  },

  overworld: {
    bpm: 132, rowsPerBeat: 4, loop: true,
    cfg: {
      p1: { duty: 0.5, vol: 0.17, decay: 0.12 },
      p2: { duty: 0.25, vol: 0.11, decay: 0.16 },
      wav: { vol: 0.22, decay: 0.08 },
      noi: { vol: 0.12 },
    },
    patterns: {
      A: {
        p1: 'G4 .  C5 .  E5 .  C5 .  D5 .  G4 .  B4 .  .  .  A4 .  C5 .  F5 .  C5 .  E5 -  -  .  .  .  .  .',
        p2: 'C4 .  .  .  G3 .  .  .  B3 .  .  .  G3 .  .  .  A3 .  .  .  F3 .  .  .  C4 .  .  .  G3 .  .  .',
        wav: 'C3 -  -  -  C3 -  -  -  G2 -  -  -  G2 -  -  -  F2 -  -  -  F2 -  -  -  C3 -  -  -  G2 -  -  -',
        noi: 'x  .  h  .  s  .  h  .  x  .  h  .  s  .  h  h  x  .  h  .  s  .  h  .  x  .  h  h  s  .  h  .',
      },
      B: {
        p1: 'E5 .  G5 .  A5 -  -  .  G5 .  E5 .  D5 -  -  .  C5 .  E5 .  G5 -  -  .  A5 -  -  -  -  -  -  .',
        p2: 'C4 .  E4 .  F4 .  .  .  E4 .  C4 .  B3 .  .  .  A3 .  C4 .  E4 .  .  .  F4 -  -  -  -  -  -  .',
        wav: 'A2 -  -  -  A2 -  -  -  E3 -  -  -  E3 -  -  -  F2 -  -  -  F2 -  -  -  G2 -  -  -  G2 -  -  -',
        noi: 'x  .  h  .  s  .  h  .  x  .  h  .  s  .  h  h  x  .  h  .  s  .  h  .  x  h  h  .  s  .  h  h',
      },
      C: {
        p1: 'F5 .  E5 .  D5 .  C5 .  B4 .  C5 .  D5 -  -  .  G4 .  B4 .  D5 .  G5 .  E5 -  -  -  -  -  -  .',
        p2: 'A3 .  C4 .  B3 .  A3 .  G3 .  A3 .  B3 .  .  .  D4 .  G3 .  B3 .  D4 .  C4 -  -  -  -  -  -  .',
        wav: 'D3 -  -  -  D3 -  -  -  G2 -  -  -  G2 -  -  -  C3 -  -  -  C3 -  -  -  G2 -  -  -  C3 -  -  -',
        noi: 'x  .  h  .  s  .  h  .  x  .  h  h  s  .  h  .  x  .  h  .  s  .  h  .  x  .  s  .  x  h  h  h',
      },
    },
    order: ['A', 'A', 'B', 'C'],
  },

  village: {
    bpm: 112, rowsPerBeat: 4, loop: true,
    cfg: { p1: { duty: 0.5, vol: 0.15, decay: 0.2 }, p2: { duty: 0.125, vol: 0.09, decay: 0.24 }, wav: { vol: 0.2, decay: 0.1 }, noi: { vol: 0.08 } },
    patterns: {
      A: {
        p1: 'C5 .  E5 .  G5 .  E5 .  F5 .  D5 .  C5 -  -  .  D5 .  F5 .  A5 .  F5 .  G5 -  -  -  -  -  -  .',
        p2: 'C4 .  .  .  E4 .  .  .  F4 .  .  .  E4 .  .  .  D4 .  .  .  F4 .  .  .  E4 .  .  .  G4 .  .  .',
        wav: 'C3 -  -  -  G2 -  -  -  F2 -  -  -  C3 -  -  -  D3 -  -  -  F2 -  -  -  C3 -  -  -  G2 -  -  -',
        noi: '.  .  h  .  .  .  h  .  .  .  h  .  .  .  h  .  .  .  h  .  .  .  h  .  .  .  h  .  .  .  h  h',
      },
      // Turns toward F major for a warmer, more legato phrase.
      B: {
        p1: 'F5  .  A5 .  C6  -  -  .  Bb5 .  A5 .  G5 .  F5 .  E5 .  G5 .  A5 -  -  .  G5 .  F5 .  E5 -  -  .',
        p2: 'A4  .  C5 .  .   .  .  .  D5  .  C5 .  Bb4 .  A4 .  C5 .  E5 .  .  .  .  E5 .  D5 .  C5 -  -  .',
        wav: 'F2  -  -  -  C3  -  -  -  Bb1 -  -  -  F2  -  -  -  C2  -  -  -  G1  -  -  -  C2  -  -  -  G1  -  -  -',
        noi: '.   .  h  .  .   .  h  .  .   .  h  .  .   .  h  h  .   .  h  .  .  .  h  .  .   .  h  .  .   .  h  h',
      },
      // Bridge: the square lead drops out, just a low pulse behind the
      // bass, before the melody eases back in for the last bar.
      C: {
        p1: 'E5  -  -  -  D5  -  -  -  C5  -  -  -  D5  -  -  -  E5 .  G5 .  A5 .  G5 .  F5 .  E5 .  D5 -  -  .',
        p2: '.   .  .  .  .   .  .  .  .   .  .  .  .   .  .  .  .  .  .  .  C5 .  .  .  A4 .  .  .  G4 .  .  .',
        wav: 'C3  -  -  -  -  -  -  -  F2  -  -  -  -  -  -  -  C3 -  -  -  -  -  -  -  G2 -  -  -  -  -  -  .',
        noi: '.   .  .  .  .   .  .  .  .   .  .  .  .   .  .  .  .  .  h  .  .  .  h  .  .  .  h  .  .  .  h  h',
      },
    },
    order: ['A', 'B', 'A', 'C'],
  },

  cave: {
    bpm: 88, rowsPerBeat: 4, loop: true,
    cfg: { p1: { duty: 0.125, vol: 0.1, decay: 0.4 }, p2: { duty: 0.125, vol: 0.05, decay: 0.5 }, wav: { vol: 0.18, decay: 0.5 }, noi: { vol: 0.05 } },
    patterns: {
      A: {
        p1: 'A4 -  -  -  -  -  -  -  C5 -  -  -  -  -  -  -  B4 -  -  -  -  -  -  -  E4 -  -  -  -  -  -  -',
        wav: 'A2 -  -  -  -  -  -  -  F2 -  -  -  -  -  -  -  G2 -  -  -  -  -  -  -  E2 -  -  -  -  -  -  -',
      },
      // A step down from A, one long tone at a time; a single water-drip
      // hat marks the turn of each half.
      B: {
        p1: 'G4 -  -  -  -  -  -  -  Bb4 -  -  -  -  -  -  -  A4 -  -  -  -  -  -  -  D4 -  -  -  -  -  -  -',
        p2: '.  .  .  .  .  .  .  .  E4 -  -  -  -  -  -  -  .  .  .  .  .  .  .  .  A3 -  -  -  -  -  -  -',
        wav: 'G2 -  -  -  -  -  -  -  Eb2 -  -  -  -  -  -  -  F2 -  -  -  -  -  -  -  D2 -  -  -  -  -  -  -',
        noi: '.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  h  .  .  .  .  .  .  .  .  .  .  .  .  .  .  h',
      },
      // Bridge: one tone held the whole pattern, a single drip breaking the
      // hush near the end before it opens back into A.
      C: {
        p1: 'E4 -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -',
        p2: '.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  B4 -  -  -  -  -  -  -  .  .  .  .  .  .  .  .',
        wav: 'E2 -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -',
        noi: '.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  h  .  .  .',
      },
    },
    order: ['A', 'B', 'A', 'C'],
  },

  dungeon: {
    bpm: 124, rowsPerBeat: 4, loop: true,
    cfg: { p1: { duty: 0.25, vol: 0.14, decay: 0.14 }, p2: { duty: 0.125, vol: 0.1, decay: 0.18 }, wav: { vol: 0.22, decay: 0.08 }, noi: { vol: 0.13 } },
    patterns: {
      A: {
        p1: 'D5 .  D5 .  F5 .  D5 .  C5 .  D5 .  A4 -  -  .  D5 .  D5 .  G5 .  F5 .  E5 -  -  .  .  .  .  .',
        p2: 'D4 .  .  .  A3 .  .  .  F3 .  .  .  A3 .  .  .  D4 .  .  .  B3 .  .  .  G3 .  .  .  A3 .  .  .',
        wav: 'D2 -  -  -  D2 -  -  -  A2 -  -  -  A2 -  -  -  F2 -  -  -  F2 -  -  -  G2 -  -  -  A2 -  -  -',
        noi: 'x  .  .  h  s  .  .  h  x  .  .  h  s  .  h  h  x  .  .  h  s  .  .  h  x  h  s  .  s  .  h  h',
      },
      B: {
        p1: 'A5 .  G5 .  F5 .  E5 .  D5 .  E5 .  F5 -  -  .  A4 .  C5 .  E5 .  G5 .  F5 -  -  -  -  -  -  .',
        p2: 'F4 .  E4 .  D4 .  C4 .  B3 .  C4 .  D4 .  .  .  F3 .  A3 .  C4 .  E4 .  D4 -  -  -  -  -  -  .',
        wav: 'F2 -  -  -  F2 -  -  -  D2 -  -  -  D2 -  -  -  A2 -  -  -  A2 -  -  -  D2 -  -  -  D2 -  -  -',
        noi: 'x  .  h  h  s  .  h  .  x  .  h  h  s  .  h  .  x  .  h  h  s  .  h  .  x  s  x  s  h  h  h  h',
      },
      // Bridge: the harmony thins to a drone and the drums pull back to a
      // bare pulse, tightening back into a full kit for the A repeat.
      C: {
        p1: 'A4 -  -  .  Bb4 -  -  .  A4 -  -  .  G4 -  -  .  F4 -  -  .  E4 -  -  .  D4 .  F4 .  A4 .  D5 .',
        p2: '.  .  .  .  D4  .  .  .  .  .  .  .  C4 .  .  .  .  .  .  .  Bb3 .  .  .  A3 .  .  .  .  .  .  .',
        wav: 'D2 -  -  -  -  -  -  -  A1  -  -  -  -  -  -  -  F1 -  -  -  -  -  -  -  D2 -  -  -  -  -  -  -',
        noi: 'x  .  .  .  .  .  h  .  x   .  .  .  .  .  h  .  x  .  .  .  .  .  h  h  x  .  s  .  x  .  s  h',
      },
    },
    order: ['A', 'B', 'A', 'C'],
  },

  boss: {
    bpm: 150, rowsPerBeat: 4, loop: true,
    cfg: { p1: { duty: 0.5, vol: 0.17, decay: 0.1 }, p2: { duty: 0.25, vol: 0.12, decay: 0.12 }, wav: { vol: 0.24, decay: 0.06 }, noi: { vol: 0.16 } },
    patterns: {
      A: {
        p1: 'C5 C5 .  C5 Eb5 .  C5 .  F5 .  Eb5 .  C5 .  .  .  C5 C5 .  C5 G5 .  F5 .  Eb5 -  -  .  .  .  .  .',
        p2: 'C4 .  .  .  G3 .  .  .  Ab3 .  .  .  G3 .  .  .  C4 .  .  .  Bb3 .  .  .  Ab3 .  .  .  G3 .  .  .',
        wav: 'C2 C2 -  C2 C2 -  C2 -  Ab1 -  -  -  G1 -  -  -  C2 C2 -  C2 C2 -  C2 -  F1 -  -  -  G1 -  -  -',
        noi: 'x  .  s  .  x  .  s  s  x  .  s  .  x  h  s  h  x  .  s  .  x  .  s  s  x  s  x  s  c  .  .  .',
      },
      // The fight escalates: the lead climbs instead of circling.
      B: {
        p1: 'Eb5 .  Eb5 .  F5  .  G5  .  Ab5 .  G5  .  F5  .  Eb5 .  F5  .  G5  .  Ab5 .  Bb5 .  C6  -  -  .  Bb5 -  Ab5 -',
        p2: 'G3  .  .  .  Ab3 .  .  .  Bb3 .  .  .  Ab3 .  .  .  C4  .  .  .  Db4 .  .  .  Eb4 .  .  .  C4  .  .  .',
        wav: 'C2  C2 -  C2 C2  -  C2  -  Ab1 -  -  -  Bb1 -  -  -  F1  F1 -  F1 F1  -  F1  -  G1  -  -  -  Ab1 -  -  -',
        noi: 'x   .  s  .  x   .  s   s  x   .  s   .  x   h  s   h  x   .  s   .  x   .  s   s  x   s  x   s  c   .  .  .',
      },
      // Bridge: the drums drop out first, then the pulses, before both come
      // back for the final bar leading into the A repeat.
      C: {
        p1: 'Ab4 -  -  .  Bb4 -  -  .  C5 -  -  .  Eb5 -  -  -  -  -  -  .  Eb5 .  Db5 .  C5 -  Bb4 -  C5 -  Eb5 .',
        p2: '.   .  .  .  .   .  .  .  .  .  .  .  .   .  .  Ab3 .  .  .  .  F3  .  Ab3 .  Bb3 -  C4  -  Db4 -  Eb4 .',
        wav: 'F1  -  -  -  -  -  -  -  Ab1 -  -  -  -  -  -  -  -  -  -  .  F1  -  -  -  G1  -  -  -  Ab1 -  -  -',
        noi: '.   .  .  .  .   .  .  .  .  .  .  .  .   .  .  .  .  .  .  .  x   .  s   .  x   h  s   h  c   .  .  .',
      },
    },
    order: ['A', 'B', 'A', 'C'],
  },

  // A second dungeon theme so 1-8 do not all share one loop. Same tension as
  // `dungeon` but in E minor, with a chromatic climb in C instead of a chorus.
  dungeon2: {
    bpm: 116, rowsPerBeat: 4, loop: true,
    cfg: { p1: { duty: 0.25, vol: 0.14, decay: 0.15 }, p2: { duty: 0.125, vol: 0.1, decay: 0.2 }, wav: { vol: 0.22, decay: 0.08 }, noi: { vol: 0.12 } },
    patterns: {
      A: {
        p1: 'E5 .  E5 .  G5 .  E5 .  D5 .  E5 .  B4 -  -  .  E5 .  G5 .  B5 .  A5 .  G5 -  -  .  .  .  .  .',
        p2: 'B3 .  .  .  E4 .  .  .  G3 .  .  .  B3 .  .  .  E4 .  .  .  G4 .  .  .  D4 .  .  .  B3 .  .  .',
        wav: 'E2 -  -  -  E2 -  -  -  B1 -  -  -  B1 -  -  -  C2 -  -  -  C2 -  -  -  D2 -  -  -  B1 -  -  -',
        noi: 'x  .  .  h  s  .  .  h  x  .  .  h  s  .  h  h  x  .  .  h  s  .  .  h  x  h  s  .  s  .  h  h',
      },
      B: {
        p1: 'C6 -  -  .  B5 .  A5 .  G5 .  F#5 .  E5 -  -  .  A5 .  G5 .  F#5 .  E5 .  D5 -  -  -  -  -  -  .',
        p2: 'A4 .  .  .  G4 .  .  .  E4 .  .  .  C4 .  .  .  F#4 .  .  .  E4 .  .  .  B3 -  -  -  -  -  -  .',
        wav: 'A1 -  -  -  A1 -  -  -  C2 -  -  -  C2 -  -  -  D2 -  -  -  D2 -  -  -  B1 -  -  -  B1 -  -  -',
        noi: 'x  .  h  h  s  .  h  .  x  .  h  h  s  .  h  .  x  .  h  h  s  .  h  .  x  s  x  s  h  h  h  h',
      },
      C: {
        p1: 'E4 .  F4 .  F#4 .  G4 .  G#4 .  A4 .  Bb4 .  B4 .  C5 -  -  .  B4 -  -  .  E5 -  -  -  -  -  -  .',
        p2: 'B3 -  -  -  -  -  -  -  C4 -  -  -  -  -  -  -  E4 -  -  -  D4 -  -  -  B3 -  -  -  -  -  -  .',
        wav: 'E1 -  -  -  E1 -  -  -  E1 -  -  -  E1 -  -  -  C2 -  -  -  D2 -  -  -  E2 -  -  -  E2 -  -  -',
        noi: 'x  .  .  .  s  .  .  .  x  .  .  .  s  .  .  h  x  .  .  h  s  .  .  h  x  s  x  s  c  .  .  .',
      },
    },
    order: ['A', 'A', 'B', 'C'],
  },

  // Nereth. Faster and darker than `boss`: D Phrygian, tritone-heavy, with a
  // full chromatic descent in C for the last phase.
  finalBoss: {
    bpm: 158, rowsPerBeat: 4, loop: true,
    cfg: { p1: { duty: 0.5, vol: 0.17, decay: 0.09 }, p2: { duty: 0.25, vol: 0.12, decay: 0.11 }, wav: { vol: 0.25, decay: 0.05 }, noi: { vol: 0.17 } },
    patterns: {
      A: {
        p1: 'D5 D5 .  D5 Eb5 .  D5 .  A5 .  Ab5 .  G5 .  .  .  D5 D5 .  D5 F5 .  Eb5 .  D5 -  -  .  .  .  .  .',
        p2: 'D4 .  .  .  A3 .  .  .  Bb3 .  .  .  A3 .  .  .  D4 .  .  .  C4 .  .  .  Bb3 .  .  .  A3 .  .  .',
        wav: 'D1 D1 -  D1 D1 -  D1 -  Bb1 -  -  -  A1 -  -  -  D1 D1 -  D1 D1 -  D1 -  G1 -  -  -  A1 -  -  -',
        noi: 'x  .  s  .  x  .  s  s  x  .  s  .  x  h  s  h  x  .  s  .  x  .  s  s  x  s  x  s  c  .  .  .',
      },
      B: {
        p1: 'A5 -  -  .  Bb5 -  -  .  C6 -  -  .  D6 -  -  -  -  -  -  .  C6 .  Bb5 .  A5 -  -  -  -  -  -  .',
        p2: 'F4 -  -  .  G4 -  -  .  A4 -  -  .  Bb4 -  -  -  -  -  -  .  A4 .  G4 .  F4 -  -  -  -  -  -  .',
        wav: 'F1 -  -  -  F1 -  -  -  G1 -  -  -  G1 -  -  -  Bb1 -  -  -  Bb1 -  -  -  A1 -  -  -  A1 -  -  -',
        noi: 'x  h  s  h  x  h  s  h  x  h  s  h  x  h  s  s  x  h  s  h  x  h  s  h  x  s  x  s  c  .  .  .',
      },
      C: {
        p1: 'D6 .  C#6 .  C6 .  B5 .  Bb5 .  A5 .  Ab5 .  G5 .  F#5 .  F5 .  E5 .  Eb5 .  D5 -  -  -  -  -  -  .',
        p2: 'Bb4 .  A4 .  Ab4 .  G4 .  F#4 .  F4 .  E4 .  Eb4 .  D4 .  C#4 .  C4 .  B3 .  Bb3 -  -  -  -  -  -  .',
        wav: 'D1 -  -  -  D1 -  -  -  Bb1 -  -  -  Bb1 -  -  -  G1 -  -  -  G1 -  -  -  A1 -  -  -  A1 -  -  -',
        noi: 'x  .  s  s  x  .  s  s  x  .  s  s  x  .  s  s  x  .  s  s  x  .  s  s  x  s  x  s  c  .  .  .',
      },
    },
    order: ['A', 'A', 'B', 'A', 'C'],
  },

  // --- region themes (referenced by map data; a missing name is silent) -----

  // Coral Reef: bright and aquatic, D major, the counter-melody shimmering
  // above the lead on the short duty.
  reef: {
    bpm: 128, rowsPerBeat: 4, loop: true,
    cfg: { p1: { duty: 0.5, vol: 0.16, decay: 0.13 }, p2: { duty: 0.125, vol: 0.1, decay: 0.18 }, wav: { vol: 0.21, decay: 0.08 }, noi: { vol: 0.1 } },
    patterns: {
      A: {
        p1: 'D5 .  F#5 .  A5 -  -  .  G5 .  F#5 .  E5 -  -  .  D5 .  F#5 .  B5 -  -  .  A5 -  -  -  -  -  -  .',
        p2: 'A4 .  .  .  D5 .  .  .  B4 .  .  .  A4 .  .  .  F#4 .  .  .  D5 .  .  .  E5 .  .  .  A4 .  .  .',
        wav: 'D2 -  -  -  D2 -  -  -  B1 -  -  -  B1 -  -  -  G1 -  -  -  G1 -  -  -  A1 -  -  -  A1 -  -  -',
        noi: '.  .  h  .  s  .  h  .  .  .  h  .  s  .  h  h  .  .  h  .  s  .  h  .  .  .  h  h  s  .  h  .',
      },
      B: {
        p1: 'B5 -  -  .  A5 .  F#5 .  G5 -  -  .  E5 .  D5 .  E5 .  F#5 .  G5 .  A5 .  B5 -  -  -  -  -  -  .',
        p2: 'G4 .  .  .  F#4 .  .  .  E4 .  .  .  C#4 .  .  .  A3 .  .  .  B3 .  .  .  D4 -  -  -  -  -  -  .',
        wav: 'G1 -  -  -  G1 -  -  -  E2 -  -  -  E2 -  -  -  A1 -  -  -  A1 -  -  -  D2 -  -  -  D2 -  -  -',
        noi: '.  .  h  .  s  .  h  h  .  .  h  .  s  .  h  .  .  .  h  .  s  .  h  h  .  .  h  .  s  h  h  h',
      },
      C: {
        p1: 'F#5 .  E5 .  D5 .  C#5 .  D5 -  -  .  E5 -  -  .  A4 .  C#5 .  E5 .  A5 .  F#5 -  -  -  -  -  -  .',
        p2: 'D4 .  .  .  A3 .  .  .  F#4 .  .  .  A4 .  .  .  E4 .  .  .  C#5 .  .  .  D5 -  -  -  -  -  -  .',
        wav: 'D2 -  -  -  D2 -  -  -  A1 -  -  -  A1 -  -  -  E2 -  -  -  E2 -  -  -  D2 -  -  -  D2 -  -  -',
        noi: '.  .  h  .  s  .  h  .  .  .  h  h  s  .  h  .  .  .  h  .  s  .  h  .  .  .  s  .  s  h  h  h',
      },
    },
    order: ['A', 'A', 'B', 'C'],
  },

  // Sunken Marsh: D dorian, murky, the drums soft and off the beat.
  marsh: {
    bpm: 104, rowsPerBeat: 4, loop: true,
    cfg: { p1: { duty: 0.25, vol: 0.13, decay: 0.22 }, p2: { duty: 0.5, vol: 0.08, decay: 0.3 }, wav: { vol: 0.22, decay: 0.14 }, noi: { vol: 0.09 } },
    patterns: {
      A: {
        p1: 'D5 .  F5 .  G5 -  -  .  A5 .  G5 .  F5 -  -  .  E5 .  D5 .  C5 -  -  .  D5 -  -  -  -  -  -  .',
        p2: 'A4 .  .  .  D4 .  .  .  F4 .  .  .  C4 .  .  .  G3 .  .  .  A3 .  .  .  D4 -  -  -  -  -  -  .',
        wav: 'D2 -  -  -  D2 -  -  -  F1 -  -  -  F1 -  -  -  C2 -  -  -  C2 -  -  -  D2 -  -  -  D2 -  -  -',
        noi: 'x  .  .  h  .  .  s  .  x  .  .  h  .  .  s  h  x  .  .  h  .  .  s  .  x  .  s  .  .  .  h  h',
      },
      B: {
        p1: 'A4 .  C5 .  D5 -  -  .  F5 .  E5 .  D5 -  -  .  C5 .  A4 .  G4 -  -  .  A4 -  -  -  -  -  -  .',
        p2: 'E4 .  .  .  A3 .  .  .  C4 .  .  .  A3 .  .  .  G3 .  .  .  E3 .  .  .  A3 -  -  -  -  -  -  .',
        wav: 'A1 -  -  -  A1 -  -  -  C2 -  -  -  C2 -  -  -  G1 -  -  -  G1 -  -  -  A1 -  -  -  A1 -  -  -',
        noi: 'x  .  .  h  .  .  s  h  x  .  .  h  .  .  s  .  x  .  .  h  .  .  s  .  x  .  s  h  .  .  h  h',
      },
      C: {
        p1: 'D5 -  -  -  -  -  .  .  C5 -  -  -  -  -  .  .  Bb4 -  -  -  -  -  .  .  A4 -  -  -  -  -  -  .',
        p2: '.  .  .  .  A4 -  -  .  .  .  .  .  G4 -  -  .  .  .  .  .  F4 -  -  .  .  .  .  .  E4 -  -  .',
        wav: 'D2 -  -  -  -  -  -  -  Bb1 -  -  -  -  -  -  -  G1 -  -  -  -  -  -  -  A1 -  -  -  -  -  -  -',
        noi: 'x  .  .  .  .  .  s  .  x  .  .  .  .  .  s  .  x  .  .  .  .  .  s  .  x  .  .  .  .  .  s  H',
      },
    },
    order: ['A', 'A', 'B', 'C'],
  },

  // Salt Pans: A minor pentatonic, dry and wide, long rests between phrases.
  salt: {
    bpm: 100, rowsPerBeat: 4, loop: true,
    cfg: { p1: { duty: 0.125, vol: 0.13, decay: 0.26 }, p2: { duty: 0.5, vol: 0.08, decay: 0.3 }, wav: { vol: 0.2, decay: 0.12 }, noi: { vol: 0.08 } },
    patterns: {
      A: {
        p1: 'A4 .  C5 .  D5 .  E5 -  -  .  .  .  G5 .  E5 .  D5 -  -  .  .  .  C5 .  A4 -  -  -  -  -  -  .',
        p2: 'E4 .  .  .  .  .  A4 .  .  .  .  .  D5 .  .  .  B4 .  .  .  .  .  G4 .  E4 -  -  -  -  -  -  .',
        wav: 'A1 -  -  -  A1 -  -  -  D2 -  -  -  D2 -  -  -  G1 -  -  -  G1 -  -  -  A1 -  -  -  A1 -  -  -',
        noi: 'x  .  .  .  s  .  .  .  x  .  .  .  s  .  .  h  x  .  .  .  s  .  .  .  x  .  s  .  .  .  h  .',
      },
      B: {
        p1: 'E5 .  G5 .  A5 -  -  .  .  .  G5 .  E5 .  D5 .  C5 .  D5 .  E5 -  -  .  A4 -  -  -  -  -  -  .',
        p2: 'C5 .  .  .  E5 .  .  .  .  .  D5 .  .  .  B4 .  A4 .  .  .  C5 .  .  .  E4 -  -  -  -  -  -  .',
        wav: 'C2 -  -  -  C2 -  -  -  E2 -  -  -  E2 -  -  -  F1 -  -  -  F1 -  -  -  A1 -  -  -  A1 -  -  -',
        noi: 'x  .  .  .  s  .  .  h  x  .  .  .  s  .  .  .  x  .  .  .  s  .  .  h  x  .  s  .  .  .  h  H',
      },
      // Bridge: the same dry, wide-spaced pentatonic figure, just one call
      // and one answer per phrase, before the wide A theme returns.
      C: {
        p1: 'D5 .  .  .  .  .  .  .  C5 .  .  .  .  .  .  .  A4 .  .  .  .  .  .  .  E5 .  .  .  .  .  .  .',
        p2: '.  .  .  .  A4 .  .  .  .  .  .  .  G4 .  .  .  .  .  .  .  E4 .  .  .  .  .  .  .  D4 .  .  .',
        wav: 'A1 -  -  -  -  -  -  -  A1 -  -  -  -  -  -  -  D2 -  -  -  -  -  -  -  A1 -  -  -  -  -  -  -',
        noi: 'x  .  .  .  s  .  .  .  x  .  .  .  s  .  .  h  x  .  .  .  s  .  .  .  x  .  s  .  .  .  h  .',
      },
    },
    order: ['A', 'B', 'A', 'C'],
  },

  // Abyssal approach: C minor, very slow, almost no percussion — the last
  // stretch before the Keep should feel like held breath.
  abyss: {
    bpm: 80, rowsPerBeat: 4, loop: true,
    cfg: { p1: { duty: 0.125, vol: 0.11, decay: 0.45 }, p2: { duty: 0.5, vol: 0.07, decay: 0.5 }, wav: { vol: 0.2, decay: 0.4 }, noi: { vol: 0.07 } },
    patterns: {
      A: {
        p1: 'C5 -  -  -  -  -  -  -  Eb5 -  -  -  -  -  -  -  D5 -  -  -  -  -  -  -  G4 -  -  -  -  -  -  -',
        p2: '.  .  .  .  G4 -  -  -  .  .  .  .  Bb4 -  -  -  .  .  .  .  F4 -  -  -  .  .  .  .  D4 -  -  -',
        wav: 'C2 -  -  -  -  -  -  -  Ab1 -  -  -  -  -  -  -  Bb1 -  -  -  -  -  -  -  G1 -  -  -  -  -  -  -',
        noi: 'x  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  x  .  .  .  .  .  .  .  .  .  .  .  .  .  .  H',
      },
      B: {
        p1: 'Ab4 -  -  -  -  -  -  -  G4 -  -  -  -  -  -  -  F4 -  -  -  -  -  -  -  Eb4 -  -  -  -  -  -  -',
        p2: '.  .  .  .  Eb5 -  -  -  .  .  .  .  D5 -  -  -  .  .  .  .  C5 -  -  -  .  .  .  .  Bb4 -  -  -',
        wav: 'Ab1 -  -  -  -  -  -  -  G1 -  -  -  -  -  -  -  F1 -  -  -  -  -  -  -  Eb1 -  -  -  -  -  -  -',
        noi: 'x  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  x  .  .  .  .  .  .  .  .  .  .  .  c  .  .  .',
      },
      C: {
        p1: 'C5 -  -  -  D5 -  -  -  Eb5 -  -  -  F5 -  -  -  G5 -  -  -  -  -  -  -  -  -  -  -  -  -  -  .',
        p2: 'G4 -  -  -  -  -  -  -  Ab4 -  -  -  -  -  -  -  Bb4 -  -  -  -  -  -  -  C5 -  -  -  -  -  -  .',
        wav: 'C2 -  -  -  C2 -  -  -  Ab1 -  -  -  Ab1 -  -  -  G1 -  -  -  G1 -  -  -  C2 -  -  -  -  -  -  -',
        noi: 'x  .  .  .  .  .  .  .  x  .  .  .  .  .  .  .  x  .  .  .  .  .  .  .  x  .  .  .  c  .  .  .',
      },
    },
    order: ['A', 'A', 'B', 'C'],
  },

  // Village shop: F major, short and bouncy, no kick — just hats and snare.
  shop: {
    bpm: 124, rowsPerBeat: 4, loop: true,
    cfg: { p1: { duty: 0.5, vol: 0.15, decay: 0.16 }, p2: { duty: 0.25, vol: 0.09, decay: 0.2 }, wav: { vol: 0.2, decay: 0.1 }, noi: { vol: 0.08 } },
    patterns: {
      A: {
        p1: 'F5 .  A5 .  C6 .  A5 .  G5 .  Bb5 .  A5 -  -  .  F5 .  A5 .  D6 .  C6 .  Bb5 -  -  .  A5 -  -  .',
        p2: 'C5 .  .  .  F5 .  .  .  Bb4 .  .  .  C5 .  .  .  A4 .  .  .  F5 .  .  .  G4 .  .  .  C5 .  .  .',
        wav: 'F2 -  -  -  F2 -  -  -  Bb1 -  -  -  Bb1 -  -  -  D2 -  -  -  D2 -  -  -  C2 -  -  -  C2 -  -  -',
        noi: '.  .  h  .  s  .  h  .  .  .  h  .  s  .  h  h  .  .  h  .  s  .  h  .  .  .  h  .  s  .  h  h',
      },
      B: {
        p1: 'C6 .  Bb5 .  A5 .  G5 .  F5 .  G5 .  A5 -  -  .  Bb5 .  A5 .  G5 .  F5 .  E5 -  -  -  -  -  -  .',
        p2: 'A4 .  G4 .  F4 .  E4 .  D4 .  E4 .  F4 .  .  .  G4 .  F4 .  E4 .  D4 .  C4 -  -  -  -  -  -  .',
        wav: 'A1 -  -  -  A1 -  -  -  D2 -  -  -  D2 -  -  -  G1 -  -  -  G1 -  -  -  C2 -  -  -  C2 -  -  -',
        noi: '.  .  h  h  s  .  h  .  .  .  h  h  s  .  h  .  .  .  h  h  s  .  h  .  .  .  s  .  s  h  h  h',
      },
      // Bridge: same brushed hats-and-snare kit as A and B, no kick added,
      // a quieter turn before the counter jumps back in.
      C: {
        p1: 'Bb4 .  D5 .  F5 -  -  .  E5 .  D5 .  C5 .  Bb4 .  A4 .  C5 .  F5 -  -  .  E5 .  D5 .  C5 -  -  .',
        p2: 'D4  .  .  .  F4 .  .  .  G4 .  .  .  A4 .  .  .  F4 .  .  .  A4 .  .  .  G4 .  .  .  E4 .  .  .',
        wav: 'Bb1 -  -  -  -  -  -  -  F2 -  -  -  -  -  -  -  D2 -  -  -  -  -  -  -  C2 -  -  -  -  -  -  -',
        noi: '.   .  h  .  s  .  h  .  .  .  h  .  s  .  h  h  .  .  h  .  s  .  h  .  .  .  h  .  s  .  h  h',
      },
    },
    order: ['A', 'B', 'A', 'C'],
  },

  // Ending: C major. A and B are the triumphant half, C and D let it settle.
  ending: {
    bpm: 108, rowsPerBeat: 4, loop: true,
    cfg: { p1: { duty: 0.5, vol: 0.16, decay: 0.22 }, p2: { duty: 0.25, vol: 0.1, decay: 0.26 }, wav: { vol: 0.22, decay: 0.12 }, noi: { vol: 0.1 } },
    patterns: {
      A: {
        p1: 'C5 .  E5 .  G5 .  C6 -  -  .  B5 .  C6 -  -  .  A5 .  F5 .  G5 -  -  .  E5 -  -  -  -  -  -  .',
        p2: 'E4 .  G4 .  C5 .  E5 .  .  .  D5 .  E5 .  .  .  F4 .  A4 .  B4 .  .  .  C5 -  -  -  -  -  -  .',
        wav: 'C2 -  -  -  C2 -  -  -  G1 -  -  -  G1 -  -  -  F1 -  -  -  F1 -  -  -  C2 -  -  -  C2 -  -  -',
        noi: 'x  .  h  .  s  .  h  .  x  .  h  .  s  .  h  h  x  .  h  .  s  .  h  .  x  .  s  .  c  .  .  .',
      },
      B: {
        p1: 'G5 .  A5 .  B5 .  C6 .  D6 -  -  .  C6 -  -  .  B5 .  A5 .  G5 .  F5 .  E5 -  -  -  -  -  -  .',
        p2: 'B4 .  C5 .  D5 .  E5 .  F5 .  .  .  E5 .  .  .  D5 .  C5 .  B4 .  A4 .  G4 -  -  -  -  -  -  .',
        wav: 'G1 -  -  -  G1 -  -  -  D2 -  -  -  D2 -  -  -  G1 -  -  -  G1 -  -  -  C2 -  -  -  C2 -  -  -',
        noi: 'x  .  h  h  s  .  h  .  x  .  h  h  s  .  h  .  x  .  h  h  s  .  h  .  x  s  x  s  c  .  .  .',
      },
      C: {
        p1: 'E5 -  -  -  -  -  .  .  D5 -  -  -  -  -  .  .  C5 -  -  -  -  -  .  .  G4 -  -  -  -  -  -  .',
        p2: 'C5 -  -  -  -  -  .  .  B4 -  -  -  -  -  .  .  G4 -  -  -  -  -  .  .  E4 -  -  -  -  -  -  .',
        wav: 'C2 -  -  -  -  -  -  -  G1 -  -  -  -  -  -  -  A1 -  -  -  -  -  -  -  E1 -  -  -  -  -  -  -',
        noi: '.  .  .  .  s  .  .  .  .  .  .  .  s  .  .  .  .  .  .  .  s  .  .  .  .  .  .  .  s  .  .  H',
      },
      D: {
        p1: 'C5 -  -  -  -  -  -  -  E5 -  -  -  -  -  -  -  G5 -  -  -  -  -  -  -  C6 -  -  -  -  -  -  -',
        p2: 'G4 -  -  -  -  -  -  -  C5 -  -  -  -  -  -  -  E5 -  -  -  -  -  -  -  G5 -  -  -  -  -  -  -',
        wav: 'C2 -  -  -  -  -  -  -  C2 -  -  -  -  -  -  -  G1 -  -  -  -  -  -  -  C2 -  -  -  -  -  -  -',
        noi: '.  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  c  .  .  .  .  .  .  .',
      },
    },
    order: ['A', 'A', 'B', 'A', 'C', 'D'],
  },

  // --- jingles (loop: false, they hand control back to the previous track) --
  fanfare: {
    bpm: 140, rowsPerBeat: 4, loop: false,
    cfg: { p1: { duty: 0.5, vol: 0.18, decay: 0.2 }, wav: { vol: 0.22, decay: 0.2 } },
    patterns: {
      A: {
        p1: 'G5 .  G5 .  G5 .  C6 -  -  -  -  .  .  .  .  .',
        wav: 'C3 .  C3 .  C3 .  E3 -  -  -  -  .  .  .  .  .',
      },
    },
    order: ['A'],
  },
  fanfareShort: {
    bpm: 150, rowsPerBeat: 4, loop: false,
    cfg: { p1: { duty: 0.5, vol: 0.16, decay: 0.2 } },
    patterns: { A: { p1: 'C5 E5 G5 C6 -  -  .  .' } },
    order: ['A'],
  },
  essence: {
    bpm: 100, rowsPerBeat: 4, loop: false,
    cfg: { p1: { duty: 0.5, vol: 0.17, decay: 0.3 }, p2: { duty: 0.25, vol: 0.1, decay: 0.3 }, wav: { vol: 0.2, decay: 0.3 } },
    patterns: {
      A: {
        p1: 'C5 .  E5 .  G5 .  C6 .  B5 .  C6 -  -  -  -  -  -  -  -  .  .  .  .  .',
        p2: 'E4 .  G4 .  C5 .  E5 .  D5 .  E5 -  -  -  -  -  -  -  -  .  .  .  .  .',
        wav: 'C3 -  -  -  C3 -  -  -  G2 -  -  -  C3 -  -  -  -  -  -  .  .  .  .  .',
      },
    },
    order: ['A'],
  },
  bossClear: {
    bpm: 120, rowsPerBeat: 4, loop: false,
    cfg: { p1: { duty: 0.5, vol: 0.18, decay: 0.25 }, wav: { vol: 0.22, decay: 0.25 } },
    patterns: {
      A: {
        p1: 'C5 .  G5 .  E5 .  C6 .  G5 .  C6 -  -  -  -  -  -  .  .  .',
        wav: 'C3 -  -  -  E3 -  -  -  G3 -  -  -  C3 -  -  -  -  .  .  .',
      },
    },
    order: ['A'],
  },
  gameOver: {
    bpm: 84, rowsPerBeat: 4, loop: false,
    cfg: { p1: { duty: 0.5, vol: 0.16, decay: 0.4 }, wav: { vol: 0.2, decay: 0.4 } },
    patterns: {
      A: {
        p1: 'C5 -  -  -  B4 -  -  -  Bb4 -  -  -  A4 -  -  -  -  -  -  -  .  .  .  .',
        wav: 'C3 -  -  -  B2 -  -  -  Bb2 -  -  -  A2 -  -  -  -  -  -  -  .  .  .  .',
      },
    },
    order: ['A'],
  },
  // Held overhead: a rising arpeggio that lands an octave up.
  itemGet: {
    bpm: 132, rowsPerBeat: 4, loop: false,
    cfg: { p1: { duty: 0.5, vol: 0.17, decay: 0.22 }, p2: { duty: 0.25, vol: 0.1, decay: 0.25 }, wav: { vol: 0.21, decay: 0.2 } },
    patterns: {
      A: {
        p1: 'G4 .  C5 .  E5 .  G5 .  C6 -  -  -  -  -  -  -  -  .  .  .',
        p2: 'E4 .  G4 .  C5 .  E5 .  G5 -  -  -  -  -  -  -  -  .  .  .',
        wav: 'C3 -  -  -  C3 -  -  -  C3 -  -  -  -  -  -  -  -  .  .  .',
      },
    },
    order: ['A'],
  },
  // Something opened that should not have: the six-note discovery phrase.
  secret: {
    bpm: 144, rowsPerBeat: 4, loop: false,
    cfg: { p1: { duty: 0.5, vol: 0.16, decay: 0.18 }, wav: { vol: 0.2, decay: 0.18 } },
    patterns: {
      A: {
        p1: 'G5 .  F#5 .  D#5 .  A4 .  G#4 .  E5 .  G#5 .  C6 -  -  -  -  .  .  .',
        wav: 'G2 .  F#2 .  D#2 .  A1 .  G#1 .  E2 .  G#2 .  C3 -  -  -  -  .  .  .',
      },
    },
    order: ['A'],
  },
  // Quarter heart: shorter and sweeter than a full container.
  heartPiece: {
    bpm: 138, rowsPerBeat: 4, loop: false,
    cfg: { p1: { duty: 0.25, vol: 0.16, decay: 0.24 }, p2: { duty: 0.5, vol: 0.09, decay: 0.26 } },
    patterns: {
      A: {
        p1: 'E5 .  G5 .  B5 .  E6 -  -  -  -  -  .  .  .  .',
        p2: 'G4 .  B4 .  E5 .  G5 -  -  -  -  -  .  .  .  .',
      },
    },
    order: ['A'],
  },
};

export function installAudio() {
  audio.addSfx(SFX);
  audio.addTracks(TRACKS);
}

export { SFX, TRACKS };
