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

/** sp/f — Link's ground speed, straight along one axis. derived: 1 px/f —
 *  Seasons' own speed table (object_code/common/specialObjects/link.s,
 *  updateLinkSpeed_withParam @speedTable) walks him at SPEED_100 on plain
 *  ground, "1 pixel per frame" (constants/common/objectSpeeds.s), and only
 *  at SPEED_180 under a Pegasus Seed. S164, at the human's word ("he does in
 *  fact walk slower in the original").
 *
 *  It was 384 (1.5 px/f) from S147 to S164, "measured" off the TAS in
 *  assets/footage/ (video frames 9912-9960 step 1,2,1,2 px). That footage is
 *  a tool-assisted run and Link in it moves at what is, by the code, the
 *  Pegasus-Seed speed with no seed in sight; the code and the human both say
 *  the plain walk is 1 px/f, so the footage is not the reference for this. */
export const WALK_SPEED = 256;

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
export const DOORWAY_PULL_SPEED = 128;

/** sp/f — surface swimming. derived: three quarters of WALK_SPEED, the same
 *  ratio the old guessed pair (0.95 / 1.35) had, snapped to the grid. */
export const SWIM_SPEED = 192;

/** sp/f — under the Pegasus Seed. derived: SPEED_180, 1.5 px/f — the
 *  "P. Normal" column of Seasons' own speed table (link.s @speedTable). */
export const BOOST_SPEED = 384;

/** sp/f — walking with the shield raised. derived: three quarters of
 *  WALK_SPEED. */
export const SHIELD_SPEED = 192;

/** sp/f — walking with the sword held out. derived: kept equal to
 *  SHIELD_SPEED, because both are "you are committed to something and cannot
 *  move at full pace". guessed insofar as its ancestor is. */
export const SWORD_HOLD_SPEED = 192;

/** x — multiplier on F.SLOW terrain (sand, deep grass). derived: Seasons'
 *  own speed table (object_code/common/specialObjects/link.s,
 *  updateLinkSpeed_withParam @speedTable) walks Link at SPEED_0c0 on
 *  TILETYPE_GRASS against SPEED_100 on plain ground — three quarters (S164,
 *  at the human's word "match the original"; it was a guessed 0.6). Seasons
 *  has no slow sand; ours takes grass's rule. */
export const SLOW_FACTOR = 0.75;

/** x — multiplier while wading in shallow water. derived: 1 — the same
 *  table slows Link only on grass, stairs and vines, never in a puddle
 *  (TILETYPE_PUDDLE), so wading costs no speed on the cartridge (S164; it
 *  was a guessed 0.86). Kept as a named 1 so the wade path still reads. */
export const SHALLOW_FACTOR = 1;

/** x — multiplier while carrying something. derived: 1 — Seasons' speed
 *  table (object_code/common/specialObjects/link.s, @speedTable) has no
 *  carrying row; Link walks at full speed with a pot over his head (S164, at
 *  the human's word "match the original"; it was a guessed 0.9). */
export const CARRY_FACTOR = 1;

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

/** f — once a spin is charged the BLADE flashes: this many frames in the
 *  orange-and-black flash palette, then this many in its own colours, from
 *  the frame it charges. derived from the cartridge: oracles-disasm
 *  object_code/common/items/sword.s @state3 ("sword fully charged, flashing")
 *  counts counter1 up a frame and, while its bit 2 is clear, sets the blade's
 *  OAM flags to $0d (sprite palette 5, data/seasons/paletteData.s
 *  standardSpritePaletteData). There are no sparkles: the blade itself
 *  blinks. Before S172 Link threw out gold sparkles every 6 frames, guessed. */
export const CHARGE_FLASH_BEAT = 4;

/** f — how long the blade holds each of the spin's eight positions, as
 *  [cardinal, the diagonal after it]: a quarter turn is five frames. derived:
 *  oracles-disasm data/seasons/specialObjectAnimationData.s, Link's
 *  LINK_ANIM_MODE_28..2b (animationData19d66..19d78), `.db $03 ..` then
 *  `.db $02 ..` per direction, chained clockwise up, right, down, left. */
export const SPIN_STEP_FRAMES = [3, 2];

/** f — length of a spin attack: five quarter turns, one full circle and back
 *  to the quarter it began on. derived: oracles-disasm
 *  object_code/common/itemParents/swordParent.s @state3 loads counter1 = $05
 *  (no Spin Ring), and @state4 ends the spin when five quarters have passed. */
export const SPIN_FRAMES = 25;


/** px — where the blade can hit at each of the spin's eight positions,
 *  clockwise from up (even = cardinal, odd = the diagonal after it), as
 *  [radiusY, radiusX, offsetY, offsetX] from Link's centre: an 18x18 box out
 *  where the blade is, not a square around him. derived from the cartridge:
 *  oracles-disasm object_code/common/items/postUpdate.s, swordArcData rows
 *  16-23, which updateSwingableItemAnimation picks while the spin animation's
 *  parameter is $10-$17 (data/seasons/specialObjectAnimationData.s,
 *  animationData19d66..19d78). Before S172 the spin hit a guessed 30x30
 *  square on Link, which reached 15 px; the blade reaches 28. */
export const SPIN_ARC = [
  [9, 9, -17, -4], [9, 9, -14, 16], [9, 9, 2, 19], [9, 9, 18, 16],
  [9, 9, 21, 3], [9, 9, 17, -13], [9, 9, 2, -19], [9, 9, -11, -13],
];

/** px — the ONE point the blade cuts grass, bushes and snarls at, as [dy, dx]
 *  from Link's centre: for each of the eight blade positions clockwise from
 *  up, then (index 8) under Link himself. A swing cuts at its facing's point
 *  on the full-reach frame; a spin cuts at each position's point as the blade
 *  arrives there, and under Link as it ends. derived from the cartridge:
 *  oracles-disasm object_code/common/items/commonCode2.s, tryBreakTileWithSword
 *  @linkOffsets, called from postUpdate.s updateSwingableItemAnimation on
 *  every animation frame whose parameter has bit 6 set (the swing's $64, each
 *  spin step's $5x/$dx) and from sword.s @state5 with 8. Before S172 the
 *  blade cut every tile under its whole hit box, so a swing reached grass
 *  28 px off and could cut two tufts at once. */
export const SWORD_CUT_POINTS = [
  [-14, 0], [-14, 13], [0, 13], [13, 13], [13, 0], [13, -14], [0, -14], [-14, -14], [0, 0],
];

/** f — frames after a swing ends before the still-held button becomes a hold
 *  rather than the tail of the swing. derived from the cartridge: swordParent.s
 *  @state6 turns the blade into the held blade (ITEMCOLLISION_SWORD_HELD) on
 *  the frame the swing's animation ends, so the first frame after it. */
export const SWORD_HOLD_DELAY = 1;


/** px — knockback dealt by the extended blade. derived: ENEMY_HIT_TIERS' low
 *  hit (objectCollisionTable ENEMYCOLLISION_STANDARD_ENEMY, column
 *  ITEMCOLLISION_SWORD_HELD = COLLISIONEFFECT_SWORD_LOW_KNOCKBACK). A
 *  distance, like every other KNOCK_* — see the note above them. */
export const KNOCK_HOLD = 16;

/** f — THE POKE: the held blade jabbed into a wall or an enemy, as [frames at
 *  full reach, frames drawn back]. Link stands still for both. derived from
 *  the cartridge: swordParent.s @checkAndRetForSwordPoke / @triggerSwordPoke
 *  set LINK_ANIM_MODE_1f, which is data/seasons/specialObjectAnimationData.s
 *  animationData19d0c: `$06 $b4 $44` (full reach; bit 6 breaks the tile at the
 *  point ahead, or clinks off it), `$06 $b0 $06` (drawn back), then the end
 *  marker. Pushed into a wall, the poke goes back to the hold with the charge
 *  started over (@state6, counter1 $28); into an enemy, the blade is put away
 *  (@state5 with subid 0 -> @deleteSelf). Before S172 the held blade clinked
 *  off a wall every guessed 20 frames and kept charging, and dealt a guessed
 *  quarter heart to anything it touched while staying out. */
export const SWORD_POKE_PHASES = [6, 6];

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

/** f[] — how long each frame of the puff an ordinary enemy dies in is held,
 *  in the order sprites-effects.js lists `fx_kill*` frames. derived from the
 *  cartridge: oracles-disasm data/seasons/partAnimations.s, partAnimation573db
 *  (PART_ENEMY_DESTROYED's animation 0): 2 2 2 4 4 4 2, then it holds its last
 *  frame until enemyDestroyed.s sees animParameter and deletes itself. 20
 *  frames in all. Was ENEMY_DEATH_FRAMES, a guessed 16-frame hold of a
 *  hand-drawn collapse pose no Oracle enemy has. */
export const KILL_PUFF_HOLDS = [2, 2, 2, 4, 4, 4, 2];

/** f — the beat of that puff's palette flicker: enemyDestroyed.s xors its oam
 *  flags' palette bit on every other frame (`ld a,(wFrameCounter); rrca`), so
 *  each colour shows for two frames. derived from the cartridge. */
export const KILL_PUFF_FLICKER = 2;

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

/** f — invulnerability after a boss or miniboss takes a hit, and how long it
 *  flashes. derived from the cartridge: oracles-disasm code/collisionEffects.s,
 *  the effects a boss's weak point gives a sword (COLLISIONEFFECT_21 ->
 *  ENEMYDMG_30, COLLISIONEFFECT_SWORD_NO_KNOCKBACK -> ENEMYDMG_0c; e.g.
 *  data/seasons/objectCollisionTable.s ENEMYCOLLISION_AQUAMENTUS_HORN,
 *  ENEMYCOLLISION_MOTHULA): invincibilityCounter $20, knockbackCounter 0.
 *  Was a guessed 20 "so a boss can be combo'd" (S166, the human: match). */
export const BOSS_INVULN_FRAMES = 32;

/** f — invulnerability granted to a boss when it changes phase. guessed. */
export const BOSS_PHASE_INVULN_FRAMES = 20;


/** qh — damage from stepping on spikes: one heart. derived from the
 *  cartridge: oracles-disasm object_code/common/specialObjects/commonCode.s,
 *  dealSpikeDamageToLink (`ld a,-4`; the Red Luck Ring halves it). Was a
 *  guessed half heart. */
export const HAZARD_DAMAGE = 4;

/** f — the safety a spike's sting buys, and how long it shoves Link back the
 *  way he came. derived from the cartridge: dealSpikeDamageToLink sets
 *  invincibilityCounter 40 and knockbackCounter 10, at the reverse of his own
 *  angle (`xor $10`), rather than the 34 and 15 an enemy's hit gives. */
export const SPIKE_INVULN_FRAMES = 40;
export const SPIKE_KNOCK_FRAMES = 10;

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

/**
 * frames — how long the burst of flame shown as the Kilnshell is struck
 * stays on screen. guessed: two turns of the three-frame flame (6 frames
 * each), a flash and no more.
 *
 * S162: it used the flame effect's default life of 9999 frames, so the burst
 * stood on the strike tile for nearly three minutes after the shell had been
 * lifted and carried away — a fire burning on bare floor, which read as the
 * shell's flame left behind.
 */
export const KILNSHELL_STRIKE_FLASH_FRAMES = 36;

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
// 2*512/28 = 36.6 frames aloft at 1 px/f, 36.6 px of ground covered (2.3
// tiles). S147 raised WALK_SPEED to 1.5 px/f and re-derived the pair (768,
// 63); S164 put walking back to Seasons' 1 px/f and the pair back with it.
//
// ROC'S FEATHER IS GONE. Nothing launches a free-standing jump any more: the
// hop is base moveset and fires by walking into a gap or a ledge, along a
// SCRIPTED arc (`ledgeHop`) rather than a ballistic one. These two constants
// still govern that arc's height and settle, and the reach formula above is
// still what decides how wide a gap may be, so they stay — but the numbers no
// longer describe an item anyone can be missing.

/** sp/f — upward velocity of a hop. derived from WALK_SPEED and JUMP_GRAVITY
 *  to preserve a 2.3-tile reach; 2 px/f exactly (S164: back to the pre-S147
 *  pair, now that WALK_SPEED is 1 px/f again). */
export const JUMP_POWER = 512;

/** sp/f^2 — downward acceleration during a jump. derived: chosen with
 *  JUMP_POWER so that reach and apex both survive the new WALK_SPEED. */
export const JUMP_GRAVITY = 28;

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
 *  fire. derived from WALK_SPEED: as wide as the widest step Link takes, so
 *  the exit fires on the first frame the edge is within one step. 1 at
 *  1 px/f (it was 2 while walking was 1.5 px/f, S147-S164). */
export const ROOM_EXIT_MARGIN = 1;

// THE CAMERA, inside a multi-screen dungeon room only.
//
// Seasons has no deadzone (S171, read from oracles-disasm bank1.s
// updateCameraPosition): every frame the view's target is Link's position
// minus half the screen (SCREEN_HEIGHT*16/2, SCREEN_WIDTH*16/2), clamped to the
// room, and hCameraY/X step ONE pixel toward it — so a walking Link pulls ahead
// of the middle and the view catches up when he stops. S147 measured 4 px of
// slack in the footage; the cartridge's own code says the target is the centre
// itself, and the footage's 4 px was its measurement's own pixel or two.
// CAM_DEADZONE_W/H (8 and 8, one guessed) are gone with it.
//
// It cannot affect a 1x1 room. The camera clamps to [0, room.pw-VIEW_W] and
// that range is empty on one screen (Seasons: `@smallRoom`, camera 0,0).

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
 *  pressed. derived: Seasons' Nintendo/Capcom card (oracles-disasm
 *  code/bank3Cutscenes.s, intro_capcomScreen @state0) counts 208 frames
 *  down before it fades out to white. Was a guessed 180 (S169). */
export const TITLE_CARD_FRAMES = 208;

/** f — how long the logo sits with nothing pressed before the music stops,
 *  the screen fades to white and the card and opening play again. derived:
 *  Seasons' intro_titlescreen_state0 loads a 16-bit countdown of $0960
 *  (2400) into wTmpcbb3, state1 counts it down a frame at a time, and at zero
 *  fades out (SNDCTRL_FAST_FADEOUT, fadeoutToWhite) and intro_restart goes
 *  back to the Capcom screen. */
export const TITLE_IDLE_FRAMES = 2400;

/** f (a frame-count mask) — the title's music fading out, when the logo is
 *  left alone and when START is pressed on it: a volume step each time the
 *  fade's counter has these bits set (every 8th frame), silent after 64.
 *  derived: intro_titlescreen_state1 plays SNDCTRL_FAST_FADEOUT; code/audio.s
 *  @sndfa loads wSoundFadeSpeed $07. */
export const TITLE_MUSIC_FADE_MASK = 0x07;

/** f — the logo's fade to white when START is pressed on it (or when it is
 *  left alone). measured: 28 frames. reference:
 *  assets/footage/seasons-tas-rooster-adventure.mp4, the logo still at video
 *  frame 6864, whole-screen brightness rising from 6865 to full white at
 *  6892. Longer than the card's TITLE_FADE_FRAMES because the logo has black
 *  in it, and fadeoutToWhite brings each colour up a step at a time. */
export const TITLE_LOGO_FADE_FRAMES = 28;

/** f — the white between the logo's fade and the file select cutting in.
 *  measured: 20 frames. reference:
 *  assets/footage/seasons-tas-rooster-adventure.mp4, full white from video
 *  frame 6893 to 6912; the file select is on the screen at 6913, with no fade
 *  in. */
export const TITLE_FILES_WHITE_FRAMES = 20;

// ---------------------------------------------------------------------------
// The opening (S168): a ship at sea, a storm, the shore — ours, played before
// the title the way Seasons plays its ride. Its pictures are the cartridge's
// (tools/rip-intro.py); how long each scene runs is ours.
// ---------------------------------------------------------------------------

/** f — the calm sea before the weather turns. guessed. */
export const INTRO_SEA_FRAMES = 300;

/** f — the sky darkening into the storm, in the console's four palette
 *  steps. guessed. */
export const INTRO_DARKEN_FRAMES = 120;

/** f — the storm itself, lightning and all, before the sea rises. guessed. */
export const INTRO_STORM_FRAMES = 330;

/** f — the sea rising over the ship. guessed. */
export const INTRO_SWELL_FRAMES = 96;

/** px — how far the sea rises over the ship, top to bottom. guessed. */
export const INTRO_SWELL_RISE = 56;

/** f — the white the sea leaves before the shore fades in. guessed. */
export const INTRO_WHITE_FRAMES = 40;

/** f — the shore at HIGH before the sea draws back. guessed. */
export const INTRO_SHORE_HIGH_FRAMES = 120;

/** f — the shore after the sea has drawn back off Link, before the title.
 *  guessed. */
export const INTRO_SHORE_LOW_FRAMES = 210;

/** f per px — the ship's drift across the calm sea, one pixel every this many
 *  frames. guessed. */
export const INTRO_SHIP_DRIFT = 6;

/** f — how often the ship steps through INTRO_BOB_Z. derived: Seasons'
 *  INTERAC_LINK_SHIP (object_code/common/interactions/linkShip.s in
 *  oracles-disasm) updates the ship's Z every 32 frames. */
export const INTRO_SHIP_BOB = 32;

/** f — how often a gull steps through INTRO_BOB_Z. derived: linkShip.s
 *  steps a seagull's Z when its counter's low three bits are clear, every 8
 *  frames. */
export const INTRO_GULL_BOB = 8;

/** px — the bob, one entry a step (negative is up). derived: linkShip.s
 *  @zPositions, $00 $ff $ff $00 $00 $01 $01 $00. */
export const INTRO_BOB_Z = [0, -1, -1, 0, 0, 1, 1, 0];

/** px per f — a gull's glide, and its climb out of the storm. guessed. */
export const INTRO_GULL_SPEED = 0.25;

/** f — each frame of a lightning bolt. derived: Seasons' PART_LIGHTNING
 *  animation (data/seasons/partAnimations.s partAnimation574dd), nine frames
 *  held 1 1 1 1 2 2 4 4 4. */
export const INTRO_BOLT_HOLDS = [1, 1, 1, 1, 2, 2, 4, 4, 4];

/** f — when the screen flashes as lightning strikes: white until the first
 *  entry, normal until the second, and so on; normal for good from the last.
 *  derived: Seasons' screenFlashingData @data0 (code/bank3Cutscenes.s,
 *  flashScreen_body), $02 $04 $06 $0c $0e. */
export const INTRO_FLASH = [2, 4, 6, 12, 14];

/** f — when each lightning bolt strikes, counted from the storm's start.
 *  guessed. */
export const INTRO_STRIKES = [40, 128, 170, 250, 300];

/** f — the card's fade to white. measured: 21 frames. reference:
 *  assets/footage/seasons-tas-rooster-adventure.mp4, whole-screen brightness rising from
 *  video frame 6804 to full white at 6825. */
export const TITLE_FADE_FRAMES = 21;

/** f — the card fading in from white, at power-on and when the idle logo
 *  comes round to it again. derived: intro_capcomScreen @state0 calls
 *  fadeinFromWhite, the same palette-thread speed (1) as the fadeoutToWhite
 *  measured above on the same colours, so the same 21 frames. (The Japanese
 *  footage's card cuts in: that is intro_japaneseOnlyScreen, which has no
 *  fade; the card everyone else sees is the Capcom one.) */
export const TITLE_CARD_FADE_IN_FRAMES = 21;

/** f — the beat of plain white before the logo cuts in. measured: 22
 *  frames. reference: assets/footage/seasons-tas-rooster-adventure.mp4, white from video
 *  frame 6826 to 6847; the logo is on the screen at 6848, with no fade in. */
export const TITLE_WHITE_FRAMES = 22;

/** f — each half of PRESS START's blink. derived from the cartridge:
 *  oracles-disasm code/bank3Cutscenes.s, intro_titlescreen hides the
 *  titlescreenPressStartSprites while bit 5 of its frame countdown (wTmpcbb3)
 *  is set, so it shows 32 frames and hides 32. Was a guessed 16. */
export const TITLE_PRESS_BLINK = 32;

/** f — how long an area-name banner stays up. guessed. */
export const BANNER_FRAMES = 120;

// IMPACT.
//
// `Game.freeze` stops the SIMULATION for a few frames — not the frame, not the
// music, not the HUD. Seasons does not do it for an ordinary hit, either way
// round (S165, S147 below): only our own boss's killing blow still freezes.

/** f — freeze when the player's own attack connects with an enemy: none.
 *  derived from the cartridge: oracles-disasm code/collisionEffects.s, every
 *  collision effect a sword, a seed or a bomb has on an enemy sets damage,
 *  knockback and invincibility and nothing that stops the world. It was a
 *  guessed 3, "to read as weight in the swing". */
export const HITSTOP_HIT_FRAMES = 0;

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
// Seasons shakes the view one way only (code/bank1.s updateScreenShake): for
// as many frames as setScreenShakeCounter was given, each axis is moved by one
// of four offsets picked afresh every frame. A strength other than the default
// is set by two cutscenes and nothing in play, so every shake here is that
// default and only its LENGTH differs. It shakes for a boss pounding the floor
// and for scripted moments; a bomb, a sword hit and a boss's death do not
// shake the screen at all, and since S165 neither do ours.

/** px[] — the offsets one shaking frame picks from, on each axis. derived from
 *  the cartridge: updateScreenShake's @data row for wScreenShakeMagnitude 0,
 *  $fe $ff $01 $02. It replaced six guessed amplitudes of 2 to 5 px. */
export const SHAKE_OFFSETS = [-2, -1, 1, 2];

/** f — shake for a small jolt of our own: a Reefseed stake coming up, a
 *  charger hitting a wall. guessed (nothing in Seasons does either). */
export const SHAKE_SMALL_FRAMES = 6;

/** f — shake for a boss's lesser blow (a lunge landing, a wall struck).
 *  guessed. */
export const SHAKE_MEDIUM_FRAMES = 8;

/** f — a boss landing, summoning or slamming the floor. derived from the
 *  cartridge: object_code/seasons/enemies/aquamentus.s, aquamentus_body_pound,
 *  `ld a,$20; call setScreenShakeCounter` — Seasons' own boss pound, 32
 *  frames. It was a guessed 14. */
export const SHAKE_BOSS_SLAM_FRAMES = 32;

/** f — a sustained world rumble rather than a blow: the tide being forced to a
 *  level, ground giving way. guessed. */
export const SHAKE_RUMBLE_FRAMES = 12;

/** f — a boss's armour or a wall shattering. guessed. */
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

/** px/f — how fast a dungeon key leaves Link's hands and rises out of its
 *  keyhole. derived from the cartridge: oracles-disasm object_code/common/
 *  interactions/overworldKeySprite.s @state0, `ld bc,-$200` into
 *  objectSetSpeedZ — speedZ -$200, two pixels a frame upward. */
export const KEY_RISE_SPEED = 2;

/** px/f² — how fast that rise slows. derived from the cartridge:
 *  overworldKeySprite.s @state1, `ld c,$28` into objectUpdateSpeedZ_paramC:
 *  $28/256 of a pixel a frame off the speed every frame, until it stops
 *  climbing (about 13 frames and 13 pixels up). */
export const KEY_RISE_GRAVITY = 0x28 / 256;

/** f — how long the key hangs over the keyhole once it has stopped rising,
 *  before it is gone and the door opens. derived from the cartridge:
 *  overworldKeySprite.s @state1, counter1 = $3c, counted down by @state2. */
export const KEY_HOLD_FRAMES = 60;

/** f — how long the ground rumbles as a dungeon door opens to its key.
 *  guessed: Seasons' opening scenes are per door (the Gnarled Root's rises
 *  out of the ground); ours is one shake for every door. */
export const KEYHOLE_OPEN_FRAMES = 40;

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

/** px — how far above Link an item he holds up is drawn. derived from the
 *  cartridge: oracles-disasm object_code/common/interactions/treasure.s,
 *  @setLinkAnimationAndDeleteIfTextClosed puts the treasure at Link's position
 *  with `ld b,$f2` (y -14) through objectTakePositionWithOffset. Both are
 *  sprite centres, and both sprites are 16x16, so it is the same offset
 *  between their corners. It was 16. */
export const ITEM_HOLD_RISE = 14;

/** px — how far toward his raised hand a ONE-handed hold draws the item.
 *  derived: same routine, @grabMode1 `ldbc $80,$fc` (x -4); @grabMode2, both
 *  hands, is `ldbc $81,$00`. */
export const ITEM_HOLD_ONE_HAND_X = -4;

/** f — how long Link is frozen when claiming an essence. guessed. */
export const ESSENCE_FREEZE_FRAMES = 150;

// Link's death and the game over (S169), as Seasons plays them: he spins
// where he fell, collapses, and the save screen comes up as GAME OVER.

/** f — Link's death spin: facing the viewer for the first step, then round
 *  right, away, left and back to the viewer, each held this long. derived:
 *  data/seasons/specialObjectAnimationData.s animationData19beb
 *  (LINK_ANIM_MODE_SPIN): frame 2 for $08, then a loop of 1, 0, 3 for $08
 *  each and 2 for $07 + $01. */
export const DEATH_SPIN_STEP = 8;

/** — how many times round he spins before he collapses. derived:
 *  object_code/common/specialObjects/link.s linkState03 sets counter1 to $04
 *  and counts one off at each lap's end marker ($80); at zero he collapses.
 *  4 laps of 4 steps after the first step: 136 frames. */
export const DEATH_SPIN_LAPS = 4;

/** f — how long he lies collapsed before the game over screen. derived:
 *  animationData19be5 (LINK_ANIM_MODE_COLLAPSED) holds frame 4 for $4c, and
 *  its next entry's $ff is what linkState03 reads as the trigger. */
export const DEATH_COLLAPSE_FRAMES = 76;

/** f (a frame-count mask) — the music's fade when Link dies: the master
 *  volume drops a step each time the fade's frame counter has all of these
 *  bits set (frame 31, then every 32nd), and stops everything one step past
 *  silent. derived: code/bank1.s standardGameState plays SNDCTRL_SLOW_FADEOUT
 *  the frame after wLinkDeathTrigger goes $ff; code/audio.s @sndfc loads
 *  wSoundFadeSpeed $1f and updateSound steps on (counter & speed) == speed.
 *  The death sound, once it plays, ends the fade (Audio.fadeOut). */
export const DEATH_MUSIC_FADE_MASK = 0x1f;

/** f — the game over screen fading in from white. derived: runSaveAndQuitMenu
 *  calls fastFadeinFromWhite, palette thread speed 3 against fadeinFromWhite's
 *  1 (code/bank0.s), so a third of TITLE_FADE_FRAMES' measured 21. */
export const GAMEOVER_FADE_IN_FRAMES = 7;

/** f — after a choice, how long the cursor flickers before it takes effect.
 *  derived: saveQuitMenu_state1 sets delayCounter to $1e; the acorn hides
 *  while bit 2 of it is set (saveQuitMenu_drawSprites). */
export const GAMEOVER_PICK_FRAMES = 30;

/** f — how long THE END holds before a button takes it back to the title, so
 *  the A that closed the ending's last line cannot also skip the card. guessed. */
export const THE_END_HOLD_FRAMES = 90;

// THE LOW-HEALTH PULSE.
//
// The game had no low-health warning at all — the one piece of feedback in
// every Zelda that tells a player to stop and heal, and this game's hearts sat
// silent all the way to zero.

/** x — the pulse sounds while health is at or below 1/LOW_HEART_DIVISOR of
 *  the heart container total. derived: Seasons' playHeartBeepAtInterval
 *  (code/bank2.s) beeps while (health - 1) * 4 < maximum health, in quarter
 *  hearts (S164, at the human's word; it was a fixed 8 quarter-hearts). */
export const LOW_HEART_DIVISOR = 4;

/** f — frames between pulses. derived: 64 — Seasons' playHeartBeepAtInterval
 *  (code/bank2.s) beeps when `wFrameCounter & $3f` is zero (S164; it was a
 *  guessed 40). */
export const LOW_HEART_EVERY = 64;

// TEXT.
//
// These lived inside `src/game/dialogue.js` as bare literals for the whole life
// of the project, which is the R3 violation the file's own header warns about:
// text cadence is the timing constant a player is exposed to more often than
// any other except walking, and it was not in this file.

/** f — how long each character of dialogue takes to appear. derived from the
 *  cartridge: oracles-disasm code/textbox.s, textSpeedData, the third byte of
 *  text speed 5 — the fastest of the five the file-select menu offers — is
 *  $02. The human chose it in S157 from a side-by-side of speeds 3, 4 and 5;
 *  before that it was speed 3's $04, the speed a new file starts on
 *  (code/fileManagement.s, initialFileVariables: wTextSpeed $02), and before
 *  that a guessed 1.6 characters a FRAME. Speed 5 is also the footage README's
 *  two-frames-a-step reading (the TAS plays on it). */
export const TEXT_FRAMES_PER_CHAR = 2;

/** f — the least time between two text blips. Every character that is not a
 *  space blips, unless one blipped this recently. derived from the cartridge:
 *  code/textbox.s, w7TextSoundCooldownCounter set to $04 on each blip and the
 *  space test beside it. At speed 5's two frames a letter that is one blip
 *  every other letter, as the cartridge does at that speed.
 *  Pressing A or B mid-line shows the rest of the LINE at once (@skipToLineEnd)
 *  with one blip; there is no held-button fast-forward in Seasons. */
export const TEXT_BEEP_COOLDOWN = 4;

/** px — how far in front of Link an A-button context action reaches. guessed. */
export const CONTEXT_REACH = 12;

/** px — how far in front of Link a lift reaches. guessed. */
export const LIFT_REACH = 12;


/** sp/f — upward velocity a thrown object leaves the hand with. guessed;
 *  0.625 px/f, snapped from the 0.6 that used to sit inline in items.js. */
export const THROW_ARC_RISE = 160;

/** sp/f^2 — downward acceleration on a thrown object's arc. guessed; snapped
 *  from the 0.22 that used to sit inline in items.js. */
export const THROW_ARC_GRAVITY = 56;

/** sp/f — how fast a thrown pot, rock or bush travels across the floor.
 *  derived from the cartridge (S157): oracles-disasm object_code/common/items/
 *  commonBombAndBraceletCode.s, itemWeights row 0 (weight 0: a pot, a rock, a
 *  bush), byte 2 = SPEED_180 without the Toss Ring = 1.5 px/f
 *  (constants/common/objectSpeeds.s, SPEED_100 = 1 px/f). Before S157 a lifted
 *  tile was thrown with no speed at all and broke at Link's feet. */
export const LIFTED_THROW_SPEED = 384;

/** sp/f — upward speed it leaves Link's hands with. derived from the cartridge
 *  (S157): itemWeights row 0, byte 1 = $10 read as speedZ $ff10 (itemBeginThrow
 *  forces the high byte to $ff) = -240 sp/f, i.e. 240 up. */
export const LIFTED_THROW_RISE = 240;

/** sp/f^2 — what gravity takes off that each frame. derived from the cartridge
 *  (S157): itemWeights row 0, byte 0 = $1c, added to speedZ by
 *  objectUpdateSpeedZ_paramC (code/bank0.s) AFTER z has moved, which is the
 *  order ThrownObject.update keeps. From CARRY_HEIGHT that is 27 frames in the
 *  air and about 40 px, two and a half tiles, before it lands and breaks. */
export const LIFTED_THROW_GRAVITY = 28;

/** px — how far toward the facing the object is moved on the frame it is
 *  thrown. derived from the cartridge (S157): itemBeginThrow's @throwOffsets
 *  ($ff/$00/$01), one pixel. */
export const LIFTED_THROW_NUDGE = 1;

/** px — half-size of the box a thrown pot or rock hits enemies with. derived
 *  from the cartridge (S157): bracelet.s @state1 sets collisionRadiusY/X $06 on
 *  the frame it is thrown — a 12x12 box. */
export const LIFTED_THROW_RADIUS = 6;

/** sp/f — a thrown bomb (S165) flies the lifted pot's arc above: a bomb has
 *  no weight class of its own, so itemBeginThrow reads itemWeights row 0 for
 *  it too. Landing, it bounces as Seasons' bombs do (commonBombAndBraceletCode.s
 *  itemBounce): its fall turned back up at half speed (PICKUP_BOUNCE_MIN is the
 *  same objectNegateAndHalveSpeedZ cut-off) and its run across the floor cut
 *  by bounceSpeedReductionMapping, which takes each 0.25 px/f of speed to
 *  0.125 px/f — this many subpixels per step. derived from the cartridge. */
export const BOMB_BOUNCE_STEP = 64;

/** px — height an object is held at while carried. derived from the
 *  cartridge (S155): oracles-disasm object_code/common/itemParents/
 *  commonCode.s, @liftedObjectPositions, weight 0 (a pot, a rock, a bush):
 *  z $f3 = -13 standing and walking, x 0, in every direction. It was a
 *  guessed 13 and the guess was right. */
export const CARRY_HEIGHT = 13;

/** f — the two steps of a lift before the object is overhead. derived:
 *  Link's LINK_ANIM_MODE_LIFT_4 (oracles-disasm data/seasons/
 *  specialObjectAnimationData.s, animationData19cb9 running on into 19cbc)
 *  is 3+4 frames at lift position 0, 4 at position 1, then 2 at the held
 *  position before the pickup finishes. Link cannot move for the lift. */
export const LIFT_STEP_FRAMES = [7, 4];

/** px — where a lifted object is on each step of the lift, [x, z] per facing
 *  (z is up-negative, as the cartridge writes it). derived: the same
 *  @liftedObjectPositions table, weight 0, frames 0 and 1. Facing down it
 *  starts at Link's feet and comes up past his face; facing sideways it
 *  comes off the ground in front of him. */
export const LIFT_STEP_POS = {
  up: [[0, -8], [0, -6]],
  right: [[7, 0], [3, -8]],
  down: [[0, 6], [0, 4]],
  left: [[-8, 0], [-4, -8]],
};

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

/** sp/f — how fast the anchor flies when thrown. guessed; 2.5 px/f, the
 *  speed the game once threw everything at (THROW_SPEED, gone at S165). */
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

/** f — how long Farore holds each of her two frames as she sways at her
 *  desk. derived: Oracle of Seasons' INTERAC_FARORE default animation 2,
 *  interactionAnimation51d97 (data/seasons/interactionAnimations.s in
 *  oracles-disasm), holds each oam frame $10 frames. */
export const FARORE_SWAY_HOLD = 16;

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

/** sp/f — the upward pop a drop makes when it appears: its height rises at
 *  1.375 px/f. derived from the cartridge: oracles-disasm object_code/common/
 *  parts/itemDrop.s @normalItem, speedZ = -$160. It was a guessed -1.25 px/f
 *  that moved the drop up the screen instead of into the air. */
export const PICKUP_POP_SPEED = -352;

/** sp/f^2 — gravity on that pop. derived from the cartridge: itemDrop.s
 *  @state1, objectUpdateSpeedZAndBounce with c = $20. Was a guessed 40. */
export const PICKUP_GRAVITY = 32;

/** sp/f — a drop that lands falling faster than this bounces, at half its
 *  speed, back up; slower and it stays down. derived from the cartridge:
 *  code/bank0.s objectNegateAndHalveSpeedZ ("Once it reaches a speed of less
 *  than 1 pixel per frame downwards, it stops"). A drop bounces once. */
export const PICKUP_BOUNCE_MIN = 256;

/** f — frames per wing frame. The healing fairy's two EXTRACTED frames
 *  (tools/rip-fairies.py) alternate every this many. guessed: nothing was
 *  frame-stepped for it. Six is two beats a second at 60fps, which is a flutter
 *  rather than a flap; the sheet gives wings-up and wings-out and nothing in
 *  between, so slower reads as a stutter and faster as a blur. */
export const FAIRY_FLAP_FRAMES = 6;

/** sp/f[] — the four speeds a fairy flies a leg at: 0.25, 0.5, 0.75 and 1
 *  px/f. derived from the cartridge: oracles-disasm object_code/common/parts/
 *  itemDrop.s, itemDrop_chooseRandomFairyMovement @speedTable (SPEED_40,
 *  SPEED_80, SPEED_c0, SPEED_100). A fairy flies straight legs, each in one
 *  of sixteen directions at one of these, picked at random. It used to drift
 *  on a guessed sine (0.06 rad/f, 0.69 and 0.63 px/f). */
export const FAIRY_LEG_SPEEDS = [64, 128, 192, 256];

/** f — how long a fairy's leg lasts: 8 more than an even number below 64.
 *  derived from the cartridge: the same routine, counter2 = (random & $3e) + 8,
 *  so 8 to 70 frames. */
export const FAIRY_LEG_MIN = 8;
export const FAIRY_LEG_SPAN = 32;

// ---------------------------------------------------------------------------
// Effects
// ---------------------------------------------------------------------------

/** f[] — how long each frame of the puff something vanishes or appears in is
 *  held, in the order sprites-effects.js lists `fx_puff*`. derived from the
 *  cartridge: oracles-disasm data/seasons/interactionAnimations.s,
 *  interactionAnimation51bae (INTERAC_PUFF's animation 0): 6 8 4, then the
 *  $ff frame that ends it. 18 frames; ours was a hand-drawn four-frame puff
 *  at a guessed 4 frames each. */
export const PUFF_HOLDS = [6, 8, 4];

/** f — a bomb's fuse: still for 80 frames, then flashing on a 4-frame beat for
 *  36 more, and it goes off on the 117th. derived from the cartridge:
 *  oracles-disasm data/itemAnimations.s, itemAnimation1e777 (ITEM_BOMB's
 *  animation 0): $50, then nine 4-frame alternations, then the $7f frame
 *  whose animParameter tells bombUpdateAnimation to explode. It was a guessed
 *  100 with a flash that sped up. */
export const BOMB_FUSE_FRAMES = 80 + 9 * 4;

/** f — how long the fuse sits before it starts to flash, and the beat it
 *  flashes on. derived: the same itemAnimation1e777 ($50, then $04s). */
export const BOMB_STILL_FRAMES = 80;
export const BOMB_FLASH_BEAT = 4;

/** f[] — how long each frame of the blast is held, in the order
 *  sprites-effects.js lists `fx_boom*` frames. derived from the cartridge:
 *  oracles-disasm data/itemAnimations.s, itemAnimation1e798 (ITEM_BOMB's
 *  animation 1): 4 4 3 7 8 8. */
export const EXPLOSION_HOLDS = [4, 4, 3, 7, 8, 8];

/** f — how long the explosion entity lives: the blast's frames end to end, 34.
 *  derived: the sum of EXPLOSION_HOLDS (itemUpdateExplosion deletes the bomb
 *  on the $80 frame that follows them). Was a guessed 24. */
export const EXPLOSION_FRAMES = EXPLOSION_HOLDS.reduce((a, b) => a + b, 0);

/** px[] — the blast's reach, frame by frame of EXPLOSION_HOLDS: its collision
 *  radius on each (0 = it no longer hits). derived from the cartridge: the
 *  third byte of each itemAnimation1e798 frame is animParameter, whose low five
 *  bits itemUpdateExplosion copies to collisionRadiusY/X ($06 $06 $06 $0a $0f)
 *  and whose bit 6 ($40) zeroes collisionType for the last frame. The blast is
 *  live for 26 frames and grows; it was one hit on its first frame with a
 *  fixed 14 px reach. */
export const EXPLOSION_RADII = [6, 6, 6, 10, 15, 0];

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
 *  SWIM_SPEED (192 sp/f = 0.75 px/f since S164), so a swimmer pressing into it nets
 *  backwards and can never make headway, while a walker on the floor is not
 *  touched by a current at all. An ordinary riptide is 0.55 px/f — less than a
 *  swimmer's own speed — so it is a tax on the surface route and not a barrier,
 *  which is why D3 needed a second, stronger current rather than reusing it.
 *  Retune SWIM_SPEED and tools/check-cleats.mjs re-proves every torrent room
 *  against the new ratio instead of quietly passing. S147 did exactly that:
 *  walking went to 1.5 px/f, swimming followed it to 1.125, and this rose
 *  from 0.9 by the same factor of 1.5 to stay 1.2x the swimmer; S164 put
 *  walking back to Seasons' 1 px/f and all three back with it. */
export const TORRENT_PUSH = 0.9;

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
/** f — how long a lit torch holds each of its four flame frames. derived:
 *  oracles-disasm data/seasons/animationData.s, animationData_04_5d5e (the
 *  dungeon animation group $18's first entry, which copies the flame tiles
 *  over the lit torch, TILEINDEX_LIT_TORCH $09), `.db $0f` per frame. */
export const TORCH_FLAME_FRAMES = 15;
/** f — the same for an ordinary riptide. derived; see TORRENT_ANIM_RATE. */
export const RIPTIDE_ANIM_RATE = 4;
/** f — how long the Sunken Palace's whirlpool holds each of its four frames.
 *  derived: oracles-disasm data/ages/animationData.s, animationDataWhirlpool2
 *  (the Ages sea's whirlpool, TILEINDEX_WHIRLPOOL $e9), `.db $06` per frame. */
export const WHIRLPOOL_ANIM_RATE = 6;

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
/** f — the Coilbone's moment of safety: how long nothing can hurt you after
 *  every turn of the tide, while the charm is live. guessed; one second, long
 *  enough to sound the conch in the middle of a fight and not be punished for
 *  standing still to do it, short enough that it is not a shield. */
export const COILBONE_INVULN_FRAMES = 60;

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

/** dimensionless — how much harder a thrown pot or rock hits with the
 *  Pot-Hauler. guessed. (S164: its old job, cancelling the carry slowdown,
 *  went when carrying stopped slowing Link, as on the cartridge.) */
export const POT_HAULER_FACTOR = 2;

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

// (VIBRATO_DELAY_FRAMES and VIBRATO_STEP_FRAMES timed the tracker's own
// vibrato until S164; our music now plays through the cartridge's engine,
// whose vibrato is GB_OURS_VIBRATO_DELAY_FRAMES below and its own frame grid.)

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

/** px/f — the sand crab scuttling left or right. derived: sandCrab.s @state8,
 *  SPEED_100 when the angle is sideways. */
export const CRAB_SPEED_SIDE = 1;

/** px/f — the sand crab walking up or down. derived: sandCrab.s @state8,
 *  SPEED_40. */
export const CRAB_SPEED_UPDOWN = 0.25;

/** [f] — how long the sand crab keeps one direction. derived: sandCrab.s
 *  @state8, counter1 = $30 + (random & $30). */
export const CRAB_WALK_FRAMES = [48, 64, 80, 96];

/** mask — a zol or gel rolls a byte and ANDs it with this at the end of each
 *  hold; zero means hop, so one time in eight. derived: zol.s
 *  zol_subid01_state8 and gel.s gel_state8 (and $07). */
export const HOP_ODDS_MASK = 7;

/** px/f — a zol or gel hopping at Link. derived: zol.s zol_subid01_stateA
 *  (SPEED_100) and gel.s gel_beginHop (SPEED_100). */
export const SLIME_HOP_SPEED = 1;

/** px/f — how fast a zol or gel leaves the ground. derived: zol.s and gel.s,
 *  speedZ -$200 (two pixels a frame, upward). */
export const SLIME_HOP_LAUNCH = 2;

/** px/f/f — taken off that each frame in the air. derived: zol.s and gel.s,
 *  objectUpdateSpeedZ_paramC with c = $28 ($28/256 of a pixel). */
export const SLIME_HOP_GRAVITY = 0x28 / 256;

/** f — a zol holds still this long between moves. derived: zol.s
 *  zol_state_uninitialized and zol_subid01_state9/B, counter1 $18. */
export const ZOL_HOLD_FRAMES = 24;

/** px/f — a zol sliding at Link. derived: zol.s zol_subid01_state8, SPEED_80. */
export const ZOL_SLIDE_SPEED = 0.5;

/** f — and for this long. derived: zol.s zol_subid01_state8, counter1 $10. */
export const ZOL_SLIDE_FRAMES = 16;

/** f — a zol shivers this long before it hops. derived: zol.s
 *  zol_subid01_state8 @hopTowardLink, counter1 $20. */
export const ZOL_SHAKE_FRAMES = 32;

/** px — each of a split zol's two gels lands this far to one side. derived:
 *  zol.s zol_subid01_stateD, zol_spawnGel with c = +-4. */
export const ZOL_SPLIT_OFFSET = 4;

/** f — a gel stands this long between moves. derived: gel.s
 *  gel_state_uninitialized and gel_state9/B, counter1 $10. */
export const GEL_HOLD_FRAMES = 16;

/** px/f — a gel inching at Link. derived: gel.s gel_state8, SPEED_40. */
export const GEL_INCH_SPEED = 0.25;

/** f — and for this long. derived: gel.s gel_state8, counter1 $08. */
export const GEL_INCH_FRAMES = 8;

/** f — a gel shivers this long before it hops. derived: gel.s gel_state8,
 *  counter1 $30. */
export const GEL_SHAKE_FRAMES = 48;
/** f — how long a gel that touches Link clings to him. derived: gel.s
 *  gel_stateC, counter2 120. */
export const GEL_CLING_FRAMES = 120;
/** f — what each button press shakes off a clinging gel's time. derived:
 *  gel.s gel_stateD, `sub $03` on wGameKeysJustPressed. */
export const GEL_CLING_SHAKE_FRAMES = 3;
/** px/f — a gel shaken off hops away at SPEED_100 with speedZ -$200.
 *  derived: gel.s gel_beginHop (1 px/f; 2 px/f upward). */
export const GEL_HOPOFF_SPEED = 1;
export const GEL_HOPOFF_LAUNCH = 2;

/** px/f — a keese in flight. derived: keese.s keese_subid00_state8, SPEED_c0. */
export const KEESE_SPEED = 0.75;

/** f — a keese's first rest. derived: keese.s keese_initializeSubid, counter1 $20. */
export const KEESE_FIRST_REST = 32;

/** [count, count] — a flight lasts BASE + random(SPAN) counts, each count two
 *  frames (the counter ticks on alternate frames). derived: keese.s
 *  keese_subid00_state8, counter1 = $c0 + (random & $3f). */
export const KEESE_FLIGHT_BASE = 0xc0;
export const KEESE_FLIGHT_SPAN = 0x40;

/** 1-in-n — on each counted frame of a flight, the chance a keese veers onto a
 *  new random angle. derived: keese.s keese_subid00_state9 (random & $0f). */
export const KEESE_VEER_ODDS = 16;

/** f — gliding to a halt, a keese still moves for this long. derived: keese.s
 *  keese_subid00_stateA, moves while counter1 < $68. */
export const KEESE_GLIDE_FRAMES = 0x68;

/** [px/f] — its speed through the glide, one entry per 16 frames. derived:
 *  keese.s keese_updateDeceleration @speeds (SPEED_c0 80 40 40 20 20 20 20). */
export const KEESE_SLOW_SPEEDS = [0.75, 0.5, 0.25, 0.25, 0.125, 0.125, 0.125, 0.125];

/** [mask] — and its wings, which beat only on frames where (frame & mask) is
 *  zero. derived: keese.s keese_updateDeceleration @bits. */
export const KEESE_SLOW_BEAT = [0, 0, 1, 1, 3, 3, 7, 0];

/** f — the glide ends, and the rest begins, here. derived: keese.s
 *  keese_subid00_stateA, full stop at counter1 $7f. */
export const KEESE_STOP_FRAMES = 0x7f;

/** [f, f] — a rest lasts BASE + random(SPAN). derived: keese.s
 *  keese_subid00_stateA, counter1 = $20 + (random & $7f). */
export const KEESE_REST_BASE = 0x20;
export const KEESE_REST_SPAN = 0x80;

/** px/f — a leever charging. derived: leever.s @state9, SPEED_80. */
export const LEEVER_SPEED = 0.5;

/** [f] — how long a leever waits underground, one picked at random. derived:
 *  leever.s @setRandomCounter1 @counter1Vals ($10 $30 $50 $70). */
export const LEEVER_UNDER_FRAMES = [16, 48, 80, 112];

/** [tiles] — how far ahead of Link a leever surfaces, picked by the frame
 *  counter. derived: leever.s @chooseSpawnPosition @@linkRelativeOffsets
 *  (3, 4, 5, 5 rows or columns along his facing). */
export const LEEVER_SURFACE_TILES = [3, 4, 5, 5];

/** f — rising out of the sand, and sinking back into it. derived: Seasons'
 *  data/seasons/enemyAnimations.s, enemy $0b's animations 0 (18+1+8 frames
 *  to its parameter 1) and 2 (8+1+15). */
export const LEEVER_RISE_FRAMES = 27;
export const LEEVER_SINK_FRAMES = 24;

/** f — a leever charges for BASE + (random & MASK) frames. derived: leever.s
 *  @setRandomHighCounter1 ($70 + (random & $38)). */
export const LEEVER_CHASE_BASE = 0x70;
export const LEEVER_CHASE_MASK = 0x38;

/** px/f — a bubble. derived: bubble.s @state_uninitialized, SPEED_c0. */
export const BUBBLE_SPEED = 0.75;

/** 1-in-n — a bubble's chance to turn each frame it is square on the grid or
 *  stopped. derived: bubble.s @chooseNewDirection (random & 7 == 0). */
export const BUBBLE_TURN_ODDS = 8;
/** f — a bubble's touch takes Link's sword away for this long. derived:
 *  bubble.s enemyCode15, `ld a,180` into wSwordDisabledCounter. */
export const BUBBLE_SWORD_LOCK_FRAMES = 180;

/** f — the beamos's eye moves one step of 32 this often: a full turn in 160.
 *  derived: beamos.s @updateAngle, counter1 $05. */
export const BEAMOS_TURN_FRAMES = 5;

/** f — once it sees Link it holds this long, firing over the last
 *  BEAMOS_BEAM_PIECES of them. derived: beamos.s @checkFireBeam (counter1 20)
 *  and @state9 (a piece every frame below 11). */
export const BEAMOS_FIRE_FRAMES = 20;
export const BEAMOS_BEAM_PIECES = 10;

/** px/f — each piece of the beam. derived: parts/beam.s @state0, speed $50
 *  (SPEED_200) scaled by 4 through objectSetComponentSpeedByScaledVelocity. */
export const BEAMOS_BEAM_SPEED = 8;

/** f — after firing, the beamos cannot fire again for this long. derived:
 *  beamos.s @state9, counter2 40. */
export const BEAMOS_COOLDOWN = 40;

/** px/f — a spiked beetle wandering, and where its charge starts. derived:
 *  spikedBeetle.s @state_uninitialized and @chargeLink, SPEED_40. */
export const BEETLE_WALK_SPEED = 0.25;

/** [f] — how long it keeps one direction wandering. derived: spikedBeetle.s
 *  @setRandomAngleAndCounter1, $30 + (random & $30). */
export const BEETLE_WALK_FRAMES = [48, 64, 80, 96];

/** px — it charges when Link is within this of its row or column. derived:
 *  spikedBeetle.s @state8, objectCheckCenteredWithLink with b = $08. */
export const BEETLE_SEE_PX = 8;

/** count, px/f, px/f — its charge counts down from COUNT and, every fourth
 *  count, gains GAIN until it reaches MAX. derived: spikedBeetle.s @chargeLink
 *  (counter2 150) and @incSpeed (SPEED_20 a step up to SPEED_180). */
export const BEETLE_CHARGE_COUNT = 150;
export const BEETLE_CHARGE_GAIN = 0.125;
export const BEETLE_CHARGE_MAX = 1.5;

/** f — stopped by a wall, it stands this long. derived: spikedBeetle.s
 *  @state9, counter1 30. */
export const BEETLE_STAND_FRAMES = 30;
/** f — a spiked beetle turned over by Link's shield lies on its back this
 *  long. derived: spikedBeetle.s enemyCode14, counter1 180. */
export const BEETLE_FLIP_FRAMES = 180;
/** f — for the last of those it shakes before it rights itself. derived:
 *  spikedBeetle.s @stateB, `cp 60`. */
export const BEETLE_FLIP_SHAKE_FRAMES = 60;
/** px/f — the flip throws it up at speedZ -$180. derived: spikedBeetle.s
 *  (1.5 px/f). */
export const BEETLE_FLIP_LAUNCH = 1.5;
/** px/f/f — the flipped beetle's fall, objectUpdateSpeedZAndBounce with
 *  c = $18. derived: spikedBeetle.s @knockback. */
export const BEETLE_FLIP_GRAVITY = 0x18 / 256;
/** px/f — it skids away from the shield while it is in the air, SPEED_e0.
 *  derived: spikedBeetle.s @knockback. */
export const BEETLE_FLIP_SKID = 0xe0 / 256;
/** px/f — righting itself it hops off at SPEED_c0. derived: spikedBeetle.s
 *  @stateB. */
export const BEETLE_RIGHT_SPEED = 0xc0 / 256;

/** px/f — a tektite's leap along the ground. derived: tektite.s
 *  @state_uninitialized, SPEED_140. */
export const TEKTITE_SPEED = 1.25;

/** f — a tektite stands (random & MASK) + MIN between leaps (its first stand
 *  is (random & MASK) + 1). derived: tektite.s @gotoState8, var31 90 for
 *  subid 0. */
export const TEKTITE_STAND_MASK = 0x7f;
export const TEKTITE_STAND_MIN = 90;

/** f — it crouches this long before it leaps. derived: tektite.s @state8,
 *  counter2 $18. */
export const TEKTITE_CROUCH_FRAMES = 24;

/** [px/f, px/f/f] — a leap's launch and the gravity that brings it down: the
 *  small one, and the big one it takes one time in eight. derived: tektite.s
 *  @smallLeap ($feaa, $0e) and @bigLeap ($fe80, $0c). */
export const TEKTITE_SMALL_LEAP = [0x156 / 256, 0x0e / 256];
export const TEKTITE_BIG_LEAP = [0x180 / 256, 0x0c / 256];

/** px/f — a whisp, always on a diagonal. derived: whisp.s
 *  whisp_state_uninitialized, SPEED_c0, angle (random & $18) + 4. */
export const WHISP_SPEED = 0.75;

/** px/f — a moblin walking. derived: arrowDarknut.s
 *  arrowDarknut_state_uninitialized (shared by the moblin), SPEED_80. */
export const MOBLIN_SPEED = 0.5;

/** f — it walks BASE + (random & MASK) frames at a stretch. derived:
 *  arrowDarknut.s arrowDarknut_setState8WithRandomAngleAndCounter
 *  ($30 + (random & $3f)). */
export const MOBLIN_WALK_BASE = 0x30;
export const MOBLIN_WALK_MASK = 0x3f;

/** f — and pauses this long between. derived: moblinsAndShroudedStalfos.s
 *  moblin_state_8, counter1 $08. */
export const MOBLIN_PAUSE_FRAMES = 8;

/** px/f — its spear. derived: parts/enemyArrow.s @subid0 @@state0, speed $50
 *  (SPEED_200). */
export const MOBLIN_SPEAR_SPEED = 2;

/** px/f — a stalfos ambling. derived: stalfos.s stalfos_moveInRandomAngle,
 *  SPEED_80. */
export const STALFOS_SPEED = 0.5;

/** f — each amble lasts BASE + (random & MASK). derived: stalfos.s
 *  stalfos_moveInRandomAngle, $20 + (random & $30). */
export const STALFOS_WALK_BASE = 0x20;
export const STALFOS_WALK_MASK = 0x30;

/** 1-in-n — an amble heads straight at Link. derived: stalfos.s
 *  stalfos_moveInRandomAngle ((random & $0f) == 1). */
export const STALFOS_TOWARD_ODDS = 16;

/** px — Link swinging nearer than this (across plus down) makes it leap.
 *  derived: stalfos.s stalfos_checkJumpAwayFromLink, c = $2c, through
 *  objectCheckLinkWithinDistance. */
export const STALFOS_SHY_PX = 0x2c;

/** px/f, px/f/f, px/f — its leap away: launch, gravity, and speed along the
 *  ground. derived: stalfos.s stalfos_state0a (speedZ -$200, SPEED_140) and
 *  stalfos_state0b (c = $20). */
export const STALFOS_LEAP_LAUNCH = 2;
export const STALFOS_LEAP_GRAVITY = 0x20 / 256;
export const STALFOS_LEAP_SPEED = 1.25;

/** px/f — a darknut plodding. derived: swordEnemies.s
 *  swordEnemy_state_uninitialized (shared by the sword darknut), SPEED_80. */
export const DARKNUT_SPEED = 0.5;

/** f — each plod lasts BASE + (random & MASK), one in eight toward Link.
 *  derived: swordEnemies.s swordEnemy_chooseRandomAngleAndCounter1
 *  ($50 + (random & $3f); c == 0 of random & 7). */
export const DARKNUT_WALK_BASE = 0x50;
export const DARKNUT_WALK_MASK = 0x3f;

/** px — Link this close on both axes starts a chase. derived: swordEnemies.s
 *  swordDarknut_checkLinkIsClose (difference + $28 < $51). */
export const DARKNUT_SEE_PX = 0x28;

/** f — and it cannot start another until this long after the last ends.
 *  derived: swordEnemies.s swordEnemy_setChaseCooldown, $14 for subid 0. */
export const DARKNUT_CHASE_COOLDOWN = 0x14;

/** f — it stands squared up this long before it goes. derived: swordEnemies.s
 *  swordEnemy_beginChasingLink, counter1 $10. */
export const DARKNUT_SQUARE_FRAMES = 0x10;

/** f, px/f — then hounds Link for this long at this speed. derived:
 *  swordEnemies.s swordDarknut_state9 (counter1 $60, SPEED_c0). */
export const DARKNUT_CHASE_FRAMES = 0x60;
export const DARKNUT_CHASE_SPEED = 0.75;

/** f — a wizzrobe flickers in over this long. derived: wizzrobe.s
 *  wizzrobe_subid1_state8, counter1 60. */
export const WIZZROBE_PHASE_IN_FRAMES = 60;

/** f — stands this long, and fires when this many are left. derived:
 *  wizzrobe.s wizzrobe_subid1_state9 (counter1 72) and _stateA (fires at 52). */
export const WIZZROBE_STAND_FRAMES = 72;
export const WIZZROBE_FIRE_AT = 52;

/** f — then phases out over OUT frames, the last GONE of them unseen. derived:
 *  wizzrobe.s wizzrobe_subid1_stateA (counter1 180) and _stateB (invisible
 *  below 120). */
export const WIZZROBE_OUT_FRAMES = 180;
export const WIZZROBE_GONE_FRAMES = 120;

/** px/f — its shot. derived: parts/wizzrobeProjectile.s, speed $50 (SPEED_200). */
export const WIZZROBE_SHOT_SPEED = 2;

/** px — a pincer comes out when Link is nearer than this (across plus down).
 *  derived: pincer.s pincer_head_state9, c = $28. */
export const PINCER_SEE_PX = 0x28;

/** f — it shows its eyes this long first. derived: Seasons'
 *  data/seasons/enemyAnimations.s, enemy $45 animation 0 ($24 frames to its
 *  parameter 1). */
export const PINCER_WARN_FRAMES = 0x24;

/** px/f, px — it lunges out this fast, this far. derived: pincer.s
 *  pincer_head_stateB (var33 += 2 until $20). */
export const PINCER_OUT_SPEED = 2;
export const PINCER_REACH = 0x20;

/** f — holds out this long. derived: pincer.s @fullyExtended, counter1 $08. */
export const PINCER_HOLD_FRAMES = 8;

/** px/f — draws back this fast. derived: pincer.s pincer_head_stateD (var33
 *  down by one a frame). */
export const PINCER_BACK_SPEED = 1;

/** f — hides this long before it can come again. derived: pincer.s
 *  pincer_head_stateD, counter1 30. */
export const PINCER_REST_FRAMES = 30;

/** px — an enemy this far or more above the ground (over its drawn hover)
 *  neither touches Link nor can be struck: its box stays on the ground under
 *  it. derived: code/collisionEffects.s, the z test before checkHitLink and
 *  before each item ("Check if Z positions are within 7 pixels"). */
export const ENEMY_CONTACT_Z = 7;

// ---------------------------------------------------------------------------
// THE GAME BOY'S SOUND, for Seasons' own tracks (src/core/gbsound.js, S151).
// ---------------------------------------------------------------------------

/** frames/s — the rate the cartridge's sound engine steps at: once a frame,
 *  4194304 / 70224. derived: the Game Boy's clock and frame length (Pan Docs);
 *  every note length in the channel scripts counts these. */
export const GB_FRAME_RATE = 4194304 / 70224;

/** x — how loud one channel at full volume is in our mix, against the rest of
 *  the game's sound. guessed: set against the tracker's own channel levels
 *  (a pulse lead at 0.16), so a Seasons track and one of ours sit at about
 *  the same loudness; a person should confirm it by ear. */
export const GB_MIX_LEVEL = 0.12;

/** x — the output capacitor's charge factor per 4.19 MHz clock, which is what
 *  takes the DC out of the console's sound: a first-order high-pass near
 *  30 Hz. derived: Pan Docs, "Audio details" (0.999958 per clock, so 0.996 a
 *  sample at 44.1 kHz). */
export const GB_HPF_CHARGE = 0.999958;

/** Hz — the rate Seasons' tracks are rendered at before Web Audio resamples
 *  them to the device. guessed: well above the highest note's fundamental,
 *  and small enough to render the overworld in a blink on a phone. */
export const GB_RENDER_RATE = 32768;

/** f — how long a held note of OUR music rings before its vibrato starts,
 *  once our tracks play through the cartridge's engine (S164). derived:
 *  `vibrato $e1`, the vibrato the Oracle leads hold most often (Crescent
 *  Island, the Maku Tree, Lynna Village, the house theme), counts down
 *  2 x $e = 28 frames before the wobble (code/audio.s, vibratoCount). */
export const GB_OURS_VIBRATO_DELAY_FRAMES = 28;

/** ms — how long a frame may spend rendering the track that has just been
 *  asked for, before its music starts (S164: a whole track is ~200 ms of
 *  work, which in one go was a visible hitch on entering a new place).
 *  guessed: leaves most of a 16.7 ms frame to the game; the music of a place
 *  not yet rendered starts about half a second after you arrive. */
export const GB_RENDER_BUDGET_MS = 6;

/** ms — how long a frame may spend rendering tracks ahead of need, while no
 *  track is waiting. guessed: small enough not to show in the frame rate;
 *  every track is ready within the first minute of play. */
export const GB_PRERENDER_BUDGET_MS = 2;

/** ms — the least time between two render slices: at most one per drawn
 *  frame, because a game catching up runs several updates in one and a slice
 *  in each made it fall further behind (S164, test.mjs's frame rate went from
 *  healthy to 23). guessed: under a 60 Hz frame, over half of one. */
export const GB_RENDER_SLICE_GAP_MS = 12;

// --- side content (S155) ------------------------------------------------------

/** frames — the tide-pool race's clock, from the kid on South Bluff to Pip on
 *  the South Sands islet. derived: the actor, starting beside the kid at LOW,
 *  ran it in 275 frames at 1.5 px/f, so about 410 at Seasons' 1 px/f (S164);
 *  this is about half as long again, rounded to 600 (it was 400),
 *  so a player who knows the way has two seconds to spare and one who stops
 *  to think does not. The clock runs through a conch sweep and stops for a
 *  screen scroll and a text box. */
export const RACE_SHORE_FRAMES = 600;
