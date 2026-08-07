// Items: the registry of everything Link can own, plus the entities they spawn.
//
// An item definition is:
//   {
//     names: ['Wooden Sword', 'Noble Sword', 'Master Sword'],   // one per level
//     icon:  ['i_sword1', 'i_sword2', 'i_sword3'],              // HUD/menu icons
//     pal: 'ui',
//     equippable: true,        // can be assigned to the A or B button
//     passive: false,          // passive items are never equipped (map, chartstone)
//     desc: 'A short description shown on pickup.',
//     use(game, player, level) -> boolean   // true if the press was consumed
//   }

import { Entity, defineEntity, moveEntity, canOccupy, DIR_VEC, groundFlags } from './entity.js';
import { Projectile, fire } from './projectile.js';
import { Explosion } from './effects.js';
import { F } from '../world/tileset.js';
import { TILE, VIEW_W, VIEW_H } from '../core/screen.js';
import { hasItem, itemLevel, addBombs, addReefseeds } from './progress.js';
import { TIDE_COUNT } from './tide.js';
import { FP_ONE, sp, toPx } from '../core/fixed.js';
import {
  PEGASUS_FRAMES, JUMP_POWER, JUMP_POWER_CAPE, KNOCK_TOOL, KNOCK_THROWN,
  THROW_ARC_RISE, THROW_ARC_GRAVITY, THROW_SLIDE_DECAY, THROW_SLIDE_STOP,
  REEFSEED_GROW_FRAMES, REEFSEED_SETTLE_FRAMES, REEFSEED_THROW_SPEED,
  REEFSEED_SHUDDER_EVERY,
  SHAKE_SMALL, SHAKE_SMALL_FRAMES,
} from '../data/feel.js';
import { sprites } from '../gfx/art.js';

// --------------------------------------------------------------------------
// Bomb
// --------------------------------------------------------------------------

export class Bomb extends Entity {
  constructor(x, y, o = {}) {
    super(x, y, o);
    this.w = 16; this.h = 16;
    this.hb = { x: 4, y: 6, w: 8, h: 8 };
    this.fuse = o.fuse || 100;
    this.pal = 'bomb';
    this.harmless = true;
    this.liftable = true;
    this.power = o.power || 4;
    this.depth = -1;
  }

  update(game) {
    this.frame++;
    if (this.thrownVx || this.thrownVy) {
      // Subpixels per frame, so the decay rounds back onto the grid.
      moveEntity(game, this, this.thrownVx, this.thrownVy);
      this.thrownVx = Math.round(this.thrownVx * THROW_SLIDE_DECAY);
      this.thrownVy = Math.round(this.thrownVy * THROW_SLIDE_DECAY);
      if (Math.abs(this.thrownVx) < THROW_SLIDE_STOP) this.thrownVx = 0;
      if (Math.abs(this.thrownVy) < THROW_SLIDE_STOP) this.thrownVy = 0;
    }
    if (--this.fuse <= 0) {
      this.remove = true;
      game.addEntity(new Explosion(this.cx - 16, this.cy - 16, { power: this.power }));
    }
  }

  spriteName() {
    // Flash faster as the fuse burns down.
    const rate = this.fuse < 24 ? 3 : (this.fuse < 50 ? 6 : 10);
    return (Math.floor(this.frame / rate) % 2) ? 'i_bomb_lit' : 'i_bomb';
  }
}
defineEntity('bomb', (x, y, o) => new Bomb(x, y, o));

// --------------------------------------------------------------------------
// Boomerang
// --------------------------------------------------------------------------

export class Boomerang extends Entity {
  constructor(x, y, o = {}) {
    super(x, y, o);
    this.w = 10; this.h = 10;
    this.hb = { x: 1, y: 1, w: 8, h: 8 };
    this.pal = o.level >= 2 ? 'magic' : 'wood';
    this.level = o.level || 1;
    this.speed = this.level >= 2 ? 2.6 : 2.1;
    this.range = this.level >= 2 ? 108 : 64;
    this.damage = this.level >= 2 ? 2 : 1;
    this.owner = o.owner;
    const [dx, dy] = DIR_VEC[o.dir || 'down'];
    // `speed` is px/f (item data); velocities are sp/f (the mover's unit).
    this.vx = sp(dx * this.speed); this.vy = sp(dy * this.speed);
    this.travelled = 0;
    this.returning = false;
    this.harmless = true;
    this.shadow = false;
    this.flying = true;
    this.z = 6;
    this.depth = 30;
    this.carried = [];
  }

  update(game) {
    this.frame++;
    const p = this.owner || game.player;

    if (!this.returning) {
      // The magic boomerang can be steered while it flies out.
      if (this.level >= 2 && game.input.anyDir()) {
        const i = game.input;
        let tx = 0, ty = 0;
        if (i.down('left')) tx -= 1; if (i.down('right')) tx += 1;
        if (i.down('up')) ty -= 1; if (i.down('down')) ty += 1;
        const d = Math.hypot(tx, ty);
        if (d) {
          this.vx += Math.round((sp(tx / d * this.speed) - this.vx) * 0.12);
          this.vy += Math.round((sp(ty / d * this.speed) - this.vy) * 0.12);
        }
      }
      const before = { fx: this.fx, fy: this.fy };
      const r = moveEntity(game, this, this.vx, this.vy);
      // Measured in subpixels and converted back, so a slow steer still counts.
      this.travelled += Math.hypot(this.fx - before.fx, this.fy - before.fy) / FP_ONE;
      if (r.hitX || r.hitY) {
        // A region vane is SOLID, so the boomerang bounces off it before its
        // own rect ever overlaps the tile — probing the rect finds nothing and
        // the gate reads as ordinary rock. Probe the tile it just struck, the
        // way the hookshot probes ahead for something to latch onto.
        this.strikeTile(game);
        this.returning = true; game.audio.sfx('ricochet');
      }
      if (this.travelled >= this.range) this.returning = true;
      if (this.x < -8 || this.y < -8 || this.x > VIEW_W || this.y > VIEW_H) this.returning = true;
    } else {
      if (!p) { this.remove = true; return; }
      const dx = p.cx - this.cx, dy = p.cy - this.cy;
      const d = Math.hypot(dx, dy) || 1;
      const back = sp(this.speed + 0.6);
      this.fx += Math.round(dx / d * back);
      this.fy += Math.round(dy / d * back);
      for (const c of this.carried) { c.x = this.x; c.y = this.y; }
      if (d < 9) {
        this.remove = true;
        game.audio.sfx('catch');
        for (const c of this.carried) { c.remove = false; c.x = p.cx - 8; c.y = p.cy - 8; c.attached = null; }
        if (p.onBoomerangReturn) p.onBoomerangReturn(game, this);
      }
    }

    // Stun enemies, and sweep up loose drops to bring home.
    for (const e of game.entities) {
      if (e.dead || e === this) continue;
      if (e.isEnemy && this.overlaps(e)) {
        const dir = Math.abs(this.vx) > Math.abs(this.vy)
          ? (this.vx < 0 ? 'left' : 'right') : (this.vy < 0 ? 'up' : 'down');
        if (e.hurt(game, this.damage, dir, KNOCK_TOOL)) e.stun = Math.max(e.stun, 45);
        this.returning = true;
      }
      if (e.isDrop && !e.attached && this.overlaps(e)) {
        e.attached = this;
        this.carried.push(e);
      }
    }
    game.checkTileAction(this.rect(), 'cut');
  }

  /**
   * Apply the 'boomerang' action to the tile just past the leading edge. The
   * level is what the gate reads: a salt vane asks for 2, so the plain
   * boomerang rattles off it and only the Magic one turns it.
   */
  strikeTile(game) {
    const d = Math.hypot(this.vx, this.vy);
    if (!d) return false;
    const tx = Math.floor((this.cx + (this.vx / d) * TILE * 0.6) / TILE);
    const ty = Math.floor((this.cy + (this.vy / d) * TILE * 0.6) / TILE);
    return game.applyTileAction(tx, ty, 'boomerang', this.level);
  }

  spriteName() { return 'i_boomerang_' + (Math.floor(this.frame / 3) % 4); }
}

// --------------------------------------------------------------------------
// Hookshot
// --------------------------------------------------------------------------

export class Hookshot extends Entity {
  constructor(x, y, o = {}) {
    super(x, y, o);
    this.w = 10; this.h = 10;
    this.hb = { x: 2, y: 2, w: 6, h: 6 };
    this.pal = 'stone';
    this.level = o.level || 1;
    this.maxLen = this.level >= 2 ? 104 : 64;
    this.speed = 4;
    this.owner = o.owner;
    this.dir = o.dir || 'down';
    this.originX = this.x; this.originY = this.y;
    this.state = 'out';
    this.harmless = true;
    this.shadow = false;
    this.flying = true;
    this.z = 6;
    this.depth = 30;
    this.hooked = null;
  }

  get length() { return Math.hypot(this.x - this.originX, this.y - this.originY); }

  update(game) {
    const p = this.owner || game.player;
    const [dx, dy] = DIR_VEC[this.dir];

    if (this.state === 'out') {
      const step = sp(this.speed);
      const nfx = this.fx + dx * step, nfy = this.fy + dy * step;
      const nx = toPx(nfx), ny = toPx(nfy);
      // Latch onto hookable tiles.
      const tx = Math.floor((nx + 5) / TILE), ty = Math.floor((ny + 5) / TILE);
      const f = game.room.flagsAt(tx, ty, game.tide.level);
      if (f & F.HOOKABLE) {
        this.state = 'pull';
        this.anchorX = tx * TILE; this.anchorY = ty * TILE;
        game.audio.sfx('hookHit');
        return;
      }
      if (f & (F.SOLID | F.VOID)) { this.state = 'back'; game.audio.sfx('ricochet'); return; }
      this.fx = nfx; this.fy = nfy;
      if (this.length >= this.maxLen) this.state = 'back';

      for (const e of game.entities) {
        if (e.dead || !this.overlaps(e)) continue;
        if (e.isEnemy) {
          e.hurt(game, this.level >= 2 ? 2 : 1, this.dir, KNOCK_TOOL);
          e.stun = Math.max(e.stun, 40);
          this.state = 'back';
          break;
        }
        if (e.isDrop || e.hookable) {
          this.hooked = e;
          this.state = 'back';
          break;
        }
      }
    } else if (this.state === 'pull') {
      // Drag the player along the chain.
      if (!p) { this.remove = true; return; }
      p.hookPulling = true;
      const tdx = (this.x - (p.cx - 5)), tdy = (this.y - (p.cy - 5));
      const d = Math.hypot(tdx, tdy);
      if (d < 6) { this.finish(game, p); return; }
      const pull = sp(3);
      const before = { fx: p.fx, fy: p.fy };
      moveEntity(game, p, Math.round(tdx / d * pull), Math.round(tdy / d * pull),
        { jumping: true, swim: true });
      // Snagged on something: the chain stopped making ground, so let go.
      if (p.fx === before.fx && p.fy === before.fy) { this.finish(game, p); return; }
    } else {
      if (!p) { this.remove = true; return; }
      const tdx = (p.cx - 5) - this.x, tdy = (p.cy - 5) - this.y;
      const d = Math.hypot(tdx, tdy) || 1;
      if (d < 6) { this.finish(game, p); return; }
      const back = sp(this.speed + 1);
      this.fx += Math.round(tdx / d * back);
      this.fy += Math.round(tdy / d * back);
      if (this.hooked) { this.hooked.x = this.x - 3; this.hooked.y = this.y - 3; }
    }
  }

  finish(game, p) {
    this.remove = true;
    if (p) { p.hookPulling = false; p.hookshot = null; }
    if (this.hooked) { this.hooked.attached = null; }
  }

  draw(ctx, game, ox, oy) {
    // chain links from origin to head
    const p = this.owner || game.player;
    const sx = p ? p.cx - 4 : this.originX, sy = p ? p.cy - 4 - 2 : this.originY;
    const dx = this.x - sx, dy = this.y - sy;
    const n = Math.max(1, Math.floor(Math.hypot(dx, dy) / 5));
    for (let i = 0; i < n; i++) {
      // The chain links sit at fractions of the span, which is the one place in
      // the game a draw coordinate is not already whole. It is rounded here
      // rather than in the blitter: art.js draws exactly where it is told.
      const lx = Math.round(sx + dx * (i / n)), ly = Math.round(sy + dy * (i / n));
      sprites.draw(ctx, 'i_chain', ox + lx, oy + ly - this.z);
    }
    sprites.draw(ctx, 'i_hookhead', ox + this.x, oy + this.y - this.z,
      { flipX: this.dir === 'left', flipY: this.dir === 'up' });
  }
}

// --------------------------------------------------------------------------
// Carried object (lifted rock / pot / bomb)
// --------------------------------------------------------------------------

/**
 * A lifted rock, pot or bomb in flight. Unlike a Projectile — whose callers are
 * enemy data and name speeds in px/f — this is only ever built by the engine,
 * so `o.vx` and `o.vy` are sp/f and go straight into the accumulator.
 */
export class ThrownObject extends Entity {
  constructor(x, y, o = {}) {
    super(x, y, o);
    this.w = 16; this.h = 16;
    this.hb = { x: 3, y: 3, w: 10, h: 10 };
    this.sprite = o.sprite || 'rock16';
    this.pal = o.pal || 'stone';
    this.vx = o.vx || 0; this.vy = o.vy || 0;      // sp/f
    this.z = o.z || 14;
    this.vz = THROW_ARC_RISE;
    this.damage = 0;
    this.harmless = true;
    this.shadow = true;
    this.flying = true;
    this.power = o.power || 2;
    this.depth = 20;
  }

  update(game) {
    this.frame++;
    this.fz += this.vz;
    this.vz -= THROW_ARC_GRAVITY;
    const r = moveEntity(game, this, this.vx, this.vy, { jumping: true, swim: true });
    if (r.hitX || r.hitY) { this.shatter(game); return; }
    for (const e of game.entities) {
      if (e.isEnemy && !e.dead && this.overlaps(e)) {
        e.hurt(game, this.power, null, KNOCK_THROWN);
        this.shatter(game);
        return;
      }
    }
    if (this.fz <= 0) this.shatter(game);
  }

  shatter(game) {
    this.remove = true;
    game.spawnEffect('puff', this.cx - 8, this.cy - 8);
    game.audio.sfx('shatter');
    const f = groundFlags(game, this);
    if (f & F.WET) game.spawnEffect('splash', this.cx - 8, this.cy - 8);
    game.rollDrop(this.cx - 8, this.cy - 8, this.opts.drops || 'none');
  }
}

// --------------------------------------------------------------------------
// Reefseed
// --------------------------------------------------------------------------

/**
 * A thrown coral seed. It lobs, it settles, and then — after two whole seconds
 * — it becomes a pillar on the tile it landed on.
 *
 * THE DELAY IS THE DESIGN. It is what makes the Reefseed compose with the
 * conch instead of competing with it: you plant, you change the tide, and you
 * use whatever the pillar became. A pillar is a step at LOW, a wall at MID and
 * a submerged reef at HIGH, so the same throw is a bridge, a barricade or a
 * thing to swim over depending on when you sound the shell.
 *
 * It refuses to plant on a tile it would ruin — a doorway, a warp, a switch,
 * a chest — because a pillar is permanent for as long as the room is loaded
 * and a room the player has bricked shut is worse than a wasted seed.
 */
export class Reefseed extends Entity {
  constructor(x, y, o = {}) {
    super(x, y, o);
    this.w = 16; this.h = 16;
    this.hb = { x: 4, y: 5, w: 8, h: 8 };
    this.pal = null;
    this.harmless = true;
    this.shadow = true;
    this.flying = true;
    this.depth = 5;
    const [dx, dy] = DIR_VEC[o.dir || 'down'];
    this.vx = dx * REEFSEED_THROW_SPEED;
    this.vy = dy * REEFSEED_THROW_SPEED;
    this.z = o.z || 10;
    this.vz = THROW_ARC_RISE;
    this.settle = REEFSEED_SETTLE_FRAMES;
    this.grow = 0;
    this.planted = false;
  }

  update(game) {
    this.frame++;
    if (!this.planted) {
      this.fz += this.vz;
      this.vz -= THROW_ARC_GRAVITY;
      const r = moveEntity(game, this, this.vx, this.vy, { jumping: true, swim: true });
      // A seed thrown AT a wall plants at its foot, which is what "thrown at
      // floor or wall" means — the pillar grows out of whatever stopped it.
      if (r.hitX) this.vx = 0;
      if (r.hitY) this.vy = 0;
      if (--this.settle > 0 && this.fz > 0) return;
      this.plant(game);
      return;
    }
    this.grow++;
    if (this.grow % REEFSEED_SHUDDER_EVERY === 0) {
      game.spawnEffect('sparkle', this.x, this.y - 4, { life: 12, pal: 'coral' });
    }
    if (this.grow < REEFSEED_GROW_FRAMES) return;
    this.bloom(game);
  }

  plant(game) {
    this.planted = true;
    this.fz = 0; this.vz = 0; this.vx = 0; this.vy = 0;
    const { tx, ty } = this.tile();
    if (!Reefseed.canPlant(game, tx, ty)) {
      this.remove = true;
      game.audio.sfx('deny');
      game.spawnEffect('puff', this.x, this.y);
      return;
    }
    // Snap to the tile it will become, so the bud and the pillar are the same
    // 16x16 cell and the growth does not appear to jump sideways.
    this.x = tx * TILE; this.y = ty * TILE;
    game.audio.sfx('place');
  }

  bloom(game) {
    this.remove = true;
    const { tx, ty } = this.tile();
    if (!Reefseed.canPlant(game, tx, ty)) { game.audio.sfx('deny'); return; }
    game.room.setTile(tx, ty, 'coralPillar');
    game.audio.sfx('rumble');
    game.spawnEffect('puff', tx * TILE, ty * TILE);
    game.shake(SHAKE_SMALL, SHAKE_SMALL_FRAMES);
    // Anything standing where the pillar came up is moved off it rather than
    // buried in it. A player sealed inside terrain by their own item is the
    // one outcome this must never produce.
    for (const e of game.entities) {
      if (e.remove || e.isEffect) continue;
      if (Math.floor(e.cx / TILE) === tx && Math.floor(e.cy / TILE) === ty) game.shoveOffTile(e);
    }
    const p = game.player;
    if (p && Math.floor(p.cx / TILE) === tx && Math.floor(p.cy / TILE) === ty) game.shoveOffTile(p);
  }

  tile() {
    return { tx: Math.floor(this.cx / TILE), ty: Math.floor(this.cy / TILE) };
  }

  /** A tile a pillar may be grown on without ruining the room. */
  static canPlant(game, tx, ty) {
    const room = game.room;
    if (!room || !room.inBounds(tx, ty)) return false;
    if (room.baseName(tx, ty) === 'coralPillar') return false;
    if (room.warpAt(tx, ty)) return false;
    // Tested at EVERY tide level, not the current one: a doorway that is only
    // a doorway at LOW is still a doorway.
    for (let lv = 0; lv < TIDE_COUNT; lv++) {
      const f = room.flagsAt(tx, ty, lv);
      if (f & (F.VOID | F.SOLID | F.DOOR | F.WARP | F.STAIRS | F.SWITCHF | F.PIT)) return false;
    }
    for (const e of game.entities) {
      if (e.remove || e.isEffect || e.isDrop) continue;
      if (!e.solid && !e.interact && !e.pushable) continue;
      if (Math.floor(e.cx / TILE) === tx && Math.floor(e.cy / TILE) === ty) return false;
    }
    return true;
  }

  spriteName() { return this.planted ? 'o_coralbud' : 'i_reefseed'; }

  draw(ctx, game, ox, oy) {
    // The bud shudders as it grows, so a two-second wait reads as a process.
    let jx = 0;
    if (this.planted && this.grow > REEFSEED_GROW_FRAMES / 2) {
      jx = (this.frame >> 1) % 2 ? 1 : -1;
    }
    sprites.draw(ctx, this.spriteName(), ox + this.x + jx, oy + this.y - this.z, { pal: this.pal });
  }
}
defineEntity('reefseed', (x, y, o) => new Reefseed(x, y, o));

// --------------------------------------------------------------------------
// Seeds
// --------------------------------------------------------------------------

export const SEED_KINDS = ['ember', 'scent', 'pegasus', 'gale', 'mystery'];
export const SEED_INFO = {
  ember: { name: 'Ember Seed', icon: 'i_seed_ember' },
  scent: { name: 'Scent Seed', icon: 'i_seed_scent' },
  pegasus: { name: 'Pegasus Seed', icon: 'i_seed_pegasus' },
  gale: { name: 'Gale Seed', icon: 'i_seed_gale' },
  mystery: { name: 'Mystery Seed', icon: 'i_seed_mystery' },
};

/** Apply a seed's effect at a point (used by both hand-use and the slingshot). */
export function applySeed(game, kind, x, y, fromPlayer) {
  const p = game.player;
  switch (kind) {
    case 'ember': {
      game.spawnEffect('flame', x, y, { life: 120 });
      game.checkTileAction({ x: x + 4, y: y + 4, w: 8, h: 8 }, 'fire');
      for (const e of game.entities) {
        if (e.isEnemy && !e.dead && Math.hypot(e.cx - (x + 8), e.cy - (y + 8)) < 14) {
          e.hurt(game, 2, null, KNOCK_TOOL);
        }
      }
      game.audio.sfx('fire');
      break;
    }
    case 'scent':
      game.spawnEffect('sparkle', x, y, { life: 180, pal: 'enemyy' });
      game.lure = { x: x + 8, y: y + 8, life: 180 };
      game.audio.sfx('seed');
      break;
    case 'pegasus':
      if (p) p.speedBoost = PEGASUS_FRAMES;
      game.spawnEffect('sparkle', p ? p.x : x, p ? p.y : y, { life: 30 });
      game.audio.sfx('pegasus');
      break;
    case 'gale':
      game.startGaleWarp();
      break;
    case 'mystery': {
      const roll = game.rng.pick(['ember', 'scent', 'pegasus']);
      applySeed(game, roll, x, y, fromPlayer);
      break;
    }
  }
}

export class SeedShot extends Projectile {
  constructor(x, y, o = {}) {
    super(x, y, { ...o, sprite: SEED_INFO[o.kind].icon, damage: 1, fromPlayer: true });
    this.kind = o.kind;
    this.w = 8; this.h = 8;
  }
  expire(game) {
    this.remove = true;
    applySeed(game, this.kind, this.cx - 8, this.cy - 8, true);
  }
}

// --------------------------------------------------------------------------
// Item registry
// --------------------------------------------------------------------------

export const ITEMS = {
  sword: {
    names: ['Wooden Sword', 'Noble Sword', 'Master Sword'],
    icon: ['i_sword1', 'i_sword2', 'i_sword3'],
    equippable: true,
    desc: 'Press to slash. Hold to charge a spin attack.',
    use(game, p, level) { return p.startSwing(game, level); },
  },
  shield: {
    names: ['Wooden Shield', 'Iron Shield', 'Mirror Shield'],
    icon: ['i_shield1', 'i_shield2', 'i_shield3'],
    equippable: true,
    desc: 'Hold to block. Higher tiers block more.',
    hold: true,
    use(game, p, level) { if (!p.inDeep) p.shielding = true; return true; },
  },
  lens: {
    names: ['Brineglass Lens', 'Deepglass Lens'],
    icon: ['i_lens', 'i_lens2'],
    equippable: true,
    hold: true,
    desc: 'Hold it up to see the room at the next tide.',
    use(game, p, level) { p.lensHeld = true; return true; },
  },
  conch: {
    names: ['Moon Conch'],
    icon: ['i_conch'],
    equippable: true,
    desc: 'Play it to turn the tide: LOW, MID, HIGH.',
    use(game, p, level) { return p.playConch(game); },
  },
  feather: {
    names: ["Roc's Feather", "Roc's Cape"],
    icon: ['i_feather', 'i_cape'],
    equippable: true,
    desc: 'Leap over gaps and shallow water.',
    use(game, p, level) {
      return p.startJump(game, level >= 2 ? JUMP_POWER_CAPE : JUMP_POWER, level >= 2);
    },
  },
  bellows: {
    names: ['Squall Bellows'],
    icon: ['i_bellows'],
    equippable: true,
    hold: true,
    desc: 'Hold to blow. The water ahead of you falls a level while you pump.',
    use(game, p, level) { p.bellowsHeld = true; return true; },
  },
  reefseed: {
    names: ['Reefseed'],
    icon: ['i_reefseed'],
    equippable: true, counted: 'reefseeds',
    desc: 'Throw it. Two seconds later a coral pillar grows where it fell.',
    use(game, p, level) {
      if (game.progress.reefseeds <= 0) { game.audio.sfx('deny'); return true; }
      if (p.carrying) return false;
      addReefseeds(game.progress, -1);
      const [dx, dy] = DIR_VEC[p.dir];
      game.addEntity(new Reefseed(p.cx - 8 + dx * 6, p.cy - 8 + dy * 6, { dir: p.dir }));
      game.audio.sfx('throw');
      return true;
    },
  },
  bombs: {
    names: ['Bombs'],
    icon: ['i_bomb'],
    equippable: true, counted: 'bombs',
    desc: 'Blast cracked walls and stubborn foes.',
    use(game, p, level) {
      if (game.progress.bombs <= 0) { game.audio.sfx('deny'); return true; }
      if (p.carrying) return false;
      addBombs(game.progress, -1);
      const [dx, dy] = DIR_VEC[p.dir];
      const bx = Math.round((p.cx + dx * 13) - 8), by = Math.round((p.cy + dy * 13) - 8);
      const b = new Bomb(bx, by, {});
      if (!canOccupy(game, b, bx, by, { jumping: true, swim: true })) { b.x = p.cx - 8; b.y = p.cy - 8; }
      game.addEntity(b);
      game.audio.sfx('place');
      return true;
    },
  },
  bracelet: {
    names: ['Power Bracelet', 'Power Gloves'],
    icon: ['i_bracelet', 'i_gloves'],
    equippable: true,
    desc: 'Lift rocks and pots. Press again to throw.',
    use(game, p, level) {
      if (p.carrying) return p.throwCarried(game);
      return p.tryLift(game, level);
    },
  },
  cleats: {
    names: ['Kelp-Soled Cleats', 'Mermaid Suit'],
    icon: ['i_cleats', 'i_cleats2'],
    equippable: true,
    desc: 'Swim the surface, or press to sink and walk the floor beneath it.',
    use(game, p, level) { return p.toggleCleats(game); },
  },
  boomerang: {
    names: ['Boomerang', 'Magic Boomerang'],
    icon: ['i_boomerang_0', 'i_boomerang_mag'],
    equippable: true,
    desc: 'Stuns foes and fetches items. The magic one you can steer.',
    use(game, p, level) {
      if (p.boomerang && !p.boomerang.remove) return true;
      const b = new Boomerang(p.cx - 5, p.cy - 5, { dir: p.dir, level, owner: p });
      p.boomerang = b;
      game.addEntity(b);
      game.audio.sfx('boomerang');
      return true;
    },
  },
  hookshot: {
    names: ['Hookshot', 'Long Hook'],
    icon: ['i_hookshot', 'i_longhook'],
    equippable: true,
    desc: 'Latch onto posts to cross gaps and water.',
    use(game, p, level) {
      if (p.hookshot && !p.hookshot.remove) return true;
      const h = new Hookshot(p.cx - 5, p.cy - 5, { dir: p.dir, level, owner: p });
      p.hookshot = h;
      game.addEntity(h);
      game.audio.sfx('hookshot');
      return true;
    },
  },
  satchel: {
    names: ['Seed Satchel'],
    icon: ['i_satchel'],
    equippable: true,
    desc: 'Holds the five kinds of seed. Press to use the selected one.',
    use(game, p, level) {
      const kind = game.progress.seedSelected || 'ember';
      if ((game.progress.seeds[kind] || 0) <= 0) { game.audio.sfx('deny'); return true; }
      game.progress.seeds[kind]--;
      const [dx, dy] = DIR_VEC[p.dir];
      applySeed(game, kind, p.cx + dx * 12 - 8, p.cy + dy * 12 - 8, true);
      return true;
    },
  },
  slingshot: {
    names: ['Slingshot', 'Hyper Slingshot'],
    icon: ['i_slingshot', 'i_hyperslingshot'],
    equippable: true,
    desc: 'Fires seeds a long way. The hyper model fires three at once.',
    use(game, p, level) {
      const kind = game.progress.seedSelected || 'ember';
      if ((game.progress.seeds[kind] || 0) <= 0) { game.audio.sfx('deny'); return true; }
      game.progress.seeds[kind]--;
      const [dx, dy] = DIR_VEC[p.dir];
      const spread = level >= 2 ? [-0.35, 0, 0.35] : [0];
      for (const a of spread) {
        const ca = Math.cos(a), sa = Math.sin(a);
        const vx = (dx * ca - dy * sa) * 2.4, vy = (dx * sa + dy * ca) * 2.4;
        game.addEntity(new SeedShot(p.cx - 4, p.cy - 4, { kind, vx, vy, owner: p, life: 70 }));
      }
      game.audio.sfx('shoot');
      return true;
    },
  },
  shovel: {
    names: ['Shovel'],
    icon: ['i_shovel'],
    equippable: true,
    desc: 'Dig in soft sand and soil. Who knows what is buried.',
    use(game, p, level) { return p.startDig(game); },
  },
  magnet: {
    names: ['Magnetic Gloves'],
    icon: ['i_magnet'],
    equippable: true,
    desc: 'Attract or repel iron. Press to flip polarity.',
    use(game, p, level) {
      // Facing an iron plug, the gloves haul it out rather than flip polarity —
      // otherwise the region gate would need a second button nobody would find.
      const [dx, dy] = DIR_VEC[p.dir];
      const tx = Math.floor((p.cx + dx * TILE) / TILE), ty = Math.floor((p.cy + dy * TILE) / TILE);
      if (game.applyTileAction(tx, ty, 'magnet', level)) return true;
      p.magnet = p.magnet === 1 ? -1 : 1;
      game.audio.sfx('magnet');
      game.spawnEffect('spark', p.cx - 8, p.cy - 8, { pal: p.magnet === 1 ? 'enemyb' : 'enemyr' });
      return true;
    },
  },
  ringbox: {
    names: ['Ring Box', 'Ring Box L2', 'Ring Box L3'],
    icon: ['i_ringbox'],
    passive: true,
    desc: 'Holds magic rings. Bigger boxes let you wear more at once.',
  },
  map: { names: ['Dungeon Map'], icon: ['i_map'], passive: true, desc: 'Reveals the dungeon layout.' },
  compass: { names: ['Compass'], icon: ['i_compass'], passive: true, desc: 'Chimes near keys and marks the boss.' },
};

export function itemName(id, level = 1) {
  const it = ITEMS[id];
  if (!it) return id;
  return it.names[Math.min(it.names.length - 1, Math.max(0, level - 1))];
}

export function itemIcon(id, level = 1) {
  const it = ITEMS[id];
  if (!it) return 'i_unknown';
  const list = it.icon || ['i_unknown'];
  return list[Math.min(list.length - 1, Math.max(0, level - 1))];
}

export function equippableItems(progress) {
  const out = [];
  for (const [id, def] of Object.entries(ITEMS)) {
    if (!def.equippable) continue;
    const lv = itemLevel(progress, id);
    if (lv > 0) out.push({ id, level: lv, def });
  }
  return out;
}

/** Use whatever is bound to a button. Returns true if the press was consumed. */
export function useEquipped(game, player, slot) {
  const p = game.progress;
  const id = slot === 'A' ? p.equipA : p.equipB;
  if (!id) return false;
  const def = ITEMS[id];
  if (!def || !def.use) return false;
  const lv = itemLevel(p, id);
  if (lv <= 0) return false;
  return !!def.use(game, player, lv);
}
