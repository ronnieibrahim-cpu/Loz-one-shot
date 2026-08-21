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

import {
  Entity, defineEntity, moveEntity, canOccupy, findSafeTile, DIR_VEC, dirFromVec, groundFlags,
} from './entity.js';
import { Projectile, fire } from './projectile.js';
import { Explosion } from './effects.js';
import { F } from '../world/tileset.js';
import { TILE } from '../core/screen.js';
import { hasItem, itemLevel, addBombs, addReefseeds, addBottles } from './progress.js';
import { TIDE_COUNT } from './tide.js';
import { FP_ONE, sp, toPx } from '../core/fixed.js';
import {
  KNOCK_TOOL, KNOCK_THROWN,
  THROW_ARC_RISE, THROW_ARC_GRAVITY, THROW_SLIDE_DECAY, THROW_SLIDE_STOP,
  REEFSEED_GROW_FRAMES, REEFSEED_SETTLE_FRAMES, REEFSEED_THROW_SPEED,
  REEFSEED_SHUDDER_EVERY,
  DREDGE_RANGE, DREDGE_CAST_SPEED, DREDGE_HAUL_SPEED, DREDGE_PULL_SPEED, COILROPE_RANGE,
  DREDGE_FLOP_FRAMES,
  ROD_RANGE, ROD_RANGE_HIGH, ROD_LOCK_FRAMES, ROD_RING_FRAMES, ROD_COOLDOWN_FRAMES,
  COIN_THROW_SPEED, COIN_SETTLE_FRAMES, COIN_GLINT_EVERY, BOTTLE_POUR_FRAMES,
  ANCHOR_RADIUS_TILES, ANCHOR_SHAPE, ANCHOR_THROW_SPEED, ANCHOR_RECALL_SPEED,
  ANCHOR_SETTLE_FRAMES, ANCHOR_CHAIN_DAMAGE,
  SHAKE_SMALL, SHAKE_SMALL_FRAMES,
  KILNSHELL_BURN_DAMAGE,
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
// Kilnshell
// --------------------------------------------------------------------------
//
// A cockle burnt down to lime. Quicklime slakes when it meets water and the
// reaction runs hot, so THE SEA IS WHAT LIGHTS IT — set the shell down on
// ground the tide is coming for, sound the conch, and it catches. Carry it
// while it burns and it lights whatever it touches. Take it into deep water
// and it goes out.
//
// That is the whole item, and it is the reason it is not a lamp with a
// seashell drawn on it: THERE IS NO BUTTON THAT MAKES FIRE. Fire is something
// the tide hands you, somewhere the tide chooses, and the same tide takes it
// back. Every use is two route problems at once — a wet tile to catch it, and
// a dry road from there to whatever needs burning — which is exactly the shape
// the Anchor is for, since one held disc can keep a patch wet beside a road
// that is drying out.
// --------------------------------------------------------------------------

export class Kilnshell extends Entity {
  constructor(x, y, o = {}) {
    super(x, y, o);
    this.w = 16; this.h = 16;
    this.hb = { x: 3, y: 6, w: 10, h: 8 };
    this.pal = 'stone';
    this.harmless = true;
    this.liftable = true;               // the carry is the point; see above
    this.lit = !!o.lit;
    this.burn = 0;
    this.depth = -1;
  }

  /** The flags under the shell — or under the player, while being carried. */
  groundFlags(game) {
    const room = game.room;
    if (!room) return 0;
    const p = game.player;
    const holder = (p && p.carrying === this) ? p : this;
    const tx = Math.floor(holder.cx / TILE), ty = Math.floor(holder.cy / TILE);
    if (!room.inBounds(tx, ty)) return 0;
    return room.flagsAt(tx, ty, game.tide);
  }

  update(game) {
    this.frame++;
    const f = this.groundFlags(game);

    // SHALLOW LIGHTS IT, DEEP DROWNS IT, and the difference is the item.
    // F.WET is F.WATER|F.DEEP, so testing it alone lit the shell and then
    // doused it on the very next frame in the same puddle — the first cut of
    // this did exactly that and read as "the tide does nothing".
    //
    // It also gives the shell all three tide levels instead of two, which is
    // what makes it belong in this roster: a tidePool is DRY at LOW, SHALLOW at
    // MID and DEEP at HIGH, so the same tile is where you set the shell, where
    // you light it, and where you must not leave it.
    const shallow = (f & F.WATER) && !(f & F.DEEP);
    if (!this.lit && shallow) {
      this.lit = true;
      this.burn = 0;
      game.audio.sfx('fire');
      game.spawnEffect('flame', this.cx - 8, this.cy - 12);
      game.shake(1, 6);
    } else if (this.lit && (f & F.DEEP)) {
      // Slaking is one reaction; drowning is the end of it.
      this.lit = false;
      game.audio.sfx('splash');
      game.spawnEffect('splash', this.cx - 8, this.cy - 8);
    }

    if (!this.lit) return;
    this.burn++;
    // What a flame touches. Grown by half a tile so a shell set down BESIDE a
    // torch lights it, rather than having to be standing in the same tile as
    // one — which, a torch being solid, it cannot be.
    if (this.burn % 4 === 0) {
      const r = this.rect();
      game.checkTileAction({ x: r.x - 8, y: r.y - 8, w: r.w + 16, h: r.h + 16 }, 'fire');
      for (const e of game.entities) {
        if (e === this || e.dead || !e.isEnemy) continue;
        if (this.overlaps(e)) e.hurt(game, KILNSHELL_BURN_DAMAGE, null, 0);
      }
    }
  }

  spriteName() {
    if (!this.lit) return 'o_kilnshell';
    return 'o_kilnshell_lit' + (Math.floor(this.frame / 6) % 2);
  }
}
defineEntity('kilnshell', (x, y, o) => new Kilnshell(x, y, o));

/** The one shell in the world, wherever it is. */
export function placedKilnshell(game) {
  return game.entities.find(e => e instanceof Kilnshell && !e.remove) || null;
}

// --------------------------------------------------------------------------
// Dredge Line
// --------------------------------------------------------------------------

/**
 * Cast into deep water and drag. What comes up depends on what is down there:
 *
 *   * whatever the room buried at that tile — a chest's worth of goods, a key,
 *     a carryable — which is the same `buried` list the shovel used to read,
 *     because the world is water and its floor should be searchable
 *   * an aquatic creature, which is hauled onto the bank and FLOPS there:
 *     helpless, harmless and taking double damage until it works its way back
 *   * a FIXED snag, which does not move — so the line pulls YOU instead, and
 *     that is the crossing verb
 *
 * The difference from a hookshot is what it is aimed at. A hookshot latches
 * onto a post you can see; a Dredge Line is thrown into a volume you cannot,
 * and finds out afterwards.
 */
export class DredgeLine extends Entity {
  constructor(x, y, o = {}) {
    super(x, y, o);
    this.w = 10; this.h = 10;
    this.hb = { x: 2, y: 2, w: 6, h: 6 };
    this.pal = null;
    this.level = o.level || 1;
    this.owner = o.owner;
    this.dir = o.dir || 'down';
    this.originX = this.x; this.originY = this.y;
    this.state = 'cast';
    this.harmless = true;
    this.shadow = false;
    this.flying = true;
    this.z = 5;
    this.depth = 30;
    this.hooked = null;          // an entity being hauled in
    this.range = DREDGE_RANGE * (this.level >= 2 ? 1.5 : 1)
      + (o.coilrope ? COILROPE_RANGE : 0);
    this.path = [];              // tiles the weight passed over, near to far
  }

  get length() { return Math.hypot(this.x - this.originX, this.y - this.originY); }

  update(game) {
    const p = this.owner || game.player;
    const [dx, dy] = DIR_VEC[this.dir];

    if (this.state === 'cast') {
      const nfx = this.fx + dx * DREDGE_CAST_SPEED, nfy = this.fy + dy * DREDGE_CAST_SPEED;
      const tx = Math.floor((toPx(nfx) + 5) / TILE), ty = Math.floor((toPx(nfy) + 5) / TILE);
      if (!game.room || !game.room.inBounds(tx, ty)) { this.dragBack(game); return; }
      const f = game.room.flagsAt(tx, ty, game.tide);

      // A fixed snag: the line holds and the player travels. This is the half
      // that absorbs the hookshot, and it is deliberately declared by a tile
      // rather than found by chance — being yanked somewhere you did not
      // choose is a bug, not a mechanic.
      if (f & F.SNAG) {
        this.state = 'pull';
        this.anchorX = tx * TILE; this.anchorY = ty * TILE;
        game.audio.sfx('hookHit');
        return;
      }
      // The line does not pass through walls, but it is happy in water.
      if (f & (F.SOLID | F.VOID)) {
        if (game.applyTileAction(tx, ty, 'dredge', this.level)) { this.state = 'haul'; return; }
        this.dragBack(game);
        return;
      }
      this.fx = nfx; this.fy = nfy;
      const last = this.path[this.path.length - 1];
      if (!last || last[0] !== tx || last[1] !== ty) this.path.push([tx, ty]);

      // Something to catch, in the water, in front of the weight.
      for (const e of game.entities) {
        if (e.dead || e === this || e === p) continue;
        if (!this.overlaps(e)) continue;
        if (e.isEnemy && !e.harmless) { this.snag(game, e); return; }
        if (e.isDrop || e.liftable) { this.hooked = e; e.attached = this; this.state = 'haul'; return; }
      }

      if (this.length >= this.range) { this.dragBack(game); return; }
      return;
    }

    if (this.state === 'pull') {
      if (!p) { this.remove = true; return; }
      p.hookPulling = true;
      const tdx = this.x - (p.cx - 5), tdy = this.y - (p.cy - 5);
      const d = Math.hypot(tdx, tdy);
      if (d < 6) { this.finish(game, p); return; }
      const before = { fx: p.fx, fy: p.fy };
      moveEntity(game, p, Math.round(tdx / d * DREDGE_PULL_SPEED), Math.round(tdy / d * DREDGE_PULL_SPEED),
        { jumping: true, swim: true });
      if (p.fx === before.fx && p.fy === before.fy) { this.finish(game, p); return; }
      return;
    }

    // haul: come home, dragging whatever is on the line.
    if (!p) { this.remove = true; return; }
    const tdx = (p.cx - 5) - this.x, tdy = (p.cy - 5) - this.y;
    const d = Math.hypot(tdx, tdy) || 1;
    this.fx += Math.round(tdx / d * DREDGE_HAUL_SPEED);
    this.fy += Math.round(tdy / d * DREDGE_HAUL_SPEED);
    if (this.hooked && !this.hooked.remove) {
      this.hooked.x = this.x - 3; this.hooked.y = this.y - 3;
      if (this.hooked.fz !== undefined) this.hooked.fz = 0;
    }
    if (d < 8) this.finish(game, p);
  }

  /** Hook a creature and haul it ashore. */
  snag(game, e) {
    this.hooked = e;
    this.state = 'haul';
    e.dredged = DREDGE_FLOP_FRAMES;
    e.stun = Math.max(e.stun || 0, DREDGE_FLOP_FRAMES);
    e.harmless = true;
    game.audio.sfx('hookHit');
  }

  /**
   * The cast is over; now DRAG. The weight comes back along the tiles it went
   * out over and catches on the first searchable one that is hiding something,
   * far end first — which is what dragging a line is, and it is also why the
   * item is aimed by standing rather than by precision.
   *
   * Water and soft ground are both floor you can search. The second is what
   * absorbs the shovel: `buried` is the shovel's own list, unchanged.
   */
  dragBack(game) {
    this.state = 'haul';
    const room = game.room;
    if (!room) return;
    let found = false;
    for (let i = this.path.length - 1; i >= 0 && !found; i--) {
      const [tx, ty] = this.path[i];
      const f = room.flagsAt(tx, ty, game.tide);
      if (!(f & (F.WET | F.SLOW))) continue;
      if (game.applyTileAction(tx, ty, 'dredge', this.level)) { found = true; break; }
      if (game.dredgeTile(tx, ty, this)) { found = true; break; }
    }
    if (found) return;
    const searched = this.path.some(([tx, ty]) =>
      room.flagsAt(tx, ty, game.tide) & (F.WET | F.SLOW));
    if (searched) {
      game.audio.sfx('splash');
      const [lx, ly] = this.path[this.path.length - 1] || [0, 0];
      game.spawnEffect('splash', lx * TILE, ly * TILE);
    } else {
      game.audio.sfx('deny');
    }
  }

  finish(game, p) {
    this.remove = true;
    if (p) { p.hookPulling = false; p.dredge = null; }
    const h = this.hooked;
    if (!h) return;
    h.attached = null;
    if (h.isEnemy) {
      // Landed. It flops where the line dropped it, on whatever ground that
      // is, and `findSafeTile` keeps it out of scenery.
      game.shoveOffTile(h);
      game.spawnEffect('splash', h.x, h.y);
    }
  }

  draw(ctx, game, ox, oy) {
    const p = this.owner || game.player;
    const sx = p ? p.cx - 4 : this.originX, sy = p ? p.cy - 4 - 2 : this.originY;
    const dx = this.x - sx, dy = this.y - sy;
    const n = Math.max(1, Math.floor(Math.hypot(dx, dy) / 5));
    for (let i = 0; i < n; i++) {
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
// The Tidewright's Anchor
//
// Throw it; it sinks and holds. Every tile within ANCHOR_RADIUS_TILES stays at
// whatever tide level was current when it landed, while the rest of the room
// goes on obeying the conch. Press again — from anywhere — to recall it.
//
// THE OVERRIDE IS THE TRUTH, THE ENTITY IS ITS PICTURE. `spawnRoomEntities`
// wipes every non-player entity on a room change, so a landed anchor's state
// cannot live on the entity. It lives in `game.tide.overrides`, keyed to the
// map and room it was laid in, and Game.setRoom re-spawns the sprite when the
// player comes back. That is also what makes a cancelled room transition safe:
// an anchor still IN FLIGHT is simply dropped with no override registered, so
// walking through a seam mid-throw returns the item rather than leaving a
// frozen patch nobody can see the cause of.
//
// Three verbs, per the design rule in CLAUDE.md:
//   movement  freeze a route open behind you and walk it at the wrong tide
//   puzzles   two tide levels in one room
//   combat    the chain sweeps along its line on both throw and recall
// --------------------------------------------------------------------------

/** The live anchor override, or null. There is at most one. */
export function anchorOverride(game) {
  return game.tide.overrides.find(o => o.src === 'anchor') || null;
}

export class Anchor extends Entity {
  constructor(x, y, o = {}) {
    super(x, y, o);
    this.w = 16; this.h = 16;
    this.hb = { x: 4, y: 4, w: 8, h: 8 };
    this.sprite = 'o_anchor';
    this.harmless = true;
    this.shadow = true;
    this.depth = -2;
    this.state = o.state || 'flight';     // 'flight' | 'held' | 'recall'
    this.overrideId = o.overrideId || null;
    this.settle = 0;
    this.hit = new Set();
    const [dx, dy] = DIR_VEC[o.dir || 'down'];
    this.vx = dx * ANCHOR_THROW_SPEED;
    this.vy = dy * ANCHOR_THROW_SPEED;
    if (this.state === 'flight') {
      this.flying = true;
      this.z = 12;
      this.vz = THROW_ARC_RISE;
    } else {
      this.z = 0; this.vz = 0;
      this.vx = 0; this.vy = 0;
    }
  }

  update(game) {
    this.frame++;
    if (this.state === 'flight') this.updateFlight(game);
    else if (this.state === 'recall') this.updateRecall(game);
    else if (this.settle > 0) this.settle--;
  }

  updateFlight(game) {
    this.fz += this.vz;
    this.vz -= THROW_ARC_GRAVITY;
    const r = moveEntity(game, this, this.vx, this.vy, { jumping: true, swim: true });
    this.sweepChain(game);
    // A wall stops it short; otherwise it flies its arc and bites where it falls.
    if (r.hitX || r.hitY || this.fz <= 0) this.land(game);
  }

  /**
   * Bite. Registers the override at the level current AT THIS TILE, which with
   * one anchor is the base — asking the field rather than the base is what
   * keeps this correct if a second source of overrides ever exists.
   */
  land(game) {
    this.fz = 0; this.vz = 0; this.flying = false;
    const tx = Math.floor(this.cx / TILE), ty = Math.floor(this.cy / TILE);
    const room = game.room;
    if (!room || !room.inBounds(tx, ty)) { this.returnToHand(game); return; }

    const level = game.tide.levelAt(tx, ty, room);
    const id = game.tide.addOverride({
      mapId: game.mapId, roomKey: room.key, tx, ty,
      r: game.anchorRadius != null ? game.anchorRadius : ANCHOR_RADIUS_TILES,
      shape: game.anchorShape || ANCHOR_SHAPE,
      level, src: 'anchor',
    });

    // NEVER STRAND THE PLAYER. The field has just changed under everyone's
    // feet. `reconcileWithTide` can nudge Link out of new water or a new wall,
    // but only if there is somewhere to nudge him to — and findSafeTile now
    // searches the FIELD, so it answers about the world the anchor just made.
    // If there is nowhere, the bite is refused outright rather than drowning
    // him: a tool that can kill you by being used is not a tool.
    const p = game.player;
    if (p && !canOccupy(game, p, p.x, p.y, p.caps) && !findSafeTile(game, p)) {
      game.tide.removeOverride(id);
      this.returnToHand(game);
      game.audio.sfx('deny');
      game.say('There is nowhere to stand if it bites here.');
      return;
    }

    this.state = 'held';
    this.overrideId = id;
    this.settle = ANCHOR_SETTLE_FRAMES;
    this.x = tx * TILE; this.y = ty * TILE;
    game.audio.sfx((game.room.flagsAt(tx, ty, game.tide) & F.WET) ? 'splash' : 'place');
    game.spawnEffect((game.room.flagsAt(tx, ty, game.tide) & F.WET) ? 'splash' : 'dust',
      this.cx - 8, this.cy - 8);
    if (p) p.reconcileWithTide(game);
    game.roomEvent('anchor', { tx, ty, level });
  }

  /** Reel in: remove the override, sweep the chain back, vanish. */
  recall(game) {
    if (this.overrideId != null) game.tide.removeOverride(this.overrideId);
    this.overrideId = null;
    this.state = 'recall';
    this.flying = true;
    this.hit.clear();
    game.audio.sfx('hookshot');
    const p = game.player;
    if (p) p.reconcileWithTide(game);
  }

  updateRecall(game) {
    const p = game.player;
    if (!p) { this.remove = true; return; }
    const dx = p.cx - this.cx, dy = p.cy - this.cy;
    const d = Math.hypot(dx, dy);
    if (d < 8) { this.remove = true; if (p.anchor === this) p.anchor = null; return; }
    this.fx += Math.round(dx / d * ANCHOR_RECALL_SPEED);
    this.fy += Math.round(dy / d * ANCHOR_RECALL_SPEED);
    this.sweepChain(game);
  }

  /**
   * The combat verb: the chain is a line, not a point, so it damages along its
   * whole length rather than only where the head is. Sampled every 6px, and
   * each enemy is hit at most once per throw or recall.
   */
  sweepChain(game) {
    const p = game.player;
    if (!p) return;
    const dx = this.cx - p.cx, dy = this.cy - p.cy;
    const n = Math.max(1, Math.round(Math.hypot(dx, dy) / 6));
    for (const e of game.entities) {
      if (!e.isEnemy || e.dead || e.dormant || e.hidden || this.hit.has(e.id)) continue;
      const r = e.rect();
      for (let i = 0; i <= n; i++) {
        const sx = p.cx + dx * i / n, sy = p.cy + dy * i / n;
        if (sx >= r.x && sx < r.x + r.w && sy >= r.y && sy < r.y + r.h) {
          this.hit.add(e.id);
          e.hurt(game, ANCHOR_CHAIN_DAMAGE, dirFromVec(dx, dy), 2);
          break;
        }
      }
    }
  }

  returnToHand(game) {
    this.remove = true;
    const p = game.player;
    if (p && p.anchor === this) p.anchor = null;
  }

  /** The chain, drawn back to Link whenever he is on the same screen. */
  draw(ctx, game, ox, oy) {
    const p = game.player;
    if (p && this.state !== 'held') {
      const dx = this.cx - p.cx, dy = this.cy - p.cy;
      const n = Math.max(1, Math.round(Math.hypot(dx, dy) / 5));
      for (let i = 1; i < n; i++) {
        sprites.draw(ctx, 'i_chain',
          ox + Math.round(p.cx + dx * i / n) - 4,
          oy + Math.round(p.cy + dy * i / n) - 4 - Math.round(this.z * i / n));
      }
    }
    sprites.draw(ctx, this.sprite, ox + this.x, oy + this.y - this.z);
  }
}
defineEntity('anchor', (x, y, o) => new Anchor(x, y, o));

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
// Exported so tools/check-reefseed.mjs's `plantableTerrain` — which has no
// live `game` to call `Reefseed.canPlant` on — asks for the SAME mask rather
// than keeping its own copy of which tiles a pillar may not stand on.
export const REEFSEED_PLANT_BLOCK = F.VOID | F.SOLID | F.DOOR | F.WARP | F.STAIRS | F.SWITCHF | F.PIT;
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
      if (f & REEFSEED_PLANT_BLOCK) return false;
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
// Ferryman's Coin
// --------------------------------------------------------------------------

/**
 * A coin you throw down and then trade places with — but not when you say so.
 * The swap fires on the NEXT TIDE CHANGE, whichever one that is and whoever
 * caused it.
 *
 * That is the whole design. A teleport you trigger is a convenience; a
 * teleport that fires on the mechanic the game is about is a decision, because
 * the tide is the thing you were already going to change and now it costs
 * something. You choose where the coin goes and when you sound the shell; you
 * do not get to choose them independently.
 *
 * One coin. Recall it with the same button and it comes back to you from
 * anywhere, which is what stops a badly-placed coin being a lost item.
 *
 * The coin's resting place lives in `progress.coin`, not on the entity, so it
 * survives leaving the room — a coin that only worked inside one screen would
 * be a shorter walk, not a teleport.
 */
export class FerrymanCoin extends Entity {
  constructor(x, y, o = {}) {
    super(x, y, o);
    this.w = 16; this.h = 16;
    this.hb = { x: 5, y: 6, w: 6, h: 6 };
    this.sprite = 'i_coin';
    this.pal = null;
    this.harmless = true;
    this.shadow = true;
    this.depth = 4;
    this.settling = o.placed ? 0 : COIN_SETTLE_FRAMES;
    if (!o.placed) {
      const [dx, dy] = DIR_VEC[o.dir || 'down'];
      this.vx = dx * COIN_THROW_SPEED;
      this.vy = dy * COIN_THROW_SPEED;
      this.z = 10;
      this.vz = THROW_ARC_RISE;
    }
  }

  update(game) {
    this.frame++;
    if (this.settling > 0) {
      this.settling--;
      this.fz += this.vz;
      this.vz -= THROW_ARC_GRAVITY;
      const r = moveEntity(game, this, this.vx, this.vy, { jumping: true, swim: true });
      if (r.hitX) this.vx = 0;
      if (r.hitY) this.vy = 0;
      if (this.settling > 0 && this.fz > 0) return;
      this.land(game);
      return;
    }
    if (this.frame % COIN_GLINT_EVERY === 0) {
      game.spawnEffect('sparkle', this.x, this.y - 2, { life: 14, pal: 'gold' });
    }
  }

  land(game) {
    this.settling = 0;
    this.fz = 0; this.vz = 0; this.vx = 0; this.vy = 0;
    // A coin that came to rest somewhere you could not stand would be a swap
    // that drowns you. findSafeTile already knows where the floor is.
    if (!canOccupy(game, game.player, this.x, this.y, { jumping: false, swim: false })) {
      game.shoveOffTile(this);
    }
    game.audio.sfx('rupee');
    const pos = game.progress.pos;
    game.progress.coin = {
      map: game.mapId, floor: game.room ? game.room.floor : 0,
      rx: game.room ? game.room.rx : pos.rx, ry: game.room ? game.room.ry : pos.ry,
      px: this.x, py: this.y,
    };
  }
}
defineEntity('coin', (x, y, o) => new FerrymanCoin(x, y, o));

// --------------------------------------------------------------------------
// Resonance Rod
// --------------------------------------------------------------------------

/**
 * Strike the rod and everything metal or crystal within earshot answers at
 * once: grates retract, submerged bells chime and point, and armoured enemies
 * lock rigid — armour is metal, and metal is what the rod has an opinion
 * about.
 *
 * THE RANGE DEPENDS ON THE TIDE. Water carries a note, so the radius roughly
 * doubles at HIGH. This is the only item in the game whose own power is a
 * function of the mechanic rather than a thing applied to it, which is why it
 * is the trading reward: it sends the player back to rooms they had already
 * decided were finished.
 *
 * It is a room effect, not a projectile. There is nothing to aim, and that is
 * the point — the decision is WHERE TO STAND and WHEN, not where to point.
 */
export function ringResonance(game, p, level) {
  if (p.rodCool > 0) { game.audio.sfx('deny'); return true; }
  p.rodCool = ROD_COOLDOWN_FRAMES;
  p.rodRing = ROD_RING_FRAMES;

  // The level AT LINK'S OWN TILE, not the base level: standing in a Squall
  // Bellows cone or on an anchored disc really does change how far the note
  // goes, which is the two items composing rather than coexisting.
  const ptx = Math.floor(p.cx / TILE), pty = Math.floor(p.cy / TILE);
  const high = game.tide.levelAt(ptx, pty, game.room) >= 2;
  const range = high ? ROD_RANGE_HIGH : ROD_RANGE;
  p.rodRange = range;

  game.audio.sfx('valve');
  game.spawnEffect('shine', p.cx - 8, p.cy - 8, { life: ROD_RING_FRAMES });

  let any = false;
  const room = game.room;
  if (room) {
    const r = Math.ceil(range / TILE);
    for (let ty = pty - r; ty <= pty + r; ty++) {
      for (let tx = ptx - r; tx <= ptx + r; tx++) {
        if (!room.inBounds(tx, ty)) continue;
        if (Math.hypot((tx + 0.5) * TILE - p.cx, (ty + 0.5) * TILE - p.cy) > range) continue;
        if (!(room.flagsAt(tx, ty, game.tide) & F.RING)) continue;
        if (game.applyTileAction(tx, ty, 'ring', level)) any = true;
      }
    }
  }

  for (const e of game.entities) {
    if (e.remove || e.dead) continue;
    if (Math.hypot(e.cx - p.cx, e.cy - p.cy) > range) continue;
    if (e.onRing) { e.onRing(game, p); any = true; continue; }
    // Armoured: a shield is metal, and so is anything that says it is.
    if (!e.isEnemy || (!e.shield && !e.metal)) continue;
    e.rodLock = ROD_LOCK_FRAMES;
    e.stun = Math.max(e.stun || 0, ROD_LOCK_FRAMES);
    game.spawnEffect('spark', e.cx - 8, e.cy - 8);
    any = true;
  }

  if (!any) game.audio.sfx('block');
  return true;
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
  bellows: {
    names: ['Squall Bellows'],
    icon: ['i_bellows'],
    equippable: true,
    hold: true,
    desc: 'Hold to blow. The water ahead of you falls a level while you pump.',
    use(game, p, level) { p.bellowsHeld = true; return true; },
  },
  bottle: {
    names: ['Bottled Tide'],
    icon: ['i_bottle'],
    equippable: true, counted: 'bottles',
    desc: 'A measure of sea. It moves water the conch cannot reach.',
    /**
     * One tide step in a room where the conch is suppressed.
     *
     * The point is boss rooms. Today a boss room switches the mechanic off
     * wholesale, because a boss trivialised by a tide change is a bad boss.
     * With this, a boss room can KEEP the mechanic and price it: one step, one
     * bottle, and you brought however many bottles you brought.
     *
     * It deliberately refuses to work where the conch already works. A second
     * conch that costs a consumable is not an item, it is a tax.
     */
    use(game, p, level) {
      const pr = game.progress;
      if (pr.bottles <= 0) { game.audio.sfx('deny'); return true; }
      const why = game.tide.blockedReason();
      if (why === 'busy') return true;
      if (!why) {
        game.audio.sfx('deny');
        game.say('The water here already answers the conch.');
        return true;
      }
      addBottles(pr, -1);
      p.frozen = BOTTLE_POUR_FRAMES;
      p.conchTime = BOTTLE_POUR_FRAMES;
      game.audio.sfx('conch');
      game.spawnEffect('splash', p.cx - 8, p.cy - 8);
      game.forceTideStep();
      return true;
    },
  },
  coin: {
    names: ["Ferryman's Coin"],
    icon: ['i_coin'],
    equippable: true,
    desc: 'Throw it down. The next turn of the tide trades your places.',
    use(game, p, level) {
      const pr = game.progress;
      if (pr.coin) {
        // Recall. It comes back from wherever it is, so a bad throw costs a
        // tide change and never the item.
        pr.coin = null;
        for (const e of game.entities) if (e instanceof FerrymanCoin) e.remove = true;
        game.audio.sfx('catch');
        game.say('The coin comes back to your hand.');
        return true;
      }
      if (p.inDeep || p.underwater) { game.audio.sfx('deny'); return true; }
      const [dx, dy] = DIR_VEC[p.dir];
      game.addEntity(new FerrymanCoin(p.cx - 8 + dx * 6, p.cy - 8 + dy * 6, { dir: p.dir }));
      game.audio.sfx('throw');
      return true;
    },
  },
  rod: {
    names: ['Resonance Rod'],
    icon: ['i_rod'],
    equippable: true,
    desc: 'Strike it. Every metal and crystal thing in earshot answers.',
    use(game, p, level) { return ringResonance(game, p, level); },
  },
  dredge: {
    names: ['Dredge Line', 'Deepline'],
    icon: ['i_dredge'],
    equippable: true,
    desc: 'Cast it into deep water and drag. The seafloor keeps things.',
    use(game, p, level) {
      if (p.dredge && !p.dredge.remove) return true;
      // BRACE FIRST. A weighted line is thrown from your heels, and a body
      // floating in the water — or walking the floor of it in the Cleats — has
      // nothing to throw against. The Squall Bellows and the Reefseed already
      // refuse on exactly these grounds, and this is the guard that gives the
      // Dredge Line a geometry at all: without it the answer to every mooring
      // in the Abyssal Keep is to swim out to the middle of the shaft and cast
      // from there, and no arrangement of ground can be made to matter.
      if (p.inDeep || p.underwater) { game.audio.sfx('deny'); return true; }
      const d = new DredgeLine(p.cx - 5, p.cy - 5,
        { dir: p.dir, level, owner: p, coilrope: game.charm('coilrope') });
      p.dredge = d;
      game.addEntity(d);
      game.audio.sfx('dredgeCast');
      return true;
    },
  },
  reefseed: {
    names: ['Reefseed'],
    icon: ['i_reefseed'],
    equippable: true, counted: 'reefseeds',
    desc: 'Throw it. Two seconds later a coral pillar grows where it fell.',
    use(game, p, level) {
      if (game.progress.reefseeds <= 0) { game.audio.sfx('deny'); return true; }
      if (p.carrying) return false;
      // BOTH FEET DOWN. A stake is driven, not dropped, and you cannot drive
      // one while the sea has you — treading water or walking the floor of it.
      // The Squall Bellows already refuse on the same grounds, and without this
      // the Reefseed's whole geometry evaporates: throwing range stops meaning
      // anything the moment a swimmer can paddle to the middle of a trench and
      // plant from there, and every stake room in the Drowned Wood Shrine is
      // answered by swimming out to the tile and dropping a seed on it.
      if (p.inDeep || p.underwater) { game.audio.sfx('deny'); return true; }
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
  cleats: {
    names: ['Kelp-Soled Cleats', 'Mermaid Suit'],
    icon: ['i_cleats', 'i_cleats2'],
    equippable: true,
    desc: 'Swim the surface, or press to sink and walk the floor beneath it.',
    use(game, p, level) { return p.toggleCleats(game); },
  },
  kilnshell: {
    names: ['Kilnshell'],
    icon: ['i_kilnshell'],
    equippable: true,
    desc: 'Set it down. The sea lights it, and the sea puts it out.',
    use(game, p, level) {
      // Being carried: the throw button already owns it, and a second verb on
      // a held object is how you get a player who cannot put a thing down.
      if (p.carrying instanceof Kilnshell) return false;
      const placed = placedKilnshell(game);
      if (placed) {
        // Take it back, from anywhere in the world — the same courtesy the
        // Anchor gets, and for the same reason: nothing the player can set
        // down may be able to strand them by being somewhere else.
        placed.remove = true;
        game.audio.sfx('place');
        return true;
      }
      // Set it on the tile the player is facing, so it can be put against a
      // torch or into a pool without standing in either.
      const [dx, dy] = DIR_VEC[p.dir] || [0, 1];
      const tx = Math.floor(p.cx / TILE) + dx, ty = Math.floor(p.cy / TILE) + dy;
      const room = game.room;
      const ok = room && room.inBounds(tx, ty);
      const x = ok ? tx * TILE : Math.round(p.x);
      const y = ok ? ty * TILE : Math.round(p.y);
      game.addEntity(new Kilnshell(x, y));
      game.audio.sfx('place');
      return true;
    },
  },
  anchor: {
    names: ["Tidewright's Anchor"],
    icon: ['i_anchor'],
    equippable: true,
    desc: 'Throw it to hold the tide where it lands. Press again to recall it.',
    use(game, p, level) {
      // In flight: the throw is already committed, and a second press must not
      // spawn a second anchor.
      if (p.anchor && !p.anchor.remove && p.anchor.state === 'flight') return true;

      // Placed — anywhere in the world, not just this room. Recall is always
      // available, which is what makes the item safe: nothing it does to a room
      // can be permanent, so nothing it does can lock you out of one.
      const held = anchorOverride(game);
      if (held) {
        if (p.anchor && !p.anchor.remove && p.anchor.state === 'held') {
          p.anchor.recall(game);
        } else {
          // Held in a room we are not standing in. It simply comes back.
          game.tide.removeOverride(held.id);
          game.audio.sfx('hookshot');
          p.reconcileWithTide(game);
        }
        return true;
      }

      const a = new Anchor(p.cx - 8, p.cy - 8, { dir: p.dir });
      p.anchor = a;
      game.addEntity(a);
      game.audio.sfx('throw');
      return true;
    },
  },
  // The Ring Box is gone. P7 replaces rings with scrimshaw wholesale, so the
  // box that held them has nothing to hold; src/game/rings.js and the menu's
  // ring tab are still standing and are P7's to remove, because deleting the
  // system out from under the save format is that session's job, not this one's.
  map: { names: ['Dungeon Map'], icon: ['i_map'], passive: true, desc: 'Reveals the dungeon layout.' },
  // The Chartstone is one verb — information — and the three-verb rule does
  // not apply to it. The rule is for TOOLS, things bound to a button that the
  // player composes with something else. This sits beside the Dungeon Map, is
  // never equipped, and is read rather than used. docs/ITEMS.md says so out
  // loud rather than pretending otherwise.
  chartstone: {
    names: ['Chartstone'],
    icon: ['i_chart'],
    passive: true,
    desc: 'Marks which rooms the tide changes, and at which level.',
  },
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
