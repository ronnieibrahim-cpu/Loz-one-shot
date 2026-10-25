// THE ICE BLOCKS (S209, docs/briefs/PUZZLE-PASS.md step 7: kind A, hard, with
// ice, in the Abyssal Keep). Seasons' pushable ice block ($2f, the Sword &
// Shield Maze's room $586, pushblock.s state 2): pushed, it slides until the
// square ahead will not take it. Ours, with the sea (objects.js IceBlock and
// `iceBlockMeets`): a hole takes it down, wading water catches it, deep water
// it floats over. Every room declaring
//
//   iceRoom: { from: [x, y], seas: [..] }
//
// holds ice blocks (`['iceblock', x, y]`) and a puzzle whose `blocks` are its
// plates. Proved by the model (tools/lib/iceblock-flood.mjs, the engine's own
// collision and `iceBlockMeets`) and then in the engine:
//
//   1. it can be solved walking in from `from` at every sea;
//   2. no single sea solves it, and the fewest-press solution from LOW sounds
//      the conch for exactly `seas`;
//   3. it takes more pushes than there are blocks; it cannot be solved if
//      the water never caught or took the block (the sea decides the
//      stretches), nor if it moved one square a push (the slide is the
//      puzzle);
//   4. no reachable state shuts Link in: from every one he can still get back
//      to `from`, walking or within a few pushes or presses;
//   5. in the engine, the solution played as directives — walk behind the
//      block, lean on it, sound the conch — pays out the puzzle, every block
//      ends where the model said, and a load brings the room back solved;
//   6. in the engine, one block: pushed over dry floor it slides at
//      ICE_BLOCK_SPEED and clinks against what stops it; into wading water it
//      stops in the first square; over deep water it slides on; onto a hole it
//      goes down and comes back to its place when the room is left; and left
//      on a square the sea opens into a hole, it goes down.
//
// Usage: node tools/check-iceblocks.mjs
//        node tools/check-iceblocks.mjs --mock spec.json   (model only: spec
//        { legend, rooms: { name: grid }, claims: { name: { from, seas,
//        blocks: [[x, y]], plates: [{ x, y }], walls?: [[x, y]] } } })
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { installData } from '../src/data/index.js';
import { MAPS, getRoom, registerMap } from '../src/world/maps.js';
import { capsForDungeonIndex } from './lib/collision.mjs';
import { makeIceModel, describeIce } from './lib/iceblock-flood.mjs';

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
    const k = spec.claims[name];
    if (!k || !k.blocks) continue;
    const id = 'mock_' + name;
    registerMap({ id, kind: 'dungeon', name: 'Mock', w: 3, h: 3, floors: 1, cell: [15, 11], legend: k.legend || spec.legend,
      dungeon: { index: 6 }, rooms: { '0,0,0': { name, map: grid } } });
    CLAIMS.push({ mapId: id, key: '0,0,0', def: { name }, k, spec: k, index: 6 });
  }
} else {
  for (const [mapId, m] of MAPS) {
    for (const [key, def] of Object.entries(m.roomDefs || {})) {
      const ents = def.entities || [];
      const has = ents.some(e => e[0] === 'iceblock');
      if (!def.iceRoom) {
        // An ice block in a stake puzzle is check-fords.mjs's (S210).
        if (has && !def.fordRoom) check(`${mapId} ${key} (${def.name}): holds an ice block and claims it`, false, 'no iceRoom');
        continue;
      }
      const spec = {
        blocks: ents.filter(e => e[0] === 'iceblock').map(e => [e[1], e[2]]),
        plates: ((def.puzzle && def.puzzle.blocks) || []).map(([x, y]) => ({ x, y })),
        // What stands in the room while it is being solved: a chest that waits
        // on the puzzle's own flag is not there yet.
        walls: ents.filter(e => ['block', 'chest', 'torch', 'sign', 'statue', 'cube'].includes(e[0])
          && !(e[3] && def.puzzle && e[3].needFlag === def.puzzle.flag)).map(e => [e[1], e[2]]),
      };
      CLAIMS.push({ mapId, key, def, k: def.iceRoom, spec, index: m.dungeon ? m.dungeon.index : 0 });
    }
  }
  check('at least one room claims ice blocks', CLAIMS.length > 0);
}

const solutions = [];
for (const c of CLAIMS) {
  const name = `${c.mapId} ${c.key} (${c.def.name})`;
  const room = getRoom(c.mapId, ...c.key.split(',').map(Number));
  const caps = capsForDungeonIndex(c.index);
  check(`${name}: has an ice block and a plate for each`, c.spec.blocks.length > 0
    && c.spec.plates.length > 0 && c.spec.plates.length <= c.spec.blocks.length);
  const run = (o, sea) => makeIceModel(room, c.spec, { caps, ...o }).solve(c.k.from, sea);
  // 1.
  const starts = [0, 1, 2].map(sea => run({}, sea));
  check(`${name}: solvable walking in at LOW, MID and HIGH`, starts.every(r => r && !r.gaveUp),
    starts.map(r => (r ? (r.gaveUp ? 'gave up' : r.presses) : 'none')).join(' / '));
  const best = starts[0];
  if (best && !best.gaveUp) {
    console.log(`       from LOW (${best.presses} presses, ${best.moves} pushes): ${describeIce(best)}`);
    // 2.
    const seas = [...new Set([0, ...best.steps.filter(s => s.conch != null).map(s => s.conch)])].sort();
    check(`${name}: the fewest-press solution sounds the conch for ${c.k.seas.join('/')}`,
      JSON.stringify(seas) === JSON.stringify([...c.k.seas].sort()), JSON.stringify(seas));
    // 3.
    check(`${name}: it takes more pushes than there are blocks`, best.moves > c.spec.blocks.length, String(best.moves));
    solutions.push({ c, best, name });
  }
  for (const sea of [0, 1, 2]) {
    check(`${name}: not with the sea held at ${['LOW', 'MID', 'HIGH'][sea]}`, !run({ fixedSea: sea }, sea));
  }
  check(`${name}: not if the water never caught or took the block`, !run({ dry: true }, 0));
  check(`${name}: not if it moved one square a push`, !run({ once: true }, 0));
  // 4.
  {
    const states = [];
    const m = makeIceModel(room, { ...c.spec, plates: [{ x: -1, y: -1 }] }, { caps, visit: (s) => states.push(s) });
    for (const sea of [0, 1, 2]) m.solve(c.k.from, sea, 100000);
    let stuck = null;
    for (const s of states) if (!m.canLeave(s, c.k.from)) { stuck = s; break; }
    check(`${name}: no reachable state shuts Link in (${states.length} states)`, !stuck,
      stuck && `Link at ${stuck.lx},${stuck.ly}, blocks ${JSON.stringify(stuck.b)}, sea ${stuck.sea}`);
  }
}

// 5, 6. In the engine.
if (!MOCK && solutions.length) {
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
  for (const { c, best, name } of solutions) {
    const [f, rx, ry] = c.key.split(',').map(Number);
    // 5. The solution as directives.
    const plan = [['wait', 4]];
    for (const st of best.steps) {
      if (st.conch != null) plan.push(['tide', st.conch]);
      else plan.push(['goto', st.from[0], st.from[1], 900, 'skate'], ['ice', st.push]);
    }
    plan.push(['wait', 30]);
    const flag = c.def.puzzle && c.def.puzzle.flag;
    const setup = {
      seed: 20261025, items: { sword: 1, conch: 1, cleats: 1 }, equipA: 'conch', equipB: 'sword',
      maxHearts: 24, hearts: 24, tide: 0,
      enter: [c.mapId, f, rx, ry, c.k.from[0] * 16, c.k.from[1] * 16, c.k.from[0] === 0 ? 'right' : 'up'],
    };
    const want = best.steps[best.steps.length - 1].state.b.filter(Boolean);
    const r = await page.evaluate(async ([setup, plan, flag, want, key]) => {
      window.__rp.beginRecord(setup, plan);
      const g = window.__game;
      for (let i = 0; i < 4; i++) window.__rp.pump(1);
      for (const e of g.entities) if (e.isEnemy) e.remove = true;
      g.player.invuln = 1e6;
      let err = null;
      try { for (let n = 0; n < 600 && !window.__rp.pump(100).done; n++); } catch (e) { err = String(e && e.message || e); }
      const at = () => g.entities.filter(e => e.isIceBlock && !e.remove).map(e => [Math.round(e.x / 16), Math.round(e.y / 16)]);
      const blocks = at();
      const out = {
        err, paid: !!(g.room._puzzleDone && (!flag || g.progress.flags[flag])), blocks,
        home: want.every(([x, y]) => blocks.some(a => a[0] === x && a[1] === y)),
        trace: window.__rp._trace.slice(-3),
      };
      // ... and a load brings the room back solved, blocks on the plates.
      const save = JSON.parse(JSON.stringify(g.progress));
      const { resetRooms } = await import('/src/world/maps.js');
      resetRooms();
      g.progress = save;
      const [m, fl, x, y] = key;
      g.enterMap(m, fl, x, y, setup.enter[4], setup.enter[5], 'up', { instant: true });
      for (let i = 0; i < 6; i++) window.__harness.step(1);
      const back = at();
      out.reloaded = want.every(([x, y]) => back.some(a => a[0] === x && a[1] === y)) && !!g.room._puzzleDone;
      out.back = back;
      return out;
    }, [setup, plan, flag, want, [c.mapId, f, rx, ry]]);
    check(`${name}: played in the engine, the solution puts every ice block on its plate and pays out`,
      !r.err && r.paid && r.home, JSON.stringify(r));
    check(`${name}: walked back into after a load, it is still solved, blocks on the plates`, r.reloaded, JSON.stringify(r.back));
  }

  // 6. One block, in a room of every kind of square. Row 5 from x=2 east:
  // floor, then a well (`3`) at 6, a sluice (`1`) at 9, a drain (`4`) at 12.
  {
    const { registerMap } = await import('../src/world/maps.js');
    const grid = [
      '###############', '#.............#', '#.............#', '#.............#', '#.............#',
      '#.....3..1..4.#', '#.............#', '#.............#', '#.............#', '#.............#', '###############'];
    const r = await page.evaluate(async ([grid]) => {
      const g = window.__game;
      window.__harness.takeOver();
      const { registerMap, MAPS } = await import('/src/world/maps.js');
      const feel = await import('/src/data/feel.js');
      const { sp } = await import('/src/core/fixed.js');
      if (!MAPS.get('mock_iceprobe')) registerMap({ id: 'mock_iceprobe', kind: 'dungeon', name: 'Mock', w: 3, h: 3, floors: 1,
        cell: [15, 11], legend: 'dungeonAbyss', tint: 'cave', music: 'dungeon6', dungeon: { index: 6 },
        rooms: { '0,0,0': { name: 'probe', map: grid, entities: [['iceblock', 2, 5]] } } });
      const out = {};
      const run = (sea, startX = 2, dx = 1) => {
        g.tide.clearOverrides();
        g.tide.setLevel(sea, { instant: true });
        g.enterMap('mock_iceprobe', 0, 0, 0, 16, 144, 'up', { instant: true });
        for (let i = 0; i < 3; i++) window.__harness.step(1);
        const b = g.entities.find(e => e.isIceBlock);
        b.fx = sp(startX * 16); b.fy = sp(5 * 16);
        g.player.x = 16; g.player.y = 144;
        const x0 = b.x, sounds = [];
        const orig = g.audio.sfx.bind(g.audio);
        g.audio.sfx = (n, ...r) => { sounds.push(n); return orig(n, ...r); };
        const ok = b.push(g, dx, 0);
        const xs = [];
        for (let i = 0; i < 200 && b.slide && !b.remove; i++) { b.update(g); xs.push(b.fx); }
        g.audio.sfx = orig;
        return { ok, x0, xs, at: Math.round(b.x / 16), gone: !!b.remove, sounds, b };
      };
      // At HIGH every pool is deep: it slides the whole row to the ring.
      const h = run(2);
      out.high = { at: h.at, gone: h.gone, speed: (h.xs[1] - h.xs[0]) / 256, clink: h.sounds.includes('block') };
      out.speedWant = feel.ICE_BLOCK_SPEED / 256;
      // At LOW the well is wading water: it stops in it.
      const l = run(0);
      out.low = { at: l.at, gone: l.gone, splash: l.sounds.includes('splash') };
      // At MID the well is deep and the sluice wading: it floats over one, stops in the other.
      const m = run(1);
      out.mid = { at: m.at, gone: m.gone };
      // At LOW from past the sluice (dry floor) it slides into the drain's hole.
      const d = run(0, 10);
      out.drain = { gone: d.gone };
      // And comes back with the room.
      g.enterMap('mock_iceprobe', 0, 0, 0, 16, 144, 'up', { instant: true });
      for (let i = 0; i < 3; i++) window.__harness.step(1);
      const back = g.entities.find(e => e.isIceBlock);
      out.back = back ? [Math.round(back.x / 16), Math.round(back.y / 16)] : null;
      // Left resting on the drain at MID (wading), the sea going out takes it down.
      const m2 = run(1, 10);
      const b2 = m2.b;
      out.restMid = { at: m2.at, gone: m2.gone };
      g.tide.setLevel(0, { instant: true });
      for (let i = 0; i < 3; i++) window.__harness.step(1);
      out.restLow = { gone: !!b2.remove };
      // With Link swimming, it will not be pushed.
      g.tide.setLevel(2, { instant: true });
      g.enterMap('mock_iceprobe', 0, 0, 0, 16, 144, 'up', { instant: true });
      for (let i = 0; i < 3; i++) window.__harness.step(1);
      const b3 = g.entities.find(e => e.isIceBlock);
      g.player.inDeep = true;
      out.swim = b3.push(g, 1, 0);
      g.player.inDeep = false;
      return out;
    }, [grid]);
    check('an ice block over dry floor and deep water slides to the ring and clinks', r.high.at === 13 && !r.high.gone && r.high.clink, JSON.stringify(r.high));
    check('it slides at ICE_BLOCK_SPEED (SPEED_1c0)', r.high.speed === r.speedWant, `${r.high.speed} px/f, want ${r.speedWant}`);
    check('wading water catches it in the first wading square (the well at LOW)', r.low.at === 6 && !r.low.gone && r.low.splash, JSON.stringify(r.low));
    check('deep water it floats over, wading water catches it (MID: over the well, into the sluice)', r.mid.at === 9 && !r.mid.gone, JSON.stringify(r.mid));
    check('an open hole takes it down (the drain at LOW)', r.drain.gone, JSON.stringify(r.drain));
    check('it comes back to its place when the room is entered again', r.back && r.back[0] === 2 && r.back[1] === 5, JSON.stringify(r.back));
    check('left caught in a drain, the sea going out takes it down', r.restMid.at === 12 && !r.restMid.gone && r.restLow.gone, JSON.stringify([r.restMid, r.restLow]));
    check('Link swimming cannot shove it', r.swim === false);
  }
  await browser.close(); server.close();
}

console.log(`\ncheck-iceblocks: ${pass} passed, ${fail.length} failed`);
process.exit(fail.length ? 1 : 0);
