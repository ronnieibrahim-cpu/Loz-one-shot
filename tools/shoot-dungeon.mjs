// Photograph a whole dungeon floor, every room drawn whole in its real
// palette and laid out where the map puts it. NOT a checker — it asserts
// nothing. S160 wrote it to show the human each optional dungeon as a map.
//
//   node tools/shoot-dungeon.mjs <mapId> <out.png> [--floor=0] [--tide=1] [--scale=2]
//
// Each room is entered in the real engine (entities spawned, a few frames run
// so torches, enemies and water are drawn as the game draws them), then painted
// through `Game.drawScene` into a canvas the room's own size — the same way
// tools/guide/capture.mjs takes a `whole` shot — with Link left out. Rooms are
// placed on a grid of Oracle cells; an empty cell stays dark.
import { createServer } from 'node:http';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { installRuntime } from './actor-runtime.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [mapId, out] = process.argv.slice(2).filter(a => !a.startsWith('--'));
const opt = (k, d) => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? Number(a.split('=')[1]) : d; };
const FLOOR = opt('floor', 0), TIDE = opt('tide', 1), SCALE = opt('scale', 2);
if (!mapId || !out) { console.error('usage: shoot-dungeon.mjs <mapId> <out.png> [--floor=0] [--tide=1] [--scale=2]'); process.exit(2); }

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

const url = await page.evaluate(async ([mapId, floor, tide, scale]) => {
  const g = window.__game;
  window.__harness.takeOver();
  g.newGame(0, 'LINK', 20260930);
  g.cutscene = null; g.mode = 'play'; g.dialogue.active = false;
  const { MAPS } = await import('/src/world/maps.js');
  const m = MAPS.get(mapId);
  const [CW, CH] = m.cell || [10, 8];
  const keys = Object.keys(m.roomDefs).filter(k => Number(k.split(',')[0]) === floor);
  let maxX = 0, maxY = 0;
  for (const k of keys) {
    const [, rx, ry] = k.split(',').map(Number);
    const [sw, sh] = m.roomDefs[k].size || [1, 1];
    maxX = Math.max(maxX, rx + sw); maxY = Math.max(maxY, ry + sh);
  }
  const PAD = 4;
  const big = document.createElement('canvas');
  big.width = maxX * (CW * 16 + PAD) * scale; big.height = maxY * (CH * 16 + PAD) * scale;
  const bctx = big.getContext('2d'); bctx.imageSmoothingEnabled = false;
  bctx.fillStyle = '#101018'; bctx.fillRect(0, 0, big.width, big.height);
  for (const k of keys) {
    const [f, rx, ry] = k.split(',').map(Number);
    g.tide.setLevel(tide, { instant: true });
    g.enterMap(mapId, f, rx, ry, 7 * 16, 5 * 16, 'down', { instant: true });
    g.dialogue.active = false; g.bannerTime = 0;
    for (let i = 0; i < 20; i++) window.__harness.step(1);
    g.dialogue.active = false;
    const r = g.room;
    const c = document.createElement('canvas'); c.width = r.pw; c.height = r.ph;
    const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false;
    const p = g.player; g.player = null;
    g.drawScene(ctx, 0, 0);
    g.player = p;
    bctx.drawImage(c, rx * (CW * 16 + PAD) * scale, ry * (CH * 16 + PAD) * scale, r.pw * scale, r.ph * scale);
  }
  return big.toDataURL('image/png');
}, [mapId, FLOOR, TIDE, SCALE]);
await writeFile(out, Buffer.from(url.split(',')[1], 'base64'));
console.log('wrote ' + out);
await browser.close(); server.close();
