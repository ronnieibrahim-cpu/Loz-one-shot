// Render sound effects to WAV files through the game's own audio engine,
// offline, so a person can listen to them outside the game. NOT a checker.
//   node tools/render-sfx.mjs <outDir> [name ...]     (no names: every sfx)
// Each sound is played once into an OfflineAudioContext exactly as the game
// plays it (`Audio.sfx`), so a synthesized sound and a cartridge one (S163,
// `{ seasons: name }`) come out the same way. Trailing silence is trimmed.
// S163 wrote it to put every old sound beside the cartridge sound replacing it.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
const ROOT = new URL('..', import.meta.url).pathname;
const [outDir, ...wanted] = process.argv.slice(2);
if (!outDir) { console.log('usage: node tools/render-sfx.mjs <outDir> [name ...]'); process.exit(2); }
const server = createServer(async (req, res) => {
  try { const p = join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    res.writeHead(200, { 'Content-Type': extname(p) === '.js' ? 'text/javascript' : 'text/html' }); res.end(await readFile(p)); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(0, r));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
const page = await browser.newPage();
await page.goto(`http://localhost:${server.address().port}/index.html`);
const out = await page.evaluate(async (wanted) => {
  const { Audio } = await import('/src/core/audio.js');
  const { SFX } = await import('/src/data/audio.js');
  const names = wanted.length ? wanted : Object.keys(SFX);
  const res = {};
  for (const name of names) {
    if (!SFX[name]) { res[name] = null; continue; }
    const sr = 32768, secs = 4;
    const ctx = new OfflineAudioContext(1, sr * secs, sr);
    const a = new Audio(); a.init(ctx); a.addSfx(SFX); a.sfx(name);
    const buf = await ctx.startRendering();
    const d = buf.getChannelData(0);
    let end = d.length;
    while (end > 0 && Math.abs(d[end - 1]) < 1e-4) end--;
    end = Math.min(d.length, end + Math.round(sr * 0.05));
    const n = end, bytes = new Uint8Array(44 + n * 2), dv = new DataView(bytes.buffer);
    const w = (o, s) => { for (let i = 0; i < s.length; i++) bytes[o + i] = s.charCodeAt(i); };
    w(0, 'RIFF'); dv.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
    dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
    dv.setUint32(24, sr, true); dv.setUint32(28, sr * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true);
    w(36, 'data'); dv.setUint32(40, n * 2, true);
    for (let i = 0; i < n; i++) dv.setInt16(44 + i * 2, Math.max(-1, Math.min(1, d[i])) * 32767, true);
    let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    res[name] = btoa(s);
  }
  return res;
}, wanted);
await mkdir(outDir, { recursive: true });
for (const [name, b64] of Object.entries(out)) {
  if (b64 == null) { console.log('no such sfx:', name); continue; }
  await writeFile(join(outDir, name + '.wav'), Buffer.from(b64, 'base64'));
}
console.log(`render-sfx: ${Object.values(out).filter(Boolean).length} sounds -> ${outDir}`);
await browser.close(); server.close();
