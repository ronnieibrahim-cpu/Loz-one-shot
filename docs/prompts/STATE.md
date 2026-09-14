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
S62 | objective | Per NEXT-PROMPT.md's own task, did the full sheet audit S61 only started informally. Confirmed pip/pillow, re-ran rip-npcs.py and rip-races.py first (byte-identical). Rendered and looked at ALL 71 unclaimed blobs on oracle-seasons-npcs.png (two batches, both actually viewed) rather than trusting a palette score — almost entirely soldiers/Zoras/Subrosians/decorative urns/birds and walk-cycle repeats of already-used archetypes, plus what reads as a reserved third oracle-recolour figure (red-haired, paired portraits, same trick as farore/zelda) never placed anywhere. Two ambiguous candidates (index 9: arm-raised holding-an-item pose; index 16: possible helmeted/armoured face) were LOOKED AT CLOSELY and rejected rather than guessed into service — closer crops read as action poses or armour, not clean standing townsfolk. One clean candidate found and extracted: index 69, a genuinely different silhouette (both arms low holding a basket) from npc_fisher's arms-at-sides stance, not a recolour. Added to rip-npcs.py's FRAMES as npc_fisher2 with a comment, regenerated, assigned to Mirren (whose own line is about carrying catch — fits), verified in-engine (shoot-rooms.mjs overworld,5,7, screenshotted, reads as a distinct person beside fisher1's unchanged sprite). npc_fisher's group trims 3->2. Also checked oracle-seasons-nonhuman-races.png (npc_hood_blue's source) by reading rip-races.py's own header: only 4 canonical silhouettes exist, all already extracted — no fifth silhouette for a Wick/Sennit fix; that group has no extraction path left, same open-question shape as npc_salter_d. check-drift now reads 13 of 22 unique. docs/NPCS.md rewritten (Landed — S62, updated census/groups/what's-left). Full regression: check-drift self-checks OK, test.mjs 83/83 (0 unauthored art names), check-rippers.mjs 17/17, check-playthrough 21/21, npm run build (dist changed)
S63 | objective | Put the remaining npc-detail question to the person running these sessions directly, following the idle-art precedent rather than deciding alone: 9 identities across 3 groups (npc_fisher 2, npc_child 3, npc_hood_blue 2) plus npc_salter_d (2, likely-deliberate clan hood) have no extraction path left after S62 confirmed both source sheets exhausted — hand-draw new portraits for the rest, or call npc-detail done with the gap documented. Answer: call it done, advance. STATE.md rewritten: OBJECTIVE OF RECORD -> 6 region-art, allowlist rewritten (docs/AUDITED-ROOMS.md is empty — 0 of ~120 overworld rooms have a verdict), npc-detail's closure reasoning folded into the Note line. Zero code changes this session (decision + STATE.md/LEDGER.md only)
