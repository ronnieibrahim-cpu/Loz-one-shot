OBJECTIVE OF RECORD: 9 playthrough-route — drive the run past Dungeon 3

The human retired the exhausted rotation at S112 and chose this in its place.
Objectives 1-7 are met and 8 stays BLOCKED (no emulator capture). The new
objective is the largest open claim in the repo: `check-playthrough.mjs` is
the only tool that proves the game is finishable, and its route now ends at
`d6/0,3,7` — the Abyssal Keep's mouth — with five Essences of six taken, the
Resonance Rod in hand and the Keep's own gate open. One dungeon and one boss
have never been played.

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
  src/data/overworld.js — SPENT at S119 (Shell Beach's fairy). Off the
    allowlist again unless the Keep's leg proves a world gap of its own.
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
S116 | objective | Played the fourth dungeon for the first time. A new game now walks out of the Bogwater Sanctum on its own feet, crosses the marsh and the bluffs, bombs the rockfall that holds the Cliffs of Kell shut, and takes the Cliffside Cistern end to end: three keys, the Squall Bellows, all six drowned wheels turned by holding the breath against them, the Ironknight, and Wyverna beaten with the sea drained under her. Four of the six Essences.
S117 | objective | Played the fifth dungeon for the first time. A new game now walks out of the Cliffside Cistern, goes back to the grotto it started in for the second sword — which the stone there only gives up at four Essences — crosses the wood to the Drowned Wood Shrine, and takes it end to end: three keys, the Reefseed, all five groves grown at high water and stood on at low, Thornvine, and Rootmaw. Found on the way that the Shrine's third key never existed: the chest holding it dropped it behind itself in a corridor one tile wide, and nothing in the game could reach it. Ended the session laying the groundwork for the next one: the robot can now hold a conversation with a trader, which is how the Coastwise Chain gets walked, and the first seven links of that chain have been passed in a test harness.
S118 | objective | Played the Coastwise Chain for the first time. A new game now walks out of the Drowned Wood Shrine, passes all twelve of the coast's traders in order across fifty screens, comes out of the far end with the Resonance Rod, takes the third sword off the Maku Tree and the road she opens with it, and walks down the Kell into the Abyssal Keep. It arrives on a heart and a half: the tour costs thirty-six quarter-hearts and there is nothing anywhere on it to heal on, which is now the thing stopping the run.
S119 | objective | Put a fairy on Shell Beach, the one screen the coast trade crosses twice and the road to the fourth dungeon never touches. The long walk round the coast used to end at the last dungeon's door on a heart and a half; it now ends there on seven and a half, and the test run fails outright if it ever arrives on less than half.
