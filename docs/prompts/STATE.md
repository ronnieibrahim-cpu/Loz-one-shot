OBJECTIVE OF RECORD: 7 item-reuse

S101 built a second outdoor Reefseed grove (Worlds Edge, 0,11,9) in the same
dunes region, reefseed overworld screens now 2/3. Anchor, Lens, Bellows: 0.

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

FILE ALLOWLIST for the current objective (7 item-reuse):
  src/data/dungeons-a.js, src/data/dungeons-b.js — dungeon room data;
    where a new Anchor/Lens/Bellows/Reefseed-gated obstacle gets added
  src/data/overworld.js — where a new overworld screen gets an
    Anchor/Lens/Bellows/Reefseed requirement
  src/data/legends.js, src/data/tiles-core.js — ADDED S100: an outdoor
    gated fixture needs outdoor tiles, and none existed. Region-palette
    variants only (`seaSnarl`, `drownWallSand`, `cliffSandTop`) — never
    an existing tile's own shape, flags or mechanics
  docs/ITEMS.md — read-only reference for each item's three verbs; only
    edit if a session finds the doc itself wrong
  docs/DUNGEON-STATUS.md — read before touching a dungeon marked done;
    tick/update if a change affects its checklist
  dist/oracle-of-tides.html
  docs/NEXT-SESSION.md
  docs/prompts/LEDGER.md

Note (keep): #2 done S9/S74. #3 done S75 (ART-BACKLOG.md, 8 bosses
hand-drawn, reasoned). #4 done S59 (human decision, no further idle art).
#5 done S63 (human decision, no further hand-drawn NPC art; wrong on any
-> revert). #6 done S89 (120/120 audited, fixes landed S76-S81 ledges).

DETOUR TOKENS: 1 (regenerated: S99 and S100 both `objective`)

SESSION LOG: one row per session — `S## | objective|detour | one line`
S101 | objective | Built a SECOND outdoor Reefseed grove at Worlds Edge (0,11,9), same dunes region and same bank/bar/stake/snarl fixture as South Shallows, carved into what was open sea below the room's own dry sandbar band, without moving its one existing sign. No new palette bug: `drownWallSand`/`cliffSandTop` already fix the bar's top edge for any `dunes` room, so this shipped on the first run — check-reefseed went straight to 132/132 (117+15 new). check-drift reads `reefseed overworld screens: 2`. Screenshotted at LOW and HIGH, looked at: bar reads sand-toned, opens to water at HIGH, matches South Shallows. Full suite green: check-overworld, check-strands (still 15 regions/24 cells, unchanged baseline), check-placement, check-ground, check-progression, check-playthrough, test.mjs, build + check-build.
