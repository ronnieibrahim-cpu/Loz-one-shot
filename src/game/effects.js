// Short-lived visual effects: puffs, splashes, sparks, explosions.
// Effects never collide; the only one that deals damage is the explosion, which
// does so through its own hit pass.

import { Entity, defineEntity } from './entity.js';
import { sprites } from '../gfx/art.js';

export class Effect extends Entity {
  constructor(x, y, spec, opts = {}) {
    super(x, y, opts);
    this.spec = spec;
    this.isEffect = true;
    this.harmless = true;
    this.shadow = false;
    this.grounded = false;
    this.pal = opts.pal || spec.pal || 'spark';
    this.rate = opts.rate || spec.rate || 4;
    this.frames = spec.frames;
    this.life = opts.life != null ? opts.life : (spec.life || this.frames.length * this.rate);
    this.depth = spec.depth != null ? spec.depth : 40;
    this.vx = opts.vx || 0; this.vy = opts.vy || 0;
    this.w = spec.w || 16; this.h = spec.h || 16;
    this.loop = !!spec.loop;
  }

  update(game) {
    this.frame++;
    this.x += this.vx; this.y += this.vy;
    if (this.spec.gravity) { this.vy += this.spec.gravity; }
    if (this.spec.update) this.spec.update(this, game);
    if (--this.life <= 0) this.remove = true;
  }

  spriteName() {
    const i = Math.floor(this.frame / this.rate);
    return this.frames[this.loop ? (i % this.frames.length) : Math.min(i, this.frames.length - 1)];
  }
}

export const EFFECTS = {
  puff: { frames: ['fx_puff0', 'fx_puff1', 'fx_puff2', 'fx_puff3'], pal: 'ui', rate: 4 },
  spark: { frames: ['fx_spark0', 'fx_spark1', 'fx_spark2'], pal: 'spark', rate: 3 },
  splash: { frames: ['fx_splash0', 'fx_splash1', 'fx_splash2'], pal: 'water', rate: 5 },
  ripple: { frames: ['fx_ripple0', 'fx_ripple1'], pal: 'water', rate: 8, loop: true, life: 9999, depth: -5 },
  dust: { frames: ['fx_dust0', 'fx_dust1', 'fx_dust2'], pal: 'sand', rate: 5 },
  cut: { frames: ['fx_cut0', 'fx_cut1', 'fx_cut2'], pal: 'tree', rate: 4 },
  sparkle: { frames: ['fx_sparkle0', 'fx_sparkle1', 'fx_sparkle2', 'fx_sparkle1'], pal: 'gold', rate: 5 },
  boom: { frames: ['fx_boom0', 'fx_boom1', 'fx_boom2', 'fx_boom3', 'fx_boom4'], pal: 'fire', rate: 4, w: 32, h: 32 },
  flame: { frames: ['fx_flame0', 'fx_flame1', 'fx_flame2'], pal: 'fire', rate: 6, loop: true, life: 9999 },
  bubble: { frames: ['fx_bubble0', 'fx_bubble1'], pal: 'water', rate: 8, loop: true },
  foam: { frames: ['fx_foam0', 'fx_foam1', 'fx_foam2'], pal: 'water', rate: 6 },
  shine: { frames: ['fx_shine0', 'fx_shine1', 'fx_shine2', 'fx_shine1'], pal: 'essence', rate: 6, loop: true, life: 9999 },
  slashD: { frames: ['fx_slash_d0', 'fx_slash_d1'], pal: 'spark', rate: 4, depth: 60 },
};

export function spawnEffectAt(game, name, x, y, opts) {
  const spec = EFFECTS[name];
  if (!spec) { console.warn('[fx] unknown effect', name); return null; }
  const e = new Effect(x, y, spec, opts || {});
  game.addEntity(e);
  return e;
}

// Explosions damage in a radius and break bombable walls; the visual is a boom
// effect, but the logic lives here so bombs stay simple.
export class Explosion extends Entity {
  constructor(x, y, opts = {}) {
    super(x, y, opts);
    this.w = 32; this.h = 32;
    this.hb = { x: 2, y: 2, w: 28, h: 28 };
    this.isEffect = true;
    this.harmless = true;
    this.shadow = false;
    this.life = 24;
    this.damage = 0;
    this.hitDone = false;
    this.depth = 50;
    this.power = opts.power || 4;
  }

  update(game) {
    this.frame++;
    if (!this.hitDone) {
      this.hitDone = true;
      game.audio.sfx('explode');
      game.shake(3, 10);
      for (const e of game.entities) {
        if (e === this || e.dead) continue;
        if (e.isEnemy && this.overlaps(e)) e.hurt(game, this.power, null, 2);
        if (e.bombable && this.overlaps(e) && e.onBombed) e.onBombed(game);
      }
      if (game.player && this.overlaps(game.player)) {
        game.player.takeDamage(game, 2, this, { noKnockDir: true });
      }
      game.breakTilesInRect(this.rect(), 'bomb');
    }
    if (--this.life <= 0) this.remove = true;
  }

  spriteName() {
    const i = Math.min(4, Math.floor(this.frame / 4));
    return 'fx_boom' + i;
  }

  draw(ctx, game, ox, oy) {
    sprites.draw(ctx, this.spriteName(), ox + this.x, oy + this.y, { pal: 'fire' });
  }
}

defineEntity('explosion', (x, y, o) => new Explosion(x, y, o));
