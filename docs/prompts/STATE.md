OBJECTIVE OF RECORD: 6 region-art

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

FILE ALLOWLIST for the current objective (6 region-art):
  docs/AUDITED-ROOMS.md — one row per overworld room actually looked at:
    key, region, name, date, one-sentence verdict (header names the exact
    column order tools/check-drift.mjs parses — don't reorder it)
  tools/shoot-rooms.mjs — screenshot tool, already exists; use it, don't
    fork it. `node tools/shoot-rooms.mjs overworld,rx,ry` per room
  docs/ART-DIRECTION.md — read-only reference for what to check a room
    against; only edit if this session finds the rule itself wrong
  src/data/overworld.js, src/data/tiles-terrain.js — ONLY for a confirmed
    art defect found while auditing, not proactive polish; re-screenshot
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

DETOUR TOKENS: 0

SESSION LOG: one row per session — `S## | objective|detour | one line`
S83 | objective | Finished the cliffs region's second row (Cistern Path, Cistern Mouth, Kell Ledges, Cliff Face) — **the cliffs region is now half audited, 8/16.** No terrain defects found: Cistern Path's ledge sits between two different tiles the same as Wind Shelf; Cistern Mouth's D4 dungeon-mouth `drownWall` strip and entrance-dais ledge both read as a legitimate raised platform, matching source-game dungeon-mouth convention; Kell Ledges was confirmed to still have its historical sand-fallthrough bug (CLAUDE.md's cliffs-legend comment) fixed, sand only bordering water now; Cliff Face's `sandbar`/`drownWall` bands both floods dry->wadeable->deep exactly per their tile definitions. check-drift's audit count now 96 of 120. Full regression: check-overworld.mjs 17/17, check-strands.mjs (15 stranded regions/24 cells, baseline unchanged), check-placement.mjs, check-playthrough.mjs 21/21, check-drift self-checks OK, npm run build (unchanged, no src touched).
S84 | objective | Finished the cliffs region's third row (Low Kell, Boulder Run, Kell Basin, The Deep Cut) — **the cliffs region is now three-quarters audited, 12/16.** No terrain defects found. Two ambiguities chased to ground and ruled out: Boulder Run's beetle in its round charge pose visually overlapped Link closely enough at low zoom to read as "Link missing" — a tighter crop confirmed both sprites present; The Deep Cut's `sandbar` strip above the Squall Bellows' raft looked like it stayed dry gray at MID/HIGH in an unzoomed shot — a tighter crop confirmed it does flood wadeable then deep on schedule, and a HIGH-tide shot placing Link inside newly-deep water instead showed `canOccupy` correctly bumping him to the nearest dry tile. check-drift's audit count now 100 of 120. Full regression: check-overworld.mjs 17/17, check-strands.mjs (15 stranded regions/24 cells, baseline unchanged), check-placement.mjs, check-playthrough.mjs 21/21, check-drift self-checks OK, npm run build (unchanged, no src touched).
