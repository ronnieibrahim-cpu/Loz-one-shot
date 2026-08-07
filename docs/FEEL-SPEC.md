# Feel spec

The engine's timing and motion, in one place, with the honest provenance of
every number.

`src/data/feel.js` is the code; this file is why. Read this before changing a
constant there.

---

## What this file is for

Oracle of Tides has one product requirement above all others: **it must feel
like Oracle of Seasons and Ages.** That is a claim about frame counts, pixels
per frame, and the exact width of an active hitbox window. Until this session
the engine had none of that written down. Speeds and durations were scattered
as module-level constants across four files, each one a number somebody typed
once because it seemed about right, with nothing recording that that is what
it was.

The cost of that is not that the numbers are wrong. Some of them are probably
close. The cost is that **nobody can tell which ones are wrong**, so no change
to any of them can be argued about, and no claim that the game feels right can
be checked. A guess that is labelled a guess is a working hypothesis. A guess
that is not labelled is a fact nobody can dispute.

So: one file, every constant, and a word next to each saying where it came
from.

---

## Provenance

Every export in `feel.js` carries a unit and one of three tags.

| Tag | Means |
|---|---|
| `measured` | Someone frame-stepped a reference recording of Seasons or Ages and wrote the number down. The comment says what was measured and how. |
| `derived` | Computed from another constant in this file. The comment names its ancestor. A derived value is only as good as what it derives from. |
| `guessed` | Somebody typed a plausible number and it shipped. |

**Nothing in `feel.js` is currently `measured`. Not one value.**

Most numbers in it were carried over unchanged from the code as it stood before
the file existed. Those are guesses that happened to feel acceptable to whoever
wrote them, and they are labelled `guessed` accordingly.

P3 turned a handful into `derived`: `WALK_SPEED` and the swim, dive, dash,
shield and sword-hold speeds that hang off it, `ROOM_EXIT_MARGIN`, and the
three jump constants. `derived` there means *computed from a stated constraint*
— the 8.8 grid, the 16px tile, or a reach that had to be preserved — and the
comment names the constraint and shows the arithmetic. It does **not** mean
anyone frame-stepped anything. A derived value is only as good as what it
derives from, and several of these bottom out in a preserved guess.

`measured` is not a compliment and it is not a synonym for "we're happy with
it". It means a reference was frame-stepped. **Do not upgrade a `guessed` to a
`measured` because the game feels fine.** If it feels fine, that is worth
knowing and worth writing in the comment — but it stays `guessed` until
somebody does the work, because the whole value of the tag is that it cannot
be earned by opinion.

### How to earn a `measured`

1. Capture reference footage at a known frame rate.
2. Frame-step the specific behaviour. Count frames; measure pixels against a
   known 16px tile.
3. Write the number into `feel.js`, tag it `measured`, and put **how** it was
   measured in the comment — which game, which action, what was counted.
4. Re-record the replays (`node tools/replay.mjs --record-all`) and commit the
   new baselines in the same change. A feel change that leaves stale replays
   behind is a feel change nobody can review.

---

## The rule

**No module under `src/` may declare its own timing or speed constant.** If a
number governs how the game moves, it lives in `feel.js` and is imported.

This is enforced socially, not mechanically — there is no linter for it. What
there is instead is `tools/replay.mjs`: change a constant and every committed
replay stops matching, which makes the blast radius of a feel change visible
before it is merged rather than after.

The constants deleted from game code and moved into `feel.js` this session:

| Was in | What moved |
|---|---|
| `src/game/player.js` | walk/swim/dive/boost/shield speeds, terrain multipliers, the whole sword swing, charge and spin timing, the sword box geometry, invulnerability and knockback, jump gravity, ledge hop span/duration/height, fall, wash, dig, conch, push delay, throw speed, carry height |
| `src/game/entity.js` | enemy invulnerability, flicker and knockback frames, the default knockback strength |
| `src/game/game.js` | room transition length, the room exit margin, fade rate, banner duration, shake amplitudes and durations, boss death beats, item-present and essence freezes, the game-over wait |
| `src/game/enemy.js` (the AI toolkit) | default enemy speed and animation rate, turn chance, charge/hop/orbit/submerge parameters, the lattice step, decision cadence and turn pause, alignment tolerance, beaching, every boss timing constant, projectile speeds and lifetimes |
| `src/game/tide.js` | the tide sweep length |
| `src/game/projectile.js` | default projectile speed, life and flight height |
| `src/game/objects.js` | pickup life, pop, gravity, settle and grab delay, fairy drift, NPC wander cadence and speed |
| `src/game/effects.js` | explosion duration, damage and knockback |

Layout constants — the dialogue box's margins, the HUD's column positions, the
font's space advance — deliberately did **not** move. They govern where things
are drawn, not how the game moves, and folding them in would make `feel.js` a
junk drawer and dilute the one thing it is for.

---

## Positions are 8.8 fixed-point

Landed in P3. Every entity carries integer subpixel accumulators — `fx`, `fy`
and `fz`, 256 subpixels to the pixel — and `x`, `y` and `z` are integer pixel
positions derived from them by an arithmetic shift. Rendering reads the
integers and rounds nothing. `src/core/fixed.js` is the whole of it, and its
header carries the reasoning; the short version is three things:

1. **`| 0` truncates toward zero.** It floors correctly for positive
   coordinates and incorrectly for negative ones, so anything left of the
   screen edge drew a pixel too far right. `art.js` did this on every sprite.
   An entity sits at negative x on **every room transition** — the incoming
   player is placed at `x = -3` and eased across the seam — so the bug fired
   constantly, one pixel at a time, inside a screen that was already sliding.
   That is why nobody caught it by looking. `>> 8` floors the same way on both
   sides of zero.
2. **A float accumulator drifts.** Adding 1.35 sixty times a second gives a
   number whose low bits depend on the whole history of the run. The old
   replay baselines recorded final positions like `x: 63.015805675746414` and
   `y: 42.00000000000011`; the new ones record `x: 61`. Exact-equality replay
   assertions are only meaningful now.
3. **Subpixel accumulation is what lets a sub-pixel speed exist.** A current
   pushing 0.12 px/f against an integer position rounds to nothing every frame.
   `TIDE_DRIFT_PER_LEVEL` and `NPC_WANDER_SPEED` are both under a pixel a frame
   and only move anything because the remainder is kept.

### The unit boundary

`moveEntity` and the accumulators speak **subpixels** (`sp/f`). Enemy and
projectile *data* goes on speaking px/f — there are several hundred
`speed: 0.45` literals across `src/data/`, and rewriting them in 256ths would
buy nothing. The conversion happens at a small number of named edges:
`moveDir` in the enemy toolkit, the `Projectile` constructor, `hop`'s `power`,
`driftWithTide`'s `perLevel`, `Entity.hurt`'s `knock`. Each one is commented as
the boundary it is.

Constants in `feel.js` state which unit they are in. That mixture is
deliberate, and it is why every export carries a unit.

> **The trap this shape sets.** A constant that moved from px/f to sp/f but has
> a px/f override coming from data reads the override in the wrong unit and
> silently stops working. `ENEMY_HOP_POWER` did exactly this: the zol's
> `power: 1.7` was read as 1.7 subpixels and the slime hopped 1/150th of a
> pixel. Nothing errored. When converting a constant, grep the data files for
> anyone overriding it.

---

## Diagonals

**Diagonal movement is not normalised.** Full speed on both axes: pressing two
directions is `sqrt(2)` times faster than pressing one. That asymmetry is
deliberate and it is a signature of the source games — it is why cutting a
corner across a room in Seasons feels quicker than walking the two edges, and
why players who grew up on those games route diagonally without thinking about
it. Removing it makes movement "correct" and makes it feel like a different
game.

**The engine does this as of P3.** `DIAGONAL_FACTOR` is gone from `feel.js` and
there is deliberately no constant in its place — a scale factor sitting there
at `1` is an invitation to tune it back to something. `updateMovement` leaves
`dx` and `dy` at ±1 and hands the full per-axis step to both.

Two things fell out of it that are worth knowing:

- Cardinal movement got 26% slower (1.35 → 1.0 px/f) while **diagonal movement
  got slightly faster** (1.35 → 1.41 px/f). A player who routes diagonally
  barely notices the change; one who only presses one direction at a time
  feels the game get harder. The recording actor in `tools/replay.mjs` is the
  second kind, and it started dying in the D1 crab room until it was taught to
  disengage diagonally. That is the source games' lesson arriving on schedule.
- Diagonal is now the fast way to travel, which is a real balance lever nobody
  has pulled yet. Nothing in the world is tuned around it.

---

## Two numbers that were wrong on purpose, and how P3 resolved them

### `WALK_SPEED` and `ROOM_EXIT_MARGIN`

**Was:** 1.35 px/f and a 3px margin. 1.35 is not representable as a clean
subpixel step, so the player could never land on a tile boundary, and
`checkRoomExit` needed a margin wider than one movement step to catch them on
the way past. The margin was not a tuning choice; it was a workaround.

**Now:** `WALK_SPEED = 256 sp/f` — exactly 1 px/f, exactly 16 frames to the
tile — and `ROOM_EXIT_MARGIN = 1`.

The choice was more constrained than it looks. A speed must be exactly
representable in 8.8 **and** divide the 16px tile evenly, which means `4096 / s`
has to be a whole number of frames with `s` a whole number of subpixels — so
`s` must divide 4096, i.e. be a power of two. Between a crawl and the Pegasus
dash that leaves 256 and nothing else. It is tagged `derived`, not `measured`:
nobody has frame-stepped a reference. Worth recording anyway that 1 px/f
walking and 2 px/f dashing is the granularity the GB Zeldas are built on, so
the answer the arithmetic forced is at least the right shape.

`BOOST_SPEED` is now exactly `2 * WALK_SPEED`, which is the Pegasus dash.

### A jump's reach is not a property of the jump

The most expensive thing P3 learned, and it is not obvious from either
constant. The player keeps walking while airborne, so:

```
reach = 2 * JUMP_POWER / JUMP_GRAVITY * WALK_SPEED
```

Re-deriving `WALK_SPEED` therefore silently re-derives the length of every gap
in the game. Dropping 1.35 to 1.0 cut Roc's Feather from 2.3 tiles to 1.7 and
made the Coral Reef chasm uncrossable — a region gate that simply stopped
opening. `node tools/check-gates.mjs` caught it. Nothing else would have:
`validate`, `walk-dungeons`, `check-overworld` and `test` were all green, and
so were both replays, because no replay jumps.

`JUMP_POWER`, `JUMP_POWER_CAPE` and `JUMP_GRAVITY` are now `derived` and their
comment carries the formula. **If you change `WALK_SPEED` again, re-derive
them in the same commit.**

---

## Knockback: a distance and a frame count

**Both numbers, for both sides:**

| | Distance | Frames | Speed |
|---|---|---|---|
| Link, hit by anything | `PLAYER_KNOCK_DIST = 18` px | `PLAYER_KNOCK_FRAMES = 12` | 1.5 px/f |
| An enemy, hit by anything | the hit's own `KNOCK_*` px | `ENEMY_KNOCK_FRAMES = 8` | distance / 8 |
| A boss | `KNOCK_* × BOSS_KNOCK_SCALE` px | `BOSS_KNOCK_FRAMES = 6` | distance / 6 |

Constant speed throughout. Nothing decays. All of it `guessed`.

Knockback used to be an impulse that decayed by ~0.83 a frame until it petered
out. That is a physics model, and it is the wrong one: in the GB Zeldas
knockback is a **scripted displacement**, a fixed distance over a fixed frame
count, which is why it always ends the same distance from the thing that hit
you and why you can plan the next swing around it. Exponential decay makes the
distance a function of the initial speed, so a strong hit and a weak hit put
you in unrelated places and neither is predictable.

The `KNOCK_*` constants therefore changed **units**: they were px/f, they are
now total px. The new numbers are the total travel the old decay produced from
the old speeds, so a sword throws an enemy about as far as it always did — the
change is one of shape, not reach. `KNOCK_HOLD`, which P3 added for the
extended blade, is on the same footing: 9 px rather than 2 px/f.

The per-frame step is computed once, in subpixels, when the hit lands —
`sp(distance) / frames`, rounded to a whole subpixel — and then never touched
again. Under the old model the velocity was re-rounded every frame, which is
one more place a run could have drifted.

One thing that falls out of it and is worth knowing before tuning
`ENEMY_KNOCK_FRAMES`: contact damage does not care that an enemy is mid-
knockback. Every frame the enemy spends travelling away is a frame it can
still hurt you. The old decay covered most of its distance in the first two
frames and hid that; a constant speed does not, so the frame count is the
lever that restores the snap. Eight frames was kept because five measurably
changed nothing in either replay.

---

## The sword is three verbs

Landed in P3. Tapping swings, holding charges a spin, and — the part that was
missing — **holding also keeps the blade extended and lets you walk with it
out**. The engine had two of the three, which meant the most-used button in the
game did a third less than it should: you could not shave a bush by walking
through it, you could not hold a doorway against something walking into you,
and a long hold read as a dead wait for the spin rather than as a stance you
were already fighting in.

The hold state is entered `SWORD_HOLD_DELAY` frames after a swing ends if the
button is still down, and it gives:

- a distinct pose — `link_hold_down/up/side`, extracted from the sheet's
  **Charge** band by `tools/rip-link.py`. In the Oracles, holding the button
  *is* the charge, so those are the frames the source game draws for exactly
  this state. They are the only Link sprites that are **not 16x16** (16x30,
  16x28 and 28x16): the blade runs past the edge of Link's cell in whichever
  direction he faces, and cropping it back would delete the sword, which is the
  one thing the pose exists to show. `Player.draw` derives the anchor from the
  sprite's own dimensions so the body lands on the pixel a 16x16 frame would
  have put it on, and so art and anchor cannot drift apart.
- `SWORD_HOLD_SPEED`, three quarters of walking, the same as the raised shield
- contact damage in the swing's own box, at `SWORD_HOLD_DAMAGE` and
  `KNOCK_HOLD`. It is deliberately **not** rate-limited here: the enemy's own
  invulnerability window after a hit is what spaces the hits out, which is how
  the source games space them.
- `checkTileAction(box, 'cut')` every frame, so walking a held blade through
  undergrowth cuts it
- a clink and a spark off a solid tile at the blade tip, debounced by
  `SWORD_CLINK_COOLDOWN` and gated on actually pressing into the wall

The charge keeps running underneath all of it, so hold-to-spin is unchanged.

---

## The lattice

**A ground enemy has no velocity.** It stands on a point of an 8px lattice,
decides where to go, and takes a whole step — `ENEMY_GRID_STEP = 8` pixels in
one cardinal direction, over however many frames its speed implies. Once a step
is running it runs to the end. Nothing turns the enemy mid-step and nothing
draws from the room's stream mid-step.

**All of it is integer subpixel arithmetic** on the 8.8 grid. A lattice point
is a whole multiple of `8 * FP_ONE`; a step's progress is recomputed from the
step's origin every frame as `round(span * f / n)` rather than accumulated; and
the final frame of a step is an assignment, not an addition. There is no
remainder anywhere in it, which is why `check-motion.mjs` can assert alignment
as an exact equality on `fx`/`fy` instead of within a tolerance.

That is the whole mechanism, and it is what makes an octorok dodgeable. The
player can see the enemy standing on a lattice point, knows a decision is about
to happen, and knows the answer will be one of four whole steps. A per-frame
turn probability on a floating velocity gives none of that: the enemy can
reverse at any subpixel, so there is nothing to read, and a room of them looks
like noise rather than a pattern.

| Constant | Value | What it does |
|---|---|---|
| `ENEMY_GRID_STEP` | 8 px | the increment. Divides the 16px tile; half a tile is the coarsest value that still lets an enemy stand in a doorway's centre |
| `ENEMY_DECIDE_STEPS` | 3 steps | how many whole steps a wandering enemy commits to before drawing a new direction. **This is the cadence that replaces `ENEMY_TURN_CHANCE`** |
| `ENEMY_TURN_PAUSE_FRAMES` | 6 f | the hesitation after walking into something, before deciding again |

Three steps is 24px, about a tile and a half: long enough to read as a
decision, short enough that the enemy still feels loose. All three `guessed`.

### Who is on it, and who is not

`gridLocked(e)` in `src/game/enemy.js`. On the lattice: ordinary ground
enemies. Off it, deliberately:

- **Bosses and minibosses.** A set piece should not move like a room fixture.
  The test is `instanceof Boss`, *not* `e.isBoss` — minibosses clear `isBoss`
  in their init so `onEnemyDefeated` does not mark the whole dungeon beaten,
  and reading that flag here would grid-lock every one of them on the strength
  of a piece of progress bookkeeping.
- **Fliers.** `keese`, `bubble`, `wisp`.
- **Aquatic enemies.** Water carries you; it does not step.

And three *verbs* stay continuous even for an enemy that is otherwise on the
lattice, because they exist to feel different from walking:
`bounceDiag`, `orbit`, and `charge`. A charge is the one thing a ground enemy
does that is supposed to have momentum; putting it on the lattice would make it
read as a fast walk. It ends by calling `realign`, so the walking that follows
is back on the lattice.

`wander`, `chase`, `flee` and `patrol` are lattice verbs, and `hop` is a
lattice step with a fitted arc drawn on it — `ENEMY_HOP_DIST` must stay a
multiple of `ENEMY_GRID_STEP`, and the arc is a parabola fitted between two
known endpoints rather than an integrated gravity, so the landing pixel and the
landing frame are both known the instant the hop starts.

### What keeps it true

Knockback, a charge into a wall and a leever surfacing all leave a ground enemy
between lattice points. Every one of those states ends by calling `realign`,
which snaps to the nearest *legal* lattice point — at most 4px on each axis,
under a frame of walking, invisible in motion.

`node tools/check-motion.mjs` is the proof. It spawns one of every enemy in an
emptied room, runs 600 deterministic frames, and asserts that every lattice
enemy is 8px-aligned on every single frame it is not mid-step, mid-charge,
mid-knockback or submerged. It also asserts the converse — that fliers and
swimmers *do* leave the lattice — so a future change that quietly grid-locks
everything fails it too.

### The cost, which is real

The lattice makes enemies harder to juke. A committed 8px step cannot be
deflected, which is the point: a human reads the commitment and steps out of
it. `tools/replay.mjs`'s recording actor cannot — it lines up on one axis,
swings, and stands still for the length of the swing — so it takes roughly 60%
more contact damage through Tidewash Grotto than it did against the old
floating drift, and on three hearts it dies in the Crab Pit. The `d1-descent`
plan now starts it on five. That is a statement about the actor, not about the
game's difficulty; do not read it as a tuning decision.

### `ENEMY_TURN_CHANCE = 0.012` is still here

It governs the **continuous** wander fallback only — bosses and aquatic
drifters. No ground enemy reads it.

---

## The Anchor's radius is settled by play, not by argument

`ANCHOR_RADIUS_TILES` and `ANCHOR_SHAPE` are `guessed`, and unlike most guesses
in this file they are guesses about *design*, not about the source games. There
is no Oracle item to frame-step: nothing in Seasons or Ages holds a patch of the
world at one state while the rest of it changes. So there is nothing to measure
against, and no amount of reasoning settles it.

What reasoning **does** settle is which values are ruled out, and it is worth
writing down because it is not obvious from the number alone. A room is 10 tiles
wide and 8 tall, so the radius has to split **both** axes to be worth anything:

| radius | span | covers |
|---|---|---|
| 4 | 9 tiles | the whole screen — the conch appears to stop working |
| 3 | 7 tiles | 7 of the 8 rows — splits horizontally, never vertically |
| 2 | 5 tiles | both axes |

The execution plan's original "~8 tiles" predates anyone checking it against a
room; at 8 the item cannot do the thing it exists to do.

That leaves 2 as the only value that splits a room, and 1 vs 2 vs the footprint
shape as genuinely open. So they are tunable in the hand:

- **KeyU** cycles the radius 1 → 2 → 3 → 4 → back to the constant.
- **KeyY** swaps the footprint between a square and a Euclidean disc. At this
  scale the shape is legible to the player: a radius-2 disc is 13 tiles and
  reads as a fat plus sign whose edge is hard to eyeball, while a square is a
  clean 5x5 you can see the corners of. Square is the default for that reason,
  but it is a feel question.
- Both re-apply to an anchor **already down**, so the water changes shape under
  the key press and two settings can be compared without re-throwing.
- The debug overlay (KeyO) outlines the held patch and prints the current
  setting beside the base and local tide.

None of this touches determinism: the default is "use the constant", no replay
or checker sets either, and the value is read once at placement into the
override itself — so a recorded replay carries the radius it was recorded with
regardless of where the key was last left.

**Do not promote either to `derived` or `measured` because the game feels fine.**
`measured` has no meaning for a constant with nothing to measure against. When
these are settled, the honest tag is still `guessed`, with a comment saying who
played it and what they chose.

## Determinism

Feel cannot be measured in an engine that does not replay. If the same inputs
from the same state produce a different result twice, then "it feels wrong
after this change" is unfalsifiable — the change might have done nothing and
the run might simply have gone differently.

So the second half of this session is the determinism layer:

- **`src/core/rng.js`** — mulberry32, one global stream seeded from the save
  plus a per-room stream derived from the save seed and the room's identity.
  Nothing under `src/` calls `Math.random`; `tools/test.mjs` greps for it and
  fails the run. See that file's header for which stream is for what.
- **`tools/replay.mjs`** — records a seed plus a flat list of per-frame button
  masks, plays it back headlessly, and asserts the final position by exact
  equality plus a checkpoint every 60 frames. Since P3 the positions it
  compares are integers, which is what that exactness was always meant to be.

The rule that falls out of this and is easy to break by accident:

> **Nothing in a draw path may consume randomness.**

`Game.draw` runs at display rate; `Game.update` runs at a fixed 60 Hz step. A
draw-time draw from a stream advances it a different number of times on a slow
machine than on a fast one, and the run silently desyncs. The screen shake was
exactly this and now uses `noise1`, a pure hash of the frame counter that
consumes no state. Any future draw-time jitter must do the same.

---

## Changing a constant

1. Change it in `feel.js`. Update its unit and its provenance comment.
2. `node tools/replay.mjs` — expect it to fail. If a movement or combat
   constant changes and every replay still passes, either the constant is dead
   code or the replays do not exercise it. Both are worth knowing.
3. `node tools/replay.mjs --record-all` to re-baseline, and commit the new
   replays in the same change as the constant.
4. Run the rest: `validate.mjs`, `test.mjs`, `walk-dungeons.mjs`,
   `check-overworld.mjs`, `check-gates.mjs`, `solve-switches.mjs`.
