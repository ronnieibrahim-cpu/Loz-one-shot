# Next session — give crab a real deathFrame

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/NEXT-SESSION.md`'s `urchin_death` entry (S28, the newest) — it
  found a REAL extraction (a fifth frame on the "Spiny Beetle" plate, one
  session after `octorok_death` hand-drew because its own plate genuinely
  had nothing spare). The lesson isn't "expect to find one" or "expect not
  to" — it's that each plate is its own question and the last session's
  outcome predicts nothing about this one's.

## Why this, now
S26-S28 gave `deathFrame` to `keese`, `octorok` (land), and `urchin` — all
hp <= 2 enemies for which `deathFrame` is their only possible combat
feedback (`swordDamage()` 2 means any hit is lethal). `crab` (hp 2,
`terrain: 'shallow'`, `src/data/enemies.js`) is the next such enemy
without one. It has `shield: 'front'` (like `urchin`, though the shield
mechanic itself is out of scope here) and a `patrol()`-based `ai()`
rather than `wander()` — a different movement pattern, not that this
should change how `deathFrame` itself is verified, but worth noting this
is genuinely a different enemy, not a re-skin of the last three.

## The task
1. Check `assets/sheets/oracle-seasons-enemies.png`'s own source plate for
   `crab_0`/`crab_1` (per `tools/rip-enemies.py`, indices 280/281 — find
   the actual creature name on the sheet by cropping around those boxes,
   the same way every prior session did, rather than assuming the label
   from this prompt). Look for a collapse/flip pose specifically — a crab
   flipped onto its back or its shell cracked open reads naturally as
   defeated, if the sheet happens to have anything like it.
2. If one exists: add it to `FRAMES` in `tools/rip-enemies.py` and
   re-emit. Never hand-add a key to `sprites-enemies.js`.
3. If hand-drawn: add `crab_death` to `ENEMY_HURT_ART`
   (`sprites-enemies-hurt.js`, no new file). Read the file's own header on
   the `_death` exception (silhouette may change) and look at `crab_0`'s
   actual grid before choosing a shape — a "flipped on its back" or
   "shell cracked" read is likely more apt for a crab than the squash/
   flatten template `octorok_death` used, but check the actual silhouette
   before assuming that.
4. Add the new sprite name to `sprite-manifest.js`'s `enemies` list.
5. Wire `deathFrame: 'crab_death'` onto `crab`'s `defineEnemy` call.
6. Verify in-engine: confirm `crab` has no `z` field before deciding
   whether the pose should sit low in the cell (S26's lesson: check this
   per-enemy, don't assume). Hit it for its full hp (lethal, hp 2 -> 0)
   and confirm `spriteName()` returns `crab_death` while `dying`, held for
   `ENEMY_DEATH_FRAMES`, then confirm `dead` becomes true.

## Done means
- `crab` shows a real collapse pose on the hit that kills it, proven by
  an in-engine probe, not by reading the code.
- `node tools/check-drift.mjs` shows `crab: walk,death`.
- `node tools/validate.mjs`, `node tools/test.mjs` pass. If
  `sprites-enemies.js` changed, `node tools/check-rippers.mjs` is 17/17.
- `npm run build`, `dist/oracle-of-tides.html` committed.
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines).

## Out of scope
- Any OTHER enemy's `deathFrame` — one enemy per session, same cadence
  this thread has kept for four sessions straight (and `hurtFrame` kept
  for eleven before it).
- `bubble`, `beamos`, `barnacle` — all hp 999, effectively unkillable by
  normal play. Still skipped for the same reason S27 gave.
- Redesigning `crab`'s `shield: 'front'` mechanic or its `patrol()`
  movement — this session only adds visual death feedback.
- `attackFrame` or any engine field for it — still the separate, bigger
  redesign question (see `docs/prompts/LEDGER.md`).
