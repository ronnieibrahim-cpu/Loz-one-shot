# Enemies — what each one teaches

One line per enemy: not what it does, but what fighting it teaches the
player. `docs/prompts/STATE.md`'s enemy-roster objective (rotation #4)
asks for exactly this, with the constraint that no two entries teach the
same lesson — read against each other, not written in isolation.
Behavior is read from `src/data/enemies.js`, the single source of truth;
if this file and that one ever disagree, the code is right and this file
is stale.

This is the documentation half of the objective. The art half — every
enemy having idle/walk/attack/hurt/death sprite states — is a separate,
much larger undertaking, scoped (and partly piloted) below.
`tools/check-drift.mjs` reports 0 of 22 with the full 5-state set
(`idle` included), but 9 of 22 already have walk/attack/hurt/death, and
one (`urchin`) now has `idle` too — see below for both.

| Enemy | What fighting it teaches |
|---|---|
| `octorok` | Its rock-throw only fires when you're on its exact row or column — step off the line and it can't touch you at range. |
| `octorokSea` | Its bubble-shot AIMS at you instead of firing along a line, so alignment doesn't save you — only distance and cover do. |
| `crab` | Shielded from the front only; you have to get to its side or back to land a hit while it's watching you. |
| `zol` | Killing it doesn't end the threat — it splits into two weaker gels, so a kill can be the start of a new problem, not the end of one. |
| `gel` | Weak alone, dangerous as a pack: each one dies in a hit, but several chasing at once punishes standing still more than any single hit does. |
| `keese` | Rests, then bursts into an erratic dash — the fight is reading the burst's start, not predicting its wandering path. |
| `leever` | Spends most of its time buried and untouchable; you only get a window to hit it while it's surfaced and chasing. |
| `bubble` | Can't be killed at all — the only correct response is staying out of its bounce path. |
| `beamos` | Never moves and only fires straight along its own facing; step off its row or column and it's harmless. |
| `beetle` | Telegraphs a straight charge before committing to it — dodge the tell, then punish from the side, since its shield only covers the front. |
| `tektite` | Closes the distance in a slow, fixed rhythm of hops; the test is timing a hit into the gap between them. |
| `wisp` | Doesn't chase at all — it punishes you for staying inside its ring on a timer, so the fight is about WHEN to be near it, not whether you can dodge a shot. |
| `urchin` | Harmless on dry ground and only wakes up once the tide covers it — the sea itself decides when this one is dangerous. |
| `moblin` | A ranged attacker that actively backs away once you close in, so cornering it matters more than just approaching. |
| `stalfos` | Chases you down on its own, then hops back the instant you're in range — it's daring you to swing into empty air. |
| `darknut` | Combines a directional shield with a committed charge: survive or dodge the lunge, then still come at it from an angle it isn't watching. |
| `wizzrobe` | Teleports in, fires one aimed shot, teleports out — the punish window is short and needs closing distance fast, not just dodging. |
| `anglerfry` | Drifts lazily on its lure rather than sitting still, then commits to a single fast lunge once you're close — the lesson is that slow, aimless movement isn't the same as harmless movement. |
| `barnacle` | Can't be killed and aims its shot straight at you, so the alignment tricks that work on other turrets don't — you have to break its line of sight or its range instead. |
| `jellyfish` | Its drift speed and direction change with the tide level, so predicting where it's going means reading the sea, not the enemy. |
| `siren` | Surfaces and fires in every direction at once, so standing at an angle doesn't help — only range or timing the window before it fires does. |
| `pincer` | Never leaves its hole and always snaps exactly two tiles out and back, so once you've measured that reach you can stand just outside it and punish the recovery. |

## Why this ordering of lessons holds together

Three enemies (`bubble`, `beamos`, `barnacle`) are unkillable by design
(`hp: 999`, no drop) and form a deliberate progression rather than a
repeated idea: `bubble` is a pure contact hazard with no attack at all,
`beamos` adds a ranged attack but one that only fires along a fixed
axis, and `barnacle` adds aim, so the axis trick that neutralises
`beamos` stops working. Three more (`leever`, `wizzrobe`, `siren`) share
one engine primitive — `submerge()`, the surface/hide cycle — but each
uses the exposure window differently: `leever` becomes a melee chaser
while up, `wizzrobe` fires one aimed shot, `siren` fires in a full ring,
so "punish the window" means something different each time. `moblin` and
`stalfos` both retreat from a close player, but `moblin` retreats to
keep using a ranged attack while `stalfos` retreats with no attack at
all, purely to deny a swing — a zoner versus an evader. `zol`/`gel` and
the tide-linked pair `urchin`/`jellyfish` are similarly built to be read
together rather than alone.

## Idle states: scoped, then piloted on one enemy

`Enemy.spriteName()` (`src/game/enemy.js`) has no concept of "idle" at
all: its priority order is `dying > hurtFrame > attackFrame > walk
cycle`, and an enemy that isn't moving just keeps showing its ordinary
`spec.frames` cycle, tick-driven, identical to when it IS moving.
Confirmed by reading the method directly, not assumed.

Reading every one of the 22 `ai()` functions in `src/data/enemies.js`
for a genuine standing-still moment (distinct from a walker's brief
pause between lattice-step decisions) splits the roster in two:

- **13 enemies are never meaningfully still**: `octorok`, `octorokSea`,
  `crab`, `gel`, `leever` (hidden while submerged, always chasing while
  up), `bubble`, `beetle`, `moblin`, `stalfos`, `darknut`, `anglerfry`,
  `jellyfish`, `wisp`. Each drives `chase`/`flee`/`wander`/`patrol`/
  `bounceDiag`/`orbit`, or a `charge()` whose own `idle:` callback is
  itself one of those movement verbs. "Idle" isn't a meaningful concept
  for any of them.
- **9 enemies do have a real, nameable standing-still state**: `beamos`
  and `barnacle` (speed 0, stationary their entire life between shots),
  `wizzrobe` and `siren` (motionless for most of their surfaced phase
  between `shootRing`/`shoot` calls), `keese` (the first ~44 of its
  60-frame rest, before the last 16 already show `attackFrame`), `zol`
  and `tektite` (the equivalent wait before `hop()`'s own attackFrame
  window), `pincer` (its `'hole'` state — the bulk of its life), and
  `urchin` (does nothing at all while the tide is below level 1 — the
  cleanest case: "dormant and harmless" versus "awake and dangerous" is
  a real design distinction, not just a mechanical pause).

So the AI shape is not the blocker — for those 9, a `spec.idleFrame`
condition could be written down precisely (see below). **The blocker is
art.** For every one of those 9, this session re-checked
`tools/rip-enemies.py`'s own coordinate map for a spare sheet frame near
that enemy's block — the same method that found every `attackFrame`/
`hurtFrame`/`deathFrame` reuse this objective has landed so far — and in
every single case the answer is the same: any extra frame the ripper's
own comments already identified nearby has already been claimed:

| Enemy | Spare frame the ripper found | Already spent on |
|---|---|---|
| `beamos` | box 20 | `beamos_atk` |
| `barnacle` | box 144 | `barnacle_atk` |
| `wizzrobe` | box 338 | `wizzrobe_death` |
| `urchin` | box 295 | `urchin_death` |
| `pincer` | boxes 232, 235 | `pincer_death`, `pincer_hurt` |
| `keese`, `zol`, `tektite`, `siren` | none found | both of their only 2 frames are already walk-cycle + `attackFrame` |

Zero unclaimed frames remain for any of the 9 candidates. Wiring `idle`
for any of the other 8 today would mean either reusing an already-claimed
pose for a second, conflicting meaning (`urchin`'s own retracted-spike
`deathFrame` doubling as a dormant pose would have made the same sprite
mean both "defeated" and "asleep" — see below for why it got a real new
pose instead) or hand-drawing new art for each of them in turn — a real
undertaking that CLAUDE.md's extraction-first rule says shouldn't be
reached for casually, one enemy at a time, without weighing it against a
sheet re-audit first.

**`urchin` was piloted anyway, in a follow-up session, as a deliberate
hand-draw decision** — not a shortcut around the finding above, but the
one candidate worth spending hand-drawn art on immediately: it has no
`attackFrame` competing for its 2 live frames, and "dormant and harmless
below tide level 1" versus "awake and dangerous at or above it" is a
real design distinction the player can learn to read, not a mechanical
pause. `urchin_idle` (`src/data/sprites-enemies-hurt.js`) is a genuinely
new pose — the crown's four tallest spike-tip rows blanked outright,
sitting visibly lower and flatter than `urchin_0`/`_1`'s full spike
crown while keeping the notched shell texture `urchin_death`'s smooth
dome fills in entirely — confirmed distinct from both neighbours by
rendering all three side by side from the real palette before wiring it
in (a first, subtler draft that only trimmed a couple of edge pixels
looked identical to `urchin_0` at actual size and was discarded).
`Enemy.spriteName()` now reads `spec.idleFrame` (`src/game/enemy.js`)
between `attackFrame` and the plain walk cycle, and `urchin`'s own
`ai()` (`src/data/enemies.js`) sets `e.idle = g.tide.level < 1` directly
— the exact condition that already decides whether it does anything at
all, not a generic "hasn't moved in N frames" timer (which would
misfire on every walker's ordinary pause between lattice-step
decisions). Verified in-engine: forcing the tide to LOW shows
`urchin_idle`, forcing it back to HIGH reverts to the ordinary walk
cycle, cycling back to LOW re-triggers it, and a lethal hit taken while
dormant still shows `urchin_death`, not the idle pose — the same
priority-order proof every other field in this roster got.
`tools/check-drift.mjs` now reads `idleFrame` the same way it reads
`hurtFrame`/`attackFrame`/`deathFrame`, and `urchin` reports
`walk,idle,death`.

**`urchin`'s own "harmless" claim was found half-implemented, then
fixed.** While judging the other 8 candidates against `urchin`'s bar
(below), a follow-up session found that only `urchin`'s MOVEMENT was
ever tide-gated — `Player.updateContactDamage` (`src/game/player.js`)
also skips a `harmless` enemy's contact damage, but nothing had ever set
`e.harmless` for `urchin`, so a "dozing" one at LOW tide still dealt its
full contact damage on touch (`docs/NEXT-SESSION.md`'s S99 entry has the
original finding). Fixed in the same session that found it: `urchin`'s
`ai()` (`src/data/enemies.js`) now sets `e.harmless` from the same
`g.tide.level < 1` condition that already drives `e.idle` and `wander()`
— reusing the exact flag `submerge()`'s down/up cycle already toggles
the same way, not a new mechanism. Verified in-engine with a scratch
probe placing the player directly on an `urchin` at each tide level:
LOW takes zero damage, HIGH takes the normal 2 quarter-hearts. Sword
damage TO the enemy is unaffected either way (`e.harmless` only gates
its own contact damage OUTPUT, not incoming hits), so it can still be
fought at any tide. The lesson above is now literally true.

**A follow-up session judged the other 8 candidates against `urchin`'s
own bar — does a distinct idle pose teach the player something, the way
a real dormant/awake split does — rather than treating "no free art" as
the only test, and found NONE of them clear it**, independent of the art
question:

- `beamos`/`barnacle`: stationary their entire existence, with no
  separate safe/dangerous mode — they can fire whenever a player is
  aligned and in range, at any moment, and `attackFrame` already marks
  the one moment that differs (about to fire). An idle pose would be
  redundant with that contrast, not add a new one.
- `wizzrobe`/`siren`: their `whileUp` callbacks fire on a plain frame
  counter with no player-distance or range check at all — surfaced
  means "will shoot again within its own period," full stop. There is
  no safe surfaced sub-state to give a separate pose to; the entire
  surfaced window is uniformly dangerous, unlike `urchin`'s tide split.
- `keese`/`zol`/`tektite`: their rest/wait IS already visually distinct
  from their burst/hop via actual movement — motionless means "not
  currently closing distance," moving means it is, and `attackFrame`
  already marks the last stretch before the movement starts. A separate
  idle pose for the earlier, quieter part of the same wait would be
  cosmetic, not informative: the player already reads "stopped moving"
  as the safe signal.
- `pincer`: spends its whole life visually anchored to one point in the
  hole regardless of internal state, and the player's actual lesson (a
  fixed, measurable snap-and-return reach) comes from watching where the
  head visibly stops, not from a resting pose while it hasn't acted yet.

**Verdict: no second `idleFrame` pilot this session.** The concrete next
step, if this objective's rotation returns to `idle` again, is either a
full sheet re-audit for the remaining 8 (in case any of them turns out
to have a design case this pass missed) or accepting that `urchin` may
be the only enemy in this roster where idle art was ever going to teach
something — not a search for a 9th candidate or an 8-at-once push.

## Audit: all 22 lessons checked against the real code

Following S99's accidental `urchin` find (a lesson that read as true but
wasn't enforced), a follow-up session read every one of the 22 lessons in
the table above against `src/data/enemies.js`'s real `ai()`/`hurt()`/spec
fields (and `src/game/enemy.js` where a lesson depends on shared engine
behavior), checking each one the way `urchin`'s was checked: is the claim
actually enforced, not just plausible. Confirmed every check in-engine
with a scratch probe (headless, same boot pattern as
`tools/check-motion.mjs`) rather than reasoning about the code alone.

**Two real code bugs found and fixed:**

- **`beamos`** claimed to "only fire straight along its own facing; step
  off its row or column and it's harmless" — a contrast the file's own
  "Why this ordering of lessons holds together" section states explicitly
  ("`beamos` adds a ranged attack but one that only fires along a fixed
  axis, and `barnacle` adds aim"). The actual `ai()` passed `aim: true`
  to `shoot()` with no `aligned()` check at all — it fired a shot homing
  on the player's exact position at any range under 80px, aligned or not.
  Confirmed with a scratch probe: placing the player 40px off both axes,
  well inside range, still drew a hit before the fix. Fixed by matching
  `octorok`'s own already-correct call shape — `aligned(e, g, 14)` gates
  the shot and sets `e.dir`, and `shoot()` is called with no `aim`, so
  `fire()` sends it straight in that direction. Re-ran the same probe
  after the fix: 0 off-axis hits, on-axis shot still fires and travels
  with zero lateral velocity. `barnacle` was checked too and is correct
  as shipped — its `aim: true` with no alignment check is exactly what
  its own lesson claims.
- **`leever`** claimed to spend "most of its time buried and untouchable,"
  only surfacing for "a window" to chase. Its `submerge()` call had
  `down: 70, up: 110` — surfaced (chasing, vulnerable) for the LONGER
  half of every cycle, not the shorter one. Confirmed with a scratch
  probe counting hidden-vs-up frames over ~11 full cycles: 38.5% hidden
  before the fix. Swapped to `down: 110, up: 70` (same 180-frame total,
  so nothing about the cycle's overall length changed) and re-ran the
  same probe: 60.5% hidden after. `leever` does not appear on
  `check-playthrough.mjs`'s route or any `replay.mjs` tape (only in a
  routing comment explaining why the route avoids it), so this carried
  none of the timing-drift risk `docs/prompts/LEDGER.md`'s "Measured and
  rejected" section warns `deathFrame` additions do.

**One doc-only fix — the lesson was wrong, not the code:** `anglerfry`'s
roster line claimed it "sits still like part of the scenery until you
swim past." Its actual idle behavior is `charge()`'s own `idle` callback,
`wander(e, g, { speed: 0.35, turnChance: 0.02 })` — genuine continuous
movement, not stillness. A scratch probe confirmed it: released with no
player nearby, it drifted ~82px over 600 frames, more than five tile
widths. This is not a bug: the code's own comment right above it already
says "Drifts on its lure until you are close, then dashes in a straight
line," and this file's own "Why this ordering of lessons holds together"
section (above) already lists `anglerfry` among the enemies that are
"never meaningfully still" — the roster table's "sits still" line
contradicted this file's OWN later section, not just the code. Reworded
the roster line to describe the actual, deliberate drift instead of
rewriting the code to match an aspiration nothing else in the project
shared.

**The other 18 lessons were read against the real code and checked out
true**, including the specific categories worth double-checking per this
audit's own brief: every shield claim (`crab`, `beetle`, `darknut`, all
`shield: 'front'`) was traced through `Enemy.hurt()`'s `opposite[dir] ===
this.dir` check against both a projectile's travel direction and a sword
swing's `this.dir` (the player's own facing) — both funnel into the same
"blocked only from the front" logic, confirmed consistent for both attack
kinds; every aimed-vs-axis claim other than `beamos`/`barnacle` above
(`octorok` no aim + `aligned()`, `octorokSea` `aim: true`, `moblin` no
aim + `aligned()`, `wizzrobe` `aim: true`) matched its own lesson exactly;
`urchin`'s `harmless`/`idle` tide gating (fixed at S99) still holds. No
further findings recorded to `docs/NEXT-SESSION.md` — every real mismatch
this pass found was small enough to resolve in this same session.
