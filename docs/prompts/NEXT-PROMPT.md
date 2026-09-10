# Next session — Oracle of Tides

Repo `ronnieibrahim-cpu/Loz-one-shot`. Branch from the CURRENT tip of `main` —
`git log -1 origin/main` for the real commit. One prompt = one session = one
branch. Do not open a pull request unless asked.

## The honest state of the roster (read `docs/NEXT-SESSION.md` S59 in full first)

Standard 6-seed sample, `tools/measure-boss-combat.mjs <d> --seed=N`, in-order
health, no god mode:

```
     d1    d2    d3    d4    d5    d6
     6/6   3/6   1/6   6/6   6/6   1/6
```

D1, D4, D5 are robust. D2 is a real coin-flip. **D3 and D6 are the weak
points**, and S59 diagnosed WHY, precisely: it is one shared cause, not three
separate bugs — `evade` (`tools/actor-runtime.mjs`) does not reliably dodge
multi-shot spread/ring attacks over a long fight, and every losing fight in
D2/D3/D6 dies overwhelmingly to `isProjectile:true` chip damage. This is not
a new finding — `evade`'s own 36-seed comment block already measured this
(D3 a deliberate, accepted regression from adding shot-dodging at all; D2/D6
statistically unmoved by it) — S59 just confirmed it is STILL the live cause
after every boss-scoped spec-field fix since.

**S59 also tried and rejected one boss-scoped fix on D6** (giving Nereth
`rootmaw.spec.breakDeadlock` directly): net negative, one win gained, one
lost, reverted. Read that entry before trying anything similar — the reason
it failed is instructive (Nereth actively chases in his final phase; Rootmaw,
the boss the fix was built for, never moves).

## Task: your choice — the shared evade-dodge gap, or the next item on the project's own backlog

**If you want to move D2/D3/D6's numbers for real, the lever is teaching
`evade` to actually dodge a telegraphed spread/ring attack** — a genuinely
new capability, not a reuse of `breakDeadlock`/`noContact`/`tideEscape`'s
existing shapes. This is explicitly a BIG, risky, shared-machinery change:
four-plus sessions (S54-S59) have all found touching `hazards()`/`evade()`
expensive, and this one touches the core swap-cost function every single
boss fight and the whole `check-playthrough.mjs` route runs through. Do NOT
attempt this as a quick addendum to something else. If you pick it up:

1. Read the full comment block above `evade()` in `tools/actor-runtime.mjs`
   first — it already documents the 36-seed methodology, why `SHOT_HORIZON`
   is 30 and not more, and exactly which past attempts cost which bosses.
2. Trace a losing D3 or D6 fight the same way S57/S58/S59 all did (log
   positions every 5-20 frames) and confirm the SPECIFIC failure mode before
   designing anything — is the actor picking a bad swap direction against a
   spread it CAN see coming, or is it a detection gap (the shot isn't in
   `hazards()`'s list yet when the decision is made, a windUp-timing issue)?
   Guessing the mechanism and reusing an old idea is exactly the mistake
   S54 made and S59 just repeated in miniature.
3. Budget a FULL session for this alone, with the 36-seed validation bar
   (`--seed=N` for N=1..36, both with and without the change) — a 6-seed
   sample is not enough to trust here; S45's own single-seed "D3 clearly
   fair" claim is the cautionary tale for why.
4. Zero tolerance for turning any currently-winning seed into a loss, on
   ANY of the six dungeons — that is the bar every fix in this area has been
   held to since S52, and S59's own rejected experiment is a fresh example
   of how easily a boss-scoped-looking change can violate it anyway.

**If that's too large for one session** (it probably is), `docs/DUNGEON-
STATUS.md` and `docs/prompts/QUEUE.md` name several other independently-
scoped, ready-to-pick-up items (region-art systematic diffs, the narrower
`dTravel` gap, wide-room follow-ups, cross-dungeon item reuse, frame-stepped
`feel.js`). Pick whichever is best-scoped for a single session.

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
  changed — confirm rather than assume either way. (S57-S59 all landed
  entirely inside `tools/`, not `src/`, so none changed the shipped build. A
  fix to `hazards()`/`evade()` or any boss's own AI in `src/data/bosses.js`
  WOULD need a rebuild.)

## Explicit out of scope

- **Do not re-attempt `breakDeadlock` (or any boss-scoped opt-in flag proven
  for a stationary/corridor-bound boss) on a boss that actively chases the
  player without a materially different safety condition.** S59's Nereth
  experiment is the concrete example of why this fails.
- **Routing D3 onward** (needs the Coastwise Chain first) remains untouched.

## Habits worth carrying in

- **Trace before diagnosing, every time.** Every session in this thread
  (S57, S58, S59) found a mechanism at least somewhat different from what
  the session before it expected going in, including S59's own initial guess
  about Nereth.
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
