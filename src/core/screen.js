// Screen: owns the 160x144 Game Boy Color framebuffer and integer-scales it to the window.
// All drawing in the game happens against this one context at native GBC resolution.

export const SCREEN_W = 160;
export const SCREEN_H = 144;
export const HUD_H = 16;          // status bar occupies the top 16 scanlines
export const VIEW_W = 160;
export const VIEW_H = 128;        // playfield: 10x8 tiles of 16px
export const TILE = 16;
// CSS px: where an upright phone's screen starts (below SEL/START) and the
// gap left above the touch controls. Layout, not timing.
const PORTRAIT_TOP = 56;
const PORTRAIT_GAP = 8;
export const ROOM_W = 10;
export const ROOM_H = 8;

export class Screen {
  constructor(canvas) {
    this.canvas = canvas;
    canvas.width = SCREEN_W;
    canvas.height = SCREEN_H;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.ctx.imageSmoothingEnabled = false;
    this.scale = 1;
    this._onResize = () => this.fit();
    window.addEventListener('resize', this._onResize);
    this.fit();
  }

  /**
   * Largest integer scale that fits the viewport, with a small margin on
   * desktop — but the integer has to be counted in DEVICE pixels, not CSS
   * pixels. `window.innerWidth`/`innerHeight` are CSS pixels; on a 2x panel
   * (every iPad) each CSS pixel is 2 physical pixels, so an integer CSS-pixel
   * scale times a fractional-in-context DPR can still land the 160x144
   * backing store on a device-pixel boundary the browser has to resample —
   * `image-rendering: pixelated` cannot rescue a blit that isn't already
   * pixel-aligned. Working in device pixels first and dividing back down by
   * `dpr` for the CSS size keeps `scale` an exact multiple of the backing
   * store at the hardware level regardless of what `dpr` itself is.
   *
   * The backing store (`canvas.width`/`height`) stays 160x144: that is the
   * native GBC resolution the whole game draws at, not a texture to be
   * upsampled ahead of time, and `tools/check-build.mjs` asserts it directly.
   * Letterboxing is `#wrap`'s flex centering plus the fixed black background.
   */
  fit() {
    const dpr = window.devicePixelRatio || 1;
    const margin = window.innerWidth < 700 ? 0 : 16;
    const devW = (window.innerWidth - margin) * dpr;
    let devH = (window.innerHeight - margin) * dpr;
    // A PHONE HELD UPRIGHT (S165): the screen goes at the top, under SEL and
    // START, and only as big as the room left above the d-pad and A/B — it
    // used to be centred, with empty space above it and the controls lying
    // over its bottom edge. Landscape keeps the controls either side.
    const touch = document.body.classList.contains('touch');
    const portrait = touch && window.innerHeight > window.innerWidth;
    document.body.classList.toggle('portrait', portrait);
    if (portrait) {
      const top = this._controlsTop();
      if (top) devH = (top - PORTRAIT_TOP - PORTRAIT_GAP) * dpr;
    }
    let devScale = Math.floor(Math.min(devW / SCREEN_W, devH / SCREEN_H));
    if (devScale < 1) devScale = 1;            // never shrink below native size
    this.scale = devScale / dpr;
    this.canvas.style.width = (SCREEN_W * this.scale) + 'px';
    this.canvas.style.height = (SCREEN_H * this.scale) + 'px';
  }

  /** CSS-pixel y of the highest on-screen control below the play area. */
  _controlsTop() {
    let top = 0;
    for (const id of ['dpad', 'btns']) {
      const el = document.getElementById(id);
      const r = el && el.getBoundingClientRect();
      if (r && r.height > 0) top = top ? Math.min(top, r.top) : r.top;
    }
    return top;
  }

  clear(color = '#000') {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
  }

  /** A fade to black or white over the whole screen; see paletteFade. */
  fade(amount, toWhite = false) { paletteFade(this.ctx, amount, toWhite); }
}

// SEASONS' FADE (S171). The cartridge never lays a sheet over the picture: its
// palette thread (oracles-disasm bank1.s paletteFadeHandler01/02/03 and
// paletteThread_calculateFadingPalettes) adds one offset to the red, green and
// blue of every colour, each 0-31, and a component that goes past 31 (or
// below 0) is pinned there. The offset moves by the fade's speed each frame
// toward 32 (white) or -32 (black), so dark colours stay visible longest and
// the picture washes out evenly instead of going milky. `amount` 0..1 is how
// far through the fade we are; offset = amount * 32, at most 31, so amount 1
// is every component pinned. Colours go to 5 bits and back the way the
// rippers bring them in ((c << 3) | (c >> 2)).
const FADE_LUT = new Map();
function fadeLut(offset) {
  let lut = FADE_LUT.get(offset);
  if (!lut) {
    lut = new Uint8ClampedArray(256);
    for (let c = 0; c < 256; c++) {
      const v = Math.max(0, Math.min(31, Math.round(c * 31 / 255) + offset));
      lut[c] = (v << 3) | (v >> 2);
    }
    FADE_LUT.set(offset, lut);
  }
  return lut;
}

// The picture is copied to a CPU-side scratch canvas and read back from that,
// so the main canvas keeps its GPU backing outside a fade.
let fadeScratch = null;
export function paletteFade(ctx, amount, toWhite = false) {
  if (!(amount > 0)) return;
  const off = Math.min(31, Math.floor(Math.min(1, amount) * 32)) * (toWhite ? 1 : -1);
  if (off === 0) return;
  const w = ctx.canvas.width, h = ctx.canvas.height;
  if (!fadeScratch || fadeScratch.canvas.width !== w || fadeScratch.canvas.height !== h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    fadeScratch = c.getContext('2d', { willReadFrequently: true });
  }
  fadeScratch.clearRect(0, 0, w, h);
  fadeScratch.drawImage(ctx.canvas, 0, 0);
  const img = fadeScratch.getImageData(0, 0, w, h);
  const d = img.data, lut = fadeLut(off);
  for (let i = 0; i < d.length; i += 4) {
    d[i] = lut[d[i]]; d[i + 1] = lut[d[i + 1]]; d[i + 2] = lut[d[i + 2]];
  }
  ctx.putImageData(img, 0, 0);
}

// A reusable offscreen canvas factory. Used for tile caches and room composites.
export function offscreen(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  return { canvas: c, ctx: x };
}
