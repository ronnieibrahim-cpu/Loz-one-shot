// THE GULLWIND EYRIE'S CROSSINGS ARE THE COIN'S, AND THEY WORK (S160).
//
// The Eyrie's theme is "the tide change is how you move": the Ferryman's Coin,
// thrown, flies four tiles over anything a flier crosses, and on the next turn
// of the tide Link and the coin trade places. The conch only turns the sea one
// way (LOW -> MID -> HIGH -> LOW), so Link always arrives one sea after the
// throw. Each room that leans on it says so with `coinRoom` (one, or a list):
//
//   coinRoom: { from: [x, y], dir: 'up', lands: [x, y], levels: [2] }
//
// and this proves, per crossing:
//
//   1. the landing cannot be walked to from the throw — flooded with the
//      engine's own collision (tools/lib/collision.mjs), with everything the
//      dungeon's `index` says the player owns (the Cleats' swim included),
//      a cell counted if it is walkable at ANY sea;
//   2. in the real engine, at each sea L: Link at `from` facing `dir` throws
//      the coin, it comes to rest on `lands`, one conch step later he is
//      standing on `lands` at sea (L + 1) % 3 with no damage taken — at
//      exactly the seas in `levels`, and at every other sea not.
//
// Usage: node tools/check-coin.mjs
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { installRuntime } from './actor-runtime.mjs';
import { installData } from '../src/data/index.js';
import { MAPS, getRoom } from '../src/world/maps.js';
import { tileWalkable, capsForDungeonIndex, ROUTE_AVOID } from './lib/collision.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
installData();

let pass = 0; const fail = [];
const check = (n, c, d) => c ? (pass++, console.log('  ok   ' + n))
  : (fail.push(n), console.log('  FAIL ' + n + (d ? ' — ' + d : '')));

const CLAIMS = [];
for (const [mapId, m] of MAPS) {
  for (const [key, def] of Object.entries(m.roomDefs || {})) {
    if (!def.coinRoom) continue;
    for (const k of [].concat(def.coinRoom)) CLAIMS.push({ mapId, key, def, k, m });
  }
}
check('at least one room claims the Ferryman\'s Coin', CLAIMS.length > 0);
for (const c of CLAIMS) {
  check(`${c.mapId}: a map with a coin crossing declares \`dungeon.coin\`, so its flood knows the verb`,
    !!(c.m.dungeon && c.m.dungeon.coin));
}

// --- 1. the landing is not walked to -----------------------------------------
for (const c of CLAIMS) {
  const room = getRoom(c.mapId, ...c.key.split(',').map(Number));
  const caps = capsForDungeonIndex(c.m.dungeon ? c.m.dungeon.index : 0);
  const ok = (x, y) => room.inBounds(x, y) && [0, 1, 2].some(t => tileWalkable(room, x, y, t, caps, ROUTE_AVOID));
  const seen = new Set([c.k.from.join(',')]), q = [c.k.from];
  while (q.length) {
    const [x, y] = q.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = [x + dx, y + dy], k = n.join(',');
      if (!seen.has(k) && ok(...n)) { seen.add(k); q.push(n); }
    }
  }
  check(`${c.mapId} ${c.key} (${c.def.name}): ${c.k.lands} cannot be walked to from ${c.k.from}`,
    !seen.has(c.k.lands.join(',')));
}

// --- 2. the crossing, in the engine, at every sea -----------------------------
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

for (const c of CLAIMS) {
  const got = [];
  const [f, rx, ry] = c.key.split(',').map(Number);
  for (const level of [0, 1, 2]) {
    await page.evaluate(([setup]) => window.__rp.beginRecord(setup, [['wait', 2]]), [{
      seed: 20260930, items: { sword: 1, conch: 1, coin: 1, cleats: 1 }, equipA: 'sword', equipB: 'coin',
      maxHearts: 24, hearts: 24, tide: level,
      enter: [c.mapId, f, rx, ry, c.k.from[0] * 16, c.k.from[1] * 16 + 1, c.k.dir],
    }]);
    await page.evaluate(() => window.__rp.pump(10));
    const r = await page.evaluate(async ([dir, lx, ly, level]) => {
      const g = window.__game, p = g.player;
      const items = await import('/src/game/items.js');
      const step = (n) => { for (let i = 0; i < n; i++) window.__harness.step(1); };
      g.enemiesOff = true;
      for (const e of g.entities) if (e.isEnemy) e.remove = true;
      step(1);
      p.dir = dir;
      items.ITEMS.coin.use(g, p, 1);
      step(60);
      const c = g.progress.coin;
      const rest = c ? [Math.floor((c.px + 8) / 16), Math.floor((c.py + 8) / 16)] : null;
      const hp = g.progress.hearts;
      g.tide.cycle();
      step(240);
      g.dialogue.active = false;
      const at = [Math.floor(p.cx / 16), Math.floor((p.y + 12) / 16)];
      return {
        rest, at, tide: g.tide.level, hurt: g.progress.hearts < hp, room: g.room.key,
        ok: !!rest && rest[0] === lx && rest[1] === ly && at[0] === lx && at[1] === ly
          && g.tide.level === (level + 1) % 3 && g.progress.hearts >= hp,
      };
    }, [c.k.dir, c.k.lands[0], c.k.lands[1], level]);
    if (r.ok) got.push(level);
    else if (c.k.levels.includes(level)) console.log(`       (at sea ${level}: ${JSON.stringify(r)})`);
  }
  const want = [...c.k.levels].sort();
  check(`${c.mapId} ${c.key} (${c.def.name}): thrown from ${c.k.from} the coin carries Link to ${c.k.lands} at sea ${want.join('/')} and no other`,
    JSON.stringify(got) === JSON.stringify(want), `crossed at ${got.join('/') || 'none'}`);
}

await browser.close(); server.close();
console.log(`\n=== ${pass} passed, ${fail.length} failed ===`);
process.exit(fail.length ? 1 : 0);
