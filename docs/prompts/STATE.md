OBJECTIVE OF RECORD: 5 npc-detail

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

FILE ALLOWLIST for the current objective (5 npc-detail):
  docs/NPCS.md — NEW: one row per named NPC/trader (key, sprite, dialogue
    states), sprite-reuse table, design notes as art lands
  tools/check-drift.mjs — new npc-detail metric, reading MAPS directly
    (pattern: section 6's enemy census), never re-parsed from text
  src/data/overworld.js — npc/trader placements only (sprite/dialogue/
    after/waiting/deals[].text); never room maps/legends
  src/data/sprites-npcs.js — GENERATED (rip-npcs.py). Never hand-edit
  tools/rip-npcs.py — only for a real spare sheet frame, rip-enemies.py's
    method
  src/data/story.js — DIALOGUE text only, for a genuinely new state
  dist/oracle-of-tides.html
  docs/NEXT-SESSION.md
  docs/prompts/LEDGER.md

Note (keep): #2 done S9/S74 (untagged 175 = non-sprite regex noise,
S70-S74). #3 done S75 (docs/ART-BACKLOG.md, all 8 bosses hand-drawn,
reasoned). #4 done S59 (human decision): hurt/death/attack complete or
structurally-blocked roster-wide (S25/S41/S58); idle deliberately
urchin-only, the other 8 judged against its bar and none clear it
(S55/S57), person running sessions confirmed no further idle art (S59).
Wrong on any of these three -> revert OBJECTIVE OF RECORD.

DETOUR TOKENS: 0

SESSION LOG: one row per session — `S## | objective|detour | one line`
S59 | objective | NEXT-PROMPT.md's whole task was getting the idle-art judgement call answered rather than deciding it alone (docs/ENEMIES.md's "Idle states" section already showed every one of the 8 remaining candidates failing urchin's own design-merit bar, independent of the art question). Put it to the person running these sessions directly: hand-draw one anyway, or close the thread. Answer: leave it alone. Followed up with the natural next question — since hurt/death/attack were already closed roster-wide (S25/S41/S58) and idle is now closed too, objective #4 (enemy-roster) has no further open work under its current allowlist; asked whether to mark it done and advance the rotation. Answer: yes, advance. STATE.md rewritten: OBJECTIVE OF RECORD -> 5 npc-detail, allowlist rewritten for it (docs/NPCS.md is new — no such file existed), enemy-roster's closure reasoning folded into the Note line. Zero code changes (no file outside STATE.md/NEXT-PROMPT.md/LEDGER.md touched); check-drift/check-playthrough/build re-run to confirm nothing regressed while idle
S60 | objective | Per NEXT-PROMPT.md's own task, built objective #5's first real measurement rather than guessing at scope. Added an npc-detail section to tools/check-drift.mjs reading MAPS directly (every 'npc'/'trader' entity literal, overworld AND interiors, identity = dialogue field for an npc / first deals[].text for a trader — both already-unique ids) and wrote docs/NPCS.md from the same data. Finding: dialogue states are ALREADY done roster-wide (22 of 22 have >=2 — every ordinary villager already carries an Essence-gated second line per story.js's own "second states" block, every trader already has waiting+trade+after). The real gap is sprite uniqueness only: 7 of 22 identities have a sprite nobody else uses; 6 sprites are shared across 15 identities, worst case npc_fisher covering 4 separate named characters (Mirren/fisher1/Teel/Ossa) who read as the same person on sight. No sprite touched, extracted, or reassigned this session — docs/NPCS.md says explicitly this was the count, not the fix. Zero src/ changes outside the one metric addition; full regression: check-drift self-checks OK, test.mjs 83/83, check-playthrough 21/21, npm run build (dist unchanged, tools/ isn't bundled)
S61 | objective | Per NEXT-PROMPT.md's own task, spent the 3 already-extracted-but-unused NPC sprites S60 found (npc_elder, npc_zelda, npc_brinewife) to break 3 of the 5 generic-reuse sprite collisions, zero new art: hearthWife npc_villager2->npc_brinewife (also fully clears villager2's old collision), Ossa npc_fisher->npc_zelda (also fixes Ossa reading as a man despite her own lines; trims npc_fisher's group 4->3), sandpiper npc_villager->npc_elder (also fully clears Dov's old collision, fits her netMender line addressing the player as "boy"). Each checked in-engine with tools/shoot-rooms.mjs, screenshotted, confirmed rendering correctly and distinctly from the old sprite. Left npc_salter_d (shoreSalter/Hulla) alone on purpose, per docs/NPCS.md's own finding that both spread the same FOLK.salter preset and both characters' own dialogue lines identify them as Salters — a likely-deliberate clan uniform, still pending a call from the person running these sessions rather than defaulted into a fix (same posture as the idle-art question, not re-asked this session since the reasoning was already written down and low-stakes/reversible). Ran python3 tools/rip-npcs.py and rip-races.py first to confirm byte-identical reproduction before touching anything, per CLAUDE.md's extraction rule. Did an informal sheet scan (pip install pillow, tools/ripkit.py's own find_sprites) for further spare frames to close npc_fisher's remaining 3-way and npc_child's 3-way collisions; found mostly walk-cycle repeats and unrelated soldier/Zora art, one unconfirmed recolour-shaped candidate flagged in docs/NPCS.md rather than rushed into an extraction. check-drift now reads 12 of 22 unique, up from 7. Full regression: check-drift self-checks OK, test.mjs 83/83 (0 unauthored art names), validate.mjs OK, check-playthrough 21/21, check-rippers.mjs 17/17 (no generated file hand-edited), npm run build (dist changed, src/data/overworld.js did)
