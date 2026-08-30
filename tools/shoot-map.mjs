// Screenshot the MAP SCREEN — the pause menu's MAP tab — in a named state.
//
// Every other shot tool in here points at the world. Nothing pointed at the
// menu, so the one screen a player opens most had no way of being looked at,
// and `T53` is explicit that assertions prove existence and never appearance.
// S8 redraws the overworld map and must prove the DUNGEON map is untouched;
// that proof is a before/after picture and it cannot exist without this.
//
//   node tools/shoot-map.mjs                        # the default set
//   node tools/shoot-map.mjs --shot-dir=tools/shots-map-before
//   node tools/shoot-map.mjs overworld:full d1:0:chart
//
// A spec is `mapId:state` for the overworld or `mapId:floor:state` for a
// dungeon. States:
//   none     nothing seen, no map item, no chart — what a new game shows
//   part     a plausible mid-game slice of the map seen
//   full     every room seen
//   map      dungeon only: the floor's Map found, so unseen rooms draw too
//   chart    dungeon only: Map + Chartstone, so the tide pips draw
//
// The player is placed in the map being shot, because "you are here" is one of
// the three things the overworld map says and a shot without it proves less.

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { mkdirSync, existsSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
               '.png': 'image/png', '.json': 'application/json' };

const args = process.argv.slice(2);
const shotDir = (args.find(a => a.startsWith('--shot-dir=')) || '').split('=')[1]
  || join(ROOT, 'tools/shots-map');
const specs = args.filter(a => !a.startsWith('--'));
// The default set is exactly what S8's prompt asks to be shown: the overworld
// at three exploration states, and the dungeon map in the two states that
// carry its two good features (multi-screen spanning, and the Chartstone
// pips) so a regression in either is visible rather than argued about.
const SHOTS = specs.length ? specs : [
  'overworld:none', 'overworld:part', 'overworld:full',
  'd1:0:map', 'd1:0:chart', 'd2:0:chart',
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
async function launchChromium() {
  try { return await chromium.launch(); }
  catch (err) {
    const fallback = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium';
    if (!existsSync(fallback)) throw err;
    return await chromium.launch({ executablePath: fallback });
  }
}
const browser = await launchChromium();
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

await page.keyboard.press('Enter'); await frames(6);
await page.keyboard.press('Enter'); await frames(20);
for (let i = 0; i < 140 && await page.evaluate(() => window.__game.mode === 'cutscene'); i++) {
  await page.keyboard.press(i % 2 ? 'Enter' : 'x'); await frames(4);
}

for (const spec of SHOTS) {
  const parts = spec.split(':');
  const [mapId, floor, state] = parts.length === 3
    ? [parts[0], +parts[1], parts[2]]
    : [parts[0], 0, parts[1]];

  const got = await page.evaluate(async ([mapId, floor, state]) => {
    const g = window.__game;
    g.mode = 'play';

    // Read the real map registry rather than a copy of it — same rule as a
    // checker calling the engine's own collision code. `test.mjs` reaches into
    // src the same way.
    const { getMap } = await import('/src/world/maps.js');
    const def = getMap(mapId);
    if (!def) return { err: 'no such map: ' + mapId };
    let start = null;
    for (let y = 0; y < def.h && !start; y++) {
      for (let x = 0; x < def.w; x++) {
        const key = floor + ',' + x + ',' + y;
        if (def.roomDefs[key]) { start = [x, y]; break; }
      }
    }
    if (!start) return { err: 'no room on floor ' + floor + ' of ' + mapId };
    g.enterMap(mapId, floor, start[0], start[1], 80, 72, 'down', { instant: true });

    // Wipe every seen-flag for this map first, so a state is the state asked
    // for and not that state plus whatever the previous shot left behind.
    for (const k of Object.keys(g.progress.secrets)) {
      if (k.startsWith('seen:' + mapId + ':')) delete g.progress.secrets[k];
    }
    delete g.progress.dungeonMaps[mapId];
    delete g.progress.charts[mapId];

    const mark = (x, y) => { g.progress.secrets['seen:' + mapId + ':' + floor + ',' + x + ',' + y] = true; };
    if (state === 'part') {
      // A contiguous blob around the start, which is what real exploration
      // looks like — a scatter of unconnected cells would flatter any drawing
      // that only has to fill isolated squares.
      for (let y = 0; y < def.h; y++) {
        for (let x = 0; x < def.w; x++) {
          if (Math.abs(x - start[0]) + Math.abs(y - start[1]) <= 4) mark(x, y);
        }
      }
    } else if (state !== 'none') {
      for (let y = 0; y < def.h; y++) for (let x = 0; x < def.w; x++) mark(x, y);
    }
    if (state === 'map' || state === 'chart') g.progress.dungeonMaps[mapId] = true;
    if (state === 'chart') { g.progress.dungeonMaps[mapId] = true; g.progress.charts[mapId] = true; }

    return { at: g.mapId + ',' + (g.room ? g.room.key : '?'), w: def.w, h: def.h };
  }, [mapId, floor, state]);

  if (got && got.err) { console.log(`  MISS ${spec.padEnd(18)} ${got.err}`); misses.push(spec); continue; }
  await frames(20);

  // Open the menu and land on MAP. `open()` always resets to tab 0, so the tab
  // is set after it, not before.
  await page.evaluate((floor) => {
    const g = window.__game;
    if (g.dialogue) g.dialogue.active = false;
    g.bannerTime = 0;
    g.menu.open();
    g.menu.tab = 1;
    g.menu.mapFloor = floor;
  }, floor);
  await frames(4);

  const mode = await page.evaluate(() => window.__game.mode + ':' + window.__game.menu.tab);
  if (mode !== 'menu:1') {
    console.log(`  MISS ${spec.padEnd(18)} menu did not open on the map tab (got ${mode})`);
    misses.push(spec);
    continue;
  }

  const name = `map-${spec.replace(/:/g, '_')}.png`;
  await page.locator('canvas').screenshot({ path: join(shotDir, name) });
  console.log(`  ok   ${spec.padEnd(18)} ${got.w}x${got.h} at ${got.at} -> ${name}`);

  // Back to play, so the next shot starts from a known mode.
  await page.evaluate(() => { window.__game.mode = 'play'; });
  await frames(2);
}

await browser.close();
server.close();
if (errors.length) {
  console.log(`\n${errors.length} page error(s):`);
  for (const e of errors.slice(0, 5)) console.log('  ' + e);
  process.exit(1);
}
if (misses.length) {
  console.log(`\n${misses.length} shot(s) failed: ${misses.join(' ')}`);
  process.exit(1);
}
console.log(`shoot-map: ${SHOTS.length} shots -> ${shotDir}`);
