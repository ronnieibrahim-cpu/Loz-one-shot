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
S58 | objective | Per NEXT-PROMPT.md's own instruction, audited stalfos's missing attack state — the only one of the 6 non-idle-eligible enemies check-drift showed missing attack that S52/S97's "confirmed structural wall" list (crab/gel/leever/urchin/jellyfish) never actually named. Read stalfos.ai() and both functions it calls (flee/chase, src/game/enemy.js) in full: pure movement, no shoot/charge/hop, no attackTime set anywhere — same shape as the other 5. Found docs/ENEMIES.md's own "Why this ordering" section already stated the reason in plain language before this audit started: "stalfos retreats with no attack at all, purely to deny a swing" — its whole lesson IS having no attack, so an attackFrame would mean inventing an attack for an enemy whose design is not having one. Closed: stalfos joins the structural wall, now 6 enemies (crab/gel/leever/urchin/jellyfish/stalfos). Zero code changes — a documentation gap (unenumerated case), not a missed engine opportunity. docs/ENEMIES.md and docs/prompts/LEDGER.md updated. Full regression unchanged: validate/test(83/83)/check-feel/check-motion(8/8)/check-playthrough(21/21)/replay(51/51)/check-rippers(17/17)/check-build all green
S59 | objective | NEXT-PROMPT.md's whole task was getting the idle-art judgement call answered rather than deciding it alone (docs/ENEMIES.md's "Idle states" section already showed every one of the 8 remaining candidates failing urchin's own design-merit bar, independent of the art question). Put it to the person running these sessions directly: hand-draw one anyway, or close the thread. Answer: leave it alone. Followed up with the natural next question — since hurt/death/attack were already closed roster-wide (S25/S41/S58) and idle is now closed too, objective #4 (enemy-roster) has no further open work under its current allowlist; asked whether to mark it done and advance the rotation. Answer: yes, advance. STATE.md rewritten: OBJECTIVE OF RECORD -> 5 npc-detail, allowlist rewritten for it (docs/NPCS.md is new — no such file existed), enemy-roster's closure reasoning folded into the Note line. Zero code changes (no file outside STATE.md/NEXT-PROMPT.md/LEDGER.md touched); check-drift/check-playthrough/build re-run to confirm nothing regressed while idle
