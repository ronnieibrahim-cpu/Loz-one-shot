# Next session — widen a second dungeon's room to 2x2 or 3x1

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — current objective, file allowlist, detour tokens.
- The S68 entry in `docs/NEXT-SESSION.md` (search for "Ironknight Gallery
  widened") for the exact survey method and a bug it found and fixed first:
  a naive "is this room key occupied" check misses the SECOND cell of an
  existing `2x1` room, and trusting that would have picked a cell already
  covered by another room.

## Why this, now
STATE.md's objective of record is rotation #1, wide-rooms: done at 3 of 6
dungeons holding a 2x2 or 3x1 room. `node tools/check-drift.mjs` currently
reports 2 of 6 (D4, D6) — one more dungeon closes the objective.

## The task
Survey D3 and D5 (D4 and D6 already qualify) for a room with a genuinely
free growth block, the same check S46 and S68 both made before building —
build the full occupied-cell set from the real map registry (every cell a
room covers, not just its own key), not from reading the map by eye. Widen
ONE such room, in ONE dungeon, to 2x2 or 3x1 — files: `src/data/dungeons-a.js`
or `src/data/dungeons-b.js`, whichever holds the dungeon chosen.

D1 and D2 are still off-limits: they are the two dungeons
`check-playthrough.mjs` plays end to end, frame-exact, and a room change
there risks a route re-tune this objective has no budget for. D3's Kelp
Locks and D5's Shrine Ford are both already `2x1` and both have a free cell
to grow into, but both carry custom room geometry (`cleatRoom` mooring
coordinates on Kelp Locks, the bank/bole/stake/snarl Reefseed fixture on
Shrine Ford) that a growth would need to re-derive rather than just extend —
prefer a plainer room if one has a free block, the way Ironknight Gallery
(a miniboss arena, no custom geometry) was preferred over Kelp Locks last
session.

## Done means
- `node tools/check-drift.mjs` reports 3 of 6 dungeons with a qualifying
  room, closing rotation #1's done-condition.
- `node tools/validate.mjs`, `node tools/walk-dungeons.mjs`,
  `node tools/check-dungeon-strands.mjs`, `node tools/check-placement.mjs`,
  `node tools/check-ground.mjs`, `node tools/check-wide-rooms.mjs`,
  `node tools/check-camera.mjs`, and `node tools/check-bosses.mjs` (only if
  the widened room is a boss room) all pass.
- `node tools/check-playthrough.mjs` still 21/21 (D3/D5 aren't on the
  route, so this should be a byte-identical confirmation, not a fix).
- `npm run build` re-run, `dist/oracle-of-tides.html` committed.
- STATE.md gets one new session-log row. If 3 of 6 is reached, advance
  OBJECTIVE OF RECORD to rotation #2 (art-provenance) and rewrite the file
  allowlist for it.
- A person looking at the widened room in the game sees a deliberate space,
  not an empty box bolted onto the old one.

## Out of scope
- Widening a second room this session — one room fully validated beats five
  rooms half-checked.
- D1 or D2, for the check-playthrough reason above.
- Kelp Locks or Shrine Ford, unless the survey finds nothing plainer in D3
  or D5 — see "The task" for why they're a worse first choice, not a banned
  one.
- Any room size outside `room.js`'s existing `ROOM_SIZES` list.
- Spending the detour token on anything found while surveying for a free
  block — record it in `docs/NEXT-SESSION.md` per the charter's step 5 and
  keep going.
