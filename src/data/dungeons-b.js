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

  // --- Dungeon 6: Salt Pan Vault -------------------------------------------
  // Tide theme: fire and water take turns. Basins are dry at LOW and hold water
  // above it, so a torch room is only lightable with the sea drawn off — and the
  // same basins are the only way across once they fill. Every torch puzzle here
  // is really a tide puzzle wearing a torch.
  //
  // Intended route:
  //   3,7 entrance -> 3,6 -> 3,5 hub -> 2,5 Dungeon Map -> 4,5 Small Key 1
  //   -> 3,4 dry the basins -> 2,4 Compass -> 4,4 Small Key 2
  //   -> 3,3 locked -> stairs at 4,3 up to floor 1
  //   -> 1F 3,5 -> 2,5 Small Key 3 -> 4,5 Small Key 4 -> 3,4 locked
  //   -> 2,4 Saltwraith (miniboss) -> 1,4 locked, big chest: Hookshot
  //   -> 3,3 locked, Boss Key -> 3,2 boss door -> 3,1 Brinehulk
  registerMap({
    id: 'd6',
    kind: 'dungeon',
    name: 'Salt Pan Vault',
    w: 8, h: 8, floors: 2,
    legend: 'dungeonSalt',
    music: 'dungeon2',
    tint: 'cave',
    scroll: false,
    dungeon: {
      index: 6,
      item: 'bottle', itemLevel: 1,
      essence: 6,
      boss: 'brinehulk',
      bossRoom: '1,3,1',
      startRoom: '3,7',
      entrance: { map: 'overworld', floor: 0, rx: 6, ry: 1, px: 48, py: 48 },
    },
    rooms: {
      '0,1,3': {
        name: 'Deep Pan',
        map: [
          '##########',
          '##......##',
          '##.3333.##',
          '#..3333...',
          '#..3333...',
          '##.3333.##',
          '##......##',
          '##########',
        ],
        entities: [
          ['jellyfish', 4, 3],
          ['pickup', 2, 5, { kind: 'fairy' }],
        ],
      },
      '0,2,3': {
        name: 'Crust Cell',
        map: [
          '##########',
          '##########',
          '##.2222.##',
          '.._____...',
          '...2222...',
          '##......##',
          '####..####',
          '####..####',
        ],
        entities: [
          ['pickup', 4, 5, { kind: 'rupee20' }],
          ['zol', 6, 2],
        ],
      },
      '0,2,4': {
        name: 'Compass Kiln',
        map: [
          '####..####',
          '####..####',
          '##..22..##',
          '##........',
          '##........',
          '##..22..##',
          '####..####',
          '####..####',
        ],
        entities: [
          ['chest', 4, 3, { pickup: 'chartstone' }],
          ['darknut', 6, 4],
        ],
      },
      '0,2,5': {
        name: 'Map Vault',
        map: [
          '####..####',
          '####..####',
          '##......##',
          '##..22....',
          '##..22....',
          '##......##',
          '##########',
          '##########',
        ],
        entities: [
          ['pickup', 4, 3, { kind: 'dungeonMap' }],
          ['beetle', 6, 2],
        ],
      },
      '0,3,2': {
        name: 'Lower Reliquary',
        map: [
          '##########',
          '##########',
          '##..22..##',
          '##......##',
          '##_____.##',
          '##..22..##',
          '####..####',
          '####..####',
        ],
        entities: [
          ['pickup', 4, 3, { kind: 'rupee20' }],
          ['wisp', 2, 2],
        ],
      },
      '0,3,3': {
        name: 'Vault Lock',
        map: [
          '####..####',
          '#........#',
          '####L#####',
          '..........',
          '...""""...',
          '#........#',
          '#..q..q..#',
          '####..####',
        ],
        entities: [
          ['darknut', 2, 4],
          ['keese', 6, 5],
        ],
      },
      '0,3,4': {
        name: 'The Basins',
        map: [
          '####..####',
          '#.22..22.#',
          '#.222222.#',
          '..........',
          '..........',
          '#.______.#',
          '#.22..22.#',
          '####..####',
        ],
        entities: [
          ['zol', 4, 3],
          ['beetle', 2, 2],
        ],
        puzzle: {
          enemies: true,
          flag: 'd6_034_puzzle',
          reward: {
            spawn: [['pickup', 3, 3, { kind: 'rupee5' }]],
            say: 'Loose stone shifts, and something rolls out.',
          },
        },
      },
      '0,3,5': {
        name: 'Brine Hall',
        map: [
          '####..####',
          '#..q..q..#',
          '#.222222.#',
          '..........',
          '..........',
          '#.222222.#',
          '#..q..q..#',
          '####..####',
        ],
        entities: [
          ['darknut', 4, 3],
          ['keese', 2, 5],
          ['switch', 1, 2],
          ['switch', 8, 2],
          ['block', 1, 3],
          ['block', 8, 3],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd6_035_puzzle',
          reward: {
            spawn: [['pickup', 3, 3, { kind: 'fairy' }]],
            say: 'A light comes up out of the water.',
          },
        },
      },
      '0,3,6': {
        name: 'Salt Landing',
        map: [
          '####..####',
          '#.2....2.#',
          '#.2..>.2.#',
          '#....>...#',
          '#....>...#',
          '#.2..>.2.#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['beetle', 3, 3],
          ['zol', 6, 4],
          ['torch', 1, 1],
          ['torch', 8, 1],
          ['torch', 1, 6],
        ],
        puzzle: {
          torches: 'all',
          flag: 'd6_036_puzzle',
          reward: {
            spawn: [['pickup', 4, 3, { kind: 'bomb4' }]],
            say: 'A cache opens in the wall.',
          },
        },
      },
      '0,3,7': {
        name: 'Vault Door',
        map: [
          '####..####',
          '#........#',
          '#.p....p.#',
          '#........#',
          '#.22..22.#',
          '#........#',
          '#........#',
          '####/#####',
        ],
        warps: [
          { x: 4, y: 7, to: { map: 'overworld', floor: 0, rx: 6, ry: 1, px: 48, py: 48, dir: 'down' } },
        ],
        readable: [
          [2, 3, 'Salt-etched: "Draw the sea off and the flame will answer."'],
        ],
      },
      '0,4,3': {
        name: 'Vault Stair',
        map: [
          '##########',
          '##....../#',
          '##......##',
          '.....<...#',
          '.....<..##',
          '##...<..##',
          '####..####',
          '####..####',
        ],
        warps: [
          { x: 8, y: 1, to: { map: 'd6', floor: 1, rx: 3, ry: 5, px: 72, py: 96 } },
        ],
        entities: [
          ['beetle', 3, 4],
        ],
      },
      '0,4,4': {
        name: 'Switch Kiln',
        map: [
          '####..####',
          '####..####',
          '##......##',
          '...2..2.##',
          '........##',
          '##......##',
          '####..####',
          '####..####',
        ],
        entities: [
          ['switch', 2, 2],
          ['switch', 7, 5],
          ['block', 2, 3],
          ['wizzrobe', 6, 2],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd6_switch',
          reward: { spawn: [['pickup', 4, 4, { kind: 'key' }]], say: 'Salt grinds under a shifting plate.' },
        },
      },
      '0,4,5': {
        name: 'First Kiln',
        map: [
          '####..####',
          '####..####',
          '##......##',
          '...2222.##',
          '...2222.##',
          '##......##',
          '##########',
          '##########',
        ],
        entities: [
          ['torch', 2, 2],
          ['torch', 7, 2],
          ['wisp', 4, 4],
        ],
        puzzle: {
          torches: 'all',
          flag: 'd6_kiln1',
          reward: { spawn: [['pickup', 4, 4, { kind: 'key' }]], say: 'Dry salt catches. The flame holds.' },
        },
      },
      '1,1,4': {
        name: 'Hookshot Vault',
        // The fourth Small Key spends here. d6 has no corridor above its
        // miniboss to gate, so the door goes across the vault itself and the
        // spare key buys the Hookshot instead of nothing.
        map: [
          '##########',
          '##########',
          '##....#.##',
          '##....L...',
          '#.....#...',
          '##....#.##',
          '##########',
          '##########',
        ],
        entities: [
          ['chest', 4, 3, { big: true, item: 'bottle', level: 1 }],
        ],
      },
      '1,2,3': {
        name: 'West Kiln',
        map: [
          '##########',
          '##########',
          '##..22..##',
          '#.........',
          '##........',
          '##......##',
          '##########',
          '##########',
        ],
        entities: [
          ['pickup', 4, 4, { kind: 'fairy' }],
          ['keese', 6, 2],
        ],
      },
      '1,2,4': {
        name: 'Saltwraith Hall',
        map: [
          '##########',
          '##..pp..##',
          '##......##',
          '..........',
          '..........',
          '##......##',
          '##......##',
          '####..####',
        ],
        entities: [
          ['saltwraith', 4, 3],
        ],
        puzzle: {
          enemies: true,
          flag: 'd6_saltwraith',
          reward: { say: 'The salt collapses into a heap and stays there.' },
        },
      },
      '1,2,5': {
        name: 'Second Kiln',
        map: [
          '####..####',
          '####..####',
          '##......##',
          '#.........',
          '#.........',
          '##......##',
          '##########',
          '##########',
        ],
        entities: [
          ['torch', 2, 2],
          ['torch', 7, 2],
          ['torch', 4, 5],
          ['darknut', 4, 3],
        ],
        puzzle: {
          torches: 'all',
          flag: 'd6_kiln2',
          reward: { spawn: [['pickup', 4, 4, { kind: 'key' }]], say: 'Three flames. The vault sighs open somewhere.' },
        },
      },
      '1,3,1': {
        name: 'Brinehulk, the Salt Golem',
        map: [
          '##########',
          '#........#',
          '#........#',
          '#....>...#',
          '#....>...#',
          '#....>...#',
          '#........#',
          '####..####',
        ],
        noTide: true,
        entities: [
          ['brinehulk', 4, 2],
        ],
        script: {
          onEvent(game, name) {
            if (name === 'bossDead') game.spawnPickup(80, 40, 'heartContainer', { grabDelay: 30 });
          },
        },
      },
      '1,3,2': {
        name: 'Vault Gate',
        map: [
          '####..####',
          '#........#',
          '####B#####',
          '#........#',
          '#.22..22.#',
          '#........#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['wisp', 6, 4],
        ],
      },
      '1,3,3': {
        name: 'Bosskey Kiln',
        map: [
          '####..####',
          '#........#',
          '####L#####',
          '.........#',
          '.........#',
          '#........#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['chest', 6, 4, { pickup: 'bossKey' }],
          ['darknut', 2, 4],
        ],
      },
      '1,3,4': {
        name: 'Upper Lock',
        map: [
          '####..####',
          '#........#',
          '####L#####',
          '..........',
          '..........',
          '#........#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['beetle', 2, 4],
          ['keese', 6, 5],
        ],
      },
      '1,3,5': {
        name: 'Upper Vault',
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
          { x: 8, y: 1, to: { map: 'd6', floor: 0, rx: 4, ry: 3, px: 112, py: 40 } },
        ],
        entities: [
          ['keese', 3, 4],
        ],
      },
      '1,4,4': {
        name: 'Crystal Cell',
        map: [
          '##########',
          '##########',
          '##.3333.##',
          '.........#',
          '...3333.##',
          '##......##',
          '####..####',
          '####..####',
        ],
        entities: [
          ['pickup', 4, 5, { kind: 'rupee20' }],
          ['beamos', 4, 2],
        ],
      },
      '1,4,5': {
        name: 'Wraith Antechamber',
        map: [
          '####..####',
          '####..####',
          '##..pp..##',
          '.........#',
          '.........#',
          '##..pp..##',
          '##########',
          '##########',
        ],
        entities: [
          ['wizzrobe', 3, 3],
          ['wizzrobe', 6, 4],
          ['beetle', 4, 2],
        ],
        puzzle: {
          enemies: true,
          flag: 'd6_ante',
          reward: { spawn: [['pickup', 4, 3, { kind: 'key' }]], say: 'The robes fall empty.' },
        },
      },
    },
  });

  // --- Dungeon 7: Reef Palace ----------------------------------------------
  // Tide theme: the palace is a system of channels, and which way they run is
  // decided by the tide. Channels wade only at LOW; raise the sea and the same
  // corridors become deep water that carries you. Wells stay water throughout,
  // so the Flippers matter as much as the conch.
  //
  // Intended route:
  //   3,7 entrance -> 3,6 -> 3,5 hub -> 2,5 Dungeon Map -> 4,5 Small Key 1
  //   -> 3,4 currents -> 2,4 Compass -> 4,4 Small Key 2
  //   -> 3,3 locked -> stairs at 2,3 up to floor 1
  //   -> 1F 3,5 -> 4,5 Small Key 3 -> 2,5 Small Key 4 -> 3,4 locked
  //   -> 4,4 Gustharpy (miniboss) -> 5,4 big chest: Magnetic Gloves
  //   -> 4,3 locked -> 4,2 Boss Key -> 3,2 boss door -> 3,1 Thalassor
  registerMap({
    id: 'd7',
    kind: 'dungeon',
    name: 'Reef Palace',
    w: 8, h: 8, floors: 2,
    legend: 'dungeonPalace',
    music: 'dungeon',
    tint: 'cave',
    scroll: false,
    dungeon: {
      index: 7,
      item: 'cleats', itemLevel: 2,
      essence: 7,
      boss: 'thalassor',
      bossRoom: '1,3,1',
      startRoom: '3,7',
      entrance: { map: 'overworld', floor: 0, rx: 10, ry: 1, px: 64, py: 32 },
    },
    rooms: {
      '0,2,3': {
        name: 'Palace Stair',
        map: [
          '##########',
          '##....../#',
          '##......##',
          '#....>....',
          '##...>....',
          '##...>..##',
          '####..####',
          '####..####',
        ],
        warps: [
          { x: 8, y: 1, to: { map: 'd7', floor: 1, rx: 3, ry: 5, px: 72, py: 96 } },
        ],
        entities: [
          ['crab', 3, 4],
        ],
      },
      '0,2,4': {
        name: 'Compass Chamber',
        map: [
          '####..####',
          '####..####',
          '##..33..##',
          '##........',
          '##........',
          '##..33..##',
          '####..####',
          '####..####',
        ],
        entities: [
          ['chest', 4, 3, { pickup: 'chartstone' }],
          ['siren', 6, 4],
        ],
      },
      '0,2,5': {
        name: 'Map Chamber',
        map: [
          '####..####',
          '####..####',
          '##......##',
          '##..55....',
          '##..55....',
          '##......##',
          '##########',
          '##########',
        ],
        entities: [
          ['pickup', 4, 3, { kind: 'dungeonMap' }],
          ['urchin', 6, 2],
        ],
      },
      '0,3,2': {
        name: 'Lower Gallery',
        map: [
          '##########',
          '##########',
          '##..55..##',
          '##......##',
          '##......##',
          '##..55..##',
          '####..####',
          '####..####',
        ],
        entities: [
          ['pickup', 4, 3, { kind: 'rupee20' }],
          ['siren', 2, 2],
        ],
      },
      '0,3,3': {
        name: 'Palace Lock',
        map: [
          '####..####',
          '#........#',
          '####L#####',
          '..........',
          '...""""...',
          '#........#',
          '#..q..q..#',
          '####..####',
        ],
        entities: [
          ['darknut', 2, 4],
          ['keese', 6, 5],
        ],
      },
      '0,3,4': {
        name: 'The Currents',
        map: [
          '####..####',
          '#.55..55.#',
          '#.5.33.5.#',
          '..........',
          '..........',
          '#.5.33.5.#',
          '#.55..55.#',
          '####..####',
        ],
        entities: [
          ['octorokSea', 4, 3],
          ['jellyfish', 2, 2],
        ],
        puzzle: {
          enemies: true,
          flag: 'd7_034_puzzle',
          reward: {
            spawn: [['pickup', 3, 3, { kind: 'rupee20' }]],
            say: 'A catch lets go under the floor.',
          },
        },
      },
      '0,3,5': {
        name: 'Current Hall',
        map: [
          '####..####',
          '#..q..q..#',
          '#.555555.#',
          '..........',
          '..........',
          '#.555555.#',
          '#..q..q..#',
          '####..####',
        ],
        entities: [
          ['siren', 4, 2],
          ['octorokSea', 2, 5],
          ['jellyfish', 7, 3],
          ['switch', 1, 2],
          ['switch', 8, 2],
          ['block', 1, 3],
          ['block', 8, 3],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd7_035_puzzle',
          reward: {
            spawn: [['pickup', 4, 3, { kind: 'heart' }]],
            say: 'Water drains out of a niche in the wall.',
          },
        },
      },
      '0,3,6': {
        name: 'Palace Landing',
        map: [
          '####..####',
          '#.5....5.#',
          '#.5....5.#',
          '#........#',
          '#........#',
          '#.5____5.#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['crab', 3, 3],
          ['jellyfish', 6, 4],
          ['torch', 1, 1],
          ['torch', 8, 1],
          ['torch', 1, 6],
        ],
        puzzle: {
          torches: 'all',
          flag: 'd7_036_puzzle',
          reward: {
            spawn: [['pickup', 4, 3, { kind: 'rupee5' }]],
            say: 'Loose stone shifts, and something rolls out.',
          },
        },
      },
      '0,3,7': {
        name: 'Palace Door',
        map: [
          '####..####',
          '#........#',
          '#.p....p.#',
          '#........#',
          '#.55..55.#',
          '#........#',
          '#........#',
          '####/#####',
        ],
        warps: [
          { x: 4, y: 7, to: { map: 'overworld', floor: 0, rx: 10, ry: 1, px: 64, py: 32, dir: 'down' } },
        ],
        readable: [
          [2, 3, 'Set in shell: "The current obeys the height, not the swimmer."'],
        ],
      },
      '0,4,3': {
        name: 'Shell Court',
        map: [
          '##########',
          '##########',
          '##.3333.##',
          '..........',
          '..........',
          '##.3333.##',
          '####..####',
          '####..####',
        ],
        entities: [
          ['barnacle', 3, 2],
          ['barnacle', 6, 5],
          ['pickup', 4, 3, { kind: 'rupee20' }],
        ],
      },
      '0,4,4': {
        name: 'Beamos Court',
        map: [
          '####..####',
          '####..####',
          '##......##',
          '...5..5.##',
          '........##',
          '##......##',
          '####..####',
          '####..####',
        ],
        entities: [
          ['beamos', 2, 2],
          ['beamos', 7, 5],
          ['switch', 4, 3],
          ['block', 4, 4],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd7_beamos',
          reward: { spawn: [['pickup', 4, 4, { kind: 'key' }]], say: 'The eyes close together.' },
        },
      },
      '0,4,5': {
        name: 'Whirl Cell',
        map: [
          '####..####',
          '####..####',
          '##......##',
          '...3333.##',
          '...3333.##',
          '##......##',
          '##########',
          '##########',
        ],
        entities: [
          ['siren', 2, 2],
          ['anglerfry', 7, 5],
          ['jellyfish', 4, 4],
        ],
        puzzle: {
          enemies: true,
          flag: 'd7_whirl',
          reward: { spawn: [['pickup', 4, 3, { kind: 'key' }]], say: 'The whirlpool spits something out.' },
        },
      },
      '0,5,3': {
        name: 'Deep Court',
        map: [
          '##########',
          '##########',
          '##.3333.##',
          '...3333.##',
          '...3333.##',
          '##......##',
          '##########',
          '##########',
        ],
        entities: [
          ['anglerfry', 4, 2],
          ['pickup', 4, 5, { kind: 'fairy' }],
        ],
      },
      '1,2,3': {
        name: 'West Gallery',
        map: [
          '##########',
          '##########',
          '##..55..##',
          '#.........',
          '##........',
          '##......##',
          '####..####',
          '####..####',
        ],
        entities: [
          ['pickup', 4, 4, { kind: 'fairy' }],
          ['urchin', 6, 2],
        ],
      },
      '1,2,4': {
        name: 'Colonnade',
        map: [
          '####..####',
          '####..####',
          '##.q..q.##',
          '##........',
          '##........',
          '##.q..q.##',
          '####..####',
          '####..####',
        ],
        entities: [
          ['beamos', 4, 3],
          ['pickup', 2, 2, { kind: 'rupee20' }],
        ],
      },
      '1,2,5': {
        name: 'Gale Cell',
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
          ['wizzrobe', 6, 4],
          ['keese', 4, 2],
        ],
        puzzle: {
          enemies: true,
          flag: 'd7_gale',
          reward: { spawn: [['pickup', 4, 3, { kind: 'key' }]], say: 'The wind drops. Something falls with it.' },
        },
      },
      '1,3,1': {
        name: 'Thalassor, the Coiled Eel',
        map: [
          '##########',
          '#........#',
          '#........#',
          '#....<...#',
          '#....<...#',
          '#....<...#',
          '#........#',
          '####..####',
        ],
        noTide: true,
        entities: [
          ['thalassor', 4, 2],
        ],
        script: {
          onEvent(game, name) {
            if (name === 'bossDead') game.spawnPickup(80, 40, 'heartContainer', { grabDelay: 30 });
          },
        },
      },
      '1,3,2': {
        name: 'Palace Gate',
        map: [
          '####..####',
          '#........#',
          '####B#####',
          '#........#',
          '#.55..55.#',
          '#........#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['jellyfish', 6, 4],
        ],
      },
      '1,3,3': {
        name: 'Upper Nave',
        map: [
          '####..####',
          '#........#',
          '#.3....3.#',
          '.........#',
          '.........#',
          '#.3____3.#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['octorokSea', 4, 3],
          ['darknut', 2, 2],
        ],
        puzzle: {
          enemies: true,
          flag: 'd7_133_puzzle',
          reward: {
            spawn: [['pickup', 4, 2, { kind: 'fairy' }]],
            say: 'A light comes up out of the water.',
          },
        },
      },
      '1,3,4': {
        name: 'Upper Lock',
        map: [
          '####..####',
          '#........#',
          '####L#####',
          '..........',
          '..........',
          '#........#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['urchin', 2, 4],
          ['keese', 6, 5],
        ],
      },
      '1,3,5': {
        name: 'Upper Palace',
        map: [
          '####..####',
          '##....../#',
          '##...>..##',
          '.....>....',
          '.....>....',
          '##......##',
          '#........#',
          '##########',
        ],
        warps: [
          { x: 8, y: 1, to: { map: 'd7', floor: 0, rx: 2, ry: 3, px: 112, py: 40 } },
        ],
        entities: [
          ['keese', 3, 4],
        ],
      },
      '1,4,2': {
        name: 'Bosskey Gallery',
        map: [
          '##########',
          '##########',
          '##......##',
          '#........#',
          '##..33..##',
          '##......##',
          '####..####',
          '####..####',
        ],
        entities: [
          ['chest', 4, 2, { pickup: 'bossKey' }],
          ['darknut', 6, 4],
        ],
      },
      '1,4,3': {
        name: 'Upper Current',
        // The fourth Small Key spends here: this is the only way up to the Boss
        // Key, so the key the dungeon used to hand out spare now has a door.
        map: [
          '####..####',
          '##......##',
          '####L#####',
          '#........#',
          '#........#',
          '##......##',
          '##......##',
          '####..####',
        ],
        entities: [
          ['siren', 4, 3],
        ],
      },
      '1,4,4': {
        name: 'Gustharpy Court',
        map: [
          '####..####',
          '##......##',
          '####L#####',
          '..........',
          '..........',
          '##......##',
          '##......##',
          '####..####',
        ],
        entities: [
          ['gustharpy', 4, 4],
        ],
        puzzle: {
          enemies: true,
          flag: 'd7_gustharpy',
          reward: { say: 'The wind that carried it is gone.' },
        },
      },
      '1,4,5': {
        name: 'Torch Gallery',
        map: [
          '####..####',
          '####..####',
          '##......##',
          '.........#',
          '.........#',
          '##......##',
          '##########',
          '##########',
        ],
        entities: [
          ['torch', 2, 2],
          ['torch', 7, 2],
          ['torch', 2, 5],
          ['torch', 7, 5],
          ['darknut', 4, 3],
        ],
        puzzle: {
          torches: 'all',
          flag: 'd7_torches',
          reward: { spawn: [['pickup', 4, 3, { kind: 'key' }]], say: 'Four flames in a drowned palace. Someone is impressed.' },
        },
      },
      '1,5,4': {
        name: 'Magnet Vault',
        map: [
          '##########',
          '##########',
          '##......##',
          '.........#',
          '........##',
          '##......##',
          '##########',
          '##########',
        ],
        entities: [
          ['chest', 4, 3, { big: true, item: 'cleats', level: 2 }],
        ],
      },
    },
  });

  // --- Dungeon 8: Abyssal Keep ---------------------------------------------
  // Tide theme: everything at once. The Keep's rooms mix sluices, basins, wells,
  // drains and drown-walls in the same grid, so crossing one usually means
  // cycling the conch through all three heights rather than picking a level and
  // staying there. The Mermaid Suit inside makes the deepest water yours.
  //
  // Intended route:
  //   3,7 entrance -> 3,6 -> 3,5 hub -> 2,5 Dungeon Map -> 4,5 Small Key 1
  //   -> 3,4 the three-height gallery -> 2,4 Compass -> 4,4 Small Key 2
  //   -> 3,3 locked -> stairs at 2,3 up to floor 1
  //   -> 1F 3,5 -> 4,5 Small Key 3 -> 2,5 Small Key 4 -> 3,4 locked
  //   -> 4,4 Tideshade (miniboss) -> 5,4 big chest: Mermaid Suit
  //   -> 4,3 locked -> 4,2 Boss Key -> 3,2 boss door -> 3,1 Nereth
  registerMap({
    id: 'd8',
    kind: 'dungeon',
    name: 'Abyssal Keep',
    w: 8, h: 8, floors: 2,
    legend: 'dungeonAbyss',
    music: 'dungeon2',
    tint: 'cave',
    scroll: false,
    dungeon: {
      index: 8,
      item: 'dredge', itemLevel: 1,
      essence: 8,
      boss: 'nereth',
      bossRoom: '1,3,1',
      startRoom: '3,7',
      entrance: { map: 'overworld', floor: 0, rx: 1, ry: 0, px: 64, py: 32 },
    },
    rooms: {
      '0,2,3': {
        name: 'Keep Stair',
        map: [
          '##########',
          '##....../#',
          '##......##',
          '#....<....',
          '##...<....',
          '##...<..##',
          '####..####',
          '####..####',
        ],
        warps: [
          { x: 8, y: 1, to: { map: 'd8', floor: 1, rx: 3, ry: 5, px: 72, py: 96 } },
        ],
        entities: [
          ['stalfos', 3, 4],
        ],
      },
      '0,2,4': {
        name: 'Compass Crypt',
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
      '0,2,5': {
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
      '0,3,2': {
        name: 'Lower Crypt',
        map: [
          '##########',
          '##########',
          '##..99..##',
          '##......##',
          '##......##',
          '##..99..##',
          '####..####',
          '####..####',
        ],
        entities: [
          ['pickup', 4, 3, { kind: 'rupee20' }],
          ['wizzrobe', 2, 2],
        ],
      },
      '0,3,3': {
        name: 'Keep Lock',
        map: [
          '####..####',
          '#........#',
          '####L#####',
          '..........',
          '...""""...',
          '#........#',
          '#..q..q..#',
          '####..####',
        ],
        entities: [
          ['darknut', 2, 4],
          ['wizzrobe', 6, 5],
        ],
      },
      '0,3,4': {
        name: 'Three Heights',
        map: [
          '####..####',
          '#.11..11.#',
          '#.9.44.9.#',
          '..........',
          '..........',
          '#.9.44.9.#',
          '#.22..22.#',
          '####..####',
        ],
        entities: [
          ['wizzrobe', 4, 3],
          ['jellyfish', 2, 2],
          ['switch', 1, 2],
          ['switch', 8, 2],
          ['block', 1, 3],
          ['block', 8, 3],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd8_034_puzzle',
          reward: {
            spawn: [['pickup', 3, 3, { kind: 'bomb4' }]],
            say: 'A cache opens in the wall.',
          },
        },
      },
      '0,3,5': {
        name: 'Drowned Hall',
        map: [
          '####..####',
          '#..q..q..#',
          '#.191919.#',
          '..........',
          '..........',
          '#.919191.#',
          '#..q..q..#',
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
          flag: 'd8_035_puzzle',
          reward: {
            spawn: [['pickup', 4, 3, { kind: 'rupee20' }]],
            say: 'A catch lets go under the floor.',
          },
        },
      },
      '0,3,6': {
        name: 'Keep Landing',
        map: [
          '####..####',
          '#.1....1.#',
          '#.9....9.#',
          '#........#',
          '#........#',
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
          flag: 'd8_036_puzzle',
          reward: {
            spawn: [['pickup', 4, 3, { kind: 'heart' }]],
            say: 'Water drains out of a niche in the wall.',
          },
        },
      },
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
          [2, 3, 'Cut in black stone: "Three heights. One way through."'],
        ],
      },
      '0,4,3': {
        name: 'Sunken Crypt',
        // The Dredge Line's room. The crypt's wells are deep at MID and HIGH
        // and there is a Small Key on the bottom of the near one — no tide
        // level exposes it and no sword reaches it. You fish for it.
        map: [
          '##########',
          '##########',
          '##.3333.##',
          '..........',
          '..........',
          '##.3333.##',
          '####..####',
          '####..####',
        ],
        buried: [[4, 2, 'key'], [6, 5, 'rupee20']],
        entities: [
          ['siren', 3, 2],
          ['anglerfry', 6, 5],
          // Rung, it points at the well with the key in it. A direction and
          // never a distance — see docs/ITEMS.md.
          ['bell', 8, 4, { points: [4, 2], say: 'The bell hums toward the near well.' }],
        ],
      },
      '0,4,4': {
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
          flag: 'd8_drain',
          reward: { spawn: [['pickup', 4, 4, { kind: 'key' }]], say: 'The drain gutters and something bright goes down it.' },
        },
      },
      '0,4,5': {
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
          flag: 'd8_bone',
          reward: { spawn: [['pickup', 4, 3, { kind: 'key' }]], say: 'The bones settle. A key is among them.' },
        },
      },
      '0,5,3': {
        name: 'Abyssal Cell',
        map: [
          '##########',
          '##########',
          '##.3333.##',
          '...3333.##',
          '...3333.##',
          '##......##',
          '##########',
          '##########',
        ],
        entities: [
          ['anglerfry', 4, 2],
          ['pickup', 4, 5, { kind: 'fairy' }],
        ],
      },
      '1,2,3': {
        name: 'West Crypt',
        map: [
          '##########',
          '##########',
          '##..99..##',
          '#.........',
          '##........',
          '##......##',
          '####..####',
          '####..####',
        ],
        entities: [
          ['pickup', 4, 4, { kind: 'fairy' }],
          ['stalfos', 6, 2],
        ],
      },
      '1,2,4': {
        name: 'Crowned Colonnade',
        map: [
          '####..####',
          '####..####',
          '##.q..q.##',
          '##........',
          '##........',
          '##.q..q.##',
          '####..####',
          '####..####',
        ],
        entities: [
          ['beamos', 4, 3],
          ['pickup', 2, 2, { kind: 'rupee20' }],
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
          flag: 'd8_shade',
          reward: { spawn: [['pickup', 4, 3, { kind: 'key' }]], say: 'The shadows thin out.' },
        },
      },
      '1,3,1': {
        name: 'Nereth, the Drowned King',
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
        entities: [
          ['nereth', 4, 2],
        ],
        script: {
          onEvent(game, name) {
            if (name === 'bossDead') game.spawnPickup(80, 40, 'heartContainer', { grabDelay: 30 });
          },
        },
      },
      '1,3,2': {
        name: 'Keep Gate',
        map: [
          '####..####',
          '#........#',
          '####B#####',
          '#........#',
          '#.19..91.#',
          '#........#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['wizzrobe', 6, 4],
        ],
      },
      '1,3,3': {
        name: 'Throne Approach',
        map: [
          '####..####',
          '#........#',
          '#.9..>.9.#',
          '.....>...#',
          '.....>...#',
          '#.9..>.9.#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['darknut', 4, 3],
          ['darknut', 2, 2],
          ['switch', 1, 2],
          ['switch', 8, 2],
          ['block', 1, 3],
          ['block', 8, 3],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd8_133_puzzle',
          reward: {
            spawn: [['pickup', 4, 2, { kind: 'rupee5' }]],
            say: 'Loose stone shifts, and something rolls out.',
          },
        },
      },
      '1,3,4': {
        name: 'Upper Lock',
        map: [
          '####..####',
          '#........#',
          '####L#####',
          '..........',
          '..........',
          '#........#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['stalfos', 2, 4],
          ['keese', 6, 5],
        ],
      },
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
          { x: 8, y: 1, to: { map: 'd8', floor: 0, rx: 2, ry: 3, px: 112, py: 40 } },
        ],
        entities: [
          ['keese', 3, 4],
        ],
      },
      '1,4,2': {
        name: 'Bosskey Crypt',
        // The Boss Key sits behind a grate: metal, and the only thing in the
        // game that retracts metal is the Resonance Rod. The grate seals the
        // alcove and nothing else, because a grate across a corridor would
        // strand the room and still validate.
        map: [
          '##########',
          '##########',
          '###....###',
          '###GGGG###',
          '##..44..##',
          '##......##',
          '####..####',
          '####..####',
        ],
        entities: [
          ['chest', 4, 2, { pickup: 'bossKey' }],
          ['darknut', 6, 4],
        ],
      },
      '1,4,3': {
        name: 'Upper Drown',
        // The fourth Small Key spends here: this is the only way up to the Boss
        // Key, so the key the dungeon used to hand out spare now has a door.
        map: [
          '####..####',
          '##......##',
          '####L#####',
          '#........#',
          '#........#',
          '##......##',
          '##......##',
          '####..####',
        ],
        entities: [
          ['siren', 4, 3],
        ],
      },
      '1,4,4': {
        name: 'Tideshade Hall',
        map: [
          '####..####',
          '##......##',
          '####L#####',
          '..........',
          '..........',
          '##......##',
          '##......##',
          '####..####',
        ],
        entities: [
          ['tideshade', 4, 4],
        ],
        puzzle: {
          enemies: true,
          flag: 'd8_tideshade',
          reward: { say: 'The shade unravels into water and is gone.' },
        },
      },
      '1,4,5': {
        name: 'Black Kiln',
        map: [
          '####..####',
          '####..####',
          '##......##',
          '.........#',
          '.._____..#',
          '##......##',
          '##########',
          '##########',
        ],
        entities: [
          ['torch', 2, 2],
          ['torch', 7, 2],
          ['torch', 2, 5],
          ['torch', 7, 5],
          ['darknut', 4, 3],
        ],
        puzzle: {
          torches: 'all',
          flag: 'd8_kiln',
          reward: { spawn: [['pickup', 4, 3, { kind: 'key' }]], say: 'Four flames in the Drowned King\'s house.' },
        },
      },
      '1,5,4': {
        name: 'Dredge Vault',
        map: [
          '##########',
          '##########',
          '##......##',
          '.........#',
          '........##',
          '##......##',
          '##########',
          '##########',
        ],
        entities: [
          ['chest', 4, 3, { big: true, item: 'dredge', level: 1 }],
        ],
      },
    },
  });
}
