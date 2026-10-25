// THE FORDS (S210, docs/briefs/PUZZLE-PASS.md step 6's leftovers): a stake
// grown inside another puzzle. Until S210 five Shrine rooms were one sentence
// — throw a stake at HIGH, stand on it or push a block over it at LOW — and
// a pillar's other two lives (a wall at MID, deep water at HIGH) were in no
// puzzle at all. Every room declaring
//
//   fordRoom: { from: [x, y], seas: [..], stakes: [[x, y]], cut?: [x, y],
//               anchor?: { at, from, level }, without?: [what-if, ..] }
//
// is proved by the model (tools/lib/ford-flood.mjs: the engine's own
// collision, PushBlock / Statue / IceBlock rules and the seed's own flight):
//
//   1. it can be solved walking in from `from` at every sea;
//   2. no single sea solves it, and the fewest-press solution from LOW sounds
//      the conch for exactly `seas`;
//   3. it cannot be solved with no stake grown — the pillar is the puzzle;
//   4. every what-if the claim names in `without` leaves it unsolvable:
//      'pillarSoft' (a pillar never catches a seed or stops an ice block: its
//      MID wall is no part of it), 'statueWades' (a statue walks onto water:
//      the pillar is no road for it), 'noFall' (a block on a hole stays: the
//      drain is scenery), 'noAnchor';
//   5. a pillar grown anywhere else near the puzzle that a seed can reach, one
//      at a time, neither solves it at one sea nor saves a press;
//   6. no reachable state shuts Link in: from every one he can still get back
//      to `from`, walking or within a few moves.
//
// Usage: node tools/check-fords.mjs
//        node tools/check-fords.mjs --mock spec.json   (model only: spec
//        { legend, rooms: { name: grid }, claims: { name: { from, seas,
//        stakes, blocks?, ice?, statues?, plates?, cut?, anchor?, walls?,
//        noPlant?, without? } } })
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { installData } from '../src/data/index.js';
import { MAPS, getRoom, registerMap } from '../src/world/maps.js';
import { capsForDungeonIndex } from './lib/collision.mjs';
import { makeFordModel, describeFord } from './lib/ford-flood.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
installData();

let pass = 0; const fail = [];
const check = (n, c, d) => c ? (pass++, console.log('  ok   ' + n))
  : (fail.push(n), console.log('  FAIL ' + n + (d ? ' — ' + d : '')));
const SEA = ['LOW', 'MID', 'HIGH'];

const arg = (f) => process.argv.includes(f) ? process.argv[process.argv.indexOf(f) + 1] : null;
const MOCK = arg('--mock'), ONLY = arg('--only');
const FAST = process.argv.includes('--fast');
const ENGINE = process.argv.includes('--engine');   // skip clauses 5 and 6, keep the engine's   // skip clauses 5 and 6 while drafting
const CLAIMS = [];
if (MOCK) {
  const spec = JSON.parse(await readFile(MOCK, 'utf8'));
  for (const [name, grid] of Object.entries(spec.rooms)) {
    const k = spec.claims && spec.claims[name];
    if (!k || !k.stakes || (ONLY && ONLY !== name)) continue;
    const id = 'mock_' + name;
    const w = Math.ceil(grid[0].length / 15), h = Math.ceil(grid.length / 11);
    registerMap({ id, kind: 'dungeon', name: 'Mock', w: w + 2, h: h + 2, floors: 1, cell: [15, 11], legend: k.legend || spec.legend,
      dungeon: { index: k.index || 5 }, rooms: { '0,0,0': { name, map: grid, size: [w, h] } } });
    CLAIMS.push({ mapId: id, key: '0,0,0', def: { name }, k, spec: k, index: k.index || 5 });
  }
} else {
  for (const [mapId, m] of MAPS) {
    for (const [key, def] of Object.entries(m.roomDefs || {})) {
      if (!def.fordRoom || (ONLY && !def.name.includes(ONLY))) continue;
      const ents = def.entities || [];
      const pz = def.puzzle || {};
      const spec = {
        ...def.fordRoom,
        blocks: ents.filter(e => e[0] === 'block').map(e => [e[1], e[2]]),
        ice: ents.filter(e => e[0] === 'iceblock').map(e => [e[1], e[2]]),
        statues: ents.filter(e => e[0] === 'statue').map(e => [e[1], e[2]]),
        plates: (pz.blocks || []).map(([x, y]) => ({ x, y })),
        cut: def.fordRoom.cut ? { snarl: def.fordRoom.cut } : null,
        walls: ents.filter(e => ['chest', 'torch', 'sign', 'cube'].includes(e[0])
          && !(e[3] && pz.flag && e[3].needFlag === pz.flag)).map(e => [e[1], e[2]]),
        noPlant: ents.filter(e => e[0] === 'switch' && !(e[3] && e[3].stake)).map(e => [e[1], e[2]]),
      };
      CLAIMS.push({ mapId, key, def, k: def.fordRoom, spec, index: m.dungeon ? m.dungeon.index : 0 });
    }
  }
  check('at least one room claims a ford', CLAIMS.length > 0);
}

const solutions = [];
for (const c of CLAIMS) {
  const name = `${c.mapId} ${c.key} (${c.def.name})`;
  const room = getRoom(c.mapId, ...c.key.split(',').map(Number));
  const caps = capsForDungeonIndex(c.index);
  const spec = { ...c.spec, cut: c.spec.cut && !c.spec.cut.snarl ? { snarl: c.spec.cut } : c.spec.cut };
  const model = (o = {}) => makeFordModel(room, spec, { caps, ...o });
  const run = (o, sea, limit) => model(o).solve(c.k.from, sea, limit);
  // 1.
  const starts = [0, 1, 2].map(sea => run({}, sea));
  check(`${name}: solvable walking in at LOW, MID and HIGH`, starts.every(r => r && !r.gaveUp),
    starts.map(r => (r ? (r.gaveUp ? 'gave up' : r.presses) : 'none')).join(' / '));
  const best = starts[0];
  let bestPresses = Infinity;
  if (best && !best.gaveUp) {
    bestPresses = best.presses;
    console.log(`       from LOW (${best.presses} presses, ${best.moves} moves, ${best.states} states): ${describeFord(best)}`);
    // 2.
    const seas = [...new Set([0, ...best.steps.filter(s => s.conch != null).map(s => s.conch)])].sort();
    check(`${name}: the fewest-press solution sounds the conch for ${c.k.seas.join('/')}`,
      JSON.stringify(seas) === JSON.stringify([...c.k.seas].sort()), JSON.stringify(seas));
    solutions.push({ c, best, name });
  }
  for (const sea of [0, 1, 2]) {
    const r = run({ fixedSea: sea }, sea);
    check(`${name}: not with the sea held at ${SEA[sea]}`, !r || r.gaveUp, r && !r.gaveUp ? describeFord(r) : '');
  }
  // 3.
  {
    const r = [0, 1, 2].map(sea => run({ noStakes: true }, sea)).find(r => r && !r.gaveUp);
    check(`${name}: not with no stake grown`, !r, r ? describeFord(r) : '');
  }
  // 4.
  for (const w of c.k.without || []) {
    const r = [0, 1, 2].map(sea => run({ [w]: true }, sea)).find(r => r && !r.gaveUp);
    check(`${name}: not ${({ pillarSoft: 'if a pillar never stopped anything', statueWades: 'if the statue waded',
      noFall: 'if a block on a hole stayed', noAnchor: 'without the Anchor' })[w] || w}`, !r, r ? describeFord(r) : '');
  }
  // 5.
  if (!FAST && !ENGINE) {
    // Near the puzzle: within four tiles of a stake, a block, a statue, a
    // plate, the snarl or the Anchor. A pillar further off is only a wall at
    // MID in open floor, which can take a way from Link but give him none.
    const near = [...(spec.stakes || []), ...(spec.blocks || []), ...(spec.ice || []), ...(spec.statues || []),
      ...(spec.plates || []).map(p => [p.x, p.y]), ...(spec.cut ? [spec.cut.snarl] : []),
      ...(spec.anchor ? [spec.anchor.at] : [])];
    const cells = model().seedCells(c.k.from).filter(([x, y]) => !(c.spec.stakes || []).some(s => s[0] === x && s[1] === y)
      && near.some(([nx, ny]) => Math.max(Math.abs(nx - x), Math.abs(ny - y)) <= 4));
    const bad = [];
    for (const cell of cells) {
      const m = model({ stray: [cell] });
      const r = m.solve(c.k.from, 0, 150000);
      if (r && !r.gaveUp && r.presses < bestPresses) bad.push(`${cell}: ${r.presses} presses`);
      for (const sea of [0, 1, 2]) {
        const f = model({ stray: [cell], fixedSea: sea }).solve(c.k.from, sea, 150000);
        if (f && !f.gaveUp) bad.push(`${cell}: solved at ${SEA[sea]} alone`);
      }
    }
    check(`${name}: no stray pillar (${cells.length} cells a seed reaches) saves a press or solves it at one sea`,
      bad.length === 0, bad.slice(0, 4).join('; '));
  }
  // 6.
  if (!FAST && !ENGINE) {
    const states = [];
    const m = makeFordModel(room, { ...spec, plates: [{ x: -1, y: -1 }], cut: null }, {
      caps, visit: (s) => states.push(s) });
    for (const sea of [0, 1, 2]) m.solve(c.k.from, sea, 60000);
    let stuck = null;
    for (const s of states) if (!m.canLeave(s, c.k.from, c.k.trapDepth || 3)) { stuck = s; break; }
    check(`${name}: no reachable state shuts Link in (${states.length} states)`, !stuck, stuck ? JSON.stringify(stuck) : '');
  }
}

// 7, 8. In the engine.
if (!MOCK && solutions.length && !FAST) {
  const { chromium } = await import('playwright');
  const { installRuntime } = await import('./actor-runtime.mjs');
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
  await page.goto(`http://localhost:${server.address().port}/index.html`);
  await page.waitForFunction(() => window.__game && window.__harness);
  await page.evaluate(installRuntime);
  if (process.env.FORD_DEBUG) await page.evaluate(() => { globalThis.__FORD_DEBUG = true; });
  // 7. The model's solution, played as a player plays it: walk, throw, lean,
  // sound the conch, drop the Anchor. Every stake must come up where the
  // model said, and the room must pay out — and still be solved after a load.
  for (const { c, best, name } of solutions) {
    const [f, rx, ry] = c.key.split(',').map(Number);
    const plan = [['wait', 4], ['equip', 'conch', 'B', 400]];
    const stakes = [];
    for (const st of best.steps) {
      if (st.conch != null) plan.push(['goto', st.from[0], st.from[1], 1500], ['tide', st.conch, 140, 900]);
      else if (st.throw) {
        plan.push(['equip', 'reefseed', 'A', 400], ['sow', st.from[0], st.from[1], st.throw, 400]);
        stakes.push(st.at);
      } else if (st.anchor) plan.push(['equip', 'anchor', 'A', 400], ['anchor', c.k.anchor.at[0], c.k.anchor.at[1], 1600]);
      else if (st.recall) plan.push(['unanchor', 200]);
      else if (st.kind === 'ice') plan.push(['goto', st.from[0], st.from[1], 1500, 'skate'], ['ice', st.push]);
      // One push per lean: PUSH_DELAY_FRAMES and a few to spare (the route's rule).
      else plan.push(['goto', st.from[0], st.from[1], 1500], ['wait', 6], ['hold', [st.push], 40], ['wait', 30]);
    }
    if (c.k.cut) {
      const [sx, sy] = c.k.cutFrom, [nx, ny] = c.k.cut;
      const dir = nx > sx ? 'right' : nx < sx ? 'left' : ny > sy ? 'down' : 'up';
      plan.push(['equip', 'sword', 'A', 400], ['goto', sx, sy, 1500], ['wait', 20], ['hold', [dir], 20], ['tap', 'a', 60], ['wait', 60]);
    }
    plan.push(['wait', 30]);
    const flag = !c.k.cut && c.def.puzzle && c.def.puzzle.flag;
    const setup = {
      seed: 20261025, items: { sword: 1, conch: 1, cleats: 1, reefseed: 1, anchor: 1 }, equipA: 'reefseed', equipB: 'conch',
      maxHearts: 24, hearts: 24, tide: 0,
      enter: [c.mapId, f, rx, ry, c.k.from[0] * 16, c.k.from[1] * 16, 'down'],
    };
    const r = await page.evaluate(async ([setup, plan, flag, stakes, cut, key]) => {
      window.__rp.beginRecord(setup, plan);
      const g = window.__game;
      for (let i = 0; i < 4; i++) window.__rp.pump(1);
      for (const e of g.entities) if (e.isEnemy) e.remove = true;
      g.enemiesOff = true;
      g.player.invuln = 1e6;
      let err = null;
      try { for (let n = 0; n < 900 && !window.__rp.pump(100).done; n++); } catch (e) { err = String(e && e.message || e); }
      const grown = stakes.filter(([x, y]) => g.room.baseName(x, y) === 'coralPillar').length;
      let paid = !!(flag ? (g.room._puzzleDone && g.progress.flags[flag]) : true);
      // A snarl is cut by facing it from the stake and swinging.
      if (cut) paid = !g.room.solidAt(cut[0] * 16 + 8, cut[1] * 16 + 8, g.tide, { jumping: false, swim: true, cutting: false });
      const out = { err, paid, grown, trace: window.__rp._trace.slice(-3), tide: g.tide.level };
      if (globalThis.__FORD_DEBUG) out.full = window.__rp._trace.map(t => `${t.step}:${t.kind}@${Math.round(t.x / 16)},${Math.round(t.y / 16)} t${t.tide}`).join(' ');
      if (globalThis.__FORD_DEBUG) out.pillars = (() => { const a = []; for (let y = 0; y < g.room.th; y++) for (let x = 0; x < g.room.tw; x++) if (g.room.baseName(x, y) === 'coralPillar') a.push(x + ',' + y); return a; })();
      if (globalThis.__FORD_DEBUG) out.blocks = g.entities.filter(e => e.pushable !== undefined || e.solid).map(e => (e.constructor.name) + Math.round(e.x / 16) + ',' + Math.round(e.y / 16));
      if (flag) {
        const save = JSON.parse(JSON.stringify(g.progress));
        const { resetRooms } = await import('/src/world/maps.js');
        resetRooms();
        g.progress = save;
        const [m, fl, x, y] = key;
        g.enterMap(m, fl, x, y, setup.enter[4], setup.enter[5], 'down', { instant: true });
        for (let i = 0; i < 6; i++) window.__harness.step(1);
        out.reloaded = !!g.room._puzzleDone;
      } else out.reloaded = true;
      return out;
    }, [setup, plan, flag, stakes, c.k.cut || null, [c.mapId, f, rx, ry]]);
    check(`${name}: played in the engine, every stake comes up where the model said (${r.grown}/${stakes.length})`,
      !r.err && r.grown === stakes.length, JSON.stringify(r));
    check(`${name}: and the room is answered${c.k.cut ? ' — the snarl, cut from the stake, is open' : ', the puzzle pays out'}`,
      !r.err && r.paid, JSON.stringify(r));
    check(`${name}: walked back into after a load, it is still solved`, r.reloaded);
  }

  // 8. The rules the rooms stand on, in a probe room: a pillar at MID stops a
  // seed (it grows at its foot) and at LOW and HIGH does not; it stops an ice
  // block at MID only; a statue walks onto it at LOW only; and a push block
  // left on a drain goes down it when the sea goes out from under it, and
  // comes back with the room.
  {
    const grid = [
      '###############', '#.............#', '#.............#', '#.............#', '#.............#',
      '#.............#', '#.............#', '#.............#', '#...4.........#', '#.............#', '###############'];
    const r = await page.evaluate(async ([grid]) => {
      const g = window.__game;
      window.__harness.takeOver();
      const { registerMap, MAPS, resetRooms } = await import('/src/world/maps.js');
      const items = await import('/src/game/items.js');
      const { Statue, IceBlock, PushBlock } = await import('/src/game/objects.js');
      const plain = (e) => e instanceof PushBlock && !(e instanceof Statue) && !(e instanceof IceBlock);
      const { sp } = await import('/src/core/fixed.js');
      if (!MAPS.get('mock_fordprobe')) registerMap({ id: 'mock_fordprobe', kind: 'dungeon', name: 'Mock', w: 3, h: 3, floors: 1,
        cell: [15, 11], legend: 'dungeonWood', tint: 'cave', music: 'dungeon5', dungeon: { index: 5 },
        rooms: { '0,0,0': { name: 'probe', map: grid, entities: [['iceblock', 2, 3], ['statue', 9, 5], ['block', 6, 8, { once: false }]] } } });
      const enter = (sea) => {
        resetRooms();
        g.tide.clearOverrides();
        g.tide.setLevel(sea, { instant: true });
        g.enterMap('mock_fordprobe', 0, 0, 0, 16, 16, 'down', { instant: true });
        for (let i = 0; i < 3; i++) window.__harness.step(1);
        g.player.invuln = 1e6;
      };
      const out = {};
      // The seed: a pillar at 6,1, Link at 8,1 throwing left (a throw lands two tiles off). Where does it grow?
      for (const sea of [0, 1, 2]) {
        enter(sea);
        g.room.setTile(6, 1, 'coralPillar');
        g.player.x = 8 * 16; g.player.y = 16; g.player.dir = 'left';
        const seed = new items.Reefseed(8 * 16 - 6, 16, { dir: 'left' });
        g.addEntity(seed);
        for (let i = 0; i < 400 && !seed.remove; i++) window.__harness.step(1);
        const at = [];
        for (let x = 1; x < 14; x++) if (x !== 6 && g.room.baseName(x, 1) === 'coralPillar') at.push(x);
        out['seed' + sea] = at;
      }
      // The ice: pillar at 10,3, block at 2,3 pushed right.
      for (const sea of [0, 1, 2]) {
        enter(sea);
        g.room.setTile(10, 3, 'coralPillar');
        const b = g.entities.find(e => e.isIceBlock);
        g.player.x = 16; g.player.y = 3 * 16;
        b.push(g, 1, 0);
        for (let i = 0; i < 300 && b.slide; i++) b.update(g);
        out['ice' + sea] = Math.round(b.x / 16);
      }
      // The statue: pillar at 8,5, the block at 4,8 pushed right moves the statue left.
      for (const sea of [0, 1, 2]) {
        enter(sea);
        g.room.setTile(8, 5, 'coralPillar');
        const t = g.entities.find(e => e instanceof Statue);
        const b = g.entities.find(plain);
        if (!b || !t) { out['statue' + sea] = 'missing ' + g.entities.map(e => e.constructor.name).join(','); continue; }
        g.player.x = 3 * 16; g.player.y = 8 * 16;
        b.fx = sp(6 * 16); b.fy = sp(8 * 16);
        g.player.x = 5 * 16;
        b.push(g, 1, 0);
        for (let i = 0; i < 60; i++) window.__harness.step(1);
        out['statue' + sea] = Math.round(t.x / 16);
      }
      // The block on the drain: at MID push it from 3,8 onto 4,8 (it starts
      // there), then the sea goes out.
      enter(1);
      const b = g.entities.find(plain);
      b.fx = sp(4 * 16); b.fy = sp(8 * 16);
      for (let i = 0; i < 4; i++) window.__harness.step(1);
      out.drainMid = !b.remove;
      g.tide.setLevel(0, { instant: true });
      for (let i = 0; i < 4; i++) window.__harness.step(1);
      out.drainLow = !!b.remove;
      enter(1);
      const back = g.entities.find(plain);
      out.back = back ? [Math.round(back.x / 16), Math.round(back.y / 16)] : null;
      return out;
    }, [grid]);
    check('a pillar at MID catches a seed: it grows at its foot (7,1), short of where it was going', JSON.stringify(r.seed1) === '[7]', JSON.stringify(r.seed1));
    check('at LOW and HIGH the seed flies on over it (and comes down on the pillar, where nothing grows)', !r.seed0.includes(7) && !r.seed2.includes(7), JSON.stringify([r.seed0, r.seed2]));
    check('an ice block stops against a pillar at MID only', r.ice1 === 9 && r.ice0 === 13 && r.ice2 === 13, JSON.stringify([r.ice0, r.ice1, r.ice2]));
    check('a statue steps onto a pillar at LOW only', r.statue0 === 8 && r.statue1 === 9 && r.statue2 === 9, JSON.stringify([r.statue0, r.statue1, r.statue2]));
    check('a push block left on a drain goes down it when the sea goes out', r.drainMid && r.drainLow, JSON.stringify(r));
    check('and comes back to its place with the room', r.back && r.back[0] === 6 && r.back[1] === 8, JSON.stringify(r.back));
  }
  await browser.close(); server.close();
}

console.log(`\n=== ${pass} passed, ${fail.length} failed ===`);
process.exit(fail.length ? 1 : 0);
