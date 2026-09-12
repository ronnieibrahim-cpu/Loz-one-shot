# Next session — give the Gel a real deathFrame at hp 1

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/NEXT-SESSION.md`'s two newest entries (the `beetle_hurt` landing,
  and its own pointer to "pick an enemy not yet touched ... hp anything at
  all for a `deathFrame`") — they name this session's target directly.

## Why this, now
S12/S13/S15 have now each proven one mechanism once: `hurtFrame` on
`wisp` and `beetle`, `deathFrame` on `stalfos`. `docs/prompts/LEDGER.md`'s
"Measured and rejected" section records a specific claim: unlike
`hurtFrame`, `deathFrame` has NO hp-vs-`swordDamage()` constraint, because
`Enemy.die()` (not `hurt()`) defers removal, and `die()` only ever runs on
the hit that actually reaches hp 0 regardless of how many hits that took.
That claim has only been exercised on `stalfos` (hp 3) so far — every
enemy tried on `deathFrame` has coincidentally had hp above the hp-1/2
cutoff `hurtFrame` needs. `gel` (hp 1, `src/data/enemies.js`) is the sharp
test: it was explicitly ruled OUT for `hurtFrame` in S12 (1-hp enemies are
removed the same frame they take their only hit, before a flicker window
ever renders), and giving it a `deathFrame` instead proves the two
mechanisms really do have different rules, not just probes the one that
happens to always pass.

## The task
1. Check `assets/sheets/oracle-seasons-enemies.png` first for an existing
   squashed/splat pose for the Zol/Gel family. `gel_0`/`gel_1`
   (`src/data/sprites-enemies.js`) are the only two frames mapped today
   (`tools/rip-enemies.py`); if a third distinct pose exists nearby on the
   sheet, extract it through the ripper. If nothing fits, hand-draw it.
2. If hand-drawn: add `gel_death` to `ENEMY_HURT_ART` in the existing
   `src/data/sprites-enemies-hurt.js` (no new file, no `index.js` edit).
   `gel` is a small round blob occupying only rows 4-9 of its 16x16 cell
   (see `gel_0` in `sprites-enemies.js`) — a death pose is allowed to
   change shape (S13's own rule for `_death` frames, unlike `_hurt`), so a
   flattened, wider splat spread lower in the cell reads clearly as "this
   blob got squashed" without needing to preserve the round silhouette.
3. Add `'gel_death'` to `sprite-manifest.js`'s `enemies` list (next to the
   `gel_` entries).
4. Wire `deathFrame: 'gel_death'` onto `gel`'s `defineEnemy` call in
   `src/data/enemies.js`. Do NOT add a comment claiming an hp constraint —
   there isn't one for `deathFrame` (see "Why this, now"); if you want a
   note, say the opposite: this is hp 1, deliberately, to test that.
5. Verify in-engine, the way S13 verified `stalfos`: kill `gel` with a
   single hit (hp 1, any damage >= 1) and confirm `spriteName()` returns
   `gel_death` for `ENEMY_DEATH_FRAMES` (16) frames while the entity is
   still in `game.entities` and `remove` is still false, then confirm it
   is actually removed afterward. A screenshot is worth taking if you can
   get one.

## Done means
- `gel` (hp 1) shows a real death pose before removal, proven by an
  in-engine probe that kills it in one hit — the sharp version of the
  hp-1 test S12 already ran (and failed) for `hurtFrame`.
- `node tools/check-drift.mjs` shows `gel: walk,death`.
- `node tools/validate.mjs`, `node tools/test.mjs` pass. If
  `sprites-enemies.js` changed, `node tools/check-rippers.mjs` is 17/17.
- `npm run build`, `dist/oracle-of-tides.html` committed.
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines); note in it that this specifically tested the hp-1 case for
  `deathFrame` and what happened.

## Out of scope
- `gel_hurt` — already ruled out by S12 (hp 1 can never show a
  `hurtFrame`); do not attempt it or "explain around" the constraint.
- `zol` — related enemy, but its own state is a separate task; one enemy
  per session, same cadence as S12/S13/S15.
- `attackFrame` or any engine field for it — still the separate, bigger
  redesign question; do not start it.
- Any change to `check-drift.mjs` or `enemy.js`'s core mechanisms — S13/S14
  already built and fixed what this session needs; this is art + wiring.
