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

/** px — knockback dealt by the extended blade. guessed; weaker than
 *  KNOCK_SWORD so a held blade shoves rather than launches. A distance, like
 *  every other KNOCK_* — see the note above them. */
export const KNOCK_HOLD = 9;

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

/** px — how far Link is shoved by a hit, in total. guessed.
 *  A GB Zelda's knockback is a scripted displacement, not a physics impulse:
 *  a fixed distance over a fixed frame count, at a constant speed, so it always
 *  ends the same distance from the thing that hit you and you can plan around
 *  it. This number and PLAYER_KNOCK_FRAMES are the whole of it. Chosen to match
 *  the total travel of the exponential decay it replaces (3.2 px/f decaying by
 *  0.84 over 12 frames covers ~17.6px), so the change is a change of shape
 *  rather than of reach. See docs/FEEL-SPEC.md. */
export const PLAYER_KNOCK_DIST = 18;

/** f — how long that shove takes. guessed; kept equal to PLAYER_HURT_FRAMES so
 *  Link regains control on the frame he stops sliding. */
export const PLAYER_KNOCK_FRAMES = 12;

/** f — invulnerability after an ordinary enemy takes a hit. guessed. */
export const ENEMY_INVULN_FRAMES = 24;

/** f — how long an ordinary enemy flickers after a hit. guessed. */
export const ENEMY_FLICKER_FRAMES = 24;

/** f — how long an ordinary enemy is shoved after a hit. guessed. Together with
 *  the KNOCK_* distances below this is the fixed frame count half of the
 *  fixed-distance-over-fixed-frames rule; nothing decays.
 *
 *  Worth knowing when tuning it: contact damage does not care that an enemy is
 *  mid-knockback, so these are frames the enemy is travelling away and can
 *  still hurt you. The exponential decay this replaces covered most of its
 *  distance in the first two frames, so shortening this is the lever that
 *  restores that snap. Trying 5 instead of 8 changed nothing measurable in
 *  either committed replay, so it is left where it was. */
export const ENEMY_KNOCK_FRAMES = 8;

// The KNOCK_* values below are DISTANCES IN PIXELS, not speeds. A hit shoves
// its target KNOCK_x pixels over ENEMY_KNOCK_FRAMES frames at a constant
// speed. They were speeds until P4; the numbers are the total travel the old
// exponential decay produced from the old speeds, so a sword still throws an
// enemy about as far as it used to, in a straight predictable line instead of
// an asymptote. All guessed.

/** px — default knockback dealt when a hit does not name its own. guessed. */
export const KNOCK_DEFAULT = 13;

/** px — knockback dealt by a sword swing. guessed. */
export const KNOCK_SWORD = 18;

/** px — knockback dealt by a spin attack. guessed. */
export const KNOCK_SPIN = 22;

/** px — knockback dealt by a projectile. guessed. */
export const KNOCK_PROJECTILE = 13;

/** px — knockback dealt by an explosion. guessed. */
export const KNOCK_EXPLOSION = 9;

/** px — knockback dealt by a thrown or dropped object. guessed. */
export const KNOCK_THROWN = 9;

/** px — knockback dealt by a boomerang or another stunning tool. guessed. */
export const KNOCK_TOOL = 5;

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
 *  guessed; high enough to read the terrain, low enough that the real room
 *  underneath is never in doubt. */
export const LENS_GHOST_ALPHA = 0.55;

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
