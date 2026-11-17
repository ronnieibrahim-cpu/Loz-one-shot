# Coral Spire (d2): two proposed puzzle rooms (S252, mock-up only)

Nothing under `src/` was changed and nothing is on main. These are proposals,
drawn in the real engine and proved with the puzzle checkers' own `--mock` mode.
The pictures are 3x.

## What the Spire has today (11 puzzle rooms)

| Room | Kind |
|---|---|
| Coral Landing 0,3,6 | beat the enemies (fairy) |
| Bone Cell 0,2,6 | Anchor gate (D1's lesson) |
| Torch Cell 0,4,5 | light all torches |
| Cistern Cell 0,3,3 | pick the plate in wading water (tidePlates) |
| Rising Chamber 0,3,4 | red/blue blocks flipped by the tide (toggleRoom) |
| Chartstone Alcove 0,4,4 | block pushed along a channel (blockRoom) |
| Turning Pool 1,2,3 | red/blue blocks again (toggleRoom, with the Anchor) |
| Eye Hall 1,3,4 | eye statues that turn with the tide (eyeRoom) |
| Sounding Fork 1,2,2, First Fork 1,4,3 | Lens forks |
| Glass Cell 1,4,5 | Lens hunt |
| Whelk Hollow 1,5,5 | Reefseed grove |

Not used anywhere in the Spire: mirror statues, the tide floor, the colour cube,
the held bridge, ice blocks, burning torches. Both proposals take one of those.

Rooms the robot's playthrough never enters (from `ROOMS=d2 node tools/route-prefix.mjs 0`):
Map Nook 0,2,5, Bone Cell 0,2,6, Cistern Cell 0,3,3, Chartstone Alcove 0,4,4,
Torch Cell 0,4,5, Whelk Hollow 1,5,5. Every doorway the Spire has today already
leads to a room, so each new room needs ONE one-tile gap cut in its host's wall
(and the matching gap in the new room). Both hosts are off the route.

---

## Option A: The Mirror Cell (mirror statue, Seasons' Unicorn's Cave kind)

**Where.** New room `0,1,5`, west of the Map Nook `0,2,5`. Cut a gap in the Map
Nook's west wall at row 5 (x=0) and one in the new room's east wall (x=14, row 5).
You walk in from the east.

**What you see** (`a1-start-low.png`). A plain room with four urns. Along the
north wall a narrow walled-off strip holds an armos statue, a round plate under
its feet-to-be, and two blue channel tiles either side of the plate. In the
open floor there is one push block and a second plate to its right.

**The idea it teaches.** A statue copies every push you give the block, but the
other way round, and it will not walk into water. The sea decides where it stops.

**Solution.**
1. At the low sea, push the block east three times. The statue goes west three
   steps and stands on its plate (the channel tiles are dry, so it walks over them).
2. Sound the conch to MID. The channel tiles fill (`a2-start-mid.png`), so the
   statue now has water on both sides of its plate.
3. Push the block one more time east, onto its own plate. The statue wants to
   step west but the water holds it, so it stays on its plate. Both plates down
   (`a4-solved-mid.png`). It pays out.

**Why it needs the tide.** At low sea the fourth push drags the statue off its
plate. At mid sea the statue cannot even get past the first channel tile. One
sea alone never works; low, then mid, does. No swimming and no Cleats needed,
Link never goes near water.

**Pays.** Two 20-rupee drops (as the Chartstone Alcove does). No key.

**Checker** (`node tools/check-statues.mjs --mock docs/briefs/s252/d2-mock/option-a-mirror-cell.json`,
full output in `a-check.txt`):

```
  ok   mock_mirror 0,0,0 (mirror): solvable walking in at LOW, MID and HIGH
       from LOW (1 presses, 4 pushes): push right@4,7 ...; push right@5,7 ...; push right@6,7 ...; conch MID; push right@7,7 b=[[9,7]] t=[[6,1]]
  ok   ... the fewest-press solution sounds the conch for 0/1
  ok   ... it takes more pushes than there are blocks
  ok   ... not with the sea held at LOW / MID / HIGH
  ok   ... not if the statues never moved
  ok   ... not if the statues walked into water
  ok   ... no reachable state shuts Link in (8568 states)
check-statues: 10 passed, 0 failed
```

**To build it.** A statue needs a picture in the Spire: the Cistern borrows the
Shrine's armos (`sprite: 'o_statue_wood'`), and the render above does the same.
Add the claim `statueRoom: { from: [13, 5], seas: [0, 1] }`, puzzle `blocks:
[[9,7],[6,1]]`, block `once: false`. The statue strip is a walled-off 13-cell
region, so `tools/dungeon-strands-baseline.json` needs a line for it (as the
Cistern's Cliffside Cell did in S247). The model checker uses a swimming Link
(dungeon index 5) but this layout never needs it.

---

## Option B: The Painted Floor (tide floor, Ages' red/blue floor kind)

**Where.** New room `0,5,5`, east of the Torch Cell `0,4,5`. Cut a gap in the
Torch Cell's east wall at row 5 (x=14) and one in the new room's west wall
(x=0, row 5). You walk in from the west.

**What you see** (`b1-start-low.png`). Four urns, three painted floor tiles in a
row in the middle (red, blue, red), and a push block near the south wall.

**The idea it teaches.** When the sea rises over a painted tile it flips colour
(red to blue, blue to red). The goal is every tile blue. A block standing on a
tile keeps the sea off it.

**Solution.**
1. Push the block north four times, from the south, until it sits on the blue
   middle tile (`b3-block-on-blue-low.png`).
2. Sound the conch to MID. The sea covers the three tiles (`b4-block-on-blue-mid.png`).
   The two red ones flip to blue; the middle one stays blue because the block
   is on it. The floor is all blue (`b5-solved-low.png`, once the sea goes
   back down) and it pays out.

**Why it needs the tide.** Press the conch without the block and the middle
tile turns red as well (`b6-wrong-press-low.png`); the checker proves no single
sea can solve it and that the block matters. A wrong press can always be undone
by going round the tide again, so nobody is stuck.

**Pays.** A fairy. No key.

**Checker** (`node docs/briefs/s252/d2-mock/with-floor-legend.mjs check-tidefloor.mjs --mock docs/briefs/s252/d2-mock/option-b-painted-floor.json`,
full output in `b-check.txt`). The small wrapper adds the six legend letters
below to the Spire's legend for the run, because they are not in `legends.js`
yet:

```
  ok   mock_painted 0,0,0 (painted): solvable walking in at LOW, MID and HIGH
       from LOW (1 presses, 4 pushes): push up@7,9; push up@7,8; push up@7,7; push up@7,6; conch MID
  ok   ... the fewest-press solution sounds the conch for 0/1
  ok   ... not with the sea held at LOW / MID / HIGH
  ok   ... not with the blocks never moved
  ok   ... not if the sea got under a block
  ok   ... no reachable state shuts Link in (2736 states)
check-tidefloor: 8 passed, 0 failed
```

**To build it.** Add six lines to the `dungeonCoral` legend: `e` dTileRed,
`h` dTileBlue, `c` dTileRedLow, `d` dTileBlueLow, `f` dTileRedMid,
`g` dTileBlueMid. These are the same tiles the Shrine's tide floor uses; the
red and blue squares are theme-neutral colours, so no new art and no ripper
change. (`a` and `b` are taken by the Spire's red/blue blocks, hence the other
letters.) Claim `floorRoom: { from: [1, 5], seas: [0, 1] }`, puzzle `floor: true`,
block `once: false`. It is the D5 Bole Walk's idea at its gentlest (one press,
one block); the step up in D5 is the Knot Garden's two heights.

---

## Files

- `option-a-mirror-cell.json`, `option-b-painted-floor.json`: the specs (grids,
  claims, and the shots drawn).
- `a1`..`a5-*.png`, `b1`..`b6-*.png`: renders at 3x. `a` starts at LOW, MID, HIGH
  and shows the three-push and solved states; `b` shows start at LOW and MID,
  block set, solved, and the wrong press.
- `with-floor-legend.mjs`, `shoot-mock-floor.mjs`: stand-ins that add Option B's
  six legend letters in memory (a runner for the checker, and a copy of
  `tools/shoot-mock.mjs` with the same line added). Option A needs neither: use
  `node tools/shoot-mock.mjs <spec> <outDir>` as is.
- `a-check.txt`, `b-check.txt`: the checkers' full output.
