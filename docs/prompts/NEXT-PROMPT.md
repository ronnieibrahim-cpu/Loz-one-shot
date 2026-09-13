# Next session — give siren a real deathFrame

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/NEXT-SESSION.md`'s S85 entry (`moblin_death`, the newest) — it
  correctly REJECTED two sheet frames that matched the right palette but
  didn't read as a collapse. Keep that same discipline: a candidate has
  to actually look defeated, not just belong to the right creature.

## Why this, now
Fifteen enemies have `deathFrame` already. `siren` (hp 4, `terrain:
'water'`, `src/data/enemies.js`, "surfaces to sing a shot at you,
submerges to dodge") is next: it uses `submerge()`, the same
hidden/invuln mechanism `leever` (S32) and `wizzrobe` (S83) already
proved blocks a hit outright while hidden. Picked specifically to confirm
that mechanism genuinely generalises across MULTIPLE enemies rather than
being something that happens to work for `wizzrobe` alone. `siren` is
also hp 4 (two hits at `swordDamage()` 2: 4 -> 2 -> 0), same shape
`moblin` (S85) just proved, now combined with the submerge cycle.

## The task
1. Check `assets/sheets/oracle-seasons-enemies.png`'s own "Siren" plate
   (boxes 256/257 per `tools/rip-enemies.py` — check the actual label,
   don't guess it from this prompt) for a collapse pose distinct from the
   two already used and from `siren_hurt` (`sprites-enemies-hurt.js`).
   `pip install pillow` first if needed, and run `python3
   tools/rip-enemies.py` once unmodified to confirm it still reproduces
   byte-identically before changing anything. Check properly for a real
   frame, but also be ready to correctly reject one that matches the
   palette without reading as defeated — `moblin` (S85) just found two
   such traps on one plate.
2. If a real extra frame exists: add it to `FRAMES` in `tools/rip-enemies.py`
   and re-emit. Never hand-add a key to `sprites-enemies.js`.
3. If nothing extractable exists: add `siren_death` to `ENEMY_HURT_ART`
   (`sprites-enemies-hurt.js`), following the same "reuse/squash the live
   frames, invent nothing" discipline recent sessions used.
4. Add the new sprite name to `sprite-manifest.js`'s `enemies` list (if
   hand-drawn).
5. Wire `deathFrame: 'siren_death'` onto `siren`'s `defineEnemy` call.
6. Verify in-engine, in this order — read `siren`'s own `ai()` first for
   its actual `submerge()` timing (`down: 76, up: 70`) rather than
   guessing:
   - Confirm `siren` has no `z` field.
   - While hidden (down phase): confirm a hit does not connect at all —
     `hurt()` returns `false`, `hp`/`dying` untouched — the same proof
     `leever` and `wizzrobe` already made. Confirm it holds on THIS
     enemy too rather than assuming the mechanism just carries over
     because it worked twice before.
   - While visible (up phase): hit 1 (hp 4 -> 2) shows `siren_hurt` and
     reverts to the ordinary cycle once the flicker window ends, `dying`
     false throughout. Hit 2 (hp 2 -> 0) shows `siren_death`, never
     `siren_hurt`, held for the full `ENEMY_DEATH_FRAMES` stall, then
     `dead = true`.
7. Run `node tools/check-playthrough.mjs` and `node tools/replay.mjs`
   after everything else is green. Re-record whichever replay plan
   actually diverges (`node tools/replay.mjs --record <name>`) if one
   does.

## Done means
- `siren` shows a real collapse pose on the hit that kills it, proven by
  an in-engine probe covering both submerge phases, not by reading the
  code.
- `node tools/check-drift.mjs` shows `siren: walk,hurt,death`.
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
  this thread has kept for fifteen sessions straight. `anglerfry` is the
  last remaining candidate after this one, not this session's target.
- `bubble`, `beamos`, `barnacle` — all hp 999, effectively unkillable.
- Re-investigating the wizzrobe flicker/submerge quirk (S83) — that's
  settled as benign; confirm the hidden-hit-blocked mechanism holds here,
  don't re-derive why it works.
- `attackFrame` or any engine field for it — still the separate, bigger
  redesign question (see `docs/prompts/LEDGER.md`).
