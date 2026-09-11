# Next session — prove a deathFrame path on one plain enemy

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/NEXT-SESSION.md` S76 (top of file) — last session's `hurtFrame` work
  and, at its end, the specific reason `deathFrame` has a clear trigger
  (`Entity.die()`) while `attackFrame` does not (no enemy's `ai()` has a
  shared "about to attack" moment) — read that reasoning before picking a
  different field to prototype.
- `Boss.beginDeath`/`Boss.dying`/`Boss.deathTime` (`src/game/enemy.js`,
  search `beginDeath`) — the ONLY existing "linger after hp<=0, then vanish"
  precedent in the engine, and it lives entirely on the `Boss` subclass, not
  on `Entity`/`Enemy`. This is what a stripped-down ordinary-enemy version
  has to be measured against, not copied wholesale — a boss gets a full
  `HITSTOP_BOSS_DEATH_FRAMES` freeze and fade; an ordinary `gel` almost
  certainly should not.

## Why this, now
STATE.md's objective of record is #4, enemy-roster: every enemy needs
idle/walk/attack/hurt/death states before `check-drift.mjs`'s roster metric
reads any enemy as complete (S12/S76 wired `wisp`'s `hurtFrame`; the metric
is still, correctly, `0 of 22`). `attackFrame` and `deathFrame` are both
still missing engine concepts. S76 found `attackFrame` has no shared trigger
to hang a pose on anywhere in the 22 `ai()` functions — a bigger design
question than one session should absorb by surprise. `deathFrame` has an
unambiguous trigger (`Entity.die()`) but needs a real decision (how long
does an ordinary enemy linger post-death, and where does that number live
in `feel.js`) — exactly the kind of thing this rotation proves on ONE enemy
before committing a shape to all 22, the same discipline S76 used for
`hurtFrame`.

**Useful inversion, worth knowing before picking an enemy:** `hurtFrame`
could only ever be proven on an enemy that SURVIVES a hit (`hp >= 3`, no
`shield: 'all'` — S76's own finding). `deathFrame` has the opposite
constraint: every enemy dies eventually regardless of `hp`, so `gel` or
`keese` — the two enemies S76 explicitly rejected for `hurtFrame` — are
perfectly good `deathFrame` candidates, arguably better ones (`gel` in
particular dies constantly, in packs, so a real player will actually see
this pose often).

## The task
Pick ONE simple enemy (a `gel` is a reasonable default — cross-check
`docs/ENEMIES.md` first so the choice doesn't contradict its own written
lesson) and give it a real, in-engine `deathFrame`:
1. Decide the minimal shape: does `Enemy` need its own `dying`/`deathTime`
   fields (mirroring `Boss`'s, at a much shorter duration), or is there a
   simpler mechanism that doesn't need a new per-frame timer at all? Look
   at `Entity.die()` (`src/game/entity.js`) and `game.js`'s
   `this.entities = this.entities.filter(e => !e.remove)` (the exact line
   S76's ledger entry traced) — the removal has to be DELAYED for a death
   pose to ever draw, which is the one non-negotiable engine change.
2. Add whatever `feel.js` constant the linger duration needs, tagged
   `guessed` (nothing here has been frame-stepped against a reference) with
   a one-line reason, per `docs/FEEL-SPEC.md`'s existing convention.
3. Check `assets/sheets/oracle-seasons-enemies.png` for an unused box that
   is this enemy's own death/pop pose before drawing one by hand — S76's
   own survey (344 boxes, contact-sheet method in that session's log) found
   nothing for a hurt pose, but did not specifically look for a death pose,
   which Zelda sheets are more likely to carry (a "poof" or squash frame).
   If genuinely nothing is there, hand-draw one `<name>_death` frame in
   `src/data/sprites-enemy-hurt.js` (rename the file if a death frame no
   longer fits its name — your call, state it either way) or a fresh file,
   never in generated `sprites-enemies.js`.
4. Wire `deathFrame` into this enemy's `defineEnemy` call.
5. Do NOT attempt `attackFrame` this session — S76's own reasoning for why
   it needs a dedicated design session, not a mechanical extension, still
   holds; do not reopen that question by surprise mid-session.

## Done means
- One enemy visibly holds a distinct death pose for a short, deliberate
  window after `hp` reaches 0, before its entity is actually removed —
  provable with the same kind of scratch Playwright proof S76 used
  (`e.hurt()` for enough damage to kill it, then screenshot before and
  during the linger window).
- `node tools/check-drift.mjs`'s enemy-roster table shows that enemy with
  `hurt` (if it already has one) AND/OR `death: true` — reads sprite-key
  naming for death (`<name>_death`/`<name>_die`), not a spec field; if your
  shape changes that, say so explicitly and update the checker's own
  comment, don't leave it describing a contract that no longer matches.
- `node tools/validate.mjs`, `node tools/test.mjs`, `node tools/check-
  rippers.mjs` (only if a generated file changed — it shouldn't),
  `node tools/replay.mjs`, `node tools/check-playthrough.mjs` all pass.
  Read the replay/playthrough output carefully: delaying entity removal is
  a change to the shared death path every enemy in the game uses, so a
  regression here is exactly the kind CLAUDE.md's own trap notes warn
  about ("a five-line change to the movement path is never a five-line
  change") — treat any baseline drift as a real finding, not noise to
  silence.
- `npm run build` re-run, `dist/oracle-of-tides.html` committed only if
  `src/` changed.
- STATE.md gets one new session-log row, and a short note in
  `docs/NEXT-SESSION.md` on whether `attackFrame` now looks any more
  tractable given whatever `deathFrame`'s shape turns out to need.

## Out of scope
- All 22 enemies this session — one proves the path, same as S76.
- `attackFrame` — still a separate, harder design question (S76's own
  finding: no shared trigger exists in `ai()` today).
- Boss art or boss death timing (`Boss.beginDeath` etc.) — read-only
  reference this session, not something to refactor.
- Rewriting `docs/ENEMIES.md`'s lessons to fit new art.
