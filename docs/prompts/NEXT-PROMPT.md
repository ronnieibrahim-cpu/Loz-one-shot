# Next session — give one enemy a real deathFrame, proving that path too

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist, including the new `hurtFrame` hp constraint it now carries.
- `docs/NEXT-SESSION.md`'s two newest entries (the `hurtFrame` removal-race
  finding and the `attackFrame`/`deathFrame` design note this session wrote)
  — they are the reason this session's task is `deathFrame`, not
  `attackFrame`.

## Why this, now
Last session (S12) gave `wisp` a real `hurtFrame` and proved the mechanism
in-engine: `Enemy.spriteName()` now shows a flinch pose while `flicker>0`,
the same way `Boss.spriteName()` already did. It also found the mechanism
has a real precondition — an enemy needs hp greater than the player's
current `swordDamage()`, or it is removed from `game.entities` (and stops
being drawn at all) on the very same frame it takes its only hit, before the
flicker window ever gets a frame to render on. That is settled; do not
re-litigate it, and do not add a `hurtFrame` to any enemy with hp 1 or 2
(gel, keese, zol, octorok, crab, leever, tektite, urchin, jellyfish — sword
level 1 one-shots all of these).

`attackFrame` and `deathFrame` are the two states still missing from
`check-drift.mjs`'s "complete" definition. S12's note in
`docs/NEXT-SESSION.md` sized both: `attackFrame` needs a convention change
across every enemy's free-form `ai()` callback (there is no single moment
"an attack begins" the way a boss's phases give one) — a real redesign, out
of scope for one session. `deathFrame` looks smaller: `Boss.beginDeath` +
`dying`/`deathTime` already stall a BOSS's removal for a few frames so its
death animation can play, and `Entity.die()` (the ordinary-enemy path) has
no such stall — it sets `remove = true` immediately, same as the hp-1
`hurtFrame` trap. This session's job is to add that stall for one ordinary
enemy and prove a `deathFrame` actually draws before removal, the same way
S12 proved `hurtFrame` on `wisp` rather than attempting all 22 at once.

## The task
Pick ONE enemy that is not `wisp` (already spoken for) and not hp 1-2 (see
above) — `beetle` (hp 3) or `stalfos` (hp 3) are reasonable candidates;
check `docs/ENEMIES.md` first so the choice doesn't fight that enemy's own
written lesson.
1. In `src/game/enemy.js`, give `Enemy` a death stall: on `die()`, if
   `this.spec.deathFrame` is set, do NOT set `remove = true` immediately —
   instead set `this.dying = true` and a short countdown (name it and tag
   it in `src/data/feel.js`, provenance `guessed`, following
   `BOSS_DEATH_FRAMES`'s own comment as a reference point), during which
   `spriteName()` returns `spec.deathFrame` and `update()` skips AI. Only
   set `remove = true` once the countdown reaches 0. An enemy with no
   `deathFrame` must behave exactly as before (immediate removal) — this is
   additive, not a change to the other 21 enemies' death.
2. Extract or hand-draw one death-pose frame for the chosen enemy, same
   "check the sheet first" discipline as `hurtFrame` — a NEW hand-authored
   file (or an addition to `sprites-enemies-hurt.js` if that's a better
   home; your call, but explain it in the commit message) if nothing on
   `assets/sheets/oracle-seasons-enemies.png` fits.
3. Wire `deathFrame: '<name>_death'` (or `_die`) into that enemy's
   `defineEnemy` call. Note `check-drift.mjs`'s enemy-roster metric reads
   `death` from a SPRITE-KEY NAME in `sprites-enemies.js`
   (`<name>_death`/`_die`), not a spec field — check whether that still
   makes sense once a real `spec.deathFrame` field exists, and if not, say
   so in `docs/NEXT-SESSION.md` rather than changing the metric yourself
   (changing what a rotation objective measures is bigger than one task).
4. Verify the same way S12 did: an in-engine probe (see
   `docs/NEXT-SESSION.md`'s harness notes) that kills the chosen enemy and
   confirms `spriteName()` returns the death frame for at least one frame
   with the entity still in `game.entities`, before it is finally removed.
   A screenshot is worth taking if you can get one.

## Done means
- One enemy (not wisp) has a real death-pose frame that visibly draws
  in-engine before removal — proven by a probe, not by reading the code.
- `node tools/validate.mjs`, `node tools/test.mjs`, `node tools/check-motion.mjs`
  pass. If a sprite file changed, `node tools/check-rippers.mjs` is 17/17.
- `node tools/check-drift.mjs` runs clean; note in your session log row
  whether its enemy-roster "death" column now means what you just built,
  or still means the old sprite-key-naming guess.
- `npm run build`, `dist/oracle-of-tides.html` committed.
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines); docs/NEXT-SESSION.md gets a short, precise note on whether
  `attackFrame` now looks any more tractable given the `deathFrame` stall
  mechanism, or is still a separate, bigger question.

## Out of scope
- `attackFrame` — still the bigger redesign S12 identified; do not start it.
- All 22 enemies' deathFrame — one proves the path, same as hurtFrame.
- Any `hurtFrame` work on an hp-1/2 enemy — settled, do not re-open.
- Rewriting `docs/ENEMIES.md`'s lessons — they describe behavior, not art.
