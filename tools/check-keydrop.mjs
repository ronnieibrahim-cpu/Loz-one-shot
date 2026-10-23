// A KEY FROM ABOVE (S206, docs/briefs/PUZZLE-PASS.md kind G; the Sunken
// Vestry and the Vestry Crypt beneath it).
//
// Seasons' Explorer's Crypt: a button pressed upstairs drops the room's key
// down a hole, and it is found on the floor below, at the same place
// (explorersCryptScript_dropKeyDownAFloor / _keyDroppedFromAbove). Ours is
// a puzzle's reward `fallKey: [x, y]` upstairs, and the key itself is the
// room beneath's own entity, waiting on the puzzle's flag. The room beneath
// declares
//
//   keyDrop: { from: 'f,rx,ry', at: [x, y], flag }
//
// and this proves, per claim:
//
//   1. the room above is directly above, its puzzle sets `flag` and its
//      reward drops the key at `at`; `at` upstairs is a drop hole at every
//      sea (open at LOW, flooded above it), so the key goes down whatever
//      the sea; below, `at` holds a Small Key waiting on `flag`, and the cell
//      is floor at every sea;
//   2. the key's cell below is reached by the dungeon flood, and NOT with the
//      room above's holes taken out of the world — the hole is the way down;
//
// and in the real engine:
//
//   3. the puzzle solved at LOW: a key is seen falling at `at` and goes down
//      the hole (Seasons' INTERAC_FALLDOWNHOLE); nothing upstairs can be
//      picked up and no key is counted; at MID and at HIGH it sinks through
//      the flooded shaft just the same;
//   4. below, before the flag, no key; after it, the key at `at`, and
//      walking onto it counts one Small Key; walked out and back in, and
//      after a save and a load, it is not there again, and the room above
//      has none either;
//   5. and every room whose reward hands out a key the ordinary way
//      (`reward.spawn`) does not hand it out again once taken, when the
//      solved room is built afresh — the game reloaded — and pays again.
//
// Usage: node tools/check-keydrop.mjs
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
const SEA = ['LOW', 'MID', 'HIGH'];

const CLAIMS = [];
for (const [mapId, m] of MAPS) {
  for (const [key, def] of Object.entries(m.roomDefs || {})) {
    if (def.keyDrop) CLAIMS.push({ mapId, key, def, k: def.keyDrop, m });
    const rw = def.puzzle && def.puzzle.reward;
    if (rw && rw.fallKey) {
      const [f, rx, ry] = key.split(',').map(Number);
      const below = m.roomDefs[`${f - 1},${rx},${ry}`];
      check(`${mapId} ${key} (${def.name}): the room its key falls to claims it`,
        !!(below && below.keyDrop && below.keyDrop.from === key));
    }
  }
}
check('at least one room claims a key from above', CLAIMS.length > 0);

// 1, 2.
const floods = new Map();
for (const c of CLAIMS) {
  const name = `${c.mapId} ${c.key} (${c.def.name})`;
  const [f, rx, ry] = c.key.split(',').map(Number);
  const [af, arx, ary] = c.k.from.split(',').map(Number);
  const up = c.m.roomDefs[c.k.from];
  check(`${name}: the room above is directly above`, af === f + 1 && arx === rx && ary === ry && !!up);
  if (!up) continue;
  const pz = up.puzzle || {};
  check(`${name}: the room above's puzzle sets the flag and drops the key here`,
    pz.flag === c.k.flag && pz.reward && JSON.stringify(pz.reward.fallKey) === JSON.stringify(c.k.at));
  const above = getRoom(c.mapId, af, arx, ary), below = getRoom(c.mapId, f, rx, ry);
  const [x, y] = c.k.at;
  check(`${name}: above, ${x},${y} is a drop hole at every sea`,
    [0, 1, 2].every(l => above.flagsAt(x, y, l) & F.DROP));
  check(`${name}: below, ${x},${y} is floor at every sea`,
    [0, 1, 2].every(l => !(below.flagsAt(x, y, l) & (F.SOLID | F.PIT | F.DEEP | F.VOID))));
  const ents = (c.def.entities || []).filter(e => e[0] === 'pickup' && e[1] === x && e[2] === y);
  check(`${name}: below, a Small Key waits there on the flag`,
    ents.length === 1 && ents[0][3] && ents[0][3].kind === 'key' && ents[0][3].needFlag === c.k.flag);
  if (!floods.has(c.mapId)) floods.set(c.mapId, floodDungeon(c.mapId));
  const without = floodDungeon(c.mapId, { dropSkip: c.k.from });
  check(`${name}: the key's cell is reached through the hole`, floods.get(c.mapId).seen.has(`${c.key}:${x},${y}`));
  check(`${name}: ...and by nothing else`, !without.seen.has(`${c.key}:${x},${y}`));
}

// --- in the engine ----------------------------------------------------------
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

async function enter(mapId, key, sea, at, flags) {
  const [f, rx, ry] = key.split(',').map(Number);
  await page.evaluate(([setup]) => window.__rp.beginRecord(setup, [['wait', 2]]), [{
    seed: 20261023, items: { sword: 1, conch: 1, kilnshell: 1, cleats: 1 }, equipA: 'sword', equipB: 'conch',
    maxHearts: 24, hearts: 24, tide: sea, flags: flags || [],
    enter: [mapId, f, rx, ry, at[0] * 16, at[1] * 16, 'down'],
  }]);
  await page.evaluate(() => window.__rp.pump(10));
  await page.evaluate(() => {
    const g = window.__game;
    for (const e of g.entities) if (e.isEnemy) e.remove = true;
    window.__harness.step(1);
    g.player.invuln = 1e6;
    if (g.dialogue) g.dialogue.active = false;
  });
}

for (const c of CLAIMS) {
  const name = `${c.mapId} ${c.key} (${c.def.name})`;
  const up = c.m.roomDefs[c.k.from];
  const from = (up.flameRoom && up.flameRoom.from[0]) || [7, 9];
  // 3. the key falls, at each sea.
  for (const sea of [0, 1, 2]) {
    await enter(c.mapId, c.k.from, sea, from);
    const r = await page.evaluate(async ([at, flagName]) => {
      const g = window.__game, T = 16;
      const { Torch, FallingKey, Pickup } = await import('/src/game/objects.js');
      const step = (n) => { for (let i = 0; i < n; i++) window.__harness.step(1); if (g.dialogue) g.dialogue.active = false; g.mode = 'play'; };
      const keys0 = g.progress.keys[g.mapId] || 0;
      // At LOW, solved by its own torches; above it the pool is under water,
      // so the reward is paid as the puzzle pays it.
      const ts = g.entities.filter(e => e instanceof Torch);
      if (g.tide.level === 0) for (const t of ts) t.ignite(g);
      else { g.progress.flags[flagName] = true; g.applyReward(g.room.def.puzzle.reward, false); }
      step(1);
      const fk = g.entities.find(e => e instanceof FallingKey);
      const seen = !!fk && Math.floor(fk.cx / T) === at[0] && Math.floor(fk.cy / T) === at[1];
      step(120);
      return {
        flag: !!g.progress.flags[flagName], seen,
        gone: !g.entities.some(e => e instanceof FallingKey),
        loose: g.entities.some(e => e instanceof Pickup && e.kind === 'key'),
        keys: (g.progress.keys[g.mapId] || 0) - keys0,
      };
    }, [c.k.at, c.k.flag]);
    check(`${name}: solved at ${SEA[sea]}, the key is seen falling at ${c.k.at} and goes down`,
      r.flag && r.seen && r.gone && !r.loose && r.keys === 0, JSON.stringify(r));
  }
  // 4. below.
  const stair = (c.def.warps || [])[0];
  const inAt = stair ? [stair.x, stair.y + 1] : [7, 9];
  await enter(c.mapId, c.key, 0, inAt, []);
  const none = await page.evaluate(async (at) => {
    const g = window.__game, T = 16;
    const { Pickup } = await import('/src/game/objects.js');
    return !g.entities.some(e => e instanceof Pickup && e.kind === 'key');
  }, c.k.at);
  check(`${name}: before the puzzle, no key below`, none);
  await enter(c.mapId, c.key, 0, inAt, [c.k.flag]);
  const r = await page.evaluate(async ([at, upKey]) => {
    const g = window.__game, p = g.player, T = 16;
    const { Pickup } = await import('/src/game/objects.js');
    const step = (n) => { for (let i = 0; i < n; i++) window.__harness.step(1); if (g.dialogue) g.dialogue.active = false; g.mode = 'play'; };
    const keyHere = () => g.entities.find(e => e instanceof Pickup && e.kind === 'key' && !e.remove);
    const k = keyHere();
    const out = { there: !!k && Math.floor(k.cx / T) === at[0] && Math.floor(k.cy / T) === at[1] };
    const keys0 = g.progress.keys[g.mapId] || 0;
    p.x = at[0] * T; p.y = at[1] * T; p.fx = p.x * 256; p.fy = p.y * 256;
    step(6);
    out.counted = (g.progress.keys[g.mapId] || 0) - keys0;
    const [f, rx, ry] = g.room.key.split(',').map(Number);
    g.enterMap(g.mapId, f + 1, rx, ry, 7 * T, 9 * T, 'up', { instant: true }); step(4);
    out.upNone = !keyHere();
    g.enterMap(g.mapId, f, rx, ry, 7 * T, 9 * T, 'up', { instant: true }); step(4);
    out.back = !keyHere();
    g.slot = 2; g.save(); g.loadGame(2); step(4);
    g.enterMap(g.mapId, f, rx, ry, 7 * T, 9 * T, 'up', { instant: true }); step(4);
    out.loaded = !keyHere();
    return out;
  }, [c.k.at, c.k.from]);
  check(`${name}: after it, the key waits at ${c.k.at}`, r.there, JSON.stringify(r));
  check(`${name}: walking onto it counts one Small Key`, r.counted === 1, JSON.stringify(r));
  check(`${name}: the room above has none`, r.upNone, JSON.stringify(r));
  check(`${name}: walked out and back in, it is not there again`, r.back, JSON.stringify(r));
  check(`${name}: nor after a save and a load`, r.loaded, JSON.stringify(r));
}

// 5. (S206) A key a puzzle's reward hands out the ordinary way is not handed
// out again when the solved room is built afresh (the game reloaded): every
// such room, its key taken, then its reward re-paid silently.
const SPAWNERS = [];
for (const [mapId, m] of MAPS) {
  for (const [key, def] of Object.entries(m.roomDefs || {})) {
    const sp = def.puzzle && def.puzzle.flag && def.puzzle.reward && def.puzzle.reward.spawn;
    if (sp && sp.some(e => e[0] === 'pickup' && e[3] && e[3].kind === 'key')) SPAWNERS.push({ mapId, key, def });
  }
}
check('rooms hand out keys through their rewards', SPAWNERS.length > 0);
for (const c of SPAWNERS) {
  await enter(c.mapId, c.key, 0, [7, 5], [c.def.puzzle.flag]);
  const r = await page.evaluate(async () => {
    const g = window.__game, p = g.player, T = 16;
    const { Pickup } = await import('/src/game/objects.js');
    const step = (n) => { for (let i = 0; i < n; i++) window.__harness.step(1); if (g.dialogue) g.dialogue.active = false; g.mode = 'play'; };
    const keys = () => g.entities.filter(e => e instanceof Pickup && e.kind === 'key' && !e.remove);
    g.room._puzzleDone = false; g.checkPuzzle(); step(30);
    const first = keys().length;
    const k0 = g.progress.keys[g.mapId] || 0;
    for (const k of keys()) { p.x = k.x; p.y = k.y; p.fx = p.x * 256; p.fy = p.y * 256; step(4); }
    const took = (g.progress.keys[g.mapId] || 0) - k0;
    g.room._puzzleDone = false; g.checkPuzzle(); step(30);
    return { first, took, again: keys().length };
  });
  check(`${c.mapId} ${c.key} (${c.def.name}): its reward key, once taken, is not handed out again`,
    r.first >= 1 && r.took >= 1 && r.again === 0, JSON.stringify(r));
}

await browser.close(); server.close();
console.log(`\n=== ${pass} passed, ${fail.length} failed ===`);
process.exit(fail.length ? 1 : 0);
