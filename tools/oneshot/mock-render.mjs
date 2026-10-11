// Render named rooms of d5 as they are NOW in the data, at a stated sea, with
// stakes from above set in the save (`doors`) or pillars stood in the room,
// and optionally Link at a tile: the S187 mock of K4 and K5 (see
// docs/briefs/d5-mock2/). NOT a checker — it asserts nothing.
//
//   node tools/oneshot/mock-render.mjs <shots.json> <outDir>
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const server = createServer(async (req, res) => { try { const u = decodeURIComponent(req.url.split('?')[0]); const p = join(ROOT, u === '/' ? 'index.html' : u); res.writeHead(200, { 'Content-Type': extname(p) === '.js' ? 'text/javascript' : 'text/html' }); res.end(await readFile(p)); } catch { res.writeHead(404); res.end(); } });
await new Promise(r => server.listen(0, r));
const browser = await chromium.launch().catch(() => chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' }));
const page = await browser.newPage();
page.on('pageerror', e => console.log('ERR', String(e)));
await page.goto(`http://localhost:${server.address().port}/index.html`);
await page.waitForFunction(() => !!window.__game);
const shots = JSON.parse(await readFile(process.argv[2], 'utf8'));
const outDir = process.argv[3];
for (const s of shots) {
  const url = await page.evaluate(async (s) => {
    const g = window.__game; window.__harness.takeOver();
    g.newGame(0, 'LINK', 20260930); g.cutscene = null; g.mode = 'play'; g.dialogue.active = false;
    const { setFlag } = await import('/src/game/progress.js');
    for (const k of s.doors || []) g.progress.doors[k] = 'coralPillar';
    for (const f of s.flags || []) g.progress.flags[f] = true;
    const [f, rx, ry] = s.room.split(',').map(Number);
    g.tide.setLevel(s.tide, { instant: true });
    const [lx, ly] = s.link || [7, 5];
    g.enterMap('d5', f, rx, ry, lx * 16, ly * 16 - 4, s.dir || 'down', { instant: true });
    g.dialogue.active = false; g.bannerTime = 0; g.fadeDir = 0; g.fadeThen = null;
    if (!s.enemies) g.entities = g.entities.filter(e => !e.isEnemy);
    const pu = g.player.update; g.player.update = () => {};
    for (let i = 0; i < 20; i++) window.__harness.step(1);
    g.player.update = pu; g.dialogue.active = false; g.bannerTime = 0;
    for (const [x, y] of s.pillars || []) g.room.setTile(x, y, 'coralPillar');
    const r = g.room;
    const c = document.createElement('canvas'); c.width = r.pw; c.height = r.ph;
    const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false;
    const p = g.player; if (!s.link) g.player = null;
    g.drawScene(ctx, 0, 0); g.player = p;
    return c.toDataURL('image/png');
  }, s);
  await writeFile(join(outDir, s.out), Buffer.from(url.split(',')[1], 'base64'));
  console.log('wrote', s.out);
}
await browser.close(); server.close();
