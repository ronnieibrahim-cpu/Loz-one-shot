# Next session — Oracle of Tides

Repo `ronnieibrahim-cpu/Loz-one-shot`. Branch from the CURRENT tip of `main` —
`git log -1 origin/main` for the real commit. One prompt = one session = one
branch. Do not open a pull request unless asked.

## Task: attempt the full `hazards()` velocity fix re-sweep now that S55 has mapped exactly where and how badly it drifts — or, if it does not converge, size it more precisely still and hand it off again rather than force a landing

S54 found a real, well-motivated fix for the D5 `gel`-loop and reverted it
because it broke `check-playthrough.mjs`. S55 (this session's predecessor)
did NOT re-derive or re-attempt the fix — it re-applied S54's exact code and
measured, step by step, exactly how far the resulting drift reaches. **Read
`docs/NEXT-SESSION.md`'s S55 entry in full before starting anything below —
it has the fix's exact code, the exact method used to trace the drift, and
the precise map of where it starts and how it grows.**

The short version: the fix is correct and small — a `WeakMap` in
`hazards()` (`tools/actor-runtime.mjs`) giving every non-projectile hazard a
real one-frame position-delta velocity instead of always `vx:0, vy:0`. It
fixes D5 seed 3's losing loop outright. But `hazards()` underlies ordinary
room combat (`dFight`/`dGoto`) everywhere a hazard is on screen, not just
boss fights, so it perturbs the scripted route's frame-exact timing almost
everywhere. S55 traced the FIRST divergence to route step 35 of 369 — D1's
very first ordinary fight, nowhere near a boss room — and found the drift
crosses two regimes: a deceptively stable −28-frame plateau for about 160
directives (D1's midgame through its boss fight and the Tidewatch Shop
purchase), then an unstable multi-thousand-frame swing (up to −5788 frames)
crossing the overworld into D2, ending in an actual state divergence at
D2's boss room (the boss isn't there).

**This session's job is to see whether that can actually be re-swept, now
that the map exists — not to re-discover the map.**

## What to do, in order

1. Read `docs/NEXT-SESSION.md` S55 (and S54, which it builds on) in full.
   Re-apply the fix exactly as described (same `WeakMap` code) so you start
   from the same place, not a re-derivation.
2. **Re-record the route with the fix permanently in place**, using the same
   iterative method S47/S48 used for their single-leg splice, but expect to
   apply it across most of the route rather than one leg: run
   `check-playthrough.mjs --trace` (or `--record` once it gets far enough),
   find the first place it throws or a `wait`/timing constant no longer
   lands where it needs to in `tools/playthrough-route.mjs`, re-derive that
   constant with a stable-band sweep (never a single lucky value — S47/S48's
   own method, and the trap CLAUDE.md's table already warns about: a
   knife-edge value that happens to pass once is not a fix), re-run, repeat.
3. **This is a genuinely open-ended task, and S55 already named the risk: a
   fixed constant upstream can shift when a later hazard is first sighted,
   which can shift ITS estimated velocity, which can shift the next
   constant.** Set yourself a real checkpoint partway through (for instance:
   is the route stable and green through the end of D1 and the overworld
   crossing, before starting on D2's own timing?). If progress stalls —
   constants that were just re-swept keep drifting again as later ones are
   fixed, rather than converging — **stop rather than force a landing**,
   per this project's own rule against guessing dressed as a fix. Document
   precisely where the re-sweep got to and why it stalled, the same honest
   way S55 documented the drift's size rather than guessing at it.
4. **If it converges and lands:** the full validation bar from CLAUDE.md's
   own table for any `dBoss`/`evade`/`hazards` change —
   `measure-boss-combat.mjs` on all six dungeons (a seed sweep on D5 in
   particular — S54 found its own net trade a wash at the default sweep,
   3/6 winning vs. 4/6 before; decide and write down whether that trade is
   worth taking now that D5 seed 3's loop is fixed for real), `check-bosses.mjs`,
   `check-playthrough.mjs`, `replay.mjs`, `test.mjs`.
5. **Either way**, `docs/prompts/LEDGER.md`'s "Giving `hazards()`... real
   velocity" entry (under "Measured and rejected", or moved to "Landed" if
   it lands) needs to reflect the final state — landed with a commit, or
   parked again with a sharper account of exactly how far the re-sweep got.

## Done means

- Either: the fix landed, the route re-recorded and fully validated per the
  bar above, `docs/prompts/LEDGER.md` updated to say it landed (moved out of
  "Measured and rejected"), and D5's net win/loss trade-off written down as
  a real judgement call, not left implicit.
- Or: the re-sweep was attempted, a real checkpoint was reached and the
  stall point is precisely described (which constants converged, which kept
  drifting, and why) — appended to `docs/NEXT-SESSION.md` as a new entry,
  with `docs/prompts/LEDGER.md` updated again rather than left describing
  S55's now-superseded sizing as the latest word.
- `docs/NEXT-SESSION.md` updated losslessly (new entry, do not renumber or
  edit past ones).
- `npm run build` re-run; commit `dist/oracle-of-tides.html` only if `src/`
  changed (the fix so far lives entirely in `tools/` — confirm rather than
  assume, the same way S55 did).

## Explicit out of scope

- **Do not re-derive the fix from scratch or re-run S55's step-by-step
  trace.** It is written up in full; start from its map.
- **Routing D3 onward** (needs the Coastwise Chain first) and **Nereth's D6
  `tideEscape`** (S53, landed and correctly inert) are both untouched by
  this task.
- **Rootmaw's (D5) `tideEscape`/`safeWhenOpen` fields** (S52) are landed and
  sit alongside this fix in the shared `hazards()`/`evade()` machinery, not
  inside `bosses.js` — do not re-touch them directly.

## Habits worth carrying in

- **S55 already paid for finding out where the drift starts and how big it
  gets — spend this session's budget on the re-sweep itself, not on
  re-measuring.**
- **A checkpoint that isn't converging is real information, not a failure to
  hide.** Stopping with a precise account of where the re-sweep stalled is
  a legitimate, valuable outcome — the same shape S54 and S55 both already
  used. Landing something that only passes `check-playthrough.mjs` by luck
  (a knife-edge `wait` value, the exact trap CLAUDE.md's own table warns
  about) is worse than not landing at all.
- **`hazards()`/`evade()` is load-bearing for the whole actor harness.**
  Every change needs the full `check-playthrough.mjs` run, not a boss-fight
  sweep alone — S55's own trace is proof of how far a change here reaches.
