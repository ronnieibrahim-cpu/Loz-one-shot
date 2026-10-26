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
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { installData } from '../src/data/index.js';
import { MAPS, getRoom, registerMap } from '../src/world/maps.js';
import { F } from '../src/world/tileset.js';
import { tileWalkable, tileSolid, ROUTE_AVOID, capsForDungeonIndex } from './lib/collision.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
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

// 7-10, in the engine.
const BUILT = CLAIMS.filter(c => !c.mock);
if (BUILT.length) {
  const { chromium } = await import('playwright');
  const { installRuntime } = await import('./actor-runtime.mjs');
  const { BRIDGE_PLANK_FRAMES: N } = await import('../src/data/feel.js');
  const server = createServer(async (req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
    const full = join(ROOT, normalize(p)); const st = await stat(full).catch(() => null);
    if (!st || !st.isFile()) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': extname(full) === '.html' ? 'text/html' : 'text/javascript' }); res.end(await readFile(full));
  });
  await new Promise(r => server.listen(0, r));
  const browser = await chromium.launch().catch(() =>
    chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' }));
  const page = await browser.newPage();
  const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.goto(`http://localhost:${server.address().port}/index.html`);
  await page.waitForFunction(() => window.__game && window.__harness);
  await page.evaluate(installRuntime);
  for (const c of BUILT) {
    const { k } = c, tag = `${c.mapId} ${c.key} (${c.def.name})`;
    const [f, rx, ry] = c.key.split(',').map(Number);
    const room = getRoom(c.mapId, f, rx, ry);
    const caps = capsForDungeonIndex(c.index);
    const best = makeBridgeModel(room, k, c.blocks, caps).solve(k.from, 0);
    const plan = [['wait', 4], ['equip', 'conch', 'B', 400]];
    for (const st of best.steps) {
      if (st.conch != null) plan.push(['tide', st.conch, 140, 900]);
      else plan.push(['goto', st.from[0], st.from[1], 1500], ['wait', 6], ['hold', [st.push], 40], ['wait', 30]);
    }
    // Walk the planks to the target, face the chest beside it, open it.
    const chest = (c.def.entities || []).find(e => e[0] === 'chest');
    const face = chest[1] < k.target[0] ? 'left' : chest[1] > k.target[0] ? 'right' : chest[2] < k.target[1] ? 'up' : 'down';
    plan.push(['wait', N * (k.planks.length + 2)], ['goto', k.target[0], k.target[1], 1500], ['wait', 10], ['hold', [face], 20], ['tap', 'a', 40], ['dialogue', 300]);
    const setup = { seed: 20261026, items: { sword: 1, conch: 1 }, equipA: 'sword', equipB: 'conch', maxHearts: 24, hearts: 24, tide: 0,
      enter: [c.mapId, f, rx, ry, k.from[0] * 16, k.from[1] * 16, 'up'] };
    const r = await page.evaluate(async ([setup, plan, k, chest, N]) => {
      const g = window.__game, h = window.__harness, out = {};
      const step = (n) => { for (let i = 0; i < n; i++) { h.step(1); g.dialogue.active = false; g.bannerTime = 0; } };
      const laid = () => k.planks.map(([x, y]) => g.room.override[y * g.room.tw + x] ? 1 : 0).join('');
      // 9. the solution, played.
      window.__rp.beginRecord(setup, plan);
      for (let i = 0; i < 4; i++) window.__rp.pump(1);
      for (const e of g.entities) if (e.isEnemy) e.remove = true;
      g.enemiesOff = true; g.player.invuln = 1e6;
      try { for (let n = 0; n < 900 && !window.__rp.pump(100).done; n++); } catch (e) { out.err = String(e && e.message || e); }
      const ch = g.entities.find(e => e.constructor.name === 'Chest' && Math.floor(e.x / 16) === chest[1] && Math.floor(e.y / 16) === chest[2]);
      out.opened = !!(ch && ch.opened);
      out.chests = g.entities.filter(e => e.constructor.name === "Chest").map(e => [e.x, e.y, e.opened]); out.dir = g.player.dir; out.trace = window.__rp._trace.slice(-4).map(t => t.kind + "@" + Math.round(t.x) + "," + Math.round(t.y));
      out.at = [Math.round(g.player.x / 16), Math.round(g.player.y / 16), g.tide.level];
      // 7. The planks, frame by frame: the block taken off the plate, then put back.
      const [mid, fl, x, y] = [setup.enter[0], ...setup.enter.slice(1, 4)];
      g.tide.clearOverrides(); g.tide.setLevel(0, { instant: true });
      g.enterMap(mid, fl, x, y, 7 * 16, 9 * 16, 'up', { instant: true }); step(2);
      const blk = g.entities.find(e => e.constructor.name === 'PushBlock');
      out.atEntry = laid();
      blk.x = k.plate[0] * 16; blk.y = k.plate[1] * 16; blk.fx = blk.x * 256; blk.fy = blk.y * 256;
      const seq = []; for (let i = 0; i < N * (k.planks.length + 1); i++) { step(1); seq.push(laid()); }
      out.down = seq;
      blk.x = 2 * 16; blk.y = 9 * 16; blk.fx = blk.x * 256; blk.fy = blk.y * 256;
      const seq2 = []; for (let i = 0; i < N * (k.planks.length + 1); i++) { step(1); seq2.push(laid()); }
      out.up = seq2;
      // 8. Link on the far plank when it comes up.
      blk.x = k.plate[0] * 16; blk.y = k.plate[1] * 16; blk.fx = blk.x * 256; blk.fy = blk.y * 256;
      step(N * (k.planks.length + 2));
      const far = k.planks[k.planks.length - 1];
      g.player.x = far[0] * 16; g.player.y = far[1] * 16; g.player.fx = g.player.x * 256; g.player.fy = g.player.y * 256;
      g.player.invuln = 0; const hp = g.progress.hearts;
      blk.x = 2 * 16; blk.y = 9 * 16; blk.fx = blk.x * 256; blk.fy = blk.y * 256;
      step(N * 2 + 90);
      out.fell = g.progress.hearts < hp || Math.round(g.player.x / 16) !== far[0] || Math.round(g.player.y / 16) !== far[1];
      // 10. a save and a load: the block back home, the bridge up.
      blk.x = k.plate[0] * 16; blk.y = k.plate[1] * 16; blk.fx = blk.x * 256; blk.fy = blk.y * 256;
      g.player.x = 7 * 16; g.player.y = 9 * 16; g.player.fx = g.player.x * 256; g.player.fy = g.player.y * 256;
      step(N * (k.planks.length + 2));
      g.save(); g.loadGame(g.slot != null ? g.slot : 0); step(4);
      out.reload = laid();
      return out;
    }, [setup, plan, k, chest, N]);
    const n = k.planks.length, none = '0'.repeat(n), all = '1'.repeat(n);
    check(`${tag}: played in the engine, the solution crosses and opens the chest`, !r.err && r.opened, JSON.stringify({ err: r.err, at: r.at, chests: r.chests, dir: r.dir, trace: r.trace }));
    check(`${tag}: walked into, the bridge is up`, r.atEntry === none, r.atEntry);
    const firstDown = r.down.findIndex(v => v !== none);
    const ordered = r.down.every(v => /^1*0*$/.test(v));
    const step = r.down.map(v => v.split('').filter(x => x === '1').length);
    const gaps = []; for (let i = 1; i <= n; i++) gaps.push(step.indexOf(i) - (i > 1 ? step.indexOf(i - 1) : -1));
    check(`${tag}: held, a plank goes down every ${N} frames from the near end`, ordered && r.down[r.down.length - 1] === all
      && gaps.every(g => g === N), JSON.stringify({ firstDown, gaps }));
    const upOrdered = r.up.every(v => /^1*0*$/.test(v));
    check(`${tag}: let go, they come up from the far end, ${N} frames apart`, upOrdered && r.up[r.up.length - 1] === none,
      r.up.filter((v, i) => !i || v !== r.up[i - 1]).join(' '));
    check(`${tag}: Link on the far plank when it comes up falls`, r.fell);
    check(`${tag}: after a save and a load the bridge is up`, r.reload === none, r.reload);
  }
  check('no console errors in the engine half', !errors.length, errors[0]);
  await browser.close(); server.close();
}

console.log(`\n=== ${pass} passed, ${fail.length} failed ===`);
process.exit(fail.length ? 1 : 0);
