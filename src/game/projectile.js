// Projectiles: enemy shots, player shots (seeds, arrows), and thrown objects.

import { Entity, moveEntity, canOccupy, defineEntity, DIR_VEC, enemyHurtRect } from './entity.js';
import { TILE, VIEW_W, VIEW_H } from '../core/screen.js';
import { sp, toPx } from '../core/fixed.js';
import { F } from '../world/tileset.js';
import {
  PROJECTILE_LIFE, PROJECTILE_SPEED, PROJECTILE_Z, KNOCK_PROJECTILE,
  ENEMY_SHOT_RADIUS, SWORD_BEAM_SPEED, SWORD_BEAM_START, SWORD_BEAM_RADIUS,
  SWORD_BEAM_FLIP_FRAMES, SHOT_DEFLECT_FRAMES, SHOT_DEFLECT_SPEED,
  SHOT_DEFLECT_LAUNCH, SHOT_DEFLECT_GRAVITY,
} from '../data/feel.js';

export class Projectile extends Entity {
  constructor(x, y, o = {}) {
    super(x, y, o);
    this.w = o.w || 8; this.h = o.h || 8;
    this.hb = o.hb || { x: 1, y: 1, w: this.w - 2, h: this.h - 2 };
    // Callers name a shot's velocity in px/f, the way every enemy spec and
    // every `shootRing` does. It lands here as an integer subpixel step, which
    // is the only thing the position accumulator will take.
    this.vx = sp(o.vx || 0); this.vy = sp(o.vy || 0);
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
    this.hitFx = o.hitFx !== undefined ? o.hitFx : 'spark';
    this.z = o.z || PROJECTILE_Z;
    // How big the shot is to LINK: a box this far either way of the middle
    // of the sprite as drawn, against his own 12x12 — the cartridge's rule.
    this.radius = o.radius || ENEMY_SHOT_RADIUS;
    // Seasons' octorok rock (parts/octorokProjectile.s, S227): a wall, the
    // shield or the sword knocks it back the way it came with a hop, and it
    // is harmless until it is gone (`deflect`). It hits Link and is simply
    // gone; it never makes the clink picture.
    this.deflects = !!o.deflects;
    this.deflected = 0;      // frames left of the hop back, once knocked
    this.vz = 0;             // sp/f up, during the hop
  }

  /**
   * Knock the shot back (partCommon_bounceWhenCollisionsEnabled): turn it
   * round at SPEED_40, launch it up, and let it fall for 32 frames before it
   * is gone. Collisions are off from now on. `sound` is SND_CLINK2, which the
   * shield and the sword make (collisionEffect1f, LINKDMG_20); a wall makes
   * none.
   */
  deflect(game, sound) {
    if (this.deflected > 0) return;
    const len = Math.hypot(this.vx, this.vy) || 1;
    this.vx = -Math.round(this.vx / len * SHOT_DEFLECT_SPEED);
    this.vy = -Math.round(this.vy / len * SHOT_DEFLECT_SPEED);
    this.vz = SHOT_DEFLECT_LAUNCH;
    this.deflected = SHOT_DEFLECT_FRAMES;
    if (sound) game.audio.sfx('deflect');
  }

  /** The shot's collision box: `radius` either way of its middle as drawn. */
  contactRect() {
    const r = this.radius;
    return { x: this.cx - r, y: this.cy - this.z - r, w: r * 2, h: r * 2 };
  }

  /** True if this enemy shot is touching Link's collision area. */
  touchesPlayer(pl) {
    const a = this.contactRect(), b = pl.contactRect();
    return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  }

  update(game) {
    this.frame++;
    if (this.deflected > 0) {
      // partCommon_updateSpeedAndDeleteWhenCounter1Is0: through anything,
      // never below the ground, gone when the count runs out.
      if (--this.deflected <= 0) { this.remove = true; return; }
      this.fx += this.vx; this.fy += this.vy;
      this.fz = Math.max(0, this.fz + this.vz);
      this.vz -= SHOT_DEFLECT_GRAVITY;
      return;
    }
    if (--this.life <= 0) { this.expire(game); return; }

    const nfx = this.fx + this.vx, nfy = this.fy + this.vy;
    const nx = toPx(nfx), ny = toPx(nfy);
    // Walls stop shots; water does not (unless overWater is false).
    const blocked = !this.canPass(game, nx, ny);
    if (blocked) {
      if (this.deflects) {
        // The edge of the screen is not a wall: the rock is simply gone
        // there (partCommon_checkTileCollisionOrOutOfBounds' boundary case).
        const rw = game.room ? game.room.pw : 160, rh = game.room ? game.room.ph : 128;
        if (nx + this.hb.x < 0 || ny + this.hb.y < 0
            || nx + this.hb.x + this.hb.w > rw || ny + this.hb.y + this.hb.h > rh) {
          this.remove = true; return;
        }
        this.deflect(game, false); return;
      }
      if (this.bounces > 0) {
        this.bounces--;
        if (!this.canPass(game, nx, this.y)) this.vx = -this.vx;
        if (!this.canPass(game, this.x, ny)) this.vy = -this.vy;
        game.audio.sfx('ricochet');
      } else {
        this.expire(game);
        return;
      }
    } else {
      this.fx = nfx; this.fy = nfy;
    }

    const rw = game.room ? game.room.pw : 160, rh = game.room ? game.room.ph : 128;
    if (this.x < -12 || this.y < -12 || this.x > rw + 12 || this.y > rh + 12) {
      this.remove = true;
      return;
    }

    if (this.fromPlayer) {
      for (const e of game.entities) {
        if (!e.isEnemy || e.dead || e === this.owner) continue;
        if (!this.overlaps(e)) continue;
        const dir = Math.abs(this.vx) > Math.abs(this.vy)
          ? (this.vx < 0 ? 'left' : 'right') : (this.vy < 0 ? 'up' : 'down');
        if (e.hurt(game, this.damage, dir, KNOCK_PROJECTILE, this) && !this.pierce) { this.expire(game); return; }
      }
    } else if (this.damage > 0 && game.player && !game.player.invincible) {
      if (this.touchesPlayer(game.player)) {
        game.player.takeDamage(game, this.damage, this);
        if (this.deflected > 0) return;      // the shield knocked it back
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
      const f = room.flagsAt(tx, ty, game.tide);
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

/**
 * Convenience: fire a projectile from an entity toward a direction or point.
 * `speed`, `vx` and `vy` are px/f here — this is the data-facing edge, and the
 * Projectile constructor converts them to the engine's subpixel step.
 */
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

/**
 * THE NOBLE SWORD'S BEAM (S225; oracles-disasm object_code/common/items/
 * swordBeam.s, ITEM_SWORD_BEAM). Made by Player.updateSwing on the swing's
 * full-reach frame when the sword is level 2 or more and Link's hearts are
 * full. It flies straight at SWORD_BEAM_SPEED in its own picture, swapping
 * two palettes every SWORD_BEAM_FLIP_FRAMES, and is gone with a clink on the
 * first enemy it touches (hurt or not) or the first wall; off the screen it
 * is simply gone. It hits for what the first sword hits for: ITEM_SWORD_BEAM's
 * damage is ITEM_SWORD's own $fe, which the cartridge raises for a better
 * blade and not for the beam.
 */
export class SwordBeam extends Projectile {
  constructor(game, player, damage) {
    const [dy, dx] = SWORD_BEAM_START[player.dir];
    const [vx, vy] = DIR_VEC[player.dir];
    super(player.cx + dx - 4, player.cy + dy - 4, { fromPlayer: true, owner: player, damage, z: 0, hitFx: 'spark', life: Infinity });
    this.vx = vx * SWORD_BEAM_SPEED; this.vy = vy * SWORD_BEAM_SPEED;
    this.dir = player.dir;
    this.radius = SWORD_BEAM_RADIUS;
    this.hb = { x: 4 - SWORD_BEAM_RADIUS, y: 4 - SWORD_BEAM_RADIUS, w: SWORD_BEAM_RADIUS * 2, h: SWORD_BEAM_RADIUS * 2 };
    this.isSwordBeam = true;
    game.audio.sfx('swordBeam');
  }

  update(game) {
    this.frame++;
    const nfx = this.fx + this.vx, nfy = this.fy + this.vy;
    if (!this.canPass(game, toPx(nfx), toPx(nfy))) { this.expire(game); return; }
    this.fx = nfx; this.fy = nfy;
    // Off the screen it is deleted (objectCheckWithinScreenBoundary): the
    // camera's view, not the room, in a room bigger than the screen.
    const cam = game.camera || { x: 0, y: 0 };
    if (this.cx < cam.x || this.cy < cam.y || this.cx >= cam.x + VIEW_W || this.cy >= cam.y + VIEW_H) { this.remove = true; return; }
    const box = this.contactRect();
    // A sign, a chest, a block, a torch is a solid TILE in Seasons, and the
    // beam clinks off it as off a wall; ours are entities, so asked here.
    for (const e of game.entities) {
      if (!e.solid || e.isEnemy || e.dead || e === this.owner) continue;
      const r = e.rect();
      if (box.x < r.x + r.w && r.x < box.x + box.w && box.y < r.y + r.h && r.y < box.y + box.h) { this.expire(game); return; }
    }
    for (const e of game.entities) {
      if (!e.isEnemy || e.dead) continue;
      const r = enemyHurtRect(e);
      if (r && box.x < r.x + r.w && r.x < box.x + box.w && box.y < r.y + r.h && r.y < box.y + box.h) {
        e.hurt(game, this.damage, this.dir, KNOCK_PROJECTILE, this);
        this.expire(game);
        return;
      }
    }
  }

  draw(ctx, game, ox, oy) {
    const k = { up: 0, right: 1, down: 2, left: 3 }[this.dir];
    const alt = Math.floor(game.frame / SWORD_BEAM_FLIP_FRAMES) & 1 ? 'b' : '';
    game.sprites.draw(ctx, `fx_beam${k}${alt}`, ox + this.cx - 16, oy + this.cy - 16);
  }
}
