// The bell-buoy echo (S201): the Resonance Rod rings EVERY bell in earshot,
// so the game is where you stand, and the tide decides where you can stand.
// Every room declaring `buoyRoom` claims, per buoy, the seas at which some
// place in the room rings that buoy ALONE, and one place and sea from which
// the whole bay rings at once. This proves each claim in the real engine:
//
//   1. For every buoy, a stroke of the Rod from its stated tile at each
//      stated sea rings that buoy and no other.
//   2. At every OTHER sea, no place the player can stand rings it alone. A
//      place counts if it is walkable at that sea and reachable on foot at
//      ANY sea, because the player holds the conch and may stand still while
//      the sea changes under him: the most generous reading, so a buoy this
//      cannot ring alone is one nobody can.
//   3. From the `all` tile at its sea the stroke rings every buoy, and at no
//      lower sea does any standing place ring them all.
//   4. The whole game, played: the sailor plays each round's tune, every note
//      rung back from the claims' own places at their own seas wins it, a wrong
//      note sours the round, the first full win pays the seed bag (the flag,
//      and a satchel that holds REEFSEED_CAPACITY_BAG) and a second win pays
//      rupees.
//
// Standing places come from the engine's own walkability (tools/lib/
// collision.mjs); the strokes are the engine's own ringResonance.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { installRuntime } from './actor-runtime.mjs';
import { installData } from '../src/data/index.js';
import { MAPS, getRoom } from '../src/world/maps.js';
import { tileWalkable, capsForMode, ROUTE_AVOID } from './lib/collision.mjs';
import { REEFSEED_CAPACITY_BAG } from '../src/data/feel.js';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
installData();

let passed = 0; const fail = [];
const check = (n, ok, d) => ok ? (passed++, console.log('  ok   ' + n))
  : (fail.push(n), console.log('  FAIL ' + n + (d ? ' — ' + d : '')));

const CLAIMS = [];
for (const [mapId, m] of MAPS) {
  for (const [key, def] of Object.entries(m.roomDefs || {})) {
    if (def.buoyRoom) CLAIMS.push({ mapId, key, def, b: def.buoyRoom });
  }
}
check('at least one room claims the bell-buoy echo', CLAIMS.length > 0);

const FOOT = capsForMode('foot');
/** Every cell walkable at sea `s` that the player can reach on foot at some sea. */
function standing(room) {
  const W = room.tw, H = room.th;
  const any = (x, y) => room.inBounds(x, y) && [0, 1, 2].some(t => tileWalkable(room, x, y, t, FOOT, ROUTE_AVOID));
  const seen = new Set(), q = [];
  const seed = (x, y) => { const k = x + ',' + y; if (!seen.has(k) && any(x, y)) { seen.add(k); q.push([x, y]); } };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (x === 0 || y === 0 || x === W - 1 || y === H - 1) seed(x, y);
  }
  while (q.length) {
    const [x, y] = q.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) seed(x + dx, y + dy);
  }
  return [0, 1, 2].map(s => [...seen].map(k => k.split(',').map(Number))
    .filter(([x, y]) => tileWalkable(room, x, y, s, FOOT, ROUTE_AVOID)));
}

// --- the engine ---------------------------------------------------------------
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
const errs = [];
page.on('pageerror', e => errs.push(e.message));
await page.goto(`http://localhost:${PORT}/index.html`);
await page.waitForFunction(() => window.__game && window.__harness);
await page.evaluate(installRuntime);

async function enter(mapId, key, extra = {}) {
  const [f, rx, ry] = key.split(',').map(Number);
  await page.evaluate(([setup]) => window.__rp.beginRecord(setup, [['wait', 2]]), [{
    seed: 20261021, items: { sword: 1, conch: 1, rod: 1, ...(extra.items || {}) }, equipA: 'sword', equipB: 'rod',
    maxHearts: 12, hearts: 12, tide: 1, flags: extra.flags || [], enter: [mapId, f, rx, ry, 80, 24, 'down'],
  }]);
  await page.evaluate(() => window.__rp.pump(10));
}

// In the page: stand Link on a tile's middle at a sea and strike the Rod;
// returns the notes that rang, low to high.
const STRIKE = `(async ([tx, ty, sea]) => {
  const g = window.__game, p = g.player;
  const items = await import('/src/game/items.js');
  g.dialogue.reset();
  g.tide.setLevel(sea, { instant: true });
  const ox = p.cx - p.x, oy = p.cy - p.y;
  p.x = tx * 16 + 8 - ox; p.y = ty * 16 + 8 - oy;
  const buoys = g.entities.filter(e => e.constructor.name === 'Buoy');
  for (const b of buoys) b.lit = 0;
  p.rodCool = 0;
  items.ITEMS.rod.use(g, p, 1);
  return buoys.filter(b => b.lit > 0).map(b => b.note).sort((a, b) => a - b);
})`;
const strike = (tx, ty, sea) => page.evaluate(`${STRIKE}(${JSON.stringify([tx, ty, sea])})`);

for (const c of CLAIMS) {
  const tag = `${c.mapId} ${c.key} (${c.def.name})`;
  const [f, rx, ry] = c.key.split(',').map(Number);
  const room = getRoom(c.mapId, f, rx, ry);
  const stand = standing(room);
  const notes = Object.keys(c.b.alone).map(Number);
  await enter(c.mapId, c.key);
  // The sailor plays nothing while these strokes are made.
  await page.evaluate(() => { for (const e of window.__game.entities) if (e.constructor.name === 'BuoyKeeper') e.state = 'idle'; });

  // 1 and 2
  for (const n of notes) {
    const cl = c.b.alone[n];
    for (const s of [0, 1, 2]) {
      if (cl.seas.includes(s)) {
        const okHere = stand[s].some(([x, y]) => x === cl.from[0] && y === cl.from[1]);
        const rang = await strike(cl.from[0], cl.from[1], s);
        check(`${tag}: buoy ${n} rings alone from ${cl.from} at sea ${s}`,
          okHere && rang.length === 1 && rang[0] === n, okHere ? 'rang ' + rang.join(',') : 'not a standing place');
      } else {
        const solo = [];
        for (const [x, y] of stand[s]) {
          const rang = await strike(x, y, s);
          if (rang.length === 1 && rang[0] === n) solo.push(`${x},${y}`);
        }
        check(`${tag}: buoy ${n} rings alone from nowhere at sea ${s}`, solo.length === 0, solo.join(' '));
      }
    }
  }
  // 3
  const all = c.b.all;
  const rangAll = await strike(all.from[0], all.from[1], all.sea);
  check(`${tag}: the whole bay rings from ${all.from} at sea ${all.sea}`,
    rangAll.length === notes.length, 'rang ' + rangAll.join(','));
  for (let s = 0; s < all.sea; s++) {
    const where = [];
    for (const [x, y] of stand[s]) if ((await strike(x, y, s)).length === notes.length) where.push(`${x},${y}`);
    check(`${tag}: the whole bay rings from nowhere at sea ${s}`, where.length === 0, where.join(' '));
  }

  // 4. the game, played
  const play = async (opts = {}) => page.evaluate(`(async ([claims, all, opts]) => {
    const g = window.__game, H = window.__harness;
    const keeper = g.entities.find(e => e.constructor.name === 'BuoyKeeper');
    const items = await import('/src/game/items.js');
    const p = g.player;
    const log = [];
    const read = () => { let n = 0; while (g.dialogue.active && n++ < 20) g.dialogue.close(); };
    const stand = (tx, ty, sea) => {
      g.tide.setLevel(sea, { instant: true });
      const ox = p.cx - p.x, oy = p.cy - p.y;
      p.x = tx * 16 + 8 - ox; p.y = ty * 16 + 8 - oy;
    };
    const until = (cond, max) => { for (let i = 0; i < max; i++) { if (cond()) return true; read(); H.step(1); } return cond(); };
    keeper.interact(g, p);
    read();
    for (let r = 0; r < keeper.tunes.length; r++) {
      if (!until(() => keeper.state === 'listen', 2000)) return { err: 'round ' + r + ' never reached listening: ' + keeper.state };
      const tune = keeper.tunes[r];
      for (let i = 0; i < tune.length; i++) {
        const note = tune[i];
        if (opts.sour && r === 1 && i === 1) {
          const wrong = claims[String(tune[i] === 1 ? 2 : 1)];
          stand(wrong.from[0], wrong.from[1], wrong.seas[0]);
          p.rodCool = 0; items.ITEMS.rod.use(g, p, 1); H.step(1);
          log.push('sour:' + keeper.state + ':' + keeper.round);
          return { log, state: keeper.state, round: keeper.round };
        }
        if (Array.isArray(note)) stand(all.from[0], all.from[1], all.sea);
        else { const cl = claims[String(note)]; stand(cl.from[0], cl.from[1], cl.seas[0]); }
        p.rodCool = 0; items.ITEMS.rod.use(g, p, 1);
        H.step(1);
        log.push(r + '.' + i + ':' + keeper.state + ':' + keeper.step);
      }
      read();
    }
    until(() => !g.itemShow && !g.dialogue.active, 600);
    return { log, round: keeper.round, state: keeper.state, flags: g.progress.flags,
      maxSeeds: g.progress.maxReefseeds, seeds: g.progress.reefseeds, rupees: g.progress.rupees };
  })(${JSON.stringify([c.b.alone, all, opts])})`);

  // A wrong note sours the round.
  await enter(c.mapId, c.key);
  const sour = await play({ sour: true });
  check(`${tag}: a wrong note sours the round and the sailor waits to be asked again`,
    sour.state === 'idle' && sour.round === 1, JSON.stringify(sour));

  // Before the Reefseed: the bag is a flag for later.
  await enter(c.mapId, c.key);
  const early = await play();
  check(`${tag}: the whole game is won with the claims' own strokes, before the Reefseed`,
    early.flags && early.flags.buoysWon && early.flags.seedBag && early.maxSeeds === 0, JSON.stringify(early));

  // With the Reefseed: the bag holds REEFSEED_CAPACITY_BAG and is filled.
  await enter(c.mapId, c.key, { items: { reefseed: 1 } });
  const won = await play();
  check(`${tag}: the first win pays the seed bag (${REEFSEED_CAPACITY_BAG}, filled)`,
    won.flags && won.flags.seedBag && won.maxSeeds === REEFSEED_CAPACITY_BAG && won.seeds === REEFSEED_CAPACITY_BAG,
    JSON.stringify({ max: won.maxSeeds, seeds: won.seeds }));
  const rupees = won.rupees;
  await page.evaluate(() => { window.__game.entities.find(e => e.constructor.name === 'BuoyKeeper').round = 0; });
  const again = await play();
  check(`${tag}: a second win pays 20 rupees`, again.rupees === rupees + 20, `${rupees} -> ${again.rupees}`);

  // A Reefseed found after the bag fills the bigger satchel.
  const later = await page.evaluate(async () => {
    const prog = await import('/src/game/progress.js');
    const p = { items: {}, flags: { seedBag: true }, maxReefseeds: 0, reefseeds: 0 };
    prog.giveItem(p, 'reefseed', 1);
    return p.maxReefseeds;
  });
  check(`${tag}: a Reefseed found after the bag holds ${REEFSEED_CAPACITY_BAG}`, later === REEFSEED_CAPACITY_BAG, String(later));
}

check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
await browser.close(); server.close();
console.log(`\n=== ${passed} passed, ${fail.length} failed ===`);
if (fail.length) { console.log('\nFailures:'); for (const f of fail) console.log('  - ' + f); process.exit(1); }
