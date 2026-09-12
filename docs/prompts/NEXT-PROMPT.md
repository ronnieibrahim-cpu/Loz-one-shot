# Next session — give octorok (land) a real deathFrame

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/NEXT-SESSION.md`'s `keese_death` entry (S26, the newest) — it
  found a real mistake (a death pose drawn to sit low in the cell reads as
  hovering, not fallen, for any enemy with a height offset) before it
  shipped, and named `wisp_death` as the precedent for getting an airborne
  enemy's death pose right. `octorok` (land) has no `z` field at all
  (ground-level, unlike `keese`/`wisp`), so that specific trap likely
  doesn't apply here — but confirm that from the code rather than assume
  it just because this prompt says so.

## Why this, now
S12-S25 closed the `hurtFrame` thread (every hp > `swordDamage()` (2)
enemy has one); S26 opened the `deathFrame` branch, which has no hp
constraint, on `keese` (hp 1). `octorok` (the land cousin of `octorokSea`,
hp 2, `src/data/enemies.js`) is a clean next target for the same reason
`keese` was: hp 2 means `swordDamage()` (2) always brings it to hp <= 0 in
one hit, so `deathFrame` is the ONLY visual feedback this enemy could ever
show — there is no non-lethal case to design around, unlike the hp > 2
roster `hurtFrame` covered. It also directly extends S24's work:
`octorokSea_hurt` already established the enemy-id-scoped naming pattern
for a creature whose sprite frames (`octorok_d0`/`d1`/`s0`/`s1`) are
shared between two different `defineEnemy` entries — `octorok_death` (or
whatever name fits, decide from the actual naming precedent) should follow
the same logic, not re-derive it.

## The task
1. Check `assets/sheets/oracle-seasons-enemies.png`'s own "Octorok" plate
   again (already surveyed at S24 — re-read that finding rather than
   re-cropping from scratch) for a collapse pose distinct from the four
   frames already extracted. S24 found a fifth nearby box that turned out
   to be an unrelated shell/pickup icon, not a fifth Octorok frame —
   confirm that finding still holds rather than re-doing the whole survey,
   but do look again with "collapse pose" specifically in mind rather than
   trusting S24's "nothing else to extract" conclusion blindly, since that
   session was looking for a HURT pose, not a DEATH one, and the two are
   different questions.
2. If one exists: add it to `FRAMES` in `tools/rip-enemies.py` and
   re-emit. Never hand-add a key to `sprites-enemies.js`.
3. If hand-drawn: add the new key to `ENEMY_HURT_ART`
   (`sprites-enemies-hurt.js`, no new file). Read this file's own header
   on the `_death` exception: silhouette MAY change, unlike a `hurtFrame`
   — `gel_death`, `stalfos_death`, `keese_death` are all precedent for
   how much. Confirm `octorok` (land) has no `z` field before deciding
   whether a "collapsed low in the cell" pose is safe here (S26's whole
   finding was that this depends on the specific enemy's height handling,
   not on a rule you can assume transfers).
4. Add the new sprite name to `sprite-manifest.js`'s `enemies` list.
5. Wire `deathFrame: '<name>'` onto `octorok`'s (land) `defineEnemy` call.
6. Verify in-engine: spawn `octorok`, hit it for its full hp (lethal, hp 2
   -> 0 in one hit at `swordDamage()` 2) and confirm `spriteName()`
   returns the new deathFrame while `dying` is true, held for
   `ENEMY_DEATH_FRAMES`, then confirm `dead` becomes true and the entity
   is actually removed. `octorok` uses a directional `frames` dict — check
   whether `deathFrame` needs the same "overrides every direction" proof
   `hurtFrame` needed (`spriteName()`'s own code decides this; read it
   rather than assume symmetry with `hurtFrame`'s behaviour).

## Done means
- `octorok` (land) shows a real collapse pose on the hit that kills it,
  proven by an in-engine probe, not by reading the code.
- `node tools/check-drift.mjs` shows `octorok: walk,death`.
- `node tools/validate.mjs`, `node tools/test.mjs` pass. If
  `sprites-enemies.js` changed, `node tools/check-rippers.mjs` is 17/17.
- `npm run build`, `dist/oracle-of-tides.html` committed.
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines).

## Out of scope
- `octorokSea`'s own `deathFrame` — it already has `hurtFrame`
  (`octorokSea_hurt`, S24); giving it `deathFrame` too would be the next
  hurtFrame+deathFrame coexistence proof after `wisp`/`stalfos`, a
  different question from this session's (a fresh single-field target).
  Worth doing eventually, not this session.
- Any OTHER enemy's `deathFrame` — one enemy per session, same cadence
  the `hurtFrame` thread kept for eleven sessions straight.
- `bubble`, `beamos`, `barnacle` — all hp 999, effectively unkillable by
  normal play. A `deathFrame` for one of these would need an in-engine
  probe that force-kills it with an unrealistic hit, proving nothing about
  real play. Skip these for `deathFrame` unless a future session has a
  specific reason (e.g. a new one-shot kill mechanic) to revisit.
- `attackFrame` or any engine field for it — still the separate, bigger
  redesign question (see `docs/prompts/LEDGER.md`).
