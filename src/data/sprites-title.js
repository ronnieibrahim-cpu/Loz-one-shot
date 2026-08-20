// The title wordmark and tagline: hand-drawn pixel art, built from a small
// bespoke 5x7 caps typeface authored for this logo alone. Nothing in
// assets/sheets/ has this game's name on it, so per docs/ART-DIRECTION.md
// rule 2 this is drawn to match the register measured off the source sheets:
// a light-to-dark ramp with a hard black outline, no anti-aliasing.
//
// Not a ripper output — there is no sheet to re-run against — so this file is
// hand-authored source, not generated. The glyphs are literal pixel data; the
// only computed step is stacking glyphs into a line, centering lines on each
// other, and dilating a 1px outline around the assembled silhouette.

import { sprites } from '../gfx/art.js';
import { registerPalettes } from '../gfx/palettes.js';

const GLYPH_W = 5, GLYPH_H = 7;
const SPACE_W = 3;

// Each glyph is 7 rows of 5 chars, '#' filled / '.' empty. Only the letters
// this logo and tagline use.
const GLYPHS = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  C: ['.####', '#....', '#....', '#....', '#....', '#....', '.####'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.####', '#....', '#....', '#.###', '#...#', '#...#', '.####'],
  I: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '#####'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  N: ['#...#', '##..#', '#.#.#', '#.#.#', '#..##', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
};

/** Build one line's silhouette as a { w, h, fill } boolean grid. */
function buildLine(text) {
  const chars = [...text.toUpperCase()];
  let w = 0;
  for (const c of chars) w += (c === ' ' ? SPACE_W : GLYPH_W) + 1;
  w = Math.max(0, w - 1);
  const fill = new Array(GLYPH_H).fill(null).map(() => new Array(w).fill(false));
  let x = 0;
  for (const c of chars) {
    if (c === ' ') { x += SPACE_W + 1; continue; }
    const g = GLYPHS[c];
    if (!g) { x += GLYPH_W + 1; continue; }
    for (let y = 0; y < GLYPH_H; y++) {
      for (let gx = 0; gx < GLYPH_W; gx++) {
        if (g[y][gx] === '#') fill[y][x + gx] = true;
      }
    }
    x += GLYPH_W + 1;
  }
  return { w, h: GLYPH_H, fill };
}

/** Nearest-neighbour integer upscale of a boolean grid. */
function upscale(grid, scale) {
  const w = grid.w * scale, h = grid.h * scale;
  const fill = new Array(h).fill(null).map(() => new Array(w).fill(false));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      fill[y][x] = grid.fill[Math.floor(y / scale)][Math.floor(x / scale)];
    }
  }
  return { w, h, fill };
}

/**
 * Stack lines centered on each other with a fixed gap, shade each glyph
 * top-to-bottom in three bands (light/mid/dark, index 0/1/2), then dilate a
 * 1px black outline (index 3) around the combined silhouette. Returns an
 * art template string ready for parseArt.
 */
function composeLogo(lines, scale, gapPx) {
  const built = lines.map(l => upscale(buildLine(l), scale));
  const innerW = Math.max(...built.map(b => b.w));
  const innerH = built.reduce((a, b) => a + b.h, 0) + gapPx * (built.length - 1);
  // A 1px transparent margin all round so the outline dilation below has
  // somewhere to paint — without it, a letter touching the array edge would
  // lose its outline on that side.
  const w = innerW + 2, h = innerH + 2;
  // index grid: -1 = transparent, 0/1/2 = shade bands, 3 = outline (added later)
  const idx = new Array(h).fill(null).map(() => new Array(w).fill(-1));
  let oy = 1;
  for (const b of built) {
    const ox = 1 + Math.floor((innerW - b.w) / 2);
    for (let y = 0; y < b.h; y++) {
      const band = y < b.h * 0.3 ? 0 : (y < b.h * 0.65 ? 1 : 2);
      for (let x = 0; x < b.w; x++) {
        if (b.fill[y][x]) idx[oy + y][ox + x] = band;
      }
    }
    oy += b.h + gapPx;
  }
  // Outline: any transparent cell 8-adjacent to a filled cell becomes index 3.
  const out = idx.map(row => row.slice());
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (idx[y][x] !== -1) continue;
      let touches = false;
      for (let dy = -1; dy <= 1 && !touches; dy++) {
        for (let dx = -1; dx <= 1 && !touches; dx++) {
          if (dy === 0 && dx === 0) continue;
          const ny = y + dy, nx = x + dx;
          if (ny < 0 || ny >= h || nx < 0 || nx >= w) continue;
          if (idx[ny][nx] !== -1) touches = true;
        }
      }
      if (touches) out[y][x] = 3;
    }
  }
  const rows = out.map(row => row.map(v => (v === -1 ? '.' : String(v))).join(''));
  return { art: rows.join('\n'), w, h };
}

// "ORACLE" over "OF TIDES", 2x scale, 4px line gap.
const wordmark = composeLogo(['ORACLE', 'OF TIDES'], 2, 4);
// "A TIDE LEGEND" at 1x, the tagline that replaces the borrowed "THE LEGEND
// OF ZELDA" line — same arched-caption grammar, original words.
const tagline = composeLogo(['A TIDE LEGEND'], 1, 0);

export const TITLE_ART = {
  title_wordmark: { art: wordmark.art, pal: 'title_gold' },
  title_tagline: { art: tagline.art, pal: 'title_tag' },
};
export const TITLE_SIZES = { wordmark: { w: wordmark.w, h: wordmark.h }, tagline: { w: tagline.w, h: tagline.h } };

// Light / mid / dark / outline. Gold ramp for the wordmark, echoing the
// heart/rupee UI gold; cyan ramp for the tagline, echoing the water palette.
export const TITLE_PALETTES = {
  title_gold: ['#fff4c0', '#f0c040', '#a86818', '#000000'],
  title_tag: ['#e8f8ff', '#78c8e8', '#2868b8', '#000000'],
};

export function installTitleSprites() {
  registerPalettes(TITLE_PALETTES);
  sprites.add(TITLE_ART);
}
