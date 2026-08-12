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
  // The Iron Pipe: a D1 anchor gate, crossed in the engine.
  //
  // tools/check-anchor.mjs proves this corridor is impassable with the conch
  // alone and passable with one anchor placement, but it proves it against a
  // MODEL of walking, hopping and sounding the conch. This is the same claim
  // made by the game itself: a live player, the real throw arc, the real patch,
  // the real sweep of the tide.
  //
  // The route is exactly the solution the prover printed. Stand on the dry tile
  // at the corridor's mouth with the sea at LOW, throw the iron east — its arc
  // puts it two tiles in, and the patch of radius 2 then covers the mouth and
  // all four wells and stops one tile short of the first drain. Sound the conch
  // to MID: the wells stay ankle deep under the iron while the drains ahead
  // fill. Then hold `right` and walk the whole thing.
  //
  // The probes are the point of the assertion: (2,3) is a well inside the patch
  // and reads LOW, (7,3) is a drain outside it and reads MID, in the same frame
  // of the same room. Hold `right` rather than `goto` — a pathfinder that found
  // a way round would make this replay pass while proving nothing, and there is
  // no way round, which is the whole design of the room.
  // -------------------------------------------------------------------------
  'd1-sluicegate': {
    note: 'The Iron Pipe: freeze the wells at LOW, raise the sea to MID, and walk '
      + 'a corridor no setting of the conch crosses',
    setup: {
      seed: 20260806,
      playerName: 'LINK',
      items: { sword: 1, conch: 1, shield: 1, anchor: 1 },
      equipB: 'anchor',
      equipA: 'conch',
      tide: 0,
      enter: ['d1', 0, 4, 2, 0, 48, 'right'],
      probes: [[2, 3], [7, 3]],
    },
    steps: [
      ['wait', 30],
      // Throw it east. It bites two tiles in, at LOW, and holds the wells.
      ['tap', 'b', 60],
      ['wait', 40],
      // Conch: LOW -> MID. Everything the iron is not holding fills up.
      ['tap', 'a', 120],
      ['wait', 40],
      // Straight down the pipe. 130 frames at 1px/f is eight tiles and change,
      // which clears the drains and stops short of the seam — arriving in the
      // next room would end the run in a room this plan says nothing about.
      ['hold', ['right'], 130],
      ['wait', 40],
    ],
  },

  // -------------------------------------------------------------------------
  // Tidewash Grotto, entrance to the north half.
  //
  // The long one: eleven room entries, a chest, two pickups, a Small Key earned
  // and spent, and the conch taken round to LOW and back. Every room entry
  // rebuilds the room stream, every kill rolls a drop table, and every drop
  // walked over changes the save — so one misordered random draw anywhere in
  // four thousand frames lands as a mismatched rupee count at the end, and the
  // checkpoint trail says which frame it happened on.
  //
  // IT IS NOT A FULL CLEAR, and the name says so. It stops at the locked door
  // in 3,3's north wall, which is where P8 put the Anchor's own room. Past that
  // point every room is an anchor room, and an actor with three verbs — walk,
  // open, swing — cannot aim a throw at a tile and then sound the conch in the
  // right order. `d1-sluicegate` above is the scripted stand-in for that.
  //
  // REWRITTEN FOR THE P8 LAYOUT. The route is the same spine, but the rooms on
  // it are not the rooms the previous recording walked: 3,6 is now a floor of
  // wells that has to be taken down to LOW before it can be crossed at all,
  // the Chartstone is in 4,5 rather than the Compass, and the Small Key falls
  // in 2,4. The frame counts below are therefore not comparable with the
  // pre-P8 recording — nothing about movement changed, but the world did.
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
      // 3,7 the mouth. Take the sea down to LOW before going anywhere: the room
      // north of here is a floor of wells and there is no walking round it. The
      // conch cycles UP and wraps, so MID -> HIGH -> LOW is two presses, and
      // both are made from dry stone in the middle of the room rather than from
      // one of the two pools, which HIGH would turn into deep water underfoot.
      ['goto', 4, 6, 400],
      ['tap', 'a', 120],
      ['tap', 'a', 120],
      ['dialogue', 200],
      ['goto', 4, 1, 400],
      ['exit', 'up', 400],
      // 3,6 The Drinking Floor, waded at LOW. Two crabs and a keese.
      ['fight', 1400],
      ['dialogue', 200],
      ['goto', 4, 1, 800],
      ['exit', 'up', 400],
      // 3,5 the hub. A zol, a crab, and a switch puzzle left unsolved — the
      // actor has no push verb, and a puzzle that stays unsolved is a room whose
      // reward must NOT appear, which is worth asserting too.
      ['fight', 1400],
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
      // East wing: the Chartstone. It needs an A press with the player stood
      // square below the chest and facing up. Unlike the Compass this replaced,
      // the tile the pickup pops onto is floor, so it is actually collectable —
      // the pre-P8 room dropped it onto a pot and lost it, which is the content
      // bug written up in docs/HANDOFF.md and fixed by re-authoring the room.
      ['fight', 900],
      ['goto', 8, 3, 500],
      ['exit', 'right', 400],
      ['fight', 900],
      ['goto', 5, 4, 500],
      ['hold', ['up'], 24],
      ['tap', 'a', 30],
      ['dialogue', 300],
      ['goto', 5, 2, 300],
      ['wait', 60],
      ['goto', 1, 3, 400],
      ['exit', 'left', 400],
      // Back up the spine into 3,4. The hub respawns its pair every time it is
      // re-entered, so it gets cleared every time too.
      ['fight', 1400],
      ['goto', 4, 1, 600],
      ['exit', 'up', 400],
      ['fight', 1200],
      ['dialogue', 200],
      // West into the crab room. Clearing it is the puzzle, and the reward is
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
      // one-pixel overlap with its rect — and one pixel is close enough to miss.
      // Missing it loses the Small Key silently: the locked door two rooms
      // later never opens, and every directive after it is addressed to a room
      // the player never reached, while the recording stays perfectly valid.
      // Walking up through the tile and back cannot miss it.
      ['goto', 4, 3, 400],
      ['goto', 4, 2, 200],
      ['goto', 4, 3, 200],
      ['wait', 60],
      ['goto', 8, 3, 400],
      ['exit', 'right', 400],
      // Spend it on the door in the middle of 3,4's north wall.
      ['fight', 900],
      ['goto', 4, 3, 500],
      // Walk into the door until it stops you, rather than a computed number of
      // frames of `up`. The door is solid until it is unlocked, so holding long
      // enough pins the player flush against it from wherever `goto` happened
      // to leave him — six frames put him a pixel or two short whenever the
      // approach ended a pixel or two low, and the A press then found nothing.
      ['hold', ['up'], 24],
      ['tap', 'a', 30],
      ['dialogue', 300],
      ['goto', 4, 1, 500],
      ['exit', 'up', 400],
      // 3,3, and the Anchor is through the door in this room's north wall.
      ['fight', 1800],
      ['dialogue', 200],
      ['wait', 60],
    ],
  },
};
