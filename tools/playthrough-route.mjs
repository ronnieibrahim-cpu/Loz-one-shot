// The route the beatability test walks. See tools/check-playthrough.mjs for
// what it proves and for the rules the route has to obey.
//
// It is data rather than code so that extending the run to D2 and beyond is an
// edit to a list, and so the harness's assertions do not have to move when the
// route does.

export const SEED = 20260806;

// Retuned for the `entity-solid-collision` merge (`0b68e6b`): push blocks are
// solid to the player now, so `canOccupy` genuinely rejects a path through one
// and `Player.tryPush` actually fires. The previous route pre-dated that fix
// and hand-picked `goto` waypoints that assumed a block was see-through floor
// — `goto(1,3)` in the Sunken Hall walked straight over the block sitting on
// that tile, which used to work and now fails to path at all, and the whole
// rest of the route quietly played out inside the wrong room as a result (see
// docs/HANDOFF.md for the trace that found it). Two structural changes fix
// that class of bug rather than re-guessing pixels:
//
//   1. Room-to-room movement uses `travel`, not hand-picked `goto`+`exit`
//      pairs. `travel` re-derives its own path from the engine's live
//      `canOccupy` every leg, so a block moving under it cannot desync it the
//      way a fixed waypoint can.
//   2. The two push-block puzzles (the Sunken Hall's fairy, previously
//      unobtainable for the same reason the Switch Room's key was, and the
//      Switch Room itself) are walked for real: stand south of each block,
//      hold `up` long enough to push it onto its switch, and both blocks
//      have to be down before the reward fires.
//
// The route now runs from the title screen to the fourth Essence. See `GOAL`
// at the foot of this file for exactly what that covers and where it stops.
export const ROUTE = [
  // Title screen, file select, and the intro. Every button here is a real
  // press: this is where the conch and the sword come from.
  ['newgame', 3000],

  // ---- THREE PIECES OF HEART, AND WHY THE ROUTE NOW DETOURS FOR THEM -----
  //
  // Gohmaraq is not winnable at three hearts by a player who walks in the
  // front door. Measured both ways: `tools/measure-boss-combat.mjs d1` drops
  // the actor into the arena at twelve quarter-hearts and it wins 12 seeds of
  // 12 — but that harness TELEPORTS in and starts the fight from a standing
  // position at 72,80, and this route walks in through the south door with the
  // boss's intro already running. Walked in at 12 qh it loses; walked in at
  // 16 it wins, finishing on 4. So the route collects a Heart Container, the
  // same way a player does: four Pieces of Heart.
  //
  // Three of them are out here and the fourth is the one behind D1's Clawcrab
  // door, which is what makes the east wing worth walking rather than a
  // detour — see the east wing below. The container completes on that fourth
  // piece, and `addHeartContainer` (src/game/progress.js) refills to the new
  // maximum, so the run walks out of the Two Gauges on a full sixteen with
  // only the west wing between it and the boss. That ordering is the health
  // budget for this whole run and it is not an accident.
  //
  // The Bluff Grotto, one screen west of the village. Its piece is on row 2
  // with rows 0 and 1 solid wall above it, so there is no tile north to step
  // to and it misses a tile-centred player BY ONE PIXEL — `dLoot` leans on the
  // wall for it now. See the note there; it is the same fault in two caves.
  ['travel', 3, 7, 6000],
  ['goto', 3, 2, 900],
  ['wait', 90],
  ['dialogue', 300],
  ['loot', 900],
  ['dialogue', 400],
  ['goto', 5, 6, 400],
  ['wait', 120],
  ['dialogue', 300],

  // The Reef Hollow, on the way east. Its piece is two tiles into the seafloor
  // patch and the wall carving says so — "When the sea withdraws, walk where
  // fish swam". Seafloor is walkable at LOW and nowhere else, so the conch is
  // the whole puzzle: MID -> HIGH -> LOW is two soundings.
  ['travel', 6, 7, 6000],
  ['goto', 4, 2, 900],
  ['wait', 90],
  ['dialogue', 300],
  ['use', 'conch', 2, 140],
  ['loot', 1500],
  ['dialogue', 400],
  ['goto', 5, 6, 400],
  ['wait', 120],
  ['dialogue', 300],
  // There is an octorok on the mouth of this cave and the run comes out of the
  // door into its line. Walked past, it took six of twelve quarter-hearts —
  // half the run's health for a screen it crosses twice — and left the Sunken
  // Hall's fight to be fought on three. Cleared, it costs nothing and drops
  // what it drops.
  ['fight', 1400],
  ['dialogue', 200],
  ['loot', 600],
  // AND PUT THE SEA BACK BEFORE WALKING ANYWHERE. `travel` re-derives its path
  // from the engine's own `canOccupy` every leg, so at LOW it happily routes
  // across seabed that is only walkable at LOW — straight through the
  // anglerfry and urchins that live there. The first cut of this route left
  // the conch down and crossed the coast on the sea floor: it died twice
  // before reaching the dungeon. One sounding puts it back to MID, which is
  // also the level everything from the Grotto Mouth on was written against.
  // Sounded OUT HERE and not in the cave: the piece is two tiles into the
  // seafloor patch, and seafloor at MID is over your head. Raising the sea
  // while standing in it strands the player in the water he waded to get
  // there.
  ['use', 'conch', 1, 140],

  // THE THIRD PIECE IS NOT OUT HERE, and that was measured rather than
  // assumed. Shell Flats (0,10,8) has one on a sandbar two screens east of the
  // grotto mouth, and the round trip costs about ten quarter-hearts of the
  // twelve this run has: Sandpiper Row is crossed twice and the mouth of the
  // Reef Hollow has an octorok sitting on it. The route died there. The third
  // piece is the Clawcrab's instead — inside the dungeon, past the fairy that
  // heals to full, and on the way to the fourth.

  // And on to the Grotto Mouth.
  ['travel', 8, 8, 12000],

  // The cave mouth is a warp tile at 4,2 — walking onto it is the whole of
  // entering a dungeon. It moved down a row when the mouths were set into the
  // rock they are cut into (the two cells above it are now the cliff), so this
  // directive moves with it. There is a crab on this screen; it is walked past
  // rather than fought, which is what a player does.
  ['goto', 4, 2, 600],
  ['wait', 60],
  ['dialogue', 200],

  // ================================================================= D1
  // TIDEWASH GROTTO, REBUILT AT ORACLE SIZE (S137). Every room is 15x11 with a
  // wall ring, doors are one tile wide in the middle of each wall, and the
  // key doors and the boss door are in the ring between two rooms rather than
  // across the middle of one. Coordinates below are tiles in the new rooms.
  //
  // ---------------------------------------------------------------- d1 0,3,7
  // The Grotto Mouth. Sound the sea DOWN to LOW before going anywhere: the
  // room north of here is five rows of wells from wall to wall. MID -> HIGH
  // -> LOW is two soundings, made from dry stone clear of the two pools.
  ['goto', 7, 6, 400],
  ['use', 'conch', 2, 120],
  ['dialogue', 200],

  // ---------------------------------------------------------------- d1 0,3,6
  // The Drinking Floor, waded at LOW, and cleared: a room cleared on the way
  // in is still clear on every walk back through the spine (S128).
  ['travel', 3, 6, 2000],
  ['fight', 1800],
  ['dialogue', 200],
  ['loot', 700],

  // ---------------------------------------------------------------- d1 0,3,5
  // The Sunken Hall, the hub. Each block sits one tile south of its plate;
  // stand below it and push north. Both down is the fairy.
  ['travel', 3, 5, 2000],
  ['fight', 1800],
  ['dialogue', 200],
  ['loot', 500],
  ['goto', 2, 5, 400],
  ['hold', ['up'], 100],
  ['goto', 12, 5, 500],
  ['hold', ['up'], 100],
  ['dialogue', 300],
  ['loot', 600],

  // West wing: the Dungeon Map, loose on the floor behind three blocks.
  ['travel', 2, 5, 2000],
  ['fight', 1200],
  ['loot', 500],

  // East wing: the Chartstone, in a chest, opened from the south.
  ['travel', 4, 5, 2000],
  ['fight', 1200],
  ['loot', 500],
  ['goto', 7, 6, 500],
  ['hold', ['up'], 6],
  ['tap', 'a', 40],
  ['dialogue', 400],
  ['loot', 600],

  // ---------------------------------------------------------------- d1 0,3,4
  // The Tide Gallery. Its north door is a key door, and so is the Locked
  // Stair's above it: two Small Keys between here and the Anchor.
  ['travel', 3, 4, 2000],
  ['fight', 1400],
  ['dialogue', 200],
  ['loot', 500],

  // ---------------------------------------------------------------- d1 0,2,4
  // West to the Crab Pit: three shielded crabs, and clearing it is the key.
  ['travel', 2, 4, 2000],
  ['fight', 2400],
  ['dialogue', 300],
  ['loot', 600],

  // ---------------------------------------------------------------- d1 0,4,4
  // East to the Switch Room, for the SECOND key: the Sunken Hall's puzzle one
  // room over, each block pushed north onto its plate.
  ['travel', 3, 4, 2000],
  ['travel', 4, 4, 2000],
  ['fight', 1400],
  ['loot', 500],
  ['goto', 4, 5, 400],
  ['hold', ['up'], 100],
  ['goto', 10, 5, 500],
  ['hold', ['up'], 100],
  ['dialogue', 300],
  ['loot', 600],

  // Back in the Tide Gallery. Spend the first key on the north door: walk
  // into it until it stops you, then open it.
  ['travel', 3, 4, 2000],
  ['fight', 1400],
  ['loot', 500],
  ['goto', 7, 1, 500],
  ['hold', ['up'], 24],
  ['tap', 'a', 30],
  ['dialogue', 300],
  ['exit', 'up', 400],

  // ---------------------------------------------------------------- d1 0,3,3
  // The Locked Stair. Two zols, then the second key on the north door.
  ['fight', 1800],
  ['dialogue', 200],
  ['loot', 500],
  ['goto', 7, 1, 500],
  ['hold', ['up'], 30],
  ['tap', 'a', 30],
  ['dialogue', 200],
  ['exit', 'up', 400],

  // ---------------------------------------------------------------- d1 0,3,2
  // The Sluicegate: the big chest with the Anchor, opened from the north,
  // under the boss door it will eventually lead back to.
  ['goto', 7, 2, 500],
  ['hold', ['down'], 6],
  ['tap', 'a', 40],
  ['dialogue', 400],
  ['loot', 600],
  ['wait', 60],

  // ---------------------------------------------------------------- d1 0,4,2
  // THE IRON PIPE — wells near, drains far. The sea is still at LOW. Put the
  // Anchor on A (it came out of its chest on no button), walk in, bite 6,5 —
  // the patch covers x=4..8, every well and not one drain — then MID.
  ['equip', 'anchor', 'A', 400],
  ['travel', 4, 2, 2000],
  ['anchor', 6, 5, 1600],
  ['use', 'conch', 1, 120],
  ['goto', 13, 5, 900],
  ['exit', 'right', 300],

  // ---------------------------------------------------------------- d1 0,5,2
  // The Drowned Chamber. At MID the drains are water with two anglerfry in
  // it; at LOW they are an empty pit with dry stone all round, and the fish
  // have nowhere to be. Two soundings, then round by the north wall.
  ['use', 'conch', 2, 140],
  ['goto', 1, 1, 900],
  ['goto', 7, 1, 900],
  ['exit', 'up', 300],

  // ---------------------------------------------------------------- d1 0,5,1
  // THE LONG RACE — wells near again, from the east. In at the south door
  // below a row of blocks, up the east side, bite 8,5 from 10,5 at LOW, MID.
  ['goto', 10, 5, 600],
  ['anchor', 8, 5, 1600],
  ['use', 'conch', 1, 140],
  ['goto', 1, 5, 900],
  ['exit', 'left', 300],

  // ---------------------------------------------------------------- d1 0,4,1
  // The Keyvault: the third key, in a chest, opened from the north.
  ['equip', 'sword', 'A', 400],
  ['fight', 1200],
  ['loot', 500],
  ['goto', 7, 4, 600],
  ['hold', ['down'], 6],
  ['tap', 'a', 40],
  ['dialogue', 400],
  ['loot', 600],

  // Back across the race on the iron still sunk in it, and down again.
  ['goto', 13, 5, 900],
  ['exit', 'right', 300],
  ['goto', 10, 5, 900],
  ['goto', 10, 8, 600],
  ['goto', 7, 9, 600],
  ['exit', 'down', 300],
  // Through the Drowned Chamber at LOW again, round by the east wall.
  ['use', 'conch', 2, 140],
  ['goto', 12, 1, 900],
  ['goto', 12, 9, 900],
  ['goto', 7, 9, 900],
  ['exit', 'down', 300],
  ['use', 'conch', 1, 140],

  // ---------------------------------------------------------------- d1 0,5,3
  // THE CLAWCRAB, fought at MID in its own long den, then the third key on
  // the den's west door.
  ['boss', 6000, 'clawcrab'],
  ['dialogue', 600],
  ['loot', 1500],
  ['dialogue', 400],
  ['goto', 1, 5, 900],
  ['hold', ['left'], 24],
  ['tap', 'a', 30],
  ['dialogue', 300],
  ['exit', 'left', 300],

  // ---------------------------------------------------------------- d1 0,4,3
  // THE TWO GAUGES. Hold the west well drained under the iron and take the
  // sea to HIGH: one empty, one full, and the shutter gives. Behind it, a
  // Piece of Heart and the stair home.
  ['equip', 'anchor', 'A', 400],
  ['use', 'conch', 2, 140],
  ['anchor', 4, 4, 1600],
  ['use', 'conch', 2, 140],
  ['dialogue', 400],
  // The Piece of Heart sits against the shutter wall, and the drop sweep
  // gives up on it a pixel short; step onto its tile. It is the fourth piece:
  // the container completes and refills the bar for the rest of the dungeon.
  ['goto', 3, 8, 600],
  ['dialogue', 600],
  ['loot', 600],
  ['goto', 12, 9, 600],
  ['wait', 120],
  ['dialogue', 300],

  // ---------------------------------------------------------------- d1 0,3,3
  // Up the stair into the Locked Stair's south-east corner, and north.
  ['equip', 'sword', 'A', 400],
  ['fight', 1600],
  ['dialogue', 200],
  ['loot', 600],
  ['use', 'conch', 2, 140],
  ['goto', 7, 1, 900],
  ['exit', 'up', 400],

  // ---------------------------------------------------------------- d1 0,2,2
  // THE LONG SLUICE — the gate one iron cannot cross (check-anchor proves
  // it). From the east at MID: bite 11,5 so the near drains stay full, go
  // LOW and walk out onto the wells; then the second throw — `anchor`
  // recalls the iron by itself — bites 6,5 to hold the wells drained, and
  // MID fills the far drains.
  ['equip', 'anchor', 'A', 400],
  ['goto', 1, 5, 500],
  ['exit', 'left', 300],
  ['anchor', 11, 5, 1600],
  ['use', 'conch', 2, 140],
  ['goto', 8, 5, 900],
  ['anchor', 6, 5, 1600],
  ['use', 'conch', 1, 140],
  ['goto', 1, 5, 900],
  ['exit', 'left', 300],

  // ---------------------------------------------------------------- d1 0,1,2
  ['goto', 7, 1, 600],
  ['exit', 'up', 300],

  // ---------------------------------------------------------------- d1 0,1,1
  // THE DRIP VAULT. The same gauges, north and south: LOW, hold the upper
  // well under the iron, HIGH.
  ['equip', 'sword', 'A', 400],
  ['fight', 900],
  ['loot', 400],
  ['equip', 'anchor', 'A', 400],
  ['use', 'conch', 2, 140],
  ['anchor', 7, 4, 1600],
  ['use', 'conch', 2, 140],
  ['dialogue', 400],
  ['goto', 13, 5, 600],
  ['exit', 'right', 300],

  // ---------------------------------------------------------------- d1 0,2,1
  // The Boss Key, opened from the north, and the stair home.
  ['equip', 'sword', 'A', 400],
  ['fight', 900],
  ['loot', 400],
  ['goto', 7, 3, 600],
  ['hold', ['down'], 6],
  ['tap', 'a', 40],
  ['dialogue', 400],
  ['loot', 600],
  ['goto', 10, 7, 600],
  ['wait', 120],
  ['dialogue', 300],

  // ---------------------------------------------------------------- d1 0,3,3
  // Gohmaraq is fought at LOW — his shell dries open — and the arena keeps
  // whatever level is brought in. HIGH -> LOW is one sounding.
  ['fight', 1500],
  ['dialogue', 200],
  ['loot', 600],
  ['use', 'conch', 1, 140],
  ['goto', 7, 1, 500],
  ['exit', 'up', 400],

  // ---------------------------------------------------------------- d1 0,3,2
  // The boss door, in the Sluicegate's north wall.
  ['goto', 7, 1, 600],
  ['hold', ['up'], 24],
  ['tap', 'a', 30],
  ['dialogue', 300],
  ['exit', 'up', 400],
  ['wait', 90],

  // ---------------------------------------------------------------- d1 0,3,1
  // GOHMARAQ, THE TIDEWASH CLAW. `openRetreat`: in his Oracle-size arena the
  // plain fight won 8 of 46 entry waits swept in the real run (20..200); with
  // the open-floor retreat every wait from 52 to 180 wins, on the same four
  // quarter-hearts — the fight stops depending on the frame it starts on.
  ['boss', 9000, null, { openRetreat: true }],
  ['wait', 300],
  // WALK ONTO THE ESSENCE BY HAND — `dLoot` cannot collect it: `Essence` has
  // no `isDrop`. It appears in the middle of the arena, tile 7,4.
  ['goto', 7, 4, 400],
  ['dialogue', 900],
  ['loot', 900],
  ['dialogue', 900],
  ['wait', 240],

  // ===================================================================
  // D2 — CORAL SPIRE. The run does not stop at the essence: it walks OUT of
  // Tidewash Grotto, across the overworld, and into the Coral Spire, exactly
  // as a player continuing the game would. Nothing here is new game state
  // granted from outside — every item, key and heart the run holds past this
  // point was earned the same way D1's were.
  //
  // GOHMARAQ LEAVES THE RUN AT 3-4 QUARTER-HEARTS, AND THAT IS NOT A BUG TO
  // ROUTE AROUND. D1's own fight was tuned to be survivable at all, not to
  // leave a buffer for anything after it, and the overworld between the two
  // dungeons is not hazard-free. The fix is in-game and legitimate: the
  // Tidewatch Shop sells one Heart for 10 rupees (`src/data/overworld.js`'s
  // `houseShop`), which the run can afford from ordinary `good` drops, and it
  // is genuinely ONE-PER-SAVE — `spawnRoomEntities` auto-assigns every
  // spawned entity a `saveKey` whether its own data names one or not, so the
  // purchase is recorded in `progress.secrets` and persists even if the shop
  // is re-entered. One heart is what the route needs; it does not try for a
  // second.
  // ------------------------------------------------------------- d1 0,3,7
  // `travel` walks all the way back out of the dungeon on its own — every
  // anchor-gated corridor included, with no help placing the anchor. It just
  // tries edges and learns which are blocked, and this dungeon's redundant
  // connectivity happens to offer a way out that never needs the anchor
  // sitting anywhere in particular.
  ['travel', 3, 7, 30000],
  ['goto', 7, 10, 500],
  ['wait', 60],

  // ------------------------------------------------------- overworld 0,8,8
  // Tidewatch Shop, one heart. Village East is `overworld/0,5,7`; its own
  // door warp sits at tile (4,4). APPROACH THE SHOP ITEM FROM BELOW AND FACE
  // UP — `tryContextAction` checks a reach point one step in front of the
  // player against the item's rect, and standing on the item's own tile (or
  // approaching from the side) misses it with no visible symptom at all: no
  // dialogue, no rupee spent, nothing to notice. `dialogueMask`'s blind
  // mash-A happens to answer the ensuing Yes/No prompt correctly, because
  // Yes is the choice index the prompt defaults to.
  ['travel', 5, 7, 8000],
  ['goto', 4, 4, 600],
  ['wait', 60],
  ['goto', 8, 4, 500],
  ['hold', ['up'], 6],
  ['tap', 'a', 30],
  ['dialogue', 300],
  ['goto', 5, 6, 500],
  ['exit', 'down', 400],
  ['wait', 60],
  ['travel', 8, 8, 8000],
  ['wait', 60],

  // ------------------------------------------------------- overworld 0,8,8
  // The Grotto Mouth's own crab. Plain `fight` kills it in a few hundred
  // frames — no special handling needed, unlike the one below.
  ['goto', 4, 6, 500],
  ['exit', 'right', 400],
  ['goto', 4, 1, 800],
  ['fight', 25000, 25000],
  ['dialogue', 200],
  ['loot', 900],

  // ------------------------------------------------------- overworld 0,9,8
  // Sandpiper Row. THIS crab resisted `['fight', 25000, 25000]` outright —
  // no damage taken either way, no kill — because `dFight`'s generic
  // "line up on one axis" approach logic converges on the SAME axis this
  // crab patrols (`patrol(e, g, { axis: 'x' })`), which is exactly its own
  // `shield: 'front'` blind spot. A `shield: 'front'` check only ever
  // compares a HORIZONTAL attack direction against the enemy's own
  // horizontal facing (`Entity.hurt`, `src/game/enemy.js`), so a vertical
  // swing can never match it and is unconditionally unblockable regardless
  // of which way the crab is currently facing. Stand directly above it and
  // swing down by hand.
  ['goto', 7, 4, 500],
  ['exit', 'right', 400],
  ['goto', 1, 5, 500],
  ['goto', 6, 0, 800],
  ['hold', ['down'], 30],
  ['tap', 'a', 40],
  ['tap', 'a', 40],
  ['tap', 'a', 40],
  ['tap', 'a', 40],
  ['dialogue', 200],
  ['loot', 900],

  // Straight on to the Spire Mouth — Coral Landing's fairy is a fuller heal
  // than anything the overworld has left to offer, so the two Pieces of
  // Heart sitting either side of the dungeon mouth are collected AFTER it,
  // not before, and at full health rather than at whatever the crossing left.
  ['travel', 10, 5, 8000],
  ['goto', 4, 2, 600],
  ['wait', 60],

  // ---------------------------------------------------------------- d2 0,3,6
  // Coral Landing. `puzzle.enemies: true` wants the urchin and the crab both
  // dead; the reward is a fairy — a full heal, and the only one this
  // dungeon's floor 0 offers outright.
  ['travel', 3, 6, 1500],
  ['fight', 1800],
  ['dialogue', 200],
  ['loot', 900],

  // Back out to the overworld for the two Pieces of Heart next door — now at
  // full health, where the crossing costs nothing it can't afford. Combined
  // with the Spire's own two (Glass Cell and Whelk Cell, below) that is FOUR
  // pieces: enough to complete a Heart Container mid-dungeon, refilling to
  // full and raising the cap right around when the fourth is collected
  // (`addHeartPiece`, `src/game/progress.js`) — which is the difference
  // between entering Anemos's fight able to win it and not.
  ['travel', 3, 7, 1500],
  ['goto', 7, 10, 500],
  ['wait', 60],

  // ------------------------------------------------------- overworld 0,10,6
  // Feather Gap has no entities at all — its own sign says why ("the gaps
  // are a single stride wide"). `travel`'s BFS could not find its way across
  // this gap reliably (it read the edge as blocked and rerouted through East
  // Dunes' leever instead, which is not survivable at this point in the
  // run); a plain `goto` to the gap tile and a manual `exit` cross it every
  // time.
  ['travel', 10, 6, 3000],
  ['goto', 4, 5, 500],
  ['exit', 'down', 400],

  // ------------------------------------------------------- overworld 0,10,7
  // Tidepools: a crab and an urchin, plain `fight` handles both.
  ['fight', 6000, 6000],
  ['dialogue', 200],
  ['loot', 900],
  ['goto', 4, 6, 500],
  ['exit', 'down', 400],

  // ------------------------------------------------------- overworld 0,10,8
  // Shell Flats. The heart piece needs LOW tide specifically — its own tile
  // is a well/pit variant, impassable at MID or HIGH (checked directly
  // against all three levels). The tide is already LOW from the walk out of
  // D1, so a plain `loot` reaches it; the urchin is stationary at LOW and
  // costs nothing to walk past.
  ['loot', 1200],
  // NAMED, NOT COUNTED. Outer Coral is crossed at MID and the sea arrives here
  // at whatever level D1's boss fight left it — which is not a constant: the
  // boss takes the tide off the player and the actor can spend a conch press
  // of its own escaping a lock. A counted press turned this into a HIGH-tide
  // crossing that does not exist, sixty directives after the fight that moved
  // it. `tide` says where the sea must be and gets it there.
  ['tide', 1, 140, 600],

  // ------------------------------------------------------- overworld 0,11,4
  // Outer Coral, right beside the Spire Mouth — MID tide for this one.
  ['travel', 11, 4, 6000],
  ['fight', 25000, 25000],
  ['dialogue', 200],
  ['loot', 900],
  ['travel', 10, 5, 4000],
  ['goto', 4, 2, 600],
  ['wait', 60],

  // ================================================================= D2
  // THE CORAL SPIRE, REBUILT AT ORACLE SIZE (S137): 15x11 rooms, the key
  // doors in the wall ring, Reefguard Hall and Spire Ascent two rooms long.
  //
  // ---------------------------------------------------------------- d2 0,3,4
  // Rising Chamber. Push each block outward onto its plate: the shutter in
  // the north wall lifts and the floor-0 Small Key drops north of the drain
  // band. THE BARNACLE AT 7,8 IS A FIXED HAZARD, never fought — so the key
  // is fetched up the east side, clear of it. Then the key opens the west
  // wall's key door, which is the Stair Coil's.
  ['travel', 3, 4, 1500],
  ['goto', 3, 8, 400],
  ['hold', ['left'], 40],
  ['goto', 11, 8, 500],
  ['hold', ['right'], 40],
  ['dialogue', 300],
  ['wait', 60],
  ['goto', 12, 3, 700],
  ['goto', 7, 3, 400],
  ['hold', ['up'], 3],
  ['wait', 10],
  ['goto', 1, 5, 700],
  ['hold', ['left'], 20],
  ['tap', 'a', 30],
  ['dialogue', 300],
  ['exit', 'left', 300],

  // ---------------------------------------------------------------- d2 0,2,4
  // Stair Coil: up the stair to floor 1.
  ['goto', 3, 3, 900],

  // ---------------------------------------------------------------- d2 1,2,4
  // Upper Landing, and Anemone Cell's fairy on the way past.
  ['travel', 2, 5, 1200],
  ['loot', 900],

  // ---------------------------------------------------------------- d2 1,4,4
  // Sealed Cell: the Lens, in the big chest in the north-west corner,
  // opened from above.
  ['travel', 4, 4, 1500],
  ['goto', 2, 1, 500],
  ['hold', ['down'], 6],
  ['tap', 'a', 40],
  ['dialogue', 400],
  ['loot', 600],

  // ---------------------------------------------------------------- d2 1,4,5
  // Glass Cell, the second Piece of Heart (S138): its keese live at HIGH,
  // the room pins the sea at LOW, and the Piece is the reward for clearing
  // it — so they are hunted with the Lens held up, the item from the chest
  // next door. The conch goes back on B for everything after.
  ['travel', 4, 5, 1200],
  ['equip', 'lens', 'B'],
  ['fight', 2400, 900, { lens: true }],
  ['dialogue', 300],
  ['loot', 900],
  ['equip', 'conch', 'B'],

  // ---------------------------------------------------------------- d2 1,4,3
  // The First Fork. The route already knows the answer and never presses
  // the Lens. Hop the west ledge from the shelf, turn the pocket's valve
  // (the room refuses the conch; the valve is the only thing that moves its
  // water), and climb the flooded shaft into Reefguard Hall.
  ['travel', 4, 3, 1200],
  ['goto', 5, 6, 500],
  ['hold', ['left'], 60],
  ['goto', 2, 6, 500],
  ['hold', ['down'], 10],
  ['tap', 'a', 40],
  ['goto', 3, 4, 400],
  ['hold', ['up'], 120],

  // ---------------------------------------------------------------- d2 1,4,2
  // Reefguard Hall, two rooms long: the miniboss for the second Small Key,
  // then the urchin that stands between the room and its puzzle flag.
  ['boss', 6000, 'reefguard'],
  ['dialogue', 300],
  ['use', 'conch', 2, 140],
  ['goto', 20, 5, 700],
  ['fight', 1500],
  ['dialogue', 300],
  ['goto', 7, 5, 700],
  ['hold', ['up'], 30],
  ['loot', 700],

  // ---------------------------------------------------------------- d2 1,5,3
  // Down the far end's south door to the Bomb Vault, and the Whelk Cell's
  // Piece of Heart below it.
  ['goto', 22, 9, 900],
  ['exit', 'down', 400],
  // FROM THE SIDE. Opened from above, Link leans into the chest until his
  // feet read inside its tile, and every path planned from there fails.
  ['goto', 6, 4, 500],
  ['hold', ['right'], 6],
  ['tap', 'a', 40],
  ['dialogue', 400],
  ['loot', 600],
  ['travel', 5, 4, 1200],
  ['loot', 900],

  // Back up through Reefguard Hall to Spire Ascent.
  ['travel', 5, 3, 900],
  ['travel', 5, 2, 1200],
  ['goto', 1, 5, 1200],
  ['exit', 'left', 400],

  // ---------------------------------------------------------------- d2 1,3,2
  // Spire Ascent, two rooms tall: the second key opens the key door low in
  // its west wall, and on to the Drowned Cell.
  ['goto', 1, 16, 1200],
  ['hold', ['left'], 20],
  ['tap', 'a', 30],
  ['dialogue', 300],
  ['travel', 2, 3, 900],

  // ---------------------------------------------------------------- d2 1,2,2
  // The Sounding Fork, the west throat: hop the ledge, turn the valve, wade
  // up. DO NOT HOLD PAST THE HOP — the throat above the pocket is a pit at
  // the pinned LOW until the valve is turned.
  ['travel', 2, 2, 1200],
  ['goto', 3, 7, 500],
  ['hold', ['up'], 20],
  ['goto', 3, 5, 400],
  ['hold', ['right'], 10],
  ['tap', 'a', 40],
  ['goto', 3, 1, 500],
  ['exit', 'up', 400],

  // ---------------------------------------------------------------- d2 1,2,1
  // The Boss Key.
  ['goto', 7, 1, 500],
  ['hold', ['down'], 6],
  ['tap', 'a', 40],
  ['dialogue', 400],
  ['loot', 600],

  // Back down the flooded west throat and onto its pocket's stair, which
  // comes up in Spire Ascent's lower room.
  ['goto', 3, 9, 500],
  ['exit', 'down', 400],
  ['goto', 3, 4, 500],
  ['goto', 4, 4, 500],

  // ---------------------------------------------------------------- d2 1,3,2
  // Up to the boss door in Spire Ascent's north wall. HIGH is Anemos's
  // widest window (`anemosFeed`: [40, 80, 160][tide] frames open in 250).
  ['goto', 7, 1, 1500],
  ['hold', ['up'], 24],
  ['tap', 'a', 30],
  ['dialogue', 300],
  ['use', 'conch', 1, 140],
  ['exit', 'up', 400],
  ['wait', 90],

  // ---------------------------------------------------------------- d2 1,3,1
  // ANEMOS, THE CROWNED COLUMN. His timers run off the absolute frame, so
  // the entry frame matters; this wait is re-swept whenever anything
  // upstream moves (see LEDGER S48/S50 for the method).
  ['wait', 216],
  ['boss', 9000],
  ['wait', 200],
  // The Essence has no `isDrop`; walk onto it, mid-arena at 7,4.
  ['goto', 7, 4, 400],
  ['dialogue', 900],
  ['loot', 900],
  ['dialogue', 900],
  ['wait', 240],

  // ===================================================================
  // D3 — BOGWATER SANCTUM. Draft leg 1: out of the Spire and across to the
  // Sanctum's mouth.
  ['travel', 4, 2, 8000],
  ['travel', 4, 3, 8000],
  ['goto', 2, 5, 900],
  ['wait', 90],
  ['goto', 12, 2, 900],
  ['wait', 60],
  ['travel', 3, 7, 20000],
  ['goto', 7, 10, 500],
  ['wait', 60],
  // West along the strand. Screen by screen rather than one `travel`: a single
  // call across the map rerouted north through the salt pans and died there.
  ['travel', 10, 6, 6000],
  ['goto', 4, 5, 500],
  ['exit', 'down', 400],
  ['travel', 10, 8, 4000],
  ['travel', 9, 8, 4000],
  ['travel', 8, 8, 4000],

  // Row 7 west from Grotto Mouth, not the strand — the strand's Dune Crossing
  // and Village Shore cost twelve quarter-hearts between them.
  ['travel', 8, 7, 6000],
  ['fight', 8000, 8000],
  ['loot', 1200],
  ['travel', 7, 7, 6000],
  ['fight', 8000, 8000],
  ['loot', 1200],
  ['travel', 6, 7, 6000],
  ['fight', 8000, 8000],
  ['loot', 1200],
  ['travel', 5, 7, 6000],
  ['travel', 4, 7, 6000],
  ['travel', 3, 7, 6000],
  ['fight', 8000, 8000],
  ['loot', 1200],

  // ------------------------------------------------- overworld 0,2,7
  // THE MARSH IS BEHIND A CRACKED CLIFF, AND THIS IS WHERE THE BOMBS EARN
  // THEIR PLACE IN THE RUN. Bog Causeway's east strip is walled off from the
  // rest of the screen by a cliff column with one split boulder in it at
  // (8,2); nothing walks round it, and every `travel` aimed west of here
  // reroutes north through the bluffs and dies on the way. Stand east of the
  // boulder, face it, and drop a bomb.
  //
  // THE BOMBS GO ON B AND THE CONCH COMES BACK TO B AFTERWARDS. `use` and
  // `tide` both press the slot the item is actually in, so leaving the bombs
  // equipped turns every later conch press into a bomb — and the tide is what
  // crosses the rest of this screen.
  ['travel', 2, 7, 6000],
  ['equip', 'bombs', 'B', 400],
  ['goto', 9, 2, 900],
  ['hold', ['left'], 8],
  ['use', 'bombs', 1, 60],
  ['goto', 9, 4, 400],
  ['wait', 180],
  ['equip', 'conch', 'B', 400],

  // The causeway's own sign says it wades only at LOW, and the sea is going
  // to LOW anyway for the fight at the end of this dungeon — Gloomtide is
  // nearly twice as fast at the current's own level.
  ['tide', 0, 140, 900],

  // ------------------------------------------------- overworld 0,1,8
  // The Sanctum's mouth, by way of Sanctum Path. Both halves of the arch
  // enter; the left one is the tile the door's own warp sits on.
  ['travel', 1, 8, 8000],
  ['goto', 4, 2, 800],
  ['wait', 90],

  // ---------------------------------------------------------------- d3 0,3,6
  // THE SANCTUM IS AN ORACLE DUNGEON (S139): every room is 15x11, doors are
  // one tile in the middle of each wall, and a key door is in the wall
  // between two rooms. The Drowned Nave's `puzzle.enemies: true` pays out a
  // FAIRY, and it is the heal the whole crossing west was spent on.
  ['travel', 3, 6, 4000],
  ['fight', 8000, 8000],
  ['wait', 120],
  ['dialogue', 400],
  ['wait', 120],
  ['loot', 1500],

  // ---------------------------------------------------------------- d3 0,2,5
  // Bog Hub, then the Map Cell for the Dungeon Map.
  ['travel', 3, 5, 4000],
  ['travel', 2, 5, 4000],
  ['loot', 1200],

  // ---------------------------------------------------------------- d3 0,4,5
  // The Sluice Cell. Two blocks, each one tile under its plate: stand under
  // each block and hold up. The key drops at the north wall between them.
  ['travel', 4, 5, 4000],
  ['goto', 3, 4, 900],
  ['hold', ['up'], 40],
  ['goto', 11, 4, 900],
  ['hold', ['up'], 40],
  ['dialogue', 300],
  ['goto', 7, 3, 600],
  ['hold', ['up'], 30],
  ['loot', 900],

  // ---------------------------------------------------------------- d3 0,3,4
  // The Weir. Its key door is in its north wall and gates the Cistern Floor,
  // not the room — the key is spent here and the two side cells either side
  // of it are walked afterwards.
  ['travel', 3, 4, 4000],
  ['goto', 7, 1, 900],
  ['hold', ['up'], 20],
  ['tap', 'a', 30],

  // ---------------------------------------------------------------- d3 0,2,4
  // Silt Cell: the Chartstone.
  ['travel', 2, 4, 4000],
  ['goto', 7, 4, 600],
  ['hold', ['up'], 6],
  ['tap', 'a', 40],
  ['dialogue', 400],
  ['loot', 900],

  // ---------------------------------------------------------------- d3 0,4,4
  // Reed Cell: clear it for a Piece of Heart.
  ['travel', 4, 4, 4000],
  ['fight', 8000, 8000],
  ['wait', 120],
  ['dialogue', 400],
  ['wait', 120],
  ['loot', 1500],

  // ---------------------------------------------------------------- d3 0,3,3
  // THE CISTERN FLOOR, AND THE KELP-SOLED CLEATS. The island is ringed by
  // flat deep water at every tide; the causeway from the key door is the only
  // dry way onto it, and the way off it is the item in the chest.
  ['travel', 3, 4, 4000],
  ['goto', 7, 1, 900],
  ['hold', ['up'], 40],
  ['wait', 60],
  ['goto', 7, 5, 900],
  ['hold', ['up'], 6],
  ['tap', 'a', 40],
  ['dialogue', 600],
  ['loot', 900],

  // ---------------------------------------------------------------- d3 0,2,3
  // WEST, ON THE SEAFLOOR. The soles go on B — the conch comes back to it
  // before the boss — and are pressed once on dry land, which arms them: the
  // next water the player steps into is entered by sinking rather than by
  // swimming (`Player.updateTerrain`). Off the island and under the Cistern's
  // west water, then the whole Undertow along its bottom: on the surface its
  // current runs east and carries you back onto the island. Coming up on a
  // bank surfaces the soles by themselves, so they are armed again there.
  ['equip', 'cleats', 'B', 400],
  ['goto', 5, 5, 600],
  ['soles', 'sink', 240],
  ['hold', ['left'], 200],
  ['wait', 60],
  ['soles', 'sink', 240],
  ['hold', ['left'], 420],
  ['wait', 90],

  // ---------------------------------------------------------------- d3 0,1,3
  // The Sunken Vestry, and the second Small Key: each block goes one tile
  // sideways toward the middle, onto its plate.
  ['goto', 12, 2, 900],
  ['hold', ['left'], 40],
  ['goto', 2, 2, 900],
  ['hold', ['right'], 40],
  ['dialogue', 300],
  ['goto', 7, 3, 600],
  ['hold', ['up'], 30],
  ['loot', 900],

  // ---------------------------------------------------------------- d3 0,1,2
  // The Drain Gallery, through the key door in the Vestry's north wall. The
  // Boss Key stands in a ring of drains, open to the south.
  ['goto', 7, 1, 900],
  ['hold', ['up'], 20],
  ['tap', 'a', 30],
  ['hold', ['up'], 60],
  ['wait', 60],
  ['goto', 7, 5, 900],
  ['hold', ['up'], 6],
  ['tap', 'a', 40],
  ['dialogue', 400],
  ['loot', 900],

  // ---------------------------------------------------------------- d3 0,2,2
  // BOGMAW HALL, east of the Boss Key, and the miniboss is fought now, on
  // the health the west wing leaves, rather than on the way out after
  // Gloomtide: the Kelp Locks are one way, so the walk home comes back
  // through this hall by the Lock Gallery's shortcut, and meeting Bogmaw
  // there on what the boss left killed the run. Then the Piece of Heart on
  // the Vestry Roof above it. `openRetreat` is measured, not guessed: from
  // this doorway without it the actor is pinned in the north-west corner and
  // loses 12 seeds in 13; with it, 13 in 13 (S139,
  // `measure-boss-combat.mjs d3 --mini=bogmaw`).
  ['travel', 2, 2, 4000],
  ['boss', 9000, 'bogmaw', { openRetreat: true }],
  ['wait', 120],
  ['dialogue', 400],
  ['loot', 1500],
  ['travel', 2, 1, 4000],
  ['loot', 1500],
  ['travel', 2, 2, 4000],
  ['travel', 1, 2, 4000],

  // ---------------------------------------------------------------- d3 0,2,3
  // BACK EAST ALONG THE UNDERTOW, ON THE SURFACE, AND IT IS FREE. The soles
  // came up on the Vestry's bank, so the player swims: step off the bank into
  // the current and it carries you the whole length back to the island. A
  // torrent is a wall one way and a road the other.
  ['travel', 1, 3, 4000],
  ['travel', 2, 3, 4000],
  ['hold', ['right'], 300],
  ['wait', 60],

  // ---------------------------------------------------------------- d3 0,3,3
  // Across the Cistern's west water to the island, and off its east side on
  // the floor: the Bogwater Drain runs west, so the crossing east is another
  // walk along the bottom.
  ['hold', ['right'], 120],
  ['goto', 9, 5, 900],
  ['soles', 'sink', 240],
  ['hold', ['right'], 200],
  ['wait', 60],

  // ---------------------------------------------------------------- d3 0,4,3
  // Along the Drain's floor by way of its bottom shelf, which holds a fairy:
  // the west wing and Bogmaw are paid for here, before the Eel Vault and the
  // boss. Coming up on the shelf surfaces the soles, so they are armed again
  // for the rest of the crossing.
  ['soles', 'sink', 240],
  ['hold', ['down', 'right'], 90],
  ['hold', ['right'], 60],
  ['wait', 30],
  ['soles', 'sink', 240],
  ['hold', ['up', 'right'], 80],
  ['hold', ['right'], 300],
  ['goto', 13, 5, 200],
  ['exit', 'right', 200],
  ['wait', 60],

  // ---------------------------------------------------------------- d3 0,5,4
  // Eel Hall's west screen, and straight through its south door to the Eel
  // Vault. NOTHING IS FOUGHT IN THE HALL: it fields two barnacles, which are
  // `hp: 999` turrets bolted to the wall, and a `fight` directive in a room
  // holding one never returns.
  ['goto', 7, 9, 900],
  ['hold', ['down'], 30],
  ['wait', 60],
  ['fight', 3000, 1200],

  // THE VAULT'S CRAB CANNOT BE KILLED BY `fight`, AND THE REASON IS THE SAME
  // ONE SANDPIPER ROW'S CRAB TAUGHT THIS ROUTE. `dFight` lines up on one
  // axis and closes; a crab patrols along x, which is the axis its
  // `shield: 'front'` covers, and a `shield: 'front'` check only ever
  // compares a HORIZONTAL attack direction against a horizontal facing
  // (`Entity.hurt`), so a vertical swing is unconditionally unblockable and a
  // horizontal one never lands. Stand over its patrol line and swing down.
  ['goto', 7, 4, 900],
  ['hold', ['down'], 3],
  ['tap', 'a', 16], ['tap', 'a', 16], ['tap', 'a', 16], ['tap', 'a', 16],
  ['tap', 'a', 16], ['tap', 'a', 16], ['tap', 'a', 16], ['tap', 'a', 16],
  ['tap', 'a', 16], ['tap', 'a', 16], ['tap', 'a', 16], ['tap', 'a', 16],
  ['fight', 3000, 1200],
  ['wait', 120],
  ['dialogue', 400],
  ['wait', 120],
  ['loot', 1500],

  // ---------------------------------------------------------------- d3 0,5,3
  // Back up into the Hall and through the key door in its north wall — the
  // third key, and the way into the Kelp Locks.
  ['goto', 7, 1, 900],
  ['hold', ['up'], 30],
  ['wait', 60],
  ['goto', 7, 1, 900],
  ['hold', ['up'], 20],
  ['tap', 'a', 30],
  ['hold', ['up'], 60],
  ['wait', 90],

  // ---------------------------------------------------------------- d3 0,4,2
  // THE KELP LOCKS, AND BOTH LAYERS IN ONE CROSSING. On the surface: into the
  // east lane, up it on the current, left into the top lane and west on the
  // current to the last gate, which runs against you. There, sink — in the
  // water — and walk the last three tiles down to the landing at the west
  // door. The whole flume on the floor is longer than a breath.
  ['goto', 26, 9, 900],
  ['hold', ['right'], 40],
  ['hold', ['up', 'right'], 200],
  ['hold', ['left'], 260],
  ['soles', 'sink', 240],
  ['hold', ['down'], 110],
  ['goto', 1, 5, 400],
  ['exit', 'left', 300],
  ['wait', 90],

  // ---------------------------------------------------------------- d3 0,3,2
  // The Lock Gallery. The plate beside its west door opens the shortcut back
  // to Bogmaw Hall, and the boss door is in its north wall. THE SEA GOES TO
  // LOW BEFORE THE DOOR IS OPENED, NOT AFTER: the arena is `noTide`, so it
  // pins whatever level was carried in, and MID is the sanctum current's own
  // level — Gloomtide is nearly twice as fast there.
  ['goto', 2, 5, 900],
  ['dialogue', 300],
  ['equip', 'conch', 'B', 400],
  ['tide', 0, 140, 600],
  ['goto', 7, 1, 900],
  ['hold', ['up'], 20],
  ['tap', 'a', 30],
  ['hold', ['up'], 40],
  // Re-swept at S139 in the Oracle arena, with the ink spit at a quarter
  // heart: settles 150..180 all win from this doorway (17-19 quarter-hearts
  // left), 140 and 190 lose. 165 sits in the middle of that window.
  ['wait', 165],

  // ---------------------------------------------------------------- d3 0,3,1
  // GLOOMTIDE, THE BOGWATER MAW. `clearAdds` is not optional here and it is
  // not general: the boss sheds gels, and read hit by hit, ten of the
  // fourteen hits that used to kill the actor came from the swarm and exactly
  // one came from the boss. `openRetreat` stays off: measured in S131-S132
  // from the route's own doorway, it flips a seed from a win to a death.
  ['boss', 14000, null, { clearAdds: true }],
  ['wait', 240],

  // The Essence is not a `Pickup` and `dLoot` cannot see it at any budget —
  // `Essence` collects on its own overlap check — so it is walked onto by
  // hand, before the loot call that sweeps up the arena's Heart Container.
  // It stands at 7,4 in the Oracle arena, and claiming it freezes the player
  // for the pose: a loot issued inside the freeze stands still, and the
  // Container, a tile above, was left in the room.
  ['goto', 7, 4, 600],
  ['dialogue', 900],
  ['wait', 240],
  ['dialogue', 900],
  ['loot', 1200],
  ['dialogue', 900],
  ['wait', 240],

  // ======================================================================
  // OUT OF THE SANCTUM, AND NORTH TO THE CLIFFSIDE CISTERN
  // ======================================================================
  //
  // Step out of the arena by hand — a `travel` issued inside a dead end with
  // one door plans north into the room it is already in — then west through
  // the shortcut the plate opened, into the hall where Bogmaw was beaten.
  // The Kelp Locks are one way.
  ['goto', 7, 9, 900],
  ['hold', ['down'], 60],
  ['wait', 90],
  ['travel', 2, 2, 6000],
  ['travel', 1, 2, 6000],
  ['travel', 1, 3, 6000],
  ['travel', 2, 3, 6000],
  ['travel', 3, 3, 8000],
  ['travel', 3, 4, 6000],
  ['travel', 3, 5, 6000],
  ['travel', 3, 6, 6000],
  ['travel', 3, 7, 6000],
  ['goto', 7, 9, 900],
  ['hold', ['down'], 90],
  ['wait', 120],

  // ------------------------------------------------- overworld 0,1,8 -> 0,2,7
  // OUT OF THE MARSH BY THE NORTH DOOR, NOT THE SOUTH ONE. Bog Causeway's
  // southern lobe — the two rows below its tree line — meets the rest of the
  // screen at exactly one column, and the player's own box does not fit in it:
  // the tile below is barrier, so `canOccupy` refuses the cell and every path
  // from the causeway's south rows to its east gate comes back null. The way
  // through is the screen ABOVE the Sanctum's door: Sanctum Mouth's north seam
  // into 1,7, and 1,7's east seam onto the causeway's own middle rows, which
  // is where the split boulder this run already bombed is standing open.
  //
  // The sea is still at LOW, where Gloomtide was fought, and the causeway
  // wades only at LOW — so the walk out is free and nothing is sounded.
  ['travel', 1, 7, 6000],
  ['travel', 2, 7, 6000],
  ['goto', 9, 2, 1200],
  ['hold', ['right'], 90],
  ['wait', 90],

  // ------------------------------------------------- overworld 0,3,7 -> 0,4,4
  // Across the bluffs, through Tidewatch Village, and up the wood road to
  // Shrine Path. Nine screens, all of them already walked at least once by
  // this run, and `travel` plans the whole thing.
  ['travel', 4, 7, 10000],
  ['travel', 4, 4, 10000],

  // ------------------------------------------------- overworld 0,3,4
  // THE DEEP CUT, AND THE SECOND BOMB THIS RUN HAS HAD TO SPEND ON A SCREEN.
  // The cut's east bank is a rockfall four boulders tall and the seam behind
  // it is a one-tile pocket: walk in from Shrine Path and there is nowhere to
  // go but back. Stand against the middle of it, face west, drop a bomb, and
  // the Cliffs of Kell are open — and with them the only road to D4's door.
  //
  // The conch goes back on B the moment the bomb has gone off. The Cistern is
  // six sills and a boss, and every one of them is a question about where the
  // sea is.
  ['goto', 1, 4, 1200],
  ['hold', ['left'], 60],
  ['wait', 60],
  ['equip', 'bombs', 'B', 400],
  ['goto', 9, 4, 900],
  ['hold', ['left'], 8],
  ['use', 'bombs', 1, 60],
  ['goto', 9, 2, 400],
  ['wait', 180],
  ['equip', 'conch', 'B', 400],
  ['goto', 1, 1, 1500],
  ['goto', 4, 1, 900],
  ['hold', ['up'], 60],
  ['wait', 60],

  // ------------------------------------------------- overworld 0,3,3 -> 0,1,3
  // Cliff Face, Kell Ledges and Cistern Mouth. The last two screens are
  // crossed over water that is only shallow at LOW — which is where the sea
  // already is — and the door is a block in the cliff with both its halves
  // warping, entered from the east.
  ['travel', 2, 3, 8000],
  ['travel', 1, 3, 8000],
  ['goto', 6, 2, 1200],
  ['hold', ['left'], 60],
  ['wait', 120],

  // ======================================================================
  // THE CLIFFSIDE CISTERN
  // ======================================================================
  //
  // Rebuilt at Oracle room size (S140): every door is in the middle of its
  // wall, key and boss doors are in the ring, and every coordinate below is a
  // tile of a 15x11 room.

  // ---------------------------------------------------------------- d4 0,3,7
  // Cistern Head, and north into the dungeon.
  ['travel', 3, 6, 4000],
  ['fight', 3000, 1200],

  // ---------------------------------------------------------------- d4 0,4,6
  // The Cracked Basin. Clear it and it drops the first Small Key.
  ['travel', 4, 6, 4000],
  ['fight', 5000, 1500],
  ['dialogue', 400],
  ['loot', 1200],

  // ---------------------------------------------------------------- d4 0,3,5
  // The Weir, and the first lock. The sump squares in it are the dungeon
  // teaching its own vocabulary before anything is riding on it: no floor at
  // LOW and over your head at MID. Its key door is in the north wall and is
  // the short way into the Barnacle Cell and on to the Cistern Floor.
  ['travel', 3, 5, 4000],
  ['fight', 3000, 1200],
  ['goto', 7, 1, 900],
  ['hold', ['up'], 20],
  ['tap', 'a', 30],
  ['hold', ['up'], 40],
  ['wait', 60],

  // ---------------------------------------------------------------- d4 0,4,4
  // THE CISTERN FLOOR, AND THE SECOND KEY. Three screens of water with a plate
  // at each end: the block holds the western one and you have to be standing
  // on the eastern one, forty tiles away. NOTHING IS FOUGHT UNTIL THE SEA IS
  // DOWN — at LOW both wells are wading water rather than a swim.
  ['travel', 4, 4, 5000],
  ['tide', 0, 140, 600],
  // THE BLOCK IS PUSHED BEFORE ANYTHING IS FOUGHT: a `fight` is a roam, and
  // the swordsman chasing a keese shoves the block off its own row on the way.
  ['goto', 4, 2, 900],
  ['hold', ['left'], 60],
  ['fight', 6000, 1500],
  ['goto', 41, 8, 2500],
  ['wait', 60],
  ['dialogue', 400],
  // The key drops on the island in the middle, twenty tiles back: walked to
  // first, because a loot sweep gives up on a drop it cannot reach in 200.
  ['goto', 22, 6, 1500],
  ['loot', 1500],

  // ---------------------------------------------------------------- d4 0,2,4
  // Back west through the Barnacle Cell — nothing is fought in it, because its
  // barnacle is an `hp: 999` turret and a `fight` in a room holding one never
  // returns — and into the Winch Room for the second lock, in its west wall.
  ['travel', 3, 4, 6000],
  ['travel', 2, 4, 4000],
  ['fight', 5000, 1500],
  ['goto', 1, 5, 900],
  ['hold', ['left'], 20],
  ['tap', 'a', 30],
  ['hold', ['left'], 40],
  ['wait', 90],

  // ---------------------------------------------------------------- d4 0,1,4
  // The Bellows Vault. One big chest, no enemies, and the Squall Bellows.
  ['goto', 8, 5, 600],
  ['hold', ['left'], 6],
  ['tap', 'a', 40],
  ['dialogue', 600],
  ['wait', 120],
  ['dialogue', 600],
  ['travel', 1, 3, 4000],

  // ---------------------------------------------------------------- d4 0,1,3
  // SILL 1 — THE SQUALL LOFT, WORKED AT MID, and the first time in this run
  // that an item is used by being HELD. The wheel is at the end of a shaft in
  // the north-west corner with a pit trench between it and anywhere a hand
  // reaches; the shelf you pump from is two squares of floor you swim up to,
  // and the sump under it is a hole at LOW and deep water at MID, so the sea
  // that lets you stand there is the same sea that drowns the wheel.
  //
  // THE BELLOWS GO ON A AND THE SWORD COMES BACK AFTERWARDS. The conch keeps
  // B for the whole of this dungeon — seven sills, and every one of them is a
  // question about where the water is — so the held item takes the sword's
  // button, and every room with something to kill in it is cleared before the
  // swap rather than after.
  ['fight', 3000, 1200],
  ['tide', 1, 140, 600],
  ['equip', 'bellows', 'A', 400],
  ['goto', 4, 1, 1200],
  ['bellows', 1, 1, 2500],
  ['equip', 'sword', 'A', 400],
  ['travel', 2, 3, 4000],

  // ---------------------------------------------------------------- d4 0,2,3
  // SILL 2 — THE DROWNED SILL, WORKED AT HIGH, and a player who has just
  // learned the Loft will try MID here and get nothing. The shelf is a single
  // square walled in by drown-wall on two sides: the sea has to be UP for you
  // to swim in over the top of it, and the cone is what takes that same sea
  // back off the wheel.
  ['fight', 4000, 1500],
  ['tide', 2, 140, 600],
  ['equip', 'bellows', 'A', 400],
  ['goto', 10, 9, 1200],
  ['bellows', 13, 9, 3000],
  ['equip', 'sword', 'A', 400],
  ['travel', 2, 2, 4000],

  // ---------------------------------------------------------------- d4 0,2,2
  // SILL 3 — THE CISTERN GAUGE, a sump shelf again and back at MID. What it
  // pays out is the third Small Key, and the key is a SCRIPT SPAWN: the room
  // puts it back on re-entry if it was released and never picked up, so the
  // loot call here is belt and braces rather than the only chance at it.
  ['fight', 4000, 1500],
  ['tide', 1, 140, 600],
  ['equip', 'bellows', 'A', 400],
  ['goto', 4, 5, 1200],
  ['bellows', 1, 5, 3000],
  // The key pops up off the shelf a few pixels, clear of a player standing
  // still, and a sweep issued inside its grab delay gives up on it.
  ['wait', 30],
  ['loot', 1500],
  ['dialogue', 400],
  ['equip', 'sword', 'A', 400],

  // ---------------------------------------------------------------- d4 0,2,1
  // THE WEST OVERLOOK, AND IT IS THE HEALTH BUDGET FOR THE REST OF THE
  // DUNGEON. Its pickup is a FAIRY and it is one screen off the path, taken
  // here rather than later because this is the low-water mark of the run.
  ['travel', 2, 1, 4000],
  ['fight', 3000, 1200],
  ['loot', 1200],
  ['travel', 2, 2, 4000],
  ['travel', 2, 3, 4000],
  ['travel', 3, 3, 4000],
  ['fight', 3000, 1200],
  ['travel', 4, 3, 4000],

  // ---------------------------------------------------------------- d4 0,4,3
  // SILLS 4a AND 4b — THE LONG RACE, and the second wheel is behind the
  // first. The west wheel is a sump shelf worked at MID; it opens the shutter
  // into the east vault, where the second wheel is at the top of a shaft
  // behind drown-wall and wants HIGH. So the room is worked twice, in order,
  // and the conch is sounded between.
  //
  // THE DARKNUT IN THE VAULT IS NOT FOUGHT, and that is a measurement rather
  // than a preference: `dFight` lines up on one axis and closes, and the
  // darknut's shield covers exactly that. At HIGH the east stand is behind
  // deep water a darknut does not swim, so the cone is pumped from a square
  // it cannot reach.
  ['fight', 3000, 1200],
  ['tide', 1, 140, 600],
  ['equip', 'bellows', 'A', 400],
  ['goto', 4, 1, 1200],
  ['bellows', 1, 1, 3000],
  ['tide', 2, 140, 600],
  ['goto', 10, 5, 2000],
  ['bellows', 10, 2, 3000],
  ['equip', 'sword', 'A', 400],
  ['goto', 13, 5, 1200],
  ['exit', 'right', 300],
  ['wait', 90],

  // ---------------------------------------------------------------- d4 0,5,3
  // THE IRONKNIGHT GALLERY. The miniboss is not `g.boss` — a miniboss clears
  // `isBoss` so that beating it cannot mark the whole dungeon beaten — so it
  // is named to the fight verb rather than found by it. Fought at HIGH, where
  // the drown-wall block in the middle of the room is simply gone and there is
  // nothing for it to charge around.
  ['boss', 14000, 'ironknight'],
  ['wait', 120],
  ['fight', 4000, 1500],
  ['dialogue', 600],
  ['travel', 5, 2, 4000],

  // ---------------------------------------------------------------- d4 0,5,2
  // Cliff Walk, and the third lock, in its west wall. Every walk here goes
  // by the middle of the room: the row between the pit pairs is the only
  // line with a tile of floor either side of it, and a path that cuts a pit's
  // corner drops the walker in it.
  ['goto', 7, 5, 900],
  ['fight', 4000, 1500],
  ['goto', 7, 5, 900],
  ['goto', 1, 5, 900],
  ['hold', ['left'], 20],
  ['tap', 'a', 60],
  ['hold', ['left'], 40],
  ['wait', 90],

  // ---------------------------------------------------------------- d4 0,4,2
  // SILLS 5 AND 6 — THE CROSSED SLUICES, one of each shape, in one room, with
  // the Boss Key behind both. The west wheel is a sump shelf and wants MID;
  // the east wheel is a drown-wall shelf and wants HIGH. You cannot hold two
  // seas, so the run works one side, swims back down to the floor, sounds the
  // conch, and works the other. The key lands in the middle rather than on
  // either shelf.
  ['fight', 6000, 2000],
  ['tide', 1, 140, 600],
  ['equip', 'bellows', 'A', 400],
  ['goto', 3, 4, 1200],
  ['bellows', 3, 1, 3000],
  ['goto', 5, 7, 1200],
  ['tide', 2, 140, 600],
  ['goto', 11, 4, 1200],
  ['bellows', 11, 1, 3000],
  ['goto', 9, 7, 1200],
  ['wait', 60],
  ['dialogue', 600],
  ['loot', 1500],
  ['equip', 'sword', 'A', 400],

  // ---------------------------------------------------------------- d4 0,4,1
  // The East Overlook: a rupee and D4's second Piece of Heart, in the corner
  // furthest from the door.
  ['travel', 4, 1, 4000],
  ['fight', 5000, 1800],
  ['loot', 1500],
  ['travel', 4, 2, 4000],

  // ------------------------------------------- d4, the shortcut to the boss door
  // Back into the Crossed Sluices and onto the plate beside its west door,
  // which opens the shutter straight into the Cistern Gate: the one-way
  // shortcut home, and the reason nothing east of here is walked twice.
  ['goto', 1, 6, 1500],
  ['dialogue', 400],
  ['goto', 1, 5, 600],
  ['exit', 'left', 300],
  ['wait', 60],

  // ---------------------------------------------------------------- d4 0,3,2
  // The Cistern Gate. THE SEA GOES TO LOW BEFORE THE BOSS DOOR IS OPENED, NOT
  // AFTER, and it is the whole fight: Wyverna's altitude, her speed and how
  // much of her can be reached are all read off the water. Drained, she is on
  // the cistern floor and permanently open.
  ['fight', 4000, 1500],
  ['tide', 0, 140, 600],
  ['goto', 7, 1, 900],
  ['hold', ['up'], 24],
  ['tap', 'a', 40],
  ['dialogue', 400],
  ['hold', ['up'], 60],
  ['wait', 120],

  // ---------------------------------------------------------------- d4 0,3,1
  // WYVERNA, THE SEA WYVERN, and the fourth Essence. `clearAdds` is left off:
  // she sheds keese in her last phase and they are not what kills anyone here.
  // The Essence stands at 7,4 in an Oracle arena: walk onto it and wait out
  // the pose, or the loot that follows stands still and the Heart Container
  // is left in the room.
  ['boss', 24000, null],
  ['wait', 240],
  ['goto', 7, 4, 600],
  ['dialogue', 900],
  ['wait', 240],
  ['dialogue', 900],
  ['loot', 1200],
  ['dialogue', 900],
  ['wait', 240],

  // ======================= OUT OF THE CISTERN AND ON TO THE SHRINE =========
  //
  // Step out of the arena by hand — a `travel` issued inside a dead end with
  // one door plans into the room it is already in — then walk out.
  // The way out is named room by room, down the west side: the planner's own
  // choice ran through the Barnacle Cell, whose turret cannot be killed.
  ['goto', 7, 9, 900],
  ['hold', ['down'], 60],
  ['wait', 120],
  ['travel', 2, 2, 4000],
  ['travel', 2, 3, 4000],
  ['travel', 1, 3, 4000],
  ['travel', 1, 4, 4000],
  ['travel', 2, 4, 4000],
  ['travel', 2, 5, 4000],
  ['travel', 2, 6, 4000],
  ['travel', 3, 6, 4000],
  ['travel', 3, 7, 4000],
  ['goto', 7, 9, 1500],
  ['hold', ['down'], 90],
  ['wait', 180],
  // ---- THE NOBLE SWORD, AND WHY THE RUN GOES BACK FOR IT ------------------
  //
  // The Bluff Grotto is where this run started: it took the Piece of Heart out
  // of it in its first two minutes and walked past the big chest beside it,
  // because that chest wants FOUR ESSENCES and the run had none. It has four
  // now, and it is the first time in the game that sentence is true.
  //
  // This is not a souvenir. Rootmaw has 52 hit points and sheds gels and zols
  // the whole way through the fight, and `measure-boss-combat` reads the same
  // answer twice: at the level-1 blade the run is still cutting at him when it
  // runs out of hearts — 44 of 52 taken, 28 quarter-hearts spent, dead — and
  // the first recording of this leg died in his arena on four hearts for
  // exactly that reason. The second blade is the difference between a fight
  // that is too long and one that is not, and the walk back for it is six
  // screens of open ground the run has already crossed twice.
  ['travel', 3, 7, 30000],
  ['goto', 3, 2, 1500],
  ['wait', 90],
  ['dialogue', 300],
  ['goto', 7, 3, 900],
  ['wait', 30],
  ['hold', ['up'], 20],
  ['tap', 'a', 60],
  ['dialogue', 900],
  ['loot', 1200],
  ['dialogue', 900],
  ['goto', 5, 6, 900],
  ['wait', 120],
  ['dialogue', 300],

  // Out on the overworld again, and north-east across the wood to the Drowned
  // Wood Shrine's arch at 5,4. `check-progression` puts this screen in round
  // one, so nothing on the way is gated — the walk is open ground and the
  // dungeon is the work.
  ['travel', 5, 4, 40000],
  ['goto', 4, 3, 1500],
  ['hold', ['up'], 60],
  ['wait', 180],

  // ======================= THE DROWNED WOOD SHRINE =========================
  //
  // Rebuilt at Oracle room size (S140): every coordinate below is a tile of a
  // 15x11 room, and every door is in the middle of its wall.
  //
  // EVERY ROOM IN THIS DUNGEON IS FOUGHT ON THE FRAME IT IS ENTERED, and that
  // is measured rather than tidy. The Shrine's cast is keese and tektites, and
  // both of them CLOSE: walk in, stand still for two seconds and then fight,
  // and Rootwater Landing costs three hearts; walk in and swing immediately
  // and it costs nothing.
  //
  // THE SHRINE HAS NO FAIRY. This dungeon has nothing but what its enemies
  // drop and its two Pieces of Heart, which is why the route takes both of
  // them and takes them BEFORE the locked door rather than after.
  ['goto', 7, 1, 900],
  ['hold', ['up'], 60],

  // ---------------------------------------------------------------- d5 0,3,6
  ['fight', 3000, 1200],
  ['loot', 600],

  // ---------------------------------------------------------------- d5 0,2,6
  // The Silt Gallery, and the Dungeon Map.
  ['travel', 2, 6, 6000],
  ['fight', 3000, 1200],
  ['goto', 7, 2, 1500],
  ['loot', 900],

  // ---------------------------------------------------------------- d5 0,4,6
  // The Bracken Cell: clear it for Small Key 1.
  ['travel', 4, 6, 8000],
  ['fight', 8000, 2500],
  ['dialogue', 400],
  ['goto', 7, 8, 1500],
  ['loot', 1500],

  // ---------------------------------------------------------------- d5 0,2,5
  // The Chartstone Nave.
  ['travel', 2, 5, 8000],
  ['fight', 4000, 1500],
  ['goto', 7, 3, 1500],
  ['wait', 30],
  ['hold', ['up'], 20],
  ['tap', 'a', 60],
  ['dialogue', 600],
  ['loot', 1200],
  ['dialogue', 600],

  // ---------------------------------------------------------------- d5 0,1,5
  // The Drowned Cloister, and the third Piece of Heart. THE SEA HAS TO BE UP
  // FOR IT: the piece sits in a one-tile well walled in by drown-wall on all
  // four sides, which is masonry at LOW and at MID and open water at HIGH. So
  // the conch is the whole room, and the swim back out is made before it is
  // sounded again — raising the sea while standing in it strands the player in
  // the water he swam to get there.
  ['travel', 1, 5, 8000],
  ['fight', 4000, 1500],
  ['tide', 2, 140, 600],
  ['goto', 7, 4, 1500],
  ['loot', 1200],
  ['goto', 11, 5, 1500],
  ['tide', 1, 140, 600],

  // ---------------------------------------------------------------- d5 0,4,5
  // The Thicket Cell: the Gillcarve charm.
  ['travel', 4, 5, 12000],
  ['fight', 4000, 1500],
  ['goto', 7, 4, 1500],
  ['wait', 30],
  ['hold', ['up'], 20],
  ['tap', 'a', 60],
  ['dialogue', 600],
  ['loot', 1200],
  ['dialogue', 600],

  // ---------------------------------------------------------------- d5 0,5,5
  // THE BOWER CELL, AND THE FIRST SQUALL BELLOWS SILL OUTSIDE THE CISTERN.
  // A wheel boxed in on three sides with a pit on the fourth, a stand across
  // it, and a sump shaft the only way up to the stand — drowned at the same
  // sea the wheel is. The fourth Piece of Heart falls into the shaft below the
  // stand, and with it the run's third Heart Container: the refill is what
  // pays for the groves, the half of this dungeon with no healing in it.
  ['travel', 5, 5, 8000],
  ['fight', 4000, 1500],
  ['equip', 'bellows', 'A', 400],
  ['goto', 4, 1, 2000],
  ['bellows', 1, 1, 3000],
  ['equip', 'sword', 'A', 400],
  ['dialogue', 600],
  ['wait', 30],
  ['loot', 1500],
  ['dialogue', 600],

  // ---------------------------------------------------------------- d5 0,3,5
  // The Standing Grove: four pairs of drowned boles in the middle of the
  // floor, which is where this dungeon teaches what a bole IS before anything
  // depends on it, and the first key door in its north wall.
  ['travel', 3, 5, 12000],
  ['fight', 4000, 1500],
  ['goto', 7, 1, 1500],
  ['wait', 30],
  ['hold', ['up'], 20],
  ['tap', 'a', 60],
  ['wait', 60],
  ['hold', ['up'], 60],

  // ---------------------------------------------------------------- d5 0,3,4
  // ROOTBOUND HALL IS CROSSED, NOT CLEARED, and that is measured. The barnacle
  // in the middle of it is what `dFight` cannot finish: the verb keeps closing
  // on a target it is not killing. Nothing in here is on the way to anything.
  ['goto', 13, 5, 1500],
  ['hold', ['right'], 90],

  // ---------------------------------------------------------------- d5 0,4,4
  // The Sunken Bracken: two blocks onto two plates for Small Key 2. Pushed
  // BEFORE the key is looted and after the room is cleared from the door.
  ['fight', 5000, 1800],
  ['loot', 600],
  ['goto', 4, 1, 1500],
  ['hold', ['left'], 120],
  ['wait', 60],
  ['goto', 10, 9, 1500],
  ['hold', ['right'], 120],
  ['wait', 60],
  ['dialogue', 400],
  ['goto', 7, 9, 1500],
  ['loot', 1500],

  // ---------------------------------------------------------------- d5 0,2,4
  // The Warden's Sill: the second key door, in its west wall. "Past this door
  // the floor is a thing you bring with you."
  ['travel', 2, 4, 12000],
  ['fight', 5000, 1800],
  ['loot', 600],
  ['goto', 1, 5, 1500],
  ['wait', 30],
  ['hold', ['left'], 20],
  ['tap', 'a', 60],
  ['wait', 60],
  ['hold', ['left'], 60],

  // ---------------------------------------------------------------- d5 0,1,4
  // The Reefseed Vault.
  ['goto', 8, 5, 1500],
  ['wait', 30],
  ['hold', ['left'], 6],
  ['tap', 'a', 60],
  ['dialogue', 600],
  ['loot', 1200],
  ['dialogue', 600],
  ['travel', 1, 3, 4000],

  // ---------------------------------------------------------------- d5 0,1,3
  // GROVE 1, THE FIRST STAKE, and the shape all five of them are:
  //
  //   sound the conch to HIGH, because the drowned bole between the bank and
  //   the stake is only gone at HIGH and a seed thrown at it stops dead at its
  //   foot; throw; sound the conch to LOW, because a coral pillar is ground at
  //   LOW and nowhere else; climb out of the water onto what you threw, and
  //   cut the snarl with the sword, which a swimmer cannot draw.
  //
  // Neither half can be bought at the other's sea. That is the dungeon.
  ['equip', 'reefseed', 'A', 400],
  ['tide', 2, 140, 600],
  ['reefseed', 11, 5, 900],
  ['tide', 0, 140, 600],
  ['equip', 'sword', 'A', 400],
  ['goto', 11, 5, 1500],
  ['wait', 30],
  ['hold', ['right'], 20],
  ['tap', 'a', 60],
  ['wait', 60],
  ['goto', 13, 5, 1500],
  ['hold', ['right'], 90],

  // ---------------------------------------------------------------- d5 0,2,3
  // GROVE 2, the Bole Walk — the same fixture turned through a right angle and
  // pointed north, so the throw that opens it is the one aimed away from the
  // door you came in by. Cleared first: this room is walked through three
  // times.
  ['fight', 2500, 900],
  ['loot', 600],
  ['equip', 'reefseed', 'A', 400],
  ['tide', 2, 140, 600],
  ['reefseed', 7, 4, 900],
  ['tide', 0, 140, 600],
  ['equip', 'sword', 'A', 400],
  ['goto', 7, 4, 1500],
  ['wait', 30],
  ['hold', ['up'], 20],
  ['tap', 'a', 60],
  ['wait', 60],
  ['goto', 7, 1, 1500],
  ['hold', ['up'], 90],

  // ---------------------------------------------------------------- d5 0,2,2
  // GROVE 3, the Sunken Nave, where the stake is not on the way to anywhere:
  // the snarl is set in the wall of a cell holding Small Key 3, and the room
  // can be walked straight through by anyone who never works out what the pool
  // is for.
  ['fight', 4000, 1500],
  ['loot', 600],
  ['equip', 'reefseed', 'A', 400],
  ['tide', 2, 140, 600],
  ['reefseed', 3, 5, 900],
  ['tide', 0, 140, 600],
  ['equip', 'sword', 'A', 400],
  ['goto', 3, 5, 1500],
  ['wait', 30],
  ['hold', ['left'], 20],
  ['tap', 'a', 60],
  ['wait', 60],
  ['goto', 1, 5, 1500],
  ['wait', 30],
  ['hold', ['down'], 20],
  ['tap', 'a', 60],
  ['dialogue', 600],
  ['loot', 1200],
  ['dialogue', 600],

  // ------------------------------------------------ THE WEST WING (S142)
  // Out through the Silt Cell's west door for the key to Thornvine's door.
  // THE KNOTTED POOL: the first stake over the bole at HIGH; then swim out
  // onto it and sound the conch round to LOW, which sets the sea down with
  // Link standing on it; the second stake from the first; cut the snarl.
  ['goto', 1, 5, 900],
  ['exit', 'left', 600],
  ['goto', 1, 5, 1500],
  ['exit', 'left', 600],
  ['fight', 3000, 1500],
  ['loot', 600],
  ['equip', 'reefseed', 'A', 400],
  ['tide', 2, 140, 600],
  ['reefseed', 7, 5, 900],
  ['goto', 7, 5, 900],
  ['tide', 0, 140, 600],
  ['reefseed', 7, 7, 900],
  ['equip', 'sword', 'A', 400],
  ['goto', 7, 7, 900],
  ['wait', 30],
  ['hold', ['down'], 20],
  ['tap', 'a', 60],
  ['wait', 60],
  ['goto', 7, 9, 900],
  ['exit', 'down', 600],
  // THE ROOT FORD: the stake at HIGH over the bole, swim out to the islet
  // and sound the sea round to LOW, then push the block west across the
  // pillar onto the plate. The key falls on the bank; the way back is HIGH.
  ['fight', 3000, 1200],
  ['equip', 'reefseed', 'A', 400],
  ['tide', 2, 140, 600],
  ['reefseed', 7, 5, 900],
  ['goto', 9, 5, 900],
  ['tide', 0, 140, 600],
  // One push per hold: PUSH_DELAY_FRAMES of leaning and a few to spare, not
  // so long that the lean starts again behind the block and shoves it twice.
  ['hold', ['left'], 26],
  ['goto', 8, 5, 400],
  ['hold', ['left'], 26],
  ['goto', 7, 5, 400],
  ['hold', ['left'], 26],
  ['goto', 6, 5, 400],
  ['hold', ['left'], 26],
  // The block holds one plate; Link holds the other.
  ['goto', 3, 6, 400],
  ['wait', 60],
  ['tide', 1, 140, 600],
  ['tide', 2, 140, 600],
  ['goto', 7, 3, 900],
  ['goto', 3, 2, 900],
  ['loot', 600],
  ['goto', 7, 1, 900],
  ['exit', 'up', 600],
  ['goto', 7, 3, 1200],
  ['goto', 13, 5, 1200],
  ['exit', 'right', 600],
  ['tide', 0, 140, 600],
  ['goto', 13, 5, 1200],
  ['exit', 'right', 600],
  ['equip', 'sword', 'A', 400],
  ['goto', 7, 9, 2000],
  ['hold', ['down'], 90],

  // ---- back through the Bole Walk and east through the third key door, which
  // is in its east wall: the Grove Crossing is opened from the side the
  // groves let you in on.
  ['goto', 13, 5, 2000],
  ['wait', 30],
  ['hold', ['right'], 20],
  ['tap', 'a', 60],
  ['wait', 60],
  ['hold', ['right'], 60],

  // ---------------------------------------------------------------- d5 0,3,3
  // The Grove Crossing.
  ['fight', 4000, 1500],
  ['loot', 600],
  ['goto', 13, 5, 1500],
  ['hold', ['right'], 90],

  // ---------------------------------------------------------------- d5 0,4,3
  // GROVE 4, the Long Ford, pointed south — the bank is on the far side of the
  // pool from the door, so the throw is set up by walking round the water
  // rather than by standing where you came in. The snarl is in the wall across
  // the room, and the way on is the south hall and the east passage.
  ['fight', 4000, 1500],
  ['loot', 600],
  ['equip', 'reefseed', 'A', 400],
  ['tide', 2, 140, 600],
  ['reefseed', 7, 5, 900],
  ['tide', 0, 140, 600],
  ['equip', 'sword', 'A', 400],
  ['goto', 7, 5, 1500],
  ['wait', 30],
  ['hold', ['down'], 20],
  ['tap', 'a', 60],
  ['wait', 60],
  // Thornvine's door is locked since S142: the Root Ford's key.
  ['goto', 13, 5, 2000],
  ['hold', ['right'], 20],
  ['tap', 'a', 60],
  ['dialogue', 300],
  ['hold', ['right'], 90],

  // ---------------------------------------------------------------- d5 0,5,3
  // Thornvine, the Shrine's miniboss, and the north arch it is holding shut.
  ['boss', 14000, 'thornvine'],
  ['wait', 120],
  ['fight', 4000, 1500],
  ['dialogue', 600],
  ['loot', 900],
  ['goto', 7, 1, 1500],
  ['hold', ['up'], 90],

  // ---------------------------------------------------------------- d5 0,4,2
  // GROVE 5, THE SHRINE FORD, three screens wide, and the fixture built twice
  // over because the snarl is out of range of any bank. The first stake is
  // thrown at HIGH from dry ground; the second is thrown at LOW from the
  // first, which means standing on something that did not exist when it was
  // thrown and will not be there if the sea is let back up.
  //
  // NOTHING IS FOUGHT IN THIS ROOM: a `fight` here walks the whole of it
  // after a keese.
  ['equip', 'reefseed', 'A', 400],
  ['tide', 2, 140, 600],
  ['reefseed', 21, 5, 900],
  ['tide', 0, 140, 600],
  ['reefseed', 19, 5, 1200],
  ['equip', 'sword', 'A', 400],
  ['goto', 19, 5, 1500],
  ['wait', 30],
  ['hold', ['left'], 20],
  ['tap', 'a', 60],
  ['wait', 60],
  ['goto', 12, 5, 2000],
  ['wait', 30],
  ['hold', ['up'], 20],
  ['tap', 'a', 60],
  ['dialogue', 600],
  ['loot', 1200],
  ['dialogue', 600],
  ['goto', 1, 5, 1500],
  ['hold', ['left'], 90],

  // ---------------------------------------------------------------- d5 0,3,2
  // Rootmaw Arch. THE SEA IS LEFT AT LOW THROUGH THE BOSS DOOR, and that is
  // the fight: Rootmaw drinks and heals at HIGH and his roots are bared and
  // soft at LOW, and the arena pins whatever level is carried into it.
  ['fight', 4000, 1500],
  ['goto', 7, 1, 1500],
  ['wait', 30],
  ['hold', ['up'], 24],
  ['tap', 'a', 40],
  ['dialogue', 400],
  ['hold', ['up'], 60],
  ['wait', 120],

  // ---------------------------------------------------------------- d5 0,3,1
  // ROOTMAW, THE DROWNED WOOD, and the fifth Essence, which stands at 7,4 in
  // an Oracle arena: walk onto it and wait out the pose before the loot.
  ['boss', 24000, null],
  ['wait', 240],
  ['goto', 7, 4, 900],
  ['dialogue', 900],
  ['wait', 240],
  ['dialogue', 900],
  ['loot', 1200],
  ['dialogue', 900],
  ['wait', 240],

  // ======================================================================
  // OUT OF THE SHRINE, ROUND THE COASTWISE CHAIN, AND DOWN TO THE KEEP
  // ======================================================================
  //
  // The arena is a dead end with one door, so the first step out of it is by
  // hand. The sea goes to LOW before anything else: every stake the run grew
  // is ground at LOW and a wall at MID, and the way home crosses three of
  // them.
  ['goto', 7, 9, 1200],
  ['hold', ['down'], 60],
  ['wait', 90],
  ['tide', 0, 140, 600],
  ['travel', 4, 2, 6000],
  ['travel', 5, 3, 6000],
  ['travel', 4, 3, 6000],
  ['travel', 3, 3, 6000],
  ['fight', 3000, 1200],
  ['loot', 600],
  ['travel', 2, 3, 6000],
  ['travel', 1, 3, 6000],
  ['travel', 1, 4, 6000],
  ['travel', 2, 4, 6000],
  ['travel', 2, 5, 6000],
  ['travel', 3, 5, 6000],
  ['fight', 3000, 1200],
  ['loot', 600],
  ['travel', 3, 6, 6000],
  ['fight', 3000, 1200],
  ['loot', 600],
  ['travel', 3, 7, 6000],
  ['goto', 7, 9, 1200],
  ['hold', ['down'], 90],
  ['wait', 120],

  // ---------------------------------------------------- THE COASTWISE CHAIN
  //
  // Twelve links, in stage order, and the order zig-zags the whole map on
  // purpose: `houseNets` (off `0,4,8`), `0,4,8`, `0,5,8`, `0,5,7`, `0,8,9`,
  // `0,9,8`, `0,9,5`, `0,5,5`, `0,1,9`, `0,4,9`, `houseNets` again, and
  // `houseMaku` (off `0,4,7`). Fifty screens of walking, and the Rod that
  // comes out of the far end is the Abyssal Keep's key — the Keep's gate reads
  // `makuOpenedKeep`, which only the Maku Tree's second beat sets, and the
  // Keep's own Colonnade is sealed behind a grate only the Rod retracts.
  //
  // FOUR RULES THIS LEG WAS BUILT OUT OF, each of them paid for once:
  //
  //   * TRADE FIRST, FIGHT SECOND, on a town screen. A `fight` leaves the
  //     actor wherever the chase ended, and Sandpiper Row's fisherman wanders:
  //     with a crab still alive the actor finished the chase on the far side
  //     of him, and all four sides of the link came back "no path". Arriving
  //     and trading immediately is reliable.
  //   * THE TOUR IS WALKED, NOT FOUGHT. The first cut swung at everything it
  //     met and reached the Keep on 4 of 44 quarter-hearts; crossing without
  //     stopping reaches it on 6, because `dFight` roams a whole screen after
  //     one crab and takes contact damage the whole time. `loot` still runs
  //     after every hop: what the dungeons dropped on the way out is worth
  //     picking up, and it costs nothing when there is nothing there.
  //   * ONE SCREEN PER DIRECTIVE. `bfsScreens` models an edge between any two
  //     adjacent screens that exist and learns the blocked ones by trying
  //     them, which on this coast means swimming. A three-screen `travel` off
  //     Coral Hollow walked west into the Reef Wall, off the map's edge, and
  //     drowned; the same `travel` one screen at a time costs nothing.
  //   * A SEAM THE PATHFINDER WILL NOT PLAN IS NAMED BY HAND. Three of them
  //     on this tour: Sandbar Run's south edge is a chasm, and `findPath` has
  //     no hop in it, so the gap is crossed by holding `down` at 4,5; Sunken
  //     Reef's cave mouth sits in the middle of the row the shortest path
  //     west uses, so both crossings of that screen are steered down onto
  //     row 4 first; and Bog Causeway's southern lobe is a trap its own
  //     comment in the D3 leg already describes, so the marsh is entered and
  //     left through Sanctum Mouth's north seam at `0,1,7`.
  ['travel', 5, 5, 4000], ['loot', 600],
  ['travel', 5, 6, 4000], ['loot', 600],
  ['travel', 5, 7, 4000], ['loot', 600],
  ['travel', 4, 7, 4000], ['loot', 600],
  ['travel', 4, 8, 4000], ['loot', 600],
  // LINK 1 — Ossa the net-mender, indoors off Village Shore. Her door is at
  // 3,5 and her house's own way out is the tile at 5,6, so stepping onto it
  // IS the exit: an `exit` directive after it walks out of the village screen
  // as well and lands the run one screen south of the link it wants next.
  ['goto', 3, 5, 900],
  ['wait', 90],
  ['trade', 1, 1200],
  ['goto', 5, 6, 600],
  ['wait', 90],
  // LINK 2 — Pell, on the shore outside her door.
  ['trade', 2, 1200],
  ['travel', 5, 8, 4000], ['loot', 600],
  ['trade', 3, 1200],
  ['travel', 5, 7, 4000],
  ['trade', 4, 1200],
  ['travel', 6, 7, 4000], ['loot', 600],
  ['goto', 1, 4, 1500],
  // THE KILNSHELL, AND IT IS FETCHED HERE BECAUSE THE RUN IS ALREADY STANDING
  // ON THE DOORSTEP. Sunken Reef's cave mouth at 4,2 is the tile this leg has
  // always had to steer AROUND — it sits in the middle of the row every
  // westward path picks — so the one thing the route did with this cave was
  // avoid walking into it by accident. What is inside it is the game's only
  // fire: a cockle you set down alight, and the only way anything in the world
  // lights a torch. Nothing before the Abyssal Keep needed one, which is why
  // no run had ever opened this chest; the Keep's Black Kiln is four torches
  // round a Small Key, and without the shell that key does not exist and the
  // dungeon's fourth lock never opens.
  ['goto', 4, 4, 1500],
  ['goto', 4, 3, 900],
  ['hold', ['up'], 60],
  ['wait', 120],
  ['goto', 7, 6, 1200],
  ['hold', ['up'], 24],
  ['tap', 'a', 30],
  ['dialogue', 600],
  ['wait', 240],
  ['goto', 5, 6, 900],
  ['wait', 120],
  ['goto', 4, 4, 1500],
  ['goto', 8, 4, 1500],
  ['travel', 7, 7, 4000], ['loot', 600],
  ['travel', 8, 7, 4000], ['loot', 600],
  ['travel', 8, 8, 4000], ['loot', 600],
  ['travel', 8, 9, 4000], ['loot', 600],
  ['trade', 5, 1200],
  ['travel', 9, 9, 4000], ['loot', 600],
  // LINK 6 — Sennit, on Sandpiper Row. The crab on this screen is left alive
  // until the deal is done; see the first rule above.
  ['travel', 9, 8, 4000],
  ['trade', 6, 1200],
  ['loot', 600],
  ['travel', 9, 7, 4000], ['loot', 600],
  ['travel', 9, 6, 4000], ['loot', 600],
  ['travel', 9, 5, 4000], ['loot', 600],
  ['trade', 7, 1200],
  // BACK WEST ALONG ROW 7, because rows 5 and 6 do not join the wood at all:
  // Reef Wall is walled along its whole west edge and North Dunes is treelined
  // along its whole north edge. The chasm across Sandbar Run's foot is the
  // hand-named seam — walk onto row 5 and hold `down`, and the hop fires.
  ['travel', 9, 6, 4000],
  ['goto', 4, 5, 1500],
  ['hold', ['down'], 70],
  ['wait', 60],
  ['loot', 600],
  ['travel', 8, 7, 4000], ['loot', 600],
  ['travel', 7, 7, 4000], ['loot', 600],
  ['travel', 6, 7, 4000], ['loot', 600],
  ['goto', 8, 4, 1500],
  ['goto', 1, 4, 1500],
  ['travel', 5, 7, 4000], ['loot', 600],
  ['travel', 5, 6, 4000], ['loot', 600],
  ['travel', 5, 5, 4000],
  // Clear the wisp first (S138). It hangs at the trader's feet ringing the
  // square with shots, and on a clock a few hundred frames later than the
  // one this was routed on, the press loop never got a word in. Cut down
  // from the side it costs nothing.
  ['fight', 900],
  ['trade', 8, 1200],
  ['loot', 600],
  ['travel', 5, 6, 4000], ['loot', 600],
  ['travel', 5, 7, 4000], ['loot', 600],
  ['travel', 4, 7, 4000], ['loot', 600],
  ['travel', 4, 8, 4000], ['loot', 600],
  // SHELL BEACH IS WHERE THE TOUR IS PAID FOR. The screen's north-east pocket
  // holds the west coast's fairy, and the `loot` after this hop is what takes
  // it — a placed pickup is an ordinary drop as far as the sweep is concerned,
  // so no directive of its own is needed and none should be added. What DOES
  // matter is that the `loot` stays: without it the run walks past a full heal
  // and arrives at the Keep on six of forty-four. Measured: 16 in, 40 out.
  ['travel', 3, 8, 4000], ['loot', 600],
  ['travel', 3, 7, 4000], ['loot', 600],
  ['travel', 2, 7, 4000], ['loot', 600],
  ['travel', 1, 7, 4000], ['loot', 600],
  ['travel', 1, 8, 4000], ['loot', 600],
  ['travel', 1, 9, 4000],
  ['trade', 9, 1200],
  ['loot', 600],
  ['travel', 1, 8, 4000], ['loot', 600],
  ['travel', 1, 7, 4000], ['loot', 600],
  ['travel', 2, 7, 4000], ['loot', 600],
  ['travel', 3, 7, 4000], ['loot', 600],
  ['travel', 3, 8, 4000], ['loot', 600],
  ['travel', 4, 8, 4000], ['loot', 600],
  // LINK 10 — Teel, at the Fishing Stones, and the kettle comes back out of
  // the chain here.
  ['travel', 4, 9, 4000],
  ['trade', 10, 1200],
  ['loot', 600],
  ['travel', 4, 8, 4000], ['loot', 600],
  ['goto', 3, 5, 900],
  ['wait', 90],
  ['trade', 11, 1200],
  ['goto', 5, 6, 600],
  ['wait', 90],
  ['travel', 4, 7, 4000], ['loot', 600],
  ['goto', 4, 1, 900],
  ['wait', 90],
  // LINK 12 — THE MAKU TREE, AND SHE IS TWO CONVERSATIONS, NOT ONE. The first
  // takes the Bell-Rope and gives the Resonance Rod. The second is a different
  // beat on the same entity: at five Essences she grants the level-3 blade and
  // sets `makuOpenedKeep`, which is the only thing in the game that opens the
  // road down to the Abyssal Keep. `MakuTree.interact` will not run both in
  // one visit — the first beat comes first, by design — so the run steps back
  // from her, faces her again and talks a second time.
  ['trade', 12, 2000],
  ['dialogue', 600],
  ['wait', 120],
  ['goto', 4, 3, 900],
  ['hold', ['up'], 20],
  ['tap', 'a', 60],
  ['dialogue', 1800],
  ['wait', 300],
  ['tap', 'a', 60],
  ['dialogue', 1800],
  ['wait', 300],
  ['goto', 5, 6, 600],
  ['wait', 90],
  // ------------------------------------------------------------ TO THE KEEP
  //
  // North out of the village, west along the line this run already walked to
  // the Cliffside Cistern, and then straight down the Kell: Upper Kell and the
  // Abyss Stair both carry the keep seal across their whole width, and the run
  // walks through both without stopping because the Maku Tree opened them a
  // minute ago. That is the proof the story gate works — nothing else in the
  // world sets that flag, and nothing before this had ever set it in a run.
  ['travel', 4, 6, 4000], ['loot', 600],
  ['travel', 4, 5, 4000], ['loot', 600],
  ['travel', 4, 4, 4000], ['loot', 600],
  ['travel', 3, 4, 4000], ['loot', 600],
  ['travel', 2, 3, 4000], ['loot', 600],
  ['travel', 2, 2, 4000], ['loot', 600],
  ['travel', 2, 1, 4000], ['loot', 600],
  ['travel', 1, 1, 4000], ['loot', 600],
  ['travel', 1, 0, 4000], ['loot', 600],
  // The Keep's arch is two tiles wide and both halves warp; the darknut on
  // this screen is walked past, not fought.
  ['goto', 4, 3, 1500],
  ['hold', ['up'], 60],
  ['wait', 120],

  // ======================================================================
  // THE ABYSSAL KEEP
  // ======================================================================
  //
  // THE ROD GOES ON B AND STAYS THERE FOR THE WHOLE OF FLOOR 0. This dungeon
  // is garrisoned — darknuts in five of its rooms — and a darknut is
  // `shield: 'all'`, which the swordsman cannot walk round the way it walks
  // round a crab. The game's own answer is the thing the run spent twelve
  // trades getting: `Enemy.hurt` lets a hit through while `rodLock` is
  // running, so every `fight` in the Keep is flagged `{ ring: true }` and the
  // Rod is rung in the middle of it. Nothing is granted by that flag; it is
  // one more button press, on the item the player is holding.
  //
  // AND THE SEA GOES TO MID BEFORE ANY OF IT. The run walks down the Kell at
  // LOW and floor 0 is drawn in `4` — a hole the sea fills — so at LOW the
  // Black Kiln's four corners are four open pits and the Drain Court's block
  // has nowhere to be pushed. Both rooms hold a Small Key, both keys failed
  // silently at LOW with every directive reporting success, and the locked
  // door two rooms later was the first thing that said so.
  ['equip', 'conch', 'B', 400],
  ['tide', 1, 140, 900],
  ['equip', 'rod', 'B', 400],

  // KEY 1 — THE BONE CELL. Two stalfos and a darknut, and the key is in them.
  // Keep Landing on the way is crossed, not cleared: its own reward is one
  // heart and its keese cannot be caught, so a `fight` there burns two
  // thousand frames to earn four quarter-hearts.
  ['travel', 3, 6, 4000],
  ['travel', 4, 6, 4000],
  ['fight', 7000, 2500, { ring: true }],
  ['loot', 900],

  // KEY 2 — DRAIN COURT. Two switches and one block, which is the room's whole
  // argument: the block goes on the far switch and the player stands on the
  // near one. The beamos is a statue and is left alone.
  ['travel', 3, 6, 4000],
  ['travel', 3, 5, 4000],
  ['travel', 4, 5, 4000],
  ['fight', 3000, 900, { ring: true }],
  ['goto', 2, 4, 900],
  ['hold', ['up'], 180],
  ['wait', 60],
  ['goto', 12, 8, 900],
  ['wait', 120],
  ['loot', 900],

  // KEY 3 — THE BLACK KILN, AND THE FIRST FIRE ANYTHING IN THIS GAME HAS LIT.
  // Four torches at the room's four corners. The Kilnshell is set down on the
  // tile the player is facing and is already alight when it lands, so each
  // torch is one step: stand under it, turn, press, press again to take the
  // shell back. THE TURN IS TWO FRAMES AND NOT TWELVE. A longer hold walks the
  // player a tile further in, the shell then lands one tile past the torch,
  // and the flame's reach — half a tile — falls two pixels short. Four torches
  // lit and no key, with every directive reporting success, is what that looks
  // like from the trace.
  ['travel', 3, 5, 4000],
  ['travel', 3, 4, 4000],
  ['travel', 4, 4, 4000],
  ['fight', 3000, 900, { ring: true }],
  ['equip', 'kilnshell', 'B', 400],
  ['goto', 2, 3, 900], ['hold', ['up'], 2],
  ['use', 'kilnshell', 1, 40], ['use', 'kilnshell', 1, 40],
  ['goto', 12, 3, 900], ['hold', ['up'], 2],
  ['use', 'kilnshell', 1, 40], ['use', 'kilnshell', 1, 40],
  ['goto', 2, 7, 900], ['hold', ['down'], 2],
  ['use', 'kilnshell', 1, 40], ['use', 'kilnshell', 1, 40],
  ['goto', 12, 7, 900], ['hold', ['down'], 2],
  ['use', 'kilnshell', 1, 40], ['use', 'kilnshell', 1, 40],
  ['wait', 180],
  ['loot', 900],

  // THE WEST CRYPT'S WHEEL, AND THE FAIRY BEHIND IT. Not optional in practice:
  // the run comes off floor 0's fights in the low twenties and floor 1 opens
  // with a shaft crossing it cannot fight its way out of. The wheel is the
  // Keep's Bellows sill and it is worked at the sea the room is already at.
  //
  // THE SEA GOES TO MID FIRST, and this is not a detail. The crypt's sill is
  // declared `at: 1` and the run walks into the Keep at LOW, so the wheel is
  // drowned on arrival: `GustWheel.drowned` throws the turns away rather than
  // banking them, the fairy is never released, and — the part that actually
  // stopped the run — the crypt's own east doorway is a `0` tile that is not
  // floor at LOW, so the room cannot be left either. One directive, and every
  // directive after it addressed a room the player was not standing in.
  ['travel', 3, 4, 4000],
  ['equip', 'conch', 'B', 400],
  ['tide', 1, 140, 900],
  ['travel', 2, 4, 4000],
  ['equip', 'bellows', 'A', 400],
  ['goto', 8, 4, 1500],
  ['bellows', 5, 4, 2500],
  ['equip', 'sword', 'A', 400],
  ['loot', 900],

  // TWO LOCKS AND THE DREDGE LINE. Three Heights' door is in its own north
  // wall; Keep Lock's is in its east one and the vault is behind it. Keep Lock
  // is CROSSED AND NOT CLEARED — a darknut and a wizzrobe in one room cost
  // twenty-four quarter-hearts to clear and the room holds nothing.
  ['travel', 3, 4, 4000],
  ['goto', 7, 1, 1200],
  ['hold', ['up'], 24],
  ['tap', 'a', 30],
  ['dialogue', 300],
  // AND ONCE MORE. The wizzrobe in this room lands a hit on the approach
  // often enough, and a press made in the hurt flinch opens nothing: the run
  // walked on with the key still in its pocket and three rooms later had no
  // Dredge Line. A second press at an open door only swings the sword.
  ['hold', ['up'], 12],
  ['tap', 'a', 30],
  ['dialogue', 300],
  ['goto', 7, 1, 900],
  ['exit', 'up', 600],
  // THE KEEP LOCK IS CLEARED, NOT CROSSED (S142). At Oracle size it is one
  // open hall, and its knight and wizard stand across every line the run
  // walks through it — three times, out to the Dredge Vault, back, and west
  // to the stair. Cleared once, with the Rod ringing the knight's armour, the
  // room is quiet for the other two passes.
  ['equip', 'rod', 'B', 400],
  ['fight', 6000, 2000, { ring: true }],
  ['wait', 60],
  ['fight', 3000, 1200, { ring: true }],
  ['loot', 900],
  ['equip', 'conch', 'B', 400],
  ['goto', 13, 5, 1500],
  ['hold', ['right'], 24],
  ['tap', 'a', 30],
  ['dialogue', 300],
  ['goto', 13, 5, 900],
  ['exit', 'right', 600],
  ['goto', 7, 6, 1200],
  ['hold', ['up'], 24],
  ['tap', 'a', 30],
  ['dialogue', 600],
  ['wait', 240],
  ['loot', 600],

  // THE SLACK WATER — the teaching room, and the run takes its lesson the way
  // a player would. A flat pan with one silted ring in it and a bell pointing
  // at the ring: drag the line over it on the dry crust and nothing comes up;
  // put one step of sea over it and a Piece of Heart does. Nothing here is
  // needed, which is the point of the room, but the piece is real.
  //
  // THE LINE GOES ON A AND THE CONCH KEEPS B for the rest of the dungeon.
  // Every crossing left in the Keep is a question about where the water is,
  // and a run that has to swap buttons to answer it will swap them wrong.
  ['equip', 'dredge', 'A', 400],
  ['equip', 'conch', 'B', 400],
  ['travel', 5, 3, 4000],
  ['tide', 1, 140, 600],
  ['dredge', 7, 7, 'up', 'fish', 2400],
  ['loot', 900],

  // ------------------------------------------------ THE EAST WING (S142)
  // THE LINE'S EXAMINATION, and the Small Key for the stair is at the end of
  // it. The Draw is the first real crossing (brace on the shelf at LOW) and
  // its cache at MID; the Tally Hall is three seas in one tall room — LOW up
  // to the island, HIGH over the drowned bar, MID for the silt; the Hauling
  // Pit's key sits on a pillar behind a bar and comes home on the line at
  // HIGH. Its plate opens the south door straight back into the Draw.
  ['travel', 6, 3, 4000],
  ['equip', 'sword', 'A', 400],
  ['fight', 3000, 2000],
  ['loot', 900],
  ['equip', 'dredge', 'A', 400],
  ['tide', 0, 140, 900],
  ['dredge', 8, 8, 'right', [11, 8], 2400],
  ['wait', 60],
  ['tide', 1, 140, 900],
  ['dredge', 12, 2, 'up', 'fish', 2400],
  ['loot', 900],
  ['goto', 13, 5, 1500],
  ['exit', 'right', 600],
  ['equip', 'sword', 'A', 400],
  ['fight', 3000, 2000],
  ['loot', 900],
  ['equip', 'dredge', 'A', 400],
  ['tide', 0, 140, 900],
  ['dredge', 7, 16, 'up', [7, 13], 2400],
  ['wait', 60],
  ['tide', 2, 140, 900],
  ['dredge', 9, 12, 'up', [9, 9], 2400],
  ['wait', 60],
  ['tide', 1, 140, 900],
  ['dredge', 11, 3, 'up', 'fish', 2400],
  ['loot', 900],
  ['goto', 1, 5, 1500],
  ['exit', 'left', 600],
  // NO SWEEP HERE until the key is home: the sweep walks at every drop in
  // the room, and the key on the pillar is a drop with a shaft round it.
  ['equip', 'sword', 'A', 400],
  ['fight', 3000, 2000],
  ['equip', 'dredge', 'A', 400],
  ['dredge', 3, 8, 'up', 'fish', 2400],
  ['tide', 2, 140, 900],
  ['dredge', 7, 6, 'up', 'haul', 2400],
  ['wait', 60],
  ['loot', 900],
  ['tide', 1, 140, 900],
  ['goto', 12, 8, 900],
  ['wait', 90],
  ['goto', 7, 9, 900],
  ['exit', 'down', 600],
  ['travel', 5, 3, 4000],

  // UP THE KEEP STAIR, through Keep Lock's west door with the Hauling Pit's
  // key. The warp is the tile at 12,2 and `travel` cannot plan a floor
  // change, so the stair is named by hand like every other one.
  ['travel', 4, 3, 4000],
  ['travel', 3, 3, 4000],
  ['goto', 1, 5, 1500],
  ['hold', ['left'], 24],
  ['tap', 'a', 30],
  ['dialogue', 300],
  ['goto', 1, 5, 900],
  ['exit', 'left', 600],
  ['goto', 12, 2, 1500],
  ['wait', 120],

  // ------------------------------------------------------- THE EAST WING
  // TIDESHADE HALL, FOUGHT AT LOW, and the only 2x2 miniboss arena in the
  // game. The hall is drawn in tide tiles from wall to wall and the shade
  // phases with the water, so the sea brought through the door picks which
  // fight this is: at LOW the floor is dry, the shade's ring is six shots
  // rather than eight, and the swordsman is not swimming while it casts. Its
  // north door opens on the kill and nothing else opens it.
  //
  // `breakContact` IS WHY THIS ROOM IS IN THE RUN AT ALL. The shade chases at
  // 0.95 px/f and takes three quarter-hearts a touch, and the swordsman's
  // standing rule — spend an invulnerability window closing, because free hits
  // are the only free thing in this game — inverts against it: the window is
  // spent closing, the shade is still touching when it runs out, and the next
  // touch lands on the frame the last one stopped protecting. A losing fight
  // is seven contact hits at 46-frame intervals, which is one mistake repeated
  // rather than seven. Measured across eight entry phases, the option takes
  // the worst case from three quarter-hearts left to twelve, and the fight
  // from unaffordable to routine.
  // THE SWORD GOES BACK ON A FIRST, and this one cost the fight eight times
  // over before it was spotted. The Slack Water's lesson leaves the Dredge
  // Line on A and the conch on B for the rest of floor 0 — and `dBoss` presses
  // `slotBit('sword')`, which is NOT A SLOT when the sword is in neither, so
  // it falls back to B and the swordsman fights a miniboss by blowing a conch
  // at it. Every directive reports success; the shade simply never takes a
  // hit. The same trap is waiting in every fight the route enters straight off
  // a leg that re-equipped for a puzzle.
  ['equip', 'sword', 'A', 400],
  ['tide', 0, 140, 900],
  ['travel', 4, 5, 4000],
  ['boss', 9000, 'tideshade', { breakContact: true }],
  ['wait', 180],
  ['loot', 1200],

  // THE MERMAID VAULT, through the door the kill opened: the level-2 Cleats,
  // which are unlimited breath on the seafloor.
  ['goto', 7, 1, 1500],
  ['exit', 'up', 600],
  ['goto', 7, 6, 1500],
  ['hold', ['up'], 24],
  ['tap', 'a', 30],
  ['dialogue', 600],
  ['wait', 180],
  ['loot', 600],

  // THE TWO ARCHES — the Keep's Lens fork, and the first one in the game that
  // is answered by a WALL rather than by a shaft. The vault's own stair is the
  // only way in, which is what makes the fork safe: a wrong guess costs the
  // climb back up and nothing else.
  //
  // THE WEST ARCH IS THE ONE. Both read as the Keep's own wall at the pinned
  // MID and they are the same tile to look at; the west is a `7` lintel, which
  // is masonry below HIGH and open water above it, and the east is plain stone
  // that never opens. The valve is inside the chamber, past the one-way ledge,
  // so the choice is made before it can be checked — which is the whole room.
  //
  // THE HOP LANDS AT 1,5 AND THE CLIMB IS UP COLUMN 1, not column 2: the
  // chamber's escape warp sits at 2,4, and a path that squares the corner
  // walks onto it and is put back in the vault with the valve still unturned.
  ['goto', 3, 8, 1500],
  ['wait', 120],
  ['equip', 'lens', 'B', 400],
  ['goto', 6, 6, 1500],
  ['use', 'lens', 1, 90],
  ['hold', ['left'], 40],
  ['wait', 60],
  ['goto', 3, 5, 1200],
  ['goto', 3, 3, 1200],
  ['hold', ['right'], 24],
  ['tap', 'a', 30],
  ['wait', 240],
  ['goto', 3, 2, 1200],
  ['goto', 3, 1, 1200],
  ['goto', 5, 1, 1200],
  ['goto', 7, 1, 1200],
  ['loot', 600],
  ['goto', 9, 1, 1200],
  ['wait', 180],
  ['equip', 'conch', 'B', 400],

  // Back down the vault's stair, out through the hall, and west. The Dredge
  // Line goes back on A on the way, because the three shaft crossings below
  // expect to find it there.
  ['goto', 7, 9, 1200],
  ['exit', 'down', 600],
  ['travel', 3, 5, 4000],
  ['equip', 'dredge', 'A', 400],

  // ---------------------------------------------- THE COLONNADE OF THE DROWNED
  // THE ONE THING IN THE ABYSSAL KEEP THAT ASKS WHETHER THE PLAYER WENT AND
  // DID THE TRADE. The Coilrope is in an alcove behind a GRATE, a grate is
  // metal, and the only thing in the game that retracts metal is the Resonance
  // Rod the Maku Tree pays out for twelve links of the Coastwise Chain. The
  // ring is radial — no facing, no aim — so it is one press from the floor
  // below the alcove.
  //
  // THE SHADE CELL IS CLEARED ON THE WAY IN, and that is worth more than it
  // looks. The wing crosses this room TWICE and it is a darknut, a wizzrobe
  // and a keese; crossing it cost ten quarter-hearts on the run that measured
  // it, against a clearing that pays the room's own puzzle heart. And A ROOM
  // OUTLIVES THE VISIT — it is built once and kept, entities and all — so the
  // room cleared on the way in is still clear on the way back.
  //
  // THE FIGHT IS ISSUED TWICE, and this is not belt and braces. A wizzrobe
  // spends part of its cycle `hidden`, and the swordsman's own foe list drops
  // a hidden enemy — so a fight whose last live thing blinks out returns
  // reporting a clear room, the puzzle never fires, and the heart never
  // spawns. The second pass catches it.
  //
  // THE ROD IS ALREADY ON B FOR THE COLONNADE'S GRATE, so the ring that opens
  // the darknut's armour costs nothing extra: `Enemy.hurt` lets a hit through
  // while `rodLock` is running, which is the trade's payment spent twice in
  // the same wing.
  ['travel', 2, 5, 4000],
  ['equip', 'sword', 'A', 400],
  ['equip', 'rod', 'B', 400],
  ['fight', 4000, 1200, { ring: true }],
  ['wait', 90],
  ['fight', 4000, 1200, { ring: true }],
  ['wait', 120],
  ['loot', 900],
  ['travel', 2, 4, 4000],
  ['goto', 7, 5, 1500],
  ['use', 'rod', 1, 60],
  ['goto', 7, 3, 1500],
  ['hold', ['up'], 24],
  ['tap', 'a', 30],
  ['dialogue', 600],
  ['wait', 120],
  ['loot', 600],
  // The Dredge Line goes back on A: the three shaft crossings below expect to
  // find it there, and the wing borrowed the button for the Shade Cell.
  ['equip', 'dredge', 'A', 400],
  // AND IT GOES ON, in the MID case, which has two slots by now. The Coilrope
  // adds a tile to every cast and the Keep has four shafts left to throw a
  // line across; a charm that makes the item longer is the Keep rewarding the
  // player for having gone the long way round the coast.
  ['charm', 'coilrope', 'mid', 600],
  ['equip', 'conch', 'B', 400],
  ['travel', 2, 5, 4000],
  ['travel', 3, 5, 4000],

  // ---------------------------------------------------- THE DROWNED STAND
  // CROSSING 1, AT LOW, and the first shaft anything in this game has thrown a
  // line across. The shelf at 3..6,6 wades at LOW and is over your head above
  // it, so the only sea you can brace at is the only sea the room is crossed
  // at — put the water anywhere else and the cast is refused before it starts.
  // The mooring is one tile inside the far bank, so the pull comes to rest on
  // ground rather than in the hole.
  ['travel', 3, 4, 4000],
  ['tide', 0, 140, 900],
  ['dredge', 8, 7, 'up', [8, 4], 2400],
  ['wait', 60],
  ['loot', 600],

  // ---------------------------------------------------- KEY 4, ACROSS A HOLE
  // Keep Crossing has two locked doors and the run arrives holding one key, so
  // the east one is spent first: what is behind it is the fourth key, and the
  // north one is the way on. Get that order wrong and the dungeon is over.
  ['travel', 3, 3, 4000],

  // ---------------------------------------------------- THE SUNKEN BAR
  // CROSSING 2, AT HIGH, and the one the Keep had never been made to play.
  // The route has always taken the Drowned Stand and the Drowned Sill, which
  // are both LOW crossings; this is the room that runs the fixture the other
  // way round, and it holds the Keep's second Piece of Heart.
  //
  // THE BAR IS DOWN AT SLACK AND UP AT FLOOD, and everything in the room
  // follows from that. The lintel at 6,4 is stone at LOW and at MID and open
  // water at HIGH, so the sea has to come UP to get the line across; the
  // cache under 2,1 and 3,1 is fished off a shelf that is over your head at
  // HIGH, so the sea has to go back DOWN to collect it; and the way home is
  // the lintel again. Three tide states, and neither half can be bought at
  // the other's sea. The whole room costs NOTHING — measured: in on twenty,
  // out on twenty.
  ['travel', 2, 3, 4000],
  ['goto', 10, 5, 1500],
  ['tide', 2, 140, 900],
  ['dredge', 10, 5, 'left', [7, 5], 2400],
  ['wait', 60],
  ['tide', 1, 140, 900],
  ['dredge', 5, 3, 'up', 'fish', 2400],
  ['loot', 900],
  ['dredge', 6, 3, 'up', 'fish', 2400],
  ['loot', 900],
  ['tide', 2, 140, 900],
  ['dredge', 7, 5, 'right', [10, 5], 2400],
  ['wait', 60],
  ['goto', 13, 5, 1500],
  ['exit', 'right', 600],

  ['goto', 13, 5, 1500],
  ['hold', ['right'], 24],
  ['tap', 'a', 30],
  ['dialogue', 300],
  ['goto', 13, 5, 900],
  ['exit', 'right', 600],

  // THE DROWNED SILL — CROSSING 3, and the one that asks for both seas. The
  // shelf is braced at LOW, so that is the sea the shaft is crossed at; the
  // cache under the far side only gives up what the water is covering, so the
  // sea has to come up a step to fish it; and the way home is the shelf again,
  // so it has to go back down. Three tide states for one room, and the key is
  // in the middle one.
  ['tide', 0, 140, 900],
  ['dredge', 5, 4, 'right', [8, 4], 2400],
  ['wait', 60],
  // THE SIREN ON THE FAR BANK, AND THE SWORD IS PUT BACK FIRST. This fight has
  // been thrown bare-handed since the leg was written: the Slack Water leaves
  // the Dredge Line on A and the conch on B, and `dBoss`/`dFight` used to fall
  // back to B when the sword was in neither slot — so the swordsman came round
  // the corner and blew a conch at her. It is caught now rather than guessed,
  // and the line goes back on A afterwards because the cache and the way home
  // both want it.
  ['equip', 'sword', 'A', 400],
  ['fight', 2500, 900, { ring: true }],
  ['equip', 'dredge', 'A', 400],
  ['tide', 1, 140, 900],
  ['dredge', 11, 4, 'up', 'fish', 2400],
  ['loot', 900],
  ['tide', 0, 140, 900],
  ['dredge', 8, 4, 'left', [5, 4], 2400],
  ['wait', 60],

  // AND THE NORTH DOOR, with the key the sill gave up.
  ['goto', 1, 5, 900],
  ['exit', 'left', 600],
  ['goto', 7, 1, 1500],
  ['hold', ['up'], 24],
  ['tap', 'a', 30],
  ['dialogue', 300],
  ['goto', 7, 1, 900],
  ['exit', 'up', 600],

  // ---------------------------------------------------- THE KEEP GATE
  // THE LAST FAIRY IN THE GAME, and the run drinks it on the way past. The
  // Keep Gate is the room at the foot of Nereth's stair and it is the only
  // thing to heal on above the West Crypt, two floors and half a dungeon
  // back; the run steps into it on sixteen of forty-four with the Crossed
  // Shafts and the King both still in front of it.
  //
  // IT IS TAKEN ONCE AND IT IS GONE. A room outlives the visit — the Keep Gate
  // is built once and kept — so a pickup collected here does not come back
  // when the run walks through again with the Boss Key, whatever a fresh-room
  // reading of the data would suggest. Measured: sixteen in, twenty-four
  // healed, nothing on the return.
  //
  // KILLING THE ROOM'S WIZZROBE TO SAVE THE RETURN TRIP'S SIX QUARTER-HEARTS
  // WAS MEASURED AND IS WORSE — twice. The two extra fights cost more than the
  // crossing does and, worse, they move every frame downstream of them: the
  // Brinehulk's own arrival and the shafts' casts are all phase-locked to the
  // frame the room was entered on, and the run that saved six quarter-hearts
  // here arrived at the Crossed Shafts on three.
  ['loot', 600],

  // AND THE FIRST CHARM THIS GAME HAS EVER WORN. The Gillcarve came out of the
  // Drowned Wood Shrine and has sat in the satchel ever since, because nothing
  // in this harness could open a case: the scrimshaw is a MENU page and the
  // actor only knew how to drive the item page. Thirty charms exist, every one
  // of them is read somewhere in `src/`, `check-charms.mjs` proves each
  // in-engine — and no run had ever put one on.
  //
  // It goes in the HIGH case, which opened at four Essences, and HIGH is the
  // sea the Crossed Shafts are entered at. It is worn for the rest of the game.
  //
  // WHY NOT THE BARNACLE SKIN, which is the charm this run actually wants —
  // one free hit per ROOM, against a dungeon that costs three quarter-hearts a
  // screen crossed. It is in a chest in the Coral Spire's Cistern Cell, one
  // screen off the route behind a door the route's own switch puzzle already
  // opens, and this file's comment there has said "(skipped, an optional
  // charm)" for the whole life of the route. Fetching it was measured and it
  // LOSES THE RUN, twice over: the two-screen detour shifts every frame
  // downstream, which alone walked the stage-3 trader out from under the press
  // (fixed in `dTrade` — a trader wanders, and the verb used to aim at where
  // one WAS); and wearing it from D2 reshuffles every fight after it, because
  // a free hit is a hit that does not knock you back and does not spend an
  // invulnerability window, which cost Gloomtide — the fight S113 and S114 got
  // to seven wins in ten. The charm is not the problem and neither is that
  // fight; a hundred and seventy thousand frames of recorded route is.
  ['charm', 'gillcarve', 'high', 600],

  // ================= THE CROSSED SHAFTS, AND THE BOSS KEY ==================
  // The only room in the Abyssal Keep that holds both crossings, and the room
  // the whole dungeon has been teaching for. Two screens wide because it has
  // to be: a lintel crossing and a shelf crossing are four tiles each and the
  // islands between them are the room.
  //
  // IN AT HIGH OVER THE BAR, DOWN TO LOW ON THE SHELF. The `7` lintel at 5,2
  // is stone below HIGH, so the first cast only happens at flood; the `3`
  // shelf at 11,5 is braced only at slack, so the second only happens at ebb.
  // The sea that gets you in is the sea that stops you going on, and there is
  // no arrangement of the conch that holds both. The king's own inscription
  // on the near island says so and it is the only one in the Keep that is
  // signed.
  ['equip', 'dredge', 'A', 400],
  ['equip', 'conch', 'B', 400],
  ['goto', 13, 5, 1500],
  ['exit', 'right', 600],
  ['tide', 2, 140, 900],
  ['dredge', 9, 3, 'right', [12, 3], 2400],
  ['wait', 60],
  ['tide', 0, 140, 900],
  ['dredge', 16, 6, 'right', [19, 6], 2400],
  ['wait', 60],

  // THE BRINEHULK, AND THE JOKE THE ROOM IS BUILT ON. Brine dissolves salt:
  // the colossus is armoured at LOW and comes apart at HIGH — and LOW is the
  // only sea the shelf lets you cross on, so you arrive at the one sea it
  // cannot be hurt at. The answer is the conch, and it is the answer the
  // dungeon has been asking for since its first room: put the water back up
  // once you are standing on the far island, and the crust goes soft. Fought
  // at LOW it simply cannot be hurt; fought at HIGH it dies in eight hundred
  // frames for six quarter-hearts.
  ['tide', 2, 140, 900],
  ['equip', 'sword', 'A', 400],
  ['boss', 12000, 'brinehulk', { openRetreat: true }],
  ['wait', 240],

  // THE BOSS KEY. The chest on the far island, and the last locked thing in
  // the game. NO SWEEP FOR DROPS BEFORE IT: the fight scatters them up to the
  // pit column at the island's west edge, a sweep walks into the pit after
  // one, and a fall there puts Link back on the SHELF, the near side of the
  // pits, with no line cast and the chest out of reach (S140, after D5's
  // rebuild moved the fight's clock). The loot after the chest picks up what
  // is on the island.
  ['goto', 22, 5, 1500],
  ['hold', ['up'], 24],
  ['tap', 'a', 30],
  ['dialogue', 600],
  ['wait', 180],
  ['loot', 600],

  // THE COLOSSUS'S HOARD, drunk here and not at the door. Seventeen
  // quarter-hearts of the Keep Gate's fairy were spent getting to this island
  // and the fight on it; what is left would not pay for the King.
  ['goto', 20, 3, 1500],
  ['loot', 1200],

  // AND BACK, which is the same two crossings in reverse and at the same two
  // seas — every crossing in this dungeon carries a mooring on the near side
  // as well, so nothing here is one-way.
  ['equip', 'dredge', 'A', 400],
  ['tide', 0, 140, 900],
  ['dredge', 19, 6, 'left', [16, 6], 2400],
  ['wait', 60],
  ['tide', 2, 140, 900],
  ['dredge', 12, 3, 'left', [9, 3], 2400],
  ['wait', 60],
  ['goto', 5, 5, 1500],
  ['exit', 'left', 600],

  // STEP CLEAR OF THE DOOR BEFORE DOING ANYTHING ELSE. `Game.doorwayPull`
  // reaches a tile either side of a doorway (that is what `check-exits.mjs`
  // asserts, both ways), and sounding the conch here takes a hundred and forty
  // frames during which the player drifts. Land on the east doorway's own tile
  // and the pull puts you straight back into the Crossed Shafts — which is
  // what happened, with the next directive addressing a room the player was no
  // longer standing in.
  ['goto', 11, 5, 1200],

  // ================= NERETH, THE DROWNED KING ==============================

  // THE GREAT LOCK. The boss door is in this room's own north wall and the
  // Boss Key the Brinehulk was keeping is what opens it.
  //
  // THE SEA GOES TO MID BEFORE THE DOOR, and it is the only thing about this
  // fight the route gets to choose. The throne room is `noTide`: it pins
  // itself at whatever sea was carried through the door and Nereth's own
  // phases pin it again after that, so the conch is spent here or not at all.
  // Measured at all three (`tools/measure-boss-combat.mjs d6 --tide=N`): MID
  // is won on twenty-nine quarter-hearts, LOW and HIGH both kill the player
  // at thirty-two. At LOW he is a contact fight the swordsman cannot back out
  // of; at HIGH he is nothing else at all.
  ['equip', 'conch', 'B', 400],
  ['tide', 1, 140, 900],
  ['equip', 'sword', 'A', 400],
  // North, into the Stairhead: at Oracle size the boss door is in the ring,
  // so the chamber that held the stairhead fairy is a room of its own at the
  // foot of the King's stair (S142).
  ['goto', 7, 1, 1500],
  ['exit', 'up', 600],

  // THE STAIRHEAD FAIRY, drunk at the foot of the stair — the last moment in
  // the game where a heal is worth anything. The run climbs the stair on a
  // full bar. The wait is also the King's entry clock (S138: 70..140 all won
  // from the old doorway; re-read it if the fight turns).
  ['goto', 2, 5, 900],
  ['loot', 900],
  // ONE STEP BACK OUT AND IN AGAIN, and it is a re-roll, said plainly. The
  // King is won twelve times in thirteen from this doorway (S142's thirteen
  // seeds), and S142's Shrine rooms moved this run onto the thirteenth: the
  // first four hits land identically and a pixel of drift decides it. No
  // wait before the door changes anything — the fight's clock starts on
  // entry — but a room walked through does. A player who lost would try
  // again; the run is allowed the same.
  ['goto', 7, 9, 900],
  ['exit', 'down', 600],
  ['goto', 7, 1, 900],
  ['exit', 'up', 600],
  ['wait', 95],
  ['goto', 7, 1, 900],
  ['hold', ['up'], 24],
  ['tap', 'a', 30],
  ['dialogue', 600],
  ['exit', 'up', 900],

  // AND THE KING. `nerethIntro` plays on the way in — the first cutscene in
  // the game that has ever fired inside a real run rather than in a shooter —
  // and then the fight is the fight. His shell is pinned by whichever level
  // his current phase wants, which is why `dBoss` reaches for the conch when
  // he locks: `tideEscape` on his spec returns the level doing the locking,
  // and the next step of the cycle is always some other one.
  ['dialogue', 1800],
  ['boss', 20000, null],
  ['wait', 300],
  ['loot', 1200],

  // THE SIXTH ESSENCE. It is not a drop and `loot` will not find it: a boss's
  // death spawns an `essence` entity at the room's own 4,3 after a delay, and
  // it is claimed by WALKING INTO IT. Nothing had ever had to do that in a run
  // before — the five before this were all taken in a shooter.
  ['wait', 240],
  ['goto', 15, 4, 2400],
  ['wait', 240],

  // AND THE ENDING, which chains off the sixth claim (`Game.claimEssence`
  // queues it — S43) and is the last thing in the game. The run sits through
  // it the way a player does: every page turned as it comes, until the game
  // holds its THE END card (S138 — `dialogue` + `wait` only ever got there on
  // timing).
  ['ending', 8000],
  ['wait', 120],
];

/**
 * Where the run ends, and what that now means.
 *
 * IT REACHES THE ABYSSAL KEEP'S MOUTH, holding five Essences and the
 * Resonance Rod. Tidewash Grotto, the Coral Spire, the Bogwater Sanctum, the
 * Cliffside Cistern and the Drowned Wood Shrine, walked in order with nothing
 * granted: every Small Key from all five earned and spent, the Anchor, the
 * Lens, the Bombs, the Kelp-Soled Cleats, the Squall Bellows and the Reefseed
 * all taken out of the chests that hold them, three Heart Containers completed
 * out of pieces found on the way, two minibosses and five bosses beaten in
 * real combat — and then the whole Coastwise Chain walked, all twelve links,
 * and the road down to the Keep opened by the Maku Tree.
 *
 * WHAT THE CHAIN LEG ADDED THAT NO EARLIER LEG COULD CLAIM:
 *
 *   * THE COASTWISE CHAIN HAS BEEN PLAYED. `check-trade.mjs` proved the chain
 *     is a chain and that its links can be talked to; nothing had ever walked
 *     between them in a run that also had to survive the walk. Twelve links,
 *     fifty screens, two of them indoors.
 *   * THE ONE STORY GATE IN THE WORLD OPENS. `makuOpenedKeep` is set by the
 *     Maku Tree's second beat and read by the keep seal across Upper Kell and
 *     the Abyss Stair. Nothing had ever set that flag in a run, so the road
 *     down to the Keep had never been walked at all.
 *   * A TRADER IS TWO CONVERSATIONS. The Maku Tree hands over the Rod and the
 *     level-3 blade on two separate visits, and the route talks to her twice
 *     because `MakuTree.interact` runs the trade first by design.
 *
 * THE TOUR USED TO COST THIRTY-SIX OF FORTY-FOUR QUARTER-HEARTS WITH NOTHING
 * ON IT TO HEAL ON, AND THAT IS CLOSED. The damage is not a fight anywhere; it
 * is two quarter-hearts of contact damage per screen crossed, forty-odd
 * screens, and the run used to step through the Keep's arch on six — a heart
 * and a half, against a boss that takes four a hit. Three route answers were
 * measured and all three were worse: fighting every screen ends on 4, fighting
 * briefly on every screen shoves the actor into doorways it did not mean to
 * enter, and the short way back through the Shrine's Bole Walk starts the tour
 * twenty-two quarter-hearts down. It was a WORLD gap, not a route gap: the
 * world's only fairy was `0,11,3`, out on the far eastern reef, and the whole
 * western half of the map — where the chain does its zig-zagging — had none.
 * Shell Beach (`0,3,8`) now holds one, in the pocket behind the rock at 7,2,
 * on a screen the chain crosses twice and the road to the Cliffs of Kell does
 * not cross at all. The run arrives at the Keep on 30 of 44, and the arrival
 * is asserted rather than printed. DO NOT DROP THE `loot` AFTER THE 3,8 HOP.
 *
 * THREE SEAMS ON THE TOUR THE PATHFINDER WILL NOT PLAN, all named by hand in
 * the leg above: Sandbar Run's chasm, Sunken Reef's cave mouth sitting in the
 * middle of the shortest path west, and Bog Causeway's southern lobe.
 *
 * A narrower `dTravel` gap remains, and is still out of scope: `bfsScreens`
 * plans every route from a wide room's OWN ANCHOR coordinates and models an
 * edge between any two adjacent rooms that exist, whether or not a wall
 * stands between them. It learns blocked edges by trying them, which is
 * enough on the overworld and inside a dungeon floor, but it cannot cross a
 * floor (no `travel` call changes floors), it cannot see a link that is
 * DIAGONAL ONLY, and it cannot plan out of a room with one door.
 */
export const GOAL = {
  essences: [1, 2, 3, 4, 5, 6],
  // The room the run finishes in: the throne room, with Nereth dead, the
  // sixth Essence claimed and the ending playing. This is the end of the
  // game.
  room: 'd6/1,3,0',
  needsVerb: null,
  keysNeeded: 20,
  keysObtainable: 20,
};
