// Boss and miniboss behaviour. See the defineBoss contract in game/enemy.js
// and the AI toolkit exported from the same module.
//
// The eight bosses, in dungeon order:
//   1 Gohmaraq    giant crab        Tidewash Grotto
//   2 Anemos      anemone           Coral Spire
//   3 Gloomtide   splitting bog     Bogwater Sanctum
//   4 Wyverna     sea wyvern        Cliffside Cistern
//   5 Rootmaw     drowned tree      Drowned Wood Shrine
//   6 Brinehulk   salt golem        Salt Pan Vault
//   7 Thalassor   giant eel         Reef Palace
//   8 Nereth      Drowned King      Abyssal Keep
//
// THE TIDE IN A BOSS FIGHT
//
// Every boss room is authored `noTide: true`, which only stops the *conch* —
// `tide.setLevel` still works. Each boss therefore calls `unlockTide` on its
// intro and hands the conch back for the length of the fight, because a boss
// the tide cannot touch is a boss that ignores the game's one mechanic. Each of
// the eight then reads `g.tide.level` a different way, matching its dungeon's
// tide theme from GAME-PLAN.md:
//
//   gohmaraq   drain the grotto (LOW) and its drying shell holds the eye open
//   anemos     it blooms open to feed only while the water is up (HIGH)
//   gloomtide  the sanctum current runs at MID and carries it; it wants MID
//   wyverna    flies at HIGH, beached and defenceless at LOW
//   rootmaw    drinks and heals at HIGH; roots bared and soft at LOW
//   brinehulk  brine dissolves salt: soft but enraged at HIGH, armoured at LOW
//   thalassor  its whirlpool drags you, and the pull scales with the water
//   nereth     pins the tide to one level per phase; break the pin to hurt him
//
// The late bosses fight back for control and force the tide to the level that
// suits them, so the conch is contested rather than a free switch.
//
// MINIBOSSES ARE NOT BOSSES
//
// Minibosses use `defineBoss` for its phases, intro hold and staged death, but
// clear `isBoss` in `init`. `game.onEnemyDefeated` keys `progress.beaten` off
// the *map* id, so a miniboss counted as a boss would mark its whole dungeon
// beaten — deleting the real boss on arrival and spawning the dungeon's essence
// in the miniboss room. Clearing the flag also lets the room's
// `puzzle: { enemies: true }` resolve normally.

import { defineBoss } from '../game/enemy.js';
import {
  wander, chase, patrol, bounceDiag, charge, orbit, submerge,
  shoot, shootRing, every, timer, aligned, facePlayer, distToPlayer, moveDir,
  driftWithTide,
} from '../game/enemy.js';
import { spawnEntity, moveEntity } from '../game/entity.js';
import { fire } from '../game/projectile.js';
import { VIEW_W, VIEW_H, TILE } from '../core/screen.js';

const LOW = 0, MID = 1, HIGH = 2;

// ---------------------------------------------------------------------------
// Shared behaviour helpers
// ---------------------------------------------------------------------------

/**
 * Wind up a big attack: freeze in a flashing pose, then run `what` on the frame
 * the pose ends. Every heavy attack in this file goes through here, so the
 * player always gets a tell they can read and dodge.
 *
 * `stun` makes Boss.update return early, so the attack cannot run inline — it
 * is parked on the entity and fired by `runPending` on the next live frame.
 */
function windUp(e, g, frames, what, fx = 'spark') {
  g.spawnEffect(fx, e.cx - 8, e.cy - 12);
  g.audio.sfx('charged');
  e.stun = frames;
  e._pending = what;
}

/** Fire whatever `windUp` parked. Called first thing in every phase's ai. */
function runPending(e, g) {
  const f = e._pending;
  if (f) { e._pending = null; f(e, g); }
}

/** Open an armoured boss's weak point for a while. */
function open(e, g, frames) {
  if (!e.weakOpen) {
    g.spawnEffect('sparkle', e.cx - 8, e.cy - 8);
    g.audio.sfx('valve');
  }
  e.weakOpen = true;
  e._open = Math.max(e._open || 0, frames);
}

/** Slam it shut again immediately. */
function shut(e, g) {
  if (e.weakOpen) g.audio.sfx('block');
  e.weakOpen = false;
  e._open = 0;
}

/** Count an open window down and shut the weak point when it lapses. */
function closeTick(e, g) {
  if (!e.spec.shell) return;
  if (e._open > 0 && --e._open <= 0) shut(e, g);
}

/** A fan of `n` shots centred on the player, spanning `arcDeg` degrees. */
function spread(e, g, n, arcDeg, o = {}) {
  if (!g.player) return;
  const base = Math.atan2(g.player.cy - e.cy, g.player.cx - e.cx);
  const arc = (arcDeg * Math.PI) / 180;
  for (let i = 0; i < n; i++) {
    const a = base + (n === 1 ? 0 : (i / (n - 1) - 0.5) * arc);
    fire(g, e, {
      sprite: o.sprite || 'shot', pal: o.pal || e.pal,
      damage: o.damage != null ? o.damage : 2,
      vx: Math.cos(a) * (o.speed || 1.4), vy: Math.sin(a) * (o.speed || 1.4),
      life: o.life || 150,
    });
  }
  g.audio.sfx('enemyShoot');
}

/** Keep a boss inside the arena: orbit and scripted dashes ignore collision. */
function clampArena(e, m = 12) {
  e.x = Math.max(m, Math.min(VIEW_W - e.w - m, e.x));
  e.y = Math.max(m, Math.min(VIEW_H - e.h - m, e.y));
}

/** Summon minions in a puff, at arm's length from the boss and inside the room. */
function summon(g, e, type, n = 1) {
  for (let i = 0; i < n; i++) {
    const a = g.rng.angle();
    const x = Math.max(24, Math.min(VIEW_W - 40, e.cx + Math.cos(a) * 36));
    const y = Math.max(24, Math.min(VIEW_H - 40, e.cy + Math.sin(a) * 36));
    g.spawnEffect('puff', x - 8, y - 8);
    spawnEntity(g, type, x / TILE, y / TILE, {});
  }
}

/**
 * Hand the conch back for the fight. Boss rooms are authored `noTide: true`,
 * which sets `tide.locked`; clearing it lets the player cycle the tide again.
 * Room entry re-applies the room's rules, so this lasts only for the fight.
 */
function unlockTide(g) { g.tide.locked = false; }

/** The boss wrestles the tide back to the level that suits it. */
function forceTide(e, g, level) {
  if (g.tide.level === level || g.tide.busy) return false;
  g.audio.sfx('conch');
  g.shake(2, 12);
  g.tide.setLevel(level);
  return true;
}

/**
 * Undo a submerge cycle. `submerge` parks an entity hidden, harmless and on
 * `invuln: 9999`; a later phase that does not call `submerge` would inherit
 * that state and leave an invisible, invulnerable, unkillable boss standing in
 * the room. Every boss that submerges in *any* phase surfaces on every phase
 * change.
 */
function surface(e) {
  e.hidden = false;
  e.harmless = false;
  if (e.invuln > 900) e.invuln = 0;
  e._subState = null;
  e._subT = 0;
}

/** Minibosses share this tail: restore the area music the boss track stopped. */
function miniDie(e, g) { g.frameLater(60, () => g.updateMusic()); }

/** See the header note — a miniboss must not mark its dungeon beaten. */
function miniInit(e) { e.isBoss = false; }

export function installBosses() {
  // =========================================================================
  // 1 — GOHMARAQ, the Tidewash Claw            Tidewash Grotto (D1)
  // =========================================================================
  // A crab that keeps its one eye behind a claw the size of a door. The claw
  // has to come down to attack, and while it is buried in the floor the eye is
  // exposed — that window is the only way in. Draining the grotto (LOW tide)
  // dries the shell out and holds the window open twice as long.
  defineBoss('gohmaraq', {
    hp: 24, damage: 4, pal: 'enemyr', speed: 0.55, rate: 9,
    w: 32, h: 32, hb: { x: 3, y: 10, w: 26, h: 20 },
    frames: ['boss_gohmaraq_0', 'boss_gohmaraq_1', 'boss_gohmaraq_2'],
    hurtFrame: 'boss_gohmaraq_hurt',
    intro: 90, shell: true, terrain: 'any', drops: 'none',
    init(e) { e._pdir = 'right'; e._open = 0; },
    onIntro(e, g) { unlockTide(g); },
    onPhase(e, g, i) {
      if (i === 2) { summon(g, e, 'crab', 2); g.shake(3, 16); }
    },
    phases: [
      // Scuttles the width of the arena and slams when you line up with it.
      { above: 0.62, ai(e, g) {
        runPending(e, g); closeTick(e, g);
        patrol(e, g, { axis: 'x', speed: 0.55 });
        if (timer(e, 'slam', 170)) gohmaraqSlam(e, g, 3, 90);
      } },
      // Faster, and it now charges the length of the room; a charge that ends
      // in a wall leaves it dazed with the eye open.
      { above: 0.30, ai(e, g) {
        runPending(e, g); closeTick(e, g);
        const wasCharging = e._charging;
        charge(e, g, { speed: 1.9, tell: 18, range: 130, shake: true, tol: 14,
          idle: (e2, g2) => patrol(e2, g2, { axis: 'x', speed: 0.85 }) });
        if (wasCharging && !e._charging) open(e, g, 70);
        if (timer(e, 'slam', 130)) gohmaraqSlam(e, g, 5, 80);
      } },
      // Cornered: constant slams and a burst of spray in every direction.
      { above: 0.00, ai(e, g) {
        runPending(e, g); closeTick(e, g);
        patrol(e, g, { axis: 'x', speed: 1.0 });
        if (timer(e, 'slam', 105)) gohmaraqSlam(e, g, 5, 70);
        if (timer(e, 'spray', 210)) {
          shootRing(e, g, 8, { sprite: 'shot_bubble', pal: 'water', speed: 1.2, damage: 2 });
        }
      } },
    ],
  });

  // The claw rears (frozen tell), crashes down throwing rock spray, and stays
  // buried — leaving the eye open. Drained, the shell cracks and it sticks.
  function gohmaraqSlam(e, g, shots, openFor) {
    windUp(e, g, 22, (e2, g2) => {
      g2.shake(4, 14);
      g2.audio.sfx('explode');
      spread(e2, g2, shots, 70, { sprite: 'shot_rock', speed: 1.5, damage: 2 });
      open(e2, g2, g2.tide.level === LOW ? openFor * 2 : openFor);
    });
  }

  // =========================================================================
  // 2 — ANEMOS, the Coral Bloom                Coral Spire (D2)
  // =========================================================================
  // Rooted to the spire floor, so this is a fight about position rather than
  // pursuit: it fills the room with shots and lashes anything that comes close.
  // It has to unfurl to feed, and it feeds on what the water brings — so the
  // higher the tide, the longer it stays open and the longer you get to hit it.
  defineBoss('anemos', {
    hp: 30, damage: 4, pal: 'coral', speed: 0, rate: 12,
    w: 32, h: 32, hb: { x: 5, y: 8, w: 22, h: 22 },
    frames: ['boss_anemos_0', 'boss_anemos_1', 'boss_anemos_2'],
    hurtFrame: 'boss_anemos_hurt',
    intro: 80, shell: true, terrain: 'any', drops: 'none',
    init(e) { e._open = 0; e._sweep = 0; },
    onIntro(e, g) { unlockTide(g); },
    onPhase(e, g, i) {
      if (i === 1) summon(g, e, 'jellyfish', 2);
      if (i === 2) summon(g, e, 'urchin', 2);
    },
    phases: [
      // Sways on its stalk and puffs rings of spore-bubbles.
      { above: 0.62, ai(e, g) {
        runPending(e, g); closeTick(e, g); anemosSway(e, g); anemosFeed(e, g);
        if (timer(e, 'ring', 170)) {
          shootRing(e, g, 6, { sprite: 'shot_bubble', pal: 'water', speed: 1.1, damage: 2 });
        }
        anemosLash(e, g, 44, 5);
      } },
      // A rotating sweep of tentacle spines that you have to walk around.
      { above: 0.32, ai(e, g) {
        runPending(e, g); closeTick(e, g); anemosSway(e, g); anemosFeed(e, g);
        if (every(e, 26)) {
          e._sweep += 0.42;
          shootRing(e, g, 3, { sprite: 'shot_orb', pal: 'coral', speed: 1.25,
            damage: 2, offset: e._sweep });
        }
        anemosLash(e, g, 48, 5);
      } },
      // Thrashing: aimed volleys between wider rings, and it feeds constantly.
      { above: 0.00, ai(e, g) {
        runPending(e, g); closeTick(e, g); anemosSway(e, g); anemosFeed(e, g);
        if (timer(e, 'volley', 90)) spread(e, g, 5, 50, { sprite: 'shot_orb', speed: 1.6, damage: 3 });
        if (timer(e, 'ring', 150)) {
          shootRing(e, g, 10, { sprite: 'shot_bubble', pal: 'water', speed: 1.3, damage: 2 });
        }
        anemosLash(e, g, 52, 7);
      } },
    ],
  });

  // Rooted, but never quite still: the column leans on its stalk.
  function anemosSway(e, g) {
    orbit(e, g, { radius: 9, speed: 0.028 });
    clampArena(e, 14);
  }

  // The feed cycle, and the tide hook: it unfurls for four times as long with
  // the water up as it does with the spire drained.
  function anemosFeed(e, g) {
    if (timer(e, 'feed', 250)) open(e, g, [40, 80, 160][g.tide.level]);
  }

  // Anything that stands next to it gets whipped.
  function anemosLash(e, g, range, shots) {
    if (distToPlayer(e, g) < range && timer(e, 'lash', 70)) {
      windUp(e, g, 16, (e2, g2) => {
        spread(e2, g2, shots, 40, { sprite: 'shot', pal: 'coral', speed: 2.0, damage: 3, life: 26 });
        g2.audio.sfx('shatter');
      });
    }
  }

  // =========================================================================
  // 3 — GLOOMTIDE, the Sunken Weight           Bogwater Sanctum (D3)
  // =========================================================================
  // A dripping mass with two lantern eyes that sinks into the bog to heal its
  // distance and comes up somewhere behind you. The sanctum's current only runs
  // at MID, and it rides that current — at MID it is twice the speed and drifts
  // between attacks. Take the tide off MID and it wallows. It keeps shoving the
  // tide back to MID, so the fight is a tug of war over the conch.
  defineBoss('gloomtide', {
    hp: 36, damage: 4, pal: 'bog', speed: 0.45, rate: 11,
    w: 32, h: 32, hb: { x: 4, y: 10, w: 24, h: 20 },
    frames: ['boss_gloomtide_0', 'boss_gloomtide_1', 'boss_gloomtide_2'],
    hurtFrame: 'boss_gloomtide_hurt',
    intro: 80, terrain: 'any', drops: 'none',
    onIntro(e, g) { unlockTide(g); },
    onPhase(e, g, i) {
      surface(e);                       // phase 3 does not submerge
      if (i === 1) summon(g, e, 'gel', 2);
      if (i === 2) { summon(g, e, 'zol', 2); g.shake(3, 18); }
    },
    phases: [
      // Wallows toward you and spits bog water.
      { above: 0.62, ai(e, g) {
        runPending(e, g);
        const cur = gloomCurrent(e, g);
        chase(e, g, { speed: 0.42 * cur });
        if (timer(e, 'spit', 120)) {
          windUp(e, g, 16, (e2, g2) => spread(e2, g2, 3, 45,
            { sprite: 'shot_ink', pal: 'shadow', speed: 1.5, damage: 2 }));
        }
      } },
      // Sinks and resurfaces beside you, shedding a gel each time it comes up.
      { above: 0.32, ai(e, g) {
        runPending(e, g);
        const cur = gloomCurrent(e, g);
        submerge(e, g, {
          down: 70, up: 130,
          whileUp(e2, g2) {
            chase(e2, g2, { speed: 0.5 * cur });
            if (every(e2, 96)) {
              windUp(e2, g2, 16, (e3, g3) => {
                spread(e3, g3, 5, 60, { sprite: 'shot_ink', pal: 'shadow', speed: 1.6, damage: 2 });
                if (g3.rng.chance(0.6)) summon(g3, e3, 'gel', 1);
              });
            }
          },
        });
        if (timer(e, 'current', 420)) forceTide(e, g, MID);
      } },
      // It stops hiding. Faster, heavier, and it throws ink in every direction.
      { above: 0.00, ai(e, g) {
        runPending(e, g);
        const cur = gloomCurrent(e, g);
        chase(e, g, { speed: 0.72 * cur });
        if (timer(e, 'burst', 150)) {
          windUp(e, g, 14, (e2, g2) => shootRing(e2, g2, 8,
            { sprite: 'shot_ink', pal: 'shadow', speed: 1.4, damage: 3 }));
        }
        if (timer(e, 'current', 360)) forceTide(e, g, MID);
      } },
    ],
  });

  // The tide hook: the sanctum's current only runs at MID. Riding it makes the
  // mass fast and drags it along; off MID it is a sack of water.
  function gloomCurrent(e, g) {
    if (g.tide.level !== MID) return 0.65;
    driftWithTide(e, g, { perLevel: 0.1, dx: 1, dy: 0 });
    if (every(e, 30)) g.spawnEffect('foam', e.cx - 8, e.cy + 4);
    return 1.7;
  }

  // =========================================================================
  // 4 — WYVERNA, the Cistern Wyrm              Cliffside Cistern (D4)
  // =========================================================================
  // A winged serpent that owns the air while the cistern is full. Drain it and
  // she has nothing to fly over: she comes down onto the floor, slow and wide
  // open. She refills the cistern whenever she gets a moment, so the fight is
  // about spending the conch faster than she does.
  defineBoss('wyverna', {
    hp: 44, damage: 4, pal: 'enemyb', speed: 1.0, rate: 7,
    w: 32, h: 32, hb: { x: 4, y: 8, w: 24, h: 20 },
    frames: ['boss_wyverna_0', 'boss_wyverna_1', 'boss_wyverna_2'],
    hurtFrame: 'boss_wyverna_hurt',
    intro: 80, shell: true, terrain: 'air', drops: 'none',
    init(e) { e._open = 0; e.shadow = true; },
    onIntro(e, g) { unlockTide(g); },
    onPhase(e, g, i) {
      if (i === 2) { summon(g, e, 'keese', 2); g.shake(3, 16); }
    },
    phases: [
      // Wheels around the ceiling and stoops at you.
      { above: 0.62, ai(e, g) {
        runPending(e, g); closeTick(e, g); wyvernaAltitude(e, g);
        bounceDiag(e, g, { speed: e.speed });
        if (timer(e, 'dive', 170)) wyvernaDive(e, g);
      } },
      // Adds a breath of three beams raked across the room.
      { above: 0.32, ai(e, g) {
        runPending(e, g); closeTick(e, g); wyvernaAltitude(e, g);
        bounceDiag(e, g, { speed: e.speed });
        if (timer(e, 'dive', 140)) wyvernaDive(e, g);
        if (timer(e, 'breath', 190)) {
          windUp(e, g, 20, (e2, g2) => spread(e2, g2, 3, 34,
            { sprite: 'shot_beam', pal: 'enemyb', speed: 2.1, damage: 3 }));
        }
        if (timer(e, 'flood', 400)) forceTide(e, g, HIGH);
      } },
      // Dives in a rhythm, with a ring of beams to punish standing still.
      { above: 0.00, ai(e, g) {
        runPending(e, g); closeTick(e, g); wyvernaAltitude(e, g);
        bounceDiag(e, g, { speed: e.speed * 1.15 });
        if (timer(e, 'dive', 100)) wyvernaDive(e, g);
        if (timer(e, 'ring', 200)) {
          shootRing(e, g, 8, { sprite: 'shot_beam', pal: 'enemyb', speed: 1.5, damage: 3 });
        }
        if (timer(e, 'flood', 320)) forceTide(e, g, HIGH);
      } },
    ],
  });

  // The tide hook: water level sets her altitude, her speed and how much of her
  // you can reach. Drained, she is on the floor and permanently open.
  function wyvernaAltitude(e, g) {
    const lvl = g.tide.level;
    e.z = [0, 5, 11][lvl];
    e.speed = [0.5, 0.95, 1.35][lvl];
    // `bounceDiag` keeps whatever velocity it is handed, so a dive would leave
    // her permanently at dive speed. Bleed it back down to her cruise.
    if (e._bvx != null) {
      const s = Math.hypot(e._bvx, e._bvy);
      if (s > e.speed) {
        const k = Math.max(e.speed, s * 0.98) / s;
        e._bvx *= k; e._bvy *= k;
      }
    }
    if (lvl === LOW) {
      open(e, g, 30);                       // beached on the cistern floor
      if (every(e, 40)) g.spawnEffect('dust', e.cx - 8, e.cy + 6);
    } else if (lvl === MID && (e.tick % 240) < 80) {
      open(e, g, 20);                       // wingtips still catching the floor
    }
  }

  // The stoop: she hangs, flashes, then drops in a straight line. She is open
  // for the whole dive — that is the price of the attack.
  function wyvernaDive(e, g) {
    windUp(e, g, 24, (e2, g2) => {
      facePlayer(e2, g2);
      open(e2, g2, 60);
      g2.audio.sfx('fire');
      e2._bvx = 0; e2._bvy = 0;
      const p = g2.player;
      if (p) {
        const dx = p.cx - e2.cx, dy = p.cy - e2.cy, d = Math.hypot(dx, dy) || 1;
        e2._bvx = (dx / d) * 2.6; e2._bvy = (dy / d) * 2.6;
      }
      g2.shake(2, 10);
    }, 'sparkle');
  }

  // =========================================================================
  // 5 — ROOTMAW, the Drowned Tree              Drowned Wood Shrine (D5)
  // =========================================================================
  // A flooded tree whose trunk splits open into a mouth. Its roots are in the
  // water: with the shrine full it drinks and knits itself back together, and
  // the bark stays shut. Drop the water and the roots come up bare and soft and
  // the mouth hangs open. It floods the shrine again the moment you let it.
  defineBoss('rootmaw', {
    hp: 52, damage: 4, pal: 'treedk', speed: 0, rate: 12,
    w: 32, h: 32, hb: { x: 4, y: 8, w: 24, h: 22 },
    frames: ['boss_rootmaw_0', 'boss_rootmaw_1', 'boss_rootmaw_2'],
    hurtFrame: 'boss_rootmaw_hurt',
    intro: 90, shell: true, terrain: 'any', drops: 'none',
    init(e) { e._open = 0; },
    onIntro(e, g) { unlockTide(g); },
    onPhase(e, g, i) {
      if (i === 1) summon(g, e, 'zol', 2);
      if (i === 2) { g.shake(4, 24); g.audio.sfx('shatter'); }
    },
    phases: [
      // Rooted. Lashes along the floor and breathes open on a slow cycle.
      { above: 0.62, ai(e, g) {
        runPending(e, g); closeTick(e, g); rootmawTide(e, g);
        if (timer(e, 'lash', 150)) {
          windUp(e, g, 20, (e2, g2) => {
            shootRing(e2, g2, 4, { sprite: 'shot_spear', pal: 'wood', speed: 1.7, damage: 3 });
            g2.shake(2, 10);
          });
        }
      } },
      // Spits seed clusters; saplings come up around it.
      { above: 0.32, ai(e, g) {
        runPending(e, g); closeTick(e, g); rootmawTide(e, g);
        if (timer(e, 'seed', 130)) {
          windUp(e, g, 18, (e2, g2) => {
            spread(e2, g2, 5, 60, { sprite: 'shot', pal: 'wood', speed: 1.5, damage: 2 });
            shootRing(e2, g2, 8, { sprite: 'shot', pal: 'wood', speed: 0.9, damage: 2 });
          });
        }
        if (timer(e, 'sapling', 420) && countType(g, 'zol') < 3) summon(g, e, 'zol', 1);
        if (timer(e, 'drink', 380)) forceTide(e, g, HIGH);
      } },
      // It tears itself out of the floor and walks, mouth open, still spitting.
      { above: 0.00, ai(e, g) {
        runPending(e, g); closeTick(e, g); rootmawTide(e, g);
        chase(e, g, { speed: 0.38 });
        if (timer(e, 'seed', 105)) {
          windUp(e, g, 14, (e2, g2) => spread(e2, g2, 7, 80,
            { sprite: 'shot_spear', pal: 'wood', speed: 1.8, damage: 3 }));
        }
        if (timer(e, 'drink', 300)) forceTide(e, g, HIGH);
      } },
    ],
  });

  // The tide hook. Roots under water: bark shut, and it slowly knits back up —
  // capped so it can never win a stalemate outright. Roots in the air: bare,
  // and the mouth cannot close.
  function rootmawTide(e, g) {
    const lvl = g.tide.level;
    if (lvl === HIGH) {
      shut(e, g);
      if (timer(e, 'heal', 110) && e.hp < e.maxHp) {
        e.hp = Math.min(e.maxHp, e.hp + 1);
        g.spawnEffect('sparkle', e.cx - 8, e.cy - 4);
      }
    } else if (lvl === LOW) {
      open(e, g, 30);
      if (every(e, 45)) g.spawnEffect('dust', e.cx - 8, e.cy + 8);
    } else if (timer(e, 'breathe', 220)) {
      open(e, g, 80);
    }
  }

  // =========================================================================
  // 6 — BRINEHULK, the Salt Colossus           Salt Pan Vault (D6)
  // =========================================================================
  // A golem of packed salt. Water dissolves it, which cuts both ways: flood the
  // vault and its crust goes soft and hittable, but the thing underneath is
  // furious and fast. Let the pans dry and it re-crystallises into armour and
  // slows to a walk. It keeps draining the vault to set itself again.
  defineBoss('brinehulk', {
    hp: 60, damage: 4, pal: 'marble', speed: 0.4, rate: 13,
    w: 32, h: 32, hb: { x: 4, y: 8, w: 24, h: 22 },
    frames: ['boss_brinehulk_0', 'boss_brinehulk_1', 'boss_brinehulk_2'],
    hurtFrame: 'boss_brinehulk_hurt',
    intro: 90, shell: true, terrain: 'any', drops: 'none',
    init(e) { e._open = 0; },
    onIntro(e, g) { unlockTide(g); },
    onPhase(e, g, i) {
      if (i === 2) { summon(g, e, 'beetle', 2); g.shake(4, 22); }
    },
    phases: [
      // Walks you down and pounds the floor.
      { above: 0.62, ai(e, g) {
        runPending(e, g); closeTick(e, g);
        const rage = brinehulkCrust(e, g);
        chase(e, g, { speed: 0.4 * rage });
        if (timer(e, 'pound', 175)) brinehulkPound(e, g, 8, 1.2);
      } },
      // Hurls salt boulders at range and charges when you line up.
      { above: 0.32, ai(e, g) {
        runPending(e, g); closeTick(e, g);
        const rage = brinehulkCrust(e, g);
        charge(e, g, { speed: 1.7 * rage, tell: 22, range: 110, shake: true, tol: 13,
          idle: (e2, g2) => chase(e2, g2, { speed: 0.45 * rage }) });
        if (timer(e, 'hurl', 140)) {
          windUp(e, g, 20, (e2, g2) => spread(e2, g2, 3, 40,
            { sprite: 'shot_rock', pal: 'marble', speed: 1.6, damage: 3 }));
        }
        if (timer(e, 'dry', 400)) forceTide(e, g, LOW);
      } },
      // Cracked apart: pounds constantly and throws a wider ring each time.
      { above: 0.00, ai(e, g) {
        runPending(e, g); closeTick(e, g);
        const rage = brinehulkCrust(e, g);
        chase(e, g, { speed: 0.55 * rage });
        if (timer(e, 'pound', 110)) brinehulkPound(e, g, 12, 1.4);
        if (timer(e, 'dry', 320)) forceTide(e, g, LOW);
      } },
    ],
  });

  // The tide hook: brine eats salt. Flooded, the crust is soft the whole time
  // but the golem moves at half again its speed; dried out, it is armoured.
  function brinehulkCrust(e, g) {
    const lvl = g.tide.level;
    if (lvl === HIGH) {
      open(e, g, 30);
      if (every(e, 26)) g.spawnEffect('bubble', e.cx - 8, e.cy - 2);
      return 1.55;
    }
    if (lvl === LOW) { shut(e, g); return 0.8; }
    if (timer(e, 'flake', 240)) open(e, g, 70);
    return 1.0;
  }

  // Both arms up (tell), then down: the floor jumps and a ring of salt shards
  // goes out along it.
  function brinehulkPound(e, g, shards, speed) {
    windUp(e, g, 26, (e2, g2) => {
      g2.shake(5, 20);
      g2.audio.sfx('explode');
      shootRing(e2, g2, shards, { sprite: 'shot_rock', pal: 'marble', speed, damage: 3, life: 90 });
    });
  }

  // =========================================================================
  // 7 — THALASSOR, the Palace Eel              Reef Palace (D7)
  // =========================================================================
  // An eel long enough to cross the room, which spends most of the fight inside
  // the reef and comes out along a straight line. It spins a whirlpool that
  // drags you onto it, and the pull is only as strong as the water — drop the
  // tide and the pull dies, but a beached eel thrashes twice as fast.
  defineBoss('thalassor', {
    hp: 68, damage: 4, pal: 'reef', speed: 0.6, rate: 8,
    w: 32, h: 32, hb: { x: 4, y: 9, w: 24, h: 20 },
    frames: ['boss_thalassor_0', 'boss_thalassor_1', 'boss_thalassor_2'],
    hurtFrame: 'boss_thalassor_hurt',
    intro: 90, terrain: 'any', drops: 'none',
    onIntro(e, g) { unlockTide(g); },
    onPhase(e, g, i) {
      surface(e);                       // phase 3 leaves the reef for good
      if (i === 1) summon(g, e, 'pincer', 2);
      if (i === 2) { g.shake(4, 24); g.audio.sfx('shatter'); }
    },
    phases: [
      // In and out of the reef, lunging along whichever line you share with it.
      { above: 0.62, ai(e, g) {
        runPending(e, g);
        const dry = thalassorPull(e, g);
        if (thalassorDash(e, g)) return;
        submerge(e, g, {
          down: 80, up: 120,
          whileUp(e2, g2) {
            wander(e2, g2, { speed: 0.5 * dry, turnChance: 0.02 });
            if (every(e2, 90) && aligned(e2, g2, 16)) thalassorLunge(e2, g2, dry);
          },
        });
      } },
      // Stays up longer, spinning the whirlpool and ringing the room with spray.
      { above: 0.32, ai(e, g) {
        runPending(e, g);
        const dry = thalassorPull(e, g);
        if (thalassorDash(e, g)) return;
        submerge(e, g, {
          down: 55, up: 190,
          whileUp(e2, g2) {
            chase(e2, g2, { speed: 0.45 * dry });
            if (every(e2, 80)) thalassorLunge(e2, g2, dry);
            if (every(e2, 130)) {
              shootRing(e2, g2, 8, { sprite: 'shot_bubble', pal: 'water', speed: 1.3, damage: 3 });
            }
          },
        });
      } },
      // Out of the reef for good: a serpentine chase and aimed beams.
      { above: 0.00, ai(e, g) {
        runPending(e, g);
        const dry = thalassorPull(e, g);
        if (thalassorDash(e, g)) return;
        chase(e, g, { speed: 0.7 * dry });
        if (timer(e, 'lunge', 105)) thalassorLunge(e, g, dry);
        if (timer(e, 'beam', 85)) {
          shoot(e, g, { sprite: 'shot_beam', pal: 'reef', speed: 2.2, aim: true, damage: 3 });
        }
        if (timer(e, 'flood', 340)) forceTide(e, g, HIGH);
      } },
    ],
  });

  // The tide hook: the whirlpool drags the player in, and its strength is the
  // water level. Beached at LOW it cannot pull at all — and thrashes for it.
  function thalassorPull(e, g) {
    const lvl = g.tide.level;
    const strength = [0, 0.22, 0.5][lvl];
    const p = g.player;
    if (strength > 0 && p && !e.hidden) {
      const dx = e.cx - p.cx, dy = e.cy - p.cy, d = Math.hypot(dx, dy) || 1;
      if (d < 96) moveEntity(g, p, (dx / d) * strength, (dy / d) * strength);
      if (every(e, 20)) g.spawnEffect('ripple', e.cx - 8, e.cy - 8, { life: 24 });
    }
    return lvl === LOW ? 1.9 : 1.0;   // beached: no pull, but twice the thrash
  }

  // Rears back out of the water (frozen tell), then snaps the length of the
  // room along whichever line it was facing.
  function thalassorLunge(e, g, dry) {
    windUp(e, g, 18, (e2, g2) => {
      facePlayer(e2, g2);
      g2.audio.sfx('charge');
      e2._lunge = 26;
      e2._lungeSpeed = 2.4 * dry;
    });
  }

  /** Drive an in-flight lunge. Returns true while it owns the boss's movement. */
  function thalassorDash(e, g) {
    if (!e._lunge || e._lunge <= 0) return false;
    e._lunge--;
    if (!moveDir(e, g, e.dir, e._lungeSpeed || 2.4)) {
      e._lunge = 0;                     // hit the reef wall: recoil
      e.stun = 20;
      g.shake(3, 10);
    }
    return true;
  }

  // =========================================================================
  // 8 — NERETH, the Drowned King               Abyssal Keep (D8)
  // =========================================================================
  // The long one. Nereth holds the sea where he wants it: each phase he pins
  // the tide to one level, and while it sits at his level he is sealed inside
  // his own water and nothing touches him. Break the pin with the conch and he
  // is open until he can force it back. Three phases, three different pins —
  // the keep's whole tide theme is "all three levels in one room" — and then a
  // fourth where he stops pinning and cycles the sea himself.
  defineBoss('nereth', {
    hp: 80, damage: 4, pal: 'abyss', speed: 0.6, rate: 9,
    w: 32, h: 32, hb: { x: 4, y: 8, w: 24, h: 22 },
    frames: ['boss_nereth_0', 'boss_nereth_1', 'boss_nereth_2', 'boss_nereth_3'],
    hurtFrame: 'boss_nereth_hurt',
    intro: 120, shell: true, terrain: 'any', drops: 'none',
    init(e) { e._open = 0; e._sweep = 0; },
    onIntro(e, g) { unlockTide(g); },
    onPhase(e, g, i) {
      g.shake(4, 22);
      if (i === 1) summon(g, e, 'wizzrobe', 1);
      if (i === 2) summon(g, e, 'stalfos', 2);
      // Phase 4 opens on its own cycle timer; give the player a window at once
      // rather than up to 200 sealed frames on arrival.
      if (i === 3) { g.audio.sfx('shatter'); summon(g, e, 'darknut', 1); open(e, g, 120); }
    },
    phases: [
      // Pins the sea at MID and throws his tridents.
      { above: 0.75, ai(e, g) {
        runPending(e, g); nerethPin(e, g, MID, 300);
        chase(e, g, { speed: 0.5 });
        if (timer(e, 'trident', 130)) {
          windUp(e, g, 22, (e2, g2) => {
            spread(e2, g2, 3, 36, { sprite: 'shot_spear', pal: 'abyss', speed: 2.0, damage: 3 });
            nerethOpening(e2, g2);
          });
        }
      } },
      // Floods the keep and swims it, fast, ringing the room with water.
      { above: 0.50, ai(e, g) {
        runPending(e, g); nerethPin(e, g, HIGH, 280);
        chase(e, g, { speed: 1.05 });
        if (timer(e, 'ring', 150)) {
          windUp(e, g, 18, (e2, g2) => {
            shootRing(e2, g2, 10, { sprite: 'shot_bubble', pal: 'water', speed: 1.4, damage: 3 });
            nerethOpening(e2, g2);
          });
        }
        if (timer(e, 'summon', 520) && countType(g, 'wizzrobe') < 2) summon(g, e, 'wizzrobe', 1);
      } },
      // Drains it to the bare rock, plants the trident and sweeps beams round.
      { above: 0.25, ai(e, g) {
        runPending(e, g); nerethPin(e, g, LOW, 260);
        if (every(e, 22)) {
          e._sweep += 0.36;
          shootRing(e, g, 3, { sprite: 'shot_beam', pal: 'magic', speed: 1.5,
            damage: 3, offset: e._sweep });
        }
        if (timer(e, 'step', 4)) moveDir(e, g, e.dir, 0.4);
        if (timer(e, 'face', 60)) facePlayer(e, g);
        // The sweep runs continuously, so the opening is when he re-seats the
        // planted trident between passes.
        if (timer(e, 'reseat', 190)) {
          windUp(e, g, 20, (e2, g2) => { g2.shake(2, 10); nerethOpening(e2, g2); });
        }
        if (timer(e, 'summon', 460) && countType(g, 'stalfos') < 3) summon(g, e, 'stalfos', 1);
      } },
      // No more pinning. He works the sea through all three states himself and
      // throws everything; the openings are the moments the water is moving.
      { above: 0.00, ai(e, g) {
        runPending(e, g);
        closeTick(e, g);
        if (timer(e, 'cycle', 200)) {
          windUp(e, g, 26, (e2, g2) => {
            forceTide(e2, g2, (g2.tide.level + 1) % 3);
            open(e2, g2, 150);            // the sea is loose; so is he
          }, 'sparkle');
        }
        chase(e, g, { speed: 0.85 });
        if (timer(e, 'trident', 100)) {
          spread(e, g, 5, 60, { sprite: 'shot_spear', pal: 'abyss', speed: 2.1, damage: 3 });
        }
        if (timer(e, 'ring', 170)) {
          shootRing(e, g, 12, { sprite: 'shot_bubble', pal: 'water', speed: 1.5, damage: 3 });
        }
        if (timer(e, 'summon', 400) && countType(g, 'keese') < 4) summon(g, e, 'keese', 2);
      } },
    ],
  });

  // The pin. While the sea sits where Nereth put it he is sealed inside it, and
  // the only way in is the moment after he throws something — every attack in
  // his first three phases ends with `nerethOpening`. Break the pin with the
  // conch and that grudging window becomes a standing one, until he shoves the
  // sea back on a timer you can hear coming.
  //
  // He must never be *only* breakable by the conch: he starts the fight pinned
  // to MID, which is where the player walks in, so a pure tide gate would mean
  // an invulnerable boss and no way to learn otherwise.
  function nerethPin(e, g, level, period) {
    if (g.tide.level === level) {
      closeTick(e, g);
      if (timer(e, 'seal', 200)) g.spawnEffect('shine', e.cx - 8, e.cy - 8, { life: 24 });
    } else {
      open(e, g, 60);
      if (timer(e, 'pin', period)) {
        windUp(e, g, 26, (e2, g2) => forceTide(e2, g2, level), 'sparkle');
      }
    }
  }

  /** The recovery window after one of Nereth's attacks: he is open as he resets. */
  function nerethOpening(e, g) { open(e, g, 55); }

  /** How many of a minion type are already out — keeps summons from stacking. */
  function countType(g, type) {
    let n = 0;
    for (const x of g.entities) if (x.type === type && !x.dead) n++;
    return n;
  }

  // =========================================================================
  // MINIBOSSES
  // =========================================================================
  // 24x24, one third to one half of a boss's health, `intro: 40`, and no phase
  // that is not visible in ten seconds of play. Each carries a light version of
  // its dungeon's tide idea so the miniboss room teaches the boss room.

  // --- D1 Clawcrab: a Gohmaraq that never grew a shell --------------------
  // Scuttles the room and snaps along your line. Dry ground (LOW) suits it.
  defineBoss('clawcrab', {
    hp: 14, damage: 3, pal: 'enemyr', speed: 0.8, rate: 8,
    w: 24, h: 24, hb: { x: 3, y: 7, w: 18, h: 15 },
    frames: ['mini_clawcrab_0', 'mini_clawcrab_1'],
    intro: 40, terrain: 'any', drops: 'rich',
    init: miniInit, onDie: miniDie,
    phases: [
      { above: 0.50, ai(e, g) {
        runPending(e, g);
        patrol(e, g, { axis: 'x', speed: g.tide.level === LOW ? 1.0 : 0.7 });
        if (timer(e, 'snip', 130)) {
          windUp(e, g, 16, (e2, g2) => spread(e2, g2, 3, 50,
            { sprite: 'shot_rock', speed: 1.5, damage: 2 }));
        }
      } },
      { above: 0.00, ai(e, g) {
        runPending(e, g);
        charge(e, g, { speed: 2.0, tell: 16, range: 120, shake: true, tol: 14,
          idle: (e2, g2) => patrol(e2, g2, { axis: 'x', speed: g2.tide.level === LOW ? 1.2 : 0.9 }) });
        if (timer(e, 'snip', 100)) {
          windUp(e, g, 14, (e2, g2) => spread(e2, g2, 5, 70,
            { sprite: 'shot_rock', speed: 1.6, damage: 2 }));
        }
      } },
    ],
  });

  // --- D2 Reefguard: coral plate that has to open to strike ---------------
  defineBoss('reefguard', {
    hp: 16, damage: 3, pal: 'coral', speed: 0.5, rate: 10,
    w: 24, h: 24, hb: { x: 3, y: 7, w: 18, h: 15 },
    frames: ['mini_reefguard_0', 'mini_reefguard_1'],
    intro: 40, shell: true, terrain: 'any', drops: 'rich',
    init(e) { miniInit(e); e._open = 0; },
    onDie: miniDie,
    phases: [
      { above: 0.50, ai(e, g) {
        runPending(e, g); closeTick(e, g);
        chase(e, g, { speed: 0.45 });
        // The plate has to lift for it to strike, and that is the whole fight.
        if (timer(e, 'strike', 140)) {
          windUp(e, g, 20, (e2, g2) => {
            open(e2, g2, g2.tide.level === HIGH ? 130 : 80);
            spread(e2, g2, 3, 40, { sprite: 'shot_orb', pal: 'coral', speed: 1.6, damage: 2 });
          });
        }
      } },
      { above: 0.00, ai(e, g) {
        runPending(e, g); closeTick(e, g);
        charge(e, g, { speed: 1.6, tell: 18, range: 100, shake: true,
          idle: (e2, g2) => chase(e2, g2, { speed: 0.55 }) });
        if (timer(e, 'strike', 110)) {
          windUp(e, g, 16, (e2, g2) => {
            open(e2, g2, g2.tide.level === HIGH ? 130 : 80);
            shootRing(e2, g2, 6, { sprite: 'shot_orb', pal: 'coral', speed: 1.3, damage: 2 });
          });
        }
      } },
    ],
  });

  // --- D3 Bogmaw: a mouth in the floor of the sanctum ---------------------
  defineBoss('bogmaw', {
    hp: 15, damage: 3, pal: 'bog', speed: 0.55, rate: 11,
    w: 24, h: 24, hb: { x: 3, y: 7, w: 18, h: 15 },
    frames: ['mini_bogmaw_0', 'mini_bogmaw_1'],
    intro: 40, terrain: 'any', drops: 'rich',
    init: miniInit, onDie: miniDie,
    onPhase(e) { surface(e); },         // phase 2 stays up
    phases: [
      { above: 0.50, ai(e, g) {
        runPending(e, g);
        submerge(e, g, {
          down: 60, up: 110,
          whileUp(e2, g2) {
            chase(e2, g2, { speed: g2.tide.level === MID ? 0.85 : 0.5 });
            if (every(e2, 80)) {
              windUp(e2, g2, 14, (e3, g3) => spread(e3, g3, 3, 44,
                { sprite: 'shot_ink', pal: 'shadow', speed: 1.5, damage: 2 }));
            }
          },
        });
      } },
      { above: 0.00, ai(e, g) {
        runPending(e, g);
        chase(e, g, { speed: g.tide.level === MID ? 1.0 : 0.65 });
        if (timer(e, 'spit', 90)) {
          windUp(e, g, 12, (e2, g2) => shootRing(e2, g2, 6,
            { sprite: 'shot_ink', pal: 'shadow', speed: 1.3, damage: 2 }));
        }
      } },
    ],
  });

  // --- D4 Ironknight: a Darknut with a cistern's worth of armour ----------
  // The shield holds until a charge ends in a wall; then it is wide open.
  defineBoss('ironknight', {
    hp: 18, damage: 3, pal: 'stonedk', speed: 0.55, rate: 10,
    w: 24, h: 24, hb: { x: 3, y: 7, w: 18, h: 15 },
    frames: ['mini_ironknight_0', 'mini_ironknight_1'],
    intro: 40, shell: true, terrain: 'any', drops: 'rich',
    init(e) { miniInit(e); e._open = 0; },
    onDie: miniDie,
    phases: [
      { above: 0.50, ai(e, g) {
        runPending(e, g); closeTick(e, g); ironknightRust(e, g);
        const was = e._charging;
        charge(e, g, { speed: 1.8, tell: 20, range: 110, shake: true, tol: 12,
          idle: (e2, g2) => chase(e2, g2, { speed: 0.5 }) });
        if (was && !e._charging) open(e, g, 90);
      } },
      { above: 0.00, ai(e, g) {
        runPending(e, g); closeTick(e, g); ironknightRust(e, g);
        const was = e._charging;
        charge(e, g, { speed: 2.2, tell: 14, range: 140, shake: true, tol: 16,
          idle: (e2, g2) => chase(e2, g2, { speed: 0.7 }) });
        if (was && !e._charging) open(e, g, 70);
        if (timer(e, 'throw', 150)) {
          windUp(e, g, 16, (e2, g2) => spread(e2, g2, 3, 34,
            { sprite: 'shot_spear', pal: 'stonedk', speed: 1.9, damage: 3 }));
        }
      } },
    ],
  });

  // Flooding the cistern seizes the joints of all that plate.
  function ironknightRust(e, g) {
    if (g.tide.level === HIGH) {
      open(e, g, 30);
      if (every(e, 34)) g.spawnEffect('bubble', e.cx - 8, e.cy - 2);
    }
  }

  // --- D5 Thornvine: rooted, and it fills the room with thorns ------------
  defineBoss('thornvine', {
    hp: 16, damage: 3, pal: 'tree', speed: 0, rate: 12,
    w: 24, h: 24, hb: { x: 3, y: 6, w: 18, h: 17 },
    frames: ['mini_thornvine_0', 'mini_thornvine_1'],
    intro: 40, terrain: 'any', drops: 'rich',
    init: miniInit, onDie: miniDie,
    phases: [
      { above: 0.50, ai(e, g) {
        runPending(e, g);
        orbit(e, g, { radius: 7, speed: 0.03 }); clampArena(e, 14);
        // Drop the water and the vine wilts: slower thorns, longer gaps.
        if (timer(e, 'thorn', g.tide.level === LOW ? 190 : 130)) {
          windUp(e, g, 16, (e2, g2) => shootRing(e2, g2, 6,
            { sprite: 'shot', pal: 'wood', speed: 1.3, damage: 2, offset: g2.rng.angle() }));
        }
      } },
      { above: 0.00, ai(e, g) {
        runPending(e, g);
        orbit(e, g, { radius: 10, speed: 0.05 }); clampArena(e, 14);
        if (timer(e, 'thorn', g.tide.level === LOW ? 150 : 100)) {
          windUp(e, g, 12, (e2, g2) => {
            shootRing(e2, g2, 8, { sprite: 'shot', pal: 'wood', speed: 1.4, damage: 2 });
            spread(e2, g2, 3, 30, { sprite: 'shot_spear', pal: 'wood', speed: 1.9, damage: 3 });
          });
        }
      } },
    ],
  });

  // --- D6 Saltwraith: blinks around the vault throwing salt ---------------
  defineBoss('saltwraith', {
    hp: 17, damage: 3, pal: 'ice', speed: 0, rate: 12,
    w: 24, h: 24, hb: { x: 3, y: 6, w: 18, h: 16 },
    frames: ['mini_saltwraith_0', 'mini_saltwraith_1'],
    intro: 40, terrain: 'any', drops: 'rich',
    init: miniInit, onDie: miniDie,
    onPhase(e) { surface(e); },
    phases: [
      { above: 0.50, ai(e, g) {
        runPending(e, g);
        submerge(e, g, {
          down: 70, up: 90,
          whileUp(e2, g2) {
            if (every(e2, 46)) {
              facePlayer(e2, g2);
              // Brine blunts it: at HIGH the bolts come slower and thinner.
              spread(e2, g2, g2.tide.level === HIGH ? 1 : 3, 40,
                { sprite: 'shot_orb', pal: 'ice', speed: 1.7, damage: 2 });
            }
          },
        });
      } },
      { above: 0.00, ai(e, g) {
        runPending(e, g);
        submerge(e, g, {
          down: 45, up: 110,
          whileUp(e2, g2) {
            if (every(e2, 60)) {
              windUp(e2, g2, 14, (e3, g3) => shootRing(e3, g3,
                g3.tide.level === HIGH ? 5 : 8,
                { sprite: 'shot_orb', pal: 'ice', speed: 1.4, damage: 2 }));
            }
          },
        });
      } },
    ],
  });

  // --- D7 Gustharpy: owns the air over the palace -------------------------
  defineBoss('gustharpy', {
    hp: 18, damage: 3, pal: 'enemyy', speed: 1.1, rate: 6,
    w: 24, h: 24, hb: { x: 3, y: 6, w: 18, h: 15 },
    frames: ['mini_gustharpy_0', 'mini_gustharpy_1'],
    intro: 40, terrain: 'air', drops: 'rich',
    init(e) { miniInit(e); e.z = 8; e.shadow = true; },
    onDie: miniDie,
    phases: [
      { above: 0.50, ai(e, g) {
        runPending(e, g); gustharpyWind(e, g);
        bounceDiag(e, g, { speed: 1.1 });
        if (timer(e, 'stoop', 150)) {
          windUp(e, g, 20, (e2, g2) => {
            facePlayer(e2, g2);
            spread(e2, g2, 3, 36, { sprite: 'shot', pal: 'enemyy', speed: 2.0, damage: 3 });
          }, 'sparkle');
        }
      } },
      { above: 0.00, ai(e, g) {
        runPending(e, g); gustharpyWind(e, g);
        chase(e, g, { speed: 1.25 });
        if (timer(e, 'stoop', 100)) {
          windUp(e, g, 14, (e2, g2) => shootRing(e2, g2, 6,
            { sprite: 'shot', pal: 'enemyy', speed: 1.6, damage: 3 }));
        }
      } },
    ],
  });

  // A downdraught off the wings that shoves you around — stronger over water.
  function gustharpyWind(e, g) {
    const push = [0, 0.15, 0.32][g.tide.level];
    const p = g.player;
    if (push > 0 && p && distToPlayer(e, g) < 80) {
      const dx = p.cx - e.cx, dy = p.cy - e.cy, d = Math.hypot(dx, dy) || 1;
      moveEntity(g, p, (dx / d) * push, (dy / d) * push);
    }
  }

  // --- D8 Tideshade: Nereth's shadow, thrown ahead of him -----------------
  defineBoss('tideshade', {
    hp: 20, damage: 3, pal: 'shadow', speed: 0.75, rate: 9,
    w: 24, h: 24, hb: { x: 3, y: 7, w: 18, h: 15 },
    frames: ['mini_tideshade_0', 'mini_tideshade_1'],
    intro: 40, terrain: 'any', drops: 'rich',
    init: miniInit, onDie: miniDie,
    onPhase(e) { surface(e); },
    phases: [
      { above: 0.55, ai(e, g) {
        runPending(e, g);
        chase(e, g, { speed: 0.7 });
        if (timer(e, 'cast', 120)) {
          windUp(e, g, 18, (e2, g2) => spread(e2, g2, 3, 44,
            { sprite: 'shot_ink', pal: 'shadow', speed: 1.7, damage: 3 }));
        }
      } },
      { above: 0.00, ai(e, g) {
        runPending(e, g);
        // Thins out and reappears, the way Nereth does with the whole sea.
        submerge(e, g, {
          down: 50, up: 130,
          whileUp(e2, g2) {
            chase(e2, g2, { speed: 0.95 });
            if (every(e2, 74)) {
              windUp(e2, g2, 14, (e3, g3) => shootRing(e3, g3,
                g3.tide.level === HIGH ? 8 : 6,
                { sprite: 'shot_ink', pal: 'shadow', speed: 1.5, damage: 3 }));
            }
          },
        });
      } },
    ],
  });
}
