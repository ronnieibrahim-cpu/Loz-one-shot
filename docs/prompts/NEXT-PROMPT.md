# Next session — give zol a real deathFrame

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/NEXT-SESSION.md`'s S29 entry (`crab_death`, the newest) IN FULL —
  it surfaced a significant, unresolved finding: giving an enemy a
  `deathFrame` defers `Entity.die()` (and everything inside it — `onDie`,
  loot drops) by `ENEMY_DEATH_FRAMES` (~16 frames), because
  `Enemy.die()` sets `dying = true` and returns early rather than calling
  `super.die(game)` immediately (`src/game/enemy.js`, read it). That
  finding was never chased (no detour token spent) but this session's own
  target makes it directly relevant, not incidental — see below.

## Why this, now
S26-S29 gave `deathFrame` to `keese`, `octorok`, `urchin`, `crab` — all hp
<= 2, `deathFrame`-only enemies with plain `onDie`/drop behaviour. `zol`
(hp 2, `src/data/enemies.js`) is different in a way that makes it the
right next target rather than an arbitrary pick: its `onDie` SPAWNS TWO
NEW ENTITIES (two `gel`s, split to either side, unless `e.opts.split` is
already true) — a real, observable gameplay effect, not just a loot roll.
Giving `zol` a `deathFrame` will defer that split by the same
`ENEMY_DEATH_FRAMES` window S29's finding describes, and this session
should verify that split still happens correctly (right position, right
timing relative to the stall) rather than assume the deferral is
harmless. This is a controlled, single-enemy way to build real evidence
about the mechanism S29 only theorised about — not a detour into
`check-playthrough.mjs` itself (out of scope, see below), just a more
careful verification of THIS enemy's own `deathFrame` addition than prior
sessions needed.

## The task
1. Check `assets/sheets/oracle-seasons-enemies.png`'s own source plate for
   `zol_0`/`zol_1` (per `tools/rip-enemies.py`, wherever those indices
   point — find the actual plate by cropping, don't guess the label from
   this prompt) for a collapse/splat pose. Look for a Zol-appropriate
   defeat pose (slimes typically flatten or dissolve) rather than
   assuming the plate is or isn't empty.
2. If one exists: add it to `FRAMES` in `tools/rip-enemies.py` and
   re-emit. Never hand-add a key to `sprites-enemies.js`.
3. If hand-drawn: add `zol_death` to `ENEMY_HURT_ART`
   (`sprites-enemies-hurt.js`, no new file). Read the file's own header on
   the `_death` exception (silhouette may change) — `gel_death` (S16,
   same file) is a close relative in spirit (`zol` splits INTO `gel` on
   death) and worth reading before drawing, though `zol_0`'s own
   silhouette should decide the actual shape, not an assumption that it
   should look like `gel_death`.
4. Add the new sprite name to `sprite-manifest.js`'s `enemies` list.
5. Wire `deathFrame: 'zol_death'` onto `zol`'s `defineEnemy` call —
   alongside its existing `onDie`, not replacing it.
6. Verify in-engine, same shape as every prior `deathFrame` session, PLUS
   the split-specific check this session exists for: spawn `zol`, hit it
   for its full hp (lethal, hp 2 -> 0), confirm `spriteName()` returns
   `zol_death` while `dying` is true, and confirm NO `gel` has spawned yet
   during the stall (per `Enemy.die()`'s own deferral). Then run the
   entity's `update()` through the full `ENEMY_DEATH_FRAMES` stall and
   confirm: (a) `onDie` fires exactly once when the stall ends, (b)
   exactly two `gel` entities are spawned, one at `+ENEMY_GRID_STEP` and
   one at `-ENEMY_GRID_STEP` from the zol's `x` — the SAME x it died at,
   since `dying` freezes position — and (c) neither of those two `gel`s
   themselves carries `opts.split` incorrectly (confirm they DO carry
   `split: true`, per the existing `onDie` code, so THEY don't
   recursively split again). Confirm `zol` has no `z` field before
   deciding pose placement.

## Done means
- `zol` shows a real collapse pose on the hit that kills it, AND still
  correctly splits into two `gel`s after the stall (not during it, not
  zero, not more than two), proven by an in-engine probe that checks both
  halves — not by reading the code.
- `node tools/check-drift.mjs` shows `zol: walk,death`.
- `node tools/validate.mjs`, `node tools/test.mjs` pass. If
  `sprites-enemies.js` changed, `node tools/check-rippers.mjs` is 17/17.
- `npm run build`, `dist/oracle-of-tides.html` committed.
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines).

## Out of scope
- Investigating or fixing S29's `check-playthrough.mjs` essence finding
  (the missing D1 essence, `s.essences` = `[2]` not `[1, 2]`) — that is
  the detour-token-gated item this session is explicitly NOT picking up.
  Verifying `zol`'s own split timing is in scope; re-running or debugging
  `check-playthrough.mjs` itself is not.
- Any OTHER enemy's `deathFrame` — one enemy per session, same cadence
  this thread has kept for five sessions straight.
- `bubble`, `beamos`, `barnacle` — all hp 999, effectively unkillable.
- Redesigning `zol`'s hop AI or its split mechanic — this session only
  adds visual death feedback and confirms the existing split still works
  under the `deathFrame` stall.
- `attackFrame` or any engine field for it — still the separate, bigger
  redesign question (see `docs/prompts/LEDGER.md`).
