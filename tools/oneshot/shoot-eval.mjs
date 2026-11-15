// Run a snippet in the live game (as `g`, with `H` the harness, `await` allowed)
// and save the canvas at 3x after it. Asserts nothing (S248).
//   node tools/oneshot/shoot-eval.mjs '<js>' out.png
import { createServer } from 'node:http';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const [src, out] = process.argv.slice(2);
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
const url = await page.evaluate(async (src) => {
  const g = window.__game, H = window.__harness; H.takeOver();
  await (new Function('g', 'H', `return (async () => { ${src} })()`))(g, H);
  g.draw();
  const c0 = g.screen.canvas || document.querySelector('canvas');
  const c = document.createElement('canvas'); c.width = c0.width * 3; c.height = c0.height * 3;
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(c0, 0, 0, c.width, c.height);
  return c.toDataURL('image/png');
}, src);
await writeFile(out, Buffer.from(url.split(',')[1], 'base64'));
console.log('wrote', out);
await browser.close(); server.close();
