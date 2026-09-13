# Next session — hand-draw wizzrobe's attackFrame

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/NEXT-SESSION.md`'s S91 entry (the newest) — `wisp_atk` landed by
  widening an existing hand-drawn grin rather than reusing a walk frame,
  and explains why the walk-frame-reuse shortcut was rejected for `wisp`
  specifically. `wizzrobe` is next.

## Why this, now
`wizzrobe` (`src/data/enemies.js`) is the plainest of the 2 remaining
candidates: hp 3, damage 3, `pal: 'enemyp'`, `frames: ['wizzrobe_0',
'wizzrobe_1']`, blinks in and out via `submerge()` and fires a single
aimed `shoot()` (not `shootRing()`) while up. Its THIRD sheet frame
(`wizzrobe_death`, `sprites-enemies.js`) is already extracted and
already spent on `deathFrame` — confirmed at S83, re-confirmed in S89's
survey — so there is nothing left on the sheet and this is a from-
scratch hand-draw, same as `octorok_atk` (S90) and `wisp_atk` (S91).
`wizzrobe_hurt` (`sprites-enemies-hurt.js`) already exists: it uses the
sprite's otherwise-unused third palette colour (index 2, `enemyp`'s own
mid-tone) for a small bruise mark on the right cheek, specifically
because the usual "shut the eyes" trick would vanish against this
sprite's dark visor. Read that comment before drawing — it names which
part of the face is already spoken for and which colour index is free.

## The task
1. Confirm `wizzrobe`'s real spec fields directly from `enemies.js`
   rather than trusting this file's summary — `hp`, `damage`, `pal`,
   the `submerge()` timings, and the `shoot()` call inside `whileUp`.
2. Re-confirm nothing extractable exists for an attack pose specifically
   — re-check the sheet plate `wizzrobe_0`/`wizzrobe_1`/`wizzrobe_death`
   came from with an attack telegraph in mind, not just trusting S89's
   summary. `python3 tools/rip-enemies.py` once unmodified first to
   confirm byte-identical reproduction before touching anything.
3. Render `wizzrobe_0`, `wizzrobe_1`, `wizzrobe_death` and the existing
   `wizzrobe_hurt` from their real runtime `enemyp` palette
   (`src/gfx/palettes.js`) to PNGs before drawing — the technique S90/
   S91 both used and both found essential for reading the actual shape
   rather than misreading the raw digit grid.
4. Read `CLAUDE.md`'s art rules section: three colours plus
   transparency, hard 1px outline, no anti-aliasing/gradients/dithering,
   silhouette-first. Not a collapse (that's `_death`'s exception) — read
   as "about to fire" while staying recognisably `wizzrobe_0`, the way
   `wizzrobe_hurt` stays silhouette-close to it.
5. Design the edit against a part of the sprite `wizzrobe_hurt` has NOT
   already used (it used the visor cheek + palette index 2). `wizzrobe`
   fires a single aimed orb via `shoot()`, so a telegraph that reads as
   "hands/staff raised" or "eyes/orb glowing before the cast" fits
   better than a mouth-based one (that grammar is already `wisp`'s).
6. Add `wizzrobe_atk` to `ENEMY_HURT_ART` in `sprites-enemies-hurt.js`
   (next to `wizzrobe_hurt`) and to `sprite-manifest.js`'s `enemies`
   list. Wire `attackFrame: 'wizzrobe_atk'` on `wizzrobe`'s
   `defineEnemy` call — a plain string, since `frames` here is a flat
   array with no facings.
7. Verify in-engine with a scratch Playwright probe (not committed, same
   shape as S90/S91's own): `shoot()` sets `attackTime` and shows
   `wizzrobe_atk` immediately, holds for `ENEMY_ATTACK_FRAMES`, reverts
   correctly. Test the interrupt case: `wizzrobe` HAS `hurtFrame`, so a
   mid-attack non-lethal hit should show `wizzrobe_hurt`, not the attack
   pose — confirm directly. Also confirm, rather than assume, that
   `attackTime` set while `submerge()` has the enemy hidden (down phase)
   does not draw anything wrong — `wizzrobe_hurt`'s own comment notes
   `invuln` is forced to 9999 while hidden so `hurtFrame` can never show
   then; check whether `attackFrame` needs the same reasoning applied or
   whether `shoot()` only ever fires during the up phase already (it
   does, per `whileUp` — confirm this makes the question moot rather
   than assuming it).
8. Run the full regression sweep: `validate.mjs`, `test.mjs` (83/83),
   `check-feel.mjs`, `check-playthrough.mjs` (21/21), `replay.mjs`
   (51/51) — re-record anything that diverges — `check-rippers.mjs`
   (17/17, should stay untouched) — `check-build.mjs`.

## Done means
- `wizzrobe` shows a real, distinct attack pose while actually firing,
  proven by an in-engine probe, not by reading the code.
- `node tools/check-drift.mjs` shows `wizzrobe: walk,attack,hurt,death`
  (4 of 22 complete, up from 3).
- `node tools/validate.mjs`, `node tools/test.mjs` (83/83),
  `node tools/check-feel.mjs`, `node tools/check-playthrough.mjs`
  (21/21), `node tools/replay.mjs` (51/51), `node tools/check-rippers.mjs`
  (17/17) all pass.
- `npm run build`, `dist/oracle-of-tides.html` committed.
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines).

## Out of scope
- `siren` — the last enemy still needing new attack art. One enemy per
  session, same cadence this whole objective has kept.
- `idle` states — still the separate, much larger undertaking noted in
  `docs/ENEMIES.md`'s own header.
- Redrawing `wizzrobe_hurt` or `wizzrobe_death` — they stay exactly as
  they are; this session only adds a third, new pose alongside them.
- Any change to `submerge()`'s or `shoot()`'s own mechanics or damage —
  this is an art and wiring task, not a balance one.
