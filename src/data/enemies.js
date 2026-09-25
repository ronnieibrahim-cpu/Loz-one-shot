// Enemy roster. See game/enemy.js for the definition contract and AI toolkit.
// Damage values are in quarter-hearts (2 = half a heart).

import { defineEnemy } from '../game/enemy.js';
import {
  wander, chase, flee, patrol, bounceDiag, hop, charge, orbit, submerge,
  shoot, shootRing, every, timer, aligned, facePlayer, distToPlayer,
  driftWithTide, beginStep, advanceStep, OPPOSITE,
  randDir, walkOn, randomCardinal, cardinalToward,
} from '../game/enemy.js';
import { spawnEntity } from '../game/entity.js';
import { F } from '../world/tileset.js';
import { TILE } from '../core/screen.js';
import { ENEMY_GRID_STEP, ENEMY_ATTACK_FRAMES, BEAM_SHOT_RADIUS } from './feel.js';
import {
  OCTOROK_SPEED, OCTOROK_STAND_FRAMES, OCTOROK_WALK_FRAMES, OCTOROK_SHOOT_MASK,
  OCTOROK_SHOOT_WINDUP, OCTOROK_SHOOT_REST, OCTOROK_TURN_TO_LINK, OCTOROK_SHOT_SPEED,
  CRAB_SPEED_SIDE, CRAB_SPEED_UPDOWN, CRAB_WALK_FRAMES,
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
    hp: 2, damage: 2, pal: 'slime', speed: 0.3, rate: 14,
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
    ai(e, g) { hop(e, g, { wait: 52, dist: 8, height: 7, frames: 16 }); },
    onDie(e, g) {
      // Splits into two gels, unless this zol was itself a split. The offset is
      // a whole lattice cell: a gel that spawned between lattice points would
      // walk a shifted grid for the rest of its short life.
      if (e.opts.split) return;
      for (const dx of [-ENEMY_GRID_STEP, ENEMY_GRID_STEP]) {
        spawnEntity(g, 'gel', (e.x + dx) / TILE, e.y / TILE, { split: true });
      }
    },
  });

  defineEnemy('gel', {
    light: true,
    hp: 1, damage: 1, pal: 'slime', speed: 0.42, rate: 10,
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
    ai(e, g) { chase(e, g, { speed: 0.42 }); },
  });

  // --- Keese: erratic flier, ignores terrain -----------------------------
  defineEnemy('keese', {
    light: true,
    hp: 1, damage: 1, pal: 'shadow', speed: 1.0, rate: 5, terrain: 'air',
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
    ai(e, g) {
      // Rests, then darts toward Link in bursts.
      if (e._rest == null) e._rest = 60;
      if (e._rest > 0) {
        // Same +1 phase correction hop() needed (src/game/enemy.js):
        // Enemy.update() decrements attackTime at the top of the frame,
        // before this ai() runs, while _rest's own trigger decrement
        // happens here, later in the same frame — one tick out of phase
        // if both were keyed to the same countdown value. Measured with a
        // scratch probe the same way hop()'s own fix was, not assumed to
        // carry over untested.
        if (e._rest === ENEMY_ATTACK_FRAMES + 1) e.attackTime = ENEMY_ATTACK_FRAMES;
        e._rest--; if (e._rest === 0) e._dash = 70; return;
      }
      if (e._dash > 0) { e._dash--; bounceDiag(e, g, { speed: 1.15 }); if (e._dash === 0) e._rest = 50; }
    },
  });

  // --- Leever: burrows and surfaces near you -----------------------------
  defineEnemy('leever', {
    hp: 2, damage: 2, pal: 'enemyp', speed: 0.5, rate: 9,
    frames: ['leever_0', 'leever_1'],
    hurtFrame: 'leever_hurt',
    deathFrame: 'leever_death',
    terrain: 'land',
    drops: 'common',
    ai(e, g) {
      // down/up were 70/110 — surfaced (chasing, vulnerable) for MORE of the
      // cycle than buried, the opposite of docs/ENEMIES.md's "spends most of
      // its time buried and untouchable" lesson. Swapped so buried is the
      // longer half, confirmed with a scratch probe counting hidden vs. up
      // frames over several cycles before and after. See
      // docs/prompts/LEDGER.md.
      submerge(e, g, { down: 110, up: 70, whileUp: (e2, g2) => chase(e2, g2, { speed: 0.5 }) });
    },
  });

  // --- Bubble: invulnerable drifting hazard ------------------------------
  defineEnemy('bubble', {
    light: true,
    hp: 999, damage: 2, pal: 'spark', speed: 1.0, rate: 6, terrain: 'air',
    frames: ['bubble_0', 'bubble_1'],
    // Shown only when the Resonance Rod has rung it and a blow gets through;
    // the death pose is ready but unreachable while hp is 999.
    hurtFrame: 'bubble_hurt',
    deathFrame: 'bubble_death',
    shield: 'all',
    drops: 'none',
    z: 6,
    ai(e, g) { bounceDiag(e, g, { speed: 1.05 }); },
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
    ai(e, g) {
      // Fires only along its own row/column, same shape as octorok's shot —
      // `aligned()` both gates the shot and sets `e.dir` toward the player,
      // and the shoot() call below carries no `aim`, so `fire()` sends the
      // shot straight in that direction rather than homing on the player's
      // exact position. Found and fixed this session: `aim: true` here
      // used to fire an aimed shot at any range < 80 regardless of
      // alignment, which is exactly what docs/ENEMIES.md's "only fires
      // straight along its own facing; step off its row or column and it's
      // harmless" lesson says does NOT happen — confirmed with a scratch
      // probe placing the player diagonally off-axis, which still took a
      // hit before this fix. See docs/prompts/LEDGER.md.
      if (every(e, 44) && aligned(e, g, 14) && distToPlayer(e, g) < 80) {
        shoot(e, g, { sprite: 'shot_beam', pal: 'enemyr', speed: 2.0, damage: 2, radius: BEAM_SHOT_RADIUS });
      }
    },
  });

  // --- Spiked Beetle: charges in straight lines -------------------------
  defineEnemy('beetle', {
    light: true,
    hp: 3, damage: 2, pal: 'enemyk', speed: 0.4, rate: 9,
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
    ai(e, g) {
      charge(e, g, { speed: 1.9, tell: 16, range: 88, shake: true, idle: (e2, g2) => wander(e2, g2, { decide: 4 }) });
    },
  });

  // --- Tektite: hops at you across water ---------------------------------
  defineEnemy('tektite', {
    light: true,
    hp: 2, damage: 2, pal: 'enemyb', speed: 0.6, rate: 8, terrain: 'any',
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
    ai(e, g) { hop(e, g, { wait: 34, dist: 16, height: 13, frames: 20 }); },
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
    ai(e, g) {
      orbit(e, g, { radius: 28, speed: 0.03 });
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
    hp: 4, damage: 3, pal: 'enemyg', speed: 0.45, rate: 10,
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
    ai(e, g) {
      const d = distToPlayer(e, g);
      if (d < 30) flee(e, g, { speed: 0.55 });
      else wander(e, g, { decide: 4 });
      if (every(e, 88) && aligned(e, g, 16) && d < 100) {
        shoot(e, g, { sprite: 'shot_spear', pal: 'wood', speed: 1.8, damage: 3 });
      }
    },
  });

  // --- Stalfos: skittish skeleton that hops away from your sword --------
  defineEnemy('stalfos', {
    hp: 3, damage: 2, pal: 'enemyk', speed: 0.7, rate: 8,
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
    ai(e, g) {
      if (distToPlayer(e, g) < 26) flee(e, g, { speed: 0.9 });
      else chase(e, g, { speed: 0.55 });
    },
  });

  // --- Darknut: armoured knight, only vulnerable from behind ------------
  defineEnemy('darknut', {
    hp: 6, damage: 3, pal: 'enemyr', speed: 0.5, rate: 10,
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
    ai(e, g) {
      // Advances steadily with its shield up, then lunges once you are close.
      // Circle behind it: the shield only covers the way it faces.
      const d = distToPlayer(e, g);
      if (d < 60) {
        charge(e, g, { speed: 1.5, tell: 22, range: 60, shake: true,
          idle: (e2, g2) => chase(e2, g2, { speed: 0.5 }) });
      } else {
        patrol(e, g, { axis: e.homeX % 32 < 16 ? 'x' : 'y' });
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
    ai(e, g) {
      // submerge() is the engine's appear/disappear cycle; it hides the sprite
      // and drops the hitbox while down, which is exactly a wizzrobe's phase.
      submerge(e, g, {
        down: 90, up: 80,
        whileUp(e2, g2) {
          if (every(e2, 44)) {
            facePlayer(e2, g2);
            shoot(e2, g2, { sprite: 'shot_orb', pal: 'magic', speed: 1.6, aim: true, damage: 3 });
          }
        },
      });
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
    ai(e, g) {
      // Never leaves its hole: it snaps out along one axis and is reeled back,
      // so the safe ground is diagonal to it. Both halves of that are lattice
      // steps — two cells out, two cells back — which is what makes the reach
      // something the player can measure by eye rather than guess at. It used
      // to be reeled home by a proportional lerp that never quite arrived, and
      // then by a subpixel one that arrived but still landed off the lattice.
      if (e._pinch == null) e._pinch = 'hole';
      if (e._pinch === 'out' || e._pinch === 'back') {
        advanceStep(e, g);
        if (e.step) return;
        if (e._pinch === 'out') {
          e._pinch = 'back';
          if (!beginStep(e, g, OPPOSITE[e.dir], ENEMY_GRID_STEP * 2, 24)) e._pinch = 'hole';
        } else {
          e._pinch = 'hole';
        }
        return;
      }
      if (every(e, 70) && aligned(e, g, 14) && distToPlayer(e, g) < 72) {
        facePlayer(e, g);
        g.spawnEffect('spark', e.x, e.y - 6);
        e.stun = 10;
        e.attackTime = 10;
        if (beginStep(e, g, e.dir, ENEMY_GRID_STEP * 2, 14)) e._pinch = 'out';
      }
    },
  });
}
