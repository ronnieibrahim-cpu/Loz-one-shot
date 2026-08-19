// The route the beatability test walks. See tools/check-playthrough.mjs for
// what it proves and for the rules the route has to obey.
//
// It is data rather than code so that extending the run to D2 and beyond is an
// edit to a list, and so the harness's assertions do not have to move when the
// route does.

export const SEED = 20260806;

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
  ['goto', 4, 1, 400],
  ['exit', 'up', 400],

  // 0,3,6 The Drinking Floor, waded at LOW. Two crabs and a keese.
  ['fight', 1800],
  ['dialogue', 200],
  ['loot', 500],
  ['goto', 4, 1, 800],
  ['exit', 'up', 400],

  // 0,3,5 the Sunken Hall, the hub. A zol and a crab.
  ['fight', 1800],
  ['dialogue', 200],
  ['loot', 500],

  // West wing: the Dungeon Map is a loose pickup, so walking over it is enough.
  ['goto', 1, 3, 400],
  ['exit', 'left', 400],
  ['goto', 4, 3, 500],
  ['dialogue', 200],
  ['fight', 1200],
  ['loot', 500],
  ['wait', 40],
  ['goto', 8, 3, 400],
  ['exit', 'right', 400],

  // East wing: the Chartstone, in a chest. Taken here rather than on the way
  // back because health only goes one way in this dungeon — the hub's fairy,
  // the one heal D1 offers, is behind its own pair of push blocks and is
  // therefore unobtainable too.
  ['fight', 1400],
  ['loot', 500],
  ['goto', 8, 3, 500],
  ['exit', 'right', 400],
  ['fight', 1200],
  ['loot', 500],
  // SIX frames of `up`, not the twenty-four d1-descent uses. Long enough to
  // turn and face the chest, short enough not to walk INTO it — a chest is
  // `solid: true` and, for the same reason the blocks cannot be pushed, that
  // solidity is never read, so a player who leans on a chest strolls through it
  // and ends up north of it facing away. The A press then reaches empty floor
  // and the chest never opens. d1-descent gets away with the longer hold
  // because its approach starts further out and it is pinned by the room's
  // north wall first; this one is not.
  ['goto', 5, 4, 500],
  ['hold', ['up'], 6],
  ['tap', 'a', 40],
  ['dialogue', 400],
  ['loot', 600],
  ['goto', 0, 3, 500],
  ['exit', 'left', 400],

  // Back through the hub and north up the spine into the Tide Gallery.
  ['fight', 1400],
  ['loot', 500],
  ['goto', 4, 1, 600],
  ['exit', 'up', 400],
  ['fight', 1400],
  ['dialogue', 200],
  ['loot', 500],

  // ---------------------------------------------------------------- d1 0,3,4
  // The Tide Gallery. Its north wall is a locked door and so is the Locked
  // Stair's above it, so TWO Small Keys stand between here and the Anchor. One
  // is the Crab Pit's, west; the other is the Switch Room's, east.
  //
  // West to the Crab Pit: three shielded crabs, and clearing the room is the
  // puzzle. This is the fight d1-descent's note is about — it is where a
  // scripted swordsman dies on three hearts — and it is why every fight in this
  // route is followed by a sweep for what it dropped.
  ['goto', 1, 3, 400],
  ['exit', 'left', 400],
  ['fight', 2400],
  ['dialogue', 300],
  ['loot', 600],
  ['goto', 8, 3, 400],
  ['exit', 'right', 400],

  // ------------------------------------------------- THE BLOCKER, in-engine
  //
  // East to the Switch Room, for the SECOND key. Its two floor switches are
  // `hold` switches and its puzzle wants both down at once, so one body cannot
  // answer it — the two blocks have to be pushed onto them.
  //
  // THEY CANNOT BE. `Entity.solid` is documented on the field itself as "blocks
  // the player like a pushable block", and nothing in the movement path reads
  // it: `canOccupy` samples TILES only, and `moveEntity` asks nothing else. So
  // the player walks straight through a push block, `Player.tryPush` never
  // fires — it only runs on a movement HIT — and no block in this game has ever
  // moved. Confirmed directly: a player stood one tile south of a block and
  // holding `up` for 120 frames ends up NORTH of it, with the block still on
  // its spawn tile.
  //
  // The route leans on both blocks anyway, exactly as a player would, and the
  // harness asserts what happens: the blocks do not move and no second key
  // arrives. That is the blocker, proved by the run rather than reasoned about.
  ['fight', 1400],
  ['loot', 500],
  ['goto', 8, 3, 500],
  ['exit', 'right', 400],
  ['dialogue', 200],
  ['goto', 2, 4, 500],
  ['hold', ['up'], 120],
  ['goto', 7, 4, 500],
  ['hold', ['up'], 120],
  ['dialogue', 300],
  ['loot', 600],
  ['goto', 0, 3, 500],
  ['exit', 'left', 400],

  // Back in the Tide Gallery with the one key the dungeon will actually give
  // up. Spend it on the north door. Walk into the door until it stops you
  // rather than counting frames: it is solid until it is unlocked, so holding
  // pins the player flush against it from wherever the approach ended.
  ['fight', 1400],
  ['loot', 500],
  ['goto', 4, 3, 500],
  ['hold', ['up'], 24],
  ['tap', 'a', 30],
  ['dialogue', 300],
  ['goto', 4, 1, 500],
  ['exit', 'up', 400],

  // 0,3,3 The Locked Stair. Two zols.
  ['fight', 1800],
  ['dialogue', 200],
  ['loot', 500],

  // Lean on the north door — the second lock, whose key is the one behind the
  // blocks. Nothing happens, which is the point: this is where a new game
  // stops.
  //
  // The Weeping Wall one room west is deliberately NOT walked. It is optional
  // content (the Split Fang charm and a red rupee), the run arrives at it on
  // one heart, and it dies there — which is a fact about how thin the health
  // economy is by this point rather than about the room, and is written up in
  // docs/NEXT-SESSION.md rather than smuggled into the route.
  ['goto', 4, 3, 500],
  ['hold', ['up'], 30],
  ['tap', 'a', 30],
  ['dialogue', 200],
  ['wait', 60],
];

/**
 * Where the run actually stops, and why.
 *
 * The goal of this harness is the Essence of Tidewash Grotto and it does not
 * reach it, because the game cannot be finished — see the blocker above. Rather
 * than assert a target it is known to miss (a checker that is red for a reason
 * everybody already knows stops being read) or quietly lower the target to what
 * passes (which is how a suite ends up with seven hundred green assertions on
 * an unfinishable world), it asserts BOTH: the furthest point the world
 * currently allows, AND that the blocker is still exactly where it was.
 *
 * When the blocker is fixed, delete `blocked` and set `room` to the boss room.
 * The Essence assertions in check-playthrough.mjs go live on their own.
 */
export const GOAL = {
  essence: 1,
  // The furthest a new game can get. Failing to REACH this is a regression.
  room: 'd1/0,3,3',
  blocked: {
    what: 'the Switch Room key at d1 0,4,4',
    why: 'push blocks cannot be pushed: Entity.solid is never read by canOccupy '
       + 'or moveEntity, so the player walks through a block and tryPush — which '
       + 'only fires on a movement hit — never runs',
    // The two locked doors between the Tide Gallery and the Anchor need two
    // Small Keys, and only the Crab Pit's is obtainable.
    keysNeeded: 2,
    keysObtainable: 1,
  },
};
