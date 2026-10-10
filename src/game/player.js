// Link. All player state lives here: movement, sword, shield, jumping, swimming,
// carrying, damage and the tide interaction.
//
// SPRITE NAMING CONTRACT (art data must provide these names):
//   link_walk_down_0/1     link_walk_up_0/1     link_walk_side_0/1   (side faces RIGHT)
//   link_swing0_down/up/side  link_swing1_down/up/side   (the swing's two bodies)
//   link_swim_down_0/1     link_swim_up_0/1     link_swim_side_0/1
//   link_carry_down        link_carry_up        link_carry_side
//   link_push_down         link_push_up         link_push_side
//   link_hurt              link_fall_0/1/2
//   link_dive
//   fx_sword_0..7          (the sword itself, a 32x32 cell centred on it)

import {
  Entity, moveEntity, canOccupy, groundFlags, groundTile, touchingDeep, findSafeTile, DIR_VEC, DIRS,
  enemyHurtRect,
} from './entity.js';
export { enemyHurtRect };
import { F, transformFor } from '../world/tileset.js';
import { TILE } from '../core/screen.js';
import { sp, toPx } from '../core/fixed.js';
import { sprites } from '../gfx/art.js';
import { noise1 } from '../core/rng.js';
import { hasItem, itemLevel, HEART_UNITS } from './progress.js';
import { useEquipped, ITEMS, ThrownObject } from './items.js';
import {
  WALK_SPEED, DIAGONAL_FACTOR, SWIM_SPEED, BOOST_SPEED, SLOW_FACTOR,
  SHALLOW_FACTOR, CARRY_FACTOR,
  SWING_FRAMES, SWING_PHASE_FRAMES, SWORD_ARC, LINK_HURT_RADIUS, SWORD_RESWING_PHASE, PICKUP_BLADE_RADIUS,
  CHARGE_FRAMES, CHARGE_FLASH_BEAT,
  SPIN_FRAMES, SPIN_STEP_FRAMES, SPIN_ARC, SWORD_CUT_POINTS, SWORD_POKE_PHASES,
  SWORD_HOLD_DELAY, KNOCK_HOLD,
  PLAYER_INVULN_FRAMES, PLAYER_FLICKER_FRAMES, PLAYER_HURT_FLASH_BEAT, PLAYER_RECOVER_INVULN_FRAMES,
  PLAYER_HURT_FRAMES, PLAYER_KNOCK_SPEED, PLAYER_KNOCK_FRAMES,
  KNOCK_SWORD, KNOCK_SWORD_L2, KNOCK_SPIN, HAZARD_DAMAGE, SPIKE_INVULN_FRAMES, SPIKE_KNOCK_FRAMES, PIT_DAMAGE, WASH_DAMAGE,
  JUMP_GRAVITY, LAND_SETTLE_RATE,
  LEDGE_MAX_SPAN, LEDGE_HOP_FRAMES, LEDGE_HOP_HEIGHT, LEDGE_PROBE_REACH,
  GAP_HOP_MAX_SPAN,
  FALL_FRAMES, FALL_ANIM_FRAMES, RESPAWN_HOLD_FRAMES, WASH_FRAMES, CONCH_FRAMES, PUSH_DELAY_FRAMES,
  LENS_FADE_FRAMES,
  BELLOWS_RANGE, BELLOWS_WARMUP_FRAMES, BELLOWS_PUSH, BELLOWS_PUFF_EVERY,
  BELLOWS_RAFT_SCALE,
  SINK_SPEED, SINK_ENTER_FRAMES, CLEATS_BREATH_FRAMES,
  CLEATS_BREATH_WARN_FRAMES, SINK_BUBBLE_EVERY, SINK_DROWN_DAMAGE,
  CONTEXT_REACH, LIFT_REACH, LIFT_STRENGTH, CARRY_HEIGHT, LIFTED_THROW_SPEED, LIFTED_THROW_NUDGE, LIFT_STEP_FRAMES, LIFT_STEP_POS,
  ROD_RING_FRAMES,
  WADE_FOAM_EVERY,
  PUSH_PROBE_REACH,
  RIPTIDE_FIN_FACTOR, DEADWEIGHT_FACTOR, KELP_BRAID_FACTOR, SPLIT_FANG_SPAN,
  SEAWOLF_KNOCK_FACTOR, HAGSTONE_CHANCE, STRANDWALKER_EVERY,
  PRESSURE_SCAR_FACTOR, BOSUN_FACTOR,
  HITSTOP_HURT_FRAMES,
} from '../data/feel.js';

// THE SWORD AS SEASONS DRAWS IT (S173). The blade is its own object
// (ITEM_SWORD), standing at Link's position plus its hit area's own offset —
// [.., .., dy, dx] of SWORD_ARC for a swing, SPIN_ARC for a spin
// (postUpdate.s itemSetPositionInSwordArc) — SWORD_Z px above him (its z is
// his less 2), behind him (its draw priority is 2 to his 1), as one of eight
// pictures, `fx_sword_0..7`: up, up-right, right, down-right, down,
// down-left, left, up-left (rip-link.py cuts them from spr_swords). Which
// picture each phase of each swing shows is updateSwingableItemAnimation's own
// table (@data, low three bits); a spin's position k shows picture k.
const SWORD_PIC = { up: [2, 1, 0, 0], right: [0, 1, 2, 2], down: [6, 5, 4, 4], left: [0, 7, 6, 6] };
const SWORD_Z = 2;

// Link's body on the swing's full-reach phase, and on the poke's first: the
// rest of the swing's own picture ($b0+direction) moved 3 px toward his
// facing — the cartridge's $b4+direction, which is the same graphic through
// oam layouts $08-$0b (specialObjectOamData.s oamData48040..4805b). [x, y].
const SWING_LUNGE = { up: [0, -3], right: [3, 0], down: [0, 3], left: [-3, 0] };
const SPIN_FACING = ['up', 'right', 'down', 'left'];

// The swing's sound table, in the cartridge's own order: SND_SWORDSLASH,
// SND_UNKNOWN5, SND_BOOMERANG, then the rest (object_code/common/items/sword.s).
const SWORD_SOUNDS = ['sword1', 'sword2', 'sword3', 'sword1', 'sword1', 'sword2', 'sword1', 'sword1'];

const SPIN_START = { up: 0, right: 2, down: 4, left: 6 };

// THE HELD BLADE (S174). The swing's animation ends on parameter $86
// (animationData19d1e), whose low bits name the swing's LAST phase — the
// blade drawn back — and the sword object stays there for as long as the
// button is held. Link himself goes back to his own walking frames: in the
// hold the parent item's frame priority (var3f) is 0, which ties Link's, and
// a tie is his (specialObjectAnimationsAndDamage.s func_4553).
const HELD_PHASE = 3;

/** Which of the swing's four phases frame `t` (0-based) of it falls in. */
export function swingPhase(t) {
  let end = 0;
  for (let i = 0; i < SWING_PHASE_FRAMES.length; i++) {
    end += SWING_PHASE_FRAMES[i];
    if (t < end) return i;
  }
  return SWING_PHASE_FRAMES.length - 1;
}


/**
 * Link's own collision area: a box of LINK_HURT_RADIUS either way of the
 * middle of his sprite, as the cartridge has it. It is what an enemy has to
 * touch to hurt him; his `hb` is his feet, and only walls and floors read it.
 */
export function playerHurtRect(p) {
  const r = LINK_HURT_RADIUS;
  return { x: p.cx - r, y: p.cy - r, w: r * 2, h: r * 2 };
}

export class Player extends Entity {
  /** What an enemy has to touch to hurt him: playerHurtRect. */
  contactRect() { return playerHurtRect(this); }

  constructor(x, y) {
    super(x, y);
    this.w = 16; this.h = 16;
    // Feet-centred hitbox: Link's head overlaps walls in the GBC games.
    this.hb = { x: 3, y: 8, w: 10, h: 7 };
    this.dir = 'down';
    this.harmless = true;
    this.depth = 0;

    this.swinging = 0;
    // Seasons' two ways to lose the sword for a while: a bubble's touch
    // (wSwordDisabledCounter, frames) and a gel clinging to him.
    this.swordLock = 0;
    this.clungBy = null;
    this.charge = 0;
    this.spinning = 0;
    this.holding = false;         // blade out, walking with it
    this.holdT = 0;               // frames spent in the hold
    this.poking = 0;              // frames left of a poke (SWORD_POKE_PHASES)
    this.pokeKeep = false;        // after the poke: back to the hold, or put away
    this.swordStowed = false;     // put away by a poke; out again on a new press
    this.shielding = false;
    this.jumping = false;
    this.carrying = null;
    this.liftT = 0;
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
    this.hookPulling = false;
    this.lensHeld = false;        // set per-frame by the held-item hook
    this.lensT = 0;               // 0..LENS_FADE_FRAMES, the overlay's fade
    this.bellowsHeld = false;     // ditto
    this.bellowsT = 0;            // frames spent pumping; the cone opens at warmup
    this.bellowsHold = null;      // id of the override this cone laid
    this.rodCool = 0;             // Resonance Rod lock-out
    this.rodRing = 0;             // frames of the ring still expanding
    this.rodRange = 0;            // px the last ring reached, for the draw
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
    if (this.rodCool > 0) this.rodCool--;
    if (this.rodRing > 0) this.rodRing--;
    if (this.swordLock > 0) this.swordLock--;
    if (this.clungBy && (this.clungBy.dead || this.clungBy.remove || this.clungBy.aiState !== 'cling'
      || !game.entities.includes(this.clungBy))) this.clungBy = null;

    if (this.falling > 0) { this.updateFalling(game); return; }
    if (this.washing > 0) { this.updateWashing(game); return; }
    if (this.sinkT > 0) { this.updateSinkTransition(game); return; }
    if (this.frozen > 0) { this.frozen--; this.animT++; this.placeCarried(); return; }

    // Being reeled in by the Dredge Line suspends normal control.
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

    if (this.spinning > 0) { this.updateSpin(game); return; }
    if (this.poking > 0) { this.updatePoke(game); return; }
    if (this.swinging > 0) { this.updateSwing(game); }

    this.handleInput(game);
    this.updateSwordHold(game);
    this.updateLens(game);
    this.updateBellows(game);
    this.updateBreath(game);
    // A poke roots him from the frame it starts (swordParent.s
    // @triggerSwordPoke, itemDisableLinkMovement).
    if (this.poking === 0) this.updateMovement(game);
    this.updateJump(game);
    this.updateContactDamage(game);
    this.updateHazards(game);
    this.updateStrandwalker(game);

    this.placeCarried();
  }

  /**
   * Where the thing in his hands is. Overhead at CARRY_HEIGHT once lifted;
   * during the lift (`liftT`, counting down) at Seasons' two lift positions
   * for the way he is facing — see LIFT_STEP_POS.
   */
  placeCarried() {
    const c = this.carrying;
    if (!c) return;
    if (this.liftT > 0) {
      const done = LIFT_STEP_FRAMES[0] + LIFT_STEP_FRAMES[1] - this.liftT;
      const [x, z] = LIFT_STEP_POS[this.dir][done < LIFT_STEP_FRAMES[0] ? 0 : 1];
      this.liftT--;
      c.x = this.x + x;
      c.y = this.y + z;
      return;
    }
    c.x = this.x;
    c.y = this.y - CARRY_HEIGHT;
  }

  /** Start the lift: Link is held still for its two steps, as in Seasons. */
  beginLift() {
    this.liftT = LIFT_STEP_FRAMES[0] + LIFT_STEP_FRAMES[1];
    this.frozen = Math.max(this.frozen, this.liftT);
    this.placeCarried();
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
      // Entering water with the soles already drinking goes straight under.
      // `toggleCleats` on dry land says "you will walk under the next water you
      // meet" and then NOTHING READ `cleatMode` AGAIN — the flag was set, the
      // line was said, and the player surfaced into the current anyway. It went
      // unnoticed because every deep room before the Bogwater Sanctum plays the
      // same either way; a dungeon about choosing your layer before you commit
      // is where a promise the engine does not keep starts costing hearts.
      if (this.cleatMode === 'sink' && !this.underwater && this.sinkT === 0 && this._cleats > 0) {
        this.sinkT = game.charm('pressureScar')
          ? Math.max(1, Math.round(SINK_ENTER_FRAMES * PRESSURE_SCAR_FACTOR))
          : SINK_ENTER_FRAMES;
        this.sinkInto = true;
        game.audio.sfx('dive');
      }
      // On the surface a load goes overboard. On the floor it does not: the
      // whole reason to walk down there is that you can take things with you.
      if (this.carrying && !this.underwater) this.dropCarried(game);
    }
    if (!this.inDeep && wasDeep) {
      game.spawnEffect('splash', this.x, this.y + 2);
      // Entering the water was audible and leaving it was not, which made the
      // sea sound like something you could only fall into.
      game.audio.sfx('splash', { pitch: 1.2, vol: 0.8 });
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
    // THE DIVE FIRES ON TOUCH, NOT ON THE MIDDLE, AND THE BOGWATER SANCTUM IS
    // WHY. `toggleCleats` on dry land promises "you will walk under the next
    // water you meet", and the dive above keeps that promise on the frame the
    // player's CENTRE crosses into a deep tile — `groundFlags` is a single
    // point. A torrent is stronger than a swimmer by design (TORRENT_PUSH 1.35
    // against SWIM_SPEED 1.125), so at the mouth of a channel running against
    // you the two rules deadlock: the player edges forward until the water
    // takes him, the current shoves him back before his middle is ever over
    // it, `inDeep` never goes true, and the dive he already asked for never
    // starts. He stands on the lip of the Bogwater Drain holding a direction
    // for ever with the soles already drinking. The playthrough actor sat
    // there for nine hundred frames, and the Drain is the ONLY way into the
    // eastern half of the dungeon, so the Sanctum was unfinishable.
    //
    // `check-cleats.mjs` could not see it. It asks whether the floor route
    // EXISTS — no route on foot, none on the surface, one on the seafloor,
    // one breath — which is all true here. Whether a player who has asked for
    // the seafloor can actually GET down to it is a different question, and
    // nothing asked it until something played the room.
    //
    // Touching the water is meeting it. Same sampling the mover already uses,
    // so "the water I am standing in" and "the water I may step into" are
    // decided by the same rule rather than by two that disagree at the edge.
    if (!this.underwater && this.sinkT === 0 && this.cleatMode === 'sink'
        && this._cleats > 0 && this.z <= 2 && touchingDeep(game, this)) {
      this.sinkT = game.charm('pressureScar')
        ? Math.max(1, Math.round(SINK_ENTER_FRAMES * PRESSURE_SCAR_FACTOR))
        : SINK_ENTER_FRAMES;
      this.sinkInto = true;
      game.audio.sfx('dive');
    }
    if (this.inDeep && !this.underwater && !game.charm('deadweight')) {
      const { tx, ty } = groundTile(game, this);
      const def = game.room.tile(tx, ty, game.tide);
      // A tile's `push` is data, written in px/f; the mover speaks subpixels.
      const k = game.charm('kelpBraid') ? KELP_BRAID_FACTOR : 1;
      if (def.push) moveEntity(game, this, sp(def.push[0] * k), sp(def.push[1] * k));
    }
  }

  updateHazards(game) {
    const f = groundFlags(game, this);
    if (this.z > 2 || this.jumping) return;
    if ((f & F.WHIRL) && game.enterWhirlpool()) return;
    if (f & F.PIT) { this.beginFall(game); return; }
    if ((f & F.HAZARD) && this.takeDamage(game, HAZARD_DAMAGE, null, { noKnockDir: true, hazard: true })) {
      // Spikes, Seasons' way (dealSpikeDamageToLink): longer safety, and a
      // short shove straight back the way he was facing.
      const [dx, dy] = DIR_VEC[this.dir];
      this.invuln = SPIKE_INVULN_FRAMES;
      this.knockX = -dx * PLAYER_KNOCK_SPEED; this.knockY = -dy * PLAYER_KNOCK_SPEED;
      this.knockTime = SPIKE_KNOCK_FRAMES;
    }
  }

  // ----------------------------------------------------------------- input

  handleInput(game) {
    const i = game.input;
    this.shielding = false;
    this.lensHeld = false;
    this.bellowsHeld = false;

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
    if (slot && hasItem(game.progress, 'sword') && !this.inDeep && !this.swordLocked()) {
      if (!i.down(slot)) this.swordStowed = false;
      if (this.swordStowed) {
        this.charge = 0;
      } else if (i.down(slot) && this.swinging === 0) {
        this.charge++;
        if (this.charge === CHARGE_FRAMES) game.audio.sfx('charged');
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

  /**
   * Talk to NPCs, read signs, open chests, and LIFT.
   *
   * THE POWER BRACELET IS GONE AND LIFTING IS BASE MOVESET, for the same
   * reason the hop is: picking a pot up is grammar, not vocabulary, and a
   * genre verb behind an item is a lock wearing a costume. It is on the
   * context button, which is where the source games put it once you have the
   * bracelet — so the button does what it always did, from the first room.
   *
   * The order matters and is the source games' order: a person or a chest in
   * front of you wins over the ground under your hands, and a thing already in
   * your hands wins over everything, because putting it down has to be
   * possible from any position.
   */
  tryContextAction(game) {
    // Carrying something? A is how you put it down. Checked first so you are
    // never stuck holding a pot in front of a signpost.
    if (this.carrying) return this.throwCarried(game);

    const [dx, dy] = DIR_VEC[this.dir];
    const px = this.cx + dx * CONTEXT_REACH, py = this.cy + dy * CONTEXT_REACH;
    // entities first
    const talk = (qx, qy) => {
      for (const e of game.entities) {
        if (e.interact && !e.dead) {
          const r = e.rect();
          if (qx >= r.x - 4 && qx <= r.x + r.w + 4 && qy >= r.y - 4 && qy <= r.y + r.h + 4) {
            e.interact(game, this);
            return true;
          }
        }
      }
      return false;
    };
    if (talk(px, py)) return true;
    // ACROSS A COUNTER (S168): Farore sits behind her desk, as in Seasons,
    // and is spoken to over it — one tile further, only through a counter.
    if (game.room && game.room.tile(Math.floor(px / TILE), Math.floor(py / TILE), game.tide).counter
        && talk(px + dx * TILE, py + dy * TILE)) return true;
    // then tiles (signs, readable objects, doors needing keys)
    const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
    if (game.tileInteract(tx, ty, this)) return true;
    // then whatever is under your hands. `LIFT_STRENGTH` is what bare hands
    // are worth: a pot or a loose rock yes, a boulder no.
    if (!this.inDeep && !this.swinging && this.tryLift(game, LIFT_STRENGTH)) return true;
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

    // The held blade keeps him facing the way it points: Seasons disables
    // turning for the sword's whole life, hold included (commonCode.s
    // parentItemLoadAnimationAndIncState -> itemDisableLinkTurning, cleared
    // only by clearParentItem), so he walks with it out sideways and back.
    if ((dx || dy) && !this.holding) {
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
    // The raised shield and the held sword cost no speed (see feel.js, S175).
    const f = groundFlags(game, this);
    let mult = 1;
    // Charms are multipliers on the same dimensionless product the terrain
    // uses, so they compose with it rather than overriding it, and the whole
    // product still lands on a whole subpixel exactly once at the end.
    if ((f & F.SLOW) && this.z <= 2 && !game.charm('dunerunner')) mult *= SLOW_FACTOR;
    if (this.inShallow && this.z <= 2) mult *= SHALLOW_FACTOR;
    if (this.carrying) mult *= CARRY_FACTOR;
    if (this.inDeep && !this.underwater && game.charm('riptideFin')) mult *= RIPTIDE_FIN_FACTOR;
    if (game.charm('deadweight')) mult *= DEADWEIGHT_FACTOR;
    if (mult !== 1) speed = Math.max(1, Math.round(speed * mult));

    // A DIAGONAL IS THE SAME SPEED AS A STRAIGHT LINE. Seasons splits its
    // 1.5 px/f across both axes when two directions are held (measured, see
    // DIAGONAL_FACTOR in feel.js and docs/FEEL-SPEC.md). Rounded once, after
    // the terrain product, so it too lands on a whole subpixel.
    if (dx && dy) speed = Math.max(1, Math.round(speed * DIAGONAL_FACTOR));

    // Pumping costs you your feet. You may still turn — aiming a sustained
    // gust you cannot re-point would be a puzzle about pre-positioning rather
    // than about the gust — but you go nowhere while it blows.
    //
    // FROM THE FIRST FRAME OF THE WIND-UP, not from the cone opening. The
    // sprite has always planted him the moment he starts pumping (`link_push_`
    // while `bellowsT > 0`), and the mover did not: for BELLOWS_WARMUP_FRAMES a
    // player who pressed the button while still holding toward the wheel
    // walked on, and every sill in the Cistern has its pit trench directly in
    // that direction. The shelf was a trap for the one input it asks for.
    if (this.bellowsOpen || this.bellowsT > 0) { this.animT++; return; }

    // A hop in progress owns the controls until it lands.
    if (this.ledgeHop) { this.updateLedgeHop(game); this.animT++; return; }
    if ((dx || dy) && this.tryLedgeHop(game, dx, dy)) { this.animT++; return; }
    if ((dx || dy) && this.tryGapHop(game, dx, dy)) { this.animT++; return; }

    // A clinging gel lets him move only every other frame (gel.s gel_stateD,
    // wLinkImmobilized on odd frames).
    if ((dx || dy) && this.clungBy && (this.frame & 1)) { this.animT++; return; }
    if (dx || dy) {
      const res = moveEntity(game, this, dx * speed, dy * speed);
      this.animT++;
      // Pushing against a wall: show the push pose and try to shove blocks.
      this.pushing = (res.hitX && dx !== 0) || (res.hitY && dy !== 0);
      // The push POSE (and the poke) wants more than a blocked step: Seasons'
      // checkLinkPushingAgainstWall — the way he faces held, and both front
      // corners against something. See facingWall.
      this.againstWall = game.input.down(this.dir) && this.facingWall(game);
      if (this.pushing) this.tryPush(game, dx, dy);
      else this._pushT = 0;
      // WALKING INTO THE WALL BESIDE A DOOR TAKES YOU IN. The rule lives in
      // `Game.doorwayPull`, beside `checkWarpTile`, so the tile the player is
      // drawn toward and the tile the warp fires on are the same tile — see
      // the note there. It runs after `tryPush` because a block you are
      // shoving is something you meant to walk into, and the pull only fires
      // when there is a doorway within a tile to fire at.
      if (this.pushing) game.doorwayPull(this, dx, dy, res);
    } else {
      this.pushing = false;
      this.againstWall = false;
      this._pushT = 0;
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
    // Taking a ledge was silent going off it and only sounded on landing, so a
    // drop had a thump with no push behind it. `jump` already exists and is the
    // right voice, pitched down because this is a drop rather than a hop up.
    // BOTH launch paths need it — there are two, and only one of them is the
    // one you find by grepping for the function name.
    game.audio.sfx('jump', { pitch: 0.85 });
    this.jumping = true;
    this.vz = 0;
    this.gliding = false;
    this.lockDir = true;
    this.dir = facing;
    game.audio.sfx('jump');
    return true;
  }

  // --------------------------------------------------------------- the hop
  //
  // ROC'S FEATHER IS GONE AND THE HOP IS BASE MOVESET. The Oracles hand you a
  // jump because they need something to gate on; this game gates on the tide,
  // so a jump behind an item was a lock wearing a costume — and it made the
  // most basic verb in the genre a mid-game unlock.
  //
  // It is not on a button. Walking into a one-tile gap hops it, exactly the
  // way walking into a ledge already dropped you off it, and for the same
  // reason: in the source games the hop is what your legs do, not what your
  // inventory does. That also means it reuses `ledgeHop` whole — one arc, one
  // set of constants, one thing to get wrong.
  //
  // The refusal is what keeps it honest: it will not start unless the tile on
  // the far side is somewhere you can stand. A hop into a wall, into water you
  // cannot swim, or over a two-tile span simply does not fire, and the gap
  // still reads as a gap.

  tryGapHop(game, dx, dy) {
    if (this.jumping || this.z > 0 || this.inDeep || this.underwater) return false;
    if (this.carrying || this.bellowsOpen || this.hookPulling) return false;
    const room = game.room;
    if (!room) return false;
    // A diagonal press picks its dominant axis; a hop is cardinal.
    let ux = 0, uy = 0;
    if (Math.abs(dx) > Math.abs(dy)) ux = Math.sign(dx);
    else if (Math.abs(dy) > 0) uy = Math.sign(dy);
    if (!ux && !uy) return false;

    const tx = Math.floor((this.cx + ux * LEDGE_PROBE_REACH) / TILE);
    const ty = Math.floor((this.cy + uy * LEDGE_PROBE_REACH) / TILE);
    const def = this.tileDefAt(game, tx, ty);
    if (!def || !(def.flags & F.JUMPABLE) || (def.flags & F.NOFLY)) return false;

    // Clear the gap and any gap tiles behind it, up to the reach of a hop.
    let n = 1;
    while (n < GAP_HOP_MAX_SPAN) {
      const d = this.tileDefAt(game, tx + ux * n, ty + uy * n);
      if (!d || !(d.flags & F.JUMPABLE)) break;
      n++;
    }
    if (n >= GAP_HOP_MAX_SPAN) return false;      // too wide to clear

    const land = {
      x: ux ? (tx + ux * n) * TILE : this.x,
      y: uy ? (ty + uy * n) * TILE : this.y,
    };
    if (!canOccupy(game, this, land.x, land.y,
      { jumping: false, swim: this._cleats > 0, cutting: false })) return false;

    this.ledgeHop = {
      fromFx: this.fx, fromFy: this.fy,
      toFx: sp(land.x), toFy: sp(land.y),
      t: 0, n: LEDGE_HOP_FRAMES,
    };
    // Taking a ledge was silent going off it and only sounded on landing, so a
    // drop had a thump with no push behind it. `jump` already exists and is the
    // right voice, pitched down because this is a drop rather than a hop up.
    // BOTH launch paths need it — there are two, and only one of them is the
    // one you find by grepping for the function name.
    game.audio.sfx('jump', { pitch: 0.85 });
    this.jumping = true;
    this.vz = 0;
    this.gliding = false;
    this.lockDir = true;
    this.dir = ux ? (ux < 0 ? 'left' : 'right') : (uy < 0 ? 'up' : 'down');
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
    if (tx < 0 || ty < 0 || tx * TILE >= game.room.pw || ty * TILE >= game.room.ph) return null;
    return game.room.tile(tx, ty, game.tide);
  }

  tryPush(game, dx, dy) {
    // Shoving a block along the floor of the sea is Cleats L2 — the Mermaid
    // Suit. At L1 you can stand next to it down there and get nowhere.
    if (this.underwater && this._cleats < 2) return;
    // Squarely, and straight: Seasons shoves only while wLinkPushingDirection
    // is set — the push pose's own rule, both front corners against it (see
    // facingWall) — and not while a diagonal is held
    // (interactableTiles.s specialObjectCheckPushingAgainstTile). Anything
    // else starts the count over (resetPushingAgainstTileCounter).
    if (!this.againstWall || (dx && dy)) { this._pushT = 0; return; }
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
  // and lets you walk with it out: it damages what it touches and it clinks
  // off walls. (Drawn as Seasons draws it since S174: his own walking frames,
  // facing locked, the sword at the swing's last phase — see HELD_PHASE.)
  //
  // The engine had the first two. Without the third, the most-used button in
  // the game does a third less than it should — you cannot shave a bush by
  // walking through it, you cannot hold a corridor against something walking
  // into you, and the long hold reads as a dead wait for the spin rather than
  // as a stance you are already fighting in.
  //
  // SEASONS' HOLD (S172). The held blade does not stay out against what it
  // meets: walked into an enemy it lands one hit, a swing's worth with a low
  // knockback (sword.s @state2 copies the swing's damage to the held blade),
  // and Link POKES and puts the sword away; pushed against a wall he pokes it,
  // the tile at the blade's point is cut or clinks, and the hold starts its
  // charge over (swordParent.s @checkAndRetForSwordPoke). Walking it through
  // grass cuts nothing — only a poke or a swing cuts.

  updateSwordHold(game) {
    const slot = this.swordSlot(game);
    const out = !!slot && hasItem(game.progress, 'sword') && game.input.down(slot)
      && this.swinging === 0 && this.spinning === 0 && !this.swordStowed
      && !this.inDeep && !this.carrying && !this.hookPulling && !this.swordLocked()
      && this.charge >= SWORD_HOLD_DELAY;
    if (!out) { this.holding = false; this.holdT = 0; return; }

    this.holding = true;
    this.holdT++;

    const box = this.swordBox(game);
    this.bladeCollect(game, box);
    for (const e of game.entities) {
      if (!e.isEnemy || e.dead || e.dormant || e.hidden || e.invuln > 0) continue;
      if (!rectOverlap(box, enemyHurtRect(e))) continue;
      e.hurt(game, this.swordHit(game), this.dir, this.swordKnock(game, KNOCK_HOLD), this);
      this.startPoke(game, false);
      return;
    }
    if (game.input.down(this.dir) && this.facingWall(game)) this.startPoke(game, true);
  }

  /**
   * Is he squarely against something in the way he faces? Seasons asks two
   * points, one past each front corner of his wall box, and wants BOTH blocked
   * (bank0.s checkLinkPushingAgainstWall: adjacentWallsBitset AND the
   * direction's two bits, from link.s calculateAdjacentWallsBitset's eight
   * points). One corner over the end of a wall is a corner he slides round:
   * no push pose, and the held blade does not poke. Asked of canOccupy, a
   * pixel at a time, so it is the engine's own idea of solid.
   */
  facingWall(game) {
    const { x, y, w, h } = this.hb;
    const pts = {
      up: [[x, y - 1], [x + w - 1, y - 1]],
      down: [[x, y + h], [x + w - 1, y + h]],
      left: [[x - 1, y], [x - 1, y + h - 1]],
      right: [[x + w, y], [x + w, y + h - 1]],
    }[this.dir];
    return pts.every(([px, py]) => !canOccupy(game,
      { hb: { x: px, y: py, w: 1, h: 1 }, z: this.z, flying: this.flying, caps: this.caps },
      this.x, this.y));
  }

  startPoke(game, keep) {
    this.poking = SWORD_POKE_PHASES[0] + SWORD_POKE_PHASES[1];
    this.pokeKeep = keep;
    this.holding = false;
    this.holdT = 0;
    this.charge = 0;
    this.pushing = false;
    this.againstWall = false;
  }

  /** The poke's frames: the blade jabbed out, then drawn back, Link rooted. On
   *  the first, the tile at the blade's point is cut — or, poking a wall, it
   *  clinks (hollow off a wall a bomb would open). */
  updatePoke(game) {
    const t = SWORD_POKE_PHASES[0] + SWORD_POKE_PHASES[1] - this.poking;
    this.poking--;
    if (t === 0) {
      const [dy, dx] = SWORD_CUT_POINTS[SPIN_START[this.dir]];
      const px = this.cx + dx, py = this.cy + dy;
      const cut = game.checkTileAction({ x: px, y: py, w: 1, h: 1 }, 'cut');
      if (!cut && this.pokeKeep && game.room && px >= 0 && py >= 0
        && px < game.room.pw && py < game.room.ph
        && game.room.solidAt(px, py, game.tide, { jumping: false, swim: false })) {
        const name = game.room.baseName(Math.floor(px / TILE), Math.floor(py / TILE));
        const hollow = !!transformFor(name, 'bomb');
        game.audio.sfx(hollow ? 'clinkHollow' : 'block');
        game.spawnEffect('spark', px - 8, py - 8);
      }
    }
    if (this.poking === 0 && !this.pokeKeep) this.swordStowed = true;
  }

  /** The sword is out of reach: a bubble touched him, or a gel is on him. */
  swordLocked() { return this.swordLock > 0 || !!this.clungBy; }

  startSwing(game, level) {
    // A press mid-swing starts a fresh swing once the wind-up is over, as
    // Seasons' does (SWORD_RESWING_PHASE): the sword goes as fast as it is
    // tapped. Before that, and during a spin, the press is ignored.
    if (this.swinging > 0 && !this.swingWouldRestart()) return true;
    if (this.spinning > 0 || this.carrying) return true;
    if (this.swordLocked()) return true;
    // Deep water keeps the blade sheathed — unless you are WALKING down there
    // with a Ballast Lung, which is the whole of what that charm buys. Note it
    // does not licence swinging while SWIMMING: the charm is about having your
    // feet on something.
    if (this.inDeep && !(this.underwater && game.charm('ballastLung'))) return true;
    this.swinging = SWING_FRAMES;
    this.holding = false;
    this.holdT = 0;
    this.swordLevel = level;
    this.swingHit = new Set();
    // Oracle of Seasons does not give each sword its own sound: every swing
    // picks one of three slashes from an eight-entry table at random
    // (object_code/common/items/sword.s, @swordSounds). The pick is a hash of
    // the frame, not a draw from a stream, so a sound cannot shift the RNG.
    game.audio.sfx(SWORD_SOUNDS[Math.floor((noise1(game.frame) + 1) * 4) & 7]);
    return true;
  }

  /** Would a press of the sword's button now throw this swing away and
   *  start another (SWORD_RESWING_PHASE)? */
  swingWouldRestart() { return this.swinging > 0 && this.bladePhase() >= SWORD_RESWING_PHASE; }

  /** The same question for a press read NEXT frame — after that frame's
   *  updateSwing has moved the swing on one (a scripted pad decides its
   *  buttons before the frame it is read in). */
  swingWouldRestartNext() {
    const s = this.swinging - 1;
    return s > 0 && swingPhase(SWING_FRAMES - s - 1) >= SWORD_RESWING_PHASE;
  }

  updateSwing(game) {
    const t = SWING_FRAMES - this.swinging;
    this.swinging--;
    // The blade is live on every frame of the swing, the first included: on
    // phase 0 it is out to Link's side, on phase 1 on the diagonal, then along
    // the facing. That is the cartridge's arc, and it is why a foe standing
    // beside him is struck by a swing he aimed past it.
    const phase = swingPhase(t);
    const box = this.swordBox(game, phase);
    this.bladeCollect(game, box);
    for (const e of game.entities) {
      if (!e.isEnemy || e.dead || this.swingHit.has(e.id)) continue;
      if (rectOverlap(box, enemyHurtRect(e))) {
        this.swingHit.add(e.id);
        e.hurt(game, this.swordHit(game), this.dir,
          this.swordKnock(game, this.swordLevel >= 2 ? KNOCK_SWORD_L2 : KNOCK_SWORD), this);
      }
    }
    // Bushes and grass are cut by the blade at full reach, as the cartridge
    // breaks tiles only on that phase's animation frame — and only the ONE
    // tile under a point just ahead of Link, not everything the blade's hit
    // area touches (SWORD_CUT_POINTS).
    if (phase === 2 && t === SWING_PHASE_FRAMES[0] + SWING_PHASE_FRAMES[1]) {
      this.cutAt(game, SPIN_START[this.dir]);
    }
  }

  /** THE BLADE PICKS UP WHAT IT TOUCHES (S179). A dropped heart, rupee or
   *  bomb the sword's hit area meets is collected, as if walked onto — swing,
   *  spin or held blade — which is how Seasons takes a drop across a gap or
   *  off a ledge (PICKUP_BLADE_RADIUS). */
  bladeCollect(game, box) {
    const r = PICKUP_BLADE_RADIUS;
    for (const e of game.entities) {
      if (!e.isDrop || !e.bladeTakes || !e.bladeTakes(game)) continue;
      const c = { x: e.cx - r, y: e.cy - r, w: r * 2, h: r * 2 };
      if (rectOverlap(box, c)) e.collect(game);
    }
  }

  /** Cut the tile under the blade's point `k` (SWORD_CUT_POINTS: 0..7
   *  clockwise from up, 8 under Link). */
  cutAt(game, k) {
    const [dy, dx] = SWORD_CUT_POINTS[k];
    game.checkTileAction({ x: this.cx + dx, y: this.cy + dy, w: 1, h: 1 }, 'cut');
  }

  /**
   * Which of the swing's four phases the blade is drawn in this frame — a
   * poke is the swing's last two, full reach then drawn back — or -1 when no
   * swing or poke is under way.
   */
  bladePhase() {
    if (this.poking > 0) return this.poking > SWORD_POKE_PHASES[1] ? 2 : 3;
    if (this.swinging <= 0) return -1;
    return swingPhase(SWING_FRAMES - this.swinging - 1);
  }

  /**
   * What the blade is worth this swing. Salt-Etched and Wrackbone both land
   * here rather than in swordDamage(), because that function is the SWORD's
   * table — a charm is not a better sword, it is a better swing.
   */
  swordHit(game) {
    let d = swordDamage(this.swordLevel);
    if (game.charm('saltEtched') && roomHasDryGround(game)) d += 1;
    if (game.charm('wrackbone')) d *= 2;
    return d;
  }

  swordKnock(game, base) {
    return game.charm('seawolfsTooth') ? base * SEAWOLF_KNOCK_FACTOR : base;
  }

  /**
   * Where the blade can hit on phase `phase` of a swing (SWORD_ARC). With no
   * phase it is the blade drawn back along the facing — the last phase, and
   * the pose it is held out in. The Split Fang widens it across the facing.
   * `dir` asks the question for a facing Link is not yet in, which is how the
   * test harness decides whether a swing from here would reach.
   */
  swordBox(game, phase = 3, dir = this.dir) {
    let [ry, rx, oy, ox] = SWORD_ARC[dir][phase];
    const fang = game && game.charm('splitFang') ? SPLIT_FANG_SPAN / 2 : 0;
    if (dir === 'up' || dir === 'down') rx += fang; else ry += fang;
    return { x: this.cx + ox - rx, y: this.cy + oy - ry, w: rx * 2, h: ry * 2 };
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

  /** Where the blade is on frame `t` (0-based) of the spin, 0..7 clockwise
   *  from up. It starts on the way Link faces and moves a quarter turn every
   *  SPIN_STEP_FRAMES. With no `t`, the frame just updated — the one drawn. */
  // Clamped at 0: on the frame the spin starts it has not yet stepped, and
  // t = -1 drew the position BEFORE the first (the blade flicked to his right
  // for a frame before a downward spin began).
  spinPos(t = Math.max(0, SPIN_FRAMES - this.spinning - 1)) {
    const [card, diag] = SPIN_STEP_FRAMES;
    const q = Math.floor(t / (card + diag));
    const half = t % (card + diag) < card ? 0 : 1;
    return (SPIN_START[this.dir] + q * 2 + half) % 8;
  }

  // SEASONS' SPIN (S172). Link stands still for all of it — swordParent.s
  // @state3 disables his movement until the spin is over — and the blade hits
  // where the blade IS: an 18x18 box at each of the eight positions it passes
  // through (SPIN_ARC), not a square around him. It cuts the tile under each
  // position's point as it arrives there, and the one under Link as it ends.
  updateSpin(game) {
    const t = SPIN_FRAMES - this.spinning;
    this.spinning--;
    this.animT++;
    const k = this.spinPos(t);
    const [ry, rx, oy, ox] = SPIN_ARC[k];
    const box = { x: this.cx + ox - rx, y: this.cy + oy - ry, w: rx * 2, h: ry * 2 };
    this.bladeCollect(game, box);
    for (const e of game.entities) {
      if (!e.isEnemy || e.dead || this.spinHit.has(e.id)) continue;
      if (rectOverlap(box, enemyHurtRect(e))) {
        this.spinHit.add(e.id);
        // Twice a swing's damage: swordParent.s @state3 doubles the blade's
        // var3a (`sla`) as the spin starts.
        e.hurt(game, this.swordHit(game) * 2, this.dir, this.swordKnock(game, KNOCK_SPIN), this);
      }
    }
    const [card, diag] = SPIN_STEP_FRAMES;
    const into = t % (card + diag);
    if (into === 0 || into === card) this.cutAt(game, k);
    if (this.spinning === 0) this.cutAt(game, 8);
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
    this.vz -= JUMP_GRAVITY;
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

  /**
   * Pick up whatever is in front. Returns true only if something was actually
   * lifted — it is a CONTEXT action now, so a failed lift has to fall through
   * to the item on the A button rather than swallowing the press.
   */
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
        this.beginLift();
        game.audio.sfx('lift');
        return true;
      }
    }
    const got = game.liftTile(tx, ty, level, this);
    if (got) { this.carrying = got; this.beginLift(); game.audio.sfx('lift'); return true; }
    return false;
  }

  throwCarried(game) {
    const c = this.carrying;
    if (!c) return false;
    this.carrying = null;
    this.liftT = 0;
    c.carried = false;
    const [dx, dy] = DIR_VEC[this.dir];
    // A lifted pot, rock or bush flies Seasons' own arc from where it was held
    // (itemBeginThrow, S157). It used to take the bomb branch below, which set
    // a slide velocity ThrownObject never reads and left it at height 0, so it
    // broke at Link's feet on the next frame and never travelled.
    const n = LIFTED_THROW_NUDGE, v = LIFTED_THROW_SPEED;
    // Anything that flies Seasons' arc as itself says so with `launch`: a
    // lifted pot, and the Kilnshell (S160), which lands still burning.
    if (c instanceof ThrownObject || typeof c.launch === 'function') {
      c.launch(this.x + dx * n, this.y + dy * n, dx * v, dy * v, CARRY_HEIGHT);
    } else {
      c.remove = true;
      game.addEntity(new ThrownObject(this.x + dx * n, this.y + dy * n, {
        sprite: c.sprite || 'rock16', pal: c.pal || 'stone', tileArt: c.tileArt || null,
        vx: dx * v, vy: dy * v, z: CARRY_HEIGHT, drops: c.dropTable || 'none',
      }));
    }
    game.audio.sfx('throw');
    return true;
  }

  dropCarried(game) {
    if (!this.carrying) return;
    const c = this.carrying;
    this.carrying = null;
    this.liftT = 0;
    c.carried = false;
    c.remove = true;
    game.spawnEffect('splash', c.x, c.y);
  }

  // --------------------------------------------------------- Squall Bellows
  //
  // Held, like the Lens, and like the Lens it is `use`d every frame the button
  // is down. Unlike the Lens it changes the world: while the cone is open the
  // water inside it stands one tide level lower than the rest of the room, and
  // everything that asks what the tide is doing AT A TILE sees that — the
  // player's own footing, an enemy's footing, and the renderer.
  //
  // Three things make it a tool rather than a second conch:
  //
  //   * it costs your movement, so the cone is somewhere you are NOT going
  //   * it is directional, so you choose which half of a room to drain
  //   * it lasts exactly as long as you hold it, so anything that has to cross
  //     the drained water has to be something other than you — a raft, a
  //     pushed block, a thrown Reefseed
  //
  // The cone is an ORDINARY LOCAL OVERRIDE in the tide field — the same list
  // the Tidewright's Anchor lays into — with two things the Anchor does not
  // use: a `cone` footprint, and a `delta` rather than an absolute level, so
  // the cone follows the conch instead of holding out against it. It is
  // removed the frame the button comes up. Because it is a real override, the
  // room's own renderer draws the drained wedge through the field and the
  // field's stamp invalidates the cache; there is no separate draw path.

  updateBellows(game) {
    const on = this.bellowsHeld && !this.inDeep && !this.underwater
      && this.swinging === 0 && this.spinning === 0 && !this.carrying
      && !game.tide.busy;
    if (!on) { this.stopBellows(game); return; }

    this.bellowsT++;
    this.bellowsOpen = this.bellowsT >= BELLOWS_WARMUP_FRAMES;
    if (this.bellowsT === 1) game.audio.sfx('conch');
    if (!this.bellowsOpen) { this.releaseHold(game); return; }

    const [dx, dy] = DIR_VEC[this.dir];
    const ox = Math.floor(this.cx / TILE), oy = Math.floor(this.cy / TILE);
    const o = this.bellowsHold != null ? game.tide.overrideById(this.bellowsHold) : null;
    if (!o) {
      this.bellowsHold = game.tide.addOverride({
        mapId: game.mapId, roomKey: game.room ? game.room.key : null,
        tx: ox, ty: oy, r: BELLOWS_RANGE, delta: -1, dx, dy, shape: 'cone', src: 'bellows',
      });
    } else if (o.tx !== ox || o.ty !== oy || o.dx !== dx || o.dy !== dy) {
      // Turning re-aims the cone. `touch()` is what tells the room's cached
      // render that the drained wedge moved — miss it and the water is drawn
      // in the old place while collision uses the new one, silently.
      o.tx = ox; o.ty = oy; o.dx = dx; o.dy = dy;
      game.tide.touch();
    }

    if (this.bellowsT % BELLOWS_PUFF_EVERY === 0) {
      game.spawnEffect('foam', this.cx - 8 + dx * 14, this.cy - 8 + dy * 14, { life: 14 });
      game.audio.sfx('gust');
    }
    this.gust(game, dx, dy);
  }

  /** Shove what the gust can shove: light enemies, rafts, and wheels. */
  gust(game, dx, dy) {
    const o = this.bellowsHold != null ? game.tide.overrideById(this.bellowsHold) : null;
    if (!o) return;
    for (const e of game.entities) {
      if (e === this || e.dead || e.hidden) continue;
      const tx = Math.floor(e.cx / TILE), ty = Math.floor(e.cy / TILE);
      // The same footprint the water uses, asked of the field that owns it —
      // so what the gust blows and what it drains can never disagree.
      if (!game.tide.covers(o, tx, ty)) continue;
      if (e.onGust) { e.onGust(game, dx, dy); continue; }
      if (e.isEnemy && e.light) {
        moveEntity(game, e, dx * BELLOWS_PUSH, dy * BELLOWS_PUSH, { jumping: true, swim: true });
        e.stun = Math.max(e.stun, 6);
      }
    }
  }

  stopBellows(game) {
    if (this.bellowsT === 0 && this.bellowsHold == null) { this.bellowsOpen = false; return; }
    this.bellowsT = 0;
    this.bellowsOpen = false;
    this.releaseHold(game);
  }

  releaseHold(game) {
    if (this.bellowsHold == null) return;
    game.tide.removeOverride(this.bellowsHold);
    this.bellowsHold = null;
    // The water comes back, and it may come back on top of you.
    this.reconcileWithTide(game);
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
    this.sinkT = game.charm('pressureScar')
      ? Math.max(1, Math.round(SINK_ENTER_FRAMES * PRESSURE_SCAR_FACTOR))
      : SINK_ENTER_FRAMES;
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
    //
    // TOUCHING, NOT CENTRED, for the same reason the dive above uses it: these
    // two tests have to agree or they fight each other. With `inDeep` here, a
    // player who dived at the lip of a channel — his box in the water, his
    // middle not yet — surfaced on the very next frame, dived again because the
    // soles were still drinking, and stood in the doorway of the Bogwater Drain
    // splashing once a frame for ever. One question, one rule.
    if (!touchingDeep(game, this)) { this.surface(game, false); return; }
    if (this._cleats >= 2) return;            // Mermaid Suit: unlimited
    if (game.charm('gillcarve')) return;      // and so is a Gillcarve
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
    const cf = game.charm('bosunsWhistle')
      ? Math.max(1, Math.round(CONCH_FRAMES * BOSUN_FACTOR)) : CONCH_FRAMES;
    this.conchTime = cf;
    this.frozen = cf;
    game.audio.sfx('conch');
    game.tide.cycle();
    game.onConchPlayed();
    return true;
  }

  /**
   * Strandwalker: a quarter-heart every STRANDWALKER_EVERY frames, but only
   * with both feet on dry ground — not wading, not swimming, not on the floor
   * of the sea. It is the LOW case's reward for staying out of the water,
   * which is the only place the LOW case is awake anyway.
   */
  updateStrandwalker(game) {
    if (!game.charm('strandwalker')) { this._strandT = 0; return; }
    if (this.inShallow || this.inDeep || this.underwater) { this._strandT = 0; return; }
    const p = game.progress;
    if (p.hearts >= p.maxHearts) { this._strandT = 0; return; }
    this._strandT = (this._strandT || 0) + 1;
    if (this._strandT < STRANDWALKER_EVERY) return;
    this._strandT = 0;
    p.hearts = Math.min(p.maxHearts, p.hearts + 1);
    game.audio.sfx('heart');
  }

  // ---------------------------------------------------------------- damage

  updateContactDamage(game) {
    if (this.invuln > 0 || this.invincible) return;
    for (const e of game.entities) {
      // A CORPSE MID-COLLAPSE IS NOT A THREAT. `dying` is the stretch a killed
      // enemy is thrown by its killing blow (S165) and a boss explodes in
      // before it is gone — `dead` is still false for all of it, so without
      // this an enemy went on dealing full contact damage after it was beaten
      // (Seasons clears its collisions at zero health). That is not what the source games do and it is not
      // what the animation reads as: the thing is visibly finished. It cost a
      // playthrough — the actor walked through the wreckage of what it had
      // just killed in D1's Tide Gallery and died to it.
      if (!e.isEnemy || e.dead || e.dying || e.harmless || e.dormant || e.hidden) continue;
      if (e.damage <= 0) continue;
      // A stunned enemy does not hurt to touch: the cartridge skips Link's
      // check while its stunCounter runs (code/collisionEffects.s,
      // enemyCheckCollisions @checkHitLink).
      if (e.stun > 0) continue;
      if (this.z > 6 && !e.flying) continue;      // jumped over it
      // The cartridge's rule: Link's 12x12 against the enemy's own box, both
      // on the middle of the sprite — not the two walking footprints.
      if (!rectOverlap(this.contactRect(), e.contactRect())) continue;
      // "Sea creature" is the enemy's own terrain field, not where it happens
      // to be standing: a crab hauled onto dry land by the tide is still what
      // the Anemone's Gift protects you from.
      // What touching it does besides hurt: a gel latches on, a bubble takes
      // the sword. Called whether or not the hit lands, as the cartridge
      // reacts to the collision itself (var2a = ITEMCOLLISION_LINK).
      if (e.spec && e.spec.onTouchLink) e.spec.onTouchLink(e, game, this);
      if (e.harmless) break;
      this.takeDamage(game, e.damage, e, { aquatic: e.terrain === 'water' });
      break;
    }
  }

  /** Charm and shield modifiers applied here so every damage source respects them. */
  takeDamage(game, amount, source, o = {}) {
    if (this.invuln > 0 || this.invincible || this.falling > 0 || this.washing > 0) return false;
    const p = game.progress;

    // Shield blocks damage from the facing direction (projectiles and contact).
    if (this.shielding && source) {
      const dir = dirFromDelta(source.cx - this.cx, source.cy - this.cy);
      if (dir === this.dir) {
        // Something the shield TURNS rather than stops: Seasons' spiked
        // beetle flips over on any shield (spikedBeetle.s, ITEMCOLLISION_L1-
        // L3_SHIELD), whatever the shield's level.
        if (!source.isProjectile && source.spec && source.spec.onShielded) {
          game.audio.sfx('block');
          source.spec.onShielded(source, game, this);
          return false;
        }
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

    // The Hagstone: a quarter of hits pass straight through. Rolled off the
    // ROOM stream, not the global one, so a room replays identically — see
    // src/core/rng.js.
    if (game.charm('hagstone') && game.rng.float() < HAGSTONE_CHANCE) {
      game.audio.sfx('block');
      game.spawnEffect('spark', this.cx - 8, this.cy - 8);
      this.invuln = PLAYER_INVULN_FRAMES;
      return false;
    }
    // Barnacle Skin eats one hit per room and then cracks. `barnacleUsed` is
    // reset on room entry, which is what "per room" means here.
    if (game.charm('barnacleSkin') && !this.barnacleUsed) {
      this.barnacleUsed = true;
      game.audio.sfx('block');
      game.spawnEffect('spark', this.cx - 8, this.cy - 8);
      this.invuln = PLAYER_INVULN_FRAMES;
      this.flicker = PLAYER_FLICKER_FRAMES;
      return false;
    }

    let dmg = amount;
    if (o.aquatic && game.charm('anemonesGift')) dmg = Math.max(1, Math.round(dmg * 0.5));
    if (o.hazard && game.charm('brineSkin')) dmg = Math.max(1, Math.round(dmg * 0.5));
    if (game.charm('wrackbone')) dmg = Math.round(dmg * 2);

    // Past every block, charm and shield: something has actually hit Link.
    game.freeze(HITSTOP_HURT_FRAMES);
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
      // The cartridge's shove: a fixed speed for a fixed count of frames.
      // The Ballast Heart halves the count, as Seasons' Steadfast Ring halves
      // knockbackCounter — half the distance at the same speed.
      const per = PLAYER_KNOCK_SPEED;
      this.knockX = Math.round(dx / d * per);
      this.knockY = Math.round(dy / d * per);
      this.knockTime = game.charm('ballastHeart') ? PLAYER_KNOCK_FRAMES >> 1 : PLAYER_KNOCK_FRAMES;
    } else {
      this.knockX = 0; this.knockY = 0; this.knockTime = 0;
    }
    this.charge = 0;
    this.holding = false; this.holdT = 0; this.poking = 0;
    if (this.carrying) this.dropCarried(game);
    game.audio.sfx('linkHurt');
    // No screen shake: Seasons holds the view dead still when Link is hit
    // (measured, see PLAYER_HURT_FLASH_BEAT). The red flash is the whole tell.
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
      this.takeDamage(game, PIT_DAMAGE, null, { noKnockDir: true, hazard: true });
      this.invuln = PLAYER_RECOVER_INVULN_FRAMES;
      this.hurtTime = RESPAWN_HOLD_FRAMES;
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
      this.hurtTime = RESPAWN_HOLD_FRAMES;
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

    // Dying (S169): Seasons' spin where he fell, then collapsed.
    if (game && game.mode === 'gameover' && !(game.deathKnock > 0)) {
      const pose = game.deathPose();
      if (!pose) { this.flipX = false; return 'link_lie'; }
      this.flipX = pose === 'left';
      return 'link_walk_' + (pose === 'left' || pose === 'right' ? 'side' : pose) + '_0';
    }
    if (this.falling > 0) {
      const t = FALL_FRAMES - this.falling;
      const [a, b] = FALL_ANIM_FRAMES;
      return 'link_fall_' + (t < a ? 0 : t < a + b ? 1 : 2);
    }
    // Spinning, he faces each cardinal in turn for its position and the
    // diagonal after it, in the full-reach body moved forward (see draw):
    // Seasons' LINK_ANIM_MODE_28..2b, frames $18-$1b, which are $b0+direction
    // through the same oam layouts as $b4.
    if (this.spinning > 0) {
      const d = SPIN_FACING[this.spinPos() >> 1];
      this.flipX = d === 'left';
      return 'link_swing1_' + (d === 'left' || d === 'right' ? 'side' : d);
    }
    // Holding up something just got: Seasons' own pose, facing the viewer.
    const shown = game && game.itemShow;
    if (shown && shown.hands && !shown.chest) { this.flipX = false; return 'link_get_' + shown.hands; }
    if (this.conchTime > 0) return 'link_conch_' + key;
    if (this.bellowsT > 0) return 'link_push_' + key;
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
    // Seasons' swing is two bodies: the wind-up ($ac+direction) on its first
    // phase, then $b0+direction, which the poke is all of (LINK_ANIM_MODE_22
    // and _1f). The lunge on full reach is a move, not a picture: see draw.
    if (this.swinging > 0 || this.poking > 0) {
      return (this.bladePhase() === 0 ? 'link_swing0_' : 'link_swing1_') + key;
    }
    if (this.carrying) return 'link_carry_' + key;
    // Holding the sword he walks in his own frames, never the push pose:
    // getLinkWalkingAnimation skips it while turning is disabled.
    if (this.againstWall && !this.holding) return 'link_push_' + key;
    const moving = this._lastDx || this._lastDy;
    if (!moving) return 'link_walk_' + key + '_0';
    return 'link_walk_' + key + '_' + (Math.floor(this.animT / 7) % 2);
  }

  draw(ctx, game, ox, oy) {
    const p = game.progress;
    const bodyPal = (this.inDeep || this.underwater) ? 'linkswim' : (game.linkPal || 'link');
    let pal = bodyPal;
    // STRUCK, HE FLASHES RED; he never leaves the screen. Seasons swaps his
    // colours for the hit palette on alternate PLAYER_HURT_FLASH_BEAT-frame
    // beats, starting red on the frame the hit lands (measured).
    if (this.flicker > 0
      && Math.floor((PLAYER_FLICKER_FRAMES - this.flicker) / PLAYER_HURT_FLASH_BEAT) % 2 === 0) {
      pal = 'linkhurt';
    }
    const name = this.spriteName(game);

    // Wading and swimming hide the lower part of the sprite behind the water line.
    let cropH = null;
    if (this.underwater || this.sinkT > 0) cropH = null;   // fully below the surface
    else if (this.inDeep) cropH = 11;
    else if (this.inShallow && this.z <= 1) cropH = 13;

    let ax = 0, ay = 0;
    const dy = oy + this.y - this.z;

    // THE SWORD, drawn first because Seasons draws it behind him (see
    // SWORD_PIC): the picture for this phase of the swing or this position of
    // the spin, centred where the cartridge stands the sword object — or,
    // held, the swing's last phase (HELD_PHASE). In his own colours, not his
    // hurt flash — it is its own object on hardware. CHARGED, IT FLASHES:
    // Seasons' palette 5 on alternate CHARGE_FLASH_BEAT-frame beats from the
    // frame it charges (sword.s @state3).
    const phase = this.bladePhase();
    let pic = -1, arc = null, swordPal = bodyPal;
    if (this.spinning > 0) { pic = this.spinPos(); arc = SPIN_ARC[pic]; }
    else if (phase >= 0) { pic = SWORD_PIC[this.dir][phase]; arc = SWORD_ARC[this.dir][phase]; }
    else if (this.holding) {
      pic = SWORD_PIC[this.dir][HELD_PHASE]; arc = SWORD_ARC[this.dir][HELD_PHASE];
      if (this.charge >= CHARGE_FRAMES
        && Math.floor((this.charge - CHARGE_FRAMES) / CHARGE_FLASH_BEAT) % 2 === 0) swordPal = 'swordflash';
    }
    if (pic >= 0) {
      sprites.draw(ctx, 'fx_sword_' + pic, ox + this.x + 8 + arc[3] - 16,
        dy + 8 + arc[2] - SWORD_Z - 16, { pal: swordPal });
    }
    // The full-reach lunge: the swing's third phase and the poke's first.
    const lunge = this.spinning > 0 ? SWING_LUNGE[SPIN_FACING[pic >> 1]]
      : phase === 2 ? SWING_LUNGE[this.dir] : null;
    if (lunge) { ax += lunge[0]; ay += lunge[1]; }

    // The wading crop is a water line in room space; inside a taller frame it
    // sits `ay` lower, because that is how much of the frame is above Link.
    sprites.draw(ctx, name, ox + this.x + ax, dy + ay,
      { pal, flipX: this.flipX, h: cropH == null ? null : cropH - ay });

    if (this.shielding) {
      const side = this.dir === 'left' || this.dir === 'right';
      const key = side ? 'side' : this.dir;
      sprites.draw(ctx, 'link_shield_' + key, ox + this.x, dy, { pal: 'ui', flipX: this.flipX });
    }
    if (this.inDeep && !this.underwater) {
      sprites.draw(ctx, 'fx_ripple0', ox + this.x, oy + this.y + 6, { pal: 'water' });
    }
    // The Resonance Rod's note, drawn as an expanding ring at the radius it
    // actually reached — so the tide doubling the range is something you SEE
    // rather than something the manual tells you.
    if (this.rodRing > 0 && this.rodRange > 0) {
      const t = 1 - this.rodRing / ROD_RING_FRAMES;
      ctx.save();
      ctx.globalAlpha = (1 - t) * 0.9;
      ctx.strokeStyle = '#ffe8a0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(ox + this.cx, oy + this.cy, Math.max(1, t * this.rodRange), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}

export function swordDamage(level) {
  return level >= 3 ? 6 : (level >= 2 ? 4 : 2);
}

/**
 * Does this room have any dry ground in it right now? Salt-Etched's condition,
 * and the reason it is a LOW-case charm that is nonetheless not "at LOW tide"
 * — a room that keeps a spit of sand at HIGH still counts, which is what makes
 * the charm worth reading rather than assuming.
 *
 * Asked of the FIELD, so an anchored patch of dry floor counts too. Cached per
 * room per field stamp: a swing asks it, and eighty tile lookups per swing is
 * eighty too many.
 */
export function roomHasDryGround(game) {
  const room = game.room;
  if (!room) return false;
  const stamp = game.tide.stamp + ':' + game.tide.level;
  if (room._dryStamp === stamp) return room._dryCached;
  let dry = false;
  for (let y = 0; y < room.th && !dry; y++) {
    for (let x = 0; x < room.tw; x++) {
      const f = room.flagsAt(x, y, game.tide);
      if (f & (F.WATER | F.DEEP | F.SOLID | F.PIT)) continue;
      dry = true; break;
    }
  }
  room._dryStamp = stamp;
  room._dryCached = dry;
  return dry;
}

function rectOverlap(a, b) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

function dirFromDelta(dx, dy) {
  if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? 'left' : 'right';
  return dy < 0 ? 'up' : 'down';
}
