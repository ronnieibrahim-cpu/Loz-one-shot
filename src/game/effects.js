// Short-lived visual effects: puffs, splashes, sparks, explosions.
// Effects never collide; the only one that deals damage is the explosion, which
// does so through its own hit pass.

import { Entity, defineEntity } from './entity.js';
import { sp } from '../core/fixed.js';
import { sprites } from '../gfx/art.js';
import {
  EXPLOSION_FRAMES, EXPLOSION_HOLDS, EXPLOSION_RADII, EXPLOSION_SELF_DAMAGE, KNOCK_EXPLOSION,
  DRY_KINDLING_FACTOR,
  PUFF_HOLDS, KILL_PUFF_HOLDS, KILL_PUFF_FLICKER,
} from '../data/feel.js';

/** Which step of a held sequence frame `f` falls in (the last once past the end). */
export function heldStep(holds, f) {
  let t = 0;
  for (let i = 0; i < holds.length; i++) { t += holds[i]; if (f < t) return i; }
  return holds.length - 1;
}

export class Effect extends Entity {
  constructor(x, y, spec, opts = {}) {
    super(x, y, opts);
    this.spec = spec;
    this.isEffect = true;
    this.harmless = true;
    this.shadow = false;
    this.grounded = false;
    // A ripped effect (spec.own) carries its own colours per frame.
    this.pal = spec.own ? null : (opts.pal || spec.pal || 'spark');
    this.rate = opts.rate || spec.rate || 4;
    this.frames = spec.frames;
    this.holds = spec.holds || null;
    this.life = opts.life != null ? opts.life
      : (spec.life || (this.holds ? this.holds.reduce((a, b) => a + b, 0) : this.frames.length * this.rate));
    // Called once, on the frame the effect ends (the kill puff pays out here).
    this.onDone = opts.onDone || null;
    this.depth = spec.depth != null ? spec.depth : 40;
    // Drift is named in px/f by whoever spawns the effect; stored in sp/f.
    this.vx = sp(opts.vx || 0); this.vy = sp(opts.vy || 0);
    this.w = spec.w || 16; this.h = spec.h || 16;
    this.loop = !!spec.loop;
  }

  update(game) {
    this.frame++;
    this.fx += this.vx; this.fy += this.vy;
    if (this.spec.gravity) { this.vy += sp(this.spec.gravity); }
    if (this.spec.update) this.spec.update(this, game);
    if (--this.life <= 0) {
      this.remove = true;
      if (this.onDone) { const f = this.onDone; this.onDone = null; f(game); }
    }
  }

  spriteName() {
    if (this.holds) {
      // `frame` was already advanced once in the update that made this frame.
      const n = this.frames[heldStep(this.holds, Math.max(0, this.frame - 1))];
      return this.spec.flicker && Math.floor((this.frame - 1) / this.spec.flicker) % 2 ? n + 'b' : n;
    }
    const i = Math.floor(this.frame / this.rate);
    return this.frames[this.loop ? (i % this.frames.length) : Math.min(i, this.frames.length - 1)];
  }
}

export const EFFECTS = {
  // Seasons' own puffs (tools/rip-effects.py): 32x32 cells centred on the
  // 16x16 spot they are spawned at. `puff` is INTERAC_PUFF, what a thing
  // vanishes or appears in; `kill` is PART_ENEMY_DESTROYED, what an ordinary
  // enemy dies in, flickering between two palettes.
  puff: { frames: ['fx_puff0', 'fx_puff1', 'fx_puff2'], holds: PUFF_HOLDS, own: true, w: 32, h: 32, centre: true },
  kill: {
    frames: ['fx_kill0', 'fx_kill1', 'fx_kill0', 'fx_kill2', 'fx_kill2', 'fx_kill3', 'fx_kill4'],
    holds: KILL_PUFF_HOLDS, flicker: KILL_PUFF_FLICKER, own: true, w: 32, h: 32, centre: true,
  },
  spark: { frames: ['fx_spark0', 'fx_spark1', 'fx_spark2'], pal: 'spark', rate: 3 },
  splash: { frames: ['fx_splash0', 'fx_splash1', 'fx_splash2'], pal: 'water', rate: 5 },
  ripple: { frames: ['fx_ripple0', 'fx_ripple1'], pal: 'water', rate: 8, loop: true, life: 9999, depth: -5 },
  dust: { frames: ['fx_dust0', 'fx_dust1', 'fx_dust2'], pal: 'sand', rate: 5 },
  cut: { frames: ['fx_cut0', 'fx_cut1', 'fx_cut2'], pal: 'tree', rate: 4 },
  sparkle: { frames: ['fx_sparkle0', 'fx_sparkle1', 'fx_sparkle2', 'fx_sparkle1'], pal: 'gold', rate: 5 },
  boom: { frames: ['fx_boom0', 'fx_boom1', 'fx_boom0', 'fx_boom2', 'fx_boom3', 'fx_boom4'], holds: EXPLOSION_HOLDS, own: true, w: 32, h: 32 },
  flame: { frames: ['fx_flame0', 'fx_flame1', 'fx_flame2'], pal: 'fire', rate: 6, loop: true, life: 9999 },
  bubble: { frames: ['fx_bubble0', 'fx_bubble1'], pal: 'water', rate: 8, loop: true },
  foam: { frames: ['fx_foam0', 'fx_foam1', 'fx_foam2'], pal: 'water', rate: 6 },
  shine: { frames: ['fx_shine0', 'fx_shine1', 'fx_shine2', 'fx_shine1'], pal: 'essence', rate: 6, loop: true, life: 9999 },
};

export function spawnEffectAt(game, name, x, y, opts) {
  const spec = EFFECTS[name];
  if (!spec) { console.warn('[fx] unknown effect', name); return null; }
  // A 32x32 ripped cell is spawned at the 16x16 spot callers name.
  const c = spec.centre ? 8 : 0;
  const e = new Effect(x - c, y - c, spec, opts || {});
  game.addEntity(e);
  return e;
}

// Explosions damage in a radius and break bombable walls; the visual is a boom
// effect, but the logic lives here so bombs stay simple.
//
// Seasons' blast (itemUpdateExplosion) is not one instant hit: it is live for
// the first five of its six frames, its reach growing from 6 px to 15 px
// (EXPLOSION_RADII), and anything that wanders into it while it is live is
// caught — each thing once, the way the cartridge's invincibility after a hit
// and Link's own `var37` latch make it once.
export class Explosion extends Entity {
  constructor(x, y, opts = {}) {
    super(x, y, opts);
    this.w = 32; this.h = 32;
    this.hb = { x: 16, y: 16, w: 0, h: 0 };
    this.isEffect = true;
    this.harmless = true;
    this.shadow = false;
    this.life = EXPLOSION_FRAMES;
    this.damage = 0;
    this.started = false;
    this.struck = new Set();
    this.depth = 50;
    this.power = opts.power || 4;
    // Dry Kindling: a wider blast, applied to the reach rather than to the
    // sprite, so a charm never changes what an explosion LOOKS like.
    this.scale = 1;
  }

  /** Dry Kindling: read once, on the first frame, because `game` is not in the ctor. */
  applyCharms(game) { if (game.charm('dryKindling')) this.scale = DRY_KINDLING_FACTOR; }

  /** The live box for this frame, or null once the blast has stopped hitting. */
  reach() {
    const r = Math.round(EXPLOSION_RADII[heldStep(EXPLOSION_HOLDS, this.frame - 1)] * this.scale);
    if (!r) return null;
    return { x: 16 - r, y: 16 - r, w: 2 * r, h: 2 * r };
  }

  update(game) {
    this.frame++;
    if (!this.started) {
      this.started = true;
      this.applyCharms(game);
      game.audio.sfx('explode');
      // Walls and bombable things are opened by the blast going off, over the
      // ground it has always covered, not by its growth.
      this.hb = { x: 2, y: 2, w: 28, h: 28 };
      game.breakTilesInRect(this.rect(), 'bomb');
      for (const e of game.entities) {
        if (e !== this && !e.dead && e.bombable && this.overlaps(e) && e.onBombed) e.onBombed(game);
      }
    }
    const box = this.reach();
    if (box) {
      this.hb = box;
      for (const e of game.entities) {
        if (e === this || e.dead || this.struck.has(e)) continue;
        if (e.isEnemy && this.overlaps(e)) { this.struck.add(e); e.hurt(game, this.power, null, KNOCK_EXPLOSION, this); }
      }
      const p = game.player;
      if (p && !this.struck.has(p) && this.overlaps(p)) {
        this.struck.add(p);
        p.takeDamage(game, EXPLOSION_SELF_DAMAGE, this, { noKnockDir: true });
      }
    }
    if (--this.life <= 0) this.remove = true;
  }

  spriteName() {
    return EFFECTS.boom.frames[heldStep(EXPLOSION_HOLDS, Math.max(0, this.frame - 1))];
  }

  draw(ctx, game, ox, oy) {
    sprites.draw(ctx, this.spriteName(), ox + this.x, oy + this.y);
  }
}

defineEntity('explosion', (x, y, o) => new Explosion(x, y, o));
