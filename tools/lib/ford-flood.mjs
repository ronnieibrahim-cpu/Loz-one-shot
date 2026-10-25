// THE FORDS' STATE SPACE (S210, docs/briefs/PUZZLE-PASS.md step 6's
// leftovers): a stake grown INSIDE another puzzle, shared by check-fords.mjs
// and anything that wants to ask how such a room is solved.
//
// A Reefseed's pillar is three things (tiles-core.js `coralPillar`): a step at
// LOW, a wall at MID, deep water at HIGH. Until S210 the Shrine only ever used
// the first life — something stands on it at LOW — and every room built on it
// was one stake, one block, one sea. These rooms use what the pillar is to the
// things around it, each by the engine's own rule:
//
//   a push block    crosses it at LOW only (`PushBlock.push`, canOccupy with no
//                   swim) and goes down a hole it is pushed onto, or that the
//                   sea opens under it;
//   a mirror statue crosses it at LOW only and is HELD by it at MID and HIGH
//                   (objects.js `Statue.mirror`, STATUE_AVOID);
//   an ice block    slides over it at LOW, is STOPPED by it at MID and floats
//                   over it at HIGH (objects.js `IceBlock`, `iceBlockMeets`);
//   a thrown seed   is CAUGHT by it at MID — it plants at its foot — and flies
//                   over it at LOW and HIGH (items.js `Reefseed`, which flies
//                   with { jumping, swim } and so stops only at a solid).
//
// A state is where every block, ice block and statue stands, which cells hold
// a pillar, the sea, whether the Tidewright's Anchor is down, and Link's region
// (its least tile index). A move is a push (from a tile Link can walk to and is
// not swimming on), a throw (from such a tile, facing any way: wherever the
// seed comes down, if a pillar may grow there), a press of the conch (LOW ->
// MID -> HIGH -> LOW; from a tile that turns solid under him the engine shoves
// him off, which no plan relies on, so the press is not taken there), or the
// Anchor dropped / recalled. `solve` is a 0-1 BFS: a press costs a thousand,
// anything else one.
//
// The throw is the engine's flight, re-derived from feel.js as
// check-reefseed.mjs does it (items.js reaches for a canvas on the way in),
// from several places inside the tile Link stands on — a seed carries two or
// three tiles depending on where in his tile he stands (S187's lesson) — and
// the model takes every landing. Pillars may grow only on the claim's
// `stakes` cells unless `opts.stray` names more (check-fords asks every other
// cell a seed can reach, one at a time).
import { F, resolveTile } from '../../src/world/tileset.js';
import { STATUE_AVOID, iceBlockMeets, iceBlockInRing, ICE_BLOCK_CAPS } from '../../src/game/objects.js';
import { REEFSEED_PLANT_BLOCK } from '../../src/game/items.js';
import {
  REEFSEED_THROW_SPEED, REEFSEED_SETTLE_FRAMES, THROW_ARC_RISE, THROW_ARC_GRAVITY,
  ANCHOR_RADIUS_TILES,
} from '../../src/data/feel.js';
import { defWalkable, defSolid, ROUTE_AVOID } from './collision.mjs';

const DIRS = [[1, 0, 'right'], [-1, 0, 'left'], [0, 1, 'down'], [0, -1, 'up']];
const TILE = 16, FP = 256;
const toPx = (v) => v >> 8;
let PILLAR = null;   // resolved on first use: the tile table is installed after import
// Where in his tile Link may stand when he throws: his centre anywhere inside
// it, sampled along the throw and across it.
const ALONG = [-7, -4, 0, 4, 7], ACROSS = [-3, 0, 3];

/**
 * `spec`: { blocks?, ice?, statues?: [[x, y]], plates?: [{ x, y }],
 *   stakes: [[x, y]] cells a pillar may grow on, walls?: [[x, y]] other solid
 *   things, noPlant?: [[x, y]] (plates and chests), cut?: { snarl: [x, y] }
 *   (the goal is standing beside it, dry, at some sea), anchor?: { at, level } }
 * `opts`:
 *   caps      the player's traversal caps
 *   fixedSea  0..2: the water never moves (a what-if)
 *   noStakes  no pillar grows anywhere (a what-if)
 *   stray     [[x, y]] more cells a pillar may grow on
 *   noAnchor  the Anchor stays in the bag (a what-if)
 *   pillarSoft  a pillar never stops a seed or an ice block (a what-if:
 *             its MID wall is no part of the puzzle)
 *   statueWades a statue walks onto water as onto floor (a what-if)
 *   noFall    a block on a hole stays (a what-if: the drain is scenery)
 *   visit     called with every state the search reaches
 */
export function makeFordModel(room, spec, opts = {}) {
  const W = room.tw, H = room.th, caps = opts.caps || { swim: true };
  if (!PILLAR) PILLAR = [0, 1, 2].map(lv => resolveTile('coralPillar', lv));
  const plates = spec.plates || [];
  const stakeSet = new Set(opts.noStakes ? [] : [...(spec.stakes || []), ...(opts.stray || [])].map(([x, y]) => y * W + x));
  const walls = new Set((spec.walls || []).map(([x, y]) => y * W + x));
  const noPlant = new Set((spec.noPlant || []).map(([x, y]) => y * W + x));
  const anchor = opts.noAnchor ? null : spec.anchor || null;
  const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const R = anchor ? (anchor.r != null ? anchor.r : ANCHOR_RADIUS_TILES) : 0;
  const levelAt = (s, x, y) => {
    if (s.anc && Math.abs(x - anchor.at[0]) <= R && Math.abs(y - anchor.at[1]) <= R) return anchor.level;
    return opts.fixedSea != null ? opts.fixedSea : s.sea;
  };
  const pill = (s, k) => s.p.includes(k);
  const defAt = (s, x, y) => {
    const lv = levelAt(s, x, y);
    return pill(s, y * W + x) ? PILLAR[lv] : room.tile(x, y, lv);
  };
  const occupied = (s, k, except) => {
    for (const arr of [s.b, s.i, s.t]) for (let j = 0; j < arr.length; j++) {
      if (arr === except.arr && j === except.j) continue;
      const p = arr[j]; if (p && p[1] * W + p[0] === k) return true;
    }
    return false;
  };
  const NONE = { arr: null, j: -1 };
  const linkWalk = (s, x, y) => {
    if (!inb(x, y)) return false;
    const k = y * W + x;
    if (walls.has(k) || occupied(s, k, NONE)) return false;
    const d = defAt(s, x, y);
    return !!(d.flags & F.STAIRS) || defWalkable(d, caps, ROUTE_AVOID);
  };
  const deepAt = (s, x, y) => !!(defAt(s, x, y).flags & F.DEEP);
  const region = (s, from) => {
    const seen = new Set([from[1] * W + from[0]]), q = [from];
    while (q.length) {
      const [x, y] = q.pop();
      for (const [dx, dy] of DIRS) {
        const nx = x + dx, ny = y + dy, k = ny * W + nx;
        if (seen.has(k) || !linkWalk(s, nx, ny)) continue;
        seen.add(k); q.push([nx, ny]);
      }
    }
    return seen;
  };

  // --- what the things that move will do -----------------------------------
  const blockEnters = (s, x, y, self) => inb(x, y) && !walls.has(y * W + x) && !occupied(s, y * W + x, self)
    && !defSolid(defAt(s, x, y), { jumping: false, swim: false, cutting: false });
  const isHole = (s, x, y) => !!(defAt(s, x, y).flags & (F.PIT | F.WHIRL));
  const statueEnters = (s, x, y, self, lx, ly) => inb(x, y) && !walls.has(y * W + x) && !occupied(s, y * W + x, self)
    && !(x === lx && y === ly)
    && !(defAt(s, x, y).flags & (opts.statueWades ? (STATUE_AVOID & ~(F.WATER | F.DEEP)) : STATUE_AVOID))
    && !defSolid(defAt(s, x, y), { jumping: false, swim: false, cutting: false });
  const iceTakes = (s, x, y, self) => {
    if (!inb(x, y) || !iceBlockInRing(room, x, y) || walls.has(y * W + x) || occupied(s, y * W + x, self)) return false;
    if (opts.pillarSoft && pill(s, y * W + x)) return true;
    return !defSolid(defAt(s, x, y), ICE_BLOCK_CAPS);
  };
  const iceMeets = (s, x, y) => iceBlockMeets(defAt(s, x, y).flags);

  /** Statues step the other way, each if it can (objects.js PushBlock.push). */
  const mirror = (s, dx, dy, lx, ly) => {
    if (!s.t.length) return s.t;
    const t = s.t.map(p => p.slice());
    const tmp = { ...s, t };
    for (let j = 0; j < t.length; j++) {
      const nx = t[j][0] - dx, ny = t[j][1] - dy;
      if (statueEnters(tmp, nx, ny, { arr: t, j }, lx, ly)) t[j] = [nx, ny];
    }
    return t;
  };

  // --- the seed --------------------------------------------------------------
  const seedSolid = (s, tx, ty) => {
    if (!inb(tx, ty)) return true;
    if (opts.pillarSoft && pill(s, ty * W + tx)) return false;
    return defSolid(defAt(s, tx, ty), { jumping: true, swim: true, cutting: false });
  };
  /** Where a seed thrown from pixel (px, py) — Link's top-left — facing (dx, dy) comes down. */
  const flight = (s, px, py, dx, dy) => {
    let fx = (px + dx * 6) * FP, fy = (py + dy * 6) * FP, fz = 10 * FP;
    let vx = dx * REEFSEED_THROW_SPEED, vy = dy * REEFSEED_THROW_SPEED, vz = THROW_ARC_RISE;
    let settle = REEFSEED_SETTLE_FRAMES;
    const free = (x, y) => {
      for (const sy of [y + 5, y + 12]) for (const sx of [x + 4, x + 11]) {
        if (seedSolid(s, Math.floor(sx / TILE), Math.floor(sy / TILE))) return false;
      }
      return true;
    };
    for (let i = 0; i < 240; i++) {
      fz += vz; vz -= THROW_ARC_GRAVITY;
      if (vx !== 0) { const n = fx + vx; if (free(toPx(n), toPx(fy))) fx = n; else vx = 0; }
      if (vy !== 0) { const n = fy + vy; if (free(toPx(fx), toPx(n))) fy = n; else vy = 0; }
      if (--settle > 0 && fz > 0) continue;
      return [Math.floor((toPx(fx) + 8) / TILE), Math.floor((toPx(fy) + 8) / TILE)];
    }
    return null;
  };
  const plantableBase = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let ok = room.baseName(x, y) !== 'coralPillar' && !room.warpAt(x, y);
    for (let lv = 0; lv < 3 && ok; lv++) if (room.flagsAt(x, y, lv) & REEFSEED_PLANT_BLOCK) ok = false;
    plantableBase[y * W + x] = ok ? 1 : 0;
  }
  /** Every cell a seed thrown from tile (x, y) facing (dx, dy) can come down on. */
  const landMemo = new Map();
  const landings = (s, x, y, dx, dy) => {
    const mk = `${s.p.join('.')}|${s.anc ? 1 : 0}|${opts.fixedSea != null ? opts.fixedSea : s.sea}|${x},${y},${dx},${dy}`;
    const hit = landMemo.get(mk); if (hit) return hit;
    const out = new Set();
    landMemo.set(mk, out);
    for (const a of ALONG) for (const c of ACROSS) {
      const px = x * TILE + (dx ? a : c), py = y * TILE + (dy ? a : c);
      const l = flight(s, px, py, dx, dy);
      if (l) out.add(l[1] * W + l[0]);
    }
    return out;
  };
  /** Does a seed that comes down on k grow there? (Reefseed.plant / canPlant.) */
  const grows = (s, k) => {
    const x = k % W, y = (k - x) / W;
    if (!inb(x, y) || !plantableBase[k] || pill(s, k) || noPlant.has(k) || walls.has(k)) return false;
    if (occupied(s, k, NONE)) return false;
    if (defAt(s, x, y).flags & F.PIT) return false;      // it goes down the hole
    return true;
  };

  const plateOk = (s) => plates.every(p => occupied(s, p.y * W + p.x, NONE));
  const cutOk = (s, reach) => {
    if (!spec.cut) return false;
    const [cx, cy] = spec.cut.snarl;
    for (const [dx, dy] of DIRS) {
      const x = cx + dx, y = cy + dy, k = y * W + x;
      if (reach.has(k) && !deepAt(s, x, y)) return true;
    }
    return false;
  };
  const done = (s, reach) => (plates.length ? plateOk(s) : true) && (spec.cut ? cutOk(s, reach) : true);

  const key = (s, reach) => { let m = Infinity; for (const k of reach) if (k < m) m = k;
    return JSON.stringify([s.b, s.i, s.t, s.p, s.sea, s.anc, m]); };

  // The sea changes under the things in the room: a block or ice block on a
  // square gone to a hole goes down it.
  const settle = (s) => {
    if (opts.noFall) return s;
    const b = s.b.map(p => p && isHole(s, p[0], p[1]) ? null : p);
    const i = s.i.map(p => p && iceMeets(s, p[0], p[1]) === 'fall' ? null : p);
    return { ...s, b, i };
  };

  function* moves(s, reach) {
    const stand = (x, y) => reach.has(y * W + x) && !deepAt(s, x, y);
    // pushes: blocks
    for (let j = 0; j < s.b.length; j++) {
      const p = s.b[j]; if (!p) continue;
      for (const [dx, dy, dir] of DIRS) {
        const lx = p[0] - dx, ly = p[1] - dy;
        if (!stand(lx, ly)) continue;
        const nx = p[0] + dx, ny = p[1] + dy;
        if (!blockEnters(s, nx, ny, { arr: s.b, j })) continue;
        let b = s.b.map((q, i) => i === j ? [nx, ny] : q);
        if (!opts.noFall && isHole(s, nx, ny)) b = s.b.map((q, i) => i === j ? null : q);
        const t = mirror({ ...s, b }, dx, dy, lx, ly);
        yield [{ ...s, b, t }, 1, { push: dir, kind: 'block', j, from: [lx, ly], to: b[j] }];
      }
    }
    // pushes: ice blocks
    for (let j = 0; j < s.i.length; j++) {
      const p = s.i[j]; if (!p) continue;
      for (const [dx, dy, dir] of DIRS) {
        const lx = p[0] - dx, ly = p[1] - dy;
        if (!stand(lx, ly)) continue;
        const self = { arr: s.i, j };
        if (!iceTakes(s, p[0] + dx, p[1] + dy, self)) continue;
        let [x, y] = p, to;
        for (;;) {
          x += dx; y += dy;
          const m = (opts.pillarSoft && pill(s, y * W + x)) ? (deepAt(s, x, y) ? 'on' : 'on') : iceMeets(s, x, y);
          if (m === 'fall' && !opts.noFall) { to = null; break; }
          if (m === 'stop') { to = [x, y]; break; }
          if (!iceTakes(s, x + dx, y + dy, self)) { to = [x, y]; break; }
        }
        const i = s.i.map((q, n) => n === j ? to : q);
        yield [{ ...s, i }, 1, { push: dir, kind: 'ice', j, from: [lx, ly], to }];
      }
    }
    // throws
    if (stakeSet.size) {
      const seen = new Set();
      for (const k of reach) {
        const x = k % W, y = (k - x) / W;
        if (deepAt(s, x, y)) continue;
        for (const [dx, dy, dir] of DIRS) {
          for (const l of landings(s, x, y, dx, dy)) {
            if (seen.has(l) || !stakeSet.has(l) || !grows(s, l) || l === k) continue;
            seen.add(l);
            const p = [...s.p, l].sort((a, c) => a - c);
            yield [{ ...s, p }, 1, { throw: dir, from: [x, y], at: [l % W, (l - l % W) / W] }];
          }
        }
      }
    }
    // the Anchor
    if (anchor) {
      const lv = opts.fixedSea != null ? opts.fixedSea : s.sea;
      if (!s.anc && lv === anchor.level && (!anchor.from || reach.has(anchor.from[1] * W + anchor.from[0]))) {
        yield [settle({ ...s, anc: true }), 1, { anchor: true, from: anchor.from }];
      }
      if (s.anc) yield [settle({ ...s, anc: false }), 1, { recall: true }];
    }
    // The conch, from anywhere Link can get to: he is where he was when the
    // sea moves — standing, or swimming if it rose over him, or (HIGH -> LOW)
    // set down on whatever he was floating over. One press per region it can
    // leave him in.
    if (opts.fixedSea == null) {
      const n = (s.sea + 1) % 3;
      const ns = settle({ ...s, sea: n });
      const covered = new Set();
      for (const k of reach) {
        if (covered.has(k)) continue;
        const x = k % W, y = (k - x) / W;
        if (!linkWalk(ns, x, y)) continue;
        for (const c of region(ns, [x, y])) covered.add(c);
        yield [{ ...ns }, 1000, { conch: n, from: [x, y] }];
      }
    }
  }

  function start(from, sea) {
    return {
      b: (spec.blocks || []).map(p => p.slice()), i: (spec.ice || []).map(p => p.slice()),
      t: (spec.statues || []).map(p => p.slice()), p: [], sea, anc: false, lx: from[0], ly: from[1],
    };
  }

  /** After a move Link stands at `at` if he still can; a press may leave him swimming. */
  const placeLink = (ns, at) => {
    if (!linkWalk(ns, at[0], at[1])) return false;
    ns.lx = at[0]; ns.ly = at[1];
    return true;
  };

  function solve(from, startSea, limit = 300000) {
    const s0 = start(from, startSea);
    const r0 = region(s0, from);
    const k0 = key(s0, r0);
    const dist = new Map([[k0, 0]]), prev = new Map([[k0, null]]), st = new Map([[k0, s0]]);
    const buckets = new Map([[0, [k0]]]); let cost = 0, n = 0;
    while (buckets.size) {
      while (!buckets.has(cost)) cost++;
      const bk = buckets.get(cost); const k = bk.pop(); if (!bk.length) buckets.delete(cost);
      if (dist.get(k) !== cost) continue;
      const s = st.get(k);
      const reach = region(s, [s.lx, s.ly]);
      if (opts.visit) opts.visit(s, reach);
      if (done(s, reach)) {
        const steps = []; for (let c = k; prev.get(c); c = prev.get(c)[0]) steps.push({ ...prev.get(c)[1], state: st.get(c) });
        return { presses: Math.floor(cost / 1000), moves: cost % 1000, steps: steps.reverse(), states: n, final: s };
      }
      if (++n > limit) return { gaveUp: true, states: n };
      for (const [ns, c, act] of moves(s, reach)) {
        const at = act.from || [s.lx, s.ly];
        if (!placeLink(ns, at)) continue;
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
          if (placeLink(n, at)) next.push(n);
        }
      }
      front = next;
    }
    return false;
  }

  /** Every cell a seed can come down on and grow, from anywhere Link reaches, at any sea, with no pillar yet. */
  function seedCells(from) {
    const out = new Set();
    for (const sea of [0, 1, 2]) {
      const s = start(from, sea);
      for (const k of region(s, from)) {
        const x = k % W, y = (k - x) / W;
        if (deepAt(s, x, y)) continue;
        for (const [dx, dy] of DIRS) for (const l of landings(s, x, y, dx, dy)) if (grows(s, l)) out.add(l);
      }
    }
    return [...out].map(k => [k % W, (k - k % W) / W]);
  }

  return { solve, region, canLeave, seedCells, landings, start, levelAt };
}

export function describeFord(r) {
  return r.steps.map(st => st.conch != null ? `conch ${['LOW', 'MID', 'HIGH'][st.conch]}`
    : st.throw ? `throw ${st.throw}@${st.from} -> ${st.at}`
    : st.anchor ? `anchor@${st.from}` : st.recall ? 'recall'
    : `push ${st.kind} ${st.push}@${st.from} -> ${st.to || 'down'}`).join('; ');
}
