// THE COLOUR CUBE (S207, docs/briefs/PUZZLE-PASS.md kinds D and G; Oracle of
// Ages' coloredCube.s). Every room declaring
//
//   cubeRoom: { from: [x, y], seas: [..], bellows?, cracks? }
//
// holds one cube (`['cube', x, y, { o }]`) and coloured spots (tiles with a
// `cubeSpot`), and is proved by the model (tools/lib/cube-flood.mjs, the
// engine's own collision, tide tiles and Bellows cone) and then in the engine:
//
//   0. the model's rolls are the cartridge's: every push animation in
//      coloredCube.s @animations ends in the orientation ROLL_NS/ROLL_EW say,
//      and every orientation's top colour is @colors';
//   1. it can be solved walking in from `from` at every sea;
//   2. no single sea solves it, and the fewest-press solution from LOW sounds
//      the conch for exactly `seas`;
//   3. floating matters: with deep water tipping it like any floor, it cannot
//      be solved;
//   4. with `bellows`: it cannot be solved without the gust;
//      with `cracks`: it cannot be solved with floor that never gives way;
//   5. no reachable state strands Link: from every one he can still get back
//      to `from` — walking, or within a few moves of the cube or presses;
//   6. in the engine, the fewest-press solution played as directives — walk,
//      lean on it, blow on it, stand on a crack, sound the conch — puts the
//      cube on its spot and pays out the room's puzzle;
//   7. with `cracks`, in the engine: Link stood on one at LOW falls (hurt),
//      at HIGH drops into the sea (unhurt, swimming); nothing is saved and the
//      cracks mend when the room is left; the cube set on one at LOW goes
//      down and comes back to its start.
//
// Usage: node tools/check-cube.mjs
//        node tools/check-cube.mjs --mock spec.json   (model only: spec
//        { legend, rooms: { name: grid }, claims: { name: { from, seas, cube:
//        { x, y, o }, bellows?, cracks? } } })
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { installData } from '../src/data/index.js';
import { MAPS, getRoom, registerMap } from '../src/world/maps.js';
import { getTileDef } from '../src/world/tileset.js';
import { capsForDungeonIndex } from './lib/collision.mjs';
import { makeCubeModel, describeCube, ROLL_NS, ROLL_EW, ORIENT } from './lib/cube-flood.mjs';
import { CUBE_ANIMS, CUBE_PUSH_ANIM, CUBE_TOP } from '../src/data/sprites-cube.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
installData();

let pass = 0; const fail = [];
const check = (n, c, d) => c ? (pass++, console.log('  ok   ' + n))
  : (fail.push(n), console.log('  FAIL ' + n + (d ? ' — ' + d : '')));

// 0. The cartridge's tables.
{
  let ok = true;
  for (let o = 0; o < 6; o++) {
    // Ages' columns: up, right, down, left.
    const want = [ROLL_NS[o], ROLL_EW[o], ROLL_NS[o], ROLL_EW[o]];
    CUBE_PUSH_ANIM[o].forEach((a, d) => {
      const end = CUBE_ANIMS[a][CUBE_ANIMS[a].length - 1][2] & 0x7f;
      if (end !== want[d]) ok = false;
    });
    if (CUBE_TOP[o] !== ORIENT[o][0]) ok = false;
  }
  check('the model rolls the cube as coloredCube.s does, and reads its top colours', ok);
}

const MOCK = process.argv.includes('--mock') ? process.argv[process.argv.indexOf('--mock') + 1] : null;
const CLAIMS = [];
const spotsOf = (room) => {
  const out = [];
  for (let y = 0; y < room.th; y++) for (let x = 0; x < room.tw; x++) {
    const d = getTileDef(room.baseName(x, y));
    if (d && d.cubeSpot != null) out.push({ x, y, colour: d.cubeSpot });
  }
  return out;
};
if (MOCK) {
  const spec = JSON.parse(await readFile(MOCK, 'utf8'));
  for (const [name, grid] of Object.entries(spec.rooms)) {
    const k = spec.claims[name];
    if (!k) continue;
    const id = 'mock_' + name;
    const size = grid[0].length > 15 || grid.length > 11 ? { size: [grid[0].length / 15, grid.length / 11] } : {};
    registerMap({
      id, kind: 'dungeon', name: 'Mock', w: 3, h: 3, floors: 1, cell: [15, 11], legend: spec.legend,
      dungeon: { index: 4 }, rooms: { '0,0,0': { name, map: grid, ...size } },
    });
    CLAIMS.push({ mapId: id, key: '0,0,0', def: { name, map: grid, entities: [['cube', k.cube.x, k.cube.y, { o: k.cube.o }]] }, k, index: 4 });
  }
} else {
  for (const [mapId, m] of MAPS) {
    for (const [key, def] of Object.entries(m.roomDefs || {})) {
      const cube = (def.entities || []).find(e => e[0] === 'cube');
      if (def.cubeRoom) CLAIMS.push({ mapId, key, def, k: def.cubeRoom, index: m.dungeon ? m.dungeon.index : 0 });
      else if (cube) check(`${mapId} ${key} (${def.name}): holds a colour cube and claims it`, false, 'no cubeRoom');
    }
  }
  check('at least one room claims a colour cube', CLAIMS.length > 0);
}

const solutions = [];
for (const c of CLAIMS) {
  const name = `${c.mapId} ${c.key} (${c.def.name})`;
  const room = getRoom(c.mapId, ...c.key.split(',').map(Number));
  const caps = capsForDungeonIndex(c.index);
  const ce = c.def.entities.find(e => e[0] === 'cube');
  const cube = { x: ce[1], y: ce[2], o: (ce[3] && ce[3].o) | 0 };
  const plates = spotsOf(room);
  check(`${name}: has a spot for its cube`, plates.length > 0);
  const base = { caps, bellows: !!c.k.bellows };
  const run = (o, sea) => makeCubeModel(room, cube, plates, { ...base, ...o }).solve(c.k.from, sea);

  // 1.
  const starts = [0, 1, 2].map(sea => run({}, sea));
  check(`${name}: solvable walking in at LOW, MID and HIGH`, starts.every(r => r && !r.gaveUp),
    starts.map(r => (r ? (r.gaveUp ? 'gave up' : r.presses) : 'none')).join(' / '));
  const best = starts[0];
  if (best && !best.gaveUp) {
    console.log(`       from LOW (${best.presses} presses, ${best.moves} moves): ${describeCube(best)}`);
    // 2.
    const seas = [...new Set([0, ...best.steps.filter(s => s.conch != null).map(s => s.conch)])].sort();
    check(`${name}: the fewest-press solution sounds the conch for ${c.k.seas.join('/')}`,
      JSON.stringify(seas) === JSON.stringify([...c.k.seas].sort()), JSON.stringify(seas));
    solutions.push({ c, best, name });
  }
  for (const sea of [0, 1, 2]) {
    check(`${name}: not with the sea held at ${['LOW', 'MID', 'HIGH'][sea]}`, !run({ fixedSea: sea }, sea));
  }
  // 3, 4.
  check(`${name}: not if deep water tipped it like floor (floating matters)`, !run({ noFloat: true }, 0));
  if (c.k.bellows) check(`${name}: not without the Squall Bellows`, !run({ bellows: false }, 0));
  if (c.k.cracks) check(`${name}: not if the cracked floor never gave way`, !run({ noCrack: true }, 0));
  // 5.
  {
    const states = [];
    const m = makeCubeModel(room, cube, [{ x: -1, y: -1, colour: 0 }], { ...base, visit: (s) => states.push(s) });
    for (const sea of [0, 1, 2]) m.solve(c.k.from, sea, 200000);
    let stuck = null;
    for (const s of states) if (!m.canLeave(s, c.k.from)) { stuck = s; break; }
    check(`${name}: no reachable state strands Link (${states.length} states)`, !stuck,
      stuck && `Link at ${stuck.lx},${stuck.ly}, cube ${stuck.cx},${stuck.cy}, sea ${stuck.sea}`);
  }
}

// 6. In the engine.
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
      else if (st.stand) plan.push(['crack', st.stand[0], st.stand[1]]);
      else {
        plan.push(['goto', st.from[0], st.from[1]]);
        plan.push(st.push ? ['cube', st.push] : ['cube', st.gust, 'gust']);
      }
    }
    plan.push(['wait', 30]);
    const flag = c.def.puzzle && c.def.puzzle.flag;
    const r = await page.evaluate(async ([setup, plan, flag]) => {
      window.__rp.beginRecord(setup, plan);
      const g = window.__game;
      for (let i = 0; i < 4; i++) window.__rp.pump(1);
      for (const e of g.entities) if (e.isEnemy) e.remove = true;
      g.player.invuln = 1e6;
      let err = null;
      try { for (let n = 0; n < 400 && !window.__rp.pump(100).done; n++); } catch (e) { err = String(e && e.message || e); }
      const cube = g.entities.find(e => typeof e.restsOn === 'function');
      return {
        err, paid: !!(g.room._puzzleDone && (!flag || g.progress.flags[flag])),
        cube: cube ? [cube.tx, cube.ty, cube.o] : null, tide: g.tide.level,
        trace: window.__rp._trace.slice(-3),
      };
    }, [{
      seed: 20261024, items: { sword: 1, conch: 1, cleats: 1, bellows: 1 }, equipA: 'conch', equipB: 'bellows',
      maxHearts: 24, hearts: 24, tide: 0,
      enter: [c.mapId, f, rx, ry, c.k.from[0] * 16, c.k.from[1] * 16, 'up'],
    }, plan, flag]);
    check(`${name}: played in the engine, the solution puts the cube on its spot and pays out`,
      !r.err && r.paid, JSON.stringify(r));
  }
  // The floor that gives way, under Link and under the cube (rooms with cracks).
  for (const { c, name } of solutions.filter(x => x.c.k.cracks)) {
    const [f, rx, ry] = c.key.split(',').map(Number);
    const room = getRoom(c.mapId, f, rx, ry);
    let crack = null;
    for (let y = 0; y < room.th && !crack; y++) for (let x = 0; x < room.tw && !crack; x++) {
      if (getTileDef(room.baseName(x, y)).crack) crack = [x, y];
    }
    const r = await page.evaluate(async ([c, f, rx, ry, crack]) => {
      const g = window.__game, out = {};
      const { sp } = await import('/src/core/fixed.js');
      const enter = (sea) => {
        window.__rp.beginRecord({
          seed: 20261024, items: { sword: 1, conch: 1, cleats: 1, bellows: 1 }, equipA: 'conch', equipB: 'bellows',
          maxHearts: 24, hearts: 24, tide: sea, enter: [c.mapId, f, rx, ry, c.k.from[0] * 16, c.k.from[1] * 16, 'up'],
        }, [['wait', 4]]);
        window.__rp.pump(8);
        for (const e of g.entities) if (e.isEnemy) e.remove = true;
      };
      const stand = (sea) => {
        enter(sea);
        const p = g.player, hp = g.progress.hearts;
        p.fx = sp(crack[0] * 16 + 8 - p.w / 2); p.fy = sp(crack[1] * 16 + 16 - p.h);
        let broke = -1;
        for (let i = 0; i < 120; i++) {
          window.__harness.step(1);
          if (broke < 0 && !g.room.tile(crack[0], crack[1], g.tide).crack) broke = i;
        }
        return { broke, hurt: g.progress.hearts < hp, deep: !!p.inDeep, saved: Object.keys(g.progress.doors).some(k => k.includes(c.key)) };
      };
      out.low = stand(0);
      out.high = stand(2);
      // Leave and come back: mended.
      enter(0);
      g.breakCrack(crack[0], crack[1]);
      const broken = !g.room.tile(crack[0], crack[1], g.tide).crack;
      window.__rp.beginRecord({ seed: 1, items: { conch: 1 }, maxHearts: 24, hearts: 24, tide: 0, enter: ['d4', 0, 3, 7, 112, 128, 'up'] }, [['wait', 4]]);
      window.__rp.pump(8);
      enter(0);
      out.mended = broken && !!g.room.tile(crack[0], crack[1], g.tide).crack;
      // The cube set on a crack at LOW goes down, and comes back to its start.
      const cube = g.entities.find(e => typeof e.restsOn === 'function');
      const home = [cube.tx, cube.ty];
      cube.fx = sp(crack[0] * 16); cube.fy = sp(crack[1] * 16);
      let fell = false;
      for (let i = 0; i < 120; i++) { window.__harness.step(1); if (cube.hidden) fell = true; }
      out.cubeFell = fell; out.cubeHome = cube.tx === home[0] && cube.ty === home[1] && !cube.hidden;
      return out;
    }, [c, f, rx, ry, crack]);
    check(`${name}: stood on at LOW, a crack gives way and he falls`, r.low.broke >= 0 && r.low.hurt && !r.low.saved, JSON.stringify(r.low));
    check(`${name}: stood on at HIGH, it gives way and drops him into the sea, unhurt`, r.high.broke >= 0 && !r.high.hurt && r.high.deep, JSON.stringify(r.high));
    check(`${name}: the cracks mend when the room is left`, r.mended);
    check(`${name}: the cube on a crack at LOW goes down it and comes back to its start`, r.cubeFell && r.cubeHome, JSON.stringify(r));
  }
  await browser.close(); server.close();
}

console.log(`\ncheck-cube: ${pass} passed, ${fail.length} failed`);
process.exit(fail.length ? 1 : 0);
