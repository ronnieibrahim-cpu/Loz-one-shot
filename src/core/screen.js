// Screen: owns the 160x144 Game Boy Color framebuffer and integer-scales it to the window.
// All drawing in the game happens against this one context at native GBC resolution.

export const SCREEN_W = 160;
export const SCREEN_H = 144;
export const HUD_H = 16;          // status bar occupies the top 16 scanlines
export const VIEW_W = 160;
export const VIEW_H = 128;        // playfield: 10x8 tiles of 16px
export const TILE = 16;
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

  // Largest integer scale that fits the viewport, with a small margin on desktop.
  fit() {
    const margin = window.innerWidth < 700 ? 0 : 16;
    const sx = (window.innerWidth - margin) / SCREEN_W;
    const sy = (window.innerHeight - margin) / SCREEN_H;
    let s = Math.floor(Math.min(sx, sy));
    if (s < 1) s = Math.min(sx, sy);           // sub-integer only if we truly can't fit 1x
    this.scale = s;
    this.canvas.style.width = (SCREEN_W * s) + 'px';
    this.canvas.style.height = (SCREEN_H * s) + 'px';
  }

  clear(color = '#000') {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
  }

  // Quantized darkening/brightening overlay. The real hardware faded by rewriting
  // palette RAM; a 4-step overlay reads almost identically at this resolution.
  fade(amount, toWhite = false) {
    if (amount <= 0) return;
    const a = Math.min(1, Math.round(amount * 4) / 4);
    this.ctx.globalAlpha = a;
    this.ctx.fillStyle = toWhite ? '#ffffff' : '#000000';
    this.ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    this.ctx.globalAlpha = 1;
  }
}

// A reusable offscreen canvas factory. Used for tile caches and room composites.
export function offscreen(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  return { canvas: c, ctx: x };
}
