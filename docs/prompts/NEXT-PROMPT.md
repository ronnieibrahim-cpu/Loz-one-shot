# Next session — widen D5's Shrine Ford to 3x1

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — current objective, file allowlist, detour tokens.
- The "S68" entry in `docs/NEXT-SESSION.md` (search for "the second `3x1`
  room") for the exact method used last time: find a room with a genuinely
  free block using the map registry's own occupancy index, grow into it,
  leave every local coordinate alone. That entry also names the free-right
  candidates it found in every dungeon, D5's Shrine Ford among them.
- `src/data/dungeons-b.js`, the `reefseedRoom` block inside `'0,4,2'` (The
  Shrine Ford) — its stakes/snarl/cutFrom coordinates are all inside columns
  0-19; growing right must not need to touch any of them.

## Why this, now
STATE.md's objective of record is rotation #1, wide-rooms: done at 3 of 6
dungeons holding a `2x2` or `3x1` room. `node tools/check-drift.mjs` reports
2 of 6 (D4's Cistern Floor, D6's Tideshade Hall). One more distinct dungeon
clears the bar.

## The task
Widen D5's `0,4,2` ("The Shrine Ford", currently `size:[2,1]`) to `size:[3,1]`
in `src/data/dungeons-b.js`. Cell `6,2` has nothing keyed to it — confirm
that against the live `MAPS` registry before touching anything, the same way
S68 did, rather than trusting this prompt. Append 10 columns of new floor to
the right, open the current east wall (column 19) into it, and give the new
space a one-sentence reason to exist rather than leaving it an empty box —
S68's causeway-and-ledge treatment of D4's Cistern Floor is one example of
what that looks like, not a template to copy verbatim. Do not move the
`reefseedRoom` entry/stakes/snarl/cutFrom coordinates or any entity.

## Done means
- `node tools/check-drift.mjs` reports 3 of 6 dungeons with a `2x2` or `3x1`
  room — the rotation's own done-condition. If it does, advance
  `OBJECTIVE OF RECORD` in STATE.md to rotation #2 (art-provenance) and
  rewrite the file allowlist for it; if some other room turned out to fit
  the free block better once checked in-engine, 2 of 6 with a clean writeup
  is still an acceptable session.
- `node tools/validate.mjs`, `node tools/walk-dungeons.mjs`,
  `node tools/check-dungeon-strands.mjs`, `node tools/check-placement.mjs`,
  `node tools/check-ground.mjs`, `node tools/check-wide-rooms.mjs`,
  `node tools/check-camera.mjs`, `node tools/check-reefseed.mjs`,
  `node tools/check-playthrough.mjs`, and `node tools/test.mjs` all pass.
- `npm run build` re-run, `dist/oracle-of-tides.html` committed.
- STATE.md gets one new session-log row.
- Screenshots (`tools/shoot-rooms.mjs d5,0,4,2` at all three tides) show the
  new area in the same palette as the rest of the room, no seam artefact.

## Out of scope
- Widening a second room this session.
- D2's Reefguard Hall as an alternative target — S68 flagged it as
  unaudited against the current `check-playthrough.mjs` route rather than
  cleared; leave that question for whoever wants to spend a detour token
  chasing it.
- Any room size outside `room.js`'s existing `ROOM_SIZES` list.
- Rewriting `reefseedRoom`'s puzzle logic itself — only the room's footprint
  and its dead space change.
