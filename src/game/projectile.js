// Projectiles: enemy shots, player shots (seeds, arrows), and thrown objects.

import { Entity, moveEntity, canOccupy, defineEntity, DIR_VEC } from './entity.js';
import { VIEW_W, VIEW_H, TILE } from '../core/screen.js';
import { F } from '../world/tileset.js';
import { PROJECTILE_LIFE, PROJECTILE_SPEED, PROJECTILE_Z } from '../data/feel.js';

export class Projectile extends Entity {
  constructor(x, y, o = {}) {
    super(x, y, o);
    this.w = o.w || 8; this.h = o.h || 8;
    this.hb = o.hb || { x: 1, y: 1, w: this.w - 2, h: this.h - 2 };
    this.vx = o.vx || 0; this.vy = o.vy || 0;
    this.sprite = o.sprite || 'shot';
    this.pal = o.pal || 'enemyr';
    this.damage = o.damage != null ? o.damage : 1;
    this.life = o.life != null ? o.life : PROJECTILE_LIFE;
    this.fromPlayer = !!o.fromPlayer;
    this.pierce = !!o.pierce;
    this.bounces = o.bounces || 0;
    this.spin = o.spin || 0;
    this.overWater = o.overWater !== false;   // most shots fly over water
    this.isProjectile = true;
    this.shadow = false;
    this.grounded = false;
    this.flying = true;
    this.owner = o.owner || null;
    this.onImpact = o.onImpact || null;
    this.hitFx = o.hitFx || 'spark';
    this.z = o.z || PROJECTILE_Z;
  }

  update(game) {
    this.frame++;
    if (--this.life <= 0) { this.expire(game); return; }

    const nx = this.x + this.vx, ny = this.y + this.vy;
    // Walls stop shots; water does not (unless overWater is false).
    const blocked = !this.canPass(game, nx, ny);
    if (blocked) {
      if (this.bounces > 0) {
        this.bounces--;
        if (!this.canPass(game, this.x + this.vx, this.y)) this.vx = -this.vx;
        if (!this.canPass(game, this.x, this.y + this.vy)) this.vy = -this.vy;
        game.audio.sfx('ricochet');
      } else {
        this.expire(game);
        return;
      }
    } else {
      this.x = nx; this.y = ny;
    }

    if (this.x < -12 || this.y < -12 || this.x > VIEW_W + 12 || this.y > VIEW_H + 12) {
      this.remove = true;
      return;
    }

    if (this.fromPlayer) {
      for (const e of game.entities) {
        if (!e.isEnemy || e.dead || e === this.owner) continue;
        if (!this.overlaps(e)) continue;
        const dir = Math.abs(this.vx) > Math.abs(this.vy)
          ? (this.vx < 0 ? 'left' : 'right') : (this.vy < 0 ? 'up' : 'down');
        if (e.hurt(game, this.damage, dir, 3) && !this.pierce) { this.expire(game); return; }
      }
    } else if (this.damage > 0 && game.player && !game.player.invincible) {
      if (this.overlaps(game.player)) {
        game.player.takeDamage(game, this.damage, this);
        if (!this.pierce) { this.expire(game); return; }
      }
    }
  }

  canPass(game, x, y) {
    const room = game.room;
    if (!room) return false;
    const r = { x: x + this.hb.x, y: y + this.hb.y, w: this.hb.w, h: this.hb.h };
    const pts = [
      [r.x, r.y], [r.x + r.w - 1, r.y], [r.x, r.y + r.h - 1], [r.x + r.w - 1, r.y + r.h - 1],
    ];
    for (const [px, py] of pts) {
      const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
      const f = room.flagsAt(tx, ty, game.tide.level);
      if (f & (F.SOLID | F.VOID)) return false;
      if (!this.overWater && (f & F.DEEP)) return false;
    }
    return true;
  }

  expire(game) {
    this.remove = true;
    if (this.onImpact) this.onImpact(game, this);
    if (this.hitFx) game.spawnEffect(this.hitFx, this.cx - 8, this.cy - 8);
  }

  draw(ctx, game, ox, oy) {
    const sprite = this.spin
      ? this.sprite + '_' + (Math.floor(this.frame / this.spin) % 4)
      : this.sprite;
    const s = game.sprites;
    s.draw(ctx, sprite, ox + this.x, oy + this.y - this.z, { pal: this.pal });
  }
}

/** Convenience: fire a projectile from an entity toward a direction or point. */
export function fire(game, from, o = {}) {
  const speed = o.speed || PROJECTILE_SPEED;
  let vx = o.vx, vy = o.vy;
  if (vx == null && vy == null) {
    if (o.at) {
      const dx = (o.at.cx - from.cx), dy = (o.at.cy - from.cy);
      const d = Math.hypot(dx, dy) || 1;
      vx = dx / d * speed; vy = dy / d * speed;
    } else {
      const [dx, dy] = DIR_VEC[o.dir || from.dir] || [0, 1];
      vx = dx * speed; vy = dy * speed;
    }
  }
  const w = o.w || 8, h = o.h || 8;
  const p = new Projectile(from.cx - w / 2, from.cy - h / 2, { ...o, vx, vy, owner: from, w, h });
  game.addEntity(p);
  return p;
}

defineEntity('shot', (x, y, o) => new Projectile(x, y, o));
