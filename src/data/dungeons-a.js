// Dungeons 1-4. See world/maps.js for the map contract, world/room.js for the
// room contract, game/game.js for the puzzle/script contract, and
// data/legends.js for the 'dungeon' legend (digits are tide tiles).
//
// Each dungeon's intended route is written above its registerMap call. Small
// Keys are always reachable before the door they open, and every room is
// reachable from the entrance — both proved mechanically rather than by eye.
//
// Locked doors sit inside rooms rather than on the seam between two, because
// the engine places an arriving player just past the room edge: a locked tile
// on a seam would drop them inside solid stone from the far side. THE ONE
// EXCEPTION IS A DUNGEON BUILT AT ORACLE SIZE (`cell: [15, 11]`), where a door
// is a gap in the wall ring and a key door is one door seen from both rooms:
// the tile either side of the seam opens together (`Game.openDoorAt`), so the
// far side is never stone.
//
// A PUSH BLOCK MOVES EXACTLY ONE TILE, EVER. `PushBlock` takes `once: true` by
// default and sets `moved` when its single slide lands, so a block placed two
// tiles from the switch it is meant to cover can never reach it. Every `block`
// in a `switches` puzzle is therefore seated orthogonally ADJACENT to its
// switch, with plain floor behind it for the player to push from. Where a room
// has fewer blocks than switches the player stands on the last one. This was
// wrong in every switch room in the game at one point, and each of those rooms
// rewards a Small Key, so it silently cost the dungeon a key.

import { registerMap } from '../world/maps.js';

export function installDungeonsA() {

  // --- Dungeon 1: Tidewash Grotto -----------------------------------------
  //
  // TIDE THEME: TWO LEVELS IN ONE ROOM. The grotto is a sluice — a well is
  // wadeable only when the sea is down, a drain is a hole in the floor until
  // the sea fills it, and the two are laid end to end with no dry footing
  // between them. No single setting of the conch crosses that. The Tidewright's
  // Anchor is the answer and this dungeon is where you are taught it: sink the
  // iron on the half that wants the water it has now, then sound the conch and
  // walk the other half.
  //
  // THE GATE PRIMITIVE, stated once because three rooms are built out of it.
  // Written along a row, from the side the player arrives on:
  //
  //     .  3 3 3 3  4 4 4  .  .
  //     ^  near band  far band  far side
  //   stand
  //
  //   `3` dWell   wadeable at LOW, deep above         -> LOW only
  //   `4` dDrain  an open pit at LOW, water above it  -> MID only
  //
  // At LOW the drains are a three-tile pit; at MID the wells are four tiles of
  // deep water; at HIGH everything drowns. The hop clears two whole tiles, so
  // neither band is in its range, and NOTHING BETWEEN THE TWO BANDS IS WALKABLE
  // AT BOTH LEVELS. That last clause is the whole gate, and it is the thing
  // that is easy to get wrong: the first cut of these rooms had one forgiving
  // tile of dSluice between the bands, and since dSluice is dry at LOW and
  // shallow at MID it was somewhere to stand and sound the conch — so all three
  // gates fell to two button presses and read as anchor rooms in the data.
  // check-anchor.mjs found that in its first run.
  //
  // The near band is FOUR wide, not three, because the held patch is five tiles
  // across: standing on the tile before it and biting two tiles in, the patch
  // covers the stand tile and the whole near band and stops exactly short of
  // the far one. Three would spill one frozen tile into the far band.
  //
  // Two orderings, and they are different puzzles to solve:
  //   wells near  (4,2 and 5,1) sound LOW, sink the iron in the well, conch to
  //               MID, and the drain ahead fills while your well stays down.
  //   drains near (2,2)         sound MID, sink the iron in the drain, conch to
  //               LOW, and the well ahead empties while your drain stays full.
  //
  // The other anchor room is the pair of gauges (4,3 and 1,1): a door that only
  // opens while one well reads drained and another reads drowned. They are five
  // tiles apart and the held patch is five across, so one of the two must be
  // the base and the other must be under the iron. `tools/check-anchor.mjs`
  // proves every one of these rooms is impassable with the conch alone and
  // passable with one anchor placement, which is the only way the claim is
  // worth anything.
  //
  // Intended route (24 rooms; the Anchor is room 12 of 24):
  //   3,7 mouth -> 3,6 the drinking floor (learn: conch to LOW and wade)
  //   -> 2,6 bone cell (a blank for the scrimshander) -> 3,5 hub
  //   -> 2,5 Dungeon Map -> 4,5 Chartstone
  //   -> 3,4 gallery [locked, key 1] -> 2,4 Crab Pit (key 1)
  //   -> 4,4 switches (key 2) -> 3,3 stair [locked, key 2]
  //   -> 2,3 Weeping Wall (Split Fang, the first charm placed by hand)
  //   -> 3,2 THE ANCHOR, and the boss door above it
  //   east: 4,2 [gate] -> 5,2 drowned chamber -> 5,1 [gate] -> 4,1 (key 3)
  //         -> 5,3 Clawcrab [locked, key 3] -> 4,3 [gauges] Piece of Heart
  //   west: 2,2 [gate] -> 1,2 -> 1,3 switches -> 1,1 [gauges]
  //         -> 2,1 Boss Key -> boss door -> 3,1 Gohmaraq
  //
  // Both wings end in a one-way return staircase, and that is load-bearing
  // rather than a courtesy: a gate crossed with the iron still sunk in it can
  // be walked back through, but an anchor RECALLED from the far side cannot be
  // re-sunk from that side — the tile it would have to bite is out of reach at
  // the level you would have to be at. The stairs are what turn that from a
  // soft lock into a shortcut.
  registerMap({
    id: 'd1',
    kind: 'dungeon',
    name: 'Tidewash Grotto',
    w: 8, h: 8, floors: 1,
    // AN ORACLE DUNGEON. Every room is 15x11 with a one-tile wall ring and the
    // camera scrolls inside it, the way every dungeon room in Seasons and Ages
    // is built; see `cellTiles` in world/room.js. Doors are one tile wide and
    // sit in the ring, and a key door is ONE door seen from two rooms — the
    // two `L`s either side of a seam open together (`Game.openDoorAt`).
    cell: [15, 11],
    legend: 'dungeonGrotto',
    music: 'dungeon',
    tint: 'cave',
    dungeon: {
      index: 1,
      item: 'anchor', itemLevel: 1,
      essence: 1,
      boss: 'gohmaraq',
      bossRoom: '0,3,1',
      startRoom: '3,7',
      entrance: { map: 'overworld', floor: 0, rx: 8, ry: 8, px: 64, py: 32 },
    },
    rooms: {
      // ---- the south half: no Anchor, and the conch is the only tool -------
      '0,3,7': {
        name: 'Grotto Mouth',
        map: [
          '#######.#######',
          '#.............#',
          '#.p.........p.#',
          '#.............#',
          '#...11...11...#',
          '#...11...11...#',
          '#.............#',
          '#..U.......U..#',
          '#.............#',
          '#.............#',
          '#######C#######',
        ],
        warps: [
          { x: 7, y: 10, to: { map: 'overworld', floor: 0, rx: 8, ry: 8, px: 64, py: 32, dir: 'down' } },
        ],
        readable: [
          [3, 7, 'Carved by the door: "The sea keeps this floor. Take it back."'],
        ],
      },
      '0,3,6': {
        name: 'The Drinking Floor',
        // The first lesson, and it is one press long: five rows of well from
        // wall to wall, too wide to hop and no way round. Sound the conch to
        // LOW and the wells are ankle deep. The west door opens straight into
        // the wells, on purpose — the Bone Cell is on the far side of the
        // same lesson.
        map: [
          '#######.#######',
          '#.............#',
          '#.............#',
          '#3333333333333#',
          '#3333333333333#',
          '.3333333333333#',
          '#3333333333333#',
          '#3333333333333#',
          '#.............#',
          '#............U#',
          '#######.#######',
        ],
        entities: [
          ['crab', 3, 1, { drops: 'good' }],
          ['crab', 11, 9, { drops: 'good' }],
          ['keese', 7, 2, { drops: 'good' }],
        ],
        readable: [
          [13, 9, 'A rusted plate: "Shut the sluice, and the grotto drinks."'],
        ],
      },
      '0,2,6': {
        name: 'Bone Cell',
        map: [
          '###############',
          '#.............#',
          '#.............#',
          '#....22222....#',
          '#....22222....#',
          '#....22222.....',
          '#....22222....#',
          '#....22222....#',
          '#.............#',
          '#.U...........#',
          '###############',
        ],
        entities: [
          ['pickup', 7, 5, { kind: 'blank' }],
          ['keese', 3, 2],
        ],
        readable: [
          [2, 9, 'Scratched deep: "The carver in Tidewatch wants bone, not gold."'],
        ],
      },
      '0,3,5': {
        name: 'Sunken Hall',
        map: [
          '#######.#######',
          '#..q.......q..#',
          '#.............#',
          '#.............#',
          '#...11...11...#',
          '....11...11....',
          '#...11...11...#',
          '#.............#',
          '#.............#',
          '#..q.......q..#',
          '#######.#######',
        ],
        entities: [
          ['zol', 7, 3],
          ['crab', 3, 7],
          ['switch', 2, 3],
          ['switch', 12, 3],
          ['block', 2, 4],
          ['block', 12, 4],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd1_035_puzzle',
          reward: {
            spawn: [['pickup', 7, 6, { kind: 'fairy' }]],
            say: 'A light comes up out of the water.',
          },
        },
      },
      '0,2,5': {
        name: 'Map Alcove',
        map: [
          '###############',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#......=......#',
          '#.....=.....22.',
          '#......=......#',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['pickup', 7, 5, { kind: 'dungeonMap' }],
          ['keese', 4, 3],
        ],
      },
      '0,4,5': {
        name: 'Chartstone Alcove',
        map: [
          '###############',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#.............#',
          '..............#',
          '#.............#',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['chest', 7, 5, { pickup: 'chartstone' }],
          ['keese', 10, 6],
        ],
      },
      '0,3,4': {
        name: 'Tide Gallery',
        // The dungeon's crossroads — every route in and out of the Crab Pit,
        // the Switch Room and the stair passes through it, so a real run meets
        // these two several times over, and they drop `good` for that reason
        // (FEEL-SPEC.md's health-economy entry). The north door is the first
        // key door in the game.
        map: [
          '#######L#######',
          '#.............#',
          '#.............#',
          '#..33.....33..#',
          '#..33.....33..#',
          '...............',
          '#..33.....33..#',
          '#..33.....33..#',
          '#.....111.....#',
          '#.....1.1.....#',
          '#######.#######',
        ],
        entities: [
          ['tektite', 7, 3, { drops: 'good' }],
          ['crab', 3, 5, { drops: 'good' }],
        ],
      },
      '0,2,4': {
        name: 'Crab Pit',
        map: [
          '###############',
          '#.............#',
          '#.............#',
          '#...1111111...#',
          '#...1111111...#',
          '#...1111111....',
          '#...1111111...#',
          '#.............#',
          '#.............#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['crab', 4, 2],
          ['crab', 10, 7],
          ['crab', 7, 4],
        ],
        puzzle: {
          enemies: true,
          flag: 'd1_crabpit',
          reward: {
            // A dropped pickup pops about five pixels up and comes to rest
            // straddling the tile ABOVE the one it was spawned on, so it is
            // spawned a row low. See docs/HANDOFF.md.
            spawn: [['pickup', 7, 6, { kind: 'key' }]],
            say: 'Something clatters onto the wet stone.',
          },
        },
      },
      '0,4,4': {
        name: 'Switch Room',
        map: [
          '###############',
          '#.............#',
          '#..=.=...=.=..#',
          '#..=.=...=.=..#',
          '#.............#',
          '..............#',
          '#.............#',
          '#...=.....=...#',
          '#.............#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['switch', 4, 3],
          ['switch', 10, 3],
          ['block', 4, 4],
          ['block', 10, 4],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd1_switches',
          // The heart alongside the key is a deliberate, GUARANTEED heal —
          // see FEEL-SPEC.md's health-economy entry.
          reward: {
            spawn: [
              ['pickup', 7, 7, { kind: 'key' }],
              ['pickup', 8, 7, { kind: 'heart' }],
            ],
            say: 'A catch releases somewhere below.',
          },
        },
      },
      '0,3,3': {
        name: 'The Locked Stair',
        // Both return staircases come up here, in the south-east corner: the
        // east wing's from the Two Gauges and the west wing's from the Boss
        // Key vault. They land on floor rather than on a stair, because both
        // are one-way — see the note at the head of this dungeon.
        map: [
          '#######L#######',
          '#.............#',
          '#..q.......q..#',
          '#.............#',
          '#.............#',
          '..............#',
          '#.............#',
          '#..q..,,,..q..#',
          '#.....,,,.....#',
          '#.............#',
          '#######L#######',
        ],
        entities: [
          ['zol', 4, 4, { drops: 'good' }],
          ['zol', 10, 4, { drops: 'good' }],
        ],
      },
      '0,2,3': {
        name: 'Weeping Wall',
        map: [
          '###############',
          '#.............#',
          '#....33333....#',
          '#....3...3....#',
          '#....3...3....#',
          '#....3...3.....',
          '#....3...3....#',
          '#....33333....#',
          '#.............#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['chest', 7, 4, { charm: 'splitFang' }],
          ['keese', 3, 2],
          ['zol', 11, 8],
        ],
        puzzle: {
          enemies: true,
          flag: 'd1_023_puzzle',
          reward: {
            spawn: [['pickup', 7, 9, { kind: 'rupee20' }]],
            say: 'Loose stone shifts, and something rolls out.',
          },
        },
      },

      '0,3,2': {
        name: 'The Sluicegate',
        // The Anchor, and the boss door above it: you see where you are going
        // the moment you have the thing that gets you there.
        map: [
          '#######B#######',
          '#.............#',
          '#.............#',
          '#..U.......U..#',
          '#.............#',
          '...............',
          '#....11111....#',
          '#....11111....#',
          '#....11111....#',
          '#.............#',
          '#######L#######',
        ],
        entities: [
          ['chest', 7, 3, { big: true, item: 'anchor', level: 1 }],
        ],
        readable: [
          [3, 3, 'The sluicegate plate: "Iron remembers. Sink it where you want the sea to stay."'],
        ],
      },

      // ---- the three gates. Each band runs wall to wall, so the only way
      // across is through it. See the gate primitive above.
      '0,4,2': {
        name: 'The Iron Pipe',
        // Wells near, drains far: sound LOW, stand on the last dry column,
        // sink the iron two tiles into the wells, conch to MID, walk.
        map: [
          '###############',
          '#....33334444.#',
          '#....33334444.#',
          '#....33334444.#',
          '#....33334444.#',
          '.....33334444..',
          '#....33334444.#',
          '#....33334444.#',
          '#....33334444.#',
          '#....33334444.#',
          '###############',
        ],
        anchorGate: { from: [0, 5], to: [14, 5] },
      },
      '0,5,2': {
        name: 'The Drowned Chamber',
        map: [
          '#######.#######',
          '#.............#',
          '#..444444444..#',
          '#..444444444..#',
          '#..444444444..#',
          '...444444444..#',
          '#..444444444..#',
          '#..444444444..#',
          '#.............#',
          '#.............#',
          '#######.#######',
        ],
        entities: [
          ['anglerfry', 5, 4],
          ['anglerfry', 10, 5],
          ['crab', 2, 9],
        ],
      },
      '0,5,1': {
        name: 'The Long Race',
        // Wells near again, but you come at them from the east and up the far
        // side of a row of blocks: the south door lets you in below the bands
        // and the race is walked back west along its middle.
        map: [
          '###############',
          '#.44443333....#',
          '#.44443333....#',
          '#.44443333....#',
          '#.44443333....#',
          '..44443333....#',
          '#.44443333....#',
          '#=========....#',
          '#.............#',
          '#.............#',
          '#######.#######',
        ],
        anchorGate: { from: [7, 9], to: [0, 5] },
      },
      '0,4,1': {
        name: 'The Keyvault',
        map: [
          '###############',
          '#.............#',
          '#..11.....11..#',
          '#..11.....11..#',
          '#.............#',
          '#..............',
          '#.............#',
          '#..11.....11..#',
          '#..11.....11..#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['chest', 7, 5, { pickup: 'key' }],
          ['keese', 11, 1],
        ],
      },
      '0,5,3': {
        name: 'Clawcrab Den',
        size: [2, 1],
        map: [
          '#######.######################',
          '#............................#',
          '#...2.....2.....2.....2......#',
          '#............................#',
          '#......U................U....#',
          'L............................#',
          '#......U................U....#',
          '#............................#',
          '#...2.....2.....2.....2......#',
          '#............................#',
          '##############################',
        ],
        entities: [
          ['clawcrab', 20, 5],
        ],
        puzzle: {
          enemies: true,
          flag: 'd1_clawcrab',
          reward: {
            spawn: [['pickup', 20, 6, { kind: 'heartPiece' }]],
            say: 'The claw stops moving. The way west is quiet.',
          },
        },
      },
      '0,4,3': {
        name: 'The Two Gauges',
        // A door that opens only while one well reads drained and the other
        // drowned. Eight tiles apart and the held patch is five across, so one
        // is the sea and the other is under the iron.
        map: [
          '###############',
          '#.............#',
          '#..3.......3..#',
          '#.............#',
          '#.............#',
          '#.............L',
          '#.............#',
          '#######D#######',
          '#.............#',
          '#.U.........//#',
          '###############',
        ],
        entities: [
          ['keese', 10, 4],
          ['pickup', 3, 8, { kind: 'heartPiece' }],
        ],
        warps: [
          { x: 12, y: 9, to: { map: 'd1', floor: 0, rx: 3, ry: 3, px: 192, py: 128, dir: 'down' } },
          { x: 13, y: 9, to: { map: 'd1', floor: 0, rx: 3, ry: 3, px: 192, py: 128, dir: 'down' } },
        ],
        readable: [
          [7, 6, 'Two marks over the door: one well empty, one well full.'],
        ],
        puzzle: {
          condition: (g, r) => g.tide.levelAt(3, 2, r) === 0 && g.tide.levelAt(11, 2, r) === 2,
          flag: 'd1_gauges_east',
          reward: {
            openDoors: [[7, 7]],
            say: 'Both marks read at once. The door gives.',
          },
        },
        anchorGauges: { a: [3, 2], aLevel: 0, b: [11, 2], bLevel: 2, door: [7, 7], from: [7, 5] },
      },

      '0,2,2': {
        name: 'The Long Sluice',
        // THE GRADUATION, and the one gate here that ONE iron cannot cross.
        // From the east: four drains, five wells, three drains. Hold the near
        // drains at MID and walk out onto the wells at LOW; then CALL THE IRON
        // BACK and sink it again in the wells you are standing in, and sound
        // MID for the far drains. The first two gates teach the throw; this
        // one teaches that the iron comes back and can be thrown again.
        // `placements: 2` makes check-anchor prove exactly that: not with the
        // conch, not with one throw, and with two.
        map: [
          '###############',
          '#444333334444.#',
          '#444333334444.#',
          '#444333334444.#',
          '#444333334444.#',
          '.444333334444..',
          '#444333334444.#',
          '#444333334444.#',
          '#444333334444.#',
          '#444333334444.#',
          '###############',
        ],
        anchorGate: { from: [14, 5], to: [0, 5], placements: 2 },
      },
      '0,1,2': {
        name: 'Cistern Turn',
        map: [
          '#######.#######',
          '#.............#',
          '#.............#',
          '#....22222....#',
          '#....22222....#',
          '#....22222.....',
          '#....22222....#',
          '#....22222....#',
          '#.............#',
          '#.............#',
          '#######.#######',
        ],
        entities: [
          ['zol', 3, 2],
          ['crab', 11, 8],
        ],
      },
      '0,1,3': {
        name: 'Weeping Cistern',
        // Three plates and two blocks: the blocks hold two, and the third is
        // where you stand.
        map: [
          '#######.#######',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#....11111....#',
          '#....11111....#',
          '#....11111....#',
          '#.............#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['crab', 7, 9],
          ['switch', 3, 2],
          ['switch', 11, 2],
          ['switch', 7, 8],
          ['block', 3, 3],
          ['block', 11, 3],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd1_013_puzzle',
          reward: {
            spawn: [['pickup', 7, 3, { kind: 'rupee20' }]],
            say: 'A catch lets go under the floor.',
          },
        },
      },
      '0,1,1': {
        name: 'The Drip Vault',
        map: [
          '###############',
          '#.............#',
          '#......3......#',
          '#.............#',
          '#.............#',
          '#.............D',
          '#.............#',
          '#.............#',
          '#......3......#',
          '#..pp.........#',
          '#######.#######',
        ],
        entities: [
          ['keese', 3, 3],
        ],
        readable: [
          [12, 4, 'Two marks beside the door: the upper well empty, the lower full.'],
        ],
        puzzle: {
          condition: (g, r) => g.tide.levelAt(7, 2, r) === 0 && g.tide.levelAt(7, 8, r) === 2,
          flag: 'd1_gauges_west',
          reward: {
            openDoors: [[14, 5]],
            say: 'Both marks read at once. The door gives.',
          },
        },
        anchorGauges: { a: [7, 2], aLevel: 0, b: [7, 8], bLevel: 2, door: [14, 5], from: [7, 9] },
      },
      '0,2,1': {
        name: 'Bosskey Vault',
        map: [
          '###############',
          '#..pp.........#',
          '#.............#',
          '#.............#',
          '#.............#',
          'D.............#',
          '#.............#',
          '#.........//..#',
          '#.............#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['chest', 7, 4, { pickup: 'bossKey' }],
          ['keese', 11, 8],
        ],
        warps: [
          { x: 10, y: 7, to: { map: 'd1', floor: 0, rx: 3, ry: 3, px: 192, py: 128, dir: 'down' } },
          { x: 11, y: 7, to: { map: 'd1', floor: 0, rx: 3, ry: 3, px: 192, py: 128, dir: 'down' } },
        ],
      },
      '0,3,1': {
        name: 'Gohmaraq, the Tidewash Claw',
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
          ['gohmaraq', 7, 3],
        ],
        script: {
          onEvent(game, name) {
            if (name === 'bossDead') game.spawnPickup(112, 120, 'heartContainer', { grabDelay: 30 });
          },
        },
      },
    },
  });

  registerMap({
    id: 'd2',
    kind: 'dungeon',
    name: 'Coral Spire',
    w: 8, h: 8, floors: 2,
    // AN ORACLE DUNGEON (S137), built like the Grotto: 15x11 rooms with a
    // wall ring, a scrolling camera, one-tile doors, and key, shutter and boss
    // doors in the ring between two rooms. The kit is the Explorer's Crypt's.
    cell: [15, 11],
    legend: 'dungeonCoral',
    music: 'dungeon2',
    tint: 'cave',
    dungeon: {
      index: 2,
      item: 'lens', itemLevel: 1,
      essence: 2,
      boss: 'anemos',
      bossRoom: '1,3,1',
      startRoom: '3,7',
      entrance: { map: 'overworld', floor: 0, rx: 10, ry: 5, px: 64, py: 32 },
    },
    rooms: {
      // ---- floor 0: the flooded base. The conch is the only tool. ---------
      '0,3,7': {
        name: 'Spire Mouth',
        map: [
          '#######.#######',
          '#.............#',
          '#.p.........p.#',
          '#.............#',
          '#...33...33...#',
          '#...33...33...#',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#.............#',
          '######(C)######',
        ],
        warps: [
          { x: 7, y: 10, to: { map: 'overworld', floor: 0, rx: 10, ry: 5, px: 64, py: 32, dir: 'down' } },
        ],
        readable: [
          [2, 7, 'Coral script over the door: "What rises, carries.\nWhat falls, reveals. Look before you fall."'],
        ],
      },
      '0,3,6': {
        name: 'Coral Landing',
        // Two columns of well split the landing in three, and the west lane —
        // the one with the Bone Cell's door — is only reached across them at
        // LOW.
        map: [
          '#######.#######',
          '#..q.......q..#',
          '#..3.......3..#',
          '#..3.......3..#',
          '#..3.......3..#',
          '...3.......3..#',
          '#..3.......3..#',
          '#..3.......3..#',
          '#..3.......3..#',
          '#..q.......q..#',
          '#######.#######',
        ],
        entities: [
          ['urchin', 7, 4],
          ['crab', 9, 6],
        ],
        puzzle: {
          enemies: true,
          flag: 'd2_036_puzzle',
          reward: {
            spawn: [['pickup', 7, 6, { kind: 'fairy' }]],
            say: 'A light comes up out of the water.',
          },
        },
      },
      '0,2,6': {
        name: 'Bone Cell',
        // D1's primitive in D2 (S90): drains near, wells far, and the blank
        // on the dry sill at the far end. Sound MID, sink the iron in the
        // drains beside you, conch to LOW, and the wells go down.
        map: [
          '###############',
          '#...33334444..#',
          '#...33334444..#',
          '#...33334444..#',
          '#...33334444..#',
          '#...33334444...',
          '#...33334444..#',
          '#...33334444..#',
          '#...33334444..#',
          '#...33334444..#',
          '###############',
        ],
        entities: [
          ['pickup', 2, 5, { kind: 'blank' }],
          ['keese', 12, 8],
        ],
        readable: [
          [13, 1, 'Scratched into the shell: "The carver in Tidewatch\nwants bone, not gold."'],
        ],
        anchorGate: { from: [14, 5], to: [2, 5] },
      },
      '0,3,5': {
        name: 'Tide Gallery',
        map: [
          '#######.#######',
          '#.q.........q.#',
          '#...1111111...#',
          '#...1111111...#',
          '#...1111111...#',
          '....1111111....',
          '#...1111111...#',
          '#...1111111...#',
          '#...1111111...#',
          '#.q.........q.#',
          '#######.#######',
        ],
        entities: [
          ['jellyfish', 7, 5],
          ['crab', 2, 7],
        ],
      },
      '0,2,5': {
        name: 'Map Nook',
        map: [
          '###############',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#.............#',
          '#..........22..',
          '#.............#',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['pickup', 6, 5, { kind: 'dungeonMap' }],
          ['urchin', 10, 3],
        ],
      },
      '0,4,5': {
        name: 'Torch Cell',
        // The floor-0 key's twin: three torches, and a room you find early,
        // cannot answer without fire, and come back to.
        map: [
          '###############',
          '#.............#',
          '#.............#',
          '#....22222....#',
          '#....22222....#',
          '.....22222....#',
          '#....22222....#',
          '#....22222....#',
          '#.............#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['torch', 2, 1],
          ['torch', 12, 1],
          ['torch', 7, 9],
          ['keese', 9, 3],
        ],
        puzzle: {
          torches: 'all',
          flag: 'd2_torches',
          reward: {
            spawn: [['pickup', 7, 6, { kind: 'key' }]],
            say: 'The three flames answer each other.',
          },
        },
      },
      '0,3,4': {
        name: 'Rising Chamber',
        // The switch pair opens the shutter in the north wall and spawns the
        // floor-0 Small Key — the one that answers the Stair Coil's door in
        // this room's west wall. Each block sits beside its plate with floor
        // behind to push from. The barnacle is a fixed hazard, never fought.
        map: [
          '#######D#######',
          '#.............#',
          '#.............#',
          '#.............#',
          '#..444444444..#',
          'L..444444444...',
          '#..444444444..#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#######.#######',
        ],
        entities: [
          ['switch', 1, 8],
          ['block', 2, 8],
          ['switch', 13, 8],
          ['block', 12, 8],
          ['barnacle', 7, 8],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd2_034_puzzle',
          reward: {
            openDoors: [[7, 0]],
            spawn: [['pickup', 7, 3, { kind: 'key' }]],
            say: 'Water drains out of a niche, and the door lifts.\nSomething small rattles loose with it.',
          },
        },
        readable: [
          [12, 2, 'A rusted plate: "The floor of this room is a door.\nShut the sea out and it is only a hole."'],
        ],
      },
      '0,4,4': {
        name: 'Chartstone Alcove',
        map: [
          '###############',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#.............#',
          '..............#',
          '#.............#',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['chest', 7, 5, { pickup: 'chartstone' }],
          ['keese', 10, 7],
        ],
      },
      '0,3,3': {
        name: 'Cistern Cell',
        map: [
          '###############',
          '#.............#',
          '#.............#',
          '#....22222....#',
          '#....22222....#',
          '#....22222....#',
          '#....22222....#',
          '#....22222....#',
          '#.............#',
          '#.............#',
          '#######D#######',
        ],
        entities: [
          ['chest', 2, 2, { charm: 'barnacleSkin' }],
          ['jellyfish', 7, 5],
        ],
      },
      '0,2,4': {
        name: 'Stair Coil',
        map: [
          '###############',
          '#.............#',
          '#.............#',
          '#../..........#',
          '#.............#',
          '#.............L',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.............#',
          '###############',
        ],
        warps: [
          { x: 3, y: 3, to: { map: 'd2', floor: 1, rx: 2, ry: 4, px: 176, py: 48 } },
        ],
        entities: [
          ['crab', 10, 7],
        ],
      },

      // ---- floor 1: the spire. ----------------------------------------------
      '1,2,4': {
        name: 'Upper Landing',
        map: [
          '###############',
          '#.............#',
          '#.........../.#',
          '#.............#',
          '#.............#',
          '#..............',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#######.#######',
        ],
        warps: [
          { x: 12, y: 2, to: { map: 'd2', floor: 0, rx: 2, ry: 4, px: 48, py: 64 } },
        ],
        entities: [
          ['keese', 5, 6],
        ],
      },
      '1,2,5': {
        name: 'Anemone Cell',
        map: [
          '#######.#######',
          '#.............#',
          '#.............#',
          '#....3333.....#',
          '#....3333.....#',
          '#....3333.....#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['urchin', 3, 2],
          ['pickup', 11, 5, { kind: 'fairy' }],
        ],
      },
      '1,3,4': {
        name: 'Spire Concourse',
        map: [
          '###############',
          '#..q.......q..#',
          '#.............#',
          '#.............#',
          '#.............#',
          '...............',
          '#.............#',
          '#.............#',
          '#.............#',
          '#..q.......q..#',
          '###############',
        ],
        entities: [
          ['crab', 3, 3],
          ['keese', 11, 7],
        ],
      },
      '1,4,4': {
        name: 'Sealed Cell',
        map: [
          '#######.#######',
          '#.............#',
          '#.............#',
          '#....3333.....#',
          '#....3333.....#',
          '.....3333.....#',
          '#....3333.....#',
          '#....3333.....#',
          '#.U.........U.#',
          '#.............#',
          '#######.#######',
        ],
        entities: [
          ['chest', 2, 2, { big: true, item: 'lens', level: 1 }],
          ['urchin', 11, 2],
        ],
        readable: [
          [12, 8, 'A pane of green glass set in the wall, and behind it\nthe room stands a hand deeper in water than it is.'],
        ],
      },
      '1,4,5': {
        name: 'Glass Cell',
        // THE LENS'S OTHER HALF, next door to the chest it comes out of. Three
        // keese live here at HIGH and only at HIGH, and the room pins its sea
        // at LOW and refuses the conch — so on the conch alone the room is
        // empty and the Piece of Heart never comes out of the floor. Held up,
        // the Lens draws what lives at the other tide as a ghost and lets a
        // sword connect with it (`Game.updatePhaseShift`); it still cannot
        // bite you. Optional, so the Lens is never a gate: the room is a room
        // you walk into and out of either way. tools/check-lens.mjs proves
        // both halves in the engine (`lensHunt`).
        map: [
          '#######.#######',
          '#.............#',
          '#..=.......=..#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#..=.......=..#',
          '#.U.........U.#',
          '###############',
        ],
        tideForce: 0,
        lensHunt: true,
        entities: [
          ['keese', 4, 4, { phase: 2 }],
          ['keese', 10, 5, { phase: 2 }],
          ['keese', 7, 7, { phase: 2 }],
        ],
        puzzle: {
          enemies: true,
          flag: 'd2_glass_puzzle',
          reward: {
            spawn: [['pickup', 7, 5, { kind: 'heartPiece' }]],
            say: 'The last wingbeat stops, and something\nsettles out of the salt.',
          },
        },
        readable: [
          [2, 9, 'Wingbeats in an empty room, and the sea\nwill not come in to show you what beats them.'],
          [12, 9, 'What lives at the other tide, the glass\nshows. What the glass shows, a blade finds.'],
        ],
      },
      '1,4,3': {
        name: 'The First Fork',
        // FORK 1 — the teaching one. Two shafts up into Reefguard Hall, one
        // one-way ledge down into each pocket, and from the shelf both shafts
        // are the same dry hole. The room pins the tide at LOW and refuses
        // the conch; each pocket's valve is the only thing that moves the
        // water, one step. The west shaft is a drain — it fills at MID — and
        // the east is a pit at any sea. Each pocket's stair is the walk back.
        // tools/check-lens.mjs proves this room in both directions.
        map: [
          '###.#######.###',
          '###4#######O###',
          '###4#######O###',
          '###4#######O###',
          '###.#######.###',
          '##/.#######./##',
          '##..<.....>..##',
          '##.##.....##.##',
          '#####.....#####',
          '#####.....#####',
          '#######.#######',
        ],
        tideForce: 0,
        entities: [
          ['valve', 2, 7],
          ['valve', 12, 7],
        ],
        warps: [
          { x: 2, y: 5, to: { map: 'd2', floor: 1, rx: 2, ry: 4, px: 112, py: 96, dir: 'down' } },
          { x: 12, y: 5, to: { map: 'd2', floor: 1, rx: 2, ry: 4, px: 112, py: 96, dir: 'down' } },
        ],
        script: {
          onEvent(game, name) {
            if (name === 'valve') game.forceTideStep();
          },
        },
        readable: [
          [7, 8, 'Cut into the shelf: "Two throats, one drinks.\nThe dry one keeps its own counsel."'],
        ],
        lensRoom: {
          pin: 0, reveals: 1, decide: [7, 6],
          branches: [
            { name: 'the west shaft', land: [3, 6], probe: [3, 2], onward: [3, 0], escape: [2, 5] },
            { name: 'the east shaft', land: [11, 6], probe: [11, 2], onward: [11, 0], escape: [12, 5] },
          ],
        },
      },
      '1,4,2': {
        name: 'Reefguard Hall',
        // Two rooms long: the Reefguard is the dungeon's set piece and wants
        // room to circle in. Both of the First Fork's shafts come up into its
        // south wall, and its far end's south door is the Bomb Vault's.
        size: [2, 1],
        map: [
          '##############################',
          '#.............#..............#',
          '#.U.......U...#..............#',
          '#.............#....3333......#',
          '#............................#',
          '.............................#',
          '#............................#',
          '#.............#....3333......#',
          '#.U.......U...#..............#',
          '#.............#..............#',
          '###.#######.##########.#######',
        ],
        entities: [
          ['reefguard', 12, 5],
          ['urchin', 22, 5],
        ],
        puzzle: {
          enemies: true,
          flag: 'd2_reefguard',
          reward: {
            spawn: [['pickup', 7, 4, { kind: 'key' }]],
            say: 'The guard sinks back into the coral, and something\nfalls out of it.',
          },
        },
      },
      '1,5,3': {
        name: 'Bomb Vault',
        map: [
          '#######.#######',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#######.#######',
        ],
        entities: [
          ['chest', 7, 4, { big: true, item: 'bombs', level: 1 }],
        ],
      },
      '1,5,4': {
        name: 'Whelk Cell',
        map: [
          '#######.#######',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.....pp...../#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['keese', 10, 3, { phase: 2 }],
          ['pickup', 4, 4, { kind: 'rupee20' }],
          ['pickup', 7, 5, { kind: 'heartPiece' }],
        ],
        warps: [
          { x: 13, y: 8, to: { map: 'd2', floor: 1, rx: 5, ry: 5, px: 48, py: 128, dir: 'down' } },
        ],
      },
      '1,5,5': {
        name: 'The Whelk Hollow',
        // The Spire's Reefseed grove (S108), optional: a cache behind a kelp
        // snarl on open water, and the one stake that reaches it grows from
        // the far side of a coral bar that only goes under at HIGH.
        map: [
          '###############',
          '#........##...#',
          '#........##...#',
          '#........0#...#',
          '#........W#...#',
          '#.......5Wk...#',
          '#........W#...#',
          '#........0#...#',
          '#........##...#',
          '#./......##...#',
          '###############',
        ],
        reefseedRoom: {
          optional: true,
          entry: [2, 9],
          stakes: [
            { at: [9, 5], from: [7, 5], face: 'right', sea: 2 },
          ],
          snarl: [10, 5], cutFrom: [9, 5],
        },
        entities: [
          ['chest', 12, 3, { rupees: 50 }],
          ['keese', 3, 3],
        ],
        readable: [
          [6, 9, 'Scratched into the coral: "The bar goes under when the sea comes up. Nothing else here ever moves."'],
        ],
        warps: [
          { x: 2, y: 9, to: { map: 'd2', floor: 1, rx: 5, ry: 4, px: 192, py: 112, dir: 'up' } },
        ],
      },
      '1,3,2': {
        name: 'Spire Ascent',
        // Two rooms tall. The boss door is in its north wall, Reefguard Hall
        // through its east, and the last key door in its west, low down.
        size: [1, 2],
        map: [
          '#######B#######',
          '#.............#',
          '#..3.......3..#',
          '#..3.......3..#',
          '#.............#',
          '#..............',
          '#.............#',
          '#..q.......q..#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#....22222....#',
          '#....22222....#',
          '#....22222....#',
          '#....22222....#',
          'L....22222....#',
          '#....22222....#',
          '#....22222....#',
          '#.............#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['jellyfish', 7, 14],
          ['crab', 10, 19],
          ['keese', 4, 6],
        ],
      },
      '1,2,3': {
        name: 'Drowned Cell',
        map: [
          '#######.#######',
          '#.............#',
          '#....11111....#',
          '#....11111....#',
          '#....11111....#',
          '#....11111....L',
          '#....11111....#',
          '#....11111....#',
          '#.............#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['urchin', 3, 8],
          ['pickup', 12, 1, { kind: 'rupee20' }],
        ],
      },
      '1,2,2': {
        name: 'The Sounding Fork',
        // FORK 2 — three throats up into the Boss Key cell, pinned at LOW,
        // and at LOW all three are the same dry hole. At MID the west one is
        // a drain you can wade, the middle is a pit at any sea, and the east
        // is a sump that goes over your head. One wades. One waits. One keeps
        // you. Each pocket's stair is the walk back.
        map: [
          '###.###.###.###',
          '###4###O###0###',
          '###4###O###0###',
          '###4###O###0###',
          '###./##./##./##',
          '###..##..##..##',
          '###"###"###"###',
          '#.............#',
          '#.............#',
          '#.............#',
          '#######.#######',
        ],
        tideForce: 0,
        entities: [
          ['valve', 4, 5],
          ['valve', 8, 5],
          ['valve', 12, 5],
        ],
        warps: [
          { x: 4, y: 4, to: { map: 'd2', floor: 1, rx: 3, ry: 3, px: 112, py: 304, dir: 'down' } },
          { x: 8, y: 4, to: { map: 'd2', floor: 1, rx: 3, ry: 3, px: 112, py: 304, dir: 'down' } },
          { x: 12, y: 4, to: { map: 'd2', floor: 1, rx: 3, ry: 3, px: 112, py: 304, dir: 'down' } },
        ],
        script: {
          onEvent(game, name) {
            if (name === 'valve') game.forceTideStep();
          },
        },
        readable: [
          [7, 8, 'Three marks on the shelf, and beneath them:\n"One wades. One waits. One keeps you."'],
        ],
        lensRoom: {
          pin: 0, reveals: 1, decide: [7, 7],
          branches: [
            { name: 'the west throat', land: [3, 5], probe: [3, 2], onward: [3, 0], escape: [4, 4] },
            { name: 'the middle throat', land: [7, 5], probe: [7, 2], onward: [7, 0], escape: [8, 4] },
            { name: 'the east throat', land: [11, 5], probe: [11, 2], onward: [11, 0], escape: [12, 4] },
          ],
        },
      },
      '1,2,1': {
        name: 'Bosskey Cell',
        map: [
          '###############',
          '#.............#',
          '#.............#',
          '#....22222....#',
          '#....22222....#',
          '#....22222....#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.............#',
          '###.###.###.###',
        ],
        entities: [
          ['chest', 7, 2, { pickup: 'bossKey' }],
          ['jellyfish', 6, 4],
        ],
      },
      '1,3,1': {
        name: 'Anemos, the Crowned Column',
        map: [
          '###############',
          '#.............#',
          '#.............#',
          '#....22222....#',
          '#....22222....#',
          '#....22222....#',
          '#....22222....#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#######B#######',
        ],
        noTide: true,
        entities: [
          ['anemos', 7, 3],
        ],
        script: {
          onEvent(game, name) {
            if (name === 'bossDead') game.spawnPickup(112, 120, 'heartContainer', { grabDelay: 30 });
          },
        },
      },
    },
  });

  registerMap({
    id: 'd3',
    kind: 'dungeon',
    name: 'Bogwater Sanctum',
    w: 8, h: 8, floors: 1,
    // AN ORACLE DUNGEON (S139), built like the Grotto and the Spire: 15x11
    // rooms with a wall ring, a scrolling camera, one-tile doors, and key,
    // shutter and boss doors in the ring between two rooms. The kit is the
    // Poison Moth's Lair's (`b*` picks in tools/rip-dungeon-themes.py).
    //
    // THE SANCTUM'S SENTENCE: the water has two floors. Both torrent rooms
    // run TOWARD the Cistern Floor, so each wing is walked out along the
    // seafloor and ridden home on the surface. The Kelp Locks ask for both
    // layers in one crossing — ride the current as far as it carries, then
    // sink for the stretch it will not.
    //
    // The route (22 rooms, one floor, the Cleats at room 11):
    //   3,7 mouth -> 3,6 Nave (fairy) -> 4,6 charm -> 3,5 Hub -> 2,5 map
    //   -> 4,5 Sluice Cell (Small Key 1) -> 3,4 Weir: 2,4 Chartstone,
    //   4,4 Piece of Heart, and the key door north -> 3,3 THE CLEATS.
    //   West wing: 2,3 Undertow (floor out) -> 1,3 Vestry (Small Key 2)
    //   -> 1,2 Drain Gallery (key door; Boss Key) -> 2,2 Bogmaw -> 2,1 Piece.
    //   East wing: 4,3 Drain (floor out) -> 5,3 Eel Hall -> 5,4 Eel Vault
    //   (Small Key 3) -> the Hall's key door north -> 4,2 Kelp Locks (ride,
    //   then sink) -> 3,2 Lock Gallery: its plate opens the shortcut west to
    //   Bogmaw Hall, and the boss door is in its north wall -> 3,1 Gloomtide.
    cell: [15, 11],
    legend: 'dungeonBog',
    music: 'dungeon',
    tint: 'cave',
    dungeon: {
      index: 3,
      item: 'cleats', itemLevel: 1,
      essence: 3,
      boss: 'gloomtide',
      bossRoom: '0,3,1',
      startRoom: '3,7',
      entrance: { map: 'overworld', floor: 0, rx: 1, ry: 8, px: 64, py: 32 },
    },
    rooms: {
      '0,3,7': {
        name: 'Sanctum Mouth',
        // The Lair's own entrance hall: gold eye statues down both sides and
        // the lit step between two green pillars in the south wall.
        map: [
          '#######.#######',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#...22...22...#',
          '#...22...22...#',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#.............#',
          '######(C)######',
        ],
        warps: [
          { x: 7, y: 10, to: { map: 'overworld', floor: 0, rx: 1, ry: 8, px: 64, py: 32, dir: 'down' } },
        ],
        readable: [
          [2, 7, 'Bog script: "The water has two floors.\nOnly one of them drowns you."'],
        ],
      },
      '0,3,6': {
        name: 'Drowned Nave',
        map: [
          '#######.#######',
          '#.............#',
          '#.............#',
          '#...1111111...#',
          '#...1111111...#',
          '#...1111111....',
          '#...1111111...#',
          '#...1111111...#',
          '#.............#',
          '#.............#',
          '#######.#######',
        ],
        entities: [
          ['jellyfish', 7, 5],
          ['crab', 3, 8],
        ],
        puzzle: {
          enemies: true,
          flag: 'd3_nave',
          reward: {
            spawn: [['pickup', 7, 1, { kind: 'fairy' }]],
            say: 'The bog lets something go.',
          },
        },
      },
      '0,4,6': {
        name: 'Bell Cell',
        map: [
          '###############',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#....,,,,,....#',
          '.....,,,,,....#',
          '#....,,,,,....#',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '###############',
        ],
        entities: [
          // A LOW charm, and the first one in the game that could be placed.
          // The LOW case opens at two essences and the player walked out of the
          // Coral Spire with the second, so this dungeon is the first place a
          // LOW charm is a reward rather than a locked box. It is also the beat
          // that tells them the case exists.
          ['chest', 7, 5, { charm: 'wreckersEye' }],
          ['pickup', 12, 5, { kind: 'blank' }],
          ['keese', 10, 3],
        ],
      },
      '0,3,5': {
        name: 'Bog Hub',
        map: [
          '#######.#######',
          '#.............#',
          '#.111.....111.#',
          '#.111.....111.#',
          '#.111.....111.#',
          '...............',
          '#.111.....111.#',
          '#.111.....111.#',
          '#.111.....111.#',
          '#.............#',
          '#######.#######',
        ],
        entities: [
          ['jellyfish', 3, 3],
          ['urchin', 7, 2],
        ],
      },
      '0,2,5': {
        name: 'Map Cell',
        map: [
          '###############',
          '#.............#',
          '#.p.........p.#',
          '#.............#',
          '#.............#',
          '#..............',
          '#.............#',
          '#.............#',
          '#.p.........p.#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['pickup', 7, 5, { kind: 'dungeonMap' }],
          ['urchin', 10, 3],
        ],
      },
      '0,4,5': {
        name: 'Sluice Cell',
        map: [
          '###############',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.............#',
          '..............#',
          '#.............#',
          '#.............#',
          '#....,,,,,....#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['switch', 3, 2],
          ['switch', 11, 2],
          ['block', 3, 3],
          ['block', 11, 3],
          ['keese', 7, 6],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd3_sluice',
          reward: {
            spawn: [['pickup', 7, 2, { kind: 'key' }]],
            say: 'A grate lifts somewhere below the floor.',
          },
        },
      },
      '0,3,4': {
        name: 'The Weir',
        // Its key door is in the north wall and gates the Cistern Floor, not
        // the room: the Chartstone and the Piece of Heart either side of it
        // are walked with the key still in hand.
        map: [
          '#######L#######',
          '#.............#',
          '#..U.......U..#',
          '#.............#',
          '#.............#',
          '...............',
          '#.............#',
          '#.11111111111.#',
          '#.............#',
          '#.............#',
          '#######.#######',
        ],
        entities: [
          ['crab', 3, 6],
          ['urchin', 11, 4],
        ],
      },
      '0,2,4': {
        name: 'Silt Cell',
        map: [
          '###############',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#.............#',
          '#..............',
          '#....3333.....#',
          '#....3333.....#',
          '#.U.........U.#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['chest', 7, 3, { pickup: 'chartstone' }],
          ['urchin', 11, 6],
        ],
      },
      '0,4,4': {
        name: 'Reed Cell',
        map: [
          '###############',
          '#.............#',
          '#...3333333...#',
          '#...3333333...#',
          '#...3333333...#',
          '....3333333...#',
          '#...3333333...#',
          '#.............#',
          '#.............#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['jellyfish', 7, 4],
          ['crab', 11, 8],
        ],
        puzzle: {
          enemies: true,
          flag: 'd3_reed',
          reward: {
            spawn: [['pickup', 7, 8, { kind: 'heartPiece' }]],
            say: 'The reeds part over something round and bright.',
          },
        },
      },
      '0,5,4': {
        name: 'Eel Vault',
        map: [
          '#######.#######',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#....,,,,,....#',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '###############',
        ],
        entities: [
          // A CRAB, NOT A BARNACLE, AND THE KEY IS WHY. This room's Small Key
          // is paid out by `puzzle: { enemies: true }`, which holds until
          // nothing in the room is alive. A barnacle is `hp: 999` with
          // `shield: 'all'`: a turret bolted to the wall that the sword cannot
          // touch and no item in the player's hands at this point can answer.
          // So the key never dropped and half the dungeon sat behind it, while
          // `walk-dungeons.mjs` counted the key as earned because it reads the
          // room's reward, not whether the room can be cleared.
          //
          // Barnacles stay everywhere they are scenery-with-a-hitbox — the Eel
          // Hall still fields two. They may not stand in a room that has to be
          // emptied.
          ['crab', 7, 5],
          ['keese', 3, 4],
        ],
        puzzle: {
          enemies: true,
          flag: 'd3_eel',
          reward: {
            spawn: [['pickup', 7, 3, { kind: 'key' }]],
            say: 'Something drops out of the weed.',
          },
        },
      },
      '0,3,3': {
        name: 'The Cistern Floor',
        // The item room. The chest stands on the only dry island in it, so the
        // first thing the Cleats are used for is getting off the rock you
        // opened them on.
        //
        // THE CAUSEWAY IS NOT DECORATION AND IT IS NOT A SOFTENING. Every tile
        // ringing the island is `dWaterD` — flat deep water at every tide — so
        // without it there is NO WAY ONTO THE ISLAND without the Cleats that
        // are standing on it. `walk-dungeons.mjs` cannot see that: it floods
        // D3 with swim granted to every room, including this one. The
        // causeway's `dBasin` is dry at LOW, damp at MID and shallow at HIGH —
        // walkable at all three, because an item room has to work at whichever
        // sea arrives. It reaches only the door you came in by: both ways
        // ONWARD — west to the Undertow, east to the Bogwater Drain — are deep
        // water.
        map: [
          '###############',
          '#WWWWWWWWWWWWW#',
          '#WWWWWWWWWWWWW#',
          '#WWWW.....WWWW#',
          '#WWWW.....WWWW#',
          '.WWWW.....WWWW.',
          '#WWWW.....WWWW#',
          '#WWWWWW2WWWWWW#',
          '#WWWWWW2WWWWWW#',
          '#WWWWWW2WWWWWW#',
          '#######L#######',
        ],
        entities: [
          ['chest', 7, 4, { big: true, item: 'cleats', level: 1 }],
        ],
      },
      '0,2,3': {
        name: 'The Undertow',
        // Torrent room 1. The whole floor of the room runs east, back toward
        // the island you came from; a bank down each side is where the doors
        // are. On the surface the current carries you home. Out, it is a
        // walk along the bottom.
        map: [
          '###############',
          '#.TTTTTTTTTTT.#',
          '#.TTTTTTTTTTT.#',
          '#.TTTTTTTTTTT.#',
          '#.TTTTTTTTTTT.#',
          '..TTTTTTTTTTT..',
          '#.TTTTTTTTTTT.#',
          '#.TTTTTTTTTTT.#',
          '#.TTTTTTTTTTT.#',
          '#.TTTTTTTTTTT.#',
          '###############',
        ],
        cleatRoom: { from: [14, 5], to: [0, 5] },
        readable: [],
      },
      '0,1,3': {
        name: 'Sunken Vestry',
        // Two blocks, two plates, and each block is pushed sideways toward the
        // middle of the room rather than up, the way the Sluice Cell's are.
        map: [
          '#######L#######',
          '#.............#',
          '#.............#',
          '#.............#',
          '#....11111....#',
          '#....11111.....',
          '#....11111....#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#######.#######',
        ],
        entities: [
          ['switch', 4, 2],
          ['switch', 10, 2],
          ['block', 3, 2],
          ['block', 11, 2],
          ['urchin', 7, 8],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd3_vestry',
          reward: {
            spawn: [['pickup', 7, 2, { kind: 'key' }]],
            say: 'Stone settles into stone.',
          },
        },
      },
      '0,1,4': {
        name: 'Silt Vault',
        map: [
          '#######.#######',
          '#.............#',
          '#.............#',
          '#....33333....#',
          '#....33333....#',
          '#.............#',
          '#.p.........p.#',
          '#.............#',
          '#.............#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['pickup', 7, 7, { kind: 'rupee20' }],
          ['keese', 10, 2],
        ],
      },
      '0,2,2': {
        name: 'Bogmaw Hall',
        // The east door is a shutter, and it is the Lock Gallery's to open:
        // the plate beside it on the far side lets a player who came the long
        // way round through the Kelp Locks walk back this way. Without it this
        // hall was a way to the boss door that skipped the Eel Hall, the Eel
        // Vault's key and the Locks — the whole east wing.
        map: [
          '#######.#######',
          '#.............#',
          '#.............#',
          '#...,,,,,,,...#',
          '#.............#',
          '..............D',
          '#.............#',
          '#...,,,,,,,...#',
          '#.............#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['bogmaw', 7, 5],
        ],
        puzzle: {
          enemies: true,
          flag: 'd3_bogmaw',
          reward: { say: 'The bogmaw sinks back into the silt.' },
        },
      },
      '0,1,2': {
        name: 'Drain Gallery',
        // The Boss Key stands inside a ring of wells — wading water at LOW and
        // over your head above it. The ring is open to the south.
        map: [
          '###############',
          '#.............#',
          '#.............#',
          '#...3333333...#',
          '#...3.....3...#',
          '#...3.....3....',
          '#...3.....3...#',
          '#...33...33...#',
          '#.............#',
          '#.............#',
          '#######L#######',
        ],
        entities: [
          ['chest', 7, 4, { pickup: 'bossKey' }],
          // A KEESE, NOT A JELLYFISH. A jellyfish is kept on wet tiles by
          // `terrainOk`, and at LOW there are none here to be on: it was
          // scenery with a hitbox. See tools/check-placement.mjs.
          ['keese', 2, 8],
        ],
      },
      '0,2,1': {
        name: 'Vestry Roof',
        map: [
          '###############',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#....,,,,,....#',
          '#....,,,,,....#',
          '#....,,,,,....#',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#######.#######',
        ],
        entities: [
          ['pickup', 7, 5, { kind: 'heartPiece' }],
          ['keese', 10, 3],
        ],
      },
      '0,4,3': {
        name: 'The Bogwater Drain',
        // Torrent room 2, and the current runs the other way — a player who
        // learned "swim east" in the Undertow learns nothing here. Two shelves
        // stand out of the channel, top and bottom, and neither touches a
        // bank: somewhere to come up for air and a fairy, not a way across.
        map: [
          '###############',
          '#.ttt.....ttt.#',
          '#.ttt..p..ttt.#',
          '#.ttttttttttt.#',
          '#.ttttttttttt.#',
          '..ttttttttttt..',
          '#.ttttttttttt.#',
          '#.ttttttttttt.#',
          '#.ttt.....ttt.#',
          '#.ttt..U..ttt.#',
          '###############',
        ],
        cleatRoom: { from: [0, 5], to: [14, 5] },
        entities: [
          ['pickup', 7, 8, { kind: 'fairy' }],
        ],
      },
      '0,5,3': {
        name: 'Eel Hall',
        // 3x1, AND D3'S SET PIECE — the room the dungeon's whole idea is said
        // in one sight line. Its western screen is a plain hall with three
        // doors: the Drain behind you, the Eel Vault below and the key door
        // north to the Kelp Locks.
        //
        // THE NAVE. Down the middle of the eastern thirty tiles runs a torrent
        // flowing WEST, back the way you came. A colonnade runs along both
        // sides of it, and the colonnade is cut through by two thick
        // cross-walls. So the walk east is: gallery, down into the channel,
        // under the cross-wall, up into the next gallery. On the surface the
        // current is the wrong side of zero and you are carried home; on the
        // floor nothing pushes you at all.
        //
        // The return leg is free, and that is the room's other half: step off
        // the last gallery into the current and it takes you the whole length
        // back to the hall in one go. A torrent is a wall one way and a road
        // the other. `check-cleats.mjs` refuses a torrent standing in a room
        // that does not claim it, so the room declares its own `cleatRoom`.
        size: [3, 1],
        map: [
          '#######L#####################################',
          '#...................###........###..........#',
          '#.U.......U.........###........###..........#',
          '#...................###........###..........#',
          '#............ttttttttttttttttttttttttttttt..#',
          '.............ttttttttttttttttttttttttttttt..#',
          '#............ttttttttttttttttttttttttttttt..#',
          '#...................###........###..........#',
          '#.U.......U.........###........###..........#',
          '#...................###........###..........#',
          '#######.#####################################',
        ],
        entities: [
          ['urchin', 5, 3],
          ['crab', 6, 8],
          ['anglerfry', 17, 5],
          ['anglerfry', 28, 4],
          ['barnacle', 26, 9],
          ['barnacle', 37, 1],
          ['chest', 43, 5, { pickup: 'rupee100' }],
        ],
        cleatRoom: { from: [0, 5], to: [43, 5] },
        readable: [
          [10, 2, 'Scratched into the statue: "The eels swim\nhome with the current. The eel-catcher walks\nout under it."'],
        ],
      },
      '0,4,2': {
        name: 'The Kelp Locks',
        // 2x1, AND THE ONE ROOM IN THE SANCTUM THAT WANTS BOTH LAYERS IN ONE
        // CROSSING. The south door lets you into a flume that runs north up
        // the east wall, west the whole length of the north wall, and turns
        // down to the landing at the west door — where its last three tiles
        // run AGAINST you.
        //
        //   On the surface the current carries a swimmer round the lock in a
        //   few seconds and throws him back at the last gate.
        //   On the floor the whole flume is thirty-six tiles, and a breath is
        //   thirty-one: walked from the door, the air runs out in the top lane.
        //
        // So the answer is to ride it and sink at the gate — change layer in
        // the water, which the Cleats let you do at any moment. The sign on
        // the landing says so, and a player who dives at the door anyway is
        // brought up by his own air and carried to the gate regardless: the
        // lesson costs a quarter heart, never a dead end.
        //
        // One way. Nothing carries you back, and the floor is as long going
        // home: the Lock Gallery's plate opens the shortcut west instead.
        // Proved by `check-cleats.mjs`'s `layers` clauses.
        size: [2, 1],
        map: [
          '##############################',
          '#ttttttttttttttttttttttttttt##',
          '#A#########################A##',
          '#A#########################A##',
          '#A#########################A##',
          '....#######################A##',
          '#...#######################A##',
          '#...#######################A##',
          '####################U......A##',
          '####################.......A##',
          '######################L#######',
        ],
        cleatRoom: { from: [22, 9], to: [0, 5], layers: true },
        readable: [
          [20, 8, 'A plate on the lock wall: "The lock carries a\nswimmer round to its last gate, and no further.\nThe floor goes on where the water will not."'],
        ],
      },
      '0,3,2': {
        name: 'The Lock Gallery',
        // The boss door is in the north wall. The west door is the shortcut:
        // shut until the plate beside it is stood on, and only this side of
        // it has the plate.
        map: [
          '#######B#######',
          '#.............#',
          '#..U.......U..#',
          '#.............#',
          '#.............#',
          'D..............',
          '#.............#',
          '#.............#',
          '#..U.......U..#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['switch', 2, 5, { hold: false }],
          ['crab', 9, 7],
          ['urchin', 10, 3],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd3_shortcut',
          reward: {
            openDoors: [[0, 5]],
            say: 'The west gate grinds open.',
          },
        },
      },
      '0,3,1': {
        name: 'Gloomtide, the Bogwater Maw',
        // The boss keeps the mechanic: `noTide` pins the arena at whatever
        // level was brought in, and the floor is basin, which is walkable at
        // all three because a locked room has to work at whichever one arrives.
        map: [
          '###############',
          '#.............#',
          '#.............#',
          '#...2222222...#',
          '#...2222222...#',
          '#...2222222...#',
          '#...2222222...#',
          '#...2222222...#',
          '#.............#',
          '#.............#',
          '#######B#######',
        ],
        noTide: true,
        entities: [
          ['gloomtide', 7, 3],
        ],
        script: {
          onEvent(game, name) {
            if (name === 'bossDead') game.spawnPickup(112, 56, 'heartContainer', { grabDelay: 30 });
          },
        },
      },
    },
  });

  // --- Dungeon 4: Cliffside Cistern ----------------------------------------
  //
  // THE PRIMITIVE, STATED ONCE. Everything after the Squall Bellows in this
  // dungeon is one sentence built five different ways:
  //
  //     A DROWNED WHEEL DOES NOT TURN, AND THE ONLY THING THAT TAKES THE WATER
  //     OFF ONE IS THE GUST THAT TURNS IT.
  //
  // A paddle wheel under deep water never sees the wind (`GustWheel.drowned`).
  // The Bellows' cone holds the water inside it ONE LEVEL LOWER than the rest
  // of the room, and blows, and does both only while the button is down — and
  // pumping costs you your feet. So a Cistern sill is a wheel three tiles away
  // across a trench, and the answer is to stand still in the one place that can
  // see it and make the water be two levels at once.
  //
  // THE TIDE THEME, and it is the one no earlier dungeon has: the sea must be
  // in two states at the same instant. D1 held a patch and walked away from it;
  // D2 made you choose before you could see; D3 gave one body of water two
  // route layers. Here the room needs HIGH to be stood in and MID to be worked,
  // or MID to be stood in and LOW to be worked, and the conch can only ever say
  // one of those. There is no fixed sea at which any sill in this dungeon can
  // be solved.
  //
  // The two shapes, and every sill is one of them:
  //
  //   THE SUMP SHELF, worked at MID. The shelf is cut off by `0` (dSump): an
  //   open pit at LOW that nothing crosses, deep water at MID and above that
  //   the Cleats do. The wheel stands on `3` (dWell): shallow at LOW, drowned
  //   at MID and HIGH. So the shelf is standable only from MID up, and the cone
  //   frees the wheel only from MID down. They meet at MID and nowhere else.
  //
  //   THE DROWN-WALL SHELF, worked at HIGH. The shelf is ringed by `9`
  //   (drownWall): stone at LOW and MID, deep at HIGH. The wheel stands on `1`
  //   (dSluice): dry at LOW, wading at MID, drowned at HIGH. The shelf is
  //   reachable only at HIGH and the wheel is smothered only at HIGH, and one
  //   level of cone is exactly the difference.
  //
  // Every wheel sits behind a trench of `O` — pits, not water. The player of
  // this dungeon owns the Kelp-Soled Cleats, so a moat is a road and only a
  // hole is a hole. And the cone does not blow through stone (`Tide.blows`),
  // which is what lets a wheel be sealed in an alcove with one mouth.
  //
  // Proved by tools/check-bellows.mjs, which was written before these rooms.
  //
  // AN ORACLE DUNGEON (S140), built like the first three: 15x11 rooms with a
  // wall ring, a scrolling camera, one-tile doors, and key, shutter and boss
  // doors in the ring between two rooms. The kit is the Dancing Dragon
  // Dungeon's (`x*` picks in tools/rip-dungeon-themes.py) — grey stone, green
  // floor, and more standing water than any other dungeon in Seasons.
  //
  // Intended route (24 rooms, one floor, the Bellows at room 12):
  //   3,7 entrance -> 3,6 landing -> 2,6 Dungeon Map / 4,6 Small Key 1
  //   -> 3,5 the Weir: 2,5 Chartstone, 4,5 rungs (Piece of Heart at HIGH),
  //      5,5 charm -> 4,4 the Cistern Floor (Small Key 2) -> 3,4 -> 2,4 winch
  //      (the key door west). The Weir's own key door north is a shortcut back
  //      into 3,4, and either key opens either door first.
  //   -> 1,4 BELLOWS -> 1,3 Squall Loft (sill 1) -> 2,3 Drowned Sill (sill 2)
  //   -> 2,2 Cistern Gauge (sill 3, Small Key 3) -> back east:
  //      3,3 -> 4,3 the Long Race (sills 4a and 4b, one behind the other)
  //   -> 5,3 Ironknight (miniboss) -> 5,2 Cliff Walk (key door west)
  //   -> 4,2 the Crossed Sluices (sills 5 and 6, Boss Key) -> 4,1 overlook
  //   -> back round by 2,2 -> 3,2 boss door north -> 3,1 Wyverna
  registerMap({
    id: 'd4',
    kind: 'dungeon',
    name: 'Cliffside Cistern',
    w: 8, h: 8, floors: 1,
    cell: [15, 11],
    legend: 'dungeonCistern',
    music: 'dungeon2',
    tint: 'cave',
    dungeon: {
      index: 4,
      item: 'bellows', itemLevel: 1,
      essence: 4,
      boss: 'wyverna',
      bossRoom: '0,3,1',
      startRoom: '3,7',
      entrance: { map: 'overworld', floor: 0, rx: 1, ry: 3, px: 64, py: 32 },
    },
    rooms: {
      // ---------------------------------------------------- the way in
      '0,3,7': {
        name: 'Cistern Head',
        // The Dragon's own entrance hall: blue owl statues down both sides and
        // the lit step between two green pillars in the south wall.
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
          { x: 7, y: 10, to: { map: 'overworld', floor: 0, rx: 1, ry: 3, px: 64, py: 32, dir: 'down' } },
        ],
        readable: [
          [2, 8, 'Chiselled deep: "This cistern is worked from\nthe far bank. Nothing here is meant to be\nreached."'],
        ],
      },
      '0,3,6': {
        name: 'Rainwater Landing',
        // Four drown-wall pillars: stone at LOW and MID, gone under at HIGH.
        map: [
          '#######.#######',
          '#.............#',
          '#..9.......9..#',
          '#.............#',
          '#.............#',
          '...............',
          '#.............#',
          '#.............#',
          '#..9.......9..#',
          '#.............#',
          '#######.#######',
        ],
        entities: [
          ['keese', 10, 3],
          ['tektite', 4, 7],
        ],
      },
      '0,2,6': {
        name: 'Overflow Sluice',
        map: [
          '#######.#######',
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
          ['pickup', 7, 2, { kind: 'dungeonMap' }],
          ['keese', 11, 7],
        ],
      },
      '0,4,6': {
        name: 'Cracked Basin',
        map: [
          '#######.#######',
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
          flag: 'd4_basin',
          reward: {
            spawn: [['pickup', 7, 8, { kind: 'key' }]],
            say: 'Something falls out of the cracked basin.',
          },
        },
      },
      '0,3,5': {
        name: 'The Weir',
        // The sump, taught before it is ever load-bearing: at LOW these squares
        // have no floor at all, and at MID they are over your head. Its key
        // door north is the short way back into the Barnacle Cell.
        map: [
          '#######L#######',
          '#.............#',
          '#.............#',
          '#..00.....00..#',
          '#..00.....00..#',
          '...............',
          '#..00.....00..#',
          '#..00.....00..#',
          '#.U...........#',
          '#.............#',
          '#######.#######',
        ],
        entities: [
          ['tektite', 7, 7],
          ['keese', 3, 1],
        ],
        readable: [
          [2, 8, 'Cut into the weir: "At low water the sumps\nhave no floor. Mind your feet."'],
        ],
      },
      '0,2,5': {
        name: 'Drowned Stair',
        map: [
          '#######.#######',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#....33333....#',
          '#....33333.....',
          '#....33333....#',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#######.#######',
        ],
        entities: [
          ['chest', 7, 2, { pickup: 'chartstone' }],
          ['urchin', 7, 5],
        ],
      },
      '0,4,5': {
        name: 'Rung Gallery',
        // A drown-wall box with one square of floor inside it. At LOW and MID
        // it is four walls; at HIGH it is deep water and the Cleats swim you in
        // over the top. The teaching room for every sill in the second half,
        // and it costs nothing to fail.
        map: [
          '#######.#######',
          '#.............#',
          '#.............#',
          '#.......999...#',
          '#.......9.9...#',
          '........999....',
          '#.............#',
          '#..11.........#',
          '#..11.........#',
          '#.............#',
          '#######.#######',
        ],
        entities: [
          ['pickup', 9, 4, { kind: 'heartPiece' }],
          ['tektite', 4, 3],
          ['keese', 12, 8],
        ],
      },
      '0,5,5': {
        name: 'Cliffside Cell',
        map: [
          '#######.#######',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#.............#',
          '..............#',
          '#....,,,,,....#',
          '#....,,,,,....#',
          '#.U.........U.#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['chest', 7, 3, { charm: 'bosunsWhistle' }],
          ['stalfos', 11, 5],
        ],
      },
      '0,4,4': {
        name: 'The Cistern Floor',
        // Three screens wide: it owns 5,4 and 6,4 as well as its own, so
        // nothing else may be keyed there. Two wells run the height of it —
        // wading at LOW, swimming above — with an island between them, so
        // more room is literally more sea to cross.
        size: [3, 1],
        map: [
          '#############################################',
          '#........33333333333.....33333333333........#',
          '#........33333333333.....33333333333........#',
          '#........33333333333.....33333333333........#',
          '#........33333333333.....33333333333........#',
          '.........33333333333.....33333333333........#',
          '#........33333333333.....33333333333........#',
          '#........33333333333.....33333333333........#',
          '#........33333333333.....33333333333........#',
          '#........33333333333.....33333333333........#',
          '#######.##############.######################',
        ],
        entities: [
          // Two plates and one block, at opposite ends of the hall: the block
          // holds the west plate and you have to be standing on the east one.
          // The dungeon's own idea, rehearsed before the item that makes it —
          // you cannot be in two places, so something else has to hold.
          ['switch', 2, 2],
          ['switch', 41, 8],
          ['block', 3, 2],
          ['jellyfish', 14, 4],
          ['urchin', 30, 6],
          ['keese', 22, 2],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd4_floor',
          reward: {
            spawn: [['pickup', 22, 5, { kind: 'key' }]],
            say: 'A grating opens in the middle of the floor.',
          },
        },
      },
      '0,3,4': {
        name: 'Barnacle Cell',
        map: [
          '###############',
          '#.............#',
          '#.U.........U.#',
          '#...1111111...#',
          '#..111111111..#',
          '...111111111...',
          '#..111111111..#',
          '#...1111111...#',
          '#.............#',
          '#.............#',
          '#######L#######',
        ],
        entities: [
          ['barnacle', 7, 5],
          ['crab', 11, 8],
          ['keese', 3, 1],
        ],
      },
      '0,2,4': {
        name: 'Winch Room',
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
          [2, 2, 'A winch plate, bolted shut: "The wheels are\nset where no hand goes. Bring wind."'],
        ],
      },
      '0,1,4': {
        name: 'Bellows Vault',
        map: [
          '#######.#######',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#....,,,,,....#',
          '#....,,,,,....L',
          '#....,,,,,....#',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['chest', 7, 5, { big: true, item: 'bellows', level: 1 }],
        ],
      },

      // ---------------------------------------------------- the sills
      '0,1,3': {
        name: 'Squall Loft',
        // SILL 1, a sump shelf, worked at MID. The first one, and it is the
        // shape at its plainest: a shaft in the north-west corner with the
        // wheel at the end of it, a pit trench you cannot cross, and a
        // two-square ledge on the far side of a sump that is a hole at LOW.
        //
        // Stand on 4,1 — the landing at 4,2 has a wall between it and the wheel
        // and the cone does not blow through stone, so even the first sill asks
        // you to take one step before you pump.
        map: [
          '###############',
          '#3OO.##########',
          '####.##.......#',
          '####0##.......#',
          '#...0.........#',
          '#.............D',
          '#.............#',
          '#.....U...U...#',
          '#.............#',
          '#.............#',
          '#######.#######',
        ],
        bellowsRoom: {
          wheel: [1, 1], stand: [4, 1], face: 'left', at: 1, opens: [[14, 5]],
        },
        entities: [
          ['wheel', 1, 1, { needTurns: 30 }],
          ['keese', 11, 8],
        ],
        readable: [
          [6, 7, 'A plate on the loft: "The wheel turns in the\nwind, and never under water. Take the water\noff it and blow."'],
        ],
        script: {
          onEvent(game, name, data) {
            if (name === 'valve' && data && data.open) game.applyReward({ openDoors: [[14, 5]] });
          },
        },
      },
      '0,2,3': {
        name: 'The Drowned Sill',
        // SILL 2, a drown-wall shelf, worked at HIGH — and a player who has
        // just learned the Loft will try MID here and get nothing. The stand is
        // a single square walled in by drown-wall on two sides and a pit trench
        // on the third; the sea has to be up for you to get in, and the cone is
        // what takes it back off the wheel.
        map: [
          '#######D#######',
          '#.............#',
          '#..U.......U..#',
          '#.............#',
          '#.............#',
          'D..............',
          '#.............#',
          '#............##',
          '#........#9####',
          '#........9.OO1#',
          '###############',
        ],
        bellowsRoom: {
          wheel: [13, 9], stand: [10, 9], face: 'right', at: 2, opens: [[7, 0]],
        },
        entities: [
          ['wheel', 13, 9, { needTurns: 40 }],
          ['tektite', 4, 7],
          ['keese', 11, 3],
        ],
        readable: [
          [3, 2, 'Scratched under the sill: "This wheel stands\nin the sluice, and the sluice is only over\nits head at high water."'],
        ],
        script: {
          onEvent(game, name, data) {
            if (name === 'valve' && data && data.open) game.applyReward({ openDoors: [[7, 0]] });
          },
        },
      },
      '0,2,2': {
        name: 'Cistern Gauge',
        // SILL 3, a sump shelf again, and the variation is the approach: the
        // shelf is at the end of a flooded gallery you swim DOWN rather than a
        // ledge you swim UP to, and what it pays out is a key rather than a
        // door. The dry square at 5,4 is close enough to see the wheel from
        // and too far to blow it — the reach is three.
        map: [
          '#######.#######',
          '#.............#',
          '#.............#',
          '#.............#',
          '#####.........#',
          '#3OO.0.........',
          '#####0........#',
          '#.......3333..#',
          '#.......3333..#',
          '#.............#',
          '#######D#######',
        ],
        bellowsRoom: {
          wheel: [1, 5], stand: [4, 5], face: 'left', at: 1, gives: 'key',
        },
        entities: [
          ['wheel', 1, 5, { needTurns: 40 }],
          ['jellyfish', 10, 8],
          ['keese', 11, 2],
        ],
        script: {
          // A SCRIPT-SPAWNED PICKUP EXISTS ONLY IN THE FRAME IT WAS RELEASED
          // IN. Swim out without collecting this key and it is gone, with the
          // wheel still open and nothing left that can ever release it again —
          // a soft lock three rooms from the Boss Key, invisible to every
          // checker in the repo because they all reason about the room rather
          // than about leaving it. So the wheel sets a flag, the key carries a
          // save key of its own, and entering the room puts it back if it was
          // released and never picked up.
          onEnter(game) {
            if (game.progress.flags.d4GaugeWheel && !game.progress.secrets.d4GaugeKey) {
              game.spawnPickup(64, 80, 'key', { grabDelay: 14, saveKey: 'd4GaugeKey' });
            }
          },
          onEvent(game, name, data) {
            if (name !== 'valve' || !data || !data.open) return;
            game.progress.flags.d4GaugeWheel = true;
            if (game.progress.secrets.d4GaugeKey) return;
            game.spawnPickup(64, 80, 'key', { grabDelay: 14, saveKey: 'd4GaugeKey' });
          },
        },
      },
      '0,2,1': {
        name: 'West Overlook',
        map: [
          '###############',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#....33333....#',
          '#....33333....#',
          '#....33333....#',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#######.#######',
        ],
        entities: [
          ['pickup', 7, 2, { kind: 'fairy' }],
          ['keese', 11, 7],
        ],
      },
      '0,3,3': {
        name: 'Winding Stair',
        map: [
          '###############',
          '#.............#',
          '#..22222222...#',
          '#..2......2...#',
          '#..2..U...2...#',
          '...............',
          '#.............#',
          '#...1111111...#',
          '#...1111111...#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['tektite', 5, 3],
          ['keese', 11, 8],
        ],
      },
      '0,4,3': {
        name: 'The Long Race',
        // SILLS 4a AND 4b, AND THE SECOND ONE IS BEHIND THE FIRST. The west
        // wheel is a sump shelf worked at MID, and what it opens is not the way
        // on: it is the shutter into the east vault, where the second wheel
        // stands at the top of a shaft behind drown-wall and wants HIGH. So the
        // room is worked twice, in order, at two seas — the dungeon's whole
        // idea said twice in a row, and the plate by the door says so.
        //
        // The east wheel's stand cannot be reached at any sea while the vault
        // is shut (`after`), which check-bellows.mjs proves along with every
        // other sill clause, for each wheel.
        map: [
          '###############',
          '#3OO.##########',
          '####.#####1####',
          '####0#####O####',
          '#...0..#.#O#..#',
          '.......#.#.#..D',
          '#......#..9...#',
          '#......D......#',
          '#......#......#',
          '#.U....#......#',
          '###############',
        ],
        bellowsRoom: [
          { wheel: [1, 1], stand: [4, 1], face: 'left', at: 1, opens: [[7, 7]] },
          { wheel: [10, 2], stand: [10, 5], face: 'up', at: 2, opens: [[14, 5]], after: [[7, 7]] },
        ],
        entities: [
          ['wheel', 1, 1, { needTurns: 40 }],
          ['wheel', 10, 2, { needTurns: 50 }],
          // The darknut guards the vault, not the hall: at HIGH its stand is
          // behind deep water a darknut cannot cross, so the second wheel is
          // pumped from a square it cannot reach — the old room's premise.
          ['darknut', 12, 8],
          ['keese', 3, 7],
        ],
        readable: [
          [2, 9, 'A plate by the race: "Two wheels, and the second\nis behind the first. They will not turn at the\nsame sea."'],
        ],
        script: {
          onEvent(game, name, data) {
            if (name !== 'valve' || !data || !data.open) return;
            // Each wheel opens its own door: the west one the vault, the east
            // one the way on.
            game.applyReward({ openDoors: [data.x >= 16 * 8 ? [14, 5] : [7, 7]] });
          },
        },
      },
      '0,5,3': {
        name: 'Ironknight Gallery',
        // The miniboss, at room 17 of 24. Two screens wide because the
        // Ironknight charges in straight lines and a narrow room gives it
        // nowhere to do that. The drown-wall block in the middle is cover at
        // LOW and MID and simply gone at HIGH, which is the only decision the
        // fight offers and is worth having.
        size: [2, 1],
        map: [
          '#######D######################',
          '#............................#',
          '#.U........................U.#',
          '#............................#',
          '#.............99.............#',
          'D.............99.............#',
          '#.............99.............#',
          '#............................#',
          '#.U........................U.#',
          '#............................#',
          '##############################',
        ],
        entities: [
          ['ironknight', 20, 5],
          ['keese', 5, 8],
        ],
        puzzle: {
          enemies: true,
          flag: 'd4_ironknight',
          reward: {
            openDoors: [[7, 0]],
            say: 'The armour folds up. Something grinds open above.',
          },
        },
      },
      '0,5,2': {
        name: 'Cliff Walk',
        // Not a sill. Four pits and light enemies over them: the gust's other
        // verb, which is shoving, and the one place in the dungeon where the
        // Bellows are a weapon. Nothing here is required — a keese blown into a
        // pit is a keese you did not have to hit.
        map: [
          '###############',
          '#.............#',
          '#..OO.....OO..#',
          '#..OO.....OO..#',
          '#.............#',
          'L.............#',
          '#.............#',
          '#..OO.....OO..#',
          '#..OO.....OO..#',
          '#.............#',
          '#######D#######',
        ],
        entities: [
          ['keese', 3, 1],
          ['keese', 11, 1],
          ['keese', 7, 5],
        ],
      },
      '0,4,2': {
        name: 'The Crossed Sluices',
        // SILLS 5 AND 6, one of each shape, in one room, and the Boss Key is
        // behind both. The west wheel is a sump shelf and wants MID; the east
        // wheel is a drown-wall shelf and wants HIGH. You cannot hold two seas,
        // so you work one side, walk out, sound the conch, and work the other —
        // which is the dungeon's whole idea said out loud in one room.
        //
        // THE WEST DOOR IS THE SHORTCUT HOME, and it is this room's to open:
        // the plate beside it on this side lets a player holding the Boss Key
        // walk straight into the Cistern Gate instead of five rooms back round
        // by the Long Race. Only this side has the plate, so it cannot be used
        // to reach the Boss Key early — the Bogwater Sanctum's Lock Gallery
        // precedent (S139).
        map: [
          '#######.#######',
          '###3#.....#1###',
          '###O#.....#O###',
          '###O#.....#O###',
          '###.#.....#.###',
          'D.#0#.....#9..L',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.U.........U.#',
          '###############',
        ],
        bellowsRoom: [
          { wheel: [3, 1], stand: [3, 4], face: 'up', at: 1 },
          { wheel: [11, 1], stand: [11, 4], face: 'up', at: 2, gives: 'bossKey' },
        ],
        entities: [
          ['wheel', 3, 1, { needTurns: 40 }],
          ['wheel', 11, 1, { needTurns: 40 }],
          ['switch', 1, 6, { hold: false }],
          ['stalfos', 7, 7],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd4_shortcut',
          reward: {
            openDoors: [[0, 5]],
            say: 'The west gate grinds open.',
          },
        },
        readable: [
          [2, 9, 'Carved over both sluices: "The west one\ndrinks at middle water. The east one only\ndrowns at the top of the tide."'],
        ],
        script: {
          // Put the Boss Key back if it was released and never collected — see
          // the Cistern Gauge for why. This is the room where getting that
          // wrong ends the dungeon.
          onEnter(game) {
            if (game.progress.flags.d4Sluices && !game.progress.secrets.d4BossKey) {
              game.spawnPickup(112, 112, 'bossKey', { grabDelay: 14, saveKey: 'd4BossKey' });
            }
          },
          onEvent(game, name, data) {
            if (name !== 'valve' || !data || !data.open) return;
            // Both wheels, and the pickup lands in the middle of the room
            // rather than on either shelf: whichever one you turned second, you
            // have to swim out to collect it.
            const wheels = game.entities.filter(e => e.needTurns != null);
            if (wheels.length !== 2 || !wheels.every(w => w.open)) return;
            game.progress.flags.d4Sluices = true;
            if (game.progress.secrets.d4BossKey) return;
            game.spawnPickup(112, 112, 'bossKey', { grabDelay: 14, saveKey: 'd4BossKey' });
          },
        },
      },
      '0,4,1': {
        name: 'East Overlook',
        map: [
          '###############',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#....11111....#',
          '#....11111....#',
          '#....11111....#',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#######.#######',
        ],
        entities: [
          ['pickup', 7, 2, { kind: 'rupee20' }],
          ['stalfos', 11, 7],
          // D4's second Piece of Heart, in the corner of the overlook furthest
          // from the door — a room you climb to for the view and leave by the
          // way you came.
          ['pickup', 1, 3, { kind: 'heartPiece' }],
        ],
      },
      '0,3,2': {
        name: 'Cistern Gate',
        // The east door is a shutter, and it is the Crossed Sluices' to open:
        // see the plate beside it on the far side.
        map: [
          '#######B#######',
          '#.............#',
          '#..U.......U..#',
          '#.............#',
          '#.............#',
          '..............D',
          '#.............#',
          '#.............#',
          '#..U.......U..#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['tektite', 10, 6],
        ],
      },
      '0,3,1': {
        name: 'Wyverna, the Sea Wyvern',
        // The boss keeps the mechanic: she flies at the height of the sea, and
        // `noTide` pins the arena at whatever level was brought in. The floor
        // is basin, walkable at all three.
        map: [
          '###############',
          '#.............#',
          '#.............#',
          '#...2222222...#',
          '#...2222222...#',
          '#...2222222...#',
          '#...2222222...#',
          '#...2222222...#',
          '#.............#',
          '#.............#',
          '#######B#######',
        ],
        noTide: true,
        entities: [
          ['wyverna', 7, 3],
        ],
        script: {
          onEvent(game, name) {
            if (name === 'bossDead') game.spawnPickup(112, 56, 'heartContainer', { grabDelay: 30 });
          },
        },
      },
    },
  });
}
