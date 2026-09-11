OBJECTIVE OF RECORD: 3 boss-art

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

FILE ALLOWLIST for the current objective (3 boss-art):
  assets/sheets/ (new boss sheet, if one is found — check spriters-resource.com
    style sources per CLAUDE.md's ripper credit convention) and its README.md
  tools/rip-bosses.py (new, only if a real source sheet is found)
  src/data/sprites-bosses.js (currently hand-authored; becomes GENERATED,
    ripper-only, the moment rip-bosses.py exists — never hand-edit after that)
  docs/ART-BACKLOG.md or a new per-boss writeup doc (for bosses staying
    hand-drawn: state per boss why the source sheets can't supply it, per
    the objective's own done-condition)
  dist/oracle-of-tides.html
  docs/NEXT-SESSION.md
  docs/prompts/LEDGER.md

Note (keep): art-provenance (#2) is done per S9/S74 — every real sprite
carries a tag; check-drift's "untagged" (175) is only the shared regex
matching non-sprite palette tables and title-glyph/layout data, documented
S70-S74. If wrong, revert OBJECTIVE OF RECORD to `2 art-provenance`.

DETOUR TOKENS: 1

SESSION LOG: one row per session — `S## | objective|detour | one line`
S7 | objective | tagged sprites-gear.js (24 drawn + 1 derived — i_bomb_lit is extracted-hud.js's i_bomb pixels with a lit fuse added) and sprites-title.js (7 drawn, one shared comment); found and fixed 2 pre-existing false-positive `extracted` reads (i_map, i_anchor — their own prose said "extracted icons" meaning a DIFFERENT sprite's register); extracted 3->1, derived 0->1, drawn 69->96; test.mjs + build green
S8 | objective | tagged sprites-world.js (50 drawn + 3 derived — p_rupee/p_heart/p_heartpiece are geometric derivations of sprites-hud.js's real icons, confirmed via assets/sheets/README.md that no sheet covers world objects); found p_heart was ALREADY a false-positive `extracted` read before this session touched it; extracted 1->0, derived 1->4, drawn 96->146; test.mjs + build green
S9 | objective | tagged sprites-link.js (103 drawn) and ALL SIX ripper-generated files (135 extracted + 7 derived, via one shared line in ripkit.py's emit_module() plus rip-link.py's own emit(), each ripper re-run and check-rippers.mjs kept green throughout); every real sprite in the game now carries a tag — rotation #2's tagging half MET; advanced OBJECTIVE OF RECORD to #3 boss-art, rewrote allowlist; test.mjs + build green
