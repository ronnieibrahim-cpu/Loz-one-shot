// Render one of the game's own tracker tracks to a WAV file through its own music
// engine, offline, so a person can listen to it outside the game. NOT a checker.
//   node tools/render-track.mjs <track> <out.wav> [loops]
// S158 wrote it so the human could hear the two new town themes.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
const ROOT = new URL('..', import.meta.url).pathname;
const [name, out, loops = '2'] = process.argv.slice(2);
const server = createServer(async (req, res) => {
  try { const p = join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    res.writeHead(200, { 'Content-Type': extname(p) === '.js' ? 'text/javascript' : 'text/html' }); res.end(await readFile(p)); }
  catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(0, r));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
const page = await browser.newPage();
await page.goto(`http://localhost:${server.address().port}/index.html`);
const b64 = await page.evaluate(async ([name, loops]) => {
  const { Audio } = await import('/src/core/audio.js');
  const { TRACKS } = await import('/src/data/audio.js');
  const t = TRACKS[name];
  const rowDur = 60 / (t.bpm || 120) / (t.rowsPerBeat || 4);
  const rowsPerLoop = t.order.reduce((n, k) => n + t.patterns[k].p1.trim().split(/\s+/).length, 0)
    + (t.intro || []).reduce((n, k) => n + t.patterns[k].p1.trim().split(/\s+/).length, 0);
  const rows = rowsPerLoop * loops;
  const sr = 22050, secs = rows * rowDur + 1.5;
  const ctx = new OfflineAudioContext(1, Math.ceil(sr * secs), sr);
  const a = new Audio(); a.init(ctx); a.addTracks(TRACKS); a.play(name);
  let time = a._nextRowTime;
  for (let i = 0; i < rows && a.track; i++) { a._scheduleRow(time, rowDur); time += rowDur; }
  const buf = await ctx.startRendering();
  const d = buf.getChannelData(0);
  let peak = 0; for (const v of d) peak = Math.max(peak, Math.abs(v));
  const g = peak > 0 ? 0.9 / peak : 1;
  const n = d.length, bytes = new Uint8Array(44 + n * 2), dv = new DataView(bytes.buffer);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) bytes[o + i] = s.charCodeAt(i); };
  w(0, 'RIFF'); dv.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
  dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
  dv.setUint32(24, sr, true); dv.setUint32(28, sr * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true);
  w(36, 'data'); dv.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) dv.setInt16(44 + i * 2, Math.max(-1, Math.min(1, d[i] * g)) * 32767, true);
  let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}, [name, Number(loops)]);
await writeFile(out, Buffer.from(b64, 'base64'));
console.log('wrote', out);
await browser.close(); server.close();
