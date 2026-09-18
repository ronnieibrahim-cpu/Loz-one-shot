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
  // WALK ONTO THE ESSENCE BY HAND — `dLoot` CANNOT COLLECT IT AT ANY BUDGET.
  // Same reason spelled out at D2's own boss below: `Essence`
  // (`src/game/objects.js`) has no `isDrop`, so the drop sweep does not see it
  // and never will; it collects only by its own `overlaps(game.player)`, and
  // `onBossDefeated` spawns it at tile 4,3. D2 got this step and D1 did not —
  // D1 leant on the following `loot` happening to leave the actor near enough,
  // which is exactly the accident D2's comment warns is not to be relied on.
  // It stopped holding, and the run beat Gohmaraq and walked away without his
  // Essence. `wait` above covers the spawn: BOSS_DEATH_FRAMES (72) of death
  // stall, then BOSS_ESSENCE_DELAY_FRAMES (70) before it appears.
  ['goto', 4, 3, 400],
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
  ['goto', 4, 7, 500],
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
  ['goto', 4, 7, 500],
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

  // ---------------------------------------------------------------- d2 0,3,4
  // Rising Chamber. The switch pair — block (2,5) onto switch (1,5), block
  // (7,6) onto switch (8,6) — opens the door to Cistern Cell (skipped, an
  // optional charm) and spawns the Small Key that answers Stair Coil's own
  // locked door, below. THE BARNACLE AT (4,6) IS A FIXED HAZARD, NOT AN
  // ENEMY (`hp: 999, shield: 'all'`) — it is never fought, only endured, and
  // it fires on an absolute 96-frame cycle (`every(e, 96)`) that this run's
  // own frame count happens to line up against favourably at the `wait`
  // below. THE KEY PICKUP MISSES OVERLAP BY ONE PIXEL AT ITS TILE-ALIGNED
  // REST POSITION — `dLoot`'s own "stand one tile north" retry does not
  // land close enough either, so it is grabbed by an explicit `goto` to its
  // exact tile followed by a one-frame nudge (`hold up`) rather than by
  // `loot`.
  ['travel', 3, 4, 1500],
  ['goto', 3, 5, 400],
  ['hold', ['left'], 40],
  ['goto', 6, 6, 500],
  ['hold', ['right'], 40],
  ['dialogue', 300],
  ['wait', 60],
  ['goto', 4, 2, 700],
  ['hold', ['up'], 3],
  ['wait', 10],
  ['goto', 1, 3, 700],
  ['exit', 'left', 300],

  // ---------------------------------------------------------------- d2 0,2,4
  // Stair Coil. The Small Key's whole job: its locked door gates only the
  // stairs beyond it, not the room's own entrance — `travel` already reaches
  // here without the key, and only the crossing past this point needs it.
  ['goto', 6, 3, 500],
  ['hold', ['left'], 20],
  ['tap', 'a', 30],
  ['goto', 2, 2, 900],

  // ---------------------------------------------------------------- d2 1,2,4
  // Upper Landing, onto floor 1. Anemone Cell's fairy is grabbed now, on the
  // way past, because nothing later in the route comes back this way to
  // collect it.
  ['travel', 2, 5, 1200],
  ['loot', 900],

  // ---------------------------------------------------------------- d2 1,4,4
  // Sealed Cell. The big chest holds the Lens; approached from the tile
  // beside it (2,1) rather than the well below it, which is deep at MID/HIGH.
  ['travel', 4, 4, 1500],
  ['goto', 1, 1, 500],
  ['hold', ['right'], 20],
  ['tap', 'a', 40],
  ['dialogue', 400],
  ['loot', 600],

  // ---------------------------------------------------------------- d2 1,4,5
  // Glass Cell, one room south of Sealed Cell — the second Piece of Heart.
  // Its keese are phase-2 (only a threat at HIGH tide, per `updatePhaseShift`
  // in `src/game/game.js`); off HIGH they are harmless and need no fight.
  ['travel', 4, 5, 1200],
  ['loot', 900],

  // ---------------------------------------------------------------- d2 1,4,3
  // The First Fork. Never equip the Lens to a button carrying the sword or
  // conch — a scripted route that already knows a fork's own answer never
  // needs to press the Lens button at all, and equipping it onto B or A
  // silently displaces whatever was there, turning every later "swing"
  // directive into a Lens press that lands no damage. The west shaft fills:
  // hop the one-way ledge (`hold left`, an auto-hop mechanic that carries
  // the actor across on its own), reach the valve, `tap a` fires
  // `TideValve.interact` -> `game.forceTideStep()` (this room's `tideForce:
  // 0` pin refuses the conch, so the sluice is the only way to move its
  // water), then climb the now-wadeable shaft into Reefguard Hall.
  ['travel', 4, 3, 1200],
  ['goto', 3, 5, 500],
  ['hold', ['left'], 60],
  ['goto', 1, 6, 500],
  ['hold', ['right'], 10],
  ['tap', 'a', 40],
  ['hold', ['up'], 90],
  ['goto', 1, 0, 500],
  ['hold', ['up'], 40],

  // ---------------------------------------------------------------- d2 1,4,2
  // Reefguard Hall — `size: [2, 1]`, so `travel` cannot path to its own
  // second cell (a real, general gap: `dTravel`'s cross-room BFS never
  // models an edge for a multi-cell room's non-anchor cell). The miniboss
  // for the second Small Key: `['boss', N, 'reefguard']` names the target
  // because a miniboss clears `isBoss` in its own `init` (`beaten` is keyed
  // off the map, and a miniboss counted as a boss would mark the whole
  // dungeon beaten on arrival). `puzzle.enemies: true` also wants the urchin
  // dead, and it sits on a well that is only walkable at LOW — sound the
  // conch down first. The reward key sits flush against the room's own
  // north wall, where `dLoot`'s usual "lean north" recovery presses into
  // solid wall and gains nothing; approached from below instead.
  ['boss', 6000, 'reefguard'],
  ['dialogue', 300],
  ['use', 'conch', 2, 140],
  ['goto', 14, 4, 500],
  ['fight', 1500],
  ['dialogue', 300],
  ['goto', 4, 3, 500],
  ['hold', ['up'], 30],
  ['loot', 700],

  // ---------------------------------------------------------------- d2 1,5,3
  // Bomb Vault and Whelk Cell. Still reached by hand (goto/exit, not
  // `travel`) in THIS direction — `bfsScreens` always plans from the wide
  // room's own ANCHOR coordinates, so a `travel` call issued from here would
  // have to cross the same phantom anchor/non-anchor "edge" the S47 fix does
  // not resolve (see the GOAL comment's note on the narrower gap that
  // remains). The RETURN trip below, entering Reefguard Hall's own second
  // cell directly from Bomb Vault, is the one S47's fix does cover — see
  // that comment. The chest holds the Bombs; Whelk Cell's own Piece of Heart
  // is the FOURTH one this run collects (two overworld, Glass Cell, this
  // one) — the Heart Container completes here, refilling to full and
  // raising the cap.
  ['goto', 14, 7, 900],
  ['exit', 'down', 400],
  ['goto', 2, 3, 500],
  ['hold', ['down'], 6],
  ['tap', 'a', 40],
  ['dialogue', 400],
  ['loot', 600],
  ['travel', 5, 4, 1200],
  ['loot', 900],

  // Back to Reefguard Hall's anchor cell. `dTravel`'s non-anchor-cell fix
  // (S47) lets a single `travel` call reach the room's own second cell
  // (1,5,2) directly from Bomb Vault, replacing the manual `goto`/`exit`
  // pair this used to need — `travel` from there reaches Spire Ascent fine,
  // since that IS an edge from the room's own registered cell.
  ['travel', 5, 3, 900],
  ['travel', 5, 2, 1200],
  ['goto', 4, 4, 900],
  ['travel', 3, 2, 1200],

  // ---------------------------------------------------------------- d2 1,3,2
  // Spire Ascent — `size: [1, 2]`. Its locked door (the second Small Key)
  // sits at local row 11 of the room's own second cell (`1,3,3`), gating
  // only the crossing to Drowned Cell, not the room's own approach — reached
  // by walking down from the anchor cell (ordinary internal movement, not a
  // `dTravel` matter) and unlocking it. Leaving to Drowned Cell used to need
  // a manual `goto`/`exit` pair for the same reason Reefguard Hall's return
  // leg did (S47's non-anchor-cell fix); `['travel', 2, 3, N]` now covers it
  // in one call — S48.
  ['goto', 4, 6, 900],
  ['goto', 2, 11, 500],
  ['hold', ['left'], 20],
  ['tap', 'a', 30],
  ['travel', 2, 3, 900],

  // ---------------------------------------------------------------- d2 1,2,2
  // The Sounding Fork, the west throat — the same primitive as the First
  // Fork, one branch further. THE LEDGE HOP OVERSHOOTS IF HELD TOO LONG: an
  // early cut of this route held `up` through the hop and straight on into
  // the throat's own interior, which is a `dPit` at this room's pinned LOW
  // and cost several quarter-hearts a crossing in a fall-and-reset loop
  // before it was cut back to just enough to clear the ledge, landing at the
  // shelf (`lensRoom.branches[west].land`) rather than riding the hop's own
  // momentum past it.
  ['travel', 2, 2, 1200],
  ['goto', 4, 6, 500],
  ['goto', 1, 6, 500],
  ['hold', ['up'], 20],
  ['goto', 1, 4, 400],
  ['goto', 1, 3, 400],
  ['hold', ['right'], 10],
  ['tap', 'a', 40],
  ['goto', 1, 1, 400],
  ['goto', 1, 0, 500],
  ['hold', ['up'], 40],

  // ---------------------------------------------------------------- d2 1,2,1
  // Bosskey Cell. The chest.
  ['goto', 4, 1, 500],
  ['hold', ['down'], 6],
  ['tap', 'a', 40],
  ['dialogue', 400],
  ['loot', 600],

  // Back down through the Sounding Fork — the west throat is still flooded
  // (the valve's own `open` flag persists; `TideValve.update` restores the
  // water level to match on this fresh room entry, the fix this dungeon's
  // own fork rooms needed and now carry) — and onto the west stair, which
  // warps directly into Spire Ascent's LOWER cell rather than back through
  // Bosskey Cell's own one exit.
  ['goto', 1, 7, 500],
  ['exit', 'down', 400],
  ['goto', 1, 1, 500],
  ['goto', 2, 4, 500],

  // ---------------------------------------------------------------- d2 1,3,2
  // Spire Ascent's lower cell, up through to the boss door. Sound the conch
  // to HIGH before opening it — Anemos's own weak window scales with the
  // tide it is fought at (`anemosFeed`, `src/data/bosses.js`:
  // `[40, 80, 160][tide.level]` frames open in every 250), and HIGH is the
  // best it gets.
  ['goto', 4, 3, 1500],
  ['hold', ['up'], 24],
  ['tap', 'a', 30],
  ['use', 'conch', 1, 140],
  ['goto', 4, 1, 500],
  ['exit', 'up', 400],
  ['wait', 90],

  // ---------------------------------------------------------------- d2 1,3,1
  // ANEMOS, THE CROWNED COLUMN. THE FIGHT'S OWN OUTCOME IS SENSITIVE TO THE
  // EXACT FRAME THE ROOM IS ENTERED AT, because Anemos's attack timers
  // (`timer(e, 'feed', 250)`, `timer(e, 'ring', 170)`, etc.) are
  // absolute-frame-based rather than relative to when the fight starts.
  // RE-SWEPT TWICE NOW, for two different reasons, and the `wait` below
  // reflects the second sweep:
  //   S48: splicing the fixed `dTravel` into Reefguard Hall's return leg
  //     shifted this room's entry by several hundred frames. The OLD
  //     `wait: 220` still happened to pass, but a 1-frame sweep of 195-235
  //     found it sitting on an isolated single-frame win, not a plateau —
  //     replaced with `wait: 212`, the middle of a 7-frame stable band
  //     (207-213).
  //   S50: `dBoss` itself changed (`b.spec.safeWhenOpen`, see
  //     `tools/actor-runtime.mjs` and `src/data/bosses.js`'s `anemos`
  //     entry) — a boss-AI change moves a frame-phase tune exactly the same
  //     way a route change does, and `check-playthrough.mjs` confirmed it:
  //     `wait: 212` still passed but left only 2 of 20 quarter-hearts, a
  //     much thinner margin than S48 measured for it. A fresh 1-frame sweep
  //     of 205-230 against the new `dBoss` behaviour found an 8-frame
  //     unbroken winning streak at 213-220 (no losses anywhere in it, unlike
  //     the choppy frames on both sides); `wait: 216` is the middle of that
  //     streak and also has the best margin within it (14 of 24
  //     quarter-hearts).
  // Per CLAUDE.md: "a five-line change to the movement path is never a
  // five-line change" — the same is true of a change to the combat verb
  // every boss fight shares. If anything upstream of this fight, OR
  // `dBoss`'s own logic, ever changes again, re-sweep the same way
  // (`beginPlaythrough` with the real `ROUTE` prefix, never an isolated
  // `boot()`) rather than trusting a single pass.
  ['wait', 216],
  ['boss', 9000],
  ['wait', 200],

  // THE ESSENCE PICKUP HAS NO `isDrop` — IT IS NOT A `Pickup` AND `dLoot`
  // CANNOT SEE IT, AT ANY BUDGET. `Essence` (`src/game/objects.js`) collects
  // by its own `overlaps(game.player)` check, so the only way the actor
  // reaches it is to walk onto its exact tile by hand, before any `loot`
  // call (a `loot` first, aimed at the bonus Heart Container `onBossDefeated`
  // also drops, happens to still work by leaving the actor near enough
  // afterward — but essence-first is the order that does not depend on it).
  ['goto', 4, 3, 400],
  ['dialogue', 900],
  ['loot', 900],
  ['dialogue', 900],
  ['wait', 240],

  // ===================================================================
  // D3 — BOGWATER SANCTUM. Draft leg 1: out of the Spire and across to the
  // Sanctum's mouth.
  ['travel', 4, 2, 8000],
  ['travel', 4, 3, 8000],
  ['goto', 2, 4, 900],
  ['wait', 90],
  ['goto', 8, 2, 900],
  ['wait', 60],
  ['travel', 3, 7, 20000],
  ['goto', 4, 7, 500],
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
  // The Drowned Nave. `puzzle.enemies: true` pays out a FAIRY, and it is the
  // heal the whole crossing west was spent on: the run arrives here on
  // whatever Anemos and nine screens of strand left it.
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
  // The Sluice Cell. Two blocks, two switches directly north of them: stand
  // under each block and hold up. The key drops against the room's own north
  // wall, where `dLoot`'s lean-north recovery has nothing to lean into.
  ['travel', 4, 5, 4000],
  ['goto', 2, 4, 900],
  ['hold', ['up'], 40],
  ['goto', 7, 4, 900],
  ['hold', ['up'], 40],
  ['dialogue', 300],
  ['goto', 4, 2, 600],
  ['hold', ['up'], 30],
  ['loot', 900],

  // ---------------------------------------------------------------- d3 0,3,4
  // The Weir. Its locked door is in the room's own north wall and gates the
  // stair to the item room, not the room's approach — the key is spent here
  // and the two side cells either side of it are walked afterwards.
  ['travel', 3, 4, 4000],
  ['goto', 4, 3, 900],
  ['hold', ['up'], 20],
  ['tap', 'a', 30],

  // ---------------------------------------------------------------- d3 0,2,4
  // Silt Cell: the Chartstone.
  ['travel', 2, 4, 4000],
  ['goto', 4, 3, 600],
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
  // flat deep water at every tide; the causeway from the south door is the
  // only dry way onto it, and the way off it is the item in the chest.
  ['travel', 3, 4, 4000],
  ['goto', 4, 1, 900],
  ['hold', ['up'], 30],
  ['wait', 60],
  ['goto', 4, 4, 900],
  ['hold', ['up'], 6],
  ['tap', 'a', 40],
  ['dialogue', 600],
  ['loot', 900],

  // ---------------------------------------------------------------- d3 0,2,3
  // THE UNDERTOW, ON THE SEAFLOOR. The soles go on B — the conch comes back
  // to it before the boss — and are pressed once on dry land, which arms
  // them: the next water the player steps into is entered by sinking rather
  // than by swimming (`Player.updateTerrain`). On the surface this channel's
  // current runs east and carries you back onto the island; on the floor
  // nothing pushes at all, and the whole length fits in one breath.
  ['equip', 'cleats', 'B', 400],
  ['soles', 'sink', 240],
  ['goto', 3, 3, 600],
  ['hold', ['left'], 120],
  ['soles', 'sink', 240],
  ['hold', ['left'], 300],
  ['wait', 90],

  // ---------------------------------------------------------------- d3 0,1,3
  // The Sunken Vestry, and the second Small Key: two more blocks onto two
  // more switches. Coming up out of the channel puts the soles back on the
  // surface by itself (`Player.surface`), so nothing has to unset them.
  ['goto', 2, 4, 900],
  ['hold', ['up'], 40],
  ['goto', 7, 4, 900],
  ['hold', ['up'], 40],
  ['dialogue', 300],
  ['goto', 4, 2, 600],
  ['hold', ['up'], 30],
  ['loot', 900],

  // ---------------------------------------------------------------- d3 0,1,2
  // The Drain Gallery. Its locked door stands in the middle of the room
  // rather than in a wall, and the Boss Key is in the chest on the far side
  // of it.
  ['goto', 3, 1, 900],
  ['hold', ['up'], 30],
  ['wait', 60],
  ['goto', 4, 4, 900],
  ['hold', ['right'], 20],
  ['tap', 'a', 30],
  ['goto', 7, 4, 900],
  ['hold', ['up'], 6],
  ['tap', 'a', 40],
  ['dialogue', 400],
  ['loot', 900],

  // ---------------------------------------------------------------- d3 0,2,3
  // BACK EAST ALONG THE UNDERTOW, ON THE SURFACE, AND IT IS FREE. The channel
  // runs east: step off the shelf into it without arming the soles and the
  // current carries you the whole length back to the island. A torrent is a
  // wall one way and a road the other, and this is the room saying so.
  ['goto', 3, 6, 900],
  ['hold', ['down'], 30],
  ['wait', 60],
  ['goto', 8, 3, 900],
  ['hold', ['right'], 240],
  ['wait', 90],

  // ---------------------------------------------------------------- d3 0,3,3
  // Across the island and out its east side.
  ['goto', 5, 3, 900],
  ['hold', ['right'], 180],
  ['wait', 90],

  // ---------------------------------------------------------------- d3 0,4,3
  // THE BOGWATER DRAIN, AND THE CURRENT RUNS THE OTHER WAY. A player who
  // learned "swim east" in the Undertow learns nothing here: this channel
  // flows west, so the crossing east is another floor walk. The alcove under
  // the channel holds a fairy and only opens off the seafloor.
  ['soles', 'sink', 240],
  ['hold', ['right'], 60],
  ['goto', 4, 6, 900],
  ['loot', 1200],
  // Coming up into the alcove surfaced the soles, so they are armed again for
  // the second half of the crossing.
  ['soles', 'sink', 240],
  ['hold', ['up'], 60],
  ['hold', ['right'], 300],
  ['wait', 90],

  // ---------------------------------------------------------------- d3 0,5,4
  // Eel Hall's west screen, and straight through it to the Eel Vault below.
  // NOTHING IS FOUGHT IN THE HALL: it fields two barnacles, which are
  // `hp: 999` turrets bolted to the wall, and a `fight` directive in a room
  // holding one never returns.
  ['goto', 4, 6, 900],
  ['hold', ['down'], 30],
  ['wait', 60],
  ['fight', 3000, 1200],

  // THE VAULT'S CRAB CANNOT BE KILLED BY `fight`, AND THE REASON IS THE SAME
  // ONE SANDPIPER ROW'S CRAB TAUGHT THIS ROUTE. `dFight` lines up on one
  // axis and closes; a crab patrols along x, which is the axis its
  // `shield: 'front'` covers, and a `shield: 'front'` check only ever
  // compares a HORIZONTAL attack direction against a horizontal facing
  // (`Entity.hurt`), so a vertical swing is unconditionally unblockable and a
  // horizontal one never lands. Eight thousand frames of `fight` left it
  // standing and the key it is holding never dropped. Stand over its patrol
  // line and swing down by hand.
  // It patrols tiles 1 to 4 of its own row, so the swing is taken from the
  // middle of that beat rather than from wherever `dFight` gave up.
  ['goto', 3, 3, 900],
  ['hold', ['down'], 3],
  ['tap', 'a', 16], ['tap', 'a', 16], ['tap', 'a', 16], ['tap', 'a', 16],
  ['tap', 'a', 16], ['tap', 'a', 16], ['tap', 'a', 16], ['tap', 'a', 16],
  ['tap', 'a', 16], ['tap', 'a', 16], ['tap', 'a', 16], ['tap', 'a', 16],
  ['goto', 2, 3, 600],
  ['hold', ['down'], 3],
  ['tap', 'a', 16], ['tap', 'a', 16], ['tap', 'a', 16], ['tap', 'a', 16],
  ['tap', 'a', 16], ['tap', 'a', 16], ['tap', 'a', 16], ['tap', 'a', 16],
  ['tap', 'a', 16], ['tap', 'a', 16], ['tap', 'a', 16], ['tap', 'a', 16],
  ['wait', 120],
  ['dialogue', 400],
  ['wait', 120],
  ['loot', 1500],

  // ---------------------------------------------------------------- d3 0,5,3
  // Back up into the Hall and through its locked door — the third key, and
  // the way north into the Kelp Locks.
  ['goto', 4, 1, 900],
  ['hold', ['up'], 30],
  ['wait', 60],
  ['goto', 4, 3, 900],
  ['hold', ['up'], 20],
  ['tap', 'a', 30],
  ['goto', 4, 1, 900],
  ['hold', ['up'], 40],
  ['wait', 90],

  // ---------------------------------------------------------------- d3 0,4,2
  // THE KELP LOCKS, AND THE ONLY ROOM IN THE DUNGEON WHERE THE BREATH NUMBER
  // IS NOT DECORATIVE: eighteen tiles of seafloor in one dive with no shelf
  // in the middle to come up on. Up the shaft, arm the soles, and walk the
  // whole channel west against a current that would carry a swimmer back.
  ['soles', 'sink', 240],
  ['hold', ['up'], 90],
  ['hold', ['left'], 440],
  ['wait', 90],

  // ---------------------------------------------------------------- d3 0,3,2
  // The Lock Gallery, and the boss door in its north wall. THE SEA GOES TO
  // LOW BEFORE THE DOOR IS OPENED, NOT AFTER: the arena is `noTide`, so it
  // pins whatever level was carried in, and MID is the sanctum current's own
  // level — Gloomtide is nearly twice as fast there and the fight is a loss
  // in ten of ten seeds. Named rather than counted, because the walk here
  // spent presses of its own.
  ['tide', 0, 140, 600],
  ['goto', 4, 3, 900],
  ['hold', ['up'], 20],
  ['tap', 'a', 30],
  ['goto', 4, 1, 900],
  ['hold', ['up'], 40],
  ['wait', 90],

  // ---------------------------------------------------------------- d3 0,3,1
  // GLOOMTIDE, THE BOGWATER MAW. `clearAdds` is not optional here and it is
  // not general: the boss sheds gels, and read hit by hit, ten of the
  // fourteen hits that used to kill the actor came from the swarm and exactly
  // one came from the boss. With the option the fight measures seven wins in
  // ten seeds; without it, none. Measured across all six bosses it is a win
  // on this one and a loss on four, so it is named per fight.
  ['boss', 14000, null, { clearAdds: true }],
  ['wait', 240],

  // The Essence is not a `Pickup` and `dLoot` cannot see it at any budget —
  // `Essence` collects on its own overlap check — so it is walked onto by
  // hand, before the loot call that sweeps up the arena's Heart Container.
  ['goto', 4, 3, 600],
  ['dialogue', 900],
  ['loot', 1200],
  ['dialogue', 900],
  ['wait', 240],

  // ======================================================================
  // OUT OF THE SANCTUM, AND NORTH TO THE CLIFFSIDE CISTERN
  // ======================================================================
  //
  // THE WAY OUT OF A DUNGEON IS NOT THE WAY IN RUN BACKWARDS, and this is the
  // first leg that has had to walk one. `travel` plans from the room graph and
  // learns blocked edges by trying them, which is enough anywhere the rooms it
  // is choosing between are all real — and the arena is not: Gloomtide's room
  // is a dead end with one door, so a `travel` issued from inside it plans
  // north into the room it is already in and oscillates until its budget is
  // gone. Step out of the arena by hand, then let `travel` plan from the Lock
  // Gallery, which has somewhere else to be.
  ['goto', 4, 6, 900],
  ['hold', ['down'], 60],
  ['wait', 90],

  // THE KELP LOCKS ARE LEFT BY A WARP, NOT BY A SEAM. `travel` cannot change
  // floors and does not model a stair, so the legs are named one at a time:
  // east into the Locks, down its own shaft into Eel Hall, and from there the
  // rest of the Sanctum is an ordinary walk back through doors this run has
  // already unlocked.
  ['travel', 4, 2, 6000],
  ['travel', 5, 3, 8000],
  ['travel', 4, 3, 8000],
  ['travel', 3, 3, 6000],
  ['travel', 3, 4, 6000],
  ['travel', 3, 5, 6000],
  ['travel', 3, 6, 6000],
  ['travel', 3, 7, 6000],
  ['goto', 4, 6, 900],
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
  // The Weir, and the first lock. The sump band across the middle of it is the
  // dungeon teaching its own vocabulary before anything is riding on it: four
  // squares with no floor at LOW and over your head at MID. The door is in the
  // wall above them, so it is answered on foot at whatever sea you walked in
  // with.
  ['travel', 3, 5, 4000],
  ['fight', 3000, 1200],
  ['goto', 4, 3, 900],
  ['hold', ['up'], 20],
  ['tap', 'a', 30],
  ['goto', 4, 1, 900],
  ['hold', ['up'], 40],
  ['wait', 90],

  // ---------------------------------------------------------------- d4 0,4,4
  // THE CISTERN FLOOR, AND THE SECOND KEY. Three screens of water with a plate
  // at each end: the block holds the western one and you have to be standing
  // on the eastern one, twenty tiles away. NOTHING IS FOUGHT UNTIL THE SEA IS
  // DOWN — at LOW the whole floor drains to walkable sand, and the difference
  // between walking that crossing and swimming it is five quarter-hearts of
  // jellyfish measured either way.
  ['travel', 4, 4, 5000],
  ['tide', 0, 140, 600],
  // THE BLOCK IS PUSHED BEFORE ANYTHING IS FOUGHT, and that order is the
  // whole of this room working. A `fight` is a roam: the swordsman crosses
  // thirty tiles chasing a jellyfish and shoves the block off its own row on
  // the way, and after that `goto 5,1` is a path to a tile the block is
  // standing in — no path, nine hundred frames of standing still, the plate
  // never held, the key never spawned, and every directive after it playing
  // out in the wrong room while the trace looks fine. Pushed first, the plate
  // is down before the fight starts.
  ['goto', 10, 1, 1200],
  ['goto', 5, 1, 900],
  ['hold', ['left'], 60],
  ['fight', 6000, 1500],
  ['goto', 16, 6, 1500],
  ['wait', 60],
  ['dialogue', 400],
  ['loot', 1500],

  // ---------------------------------------------------------------- d4 0,2,4
  // Back west through the Barnacle Cell — nothing is fought in it, because its
  // barnacle is an `hp: 999` turret bolted to the wall and a `fight` in a room
  // holding one never returns — and into the Winch Room for the second lock.
  // The stalfos behind that door took eight quarter-hearts off the first cut
  // of this leg while the actor stood at the keyhole; it is killed first now.
  ['travel', 3, 4, 6000],
  ['travel', 2, 4, 4000],
  ['fight', 5000, 1500],
  ['goto', 3, 3, 900],
  ['hold', ['left'], 20],
  ['tap', 'a', 30],
  ['goto', 1, 3, 900],
  ['hold', ['left'], 40],
  ['wait', 90],

  // ---------------------------------------------------------------- d4 0,1,4
  // The Bellows Vault. One big chest, no enemies, and the Squall Bellows.
  ['goto', 4, 3, 600],
  ['hold', ['up'], 6],
  ['tap', 'a', 40],
  ['dialogue', 600],
  ['wait', 120],
  ['dialogue', 600],
  ['goto', 4, 1, 900],
  ['hold', ['up'], 40],
  ['wait', 90],

  // ---------------------------------------------------------------- d4 0,1,3
  // SILL 1 — THE SQUALL LOFT, WORKED AT MID, and the first time in this run
  // that an item is used by being HELD. The wheel is at the top of a shaft in
  // the west wall with a pit trench between it and anywhere a hand reaches;
  // the shelf you pump from is two squares of floor you swim up to, and the
  // sump under it is a hole at LOW and deep water at MID, so the sea that lets
  // you stand there is the same sea that drowns the wheel.
  //
  // THE BELLOWS GO ON A AND THE SWORD COMES BACK AFTERWARDS. The conch keeps
  // B for the whole of this dungeon — six sills, and every one of them is a
  // question about where the water is — so the held item takes the sword's
  // button, and every room with something to kill in it is cleared before the
  // swap rather than after.
  ['fight', 3000, 1200],
  ['tide', 1, 140, 600],
  ['equip', 'bellows', 'A', 400],
  ['goto', 4, 1, 900],
  ['bellows', 1, 1, 2500],
  ['equip', 'sword', 'A', 400],
  ['goto', 7, 3, 900],
  ['hold', ['right'], 90],
  ['wait', 90],

  // ---------------------------------------------------------------- d4 0,2,3
  // SILL 2 — THE DROWNED SILL, WORKED AT HIGH, and a player who has just
  // learned the Loft will try MID here and get nothing. The shelf is a single
  // square walled in by drown-wall on two sides: the sea has to be UP for you
  // to swim in over the top of it, and the cone is what takes that same sea
  // back off the wheel.
  ['fight', 4000, 1500],
  ['tide', 2, 140, 600],
  ['equip', 'bellows', 'A', 400],
  ['goto', 5, 6, 900],
  ['bellows', 8, 6, 3000],
  ['equip', 'sword', 'A', 400],
  ['goto', 4, 2, 900],
  ['hold', ['up'], 60],
  ['wait', 90],

  // ---------------------------------------------------------------- d4 0,2,2
  // SILL 3 — THE CISTERN GAUGE, a sump shelf again and back at MID. What it
  // pays out is the third Small Key, and the key is a SCRIPT SPAWN: the room
  // puts it back on re-entry if it was released and never picked up, so the
  // loot call here is belt and braces rather than the only chance at it.
  ['fight', 4000, 1500],
  ['tide', 1, 140, 600],
  ['equip', 'bellows', 'A', 400],
  ['goto', 4, 3, 900],
  ['bellows', 1, 3, 3000],
  ['loot', 1500],
  ['equip', 'sword', 'A', 400],

  // ---------------------------------------------------------------- d4 0,2,1
  // THE WEST OVERLOOK, AND IT IS THE HEALTH BUDGET FOR THE REST OF THE
  // DUNGEON. Its pickup is a FAIRY and it is one screen off the path, taken
  // here rather than later because this is the low-water mark of the run: the
  // three sills and the walk to them cost fourteen quarter-hearts, and
  // everything after it — a miniboss, two more sills and Wyverna — is walked
  // from full.
  ['goto', 4, 1, 900],
  ['hold', ['up'], 50],
  ['wait', 90],
  ['fight', 3000, 1200],
  ['loot', 1200],
  ['goto', 4, 6, 900],
  ['hold', ['down'], 50],
  ['wait', 90],
  ['goto', 4, 6, 900],
  ['hold', ['down'], 50],
  ['wait', 90],

  // ---------------------------------------------------------------- d4 0,4,3
  // SILL 4 — THE LONG RACE, a drown-wall shelf turned on its end: the wheel is
  // at the top of the shaft and the stand is under it, so the gust goes UP.
  //
  // THE DARKNUT IN THIS ROOM IS NOT FOUGHT, and that is a measurement rather
  // than a preference. `dFight` loses to it: it lines up on one axis and
  // closes, the darknut's shield covers exactly that, and the first cut of
  // this leg died here taking three quarter-hearts a hit, ten hits, without
  // landing one. It does not have to be fought — at HIGH the shelf is behind
  // four squares of deep water and a darknut does not swim, so the cone is
  // pumped from a square it cannot reach, and the walk out along the bottom
  // row is over before it arrives.
  ['goto', 8, 3, 900],
  ['hold', ['right'], 90],
  ['wait', 90],
  ['fight', 3000, 1200],
  ['goto', 8, 6, 900],
  ['hold', ['right'], 90],
  ['wait', 90],
  ['tide', 2, 140, 600],
  ['equip', 'bellows', 'A', 400],
  ['goto', 2, 4, 1200],
  ['bellows', 2, 1, 3000],
  ['equip', 'sword', 'A', 400],
  ['goto', 5, 6, 1200],
  ['hold', ['right'], 140],
  ['wait', 120],

  // ---------------------------------------------------------------- d4 0,5,3
  // THE IRONKNIGHT GALLERY. The miniboss is not `g.boss` — a miniboss clears
  // `isBoss` so that beating it cannot mark the whole dungeon beaten — so it
  // is named to the fight verb rather than found by it. Fought at HIGH, where
  // the drown-wall pair in the middle of the room is simply gone and there is
  // nothing for it to charge around.
  ['boss', 14000, 'ironknight'],
  ['wait', 120],
  ['fight', 4000, 1500],
  ['dialogue', 600],
  ['goto', 4, 2, 900],
  ['hold', ['up'], 60],
  ['wait', 120],

  // ---------------------------------------------------------------- d4 0,5,2
  // Cliff Walk, and the third lock. Walk into the middle of the room before
  // fighting: a doorway on this screen is a one-tile pocket between two pits,
  // and a path out of one fails to plan at all while a keese is standing over
  // the only square that leaves it.
  ['goto', 4, 5, 1200],
  ['fight', 4000, 1500],
  ['goto', 2, 6, 1500],
  ['wait', 30],
  ['hold', ['left'], 20],
  ['tap', 'a', 60],
  ['wait', 60],
  ['goto', 0, 6, 900],
  ['hold', ['left'], 60],
  ['wait', 90],

  // ---------------------------------------------------------------- d4 0,4,2
  // SILLS 5 AND 6 — THE CROSSED SLUICES, one of each shape, in one room, with
  // the Boss Key behind both. The west wheel is a sump shelf and wants MID;
  // the east wheel is a drown-wall shelf and wants HIGH. You cannot hold two
  // seas, so the run works one side, swims back down to the floor, sounds the
  // conch, and works the other — which is this dungeon's whole idea said out
  // loud in one room. The key lands in the middle rather than on either shelf,
  // so whichever wheel was turned second has to be swum away from to collect
  // it.
  ['fight', 6000, 2000],
  ['tide', 1, 140, 600],
  ['equip', 'bellows', 'A', 400],
  ['goto', 1, 4, 1200],
  ['bellows', 1, 1, 3000],
  ['goto', 4, 6, 1200],
  ['tide', 2, 140, 600],
  ['goto', 8, 4, 1200],
  ['bellows', 8, 1, 3000],
  ['goto', 4, 6, 1200],
  ['wait', 60],
  ['dialogue', 600],
  ['goto', 4, 4, 1200],
  ['loot', 1500],
  ['equip', 'sword', 'A', 400],

  // ---------------------------------------------------------------- d4 0,4,1
  // The East Overlook: a rupee and D4's second Piece of Heart, in the corner
  // furthest from the door.
  ['goto', 4, 1, 1200],
  ['hold', ['up'], 60],
  ['wait', 120],
  ['goto', 4, 4, 1200],
  ['fight', 5000, 1800],
  ['loot', 1500],
  ['goto', 4, 6, 1200],
  ['hold', ['down'], 60],
  ['wait', 120],

  // ------------------------------------------- d4, back west to the boss door
  // Six screens back the way the Boss Key was won, and every one of them has
  // restocked. The fights are named per room rather than left to the walk,
  // because the first cut of this leg walked it without them and died in the
  // Sluices with the key in its pocket.
  ['goto', 4, 6, 1200],
  ['fight', 5000, 1800],
  ['goto', 8, 6, 1200],
  ['hold', ['right'], 90],
  ['wait', 120],
  ['goto', 4, 5, 1200],
  ['fight', 4000, 1500],
  ['goto', 4, 5, 1200],
  ['hold', ['down'], 60],
  ['wait', 120],
  ['goto', 4, 6, 1500],
  ['fight', 6000, 2000],
  ['goto', 1, 6, 1500],
  ['hold', ['left'], 90],
  ['wait', 120],
  // THE LONG RACE IS CROSSED, NOT CLEARED, AND IT IS THE ONE ROOM IN THE
  // DUNGEON THAT IS. Its darknut beats `dFight` outright — the verb lines up
  // on one axis and closes, a darknut's shield covers exactly that, and the
  // first recording of this leg died right here on the way home, eighteen
  // quarter-hearts to nothing in five thousand frames without landing a hit.
  // Nothing in this room is needed on the way back; the bottom row runs the
  // whole width of it and the walk is over before the darknut arrives.
  ['goto', 1, 6, 1500],
  ['hold', ['left'], 90],
  ['wait', 120],
  ['goto', 4, 3, 1500],
  ['fight', 4000, 1500],
  ['goto', 1, 3, 1500],
  ['hold', ['left'], 90],
  ['wait', 120],
  ['goto', 4, 3, 1200],
  ['fight', 5000, 1800],
  ['goto', 4, 2, 1200],
  ['hold', ['up'], 60],
  ['wait', 120],
  ['goto', 4, 5, 1500],
  ['fight', 4000, 1500],
  ['goto', 8, 5, 1500],
  ['goto', 8, 3, 900],
  ['hold', ['right'], 90],
  ['wait', 120],

  // ---------------------------------------------------------------- d4 0,3,2
  // The Cistern Gate. THE SEA GOES TO LOW BEFORE THE BOSS DOOR IS OPENED, NOT
  // AFTER, and it is the whole fight: Wyverna's altitude, her speed and how
  // much of her can be reached are all read off the water. Drained, she is on
  // the cistern floor and permanently open, and the fight measures 2,349
  // frames and six quarter-hearts. Walked in at MID she wins — twenty-four
  // thousand frames, the actor dead, the boss on 2 of 44.
  ['fight', 4000, 1500],
  ['tide', 0, 140, 600],
  ['goto', 4, 3, 900],
  ['hold', ['up'], 24],
  ['tap', 'a', 40],
  ['dialogue', 400],
  ['goto', 4, 1, 900],
  ['hold', ['up'], 60],
  ['wait', 120],

  // ---------------------------------------------------------------- d4 0,3,1
  // WYVERNA, THE SEA WYVERN, and the fourth Essence. `clearAdds` is left off:
  // she sheds keese in her last phase and they are not what kills anyone here,
  // which is the same thing measured the other way round on Gloomtide.
  ['boss', 24000, null],
  ['wait', 240],
  ['goto', 4, 3, 600],
  ['dialogue', 900],
  ['loot', 1200],
  ['dialogue', 900],
  ['wait', 240],

  // ======================= OUT OF THE CISTERN AND ON TO THE SHRINE =========
  //
  // The second dungeon this run has walked out of, and it is the arena problem
  // again: `travel` issued from a room with one door plans into the room it is
  // already standing in. One directive by hand puts the run in the Cistern
  // Gate, and from there ordinary walking works.
  ['goto', 4, 6, 1200],
  ['hold', ['down'], 60],
  ['wait', 120],
  ['travel', 3, 7, 24000],
  ['goto', 4, 6, 1500],
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
  // EVERY ROOM IN THIS DUNGEON IS FOUGHT ON THE FRAME IT IS ENTERED, and that
  // is measured rather than tidy. The Shrine's cast is keese and tektites, and
  // both of them CLOSE: walk in, stand still for two seconds and then fight,
  // and Rootwater Landing costs three hearts; walk in and swing immediately
  // and it costs nothing and is over in 132 frames. The first cut of this leg
  // put a `wait` after every door and arrived at the boss on two hearts.
  //
  // THE SHRINE HAS NO FAIRY. D1's Sunken Hall heals to full, D2's does, D3's
  // does; this dungeon has nothing but what its enemies drop and its two
  // Pieces of Heart, which is why the route takes both of them and takes them
  // BEFORE the locked door rather than after.
  ['goto', 4, 1, 900],
  ['hold', ['up'], 60],

  // ---------------------------------------------------------------- d5 0,3,6
  ['fight', 3000, 1200],
  ['loot', 600],

  // ---------------------------------------------------------------- d5 0,2,6
  // The Silt Gallery, and the Dungeon Map.
  ['travel', 2, 6, 6000],
  ['fight', 3000, 1200],
  ['goto', 4, 2, 1500],
  ['loot', 900],

  // ---------------------------------------------------------------- d5 0,4,6
  // The Bracken Cell: clear it for Small Key 1.
  ['travel', 4, 6, 8000],
  ['fight', 8000, 2500],
  ['dialogue', 400],
  ['loot', 1500],

  // ---------------------------------------------------------------- d5 0,2,5
  // The Chartstone Nave.
  ['travel', 2, 5, 8000],
  ['fight', 4000, 1500],
  ['goto', 4, 3, 1500],
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
  ['goto', 3, 3, 1500],
  ['loot', 1200],
  ['goto', 7, 5, 1500],
  ['tide', 1, 140, 600],

  // ---------------------------------------------------------------- d5 0,4,5
  // The Thicket Cell: the Gillcarve charm.
  ['travel', 4, 5, 12000],
  ['fight', 4000, 1500],
  ['goto', 4, 3, 1500],
  ['wait', 30],
  ['hold', ['up'], 20],
  ['tap', 'a', 60],
  ['dialogue', 600],
  ['loot', 1200],
  ['dialogue', 600],

  // ---------------------------------------------------------------- d5 0,5,5
  // THE BOWER CELL, AND THE FIRST SQUALL BELLOWS SILL OUTSIDE THE CISTERN.
  // A wheel boxed in on three sides with a pit on the fourth, a stand two
  // tiles off across it, and a sump shaft the only way up to the stand —
  // drowned at the same sea the wheel is, so the swim up is made in the water
  // the cone then has to be aimed across. The fourth Piece of Heart falls out
  // of it, and with it the run's third Heart Container: the refill is what
  // pays for the groves, which are the half of this dungeon with no healing
  // anywhere in them.
  ['travel', 5, 5, 8000],
  ['fight', 4000, 1500],
  ['equip', 'bellows', 'A', 400],
  ['goto', 4, 1, 2000],
  ['bellows', 1, 1, 3000],
  ['equip', 'sword', 'A', 400],
  ['dialogue', 600],
  ['loot', 1500],
  ['dialogue', 600],

  // ---------------------------------------------------------------- d5 0,3,5
  // The Standing Grove: four drowned boles in the middle of the floor, which
  // is where this dungeon teaches what a bole IS before anything depends on
  // it, and lock 1 in the wall above them.
  ['travel', 3, 5, 12000],
  ['fight', 4000, 1500],
  ['goto', 4, 3, 1500],
  ['wait', 30],
  ['hold', ['up'], 20],
  ['tap', 'a', 60],
  ['wait', 60],
  ['goto', 4, 1, 900],
  ['hold', ['up'], 60],

  // ---------------------------------------------------------------- d5 0,3,4
  // ROOTBOUND HALL IS CROSSED, NOT CLEARED, and that is measured. The barnacle
  // in the middle of it is what `dFight` cannot finish: the verb keeps closing
  // on a target it is not killing, and on the recording this leg was first
  // made from it spent five thousand frames doing that and took forty
  // quarter-hearts — a full Heart Container's worth, the one the Bower Cell
  // had just paid for — without the room being needed at all. Nothing in here
  // is on the way to anything; the east door is four tiles from the south one.
  ['goto', 8, 4, 1500],
  ['hold', ['right'], 90],

  // ---------------------------------------------------------------- d5 0,4,4
  // The Sunken Bracken: two blocks onto two plates for Small Key 2. Pushed
  // BEFORE anything is fought, for the reason the Cistern Floor wrote down —
  // a roaming `fight` shoves a block off the row the puzzle needs it on and
  // every directive after it plans a path into the tile the block is now
  // standing in.
  ['fight', 5000, 1800],
  ['loot', 600],
  ['goto', 4, 1, 1500],
  ['hold', ['left'], 120],
  ['wait', 60],
  ['goto', 5, 6, 1500],
  ['hold', ['right'], 120],
  ['wait', 60],
  ['dialogue', 400],
  ['goto', 4, 6, 1500],
  ['loot', 1500],

  // ---------------------------------------------------------------- d5 0,2,4
  // The Warden's Sill: lock 2, in a one-tile corridor with no way round it at
  // any sea. "Past this door the floor is a thing you bring with you."
  ['travel', 2, 4, 12000],
  ['fight', 5000, 1800],
  ['loot', 600],
  ['goto', 3, 3, 1500],
  ['wait', 30],
  ['hold', ['left'], 20],
  ['tap', 'a', 60],
  ['wait', 60],
  ['goto', 0, 3, 900],
  ['hold', ['left'], 60],

  // ---------------------------------------------------------------- d5 0,1,4
  // The Reefseed Vault.
  ['goto', 4, 3, 1500],
  ['wait', 30],
  ['hold', ['up'], 20],
  ['tap', 'a', 60],
  ['dialogue', 600],
  ['loot', 1200],
  ['dialogue', 600],
  ['goto', 4, 1, 900],
  ['hold', ['up'], 60],

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
  ['reefseed', 6, 4, 900],
  ['tide', 0, 140, 600],
  ['equip', 'sword', 'A', 400],
  ['goto', 6, 4, 1500],
  ['wait', 30],
  ['hold', ['right'], 20],
  ['tap', 'a', 60],
  ['wait', 60],
  ['goto', 8, 4, 1500],
  ['hold', ['right'], 90],

  // ---------------------------------------------------------------- d5 0,2,3
  // GROVE 2, the Bole Walk — the same fixture turned through a right angle and
  // pointed north, so the throw that opens it is the one aimed away from the
  // door you came in by. Cleared first: this room is walked through three
  // times and its tektite was taking a heart on each pass.
  ['fight', 2500, 900],
  ['loot', 600],
  ['equip', 'reefseed', 'A', 400],
  ['tide', 2, 140, 600],
  ['reefseed', 4, 3, 900],
  ['tide', 0, 140, 600],
  ['equip', 'sword', 'A', 400],
  ['goto', 4, 3, 1500],
  ['wait', 30],
  ['hold', ['up'], 20],
  ['tap', 'a', 60],
  ['wait', 60],
  ['goto', 4, 1, 1500],
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
  ['reefseed', 3, 4, 900],
  ['tide', 0, 140, 600],
  ['equip', 'sword', 'A', 400],
  ['goto', 3, 4, 1500],
  ['wait', 30],
  ['hold', ['left'], 20],
  ['tap', 'a', 60],
  ['wait', 60],
  ['goto', 1, 4, 1500],
  ['wait', 30],
  ['hold', ['down'], 20],
  ['tap', 'a', 60],
  ['dialogue', 600],
  ['loot', 1200],
  ['dialogue', 600],
  ['goto', 4, 6, 2000],
  ['hold', ['down'], 90],

  // ---- back through the Bole Walk and east into the Grove Crossing
  ['goto', 8, 4, 2000],
  ['hold', ['right'], 90],

  // ---------------------------------------------------------------- d5 0,3,3
  // The Grove Crossing: lock 3, and it is opened from the WEST side, because
  // the west side is the side the groves let you in on.
  ['fight', 4000, 1500],
  ['loot', 600],
  ['goto', 1, 4, 1500],
  ['wait', 30],
  ['hold', ['right'], 20],
  ['tap', 'a', 60],
  ['wait', 60],
  ['goto', 8, 2, 1500],
  ['hold', ['right'], 90],

  // ---------------------------------------------------------------- d5 0,4,3
  // GROVE 4, the Long Ford, pointed south — the first with the bank on the far
  // side of the pool from the door, so the throw is set up by walking round
  // the water rather than by standing where you came in.
  ['fight', 4000, 1500],
  ['loot', 600],
  ['equip', 'reefseed', 'A', 400],
  ['tide', 2, 140, 600],
  ['reefseed', 4, 3, 900],
  ['tide', 0, 140, 600],
  ['equip', 'sword', 'A', 400],
  ['goto', 4, 3, 1500],
  ['wait', 30],
  ['hold', ['down'], 20],
  ['tap', 'a', 60],
  ['wait', 60],
  ['goto', 8, 6, 1500],
  ['hold', ['right'], 90],

  // ---------------------------------------------------------------- d5 0,5,3
  // Thornvine, the Shrine's miniboss, and the north arch it is holding shut.
  ['boss', 14000, 'thornvine'],
  ['wait', 120],
  ['fight', 4000, 1500],
  ['dialogue', 600],
  ['loot', 900],
  ['goto', 4, 2, 1500],
  ['hold', ['up'], 90],

  // ---------------------------------------------------------------- d5 0,4,2
  // GROVE 5, THE SHRINE FORD, three screens wide, and the fixture built twice
  // over because the snarl is out of range of any bank. The first stake is
  // thrown at HIGH from dry ground; the second is thrown at LOW from the
  // first, which means standing on something that did not exist when it was
  // thrown and will not be there if the sea is let back up.
  //
  // NOTHING IS FOUGHT IN THIS ROOM. It is thirty tiles wide, and a `fight`
  // here walks the whole of it after a keese — six thousand frames, both
  // stakes' worth of harassment, and the first recording of this leg died in
  // it with the Boss Key still in its chest.
  ['equip', 'reefseed', 'A', 400],
  ['tide', 2, 140, 600],
  ['reefseed', 13, 4, 900],
  ['tide', 0, 140, 600],
  ['reefseed', 11, 4, 1200],
  ['equip', 'sword', 'A', 400],
  ['goto', 11, 4, 1500],
  ['wait', 30],
  ['hold', ['left'], 20],
  ['tap', 'a', 60],
  ['wait', 60],
  ['goto', 4, 4, 2000],
  ['wait', 30],
  ['hold', ['up'], 20],
  ['tap', 'a', 60],
  ['dialogue', 600],
  ['loot', 1200],
  ['dialogue', 600],
  ['goto', 0, 4, 1500],
  ['hold', ['left'], 90],

  // ---------------------------------------------------------------- d5 0,3,2
  // Rootmaw Arch. THE SEA IS LEFT AT LOW THROUGH THE BOSS DOOR, and that is
  // the fight: Rootmaw drinks and heals at HIGH and his roots are bared and
  // soft at LOW, and the arena pins whatever level is carried into it.
  ['fight', 4000, 1500],
  ['goto', 4, 2, 1500],
  ['wait', 30],
  ['hold', ['up'], 24],
  ['tap', 'a', 40],
  ['dialogue', 400],
  ['goto', 4, 1, 900],
  ['hold', ['up'], 60],
  ['wait', 120],

  // ---------------------------------------------------------------- d5 0,3,1
  // ROOTMAW, THE DROWNED WOOD, and the fifth Essence.
  ['boss', 24000, null],
  ['wait', 240],
  ['goto', 4, 3, 900],
  ['dialogue', 900],
  ['loot', 1200],
  ['dialogue', 900],
  ['wait', 240],
];

/**
 * Where the run ends, and what that now means.
 *
 * IT REACHES FOUR ESSENCES. Tidewash Grotto, the Coral Spire, the Bogwater
 * Sanctum and the Cliffside Cistern, walked in order with nothing granted:
 * every Small Key from all four dungeons earned and spent, the Anchor, the
 * Lens, the Bombs, the Kelp-Soled Cleats and the Squall Bellows all taken out
 * of the chests that hold them, two Heart Containers completed out of pieces
 * found on the way, a miniboss beaten and four bosses beaten in real combat.
 *
 * WHAT THE D4 LEG ADDED THAT NO EARLIER LEG COULD CLAIM:
 *
 *   * A DUNGEON WAS LEFT ON FOOT. Every leg before this one ended in an arena
 *     and began again on the overworld; nothing had walked the Sanctum
 *     backwards. An arena is a dead end with one door, so a `travel` issued
 *     from inside one plans into the room it is already in and oscillates
 *     until its budget is gone — the way out is one directive by hand and
 *     then ordinary walking.
 *   * THE CLIFFS OF KELL COST A SECOND BOMB. The Deep Cut's east bank is a
 *     rockfall with a one-tile pocket behind it, and D4's door is past it.
 *   * THE BELLOWS WERE HELD RATHER THAN CARRIED. Six wheels stand where no
 *     hand reaches, each drowned at the sea its own room is played at; the
 *     same held breath that turns one is what takes the water off it. Three
 *     want MID, three want HIGH, and the Boss Key is behind the last two — so
 *     a run that reached Wyverna worked every one of them.
 *
 * WHAT IS STILL NOT DRIVEN, so the next session does not have to find it: the
 * Drowned Wood Shrine and the Abyssal Keep, the Coastwise Chain, the Salt Pans
 * and the Keep's story gate, and Rootmaw and Nereth. Of those two fights only
 * Rootmaw and Nereth have ever been measured as winnable at all (5 in 10 and
 * 3 in 10 on `measure-boss-combat`'s own points) and neither has been beaten
 * on the seed this run uses.
 *
 * THE VERB THIS LEG BOUGHT, for the same reason `tide` and `soles` exist: a
 * route may not count button presses at an item whose effect is not a press.
 * `['bellows', tx, ty]` names THE WHEEL and holds the button until that wheel
 * is open — `needTurns` is 30 on one sill and 50 on another, and a route that
 * held for a number would be carrying a private copy of room data.
 *
 * THREE THINGS THIS LEG PAID FOR BY HAND, all of them the same shape — a verb
 * that is right in general and wrong in one room:
 *
 *   * `dFight` ROAMS, AND THE CISTERN FLOOR IS THIRTY TILES WIDE. A fight in
 *     that room shoves its push block off the row the puzzle needs it on, and
 *     the `goto` afterwards is a path into a tile the block is standing in —
 *     no path, no push, no key, and every directive after it playing out
 *     somewhere else while the trace looks fine. The block is pushed first.
 *   * `dFight` LOSES TO A DARKNUT, which is the crab of S115 one enemy along:
 *     it lines up on one axis and closes, and a darknut's shield covers
 *     exactly that. The Long Race is crossed rather than cleared.
 *   * A `travel` INTO A ROOM WHOSE ONLY EXIT IS A DOORWAY POCKET can leave
 *     the actor somewhere no path plans from. Cliff Walk is walked into the
 *     middle of before anything is fought there.
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
  essences: [1, 2, 3, 4, 5],
  // The room the run finishes in: Rootmaw's arena, with five Essences taken.
  room: 'd5/0,3,1',
  needsVerb: null,
  keysNeeded: 14,
  keysObtainable: 14,
};
