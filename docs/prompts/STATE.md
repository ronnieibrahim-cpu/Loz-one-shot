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
S75 | objective | Opened the reef region (legend `reef`, first time this rotation) with its whole top row (Coral Gate, Palace Wall, Tide Steps, East Spire) plus the start of row 1 (Reefway, Hooked Channel). `g` is `rockFloor` here rather than grass, a genuinely distinct stony-ruin palette from every grass region audited so far. Confirmed `reefFlat`/`reefDeep`/`tideRock`/`channel` each flood on their own distinct, correctly-different schedules (e.g. `tideRock` stays dry through MID and only floods at HIGH, one level later than the neighbouring `reefFlat`). One more spawn-position coincidence (East Spire's jellyfish, same shape as S70/S73) confirmed harmless by re-shooting after it wandered off. Zero new defects, zero src/ changes. check-drift's audit count now 66 of 120, split 15 Tidewatch Village / 12 Marsh / 18 Dunes / 15 Wood / 6 Reef. Full regression: check-drift self-checks OK, check-playthrough 21/21, check-strands OK (baseline), npm run build (dist unchanged)
S76 | objective | Direct request from the person running these sessions, not a rotation task: add a CLAUDE.md rule that a ledge only belongs at a real elevation change (cliff/terrace/bank), never floating in the middle of open ground — the source games never do that. Added the rule (CLAUDE.md's "Traps" section, after the existing ledge-connectivity bullet), then swept for existing violations: a grep for "has a ledge char but zero cliff chars anywhere in the room" found exactly 4 rooms, all previously audited and cleared under the old, narrower "is the art itself broken" standard — Wood Edge, Wood Heart, Dune Head, Dune Bowl. None was load-bearing for connectivity (every room already had a path around it), so each ledge run was leveled to its own neighbouring floor tile and the 4 AUDITED-ROOMS.md rows revised in place, dated and marked **Revised** with the old verdict's blind spot named. check-drift's audit count unchanged at 66 of 120 (revisions, not new rows). Full regression: validate.mjs, check-overworld.mjs 17/17, check-strands.mjs (unchanged baseline), check-placement.mjs, check-ground.mjs, test.mjs 83/83, check-playthrough.mjs 21/21, check-drift self-checks OK, npm run build (dist changed)
