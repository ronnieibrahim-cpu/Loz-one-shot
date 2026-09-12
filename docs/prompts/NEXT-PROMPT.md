# Next session — give the Darknut a real hurtFrame

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/NEXT-SESSION.md`'s two newest entries (the `wisp_death` +
  `hurtFrame`/`deathFrame` ordering proof, and its own note that the
  interaction is now settled and does not need re-testing) — they explain
  why this session goes back to growing coverage rather than probing the
  engine again.

## Why this, now
S12/S15/S17 proved `hurtFrame` on `wisp`, `beetle`, and (alongside
`deathFrame`) `wisp` again. S13/S16/S17 proved `deathFrame` on `stalfos`,
`gel`, `wisp`. The one real engine question left open — whether the two
mechanisms interact correctly on a single enemy — is now closed and moved
to `docs/prompts/LEDGER.md`; re-testing it on a second dual-field enemy
would not learn anything new (S17's own log row says so explicitly).
That means this session is back to plain coverage growth: pick an enemy
not yet touched and give it one more state, same cadence as every prior
session. `darknut` (hp 6, `src/data/enemies.js`) is eligible for
`hurtFrame` under the S12 rule (hp > `swordDamage()` 2) with plenty of
headroom, and its own lesson in `docs/ENEMIES.md` — "armoured knight,
only vulnerable from behind" — gives a `hurtFrame` a clear job: showing
the moment a hit actually got through that armor from the back.

## The task
1. Check `assets/sheets/oracle-seasons-enemies.png` first for an existing
   recoil/stagger pose for the Darknut (`darknut_d0`/`d1`/`s0`/`s1` in
   `src/data/sprites-enemies.js` are the only frames mapped today via
   `tools/rip-enemies.py`). If one exists, extract it through the ripper
   and re-emit — never hand-add a key to that generated file. If nothing
   fits, hand-draw it.
2. If hand-drawn: add `darknut_hurt` to the existing `ENEMY_HURT_ART`
   object in `src/data/sprites-enemies-hurt.js` (no new file, no
   `index.js` edit — same pattern as `beetle_hurt`). Follow this file's
   own header grammar for a `_hurt` frame specifically: SAME silhouette as
   the walk cycle, a few pixels changed (not a reshape — that license is
   only for `_death` frames). Darknut is "only vulnerable from behind," so
   the hurt pose should read as a knight staggering forward from a strike
   it didn't see coming.
3. Add `'darknut_hurt'` to `sprite-manifest.js`'s `enemies` list (next to
   the `darknut_d`/`darknut_s` entries).
4. Wire `hurtFrame: 'darknut_hurt'` onto `darknut`'s `defineEnemy` call in
   `src/data/enemies.js`.
5. Verify in-engine, the same shape as S12/S15/S17: hit `darknut` for less
   than its hp (a non-lethal hit) and confirm `spriteName()` returns
   `darknut_hurt` while `flicker > 0`, then confirm it reverts to the walk
   cycle once flicker ends. A screenshot is worth taking if you can get
   one, but is not required if the numeric probe already proves it (S17
   skipped a usable screenshot for exactly this reason — the orbiting
   enemy had moved off the captured frame, and the in-engine trace was
   conclusive on its own).

## Done means
- `darknut` shows a real staggered pose on a non-lethal hit, proven by an
  in-engine probe (kill-adjacent hit, confirm the sprite name, confirm the
  revert), not by reading the code.
- `node tools/check-drift.mjs` shows `darknut: walk,hurt`.
- `node tools/validate.mjs`, `node tools/test.mjs` pass. If
  `sprites-enemies.js` changed, `node tools/check-rippers.mjs` is 17/17.
- `npm run build`, `dist/oracle-of-tides.html` committed.
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines).

## Out of scope
- `darknut_death` — one state per enemy per session, same cadence as
  every prior session in this rotation.
- Re-testing the `hurtFrame`/`deathFrame` ordering — S17 already closed
  that question; do not spend this session re-verifying it.
- `attackFrame` or any engine field for it — still the separate, bigger
  redesign question.
- Rewriting `docs/ENEMIES.md`'s lessons — unrelated to this task.
