// Run a handful of route directives in ONE room and print where they left
// the player. NOT a checker — it asserts nothing.
//
// The full playthrough is the only proof the game can be finished, and it is
// also three minutes and a hundred and eighty thousand frames long, so when a
// route step goes wrong in one room the question "does THIS work here" wants
// an answer in five seconds, not three minutes. This is that: the same
// `tools/actor-runtime.mjs` directives the route uses, the same `setup` shape
// replays and measure-boss-combat use, one room.
//
//   node tools/try-room.mjs '{"setup":{"seed":20260806,"items":{"sword":1,
//     "conch":1,"anchor":1},"equipA":"anchor","equipB":"conch","maxHearts":12,
//     "hearts":12,"tide":0,"enter":["d1",0,4,3,217,81,"left"]},
//     "steps":[["anchor",4,4,1600],["use","conch",2,140],["goto",3,8,600]]}'
//
// S137 found the Two Gauges' Piece of Heart this way — reachable, and the
// drop sweep giving up on it one pixel short.
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
const browser = await chromium.launch().catch(() =>
  chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' }));
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
const st = await page.evaluate(() => { const g = window.__game, p = g.player; return { room: g.mapId + ' ' + (g.room && g.room.key), x: p && p.x, y: p && p.y, hp: g.progress.hearts, max: g.progress.maxHearts, pc: g.progress.heartPieces, tide: g.tide.level, mode: g.mode, frozen: p && p.frozen, dlg: g.dialogue.active, show: !!g.itemShow, items: Object.keys(g.progress.items).join('+'), A: g.progress.equipA, B: g.progress.equipB, ents: g.entities.filter(e => !e.isEffect).map(e => (e.type || e.kind || e.constructor.name) + (e.kind && e.type ? ":" + e.kind : "") + '@' + Math.round(e.x) + ',' + Math.round(e.y)).join(' ') }; });
console.log(JSON.stringify(st), err ? 'ERR ' + err : '');
await browser.close(); server.close();
