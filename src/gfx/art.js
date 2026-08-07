// Art pipeline.
//
// ART FORMAT (this is the contract all art data files follow):
//   Art is a plain template string of rows. One character per pixel.
//     '.' or ' '  -> transparent
//     '0'         -> palette colour 0 (lightest)
//     '1'         -> palette colour 1
//     '2'         -> palette colour 2
//     '3'         -> palette colour 3 (darkest; conventionally the outline)
//   Leading/trailing blank lines are ignored. Every row is left-trimmed by the
//   smallest common indentation, so art can be indented inside source files.
//   Width is the longest row; short rows are padded with transparent.
//
// Terrain tiles are 16x16 and use all four indices with no transparency.
// Sprites are usually 16x16 and use '.' for transparency with '3' as outline.
//
// Decoded art is baked to an offscreen canvas per (art, palette, flip) triple and
// cached, so per-frame drawing is a plain drawImage with no per-pixel work.

import { getPalette, tintPalette } from './palettes.js';

const TRANSPARENT = 255;

/** Parse an art string into { w, h, px } where px is row-major palette indices. */
export function parseArt(src) {
  let lines = src.replace(/\t/g, '    ').split('\n');
  // drop leading/trailing blank lines
  while (lines.length && lines[0].trim() === '') lines.shift();
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
  if (!lines.length) return { w: 1, h: 1, px: new Uint8Array([TRANSPARENT]) };

  // strip the common indentation so art can be indented in source
  let indent = Infinity;
  for (const l of lines) {
    if (l.trim() === '') continue;
    const m = l.match(/^ */)[0].length;
    if (m < indent) indent = m;
  }
  if (!isFinite(indent)) indent = 0;
  lines = lines.map(l => l.slice(indent));

  const h = lines.length;
  const w = lines.reduce((a, l) => Math.max(a, l.replace(/\s+$/, '').length), 0) || 1;
  const px = new Uint8Array(w * h).fill(TRANSPARENT);
  for (let y = 0; y < h; y++) {
    const l = lines[y];
    for (let x = 0; x < w && x < l.length; x++) {
      const c = l[x];
      if (c >= '0' && c <= '3') px[y * w + x] = c.charCodeAt(0) - 48;
      // '.', ' ' and anything else stay transparent
    }
  }
  return { w, h, px };
}

function bakeCanvas(art, palette, flipX, flipY) {
  const { w, h, px } = art;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(w, h);
  const rgb = palette.map(hx => [
    parseInt(hx.slice(1, 3), 16), parseInt(hx.slice(3, 5), 16), parseInt(hx.slice(5, 7), 16),
  ]);
  for (let y = 0; y < h; y++) {
    const sy = flipY ? (h - 1 - y) : y;
    for (let x = 0; x < w; x++) {
      const sx = flipX ? (w - 1 - x) : x;
      const v = px[sy * w + sx];
      const o = (y * w + x) * 4;
      if (v === TRANSPARENT) { img.data[o + 3] = 0; continue; }
      const col = rgb[v] || rgb[rgb.length - 1];
      img.data[o] = col[0]; img.data[o + 1] = col[1]; img.data[o + 2] = col[2]; img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

/**
 * Registry of named art with lazy baking.
 * Art entries may be either an art string, or { art, pal } to bind a default palette.
 */
export class Sheet {
  constructor() {
    this.defs = new Map();     // name -> { art, pal }
    this.cache = new Map();    // cacheKey -> canvas
    this.tint = null;
    this.tintKey = 'n';
    this.missing = new Set();
  }

  /** Register a batch: { name: artString } or { name: {art, pal} }. */
  add(defs, defaultPal) {
    for (const [name, v] of Object.entries(defs)) {
      if (v == null) continue;
      const entry = (typeof v === 'string')
        ? { art: parseArt(v), pal: defaultPal || 'stone' }
        : { art: parseArt(v.art), pal: v.pal || defaultPal || 'stone' };
      this.defs.set(name, entry);
    }
    return this;
  }

  has(name) { return this.defs.has(name); }
  size(name) {
    const d = this.defs.get(name);
    return d ? { w: d.art.w, h: d.art.h } : { w: 0, h: 0 };
  }
  names() { return [...this.defs.keys()]; }

  setTint(tint, key) {
    if (this.tintKey === (key || 'n')) return;
    this.tint = tint;
    this.tintKey = key || 'n';
  }

  /** Get (and cache) a baked canvas. */
  bake(name, palName, flipX = false, flipY = false) {
    const d = this.defs.get(name);
    if (!d) {
      // Unauthored art renders as a visible placeholder rather than vanishing, so
      // gaps are obvious on screen and countable via `missing`.
      if (!this.missing.has(name)) { this.missing.add(name); console.warn('[art] missing:', name); }
      return placeholder(name);
    }
    const p = palName || d.pal;
    const key = name + '|' + p + '|' + (flipX ? 1 : 0) + (flipY ? 1 : 0) + '|' + this.tintKey;
    let c = this.cache.get(key);
    if (!c) {
      c = bakeCanvas(d.art, tintPalette(getPalette(p), this.tint), flipX, flipY);
      this.cache.set(key, c);
    }
    return c;
  }

  /**
   * Draw art at integer pixel coordinates.
   * opts: { pal, flipX, flipY, alpha, w, h } — w/h crop the drawn region (top-left anchored).
   *
   * `x` and `y` ARE ALREADY WHOLE PIXELS and this draws exactly where it is
   * told. Entity positions are 8.8 fixed-point with an integer pixel accessor
   * (src/core/fixed.js), tiles are drawn at multiples of TILE, and the handful
   * of call sites that compute a fraction — the dredge line's chain links — round
   * it themselves.
   *
   * There used to be an `x | 0` here. It was not a safety net, it was a bug:
   * `| 0` truncates toward zero, so it floored correctly for positive x and
   * incorrectly for negative x, putting anything left of the screen edge a
   * pixel too far right. The player sits at negative x during every single room
   * transition, so this misdrew on every seam in the game — a one-pixel hitch
   * hidden inside a scrolling screen, which is why it survived this long.
   */
  draw(ctx, name, x, y, opts) {
    const o = opts || {};
    const c = this.bake(name, o.pal, o.flipX, o.flipY);
    if (!c) return;
    if (o.alpha != null && o.alpha < 1) {
      const prev = ctx.globalAlpha;
      ctx.globalAlpha = o.alpha;
      this._blit(ctx, c, x, y, o);
      ctx.globalAlpha = prev;
    } else {
      this._blit(ctx, c, x, y, o);
    }
  }

  _blit(ctx, c, px, py, o) {
    if (o.w != null || o.h != null) {
      const w = Math.min(o.w != null ? o.w : c.width, c.width);
      const h = Math.min(o.h != null ? o.h : c.height, c.height);
      if (w <= 0 || h <= 0) return;
      // srcY offset lets us clip a sprite from the top (used for water wading)
      const sy = o.clipTop || 0;
      ctx.drawImage(c, 0, sy, w, h - sy, px, py + sy, w, h - sy);
    } else {
      ctx.drawImage(c, px, py);
    }
  }

  /** Invalidate baked canvases (after a tint change). */
  flush() { this.cache.clear(); }
}

// Placeholder art for names that have not been drawn yet: a hollow box with a
// diagonal, distinct enough to spot instantly but not so loud it hides layout bugs.
const placeholders = new Map();
function placeholder(name) {
  let c = placeholders.get(name);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = 16; c.height = 16;
  const x = c.getContext('2d');
  // Hash the name to a hue so different missing sprites are distinguishable.
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  x.fillStyle = `hsl(${h % 360},70%,55%)`;
  x.fillRect(1, 1, 14, 14);
  x.fillStyle = '#101010';
  x.fillRect(2, 2, 12, 12);
  x.fillStyle = `hsl(${h % 360},70%,70%)`;
  for (let i = 0; i < 12; i++) x.fillRect(2 + i, 2 + i, 1, 1);
  placeholders.set(name, c);
  return c;
}

// One sheet for background/terrain tiles, one for everything that moves.
// Kept separate so a tint change can flush only what it affects.
export const tiles = new Sheet();
export const sprites = new Sheet();

export function flushAll() { tiles.flush(); sprites.flush(); }
