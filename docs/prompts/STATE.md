OBJECTIVE OF RECORD: 1 wide-rooms

ROTATION (fixed, do not reorder):
  1 wide-rooms      — 3 of 6 dungeons have a 2x2 or 3x1
  2 art-provenance  — every sprite in src/data/sprites-*.js carries a
                      provenance tag in its comment: `extracted` (sheet +
                      cell recorded), `derived` (recoloured/recomposed
                      from extracted pixels), or `drawn` (invented, WITH a
                      written reason extraction was impossible). Plus
                      tools/shoot-sprites.mjs exists: one contact-sheet
                      PNG of every sprite, every enemy animation state,
                      and every NPC, at 1x and 3x.
  3 boss-art        — for each boss, either a rip-bosses.py extraction
                      path exists, or the writeup says per boss why the
                      source sheets can't supply it. sprites-bosses.js is
                      ~1568 lines and there is no rip script for it today.
  4 enemy-roster    — every enemy has idle/walk/attack/hurt/death states
                      and a one-line behavior spec in docs/ENEMIES.md
                      saying what the player learns from fighting it; no
                      two enemies teach the same lesson.
  5 npc-detail      — every NPC has a unique sprite and >=2 dialogue
                      states.
  6 region-art      — done when 90 of ~90 overworld rooms are in
                      docs/AUDITED-ROOMS.md with a verdict
  7 item-reuse      — only the Anchor, Lens, Bellows and Reefseed are
                      single-use (Cleats 5/5, Dredge Line 3/5 already
                      pass). Done when those four are each required in
                      >=2 later dungeons and >=3 overworld screens.
  8 feel-measure    — done when >=40 feel.js constants are tagged
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
S2 | objective | corrected objective 1's bar to 3 of 6 (was 4 of 6); added art-provenance/boss-art/enemy-roster/npc-detail as rotation #2-5, renumbered region-art/item-reuse/feel-measure to #6-8, item-reuse's condition now names only the 4 single-use items; added sprite-provenance (561 entries, 13 tagged) and enemy-animation-completeness (0 of 22 complete) metrics to check-drift.mjs
S3 | objective | first charter-run session; surveyed D1-D5 in the real map registry (fixed a false-positive in the survey script itself first — it missed a 2x1 room's second cell); widened D4's Ironknight Gallery miniboss room 2x1->3x1, mirroring S46's Tideshade Hall; 2 of 6 dungeons wide now, still short of the 3-of-6 bar
