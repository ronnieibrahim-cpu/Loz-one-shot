OBJECTIVE OF RECORD: 1 wide-rooms

ROTATION (fixed, do not reorder):
  1 wide-rooms      — done when 4 of 6 dungeons have a 2x2 or 3x1
  2 region-art      — done when 90 of ~90 overworld rooms are in
                      docs/AUDITED-ROOMS.md with a verdict
  3 item-reuse      — done when every dungeon item is required in >=2
                      later dungeons and >=3 overworld screens
  4 feel-measure    — done when >=40 feel.js constants are tagged
                      `measured` against the emulator
  9 hundred-percent — done when check-playthrough.mjs plays ONE continuous
                      run, no grants, no god mode: clears all 6 dungeons +
                      bosses in real combat, all 24 Heart Pieces, the whole
                      Coastwise Chain, every item/charm, every cave/shop the
                      guide names, and reaches `ending`. Sub-steps, one
                      session each: 9a D3, 9b D4, 9c D5, 9d D6+Nereth+
                      ending, 9e completionist sweep (hearts/Chain/charms/
                      caves/secrets). A boss blocking its own sub-step is in
                      scope, no detour token — fix the HARNESS before the
                      BOSS, and say which one every time. Emits ordered
                      steps (room key, item acquired, verb used) to
                      docs/ROUTE.json
 10 guide-perfect    — done when docs/GUIDE.md is regenerated FROM
                      docs/ROUTE.json (skeleton + facts; prose stays
                      hand-written) and check-guide.mjs asserts both ways:
                      every ROUTE.json step is in the guide in route order,
                      and every room/item/charm/Heart Piece/Chain step/
                      cave/secret the guide names is in ROUTE.json. Replace
                      the two stale caveats in "How this guide was
                      verified"; regenerate GUIDE.html in the same commit

FILE ALLOWLIST for the current objective (1 wide-rooms):
  src/data/dungeons-a.js
  src/data/dungeons-b.js
  dist/oracle-of-tides.html
  docs/DUNGEON-STATUS.md
  docs/NEXT-SESSION.md
  docs/prompts/LEDGER.md

DETOUR TOKENS: 1

SESSION LOG: one row per session — `S## | objective|detour | one line`
S1 | objective | ran SETUP: created check-drift.mjs, STATE.md, AUDITED-ROOMS.md; measured baseline (1 of 6 dungeons wide, 0/0 reuse on 4 of 6 items, 0 feel.js constants measured, 0 rooms audited)
S2 | objective | charter amendment, no wide-rooms work: corrected LEDGER.md's guide-location note (GUIDE.md/GUIDE.html/check-guide.mjs are on main, not the 3 stale branches), added rotation #9 hundred-percent and #10 guide-perfect, added playthrough/guide coverage metrics to check-drift.mjs (40/144 rooms, 2/6 bosses, 0/24 Heart Pieces, 0/0 guide steps)
