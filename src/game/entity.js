// Entity base class, tile collision, and the spawn registry.
//
// Coordinates are room-local: x in 0..159, y in 0..127. `z` is height off the
// ground for jumps and flying enemies; it shifts the sprite up and detaches the
// entity from ground hazards without moving its shadow.
//
// POSITIONS ARE 8.8 FIXED-POINT. `fx`, `fy` and `fz` are integer subpixel
// accumulators; `x`, `y` and `z` are integer pixel positions derived from them
// by an arithmetic shift. Rendering reads the pixel positions and rounds
// nothing. See src/core/fixed.js for why both halves of that matter.
//
// Assigning `e.x = 40` still works and is still the right way to place an
// entity — the accessor converts and the accumulator follows. What does NOT
// work is `e.x += 0.5`: the read gives whole pixels, so a step smaller than a
// pixel rounds away to nothing every frame and the entity never moves. Add to
// `e.fx` instead, or go through `moveEntity`.

import { TILE } from '../core/screen.js';
import { sprites } from '../gfx/art.js';
import { FP_ONE, sp, toPx } from '../core/fixed.js';
import { F } from '../world/tileset.js';
import {
  ENEMY_INVULN_FRAMES, ENEMY_HIT_TIERS, ENEMY_HURT_RADIUS, ENEMY_KNOCK_SPEED, KNOCK_DEFAULT,
  HITSTOP_HIT_FRAMES, ENEMY_HIT_FLASH_BEAT, ENEMY_CONTACT_Z,
} from '../data/feel.js';

export const ENTITY_TYPES = new Map();

/** Register a spawnable entity. `factory(x, y, opts, game) -> Entity`. */
export function defineEntity(name, factory) {
  ENTITY_TYPES.set(name, factory);
}

export function spawnEntity(game, name, tx, ty, opts) {
  const f = ENTITY_TYPES.get(name);
  if (!f) { console.warn('[entity] unknown type:', name); return null; }
  const e = f(tx * TILE, ty * TILE, opts || {}, game);
  if (e) { e.type = name; game.addEntity(e); }
  return e;
}

export const DIRS = ['down', 'up', 'left', 'right'];
export const DIR_VEC = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };

export function dirFromVec(dx, dy) {
  if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? 'left' : 'right';
  return dy < 0 ? 'up' : 'down';
}

export function dirTo(a, b) {
  return dirFromVec((b.x + b.w / 2) - (a.x + a.w / 2), (b.y + b.h / 2) - (a.y + a.h / 2));
}

let nextId = 1;

/**
 * An enemy's collision area — what the sword must reach and what hurts Link
 * when it touches his own (playerHurtRect): a box of ENEMY_HURT_RADIUS either
 * way of the middle of its sprite, as the cartridge has it — NOT its `hb`, which
 * is the footprint it walks on and sits two pixels low. An enemy whose spec
 * declares its own `hurtBox` keeps it; anything bigger than one cell with
 * none (a boss) falls back to its `hb`.
 */
export function enemyHurtRect(e) {
  // A hoverer (keese, bubble, wisp) is drawn `spec.z` pixels up, and the box
  // goes with the sprite: the cartridge's keese and bubble fly at z 0, so their
  // box is where they are drawn, and ours are drawn higher.
  //
  // Anything ABOVE that — a zol, a tektite, a stalfos in the air — keeps its
  // box on the ground under it, and touches nothing once it is ENEMY_CONTACT_Z
  // or more up: the cartridge compares heights before it compares boxes, for
  // Link and for his sword alike (code/collisionEffects.s, "Check if Z
  // positions are within 7 pixels"). S151; the box used to rise with the jump.
  const hover = (e.spec && e.spec.z) || 0;
  if (e.z - hover >= ENEMY_CONTACT_Z) return { x: -1e4, y: -1e4, w: 0, h: 0 };
  const lift = hover > 0 && e.z > 0 ? Math.min(e.z, hover) : 0;
  const hb = e.spec && e.spec.hurtBox;
  if (hb) return { x: e.x + hb.x, y: e.y + hb.y - lift, w: hb.w, h: hb.h };
  if (e.w > 16 || e.h > 16) return e.rect();
  const r = ENEMY_HURT_RADIUS;
  return { x: e.x + e.w / 2 - r, y: e.y + e.h / 2 - r - lift, w: r * 2, h: r * 2 };
}

/** How long a hit of `knock` pixels leaves an ordinary enemy invulnerable. */
export function hitInvulnFrames(knock) {
  if (!knock) return ENEMY_INVULN_FRAMES;
  for (const [px, f] of ENEMY_HIT_TIERS) if (knock <= px) return f;
  return ENEMY_HIT_TIERS[ENEMY_HIT_TIERS.length - 1][1];
}

/**
 * The per-frame step, in sp/f, of a knockback at `speed`: away from `from`'s
 * middle when there is one, snapped to one of 32 angles as the cartridge's
 * angles are; else along `dir`. Null if there is no direction at all.
 */
export function knockVector(e, dir, from, speed) {
  if (from) {
    const dx = e.cx - from.cx, dy = e.cy - from.cy;
    if (dx || dy) {
      const a = Math.round(Math.atan2(dy, dx) / (Math.PI / 16)) * (Math.PI / 16);
      return [Math.round(Math.cos(a) * speed), Math.round(Math.sin(a) * speed)];
    }
  }
  const v = dir && DIR_VEC[dir];
  if (!v) return null;
  return [v[0] * speed, v[1] * speed];
}

export class Entity {
  constructor(x, y, opts = {}) {
    this.id = nextId++;
    this.fx = sp(x); this.fy = sp(y); this.fz = 0;
    this.w = 16; this.h = 16;
    this.vx = 0; this.vy = 0;      // sp/f
    this.vz = 0;                   // sp/f
    this.dir = 'down';
    this.frame = 0;          // animation counter, ticks each update
    this.hp = 1; this.maxHp = 1;
    this.damage = 0;         // contact damage dealt to the player, in half-hearts
    this.invuln = 0;
    this.flicker = 0;
    this.stun = 0;
    this.dead = false;
    this.remove = false;
    this.solid = false;      // blocks the player like a pushable block
    this.pushable = false;
    this.isEnemy = false;
    this.isBoss = false;
    this.isProjectile = false;
    this.isDrop = false;
    this.isEffect = false;
    this.harmless = false;   // never damages the player (NPCs, drops)
    this.grounded = true;    // affected by pits/water
    this.flying = false;
    this.knockTime = 0;
    this.knockX = 0; this.knockY = 0;
    this.hb = { x: 2, y: 4, w: 12, h: 11 };   // hitbox inset within w/h
    this.shadow = true;
    this.depth = 0;          // draw-order tiebreak
    // The tide level this entity genuinely exists at, or null for "always".
    // A phased-out entity is not drawn, not dangerous and not hittable until
    // the Brineglass Lens is raised. See Game.updatePhaseShift and
    // docs/ITEMS.md.
    this.phase = opts.phase != null ? opts.phase : null;
    this.opts = opts;
    this.spawnTx = Math.floor(x / TILE);
    this.spawnTy = Math.floor(y / TILE);
  }

  // The pixel position is derived, never stored: anything may add to `fx`
  // directly, and a cached copy would go stale the moment something did.
  get x() { return toPx(this.fx); }
  set x(v) { this.fx = sp(v); }
  get y() { return toPx(this.fy); }
  set y(v) { this.fy = sp(v); }
  get z() { return toPx(this.fz); }
  set z(v) { this.fz = sp(v); }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }

  rect() {
    return { x: this.x + this.hb.x, y: this.y + this.hb.y, w: this.hb.w, h: this.hb.h };
  }

  /**
   * The box this thing HURTS and IS HURT with, as opposed to `rect()`, the
   * footprint it walks on. The same for most entities; an enemy, Link and an
   * enemy shot use the cartridge's collision radii (enemyHurtRect,
   * Player.contactRect, Projectile.contactRect). Contact damage asks this, and
   * so does every tool that models contact — never a copy of it.
   */
  contactRect() { return this.rect(); }

  overlaps(o) {
    const a = this.rect(), b = o.rect();
    return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  }

  distTo(o) {
    const dx = this.cx - o.cx, dy = this.cy - o.cy;
    return Math.hypot(dx, dy);
  }

  /**
   * Take damage. `knock` is a DISTANCE IN PIXELS, not a speed; the target is
   * thrown it at ENEMY_KNOCK_SPEED (2 px a frame, the cartridge's) and stops
   * early if something stops it. `from`, when given, is what struck it — the
   * throw goes straight away from its middle, as Seasons' does, on the nearest
   * of the cartridge's 32 angles. Without one it goes along `dir`, the
   * direction the hit travelled.
   *
   * How long the target is then invulnerable (and flashing) follows the hit's
   * strength: ENEMY_HIT_TIERS.
   */
  hurt(game, dmg, dir, knock = KNOCK_DEFAULT, from = null) {
    if (this.invuln > 0 || this.dead) return false;
    this.hp -= dmg;
    this.invuln = hitInvulnFrames(knock);
    this.flicker = this.invuln;
    const v = knockVector(this, dir, from, ENEMY_KNOCK_SPEED);
    if (knock && v) {
      this.knockX = v[0]; this.knockY = v[1];
      this.knockTime = Math.max(1, Math.round(knock / (ENEMY_KNOCK_SPEED / 256)));
    }
    // The freeze goes on the hit CONNECTING, not on the sword specifically:
    // this is the one funnel every damage source in the game passes through,
    // so a bomb, a thrown pot and a swing all land with the same weight.
    // Longest-wins inside `freeze` keeps a four-enemy explosion to one impact.
    if (this.isEnemy) game.freeze(HITSTOP_HIT_FRAMES);
    if (this.hp <= 0) { this.die(game); return true; }
    game.audio.sfx('enemyHit');
    if (this.onHurt) this.onHurt(game);
    return true;
  }

  die(game) {
    if (this.dead) return;
    this.dead = true;
    this.remove = true;
    if (this.onDie) this.onDie(game);
    game.spawnEffect('puff', this.cx - 8, this.cy - 8 - this.z);
    game.audio.sfx(this.isBoss ? 'bossDie' : 'enemyDie');
    if (this.isEnemy) game.onEnemyDefeated(this);
  }

  update(game) { }

  draw(ctx, game, ox, oy) {
    // A struck enemy FLASHES, the way the Oracles draw it: on the off beat it
    // is drawn in `hitflash` instead of being hidden, so it never leaves the
    // screen while it is being hit. Anything else still blinks out.
    let pal = this.pal;
    if (this.flicker > 0 && Math.floor(this.flicker / ENEMY_HIT_FLASH_BEAT) % 2 === 0) {
      if (!this.isEnemy) return;
      pal = 'hitflash';
    }
    const name = this.spriteName ? this.spriteName(game) : this.sprite;
    if (!name) return;
    // `shakeX`: a whole-pixel shiver an enemy's ai sets (the flipped spiked
    // beetle's last second); drawing only, the entity does not move.
    const off = this.drawOffset ? this.drawOffset(game, name) : null;
    sprites.draw(ctx, name, ox + this.x + (this.shakeX || 0) + (off ? off[0] : 0),
      oy + this.y - this.z + (off ? off[1] : 0), {
      pal, flipX: this.flipX, alpha: this.alpha,
    });
  }

  drawShadow(ctx, game, ox, oy) {
    if (!this.shadow || this.z <= 1) return;
    sprites.draw(ctx, 'shadow', ox + this.x, oy + this.y + 6, { pal: 'uidark', alpha: 0.5 });
  }
}

// --------------------------------------------------------------------------
// Tile collision
// --------------------------------------------------------------------------

/**
 * Try to move an entity by (sdx, sdy) SUBPIXELS against the room's solid tiles.
 * Axis-separated so sliding along walls works, with a small corner-nudge so
 * the player doesn't snag on tile seams (matches how the GBC games felt).
 * Returns { hitX, hitY }.
 *
 * The deltas are subpixels, not pixels — 256 to the pixel. A caller holding a
 * px/f speed converts it with `sp()`; the enemy AI toolkit does this once at
 * its edge so enemy data can go on being written in px/f.
 *
 * A step that does not change the whole-pixel position still lands: the
 * accumulator takes it, `canOccupy` is asked about the same pixel it already
 * occupies and says yes. That is how a 0.12 px/f current pushes at all.
 */
export function moveEntity(game, e, sdx, sdy, caps) {
  const c = caps || e.caps || null;
  let hitX = false, hitY = false;
  // THE CORNER NUDGE IS FOR TERRAIN, AND FOR A STRAIGHT PUSH. Seasons slides
  // Link round the corner of a wall he walks into square-on; it does not
  // slide him round a person, and a diagonal press already slides along a
  // wall by moving on its free axis. Nudging round a solid townsperson on a
  // diagonal press walked Link along its side and off the screen beside an
  // exit (Sennit, Sandpiper Row; S147's note).
  const straight = !(sdx && sdy);

  if (sdx !== 0) {
    const nfx = e.fx + sdx;
    const nx = toPx(nfx);
    if (canOccupy(game, e, nx, e.y, c)) {
      e.fx = nfx;
    } else {
      // corner nudge: allow the move if shifting a pixel on the other axis frees it
      let ok = false;
      const nudge = straight && !canOccupy(game, e, nx, e.y, c, true) ? [e.fy - FP_ONE, e.fy + FP_ONE] : [];
      for (const nfy of nudge) {
        if (canOccupy(game, e, nx, toPx(nfy), c)) { e.fx = nfx; e.fy = nfy; ok = true; break; }
      }
      if (!ok) hitX = true;
    }
  }
  if (sdy !== 0) {
    const nfy = e.fy + sdy;
    const ny = toPx(nfy);
    if (canOccupy(game, e, e.x, ny, c)) {
      e.fy = nfy;
    } else {
      let ok = false;
      const nudge = straight && !canOccupy(game, e, e.x, ny, c, true) ? [e.fx - FP_ONE, e.fx + FP_ONE] : [];
      for (const nfx of nudge) {
        if (canOccupy(game, e, toPx(nfx), ny, c)) { e.fy = nfy; e.fx = nfx; ok = true; break; }
      }
      if (!ok) hitY = true;
    }
  }
  return { hitX, hitY };
}

/** Would the entity's hitbox at (x, y) be free of solid tiles? */
export function canOccupy(game, e, x, y, caps, terrainOnly = false) {
  const room = game.room;
  if (!room) return false;
  const r = { x: x + e.hb.x, y: y + e.hb.y, w: e.hb.w, h: e.hb.h };
  // Flying entities and mid-jump entities ignore ground obstructions but not walls.
  const airborne = (e.flying || e.z > 2);
  // AN ENTITY'S OWN `caps` ARE THE FALLBACK, and this is the whole of why the
  // sea had no living thing in it. `moveEntity` has always read `e.caps`; this
  // read `e.swimming`, which NOTHING IN THE GAME EVER SET. So one function said
  // an anglerfry could swim and the other said it could not, and the one that
  // said no is the one every bare call reaches — every aquatic enemy in the
  // world sat frozen on its spawn tile, unable to leave deep water, for the
  // life of the project. Nothing could see it: they spawn, they update, they
  // draw, they animate, they hurt you if you touch them, and check-motion's
  // "swimmers stay off the 8px lattice" is satisfied perfectly by not moving.
  //
  // `jumping` is OR-ed rather than taken, so an entity that is off the ground
  // clears ground obstructions whatever its own caps say.
  const cps = caps || (e.caps
    ? { ...e.caps, jumping: e.caps.jumping || airborne }
    : { jumping: airborne, swim: false, cutting: false });
  const x0 = r.x, x1 = r.x + r.w - 1, y0 = r.y, y1 = r.y + r.h - 1;
  const xs = sampleAxis(x0, x1), ys = sampleAxis(y0, y1);
  // Enemies additionally refuse terrain they will not walk on (water, pits, lava),
  // so they path around hazards instead of shuffling into them.
  const avoid = (!airborne && e.avoidFlags) ? e.avoidFlags : 0;
  for (const py of ys) {
    for (const px of xs) {
      if (px < 0 || py < 0 || px >= room.pw || py >= room.ph) return false;
      if (room.solidAt(px, py, game.tide, cps)) return false;
      if (avoid) {
        const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
        if (room.flagsAt(tx, ty, game.tide) & avoid) return false;
      }
    }
  }
  if (!airborne && !terrainOnly) {
    for (const o of game.entities) {
      if (o === e || !o.solid || o.dead) continue;
      const ob = o.rect();
      if (x0 <= ob.x + ob.w - 1 && ob.x <= x1 && y0 <= ob.y + ob.h - 1 && ob.y <= y1) return false;
    }
  }
  return true;
}

// Sample the hitbox edges plus interior points at 8px intervals, so a hitbox
// never tunnels through a thin obstruction.
function sampleAxis(a, b) {
  const out = [a];
  for (let v = a + 8; v < b; v += 8) out.push(v);
  out.push(b);
  return out;
}

/** Tile flags under an entity's feet (its hitbox centre-bottom). */
export function groundFlags(game, e) {
  const room = game.room;
  if (!room) return 0;
  const px = Math.floor(e.x + e.hb.x + e.hb.w / 2);
  const py = Math.floor(e.y + e.hb.y + e.hb.h - 2);
  const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
  return room.flagsAt(tx, ty, game.tide);
}

/**
 * Is any part of this entity's hitbox over deep water?
 *
 * `groundFlags` asks about ONE point — the hitbox's centre-bottom — which is
 * the right question for "what am I standing in" and the wrong one for "have I
 * met the water yet". The Kelp-Soled Cleats' dive needs the second: a player
 * who has set the soles to drink is promised the floor of the next water he
 * meets, and at the mouth of a torrent running against him he never gets his
 * middle over it (see Player.updateWater). Samples the hitbox the same way
 * `canOccupy` does, so the two never disagree about where the water starts.
 */
export function touchingDeep(game, e) {
  const room = game.room;
  if (!room) return false;
  const r = e.rect();
  const xs = sampleAxis(r.x, r.x + r.w - 1), ys = sampleAxis(r.y, r.y + r.h - 1);
  for (const py of ys) {
    for (const px of xs) {
      const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
      if (!room.inBounds(tx, ty)) continue;
      if (room.flagsAt(tx, ty, game.tide) & F.DEEP) return true;
    }
  }
  return false;
}

export function groundTile(game, e) {
  const room = game.room;
  const px = Math.floor(e.x + e.hb.x + e.hb.w / 2);
  const py = Math.floor(e.y + e.hb.y + e.hb.h - 2);
  return { tx: Math.floor(px / TILE), ty: Math.floor(py / TILE) };
}

/**
 * The tide level under an entity's own feet, 0-2.
 *
 * This is what anything reading "the tide" from inside the world should ask
 * for — an enemy, a boss, a raft. `game.tide.level` is the BASE, which is a
 * different question and is only the right one for the HUD, the music and the
 * save. Since the Anchor, the two can disagree inside a single room.
 */
export function tideAt(game, e) {
  const { tx, ty } = groundTile(game, e);
  return game.tide.levelAt(tx, ty, game.room);
}

/**
 * Can this entity STAND on that tile — not merely move through it?
 *
 * `canOccupy` answers a narrower question. A pit is not solid, so the engine
 * lets a walker step into one and then punishes him for it; deep water, lava
 * and a ledge's jumpable face are all the same shape of answer. This is the
 * "somewhere to put your feet" rule, and it lives here rather than in each
 * caller because a caller with its own copy of it is the private-model
 * mistake this project keeps paying for (CLAUDE.md's collision rule).
 *
 * Returns the pixel position to stand at, or null.
 */
export function standAt(game, e, tx, ty, o = {}) {
  if (tx < 0 || ty < 0 || tx >= game.room.tw || ty >= game.room.th) return null;
  const f = game.room.flagsAt(tx, ty, game.tide);
  if (f & (F.SOLID | F.VOID | F.DEEP | F.PIT | F.HAZARD | F.JUMPABLE)) return null;
  const px = tx * TILE + (TILE - e.w) / 2;
  const py = ty * TILE + (TILE - e.h) / 2;
  if (!canOccupy(game, e, px, py, o.caps || { jumping: false, swim: false })) return null;
  return { x: px, y: py };
}

/** Nearest tile the given entity can legally stand on. Used after a tide change. */
export function findSafeTile(game, e, maxRadius = 6) {
  const { tx, ty } = groundTile(game, e);
  for (let r = 0; r <= maxRadius; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const at = standAt(game, e, tx + dx, ty + dy);
        if (at) return at;
      }
    }
  }
  return null;
}
