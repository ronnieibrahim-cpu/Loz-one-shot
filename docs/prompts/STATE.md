OBJECTIVE OF RECORD: 7 item-reuse

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

FILE ALLOWLIST for the current objective (7 item-reuse):
  src/data/dungeons-a.js, src/data/dungeons-b.js — dungeon room data;
    where a new Anchor/Lens/Bellows/Reefseed-gated obstacle gets added
  src/data/overworld.js — where a new overworld screen gets an
    Anchor/Lens/Bellows/Reefseed requirement
  docs/ITEMS.md — read-only reference for each item's three verbs; only
    edit if a session finds the doc itself wrong
  docs/DUNGEON-STATUS.md — read before touching a dungeon marked done;
    tick/update if a change affects its checklist
  dist/oracle-of-tides.html
  docs/NEXT-SESSION.md
  docs/prompts/LEDGER.md

Note (keep): #2 done S9/S74 (untagged 175 = non-sprite regex noise).
#3 done S75 (docs/ART-BACKLOG.md, all 8 bosses hand-drawn, reasoned).
#4 done S59 (human decision): hurt/death/attack complete or structurally-
blocked roster-wide; idle urchin-only, other 8 judged against its bar
and none clear it (S55/S57), human confirmed no further idle art.
#5 done S63 (human decision): dialogue complete roster-wide (S60);
sprite uniqueness 13/22 (S61 spent 3 free sprites, S62 extracted 1 new),
remaining 9 have no extraction path left (both sheets exhausted, S62),
human confirmed no further hand-drawn NPC art. Wrong on any -> revert.
#6 done S89: 120/120 overworld rooms in docs/AUDITED-ROOMS.md, every
region audited S64-S89. Real fixes landed along the way (S76-S81 ledges).

DETOUR TOKENS: 0 (S96 is the 1st of 2 consecutive objective sessions to regen)

SESSION LOG: one row per session — `S## | objective|detour | one line`
S96 | objective | Gave the Reefseed its first room outside D5: a new grove, D6's `0,4,2` "The Bole Cistern", off Dredge Vault's own north wall (opening it needed BOTH top rows, not one — walk-dungeons caught the first attempt). Fixture copied unchanged from D5's own Grove 2; `dungeonAbyss` repoints `5`/`k` to `dSnag`/`dSnarl`, same as D5's own theme. check-reefseed 102/102 first run. check-drift reads `reefseed dungeons: 1 of 5` (up from 0) — D6 is the only dungeon after D5, so that is this item's real ceiling under the tool's own filter, not a shortfall. Full regression green (walk-dungeons 27 rooms, check-dungeon-strands no new multi-cell region, check-progression, check-placement, check-ground, check-playthrough, test.mjs, build). Full writeup: docs/prompts/LEDGER.md "Landed", docs/DUNGEON-STATUS.md D6 section.
