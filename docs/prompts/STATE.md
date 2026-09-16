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
S77 | objective | Finished reef row 1 (Palace Mouth, Spire Shallows) and opened row 2 (Sunken Colonnade, Reef Market, Drowned Steps, Outer Reef). Palace Mouth's white sparkle is a drip particle off the cave-mouth ceiling, not a defect. Found and fixed a real instance of the S76 ledge rule the S76 sweep's own grep missed: Spire Shallows had a 4-cell ledge stranded in the dead centre of a symmetric sand pocket (the S76 grep only caught rooms with ZERO cliff chars at all; this room's border walls are cliff chars, so it slipped through even though the ledge itself still had nothing to drop from or land into) — levelled it to plain sand, not load-bearing. Drowned Steps' own ledge is the good version of the same fixture (sits right below a `tideRock` shelf, a real one-level elevation change) and was left alone on purpose. check-drift's audit count now 72 of 120, split 15 Tidewatch Village / 12 Marsh / 18 Dunes / 15 Wood / 12 Reef. Full regression: validate.mjs, check-overworld.mjs 17/17, check-strands.mjs (baseline unchanged), check-placement.mjs, check-ground.mjs, test.mjs 83/83, check-playthrough.mjs 21/21, check-drift self-checks OK, npm run build (dist changed)
S78 | objective | Finished the reef's last row (Reef Foot, Barnacle Bank, Palace Causeway, Reef Edge) — **the reef region is now fully audited, 16/16**. Zero src/ changes; every visual question this batch raised turned out to be a correct read verified in-engine rather than a defect: Barnacle Bank's `reefDeep` looked static across tides on screen but `room.tile()` plus a raw pixel sample confirmed a real, just-subtle colour shift (168,232,208 -> 72,176,152); Reef Edge's growing blue patch is a `sandbar` column joining the permanent `openSea` beside it, not a bug. One real off-plan finding logged to `docs/NEXT-SESSION.md` rather than chased (no detour token): the ten shared tide-digit tiles (`sandbar`, `tideRock`, etc.) hardcode the plain ocean palette in every region including reef, so a reef room's ordinary flooded sand sits in generic blue right next to `reefFlat`/`reefDeep`'s teal — no room audited so far actually puts them in contact, so nothing clashes on screen yet, but it's pervasive across every reef room already passed and worth a real look later. check-drift's audit count now 76 of 120, split 15 Tidewatch Village / 12 Marsh / 18 Dunes / 15 Wood / 16 Reef. Full regression: validate.mjs, check-overworld.mjs 17/17, check-strands.mjs (baseline unchanged), check-placement.mjs, check-ground.mjs, check-playthrough.mjs 21/21, check-drift self-checks OK, npm run build (dist unchanged, no src edits)
