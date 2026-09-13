# Next session — hand-draw wisp's attackFrame

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/NEXT-SESSION.md`'s S90 entry (the newest) — `octorok_atk` landed
  as a single non-directional pose, with the reasoning for that choice
  written out. `wisp` is next; the same "one pose, not per-facing"
  question does not apply here since `wisp`'s own `frames` is a plain
  array (no facings at all), so that decision is already made for you.

## Why this, now
`wisp` (hp 999... no — check `src/data/enemies.js`, it is NOT hp 999,
confirm the real value) already has both `hurtFrame` (`wisp_hurt`) and
`deathFrame` (`wisp_death`) hand-drawn in `sprites-enemies-hurt.js`, so
unlike `octorok_atk` this session has an established per-creature
grammar to extend rather than invent: `wisp_hurt`'s own comment
describes the "same spiky halo silhouette, squinted eyes, wide grin
pulled to a wince" pattern, and `wisp_death`'s comment describes how the
halo collapses for death. An attack pose needs its own third variation
in that same family — not a squint (that's `_hurt`) and not a collapse
(that's `_death`).

## The task
1. Confirm `wisp`'s real spec fields (`hp`, `frames`, `pal`) directly
   from `src/data/enemies.js` rather than trusting this file's guess
   above.
2. Re-confirm nothing extractable exists for `wisp` before drawing — S89
   already checked this (its substitution source, "Spark", has exactly 2
   frames on its own plate, both used as `wisp_0`/`wisp_1`), but confirm
   it yourself from the actual sheet. `pip install pillow` first if
   needed; render `wisp_0`'s ASCII grid (`sprites-enemies.js`) to a PNG
   the way S90 did (small standalone script, palette hex -> pixels) so
   you are looking at the shape rather than reading digits blind — that
   technique is what made S90's edit legible on the first try. Then run
   `python3 tools/rip-enemies.py` once unmodified to confirm
   byte-identical reproduction before touching anything.
3. Read `CLAUDE.md`'s art rules section before drawing: three colours
   plus transparency, a hard 1px black outline, no
   anti-aliasing/gradients/dithering, silhouette-first. An attack pose is
   NOT a collapse (that's `_death`'s own exception) — it needs to read as
   "about to fire a spark" while staying recognisably `wisp`, closer to
   how `wisp_hurt` stays silhouette-close to `wisp_0`.
4. Design the actual edit against the rendered PNG, not the raw grid.
   `wisp` shoots via `shootRing()` (confirm in `enemies.js`) — the
   telegraph is a wind-up before firing a ring of orbs, not a
   directional throw, so the read to aim for is something like "the
   halo brightens/widens" or "the grin opens wider" rather than a
   pointing gesture. Look at what's actually free to change: `wisp_hurt`
   already used the eyes and grin; find a part of the silhouette neither
   `_hurt` nor `_death` has touched yet.
5. Add `wisp_atk` to `ENEMY_HURT_ART` in `sprites-enemies-hurt.js` (next
   to `wisp_hurt`/`wisp_death` for locality) and to
   `sprite-manifest.js`'s `enemies` list.
6. Wire `attackFrame: 'wisp_atk'` on `wisp`'s `defineEnemy` call
   (`src/data/enemies.js`) — a plain string, since `wisp`'s `frames` is
   a flat array with no facings.
7. Verify in-engine with a scratch Playwright probe (not committed, same
   shape as S90's own — see `docs/NEXT-SESSION.md`'s S90 entry for the
   pattern): `shootRing()` sets `attackTime` and shows `wisp_atk`
   immediately, holds for the full `ENEMY_ATTACK_FRAMES` (16f), then
   reverts to the ordinary walk cycle. Also test the interrupt case:
   `wisp` HAS `hurtFrame`, so (unlike `octorok`) a mid-attack non-lethal
   hit should show `wisp_hurt` instead, per `spriteName()`'s existing
   `dying > hurtFrame > attackFrame > walk` order — confirm this
   directly rather than assuming S90's `octorokSea` result carries over.
   Confirm whether `wisp` has a `z`/`terrain: 'air'` complication before
   drawing (it does have `z: 8` per S26/S17's own notes on it — check
   whether that affects anything about an attack pose the way it did for
   `keese`'s `_death`).
8. Run the full regression sweep: `validate.mjs`, `test.mjs` (83/83),
   `check-feel.mjs`, `check-playthrough.mjs` (21/21), `replay.mjs`
   (51/51) — re-record anything that diverges — `check-rippers.mjs`
   (17/17, should be untouched — hand-drawn only) — `check-build.mjs`.

## Done means
- `wisp` shows a real, distinct attack pose while actually firing its
  ring of orbs, proven by an in-engine probe, not by reading the code.
- `node tools/check-drift.mjs` shows `wisp: walk,attack,hurt,death` (3
  of 22 complete, up from 2).
- `node tools/validate.mjs`, `node tools/test.mjs` (83/83),
  `node tools/check-feel.mjs`, `node tools/check-playthrough.mjs`
  (21/21), `node tools/replay.mjs` (51/51), `node tools/check-rippers.mjs`
  (17/17) all pass.
- `npm run build`, `dist/oracle-of-tides.html` committed.
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines).

## Out of scope
- `wizzrobe`, `siren` — the other 2 enemies still needing new attack art.
  One enemy per session, same cadence this whole objective has kept.
- `idle` states — still the separate, much larger undertaking noted in
  `docs/ENEMIES.md`'s own header.
- Redrawing `wisp_hurt` or `wisp_death` — they stay exactly as they are;
  this session only adds a third, new pose alongside them.
- Any change to `shootRing()`'s own mechanics or damage — this is an art
  and wiring task, not a balance one.
