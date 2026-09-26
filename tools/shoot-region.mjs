// Photograph a RECTANGLE OF OVERWORLD SCREENS stitched into one picture, the
// way the source games' map sheets show a town. NOT a checker — it asserts
// nothing. Each screen is entered in the real engine at the given tide, its
// entities spawned and settled, and the play area (no HUD) cut out and laid
// at its place in the grid.
//
//   node tools/shoot-region.mjs <x0> <y0> <x1> <y1> <out.png> [tide] [scale]
//
// S157 wrote it to put Tidewatch beside Horon Village for the human.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const [x0, y0, x1, y1] = process.argv.slice(2, 6).map(Number);
const OUT = process.argv[6];
const TIDE = Number(process.argv[7] ?? 1);
const SCALE = Number(process.argv[8] ?? 1);
if (!OUT) { console.log('usage: shoot-region.mjs x0 y0 x1 y1 out.png [tide] [scale]'); process.exit(2); }
const server = createServer(async (req, res) => {
  try {
    const u = decodeURIComponent(req.url.split('?')[0]);
    const p = join(ROOT, u === '/' ? 'index.html' : u);
    res.writeHead(200, { 'Content-Type': extname(p) === '.js' ? 'text/javascript' : 'text/html' });
    res.end(await readFile(p));
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(0, r));
async function launch() {
  try { return await chromium.launch(); }
  catch (err) {
    const f = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium';
    if (!existsSync(f)) throw err;
    return chromium.launch({ executablePath: f });
  }
}
const browser = await launch();
const page = await browser.newPage();
await page.goto(`http://localhost:${server.address().port}/index.html`);
await page.waitForFunction(() => !!window.__game);
const png = await page.evaluate(async ([x0, y0, x1, y1, tide, scale]) => {
  const g = window.__game; g.newGame && g.newGame(); g.mode = 'play';
  const W = 160, H = 128, TOP = 16;
  const out = document.createElement('canvas');
  out.width = (x1 - x0 + 1) * W * scale; out.height = (y1 - y0 + 1) * H * scale;
  const o = out.getContext('2d'); o.imageSmoothingEnabled = false;
  o.fillStyle = '#000'; o.fillRect(0, 0, out.width, out.height);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    try {
      g.enterMap('overworld', 0, x, y, -64, -64, 'down', { instant: true });
      if (g.room.key !== `0,${x},${y}`) continue;
      g.tide.setLevel(tide, { instant: true });
      for (let i = 0; i < 4; i++) g.update();
      if (g.dialogue) g.dialogue.active = false;
      g.bannerText = null; g.bannerTime = 0;
      g.player.x = -64; g.player.y = -64;
      g.draw();
      o.drawImage(g.ctx.canvas, 0, TOP, W, H, (x - x0) * W * scale, (y - y0) * H * scale, W * scale, H * scale);
    } catch (e) { /* a missing screen stays black */ }
  }
  return out.toDataURL('image/png');
}, [x0, y0, x1, y1, TIDE, SCALE]);
await writeFile(OUT, Buffer.from(png.split(',')[1], 'base64'));
console.log('wrote', OUT);
await browser.close(); server.close();
