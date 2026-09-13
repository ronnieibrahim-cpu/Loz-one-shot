# Next session — give wizzrobe a real deathFrame

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/NEXT-SESSION.md`'s S82 entry (`darknut_death`, the newest) — it
  proved the hurt-hurt-death sequence holds across a third hit. This
  session's target, `wizzrobe`, brings back a DIFFERENT mechanism this
  thread already proved once: `leever`'s (S32) `submerge()`-based
  appear/disappear, which hides the sprite and drops the hitbox while
  down. `leever` never had `hurtFrame` though (hp 2); `wizzrobe` does.

## Why this, now
`wizzrobe` (hp 3, `terrain: 'any'`, `src/data/enemies.js`, "blinks in,
fires, blinks out") uses the engine's `submerge()` helper — the exact
mechanism `leever` used to hide itself and become briefly unhittable.
Picked specifically because `wizzrobe` ALSO has `hurtFrame`
(`wizzrobe_hurt`), which `leever` never got to test: does a hit land
correctly while `wizzrobe` is visible, does the flicker/hurt window
survive a `submerge()` cycle that starts mid-flicker (or does going
invisible cut it short), and does the hidden phase still block a hit the
same way `leever`'s did.

## The task
1. Check `assets/sheets/oracle-seasons-enemies.png`'s own "Wizzrobe" plate
   (boxes 336/337 per `tools/rip-enemies.py`) for a collapse pose distinct
   from the two already used (`wizzrobe_0`/`1`, hood-only vs. full
   sorcerer) and from `wizzrobe_hurt` (`sprites-enemies-hurt.js`). `pip
   install pillow` first if needed, and run `python3 tools/rip-enemies.py`
   once unmodified to confirm it still reproduces byte-identically before
   changing anything. `darknut` (S82) found a real unused frame after
   several sessions in a row found nothing — check properly rather than
   assuming either outcome.
2. If a real extra frame exists: add it to `FRAMES` in `tools/rip-enemies.py`
   and re-emit. Never hand-add a key to `sprites-enemies.js`.
3. If nothing extractable exists: add `wizzrobe_death` to `ENEMY_HURT_ART`
   (`sprites-enemies-hurt.js`), following the same "reuse/squash the live
   frames, invent nothing" discipline recent sessions used.
4. Add the new sprite name to `sprite-manifest.js`'s `enemies` list (if
   hand-drawn).
5. Wire `deathFrame: 'wizzrobe_death'` onto `wizzrobe`'s `defineEnemy`
   call.
6. Verify in-engine, in this order — read `submerge()`
   (`src/game/enemy.js`) and `wizzrobe`'s own `ai()` first so you know its
   actual down/up timing (90 down, 80 up) rather than guessing:
   - Confirm `wizzrobe` has no `z` field.
   - While hidden (down phase): confirm a hit does not connect at all —
     `hurt()` returns `false`, `hp`/`dying` untouched — the same proof
     `leever` (S32) made, confirmed again on this enemy rather than
     assumed to carry over.
   - While visible (up phase): a non-lethal hit (hp 3 -> 1, `swordDamage()`
     2) shows `wizzrobe_hurt`. Confirm what happens if the `submerge()`
     timer flips it back down WHILE the flicker window is still running —
     does `dying`/flicker state survive being hidden, or does something
     reset. This is genuinely unknown going in; report what you find
     rather than assuming either answer.
   - The lethal follow-up (hp 1 -> negative) shows `wizzrobe_death`, never
     `wizzrobe_hurt`, held for the full `ENEMY_DEATH_FRAMES` stall, then
     `dead = true`. Confirm this holds regardless of which submerge phase
     the enemy was in when the killing blow landed.
7. Run `node tools/check-playthrough.mjs` and `node tools/replay.mjs`
   after everything else is green. Re-record whichever replay plan
   actually diverges (`node tools/replay.mjs --record <name>`) if one
   does.

## Done means
- `wizzrobe` shows a real collapse pose on the hit that kills it, proven
  by an in-engine probe covering both submerge phases, not by reading the
  code.
- `node tools/check-drift.mjs` shows `wizzrobe: walk,hurt,death`.
- `node tools/validate.mjs`, `node tools/test.mjs` pass (83/83). If
  `sprites-enemies.js` changed, `node tools/check-rippers.mjs` is 17/17.
- `node tools/check-playthrough.mjs` is 21/21 and `node tools/replay.mjs`
  is 51/51 after this session's change, both confirmed by actually
  running them.
- `npm run build`, `dist/oracle-of-tides.html` committed.
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines), stating what actually happens to a flicker window interrupted
  by a submerge cycle.

## Out of scope
- Any OTHER enemy's `deathFrame` — one enemy per session, same cadence
  this thread has kept for twelve sessions straight.
- `bubble`, `beamos`, `barnacle` — all hp 999, effectively unkillable.
- Fixing anything found about the flicker/submerge interaction unless it's
  a genuine bug reachable by a normal player, not just this probe's own
  artificial timing — report it in `docs/NEXT-SESSION.md` per the
  charter's detour rule rather than chasing it inline.
- `attackFrame` or any engine field for it — still the separate, bigger
  redesign question (see `docs/prompts/LEDGER.md`).
