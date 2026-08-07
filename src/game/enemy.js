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
//     speed: 0.45,              // pixels per frame. For a ground enemy this is
//                               // an average: it walks the 8px lattice, and the
//                               // speed sets how many frames a step takes.
//     hb: { x: 2, y: 5, w: 12, h: 10 },
//     drops: 'common',          // 'none' | 'common' | 'good' | 'rich'
//     terrain: 'land',          // 'land' | 'water' | 'any' | 'air'
//     shield: 'front',          // optional: immune to sword from this side
//     light: true,              // optional: the Squall Bellows can shove it
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
import { FP_ONE, sp, toPx } from '../core/fixed.js';
import {
  ENEMY_DEFAULT_SPEED, ENEMY_DEFAULT_RATE, ENEMY_TURN_CHANCE,
  ENEMY_BEACHED_FRAMES, ENEMY_GRID_STEP, ENEMY_DECIDE_STEPS,
  ENEMY_TURN_PAUSE_FRAMES,
  ENEMY_CHARGE_SPEED_MULT, ENEMY_CHARGE_RECOVER_FRAMES,
  ENEMY_CHARGE_TOLERANCE, ENEMY_CHARGE_RANGE, ENEMY_HOP_WAIT_FRAMES,
  ENEMY_HOP_DIST, ENEMY_HOP_FRAMES, ENEMY_HOP_HEIGHT,
  ENEMY_ORBIT_SPEED, ENEMY_ORBIT_RADIUS,
  ENEMY_SUBMERGE_DOWN_FRAMES, ENEMY_SUBMERGE_UP_FRAMES,
  ENEMY_SURFACE_MIN_DIST, ENEMY_SURFACE_DIST_SPAN, ENEMY_ALIGN_TOLERANCE,
  ENEMY_KNOCK_FRAMES, ENEMY_SHOT_SPEED, ENEMY_SHOT_LIFE,
  RING_SHOT_SPEED, RING_SHOT_LIFE,
  BOSS_INTRO_FRAMES, BOSS_INVULN_FRAMES, BOSS_PHASE_INVULN_FRAMES,
  BOSS_KNOCK_FRAMES, BOSS_KNOCK_SCALE,
  BOSS_DEATH_FRAMES, BOSS_DEATH_BOOM_EVERY,
  SHAKE_MEDIUM, SHAKE_SMALL_FRAMES, TIDE_DRIFT_PER_LEVEL,
  DREDGE_FLOP_DAMAGE_SCALE,
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
    // Light enough for the Squall Bellows to shove. Fliers, floaters and
    // slimes are; anything armoured or anchored is not. See docs/ITEMS.md.
    this.light = opts.light != null ? opts.light : !!spec.light;
    this.drops = opts.drops || spec.drops || 'common';
    this.dir = opts.dir || 'down';
    // Lattice motion. `step` is the step in progress, `stepping` mirrors it for
    // anything outside this file (tools/check-motion.mjs reads it), and
    // `charging` marks the one ground state that is deliberately continuous.
    this.step = null;
    this.stepping = false;
    this.charging = false;
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

    if (this.rodLock > 0) this.rodLock--;

    // Landed by the Dredge Line. It lies on the bank taking double damage and
    // doing none, then works its way back to being itself.
    if (this.dredged > 0) {
      this.dredged--;
      this.flicker = this.flicker || 0;
      if (this.dredged === 0) this.harmless = !!this.spec.harmless;
      if (this.dredged % 8 === 0) game.spawnEffect('splash', this.x, this.y + 4, { life: 10 });
      return;
    }

    // Knockback is a scripted displacement: constant speed, fixed distance,
    // fixed frame count. It also throws a ground enemy off the lattice, so the
    // last frame of it puts the enemy back on.
    if (this.knockTime > 0) {
      this.knockTime--;
      moveEntity(game, this, this.knockX, this.knockY);
      if (this.knockTime === 0) {
        this.step = null; this.stepping = false;
        realign(this, game);
      }
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
    // A creature flopping on the bank cannot raise its shield and cannot take
    // a hit lightly. This is the Dredge Line's combat verb, and it is the
    // whole answer to an aquatic enemy you could otherwise never corner.
    if (this.dredged > 0) {
      return super.hurt(game, Math.round(dmg * DREDGE_FLOP_DAMAGE_SCALE), dir, knock);
    }
    // Rung. Armour that is ringing is armour that is not blocking — locking a
    // darknut rigid would be a stun, and a stun is not an answer to armour.
    if (this.rodLock > 0) return super.hurt(game, dmg, dir, knock);
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
      // `knock` is a distance; a boss covers a fraction of it, at a constant
      // speed, over BOSS_KNOCK_FRAMES frames.
      const [dx, dy] = DIR_VEC[dir] || [0, 0];
      const per = sp(knock * BOSS_KNOCK_SCALE) / BOSS_KNOCK_FRAMES;
      this.knockX = Math.round(dx * per); this.knockY = Math.round(dy * per);
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

/**
 * Step one tile-cardinal at `speed` PX PER FRAME.
 *
 * This is the boundary. Enemy specs are data and say `speed: 0.45`; the mover
 * underneath only takes whole subpixels. Every ground-AI routine funnels
 * through here, so the px/f -> sp/f conversion happens once, in one place, and
 * a spec never has to know the grid exists.
 */
export function moveDir(e, g, dir, speed) {
  const [dx, dy] = DIR_VEC[dir] || [0, 0];
  const step = sp(speed);
  if (!e.terrainOk || e.terrainOk(g, toPx(e.fx + dx * step), toPx(e.fy + dy * step))) {
    const r = moveEntity(g, e, dx * step, dy * step);
    return !(r.hitX || r.hitY);
  }
  return false;
}

export const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };

// --------------------------------------------------------------------------
// The 8px lattice
// --------------------------------------------------------------------------
//
// A ground enemy has no velocity. It stands on a lattice point, decides where
// to go, and then takes a whole step — ENEMY_GRID_STEP pixels in one cardinal
// direction, spread over however many frames its speed implies. Once a step is
// running it runs to the end. Nothing can turn the enemy mid-step, and nothing
// draws from the room's stream mid-step either.
//
// ALL OF IT IS INTEGER SUBPIXEL ARITHMETIC, on the 8.8 grid from
// src/core/fixed.js. A lattice point is a whole multiple of GRID_SP, a step's
// progress is a whole number of subpixels, and the last frame of a step is an
// assignment rather than an addition. There is no accumulated remainder
// anywhere in here, which is why "8px-aligned" can be asserted as an exact
// equality by tools/check-motion.mjs rather than within a tolerance.
//
// That is the entire mechanism, and it is what makes an octorok dodgeable: the
// player can see the enemy standing on a lattice point, knows a decision is
// about to happen, and knows the answer will be one of four whole steps. A
// per-frame turn probability on a floating velocity gives none of that — the
// enemy can reverse at any subpixel, so there is nothing to read.
//
// WHO IS ON THE LATTICE. Ground enemies: not bosses (a boss is a set piece and
// wants to feel unconstrained), not fliers, not aquatic enemies (water carries
// you, it does not step). And `charge`, `orbit` and `bounceDiag` are
// continuous even for a ground enemy, by design — those verbs exist to feel
// different from walking.

/**
 * Is this entity's ordinary walking motion locked to the lattice?
 *
 * The boss test is `instanceof`, not `e.isBoss`, and that is not fussiness:
 * minibosses are built with `defineBoss` and then CLEAR `isBoss` in their init,
 * because `onEnemyDefeated` keys "dungeon beaten" off that flag. Reading the
 * flag here would put every miniboss on the lattice on the strength of a piece
 * of progress bookkeeping. What the class says — this thing is a set piece —
 * is what motion actually cares about.
 */
export function gridLocked(e) {
  if (e instanceof Boss) return false;
  return !e.flying && e.terrain !== 'water';
}

/** True while `e` is somewhere between two lattice points and cannot decide. */
export function midStep(e) {
  return !!e.stepping;
}

/** One lattice cell, in subpixels. Every position in here is a multiple of it. */
const GRID_SP = ENEMY_GRID_STEP * FP_ONE;

/** Is this accumulator exactly on a lattice point? */
export function onLattice(e) {
  return (e.fx % GRID_SP === 0) && (e.fy % GRID_SP === 0);
}

function latticePair(v) {
  const lo = Math.floor(v / GRID_SP) * GRID_SP;
  const hi = lo + GRID_SP;
  return (v - lo <= hi - v) ? [lo, hi] : [hi, lo];
}

/**
 * Put an entity back on the lattice, nearest legal point first.
 *
 * Knockback, a charge into a wall and a resurfacing all leave a ground enemy
 * between lattice points. Rather than let it walk a shifted lattice forever,
 * every one of those states ends by calling this. The shift is at most 4px on
 * each axis, which is under half a frame of walking and invisible in motion.
 */
export function realign(e, g) {
  if (!gridLocked(e)) return false;
  const xs = latticePair(e.fx), ys = latticePair(e.fy);
  for (const fy of ys) {
    for (const fx of xs) {
      const x = toPx(fx), y = toPx(fy);
      if (!canOccupy(g, e, x, y)) continue;
      if (e.terrainOk && !e.terrainOk(g, x, y)) continue;
      e.fx = fx; e.fy = fy;
      return true;
    }
  }
  // Nowhere legal within half a step: on the lattice still beats off it, and
  // the step probe will refuse to walk the enemy anywhere it should not go.
  e.fx = xs[0]; e.fy = ys[0];
  return false;
}

/**
 * Begin a step of `dist` PIXELS in `dir`, taking `frames` frames.
 *
 * The destination is probed before anything moves, so a step is either taken
 * whole or not taken at all — the enemy never ends up wedged half into a wall
 * and off the lattice. Returns false if the way is blocked.
 */
export function beginStep(e, g, dir, dist, frames, o = {}) {
  const [dx, dy] = DIR_VEC[dir] || [0, 0];
  if (!dx && !dy) return false;
  if (!onLattice(e)) realign(e, g);
  const span = dist * FP_ONE;
  const tx = toPx(e.fx + dx * span), ty = toPx(e.fy + dy * span);
  // A hop clears ground obstructions a walk cannot; canOccupy decides that
  // from the entity's own height, so lift it for the probe.
  const fz0 = e.fz;
  if (o.air) e.fz = 4 * FP_ONE;
  const ok = canOccupy(g, e, tx, ty) && (!e.terrainOk || e.terrainOk(g, tx, ty));
  e.fz = fz0;
  if (!ok) return false;
  e.step = {
    dir, dx, dy, span, n: Math.max(1, Math.round(frames)), f: 0,
    fx0: e.fx, fy0: e.fy,
  };
  e.stepping = true;
  return true;
}

/**
 * Carry a step forward one frame. Returns true while the step is still
 * running. A step that is interrupted anyway — a block that appeared after the
 * probe, a door closing — is rewound to where it started, which is a lattice
 * point.
 */
export function advanceStep(e, g) {
  const s = e.step;
  if (!s) return false;
  s.f++;
  // Progress is a fraction of the WHOLE step, computed fresh from the step's
  // origin every frame and rounded to a whole subpixel. It is not an
  // accumulated velocity, so nothing carries a remainder and the last frame is
  // the exact destination rather than a sum that happens to arrive near it.
  const want = Math.round((s.span * s.f) / s.n);
  const r = moveEntity(g, e, s.fx0 + s.dx * want - e.fx, s.fy0 + s.dy * want - e.fy);
  if (r.hitX || r.hitY) {
    e.fx = s.fx0; e.fy = s.fy0;
    e.step = null; e.stepping = false;
    return false;
  }
  if (s.f >= s.n) {
    e.fx = s.fx0 + s.dx * s.span; e.fy = s.fy0 + s.dy * s.span;
    e.step = null; e.stepping = false;
  }
  return true;
}

/** Frames one lattice step takes at the given average speed. */
function stepFrames(speed, dist) {
  return Math.max(1, Math.round(dist / Math.max(Math.abs(speed), 0.01)));
}

/**
 * Take one whole lattice step in `dir` if the way is clear. The workhorse the
 * lattice half of wander/chase/flee/patrol is built from.
 */
export function gridStep(e, g, dir, speed, o = {}) {
  const dist = o.dist || ENEMY_GRID_STEP;
  return beginStep(e, g, dir, dist, stepFrames(speed, dist), o);
}

/**
 * The shared front half of every lattice walker: finish a running step, sit
 * out a hesitation, and otherwise report that a decision is due this frame.
 */
function readyToDecide(e, g) {
  if (e.stepping) { advanceStep(e, g); return false; }
  if (e._pause > 0) { e._pause--; return false; }
  return true;
}

// --------------------------------------------------------------------------
// Walking verbs
// --------------------------------------------------------------------------

/**
 * Amble about. On the lattice: walk ENEMY_DECIDE_STEPS whole steps, then draw
 * a fresh direction from the room's stream. Off it (bosses, aquatic drifters):
 * the old continuous drift with a per-frame turn probability.
 *
 * The cadence, not the probability, is the point. An enemy that rolls to turn
 * every frame turns at unpredictable subpixels; one that decides every third
 * step turns where the player can see it coming.
 */
export function wander(e, g, o = {}) {
  const speed = o.speed != null ? o.speed : e.speed;
  if (!gridLocked(e)) {
    const turn = o.turnChance != null ? o.turnChance : ENEMY_TURN_CHANCE;
    if (o.pause && e._pause > 0) { e._pause--; return; }
    if (!moveDir(e, g, e.dir, speed) || g.rng.chance(turn)) {
      e.dir = randDir(g);
      if (o.pause) e._pause = o.pause;
    }
    return;
  }
  if (!readyToDecide(e, g)) return;
  const run = o.decide != null ? o.decide : ENEMY_DECIDE_STEPS;
  if (!(e._runLeft > 0)) {
    e.dir = randDir(g);
    e._runLeft = run;
    if (o.pause) { e._pause = o.pause; return; }
  }
  if (gridStep(e, g, e.dir, speed, o)) {
    e._runLeft--;
  } else {
    // Walked into something. Hesitate, then decide again next time — one draw
    // per hesitation rather than one per frame, so a cornered enemy cannot
    // chew through the room's stream.
    e._runLeft = 0;
    e._pause = ENEMY_TURN_PAUSE_FRAMES;
  }
}

/**
 * Walk toward the player, preferring the axis with the greater gap. On the
 * lattice the choice is remade at every lattice point and nowhere else, so a
 * chaser tracks the player in visible right-angled steps instead of sliding
 * diagonally onto them.
 */
export function chase(e, g, o = {}) {
  const p = o.target || g.player;
  if (!p) return;
  const speed = o.speed != null ? o.speed : e.speed;
  const dx = p.cx - e.cx, dy = p.cy - e.cy;
  const xMajor = Math.abs(dx) > Math.abs(dy);
  const primary = xMajor ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
  const secondary = xMajor ? (dy < 0 ? 'up' : 'down') : (dx < 0 ? 'left' : 'right');
  if (!gridLocked(e)) {
    e.dir = primary;
    if (!moveDir(e, g, primary, speed)) {
      e.dir = secondary;
      if (!moveDir(e, g, secondary, speed)) e.dir = primary;
    }
    return;
  }
  if (!readyToDecide(e, g)) return;
  e.dir = primary;
  if (gridStep(e, g, primary, speed, o)) return;
  e.dir = secondary;
  if (gridStep(e, g, secondary, speed, o)) return;
  e.dir = primary;
  e._pause = ENEMY_TURN_PAUSE_FRAMES;
}

/** The reverse of `chase`: put distance between yourself and the player. */
export function flee(e, g, o = {}) {
  const p = o.target || g.player;
  if (!p) return;
  const speed = o.speed != null ? o.speed : e.speed;
  const dx = e.cx - p.cx, dy = e.cy - p.cy;
  const xMajor = Math.abs(dx) > Math.abs(dy);
  const primary = xMajor ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
  const secondary = xMajor ? (dy < 0 ? 'up' : 'down') : (dx < 0 ? 'left' : 'right');
  if (!gridLocked(e)) {
    e.dir = primary;
    if (!moveDir(e, g, primary, speed)) e.dir = randDir(g);
    return;
  }
  if (!readyToDecide(e, g)) return;
  e.dir = primary;
  if (gridStep(e, g, primary, speed, o)) return;
  e.dir = secondary;
  if (gridStep(e, g, secondary, speed, o)) return;
  // Cornered with the player in the way: turn and take it.
  e.dir = randDir(g);
  e._pause = ENEMY_TURN_PAUSE_FRAMES;
}

/**
 * Back-and-forth along one axis, reversing at walls. On the lattice the
 * reversal happens at a lattice point, so a line of patrolling crabs stays a
 * line instead of smearing out of phase.
 */
export function patrol(e, g, o = {}) {
  const speed = o.speed != null ? o.speed : e.speed;
  if (!e._pdir) e._pdir = o.axis === 'y' ? 'down' : 'right';
  if (!gridLocked(e)) {
    if (!moveDir(e, g, e._pdir, speed)) e._pdir = OPPOSITE[e._pdir];
    e.dir = e._pdir;
    return;
  }
  if (!readyToDecide(e, g)) { e.dir = e._pdir; return; }
  if (!gridStep(e, g, e._pdir, speed, o)) {
    e._pdir = OPPOSITE[e._pdir];
    if (!gridStep(e, g, e._pdir, speed, o)) e._pause = ENEMY_TURN_PAUSE_FRAMES;
  }
  e.dir = e._pdir;
}

/** Free diagonal drift that reflects off walls (keese, bubbles). */
export function bounceDiag(e, g, o = {}) {
  const speed = o.speed != null ? o.speed : e.speed;
  if (e._bvx == null) {
    const a = g.rng.angle();
    e._bvx = sp(Math.cos(a) * speed); e._bvy = sp(Math.sin(a) * speed);
  }
  const r = moveEntity(g, e, e._bvx, e._bvy);
  if (r.hitX) e._bvx = -e._bvx;
  if (r.hitY) e._bvy = -e._bvy;
  e.dir = Math.abs(e._bvx) > Math.abs(e._bvy) ? (e._bvx < 0 ? 'left' : 'right') : (e._bvy < 0 ? 'up' : 'down');
}

/**
 * Hop: rise, travel, land. Used by zols, crabs, tektites.
 *
 * A hop is a lattice step with an arc drawn on it. The distance is a whole
 * number of lattice cells and the airtime is a fixed frame count, so the
 * hopper leaves the lattice and lands back on it — the landing pixel and the
 * landing frame are both known the instant the hop starts, which is what makes
 * a tektite something you can walk under rather than something you flinch at.
 *
 * The old version integrated a velocity against a gravity constant, so the
 * landing spot depended on how the two divided and was never on the lattice.
 */
export function hop(e, g, o = {}) {
  const wait = o.wait || ENEMY_HOP_WAIT_FRAMES;
  const dist = o.dist || ENEMY_HOP_DIST;
  const air = o.frames || ENEMY_HOP_FRAMES;
  const height = o.height || ENEMY_HOP_HEIGHT;
  if (e._hopState == null) { e._hopState = 'wait'; e._hopWait = wait; }

  if (e._hopState === 'air') {
    advanceStep(e, g);
    if (e.step) {
      // A parabola through both ends of the step, peaking at `height` in the
      // middle. Fitted to the step's own progress rather than integrated, so it
      // cannot land early or late — and computed in subpixels from whole
      // integers, so it lands on exactly zero.
      const { f, n } = e.step;
      e.fz = Math.round((height * FP_ONE * 4 * f * (n - f)) / (n * n));
    } else {
      e.fz = 0; e.vz = 0;
      e._hopState = 'wait';
      e._hopWait = wait;
    }
    return;
  }

  if (--e._hopWait > 0) return;
  if (o.toward !== false) facePlayer(e, g);
  // Blocked ahead: try one other direction from the room's stream rather than
  // hopping into a wall, then wait out another beat if that is blocked too.
  if (!beginStep(e, g, e.dir, dist, air, { air: true })) {
    e.dir = randDir(g);
    if (!beginStep(e, g, e.dir, dist, air, { air: true })) { e._hopWait = wait; return; }
  }
  e._hopState = 'air';
  if (g.audio) g.audio.sfx('hop');
}

/**
 * Charge in a straight line once the player lines up; stop at walls.
 *
 * Deliberately continuous, lattice or no lattice. A charge is the one thing a
 * ground enemy does that is supposed to feel like it has momentum, and putting
 * it on the lattice would make it read as a fast walk. It ends by putting the
 * enemy back on the lattice, so the walking that follows is aligned again.
 */
export function charge(e, g, o = {}) {
  const speed = o.speed != null ? o.speed : e.speed * ENEMY_CHARGE_SPEED_MULT;
  if (e.charging) {
    if (!moveDir(e, g, e.dir, speed)) {
      e.charging = false;
      e.stun = o.recover || ENEMY_CHARGE_RECOVER_FRAMES;
      realign(e, g);
      if (o.shake) g.shake(SHAKE_MEDIUM, SHAKE_SMALL_FRAMES);
    }
    return true;
  }
  if (aligned(e, g, o.tol || ENEMY_CHARGE_TOLERANCE) && distToPlayer(e, g) < (o.range || ENEMY_CHARGE_RANGE)) {
    // Abandon any step in progress: the charge is the decision now.
    e.step = null; e.stepping = false;
    e.charging = true;
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
      let nx = Math.max(8, Math.min(VIEW_W - 24, g.player.cx + Math.cos(a) * d - 8));
      let ny = Math.max(8, Math.min(VIEW_H - 24, g.player.cy + Math.sin(a) * d - 8));
      // A leever that surfaces off the lattice would walk a shifted one for the
      // rest of its life, so it comes up on a lattice point.
      if (gridLocked(e)) {
        nx = Math.round(nx / ENEMY_GRID_STEP) * ENEMY_GRID_STEP;
        ny = Math.round(ny / ENEMY_GRID_STEP) * ENEMY_GRID_STEP;
      }
      if (canOccupy(g, e, nx, ny)) { e.x = nx; e.y = ny; e.step = null; e.stepping = false; }
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
  // `perLevel` is px/f when a spec names one; the fallback is already sp/f.
  // Either way it is well under a pixel a frame, and only moves anything at all
  // because the position accumulator keeps the remainder between frames.
  const push = (o.perLevel != null ? sp(o.perLevel) : TIDE_DRIFT_PER_LEVEL) * lvl;
  if (push) moveEntity(g, e, (o.dx || 1) * push, (o.dy || 0) * push);
}

export const AI = {
  wander, chase, flee, patrol, bounceDiag, hop, charge, orbit, submerge,
  shoot, shootRing, every, timer, aligned, facePlayer, distToPlayer, moveDir,
  randDir, driftWithTide,
  gridLocked, gridStep, beginStep, advanceStep, realign, midStep,
};
