# Next session — give Rootmaw a margin from the route

## Read first
- `docs/prompts/STATE.md` — the whole file (no objective of record; the
  human names the next one, and this task stands until they do).
- `docs/prompts/LEDGER.md`'s "Settled at S144" and "Settled at S141".
- `docs/NEXT-SESSION.md`, the S144 entry and the S141 entry.
- `docs/HANDOFF.md`'s first four hard-won lessons.
- `tools/measure-boss-combat.mjs`'s header: how a route arena is set up.

## Why this, now
Rootmaw (D5's boss) is the thinnest fight in the game: 8 of 13 seeds from
his route door on 28 of 40 quarter-hearts, unchanged since S141, and the
wins end on 2..16. Every other boss is 10/13 or better. The real run wins
him, but on its own stream, the way the King was won before S144.

## The task
Measure Rootmaw's thirteen seeds and read the losses hit by hit
(`tools/measure-boss-combat.mjs d5 --seed=N`). Sample the real stream too,
by re-rolling the fight without changing it (walk-rounds of Rootmaw Arch
before the boss door, run with `tools/route-prefix.mjs`). Fix from the
route first: a heal on the way through the Drowned Wood Shrine, a planned
kill of something that bites twice, or an opt-in fight option in
`tools/actor-runtime.mjs` if the losses are the robot's play. Retune the
fight in `src/data/bosses.js` only with 13 seeds either side, and damage,
not hp. Target: 11 of 13 in the rig and on the real stream.

## Done means
- `node tools/measure-boss-combat.mjs d5` over 13 seeds, before and after,
  in LEDGER; real-stream samples before and after.
- `node tools/check-playthrough.mjs` green to THE END with no deaths.
- `replay`, `test.mjs`, `check-bosses`, `check-respawn` green.
- `check-drift` OK; `npm run build` with `dist/` committed.
- A person plays Rootmaw once and says whether the fight felt fair.

## Out of scope
- Making `evade` ask the room whether a step is possible (S144 names it);
  it re-rolls every fight in the game and is its own session.
- The Bellows' "shove light enemies into pits" verb (NEXT-SESSION S143).
- Adding rooms to any dungeon; every dungeon is at its ladder size.
- Changing a boss's hp (phase thresholds re-roll the fight — S137).
- Re-measuring the other eight fights; S144 did, and none read worse.
