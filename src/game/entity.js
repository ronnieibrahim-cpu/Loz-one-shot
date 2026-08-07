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

import { TILE, ROOM_W, ROOM_H, VIEW_W, VIEW_H } from '../core/screen.js';
import { sprites } from '../gfx/art.js';
import { FP_ONE, sp, toPx } from '../core/fixed.js';
import { F } from '../world/tileset.js';
import {
  ENEMY_INVULN_FRAMES, ENEMY_FLICKER_FRAMES, ENEMY_KNOCK_FRAMES, KNOCK_DEFAULT,
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

  overlaps(o) {
    const a = this.rect(), b = o.rect();
    return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  }

  distTo(o) {
    const dx = this.cx - o.cx, dy = this.cy - o.cy;
    return Math.hypot(dx, dy);
  }

  /**
   * Take damage. `dir` is the direction the hit came *from* the attacker's
   * view, and `knock` is a DISTANCE IN PIXELS, not a speed. It comes from data
   * and from call sites that pass a bare number, and is converted to the
   * engine's subpixel step here.
   *
   * Knockback is a scripted displacement, the way the GB Zeldas do it: the
   * target travels `knock` pixels over ENEMY_KNOCK_FRAMES frames at a constant
   * speed and stops. It used to be an impulse that decayed by 0.82 a frame,
   * which made the distance a function of the initial speed and put a strong
   * hit and a weak hit in unrelated places. See docs/FEEL-SPEC.md.
   */
  hurt(game, dmg, dir, knock = KNOCK_DEFAULT) {
    if (this.invuln > 0 || this.dead) return false;
    this.hp -= dmg;
    this.invuln = ENEMY_INVULN_FRAMES;
    this.flicker = ENEMY_FLICKER_FRAMES;
    if (knock && dir) {
      const [dx, dy] = DIR_VEC[dir] || [0, 0];
      // sp/f: the whole distance divided across the whole window, once.
      const per = sp(knock) / ENEMY_KNOCK_FRAMES;
      this.knockX = Math.round(dx * per); this.knockY = Math.round(dy * per);
      this.knockTime = ENEMY_KNOCK_FRAMES;
    }
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
    if (this.flicker > 0 && (this.flicker >> 1) % 2 === 0) return;
    const name = this.spriteName ? this.spriteName(game) : this.sprite;
    if (!name) return;
    sprites.draw(ctx, name, ox + this.x, oy + this.y - this.z, {
      pal: this.pal, flipX: this.flipX, alpha: this.alpha,
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

  if (sdx !== 0) {
    const nfx = e.fx + sdx;
    const nx = toPx(nfx);
    if (canOccupy(game, e, nx, e.y, c)) {
      e.fx = nfx;
    } else {
      // corner nudge: allow the move if shifting a pixel on the other axis frees it
      let ok = false;
      for (const nfy of [e.fy - FP_ONE, e.fy + FP_ONE]) {
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
      for (const nfx of [e.fx - FP_ONE, e.fx + FP_ONE]) {
        if (canOccupy(game, e, toPx(nfx), ny, c)) { e.fy = nfy; e.fx = nfx; ok = true; break; }
      }
      if (!ok) hitY = true;
    }
  }
  return { hitX, hitY };
}

/** Would the entity's hitbox at (x, y) be free of solid tiles? */
export function canOccupy(game, e, x, y, caps) {
  const room = game.room;
  if (!room) return false;
  const r = { x: x + e.hb.x, y: y + e.hb.y, w: e.hb.w, h: e.hb.h };
  // Flying entities and mid-jump entities ignore ground obstructions but not walls.
  const airborne = (e.flying || e.z > 2);
  const cps = caps || { jumping: airborne, swim: !!e.swimming, cutting: false };
  const x0 = r.x, x1 = r.x + r.w - 1, y0 = r.y, y1 = r.y + r.h - 1;
  const xs = sampleAxis(x0, x1), ys = sampleAxis(y0, y1);
  // Enemies additionally refuse terrain they will not walk on (water, pits, lava),
  // so they path around hazards instead of shuffling into them.
  const avoid = (!airborne && e.avoidFlags) ? e.avoidFlags : 0;
  for (const py of ys) {
    for (const px of xs) {
      // The ROOM's extent, not the viewport's. These were equal until P7.6 and
      // the constant that was reached for was the wrong one of the two.
      if (px < 0 || py < 0 || px >= room.pw || py >= room.ph) return false;
      if (room.solidAt(px, py, game.tide, cps)) return false;
      if (avoid) {
        const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
        if (room.flagsAt(tx, ty, game.tide) & avoid) return false;
      }
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

/** Nearest tile the given entity can legally stand on. Used after a tide change. */
export function findSafeTile(game, e, maxRadius = 6) {
  const { tx, ty } = groundTile(game, e);
  for (let r = 0; r <= maxRadius; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const nx = tx + dx, ny = ty + dy;
        if (nx < 0 || ny < 0 || nx >= game.room.tw || ny >= game.room.th) continue;
        const f = game.room.flagsAt(nx, ny, game.tide);
        if (f & (F.SOLID | F.VOID | F.DEEP | F.PIT | F.HAZARD | F.JUMPABLE)) continue;
        const px = nx * TILE + (TILE - e.w) / 2;
        const py = ny * TILE + (TILE - e.h) / 2;
        if (canOccupy(game, e, px, py, { jumping: false, swim: false })) return { x: px, y: py };
      }
    }
  }
  return null;
}
