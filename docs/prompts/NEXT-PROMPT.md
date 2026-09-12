# Next session — give the Siren a real hurtFrame

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/NEXT-SESSION.md`'s two newest entries (the `wizzrobe_hurt` proof
  and the `moblin_hurt` proof before it) — the `wizzrobe` entry found that
  the "shut the eyes" trick used on `darknut`/`moblin` does NOT generalise
  to every enemy, and describes the fallback (an unused palette slot) and
  why it's needed. Read that reasoning before assuming which trick applies
  here.

## Why this, now
S12/S15/S17/S18/S19/S20 gave `hurtFrame` to `wisp`, `beetle`, `wisp` again,
`darknut`, `moblin`, `wizzrobe` — six enemies now, one per session. `siren`
(hp 4, `src/data/enemies.js`) clears the S12 hp rule (hp > `swordDamage()`
2) and shares `wizzrobe`'s `submerge()` primitive (surface, act, submerge
again), so the "can only ever be hit while surfaced" finding from S20
already applies here too — confirm it holds for `siren` specifically
rather than re-deriving it, but don't skip the in-engine proof. Its own
lesson in `docs/ENEMIES.md` — "Surfaces and fires in every direction at
once, so standing at an angle doesn't help — only range or timing the
window before it fires does" — gives a `hurtFrame` a real job: proving the
window it describes is one you can actually land a hit inside, not just
survive.

## The task
1. Check `assets/sheets/oracle-seasons-enemies.png` first for an existing
   recoil/stagger pose for the Siren (`siren_0`/`siren_1` in
   `src/data/sprites-enemies.js` are the only frames mapped today via
   `tools/rip-enemies.py`). Crop and actually look at neighbouring boxes
   on the sheet — S18/S19/S20 all found nothing usable on their enemy's
   own plate, but check anyway rather than assuming that pattern holds a
   fourth time. If one exists, extract it through the ripper and re-emit
   — never hand-add a key to that generated file. If nothing fits,
   hand-draw it.
2. If hand-drawn: add `siren_hurt` to the existing `ENEMY_HURT_ART` object
   in `src/data/sprites-enemies-hurt.js` (no new file, no `index.js` edit
   — same pattern as `wizzrobe_hurt`). Before picking which pixels to
   change, check whether `siren_0`'s "eyes" (if it has a face at all — it
   may be more abstract, check the actual grid) are a light color inside
   a dark one (the `wizzrobe` case — use an unused palette slot instead of
   recolouring) or a plain colored dot on a lighter face (the `darknut`/
   `moblin` case — recolour to the outline shade is fine). Don't assume
   either without looking at the actual character grid.
3. Add `'siren_hurt'` to `sprite-manifest.js`'s `enemies` list (next to
   the `siren_` entries).
4. Wire `hurtFrame: 'siren_hurt'` onto `siren`'s `defineEnemy` call in
   `src/data/enemies.js`.
5. Verify in-engine, the same shape as S20's `wizzrobe` proof: pin
   `_subState = 'up'` and a large `_subT` (so the submerge cycle doesn't
   flip mid-probe) before hitting it, confirm `spriteName()` returns
   `siren_hurt` while `flicker > 0` and `hidden` stays `false` throughout,
   then confirm it reverts once flicker ends.

## Done means
- `siren` shows a real staggered pose on a non-lethal hit while surfaced,
  proven by an in-engine probe (a hit under its hp, confirm the sprite
  name, confirm `hidden` stays false, confirm the revert), not by reading
  the code.
- `node tools/check-drift.mjs` shows `siren: walk,hurt`.
- `node tools/validate.mjs`, `node tools/test.mjs` pass. If
  `sprites-enemies.js` changed, `node tools/check-rippers.mjs` is 17/17.
- `npm run build`, `dist/oracle-of-tides.html` committed.
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines).

## Out of scope
- `siren_death` — one state per enemy per session, same cadence as every
  prior session in this rotation.
- Re-testing the `hurtFrame`/`deathFrame` ordering — S17 already closed
  that question; do not spend this session re-verifying it.
- `attackFrame` or any engine field for it — still the separate, bigger
  redesign question (see `docs/prompts/LEDGER.md`).
- Rewriting `docs/ENEMIES.md`'s lessons — unrelated to this task.
