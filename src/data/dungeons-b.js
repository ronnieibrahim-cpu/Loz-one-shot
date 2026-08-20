// Dungeons 5-8: the late game. See world/maps.js for the map contract,
// world/room.js for the room contract, game/game.js for the puzzle/script
// contract, and data/legends.js for the 'dungeon' legend (digits are tide
// tiles).
//
// These are larger and meaner than 1-4: two floors each, three or four Small
// Keys, and tide puzzles that assume you already own the Feather, Bombs, the
// Bracelet and the Flippers. Each dungeon's intended route is written above
// its registerMap call.
//
// As in dungeons-a.js, locked doors sit inside rooms rather than on the seam
// between two — the engine places an arriving player just past the room edge,
// so a locked tile on a seam would drop them inside solid stone. And, also as
// in dungeons-a.js, a push block moves exactly one tile ever, so every `block`
// in a `switches` puzzle sits orthogonally adjacent to its switch.

import { registerMap } from '../world/maps.js';

export function installDungeonsB() {
  // --- Dungeon 5: Drowned Wood Shrine --------------------------------------
  //
  // THE PRIMITIVE, STATED ONCE. Everything after the Reefseed in this dungeon
  // is one sentence built five different ways:
  //
  //     YOU CANNOT PLANT A STAKE FROM THE WATER, AND A STAKE IS ONLY GROUND
  //     AT LOW.
  //
  // A Reefseed grows a coral pillar, and a pillar is floor at LOW, a wall at
  // MID and deep water at HIGH. `Reefseed.canPlant` refuses SOLID, PIT and VOID
  // at EVERY level, so a pillar can only ever go where the player could already
  // stand or already swim — the item cannot open a path, it can only put ground
  // where there was sea. That is the whole design, and the Shrine is built on
  // the two things it is good for that nothing else in the game can do:
  //
  //   A BLOCK CROSSES A PILLAR AND ONLY AT LOW. `PushBlock.push` asks
  //   `canOccupy` with `swim: false`, so a block never enters deep water and
  //   never enters a wall. The pillar is exactly one of those two at MID and at
  //   HIGH, and dry stone at LOW. So the sea decides whether the road is there.
  //
  //   A STAKE IS DRIVEN, NOT DROPPED. `ITEMS.reefseed.use` refuses while
  //   `inDeep || underwater`, on the same grounds the Squall Bellows refuse.
  //   That is what makes THROWING RANGE MEAN ANYTHING — a seed carries exactly
  //   two tiles — and it is why the first thing you build in a Shrine room is
  //   somewhere to stand.
  //
  // THE TIDE THEME, and it is the one no earlier dungeon has. D1 held a patch
  // of sea still. D2 hid what a tile was. D3 gave one body of water two route
  // layers. D4 needed the sea in two states at one instant. Here the sea has to
  // be in two states IN ORDER, and the order is not reversible, because the
  // thing you build at the first sea is what you stand on at the second:
  //
  //   THE DROWNED BOLE (`5`, `dSnag`) is a tree that stands at LOW and MID and
  //   is open water at HIGH. `room.solidAt` refuses a SOLID tile to a flying
  //   body exactly as it does to a walking one, so a seed thrown at a bole
  //   stops dead at its foot and drops a pillar under your own boots. Sound the
  //   conch to HIGH and the same throw sails over it. So the PERCH is planted
  //   at HIGH — and the perch is only ground at LOW, so everything thrown from
  //   the perch is thrown after the sea has gone back down. Neither half can be
  //   bought at the other's sea, and no fixed tide answers a single stake room.
  //
  // The grove is the fixture: a perch ringed by boles on the sides it must not
  // be reachable from, a dry islet with the block on it, a crossing stake, and
  // a plate (`s`, `dSwitchUp`) the block has to end on. The plate carries
  // F.SWITCHF, which `canPlant` refuses — so a stray seed cannot brick the one
  // tile the room needs kept clear, and the five rooms vary the axis, the
  // handedness, the length of the chain and, once, the size of the room.
  //
  // Proved by tools/check-reefseed.mjs, which was written before these rooms,
  // and walked in-engine by the `d5-overthrow` replay.
  //
  // Intended route (24 rooms, one floor, the Reefseed at room 14):
  //   3,7 entrance -> 3,6 landing -> 2,6 Dungeon Map / 4,6 Small Key 1
  //   -> 3,5 the Standing Grove (lock 1) -> 2,5 Chartstone -> 1,5 heart piece
  //   -> 4,5 charm -> 5,5 -> 5,4 -> 4,4 Small Key 2 -> 3,4 -> 2,4 (lock 2)
  //   -> 1,4 REEFSEED -> 1,3 the First Stake (grove 1) -> 2,3 the Bole Walk
  //      (grove 2) -> 2,2 the Sunken Nave (grove 3, Small Key 3) -> 1,2
  //   -> 3,3 Grove Crossing (lock 3) -> 4,3 the Long Ford (grove 4)
  //   -> 5,3 Thornvine (miniboss) -> 4,2 the Shrine Ford (grove 5, two screens,
  //      Boss Key) -> 3,2 boss door -> 3,1 Rootmaw
  registerMap({
    id: 'd5',
    kind: 'dungeon',
    name: 'Drowned Wood Shrine',
    w: 8, h: 8, floors: 1,
    legend: 'dungeonWood',
    music: 'dungeon',
    tint: 'cave',
    scroll: false,
    dungeon: {
      index: 5,
      item: 'reefseed', itemLevel: 1,
      essence: 5,
      boss: 'rootmaw',
      bossRoom: '0,3,1',
      startRoom: '3,7',
      entrance: { map: 'overworld', floor: 0, rx: 5, ry: 4, px: 64, py: 32 },
    },
    rooms: {
      // ---------------------------------------------------- the way in
      '0,3,7': {
        name: 'Shrine Mouth',
        map: [
          '####..####',
          '#U......U#',
          '#........#',
          '#..2222..#',
          '#..2222..#',
          '#........#',
          '#........#',
          '####/#####',
        ],
        warps: [
          { x: 4, y: 7, to: { map: 'overworld', floor: 0, rx: 5, ry: 4, px: 64, py: 32, dir: 'down' } },
        ],
        readable: [
          [2, 3, 'Cut into the lintel: "The wood was here before the water. Stand on what you plant, and plant while you can stand."'],
        ],
      },
      '0,3,6': {
        name: 'Rootwater Landing',
        map: [
          '####..####',
          '#........#',
          '#.8....8.#',
          '..........',
          '..........',
          '#.8....8.#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['keese', 6, 2],
          ['tektite', 3, 5],
        ],
      },
      '0,2,6': {
        name: 'Silt Gallery',
        map: [
          '##########',
          '#U......U#',
          '#........#',
          '#..1111...',
          '#..1111...',
          '#........#',
          '#........#',
          '##########',
        ],
        entities: [
          ['pickup', 4, 2, { kind: 'dungeonMap' }],
          ['keese', 7, 5],
        ],
      },
      '0,4,6': {
        name: 'Bracken Cell',
        map: [
          '##########',
          '#........#',
          '#..2222..#',
          '...2222..#',
          '...2222..#',
          '#..2222..#',
          '#........#',
          '##########',
        ],
        entities: [
          ['stalfos', 2, 1],
          ['tektite', 7, 4],
          ['keese', 6, 1],
        ],
        puzzle: {
          enemies: true,
          flag: 'd5_bracken',
          reward: {
            spawn: [['pickup', 4, 6, { kind: 'key' }]],
            say: 'Something drops out of the bracken.',
          },
        },
      },
      '0,3,5': {
        name: 'The Standing Grove',
        // The bole taught before it is ever load-bearing. Four drowned trees in
        // the middle of the floor: stone at LOW and MID, open water at HIGH,
        // and the walk round them is free at every level so failing costs
        // nothing. The tiles above and below the lock are plain floor on
        // purpose — walk-dungeons asserts a locked door separates its room at
        // all three levels, and a door standing in water cannot be shown to.
        map: [
          '####..####',
          '#........#',
          '####L#####',
          '..55..55..',
          '..55..55..',
          '#........#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['tektite', 4, 5],
          ['keese', 2, 1],
        ],
        readable: [
          [1, 6, 'Scratched into the bark: "At high water the wood is not there. Everything else in this shrine follows from that."'],
        ],
      },
      '0,2,5': {
        name: 'Chartstone Nave',
        map: [
          '####..####',
          '#U......U#',
          '#........#',
          '...3333...',
          '...3333...',
          '#........#',
          '#........#',
          '##########',
        ],
        entities: [
          ['chest', 4, 2, { pickup: 'chartstone' }],
          ['urchin', 4, 4],
        ],
      },
      '0,1,5': {
        name: 'Drowned Cloister',
        map: [
          '##########',
          '#........#',
          '#.999....#',
          '#.9.9.....',
          '#.999.....',
          '#........#',
          '#........#',
          '##########',
        ],
        entities: [
          ['pickup', 3, 3, { kind: 'heartPiece' }],
          ['keese', 7, 5],
        ],
      },
      '0,4,5': {
        name: 'Thicket Cell',
        map: [
          '####..####',
          '#U......U#',
          '#........#',
          '..........',
          '..........',
          '#..,,,,..#',
          '#........#',
          '##########',
        ],
        entities: [
          ['chest', 4, 2, { charm: 'gillcarve' }],
          ['stalfos', 7, 4],
        ],
      },
      '0,5,5': {
        name: 'Bower Cell',
        map: [
          '##########',
          '#........#',
          '#..88....#',
          '...88....#',
          '.........#',
          '#........#',
          '#........#',
          '##########',
        ],
        entities: [
          ['pickup', 7, 2, { kind: 'rupee20' }],
          ['tektite', 3, 5],
          // D5's second Piece of Heart. The Bower Cell is the Shrine's
          // south-east corner and leads nowhere — the tektite is the whole
          // price.
          ['pickup', 5, 1, { kind: 'heartPiece' }],
        ],
      },
      '0,5,4': {
        name: 'Coppice Cell',
        map: [
          '##########',
          '#........#',
          '#..3333..#',
          '...3333..#',
          '...3333..#',
          '#..3333..#',
          '#........#',
          '##########',
        ],
        entities: [
          ['jellyfish', 4, 3],
          ['keese', 2, 1],
        ],
      },
      '0,4,4': {
        name: 'Sunken Bracken',
        map: [
          '##########',
          '#........#',
          '#..1111..#',
          '...1111...',
          '...1111...',
          '#..1111..#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['switch', 2, 1],
          ['switch', 7, 6],
          ['block', 3, 1],
          ['block', 6, 6],
          ['urchin', 5, 3],
          ['keese', 2, 6],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd5_bracken2',
          reward: {
            spawn: [['pickup', 4, 6, { kind: 'key' }]],
            say: 'A grating opens under the far wall.',
          },
        },
      },
      '0,3,4': {
        name: 'Rootbound Hall',
        map: [
          '##########',
          '#U......U#',
          '#..2222..#',
          '..2222222.',
          '..2222222.',
          '#..2222..#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['barnacle', 4, 3],
          ['crab', 7, 5],
          ['keese', 2, 1],
        ],
      },
      '0,2,4': {
        name: "Warden's Sill",
        // The lock sits in a one-tile corridor with its pocket sealed on both
        // sides, so there is no way round it at any level.
        map: [
          '##########',
          '#.pp.....#',
          '###......#',
          '..L.......',
          '###.......',
          '#........#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['stalfos', 6, 4],
        ],
        readable: [
          [5, 5, 'A warden\'s plate: "Past this door the floor is a thing you bring with you."'],
        ],
      },
      '0,1,4': {
        name: 'Reefseed Vault',
        map: [
          '####..####',
          '#U......U#',
          '#........#',
          '#.........',
          '#........#',
          '#..2222..#',
          '#........#',
          '##########',
        ],
        entities: [
          ['chest', 4, 2, { big: true, item: 'reefseed', level: 1 }],
        ],
      },

      // ---------------------------------------------------- the groves
      //
      // THE FIXTURE, and all five rooms are it: a snarl set in the one gap of a
      // solid wall, a coral stake beside the snarl that is the only place a
      // blade will come out, a drowned bole one tile off the stake on the
      // opposite side, and a bank two tiles beyond the bole. Everything else in
      // the pool is `0` — a sump, which is a hole at LOW and over your head
      // above it, so it is the one tile in the Shrine that is neither standable
      // nor plantable and a stray seed can do nothing with it.
      //
      // Read in order: throw at HIGH, because the bole is only gone at HIGH.
      // Sound the conch to LOW, because the pillar is only ground at LOW. Climb
      // out of the water onto what you threw, and cut.
      '0,1,3': {
        name: 'The First Stake',
        // GROVE 1, on the east-west axis and the fixture at its plainest. The
        // bank is 4,4, the bole 5,4, the stake 6,4 and the snarl 7,4, all in
        // one line, so the whole idea is legible in a single row of the room.
        map: [
          '##########',
          '#.....##.#',
          '#.....0#.#',
          '#.....W#.#',
          '#....5Wk..',
          '#.....W#.#',
          '#.....##.#',
          '####..####',
        ],
        reefseedRoom: {
          entry: [4, 7],
          stakes: [
            { at: [6, 4], from: [4, 4], face: 'right', sea: 2 },
          ],
          snarl: [7, 4], cutFrom: [6, 4],
        },
        // Both of them are on the FAR side of the snarl, guarding the corridor
        // out rather than the pool. The near side is deliberately quiet: this is
        // the room the dungeon teaches itself in, and a keese knocking Link a
        // tile sideways between facing the bole and letting go of the seed would
        // make the lesson read as the item being unreliable.
        entities: [
          ['keese', 8, 2],
          ['tektite', 8, 5],
        ],
        readable: [
          [2, 5, 'Cut low, where the water reaches it: "Throw while the wood is gone. Stand once it is back."'],
        ],
      },
      '0,2,3': {
        name: 'The Bole Walk',
        // GROVE 2, the fixture turned through a right angle and pointed north,
        // and a player who has just learned the First Stake has to notice that
        // the throw which opens it is now the one aimed away from the door.
        map: [
          '####.#####',
          '####.#####',
          '####k#####',
          '#.0WWW0..#',
          '....5.....',
          '#........#',
          '#........#',
          '##########',
        ],
        reefseedRoom: {
          entry: [0, 4],
          stakes: [
            { at: [4, 3], from: [4, 5], face: 'up', sea: 2 },
          ],
          snarl: [4, 2], cutFrom: [4, 3],
        },
        entities: [
          ['tektite', 7, 5],
          ['keese', 2, 6],
        ],
      },
      '0,2,2': {
        name: 'The Sunken Nave',
        // GROVE 3, and the first one where the stake is not on the way to
        // anywhere: the snarl is set in the east wall of a cell that holds a
        // Small Key, so the room can be walked straight through by a player who
        // never works out what the pool is for. A chest rather than a script,
        // because a chest is still there when you come back for it.
        map: [
          '##########',
          '#.#......#',
          '..#0.....#',
          '#.#W.....#',
          '#.kW5....#',
          '#.#W.....#',
          '#.#0.....#',
          '####.#####',
        ],
        reefseedRoom: {
          entry: [4, 7],
          stakes: [
            { at: [3, 4], from: [5, 4], face: 'left', sea: 2 },
          ],
          snarl: [2, 4], cutFrom: [3, 4],
        },
        entities: [
          ['chest', 1, 2, { pickup: 'key' }],
          ['jellyfish', 7, 2],
          ['keese', 6, 6],
        ],
      },
      '0,1,2': {
        name: 'Silt Cell',
        map: [
          '##########',
          '#........#',
          '#..99.....',
          '#..99....#',
          '#........#',
          '#........#',
          '#........#',
          '##########',
        ],
        entities: [
          ['pickup', 7, 5, { kind: 'rupee20' }],
          ['keese', 3, 5],
        ],
      },
      '0,3,3': {
        name: 'Grove Crossing',
        map: [
          '##########',
          '#........#',
          '#.........',
          '###......#',
          '..L......#',
          '###......#',
          '#........#',
          '##########',
        ],
        entities: [
          ['stalfos', 6, 2],
          ['keese', 7, 5],
        ],
      },
      '0,4,3': {
        name: 'The Long Ford',
        // GROVE 4, pointed south, and the first with the bank on the far side
        // of the pool from the door — so the throw has to be set up by walking
        // round the water rather than by standing where you came in.
        map: [
          '##########',
          '#........#',
          '....5....#',
          '#.0WWW0..#',
          '####k#####',
          '#........#',
          '#.........',
          '##########',
        ],
        reefseedRoom: {
          entry: [0, 2],
          stakes: [
            { at: [4, 3], from: [4, 1], face: 'down', sea: 2 },
          ],
          snarl: [4, 4], cutFrom: [4, 3],
        },
        entities: [
          ['keese', 7, 2],
          ['tektite', 2, 2],
        ],
      },
      '0,5,3': {
        name: 'Thornvine',
        map: [
          '####.#####',
          '####D#####',
          '#..2222..#',
          '#.2222222#',
          '#.2222222#',
          '#..2222..#',
          '..2222...#',
          '##########',
        ],
        entities: [
          ['thornvine', 4, 3],
        ],
        puzzle: {
          enemies: true,
          flag: 'd5_thornvine',
          reward: {
            openDoors: [[4, 1]],
            say: 'The thorns let go of the north arch.',
          },
        },
      },
      '0,4,2': {
        name: 'The Shrine Ford',
        // GROVE 5, two screens wide, and the only room in the dungeon that is.
        // It owns the cell at 5,2 as well as its own, so nothing else may be
        // keyed there.
        //
        // The width is the point, and it is the answer to the Cistern's own
        // complaint that every one of its sills fitted inside ten tiles and so
        // every one of them was the same three squares in a row. Here the pool
        // is wide enough that the snarl is out of range of any bank, so the
        // fixture has to be built twice: the first stake at HIGH from dry
        // ground, and the second at LOW from the first — which means standing
        // on something that did not exist when you threw it, and which will not
        // be there if you let the sea back up.
        size: [2, 1],
        map: [
          '####################',
          '#........###########',
          '#........#000000000#',
          '#........#0WWWW....#',
          '..........kWWW5....#',
          '#........#0W0W.....#',
          '#........#0000.....#',
          '##############.#####',
        ],
        reefseedRoom: {
          entry: [14, 7],
          stakes: [
            { at: [13, 4], from: [15, 4], face: 'left', sea: 2 },
            { at: [11, 4], from: [13, 4], face: 'left', sea: 0 },
          ],
          snarl: [10, 4], cutFrom: [11, 4],
        },
        entities: [
          ['chest', 4, 3, { pickup: 'bossKey' }],
          ['keese', 16, 5],
          ['tektite', 3, 5],
        ],
        readable: [
          [16, 2, 'A shrine board, barely legible: "Twice over. The first while the wood is under, the second while it is not."'],
        ],
      },
      '0,3,2': {
        name: 'Rootmaw Arch',
        map: [
          '####.#####',
          '####B#####',
          '#........#',
          '#........#',
          '#.........',
          '#..2222..#',
          '#........#',
          '##########',
        ],
        entities: [
          ['keese', 7, 2],
        ],
      },
      '0,3,1': {
        name: 'Rootmaw, the Drowned Wood',
        // The boss keeps the mechanic: `noTide` pins the arena at whatever
        // level was brought in, and the floor is basin, which is walkable at
        // all three because a locked room has to work at whichever one arrives.
        map: [
          '##########',
          '#..2222..#',
          '#..2222..#',
          '#..2222..#',
          '#..2222..#',
          '#..2222..#',
          '#........#',
          '####.#####',
        ],
        noTide: true,
        entities: [
          ['rootmaw', 4, 2],
        ],
        script: {
          onEvent(game, name) {
            if (name === 'bossDead') game.spawnPickup(80, 40, 'heartContainer', { grabDelay: 30 });
          },
        },
      },
    },
  });

  // --- Dungeon 6: the Abyssal Keep ------------------------------------------
  //
  // THE PRIMITIVE, STATED ONCE. Everything after the Dredge Line in this
  // dungeon is one sentence built two different ways:
  //
  //     THE LINE CROSSES WHAT THE SEA UNCOVERS, AND THE FLOOR GIVES UP ONLY
  //     WHAT THE SEA COVERS.
  //
  // The Keep is the last dungeon and it is the first one whose problem is what
  // the player already owns. Since the Bogwater Sanctum, deep water has been a
  // road: both Cleat modes cross it and no sea level is a wall. So a barrier in
  // the Abyssal Keep has to be a PIT — the one thing in the game that neither
  // mode crosses and no conch fills — and every crossing here is a shaft.
  //
  // What gets you over one is `F.SNAG`. `DredgeLine.update` snags a fixed post
  // and hauls the PLAYER to it, with `{ jumping: true, swim: true }`, so nothing
  // but a wall stops the pull and the shaft under it is simply crossed. Three
  // tiles decide whether that is possible, and the tide moves all three:
  //
  //   THE GROUND YOU BRACE ON. `ITEMS.dredge.use` now refuses while
  //   `inDeep || underwater`, the same guard the Squall Bellows and the Reefseed
  //   carry. A `3` (`dWell`) shelf is wading depth at LOW and over your head
  //   above it, so a mooring reached across one is reached at LOW and nowhere
  //   else. That is THE DROWNED STAND.
  //
  //   EVERYTHING BETWEEN. The cast stops dead on `F.SOLID`. A `7` (`dLintel`)
  //   is the Keep's own masonry standing across a shaft, and it is stone until
  //   HIGH covers it — so a post you can see from the moment you walk in is
  //   unreachable until the sea takes the bar off it. That is THE SUNKEN BAR,
  //   and it is the Drowned Stand inside out: one crosses at LOW, the other at
  //   HIGH, and no room holds both at once except the last one.
  //
  // THE TIDE THEME, and it is the only one of the six that wants the water ON.
  // D1 held a patch of sea still. D2 hid what a tile was. D3 gave one body of
  // water two route layers. D4 needed the sea in two states at one instant. D5
  // needed it in two states in order. Here:
  //
  //   THE DROWNED CACHE (`6`, `dSilt`) is a silted ring in the floor, and
  //   `DredgeLine.dragBack` searches a tile the weight passed over ONLY if that
  //   tile carries `F.WET | F.SLOW` at the level it resolves at. Dry crust is
  //   dragged straight over. Every other item in this game has asked the player
  //   to take the water off something; the last one asks them to put it back.
  //
  // So every room in the Keep's second half is a crossing at one sea and a cache
  // at another, and the order cannot be reversed: the stand drowns when you
  // raise the sea to fish, and the bar comes back down when you lower it.
  //
  // Proved by tools/check-dredge.mjs, which was written before these rooms and
  // proves every closure clause TWICE — once at the line's own reach and once
  // at the Coilrope's, because the charm that lengthens it is hand-placed in
  // this dungeon. Walked in-engine by the `d6-mooring` replay.
  //
  // Intended route (26 rooms, two floors, the Dredge Line at room 13):
  //   3,7 entrance -> 3,6 landing -> 2,6 Dungeon Map / 4,6 Small Key 1
  //   -> 3,5 Drowned Hall (hub) -> 2,5 Chartstone -> 4,5 Small Key 2
  //   -> 3,4 Three Heights (lock 1) -> 2,4 rest / 4,4 Small Key 3
  //   -> 3,3 Keep Lock (lock 2) -> 4,3 DREDGE LINE -> 5,3 the Slack Water
  //   -> 2,3 stair up
  //   -> 1F 3,5 Upper Keep -> 2,5 -> 2,4 the Coilrope
  //      -> 4,5 Tideshade (miniboss) -> 4,4 the Mermaid Suit
  //      -> 3,4 the Drowned Stand -> 3,3 Keep Crossing
  //      -> 2,3 the Sunken Bar (lock 3) -> 4,3 the Drowned Sill (Small Key 4)
  //      -> 3,2 (lock 4) -> 4,2 the Crossed Shafts (Boss Key)
  //      -> 3,1 Nereth
  registerMap({
    id: 'd6',
    kind: 'dungeon',
    name: 'Abyssal Keep',
    w: 8, h: 8, floors: 2,
    legend: 'dungeonAbyss',
    music: 'dungeon2',
    tint: 'cave',
    scroll: false,
    dungeon: {
      index: 6,
      item: 'dredge', itemLevel: 1,
      essence: 6,
      boss: 'nereth',
      bossRoom: '1,3,1',
      startRoom: '3,7',
      entrance: { map: 'overworld', floor: 0, rx: 1, ry: 0, px: 64, py: 32 },
    },
    rooms: {
      // ---------------------------------------------------- the way in
      '0,3,7': {
        name: 'Keep Door',
        map: [
          '####..####',
          '#........#',
          '#.p....p.#',
          '#........#',
          '#.19..91.#',
          '#........#',
          '#........#',
          '####/#####',
        ],
        warps: [
          { x: 4, y: 7, to: { map: 'overworld', floor: 0, rx: 1, ry: 0, px: 64, py: 32, dir: 'down' } },
        ],
        readable: [
          [2, 3, 'Cut in black stone: "Everything the sea takes, it keeps. Everything it keeps, it puts down."'],
        ],
      },
      '0,3,6': {
        name: 'Keep Landing',
        map: [
          '####..####',
          '#.1....1.#',
          '#.9....9.#',
          '..........',
          '..........',
          '#.9____9.#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['darknut', 3, 3],
          ['keese', 6, 4],
        ],
        puzzle: {
          enemies: true,
          flag: 'd6_landing',
          reward: {
            spawn: [['pickup', 4, 3, { kind: 'heart' }]],
            say: 'Water drains out of a niche in the wall.',
          },
        },
      },
      '0,2,6': {
        name: 'Map Crypt',
        map: [
          '####..####',
          '####..####',
          '##......##',
          '##..12....',
          '##..21....',
          '##......##',
          '##########',
          '##########',
        ],
        entities: [
          ['pickup', 4, 3, { kind: 'dungeonMap' }],
          ['stalfos', 6, 2],
        ],
      },
      '0,4,6': {
        name: 'Bone Cell',
        map: [
          '####..####',
          '####..####',
          '##......##',
          '...4444.##',
          '...4444.##',
          '##......##',
          '##########',
          '##########',
        ],
        entities: [
          ['stalfos', 2, 2],
          ['stalfos', 7, 2],
          ['darknut', 4, 4],
        ],
        puzzle: {
          enemies: true,
          flag: 'd6_bone',
          reward: { spawn: [['pickup', 4, 3, { kind: 'key' }]], say: 'The bones settle. A key is among them.' },
        },
      },
      '0,3,5': {
        name: 'Drowned Hall',
        map: [
          '####..####',
          '#..M..M..#',
          '#.191919.#',
          '..........',
          '..........',
          '#.919191.#',
          '#..M..M..#',
          '####..####',
        ],
        entities: [
          ['wizzrobe', 4, 2],
          ['darknut', 2, 5],
          ['siren', 7, 3],
          ['torch', 1, 1],
          ['torch', 8, 1],
          ['torch', 1, 6],
        ],
        puzzle: {
          torches: 'all',
          flag: 'd6_hall',
          reward: {
            spawn: [['pickup', 4, 3, { kind: 'rupee20' }]],
            say: 'A catch lets go under the floor.',
          },
        },
        readable: [
          [8, 4, 'A mooring plate, worn smooth: "The rings in this house were for hauling. They will haul anything that takes hold."'],
        ],
      },
      '0,2,5': {
        name: 'Chartstone Crypt',
        map: [
          '####..####',
          '####..####',
          '##..99..##',
          '##........',
          '##........',
          '##..99..##',
          '####..####',
          '####..####',
        ],
        entities: [
          ['chest', 4, 3, { pickup: 'chartstone' }],
          ['darknut', 6, 4],
        ],
      },
      '0,4,5': {
        name: 'Drain Court',
        map: [
          '####..####',
          '####..####',
          '##......##',
          '...4..4.##',
          '........##',
          '##......##',
          '####..####',
          '####..####',
        ],
        entities: [
          ['switch', 2, 2],
          ['switch', 7, 5],
          ['block', 2, 3],
          ['beamos', 6, 2],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd6_drain',
          reward: { spawn: [['pickup', 4, 4, { kind: 'key' }]], say: 'The drain gutters and something bright goes down it.' },
        },
      },
      '0,3,4': {
        name: 'Three Heights',
        // The dungeon's own tide vocabulary said once, before anything depends
        // on it: `1` is dry then wading then over your head, `9` is a wall the
        // sea swims you over, `4` is a hole the sea fills. Three tiles, three
        // different answers to the same conch, and the walk round them is free.
        map: [
          '####..####',
          '#.11..11.#',
          '####L#####',
          '..9....9..',
          '..9.44.9..',
          '#.9.44.9.#',
          '#.22..22.#',
          '####..####',
        ],
        entities: [
          ['wizzrobe', 4, 4],
          ['jellyfish', 2, 3],
        ],
        readable: [
          [1, 6, 'Scratched low, where the water reaches it: "Three heights. One way through."'],
        ],
      },
      '0,2,4': {
        name: 'West Crypt',
        map: [
          '##########',
          '##########',
          '##..99..##',
          '#.........',
          '##........',
          '##......##',
          '##########',
          '##########',
        ],
        entities: [
          ['pickup', 4, 4, { kind: 'fairy' }],
          ['stalfos', 6, 2],
        ],
      },
      '0,4,4': {
        name: 'Black Kiln',
        map: [
          '####..####',
          '####..####',
          '##......##',
          '...4444.##',
          '...4444.##',
          '##......##',
          '##########',
          '##########',
        ],
        entities: [
          ['torch', 2, 2],
          ['torch', 7, 2],
          ['torch', 2, 5],
          ['torch', 7, 5],
          ['darknut', 4, 4],
        ],
        puzzle: {
          torches: 'all',
          flag: 'd6_kiln',
          reward: { spawn: [['pickup', 4, 4, { kind: 'key' }]], say: 'Four flames in the Drowned King\'s house.' },
        },
      },
      '0,3,3': {
        name: 'Keep Lock',
        map: [
          '##########',
          '#.....#..#',
          '#.....#..#',
          '......L...',
          '#.....#..#',
          '#.....#..#',
          '#..M..#..#',
          '####..####',
        ],
        entities: [
          ['darknut', 2, 4],
          ['wizzrobe', 3, 5],
        ],
      },
      '0,2,3': {
        name: 'Keep Stair',
        map: [
          '##########',
          '##....../#',
          '##......##',
          '#.........',
          '##........',
          '##...<..##',
          '####..####',
          '####..####',
        ],
        warps: [
          { x: 8, y: 1, to: { map: 'd6', floor: 1, rx: 3, ry: 5, px: 72, py: 96 } },
        ],
        entities: [
          ['stalfos', 3, 4],
        ],
      },
      '0,4,3': {
        name: 'Dredge Vault',
        map: [
          '##########',
          '##########',
          '##......##',
          '..........',
          '..........',
          '##......##',
          '##########',
          '##########',
        ],
        entities: [
          ['chest', 4, 3, { big: true, item: 'dredge', level: 1 }],
        ],
      },

      // ---------------------------------------------------- the Slack Water
      '0,5,3': {
        name: 'The Slack Water',
        // THE TEACHING ROOM, and it is here because four dungeons in a row
        // shipped a mechanic that was legible when it worked and silent when it
        // did not. This one is a flat pan you can walk all the way round at any
        // sea, with one silted ring in the middle of it and a bell that hums at
        // the ring. Drag the line over it on the dry crust and the weight comes
        // home with nothing. Sound the conch one step and drag the same line
        // over the same tile and a Piece of Heart comes up out of it.
        //
        // Nothing here is needed and nothing here can be lost, which is what
        // `teaches: true` says to check-dredge.mjs — and what it makes the
        // checker enforce, so a later session cannot quietly hang a key on it.
        map: [
          '##########',
          '#........#',
          '#.111111.#',
          '..111111.#',
          '..116111.#',
          '#.111111.#',
          '#........#',
          '##########',
        ],
        buried: [[4, 4, 'heartPiece']],
        dredgeRoom: {
          entry: [0, 4],
          teaches: true,
          caches: [
            { at: [4, 4], from: [4, 6], face: 'up', sea: 1 },
          ],
        },
        entities: [
          // Rung, it points at the ring in the floor. A direction and never a
          // distance — see docs/ITEMS.md.
          ['bell', 8, 6, { points: [4, 4], say: 'The bell hums flat at the middle of the pan.' }],
          ['anglerfry', 7, 2],
        ],
        readable: [
          [1, 1, 'A dredger\'s tally, half scoured away: "Dry pan, dry line. We only ever worked it with the water in."'],
        ],
      },

      // ---------------------------------------------------- upper floor
      '1,3,5': {
        name: 'Upper Keep',
        map: [
          '####..####',
          '##....../#',
          '##......##',
          '..........',
          '..........',
          '##......##',
          '#........#',
          '##########',
        ],
        warps: [
          { x: 8, y: 1, to: { map: 'd6', floor: 0, rx: 2, ry: 3, px: 112, py: 40 } },
        ],
        entities: [
          ['keese', 3, 4],
        ],
      },
      '1,2,5': {
        name: 'Shade Cell',
        map: [
          '####..####',
          '####..####',
          '##......##',
          '#.........',
          '#.___.....',
          '##......##',
          '##########',
          '##########',
        ],
        entities: [
          ['wizzrobe', 3, 3],
          ['darknut', 6, 4],
          ['keese', 4, 2],
        ],
        puzzle: {
          enemies: true,
          flag: 'd6_shade',
          reward: { spawn: [['pickup', 4, 3, { kind: 'heart' }]], say: 'The shadows thin out.' },
        },
      },
      '1,2,4': {
        name: 'Colonnade of the Drowned',
        // The hand-placed charm, and it is the one this dungeon is about: the
        // Coilrope adds a tile to every cast. It is a MID charm and the player
        // holds five essences here, so all three cases are open and the case is
        // not the gate — which is why check-dredge.mjs proves every closure
        // clause at the Coilrope's reach as well as the bare line's. A charm
        // that makes the item longer is a charm that can answer a room from a
        // tile the room was built to keep you off.
        //
        // It sits behind a GRATE, which is metal, and the only thing in the game
        // that retracts metal is the Resonance Rod — the trading reward. So the
        // one optional thing in the Keep is the one thing that asks whether the
        // player went and did the trade. The grate seals an alcove and nothing
        // else, because a grate across a corridor would strand the room and
        // still validate.
        map: [
          '##########',
          '##########',
          '###....###',
          '###GGGG###',
          '##.=..=.##',
          '##......##',
          '####..####',
          '####..####',
        ],
        entities: [
          ['chest', 4, 2, { charm: 'coilrope' }],
          ['beamos', 2, 5],
        ],
        readable: [
          [7, 4, 'A chandler\'s note nailed to the column: "More rope is more room. It is not more sea."'],
        ],
      },
      '1,4,5': {
        name: 'Tideshade Hall',
        // Two screens wide, and the only miniboss arena in the game that is.
        // The tideshade phases with the water and the room is `1` throughout —
        // dry at LOW, wading at MID, swimming at HIGH — so the fight is a
        // different fight at each sea and the player picks which one they want
        // before they walk in. Its north door opens on the kill.
        size: [2, 1],
        map: [
          '####D###############',
          '#........##........#',
          '#.1111....1111....##',
          '..1111....1111....##',
          '#.1111....1111....##',
          '#........##........#',
          '#........##........#',
          '####################',
        ],
        entities: [
          ['tideshade', 9, 3],
        ],
        puzzle: {
          enemies: true,
          flag: 'd6_tideshade',
          reward: {
            openDoors: [[4, 0]],
            say: 'The shade unravels into water and is gone. Something gives above.',
          },
        },
      },
      '1,4,4': {
        name: 'Mermaid Vault',
        map: [
          '##########',
          '##########',
          '##......##',
          '##......##',
          '##......##',
          '##......##',
          '####.#####',
          '####.#####',
        ],
        entities: [
          ['chest', 4, 3, { big: true, item: 'cleats', level: 2 }],
        ],
      },

      // ---------------------------------------------------- the crossings
      //
      // THE FIXTURE, and the three rooms below are it. A shaft of `O` that no
      // sea fills and no Cleat crosses; a mooring `q` one tile inside the far
      // bank, so the pull comes to rest on ground rather than in the hole; and
      // ONE of the two tide tiles deciding whether the cast can happen — a `3`
      // shelf you brace on, which drowns above LOW, or a `7` lintel in the way,
      // which is stone below HIGH. Every crossing carries a mooring on the near
      // side as well, so nothing here is one-way and no room can be walked into
      // and not out of.
      //
      // Read in order: cross at the sea that opens the shaft, then move the sea
      // to the one that wets the floor, and fish.
      '1,3,4': {
        name: 'The Drowned Stand',
        // CROSSING 1, at LOW, and the fixture at its plainest. The shelf at
        // 3..6,6 is `dWell` — wading at LOW, over your head above it — so the
        // only sea you can brace at is the only sea the room is crossed at. The
        // ledge is walled off at both ends on purpose: a dry tile beside it is a
        // dry tile the cast could be taken from at any sea, and the doorway at
        // 4,7 is a whole tile further out than the line reaches even with the
        // Coilrope on.
        map: [
          '####.#####',
          '#......6.#',
          '#....q...#',
          '#........#',
          '#OOOOOOOO#',
          '#OOOOOOOO#',
          '#OO3333OO#',
          '####.#q###',
        ],
        buried: [[7, 1, 'rupee20']],
        dredgeRoom: {
          entry: [4, 7],
          moorings: [
            { post: [5, 2], from: [5, 6], land: [5, 3], face: 'up', sea: 0 },
          ],
          returns: [
            { post: [6, 7], from: [6, 3], land: [6, 6], face: 'down', sea: 0 },
          ],
          caches: [
            { at: [7, 1], from: [7, 3], face: 'up', sea: 1 },
          ],
        },
        entities: [
          ['keese', 2, 2],
          ['anglerfry', 2, 1],
        ],
        readable: [
          [1, 3, 'Cut into the coping: "Stand while you can stand. The ledge is only a ledge at low water."'],
        ],
      },
      '1,3,3': {
        name: 'Keep Crossing',
        map: [
          '####..####',
          '#........#',
          '####L#####',
          '.......#.#',
          '#......#.#',
          '#......L..',
          '#......#.#',
          '####..####',
        ],
        entities: [
          ['darknut', 6, 5],
          ['keese', 7, 1],
        ],
      },
      '1,2,3': {
        name: 'The Sunken Bar',
        // CROSSING 2, at HIGH, and the Drowned Stand inside out. The mooring at
        // 3,4 is in plain sight from the doorway and the lintel at 6,4 is what
        // stops the line — stone at LOW and at MID, open water at HIGH. So the
        // sea has to come UP to cross, and the cache at 2,1 is fished off a
        // `1` shelf that is over your head at HIGH, so the sea has to go back
        // DOWN to collect. Neither half can be bought at the other's sea and
        // the order cannot be reversed.
        map: [
          '##########',
          '#.66.#...#',
          '#.11.#...#',
          '#....#....',
          '#..q.O9.q#',
          '#....#...#',
          '#....#...#',
          '##########',
        ],
        buried: [[2, 1, 'heartPiece'], [3, 1, 'rupee20']],
        dredgeRoom: {
          entry: [9, 3],
          moorings: [
            { post: [3, 4], from: [7, 4], land: [4, 4], face: 'left', sea: 2 },
          ],
          returns: [
            { post: [8, 4], from: [4, 4], land: [7, 4], face: 'right', sea: 2 },
          ],
          caches: [
            { at: [2, 1], from: [2, 2], face: 'up', sea: 1 },
            { at: [3, 1], from: [3, 2], face: 'up', sea: 1 },
          ],
        },
        entities: [
          ['keese', 7, 5],
        ],
        readable: [
          [8, 5, 'A tide board: "The bar is down at slack and up at flood. Everything in this room follows from that."'],
        ],
      },
      '1,4,3': {
        name: 'The Drowned Sill',
        // CROSSING 3, at LOW, the Drowned Stand turned through a right angle
        // and handed the other way — and the first one where what is across the
        // shaft is a Small Key rather than a corridor. The cache at 8,2 is six
        // tiles from the nearest tile a body can stand on on this side, and
        // check-dredge caught it at five: the Coilrope reaches exactly that far,
        // so the room was answered from the near bank by anyone wearing the bone
        // this dungeon hands out.
        map: [
          '##########',
          '#..OO....#',
          '#..OO...6#',
          '#..OO....#',
          '#q3OO.q..#',
          '...OO....#',
          '#..OO....#',
          '##########',
        ],
        buried: [[8, 2, 'key']],
        dredgeRoom: {
          entry: [0, 5],
          moorings: [
            { post: [6, 4], from: [2, 4], land: [5, 4], face: 'right', sea: 0 },
          ],
          returns: [
            { post: [1, 4], from: [5, 4], land: [2, 4], face: 'left', sea: 0 },
          ],
          caches: [
            { at: [8, 2], from: [8, 4], face: 'up', sea: 1 },
          ],
        },
        entities: [
          ['siren', 7, 5],
        ],
      },

      // ---------------------------------------------------- the way out
      '1,3,2': {
        name: 'Keep Gate',
        map: [
          '####..####',
          '#........#',
          '####B#####',
          '#........#',
          '#.19..9...',
          '#........#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['wizzrobe', 6, 4],
        ],
      },
      '1,4,2': {
        name: 'The Crossed Shafts',
        // THE ROOM THAT SAYS IT OUT LOUD, and the only one in the dungeon that
        // holds both crossings. Two screens wide because it has to be: a lintel
        // crossing and a shelf crossing are four tiles each and the islands
        // between them are the room. In at HIGH over the bar, down to LOW to
        // brace on the shelf, and the Boss Key is on the far island — so the
        // sea that gets you in is the sea that stops you going on, and there is
        // no arrangement of the conch that holds both. It owns the cell at 5,2
        // as well as its own; nothing else may be keyed there.
        size: [2, 1],
        map: [
          '####################',
          '#....#O.....OO.....#',
          '#..q.7O.q...OO.....#',
          '#....#O.....OO.....#',
          '.....#O.....OO.....#',
          '#....#O...q3OO.q...#',
          '#....#O.....OO.....#',
          '####################',
        ],
        dredgeRoom: {
          entry: [0, 4],
          moorings: [
            { post: [8, 2], from: [4, 2], land: [7, 2], face: 'right', sea: 2 },
            { post: [15, 5], from: [11, 5], land: [14, 5], face: 'right', sea: 0, entry: [7, 2] },
          ],
          returns: [
            { post: [3, 2], from: [7, 2], land: [4, 2], face: 'left', sea: 2 },
            { post: [10, 5], from: [14, 5], land: [11, 5], face: 'left', sea: 0, entry: [7, 2] },
          ],
        },
        entities: [
          ['chest', 17, 3, { pickup: 'bossKey' }],
          // The Brinehulk keeps the Boss Key, and where it stands is the joke
          // the room is built on. Brine dissolves salt: it is ARMOURED AT LOW
          // and comes apart at HIGH — and LOW is the only sea the shelf lets
          // you cross on. So you arrive at the one sea it cannot be hurt at,
          // and the sea that opens it is the sea that shuts the way you came.
          //
          // It is here because the six-dungeon fold left it homeless: the Salt
          // Pan Vault was its arena and the Vault is a cave now. A hand-drawn
          // boss with no room in the game is content thrown away, and the
          // consolidation should not cost the game anything it already had.
          ['brinehulk', 17, 4],
          ['beamos', 9, 1],
          ['keese', 16, 5],
        ],
        readable: [
          [2, 5, 'A king\'s inscription, and the only one in the Keep that is signed: "You cannot hold two seas. Nereth."'],
        ],
      },
      '1,3,1': {
        name: 'Nereth, the Drowned King',
        // The boss keeps the mechanic: `noTide` pins the arena at whatever sea
        // was brought through the door, and Nereth's own phases pin it again.
        map: [
          '##########',
          '#........#',
          '#.9....9.#',
          '#....>...#',
          '#....>...#',
          '#.9..>.9.#',
          '#........#',
          '####..####',
        ],
        noTide: true,
        entities: [
          ['nereth', 4, 2],
        ],
        script: {
          onEvent(game, name) {
            if (name === 'bossDead') game.spawnPickup(80, 40, 'heartContainer', { grabDelay: 30 });
          },
        },
      },
    },
  });
}
