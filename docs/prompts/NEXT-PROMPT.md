# Next session — give darknut a real deathFrame

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/NEXT-SESSION.md`'s S81 entry (`beetle_death`, the newest) — it
  proved a `shield`-blocked hit stays blocked even at absurd lethal
  damage. This session's target, `darknut`, has the same `shield: 'front'`
  field but a different reason for being picked: it's the first
  `deathFrame` candidate that takes THREE hits to die, not two.

## Why this, now
Eleven enemies have `deathFrame` already. Every multi-hit proof so far
(`stalfos` S25, `octorokSea` S80, `beetle` S81) has been exactly one
non-lethal hit followed by one lethal hit. `darknut` (hp 6,
`src/data/enemies.js`, "only vulnerable from behind," `shield: 'front'`)
needs THREE hits at `swordDamage()` 2 (6 -> 4 -> 2 -> 0) — the first
chance to confirm `hurtFrame` correctly re-triggers on a SECOND non-lethal
hit, not just the first, before a third hit finally shows `deathFrame`.

## The task
1. Check `assets/sheets/oracle-seasons-enemies.png`'s own "Darknut" plate
   (boxes 56/58/59/82 per `tools/rip-enemies.py` — `darknut_d0`/`s0`/`s1`/
   `d1`) for a collapse pose distinct from the four already used and from
   `darknut_hurt` (`sprites-enemies-hurt.js`). `pip install pillow` first
   if needed, and run `python3 tools/rip-enemies.py` once unmodified to
   confirm it still reproduces byte-identically before changing anything.
2. If a real extra frame exists: add it to `FRAMES` in `tools/rip-enemies.py`
   and re-emit. Never hand-add a key to `sprites-enemies.js`.
3. If nothing extractable exists: add `darknut_death` to `ENEMY_HURT_ART`
   (`sprites-enemies-hurt.js`), following the same "reuse/squash the live
   frames, invent nothing" discipline `beetle_death` (S81) used — pick
   which live frame to squash (front `darknut_d0` vs. side `darknut_s0`)
   and say why, the same kind of purposeful choice `beetle` made between
   its upright and balled-up poses.
4. Add the new sprite name to `sprite-manifest.js`'s `enemies` list (if
   hand-drawn).
5. Wire `deathFrame: 'darknut_death'` onto `darknut`'s `defineEnemy` call.
6. Verify in-engine, in this order:
   - Confirm `darknut` has no `z` field.
   - A hit at the shielded front is blocked outright (same proof `beetle`
     S81 already established for the mechanism — confirm it holds here
     too, don't just assume it carries over).
   - From an unshielded angle: hit 1 (hp 6 -> 4) shows `darknut_hurt`,
     reverts to the walk cycle once the flicker window ends, `dying`
     false throughout. Hit 2 (hp 4 -> 2) shows `darknut_hurt` AGAIN —
     this is the actual new ground this session covers, confirm it
     explicitly rather than assuming the first hit's proof generalises.
     Hit 3 (hp 2 -> 0) shows `darknut_death`, never `darknut_hurt`, held
     for the full `ENEMY_DEATH_FRAMES` stall, then `dead = true`.
7. Run `node tools/check-playthrough.mjs` and `node tools/replay.mjs`
   after everything else is green. `darknut` may appear in a recorded
   route or replay plan where prior sessions' targets didn't — check
   rather than assume, and re-record whichever plan actually diverges
   (`node tools/replay.mjs --record <name>`) if one does.

## Done means
- `darknut` shows a real collapse pose on the hit that kills it, proven
  by an in-engine probe stepping through all three hits, not by reading
  the code.
- `node tools/check-drift.mjs` shows `darknut: walk,hurt,death`.
- `node tools/validate.mjs`, `node tools/test.mjs` pass (83/83). If
  `sprites-enemies.js` changed, `node tools/check-rippers.mjs` is 17/17.
- `node tools/check-playthrough.mjs` is 21/21 and `node tools/replay.mjs`
  is 51/51 after this session's change, both confirmed by actually
  running them.
- `npm run build`, `dist/oracle-of-tides.html` committed.
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines).

## Out of scope
- Any OTHER enemy's `deathFrame` — one enemy per session, same cadence
  this thread has kept for eleven sessions straight.
- `bubble`, `beamos`, `barnacle` — all hp 999, effectively unkillable.
- Re-litigating the shield-blocks-lethal-hits finding (S81) — that's
  settled; this session confirms it carries over, not re-derives it.
- `attackFrame` or any engine field for it — still the separate, bigger
  redesign question (see `docs/prompts/LEDGER.md`).
