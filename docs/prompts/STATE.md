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
S81 | objective | Finished the salt region's last row (South Pan, Cracked Basin, Vault Steps, Pan Corner) — **the salt region is now fully audited, 12/12.** No terrain defects found this time: South Pan's ledge sits between two genuinely different tiles (`saltCrust` inside the pan, `saltFlat` outside), not the same-texture floating-ledge pattern of the last 3 sessions, so it was left alone; Cracked Basin's dry centre island was confirmed against the map data to be plain floor at every tide, not a flood failure. One real ambiguity chased to ground: Pan Corner's beetle looked a different colour across 3 separately-screenshotted tides — probed the live entity in one continuous browser session across all 3 tides instead and got byte-identical sprite/palette/pixels every time, so the apparent difference was RNG variance between separate new-game seeds (each `shoot-rooms.mjs` call starts a fresh game), not a tide-dependent bug. check-drift's audit count now 88 of 120. Full regression: validate.mjs, check-overworld.mjs 17/17, check-strands.mjs (15 stranded regions/24 cells, baseline unchanged), check-placement.mjs, check-ground.mjs, test.mjs 83/83, check-playthrough.mjs 21/21, check-build.mjs, check-drift self-checks OK, npm run build (dist changed). Off-plan: user asked whether Tidewash Grotto (D1) is beatable, said they were stuck in a switch room. Confirmed via check-playthrough.mjs/check-exits.mjs/walk-dungeons.mjs/solve-switches.mjs that D1 is fully completable and answered in chat (push each crate onto its switch, no code touched) — no detour spent, no files on this rotation's allowlist changed for it.
S82 | objective | Opened the cliffs region, its first row (Kell Head, Wind Shelf, Upper Kell, Kell Corner). No terrain defects found: Wind Shelf's ledge sits between `GGGG` (`rockFloorDk`) and `g` (`rockFloor`), two different tiles by data, the same real-elevation pattern as Drowned Steps/South Pan, not a floating ledge. Upper Kell's `drownWall` pool floods dry->side-only->fully submerged exactly as its own sign describes. One ambiguity chased to ground: Kell Corner's beetle looked like two different creatures across two screenshots (a dark horned upright pose vs. a round curled pose) — traced to `src/data/enemies.js`'s own `beetle` definition (`pal: 'enemyk'` bone tones, `beetle_d0` upright vs `beetle_s0` charge-ball pose), not a bug, just its charge animation caught at different moments across separate runs. check-drift's audit count now 92 of 120. Full regression: check-overworld.mjs 17/17, check-strands.mjs (15 stranded regions/24 cells, baseline unchanged), check-placement.mjs, check-playthrough.mjs 21/21, check-drift self-checks OK, npm run build (dist changed).
