# The whole game, looked at from above (S247)

The human asked for one audit of the whole project against "a third Oracle
game by Capcom", with four things in front: puzzle complexity, mini-games,
dialogue, and difficulty that climbs. This is what was measured, what was
changed, and what is left. Every number is read from the data or from the
real run (`check-playthrough`, seed 20260806), not remembered.

Baseline before anything was touched: all 66 checkers and the playthrough
green (49/49, THE END, never died, low-water 5).

## 1. Enemies and difficulty — the one real gap

**Found.** The overworld was graded (each region has its own cast). The
dungeons were not. Counted from the room data:

| | before | after |
|---|---|---|
| D1 Grotto | crab 10, keese 9, zol 5, anglerfry 2, tektite 1 | unchanged |
| D2 Spire | keese 11, urchin 6, crab 4, jellyfish 4 | keese 8, octorok 3 (new) |
| D3 Sanctum | keese 14, crab 11, urchin 8, jellyfish 5 ... | + beetle 3, zol 4 (new to D3) |
| D4 Cistern | keese 27, stalfos 10, tektite 9 ... | + wizzrobe 5, bubble 3; keese 21 |
| D5 Shrine | keese 26, tektite 20, stalfos 4 ... | + moblin 6, wisp 4, darknut 3; tektite 12 |
| D6 Keep | stalfos 17, darknut 11, keese 11, wizzrobe 4 ... | unchanged |

D4 and D5 were D1's keese and tektites, room after room (one of each), and
every darknut and wizzrobe in the game arrived together in D6. Seasons and
Ages bring one or two new kinds into each dungeon. Ten of the 22 enemies were
in no dungeon before the last.

**Changed** (the human: "grade them"). Same squares, different enemy, no
damage or health number touched (S150 stands). `tools/test.mjs` now asserts
the ladder: every dungeon after the first places a kind no earlier one does,
and none is more than two-fifths one kind.

The robot's damage per dungeon, in quarter-hearts: 12, 17, 30, 29, 29, 109
before; **12, 17, 26, 35, 32, 112** now.

**What limited it.** The robot fights whatever is in a room its route says
`fight` in, and it cannot beat a beetle (it has no shield and does not know
the flip), a bubble (nothing can) or a darknut outside D6. So those three
kinds stand only in rooms the route walks through or never enters:
beetles D3 1,3,4 / 1,4,6 / 1,5,6; bubbles D4 0,2,6 / 0,3,4 / 0,6,5;
darknuts D5 0,3,4 / 0,5,4 / 0,6,3. A darknut in the High Bough (D5 1,4,2,
a seed-throwing room) cost twelve quarter-hearts during the throws and was
taken out again: a guard on a precision room is a nuisance, not a fight.

**Still open.**
- D4 and D5 are still a third keese. More swaps are free in rooms the route
  never enters (D4 0,4,5 / 0,0,1 / 0,6,5 / 0,6,2; D5 0,0,4-6 / 0,7,4 / 0,7,6
  / 0,5,6 / 0,6,3).
- D5 -> D6 is still a cliff (32 -> 112 for the robot). Two rooms are 40 of
  it (the board, S203). A person should say whether it feels like a finale
  or a wall.
- The three boss fights the robot wins narrowly are narrow by luck of the
  clock, as before: Gloomtide ends on 6/28 (wins at 5 of 22 entry waits),
  Wyverna on 5/32, Rootmaw on 16/40 (10 of 16 waits near the one used).
- D1 has no octorok. It is the first enemy of both cartridges.

## 2. Puzzles

**Found.** The puzzle pass (S204-S212, docs/briefs/PUZZLE-PASS.md) is
complete and every kind has its own checker. Puzzle rooms per dungeon:
12, 9, 19, 15, 20, 28 of 24, 25, 37, 37, 40, 44 rooms; kinds of puzzle 7,
10, 10, 7, 12, 12. That climbs, with D2 the thin one (as S204 said) and D4
narrower in kinds than D3.

One thing no cartridge does: **every solved room opened a text box** to say
what had just happened on screen ("A chest rises in the corner.").

**Changed** (the human: "keep only far-away ones"). 71 of the 72 lines are
gone; the room plays the chime and shows the chest, key or door. The Sump
(D3 0,3,3) keeps "Far above, a gate grinds open.", because that gate is on
another floor; the Wind Loft's three wheels keep theirs for the same reason.

**Still open.** D2 has the fewest puzzle rooms and D4 the fewest kinds. The
two reworded signs (the Two Weights, the Ebb Cell) still want a person to
read them cold.

## 3. Mini-games

**Found.** Three games (the shore race, Dov's cargo dive, the bell-buoy
echo), one long errand (the dark lighthouse) and the scrimshander. The race
and the buoy game started the instant their person was spoken to: no choice,
no music of their own.

**Changed** (the human: "ask first + Oracle tune", no fee). Both ask Yes/No.
The race starts when "Ready... GO!" is put away. The cartridges' own
mini-game theme (mus/minigame.s, through rip-music.py) plays while a race's
clock runs or the sailor's tune is being played or rung back, and the place's
own track returns after. `test.mjs` drives both (6 assertions).

**Still open.** Nothing records a best time. The dive is an errand and was
left one. A fee on replays was offered and declined.

## 4. Dialogue

**Found.** `src/data/story.js` had its pass at S202 and reads like the
cartridges. The lines written straight into the code never had one: the
shop, locked doors, the scrimshander, charm cases, the trade chain's and the
errands' pickup lines. They were stiff and uncontracted ("It is locked.",
"You cannot afford it.", "It measures water. That is all it does.") and
several carried hand-placed line breaks that the box re-wraps anyway.

**Changed.** About sixty lines reworded in the S202 voice. `check-text` now
also reads pickup lines, a chest's "won't open yet" line, and what a bell,
wheel or solved puzzle says.

## 5. Bugs

None found in the baseline. One was made and caught here: an aiming octorok
was placed on dry floor in D2 (it lives in water); `check-placement` refused
it.

## Afterwards, the same session ("act on all")

Done: octoroks in D1's side rooms; more of the ladder in D4's and D5's side
rooms (keese 17 and 18, about 30% each); two new puzzle rooms in D2 (now 11)
and D4's first mirror statue; the race keeps a best time; the dive asks;
bosses checked for cut-off art (none). Looked at and left, with reasons, in
docs/NEXT-SESSION.md S247: the D5 -> D6 jump, the robot's narrow boss wins,
Wyverna leaving the top of the screen. Still wants a person: the two
reworded signs, and whether D6 reads as a finale.

# Part two (S248)

No iPad play notes yet, so the list in docs/prompts/NEXT-PROMPT.md was
worked in order. Pictures and sounds are in docs/briefs/s248/.

## 1. Signs and plaques

**Found.** 34 roadside signs and 88 carvings (`readable`) in dungeons, caves
and the optional dungeons; most already had the S202 voice. 25 were stiff,
long or carried hand-placed line breaks the box re-wraps anyway; the
Cliffs-of-Kell post said Up/Down where every other says North/South.

**Changed.** All 25 reworded, every hint kept (tools/oneshot/shoot-signs.mjs
photographs a sign read for real, every page). The two puzzle signs (the
Two Weights, the Ebb Cell) were read cold by the human: "both are fine".

## 2. A sound under the opening

**Offered** three mock-ups (silence; MUS_INTRO_1, which Seasons and Ages
share — there is no separate Ages intro; Seasons' storm theme under the
storm). **The human chose the opening theme.** It plays from the calm sea,
fades fast as the beach comes in, and the overworld's track starts when the
fade runs out (`Audio.fadeOut(mask, then)`). check-music lets this one
track's noise channel end while the others loop, as the cartridge wrote it.

## 3. The overworld as a player walks it

Regions are the screens' `music` key. Counted per region (pieces, charms,
caves, errands, games; enemies by health x damage):

| region (dungeon) | screens | to find | enemies |
|---|---|---|---|
| dunes (D1) | 18 | 1 piece, 1 charm cave | crab, leever, octorok, urchin |
| reef (D2) | 36 | 1 piece, 4 charm caves, Palace | siren, octorokSea, jellyfish ... |
| marsh (D3) | 12 | 1 piece, a trade | zol, keese, leever (weaker than the reef) |
| Kell (D4) | 16 | 1 piece, 2 wheels, Eyrie, quarryman | tektite, beetle, moblin |
| wood (D5) | 27 | 1 charm cave, 1 trade, nothing else | wisp, anglerfry, moblin |
| abyss (D6) | 8 | 1 piece, lighthouse, charm | darknut, wizzrobe |
| salt (Rod) | 21 | bottle, charm, the Vault | beetle, moblin, wisp |
| south coast | 19 | 6 pieces, race, dive, buoys, blades | octorok, crab |

**Changed.**
- The marsh's enemies now climb past the reef's: five leevers (sand
  creatures, in a bog) on screens the robot never walks became moblins and
  spiked beetles. The pincer (built, never placed) was tried and left out:
  Seasons gives it a hole to hide in, and on open mud it is invisible.
- The Wood (the human: "both"): a Kelper's stake game at the Drowned Ring
  (grow a stake on three floats in 20 s; blank charm, then rupees) and a
  puzzle cave holding a Piece of Heart moved from the Hollow Den — see
  NEXT-SESSION S248 for the cave.
- Every screen stitched at LOW, MID and HIGH and looked at (a helper, then
  here): nothing wrong on screen. shoot-region.mjs drowned its parked
  player half way through a big HIGH stitch and drew GAME OVER into every
  screen after; fixed.

**Still open.** The dunes and the marsh are still thin (one piece each).

## 4. The economy

Read off the real run (`ROOMS=... route-prefix.mjs`, new): the robot
arrives at D1-D6 with 21, 39, 95, 125, 182, 239 Rupees and spends none.
The one-off buys (shield 30, Bottled Tide 40, a charm 80) are affordable by
D4; after that nothing new was for sale. **Changed** (the human: "late
stock after 3 Essences"): bombs ten at a time (40) and a Hagstone (150).

## 5. Menus and HUD

The item, treasure and quest pages, the save screen and both map screens
set beside Seasons' own (assets/footage/frames): every one was cut from the
cartridge's graphics (S167-S177) and still matches. Nothing changed.

## 6. D5 -> D6

Not changed, as the brief says: it waits for the human to play it.
