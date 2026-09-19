OBJECTIVE OF RECORD: 9 playthrough-route — MET AT S121. AWAITING THE HUMAN.

The human retired the exhausted rotation at S112 and chose this in its place.
It is now MET: `tools/playthrough-route.mjs` drives a new game from the title
screen to the sixth Essence and the ending, and `node tools/check-playthrough.mjs`
is green on it — 37 assertions, nothing granted, no warp, no flag set from
outside. The largest open claim in the repo is closed. Objectives 1-7 are met,
8 stays BLOCKED (no emulator capture), and 9 is met, so THERE IS NO NEXT
ROTATION ITEM. A session run before the human names one should do the next
prompt below and nothing else.

DONE-CONDITION (met S121): the run reaches the sixth Essence, green.

ROTATION (retired S112, kept for the record):
  1 wide-rooms MET S111 | 2 art-provenance S9/S74 | 3 boss-art S75
  4 enemy-roster S59 | 5 npc-detail S63 | 6 region-art S89
  7 item-reuse MET S110 | 8 feel-measure BLOCKED — needs an emulator capture

ONE STANDING DEFECT. The other two were closed at S122 and neither was in the
game — both were undercounts in the checker itself.
  * The run's low-water mark is ONE quarter-heart, inside Nereth's fight.
    `docs/prompts/QUEUE.md` item 0 is the cheapest way to widen it.
NOTHING IN CLAUDE.md'S VERIFICATION TABLE IS RED.

FILE ALLOWLIST for the current objective (the Barnacle Skin, and the re-tune):
  tools/playthrough-route.mjs — the Keep leg and its GOAL block
  tools/check-playthrough.mjs — only its assertions about how far the run gets
  tools/actor-runtime.mjs — only to add a movement verb the route needs
  src/data/dungeons-b.js — ONLY if floor 1 proves a fault the route cannot
    route round, and only with the trace written down
  dist/oracle-of-tides.html
  docs/NEXT-SESSION.md
  docs/prompts/LEDGER.md

DETOUR TOKENS: 1 (unspent)

SESSION LOG: one row per session — `S## | objective|detour | one line`
S111 | objective | Gave the Bogwater Sanctum its set piece. The Eel Hall is thirty tiles long now: a drowned colonnade with a current running down the middle the wrong way, so the walk out is made on the seafloor under two cross-walls and the walk back is made by stepping into the water and letting it carry you.
S112 | objective | Walked the Bogwater Sanctum for the first time and found it could not be finished: the Cleats were locked in the room you needed them to enter, the soles would not take you under at the mouth of a current, and the third key was behind a barnacle nothing can kill. All three are fixed. What stops the run now is the boss himself.
S113 | objective | Made the third dungeon's boss easier to fight: it has less health, it no longer outruns you when it drags the sea to the level it likes, and it takes that level back less often. Found while sizing the change that the test robot dies to five careless touches no matter how weak the boss is, so the run still cannot be driven through the fight.
S114 | objective | Made the third boss beatable by the test robot: it now cuts down the slimes he sheds instead of dodging them for ever, which is what was actually killing it — one hit in fourteen came from the boss himself. Seven wins in ten where there were none.
S115 | objective | Played the third dungeon for the first time. A new game now walks from the title screen all the way to the Bogwater Sanctum's boss and comes out with three of the six Essences: it bombs its way into the marsh to reach the door, dives under all three of the Sanctum's currents in the new soles, and beats Gloomtide with hearts to spare.
S116 | objective | Played the fourth dungeon for the first time. A new game now walks out of the Bogwater Sanctum on its own feet, crosses the marsh and the bluffs, bombs the rockfall that holds the Cliffs of Kell shut, and takes the Cliffside Cistern end to end: three keys, the Squall Bellows, all six drowned wheels turned by holding the breath against them, the Ironknight, and Wyverna beaten with the sea drained under her. Four of the six Essences.
S117 | objective | Played the fifth dungeon for the first time. A new game now walks out of the Cliffside Cistern, goes back to the grotto it started in for the second sword — which the stone there only gives up at four Essences — crosses the wood to the Drowned Wood Shrine, and takes it end to end: three keys, the Reefseed, all five groves grown at high water and stood on at low, Thornvine, and Rootmaw. Found on the way that the Shrine's third key never existed: the chest holding it dropped it behind itself in a corridor one tile wide, and nothing in the game could reach it. Ended the session laying the groundwork for the next one: the robot can now hold a conversation with a trader, which is how the Coastwise Chain gets walked, and the first seven links of that chain have been passed in a test harness.
S118 | objective | Played the Coastwise Chain for the first time. A new game now walks out of the Drowned Wood Shrine, passes all twelve of the coast's traders in order across fifty screens, comes out of the far end with the Resonance Rod, takes the third sword off the Maku Tree and the road she opens with it, and walks down the Kell into the Abyssal Keep. It arrives on a heart and a half: the tour costs thirty-six quarter-hearts and there is nothing anywhere on it to heal on, which is now the thing stopping the run.
S119 | objective | Put a fairy on Shell Beach, the one screen the coast trade crosses twice and the road to the fourth dungeon never touches. The long walk round the coast used to end at the last dungeon's door on a heart and a half; it now ends there on seven and a half, and the test run fails outright if it ever arrives on less than half.
S120 | objective | Played the sixth and last dungeon for the first time, as far as the final boss's own door. A new game now walks into the Abyssal Keep, wins all four of its keys and opens all four of its locked doors: it fetches the fire-shell out of a reef cave nothing had ever opened, lights the Kiln's four torches with it, rings a knight's armour with the trading rod so a sword will go through it, takes the Dredge Line out of its vault and throws it across three holes nothing walks. What is left in the whole game is the Boss Key and the King.
S121 | objective | Played the whole game from the title screen to the end. A new game now walks into the Abyssal Keep, crosses the Sunken Bar at flood, takes the Crossed Shafts at both seas, beats the Brinehulk for the Boss Key and kills Nereth in real combat on the health the Keep actually leaves, and the sixth Essence and the ending follow. Found on the way that the Brinehulk was handing out that Essence itself, two rooms short of the throne room, so the last dungeon could be finished without ever meeting the King; and that floor 1 of the Keep was the only dungeon floor in the game with nothing on it to heal on.
S122 | objective | Closed the last two red checks in the project, and neither of them was a fault in the game. The charm that is supposed to let you breathe on the seafloor was reported broken for several sessions; it works, and the test was standing on dry sand while pretending to be underwater. And the world was reported to be one Piece of Heart short of a whole number of hearts; it is not — the counter simply could not see the one the Drowned Wood Shrine pays out of its drowned wheel. Adding the piece the last prompt asked for would have broken a different check.
S123 | objective | Taught the test robot to wear a charm — thirty of them exist, the whole system is proved piece by piece, and no run had ever put one on in a hundred and seventy thousand frames. The run now wears one. Also fixed a real fault found on the way: the robot used to walk up to a trader, and then keep talking to the patch of ground the trader had been standing on, so the coast trade only ever worked because the timing happened to line up. Could not get the charm this run actually wants — one free hit in every room — because picking it up changes every fight that follows and loses the third boss; that is written up with the measurements for whoever takes it next.

