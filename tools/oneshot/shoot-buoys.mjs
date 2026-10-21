// Scratch (S201): photographs the bell-buoy echo for the human. Asserts nothing.
//   node tools/oneshot/shoot-buoys.mjs outDir
import { createServer } from 'node:http';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { installRuntime } from '../actor-runtime.mjs';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = process.argv[2];
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const full = join(ROOT, normalize(p)); const s = await stat(full).catch(() => null);
  if (!s || !s.isFile()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': extname(full) === '.html' ? 'text/html' : 'text/javascript' }); res.end(await readFile(full));
});
await new Promise(r => server.listen(0, r));
const browser = await chromium.launch().catch(() => chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }));
const page = await browser.newPage();
await page.goto(`http://localhost:${server.address().port}/index.html`);
await page.waitForFunction(() => window.__game && window.__harness);
await page.evaluate(installRuntime);
const snap = async (name) => {
  const url = await page.evaluate(() => {
    const src = window.__game.screen.canvas || document.querySelector('canvas');
    const c = document.createElement('canvas'); c.width = src.width * 3; c.height = src.height * 3;
    const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(src, 0, 0, c.width, c.height);
    return c.toDataURL('image/png');
  });
  await writeFile(join(OUT, name), Buffer.from(url.split(',')[1], 'base64'));
  console.log('wrote', name);
};
const enter = async (tide, px, py, items = {}) => {
  await page.evaluate(([s]) => window.__rp.beginRecord(s, [['wait', 2]]), [{ seed: 20261021,
    items: { sword: 1, conch: 1, rod: 1, ...items }, equipA: 'sword', equipB: 'rod', maxHearts: 12, hearts: 12,
    tide, enter: ['overworld', 0, 15, 9, px, py, 'down'] }]);
  await page.evaluate(() => window.__rp.pump(10));
};
const run = (src) => page.evaluate(`(async () => { const g = window.__game, H = window.__harness, p = g.player;
  const items = await import('/src/game/items.js');
  const K = g.entities.find(e => e.constructor.name === 'BuoyKeeper');
  const stand = (tx, ty, sea) => { g.tide.setLevel(sea, { instant: true }); const ox = p.cx - p.x, oy = p.cy - p.y; p.x = tx * 16 + 8 - ox; p.y = ty * 16 + 8 - oy; };
  const ring = () => { p.rodCool = 0; items.ITEMS.rod.use(g, p, 1); };
  ${src} })()`);
// 1. The sailor playing his first tune, at MID, Link beside him.
await enter(1, 112, 40);
await run(`p.dir = 'right'; K.interact(g, p); for (let i = 0; i < 6; i++) H.step(1);`);
await snap('1-ask.png');
await run(`g.dialogue.close(); for (let i = 0; i < 46; i++) H.step(1);`);
await snap('2-tune.png');
// 2. Buoy 3 alone, from the spit's tip at LOW.
await enter(0, 80, 40);
await run(`stand(5, 5, 0); p.dir = 'left'; for (let i = 0; i < 10; i++) H.step(1); ring(); for (let i = 0; i < 6; i++) H.step(1);`);
await snap('3-low-spit.png');
// 3. Buoy 5 alone, wading the channel at MID.
await enter(1, 80, 40);
await run(`stand(7, 5, 1); p.dir = 'down'; for (let i = 0; i < 10; i++) H.step(1); ring(); for (let i = 0; i < 6; i++) H.step(1);`);
await snap('4-mid-channel.png');
// 4. The whole bay at HIGH.
await enter(2, 80, 40);
await run(`stand(5, 1, 2); p.dir = 'down'; for (let i = 0; i < 10; i++) H.step(1); ring(); for (let i = 0; i < 6; i++) H.step(1);`);
await snap('5-high-all.png');
await browser.close(); server.close();
