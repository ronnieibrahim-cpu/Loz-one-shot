// Recording plans for tools/replay.mjs.
//
// A plan is the AUTHORING side of a replay, not the replay itself. It says
// where to start and what the actor should try to do; running it produces a
// flat list of button masks, and that list is what gets committed to
// tools/replays/ and played back. Replaying never reads this file.
//
// The distinction matters. If the committed artefact were "walk to tile 8,4"
// then a replay would only prove the pathfinder still works. Because the
// artefact is "hold right for 41 frames, then right+down for 12", a replay
// proves the engine put the player on the same pixel it did last time.
//
// DIRECTIVES
//   ['wait', frames]                 nothing pressed
//   ['hold', ['right','down'], n]    hold these buttons for n frames
//   ['tap', 'a', gap]                one frame of a, then `gap` idle (default 4)
//   ['goto', tx, ty, maxFrames]      walk to a tile, pathfinding around walls
//   ['exit', 'right', maxFrames]     hold a direction until the room changes
//   ['fight', maxFrames]             close on enemies and swing until clear
//
// `goto` re-plans when it stops making progress, so it copes with being shoved
// by an enemy, but it is not a solver: it cannot open a door, flip a switch or
// decide to change the tide. Anything that needs a decision is written out as
// explicit directives below.

export const PLANS = {

  // -------------------------------------------------------------------------
  // A walk across the village.
  //
  // Deliberately the *cheap* replay: a few thousand frames, no combat, no
  // dungeon state. It exists to fail fast and fail legibly. Three wandering
  // NPCs are drawing from the room stream on a fixed cadence the whole time,
  // so anything that perturbs the order of random draws — an entity spawned in
  // a different order, a room re-entered without its stream being rebuilt —
  // shows up here as a position mismatch long before the long replay finishes.
  //
  // It also crosses a room boundary twice, which is where fixed-point rounding
  // will bite when P3 lands: an entity crossing x=0 is exactly the case `| 0`
  // gets wrong, and it happens on every transition.
  // -------------------------------------------------------------------------
  'village-walk': {
    note: 'Tidewatch Village, east into Village East and back, past three wandering NPCs',
    setup: {
      seed: 20260806,
      playerName: 'LINK',
      items: { sword: 1, conch: 1, shield: 1 },
      equipB: 'sword',
      equipA: 'conch',
      tide: 1,
      enter: ['overworld', 0, 4, 7, 72, 64, 'down'],
    },
    steps: [
      ['wait', 30],
      // West along the open row below the ledge run, to the sign.
      ['goto', 2, 4, 300],
      ['wait', 20],
      // Down past the bushes and along the bottom of the village.
      ['goto', 2, 6, 300],
      ['goto', 7, 6, 400],
      // Back up into the square and across to the east side.
      ['goto', 8, 4, 400],
      ['wait', 40],
      // Out east into Village East, then straight back. Two seams, two
      // reconcileWithTide calls, two chances to land on a different pixel.
      ['exit', 'right', 300],
      ['goto', 3, 4, 400],
      ['wait', 30],
      ['exit', 'left', 300],
      ['goto', 4, 4, 400],
      ['wait', 60],
    ],
  },

  // -------------------------------------------------------------------------
  // Tide Steps: one room, two tide levels, walked end to end.
  //
  // This is the proof that the tide is a field and not a global. The room
  // (overworld 0,10,0) has two tide bands with different thresholds:
  //
  //     ##########
  //     #gg8888gg#     rows 1-2   `8` tideRock  dry, dry, SHALLOW
  //     gg.8888.gg
  //     gg......gg
  //     gg.6666.gg     rows 4-5   `6` reefFlat  dry, shallow, DEEP
  //     ggg6666ggg
  //     #gggggggg#
  //     ###gggg###
  //
  // At HIGH the `6` band drowns and column 4 is impassable — verified, not
  // assumed: tools/test.mjs asserts that tile straight up the middle is DEEP at
  // HIGH with no anchor down. So the run throws the Anchor into the `6` band
  // while the tide is MID, blows the conch to HIGH, and walks straight north up
  // column 4 through water the conch has left behind and water it has raised.
  //
  // THE WALK IS NOT THE ASSERTION. A successful traversal would also happen in
  // a room held uniformly at MID, which would prove nothing at all. The setup
  // names two probe tiles, one inside the held patch and one outside it, and
  // every checkpoint records both what the engine believes the level is there
  // AND a hash of how that tile is actually drawn. The claim — two different
  // levels, in the same frame, in the same room, on screen — is a number the
  // harness can fail on.
  //
  // The probes are chosen either side of the patch edge: the anchor lands at
  // (4,4) and holds a square of radius 2, so (4,5) is inside it and (4,1) is
  // two rows clear of it. That margin is the reason the radius is 2 and not 3:
  // at 3 the patch would reach row 1, both bands would freeze together, and
  // this replay would pass while proving nothing.
  // -------------------------------------------------------------------------
  'tide-steps-split': {
    note: 'Tide Steps: anchor the reef flat at MID, raise the sea to HIGH, and walk '
      + 'north through both levels at once',
    setup: {
      seed: 20260806,
      playerName: 'LINK',
      items: { sword: 1, conch: 1, shield: 1, anchor: 1 },
      equipB: 'anchor',
      equipA: 'conch',
      tide: 1,
      enter: ['overworld', 0, 10, 0, 64, 104, 'up'],
      probes: [[4, 5], [4, 1]],
    },
    steps: [
      ['wait', 30],
      // Throw it north into the reef flat. It lands at (4,4) and bites at MID.
      ['tap', 'b', 60],
      ['wait', 30],
      // Conch: MID -> HIGH. Everything the anchor is not holding floods.
      ['tap', 'a', 120],
      ['wait', 40],
      // Straight up column 4. A `goto` would pathfind around the middle by the
      // dry columns at the room's edges and the run would prove nothing about
      // the held band; a held direction has to cross it. 100 frames at 1px/f
      // covers the 88px from the south row to the north one.
      ['hold', ['up'], 100],
      ['wait', 40],
      // ...and back down through it.
      ['hold', ['down'], 100],
      ['wait', 30],
      // Recall. The band drowns again behind us.
      ['tap', 'b', 60],
      ['wait', 60],
    ],
  },

  // -------------------------------------------------------------------------
  // Tidewash Grotto, entrance to the north half.
  //
  // The long one: eleven room entries, twenty-one kills, a chest, a pickup, a
  // Small Key earned and spent, and the conch taken all the way round. Every
  // room entry rebuilds the room stream, every kill rolls a drop table, and
  // every drop walked over changes the save — so one misordered random draw
  // anywhere in four thousand frames lands as a mismatched rupee count at the
  // end, and the checkpoint trail says which frame it happened on.
  //
  // IT IS NOT A FULL CLEAR, and the name says so. It stops in Held Water, the
  // first room past the locked door — which since P8 re-authored the grotto is
  // also the first room whose way on is the Tidewright's Anchor and nothing
  // else. The actor cannot throw one, so the route ends exactly where the
  // dungeon stops being walkable; see docs/NEXT-SESSION.md for the verbs it is
  // missing.
  // -------------------------------------------------------------------------
  'd1-descent': {
    note: 'Tidewash Grotto: entrance to the north-half door — fighting through, '
      + 'the Dungeon Map, the first Small Key spent on a locked door, and a full tide cycle',
    setup: {
      seed: 20260806,
      playerName: 'LINK',
      items: { sword: 1, conch: 1, shield: 1 },
      equipB: 'sword',
      equipA: 'conch',
      // Five hearts, not the three a real run starts on. The recorder's
      // swordsman lines up on one axis, swings, and stands still for the length
      // of the swing; against enemies that walk the 8px lattice and commit to a
      // whole step it eats about 60% more contact damage than it did against
      // the old floating drift, and on three hearts it dies in the Crab Pit.
      // A human reads a committed step and steps out of it — that is the point
      // of the lattice — but the actor cannot, and this replay exists to prove
      // the engine is deterministic, not to prove the game is beatable on three
      // hearts. Do not read the headroom as a difficulty statement.
      maxHearts: 20,
      hearts: 20,
      tide: 1,
      enter: ['d1', 0, 3, 7, 64, 96, 'up'],
    },
    steps: [
      ['wait', 20],
      // 3,7 Grotto Mouth -> 3,6 Drowned Landing. Two crabs.
      ['goto', 4, 1, 400],
      ['exit', 'up', 400],
      ['fight', 1200],
      ['dialogue', 200],
      // -> 3,5 Sunken Hall, the hub. Three more.
      ['goto', 4, 1, 600],
      ['exit', 'up', 400],
      ['fight', 1400],
      ['dialogue', 200],
      // West into 2,5 Map Alcove. The Dungeon Map is a loose pickup, so
      // walking over it is enough. The keese in there gets left alive on
      // purpose — an enemy still running when the room is left is a room whose
      // stream has to be rebuilt correctly when it is re-entered.
      ['goto', 1, 3, 400],
      ['exit', 'left', 400],
      ['goto', 4, 3, 500],
      ['dialogue', 200],
      ['fight', 900],
      ['wait', 40],
      ['goto', 8, 3, 400],
      ['exit', 'right', 400],
      // Back through the hub and east into 4,5 Chart Alcove. The chest needs
      // an A press with the player stood square below it and facing up. The
      // Chartstone IS collected now: P8 moved the pots below the chest, so the
      // tile the prize lands on is floor rather than a solid pot. That bug ate
      // the old Compass for the whole life of the room.
      ['fight', 900],
      ['goto', 8, 3, 500],
      ['exit', 'right', 400],
      ['fight', 900],
      ['goto', 4, 4, 500],
      ['hold', ['up'], 6],
      ['tap', 'a', 30],
      ['dialogue', 300],
      ['goto', 4, 2, 300],
      ['wait', 60],
      // Back west into the hub, and cycle the conch all the way round on plain
      // floor: LOW, HIGH and back to MID. Each press freezes the player, wipes
      // the room and reconciles them against terrain that has just changed
      // under their feet.
      ['goto', 1, 3, 400],
      ['exit', 'left', 400],
      ['fight', 900],
      ['goto', 4, 3, 400],
      ['tap', 'a', 110],
      ['tap', 'a', 110],
      ['tap', 'a', 110],
      ['dialogue', 200],
      // North into 3,4 Tide Gallery.
      ['goto', 4, 1, 600],
      ['exit', 'up', 400],
      ['fight', 1200],
      ['dialogue', 200],
      // West into 2,4 Crab Pit. Clearing it is the puzzle and the reward is
      // the first Small Key.
      ['goto', 1, 3, 400],
      ['exit', 'left', 400],
      ['fight', 1800],
      ['dialogue', 300],
      // Sweep the reward tile VERTICALLY rather than stopping on it.
      //
      // A dropped pickup pops upward and stays up: `PICKUP_POP_SPEED` against
      // `PICKUP_GRAVITY` over `PICKUP_SETTLE_FRAMES` nets about five pixels of
      // rise and nothing brings it back down, so a key spawned at tile (4,3)
      // comes to rest straddling the tile above. Standing on (4,3) leaves a
      // one-pixel overlap with its rect — and one pixel is close enough to
      // miss. Missing it loses the Small Key silently: the locked door never
      // opens, and every directive after it is addressed to a room the player
      // never reached, while the recording stays perfectly valid.
      ['goto', 4, 3, 400],
      ['goto', 4, 2, 200],
      ['goto', 4, 3, 200],
      ['wait', 60],
      ['goto', 8, 3, 400],
      ['exit', 'right', 400],
      // Spend it on the door in the middle of 3,4's north wall. Walk into the
      // door until it stops you, rather than a computed number of frames of
      // `up`: the door is solid until it is unlocked, so holding long enough
      // pins the player flush against it from wherever `goto` left him.
      ['fight', 900],
      ['goto', 4, 3, 500],
      ['hold', ['up'], 24],
      ['tap', 'a', 30],
      ['dialogue', 300],
      ['goto', 4, 1, 500],
      ['exit', 'up', 400],
      // 3,3 Held Water. The route on is the '4' shelf and the '3' gate above
      // it, and there is no tide level that walks both — this is where the
      // actor runs out of verbs. Clear the room and stop.
      ['fight', 1800],
      ['dialogue', 200],
      ['wait', 60],
    ],
  },
};
