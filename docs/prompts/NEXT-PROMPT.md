# Next session — give keese a real deathFrame

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/NEXT-SESSION.md`'s `gel_death` entry (S16) and `stalfos` `hurtFrame`
  entry (S25, the two newest) — `gel_death` is the precedent for a
  `deathFrame` on an hp-1 enemy (no hp constraint applies, unlike
  `hurtFrame`); `stalfos`'s entry shows the same "check both orderings
  in-engine" discipline this session should apply if it turns out `keese`
  ever gets a `hurtFrame` question raised again (it shouldn't — see Out of
  scope — but the verification habit still applies to `deathFrame` alone).

## Why this, now
S12-S25 gave `hurtFrame` to every enemy with hp > `swordDamage()` (2) —
eleven enemies, one per session, and that thread is now closed: `wisp`,
`beetle`, `darknut`, `moblin`, `wizzrobe`, `siren`, `anglerfry`, `pincer`,
`octorokSea`, `stalfos` all have it, and every remaining enemy has hp <= 2,
which means a sword hit (`swordDamage()` 2, S12's own measured constant)
always brings it to hp <= 0 in one hit — there is no non-lethal hit for a
`hurtFrame`'s flicker window to ever run during. That branch of the
enemy-roster objective is exhausted, not stalled.

`deathFrame` has NO such constraint (S13, confirmed again by `gel_death`
at hp 1, S16): `die()` runs exactly once, on whichever hit actually brings
hp to 0, regardless of how many hits that took. So `deathFrame` is the
open half of `docs/ENEMIES.md`'s "idle/walk/attack/hurt/death" states, and
unlike `hurtFrame` it isn't gated by a stat — only three enemies have it
today (`wisp`, `stalfos`, `gel`). `keese` (hp 1, `terrain: 'air'`,
`src/data/enemies.js`) is the next hp-1 case after `gel`, and per S16's own
framing it's the sharper test of the same claim on a SECOND hp-1 enemy —
not a fresh derivation, a confirmation that the hp-1 exemption from
`hurtFrame` generalises without also exempting `deathFrame`.

## The task
1. Check `assets/sheets/oracle-seasons-enemies.png`'s own "Keese" plate
   (source for `keese_0`/`keese_1` — index 125 for wings-spread,
   `RECTS['keese_1']` at pixel rect `(841, 201, 11, 16)` for wings-folded,
   per `tools/rip-enemies.py`) for a collapse/falling pose. Actually look
   at the crop rather than assuming a bat sheet has no such frame — this
   is the first `deathFrame` search since `stalfos_death` (S13), and that
   one found nothing on ITS sheet, but that doesn't predict this one.
2. If one exists: add it to `FRAMES` or `RECTS` in `tools/rip-enemies.py`
   and re-emit. Never hand-add a key to `sprites-enemies.js`.
3. If hand-drawn: add `keese_death` to `ENEMY_HURT_ART`
   (`sprites-enemies-hurt.js`, no new file — the shared home for hand-
   authored hurt/death art despite the filename). Read this file's own
   header on the `_death` exception first: unlike `hurtFrame`, a death
   pose is allowed to change silhouette (`stalfos_death`, `gel_death` both
   do) as long as it's still legibly the same creature — a folded-wing
   heap or a scorch mark reading as "this is what was flying at you," not
   a generic poof.
4. Add the new sprite name to `sprite-manifest.js`'s `enemies` list.
5. Wire `deathFrame: '<name>'` onto `keese`'s `defineEnemy` call.
6. Verify in-engine, same shape as `gel_death`'s S16 proof: spawn `keese`,
   hit it for its full hp (lethal, hp 1 -> 0 in one hit) and confirm
   `spriteName()` returns the new deathFrame while `dying` is true, across
   however many frames `die()` defers removal for. `keese` has `z: 8` (an
   airborne height offset) and `light: true` — confirm (don't assume)
   neither interacts badly with the death pose rendering (e.g. the shadow
   or height offset not stranding the sprite oddly once it's "fallen").

## Done means
- `keese` shows a real collapse/death pose on the lethal hit that kills
  it, proven by an in-engine probe, not by reading the code.
- `node tools/check-drift.mjs` shows `keese: walk,death`.
- `node tools/validate.mjs`, `node tools/test.mjs` pass. If
  `sprites-enemies.js` changed, `node tools/check-rippers.mjs` is 17/17.
- `npm run build`, `dist/oracle-of-tides.html` committed.
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines).

## Out of scope
- `keese_hurt` — hp 1 means no non-lethal hit ever happens; S12 already
  ruled this out explicitly (`docs/prompts/LEDGER.md`), do not re-open it.
- Any OTHER enemy's `deathFrame` — one enemy per session, same cadence
  the `hurtFrame` thread kept for eleven sessions straight.
- `attackFrame` or any engine field for it — still the separate, bigger
  redesign question (see `docs/prompts/LEDGER.md`).
- Re-deriving whether hp-1 enemies can have `deathFrame` — `gel_death`
  (S16) already proved it structurally; this session CONFIRMS it on
  `keese`, it does not re-litigate `die()`'s own mechanics from scratch.
