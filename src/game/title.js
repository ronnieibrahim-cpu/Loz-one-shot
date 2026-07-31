// Title screen and file select.

import { SCREEN_W, SCREEN_H } from '../core/screen.js';
import { drawText, drawTextCentered, textWidth } from '../gfx/font.js';
import { sprites, tiles as tileSheet } from '../gfx/art.js';
import { drawPanel, drawBox } from './dialogue.js';
import { listSaves, deleteSlot, HEART_UNITS } from './progress.js';

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

    // A moving sea behind the logo, drawn procedurally so the title needs no art.
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
  }

  drawLogo(ctx) {
    // Title block
    const bob = Math.round(Math.sin(this.t * 0.03) * 2);
    ctx.fillStyle = 'rgba(8,12,24,0.55)';
    ctx.fillRect(6, 20 + bob, SCREEN_W - 12, 54);
    drawTextCentered(ctx, 'THE LEGEND OF', SCREEN_W / 2, 26 + bob, '#f8f8e8', '#08142c');
    drawTextCentered(ctx, 'Z E L D A', SCREEN_W / 2, 38 + bob, '#e8c040', '#50340c');
    ctx.fillStyle = '#e8c040';
    ctx.fillRect(34, 50 + bob, SCREEN_W - 68, 1);
    drawTextCentered(ctx, 'Oracle of Tides', SCREEN_W / 2, 56 + bob, '#b0e8f8', '#08142c');

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
        drawText(ctx, '\x06' + s.essences + '/8', 60, y + 4, '#181c18');
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
      drawText(ctx, (this.eraseCursor === i ? '\x02 ' : '  ') + (s ? s.name + '  ' + s.essences + '/8' : '- empty -'),
        20, y, '#f8f8e8', '#08142c');
    }
    drawTextCentered(ctx, 'B to go back', SCREEN_W / 2, 118, '#78a8c8', '#08142c');
  }
}
