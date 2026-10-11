// Float prover — the Cliffside Cistern's moving platforms (S183).
//
// A float is Oracle of Seasons' INTERAC_MOVING_PLATFORM (src/game/objects.js
// Float): a 32x32 slab that walks a path script over holes and carries Link.
// Ours runs only while its RACE carries a current — wading water at LOW, a
// current at MID and HIGH — so at LOW it stops where it is; the Squall
// Bellows' cone on its race at MID takes the race to LOW and stops it under
// the rider; at HIGH the cone leaves a current and it runs on. And, the
// cartridge's own rule, it does not move while Link plays the conch.
//
// WHAT IS PROVED, for every float in every map (found, not declared):
//
//   1. Its race is a tile with a current at MID and HIGH and none at LOW, and
//      in the real engine it moves at MID and does NOT move at LOW.
//   2. It carries a rider: Link stood on it rides with it for its whole first
//      leg, and does not fall into what is under it.
//   3. It holds still while the conch sounds (movingPlatform.s @substate1).
//
// And for every room declaring
//
//   floatRoom: { stop: [x,y], race: [x,y], board: [x,y], station | brake: L }
//
//   4. THE STOP IS THE FLOAT'S. Within the room, nothing on foot, swimming
//      or on the seafloor joins `board` to `stop`; the dungeon flood, which
//      knows floats, reaches it.
//   5a. `station`: the float waits beside `stop`, and in the engine a rider
//      boarding from `board` at MID gets off onto it without braking.
//   5b. `brake: L`: the float NEVER waits beside `stop` (its script simulated
//      for two whole cycles), so it passes without stopping; at L a rider who
//      pumps the Bellows at the race as he comes level stops it and steps off
//      onto `stop`; and at every other sea the race runs, the same pumping
//      does NOT stop it.
//
// Usage: node tools/check-floats.mjs
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { installRuntime } from './actor-runtime.mjs';
import { installData } from '../src/data/index.js';
import { MAPS, getRoom } from '../src/world/maps.js';
import { floodDungeon } from './lib/dungeon-flood.mjs';
import { tileWalkable, ROUTE_AVOID, capsForDungeonIndex } from './lib/collision.mjs';
import { floatSweep, FLOAT_DIRS } from '../src/game/float-path.js';
import { FLOAT_SPEED } from '../src/data/feel.js';

installData();
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) { pass++; console.log('  ok   ' + msg); } else { fail++; console.log('  FAIL ' + msg); } };

// Every float in the world, and every room claim.
const floats = [], claims = [];
for (const m of MAPS.values()) {
  for (const [rk, def] of Object.entries(m.roomDefs || {})) {
    (def.entities || []).forEach((e, i) => { if (e[0] === 'float') floats.push({ map: m.id, rk, e, i }); });
    if (def.floatRoom) claims.push({ map: m.id, rk, def, c: def.floatRoom });
  }
}
ok(floats.length > 0, `found ${floats.length} floats and ${claims.length} float-room claims`);

// 1 (data half): the race runs at MID and HIGH and not at LOW.
for (const f of floats) {
  const [fl, rx, ry] = f.rk.split(',').map(Number);
  const room = getRoom(f.map, fl, rx, ry);
  const r = (f.e[3] || {}).race;
  ok(r && !room.tile(r[0], r[1], 0).push && room.tile(r[0], r[1], 1).push && room.tile(r[0], r[1], 2).push,
    `${f.map} ${f.rk} float ${f.i}: its race ${r} is still at LOW and runs at MID and HIGH`);
}

// 4: the stop is reached only by a float — within its own room, from the
// side it is boarded from (a station may also be a doorway, as the Weir's is).
const CAPS = capsForDungeonIndex(4);
for (const cl of claims) {
  const [fl, rx, ry] = cl.rk.split(',').map(Number);
  const room = getRoom(cl.map, fl, rx, ry);
  const walk = (x, y) => [0, 1, 2].some(t => tileWalkable(room, x, y, t, CAPS, ROUTE_AVOID));
  const seen = new Set([cl.c.board.join(',')]), q = [cl.c.board];
  while (q.length) {
    const [x, y] = q.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
      if (nx < 1 || ny < 1 || nx >= room.tw - 1 || ny >= room.th - 1 || seen.has(k) || !walk(nx, ny)) continue;
      seen.add(k); q.push([nx, ny]);
    }
  }
  ok(!seen.has(cl.c.stop.join(',')), `${cl.map} ${cl.rk}: on foot, swimming or on the seafloor, nothing in the room joins ${cl.c.board} to ${cl.c.stop}`);
  ok(floodDungeon(cl.map).seen.has(`${cl.rk}:${cl.c.stop[0]},${cl.c.stop[1]}`), `${cl.map} ${cl.rk}: the dungeon flood, which knows floats, reaches ${cl.c.stop}`);
}

// 5b (script half): a braked stop is never one of the float's waits.
const beside = (fx, fy, [sx, sy]) => fx - 16 <= sx * 16 && sx * 16 <= fx + 32 && fy - 16 <= sy * 16 && sy * 16 <= fy + 32;
for (const cl of claims) {
  const fe = (cl.def.entities || []).find(e => e[0] === 'float');
  let x = fe[1] * 16 * 256, y = fe[2] * 16 * 256, waitsBeside = false;
  const path = (fe[3] || {}).path || [];
  for (let rep = 0; rep < 2; rep++) {
    for (const [op, arg] of path) {
      if (op === 'wait' && beside(Math.floor(x / 256), Math.floor(y / 256), cl.c.stop)) waitsBeside = true;
      const d = FLOAT_DIRS[op];
      if (d) { x += d[0] * FLOAT_SPEED * arg; y += d[1] * FLOAT_SPEED * arg; }
    }
  }
  if (cl.c.station) ok(waitsBeside, `${cl.map} ${cl.rk}: the float waits beside ${cl.c.stop}`);
  else ok(!waitsBeside, `${cl.map} ${cl.rk}: the float never waits beside ${cl.c.stop} — it has to be stopped`);
}

// The engine half.
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
page.on('pageerror', e => { fail++; console.log('  FAIL page error: ' + e.message); });
await page.goto(`http://localhost:${server.address().port}/index.html?seed=20260806`);
await page.waitForFunction(() => !!window.__game && !!window.__harness);
await page.evaluate(installRuntime);

const setup = (map, rk, tide, tx, ty) => {
  const [f, rx, ry] = rk.split(',').map(Number);
  return {
    seed: 20260806, godMode: true, items: { sword: 1, conch: 1, bellows: 1, cleats: 1 },
    equipA: 'bellows', equipB: 'conch', maxHearts: 40, hearts: 40, tide,
    enter: [map, f, rx, ry, tx * 16, ty * 16, 'down'],
  };
};
// Run route directives in one room with its enemies cleared; returns the
// error text or null, and where the player ended.
async function run(st, steps) {
  await page.evaluate(([s, p]) => {
    window.__rp.beginRecord(s, p);
    for (const e of window.__game.entities) if (e.isEnemy) e.remove = true;
  }, [st, steps]);
  let r, err = null;
  for (let i = 0; i < 2000; i++) {
    try { r = await page.evaluate(n => window.__rp.pump(n), 50); } catch (e) { err = e.message.split('\n')[0]; break; }
    if (r.done || r.error) { if (r.error) err = r.error; break; }
  }
  const at = await page.evaluate(() => { const p = window.__game.player; return { tx: Math.floor(p.cx / 16), ty: Math.floor(p.cy / 16), falls: p.falling > 0 }; });
  return { err, at };
}

for (const f of floats) {
  const fe = f.e;
  // 1, 2, 3 in the engine: stand Link on the float and step the game.
  const res = await page.evaluate(async ([st, idx]) => {
    const out = {};
    for (const tide of [0, 1]) {
      window.__rp.beginRecord(st, []);
      const g = window.__game;
      g.tide.setLevel(tide, { instant: true });
      for (const e of g.entities) if (e.isEnemy) e.remove = true;
      const fl = g.entities.filter(e => e.isFloat)[idx];
      const p = g.player;
      p.x = fl.x + 8; p.y = fl.y + 8;
      const x0 = fl.x, px0 = p.x, hp0 = g.progress.hearts;
      let fell = false;
      for (let i = 0; i < 400; i++) { window.__harness.step(1); if (p.falling > 0) fell = true; }
      out[tide] = { moved: fl.x - x0 + (fl.y - 0), dx: fl.x - x0, pdx: p.x - px0, fell, hurt: g.progress.hearts < hp0, fx: fl.x, fy: fl.y };
      if (tide === 1) {
        // The conch: the float holds still for as long as it sounds.
        for (let i = 0; i < 600 && !(fl.dir && fl.left > 80); i++) window.__harness.step(1);
        const y1 = fl.y, x1 = fl.x;
        p.playConch(g);
        let still = !!fl.dir, frames = 0;
        for (;;) {
          window.__harness.step(1);
          if (p.conchTime <= 0 || frames > 300) break;
          frames++;
          if (fl.x !== x1 || fl.y !== y1) still = false;
        }
        out.conch = { still, frames, wasMoving: !!fl.dir };
      }
    }
    return out;
  }, [setup(f.map, f.rk, 1, fe[1], fe[2] + 2), f.map === floats[0].map ? floats.filter(o => o.map === f.map && o.rk === f.rk).indexOf(f) : 0]);
  const tag = `${f.map} ${f.rk} float ${f.i}`;
  ok(res[0].dx === 0, `${tag}: at LOW it does not move (${res[0].dx} px)`);
  ok(res[1].dx !== 0 || res[1].fy !== fe[2] * 16, `${tag}: at MID it runs`);
  ok(!res[1].fell && Math.abs(res[1].pdx - res[1].dx) <= 1, `${tag}: it carries a rider and he does not fall (float ${res[1].dx} px, rider ${res[1].pdx} px)`);
  // On a sealed floor (S184) the conch is not heard at all, so there is no
  // sounding to hold still through; that it is refused there is the room's
  // `noTide`, which walk-dungeons and check-sluices lean on.
  const [ff, frx, fry] = f.rk.split(',').map(Number);
  if (getRoom(f.map, ff, frx, fry).def.noTide) ok(res.conch.frames === 0, `${tag}: on a sealed floor the conch does not sound at all`);
  else ok(res.conch.frames > 0 && res.conch.still, `${tag}: it holds still while the conch sounds (${res.conch.frames} frames)`);
}

for (const cl of claims) {
  const fe = (cl.def.entities || []).find(e => e[0] === 'float');
  const sweep = floatSweep(fe[1], fe[2], (fe[3] || {}).path);
  const [bx, by] = cl.c.board;
  const target = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [bx + dx, by + dy]).find(([x, y]) => sweep.has(x + ',' + y));
  const tag = `${cl.map} ${cl.rk}`;
  if (cl.c.station) {
    const r = await run(setup(cl.map, cl.rk, 1, bx, by), [['board', target[0], target[1], 2000], ['alight', cl.c.stop[0], cl.c.stop[1], 2000]]);
    ok(!r.err && r.at.tx === cl.c.stop[0] && r.at.ty === cl.c.stop[1], `${tag}: at MID a rider gets off at its stop ${cl.c.stop} (${r.err || 'at ' + r.at.tx + ',' + r.at.ty})`);
  } else {
    for (const tide of [1, 2]) {
      const r = await run(setup(cl.map, cl.rk, tide, bx, by),
        [['board', target[0], target[1], 2000], ['alight', cl.c.stop[0], cl.c.stop[1], 1500, cl.c.race]]);
      const got = !r.err && r.at.tx === cl.c.stop[0] && r.at.ty === cl.c.stop[1];
      if (tide === cl.c.brake) ok(got, `${tag}: at sea ${tide} the wind on the race stops it under him and he steps off at ${cl.c.stop} (${r.err || 'at ' + r.at.tx + ',' + r.at.ty})`);
      else ok(!got, `${tag}: at sea ${tide} the same wind does not stop it (${r.err ? 'it ran on' : 'he got off!'})`);
    }
  }
}

await browser.close(); server.close();
console.log(`\n=== ${pass} passed, ${fail} failed ===`);
process.exit(fail ? 1 : 0);
