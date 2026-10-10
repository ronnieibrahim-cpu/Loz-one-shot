// Title screen and file select.

import { SCREEN_W, SCREEN_H, paletteFade } from '../core/screen.js';
import { drawText, drawTextCentered } from '../gfx/font.js';
import { sprites } from '../gfx/art.js';
import { drawScreen, screenImage } from '../gfx/screens.js';
import { listSaves, deleteSlot, HEART_UNITS, storageAvailable, exportCode, importCode, saveSlot } from './progress.js';
import { essenceCount } from '../world/maps.js';
import {
  TITLE_CARD_FRAMES, TITLE_FADE_FRAMES, TITLE_WHITE_FRAMES, TITLE_PRESS_BLINK, TITLE_IDLE_FRAMES,
  TITLE_MUSIC_FADE_MASK, TITLE_LOGO_FADE_FRAMES, TITLE_FILES_WHITE_FRAMES, TITLE_CARD_FADE_IN_FRAMES,
} from '../data/feel.js';
// The screens are the Seasons originals (tools/rip-screens.py): the logo with
// TIDES in its plaque, and the bark frame of its file select. What is drawn in
// code here is only words, the conch, and the file's own details.
// Imported for its side effect of registering title_conch.
import { TITLE_LAYOUT } from '../data/sprites-title.js';
import { Opening } from './intro.js';

export class Title {
  constructor(game) {
    this.game = game;
    this.reset();
  }

  reset() {
    this.stage = 'logo';     // 'logo' | 'intro' | 'files' | 'confirmErase'
    this.t = 0;
    // THE OPENING (S168) plays once a power-on, between the card's fade to
    // white and the logo, as Seasons plays its ride. Not again after a game
    // ends and comes back here: Seasons replays its intro only from idle.
    this.opening = this.opening === undefined ? new Opening(this.game) : null;
    // THE CARD WAITS FOR THE SOUND (S169). A browser starts audio only from
    // a press, so a power-on that ran straight on played its opening silent
    // and the first press both woke the sound and skipped it. While the sound
    // is not up the card holds, asking for a press, and the press that wakes
    // the sound (`soundStarted`, from main.js) does nothing else. A press the
    // sound did not answer — a gamepad, a harness, a browser with no audio —
    // starts the card running and does nothing else (S178).
    this.waitSound = !(this.game.audio && this.game.audio.ok);
    this.swallow = false;
    this.waitT = 0;
    this.cardIn = 0;         // frames of the card's fade in from white
    this.toFilesT = -1;      // >= 0: START pressed, the logo going to white
    this.cursor = 0;
    this.saves = listSaves();
    this.storageOk = storageAvailable();
  }

  /** The sound has just been woken by a press: that press is spent. */
  soundStarted() {
    if (!this.waitSound) return;
    this.waitSound = false;
    this.swallow = true;
  }

  update() {
    const g = this.game, i = g.input;
    if (this.swallow) { this.swallow = false; return; }
    const waiting = this.waitSound && this.stage === 'logo' && this.t === 0;
    if (this.stage === 'logo' && this.t < TITLE_CARD_FRAMES && this.cardIn < TITLE_CARD_FADE_IN_FRAMES) this.cardIn++;
    if (waiting) this.waitT++;
    else this.t++;
    // A press the sound did not answer (no audio, a gamepad, a harness)
    // starts the card running all the same, and is spent on that: at
    // power-on the card would ignore it anyway (S178).
    if (waiting && (i.pressed('start') || i.pressed('a'))) { this.waitSound = false; return; }

    // START ON THE LOGO (S170): Seasons' intro_titlescreen_state1 plays the
    // select sound, fades the music out fast and the screen to white, and only
    // then starts the file select, which cuts in. Nothing is read meanwhile.
    if (this.toFilesT >= 0) {
      if (++this.toFilesT >= TITLE_LOGO_FADE_FRAMES + TITLE_FILES_WHITE_FRAMES) {
        this.toFilesT = -1;
        this.stage = 'files';
        this.saves = listSaves();
        g.audio.play('fileSelect');      // Seasons has a song of its own here
      }
      return;
    }

    const fadeEnd = TITLE_CARD_FRAMES + TITLE_FADE_FRAMES;
    // The card has run its course: from here on START on it is read (below).
    if (this.stage === 'logo' && this.t >= fadeEnd) g.introInputs = true;
    if (this.stage === 'logo' && this.opening && this.t === fadeEnd) this.stage = 'intro';
    if (this.stage === 'intro') {
      // START, or the end of it, cuts to the white beat before the logo —
      // Seasons' START in its intro goes to the title, not past it. Only
      // START: runIntro reads BTN_START alone, so A does nothing here (S179).
      if (this.opening.update() || i.pressed('start')) {
        this.opening = null;
        this.stage = 'logo';
        this.t = fadeEnd;
      }
      return;
    }

    // LEFT ALONE, THE LOGO PLAYS IT ALL AGAIN (S169), as Seasons does: the
    // music stops, the screen fades to white, and the card and the opening
    // come round again. Nothing is read while it fades.
    const idleAt = fadeEnd + TITLE_WHITE_FRAMES + TITLE_IDLE_FRAMES;
    if (this.stage === 'logo' && this.t >= idleAt) {
      if (this.t === idleAt) g.audio.fadeOut(TITLE_MUSIC_FADE_MASK);
      if (this.t >= idleAt + TITLE_LOGO_FADE_FRAMES) {
        this.opening = new Opening(g);
        this.t = 0;
        this.cardIn = 0;
        g.audio.play('title', { restart: true });
      }
      return;
    }

    // THE CARD TAKES NO PRESS AT POWER-ON (S178). Seasons' runIntro reads
    // START only once hIntroInputsEnabled is set, and nothing sets it until
    // the card has faded out (intro_capcomScreen @state2 enableIntroInputs).
    // From then on — the card coming round again from idle, or after a game
    // — START on the card goes straight to the logo (intro_gotoTitlescreen).
    // START alone, on the card and on the logo alike: runIntro and
    // intro_titlescreen_state1 both read BTN_START and nothing else (S179).
    if (this.stage === 'logo') {
      if (i.pressed('start')) {
        if (this.t >= fadeEnd + TITLE_WHITE_FRAMES) {
          // On the logo itself, Seasons' fade to the file select.
          g.audio.sfx('confirm');
          this.toFilesT = 0;
          g.audio.fadeOut(TITLE_MUSIC_FADE_MASK);
        } else if (this.t < fadeEnd && g.introInputs) {
          this.opening = null;
          this.t = fadeEnd;
        }
      }
      return;
    }

    if (this.stage === 'files') {
      const n = 4;   // 3 slots + erase
      if (i.pressed('up')) { this.cursor = (this.cursor + n - 1) % n; g.audio.sfx('cursor'); }
      if (i.pressed('down')) { this.cursor = (this.cursor + 1) % n; g.audio.sfx('cursor'); }
      if (i.pressed('b')) { this.stage = 'logo'; g.audio.sfx('cursor'); g.audio.play('title'); return; }
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
    else if (this.stage === 'intro') this.opening.draw(ctx);
    else if (this.stage === 'files') this.drawFiles(ctx);
    else this.drawErase(ctx);
  }

  /**
   * THE OPENING, as Seasons plays it (assets/footage, video frames 6744-6848):
   * a pale card with the credits in blue, a fade to white, a beat of white,
   * and the logo cut in over the sky. A press on the logo fades to the file
   * select; on the card, nothing at power-on and the logo after (S178).
   */
  drawOpening(ctx) {
    const t = this.t;
    const fadeEnd = TITLE_CARD_FRAMES + TITLE_FADE_FRAMES;
    const logoAt = fadeEnd + TITLE_WHITE_FRAMES;
    if (t < fadeEnd) {
      this.drawCard(ctx);
      if (t >= TITLE_CARD_FRAMES) this.whiteout(ctx, (t - TITLE_CARD_FRAMES) / TITLE_FADE_FRAMES);
      else if (this.cardIn < TITLE_CARD_FADE_IN_FRAMES) this.whiteout(ctx, 1 - this.cardIn / TITLE_CARD_FADE_IN_FRAMES);
      return;
    }
    if (t < logoAt) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, SCREEN_W, SCREEN_H); return; }
    this.drawLogo(ctx);
    const idleAt = logoAt + TITLE_IDLE_FRAMES;
    if (this.toFilesT >= 0) this.whiteout(ctx, this.toFilesT / TITLE_LOGO_FADE_FRAMES);
    else if (t >= idleAt) this.whiteout(ctx, (t - idleAt) / TITLE_LOGO_FADE_FRAMES);
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
    if (this.waitSound && this.t === 0 && Math.floor(this.waitT / TITLE_PRESS_BLINK) % 2 === 0) {
      drawTextCentered(ctx, 'PRESS ANY BUTTON', SCREEN_W / 2, 124, CARD.ink, CARD.shade);
    }
  }

  /** A fade to white as Seasons' palette thread does it (paletteFade). */
  whiteout(ctx, k) { paletteFade(ctx, k, true); }

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
    // The panel shows the file under the cursor as Seasons' does
    // (fileSelectDrawHeartsAndDeathCounter): Link, the death count in the
    // status bar's bold digits, three of them, at row 9 columns 14-16, and
    // the hearts from row 10 column 10, seven a row (eight from 15 hearts
    // up, drawHeartDisplay).
    const s = this.cursor < 3 ? this.saves[this.cursor] : null;
    if (s) {
      sprites.draw(ctx, 'link_walk_down_0', 82, 62, { pal: 'link' });
      const deaths = String(Math.min(999, s.deaths | 0)).padStart(3, '0');
      for (let k = 0; k < 3; k++) sprites.draw(ctx, 'hud_d' + deaths[k], 112 + k * 8, 72);
      const total = Math.ceil(s.maxHearts / HEART_UNITS);
      const per = total >= 15 ? 8 : 7;
      for (let h = 0; h < Math.min(total, 16); h++) {
        const filled = Math.max(0, Math.min(HEART_UNITS, s.hearts - h * HEART_UNITS));
        sprites.draw(ctx, 'hud_heart' + filled, 80 + (h % per) * 8, 80 + Math.floor(h / per) * 8);
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
