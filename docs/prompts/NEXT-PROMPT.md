# Next session — fix check-drift's stale death-state metric

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #4 (enemy-roster) and its file
  allowlist, which now includes `tools/check-drift.mjs` for this reason.
- `docs/NEXT-SESSION.md`'s two newest entries (the `deathFrame` build/proof
  on `stalfos`, and the re-assessment of `attackFrame` against it) — they
  are why this session's task is the metric, not another enemy.

## Why this, now
S12 gave `wisp` a real `hurtFrame` and S13 gave `stalfos` a real
`deathFrame`, both proven in-engine. `check-drift.mjs`'s enemy-roster table
reads `hurt` correctly — it greps the enemy's own `defineEnemy` spec block
for `/\bhurtFrame\s*:/` — but reads `death` a different, older way: it
greps `src/data/sprites-enemies.js` for a sprite KEY named `<name>_death`
or `<name>_die`. That heuristic predates `spec.deathFrame` existing at all
(its own header comment says so: "there is no engine-level `attackFrame` or
`deathFrame` concept ... only bosses declare `hurtFrame` today"). It is now
simply wrong for `death` the same way it was already right for `hurt`, and
it will never see `stalfos_death` — that key lives in the hand-authored
`sprites-enemies-hurt.js`, not the ripped `sprites-enemies.js`, because
CLAUDE.md forbids hand-editing a generated file. Fixing this is small,
mechanical, and was deliberately left for its own session (S13's log row)
rather than folded into art work.

## The task
In `tools/check-drift.mjs`, find the enemy-roster block (search
`Enemies with a complete`). Change the `death` line from a sprite-key
lookup to a spec-block regex, the same shape `hurt` already uses two lines
above it:
```js
const hurt = /\bhurtFrame\s*:/.test(block);
const death = /\bdeathFrame\s*:/.test(block);   // was: enemySpriteKeys.has(...)
```
`enemySpriteKeys` and the file read that builds it
(`src/data/sprites-enemies.js`) may become dead code once nothing else
uses them — check with a repo-wide grep before deleting anything; if
`attack`'s own line still needs it, leave it and only change `death`.
Update the block comment above (`// src/game/enemy.js recognises exactly
two ...`) — it is now stale in the same way the code was: `deathFrame` is
a real engine field today, not just a naming convention. Do not touch
`attack`'s own line or add an `attackFrame` engine field — that redesign
is still explicitly out of scope (see `docs/NEXT-SESSION.md`).

After the fix, run `node tools/check-drift.mjs` and confirm `stalfos` now
reads `walk,death` (not `walk`) and the "Enemies with a complete ...
set" count is unchanged at 0 of 22 (nothing has all four yet — `wisp` is
`walk,hurt`, `stalfos` is `walk,death`, neither is complete). If either
number surprises you, the fix is wrong — stop and re-read `Enemy.die()`
(`src/game/enemy.js`) rather than adjusting the check to match.

## Done means
- `tools/check-drift.mjs`'s `death` column reads `spec.deathFrame` from
  each enemy's own block, mirroring `hurt`'s existing pattern exactly.
- `node tools/check-drift.mjs` runs clean (self-checks OK), and its printed
  table shows `stalfos: walk,death`, `wisp: walk,hurt`, everything else
  unchanged.
- `node tools/test.mjs` and `node tools/validate.mjs` still pass (neither
  should be touched by this, but confirm nothing else reads the old
  `enemySpriteKeys` logic in a way this change breaks).
- STATE.md gets one new session-log row (delete the oldest if over 60
  lines); note in it whether `enemySpriteKeys` became unused and, if so,
  whether you removed it or left it for `attack`.
- No sprite, enemy-data, or `dist/` changes this session — this is a tool
  fix, not art or engine work, so `npm run build` is not required unless
  you touched `src/`.

## Out of scope
- Giving any enemy an `attackFrame` or an engine field for one — still the
  bigger redesign identified in S12/S13; do not start it.
- Giving a third enemy a `hurtFrame` or `deathFrame` — this session is the
  metric, not more art; that resumes next once the metric is trustworthy.
- Rewriting `docs/ENEMIES.md`'s lessons — unrelated to this task.
- Any change to how `attack` is measured — only `death` is known stale.
