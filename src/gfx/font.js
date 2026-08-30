// 8x8 bitmap font, 1 bit per pixel, MSB = leftmost column.
// Each glyph is 8 bytes as 16 hex characters. Glyphs are drawn proportionally:
// the advance is the glyph's ink width + 1, so text reads like the GBC Zelda font
// rather than fixed-pitch.

const GLYPHS = {
  ' ': '0000000000000000', '!': '2020202020002000', '"': '5050000000000000',
  '#': '50f85050f8500000', '$': '2078a07028f02000', '%': 'c8c8102040989800',
  '&': '6090a040a8906800', "'": '2020000000000000', '(': '1020404040201000',
  ')': '4020101010204000', '*': '005020f820500000', '+': '002020f820200000',
  ',': '0000000000202040', '-': '0000007000000000', '.': '0000000000002000',
  '/': '0808102040808000',
  '0': '708898a8c8887000', '1': '2060202020207000', '2': '708808304080f800',
  '3': 'f810203008887000', '4': '10305090f8101000', '5': 'f880f00808887000',
  '6': '304080f088887000', '7': 'f808102040404000', '8': '7088887088887000',
  '9': '7088887808106000',
  ':': '0020000000200000', ';': '0020000000202040', '<': '1020408040201000',
  '=': '0000f800f8000000', '>': '8040201020408000', '?': '7088083020002000',
  '@': '7088b8a8b8807000',
  'A': '20508888f8888800', 'B': 'f08888f08888f000', 'C': '7088808080887000',
  'D': 'f08888888888f000', 'E': 'f88080f08080f800', 'F': 'f88080f080808000',
  'G': '708880b888887800', 'H': '888888f888888800', 'I': '7020202020207000',
  'J': '3810101010906000', 'K': '8890a0c0a0908800', 'L': '808080808080f800',
  'M': '88d8a8a888888800', 'N': '88c8c8a898988800', 'O': '7088888888887000',
  'P': 'f08888f080808000', 'Q': '70888888a8986800', 'R': 'f08888f0a0908800',
  'S': '788080700808f000', 'T': 'f820202020202000', 'U': '8888888888887000',
  'V': '8888888888502000', 'W': '8888a8a8a8d88800', 'X': '8888502050888800',
  'Y': '8888885020202000', 'Z': 'f80810204080f800',
  '[': '7040404040407000', '\\': '8080402010080800', ']': '7010101010107000',
  '^': '2050880000000000', '_': '00000000000000f8', '`': '4020000000000000',
  'a': '0000700878887800', 'b': '8080f0888888f000', 'c': '0000708880887000',
  'd': '0808788888887800', 'e': '00007088f8807000', 'f': '3040e04040404000',
  'g': '0000788888780870', 'h': '8080f08888888800', 'i': '2000202020202000',
  'j': '1000101010109060', 'k': '808090a0c0a09000', 'l': '6020202020207000',
  'm': '0000d0a8a8a8a800', 'n': '0000f08888888800', 'o': '0000708888887000',
  'p': '0000f08888f08080', 'q': '0000788888780808', 'r': '0000b0c880808000',
  's': '000078807008f000', 't': '4040e04040483000', 'u': '0000888888887800',
  'v': '0000888888502000', 'w': '000088a8a8a85000', 'x': '0000885020508800',
  'y': '0000888888780870', 'z': '0000f8102040f800',
  '{': '3040408040403000', '|': '2020202020202000', '}': '6020201020206000',
  '~': '000068b000000000',
  // An em-dash, wider than the hyphen above it (5px of ink against 3), because
  // the writing uses both and they are not the same mark. It was missing for
  // the whole life of the project, and because `decode` falls back to '?' the
  // symptom was six Essence title cards reading "I ? the Shallow Bell" rather
  // than a gap or a crash. `tools/check-text.mjs` now fails on any character
  // the game can display and the font cannot draw.
  '\u2014': '000000f800000000',
  // control glyphs
  '\x02': '0000f87020000000',   // down arrow: "press A to continue"
  '\x03': '2070f8f870200000',   // rupee
  '\x04': '7088702030203000',   // small key
  '\x05': '0050f8f8f8702000',   // small heart
  '\x06': '2070f8f8f8702000',   // essence spark
};

const SPACE_ADVANCE = 4;

const decoded = new Map();   // char -> { rows:Uint8Array(8), w:number }

/**
 * Does this character have a glyph, or will it silently render as '?'.
 *
 * `decode` falls back to `GLYPHS['?']` for anything it does not know, which
 * means a character with no glyph does not crash, does not warn, and does not
 * leave a gap — it prints a question mark that reads as authored punctuation.
 * Six Essence title cards said "I ? the Shallow Bell" for the whole life of
 * the project because the em-dash in them has never had a glyph.
 *
 * Exported so `tools/check-text.mjs` can ask this table rather than keeping a
 * second copy of the alphabet.
 */
export function hasGlyph(ch) { return Object.prototype.hasOwnProperty.call(GLYPHS, ch); }

function decode(ch) {
  let d = decoded.get(ch);
  if (d) return d;
  const hex = GLYPHS[ch] || GLYPHS['?'];
  const rows = new Uint8Array(8);
  for (let i = 0; i < 8; i++) rows[i] = parseInt(hex.substr(i * 2, 2), 16);
  let ink = 0;
  for (const r of rows) for (let b = 0; b < 8; b++) if (r & (0x80 >> b)) ink = Math.max(ink, b + 1);
  const w = ch === ' ' ? SPACE_ADVANCE : Math.max(2, ink) + 1;
  d = { rows, w };
  decoded.set(ch, d);
  return d;
}

// Baked atlases keyed by colour. Each atlas is one canvas, glyphs laid out
// left to right in a stable order.
const atlases = new Map();
const order = Object.keys(GLYPHS);
const indexOf = new Map(order.map((c, i) => [c, i]));

function atlas(color) {
  let a = atlases.get(color);
  if (a) return a;
  const c = document.createElement('canvas');
  c.width = order.length * 8; c.height = 8;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(c.width, 8);
  const r = parseInt(color.slice(1, 3), 16), g = parseInt(color.slice(3, 5), 16), b = parseInt(color.slice(5, 7), 16);
  for (let i = 0; i < order.length; i++) {
    const { rows } = decode(order[i]);
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        if (!(rows[y] & (0x80 >> x))) continue;
        const o = (y * c.width + i * 8 + x) * 4;
        img.data[o] = r; img.data[o + 1] = g; img.data[o + 2] = b; img.data[o + 3] = 255;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
  a = { canvas: c };
  atlases.set(color, a);
  return a;
}

export function charWidth(ch) { return decode(ch).w; }

export function textWidth(s) {
  let w = 0;
  for (const ch of s) w += decode(ch).w;
  return w;
}

/** Draw a single line. Returns the advance in pixels. */
export function drawText(ctx, s, x, y, color = '#181c18', shadow = null) {
  if (shadow) {
    const sa = atlas(shadow).canvas;
    let cx = x;
    for (const ch of s) {
      const i = indexOf.get(ch) ?? indexOf.get('?');
      ctx.drawImage(sa, i * 8, 0, 8, 8, (cx | 0) + 1, (y | 0) + 1, 8, 8);
      cx += decode(ch).w;
    }
  }
  const a = atlas(color).canvas;
  let cx = x;
  for (const ch of s) {
    const i = indexOf.get(ch) ?? indexOf.get('?');
    ctx.drawImage(a, i * 8, 0, 8, 8, cx | 0, y | 0, 8, 8);
    cx += decode(ch).w;
  }
  return cx - x;
}

export function drawTextCentered(ctx, s, cx, y, color, shadow) {
  return drawText(ctx, s, Math.round(cx - textWidth(s) / 2), y, color, shadow);
}

/** Greedy word wrap to a pixel width. Respects explicit '\n'. */
export function wrapText(s, maxW) {
  const out = [];
  for (const para of String(s).split('\n')) {
    if (para === '') { out.push(''); continue; }
    let line = '';
    for (const word of para.split(' ')) {
      const test = line ? line + ' ' + word : word;
      if (textWidth(test) <= maxW || !line) {
        line = test;
      } else {
        out.push(line);
        line = word;
      }
    }
    out.push(line);
  }
  return out;
}

/** Split wrapped lines into pages of n lines. */
export function paginate(s, maxW, linesPerPage) {
  const lines = wrapText(s, maxW);
  const pages = [];
  for (let i = 0; i < lines.length; i += linesPerPage) {
    pages.push(lines.slice(i, i + linesPerPage));
  }
  return pages.length ? pages : [['']];
}
