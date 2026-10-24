// THE ROLLING COLOUR CUBE'S STATE SPACE (S207), shared by check-cube.mjs and
// anything that wants to ask "how is this cube room solved".
//
// Oracle of Ages' colour cube (object_code/ages/interactions/coloredCube.s):
// three colours, each on two opposite faces, so an orientation is which colour
// is on top and which faces north-south — six of them, numbered as Ages
// numbers them (Interaction.direction): 0 yellow/red, 1 red/yellow, 2
// red/blue, 3 blue/red, 4 blue/yellow, 5 yellow/blue (top/front). Rolled
// north or south the top and the front change places; rolled east or west the
// top and the side do. Pushed into a hole it falls and the room puts it back
// where it started. Ours adds the sea: A CUBE MOVING ONTO DEEP WATER FLOATS
// THERE AND DOES NOT TIP, so its colour holds; and the Squall Bellows' gust
// shoves it a tile from as far off as the cone reaches, the water under the
// cone a level lower while it blows — so a cube the gust moves over a sluice
// at HIGH is moving over wading water, and tips.
//
// The floor that gives way (kind G, Ages' cracked floor under the cube): a
// tile whose tiledef names a `crack` becomes that tile once the cube comes to
// rest on it, and what the Cistern's cracks become is the sea beneath — a
// hole at LOW and MID, deep water at HIGH. So at LOW the cube goes down with
// the floor; at HIGH it drops into the sea and floats on. A broken tile stays
// broken for the room's life.
//
// A state is (cube tile, orientation, sea, which plates are done, which
// cracks are broken, where Link can be — the canonical tile of his region).
// Walking is the engine's own `tileWalkable` (tools/lib/collision.mjs) with
// the cube a wall; Link pushes and blows only from a tile he is not swimming
// on (ColourCube.push, Player.updateBellows). A cube moved onto deep water
// drifts on the way it was going until the next square is not deep (it
// grounds there, tipping) or will not take it; and Link standing still on a
// crack breaks it, falling (back to the room's way in) or dropping into the
// sea, as the sea there decides. The cone is the engine's own footprint
// (Tide.prototype.covers, stone stopping the wind). A conch press is one step
// round LOW -> MID -> HIGH -> LOW.
//
// `solve` is a 0-1 BFS: a press costs one, a push or a gust costs a thousandth
// (so among the fewest presses it takes the fewest moves).
import { F, getTileDef } from '../../src/world/tileset.js';
import { Tide } from '../../src/game/tide.js';
import { tileWalkable, tileSolid, ROUTE_AVOID } from './collision.mjs';
import { BELLOWS_RANGE } from '../../src/data/feel.js';

export const COLOURS = ['red', 'yellow', 'blue'];
// [top, front] per Ages orientation; the side is the third colour.
export const ORIENT = [[1, 0], [0, 1], [0, 2], [2, 0], [2, 1], [1, 2]];
export const ROLL_NS = [1, 0, 3, 2, 5, 4];
export const ROLL_EW = [3, 4, 5, 0, 1, 2];
export const topOf = (o) => ORIENT[o][0];
export const orientName = (o) => `${COLOURS[ORIENT[o][0]]}/${COLOURS[ORIENT[o][1]]}`;

const DIRS = [[1, 0, 'right'], [-1, 0, 'left'], [0, 1, 'down'], [0, -1, 'up']];
// What the cube is to the room's collision: it floats, and it does not hop.
export const CUBE_CAPS = { jumping: false, swim: true, cutting: false };

/**
 * `cube`: { x, y, o }. `plates`: [{ x, y, colour }] (colour 0..2). `opts`:
 *   caps       the player's traversal caps
 *   bellows    may the gust be used
 *   fixedSea   0..2: the water never moves (a what-if)
 *   noFloat    deep water does not stop the tip (a what-if)
 *   noCrack    cracks never give way (a what-if)
 *   noStand    Link never breaks a crack himself (a what-if)
 *   entry      where a fall puts Link back (default: `from`)
 *   visit      called with every state the search reaches
 *   solids     [[x, y]] tiles to treat as walls (other entities)
 */
export function makeCubeModel(room, cube, plates, opts = {}) {
  const W = room.tw, H = room.th, caps = opts.caps;
  const solidEnt = new Set((opts.solids || []).map(([x, y]) => x + ',' + y));
  const cracks = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = getTileDef(room.baseName(x, y));
    if (d && d.crack) cracks.push({ x, y, base: room.baseName(x, y), broke: d.crack });
  }
  const crackIx = new Map(cracks.map((c, i) => [c.x + ',' + c.y, i]));
  // A tile's flags at a level with a given set of cracks broken. Only the
  // cracks differ, so the broken name is resolved on its own.
  const fl = (x, y, lv, broken) => {
    const i = crackIx.get(x + ',' + y);
    if (i !== undefined && (broken & (1 << i))) {
      room.setTile(x, y, cracks[i].broke);
      const f = room.flagsAt(x, y, lv);
      room.setTile(x, y, cracks[i].base);
      return f;
    }
    return room.flagsAt(x, y, lv);
  };
  const solidWith = (x, y, lv, broken, c) => {
    const i = crackIx.get(x + ',' + y);
    const b = i !== undefined && (broken & (1 << i));
    if (b) room.setTile(x, y, cracks[i].broke);
    const v = tileSolid(room, x, y, lv, c);
    if (b) room.setTile(x, y, cracks[i].base);
    return v;
  };
  const ledge = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return null;
    const d = room.tile(x, y, 0);
    return (d.flags & F.LEDGE) ? d.ledge || null : null;
  };
  const wcache = new Map();
  const walk = (x, y, lv, broken) => {
    if (x < 0 || y < 0 || x >= W || y >= H || solidEnt.has(x + ',' + y)) return false;
    const i = crackIx.get(x + ',' + y);
    const b = i !== undefined && (broken & (1 << i)) ? 1 : 0;
    const k = ((y * W + x) * 3 + lv) * 2 + b;
    let v = wcache.get(k);
    if (v === undefined) {
      if (b) room.setTile(x, y, cracks[i].broke);
      v = !!(room.flagsAt(x, y, lv) & F.STAIRS) || tileWalkable(room, x, y, lv, caps, ROUTE_AVOID);
      if (b) room.setTile(x, y, cracks[i].base);
      wcache.set(k, v);
    }
    return v;
  };
  const sea = (s) => (opts.fixedSea != null ? opts.fixedSea : s.sea);

  // Where Link can be: a flood from `from`, the cube a wall.
  const region = (from, s) => {
    const lv = sea(s);
    const seen = new Set([from[1] * W + from[0]]); const q = [from];
    while (q.length) {
      const [x, y] = q.pop();
      for (const [dx, dy, dir] of DIRS) {
        let nx = x + dx, ny = y + dy;
        if (nx === s.cx && ny === s.cy) continue;
        if (!walk(nx, ny, lv, s.broken)) {
          // Walked off a ledge, as the engine hops it.
          if (ledge(nx, ny) !== dir) continue;
          while (ledge(nx, ny) === dir) { nx += dx; ny += dy; }
          if ((nx === s.cx && ny === s.cy) || !walk(nx, ny, lv, s.broken)) continue;
        }
        const k = ny * W + nx;
        if (seen.has(k)) continue;
        seen.add(k); q.push([nx, ny]);
      }
    }
    return seen;
  };

  // The cube moving one tile (dx, dy) at the water `lvAt` gives, from state s.
  // Returns the new state's cube part, or null if it will not go.
  // A cube that comes onto deep water DRIFTS: it carries on the way it was
  // going, a tile at a time, until the next tile is not deep (it grounds
  // there, and that move tips it) or will not take it (it stops afloat).
  const shove = (s, dx, dy, lvAt) => {
    let cur = step(s, dx, dy, lvAt);
    if (!cur || cur.fell) return cur;
    for (let n = 0; n < 64 && cur.afloat; n++) {
      const nxt = step({ ...s, ...cur }, dx, dy, lvAt);
      if (!nxt) break;
      cur = nxt;
      if (cur.fell) break;
    }
    if (cur && !cur.fell) delete cur.afloat;
    return cur;
  };
  const step = (s, dx, dy, lvAt) => {
    const nx = s.cx + dx, ny = s.cy + dy;
    if (nx < 0 || ny < 0 || nx >= W || ny >= H || solidEnt.has(nx + ',' + ny)) return null;
    const lv = lvAt(nx, ny);
    const f = fl(nx, ny, lv, s.broken);
    if (f & (F.STAIRS | F.WARP | F.DOOR)) return null;
    if (solidWith(nx, ny, lv, s.broken, CUBE_CAPS)) return null;
    let o = s.o, broken = s.broken;
    if (f & F.PIT) return { fell: true };
    if (!(f & F.DEEP) || opts.noFloat) o = dx ? ROLL_EW[o] : ROLL_NS[o];
    // Come to rest on a crack: it gives way under the cube.
    const i = crackIx.get(nx + ',' + ny);
    if (i !== undefined && !opts.noCrack && !(broken & (1 << i))) {
      broken |= 1 << i;
      const g = fl(nx, ny, sea(s), broken);
      if (g & F.PIT) return { fell: true, broken };
      // It settled before the floor went, so it floats where it is.
      return { cx: nx, cy: ny, o, broken, afloat: false };
    }
    return { cx: nx, cy: ny, o, broken, afloat: !!(f & F.DEEP) };
  };

  const plateMask = (cx, cy, o, done) => {
    let m = done;
    plates.forEach((p, i) => { if (p.x === cx && p.y === cy && topOf(o) === p.colour) m |= 1 << i; });
    return m;
  };
  const ALL = (1 << plates.length) - 1;
  const fresh = (s, cubePart) => {
    const n = { ...s, ...cubePart };
    if (cubePart.fell) {
      n.cx = cube.x; n.cy = cube.y; n.o = cube.o;
      delete n.fell;
      if (cubePart.broken != null) n.broken = cubePart.broken;
    }
    n.done = plateMask(n.cx, n.cy, n.o, n.done);
    return n;
  };

  const coneTide = (s, o) => ({
    levelAt(tx, ty, r) {
      const base = sea(s);
      const cov = Tide.prototype.covers.call({ blows: Tide.prototype.blows, level: base }, o, tx, ty, r);
      return cov ? Math.max(0, base - 1) : base;
    },
  });

  function* moves(s, reach) {
    const lv = sea(s);
    // Push: Link on the tile behind it.
    for (const [dx, dy, dir] of DIRS) {
      const bx = s.cx - dx, by = s.cy - dy;
      if (!reach.has(by * W + bx)) continue;
      if (fl(bx, by, lv, s.broken) & F.DEEP) continue;     // no pushing while swimming
      const r = shove(s, dx, dy, () => lv);
      if (r) yield [fresh(s, r), 1, { push: dir, from: [bx, by] }];
    }
    // Gust: Link facing it from a tile he is not swimming on, the cube's
    // middle in the cone.
    if (opts.bellows) {
      const seen = new Set();
      for (const k of reach) {
        const x = k % W, y = (k - x) / W;
        if (fl(x, y, lv, s.broken) & F.DEEP) continue;
        for (const [dx, dy, dir] of DIRS) {
          const o = { tx: x, ty: y, r: BELLOWS_RANGE, dx, dy, shape: 'cone' };
          if (!Tide.prototype.covers.call({ blows: Tide.prototype.blows, level: lv }, o, s.cx, s.cy, room)) continue;
          const t = coneTide(s, o);
          const r = shove(s, dx, dy, (tx, ty) => t.levelAt(tx, ty, room));
          if (!r) continue;
          const rk = JSON.stringify(r);
          if (seen.has(rk)) continue;
          seen.add(rk);
          yield [fresh(s, r), 1, { gust: dir, from: [x, y] }];
        }
      }
    }
    // Stand on a crack until it gives way: at a sea where the break is a
    // hole he falls (and the room puts him back at its way in, `from`);
    // where it is the sea he drops into it and swims.
    for (const c of opts.noStand || opts.noCrack ? [] : cracks) {
      const i = crackIx.get(c.x + ',' + c.y);
      if (s.broken & (1 << i) || !reach.has(c.y * W + c.x)) continue;
      const broken = s.broken | (1 << i);
      const f = fl(c.x, c.y, lv, broken);
      const n = { ...s, broken };
      yield [n, 1, { stand: [c.x, c.y], from: (f & F.PIT) ? opts.entry : [c.x, c.y] }];
    }
    // Sound the conch. The cube on a tile that opens into a hole goes down it.
    if (opts.fixedSea == null && !opts.noConch) {
      const n = { ...s, sea: (s.sea + 1) % 3 };
      const f = fl(s.cx, s.cy, n.sea, s.broken);
      yield [f & F.PIT ? fresh(n, { fell: true }) : fresh(n, {}), 1000, { conch: n.sea }];
    }
  }

  // Link's canonical tile is the least index in his region.
  const key = (s, reach) => {
    let m = Infinity; for (const k of reach) if (k < m) m = k;
    return `${s.cx},${s.cy},${s.o},${s.sea},${s.done},${s.broken},${m}`;
  };

  /**
   * Fewest presses (then fewest moves) from Link on `from` at `startSea` to
   * every plate done. Link's tile is carried as any tile of his region,
   * re-flooded from there after each move.
   */
  function solve(from, startSea, limit = 400000) {
    if (!opts.entry) opts.entry = from;
    const s0 = fresh({ cx: cube.x, cy: cube.y, o: cube.o, sea: startSea, done: 0, broken: 0 }, {});
    s0.lx = from[0]; s0.ly = from[1];
    const r0 = region(from, s0);
    if (!walk(from[0], from[1], sea(s0), 0)) return null;
    const dist = new Map(), prev = new Map(), st = new Map();
    const k0 = key(s0, r0);
    dist.set(k0, 0); prev.set(k0, null); st.set(k0, s0);
    // Bucketed by cost.
    const buckets = new Map([[0, [k0]]]);
    let cost = 0, n = 0;
    while (buckets.size) {
      while (!buckets.has(cost)) cost++;
      const b = buckets.get(cost);
      const k = b.pop(); if (!b.length) buckets.delete(cost);
      if (dist.get(k) !== cost) continue;
      const s = st.get(k);
      if (opts.visit) opts.visit(s);
      if (s.done === ALL) {
        const steps = [];
        for (let c = k; prev.get(c); c = prev.get(c)[0]) steps.push({ ...prev.get(c)[1], state: st.get(c) });
        return { presses: Math.floor(cost / 1000), moves: cost % 1000, steps: steps.reverse(), states: n };
      }
      if (++n > limit) return { gaveUp: true, states: n };
      const reach = region([s.lx, s.ly], s);
      for (const [ns, c, act] of moves(s, reach)) {
        // Link stays where he was standing to act; flood from there.
        const at = act.from || [s.lx, s.ly];
        ns.lx = at[0]; ns.ly = at[1];
        const rn = region(at, ns);
        if (!walk(at[0], at[1], sea(ns), ns.broken)) continue;   // the conch took his footing
        const kn = key(ns, rn), nc = cost + c;
        if (dist.has(kn) && dist.get(kn) <= nc) continue;
        dist.set(kn, nc); prev.set(kn, [k, act]); st.set(kn, ns);
        if (!buckets.has(nc)) buckets.set(nc, []);
        buckets.get(nc).push(kn);
      }
    }
    return null;
  }

  /**
   * Can Link get back to `to` from state s — walking, or within `depth`
   * moves of the cube or presses (he may have to shove it out of a doorway)?
   */
  function canLeave(s, to, depth = 4) {
    const tk = to[1] * W + to[0];
    let front = [s];
    const seen = new Set();
    for (let d = 0; d <= depth; d++) {
      const next = [];
      for (const t of front) {
        const reach = region([t.lx, t.ly], t);
        if (reach.has(tk)) return true;
        const k = key(t, reach);
        if (seen.has(k)) continue;
        seen.add(k);
        if (d === depth) continue;
        for (const [n, , act] of moves(t, reach)) {
          const at = act.from || [t.lx, t.ly];
          if (!walk(at[0], at[1], sea(n), n.broken)) continue;
          next.push({ ...n, lx: at[0], ly: at[1] });
        }
      }
      front = next;
    }
    return false;
  }

  return { solve, region, cracks, walk, shove, canLeave, ALL };
}

/** A solution as words. */
export function describeCube(r) {
  return r.steps.map(st => st.conch != null ? `conch ${['LOW', 'MID', 'HIGH'][st.conch]}`
    : st.stand ? `break ${st.stand}`
    : `${st.push ? 'push ' + st.push : 'gust ' + st.gust}@${st.from}->${st.state.cx},${st.state.cy} ${orientName(st.state.o)}`).join('; ');
}
