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
    (the same "no rip script for it" path boss-art (#3) just took — check
    assets/sheets/oracle-seasons-enemies.png's own unused cells first)
  src/game/enemy.js (the `frames`/`hurtFrame` spec contract check-drift's
    enemy-roster metric reads — new fields go here if the engine needs one
    for attack/death, e.g. `attackFrame`/`deathFrame`)
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
S9 | objective | tagged sprites-link.js (103 drawn) and ALL SIX ripper-generated files (135 extracted + 7 derived, via one shared line in ripkit.py's emit_module() plus rip-link.py's own emit(), each ripper re-run and check-rippers.mjs kept green throughout); every real sprite in the game now carries a tag — rotation #2's tagging half MET; advanced OBJECTIVE OF RECORD to #3 boss-art, rewrote allowlist; test.mjs + build green
S10 | objective | boss-art research (docs/ART-BACKLOG.md): confirmed via web search that Oracle boss sheets DO exist (Onox, Gohma, Aquamentus etc.) but none is the right creature TYPE for any of our 8 bosses, and the one type-overlap (Wyverna vs. dragon bosses) still fails CLAUDE.md's "hookshot but wet" test since a named boss's silhouette IS its identity, unlike a generic enemy type; all 8 stay hand-drawn, reasoned per-boss — rotation #3 DONE, no code changed; advanced OBJECTIVE OF RECORD to #4 enemy-roster
S11 | objective | wrote docs/ENEMIES.md: one-line "what the player learns" per enemy for all 22, cross-checked so no two teach the same lesson (3 unkillable turrets form a contact/axis/aim progression; leever/wizzrobe/siren share one engine primitive but differ in payoff); enemy-roster's DOC half done, the ART half (0 of 22 have attack/hurt/death states) is untouched and much larger; no code changed, no build needed
