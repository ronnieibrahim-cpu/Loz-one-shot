# Next session — give beetle a real deathFrame

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/NEXT-SESSION.md`'s S80 entry (`octorokSea` reusing `octorok_death`,
  the newest) — hp no longer orders which enemy is picked next (every
  remaining candidate is hp >= 3 with a `hurtFrame` already), so this
  session's target was picked for a specific reason: `beetle` is the first
  candidate with both `shield: 'front'` and a `charge()` AI together.

## Why this, now
Nine enemies have `deathFrame` already (`gel`/`keese`/`octorok`/`urchin`/
`crab`/`zol`/`leever`/`tektite`/`jellyfish`), plus `octorokSea` reusing
`octorok_death` (S80) — ten total. `beetle` (hp 3, `src/data/enemies.js`)
is next: it has `shield: 'front'` (a hit from the shielded side is blocked
outright, `Enemy.hurt()`, `src/game/enemy.js`) and `charge()` AI (rolls
into a ball and charges when it spots the player, using its own `_s0`/`_s1`
frames per the sheet's "upright when wandering, balled up when it
charges" comment already in `rip-enemies.py`). Neither interaction has
been tested against a lethal hit by this thread yet.

## The task
1. Check `assets/sheets/oracle-seasons-enemies.png`'s own "Spiked Beetle"
   plate (boxes 284-287 per `tools/rip-enemies.py`) for a collapse pose
   distinct from the four already used (`beetle_d0`/`d1`/`s0`/`s1`) and
   from `beetle_hurt` (`sprites-enemies-hurt.js`). `pip install pillow`
   first if needed, and run `python3 tools/rip-enemies.py` once unmodified
   to confirm it still reproduces byte-identically before changing
   anything.
2. If a real fifth frame exists: add it to `FRAMES` in `tools/rip-enemies.py`
   and re-emit. Never hand-add a key to `sprites-enemies.js`.
3. If nothing extractable exists: add `beetle_death` to `ENEMY_HURT_ART`
   (`sprites-enemies-hurt.js`), following the same "reuse/squash the live
   frames, invent nothing" discipline recent sessions used. `beetle` has
   `shield: 'front'`, unlike anything given a `deathFrame` so far — worth
   deciding whether the pose should read as the balled-up charge shape
   (`beetle_s0`/`s1`) uncurling, or the upright `beetle_d0`/`d1` shape
   collapsing, and saying which and why.
4. Add the new sprite name to `sprite-manifest.js`'s `enemies` list (if
   hand-drawn).
5. Wire `deathFrame: 'beetle_death'` onto `beetle`'s `defineEnemy` call.
6. Verify in-engine, in this order:
   - Confirm `beetle` has no `z` field.
   - A hit arriving at the SHIELDED front while `shield === 'front'` is
     blocked (`hurt()` returns `false`, `hp`/`dying` untouched) — confirm
     this still holds with a `deathFrame` wired, i.e. a shield block never
     lets a would-be-lethal hit through by accident.
   - A non-lethal hit from an unshielded angle (hp 3 -> 1, `swordDamage()`
     2) shows `beetle_hurt`, then reverts to the ordinary cycle — same
     two-hit shape `octorokSea` (S80) just proved, confirm it repeats here.
   - The lethal follow-up shows `beetle_death`, never `beetle_hurt`, held
     for the full `ENEMY_DEATH_FRAMES` stall, then `dead = true`.
7. Run `node tools/check-playthrough.mjs` and `node tools/replay.mjs`
   after everything else is green. Re-record whichever replay plan
   actually diverges (`node tools/replay.mjs --record <name>`) if one
   does — check rather than assume either outcome.

## Done means
- `beetle` shows a real collapse pose on the hit that kills it, proven by
  an in-engine probe, not by reading the code.
- `node tools/check-drift.mjs` shows `beetle: walk,hurt,death`.
- `node tools/validate.mjs`, `node tools/test.mjs` pass (83/83). If
  `sprites-enemies.js` changed, `node tools/check-rippers.mjs` is 17/17.
- `node tools/check-playthrough.mjs` is 21/21 and `node tools/replay.mjs`
  is 51/51 after this session's change, both confirmed by actually
  running them.
- `npm run build`, `dist/oracle-of-tides.html` committed.
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines), stating whether the pose was extracted or hand-drawn and why.

## Out of scope
- Any OTHER enemy's `deathFrame` — one enemy per session, same cadence
  this thread has kept for ten sessions straight.
- `bubble`, `beamos`, `barnacle` — all hp 999, effectively unkillable.
- Re-litigating `octorokSea`'s reuse decision (S80) — that's settled.
- `attackFrame` or any engine field for it — still the separate, bigger
  redesign question (see `docs/prompts/LEDGER.md`).
