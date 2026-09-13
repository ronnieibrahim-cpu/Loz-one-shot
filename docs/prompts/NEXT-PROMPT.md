# Next session — give tektite a real deathFrame

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/NEXT-SESSION.md`'s S77 entry (`leever_death`, the newest) — it
  confirms the playthrough-timing fix from S76 held under one more
  `deathFrame` addition. Also worth noting: `leever` is not one of the
  densely-placed enemies (`crab`/`zol` were); this session's own target
  should still run `check-playthrough.mjs` for real rather than assume
  the fix generalises to every enemy just because it held twice.

## Why this, now
S26-S32 gave `deathFrame` to `keese`, `octorok`, `urchin`, `crab`, `zol`,
`leever` — seven enemies now including `gel`. `tektite` (hp 2,
`terrain: 'any'`, `src/data/enemies.js`) is the next hp <= 2 enemy without
one, and has no submerge/height quirk to verify — a plainer target after
several sessions in a row that each needed a non-trivial verification
wrinkle (`urchin`'s tide states, `crab`'s three-attempt art, `zol`'s split
timing, `leever`'s submerge halves). Confirm that plainness rather than
assume it — check its `ai()` and spec fields before drawing, the same way
every prior session checked rather than assumed.

## The task
1. Check `assets/sheets/oracle-seasons-enemies.png`'s own source plate for
   `tektite_0`/`tektite_1` (per `tools/rip-enemies.py`, wherever those
   indices point — find the actual plate by cropping, don't guess the
   label from this prompt) for a collapse pose distinct from what's
   already used. `leever` (S32) found a real third frame after several
   sessions in a row found nothing — check properly rather than assuming
   either outcome.
2. If one exists: add it to `FRAMES` in `tools/rip-enemies.py` and
   re-emit. Never hand-add a key to `sprites-enemies.js`.
3. If hand-drawn: add `tektite_death` to `ENEMY_HURT_ART`
   (`sprites-enemies-hurt.js`, no new file). Read the file's own header on
   the `_death` exception (silhouette may change) and look at
   `tektite_0`'s actual grid before choosing a shape.
4. Add the new sprite name to `sprite-manifest.js`'s `enemies` list.
5. Wire `deathFrame: 'tektite_death'` onto `tektite`'s `defineEnemy` call.
6. Verify in-engine: confirm `tektite` has no `z` field and no hidden/
   submerge state before deciding pose placement and the verification
   shape — don't assume "plain" from this prompt's own framing, confirm
   it from `src/data/enemies.js` directly. Lethal hit (hp 2 -> 0), confirm
   `spriteName()` returns `tektite_death` while `dying`, held for
   `ENEMY_DEATH_FRAMES`, then `dead = true`.
7. Run `node tools/check-playthrough.mjs` and `node tools/replay.mjs`
   after everything else is green. Both should still be fully green
   (21/21 and 51/51 respectively, per S76's fix) — if either goes red,
   that is this session's own fault and fixing it is in scope, not a
   known-bad baseline to report around.

## Done means
- `tektite` shows a real collapse pose on the hit that kills it, proven
  by an in-engine probe, not by reading the code.
- `node tools/check-drift.mjs` shows `tektite: walk,death`.
- `node tools/validate.mjs`, `node tools/test.mjs` pass (83/83). If
  `sprites-enemies.js` changed, `node tools/check-rippers.mjs` is 17/17.
- `node tools/check-playthrough.mjs` is 21/21 and `node tools/replay.mjs`
  is 51/51 after this session's change, both confirmed by actually
  running them, not assumed.
- `npm run build`, `dist/oracle-of-tides.html` committed.
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines).

## Out of scope
- Any OTHER enemy's `deathFrame` — one enemy per session, same cadence
  this thread has kept for seven sessions straight.
- `bubble`, `beamos`, `barnacle` — all hp 999, effectively unkillable.
- Re-investigating the playthrough-timing mechanism S76 already closed —
  running the two checkers and reporting their result is in scope;
  re-deriving why they pass or fail is not, unless one actually goes red.
- `attackFrame` or any engine field for it — still the separate, bigger
  redesign question (see `docs/prompts/LEDGER.md`).
