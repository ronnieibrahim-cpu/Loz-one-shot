OBJECTIVE OF RECORD: 7 item-reuse

S107: Lens DONE (2 of 5). Anchor PROVED at its ceiling of 1 (the game,
not the tool). REEFSEED UNBLOCKED — its ceiling was an artefact; the
filter now allows an optional early room and no room exists yet. Only
the Bellows still needs a human call.

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

Note (keep): #2 done S9/S74. #3 done S75 (ART-BACKLOG.md). #4 done S59
and #5 done S63 (both human decisions: no further hand-drawn idle/NPC
art; wrong on any -> revert). #6 done S89 (120/120 audited).

DETOUR TOKENS: 1 (unspent — S104 was human-directed objective work)

SESSION LOG: one row per session — `S## | objective|detour | one line`
S104 | objective | Opened the Brineglass Lens up to the rest of the game. The prover had been refusing, on sight, to look at any Lens fork outside the Coral Spire — not because the game could not hold one, but because its model was a walker and by the third dungeon the player can swim. It now asks what the player actually holds in each dungeon, so every claim it makes about a later fork is stricter than the old ones, and the rule about when swimming starts lives in one place instead of two. The first fork outside the Spire is the Abyssal Keep's Two Arches: two blank stretches of the Keep's own wall, and one of them is water one tide up.
S105 | objective | Gave the Brineglass Lens a second puzzle outside the dungeon that hands it over, in the Drowned Wood Shrine. Three drowned oaks in a row, the same trunk to look at while the water is held where it is, and one sea up one of them has washed hollow. That finishes the Lens's share of the current objective; the other three special items are still stuck behind decisions only a person can make.
S106 | objective | Took the Tidewright's Anchor next and found its wall is the game rather than the checker. Taught the prover to account for a player who can swim, which is what its own notes had been asking for, and the later dungeons still would not open: once you can swim, the highest tide is always the best one to be at, so holding one patch of the room at a different level can never open a way that sounding the conch could not. That is now something the tool proves every run instead of something we believed, and it goes red the day anyone adds a tile that breaks it.
S107 | objective | Found that the Reefseed was never really stuck. The rule that kept it out of the earlier dungeons was guarding against a real danger — handing the player a puzzle before they own the thing that answers it — but it was written so broadly that it also banned the harmless version: an optional side room you come back for later. The game already does that with the last dungeon's item in three earlier dungeons. The rule now draws the line where it meant to. Nothing new is in the game yet; the Reefseed side room itself is the next job.
