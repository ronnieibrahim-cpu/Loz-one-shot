// Enemy framework: a spec-driven base class plus an AI toolkit, so an individual
// enemy is usually five to fifteen lines of data.
//
// ENEMY DEFINITION FORMAT (contract for enemy data files):
//
//   defineEnemy('octorok', {
//     hp: 2,                    // hits to kill (sword L1 deals 2)
//     damage: 1,                // half-hearts dealt on contact
//     pal: 'enemyg',            // palette name
//     frames: {                 // 'side' art faces RIGHT; left is auto-flipped
//       down: ['octorok_d0', 'octorok_d1'],
//       up:   ['octorok_u0', 'octorok_u1'],
//       side: ['octorok_s0', 'octorok_s1'],
//     },
//     rate: 10,                 // frames per animation step
//     speed: 0.45,              // pixels per frame
//     hb: { x: 2, y: 5, w: 12, h: 10 },
//     drops: 'common',          // 'none' | 'common' | 'good' | 'rich'
//     terrain: 'land',          // 'land' | 'water' | 'any' | 'air'
//     shield: 'front',          // optional: immune to sword from this side
//     tideDies: 2,              // optional: dies when tide reaches this level
//     tideOnly: [0,1],          // optional: only active at these tide levels
//     init(e, g) {},            // optional one-time setup
//     ai(e, g) {                // called every frame
//       wander(e, g);
//       if (every(e, 90) && aligned(e, g, 20)) shoot(e, g, { sprite: 'rock8' });
//     },
//     onDie(e, g) {},           // optional
//   });
//
// Bosses use defineBoss, which adds phase handling and a health bar.

import {
  Entity, defineEntity, moveEntity, canOccupy, groundFlags, DIRS, DIR_VEC, dirTo,
} from './entity.js';
import { fire } from './projectile.js';
import { F } from '../world/tileset.js';
import { TILE, VIEW_W, VIEW_H } from '../core/screen.js';
import { hash32 } from '../core/rng.js';
import {
  ENEMY_DEFAULT_SPEED, ENEMY_DEFAULT_RATE, ENEMY_TURN_CHANCE,
  ENEMY_KNOCK_DECAY, ENEMY_BEACHED_FRAMES,
  ENEMY_CHARGE_SPEED_MULT, ENEMY_HOP_SPEED_MULT, ENEMY_CHARGE_RECOVER_FRAMES,
  ENEMY_CHARGE_TOLERANCE, ENEMY_CHARGE_RANGE, ENEMY_HOP_WAIT_FRAMES,
  ENEMY_HOP_POWER, ENEMY_HOP_GRAVITY, ENEMY_ORBIT_SPEED, ENEMY_ORBIT_RADIUS,
  ENEMY_SUBMERGE_DOWN_FRAMES, ENEMY_SUBMERGE_UP_FRAMES,
  ENEMY_SURFACE_MIN_DIST, ENEMY_SURFACE_DIST_SPAN, ENEMY_ALIGN_TOLERANCE,
  ENEMY_SHOT_SPEED, ENEMY_SHOT_LIFE, RING_SHOT_SPEED, RING_SHOT_LIFE,
  BOSS_INTRO_FRAMES, BOSS_INVULN_FRAMES, BOSS_PHASE_INVULN_FRAMES,
  BOSS_KNOCK_FRAMES, BOSS_KNOCK_SCALE, BOSS_KNOCK_DECAY,
  BOSS_DEATH_FRAMES, BOSS_DEATH_BOOM_EVERY,
  SHAKE_MEDIUM, SHAKE_SMALL_FRAMES, TIDE_DRIFT_PER_LEVEL,
} from '../data/feel.js';

const TERRAIN_AVOID = {
  land: F.WATER | F.DEEP | F.PIT | F.HAZARD | F.JUMPABLE,
  shallow: F.DEEP | F.PIT | F.HAZARD | F.JUMPABLE,
  water: 0,          // aquatic: constrained separately to wet tiles
  any: F.PIT,
  air: 0,
};

export class Enemy extends Entity {
  constructor(x, y, spec, opts = {}) {
    super(x, y, opts);
    this.spec = spec;
    this.isEnemy = true;
    this.maxHp = this.hp = opts.hp || spec.hp || 1;
    this.damage = opts.damage != null ? opts.damage : (spec.damage != null ? spec.damage : 1);
    this.pal = opts.pal || spec.pal || 'enemyg';
    this.speed = opts.speed || spec.speed || ENEMY_DEFAULT_SPEED;
    this.rate = spec.rate || ENEMY_DEFAULT_RATE;
    this.w = spec.w || 16; this.h = spec.h || 16;
    this.hb = spec.hb || { x: 2, y: 5, w: 12, h: 10 };
    this.terrain = spec.terrain || 'land';
    this.flying = this.terrain === 'air' || !!spec.flying;
    this.avoidFlags = spec.avoid != null ? spec.avoid : TERRAIN_AVOID[this.terrain];
    this.shield = spec.shield || null;
    this.drops = opts.drops || spec.drops || 'common';
    this.dir = opts.dir || 'down';
    this.aiState = 0;
    this.aiTimer = 0;
    this.tick = 0;
    this.homeX = x; this.homeY = y;
    this.shadow = this.flying;
    if (spec.z) this.z = spec.z;
    if (spec.init) spec.init(this, null);
  }

  spriteName() {
    const f = this.spec.frames;
    if (!f) return this.spec.sprite || 'blob';
    if (Array.isArray(f)) {
      this.flipX = false;
      return f[Math.floor(this.tick / this.rate) % f.length];
    }
    let key = this.dir;
    if (key === 'left' || key === 'right') {
      key = f.side ? 'side' : key;
      this.flipX = (this.dir === 'left') && !!f.side;
    } else {
      this.flipX = false;
    }
    const list = f[key] || f.down || f.side || Object.values(f)[0];
    return list[Math.floor(this.tick / this.rate) % list.length];
  }

  /** Aquatic enemies must stay in water; land enemies stay out of it. */
  terrainOk(game, x, y) {
    if (this.terrain !== 'water') return true;
    const px = Math.floor(x + this.hb.x + this.hb.w / 2);
    const py = Math.floor(y + this.hb.y + this.hb.h / 2);
    const f = game.room.flagsAt(Math.floor(px / TILE), Math.floor(py / TILE), game.tide.level);
    return !!(f & F.WET);
  }

  update(game) {
    this.tick++;
    if (this.invuln > 0) this.invuln--;
    if (this.flicker > 0) this.flicker--;

    // Tide interactions: some enemies only exist at certain tide levels.
    const lvl = game.tide.level;
    if (this.spec.tideOnly && !this.spec.tideOnly.includes(lvl)) {
      this.dormant = true;
    } else {
      this.dormant = false;
    }
    if (this.spec.tideDies != null && lvl >= this.spec.tideDies && !this.dead) {
      this.die(game); return;
    }
    if (this.dormant) return;

    if (this.knockTime > 0) {
      this.knockTime--;
      moveEntity(game, this, this.knockX, this.knockY);
      this.knockX *= ENEMY_KNOCK_DECAY; this.knockY *= ENEMY_KNOCK_DECAY;
      return;
    }
    if (this.stun > 0) { this.stun--; return; }

    if (this.spec.ai) this.spec.ai(this, game);

    // Aquatic enemies that end up on dry land after the tide drops flop and die.
    if (this.terrain === 'water' && !this.terrainOk(game, this.x, this.y)) {
      this.beached = (this.beached || 0) + 1;
      if (this.beached > ENEMY_BEACHED_FRAMES) this.die(game);
    } else {
      this.beached = 0;
    }
  }

  hurt(game, dmg, dir, knock) {
    if (this.shield && dir) {
      // A shielded enemy blocks hits arriving at its facing side.
      const opposite = { up: 'down', down: 'up', left: 'right', right: 'left' };
      if (this.shield === 'front' && opposite[dir] === this.dir) {
        game.audio.sfx('block');
        game.spawnEffect('spark', this.cx - 8, this.cy - 8);
        return false;
      }
      if (this.shield === 'all') { game.audio.sfx('block'); return false; }
    }
    if (this.spec.onHurt) this.spec.onHurt(this, game, dmg);
    return super.hurt(game, dmg, dir, knock);
  }

  onDie(game) {
    if (this.spec.onDie) this.spec.onDie(this, game);
    game.rollDrop(this.cx - 8, this.cy - 8, this.drops);
  }

  draw(ctx, game, ox, oy) {
    if (this.dormant) return;
    super.draw(ctx, game, ox, oy);
  }
}

export function defineEnemy(name, spec) {
  defineEntity(name, (x, y, opts, game) => {
    const e = new Enemy(x, y, spec, opts);
    if (spec.init) spec.init(e, game);
    return e;
  });
  return spec;
}

// --------------------------------------------------------------------------
// Bosses
// --------------------------------------------------------------------------
//
// BOSS DEFINITION FORMAT (contract for boss data files):
//
//   defineBoss('gohmaraq', {
//     hp: 30, damage: 4, pal: 'enemyr',
//     w: 32, h: 32, hb: { x: 3, y: 8, w: 26, h: 22 },
//     frames: ['boss_gohmaraq_0', 'boss_gohmaraq_1', 'boss_gohmaraq_2'],
//     hurtFrame: 'boss_gohmaraq_hurt',
//     rate: 10,
//     intro: 90,                  // frames of held pose before it acts
//     shell: true,                // ignores hits unless weakOpen is set
//     phases: [                   // picked by remaining health fraction
//       { above: 0.66, ai(e, g) {} },
//       { above: 0.33, ai(e, g) {} },
//       { above: 0.00, ai(e, g) {} },
//     ],
//     onIntro(e, g) {}, onPhase(e, g, i) {}, onDie(e, g) {},
//   });
//
// A boss that reads the tide should do so via g.tide.level, and may set
// e.weakOpen = true to become vulnerable for a window.

export class Boss extends Enemy {
  constructor(x, y, spec, opts = {}) {
    super(x, y, spec, opts);
    this.isBoss = true;
    this.oncePerGame = spec.oncePerGame !== false;
    this.intro = spec.intro != null ? spec.intro : BOSS_INTRO_FRAMES;
    this.phase = -1;
    this.weakOpen = !spec.shell;
    this.deathTime = 0;
    this.dying = false;
    this.w = spec.w || 32; this.h = spec.h || 32;
    this.hb = spec.hb || { x: 4, y: 8, w: this.w - 8, h: this.h - 12 };
    this.depth = 2;
    this.shadow = false;
  }

  currentPhase() {
    const list = this.spec.phases || [];
    const frac = this.hp / this.maxHp;
    for (let i = 0; i < list.length; i++) {
      if (frac > (list[i].above != null ? list[i].above : -1)) return i;
    }
    return Math.max(0, list.length - 1);
  }

  update(game) {
    this.tick++;
    if (this.invuln > 0) this.invuln--;
    if (this.flicker > 0) this.flicker--;

    if (this.dying) {
      this.deathTime++;
      if (this.deathTime % BOSS_DEATH_BOOM_EVERY === 0) {
        game.spawnEffect('boom',
          this.x + game.rng.float() * this.w - 8,
          this.y + game.rng.float() * this.h - 8);
        game.shake(SHAKE_MEDIUM, SHAKE_SMALL_FRAMES);
      }
      if (this.deathTime > BOSS_DEATH_FRAMES) { this.dying = false; super.die(game); }
      return;
    }

    if (this.intro > 0) {
      this.intro--;
      if (this.intro === 0 && this.spec.onIntro) this.spec.onIntro(this, game);
      if (this.intro === Math.floor((this.spec.intro || BOSS_INTRO_FRAMES) / 2)) game.audio.play('boss');
      return;
    }

    if (this.knockTime > 0) {
      this.knockTime--;
      moveEntity(game, this, this.knockX, this.knockY);
      this.knockX *= BOSS_KNOCK_DECAY; this.knockY *= BOSS_KNOCK_DECAY;
      return;
    }
    if (this.stun > 0) { this.stun--; return; }

    const p = this.currentPhase();
    if (p !== this.phase) {
      this.phase = p;
      this.invuln = Math.max(this.invuln, BOSS_PHASE_INVULN_FRAMES);
      if (this.spec.onPhase) this.spec.onPhase(this, game, p);
      game.audio.sfx('charged');
    }
    const ph = (this.spec.phases || [])[p];
    if (ph && ph.ai) ph.ai(this, game);
    else if (this.spec.ai) this.spec.ai(this, game);
  }

  hurt(game, dmg, dir, knock) {
    if (this.dying) return false;
    if (this.spec.shell && !this.weakOpen) {
      game.audio.sfx('block');
      game.spawnEffect('spark', this.cx - 8, this.cy - 8);
      return false;
    }
    if (this.invuln > 0) return false;
    this.hp -= dmg;
    this.invuln = BOSS_INVULN_FRAMES;
    this.flicker = BOSS_INVULN_FRAMES;
    if (knock && dir) {
      const [dx, dy] = DIR_VEC[dir] || [0, 0];
      this.knockX = dx * (knock * BOSS_KNOCK_SCALE); this.knockY = dy * (knock * BOSS_KNOCK_SCALE);
      this.knockTime = BOSS_KNOCK_FRAMES;
    }
    if (this.spec.onHurt) this.spec.onHurt(this, game, dmg);
    if (this.hp <= 0) { this.beginDeath(game); return true; }
    game.audio.sfx('enemyHit');
    return true;
  }

  beginDeath(game) {
    this.dying = true;
    this.deathTime = 0;
    this.hp = 0;
    game.audio.stop();
    game.audio.sfx('bossDie');
  }

  spriteName() {
    if (this.flicker > 0 && this.spec.hurtFrame) return this.spec.hurtFrame;
    return super.spriteName();
  }

  draw(ctx, game, ox, oy) {
    if (this.dying && (this.deathTime >> 1) % 2 === 0) return;
    super.draw(ctx, game, ox, oy);
  }
}

export function defineBoss(name, spec) {
  defineEntity(name, (x, y, opts, game) => {
    const e = new Boss(x, y, spec, opts);
    if (spec.init) spec.init(e, game);
    return e;
  });
  return spec;
}

// --------------------------------------------------------------------------
// AI toolkit
// --------------------------------------------------------------------------

/**
 * A random cardinal direction, drawn from the room's stream. `g` is required:
 * a direction chosen off a global stream would make one enemy's turn depend on
 * how many other enemies had rolled first, and the room would stop replaying.
 */
export function randDir(g) { return DIRS[g.rng.int(4)]; }

/**
 * True once every n frames, with a per-entity phase so a group does not act in
 * lockstep. The phase is a pure hash of the entity id rather than a draw from
 * a stream — an entity that is asked `every(e, 30)` and `every(e, 90)` would
 * otherwise get its phase from whichever call happened to run first.
 */
export function every(e, n) {
  if (e._phase == null) e._phase = hash32('phase', e.id, n) % n;
  return ((e.tick + e._phase) % n) === 0;
}

/** Countdown helper: returns true once when the timer elapses, then restarts it. */
export function timer(e, key, frames) {
  const k = '_t_' + key;
  if (e[k] == null) e[k] = frames;
  if (--e[k] <= 0) { e[k] = frames; return true; }
  return false;
}

export function distToPlayer(e, g) {
  return g.player ? e.distTo(g.player) : 9999;
}

export function facePlayer(e, g) {
  if (g.player) e.dir = dirTo(e, g.player);
}

/** Is the player roughly on the same row/column, within `tol` pixels? */
export function aligned(e, g, tol = ENEMY_ALIGN_TOLERANCE) {
  if (!g.player) return false;
  const p = g.player;
  if (Math.abs(p.cy - e.cy) <= tol) { e.dir = p.cx < e.cx ? 'left' : 'right'; return true; }
  if (Math.abs(p.cx - e.cx) <= tol) { e.dir = p.cy < e.cy ? 'up' : 'down'; return true; }
  return false;
}

export function moveDir(e, g, dir, speed) {
  const [dx, dy] = DIR_VEC[dir] || [0, 0];
  const nx = e.x + dx * speed, ny = e.y + dy * speed;
  if (!e.terrainOk || e.terrainOk(g, nx, ny)) {
    const r = moveEntity(g, e, dx * speed, dy * speed);
    return !(r.hitX || r.hitY);
  }
  return false;
}

/** Amble about, changing direction on walls and occasionally at random. */
export function wander(e, g, o = {}) {
  const speed = o.speed != null ? o.speed : e.speed;
  const turn = o.turnChance != null ? o.turnChance : ENEMY_TURN_CHANCE;
  if (o.pause && e._pause > 0) { e._pause--; return; }
  if (!moveDir(e, g, e.dir, speed) || g.rng.chance(turn)) {
    e.dir = randDir(g);
    if (o.pause) e._pause = o.pause;
  }
}

/** Walk toward the player, preferring the axis with the greater gap. */
export function chase(e, g, o = {}) {
  const p = o.target || g.player;
  if (!p) return;
  const speed = o.speed != null ? o.speed : e.speed;
  const dx = p.cx - e.cx, dy = p.cy - e.cy;
  const primary = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
  const secondary = Math.abs(dx) > Math.abs(dy) ? (dy < 0 ? 'up' : 'down') : (dx < 0 ? 'left' : 'right');
  e.dir = primary;
  if (!moveDir(e, g, primary, speed)) {
    e.dir = secondary;
    if (!moveDir(e, g, secondary, speed)) e.dir = primary;
  }
}

export function flee(e, g, o = {}) {
  const p = o.target || g.player;
  if (!p) return;
  const speed = o.speed != null ? o.speed : e.speed;
  const dx = e.cx - p.cx, dy = e.cy - p.cy;
  const dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
  e.dir = dir;
  if (!moveDir(e, g, dir, speed)) e.dir = randDir(g);
}

/** Back-and-forth along one axis, reversing at walls. */
export function patrol(e, g, o = {}) {
  const speed = o.speed != null ? o.speed : e.speed;
  if (!e._pdir) e._pdir = o.axis === 'y' ? 'down' : 'right';
  if (!moveDir(e, g, e._pdir, speed)) {
    e._pdir = { up: 'down', down: 'up', left: 'right', right: 'left' }[e._pdir];
  }
  e.dir = e._pdir;
}

/** Free diagonal drift that reflects off walls (keese, bubbles). */
export function bounceDiag(e, g, o = {}) {
  const speed = o.speed != null ? o.speed : e.speed;
  if (e._bvx == null) {
    const a = g.rng.angle();
    e._bvx = Math.cos(a) * speed; e._bvy = Math.sin(a) * speed;
  }
  const r = moveEntity(g, e, e._bvx, e._bvy);
  if (r.hitX) e._bvx = -e._bvx;
  if (r.hitY) e._bvy = -e._bvy;
  e.dir = Math.abs(e._bvx) > Math.abs(e._bvy) ? (e._bvx < 0 ? 'left' : 'right') : (e._bvy < 0 ? 'up' : 'down');
}

/** Hop: rise, travel, land. Used by leevers, crabs, jumping slimes. */
export function hop(e, g, o = {}) {
  const speed = o.speed != null ? o.speed : e.speed * ENEMY_HOP_SPEED_MULT;
  if (e._hopState == null) { e._hopState = 'wait'; e._hopWait = o.wait || ENEMY_HOP_WAIT_FRAMES; }
  if (e._hopState === 'wait') {
    if (--e._hopWait <= 0) {
      e._hopState = 'air';
      e.vz = o.power || ENEMY_HOP_POWER;
      if (o.toward !== false) facePlayer(e, g);
      const [dx, dy] = DIR_VEC[e.dir];
      e._hvx = dx * speed; e._hvy = dy * speed;
      if (g.audio) g.audio.sfx('hop');
    }
    return;
  }
  e.z += e.vz;
  e.vz -= ENEMY_HOP_GRAVITY;
  moveEntity(g, e, e._hvx, e._hvy);
  if (e.z <= 0) {
    e.z = 0; e.vz = 0;
    e._hopState = 'wait';
    e._hopWait = o.wait || ENEMY_HOP_WAIT_FRAMES;
  }
}

/** Charge in a straight line once the player lines up; stop at walls. */
export function charge(e, g, o = {}) {
  const speed = o.speed != null ? o.speed : e.speed * ENEMY_CHARGE_SPEED_MULT;
  if (e._charging) {
    if (!moveDir(e, g, e.dir, speed)) {
      e._charging = false;
      e.stun = o.recover || ENEMY_CHARGE_RECOVER_FRAMES;
      if (o.shake) g.shake(SHAKE_MEDIUM, SHAKE_SMALL_FRAMES);
    }
    return true;
  }
  if (aligned(e, g, o.tol || ENEMY_CHARGE_TOLERANCE) && distToPlayer(e, g) < (o.range || ENEMY_CHARGE_RANGE)) {
    e._charging = true;
    if (o.tell) e.stun = o.tell;
    if (g.audio) g.audio.sfx(o.sfx || 'charge');
    return true;
  }
  if (o.idle) o.idle(e, g);
  return false;
}

/** Circle a fixed point (spinners, orbiting eyes). */
export function orbit(e, g, o = {}) {
  const r = o.radius || ENEMY_ORBIT_RADIUS;
  const sp = o.speed != null ? o.speed : ENEMY_ORBIT_SPEED;
  if (e._ang == null) e._ang = g.rng.angle();
  e._ang += sp;
  e.x = (o.cx != null ? o.cx : e.homeX) + Math.cos(e._ang) * r;
  e.y = (o.cy != null ? o.cy : e.homeY) + Math.sin(e._ang) * r;
}

/** Sink out of sight, then surface somewhere near the player. */
export function submerge(e, g, o = {}) {
  const down = o.down || ENEMY_SUBMERGE_DOWN_FRAMES, up = o.up || ENEMY_SUBMERGE_UP_FRAMES;
  if (e._subState == null) { e._subState = 'up'; e._subT = up; }
  if (--e._subT > 0) {
    if (e._subState === 'up' && o.whileUp) o.whileUp(e, g);
    return;
  }
  if (e._subState === 'up') {
    e._subState = 'down'; e._subT = down;
    e.hidden = true; e.harmless = true; e.invuln = 9999;
    if (g.audio) g.audio.sfx('splash');
  } else {
    e._subState = 'up'; e._subT = up;
    e.hidden = false; e.harmless = false; e.invuln = 0;
    if (o.reposition !== false && g.player) {
      const a = g.rng.angle();
      const d = ENEMY_SURFACE_MIN_DIST + g.rng.float() * ENEMY_SURFACE_DIST_SPAN;
      const nx = Math.max(8, Math.min(VIEW_W - 24, g.player.cx + Math.cos(a) * d - 8));
      const ny = Math.max(8, Math.min(VIEW_H - 24, g.player.cy + Math.sin(a) * d - 8));
      if (canOccupy(g, e, nx, ny)) { e.x = nx; e.y = ny; }
    }
    if (g.audio) g.audio.sfx('splash');
  }
}

/** Fire a shot at the player. */
export function shoot(e, g, o = {}) {
  if (!g.player) return null;
  if (g.audio) g.audio.sfx(o.sfx || 'enemyShoot');
  return fire(g, e, {
    sprite: o.sprite || 'shot',
    pal: o.pal || e.pal,
    damage: o.damage != null ? o.damage : 1,
    speed: o.speed || ENEMY_SHOT_SPEED,
    dir: o.dir || e.dir,
    at: o.aim === false ? null : (o.aim ? g.player : null),
    life: o.life || ENEMY_SHOT_LIFE,
    w: o.w, h: o.h,
    overWater: o.overWater,
    bounces: o.bounces,
  });
}

/** Fire n shots evenly spaced in a circle. */
export function shootRing(e, g, n = 8, o = {}) {
  const off = o.offset || 0;
  for (let i = 0; i < n; i++) {
    const a = off + (i / n) * Math.PI * 2;
    fire(g, e, {
      sprite: o.sprite || 'shot', pal: o.pal || e.pal,
      damage: o.damage != null ? o.damage : 1,
      vx: Math.cos(a) * (o.speed || RING_SHOT_SPEED), vy: Math.sin(a) * (o.speed || RING_SHOT_SPEED),
      life: o.life || RING_SHOT_LIFE, w: o.w, h: o.h,
    });
  }
  if (g.audio) g.audio.sfx(o.sfx || 'enemyShoot');
}

/** Drift with the current while the tide is high (aquatic enemies). */
export function driftWithTide(e, g, o = {}) {
  const lvl = g.tide.level;
  const push = (o.perLevel || TIDE_DRIFT_PER_LEVEL) * lvl;
  if (push) moveEntity(g, e, (o.dx || 1) * push, (o.dy || 0) * push);
}

export const AI = {
  wander, chase, flee, patrol, bounceDiag, hop, charge, orbit, submerge,
  shoot, shootRing, every, timer, aligned, facePlayer, distToPlayer, moveDir,
  randDir, driftWithTide,
};
