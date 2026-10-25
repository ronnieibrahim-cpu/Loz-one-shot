// THE MIRROR STATUES (S208, docs/briefs/PUZZLE-PASS.md kind F; Seasons'
// Unicorn's Cave, unicornsCaveReverseMovingArmos.s). Every room declaring
//
//   statueRoom: { from: [x, y], seas: [..] }
//
// holds statues (`['statue', x, y]`), blocks that move any number of times
// (`once: false`) and a puzzle whose `blocks` are the plates — each held by a
// block or a statue. Proved by the model (tools/lib/statue-flood.mjs, the
// engine's own collision and STATUE_AVOID) and then in the engine:
//
//   1. it can be solved walking in from `from` at every sea;
//   2. no single sea solves it, and the fewest-press solution from LOW sounds
//      the conch for exactly `seas`;
//   3. it is not one push per block: it takes more pushes than blocks, and
//      with the statues standing still (never mirroring) it cannot be solved;
//   4. with the statues stepping into water like any floor, it cannot be
//      solved (the water's hold is the puzzle);
//   5. no reachable state shuts Link in: from every one he can still get back
//      to `from`, walking or within a few pushes or presses;
//   6. in the engine, the solution played as directives — walk behind the
//      block, lean on it, sound the conch — pays out the puzzle, and the
//      statues end on their plates;
//   7. in the engine, Link leaning on a statue does not move it.
//
// Usage: node tools/check-statues.mjs
//        node tools/check-statues.mjs --mock spec.json   (model only: spec
//        { legend, rooms: { name: grid }, claims: { name: { from, seas,
//        blocks: [[x, y]], statues: [[x, y]], plates: [{ x, y }] } } })
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { installData } from '../src/data/index.js';
import { MAPS, getRoom, registerMap } from '../src/world/maps.js';
import { capsForDungeonIndex } from './lib/collision.mjs';
import { makeStatueModel, describeStatues } from './lib/statue-flood.mjs';

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
    if (!k || !k.statues) continue;
    const id = 'mock_' + name;
    registerMap({ id, kind: 'dungeon', name: 'Mock', w: 3, h: 3, floors: 1, cell: [15, 11], legend: spec.legend,
      dungeon: { index: 5 }, rooms: { '0,0,0': { name, map: grid } } });
    CLAIMS.push({ mapId: id, key: '0,0,0', def: { name }, k, spec: k, index: 5 });
  }
} else {
  for (const [mapId, m] of MAPS) {
    for (const [key, def] of Object.entries(m.roomDefs || {})) {
      const ents = def.entities || [];
      const has = ents.some(e => e[0] === 'statue');
      if (!def.statueRoom) {
        if (has && !def.fordRoom) check(`${mapId} ${key} (${def.name}): holds a statue and claims it`, false, 'no statueRoom');
        continue;
      }
      const spec = {
        blocks: ents.filter(e => e[0] === 'block').map(e => [e[1], e[2]]),
        statues: ents.filter(e => e[0] === 'statue').map(e => [e[1], e[2]]),
        plates: ((def.puzzle && def.puzzle.blocks) || []).map(([x, y]) => ({ x, y })),
      };
      CLAIMS.push({ mapId, key, def, k: def.statueRoom, spec, index: m.dungeon ? m.dungeon.index : 0 });
      check(`${mapId} ${key} (${def.name}): its blocks all move more than once`,
        ents.filter(e => e[0] === 'block').every(e => e[3] && e[3].once === false));
    }
  }
  check('at least one room claims mirror statues', CLAIMS.length > 0);
}

const solutions = [];
for (const c of CLAIMS) {
  const name = `${c.mapId} ${c.key} (${c.def.name})`;
  const room = getRoom(c.mapId, ...c.key.split(',').map(Number));
  const caps = capsForDungeonIndex(c.index);
  check(`${name}: has a statue and a plate for everything`, c.spec.statues.length > 0
    && c.spec.plates.length >= c.spec.statues.length);
  const run = (o, sea, spec = c.spec) => makeStatueModel(room, spec, { caps, ...o }).solve(c.k.from, sea);
  // 1.
  const starts = [0, 1, 2].map(sea => run({}, sea));
  check(`${name}: solvable walking in at LOW, MID and HIGH`, starts.every(r => r && !r.gaveUp),
    starts.map(r => (r ? (r.gaveUp ? 'gave up' : r.presses) : 'none')).join(' / '));
  const best = starts[0];
  if (best && !best.gaveUp) {
    console.log(`       from LOW (${best.presses} presses, ${best.moves} pushes): ${describeStatues(best)}`);
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
  check(`${name}: not if the statues never moved`, !run({ still: true }, 0));
  // 4.
  check(`${name}: not if the statues walked into water`, !run({ wade: true }, 0));
  // 5.
  {
    const states = [];
    const m = makeStatueModel(room, { ...c.spec, plates: [{ x: -1, y: -1 }] }, { caps, visit: (s) => states.push(s) });
    for (const sea of [0, 1, 2]) m.solve(c.k.from, sea, 100000);
    let stuck = null;
    for (const s of states) if (!m.canLeave(s, c.k.from)) { stuck = s; break; }
    check(`${name}: no reachable state shuts Link in (${states.length} states)`, !stuck,
      stuck && `Link at ${stuck.lx},${stuck.ly}, blocks ${JSON.stringify(stuck.b)}, sea ${stuck.sea}`);
  }
}

// 6, 7. In the engine.
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
    const plan = [['wait', 4]];
    for (const st of best.steps) {
      if (st.conch != null) plan.push(['tide', st.conch]);
      else plan.push(['goto', st.from[0], st.from[1], 600], ['hold', [st.push], 30], ['wait', 40]);
    }
    plan.push(['wait', 30]);
    const flag = c.def.puzzle && c.def.puzzle.flag;
    const setup = {
      seed: 20261025, items: { sword: 1, conch: 1, cleats: 1 }, equipA: 'conch', equipB: 'sword',
      maxHearts: 24, hearts: 24, tide: 0,
      enter: [c.mapId, f, rx, ry, c.k.from[0] * 16, c.k.from[1] * 16, 'up'],
    };
    const r = await page.evaluate(async ([setup, plan, flag, want]) => {
      window.__rp.beginRecord(setup, plan);
      const g = window.__game;
      for (let i = 0; i < 4; i++) window.__rp.pump(1);
      for (const e of g.entities) if (e.isEnemy) e.remove = true;
      g.player.invuln = 1e6;
      let err = null;
      try { for (let n = 0; n < 400 && !window.__rp.pump(100).done; n++); } catch (e) { err = String(e && e.message || e); }
      const at = g.entities.filter(e => e.constructor.name === 'Statue').map(e => [Math.round(e.x / 16), Math.round(e.y / 16)]);
      return {
        err, paid: !!(g.room._puzzleDone && (!flag || g.progress.flags[flag])), statues: at,
        home: want.every(([x, y]) => at.some(a => a[0] === x && a[1] === y)) || null,
        trace: window.__rp._trace.slice(-3),
      };
    }, [setup, plan, flag, best.steps.length ? best.steps[best.steps.length - 1].state.t : []]);
    check(`${name}: played in the engine, the solution puts every statue on its plate and pays out`,
      !r.err && r.paid && r.home, JSON.stringify(r));
    // 7. Leaning on a statue does nothing.
    const s0 = c.spec.statues[0];
    const r2 = await page.evaluate(async ([setup, s0]) => {
      window.__rp.beginRecord(setup, [['wait', 4]]);
      const g = window.__game; window.__rp.pump(8);
      const st = g.entities.find(e => e.constructor.name === 'Statue' && Math.round(e.x / 16) === s0[0] && Math.round(e.y / 16) === s0[1]);
      const moved = [];
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ok = st.push(g, dx, dy);
        moved.push(ok || !!st.slide);
      }
      return { found: !!st, moved };
    }, [setup, s0]);
    check(`${name}: leaning on a statue does not move it`, r2.found && r2.moved.every(m => !m), JSON.stringify(r2));
  }
  await browser.close(); server.close();
}

console.log(`\ncheck-statues: ${pass} passed, ${fail.length} failed`);
process.exit(fail.length ? 1 : 0);
