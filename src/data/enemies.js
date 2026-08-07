// Enemy roster. See game/enemy.js for the definition contract and AI toolkit.
// Damage values are in quarter-hearts (2 = half a heart).

import { defineEnemy } from '../game/enemy.js';
import {
  wander, chase, flee, patrol, bounceDiag, hop, charge, orbit, submerge,
  shoot, shootRing, every, timer, aligned, facePlayer, distToPlayer,
  driftWithTide, beginStep, advanceStep, OPPOSITE,
} from '../game/enemy.js';
import { spawnEntity } from '../game/entity.js';
import { F } from '../world/tileset.js';
import { TILE } from '../core/screen.js';
import { ENEMY_GRID_STEP } from './feel.js';

export function installEnemies() {
  // --- Octorok: wanders and spits rocks along its facing axis -------------
  defineEnemy('octorok', {
    hp: 2, damage: 2, pal: 'enemyg', speed: 0.42, rate: 11,
    frames: {
      down: ['octorok_d0', 'octorok_d1'],
      up: ['octorok_u0', 'octorok_u1'],
      side: ['octorok_s0', 'octorok_s1'],
    },
    hb: { x: 2, y: 5, w: 12, h: 10 },
    drops: 'common',
    ai(e, g) {
      wander(e, g, { decide: 2 });
      if (every(e, 74) && aligned(e, g, 14) && distToPlayer(e, g) < 96) {
        shoot(e, g, { sprite: 'shot_rock', speed: 1.5, damage: 2 });
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
    hp: 2, damage: 2, pal: 'enemyr', speed: 0.62, rate: 8,
    frames: ['crab_0', 'crab_1'],
    hb: { x: 1, y: 6, w: 14, h: 9 },
    terrain: 'shallow',
    shield: 'front',
    drops: 'common',
    ai(e, g) {
      patrol(e, g, { axis: 'x' });
      if (every(e, 120)) e._pdir = e._pdir === 'left' ? 'right' : 'left';
      if (distToPlayer(e, g) < 40 && every(e, 30)) facePlayer(e, g);
    },
  });

  // --- Zol: a slime that splits when struck ------------------------------
  defineEnemy('zol', {
    light: true,
    hp: 2, damage: 2, pal: 'slime', speed: 0.3, rate: 14,
    frames: ['zol_0', 'zol_1'],
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
    w: 16, h: 16,
    hb: { x: 5, y: 8, w: 6, h: 7 },
    terrain: 'any',
    drops: 'none',
    ai(e, g) { chase(e, g, { speed: 0.42 }); },
  });

  // --- Keese: erratic flier, ignores terrain -----------------------------
  defineEnemy('keese', {
    light: true,
    hp: 1, damage: 1, pal: 'shadow', speed: 1.0, rate: 5, terrain: 'air',
    frames: ['keese_0', 'keese_1'],
    hb: { x: 3, y: 4, w: 10, h: 8 },
    z: 8,
    drops: 'common',
    ai(e, g) {
      // Rests, then darts toward Link in bursts.
      if (e._rest == null) e._rest = 60;
      if (e._rest > 0) { e._rest--; if (e._rest === 0) e._dash = 70; return; }
      if (e._dash > 0) { e._dash--; bounceDiag(e, g, { speed: 1.15 }); if (e._dash === 0) e._rest = 50; }
    },
  });

  // --- Leever: burrows and surfaces near you -----------------------------
  defineEnemy('leever', {
    hp: 2, damage: 2, pal: 'enemyp', speed: 0.5, rate: 9,
    frames: ['leever_0', 'leever_1'],
    terrain: 'land',
    drops: 'common',
    ai(e, g) {
      submerge(e, g, { down: 70, up: 110, whileUp: (e2, g2) => chase(e2, g2, { speed: 0.5 }) });
    },
  });

  // --- Bubble: invulnerable drifting hazard ------------------------------
  defineEnemy('bubble', {
    light: true,
    hp: 999, damage: 2, pal: 'spark', speed: 1.0, rate: 6, terrain: 'air',
    frames: ['bubble_0', 'bubble_1'],
    shield: 'all',
    drops: 'none',
    z: 6,
    ai(e, g) { bounceDiag(e, g, { speed: 1.05 }); },
  });

  // --- Beamos: static, fires when you are in line ------------------------
  defineEnemy('beamos', {
    hp: 999, damage: 2, pal: 'stonedk', speed: 0, rate: 12,
    frames: ['beamos_0', 'beamos_1'],
    shield: 'all',
    terrain: 'any',
    drops: 'none',
    ai(e, g) {
      if (every(e, 44) && distToPlayer(e, g) < 80) {
        facePlayer(e, g);
        shoot(e, g, { sprite: 'shot_beam', pal: 'enemyr', speed: 2.0, aim: true, damage: 2 });
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
    drops: 'common',
    ai(e, g) { hop(e, g, { wait: 34, dist: 16, height: 13, frames: 20 }); },
  });

  // --- Wisp: circles a point and shoots rings ---------------------------
  defineEnemy('wisp', {
    light: true,
    hp: 3, damage: 2, pal: 'magic', speed: 0, rate: 7, terrain: 'air',
    frames: ['wisp_0', 'wisp_1'],
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
    shield: 'front',
    drops: 'common',
    ai(e, g) {
      if (g.tide.level >= 1) wander(e, g, { speed: 0.3, decide: 2 });
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
    frames: ['pincer_0', 'pincer_1'],
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
        if (beginStep(e, g, e.dir, ENEMY_GRID_STEP * 2, 14)) e._pinch = 'out';
      }
    },
  });
}
