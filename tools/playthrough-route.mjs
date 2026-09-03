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
  // The Drinking Floor, waded at LOW. Two crabs and a keese, and the route
  // WALKS PAST THEM. Nothing in this room gates anything — no key, no puzzle,
  // no door — and a crab is `shield: 'front'`, so the actor's one verb (line
  // up, swing, stand still for the swing) trades two damage for nothing until
  // one of them happens to turn. Stood and brawled here it spent all three
  // hearts of a new game before the dungeon's only heal, and whether it
  // survived came down to which way the crabs were facing. A player walks
  // through a room with nothing in it; so does this.
  ['travel', 3, 6, 2000],
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

  // ---------------------------------------------------------------- d1 0,4,2
  // THE IRON PIPE — the first gate the Anchor's own verb opens, and the first
  // thing past this harness's old stopping point.
  //
  // The dungeon's primitive, "wells near": sound the sea to LOW, sink the iron
  // in the well beside you so that well STAYS down, then conch up to MID so the
  // drain ahead fills. tools/check-anchor.mjs names the placement — stand 0,3
  // at LOW, bite 1,3 — but it names it from a MODEL of the throw ('throw reach
  // 2 whole tiles'), and a model is not what lands the anchor. The `anchor`
  // directive tries every cardinal approach for real and reads the bite back
  // out of the live tide field, so if the arc will not stop on that tile the
  // run says so instead of quietly agreeing with the model.
  // ORDER IS THE PUZZLE. The sea is already at LOW — the Grotto Mouth's two
  // soundings put it there and nothing since has moved it — so the iron goes
  // down FIRST, while the well beside you is still drained, and the conch
  // comes after. Sounding first was this route's own first bug: it took the
  // sea to MID before the placement, which floods row 3 and leaves nowhere to
  // stand to make the throw, and the directive correctly reported that it
  // could not land on 1,3 from any approach.
  // The Anchor came out of its chest on NO button: autoEquip fills an empty
  // slot and the sword and the conch took both. So equip it the way a player
  // does, through the pause menu, onto A — the conch keeps B because the next
  // three steps alternate between the two.
  ['equip', 'anchor', 'A', 400],
  ['exit', 'right', 300],
  // BITE 2,3, AND ONLY 2,3. Probed tile by tile in the live engine, at MID,
  // with the iron sunk at each candidate — walkable row, then PIT flags:
  //
  //   bite 1,3 -> walk ....#.....   pit ----------   x=4 is a WALL
  //   bite 2,3 -> walk ..........   pit ----------   clean
  //   bite 3,3 -> walk ..........   pit -----P----   open pit at x=5
  //   bite 4,3 -> walk .#........   pit -----PP---   wall and two pits
  //
  // The patch is a radius-2 square, so it holds five tiles: centred on 2 it
  // covers x=0..4, which is exactly the run of wells and stops short of the
  // first drain. Centre it one tile further in and the patch keeps a DRAIN at
  // LOW, and a drain at LOW is an open pit — which is not solid, so the engine
  // lets the player walk into it and then punishes him. That is what cost this
  // run six quarter-hearts and 2,139 frames in a corridor it never left.
  //
  // tools/check-anchor.mjs names 1,3 for this room. It is right about REACH and
  // wrong about the crossing: see docs/HANDOFF.md.
  ['anchor', 2, 3, 1600],
  ['use', 'conch', 1, 120],
  // Walk the pipe east on foot rather than asking `travel` for the screen.
  // `travel` re-plans across rooms every leg, and with the iron holding one
  // half of this corridor at a level the other half is not at, it found a
  // route out through the WEST wing and left the run in 2,3 — a real path, and
  // not this one. A gate crossed by a held tide is a corridor, so it is walked
  // as a corridor.
  ['goto', 9, 3, 900],
  ['exit', 'right', 300],

  // ---------------------------------------------------------------- d1 0,5,2
  // The Drowned Chamber, AND THE CONCH IS THE ANSWER TO IT.
  //
  // Two anglerfry and a crab round a pool. The fight is optional — the room's
  // own comment says the crossing never depends on the iron — but WALKING it
  // at MID is not free either: the fish hunt the shallow water and it cost six
  // quarter-hearts a crossing, twice, and killed the run on the way back.
  // Fought at MID it cost nine of twelve.
  //
  // At LOW the pool is a floor of holes and an aquatic enemy out of water is
  // asleep before it has even begun to flop (`tideOnly`, then
  // ENEMY_BEACHED_FRAMES). The dry ring round the edge is walkable at every
  // level, which is what the room's comment means by keeping it honest. So the
  // sea goes down and the run walks the ring: MID -> HIGH -> LOW is two
  // soundings, and it is free both ways.
  //
  // It also lands the sea exactly where the Long Race wants it.
  ['use', 'conch', 2, 140],
  ['goto', 1, 1, 900],
  ['goto', 4, 1, 900],
  ['exit', 'up', 300],

  // ---------------------------------------------------------------- d1 0,5,1
  // The Long Race: the same gate as the Iron Pipe, entered from the far end.
  // Come in at the south door, round the elbow at column 9, and stand on the
  // sill at 9,3.
  ['goto', 9, 6, 600],
  ['goto', 9, 3, 600],
  // The sea is already at LOW — the Drowned Chamber put it there — so the iron
  // goes down first and the conch comes after, which is the wing's whole
  // primitive. `anchor` recalls the iron out of the Iron Pipe by itself, and
  // that is the point of this wing's one-way return stair: the crossing behind
  // us cannot be un-made from this side.
  //
  // BITE 7,3, NOT 8,3. The wells are columns 5-8 and the held patch is a
  // radius-2 square, so 7 covers 5..9 — every well and the sill — while 8
  // covers 6..10 and leaves the well at column 5 to drown at MID. Same
  // correction as the Iron Pipe's, from the same cause: `check-anchor.mjs`
  // names 8,3 and is right about REACH and silent about the crossing.
  ['anchor', 7, 3, 1600],
  ['use', 'conch', 1, 140],
  ['goto', 0, 3, 900],
  ['exit', 'left', 300],

  // ---------------------------------------------------------------- d1 0,4,1
  // The Keyvault, and THE THIRD SMALL KEY. A keese, then the chest, opened
  // from the north because row 1 is the only clear approach.
  ['equip', 'sword', 'A', 400],
  ['fight', 1200],
  ['loot', 500],
  ['goto', 4, 1, 600],
  ['hold', ['down'], 6],
  ['tap', 'a', 40],
  ['dialogue', 400],
  ['loot', 600],

  // Back east across the Long Race — the iron is still in it, so it is a
  // corridor now — and down through the Drowned Chamber into the den.
  ['goto', 9, 3, 900],
  ['exit', 'right', 300],
  ['goto', 9, 3, 900],
  ['goto', 9, 6, 600],
  ['goto', 4, 6, 600],
  ['exit', 'down', 300],
  // And down the ring again, with the sea taken back to LOW so the fish are
  // asleep for the second crossing too.
  ['use', 'conch', 2, 140],
  // Down the EAST side of the ring, not the west: the crab spawns at 1,6 and
  // the fish are the only things the sea puts to sleep.
  ['goto', 8, 1, 900],
  ['goto', 8, 6, 900],
  ['goto', 4, 6, 900],
  ['exit', 'down', 300],
  // Back up to MID before the den. The Clawcrab is not fought (see below) but
  // it does chase, and it patrols at 1.0 and charges at 1.2 with the sea down
  // against 0.7 and 0.9 at any other level — its own spec says so, and one
  // sounding is cheaper than the difference.
  ['use', 'conch', 1, 140],

  // ---------------------------------------------------------------- d1 0,5,3
  // The Clawcrab Den, the one 2x1 room in the game, and the THIRD Piece of
  // Heart.
  //
  // A MINIBOSS IS NOT `g.boss`. `defineBoss` builds it and its `init` clears
  // `isBoss`, because `progress.beaten` is keyed off the MAP and a miniboss
  // counted as a boss would mark the whole dungeon beaten — so `g.boss` is
  // null in this room and the directive has to name what it is fighting:
  // `['boss', 6000, 'clawcrab']`. `dFight` cannot take it; measured, it died
  // in 480 frames from a full twelve.
  //
  // THE THIRD KEY IS SPENT HERE. The door at 2,3 is the only way between the
  // den and the west antechamber (the room's own comment explains the four
  // walled tiles that make that true), and 0,4,3 is entered only through it.
  ['boss', 6000, 'clawcrab'],
  ['dialogue', 600],
  ['loot', 1500],
  ['dialogue', 400],
  ['goto', 3, 3, 900],
  ['hold', ['left'], 24],
  ['tap', 'a', 30],
  ['dialogue', 300],
  ['goto', 0, 3, 600],
  ['exit', 'left', 300],

  // ---------------------------------------------------------------- d1 0,4,3
  // The Two Gauges. A door that opens only while one well reads drained and
  // the other reads drowned, five tiles apart with a five-tile patch — so one
  // of them is the base and the other is under the iron, and there is no way
  // to have both.
  //
  // Sea to LOW, sink the iron so the WEST gauge keeps LOW, then take the sea
  // to HIGH: the east gauge reads drowned, the west one is still dry, and the
  // door gives. The bite is 3,4 — a radius-2 patch centred there covers
  // columns 1..5 and rows 2..6, which holds 2,2 and cannot reach 7,2.
  ['equip', 'anchor', 'A', 400],
  ['use', 'conch', 2, 140],
  ['anchor', 3, 4, 1600],
  ['use', 'conch', 2, 140],
  ['dialogue', 400],
  // The fourth Piece of Heart, and with it the Heart Container: four hearts,
  // refilled to full. Two came out of the caves west of the village, the third
  // off the Clawcrab, and this is the one the door was for.
  // Everything after this is fought on sixteen — which is what Gohmaraq
  // costs.
  ['loot', 1500],
  ['dialogue', 600],
  // The wing's one-way return stair, back to the Tide Gallery.
  ['goto', 7, 6, 600],
  ['wait', 120],
  ['dialogue', 300],

  // ---------------------------------------------------------------- d1 0,3,4
  // The stair lands the player back in the Tide Gallery ON TOP OF ITS
  // TEKTITE — the warp's exit tile is 4,3 and the tektite's spawn is 4,3 —
  // with a crab in the next column. Both doors up the spine are already open,
  // so the temptation is to walk straight through, and the first cut of this
  // route did: it arrived on a full sixteen and was dead 120 frames later
  // without a single directive in between noticing. Both of these drop
  // `good`, which is the room's own answer to being crossed this often.
  ['equip', 'sword', 'A', 400],
  ['fight', 1600],
  ['dialogue', 200],
  ['loot', 600],
  ['goto', 4, 1, 900],
  ['exit', 'up', 400],

  // ---------------------------------------------------------------- d1 0,3,3
  // The Locked Stair, and its two zols are a fresh pair: a room re-spawns its
  // entity list every time it is entered, so the ones the route killed on the
  // way up are not the ones standing here now.
  ['fight', 1600],
  ['dialogue', 200],
  ['loot', 600],
  // AND PUT THE SEA BACK DOWN BEFORE OPENING THAT DOOR. The gauges left it at
  // HIGH, and the Sluicegate's floor is `dSluice` — dry, then shallow, then
  // DEEP. Its south doorway opens straight into that patch, so a player who
  // walks up out of here at HIGH steps into water over his head with the room
  // he wants on the far side of it: the run got in, could not reach the west
  // wall, and every directive after it addressed a room it was not in.
  // HIGH -> LOW -> MID is two soundings and MID is what the Long Sluice wants
  // anyway.
  ['use', 'conch', 2, 140],
  ['goto', 4, 1, 900],
  ['exit', 'up', 400],

  // ---------------------------------------------------------------- d1 0,3,2
  // ---- THE WEST WING ------------------------------------------------------
  // The Long Sluice: the mirror of the other two gates. The DRAINS are near
  // now, so the iron holds THEM full at MID and the sea goes down, emptying
  // the wells beyond. Bite 7,3 for the same reason as the Long Race: the
  // drains are columns 5-8 and a patch centred on 8 leaves column 5 an open
  // pit at LOW. That pit is worth two quarter-hearts a crossing, measured.
  ['equip', 'anchor', 'A', 400],
  ['goto', 0, 3, 500],
  ['exit', 'left', 300],
  ['anchor', 7, 3, 1600],
  ['use', 'conch', 2, 140],
  ['goto', 0, 3, 900],
  ['exit', 'left', 300],

  // ---------------------------------------------------------------- d1 0,1,2
  // Cistern Turn. A zol and a crab round a basin, neither of which gates
  // anything; the run walks north through it.
  ['goto', 4, 1, 600],
  ['exit', 'up', 300],

  // ---------------------------------------------------------------- d1 0,1,1
  // The Drip Vault: the second pair of gauges, stacked five ROWS apart rather
  // than five columns. Clear the keese first — it is a two-quarter-heart tax
  // on standing still long enough to work the iron, measured — then hold the
  // upper well at LOW and take the sea to HIGH.
  ['equip', 'sword', 'A', 400],
  ['fight', 900],
  ['loot', 400],
  ['equip', 'anchor', 'A', 400],
  ['anchor', 4, 3, 1600],
  ['use', 'conch', 2, 140],
  ['dialogue', 400],
  ['goto', 9, 3, 600],
  ['exit', 'right', 300],

  // ---------------------------------------------------------------- d1 0,2,1
  // The Bosskey Vault, and the last thing between the run and the boss door.
  ['equip', 'sword', 'A', 400],
  ['fight', 900],
  ['loot', 400],
  ['goto', 4, 2, 600],
  ['hold', ['down'], 6],
  ['tap', 'a', 40],
  ['dialogue', 400],
  ['loot', 600],
  // The west wing's own return stair, back down to the Locked Stair.
  ['goto', 5, 5, 600],
  ['wait', 120],
  ['dialogue', 300],

  // ---------------------------------------------------------------- d1 0,3,3
  // Two zols, and they respawn — a room is re-populated every time it is
  // entered, so the pair the route killed on the way up is a fresh pair now.
  // They drop `good`, which is the dungeon's last chance to hand health back
  // before the arena.
  ['fight', 1500],
  ['dialogue', 200],
  ['loot', 600],
  // Gohmaraq's shell holds its eye open TWICE as long at LOW (`gohmaraqSlam`
  // doubles `openFor` there), and the boss room is `noTide` — the arena is
  // whatever level was carried through the door. One sounding takes HIGH to
  // LOW; this is the last decision of the dungeon and it is worth more than
  // any item in it.
  ['use', 'conch', 1, 140],
  ['goto', 4, 1, 500],
  ['exit', 'up', 400],

  // ---------------------------------------------------------------- d1 0,3,2
  // The boss door, above the chest the Anchor came out of.
  ['goto', 4, 3, 600],
  ['hold', ['up'], 24],
  ['tap', 'a', 30],
  ['dialogue', 300],
  ['goto', 4, 1, 500],
  ['exit', 'up', 400],
  ['wait', 90],

  // ---------------------------------------------------------------- d1 0,3,1
  // GOHMARAQ, THE TIDEWASH CLAW — the first boss anything in this repository
  // has ever fought outside god mode and won on the way past.
  ['boss', 9000],
  ['wait', 300],
  ['dialogue', 900],
  ['loot', 900],
  ['dialogue', 900],
  ['wait', 240],
];

/**
 * Where the run ends, and what that now means.
 *
 * IT REACHES AN ESSENCE. For the whole life of this harness this block
 * explained a stopping point instead — first the Sluicegate, because the actor
 * had no way to place the Anchor; then the Iron Pipe's far side, because it
 * had no way to fight a boss. Both verbs exist now (`anchor` landed last
 * session, `boss` this one), the route walks both wings of Tidewash Grotto,
 * spends all three Small Keys and the Boss Key, and kills Gohmaraq at four
 * hearts. `check-playthrough.mjs` asserts the Essence rather than a distance.
 *
 * WHAT IS STILL NOT DRIVEN, so the next session does not have to find it:
 * everything after D1. Five dungeons, the Coastwise Chain, the overworld's
 * later gates and the other five bosses are all unrouted, and four of those
 * five bosses have never been beaten by this actor in real combat on the seed
 * this run uses — see the sweep table above `safe` in tools/actor-runtime.mjs
 * for exactly which, and `tools/measure-boss-combat.mjs <d> --seed=N` for how
 * to re-measure it.
 */
export const GOAL = {
  essence: 1,
  // The room the run finishes in: Gohmaraq's arena, with the Essence taken.
  room: 'd1/0,3,1',
  // Nothing left to add for D1. Named for the next extension: D2's route needs
  // the Lens and the bombs, and `dBoss` has never beaten Anemos in real combat.
  needsVerb: null,
  keysNeeded: 3,
  keysObtainable: 3,
};
