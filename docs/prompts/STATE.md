OBJECTIVE OF RECORD: 2 art-provenance

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

FILE ALLOWLIST for the current objective (2 art-provenance):
  tools/shoot-sprites.mjs (new)
  src/data/sprites-bosses.js, sprites-gear.js, sprites-link.js,
    sprites-title.js, sprites-trade.js, sprites-world.js (hand-authored;
    edit directly)
  src/data/sprites-player.js, sprites-npcs.js, sprites-races.js,
    sprites-enemies.js, sprites-hud.js, sprites-fairies.js (GENERATED —
    CLAUDE.md's table. Never hand-edit. A provenance tag on one of these
    goes into its ripper, tools/rip-link.py, rip-npcs.py, rip-races.py,
    rip-enemies.py, rip-hud.py, rip-fairies.py respectively, then the
    ripper re-runs to emit the file. check-rippers.mjs fails on any
    hand-edit to the output.)
  dist/oracle-of-tides.html
  docs/NEXT-SESSION.md
  docs/prompts/LEDGER.md

DETOUR TOKENS: 1

SESSION LOG: one row per session — `S## | objective|detour | one line`
S2 | objective | corrected objective 1's bar to 3 of 6 (was 4 of 6); added art-provenance/boss-art/enemy-roster/npc-detail as rotation #2-5, renumbered region-art/item-reuse/feel-measure to #6-8, item-reuse's condition now names only the 4 single-use items; added sprite-provenance (561 entries, 13 tagged) and enemy-animation-completeness (0 of 22 complete) metrics to check-drift.mjs
S3 | objective | widened D4's Cistern Floor 2x1->3x1 (a free-right cell S46 never checked, since it only tried growing down); 2x2/3x1 count now 2 of 6 dungeons (was 1), still short of the 3-of-6 bar; all named checkers + test.mjs + build green
S4 | objective | widened D5's Shrine Ford 2x1->3x1 (fully isolated free cell, no puzzle coordinate touched); 3 of 6 dungeons now qualify (D4,D5,D6) — rotation #1 DONE; advanced OBJECTIVE OF RECORD to #2 art-provenance, rewrote allowlist to flag which sprite files are ripper-generated (never hand-edit) vs hand-authored
S5 | objective | built tools/shoot-sprites.mjs (contact sheets via the live Sheet, both scales, all 12 files); found the shared entry-regex also matches same-named palette arrays and (in sprites-title.js) font-glyph/layout data, not just art — recorded, not fixed; tagged all 49 sprites-bosses.js entries `drawn` (file's own header already says hand-drawn, no ripper exists); check-drift's drawn count 10->59; test.mjs + build green
