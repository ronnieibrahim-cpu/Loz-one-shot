// Cutscene runner. A cutscene is an array of steps executed in order.
//
// CUTSCENE STEP FORMAT (contract for story data files):
//
//   { say: 'text' }                          wait for the player to read it
//   { say: 'text', speaker: 'Farore' }       prefixes the name
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
//   { do(game, data) {} }                    arbitrary hook
//
// Steps that need to wait return control until their condition clears.

import { SCREEN_W, SCREEN_H, HUD_H } from '../core/screen.js';
import { drawTextCentered, wrapText } from '../gfx/font.js';
import { spawnEntity } from './entity.js';
import { giveItem, setFlag } from './progress.js';
import { DIR_VEC } from './entity.js';
import { moveEntity } from './entity.js';
import { sp } from '../core/fixed.js';
import { WALK_SPEED } from '../data/feel.js';

export const CUTSCENES = {};

export function registerCutscenes(defs) {
  for (const [k, v] of Object.entries(defs)) CUTSCENES[k] = v;
}

export function runCutscene(game, steps, data = {}) {
  let i = 0;
  let waiting = 0;
  let walking = null;
  let caption = null;
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
      if (step.give.item === 'satchel') { game.progress.maxSeeds = 20; game.progress.seeds.ember = 20; game.progress.seedSelected = 'ember'; }
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
    if (step.text) { caption = { text: step.text, t: step.frames || 120 }; }
    if (step.fade) {
      if (step.fade === 'out') game.fadeOut(null, !!step.white);
      else game.fadeIn();
    }
    if (step.say) {
      waitingDialogue = true;
      const body = step.speaker ? step.speaker + ': ' + step.say : step.say;
      game.say(body, { onClose: () => { waitingDialogue = false; } });
    }
    if (step.wait) waiting = step.wait;
    if (step.walk) walking = { ...step.walk, t: step.walk.frames || 30 };
  }

  function stepDone(step) {
    if (waitingDialogue) return false;
    if (waiting > 0) return false;
    if (walking) return false;
    if (caption && caption.t > 0) return false;
    if (step.fade && game.fadeDir) return false;
    if (step.tide != null && game.tide.busy) return false;
    return true;
  }

  let started = false;

  return {
    update() {
      if (!started) { started = true; if (steps.length) begin(steps[0]); }

      // Captions are skippable with A/B, and START fast-forwards the whole scene
      // by collapsing every wait. Side effects still run, so nothing is lost.
      const i2 = game.input;
      if (caption && caption.t > 0 && (i2.pressed('a') || i2.pressed('b'))) caption.t = 0;
      if (i2.pressed('start')) {
        waiting = 0;
        if (caption) caption.t = 0;
        if (walking) walking.t = 0;
        if (waitingDialogue) game.dialogue.close();
      }

      if (waiting > 0) waiting--;
      if (caption && caption.t > 0) caption.t--;
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
      if (caption && caption.t > 0) {
        const lines = wrapText(caption.text, SCREEN_W - 20);
        const h = lines.length * 10 + 8;
        const y = Math.round((SCREEN_H - h) / 2);
        ctx.fillStyle = 'rgba(8,12,16,0.78)';
        ctx.fillRect(0, y, SCREEN_W, h);
        lines.forEach((l, n) => drawTextCentered(ctx, l, SCREEN_W / 2, y + 4 + n * 10, '#f8f8e8'));
      }
    },
  };
}
