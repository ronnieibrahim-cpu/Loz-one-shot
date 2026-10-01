// Film a run of route directives. NOT a checker — it asserts nothing.
// shoot-steps.mjs's setup and directives, but it writes a PNG of the screen
// every `every` frames for the whole run, plus frames.json naming the step
// each frame was taken on, so a clip can be cut around one moment. S162 wrote
// it to film the optional dungeons for the human.
//
//   node tools/film-steps.mjs '<json {setup, steps}>' <outDir> [every=2]
//   ffmpeg -framerate 30 -i <outDir>/%05d.png -vf scale=480:-1:flags=neighbor clip.mp4
//
// The spec may also be a path to a .json file (handy for long runs).
import { createServer } from 'node:http';
import { readFile, stat, writeFile, mkdir } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { installRuntime } from './actor-runtime.mjs';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const arg = process.argv[2];
const spec = JSON.parse(arg.trim().startsWith('{') ? arg : await readFile(arg, 'utf8'));
const out = process.argv[3] || 'film';
const EVERY = Number(process.argv[4] || 2);
await mkdir(out, { recursive: true });
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
await page.evaluate(([s, st]) => window.__rp.beginRecord(s, st), [spec.setup, spec.steps]);
const index = [];
let n = 0;
for (let i = 0; i < 400000; i += EVERY) {
  const r = await page.evaluate(k => window.__rp.pump(k), EVERY);
  const f = await page.evaluate(() => {
    const g = window.__game, t = window.__rp._trace || [];
    const src = g.screen.canvas || document.querySelector('canvas');
    return { url: src.toDataURL('image/png'), step: t.length ? t[t.length - 1].step : -1,
      room: g.room && g.room.key, map: g.mapId, tide: g.tide.level, hearts: g.progress.hearts };
  });
  n++;
  await writeFile(join(out, String(n).padStart(5, '0') + '.png'), Buffer.from(f.url.split(',')[1], 'base64'));
  index.push({ n, step: f.step, map: f.map, room: f.room, tide: f.tide, hearts: f.hearts });
  if (r.done || r.error) { if (r.error) console.log('ERR', r.error); break; }
}
await writeFile(join(out, 'frames.json'), JSON.stringify(index));
console.log('wrote', n, 'frames to', out);
await browser.close(); server.close();
