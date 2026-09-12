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
    new attack/hurt/death frames go through the ripper or, where the source
    sheet has nothing to extract, are hand-drawn in a NEW hand-authored file
  src/data/sprites-enemies-hurt.js (new, S12 — hand-drawn hurtFrame art the
    ripper's sheet lacks; one entry, wisp_hurt; wire a new one into
    index.js + sprite-manifest.js + shoot-sprites.mjs, same 3 edits)
  src/data/enemies.js (wire hurtFrame on a defineEnemy call — only for
    hp > swordDamage(), see S12 log row for why)
  src/game/enemy.js (the frames/hurtFrame contract check-drift reads — new fields go here for attack/death)
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
S11 | objective | wrote docs/ENEMIES.md: one-line "what the player learns" per enemy for all 22, cross-checked so no two teach the same lesson (3 unkillable turrets form a contact/axis/aim progression; leever/wizzrobe/siren share one engine primitive but differ in payoff); enemy-roster's DOC half done, the ART half (0 of 22 have attack/hurt/death states) is untouched and much larger; no code changed, no build needed
S12 | objective | gave an ordinary enemy its first real hurtFrame, proving the engine path: added the Boss-precedent flicker check to Enemy.spriteName (src/game/enemy.js), hand-drew wisp_hurt (src/data/sprites-enemies-hurt.js, new file — the sheet has no flinch pose for Spark) and wired it on wisp. Found NEXT-PROMPT's gel/keese suggestion was wrong — both are 1-hp and get removed from game.entities the same frame they die, so a hurtFrame can never draw on them; verified in-engine both that wisp (hp 3) shows hurt for its whole flicker window and that a 1-hp enemy never does. check-drift's enemy-roster table now reads wisp: walk,hurt. validate/check-rippers/test/check-motion/build all green; docs/NEXT-SESSION.md carries the attackFrame/deathFrame design note NEXT-PROMPT asked for
