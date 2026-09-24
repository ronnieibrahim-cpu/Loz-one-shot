# Next session — give the Brinehulk a margin

## Read first
- `docs/prompts/STATE.md` — the whole file (no objective of record; the
  human names the next one, and this task stands until they do).
- `docs/prompts/LEDGER.md`'s "Settled at S145" and "Settled at S144".
- `docs/NEXT-SESSION.md`, the S145 entry and the S144 entry.
- `docs/HANDOFF.md`'s first four hard-won lessons.
- `tools/measure-boss-combat.mjs`'s `MINIS.brinehulk` row and its header.

## Why this, now
The Brinehulk (the salt colossus in the Abyssal Keep, guarding the Boss
Key) is the thinnest fight measured: 10 of 13 seeds at S144 on 45/48.
Every other boss and miniboss now reads 11/13 or better; Rootmaw went from
8/13 to 13/13 at S145 with one opt-in robot habit and a better route.

## The task
Measure the Brinehulk over thirteen seeds
(`node tools/measure-boss-combat.mjs --mini=brinehulk --seed=N`, the
default and 1..12) and read every loss hit by hit. First ask how long a
losing fight goes without dealing damage: a stall is the robot's play, not
health (S145). Try the existing opt-ins first (`--break-pin`,
`--break-contact`, `--open-retreat`, `--clear-adds`, `--push-through`).
Sample the real stream by the arena's own settle, not walk-rounds (a
fight is seeded by its room). Fix from the route first; retune
`src/data/bosses.js` only with 13 seeds either side, by damage, not hp.
Target: 11 of 13 in the rig, and the real run wins every settle sampled.

## Done means
- The 13-seed table before and after in LEDGER; real-stream settles too.
- `node tools/check-playthrough.mjs` green to THE END with no deaths.
- `node tools/replay.mjs`, `node tools/test.mjs`,
  `node tools/check-bosses.mjs`, `node tools/check-respawn.mjs` green.
- `node tools/check-drift.mjs` OK; `npm run build` with `dist/` committed.
- A person plays the Brinehulk once and says whether it felt fair.

## Out of scope
- Making `evade` ask the room whether a step is possible (S144); it
  re-rolls every fight in the game and is its own session.
- Fixing the robot's `goto` cutting corners over pits (S145 Open); a
  route waypoint is the fix inside this task.
- Changing any boss's hp (phase thresholds re-roll the fight — S137).
- Re-measuring Rootmaw or the King; both settled at S145 and S144.
- The Brinehulk's `drops: 'none'` (bosses.js says why it stays).
