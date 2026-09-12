# Next session — give urchin a real deathFrame

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/NEXT-SESSION.md`'s `octorok_death` entry (S27, the newest) — it
  applied S26's `z`-height lesson correctly on the first try (confirmed no
  `z` field before drawing a low-in-the-cell pose) rather than repeating
  S26's own mistake. `urchin` also has no `z` field
  (`src/data/enemies.js`), so the same "ground pose is safe" reasoning
  should apply — confirm it from the code, don't just cite this bullet.

## Why this, now
S26/S27 opened the `deathFrame` branch on `keese` and `octorok` (both hp
<= 2, both `deathFrame`-only since `hurtFrame` needs hp > `swordDamage()`
2). `urchin` (hp 2, `terrain: 'any'`, `src/data/enemies.js`) is the next
hp-2 enemy without a `deathFrame`, and it was explicitly flagged at S26 as
worth testing because of ITS OWN height quirk: unlike `keese` (a constant
`z: 8`), `urchin` has no `z` field but does have `shield: 'front'` and a
tide-gated `ai()` (`if (g.tide.level >= 1) wander(...)`) — it sits
motionless and harmless until the tide covers it, then drifts. That's a
different kind of "special state" question than height, and this session
should check whether a lethal hit while `urchin` is still in its
motionless/harmless pre-tide state behaves any differently than one while
it's drifting, rather than assuming the mechanism is identical to every
prior `deathFrame` target just because the code path (`dying`/`deathFrame`)
is shared.

## The task
1. Check `assets/sheets/oracle-seasons-enemies.png`'s own source plate for
   `urchin_0`/`urchin_1` — per `tools/rip-enemies.py`'s own comment,
   `urchin` ("spiky ball," original to this game) substitutes Spiny
   Beetle art (indices 292/293). Look at that plate specifically for a
   collapse/burst pose, the same discipline every prior session applied —
   do not assume it is empty because most recent sessions' plates were.
2. If one exists: add it to `FRAMES` in `tools/rip-enemies.py` and
   re-emit. Never hand-add a key to `sprites-enemies.js`.
3. If hand-drawn: add `urchin_death` to `ENEMY_HURT_ART`
   (`sprites-enemies-hurt.js`, no new file). Read the file's own header on
   the `_death` exception (silhouette may change) and look at
   `urchin_0`'s actual grid before deciding the shape — a "spiky ball"
   bursting or deflating is a different silhouette problem than a
   humanoid's collapse or a bat's droop; don't reuse either of those
   templates by default.
4. Add the new sprite name to `sprite-manifest.js`'s `enemies` list.
5. Wire `deathFrame: 'urchin_death'` onto `urchin`'s `defineEnemy` call.
6. Verify in-engine: confirm `urchin` has no `z` field (read the code, per
   S27's own discipline) before deciding the pose sits low in the cell.
   Then run TWO lethal-hit probes, not one: (a) hit it for its full hp
   while `g.tide.level` is 0 (its motionless/harmless pre-tide state —
   check whether `hurt()` even connects at that point, since "harmless"
   might mean something stronger than just "doesn't move"), and (b) hit
   it for its full hp with `g.tide.level >= 1` (its normal drifting
   state). Confirm `spriteName()` returns `urchin_death` and the
   `dying`/`deathTime` stall behaves the same way in both cases — or
   document precisely how it differs, if it does.

## Done means
- `urchin` shows a real collapse pose on the hit that kills it in BOTH
  tide states, proven by two in-engine probes, not by reading the code.
- `node tools/check-drift.mjs` shows `urchin: walk,death`.
- `node tools/validate.mjs`, `node tools/test.mjs` pass. If
  `sprites-enemies.js` changed, `node tools/check-rippers.mjs` is 17/17.
- `npm run build`, `dist/oracle-of-tides.html` committed.
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines).

## Out of scope
- Any OTHER enemy's `deathFrame` — one enemy per session, same cadence
  the `hurtFrame` thread kept for eleven sessions straight.
- `bubble`, `beamos`, `barnacle` — all hp 999, effectively unkillable by
  normal play (S27's own out-of-scope note explains why these are skipped
  for `deathFrame` targets).
- Redesigning `urchin`'s `shield: 'front'` mechanic or its tide-gated
  `ai()` — this session only adds visual death feedback, it does not
  touch the enemy's actual behaviour.
- `attackFrame` or any engine field for it — still the separate, bigger
  redesign question (see `docs/prompts/LEDGER.md`).
