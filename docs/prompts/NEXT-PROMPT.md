# Next session — give the Moblin a real hurtFrame

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/NEXT-SESSION.md`'s two newest entries (the `darknut_hurt` proof
  and its own note on what to check on the sheet first) — they explain why
  this session checks the sheet before drawing, same as last time.

## Why this, now
S12/S15/S17/S18 gave `hurtFrame` to `wisp`, `beetle`, `wisp` again (for the
coexistence test), and `darknut`. That is plain coverage growth, one enemy
per session, and this session continues the same cadence rather than
opening a new question — the one real engine question (whether `hurtFrame`
and `deathFrame` interact correctly on one enemy) closed at S17 and does
not need a third instance. `moblin` (hp 4, `src/data/enemies.js`) clears
the S12 hp rule (hp > `swordDamage()` 2) with headroom, and its own lesson
in `docs/ENEMIES.md` — "a ranged attacker that actively backs away once you
close in, so cornering it matters more than just approaching" — gives a
`hurtFrame` a clear job: showing the moment cornering actually lands a hit
on something that is built to keep its distance.

## The task
1. Check `assets/sheets/oracle-seasons-enemies.png` first for an existing
   recoil/stagger pose for the Moblin (`moblin_d0`/`d1`/`u0`/`u1`/`s0`/`s1`
   in `src/data/sprites-enemies.js` are the only frames mapped today via
   `tools/rip-enemies.py`). Crop and actually look at neighbouring boxes on
   the sheet the way S18 did for Darknut — don't assume a flinch pose
   exists OR that it doesn't without looking. If one exists, extract it
   through the ripper and re-emit — never hand-add a key to that generated
   file. If nothing fits, hand-draw it.
2. If hand-drawn: add `moblin_hurt` to the existing `ENEMY_HURT_ART` object
   in `src/data/sprites-enemies-hurt.js` (no new file, no `index.js` edit —
   same pattern as `darknut_hurt`). Follow this file's own header grammar
   for a `_hurt` frame specifically: SAME silhouette as the walk cycle, a
   few pixels changed (not a reshape — that license is only for `_death`
   frames).
3. Add `'moblin_hurt'` to `sprite-manifest.js`'s `enemies` list (next to
   the `moblin_d`/`moblin_u`/`moblin_s` entries).
4. Wire `hurtFrame: 'moblin_hurt'` onto `moblin`'s `defineEnemy` call in
   `src/data/enemies.js`.
5. Verify in-engine, the same shape as S12/S15/S17/S18: hit `moblin` for
   less than its hp (a non-lethal hit) and confirm `spriteName()` returns
   `moblin_hurt` while `flicker > 0`, then confirm it reverts to the walk
   cycle once flicker ends. A screenshot is worth taking if you can get
   one (S18 screenshotted mid-flicker to confirm the art actually renders
   under the invuln tint, not just in a standalone preview), but is not
   required if the numeric probe already proves it.

## Done means
- `moblin` shows a real staggered pose on a non-lethal hit, proven by an
  in-engine probe (a hit under its hp, confirm the sprite name, confirm
  the revert), not by reading the code.
- `node tools/check-drift.mjs` shows `moblin: walk,hurt`.
- `node tools/validate.mjs`, `node tools/test.mjs` pass. If
  `sprites-enemies.js` changed, `node tools/check-rippers.mjs` is 17/17.
- `npm run build`, `dist/oracle-of-tides.html` committed.
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines).

## Out of scope
- `moblin_death` — one state per enemy per session, same cadence as every
  prior session in this rotation.
- Re-testing the `hurtFrame`/`deathFrame` ordering — S17 already closed
  that question; do not spend this session re-verifying it.
- `attackFrame` or any engine field for it — still the separate, bigger
  redesign question (see `docs/prompts/LEDGER.md`).
- Rewriting `docs/ENEMIES.md`'s lessons — unrelated to this task.
