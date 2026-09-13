# Next session — give moblin a real deathFrame

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/NEXT-SESSION.md`'s S84 entry (`pincer_death`, the newest) — the
  first target in a few sessions to turn out exactly as plain as it
  looked going in, after `tektite`/`darknut`/`wizzrobe` each found a real
  complication or extraction surprise. Check `moblin` properly anyway —
  plainness has been the exception lately, not the rule.

## Why this, now
Fourteen enemies have `deathFrame` already. `moblin` (hp 4, `src/data/
enemies.js`, "throws spears, retreats when close") is next: no `shield`,
no `submerge()`, no `hop()` — the last plain LAND enemy before only
water/`submerge()` repeats (`anglerfry`, `siren`) are left in the roster.
It's also the first hp-4 target: two hits at `swordDamage()` 2 (4 -> 2 ->
0), the same shape `octorokSea`/`beetle` already proved at hp 3, now one
notch higher.

## The task
1. Check `assets/sheets/oracle-seasons-enemies.png`'s own "Moblin" plate
   for a collapse pose distinct from the six already used
   (`moblin_d0`/`d1`, `moblin_u0`/`u1`, `moblin_s0`/`s1`) and from
   `moblin_hurt` (`sprites-enemies-hurt.js`). `moblin_u0`/`u1` are already
   hand-drawn (`HAND_ART` in `tools/rip-enemies.py` — the sheet has no
   back view), so check whether a death pose needs to be hand-drawn for
   the same reason, or whether the front/side views leave something
   extractable. `pip install pillow` first if needed, and run
   `python3 tools/rip-enemies.py` once unmodified to confirm it still
   reproduces byte-identically before changing anything.
2. If a real extra frame exists: add it to `FRAMES` in `tools/rip-enemies.py`
   and re-emit. Never hand-add a key to `sprites-enemies.js`.
3. If nothing extractable exists: add `moblin_death` to `ENEMY_HURT_ART`
   (`sprites-enemies-hurt.js`), following the same "reuse/squash the live
   frames, invent nothing" discipline recent sessions used — pick which
   live frame to squash (front `moblin_d0` vs. side `moblin_s0`) and say
   why.
4. Add the new sprite name to `sprite-manifest.js`'s `enemies` list (if
   hand-drawn).
5. Wire `deathFrame: 'moblin_death'` onto `moblin`'s `defineEnemy` call.
6. Verify in-engine, in this order:
   - Confirm `moblin` has no `z` field.
   - Non-lethal hit (hp 4 -> 2, `swordDamage()` 2) shows `moblin_hurt`
     and reverts to the walk cycle once the flicker window ends, `dying`
     false throughout.
   - The lethal follow-up (hp 2 -> 0) shows `moblin_death`, never
     `moblin_hurt`, held for the full `ENEMY_DEATH_FRAMES` stall, then
     `dead = true`.
   - `moblin` flees when the player gets close (`flee()`) and shoots a
     spear when aligned — confirm the death pose isn't somehow tied to a
     mid-flee or mid-shoot animation state in a way that looks wrong;
     check rather than assume this is a non-issue just because prior
     plain targets had none.
7. Run `node tools/check-playthrough.mjs` and `node tools/replay.mjs`
   after everything else is green. Re-record whichever replay plan
   actually diverges (`node tools/replay.mjs --record <name>`) if one
   does.

## Done means
- `moblin` shows a real collapse pose on the hit that kills it, proven by
  an in-engine probe, not by reading the code.
- `node tools/check-drift.mjs` shows `moblin: walk,hurt,death`.
- `node tools/validate.mjs`, `node tools/test.mjs` pass (83/83). If
  `sprites-enemies.js` changed, `node tools/check-rippers.mjs` is 17/17.
- `node tools/check-playthrough.mjs` is 21/21 and `node tools/replay.mjs`
  is 51/51 after this session's change, both confirmed by actually
  running them.
- `npm run build`, `dist/oracle-of-tides.html` committed.
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines).

## Out of scope
- Any OTHER enemy's `deathFrame` — one enemy per session, same cadence
  this thread has kept for fourteen sessions straight.
- `bubble`, `beamos`, `barnacle` — all hp 999, effectively unkillable.
- `anglerfry`/`siren` — next in line after this session, not this one.
- `attackFrame` or any engine field for it — still the separate, bigger
  redesign question (see `docs/prompts/LEDGER.md`).
