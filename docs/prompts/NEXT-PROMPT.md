# Next session — give the Anglerfry a real hurtFrame

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/NEXT-SESSION.md`'s two newest entries (the `siren_hurt` proof and
  the `wizzrobe_hurt` proof before it) — both establish that the "shut the
  eyes" trick used on `darknut`/`moblin` needs checking case by case: use
  it only if the sprite actually has a distinct pupil-in-iris eye; if the
  face is a mask/fang/visor shape with no clear iris, use the fallback
  (an unused palette slot, e.g. index 2 on a 4-colour ramp) instead. Look
  at `anglerfry_0`'s own grid before picking which one applies here.

## Why this, now
S12/S15/S17/S18/S19/S20/S21 gave `hurtFrame` to `wisp`, `beetle`, `wisp`
again, `darknut`, `moblin`, `wizzrobe`, `siren` — seven enemies now, one
per session. `anglerfry` (hp 3, `src/data/enemies.js`) clears the S12 hp
rule (hp > `swordDamage()` 2) and is NOT a `submerge()` enemy — it uses
`charge()` (drift on its lure, then dash in a straight line once close),
so this session does not need to re-derive or re-confirm the "can only be
hit while surfaced" finding; that finding is specific to `submerge()` and
does not apply here. `anglerfry` also carries `light: true`, a flag no
prior `hurtFrame` target has had — check what that flag actually does
(likely a lighting/glow render effect for its anglerfish lure) and confirm
it doesn't interact badly with the flicker/hurtFrame draw path before
assuming it's irrelevant. Its own lesson in `docs/ENEMIES.md` — "Sits
still like part of the scenery until you swim past, then commits to a
single fast lunge — the lesson is not trusting empty-looking water" —
gives a `hurtFrame` a real job: showing that landing a hit during or right
after its lunge is possible, not just that the lunge itself is dangerous.

## The task
1. Check `assets/sheets/oracle-seasons-enemies.png` first for an existing
   recoil/stagger pose for the Anglerfry (`anglerfry_0`/`anglerfry_1` in
   `src/data/sprites-enemies.js` are the only frames mapped today via
   `tools/rip-enemies.py`; sourced from Cheep-Cheep per that file's own
   substitution note). Crop and actually look at neighbouring boxes on the
   sheet — the last three sessions in a row found nothing usable on their
   enemy's own plate, but check anyway rather than assuming a fourth time.
   If one exists, extract it through the ripper and re-emit — never
   hand-add a key to that generated file. If nothing fits, hand-draw it.
2. If hand-drawn: add `anglerfry_hurt` to the existing `ENEMY_HURT_ART`
   object in `src/data/sprites-enemies-hurt.js` (no new file, no
   `index.js` edit — same pattern as `siren_hurt`). Look at the actual
   character grid before picking eyes-shut vs. the unused-palette-slot
   fallback — don't assume either.
3. Add `'anglerfry_hurt'` to `sprite-manifest.js`'s `enemies` list (next
   to the `anglerfry_` entries).
4. Wire `hurtFrame: 'anglerfry_hurt'` onto `anglerfry`'s `defineEnemy`
   call in `src/data/enemies.js`.
5. Verify in-engine, the same shape as every prior session: hit
   `anglerfry` for less than its hp (a non-lethal hit) and confirm
   `spriteName()` returns `anglerfry_hurt` while `flicker > 0`, then
   confirm it reverts once flicker ends. Also confirm the `light: true`
   flag doesn't suppress or alter the hurt frame's visibility.

## Done means
- `anglerfry` shows a real staggered pose on a non-lethal hit, proven by
  an in-engine probe (a hit under its hp, confirm the sprite name, confirm
  the revert), not by reading the code.
- `node tools/check-drift.mjs` shows `anglerfry: walk,hurt`.
- `node tools/validate.mjs`, `node tools/test.mjs` pass. If
  `sprites-enemies.js` changed, `node tools/check-rippers.mjs` is 17/17.
- `npm run build`, `dist/oracle-of-tides.html` committed.
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines).

## Out of scope
- `anglerfry_death` — one state per enemy per session, same cadence as
  every prior session in this rotation.
- Re-testing the `hurtFrame`/`deathFrame` ordering — S17 already closed
  that question; do not spend this session re-verifying it.
- `attackFrame` or any engine field for it — still the separate, bigger
  redesign question (see `docs/prompts/LEDGER.md`).
- Rewriting `docs/ENEMIES.md`'s lessons — unrelated to this task.
