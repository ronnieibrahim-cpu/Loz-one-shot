// Title screen and file select.

import { SCREEN_W, SCREEN_H } from '../core/screen.js';
import { drawText, drawTextCentered, textWidth } from '../gfx/font.js';
import { sprites, tiles as tileSheet } from '../gfx/art.js';
import { drawPanel, drawBox } from './dialogue.js';
import { listSaves, deleteSlot, HEART_UNITS } from './progress.js';
import { essenceCount } from '../world/maps.js';
import { TITLE_LAYOUT } from '../data/sprites-title.js';

// How many phases of the swirling sea get baked. Not a timing constant (the
// title's own animation rates are inline here, as the bob always was) — it is
// the length of the cache, and the sea is a loop, so this is how long the loop
// is before it repeats.
const SEA_FRAMES = 12;
// The single colour the tide wash is dithered in. One entry, by design: see
// drawWaterline.
const WASH = '#0d2650';

export class Title {
  constructor(game) {
    this.game = game;
    this.reset();
  }

  reset() {
    this.stage = 'logo';     // 'logo' | 'files' | 'confirmErase'
    this.t = 0;
    this.cursor = 0;
    this.saves = listSaves();
  }

  update() {
    const g = this.game, i = g.input;
    this.t++;

    if (this.stage === 'logo') {
      if (i.pressed('start') || i.pressed('a')) {
        this.stage = 'files';
        this.saves = listSaves();
        g.audio.sfx('confirm');
      }
      return;
    }

    if (this.stage === 'files') {
      const n = 4;   // 3 slots + erase
      if (i.pressed('up')) { this.cursor = (this.cursor + n - 1) % n; g.audio.sfx('cursor'); }
      if (i.pressed('down')) { this.cursor = (this.cursor + 1) % n; g.audio.sfx('cursor'); }
      if (i.pressed('b')) { this.stage = 'logo'; g.audio.sfx('cursor'); return; }
      if (i.pressed('a') || i.pressed('start')) {
        if (this.cursor === 3) { this.stage = 'confirmErase'; this.eraseCursor = 0; g.audio.sfx('cursor'); return; }
        g.audio.sfx('confirm');
        const s = this.saves[this.cursor];
        g.audio.stop();
        if (s) g.loadGame(this.cursor);
        else g.newGame(this.cursor);
      }
      return;
    }

    // confirmErase
    const n = 3;
    if (i.pressed('up')) { this.eraseCursor = (this.eraseCursor + n - 1) % n; g.audio.sfx('cursor'); }
    if (i.pressed('down')) { this.eraseCursor = (this.eraseCursor + 1) % n; g.audio.sfx('cursor'); }
    if (i.pressed('b')) { this.stage = 'files'; g.audio.sfx('cursor'); return; }
    if (i.pressed('a')) {
      deleteSlot(this.eraseCursor);
      this.saves = listSaves();
      this.stage = 'files';
      g.audio.sfx('confirm');
    }
  }

  draw(ctx) {
    this.drawSea(ctx);

    if (this.stage === 'logo') this.drawLogo(ctx);
    else if (this.stage === 'files') this.drawFiles(ctx);
    else this.drawErase(ctx);

    drawTitleFrame(ctx);
  }

  /**
   * One phase of the sea, baked to an offscreen canvas.
   *
   * THIS IS WRITTEN PER PIXEL ON PURPOSE. The obvious way to draw concentric
   * wobbled rings is a path per ring, painted largest-first — and that is what
   * this did first. Canvas 2D anti-aliases every path fill it makes, with no
   * flag to turn it off, so those rings arrived with soft edges and the title
   * screen's colour count went from 28 to 231. On a screen whose whole job is
   * to look like it came off a Game Boy Color, that is a fidelity break
   * `check-build.mjs` measures and ART-DIRECTION forbids outright. Writing
   * ImageData puts every pixel on exactly one of three tones.
   *
   * Baked rather than recomputed because per-pixel trig for 23,040 pixels
   * every frame is real work; the phases cycle, so there are only ever
   * SEA_FRAMES of them, built the first time each is asked for.
   */
  seaFrame(i) {
    if (!this._sea) this._sea = new Array(SEA_FRAMES).fill(null);
    if (this._sea[i]) return this._sea[i];
    // Three tones inside a narrow value range. The first pass used five across
    // a wide range and the contours read as loud concentric stripes that
    // fought the logo — the source's swirl is a texture you notice second,
    // not a pattern you read first.
    const BANDS = [[0x12, 0x31, 0x5a], [0x17, 0x3a, 0x68], [0x1c, 0x44, 0x76]];
    const c = document.createElement('canvas');
    c.width = SCREEN_W; c.height = SCREEN_H;
    const g = c.getContext('2d');
    const img = g.createImageData(SCREEN_W, SCREEN_H);
    const phase = i * (Math.PI * 2 / SEA_FRAMES);
    const cx = SCREEN_W / 2, cy = 64;
    for (let y = 0; y < SCREEN_H; y++) {
      for (let x = 0; x < SCREEN_W; x++) {
        const dx = (x + 0.5 - cx) / 1.35, dy = (y + 0.5 - cy) / 0.9;
        const r = Math.sqrt(dx * dx + dy * dy), ang = Math.atan2(dy, dx);
        // Two harmonics, one of them turning with the phase, so the rings
        // breathe instead of sitting still.
        const v = r - Math.sin(ang * 3 + phase * 1.7 + r * 0.05) * 4
          - Math.sin(ang * 5 - phase * 1.1) * 2.5;
        let b = Math.floor(v / 5 + i) % BANDS.length;
        if (b < 0) b += BANDS.length;
        const col = BANDS[b], o = (y * SCREEN_W + x) * 4;
        img.data[o] = col[0]; img.data[o + 1] = col[1];
        img.data[o + 2] = col[2]; img.data[o + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    this._sea[i] = c;
    return c;
  }

  /** A 2x2 dither tile, cached. Two densities stand in for the alpha wash the
   *  console cannot do: every pixel stays one palette colour. */
  ditherPattern(ctx, dense) {
    const key = dense ? '_dith2' : '_dith4';
    if (this[key]) return this[key];
    const c = document.createElement('canvas');
    c.width = 2; c.height = 2;
    const g = c.getContext('2d');
    g.fillStyle = WASH;
    g.fillRect(0, 0, 1, 1);
    if (dense) g.fillRect(1, 1, 1, 1);
    this[key] = ctx.createPattern(c, 'repeat');
    return this[key];
  }

  drawSea(ctx) {
    ctx.drawImage(this.seaFrame(Math.floor(this.t * 0.12) % SEA_FRAMES), 0, 0);

    // Chop drifting across the surface, kept from the original screen — but
    // only below the logo block, where it reads as water rather than as
    // scratches across the wordmark.
    for (let i = 0; i < 20; i++) {
      const y = 92 + (i * 7) % 48;
      const w = 6 + (i % 4) * 4;
      const x = ((i * 37) + Math.sin((this.t + i * 12) * 0.03) * 22 + this.t * 0.25) % (SCREEN_W + 20) - 10;
      ctx.fillStyle = i % 3 === 0 ? '#8cc8e4' : '#5c9cc8';
      ctx.fillRect(Math.round(x), y, w, 1);
    }
  }

  drawLogo(ctx) {
    const L = TITLE_LAYOUT;
    const bob = Math.round(Math.sin(this.t * 0.03) * 2);
    const sx = Math.round((SCREEN_W - L.splash.w) / 2);
    const sy = 2 + bob;

    // Backdrop, series line, wordmark, subtitle — one anchor, so the four
    // never drift apart when the block bobs.
    sprites.draw(ctx, 'title_splash', sx, sy);
    sprites.draw(ctx, 'title_caption', sx + L.caption.x, sy + L.caption.y);
    sprites.draw(ctx, 'title_wordmark', sx + L.wordmark.x, sy + L.wordmark.y);
    sprites.draw(ctx, 'title_sub', sx + L.sub.x, sy + L.sub.y);

    // The Moon Conch, overlapping the wordmark's right and hanging off the
    // backdrop — where the source cards put the Rod of Seasons and the Rod of
    // Ages. Drawn after the wordmark so it sits in front of the final letter.
    // Low enough that it crosses the last letter's bottom corner rather than
    // its middle: at the wordmark's own height the shell buried the A.
    const conch = sprites.size('title_conch');
    sprites.draw(ctx, 'title_conch', sx + L.splash.w - conch.w + 8, sy + 30);

    // The game's own word, in its own pill, overlapping the backdrop's lower
    // edge the way the source hangs its subtitle off the bottom of the logo.
    const pill = sprites.size('title_pill');
    const px = Math.round((SCREEN_W - pill.w) / 2);
    const py = sy + L.splash.h - 4;
    sprites.draw(ctx, 'title_pill', px, py);

    // Across the pill's lower edge, not across the wordmark. A waterline
    // through the middle of ORACLE cut the hero word in half and read as a
    // scanline; here it takes the word the game is named for down to the
    // ankles without costing a letter of legibility.
    this.drawWaterline(ctx, py + 16, py + pill.h + 16);

    if ((this.t >> 4) % 2 === 0) {
      const pr = sprites.size('title_press');
      sprites.draw(ctx, 'title_press', Math.round((SCREEN_W - pr.w) / 2), 108);
    }
    drawTextCentered(ctx, 'A fan homage', SCREEN_W / 2, 128, '#78a8c8', '#08142c');
  }

  /**
   * The one piece of scenery on this screen: a tide line the logo half-sinks
   * below. It crosses the whole width — a waterline that stopped at the logo's
   * edges would read as a highlight on the logo instead of as a sea level —
   * with a bright crest and a wash beneath it, and its bottom two rows
   * dithered so the band ends without a seam.
   *
   * `top` is where the water sits; `bottom` is where the wash stops, kept
   * above PRESS START so the prompt never reads as submerged.
   */
  drawWaterline(ctx, top, bottom) {
    const base = top + Math.sin(this.t * 0.045) * 2;
    // The crest is sampled per column so the wash starts exactly under it — a
    // straight wash edge below a scalloped crest was what made the first pass
    // read as a ruled line rather than as a surface.
    const crest = (x) => Math.round(base + Math.sin(this.t * 0.05 + x * 0.09) * 2.5
      + Math.sin(this.t * 0.031 - x * 0.037) * 1.5);
    // Dither, not alpha. `rgba()` over a varied background invents a new blend
    // per underlying colour, which is how this screen first ended up with 231
    // of them; a 50% tile of ONE colour is what the hardware would have done
    // and costs exactly one entry. The sparser tile fades the band out at the
    // bottom so it ends without a seam.
    const near = this.ditherPattern(ctx, true);
    const far = this.ditherPattern(ctx, false);
    const fade = Math.max(top, bottom - 7);
    for (let x = 0; x < SCREEN_W; x++) {
      const cy = crest(x) + 1;
      ctx.fillStyle = near;
      ctx.fillRect(x, cy, 1, Math.max(0, fade - cy));
      ctx.fillStyle = far;
      ctx.fillRect(x, fade, 1, Math.max(0, bottom - fade));
    }
    // The crest itself: bright, one pixel, broken up so it glints.
    for (let x = 0; x < SCREEN_W; x++) {
      ctx.fillStyle = ((x >> 1) + (this.t >> 3)) % 7 === 0 ? '#eafaff' : '#8ccae8';
      ctx.fillRect(x, crest(x), 1, 1);
    }
  }

  drawFiles(ctx) {
    drawTextCentered(ctx, 'SELECT A FILE', SCREEN_W / 2, 6, '#f8f8e8', '#08142c');
    for (let i = 0; i < 3; i++) {
      const y = 20 + i * 30;
      const sel = this.cursor === i;
      drawBox(ctx, 8, y, SCREEN_W - 16, 26);
      const s = this.saves[i];
      if (s) {
        drawText(ctx, s.name, 14, y + 4, '#181c18');
        drawText(ctx, '\x06' + s.essences + '/' + essenceCount(), 60, y + 4, '#181c18');
        drawText(ctx, '\x03' + s.rupees, 100, y + 4, '#181c18');
        // heart row
        const total = Math.ceil(s.maxHearts / HEART_UNITS);
        for (let h = 0; h < Math.min(total, 12); h++) {
          const filled = Math.max(0, Math.min(HEART_UNITS, s.hearts - h * HEART_UNITS));
          sprites.draw(ctx, 'hud_heart' + filled, 13 + h * 8, y + 14);
        }
      } else {
        drawText(ctx, 'NEW GAME', 14, y + 9, '#606860');
      }
      if (sel) drawText(ctx, '\x02', 2, y + 9, '#f8f8e8');
    }
    const sel = this.cursor === 3;
    drawText(ctx, (sel ? '\x02 ' : '  ') + 'ERASE A FILE', 8, 116, '#f8f8e8', '#08142c');
  }

  drawErase(ctx) {
    drawTextCentered(ctx, 'ERASE WHICH FILE?', SCREEN_W / 2, 10, '#f8f8e8', '#08142c');
    for (let i = 0; i < 3; i++) {
      const y = 34 + i * 22;
      const s = this.saves[i];
      drawText(ctx, (this.eraseCursor === i ? '\x02 ' : '  ') + (s ? s.name + '  ' + s.essences + '/' + essenceCount() : '- empty -'),
        20, y, '#f8f8e8', '#08142c');
    }
    drawTextCentered(ctx, 'B to go back', SCREEN_W / 2, 118, '#78a8c8', '#08142c');
  }
}

// Shared border for all three title screens — logo, file select, erase — so
// they read as one design rather than a text screen bolted onto a menu.
// Gold outer edge with a darker bevel underneath it, echoing the wordmark's
// own outline and shading, inset from the screen edge by one pixel.
function drawTitleFrame(ctx) {
  ctx.fillStyle = '#e8c040';
  ctx.fillRect(1, 1, SCREEN_W - 2, 1);
  ctx.fillRect(1, 1, 1, SCREEN_H - 2);
  ctx.fillRect(SCREEN_W - 2, 1, 1, SCREEN_H - 2);
  ctx.fillRect(1, SCREEN_H - 2, SCREEN_W - 2, 1);
  ctx.fillStyle = '#50340c';
  ctx.fillRect(2, 2, SCREEN_W - 4, 1);
  ctx.fillRect(2, 2, 1, SCREEN_H - 4);
}
