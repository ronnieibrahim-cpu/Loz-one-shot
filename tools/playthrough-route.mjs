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
// The route now goes as far as the actor-runtime CAN take it: through both
// locked doors to the Sluicegate chest, which hands over the Anchor. See
// `GOAL` below for exactly where and why it stops there rather than at the
// boss.
export const ROUTE = [
  // Title screen, file select, and the intro. Every button here is a real
  // press: this is where the conch and the sword come from.
  ['newgame', 3000],

  // Tidewatch Village to the Grotto Mouth, five screens east and one south.
  // The planner works the way out for itself; see dTravel in actor-runtime.mjs.
  ['travel', 8, 8, 12000],

  // The cave mouth is a warp tile at 4,1 — walking onto it is the whole of
  // entering a dungeon. There is a crab on this screen; it is walked past
  // rather than fought, which is what a player does.
  ['goto', 4, 1, 600],
  ['wait', 60],
  ['dialogue', 200],

  // ---------------------------------------------------------------- d1 0,3,7
  // The Grotto Mouth. Take the sea DOWN to LOW before going anywhere: the room
  // north of here is a floor of wells and there is no walking round it. The
  // conch cycles upward and wraps, so MID -> HIGH -> LOW is two soundings, and
  // both are made from dry stone in the middle of the room rather than from one
  // of the two pools, which HIGH turns into deep water underfoot.
  //
  // `use` rather than `tap`, and this is the difference between a playthrough
  // and a replay: every replay pins `equipA: 'conch'` in its setup and can say
  // "press A". Nothing pinned anything here, so the route names the ITEM and
  // the runtime finds the button — which in a real new game is B.
  ['goto', 4, 6, 400],
  ['use', 'conch', 2, 120],
  ['dialogue', 200],

  // ---------------------------------------------------------------- d1 0,3,6
  // The Drinking Floor, waded at LOW. Two crabs and a keese.
  ['travel', 3, 6, 2000],
  ['fight', 1800],
  ['dialogue', 200],
  ['loot', 500],

  // ---------------------------------------------------------------- d1 0,3,5
  // The Sunken Hall, the hub. A zol and a crab, then a push-block puzzle: two
  // `hold` switches at (1,2) and (8,2), a block sitting one tile south of
  // each. Both blocks pushed at once is what the room actually wants — a
  // pressure switch stays down once weighted, so "at once" here just means
  // "both, in either order" rather than two bodies at the same instant — and
  // the reward is the fairy, the only heal this dungeon offers outright. It
  // was unobtainable before the solid-entity fix landed for the same reason
  // the Switch Room's key was; this is the first route to actually collect it.
  ['travel', 3, 5, 2000],
  ['fight', 1800],
  ['dialogue', 200],
  ['loot', 500],
  ['goto', 1, 4, 400],
  ['hold', ['up'], 100],
  ['goto', 8, 4, 500],
  ['hold', ['up'], 100],
  ['dialogue', 300],
  ['loot', 600],

  // West wing: the Dungeon Map, a loose pickup in the Map Alcove.
  ['travel', 2, 5, 2000],
  ['fight', 1200],
  ['loot', 500],

  // East wing: the Chartstone, in a chest in the Chartstone Alcove. Approached
  // from the south so the chest's own solidity (never read by tryPush's
  // opening path, but very much read by canOccupy now) does not swallow the
  // approach the way it would from any other side.
  ['travel', 4, 5, 2000],
  ['fight', 1200],
  ['loot', 500],
  ['goto', 5, 4, 500],
  ['hold', ['up'], 6],
  ['tap', 'a', 40],
  ['dialogue', 400],
  ['loot', 600],

  // ---------------------------------------------------------------- d1 0,3,4
  // The Tide Gallery. Its north wall is a locked door and so is the Locked
  // Stair's above it, so TWO Small Keys stand between here and the Anchor. One
  // is the Crab Pit's, west; the other is the Switch Room's, east.
  ['travel', 3, 4, 2000],
  ['fight', 1400],
  ['dialogue', 200],
  ['loot', 500],

  // ---------------------------------------------------------------- d1 0,2,4
  // West to the Crab Pit: three shielded crabs, and clearing the room is the
  // puzzle. This is the fight d1-descent's note is about — it is where a
  // scripted swordsman dies on three hearts — and it is why every fight in
  // this route is followed by a sweep for what it dropped.
  ['travel', 2, 4, 2000],
  ['fight', 2400],
  ['dialogue', 300],
  ['loot', 600],

  // ---------------------------------------------------------------- d1 0,4,4
  // East to the Switch Room, for the SECOND key. Its two floor switches are
  // `hold` switches and its puzzle wants both down, so the two blocks have to
  // be pushed onto them — exactly the Sunken Hall's puzzle, one room over.
  ['travel', 3, 4, 2000],
  ['travel', 4, 4, 2000],
  ['fight', 1400],
  ['loot', 500],
  ['goto', 2, 4, 400],
  ['hold', ['up'], 100],
  ['goto', 7, 4, 500],
  ['hold', ['up'], 100],
  ['dialogue', 300],
  ['loot', 600],

  // Back in the Tide Gallery with both keys the dungeon gives up. Spend the
  // first on the north door. Walk into the door until it stops you rather than
  // counting frames: it is solid until it is unlocked, so holding pins the
  // player flush against it from wherever the approach ended.
  ['travel', 3, 4, 2000],
  ['fight', 1400],
  ['loot', 500],
  ['goto', 4, 3, 500],
  ['hold', ['up'], 24],
  ['tap', 'a', 30],
  ['dialogue', 300],
  ['goto', 4, 1, 500],
  ['exit', 'up', 400],

  // ---------------------------------------------------------------- d1 0,3,3
  // The Locked Stair. Two zols, then the second lock — the key the Switch
  // Room gave up — opens the door north to the Sluicegate.
  ['fight', 1800],
  ['dialogue', 200],
  ['loot', 500],
  ['goto', 4, 3, 500],
  ['hold', ['up'], 30],
  ['tap', 'a', 30],
  ['dialogue', 200],
  ['goto', 4, 1, 500],
  ['exit', 'up', 400],

  // ---------------------------------------------------------------- d1 0,3,2
  // The Sluicegate. No enemies — just the big chest holding the Anchor,
  // approached from the north (row 3 is open floor the whole width of the
  // room; the chest sits one row south of it, at the same x).
  //
  // This is where the route stops. Past here every room is gated by the
  // Anchor's OWN verb — sink it on one tile, walk to another, recall it —
  // which needs a tile-precise placement this harness's actor has no verb
  // for. See GOAL below.
  ['goto', 4, 3, 500],
  ['hold', ['down'], 6],
  ['tap', 'a', 40],
  ['dialogue', 400],
  ['loot', 600],
  ['wait', 60],
];

/**
 * Where the run actually stops, and why.
 *
 * The goal of this harness is the Essence of Tidewash Grotto and it does not
 * reach it. Not because the game is unfinishable any more — the solid-entity
 * fix (`0b68e6b`) means every push block in D1 can genuinely be pushed, both
 * Small Keys are obtainable, and this route collects both and walks out with
 * the Anchor — but because everything past the Sluicegate is gated by the
 * Anchor's OWN verb (sink it on a tile, walk elsewhere, recall it) and the
 * actor-runtime has no directive for that: `dUse` presses whichever button an
 * item is on, which is right for a conch sounding or a sword swing and is not
 * enough to place an item at a chosen tile. Building that verb, and proving it
 * against the Iron Pipe / Long Race gate pair and the two anchor-gauge rooms,
 * is real dungeon-specific engineering and belongs to its own session — see
 * docs/NEXT-SESSION.md.
 *
 * So this asserts the furthest point the ACTOR currently allows, which is
 * also, for the first time, the furthest point the WORLD allows short of the
 * Anchor's own puzzles: failing to reach it is a regression in the actor or
 * the route, not a re-confirmation of a game bug.
 */
export const GOAL = {
  essence: 1,
  // The furthest this route drives the actor. Failing to REACH this is a
  // regression; reaching further (once the Anchor-placement verb exists) is
  // the next extension, not a discrepancy to paper over.
  room: 'd1/0,3,2',
  // Not a game blocker — see the comment above. Named here so a future
  // extension of the route knows exactly what capability it is adding.
  needsVerb: 'anchor placement: sink at a chosen tile, walk, recall',
  keysNeeded: 2,
  keysObtainable: 2,
};
