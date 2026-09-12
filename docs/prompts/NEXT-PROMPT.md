# Next session — give stalfos a real hurtFrame

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/NEXT-SESSION.md`'s two newest entries (the `octorokSea_hurt` proof
  and the `pincer_hurt` proof before it) — together they show the same
  discipline applied to both branches: check the sheet before assuming a
  plate is exhausted, and pick the hand-draw trick (eyes-shut vs. merge-
  the-gap vs. unused-palette-slot) from the actual pixel grid, not the
  creature's silhouette.

## Why this, now
S12/S15/S17/S18/S19/S20/S21/S22/S23/S24 gave `hurtFrame` to `wisp`,
`beetle`, `wisp` again, `darknut`, `moblin`, `wizzrobe`, `siren`,
`anglerfry`, `pincer`, `octorokSea` — ten enemies now. `stalfos` (hp 3,
`src/data/enemies.js`) is the LAST enemy with hp > `swordDamage()` (2)
that doesn't yet have one — every other hp > 2 enemy in the roster is
done. It's also the reverse-order case flagged as out of scope in every
prior session's prompt: `stalfos` already has a `deathFrame`
(`stalfos_death`, S13), and no prior session has added `hurtFrame` to an
enemy that already carries `deathFrame`. `src/game/enemy.js`'s
`spriteName()` (read it before assuming) checks `dying && deathFrame`
FIRST, then `flicker > 0 && hurtFrame` — so in principle they coexist
without conflict, but S17 is the session that actually PROVED the
ordering both ways round for `wisp` (which has both). `stalfos` would be
the second real-world case, not a fresh derivation.

## The task
1. Check `assets/sheets/oracle-seasons-enemies.png`'s own "Stalfos" plate
   (or whichever plate the sheet actually labels this on — `stalfos_d0`/
   `d1` come from the plain-skeleton frames, `stalfos_s0`/`s1` are
   substituted from Sword Stalfos, per `tools/rip-enemies.py`'s own
   comment) for a spare recoil/flinch pose neither `stalfos_d0`/`d1`/
   `s0`/`s1` nor `stalfos_death` already use. Two different plates are in
   play here (plain skeleton for the front view, Sword Stalfos for the
   side view, per the ripper's own comment) — check both, the same way
   S24 ruled out a same-pitch neighbour on Octorok's plate by checking its
   actual label and palette rather than assuming adjacency means
   affiliation.
2. If one exists: add it to `FRAMES` in `tools/rip-enemies.py` and
   re-emit. Never hand-add a key to `sprites-enemies.js`.
3. If hand-drawn: add `stalfos_hurt` to `ENEMY_HURT_ART`
   (`sprites-enemies-hurt.js`, no new file). `stalfos_death`'s own
   comment there (read it) already describes `stalfos_d0`'s head/skull
   shape in some detail — use that description rather than re-deriving
   the grid from scratch, but still look at the actual pixel grid before
   picking eyes-shut vs. merge-the-gap vs. unused-palette-slot; a
   skeleton's face is not guaranteed to resemble any prior target's.
4. Add the new sprite name to `sprite-manifest.js`'s `enemies` list.
5. Wire `hurtFrame: '<name>'` onto `stalfos`'s existing `defineEnemy` call
   (it already has `deathFrame: 'stalfos_death'` — add alongside it, don't
   replace it).
6. Verify in-engine, same shape as every prior session, PLUS the ordering
   question this session actually exists to answer: spawn `stalfos`, hit
   it for less than its hp and confirm `spriteName()` returns the new
   hurtFrame while `flicker > 0` and `dying` is false, then confirm it
   reverts once flicker ends (same as every prior target) — AND hit it
   for its full remaining hp (a lethal hit) and confirm `spriteName()`
   returns `stalfos_death` instead, per `spriteName()`'s own
   `dying`-checked-first ordering, not the hurt frame. `stalfos` has no
   `submerge()`/hidden state and uses a directional `frames` dict
   (`down`/`up` share `stalfos_d0`/`d1`, `side` uses `stalfos_s0`/`s1`) —
   confirm hurtFrame overrides every direction the same way
   `darknut`/`moblin`/`octorokSea` already prove, rather than assuming it
   from this description.

## Done means
- `stalfos` shows a real staggered pose on a non-lethal hit AND its
  existing death pose on a lethal one, proven by two in-engine probes (one
  per case), not by reading the code.
- `node tools/check-drift.mjs` shows `stalfos: walk,hurt,death`.
- `node tools/validate.mjs`, `node tools/test.mjs` pass. If
  `sprites-enemies.js` changed, `node tools/check-rippers.mjs` is 17/17.
- `npm run build`, `dist/oracle-of-tides.html` committed.
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines).

## Out of scope
- Any OTHER enemy's `hurtFrame` or `deathFrame` — `stalfos` was the last
  hp > 2 target without one; the next hp > 2 candidate would be revisiting
  an hp <= 2 enemy's eligibility, a bigger question than fits one session.
- Re-litigating whether `hurtFrame`/`deathFrame` CAN coexist — S17 already
  proved the ordering on `wisp`; this session confirms it on a second real
  case, it does not re-derive the mechanism from `src/game/enemy.js` as if
  unproven.
- `attackFrame` or any engine field for it — still the separate, bigger
  redesign question (see `docs/prompts/LEDGER.md`).
- Widening the enemy-roster objective's own done-condition (idle/walk/
  attack/hurt/death for all 22) — that's a rotation-level decision, not
  something to redefine mid-session.
