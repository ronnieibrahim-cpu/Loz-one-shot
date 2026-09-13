# Next session — give pincer a real deathFrame

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/NEXT-SESSION.md`'s S83 entry (`wizzrobe_death`, the newest) — it
  found a real sheet-adjacency trap (a visually-neighbouring frame that
  actually belonged to a different creature) by comparing quantised
  palettes directly rather than trusting the crop. Keep that discipline
  for this session's own extraction check.

## Why this, now
Thirteen enemies have `deathFrame` already. `pincer` (hp 3, `speed: 0`,
`src/data/enemies.js`, "an eel head on a tether, lunging out of its
burrow") is next, picked because it has neither `shield` nor
`submerge()` — its `ai()` runs a small state machine (`e._pinch`:
`'hole'` / `'out'` / `'back'`) that snaps the creature's body out along
one axis and reels it back, a genuinely different movement shape from
everything tested so far in this thread (roaming, hopping, phasing,
charging). Unlike `wizzrobe`/`leever`, nothing in `pincer`'s `ai()` sets
`hidden` or raises `invuln` — it stays visible and hittable throughout,
confirm that directly rather than assuming from this summary.

## The task
1. Check `assets/sheets/oracle-seasons-enemies.png`'s own plate for
   `pincer_0`/`pincer_1`/`pincer_hurt` (boxes 233/234/235 per
   `tools/rip-enemies.py` — the comment there already notes box 235 was
   found as the hurtFrame, a "dazed stagger" pose found on the same
   plate right after the two idle frames) for anything further along
   that could serve as a death pose. `pip install pillow` first if
   needed, and run `python3 tools/rip-enemies.py` once unmodified to
   confirm it still reproduces byte-identically before changing
   anything. Check properly rather than assuming the plate is exhausted
   OR assuming there's more to find — `darknut` and `wizzrobe` both found
   real extra frames in a row, but that is not a guarantee this plate
   has one too.
2. If a real extra frame exists: add it to `FRAMES` in `tools/rip-enemies.py`
   and re-emit. Never hand-add a key to `sprites-enemies.js`.
3. If nothing extractable exists: add `pincer_death` to `ENEMY_HURT_ART`
   (`sprites-enemies-hurt.js`), following the same "reuse/squash the live
   frames, invent nothing" discipline recent sessions used.
4. Add the new sprite name to `sprite-manifest.js`'s `enemies` list (if
   hand-drawn).
5. Wire `deathFrame: 'pincer_death'` onto `pincer`'s `defineEnemy` call.
6. Verify in-engine, in this order — read `pincer`'s full `ai()` first
   so you know its actual `_pinch` states rather than guessing:
   - Confirm `pincer` has no `z` field and no `hidden`/`invuln` toggling
     anywhere in its `ai()` (unlike `leever`/`wizzrobe`).
   - A lethal hit lands correctly regardless of which `_pinch` state
     (`'hole'`, `'out'`, `'back'`) the creature is in when it's killed —
     `pincer` has `speed: 0` and moves via `advanceStep`/`beginStep`
     rather than the usual velocity fields, so confirm the death pose
     draws at a sensible position (not mid-lunge frozen somewhere odd)
     rather than assuming it behaves like every prior target.
   - Non-lethal hit (hp 3 -> 1, `swordDamage()` 2) shows `pincer_hurt`
     (already wired) and reverts correctly; the lethal follow-up shows
     `pincer_death`, never `pincer_hurt`, held for the full
     `ENEMY_DEATH_FRAMES` stall, then `dead = true`.
7. Run `node tools/check-playthrough.mjs` and `node tools/replay.mjs`
   after everything else is green. Re-record whichever replay plan
   actually diverges (`node tools/replay.mjs --record <name>`) if one
   does.

## Done means
- `pincer` shows a real collapse pose on the hit that kills it, proven by
  an in-engine probe, not by reading the code.
- `node tools/check-drift.mjs` shows `pincer: walk,hurt,death`.
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
  this thread has kept for thirteen sessions straight.
- `bubble`, `beamos`, `barnacle` — all hp 999, effectively unkillable.
- Re-litigating the wizzrobe flicker/submerge finding (S83) — that's
  settled as benign; it doesn't generalise to `pincer`, which has neither
  mechanism.
- `attackFrame` or any engine field for it — still the separate, bigger
  redesign question (see `docs/prompts/LEDGER.md`).
