# Next session — give the Pincer a real hurtFrame

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/NEXT-SESSION.md`'s two newest entries (the `anglerfry_hurt` proof
  and the `siren_hurt` proof before it) — together they show that which
  "hurt" trick applies (eyes-shut recolour vs. an unused palette slot) is
  genuinely per-sprite, decided by looking at the actual character grid,
  not by pattern-matching the last one or two sessions.

## Why this, now
S12/S15/S17/S18/S19/S20/S21/S22 gave `hurtFrame` to `wisp`, `beetle`,
`wisp` again, `darknut`, `moblin`, `wizzrobe`, `siren`, `anglerfry` — eight
enemies now, one per session. `pincer` (hp 3, `src/data/enemies.js`)
clears the S12 hp rule (hp > `swordDamage()` 2) and is the last untouched
enemy with hp > 2 that isn't `stalfos` (which already has `deathFrame` —
see Out of scope). It is also mechanically distinct from every prior
target: it never moves from its hole, and its own `ai` already sets
`e.stun = 10` right before it lunges (a real, existing stun window this
session should look at, not invent). Its lesson in `docs/ENEMIES.md` —
"Never leaves its hole and always snaps exactly two tiles out and back, so
once you've measured that reach you can stand just outside it and punish
the recovery" — gives a `hurtFrame` a real job: showing that the punish
window the lesson describes (hitting it during its reach or its reel-back)
is a moment with a visible reaction, not just a hp number ticking down.

## The task
1. Check `assets/sheets/oracle-seasons-enemies.png` first for an existing
   recoil/stagger pose for the Pincer (`pincer_0`/`pincer_1` in
   `src/data/sprites-enemies.js` are the only frames mapped today via
   `tools/rip-enemies.py`). Crop and actually look at neighbouring boxes
   on the sheet — the last four sessions in a row found an exhausted
   plate for their enemy, but check anyway rather than assuming a fifth
   time. If one exists, extract it through the ripper and re-emit — never
   hand-add a key to that generated file. If nothing fits, hand-draw it.
2. If hand-drawn: add `pincer_hurt` to the existing `ENEMY_HURT_ART`
   object in `src/data/sprites-enemies-hurt.js` (no new file, no
   `index.js` edit — same pattern as `anglerfry_hurt`). Look at
   `pincer_0`'s actual character grid before picking eyes-shut (`darknut`/
   `moblin`/`anglerfry`'s case — a distinct colored or dark dot on a
   lighter face) vs. the unused-palette-slot fallback (`wizzrobe`/
   `siren`'s case — a masked/fanged face with no plain iris) — don't
   assume either from the creature's silhouette alone.
3. Add `'pincer_hurt'` to `sprite-manifest.js`'s `enemies` list (next to
   the `pincer_` entries).
4. Wire `hurtFrame: 'pincer_hurt'` onto `pincer`'s `defineEnemy` call in
   `src/data/enemies.js`.
5. Verify in-engine, the same shape as every prior session: hit `pincer`
   for less than its hp (a non-lethal hit) and confirm `spriteName()`
   returns `pincer_hurt` while `flicker > 0`, then confirm it reverts once
   flicker ends. `pincer` never leaves `terrain: 'any'`/its hole and has
   no `submerge()`-style hidden state, so no extra guard should be needed
   — confirm that's actually true rather than assuming it from this
   description.

## Done means
- `pincer` shows a real staggered pose on a non-lethal hit, proven by an
  in-engine probe (a hit under its hp, confirm the sprite name, confirm
  the revert), not by reading the code.
- `node tools/check-drift.mjs` shows `pincer: walk,hurt`.
- `node tools/validate.mjs`, `node tools/test.mjs` pass. If
  `sprites-enemies.js` changed, `node tools/check-rippers.mjs` is 17/17.
- `npm run build`, `dist/oracle-of-tides.html` committed.
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines).

## Out of scope
- `pincer_death` — one state per enemy per session, same cadence as every
  prior session in this rotation.
- `stalfos`'s reverse-order `hurtFrame` (it already has `deathFrame`) —
  a valid future target, but not more informative than a fresh enemy;
  pick it only once every hp>2 enemy without either field is done.
- Re-testing the `hurtFrame`/`deathFrame` ordering — S17 already closed
  that question; do not spend this session re-verifying it.
- `attackFrame` or any engine field for it — still the separate, bigger
  redesign question (see `docs/prompts/LEDGER.md`).
