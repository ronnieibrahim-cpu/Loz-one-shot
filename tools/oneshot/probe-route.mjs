// Drop the actor into any room, with any items, and run a list of directives.
//
//   node tools/oneshot/probe-route.mjs '<json setup>' '<json steps>'
//
// `setup` is `beginRecord`'s setup object (tools/actor-runtime.mjs `boot`) and
// `steps` is a list of directives, so this is `tools/measure-boss-combat.mjs`
// with the boss taken out. It exists because extending
// `tools/playthrough-route.mjs` any other way means re-running twenty-five
// thousand frames from the title screen to find out whether one goto works.
//
// It ASSERTS NOTHING and always exits 0. It prints the room, the health and
// the tide every time any of them changes, plus a final dump that includes the
// room's live entity list — which is how "the Piece of Heart settles at y=27
// and the player's box starts at y=41" was found.
//
// A oneshot: not in CLAUDE.md's table, not run by anything, and safe to delete
// once the routes it was written for are recorded.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { installRuntime } from '../actor-runtime.mjs';
const ROOT = '/home/user/Loz-one-shot';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
function serve(port) {
  const server = createServer(async (req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const full = join(ROOT, normalize(p).replace(/^(\.\.[/\\])+/, ''));
    const s = await stat(full).catch(() => null);
    if (!s || !s.isFile()) { res.writeHead(404).end('nf'); return; }
    res.writeHead(200, { 'Content-Type': MIME[extname(full)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(await readFile(full));
  });
  return new Promise(r => server.listen(port, () => r(server)));
}
const { chromium } = await import('playwright');
const PORT = 20000 + Math.floor(Math.random() * 20000);
const server = await serve(PORT);
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' }).catch(() => chromium.launch({ headless: true }));
const page = await browser.newPage({ viewport: { width: 800, height: 720 } });
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR: ' + (e.stack || e.message)));
await page.goto(`http://localhost:${PORT}/index.html?seed=20260806`, { waitUntil: 'load' });
await page.waitForFunction(() => !!window.__game && !!window.__harness, { timeout: 20000 });
await page.evaluate(installRuntime);
const setup = JSON.parse(process.argv[2]);
const steps = JSON.parse(process.argv[3]);
await page.evaluate(([a, b]) => window.__rp.beginRecord(a, b), [setup, steps]);
let done = false, err = null, guard = 0;
const trail = [];
while (!done && guard++ < 4000) {
  let r;
  try { r = await page.evaluate(n => window.__rp.pump(n), 20); }
  catch (e) { err = String(e.message || e).split('\n')[0]; break; }
  done = r.done; if (r.error) { err = String(r.error); break; }
  const st = await page.evaluate(() => {
    const g = window.__game;
    return { room: g.mapId + '/' + (g.room ? g.room.key : '?'), f: g.frame, qh: g.progress.hearts, tide: g.tide.level,
             keys: g.progress.keys, mode: g.mode, items: undefined };
  });
  const last = trail[trail.length - 1];
  if (!last || last.room !== st.room || last.qh !== st.qh) trail.push(st);
}
console.log(JSON.stringify(trail, null, 0).replace(/\},\{/g, '}\n{'));
const fin = await page.evaluate(() => {
  const g = window.__game;
  return { room: g.mapId + '/' + (g.room ? g.room.key : '?'), f: g.frame, qh: g.progress.hearts, tide: g.tide.level,
           keys: g.progress.keys, bossKey: !!(g.progress.bossKeys && g.progress.bossKeys[g.mapId]),
           essences: g.progress.essences, pieces: g.progress.heartPieces, maxHearts: g.progress.maxHearts, beaten: g.progress.beaten, px: g.player && g.player.x, py: g.player && g.player.y, ents: g.entities.map(e => e.constructor.name + ':' + (e.kind||e.type||'') + '@' + e.x + ',' + e.y) };
});
console.log('FINAL', JSON.stringify(fin));
if (err) console.log('ERROR', err);
if (errs.length) console.log('PAGE', errs.slice(0, 3).join('\n'));
await browser.close(); server.close();
