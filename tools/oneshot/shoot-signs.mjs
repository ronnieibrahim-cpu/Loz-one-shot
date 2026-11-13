// Photographs signs and carvings READ FOR REAL: Link stood beside each,
// facing it, A pressed, and every page of the box captured once typed out.
// Asserts nothing (S248, the signs pass).
//
//   node tools/oneshot/shoot-signs.mjs '[[map, "f,rx,ry", tx, ty, tide, name], ...]' outDir
import { createServer } from 'node:http';
import { readFile, stat, writeFile, mkdir } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { installRuntime } from '../actor-runtime.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const [want, outDir] = [JSON.parse(process.argv[2]), process.argv[3]];
await mkdir(outDir, { recursive: true });
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
page.on('pageerror', e => console.log('PAGEERROR', e.message));
await page.goto(`http://localhost:${server.address().port}/index.html?seed=20260806`);
await page.waitForFunction(() => !!window.__game && !!window.__harness);
await page.evaluate(installRuntime);

for (const w of want) {
  const r = await page.evaluate(async ([map, key, tx, ty, tide]) => {
    const g = window.__game;
    const ent = await import('/src/game/entity.js');
    const { Player } = await import('/src/game/player.js');
    if (!g.player) g.newGame(0, 'LINK', 20260806);
    const [f, rx, ry] = key.split(',').map(Number);
    g.enterMap(map, f, rx, ry, -999, -999, 'down', { instant: true });
    g.tide.setLevel(tide, { instant: true });
    for (const [dir, ox, oy] of [['up', 0, 1], ['down', 0, -1], ['left', 1, 0], ['right', -1, 0]]) {
      const x = (tx + ox) * 16, y = (ty + oy) * 16;
      if (!g.room.inBounds(tx + ox, ty + oy)) continue;
      if (ent.canOccupy(g, new Player(x, y), x, y)) return { enter: [map, f, rx, ry, x, y, dir] };
    }
    return {};
  }, w);
  if (!r.enter) { console.log('no side to read from', w); continue; }
  const said = await page.evaluate(async ([enter, tide]) => {
    const g = window.__game, rp = window.__rp;
    rp.beginRecord({ seed: 20260806, items: {}, maxHearts: 12, hearts: 12, tide, enter }, [['wait', 4], ['tap', 'a', 1]]);
    let q; for (let i = 0; i < 400; i++) { q = rp.pump(50); if (q.done || q.error) break; }
    const shots = [];
    const grab = () => {
      g.draw();
      const src = g.screen.canvas || document.querySelector('canvas');
      const c = document.createElement('canvas'); c.width = src.width * 3; c.height = src.height * 3;
      const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(src, 0, 0, c.width, c.height);
      shots.push(c.toDataURL('image/png'));
    };
    for (let pg = 0; pg < 8 && g.dialogue.active; pg++) {
      for (let i = 0; i < 400 && g.dialogue.chars < g.dialogue.pageLen; i++) window.__harness.step(1);
      window.__harness.step(10); grab();
      if (g.dialogue.page + 1 >= g.dialogue.pages.length) break;
      g.dialogue.page++; g.dialogue.chars = 0;
    }
    return { shots, err: q && q.error };
  }, [r.enter, w[4]]);
  for (let i = 0; i < said.shots.length; i++)
    await writeFile(`${outDir}/${w[5]}-${i + 1}.png`, Buffer.from(said.shots[i].split(',')[1], 'base64'));
  console.log(w[5], 'pages', said.shots.length, said.err || '');
}
await browser.close(); server.close();
