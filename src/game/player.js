// Link. All player state lives here: movement, sword, shield, jumping, swimming,
// carrying, damage and the tide interaction.
//
// SPRITE NAMING CONTRACT (art data must provide these names):
//   link_walk_down_0/1     link_walk_up_0/1     link_walk_side_0/1   (side faces RIGHT)
//   link_sword_down        link_sword_up        link_sword_side
//   link_swim_down_0/1     link_swim_up_0/1     link_swim_side_0/1
//   link_carry_down        link_carry_up        link_carry_side
//   link_push_down         link_push_up         link_push_side
//   link_hurt              link_fall_0/1/2      link_dig_0/1
//   link_dive              link_spin_0/1/2/3
//   link_hold_down/up/side (blade held out, walking with it)
//   fx_slash_down/up/side  (the sword arc, drawn separately from Link)

import {
  Entity, moveEntity, canOccupy, groundFlags, groundTile, findSafeTile, DIR_VEC, DIRS,
} from './entity.js';
import { F, transformFor } from '../world/tileset.js';
import { TILE, VIEW_W, VIEW_H } from '../core/screen.js';
import { sp, toPx } from '../core/fixed.js';
import { sprites } from '../gfx/art.js';
import { hasItem, itemLevel, HEART_UNITS } from './progress.js';
import { useEquipped, ITEMS, ThrownObject } from './items.js';
import {
  WALK_SPEED, SWIM_SPEED, BOOST_SPEED, SHIELD_SPEED, SLOW_FACTOR,
  SHALLOW_FACTOR, CARRY_FACTOR, SPIN_DRIFT_SPEED, SWORD_HOLD_SPEED,
  SWING_FRAMES, SWING_HIT_START, SWING_HIT_END, CHARGE_FRAMES, CHARGE_SPARKLE_EVERY,
  SPIN_FRAMES, SWORD_REACH, SWORD_SPAN, SWORD_GAP, SPIN_BOX,
  SWORD_HOLD_DELAY, SWORD_HOLD_DAMAGE, SWORD_CLINK_COOLDOWN, KNOCK_HOLD,
  PLAYER_INVULN_FRAMES, PLAYER_FLICKER_FRAMES, PLAYER_RECOVER_INVULN_FRAMES,
  PLAYER_HURT_FRAMES, PLAYER_KNOCK_DIST, PLAYER_KNOCK_FRAMES,
  KNOCK_SWORD, KNOCK_SPIN, HAZARD_DAMAGE, PIT_DAMAGE, WASH_DAMAGE,
  JUMP_GRAVITY, GLIDE_GRAVITY, LAND_SETTLE_RATE,
  LEDGE_MAX_SPAN, LEDGE_HOP_FRAMES, LEDGE_HOP_HEIGHT, LEDGE_PROBE_REACH,
  FALL_FRAMES, WASH_FRAMES, DIG_FRAMES, CONCH_FRAMES, PUSH_DELAY_FRAMES,
  LENS_FADE_FRAMES,
  SINK_SPEED, SINK_ENTER_FRAMES, CLEATS_BREATH_FRAMES,
  CLEATS_BREATH_WARN_FRAMES, SINK_BUBBLE_EVERY, SINK_DROWN_DAMAGE,
  CONTEXT_REACH, LIFT_REACH, THROW_SPEED, CARRY_HEIGHT,
  SHAKE_SMALL, SHAKE_SMALL_FRAMES, CHARGE_SPARKLE_SPREAD, WADE_FOAM_EVERY,
  PUSH_PROBE_REACH,
} from '../data/feel.js';

export class Player extends Entity {
  constructor(x, y) {
    super(x, y);
    this.w = 16; this.h = 16;
    // Feet-centred hitbox: Link's head overlaps walls in the GBC games.
    this.hb = { x: 3, y: 8, w: 10, h: 7 };
    this.dir = 'down';
    this.harmless = true;
    this.depth = 0;

    this.swinging = 0;
    this.charge = 0;
    this.spinning = 0;
    this.holding = false;         // blade out, walking with it
    this.holdT = 0;               // frames spent in the hold
    this.clinkCool = 0;           // sfx debounce for the blade scraping a wall
    this.shielding = false;
    this.jumping = false;
    this.digging = 0;
    this.carrying = null;
    this.inDeep = false;
    this.inShallow = false;
    this.cleatMode = 'swim';      // 'swim' on the surface, 'sink' on the floor
    this.sinkT = 0;               // descent/ascent, counts down; control is off
    this.breath = 0;              // frames of air left on the seafloor
    this.underwater = false;      // walking the floor right now
    this.speedBoost = 0;
    this.hurtTime = 0;
    this.falling = 0;
    this.washing = 0;
    this.conchTime = 0;
    this.magnet = 1;
    this.hookshot = null;
    this.boomerang = null;
    this.hookPulling = false;
    this.lensHeld = false;        // set per-frame by the held-item hook
    this.lensT = 0;               // 0..LENS_FADE_FRAMES, the overlay's fade
    this.invincible = false;      // debug / cutscene
    this.frozen = 0;              // cutscene lock
    this.animT = 0;
    this.caps = { jumping: false, swim: false, cutting: false };
    this.ledgeHop = null;         // in-progress one-way ledge hop
    this.lastSafe = { x, y };
  }

  /** Level of the Cleats, or 0. The one thing that lets Link into deep water. */
  get waterLevel() { return this._cleats; }

  syncCaps(game) {
    const p = game.progress;
    this._cleats = itemLevel(p, 'cleats');
    this.caps.jumping = this.z > 2;
    // Both Cleat modes get you across DEEP; they differ in what it costs. The
    // solidity query does not care which, so one cap covers both.
    this.caps.swim = this._cleats > 0;
    this.caps.sink = this.underwater;
    this.caps.cutting = false;
  }

  // ------------------------------------------------------------------ update

  update(game) {
    const p = game.progress;
    this.frame++;
    this.syncCaps(game);

    if (this.invuln > 0) this.invuln--;
    if (this.flicker > 0) this.flicker--;
    if (this.speedBoost > 0) this.speedBoost--;
    if (this.conchTime > 0) this.conchTime--;
    if (this.clinkCool > 0) this.clinkCool--;

    if (this.falling > 0) { this.updateFalling(game); return; }
    if (this.washing > 0) { this.updateWashing(game); return; }
    if (this.sinkT > 0) { this.updateSinkTransition(game); return; }
    if (this.frozen > 0) { this.frozen--; this.animT++; return; }

    // Being reeled in by the hookshot suspends normal control.
    if (this.hookPulling) { this.animT++; return; }

    if (this.hurtTime > 0) {
      this.hurtTime--;
      // Fixed distance, fixed frames, constant speed — the same shape as enemy
      // knockback, so where a hit puts you is something you can learn. The step
      // is whole subpixels and never changes, so nothing rounds on the way.
      if (this.knockTime > 0) {
        this.knockTime--;
        moveEntity(game, this, this.knockX, this.knockY);
      }
      return;
    }

    this.updateTerrain(game);

    if (this.digging > 0) { this.digging--; return; }

    if (this.spinning > 0) { this.updateSpin(game); return; }
    if (this.swinging > 0) { this.updateSwing(game); }

    this.handleInput(game);
    this.updateSwordHold(game);
    this.updateLens(game);
    this.updateBreath(game);
    this.updateMovement(game);
    this.updateJump(game);
    this.updateContactDamage(game);
    this.updateHazards(game);

    if (this.carrying) {
      this.carrying.x = this.x;
      this.carrying.y = this.y - CARRY_HEIGHT;
    }
  }

  // --------------------------------------------------------------- terrain

  updateTerrain(game) {
    // Mid-hop the player is over the drop, not in it — the arc dips below z=2
    // at both ends, and water under a ledge would otherwise wash them out.
    if (this.ledgeHop) return;
    const f = groundFlags(game, this);
    const wasDeep = this.inDeep;
    this.inShallow = !!(f & F.WATER) && this.z <= 2;
    this.inDeep = !!(f & F.DEEP) && this.z <= 2;

    if (this.inDeep && this._cleats <= 0) {
      // Should be unreachable via walking, but a rising tide can strand us.
      this.beginWash(game);
      return;
    }
    if (this.inDeep && !wasDeep) {
      game.audio.sfx('splash');
      game.spawnEffect('splash', this.x, this.y + 2);
      // On the surface a load goes overboard. On the floor it does not: the
      // whole reason to walk down there is that you can take things with you.
      if (this.carrying && !this.underwater) this.dropCarried(game);
    }
    if (!this.inDeep && wasDeep) {
      game.spawnEffect('splash', this.x, this.y + 2);
    }
    if (this.inShallow && this.frame % WADE_FOAM_EVERY === 0) {
      game.spawnEffect('foam', this.x, this.y + 4, { life: 16 });
    }
    // Remember the last dry, safe spot so a tide change can wash us back to it.
    if (!this.inDeep && !(f & (F.PIT | F.HAZARD))) {
      this.lastSafe.x = this.x; this.lastSafe.y = this.y;
    }
    // Water currents push you while swimming. They do NOT push a walker on the
    // floor: weighted soles are what the Cleats are, and immunity to the
    // current is the whole trade sink mode offers for its pace.
    if (this.inDeep && !this.underwater) {
      const { tx, ty } = groundTile(game, this);
      const def = game.room.tile(tx, ty, game.tide.level);
      // A tile's `push` is data, written in px/f; the mover speaks subpixels.
      if (def.push) moveEntity(game, this, sp(def.push[0]), sp(def.push[1]));
    }
  }

  updateHazards(game) {
    const f = groundFlags(game, this);
    if (this.z > 2 || this.jumping) return;
    if (f & F.PIT) { this.beginFall(game); return; }
    if (f & F.HAZARD) this.takeDamage(game, HAZARD_DAMAGE, null, { noKnockDir: true });
    if (f & F.WHIRL) game.enterWhirlpool(this);
  }

  // ----------------------------------------------------------------- input

  handleInput(game) {
    const i = game.input;
    this.shielding = false;
    this.lensHeld = false;

    // A: context action first (talk, read, open, grab), then the A item.
    if (i.pressed('a')) {
      if (!this.tryContextAction(game)) useEquipped(game, this, 'A');
    }
    if (i.pressed('b')) {
      useEquipped(game, this, 'B');
    }
    // HELD ITEMS. An item declaring `hold` has its `use` called on EVERY frame
    // its button is down, so `use` must be idempotent and must set state rather
    // than start something. The shield had its own branch here for a long time;
    // the Brineglass Lens is the second held item and there will be more, so
    // the branch became the rule. The per-frame flags are cleared above, which
    // is what makes "held" mean held rather than latched.
    for (const slot of ['A', 'B']) {
      const id = slot === 'A' ? game.progress.equipA : game.progress.equipB;
      const def = id ? ITEMS[id] : null;
      if (!def || !def.hold || !def.use) continue;
      if (!i.down(slot.toLowerCase())) continue;
      if (itemLevel(game.progress, id) <= 0) continue;
      def.use(game, this, itemLevel(game.progress, id));
    }
    // Sword hold: keeping the button down after the swing keeps the blade out
    // (see updateSwordHold) and, past a threshold, charges a spin.
    const slot = this.swordSlot(game);
    if (slot && hasItem(game.progress, 'sword') && !this.inDeep) {
      if (i.down(slot) && this.swinging === 0) {
        this.charge++;
        if (this.charge === CHARGE_FRAMES) game.audio.sfx('charged');
        if (this.charge > CHARGE_FRAMES && this.charge % CHARGE_SPARKLE_EVERY === 0) {
          const s = CHARGE_SPARKLE_SPREAD / 2;
          game.spawnEffect('sparkle',
            this.x + game.rng.range(-s, s), this.y + game.rng.range(-s, s), { life: 12 });
        }
      } else if (i.released(slot)) {
        if (this.charge >= CHARGE_FRAMES) this.startSpin(game);
        this.charge = 0;
      }
    } else {
      this.charge = 0;
    }
  }

  // ------------------------------------------------------------ the Lens
  //
  // The Brineglass Lens is held, not pressed, and it is the only item in the
  // game that changes nothing about the world — it changes what is DRAWN and
  // what is hittable. That is deliberate: docs/ITEMS.md and P9's brief both say
  // the Lens is never a gate, so it must not be able to move anything.
  //
  // All this does is ramp a 0..1 fade. `Game.drawLensGhost` reads it for the
  // overlay and `Game.updatePhaseShift` reads it to decide whether the enemies
  // that live at the other tide level can be hit.

  updateLens(game) {
    // The overlay would be meaningless mid-sweep: the room is already showing
    // two tide levels at once while the wave front crosses.
    const on = this.lensHeld && !game.tide.busy && this.washing === 0 && this.falling === 0;
    this.lensT = Math.max(0, Math.min(LENS_FADE_FRAMES, this.lensT + (on ? 1 : -1)));
  }

  /** 0..1 — how far up the Lens is. */
  get lensAmount() { return this.lensT / LENS_FADE_FRAMES; }

  /** Talk to NPCs, read signs, open chests, grab blocks. */
  tryContextAction(game) {
    const [dx, dy] = DIR_VEC[this.dir];
    const px = this.cx + dx * CONTEXT_REACH, py = this.cy + dy * CONTEXT_REACH;
    // entities first
    for (const e of game.entities) {
      if (e.interact && !e.dead) {
        const r = e.rect();
        if (px >= r.x - 4 && px <= r.x + r.w + 4 && py >= r.y - 4 && py <= r.y + r.h + 4) {
          e.interact(game, this);
          return true;
        }
      }
    }
    // then tiles (signs, readable objects, doors needing keys)
    const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
    if (game.tileInteract(tx, ty, this)) return true;
    return false;
  }

  // -------------------------------------------------------------- movement

  updateMovement(game) {
    const i = game.input;
    let dx = 0, dy = 0;
    if (i.down('left')) dx -= 1;
    if (i.down('right')) dx += 1;
    if (i.down('up')) dy -= 1;
    if (i.down('down')) dy += 1;

    // Attacking roots you in place, as in the GBC games.
    if (this.swinging > 0) { this.animT++; return; }

    if (dx || dy) {
      if (!(this.jumping && this.lockDir)) {
        // Face the newly pressed axis so turning is responsive.
        if (dy && !this._lastDy) this.dir = dy < 0 ? 'up' : 'down';
        else if (dx && !this._lastDx) this.dir = dx < 0 ? 'left' : 'right';
        else if (dx && !dy) this.dir = dx < 0 ? 'left' : 'right';
        else if (dy && !dx) this.dir = dy < 0 ? 'up' : 'down';
      }
    }
    this._lastDx = dx; this._lastDy = dy;

    // Speeds are subpixels per frame. The terrain multipliers are
    // dimensionless, so their product has to land back on a whole subpixel
    // before it reaches the mover — and never on zero, or slow ground would be
    // a wall.
    let speed = this.speedBoost > 0 ? BOOST_SPEED : WALK_SPEED;
    if (this.underwater) speed = SINK_SPEED;
    else if (this.inDeep) speed = SWIM_SPEED;
    else if (this.shielding) speed = SHIELD_SPEED;
    else if (this.holding) speed = SWORD_HOLD_SPEED;
    const f = groundFlags(game, this);
    let mult = 1;
    if ((f & F.SLOW) && this.z <= 2) mult *= SLOW_FACTOR;
    if (this.inShallow && this.z <= 2) mult *= SHALLOW_FACTOR;
    if (this.carrying) mult *= CARRY_FACTOR;
    if (mult !== 1) speed = Math.max(1, Math.round(speed * mult));

    // DIAGONALS ARE NOT NORMALISED. `dx` and `dy` stay at ±1 and both axes get
    // the full step, so holding two directions moves sqrt(2) times as far as
    // holding one. That is deliberate and it is a signature of the source
    // games; see docs/FEEL-SPEC.md.

    // A hop in progress owns the controls until it lands.
    if (this.ledgeHop) { this.updateLedgeHop(game); this.animT++; return; }
    if ((dx || dy) && this.tryLedgeHop(game, dx, dy)) { this.animT++; return; }

    if (dx || dy) {
      const res = moveEntity(game, this, dx * speed, dy * speed);
      this.animT++;
      // Pushing against a wall: show the push pose and try to shove blocks.
      this.pushing = (res.hitX && dx !== 0) || (res.hitY && dy !== 0);
      if (this.pushing) this.tryPush(game, dx, dy);
    } else {
      this.pushing = false;
      if (this.inDeep) this.animT++;      // treading water keeps animating
    }
  }

  // ------------------------------------------------------------ one-way ledge
  //
  // `F.LEDGE` and a tile's `ledge` direction have existed in the tileset since
  // the world was built, and nothing under src/game ever read either — the tile
  // was a decorative floor. A ledge is one-way in two halves, and both are
  // needed for it to mean anything:
  //
  //   * walking into its face from the uphill side launches a hop that carries
  //     you clear of it (here), and
  //   * the tile is solid from every other side (room.solidAt), so you cannot
  //     walk back up or stroll along the lip.
  //
  // The hop refuses to start unless the landing tile is standable, because a
  // ledge that drops you into a wall is worse than one that does not fire.

  /** Start a hop if the player is walking into the face of a ledge. */
  tryLedgeHop(game, dx, dy) {
    if (this.jumping || this.z > 0 || this.inDeep || this.carrying) return false;
    const room = game.room;
    if (!room) return false;
    // A diagonal press picks its dominant axis: a ledge only faces a cardinal.
    let ux = 0, uy = 0;
    if (Math.abs(dx) > Math.abs(dy)) ux = Math.sign(dx);
    else if (Math.abs(dy) > 0) uy = Math.sign(dy);
    if (!ux && !uy) return false;
    const facing = ux ? (ux < 0 ? 'left' : 'right') : (uy < 0 ? 'up' : 'down');

    const tx = Math.floor((this.cx + ux * LEDGE_PROBE_REACH) / TILE);
    const ty = Math.floor((this.cy + uy * LEDGE_PROBE_REACH) / TILE);
    const def = this.tileDefAt(game, tx, ty);
    if (!def || !(def.flags & F.LEDGE) || def.ledge !== facing) return false;

    // Clear the lip and everything else flagged as ledge behind it, then land.
    let n = 1;
    while (n < LEDGE_MAX_SPAN) {
      const d = this.tileDefAt(game, tx + ux * n, ty + uy * n);
      if (!d || !(d.flags & F.LEDGE)) break;
      n++;
    }
    // Land squared onto the tile past the drop on the hop axis only; the other
    // axis keeps whatever the player had, so the hop does not slide sideways.
    const land = {
      x: ux ? (tx + ux * n) * TILE : this.x,
      y: uy ? (ty + uy * n) * TILE : this.y,
    };
    if (!canOccupy(game, this, land.x, land.y, { jumping: false, swim: this._cleats > 0, cutting: false })) {
      return false;
    }

    this.ledgeHop = {
      fromFx: this.fx, fromFy: this.fy,
      toFx: sp(land.x), toFy: sp(land.y),
      t: 0, n: LEDGE_HOP_FRAMES,
    };
    this.jumping = true;
    this.vz = 0;
    this.gliding = false;
    this.lockDir = true;
    this.dir = facing;
    game.audio.sfx('jump');
    return true;
  }

  /**
   * Carry the hop along its arc; `z` is set outright, not integrated.
   * The interpolation runs in subpixels and rounds once per frame, so the hop
   * lands on the exact tile it aimed at rather than a rounded-off neighbour.
   */
  updateLedgeHop(game) {
    const h = this.ledgeHop;
    h.t++;
    const u = Math.min(1, h.t / h.n);
    this.fx = h.fromFx + Math.round((h.toFx - h.fromFx) * u);
    this.fy = h.fromFy + Math.round((h.toFy - h.fromFy) * u);
    this.fz = Math.round(sp(LEDGE_HOP_HEIGHT) * Math.sin(u * Math.PI));
    if (u < 1) return;
    this.ledgeHop = null;
    this.fz = 0; this.vz = 0; this.jumping = false; this.lockDir = false;
    const f = groundFlags(game, this);
    if ((f & F.DEEP) && this._cleats <= 0) { this.beginWash(game); return; }
    if (f & F.PIT) { this.beginFall(game); return; }
    game.audio.sfx('land');
    game.spawnEffect((f & F.WET) ? 'splash' : 'dust', this.x, this.y + 4, { life: 12 });
  }

  tileDefAt(game, tx, ty) {
    if (tx < 0 || ty < 0 || tx * TILE >= VIEW_W || ty * TILE >= VIEW_H) return null;
    return game.room.tile(tx, ty, game.tide.level);
  }

  tryPush(game, dx, dy) {
    // Shoving a block along the floor of the sea is Cleats L2 — the Mermaid
    // Suit. At L1 you can stand next to it down there and get nowhere.
    if (this.underwater && this._cleats < 2) return;
    this._pushT = (this._pushT || 0) + 1;
    if (this._pushT < PUSH_DELAY_FRAMES) return;
    const [ux, uy] = [Math.sign(dx), Math.sign(dy)];
    const tx = Math.floor((this.cx + ux * PUSH_PROBE_REACH) / TILE);
    const ty = Math.floor((this.cy + uy * PUSH_PROBE_REACH) / TILE);
    if (game.tryPushBlock(tx, ty, ux, uy)) this._pushT = 0;
  }

  // ----------------------------------------------------------------- sword

  /** Which button the sword is bound to, or null if it is not equipped. */
  swordSlot(game) {
    if (game.progress.equipB === 'sword') return 'b';
    if (game.progress.equipA === 'sword') return 'a';
    return null;
  }

  // ------------------------------------------------------------- sword hold
  //
  // In the Oracles the sword is three verbs, not one. Tapping swings. Holding
  // charges a spin. And holding ALSO keeps the blade extended in front of you
  // and lets you walk with it out: it damages what it touches, it clinks off
  // walls, and Link is drawn in a different pose the whole time.
  //
  // The engine had the first two. Without the third, the most-used button in
  // the game does a third less than it should — you cannot shave a bush by
  // walking through it, you cannot hold a corridor against something walking
  // into you, and the long hold reads as a dead wait for the spin rather than
  // as a stance you are already fighting in.
  //
  // The contact damage is not rate-limited here. It does not need to be: the
  // enemy's own invulnerability window after a hit is what spaces the hits out,
  // which is exactly how the source games space them.

  updateSwordHold(game) {
    const slot = this.swordSlot(game);
    const out = !!slot && hasItem(game.progress, 'sword') && game.input.down(slot)
      && this.swinging === 0 && this.spinning === 0
      && !this.inDeep && !this.carrying && !this.hookPulling
      && this.charge >= SWORD_HOLD_DELAY;
    if (!out) { this.holding = false; this.holdT = 0; return; }

    this.holding = true;
    this.holdT++;

    const box = this.swordBox();
    for (const e of game.entities) {
      if (!e.isEnemy || e.dead || e.dormant || e.hidden) continue;
      if (!rectOverlap(box, e.rect())) continue;
      e.hurt(game, SWORD_HOLD_DAMAGE, this.dir, KNOCK_HOLD);
    }
    // Walking a held blade through undergrowth cuts it, as it does in Seasons.
    game.checkTileAction(box, 'cut');
    this.checkSwordClink(game);
  }

  /** The blade tip scraping something solid: a clink, a spark, no damage. */
  checkSwordClink(game) {
    if (this.clinkCool > 0 || !game.room || !game.input.anyDir()) return;
    const [dx, dy] = DIR_VEC[this.dir];
    const tx = this.cx + dx * (SWORD_REACH + SWORD_GAP);
    const ty = this.cy + dy * (SWORD_REACH + SWORD_GAP);
    if (tx < 0 || ty < 0 || tx >= VIEW_W || ty >= VIEW_H) return;
    if (!game.room.solidAt(tx, ty, game.tide.level, { jumping: false, swim: false })) return;
    this.clinkCool = SWORD_CLINK_COOLDOWN;
    game.audio.sfx('block');
    game.spawnEffect('spark', tx - 8, ty - 8);
  }

  startSwing(game, level) {
    if (this.swinging > 0 || this.spinning > 0 || this.inDeep || this.carrying) return true;
    this.swinging = SWING_FRAMES;
    this.holding = false;
    this.holdT = 0;
    this.swordLevel = level;
    this.swingHit = new Set();
    game.audio.sfx(level >= 3 ? 'sword3' : (level >= 2 ? 'sword2' : 'sword1'));
    game.spawnEffect('slashD', this.x, this.y);   // replaced per-direction below
    return true;
  }

  updateSwing(game) {
    this.swinging--;
    const t = SWING_FRAMES - this.swinging;
    if (t < SWING_HIT_START || t > SWING_HIT_END) return;
    const box = this.swordBox();
    // enemies
    for (const e of game.entities) {
      if (!e.isEnemy || e.dead || this.swingHit.has(e.id)) continue;
      if (rectOverlap(box, e.rect())) {
        this.swingHit.add(e.id);
        e.hurt(game, swordDamage(this.swordLevel), this.dir, KNOCK_SWORD);
      }
    }
    // tiles (bushes, signs)
    game.checkTileAction(box, 'cut');
  }

  swordBox() {
    const [dx, dy] = DIR_VEC[this.dir];
    const reach = SWORD_REACH;
    const w = dx !== 0 ? reach : SWORD_SPAN;
    const h = dy !== 0 ? reach : SWORD_SPAN;
    return {
      x: this.cx - w / 2 + dx * (reach / 2 + SWORD_GAP),
      y: this.cy - h / 2 + dy * (reach / 2 + SWORD_GAP),
      w, h,
    };
  }

  startSpin(game) {
    if (this.inDeep) return;
    this.spinning = SPIN_FRAMES;
    this.spinHit = new Set();
    this.swinging = 0;
    this.holding = false;
    this.holdT = 0;
    game.audio.sfx('spin');
  }

  updateSpin(game) {
    this.spinning--;
    this.animT++;
    // Spin drifts you slightly in the facing direction.
    const [dx, dy] = DIR_VEC[this.dir];
    moveEntity(game, this, dx * SPIN_DRIFT_SPEED, dy * SPIN_DRIFT_SPEED);
    const box = { x: this.cx - SPIN_BOX / 2, y: this.cy - SPIN_BOX / 2, w: SPIN_BOX, h: SPIN_BOX };
    for (const e of game.entities) {
      if (!e.isEnemy || e.dead || this.spinHit.has(e.id)) continue;
      if (rectOverlap(box, e.rect())) {
        this.spinHit.add(e.id);
        e.hurt(game, swordDamage(this.swordLevel || 1) + 1, this.dir, KNOCK_SPIN);
      }
    }
    game.checkTileAction(box, 'cut');
  }

  // ------------------------------------------------------------------ jump

  startJump(game, power, gliding) {
    if (this.jumping || this.inDeep || this.z > 0) return true;
    this.jumping = true;
    this.vz = power;
    this.gliding = !!gliding;
    this.lockDir = false;
    game.audio.sfx('jump');
    return true;
  }

  updateJump(game) {
    // A ledge hop drives z along a scripted arc; the ballistic integrator here
    // would pull it straight back to the ground on the first frame.
    if (this.ledgeHop) return;
    if (!this.jumping) {
      if (this.fz > 0) { this.fz = Math.max(0, this.fz - LAND_SETTLE_RATE); }
      return;
    }
    // Height integrates on the same subpixel grid as x and y: `vz` is sp/f and
    // gravity is sp/f^2, so a jump arc is exactly reproducible.
    this.fz += this.vz;
    // Roc's Cape hangs in the air a moment longer.
    this.vz -= (this.gliding && this.vz < 0 && game.input.down(game.progress.equipB === 'feather' ? 'b' : 'a'))
      ? GLIDE_GRAVITY : JUMP_GRAVITY;
    if (this.fz <= 0) {
      this.fz = 0; this.vz = 0; this.jumping = false;
      const f = groundFlags(game, this);
      // Landing in water you can't swim in throws you back.
      if ((f & F.DEEP) && this._cleats <= 0) { this.beginWash(game); return; }
      if (f & F.PIT) { this.beginFall(game); return; }
      game.audio.sfx('land');
      if (!(f & F.WET)) game.spawnEffect('dust', this.x, this.y + 4, { life: 12 });
      else game.spawnEffect('splash', this.x, this.y + 2);
    }
  }

  // ------------------------------------------------------------------ lift

  tryLift(game, level) {
    if (this.carrying) return true;
    const [dx, dy] = DIR_VEC[this.dir];
    const tx = Math.floor((this.cx + dx * LIFT_REACH) / TILE);
    const ty = Math.floor((this.cy + dy * LIFT_REACH) / TILE);
    // liftable entities first (bombs, pots placed as entities)
    for (const e of game.entities) {
      if (e.liftable && !e.dead && Math.hypot(e.cx - (this.cx + dx * LIFT_REACH), e.cy - (this.cy + dy * LIFT_REACH)) < LIFT_REACH) {
        this.carrying = e;
        e.carried = true;
        game.audio.sfx('lift');
        return true;
      }
    }
    const got = game.liftTile(tx, ty, level, this);
    if (got) { this.carrying = got; game.audio.sfx('lift'); return true; }
    game.audio.sfx('deny');
    return true;
  }

  throwCarried(game) {
    const c = this.carrying;
    if (!c) return false;
    this.carrying = null;
    c.carried = false;
    const [dx, dy] = DIR_VEC[this.dir];
    if (c instanceof ThrownObject || c.thrownVx !== undefined) {
      c.thrownVx = dx * THROW_SPEED; c.thrownVy = dy * THROW_SPEED;
      c.x = this.x + dx * 4; c.y = this.y + dy * 4;
      c.remove = false;
    } else {
      c.remove = true;
      game.addEntity(new ThrownObject(this.x + dx * 4, this.y + dy * 4, {
        sprite: c.sprite || 'rock16', pal: c.pal || 'stone',
        vx: dx * THROW_SPEED, vy: dy * THROW_SPEED, z: CARRY_HEIGHT, drops: c.dropTable || 'none',
      }));
    }
    game.audio.sfx('throw');
    return true;
  }

  dropCarried(game) {
    if (!this.carrying) return;
    const c = this.carrying;
    this.carrying = null;
    c.carried = false;
    c.remove = true;
    game.spawnEffect('splash', c.x, c.y);
  }

  // ------------------------------------------------------------------- dig

  startDig(game) {
    if (this.digging > 0 || this.inDeep) return true;
    const f = groundFlags(game, this);
    this.digging = DIG_FRAMES;
    if (f & (F.SLOW)) {
      game.audio.sfx('dig');
      const { tx, ty } = groundTile(game, this);
      game.digTile(tx, ty, this);
    } else {
      game.audio.sfx('deny');
    }
    return true;
  }

  // ------------------------------------------------------- Kelp-Soled Cleats
  //
  // One item, two modes, one button. Swim is what the flippers were. Sink is
  // the new half: you walk the floor UNDER the water instead of over it, and
  // the two fail in different ways, which is the point — every deep room now
  // has two solutions rather than one.
  //
  //   sink   slow, no jump, no sword, no shield, immune to currents and to
  //          knockback, and you keep hold of whatever you were carrying
  //   swim   fast, exposed, and everything that swims can reach you
  //
  // Breath is the L1 limit. Cleats L2 — the Mermaid Suit — removes it entirely
  // and adds block pushing on the floor (see tryPush).
  //
  // Toggling on dry land just sets which mode the next deep water will be
  // entered in, and says so: a mode switch with no water to switch in would
  // otherwise look broken.

  toggleCleats(game) {
    const next = this.cleatMode === 'sink' ? 'swim' : 'sink';
    if (!this.inDeep) {
      this.cleatMode = next;
      game.audio.sfx('place');
      game.say(next === 'sink'
        ? 'The soles drink. You will walk under the next water you meet.'
        : 'The kelp lifts. You will swim the next water you meet.');
      return true;
    }
    if (this.sinkT > 0) return true;
    this.cleatMode = next;
    this.sinkT = SINK_ENTER_FRAMES;
    this.sinkInto = next === 'sink';
    game.audio.sfx('dive');
    game.spawnEffect('splash', this.x, this.y + 2);
    return true;
  }

  /** The descent and the ascent. Control is off for the whole of it. */
  updateSinkTransition(game) {
    this.sinkT--;
    this.animT++;
    if (this.sinkT > 0) return;
    this.underwater = this.sinkInto;
    if (this.underwater) {
      // L2 has no limit; the timer is left at zero and updateBreath ignores it.
      this.breath = this._cleats >= 2 ? 0 : CLEATS_BREATH_FRAMES;
    } else {
      this.breath = 0;
      game.spawnEffect('splash', this.x, this.y + 2);
    }
  }

  updateBreath(game) {
    if (!this.underwater) return;
    if (this.frame % SINK_BUBBLE_EVERY === 0) {
      game.spawnEffect('bubble', this.x, this.y - 2, { life: 30 });
    }
    // Left standing on dry ground by a falling tide: come back up on your own.
    if (!this.inDeep) { this.surface(game, false); return; }
    if (this._cleats >= 2) return;            // Mermaid Suit: unlimited
    this.breath--;
    if (this.breath === CLEATS_BREATH_WARN_FRAMES) game.audio.sfx('deny');
    if (this.breath <= 0) this.surface(game, true);
  }

  /** Come up. `forced` means the air ran out and it costs you. */
  surface(game, forced) {
    this.underwater = false;
    this.cleatMode = 'swim';
    this.breath = 0;
    game.spawnEffect('splash', this.x, this.y + 2);
    if (!forced) return;
    game.audio.sfx('splash');
    this.takeDamage(game, SINK_DROWN_DAMAGE, null, { noKnockDir: true });
    game.say('Your air ran out!');
  }

  // ---------------------------------------------------------------- conch

  playConch(game) {
    if (this.conchTime > 0) return true;
    const why = game.tide.blockedReason();
    if (why) {
      game.audio.sfx('deny');
      game.say(why === 'locked'
        ? 'The conch will not sound in here.'
        : (why === 'forced' ? 'Something holds the water fast.' : ''));
      return true;
    }
    this.conchTime = CONCH_FRAMES;
    this.frozen = CONCH_FRAMES;
    game.audio.sfx('conch');
    game.tide.cycle();
    game.onConchPlayed();
    return true;
  }

  // ---------------------------------------------------------------- damage

  updateContactDamage(game) {
    if (this.invuln > 0 || this.invincible) return;
    for (const e of game.entities) {
      if (!e.isEnemy || e.dead || e.harmless || e.dormant || e.hidden) continue;
      if (e.damage <= 0) continue;
      if (this.z > 6 && !e.flying) continue;      // jumped over it
      if (!this.overlaps(e)) continue;
      this.takeDamage(game, e.damage, e);
      break;
    }
  }

  /** Ring/shield modifiers applied here so every damage source respects them. */
  takeDamage(game, amount, source, o = {}) {
    if (this.invuln > 0 || this.invincible || this.falling > 0 || this.washing > 0) return false;
    const p = game.progress;

    // Shield blocks damage from the facing direction (projectiles and contact).
    if (this.shielding && source) {
      const dir = dirFromDelta(source.cx - this.cx, source.cy - this.cy);
      if (dir === this.dir) {
        const lv = itemLevel(p, 'shield');
        const blocks = source.isProjectile ? lv >= 1 : lv >= 2;
        if (blocks) {
          game.audio.sfx('block');
          game.spawnEffect('spark', this.cx - 8, this.cy - 8);
          if (source.isProjectile) source.remove = true;
          return false;
        }
      }
    }

    let dmg = amount;
    if (game.hasRing('armor')) dmg = Math.max(1, Math.round(dmg * 0.5));
    if (game.hasRing('redJoy')) dmg = Math.round(dmg * 2);

    p.hearts = Math.max(0, p.hearts - dmg);
    this.invuln = PLAYER_INVULN_FRAMES;
    this.flicker = PLAYER_FLICKER_FRAMES;
    this.hurtTime = PLAYER_HURT_FRAMES;
    // A walker on the seafloor is not shoved. That is the other half of what
    // sink mode buys, and it is why a current-swept room can be crossed under
    // fire at the price of not being able to draw the sword while you do it.
    if (!o.noKnockDir && source && !this.underwater) {
      const dx = this.cx - source.cx, dy = this.cy - source.cy;
      const d = Math.hypot(dx, dy) || 1;
      // sp/f: the whole distance divided across the whole window, once.
      const per = sp(PLAYER_KNOCK_DIST) / PLAYER_KNOCK_FRAMES;
      this.knockX = Math.round(dx / d * per);
      this.knockY = Math.round(dy / d * per);
      this.knockTime = PLAYER_KNOCK_FRAMES;
    } else {
      this.knockX = 0; this.knockY = 0; this.knockTime = 0;
    }
    this.charge = 0;
    this.holding = false; this.holdT = 0;
    if (this.carrying) this.dropCarried(game);
    game.audio.sfx('linkHurt');
    game.shake(SHAKE_SMALL, SHAKE_SMALL_FRAMES);
    if (p.hearts <= 0) game.onPlayerDied();
    return true;
  }

  // ------------------------------------------------------------ pits/water

  beginFall(game) {
    if (this.falling > 0) return;
    this.falling = FALL_FRAMES;
    this.jumping = false;
    this.ledgeHop = null;
    this.z = 0;
    game.audio.sfx('fall');
  }

  updateFalling(game) {
    this.falling--;
    if (this.falling === 0) {
      const safe = findSafeTile(game, this) || this.lastSafe;
      this.x = safe.x; this.y = safe.y;
      this.takeDamage(game, PIT_DAMAGE, null, { noKnockDir: true });
      this.invuln = PLAYER_RECOVER_INVULN_FRAMES;
    }
  }

  /** Swept back to shore by water you cannot swim in. */
  beginWash(game) {
    if (this.washing > 0) return;
    this.washing = WASH_FRAMES;
    this.jumping = false;
    this.ledgeHop = null;
    this.vz = 0;
    game.audio.sfx('splash');
    game.spawnEffect('splash', this.x, this.y);
  }

  updateWashing(game) {
    this.washing--;
    this.animT++;
    if (this.washing === 0) {
      const safe = findSafeTile(game, this) || this.lastSafe;
      this.x = safe.x; this.y = safe.y;
      this.z = 0;
      this.takeDamage(game, WASH_DAMAGE, null, { noKnockDir: true });
      this.invuln = PLAYER_RECOVER_INVULN_FRAMES;
      game.say('The tide swept you back!');
    }
  }

  /** Called after a tide change to make sure Link is not left in a wall. */
  reconcileWithTide(game) {
    if (canOccupy(game, this, this.x, this.y, this.caps)) {
      const f = groundFlags(game, this);
      if (!(f & F.DEEP) || this._cleats > 0) return;
    }
    const safe = findSafeTile(game, this);
    if (safe) {
      this.x = safe.x; this.y = safe.y;
      game.spawnEffect('splash', this.x, this.y);
    } else {
      this.beginWash(game);
    }
  }

  // ------------------------------------------------------------------ draw

  spriteName(game) {
    const side = this.dir === 'left' || this.dir === 'right';
    this.flipX = this.dir === 'left';
    const key = side ? 'side' : this.dir;

    if (this.falling > 0) return 'link_fall_' + Math.min(2, Math.floor((FALL_FRAMES - this.falling) / 8));
    if (this.digging > 0) return 'link_dig_' + (this.digging > DIG_FRAMES / 2 ? 0 : 1);
    if (this.spinning > 0) return 'link_spin_' + (Math.floor(this.frame / 3) % 4);
    if (this.conchTime > 0) return 'link_conch_' + key;
    if (this.sinkT > 0) return 'link_dive';
    // Walking the floor is walking: the same frames as on land, in the swim
    // palette, drawn whole rather than cropped at a water line. Reusing them
    // is deliberate — the source games reuse the swim frames for the Mermaid
    // Suit, and inventing a sixth Link gait is exactly the kind of hand-drawn
    // drift ART-DIRECTION exists to stop.
    if (this.underwater) {
      const moving = this._lastDx || this._lastDy;
      return 'link_walk_' + key + '_' + (moving ? (Math.floor(this.animT / 7) % 2) : 0);
    }
    if (this.inDeep) {
      return 'link_swim_' + key + '_' + (Math.floor(this.animT / 9) % 2);
    }
    if (this.hurtTime > 0) return 'link_hurt_' + key;
    if (this.swinging > 0) return 'link_sword_' + key;
    if (this.holding) return 'link_hold_' + key;
    if (this.carrying) return 'link_carry_' + key;
    if (this.pushing) return 'link_push_' + key;
    const moving = this._lastDx || this._lastDy;
    if (!moving) return 'link_walk_' + key + '_0';
    return 'link_walk_' + key + '_' + (Math.floor(this.animT / 7) % 2);
  }

  draw(ctx, game, ox, oy) {
    if (this.flicker > 0 && (this.flicker >> 1) % 2 === 0) return;
    const p = game.progress;
    const pal = (this.inDeep || this.underwater) ? 'linkswim' : (game.linkPal || 'link');
    const name = this.spriteName(game);

    // Wading and swimming hide the lower part of the sprite behind the water line.
    let cropH = null;
    if (this.underwater || this.sinkT > 0) cropH = null;   // fully below the surface
    else if (this.inDeep) cropH = 11;
    else if (this.inShallow && this.z <= 1) cropH = 13;

    // The held-blade frames are the source game's own and are NOT 16x16 — the
    // blade runs past the edge of Link's cell in whichever direction he faces.
    // They are drawn at native size with an anchor that puts his BODY on the
    // pixel a 16x16 frame would have put it on. The offset is derived from the
    // sprite's own dimensions rather than written down, so art and anchor
    // cannot drift apart: whatever the blade overhangs by, the anchor undoes.
    //
    // Facing left, the engine mirrors the side frame inside its own 28px
    // canvas, which carries the body to the far end — so the offset moves with
    // the flip, not with the direction.
    let ax = 0, ay = 0;
    if (name.startsWith('link_hold_')) {
      const s = sprites.size(name);
      if (this.dir === 'up') ay = -(s.h - 16);
      else if (this.flipX) ax = -(s.w - 16);
    }
    const dy = oy + this.y - this.z;
    // The wading crop is a water line in room space; inside a taller frame it
    // sits `ay` lower, because that is how much of the frame is above Link.
    sprites.draw(ctx, name, ox + this.x + ax, dy + ay,
      { pal, flipX: this.flipX, h: cropH == null ? null : cropH - ay });

    // Sword arc
    if (this.swinging > 0) {
      const t = SWING_FRAMES - this.swinging;
      if (t <= SWING_HIT_END + 2) {
        const side = this.dir === 'left' || this.dir === 'right';
        const key = side ? 'side' : this.dir;
        const [ddx, ddy] = DIR_VEC[this.dir];
        sprites.draw(ctx, 'fx_slash_' + key + '_' + Math.min(1, Math.floor(t / 5)),
          ox + this.x + ddx * 12, dy + ddy * 12,
          { pal: this.swordLevel >= 3 ? 'essence' : 'spark', flipX: this.dir === 'left' });
      }
    }
    if (this.charge >= CHARGE_FRAMES && (this.frame >> 2) % 2 === 0) {
      sprites.draw(ctx, 'fx_sparkle1', ox + this.x, dy - 4, { pal: 'gold' });
    }
    if (this.shielding) {
      const side = this.dir === 'left' || this.dir === 'right';
      const key = side ? 'side' : this.dir;
      sprites.draw(ctx, 'link_shield_' + key, ox + this.x, dy, { pal: 'ui', flipX: this.flipX });
    }
    if (this.inDeep && !this.underwater) {
      sprites.draw(ctx, 'fx_ripple0', ox + this.x, oy + this.y + 6, { pal: 'water' });
    }
  }
}

export function swordDamage(level) {
  return level >= 3 ? 6 : (level >= 2 ? 4 : 2);
}

function rectOverlap(a, b) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

function dirFromDelta(dx, dy) {
  if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? 'left' : 'right';
  return dy < 0 ? 'up' : 'down';
}
