# Next session — decide and give octorokSea a deathFrame

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/NEXT-SESSION.md`'s S79 entry (`jellyfish_death`, the newest) — it
  closes out the "next hp<=2 enemy without one" cadence this thread
  followed since S26, and ends on an open design question about this
  session's own target: whether `octorokSea` should reuse `octorok_death`
  outright or get its own pose. That question is this session's actual
  task, not something to skip past.

## Why this, now
Every non-hp-999 enemy at hp <= 2 now has a `deathFrame`
(`gel`/`keese`/`octorok`/`urchin`/`crab`/`zol`/`leever`/`tektite`/
`jellyfish`, nine total). Every remaining candidate is hp >= 3 and already
has a `hurtFrame`. `deathFrame` carries no hp constraint (S13/S16), so
`octorokSea` (hp 3, `terrain: 'water'`, `src/data/enemies.js`) is as
eligible as any of them — picked because it raises a real design question
worth resolving on purpose rather than by default: it reuses the exact
same `octorok_d0`/`d1`/`u0`/`u1`/`s0`/`s1` sprite keys as land `octorok`
(compare both `frames:` blocks in `enemies.js`), which already has
`octorok_death` since S27.

## The task
1. Decide, and write down the reasoning either way: should `octorokSea`
   reuse `deathFrame: 'octorok_death'` as-is, or does it need its own
   pose? Consider that the two enemies are already visually identical
   sprite-for-sprite while alive — a distinct death pose would be the
   first point they diverge, and only look intentional if drowning
   actually reads differently from `octorok_death`'s own land-squash
   shape. There is no presumed right answer; this session's job is to
   pick one and say why.
2. If reusing: wire `deathFrame: 'octorok_death'` directly onto
   `octorokSea`'s `defineEnemy` call. No new art, no ripper change.
3. If drawing a new one: check `assets/sheets/oracle-seasons-enemies.png`'s
   own plate first for anything extractable (same discipline every prior
   session in this thread has used — `pip install pillow` if needed, run
   `python3 tools/rip-enemies.py` once unmodified first to confirm
   byte-identical reproduction). If nothing extracts, hand-draw
   `octorokSea_death` in `sprites-enemies-hurt.js` and add it to
   `sprite-manifest.js`'s `enemies` list, then wire
   `deathFrame: 'octorokSea_death'`.
4. Verify in-engine: `octorokSea` has `tideOnly: [1, 2]` (does not exist
   at low tide) and no `z` field — confirm both directly from
   `src/data/enemies.js` rather than assuming. Lethal hit (hp 3 ->
   negative, since `swordDamage()` is 2 and `octorokSea` is the first
   `deathFrame` target where a single hit does NOT always kill — confirm
   whether `hurtFrame` (`octorokSea_hurt`, already wired) and the new
   `deathFrame` interact correctly across a non-lethal hit followed by a
   lethal one, the same two-hit proof `stalfos` (S25) used for its own
   `hurtFrame`+`deathFrame` coexistence).
5. Run `node tools/check-playthrough.mjs` and `node tools/replay.mjs`
   after everything else is green. Re-record whichever replay plan
   actually diverges (`node tools/replay.mjs --record <name>`) rather than
   treating a failure as a known-bad baseline — `tektite` (S78) needed
   this, `jellyfish` (S79) didn't; check rather than assume either way.

## Done means
- `octorokSea` shows a real collapse pose on the hit that kills it,
  proven by an in-engine probe, not by reading the code — whether that
  pose is reused or new.
- `node tools/check-drift.mjs` shows `octorokSea: walk,hurt,death`.
- `node tools/validate.mjs`, `node tools/test.mjs` pass (83/83). If
  `sprites-enemies.js` changed, `node tools/check-rippers.mjs` is 17/17.
- `node tools/check-playthrough.mjs` is 21/21 and `node tools/replay.mjs`
  is 51/51 after this session's change, both confirmed by actually
  running them.
- `npm run build`, `dist/oracle-of-tides.html` committed.
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines), stating which way the reuse-vs-new-art decision went and why.

## Out of scope
- Any OTHER enemy's `deathFrame` — one enemy per session, same cadence
  this thread has kept for nine sessions straight.
- `bubble`, `beamos`, `barnacle` — all hp 999, effectively unkillable.
- Re-litigating the hp<=2 cadence being exhausted — S79 already
  established that; this session's job is picking the NEXT criterion in
  practice, not re-deriving that the old one ran out.
- `attackFrame` or any engine field for it — still the separate, bigger
  redesign question (see `docs/prompts/LEDGER.md`).
