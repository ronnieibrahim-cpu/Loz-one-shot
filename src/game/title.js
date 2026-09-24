// Title screen and file select.

import { SCREEN_W, SCREEN_H } from '../core/screen.js';
import { drawText, drawTextCentered } from '../gfx/font.js';
import { sprites } from '../gfx/art.js';
import { drawScreen, screenImage } from '../gfx/screens.js';
import { listSaves, deleteSlot, HEART_UNITS, storageAvailable, exportCode, importCode, saveSlot } from './progress.js';
import { essenceCount } from '../world/maps.js';
import {
  TITLE_CARD_FRAMES, TITLE_FADE_FRAMES, TITLE_WHITE_FRAMES, TITLE_PRESS_BLINK,
} from '../data/feel.js';
// The screens are the Seasons originals (tools/rip-screens.py): the logo with
// TIDES in its plaque, and the bark frame of its file select. What is drawn in
// code here is only words, the conch, and the file's own details.
// Imported for its side effect of registering title_conch.
import { TITLE_LAYOUT } from '../data/sprites-title.js';

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
    this.storageOk = storageAvailable();
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
      // SELECT on a file slot copies or pastes a save code — the escape hatch
      // for storage Safari can evict on its own schedule (see progress.js).
      // A slot with a save exports it; an empty slot offers to import into it.
      if (i.pressed('select') && this.cursor < 3) {
        const s = this.saves[this.cursor];
        if (s) {
          window.prompt('Save code — copy it somewhere safe:', exportCode(s.raw));
        } else {
          const code = window.prompt('Paste a save code to load it into this slot:', '');
          if (code) {
            const imported = importCode(code);
            if (imported) {
              saveSlot(this.cursor, imported);
              this.saves = listSaves();
              g.audio.sfx('confirm');
            } else {
              window.alert('That save code could not be read.');
            }
          }
        }
        return;
      }
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
    if (this.stage === 'logo') this.drawOpening(ctx);
    else if (this.stage === 'files') this.drawFiles(ctx);
    else this.drawErase(ctx);
  }

  /**
   * THE OPENING, as Seasons plays it (assets/footage, video frames 6744-6848):
   * a pale card with the credits in blue, a fade to white, a beat of white,
   * and the logo cut in over the sky. Any press on the card or the logo goes
   * to the file select — the same one press it always took, so the
   * playthrough's run from the title is not a frame longer.
   */
  drawOpening(ctx) {
    const t = this.t;
    const fadeEnd = TITLE_CARD_FRAMES + TITLE_FADE_FRAMES;
    const logoAt = fadeEnd + TITLE_WHITE_FRAMES;
    if (t < fadeEnd) {
      this.drawCard(ctx);
      if (t >= TITLE_CARD_FRAMES) this.whiteout(ctx, (t - TITLE_CARD_FRAMES) / TITLE_FADE_FRAMES);
      return;
    }
    if (t < logoAt) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, SCREEN_W, SCREEN_H); return; }
    this.drawLogo(ctx);
  }

  /** The card: the Seasons developer card's own pale ground and blue type. */
  drawCard(ctx) {
    ctx.fillStyle = CARD.ground;
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    const lines = [
      ['THE LEGEND OF ZELDA', 8, 12], ['Oracle of Tides', 40, 24],
      ['A FAN GAME', 8, 48], ['not made or sold by', 24, 60], ['Nintendo or Capcom', 24, 72],
      ['ART FROM THE', 8, 92], ['ORACLE CARTRIDGES', 24, 104],
    ];
    for (const [text, x, y] of lines) drawText(ctx, text, x, y, CARD.ink, CARD.shade);
  }

  /** A fade to white in the console's four steps, not a smooth alpha. */
  whiteout(ctx, k) {
    const step = Math.min(4, Math.floor(k * 5));
    if (step <= 0) return;
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = step / 4;
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    ctx.globalAlpha = 1;
  }

  drawLogo(ctx) {
    drawScreen(ctx, 'titleLogo');
    // The Moon Conch where the Seasons card hangs the Rod of Seasons' orb, in
    // its vines: this game's marquee item in the series' marquee spot.
    sprites.draw(ctx, 'title_conch', 112, 60);
    const blink = Math.floor((this.t - TITLE_CARD_FRAMES - TITLE_FADE_FRAMES - TITLE_WHITE_FRAMES)
      / TITLE_PRESS_BLINK) % 2 === 0;
    if (blink) drawScreen(ctx, 'titlePress', 0, screenImage('titlePress').y);
    drawTextCentered(ctx, 'a fan game', SCREEN_W / 2, 129, '#fffbef', '#5a4100');
  }

  /** The bark frame the Seasons file select and save prompt share. */
  drawBanner(ctx, text) {
    drawTextCentered(ctx, text, SCREEN_W / 2, 10, '#000000');
  }

  drawFiles(ctx) {
    drawScreen(ctx, 'fileSelect');
    this.drawBanner(ctx, 'SELECT A FILE');
    for (let i = 0; i < 3; i++) {
      const s = this.saves[i];
      drawText(ctx, s ? s.name : '- - -', 25, 56 + i * 24, '#f8f8f8');
      if (this.cursor === i) drawScreen(ctx, 'seedCursor', 7, 53 + i * 24);
    }
    // The panel shows the file under the cursor, as Seasons' does.
    const s = this.cursor < 3 ? this.saves[this.cursor] : null;
    if (s) {
      sprites.draw(ctx, 'link_walk_down_0', 82, 62, { pal: 'link' });
      drawText(ctx, '\x06' + s.essences + '/' + essenceCount(), 104, 62, '#000000');
      drawText(ctx, '\x03' + s.rupees, 104, 72, '#000000');
      const total = Math.ceil(s.maxHearts / HEART_UNITS);
      for (let h = 0; h < Math.min(total, 16); h++) {
        const filled = Math.max(0, Math.min(HEART_UNITS, s.hearts - h * HEART_UNITS));
        sprites.draw(ctx, 'hud_heart' + filled, 80 + (h % 8) * 8, 84 + Math.floor(h / 8) * 8);
      }
    } else if (this.cursor < 3) {
      drawTextCentered(ctx, 'NEW GAME', 113, 76, '#000000');
    }
    // The lower panel, where Seasons asks for the message speed.
    if (this.cursor === 3) drawScreen(ctx, 'seedCursor', 10, 118);
    drawText(ctx, 'ERASE A FILE', 24, 121, '#000000');
    if (!this.storageOk) drawText(ctx, 'NO STORAGE: WON\'T SAVE', 16, 133, '#e81038');
    else if (this.cursor < 3) drawText(ctx, 'SELECT: save code', 24, 133, '#e81038');
  }

  drawErase(ctx) {
    drawScreen(ctx, 'fileSelect');
    this.drawBanner(ctx, 'ERASE WHICH FILE?');
    for (let i = 0; i < 3; i++) {
      const s = this.saves[i];
      drawText(ctx, s ? s.name : '- - -', 25, 56 + i * 24, '#f8f8f8');
      if (this.eraseCursor === i) drawScreen(ctx, 'seedCursor', 7, 53 + i * 24);
    }
    const s = this.saves[this.eraseCursor];
    drawTextCentered(ctx, s ? s.essences + '/' + essenceCount() + ' ESSENCES' : 'EMPTY', 113, 76, '#000000');
    drawText(ctx, 'A: erase   B: back', 24, 127, '#000000');
  }
}

// The Seasons developer card's colours, off the footage (video frame 6760):
// the ground, the ink, and the shade the letters sit on.
const CARD = { ground: '#f0f8f8', ink: '#507090', shade: '#d8e0f0' };
