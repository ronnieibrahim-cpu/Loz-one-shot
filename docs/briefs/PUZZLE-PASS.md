# The puzzle pass (S204 onward)

The human (S204): "Make sure the puzzles in the dungeons are top notch
quality." Shown the audit below, then the puzzle kinds Ages and Seasons have
that we do not, then chose ALL of them, "plus more", and all four fixes.
Each room is mocked beside the cartridge room it borrows from and shown
before it is built (CLAUDE.md: ask before bigger design changes).

## The audit (S204, every room of D1-D6 and the three optional dungeons)

Good: every dungeon's own item has a run of rooms that escalates (Anchor 1 ->
2 placements, Lens 2 -> 3 branches, shafts, floats and tanks, canopy drops,
the Hold). Nothing found unsolvable; the checker table proves that part.

Not top notch:

1. **Eight one-push rooms.** A block seated next to its switch (the S30s rule
   "a push block moves exactly one tile, ever"): D1 Sunken Hall 0,3,5, Switch
   Room 0,4,4, Weeping Cistern 0,1,3; D2 Rising Chamber 0,3,4; D3 Sunken
   Vestry 1,1,3; D4 Cistern Floor 0,4,4; D5 Sunken Bracken 0,4,4; D6 Drain
   Court 1,4,5. Seasons' dungeon blocks $18-$1c do turn to $1d after one push
   (data/seasons/tile_properties/pushableTiles.s) — but $10-$12, $2a, $2c, $2d
   stay pushable, and Ages builds whole rooms on blocks pushed many times
   (Crown Dungeon 9b, 9e; Hero's Cave). Ours are all the once kind.
2. **Copies, not steps.** D5: six rooms are one stake at HIGH, stand at LOW,
   cut (First Stake, Bole Walk, Sunken Nave, Knot Garden, Long Ford's floor,
   D6's Drowned Garden) and three are a block across a pillar (Root Ford,
   Ferry Pocket, Seedwarden's Ferry). D4: nine wheel rooms that are "stand
   here and pump". D1: the Two Gauges and the Drip Vault are one puzzle twice.
3. **Signs solve.** Since S202 many signs state the steps. The cartridges
   teach an idea once and let later rooms speak.
4. **The Coral Spire is thin.** Three real puzzles (two forks, the Glass Cell).
5. **Small lies.** The Keep's Three Heights sign ("Three tides. One way
   through.") promises a puzzle the room does not have.

## The new kinds, each with its tide twist

From the cartridges' own puzzle code (oracles-disasm object_code/ages/
interactions: toggleFloor, floorColorChanger, coloredCube, waterPushblock,
pushblockSynchronizer, tileFiller, lever, miscPuzzles, dungeonEvents;
seasons: unicornsCaveReverseMovingArmos, swordShieldMazeGrabbableIce,
d4HolesFloortrapRoom, ancientRuinsScript_randomButtonRoom, statueEyeball):

| Kind | Source | Our twist | Dungeon |
|---|---|---|---|
| A. Real block puzzles | Ages Crown Dungeon, Hero's Cave; Seasons' repeat blocks | a block crosses shallow water, refuses deep, falls down an open drain; so the conch decides each band | D1 first, D6 hardest |
| B. Red/blue blocks | both (orb + toggle blocks, Ancient Ruins) | the conch is the orb: every tide change swaps them | D2 (with the Lens: see the next tide's blocks) |
| C. Colour floor | Ages Spirit's Grave, Skull Dungeon | every tile the sea covers flips when the tide comes in | D5 |
| D. Rolling colour cube | Ages Mermaid's Cave, Hero's Cave | at HIGH it floats and will not tip; the Bellows can roll it from afar | D4 |
| E. Torches that burn out | Ages (flames with a burn time) | a rising sea puts out any torch it reaches | D3 |
| F. Statues that copy you | Seasons Unicorn's Cave (reverse-moving armos) | they will not enter water, so the tide changes where they stop | D5 |
| G. Key from above / floor that falls | Seasons Explorer's Crypt, Snake's Remains floor trap | holes open only at LOW; the crumbling floor drops you into the sea at HIGH | D3, D4 |
| H. Pick the right one | Ages D6 levers, Seasons Ancient Ruins buttons | the right one is the one the sea mark points to at this tide; a wrong one lets enemies loose | D1 |
| More: eye statues (Seasons statueEyeball), a bridge that holds only while its plate is held (Ages extendableBridge), slates into slots (Ages D8) | | eyes turn with the tide; the block crosses the drain only at MID; each slot's height is a sea | D2, D1, D6 |

## Order (one or two kinds per session, each mocked, shown, proved, played)

1. **S204, DONE: A and H in D1.** The Switch Room 0,4,4 (two blocks, two
   seas), the Weeping Cistern 0,1,3 (one block down the gate primitive with
   the Anchor) — `check-blocks.mjs`; the Sunken Hall 0,3,5 (three plates,
   each right while ankle-deep) — `check-tideplates.mjs`. Pictures in
   `docs/briefs/puzzle-pass/`.
2. **S205, DONE: the Drip Vault 0,1,1** — three marks; the basin out of
   every bite's reach, so one iron goes BETWEEN the two floor wells
   (check-anchor's `marks`).
3. **S205, DONE: B in D2.** Red and blue blocks flipped by every tide change
   (`tools/check-toggles.mjs`): the Rising Chamber 0,3,4 (one forced press in
   the sluice row) and the Turning Pool 1,2,3, which replaced the empty
   Drowned Cell (red in and red out; the Anchor holds water, not blocks).
4. **S206, DONE: E and G in D3.** The Sunken Vestry 1,1,3: four torches
   that burn out (TORCH_BURN_FRAMES, Seasons' Snake's Remains $6a), the sea
   putting out any it reaches — the closet pair at HIGH, the pool pair at LOW
   (`check-flames.mjs`); its key falls down the hole to the new Vestry Crypt
   0,1,3 (`check-keydrop.mjs`, Seasons' Explorer's Crypt 52/45). The Silt
   Vault 1,1,4 is the step up: pool (LOW) and island (MID), the Anchor holds
   one. Pictures `docs/briefs/puzzle-pass/s206-*.png`.
5. **S207, DONE: D and G in D4.** The Cistern Floor 0,4,4 (the colour cube:
   roll one well at LOW, float the other), the Cistern Gauge 0,2,2 (was a
   wheel: the cube blown round a channel in a field of holes) and the Spill
   Vault 0,1,5 (a cracked bridge that falls into the sea: hole at LOW and MID,
   deep water at HIGH) — `check-cube.mjs`. Pictures
   `docs/briefs/puzzle-pass/s207-*.png`. The cone's wind is the sea a level
   lower, so at MID the gust tips the cube where it would float.
5b. **S208, DONE: the last two copied sills.** The Gull Roost 0,6,5 (the cube
   sails a bay of sumps: MID pushes, the HIGH gust from the near pier) and the
   Siphon Stair's upper half 0,0,1 (float the pool at MID, up the siphon at
   HIGH) — check-cube. Pictures `s208-gull.png`, `s208-siphon.png`.
6. **S208, DONE: C and F in D5.** F, the mirror statue (Statue: every block
   push moves it the other way; it will not step into water): the Sunken
   Bracken 0,4,4 (LOW walks it home, MID holds it while the block goes back)
   and the Sunken Nave 0,2,2 (two statues, one sea for each) —
   `check-statues.mjs`. C, the tide floor (every tile the rising sea covers
   turns, except under a block; walking does NOT turn tiles — that made every
   pattern walkable): the Bole Walk 0,2,3 (one press) and the Knot Garden
   0,0,6 (two heights, one block, twice round) — `check-tidefloor.mjs`.
   Pictures `s208-bracken/nave/bole/knot.png`. Left: the Long Ford's floor
   and D6's Drowned Garden (one-stake copies), the three block-across-pillar
   rooms.
7. **S209, DONE: A hard, with ice, in D6.** Seasons' sliding ice block
   ($2f, pushblock.s state 2; room $586), and the sea decides where each push
   ends: a hole takes it, wading water catches it, deep water it floats over.
   The Drain Court 1,4,5 (one block, four shoves at MID, HIGH, LOW, MID) and
   the new optional Rime Gauge 0,6,2 in the Hold (two blocks, each the
   other's stopper, one row read like a tide gauge; 8 pushes, 7 presses; a
   blank) — `check-iceblocks.mjs`. Pictures `s209-drain.png`, `s209-hold.png`
   (spec `s209-ice-mock.json`). Still left from step 6: the Long Ford's floor
   and D6's Drowned Garden (one-stake copies), the three block-across-pillar
   rooms.
7b. **S210, DONE: step 6's leftovers — the stake inside other puzzles.**
   A pillar's other two lives (a wall at MID, deep water at HIGH) put to work
   by what is round it (`check-fords.mjs`, `tools/lib/ford-flood.mjs`): the
   Root Ford 0,0,3 (the block over the stake at LOW, onto a drain at MID; the
   islets are reached swimming, so you go round the tide on one; Seasons'
   Ancient Ruins $4ab), the Long Ford 0,4,3 (the first stake is a wall at MID
   and catches the second; Ages' Moonlit Grotto $4a6), the Ferry Pocket 0,0,4
   (a mirror statue crosses only on the stake, at LOW, and the stake holds it
   at MID while the block is reset; Seasons' Unicorn's Cave $493), the
   Seedwarden's Ferry 0,5,6 (two stakes need LOW and the drain past them MID,
   at once: the Anchor holds the ford; Ages' Jabu-Jabu $553), and D6's
   Drowned Garden 1,4,2 (Seasons' ice block floats over the lintel at HIGH, a
   stake past the plate stops it at MID; S&S Maze $586). Pictures
   `s210-*.png`, spec `s210-fords-mock.json`. No one-stake copy and no
   block-across-a-pillar copy is left.
8. Signs: full words only where an item is first taught. **S210, first
   pass**: eight signs that solved now hint (see NEXT-SESSION S210).
   **S211, DONE, second pass**: 13 more (NEXT-SESSION S211); no NPC line
   solves a room.
9. **S211: the "More" kinds.** Eye statues, DONE: the Coral Spire's Eye Hall
   1,3,4, the eyes turn with the tide (`check-eyes.mjs`, `s211-eyes.png`).
   Held bridge, DONE: the Grotto's Tide Gallery 0,3,4, a block the only
   weight, over the drain at MID only (`check-bridges.mjs`,
   `s211-bridge.png`; the sea does not press a plate, the Sunken Hall's
   rule). Slates, DONE in S212: the Keep's Stairhead 2,3,1 before the King,
   slots at three heights (dry LOW, wading MID, swimming HIGH), four slates
   fished up from the Hold at MID (`check-slates.mjs`, `s212-slates.png`).

Every new room changes the robot's clock (HANDOFF S192/S198/S203): sweep the
next boss's entry wait after each.
