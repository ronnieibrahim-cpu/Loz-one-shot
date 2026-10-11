// S185, kept for the record (asserts nothing): node docs/briefs/hole-fall/film-holes.mjs <outDir>, then python3 compose.py <dir holding holes/>. film our hole fall in the real engine (pot, block, enemy) in a Cistern room.
import { createServer } from 'node:http';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from '/home/user/Loz-one-shot/node_modules/playwright/index.mjs';
const ROOT = '/home/user/Loz-one-shot', OUT = process.argv[2];
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const full = join(ROOT, normalize(p)); const s = await stat(full).catch(() => null);
  if (!s || !s.isFile()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': extname(full) === '.html' ? 'text/html' : 'text/javascript' }); res.end(await readFile(full));
});
await new Promise(r => server.listen(0, r));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage();
page.on('pageerror', e => console.log('PAGEERROR', e.message));
await page.goto(`http://localhost:${server.address().port}/index.html?seed=20260806`);
await page.waitForFunction(() => !!window.__game);
const frames = await page.evaluate(async () => {
  const g = window.__game;
  const { spawnEntity } = await import('/src/game/entity.js');
  const { giveItem } = await import('/src/game/progress.js');
  g.newGame && g.newGame(); g.mode = 'play';
  giveItem(g.progress, 'sword'); giveItem(g.progress, 'bracelet');
  const grab = () => {
    g.bannerText = null; g.bannerTime = 0;
    g.draw();
    // Crop by place in the room: x 88..184, y 40..104 around the hole at 9..10,4..5.
    const c = document.createElement('canvas'); c.width = 96; c.height = 64;
    c.getContext('2d').drawImage(g.screen.canvas, 88 - g.camera.x, 40 - g.camera.y + 16, 96, 64, 0, 0, 96, 64);
    return c.toDataURL('image/png');
  };
  const out = {};
  const scene = (name, setup, n) => {
    g.enterMap('d4', 0, 5, 5, 7 * 16, 8 * 16, 'up', { instant: true });
    g.entities = g.entities.filter(e => e === g.player);
    g.room.override.fill(null); g.room.invalidate();
    // A 2x2 hole of the Cistern's own (the Dancing Dragon's) hole tile on open floor.
    for (const [x, y] of [[9, 4], [10, 4], [9, 5], [10, 5]]) g.room.setTile(x, y, 'dHoleCistern');
    const go = setup();
    const shots = [];
    for (let i = 0; i < n; i++) { g.update(); if (go) go(i); shots.push(grab()); }
    out[name] = shots;
  };
  scene('pot', () => {
    const p = g.player; p.x = 6 * 16; p.y = 5 * 16 - 2; p.dir = 'right';
    g.room.setTile(7, 5, 'pot');
    let lifted = false;
    out.potLog = [];
    return (i) => {
      if (i === 0) lifted = p.tryLift(g, 1);
      if (i === 30 && p.carrying) p.throwCarried(g);
      out.potLog.push([i, g.entities.filter(e => e.isEffect).map(e => e.spec.frames[0] + '@' + (e.x + 16) + ',' + (e.y + 16)).join(' ')]);
    };
  }, 110);
  scene('block', () => {
    const b = spawnEntity(g, 'block', 8, 4, {});
    const p = g.player; p.x = 7 * 16 - 10; p.y = 4 * 16; p.dir = 'right';
    return (i) => { if (i === 5) b.push(g, 1, 0); };
  }, 90);
  scene('enemy', () => {
    const e = spawnEntity(g, 'stalfos', 8, 5, {}) || spawnEntity(g, 'octorok', 8, 5, {});
    e.hp = e.maxHp = 10;
    const p = g.player; p.x = 7 * 16 - 4; p.y = 5 * 16; p.dir = 'right'; p.invuln = 999;
    return (i) => { if (i === 10) { e.x = 8 * 16 + 4; e.y = 5 * 16; e.hurt(g, 1, 'right', 22, p); } };
  }, 110);
  return out;
});
const potLog = frames.potLog; delete frames.potLog;
for (const [k, list] of Object.entries(frames))
  for (let i = 0; i < list.length; i++) await writeFile(`${OUT}/${k}-${String(i).padStart(3, '0')}.png`, Buffer.from(list[i].split(',')[1], 'base64'));
console.log(JSON.stringify(potLog.filter(x => x[1]).slice(0, 8)));
await browser.close(); server.close();
