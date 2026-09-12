# Next session — give octorokSea a real hurtFrame

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/NEXT-SESSION.md`'s two newest entries (the `pincer_hurt` proof and
  the `anglerfry_hurt` proof before it) — together they show both branches
  of the same rule: check the sheet before assuming it's exhausted, and
  extract if it has the pose, hand-draw only if it doesn't.

## Why this, now
S12/S15/S17/S18/S19/S20/S21/S22/S23 gave `hurtFrame` to `wisp`, `beetle`,
`wisp` again, `darknut`, `moblin`, `wizzrobe`, `siren`, `anglerfry`,
`pincer` — nine enemies now, one per session. `octorokSea` (hp 3,
`src/data/enemies.js`) clears the S12 hp rule (hp > `swordDamage()` 2) and
is now the LAST untouched enemy with hp > 2 that isn't `stalfos` (which
already has `deathFrame` — see Out of scope). It is mechanically different
from every prior target in one way worth noting before you start: its
`frames` field is a directional dict (`down`/`up`/`side`), not a flat
array like `pincer`'s — `darknut` and `moblin` already prove `hurtFrame`
overrides every direction the same way, so confirm that holds here rather
than assuming a directional enemy needs special handling.

## The task
1. Check `assets/sheets/oracle-seasons-enemies.png` first for an existing
   recoil/stagger pose on the sheet's own "Octorok" plate — the source for
   `octorok_d0`/`d1`/`s0`/`s1` in `src/data/sprites-enemies.js`
   (`tools/rip-enemies.py`'s `FRAMES` table, indices given there). Crop and
   actually look at neighbouring boxes, the same way S23 found `pincer`'s
   third frame sitting right after its other two on the same plate with a
   matching palette and no background gap — don't assume a sixth exhausted
   plate without checking. Note: `octorok_u0`/`u1` (the back view) are
   `HAND_ART` in that file, not extracted — the sheet has no back view at
   all, so don't expect one there.
2. If a sheet frame fits: add it to `FRAMES` as `octorokSea_hurt` (or
   `octorok_hurt`, matching whichever existing frame-name stem the rest of
   the plate uses — check `frames:` in `defineEnemy('octorokSea', ...)`
   for the exact stems already in play) and re-emit through the ripper.
   Never hand-add a key to that generated file.
3. If hand-drawn: add `octorokSea_hurt` to `ENEMY_HURT_ART` in
   `src/data/sprites-enemies-hurt.js` (no new file). Look at the actual
   character grid of whichever frame you're basing it on before picking
   eyes-shut (`darknut`/`moblin`/`anglerfry`'s case) vs. the unused-
   palette-slot fallback (`wizzrobe`/`siren`'s case) — don't assume either
   from the creature's silhouette.
4. Add the new sprite name to `sprite-manifest.js`'s `enemies` list.
5. Wire `hurtFrame: '<name>'` onto `octorokSea`'s `defineEnemy` call in
   `src/data/enemies.js`.
6. Verify in-engine, same shape as every prior session: spawn `octorokSea`,
   hit it for less than its hp (non-lethal), confirm `spriteName()` returns
   the hurt frame while `flicker > 0` — check it holds across at least one
   direction change if the AI moves during the flicker window, since this
   is the first directional-`frames` target since `darknut`/`moblin` — then
   confirm it reverts once flicker ends. `octorokSea` has `terrain: 'water'`
   but no `submerge()`-style hidden state — confirm that's actually true
   (read its `ai()` in `src/data/enemies.js`) rather than assuming it from
   this description.

## Done means
- `octorokSea` shows a real staggered pose on a non-lethal hit, proven by
  an in-engine probe (a hit under its hp, confirm the sprite name, confirm
  the revert), not by reading the code.
- `node tools/check-drift.mjs` shows `octorokSea: walk,hurt`.
- `node tools/validate.mjs`, `node tools/test.mjs` pass. If
  `sprites-enemies.js` changed, `node tools/check-rippers.mjs` is 17/17.
- `npm run build`, `dist/oracle-of-tides.html` committed.
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines).

## Out of scope
- `pincer_death` or `octorokSea_death` — one state per enemy per session,
  same cadence as every prior session in this rotation.
- `stalfos`'s reverse-order `hurtFrame` (it already has `deathFrame`) —
  after this session, it becomes the only hp > 2 enemy left without both
  fields. A valid next target once octorokSea is done.
- Re-testing the `hurtFrame`/`deathFrame` ordering — S17 already closed
  that question; do not spend this session re-verifying it.
- `attackFrame` or any engine field for it — still the separate, bigger
  redesign question (see `docs/prompts/LEDGER.md`).
