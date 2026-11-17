// Scratch (S252 water comparison): enter one overworld screen at a given sea,
// optionally run a snippet that edits tiles first (`g`, `room` in scope), then
// photograph the play area (no HUD) N times, advancing STEP game frames
// between shots, so an animation can be cut into a GIF. Asserts nothing.
//
//   node tools/oneshot/shoot-water-frames.mjs <x> <y> <tide> <frames> <step> <outPrefix> [snippet] [scale]
//
// Writes <outPrefix>_00.png, _01.png ...
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');
const [X, Y, TIDE, N, STEP, PREFIX, SNIPPET = '', SCALE = '3'] = process.argv.slice(2);
if (!PREFIX) { console.log('usage: shoot-water-frames.mjs x y tide frames step outPrefix [snippet] [scale]'); process.exit(2); }
const server = createServer(async (req, res) => {
  try {
    const u = decodeURIComponent(req.url.split('?')[0]);
    const p = join(ROOT, u === '/' ? 'index.html' : u);
    res.writeHead(200, { 'Content-Type': extname(p) === '.js' ? 'text/javascript' : 'text/html' });
    res.end(await readFile(p));
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(0, r));
let browser;
try { browser = await chromium.launch(); }
catch (err) {
  const f = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium';
  if (!existsSync(f)) throw err;
  browser = await chromium.launch({ executablePath: f });
}
const page = await browser.newPage();
page.on('pageerror', e => console.log('PAGEERROR', e.message));
await page.goto(`http://localhost:${server.address().port}/index.html`);
await page.waitForFunction(() => !!window.__game);
const shots = await page.evaluate(async ([x, y, tide, n, step, snippet, scale]) => {
  const g = window.__game; g.newGame && g.newGame(); g.mode = 'play';
  g.progress.hearts = g.progress.maxHearts;
  g.enterMap('overworld', 0, x, y, -64, -64, 'down', { instant: true });
  g.tide.setLevel(tide, { instant: true });
  for (let i = 0; i < 4; i++) g.update();
  const room = g.room;
  if (snippet) (new Function('g', 'room', snippet))(g, room);
  const out = [];
  for (let k = 0; k < n; k++) {
    for (let i = 0; i < step; i++) g.update();
    if (g.dialogue) g.dialogue.active = false;
    g.bannerText = null; g.bannerTime = 0;
    g.player.x = -64; g.player.y = -64;
    g.draw();
    const c = document.createElement('canvas'); c.width = 160 * scale; c.height = 128 * scale;
    const o = c.getContext('2d'); o.imageSmoothingEnabled = false;
    o.drawImage(g.ctx.canvas, 0, 16, 160, 128, 0, 0, c.width, c.height);
    out.push(c.toDataURL('image/png'));
  }
  return out;
}, [Number(X), Number(Y), Number(TIDE), Number(N), Number(STEP), SNIPPET, Number(SCALE)]);
for (let i = 0; i < shots.length; i++) {
  const f = `${PREFIX}_${String(i).padStart(2, '0')}.png`;
  await writeFile(f, Buffer.from(shots[i].split(',')[1], 'base64'));
}
console.log('wrote', shots.length, 'frames at', PREFIX);
await browser.close(); server.close();
