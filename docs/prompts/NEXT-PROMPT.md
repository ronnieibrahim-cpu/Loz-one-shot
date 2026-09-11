# Next session — Oracle of Tides

Repo `ronnieibrahim-cpu/Loz-one-shot`. Branch from the CURRENT tip of `main` —
`git log -1 origin/main` for the real commit. One prompt = one session = one
branch. Do not open a pull request unless asked. Before starting, run
`git ls-remote --heads origin` and skim for anything boss/evade-related dated
AFTER this file's own session (check the branch's own commit date, not just
its name) — S61 found one branch that looked relevant and was a week stale;
don't repeat that check by hand if a fresher one already did it, but don't
skip it either.

## The honest state of the roster (read `docs/NEXT-SESSION.md` S62, then S61, then S59, in full first)

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
- **D6 (Nereth): mechanism now CONFIRMED (S62), one fix shape already tried
  and rejected.** Every one of the 6 standard seeds, WINS INCLUDED, eats an
  identical opening tax — three `isProjectile` hits, 3 qh each (9 of 32,
  28% of the whole fight), at the same three frames, same distance, every
  single time, because nothing about it involves RNG (it's Nereth's
  deterministic phase-1 trident spread). S61 found the player frozen
  stationary for 220+ frames while it happens; S62's per-frame trace
  (temporary instrumentation on a scratch copy of `actor-runtime.mjs`, not
  committed) found WHY: it is neither of the two mechanisms S61 left open.
  **The retreat direction is computed once from pure geometry ("away from
  the boss") and is never checked against real wall collision before being
  committed to.** `fence` doesn't catch it (it only guards the room's four
  OUTER edges via a pixel margin off `room.pw`/`room.ph`, and the player
  was one pixel inside that margin — the real wall it's pinned against is
  an INTERIOR one `fence` has no way to see). `evade` doesn't catch it
  either (its hazard list is empty until the boss's own attack windup
  fires, so its early-return hands the blocked direction through
  unexamined for the entire wait). Confirmed against the real room grid
  (`src/data/dungeons-b.js`, room `'1,3,1'`): the player's hitbox sits
  flush against a real wall the whole freeze.
  **S62 tried the direct fix — a `canOccupy`-based check (the engine's own
  function, never re-derived) on the retreat direction, falling back to a
  single axis when the diagonal is blocked — and it was a clear regression,
  reverted in full:** D1's default seed, a rock-solid 6/6 for this entire
  thread, flipped to PLAYER DIED; D6 got uniformly WORSE (all 6 seeds
  converged to an identical, faster loss). **Do not re-attempt this exact
  shape** (a per-frame geometric override with no accumulated-evidence
  gate) — S62's own account gives the likely reason (a short lookahead
  reads as "blocked" near ordinary room corners far more often than the one
  genuine dead-end it targeted, substituting a worse retreat on completely
  normal frames) and a concretely different shape to try instead: gate the
  same `canOccupy` check behind an ACCUMULATED STALL counter (the same
  `stuckFrames`/`stallFrames` shape `breakDeadlock` already uses safely in
  this exact file, S57/S58) rather than re-checking geometry every single
  frame regardless of whether anything is actually wrong. This is still
  likely a narrower, lower-risk bug than "fix evade's general dodge logic"
  — it lives in one `dBoss` branch, not `SHOT_HORIZON`/`moveCost` — but S62
  proved it is not a free, obvious fix either.
- **D2 was not traced this session.** Don't assume it matches either shape
  above without checking — S59's "one shared cause" framing already turned
  out to average over two different mechanisms once two of its three
  dungeons were actually looked at separately.

Full account, including the exact damage-log tables and the position trace,
in `docs/NEXT-SESSION.md` S61. S59's own entry (still worth reading for the
rejected `breakDeadlock`-on-Nereth experiment) is now superseded on the
"shared cause" claim specifically — everything else in it stands.

## Task: your choice, in priority order

**1. (Recommended, better-scoped than before) Fix D6's freeze using the
accumulated-stall shape, not the per-frame geometric override S62 already
ruled out.** The diagnosis is DONE (S62) — do not re-trace it. The one
thing S62 didn't do is ship a working fix:

1. Read `docs/NEXT-SESSION.md` S62 in full before writing any code — it
   names the exact mechanism, the exact fix shape already tried, and the
   exact reason (best guess, not fully re-verified) that shape regressed
   D1. Re-deriving any of this by re-tracing is wasted effort the diagnosis
   already paid for.
2. Implement the retreat-direction `canOccupy` check (same as S62's) but
   GATED behind an accumulated-stall counter scoped to the "shelled: wait
   out the tell" branch specifically — only override the geometric retreat
   once the player's position has gone ~30 frames without changing while
   shelled, mirroring `breakDeadlock`'s own `stuckFrames` shape exactly
   (same file, same verb, already proven safe across D1-D6 twice, S57/S58).
   Do not invent a new gating shape — reuse that one's constants and logic
   pattern unless you have a specific, measured reason not to.
3. Validate the FULL six-dungeon, 6-seed sweep before trusting anything —
   S62's fix looked locally reasonable and broke a dungeon it had no
   business touching. Check D1 specifically first (fastest way to catch
   the same class of regression S62 hit), then the rest.
4. Re-verify D3 and D6's per-seed damage-source breakdowns AFTER the fix
   (not just win/loss counts) — S61's tables are the before-picture;
   confirm the fix actually changes the mechanism it claims to, not just
   the aggregate score by coincidence.
5. If the accumulated-stall version ALSO regresses something: stop, revert,
   document precisely why (per-seed numbers, which dungeon, which frame),
   and hand it off rather than trying a third variant in the same session
   — two rejected shapes in one sitting is a sign the branch itself needs
   fresh eyes, not a third guess under time pressure.

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
- **Do not re-attempt a per-frame, ungated `canOccupy` override on D6's
  "shelled: wait out the tell" retreat direction.** S62 tried exactly this
  and it flipped D1's default seed from a clean win to a loss while making
  D6 uniformly worse. The accumulated-stall version (task 1 above) is a
  different, not-yet-tried shape — this line rules out only the ungated one.
- **Routing D3 onward** (needs the Coastwise Chain first) remains untouched.

## Habits worth carrying in

- **Trace before diagnosing, every time — including re-tracing a PRIOR
  session's diagnosis before building on it.** S61's whole contribution was
  re-tracing S59's "shared cause" claim rather than accepting it, and found
  it didn't hold for either dungeon checked, in two different ways. Every
  session in this thread (S57, S58, S59, S61, S62) found a mechanism at
  least somewhat different from what the session before it expected going
  in.
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
