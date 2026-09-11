OBJECTIVE OF RECORD: 4 enemy-roster

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

FILE ALLOWLIST for the current objective (4 enemy-roster):
  docs/ENEMIES.md (new — one-line behavior spec per enemy: what the player
    learns from fighting it; no two enemies teach the same lesson)
  src/data/sprites-enemies.js — GENERATED (rip-enemies.py). Never hand-edit;
    new frames go through the ripper or, where the sheet has nothing, a NEW
    hand-authored file (S12/S76: src/data/sprites-enemy-hurt.js, wired via
    src/data/index.js + sprite-manifest.js + tools/shoot-sprites.mjs — same
    three files for a sibling pack)
  src/game/enemy.js + src/game/entity.js (the `frames`/`hurtFrame` contract
    check-drift's enemy-roster metric reads; `deathFrame` will also touch
    `Entity.die()`'s removal timing)
  dist/oracle-of-tides.html
  docs/NEXT-SESSION.md
  docs/prompts/LEDGER.md

Note (keep): art-provenance (#2) is done per S9/S74 — every real sprite
carries a tag; check-drift's "untagged" (175) is only the shared regex
matching non-sprite palette tables and title-glyph/layout data, documented
S70-S74. If wrong, revert OBJECTIVE OF RECORD to `2 art-provenance`.
boss-art (#3) is done per S75 (docs/ART-BACKLOG.md): all 8 bosses stay
hand-drawn, reasoned per-boss, not just asserted. If wrong, revert
OBJECTIVE OF RECORD to `3 boss-art`.

DETOUR TOKENS: 1

SESSION LOG: one row per session — `S## | objective|detour | one line`
S10 | objective | boss-art research (docs/ART-BACKLOG.md): confirmed via web search that Oracle boss sheets DO exist (Onox, Gohma, Aquamentus etc.) but none is the right creature TYPE for any of our 8 bosses, and the one type-overlap (Wyverna vs. dragon bosses) still fails CLAUDE.md's "hookshot but wet" test since a named boss's silhouette IS its identity, unlike a generic enemy type; all 8 stay hand-drawn, reasoned per-boss — rotation #3 DONE, no code changed; advanced OBJECTIVE OF RECORD to #4 enemy-roster
S11 | objective | wrote docs/ENEMIES.md: one-line "what the player learns" per enemy for all 22, cross-checked so no two teach the same lesson (3 unkillable turrets form a contact/axis/aim progression; leever/wizzrobe/siren share one engine primitive but differ in payoff); enemy-roster's DOC half done, the ART half (0 of 22 have attack/hurt/death states) is untouched and much larger; no code changed, no build needed
S12 | objective | gave `wisp` a real `hurtFrame` (Enemy.spriteName now reads it, same precedent as Boss); picked wisp over the prompt's own gel/keese suggestion because hp:1 enemies die same-frame to any real hit and can never actually show a flinch in play (traced to game.js's remove-before-draw filter) and the hp:999 "unkillable" trio block every hit via shield:'all' before flicker is ever set — wisp (hp3) survives one hit and was proven so in-engine (a real e.hurt() call, screenshotted); no sheet has a flinch pose for any ordinary enemy (344 boxes surveyed) so wisp_hurt is hand-drawn in a NEW file, sprites-enemy-hurt.js, wired through index.js/sprite-manifest.js/shoot-sprites.mjs the same way every other hand-authored pack is; check-drift now reads "wisp walk,hurt"; validate/test/rippers/motion/replay/playthrough all green, build green
