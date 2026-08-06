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
  // Tidewash Grotto, entrance to the north half.
  //
  // The long one: eleven room entries, twenty-one kills, a chest, a pickup, a
  // Small Key earned and spent, and the conch taken all the way round. Every
  // room entry rebuilds the room stream, every kill rolls a drop table, and
  // every drop walked over changes the save — so one misordered random draw
  // anywhere in four thousand frames lands as a mismatched rupee count at the
  // end, and the checkpoint trail says which frame it happened on.
  //
  // IT IS NOT A FULL CLEAR, and the name says so. It stops at the locked door
  // in 3,3's north wall. Everything past that point needs verbs this actor
  // does not have — see docs/NEXT-SESSION.md for what is missing and why the
  // shortest way to a full-clear replay is a push directive, not a better
  // pathfinder.
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
      tide: 1,
      enter: ['d1', 0, 3, 7, 64, 96, 'up'],
    },
    steps: [
      ['wait', 20],
      // 3,7 Entrance -> 3,6 Drowned Landing. Two crabs.
      ['goto', 4, 1, 400],
      ['exit', 'up', 400],
      ['fight', 1200],
      ['dialogue', 200],
      // -> 3,5 the hub. Two more.
      ['goto', 4, 1, 600],
      ['exit', 'up', 400],
      ['fight', 1200],
      ['dialogue', 200],
      // West wing: the Dungeon Map is a loose pickup, so walking over it is
      // enough. A keese is in there and gets left alive on purpose — an enemy
      // still running when the room is left is a room whose stream has to be
      // rebuilt correctly when it is re-entered.
      ['goto', 1, 3, 400],
      ['exit', 'left', 400],
      ['goto', 4, 3, 500],
      ['dialogue', 200],
      ['fight', 900],
      ['wait', 40],
      ['goto', 8, 3, 400],
      ['exit', 'right', 400],
      // East wing: the Compass chest needs an A press with the player stood
      // square below it and facing up. The chest opens; the Compass itself is
      // NOT collected, and cannot be — the pickup settles onto the solid pot
      // above the chest and no standable tile in the room overlaps it. That is
      // a content bug in the room, not a fault in the actor; it is written up
      // in docs/HANDOFF.md. The chest is still worth opening here, because an
      // opened chest is persisted save state and this replay asserts on it.
      ['fight', 900],
      ['goto', 8, 3, 500],
      ['exit', 'right', 400],
      ['fight', 900],
      ['goto', 4, 4, 500],
      ['hold', ['up'], 6],
      ['tap', 'a', 30],
      ['dialogue', 300],
      ['goto', 4, 3, 300],
      ['wait', 60],
      ['goto', 1, 3, 400],
      ['exit', 'left', 400],
      // Back up the spine into 3,4. The hub respawns its pair every time it is
      // re-entered, so it gets cleared every time too.
      ['fight', 900],
      ['goto', 4, 1, 600],
      ['exit', 'up', 400],
      ['fight', 1200],
      ['dialogue', 200],
      // Cycle the conch all the way round on plain floor: LOW, HIGH and back
      // to MID. Each press freezes the player, wipes the room and reconciles
      // them against terrain that has just changed under their feet.
      ['goto', 4, 3, 400],
      ['tap', 'a', 110],
      ['tap', 'a', 110],
      ['tap', 'a', 110],
      ['dialogue', 200],
      // West into the crab room. Clearing it is the puzzle, and the reward is
      // the first Small Key.
      ['goto', 1, 3, 400],
      ['exit', 'left', 400],
      ['fight', 1800],
      ['dialogue', 300],
      ['goto', 4, 3, 400],
      ['wait', 60],
      ['goto', 8, 3, 400],
      ['exit', 'right', 400],
      // Spend it on the door in the middle of 3,4's north wall.
      ['fight', 900],
      ['goto', 4, 3, 500],
      ['hold', ['up'], 6],
      ['tap', 'a', 30],
      ['dialogue', 300],
      ['goto', 4, 1, 500],
      ['exit', 'up', 400],
      // 3,3, the north half. Two zols.
      ['fight', 1800],
      ['dialogue', 200],
      ['wait', 60],
    ],
  },
};
