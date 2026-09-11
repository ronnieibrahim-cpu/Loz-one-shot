# Next session — Oracle of Tides

Repo `ronnieibrahim-cpu/Loz-one-shot`. Branch from the CURRENT tip of `main` —
`git log -1 origin/main` for the real commit. One prompt = one session = one
branch. Do not open a pull request unless asked. Before starting, run
`git ls-remote --heads origin` and skim for anything boss/evade-related dated
AFTER this file's own session (check the branch's own commit date, not just
its name) — S61 found one branch that looked relevant and was a week stale;
don't repeat that check by hand if a fresher one already did it, but don't
skip it either.

## The honest state of the roster (read `docs/NEXT-SESSION.md` S66, then S65, S64, S63, S62, S61, in full first)

Standard 6-seed sample, `tools/measure-boss-combat.mjs <d> --seed=N`, in-order
health, no god mode:

```
     d1    d2    d3    d4    d5    d6
     6/6   3/6   1/6   6/6   6/6   3/6
```

D1, D4, D5 are robust. D2 is a real coin-flip. D3 is the weak point. **D6
moved from 1/6 to 3/6 this session (S66) and is now roughly level with D2.**

**D6 (Nereth)'s seed-independent wall-freeze is CLOSED — for good this time,
and from a different layer than the last four attempts.** S61 found every
fight (wins included) eating an identical, seed-independent tax during
Nereth's phase-1 tell because the player was frozen against a wall. S62-S65
each tried to fix the RETREAT LOGIC in `tools/actor-runtime.mjs` and all four
failed — the last one (S65) proved definitively that the freeze was not a bug
in the movement code at all: at the exact frame it activated, the fix made
the only defensible choice available, and fixing the freeze that way
necessarily traded one seed's outcome for another purely through timing. S66
attacked it from the other side instead: it measured that the room itself
(a single 10x8 screen, boss spawned left-of-center) simply did not have
enough floor for the fight's own approach-then-retreat rhythm to clear
before hitting the east wall, on literally every seed, before any RNG had a
chance to diverge. **The fix was to widen Nereth's room** — `size:[2,1]`,
doubling it to a 20x8 hall, door left exactly where it was so the dungeon's
own route needed no other change. Measured: 1/6 -> 3/6, zero seeds flipped
from a win to a loss. This is now the ONLY boss room in the game bigger than
one screen, a deliberate trade against this project's own "every boss fight
is a static single screen" convention, made and confirmed with the user
specifically because four attempts at the alternative had already failed.

**Do not re-attempt a `dBoss`/`fence`/`evade` movement-layer fix for this
specific freeze — it no longer exists to fix.** `docs/prompts/LEDGER.md`'s
"Measured and rejected" section still has the four rejected attempts' full
reasoning (useful if a DIFFERENT freeze-shaped bug ever turns up elsewhere),
annotated to point at S66's actual resolution.

## Task: your choice, in priority order

**1. (Recommended) Trace D6's remaining 3 losing seeds (2, 3, 4).** Nobody
has looked at WHY these specific seeds still lose now that the
seed-independent freeze tax is gone — this is a fresh question, not a
continuation of S61-S66's freeze investigation. Use the same rigor this
whole thread has used since S57: get the real per-hit damage log
(`measure-boss-combat.mjs` prints it), find the dominant damage source(s)
per seed before assuming a cause, and don't generalize from one seed to all
three without checking each (S61's own "shared cause" mistake is the
cautionary tale — D3 and D6 turned out to have different mechanisms the one
time someone actually separated them and looked).

1. Read `docs/NEXT-SESSION.md` S66 in full first, then skim S61-S65 for
   context on what's already closed (the freeze) versus what's genuinely
   new here (whatever seed2/3/4 still die to).
2. Get damage-log breakdowns for seed2/3/4's losses. Check whether they
   still show any of the OLD freeze pattern (same pixel, repeated across
   seeds) — if so, S66 may not have fully closed it and that's worth
   knowing; if the damage pattern looks nothing like the old freeze
   (different positions, different frames per seed, real RNG variance),
   this is a genuinely new mechanism.
3. Zero tolerance for turning seed default, seed1, or seed5 (the three
   current wins) into losses, same bar every fix in this area has been held
   to since S52. Validate the full 6-seed sweep after any change, D1-D5
   first (a room/AI change to D6 should not touch them, but confirm rather
   than assume — S66 did, and it's cheap insurance).
4. If a fix works, remember this is now potentially your SECOND real change
   to Nereth's room/AI in one thread — re-check `check-camera.mjs` and
   `check-wide-rooms.mjs` again if you touch the room further, since S66
   already made it the one wide boss room in the game.

**2. (Untouched by the whole D3/D6 thread) Trace D2.** S59's original
"shared cause" framing rested on D2/D3/D6 together; S61 traced D3 and D6
separately and found two different mechanisms for each, and S66 just found
D6's "mechanism" was partly a room problem neither S59 nor S61 could have
seen from the movement layer alone. **Nobody has ever traced D2's own
losing seeds this rigorously.** Do this before assuming any future D3 or D6
fix says anything about D2.

**3. (The bigger, riskier lever, still not attempted) Teach `evade` to dodge
a telegraphed spread/ring attack better.** This is a general
shared-cost-function change, NOT scoped to any one boss — it changes every
fight in the game. S61's own finding still applies: even a perfect version
of this does NOT fix D3 on its own (D3's losses are a roughly even
three-way split across projectile, `gel`-chase, and direct-contact damage —
two of the three untouched by dodge quality). If you pick this up:

1. Read the full comment block above `evade()` in `tools/actor-runtime.mjs`
   first — it documents the 36-seed methodology, why `SHOT_HORIZON` is 30
   and not more, and exactly which past attempts cost which bosses.
2. Budget a FULL session for this alone, with the 36-seed validation bar
   (`--seed=N` for N=1..36, both with and without the change) — a 6-seed
   sample is not enough to trust here; S45's own single-seed "D3 clearly
   fair" claim is the cautionary tale for why.
3. Zero tolerance for turning any currently-winning seed into a loss, on
   ANY of the six dungeons.

**4. (If none of the above fits the session)** `docs/DUNGEON-STATUS.md`
and `docs/prompts/QUEUE.md` name several other independently-scoped items
(region-art systematic diffs, the narrower `dTravel` gap, cross-dungeon item
reuse, frame-stepped `feel.js`). Pick whichever is best-scoped for a single
session.

## On "are the dungeons beatable" — a separate, narrower question

Only D1 and D2 have ever been played start-to-finish by the real, no-items-
granted actor (`tools/check-playthrough.mjs`) — `playthrough-route.mjs`'s own
`GOAL.essences` is `[1, 2]`, and its file header says so outright. D3-D6's
rooms and puzzles are each proven solvable by their own dedicated checker,
and each boss is proven to spawn/open in god mode (`check-bosses.mjs`), but
nobody has chained "walk in, solve everything, beat the boss" for D3-D6 the
way S19/S41 did for D1/D2. Extending the route that far is a large,
multi-session undertaking on its own — not a fit for "continue iterating"
unless a session is explicitly budgeted for it.

## Done means (whichever task is picked)

- Working code changes validated per the relevant tools in CLAUDE.md's own
  table for the area touched.
- `docs/NEXT-SESSION.md` updated losslessly (new entry, do not renumber or
  edit past ones).
- `docs/DUNGEON-STATUS.md` and/or `docs/prompts/LEDGER.md` and/or
  `docs/prompts/QUEUE.md` updated to reflect whatever changed.
- `npm run build` re-run; commit `dist/oracle-of-tides.html` only if `src/`
  changed — confirm rather than assume either way. A fix to
  `hazards()`/`evade()`, `dBoss`, or any boss's own AI in
  `src/data/bosses.js` WOULD need a rebuild (`evade`/`dBoss`/`fence` live in
  `tools/actor-runtime.mjs`, which is test-harness-only and does NOT need a
  rebuild by itself — only a change to `src/` does). **A room/entity data
  change (like S66's) is a `src/` change and DOES need a rebuild** — it is
  not test-harness-only just because it was found via the harness.
- If you touch any dungeon room's `map`/`size`/`entities`, run the full
  relevant sweep S66 used as a template: `validate.mjs`, `walk-dungeons.mjs`,
  `check-dungeon-strands.mjs`, `check-placement.mjs`, `check-ground.mjs`,
  `check-wide-rooms.mjs`, `check-camera.mjs`, `check-bosses.mjs`, plus
  `test.mjs`/`replay.mjs`/`check-playthrough.mjs` and a full boss-combat
  sweep of ALL SIX dungeons (not just the one you changed) to confirm the
  change is actually scoped the way you think it is.

## Explicit out of scope

- **Do not re-attempt `breakDeadlock` (or any boss-scoped opt-in flag proven
  for a stationary/corridor-bound boss) on a boss that actively chases the
  player without a materially different safety condition.** S59's Nereth
  experiment is the concrete example of why this fails.
- **Do not re-attempt giving `hazards()` real velocity for chasing
  (non-projectile) enemies**, in any shape (route-wide or `dBoss`-scoped) —
  tried three times (S54-S56), reverted every time; see
  `docs/prompts/LEDGER.md`.
- **Do not re-attempt any of the four rejected D6 wall-retreat shapes at the
  `actor-runtime.mjs` movement layer for the freeze S66 already closed** —
  S62's ungated per-frame override, S63's gated-but-pre-chosen-direction
  version, S64's unified-fence version, or S65's confirming rebuild of S64.
  All four are documented in `docs/prompts/LEDGER.md`'s "Measured and
  rejected" section, annotated to point at S66's actual fix. This specific
  freeze is gone — there is nothing left in `actor-runtime.mjs` for it.
- **Do not treat a "net aggregate unchanged" result as safe** when it
  actually is unchanged — but do note S66 is the first fix in this whole
  thread where the aggregate DID move (1/6 -> 3/6) with zero regression, so
  this caution is about earlier attempts (S64), not a blanket rule against
  ever landing a net improvement.
- **Do not widen another boss room without a similarly strong, measured
  reason.** S66's trade (breaking the "every boss fight is one screen"
  convention) was made once, deliberately, after four cheaper alternatives
  had failed, and confirmed with the user before building it — it is not a
  precedent for widening a boss room as a first resort.
- **Routing D3 onward** (needs the Coastwise Chain first) remains untouched.

## Habits worth carrying in

- **When a whole class of fix keeps failing at one layer, check whether the
  layer itself is the problem before trying a fifth variant.** S62-S65 spent
  four sessions patching `dBoss`'s retreat DECISION and each one failed for
  a reason that, in hindsight, pointed at the room's own geometry rather
  than the decision logic — S65 in particular proved the decision being made
  was already the best available one. S66 didn't get a fifth movement-layer
  idea to work; it stopped asking the movement layer to fix something it
  structurally couldn't and fixed the actual constraint instead.
- **A "boss-scoped" fix can live in the room, not just the AI.** Every
  previous fix in this whole boss-fairness thread (S49-S65) changed
  `bosses.js` spec fields or `actor-runtime.mjs` logic. S66 is the first one
  that changed the dungeon's own tile/entity data instead — worth
  remembering that "the fight is unfair" doesn't always mean "the boss or
  the test actor needs a better idea"; sometimes the arena is just too
  small for the fight it's hosting.
- **A room-geometry change needs the FULL relevant checker sweep, not just
  the boss-combat measurement.** S66 ran `validate`, `walk-dungeons`,
  `check-dungeon-strands`, `check-placement`, `check-ground`,
  `check-wide-rooms`, `check-camera`, `check-bosses`, the full test suite,
  replay, and check-playthrough, THEN the 6-seed combat sweep — a content
  change like this touches far more of CLAUDE.md's verification table than
  a pure `actor-runtime.mjs` change ever does, and skipping any of those
  checks would have been the same mistake CLAUDE.md's own trap list warns
  about ("a solid tile can strand a room and still pass validation").
- **A trade against this project's own art/design conventions (Goal 1) is a
  decision for the user, not something to make unilaterally, even when the
  engineering case is strong.** S66 checked in twice before writing any
  code: once when "widen the room" turned out to mean "double it" rather
  than a small tweak, and again when doubling it meant breaking the
  single-screen boss-room convention. Both were real trade-offs the user
  needed to weigh, not implementation details.
- **Trace before diagnosing, every time — including re-tracing a PRIOR
  session's diagnosis before building on it.** S61's whole contribution was
  re-tracing S59's "shared cause" claim rather than accepting it, and found
  it didn't hold for either dungeon checked, in two different ways. Every
  session in this thread (S57-S66) found a mechanism at least somewhat
  different from what the session before it expected going in.
- **Two systems independently deciding the same thing is itself a bug
  shape worth naming, not just working around.** S63's fix and `evade`'s
  own candidate search each computed "which direction is safe" separately,
  and `evade` — going second, with no idea the first system existed —
  silently won. When a new check keeps getting silently undone by existing
  logic downstream, look for whether that downstream logic has its own
  filtering hook to plug into, before assuming the new check just needs to
  be more forceful.
- **Zero regression is necessary, not sufficient — an inert fix is not a
  finished fix, and "it didn't break anything" is not the same claim as
  "it works."** S63 built exactly the fix S62 recommended, validated it
  perfectly clean, and it turned out to change nothing at all.
- **A fix that only touches ONE named branch can still regress a dungeon
  that never looked related — measure the OTHER five dungeons, not just
  the one you're fixing, even when the change looks obviously scoped.**
  S62's fix touched only D6's "shelled" retreat branch and broke D1, which
  shares that branch. S66 re-measured all six dungeons for exactly this
  reason even though the change only touched D6's own room data.
- **A "shared cause" claim across multiple dungeons needs each dungeon
  actually traced, not one dungeon's trace generalized by inspection.**
  S59's own D6 experiment and S61's D3/D6 tables are both evidence of this.
- **Zero regression means zero — not "net positive."** A fix that gains one
  win and costs another is not a wash to keep, it's a rejection, per the
  project's own bar since S52. S66 is notable precisely because it is the
  first fix in this whole D6 thread to gain without costing anything.
- **A tool timing out is not the same claim as a fight being lost — check
  the damage log before believing either.** S59's D4 finding: "still alive
  after N frames" with an EMPTY damage log is a slow, safe win the tool cut
  off too early, not a stuck or losing fight.
