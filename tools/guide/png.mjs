// A small PNG writer, because the browser's encoder is built for speed and the
// guide ships every picture inline in one page. Pixel art has few colours and
// long runs, so an indexed PNG (when the picture has 256 colours or fewer),
// the best filter per row and zlib at level 9 make each file several times
// smaller than canvas.toDataURL() does, with every pixel the same.
import { deflateSync } from 'node:zlib';

const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
function crc32(buf) { let c = -1; for (const b of buf) c = CRC[(c ^ b) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function filterRows(raw, w, h, bpp) {
  const stride = w * bpp, out = Buffer.alloc((stride + 1) * h);
  const prev = Buffer.alloc(stride), cur = Buffer.alloc(stride);
  const cand = [0, 1, 2, 3, 4].map(() => Buffer.alloc(stride));
  for (let y = 0; y < h; y++) {
    raw.copy(cur, 0, y * stride, y * stride + stride);
    let best = 0, bestSum = Infinity;
    for (let f = 0; f < 5; f++) {
      const o = cand[f]; let sum = 0;
      for (let i = 0; i < stride; i++) {
        const a = i >= bpp ? cur[i - bpp] : 0, b = y ? prev[i] : 0, c = (i >= bpp && y) ? prev[i - bpp] : 0;
        let p;
        if (f === 0) p = 0; else if (f === 1) p = a; else if (f === 2) p = b; else if (f === 3) p = (a + b) >> 1;
        else { const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c); p = pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
        const v = (cur[i] - p) & 255; o[i] = v; sum += v < 128 ? v : 256 - v;
      }
      if (sum < bestSum) { bestSum = sum; best = f; }
    }
    out[y * (stride + 1)] = best;
    cand[best].copy(out, y * (stride + 1) + 1);
    cur.copy(prev);
  }
  return out;
}

/** rgba: Uint8Array/Buffer of w*h*4. Returns a PNG Buffer. */
export function encodePNG(rgba, w, h) {
  const n = w * h;
  const pal = new Map(); let indexed = true;
  const idx = Buffer.alloc(n);
  for (let i = 0; i < n; i++) {
    const k = (rgba[i * 4] << 16) | (rgba[i * 4 + 1] << 8) | rgba[i * 4 + 2];
    let v = pal.get(k);
    if (v === undefined) { if (pal.size >= 256) { indexed = false; break; } v = pal.size; pal.set(k, v); }
    idx[i] = v;
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const parts = [Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])];
  let data;
  if (indexed) {
    ihdr[9] = 3;
    const plte = Buffer.alloc(pal.size * 3);
    for (const [k, v] of pal) { plte[v * 3] = k >> 16; plte[v * 3 + 1] = (k >> 8) & 255; plte[v * 3 + 2] = k & 255; }
    parts.push(chunk('IHDR', ihdr), chunk('PLTE', plte));
    data = filterRows(idx, w, h, 1);
  } else {
    ihdr[9] = 2;
    const rgb = Buffer.alloc(n * 3);
    for (let i = 0; i < n; i++) { rgb[i * 3] = rgba[i * 4]; rgb[i * 3 + 1] = rgba[i * 4 + 1]; rgb[i * 3 + 2] = rgba[i * 4 + 2]; }
    parts.push(chunk('IHDR', ihdr));
    data = filterRows(rgb, w, h, 3);
  }
  parts.push(chunk('IDAT', deflateSync(data, { level: 9, memLevel: 9 })), chunk('IEND', Buffer.alloc(0)));
  return Buffer.concat(parts);
}
