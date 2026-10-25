// THE ICE BLOCKS' STATE SPACE (S209, docs/briefs/PUZZLE-PASS.md step 7, kind A
// with ice), shared by check-iceblocks.mjs and anything that wants to ask how
// an ice block room is solved.
//
// Seasons' pushable ice block (tile $2f in the Sword & Shield Maze; pushblock.s
// state 2, room $586, swordAndShieldMazeScript_pushableIceBlocks): pushed, it
// does not stop after a tile — it slides at SPEED_1c0 until the square ahead
// will not take it, and clinks. Ours adds the sea, square by square, by the
// engine's own rule (objects.js `iceBlockMeets`): a hole takes it down (lost
// until the room is left), WADING water catches it (it stops in the first
// shallow square it reaches), and deep water it floats over and slides on.
// So the same push stops in a different place at each sea, and the conch
// decides each stretch: a sluice (`1`) is slid over at LOW, catches it at MID
// and is floated over at HIGH; a well (`3`) catches it at LOW only; a drain
// (`4`) swallows it at LOW and catches it at MID; the Keep's drowned masonry
// (`7`, `9`) stops it dead until HIGH floats it over.
//
// A state is where every block stands, the sea, and Link's region (its least
// tile index). A move is one push of a block from a tile Link can walk to and
// is not swimming on (the blocks as walls, the engine's `tileWalkable`), or
// one press of the conch, LOW -> MID -> HIGH -> LOW. When the sea changes, a
// block left on a square that opens into a hole goes down it. `solve` is a 0-1
// BFS (a press costs one, a push a thousandth).
import { F } from '../../src/world/tileset.js';
import { iceBlockMeets, iceBlockInRing, ICE_BLOCK_CAPS } from '../../src/game/objects.js';
import { tileWalkable, tileSolid, ROUTE_AVOID } from './collision.mjs';

const DIRS = [[1, 0, 'right'], [-1, 0, 'left'], [0, 1, 'down'], [0, -1, 'up']];

/**
 * `spec`: { blocks: [[x, y]], plates: [{ x, y }], walls?: [[x, y]] }. `opts`:
 *   caps      the player's traversal caps
 *   fixedSea  0..2: the water never moves (a what-if)
 *   dry       water never catches it and it never falls (a what-if: the sea
 *             is no part of the slide)
 *   once      it moves one square per push, like the Keep's old block (a
 *             what-if: the slide is no part of the puzzle)
 *   visit     called with every state the search reaches
 */
export function makeIceModel(room, spec, opts = {}) {
  const W = room.tw, H = room.th, caps = opts.caps || { swim: true };
  const plates = spec.plates;
  const walls = new Set((spec.walls || []).map(([x, y]) => x + ',' + y));
  const sea = (s) => opts.fixedSea != null ? opts.fixedSea : s.sea;
  const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const occ = (b, x, y) => b.some(p => p && p[0] === x && p[1] === y);
  // The terrain answers cached per sea: the engine's own `tileWalkable`,
  // `tileSolid` and `iceBlockMeets`, asked once per tile and level.
  const WALK = [0, 1, 2].map(lv => {
    const a = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      a[y * W + x] = !walls.has(x + ',' + y)
        && (!!(room.flagsAt(x, y, lv) & F.STAIRS) || tileWalkable(room, x, y, lv, caps, ROUTE_AVOID)) ? 1 : 0;
    }
    return a;
  });
  const TAKE = [0, 1, 2].map(lv => {
    const a = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      a[y * W + x] = iceBlockInRing(room, x, y) && !walls.has(x + ',' + y)
        && !tileSolid(room, x, y, lv, ICE_BLOCK_CAPS) ? 1 : 0;
    }
    return a;
  });
  const MEET = [0, 1, 2].map(lv => {
    const a = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) a.push(opts.dry ? 'on' : iceBlockMeets(room.flagsAt(x, y, lv)));
    return a;
  });
  const DEEP = [0, 1, 2].map(lv => {
    const a = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) a[y * W + x] = room.flagsAt(x, y, lv) & F.DEEP ? 1 : 0;
    return a;
  });
  const walk = (b, x, y, lv) => inb(x, y) && WALK[lv][y * W + x] === 1 && !occ(b, x, y);
  const region = (b, from, lv) => {
    const blocked = new Uint8Array(W * H);
    for (const p of b) if (p) blocked[p[1] * W + p[0]] = 1;
    const seen = new Set([from[1] * W + from[0]]), q = [from[1] * W + from[0]];
    const wk = WALK[lv];
    while (q.length) {
      const k = q.pop(), x = k % W, y = (k - x) / W;
      for (const [dx, dy] of DIRS) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const nk = ny * W + nx;
        if (seen.has(nk) || !wk[nk] || blocked[nk]) continue;
        seen.add(nk); q.push(nk);
      }
    }
    return seen;
  };
  // The ring is the room's wall: a block never slides out of a doorway
  // (objects.js `iceBlockInRing`).
  const takes = (b, x, y, lv) => inb(x, y) && TAKE[lv][y * W + x] === 1 && !occ(b, x, y);
  const meets = (x, y, lv) => MEET[lv][y * W + x];
  /** Where block i ends up pushed (dx, dy) at lv: [x, y], null (lost), or false (will not move). */
  const slide = (b, i, dx, dy, lv) => {
    let [x, y] = b[i];
    const rest = b.map((p, j) => j === i ? null : p);
    if (!takes(rest, x + dx, y + dy, lv)) return false;
    for (;;) {
      x += dx; y += dy;
      const m = meets(x, y, lv);
      if (m === 'fall') return null;
      if (m === 'stop' || opts.once) return [x, y];
      if (!takes(rest, x + dx, y + dy, lv)) return [x, y];
    }
  };
  // The sea changes under the blocks: one on a square gone to a hole drops.
  const settle = (b, lv) => b.map(p => p && meets(p[0], p[1], lv) === 'fall' ? null : p);
  const done = (b) => plates.every(p => occ(b, p.x, p.y));
  // The blocks are alike, so a state is the SET of their squares.
  const key = (s, reach) => { let m = Infinity; for (const k of reach) if (k < m) m = k;
    return s.b.map(p => p ? p[1] * W + p[0] : -1).sort((a, c) => a - c).join(',') + '|' + s.sea + '|' + m; };

  function* moves(s, reach) {
    const lv = sea(s);
    for (let i = 0; i < s.b.length; i++) {
      if (!s.b[i]) continue;
      const [cx, cy] = s.b[i];
      for (const [dx, dy, dir] of DIRS) {
        const bx = cx - dx, by = cy - dy;
        if (!reach.has(by * W + bx)) continue;
        if (DEEP[lv][by * W + bx]) continue;      // no footing while swimming
        const to = slide(s.b, i, dx, dy, lv);
        if (to === false) continue;
        yield [{ ...s, b: s.b.map((p, j) => j === i ? to : p) }, 1, { push: dir, block: i, from: [bx, by], to }];
      }
    }
    if (opts.fixedSea == null) {
      const n = (s.sea + 1) % 3;
      yield [{ ...s, sea: n, b: settle(s.b, n) }, 1000, { conch: n }];
    }
  }

  function solve(from, startSea, limit = 400000) {
    const s0 = { b: spec.blocks.map(p => p.slice()), sea: startSea, lx: from[0], ly: from[1] };
    const k0 = key(s0, region(s0.b, from, sea(s0)));
    const dist = new Map([[k0, 0]]), prev = new Map([[k0, null]]), st = new Map([[k0, s0]]);
    const buckets = new Map([[0, [k0]]]); let cost = 0, n = 0;
    while (buckets.size) {
      while (!buckets.has(cost)) cost++;
      const bk = buckets.get(cost); const k = bk.pop(); if (!bk.length) buckets.delete(cost);
      if (dist.get(k) !== cost) continue;
      const s = st.get(k);
      if (opts.visit) opts.visit(s);
      if (done(s.b)) {
        const steps = []; for (let c = k; prev.get(c); c = prev.get(c)[0]) steps.push({ ...prev.get(c)[1], state: st.get(c) });
        return { presses: Math.floor(cost / 1000), moves: cost % 1000, steps: steps.reverse(), states: n };
      }
      if (++n > limit) return { gaveUp: true, states: n };
      const reach = region(s.b, [s.lx, s.ly], sea(s));
      for (const [ns, c, act] of moves(s, reach)) {
        const at = act.from || [s.lx, s.ly];
        // A press: Link stays where he stands, if he still can (the sea may
        // have risen over him — he swims, so he can).
        if (!walk(ns.b, at[0], at[1], sea(ns))) continue;
        ns.lx = at[0]; ns.ly = at[1];
        const kn = key(ns, region(ns.b, at, sea(ns))), nc = cost + c;
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
        const reach = region(t.b, [t.lx, t.ly], sea(t));
        if (reach.has(tk)) return true;
        const k = key(t, reach);
        if (seen.has(k) || d === depth) continue;
        seen.add(k);
        for (const [n, , act] of moves(t, reach)) {
          const at = act.from || [t.lx, t.ly];
          if (walk(n.b, at[0], at[1], sea(n))) next.push({ ...n, lx: at[0], ly: at[1] });
        }
      }
      front = next;
    }
    return false;
  }
  return { solve, region, done, canLeave, slide };
}

export function describeIce(r) {
  return r.steps.map(st => st.conch != null ? `conch ${['LOW', 'MID', 'HIGH'][st.conch]}`
    : `push ${st.push}@${st.from} -> ${st.to ? st.to : 'down'}`).join('; ');
}
