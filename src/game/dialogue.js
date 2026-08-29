// Text boxes: typewriter output, paging, and yes/no choices.

import { SCREEN_W, SCREEN_H, HUD_H, VIEW_H } from '../core/screen.js';
import { drawText, textWidth, paginate } from '../gfx/font.js';
import { sprites } from '../gfx/art.js';
import { TEXT_SPEED, TEXT_FAST_SCALE, TEXT_BEEP_EVERY } from '../data/feel.js';

const BOX_X = 4;
const BOX_W = SCREEN_W - 8;
const LINE_H = 9;
const LINES = 3;
const PAD = 5;
const BOX_H = PAD * 2 + LINE_H * LINES - 1;

// Named dialogue text, so NPCs in map data reference a script id rather than
// carrying prose inline.
export const TEXTS = new Map();

export function registerTexts(obj) {
  for (const [k, v] of Object.entries(obj)) TEXTS.set(k, v);
}

export function getText(id) {
  return TEXTS.get(id) || null;
}

export class Dialogue {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.pages = [];
    this.page = 0;
    this.chars = 0; this.beeped = 0;
    this.speed = TEXT_SPEED;   // chars/f; see src/data/feel.js
    this.done = false;
    this.onClose = null;
    this.choices = null;       // { options:[...], index, onPick }
    this.top = false;          // draw at the top if Link is standing low
    this.queue = [];
    this.holdFrames = 0;
  }

  /**
   * Show text. Supports '\n' for hard breaks and splits into 3-line pages.
   * opts: { onClose, choices:[..], onPick, top }
   */
  show(text, opts = {}) {
    if (text == null || text === '') { if (opts.onClose) opts.onClose(); return; }
    if (this.active) { this.queue.push([text, opts]); return; }
    this.pages = paginate(String(text), BOX_W - PAD * 2 - 2, LINES);
    this.page = 0;
    this.chars = 0; this.beeped = 0;
    this.active = true;
    this.done = false;
    this.onClose = opts.onClose || null;
    this.choices = opts.choices
      ? { options: opts.choices, index: opts.defaultIndex || 0, onPick: opts.onPick || null }
      : null;
    const p = this.game.player;
    // Where he is ON SCREEN, which is where the text box has to avoid being.
    const cam = this.game.camera;
    this.top = !!(p && p.y - (cam ? cam.y : 0) > VIEW_H - 60);
    this.holdFrames = 0;
  }

  close() {
    this.active = false;
    this.choices = null;
    const cb = this.onClose;
    this.onClose = null;
    if (cb) cb();
    if (this.queue.length) {
      const [t, o] = this.queue.shift();
      this.show(t, o);
    }
  }

  get currentText() { return (this.pages[this.page] || []).join('\n'); }
  get pageLen() { return this.currentText.length; }

  update() {
    if (!this.active) return;
    const i = this.game.input;

    if (this.chars < this.pageLen) {
      const fast = i.down('a') || i.down('b');
      this.chars = Math.min(this.pageLen, this.chars + this.speed * (fast ? TEXT_FAST_SCALE : 1));
      // Click as characters appear, but not on every single one. Counted off
      // the characters actually revealed, not off the running total: testing
      // `floor(chars) % N` made the blip's beat an artefact of a non-integer
      // TEXT_SPEED rather than a rhythm.
      const shown = Math.floor(this.chars);
      if (shown - this.beeped >= TEXT_BEEP_EVERY) {
        this.beeped = shown - (shown % TEXT_BEEP_EVERY);
        this.game.audio.sfx('text', { vol: 0.4 });
      }
      return;
    }

    // Fully revealed: wait for A, unless a choice is pending.
    if (this.choices && this.page >= this.pages.length - 1) {
      if (i.pressed('up')) {
        this.choices.index = (this.choices.index + this.choices.options.length - 1) % this.choices.options.length;
        this.game.audio.sfx('cursor');
      }
      if (i.pressed('down')) {
        this.choices.index = (this.choices.index + 1) % this.choices.options.length;
        this.game.audio.sfx('cursor');
      }
      if (i.pressed('a')) {
        const pick = this.choices.index;
        const cb = this.choices.onPick;
        this.game.audio.sfx('confirm');
        this.choices = null;
        this.active = false;
        const after = this.onClose;
        this.onClose = null;
        if (cb) cb(pick);
        if (after) after();
        if (this.queue.length) { const [t, o] = this.queue.shift(); this.show(t, o); }
      }
      return;
    }

    if (i.pressed('a') || i.pressed('b')) {
      if (this.page < this.pages.length - 1) {
        this.page++;
        this.chars = 0; this.beeped = 0;
        this.game.audio.sfx('textNext');
      } else {
        this.game.audio.sfx('textNext');
        this.close();
      }
    }
  }

  draw(ctx) {
    if (!this.active) return;
    const extra = this.choices && this.page >= this.pages.length - 1
      ? this.choices.options.length * LINE_H + 2 : 0;
    const h = BOX_H + extra;
    const y = this.top ? HUD_H + 4 : SCREEN_H - h - 5;
    drawBox(ctx, BOX_X, y, BOX_W, h);

    const shown = this.currentText.slice(0, Math.floor(this.chars));
    const lines = shown.split('\n');
    for (let i = 0; i < lines.length; i++) {
      drawText(ctx, lines[i], BOX_X + PAD, y + PAD + i * LINE_H, '#181c18');
    }

    if (this.choices && this.chars >= this.pageLen) {
      const oy = y + PAD + LINES * LINE_H - 2;
      this.choices.options.forEach((opt, i) => {
        const ly = oy + i * LINE_H;
        drawText(ctx, opt, BOX_X + PAD + 10, ly, '#181c18');
        if (i === this.choices.index) {
          drawText(ctx, '\x02', BOX_X + PAD + 2, ly, '#181c18');
        }
      });
    } else if (this.chars >= this.pageLen) {
      // blinking "more" arrow
      if ((this.game.frame >> 3) % 2 === 0) {
        drawText(ctx, '\x02', BOX_X + BOX_W - 11, y + h - 10, '#505850');
      }
    }
  }
}

/** A Game Boy style text panel: light fill, dark border, rounded corners. */
export function drawBox(ctx, x, y, w, h) {
  ctx.fillStyle = '#181c18';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#f8f8f0';
  ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  ctx.fillStyle = '#606860';
  ctx.fillRect(x + 1, y + h - 2, w - 2, 1);
  ctx.fillRect(x + w - 2, y + 1, 1, h - 2);
  // knock out the corners
  ctx.fillStyle = '#181c18';
  ctx.fillRect(x, y, 1, 1);
  ctx.fillRect(x + w - 1, y, 1, 1);
  ctx.fillRect(x, y + h - 1, 1, 1);
  ctx.fillRect(x + w - 1, y + h - 1, 1, 1);
}

/** A dark panel used by menus and the map screen. */
export function drawPanel(ctx, x, y, w, h) {
  ctx.fillStyle = '#080c10';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#303c48';
  ctx.fillRect(x, y, w, 1);
  ctx.fillRect(x, y + h - 1, w, 1);
  ctx.fillRect(x, y, 1, h);
  ctx.fillRect(x + w - 1, y, 1, h);
}
