# Cliffside Cistern (d4): two new puzzle rooms, mock-up only

Nothing under `src/` or `tools/` was touched and nothing is on main. These are
proposals, drawn in the real engine and proved by the real checkers' `--mock`
mode, to be built (or thrown away) by a later session.

## What the Cistern has, and what it lacks

Read from the room data (35 rooms on 3 floors):

| Kind the Cistern has | Where |
|---|---|
| Spike pools (`spikeRoom`) | Spike Basin 0,4,6; the Intake 1,6,3 |
| Moving platforms (`floatRoom`) | Weir 0,3,5; Long Race 0,4,3 |
| Mirror statue (`statueRoom`) | Cliffside Cell 0,5,5 |
| Colour cube, with the cracked floor (`cubeRoom`) | Cistern Floor, Gauge, Spill Vault, Siphon Stair, Gull Roost |
| Bellows wheels (`bellowsRoom`) | Squall Loft, Drowned Sill, Ebb Cell, Wind Gallery, the 3F Loft, East Tank |
| Sealed tanks and sluice gates (`tank`) | the five 2F rooms |
| Side-view passage (`sideRoom`) | Float Shaft 1,5,5 |

It has none of: ice blocks, held bridge, eye statues, slates, red/blue
blocks, burning torches, tide floor, tide plates, block-over-stake fords,
key from above, or a real multi-push block room. I used the first two
(ice, bridge): their checkers have a `--mock` mode, they need no item the
player does not yet have by D4, and they work in the Cistern's own tiles
(no new legend letters).

## How the Bellows come in, and how honest the proof is

The Cistern's rule is that the cone lasts only while the button is held and
costs Link his feet, so what it frees has to act while he stands still. Both
rooms therefore end in the Cistern's own answer, a drowned paddle wheel that
only the cone can free, and in both the new puzzle is what you have to do
around it. `check-bellows.mjs` has no `--mock`, so I wrote
`run-bellows-mock.mjs` (a wrapper that registers the proposed room as a
one-room dungeon-4 map and lets `check-bellows` run its own 14 claims on it).
Be aware of what that does and does not prove:

* Proved: the new puzzle (ice or bridge) by its own checker, and the wheel
  (drowned at MID, cone frees it, nobody can free it by hand or at any other
  sea, the stand only reachable at MID, its door separates the room).
* Not proved (no model exists): that the puzzle's reward and the wheel's door
  are wired the way the README says. That wiring is copied from rooms that
  already exist (Cliffside Cell's `puzzle.reward.spawn`, Wind Gallery's
  `valve` script). The ice checker and bridge checker also know nothing about
  the cone; the cone does change the sea under an ice block in the engine
  (the block reads the tide field), which I left out of both designs on
  purpose, because a timing trick would make the puzzle cheesable.
* Wheel rooms are the genre PUZZLE-PASS complained about as copies. Both
  wheels here are a different shape from the existing sills (A: a sump column
  you swim up; B: a nook you reach across a bridge), but if that still reads
  as a copy, either room works without the wheel, as a plain ice or bridge
  room, and the Bellows clause can be dropped.

---

## Option A: The Penstock (0,1,6), ice block

**Where.** The empty cell west of the Overflow Sluice (0,2,6). Needs one new
gap in the Overflow Sluice's west wall at row 5; the new room's only door is
its east doorway at row 5. Not on the robot's route, and nothing the robot
walks changes.

**What the player sees.** A square room with a locked-looking cell in the
south-east (a stone box with a blue door in its west side, and a glassy ice
block inside). A long shallow gutter of wells along the south. A single
plate near the top, and a row of black pits across the north half so you
cannot just walk there. In the north-west corner, a wheel sitting on a
tile of water behind two pits.

**The solution, step by step.**
1. Sea at MID. Swim up the dark column in the north-west to the stand
   (it is only a column at MID or HIGH; at LOW it is a pit). Face the wheel
   and hold the Bellows. The cone takes a level off the wheel's water and it
   turns; the blue door in the south-east cell opens.
2. Sound the conch twice (HIGH, then LOW). Go round into the cell, stand
   east of the ice block, and shove it west. At LOW: it slides out the door and across the dry floor, and the
   wells of the gutter are shallow at LOW, so the first one catches it
   at (8,8).
3. Sound the conch to MID. The wells are deep now and the block floats on
   them. Stand south of it and shove north. It slides up the column,
   floats right over the row of sump pits (deep at MID) and stops against
   the north wall, on the plate. Two rupee drops appear.

**Why it needs the tide.** LOW catches the block in the gutter but its
slide north would drop it down the sump holes. MID floats it over the sump
but carries it straight past the gutter. Only LOW then MID works. (HIGH is
never needed in this one; it is the shorter of my two.)

**Why it needs the Bellows.** The block starts shut in the cell; only the
wheel opens the door, and the wheel is drowned at the sea you can stand
beside it.

**Pay.** The plate spawns two 20-rupee drops. No key, no heart piece.

**Checker output** (`check-output.txt` has all of it):

```
check-iceblocks --mock option-a-ice.json
  ok   solvable walking in at LOW, MID and HIGH
       from LOW (1 presses, 2 pushes): push left@13,8 -> 8,8; conch MID; push up@8,9 -> 8,1
  ok   the fewest-press solution sounds the conch for 0/1
  ok   not with the sea held at LOW / MID / HIGH
  ok   not if the water never caught or took the block
  ok   not if it moved one square a push
  ok   no reachable state shuts Link in (297 states)
check-iceblocks: 10 passed, 0 failed

run-bellows-mock option-a-bellows.json   (the wheel)
  ok   the wheel is drowned at MID
  ok   and the cone takes the water off it
  ok   no sea level frees the wheel where you can stand
  ok   the stand is only reachable while the wheel is drowned
  ok   the door at 10,8 separates the room
       2,1 is dWaterD at MID and dWaterS inside the cone; pumped from 5,1 facing left
=== 14 passed, 0 failed ===
```

Note the ice check is run with the cell door standing open (`o`), since the
model has no wheel; the Bellows check and the pictures use it shut (`D`).

**Pictures** (3x, the real engine, Link left out unless shown):
`a-low.png`, `a-mid.png`, `a-high.png` (the room at each sea);
`a-low-caught.png` (step 2: block caught in the well at LOW);
`a-mid-launch.png` (step 3: MID, block afloat, Link behind it);
`a-mid-cone.png` (step 1: MID, Link on the stand with the cone lowering the
wheel's water; the wheel's tile goes from deep blue to shallow).

---

## Option B: The Weir Walk (0,5,1), held bridge

**Where.** The empty cell east of the East Overlook (0,4,1). Needs a
two-tile gap in the East Overlook's east wall at rows 8 and 9; the new room's
door is the matching two-tile gap in its west wall. Two tiles because one
block pushed into a one-tile door would shut Link in (the checker found
exactly that and failed it until the door was widened). The Overlook is not
in the robot's route list.

**What the player sees.** A tall pit down the middle of the room with a
plank-sized gap in its middle row. On the west side a hall with a plate in
the north, two water bands across it (a band of wells in the north, a drain
in the south) and a push block at the bottom. On the east, a platform with a chest in a shut alcove and, in the
north-east corner, a wheel on a water tile behind two pits.

**The solution, step by step.**
1. Sea at MID. Push the block north: it crosses the drain (wading at MID;
   a hole at LOW, too deep to enter at HIGH) and stops against the water
   band, four pushes in total.
2. Step out of the drain, sound the conch to HIGH, then LOW. The band in
   the north is a shallow ford at LOW only; at MID/HIGH it is too deep for
   a block.
3. Push the block twice more: through the band and onto the plate. The
   three planks of the bridge go down one at a time and stay down as long
   as the block sits on the plate.
4. Walk over the bridge (it is level with the middle row). Sound the conch
   to MID on the east platform. The dark column in its north-west corner is
   a pit at LOW but waist-deep at MID, so you can swim up it to the stand.
5. Face east and hold the Bellows: the wheel (on a tile that is deep at MID,
   shallow at LOW) turns, the alcove door opens, the chest is a chest of
   rupees.

**Why it needs the tide.** The block can cross the drain only at MID and
the band only at LOW: it needs MID, then HIGH to reach LOW, so all three
seas are used. No one sea solves it and the block, never moved, cannot.

**Why it needs the Bellows.** The chest is behind a door only the wheel
opens, the wheel is drowned at the sea you can stand beside, and the stand
is on the far side of the bridge.

**Pay.** One chest, 50 rupees (`pickup: 'rupee50'`). No key, no heart piece.

**Checker output:**

```
check-bridges --mock option-b-bridge.json
  ok   every plank spans a hole while the bridge is up
  ok   walking in at every sea, the bridge's far side can be reached
  ok   not with the blocks never moved (Link and the sea alone)
  ok   not at any one sea held
       from LOW, 3 presses and 6 pushes: MID up up up up HIGH LOW up up
  ok   the fewest-press solution sounds MID, HIGH, LOW
  ok   no reachable state shuts Link in (149 states)
=== 6 passed, 0 failed ===

run-bellows-mock option-b-bellows.json   (the wheel; bridge laid)
  ok   the wheel is drowned at MID / and the cone takes the water off it
  ok   no sea level frees the wheel where you can stand
  ok   the stand is only reachable while the wheel is drowned
  ok   the door at 12,7 separates the room
       13,1 is dWaterD at MID and dWaterS inside the cone; pumped from 10,1 facing right
=== 14 passed, 0 failed ===
```

The Bellows check floods terrain only, so it is shown the room with the
planks laid (a bridge down is floor). The bridge check uses it with them up.

**Pictures:** `b-low.png`, `b-mid.png`, `b-high.png` (room at each sea);
`b-mid-carried.png` (step 1 done: block over the drain);
`b-low-bridged.png` (step 3: LOW, block on the plate, planks laid, Link
crossing); `b-mid-cone.png` (step 5: MID, cone on the wheel).

## Things to know before building either

* The bridge planks in the pictures are the Grotto's own tile
  (`dBridgeGrottoH`). The Cistern has none of its own, so building B means
  ripping a Cistern-coloured plank pair the way the Grotto's was.
* Both rooms add rooms to d4's map: `check-dungeon-strands`,
  `walk-dungeons` and the strands baseline need a re-run and a refresh, and
  each room needs a `readable` sign (kept deliberately out of these mocks).
* The two door gaps in the neighbouring rooms (Overflow Sluice west wall,
  East Overlook east wall rows 8-9) are the only changes outside the new
  rooms; neither room is on the robot's route.
* Files: `gen-a.py` / `gen-b.py` write the JSON specs; `run-all.sh`
  re-proves both options; `run-bellows-mock.mjs` is the wrapper described
  above; `check-output.txt` is the full output of `run-all.sh`.
