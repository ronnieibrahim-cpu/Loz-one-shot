# Next session — give the Wizzrobe a real hurtFrame

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/NEXT-SESSION.md`'s two newest entries (the `moblin_hurt` proof and
  the `darknut_hurt` proof before it) — both show the same sheet-first
  check this session repeats: crop every box on the sheet's own plate for
  the enemy, look for a flinch before assuming one is or isn't there.

## Why this, now
S12/S15/S17/S18/S19 gave `hurtFrame` to `wisp`, `beetle`, `wisp` again,
`darknut`, `moblin` — five enemies now, one per session, no repeated
questions. `wizzrobe` (hp 3, `src/data/enemies.js`) clears the S12 hp rule
(hp > `swordDamage()` 2) and its own lesson in `docs/ENEMIES.md` —
"Teleports in, fires one aimed shot, teleports out — the punish window is
short and needs closing distance fast, not just dodging" — gives a
`hurtFrame` a real job: proving the punish window this session's own lesson
describes is a real, hittable moment, not just a description.

## The task
1. Check `assets/sheets/oracle-seasons-enemies.png` first for an existing
   recoil/stagger pose for the Wizzrobe (`wizzrobe_0`/`wizzrobe_1` in
   `src/data/sprites-enemies.js` are the only frames mapped today via
   `tools/rip-enemies.py`). Crop and actually look at neighbouring boxes on
   the sheet, the way S18/S19 did — don't assume a flinch pose exists OR
   that it doesn't without looking. `wizzrobe` only has TWO frames mapped
   (no separate down/side split like `darknut`/`moblin`), so check whether
   the sheet's Wizzrobe plate has more poses than the two already used. If
   one exists, extract it through the ripper and re-emit — never hand-add
   a key to that generated file. If nothing fits, hand-draw it.
2. If hand-drawn: add `wizzrobe_hurt` to the existing `ENEMY_HURT_ART`
   object in `src/data/sprites-enemies-hurt.js` (no new file, no
   `index.js` edit — same pattern as `moblin_hurt`). Follow this file's
   own header grammar for a `_hurt` frame specifically: SAME silhouette as
   the base frame, a few pixels changed (not a reshape — that license is
   only for `_death` frames).
3. Add `'wizzrobe_hurt'` to `sprite-manifest.js`'s `enemies` list (next to
   the `wizzrobe_` entries).
4. Wire `hurtFrame: 'wizzrobe_hurt'` onto `wizzrobe`'s `defineEnemy` call
   in `src/data/enemies.js`. Note: `wizzrobe` uses `submerge()`/hides for
   part of its cycle (per `docs/ENEMIES.md`'s "teleports") — check whether
   it is ever both hidden AND hittable at once before assuming the flicker
   window always has something to draw; if it's only ever hittable while
   visible, no extra guard is needed, but confirm rather than assume.
5. Verify in-engine, the same shape as every prior session: hit `wizzrobe`
   for less than its hp (a non-lethal hit while it is surfaced/visible)
   and confirm `spriteName()` returns `wizzrobe_hurt` while `flicker > 0`,
   then confirm it reverts once flicker ends. A screenshot is worth taking
   if you can get one, but is not required if the numeric probe proves it.

## Done means
- `wizzrobe` shows a real staggered pose on a non-lethal hit, proven by an
  in-engine probe (a hit under its hp, confirm the sprite name, confirm
  the revert), not by reading the code.
- `node tools/check-drift.mjs` shows `wizzrobe: walk,hurt`.
- `node tools/validate.mjs`, `node tools/test.mjs` pass. If
  `sprites-enemies.js` changed, `node tools/check-rippers.mjs` is 17/17.
- `npm run build`, `dist/oracle-of-tides.html` committed.
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines).

## Out of scope
- `wizzrobe_death` — one state per enemy per session, same cadence as
  every prior session in this rotation.
- Re-testing the `hurtFrame`/`deathFrame` ordering — S17 already closed
  that question; do not spend this session re-verifying it.
- `attackFrame` or any engine field for it — still the separate, bigger
  redesign question (see `docs/prompts/LEDGER.md`).
- Rewriting `docs/ENEMIES.md`'s lessons — unrelated to this task.
