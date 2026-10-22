// THE RED AND BLUE BLOCKS (S205, docs/briefs/PUZZLE-PASS.md kind B).
//
// Oracle of Ages' toggle blocks — an orb flips which colour stands — with the
// conch as the orb: EVERY TIDE CHANGE FLIPS THEM (`Tide.setLevel`), so a press
// moves the sea one step round LOW, MID, HIGH and swaps the blocks in the same
// breath, and the two cannot be set apart. A room built on them declares
//
//   toggleRoom: { from: [x, y], to: [x, y], anchor?: true, out?: [[x, y], ...] }
//
// and this proves, per room, over the state space in tools/lib/toggle-flood.mjs
// (tile, sea, which colour stands, where the Anchor is), the engine's own
// collision asked at every step:
//
//   1. from `from`, at every sea and with either colour standing, `to` can be
//      reached — so however the player walks in, the room can be solved;
//   2. THE BLOCKS MATTER: with them frozen in either state, it cannot;
//   3. THE SEA MATTERS: with the water held at any one level and the blocks
//      still flipping on every press, it cannot — so it is a tide puzzle and
//      not a switch puzzle wearing one;
//      (the Anchor, which the player owns from D1, is allowed in all of the
//      above, so no room is "solved" by forgetting he has it)
//   4. a room with `anchor` is the Anchor's: holding the water while the
//      blocks go on flipping IS its answer, so 2 and 3 are replaced by —
//      the conch alone cannot; one Anchor can; frozen in some state the
//      blocks defeat even the Anchor; and with every block lowered for good
//      the conch alone CAN, so the blocks are the whole reason it is needed;
//   5. NO TRAP: from every state reachable from `from`, `from` or `to` or one
//      of `out` can still be reached;
//
// and then, in the real engine:
//
//   6. sounding the conch in the room swaps every red and blue block, solid
//      for walkable, and flips `progress.toggle`; a level set `instant` does not;
//   7. on a lowered block that would come up, the conch is refused: no tide
//      change, no flip;
//   8. the Lens's preview of the next tide shows the blocks swapped;
//   9. a save and a load keep which colour stands;
//  10. the fewest-press solution from LOW with red up, played in the engine
//      — Link stood on each tile of the path in turn, asked of `canOccupy`,
//      the conch really sounded at each press, the Anchor's patch laid where
//      it bites — arrives, and stood on `to` the room's puzzle pays out if it
//      has one.
//
// Usage: node tools/check-toggles.mjs
//        node tools/check-toggles.mjs --mock spec.json   (model only, for a
//        proposed room: spec { legend, rooms: {name: grid}, claims: {name:
//        claim}, index? })
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { installData } from '../src/data/index.js';
import { MAPS, getRoom, registerMap } from '../src/world/maps.js';
import { getTileDef } from '../src/world/tileset.js';
import { capsForDungeonIndex } from './lib/collision.mjs';
import { makeModel, stateName } from './lib/toggle-flood.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
installData();

let pass = 0; const fail = [];
const check = (n, c, d) => c ? (pass++, console.log('  ok   ' + n))
  : (fail.push(n), console.log('  FAIL ' + n + (d ? ' — ' + d : '')));

const MOCK = process.argv.includes('--mock') ? process.argv[process.argv.indexOf('--mock') + 1] : null;

const CLAIMS = [];
if (MOCK) {
  const spec = JSON.parse(await readFile(MOCK, 'utf8'));
  for (const [name, grid] of Object.entries(spec.rooms)) {
    if (!spec.claims[name]) continue;
    const id = 'mock_' + name;
    registerMap({
      id, kind: 'dungeon', name: 'Mock', w: 1, h: 1, floors: 1, cell: [15, 11], legend: spec.legend,
      dungeon: { index: spec.index || 2 }, rooms: { '0,0,0': { name, map: grid } },
    });
    CLAIMS.push({ mapId: id, key: '0,0,0', def: { name, map: grid }, k: spec.claims[name], index: spec.index || 2 });
  }
} else {
  for (const [mapId, m] of MAPS) {
    for (const [key, def] of Object.entries(m.roomDefs || {})) {
      if (def.toggleRoom) CLAIMS.push({ mapId, key, def, k: def.toggleRoom, index: m.dungeon ? m.dungeon.index : 0 });
    }
  }
  check('at least one room claims red and blue blocks', CLAIMS.length > 0);
  // Every room that places a block claims it, so none is unproved.
  for (const [mapId, m] of MAPS) {
    for (const [key, def] of Object.entries(m.roomDefs || {})) {
      if (def.toggleRoom || !def.map) continue;
      const room = getRoom(mapId, ...key.split(',').map(Number));
      let has = false;
      for (let y = 0; y < room.th && !has; y++) for (let x = 0; x < room.tw && !has; x++) {
        if (getTileDef(room.baseName(x, y)).toggle) has = true;
      }
      if (has) check(`${mapId} ${key} (${def.name}): places red or blue blocks and claims them`, false, 'no toggleRoom');
    }
  }
}

const describe = (r) => r.steps.map(st => st.conch ? `sound at ${st.conch} -> ${stateName(st.state)}`
  : st.throw ? `throw ${st.dir} from ${st.throw}, bite ${st.bite} at ${['LOW', 'MID', 'HIGH'][st.level]}`
    : `recall at ${st.recall}`).join('; ');

const solutions = [];
for (const c of CLAIMS) {
  const name = `${c.mapId} ${c.key} (${c.def.name})`;
  const room = getRoom(c.mapId, ...c.key.split(',').map(Number));
  const caps = capsForDungeonIndex(c.index);
  const { from, to } = c.k;
  const reachesFrom = (opts, start) => makeModel(room, { caps, ...opts }).route(start, to);
  const anyStart = (opts) => {
    const m = makeModel(room, { caps, ...opts });
    return m.startsAt(from).some(s => m.route(s, to));
  };
  const withAnchor = { anchor: true };

  // 1. solvable from every way in.
  const m = makeModel(room, { caps, ...withAnchor });
  let worst = 0, all = true;
  for (const s of m.startsAt(from)) {
    if (!m.ok(s.x, s.y, s)) continue;
    const r = m.route(s, to);
    if (!r) { all = false; check(`${name}: solvable walking in at ${stateName(s)}`, false); continue; }
    worst = Math.max(worst, r.presses);
  }
  check(`${name}: solvable however you walk in (at most ${worst} presses)`, all);
  const best = m.route({ x: from[0], y: from[1], base: 0, p: 0, a: null }, to);
  if (best) {
    console.log(`       from LOW, red up: ${describe(best)}`);
    solutions.push({ c, best });
  }

  if (!c.k.anchor) {
    // 2. the blocks matter.
    for (const fz of [0, 1]) {
      check(`${name}: not with the blocks frozen ${fz ? 'blue' : 'red'} up`, !anyStart({ ...withAnchor, frozen: fz }));
    }
    // 3. the sea matters.
    for (const sea of [0, 1, 2]) {
      check(`${name}: not with the sea held at ${['LOW', 'MID', 'HIGH'][sea]} and the blocks flipping`,
        !anyStart({ ...withAnchor, fixedSea: sea }));
    }
  } else {
    // 4. the Anchor's room.
    check(`${name}: not with the conch alone`, !anyStart({}));
    check(`${name}: frozen red or blue up, the blocks defeat even the Anchor`,
      [0, 1].some(fz => !anyStart({ ...withAnchor, frozen: fz })));
    check(`${name}: with every block lowered for good, the conch alone crosses it`, anyStart({ gone: true }));
  }
  // 5. no trap.
  const safe = [from, to, ...(c.k.out || [])];
  const reach = m.search(m.startsAt(from));
  const goal = (s) => safe.some(([x, y]) => s.x === x && s.y === y);
  // Backward closure over the reachable graph: the states that can reach a goal.
  const fwd = new Map();
  for (const [k, s] of reach.states) {
    const outs = [];
    for (const [n] of m.moves(s)) outs.push(m.key(n));
    fwd.set(k, outs);
  }
  const good = new Set([...reach.states].filter(([, s]) => goal(s)).map(([k]) => k));
  for (let changed = true; changed;) {
    changed = false;
    for (const [k, outs] of fwd) if (!good.has(k) && outs.some(o => good.has(o))) { good.add(k); changed = true; }
  }
  const trapped = [...reach.states].filter(([k]) => !good.has(k)).map(([, s]) => s);
  check(`${name}: no state you can get into strands you`, trapped.length === 0,
    trapped.slice(0, 3).map(s => `${s.x},${s.y} ${stateName(s)}${s.a ? ` anchor ${s.a.x},${s.a.y}` : ''}`).join('; '));
}

if (MOCK) {
  console.log(`\n=== ${pass} passed, ${fail.length} failed ===`);
  process.exit(fail.length ? 1 : 0);
}

// ---------------------------------------------------------------- the engine
const { chromium } = await import('playwright');
const { installRuntime } = await import('./actor-runtime.mjs');
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const full = join(ROOT, normalize(p)); const s = await stat(full).catch(() => null);
  if (!s || !s.isFile()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': extname(full) === '.html' ? 'text/html' : 'text/javascript' }); res.end(await readFile(full));
});
await new Promise(r => server.listen(0, r));
const browser = await chromium.launch().catch(() =>
  chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' }));
const page = await browser.newPage();
await page.goto(`http://localhost:${server.address().port}/index.html`);
await page.waitForFunction(() => window.__game && window.__harness);
await page.evaluate(installRuntime);

async function enter(c, sea, toggle) {
  const [f, rx, ry] = c.key.split(',').map(Number);
  await page.evaluate(([setup]) => window.__rp.beginRecord(setup, [['wait', 2]]), [{
    seed: 20261022, items: { sword: 1, conch: 1, anchor: 1, lens: 1 }, equipA: 'sword', equipB: 'conch',
    maxHearts: 24, hearts: 24, tide: sea,
    enter: [c.mapId, f, rx, ry, c.k.from[0] * 16, c.k.from[1] * 16, 'down'],
  }]);
  await page.evaluate(() => window.__rp.pump(10));
  await page.evaluate((t) => {
    const g = window.__game;
    g.tide.setToggle(t);
    for (const e of g.entities) if (e.isEnemy) e.remove = true;
    window.__harness.step(1);
    g.player.invuln = 1e6;
  }, toggle);
}

for (const { c, best } of solutions) {
  const name = `${c.mapId} ${c.key} (${c.def.name})`;
  // 6-9 on the room's own blocks.
  await enter(c, 0, 0);
  const r = await page.evaluate(async ([from]) => {
    const g = window.__game, p = g.player, T = 16;
    const { getTileDef } = await import('/src/world/tileset.js');
    const step = (n) => { for (let i = 0; i < n; i++) window.__harness.step(1); if (g.dialogue) g.dialogue.active = false; g.mode = 'play'; };
    const cells = [];
    for (let y = 0; y < g.room.th; y++) for (let x = 0; x < g.room.tw; x++) {
      const d = getTileDef(g.room.baseName(x, y));
      if (d.toggle) cells.push([x, y, d.toggle[0].includes('Red') ? 'red' : 'blue']);
    }
    const solid = () => cells.map(([x, y]) => !!(g.room.flagsAt(x, y, g.tide) & 1));
    const out = { cells: cells.length };
    out.before = solid(); out.t0 = g.progress.toggle;
    p.x = from[0] * T; p.y = from[1] * T;
    out.lensNext = (() => { const v = g.tide.viewAt((g.tide.level + 1) % 3); return cells.map(([x, y]) => !!(g.room.tile(x, y, v).flags & 1)); })();
    p.playConch(g); step(80);
    out.after = solid(); out.t1 = g.progress.toggle; out.lv1 = g.tide.level;
    g.tide.setLevel(2, { instant: true });
    out.tInstant = g.progress.toggle;
    // Stand on a lowered block whose colour would come up, and press.
    const low = cells.find(([x, y]) => !(g.room.flagsAt(x, y, g.tide) & 1));
    if (low) {
      g.tide.setLevel(0, { instant: true });
      p.x = low[0] * T; p.y = low[1] * T;
      const lv = g.tide.level, t = g.tide.toggle;
      p.conchTime = 0; p.playConch(g); step(80);
      out.refused = g.tide.level === lv && g.tide.toggle === t;
    }
    // A save and a load.
    p.x = from[0] * T; p.y = from[1] * T;
    g.slot = 2; g.save();
    const kept = g.progress.toggle;
    g.tide.setToggle(kept ^ 1);
    g.loadGame(2); step(2);
    out.loaded = g.progress.toggle === kept && g.tide.toggle === kept;
    return out;
  }, [c.k.from]);
  check(`${name}: the room has red and blue blocks`, r.cells > 0);
  check(`${name}: the conch swaps every block and flips the state`,
    r.after.every((s, i) => s !== r.before[i]) && r.t1 === (r.t0 ^ 1), JSON.stringify(r));
  check(`${name}: the Lens shows the next tide's blocks`, r.lensNext.every((s, i) => s === r.after[i]));
  check(`${name}: a level set outright does not flip them`, r.tInstant === r.t1);
  check(`${name}: on a lowered block the conch is refused`, r.refused === true);
  check(`${name}: a save and a load keep them`, r.loaded);

  // 10. the solution, played.
  await enter(c, best.steps.length ? 0 : 0, 0);
  const path = [];
  {
    const room = getRoom(c.mapId, ...c.key.split(',').map(Number));
    const caps = capsForDungeonIndex(c.index);
    const m = makeModel(room, { caps, anchor: true });
    // Rebuild the walk between actions: BFS on foot in each fixed state.
    let s = { x: c.k.from[0], y: c.k.from[1], base: 0, p: 0, a: null };
    const walkTo = (s, goal) => {
      const prev = new Map([[`${s.x},${s.y}`, null]]); const q = [[s.x, s.y]];
      while (q.length) {
        const [x, y] = q.shift();
        if (x === goal[0] && y === goal[1]) break;
        for (const [n] of m.moves({ ...s, x, y })) {
          if (n.base !== s.base || n.p !== s.p || n.a !== s.a) continue;
          const k = `${n.x},${n.y}`; if (prev.has(k)) continue;
          prev.set(k, [x, y]); q.push([n.x, n.y]);
        }
      }
      const out = []; let k = `${goal[0]},${goal[1]}`;
      if (!prev.has(k)) return null;
      for (let at = goal; at; at = prev.get(`${at[0]},${at[1]}`)) out.unshift(at);
      return out;
    };
    for (const st of best.steps) {
      const at = st.conch || st.throw || st.recall;
      path.push({ walk: walkTo(s, at) });
      path.push(st.conch ? { conch: true } : st.throw ? { anchor: [...st.bite, st.level] } : { recall: true });
      s = st.state;
    }
    path.push({ walk: walkTo(s, c.k.to) });
  }
  const played = await page.evaluate(async ([path, to]) => {
    const g = window.__game, p = g.player, T = 16;
    const { canOccupy } = await import('/src/game/entity.js');
    const step = (n) => { for (let i = 0; i < n; i++) window.__harness.step(1); if (g.dialogue) g.dialogue.active = false; g.mode = 'play'; };
    let anchor = null;
    for (const leg of path) {
      if (leg.walk) {
        if (!leg.walk) return { bad: 'no walk' };
        for (const [x, y] of leg.walk) {
          if (!canOccupy(g, p, x * T, y * T)) return { bad: `canOccupy refuses ${x},${y}`, lv: g.tide.level, t: g.tide.toggle };
          p.x = x * T; p.y = y * T; step(1);
          if (g.room !== g.room) return { bad: 'left' };
        }
      } else if (leg.conch) {
        const lv = g.tide.level; p.conchTime = 0; p.playConch(g); step(80);
        if (g.tide.level === lv) return { bad: `conch refused at ${p.x / T},${p.y / T}` };
      } else if (leg.anchor) {
        const [tx, ty, level] = leg.anchor;
        anchor = g.tide.addOverride({ mapId: g.mapId, roomKey: g.room.key, tx, ty, r: 2, shape: 'square', level, src: 'anchor' });
        step(1);
      } else if (leg.recall) {
        g.tide.removeOverride(anchor); anchor = null; step(1);
      }
    }
    step(30);
    return { at: [Math.round(p.x / T), Math.round(p.y / T)], done: !!g.room._puzzleDone, hasPuzzle: !!g.room.def.puzzle };
  }, [path, c.k.to]);
  check(`${name}: the fewest-press solution plays in the engine and arrives`,
    !played.bad && played.at[0] === c.k.to[0] && played.at[1] === c.k.to[1], JSON.stringify(played));
  if (played.hasPuzzle) check(`${name}: and standing there pays out the room's puzzle`, played.done, JSON.stringify(played));
}

await browser.close(); server.close();
console.log(`\n=== ${pass} passed, ${fail.length} failed ===`);
process.exit(fail.length ? 1 : 0);
