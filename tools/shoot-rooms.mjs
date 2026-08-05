// Screenshot named overworld/dungeon rooms in their real in-game palettes.
//
// `preview.mjs` renders a whole pack in ONE palette, so it proves silhouette
// and nothing about colour. Every terrain fault this project has hit — the
// blotchy dungeon floor, the wall-textured "floor" tile, the ledge that
// vanished into the Drowned Wood's greens — validated clean and previewed
// fine, and was only visible in a real room. This is that check.
//
//   node tools/shoot-rooms.mjs                       # a default sample
//   node tools/shoot-rooms.mjs overworld,4,7 d1,0,4,2   # explicit rooms
//   node tools/shoot-rooms.mjs --tide=2 overworld,4,7
//
// Room spec is `mapId,rx,ry` for floor 0, or `mapId,floor,rx,ry`. The overworld
// map id is **'overworld'** — the '0' in a room key like '0,4,7' is the FLOOR,
// not the map. Two ways to get this wrong, both of which produce a perfectly
// good screenshot of the wrong room:
//   * enterMap is (mapId, FLOOR, rx, ry, ...) — the floor is the SECOND
//     argument; passing rx there lands you somewhere else entirely.
//   * an unknown map id is a no-op, leaving you in the previous room.
// So this asserts the room it landed in is the room it asked for, and exits
// non-zero otherwise. Without that check every shot below was the village.

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { mkdirSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
               '.png': 'image/png', '.json': 'application/json' };

const args = process.argv.slice(2);
const shotDir = (args.find(a => a.startsWith('--shot-dir=')) || '').split('=')[1]
  || join(ROOT, 'tools/shots');
const tide = Number((args.find(a => a.startsWith('--tide=')) || '=1').split('=')[1]);
const specs = args.filter(a => !a.startsWith('--'));
const ROOMS = specs.length ? specs : [
  'overworld,4,7',                    // Tidewatch Village — plain grass
  'overworld,5,7', 'overworld,4,8', 'overworld,6,7',
  'overworld,5,4', 'overworld,6,4',   // Drowned Wood — grassDark/flowersDark
  'overworld,1,8', 'overworld,1,7',   // Sunken Marsh — grassDark/flowersDark
];

const server = createServer(async (req, res) => {
  try {
    const p = join(ROOT, decodeURIComponent(req.url.split('?')[0]) === '/' ? 'index.html'
      : decodeURIComponent(req.url.split('?')[0]));
    const buf = await readFile(p);
    res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' });
    res.end(buf);
  } catch { res.writeHead(404); res.end('nope'); }
});
await new Promise(r => server.listen(0, r));
const port = server.address().port;

mkdirSync(shotDir, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 480, height: 432 } });
const errors = [];
const misses = [];
page.on('pageerror', e => errors.push(String(e)));
await page.goto(`http://localhost:${port}/index.html`);
await page.waitForFunction(() => !!window.__game, { timeout: 15000 });

const frames = (n) => page.evaluate((k) => new Promise(res => {
  const start = window.__game.frame;
  const tick = () => (window.__game.frame - start >= k) ? res(window.__game.frame) : requestAnimationFrame(tick);
  tick();
}), n);

// New game, then skip the intro cutscene — otherwise every shot is the title.
await page.keyboard.press('Enter'); await frames(6);
await page.keyboard.press('Enter'); await frames(20);
for (let i = 0; i < 140 && await page.evaluate(() => window.__game.mode === 'cutscene'); i++) {
  await page.keyboard.press(i % 2 ? 'Enter' : 'x'); await frames(4);
}

for (const spec of ROOMS) {
  const parts = spec.split(',');
  const [mapId, floor, rx, ry] = parts.length === 4
    ? [parts[0], +parts[1], +parts[2], +parts[3]]
    : [parts[0], 0, +parts[1], +parts[2]];
  const got = await page.evaluate(([mapId, floor, rx, ry, tide]) => {
    const g = window.__game;
    // Reset to 'play' first: a probe parked in a room that killed the player
    // leaves the game in 'gameover', where nothing renders or updates.
    g.mode = 'play';
    g.enterMap(mapId, floor, rx, ry, 80, 72, 'down', { instant: true });
    if (g.tide && g.tide.setLevel) g.tide.setLevel(tide);
    if (g.room) g.room.invalidate();
    return g.room ? { name: g.room.name || '?', at: g.mapId + ',' + g.room.key } : null;
  }, [mapId, floor, rx, ry, tide]);
  await frames(8);
  // An open dialogue freezes everything while mode is still 'play'. Clear it
  // LAST, after the room has settled — a room script can reopen it during the
  // settle.
  await page.evaluate(() => {
    if (window.__game.dialogue) window.__game.dialogue.active = false;
    // The room-name banner is drawn for 120 frames after every enterMap and
    // covers the top third of the room, which is terrain we came here to look at.
    window.__game.bannerTime = 0;
  });
  await frames(2);
  const name = `room-${spec.replace(/,/g, '_')}-tide${tide}.png`;
  const want = `${mapId},${floor},${rx},${ry}`;
  if (!got || got.at !== want) {
    console.log(`  MISS ${spec.padEnd(16)} asked ${want}, landed ${got ? got.at : 'nowhere'}`);
    misses.push(spec);
    continue;
  }
  await page.locator('canvas').screenshot({ path: join(shotDir, name) });
  console.log(`  ok   ${spec.padEnd(16)} ${got.name} -> ${name}`);
}

await browser.close();
server.close();
if (misses.length) {
  console.log(`\n${misses.length} room(s) not entered: ${misses.join(' ')}`);
  process.exit(1);
}
if (errors.length) {
  console.log(`\n${errors.length} page error(s):`);
  for (const e of errors.slice(0, 5)) console.log('  ' + e);
  process.exit(1);
}
console.log(`\nwrote ${ROOMS.length} shot(s) to ${shotDir}`);
