# Next session — Oracle of Tides

Repo `ronnieibrahim-cpu/Loz-one-shot`. Branch from the CURRENT tip of `main` —
`git log -1 origin/main` for the real commit. One prompt = one session = one
branch. Do not open a pull request unless asked.

## Task: find out how big the `hazards()` velocity fix's ripple really is, and either land it properly or make a final call to scope it differently

S54 tried a real, well-motivated fix — `evade()`'s own long comment in
`tools/actor-runtime.mjs` (above `hazards()`) had already named it as a
known gap, and S52 separately traced D5 seed 3's loss to the exact same
shape. **Read `docs/NEXT-SESSION.md`'s S54 entry in full before starting
anything below** — it has the fix's exact code, what it measured, and why
it was reverted. The short version: `hazards()` treats every non-projectile
enemy (a summoned `gel`, `zol`, etc.) as standing still, when some of them
(`gel`: `chase(e, g, { speed: 0.42 })`, constant speed, no tell) are
actually walking straight at the player. Giving it a real one-frame
velocity estimate fixes the named bug outright (D5 seed 3: a losing
24-hit `gel`-contact loop becomes a clean 8-hit win) — but it also
**breaks `check-playthrough.mjs` outright** (`boss: nothing to fight in
d2 0,4,5`), because `hazards()` is used by ordinary room combat
(`dFight`/`dGoto`) all along the scripted route in `tools/
playthrough-route.mjs`, not just inside boss fights, and that route's
`wait` constants are tuned to exact frame counts the fix perturbs.

**This session's job is not to re-derive the fix — reuse it from S54's
entry — it is to find out exactly how big the damage is, and only then
decide whether landing it this session is realistic.**

## What to do, in order

1. Read `docs/NEXT-SESSION.md` S54 in full. Re-apply the fix exactly as
   described there (the `WeakMap<Entity, {x,y,frame}>` in `hazards()`) so
   you are starting from the same place S54 left off, not re-deriving it.
2. **Find the FIRST point the route diverges**, not just where it finally
   throws. `check-playthrough.mjs` errors out in D2, but the drift that
   causes it may start much earlier — anywhere a hazard is on screen
   during D1 or the overworld leg between the two dungeons. Instrument
   `tools/playthrough-route.mjs`'s own step log (or add temporary,
   uncommitted logging to `runPlan`/the route driver) to compare frame
   counts step-by-step against a run WITHOUT the fix, and find the exact
   step where they first differ. This is the same method S47 used to find
   `dTravel`'s gap — trace it, don't guess it.
3. **From that single finding, decide which of these two shapes you're in:**
   - **A small number of drifted `wait`/timing constants** (the S47/S48
     shape: one or two fights whose entry frame moved) — in which case,
     re-measure each one exactly the way S47/S48 re-swept Anemos's `wait`
     (a stable band search, not a single lucky number), land the fix, and
     validate per the bar below.
   - **A large, compounding drift through many rooms** — in which case,
     landing the fix this session is not realistic, and the honest move is
     to document precisely how far the drift reaches and by how much
     (which rooms, how many frames), so a future session knows whether a
     full route re-sweep is worth budgeting for at all, and update
     `docs/prompts/LEDGER.md`'s S54 entry (`## Measured and rejected`)
     with this new finding rather than re-describing the same attempt.
4. **If you land it:** the standard validation bar from CLAUDE.md's own
   table for any `dBoss`/`evade`/`hazards` change — `measure-boss-combat.mjs`
   on all six dungeons (a seed sweep on D5 in particular, since S54 found
   its net trade to be a wash at the default sweep: 3/6 winning vs. 4/6
   before), `check-bosses.mjs`, `check-playthrough.mjs`, `replay.mjs`,
   `test.mjs`. D5's own net win/loss trade-off (does fixing seed 3's loop
   justify seed 4 and seed 5 flipping to losses?) is a real judgement call
   to make and write down, not something the numbers answer by themselves.

## Done means

- Either: the fix landed, with the route re-swept and validated per the
  bar above, and `docs/prompts/LEDGER.md`'s S54 entry rewritten (not left
  contradicting the new landed state).
- Or: a precise account of how far the drift actually reaches — not just
  "it's too big," but which step it starts at and roughly how many rooms
  or frames it touches — appended to `docs/NEXT-SESSION.md` as a new
  entry, with `docs/prompts/LEDGER.md`'s `## Measured and rejected` entry
  updated to reflect the more precise finding. A measurement plus a
  judgement is an acceptable outcome; leaving the fix half-applied or
  guessing at the ripple's size is not.
- `docs/NEXT-SESSION.md` updated losslessly (new entry, do not renumber or
  edit past ones).
- `npm run build` re-run; commit `dist/oracle-of-tides.html` only if
  `src/` changed (this fix so far lives entirely in `tools/`, so unless
  the resweep also touches `src/data/bosses.js` or similar, the build
  should not change — confirm rather than assume).

## Explicit out of scope

- **Do not re-derive the fix from scratch or re-run the same diagnosis
  S52/S54 already did.** Both are written up in full; start from them.
- **Routing D3 onward** (needs the Coastwise Chain first — a much larger,
  separate task, unrelated to this one) and **Nereth's D6 `tideEscape`**
  (S53, already landed and correctly inert — do not re-touch it) are both
  untouched by this task.
- **Rootmaw's (D5) `tideEscape`/`safeWhenOpen` fields** (S52) are landed;
  this task's fix, if landed, sits alongside them in the shared
  `hazards()`/`evade()` machinery, not inside `bosses.js`.

## Habits worth carrying in

- **A fix that is correct in isolation can still be wrong to land.** S54's
  code is right — it does exactly what it says — and it was still reverted,
  because the thing it broke (`check-playthrough.mjs`) matters more than
  the thing it fixed. Measuring the fix's own target is not enough; measure
  everything downstream of the function you changed.
- **`hazards()`/`evade()` is load-bearing for the WHOLE actor harness**, not
  just boss fights — `dFight` and `dGoto` both call it, and the scripted
  route's timing depends on both. Any change here needs the full
  `check-playthrough.mjs` run, every time, not just a boss-fight sweep.
- **Find the drift's origin before estimating its size.** Guessing "this is
  probably too big to fix" without tracing where it starts is exactly the
  kind of guess this project's own rules warn against.
