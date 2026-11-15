// Render a ripped cartridge script by its rip name (not a game track) to WAV,
// the intro once and the loop `loops` times. Asserts nothing (S248, for the
// opening's music choice). node tools/oneshot/render-seasons-wav.mjs <name> <out.wav> [loops]
import { writeFile } from 'node:fs/promises';
import { renderSeasons } from '../../src/core/gbsound.js';
const [name, out, loops = '1'] = process.argv.slice(2);
const sr = 22050, r = renderSeasons(name, sr), d = r.data, ls = Math.round(r.loopStart * sr);
const n = r.loopEnd ? ls + (d.length - ls) * Number(loops) : d.length;
let peak = 0; for (const v of d) peak = Math.max(peak, Math.abs(v));
const g = peak > 0 ? 0.9 / peak : 1, buf = Buffer.alloc(44 + n * 2);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVEfmt ', 8);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(sr, 24);
buf.writeUInt32LE(sr * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
for (let i = 0; i < n; i++) {
  const x = i < d.length ? d[i] : d[ls + ((i - d.length) % (d.length - ls))];
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, x * g)) * 32767), 44 + i * 2);
}
await writeFile(out, buf);
console.log(out, (n / sr).toFixed(1) + 's', r.loopEnd ? 'loops at ' + r.loopStart.toFixed(1) + 's' : 'one-shot');
