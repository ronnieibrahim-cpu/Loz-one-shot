// THE RED AND BLUE BLOCKS' STATE SPACE (S205), shared by check-toggles.mjs
// and anything that wants to ask "how is this toggle room solved".
//
// Every tide change flips the blocks (`Tide.setLevel`), so a room with them is
// not a flood over (tile, sea) the way check-anchor's is: it is a flood over
// (tile, sea, which colour stands, where the Anchor is), and a conch press is
// ONE step round the cycle — LOW, MID, HIGH, LOW — that flips the blocks too.
// The cycle matters here as it does nowhere else: LOW to HIGH is two presses,
// two flips, and the blocks come back as they were.
//
// A press is allowed where the ground under Link survives it: the water may not
// close over him and a block may not come up under him (the engine refuses
// that press, `Player.blockRisesUnder`). Walking is the engine's own
// `tileWalkable` (tools/lib/collision.mjs), asked at the tile's own level —
// the Anchor's patch holds its level — with the blocks set by
// `setToggleState`, so no rule here is a private copy of the game's.
//
// The Anchor, when a claim allows it: thrown in a cardinal direction 1..THROW
// tiles, stopped by anything solid, it bites and holds a square patch at the
// level the sea has there; recalled from anywhere where Link's tile survives
// the patch going away. One at a time, as the item is.
//
// A ledge is walked off as the engine hops it: into its face, over every
// ledge tile in a row, onto the first tile past them.
//
// Presses are the cost; walking is free. `solve` is a 0-1 BFS, so the path it
// returns has the fewest presses (an Anchor throw or recall counts as one).
import { F, setToggleState, toggleState, getTileDef } from '../../src/world/tileset.js';
import { tileWalkable, ROUTE_AVOID } from './collision.mjs';
import {
  ANCHOR_RADIUS_TILES, ANCHOR_SHAPE, ANCHOR_THROW_SPEED, THROW_ARC_RISE, THROW_ARC_GRAVITY,
} from '../../src/data/feel.js';

// The throw's reach, derived exactly as tools/check-anchor.mjs derives it.
const Z0 = 12 * 256;
const AIRTIME = (THROW_ARC_RISE + Math.sqrt(THROW_ARC_RISE * THROW_ARC_RISE + 2 * THROW_ARC_GRAVITY * Z0))
  / THROW_ARC_GRAVITY;
export const THROW_TILES = Math.max(1, Math.floor(AIRTIME * (ANCHOR_THROW_SPEED / 256) / 16));

const DIRS = [[1, 0, 'right'], [-1, 0, 'left'], [0, 1, 'down'], [0, -1, 'up']];

/**
 * A model of one room. `opts`:
 *   caps      the player's traversal caps (capsForDungeonIndex)
 *   anchor    may the Anchor be thrown
 *   frozen    0 or 1: the blocks never move from that state (a what-if)
 *   fixedSea  0..2: the water never moves from that level (a what-if)
 *   gone      every red and blue block is floor, whatever the state (a what-if)
 *   open      Set of "x,y" tiles to treat as floor (a door a claim opens)
 */
export function makeModel(room, opts = {}) {
  const W = room.tw, H = room.th, caps = opts.caps;
  const open = opts.open || new Set();
  const cache = new Map();
  // walk(x, y, level, parity) -> bool, memoised.
  const walk = (x, y, lv, p) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return false;
    if (open.has(x + ',' + y)) return true;
    if (opts.fixedSea != null) lv = opts.fixedSea;
    if (opts.frozen != null) p = opts.frozen;
    if (opts.gone) {
      const t = getTileDef(room.baseName(x, y)).toggle;
      if (t) p = (getTileDef(t[0]).flags & F.SOLID) ? 1 : 0;
    }
    const k = ((y * W + x) * 3 + lv) * 2 + p;
    let v = cache.get(k);
    if (v === undefined) {
      const was = toggleState();
      setToggleState(p);
      v = (room.flagsAt(x, y, lv) & F.STAIRS) ? true : tileWalkable(room, x, y, lv, caps, ROUTE_AVOID);
      setToggleState(was);
      cache.set(k, v);
    }
    return v;
  };
  const solidAt = (x, y, lv, p) => {
    const was = toggleState();
    setToggleState(opts.frozen != null ? opts.frozen : p);
    const f = room.flagsAt(x, y, opts.fixedSea != null ? opts.fixedSea : lv);
    setToggleState(was);
    return !!(f & (F.SOLID | F.VOID));
  };
  const ledge = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return null;
    for (const t of [0, 1, 2]) { const d = room.tile(x, y, t); if (d.flags & F.LEDGE) return d.ledge || null; }
    return null;
  };
  const R = ANCHOR_RADIUS_TILES;
  const inPatch = (x, y, a) => {
    if (!a) return false;
    const dx = x - a.x, dy = y - a.y;
    return ANCHOR_SHAPE === 'disc' ? dx * dx + dy * dy <= R * R : Math.abs(dx) <= R && Math.abs(dy) <= R;
  };
  const levelAt = (x, y, base, a) => (inPatch(x, y, a) ? a.level : base);
  const ok = (x, y, s) => walk(x, y, levelAt(x, y, s.base, s.a), s.p);

  // States are plain objects; the key is a string.
  const key = (s) => `${s.x},${s.y},${s.base},${s.p},${s.a ? `${s.a.x},${s.a.y},${s.a.level}` : '-'}`;

  function* moves(s) {
    // Walk, and walk off a ledge.
    for (const [dx, dy, dir] of DIRS) {
      const nx = s.x + dx, ny = s.y + dy;
      if (ok(nx, ny, s)) { yield [{ ...s, x: nx, y: ny }, 0, null]; continue; }
      if (ledge(nx, ny) === dir) {
        let lx = nx, ly = ny;
        while (ledge(lx, ly) === dir) { lx += dx; ly += dy; }
        if (ok(lx, ly, s)) yield [{ ...s, x: lx, y: ly }, 0, null];
      }
    }
    // Sound the conch: one step round, and the blocks flip.
    if (!opts.noConch) {
      const n = { ...s, base: (s.base + 1) % 3, p: s.p ^ 1 };
      if (opts.fixedSea != null) n.base = s.base;
      if (ok(s.x, s.y, n)) yield [n, 1, { conch: [s.x, s.y] }];
    }
    if (!opts.anchor) return;
    if (s.a) {
      const n = { ...s, a: null };
      if (ok(s.x, s.y, n)) yield [n, 1, { recall: [s.x, s.y] }];
    } else {
      for (const [dx, dy, dir] of DIRS) {
        for (let k = 1; k <= THROW_TILES; k++) {
          const tx = s.x + dx * k, ty = s.y + dy * k;
          if (tx < 0 || ty < 0 || tx >= W || ty >= H) break;
          if (solidAt(tx, ty, s.base, s.p)) break;
          const n = { ...s, a: { x: tx, y: ty, level: s.base } };
          if (ok(s.x, s.y, n)) yield [n, 1, { throw: [s.x, s.y], dir, bite: [tx, ty], level: s.base }];
        }
      }
    }
  }

  /** Every state reachable from `starts`, with the fewest-press path to each. */
  function search(starts) {
    const dist = new Map(), prev = new Map();
    const dq = [];
    for (const s of starts) {
      if (!ok(s.x, s.y, s)) continue;
      const k = key(s);
      if (dist.has(k)) continue;
      dist.set(k, 0); prev.set(k, null); dq.push(s);
    }
    // Layer by layer: `front` holds this press count, `back` the next.
    let front = dq.slice(), back = [];
    const states = new Map();
    for (const s of front) states.set(key(s), s);
    while (front.length || back.length) {
      if (!front.length) { front = back; back = []; }
      const s = front.pop();
      const ks = key(s), d = dist.get(ks);
      for (const [n, c, act] of moves(s)) {
        const kn = key(n);
        const nd = d + c;
        if (dist.has(kn) && dist.get(kn) <= nd) continue;
        dist.set(kn, nd); prev.set(kn, [ks, act]); states.set(kn, n);
        if (c === 0) front.push(n); else back.push(n);
      }
    }
    return { dist, prev, states };
  }

  /** The starts: Link on `from` at every sea and either block state, no Anchor out. */
  const startsAt = (from) => {
    const out = [];
    for (const base of [0, 1, 2]) for (const p of [0, 1]) out.push({ x: from[0], y: from[1], base, p, a: null });
    return out;
  };

  /** The fewest-press route from one start to `to`, or null. */
  function route(start, to) {
    const r = search([start]);
    let best = null;
    for (const [k, s] of r.states) {
      if (s.x !== to[0] || s.y !== to[1]) continue;
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

  return { walk, ok, moves, search, route, startsAt, key, W, H, inPatch };
}

/** "LOW, red up" for a state. */
export function stateName(s) {
  return `${['LOW', 'MID', 'HIGH'][s.base]}, ${s.p ? 'blue' : 'red'} up`;
}
