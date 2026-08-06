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

Every number in it was carried over unchanged from the code as it stood before
the file existed. They are all guesses that happened to feel acceptable to
whoever wrote them, and they are all labelled `guessed` accordingly. A handful
are `derived`, and in every case their ancestor is a guess, which the comment
says.

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

## Diagonals

**Diagonal movement is not normalised.** Full speed on both axes: pressing two
directions is `sqrt(2)` times faster than pressing one. That asymmetry is
deliberate and it is a signature of the source games — it is why cutting a
corner across a room in Seasons feels quicker than walking the two edges, and
why players who grew up on those games route diagonally without thinking about
it. Removing it makes movement "correct" and makes it feel like a different
game.

**The engine does not do this yet.** `player.js` scales both axes by
`Math.SQRT1_2` when two directions are held. That value now lives in `feel.js`
as `DIAGONAL_FACTOR`, tagged `guessed` and flagged as known-wrong, so the
divergence is visible in one place instead of buried in a movement function.

Setting it to `1` is not a one-line fix, and it should not be done on its own:
it makes every diagonal 41% faster than it is today, which changes every
enemy-dodge window and every corridor traversal in the game. It lands together
with re-deriving `WALK_SPEED` — that is P3 in `docs/EXECUTION-PLAN.md`.

---

## Two numbers that are wrong on purpose, and why they are still here

Three, until P4 landed the lattice and the scripted knockback. `WALK_SPEED` and
its margin are what is left; P3 takes them.

### `WALK_SPEED = 1.35` and `ROOM_EXIT_MARGIN = 3`

1.35 px/frame is not representable as a clean subpixel step, so the player
**can never land on a tile boundary**. `checkRoomExit` therefore cannot fire on
an exact boundary test, and needs a margin wider than one movement step to
catch the player as they pass through. Three pixels is that margin.

So the margin is not a tuning choice — it is a workaround for a walk speed
that does not divide the tile. Both are `guessed`, and `ROOM_EXIT_MARGIN` is
tagged `derived` from `WALK_SPEED` to say so. P3 picks a walk speed that
divides 16 evenly at 60 Hz and drops the margin to 1.

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
change is one of shape, not reach.

One thing that falls out of it and is worth knowing before tuning
`ENEMY_KNOCK_FRAMES`: contact damage does not care that an enemy is mid-
knockback. Every frame the enemy spends travelling away is a frame it can
still hurt you. The old decay covered most of its distance in the first two
frames and hid that; a constant speed does not, so the frame count is the
lever that restores the snap. Eight frames was kept because five measurably
changed nothing in either replay.

---

## The lattice

**A ground enemy has no velocity.** It stands on a point of an 8px lattice,
decides where to go, and takes a whole step — `ENEMY_GRID_STEP = 8` pixels in
one cardinal direction, over however many frames its speed implies. Once a step
is running it runs to the end. Nothing turns the enemy mid-step and nothing
draws from the room's stream mid-step.

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
  float equality plus a checkpoint every 60 frames.

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
