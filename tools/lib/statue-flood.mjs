// THE MIRROR STATUES' STATE SPACE (S208, docs/briefs/PUZZLE-PASS.md kind F),
// shared by check-statues.mjs and anything that wants to ask how a statue room
// is solved.
//
// Seasons' INTERAC_D5_REVERSE_MOVING_ARMOS (Unicorn's Cave): every block push
// moves each statue one tile the OTHER way, if the tile is free. Ours will not
// step into water, shallow or deep, a hole or a hazard (STATUE_AVOID, the
// engine's own mask, objects.js Statue), so the sea decides where it holds.
// A state is where every block and statue stands, the sea, and Link's region
// (its least tile index); a move is one push of a block from a tile Link can
// walk to and is not swimming on (the blocks and statues as walls, the
// engine's `tileWalkable`), or one press of the conch, LOW -> MID -> HIGH ->
// LOW. A block pushed onto a hole is lost until the room is left, so the
// search does not take that move. `solve` is a 0-1 BFS (a press costs one, a
// push a thousandth).
import { F } from '../../src/world/tileset.js';
import { STATUE_AVOID } from '../../src/game/objects.js';
import { tileWalkable, tileSolid, ROUTE_AVOID } from './collision.mjs';

const DIRS = [[1, 0, 'right'], [-1, 0, 'left'], [0, 1, 'down'], [0, -1, 'up']];

export function makeStatueModel(room, spec, opts = {}) {
  const W = room.tw, H = room.th, caps = opts.caps || { swim: true };
  const plates = spec.plates;           // [{ x, y }] a block or a statue on each
  const sea = (s) => opts.fixedSea != null ? opts.fixedSea : s.sea;
  const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const occ = (s, x, y) => s.b.some(p => p[0] === x && p[1] === y) || s.t.some(p => p[0] === x && p[1] === y);
  const walk = (s, x, y, lv) => inb(x, y) && !occ(s, x, y)
    && (!!(room.flagsAt(x, y, lv) & F.STAIRS) || tileWalkable(room, x, y, lv, caps, ROUTE_AVOID));
  const region = (s, from) => {
    const lv = sea(s), seen = new Set([from[1] * W + from[0]]), q = [from];
    while (q.length) {
      const [x, y] = q.pop();
      for (const [dx, dy] of DIRS) {
        const nx = x + dx, ny = y + dy, k = ny * W + nx;
        if (seen.has(k) || !walk(s, nx, ny, lv)) continue;
        seen.add(k); q.push([nx, ny]);
      }
    }
    return seen;
  };
  const blockOk = (s, x, y, lv) => inb(x, y) && !occ(s, x, y) && !tileSolid(room, x, y, lv, { jumping: false, swim: false });
  // `wade`: a what-if where water does not stop a statue (holes still do).
  const AVOID = opts.wade ? (STATUE_AVOID & ~(F.WATER | F.DEEP)) : STATUE_AVOID;
  const statueOk = (s, x, y, lv) => !opts.still && inb(x, y) && !occ(s, x, y)
    && tileWalkable(room, x, y, lv, { swim: !!opts.wade }, AVOID);
  const done = (s) => plates.every(p => occ(s, p.x, p.y));
  const key = (s, reach) => { let m = Infinity; for (const k of reach) if (k < m) m = k;
    return JSON.stringify([s.b, s.t, s.sea, m]); };

  function* moves(s, reach) {
    const lv = sea(s);
    for (let i = 0; i < s.b.length; i++) {
      const [cx, cy] = s.b[i];
      for (const [dx, dy, dir] of DIRS) {
        const bx = cx - dx, by = cy - dy;
        if (!reach.has(by * W + bx)) continue;
        if (room.flagsAt(bx, by, lv) & F.DEEP) continue;
        const nx = cx + dx, ny = cy + dy;
        if (!blockOk(s, nx, ny, lv)) continue;
        if (room.flagsAt(nx, ny, lv) & F.PIT) continue;     // it would go down: lost till the room resets
        const b = s.b.map((p, j) => j === i ? [nx, ny] : p);
        let n = { ...s, b, t: s.t };
        const t = n.t.map(p => p.slice());
        for (let j = 0; j < t.length; j++) {
          const tx = t[j][0] - dx, ty = t[j][1] - dy;
          const tmp = { b, t };
          if ((tx === bx && ty === by) || !statueOk(tmp, tx, ty, lv)) continue;
          t[j] = [tx, ty];
        }
        n = { ...n, t };
        yield [n, 1, { push: dir, block: i, from: [bx, by] }];
      }
    }
    if (opts.fixedSea == null) yield [{ ...s, sea: (s.sea + 1) % 3 }, 1000, { conch: (s.sea + 1) % 3 }];
  }

  function solve(from, startSea, limit = 300000) {
    const s0 = { b: spec.blocks.map(p => p.slice()), t: spec.statues.map(p => p.slice()), sea: startSea, lx: from[0], ly: from[1] };
    const dist = new Map(), prev = new Map(), st = new Map();
    const k0 = key(s0, region(s0, from));
    dist.set(k0, 0); prev.set(k0, null); st.set(k0, s0);
    const buckets = new Map([[0, [k0]]]); let cost = 0, n = 0;
    while (buckets.size) {
      while (!buckets.has(cost)) cost++;
      const bk = buckets.get(cost); const k = bk.pop(); if (!bk.length) buckets.delete(cost);
      if (dist.get(k) !== cost) continue;
      const s = st.get(k);
      if (opts.visit) opts.visit(s);
      if (done(s)) {
        const steps = []; for (let c = k; prev.get(c); c = prev.get(c)[0]) steps.push({ ...prev.get(c)[1], state: st.get(c) });
        return { presses: Math.floor(cost / 1000), moves: cost % 1000, steps: steps.reverse(), states: n };
      }
      if (++n > limit) return { gaveUp: true, states: n };
      const reach = region(s, [s.lx, s.ly]);
      for (const [ns, c, act] of moves(s, reach)) {
        const at = act.from || [s.lx, s.ly];
        ns.lx = at[0]; ns.ly = at[1];
        if (!walk(ns, at[0], at[1], sea(ns))) continue;
        const kn = key(ns, region(ns, at)), nc = cost + c;
        if (dist.has(kn) && dist.get(kn) <= nc) continue;
        dist.set(kn, nc); prev.set(kn, [k, act]); st.set(kn, ns);
        if (!buckets.has(nc)) buckets.set(nc, []); buckets.get(nc).push(kn);
      }
    }
    return null;
  }
  /** Can Link get back to `to` from s — walking, or within `depth` moves? */
  function canLeave(s, to, depth = 3) {
    const tk = to[1] * W + to[0];
    let front = [s]; const seen = new Set();
    for (let d = 0; d <= depth; d++) {
      const next = [];
      for (const t of front) {
        const reach = region(t, [t.lx, t.ly]);
        if (reach.has(tk)) return true;
        const k = key(t, reach);
        if (seen.has(k) || d === depth) continue;
        seen.add(k);
        for (const [n, , act] of moves(t, reach)) {
          const at = act.from || [t.lx, t.ly];
          if (walk(n, at[0], at[1], sea(n))) next.push({ ...n, lx: at[0], ly: at[1] });
        }
      }
      front = next;
    }
    return false;
  }
  return { solve, region, done, canLeave };
}
export function describeStatues(r) {
  return r.steps.map(st => st.conch != null ? `conch ${['LOW', 'MID', 'HIGH'][st.conch]}`
    : `push ${st.push}@${st.from} b=${JSON.stringify(st.state.b)} t=${JSON.stringify(st.state.t)}`).join('; ');
}
