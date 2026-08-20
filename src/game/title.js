// Title screen and file select.

import { SCREEN_W, SCREEN_H } from '../core/screen.js';
import { drawText, drawTextCentered, textWidth } from '../gfx/font.js';
import { sprites, tiles as tileSheet } from '../gfx/art.js';
import { drawPanel, drawBox } from './dialogue.js';
import { listSaves, deleteSlot, HEART_UNITS } from './progress.js';
import { essenceCount } from '../world/maps.js';

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
    ctx.fillStyle = '#08142c';
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

    // A moving sea behind the logo, drawn procedurally: it animates, costs
    // nothing, and needs no art of its own.
    for (let y = 0; y < SCREEN_H; y += 2) {
      const depth = y / SCREEN_H;
      const shade = ['#08142c', '#0c2044', '#183c80', '#2c60b0', '#58a8e0'][
        Math.min(4, Math.floor(depth * 5))];
      ctx.fillStyle = shade;
      ctx.fillRect(0, y, SCREEN_W, 2);
    }
    for (let i = 0; i < 26; i++) {
      const y = 64 + (i * 3) % 80;
      const w = 6 + (i % 4) * 4;
      const x = ((i * 37) + Math.sin((this.t + i * 12) * 0.03) * 22 + this.t * 0.25) % (SCREEN_W + 20) - 10;
      ctx.fillStyle = i % 3 === 0 ? '#b0e8f8' : '#78c8e8';
      ctx.fillRect(Math.round(x), y, w, 1);
    }

    if (this.stage === 'logo') this.drawLogo(ctx);
    else if (this.stage === 'files') this.drawFiles(ctx);
    else this.drawErase(ctx);

    drawTitleFrame(ctx);
  }

  drawLogo(ctx) {
    const bob = Math.round(Math.sin(this.t * 0.03) * 2);
    const wSize = sprites.size('title_wordmark');
    const tSize = sprites.size('title_tagline');
    const wx = Math.round((SCREEN_W - wSize.w) / 2);
    const wy = 30 + bob;
    const tx = Math.round((SCREEN_W - tSize.w) / 2);
    const ty = wy - tSize.h - 4;

    ctx.fillStyle = 'rgba(8,12,24,0.5)';
    ctx.fillRect(4, ty - 4, SCREEN_W - 8, wSize.h + tSize.h + 20);

    sprites.draw(ctx, 'title_tagline', tx, ty);
    sprites.draw(ctx, 'title_wordmark', wx, wy);

    // The tide rises over the bottom of the wordmark: a lightly scalloped
    // crest line that bobs with the same clock as the sea behind it, and a
    // translucent wash below it standing in for the water covering the
    // letters. Ties the logo to the one thing this game is about.
    const tideY = wy + Math.round(wSize.h * 0.62) + Math.round(Math.sin(this.t * 0.05) * 1.5);
    ctx.save();
    ctx.beginPath();
    ctx.rect(wx, wy, wSize.w, wSize.h);
    ctx.clip();
    ctx.fillStyle = 'rgba(24,72,144,0.4)';
    ctx.fillRect(wx, tideY, wSize.w, wy + wSize.h - tideY);
    for (let x = 0; x < wSize.w; x += 4) {
      const cy = tideY + Math.round(Math.sin((this.t * 0.08) + x * 0.5) * 1);
      ctx.fillStyle = '#b0e8f8';
      ctx.fillRect(wx + x, cy, 2, 1);
    }
    ctx.restore();

    if ((this.t >> 4) % 2 === 0) {
      drawTextCentered(ctx, 'PRESS START', SCREEN_W / 2, 104, '#f8f8e8', '#08142c');
    }
    drawTextCentered(ctx, 'A fan homage', SCREEN_W / 2, 128, '#78a8c8', '#08142c');
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
