OBJECTIVE OF RECORD: 7 item-reuse

S109: BELLOWS DONE (2 dungeons already, 3 overworld screens now). Lens
DONE (S105), Reefseed DONE (S108). ONLY THE ANCHOR IS LEFT, and its
dungeon half is capped at 1 by the game's own rules — D3 onward cannot
hold an anchor gate at all, and D2 is the only dungeon between. Its
OVERWORLD half is open and untouched: check-anchor proves an overworld
screen on foot, which is exactly the window between D1 and D3. Objective
7 closes on a Lens-shaped amendment plus three early screens.

ROTATION (fixed, do not reorder):
  1 wide-rooms      — 3 of 6 dungeons have a 2x2 or 3x1
  2 art-provenance  — every sprite tagged, plus the contact sheets
  3 boss-art        — per boss, a ripper path or a written reason
  4 enemy-roster    — full frame set + a docs/ENEMIES.md spec per enemy
  5 npc-detail      — a unique sprite and >=2 dialogue states per NPC
  6 region-art      — 90 of ~90 overworld rooms audited with a verdict
  7 item-reuse      — only the Anchor, Lens, Bellows and Reefseed are
                      single-use (Cleats 5/5, Dredge Line 3/5 already
                      pass). Done when those four are each required in
                      >=2 later dungeons and >=3 overworld screens.
                      LENS AMENDMENT (S104, human): its overworld half
                      is void (ITEMS.md forbids it at region scope), so
                      the Lens is done at >=2 dungeons. MET S105.
                      Reefseed MET S108. Bellows MET S109 (Cliff Face,
                      Rustfall, Cistern Path).
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
  docs/ITEMS.md — read-only reference for each item's three verbs
  docs/DUNGEON-STATUS.md — read before touching a dungeon marked done;
    tick/update if a change affects its checklist
  dist/oracle-of-tides.html
  docs/NEXT-SESSION.md
  docs/prompts/LEDGER.md
  tools/check-lens.mjs, tools/lib/collision.mjs, tools/lib/dungeon-flood.mjs
    — ADDED S104, for the LENS ONLY; check-anchor/bellows/reefseed are not
    covered and each needs its own human call
  tools/dungeon-strands-baseline.json — ADDED S108: a sealed grove pocket
    is a baseline entry, never a second way in
  tools/strands-baseline.json — ADDED S109, the outdoor twin of the line
    above: a Bellows shelf is sealed and its wheel bar is an islet, so
    both are stranded ON PURPOSE. Record them, never open a way in

Note (keep): #2 done S9/S74. #3 done S75 (ART-BACKLOG.md). #4 done S59
and #5 done S63 (both human decisions). #6 done S89 (120/120 audited).
DETOUR TOKENS: 1 (unspent)

SESSION LOG: one row per session — `S## | objective|detour | one line`
S108 | objective | Built the Coral Spire a tide pool it cannot answer yet. A stair off the dungeon's dead-end cell drops into a flooded hollow with a bar of the Spire's own wall lying across the water and a snarl of kelp sealing a chest on the far side. That is the Reefseed's share of the current objective finished.
S109 | objective | Took the Squall Bellows out of doors. Three coastal screens now hold a wheel you cannot reach and a shelf you can only stand on while the sea is up, so the gust has to take the water off the wheel and hold you in place at the same time. That is the Bellows' share of the objective finished; only the Anchor is left.
