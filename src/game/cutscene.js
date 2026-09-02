// Cutscene runner. A cutscene is an array of steps executed in order.
//
// CUTSCENE STEP FORMAT (contract for story data files):
//
//   { say: 'text' }                          wait for the player to read it
//
// THERE IS NO `speaker` FIELD. There was one — it prefixed the name onto the
// line — and no scene ever used it, because the writing puts the name in the
// line itself ("Farore: You are awake."). Two ways to say one thing, one of
// them never exercised, is how a feature rots: it would have kept working
// right up until the day somebody used it and found the colon doubled.
//   { wait: 60 }                             pause n frames
//   { fade: 'out' } / { fade: 'in' }         screen fade (waits for it)
//   { white: true, fade: 'out' }             fade to white instead
//   { music: 'trackName' } / { music: null } change or stop music
//   { jingle: 'fanfare' }
//   { sfx: 'conch' }
//   { tide: 2 }                              set the tide (with its wave sweep)
//   { shake: [amp, frames] }
//   { warp: { map, floor, rx, ry, px, py } } move Link
//   { face: 'up' }                           turn Link
//   { walk: { dir: 'up', frames: 40 } }       Link walks himself
//   { spawn: ['npc', 4, 3, { ... }] }
//   { despawn: 'entityTypeName' }
//   { flag: 'sawIntro' }                     set a progress flag
//   { give: { item: 'sword', level: 1 } }
//   { text: 'Big centred caption', frames: 120 }
//   { show: 'p_essence0' }                   hold a sprite up on screen
//   { show: { art: ['p_essence0','p_essence1'], frames: 150, scale: 3,
//             rise: true, dim: false, pal: 'tide' } }
//
// `show` is the one drawing step, and it is the only one this file has ever
// had beyond a caption box. It holds a sprite (or a two-frame cycle) over the
// scene for `frames`, optionally drifting upward as it goes. A step may carry
// BOTH `show` and `text` — the six Essence scenes all want the orb and its
// title card at the same time — and the step ends when the longer of the two
// is done.
//
// THERE IS DELIBERATELY NO CAMERA-PAN STEP. It was the obvious second thing to
// add and it would have been dead code: every room a cutscene plays in is
// exactly one screen (all six boss rooms are 160x128), and `Camera.update`
// pins x and y to 0 when the room is not bigger than the view. The nine rooms
// in the game a camera CAN move in are all mid-dungeon and none of them runs a
// cutscene. Do not add one without first checking that number has changed.
//   { do(game, data) {} }                    arbitrary hook
//
// Steps that need to wait return control until their condition clears.

import { SCREEN_W, SCREEN_H, HUD_H } from '../core/screen.js';
import { drawTextCentered, wrapText } from '../gfx/font.js';
import { sprites } from '../gfx/art.js';
import {
  CUTSCENE_SHOW_FRAMES, CUTSCENE_SHOW_ANIM_FRAMES, CUTSCENE_SHOW_RISE_PX,
  CUTSCENE_READ_CPS, CUTSCENE_READ_LEAD_FRAMES,
} from '../data/feel.js';
import { spawnEntity } from './entity.js';
import { giveItem, setFlag } from './progress.js';
import { DIR_VEC } from './entity.js';
import { moveEntity } from './entity.js';
import { sp } from '../core/fixed.js';
import { WALK_SPEED } from '../data/feel.js';

/**
 * The floor under a caption's hold: how long its own text takes to read.
 *
 * A scene says how long it wants to dwell and this says how long it MUST. The
 * two are combined with `max`, so a card can be held as long as an author
 * likes and can never be held for less time than it takes to read — which
 * every card in the game was, before this: the intro's opening paragraph is 97
 * characters and it was on screen for 3.7 seconds.
 *
 * This does not make pacing assertable (§4.2) and does not try to. It removes
 * the one part of pacing that IS decidable, so that a person watching is
 * spending their attention on the part that is not.
 */
export function readFrames(text) {
  return CUTSCENE_READ_LEAD_FRAMES + Math.ceil((String(text).length / CUTSCENE_READ_CPS) * 60);
}

export const CUTSCENES = {};

export function registerCutscenes(defs) {
  for (const [k, v] of Object.entries(defs)) CUTSCENES[k] = v;
}

export function runCutscene(game, steps, data = {}) {
  let i = 0;
  let waiting = 0;
  let walking = null;
  let caption = null;
  let shown = null;
  let waitingDialogue = false;

  function begin(step) {
    if (step.music !== undefined) { if (step.music) game.audio.play(step.music); else game.audio.stop(); }
    if (step.jingle) game.audio.jingle(step.jingle);
    if (step.sfx) game.audio.sfx(step.sfx);
    if (step.flag) setFlag(game.progress, step.flag);
    if (step.shake) game.shake(step.shake[0], step.shake[1]);
    if (step.face && game.player) game.player.dir = step.face;
    if (step.give) {
      giveItem(game.progress, step.give.item, step.give.level || 1);
      game.autoEquip(step.give.item);
      if (step.give.item === 'bombs') { game.progress.maxBombs = 10; game.progress.bombs = 10; }
    }
    if (step.spawn) spawnEntity(game, step.spawn[0], step.spawn[1], step.spawn[2], step.spawn[3] || {});
    if (step.despawn) {
      for (const e of game.entities) if (e.type === step.despawn) e.remove = true;
    }
    if (step.warp) {
      const w = step.warp;
      game.enterMap(w.map || game.mapId, w.floor || 0, w.rx, w.ry, w.px, w.py, w.dir, { instant: true });
    }
    if (step.tide != null) game.tide.setLevel(step.tide);
    if (step.do) step.do(game, data);
    if (step.text) {
      caption = { text: step.text, t: Math.max(step.frames || 120, readFrames(step.text)) };
    }
    if (step.show) {
      const o = typeof step.show === 'string' ? { art: step.show } : step.show;
      const art = Array.isArray(o.art) ? o.art : [o.art];
      // A step that holds a picture AND a card holds both for the same time.
      // Extending only the caption left the Essence orb blinking out from
      // under its own title card two seconds before the card went.
      const total = Math.max(o.frames || step.frames || CUTSCENE_SHOW_FRAMES,
        step.text ? readFrames(step.text) : 0);
      shown = {
        art, pal: o.pal || null, scale: Math.max(1, o.scale || 1),
        x: o.x, y: o.y, rise: o.rise !== false, dim: o.dim !== false,
        total, t: total,
      };
    }
    if (step.fade) {
      if (step.fade === 'out') game.fadeOut(null, !!step.white);
      else game.fadeIn();
    }
    if (step.say) {
      waitingDialogue = true;
      game.say(step.say, { onClose: () => { waitingDialogue = false; } });
    }
    if (step.wait) waiting = step.wait;
    if (step.walk) walking = { ...step.walk, t: step.walk.frames || 30 };
  }

  function stepDone(step) {
    if (waitingDialogue) return false;
    if (waiting > 0) return false;
    if (walking) return false;
    if (caption && caption.t > 0) return false;
    if (shown && shown.t > 0) return false;
    if (step.fade && game.fadeDir) return false;
    if (step.tide != null && game.tide.busy) return false;
    return true;
  }

  let started = false;

  return {
    /** What the scene is currently holding up, or null. A seam for
     *  `tools/shoot-cutscene.mjs`: a shot of a `show` step has to be taken on
     *  a frame where the sprite is actually up, and pressing A to advance
     *  there would skip the very thing being photographed. Same reason
     *  `Audio.init` takes a context override. Nothing in the game reads it. */
    shownArt() { return shown && shown.t > 0 ? shown.art[0] : null; },

    /** The caption the scene is holding up, or null. The same seam as
     *  `shownArt`, and it exists for the same reason one scale up:
     *  `tools/watch-cutscenes.mjs` walks a scene beat by beat asking what a
     *  person would be looking at, and a `text` step is invisible from outside
     *  this closure — so the intro's title card and the ending's last three
     *  read as SIX AND NINE SECONDS OF DEAD AIR until this was here. Nothing
     *  in the game reads it. */
    captionText() { return caption && caption.t > 0 ? caption.text : null; },

    update() {
      if (!started) { started = true; if (steps.length) begin(steps[0]); }

      // Captions are skippable with A/B, and START fast-forwards the whole scene
      // by collapsing every wait. Side effects still run, so nothing is lost.
      const i2 = game.input;
      if (caption && caption.t > 0 && (i2.pressed('a') || i2.pressed('b'))) caption.t = 0;
      if (shown && shown.t > 0 && (i2.pressed('a') || i2.pressed('b'))) shown.t = 0;
      if (i2.pressed('start')) {
        waiting = 0;
        if (shown) shown.t = 0;
        if (caption) caption.t = 0;
        if (walking) walking.t = 0;
        if (waitingDialogue) game.dialogue.close();
      }

      if (waiting > 0) waiting--;
      if (caption && caption.t > 0) caption.t--;
      if (shown && shown.t > 0) shown.t--;
      if (walking) {
        const p = game.player;
        if (p) {
          const [dx, dy] = DIR_VEC[walking.dir] || [0, 0];
          p.dir = walking.dir;
          p.animT++;
          // A scene may name its own pace in px/f; the default is Link's own.
          const step = walking.speed != null ? sp(walking.speed) : WALK_SPEED;
          moveEntity(game, p, dx * step, dy * step);
        }
        if (--walking.t <= 0) walking = null;
      }
      const step = steps[i];
      if (!step) return true;
      if (!stepDone(step)) return false;
      i++;
      if (i >= steps.length) return true;
      begin(steps[i]);
      return false;
    },

    draw(ctx) {
      // PICTURE ON TOP, CARD BENEATH IT — and the layout is computed, not
      // hand-tuned per scene. A centred caption box sits across the middle of
      // the screen, so the first cut of this drew the Essence orb straight
      // behind it and two thirds of the sprite were never visible. Nothing
      // asserted otherwise; it took a screenshot to see (`T53`).
      //
      // So when a scene holds a sprite AND a caption at once, the caption
      // drops to the bottom and the sprite centres in whatever room is left
      // between the HUD and the top of the card. A scene may still pass an
      // explicit x/y, but none of them needs to.
      const capLines = (caption && caption.t > 0) ? wrapText(caption.text, SCREEN_W - 20) : null;
      const capH = capLines ? capLines.length * 10 + 8 : 0;
      const showing = shown && shown.t > 0;
      const capY = capLines
        ? Math.round(showing ? SCREEN_H - capH - 16 : (SCREEN_H - capH) / 2)
        : 0;

      if (showing) {
        // Dim the world behind a held picture, unless the scene says not to.
        // The caption box has always drawn its own scrim for exactly this
        // reason; a sprite held over open terrain without one competes with
        // every tuft of grass behind it and loses. Same alpha as the card, so
        // the two read as one presentation rather than two overlays.
        if (shown.dim) {
          ctx.fillStyle = 'rgba(8,12,16,0.62)';
          ctx.fillRect(0, HUD_H, SCREEN_W, SCREEN_H - HUD_H);
        }
        const elapsed = shown.total - shown.t;
        const name = shown.art[Math.floor(elapsed / CUTSCENE_SHOW_ANIM_FRAMES) % shown.art.length];
        const c = sprites.bake(name, shown.pal);
        if (c) {
          const w = c.width * shown.scale, h = c.height * shown.scale;
          const drift = shown.rise
            ? Math.round(CUTSCENE_SHOW_RISE_PX * (elapsed / Math.max(1, shown.total)))
            : 0;
          // The band the picture gets: below the HUD, above the card.
          const top = HUD_H, bottom = capLines ? capY : SCREEN_H;
          const x = Math.round(shown.x != null ? shown.x : (SCREEN_W - w) / 2);
          const y = Math.round((shown.y != null ? shown.y : top + (bottom - top - h) / 2) - drift);
          // Integer-scaled blit with smoothing off. `T23` is about PATHS being
          // anti-aliased; a nearest-neighbour drawImage at an integer scale
          // stays hard-edged, and the scale is forced to an integer above.
          const prev = ctx.imageSmoothingEnabled;
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(c, x, y, w, h);
          ctx.imageSmoothingEnabled = prev;
        }
      }
      if (capLines) {
        ctx.fillStyle = 'rgba(8,12,16,0.78)';
        ctx.fillRect(0, capY, SCREEN_W, capH);
        capLines.forEach((l, n) => drawTextCentered(ctx, l, SCREEN_W / 2, capY + 4 + n * 10, '#f8f8e8'));
      }
    },
  };
}
