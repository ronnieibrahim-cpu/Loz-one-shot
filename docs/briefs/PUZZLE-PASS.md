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
| More: eye statues (Seasons statueEyeball), a bridge that holds only while its plate is held (Ages D5 extendableBridge), slates into slots (Ages D8) | | each needs its twist before it is built | later |

## Order (one or two kinds per session, each mocked, shown, proved, played)

1. **S204, DONE: A and H in D1.** The Switch Room 0,4,4 (two blocks, two
   seas), the Weeping Cistern 0,1,3 (one block down the gate primitive with
   the Anchor) — `check-blocks.mjs`; the Sunken Hall 0,3,5 (three plates,
   each right while ankle-deep) — `check-tideplates.mjs`. Pictures in
   `docs/briefs/puzzle-pass/`.
2. NEXT: the Drip Vault 0,1,1 made a step up from the Two Gauges 0,4,3 (both
   are "one well empty, one well full"; the Drip Vault could add a block
   that must sit in the held patch, or a third gauge), then on to D2.
3. B in D2 (the Rising Chamber, plus one new room: D2's fix 4).
4. E and G in D3 (Sunken Vestry; a key from above).
5. D and G in D4 (Cistern Floor; the crumbling floor); the wheel rooms each
   given a twist or swapped.
6. C and F in D5 (Sunken Bracken; the one-stake copies).
7. A hard, with ice, in D6 (Drain Court, the Hold).
8. Signs: full words only where an item is first taught.

Every new room changes the robot's clock (HANDOFF S192/S198/S203): sweep the
next boss's entry wait after each.
