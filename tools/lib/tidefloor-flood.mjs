// THE TIDE FLOOR'S STATE SPACE (S208, docs/briefs/PUZZLE-PASS.md kind C),
// shared by check-tidefloor.mjs. Red and blue tiles; when the conch raises
// the sea, every tile the rise newly covers changes colour — unless a block
// stands on it (the sea cannot get under it) or the Anchor holds the water off
// it. Blocks move any number of times (the engine's PushBlock rules: not onto
// deep water, down a hole). Solved when every tile is blue.
import { F } from '../../src/world/tileset.js';
import { tileWalkable, tileSolid, ROUTE_AVOID } from './collision.mjs';

const DIRS = [[1, 0, 'right'], [-1, 0, 'left'], [0, 1, 'down'], [0, -1, 'up']];
export function makeFloorModel(room, tiles, blocks0, opts = {}) {
  const W = room.tw, H = room.th, caps = opts.caps || { swim: true };
  const covered = opts.covered || ((x, y, lv) => !!(room.flagsAt(x, y, lv) & F.DEEP));
  const ALL = (1 << tiles.length) - 1;
  const sea = (s) => opts.fixedSea != null ? opts.fixedSea : s.sea;
  const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const occ = (b, x, y) => b.some(p => p[0] === x && p[1] === y);
  const walk = (b, x, y, lv) => inb(x, y) && !occ(b, x, y)
    && (!!(room.flagsAt(x, y, lv) & F.STAIRS) || tileWalkable(room, x, y, lv, caps, ROUTE_AVOID));
  const region = (b, from, lv) => {
    const seen = new Set([from[1] * W + from[0]]), q = [from];
    while (q.length) {
      const [x, y] = q.pop();
      for (const [dx, dy] of DIRS) {
        const nx = x + dx, ny = y + dy, k = ny * W + nx;
        if (seen.has(k) || !walk(b, nx, ny, lv)) continue;
        seen.add(k); q.push([nx, ny]);
      }
    }
    return seen;
  };
  const rise = (s, from, to) => {
    let bits = s.bits;
    tiles.forEach((t, i) => {
      if (!opts.noShield && occ(s.b, t.x, t.y)) return;
      if (!covered(t.x, t.y, from) && covered(t.x, t.y, to)) bits ^= 1 << i;
    });
    return bits;
  };
  const key = (s, reach) => { let m = Infinity; for (const k of reach) if (k < m) m = k;
    return `${JSON.stringify(s.b.slice().sort())},${s.bits},${s.sea},${m}`; };
  function solve(from, startSea, limit = 400000) {
    const b0 = tiles.reduce((m, t, i) => t.blue ? m | (1 << i) : m, 0);
    const s0 = { b: blocks0.map(p => p.slice()), bits: b0, sea: startSea, lx: from[0], ly: from[1] };
    const k0 = key(s0, region(s0.b, from, sea(s0)));
    const dist = new Map([[k0, 0]]), prev = new Map([[k0, null]]), st = new Map([[k0, s0]]);
    const buckets = new Map([[0, [k0]]]); let cost = 0, n = 0;
    while (buckets.size) {
      while (!buckets.has(cost)) cost++;
      const bk = buckets.get(cost); const k = bk.pop(); if (!bk.length) buckets.delete(cost);
      if (dist.get(k) !== cost) continue;
      const s = st.get(k);
      if (opts.visit) opts.visit(s);
      if (s.bits === ALL) {
        const steps = []; for (let c = k; prev.get(c); c = prev.get(c)[0]) steps.push({ ...prev.get(c)[1], state: st.get(c) });
        return { presses: Math.floor(cost / 1000), moves: cost % 1000, steps: steps.reverse(), states: n };
      }
      if (++n > limit) return { gaveUp: true, states: n };
      const lv = sea(s), reach = region(s.b, [s.lx, s.ly], lv), out = [];
      for (let i = 0; i < (opts.still ? 0 : s.b.length); i++) {
        const [cx, cy] = s.b[i];
        for (const [dx, dy, dir] of DIRS) {
          const bx = cx - dx, by = cy - dy;
          if (!reach.has(by * W + bx) || (room.flagsAt(bx, by, lv) & F.DEEP)) continue;
          const nx = cx + dx, ny = cy + dy;
          if (!inb(nx, ny) || occ(s.b, nx, ny) || tileSolid(room, nx, ny, lv, { jumping: false, swim: false })) continue;
          if (room.flagsAt(nx, ny, lv) & F.PIT) continue;
          out.push([{ ...s, b: s.b.map((p, j) => j === i ? [nx, ny] : p), lx: bx, ly: by }, 1, { push: dir, from: [bx, by] }]);
        }
      }
      if (opts.fixedSea == null) {
        const to = (lv + 1) % 3;
        out.push([{ ...s, bits: rise(s, lv, to), sea: to }, 1000, { conch: to }]);
      }
      for (const [ns, c, act] of out) {
        if (!walk(ns.b, ns.lx, ns.ly, sea(ns))) continue;
        const kn = key(ns, region(ns.b, [ns.lx, ns.ly], sea(ns))), nc = cost + c;
        if (dist.has(kn) && dist.get(kn) <= nc) continue;
        dist.set(kn, nc); prev.set(kn, [k, act]); st.set(kn, ns);
        if (!buckets.has(nc)) buckets.set(nc, []); buckets.get(nc).push(kn);
      }
    }
    return null;
  }
  /** Can Link walk back to `to` from s, or after a few pushes? */
  function canLeave(s, to, depth = 3) {
    const tk = to[1] * W + to[0];
    let front = [s];
    for (let d = 0; d <= depth; d++) {
      const next = [];
      for (const t of front) {
        const lv = sea(t), reach = region(t.b, [t.lx, t.ly], lv);
        if (reach.has(tk)) return true;
        if (d === depth) continue;
        for (let i = 0; i < t.b.length; i++) {
          const [cx, cy] = t.b[i];
          for (const [dx, dy] of DIRS) {
            const bx = cx - dx, by = cy - dy, nx = cx + dx, ny = cy + dy;
            if (!reach.has(by * W + bx) || !inb(nx, ny) || occ(t.b, nx, ny)) continue;
            if (tileSolid(room, nx, ny, lv, { jumping: false, swim: false })) continue;
            next.push({ ...t, b: t.b.map((p, j) => j === i ? [nx, ny] : p), lx: bx, ly: by });
          }
        }
        next.push({ ...t, sea: (lv + 1) % 3 });
      }
      front = next;
    }
    return false;
  }
  return { solve, canLeave, ALL };
}
