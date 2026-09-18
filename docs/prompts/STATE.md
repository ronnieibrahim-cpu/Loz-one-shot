OBJECTIVE OF RECORD: 8 feel-measure — AND IT CANNOT BE STARTED

S111: objective 1 is MET (D3's Eel Hall widened to 3x1, so 4 of 6 dungeons
hold a room bigger than a screen). That was the last item the rotation could
reach. THE ROTATION IS EXHAUSTED: 1 met S111, 2 S9/S74, 3 S75, 4 S59, 5 S63,
6 S89, 7 S110, and 8 needs an emulator capture the human said at S111 is not
available. The next session's first move is to put that to the human and let
them choose what replaces the rotation. Do not re-open 8 without a capture.

ROTATION (fixed, do not reorder):
  1 wide-rooms      — MET S111. 4 of 6 dungeons hold a 2x2 or 3x1
  2 art-provenance  — every sprite tagged, plus the contact sheets
  3 boss-art        — per boss, a ripper path or a written reason
  4 enemy-roster    — full frame set + a docs/ENEMIES.md spec per enemy
  5 npc-detail      — a unique sprite and >=2 dialogue states per NPC
  6 region-art      — 90 of ~90 overworld rooms audited with a verdict
  7 item-reuse      — MET S110. See docs/prompts/LEDGER.md, "Measured and
                      rejected", for the four amendments
  8 feel-measure    — done when >=40 feel.js constants are tagged
                      `measured` against the emulator. BLOCKED, see above

TWO STANDING DEFECTS, named for several sessions and still true. Neither is
on any allowlist and neither may be started without the human saying so:
  * `check-hearts` has 2 failures — 23 heart pieces, and D5 holds 1 not 2.
  * `tools/playthrough-route.mjs` stops at `d2/1,3,1`. NOTHING HAS PLAYED
    THIS GAME PAST DUNGEON 2, which is the largest open claim in the repo.

FILE ALLOWLIST for the current objective (8 feel-measure):
  src/data/feel.js — the constants and their provenance comments. A
    `measured` tag MUST name the reference it was frame-stepped from
  docs/FEEL-SPEC.md — the written account of what each number means
  dist/oracle-of-tides.html
  docs/NEXT-SESSION.md
  docs/prompts/LEDGER.md

Note (keep): #2 done S9/S74. #3 done S75 (ART-BACKLOG.md). #4 done S59
and #5 done S63 (both human decisions). #6 done S89 (120/120 audited).
#7 done S110. #1 done S111.
DETOUR TOKENS: 1 (unspent)

SESSION LOG: one row per session — `S## | objective|detour | one line`
S110 | objective | Took the Tidewright's Anchor out of doors. Three shore screens now run a bar out to a spit: half of it is only dry when the sea is out, the other half is a row of sinkholes only crossable once the sea is in.
S111 | objective | Gave the Bogwater Sanctum its set piece. The Eel Hall is thirty tiles long now: a drowned colonnade with a current running down the middle the wrong way, so the walk out is made on the seafloor under two cross-walls and the walk back is made by stepping into the water and letting it carry you.
