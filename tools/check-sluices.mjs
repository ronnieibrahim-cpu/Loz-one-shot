// Sluice prover — the Cliffside Cistern's Sealed Cistern and its gates (S184;
// docs/briefs/D4-CLIFFSIDE-CISTERN.md, N4-N9).
//
// 2F is a floor the conch is not heard on (`noTide` on every room): the
// water there is whatever sea the player climbed with. Each of its three
// tanks has a sluice gate in its north wall and a `tank: { flag, rect }`
// declaration, and the wheel directly above it on 3F (a sill declaring
// `drains: flag`) opens it for good — after which the tank's water reads one
// level under the sea (`drainedBase`, read by `Tide.resolve`). The Bellows'
// cone adds one more on top. That composition is the whole second half of
// the dungeon, and this is where it is proved.
//
// WHAT IS PROVED
//
//   Data, for every map:
//   1. Every gate tile (a tiledef with an `openFlag` of the form d4Gate*,
//      drawn `H`/`J`/`Q`) stands in a room whose `tank` names that flag, and
//      every tank's flag is drained by exactly one sill, on the floor directly
//      above the tank, in the screen directly above it.
//   2. Every tank room is on a sealed floor (`noTide` and `sealed`).
//
//   The dungeon flood (tools/lib/dungeon-flood.mjs, which learned the sealed
//   floor and the gates in the same commit):
//   3. Every `tankRoom` claim's tank is reached only at the claim's `sea` —
//      the sea you climbed with is the sea you have — and the Intake's far
//      side only at HIGH.
//   4. With no gate ever opened (`gates: false`) the East Tank's stand and
//      the Float Tank's ledge are not reached at all; with the gates, they
//      are — so N8 and N9 cannot be skipped and can be solved, in the model.
//
//   The real engine:
//   5. Each Wind Loft wheel, pumped from its stand at its sea, opens and sets
//      its gate's flag; then in the tank below, a tile inside the tank reads
//      one under the sea and a tile outside it does not, the gate is drawn
//      open, and the cone on top of the tank adds one more.
//   6. N7 (`tankRoom.blocks`): at HIGH with the gate shut no block moves in
//      any direction; with it open, the two blocks pushed onto their plates
//      raise the chest.
//   7. N8 (`kind: 'brake'`): at HIGH, a rider pumping the Bellows at the race
//      as he comes level with the ledge rides on past it with the gate shut,
//      and stops and steps off onto it with the gate open.
//   8. N9 (`tankRoom.wheel`): pumped from the stand at HIGH, the wheel
//      bubbles and stays shut with the gate shut, and turns with it open —
//      and the Boss Key's chest rises.
//
// The Bottled Tide is the one thing that moves the sea on 2F, and could skip
// N9 once (the human allowed it, S183). The claims here are made without one.
//
// Usage: node tools/check-sluices.mjs
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { installRuntime } from './actor-runtime.mjs';
import { installData } from '../src/data/index.js';
import { MAPS, getRoom } from '../src/world/maps.js';
import { getTileDef } from '../src/world/tileset.js';
import { floodDungeon } from './lib/dungeon-flood.mjs';
import { floatSweep } from '../src/game/float-path.js';

installData();
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) { pass++; console.log('  ok   ' + msg); } else { fail++; console.log('  FAIL ' + msg); } };
const sillsOf = (def) => !def.bellowsRoom ? [] : (Array.isArray(def.bellowsRoom) ? def.bellowsRoom : [def.bellowsRoom]);
const tanksOf = (def) => !def.tank ? [] : (Array.isArray(def.tank) ? def.tank : [def.tank]);

// ------------------------------------------------------------------ data
const tanks = [], drains = [], claims = [];
for (const m of MAPS.values()) {
  for (const [rk, def] of Object.entries(m.roomDefs || {})) {
    for (const T of tanksOf(def)) tanks.push({ map: m, rk, def, T });
    for (const B of sillsOf(def)) if (B.drains) drains.push({ map: m, rk, def, B });
    if (def.tankRoom) claims.push({ map: m, rk, def, c: def.tankRoom });
  }
}
ok(tanks.length >= 3 && drains.length >= 3, `found ${tanks.length} tanks, ${drains.length} wheels that drain one and ${claims.length} tank-room claims`);

for (const t of tanks) {
  const where = `${t.map.id} ${t.rk} (${t.def.name})`;
  const room = getRoom(t.map.id, ...t.rk.split(',').map(Number));
  ok(t.def.noTide && t.def.sealed, `${where}: is on a sealed floor (the conch is not heard there)`);
  // 1: its gate is drawn in it, and one wheel above drains it.
  let gate = null;
  for (let y = 0; y < room.th; y++) for (let x = 0; x < room.tw; x++) {
    const d = getTileDef(room.baseName(x, y));
    if (d && d.openFlag === t.T.flag) gate = [x, y];
  }
  ok(!!gate, `${where}: its sluice gate (${t.T.flag}) is drawn in its wall${gate ? ' at ' + gate : ''}`);
  const ws = drains.filter(d => d.map === t.map && d.B.drains === t.T.flag);
  ok(ws.length === 1, `${where}: exactly one wheel drains it (${ws.length})`);
  if (ws.length === 1) {
    const [tf, trx, try_] = t.rk.split(',').map(Number);
    const [wf, wrx, wry] = ws[0].rk.split(',').map(Number);
    const [CW, CH] = t.map.cell;
    const sx = wrx + Math.floor(ws[0].B.wheel[0] / CW), sy = wry + Math.floor(ws[0].B.wheel[1] / CH);
    ok(wf === tf + 1 && sx === trx && sy === try_, `${where}: and that wheel (${ws[0].rk} at ${ws[0].B.wheel}) is directly above it`);
  }
}

// ------------------------------------------------------------------ flood
const byMap = new Map();
for (const cl of claims) { if (!byMap.has(cl.map.id)) byMap.set(cl.map.id, []); byMap.get(cl.map.id).push(cl); }
for (const [mapId, cls] of byMap) {
  const full = floodDungeon(mapId);
  const shut = floodDungeon(mapId, { gates: false });
  const seasAt = (fl, rk, x, y) => [0, 1, 2].filter(t => fl.seenSea.has(`${rk}:${x},${y}@${t}`));
  for (const cl of cls) {
    const where = `${mapId} ${cl.rk} (${cl.def.name})`;
    const T = tanksOf(cl.def)[0];
    const [x0, y0, x1, y1] = T.rect;
    const bad = new Set();
    let any = false;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      for (const t of seasAt(full, cl.rk, x, y)) { any = true; if (t !== cl.c.sea) bad.add(t); }
    }
    // The East Tank's well is never stood in at all: its claim is its stand.
    if (cl.c.wheel) {
      const B = sillsOf(cl.def)[0];
      const s = seasAt(full, cl.rk, B.stand[0], B.stand[1]);
      ok(s.length === 1 && s[0] === cl.c.sea, `${where}: its stand is reached only at sea ${cl.c.sea} (${s.join('/') || 'never'})`);
      ok(!shut.seen.has(`${cl.rk}:${B.stand[0]},${B.stand[1]}`), `${where}: with no gate ever opened, the flood never stands on it`);
    } else if (cl.c.kind === 'brake') {
      // The ledge itself is reached at MID too — from the Wind Loft's stair,
      // before any gate is open, the wind brakes a MID race — and that is the
      // brief's own "at MID the gap is stone". What the gate buys is BEYOND
      // the ledge: the drown-wall gap, deep only at HIGH.
      const [sx, sy] = cl.c.stop, [bx, by] = cl.c.beyond;
      ok(full.seen.has(`${cl.rk}:${sx},${sy}`), `${where}: with the gates, the flood gets off the float at ${cl.c.stop}`);
      const b = seasAt(full, cl.rk, bx, by);
      ok(b.length === 1 && b[0] === cl.c.sea, `${where}: and beyond it, ${cl.c.beyond} is reached only at sea ${cl.c.sea} (${b.join('/') || 'never'})`);
      ok(!shut.seen.has(`${cl.rk}:${bx},${by}`), `${where}: with no gate ever opened, nothing gets past the ledge to ${cl.c.beyond}`);
    } else {
      ok(any && bad.size === 0, `${where}: its tank is only ever entered at sea ${cl.c.sea}${bad.size ? ' (also ' + [...bad] + ')' : ''}`);
    }
  }
  // The Intake: its far side only at HIGH.
  for (const [rk, def] of Object.entries(MAPS.get(mapId).roomDefs)) {
    if (!def.sealed || !def.spikeRoom) continue;
    const [tx, ty] = def.spikeRoom.target;
    const s = seasAt(full, rk, tx, ty);
    ok(s.every(t => t === def.spikeRoom.sea) && s.length > 0, `${mapId} ${rk} (${def.name}): its far side is reached only at sea ${def.spikeRoom.sea} (${s.join('/')})`);
  }
  ok(full.missed.length === 0 && full.bossReached, `${mapId}: with the gates, every room is reached${full.missed.length ? ' (missed ' + full.missed + ')' : ''}`);
}

// ------------------------------------------------------------------ engine
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

const setup = (map, rk, tide, tx, ty, flags = []) => {
  const [f, rx, ry] = rk.split(',').map(Number);
  return {
    seed: 20260806, godMode: true, items: { sword: 1, conch: 1, bellows: 1, cleats: 1 },
    equipA: 'bellows', equipB: 'conch', maxHearts: 40, hearts: 40, tide, flags,
    enter: [map, f, rx, ry, tx * 16, ty * 16, 'down'],
  };
};
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
  const at = await page.evaluate(() => { const p = window.__game.player; return { tx: Math.floor(p.cx / 16), ty: Math.floor(p.cy / 16) }; });
  return { err, at };
}

// 5: each wheel opens its gate, and the tank below reads one under.
for (const d of drains) {
  const where = `${d.map.id} ${d.rk} wheel ${d.B.wheel}`;
  const [sx, sy] = d.B.stand;
  const r = await run(setup(d.map.id, d.rk, d.B.at, sx, sy), [['bellows', d.B.wheel[0], d.B.wheel[1], 1800]]);
  const flag = await page.evaluate(k => !!window.__game.progress.flags[k], d.B.drains);
  ok(!r.err && flag, `${where}: pumped from ${d.B.stand} at sea ${d.B.at}, it turns and opens ${d.B.drains}${r.err ? ' (' + r.err + ')' : ''}`);
  const t = tanks.find(x => x.map === d.map && x.T.flag === d.B.drains);
  if (!t) continue;
  const [x0, y0, x1, y1] = t.T.rect;
  // A tile outside the rect: the first floor-or-water cell left of it, or
  // the rect's own corner pushed one tile out.
  const res = await page.evaluate(([st, rect, flagName]) => {
    const g = window.__game;
    const read = () => ({ inT: g.tide.levelAt(rect[0], rect[1]), outT: g.tide.levelAt(rect[0] - 1 >= 1 ? rect[0] - 1 : rect[2] + 1, rect[1]) });
    const out = {};
    st.flags = [];
    window.__rp.beginRecord(st, []);
    out.shut = read();
    st.flags = [flagName];
    window.__rp.beginRecord(st, []);
    out.open = read();
    let gate = null;
    const room = g.room;
    for (let y = 0; y < room.th; y++) for (let x = 0; x < room.tw; x++) {
      if (room.tile(x, y, g.tide).name === 'dGateCisternOpen') gate = [x, y];
    }
    out.gate = gate;
    // The cone on top of the drained tank adds one more.
    g.tide.addOverride({ mapId: g.mapId, roomKey: room.key, tx: rect[0], ty: rect[1], r: 0, delta: -1, shape: 'square' });
    out.cone = g.tide.levelAt(rect[0], rect[1]);
    g.tide.clearOverrides();
    return out;
  }, [setup(t.map.id, t.rk, 2, 7, 1), t.T.rect, t.T.flag]);
  const tw = `${t.map.id} ${t.rk} (${t.def.name})`;
  ok(res.shut.inT === 2 && res.open.inT === 1 && res.open.outT === 2,
    `${tw}: at HIGH the tank reads ${res.shut.inT} with its gate shut and ${res.open.inT} with it open; outside the tank ${res.open.outT}`);
  ok(!!res.open && !!res.gate, `${tw}: the open gate is drawn open${res.gate ? ' at ' + res.gate : ''}`);
  ok(res.cone === 0, `${tw}: and the Bellows' cone on the drained tank adds one more (${res.cone})`);
}

for (const cl of claims) {
  const where = `${cl.map.id} ${cl.rk} (${cl.def.name})`;
  const flag = tanksOf(cl.def)[0].flag;
  if (cl.c.blocks) {
    // 6: the blocks. Engine-level pushes in every direction with the gate
    // shut; then the real player pushing both onto their plates with it open.
    const shut = await page.evaluate((st) => {
      window.__rp.beginRecord(st, []);
      const g = window.__game;
      const moved = [];
      for (const b of g.entities.filter(e => e.constructor.name === 'PushBlock')) {
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const ax = b.axis;
          b.axis = null;
          if (b.push(g, dx, dy)) moved.push([b.x / 16, b.y / 16, dx, dy]);
          b.axis = ax;
          b.slide = null;
        }
      }
      return moved;
    }, setup(cl.map.id, cl.rk, cl.c.sea, 12, 2));
    ok(shut.length === 0, `${where}: at sea ${cl.c.sea} with the gate shut, no block moves in any direction${shut.length ? ' (' + JSON.stringify(shut) + ')' : ''}`);
    const blocks = (cl.def.entities || []).filter(e => e[0] === 'block');
    const goals = cl.def.puzzle.blocks;
    const steps = [];
    blocks.forEach((b, i) => {
      const [gx, gy] = goals[i];
      const dx = Math.sign(gx - b[1]), dy = Math.sign(gy - b[2]);
      steps.push(['goto', b[1] - dx, b[2] - dy, 900]);
      steps.push(['hold', [dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up'], 60]);
      steps.push(['wait', 40]);
    });
    const r = await run(setup(cl.map.id, cl.rk, cl.c.sea, 12, 2, [flag]), steps);
    const done = await page.evaluate((pf) => ({
      solved: !!window.__game.progress.flags[pf],
      chest: window.__game.entities.some(e => e.constructor.name === 'Chest'),
    }), cl.def.puzzle.flag);
    ok(!r.err && done.solved && done.chest, `${where}: with the gate open, the blocks go onto their plates and the chest rises${r.err ? ' (' + r.err + ')' : ''}`);
  } else if (cl.c.kind === 'brake') {
    // 7: the float, braked at the ledge.
    const fe = (cl.def.entities || []).find(e => e[0] === 'float');
    const [bx, by] = cl.c.board;
    const sweep = floatSweep(fe[1], fe[2], (fe[3] || {}).path);
    const [ox, oy] = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [bx + dx, by + dy]).find(([x, y]) => sweep.has(x + ',' + y));
    for (const open of [false, true]) {
      // Boarded from `board`, and braked as it comes level with the ledge;
      // then a moment on the ledge, so a rider set down on its rim and
      // falling off it does not count as getting off there.
      const r = await run(setup(cl.map.id, cl.rk, cl.c.sea, bx, by, open ? [flag] : []),
        [['board', ox, oy, 2000], ['alight', cl.c.stop[0], cl.c.stop[1], 1500, cl.c.race], ['wait', 60]]);
      const got = !r.err && r.at.tx === cl.c.stop[0] && r.at.ty === cl.c.stop[1];
      if (open) ok(got, `${where}: with the gate open, the wind on the race stops the float and he steps off at ${cl.c.stop} (${r.err || 'at ' + r.at.tx + ',' + r.at.ty})`);
      else ok(!got, `${where}: with the gate shut, the same wind does not stop it (${r.err ? 'it ran on' : 'he got off!'})`);
    }
  } else if (cl.c.wheel) {
    // 8: the Boss Key wheel.
    const B = sillsOf(cl.def)[0];
    for (const open of [false, true]) {
      const r = await run(setup(cl.map.id, cl.rk, cl.c.sea, B.stand[0], B.stand[1], open ? [flag] : []),
        [['bellows', B.wheel[0], B.wheel[1], 600]]);
      const st = await page.evaluate(() => {
        const g = window.__game;
        const w = g.entities.find(e => e.needTurns != null);
        return { open: !!(w && w.open), chest: g.entities.some(e => e.constructor.name === 'Chest' && e.pickup === 'bossKey') };
      });
      if (open) ok(!r.err && st.open && st.chest, `${where}: with the gate open, pumped from ${B.stand} at sea ${cl.c.sea} the wheel turns and the Boss Key's chest rises`);
      else ok(!st.open && !st.chest, `${where}: with the gate shut, the same wind leaves it drowned and shut`);
    }
  }
}

await browser.close(); server.close();
console.log(`\n=== ${pass} passed, ${fail} failed ===`);
process.exit(fail ? 1 : 0);
