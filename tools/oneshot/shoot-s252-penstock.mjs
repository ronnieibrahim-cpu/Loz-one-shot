// The S252 Penstock pictures (d4 0,1,6): LOW, MID, solved. Asserts nothing.
//   node tools/oneshot/shoot-s252-penstock.mjs docs/briefs/s252/built
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
const enter = (tide, px, py, dir) => E(([tide, px, py, dir]) => { const g = window.__game, H = window.__harness; g.dialogue.reset(); g.tide.clearOverrides(); g.tide.setLevel(tide, { instant: true }); g.enterMap('d4', 0, 1, 6, px * 16, py * 16, dir, { instant: true }); g.player.invincible = true; for (const e of g.entities) if (e.isEnemy) e.remove = true; H.step(70); }, [tide, px, py, dir]);
await enter(0, 13, 5, 'left'); await snap('d4-penstock-low.png');
await enter(1, 13, 5, 'left'); await snap('d4-penstock-mid.png');
// solved: door opened, block slid out at LOW, caught, floated north at MID
await enter(0, 13, 5, 'left');
await E(() => { const g = window.__game, H = window.__harness; g.applyReward({ openDoors: [[10, 8]] }); H.step(4);
  const b = g.entities.find(e => e.isIceBlock); b.push(g, -1, 0); H.step(200); });
await E(() => { const g = window.__game, H = window.__harness; g.player.x = 8 * 16; g.player.y = 9 * 16; g.player.dir = 'up'; H.step(2); });
await snap('d4-penstock-low-caught.png');
await E(() => { const g = window.__game, H = window.__harness; g.tide.setLevel(1, { instant: true }); H.step(4);
  const b = g.entities.find(e => e.isIceBlock); b.push(g, 0, -1); H.step(300); g.player.x = 9 * 16; g.player.y = 4 * 16; H.step(80); });
await snap('d4-penstock-solved.png');
console.log(await E(() => { const g = window.__game; return JSON.stringify({ done: !!g.room._puzzleDone, flag: g.progress.flags.d4_penstock, pickups: g.entities.filter(e => e.constructor.name === 'Pickup').length }); }));
await browser.close(); server.close();
