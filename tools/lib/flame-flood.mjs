// TORCHES THAT BURN OUT, AND THE SEA THAT PUTS THEM OUT (S206), the state
// space check-flames.mjs searches.
//
// A torch room is the toggle rooms' flood (tools/lib/toggle-flood.mjs: tile,
// sea, where the Anchor is, a conch press one step round LOW -> MID -> HIGH)
// with one more thing carried: WHICH TORCHES ARE BURNING. A torch is lit by
// the Kilnshell set down on the tile Link faces (back at his feet if that tile
// is masonry — the item's own rule) and burning within a tile of it, never on
// deep water or a hole, never while the torch's own tile is under water; and
// it goes out the moment the water reaches its foot, on a press or when the
// Anchor's patch comes or goes. Time is NOT in the model: a torch that burns
// out is the engine's half (check-flames plays the solution at walking pace).
//
// `solve` is a 0-1 BFS (a press, a throw or a recall costs one; walking and
// lighting are free), so the solution it returns has the fewest presses.
import { F, transformFor } from '../../src/world/tileset.js';
import { makeModel } from './toggle-flood.mjs';

const DIRS = [[1, 0, 'right'], [-1, 0, 'left'], [0, 1, 'down'], [0, -1, 'up']];
// The masonry a set-down shell is turned back by: Kilnshell's own caps
// (src/game/items.js KILNSHELL_WALL_CAPS), asked through the room's solidAt.
const WALL_CAPS = { swim: true, jumping: true, cutting: true };

/**
 * `torches`: [[x, y], ...] in the order the lit mask counts them. `opts` go
 * to makeModel (caps, anchor, fixedSea), and the torches are walls to it.
 */
export function makeFlameModel(room, torches, opts = {}) {
  const solidEnt = new Set(torches.map(([x, y]) => x + ',' + y));
  for (const t of opts.solids || []) solidEnt.add(t[0] + ',' + t[1]);
  const m = makeModel(room, opts);
  const ALL = (1 << torches.length) - 1;
  const walkOk = (x, y, s) => !solidEnt.has(x + ',' + y) && m.ok(x, y, s);
  const levelAt = (x, y, s) => (opts.fixedSea != null ? opts.fixedSea : (m.inPatch(x, y, s.a) ? s.a.level : s.base));
  const flags = (x, y, s) => room.flagsAt(x, y, levelAt(x, y, s));
  const drowned = (i, s) => !!(flags(torches[i][0], torches[i][1], s) & (F.WATER | F.DEEP));
  const douse = (mask, s) => { let out = mask; torches.forEach((_, i) => { if (drowned(i, s)) out &= ~(1 << i); }); return out; };
  const wall = (x, y, s) => room.solidAt(x * 16 + 8, y * 16 + 8, levelAt(x, y, s), WALL_CAPS)
    && !transformFor(room.baseName(x, y), 'fire');

  /** What a shell set down facing `dir` from Link's tile lights: a mask. */
  const lightFrom = (s, dir) => {
    const [dx, dy] = DIRS.find(d => d[2] === dir);
    if (flags(s.x, s.y, s) & F.DEEP) return 0;            // swimming: no strike
    let tx = s.x + dx, ty = s.y + dy;
    if (tx < 0 || ty < 0 || tx >= room.tw || ty >= room.th) return 0;
    if (wall(tx, ty, s)) { tx = s.x; ty = s.y; }
    if (flags(tx, ty, s) & (F.DEEP | F.PIT | F.VOID)) return 0;
    let mask = 0;
    torches.forEach(([x, y], i) => {
      if (Math.abs(x - tx) <= 1 && Math.abs(y - ty) <= 1 && !drowned(i, s)) mask |= 1 << i;
    });
    return mask;
  };

  const key = (s) => m.key(s) + '|' + s.lit;

  function* moves(s) {
    for (const [n, c, act] of m.moves(s)) {
      if (!walkOk(n.x, n.y, n)) continue;
      yield [{ ...n, lit: douse(s.lit, n) }, c, act];
    }
    if (opts.noLight) return;
    for (const [, , dir] of DIRS) {
      const add = lightFrom(s, dir) & ~s.lit;
      if (add) yield [{ ...s, lit: s.lit | add }, 0, { light: [s.x, s.y], dir, lit: add }];
    }
  }

  function search(starts) {
    const dist = new Map(), prev = new Map(), states = new Map();
    let front = [], back = [];
    for (const s0 of starts) {
      const s = { ...s0, lit: s0.lit || 0 };
      if (!walkOk(s.x, s.y, s)) continue;
      const k = key(s); if (dist.has(k)) continue;
      dist.set(k, 0); prev.set(k, null); states.set(k, s); front.push(s);
    }
    while (front.length || back.length) {
      if (!front.length) { front = back; back = []; }
      const s = front.pop();
      const ks = key(s), d = dist.get(ks);
      for (const [n, c, act] of moves(s)) {
        const kn = key(n), nd = d + c;
        if (dist.has(kn) && dist.get(kn) <= nd) continue;
        dist.set(kn, nd); prev.set(kn, [ks, act]); states.set(kn, n);
        if (c === 0) front.push(n); else back.push(n);
      }
    }
    return { dist, prev, states };
  }

  const startsAt = (froms) => {
    const out = [];
    for (const [x, y] of froms) for (const base of [0, 1, 2]) out.push({ x, y, base, p: 0, a: null, lit: 0 });
    return out;
  };

  /** The fewest-press way from `start` to every torch burning at once, or null. */
  function solve(start) {
    const r = search([start]);
    let best = null;
    for (const [k, s] of r.states) {
      if (s.lit !== ALL) continue;
      if (!best || r.dist.get(k) < r.dist.get(best)) best = k;
    }
    if (!best) return null;
    const steps = [];
    for (let k = best; r.prev.get(k); k = r.prev.get(k)[0]) {
      const [, act] = r.prev.get(k);
      if (act) steps.push({ ...act, state: r.states.get(k) });
    }
    steps.reverse();
    return { presses: r.dist.get(best), steps, end: r.states.get(best) };
  }

  return { m, walkOk, lightFrom, drowned, moves, search, solve, startsAt, key, ALL };
}
