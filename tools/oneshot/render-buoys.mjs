// Scratch (S201): the buoy sailor's three tunes as WAVs, through the game's own
// audio engine, at the game's own spacing. Asserts nothing.
//   node tools/oneshot/render-buoys.mjs outDir
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
const ROOT = new URL('../..', import.meta.url).pathname;
const outDir = process.argv[2];
const server = createServer(async (req, res) => {
  try { const p = join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    res.writeHead(200, { 'Content-Type': extname(p) === '.js' ? 'text/javascript' : 'text/html' }); res.end(await readFile(p)); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(0, r));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
const page = await browser.newPage();
await page.goto(`http://localhost:${server.address().port}/index.html`);
const out = await page.evaluate(async () => {
  const { Audio } = await import('/src/core/audio.js');
  const { SFX } = await import('/src/data/audio.js');
  const { BUOY_NOTE_FRAMES } = await import('/src/data/feel.js');
  const { installData } = await import('/src/data/index.js');
  const { MAPS } = await import('/src/world/maps.js');
  installData();
  const def = MAPS.get('overworld').roomDefs['0,15,9'];
  const keeper = def.entities.find(e => e[0] === 'buoyKeeper')[3];
  const PITCH = [0.5, 0.5625, 0.625, 0.75, 0.8333];
  const res = {};
  keeper.tunes.forEach(async () => {});
  for (let r = 0; r < keeper.tunes.length; r++) {
    const tune = keeper.tunes[r];
    const sr = 32768, secs = 1 + tune.length * BUOY_NOTE_FRAMES / 60;
    const ctx = new OfflineAudioContext(1, Math.ceil(sr * secs), sr);
    const a = new Audio(); a.init(ctx); a.addSfx(SFX);
    tune.forEach((n, i) => { for (const b of (Array.isArray(n) ? n : [n])) a._renderSfx(SFX.chime, 0.05 + i * BUOY_NOTE_FRAMES / 60, PITCH[b - 1], 1); });
    const d = (await ctx.startRendering()).getChannelData(0), m = d.length;
    const bytes = new Uint8Array(44 + m * 2), dv = new DataView(bytes.buffer);
    const w = (o, s) => { for (let i = 0; i < s.length; i++) bytes[o + i] = s.charCodeAt(i); };
    w(0, 'RIFF'); dv.setUint32(4, 36 + m * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
    dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
    dv.setUint32(24, sr, true); dv.setUint32(28, sr * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true);
    w(36, 'data'); dv.setUint32(40, m * 2, true);
    for (let i = 0; i < m; i++) dv.setInt16(44 + i * 2, Math.max(-1, Math.min(1, d[i] * 2)) * 32767, true);
    let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    res['buoy-tune-' + (r + 1)] = btoa(s);
  }
  return res;
});
await mkdir(outDir, { recursive: true });
for (const [n, b] of Object.entries(out)) await writeFile(join(outDir, n + '.wav'), Buffer.from(b, 'base64'));
console.log(Object.keys(out).join(' '));
await browser.close(); server.close();
