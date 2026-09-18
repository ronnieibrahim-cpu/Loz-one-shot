# Next session — play the Abyssal Keep

## Read first
- `docs/prompts/STATE.md` — the whole file.
- `docs/NEXT-SESSION.md`, the S119 entry only. It says what closed the health
  gap and what the route now depends on.
- `docs/prompts/LEDGER.md`'s "Settled at S119" and "Settled at S118" sections.
- `tools/playthrough-route.mjs`'s last leg and its `GOAL` block.
- `src/data/dungeons-b.js`, the Abyssal Keep's own rooms — its two floors, its
  keys, its grate, and Nereth's arena.

## Why this, now
The run reaches the Abyssal Keep's mouth at `d6/0,3,7` on 30 of 44
quarter-hearts with every item in hand, the Resonance Rod included. The health
gap that blocked this is closed and asserted. Five dungeons and five bosses
have been played; the sixth has never been entered by anything that is not a
model. It is the last thing between the repo and a run that finishes the game.

## The task
Extend `tools/playthrough-route.mjs` past `d6/0,3,7` and take the Abyssal Keep
as far as it will go in one session. Two floors, its keys, the Colonnade's
grate — which only the Resonance Rod retracts, and no run has ever retracted
one — and the Dredge Line's own rooms. Stop at Nereth's door if the fight
needs sizing; a session that reaches the boss room and measures the fight is
an `objective` session even if the boss is not beaten. Raise `GOAL.room` and
`GOAL.keysNeeded` to whatever the run actually achieves, and add one assertion
in `tools/check-playthrough.mjs` naming the deepest thing it proved.

## Done means
- `node tools/check-playthrough.mjs` green, ending deeper than `d6/0,3,7`,
  with the new assertion and the half-of-max arrival assertion both passing.
- `node tools/check-drift.mjs`, `node tools/test.mjs`, `node tools/replay.mjs`,
  `node tools/walk-dungeons.mjs`, `node tools/check-dungeon-strands.mjs`,
  `node tools/check-trade.mjs`, `node tools/check-bosses.mjs`.
- `npm run build` with `dist/oracle-of-tides.html` committed.
- A person reads the room table and sees the run standing somewhere inside the
  Abyssal Keep that nothing has ever stood in.

## Out of scope
- Moving or re-tuning Shell Beach's fairy, or re-measuring the chain tour.
  Both are settled and the arrival number is asserted.
- `check-hearts`'s two failures — 23 pieces, and D5 holding one not two. Still
  not on the allowlist.
- Teaching `dFight` to beat a shielded enemy or to fight within a radius.
- Making `travel` cross a floor or plan a warp. It cannot, it never has, and
  every floor change in the route is named by hand.
- Redesigning any of the Keep's puzzles because the actor finds one awkward.
  A verb the actor lacks goes in `docs/NEXT-SESSION.md`, not in the dungeon.
