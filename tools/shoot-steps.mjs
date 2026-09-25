// Screenshot the game after a few route directives. NOT a checker — it
// asserts nothing. Like try-room.mjs, but it writes a picture: the canvas is
// captured when the step whose index is in "shots" finishes (and at the
// end, for "end"), scaled up 3x.
//
//   node tools/shoot-steps.mjs '<json {setup, steps, shots:[i..]}>' out-prefix
import { createServer } from 'node:http';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { installRuntime } from './actor-runtime.mjs';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const spec = JSON.parse(process.argv[2]);
const out = process.argv[3] || 'shot';
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
const snap = async (name) => {
  const url = await page.evaluate(() => {
    const src = window.__game.screen.canvas || document.querySelector('canvas');
    const c = document.createElement('canvas'); c.width = src.width * 3; c.height = src.height * 3;
    const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(src, 0, 0, c.width, c.height);
    return c.toDataURL('image/png');
  });
  await writeFile(name, Buffer.from(url.split(',')[1], 'base64'));
  console.log('wrote', name);
};
const shots = spec.shots || [];
const whens = (spec.when || []).map(w => Object.assign([...w], { done: false }));
// Run all steps, pausing after each to shoot if asked.
await page.evaluate(([s, st]) => window.__rp.beginRecord(s, st), [spec.setup, spec.steps]);
let lastStep = -1;
for (let i = 0; i < 20000; i++) {
  const r = await page.evaluate(() => window.__rp.pump(1));
  const step = await page.evaluate(() => { const t = window.__rp._trace || []; return t.length ? t[t.length - 1].step : -1; });
  if (step !== lastStep) { lastStep = step; if (shots.includes(step)) await snap(`${out}-${step}.png`); }
  // `when`: [[name, expr]] — also shoot the first frame on which expr (read
  // with the game as `g`) is true, e.g. the moment a prize is held overhead.
  for (const w of whens) {
    if (w.done) continue;
    if (await page.evaluate(src => { const g = window.__game; return !!eval(src); }, w[1])) { w.done = true; await snap(`${out}-${w[0]}.png`); }
  }
  if (r.done || r.error) { if (r.error) console.log('ERR', r.error); break; }
}
if (shots.includes('end')) { for (let i = 0; i < 2; i++) await page.evaluate(() => window.__rp.pump(1)); await snap(`${out}-end.png`); }
await browser.close(); server.close();
