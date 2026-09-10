# Next session — Oracle of Tides

Repo `ronnieibrahim-cpu/Loz-one-shot`. Branch from the CURRENT tip of `main` —
`git log -1 origin/main` for the real commit. One prompt = one session = one
branch. Do not open a pull request unless asked.

## Task: give Nereth (D6) the same conch-escape verb Rootmaw (D5) just got — generalized, since his pin target moves per phase

S52 diagnosed and fixed Rootmaw losing to the harness actor: his own
'drink' attack forces the tide to HIGH and, unlike every other shelled
boss, nothing reopens him from there except the player's conch — the actor
could not press it, so the fight was a one-way lock. The fix added two
spec fields to `rootmaw` in `src/data/bosses.js`, both read by `dBoss` in
`tools/actor-runtime.mjs`:

- `tideEscape: LOW` — once the boss has sat shut long enough, and the
  NEXT conch cycle (`Tide.cycle()` steps LOW->MID->HIGH->LOW by exactly
  one, never straight to a target) actually lands on `tideEscape`, press
  the conch.
- `safeWhenOpen: true` — needed once the lock stopped ending the fight
  early, because without it the actor retreats every time it takes a hit
  mid-approach (the `RETREAT_MARGIN`/invuln-1-to-20 branch) and Rootmaw
  never stops firing long enough for that retreat to be free, so the
  actor oscillated short of sword range indefinitely.

Measured: D5's seed sweep went from 0 of 6 winning to 4 of 6, zero
regression on the other five bosses. Full account, including the frame
traces that found the mechanism, is `docs/NEXT-SESSION.md`'s S52 entry —
**read it before starting anything below.** `docs/prompts/LEDGER.md`'s
"Landed" table has the same fix in one paragraph if you want the short
version first.

**This session's job is Nereth, not a repeat of Rootmaw's diagnosis.**
S52's own "still open" list named the gap directly: Nereth needs the same
idea, `tideEscape`, but a single constant does not fit him the way it fits
Rootmaw.

## Why a constant doesn't work for Nereth — read `nerethPin` before writing anything

`src/data/bosses.js`'s `nereth` entry pins the tide to a DIFFERENT level
per phase, each with its own call to the shared `nerethPin(e, g, level,
period)` helper:

- Phase 1 (`above: 0.75`): `nerethPin(e, g, MID, 300)`
- Phase 2 (`above: 0.50`): `nerethPin(e, g, HIGH, 280)`
- Phase 3 (`above: 0.25`): `nerethPin(e, g, LOW, 260)`
- Phase 4 (`above: 0.00`): no pin at all — he cycles the tide himself
  (`forceTide(e2, g2, (g2.tide.level + 1) % 3)` on a 200-frame timer) and
  already has `safeWhenOpen: true`, already exploited by the actor. Leave
  phase 4 alone.

Read `nerethPin` itself (search for the function, just above `nerethOpening`):
while `g.tide.level !== level` he is OPEN continuously (`open(e, g, 60)`
called every frame in that branch) and re-pins on his own `period`-frame
timer; while `g.tide.level === level` he is sealed and `closeTick` shuts
him once the open window decays. **This is the opposite shape from
Rootmaw**: Nereth is not in a one-way lock — his own re-pin timer and
`nerethOpening()` (an attack-triggered window independent of the pin,
already firing after every trident/ring/beam volley) are exactly the kind
of "independent of tide" backup channel S52's diagnosis found every OTHER
shelled boss has and Rootmaw alone lacked. **That is very likely why
Nereth already measures at 78 of 80 without any conch verb at all** — do
not expect this session's fix to produce the same dramatic swing Rootmaw's
did (0/6 seeds to 4/6). The honest goal is closing some or all of the
remaining 2 hp and/or the 32-quarter-heart cost, not proving the fight was
secretly unwinnable — it almost certainly was not.

**The target tide level itself is runtime state, not a constant.** Whatever
you build needs to read "what level is `nerethPin` currently trying to
hold me at," which changes with `e.phase` (or whichever phase index the
boss exposes) and is not written down anywhere today outside the literal
`MID`/`HIGH`/`LOW` arguments already passed at each phase's own call site.
Two shapes worth considering, neither prescribed:

1. Have `nerethPin` itself record its own `level` argument onto the entity
   (e.g. `e._pinLevel = level;` at the top of the function) each time it
   runs, and let `dBoss` read `b._pinLevel` when present. Cheapest, but it
   is boss INSTANCE state living outside `b.spec`, unlike every other
   `dBoss`-facing signal in this file (`safeWhenOpen`, `tideEscape`) which
   lives on the spec.
2. Let `tideEscape` on the spec be either a constant (Rootmaw, unchanged)
   OR a function of the boss entity (`tideEscape: (e) => ...`), evaluated
   by `dBoss` at the point of use. Keeps the boss-facing surface uniform
   (`b.spec.tideEscape`, whether-a-function-or-not) at the cost of
   `dBoss` needing a two-line dispatch. Nereth's function would need
   SOMETHING to read — which likely still means recording the current
   pin level onto the entity from inside `nerethPin`, same as option 1,
   just consumed differently.

Either way: the actor should press the conch to move the tide OFF whatever
level `nerethPin` is currently holding, not onto a fixed target — the
opposite sense from Rootmaw, where the whole point was reaching a specific
level (`LOW`). Read `SHUT_LOCK_FRAMES`, `shutFrames`, and the escape branch
`tideEscape` added to `dBoss`'s "Shelled: nothing to hit" section (search
`tideEscape` in `tools/actor-runtime.mjs`) before changing it — the
one-step-away check in there (`(g.tide.level + 1) % 3 === tideEscape`)
assumes a single target and will need to become "is not the current pin
level" for Nereth's case, which is a materially different condition, not
a copy-paste.

## What to build

1. Read `docs/NEXT-SESSION.md` S52 in full, then `nerethPin`/`nerethOpening`
   in `src/data/bosses.js` and the `tideEscape` block in `dBoss`
   (`tools/actor-runtime.mjs`) this session's own fix added.
2. Give `dBoss` a way to read Nereth's current pin level and press the
   conch to break it, reusing (not duplicating) the `shutFrames`/
   `SHUT_LOCK_FRAMES`/conch-press machinery already built for Rootmaw as
   far as it fits — it may need a small generalization (see above), not a
   second copy of the whole block.
3. **Measure before and after, the same way S52 did.** Baseline:
   `node tools/measure-boss-combat.mjs d6` (should reproduce 78/80, 32qh
   lost, at seed 20260806 — confirm this first, matching S52/S50's own
   repeated confirmation that nothing has drifted). Then with the fix:
   same measurement, plus a seed sweep (`--seed=1` through at least
   `--seed=5`) to see whether it is a real, repeatable improvement or a
   single-seed artifact.
4. **If a fix is found, validate it exactly the way S52 did:**
   `measure-boss-combat.mjs` on all six dungeons (zero regression on
   D1-D5 — D5 in particular, since it now depends on the SAME shared
   `tideEscape` code path this session is generalizing), a seed sweep on
   D6, `check-playthrough.mjs`, `replay.mjs`, `test.mjs`. This is the
   standing rule in CLAUDE.md's own table for any `dBoss` change, not a
   new requirement.

## Done means

- Either: a landed fix, validated per the bar above, with
  `docs/prompts/LEDGER.md`'s Nereth/D6 entry updated to say what changed
  and by how much (measured numbers, not "should be better now").
- Or: a precise account of why it did not land this session (what was
  tried, what it measured, why it was reverted or left incomplete) — the
  same standard S45's and S49's write-ups set. A measurement plus a
  judgement is an acceptable outcome; a guess dressed as a fix is not.
- `docs/NEXT-SESSION.md` updated losslessly (new entry, do not renumber or
  edit past ones).
- `npm run build` re-run; commit `dist/oracle-of-tides.html` only if it
  changed. `tools/` is not bundled (per S50's own note) — only a change to
  `src/data/bosses.js` (e.g. recording the pin level onto the entity, or a
  new spec field) moves `dist/`; a `dBoss`-only change in
  `tools/actor-runtime.mjs` will not.

## Explicit out of scope

- **Rootmaw's own fix (S52) is landed — do not re-touch `tideEscape` or
  `safeWhenOpen` on `rootmaw`'s spec** except as an unavoidable side effect
  of generalizing the shared `dBoss` machinery, and if that happens,
  re-measure D5 explicitly to prove it is still byte-identical (or exactly
  as improved) as S52 left it.
- **Seed 3's `gel`-contact loop, named in S52's "still open" list, is a
  separate, pre-existing `dBoss` weakness** — the actor parks near a
  persistent non-boss enemy and eats rhythmic contact damage for over a
  thousand frames without re-engaging. It reproduces on D5 both before and
  after S52's fix, so it is not this session's to fix unless Nereth's own
  fight turns out to hit the exact same shape (summons are common to both
  fights — worth a passing check, not a detour).
- D3/D4 routing (needs the Coastwise Chain first, see `docs/NEXT-SESSION.md`
  S49's closing note) or D5 routing (was blocked on Rootmaw's own
  winnability; now that D5 wins more often it may be worth revisiting, but
  routing is its own, separate, much larger task and not this session's
  job).
- Nereth's phase 4 (the self-cycling final phase) — it already has
  `safeWhenOpen` and its own independent reopen channel; nothing named
  above should touch it.

## Habits worth carrying in

- **`nerethPin`'s shape is the opposite of `rootmawTide`'s — read it before
  assuming Rootmaw's fix generalizes by copy-paste.** Rootmaw's problem was
  a permanent lock with no escape; Nereth is already escaping on his own
  attack cadence and his own re-pin timer. The fix here is squeezing a
  MARGIN, not unlocking a wall — expect and report a smaller number.
- **`dBoss` is shared by all six boss fights `check-playthrough.mjs`
  depends on.** Any change to it needs the full six-boss re-measurement,
  not just D6 — S49 and S52 both found this out directly (S49 the
  expensive way, reverting a regression; S52 by re-confirming zero drift
  on the other five before trusting anything).
- **A boss fight losing (or not quite winning) to the robot is not
  automatically a bug**, and the reverse holds too: an already-strong
  result (78/80) does not mean there is nothing left, but it does mean the
  bar for calling something "the fix" is a real, repeatable, seed-swept
  improvement — not a single lucky run.
