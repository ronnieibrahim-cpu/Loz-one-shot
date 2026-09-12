# Next session — give the wisp a deathFrame too, and prove the ordering

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/NEXT-SESSION.md`'s two newest entries (the `gel_death` hp-1 proof,
  and its own pointer to "a second `deathFrame` on an enemy that ALSO
  already has `hurtFrame` ... to check the two stalls don't collide") —
  they name this session's target and the specific thing to verify.

## Why this, now
S12/S15 gave `hurtFrame` to `wisp` and `beetle`. S13/S16 gave `deathFrame`
to `stalfos` and `gel`. Every one of those four enemies has exactly ONE of
the two fields. `Enemy.spriteName()` (`src/game/enemy.js`) has an explicit
order — `if (this.dying && this.spec.deathFrame) return this.spec.
deathFrame;` runs BEFORE the `hurtFrame` flicker check — but nothing has
ever actually exercised that order on a real enemy, because no enemy in
the roster has ever had both fields set at once. That is a real gap: the
killing blow on such an enemy sets BOTH `flicker` (from `hurt()`) AND,
once hp reaches 0, `dying` (from `die()`) — if the ordering were wrong,
or if some other interaction (`flicker` reaching 0 mid-stall, `invuln`
expiring mid-stall) let the code fall through to the walk cycle instead
of either flinch or death art, nothing today would have noticed. `wisp`
already has `hurtFrame: 'wisp_hurt'` (`src/data/enemies.js`) and is a
clean pick: hp 3, well above every constraint either mechanism has.

## The task
1. Give `wisp` a `deathFrame`. Check
   `assets/sheets/oracle-seasons-enemies.png` first (the wisp already
   borrows Spark's two lit/unlit frames, per `sprites-enemies.js`'s own
   header) — if nothing fits a collapse/snuff-out pose, hand-draw
   `wisp_death` into the existing `ENEMY_HURT_ART` object in
   `src/data/sprites-enemies-hurt.js` (no new file, no `index.js` edit).
   Since this is a `_death` frame, the shape MAY change from `wisp_hurt`'s
   "same halo, squinted eyes" rule (S13's exception) — a snuffed-out
   flame/faded halo is a reasonable direction, but check `docs/ENEMIES.md`'s
   `wisp` lesson first so the pose doesn't contradict it.
2. Add `'wisp_death'` to `sprite-manifest.js`'s `enemies` list.
3. Wire `deathFrame: 'wisp_death'` onto `wisp`'s existing `defineEnemy`
   call (it already has `hurtFrame: 'wisp_hurt'` — do not remove that).
4. Verify in-engine, and this is the actual point of the session: hit
   `wisp` for LESS than its hp (a non-lethal hit) and confirm
   `spriteName()` returns `wisp_hurt` while `flicker > 0` and `dying` is
   still false — the ordinary hurt path, unaffected by the new field.
   THEN kill it with a second hit and confirm `spriteName()` returns
   `wisp_death` (not `wisp_hurt`) for the whole `dying` stall, even though
   `flicker` is ALSO nonzero during that same window (`hurt()` sets it on
   every hit, including the killing one) — this is the one thing that
   proves the `if (this.dying && ...) return ...deathFrame` check in
   `spriteName()` really does win over the `hurtFrame` check below it, not
   just that it's written first in the file. A screenshot of the death
   pose is worth taking if you can get one.

## Done means
- `wisp` shows `wisp_hurt` on a non-lethal hit and `wisp_death` (not
  `wisp_hurt`) on the killing hit, both proven by the SAME in-engine probe
  run against the SAME enemy instance — not two separate enemies.
- `node tools/check-drift.mjs` shows `wisp: walk,hurt,death`.
- `node tools/validate.mjs`, `node tools/test.mjs` pass. If
  `sprites-enemies.js` changed, `node tools/check-rippers.mjs` is 17/17.
- `npm run build`, `dist/oracle-of-tides.html` committed.
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines); say plainly whether the ordering held or needed a fix.

## Out of scope
- Any OTHER enemy's `hurtFrame`/`deathFrame` — this session is about the
  interaction on one enemy, not growing coverage further.
- Changing `spriteName()`'s check order unless the probe actually shows it
  wrong — verify first, only change code if the verification fails.
- `attackFrame` or any engine field for it — still the separate, bigger
  redesign question.
- Rewriting `docs/ENEMIES.md`'s lessons — unrelated to this task.
