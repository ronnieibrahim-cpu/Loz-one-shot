// Render one of the game's music tracks to a WAV file exactly as the game
// plays it, offline, so a person can listen to it outside the game. NOT a
// checker. Since S164 every track — Seasons' own and ours alike — plays
// through the cartridge's sound engine (src/core/gbsound.js; ours compiled by
// `compileForGb`), so this is plain Node and needs no browser.
//   node tools/render-track.mjs <track> <out.wav> [loops]
// S158 wrote it so the human could hear the two new town themes.
import { writeFile } from 'node:fs/promises';
import { compileForGb } from '../src/core/audio.js';
import { renderGb, renderSeasons } from '../src/core/gbsound.js';
import { TRACKS } from '../src/data/audio.js';

const [name, out, loops = '2'] = process.argv.slice(2);
const t = TRACKS[name];
if (!t || !out) { console.log('usage: node tools/render-track.mjs <track> <out.wav> [loops]'); process.exit(2); }
const sr = 22050;
const r = t.seasons ? renderSeasons(t.seasons, sr) : renderGb(compileForGb(t), '$render:' + name, sr);
const d = r.data;
const ls = Math.round(r.loopStart * sr);
// The intro once, then the loop `loops` times (a jingle just once).
const n = r.loopEnd ? ls + (d.length - ls) * Number(loops) : d.length;
let peak = 0; for (const v of d) peak = Math.max(peak, Math.abs(v));
const g = peak > 0 ? 0.9 / peak : 1;
const buf = Buffer.alloc(44 + n * 2);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVEfmt ', 8);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(sr, 24);
buf.writeUInt32LE(sr * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
for (let i = 0; i < n; i++) {
  const x = i < d.length ? d[i] : d[ls + ((i - d.length) % (d.length - ls))];
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, x * g)) * 32767), 44 + i * 2);
}
await writeFile(out, buf);
console.log('wrote', out);
