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
//   * NOTHING IN THIS FILE IS `measured`. Every value below was carried over
//     from the code as it stood before this file existed, which means every
//     one of them is a guess that happened to feel acceptable to whoever
//     wrote it. They are labelled honestly. Do not upgrade a `guessed` to a
//     `measured` because the game feels fine — that word means a reference
//     was frame-stepped, and until someone does that, the engine has no
//     ground truth and we should keep saying so.
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

/** sp/f — Link's ground speed. derived from the 8.8 grid and the 16px tile.
 *
 *  256 sp/f is exactly 1 px/f, so a tile takes exactly 16 frames to cross and
 *  the player lands on every tile boundary he passes. That is the property the
 *  old 1.35 px/f did not have, and ROOM_EXIT_MARGIN was three pixels wide to
 *  paper over it.
 *
 *  The choice is not free-form. A speed must be exactly representable in 8.8
 *  AND divide 16px evenly, which means 4096/s must be a whole number of frames
 *  with s a whole number of subpixels — so s has to divide 4096, i.e. be a
 *  power of two. Between 128 sp/f (a crawl) and 512 sp/f (the Pegasus dash),
 *  256 is the only candidate left. It is `derived`, not `measured`: nobody has
 *  frame-stepped a reference. It is worth noting anyway that 1 px/f walking and
 *  2 px/f dashing is the granularity the GB Zeldas are built on, so this is at
 *  least the right shape. */
export const WALK_SPEED = 256;

/** sp/f — surface swimming. derived: three quarters of WALK_SPEED, the same
 *  ratio the old guessed pair (0.95 / 1.35) had, snapped to the grid. */
export const SWIM_SPEED = 192;

/** sp/f — swimming underwater with the Mermaid Suit. derived: seven eighths of
 *  WALK_SPEED, keeping the old ratio to SWIM_SPEED. */
export const DIVE_SPEED = 224;

/** sp/f — under the Pegasus Seed. derived: exactly twice WALK_SPEED, so the
 *  dash covers a tile in 8 frames. */
export const BOOST_SPEED = 512;

/** sp/f — walking with the shield raised. derived: three quarters of
 *  WALK_SPEED. */
export const SHIELD_SPEED = 192;

/** sp/f — walking with the sword held out. derived: kept equal to
 *  SHIELD_SPEED, because both are "you are committed to something and cannot
 *  move at full pace". guessed insofar as its ancestor is. */
export const SWORD_HOLD_SPEED = 192;

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

/** f — total length of a sword swing; the player is rooted for all of it. guessed. */
export const SWING_FRAMES = 14;

/** f — first frame of the swing on which the blade can hit. guessed. */
export const SWING_HIT_START = 2;

/** f — last frame of the swing on which the blade can hit. guessed.
 *  The active window is therefore 8 frames out of 14. */
export const SWING_HIT_END = 9;

/** f — how long the sword button must be held before a spin is charged. guessed. */
export const CHARGE_FRAMES = 42;

/** f — interval between charge sparkles once charged. guessed. */
export const CHARGE_SPARKLE_EVERY = 6;

/** f — length of a spin attack. guessed. */
export const SPIN_FRAMES = 26;

/** px — how far in front of Link the blade reaches. guessed. */
export const SWORD_REACH = 13;

/** px — the blade's extent across the facing axis. guessed. */
export const SWORD_SPAN = 14;

/** px — gap between Link's centre and the near edge of the sword box. guessed. */
export const SWORD_GAP = 3;

/** px — side of the square hitbox swept by a spin attack. guessed. */
export const SPIN_BOX = 30;

/** f — frames after a swing ends before the still-held button becomes a hold
 *  rather than the tail of the swing. guessed; small enough that the blade
 *  never visibly drops between the two poses. */
export const SWORD_HOLD_DELAY = 2;

/** qh — damage the extended blade deals on contact. guessed; half a swing's,
 *  because walking into something with the sword out is meant to be worth less
 *  than choosing to swing at it. The enemy's own invulnerability window is what
 *  rate-limits it, so this is damage per enemy-invuln period, not per frame. */
export const SWORD_HOLD_DAMAGE = 1;

/** px/f — knockback dealt by the extended blade. guessed; weaker than
 *  KNOCK_SWORD so a held blade shoves rather than launches. */
export const KNOCK_HOLD = 2;

/** f — how long after a clink off a wall the blade may clink again. guessed;
 *  without it the sfx retriggers every frame you lean on the wall. */
export const SWORD_CLINK_COOLDOWN = 20;

// ---------------------------------------------------------------------------
// Damage, invulnerability and knockback
// ---------------------------------------------------------------------------

/** f — invulnerability after Link takes a hit. guessed. */
export const PLAYER_INVULN_FRAMES = 46;

/** f — how long Link flickers after a hit. guessed; kept equal to the invuln
 *  window so the flicker reads as "you cannot be hit right now". */
export const PLAYER_FLICKER_FRAMES = 46;

/** f — invulnerability after a pit fall or a wash-out, which is longer than an
 *  ordinary hit because the player has just been teleported. guessed. */
export const PLAYER_RECOVER_INVULN_FRAMES = 60;

/** f — how long Link is shoved and unable to act after a hit. guessed. */
export const PLAYER_HURT_FRAMES = 12;

/** sp/f — Link's knockback speed on the first frame after a hit. guessed;
 *  3 px/f, snapped to the grid from the old 3.2. */
export const PLAYER_KNOCK_SPEED = 768;

/** x — per-frame decay of Link's knockback. guessed.
 *  Exponential decay is wrong for a GB Zelda — the source games move you a
 *  fixed distance over a fixed frame count. P4 replaces this; see FEEL-SPEC. */
export const PLAYER_KNOCK_DECAY = 0.84;

/** f — invulnerability after an ordinary enemy takes a hit. guessed. */
export const ENEMY_INVULN_FRAMES = 24;

/** f — how long an ordinary enemy flickers after a hit. guessed. */
export const ENEMY_FLICKER_FRAMES = 24;

/** f — how long an ordinary enemy is shoved after a hit. guessed. */
export const ENEMY_KNOCK_FRAMES = 8;

/** x — per-frame decay of enemy knockback. guessed. Same objection as
 *  PLAYER_KNOCK_DECAY. */
export const ENEMY_KNOCK_DECAY = 0.82;

/** px/f — default knockback dealt when a hit does not name its own. guessed. */
export const KNOCK_DEFAULT = 3;

/** px/f — knockback dealt by a sword swing. guessed. */
export const KNOCK_SWORD = 4;

/** px/f — knockback dealt by a spin attack. guessed. */
export const KNOCK_SPIN = 5;

/** px/f — knockback dealt by a projectile. guessed. */
export const KNOCK_PROJECTILE = 3;

/** px/f — knockback dealt by an explosion. guessed. */
export const KNOCK_EXPLOSION = 2;

/** f — invulnerability after a boss takes a hit. guessed; shorter than an
 *  ordinary enemy's so a boss can be combo'd. */
export const BOSS_INVULN_FRAMES = 20;

/** f — invulnerability granted to a boss when it changes phase. guessed. */
export const BOSS_PHASE_INVULN_FRAMES = 20;

/** f — how long a boss is shoved after a hit. guessed. */
export const BOSS_KNOCK_FRAMES = 6;

/** x — bosses take this fraction of the knockback an enemy would. guessed. */
export const BOSS_KNOCK_SCALE = 0.4;

/** x — per-frame decay of boss knockback. guessed. */
export const BOSS_KNOCK_DECAY = 0.8;

/** qh — damage from standing on a hazard tile (lava, spikes). guessed. */
export const HAZARD_DAMAGE = 2;

/** qh — damage from falling into a pit. guessed. */
export const PIT_DAMAGE = 2;

/** qh — damage from being washed out by water you cannot swim in. guessed. */
export const WASH_DAMAGE = 2;

/** qh — damage from standing in your own explosion. guessed. */
export const EXPLOSION_SELF_DAMAGE = 2;

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
// Feather: 2*512/28 = 36.6 frames aloft, 36.6 px of ground covered (2.3 tiles),
// apex 18.3 px. The old pair covered 36.9 px and peaked at 17.8 px.

/** sp/f — upward velocity of a Roc's Feather hop. derived from WALK_SPEED and
 *  JUMP_GRAVITY to preserve a 2.3-tile reach; 2 px/f exactly. It used to sit
 *  inline in items.js as 2.6. */
export const JUMP_POWER = 512;

/** sp/f — upward velocity of a Roc's Cape hop. derived the same way; 2.5 px/f,
 *  giving 45.7 px of reach against the old pair's 46.9. It used to sit inline
 *  in items.js as 3.3. */
export const JUMP_POWER_CAPE = 640;

/** sp/f^2 — downward acceleration during a jump. derived: chosen with
 *  JUMP_POWER so that reach and apex both survive the new WALK_SPEED. */
export const JUMP_GRAVITY = 28;

/** sp/f^2 — downward acceleration while gliding (Roc's Cape held). derived:
 *  the same fraction of JUMP_GRAVITY the old guessed pair had (0.08/0.19). */
export const GLIDE_GRAVITY = 12;

/** sp/f — rate `z` bleeds back to the ground when not jumping. guessed. */
export const LAND_SETTLE_RATE = 128;

/** tiles — widest ledge run cleared in a single hop. guessed.
 *  A run is cleared in one hop so a two-tile drop reads as one movement. */
export const LEDGE_MAX_SPAN = 3;

/** f — duration of a one-way ledge hop, start to landing. guessed. */
export const LEDGE_HOP_FRAMES = 18;

/** px — peak height of the ledge-hop arc. guessed. */
export const LEDGE_HOP_HEIGHT = 7;

/** px — how far in front of Link the ledge lip is probed for. guessed. */
export const LEDGE_PROBE_REACH = 10;

/** px — how far in front of Link a push block is probed for. guessed. */
export const PUSH_PROBE_REACH = 10;

// ---------------------------------------------------------------------------
// Room transitions and screen effects
// ---------------------------------------------------------------------------

/** f — length of a scrolling room-to-room transition. guessed. */
export const ROOM_TRANSITION_FRAMES = 34;

/** px — how close to the room edge the player's hitbox must be for an exit to
 *  fire. derived from WALK_SPEED. At 256 sp/f the player advances exactly one
 *  pixel per frame and stops flush against the last legal column, so the exit
 *  test can be a one-pixel band at the edge. It used to be three, which was not
 *  a tuning choice but a workaround for a walk speed that could step over the
 *  boundary without ever landing on it. */
export const ROOM_EXIT_MARGIN = 1;

/** f — length of the tide's wave-front wipe across the screen. guessed. */
export const TIDE_SWEEP_FRAMES = 44;

/** x — fade opacity change per frame; a full fade is 1/FADE_RATE frames. guessed. */
export const FADE_RATE = 0.09;

/** f — how long an area-name banner stays up. guessed. */
export const BANNER_FRAMES = 120;

/** px — screen shake amplitude for a small impact (a hit landing). guessed. */
export const SHAKE_SMALL = 2;

/** px — screen shake amplitude for an explosion or a boss stomp. guessed. */
export const SHAKE_MEDIUM = 3;

/** px — screen shake amplitude for a boss dying. guessed. */
export const SHAKE_LARGE = 4;

/** f — shake duration for a small impact. guessed. */
export const SHAKE_SMALL_FRAMES = 8;

/** f — shake duration for an explosion. guessed. */
export const SHAKE_MEDIUM_FRAMES = 10;

/** f — shake duration for a boss dying. guessed. */
export const SHAKE_LARGE_FRAMES = 40;

// ---------------------------------------------------------------------------
// Player states other than walking
// ---------------------------------------------------------------------------

/** f — length of a pit fall before the player is replaced on solid ground. guessed. */
export const FALL_FRAMES = 34;

/** f — length of being washed back to shore by water. guessed. */
export const WASH_FRAMES = 30;

/** f — length of a dig. guessed. */
export const DIG_FRAMES = 18;

/** f — how long Link holds the conch, and is frozen for. guessed. */
export const CONCH_FRAMES = 46;

/** f — how long the player must lean on a block before it moves. guessed. */
export const PUSH_DELAY_FRAMES = 18;

/** f — how long a Mermaid Suit dive lasts before surfacing. guessed. */
export const DIVE_FRAMES = 180;

/** f — how long a Pegasus Seed's speed boost lasts. guessed. */
export const PEGASUS_FRAMES = 300;

/** f — how long Link holds a new item overhead. guessed. */
export const ITEM_PRESENT_FRAMES = 90;

/** f — how long Link is frozen when claiming an essence. guessed. */
export const ESSENCE_FREEZE_FRAMES = 150;

/** f — how long the game-over screen holds before it accepts a button. guessed. */
export const GAMEOVER_WAIT_FRAMES = 100;

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
// Enemy cadence
// ---------------------------------------------------------------------------

/** p — per-frame chance a wandering enemy changes direction. guessed.
 *  A per-frame probability is the wrong shape for a GB Zelda: the source games
 *  decide on a fixed cadence and only turn when grid-aligned, which is what
 *  makes a room of octoroks read as patterned rather than noisy. P4 replaces
 *  this with a cadence; see docs/FEEL-SPEC.md. */
export const ENEMY_TURN_CHANCE = 0.012;

/** px/f — fallback speed for an enemy whose spec does not name one. guessed. */
export const ENEMY_DEFAULT_SPEED = 0.5;

/** f — frames per animation step for an enemy whose spec does not name one. guessed. */
export const ENEMY_DEFAULT_RATE = 10;

/** x — multiplier on an enemy's speed while charging. guessed. */
export const ENEMY_CHARGE_SPEED_MULT = 3;

/** x — multiplier on an enemy's speed while hopping. guessed. */
export const ENEMY_HOP_SPEED_MULT = 2;

/** f — recovery stun after a charge hits a wall. guessed. */
export const ENEMY_CHARGE_RECOVER_FRAMES = 24;

/** px — how closely the player must line up for a charge to trigger. guessed. */
export const ENEMY_CHARGE_TOLERANCE = 10;

/** px — how near the player must be for a charge to trigger. guessed. */
export const ENEMY_CHARGE_RANGE = 90;

/** f — pause between hops. guessed. */
export const ENEMY_HOP_WAIT_FRAMES = 40;

/** sp/f — initial upward velocity of a hop. guessed; 2.25 px/f, snapped to the
 *  grid from 2.2. */
export const ENEMY_HOP_POWER = 576;

/** sp/f^2 — downward acceleration during an enemy hop. guessed. */
export const ENEMY_HOP_GRAVITY = 40;

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

/** f — how long a dropped pickup lingers before vanishing. guessed. */
export const PICKUP_LIFE_FRAMES = 460;

/** sp/f — the little upward pop a drop makes when it appears. guessed;
 *  -1.25 px/f, snapped to the grid from -1.2. */
export const PICKUP_POP_SPEED = -320;

/** sp/f^2 — gravity on that pop. guessed. */
export const PICKUP_GRAVITY = 40;

/** f — how long the pop lasts before the drop settles. guessed. */
export const PICKUP_SETTLE_FRAMES = 12;

/** f — delay before a drop can be collected, so it is not grabbed mid-pop. guessed. */
export const PICKUP_GRAB_DELAY = 8;

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
