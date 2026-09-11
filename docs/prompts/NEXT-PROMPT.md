# Next session — Oracle of Tides

Repo `ronnieibrahim-cpu/Loz-one-shot`. Branch from the CURRENT tip of `main` —
`git log -1 origin/main` for the real commit. One prompt = one session = one
branch. Do not open a pull request unless asked. Before starting, run
`git ls-remote --heads origin` and skim for anything boss/evade-related dated
AFTER this file's own session (check the branch's own commit date, not just
its name) — S61 found one branch that looked relevant and was a week stale;
don't repeat that check by hand if a fresher one already did it, but don't
skip it either.

## The honest state of the roster (read `docs/NEXT-SESSION.md` S65, then S64, S63, S62, S61, S59, in full first)

Standard 6-seed sample, `tools/measure-boss-combat.mjs <d> --seed=N`, in-order
health, no god mode:

```
     d1    d2    d3    d4    d5    d6
     6/6   3/6   1/6   6/6   6/6   1/6
```

D1, D4, D5 are robust. D2 is a real coin-flip. D3 and D6 are the weak points.
None of this session's own work changed any of these numbers — D6's fix was
traced, understood and reverted.

**D6 (Nereth)'s specific "shelled: wait out the tell" wall-freeze thread is
now CLOSED at the `actor-runtime.mjs` movement layer — four attempts across
four sessions (S62-S65), all rejected, and S65 explains WHY the fourth one
had to fail rather than just observing that it did.** Full chain:

- S61 found the freeze itself: every seed (wins included) eats an identical,
  seed-independent 9-quarter-heart tax during Nereth's phase-1 trident
  spread, because the player is completely frozen for 220+ frames against
  what turned out to be a wall.
- S62 found the exact mechanism (a real interior corner, invisible to
  `fence`'s edge-only margin check) and tried the obvious per-frame
  `canOccupy` override — regressed D1 outright.
- S63 gated the same idea behind a 30-frame accumulated-stall counter
  (`breakDeadlock`'s own shape) — zero regression, but measured completely
  INERT: `evade`'s own hazard search silently swapped back onto the wall the
  instant a hazard existed.
- S64 folded the wall check into `fence` itself, so `evade`'s hazard search
  can only ever land on a wall-real candidate — genuinely changed the fight
  for the first time (seed3 flipped a loss to a win), but seed1 flipped a
  clean win to a loss. Rejected per this project's own per-seed bar.
- **S65 independently rebuilt S64's exact fix from its own written account
  (never committed, so nothing to `git log` for), confirmed the rebuild
  reproduces S64's win/loss pattern exactly, then traced seed1's new loss to
  the precise frame it diverges from baseline.** Finding: at that frame, the
  wall-aware fence correctly eliminates the one dishonest "cheap" candidate
  (retreating into the wall) and leaves three genuinely walkable options that
  score IDENTICALLY under `evade`'s own `moveCost` arithmetic. The existing
  keep-based tie-break (shared by every boss fight in the game) picks the
  same direction the UNFIXED freeze eventually stumbles into on its own,
  just ~70 frames sooner — and that timing shift alone, not a wrong choice,
  is what reshuffles the rest of the fight. **There was no ranking defect to
  fix.** The only remaining lever is `evade`'s shared cost/tie-break function
  itself, which is not boss-scoped and would need the full 36-seed
  zero-regression bar (task 2 below), not a fifth movement-layer variant.

**Do not re-attempt a `dBoss`/`fence`/`evade` fix for this specific freeze
again.** `docs/prompts/LEDGER.md`'s "Measured and rejected" section has the
full four-attempt account with the reasoning for each rejection — read it
before proposing anything that touches this code path.

## Task: your choice, in priority order

**1. (Recommended if you want to keep pushing on D6) Attack the freeze from
`bosses.js` instead of `actor-runtime.mjs`.** S65's finding means the
premise — a wall-locked retreat exists at all during Nereth's phase-1 tell —
is the thing to remove, not the movement code that reacts to it once it
exists. Not attempted in any of S61-S65; a genuinely different angle, not a
fifth variant of the same idea.

1. Read `docs/NEXT-SESSION.md` S61-S65 in full first (S65 especially — it has
   the exact frame trace and the corner's approximate location).
2. Find the actual room/tile data for Nereth's boss room (`'1,3,1'` per S62's
   own trace) and the corner geometry that traps the retreat. Consider
   whether the corner can be widened, the phase-1 trident's own timing
   shifted so its windUp doesn't line up with a moment the player is likely
   to be cornered, or the retreat target computed with the corner in mind
   at the AI level (`nereth`'s own `ai(e, g)` in `src/data/bosses.js`) rather
   than reactively in `dBoss`.
3. Zero tolerance for turning any currently-winning seed into a loss, same
   bar as every other boss fix in this project. Validate the full 6-seed
   sweep, D1 first (even though this change should not touch D1 at all —
   confirm that, don't assume it).
4. If this also fails, D6 has now had five serious, well-documented attempts
   across two entirely different subsystems. That is a strong signal to
   accept D6 at 1/6 and move on — not a reason to try a sixth.

**2. (The bigger, riskier lever, unrelated to D6 specifically) Teach `evade`
to dodge a telegraphed spread/ring attack better.** This is the general
shared-cost-function change S65's own finding points at as the only
remaining lever for D6's specific seed-trade, but it is NOT scoped to D6 —
it changes every boss fight in the game. Only worth it now with S61's own
caveat in mind: even a perfect version of this does NOT fix D3 on its own
(S61 found D3's losses are a roughly even three-way split across projectile,
`gel`-chase, and direct-contact damage — two of the three untouched by any
dodge-quality improvement). If you pick this up:

1. Read the full comment block above `evade()` in `tools/actor-runtime.mjs`
   first — it documents the 36-seed methodology, why `SHOT_HORIZON` is 30
   and not more, and exactly which past attempts cost which bosses.
2. Budget a FULL session for this alone, with the 36-seed validation bar
   (`--seed=N` for N=1..36, both with and without the change) — a 6-seed
   sample is not enough to trust here; S45's own single-seed "D3 clearly
   fair" claim is the cautionary tale for why.
3. Zero tolerance for turning any currently-winning seed into a loss, on
   ANY of the six dungeons — that is the bar every fix in this area has
   been held to since S52, and S64/S65's own D6 finding is a fresh, very
   concrete example of how a change that "fixes" one seed can cost another
   through pure timing, not through being wrong.

**3. (Untouched by this whole thread) Trace D2.** S59's original "shared
cause" framing rested on D2/D3/D6 together; S61 traced D3 and D6 separately
and found two different mechanisms for each. **Nobody has ever traced D2's
own losing seeds the same rigorous way** — it may be a third mechanism
again, or it may turn out to share one of D3's or D6's causes for real this
time. Do this before assuming any fix elsewhere touches D2 at all.

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
- **Do not re-attempt any of the four rejected D6 wall-retreat shapes at the
  `actor-runtime.mjs` movement layer** — S62's ungated per-frame override,
  S63's gated-but-pre-chosen-direction version, S64's unified-fence version,
  or S65's confirming rebuild of S64. All four are documented in
  `docs/prompts/LEDGER.md`'s "Measured and rejected" section with the exact
  reason each failed. S65 specifically found there is no ranking tweak
  inside this approach that fixes seed1 without risking seed3 or another
  seed — the seed-trade is a structural property of removing the freeze at
  this layer, not an implementation bug. If D6 is revisited, do it from
  `bosses.js` (task 1 above), not `actor-runtime.mjs`.
- **Do not treat a "net aggregate unchanged" result as safe.** S64's fix
  kept D6 at 1 of 6 winning in aggregate — it just moved WHICH seed wins.
  This project's own bar is per-seed, not aggregate: trading any winning
  seed for a loss fails regardless of what else the same change fixes.
- **Routing D3 onward** (needs the Coastwise Chain first) remains untouched.

## Habits worth carrying in

- **Trace before diagnosing, every time — including re-tracing a PRIOR
  session's diagnosis before building on it.** S61's whole contribution was
  re-tracing S59's "shared cause" claim rather than accepting it, and found
  it didn't hold for either dungeon checked, in two different ways. Every
  session in this thread (S57-S65) found a mechanism at least somewhat
  different from what the session before it expected going in.
- **A rebuilt fix needs its own reproduction check before you trust it's the
  same fix.** S65 rebuilt S64's fix from a written account (nothing was ever
  committed) and confirmed the win/loss PATTERN matched before trusting the
  rebuild enough to trace further — exact frame counts on unchanged seeds
  differed from S64's own table, which is expected (any behavior change here
  cascades downstream even on seeds whose outcome doesn't flip) and would
  have been easy to misread as "this isn't the same fix" without checking
  the win/loss pattern specifically.
- **"The fix causes a regression" and "the fix is broken" are different
  claims — trace which one is true before writing a fifth variant.** S65's
  whole finding is that S64's fix was not broken: at the exact frame it
  diverges, it made the only defensible choice available, and the resulting
  seed-trade is a consequence of timing, not of a wrong decision. A fix that
  works correctly and still costs a seed through pure downstream cascade is
  a different problem than a fix with a bug in it, and calls for a different
  next step (stop, or change the shared cost function deliberately) than
  patching the same code again.
- **Two systems independently deciding the same thing is itself a bug
  shape worth naming, not just working around.** S63's fix and `evade`'s
  own candidate search each computed "which direction is safe" separately,
  and `evade` — going second, with no idea the first system existed —
  silently won. The fix wasn't to make the first system's answer stronger;
  it was to make it feed the SAME decision point (`fence`) the second
  system already deferred to, so there was only ever one search instead of
  two overriding each other. When a new check keeps getting silently
  undone by existing logic downstream, look for whether that downstream
  logic has its own filtering hook to plug into, before assuming the new
  check just needs to be more forceful.
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
