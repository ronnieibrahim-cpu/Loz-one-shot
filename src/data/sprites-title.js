// The title screen's drawn art: a display wordmark, a painterly backdrop, a
// subtitle pill and the small caps lines around them.
//
// Nothing in assets/sheets/ has this game's name on it, so per
// docs/ART-DIRECTION.md rule 2 every glyph here is drawn to match rather than
// extracted. This is hand-authored source, NOT a ripper output — there is no
// sheet to re-run it against, and no generated-file rule applies.
//
// The look being matched is the Oracle-series title card, whose grammar is:
//   - a small caps series line, flat-filled, hard dark outline
//   - a large ornate SERIF wordmark: heavy stems, flared serif feet, a light
//     bevel along every top/left edge and a dark one along every bottom/right,
//     inside a hard black outline
//   - a pale halo hugging that wordmark, sitting on
//   - a mottled organic backdrop with a soft dithered edge (no hard outline)
//   - the game-specific word in a stadium "pill": dark fill, pale ring, pale
//     letters
// Every one of those is reproduced below. Borrowed grammar, original words:
// the series line, the wordmark and the pill word are this game's own.
//
// HOW THE PIXELS ARE MADE. The letterforms are hand-drawn SILHOUETTES — the
// `#`/`.` tables below are literal pixel data, drawn stem by stem and serif by
// serif, not an upscale of a small font (an upscaled 5x7 sans was the first
// attempt and it read as a placeholder, which is exactly what it was). What is
// computed from those silhouettes is only the shading: a deterministic bevel
// pass and a deterministic outline dilation, which is how the source art gets
// its consistent one-pixel edges. No RNG anywhere — the backdrop's mottle is a
// pure integer hash of (x, y), so it is byte-identical on every boot.

import { sprites } from '../gfx/art.js';
import { registerPalettes } from '../gfx/palettes.js';

// ---------------------------------------------------------------------------
// Small caps: the series line and PRESS START. Flat-filled, per the source,
// where a bevel at 7px tall would turn every pixel into an edge and read as
// mush.
// ---------------------------------------------------------------------------

const SMALL_W = 5, SMALL_H = 7, SMALL_SPACE = 3;

const SMALL = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.####', '#....', '#....', '#....', '#....', '#....', '.####'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.####', '#....', '#....', '#.###', '#...#', '#...#', '.####'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '#####'],
  J: ['....#', '....#', '....#', '....#', '#...#', '#...#', '.###.'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#.#.#', '#..##', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
};

// ---------------------------------------------------------------------------
// The display serif. 20 rows tall, drawn per letter: 4px stems, 3px bars,
// flared two-row serif feet, counters cut so the round letters carry more
// weight on their sides than across their top and bottom — the proportion that
// makes a heavy serif read as ornate rather than as a fat sans.
// ---------------------------------------------------------------------------

const DISPLAY = {
  O: [
    '.....#######.....',
    '...###########...',
    '..####.....####..',
    '.####.......####.',
    '.####.......####.',
    '####.........####',
    '####.........####',
    '####.........####',
    '####.........####',
    '####.........####',
    '####.........####',
    '####.........####',
    '####.........####',
    '####.........####',
    '####.........####',
    '.####.......####.',
    '.####.......####.',
    '..####.....####..',
    '...###########...',
    '.....#######.....',
  ],
  R: [
    '.###########....',
    '.#############..',
    '..####.....###..',
    '..####.....####.',
    '..####.....####.',
    '..####.....####.',
    '..####.....####.',
    '..####.....####.',
    '..####.....###..',
    '..###########...',
    '..##########....',
    '..####.####.....',
    '..####.####.....',
    '..####..####....',
    '..####..####....',
    '..####...####...',
    '..####...####...',
    '..####....####..',
    '.######...#####.',
    '.######..######.',
  ],
  A: [
    '.......####.......',
    '......######......',
    '......###.###.....',
    '.....####.###.....',
    '.....###..####....',
    '.....###...###....',
    '....####...###....',
    '....###....####...',
    '....###.....###...',
    '...####.....###...',
    '...############...',
    '...############...',
    '...###.......###..',
    '..####.......###..',
    '..###........####.',
    '..###.........###.',
    '.####.........###.',
    '.###..........####',
    '#####........#####',
    '#####........#####',
  ],
  C: [
    '.....#######.....',
    '...###########...',
    '..####.....####..',
    '.####.......####.',
    '.####.......###..',
    '####.............',
    '####.............',
    '####.............',
    '####.............',
    '####.............',
    '####.............',
    '####.............',
    '####.............',
    '####.............',
    '####.............',
    '.####.......###..',
    '.####.......####.',
    '..####.....####..',
    '...###########...',
    '.....#######.....',
  ],
  L: [
    '.######........',
    '.######........',
    '..####.........',
    '..####.........',
    '..####.........',
    '..####.........',
    '..####.........',
    '..####.........',
    '..####.........',
    '..####.........',
    '..####.........',
    '..####.........',
    '..####.........',
    '..####.........',
    '..####.........',
    '..####.........',
    '..####.........',
    '..###########..',
    '.#############.',
    '.#############.',
  ],
  E: [
    '.#############..',
    '.#############..',
    '..###########...',
    '..####..........',
    '..####..........',
    '..####..........',
    '..####..........',
    '..####..........',
    '..#########.....',
    '..#########.....',
    '..#########.....',
    '..####..........',
    '..####..........',
    '..####..........',
    '..####..........',
    '..####..........',
    '..####..........',
    '..###########...',
    '.#############..',
    '.#############..',
  ],
};

// ---------------------------------------------------------------------------
// The pill face: 12 rows, bolder and plainer than the display serif, because
// in the source the pill word is a solid slab that has to stay legible inside
// a shape half its height.
// ---------------------------------------------------------------------------

const PILL_FACE = {
  T: [
    '###########', '###########', '...#####...', '...#####...',
    '...#####...', '...#####...', '...#####...', '...#####...',
    '...#####...', '...#####...', '..#######..', '..#######..',
  ],
  I: [
    '#########', '#########', '..#####..', '..#####..',
    '..#####..', '..#####..', '..#####..', '..#####..',
    '..#####..', '..#####..', '#########', '#########',
  ],
  D: [
    '##########..', '###########.', '..###....###', '..###....###',
    '..###....###', '..###....###', '..###....###', '..###....###',
    '..###....###', '..###....###', '###########.', '##########..',
  ],
  E: [
    '##########.', '##########.', '..###......', '..###......',
    '..#######..', '..#######..', '..###......', '..###......',
    '..###......', '..###......', '##########.', '##########.',
  ],
  S: [
    '..#######..', '.#########.', '.###...###.', '.###.......',
    '.####......', '..######...', '...######..', '......####.',
    '.......###.', '.###...###.', '.#########.', '..#######..',
  ],
};

// ---------------------------------------------------------------------------
// Grid helpers. A "silhouette" is a 2D array of booleans; an "index grid" is a
// 2D array of -1 (transparent) or 0..3 (palette indices).
// ---------------------------------------------------------------------------

const grid = (w, h, v) => Array.from({ length: h }, () => new Array(w).fill(v));
const at = (g, x, y) => (y >= 0 && y < g.length && x >= 0 && x < g[0].length && g[y][x]);

/** Lay a string out in one of the glyph tables, returning its silhouette. */
function setType(text, table, cellW, cellH, spaceW, tracking) {
  const chars = [...text.toUpperCase()];
  const widths = chars.map(c => (c === ' ' ? spaceW : (table[c] ? table[c][0].length : cellW)));
  const w = widths.reduce((a, b) => a + b, 0) + tracking * (chars.length - 1);
  const sil = grid(w, cellH, false);
  let x = 0;
  chars.forEach((c, i) => {
    const g = table[c];
    if (g) {
      for (let y = 0; y < g.length; y++) {
        for (let gx = 0; gx < g[y].length; gx++) if (g[y][gx] === '#') sil[y][x + gx] = true;
      }
    }
    x += widths[i] + tracking;
  });
  return sil;
}

/** Grow a silhouette by `n` pixels in all 8 directions. */
function dilate(sil, n) {
  let cur = sil;
  for (let pass = 0; pass < n; pass++) {
    const h = cur.length, w = cur[0].length;
    const next = grid(w, h, false);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (cur[y][x]) { next[y][x] = true; continue; }
        for (let dy = -1; dy <= 1 && !next[y][x]; dy++) {
          for (let dx = -1; dx <= 1 && !next[y][x]; dx++) {
            if (at(cur, x + dx, y + dy)) next[y][x] = true;
          }
        }
      }
    }
    cur = next;
  }
  return cur;
}

/**
 * Shade a silhouette. `bevelled` lights every top/left edge (index 0) and
 * darkens every bottom/right edge (index 2), leaving the interior at index 1 —
 * which is how the source's display letters get their carved look. Flat art
 * takes index 1 throughout.
 */
function shade(sil, bevelled) {
  const h = sil.length, w = sil[0].length;
  const idx = grid(w, h, -1);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!sil[y][x]) continue;
      if (!bevelled) { idx[y][x] = 1; continue; }
      if (!at(sil, x, y - 1) || !at(sil, x - 1, y)) idx[y][x] = 0;
      else if (!at(sil, x, y + 1) || !at(sil, x + 1, y)) idx[y][x] = 2;
      else idx[y][x] = 1;
    }
  }
  return idx;
}

/**
 * Pad an index grid by one transparent pixel on every side and paint index 3
 * into every transparent cell touching a drawn one — the hard 1px outline
 * ART-DIRECTION requires.
 *
 * THE PADDING IS LOAD-BEARING. Dilating on a grid sized exactly to the art's
 * bounding box gives an edge pixel nowhere to put its outline, so the art
 * silently loses its outline on whichever side it touches — see
 * docs/HANDOFF.md.
 */
function outline(idx) {
  const ih = idx.length, iw = idx[0].length;
  const w = iw + 2, h = ih + 2;
  const out = grid(w, h, -1);
  for (let y = 0; y < ih; y++) for (let x = 0; x < iw; x++) out[y + 1][x + 1] = idx[y][x];
  const src = out.map(r => r.slice());
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (src[y][x] !== -1) continue;
      let touches = false;
      for (let dy = -1; dy <= 1 && !touches; dy++) {
        for (let dx = -1; dx <= 1 && !touches; dx++) {
          if (dy === 0 && dx === 0) continue;
          const ny = y + dy, nx = x + dx;
          if (ny >= 0 && ny < h && nx >= 0 && nx < w && src[ny][nx] !== -1) touches = true;
        }
      }
      if (touches) out[y][x] = 3;
    }
  }
  return out;
}

const toArt = (idx) => idx.map(r => r.map(v => (v === -1 ? '.' : String(v))).join('')).join('\n');

// ---------------------------------------------------------------------------
// The pieces.
// ---------------------------------------------------------------------------

const CAPTION_TEXT = 'A SEA LEGEND';
const PRESS_TEXT = 'PRESS START';

const captionSil = setType(CAPTION_TEXT, SMALL, SMALL_W, SMALL_H, SMALL_SPACE, 1);
const pressSil = setType(PRESS_TEXT, SMALL, SMALL_W, SMALL_H, SMALL_SPACE, 1);
// The connector line. The source sets the shared half of its subtitle small
// and the game-specific half in the pill; ours splits the same way, so this
// is the "of" of "Oracle of Tides" and it has to sit between them.
const ofSil = setType('OF', SMALL, SMALL_W, SMALL_H, SMALL_SPACE, 1);
const wordSil = setType('ORACLE', DISPLAY, 17, 20, 8, 2);
const tidesSil = setType('TIDES', PILL_FACE, 11, 12, 6, 2);

const captionArt = outline(shade(captionSil, false));
const pressArt = outline(shade(pressSil, false));
const ofArt = outline(shade(ofSil, false));
const wordArt = outline(shade(wordSil, true));

// --- the pill --------------------------------------------------------------
// A stadium: fully rounded ends, dark fill, a pale ring inside a black
// outline, pale letters bevelled dark on their lower right.

const PILL_PAD_X = 11, PILL_PAD_Y = 5;

function buildPill() {
  const lw = tidesSil[0].length, lh = tidesSil.length;
  const w = lw + PILL_PAD_X * 2, h = lh + PILL_PAD_Y * 2;
  const r = h / 2;
  const sil = grid(w, h, false);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // Stadium = a rectangle with a half-circle cap at each end.
      const cx = Math.min(Math.max(x + 0.5, r), w - r);
      const dx = x + 0.5 - cx, dy = y + 0.5 - r;
      sil[y][x] = dx * dx + dy * dy <= (r - 0.5) * (r - 0.5);
    }
  }
  const ring = sil.map((row, y) => row.map((on, x) =>
    on && (!at(sil, x - 1, y) || !at(sil, x + 1, y) || !at(sil, x, y - 1) || !at(sil, x, y + 1))));
  const idx = grid(w, h, -1);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!sil[y][x]) continue;
      idx[y][x] = ring[y][x] ? 0 : (y > h * 0.62 ? 2 : 1);
    }
  }
  // Letters, pale with a dark lower-right bevel so they sit in the pill
  // rather than floating on it.
  for (let y = 0; y < lh; y++) {
    for (let x = 0; x < lw; x++) {
      if (!tidesSil[y][x]) continue;
      const px = x + PILL_PAD_X, py = y + PILL_PAD_Y;
      if (!at(tidesSil, x + 1, y) && idx[py][px + 1] !== undefined && sil[py][px + 1]) idx[py][px + 1] = 2;
      if (!at(tidesSil, x, y + 1) && py + 1 < h && sil[py + 1][px]) idx[py + 1][px] = 2;
    }
  }
  for (let y = 0; y < lh; y++) {
    for (let x = 0; x < lw; x++) {
      if (tidesSil[y][x]) idx[y + PILL_PAD_Y][x + PILL_PAD_X] = 0;
    }
  }
  return outline(idx);
}

const pillArt = buildPill();

// --- the backdrop ----------------------------------------------------------
// The mottled shape the wordmark sits on. Its edge is dithered rather than
// outlined, which is what makes the source's equivalent read as painted; a
// hard outline here would fight the wordmark's own.

const SPLASH_MX = 15, SPLASH_TOP = 9, SPLASH_GAP = 2, SPLASH_GAP2 = 1, SPLASH_BOT = 9;

/** Deterministic integer hash -> [0,1). No RNG: identical on every boot. */
function hash2(x, y) {
  let h = Math.imul(x + 1013, 374761393) ^ Math.imul(y + 2027, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function buildSplash() {
  const capW = captionArt[0].length, capH = captionArt.length;
  const wW = wordArt[0].length, wH = wordArt.length;
  const ofW = ofArt[0].length, ofH = ofArt.length;
  const w = wW + SPLASH_MX * 2;
  const h = SPLASH_TOP + capH + SPLASH_GAP + wH + SPLASH_GAP2 + ofH + SPLASH_BOT;
  const capX = Math.round((w - capW) / 2), capY = SPLASH_TOP;
  const wX = Math.round((w - wW) / 2), wY = SPLASH_TOP + capH + SPLASH_GAP;
  const ofX = Math.round((w - ofW) / 2), ofY = wY + wH + SPLASH_GAP2;

  // Everything the halo should hug, in splash space.
  const marks = grid(w, h, false);
  const stamp = (art, ox, oy) => {
    for (let y = 0; y < art.length; y++) {
      for (let x = 0; x < art[0].length; x++) {
        if (art[y][x] !== -1 && oy + y < h && ox + x < w && oy + y >= 0 && ox + x >= 0) marks[oy + y][ox + x] = true;
      }
    }
  };
  stamp(captionArt, capX, capY);
  stamp(wordArt, wX, wY);
  stamp(ofArt, ofX, ofY);
  // ONE pixel, not two. The halo is a fringe hugging the letters, and at two
  // it closes every counter and every gap between lines and the backdrop
  // becomes a pale slab with the mottle only visible around its rim — which
  // is the opposite of the source, where the mottle is the dominant texture
  // and the fringe is a thin bright edge on the letters.
  const halo = dilate(marks, 1);

  const idx = grid(w, h, -1);
  const cx = w / 2, cy = h / 2;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (x + 0.5 - cx) / (w / 2), dy = (y + 0.5 - cy) / (h / 2);
      const ang = Math.atan2(dy, dx);
      // Four harmonics: enough to read as a torn patch rather than an oval,
      // but kept shallow. At larger amplitudes some directions collapsed to
      // half the radius and the backdrop stopped enclosing its own text.
      const wob = 0.10 * Math.sin(ang * 3 + 0.7) + 0.07 * Math.sin(ang * 5 + 2.1)
        + 0.05 * Math.sin(ang * 8 + 4.2) + 0.03 * Math.sin(ang * 13 + 1.3);
      const d = Math.sqrt(dx * dx + dy * dy) / (1.02 + wob);
      let inside = d < 1;
      // Dither only the last stretch of the edge. Starting this at 0.72 ate
      // most of the shape and left a scatter of dots that read as speckle
      // rather than as a painted mass.
      if (inside && d > 0.80) inside = hash2(x, y) > (d - 0.80) / 0.20 * 0.95;
      if (!inside && !halo[y][x]) continue;
      if (halo[y][x]) { idx[y][x] = 0; continue; }
      // Clumped mottle. Two low-frequency fields at different scales do
      // almost all the work and the hash only breaks up their banding: at a
      // 40% hash weight (and higher frequencies) this was per-pixel static
      // that read as TV snow, not as paint. Texture in the source art is
      // patchy, and patches need a wavelength longer than one pixel.
      const f = 0.5
        + 0.34 * Math.sin(x * 0.19 + y * 0.11) * Math.cos(x * 0.09 - y * 0.21)
        + 0.17 * Math.sin(x * 0.07 - y * 0.05 + 1.9);
      const n = f * 0.88 + hash2(x, y) * 0.12 - (d > 0.7 ? (d - 0.7) * 0.35 : 0);
      idx[y][x] = n < 0.34 ? 3 : (n < 0.62 ? 2 : 1);
    }
  }
  return { art: idx, capX, capY, wX, wY, ofX, ofY, w, h };
}

const splash = buildSplash();

// ---------------------------------------------------------------------------
// Exports.
// ---------------------------------------------------------------------------

export const TITLE_ART = {
  title_splash: { art: toArt(splash.art), pal: 'title_splash' },
  title_caption: { art: toArt(captionArt), pal: 'title_caption' },
  title_of: { art: toArt(ofArt), pal: 'title_caption' },
  title_wordmark: { art: toArt(wordArt), pal: 'title_gold' },
  title_pill: { art: toArt(pillArt), pal: 'title_pill' },
  title_press: { art: toArt(pressArt), pal: 'title_press' },
};

/** Where the three text lines sit inside the backdrop, so title.js can place
 *  them all from one anchor and they stay locked together while it bobs. */
export const TITLE_LAYOUT = {
  splash: { w: splash.w, h: splash.h },
  caption: { x: splash.capX, y: splash.capY },
  wordmark: { x: splash.wX, y: splash.wY },
  of: { x: splash.ofX, y: splash.ofY },
};

export const TITLE_PALETTES = {
  // Gold on deep sea is the complementary pairing the source gets from purple
  // on orange: the wordmark has to be the lightest thing on the screen.
  title_gold: ['#fff8d8', '#f0c040', '#a05c18', '#000000'],
  // The backdrop: a dark green-blue mass, three mottle tones, no outline. Its
  // index 0 is the pale halo hugging the wordmark, not part of the mottle.
  // Lifted off the background blue: at #1c4c44/#123430 the two darker mottle
  // tones sat at the sea's own value and the backdrop had no mass at all.
  // Pulled back toward teal from there, because a greener ramp read as grass
  // rather than as something the sea left behind.
  title_splash: ['#cfeee4', '#3f8a80', '#2a6060', '#1c4348'],
  title_caption: ['#ffffff', '#e8f8ff', '#78b8d8', '#08142c'],
  // Deep enough that the pale letters inside carry the same contrast the
  // source gets from white on purple, and hold it under the tide wash.
  title_pill: ['#f4fcff', '#16346c', '#0a1c40', '#000000'],
  title_press: ['#ffffff', '#7ce0e8', '#2888a0', '#001c28'],
};

export function installTitleSprites() {
  registerPalettes(TITLE_PALETTES);
  sprites.add(TITLE_ART);
}
