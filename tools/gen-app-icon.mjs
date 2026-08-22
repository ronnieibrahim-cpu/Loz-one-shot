// gen-app-icon.mjs — procedurally draws the iPad home-screen icon and the web
// app manifest, both from the game's own title-screen palette, and folds the
// results into index.html as data: URIs.
//
// "If no sheet has it, draw it to match": there is no icon in assets/sheets/
// — apple-touch-icon is app chrome, not a game asset — so it is drawn here,
// at the same three-colours-plus-outline discipline as everything else this
// project draws by hand, rather than pulled in as an external PNG file. It is
// inlined as data: URIs (not written as loose /icon.png files) so the single
// dist/oracle-of-tides.html the build produces keeps working from a bare
// file:// URL with zero extra network requests — tools/check-build.mjs flags
// any request off the document itself as a failure.
//
// This is a generated block inside a hand-written file: the markers below
// are the seam. Re-run this script after changing the pixel grid or palette;
// never hand-edit the base64 between the markers.
//
//   node tools/gen-app-icon.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const INDEX = join(ROOT, 'index.html');

// --- palette, straight off the title screen (src/game/title.js) -----------
const WASH = [0x0d, 0x26, 0x50];     // title screen's tide wash
const DEEP = [0x08, 0x14, 0x2c];     // title text drop-shadow / boot background family
const GOLD = [0xe8, 0xc0, 0x40];     // title frame gold
const FOAM = [0xea, 0xfa, 0xff];     // waterline crest highlight
const INK = [0x00, 0x00, 0x00];

// 16x16 pixel grid, nearest-neighbour scaled up. Three colours plus outline,
// a hard 1px black border, silhouette-first — the same rule as every sprite
// in docs/ART-DIRECTION.md: a wave cresting under a single conch-shell swirl,
// the game's own marquee item (see title_conch in src/data/sprites-title.js).
const G = 0, D = 1, Y = 2, F = 3, K = 4; // wash, deep, gold, foam, ink
const P = [WASH, DEEP, GOLD, FOAM, INK];
/* eslint-disable no-multi-spaces */
const PIXELS = [
  'KKKKKKKKKKKKKKKK',
  'KGGGGGGGGGGGGGGK',
  'KGGGGGGGGGGGGGGK',
  'KGGGGGGGGYYGGGGK',
  'KGGGGGGGYYYYGGGK',
  'KGGGGGGYYKYYYGGK',
  'KGGGGGGYYKYYYGGK',
  'KGGGGGGGYYYYGGGK',
  'KGGGGGGGGYYGGGGK',
  'KDDDDDDDDDDDDDDK',
  'KFFDDDDDDDDDDFFK',
  'KDFFDDDDDDDDFFDK',
  'KDDFFDDDDDDFFDDK',
  'KDDDFFDDDDFFDDDK',
  'KDDDDFFFFFFDDDDK',
  'KKKKKKKKKKKKKKKK',
].map(row => row.split('').map(c => ({ K: K, G: G, D: D, Y: Y, F: F })[c]));
/* eslint-enable no-multi-spaces */

// --- minimal PNG encoder (8-bit truecolor+alpha, no interlace) -------------

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeData), 0);
  return Buffer.concat([len, typeData, crc]);
}

/** Renders the 16x16 grid at `scale`x (nearest-neighbour) as a PNG buffer. */
function renderPng(scale) {
  const size = 16 * scale;
  const raw = Buffer.alloc(size * (1 + size * 4));
  let o = 0;
  for (let y = 0; y < size; y++) {
    raw[o++] = 0; // filter: none
    const srcY = Math.floor(y / scale);
    for (let x = 0; x < size; x++) {
      const srcX = Math.floor(x / scale);
      const [r, g, b] = P[PIXELS[srcY][srcX]];
      raw[o++] = r; raw[o++] = g; raw[o++] = b; raw[o++] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // color type: truecolor + alpha
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const idat = deflateSync(raw);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

function pngDataUri(scale) {
  return 'data:image/png;base64,' + renderPng(scale).toString('base64');
}

// --- assemble the head block ------------------------------------------------

const icon180 = pngDataUri(12);   // apple-touch-icon: 16*12 = 192, close enough to iOS's 180pt request
const icon192 = pngDataUri(12);
const icon512 = pngDataUri(32);   // 16*32 = 512, for the manifest's large icon

const manifest = {
  name: 'The Legend of Zelda: Oracle of Tides',
  short_name: 'Oracle of Tides',
  start_url: './',
  display: 'standalone',
  background_color: '#0b0f14',
  theme_color: '#0d2650',
  icons: [
    { src: icon192, sizes: '192x192', type: 'image/png' },
    { src: icon512, sizes: '512x512', type: 'image/png' },
  ],
};
const manifestUri = 'data:application/manifest+json,' + encodeURIComponent(JSON.stringify(manifest));

const block = `<!-- APP-ICON:BEGIN — generated by tools/gen-app-icon.mjs; do not hand-edit -->
<link rel="manifest" href="${manifestUri}">
<link rel="apple-touch-icon" sizes="192x192" href="${icon180}">
<link rel="icon" href="${icon192}">
<meta name="theme-color" content="#0d2650">
<!-- APP-ICON:END -->`;

const html = readFileSync(INDEX, 'utf8');
const RE = /<!-- APP-ICON:BEGIN[\s\S]*?APP-ICON:END -->/;
if (!RE.test(html)) {
  console.error('gen-app-icon: no <!-- APP-ICON:BEGIN --> ... <!-- APP-ICON:END --> markers in index.html');
  process.exit(1);
}
writeFileSync(INDEX, html.replace(RE, block));
console.log('gen-app-icon: wrote manifest + apple-touch-icon into index.html');
