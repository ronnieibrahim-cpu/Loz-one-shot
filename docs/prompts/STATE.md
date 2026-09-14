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
S63 | objective | Put the remaining npc-detail question to the person running these sessions directly, following the idle-art precedent rather than deciding alone: 9 identities across 3 groups (npc_fisher 2, npc_child 3, npc_hood_blue 2) plus npc_salter_d (2, likely-deliberate clan hood) have no extraction path left after S62 confirmed both source sheets exhausted — hand-draw new portraits for the rest, or call npc-detail done with the gap documented. Answer: call it done, advance. STATE.md rewritten: OBJECTIVE OF RECORD -> 6 region-art, allowlist rewritten (docs/AUDITED-ROOMS.md is empty — 0 of ~120 overworld rooms have a verdict), npc-detail's closure reasoning folded into the Note line. Zero code changes this session (decision + STATE.md/LEDGER.md only)
S64 | objective | Per NEXT-PROMPT.md's own task, audited the 4 Tidewatch Village screens (overworld 0,4,7/0,5,7/0,4,8/0,5,8) against docs/ART-DIRECTION.md, the first rows docs/AUDITED-ROOMS.md has ever had. Screenshotted each at all 3 tides (tools/shoot-rooms.mjs), zoomed crops of every ground-type boundary (grass/sand, grass/dry-pool, grass/water-channel) to check for a composited edge rather than a hard pixel cut (all clean, matches the S39 "shore has a rim" fix), and checked every sprite (villagers, shoreSalter/FOLK.salter, crab, octorok, Mirren's new npc_fisher2) for register consistency. One ambiguous case looked at closely and ruled a non-issue: Driftwood Strand's small dark-teal bush beside a tree crown is a genuinely different decoration type (bush vs. tree, both legitimate Oracle prop classes), not a palette mismatch — confirmed by zooming rather than judged from the thumbnail. No real defect found in any of the 4 rooms; wrote 4 honest "checked, nothing wrong" verdicts rather than inventing findings. check-drift's audit count now reads 4 of 120. Fixed a stale "objective #2" reference in AUDITED-ROOMS.md's own header (region-art is #6 in the current rotation) while touching the file. Zero src/ changes — no defect meant no fix needed. Full regression: check-drift self-checks OK, check-playthrough 21/21 (unaffected as expected), npm run build (dist unchanged, confirming no src/ drift)
