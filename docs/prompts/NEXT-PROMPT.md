# Next session — Oracle of Tides

Repo `ronnieibrahim-cpu/Loz-one-shot`. Branch from the CURRENT tip of `main` —
`git log -1 origin/main` for the real commit. One prompt = one session = one
branch. Do not open a pull request unless asked.

## Task: fix D5 Rootmaw's `gel`-contact loop with a boss-specific spec field, the same shape S52 already used for his other bug — not another change to the shared `hazards()`/`evade()` machinery

Three sessions now (S54, S55, S56) have tried variations of "give
`hazards()` a real velocity estimate for non-projectile hazards" to fix D5
seed 3's losing `gel`-contact loop, and all three have been reverted.
**Read `docs/NEXT-SESSION.md`'s S54, S55, and S56 entries in full before
starting anything below** — this prompt exists specifically because that
line of attack is now measured and closed, not because it is untried.

The short version: giving `hazards()` real velocity — whether applied
everywhere, or scoped narrowly so only `dBoss`'s own `evade()` call asks for
it — fixes D5 seed 3's loop, but the mechanism that fixes it (shifting
exactly which frame a swap happens on) is the same mechanism that breaks
things elsewhere, because every boss's attack AI and at least one ordinary
room enemy (a stationary `barnacle`) run on absolute-frame timers that a
shifted swap sequence can desync against. Applied everywhere: it kills the
scripted playthrough actor outright in an ordinary D2 room (S55/S56).
Scoped to `dBoss` alone: it fully protects the scripted route (verified
byte-identical outside an active boss fight), but drops **D1's own boss
fight from a 6/6 win rate to 3/6** on the standard 6-seed sample — and D1 is
the one dungeon `check-playthrough.mjs` actually depends on. Neither version
is worth landing on the numbers measured so far.

## What to do, in order

1. Read `docs/NEXT-SESSION.md` S54, S55, S56 in full. Do not re-attempt
   either the unconditional or the `dBoss`-scoped velocity change — both
   are measured and both cost more than they fix.
2. **Design a Rootmaw-specific answer instead**, in `src/data/bosses.js`'s
   `rootmaw` spec, read by `dBoss` (`tools/actor-runtime.mjs`) only for
   bosses that declare it — the exact shape `tideEscape`/`safeWhenOpen`
   already use for his OTHER bug (S52). The problem to solve: a `gel` (or
   `zol`) sits in continuous or near-continuous contact range of the player
   for many frames without a successful dodge (S52's own trace: roughly a
   hit every 52 frames, 23 of 24 hits in the losing fight a `gel` contact,
   not a boss hit). A field that detects "a specific hazard has been within
   contact range, un-dodged, for N consecutive frames" and responds with a
   deliberate, narrow nudge (a forced retreat swap toward open space, sized
   the same way `RETREAT_MARGIN`/`avoid` already work in `evade`) would
   answer the named bug directly, scoped to Rootmaw, without touching
   `hazards()` — so it cannot reproduce either S55's route-wide drift or
   S56's D1 regression, by construction, the same way `tideEscape` cannot.
3. Measure it the same way S52 measured `tideEscape`: D5 seed sweep
   (default + seeds 1-5 at minimum, same as every prior boss-verb session),
   `measure-boss-combat.mjs` for confirmation on seed 3 specifically.
   **Do not stop at seed 3 alone** — S54's own mistake was shipping the
   general fix on the strength of one seed; this field needs the same
   6-seed bar every other boss change in this project has been held to.
4. Run the full validation bar for any `dBoss` change: `check-bosses.mjs`,
   `check-playthrough.mjs`, `replay.mjs`, `test.mjs`. Since this field is
   scoped to `rootmaw`'s own spec and D5 is not on `check-playthrough.mjs`'s
   route, expect (and confirm, don't assume) zero effect on the other five
   bosses and the scripted route — if anything outside D5 changes, that is
   itself a finding worth stopping and understanding before going further.
5. If it does not close the loop cleanly, or trades a new regression for
   it, apply the same honesty this task's predecessors did: document
   precisely what was tried and measured rather than landing something
   fragile. A fourth "tried and reverted" entry is an acceptable outcome;
   a knife-edge pass is not.

## Done means

- Either: a `rootmaw`-scoped spec field lands, D5's seed sweep shows the
  named loop closed with no new regression on the same sample (or a
  clearly-better trade than the 3/6-vs-4/6 wash every `hazards()`-based
  attempt has produced so far), the full validation bar passes, and
  `docs/prompts/LEDGER.md`'s entry is updated (moved to "Landed" if it
  lands, or given a fourth precise account if not).
- `docs/NEXT-SESSION.md` updated losslessly (new entry, do not renumber or
  edit past ones).
- `npm run build` re-run; commit `dist/oracle-of-tides.html` only if `src/`
  changed (this fix, if it lands, DOES touch `src/data/bosses.js`, unlike
  S54-S56's attempts — confirm the build actually changed rather than
  assuming either way).

## Explicit out of scope

- **Do not touch `hazards()` or `evade()`'s shared swap-cost machinery.**
  Three sessions have now shown that any change there risks every boss
  fight and the whole scripted route, not just D5. This task is scoped to
  `rootmaw`'s own spec precisely to avoid that risk.
- **Routing D3 onward** and **Nereth's D6 `tideEscape`** (S53, landed and
  correctly inert) are both untouched by this task.
- **Rootmaw's existing `tideEscape`/`safeWhenOpen` fields** (S52) are
  landed and should not be modified — this task adds a new field alongside
  them, not a change to those.

## Habits worth carrying in

- **A shared-machinery fix that helps one boss and hurts another (or the
  whole route) is not a boss-specific bug — it is a symptom that the fix
  belongs in that boss's own spec, not in the machinery every boss shares.**
  This is the same lesson S52 already learned once for Rootmaw's tide-lock;
  S54-S56 spent three sessions re-learning it for his `gel`-loop the
  expensive way, by trying the shared-machinery version first.
- **Any `dBoss`-adjacent change needs a real seed sweep on every boss it can
  reach, not just the one it was built for.** S54 only swept D5; S56 found
  D1's regression specifically because it swept a boss nobody had reason to
  suspect. Do not repeat that gap here — even a spec-field fix should be
  confirmed inert on the other five bosses, not assumed inert because it is
  "scoped."
- **`check-playthrough.mjs` is the one thing that proves the game is
  finishable, and it is fast to run — use it liberally, not as a final
  gate.** Both S55 and S56's most important findings came from reading its
  full trace, not just its pass/fail line.
