// THE TIDE FLOOR (S208, docs/briefs/PUZZLE-PASS.md kind C; Ages' red and blue
// floor, toggleFloor.s / floorColorChanger.s). Every room declaring
//
//   floorRoom: { from: [x, y], seas: [..] }
//
// has red and blue floor tiles (tiledef `floorColour`) and blocks that move
// any number of times, and a puzzle `floor: true` — every tile blue. When the
// conch raises the sea, every tile the rise newly covers changes colour,
// unless a block stands on it (Game.floodFloor). Proved by the model
// (tools/lib/tidefloor-flood.mjs) and then in the engine:
//
//   1. it can be solved walking in from `from` at every sea;
//   2. no single sea solves it, and the fewest-press solution from LOW sounds
//      the conch for exactly `seas`;
//   3. the blocks matter: never moved, it cannot be solved; and if the sea
//      got under a block it could not be either;
//   4. no reachable state shuts Link in;
//   5. in the engine, the solution played as directives turns the floor blue
//      and pays out the puzzle;
//   6. in the engine: a tile under a block does not turn; a floor left
//      unsolved is back as it was drawn when the room is entered again; a
//      solved floor comes back blue after a save and a load; and a load's
//      tide change (an instant one) turns nothing.
//
// Usage: node tools/check-tidefloor.mjs
//        node tools/check-tidefloor.mjs --mock spec.json   (model only: spec
//        { legend, rooms: { name: grid }, claims: { name: { from, seas,
//        blocks: [[x, y]] } } })
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { installData } from '../src/data/index.js';
import { MAPS, getRoom, registerMap } from '../src/world/maps.js';
import { getTileDef } from '../src/world/tileset.js';
import { capsForDungeonIndex } from './lib/collision.mjs';
import { makeFloorModel } from './lib/tidefloor-flood.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
installData();

let pass = 0; const fail = [];
const check = (n, c, d) => c ? (pass++, console.log('  ok   ' + n))
  : (fail.push(n), console.log('  FAIL ' + n + (d ? ' — ' + d : '')));

const floorTiles = (room) => {
  const out = [];
  for (let y = 0; y < room.th; y++) for (let x = 0; x < room.tw; x++) {
    const d = getTileDef(room.baseName(x, y));
    if (d && d.floorColour != null) out.push({ x, y, blue: d.floorColour === 2 });
  }
  return out;
};
const MOCK = process.argv.includes('--mock') ? process.argv[process.argv.indexOf('--mock') + 1] : null;
const CLAIMS = [];
if (MOCK) {
  const spec = JSON.parse(await readFile(MOCK, 'utf8'));
  for (const [name, grid] of Object.entries(spec.rooms)) {
    const k = spec.claims[name];
    if (!k || k.statues) continue;
    const id = 'mock_' + name;
    registerMap({ id, kind: 'dungeon', name: 'Mock', w: 3, h: 3, floors: 1, cell: [15, 11], legend: spec.legend,
      dungeon: { index: 5 }, rooms: { '0,0,0': { name, map: grid } } });
    const room = getRoom(id, 0, 0, 0);
    if (!floorTiles(room).length) continue;
    CLAIMS.push({ mapId: id, key: '0,0,0', def: { name }, k, blocks: k.blocks || [], index: 5 });
  }
} else {
  for (const [mapId, m] of MAPS) {
    for (const [key, def] of Object.entries(m.roomDefs || {})) {
      const room = getRoom(mapId, ...key.split(',').map(Number));
      const tiles = room ? floorTiles(room) : [];
      if (!def.floorRoom) {
        if (tiles.length) check(`${mapId} ${key} (${def.name}): has a tide floor and claims it`, false, 'no floorRoom');
        continue;
      }
      const ents = def.entities || [];
      CLAIMS.push({ mapId, key, def, k: def.floorRoom, blocks: ents.filter(e => e[0] === 'block').map(e => [e[1], e[2]]),
        index: m.dungeon ? m.dungeon.index : 0 });
      check(`${mapId} ${key} (${def.name}): its puzzle is the floor, and its blocks move more than once`,
        !!(def.puzzle && def.puzzle.floor) && ents.filter(e => e[0] === 'block').every(e => e[3] && e[3].once === false));
    }
  }
  check('at least one room claims a tide floor', CLAIMS.length > 0);
}

const solutions = [];
for (const c of CLAIMS) {
  const name = `${c.mapId} ${c.key} (${c.def.name})`;
  const room = getRoom(c.mapId, ...c.key.split(',').map(Number));
  const caps = capsForDungeonIndex(c.index);
  const tiles = floorTiles(room);
  const run = (o, sea) => makeFloorModel(room, tiles, c.blocks, { caps, ...o }).solve(c.k.from, sea);
  // 1.
  const starts = [0, 1, 2].map(sea => run({}, sea));
  check(`${name}: solvable walking in at LOW, MID and HIGH`, starts.every(r => r && !r.gaveUp),
    starts.map(r => (r ? (r.gaveUp ? 'gave up' : r.presses) : 'none')).join(' / '));
  const best = starts[0];
  if (best && !best.gaveUp) {
    console.log(`       from LOW (${best.presses} presses, ${best.moves} pushes): `
      + best.steps.map(s => s.conch != null ? `conch ${['LOW', 'MID', 'HIGH'][s.conch]}` : `push ${s.push}@${s.from}`).join('; '));
    // 2.
    const seas = [...new Set([0, ...best.steps.filter(s => s.conch != null).map(s => s.conch)])].sort();
    check(`${name}: the fewest-press solution sounds the conch for ${c.k.seas.join('/')}`,
      JSON.stringify(seas) === JSON.stringify([...c.k.seas].sort()), JSON.stringify(seas));
    solutions.push({ c, best, name });
  }
  for (const sea of [0, 1, 2]) {
    check(`${name}: not with the sea held at ${['LOW', 'MID', 'HIGH'][sea]}`, !run({ fixedSea: sea }, sea));
  }
  // 3.
  check(`${name}: not with the blocks never moved`, !run({ still: true }, 0));
  check(`${name}: not if the sea got under a block`, !run({ noShield: true }, 0));
  // 4.
  {
    const states = [];
    const m = makeFloorModel(room, tiles, c.blocks, { caps, visit: (s) => states.push(s) });
    const never = { ...m };
    // Search the whole space (no tile ever counts as solved) by asking for a
    // floor that cannot be reached: an extra red tile off the map.
    makeFloorModel(room, [...tiles, { x: -5, y: -5, blue: false }], c.blocks, { caps, visit: (s) => states.push(s) })
      .solve(c.k.from, 0, 150000);
    let stuck = null;
    for (const s of states) if (!never.canLeave(s, c.k.from)) { stuck = s; break; }
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
    const r = await page.evaluate(async ([setup, plan, flag]) => {
      window.__rp.beginRecord(setup, plan);
      const g = window.__game;
      for (let i = 0; i < 4; i++) window.__rp.pump(1);
      for (const e of g.entities) if (e.isEnemy) e.remove = true;
      g.player.invuln = 1e6;
      let err = null;
      try { for (let n = 0; n < 400 && !window.__rp.pump(100).done; n++); } catch (e) { err = String(e && e.message || e); }
      const { floorIsBlue } = await import('/src/game/game.js');
      return { err, blue: floorIsBlue(g.room), paid: !!(g.room._puzzleDone && (!flag || g.progress.flags[flag])),
        trace: window.__rp._trace.slice(-3) };
    }, [setup, plan, flag]);
    check(`${name}: played in the engine, the solution turns the floor blue and pays out`,
      !r.err && r.blue && r.paid, JSON.stringify(r));

    // 6. Under a block; reset on re-entry; a load's instant tide; solved after a load.
    const r2 = await page.evaluate(async ([setup, flag]) => {
      const g = window.__game, out = {};
      const { getTileDef } = await import('/src/world/tileset.js');
      const enter = (tide) => {
        window.__rp.beginRecord({ ...setup, tide }, [['wait', 4]]);
        window.__rp.pump(8);
        for (const e of g.entities) if (e.isEnemy) e.remove = true;
        g.player.invuln = 1e6;
      };
      const colours = () => {
        const out = [];
        for (let y = 0; y < g.room.th; y++) for (let x = 0; x < g.room.tw; x++) {
          const d = getTileDef(g.room.baseName(x, y));
          if (d && d.floorColour != null) out.push([x, y, d.floorColour]);
        }
        return out;
      };
      enter(0);
      const start = JSON.stringify(colours());
      // A block on a tile that the next rise covers: that tile alone keeps its colour.
      const block = g.entities.find(e => e.constructor.name === 'PushBlock');
      const cs = colours();
      let target = null;
      for (const [x, y] of cs) {
        g.tide.level = 0; const a = g.room.flagsAt(x, y, g.tide.levelAt(x, y, g.room)) & 4;
        g.tide.level = 1; const b = g.room.flagsAt(x, y, g.tide.levelAt(x, y, g.room)) & 4;
        g.tide.level = 0;
        if (!a && b) { target = [x, y]; break; }
      }
      if (target && block) { block.x = target[0] * 16; block.y = target[1] * 16; block.fx = block.x * 256; block.fy = block.y * 256; }
      g.player.x = setup.enter[4]; g.player.y = setup.enter[5];
      g.tide.setLevel(1);
      for (let i = 0; i < 40; i++) window.__harness.step(1);
      const after = colours();
      out.target = target;
      out.underKept = !!target && after.find(([x, y]) => x === target[0] && y === target[1])[2] === cs.find(([x, y]) => x === target[0] && y === target[1])[2];
      out.othersTurned = after.some(([x, y, c], i) => !(x === target[0] && y === target[1]) && c !== cs[i][2]);
      // Leave and come back: as drawn.
      const [, f, rx, ry] = setup.enter, sr = g.map.dungeon.startRoom.split(',').map(Number);
      g.enterMap(setup.enter[0], f, sr[0], sr[1], 7 * 16, 8 * 16, 'up', { instant: true });
      for (let i = 0; i < 10; i++) window.__harness.step(1);
      g.tide.setLevel(0, { instant: true });
      g.enterMap(setup.enter[0], f, rx, ry, setup.enter[4], setup.enter[5], 'up', { instant: true });
      for (let i = 0; i < 10; i++) window.__harness.step(1);
      out.reset = JSON.stringify(colours()) === start;
      // An instant tide change (a load) turns nothing.
      g.tide.setLevel(1, { instant: true });
      for (let i = 0; i < 10; i++) window.__harness.step(1);
      out.instant = JSON.stringify(colours()) === start;
      // Solved (its flag in the save) and loaded: it comes back blue.
      window.__rp.beginRecord({ ...setup, tide: 0, flags: [flag] }, [['wait', 4]]);
      window.__rp.pump(10);
      out.solvedBlue = colours().every(([, , c]) => c === 2);
      return out;
    }, [setup, flag]);
    check(`${name}: a tile under a block keeps its colour while the rest turn`, r2.underKept && r2.othersTurned, JSON.stringify(r2));
    check(`${name}: left unsolved, the floor is back as it was drawn`, r2.reset, JSON.stringify(r2));
    check(`${name}: a load's instant tide change turns nothing`, r2.instant, JSON.stringify(r2));
    check(`${name}: solved, it comes back blue`, r2.solvedBlue, JSON.stringify(r2));
  }
  await browser.close(); server.close();
}

console.log(`\ncheck-tidefloor: ${pass} passed, ${fail.length} failed`);
process.exit(fail.length ? 1 : 0);
