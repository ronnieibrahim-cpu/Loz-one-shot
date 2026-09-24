# Next session — every enemy flinches and dies properly

## Read first
- `docs/prompts/STATE.md` — objective 11 polish, area (a) enemies, pass 1.
- `docs/prompts/QUEUE.md`'s "POLISH ROTATION" — this area and the five after.
- `docs/ENEMIES.md`'s "Idle states" section, and `docs/ART-DIRECTION.md`.
- `docs/briefs/AGENTS.md` section J (the extraction workflow).
- `docs/NEXT-SESSION.md`, the S145 entry only.

## Why this, now
The game plays to the end and every fight has a margin; the human has
named polish as the objective, one area per session. Enemies go first:
`check-drift` shows 10 of 22 with a hurt frame and 19 of 22 with a death
pose, so most of the cast does not react when hit, and three vanish when
they die.

## The task
Give all 22 enemies a hurt frame (`hurtFrame`) and a death pose
(`deathFrame`) in `src/data/enemies.js`. First run `tools/rip-enemies.py`
once and confirm it reproduces `src/data/sprites-enemies.js` byte for byte.
Then, for each missing frame, look in `assets/sheets/oracle-seasons-
enemies.png` and extract it by adding it to the ripper's coordinate map and
re-emitting. Only where no sheet holds it, draw it to match (CLAUDE.md's art
rules: three colours plus outline, `_s` faces right). Tag each frame's
provenance. Idle and attack frames stay where ENEMIES.md scoped them.
Target: drift reads 22 of 22 for hurt and 22 of 22 for death.

## Done means
- `node tools/check-drift.mjs`: hurt and death present for all 22; OK.
- `node tools/check-rippers.mjs` green; `node tools/test.mjs` green.
- `node tools/replay.mjs` green, or re-recorded only for the frames that
  changed, with the reason in the commit.
- `node tools/check-playthrough.mjs` green to THE END with no deaths.
- `npm run build` with `dist/` committed.
- A screenshot sheet of every new frame beside its walk frame, sent to the
  human; a person says whether each one reads as the same creature.

## Out of scope
- Enemy placement in rooms — that is pass 2 of this area, next time round.
- Idle or attack frames for the 13 enemies that never stand still.
- Feel, music, side content, fairness: their turns come (QUEUE.md b..f).
- Boss art (settled S75) and any change to what an enemy does.
- Hand-drawing anything the enemies sheet already has.
