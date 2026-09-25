// FEEL. Every timing and speed constant in the game lives in this file.
//
// Read docs/FEEL-SPEC.md before changing a number in here. The short version:
//
//   * No module under src/ may declare its own timing or speed constant. If
//     you need a number that governs how the game moves, it goes here and is
//     imported. A magic number in a game module is the bug this file exists
//     to stop.
//
//   * Every export carries a UNIT and a PROVENANCE tag:
//
//       measured  someone frame-stepped a reference recording of Oracle of
//                 Seasons or Ages and wrote the number down. The comment says
//                 what was measured and how.
//       derived   computed from another constant in this file. The comment
//                 names its ancestor. A derived value is only as good as what
//                 it derives from.
//       guessed   somebody typed a plausible number and it shipped.
//
//     A `derived` value may instead name the CARTRIDGE'S OWN DATA as its
//     ancestor: the sword (S149) is read straight out of the Oracle of
//     Seasons disassembly (github.com/Stewmath/oracles-disasm), and each such
//     comment names the file and table. That is not a frame-stepped reading,
//     so it is not `measured`; it is the number the game itself uses.
//
//   * `measured` values came from ONE reference: a frame-exact recording of
//     Oracle of Seasons, assets/footage/seasons-tas-rooster-adventure.mp4
//     (59.73 fps, 4x scale, one video frame = one game frame; S147). Each one
//     names the video frames that were counted. Everything else is still a
//     guess that happened to feel acceptable. Do not upgrade a `guessed` to a
//     `measured` because the game feels fine — that word means a reference
//     was frame-stepped. Readings that were taken and NOT applied are in
//     assets/footage/README.md.
//
// Units used below:
//   sp/f    SUBPIXELS per frame at 60 Hz. 256 sp = 1 px; positions are 8.8
//           fixed-point, so this is the engine's native speed unit and the one
//           anything that moves a position is written in. See src/core/fixed.js.
//   sp/f^2  subpixels per frame squared — an acceleration on the same grid
//   sp      subpixels
//   px/f    pixels per frame at 60 Hz. Kept for the constants that feed the
//           DATA-facing helpers — an enemy spec says `speed: 0.45` and the AI
//           toolkit converts it with `sp()` at its edge — so enemy and
//           projectile data does not have to be rewritten in 256ths.
//   f       frames at 60 Hz
//   px      pixels
//   x       dimensionless multiplier
//   p       probability per frame, 0..1
//   rad/f   radians per frame
//   qh      quarter-hearts (see progress.js: HEART_UNITS = 4)

// ---------------------------------------------------------------------------
// Player movement
// ---------------------------------------------------------------------------

/** sp/f — Link's ground speed, straight along one axis. measured: 1.5 px/f.
 *  reference: assets/footage/seasons-tas-rooster-adventure.mp4, Link walking left on flat
 *  ground with a still camera, video frames 9912-9960 — 72 px in 48 frames,
 *  stepping 1,2,1,2 px, which is exactly what 384 sp/f does on the 8.8 grid.
 *  The same 1,2 rhythm walking up at frames 3835-3853 and 7090-7108.
 *
 *  It used to be 256 (1 px/f), chosen because it divides the 16px tile; the
 *  source game does not care about that, and at 1.5 px/f Link was a third
 *  slower than Seasons everywhere. A tile now takes 10.7 frames and Link does
 *  not land on every tile boundary, which is why ROOM_EXIT_MARGIN is 2. */
export const WALK_SPEED = 384;

/** x — per-axis speed while two directions are held. measured: a diagonal is
 *  NOT faster than a straight line in Seasons; the same 1.5 px/f is split
 *  across both axes. reference: assets/footage/seasons-tas-rooster-adventure.mp4, Link
 *  walking diagonally on foot, video frames 1227-1297 (72 px across and 72
 *  down in 70 frames, 1.03 px/f per axis) and 1154-1190 (38 and 38 in 36,
 *  1.06). 1/sqrt(2) of 1.5 is 1.06. This project said the opposite from P3
 *  until S147, on the strength of nobody having looked. */
export const DIAGONAL_FACTOR = Math.SQRT1_2;

/**
 * tiles — how far to either side of a doorway the doorway pull reaches.
 *
 * THE DOORWAY PULL. Walking into the wall beside a door slides you along the
 * wall toward the door, the way a stairwell takes you in the source games,
 * instead of stopping you dead against blank brick a few pixels from the way
 * out. A person got stuck inside Tidewash Grotto because of its absence: the
 * dungeon mouth was one 16px tile, the player's hitbox is 10px, and only a
 * nine-pixel band of a hundred-and-sixty-pixel room lined up with it.
 *
 * ONE TILE, and the number is load-bearing in both directions. Less is no help
 * at all — you are already within a tile of the door when you can see you have
 * missed it. More and the door stops being somewhere you walk to and becomes a
 * floor that swallows you from across the room, which is worse than the bug.
 * `tools/check-exits.mjs` asserts both halves: the door's span plus this reach
 * leaves, and one tile beyond it does not.
 *
 * guessed: no reference was frame-stepped for it. What was measured is the
 * failure it fixes — see the header of tools/check-exits.mjs.
 */
export const DOORWAY_PULL_REACH_TILES = 1;

/** sp/f — how fast the doorway pull slides you along the wall. derived: half
 *  WALK_SPEED, so the slide reads as being drawn in rather than as the stick
 *  being taken off you. */
export const DOORWAY_PULL_SPEED = 192;

/** sp/f — surface swimming. derived: three quarters of WALK_SPEED, the same
 *  ratio the old guessed pair (0.95 / 1.35) had, snapped to the grid. */
export const SWIM_SPEED = 288;

/** sp/f — under the Pegasus Seed. derived: exactly twice WALK_SPEED. */
export const BOOST_SPEED = 768;

/** sp/f — walking with the shield raised. derived: three quarters of
 *  WALK_SPEED. */
export const SHIELD_SPEED = 288;

/** sp/f — walking with the sword held out. derived: kept equal to
 *  SHIELD_SPEED, because both are "you are committed to something and cannot
 *  move at full pace". guessed insofar as its ancestor is. */
export const SWORD_HOLD_SPEED = 288;

/** x — multiplier on F.SLOW terrain (sand, deep grass). guessed. */
export const SLOW_FACTOR = 0.6;

/** x — multiplier while wading in shallow water. guessed. */
export const SHALLOW_FACTOR = 0.86;

/** x — multiplier while carrying something. guessed. */
export const CARRY_FACTOR = 0.9;

/** sp/f — drift in the facing direction during a spin attack. guessed. */
export const SPIN_DRIFT_SPEED = 96;

/** sp/f — sideways push from a current tile while swimming is the tile's own
 *  `push` vector; this scales the aquatic-enemy drift per tide level. guessed.
 *  Below one pixel per frame, which only moves anything at all because
 *  positions accumulate in subpixels. */
export const TIDE_DRIFT_PER_LEVEL = 32;

// DIAGONALS ARE NOT NORMALISED, and there is deliberately no constant here to
// scale them with. Holding two directions applies the full per-axis speed to
// both axes, so a diagonal covers sqrt(2) times what a cardinal does. That
// asymmetry is a signature of the GB Zeldas — it is why cutting the corner of a
// room feels quicker than walking the two edges, and why players who grew up on
// them route diagonally without thinking about it. `DIAGONAL_FACTOR` used to
// live here at 1/sqrt(2) and is gone; re-introducing one would make movement
// "correct" and make the game feel like something else. See docs/FEEL-SPEC.md.

// ---------------------------------------------------------------------------
// Sword
// ---------------------------------------------------------------------------

/** f — how long each of the swing's four phases lasts, in order: blade out to
 *  the side, blade on the diagonal, blade at full reach along the facing,
 *  blade drawn back to a short reach along the facing. derived from the
 *  cartridge: oracles-disasm data/seasons/specialObjectAnimationData.s,
 *  animationData19d1e/19d21 (LINK_ANIM_MODE_22, the sword swing), whose
 *  frame lengths are 3, 3, 8 and 3; the phase is the animation's parameter
 *  0/2/4/6 halved, as object_code/common/items/postUpdate.s
 *  (updateSwingableItemAnimation) reads it. */
export const SWING_PHASE_FRAMES = [3, 3, 8, 3];

/** f — total length of a sword swing; the player is rooted for all of it.
 *  derived: the sum of SWING_PHASE_FRAMES. Link's movement is disabled when
 *  the swing starts and given back when the animation ends
 *  (object_code/common/itemParents/swordParent.s). */
export const SWING_FRAMES = SWING_PHASE_FRAMES.reduce((a, b) => a + b, 0);

/** px — where the blade can hit on each phase of a swing, per facing:
 *  [radiusY, radiusX, offsetY, offsetX] from Link's centre, one row per
 *  SWING_PHASE_FRAMES entry. The blade can hit on EVERY frame of the swing,
 *  the first included: on phase 0 it is out to Link's SIDE, which is why a
 *  foe standing beside him is struck by a swing aimed past it. derived from
 *  the cartridge: oracles-disasm object_code/common/items/postUpdate.s,
 *  swordArcData (the sixteen rows) indexed through updateSwingableItemAnimation's
 *  @data table (phase x facing -> row). */
export const SWORD_ARC = {
  up:    [[9, 6, -2, 16], [7, 7, -11, 13], [9, 6, -17, -4], [9, 6, -10, -4]],
  right: [[6, 9, -14, 0], [7, 7, -11, 13], [6, 9, 2, 19], [4, 9, 2, 12]],
  down:  [[9, 6, 0, -15], [7, 7, 17, -13], [9, 6, 21, 3], [9, 6, 16, 3]],
  left:  [[6, 9, -14, 0], [7, 7, -11, -13], [6, 9, 2, -19], [6, 9, 2, -12]],
};

/** px — radius of an ordinary enemy's hit area, centred on its sprite. Most of
 *  Seasons' small enemies use 6 by 6 (a 12x12 box on the middle of the 16x16
 *  cell). derived from the cartridge: oracles-disasm data/seasons/enemyData.s,
 *  extraEnemyData, rows 0x01/0x03/0x08 onward. The sword tests against this;
 *  an enemy's own `hb` stays its footprint for walls and floors. */
export const ENEMY_HURT_RADIUS = 6;

/** px — radius of LINK'S OWN collision area, centred on his sprite: a 12x12
 *  box. An enemy touching Link hurts him when this box and the enemy's
 *  (ENEMY_HURT_RADIUS, or its spec's `hurtBox`) overlap — the same test,
 *  centre to centre with the two radii summed, that the cartridge makes.
 *  Link's `hb` stays his feet for walls and floors. derived from the
 *  cartridge: oracles-disasm object_code/common/specialObjects/link.s,
 *  linkState00 ("Set collisionRadiusY,X" = $06, $06), tested in
 *  code/collisionEffects.s enemyCheckCollisions (@checkHitLink) through
 *  code/bank0.s checkObjectsCollidedFromVariables. */
export const LINK_HURT_RADIUS = 6;

/** px — radius of an enemy's shot as it meets Link: a 4x4 box on the middle
 *  of the shot, against his LINK_HURT_RADIUS box. derived from the cartridge:
 *  oracles-disasm data/seasons/partData.s, PART_OCTOROK_PROJECTILE ($18),
 *  PART_ZORA_FIRE, PART_ENEMY_ARROW and PART_STALFOS_BONE all $22 (radius
 *  2 by 2). A shot may declare its own (`radius` on `shoot`). */
export const ENEMY_SHOT_RADIUS = 2;

/** px — radius of a beamos's beam, the one shot here the cartridge makes
 *  bigger. derived: oracles-disasm data/seasons/partData.s, PART_BEAM ($29),
 *  $33. */
export const BEAM_SHOT_RADIUS = 3;

/** f — how long the sword button must be held, after the swing ends, before a
 *  spin is charged. derived from the cartridge: oracles-disasm
 *  object_code/common/itemParents/swordParent.s, @state6 sets counter1 $28
 *  when the swing ends with the button still down, and @state2 takes one off
 *  it a frame and charges when it passes zero — the 41st frame. */
export const CHARGE_FRAMES = 41;

/** f — interval between charge sparkles once charged. guessed. */
export const CHARGE_SPARKLE_EVERY = 6;

/** f — length of a spin attack. guessed. */
export const SPIN_FRAMES = 26;

/** px — how far in front of Link the blade reaches. guessed. */
export const SWORD_REACH = 13;

/** px — gap between Link's centre and the near edge of the sword box. guessed. */
export const SWORD_GAP = 3;

/** px — side of the square hitbox swept by a spin attack. guessed. */
export const SPIN_BOX = 30;

/** f — frames after a swing ends before the still-held button becomes a hold
 *  rather than the tail of the swing. derived from the cartridge: swordParent.s
 *  @state6 turns the blade into the held blade (ITEMCOLLISION_SWORD_HELD) on
 *  the frame the swing's animation ends, so the first frame after it. */
export const SWORD_HOLD_DELAY = 1;

/** qh — damage the extended blade deals on contact. guessed; half a swing's,
 *  because walking into something with the sword out is meant to be worth less
 *  than choosing to swing at it. The enemy's own invulnerability window is what
 *  rate-limits it, so this is damage per enemy-invuln period, not per frame. */
export const SWORD_HOLD_DAMAGE = 1;

/** px — knockback dealt by the extended blade. derived: ENEMY_HIT_TIERS' low
 *  hit (objectCollisionTable ENEMYCOLLISION_STANDARD_ENEMY, column
 *  ITEMCOLLISION_SWORD_HELD = COLLISIONEFFECT_SWORD_LOW_KNOCKBACK). A
 *  distance, like every other KNOCK_* — see the note above them. */
export const KNOCK_HOLD = 16;

/** f — how long after a clink off a wall the blade may clink again. guessed;
 *  without it the sfx retriggers every frame you lean on the wall. */
export const SWORD_CLINK_COOLDOWN = 20;

// ---------------------------------------------------------------------------
// Damage, invulnerability and knockback
// ---------------------------------------------------------------------------

/** f — invulnerability after Link takes a hit from an enemy. derived from the
 *  cartridge: oracles-disasm code/collisionEffects.s, applyDamageToLink's
 *  @damageTypeTable, LINKDMG_04 (COLLISIONEFFECT_DAMAGE_LINK, what an
 *  ordinary enemy's body and shot do to Link): invincibilityCounter $22.
 *  It agrees with the 33-frame flash measured below: the flash IS the window. */
export const PLAYER_INVULN_FRAMES = 34;

/** f — how long Link flashes after a hit. measured: 33 frames, from the frame
 *  the heart drains to the last red frame. reference: assets/footage/seasons-tas-rooster-adventure.mp4,
 *  video frames 2758-2790, 9771-9803 and 15516-15548 (three separate
 *  hits, identical).
 *  PLAYER_INVULN_FRAMES above is NOT the same thing and was not measured —
 *  the footage shows the flash, not when he can next be hurt. */
export const PLAYER_FLICKER_FRAMES = 33;

/** f — how many frames each beat of Link's hit flash lasts: red for this
 *  many, his own colours for this many. measured: 4. reference: assets/footage/seasons-tas-rooster-adventure.mp4,
 *  video frames 15516-15548 — red 15516-18, normal 19-22, red 23-26, normal
 *  27-30, red 31-34 and so on; the same beat at 9771-9803. Seasons draws him
 *  RED (the `hitflash` family), it does not blink him out, and it does not
 *  shake the screen when he is hit (the whole-screen shift is 0 on every
 *  frame of all three hits in the video: 2758, 9771, 15516). */
export const PLAYER_HURT_FLASH_BEAT = 4;

/** f — invulnerability after a pit fall or a wash-out, which is longer than an
 *  ordinary hit because the player has just been put back. derived from the
 *  cartridge: oracles-disasm object_code/common/specialObjects/link.s,
 *  linkState02 (LINK_STATE_RESPAWNING) @substate2, invincibilityCounter $3c.
 *  The guess was already right. */
export const PLAYER_RECOVER_INVULN_FRAMES = 60;

/** f — how long Link stands still after he is put back from a pit or the
 *  water, before he can walk. derived: linkState02 @substate2 sets counter1
 *  $10 and @substate3 waits it out before LINK_STATE_NORMAL. */
export const RESPAWN_HOLD_FRAMES = 16;

/** f — how long Link is shoved and cannot walk after a hit. derived: equal to
 *  PLAYER_KNOCK_FRAMES, because the cartridge's normal state skips Link's
 *  own movement for exactly as long as knockbackCounter runs
 *  (object_code/common/specialObjects/link.s, linkState01 @notInAir). */
export const PLAYER_HURT_FRAMES = 15;

/** f — how long that shove takes. derived from the cartridge:
 *  oracles-disasm code/collisionEffects.s, applyDamageToLink's
 *  @damageTypeTable, LINKDMG_04: knockbackCounter $0f, taken down one a
 *  frame by linkUpdateKnockback (object_code/common/specialObjects/link.s). */
export const PLAYER_KNOCK_FRAMES = 15;

/** sp/f — how fast that shove moves him: 18.75 px in all. A GB Zelda's
 *  knockback is a scripted displacement, not a physics impulse — a fixed
 *  speed for a fixed frame count, so it always ends the same distance from
 *  the thing that hit you (it was a guessed 18 px over 12 frames). derived
 *  from the cartridge:
 *  linkUpdateKnockback moves Link at SPEED_140 (1.25 px/f;
 *  constants/common/objectSpeeds.s, SPEED_100 = 1 px/f). */
export const PLAYER_KNOCK_SPEED = 320;

/** f — invulnerability after an ordinary enemy takes a hit that names no tier
 *  in ENEMY_HIT_TIERS (no knockback, or an item of ours). derived from the
 *  cartridge: oracles-disasm code/collisionEffects.s, applyDamageToEnemyOrPart's
 *  @damageTypeTable, ENEMYDMG_04 (an L2 sword's hit): invincibilityCounter $15. */
export const ENEMY_INVULN_FRAMES = 21;

/** [px, f] — the cartridge's three strengths of hit on an ordinary enemy: how
 *  far it is thrown and how long it is then invulnerable. Low 16 px / 16 f
 *  (the L1 sword, the held blade), normal 22 px / 21 f (the L2 and L3 sword,
 *  seeds, thrown things), high 30 px / 26 f (the spin, a bomb). A hit of some
 *  other distance takes the invulnerability of the first tier at least as far.
 *  derived from the cartridge: oracles-disasm code/collisionEffects.s,
 *  applyDamageToEnemyOrPart's @damageTypeTable, ENEMYDMG_00/04/08
 *  (invincibilityCounter $10/$15/$1a, knockbackCounter $08/$0b/$0f) times
 *  ENEMY_KNOCK_SPEED; which item gets which is data/seasons/
 *  objectCollisionTable.s, ENEMYCOLLISION_STANDARD_ENEMY. */
export const ENEMY_HIT_TIERS = [[16, 16], [22, 21], [30, 26]];

/** f — how long an ordinary enemy flashes after a hit. derived: the cartridge
 *  flashes an enemy for exactly as long as its invincibilityCounter runs, so
 *  the flash is whatever ENEMY_HIT_TIERS / ENEMY_INVULN_FRAMES gave the hit;
 *  this is the value when nothing else names one. */
export const ENEMY_FLICKER_FRAMES = ENEMY_INVULN_FRAMES;

/** f — how many frames each beat of an enemy's hit flash lasts: the
 *  `hitflash` palette for this many, its own colours for this many, and so on
 *  for the whole flicker. measured: 4, the same beat as Link's. reference:
 *  assets/footage/seasons-tas-rooster-adventure.mp4, a Hardhat-style blue enemy struck
 *  at video frame 4104 — red 4104-4106, blue 4107-4110, red 4111-4114. It
 *  was 2. */
export const ENEMY_HIT_FLASH_BEAT = 4;

/** f — how long an ordinary enemy with a `spec.deathFrame` lingers showing it
 *  before removal. guessed, following BOSS_DEATH_FRAMES's own comment as a
 *  reference point: a boss gets 72 frames of death throes plus periodic
 *  explosions because it is a set piece; an ordinary enemy's death pose is a
 *  single held frame with no animation of its own, so it needs only long
 *  enough to be seen, not a performance. An enemy with no `deathFrame` is
 *  unaffected — it is still removed on the same frame it dies, as before. */
export const ENEMY_DEATH_FRAMES = 16;

/** f — how long an ordinary enemy with a `spec.attackFrame` holds that pose
 *  once `shoot()`/`shootRing()` fires. guessed, same order of magnitude as
 *  `ENEMY_FLICKER_FRAMES` above: long enough to read as "this is the attack,"
 *  not a full animation of its own. An enemy with no `attackFrame` is
 *  unaffected — `shoot()`/`shootRing()` still set the timer, but nothing
 *  reads it without the spec field, the same "harmless funnel" shape
 *  `Entity.hurt()`'s own hitstop already uses. */
export const ENEMY_ATTACK_FRAMES = 16;

/** sp/f — how fast an ordinary enemy is thrown by a hit: 2 px/f, for as many
 *  frames as the hit's KNOCK_* distance takes, straight AWAY from whatever hit
 *  it (not along Link's facing), and cut short the frame it stops moving.
 *  derived from the cartridge: oracles-disasm object_code/common/enemies/
 *  commonCode.s, ecom_updateKnockback_common ("Speed is 200 or 300 based on
 *  knockback duration"; SPEED_200 for every ordinary hit, and "Enemy stopped
 *  moving; stop knockback early"); the angle is code/collisionEffects.s
 *  @handleCollision, Link's position to the enemy's, flipped.
 *
 *  Worth knowing: contact damage does not care that an enemy is
 *  mid-knockback, in the cartridge or here. */
export const ENEMY_KNOCK_SPEED = 512;
// The KNOCK_* values below are DISTANCES IN PIXELS, not speeds. A hit shoves
// its target KNOCK_x pixels at ENEMY_KNOCK_SPEED, so each is an even number:
// the cartridge counts knockback in frames at 2 px a frame. Where Seasons has
// the same kind of hit the distance is its tier from ENEMY_HIT_TIERS.

/** px — default knockback dealt when a hit does not name its own. derived:
 *  ENEMY_HIT_TIERS' normal hit, what most of Seasons' items deal. */
export const KNOCK_DEFAULT = 22;

/** px — knockback dealt by a swing of the L1 sword. derived: ENEMY_HIT_TIERS'
 *  low hit (objectCollisionTable ENEMYCOLLISION_STANDARD_ENEMY, column
 *  ITEMCOLLISION_L1_SWORD = COLLISIONEFFECT_SWORD_LOW_KNOCKBACK). */
export const KNOCK_SWORD = 16;

/** px — knockback dealt by a swing of the L2 sword or better. derived:
 *  ENEMY_HIT_TIERS' normal hit (columns ITEMCOLLISION_L2/L3_SWORD =
 *  COLLISIONEFFECT_SWORD). */
export const KNOCK_SWORD_L2 = 22;

/** px — knockback dealt by a spin attack. derived: ENEMY_HIT_TIERS' high hit
 *  (column ITEMCOLLISION_SWORDSPIN = COLLISIONEFFECT_SWORD_HIGH_KNOCKBACK). */
export const KNOCK_SPIN = 30;

/** px — knockback dealt by a projectile. derived: ENEMY_HIT_TIERS' normal hit
 *  (the sword beam's and the seeds' columns). */
export const KNOCK_PROJECTILE = 22;

/** px — knockback dealt by an explosion. derived: ENEMY_HIT_TIERS' high hit
 *  (column ITEMCOLLISION_BOMB). */
export const KNOCK_EXPLOSION = 30;

/** px — knockback dealt by a thrown or dropped object. derived:
 *  ENEMY_HIT_TIERS' normal hit (column ITEMCOLLISION_THROWN_OBJECT). */
export const KNOCK_THROWN = 22;

/** px — knockback dealt by a stunning tool. guessed (our items); 6 rather
 *  than 5 since the S150 knockback moves in 2 px frames. */
export const KNOCK_TOOL = 6;

/** f — invulnerability after a boss takes a hit. guessed; shorter than an
 *  ordinary enemy's so a boss can be combo'd. */
export const BOSS_INVULN_FRAMES = 20;

/** f — invulnerability granted to a boss when it changes phase. guessed. */
export const BOSS_PHASE_INVULN_FRAMES = 20;

/** f — how long a boss is shoved after a hit. guessed. */
export const BOSS_KNOCK_FRAMES = 6;

/** x — bosses travel this fraction of the distance an enemy would. guessed. */
export const BOSS_KNOCK_SCALE = 0.4;

/** qh — damage from standing on a hazard tile (lava, spikes). guessed. */
export const HAZARD_DAMAGE = 2;

/** qh — damage from falling into a pit: one heart. derived from the
 *  cartridge: linkState02 @substate2 applies damageToApply $fc (-4 quarter
 *  hearts; the Gold Luck Ring halves it). Was a guessed half heart. */
export const PIT_DAMAGE = 4;

/** qh — damage from being washed out by water you cannot swim in: one heart,
 *  Seasons' drowning. derived: drowning ends in the same linkState02
 *  @respawn -> @substate2 as a pit, so it costs the same $fc. */
export const WASH_DAMAGE = 4;

/** qh — damage from standing in your own explosion. guessed. */
export const EXPLOSION_SELF_DAMAGE = 2;

/**
 * qh — damage a burning Kilnshell does to an enemy standing over it, per tick.
 * guessed.
 *
 * Deliberately small and repeating rather than one big hit: the shell is a
 * TRAP you set and the tide springs, so its combat verb should reward putting
 * it where something will be standing, not swinging it like a sword. It ticks
 * every fourth frame while alight (see Kilnshell.update).
 */
export const KILNSHELL_BURN_DAMAGE = 1;

// ---------------------------------------------------------------------------
// Jumping and the one-way ledge hop
// ---------------------------------------------------------------------------

// A JUMP'S REACH IS NOT A PROPERTY OF THE JUMP.
//
// The player keeps walking while airborne, so how far a hop carries is
// (airtime x WALK_SPEED) — and airtime is 2 * power / gravity. Re-deriving the
// walk speed therefore silently re-derives the length of every gap in the game.
// It did: dropping 1.35 px/f to 1.0 px/f cut the Feather's reach from 2.3 tiles
// to 1.7 and made the Coral Reef chasm uncrossable, which
// `node tools/check-gates.mjs` caught and nothing else would have. The three
// constants below are re-derived to put the reach back where it was.
//
//   reach  = 2 * power / gravity * WALK_SPEED
//   apex   = power^2 / (2 * gravity)
//
// 2*768/63 = 24.4 frames aloft at 1.5 px/f, 36.6 px of ground covered (2.3
// tiles), apex 768^2/126 = 18.3 px. S147 raised WALK_SPEED from 1 to 1.5 px/f
// (measured) and re-derived both so the reach and the apex did not move: power
// x1.5 and gravity x2.25 keep the apex and cut the airtime by a third.
//
// ROC'S FEATHER IS GONE. Nothing launches a free-standing jump any more: the
// hop is base moveset and fires by walking into a gap or a ledge, along a
// SCRIPTED arc (`ledgeHop`) rather than a ballistic one. These two constants
// still govern that arc's height and settle, and the reach formula above is
// still what decides how wide a gap may be, so they stay — but the numbers no
// longer describe an item anyone can be missing.

/** sp/f — upward velocity of a hop. derived from WALK_SPEED and JUMP_GRAVITY
 *  to preserve a 2.3-tile reach; 3 px/f exactly. */
export const JUMP_POWER = 768;

/** sp/f^2 — downward acceleration during a jump. derived: chosen with
 *  JUMP_POWER so that reach and apex both survive the new WALK_SPEED. */
export const JUMP_GRAVITY = 63;

/** sp/f — rate `z` bleeds back to the ground when not jumping. guessed. */
export const LAND_SETTLE_RATE = 128;

/** tiles — widest ledge run cleared in a single hop. guessed.
 *  A run is cleared in one hop so a two-tile drop reads as one movement. */
export const LEDGE_MAX_SPAN = 3;

/** f — duration of a one-way ledge hop, start to landing. derived from the
 *  cartridge: oracles-disasm object_code/common/specialObjects/link.s, the
 *  cliff check before linkState12 (LINK_STATE_JUMPING_DOWN_LEDGE) launches
 *  Link at speedZ -$1c0 and @substate1 pulls it back at $20 a frame:
 *  2 x 448 / 32 = 28 frames aloft. Was a guessed 18. */
export const LEDGE_HOP_FRAMES = 28;

/** px — peak height of the ledge-hop arc. derived: the same launch and
 *  gravity, 448^2 / (2 x 32) = 3136 subpixels, 12.25 px. Was a guessed 7. */
export const LEDGE_HOP_HEIGHT = 12;

/** px — how far in front of Link the ledge lip is probed for. guessed. */
export const LEDGE_PROBE_REACH = 10;

/** px — how far in front of Link a push block is probed for. guessed. */
export const PUSH_PROBE_REACH = 10;

// ---------------------------------------------------------------------------
// Room transitions and screen effects
// ---------------------------------------------------------------------------

/** f — length of a scrolling room-to-room transition going LEFT or RIGHT.
 *  measured: 40 frames, the view moving exactly 4 px every frame for 160 px.
 *  reference: assets/footage/seasons-tas-rooster-adventure.mp4, whole-screen shift
 *  between consecutive frames, video frames 77-116; the same at 1389, 2505,
 *  3072. It was 34 for both axes before S147. */
export const ROOM_TRANSITION_FRAMES_H = 40;

/** f — the same going UP or DOWN. measured: 32 frames, 4 px a frame for the
 *  128 px playfield. reference: assets/footage/seasons-tas-rooster-adventure.mp4,
 *  video frames 1864-1895; the same at 2057, 2267, 2665, 2820. */
export const ROOM_TRANSITION_FRAMES_V = 32;

/** px — how close to the room edge the player's hitbox must be for an exit to
 *  fire. derived from WALK_SPEED: at 384 sp/f the player's steps are 1 or 2
 *  pixels, so the band is as wide as the widest step and the exit fires on
 *  the first frame the edge is within one step, whichever step lands there.
 *  It was 1 while walking was exactly 1 px/f. */
export const ROOM_EXIT_MARGIN = 2;

// THE CAMERA, inside a multi-screen dungeon room only.
//
// S147 stepped Seasons' own big dungeon rooms: its view sits centred on Link
// and follows him at ONE pixel a frame, slower than he walks, so on a long walk
// he pulls ahead of the middle and the view catches up when he stops. Two of
// the three are measured from that; the width is by analogy. `KeyI` still
// draws the deadzone box in game.
//
// None of them can affect a 1x1 room. The camera clamps to [0, room.pw-VIEW_W]
// and that range is empty on one screen, so retuning these three numbers cannot
// move a pixel in any room the game currently has.

/** px — width of the box Link moves inside without the view following.
 *  guessed, by analogy with CAM_DEADZONE_H: the footage shows a sideways
 *  follow already under way (video frames 5781-5814) but never the frame it
 *  began. It was 96, which let him walk to within two tiles of the edge
 *  before the view moved at all — nothing like Seasons. */
export const CAM_DEADZONE_W = 8;

/** px — height of that box. measured, to a pixel or two: the view starts to
 *  follow on the frame Link's middle is about 4 px past the middle of the
 *  playfield. reference: assets/footage/seasons-tas-rooster-adventure.mp4, Link walking
 *  up the tall entrance room of the first dungeon — still view to video frame
 *  3852, following from 3853 with his sprite top at screen y 76. It was 64. */
export const CAM_DEADZONE_H = 8;

/** px/f — the fastest the camera may travel. measured: 1. reference:
 *  assets/footage/seasons-tas-rooster-adventure.mp4, whole-screen shift between frames
 *  while Link walks at 1.5 px/f: exactly 1 px every frame at video frames
 *  3853-3879 (up) and 5781-5814 (left), Link's own screen position drifting
 *  0.5 px/f the whole time. So the view LAGS a walking Link, on purpose. It
 *  was 2. */
export const CAM_MAX_SPEED = 1;

/** f — length of the tide's wave-front wipe across the screen. guessed.
 *  Was 44 while game.js stepped the sweep twice per frame, so the wipe really
 *  crossed in 23 and the constant described nothing. 23 is what the game has
 *  always looked like: the number moved to match the screen, not the other way
 *  round, so the wipe and the replays are unchanged. */
export const TIDE_SWEEP_FRAMES = 23;

/** x — fade opacity change per frame; a full fade is 1/FADE_RATE frames. guessed. */
export const FADE_RATE = 0.09;

/** [f, f, f] — going down or up STAIRS: fade to white over the first, hold
 *  white for the second, fade back in over the third. measured: out 27
 *  (5688-5715), white 31 (5715-5746), in 27 (5746-5773). reference:
 *  assets/footage/seasons-tas-rooster-adventure.mp4, mean screen brightness. Seasons fades
 *  to WHITE, not black. */
export const STAIRS_FADE = [27, 31, 27];

/** [f, f, f] — through a DOOR or a cave mouth: an instant cut to white and
 *  16 frames of white; the room then comes back by DOOR_REVEAL_*, not by a
 *  fade, so the third is 0. measured: white 16 (3660-3675), 16 (8599-8614),
 *  17 (14171-14187). reference: assets/footage/seasons-tas-rooster-adventure.mp4.
 *  (S150 read the reveal as a 20-frame fade in by mean brightness — S151.) */
export const DOOR_FADE = [0, 16, 0];

/** [f, f, f] — opening the item menu: the field fades to white, holds, and
 *  the item page fades in. measured: out 10 (1744-1754), white 20
 *  (1754-1774), in 8 (1774-1782). reference:
 *  assets/footage/seasons-tas-rooster-adventure.mp4, mean screen brightness.
 *  The HUD fades with the field. */
export const MENU_FADE_OPEN = [10, 20, 8];

/** [f, f, f] — closing the item menu: the page fades to white, holds, and the
 *  field fades back in. measured: out 9 (1791-1800), white 13 (1800-1813),
 *  in 9 (1813-1822). reference: assets/footage/seasons-tas-rooster-adventure.mp4. */
export const MENU_FADE_CLOSE = [9, 13, 9];

/** f — through any door (into a dungeon, out of one, into a cave): after
 *  DOOR_FADE's white, the HUD comes back over a blank field for this long
 *  before the room starts to open. measured: 6 (3676-3681), 5 (8615-8619),
 *  4 (14188-14191) — the cartridge is loading the room; the middle is taken.
 *  reference:
 *  assets/footage/seasons-tas-rooster-adventure.mp4. */
export const DOOR_REVEAL_BLANK = 5;

/** f — then the room is uncovered one column a frame, alternately to the
 *  right and to the left, until the field is whole. measured: 20 (3682-3701,
 *  8620-8639, 14192-14211 — identical each time). reference: assets/footage/seasons-tas-rooster-adventure.mp4. */
export const DOOR_REVEAL_STEPS = 20;

/** px — the width of each column the reveal uncovers. measured: 8 (every
 *  frame 3682-3701 widens the strip by exactly 8). reference:
 *  assets/footage/seasons-tas-rooster-adventure.mp4. */
export const DOOR_REVEAL_STEP_PX = 8;

/** px — the left edge of the reveal's first column, from the field's left.
 *  measured: 72 (3682 shows columns 72-79). reference:
 *  assets/footage/seasons-tas-rooster-adventure.mp4. */
export const DOOR_REVEAL_FROM = 72;

/** [f, f] — a chest item rising out of the chest: how far it rises (px) and
 *  over how many frames, and how long after the lid opens the text box
 *  appears. measured: the lid opens at 8133, the item appears at 8136 and
 *  rises 11 px (steps 2,1,1,0,1 then one pixel every four frames), the text
 *  box opens at 8169. reference: assets/footage/seasons-tas-rooster-adventure.mp4. */
export const CHEST_ITEM_RISE = [2, 1, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1];

/** f — from the chest lid opening to the text box opening. measured: 36
 *  (lid at video frame 8133, text box at 8169). reference:
 *  assets/footage/seasons-tas-rooster-adventure.mp4. The item appears 3 frames after the lid
 *  (CHEST_ITEM_DELAY). */
export const CHEST_TEXT_DELAY = 36;

/** f — from the lid opening to the item showing above the chest. measured: 3
 *  (8133 -> 8136). reference: assets/footage/seasons-tas-rooster-adventure.mp4. */
export const CHEST_ITEM_DELAY = 3;

/** f — how long the opening card holds before it fades, if nothing is
 *  pressed. guessed: the footage's run skips the card at its first chance
 *  (video frames 6744-6803 are 60 frames of it), so its natural length is
 *  not in the video. */
export const TITLE_CARD_FRAMES = 180;

/** f — the card's fade to white. measured: 21 frames. reference:
 *  assets/footage/seasons-tas-rooster-adventure.mp4, whole-screen brightness rising from
 *  video frame 6804 to full white at 6825. */
export const TITLE_FADE_FRAMES = 21;

/** f — the beat of plain white before the logo cuts in. measured: 22
 *  frames. reference: assets/footage/seasons-tas-rooster-adventure.mp4, white from video
 *  frame 6826 to 6847; the logo is on the screen at 6848, with no fade in. */
export const TITLE_WHITE_FRAMES = 22;

/** f — each half of PRESS START's blink. guessed: the run leaves the logo
 *  seventeen frames after it appears, before one full blink. */
export const TITLE_PRESS_BLINK = 16;

/** f — how long an area-name banner stays up. guessed. */
export const BANNER_FRAMES = 120;

// IMPACT.
//
// A connecting hit in both source games freezes the SIMULATION for a few
// frames — not the frame, not the music, not the HUD. `Game.hitstop` is that
// pause: entities stop stepping and everything else keeps running. See the
// comment above `Game.freeze` for what is deliberately left running and why.
//
// All three are `guessed`. They are the first numbers to settle by eye, and
// the reason the shake constants below them were re-tuned at the same time: a
// freeze in front of a shake changes what the shake reads as.

/** f — freeze when the player's own attack connects with an enemy. guessed.
 *  Short: this is the most-repeated interaction in the game and anything long
 *  enough to notice as a pause becomes a stutter over a hundred swings. It
 *  wants to read as weight in the swing, not as a hitch. */
export const HITSTOP_HIT_FRAMES = 3;

/** f — freeze when something lands a hit on the player. measured: 0 —
 *  Seasons does not stop the world when Link is hit. reference: assets/footage/seasons-tas-rooster-adventure.mp4,
 *  the hit at video frame 15516: the river enemy beside him keeps its
 *  two-frame animation (its tiles change on 15513, 15515, 15517, 15519
 *  without a gap) and Link's own sprite moves on every frame from 15516 to
 *  15521. It was 6. */
export const HITSTOP_HURT_FRAMES = 0;

/** f — freeze on the killing blow to a boss, before the death animation.
 *  guessed. Long enough to be a beat rather than a hitch, and it lands under
 *  the same moment `Game.bossDefeated` cuts the music. */
export const HITSTOP_BOSS_DEATH_FRAMES = 18;

// SCREEN SHAKE.
//
// Re-tuned once hitstop existed. Every one of these was previously chosen with
// nothing in front of it, so a shake had to carry the whole impact by itself
// and had grown long to do it. With a freeze in front, the shake's job is only
// to release the freeze — so amplitudes stay and DURATIONS COME DOWN. A shake
// that outlasts its own freeze by more than about its own length again stops
// reading as impact and starts reading as noise.
//
// Still `guessed`: nothing here has been frame-stepped against a reference.

/** px — screen shake amplitude for a small impact (a hit landing). guessed. */
export const SHAKE_SMALL = 2;

/** px — screen shake amplitude for an explosion or a boss stomp. guessed. */
export const SHAKE_MEDIUM = 3;

/** px — screen shake amplitude for a boss dying. guessed. */
export const SHAKE_LARGE = 4;

/** f — shake duration for a small impact. guessed. Was 8, with no freeze in
 *  front of it. HITSTOP_HIT_FRAMES now carries the first 3 frames of the hit,
 *  so 6 puts the whole event at 9 frames instead of 8 and spends more of it
 *  frozen than wobbling. */
export const SHAKE_SMALL_FRAMES = 6;

/** f — shake duration for an explosion or a boss stomp. guessed. Was 10. */
export const SHAKE_MEDIUM_FRAMES = 8;

/** f — shake duration for a boss dying. guessed. Was 40, which was two thirds
 *  of a second of continuous camera wobble and read as a rumble rather than a
 *  blow. HITSTOP_BOSS_DEATH_FRAMES now supplies the weight; 24 is what is left
 *  to release it, and the two together are still shorter than the old 40. */
export const SHAKE_LARGE_FRAMES = 24;

/** px, f — a boss landing, summoning or slamming the floor. guessed. Heavier
 *  than MEDIUM and lighter than a death; it exists because `src/data/bosses.js`
 *  spelled this weight out as bare literals at fourteen call sites, which is
 *  exactly what R3 forbids and what made re-tuning the six constants above a
 *  cosmetic change for every boss in the game. */
export const SHAKE_BOSS_SLAM = 4;
export const SHAKE_BOSS_SLAM_FRAMES = 14;

/** px, f — a sustained world rumble rather than a blow: the tide being forced
 *  to a level, ground giving way. guessed. Small amplitude, but the longest
 *  duration of any shake that is not a boss dying — a rumble is defined by
 *  lasting, and it is the one shake that is NOT preceded by a freeze, because
 *  nothing has been hit. */
export const SHAKE_RUMBLE = 2;
export const SHAKE_RUMBLE_FRAMES = 12;

/** px, f — a boss's armour or a wall shattering: the sharpest short shake in
 *  the game, and the only one that goes above SHAKE_LARGE's amplitude. guessed. */
export const SHAKE_BOSS_BREAK = 5;
export const SHAKE_BOSS_BREAK_FRAMES = 16;

// ---------------------------------------------------------------------------
// Player states other than walking
// ---------------------------------------------------------------------------

/** f — how long each of Link's three falling-in-a-hole frames is shown. derived
 *  from the cartridge: oracles-disasm data/seasons/specialObjectAnimationData.s,
 *  animationData19c59 (LINK_ANIM_MODE_FALLINHOLE): 16, 10, 10. */
export const FALL_ANIM_FRAMES = [16, 10, 10];

/** f — length of a pit fall before the player is replaced on solid ground.
 *  derived: the FALL_ANIM_FRAMES animation, then linkState02 @respawn's two
 *  invisible frames (counter1 $02). Was a guessed 34. */
export const FALL_FRAMES = FALL_ANIM_FRAMES.reduce((a, b) => a + b, 0) + 2;

/** f — length of being washed back to shore by water: Seasons' drowning.
 *  derived from the cartridge: animationData19c40 (LINK_ANIM_MODE_DROWN,
 *  6 + 16 frames to its end marker) and the same two invisible frames as a
 *  pit. There is no screen fade: linkState02 @substate5 animates and
 *  respawns, nothing else. (The footage's 4468-4495, once read as a drowning
 *  fade, is a staircase — S151.) Was a guessed 30. */
export const WASH_FRAMES = 6 + 16 + 2;

/** f — how long Link holds the conch, and is frozen for. guessed. */
export const CONCH_FRAMES = 46;

/** f — how long the player must lean on a block before it moves. derived from
 *  the cartridge: oracles-disasm code/interactableTiles.s, nextToPushableBlock
 *  counts wPushingAgainstTileCounter down from 20 (resetPushingAgainstTileCounter)
 *  and pushes when it reaches zero. Was a guessed 18. */
export const PUSH_DELAY_FRAMES = 20;

/** sp/f — how fast a pushed block slides its one tile: half a pixel a frame,
 *  32 frames for the tile. derived from the cartridge: oracles-disasm
 *  object_code/common/interactions/pushblock.s, SPEED_80 for counter1 $20.
 *  It was a bare one-pixel step inside PushBlock.update. */
export const BLOCK_SLIDE_SPEED = 128;

/** f — how long a Pegasus Seed's speed boost lasts. derived from the
 *  cartridge: oracles-disasm object_code/common/itemParents/seedsParent.s,
 *  @pegasusSeeds sets wPegasusSeedCounter to $03c0 and code/bank0.s
 *  decPegasusSeedCounter takes two off it a frame (one with the Pegasus
 *  Ring): 480 frames. Was a guessed 300. */
export const PEGASUS_FRAMES = 480;

/** f — how long Link holds a new item overhead. derived from the `itemGet`
 *  jingle, which is what the pose exists to sit under: 20 rows at bpm 132 and
 *  rowsPerBeat 4 is 6.82 f/row, and its last struck note stops ringing at row
 *  17 — 116 frames. It was 90, so Link put the item down a full 26 frames
 *  before his own fanfare finished, every time. The pose now outlasts the
 *  phrase instead of being cut off by it. */
export const ITEM_PRESENT_FRAMES = 116;

/** f — how long Link is frozen when claiming an essence. guessed. */
export const ESSENCE_FREEZE_FRAMES = 150;

/** f — how long the game-over screen holds before it accepts a button. guessed. */
export const GAMEOVER_WAIT_FRAMES = 100;

/** f — how long THE END holds before a button takes it back to the title, so
 *  the A that closed the ending's last line cannot also skip the card. guessed. */
export const THE_END_HOLD_FRAMES = 90;

// THE LOW-HEALTH PULSE.
//
// The game had no low-health warning at all — the one piece of feedback in
// every Zelda that tells a player to stop and heal, and this game's hearts sat
// silent all the way to zero.

/** qh — quarter-hearts at or below which the pulse starts. guessed. Two full
 *  hearts. Chosen against this game's damage ladder rather than the source's:
 *  a boss's heavy hit is 3-4 qh here, so 8 is "one more mistake". */
export const LOW_HEART_THRESHOLD = 8;

/** f — frames between pulses. guessed. Slow enough not to be a rattle and fast
 *  enough to feel like a heartbeat; it is the tempo that makes this a warning
 *  rather than an alarm, and it is the number to move first if it nags. */
export const LOW_HEART_EVERY = 40;

// TEXT.
//
// These lived inside `src/game/dialogue.js` as bare literals for the whole life
// of the project, which is the R3 violation the file's own header warns about:
// text cadence is the timing constant a player is exposed to more often than
// any other except walking, and it was not in this file.

/** f — how long each character of dialogue takes to appear. derived from the
 *  cartridge: oracles-disasm code/textbox.s, textSpeedData, the third byte of
 *  text speed 3 — the speed a new file starts on (code/fileManagement.s,
 *  initialFileVariables: wTextSpeed $02) — is $04. It was a guessed 1.6
 *  characters a FRAME, six times faster than Seasons.
 *  (The footage README's two-frames-a-step reading is the TAS's speed 5.) */
export const TEXT_FRAMES_PER_CHAR = 4;

/** f — the least time between two text blips. Every character that is not a
 *  space blips, unless one blipped this recently. derived from the cartridge:
 *  code/textbox.s, w7TextSoundCooldownCounter set to $04 on each blip and the
 *  space test beside it. At TEXT_FRAMES_PER_CHAR that is one blip a letter.
 *  Pressing A or B mid-line shows the rest of the LINE at once (@skipToLineEnd)
 *  with one blip; there is no held-button fast-forward in Seasons. */
export const TEXT_BEEP_COOLDOWN = 4;

/** px — how far in front of Link an A-button context action reaches. guessed. */
export const CONTEXT_REACH = 12;

/** px — how far in front of Link a lift reaches. guessed. */
export const LIFT_REACH = 12;

/** sp/f — speed of an object thrown by the player. guessed; 2.5 px/f, snapped
 *  to the grid from 2.6. */
export const THROW_SPEED = 640;

/** sp/f — upward velocity a thrown object leaves the hand with. guessed;
 *  0.625 px/f, snapped from the 0.6 that used to sit inline in items.js. */
export const THROW_ARC_RISE = 160;

/** sp/f^2 — downward acceleration on a thrown object's arc. guessed; snapped
 *  from the 0.22 that used to sit inline in items.js. */
export const THROW_ARC_GRAVITY = 56;

/** x — per-frame decay on a thrown bomb's ground slide. guessed; it used to
 *  sit inline in items.js. */
export const THROW_SLIDE_DECAY = 0.9;

/** sp/f — below this a thrown bomb's slide is called finished. guessed. */
export const THROW_SLIDE_STOP = 26;

/** px — height an object is held at while carried. guessed. */
export const CARRY_HEIGHT = 13;

// ---------------------------------------------------------------------------
// The Tidewright's Anchor
//
// The anchor holds a patch of the room at whatever tide level was current when
// it landed, while the rest of the room goes on obeying the conch.
// ---------------------------------------------------------------------------

/**
 * tiles — how far the held patch reaches from the anchor, in every direction.
 * guessed, AND EXPLICITLY UNSETTLED — to be decided by play, not by argument.
 * Press KeyU in game to cycle 1-4 and KeyY to swap the footprint's shape.
 *
 * The arithmetic that rules out the larger values, since it is not obvious: a
 * room is 10 tiles wide and 8 tall, so the radius has to split BOTH axes to be
 * worth anything. 4 spans 9 tiles and swallows the whole screen — the conch
 * appears to stop working. 3 spans 7 and covers 7 of the 8 rows, so it splits
 * horizontally and not vertically. 2 spans 5 and splits both. The execution
 * plan's original "~8 tiles" predates anyone checking this against a room.
 */
export const ANCHOR_RADIUS_TILES = 2;

/**
 * 'square' | 'disc' — the held patch's footprint. guessed, same debug key.
 *
 * At this scale the shape is legible to the player and has to be predictable.
 * A radius-2 disc is 13 tiles and reads as a fat plus sign whose edge is hard
 * to eyeball; a radius-2 square is a clean 5x5 whose corners you can see. Hence
 * square, but it is a feel question and the key exists to settle it.
 */
export const ANCHOR_SHAPE = 'square';

/** sp/f — how fast the anchor flies when thrown. guessed; matches THROW_SPEED
 *  so it reads as the same arm that throws a pot. */
export const ANCHOR_THROW_SPEED = 640;

/** sp/f — how fast the chain reels the anchor back on recall. guessed; faster
 *  than the throw, because a recall is a snap and a throw is a lob. */
export const ANCHOR_RECALL_SPEED = 896;

/** frames — how long the anchor stays visibly settling after it lands, before
 *  the water changes. guessed; long enough to read as a splash-then-hold. */
export const ANCHOR_SETTLE_FRAMES = 10;

/** hp — damage the chain does sweeping along its line on throw and recall.
 *  guessed; one quarter-heart less than a sword tap, since it is incidental. */
export const ANCHOR_CHAIN_DAMAGE = 1;

// ---------------------------------------------------------------------------
// Enemy cadence
// ---------------------------------------------------------------------------

// --- The lattice ---------------------------------------------------------
//
// Ground enemies do not have velocities. They take whole steps along an 8px
// lattice, and a step, once begun, runs to its end. Every decision an enemy
// makes about where to go is made standing on a lattice point. That is what
// makes an octorok's shot dodgeable and a room of them read as patterned
// rather than noisy. See docs/FEEL-SPEC.md, "The lattice".

/** px — the increment a ground enemy moves in. guessed, but constrained: it
 *  has to divide the 16px tile, and half a tile is the coarsest value that
 *  still lets an enemy stand in a doorway's centre. */
export const ENEMY_GRID_STEP = 8;

/** steps — how many lattice steps a wandering enemy commits to before it draws
 *  a new direction from the room's stream. guessed. This is the cadence that
 *  replaces the old per-frame turn probability: three steps is 24px, about a
 *  tile and a half, which is long enough to read as a decision and short
 *  enough that the enemy still feels loose. */
export const ENEMY_DECIDE_STEPS = 3;

/** f — how long an enemy hesitates after walking into something before it
 *  picks a new direction. guessed. Also bounds how often a cornered enemy can
 *  draw from the room stream. */
export const ENEMY_TURN_PAUSE_FRAMES = 6;

/** p — per-frame chance a wandering enemy changes direction. guessed.
 *  This now governs only the CONTINUOUS wander fallback — bosses and aquatic
 *  drifters, which are deliberately not on the lattice. A ground enemy never
 *  reads it. */
export const ENEMY_TURN_CHANCE = 0.012;

/** px/f — fallback speed for an enemy whose spec does not name one. guessed. */
export const ENEMY_DEFAULT_SPEED = 0.5;

/** f — frames per animation step for an enemy whose spec does not name one. guessed. */
export const ENEMY_DEFAULT_RATE = 10;

/** x — multiplier on an enemy's speed while charging. guessed. */
export const ENEMY_CHARGE_SPEED_MULT = 3;

/** f — recovery stun after a charge hits a wall. guessed. */
export const ENEMY_CHARGE_RECOVER_FRAMES = 24;

/** px — how closely the player must line up for a charge to trigger. guessed. */
export const ENEMY_CHARGE_TOLERANCE = 10;

/** px — how near the player must be for a charge to trigger. guessed. */
export const ENEMY_CHARGE_RANGE = 90;

/** f — how long after one of Nereth's attacks his weak point opens. guessed.
 *  His volley leaves at 2.0 px/f, so 34 frames carries it ~68px — past a player
 *  standing at the ~40px they were being hit at. See `nerethOpening`. */
export const NERETH_OPENING_DELAY = 34;

/** f — how long that opening lasts once it arrives. guessed; unchanged at 55,
 *  because the window was never the problem — WHEN it started was. */
export const NERETH_OPEN_FRAMES = 55;

/** px — how close the player has to get for Anemos's lash to stop reaching
 *  them. guessed. Same rule as ENEMY_CHARGE_MIN_RANGE and the same reason: the
 *  lash fired on `distToPlayer < 44/48/52`, which INCLUDES the ~24-30px a
 *  player stands at to swing, so attacking was itself the trigger for five
 *  damage-3 spears in a 40-degree fan — at point-blank a fan that tight has no
 *  gap to step into, and `T35` says the player is rooted for the whole swing
 *  and cannot leave anyway.
 *
 *  32 is outside sword reach, so the lash becomes a mid-range punish for
 *  standing in the open rather than a tax on closing. Anemos is ROOTED, so a
 *  player who gets inside that ring has genuinely earned the position — and it
 *  still costs them, because the rings and volleys fire regardless of distance
 *  and its jellyfish and urchins do not care where anyone is standing. */
export const ANEMOS_LASH_MIN_RANGE = 32;

/** f — Nereth's final-phase window, on a 200-frame cycle. guessed. Shorter than
 *  the 150 it was, because it now means something: he holds fire while it is
 *  open, so 90 of every 200 frames is a real invitation rather than a nominal
 *  one taken under five spears and twelve bubbles. */
export const NERETH_FINAL_OPEN_FRAMES = 90;

/** px — how CLOSE the player has to be for a charge to stop being available.
 *  guessed. A charge is a gap-closer, and a charge that fires when the player
 *  is already in sword reach is not a charge, it is a shove that cannot be
 *  answered.
 *
 *  This number is the fix for the boss ceiling documented as `T33`. Gohmaraq's
 *  phase-2 charge had a 130px range over an arena barely larger than that, so
 *  its melee-vulnerable range was a STRICT SUBSET of its charge-trigger range:
 *  walking into sword reach necessarily satisfied the trigger, which fires
 *  first, and charges chained with zero idle frames between. A 60,000-frame
 *  UNLIMITED-HEALTH run still stuck at 14 hp forever, which is what proved the
 *  ceiling structural rather than tactical and ended eight sessions of trying
 *  to dodge past it.
 *
 *  40px is outside sword reach and outside the distance a player stands at to
 *  swing (~26-30px centre to centre against a 32x32 boss), so a player who has
 *  closed the gap gets real melee frames — while a player at range still faces
 *  the charge the fight is built around. The close-range punish already exists
 *  and did not need adding: every charging boss in this game also runs a
 *  timed slam that sprays regardless of distance. */
export const ENEMY_CHARGE_MIN_RANGE = 40;

/** f — pause between hops. guessed. */
export const ENEMY_HOP_WAIT_FRAMES = 40;

/** px — how far a hop carries, if the enemy does not name its own. guessed.
 *  Must be a multiple of ENEMY_GRID_STEP: a hop is a lattice step with an arc
 *  on it, so it has to land the hopper back on the lattice. */
export const ENEMY_HOP_DIST = 16;

/** f — how long a hop is in the air, if the enemy does not name its own.
 *  guessed. Fixed, not derived from gravity: the arc is a curve fitted between
 *  two known endpoints rather than an integration, so the landing frame and the
 *  landing pixel are both known when the hop starts. */
export const ENEMY_HOP_FRAMES = 22;

/** px — peak height of a hop's arc. guessed. */
export const ENEMY_HOP_HEIGHT = 10;

/** rad/f — default angular speed of an orbiting enemy. guessed. */
export const ENEMY_ORBIT_SPEED = 0.045;

/** px — default orbit radius. guessed. */
export const ENEMY_ORBIT_RADIUS = 24;

/** f — how long a submerging enemy stays under. guessed. */
export const ENEMY_SUBMERGE_DOWN_FRAMES = 90;

/** f — how long a submerging enemy stays up. guessed. */
export const ENEMY_SUBMERGE_UP_FRAMES = 120;

/** px — nearest a resurfacing enemy will appear to the player. guessed. */
export const ENEMY_SURFACE_MIN_DIST = 32;

/** px — extra range beyond ENEMY_SURFACE_MIN_DIST it may appear at. guessed. */
export const ENEMY_SURFACE_DIST_SPAN = 24;

/** px — how close to a row or column counts as "the player is lined up". guessed. */
export const ENEMY_ALIGN_TOLERANCE = 12;

/** f — how long an aquatic enemy survives on dry land after the tide drops. guessed. */
export const ENEMY_BEACHED_FRAMES = 90;

/** f — a boss's held pose before it starts acting, if its spec omits one. guessed. */
export const BOSS_INTRO_FRAMES = 80;

/** f — length of a boss's death throes before the room clears. guessed. */
export const BOSS_DEATH_FRAMES = 72;

/** f — interval between explosions during a boss's death. guessed. */
export const BOSS_DEATH_BOOM_EVERY = 9;

/** f — delay between a boss dying and its essence appearing. guessed. */
export const BOSS_ESSENCE_DELAY_FRAMES = 70;

/** f — delay between a boss dying and room music resuming. guessed. */
export const BOSS_MUSIC_RESUME_FRAMES = 220;

// ---------------------------------------------------------------------------
// NPCs
// ---------------------------------------------------------------------------

/** f — how often a wandering NPC picks a new direction. guessed. */
export const NPC_WANDER_PERIOD = 90;

/** sp/f — how fast a wandering NPC ambles. guessed; 0.3125 px/f, snapped to
 *  the grid from 0.3. Under a pixel a frame, so it exists only because
 *  positions accumulate in subpixels. */
export const NPC_WANDER_SPEED = 80;

// ---------------------------------------------------------------------------
// Projectiles
// ---------------------------------------------------------------------------

/** px/f — speed of a shot fired by `shoot()` with no speed named. guessed. */
export const ENEMY_SHOT_SPEED = 1.5;

/** px/f — speed used by `fire()` when neither caller nor shot names one. guessed. */
export const PROJECTILE_SPEED = 1.6;

/** px/f — speed of a shot in a `shootRing` volley. guessed. */
export const RING_SHOT_SPEED = 1.2;

/** f — life of a projectile that does not name its own. guessed. */
export const PROJECTILE_LIFE = 150;

/** f — life of a shot from `shoot()`. guessed. */
export const ENEMY_SHOT_LIFE = 140;

/** f — life of a shot in a `shootRing` volley. guessed. */
export const RING_SHOT_LIFE = 130;

/** px — height a projectile flies at, so it clears shadows and low scenery. guessed. */
export const PROJECTILE_Z = 4;

// ---------------------------------------------------------------------------
// Pickups and drops
// ---------------------------------------------------------------------------

/** f — how long a dropped pickup lingers, once it has landed, before vanishing.
 *  derived from the cartridge: oracles-disasm object_code/common/parts/
 *  itemDrop.s — counter1 240 when it stops bouncing, taken down on every
 *  other frame (itemDrop_countdownToDisappear), 480 frames. Was a guessed
 *  460 counted from the moment it appeared. */
export const PICKUP_LIFE_FRAMES = 480;

/** f — for how much of the end of that life the pickup blinks, two frames
 *  shown and two hidden. derived: itemDrop_countdownToDisappear toggles its
 *  visibility each time it counts once counter1 is under 60 — 120 frames. */
export const PICKUP_BLINK_FRAMES = 120;

/** sp/f — the little upward pop a drop makes when it appears. guessed;
 *  -1.25 px/f, snapped to the grid from -1.2. */
export const PICKUP_POP_SPEED = -320;

/** sp/f^2 — gravity on that pop. guessed. */
export const PICKUP_GRAVITY = 40;

/** f — how long the pop lasts before the drop settles. guessed. */
export const PICKUP_SETTLE_FRAMES = 12;

/** f — delay before a drop can be collected, so it is not grabbed mid-pop. guessed. */
export const PICKUP_GRAB_DELAY = 8;

/** f — frames per wing frame. The healing fairy's two EXTRACTED frames
 *  (tools/rip-fairies.py) alternate every this many. guessed: nothing was
 *  frame-stepped for it. Six is two beats a second at 60fps, which is a flutter
 *  rather than a flap; the sheet gives wings-up and wings-out and nothing in
 *  between, so slower reads as a stutter and faster as a blur. */
export const FAIRY_FLAP_FRAMES = 6;

/** rad/f — how fast a fairy's drift angle turns. guessed. */
export const FAIRY_DRIFT_TURN = 0.06;

/** sp/f — amplitude of a fairy's drift on x. guessed; 0.6875 px/f. */
export const FAIRY_DRIFT_X = 176;

/** sp/f — amplitude of a fairy's drift on y. guessed; 0.625 px/f. */
export const FAIRY_DRIFT_Y = 160;

// ---------------------------------------------------------------------------
// Effects
// ---------------------------------------------------------------------------

/** f — life of a bomb before it detonates is set per-item; this is how long the
 *  explosion entity itself lives. guessed. */
export const EXPLOSION_FRAMES = 24;

/** px — radius Link's charge sparkles scatter over. guessed. */
export const CHARGE_SPARKLE_SPREAD = 12;

/** px — radius an essence's sparkles scatter over. guessed. */
export const ESSENCE_SPARKLE_SPREAD = 10;

/** f — interval between an essence's sparkles. guessed. */
export const ESSENCE_SPARKLE_EVERY = 10;

/** f — interval between foam puffs while wading. guessed. */
export const WADE_FOAM_EVERY = 14;

// ---------------------------------------------------------------------------
// The item roster (docs/ITEMS.md)
//
// Every number in this section is `guessed`. Not one of these items exists in
// the source games, so there is nothing to frame-step: `measured` is not
// available here even in principle, and `derived` only where a value is
// computed from another constant in this file. Anything that later gets tuned
// against play is still `guessed` — see the provenance rules at the top.
// ---------------------------------------------------------------------------

// --- Brineglass Lens -------------------------------------------------------

/** f — how long the ghosted overlay takes to fade in when the Lens is raised,
 *  and out again when it is released. guessed. */
export const LENS_FADE_FRAMES = 10;

/** x — peak opacity of the ghosted next-tide terrain drawn over the room.
 *  guessed, but MEASURED AGAINST A ROOM, which is more than it was. D2's forks
 *  ask the Lens the hardest question in the game — three shafts that are the
 *  same `dPit` where you stand and shallow water / a pit / deep water one level
 *  up — and the three previewed tiles were coming out 4-6 units apart in RGB,
 *  which is not a difference a person reads at 160x144. Sampled over the pit
 *  in d2 1,2,2 — regenerate the shot with
 *  `node tools/shoot-rooms.mjs --tide=0 --px=72 --py=88 --lens d2,1,2,2` —
 *  mean RGB of each throat:
 *
 *    ghost   west (wadeable)   middle (pit)   east (drowning)
 *    0.55    (23, 33, 51)      (17, 21, 38)   (19, 27, 48)
 *    0.80    (26, 38, 58)      (17, 21, 38)   (20, 29, 53)
 *    1.00    (28, 40, 60)      (17, 20, 38)   (21, 30, 55)
 *
 *  0.80 buys most of what 1.00 buys and keeps the overlay translucent, which
 *  is what stops it reading as the room having already changed. THE REAL LIMIT
 *  IS NOT THIS NUMBER: shallow water, deep water and a dungeon pit are three
 *  dark blues, so no opacity separates them by much. See docs/ART-BACKLOG.md. */
export const LENS_GHOST_ALPHA = 0.80;

/** x — opacity of the cold wash laid over the whole screen while the Lens is
 *  up, so the preview cannot be mistaken for the room actually changing.
 *  guessed. */
export const LENS_TINT_ALPHA = 0.16;

/** x — opacity a phase-shifted enemy is drawn at while the Lens reveals it.
 *  It is solid enough to aim at, because the Lens makes it hittable. guessed. */
export const LENS_PHASE_ALPHA = 0.8;

/** f — period of the slow shimmer on the ghosted overlay. guessed. */
export const LENS_SHIMMER_FRAMES = 48;

// --- Kelp-Soled Cleats -----------------------------------------------------

/** sp/f — walking speed on the seafloor in sink mode. guessed; 0.625 px/f,
 *  five eighths of WALK_SPEED. Sink mode buys safety with pace, and the number
 *  has to be slow enough that taking the floor route is a decision. */
export const SINK_SPEED = 160;

/** px/f — a Bogwater torrent, the current the Sanctum is built out of.
 *  derived, and the derivation is the whole point: it is strictly GREATER than
 *  SWIM_SPEED (288 sp/f = 1.125 px/f since S147), so a swimmer pressing into it nets
 *  backwards and can never make headway, while a walker on the floor is not
 *  touched by a current at all. An ordinary riptide is 0.55 px/f — less than a
 *  swimmer's own speed — so it is a tax on the surface route and not a barrier,
 *  which is why D3 needed a second, stronger current rather than reusing it.
 *  Retune SWIM_SPEED and tools/check-cleats.mjs re-proves every torrent room
 *  against the new ratio instead of quietly passing. S147 did exactly that:
 *  walking went to 1.5 px/f (measured), swimming followed it to 1.125, and
 *  this rose from 0.9 by the same factor of 1.5 to stay 1.2x the swimmer. */
export const TORRENT_PUSH = 1.35;

/** f — frames each step of a current tile's animation holds. derived: the
 *  Ages current tile moves its dashes 2 px per step, so 2 / this is the speed
 *  the water is SEEN to run, and it is chosen to match the speed it pushes —
 *  2 / 2 = 1 px/f against TORRENT_PUSH's 0.9, 2 / 4 = 0.5 px/f against a
 *  riptide's 0.55. A player reads how hard the water pulls off how fast the
 *  foam goes by. */
export const TORRENT_ANIM_RATE = 2;
/** f — how long a gust wheel holds each quarter-turn while the wind is on it
 *  (it alternates o_valve and o_valve_turn). guessed; fast enough to read as
 *  spinning, slow enough that the two poses are both seen. */
export const WHEEL_SPIN_BEAT = 4;
/** f — the same for an ordinary riptide. derived; see TORRENT_ANIM_RATE. */
export const RIPTIDE_ANIM_RATE = 4;

/** f — the descent when sink mode is entered over deep water, and the ascent
 *  when it is left. Control is suspended for the whole of it. guessed. */
export const SINK_ENTER_FRAMES = 18;

/** f — breath in sink mode at Cleats L1. Cleats L2 (the Mermaid Suit) has no
 *  limit at all. guessed; ~13 seconds, long enough to cross a room and short
 *  enough that a wrong turn costs you. */
export const CLEATS_BREATH_FRAMES = 800;

/** f — how much breath is left when the warning starts. guessed. */
export const CLEATS_BREATH_WARN_FRAMES = 180;

/** f — interval between bubbles rising off a walker on the seafloor. guessed. */
export const SINK_BUBBLE_EVERY = 22;

/** qh — damage taken when breath runs out and the Cleats float you up on their
 *  own. guessed; the same as being washed ashore, because it is the same kind
 *  of failure. */
export const SINK_DROWN_DAMAGE = 2;

// --- Squall Bellows --------------------------------------------------------

/** tiles — how far the gust cone reaches. guessed; three tiles is far enough
 *  to reach across a channel and short enough that you have to commit a
 *  position to it. */
export const BELLOWS_RANGE = 3;

/** f — how long the bellows take to fill before the cone opens. guessed. The
 *  wind-up is what makes standing still a decision rather than a reflex. */
export const BELLOWS_WARMUP_FRAMES = 14;

/** sp/f — how hard the gust shoves a light enemy. guessed; 0.75 px/f, a little
 *  under a walk, so a pushed enemy visibly loses ground rather than flying. */
export const BELLOWS_PUSH = 192;

/** f — interval between gust puffs drawn in the cone. guessed. */
export const BELLOWS_PUFF_EVERY = 6;

/** x — a raft under the gust travels this fraction of BELLOWS_PUSH. guessed;
 *  a raft is heavy and the difference should be legible. */
export const BELLOWS_RAFT_SCALE = 0.5;

/** f — frames a gusted wheel keeps turning after the gust stops. guessed. */
export const BELLOWS_WHEEL_COAST = 30;

// --- Reefseed --------------------------------------------------------------

/** f — how long a thrown Reefseed takes to become a coral pillar. guessed;
 *  two seconds. THE DELAY IS THE DESIGN — see docs/ITEMS.md. Shorten it and
 *  the item becomes a block placer; lengthen it and nobody waits. */
export const REEFSEED_GROW_FRAMES = 120;

/** f — how long the seed tumbles before it settles and starts growing.
 *  guessed. */
export const REEFSEED_SETTLE_FRAMES = 22;

/** sp/f — how fast a thrown Reefseed travels. guessed; 2 px/f, a lob rather
 *  than a shot, because you are aiming at a tile and not at a creature. */
export const REEFSEED_THROW_SPEED = 512;

/** f — interval between the sprout's shudders while it grows. guessed. */
export const REEFSEED_SHUDDER_EVERY = 12;

/** how many Reefseeds a full pouch holds. guessed. */
export const REEFSEED_CAPACITY = 8;

/** how many bombs a full bag holds. guessed; it was a bare 10 inside
 *  `Game.openChest` until the Reefseed's empty-satchel bug moved the whole
 *  counted-item rule down into `giveItem`, which is not allowed a magic
 *  number any more than anything else is. */
export const BOMB_CAPACITY = 10;

// --- Dredge Line -----------------------------------------------------------

/** px — how far the line is cast. guessed; four tiles, so it reaches across a
 *  channel the player is standing on the bank of. */
export const DREDGE_RANGE = 64;

/** sp/f — how fast the weight travels on the way out. guessed; 3.5 px/f. */
export const DREDGE_CAST_SPEED = 896;

/** sp/f — how fast the line comes back in, loaded or empty. guessed; a drag is
 *  slower than a cast, which is what makes hauling something read as work. */
export const DREDGE_HAUL_SPEED = 512;

/** sp/f — how fast a FIXED snag hauls Link instead. guessed. */
export const DREDGE_PULL_SPEED = 768;

/** f — how long a dredged-up creature flops on land, helpless. guessed;
 *  long enough for two sword swings and no more. */
export const DREDGE_FLOP_FRAMES = 150;

/** x — damage multiplier on a flopping creature. guessed; being landed is
 *  supposed to be the answer to an aquatic enemy, not a nudge. */
export const DREDGE_FLOP_DAMAGE_SCALE = 2;

// --- Resonance Rod ---------------------------------------------------------

/** px — how far the note carries at LOW and MID tide. guessed; three tiles. */
export const ROD_RANGE = 48;

/** px — how far it carries at HIGH. guessed; water carries a note, and this is
 *  the one item whose own power depends on the tide. Roughly double. */
export const ROD_RANGE_HIGH = 96;

/** f — how long armoured metal locks rigid when it is rung. guessed; the brief
 *  says about 90 frames and this is that number until someone plays it. */
export const ROD_LOCK_FRAMES = 90;

/** f — how long the ring itself lasts on screen. guessed. */
export const ROD_RING_FRAMES = 26;

/** f — how long the rod cannot be sounded again. guessed; long enough that
 *  holding the button is not a stun-lock. */
export const ROD_COOLDOWN_FRAMES = 48;

/** f — how long a sunken bell hums after the Resonance Rod is sounded near it,
 *  and how long its pointing sparks last. guessed. */
export const BELL_CHIME_FRAMES = 60;

// --- Ferryman's Coin -------------------------------------------------------

/** sp/f — how fast the coin is pitched. guessed; 2.25 px/f, a coin toss. */
export const COIN_THROW_SPEED = 576;

/** f — how long the coin is in the air before it settles. guessed. */
export const COIN_SETTLE_FRAMES = 26;

/** f — the pause between the tide finishing its sweep and the swap firing.
 *  guessed; long enough to read as a consequence of the tide rather than as
 *  part of it. */
export const COIN_SWAP_DELAY_FRAMES = 24;

/** f — interval between the coin's glints while it waits. guessed. */
export const COIN_GLINT_EVERY = 40;

// --- Bottled Tide ----------------------------------------------------------

/** how many Bottled Tides you can carry at once. guessed; the number is the
 *  difficulty dial on every boss room that keeps the mechanic switched on. */
export const BOTTLE_CAPACITY = 4;

/** f — Link is held while the bottle is poured out. guessed; long enough that
 *  using one in a boss fight is a window you have to make. */
export const BOTTLE_POUR_FRAMES = 34;

/** tiles — the widest gap the base hop clears. derived, not guessed: the hop
 *  reuses the one-way ledge arc, whose span is LEDGE_MAX_SPAN, and a gap is
 *  cleared the same way a ledge lip is. Two means a one-tile chasm is free and
 *  a two-tile one is not, which is the line every gap in the world is drawn
 *  against now that Roc's Feather is gone and the hop is base moveset. */
export const GAP_HOP_MAX_SPAN = 2;

/** what bare hands are worth when lifting, against a tile's `liftLevel`.
 *  derived from the roster, not guessed: the Power Bracelet is gone and
 *  lifting is base moveset, so ordinary pots and rocks (`liftLevel` unset or
 *  1) come up and a boulder (`liftLevel` 2) does not. The boulder wants the
 *  Dredge Line now — see docs/ITEMS.md. */
export const LIFT_STRENGTH = 1;

// --- Scrimshaw (P7) --------------------------------------------------------
// Every number here is `guessed` and cannot be otherwise: no Oracle system
// slots a passive by world state, so there is no reference to frame-step. They
// are stated as multipliers of things that already exist wherever possible, so
// re-tuning a base constant carries the charm with it.

/** f — how long a case stays awake after the tide leaves it, with the Neap
 *  Charm in that case. guessed; the plan says three seconds and three seconds
 *  at 60Hz is what this is. It is the whole width of the transition window
 *  the charm exists to create, so it is the first number to move if the
 *  transition play does not read. */
export const NEAP_GRACE_FRAMES = 180;

/** most charms one case can ever hold. guessed; the late-game case upgrade
 *  raises progress.charmCase from 1 to this. */
export const CHARM_CASE_MAX = 2;

/** dimensionless — swim speed multiplier with the Riptide Fin. guessed; the
 *  plan says +40% and the product is rounded back onto a whole subpixel at the
 *  call site, the same way the terrain multipliers are. */
export const RIPTIDE_FIN_FACTOR = 1.4;

/** dimensionless — everywhere-speed multiplier with Deadweight. guessed; the
 *  plan's 15% slower, and the price of never being pushed again. */
export const DEADWEIGHT_FACTOR = 0.85;

/** dimensionless — how hard a current pushes with the Kelp Braid. guessed. */
export const KELP_BRAID_FACTOR = 0.5;

/** px — extra span on the sword's sweep with the Split Fang, added to
 *  the sword's hit area across the facing. guessed; one tile's worth of blade split across both sides, so
 *  a swing catches a foe standing off the axis of the one you meant to hit. */
export const SPLIT_FANG_SPAN = 8;

/** dimensionless — how far the sword throws with the Sea-Wolf's Tooth,
 *  against KNOCK_SWORD. guessed. */
export const SEAWOLF_KNOCK_FACTOR = 2;

/** chance a hit is shrugged off entirely with the Hagstone. guessed; the plan
 *  had no such charm, and a quarter is high enough to notice inside one room
 *  and low enough that it is never a plan. Rolled off the ROOM stream. */
export const HAGSTONE_CHANCE = 0.25;

/** f — interval between Strandwalker's quarter-hearts on dry land. guessed;
 *  slow enough that it is a charm you leave on rather than a charm you farm. */
export const STRANDWALKER_EVERY = 300;

/** dimensionless — bomb blast radius multiplier with Dry Kindling. guessed. */
export const DRY_KINDLING_FACTOR = 1.5;

/** dimensionless — pickup lifetime multiplier with the Gull's Tally. guessed;
 *  the plan says twice as long and this is that. */
export const GULLS_TALLY_FACTOR = 2;

/** dimensionless — shop price multiplier with the Chandler's Eye. guessed. */
export const CHANDLER_FACTOR = 0.75;

/** extra Reefseeds the Quartermaster's Mark carries, on REEFSEED_CAPACITY.
 *  guessed; the plan says two. */
export const QUARTERMASTER_BONUS = 2;

/** px — extra reach on the Dredge Line with the Coilrope, on DREDGE_RANGE.
 *  guessed; the plan says one tile and a tile is 16px. */
export const COILROPE_RANGE = 16;

/** dimensionless — how much of the dive/surface transition the Pressure Scar
 *  spends, against SINK_ENTER_FRAMES. guessed. */
export const PRESSURE_SCAR_FACTOR = 0.5;

/** tide changes a commissioned charm takes to carve. derived from the design,
 *  not guessed: the plan says one tide cycle, and the Moon Conch's cycle is
 *  TIDE_COUNT steps round. */
export const CARVE_TIDE_TURNS = 3;

/** rupees the scrimshander charges to carve a blank. guessed; roughly a good
 *  dungeon's takings, so a charm is a decision rather than a formality. */
export const CARVE_PRICE = 60;

/** dimensionless — how much of CONCH_FRAMES the Bosun's Whistle spends.
 *  guessed; the conch's lock-out is a real cost in a fight, and halving it is
 *  the most direct way a charm can say "you use the tide more". */
export const BOSUN_FACTOR = 0.5;

/** px — how far a lit dark room reads, against the unlit 54. guessed; wide
 *  enough that a lantern charm changes how the room is played rather than how
 *  it is lit. */
export const LANTERN_RADIUS = 96;

/** f — how often the Wrecker's Eye winks over a hidden thing. guessed; slow
 *  enough to read as a glint rather than a blinking marker. */
export const WRECK_GLIMMER_PERIOD = 90;

/** f — how long each wink lasts, inside WRECK_GLIMMER_PERIOD. guessed. */
export const WRECK_GLIMMER_ON = 20;

/** peak opacity of the Wrecker's Eye wink. guessed. */
export const WRECK_GLIMMER_ALPHA = 0.85;

/** essences before the scrimshander cuts you the LOW case. derived from the
 *  eight-dungeon spine, not guessed: two, four and six spread the three
 *  scrimshaw unlocks evenly across it and leave the last two dungeons free of
 *  system-teaching. */
export const CHARM_LOW_ESSENCES = 2;

/** essences before the HIGH case. derived, as above. */
export const CHARM_HIGH_ESSENCES = 4;

/** essences before every case takes two charms. derived, as above. */
export const CHARM_CASE_ESSENCES = 6;

/** px — how far out from Link the sword sprite is drawn during a swing.
 *  guessed. The blade is its own 16x16 sprite (see `fx_blade_*` in
 *  tools/rip-link.py — on real hardware the sword is a separate sprite from
 *  Link, which is why the sheet's slash poses have no blade in them), so this
 *  is the gap between his cell and the blade's. 11 leaves a few pixels of
 *  overlap at the hilt so the sword reads as HELD rather than as floating
 *  alongside him; the arc effect is drawn a pixel further out again. */
export const BLADE_REACH_PX = 11;

// ---------------------------------------------------------------------------
// Pause menu
// ---------------------------------------------------------------------------

/** f — how long one line of a scrolling item or charm description is held
 *  before the next one slides up. guessed; a line of this font at this width
 *  is a dozen words at most, and 96 frames is a comfortable read of one
 *  without the panel feeling frozen. The description panel is one line tall
 *  and several descriptions wrap to three, so this is the ONLY way the rest
 *  of the words are ever seen. */
export const MENU_DESC_DWELL = 96;

/** f — extra frames the FIRST line of a scrolling description is held for,
 *  on top of MENU_DESC_DWELL. guessed. The cycle wraps from the last line
 *  straight back to the first, and without a longer beat there the loop reads
 *  as a jitter rather than as a sentence starting again. */
export const MENU_DESC_HOLD = 48;

/** px — how far out from Link the blade is drawn on the swing's last phase,
 *  when it is drawn back from full reach. derived: BLADE_REACH_PX less the 7
 *  px the cartridge's own hit area steps back between those two phases
 *  (SWORD_ARC, e.g. right: 19 -> 12). */
export const BLADE_TUCK_PX = 4;

// ---------------------------------------------------------------------------
// Cutscenes — the `show` step (S10)
//
// A cutscene can now hold a sprite up on screen. These are its timings. There
// is deliberately no camera-pan constant here: every room a cutscene plays in
// is exactly one screen (all six boss rooms are 160x128), so `Camera.update`
// pins x/y to 0 and a pan step would be a no-op everywhere it was used. See
// S10's notes in docs/NEXT-SESSION.md.

/** f — how long a shown sprite is held when the step does not say. guessed;
 *  long enough to read as a beat rather than a flash, short enough that a
 *  player who has seen it five times is not waiting on it. */
export const CUTSCENE_SHOW_FRAMES = 110;

/** f — frames per frame of a shown sprite's two-frame cycle. guessed; this is
 *  the same cadence the world's own two-frame idles run at, so an Essence held
 *  up in a cutscene pulses at the rate it pulses at on the floor. */
export const CUTSCENE_SHOW_ANIM_FRAMES = 10;

/** px — how far a shown sprite drifts upward across its whole hold. guessed.
 *  The drift is what makes it read as presented rather than pasted; it is
 *  small on purpose, and it is integer-stepped like everything else that
 *  moves. */
export const CUTSCENE_SHOW_RISE_PX = 6;

/** chars/s — how fast a caption can be READ, used as the floor under every
 *  card's hold. guessed; a comfortable silent-reading rate for short lines on
 *  a handheld, deliberately on the slow side because a card that outstays its
 *  welcome costs a button press and a card that vanishes early costs the line.
 *
 *  IT IS A FLOOR, NOT A DURATION. `runCutscene` holds a caption for whichever
 *  is longer, the frames the scene asked for or the time its own text needs,
 *  so a scene can dwell as long as it likes and cannot ask for less than
 *  legible. Every one of the eleven title cards in the game was asking for
 *  less than legible before this existed: the intro's opening paragraph is 97
 *  characters and was on screen for 3.7 seconds. */
export const CUTSCENE_READ_CPS = 14;

/** f — added to every caption's reading time, for the beat before the eye
 *  starts and the beat after it finishes. guessed. */
export const CUTSCENE_READ_LEAD_FRAMES = 30;

// ---------------------------------------------------------------------------
// Music engine — vibrato and arpeggio (S6)
// ---------------------------------------------------------------------------
//
// Echo's own delay is deliberately NOT here — it is expressed in ROWS, not
// frames, because it has to track each track's own tempo (see the comment on
// `echo` in src/core/audio.js). These two techniques wobble or cycle a pitch
// in real time regardless of tempo, so frames are the right unit and R3 says
// they belong in this file like any other timing constant.

/** f — frames a held note rings before vibrato engages. guessed. The source
 *  games almost never wobble a note from the moment it is struck; the wobble
 *  is something a SUSTAINED note earns, not an attack transient. */
export const VIBRATO_DELAY_FRAMES = 10;

/** f — frames per vibrato pitch step. guessed. This is a STEP interval, not a
 *  smoothing time: the hardware retriggers pitch on a frame grid rather than
 *  gliding, so the engine re-issues `setValueAtTime` on this grid instead of
 *  ramping — see `_scheduleVibrato`. Do not "fix" this into a ramp; that is
 *  this session's own failure condition. */
export const VIBRATO_STEP_FRAMES = 4;

/** semitones — how far a vibrato step swings above and below the written
 *  pitch. guessed. `check-music.mjs` validates the SWUNG extreme (written
 *  pitch times this depth) against each channel's real frequency range, not
 *  just the written note, because depth can push a high note out of range at
 *  the top of its swing even when the note itself is legal. */
export const VIBRATO_DEPTH_SEMITONES = 0.18;

/** f — frames per arpeggio step, cycling a chord token's notes on one
 *  channel to stand in for polyphony the hardware does not have. guessed;
 *  fast enough to read as one chord rather than a scale run. */
export const ARPEGGIO_STEP_FRAMES = 3;

// ---------------------------------------------------------------------------
// SEASONS' ENEMIES, PORTED (S151). Each enemy's walk, stand, turn and shot,
// read from its own file in the Oracle of Seasons disassembly
// (github.com/Stewmath/oracles-disasm, object_code/common/enemies/<name>.s).
// Speeds: constants/common/objectSpeeds.s, where SPEED_100 is one pixel a
// frame along one axis, so SPEED_80 is 0.5. Damage and health stay ours.
// ---------------------------------------------------------------------------

/** px/f — the octorok's walk. derived: octorok.s octorok_state_uninitialized,
 *  SPEED_80 for a red octorok (objectSpeeds.s: SPEED_100 = 1 px/f). */
export const OCTOROK_SPEED = 0.5;

/** [f] — how long an octorok stands before it walks again, indexed by the
 *  roll that decided it. derived: octorok.s octorok_counter1Values. */
export const OCTOROK_STAND_FRAMES = [30, 45, 60, 75, 45, 60, 75, 90];

/** [f] — how long an octorok walks, one picked at random. derived: octorok.s
 *  octorok_walkCounterValues ($19 $21 $29 $31); the walk counter is
 *  decremented before the step, so it walks one frame fewer than each. */
export const OCTOROK_WALK_FRAMES = [25, 33, 41, 49];

/** mask — after each walk an octorok rolls a byte and ANDs it with this; zero
 *  means shoot, anything else picks the stand from OCTOROK_STAND_FRAMES. So a
 *  red octorok shoots one time in eight. derived: octorok.s @counter1Ranges
 *  ($07 for a red one) and octorok_state_08. */
export const OCTOROK_SHOOT_MASK = 7;

/** f — an octorok stands this long, facing where it will shoot, before the
 *  rock leaves. derived: octorok.s octorok_state_08, counter1 $10. */
export const OCTOROK_SHOOT_WINDUP = 16;

/** f — and stands this long after it. derived: octorok.s octorok_state_0b,
 *  counter1 $20. */
export const OCTOROK_SHOOT_REST = 32;

/** 1-in-n — the chance an octorok turns to face Link as it sets off on a
 *  walk. derived: octorok.s octorok_state_09 (random & 3 == 0). */
export const OCTOROK_TURN_TO_LINK = 4;

/** px/f — the octorok's rock. derived: parts/octorokProjectile.s @state0,
 *  speed $50 = SPEED_200. */
export const OCTOROK_SHOT_SPEED = 2;
