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
    note: 'Tidewatch Village, east into Village East and back, past the wandering villagers',
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
      // RE-RECORDED FOR THE TWO-SCREEN VILLAGE. The shop moved east onto
      // `0,5,7` when the village grew a second screen, which turned the old
      // shopfront into open ground and turned Village East from a coast screen
      // into the other half of the town — so the frame counts are not
      // comparable with the one-screen recording. The route is the same idea:
      // the length of the square, the bottom of it, out east and back.
      //
      // Row 5 is the square's open row, clear of the hearth's doorway — a
      // `goto` that ended on a door would warp mid-run — and clear of the
      // salter, who stands at 8,5.
      ['goto', 1, 5, 300],
      ['wait', 20],
      ['goto', 3, 6, 300],
      // Back up into the square and across to the east side. Row 6 is the
      // strip in front of the treeline and it is where the wandering villager
      // lives; a `goto` that crosses it spends its whole budget shouldering
      // past her, which is what ended one recording two screens west of the
      // village. Row 5 is the wide one.
      ['goto', 6, 5, 400],
      ['goto', 8, 3, 400],
      ['wait', 40],
      // Out east into Village East, then straight back. Two seams, two
      // reconcileWithTide calls, two chances to land on a different pixel.
      ['exit', 'right', 300],
      ['goto', 1, 5, 400],
      ['wait', 30],
      ['exit', 'left', 300],
      ['goto', 4, 5, 400],
      ['wait', 60],
    ],
  },

  // -------------------------------------------------------------------------
  // THE DOOR. A block's doorway, walked through in the engine.
  //
  // check-towns.mjs proves the doorway is a warp, that the warp names it, that
  // the interior warps back and that the return lands on ground. All four are
  // claims about DATA. What no checker can say is that a player walking north
  // into the middle cell of a building's front row ends up inside it — that
  // needs `mask: 0` to actually let him onto a tile whose flags say SOLID, the
  // warp to fire from the feet tile rather than the body, and the return trip
  // not to bounce straight back through the door it arrived on.
  //
  // The run: stand in the square, walk up into the SHOP, wait, walk down and
  // out. `roomChanges: 2` is the assertion with teeth — exactly two, so the
  // door fired once each way and the return did not re-trigger it.
  // -------------------------------------------------------------------------
  'village-shop-door': {
    note: 'Village East: in through the shop doorway and back out to the yard',
    setup: {
      seed: 20260806,
      playerName: 'LINK',
      items: { sword: 1, conch: 1 },
      equipB: 'sword',
      equipA: 'conch',
      tide: 1,
      // THE SHOP IS ON `0,5,7` NOW. The village became two screens and the
      // shop went east with the well, so this scenario starts in the Village
      // East yard rather than in the square, two tiles below the shop's
      // doorway at 4,4 and well clear of the wandering child's home tile at
      // 2,5 — which matters because canOccupy reads solid entities, and
      // spawning inside one fails reconcileWithTide and lets findSafeTile snap
      // the player off-route before a button is pressed.
      //
      // x IS 64, NOT THE TILE'S MIDDLE. The player's hitbox is `x+3` wide by
      // ten, so a player standing at a column's centre straddles the column to
      // its right — harmless in the open, fatal in a doorway one tile wide
      // with the shopfront either side of it. At 64 the box is 67..77 and
      // fits inside the door's own column; at 72 it is 75..85, catches the
      // solid front at 5,4, and the walk up simply stops dead below the door.
      enter: ['overworld', 0, 5, 7, 64, 96, 'down'],
    },
    steps: [
      ['wait', 20],
      // Straight up into the doorway at 4,4, through the doorstep below it.
      // Ninety frames rather than sixty: the warp reads the FEET tile,
      // `floor((y + 12) / 16)`, so standing centred on the doorway is not yet
      // standing in it — the player has to walk a further twelve pixels past
      // the tile's middle before the door fires, and two tiles of approach
      // plus that overshoot does not fit in sixty.
      ['hold', ['up'], 90],
      ['wait', 40],
      // Inside the shop, and out again through its own door on the floor.
      ['goto', 5, 5, 300],
      // Twenty-four frames, not sixty: the door lands the player at 72,88,
      // which is two tiles from the yard's south edge, and a longer hold walks
      // him out of the village and fires a third transition.
      ['hold', ['down'], 24],
      ['wait', 60],
    ],
    assert: { roomChanges: 2 },
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
      + 'a pipe no setting of the conch crosses',
    // REBUILT AT ORACLE SIZE (S137). The pipe is a 15x11 room whose two bands
    // run wall to wall; Link starts on the last dry column before the wells
    // (4,5), the iron bites at 6,5 and the patch covers x=4..8, and the probes
    // read a well inside it (6,5) against a drain outside it (10,5).
    setup: {
      seed: 20260806,
      playerName: 'LINK',
      items: { sword: 1, conch: 1, shield: 1, anchor: 1 },
      equipB: 'anchor',
      equipA: 'conch',
      tide: 0,
      enter: ['d1', 0, 4, 2, 64, 80, 'right'],
      probes: [[6, 5], [10, 5]],
    },
    steps: [
      ['wait', 30],
      // Throw it east. It bites two tiles in, at LOW, and holds the wells.
      ['tap', 'b', 60],
      ['wait', 40],
      // Conch: LOW -> MID. Everything the iron is not holding fills up.
      ['tap', 'a', 120],
      ['wait', 40],
      // Straight down the pipe: 145 frames at 1px/f clears the drains and
      // stops on the dry column before the east door.
      ['hold', ['right'], 145],
      ['wait', 40],
    ],
  },

  // -------------------------------------------------------------------------
  // Coral Spire, The First Fork: take the WRONG shaft on purpose.
  //
  // check-lens.mjs proves this room against a model. This proves the engine
  // agrees with the model, and it deliberately proves the half that is easy to
  // get wrong in data and impossible to get wrong in a checker: THE COST.
  //
  // Four claims, in order:
  //   1. the room pins the tide. `tideForce: 0` puts the sea at LOW on entry
  //      whatever the player walked in with — the setup below says `tide: 1`
  //      and the first probe reads LOW anyway.
  //   2. the ledge is one-way. The actor hops EAST off the shelf and from that
  //      moment the shelf is behind a lip it cannot climb.
  //   3. the sluice is the only thing that moves the water, and it moves it one
  //      step. The probes read MID after the valve, at both shafts.
  //   4. the east shaft does not open. It is `dPit` at LOW and `dPit` at MID
  //      and the actor is still in the alcove after walking into it.
  // Then it takes the stair, which is the walk back, and `roomChanges: 1` is
  // the assertion that it left the room exactly once and by that route.
  //
  // The actor cannot read a Lens overlay, so it cannot make this choice for the
  // right reason. It is scripted into the wrong branch, which is what a player
  // without the Lens is doing too — that is the whole point of the room.
  // -------------------------------------------------------------------------
  'd2-fork-wrong': {
    note: 'The First Fork: pinned at LOW, hop the east ledge blind, open the sluice, '
      + 'and find the shaft is still a hole',
    setup: {
      seed: 20260806,
      playerName: 'LINK',
      items: { sword: 1, conch: 1, shield: 1, lens: 1 },
      equipB: 'lens',
      equipA: 'conch',
      maxHearts: 12,
      hearts: 12,
      tide: 1,
      enter: ['d2', 1, 4, 3, 112, 152, 'up'],
      probes: [[3, 2], [11, 2]],
    },
    steps: [
      ['wait', 30],
      // Up the entry corridor onto the shelf, then east along it (S137: the
      // room is a 15x11 Oracle cell; the shelf is row 6).
      ['goto', 9, 6, 300],
      ['wait', 20],
      // Into the face of the `>` ledge. One way; the shelf is gone after this.
      ['hold', ['right'], 60],
      ['wait', 30],
      // Up beside the sluice and face it.
      ['goto', 12, 6, 200],
      ['hold', ['down'], 8],
      ['tap', 'a', 120],
      ['wait', 60],
      // Into the shaft. It is still a hole: the actor drops, loses two
      // quarter-hearts, and is put back at its lip.
      ['goto', 11, 5, 200],
      ['hold', ['up'], 80],
      ['wait', 30],
      // The stair beside the alcove: the walk back, and the only way out.
      ['goto', 12, 5, 200],
      ['wait', 60],
    ],
    assert: { roomChanges: 1 },
  },

  // -------------------------------------------------------------------------
  // The Undertow, and the whole of D3 in one run: the surface loses to the
  // current, the seafloor walks through it.
  //
  // check-cleats.mjs proves this against a model of the room. This proves the
  // GAME agrees with the model, which is a different claim and the one that
  // catches a push applied in the wrong place. The first half is the assertion
  // with teeth: sixty frames of holding LEFT while swimming, into a current
  // that is stronger than swimming, and the player must come out no further
  // west than he went in.
  'd3-undertow': {
    note: 'The Undertow: swim west into the torrent and lose ground, then take '
      + 'the soles down and walk the same channel',
    setup: {
      seed: 20260806,
      playerName: 'LINK',
      items: { sword: 1, conch: 1, shield: 1, cleats: 1 },
      equipB: 'cleats',
      equipA: 'shield',
      maxHearts: 12,
      hearts: 12,
      tide: 1,
      // S139: the Undertow is an Oracle room, 15x11, and its east bank is
      // column 13 with the door at row 5.
      enter: ['d3', 0, 2, 3, 208, 80, 'left'],
    },
    steps: [
      ['wait', 30],
      // Swimming. Into the channel and hold west against it: he gets his head
      // into the current and it holds him at the lip, which is the claim.
      ['hold', ['left'], 90],
      ['wait', 20],
      // Take the soles down. Toggling while ALREADY in deep water dives at
      // once and says nothing — the dry-land branch is the one that opens a
      // text box, and a box freezes the actor for as long as it is up.
      ['tap', 'b', 40],
      ['wait', 40],
      // The same press, the same channel, and now nothing is pushing back.
      ['hold', ['left'], 420],
      ['wait', 40],
    ],
    // One room change in the whole run, and it is the west door of the
    // Undertow. The swim half must therefore have crossed nothing: if the
    // current ever stopped holding him, this run would leave the room twice.
    assert: { roomChanges: 1 },
  },

  // -------------------------------------------------------------------------
  // The Squall Loft, and the whole of D4 in one run: the wrong sea does
  // nothing, the right sea turns the wheel.
  //
  // check-bellows.mjs proves this room against a model — that nothing reaches
  // the wheel by hand, that no sea level frees it anywhere you can stand. This
  // proves the half a model cannot see: that the ENGINE agrees, and in
  // particular that a wheel under deep water refuses a gust it is standing
  // inside of.
  //
  // The run does the same thing twice and gets two different answers:
  //
  //   1. AT HIGH. Swim up the sump shaft onto the shelf, pump, turn to face
  //      the wheel — the cone is open, and the probes prove it: (1,1) reads MID
  //      inside the cone while (7,4) reads HIGH outside it, in the same frame.
  //      The wheel is `dWell`, which is deep at MID as well, so it stays
  //      smothered and nothing opens. One level of cone is not enough here and
  //      the run is the demonstration.
  //   2. AT MID. Two presses of the conch (HIGH -> LOW -> MID, and the LOW step
  //      is why the actor has to already be standing on the shelf — at LOW the
  //      sump under it is an open pit). Pump again: (1,1) now reads LOW, the
  //      wheel is in shallow water, and it turns.
  //
  // Then it leaves through the door the wheel opened, and `roomChanges: 1` is
  // the assertion that it left exactly once and by that route — the room's
  // other exit is the way it came in, back down to the Bellows Vault.
  //
  // Note the shape of the pumping directive: `b` alone first, then `b` and
  // `left` together. The turn has to happen AFTER the cone opens, because
  // `Player.updateBellows` only takes your feet once `bellowsOpen` is true —
  // press left during the warm-up and the actor walks into the pit trench
  // instead of aiming across it. That is a real cost of the item and the
  // recording pays it.
  // -------------------------------------------------------------------------
  // -------------------------------------------------------------------------
  // The First Stake: throw at HIGH, stand at LOW.
  //
  // THIS IS THE ONE THAT CHECKS THE MODEL. `tools/check-reefseed.mjs` proves
  // every grove in the Drowned Wood Shrine off a REPRODUCTION of the seed's
  // flight — the arc, the two-pixel carry, and `room.solidAt` with the thrown
  // seed's own caps — because items.js reaches for a canvas on the way in and
  // cannot be imported into a plain Node tool. A reproduction is only worth
  // what its agreement with the engine is worth, so this run makes the engine
  // do it: one seed, thrown from 4,4 with a drowned bole standing in 5,4, at
  // HIGH, where the model says it clears the bole and comes down on 6,4.
  //
  // Then the conch takes the sea back down two steps and the pillar it left
  // becomes dry stone, and Link walks round the bole — solid again at LOW — and
  // climbs out of the pool onto a tile that was open water when he threw at it.
  // The probes are the stake and the snarl beside it, so the checkpoint trail
  // carries what those two tiles look like on every frame of the run.
  //
  // WHAT IT DOES NOT DO is cut the snarl, and that is a fact about the B and A
  // buttons rather than about the room: the grove wants the Reefseed, the conch
  // and the sword, a replay's equipment is fixed in its setup, and there are
  // two slots. The throw and the sea are the half a reproduction could get
  // wrong; the swing is `Player.startSwing`'s own `inDeep` guard, which
  // check-items.mjs exercises directly.
  // -------------------------------------------------------------------------
  'd5-overthrow': {
    note: 'The First Stake: a seed thrown at HIGH clears the drowned bole and grows '
      + 'a pillar you can only stand on once the sea is back down',
    setup: {
      seed: 20260806,
      playerName: 'LINK',
      items: { sword: 1, conch: 1, shield: 1, cleats: 1, reefseed: 1 },
      equipB: 'reefseed',
      equipA: 'conch',
      maxHearts: 12,
      hearts: 12,
      tide: 1,
      enter: ['d5', 0, 1, 3, 152, 88, 'right'],
      probes: [[11, 5], [12, 5]],
    },
    steps: [
      // S151: the room's keese is Seasons' keese now and flies over the snarl
      // that used to seal it in; this settle lets its first flight pass before
      // Link walks to the bank, so it is not knocked off his mark.
      ['wait', 240],
      // Straight to the bank and hard up against the bole, which at MID is a
      // tree and will not let him past. Walking into it is how the facing is
      // set: there is no aim button, and `tap` throws wherever Link is looking.
      // Nothing is fought on the way, and nothing needs to be — the room's two
      // enemies are sealed on the far side of the snarl. That is also why the
      // sword is not on B: the Reefseed is, because a replay's equipment is
      // fixed in its setup.
      ['goto', 9, 5, 400],
      ['hold', ['right'], 60],
      ['wait', 20],
      // MID -> HIGH. The conch runs 2 -> 0 -> 1 -> 2, so this is one press.
      ['tap', 'a', 90],
      ['wait', 30],
      // One seed, thrown east. The bole is under water now and the seed goes
      // straight over it; the long gap is the settle plus the two seconds of
      // growing, and the probes carry what 6,4 looks like across all of it.
      ['tap', 'b', 240],
      ['wait', 20],
      // HIGH -> LOW. The pillar is dry stone only here, and the bole is a tree
      // again, so the way to it is round the north rather than straight at it.
      ['tap', 'a', 100],
      ['wait', 30],
      ['goto', 10, 4, 400],
      ['wait', 20],
      // East into the pool — deep at every sea, which is why it is a pool and
      // not a puddle — and then south, out of the water onto what he threw.
      ['hold', ['right'], 50],
      ['wait', 20],
      // Twenty-two frames and not one more: south of the stake is a sump, which
      // at LOW is an open hole, and a hold long enough to cross the pillar walks
      // straight off the far edge of it.
      ['hold', ['down'], 22],
      ['wait', 60],
    ],
    // The claim, and it is the whole reason this run exists: the tile the model
    // said the seed would come down on IS a coral pillar when the run ends, and
    // the snarl beside it is still standing.
    assert: { roomChanges: 0, probeNames: 'coralPillar|dSnarl' },
  },

  'd6-mooring': {
    note: 'The Drowned Stand: the line hauls Link over a shaft at LOW, and the same '
      + 'drag over the same floor finds nothing until the sea is put back on it',
    setup: {
      seed: 20260806,
      playerName: 'LINK',
      items: { sword: 1, conch: 1, shield: 1, cleats: 1, dredge: 1 },
      equipB: 'dredge',
      equipA: 'conch',
      maxHearts: 12,
      hearts: 12,
      tide: 0,
      // On the shelf at 8,7, already facing the mooring. There is no aim button
      // and a hold long enough to turn him would walk him into the shaft, which
      // is a pit at every sea — so the facing is set by the entry rather than by
      // a step, the way d5-overthrow sets it by walking into a tree.
      enter: ['d6', 1, 3, 4, 128, 112, 'up'],
      probes: [[8, 4], [10, 2]],
    },
    steps: [
      ['wait', 30],
      // One cast. The weight goes over two tiles of open shaft, snags the post
      // at 8,3, and hauls Link across to 8,4 — `moveEntity` with `jumping` and
      // `swim` both set, so the hole under him is simply not consulted.
      ['tap', 'b', 120],
      ['wait', 30],
      // LOW -> MID. Now the shelf he braced on is over his head, so the way he
      // came is shut behind him until he puts the sea back.
      ['tap', 'a', 100],
      ['wait', 30],
      // East along the far bank to the silted ring, and drag.
      ['goto', 10, 4, 300],
      ['hold', ['up'], 6],
      ['wait', 20],
      ['tap', 'b', 150],
      // And walk onto what came up. The recorded `rupees` is the assertion that
      // the drag actually paid — the first cut of this run dragged the right
      // tile, banked the secret, and finished with an empty purse and every
      // other field matching, which is precisely the shape of failure this
      // dungeon's mechanic makes easy.
      ['hold', ['up'], 24],
      ['wait', 60],
    ],
    // roomChanges: 0 is the claim with teeth. The shaft runs the full width of
    // the room, so the only ways out are the two doors — and Link ends the run
    // on the far bank without having touched either. He was carried.
    assert: { roomChanges: 0, probeNames: 'dFloorAbyss|dSilt' },
  },

  'd4-drowned-sill': {
    note: 'The Squall Loft: pump at HIGH and the drowned wheel refuses, pump at MID '
      + 'and it turns',
    setup: {
      seed: 20260806,
      playerName: 'LINK',
      items: { sword: 1, conch: 1, shield: 1, cleats: 1, bellows: 1 },
      equipB: 'bellows',
      equipA: 'conch',
      maxHearts: 12,
      hearts: 12,
      tide: 2,
      enter: ['d4', 0, 1, 3, 68, 100, 'up'],
      probes: [[1, 1], [7, 4]],
    },
    steps: [
      ['wait', 30],
      // North up the shaft: floor, then two squares of sump that are deep at
      // HIGH, then the shelf. He stops against the wall at the top.
      ['hold', ['up'], 150],
      ['wait', 20],
      // Pump, then turn into the trench. The cone opens west across two pits.
      ['hold', ['b'], 30],
      ['hold', ['b', 'left'], 150],
      ['wait', 30],
      // HIGH -> LOW -> MID. The shelf is dry at every level, which is the only
      // reason it is safe to stand here while the sump below turns to a hole.
      ['tap', 'a', 90],
      ['tap', 'a', 90],
      ['wait', 30],
      // The same stance, one sea lower, and this time the wheel comes round.
      ['hold', ['b'], 30],
      ['hold', ['b', 'left'], 150],
      ['wait', 60],
      // Down the shaft — deep again at MID. Short of the room's south exit on
      // purpose: this run must leave by the door it opened and by nothing else.
      ['hold', ['down'], 100],
      ['wait', 20],
      ['goto', 13, 5, 300],
      ['hold', ['right'], 120],
      ['wait', 40],
    ],
    assert: { roomChanges: 1 },
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
    note: 'Tidewash Grotto: entrance to the Locked Stair — fighting through, the '
      + 'Dungeon Map and the Chartstone, the Crab Pit key spent on the first key door, '
      + 'and a full tide cycle',
    // REBUILT AT ORACLE SIZE (S137): 15x11 rooms, doors in the middle of each
    // wall, and the first key door in the Tide Gallery's north wall.
    setup: {
      seed: 20260806,
      playerName: 'LINK',
      items: { sword: 1, conch: 1, shield: 1 },
      equipB: 'sword',
      equipA: 'conch',
      maxHearts: 30,
      hearts: 30,
      tide: 1,
      enter: ['d1', 0, 3, 7, 112, 144, 'up'],
    },
    steps: [
      ['wait', 20],
      ['goto', 7, 6, 400],
      ['tap', 'a', 120],
      ['tap', 'a', 120],
      ['dialogue', 200],
      ['goto', 7, 1, 400],
      ['exit', 'up', 400],
      // The Drinking Floor, waded at LOW.
      ['fight', 1400],
      ['dialogue', 200],
      ['goto', 7, 1, 800],
      ['exit', 'up', 400],
      // The Sunken Hall.
      ['fight', 1400],
      ['dialogue', 200],
      ['goto', 1, 5, 400],
      ['exit', 'left', 400],
      // The Map Alcove: the map lies in a pocket of blocks, open to the east.
      ['fight', 900],
      ['goto', 8, 5, 500],
      ['goto', 7, 5, 200],
      ['dialogue', 200],
      ['wait', 40],
      ['goto', 13, 5, 400],
      ['exit', 'right', 400],
      ['goto', 13, 5, 500],
      ['exit', 'right', 400],
      // The Chartstone Alcove, opened from the south.
      ['fight', 900],
      ['goto', 7, 6, 500],
      ['hold', ['up'], 24],
      ['tap', 'a', 30],
      ['dialogue', 300],
      ['goto', 1, 5, 400],
      ['exit', 'left', 400],
      ['goto', 7, 1, 600],
      ['exit', 'up', 400],
      // The Tide Gallery, then west to the Crab Pit.
      ['fight', 1200],
      ['dialogue', 200],
      ['goto', 1, 5, 400],
      ['exit', 'left', 400],
      ['fight', 1800],
      ['dialogue', 300],
      ['goto', 7, 6, 400],
      ['goto', 7, 5, 200],
      ['wait', 60],
      ['goto', 13, 5, 400],
      ['exit', 'right', 400],
      // The key on the Gallery's north door, and through.
      ['goto', 7, 1, 500],
      ['hold', ['up'], 24],
      ['tap', 'a', 30],
      ['dialogue', 300],
      ['exit', 'up', 400],
      ['fight', 1800],
      ['dialogue', 200],
      ['wait', 60],
    ],
  },


  // -------------------------------------------------------------------------
  // Clawcrab Den, walked end to end: the multi-screen room proof.
  //
  // THE WALK IS NOT THE ASSERTION, the same way it is not in tide-steps-split.
  // A player crossing a twenty-tile room and arriving somewhere would also
  // happen if the room were two ordinary rooms with a seam between them — the
  // route would look the same and the recording would replay the same. What
  // separates the two is in the `assert` block, and both halves of it matter:
  //
  //   roomChanges: 1   Exactly ONE transition fires in the whole run: the one
  //                    at the boundary between the Drowned Chamber and the den.
  //                    The
  //                    internal screen seam at x=10 is crossed twice and fires
  //                    nothing. If a seam were still a boundary this would be 3.
  //   camMaxX: 160     The camera reached the east clamp, `room.pw - VIEW_W`.
  //                    That is the far half of the room actually being on
  //                    screen, not merely being in the data.
  //   camEndX: 0       ...and came back to the west clamp. Reaching one end
  //                    only would pass with a camera that could not go back.
  //   camMaxY: 0       The room is one screen tall, so the vertical clamp is
  //                    empty and the camera never moves on that axis. This is
  //                    the same property that makes every 1x1 room in the game
  //                    provably unaffected, asserted on an axis of a room that
  //                    is not 1x1 — the only place it can be observed at all.
  //
  // The route uses `goto` rather than a held direction because the Clawcrab is
  // in the way and shoves; a held `right` would record whatever the shove did.
  // Twenty hearts for the reason d1-descent states — the scripted swordsman
  // eats contact damage a human would step out of, and this replay is about
  // the camera, not about the fight being survivable on three.
  // -------------------------------------------------------------------------
  'd1-clawcrab-den-wide': {
    note: 'Clawcrab Den (2x1, 30x11 at Oracle size): east to the far wall and down, '
      + 'then back to the north-west corner — one transition, camera to every clamp',
    // AT ORACLE SIZE (S137) the den is thirty tiles by eleven, so the camera
    // has both axes to travel: 320px east and 48px south.
    setup: {
      seed: 20260806,
      playerName: 'LINK',
      items: { sword: 1, conch: 1, shield: 1 },
      equipB: 'sword',
      equipA: 'conch',
      maxHearts: 20,
      hearts: 20,
      tide: 1,
      // Starting in the NEIGHBOUR, so the one transition in the run is a real
      // room boundary: the Drowned Chamber's south door. The west way in is a
      // key door, and this run carries no key.
      enter: ['d1', 0, 5, 2, 112, 128, 'down'],
    },
    steps: [
      ['wait', 20],
      ['goto', 7, 9, 400],
      ['exit', 'down', 300],
      ['wait', 30],
      // East to the far wall, low: the camera clamps at 320,48.
      ['goto', 28, 9, 1200],
      ['wait', 60],
      // Back to the north-west corner, walled on both sides, so the walk
      // ends against stone with the camera home.
      ['goto', 1, 1, 1200],
      ['wait', 60],
    ],
    assert: { roomChanges: 1, camMaxX: 320, camEndX: 0, camMaxY: 48 },
  },

};
