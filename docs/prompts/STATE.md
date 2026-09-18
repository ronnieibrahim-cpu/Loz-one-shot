OBJECTIVE OF RECORD: 9 playthrough-route — drive the run past Dungeon 3

The human retired the exhausted rotation at S112 and chose this in its place.
Objectives 1-7 are met and 8 stays BLOCKED (no emulator capture). The new
objective is the largest open claim in the repo: `check-playthrough.mjs` is
the only tool that proves the game is finishable, and its route ends at
`d3/0,3,1` with three Essences of six taken. Three dungeons, three bosses,
the Coastwise Chain and the later overworld gates have never been played.

DONE-CONDITION: `tools/playthrough-route.mjs` drives a new game to the sixth
Essence and `node tools/check-playthrough.mjs` is green on it. Advance one
dungeon per session; a session is `objective` if GOAL.essences grew.

ROTATION (retired S112, kept for the record):
  1 wide-rooms MET S111 | 2 art-provenance S9/S74 | 3 boss-art S75
  4 enemy-roster S59 | 5 npc-detail S63 | 6 region-art S89
  7 item-reuse MET S110 | 8 feel-measure BLOCKED — needs an emulator capture

ONE STANDING DEFECT, named for several sessions and still true. It is not on
the allowlist and may not be started without the human saying so:
  * `check-hearts` has 2 failures — 23 heart pieces, and D5 holds 1 not 2.

FILE ALLOWLIST for the current objective (9 playthrough-route):
  tools/playthrough-route.mjs — the route data and its GOAL block
  tools/check-playthrough.mjs — only its assertions about how far the run gets
  tools/actor-runtime.mjs — only to add a movement verb the route needs
  tools/measure-boss-combat.mjs — for re-measuring a fight's health budget
  dist/oracle-of-tides.html
  docs/NEXT-SESSION.md
  docs/prompts/LEDGER.md
A game-side fix the route PROVES is broken is in scope only for the one file
holding the fault, and only with the trace written into docs/NEXT-SESSION.md.

DETOUR TOKENS: 1 (unspent)

SESSION LOG: one row per session — `S## | objective|detour | one line`
S110 | objective | Took the Tidewright's Anchor out of doors. Three shore screens now run a bar out to a spit: half of it is only dry when the sea is out, the other half is a row of sinkholes only crossable once the sea is in.
S111 | objective | Gave the Bogwater Sanctum its set piece. The Eel Hall is thirty tiles long now: a drowned colonnade with a current running down the middle the wrong way, so the walk out is made on the seafloor under two cross-walls and the walk back is made by stepping into the water and letting it carry you.
S112 | objective | Walked the Bogwater Sanctum for the first time and found it could not be finished: the Cleats were locked in the room you needed them to enter, the soles would not take you under at the mouth of a current, and the third key was behind a barnacle nothing can kill. All three are fixed. What stops the run now is the boss himself.
S113 | objective | Made the third dungeon's boss easier to fight: it has less health, it no longer outruns you when it drags the sea to the level it likes, and it takes that level back less often. Found while sizing the change that the test robot dies to five careless touches no matter how weak the boss is, so the run still cannot be driven through the fight.
S114 | objective | Made the third boss beatable by the test robot: it now cuts down the slimes he sheds instead of dodging them for ever, which is what was actually killing it — one hit in fourteen came from the boss himself. Seven wins in ten where there were none.
S115 | objective | Played the third dungeon for the first time. A new game now walks from the title screen all the way to the Bogwater Sanctum's boss and comes out with three of the six Essences: it bombs its way into the marsh to reach the door, dives under all three of the Sanctum's currents in the new soles, and beats Gloomtide with hearts to spare.
