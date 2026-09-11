# Next session — Oracle of Tides

Repo `ronnieibrahim-cpu/Loz-one-shot`. Branch from the CURRENT tip of `main` —
`git log -1 origin/main` for the real commit. One prompt = one session = one
branch. Do not open a pull request unless asked. Before starting, run
`git ls-remote --heads origin` and skim for anything boss/evade-related dated
AFTER this file's own session (check the branch's own commit date, not just
its name) — S61 found one branch that looked relevant and was a week stale;
don't repeat that check by hand if a fresher one already did it, but don't
skip it either.

## The honest state of the roster (read `docs/NEXT-SESSION.md` S63, then S62, then S61, then S59, in full first)

Standard 6-seed sample, `tools/measure-boss-combat.mjs <d> --seed=N`, in-order
health, no god mode:

```
     d1    d2    d3    d4    d5    d6
     6/6   3/6   1/6   6/6   6/6   1/6
```

D1, D4, D5 are robust. D2 is a real coin-flip. D3 and D6 are the weak points.

**S59 diagnosed this as ONE shared cause across D2/D3/D6 — `evade` failing to
dodge multi-shot spread/ring attacks, with losses dying "overwhelmingly" to
`isProjectile` chip damage. S61 traced D3 and D6 (not D2) and found that
claim does not hold as stated for EITHER dungeon, in two DIFFERENT ways:**

- **D3 (Gloomtide):** damage is a roughly even three-way split across all 5
  losing seeds — projectile 20-50%, `gel`-chase contact chip damage
  20-35%, and direct `gloomtide`-BODY contact damage (during the verb's own
  "close the distance and take the shot" branch, which its own comment
  already calls "the one branch a hit can actually land in" — accepted by
  design) 35-50%, usually the single biggest category. In every losing
  seed, gel + direct-contact damage ALONE is 11-17 of the 20 qh that killed
  the player — near or past the lethal budget with ZERO projectile damage
  counted. A fix to spread-dodging alone cannot flip D3 to reliably
  winning; two of its three damage sources are things other than that.
  (The `gel` chase-contact piece is the ALREADY-DIAGNOSED, ALREADY-TRIED-
  AND-REVERTED `hazards()`-velocity gap — S54-S56, see
  `docs/prompts/LEDGER.md`'s "Measured and rejected" — do not re-open it.)
- **D6 (Nereth): the WHY is confirmed (S62), a safe-but-inert fix was built
  and rejected on those grounds (S63), and there is now a specific, narrow
  question to answer before trying again.** Every one of the 6 standard
  seeds, WINS INCLUDED, eats an identical opening tax — three `isProjectile`
  hits, 3 qh each (9 of 32, 28% of the whole fight), at the same three
  frames, same distance, every single time, because nothing about it
  involves RNG (it's Nereth's deterministic phase-1 trident spread). S61
  found the player frozen stationary for 220+ frames while it happens; S62
  found why: **the retreat direction is computed once from pure geometry
  ("away from the boss") and is never checked against real wall collision
  before being committed to** — neither `fence` (only guards the room's
  four OUTER edges) nor `evade` (its hazard list is empty until the boss's
  attack windup fires, so it has nothing to object with) ever catches it.
  Confirmed against the real room grid: the player is cornered — blocked by
  a wall on BOTH the direct retreat axis and, it turns out, its own
  individual components too (S63 found this is a genuine corner, not a
  single blocked side).
  **S62's ungated fix regressed D1 outright — rejected.** **S63 built the
  safe, opt-in, accumulated-stall-gated version S62 itself recommended
  (a new `nereth.spec.stuckRetreat` flag, `breakDeadlock`'s own
  `stuckFrames` shape, an 8-direction search once S62's narrower 2-direction
  version was found to stay silently inert at a true corner) — measured
  ZERO regression (D1 and the full D6 6-seed sweep both byte-identical to
  baseline, confirmed by direct `git stash` A/B, not memory) but ALSO ZERO
  EFFECT. Not shipped — an inert fix adds real complexity for no measured
  benefit, so it was reverted rather than left in the tree unused.**
  **The reason it's inert is now the specific, narrow next question, and
  it is NOT "which direction to pick" anymore — S63 already fixed that.**
  Traced the player's own fixed-point position accumulator (`fy`, the real
  sub-pixel value position is built from) through the entire stuck window:
  it moved a total of ~242 of a 256-per-pixel unit across ~250 frames of a
  direction (`up`) the fix had correctly selected and that a static
  `canOccupy` check calls walkable — roughly ONE frame's worth of drift,
  not what 30+ frames of genuinely free 1px/frame movement would produce.
  Something separate from "which direction is correct" is refusing the
  actual per-frame movement almost entirely, even once the right direction
  is chosen. Two specific, NOT YET CHECKED candidates, in priority order:
  (a) `canOccupy` also checks other SOLID entities in the room (CLAUDE.md's
  "a solid entity is solid now" rule) — the stall-gated fix's one-shot 8px
  probe takes that check at a single instant, which could differ from what
  the REAL per-frame `moveEntity` sees if anything solid in the room moves
  between the probe and the actual resolution; (b) the probe distance
  itself (8px) may never actually leave the player's CURRENT tile from this
  exact position (S63 found the hitbox has ~9px of clearance on the tested
  axis before the probe distance would even reach the tile boundary), which
  would mean "canStep says walkable" was never really testing "leads
  somewhere new" here — a probe-methodology flaw independent of whatever
  else is blocking real movement.
- **D2 was not traced this session (or last).** Don't assume it matches
  either D3's or D6's shape without checking — S59's "one shared cause"
  framing already turned out to average over two different mechanisms once
  two of its three dungeons were actually looked at separately.

Full account, including the exact damage-log tables, the position traces,
and the fixed-point accumulator measurement, in `docs/NEXT-SESSION.md` S61,
S62 and S63 — read all three, in that order; each is the direct, narrower
continuation of the one before it, not a restart. S59's own entry (still
worth reading for the rejected `breakDeadlock`-on-Nereth experiment) is now
superseded on the "shared cause" claim specifically — everything else in it
stands.

## Task: your choice, in priority order

**1. (Recommended, narrower than ever) Answer S63's ONE open question
before touching `dBoss` again: does the REAL per-frame `moveEntity` call —
not a reimplemented static `canOccupy` probe — actually refuse to move the
player from the exact frozen position, and if so, why?** The direction-
selection problem is SOLVED (S63's 8-direction, away-ranked search); do not
rebuild it. The safety mechanism is SOLVED (opt-in flag + accumulated
stall, proven zero-regression); do not rebuild that either. The only
missing piece is why a direction a static check calls safe doesn't actually
move the player in practice:

1. Read `docs/NEXT-SESSION.md` S61, S62 AND S63 in full before writing any
   code. Each is the direct continuation of the one before it; skipping one
   means re-deriving work that is already paid for.
2. Trace the REAL movement resolution directly rather than reasoning about
   `canOccupy` from outside it — e.g., log `Entity.moveEntity`'s own
   `hitX`/`hitY` return values for the player at this exact position and
   direction (temporary instrumentation, same scratch-then-real method as
   every session in this thread), or check whether any OTHER entity's
   `solid` rect overlaps the path during the stuck window. Confirm the
   mechanism before designing anything — this thread's own recurring lesson
   (S57, S58, S59, S61, S62) is that guessing here has cost a session every
   single time it happened.
3. Separately, sanity-check S63's `canStep` probe DISTANCE (currently 8px)
   against the actual tile geometry at the frozen position — if 8px never
   crosses a tile boundary from there, fix the probe (a full 16px, or a
   step that explicitly checks the destination tile rather than a fixed
   pixel offset) before concluding the direction-selection logic itself is
   sound.
4. Once the real blocker is identified, THEN decide whether S63's already-
   built stall-gated redirect (revert it from git history — `git log`
   for the S63 commit, or rebuild from this file's account) needs a small
   adjustment or a different approach entirely. Do not guess a fix before
   this step is done — that is exactly the mistake this task description
   is trying to prevent for a fourth time.
5. Validate the FULL six-dungeon, 6-seed sweep before trusting anything,
   D1 first (fastest way to catch the class of regression S62 hit, even
   though S63's gating already made that specific regression structurally
   impossible — a different change could reintroduce a different one).
6. Re-verify D3 and D6's per-seed damage-source breakdowns AFTER the fix
   (not just win/loss counts) — S61's tables are the before-picture;
   confirm the fix actually changes the mechanism it claims to.
7. If this ALSO turns out inert or regresses something: stop, revert,
   document precisely why, and hand it off rather than guessing a fourth
   time in the same session — three attempts on one branch (S62's ungated
   version, S63's gated-but-inert version, and whatever this session tries)
   without a shipped result is a real signal the next session should try a
   genuinely different angle, not a fourth variant of the same one.

**2. (The bigger, riskier lever, if you have a full session for it and
option 1 turns out to need it) Teach `evade` to dodge a telegraphed
spread/ring attack better.** Only worth it now with S61's caveat in mind:
even a perfect version of this does NOT fix D3 on its own (see above) — it
would need to be paired with, at minimum, an honest re-statement of what it
does and does not fix, not sold as "the D3/D6 fix." If you pick this up:

1. Read the full comment block above `evade()` in `tools/actor-runtime.mjs`
   first — it documents the 36-seed methodology, why `SHOT_HORIZON` is 30
   and not more, and exactly which past attempts cost which bosses.
2. Budget a FULL session for this alone, with the 36-seed validation bar
   (`--seed=N` for N=1..36, both with and without the change) — a 6-seed
   sample is not enough to trust here; S45's own single-seed "D3 clearly
   fair" claim is the cautionary tale for why.
3. Zero tolerance for turning any currently-winning seed into a loss, on
   ANY of the six dungeons — that is the bar every fix in this area has
   been held to since S52, and S59's own rejected experiment is a fresh
   example of how easily a boss-scoped-looking change can violate it
   anyway.

**3. (If neither of the above fits the session)** `docs/DUNGEON-STATUS.md`
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
  rebuild by itself — only a change to `src/` does).

## Explicit out of scope

- **Do not re-attempt `breakDeadlock` (or any boss-scoped opt-in flag proven
  for a stationary/corridor-bound boss) on a boss that actively chases the
  player without a materially different safety condition.** S59's Nereth
  experiment is the concrete example of why this fails.
- **Do not re-attempt giving `hazards()` real velocity for chasing
  (non-projectile) enemies**, in any shape (route-wide or `dBoss`-scoped) —
  tried three times (S54-S56), reverted every time; see
  `docs/prompts/LEDGER.md`.
- **Do not re-attempt a per-frame, UNGATED `canOccupy` override on D6's
  "shelled: wait out the tell" retreat direction.** S62 tried exactly this
  and it flipped D1's default seed from a clean win to a loss while making
  D6 uniformly worse.
- **Do not re-attempt an accumulated-stall-gated `canOccupy` redirect that
  only tries `backAlong`/`backPerp` individually.** S63 tried exactly this
  first and found it stays silently inert at a genuine corner (both single
  axes blocked, not just the diagonal) — it needs the full 8-direction
  search S63 built next, not this narrower version.
- **Do not re-attempt the FULL S63 version (opt-in flag + stall gate +
  8-direction away-ranked search) unchanged, expecting a different result.**
  It is confirmed zero-regression but also confirmed INERT — the player's
  own position accumulator barely moves even once "up" is selected and
  approved. Something else in the real movement path is refusing it; find
  that first (task 1 above) before re-shipping this exact logic.
- **Routing D3 onward** (needs the Coastwise Chain first) remains untouched.

## Habits worth carrying in

- **Trace before diagnosing, every time — including re-tracing a PRIOR
  session's diagnosis before building on it.** S61's whole contribution was
  re-tracing S59's "shared cause" claim rather than accepting it, and found
  it didn't hold for either dungeon checked, in two different ways. Every
  session in this thread (S57, S58, S59, S61, S62, S63) found a mechanism
  at least somewhat different from what the session before it expected
  going in.
- **Zero regression is necessary, not sufficient — an inert fix is not a
  finished fix, and "it didn't break anything" is not the same claim as
  "it works."** S63 built exactly the fix S62 recommended, validated it
  perfectly clean, and it turned out to change nothing at all. Measure the
  THING THE FIX WAS FOR (here: does the player actually move, does the hit
  count go down), not only the safety bar — a change can clear the safety
  bar by doing nothing.
- **A reimplemented check is not the real thing, even when it calls the
  real function.** S63's `canStep` called the engine's own `canOccupy` (the
  sanctioned pattern, not a re-derived rule) but still diverged from what
  actually happens during real per-frame movement, because it asked the
  question at a single static instant with a guessed probe distance rather
  than observing the real, live movement resolution. Calling the right
  function is not the same as asking it the right question.
- **A fix that only touches ONE named branch can still regress a dungeon
  that never looked related — measure the OTHER five dungeons, not just
  the one you're fixing, even when the change looks obviously scoped.**
  S62's fix touched only D6's "shelled" retreat branch and broke D1, which
  shares that branch (both bosses are shelled) but had no known problem in
  it. "This code path only matters for the dungeon I traced" is exactly the
  assumption that cost a session here.
- **A per-frame override is not the same risk class as an accumulated-
  evidence one, even when they check the same condition.** S62's `canStep`
  and `breakDeadlock`'s `stuckFrames` both ask "is this direction actually
  safe/possible" — the difference that made one safe and the other a
  regression is WHEN they're allowed to act: `stuckFrames` only overrides
  after 30+ frames of real, measured non-progress, while S62's version
  re-litigated the geometry on every single frame regardless of whether
  anything was actually wrong, and fired on ordinary frames it had no
  business touching.
- **A "shared cause" claim across multiple dungeons needs each dungeon
  actually traced, not one dungeon's trace generalized by inspection.**
  S59's own D6 experiment and S61's D3/D6 tables are both evidence of this:
  every time someone has separated the dungeons and looked, the mechanism
  turned out dungeon-specific.
- **A boss-scoped fix that resembles a previously-successful one is not
  automatically safe — measure the FULL seed sweep before believing it,
  every time, even when the code change is one line.** S59's Nereth
  experiment looked like a free win by inspection and was a net loss when
  actually measured.
- **Zero regression means zero — not "net positive."** A fix that gains one
  win and costs another is not a wash to keep, it's a rejection, per the
  project's own bar since S52.
- **A tool timing out is not the same claim as a fight being lost — check
  the damage log before believing either.** S59's D4 finding: "still alive
  after N frames" with an EMPTY damage log is a slow, safe win the tool cut
  off too early, not a stuck or losing fight. Don't conflate the two without
  checking which one a "never finished" result actually is.
