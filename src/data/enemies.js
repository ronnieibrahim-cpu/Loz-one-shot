// Enemy roster. See game/enemy.js for the definition contract and AI toolkit.
// Damage values are in quarter-hearts (2 = half a heart).

import { defineEnemy } from '../game/enemy.js';
import {
  wander, chase, flee, patrol, bounceDiag, hop, charge, orbit, submerge,
  shoot, shootRing, every, timer, aligned, facePlayer, distToPlayer,
  driftWithTide, beginStep, advanceStep, OPPOSITE,
  randDir, walkOn, randomCardinal, cardinalToward, angleToward, moveAngle, launch, fall, flyAngle, dirOfAngle, centeredWith, bounceAngle, linkWithin, nudgeAngle,
} from '../game/enemy.js';
import { spawnEntity, canOccupy } from '../game/entity.js';
import { fire } from '../game/projectile.js';
import { F } from '../world/tileset.js';
import { TILE } from '../core/screen.js';
import { ENEMY_GRID_STEP, ENEMY_ATTACK_FRAMES, BEAM_SHOT_RADIUS } from './feel.js';
import {
  OCTOROK_SPEED, OCTOROK_STAND_FRAMES, OCTOROK_WALK_FRAMES, OCTOROK_SHOOT_MASK,
  OCTOROK_SHOOT_WINDUP, OCTOROK_SHOOT_REST, OCTOROK_TURN_TO_LINK, OCTOROK_SHOT_SPEED,
  CRAB_SPEED_SIDE, CRAB_SPEED_UPDOWN, CRAB_WALK_FRAMES,
  HOP_ODDS_MASK, SLIME_HOP_SPEED, SLIME_HOP_LAUNCH, SLIME_HOP_GRAVITY,
  ZOL_HOLD_FRAMES, ZOL_SLIDE_SPEED, ZOL_SLIDE_FRAMES, ZOL_SHAKE_FRAMES, ZOL_SPLIT_OFFSET,
  GEL_HOLD_FRAMES, GEL_INCH_SPEED, GEL_INCH_FRAMES, GEL_SHAKE_FRAMES,
  KEESE_SPEED, KEESE_FIRST_REST, KEESE_FLIGHT_BASE, KEESE_FLIGHT_SPAN, KEESE_VEER_ODDS,
  LEEVER_SPEED, LEEVER_UNDER_FRAMES, LEEVER_SURFACE_TILES, LEEVER_RISE_FRAMES, LEEVER_SINK_FRAMES,
  LEEVER_CHASE_BASE, LEEVER_CHASE_MASK,
  BUBBLE_SPEED, BUBBLE_TURN_ODDS,
  BEETLE_WALK_SPEED, BEETLE_WALK_FRAMES, BEETLE_SEE_PX, BEETLE_CHARGE_COUNT, BEETLE_CHARGE_GAIN,
  BEETLE_CHARGE_MAX, BEETLE_STAND_FRAMES,
  WHISP_SPEED,
  PINCER_SEE_PX, PINCER_WARN_FRAMES, PINCER_OUT_SPEED, PINCER_REACH, PINCER_HOLD_FRAMES,
  PINCER_BACK_SPEED, PINCER_REST_FRAMES,
  WIZZROBE_PHASE_IN_FRAMES, WIZZROBE_STAND_FRAMES, WIZZROBE_FIRE_AT, WIZZROBE_OUT_FRAMES,
  WIZZROBE_GONE_FRAMES, WIZZROBE_SHOT_SPEED,
  DARKNUT_SPEED, DARKNUT_WALK_BASE, DARKNUT_WALK_MASK, DARKNUT_SEE_PX, DARKNUT_CHASE_COOLDOWN,
  DARKNUT_SQUARE_FRAMES, DARKNUT_CHASE_FRAMES, DARKNUT_CHASE_SPEED,
  STALFOS_SPEED, STALFOS_WALK_BASE, STALFOS_WALK_MASK, STALFOS_TOWARD_ODDS, STALFOS_SHY_PX,
  STALFOS_LEAP_LAUNCH, STALFOS_LEAP_GRAVITY, STALFOS_LEAP_SPEED,
  MOBLIN_SPEED, MOBLIN_WALK_BASE, MOBLIN_WALK_MASK, MOBLIN_PAUSE_FRAMES, MOBLIN_SPEAR_SPEED,
  TEKTITE_SPEED, TEKTITE_STAND_MASK, TEKTITE_STAND_MIN, TEKTITE_CROUCH_FRAMES, TEKTITE_SMALL_LEAP, TEKTITE_BIG_LEAP,
  BEAMOS_TURN_FRAMES, BEAMOS_FIRE_FRAMES, BEAMOS_BEAM_PIECES, BEAMOS_BEAM_SPEED, BEAMOS_COOLDOWN,
  KEESE_GLIDE_FRAMES, KEESE_SLOW_SPEEDS, KEESE_SLOW_BEAT, KEESE_STOP_FRAMES, KEESE_REST_BASE, KEESE_REST_SPAN,
} from './feel.js';

export function installEnemies() {
  // --- Octorok: wanders and spits rocks along its facing axis -------------
  defineEnemy('octorok', {
    hp: 2, damage: 2, pal: 'enemyg', rate: 11,
    // The sea octorok's flinch, shared: the two draw from the same four
    // sheet frames, so the land one squints the same way. hp 2 means a
    // level-1 sword kills it outright; a chain or a held blade shows it.
    hurtFrame: 'octorokSea_hurt',
    frames: {
      down: ['octorok_d0', 'octorok_d1'],
      up: ['octorok_u0', 'octorok_u1'],
      side: ['octorok_s0', 'octorok_s1'],
    },
    deathFrame: 'octorok_death',
    attackFrame: 'octorok_atk',
    hb: { x: 2, y: 5, w: 12, h: 10 },
    drops: 'common',
    // Seasons' red octorok (octorok.s): walk a while, then usually stand and
    // sometimes stop to spit a rock the way it is facing; set off again in a
    // random direction, one time in four toward Link. Nothing aims the rock.
    port: 'octorok.s',
    speed: OCTOROK_SPEED,
    ai(e, g) {
      switch (e.aiState) {
        case 0:                                   // octorok_state_uninitialized
          e.dir = randDir(g);
          e.aiTimer = OCTOROK_WALK_FRAMES[g.rng.int(4)];
          e.aiState = 'walk';
          return;
        case 'walk':                              // state $0a
          e.still = false;
          if (--e.aiTimer <= 0) { e.aiState = 'decide'; return; }
          if (!walkOn(e, g, OCTOROK_SPEED)) randomCardinal(e, g);
          return;
        case 'decide': {                          // state $08
          e.still = true;
          const roll = g.rng.int(256) & OCTOROK_SHOOT_MASK;
          if (roll === 0) { e.aiState = 'windup'; e.aiTimer = OCTOROK_SHOOT_WINDUP; }
          else { e.aiState = 'stand'; e.aiTimer = OCTOROK_STAND_FRAMES[roll]; }
          return;
        }
        case 'stand':                             // state $09
          if (--e.aiTimer > 0) return;
          e.aiState = 'walk';
          e.aiTimer = OCTOROK_WALK_FRAMES[g.rng.int(4)];
          e.dir = randDir(g);
          if (g.rng.int(OCTOROK_TURN_TO_LINK) === 0) cardinalToward(e, g);
          return;
        case 'windup':                            // state $0b
          if (--e.aiTimer > 0) return;
          e.aiState = 'stand'; e.aiTimer = OCTOROK_SHOOT_REST;
          shoot(e, g, { sprite: 'shot_rock', speed: OCTOROK_SHOT_SPEED, damage: 2, aim: false });
          return;
      }
    },
  });

  // --- Sea Octorok: the aquatic cousin, only present at higher tides ------
  defineEnemy('octorokSea', {
    hp: 3, damage: 2, pal: 'enemyb', speed: 0.5, rate: 10, terrain: 'water',
    frames: {
      down: ['octorok_d0', 'octorok_d1'],
      up: ['octorok_u0', 'octorok_u1'],
      side: ['octorok_s0', 'octorok_s1'],
    },
    hurtFrame: 'octorokSea_hurt',
    // Reuses octorok's own deathFrame on purpose rather than drawing a second
    // one: octorokSea's frames: block above names the exact same sprite keys
    // (octorok_d0/d1/u0/u1/s0/s1) as land octorok, so the two are already the
    // same creature on screen while alive. Giving them different corpses
    // would be the first place they diverged for no visible reason; a
    // squashed, flattened silhouette reads as "this creature collapsed"
    // regardless of what it collapsed onto, so nothing about octorok_death's
    // shape actually claims dry land specifically.
    deathFrame: 'octorok_death',
    // Reuses octorok's own attackFrame too, same reasoning as the deathFrame
    // reuse just above: octorokSea shares octorok's exact living frames, so
    // it's already the same creature on screen right up until it fires.
    // octorokSea's own projectile is shot_bubble, not shot_rock — a real
    // difference, checked rather than assumed identical — but octorok_atk
    // only depicts the mouth opening, not the projectile inside it, so
    // nothing about that pose actually claims "rock" specifically; a second
    // hand-drawn pose here would only diverge for a difference the sprite
    // itself never shows.
    attackFrame: 'octorok_atk',
    drops: 'common',
    tideOnly: [1, 2],
    ai(e, g) {
      wander(e, g, { turnChance: 0.02 });
      if (every(e, 60) && distToPlayer(e, g) < 90) {
        shoot(e, g, { sprite: 'shot_bubble', pal: 'water', speed: 1.4, aim: true, damage: 2 });
      }
    },
  });

  // --- Crab: scuttles sideways, shielded from the front -------------------
  defineEnemy('crab', {
    hp: 2, damage: 2, pal: 'enemyr', rate: 8,
    frames: ['crab_0', 'crab_1'],
    hurtFrame: 'crab_hurt',
    deathFrame: 'crab_death',
    hb: { x: 1, y: 6, w: 14, h: 9 },
    terrain: 'shallow',
    shield: 'front',
    drops: 'common',
    // Seasons' sand crab (sandCrab.s): never stops; picks a direction and a
    // stretch, scuttles fast sideways and slowly up and down, and picks again
    // when the stretch ends or something stops it. Its shield faces its way.
    port: 'sandCrab.s',
    speed: CRAB_SPEED_SIDE,
    ai(e, g) {
      if (e.aiState !== 'walk') {                 // state 8
        e.dir = randDir(g);
        e.aiTimer = CRAB_WALK_FRAMES[g.rng.int(CRAB_WALK_FRAMES.length)];
        e.speed = (e.dir === 'left' || e.dir === 'right') ? CRAB_SPEED_SIDE : CRAB_SPEED_UPDOWN;
        e.aiState = 'walk';
        return;
      }
      if (--e.aiTimer <= 0 || !walkOn(e, g, e.speed)) e.aiState = 'pick';   // state 9
    },
  });

  // --- Zol: a slime that splits when struck ------------------------------
  defineEnemy('zol', {
    light: true,
    hp: 2, damage: 2, pal: 'slime', rate: 14,
    frames: ['zol_0', 'zol_1'],
    hurtFrame: 'zol_hurt',
    deathFrame: 'zol_death',
    // Reuses zol's own zol_1 as its attackFrame — a real shape change from
    // zol_0 (short and wide vs. tall and narrow), already described in
    // rip-enemies.py's own FRAMES comment as "round at rest, stretched tall
    // mid-hop". hop()'s own new windup window (src/game/enemy.js, the last
    // ENEMY_ATTACK_FRAMES of the wait) reads naturally as the same
    // creature stretching upward right before it springs — the ordinary
    // idle cycle already shows this frame some of the time, but the
    // windup now shows it FOR CERTAIN in the run-up to every hop, rather
    // than at random.
    attackFrame: 'zol_1',
    hb: { x: 3, y: 6, w: 10, h: 9 },
    terrain: 'any',
    drops: 'common',
    // Seasons' red zol (zol.s, subid 1): holds, then slides at Link for a
    // moment; one time in eight it shivers and hops at him instead.
    port: 'zol.s',
    speed: ZOL_SLIDE_SPEED,
    ai(e, g) {
      switch (e.aiState) {
        case 0: e.aiState = 'hold'; e.aiTimer = ZOL_HOLD_FRAMES; return;
        case 'hold':                              // subid01 state 8
          e.speed = ZOL_SLIDE_SPEED;
          if (--e.aiTimer > 0) return;
          if ((g.rng.int(256) & HOP_ODDS_MASK) === 0) {
            e.aiState = 'shake'; e.aiTimer = ZOL_SHAKE_FRAMES; e.attackTime = ZOL_SHAKE_FRAMES;
          } else {
            e.aiState = 'slide'; e.aiTimer = ZOL_SLIDE_FRAMES; e.angle = angleToward(e, g);
          }
          return;
        case 'slide':                             // state 9
          moveAngle(e, g, e.angle, ZOL_SLIDE_SPEED);
          if (--e.aiTimer <= 0) { e.aiState = 'hold'; e.aiTimer = ZOL_HOLD_FRAMES; }
          return;
        case 'shake':                             // state $0a
          if (--e.aiTimer > 0) return;
          e.aiState = 'hop'; e.angle = angleToward(e, g); e.speed = SLIME_HOP_SPEED;
          launch(e, SLIME_HOP_LAUNCH);
          if (g.audio) g.audio.sfx('hop');
          return;
        case 'hop':                               // state $0b
          moveAngle(e, g, e.angle, SLIME_HOP_SPEED);
          if (!fall(e, SLIME_HOP_GRAVITY)) { e.aiState = 'hold'; e.aiTimer = ZOL_HOLD_FRAMES; }
          return;
      }
    },
    onDie(e, g) {
      // Splits into two gels, unless this zol was itself a split, four pixels
      // either side of where it stood (zol_spawnGel).
      if (e.opts.split) return;
      for (const dx of [-ZOL_SPLIT_OFFSET, ZOL_SPLIT_OFFSET]) {
        spawnEntity(g, 'gel', (e.x + dx) / TILE, e.y / TILE, { split: true });
      }
    },
  });

  defineEnemy('gel', {
    light: true,
    hp: 1, damage: 1, pal: 'slime', rate: 10,
    frames: ['gel_0', 'gel_1'],
    // Present for completeness and never drawn today: at hp 1 every hit is
    // the killing one, and the death pose outranks the flinch.
    hurtFrame: 'gel_hurt',
    // hp 1, deliberately: deathFrame has no hp-vs-swordDamage() constraint
    // (unlike hurtFrame, which gel was ruled out for in S12) — die() defers
    // removal on the hit that reaches hp 0 regardless of how many hits that
    // took. See src/game/enemy.js's Enemy.die() and docs/prompts/LEDGER.md.
    deathFrame: 'gel_death',
    w: 16, h: 16,
    hb: { x: 5, y: 8, w: 6, h: 7 },
    // The cartridge's gel is 2x2 either way of its middle (oracles-disasm
    // data/seasons/enemyData.s, ENEMY_GEL -> extraEnemyData row 0x06), set
    // on the middle of the blob as the sheet draws it in this cell.
    hurtBox: { x: 4, y: 5, w: 4, h: 4 },
    terrain: 'any',
    drops: 'none',
    // Seasons' gel (gel.s): stands, then inches at Link; one time in eight it
    // shivers and hops at him. (The cartridge's gel also clings to Link and
    // slows him; not ported — see docs/NEXT-SESSION.md S151.)
    port: 'gel.s',
    speed: GEL_INCH_SPEED,
    ai(e, g) {
      switch (e.aiState) {
        case 0: e.aiState = 'hold'; e.aiTimer = GEL_HOLD_FRAMES; return;
        case 'hold':                              // gel_state8
          e.speed = GEL_INCH_SPEED;
          if (--e.aiTimer > 0) return;
          if ((g.rng.int(256) & HOP_ODDS_MASK) === 0) {
            e.aiState = 'shake'; e.aiTimer = GEL_SHAKE_FRAMES;
          } else {
            e.aiState = 'inch'; e.aiTimer = GEL_INCH_FRAMES; e.angle = angleToward(e, g);
          }
          return;
        case 'inch':                              // gel_state9
          moveAngle(e, g, e.angle, GEL_INCH_SPEED);
          if (--e.aiTimer <= 0) { e.aiState = 'hold'; e.aiTimer = GEL_HOLD_FRAMES; }
          return;
        case 'shake':                             // gel_stateA
          if (--e.aiTimer > 0) return;
          e.aiState = 'hop'; e.angle = angleToward(e, g); e.speed = SLIME_HOP_SPEED;
          launch(e, SLIME_HOP_LAUNCH);
          if (g.audio) g.audio.sfx('hop');
          return;
        case 'hop':                               // gel_stateB
          moveAngle(e, g, e.angle, SLIME_HOP_SPEED);
          if (!fall(e, SLIME_HOP_GRAVITY)) { e.aiState = 'hold'; e.aiTimer = GEL_HOLD_FRAMES; }
          return;
      }
    },
  });

  // --- Keese: erratic flier, ignores terrain -----------------------------
  defineEnemy('keese', {
    light: true,
    hp: 1, damage: 1, pal: 'shadow', rate: 5, terrain: 'air',
    frames: ['keese_0', 'keese_1'],
    // Never drawn today, for the same hp-1 reason as gel's.
    hurtFrame: 'keese_hurt',
    deathFrame: 'keese_death',
    // Reuses keese's own keese_0 as its attackFrame — the sheet's "wings
    // spread" pose vs. keese_1's "wings folded" (rip-enemies.py's own
    // FRAMES comment), a real shape change. keese's own rest/dash cycle
    // below is written directly in its ai() rather than through a shared
    // primitive, but _rest is structurally the same pause-before-a-burst
    // shape charge()'s tell and hop()'s wait both already are — spread
    // wings for a beat before it bursts into its erratic dash reads
    // naturally as "about to move", the same telegraph grammar.
    attackFrame: 'keese_0',
    hb: { x: 3, y: 4, w: 10, h: 8 },
    // The cartridge's keese is 4 tall and 6 wide either way of its middle
    // (oracles-disasm data/seasons/enemyData.s, ENEMY_KEESE -> extraEnemyData
    // row 0x07): a wide, shallow target, wings and all.
    hurtBox: { x: 2, y: 4, w: 12, h: 8 },
    z: 8,
    drops: 'common',
    // Seasons' keese (keese.s, subid 0): rests, then flies off at a random
    // angle over walls and all, now and then veering; after a long flight it
    // glides to a halt, its wings slowing, and rests again. It turns back off
    // the room's edge. Nothing about it aims at Link.
    port: 'keese.s',
    speed: KEESE_SPEED,
    ai(e, g) {
      switch (e.aiState) {
        case 0:                                   // keese_initializeSubid
          e.aiState = 'rest'; e.aiTimer = KEESE_FIRST_REST; e.still = true; return;
        case 'rest':                              // subid00 state 8
          e.still = true;
          if (--e.aiTimer > 0) return;
          e.angle = g.rng.int(32);
          e.speed = KEESE_SPEED;
          e.aiTimer = KEESE_FLIGHT_BASE + g.rng.int(KEESE_FLIGHT_SPAN);
          e.aiState = 'fly'; e.still = false;
          return;
        case 'fly':                               // state 9
          e.angle = flyAngle(e, g, e.angle, e.speed);
          // The flight counter ticks on alternate frames only.
          if (e.tick & 1) return;
          if (--e.aiTimer <= 0) { e.aiState = 'slow'; e.aiTimer = 0; return; }
          if (g.rng.int(KEESE_VEER_ODDS) === 0) e.angle = g.rng.int(32);
          return;
        case 'slow': {                            // state $0a
          const t = e.aiTimer;
          // The new speed is set AFTER this frame's move, as the cartridge
          // orders it, so it is carried to the next frame.
          if (e.nextSpeed != null) { e.speed = e.nextSpeed; e.nextSpeed = null; }
          if (t < KEESE_GLIDE_FRAMES) e.angle = flyAngle(e, g, e.angle, e.speed);
          if ((t & 15) === 0) e.nextSpeed = KEESE_SLOW_SPEEDS[t >> 4];
          // The wings beat slower and slower: keese_updateDeceleration @bits.
          e.still = !!(e.tick & KEESE_SLOW_BEAT[t >> 4]);
          if (++e.aiTimer >= KEESE_STOP_FRAMES) {
            e.aiState = 'rest'; e.still = true;
            e.aiTimer = KEESE_REST_BASE + g.rng.int(KEESE_REST_SPAN);
          }
          return;
        }
      }
    },
  });

  // --- Leever: burrows and surfaces near you -----------------------------
  defineEnemy('leever', {
    hp: 2, damage: 2, pal: 'enemyp', rate: 8,
    frames: ['leever_0', 'leever_1'],
    hurtFrame: 'leever_hurt',
    deathFrame: 'leever_death',
    terrain: 'land',
    drops: 'common',
    // Seasons' leever (leever.s, subid 0): waits underground, then rises three
    // to five tiles ahead of wherever Link is facing, charges him in a
    // straight line, and sinks when its time is up or something is in its
    // way. Harmless and untouchable while under or on its way up or down.
    port: 'leever.s',
    speed: LEEVER_SPEED,
    ai(e, g) {
      const under = () => { e.hidden = true; e.harmless = true; e.invuln = 9999; };
      switch (e.aiState) {
        case 0:                                   // @state_uninitialized
          under(); e.still = true;
          e.aiTimer = LEEVER_UNDER_FRAMES[g.rng.int(4)];
          e.aiState = 'under';
          return;
        case 'under': {                           // @state8
          if (--e.aiTimer > 0) return;
          e.aiTimer = 1;                          // an unusable spot tries again next frame
          const p = g.player;
          if (!p) return;
          const k = g.frame & 3, n = LEEVER_SURFACE_TILES[k];
          const [dx, dy] = { up: [0, -n], down: [0, n], left: [-n, 0], right: [n, 0] }[p.dir] || [0, n];
          const tx = Math.floor(p.cx / TILE) + dx, ty = Math.floor(p.cy / TILE) + dy;
          const x = tx * TILE, y = ty * TILE;
          if (tx < 0 || ty < 0 || x > g.room.pw - TILE || y > g.room.ph - TILE) return;
          if (!canOccupy(g, e, x, y)) return;
          e.x = x; e.y = y;
          e.hidden = false;
          e.aiState = 'rise'; e.aiTimer = LEEVER_RISE_FRAMES;
          return;
        }
        case 'rise':                              // @state9
          if (--e.aiTimer > 0) return;
          e.harmless = false; e.invuln = 0; e.still = false;
          cardinalToward(e, g);
          e.aiTimer = LEEVER_CHASE_BASE + (g.rng.int(256) & LEEVER_CHASE_MASK);
          e.aiState = 'chase';
          return;
        case 'chase':                             // @subid00_stateA
          if (--e.aiTimer > 0 && walkOn(e, g, LEEVER_SPEED)) return;
          e.harmless = true; e.invuln = 9999; e.still = true;
          e.aiState = 'sink'; e.aiTimer = LEEVER_SINK_FRAMES;
          return;
        case 'sink':                              // @stateB
          if (--e.aiTimer > 0) return;
          under();
          e.aiTimer = LEEVER_UNDER_FRAMES[g.rng.int(4)];
          e.aiState = 'under';
          return;
      }
    },
  });

  // --- Bubble: invulnerable drifting hazard ------------------------------
  defineEnemy('bubble', {
    light: true,
    hp: 999, damage: 2, pal: 'spark', rate: 6,
    frames: ['bubble_0', 'bubble_1'],
    // Shown only when the Resonance Rod has rung it and a blow gets through;
    // the death pose is ready but unreachable while hp is 999.
    hurtFrame: 'bubble_hurt',
    deathFrame: 'bubble_death',
    shield: 'all',
    drops: 'none',
    z: 6,
    // Seasons' bubble (bubble.s): moves in the four directions and, whenever
    // it is square on the 8 px grid or stopped by a wall, turns one time in
    // eight. (The cartridge's also takes Link's sword away for three seconds
    // on touch; not ported — see docs/NEXT-SESSION.md S151.)
    port: 'bubble.s',
    speed: BUBBLE_SPEED,
    terrain: 'any',
    ai(e, g) {
      const turn = () => { if (g.rng.int(BUBBLE_TURN_ODDS) === 0) e.dir = randDir(g); };
      if (e.aiState === 0) { e.dir = randDir(g); e.aiState = 'go'; }
      if (e.x % 8 === 0 && e.y % 8 === 0) turn();
      if (!walkOn(e, g, BUBBLE_SPEED)) turn();
    },
  });

  // --- Beamos: static, fires when you are in line ------------------------
  defineEnemy('beamos', {
    hp: 999, damage: 2, pal: 'stonedk', speed: 0, rate: 12,
    frames: ['beamos_0', 'beamos_1'],
    // Same as bubble: the flinch needs the Rod, the death pose waits.
    hurtFrame: 'beamos_hurt',
    deathFrame: 'beamos_death',
    attackFrame: 'beamos_atk',
    shield: 'all',
    terrain: 'any',
    drops: 'none',
    // Seasons' beamos (beamos.s): its eye turns one step of the 32 every five
    // frames, round and round; when it comes onto Link it stops and, for the
    // last ten of twenty frames, fires a beam along that angle, a piece a
    // frame at 8 px a frame. Then forty frames before it can fire again.
    port: 'beamos.s',
    ai(e, g) {
      if (e.aiState === 0) {                      // @state_uninitialized
        e.angle = 0; e.aiTimer = BEAMOS_TURN_FRAMES; e.cool = 0; e.aiState = 'turn';
      }
      if (e.aiState === 'turn') {                 // @state8
        if (--e.aiTimer <= 0) {
          e.aiTimer = BEAMOS_TURN_FRAMES;
          e.angle = (e.angle + 1) & 31;
          e.dir = dirOfAngle(e.angle);
        }
        if (e.cool > 0 && --e.cool > 0) return;
        const d = (angleToward(e, g) - e.angle + 1) & 0xff;
        if (d >= 2) return;
        e.aiState = 'fire'; e.aiTimer = BEAMOS_FIRE_FRAMES; e.attackTime = BEAMOS_FIRE_FRAMES;
        return;
      }
      // @state9
      if (--e.aiTimer <= 0) {
        e.aiTimer = BEAMOS_TURN_FRAMES; e.cool = BEAMOS_COOLDOWN; e.aiState = 'turn';
        return;
      }
      if (e.aiTimer === BEAMOS_BEAM_PIECES + 1 && g.audio) g.audio.sfx('enemyShoot');
      if (e.aiTimer > BEAMOS_BEAM_PIECES) return;
      const r = e.angle / 32 * 2 * Math.PI;
      fire(g, e, { sprite: 'shot_beam', pal: 'enemyr', damage: 2, radius: BEAM_SHOT_RADIUS,
        vx: BEAMOS_BEAM_SPEED * Math.sin(r), vy: -BEAMOS_BEAM_SPEED * Math.cos(r) });
    },
  });

  // --- Spiked Beetle: charges in straight lines -------------------------
  defineEnemy('beetle', {
    light: true,
    hp: 3, damage: 2, pal: 'enemyk', rate: 9,
    frames: {
      down: ['beetle_d0', 'beetle_d1'],
      up: ['beetle_d0', 'beetle_d1'],
      side: ['beetle_s0', 'beetle_s1'],
    },
    // hp 3 > swordDamage() at sword level 1 (2) — the hurtFrame hp rule S12
    // found (src/game/enemy.js's Enemy.die(), docs/prompts/LEDGER.md).
    hurtFrame: 'beetle_hurt',
    deathFrame: 'beetle_death',
    // Reuses beetle's own beetle_s0 as its attackFrame rather than hand-
    // drawing a new pose — the same zero-new-art shape S43 found on
    // moblin_d1 and S93 found on siren_1. beetle_hurt's own comment
    // (sprites-enemies-hurt.js) already names beetle_s0/s1 as "two
    // balled-charge frames", distinct from the upright beetle_d0/d1 pair —
    // rendered both from the real runtime enemyk palette to confirm: d0 is
    // an upright bug with legs and antennae spread to the sides, s0 is a
    // genuinely different silhouette, curled into a round shell with a
    // target-like pattern. A real shape change, not a recolour (the test
    // S91 used to reject wisp_1) — exactly what "rolling into a ball to
    // charge" should look like. Applied as ONE non-directional pose (like
    // octorok_atk, S90) rather than per-facing: beetle only has a second
    // pose for the SIDE facing, not down/up, so a charge that starts while
    // facing down or up would otherwise show no telegraph at all — the
    // same "one accepted pose beats an inconsistent per-facing set"
    // reasoning octorok_atk already used. Left in the ordinary side frames
    // cycle too, same as moblin_d1/siren_1.
    attackFrame: 'beetle_s0',
    shield: 'front',
    drops: 'good',
    // Seasons' spiked beetle (spikedBeetle.s): wanders slowly; the moment Link
    // is on its row or column it turns on him and charges, gathering speed,
    // until a wall stops it; stands a moment, then wanders on. (The
    // cartridge's flips over when a shield turns it; here the shield on its
    // front stays ours.)
    port: 'spikedBeetle.s',
    speed: BEETLE_WALK_SPEED,
    ai(e, g) {
      const wander = () => {
        e.dir = randDir(g);
        e.aiTimer = BEETLE_WALK_FRAMES[g.rng.int(BEETLE_WALK_FRAMES.length)];
      };
      const charge = () => {
        cardinalToward(e, g);
        e.aiState = 'charge'; e.cnt = BEETLE_CHARGE_COUNT; e.speed = BEETLE_WALK_SPEED;
        e.attackTime = ENEMY_ATTACK_FRAMES;
      };
      switch (e.aiState) {
        case 0: wander(); e.aiState = 'walk'; return;
        case 'walk':                              // @state8
          e.still = false;
          if (centeredWith(e, g, BEETLE_SEE_PX)) { charge(); return; }
          if (--e.aiTimer <= 0 || !walkOn(e, g, BEETLE_WALK_SPEED)) wander();
          return;
        case 'charge':                            // @state9
          e.cnt--;
          if ((e.cnt & 3) === 0 && e.speed < BEETLE_CHARGE_MAX) e.speed += BEETLE_CHARGE_GAIN;
          if (walkOn(e, g, e.speed)) return;
          e.aiState = 'stand'; e.aiTimer = BEETLE_STAND_FRAMES;
          return;
        case 'stand':                             // @stateA
          if (centeredWith(e, g, BEETLE_SEE_PX)) { charge(); return; }
          if (--e.aiTimer > 0) return;
          e.aiState = 'walk'; e.speed = BEETLE_WALK_SPEED; wander();
          return;
      }
    },
  });

  // --- Tektite: hops at you across water ---------------------------------
  defineEnemy('tektite', {
    light: true,
    hp: 2, damage: 2, pal: 'enemyb', rate: 8, terrain: 'any',
    frames: ['tektite_0', 'tektite_1'],
    hurtFrame: 'tektite_hurt',
    deathFrame: 'tektite_death',
    // Reuses tektite's own tektite_1 as its attackFrame — a real shape
    // change from tektite_0 (compact body, short tucked legs) to legs
    // extended long and dangling, already referred to in passing as "the
    // hop-apex tuck" in zol_death's own comment (sprites-enemies-hurt.js).
    // hop()'s windup window (src/game/enemy.js) now guarantees this pose
    // shows in the run-up to every hop, the same beetle_s0/zol_1 shape.
    attackFrame: 'tektite_1',
    drops: 'common',
    // Seasons' tektite (tektite.s, subid 0): stands, crouches, and leaps at
    // Link along any of the 32 angles — one leap in eight a big one — then
    // stands again where it lands.
    port: 'tektite.s',
    speed: TEKTITE_SPEED,
    ai(e, g) {
      const stand = () => {
        e.aiState = 'stand'; e.still = false;
        e.aiTimer = (g.rng.int(256) & TEKTITE_STAND_MASK) + TEKTITE_STAND_MIN;
      };
      switch (e.aiState) {
        case 0:                                   // @state_uninitialized
          e.aiState = 'stand'; e.aiTimer = (g.rng.int(256) & TEKTITE_STAND_MASK) + 1; return;
        case 'stand':                             // @state8
          if (--e.aiTimer > 0) return;
          e.aiState = 'crouch'; e.aiTimer = TEKTITE_CROUCH_FRAMES; e.attackTime = TEKTITE_CROUCH_FRAMES;
          e.still = true;
          return;
        case 'crouch':                            // @state9, @stateA
          if (--e.aiTimer > 0) return;
          {
            const big = (g.rng.int(256) & 7) === 0;
            const [vz, grav] = big ? TEKTITE_BIG_LEAP : TEKTITE_SMALL_LEAP;
            launch(e, vz); e.grav = grav;
            e.angle = angleToward(e, g);
            e.aiState = 'leap'; e.still = false;
            if (g.audio) g.audio.sfx('hop');
          }
          return;
        case 'leap':                              // @stateB
          if (!fall(e, e.grav)) { stand(); return; }
          moveAngle(e, g, e.angle, TEKTITE_SPEED);
          return;
      }
    },
  });

  // --- Wisp: circles a point and shoots rings ---------------------------
  defineEnemy('wisp', {
    light: true,
    hp: 3, damage: 2, pal: 'magic', speed: 0, rate: 7, terrain: 'air',
    frames: ['wisp_0', 'wisp_1'],
    hurtFrame: 'wisp_hurt',
    // First enemy to carry both fields at once — see the wisp_death header
    // comment in sprites-enemies-hurt.js for why this is the real test of
    // spriteName()'s dying-before-hurtFrame ordering (src/game/enemy.js).
    deathFrame: 'wisp_death',
    attackFrame: 'wisp_atk',
    z: 8,
    drops: 'good',
    // Moves as Seasons' whisp does (whisp.s): on a diagonal, off every wall.
    // The rings are ours.
    port: 'whisp.s',
    speed: WHISP_SPEED,
    ai(e, g) {
      if (e.aiState === 0) { e.angle = (g.rng.int(256) & 0x18) + 4; e.aiState = 'drift'; }
      e.angle = bounceAngle(e, g, e.angle, WHISP_SPEED);
      if (every(e, 150)) shootRing(e, g, 6, { sprite: 'shot_orb', pal: 'magic', speed: 1.0, damage: 2 });
    },
  });

  // --- Urchin: harmless until the tide covers it, then it drifts --------
  defineEnemy('urchin', {
    hp: 2, damage: 2, pal: 'enemyp', speed: 0.25, rate: 16, terrain: 'any',
    frames: ['urchin_0', 'urchin_1'],
    hurtFrame: 'urchin_hurt',
    deathFrame: 'urchin_death',
    // First idleFrame in the roster (docs/ENEMIES.md's idle scoping
    // section). Hand-drawn — src/data/sprites-enemies-hurt.js's own comment
    // on `urchin_idle` has the sheet-exhaustion account. Gated directly by
    // ai() below on the exact condition that already decides whether this
    // enemy does anything at all, not a generic movement timer.
    idleFrame: 'urchin_idle',
    shield: 'front',
    drops: 'common',
    ai(e, g) {
      // "Harmless on dry ground" (this file's own comment above, and
      // docs/ENEMIES.md's lesson) used to only be true of its MOVEMENT —
      // e.harmless is Player.updateContactDamage's own skip flag
      // (src/game/player.js), already used the same way by submerge()'s
      // down/up cycle (src/game/enemy.js), and nothing had ever set it here.
      // A "dozing" urchin at LOW tide dealt its full contact damage on
      // touch for the whole life of this enemy until this line. Tied to the
      // same condition `idleFrame`/`wander` already use, not a separate one.
      const dormant = g.tide.level < 1;
      e.idle = dormant;
      e.harmless = dormant;
      if (!dormant) wander(e, g, { speed: 0.3, decide: 2 });
    },
  });

  // --- Moblin: throws spears, retreats when close ------------------------
  defineEnemy('moblin', {
    hp: 4, damage: 3, pal: 'enemyg', rate: 10,
    frames: {
      down: ['moblin_d0', 'moblin_d1'],
      up: ['moblin_u0', 'moblin_u1'],
      side: ['moblin_s0', 'moblin_s1'],
    },
    hurtFrame: 'moblin_hurt',
    deathFrame: 'moblin_death',
    // The "spear raised" pose (rip-enemies.py's own FRAMES comment: "idle
    // frame, then the same angle with its spear raised") already alternates
    // into the ordinary walk cycle above as moblin_d1/u1/s1 — left there on
    // purpose rather than removed, since moblin has no other second walk
    // frame and pulling it out would leave the walk cycle static. This wires
    // the SAME art to the real moment it depicts: shoot() below sets
    // attackTime, and spriteName() shows this pose specifically then, not
    // just whenever the walk cycle happens to land on it.
    attackFrame: { down: 'moblin_d1', up: 'moblin_u1', side: 'moblin_s1' },
    hb: { x: 2, y: 4, w: 12, h: 11 },
    drops: 'good',
    // Seasons' spear moblin (moblinsAndShroudedStalfos.s, sharing
    // arrowDarknut.s): walks a random stretch, pauses, sets off in a random
    // direction — and every second time it sets off, if that direction faces
    // Link, throws. It no longer backs away from him.
    port: 'moblinsAndShroudedStalfos.s',
    speed: MOBLIN_SPEED,
    ai(e, g) {
      const setOff = () => {
        e.aiTimer = MOBLIN_WALK_BASE + (g.rng.int(256) & MOBLIN_WALK_MASK);
        e.aiState = 'walk'; e.still = false;
      };
      switch (e.aiState) {
        case 0: e.dir = randDir(g); e.throws = 0; setOff(); return;
        case 'walk':                              // moblin_state_8
          if (--e.aiTimer > 0 && walkOn(e, g, MOBLIN_SPEED)) return;
          e.aiState = 'pause'; e.aiTimer = MOBLIN_PAUSE_FRAMES; e.still = true;
          return;
        case 'pause':                             // moblin_state_9
          if (--e.aiTimer > 0) return;
          e.dir = randDir(g);
          setOff();
          // arrowDarknut_fireArrowEveryOtherTime
          if ((++e.throws & 1) && g.player && dirOfAngle(angleToward(e, g)) === e.dir) {
            shoot(e, g, { sprite: 'shot_spear', pal: 'wood', speed: MOBLIN_SPEAR_SPEED, damage: 3 });
          }
          return;
      }
    },
  });

  // --- Stalfos: skittish skeleton that hops away from your sword --------
  defineEnemy('stalfos', {
    hp: 3, damage: 2, pal: 'enemyk', rate: 8,
    frames: {
      down: ['stalfos_d0', 'stalfos_d1'],
      up: ['stalfos_d0', 'stalfos_d1'],
      side: ['stalfos_s0', 'stalfos_s1'],
    },
    // Unlike hurtFrame, this has no hp-vs-swordDamage() constraint: die() (not
    // hurt()) is what defers removal, and die() only ever runs once, on the
    // hit that actually brings hp to 0 — a 1-hit kill stalls exactly the same
    // as a 3-hit one. See src/game/enemy.js's Enemy.die().
    deathFrame: 'stalfos_death',
    hurtFrame: 'stalfos_hurt',
    drops: 'good',
    // Seasons' stalfos (stalfos.s, subid 1): ambles on any of the 32 angles,
    // off every wall — now and then straight at Link — and when he swings
    // anything near it, leaps away from him, untouchable on the way up.
    port: 'stalfos.s',
    speed: STALFOS_SPEED,
    ai(e, g) {
      const amble = () => {                       // stalfos_moveInRandomAngle
        e.aiTimer = STALFOS_WALK_BASE + (g.rng.int(256) & STALFOS_WALK_MASK);
        e.angle = g.rng.int(32);
        if (g.rng.int(STALFOS_TOWARD_ODDS) === 0) e.angle = angleToward(e, g);
        e.speed = STALFOS_SPEED; e.aiState = 'amble';
      };
      // stalfos_checkJumpAwayFromLink
      const p = g.player;
      if (p && p.swinging > 0 && e.aiState !== 'leap' && linkWithin(e, g, STALFOS_SHY_PX)) {
        launch(e, STALFOS_LEAP_LAUNCH);
        e.speed = STALFOS_LEAP_SPEED;
        cardinalToward(e, g); e.dir = OPPOSITE[e.dir];
        e.invuln = 9999; e.aiState = 'leap';
        if (g.audio) g.audio.sfx('hop');
        return;
      }
      switch (e.aiState) {
        case 0: amble(); return;                  // state 8
        case 'amble':                             // state 9
          if (--e.aiTimer <= 0) { amble(); return; }
          e.angle = bounceAngle(e, g, e.angle, STALFOS_SPEED);
          e.dir = dirOfAngle(e.angle);
          return;
        case 'leap': {                            // state $0b
          const was = e.vzS;
          if (!fall(e, STALFOS_LEAP_GRAVITY)) { e.invuln = 0; amble(); return; }
          if (was > 0 && e.vzS <= 0) e.invuln = 0;   // touchable once it starts down
          walkOn(e, g, STALFOS_LEAP_SPEED);
          return;
        }
      }
    },
  });

  // --- Darknut: armoured knight, only vulnerable from behind ------------
  defineEnemy('darknut', {
    hp: 6, damage: 3, pal: 'enemyr', rate: 10,
    frames: {
      down: ['darknut_d0', 'darknut_d1'],
      up: ['darknut_d0', 'darknut_d1'],
      side: ['darknut_s0', 'darknut_s1'],
    },
    hurtFrame: 'darknut_hurt',
    deathFrame: 'darknut_death',
    // One non-directional pose (like octorok_atk/beetle_s0), not per-facing:
    // only a front pose was drawn (darknut_atk, sprites-enemies-hurt.js) —
    // darknut_s0/s1 (side) have no equivalent shield-braced variant, so a
    // per-facing set would need a second new pose anyway.
    attackFrame: 'darknut_atk',
    hb: { x: 2, y: 4, w: 12, h: 11 },
    shield: 'front',
    drops: 'rich',
    // Seasons' sword darknut (swordEnemies.s): plods about the four
    // directions; when Link comes within 40 px it stops, squares up, and then
    // hounds him for a while, turning toward him a step every other frame,
    // before plodding again. The shield on its front is ours: circle behind.
    port: 'swordEnemies.s',
    speed: DARKNUT_SPEED,
    ai(e, g) {
      const pick = () => {                        // swordEnemy_chooseRandomAngleAndCounter1
        e.aiTimer = DARKNUT_WALK_BASE + (g.rng.int(256) & DARKNUT_WALK_MASK);
        if ((g.rng.int(256) & 7) === 0) cardinalToward(e, g); else e.dir = randDir(g);
        e.angle = { up: 0, right: 8, down: 16, left: 24 }[e.dir];
      };
      switch (e.aiState) {
        case 0:
          e.dir = randDir(g); e.aiTimer = 1; e.cool = DARKNUT_CHASE_COOLDOWN; e.aiState = 'plod';
          return;
        case 'plod': {                            // swordDarknut_state8
          const p = g.player;
          if (e.cool > 0) e.cool--;
          if (e.cool === 0 && p && Math.abs(p.cy - e.cy) <= DARKNUT_SEE_PX
              && Math.abs(p.cx - e.cx) <= DARKNUT_SEE_PX) {
            e.aiState = 'square'; e.aiTimer = DARKNUT_SQUARE_FRAMES;
            e.angle = angleToward(e, g); e.dir = dirOfAngle(e.angle);
            e.attackTime = DARKNUT_SQUARE_FRAMES; e.still = true;
            return;
          }
          e.still = false; e.speed = DARKNUT_SPEED;
          if (--e.aiTimer <= 0) { pick(); return; }
          if (!walkOn(e, g, DARKNUT_SPEED)) e.dir = OPPOSITE[e.dir];   // ecom_bounceOffWallsAndHoles
          return;
        }
        case 'square':                            // swordDarknut_state9
          if (--e.aiTimer > 0) return;
          e.aiState = 'hound'; e.aiTimer = DARKNUT_CHASE_FRAMES; e.speed = DARKNUT_CHASE_SPEED; e.still = false;
          return;
        case 'hound':                             // swordDarknut_stateA
          if (--e.aiTimer <= 0) {                 // swordEnemy_gotoState8
            e.angle = (e.angle + 4) & 0x18; e.dir = dirOfAngle(e.angle);
            e.speed = DARKNUT_SPEED; e.cool = DARKNUT_CHASE_COOLDOWN; e.aiState = 'plod'; e.aiTimer = 1;
            return;
          }
          if (!(e.aiTimer & 1)) { e.angle = nudgeAngle(e.angle, angleToward(e, g)); e.dir = dirOfAngle(e.angle); }
          moveAngle(e, g, e.angle, DARKNUT_CHASE_SPEED);
          return;
      }
    },
  });

  // --- Wizzrobe: blinks in, fires, blinks out ---------------------------
  defineEnemy('wizzrobe', {
    hp: 3, damage: 3, pal: 'enemyp', speed: 0, rate: 12, terrain: 'any',
    frames: ['wizzrobe_0', 'wizzrobe_1'],
    hurtFrame: 'wizzrobe_hurt',
    deathFrame: 'wizzrobe_death',
    attackFrame: 'wizzrobe_atk',
    drops: 'good',
    // Seasons' red wizzrobe (wizzrobe.s, subid 1): picks an open tile on the
    // screen, faces Link and phases in, flickering; stands, fires once along
    // the way it faces, phases out and is gone a while. Untouchable except
    // while it stands.
    port: 'wizzrobe.s',
    ai(e, g) {
      const off = () => { e.harmless = true; e.invuln = 9999; };
      switch (e.aiState) {
        case 0: off(); e.hidden = true; e.aiState = 'choose'; return;
        case 'choose': {                          // subid1 state 8
          // wizzrobe_chooseSpawnPosition: a row 0-7 of the view, then a
          // column rolled until it is 0-9; an unusable tile tries again next frame.
          const cam = g.camera || { x: 0, y: 0 };
          const row = (g.rng.int(256) & 0x70) >> 4;
          let col;
          do col = (g.rng.int(256) & 0xf0) >> 4; while (col >= 10);
          const x = Math.floor(cam.x / TILE) * TILE + col * TILE;
          const y = Math.floor(cam.y / TILE) * TILE + row * TILE;
          if (x > g.room.pw - TILE || y > g.room.ph - TILE || !canOccupy(g, e, x, y)) return;
          e.x = x; e.y = y;
          cardinalToward(e, g);
          e.aiState = 'in'; e.aiTimer = WIZZROBE_PHASE_IN_FRAMES;
          return;
        }
        case 'in':                                // state 9
          e.hidden = !!(e.tick & 1);
          if (--e.aiTimer > 0) return;
          e.hidden = false; e.harmless = false; e.invuln = 0;
          e.aiState = 'stand'; e.aiTimer = WIZZROBE_STAND_FRAMES;
          return;
        case 'stand':                             // state $0a
          if (--e.aiTimer <= 0) { off(); e.aiState = 'out'; e.aiTimer = WIZZROBE_OUT_FRAMES; return; }
          if (e.aiTimer === WIZZROBE_FIRE_AT) {
            shoot(e, g, { sprite: 'shot_orb', pal: 'magic', speed: WIZZROBE_SHOT_SPEED, aim: false, damage: 3 });
          }
          return;
        case 'out':                               // state $0b
          if (--e.aiTimer <= 0) { e.aiState = 'choose'; return; }
          e.hidden = e.aiTimer <= WIZZROBE_GONE_FRAMES ? true : !!(e.tick & 1);
          return;
      }
    },
  });

  // --- Anglerfry: hangs in deep water, lunges when you swim near --------
  defineEnemy('anglerfry', {
    light: true,
    hp: 3, damage: 3, pal: 'enemyb', speed: 0.35, rate: 12, terrain: 'water',
    frames: ['anglerfry_0', 'anglerfry_1'],
    hurtFrame: 'anglerfry_hurt',
    deathFrame: 'anglerfry_death',
    attackFrame: 'anglerfry_atk',
    drops: 'good',
    tideOnly: [1, 2],
    ai(e, g) {
      // Drifts on its lure until you are close, then dashes in a straight line.
      charge(e, g, { speed: 2.1, tell: 26, range: 70, shake: true,
        idle: (e2, g2) => wander(e2, g2, { speed: 0.35, turnChance: 0.02 }) });
    },
  });

  // --- Barnacle: fixed, opens to spit, shielded while shut --------------
  defineEnemy('barnacle', {
    hp: 999, damage: 2, pal: 'enemyk', speed: 0, rate: 22, terrain: 'any',
    frames: ['barnacle_0', 'barnacle_1'],
    // Same as bubble: the flinch needs the Rod, the death pose waits.
    hurtFrame: 'barnacle_hurt',
    deathFrame: 'barnacle_death',
    attackFrame: 'barnacle_atk',
    shield: 'all',
    drops: 'none',
    ai(e, g) {
      if (every(e, 96) && distToPlayer(e, g) < 100) {
        facePlayer(e, g);
        shoot(e, g, { sprite: 'shot_ink', pal: 'shadow', speed: 1.3, aim: true, damage: 2 });
      }
    },
  });

  // --- Jellyfish: drifts with the tide, stings on contact ---------------
  defineEnemy('jellyfish', {
    light: true,
    hp: 2, damage: 3, pal: 'enemyb', speed: 0.4, rate: 14, terrain: 'water',
    frames: ['jellyfish_0', 'jellyfish_1'],
    hurtFrame: 'jellyfish_hurt',
    deathFrame: 'jellyfish_death',
    hb: { x: 3, y: 4, w: 10, h: 10 },
    drops: 'common',
    ai(e, g) {
      // Carried by the water rather than swimming: the higher the tide, the
      // harder the current shoves it along.
      bounceDiag(e, g, { speed: 0.4 });
      driftWithTide(e, g, { perLevel: 0.14 });
    },
  });

  // --- Siren: surfaces to sing a shot at you, submerges to dodge --------
  defineEnemy('siren', {
    hp: 4, damage: 3, pal: 'enemyb', speed: 0, rate: 16, terrain: 'water',
    frames: ['siren_0', 'siren_1'],
    hurtFrame: 'siren_hurt',
    deathFrame: 'siren_death',
    // Reuses siren's own siren_1 as its attackFrame rather than hand-drawing
    // a new pose — the same zero-new-art shape S43 found on moblin_d1, not a
    // hand-draw like octorok_atk/wisp_atk/wizzrobe_atk needed. S89's survey
    // tested all 7 remaining shoot()/shootRing() users only for an UNUSED
    // third sheet frame (correctly finding none for siren) and never asked
    // the different question moblin answered: does an ALREADY-used second
    // frame show a genuinely distinct pose. siren_1's own sheet art
    // (sprites-enemies.js) is not a recolour of siren_0 the way wisp_1 is of
    // wisp_0 (ruled out for that exact reason at S91) — it is a real shape
    // change, fanged mouth SHUT (siren_0) versus a wide round mouth OPEN
    // (siren_1), already described in siren_hurt's own comment as "open
    // singing ring-shot pose." That is exactly what shootRing() below does.
    // Left in the ordinary frames: cycle too, same as moblin_d1/u1/s1 —
    // removing it would leave only one walk frame.
    attackFrame: 'siren_1',
    drops: 'good',
    ai(e, g) {
      submerge(e, g, {
        down: 76, up: 70,
        whileUp(e2, g2) {
          if (every(e2, 40)) {
            facePlayer(e2, g2);
            shootRing(e2, g2, 5, { sprite: 'shot_bubble', pal: 'water', speed: 1.2, damage: 3 });
          }
        },
      });
    },
  });

  // --- Pincer: an eel head on a tether, lunging out of its burrow -------
  defineEnemy('pincer', {
    hp: 3, damage: 3, pal: 'enemyr', speed: 0, rate: 10, terrain: 'any',
    frames: ['pincer_0', 'pincer_1'], hurtFrame: 'pincer_hurt',
    deathFrame: 'pincer_death',
    // Reuses pincer's own pincer_1 as its attackFrame — a real shape
    // change from pincer_0's symmetric front-on stance to a curled, turned
    // silhouette (sprites-enemies.js), reading as coiling to snap out. The
    // ai() below already sets e.stun right before it lunges (a discrete
    // windup, the same shape charge()'s tell is), so this pairs
    // e.attackTime with that existing e.stun the same way charge() itself
    // pairs the two — no phase-lag correction needed here, unlike hop()'s
    // fix, since this is a one-time set rather than a countdown loop
    // crossing a threshold.
    attackFrame: 'pincer_1',
    hb: { x: 3, y: 3, w: 10, h: 11 },
    drops: 'common',
    // Seasons' pincer (pincer.s, the head): hides in its hole until Link is
    // within 40 px, shows its eyes, then lunges 32 px at him along one of
    // eight directions, holds, draws back, and hides a while. Touchable only
    // while it is out.
    port: 'pincer.s',
    ai(e, g) {
      const place = (d) => {                      // objectSetPositionInCircleArc
        const r = e.angle / 32 * 2 * Math.PI;
        e.fx = e.homeFx + Math.round(d * 256 * Math.sin(r));
        e.fy = e.homeFy - Math.round(d * 256 * Math.cos(r));
      };
      const hide = () => { e.hidden = true; e.harmless = true; e.invuln = 9999; };
      switch (e.aiState) {
        case 0: e.homeFx = e.fx; e.homeFy = e.fy; hide(); e.aiState = 'wait'; return;   // state 8
        case 'wait':                              // state 9
          if (!linkWithin(e, g, PINCER_SEE_PX)) return;
          e.hidden = false; e.aiState = 'warn'; e.aiTimer = PINCER_WARN_FRAMES;
          e.attackTime = PINCER_WARN_FRAMES;
          return;
        case 'warn':                              // state $0a
          if (--e.aiTimer > 0) return;
          e.harmless = false; e.invuln = 0;
          e.angle = (angleToward(e, g) + 2) & 0x1c; e.dir = dirOfAngle(e.angle);
          e.reach = 0; e.speed = PINCER_OUT_SPEED; e.aiState = 'out';
          return;
        case 'out':                               // state $0b
          place(e.reach);
          e.reach += PINCER_OUT_SPEED;
          if (e.reach >= PINCER_REACH) { e.aiState = 'hold'; e.aiTimer = PINCER_HOLD_FRAMES; }
          return;
        case 'hold':                              // state $0c
          if (--e.aiTimer > 0) return;
          e.aiState = 'back'; e.speed = PINCER_BACK_SPEED;
          return;
        case 'back':                              // state $0d
          place(e.reach);
          e.reach -= PINCER_BACK_SPEED;
          if (e.reach > 0) return;
          hide(); e.aiState = 'rest'; e.aiTimer = PINCER_REST_FRAMES;
          return;
        case 'rest':                              // state $0e
          if (--e.aiTimer > 0) return;
          e.fx = e.homeFx; e.fy = e.homeFy; e.aiState = 'wait';
          return;
      }
    },
  });
}
