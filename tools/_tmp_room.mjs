// Scratch: run a few route directives in one room and report state.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { installRuntime } from './actor-runtime.mjs';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const spec = JSON.parse(process.argv[2]);
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const full = join(ROOT, normalize(p)); const s = await stat(full).catch(() => null);
  if (!s || !s.isFile()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': extname(full) === '.html' ? 'text/html' : 'text/javascript' }); res.end(await readFile(full));
});
const PORT = 30000 + Math.floor(Math.random() * 20000);
await new Promise(r => server.listen(PORT, r));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage();
page.on('pageerror', e => console.log('PAGEERROR', e.message));
await page.goto(`http://localhost:${PORT}/index.html?seed=20260806`);
await page.waitForFunction(() => !!window.__game && !!window.__harness);
await page.evaluate(installRuntime);
await page.evaluate(([setup, steps]) => window.__rp.beginRecord(setup, steps), [spec.setup, spec.steps]);
let r, err = null;
for (let i = 0; i < 4000; i++) {
  try { r = await page.evaluate(n => window.__rp.pump(n), 50); } catch (e) { err = e.message.split('\n')[0]; break; }
  if (r.done || r.error) { if (r.error) err = r.error; break; }
}
const st = await page.evaluate(() => { const g = window.__game, p = g.player; return { room: g.mapId + ' ' + (g.room && g.room.key), x: p && p.x, y: p && p.y, hp: g.progress.hearts, max: g.progress.maxHearts, pc: g.progress.heartPieces, tide: g.tide.level, ents: g.entities.filter(e => !e.isEffect).map(e => (e.type || e.kind || e.constructor.name) + '@' + Math.round(e.x) + ',' + Math.round(e.y)).join(' ') }; });
console.log(JSON.stringify(st), err ? 'ERR ' + err : '');
await browser.close(); server.close();
