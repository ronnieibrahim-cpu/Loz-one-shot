# Next session — Oracle of Tides

Repo `ronnieibrahim-cpu/Loz-one-shot`. Branch from the CURRENT tip of `main` —
`git log -1 origin/main` for the real commit. One prompt = one session = one
branch. Do not open a pull request unless asked. Before starting, run
`git ls-remote --heads origin` and skim for anything boss/evade-related dated
AFTER this file's own session (check the branch's own commit date, not just
its name) — S61 found one branch that looked relevant and was a week stale;
don't repeat that check by hand if a fresher one already did it, but don't
skip it either.

## The honest state of the roster (read `docs/NEXT-SESSION.md` S61, then S59, in full first)

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
- **D6 (Nereth):** found something more specific and more promising than a
  dodge-tuning gap. Every one of the 6 standard seeds, WINS INCLUDED, eats
  an identical opening tax — three `isProjectile` hits, 3 qh each (9 of 32,
  28% of the whole fight), at the same three frames, same distance, every
  single time, because nothing about it involves RNG (it's Nereth's
  deterministic phase-1 trident spread). A direct position trace found WHY
  it's identical every seed: **the player sits completely stationary for
  220+ consecutive frames while the boss also sits stationary, exactly the
  logged hit distance apart, with zero evasive movement across three full
  attack cycles** — even though `dBoss` DOES issue a retreat directive in
  this state (`tools/actor-runtime.mjs`'s "shelled: wait out the tell"
  branch, ~line 1541). The retreat is being filed and going nowhere. Two
  candidate mechanisms, NOT yet distinguished: `fence` zeroing the retreat
  vector against a wall before `evade` ever runs (per `safe`'s own
  `evade(g, fence(m), ...)`), or `evade`'s cost comparison finding no
  candidate direction better than standing still until the shot is too
  close to react to. **This is likely a narrower, lower-risk bug than "fix
  evade's general dodge logic"** — it may live entirely in one `dBoss`
  branch or one `fence` check at one specific equilibrium point, not in
  `SHOT_HORIZON`/`moveCost`, the shared function every boss fight runs
  through.
- **D2 was not traced this session.** Don't assume it matches either shape
  above without checking — S59's "one shared cause" framing already turned
  out to average over two different mechanisms once two of its three
  dungeons were actually looked at separately.

Full account, including the exact damage-log tables and the position trace,
in `docs/NEXT-SESSION.md` S61. S59's own entry (still worth reading for the
rejected `breakDeadlock`-on-Nereth experiment) is now superseded on the
"shared cause" claim specifically — everything else in it stands.

## Task: your choice, in priority order

**1. (Recommended, better-scoped than before) Finish diagnosing D6's freeze,
then fix it if the diagnosis supports a narrow fix.** This is the most
promising lead in this thread precisely because it may NOT require touching
`evade`/`hazards()`'s shared cost function at all:

1. Trace frames 690-700 of a D6 fight (default seed, boss room `1,3,1`) at
   PER-FRAME resolution (not every 20 like S61's pass) — log the exact
   directive `dBoss` computes before `fence`, `fence`'s output, and (adding
   temporary instrumentation to `evade` itself, or reasoning from its
   candidate loop) each of the 8 candidates' `moveCost` at that instant.
   Confirm which of the two mechanisms S61 named is the real one — do not
   guess.
2. If it's a `fence`-vs-wall problem: the fix is almost certainly scoped to
   `dBoss`'s own retreat-target choice (e.g., picking a retreat vector that
   isn't fenced out at that position, or recognizing the equilibrium and
   choosing a different waiting spot) — LOW risk to the shared `evade()`
   path other bosses use, but still validate the full 6-seed sweep on ALL
   SIX dungeons before shipping, per the zero-regression bar below.
3. If it's an `evade`-cost problem: this converges with option 2 below and
   inherits its full risk profile and validation bar — do not shortcut the
   36-seed sweep just because the D6-specific trace was narrow.
4. Either way, re-verify D3 and D6's per-seed damage-source breakdowns
   AFTER the fix (not just win/loss counts) — S61's tables are the
   before-picture; confirm the fix actually changes the mechanism it claims
   to, not just the aggregate score by coincidence.

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
- **Routing D3 onward** (needs the Coastwise Chain first) remains untouched.

## Habits worth carrying in

- **Trace before diagnosing, every time — including re-tracing a PRIOR
  session's diagnosis before building on it.** S61's whole contribution was
  re-tracing S59's "shared cause" claim rather than accepting it, and found
  it didn't hold for either dungeon checked, in two different ways. Every
  session in this thread (S57, S58, S59, S61) found a mechanism at least
  somewhat different from what the session before it expected going in.
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
