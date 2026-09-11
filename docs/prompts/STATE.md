OBJECTIVE OF RECORD: 1 wide-rooms

ROTATION (fixed, do not reorder):
  1 wide-rooms      — done when 4 of 6 dungeons have a 2x2 or 3x1
  2 region-art      — done when 90 of ~90 overworld rooms are in
                      docs/AUDITED-ROOMS.md with a verdict
  3 item-reuse      — done when every dungeon item is required in >=2
                      later dungeons and >=3 overworld screens
  4 feel-measure    — done when >=40 feel.js constants are tagged
                      `measured` against the emulator

FILE ALLOWLIST for the current objective (1 wide-rooms):
  src/data/dungeons-a.js
  src/data/dungeons-b.js
  dist/oracle-of-tides.html
  docs/DUNGEON-STATUS.md
  docs/NEXT-SESSION.md
  docs/prompts/LEDGER.md

DETOUR TOKENS: 1

SESSION LOG: one row per session — `S## | objective|detour | one line`
S1 | objective | ran SETUP: created check-drift.mjs, STATE.md, AUDITED-ROOMS.md; measured baseline (1 of 6 dungeons wide, 0/0 reuse on 4 of 6 items, 0 feel.js constants measured, 0 rooms audited)
