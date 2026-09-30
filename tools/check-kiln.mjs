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
  if (c.k.reach) continue;
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
  await enter(c.mapId, c.key, 0, c.k.from[0] * 16, c.k.from[1] * 16, c.k.dir);
  check(`${c.mapId} ${c.key} (${c.def.name}): the room is damp and the shell will not strike`,
    c.def.damp && !(await strike()));
}
for (const [mapId, key] of DRY) {
  if (!CLAIMS.some(c => c.mapId === mapId)) continue;
  await enter(mapId, key, 0, 7 * 16, 5 * 16, 'up');
  check(`${mapId} ${key}: a dry room of the same dungeon strikes (the refusal is the room's)`, await strike());
}

// --- 3. the throw, at every sea ---------------------------------------------
for (const c of CLAIMS) {
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

await browser.close(); server.close();
console.log(`\n=== ${pass} passed, ${fail.length} failed ===`);
process.exit(fail.length ? 1 : 0);
