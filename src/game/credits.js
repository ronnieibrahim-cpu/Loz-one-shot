// THE CREDITS (S213): Seasons' staff roll, with our places and our names.
//
// code/seasons/cutscenes/endgameCutscenes.s runs the roll as parts joined by
// fadeoutToWhite / fadeinFromWhite: a scene of the world, a card of names,
// and so on, and last the names rising over a sky that scrolls down to a
// forest (GFXH_CREDITS_SCROLL), then the THE END sunset (GFXH_CREDITS_THE_END,
// which Game's 'theend' mode draws). What is shown is src/data/credits.js; the
// sky, the lettering and the sunset are the cartridge's (tools/rip-ending.py),
// and the digits it never drew are src/data/sprites-credits-drawn.js.
//
// Nothing here consumes the game's randomness or touches the world: the
// scenes are drawn straight from the room data, with no player and none of
// the room's own entities, so the roll plays the same whatever the run left
// behind in the throne room. The people about each place (a scene's `cast`,
// S214) live on a STAGE of their own, one per screen: the screen's room, the
// game's sea, the cast as the only entities and a stream of their own drawn
// from the part's place in the roll, which is everything `NPC.update` and
// `moveEntity` ask a game for. They walk with the engine's own collision
// against the screen they stand on, and nothing they do reaches the run.

import { CREDITS_ROLL } from '../data/credits.js';
import { CREDITS_GLYPHS, CREDITS_INKS } from '../data/screens-ending.js';
import { CREDITS_DIGITS, CREDITS_DIGIT_TOP } from '../data/sprites-credits-drawn.js';
import {
  CREDITS_FADE, CREDITS_SCENE_FRAMES, CREDITS_PAN_SPEED, CREDITS_TEXT_SPEED,
  CREDITS_LINE_SPACING, CREDITS_SKY_STEP_FRAMES,
} from '../data/feel.js';
import { drawScreen, screenImage } from '../gfx/screens.js';
import { getRoom } from '../world/maps.js';
import { NPC, DRY_LAND } from './objects.js';
import { Stream, hash32 } from '../core/rng.js';
import { TILE } from '../core/screen.js';

const W = 160, H = 144, GLYPH_W = 8, GLYPH_H = 16;
const SKY_H = 256;

let digitCache = null;
/** The drawn digits, baked once per ink into a row like the font's. */
function digits() {
  if (digitCache) return digitCache;
  digitCache = {};
  for (const [ink, cols] of Object.entries(CREDITS_INKS)) {
    const c = document.createElement('canvas');
    c.width = GLYPH_W * 10; c.height = GLYPH_H;
    const g = c.getContext('2d');
    for (let d = 0; d < 10; d++) {
      CREDITS_DIGITS[d].forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
          const v = row[x];
          if (v === '.') continue;
          g.fillStyle = cols[Number(v) - 1];
          g.fillRect(d * GLYPH_W + x, CREDITS_DIGIT_TOP + y, 1, 1);
        }
      });
    }
    digitCache[ink] = c;
  }
  return digitCache;
}

/** One line in the credits lettering, centred, its top at `y`. */
export function drawCreditsLine(ctx, text, ink, y) {
  const font = screenImage(ink === 'c' ? 'creditsFontC' : 'creditsFontW').canvas;
  const dig = digits()[ink === 'c' ? 'C' : 'W'];
  let x = Math.round((W - text.length * GLYPH_W) / 2);
  y = Math.round(y);
  for (const ch of text) {
    const g = CREDITS_GLYPHS.indexOf(ch);
    if (g >= 0) ctx.drawImage(font, g * GLYPH_W, 0, GLYPH_W, GLYPH_H, x, y, GLYPH_W, GLYPH_H);
    else if (ch >= '0' && ch <= '9') ctx.drawImage(dig, Number(ch) * GLYPH_W, 0, GLYPH_W, GLYPH_H, x, y, GLYPH_W, GLYPH_H);
    x += GLYPH_W;
  }
}

/**
 * The stage one screen of a scene is played on: what `NPC.update`,
 * `moveEntity` and `canOccupy` read off a game, and only that. `part` and
 * `screen` seed its stream, so a scene walks the same way every time.
 */
export function creditsStage(game, part, screen, room) {
  const stage = {
    room, tide: game.tide, entities: [], frame: 0,
    rng: new Stream(hash32('credits', part, screen), `credits:${part}:${screen}`),
    dialogue: { active: false },
    addEntity(e) { this.entities.push(e); return e; },
  };
  const cast = CREDITS_ROLL[part].cast || [];
  for (const [at, tx, ty, who, opts] of cast) {
    if (at !== screen) continue;
    const walker = who.startsWith('walk:') ? who.slice(5) : null;
    const o = walker ? { ...opts, walk: walker } : { ...opts, sprite: who };
    const e = new NPC(tx * TILE, ty * TILE, o);
    e.type = 'npc';
    // Those who stand keep to dry ground too, as a wanderer does.
    e.avoidFlags = DRY_LAND;
    stage.addEntity(e);
  }
  return stage;
}

/** Frames one part of the roll runs between its fade in and its fade out. */
function partLength(part) {
  if (part.scene) return CREDITS_SCENE_FRAMES;
  // From the first line entering at the bottom to the last leaving the top.
  const travel = H + (part.names.length - 1) * CREDITS_LINE_SPACING + GLYPH_H;
  return Math.ceil(travel / CREDITS_TEXT_SPEED);
}

export class Credits {
  constructor(game) {
    this.game = game;
    this.part = 0;
    this.t = 0;              // frames into the part, the fade in included
    this.sky = 0;            // px the sky has scrolled down
    this.stages = null;      // the scene's two screens' people, [left, right]
    this.stagePart = -1;
  }

  /** The two stages of the current scene, built the first time it is asked. */
  sceneStages() {
    const part = CREDITS_ROLL[this.part];
    if (!part || !part.scene) return null;
    if (this.stagePart !== this.part) {
      const [floor, rx, ry] = part.scene;
      this.stages = [0, 1].map(dx =>
        creditsStage(this.game, this.part, dx, getRoom('overworld', floor, rx + dx, ry)));
      this.stagePart = this.part;
    }
    return this.stages;
  }

  get done() { return this.part >= CREDITS_ROLL.length; }

  /** One frame. True once the last part has faded out to white. */
  update() {
    if (this.done) return true;
    const part = CREDITS_ROLL[this.part];
    const [fin, hold, fout] = [CREDITS_FADE[2], CREDITS_FADE[1], CREDITS_FADE[0]];
    this.t++;
    const stages = this.sceneStages();
    if (stages) {
      for (const st of stages) {
        st.frame++;
        for (const e of st.entities) e.update(st);
      }
    }
    const run = this.t - fin;
    if (part.sky && run > 0 && run % CREDITS_SKY_STEP_FRAMES === 0) {
      this.sky = Math.min(SKY_H - H, this.sky + 1);
    }
    if (this.t >= fin + partLength(part) + fout + hold) {
      this.part++; this.t = 0;
    }
    return this.done;
  }

  /** How white the screen is this frame (0 clear, 1 white). */
  whiteness() {
    if (this.done) return 1;
    const part = CREDITS_ROLL[this.part];
    const [fout, , fin] = CREDITS_FADE;
    const len = partLength(part);
    if (this.t < fin) return 1 - this.t / fin;
    const after = this.t - fin - len;
    if (after < 0) return 0;
    if (after < fout) return after / fout;
    return 1;
  }

  draw(ctx) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    if (this.done) return;
    const part = CREDITS_ROLL[this.part];
    const run = Math.max(0, Math.min(partLength(part), this.t - CREDITS_FADE[2]));
    if (part.scene) this.drawScene(ctx, part.scene, run);
    else this.drawNames(ctx, part, run);
  }

  /**
   * Two screens side by side, panned from the first to the second; the
   * screen above shows over the strip a status bar would cover, or, at the
   * top of the map, the screen below shows under the bottom.
   */
  drawScene(ctx, [floor, rx, ry], run) {
    const tide = this.game.tide, frame = this.game.frame;
    const pan = Math.min(W, Math.floor(run * CREDITS_PAN_SPEED));
    const above = !!getRoom('overworld', floor, rx, ry - 1);
    const top = above ? 16 : 0;
    const stages = this.sceneStages();
    for (const dx of [0, 1]) {
      for (const dy of above ? [-1, 0] : [0, 1]) {
        const room = getRoom('overworld', floor, rx + dx, ry + dy);
        if (!room) continue;
        const ox = dx * W - pan, oy = top + dy * room.ph;
        ctx.drawImage(room.render(tide, frame), ox, oy);
        room.drawAnim(ctx, ox, oy, tide, frame);
        // The people stand between the ground and what overhangs it, as
        // Game.drawScene draws a room's entities.
        if (dy === 0 && stages) {
          const st = stages[dx];
          const list = st.entities.slice().sort((a, b) => (a.y + a.h) - (b.y + b.h));
          for (const e of list) e.draw(ctx, st, ox, oy);
        }
        room.drawOver(ctx, ox, oy, tide, frame);
      }
    }
  }

  /** The lines rising over the sky (scrolled only in the last roll). */
  drawNames(ctx, part, run) {
    drawScreen(ctx, 'creditsSky', 0, -this.sky);
    const y0 = H - run * CREDITS_TEXT_SPEED;
    part.names.forEach((line, i) => {
      if (!line.length) return;
      const y = y0 + i * CREDITS_LINE_SPACING;
      if (y > H || y < -GLYPH_H) return;
      drawCreditsLine(ctx, line[1], line[0], y);
    });
  }
}
