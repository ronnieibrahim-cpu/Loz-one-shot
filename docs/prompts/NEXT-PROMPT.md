# Next session — widen one dungeon's room to 2x2

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — current objective, file allowlist, detour tokens.
- `docs/DUNGEON-STATUS.md`'s D6 section on Tideshade Hall — the one room in
  the game already widened this way, and the "genuinely free down-right
  block" condition that made it possible.
- The Tideshade Hall session entry in `docs/NEXT-SESSION.md` (search for
  "Tideshade Hall widened") for the exact method: grow into the free block,
  keep the puzzle/door/entities at their existing local coordinates, touch
  no other room.

## Why this, now
STATE.md's objective of record is rotation #1, wide-rooms: done at 3 of 6
dungeons holding a 2x2 or 3x1 room. `node tools/check-drift.mjs` currently
reports exactly one such room in the whole game — 1 of 6.

## The task
Survey D1 through D5 (D6 already has a qualifying room) for a room with a
genuinely free block in some direction, the same check the Tideshade Hall
session made before building. Widen ONE such room, in ONE dungeon, to 2x2
or 3x1 — files: `src/data/dungeons-a.js` or `src/data/dungeons-b.js`,
whichever holds the dungeon chosen.

## Done means
- `node tools/check-drift.mjs` reports 2 of 6 dungeons with a qualifying
  room (still short of the 3-of-6 bar — one room this session is enough).
- `node tools/validate.mjs`, `node tools/walk-dungeons.mjs`,
  `node tools/check-dungeon-strands.mjs`, `node tools/check-placement.mjs`,
  `node tools/check-ground.mjs`, `node tools/check-wide-rooms.mjs`,
  `node tools/check-camera.mjs`, and `node tools/check-bosses.mjs` (only if
  the widened room is a boss room) all pass.
- `npm run build` re-run, `dist/oracle-of-tides.html` committed.
- STATE.md gets one new session-log row.
- A person looking at the widened room in the game sees a deliberate space,
  not an empty box bolted onto the old one.

## Out of scope
- Widening a second room this session — one room fully validated beats five
  rooms half-checked.
- Touching Nereth's room (D6) again — already widened for a fairness
  reason unrelated to this objective; leave it alone.
- Any room size outside `room.js`'s existing `ROOM_SIZES` list.
- Spending the detour token on anything found while surveying for a free
  block — record it in `docs/NEXT-SESSION.md` per the charter's step 5 and
  keep going.
