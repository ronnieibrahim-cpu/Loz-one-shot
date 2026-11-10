// The S247 pictures: the racer's and the sailor's choice, the shop's line,
// and one room of each dungeon the enemy ladder changed. Asserts nothing.
//   node tools/oneshot/shoot-s247.mjs docs/briefs/s247
import { createServer } from 'node:http';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const out = process.argv[2] || '.';
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const full = join(ROOT, normalize(p)); const s = await stat(full).catch(() => null);
  if (!s || !s.isFile()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': extname(full) === '.html' ? 'text/html' : 'text/javascript' }); res.end(await readFile(full));
});
await new Promise(r => server.listen(0, r));
const browser = await chromium.launch().catch(() => chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }));
const page = await browser.newPage();
page.on('pageerror', e => console.log('PAGEERROR', e.message));
await page.goto(`http://localhost:${server.address().port}/index.html?seed=20260806`);
await page.waitForFunction(() => !!window.__game && !!window.__harness);
const snap = async (name) => {
  const url = await page.evaluate(() => {
    window.__game.draw();
    const src = window.__game.screen.canvas || document.querySelector('canvas');
    const c = document.createElement('canvas'); c.width = src.width * 3; c.height = src.height * 3;
    const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(src, 0, 0, c.width, c.height);
    return c.toDataURL('image/png');
  });
  await writeFile(join(out, name), Buffer.from(url.split(',')[1], 'base64'));
  console.log('wrote', name);
};
const E = (fn, arg) => page.evaluate(fn, arg);
await E(async () => {
  const g = window.__game, H = window.__harness;
  if (g.mode !== 'play') { g.newGame && g.newGame(0); }
  for (let i = 0; i < 400 && g.mode !== 'play'; i++) { if (g.dialogue.active) g.dialogue.close(); if (g.cutscene) { g.cutscene = null; g.mode = 'play'; } H.step(1); }
});
console.log('mode', await E(() => window.__game.mode));
const talk = (find) => E(async (find) => {
  const g = window.__game, H = window.__harness;
  H.step(4);
  const e = g.entities.find(x => find === 'racer' ? x.raceDef : find === 'keeper' ? x.constructor.name === 'BuoyKeeper' : x.constructor.name === 'ShopItem' && x.item === 'shield');
  e.interact(g, g.player);
  for (let i = 0; i < 900; i++) { H.step(1); const d = g.dialogue; if (d.choices && d.page >= d.pages.length - 1 && d.chars >= d.pageLen) break; if (d.active && d.chars >= d.pageLen && !(d.choices && d.page >= d.pages.length - 1)) { d.page++; d.chars = 0; d.pageLen = d.pages[d.page] ? d.pages[d.page].join('\n').length : 0; } }
  H.step(2);
}, find);
await E(() => { const g = window.__game; g.tide.setLevel(0, { instant: true }); g.enterMap('overworld', 0, 3, 9, 48, 64, 'up', { instant: true }); });
await talk('racer'); await snap('race-ask.png');
await E(async () => { const g = window.__game; g.dialogue.reset(); const P = await import('/src/game/progress.js'); P.giveItem(g.progress, 'rod', 1); g.enterMap('overworld', 0, 15, 9, 120, 56, 'up', { instant: true }); });
await talk('keeper'); await snap('buoy-ask.png');
await E(() => { const g = window.__game; g.dialogue.reset(); g.progress.rupees = 99; g.enterMap('houseShop', 0, 0, 0, 72, 96, 'up', { instant: true }); });
await talk('shop'); await snap('shop-ask.png');
for (const [name, map, f, rx, ry, x, y, tide] of [
  ['d3-beetle.png', 'd3', 1, 3, 4, 112, 120, 0],
  ['d4-wizzrobe.png', 'd4', 0, 3, 3, 112, 120, 2],
  ['d4-bubble.png', 'd4', 0, 3, 4, 112, 120, 0],
  ['d5-moblin.png', 'd5', 0, 3, 6, 112, 120, 0],
  ['d5-darknut.png', 'd5', 0, 3, 4, 112, 136, 0],
]) {
  await E(([map, f, rx, ry, x, y, tide]) => { const g = window.__game, H = window.__harness; g.dialogue.reset(); g.tide.setLevel(tide, { instant: true }); g.enterMap(map, f, rx, ry, x, y, 'up', { instant: true }); g.player.invincible = true; H.step(70); }, [map, f, rx, ry, x, y, tide]);
  await snap(name);
}
await browser.close(); server.close();
