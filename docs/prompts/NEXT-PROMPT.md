# Next session — give leever a real deathFrame

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/NEXT-SESSION.md`'s S31 entry IN FULL. **THE ESCALATED FINDING
  S29 AND S30 FLAGGED IS CLOSED.** `check-playthrough.mjs` is 21/21 and
  `replay.mjs` is 51/51 on `main`, with every `deathFrame` intact. The
  "cumulative frame-budget drift" theory those two sessions recorded was
  MEASURED AND DISPROVED — `dLoot`'s frame number is a cap, not a wait,
  so a `loot` step that finds nothing spends nothing and can never be
  short of budget. The two real faults were a missing walk-onto-the-tile
  step for D1's Essence, and the actor being unable to swing at anything
  already touching it (it backed into a room edge and died, ~28000 frames
  before the crash the stack trace showed). Do not re-derive any of this;
  S31's entry has the whole measurement. You are still expected to run
  `check-playthrough.mjs` after your own change and report whatever it
  says — but it should now be GREEN before you start, so a failure is
  yours and is in scope to fix, not a known-bad baseline to report around.

## Why this, now
S26-S30 gave `deathFrame` to `keese`, `octorok`, `urchin`, `crab`, `zol` —
six enemies now including `gel`. `leever` (hp 2, `terrain: 'land'`,
`src/data/enemies.js`) is the next hp <= 2 enemy without one, and it is
mechanically different from every prior target in a way worth checking
directly rather than assuming: it uses `submerge()` (the same primitive
`wizzrobe`/`siren` use for their `hurtFrame`s, S20/S21), which sets
`invuln = 9999` while buried. S20 already proved a `submerge()` enemy can
never be HIT while hidden (`Entity.hurt` early-returns on `invuln > 0`) —
this session should confirm the same holds for a LETHAL hit specifically
(not just re-derive it from S20's hurtFrame-era finding), since a
`deathFrame`'s trigger path (`Enemy.die()`) is a different code path than
`hurtFrame`'s (`spriteName()`'s flicker check).

## The task
1. Check `assets/sheets/oracle-seasons-enemies.png`'s own source plate for
   `leever_0`/`leever_1` (per `tools/rip-enemies.py`'s own comment: "the
   buried frames are unused: the engine hides the sprite outright while
   submerge() has it under the sand" — so the surfaced frame(s) are what's
   extracted). Look at the actual plate for a collapse pose distinct from
   what's already used, the same discipline every prior session applied.
2. If one exists: add it to `FRAMES` in `tools/rip-enemies.py` and
   re-emit. Never hand-add a key to `sprites-enemies.js`.
3. If hand-drawn: add `leever_death` to `ENEMY_HURT_ART`
   (`sprites-enemies-hurt.js`, no new file). Read the file's own header on
   the `_death` exception and look at `leever_0`'s actual grid before
   choosing a shape.
4. Add the new sprite name to `sprite-manifest.js`'s `enemies` list.
5. Wire `deathFrame: 'leever_death'` onto `leever`'s `defineEnemy` call.
6. Verify in-engine: confirm `leever` has no `z` field before deciding
   pose placement. Confirm (don't assume from S20) that a lethal hit only
   ever lands while `leever` is surfaced — pin its `submerge()` state the
   same way S20/S21's probes did, try a lethal hit while hidden and
   confirm it does NOT connect (`hurt()` returns false, `hp` unchanged),
   then try it while surfaced and confirm `dying`/`spriteName()` behave
   the same way every prior `deathFrame` target has.
7. Run `node tools/check-playthrough.mjs` after everything else is green,
   exactly as every session in this thread already does, and report its
   actual result in this session's own `docs/NEXT-SESSION.md` entry —
   whether it stayed at S30's crash, moved to a new failure, or (least
   likely given the pattern, but check for real rather than assume)
   somehow passed clean. Do not skip this check or treat it as optional
   because two prior sessions already found problems there.

## Done means
- `leever` shows a real collapse pose on the hit that kills it while
  surfaced, and is confirmed unhittable while buried, proven by two
  in-engine probes, not by reading the code.
- `node tools/check-drift.mjs` shows `leever: walk,death`.
- `node tools/validate.mjs`, `node tools/test.mjs` pass (83/83 — if this
  session's change breaks another frame-budget-sensitive test the way
  S30's broke one, fix the TEST the same way S30 did, don't paper over
  it). If `sprites-enemies.js` changed, `node tools/check-rippers.mjs` is
  17/17.
- `node tools/check-playthrough.mjs` was RUN and its actual result (pass/
  fail, and if failed, which assertion and where) is recorded honestly in
  `docs/NEXT-SESSION.md`, whatever it turns out to be.
- `npm run build`, `dist/oracle-of-tides.html` committed.
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines).

## Out of scope
- Re-opening S29's missing essence or S30's anchor-equip crash — both are
  FIXED on `main` (S31). If `check-playthrough.mjs` goes red after your
  change, that is a NEW fault and fixing it is in scope.
- Any OTHER enemy's `deathFrame` — one enemy per session.
- `bubble`, `beamos`, `barnacle` — all hp 999, effectively unkillable.
- Redesigning `leever`'s `submerge()`/chase AI — visual death feedback
  only.
- `attackFrame` or any engine field for it — still the separate, bigger
  redesign question (see `docs/prompts/LEDGER.md`).
