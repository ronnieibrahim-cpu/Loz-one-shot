OBJECTIVE OF RECORD: 7 item-reuse

S108: Lens DONE (S105). REEFSEED DONE (2 of 5, 3 overworld) — D2's
Whelk Hollow. Anchor PROVED at its ceiling of 1 (the game, not the
tool). ONLY THE BELLOWS IS LEFT, and both it and any further Anchor
work need a human call. Objective 7 cannot advance without one.

ROTATION (fixed, do not reorder):
  1 wide-rooms      — 3 of 6 dungeons have a 2x2 or 3x1
  2 art-provenance  — every sprite in src/data/sprites-*.js tagged
                      `extracted`/`derived`/`drawn` (drawn WITH a reason),
                      plus tools/shoot-sprites.mjs contact sheets
  3 boss-art        — per boss, a rip-bosses.py path or a written reason
                      the source sheets can't supply it
  4 enemy-roster    — every enemy has idle/walk/attack/hurt/death and a
                      one-line docs/ENEMIES.md spec; no two teach the same
  5 npc-detail      — every NPC has a unique sprite and >=2 dialogue
                      states.
  6 region-art      — done when 90 of ~90 overworld rooms are in
                      docs/AUDITED-ROOMS.md with a verdict
  7 item-reuse      — only the Anchor, Lens, Bellows and Reefseed are
                      single-use (Cleats 5/5, Dredge Line 3/5 already
                      pass). Done when those four are each required in
                      >=2 later dungeons and >=3 overworld screens.
                      LENS AMENDMENT (S104, human): its overworld half
                      is void (ITEMS.md forbids it at region scope), so
                      the Lens is done at >=2 dungeons. MET S105.
                      Reefseed MET S108 (D2's Whelk Hollow).
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

Note (keep): #2 done S9/S74. #3 done S75 (ART-BACKLOG.md). #4 done S59
and #5 done S63 (both human decisions: no further hand-drawn idle/NPC
art; wrong on any -> revert). #6 done S89 (120/120 audited).
DETOUR TOKENS: 1 (unspent — S104 was human-directed objective work)

SESSION LOG: one row per session — `S## | objective|detour | one line`
S107 | objective | Found that the Reefseed was never really stuck. The rule that kept it out of the earlier dungeons was guarding against a real danger — handing the player a puzzle before they own the thing that answers it — but it was written so broadly that it also banned the harmless version: an optional side room you come back for later. The game already does that with the last dungeon's item in three earlier dungeons. The rule now draws the line where it meant to. Nothing new is in the game yet; the Reefseed side room itself is the next job.
S108 | objective | Built the Coral Spire a tide pool it cannot answer yet. A stair off the dungeon's dead-end cell drops into a flooded hollow with a bar of the Spire's own wall lying across the water and a snarl of kelp sealing a chest on the far side. A player of the second dungeon can see exactly what it wants and has nothing to do it with; three dungeons later they come back with the Reefseed, throw a stake while the sea has the bar under, drop the water to stand on what they grew, and cut. That is the Reefseed's share of the current objective finished. The bar and the kelp are both made of the Spire's own material rather than borrowed from the Drowned Wood, so nothing in the room looks like it came from another dungeon.
