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
//   px/f    pixels per frame at 60 Hz
//   f       frames at 60 Hz
//   px      pixels
//   x       dimensionless multiplier
//   p       probability per frame, 0..1
//   rad/f   radians per frame
//   qh      quarter-hearts (see progress.js: HEART_UNITS = 4)

// ---------------------------------------------------------------------------
// Player movement
// ---------------------------------------------------------------------------

/** px/f — Link's ground speed. guessed.
 *  Not representable as a clean 8.8 subpixel step, which is why ROOM_EXIT_MARGIN
 *  has to be as wide as it is. P3 re-derives this; see docs/FEEL-SPEC.md. */
export const WALK_SPEED = 1.35;

/** px/f — surface swimming. guessed. */
export const SWIM_SPEED = 0.95;

/** px/f — swimming underwater with the Mermaid Suit. guessed. */
export const DIVE_SPEED = 1.1;

/** px/f — under the Pegasus Seed. guessed. */
export const BOOST_SPEED = 2.5;

/** px/f — walking with the shield raised. guessed. */
export const SHIELD_SPEED = 1.0;

/** x — multiplier on F.SLOW terrain (sand, deep grass). guessed. */
export const SLOW_FACTOR = 0.6;

/** x — multiplier while wading in shallow water. guessed. */
export const SHALLOW_FACTOR = 0.86;

/** x — multiplier while carrying something. guessed. */
export const CARRY_FACTOR = 0.9;

/** px/f — drift in the facing direction during a spin attack. guessed. */
export const SPIN_DRIFT_SPEED = 0.35;

/** px/f — sideways push from a current tile while swimming is the tile's own
 *  `push` vector; this scales the aquatic-enemy drift per tide level. guessed. */
export const TIDE_DRIFT_PER_LEVEL = 0.12;

/** x — per-axis multiplier applied when both axes are pressed. guessed, AND
 *  KNOWN WRONG. The design rule is that diagonal movement is NOT normalised:
 *  the GB Zeldas apply full speed on both axes, so diagonal is sqrt(2) times
 *  cardinal, and that asymmetry is a signature of how they feel. The engine
 *  currently divides by sqrt(2) instead. The value is parked here rather than
 *  left inline so the divergence is visible in one place; setting it to 1 is
 *  what P3 does, together with re-deriving WALK_SPEED. Do not "fix" it here
 *  on its own — the two changes have to land together or the walk speed comes
 *  out wrong. See docs/FEEL-SPEC.md, "Diagonals". */
export const DIAGONAL_FACTOR = Math.SQRT1_2;

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

/** px/f — Link's knockback speed on the first frame after a hit. guessed. */
export const PLAYER_KNOCK_SPEED = 3.2;

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

/** px/f^2 — downward acceleration during a jump. guessed. */
export const JUMP_GRAVITY = 0.19;

/** px/f^2 — downward acceleration while gliding (Roc's Cape held). guessed. */
export const GLIDE_GRAVITY = 0.08;

/** px/f — rate `z` bleeds back to the ground when not jumping. guessed. */
export const LAND_SETTLE_RATE = 0.5;

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
 *  fire. derived from WALK_SPEED: the margin must exceed one movement step or
 *  the player steps over the boundary without ever landing on it. WALK_SPEED
 *  is itself guessed, so this is a guess wearing arithmetic. P3 drops it to 1
 *  once WALK_SPEED divides the tile evenly. */
export const ROOM_EXIT_MARGIN = 3;

/** f — length of the tide's wave-front wipe across the screen. guessed.
 *  Was 44 while game.js stepped the sweep twice per frame, so the wipe really
 *  crossed in 23 and the constant described nothing. 23 is what the game has
 *  always looked like: the number moved to match the screen, not the other way
 *  round, so the wipe and the replays are unchanged. */
export const TIDE_SWEEP_FRAMES = 23;

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

/** px/f — speed of an object thrown by the player. guessed. */
export const THROW_SPEED = 2.6;

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

/** px/f — initial upward velocity of a hop. guessed. */
export const ENEMY_HOP_POWER = 2.2;

/** px/f^2 — downward acceleration during an enemy hop. guessed. */
export const ENEMY_HOP_GRAVITY = 0.16;

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

/** px/f — how fast a wandering NPC ambles. guessed. */
export const NPC_WANDER_SPEED = 0.3;

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

/** px/f — the little upward pop a drop makes when it appears. guessed. */
export const PICKUP_POP_SPEED = -1.2;

/** px/f^2 — gravity on that pop. guessed. */
export const PICKUP_GRAVITY = 0.16;

/** f — how long the pop lasts before the drop settles. guessed. */
export const PICKUP_SETTLE_FRAMES = 12;

/** f — delay before a drop can be collected, so it is not grabbed mid-pop. guessed. */
export const PICKUP_GRAB_DELAY = 8;

/** rad/f — how fast a fairy's drift angle turns. guessed. */
export const FAIRY_DRIFT_TURN = 0.06;

/** px/f — amplitude of a fairy's drift on x. guessed. */
export const FAIRY_DRIFT_X = 0.7;

/** px/f — amplitude of a fairy's drift on y. guessed. */
export const FAIRY_DRIFT_Y = 0.6;

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
