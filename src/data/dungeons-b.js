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
  // AN ORACLE DUNGEON (S140), built like the first four: 15x11 rooms with a
  // wall ring, a scrolling camera, one-tile doors, and key, shutter and boss
  // doors in the ring between two rooms. The kit is the Ancient Ruins'
  // (`r*` picks in tools/rip-dungeon-themes.py). Every grove is the same
  // fixture it was at 10x8 — bank, bole, stake, snarl, in the same order and
  // the same spacing — set into a bigger room so its doors are in the middle
  // of their walls.
  //
  // GROWN AT S142 to 36 rooms, 40 screens: a required west wing off the
  // Silt Cell (the Knotted Pool, the Root Ford — the first room where a push
  // block crosses a pillar) holds the key to Thornvine's door; eight optional
  // rooms east and west hold five charms. Seed sprigs grow back in the Silt
  // Cell, the Grove Crossing and the Bower Spring.
  //
  // Intended route (the Reefseed at room 14):
  //   3,7 entrance -> 3,6 landing -> 2,6 Dungeon Map / 4,6 Small Key 1
  //   -> 3,5 the Standing Grove (key door north) -> 2,5 Chartstone
  //   -> 1,5 heart piece -> 4,5 charm -> 5,5 -> 4,4 Small Key 2 -> 3,4
  //   -> 2,4 (key door west) -> 1,4 REEFSEED -> 1,3 the First Stake (grove 1)
  //   -> 2,3 the Bole Walk (grove 2) -> 2,2 the Sunken Nave (grove 3, Small
  //      Key 3) -> 1,2 -> 0,2 the Knotted Pool -> 0,3 the Root Ford (Small
  //      Key 4) -> 3,3 Grove Crossing (key door west) -> 4,3 the Long
  //      Ford (grove 4, key door east) -> 5,3 Thornvine (miniboss) -> 4,2 the Shrine Ford
  //      (grove 5, three screens, Boss Key) -> 3,2 boss door -> 3,1 Rootmaw
  registerMap({
    id: 'd5',
    kind: 'dungeon',
    name: 'Drowned Wood Shrine',
    w: 8, h: 8, floors: 2,
    cell: [15, 11],
    legend: 'dungeonWood',
    music: 'dungeon5',
    tint: 'cave',
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
        // The Ruins' own entrance hall: purple eye statues down both sides
        // and the lit step between two pillars in the south wall.
        map: [
          '#######.#######',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#....22222....#',
          '#....22222....#',
          '#....22222....#',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '######(C)######',
        ],
        warps: [
          { x: 7, y: 10, to: { map: 'overworld', floor: 0, rx: 5, ry: 4, px: 64, py: 32, dir: 'down' } },
        ],
        readable: [
          [2, 8, 'Cut into the lintel: "Plant your seeds, then stand on what grows."'],
        ],
      },
      '0,3,6': {
        name: 'Rootwater Landing',
        map: [
          '#######.#######',
          '#.............#',
          '#..8.......8..#',
          '#.............#',
          '#.............#',
          '...............',
          '#.............#',
          '#.............#',
          '#..8.......8..#',
          '#.............#',
          '#######.#######',
        ],
        entities: [
          ['keese', 10, 3],
          ['tektite', 4, 7],
        ],
      },
      '0,2,6': {
        name: 'Silt Gallery',
        map: [
          '###############',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#....11111....#',
          '#....11111.....',
          '#....11111....#',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['chest', 7, 2, { pickup: 'dungeonMap' }],
          ['keese', 11, 7],
        ],
      },
      '0,4,6': {
        name: 'Bracken Cell',
        map: [
          '###############',
          '#.............#',
          '#.............#',
          '#...2222222...#',
          '#...2222222...#',
          '....2222222...#',
          '#...2222222...#',
          '#...2222222...#',
          '#.............#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['stalfos', 3, 2],
          ['tektite', 11, 5],
          ['keese', 10, 1],
        ],
        puzzle: {
          enemies: true,
          flag: 'd5_bracken',
          reward: {
            spawn: [['pickup', 7, 8, { kind: 'key' }]],
            say: 'Something drops out of the bracken.',
          },
        },
      },
      '0,3,5': {
        name: 'The Standing Grove',
        // The bole taught before it is ever load-bearing — and, since S186,
        // the first thing the Canopy plants. A hold plate stands on a one-tile
        // dais in a ring of holes three tiles wide: no throw carries that far
        // (a seed goes two tiles, or three from the very lip of a hole — S186
        // found two wide was not enough), no perch can be grown in a hole, and no
        // swimmer crosses one, at any sea. It is in plain sight from the first
        // visit, and a knot-hole in the Grove Crown is directly over it: a
        // seed dropped through grows on the plate and holds it for good
        // (`dropRoom`, check-canopy.mjs), and a chest rises by the door.
        // The four drowned trees in its corners are the bole taught as
        // before: timber at LOW and MID, open water at HIGH, free to fail.
        // Its key door north is the short way into Rootbound Hall.
        map: [
          '#######L#######',
          '#.............#',
          '#5..OOOOOOO..5#',
          '#...OOOOOOO...#',
          '#...OOOOOOO...#',
          '....OOO.OOO....',
          '#...OOOOOOO...#',
          '#...OOOOOOO...#',
          '#5..OOOOOOO..5#',
          '#.U...........#',
          '#######.#######',
        ],
        dropRoom: { from: '1,3,5', hole: [7, 5], plate: [7, 5] },
        entities: [
          ['switch', 7, 5, { stake: true }],
          ['chest', 12, 3, { pickup: 'key', needFlag: 'd5_standingGrove' }],
          ['tektite', 11, 9],
          ['keese', 3, 1],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd5_standingGrove',
          reward: { reveal: true, say: 'The coral holds the plate down.\nA chest rises by the east wall.' },
        },
        readable: [
          [2, 9, 'Scratched into the bark: "At HIGH tide the trees here vanish underwater. Everything in this shrine starts from that."'],
        ],
      },
      '0,2,5': {
        name: 'Chartstone Nave',
        map: [
          '#######.#######',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#....33333....#',
          '.....33333.....',
          '#....33333....#',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['chest', 7, 2, { pickup: 'chartstone' }],
          ['urchin', 7, 5],
        ],
      },
      '0,1,5': {
        name: 'Drowned Cloister',
        // A drown-wall box with one square of floor in it: the Shrine's own
        // stone at LOW and MID, deep water at HIGH.
        map: [
          '###############',
          '#.............#',
          '#.............#',
          '#.....999.....#',
          '#.....9.9.....#',
          '#.....999......',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['pickup', 7, 4, { kind: 'heartPiece' }],
          ['keese', 11, 8],
        ],
      },
      '0,4,5': {
        name: 'Thicket Cell',
        map: [
          '#######.#######',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#.............#',
          '...............',
          '#....,,,,,....#',
          '#....,,,,,....#',
          '#.U.........U.#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['chest', 7, 3, { charm: 'gillcarve' }],
          ['stalfos', 11, 5],
        ],
      },
      '0,5,5': {
        name: 'Bower Cell',
        // D5's second Piece of Heart, behind the Shrine's own second item: a
        // Bellows sill, the Cistern's Squall Loft in the Shrine's stone — a
        // wheel boxed by wall on three sides and a pit on the fourth, a stand
        // across the pit, and a sump shaft the only way up to it, drowned at
        // the same sea the wheel is. The piece drops into the shaft below the
        // stand, not onto it: a pickup on the top row pops into the wall.
        map: [
          '###############',
          '#3OO.##########',
          '####.##.......#',
          '####0##.......#',
          '#...0.........#',
          '...............',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.............#',
          '###############',
        ],
        bellowsRoom: {
          wheel: [1, 1], stand: [4, 1], face: 'left', at: 1, gives: 'heartPiece',
        },
        entities: [
          ['wheel', 1, 1, { needTurns: 30 }],
          ['pickup', 11, 3, { kind: 'rupee20' }],
          ['tektite', 9, 7],
        ],
        script: {
          // Put the Piece of Heart back if it was released and never
          // collected — the Cistern Gauge's soft lock, one dungeon over.
          onEnter(game) {
            if (game.progress.flags.d5BowerWheel && !game.progress.secrets.d5BowerHeart) {
              game.spawnPickup(64, 32, 'heartPiece', { grabDelay: 14, saveKey: 'd5BowerHeart' });
            }
          },
          onEvent(game, name, data) {
            if (name !== 'valve' || !data || !data.open) return;
            game.progress.flags.d5BowerWheel = true;
            if (game.progress.secrets.d5BowerHeart) return;
            game.spawnPickup(64, 32, 'heartPiece', { grabDelay: 14, saveKey: 'd5BowerHeart' });
          },
        },
      },
      '0,5,4': {
        name: 'Coppice Cell',
        map: [
          '###############',
          '#.............#',
          '#...3333333...#',
          '#...3333333...#',
          '#...3333333...#',
          '....3333333...#',
          '#...3333333...#',
          '#.............#',
          '#.........../.#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['jellyfish', 7, 4],
          ['keese', 2, 1],
        ],
        warps: [
          // Up into the Hollow Three. The cell is the only way in and the only
          // way back out of it, so no wrong guess in there can strand anyone.
          { x: 12, y: 8, to: { map: 'd5', floor: 0, rx: 6, ry: 4, px: 104, py: 120, dir: 'up' } },
        ],
      },

      // ---------------------------------------------------- the hollow three
      //
      // THE SHRINE'S LENS FORK, and the second one outside the Coral Spire.
      // The Keep's Two Arches asks which stretch of WALL floods open; this one
      // asks which drowned OAK is hollow, which is the same verb read off the
      // Shrine's own timber instead of the Keep's masonry — and it is three
      // answers rather than two, so the odds no longer carry anyone.
      //
      // `Y` is `dBole`, a standing trunk at every sea. `5` is `dSnag`, which
      // IS `dBole` until HIGH and is open water at it. At MID all three lanes
      // are capped by the same trunk, the same tile and not a lookalike. One
      // sea up, one of them has washed out and the Cleats carry you through
      // it; the other two are still oak, and the climb back down the stairs is
      // what being wrong costs.
      //
      // The room holds the sea at MID and refuses the conch. All three valves
      // are INSIDE the lanes, past the one-way drops, so the water cannot be
      // moved from the shelf where the choice is made. It is a hollow in the
      // rock under the Coppice, the fork at 10x8 set into an Oracle room.
      '0,6,4': {
        name: 'The Hollow Three',
        map: [
          '###############',
          '###../.....####',
          '###YY#55#YY####',
          '###..#..#..####',
          '###..#..#..####',
          '###./#./#./####',
          '###"##"##"#####',
          '###..../...####',
          '###############',
          '###############',
          '###############',
        ],
        tideForce: 1,
        entities: [
          ['valve', 4, 4],
          ['valve', 7, 4],
          ['valve', 10, 4],
          ['pickup', 4, 1, { kind: 'rupee20' }],
          ['pickup', 8, 1, { kind: 'rupee20' }],
        ],
        warps: [
          // Back down to the Coppice, from the shelf and from either lane that
          // turned out to be solid oak.
          { x: 7, y: 7, to: { map: 'd5', floor: 0, rx: 5, ry: 4, px: 208, py: 128, dir: 'down' } },
          { x: 4, y: 5, to: { map: 'd5', floor: 0, rx: 5, ry: 4, px: 208, py: 128, dir: 'down' } },
          { x: 7, y: 5, to: { map: 'd5', floor: 0, rx: 5, ry: 4, px: 208, py: 128, dir: 'down' } },
          { x: 10, y: 5, to: { map: 'd5', floor: 0, rx: 5, ry: 4, px: 208, py: 128, dir: 'down' } },
          // And out of the loft above, once you are in it.
          { x: 5, y: 1, to: { map: 'd5', floor: 0, rx: 5, ry: 4, px: 208, py: 128, dir: 'down' } },
        ],
        script: {
          onEvent(game, name) {
            if (name === 'valve') game.forceTideStep();
          },
        },
        readable: [
          [6, 7, 'Burnt into the shelf: "Three trunks. Two are solid. Only one is hollow."'],
        ],
        lensRoom: {
          pin: 1, reveals: 2, decide: [6, 7],
          branches: [
            { name: 'the west trunk', land: [3, 5], probe: [3, 2], onward: [3, 1], escape: [4, 5] },
            { name: 'the middle trunk', land: [6, 5], probe: [6, 2], onward: [6, 1], escape: [7, 5] },
            { name: 'the east trunk', land: [9, 5], probe: [9, 2], onward: [9, 1], escape: [10, 5] },
          ],
        },
      },
      '0,4,4': {
        name: 'Sunken Bracken',
        // THE MIRROR STATUE, taught (S208, PUZZLE-PASS kind F; Seasons'
        // Unicorn's Cave armos, room $93). The statue in the walled run along
        // the top cannot be touched; every push of the block moves it a tile
        // the other way, and it will not step into water. Its plate is at the
        // run's east end past two gutters (dry only at LOW), and the block's
        // plate is east of anywhere the block can stand when the statue gets
        // there — so the block has to come back east, which drags the statue
        // west, unless the gutter beside it is water: walk it home at LOW,
        // bring the block back at MID.
        map: [
          '###############',
          '#...###########',
          '#...#...1..1.##',
          '#...###########',
          '#.............#',
          '...............',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#######.#######',
        ],
        statueRoom: { from: [7, 9], seas: [0, 1] },
        entities: [
          ['statue', 5, 2],
          ['block', 9, 7, { once: false }],
          ['switch', 12, 2],
          ['switch', 11, 8],
          ['keese', 2, 8],
          ['keese', 12, 4],
        ],
        puzzle: {
          blocks: [[12, 2], [11, 8]],
          flag: 'd5_bracken2',
          reward: {
            spawn: [['pickup', 7, 9, { kind: 'key' }]],
            say: 'A key drops from the statue\'s plinth.',
          },
        },
      },
      '0,3,4': {
        name: 'Rootbound Hall',
        // The hub under the Canopy (S186): the stair up in its south-east
        // corner climbs into the Hollow Crown, and the Crown's two knot-holes
        // drop back into its north-east corner.
        map: [
          '###############',
          '#.............#',
          '#.U.........U.#',
          '#...2222222...#',
          '#..222222222..#',
          '...222222222...',
          '#..222222222..#',
          '#...2222222...#',
          '#.............#',
          '#...........S.#',
          '#######L#######',
        ],
        warps: [{ x: 12, y: 9, to: { map: 'd5', floor: 1, rx: 3, ry: 4, px: 12 * 16, py: 8 * 16, dir: 'up' } }],
        entities: [
          ['barnacle', 7, 5],
          ['crab', 11, 8],
          ['keese', 3, 1],
        ],
      },
      '0,2,4': {
        name: "Warden's Sill",
        map: [
          '###############',
          '#.pp.......pp.#',
          '#.U...........#',
          '#.............#',
          '#....,,,,,....#',
          'L....,,,,,.....',
          '#....,,,,,....#',
          '#.............#',
          '#.............#',
          '#.p.........p.#',
          '#######.#######',
        ],
        entities: [
          ['stalfos', 9, 7],
        ],
        readable: [
          [2, 2, 'A warden\'s plate: "Past this door, you\'ll have to grow your own floor."'],
        ],
      },
      '0,1,4': {
        name: 'Reefseed Vault',
        map: [
          '#######.#######',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#....,,,,,....#',
          '.....,,,,,....L',
          '#....,,,,,....#',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['chest', 7, 5, { big: true, item: 'reefseed', level: 1 }],
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
      // ---------------------------------------------------- the west wing (S142)
      //
      // THE KEY TO THORNVINE'S DOOR, and the Reefseed asked two new ways. The
      // Knotted Pool builds the chain from the water up; the Root Ford is the
      // first room in the game where a push block crosses a pillar — the
      // road the whole dungeon is built on, which is only road at LOW — and
      // the first where the player stands on a pillar by swimming onto it at
      // HIGH and sounding the conch round to LOW.
      '0,0,2': {
        name: 'The Knotted Pool',
        // GROVE 6, the chain grown downward: the first stake at HIGH from the
        // bank over the drowned bole, the second at LOW from the first, and
        // the snarl in the floor of the pool cut from the second. The pool is
        // walled on both sides and the boles close it at LOW and MID, so the
        // first stake is stood on the Root Ford's way: swim out onto it at
        // HIGH and sound the conch round to LOW.
        map: [
          '###############',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#...###5###...#',
          '#...#WWWWW#....',
          '#...#WWWWW#...#',
          '#...#WWWWW#...#',
          '#######k#######',
          '#######.#######',
          '#######.#######',
        ],
        reefseedRoom: {
          entry: [14, 5],
          stakes: [
            { at: [7, 5], from: [7, 3], face: 'down', sea: 2 },
            { at: [7, 7], from: [7, 5], face: 'down', sea: 0 },
          ],
          snarl: [7, 8], cutFrom: [7, 7],
        },
        entities: [
          ['tektite', 11, 2],
          ['keese', 2, 7],
        ],
        readable: [
          [2, 3, 'Knotted into a rope on the wall: "Throw one from the bank at HIGH tide. Throw the next from the first at LOW."'],
        ],
      },
      '0,0,3': {
        name: 'The Root Ford',
        // THE BLOCK AND THE PILLAR. The block on the islet has to reach the
        // plate in the west pocket, and between them is one square of deep
        // water at 7,5. Grow a stake there — at HIGH, over the drowned bole
        // from the bank — and the block crosses it at LOW and at no other sea.
        // The islet and the pocket are cut off from the bank by stone except
        // through that square, so the way out to them is to swim over the
        // bole at HIGH and sound the conch round to LOW; the way back is to
        // sound it round to HIGH and swim.
        map: [
          '#######.#######',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#######5#######',
          '###....W..#####',
          '###...#.....###',
          '######......###',
          '######......###',
          '######....U.###',
          '###############',
        ],
        reefseedRoom: {
          entry: [7, 0],
          stakes: [
            { at: [7, 5], from: [7, 3], face: 'down', sea: 2 },
          ],
          block: [8, 5], target: [4, 5], pushFrom: [9, 5],
        },
        entities: [
          ['block', 8, 5, { once: false }],
          // TWO PLATES, BOTH HELD AT ONCE: one for the block and one for the
          // player. A plate answers to Link's own feet, so a single one would
          // be answered by walking onto it and the block would be scenery.
          ['switch', 4, 5],
          ['switch', 3, 6],
          ['tektite', 11, 2],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd5_rootford',
          reward: {
            spawn: [['pickup', 3, 2, { kind: 'key' }]],
            say: 'Something rattles loose above the ford.',
          },
        },
        readable: [
          [12, 3, 'A ferryman\'s mark: "The road is only there when the water isn\'t."'],
        ],
      },

      // ------------------------------------------ the optional rooms (S142)
      //
      // Nothing below is needed to finish the Shrine; everything below is a
      // grove, a ford or a fight the Reefseed makes possible, and each pays
      // out something worth the trip. West of the Reefseed Vault: a ford
      // where the block crosses north to south, a cellar with a charm in it,
      // and a grove entered from above. East of the Bower Cell: a spring to
      // rest at, the longest chain in the Shrine, a cellar fight, a ford the
      // width of two screens, and a chain that ends in a charm.
      '0,0,4': {
        name: 'The Ferry Pocket',
        // The Root Ford turned on its side. The stake at 7,5 is thrown from
        // the east over the bole at HIGH; the block on the north islet
        // crosses it at LOW onto the plate in the south pocket, and the
        // plate opens the way down. The islet and pocket are stone-bound but
        // for that square, so they are reached the Root Ford's way.
        map: [
          '###############',
          '##########....#',
          '#######..#..U.#',
          '#######..#....#',
          '#######..#....#',
          '#######W5......',
          '######..#.....#',
          '######...#....#',
          '######...#..U.#',
          '#######.##....#',
          '#######D#######',
        ],
        reefseedRoom: {
          entry: [14, 5],
          stakes: [
            { at: [7, 5], from: [9, 5], face: 'left', sea: 2 },
          ],
          block: [7, 4], target: [7, 7], pushFrom: [7, 3],
        },
        entities: [
          ['block', 7, 4, { once: false }],
          ['switch', 7, 7],
          ['switch', 6, 8],
          ['tektite', 12, 5],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd5_ferrypocket',
          reward: { openDoors: [[7, 10]], say: 'The south door grinds open.' },
        },
      },
      '0,0,5': {
        name: 'The Ferry Cellar',
        // What the Ferry Pocket was keeping.
        map: [
          '#######D#######',
          '#.............#',
          '#.111.....111.#',
          '#.111.....111.#',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#.111.....111.#',
          '#.111.....111.#',
          '#.............#',
          '#######.#######',
        ],
        entities: [
          ['chest', 7, 5, { charm: 'riptideFin' }],
          ['jellyfish', 3, 2],
          ['jellyfish', 11, 8],
        ],
      },
      '0,0,6': {
        name: 'The Knot Garden',
        // THE TIDE FLOOR, two heights (S208, kind C stepped up). The top row
        // goes under at MID, the bottom row at HIGH; two red and two blue in
        // each, and one block. One trip round the tide cannot do it — the
        // block keeps the sea off one tile per rise — so it is twice round,
        // the block moved between rises. What it pays is a purse. Until S208
        // grove 1 again, handed the other way.
        map: [
          '#######.#######',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#.....cdcd....#',
          '#.....gfgf....#',
          '#.............#',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '###############',
        ],
        floorRoom: { from: [7, 1], seas: [0, 1, 2] },
        entities: [
          ['block', 7, 7, { once: false }],
          ['chest', 11, 9, { pickup: 'rupee100', needFlag: 'd5_knot' }],
          ['keese', 10, 7],
        ],
        puzzle: {
          floor: true,
          flag: 'd5_knot',
          reward: { say: 'A chest rises in the corner.' },
        },
      },
      '0,6,5': {
        name: 'The Bower Spring',
        // A spring to rest at, off the Bower Cell: two fairies over the pool
        // and a sprig of seed on the rim, all of them back every time.
        map: [
          '###############',
          '#.............#',
          '#.U.........U.#',
          '#....22222....#',
          '#....2WWW2....#',
          '.....2WWW2.....',
          '#....2WWW2....#',
          '#....22222....#',
          '#.U.........U.#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['pickup', 5, 5, { kind: 'fairy', life: 1e9 }],
          ['pickup', 9, 5, { kind: 'fairy', life: 1e9 }],
          ['pickup', 7, 8, { kind: 'seeds5', life: 1e9 }],
        ],
        readable: [
          [7, 1, 'Carved round the rim of the pool: "Rest here,\nand take what grows back."'],
        ],
      },
      '0,7,4': {
        name: 'The Long Root',
        // THE LONGEST CHAIN IN THE SHRINE, up a fenced shaft of water: the
        // first stake at HIGH from 10,17 over the bole, then swim out onto it
        // and sound the conch round to LOW; the second from the first and the
        // third from the second, both at LOW; and the snarl at the top cut
        // from the third. The alcove behind it keeps a charm.
        size: [1, 2],
        map: [
          '#######.#######',
          '#.............#',
          '#.............#',
          '#..U..........#',
          '#.............#',
          '#.......#####.#',
          '#.......#...#.#',
          '#.......#...#.#',
          '#.......#...#.#',
          '#.......#...#.#',
          '#.......##k##.#',
          '#.......#WWW#.#',
          '#.......#WWW#.#',
          '#.......#WWW#.#',
          '#.......#WWW#.#',
          '#.......#WWW#.#',
          '........##5##.#',
          '#.............#',
          '#..U..........#',
          '#.............#',
          '#.............#',
          '#######.#######',
        ],
        reefseedRoom: {
          entry: [0, 16],
          stakes: [
            { at: [10, 15], from: [10, 17], face: 'up', sea: 2 },
            { at: [10, 13], from: [10, 15], face: 'up', sea: 0 },
            { at: [10, 11], from: [10, 13], face: 'up', sea: 0 },
          ],
          snarl: [10, 10], cutFrom: [10, 11],
        },
        entities: [
          ['chest', 10, 7, { charm: 'strandwalker' }],
          ['tektite', 4, 8],
          ['keese', 3, 15],
        ],
        readable: [
          [12, 18, 'Cut into the shaft\'s foot: "Once at HIGH tide. Twice at LOW. Then cut!"'],
        ],
      },
      '0,7,6': {
        name: 'The Root Cellar',
        // A fight, and the chest that the quiet after it leaves.
        map: [
          '#######.#######',
          '#.............#',
          '#.............#',
          '#..22.....22..#',
          '#..22.....22..#',
          '..............#',
          '#..22.....22..#',
          '#..22.....22..#',
          '#.............#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['urchin', 4, 5],
          ['tektite', 10, 2],
          ['tektite', 10, 8],
          ['jellyfish', 3, 3],
        ],
        puzzle: {
          enemies: true,
          flag: 'd5_rootcellar',
          // The Wrackbone since S200: the Lamplighter's Wick went to the lighthouse.
          reward: { spawn: [['chest', 7, 5, { charm: 'wrackbone' }]], say: 'Something settles in the middle of the room.' },
        },
      },
      '0,5,6': {
        name: "The Seedwarden's Ferry",
        // THE ROOT FORD, TWO SCREENS LONG. The stake at 22,5 goes in at HIGH
        // over the bole from the bank above; the block on the east islet
        // crosses it at LOW into the long west hall and has to be pushed the
        // length of it to the plate at 12,5.
        size: [2, 1],
        map: [
          '##############################',
          '#............................#',
          '#..U........U.....U..........#',
          '#............................#',
          '######################5####..#',
          '#.....................W...#...',
          '#....................#....####',
          '#....U.........U......#...####',
          '#.....................#...####',
          '#.....................########',
          '##############################',
        ],
        reefseedRoom: {
          entry: [29, 5],
          stakes: [
            { at: [22, 5], from: [22, 3], face: 'down', sea: 2 },
          ],
          block: [23, 5], target: [12, 5], pushFrom: [24, 5],
        },
        entities: [
          ['block', 23, 5, { once: false }],
          ['switch', 12, 5],
          ['switch', 12, 8],
          ['tektite', 8, 2],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd5_seedwarden',
          reward: { spawn: [['chest', 4, 7, { charm: 'anemonesGift' }]], say: 'Something settles at the end of the hall.' },
        },
      },
      '0,6,3': {
        name: "The Warden's Walk",
        // The Shrine Ford's chain at its plainest, in the open: the first
        // stake at HIGH from 19,5 over the bole, the second from the first at
        // LOW, and the snarl in the wall across the pool cut from the second.
        size: [2, 1],
        map: [
          '##############################',
          '#.............#####..........#',
          '#.............#####.....U....#',
          '#.............#####..........#',
          '#.............#WWW#..........#',
          '#.............kWWW5..........#',
          '#.............#WWW#..........#',
          '#.............#####..........#',
          '#.............#####.....U....#',
          '#.............#####..........#',
          '######################.#######',
        ],
        reefseedRoom: {
          entry: [22, 9],
          stakes: [
            { at: [17, 5], from: [19, 5], face: 'left', sea: 2 },
            { at: [15, 5], from: [17, 5], face: 'left', sea: 0 },
          ],
          snarl: [14, 5], cutFrom: [15, 5],
        },
        entities: [
          ['chest', 4, 5, { charm: 'dunerunner' }],
          ['tektite', 25, 4],
          ['keese', 8, 7],
        ],
      },

      '0,1,3': {
        name: 'The First Stake',
        // GROVE 1, on the east-west axis and the fixture at its plainest. The
        // bank is 9,5, the bole 10,5, the stake 11,5 and the snarl 12,5, all in
        // one line, so the whole idea is legible in a single row of the room.
        map: [
          '###############',
          '#..........####',
          '#.U........##.#',
          '#..........0#.#',
          '#..........W#.#',
          '#.........5Wk..',
          '#..........W#.#',
          '#..........##.#',
          '#..........####',
          '#..........####',
          '#######.#######',
        ],
        reefseedRoom: {
          entry: [7, 10],
          stakes: [
            { at: [11, 5], from: [9, 5], face: 'right', sea: 2 },
          ],
          snarl: [12, 5], cutFrom: [11, 5],
        },
        // Both of them are on the FAR side of the snarl, guarding the corridor
        // out rather than the pool. The near side is deliberately quiet: this is
        // the room the dungeon teaches itself in.
        entities: [
          ['keese', 13, 3],
          ['tektite', 13, 7],
        ],
        readable: [
          [2, 2, 'Cut low, where the water reaches it: "Throw while the trees are underwater. Stand on it once they\'re back."'],
        ],
      },
      '0,2,3': {
        name: 'The Bole Walk',
        // THE TIDE FLOOR, taught (S208, PUZZLE-PASS kind C; Ages' red and
        // blue floor). Every tile the sea covers when the conch raises it
        // changes colour — all of this floor goes under at MID — except where
        // a block stands, because the sea cannot get under a block. Ten red
        // and two blue: the two blocks onto the two blue tiles, one press,
        // and the floor is blue and the north shutter opens. Until S208 a
        // grove (grove 2) that asked the First Stake's question again.
        map: [
          '#######.#######',
          '#######.#######',
          '#######.#######',
          '#######D#######',
          '#.............#',
          '......cccc....L',
          '#.....cdcc....#',
          '#.....cccd....#',
          '#.............#',
          '#.............#',
          '###############',
        ],
        floorRoom: { from: [1, 5], seas: [0, 1] },
        entities: [
          ['block', 3, 8, { once: false }],
          ['block', 11, 8, { once: false }],
          ['tektite', 12, 4],
          ['keese', 2, 9],
        ],
        puzzle: {
          floor: true,
          flag: 'd5_bolewalk',
          reward: { openDoors: [[7, 3]], say: 'The north shutter opens.' },
        },
      },
      '0,2,2': {
        name: 'The Sunken Nave',
        // TWO MIRROR STATUES, one block (S208, kind F stepped up). Both runs
        // follow every push; the top statue must cross a gutter dry only at
        // LOW, and the bottom one must stop on its plate with a gutter east of
        // it, which only water does. Walk them both four tiles at LOW, sound
        // the conch, and the top one goes on alone. The shutter in the west
        // wall opens on the cell with Small Key 3 and the way to the Silt
        // Cell. Until S208 grove 3, one stake at HIGH.
        map: [
          '###############',
          '#.###########.#',
          '#.##...1....#.#',
          '#.###########.#',
          '#.##.....1..#.#',
          '..###########.#',
          '#.#...........#',
          '#.D...........#',
          '#.#...........#',
          '#.#...........#',
          '#######.#######',
        ],
        statueRoom: { from: [7, 9], seas: [0, 1] },
        entities: [
          ['statue', 4, 2],
          ['statue', 4, 4],
          ['block', 12, 7, { once: false }],
          ['switch', 11, 2],
          ['switch', 8, 4],
          ['switch', 5, 7],
          // THE CHEST FACES THE WAY YOU COME: opened from 1,7, it drops the
          // key twelve pixels above itself, on the square he stands on, and
          // leaves the cell's way north to the Silt Cell clear.
          ['chest', 1, 8, { pickup: 'key' }],
          ['keese', 10, 8],
        ],
        puzzle: {
          blocks: [[11, 2], [8, 4], [5, 7]],
          flag: 'd5_nave',
          reward: { openDoors: [[2, 7]], say: 'The shutter in the west wall opens.' },
        },
      },
      '0,1,2': {
        name: 'Silt Cell',
        map: [
          '###############',
          '#.............#',
          '#.............#',
          '#....99.......#',
          '#....99.......#',
          '...............',
          '#.............#',
          '#.......99....#',
          '#.......99....#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['pickup', 11, 8, { kind: 'rupee20' }],
          // A SEED SPRIG, and it comes back every time the room is entered.
          // The Reefseed Vault's chest fills the satchel once and nothing in
          // the game refilled it after that, so a player who threw three
          // seeds wide was locked out of the Boss Key for good (S142).
          ['pickup', 3, 3, { kind: 'seeds5', life: 1e9 }],
          ['keese', 3, 8],
        ],
      },
      '0,3,3': {
        name: 'Grove Crossing',
        map: [
          '###############',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#.............#',
          'L.............L',
          '#.............#',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['pickup', 7, 2, { kind: 'seeds5', life: 1e9 }],
          ['stalfos', 9, 3],
          ['keese', 11, 7],
        ],
      },
      '0,4,3': {
        name: 'The Long Ford',
        // GROVE 4, pointed south, and the first with the bank on the far side
        // of the pool from the door — so the throw has to be set up by walking
        // round the water rather than by standing where you came in. The snarl
        // is in the wall across the room; the way on is the south hall and the
        // east passage up to the door.
        //
        // UNDER THE FORD CROWN (S187). Two notches stand in the south hall's
        // north wall, each a single cell walled in on all four sides with a
        // stake plate in it: no foot, no throw and no perch reaches either,
        // and both are in plain sight from the first time the hall is walked.
        // The Ford Crown's two knot-holes are directly over them — the west
        // one is fed at LOW and the east one at MID — and when both plates
        // are held a chest rises at the top of the east passage (Small Key).
        // The stair in the hall's west end climbs to the Crown.
        map: [
          '###############',
          '#..........#..#',
          '#..........#..#',
          '#..........#..#',
          '#......5...#..#',
          'L....0WWW0.#..L',
          '#######k####..#',
          '#.###.#.......#',
          '##...#........#',
          '#S............#',
          '###############',
        ],
        warps: [{ x: 1, y: 9, to: { map: 'd5', floor: 1, rx: 4, ry: 3, px: 2 * 16, py: 9 * 16, dir: 'right' } }],
        reefseedRoom: {
          // The first floor inside its west door, a key door since S186.
          entry: [1, 5],
          stakes: [
            { at: [7, 5], from: [7, 3], face: 'down', sea: 2 },
          ],
          snarl: [7, 6], cutFrom: [7, 5],
        },
        dropRoom: [
          { from: '1,4,3', hole: [1, 7], plate: [1, 7], seas: [0] },
          { from: '1,4,3', hole: [5, 7], plate: [5, 7], seas: [1] },
        ],
        entities: [
          ['switch', 1, 7, { stake: true }],
          ['switch', 5, 7, { stake: true }],
          ['chest', 13, 2, { pickup: 'key', needFlag: 'd5_fordCrown' }],
          ['keese', 10, 2],
          ['tektite', 2, 2],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd5_fordCrown',
          reward: { reveal: true, say: 'Coral holds both notches down.\nA chest rises up the east passage.' },
        },
      },
      '0,5,3': {
        name: 'Thornvine',
        map: [
          '#######D#######',
          '#.............#',
          '#.............#',
          '#...2222222...#',
          '#..222222222..#',
          'L..222222222..#',
          '#..222222222..#',
          '#...2222222...#',
          '#.............#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['thornvine', 7, 4],
        ],
        puzzle: {
          enemies: true,
          flag: 'd5_thornvine',
          reward: {
            openDoors: [[7, 0]],
            say: 'The thorns let go of the north arch.',
          },
        },
      },
      '0,4,2': {
        name: 'The Shrine Ford',
        // GROVE 5, three screens wide. It owns the cells at 5,2 and 6,2 as well
        // as its own, so nothing else may be keyed there.
        //
        // The width is the point: the pool is wide enough that the snarl is out
        // of range of any bank, so the fixture has to be built twice — the
        // first stake at HIGH from dry ground, and the second at LOW from the
        // first, which means standing on something that did not exist when you
        // threw it, and which will not be there if you let the sea back up.
        // Thornvine's arch lets you in on the east side; the Boss Key is in the
        // west hall, past the snarl, and the boss door is west of that.
        size: [3, 1],
        map: [
          '#############################################',
          '#................############################',
          '#................#############.####.####.####',
          '#................#000000000##################',
          '#................#0WWWW.....................#',
          '..................kWWW5..........U..........#',
          '#................#0W0W......................#',
          '#................#0000......................#',
          '#................#####......................#',
          '#................#####......................#',
          '######################D######################',
        ],
        reefseedRoom: {
          // The tile inside Thornvine's arch: the arch itself is a shutter in
          // the ring, shut until the miniboss dies, so a flood cannot start
          // on it.
          entry: [22, 9],
          stakes: [
            { at: [21, 5], from: [23, 5], face: 'left', sea: 2 },
            { at: [19, 5], from: [21, 5], face: 'left', sea: 0 },
          ],
          snarl: [18, 5], cutFrom: [19, 5],
        },
        // UNDER THE HIGH BOUGH (S187): three notches in the wall north of the
        // east hall, each a cell walled in on four sides with a stake plate in
        // it, seen every time the Ford is crossed. The High Bough's three
        // knot-holes are over them; when all three are held the Boss Key's
        // chest rises in the west hall.
        dropRoom: [
          { from: '1,4,2', hole: [30, 2], plate: [30, 2], seas: [0] },
          { from: '1,4,2', hole: [35, 2], plate: [35, 2], seas: [1] },
          { from: '1,4,2', hole: [40, 2], plate: [40, 2], seas: [0], perch: [40, 5] },
        ],
        entities: [
          ['switch', 30, 2, { stake: true }],
          ['switch', 35, 2, { stake: true }],
          ['switch', 40, 2, { stake: true }],
          ['chest', 12, 4, { pickup: 'bossKey', needFlag: 'd5_highBough' }],
          ['keese', 26, 7],
          ['tektite', 8, 6],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd5_highBough',
          reward: { reveal: true, say: 'Three stakes hold the notches down.\nSomething rises in the west hall.' },
        },
        readable: [
          [33, 5, 'A shrine board, barely legible: "Twice over. The first at HIGH tide, the second at LOW."'],
        ],
      },
      '0,3,2': {
        name: 'Rootmaw Arch',
        map: [
          '#######B#######',
          '#.............#',
          '#..U.......U..#',
          '#.............#',
          '#.............#',
          '#..............',
          '#....22222....#',
          '#.............#',
          '#..U.......U..#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['keese', 11, 3],
        ],
      },
      '0,3,1': {
        name: 'Rootmaw, the Drowned Wood',
        // The boss keeps the mechanic: `noTide` pins the arena at whatever
        // level was brought in, and the floor is basin, which is walkable at
        // all three because a locked room has to work at whichever one arrives.
        map: [
          '###############',
          '#.............#',
          '#...2222222...#',
          '#...2222222...#',
          '#...2222222...#',
          '#...2222222...#',
          '#...2222222...#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#######B#######',
        ],
        noTide: true,
        entities: [
          ['rootmaw', 7, 3],
        ],
        script: {
          onEvent(game, name) {
            if (name === 'bossDead') game.spawnPickup(112, 56, 'heartContainer', { grabDelay: 30 });
          },
        },
      },

      // ------------------------------------------------- 2F, the Canopy (S186)
      //
      // THE CANOPY PLANTS THE SHRINE. Belts in the crowns of the drowned
      // trees (the Ancient Ruins' own conveyors) carry a seed while it grows,
      // and a knot-hole in the boughs drops it into the room beneath, where
      // it takes root in a place no hand below could put it — and stays
      // (`Game.plantFromAbove`). A drowned belt does not turn: a high
      // bough's (`}{[]`) is still water at HIGH, a low bough's (`exns`) at
      // MID and HIGH. See docs/briefs/D5-DROWNED-WOOD-SHRINE.md.
      '1,3,4': {
        name: 'The Hollow Crown',
        // K1, BELTS ALONE. Up the stair from Rootbound Hall; two rows of
        // belt run east into two knot-holes, wall to wall between the stair
        // and the way north. At LOW and MID you are carried as you cross;
        // cross near the holes and you drop back into the Hall, unhurt. At
        // HIGH the belts are under water and still: you swim across.
        // Reachable before the Reefseed, and nothing costs anything here.
        map: [
          '#######.#######',
          '#.............#',
          '#.U.........U.#',
          '#}}}}}}}}}}}KK#',
          '#}}}}}}}}}}}KK#',
          '#.............#',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#.........../.#',
          '#######L#######',
        ],
        warps: [{ x: 12, y: 9, to: { map: 'd5', floor: 0, rx: 3, ry: 4, px: 12 * 16, py: 8 * 16, dir: 'up' } }],
        beltRoom: { belts: 'run', cross: { from: [7, 9], to: [7, 1] } },
        entities: [
          ['tektite', 4, 6],
          ['keese', 10, 1],
        ],
      },
      '1,3,3': {
        name: 'The Belt Bough',
        // K2, A SEED ON A BELT. A belt runs east down a channel sealed by
        // walls and holes — no foot reaches it, at any sea — to a hold plate
        // against its far wall. A seed thrown over the holes from the little
        // bank lands on the belt, rides it while it grows (two seconds is
        // just under four tiles), and comes up on the plate if it was thrown
        // from the right place. Nothing else reaches the plate: it is three
        // tiles from any footing, no wall stands where a throw would stop on
        // it, and the channel is closed at both ends. The plate raises a
        // chest. At HIGH the belt is still water and a seed grows where it
        // falls (K1's lesson). A stake grown in the wrong place is gone when
        // you leave the room (`Game.setRoom`).
        map: [
          '###############',
          '#...###########',
          '#...#}}}}}}####',
          '#...#OOOOOO#..#',
          '#......OOOO...#',
          '#......OOOO...#',
          '#.............#',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#######.#######',
        ],
        beltRoom: { seed: { from: [6, 4], face: 'up', lands: [10, 2] }, plate: [10, 2] },
        entities: [
          ['switch', 10, 2, { stake: true }],
          ['chest', 2, 5, { pickup: 'key', needFlag: 'd5_beltBough' }],
          ['crab', 9, 8],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd5_beltBough',
          reward: { reveal: true, say: 'The coral comes up on the plate.\nA chest rises on the bank.' },
        },
      },
      '1,3,5': {
        name: 'The Grove Crown',
        // K3, THE FIRST DROP. A knot-hole in a ring of holes, directly over
        // the Standing Grove's plate. No foot reaches the knot-hole; a seed
        // thrown into it from two tiles away falls through, grows on the
        // plate below, and holds it for good. Behind a key door from the
        // Hollow Crown, which the Belt Bough's chest opens.
        map: [
          '#######L#######',
          '#.............#',
          '#.............#',
          '#..U.......U..#',
          '#.....OOO.....#',
          '#.....OKO.....#',
          '#.....OOO.....#',
          '#..U.......U..#',
          '#.............#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['tektite', 3, 9],
          ['keese', 11, 1],
        ],
      },
      '1,4,3': {
        name: 'The Ford Crown',
        // K4, THE SEA CHOOSES THE ROAD. Up the stair from the Long Ford's
        // south hall. A short belt in a walled strip runs between two
        // knot-holes, over the Long Ford's two notches, and its middle cell
        // is a CROSSING (`j`): at LOW the low bough's belt is on top and the
        // cell carries west, into the west knot-hole; at MID the low bough is
        // drowned and it carries east, into the east one. A seed can only be
        // put on that one cell — thrown up over the hole from the single
        // tile below it, a wall behind the crossing catching a long throw —
        // so the same throw plants the west notch at LOW and the east at MID.
        // At HIGH the strip is still water. The key door north is the way
        // on to the High Bough (Small Key, the Long Ford's).
        map: [
          '#######L#######',
          '#.............#',
          '#..U.......U..#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#######.......#',
          '#Kxj}K#.......#',
          '###O###.......#',
          '#/.........U..#',
          '###############',
        ],
        warps: [{ x: 1, y: 9, to: { map: 'd5', floor: 0, rx: 4, ry: 3, px: 2 * 16, py: 9 * 16, dir: 'right' } }],
        entities: [
          // A seed sprig (S187): the Canopy's second half spends six seeds.
          ['pickup', 11, 5, { kind: 'seeds5', life: 1e9 }],
          ['tektite', 10, 4],
          ['keese', 4, 2],
        ],
      },
      '1,4,2': {
        name: 'The High Bough',
        // K5, THE BOSS KEY: everything you plant up here is something
        // holding down there. Three screens over the Shrine Ford, three
        // knot-holes over its three notches, each fed its own way:
        //   30,2 by a low bough's belt, thrown onto from 30,6 — it runs at
        //        LOW and nowhere else;
        //   35,2 by a crossing (`v`) thrown onto from 37,4 — at LOW the low
        //        bough carries the seed south into a plain hole, at MID the
        //        high bough carries it north into the knot-hole;
        //   40,2 by a high bough's belt no bank is near: plant a stake in
        //        the pool (40,5) from the bank, stand on it at LOW, and throw
        //        from there — stand on what you plant, in the Canopy.
        // In through the key door from the Ford Crown, and across a band of
        // high bough's belts running south into a row of holes (15-17): at
        // LOW and MID they carry you toward the holes as you cross, at HIGH
        // you swim. Walk straight over and they cost nothing.
        size: [3, 1],
        map: [
          '#############################################',
          '#..............]]].........##################',
          '#..U.......U...]]]U.....U..###K####K####K####',
          '#..............]]].........###n####[####[####',
          '#..............]]]...........#n#..#vO..#O#..#',
          '#..............]]]...........#O#..#s#.#WWW#.#',
          '#..............]]]................#O#.#WWW#.#',
          '#..............]]]................###.......#',
          '#..U.......U...]]]U.....U...................#',
          '#..............OOO..........................#',
          '#######L#####################################',
        ],
        beltRoom: { belts: 'run', cross: { from: [7, 9], to: [26, 5] } },
        entities: [
          ['pickup', 26, 6, { kind: 'seeds5', life: 1e9 }],
          ['keese', 12, 3],
          ['tektite', 20, 6],
          ['crab', 26, 8],
        ],
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
  // AN ORACLE DUNGEON (S142), built like the other five: 15x11 rooms with a
  // wall ring, a scrolling camera, one-tile doors, and key, shutter and boss
  // doors in the ring between two rooms. The kit is the Sword & Shield
  // Maze's (`k*` picks in tools/rip-dungeon-themes.py) — Seasons' own last
  // dungeon. Every crossing, cache, grove, sill and fork is the fixture it
  // was at 10x8, set whole into a bigger room of rock so its doors sit in the
  // middle of their walls; check-dredge, check-reefseed, check-bellows and
  // check-lens prove them as before.
  //
  // GROWN AT S142 to 38 rooms, 47 screens, the largest dungeon in the game,
  // the way the Oracle games grow theirs: a required east wing on floor 0
  // (the Draw, the Tally Hall, the Hauling Pit — the line examined before the
  // stair), and optional rooms on both floors (the Angler Stews and the Silt
  // Terraces below; the Long Sounding, the Offering Pit, the Undertow Cell
  // and the Deep Choir above), four charms among them.
  //
  // Intended route (the Dredge Line at room 13):
  //   3,7 entrance -> 3,6 landing -> 2,6 Dungeon Map / 4,6 Small Key 1
  //   -> 3,5 Drowned Hall (hub) -> 2,5 Chartstone -> 4,5 Small Key 2
  //   -> 3,4 Three Heights (key door north) -> 2,4 wheel / 4,4 Small Key 3
  //   -> 3,3 Keep Lock (key door east) -> 4,3 DREDGE LINE -> 5,3 the Slack
  //   Water -> 6,3 the Draw -> 7,2 the Tally Hall -> 6,2 the Hauling Pit
  //   (Small Key, and a plate back into the Draw) -> 3,3 Keep Lock (key
  //   door west) -> 2,3 stair up
  //   -> 1F 3,5 Upper Keep -> 2,5 -> 2,4 the Coilrope
  //      -> 4,5 Tideshade (miniboss) -> 4,4 the Mermaid Suit
  //      -> 3,4 the Drowned Stand -> 3,3 Keep Crossing
  //      -> 2,3 the Sunken Bar -> 4,3 the Drowned Sill (key door; Small Key 4)
  //      -> 3,2 Keep Gate (key door) -> 4,2 the Crossed Shafts (Boss Key)
  //      -> 3,1 the Stairhead -> 3,0 Nereth
  registerMap({
    id: 'd6',
    kind: 'dungeon',
    name: 'Abyssal Keep',
    w: 8, h: 8, floors: 3,
    cell: [15, 11],
    legend: 'dungeonAbyss',
    music: 'dungeon6',
    tint: 'cave',
    dungeon: {
      index: 6,
      item: 'dredge', itemLevel: 1,
      essence: 6,
      boss: 'nereth',
      // The Drowned King gets his own theme. `updateMusic` has always read a
      // per-dungeon `bossMusic`, and the Keep is the dungeon that sets one.
      bossMusic: 'finalBoss',
      bossRoom: '2,3,0',
      startRoom: '1,3,7',
      entrance: { map: 'overworld', floor: 0, rx: 1, ry: 0, px: 64, py: 32 },
    },
    rooms: {
      // ---------------------------------------------------- the way in
      '1,3,7': {
        name: 'Keep Door',
        map: [
          '#######.#######',
          '#.............#',
          '#.p.........p.#',
          '#.............#',
          '#...19...91...#',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#######C#######',
        ],
        warps: [
          { x: 7, y: 10, to: { map: 'overworld', floor: 0, rx: 1, ry: 0, px: 64, py: 32, dir: 'down' } },
        ],
        readable: [
          [2, 6, 'Cut in black stone: "Whatever the sea takes, it keeps. Whatever it keeps, it sets down below."'],
        ],
      },
      '1,3,6': {
        name: 'Keep Landing',
        map: [
          '#######.#######',
          '#.............#',
          '#..1.......1..#',
          '#..9.......9..#',
          '#.............#',
          '...............',
          '#.............#',
          '#..9.......9..#',
          '#..1.......1..#',
          '#.............#',
          '#######.#######',
        ],
        entities: [
          ['darknut', 5, 4],
          ['keese', 10, 6],
        ],
        puzzle: {
          enemies: true,
          flag: 'd6_landing',
          reward: {
            spawn: [['pickup', 7, 3, { kind: 'heart' }]],
            say: 'Water drains out of a niche in the wall.',
          },
        },
      },
      '1,2,6': {
        name: 'Map Crypt',
        map: [
          '#######.#######',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#.....12......#',
          '#.....21.......',
          '#.............#',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['chest', 9, 4, { pickup: 'dungeonMap' }],
          ['stalfos', 10, 7],
        ],
      },
      '1,4,6': {
        name: 'Bone Cell',
        map: [
          '#######.#######',
          '#.............#',
          '#.............#',
          '#...4444444...#',
          '#...4444444...#',
          '....4444444...#',
          '#...4444444...#',
          '#.............#',
          '#.............#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['stalfos', 2, 2],
          ['stalfos', 12, 2],
          ['darknut', 7, 8],
        ],
        puzzle: {
          enemies: true,
          flag: 'd6_bone',
          reward: { spawn: [['pickup', 7, 8, { kind: 'key' }]], say: 'The bones settle. A key is among them.' },
        },
      },
      '1,3,5': {
        name: 'Drowned Hall',
        map: [
          '#######.#######',
          '#..M.......M..#',
          '#.............#',
          '#..1919.9191..#',
          '#.............#',
          '...............',
          '#.............#',
          '#..9191.1919..#',
          '#.............#',
          '#..M.......M..#',
          '#######.#######',
        ],
        entities: [
          ['wizzrobe', 7, 3],
          ['darknut', 3, 8],
          ['siren', 11, 3],
          ['torch', 1, 1],
          ['torch', 13, 1],
          ['torch', 1, 9],
        ],
        puzzle: {
          torches: 'all',
          flag: 'd6_hall',
          reward: {
            spawn: [['pickup', 7, 5, { kind: 'rupee20' }]],
            say: 'A catch lets go under the floor.',
          },
        },
        readable: [
          [13, 4, 'A mooring plate, worn smooth: "The rings in this hall were for hauling. Hook your line on one, and it pulls you across."'],
        ],
      },
      '1,2,5': {
        name: 'Chartstone Crypt',
        map: [
          '###############',
          '#.............#',
          '#.............#',
          '#....99.99....#',
          '#.............#',
          '#..............',
          '#.............#',
          '#....99.99....#',
          '#.............#',
          '#.............#',
          '#######.#######',
        ],
        entities: [
          ['chest', 7, 5, { pickup: 'chartstone' }],
          ['darknut', 11, 6],
        ],
      },
      '1,4,5': {
        name: 'Drain Court',
        // THE ICE BLOCK (S209, docs/briefs/PUZZLE-PASS.md step 7): Seasons'
        // sliding block, and the sea decides where each push ends. The plate
        // is in the alcove at 7,1 past a sump only a floating block crosses.
        // MID: west, the drain catches it (at LOW it swallows it). HIGH:
        // north, it floats over the drowned wall to the urn. LOW: east, the
        // well catches it. MID: north over the sump onto the plate.
        // tools/check-iceblocks.mjs proves it.
        map: [
          '###############',
          '#######.#######',
          '#...U.#0#.U...#',
          '#...1..3......#',
          '#.............#',
          '....9.........#',
          '#.............#',
          '#.............#',
          '#...4.........#',
          '#.............#',
          '#######.#######',
        ],
        iceRoom: { from: [0, 5], seas: [0, 1, 2] },
        entities: [
          ['iceblock', 12, 8],
          ['switch', 7, 1],
        ],
        puzzle: {
          blocks: [[7, 1]],
          flag: 'd6_drain',
          reward: { spawn: [['pickup', 7, 6, { kind: 'key' }]], say: 'The drain gutters and something bright goes down it.' },
        },
        readable: [
          [4, 2, 'Scratched on the urn: "Ice runs till something stops it. So does shallow water!"'],
        ],
      },
      '1,3,4': {
        name: 'Three Heights',
        // The dungeon's own tide vocabulary said once, before anything depends
        // on it: `1` is dry then wading then over your head, `9` is a wall the
        // sea swims you over, `4` is a hole the sea fills. Three tiles, three
        // different answers to the same conch, and the walk round them is free.
        map: [
          '#######L#######',
          '#.............#',
          '#..111...111..#',
          '#.............#',
          '#..9...4...9..#',
          '...9..444..9...',
          '#..9...4...9..#',
          '#.............#',
          '#..22.....22..#',
          '#.U...........#',
          '#######.#######',
        ],
        entities: [
          ['wizzrobe', 7, 2],
          ['jellyfish', 7, 5],
        ],
        readable: [
          [2, 9, 'Scratched low, where the water reaches it: "Each pool here does something different at each tide. Watch them!"'],
        ],
      },
      '1,2,4': {
        name: 'West Crypt',
        // D6's own Bellows sill — the Squall Loft's fixture, wheel boxed by
        // wall and pit, the stand across the pit, a sump the only way up. The
        // fairy waits behind the wheel.
        map: [
          '###############',
          '###############',
          '###############',
          '###############',
          '#####3OO.######',
          '#######.0......',
          '#####........##',
          '#####......####',
          '###############',
          '###############',
          '###############',
        ],
        bellowsRoom: {
          wheel: [5, 4], stand: [8, 4], face: 'left', at: 1, gives: 'fairy',
        },
        entities: [
          ['wheel', 5, 4, { needTurns: 30 }],
          ['stalfos', 9, 6],
        ],
        script: {
          // Put the fairy back if it was released and never collected — the
          // Cistern Gauge's soft lock, same as Bower Cell.
          onEnter(game) {
            if (game.progress.flags.d6CryptWheel && !game.progress.secrets.d6CryptFairy) {
              game.spawnPickup(128, 80, 'fairy', { grabDelay: 14, saveKey: 'd6CryptFairy' });
            }
          },
          onEvent(game, name, data) {
            if (name !== 'valve' || !data || !data.open) return;
            game.progress.flags.d6CryptWheel = true;
            if (game.progress.secrets.d6CryptFairy) return;
            game.spawnPickup(128, 80, 'fairy', { grabDelay: 14, saveKey: 'd6CryptFairy' });
          },
        },
      },
      '1,4,4': {
        name: 'Black Kiln',
        map: [
          '###############',
          '#.............#',
          '#.............#',
          '#...4444444...#',
          '#...4444444...#',
          '....4444444...#',
          '#...4444444...#',
          '#.............#',
          '#.............#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['torch', 2, 2],
          ['torch', 12, 2],
          ['torch', 2, 8],
          ['torch', 12, 8],
          ['darknut', 7, 8],
        ],
        puzzle: {
          torches: 'all',
          flag: 'd6_kiln',
          reward: { spawn: [['pickup', 7, 2, { kind: 'key' }]], say: 'Four flames in the Drowned King\'s house.' },
        },
      },
      '1,3,3': {
        name: 'Keep Lock',
        map: [
          '###############',
          '#.............#',
          '#.............#',
          '#....#...#....#',
          '#.............#',
          'L.............L',
          '#.............#',
          '#....#...#....#',
          '#.............#',
          '#..M.......M..#',
          '#######L#######',
        ],
        entities: [
          ['darknut', 4, 5],
          ['stalfos', 10, 8],
        ],
      },
      '1,2,3': {
        name: 'Keep Stair',
        map: [
          '###############',
          '#.............#',
          '#...........S.#',
          '#.............#',
          '#.............#',
          '#.............L',
          '#.............#',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '###############',
        ],
        warps: [
          { x: 12, y: 2, to: { map: 'd6', floor: 2, rx: 3, ry: 5, px: 192, py: 48 } },
        ],
        entities: [
          ['stalfos', 5, 6],
        ],
      },
      '1,4,3': {
        name: 'Dredge Vault',
        map: [
          '#######.#######',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#....,,,,,....#',
          'L....,,,,,.....',
          '#....,,,,,....#',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['chest', 7, 5, { big: true, item: 'dredge', level: 1 }],
        ],
      },
      '1,4,2': {
        name: 'The Drowned Garden',
        // The Keep's own Reefseed grove, in the Keep's own materials: the bar
        // across the pool is `7`/`dLintel`, the Keep's masonry, stone at LOW
        // and MID and open water at HIGH; the kelp is `dSnarlAbyss`. The
        // fixture is the Shrine's, unchanged: the lintel stops the throw until
        // HIGH drowns it, the stake is open water at every sea until a pillar
        // is grown on it, and the snarl sits in the one gap of the wall above.
        // Cut it and the alcove opens for good — a find, not a need.
        //
        // S190: a way east into the Weighhouse, a shutter K5's plate opens, and
        // the cell 12,5 under the Crossed Shafts' middle shaft (2F 4,2 12,5):
        // a chunk set down here is hauled up onto the middle island at HIGH.
        map: [
          '###############',
          '###############',
          '####........###',
          '#######k#######',
          '####.0WWW0....#',
          '####...7......D',
          '####..........#',
          '####........###',
          '#######.#######',
          '#######.#######',
          '#######.#######',
        ],
        reefseedRoom: {
          entry: [7, 10],
          stakes: [
            { at: [7, 4], from: [7, 6], face: 'up', sea: 2 },
          ],
          snarl: [7, 3], cutFrom: [7, 4],
        },
        entities: [
          ['keese', 9, 6],
          ['pickup', 7, 2, { kind: 'rupee20' }],
        ],
        readable: [
          [5, 6, 'A gardener\'s plate, green with age: "The stone bar drowns at HIGH tide. Plant then, and stand once the sea goes out."'],
        ],
      },

      // ---------------------------------------------------- the Slack Water
      '1,5,3': {
        name: 'The Slack Water',
        // THE TEACHING ROOM: a flat pan you can walk all the way round at any
        // sea, with one silted ring in the middle of it and a bell that hums at
        // the ring. Drag the line over it on the dry crust and the weight comes
        // home with nothing. Sound the conch one step and drag the same line
        // over the same tile and a Piece of Heart comes up out of it.
        //
        // K1, THE FIRST SOUNDING (S189): no longer a dead end. Its east door
        // into the Draw is a shutter, and south of the pan two of the Keep's
        // shafts go down into the Hold's Sounding Floor. At MID they are
        // flooded wells: cast across the west one (3,8) and the line comes
        // back with the ice chunk lying on the floor beneath. The plate (13,8)
        // stands in a nook past a pit no foot crosses: throw the chunk onto it
        // and the shutter opens. K3 takes it back off with the line and, at
        // LOW, throws it down the east well (9,8) onto the islet below.
        map: [
          '#######L#######',
          '#######.#######',
          '####........###',
          '####.111111.###',
          '####.111111.###',
          '.....116111...D',
          '####.111111.###',
          '#...........###',
          '#..5.....5..O.#',
          '#...........###',
          '###############',
        ],
        buried: [[7, 5, 'heartPiece']],
        dredgeRoom: {
          entry: [0, 5],
          teaches: true,
          caches: [
            { at: [7, 5], from: [7, 7], face: 'up', sea: 1 },
          ],
        },
        entities: [
          ['bell', 2, 7, { points: [7, 5], say: 'The bell hums flat at the middle of the pan.' }],
          ['anglerfry', 10, 3],
          ['switch', 13, 8, { hold: true }],
        ],
        // tools/check-hold.mjs: the plate no foot and no throw from the floor
        // beside it reaches unless a chunk is thrown from `feeds`; the chunk
        // under the west well comes up on a line cast from `hauls`.
        holdRoom: {
          plate: [13, 8],
          feeds: [{ at: [176, 128], face: 'right', sea: 1 }],
          hauls: [{ from: [3, 7], face: 'down', sea: 1, below: [3, 8] }],
        },
        puzzle: {
          switches: 'all',
          flag: 'd6_slack',
          reward: { openDoors: [[14, 5]], say: 'The east shutter grinds open.' },
        },
        readable: [
          [4, 2, 'A dredger\'s tally, half scoured away: "Dry pan, empty line. We only ever fished it with the water in."'],
          [11, 9, 'Cut in the well\'s rim: "Whatever falls from the Keep lands in the Hold below. Fish for it with the water in."'],
        ],
      },

      // ---------------------------------------------------- the Weighhouse (S190)
      '1,5,2': {
        name: 'The Weighhouse',
        // K5, THE PLUMB: the middle of a column of three rooms joined by
        // shafts one over the other — the Plumb's Foot in the Hold, this, and
        // the Crossed Shafts' far island on 2F. The well at 7,4 is over the
        // Plumb's Foot's ring, where the Hold keeps a chunk: at MID cast across
        // it and the line brings the chunk up, as in the Slack Water. The
        // plate (1,8) stands in a nook past a pit, the Slack Water's nook
        // turned round: throw the chunk onto it and the west shutter into the
        // Drowned Garden opens. Nothing here says the 2F shaft is overhead —
        // the Crossed Shafts says it, from above: the cell under its far shaft
        // is 12,3, and a chunk set there goes up to the far island at HIGH.
        //
        // Both of the Keep's S190 locks are this room's (the human's choice):
        // the south door from the Slack Water and the east door to the
        // Hauling Pit. Open one to come in and the other is the way round.
        map: [
          '###############',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#......5......#',
          'D.............L',
          '#.............#',
          '##............#',
          '#.O.........U.#',
          '##............#',
          '#######L#######',
        ],
        entities: [
          ['switch', 1, 8, { hold: true }],
          ['stalfos', 4, 6],
          ['stalfos', 10, 2],
        ],
        // tools/check-hold.mjs: the plate is fed by a throw from 3,8; the
        // chunk on the Plumb's Foot ring comes up on a line cast from 7,3;
        // a chunk on the plate comes back off it on the line from 3,8.
        holdRoom: {
          plate: [1, 8],
          feeds: [{ at: [48, 128], face: 'left', sea: 1 }],
          hauls: [{ from: [7, 3], face: 'down', sea: 1, below: [7, 4] }],
          catches: [{ from: [3, 8], face: 'left', sea: 1, at: [1, 8] }],
        },
        puzzle: {
          switches: 'all',
          flag: 'd6_weigh',
          reward: { openDoors: [[0, 5]], say: 'The west shutter grinds open.' },
        },
        readable: [
          [12, 8, 'A weigher\'s mark on the plinth: "Weigh what the Hold gives up. Then do it again, a floor higher."'],
        ],
      },

      // ---------------------------------------------------- the east wing (S142)
      //
      // THE DREDGE LINE'S EXAMINATION, between the teaching pan and the stair.
      // The Slack Water teaches the floor; these three teach the line: the
      // Draw is the first real crossing and its way home, the Tally Hall asks
      // for three seas in one tall room, and the Hauling Pit hands the Small
      // Key for the stair over only to a player who has learned that the line
      // brings home what it catches. The key opens Keep Lock's west door, and
      // a plate in the Hauling Pit opens the short way back into the Draw.
      '1,6,3': {
        name: 'The Draw',
        // CROSSING 0: the Drowned Stand's fixture, the first time the player
        // needs it. The shelf at 8,8 is `dWell` — wading at LOW, over your head
        // above — and the only footing the far post can be reached from; the
        // post at 7,8 is the way home and stops a longer line from the bank.
        map: [
          '#######D#######',
          '#./.....#OO.6.#',
          '#.......#OO.1.#',
          '#.p.....#OO...#',
          '#.......#OO...#',
          'D.......#OO....',
          '#.......#OO...#',
          '#.......#OO...#',
          '#......q3OO.q.#',
          '#........OO...#',
          '#######.#######',
        ],
        // K4's way round (S189): a chunk set down on the east bank at 11,9 is
        // caught by the line cast from the west bank and comes home across
        // the shafts, as nobody can carry one over them.
        holdRoom: {
          catches: [{ from: [8, 9], face: 'right', sea: 0, at: [11, 9] }],
        },
        // The stair down into the Hold (S189), in the west half.
        warps: [
          { x: 2, y: 1, to: { map: 'd6', floor: 0, rx: 6, ry: 3, px: 32, py: 144, dir: 'down' } },
        ],
        buried: [[12, 1, 'rupee20']],
        dredgeRoom: {
          // The west door is K1's shutter now (S189); the south door is open.
          entry: [7, 10],
          moorings: [
            { post: [12, 8], from: [8, 8], land: [11, 8], face: 'right', sea: 0 },
          ],
          returns: [
            { post: [7, 8], from: [11, 8], land: [8, 8], face: 'left', sea: 0 },
          ],
          caches: [
            { at: [12, 1], from: [12, 2], face: 'up', sea: 1 },
          ],
        },
        entities: [
          ['stalfos', 3, 6],
          ['stalfos', 5, 2],
        ],
        readable: [
          [6, 9, 'Scratched by the shaft: "This ledge only holds your feet at LOW tide."'],
        ],
      },
      '1,7,2': {
        name: 'The Tally Hall',
        // THREE SEAS, ONE ROOM, two screens tall. Up from the door's bank to the
        // island at LOW off the shelf at 7,16; up from the island to the far
        // bank at HIGH, once the flood has drowned the bar at 9,10; and on the
        // far bank a silted ring fished from a shelf that is over your head at
        // HIGH, so the sea comes back down to MID for it. The way out is west
        // off the far bank, and every crossing has its way home.
        size: [1, 2],
        map: [
          '###############',
          '#.............#',
          '#..........6..#',
          '#..........1..#',
          '#.............#',
          '..............#',
          '#..........5..#',
          '#.............#',
          '#........q....#',
          '#.............#',
          '#OOOO7OOO7OOOO#',
          '#OOOOOOOOOOOOO#',
          '#OOOO..q..OOOO#',
          '#OOOOq....OOOO#',
          '#OOOOOOOOOOOOO#',
          '#OOOOOOOOOOOOO#',
          '.......3......#',
          '#......q......#',
          '#.............#',
          '#.............#',
          '#............5#',
          '###############',
        ],
        // K4 (S189): a shaft on each bank, one over each half of the Rime Hall
        // beneath — the north one (11,6) over its plate, the south one
        // (13,20), in the corner out of the way, over its ring. The Hold has
        // no way across; the Keep does.
        holdRoom: {
          hauls: [{ from: [13, 19], face: 'down', sea: 1, below: [13, 20] }],
        },
        buried: [[11, 2, 'blank']],
        dredgeRoom: {
          entry: [0, 16],
          moorings: [
            { post: [7, 12], from: [7, 16], land: [7, 13], face: 'up', sea: 0 },
            { post: [9, 8], from: [9, 12], land: [9, 9], face: 'up', sea: 2, entry: [7, 13] },
          ],
          returns: [
            { post: [7, 17], from: [7, 13], land: [7, 16], face: 'down', sea: 0 },
            { post: [5, 13], from: [5, 9], land: [5, 12], face: 'down', sea: 2, entry: [7, 13] },
          ],
          caches: [
            { at: [11, 2], from: [11, 3], face: 'up', sea: 1 },
          ],
        },
        entities: [
          ['stalfos', 3, 19],
          ['stalfos', 9, 19],
        ],
        readable: [
          [2, 18, 'A tally cut in the wall, three marks: "LOW for the ledge. HIGH for the bar. MID for the floor."'],
        ],
      },
      '1,6,2': {
        name: 'The Hauling Pit',
        // THE LINE BRINGS HOME WHAT IT CATCHES. The Small Key is on a pillar
        // in the shaft, and the bar at 7,4 stands between it and the only bank
        // near enough — so it comes home at HIGH and at no other sea. The silt
        // in the nook at 3,7 can only be fished from the shelf in front of it,
        // which is over your head at HIGH: MID for the floor, HIGH for the key.
        // The plate opens the south door into the Draw's near bank, so the key
        // does not have to be carried back over three shafts.
        map: [
          '###############',
          '#####OOOOO#####',
          '#####OO.OO#####',
          '#####OOOOO#####',
          '#####OO7OO#####',
          'L....OOOOO.....',
          '#..#..........#',
          '#.#6#.........#',
          '#..1..........#',
          '#..#..........#',
          '#######D#######',
        ],
        buried: [[3, 7, 'rupee20']],
        dredgeRoom: {
          entry: [14, 5],
          hauls: [
            { at: [7, 2], from: [7, 6], face: 'up', sea: 2 },
          ],
          caches: [
            { at: [3, 7], from: [3, 8], face: 'up', sea: 1 },
          ],
        },
        entities: [
          ['pickup', 7, 2, { kind: 'key' }],
          ['switch', 12, 8, { hold: false }],
          ['stalfos', 10, 8],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd6_hauling',
          reward: {
            openDoors: [[7, 10]],
            say: 'The south door grinds open.',
          },
        },
        readable: [
          [12, 6, 'Carved over the shaft: "Whatever the line catches, it brings home."'],
        ],
      },

      '1,6,4': {
        name: 'The Angler Stews',
        // THE LINE'S OTHER HALF, and the only fight in the Keep built for it.
        // Four deep pools, an anglerfry in each, and a sword cannot reach the
        // middle of a pool three tiles wide. The line can: it lands what it
        // catches on the bank, where it flops helpless and takes double. The
        // chest appears when the pools are empty. Off the Draw's near bank.
        map: [
          '#######.#######',
          '#.............#',
          '#.WWW.....WWW.#',
          '#.WWW.....WWW.#',
          '#.............#',
          '#..............',
          '#.............#',
          '#.WWW.....WWW.#',
          '#.WWW.....WWW.#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['anglerfry', 3, 2],
          ['anglerfry', 11, 3],
          ['anglerfry', 3, 8],
          ['anglerfry', 11, 7],
        ],
        puzzle: {
          enemies: true,
          flag: 'd6_stews',
          reward: { spawn: [['chest', 7, 5, { charm: 'kelpBraid' }]], say: 'The pools go still.' },
        },
        readable: [
          [7, 1, 'A fishwife\'s board: "They won\'t come out for a sword. They\'ll come out for a line!"'],
        ],
      },
      '1,7,4': {
        name: 'The Silt Terraces',
        // Two screens tall and a step down the middle: brace on the shelf at
        // 7,8 at LOW and the line takes you to the lower terrace; the silt in
        // the nook at 12,14 gives up a blank to a line cast off the shelf in
        // front of it at MID; and the chest is the terrace's own. The way home
        // is the post at 7,7, at LOW again.
        size: [1, 2],
        map: [
          '###############',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#.............#',
          '..............#',
          '#.............#',
          '#......q......#',
          '#......3......#',
          '#OOOOOOOOOOOOO#',
          '#OOOOOOOOOOOOO#',
          '#.............#',
          '#......q......#',
          '#...........#.#',
          '#..........#6##',
          '#...........1.#',
          '#...........#.#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.............#',
          '###############',
        ],
        buried: [[12, 14, 'blank']],
        dredgeRoom: {
          entry: [0, 5],
          moorings: [
            { post: [7, 12], from: [7, 8], land: [7, 11], face: 'down', sea: 0 },
          ],
          returns: [
            { post: [7, 7], from: [7, 11], land: [7, 8], face: 'up', sea: 0 },
          ],
          caches: [
            { at: [12, 14], from: [12, 15], face: 'up', sea: 1 },
          ],
        },
        entities: [
          ['chest', 2, 19, { charm: 'pressureScar' }],
          ['stalfos', 5, 17],
          ['keese', 10, 4],
        ],
      },

      // ---------------------------------------------------- THE HOLD (S189)
      //
      // B1, under the Keep's east wing: the Sword & Shield Maze's ICE half,
      // Seasons' own other half of the dungeon the Keep is built in. "What
      // the sea puts down, the line brings up": at LOW an ice chunk over a
      // shaft upstairs falls to the same cell here; at MID the Dredge Line
      // cast over a flooded one hauls up whatever lies on the cell beneath.
      // To Link the shafts are pits (Seasons' rule, the human's choice): he
      // comes down by the Draw's stair. Every cell under a shaft is marked
      // with the darker ring (`,`), and every plate is in sight of its room.
      // Proved by tools/check-hold.mjs.
      '0,6,3': {
        name: 'The Rime Landing',
        legend: 'dungeonAbyssIce',
        // K2: ICE, ALONE. At the foot of the Draw's stair, a band of Seasons'
        // ice across the room to cross to anywhere, a fight on it, and three
        // chunks on a dais the way the maze's room $84 keeps one in an alcove.
        map: [
          '###########.###',
          '#.....=...=...#',
          '......=...=...#',
          '#.....==.==...#',
          '#iiiiiiiiiiiii#',
          '#iiiiiiiiiiiii#',
          '#iiiiiiiiiiiii#',
          '#iiiiiiiiiiiii#',
          '#..............',
          '#S............#',
          '###############',
        ],
        // The stair up is in the corner, off every line across the room (the
        // robot's path from the east door to the west one crossed it, S189).
        warps: [
          { x: 1, y: 9, to: { map: 'd6', floor: 1, rx: 6, ry: 3, px: 32, py: 32, dir: 'down' } },
        ],
        entities: [
          ['icechunk', 7, 1, { id: 'd6L1' }],
          ['icechunk', 9, 1, { id: 'd6L2' }],
          ['icechunk', 8, 2, { id: 'd6L3' }],
          ['stalfos', 5, 6],
          ['zol', 10, 5],
          ['keese', 12, 2],
        ],
        readable: [
          [12, 8, 'Scratched in the frost: "Down here the sea\nonly ever sets things down."'],
        ],
      },
      '0,6,2': {
        name: 'The Rime Gauge',
        legend: 'dungeonAbyssIce',
        // THE ICE BLOCKS' HARD ROOM (S209, docs/briefs/PUZZLE-PASS.md step
        // 7; Seasons' room $586, three ice blocks into an alcove). Two blocks,
        // two plates past sump necks only a floating block crosses, and one row
        // that reads the sea like a gauge: the dips at either end catch a block
        // only at HIGH, the well only at LOW, and the stopper at 8,4 is under
        // the sea only at HIGH. Each block is the other's stopper, and the
        // conch goes round twice. Optional: a blank for the scrimshander.
        // The urns guard the door, so no block can come to rest in front of it.
        map: [
          '###############',
          '#iiii#.#.#iiii#',
          '#iiii#0#0#iiii#',
          '#iiiiiiiiiiiii#',
          '#i2iii3i9iii2i#',
          '#iiiiiiiiiiiii#',
          '#iiiiiiiiiiiii#',
          '#iiiiiiiiiiiii#',
          '#iiiiiiiiiUUUi#',
          '#iiiiiiiiiiiii#',
          '###########.###',
        ],
        iceRoom: { from: [11, 9], seas: [0, 1, 2] },
        entities: [
          ['iceblock', 2, 6],
          ['iceblock', 12, 6],
          ['switch', 6, 1],
          ['switch', 8, 1],
          ['chest', 13, 9, { pickup: 'blank', needFlag: 'd6_gauge' }],
        ],
        puzzle: {
          blocks: [[6, 1], [8, 1]],
          flag: 'd6_gauge',
          reward: { say: 'Something settles by the door.' },
        },
      },
      '0,5,3': {
        name: 'The Sounding Floor',
        legend: 'dungeonAbyssIce',
        // K3: DOWN AT LOW. A plate on an islet in a field of holes four
        // tiles from any shore, under the Slack Water's EAST well (9,8); the
        // ring at 3,8 under its WEST well is where K1's chunk lay. Throw the
        // chunk down the east well at LOW and it lands on the plate.
        map: [
          '#######.#######',
          '#iiiiiiiiiiiii#',
          '#iiiiiiiiiiiiii',
          '#ii...........#',
          '#ii..OOOOOOOOO#',
          '#ii..OOOOOOOOO#',
          '#ii..OOOOOOOOO#',
          '#ii..OOOOOOOOO#',
          '#ii,.OOOO.OOOO#',
          '#ii..OOOOOOOOO#',
          '###############',
        ],
        entities: [
          ['icechunk', 3, 8, { id: 'd6S1' }],
          ['switch', 9, 8, { hold: true }],
        ],
        holdRoom: {
          plate: [9, 8],
          drops: [{ room: '1,5,3', at: [144, 80], face: 'down', sea: 0 }],
        },
        puzzle: {
          switches: 'all',
          flag: 'd6_sounding',
          reward: { spawn: [['pickup', 4, 3, { kind: 'key' }]], say: 'Something falls onto the ice.' },
        },
      },
      '0,7,2': {
        name: 'The Rime Hall',
        legend: 'dungeonAbyssIce',
        // K4: OVER, NOT ACROSS. Two screens tall under the Tally Hall: chunks
        // on the south ice, a chasm across the middle no throw crosses, and a
        // plate (11,6) beyond it under the Tally Hall's north well. Set a chunk
        // on the ring (13,20) under its south well; go up; at MID haul it up
        // the south well; carry it round the Keep to the north bank; at LOW
        // throw it down the north well onto the plate.
        size: [1, 2],
        map: [
          '###############',
          '#.............#',
          '#.............#',
          '#....p...p....#',
          '#.............#',
          '#.............#',
          '#..........,..#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#OOOOOOOOOOOOO#',
          '#OOOOOOOOOOOOO#',
          '#OOOOOOOOOOOOO#',
          '#OOOOOOOOOOOOO#',
          '#OOOOOOOOOOOOO#',
          '#iiiiiiiiiiiii#',
          '#iiiiiiiiiiiii#',
          '#iiiiiiiiiiiii#',
          '#.............#',
          '..............#',
          '#............,#',
          '###############',
        ],
        entities: [
          ['switch', 11, 6, { hold: true }],
          ['icechunk', 2, 20, { id: 'd6R1' }],
          ['icechunk', 3, 20, { id: 'd6R2' }],
          ['stalfos', 9, 19],
        ],
        holdRoom: {
          plate: [11, 6],
          drops: [{ room: '1,7,2', at: [176, 48], face: 'down', sea: 0 }],
        },
        puzzle: {
          switches: 'all',
          flag: 'd6_rime',
          reward: { spawn: [['pickup', 7, 19, { kind: 'key' }]], say: 'Something falls onto the ice.' },
        },
      },
      '0,5,2': {
        name: 'The Plumb\'s Foot',
        legend: 'dungeonAbyssIce',
        // The foot of the Plumb (S189; its well upstairs, the Weighhouse, is
        // the second half's): the Hold keeps its chunks here, and the ring at
        // 7,4 marks the cell under the Weighhouse's well — one lies on it
        // from the start (S190), so K5 is the Slack Water's haul again.
        map: [
          '###############',
          '#.p.p.....p.p.#',
          '#.............#',
          '#..iiiiiiiii..#',
          '#..iiii,iiii..#',
          '#..iiiiiiiii..#',
          '#..iiiiiiiii..#',
          '#..=.......=..#',
          '#.............#',
          '#.............#',
          '#######.#######',
        ],
        entities: [
          ['icechunk', 3, 8, { id: 'd6P1' }],
          ['icechunk', 4, 8, { id: 'd6P2' }],
          // The one the Hold keeps under the Weighhouse's well (S190): K5's.
          ['icechunk', 7, 4, { id: 'd6P3' }],
          ['icechunk', 11, 8, { id: 'd6P4' }],
          ['gel', 7, 6],
          ['gel', 9, 2],
        ],
      },

      // ---------------------------------------------------- upper floor
      '2,3,5': {
        name: 'Upper Keep',
        map: [
          '#######.#######',
          '#.............#',
          '#.........../.#',
          '#.............#',
          '#.............#',
          '...............',
          '#.............#',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '###############',
        ],
        warps: [
          { x: 12, y: 2, to: { map: 'd6', floor: 1, rx: 2, ry: 3, px: 192, py: 48 } },
        ],
        entities: [
          ['keese', 4, 6],
        ],
      },
      '2,2,5': {
        name: 'Shade Cell',
        map: [
          '#######.#######',
          '#.............#',
          '#.............#',
          '#...M.....M...#',
          '#.............#',
          '...............',
          '#.............#',
          '#...M.....M...#',
          '#.............#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['wizzrobe', 4, 5],
          ['darknut', 10, 6],
          ['keese', 7, 2],
        ],
        puzzle: {
          enemies: true,
          flag: 'd6_shade',
          reward: { spawn: [['pickup', 7, 5, { kind: 'heart' }]], say: 'The shadows thin out.' },
        },
      },
      '2,2,4': {
        name: 'Colonnade of the Drowned',
        // The hand-placed charm, the Coilrope, which adds a tile to every cast.
        // It sits behind a GRATE, and the only thing in the game that retracts
        // metal is the Resonance Rod — the trading reward. So the one optional
        // thing in the Keep is the one thing that asks whether the player went
        // and did the trade. The grate seals an alcove and nothing else.
        map: [
          '###############',
          '###############',
          '#####.....#####',
          '#####GGGGG#####',
          '#.............#',
          '#..=.......=..#',
          '#.............#',
          '#..=.......=..#',
          '#.............#',
          '#.............#',
          '#######.#######',
        ],
        entities: [
          ['chest', 7, 2, { charm: 'coilrope' }],
          ['beamos', 2, 8],
        ],
        readable: [
          [11, 5, 'A chandler\'s note nailed to the column: "More rope means more reach. It doesn\'t mean more sea."'],
        ],
      },
      // ---------------------------------------------------- the west wing (S142)
      // Off the Shade Cell, and nothing in it is needed: the Keep's deepest
      // optional run. Three shafts in a row at three seas, a pit that pays out
      // what the line can reach over a bar, a flooded cell of anglerfry, and a
      // choir hall whose shelf is a hole at slack water and wades only at
      // half tide.
      '2,0,5': {
        name: 'The Long Sounding',
        // THREE SHAFTS, WEST FROM THE DOOR. LOW off the shelf at 23,5 to the
        // first island; HIGH from its west side over the bar at 16,7; LOW
        // again off the second island's shelf at 12,5 to the far bank. Every
        // one has its way home, and a player who raises the sea to cross the
        // second shaft has to remember to lower it for the third.
        size: [2, 1],
        map: [
          '#######.######################',
          '#.........OO....OO...OO##....#',
          '#.........OO....OO...OO##....#',
          '#.........OO....7O.q.OO##....#',
          '#.........OO....OO...OO......#',
          '#.......q.OO3q..OO#q.OO3q.....',
          '#.........OO....OO...OO......#',
          '#.........OO..q.7O...OO##....#',
          '#.........OO....OO...OO##....#',
          '#.........OO....OO...OO##....#',
          '##############################',
        ],
        dredgeRoom: {
          entry: [29, 5],
          moorings: [
            { post: [19, 5], from: [23, 5], land: [20, 5], face: 'left', sea: 0 },
            { post: [14, 7], from: [18, 7], land: [15, 7], face: 'left', sea: 2, entry: [20, 5] },
            { post: [8, 5], from: [12, 5], land: [9, 5], face: 'left', sea: 0, entry: [15, 7] },
          ],
          returns: [
            { post: [24, 5], from: [20, 5], land: [23, 5], face: 'right', sea: 0 },
            { post: [19, 3], from: [15, 3], land: [18, 3], face: 'right', sea: 2, entry: [20, 5] },
            { post: [13, 5], from: [9, 5], land: [12, 5], face: 'right', sea: 0, entry: [15, 7] },
          ],
        },
        entities: [
          ['chest', 3, 5, { charm: 'hagstone' }],
          ['stalfos', 26, 2],
          ['darknut', 4, 8],
        ],
        readable: [
          [27, 8, 'A sounding line knotted to the wall: "LOW, HIGH, LOW. Count them before you go."'],
        ],
      },
      '2,0,4': {
        name: 'The Offering Pit',
        // What the Hauling Pit taught, with nothing at stake: a purse on a
        // pillar behind a bar, fetched at HIGH; and a silt nook in the corner
        // fished at MID off the shelf in front of it.
        map: [
          '###############',
          '#.OOOOOOOOOOO.#',
          '#.OOOOOOOOOOO.#',
          '#.OOOOO.OOOOO.#',
          '#.OOOOOOOOOOO.#',
          '#.OOOOO7OOOOO..',
          '#.OOOOOOOOOOO.#',
          '#..1..........#',
          '#.#6#.........#',
          '#..#..........#',
          '#######.#######',
        ],
        buried: [[3, 8, 'rupee20']],
        dredgeRoom: {
          entry: [7, 10],
          hauls: [
            { at: [7, 3], from: [7, 7], face: 'up', sea: 2 },
          ],
          caches: [
            { at: [3, 8], from: [3, 7], face: 'down', sea: 1 },
          ],
        },
        entities: [
          ['pickup', 7, 3, { kind: 'rupee100' }],
          ['keese', 11, 8],
        ],
      },
      '2,1,4': {
        name: 'The Undertow Cell',
        // The Angler Stews upstairs, with a knight in the middle of it. The
        // north door opens when the room is empty.
        map: [
          '#######D#######',
          '#.............#',
          '#.WWW.....WWW.#',
          '#.WWW.....WWW.#',
          '#.............#',
          '..............#',
          '#.............#',
          '#.WWW.....WWW.#',
          '#.WWW.....WWW.#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['anglerfry', 3, 2],
          ['anglerfry', 11, 8],
          ['darknut', 7, 5],
        ],
        puzzle: {
          enemies: true,
          flag: 'd6_undertow',
          reward: { openDoors: [[7, 0]], say: 'The north door grinds open.' },
        },
      },
      '2,0,3': {
        name: 'The Deep Choir',
        // THE SHELF THAT IS A HOLE AT SLACK WATER. The only footing that
        // reaches the far post is the drain at 18,5 — a pit at LOW, wading at
        // MID, over your head at HIGH — so this shaft is crossed at MID and at
        // no other sea. On the far side the silt at 7,2 is behind a bar, and
        // only comes up at HIGH.
        size: [2, 1],
        map: [
          '##############################',
          '#.OOOOOOOOOOO...OO...........#',
          '#.OOOOO6OOOOO...OO...U.....U.#',
          '#.OOOOO7OOOOO...OO...........#',
          '#.OOOOOOOOOOO...OO...........#',
          '#.............q.OO4q.........#',
          '#...............OO...........#',
          '#...............OO...........#',
          '#.U.........U...OO...U.....U.#',
          '#...............OO...........#',
          '######################D#######',
        ],
        buried: [[7, 2, 'rupee100']],
        dredgeRoom: {
          entry: [22, 9],
          moorings: [
            { post: [14, 5], from: [18, 5], land: [15, 5], face: 'left', sea: 1 },
          ],
          returns: [
            { post: [19, 5], from: [15, 5], land: [18, 5], face: 'right', sea: 1 },
          ],
          caches: [
            { at: [7, 2], from: [7, 5], face: 'up', sea: 2 },
          ],
        },
        entities: [
          ['chest', 7, 8, { charm: 'neapCharm' }],
          ['darknut', 24, 6],
        ],
        readable: [
          [20, 7, 'Cut under the choir stalls: "Cross at MID tide. At LOW the floor is gone, and at HIGH it\'s over your head."'],
        ],
      },
      '2,4,5': {
        name: 'Tideshade Hall',
        // Four screens, and the only miniboss arena in the game that is. The
        // tideshade phases with the water and the room's basins are `1` — dry
        // at LOW, wading at MID, swimming at HIGH — so the fight is a different
        // fight at each sea. Its north door opens on the kill.
        size: [2, 2],
        map: [
          '#######D######################',
          '#............................#',
          '#............................#',
          '#...11111..........11111.....#',
          '#...11111..........11111.....#',
          '....11111..........11111.....#',
          '#...11111..........11111.....#',
          '#............................#',
          '#............................#',
          '#............................#',
          '#............................#',
          '#............................#',
          '#............................#',
          '#............................#',
          '#............................#',
          '#...11111..........11111.....#',
          '#...11111..........11111.....#',
          '#...11111..........11111.....#',
          '#...11111..........11111.....#',
          '#............................#',
          '#............................#',
          '##############################',
        ],
        entities: [
          ['tideshade', 14, 5],
        ],
        puzzle: {
          enemies: true,
          flag: 'd6_tideshade',
          reward: {
            openDoors: [[7, 0]],
            say: 'The shade unravels into water and is gone. Something gives above.',
          },
        },
      },
      '2,4,4': {
        name: 'Mermaid Vault',
        map: [
          '###############',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#....,,,,,....#',
          '#....,,,,,....#',
          '#....,,,,,....#',
          '#.............#',
          '#../..........#',
          '#.............#',
          '#######D#######',
        ],
        entities: [
          ['chest', 7, 5, { big: true, item: 'cleats', level: 2 }],
        ],
        warps: [
          // Down to the Two Arches. The vault is the only way in and the only
          // way back out of it, so the fork below can never strand anyone.
          { x: 3, y: 8, to: { map: 'd6', floor: 2, rx: 5, ry: 4, px: 104, py: 120, dir: 'down' } },
        ],
      },

      // ---------------------------------------------------- the two arches
      //
      // THE KEEP'S LENS FORK. At MID the two arches are a blank stretch of the
      // Keep's own wall, the same tile, not a lookalike: a `7` lintel and a
      // plain `#` both draw the Keep's masonry. One level up, one of them is
      // open water and the other is still stone. The room pins the tide to
      // MID; both valves are INSIDE the chambers, past the one-way ledges. You
      // choose first. The fork at 10x8, set into the rock under the vault.
      '2,5,4': {
        name: 'The Two Arches',
        map: [
          '###############',
          '###....../.####',
          '###7###########',
          '###..####..####',
          '###..####..####',
          '###./####/.####',
          '###.<....>.####',
          '####.../..#####',
          '###############',
          '###############',
          '###############',
        ],
        tideForce: 1,
        entities: [
          ['valve', 4, 3],
          ['valve', 9, 3],
          ['pickup', 5, 1, { kind: 'rupee20' }],
          ['pickup', 7, 1, { kind: 'rupee20' }],
        ],
        warps: [
          // The way back up, from the shelf you arrive on.
          { x: 7, y: 7, to: { map: 'd6', floor: 2, rx: 4, ry: 4, px: 64, py: 128, dir: 'up' } },
          // The climb out of each chamber. The wrong one is a walk, not a lock.
          { x: 4, y: 5, to: { map: 'd6', floor: 2, rx: 4, ry: 4, px: 64, py: 128, dir: 'up' } },
          { x: 9, y: 5, to: { map: 'd6', floor: 2, rx: 4, ry: 4, px: 64, py: 128, dir: 'up' } },
          // And out of the gallery above, once you have got into it.
          { x: 9, y: 1, to: { map: 'd6', floor: 2, rx: 4, ry: 4, px: 64, py: 128, dir: 'up' } },
        ],
        script: {
          onEvent(game, name) {
            if (name === 'valve') game.forceTideStep();
          },
        },
        readable: [
          [6, 7, 'Cut above the drop:\n"Both arches are shut.\nOnly one of them is stone."'],
        ],
        lensRoom: {
          pin: 1, reveals: 2, decide: [6, 6],
          branches: [
            { name: 'the west arch', land: [3, 6], probe: [3, 2], onward: [3, 1], escape: [4, 5] },
            { name: 'the east arch', land: [10, 6], probe: [10, 2], onward: [10, 1], escape: [9, 5] },
          ],
        },
      },

      // ---------------------------------------------------- the crossings
      //
      // THE FIXTURE, and the three rooms below are it. A shaft of `O` that no
      // sea fills and no Cleat crosses; a mooring `q` one tile inside the far
      // bank; and ONE of the two tide tiles deciding whether the cast can
      // happen — a `3` shelf you brace on, which drowns above LOW, or a `7`
      // lintel in the way, which is stone below HIGH. Every crossing carries a
      // mooring on the near side as well, so nothing here is one-way.
      '2,3,4': {
        name: 'The Drowned Stand',
        // CROSSING 1, at LOW, and the fixture at its plainest. The shelf is
        // `dWell` — wading at LOW, over your head above it — so the only sea
        // you can brace at is the only sea the room is crossed at.
        map: [
          '#######.#######',
          '#######.#######',
          '####......6.###',
          '####....q...###',
          '####........###',
          '####OOOOOOOO###',
          '####OOOOOOOO###',
          '####OO3333OO###',
          '#######.#q#####',
          '#######.#######',
          '#######.#######',
        ],
        buried: [[10, 2, 'rupee20']],
        dredgeRoom: {
          entry: [7, 10],
          moorings: [
            { post: [8, 3], from: [8, 7], land: [8, 4], face: 'up', sea: 0 },
          ],
          returns: [
            { post: [9, 8], from: [9, 4], land: [9, 7], face: 'down', sea: 0 },
          ],
          caches: [
            { at: [10, 2], from: [10, 4], face: 'up', sea: 1 },
          ],
        },
        entities: [
          ['keese', 5, 3],
          ['anglerfry', 6, 7],
        ],
        readable: [
          [4, 4, 'Cut into the coping: "This ledge is only a ledge at LOW tide. Stand on it while you can."'],
        ],
      },
      '2,3,3': {
        name: 'Keep Crossing',
        map: [
          '#######L#######',
          '#.............#',
          '#.............#',
          '#....#...#....#',
          '#.............#',
          '..............L',
          '#.............#',
          '#....#...#....#',
          '#.............#',
          '#.............#',
          '#######.#######',
        ],
        entities: [
          ['darknut', 10, 6],
          ['keese', 11, 2],
        ],
      },
      '2,2,3': {
        name: 'The Sunken Bar',
        // CROSSING 2, at HIGH, and the Drowned Stand inside out. The mooring is
        // in plain sight from the doorway and the lintel is what stops the
        // line — stone at LOW and at MID, open water at HIGH. So the sea has to
        // come UP to cross, and the cache is fished off a `1` shelf that is
        // over your head at HIGH, so the sea has to go back DOWN to collect.
        map: [
          '###############',
          '###############',
          '####.66.#...###',
          '####.11.#...###',
          '####....#.....#',
          '####..q.O9.q#..',
          '####....#...###',
          '####....#...###',
          '###############',
          '###############',
          '###############',
        ],
        buried: [[5, 2, 'heartPiece'], [6, 2, 'rupee20']],
        dredgeRoom: {
          entry: [14, 5],
          moorings: [
            { post: [6, 5], from: [10, 5], land: [7, 5], face: 'left', sea: 2 },
          ],
          returns: [
            { post: [11, 5], from: [7, 5], land: [10, 5], face: 'right', sea: 2 },
          ],
          caches: [
            { at: [5, 2], from: [5, 3], face: 'up', sea: 1 },
            { at: [6, 2], from: [6, 3], face: 'up', sea: 1 },
          ],
        },
        entities: [
          ['keese', 10, 6],
        ],
        readable: [
          [11, 6, 'A tide board: "The stone bar is in your way at LOW tide, and underwater at HIGH. This whole room turns on that."'],
        ],
      },
      '2,4,3': {
        name: 'The Drowned Sill',
        // CROSSING 3, at LOW, the Drowned Stand turned through a right angle
        // and handed the other way — and what is across the shaft is a Small
        // Key rather than a corridor. The cache is out of reach of the near
        // bank even with the Coilrope on.
        map: [
          '###############',
          '####..OO....###',
          '####..OO...6###',
          '####..OO....###',
          '####q3OO.q..###',
          'L.....OO....###',
          '####..OO....###',
          '###############',
          '###############',
          '###############',
          '###############',
        ],
        buried: [[11, 2, 'key']],
        dredgeRoom: {
          entry: [1, 5],
          moorings: [
            { post: [9, 4], from: [5, 4], land: [8, 4], face: 'right', sea: 0 },
          ],
          returns: [
            { post: [4, 4], from: [8, 4], land: [5, 4], face: 'left', sea: 0 },
          ],
          caches: [
            { at: [11, 2], from: [11, 4], face: 'up', sea: 1 },
          ],
        },
        entities: [
          ['siren', 11, 2],
        ],
      },

      // ---------------------------------------------------- the way out
      '2,3,2': {
        name: 'Keep Gate',
        // THE LAST HALL BEFORE THE KING, AND IT HOLDS THE KEEP'S SECOND FAIRY,
        // in the corner, off both the way in from the south and the way east
        // to the shafts, so it is taken deliberately. It is taken once.
        map: [
          '#######.#######',
          '#.............#',
          '#.............#',
          '#.............#',
          '#...19...91...#',
          '#..............',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#######L#######',
        ],
        entities: [
          ['wizzrobe', 10, 7],
          ['pickup', 1, 9, { kind: 'fairy' }],
        ],
      },
      '2,3,1': {
        name: 'The Stairhead',
        // THE ANTECHAMBER, and the fairy in it is behind nothing but the hall
        // it opens off — it used to stand behind the boss door, in a pocket of
        // the Keep Gate, and at Oracle size the boss door is in the ring. So it
        // has a room of its own at the foot of the King's stair, which is where
        // the Oracle games put the last breath before a boss. `life` keeps it
        // there while the rest of the floor is walked.
        map: [
          '#######B#######',
          '#.............#',
          '#.M.........M.#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.M.........M.#',
          '#.............#',
          '#######.#######',
        ],
        entities: [
          ['pickup', 2, 5, { kind: 'fairy', life: 1e9 }],
        ],
      },
      '2,4,2': {
        name: 'The Crossed Shafts',
        // THE ROOM THAT SAYS IT OUT LOUD, and the only one in the dungeon that
        // holds both crossings. In at HIGH over the bar, down to LOW to brace
        // on the shelf, and the Boss Key is on the far island — so the sea that
        // gets you in is the sea that stops you going on. It owns the cell at
        // 5,2 as well as its own. At Oracle size the far island runs the whole
        // east screen: the colossus is fought there, and a five-tile ledge
        // between it and the pits was a fight decided by knockback (S142).
        //
        // K6, THE BOSS KEY (S190): A CHUNK CLIMBS THE KEEP ONE SEA AT A TIME.
        // Two 2F shafts (`8`), holes at LOW and MID and flooded only at HIGH:
        // 12,5 on the middle island over the Drowned Garden's 12,5, and 27,3
        // on the far island over the Weighhouse's 12,3. A plate in a nook past
        // a pit on each island (15,1 and 23,1). Both held raise the Boss Key's
        // chest. Each chunk: up out of the Hold through the Weighhouse's well
        // at MID, set down on 1F under its shaft, and at HIGH hauled up onto
        // its island with the line — a chunk crosses no shaft in Link's hands.
        size: [2, 1],
        map: [
          '##############################',
          '###############.#######.######',
          '######....#O...O.OO....O.....#',
          '######..q.7O.q...OO........8.#',
          '######....#O.....OO...U......#',
          '..........#O8....OO..........#',
          '######....#O...q3OO.q........#',
          '######....#O.....OO..........#',
          '####################.........#',
          '####################.........#',
          '##############################',
        ],
        dredgeRoom: {
          entry: [0, 5],
          moorings: [
            { post: [13, 3], from: [9, 3], land: [12, 3], face: 'right', sea: 2 },
            { post: [20, 6], from: [16, 6], land: [19, 6], face: 'right', sea: 0, entry: [12, 3] },
          ],
          returns: [
            { post: [8, 3], from: [12, 3], land: [9, 3], face: 'left', sea: 2 },
            { post: [15, 6], from: [19, 6], land: [16, 6], face: 'left', sea: 0, entry: [12, 3] },
          ],
        },
        entities: [
          ['chest', 21, 5, { pickup: 'bossKey', needFlag: 'd6_crossed' }],
          ['switch', 15, 1, { hold: true }],
          ['switch', 23, 1, { hold: true }],
          // THE COLOSSUS'S HOARD, and the last thing to heal on before the
          // King's stair, taken on the way back with the Boss Key. `life`
          // keeps it through the fight in front of it.
          ['pickup', 20, 2, { kind: 'fairy', life: 1e9 }],
          // Brine dissolves salt: the Brinehulk is ARMOURED AT LOW and comes
          // apart at HIGH — and LOW is the only sea the shelf lets you cross on.
          ['brinehulk', 25, 5],
          ['beamos', 14, 2],
          ['keese', 21, 6],
        ],
        // tools/check-hold.mjs: each plate fed by a throw from the island in
        // front of its nook, and each chunk hauled up its shaft at HIGH (and
        // not at LOW or MID: the sea has not reached this floor).
        holdRoom: {
          plates: [
            { plate: [15, 1], feeds: [{ at: [240, 48], face: 'up', sea: 2 }] },
            { plate: [23, 1], feeds: [{ at: [368, 48], face: 'up', sea: 2 }] },
          ],
          hauls: [
            { from: [12, 4], face: 'down', sea: 2, below: [12, 5] },
            { from: [27, 4], face: 'up', sea: 2, below: [27, 3] },
          ],
        },
        puzzle: {
          switches: 'all',
          flag: 'd6_crossed',
          reward: { reveal: true, say: 'Two weights in the Drowned King\'s scales.\nA chest rises on the far island.' },
        },
        readable: [
          [7, 6, 'A king\'s inscription, the only signed one in the Keep: "You can\'t hold two seas at once. -Nereth"'],
        ],
      },
      '2,3,0': {
        name: 'Nereth, the Drowned King',
        // The boss keeps the mechanic: `noTide` pins the arena at whatever sea
        // was brought through the door, and Nereth's own phases pin it again.
        // THE THRONE ROOM IS THE 20x8 HALL S66 MEASURED, carved whole into
        // two Oracle screens of rock: the same floor, the same door column,
        // the same spawn. Measured from the route's door, a full-size 15x11
        // arena lost nine seeds in nine with the actor pinned in its corner,
        // and so did a full 30x11 one; this hall wins (S142).
        size: [2, 1],
        map: [
          '##############################',
          '##############################',
          '##############################',
          '##############################',
          '####..................########',
          '####.9..............9.########',
          '####..................########',
          '####..................########',
          '####.9..............9.########',
          '####..................########',
          '#######B######################',
        ],
        noTide: true,
        entities: [
          ['nereth', 12, 5],
        ],
        script: {
          // THE DOOR SHUTS BEHIND YOU, as it does on every Oracle boss. Left
          // open it was a one-tile pocket in the ring, and a knight Nereth
          // summons pinned Link in it until he died — the run lost every
          // entry timing tried while a rig with the door shut won eight in
          // nine (S142). It shuts once Link is clear of the doorway, is not
          // saved, and opens again when the King falls.
          onEnter(game, room) {
            if (game.progress.beaten[game.mapId]) return;
            const shut = () => {
              const p = game.player;
              if (!p || game.room !== room) return;
              if (p.y > 144) { game.frameLater(10, shut); return; }
              room.setTile(7, 10, 'dDoorBoss');
            };
            game.frameLater(10, shut);
          },
          onEvent(game, name) {
            if (name !== 'bossDead') return;
            game.room.setTile(7, 10, 'dDoorOpen');
            game.spawnPickup(208, 88, 'heartContainer', { grabDelay: 30 });
          },
        },
      },
    },
  });
}
