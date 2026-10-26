// THE HELD BRIDGE (S211, docs/briefs/PUZZLE-PASS.md "More"; Ages'
// INTERAC_EXTENDABLE_BRIDGE, extendableBridge.s, rooms $44c/$44e/$4c7). The
// cartridge lays a bridge one plank every ten frames when its switch is set,
// and takes it up again from the far end when the switch goes back. Ours is
// held by a plate: the planks are down only while something keeps the plate
// pressed, so Link cannot hold it and cross it at once. The sea decides the
// rest: what can reach the plate, and when the far side can be stood on.
//
// A room claims it:
//
//   bridgeRoom: { from: [x, y], target: [x, y], plate: [x, y],
//                 planks: [[x, y], ...] (near end first), seas: [..],
//                 seaHolds?: true, anchor?: true }
//
// `target` is the tile the bridge is for (where Link stands to open its
// chest). `seaHolds` says deep water over the plate presses it (the twist as
// first proposed); without it only a block, or Link, does. Blocks move any
// number of times by the engine's PushBlock rules: not onto deep water, down
// a hole (lost to the puzzle until the room is entered again, so never a
// move). Proved by the model:
//
//   1. walking in from `from` at every sea, `target` can be reached;
//   2. not with the blocks never moved (Link alone, and the sea, cannot);
//   3. not at any one sea held;
//   4. the fewest-press solution sounds the conch for exactly `seas`;
//   5. no reachable state shuts Link in (he can always walk back to `from`);
//   6. a bridge never comes up under him in the solution (it is never let go
//      while he stands on a plank).
// And, for a room built into a dungeon, in the engine:
//   7. pressed, the planks go down from the near end one every
//      BRIDGE_PLANK_FRAMES; let go, they come up from the far end;
//   8. Link standing on a plank that comes up falls;
//   9. the solution played as directives reaches `target` and opens the chest;
//  10. a save and a load puts the block back and the bridge up.
//
// Usage: node tools/check-bridges.mjs
//        node tools/check-bridges.mjs --mock spec.json   (model only: spec
//        { legend, rooms: { name: grid }, claims: { name: { bridge: {...},
//        blocks: [[x, y]] } } })
import { readFile } from 'node:fs/promises';
import { installData } from '../src/data/index.js';
import { MAPS, getRoom, registerMap } from '../src/world/maps.js';
import { F } from '../src/world/tileset.js';
import { tileWalkable, tileSolid, ROUTE_AVOID, capsForDungeonIndex } from './lib/collision.mjs';

installData();
let pass = 0; const fail = [];
const check = (n, c, d) => c ? (pass++, console.log('  ok   ' + n))
  : (fail.push(n), console.log('  FAIL ' + n + (d ? ' — ' + d : '')));
const SEA = ['LOW', 'MID', 'HIGH'];
const DIRS = [[1, 0, 'right'], [-1, 0, 'left'], [0, 1, 'down'], [0, -1, 'up']];

/** The model: Link's region, the blocks, the sea. The bridge is down while
 *  the plate is held by something that is not Link. */
export function makeBridgeModel(room, k, blocks0, caps) {
  const W = room.tw, H = room.th;
  const plank = new Set(k.planks.map(([x, y]) => y * W + x));
  const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const occ = (b, x, y) => b.some(p => p[0] === x && p[1] === y);
  const held = (b, lv) => occ(b, k.plate[0], k.plate[1])
    || (k.seaHolds && !!(room.flagsAt(k.plate[0], k.plate[1], lv) & F.DEEP));
  const walk = (b, x, y, lv, down) => inb(x, y) && !occ(b, x, y)
    && (plank.has(y * W + x) ? down : tileWalkable(room, x, y, lv, caps, ROUTE_AVOID));
  const region = (b, from, lv) => {
    const down = held(b, lv);
    const seen = new Set([from[1] * W + from[0]]), q = [from];
    while (q.length) {
      const [x, y] = q.pop();
      for (const [dx, dy] of DIRS) {
        const nx = x + dx, ny = y + dy, kk = ny * W + nx;
        if (seen.has(kk) || !walk(b, nx, ny, lv, down)) continue;
        seen.add(kk); q.push([nx, ny]);
      }
    }
    return seen;
  };
  const key = (s, reach) => { let m = Infinity; for (const kk of reach) if (kk < m) m = kk;
    return `${JSON.stringify(s.b.slice().sort())},${s.sea},${m}`; };
  const moves = (s, opts) => {
    const lv = opts.fixedSea != null ? opts.fixedSea : s.sea, reach = region(s.b, [s.lx, s.ly], lv), out = [];
    for (let i = 0; i < (opts.still ? 0 : s.b.length); i++) {
      const [cx, cy] = s.b[i];
      for (const [dx, dy, dir] of DIRS) {
        const bx = cx - dx, by = cy - dy;
        if (!reach.has(by * W + bx) || (room.flagsAt(bx, by, lv) & F.DEEP)) continue;
        const nx = cx + dx, ny = cy + dy;
        if (!inb(nx, ny) || occ(s.b, nx, ny) || plank.has(ny * W + nx)) continue;
        if (tileSolid(room, nx, ny, lv, { jumping: false, swim: false })) continue;
        if (room.flagsAt(nx, ny, lv) & (F.PIT | F.DEEP)) continue;
        const b = s.b.map((p, j) => j === i ? [nx, ny] : p);
        // Letting go of the plate with Link on a plank drops him: not a move.
        if (plank.has(by * W + bx) && held(s.b, lv) && !held(b, lv)) continue;
        out.push([{ ...s, b, lx: bx, ly: by }, 1, { push: dir, from: [bx, by] }]);
      }
    }
    if (opts.fixedSea == null) {
      const to = (lv + 1) % 3;
      const onPlank = plank.has(s.ly * W + s.lx);
      if (!(onPlank && held(s.b, lv) && !held(s.b, to))) out.push([{ ...s, sea: to }, 1000, { conch: to }]);
    }
    return { reach, out };
  };
  function solve(from, startSea, opts = {}, limit = 300000) {
    const s0 = { b: blocks0.map(p => p.slice()), sea: opts.fixedSea != null ? opts.fixedSea : startSea, lx: from[0], ly: from[1] };
    const goal = k.target[1] * W + k.target[0];
    const k0 = key(s0, region(s0.b, from, s0.sea));
    const dist = new Map([[k0, 0]]), prev = new Map([[k0, null]]), st = new Map([[k0, s0]]);
    const buckets = new Map([[0, [k0]]]); let cost = 0, n = 0;
    while (buckets.size) {
      while (!buckets.has(cost)) cost++;
      const bk = buckets.get(cost); const kk = bk.pop(); if (!bk.length) buckets.delete(cost);
      if (dist.get(kk) !== cost) continue;
      const s = st.get(kk);
      if (opts.visit) opts.visit(s);
      const { reach, out } = moves(s, opts);
      if (reach.has(goal)) {
        const steps = []; for (let c = kk; prev.get(c); c = prev.get(c)[0]) steps.push({ ...prev.get(c)[1], state: st.get(c) });
        return { presses: Math.floor(cost / 1000), pushes: cost % 1000, steps: steps.reverse(), states: n };
      }
      if (++n > limit) return { gaveUp: true, states: n };
      for (const [ns, c, act] of out) {
        const kn = key(ns, region(ns.b, [ns.lx, ns.ly], opts.fixedSea != null ? opts.fixedSea : ns.sea)), nc = cost + c;
        if (dist.has(kn) && dist.get(kn) <= nc) continue;
        dist.set(kn, nc); prev.set(kn, [kk, act]); st.set(kn, ns);
        if (!buckets.has(nc)) buckets.set(nc, []); buckets.get(nc).push(kn);
      }
    }
    return null;
  }
  /** Every state reachable from `from`, for the no-trap clause. */
  function states(from, startSea, limit = 200000) {
    const s0 = { b: blocks0.map(p => p.slice()), sea: startSea, lx: from[0], ly: from[1] };
    const seen = new Map([[key(s0, region(s0.b, from, startSea)), s0]]), q = [s0];
    while (q.length && seen.size < limit) {
      const s = q.pop();
      for (const [ns] of moves(s, {}).out) {
        const kn = key(ns, region(ns.b, [ns.lx, ns.ly], ns.sea));
        if (!seen.has(kn)) { seen.set(kn, ns); q.push(ns); }
      }
    }
    return [...seen.values()];
  }
  return { solve, states, region, held };
}

const MOCK = process.argv.includes('--mock') ? process.argv[process.argv.indexOf('--mock') + 1] : null;
const CLAIMS = [];
if (MOCK) {
  const spec = JSON.parse(await readFile(MOCK, 'utf8'));
  for (const [name, grid] of Object.entries(spec.rooms)) {
    const c = spec.claims && spec.claims[name];
    if (!c || !c.bridge) continue;
    const id = 'mock_' + name;
    registerMap({ id, kind: 'dungeon', name: 'Mock', w: 3, h: 3, floors: 1, cell: [15, 11],
      legend: (spec.legends && spec.legends[name]) || spec.legend, dungeon: { index: c.index || 1 },
      rooms: { '0,0,0': { name, map: grid } } });
    CLAIMS.push({ mapId: id, key: '0,0,0', def: { name }, k: c.bridge, blocks: c.blocks || [], index: c.index || 1, mock: true });
  }
} else {
  for (const [mapId, m] of MAPS) {
    for (const [key, def] of Object.entries(m.roomDefs || {})) {
      if (!def.bridgeRoom) continue;
      CLAIMS.push({ mapId, key, def, k: def.bridgeRoom, index: m.dungeon ? m.dungeon.index : 0,
        blocks: (def.entities || []).filter(e => e[0] === 'block').map(e => [e[1], e[2]]) });
    }
  }
}

console.log(`check-bridges: ${CLAIMS.length} bridge room(s)${MOCK ? ' (mock)' : ''}`);
for (const c of CLAIMS) {
  const { k } = c, tag = `${c.mapId} ${c.key} (${c.def.name})`;
  const room = getRoom(c.mapId, ...c.key.split(',').map(Number));
  const caps = capsForDungeonIndex(c.index);
  const M = makeBridgeModel(room, k, c.blocks, caps);
  // The planks must span a hole: each plank tile, bridge up, is a pit.
  check(`${tag}: every plank spans a hole while the bridge is up`,
    k.planks.every(([x, y]) => [0, 1, 2].every(lv => room.flagsAt(x, y, lv) & F.PIT)));
  // 1.
  const sols = [0, 1, 2].map(lv => M.solve(k.from, lv));
  check(`${tag}: walking in at every sea, the bridge's far side can be reached`, sols.every(s => s && !s.gaveUp),
    sols.map((s, lv) => SEA[lv] + ':' + (s ? (s.gaveUp ? 'gave up' : s.presses + 'p') : 'no')).join(' '));
  // 2.
  const still = [0, 1, 2].map(lv => M.solve(k.from, lv, { still: true }));
  check(`${tag}: not with the blocks never moved (Link and the sea alone)`, still.every(s => !s || s.gaveUp),
    still.map((s, lv) => s && !s.gaveUp ? SEA[lv] : '').filter(Boolean).join(','));
  // 3.
  const fixed = [0, 1, 2].map(lv => M.solve(k.from, lv, { fixedSea: lv }));
  check(`${tag}: not at any one sea held`, fixed.every(s => !s || s.gaveUp),
    fixed.map((s, lv) => s && !s.gaveUp ? SEA[lv] : '').filter(Boolean).join(','));
  // 4.
  const best = sols[0];
  const sounded = best && !best.gaveUp ? best.steps.filter(s => s.conch != null).map(s => s.conch) : null;
  if (best && !best.gaveUp) console.log(`       ${tag}: from LOW, ${best.presses} presses and ${best.pushes} pushes: ` +
    best.steps.map(s => s.conch != null ? SEA[s.conch] : s.push).join(' '));
  check(`${tag}: the fewest-press solution sounds ${(k.seas || []).map(l => SEA[l]).join(', ')}`,
    sounded && JSON.stringify(sounded) === JSON.stringify(k.seas), sounded && sounded.map(l => SEA[l]).join(','));
  // 5.
  const all = M.states(k.from, 0);
  // Out means any doorway in the ring: a block left in front of one door
  // goes back with the room when he leaves by another.
  const doors = new Set();
  for (let y = 0; y < room.th; y++) for (let x = 0; x < room.tw; x++) {
    if (x && y && x < room.tw - 1 && y < room.th - 1) continue;
    if ([0, 1, 2].some(lv => tileWalkable(room, x, y, lv, caps, ROUTE_AVOID))) doors.add(y * room.tw + x);
  }
  const out = (reach) => { for (const d of doors) if (reach.has(d)) return true; return false; };
  const shut = all.filter(s => {
    // Allow a press or two round: the sea is always in his hand.
    for (let d = 0; d <= 2; d++) if (out(M.region(s.b, [s.lx, s.ly], (s.sea + d) % 3))) return false;
    return true;
  });
  check(`${tag}: no reachable state shuts Link in (${all.length} states)`, !shut.length,
    shut.slice(0, 2).map(s => JSON.stringify([s.lx, s.ly, s.sea, s.b])).join(' '));
}

console.log(`\n=== ${pass} passed, ${fail.length} failed ===`);
process.exit(fail.length ? 1 : 0);
