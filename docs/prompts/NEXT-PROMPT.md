# Next session — give the Spiked Beetle a real hurtFrame

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/NEXT-SESSION.md`'s two newest entries (the `check-drift` "death"
  column fix, and its own note on why "attack" was deliberately left
  alone) — they explain why this session resumes ART, not the tool.

## Why this, now
S12 proved `hurtFrame` works on `wisp`. S13 proved `deathFrame` works on
`stalfos`. S14 fixed the one thing those two proofs exposed: `check-
drift.mjs` measuring "death" the wrong way. Both engine mechanisms are now
proven AND correctly measured — `wisp` reads `walk,hurt`, `stalfos` reads
`walk,death`. The metric is trustworthy again, which is exactly what
S14's own "out of scope" note said had to happen before more art work.
`beetle` (hp 3, `src/data/enemies.js`) is eligible for `hurtFrame` under
the S12 rule (hp > `swordDamage()`, which is 2 at sword level 1) and was
already named as a `deathFrame` candidate in S13's own prompt before
`stalfos` was picked instead — it has never had either state.

## The task
Give `beetle` a `hurtFrame`, the same shape S12 gave `wisp`:
1. Check `assets/sheets/oracle-seasons-enemies.png` first (per CLAUDE.md's
   extraction rule) for an existing flinch/recoil pose for the Spiked
   Beetle. If one exists, it goes through `tools/rip-enemies.py`'s
   coordinate map and a re-emit of `sprites-enemies.js` — never hand-add a
   key to that file. If nothing fits, hand-draw it.
2. If hand-drawn: add `beetle_hurt` to `ENEMY_HURT_ART` in
   `src/data/sprites-enemies-hurt.js` (the existing file — no new file, no
   `index.js` edit needed, same as `stalfos_death` needed only a
   `sprite-manifest.js` addition). Follow the file's own header grammar:
   silhouette first, hard 1px outline, the SAME creature caught mid-recoil
   (not a recolour) — `beetle` has `shield: 'front'` and charges in
   straight lines (`docs/ENEMIES.md`), so a recoil that reads as "shell
   struck from an unshielded angle" would fit its own lesson.
3. Add `'beetle_hurt'` to `sprite-manifest.js`'s `enemies` list (next to
   the `beetle_d`/`beetle_s` entries).
4. Wire `hurtFrame: 'beetle_hurt'` onto `beetle`'s `defineEnemy` call in
   `src/data/enemies.js`.
5. Verify in-engine, the same way S12/S13 did: a scratch harness that hits
   `beetle` (hp 3, so it survives at least one non-lethal hit at sword
   level 1) and confirms `spriteName()` returns `beetle_hurt` while
   `flicker > 0`. A screenshot is worth taking if you can get one.

## Done means
- `beetle` shows a real flinch pose on a non-lethal hit, proven by an
  in-engine probe, not by reading the code.
- `node tools/check-drift.mjs` shows `beetle: walk,hurt` (or
  `walk,hurt,death` only if you also happen to already have a death pose
  — you do not; do not add one this session, see below).
- `node tools/validate.mjs`, `node tools/test.mjs` pass. If
  `sprites-enemies.js` changed (an extraction was possible),
  `node tools/check-rippers.mjs` is 17/17; if only the hand-drawn file
  changed, `check-rippers.mjs` is unaffected and does not need re-running.
- `npm run build`, `dist/oracle-of-tides.html` committed (this session
  touches `src/`, unlike S14).
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines).

## Out of scope
- `beetle_death` — one state per enemy per session, same cadence S12/S13
  set; do not add both `hurtFrame` and `deathFrame` to the same enemy in
  one session.
- `attackFrame` or any engine field for it — still the separate, bigger
  redesign question; do not start it.
- Any change to `check-drift.mjs` — S14 already fixed the one thing that
  needed fixing there.
- Rewriting `docs/ENEMIES.md`'s lessons — unrelated to this task.
