// Deterministic randomness.
//
// Nothing under src/ may call Math.random(); tools/test.mjs greps for it and
// fails the run. Everything that used to comes through here instead, so a run
// is reproducible from a seed and tools/replay.mjs can hold the engine to the
// pixel.
//
// THREE THINGS LIVE HERE, AND THEY ARE NOT INTERCHANGEABLE:
//
//   * `rng` — the global stream. Seeded once from the save (progress.seed).
//     Use it for randomness that is not tied to a room: the shape of a save,
//     a one-off world event. It is the smallest of the three on purpose.
//
//   * `roomStream(saveSeed, mapId, roomKey)` — a stream derived from the save
//     seed and the room's identity. `game.rng` is one of these, rebuilt on
//     every room entry, which is what makes a room replay identically: walk
//     out, walk back in, and the drops and the enemy phases are the same.
//     Every enemy, drop and effect roll uses this one.
//
//   * `noise1` / `noise2` — pure hashes, not streams. They consume nothing.
//     Anything sampled from *draw* code must use these. `Game.draw` runs at
//     display rate, not at the fixed 60 Hz step, so a draw-time call into a
//     stream would advance it a different number of times on a slow machine
//     and desync the whole run. The screen shake is the live example.
//
// The generator is mulberry32: 32 bits of state, one multiply-xor round, and
// it passes gjrand's smallcrush. It is not cryptographic and does not need to
// be — it needs to be identical in every browser, which a float-free integer
// pipeline is and Math.random is not.

/** mulberry32: seed in, a `() => [0,1)` closure out. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * FNV-1a over the string form of every part, with a separator byte between
 * them so hash32('ab', 'c') and hash32('a', 'bc') differ. Numbers are hashed
 * as their unsigned 32-bit form, so a seed round-trips through JSON unchanged.
 */
export function hash32(...parts) {
  let h = 0x811C9DC5;
  for (const p of parts) {
    const s = typeof p === 'number' ? '#' + (p >>> 0) : String(p);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    h ^= 0x1F;                       // separator
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * A named stream. `draws` counts how many numbers have come out of it, which
 * is the cheapest desync detector there is: two runs that agree on the final
 * position but disagree on the draw count are only accidentally identical.
 */
export class Stream {
  constructor(seed = 1, name = '') {
    this.name = name;
    this.reseed(seed);
  }

  reseed(seed) {
    this.seed = seed >>> 0;
    this.draws = 0;
    this._next = mulberry32(this.seed);
    return this;
  }

  /** Uniform in [0, 1). The only method that actually advances the state. */
  float() { this.draws++; return this._next(); }

  /** Uniform in [lo, hi). */
  range(lo, hi) { return lo + this.float() * (hi - lo); }

  /** Uniform integer in [0, n). Returns 0 for n <= 0 rather than NaN. */
  int(n) { return n > 0 ? Math.floor(this.float() * n) : 0; }

  /** Uniform integer in [lo, hi], inclusive both ends. */
  between(lo, hi) { return lo + this.int(hi - lo + 1); }

  /** True with probability p. */
  chance(p) { return this.float() < p; }

  /** A uniformly random element, or undefined for an empty list. */
  pick(list) { return list.length ? list[this.int(list.length)] : undefined; }

  /** Uniform angle in [0, 2pi). */
  angle() { return this.float() * Math.PI * 2; }

  /** -1 or +1. */
  sign() { return this.float() < 0.5 ? -1 : 1; }
}

/**
 * The global stream. Seeded from the save; before a save exists it runs on a
 * fixed constant so the title screen is reproducible too.
 */
export const rng = new Stream(0x9E3779B9, 'global');

/** Reseed the global stream from a save's seed. Called on new game and load. */
export function seedGlobal(saveSeed) {
  return rng.reseed(hash32('save', saveSeed));
}

/**
 * The per-room stream. Derived from the save seed and the room's identity, so
 * the same room in the same save always replays the same way, and two rooms
 * never march in step.
 */
export function roomStream(saveSeed, mapId, roomKey) {
  return new Stream(hash32('room', saveSeed, mapId, roomKey), `${mapId}:${roomKey}`);
}

/**
 * Pure hash of one integer to [-1, 1). Consumes nothing, so it is safe to call
 * from draw code that runs at display rate rather than at the fixed step.
 */
export function noise1(n) {
  let t = Math.imul((n >>> 0) ^ 0x2545F491, 0x2545F491);
  t ^= t >>> 15;
  t = Math.imul(t, 0x85EBCA6B);
  t ^= t >>> 13;
  return ((t >>> 0) / 4294967296) * 2 - 1;
}

/** Pure hash of two integers to [-1, 1). Same rules as noise1. */
export function noise2(a, b) {
  return noise1(Math.imul((a >>> 0) ^ 0x9E3779B9, 0x85EBCA6B) ^ ((b >>> 0) + 0x165667B1));
}
