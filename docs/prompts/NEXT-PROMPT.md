# Next session — grow the Abyssal Keep to 46 screens

## Read first
- `docs/prompts/STATE.md` — the whole file.
- `docs/prompts/LEDGER.md`'s "Settled at S142" and "Settled at S137" sections.
- `docs/NEXT-SESSION.md`, the S142 entry (its "Open" list names the planned
  wings) and S137 (the recipe).
- `src/data/dungeons-b.js`: the `d6` block and its header comment.
- `tools/check-dredge.mjs`'s header: what a crossing, a return and a cache
  must prove.

## Why this, now
All six dungeons are Oracle size (S137-S142). S141 the human asked for
dungeons that GROW the way the Oracle games' do, with less creative
restraint. STATE.md's ladder: D3 >=32, D4 >=36, D5 >=40, D6 >=46 screens.
D6 is 34.

## The task
Grow `d6` Abyssal Keep to at least 46 screens with new rooms and wings built
on the Dredge Line and the Keep's tide theme (the line crosses what the sea
uncovers, the floor gives up what the sea covers). Each new dredge room
declares `dredgeRoom` so `tools/check-dredge.mjs` proves it both ways, and
carries a readable hint. Bold, never obscure. Heart Pieces stay 24 in total
(`check-hearts.mjs`); new rewards can be unplaced charms, rupees, bombs or
a Heart Piece moved from elsewhere. Route any required new room with
`tools/route-prefix.mjs`; an optional one need not be routed. Then, if
there is room, grow D5, D4 and D3 the same way with their own items.

## Done means
- `validate`, `walk-dungeons`, `check-dungeon-strands`, `check-dredge`,
  `check-lens`, `check-trade`, `check-placement`, `check-ground`,
  `check-exits`, `check-hearts`, `check-items` green; `replay` and
  `test.mjs` green.
- `node tools/check-playthrough.mjs` green to THE END with no deaths.
- `check-drift` OK; `npm run build` with `dist/` committed.
- STATE.md's ladder brackets updated.

## Out of scope
- Re-kitting any dungeon; push-block art; torrent direction art; the pause
  menu's look. Re-balancing a boss beyond what a changed arena forces
  (measure over 13 seeds first; NEVER pass `--at=route`).
