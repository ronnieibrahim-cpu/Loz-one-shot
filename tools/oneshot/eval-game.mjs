// Run a snippet in the live game (as `g`, with `H` the harness, `await` allowed)
// and print what it returns as JSON. Asserts nothing (S248).
//   node tools/oneshot/eval-game.mjs '<js>'
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const [src] = process.argv.slice(2);
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
const res = await page.evaluate(async (src) => {
  const g = window.__game, H = window.__harness; H.takeOver();
  return await (new Function('g', 'H', `return (async () => { ${src} })()`))(g, H);
}, src);
console.log(JSON.stringify(res));
await browser.close(); server.close();
