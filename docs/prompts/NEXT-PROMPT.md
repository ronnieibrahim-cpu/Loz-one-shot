# Next session — take the Boss Key and Nereth

## Read first
- `docs/prompts/STATE.md` — the whole file.
- `docs/NEXT-SESSION.md`, the S120 entry only. It has the Keep's routed order,
  the three verbs this run is built on, and the health problem below.
- `docs/prompts/LEDGER.md`'s "Settled at S120" section.
- `tools/playthrough-route.mjs`'s Abyssal Keep leg and its `GOAL` block.
- `src/data/dungeons-b.js`, the Crossed Shafts (`1,4,2`) and Nereth (`1,3,1`).

## Why this, now
The run stands at the Keep Gate with all four of the Keep's locks open and
thirteen of forty-four quarter-hearts. Two rooms are left in the whole game:
the Crossed Shafts, where the Brinehulk keeps the Boss Key and is armoured at
the only sea the room can be crossed at, and Nereth. No run has ever fought
either. Thirteen quarter-hearts is not enough for either of them, so the
session is a health leg and a boss leg, in that order.

## The task
Extend the Keep leg in `tools/playthrough-route.mjs` through floor 1's wings
and then through the Crossed Shafts to Nereth. The wings are where the health
is: the Shade Cell's heart, Tideshade Hall's miniboss and the Mermaid Vault's
level-2 Cleats behind it, the Sunken Bar's Piece of Heart, the Two Arches'
Lens fork, and the Colonnade's Coilrope behind the grate only the Resonance
Rod retracts — the one thing in the Keep that asks whether the player traded.
Then the Boss Key, then the sixth Essence. Raise `GOAL.room` and
`GOAL.essences` to what the run actually achieves and add one assertion in
`tools/check-playthrough.mjs` naming it. If Nereth cannot be beaten at the
health the run arrives on, measure the fight with
`tools/measure-boss-combat.mjs` and say so rather than granting anything.

## Done means
- `node tools/check-playthrough.mjs` green, ending deeper than `d6/1,3,2`,
  with the Keep assertion and the arch's half-of-max assertion both passing.
- `node tools/check-drift.mjs`, `node tools/test.mjs`, `node tools/replay.mjs`,
  `node tools/walk-dungeons.mjs`, `node tools/check-dungeon-strands.mjs`,
  `node tools/check-dredge.mjs`, `node tools/check-lens.mjs`,
  `node tools/check-bosses.mjs`, `node tools/check-charms.mjs`.
- `npm run build` with `dist/oracle-of-tides.html` committed.
- A person reads the room table and sees the run standing in the throne room.

## Out of scope
- Re-measuring the chain tour or moving Shell Beach's fairy. Settled at S119.
- Weakening Nereth, the Brinehulk, or any enemy's contact damage before the
  fight has actually been measured at the health the run arrives on.
- `check-hearts`'s two failures — 23 pieces, and D5 holding one not two.
- Teaching `travel` to cross a floor or plan a warp. Every floor change and
  every stair in the Keep is named by hand and stays that way.
- Making `dFight` cleverer about shields. The Rod already answers that; use it.
