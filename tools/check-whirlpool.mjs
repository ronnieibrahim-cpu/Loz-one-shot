// THE SUNKEN PALACE'S WHIRLPOOLS TAKE YOU DOWN, AND ONLY WHEN THE SEA IS HIGH
// (S161).
//
// The Palace's theme is "the sea's height decides which floor you're on". Its
// whirlpool is a tide tile (`dWhirlpool`, legend `6`): shallows at LOW, deep
// water at MID, and at HIGH a whirlpool that takes whoever touches it to the
// same place in the room directly beneath, one floor down
// (`Game.enterWhirlpool`). Nothing takes you back up but a stair. So at LOW
// the pools are a floor you walk across, and at HIGH they are the way down.
//
// This proves, for EVERY whirlpool cell in the world (found in the room data,
// not declared):
//
//   1. there is a room directly beneath it, and the cell under it is somewhere
//      Link can stand (the engine's own `canOccupy`) at HIGH;
//   2. in the real engine, Link standing on it at HIGH is taken down — to the
//      floor below, the same room coordinates, the same cell — unhurt;
//   3. at LOW and at MID he is not: he stays on the floor he was on.
//
// And for every room that declares `whirlRoom: { lands: [[x, y], ...] }` — a
// cell of the room BENEATH it that its whirlpools are the only way to — that
// the dungeon flood (tools/lib/dungeon-flood.mjs, the one walk-dungeons uses)
// does not reach it with whirlpools taken out of the world, and does with
// them. That is the claim that the floor you are on is the sea's to decide,
// rather than a shortcut the stairs already offer.
//
// Usage: node tools/check-whirlpool.mjs
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { installRuntime } from './actor-runtime.mjs';
import { installData } from '../src/data/index.js';
import { MAPS, getRoom } from '../src/world/maps.js';
import { F } from '../src/world/tileset.js';
import { floodDungeon } from './lib/dungeon-flood.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
installData();

let pass = 0; const fail = [];
const check = (n, c, d) => c ? (pass++, console.log('  ok   ' + n))
  : (fail.push(n), console.log('  FAIL ' + n + (d ? ' — ' + d : '')));

// --- every whirlpool in the world, found rather than declared ----------------
const POOLS = [];   // { mapId, key, x, y, levels }
for (const [mapId, m] of MAPS) {
  for (const key of Object.keys(m.roomDefs || {})) {
    const room = getRoom(mapId, ...key.split(',').map(Number));
    for (let y = 0; y < room.th; y++) for (let x = 0; x < room.tw; x++) {
      const levels = [0, 1, 2].filter(t => room.flagsAt(x, y, t) & F.WHIRL);
      if (levels.length) POOLS.push({ mapId, key, x, y, levels, m });
    }
  }
}
check('there are whirlpools in the world', POOLS.length > 0);
console.log(`       ${POOLS.length} whirlpool cells in ${new Set(POOLS.map(p => p.mapId + ' ' + p.key)).size} rooms`);

for (const p of POOLS) {
  const [f, rx, ry] = p.key.split(',').map(Number);
  const below = `${f - 1},${rx},${ry}`;
  const where = `${p.mapId} ${p.key} ${p.x},${p.y}`;
  if (!check(`${where}: a whirlpool only at HIGH`, JSON.stringify(p.levels) === '[2]', `whirls at ${p.levels}`)) continue;
  check(`${where}: there is a room beneath it (${below})`, !!p.m.roomDefs[below]);
}

// --- the claims: somewhere only a whirlpool reaches --------------------------
const CLAIMS = [];
for (const [mapId, m] of MAPS) {
  for (const [key, def] of Object.entries(m.roomDefs || {})) {
    if (def.whirlRoom) CLAIMS.push({ mapId, key, def, m });
  }
}
check('at least one room claims a floor only its whirlpools reach', CLAIMS.length > 0);
const floods = new Map();
for (const c of CLAIMS) {
  if (!floods.has(c.mapId)) floods.set(c.mapId, [floodDungeon(c.mapId), floodDungeon(c.mapId, { whirl: false })]);
  const [withW, without] = floods.get(c.mapId);
  const [f, rx, ry] = c.key.split(',').map(Number);
  const below = `${f - 1},${rx},${ry}`;
  for (const [x, y] of c.def.whirlRoom.lands) {
    const k = `${below}:${x},${y}`;
    check(`${c.mapId} ${c.key} (${c.def.name}): ${below} ${x},${y} is reached through its whirlpools`, withW.seen.has(k));
    check(`${c.mapId} ${c.key} (${c.def.name}): ...and by nothing else`, !without.seen.has(k));
  }
}

// --- in the engine ------------------------------------------------------------
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
const errs = [];
page.on('pageerror', e => errs.push(String(e.message || e)));
await page.goto(`http://localhost:${server.address().port}/index.html`);
await page.waitForFunction(() => window.__game && window.__harness);
await page.evaluate(installRuntime);

for (const p of POOLS) {
  if (JSON.stringify(p.levels) !== '[2]') continue;
  const [f, rx, ry] = p.key.split(',').map(Number);
  const got = {};
  for (const level of [0, 1, 2]) {
    await page.evaluate(([setup]) => window.__rp.beginRecord(setup, [['wait', 2]]), [{
      seed: 20260930, items: { sword: 1, conch: 1, cleats: 1 }, equipA: 'sword', equipB: 'conch',
      maxHearts: 24, hearts: 24, tide: level,
      // Arrive a tile clear of the pool, then be put on it: arriving ON a
      // whirlpool is not how anyone meets one.
      enter: [p.mapId, f, rx, ry, 16, 16, 'down'],
    }]);
    await page.evaluate(() => window.__rp.pump(10));
    got[level] = await page.evaluate(async ([x, y]) => {
      const E = await import('/src/game/entity.js');
      const g = window.__game, pl = g.player;
      const step = (n) => {
        for (let i = 0; i < n; i++) {
          for (const e of g.entities) if (e.isEnemy) e.remove = true;
          window.__harness.step(1);
        }
      };
      // Whatever lives in the room below (the eel, under the Throne Pool) is
      // not what this asks about: the whirlpool's own harm is.
      step(1);
      const hp = g.progress.hearts, floor0 = g.room.floor;
      pl.x = x * 16; pl.y = y * 16; pl.lastSafe.x = pl.x; pl.lastSafe.y = pl.y;
      pl.invuln = 0; pl.hurtTime = 0;
      step(120);
      if (g.dialogue) g.dialogue.active = false;
      return {
        stands: E.canOccupy(g, pl, pl.x, pl.y, { jumping: false, swim: true, cutting: false }),
        floor: g.room.floor, from: floor0, rx: g.room.rx, ry: g.room.ry, map: g.mapId,
        at: [Math.floor(pl.cx / 16), Math.floor((pl.y + 12) / 16)], hurt: g.progress.hearts < hp,
      };
    }, [p.x, p.y]);
  }
  const where = `${p.mapId} ${p.key} ${p.x},${p.y}`;
  const h = got[2];
  check(`${where}: at HIGH it takes Link down to ${f - 1},${rx},${ry}, the same cell, unhurt`,
    h.map === p.mapId && h.floor === f - 1 && h.rx === rx && h.ry === ry
      && h.at[0] === p.x && h.at[1] === p.y && !h.hurt && h.stands, JSON.stringify(h));
  check(`${where}: at LOW and MID it does not`, got[0].floor === f && got[1].floor === f,
    `LOW ${JSON.stringify(got[0])} MID ${JSON.stringify(got[1])}`);
}
check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));

await browser.close(); server.close();
console.log(`\n=== ${pass} passed, ${fail.length} failed ===`);
process.exit(fail.length ? 1 : 0);
