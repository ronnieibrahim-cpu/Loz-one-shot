// S252: the Coral Spire's Mirror Cell in the real game, at LOW and MID, after
// three pushes, and solved. Asserts nothing.
//   node tools/oneshot/shoot-s252-mirror.mjs docs/briefs/s252/built
import { createServer } from 'node:http';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { installRuntime } from '../actor-runtime.mjs';
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
await page.goto(`http://localhost:${server.address().port}/index.html`);
await page.waitForFunction(() => window.__game && window.__harness);
await page.evaluate(installRuntime);
const push = (x, y) => [['goto', x, y, 600], ['hold', ['right'], 30], ['wait', 40]];
const stages = {
  'd2-mirror-1-low.png': [['goto', 7, 3, 600]],
  'd2-mirror-2-mid.png': [['tide', 1], ['goto', 7, 3, 600]],
  'd2-mirror-3-three-pushes-low.png': [...push(4, 7), ...push(5, 7), ...push(6, 7), ['goto', 7, 3, 600]],
  'd2-mirror-4-solved-mid.png': [...push(4, 7), ...push(5, 7), ...push(6, 7), ['tide', 1], ...push(7, 7), ['goto', 7, 3, 600], ['wait', 60]],
};
for (const [name, steps] of Object.entries(stages)) {
  const setup = { seed: 20261025, items: { sword: 1, conch: 1, cleats: 1 }, equipA: 'conch', equipB: 'sword',
    maxHearts: 24, hearts: 24, tide: 0, enter: ['d2', 0, 1, 5, 13 * 16, 5 * 16, 'left'] };
  const url = await page.evaluate(async ([setup, plan]) => {
    window.__rp.beginRecord(setup, [['wait', 4], ...plan, ['wait', 20]]);
    const g = window.__game;
    for (let i = 0; i < 4; i++) window.__rp.pump(1);
    for (const e of g.entities) if (e.isEnemy) e.remove = true;
    g.player.invuln = 1e6;
    for (let n = 0; n < 400 && !window.__rp.pump(100).done; n++);
    g.draw();
    const src = g.screen.canvas || document.querySelector('canvas');
    const c = document.createElement('canvas'); c.width = src.width * 3; c.height = src.height * 3;
    const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(src, 0, 0, c.width, c.height);
    return c.toDataURL('image/png');
  }, [setup, steps]);
  await writeFile(join(out, name), Buffer.from(url.split(',')[1], 'base64'));
  console.log('wrote', name);
}
await browser.close(); server.close();
