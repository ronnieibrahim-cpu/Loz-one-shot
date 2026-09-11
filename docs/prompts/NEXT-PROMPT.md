# Next session — Oracle of Tides

Repo `ronnieibrahim-cpu/Loz-one-shot`. Branch from the CURRENT tip of `main` —
`git log -1 origin/main` for the real commit. One prompt = one session = one
branch. Do not open a pull request unless asked. Before starting, run
`git ls-remote --heads origin` and skim for anything boss/evade-related dated
AFTER this file's own session (check the branch's own commit date, not just
its name) — S61 found one branch that looked relevant and was a week stale;
don't repeat that check by hand if a fresher one already did it, but don't
skip it either.

## The honest state of the roster (read `docs/NEXT-SESSION.md` S64, then S63, then S62, then S61, then S59, in full first)

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
- **D6 (Nereth): the wall-freeze mechanism is FULLY SOLVED (S62-S64) —
  a correctly-shaped fix now exists and genuinely changes the fight, but
  it trades one winning seed for a different one, so it is STILL not
  shippable. What's left is a narrower, different kind of question.**
  Every one of the 6 standard seeds, WINS INCLUDED, eats an identical
  opening tax — three `isProjectile` hits, 3 qh each (9 of 32, 28% of the
  whole fight) — because nothing about it involves RNG (it's Nereth's
  deterministic phase-1 trident spread). S61 found the player frozen
  stationary for 220+ frames while it happens. S62 found why: the retreat
  direction is computed once from pure geometry and never checked against
  real wall collision — S62's own fix (ungated) regressed D1. S63 built
  the safe, opt-in, accumulated-stall-gated version — zero regression, but
  measured completely INERT. **S64 found out why it was inert, and fixed
  that specific problem: `evade`'s own hazard-cost search has zero concept
  of walls, so once a real hazard (the trident shot) exists, `evade` can
  freely swap BACK onto the wall-blocked direction S63's fix had correctly
  avoided, because from `evade`'s point of view that direction dodges the
  shot better and it has no idea it's a wall.** Confirmed with a direct,
  frame-by-frame trace of the REAL applied input mask (not just the
  yielded value): S63's fix genuinely selected "up" in time, but the real
  mask flips back to the wall-blocked direction the instant a hazard
  exists, then the hit lands anyway. S64 also ruled out S63's own leading
  hypothesis (another solid entity in the room) directly — `Entity.solid`
  is never set on any enemy or boss in this codebase, only on push-block/
  chest/torch/signpost objects, and Nereth's room has none — and proved
  the room geometry itself is NOT the blocker via a completely independent
  test (calling `Entity.moveEntity` directly on a warped player, bypassing
  `dBoss` entirely: 40 free 1px steps, zero blocked).
  **S64's actual fix: fold the wall check into `fence` itself** (still
  behind the same opt-in flag and the same accumulated-stall gate as S63)
  rather than pre-choosing a direction and fighting `evade` from outside
  it — since `evade`'s own candidate search already calls `fence` to
  filter every option, hazard search included, this makes wall-awareness
  and hazard-awareness ONE decision instead of two overriding each other.
  **Measured: D1 still byte-identical (the opt-in gate works exactly as
  designed) and D6 genuinely changes for the first time in this entire
  thread — seed3 flips a loss to a clean win. But seed1 flips a CLEAN WIN
  to a loss.** Net aggregate unchanged (still 1 of 6 winning, just a
  different seed) — which is exactly why this project measures PER-SEED
  outcomes, not aggregates: an aggregate-only read would call this a wash
  and might ship it. Per this project's own standing rule (S52 onward,
  and S59's own rejected Nereth experiment the same shape), turning any
  currently-winning seed into a loss is disqualifying regardless of what
  else improves. **Reverted in full.**
  **The wall-awareness problem itself is now SOLVED and should not be
  re-investigated** — S64's unified-fence approach is very likely the
  right SHAPE (it demonstrably stopped the two systems fighting, and
  found a real, better answer for seed3). What's left is a DIFFERENT,
  finer-grained question: among several directions that are ALL wall-real
  and ALL hazard-clearing, does `evade`'s own cost function rank them the
  way a player actually would? Seed1's newly-introduced loss is the thing
  to trace — not the freeze, which is already understood.
- **D2 was not traced this session (or any prior one in this thread).**
  Don't assume it matches D3's or D6's shape without checking — S59's "one
  shared cause" framing already turned out to average over two different
  mechanisms once two of its three dungeons were actually looked at
  separately.

Full account, including the exact damage-log tables, the position traces,
the fixed-point accumulator measurement, and S64's own per-seed before/
after table, in `docs/NEXT-SESSION.md` S61 through S64 — read all four, in
order; each is the direct, narrower continuation of the one before it, not
a restart. S59's own entry (still worth reading for the rejected
`breakDeadlock`-on-Nereth experiment) is now superseded on the "shared
cause" claim specifically — everything else in it stands.

## Task: your choice, in priority order

**1. (Recommended) Trace WHY seed1 newly loses under S64's unified-fence
fix, then decide whether `evade`'s cost function needs a small, targeted
change or whether this specific approach has hit a real ceiling.** The
wall-awareness problem is SOLVED — do not re-diagnose the freeze, and do
not re-attempt S62's or S63's rejected shapes. S64's fix is not committed
to git (reverted in the same session it was built, per this project's own
standard for a result that fails validation) — rebuild it from this file's
and S64's own account before tracing; it's a small, precisely-described
diff (a `stuckRetreat` boss-spec flag plus a wall-aware `fence` in
`dBoss`), not a large reconstruction.

1. Read `docs/NEXT-SESSION.md` S61 through S64 in full before writing any
   code. Each is the direct continuation of the one before it; skipping
   one means re-deriving work that is already paid for.
2. Rebuild S64's unified-fence fix exactly as described (opt-in
   `nereth.spec.stuckRetreat`, `fence` rejecting any bit that fails
   `canOccupy` once `retreatStuckFrames > 30`, no separate pre-chosen
   direction). Confirm you reproduce S64's own measured table first
   (seed1 W->L, seed3 L->W, others unchanged) before changing anything —
   if your rebuild doesn't match, you've built something different, not
   the same fix.
3. Trace seed1's fight the same rigorous way S62-S64 traced the freeze:
   at the exact frame the newly-introduced loss diverges from baseline,
   what direction did the wall-aware `fence`+`evade` combination choose,
   what was its hazard cost, and was a DIFFERENT wall-real candidate
   available with a worse cost score but a better real outcome? This is
   the same class of question S59's own `evade` comment block already
   answers for the GENERAL case (`SHOT_HORIZON`'s own tuning history) —
   read that comment block too, since this may turn out to be a specific
   instance of the same known trade-off rather than a new one.
4. If the ranking problem has a narrow, boss-scoped answer (e.g., a small
   adjustment to how `moveCost` weights a candidate that's wall-blocked
   vs. one that isn't, scoped to when `stuckRetreat` applies): try it,
   and validate the FULL six-dungeon 6-seed sweep, D1 first.
5. If it does NOT have a narrow answer — if fixing seed1 costs seed3 again,
   or any other seed — stop. This is the FOURTH attempt at this specific
   D6 mechanism across three sessions (S62 ungated, S63 gated-but-inert,
   S64 unified-but-trades-seeds), all rejected. A fourth rejection in a
   row on the same boss is a real signal to leave D6's `evade` interaction
   alone entirely and either accept D6 at its current 1/6 or reconsider
   whether the fix belongs in `bosses.js` (e.g., a room/AI change to
   Nereth's own arena or phase-1 behavior, avoiding the actor-runtime
   entirely) rather than a fifth variant of the same movement-layer idea.
6. Whichever way it resolves, write up the per-seed damage-source
   breakdown AFTER any change (not just win/loss counts), the same way
   S61's tables serve as this thread's before-picture.

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
  a separately pre-chosen 8-direction search, handed to `evade` as its base
  directive) unchanged, expecting a different result.** Confirmed
  zero-regression but also confirmed INERT — `evade`'s own hazard-cost
  search silently overrides the pre-chosen direction back onto the wall
  the instant a real hazard exists, because `evade` has no concept of
  walls at all. S64 found and fixed this specific problem (fold the wall
  check into `fence` itself instead) — do not rebuild S63's shape again.
- **Do not re-attempt S64's unified-fence fix UNCHANGED, expecting it to
  suddenly pass.** It is the right SHAPE (wall-awareness folded into
  `fence`, so `evade`'s hazard search respects it automatically) and it
  measurably helps seed3 — but it also flips seed1 from a clean win to a
  loss, which is disqualifying on its own. Re-shipping it exactly as S64
  built it will reproduce that exact regression. The next step is tracing
  seed1's specific new loss (task 1 above), not re-running the same code.
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
  session in this thread (S57, S58, S59, S61, S62, S63, S64) found a
  mechanism at least somewhat different from what the session before it
  expected going in.
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
