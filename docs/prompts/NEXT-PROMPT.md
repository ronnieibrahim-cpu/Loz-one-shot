# Next session — build attackFrame and land it on moblin

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist.
- `docs/NEXT-SESSION.md`'s S87 entry (`anglerfry_death`, the newest) — it
  closes the 17-session `deathFrame` sub-thread and explains why `moblin`
  is the pilot for this session's genuinely different task: `attack`,
  not another enemy's death pose.

## Why this, now
Every killable enemy now has `walk`+`death` (and `hurt` where hp allows
it). `docs/ENEMIES.md`, the objective's documentation half, is already
complete. The remaining gap for objective #4 (enemy-roster) is the art
half's `idle`/`attack` states — no engine field for `attack` exists at
all yet. `moblin` (`src/data/enemies.js`) already has the art needed to
prototype it with ZERO new drawing: `moblin_d1`/`u1`/`s1` are
already-extracted "spear raised" frames (`tools/rip-enemies.py`'s own
FRAMES comment: "idle frame, then the same angle with its spear raised")
that currently just alternate into the ordinary walk cycle as a second
walk frame, rather than showing specifically during the actual
spear-throw (`shoot()`, called from `moblin`'s `ai()`).

## The task
1. Read `hurtFrame`/`deathFrame`'s existing plumbing first, as the
   template to mirror: `Enemy.hurt()`/`Enemy.die()`/`Enemy.update()`/
   `Enemy.spriteName()` (`src/game/enemy.js`), and the `flicker`/`dying`/
   `deathTime` fields they use. `attackFrame` is a different SHAPE of
   trigger though — it fires from the enemy's own offensive action, not
   from taking damage — so don't just copy the hurt/death mechanism
   verbatim; work out where the trigger actually belongs.
2. Add a `spec.attackFrame` convention (a sprite name string, same shape
   as `hurtFrame`/`deathFrame`) and a way to track "currently showing the
   attack pose" on the entity (a frame counter, the same style
   `flicker`/`invuln` already use). Consider setting it from `shoot()`
   itself (`src/game/enemy.js` — the shared helper `moblin`, `octorok`,
   `octorokSea`, `wizzrobe`, `siren` all call) rather than duplicating it
   per-enemy: `shoot()` is already "the one funnel every attack passes
   through," the same reasoning `Entity.hurt()`'s own comment gives for
   routing hitstop through one place. Setting it unconditionally in
   `shoot()` is harmless for every enemy without `spec.attackFrame` — only
   `spriteName()` reading it, gated on `spec.attackFrame` existing, has
   any visible effect.
3. Decide and implement `spriteName()`'s priority order: `dying` (already
   first) should still win over everything, and getting hit
   (`flicker`/`hurtFrame`) should almost certainly still interrupt an
   attack pose — but the actual ordering is this session's call, reasoned
   out, not assumed from this prompt.
4. Add a new `feel.js` constant for how long the attack pose shows (own
   unit + provenance comment, `guessed` is fine — see
   `ENEMY_DEATH_FRAMES`'s own comment for the expected shape). `node
   tools/check-feel.mjs` must still pass.
5. Wire `attackFrame: 'moblin_d1'` (or the direction-appropriate
   equivalent — `moblin`'s frames are already split by facing) onto
   `moblin`'s `defineEnemy` call, OR restructure however makes sense given
   `moblin` already has THREE facings each with their own attack-pose
   frame (`d1`/`u1`/`s1`) — a single `attackFrame` string won't capture
   that on its own; work out the right shape rather than force-fitting the
   `hurtFrame`/`deathFrame` convention if it doesn't actually match.
6. Verify in-engine: force `moblin`'s `shoot()` to fire (or call it
   directly) and confirm `spriteName()` shows the attack pose for the
   right duration in each of moblin's three facings, then correctly
   reverts to the ordinary walk cycle. Confirm a hit landing DURING the
   attack pose behaves the way step 3's ordering decided, don't just
   assume it works.
7. Update `tools/check-drift.mjs`'s "attack" column from sprite-key-naming
   (its current, deliberately-temporary signal — see the comment already
   in the file) to reading the real `spec.attackFrame` field, the same
   fix S14 already made for "death." `moblin` should now read
   `walk,attack,hurt,death` — the first enemy with all four engine-backed
   states except `idle`.
8. Run the full regression sweep: `validate.mjs`, `test.mjs` (83/83),
   `check-playthrough.mjs` (21/21), `replay.mjs` (51/51) — re-record
   anything that diverges — `check-feel.mjs`, `check-build.mjs`.

## Done means
- `moblin` shows a real attack pose during its actual spear-throw, in all
  three facings, proven by an in-engine probe.
- `node tools/check-drift.mjs` shows `moblin: walk,attack,hurt,death` (or
  close to it, depending on how idle is handled) and the "attack" column
  reads the real engine field, not sprite-key naming.
- `node tools/check-feel.mjs` passes with the new constant tagged.
- `node tools/validate.mjs`, `node tools/test.mjs` (83/83),
  `node tools/check-playthrough.mjs` (21/21), `node tools/replay.mjs`
  (51/51) all pass, confirmed by actually running them.
- `npm run build`, `dist/oracle-of-tides.html` committed.
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines).

## Out of scope
- Rolling `attackFrame` out to any other enemy this session — prove the
  mechanism on `moblin` alone first, the same way `hurtFrame` (S12) and
  `deathFrame` (S13) each started on one enemy before becoming a
  roster-wide thread.
- `idle` states — a separate, still-larger undertaking (new art for
  every enemy, not just moblin's already-existing spear pose). Not this
  session's problem.
- `bubble`, `beamos`, `barnacle` — hp 999, permanently out of scope for
  everything in this objective.
