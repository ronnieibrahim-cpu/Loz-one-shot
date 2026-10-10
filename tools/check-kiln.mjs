// THE SALT PAN'S LOWER VAULT CANNOT BE CHEATED, AND CAN BE SOLVED (S160).
//
// The vault's theme is "fire the sea puts out": every room below its kiln is
// DAMP, so the Kilnshell will not strike there, and the fire has to be carried
// down lit and THROWN where it is needed — and a flame thrown over deep water
// lands dark. Each room that leans on that says so with `kilnRoom`:
//
//   kilnRoom: { target: [x, y], from: [x, y], dir: 'right', levels: [0],
//               reach: false }
//
// and this proves, in the real engine:
//
//   1. the room is damp: with no shell placed, the Kilnshell's button strikes
//      nothing there (and a dry room of the same dungeon strikes — so the
//      refusal is the room's, not the item's);
//   2. unless the claim says otherwise (`reach` absent or false), no tile
//      beside the target is standable at ANY sea, by the engine's own
//      collision (tools/lib/collision.mjs) — so the fire has to FLY there;
//   3. a lit shell thrown from `from`, facing `dir`, lights or burns the
//      target at exactly the sea levels in `levels`, and at every other level
//      the target is still unlit/unburnt when the shell has come to rest.
//
// A room whose fire has to come DOWN instead (S182, the Bogwater Sanctum's
// Reliquary) says so with
//
//   kilnRoom: { descend: { from: '1,3,4', hole: [x, y] }, torches: [[x, y], ...] }
//
// and this proves, in place of 2 and 3:
//
//   4. the room is reached by nothing but the hole in room `from` above it
//      (the dungeon flood with that room's drops taken out of the world);
//   5. Link stepping into the open hole at LOW holding a lit shell lets go of
//      it as he falls (as in Seasons) and it lands below still burning; at
//      MID and HIGH, where the hole is flooded, no lit shell arrives at all;
//   6. a lit shell THROWN into the hole at LOW arrives below, burning;
//   7. set down beside each torch in turn it lights them all, and only then
//      does the room's puzzle pay out.
//
// A target is a torch entity at that tile (lit or not) or a burnable tile
// there (burnt when its base tile has changed). Every `kilnRoom` is found by
// reading the maps, so a new one is checked the day it is written.
//
// Usage: node tools/check-kiln.mjs
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { installRuntime } from './actor-runtime.mjs';
import { installData } from '../src/data/index.js';
import { MAPS, getRoom } from '../src/world/maps.js';
import { tileWalkable, capsForMode, ROUTE_AVOID } from './lib/collision.mjs';
import { floodDungeon } from './lib/dungeon-flood.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
installData();

let pass = 0; const fail = [];
const check = (n, c, d) => c ? (pass++, console.log('  ok   ' + n))
  : (fail.push(n), console.log('  FAIL ' + n + (d ? ' — ' + d : '')));

const CLAIMS = [];
const DRY = new Map();                      // mapId -> a dry room key, for claim 1's control
for (const [mapId, m] of MAPS) {
  for (const [key, def] of Object.entries(m.roomDefs || {})) {
    if (def.kilnRoom) CLAIMS.push({ mapId, key, def, k: def.kilnRoom });
    if (m.kind === 'dungeon' && !def.damp && !DRY.has(mapId)) DRY.set(mapId, key);
  }
}
check('at least one room claims the Kilnshell', CLAIMS.length > 0);

// --- 2. nothing beside the target can be walked to, at any sea ------------
//
// Flooded on foot from every way into the room — its ring doors and its
// warps — with a cell passable if it is walkable at ANY sea, because the
// player holds the conch: the most generous flood there is, so a target it
// cannot stand beside is a target nobody can.
const FOOT = capsForMode('foot');
for (const c of CLAIMS) {
  if (c.k.reach || c.k.descend) continue;
  const room = getRoom(c.mapId, ...c.key.split(',').map(Number));
  const W = room.tw, H = room.th;
  const ok = (x, y) => room.inBounds(x, y) && [0, 1, 2].some(t => tileWalkable(room, x, y, t, FOOT, ROUTE_AVOID));
  const seen = new Set(), q = [];
  const seed = (x, y) => { const k = x + ',' + y; if (!seen.has(k) && ok(x, y)) { seen.add(k); q.push([x, y]); } };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (x > 0 && y > 0 && x < W - 1 && y < H - 1) continue;
    // A way in on the ring lands the player on the cell inside it.
    const ix = x === 0 ? 1 : x === W - 1 ? W - 2 : x, iy = y === 0 ? 1 : y === H - 1 ? H - 2 : y;
    const name = room.baseName(x, y);
    if (ok(x, y) || /Door|Exit/.test(name)) seed(ix, iy);
  }
  for (const w of c.def.warps || []) seed(w.x, w.y);
  while (q.length) {
    const [x, y] = q.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) seed(x + dx, y + dy);
  }
  const [tx, ty] = c.k.target;
  const beside = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => `${tx + dx},${ty + dy}`)
    .filter(k => seen.has(k));
  check(`${c.mapId} ${c.key} (${c.def.name}): nothing beside the target can be walked to, at any sea`,
    beside.length === 0, beside.join(' '));
  check(`${c.mapId} ${c.key} (${c.def.name}): the throw is made from somewhere the player can stand`,
    seen.has(c.k.from.join(',')));
}

// --- the engine half ----------------------------------------------------------
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const full = join(ROOT, normalize(p)); const s = await stat(full).catch(() => null);
  if (!s || !s.isFile()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': extname(full) === '.html' ? 'text/html' : 'text/javascript' }); res.end(await readFile(full));
});
const PORT = 30000 + (process.pid % 20000);
await new Promise(r => server.listen(PORT, r));
const browser = await chromium.launch().catch(() =>
  chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' }));
const page = await browser.newPage();
await page.goto(`http://localhost:${PORT}/index.html`);
await page.waitForFunction(() => window.__game && window.__harness);
await page.evaluate(installRuntime);

/** A stated world in one room, the clock stepped by hand. */
async function enter(mapId, key, tide, px, py, dir) {
  const [f, rx, ry] = key.split(',').map(Number);
  await page.evaluate(([setup]) => window.__rp.beginRecord(setup, [['wait', 2]]), [{
    seed: 20260930, items: { sword: 1, conch: 1, kilnshell: 1 }, equipA: 'sword', equipB: 'kilnshell',
    maxHearts: 12, hearts: 12, tide, enter: [mapId, f, rx, ry, px, py, dir],
  }]);
  await page.evaluate(() => window.__rp.pump(10));
}

// --- 1. damp rooms refuse the strike; a dry room of the same map does not ---
const strike = () => page.evaluate(async () => {
  const g = window.__game;
  const items = await import('/src/game/items.js');
  items.ITEMS.kilnshell.use(g, g.player, 1);
  g.dialogue.active = false;
  window.__harness.step(1);               // an added entity joins on the next frame
  return !!items.placedKilnshell(g);
});
for (const c of CLAIMS) {
  const at = c.k.from || c.k.descend.hole;
  await enter(c.mapId, c.key, 0, at[0] * 16, at[1] * 16, c.k.dir || 'down');
  check(`${c.mapId} ${c.key} (${c.def.name}): the room is damp and the shell will not strike`,
    c.def.damp && !(await strike()));
}
for (const [mapId, key] of DRY) {
  if (!CLAIMS.some(c => c.mapId === mapId)) continue;
  await enter(mapId, key, 0, 7 * 16, 5 * 16, 'up');
  check(`${mapId} ${key}: a dry room of the same dungeon strikes (the refusal is the room's)`, await strike());
}

// --- 3. the throw, at every sea ---------------------------------------------
for (const c of CLAIMS.filter(x => !x.k.descend)) {
  const got = [];
  for (const level of [0, 1, 2]) {
    await enter(c.mapId, c.key, level, c.k.from[0] * 16, c.k.from[1] * 16 + 1, c.k.dir);
    const r = await page.evaluate(async ([tx, ty, dir]) => {
      const g = window.__game, p = g.player;
      const items = await import('/src/game/items.js');
      const torch = () => g.entities.find(e => e.flammable && Math.floor((e.x + 8) / 16) === tx && Math.floor((e.y + 8) / 16) === ty);
      const before = g.room.baseName(tx, ty);
      p.dir = dir;
      const shell = new items.Kilnshell(p.x, p.y, { lit: true });
      g.addEntity(shell);
      p.carrying = shell; shell.carried = true; p.liftT = 0;
      p.placeCarried();
      p.throwCarried(g);
      for (let i = 0; i < 90; i++) window.__harness.step(1);
      const t = torch();
      return { hit: t ? !!t.lit : g.room.baseName(tx, ty) !== before, what: t ? 'torch' : before };
    }, [...c.k.target, c.k.dir]);
    if (r.hit) got.push(level);
  }
  const want = [...c.k.levels].sort();
  check(`${c.mapId} ${c.key} (${c.def.name}): a lit shell thrown from ${c.k.from} lands the fire at sea ${want.join('/')} and no other`,
    JSON.stringify(got) === JSON.stringify(want), `lit at ${got.join('/') || 'none'}`);
}

// --- 4. it burns where it lies (S162) ----------------------------------------
// A shell in the air or held overhead lights nothing; the same shell resting on
// the same tile does. A throw that came down in a hole used to light the brazier
// it flew past, which no player expects.
{
  const c = CLAIMS.find(x => x.key === '0,1,1') || CLAIMS.find(x => !x.k.descend);
  const [tx, ty] = c.k.target;
  const run = async (mode) => {
    await enter(c.mapId, c.key, 0, c.k.from[0] * 16, c.k.from[1] * 16 + 1, c.k.dir);
    return page.evaluate(async ([tx, ty, mode]) => {
      const g = window.__game, p = g.player;
      const items = await import('/src/game/items.js');
      const torch = g.entities.find(e => e.flammable && Math.floor((e.x + 8) / 16) === tx && Math.floor((e.y + 8) / 16) === ty);
      const shell = new items.Kilnshell((tx - 1) * 16, ty * 16, { lit: true });
      g.addEntity(shell); g.flushPending();
      if (mode === 'held') { p.carrying = shell; shell.carried = true; p.liftT = 0; }
      for (let i = 0; i < 24; i++) {
        if (mode === 'air') { shell.flight = { vx: 0, vy: 0 }; shell.fz = 20; shell.vz = 0; }
        if (mode === 'held') { shell.x = (tx - 1) * 16; shell.y = ty * 16; }
        shell.update(g);
      }
      if (mode === 'held') { p.carrying = null; shell.carried = false; }
      return !!(torch && torch.lit);
    }, [tx, ty, mode]);
  };
  check(`${c.mapId} ${c.key}: a lit shell in the AIR beside the brazier does not light it`, !(await run('air')));
  check(`${c.mapId} ${c.key}: a lit shell HELD beside the brazier does not light it`, !(await run('held')));
  check(`${c.mapId} ${c.key}: the same shell RESTING beside the brazier lights it`, await run('rest'));
}

// --- 4-7. fire that has to come DOWN (S182) -----------------------------------
for (const c of CLAIMS.filter(x => x.k.descend)) {
  const where = `${c.mapId} ${c.key} (${c.def.name})`;
  const { from, hole: [hx, hy] } = c.k.descend;
  const without = floodDungeon(c.mapId, { dropSkip: from });
  check(`${where}: reached by nothing but the hole in ${from}`, !without.reachedRooms.has(c.key));
  const [ff, frx, fry] = from.split(',').map(Number);

  // Stand above the hole (opened) holding a lit shell, or throw it in.
  const descend = (level, how) => page.evaluate(async ([setup, how, hx, hy, below]) => {
    window.__rp.beginRecord(setup, [['wait', 2], ...(how === 'carry' ? [['hold', ['down'], 40]] : []), ['wait', 400]]);
    const g = window.__game, p = g.player;
    const items = await import('/src/game/items.js');
    window.__rp.pump(2);
    g.room.setTile(hx, hy, 'dShaftBog');
    const shell = new items.Kilnshell(p.x, p.y, { lit: true });
    g.addEntity(shell); g.flushPending();
    p.carrying = shell; shell.carried = true; p.liftT = 0; p.placeCarried();
    if (how === 'throw') p.throwCarried(g);
    for (let i = 0; i < 500; i++) {
      for (const e of g.entities) if (e.isEnemy) e.remove = true;
      if (g.dialogue) g.dialogue.active = false;
      if (window.__rp.pump(1).done) break;
    }
    const lit = g.entities.filter(e => e instanceof items.Kilnshell && !e.remove && e.lit && !e.flight && !e.carried);
    const fell = (g.fallen || []).filter(f => f.spec.type === 'kilnshell' && f.spec.opts.lit
      && `${f.floor},${f.rx},${f.ry}` === below);
    return { room: g.room.key, lit: lit.length, fell: fell.length };
  }, [{
    seed: 20260930, items: { sword: 1, conch: 1, kilnshell: 1, cleats: 1 }, equipA: 'sword', equipB: 'kilnshell',
    maxHearts: 12, hearts: 12, tide: level,
    enter: [c.mapId, ff, frx, fry, hx * 16, (how === 'carry' ? hy - 1 : hy - 3) * 16, 'down'],
  }, how, hx, hy, c.key]);

  for (const level of [0, 1, 2]) {
    const r = await descend(level, 'carry');
    if (level === 0) {
      check(`${where}: at LOW, holding a lit shell, Link falls through and the shell comes down with him, burning`,
        r.room === c.key && r.lit === 1, JSON.stringify(r));
    } else {
      check(`${where}: at sea ${level} the hole is flooded and no lit shell gets down`,
        r.fell === 0 && !(r.room === c.key && r.lit > 0), JSON.stringify(r));
    }
  }
  {
    const r = await descend(0, 'throw');
    check(`${where}: at LOW a lit shell thrown into the hole goes down it, still burning`, r.fell === 1, JSON.stringify(r));
  }

  // 7. set beside each torch in turn
  await enter(c.mapId, c.key, 0, hx * 16, hy * 16, 'down');
  const r = await page.evaluate(async ([torches, flag]) => {
    const g = window.__game;
    const items = await import('/src/game/items.js');
    const torchAt = ([tx, ty]) => g.entities.find(e => e.flammable && Math.floor((e.x + 8) / 16) === tx && Math.floor((e.y + 8) / 16) === ty);
    const shell = new items.Kilnshell(0, 0, { lit: true });
    g.addEntity(shell); g.flushPending();
    const steps = [];
    for (const [tx, ty] of torches) {
      const before = !!g.progress.flags?.[flag] || (g.progress.flagsSet || []).includes?.(flag);
      shell.x = tx * 16 + (tx < 7 ? 16 : -16); shell.y = (ty + 1) * 16;
      for (let i = 0; i < 40; i++) { if (g.dialogue) g.dialogue.active = false; window.__harness.step(1); }
      steps.push({ lit: torches.map(t => !!(torchAt(t) && torchAt(t).lit)), solved: !!g.room._puzzleDone });
    }
    for (let i = 0; i < 4; i++) window.__harness.step(1);
    const chest = g.entities.find(e => e.constructor.name === 'Chest' && !e.remove);
    return { steps, chest: chest ? (chest.pickup || chest.item || null) : null };
  }, [c.k.torches, c.def.puzzle && c.def.puzzle.flag]);
  const n = c.k.torches.length;
  check(`${where}: a shell set beside one torch lights that one and not the rest`,
    r.steps[0].lit.filter(Boolean).length === 1 && !r.steps[0].solved, JSON.stringify(r.steps[0]));
  check(`${where}: beside each in turn, all ${n} are lit and the puzzle pays out`,
    r.steps[n - 1].lit.every(Boolean) && r.steps[n - 1].solved, JSON.stringify(r.steps[n - 1]));
  check(`${where}: what rises is the Boss Key's chest`, /bossKey/i.test(String(r.chest)), String(r.chest));
}

await browser.close(); server.close();
console.log(`\n=== ${pass} passed, ${fail.length} failed ===`);
process.exit(fail.length ? 1 : 0);
