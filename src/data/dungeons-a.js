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
// on a seam would drop them inside solid stone from the far side.
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
  // Tide theme: the floor is flooded; drop the tide to LOW and walk it.
  //
  // Intended route:
  //   3,7 entrance -> 3,6 (learn: the sluice floor is dry at LOW)
  //   -> 3,5 hub -> 2,5 Dungeon Map -> 4,5 Compass
  //   -> 3,4 -> 2,4 Small Key 1 (clear the room) -> 4,4 Small Key 2 (switches)
  //   -> 3,3 locked door, north half -> west wing 2,3 1,3 1,2 2,2 (Small Key 3)
  //   -> east wing 4,3 5,3 5,2 (miniboss Clawcrab) -> 4,2 big chest: Roc's Feather
  //   -> 3,2 Boss Key across the chasm (the hop is base moveset now)
  //   -> boss door -> 3,1 Gohmaraq
  registerMap({
    id: 'd1',
    kind: 'dungeon',
    name: 'Tidewash Grotto',
    w: 8, h: 8, floors: 1,
    legend: 'dungeon',
    music: 'dungeon',
    tint: 'cave',
    scroll: false,
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
      '0,1,2': {
        name: 'Old Sluice',
        map: [
          '##########',
          '##......##',
          '##......##',
          '##.4444...',
          '##.4444...',
          '##_____.##',
          '##......##',
          '####..####',
        ],
        entities: [
          ['valve', 2, 2, { saveKey: 'd1_valve' }],
          ['pickup', 6, 4, { kind: 'key' }],
        ],
        readable: [
          [7, 2, 'A rusted plate: "Shut the sluice, and the grotto drinks."'],
        ],
      },
      '0,1,3': {
        name: 'Cistern Corner',
        map: [
          '####..####',
          '##......##',
          '##.1111.##',
          '#..1111...',
          '#..1111...',
          '##.1111.##',
          '##......##',
          '##########',
        ],
        entities: [
          ['crab', 4, 3],
          ['switch', 2, 2],
          ['switch', 7, 2],
          ['block', 2, 3],
          ['block', 7, 3],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd1_013_puzzle',
          reward: {
            spawn: [['pickup', 4, 1, { kind: 'rupee20' }]],
            say: 'A catch lets go under the floor.',
          },
        },
      },
      '0,2,1': {
        name: 'North Cell',
        map: [
          '##########',
          '##########',
          '##......##',
          '##..11....',
          '##..11....',
          '##......##',
          '##########',
          '##########',
        ],
        entities: [
          ['pickup', 4, 3, { kind: 'rupee20' }],
          ['crab', 2, 2],
        ],
      },
      '0,2,2': {
        name: 'Drip Passage',
        map: [
          '##########',
          '##########',
          '##......##',
          '...""""...',
          '..........',
          '##..pp..##',
          '####..####',
          '####..####',
        ],
        entities: [
          ['keese', 4, 2],
          ['zol', 3, 4],
          ['torch', 2, 2],
          ['torch', 7, 2],
          ['torch', 2, 5],
        ],
        puzzle: {
          torches: 'all',
          flag: 'd1_022_puzzle',
          reward: {
            spawn: [['pickup', 4, 3, { kind: 'heart' }]],
            say: 'Water drains out of a niche in the wall.',
          },
        },
      },
      '0,2,3': {
        name: 'Weeping Wall',
        map: [
          '####..####',
          '####..####',
          '##.3333.##',
          '..........',
          '..........',
          '##.3333.##',
          '####..####',
          '####..####',
        ],
        entities: [
          ['keese', 3, 2],
          ['zol', 6, 4],
        ],
        puzzle: {
          enemies: true,
          flag: 'd1_023_puzzle',
          reward: {
            spawn: [['pickup', 4, 3, { kind: 'rupee5' }]],
            say: 'Loose stone shifts, and something rolls out.',
          },
        },
      },
      '0,2,4': {
        name: 'Crab Pit',
        map: [
          '####..####',
          '####..####',
          '##.1111.##',
          '##.1111...',
          '##.1111...',
          '##.1111.##',
          '####..####',
          '####..####',
        ],
        entities: [
          ['crab', 2, 2],
          ['crab', 5, 4],
          ['crab', 4, 3],
        ],
        puzzle: {
          enemies: true,
          flag: 'd1_crabpit',
          reward: { spawn: [['pickup', 4, 3, { kind: 'key' }]], say: 'Something clatters onto the wet stone.' },
        },
      },
      '0,2,5': {
        name: 'Map Alcove',
        map: [
          '####..####',
          '####..####',
          '##......##',
          '##........',
          '##_____...',
          '##......##',
          '##########',
          '##########',
        ],
        entities: [
          ['pickup', 4, 3, { kind: 'dungeonMap' }],
          ['keese', 2, 2],
        ],
      },
      '0,3,1': {
        name: 'Gohmaraq, the Tidewash Claw',
        // A boss room that KEEPS the mechanic instead of switching it off. The
        // conch is still suppressed — `noTide` — so the arena is whatever it
        // was when you walked in, and the only thing that moves it is a
        // Bottled Tide. One step, one bottle, and you brought however many
        // bottles you brought. See docs/ITEMS.md.
        map: [
          '##########',
          '#..2222..#',
          '#..2222..#',
          '.....>....',
          '.....>....',
          '#..2222..#',
          '#..2222..#',
          '####..####',
        ],
        noTide: true,
        entities: [
          ['gohmaraq', 4, 2],
        ],
        script: {
          onEvent(game, name) {
            if (name === 'bossDead') game.spawnPickup(80, 40, 'heartContainer', { grabDelay: 30 });
          },
        },
      },
      '0,3,2': {
        name: 'Bosskey Vault',
        map: [
          '####..####',
          '#........#',
          '####B#####',
          '.........#',
          '..44..44.#',
          '#........#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['chest', 2, 4, { pickup: 'bossKey' }],
          ['keese', 6, 4],
        ],
      },
      '0,3,3': {
        name: 'The Locked Stair',
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
          ['zol', 2, 4],
          ['zol', 6, 5],
        ],
      },
      '0,3,4': {
        name: 'Tide Gallery',
        map: [
          '####..####',
          '#.33..33.#',
          '####L#####',
          '..........',
          '..........',
          '#.331133.#',
          '#.33..33.#',
          '####..####',
        ],
        entities: [
          ['tektite', 4, 3],
          ['crab', 2, 4],
        ],
      },
      '0,3,5': {
        name: 'Sunken Hall',
        map: [
          '####..####',
          '#..q..q..#',
          '#........#',
          '..11..11..',
          '..11..11..',
          '#........#',
          '#..q..q..#',
          '####..####',
        ],
        entities: [
          ['zol', 4, 2],
          ['crab', 2, 5],
          ['switch', 1, 2],
          ['switch', 8, 2],
          ['block', 1, 3],
          ['block', 8, 3],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd1_035_puzzle',
          reward: {
            spawn: [['pickup', 4, 3, { kind: 'fairy' }]],
            say: 'A light comes up out of the water.',
          },
        },
      },
      '0,3,6': {
        name: 'Drowned Landing',
        map: [
          '####..####',
          '#.11..11.#',
          '#.111111.#',
          '#..1111..#',
          '#.111111.#',
          '#.111111.#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['crab', 3, 3],
          ['crab', 6, 4],
          ['torch', 1, 1],
          ['torch', 8, 1],
          ['torch', 1, 6],
        ],
        puzzle: {
          torches: 'all',
          flag: 'd1_036_puzzle',
          reward: {
            spawn: [['pickup', 4, 1, { kind: 'bomb4' }]],
            say: 'A cache opens in the wall.',
          },
        },
      },
      '0,3,7': {
        name: 'Grotto Mouth',
        map: [
          '####..####',
          '#........#',
          '#.p..<.p.#',
          '#....<...#',
          '#.1..<.1.#',
          '#........#',
          '#........#',
          '####/#####',
        ],
        warps: [
          { x: 4, y: 7, to: { map: 'overworld', floor: 0, rx: 8, ry: 8, px: 64, py: 32, dir: 'down' } },
        ],
        readable: [
          [2, 3, 'Carved by the door: "The sea keeps this floor. Take it back."'],
        ],
      },
      '0,4,1': {
        name: 'East Cell',
        map: [
          '##########',
          '##########',
          '##......##',
          '....33..##',
          '....33..##',
          '##......##',
          '##########',
          '##########',
        ],
        entities: [
          ['pickup', 4, 3, { kind: 'fairy' }],
        ],
      },
      '0,4,2': {
        name: 'Treasure Cell',
        map: [
          '##########',
          '##########',
          '##......##',
          '#.........',
          '#._____...',
          '##......##',
          '##########',
          '##########',
        ],
        entities: [
          ['chest', 4, 3, { big: true, item: 'anchor', level: 1 }],
        ],
      },
      '0,4,3': {
        name: 'Shell Corridor',
        map: [
          '##########',
          '##########',
          '##.1..1.##',
          '..........',
          '..........',
          '##.1..1.##',
          '####..####',
          '####..####',
        ],
        entities: [
          ['crab', 3, 3],
          ['tektite', 6, 4],
        ],
        puzzle: {
          enemies: true,
          flag: 'd1_043_puzzle',
          reward: {
            spawn: [['pickup', 4, 3, { kind: 'rupee20' }]],
            say: 'A catch lets go under the floor.',
          },
        },
      },
      '0,4,4': {
        name: 'Switch Room',
        map: [
          '####..####',
          '####..####',
          '##......##',
          '...=..=.##',
          '........##',
          '##......##',
          '####..####',
          '####..####',
        ],
        entities: [
          ['switch', 2, 2],
          ['switch', 7, 2],
          ['block', 2, 3],
          ['block', 7, 3],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd1_switches',
          reward: { spawn: [['pickup', 4, 4, { kind: 'key' }]], say: 'A catch releases somewhere below.' },
        },
      },
      '0,4,5': {
        name: 'Compass Alcove',
        map: [
          '####..####',
          '####..####',
          '##..pp..##',
          '........##',
          '........##',
          '##..pp..##',
          '##########',
          '##########',
        ],
        entities: [
          ['chest', 4, 3, { pickup: 'chartstone' }],
          ['keese', 6, 4],
        ],
      },
      '0,5,2': {
        name: 'Clawcrab Den',
        map: [
          '##########',
          '##..pp..##',
          '##......##',
          '........##',
          '........##',
          '##......##',
          '##......##',
          '####..####',
        ],
        entities: [
          ['clawcrab', 4, 3],
        ],
        puzzle: {
          enemies: true,
          flag: 'd1_clawcrab',
          reward: { say: 'The claw stops moving. The way west is quiet.' },
        },
      },
      '0,5,3': {
        name: 'Barnacle Bend',
        map: [
          '####..####',
          '##......##',
          '####L#####',
          '...3333..#',
          '...3333..#',
          '##.3333.##',
          '##......##',
          '##########',
        ],
        entities: [
          ['barnacle', 2, 2],
          ['barnacle', 7, 5],
          ['crab', 4, 3],
        ],
      },
    },
  });

  // --- Dungeon 2: Coral Spire ----------------------------------------------
  // Tide theme: raise the water and it carries you up; drop it and you walk the
  // floor you were just swimming over. Two floors, joined by wells rather than
  // stairs wherever the tide can do the lifting.
  //
  // Intended route:
  //   3,7 entrance -> 3,6 -> 3,5 hub -> 2,5 Dungeon Map -> 4,5 Small Key 1
  //   -> 3,4 wells -> stairs at 2,4 up to floor 1
  //   -> 1F: 3,5 -> 2,5 Compass -> 4,5 Small Key 2 -> 3,4 -> 3,3 locked
  //   -> 4,3 Reefguard (miniboss) -> 2,3 big chest: Bombs
  //   -> 3,2 Boss Key -> boss door -> 3,1 Anemos
  registerMap({
    id: 'd2',
    kind: 'dungeon',
    name: 'Coral Spire',
    w: 8, h: 8, floors: 2,
    legend: 'dungeon',
    music: 'dungeon2',
    tint: 'cave',
    scroll: false,
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
      '0,2,4': {
        name: 'Stair Coil',
        map: [
          '##########',
          '##########',
          '##....../#',
          '##........',
          '##........',
          '##......##',
          '####..####',
          '####..####',
        ],
        warps: [
          { x: 8, y: 2, to: { map: 'd2', floor: 1, rx: 3, ry: 5, px: 72, py: 96 } },
        ],
        entities: [
          ['crab', 3, 4],
        ],
      },
      '0,2,5': {
        name: 'Map Nook',
        map: [
          '####..####',
          '####..####',
          '##......##',
          '##........',
          '##........',
          '##..pp..##',
          '##########',
          '##########',
        ],
        entities: [
          ['pickup', 4, 3, { kind: 'dungeonMap' }],
          ['urchin', 6, 2],
        ],
      },
      '0,3,4': {
        name: 'Rising Chamber',
        map: [
          '##########',
          '#.444444.#',
          '#.444444.#',
          '..........',
          '..........',
          '#.444444.#',
          '#.44..44.#',
          '####..####',
        ],
        entities: [
          ['jellyfish', 3, 2],
          ['barnacle', 6, 5],
          ['switch', 1, 2],
          ['switch', 8, 2],
          ['block', 1, 3],
          ['block', 8, 3],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd2_034_puzzle',
          reward: {
            spawn: [['pickup', 4, 3, { kind: 'heart' }]],
            say: 'Water drains out of a niche in the wall.',
          },
        },
      },
      '0,3,5': {
        name: 'Spire Well',
        map: [
          '####..####',
          '#..q..q..#',
          '#.333333.#',
          '..333333..',
          '..333333..',
          '#.333333.#',
          '#..q..q..#',
          '####..####',
        ],
        entities: [
          ['jellyfish', 4, 3],
          ['crab', 2, 5],
          ['torch', 1, 1],
          ['torch', 8, 1],
          ['torch', 1, 6],
        ],
        puzzle: {
          torches: 'all',
          flag: 'd2_035_puzzle',
          reward: {
            spawn: [['pickup', 4, 1, { kind: 'rupee5' }]],
            say: 'Loose stone shifts, and something rolls out.',
          },
        },
      },
      '0,3,6': {
        name: 'Coral Landing',
        map: [
          '####..####',
          '#.3....3.#',
          '#.3....3.#',
          '#........#',
          '#........#',
          '#.3____3.#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['urchin', 3, 3],
          ['crab', 6, 4],
        ],
        puzzle: {
          enemies: true,
          flag: 'd2_036_puzzle',
          reward: {
            spawn: [['pickup', 4, 3, { kind: 'fairy' }]],
            say: 'A light comes up out of the water.',
          },
        },
      },
      '0,3,7': {
        name: 'Spire Mouth',
        map: [
          '####..####',
          '#........#',
          '#.p....p.#',
          '#........#',
          '#.33..33.#',
          '#........#',
          '#........#',
          '####/#####',
        ],
        warps: [
          { x: 4, y: 7, to: { map: 'overworld', floor: 0, rx: 10, ry: 5, px: 64, py: 32, dir: 'down' } },
        ],
        readable: [
          [2, 3, 'Coral script: "What rises, carries. What falls, reveals."'],
        ],
      },
      '0,4,4': {
        name: 'Sealed Cell',
        map: [
          '##########',
          '##########',
          '##.3333.##',
          '...3333.##',
          '...3333.##',
          '##.3333.##',
          '####..####',
          '####..####',
        ],
        entities: [
          ['chest', 7, 3, { big: true, item: 'lens', level: 1 }],
          ['pickup', 4, 3, { kind: 'rupee20' }],
          ['urchin', 2, 2],
        ],
      },
      '0,4,5': {
        name: 'Torch Cell',
        map: [
          '####..####',
          '####..####',
          '##......##',
          '........##',
          '.._____.##',
          '##......##',
          '##########',
          '##########',
        ],
        entities: [
          ['torch', 2, 2],
          ['torch', 7, 2],
          ['torch', 4, 5],
          ['keese', 5, 3],
        ],
        puzzle: {
          torches: 'all',
          flag: 'd2_torches',
          reward: { spawn: [['pickup', 4, 3, { kind: 'key' }]], say: 'The three flames answer each other.' },
        },
      },
      '1,2,3': {
        name: 'Cracked Cell',
        map: [
          '##########',
          '##########',
          '##..XX..##',
          '#.........',
          '#..""""...',
          '##......##',
          '####..####',
          '####..####',
        ],
        entities: [
          ['pickup', 4, 4, { kind: 'rupee20' }],
          ['keese', 6, 2],
        ],
      },
      '1,2,4': {
        name: 'Anemone Cell',
        map: [
          '####..####',
          '####..####',
          '##......##',
          '##.3333...',
          '##.3333...',
          '##......##',
          '####..####',
          '####..####',
        ],
        entities: [
          ['urchin', 3, 3],
          ['pickup', 6, 4, { kind: 'fairy' }],
        ],
      },
      '1,2,5': {
        name: 'Compass Cell',
        map: [
          '####..####',
          '####..####',
          '##......##',
          '#.........',
          '#.........',
          '##..pp..##',
          '##########',
          '##########',
        ],
        entities: [
          ['chest', 4, 3, { pickup: 'chartstone' }],
          ['urchin', 6, 2],
        ],
      },
      '1,3,1': {
        name: 'Anemos, the Crowned Column',
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
          ['anemos', 4, 2],
        ],
        script: {
          onEvent(game, name) {
            if (name === 'bossDead') game.spawnPickup(80, 40, 'heartContainer', { grabDelay: 30 });
          },
        },
      },
      '1,3,2': {
        name: 'Bosskey Well',
        map: [
          '####..####',
          '#........#',
          '####B#####',
          '#........#',
          '#.3....3.#',
          '#........#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['chest', 6, 4, { pickup: 'bossKey' }],
          ['jellyfish', 2, 4],
        ],
      },
      '1,3,3': {
        name: 'Upper Lock',
        map: [
          '####..####',
          '#........#',
          '####L#####',
          '..........',
          '...""""...',
          '#........#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['crab', 2, 4],
          ['urchin', 6, 5],
        ],
      },
      '1,3,4': {
        name: 'Coral Balcony',
        map: [
          '####..####',
          '#.33..33.#',
          '####L#####',
          '..........',
          '..........',
          '#.3....3.#',
          '#.33..33.#',
          '####..####',
        ],
        entities: [
          ['jellyfish', 4, 3],
          ['keese', 2, 2],
          // Only in the room at HIGH. Invisible and untouchable below it until
          // the Brineglass Lens is raised — see docs/ITEMS.md.
          ['urchin', 6, 4, { phase: 2 }],
          ['urchin', 3, 4, { phase: 2 }],
        ],
      },
      '1,3,5': {
        name: 'Upper Landing',
        map: [
          '####..####',
          '##....../#',
          '##...<..##',
          '.....<....',
          '.....<....',
          '##......##',
          '#........#',
          '##########',
        ],
        warps: [
          { x: 8, y: 1, to: { map: 'd2', floor: 0, rx: 2, ry: 4, px: 112, py: 40 } },
        ],
        entities: [
          ['keese', 3, 4],
        ],
      },
      '1,4,3': {
        name: 'Reefguard Hall',
        map: [
          '##########',
          '##..pp..##',
          '##......##',
          '..........',
          '..........',
          '##_____.##',
          '##......##',
          '####..####',
        ],
        entities: [
          ['reefguard', 4, 3],
        ],
        puzzle: {
          enemies: true,
          flag: 'd2_reefguard',
          reward: { say: 'The guard sinks back into the coral.' },
        },
      },
      '1,4,4': {
        name: 'Whelk Cell',
        map: [
          '####..####',
          '####..####',
          '##..pp..##',
          '........##',
          '........##',
          '##..pp..##',
          '####..####',
          '####..####',
        ],
        entities: [
          ['barnacle', 4, 3],
          ['pickup', 2, 2, { kind: 'rupee20' }],
        ],
      },
      '1,4,5': {
        name: 'Block Cell',
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
          ['block', 4, 4],
          ['block', 5, 3],
          ['switch', 4, 5],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd2_block',
          reward: { spawn: [['pickup', 4, 2, { kind: 'key' }]], say: 'Stone settles into stone.' },
        },
      },
      '1,5,3': {
        name: 'Bomb Vault',
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
          ['chest', 4, 3, { big: true, item: 'bombs', level: 1 }],
        ],
      },
    },
  });

  // --- Dungeon 3: Bogwater Sanctum -----------------------------------------
  // Tide theme: the drains only run dry at LOW, and the sanctum's sluice valves
  // decide which half of the floor is water at all. Every locked half of this
  // dungeon is opened by choosing a tide level, not by finding a switch.
  //
  // Intended route:
  //   3,7 entrance -> 3,6 -> 3,5 hub -> 2,5 Dungeon Map -> 4,5 Compass
  //   -> 3,4 drains (LOW to cross) -> 2,4 Small Key 1 -> 4,4 Small Key 2
  //   -> 3,3 locked -> 2,3 2,2 valve wing (Small Key 3) -> 4,3 Bogmaw (miniboss)
  //   -> 5,3 big chest: Power Bracelet -> 4,2 Boss Key -> 3,2 boss door
  //   -> 3,1 Gloomtide
  registerMap({
    id: 'd3',
    kind: 'dungeon',
    name: 'Bogwater Sanctum',
    w: 8, h: 8, floors: 1,
    legend: 'dungeon',
    music: 'dungeon',
    tint: 'cave',
    scroll: false,
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
      '0,2,1': {
        name: 'West Reliquary',
        map: [
          '##########',
          '##########',
          '##......##',
          '##..22....',
          '##..22....',
          '##......##',
          '##########',
          '##########',
        ],
        entities: [
          ['pickup', 4, 3, { kind: 'fairy' }],
        ],
      },
      '0,2,2': {
        name: 'Flooded Cell',
        map: [
          '##########',
          '##########',
          '##.6666.##',
          '##.6666...',
          '##.7777...',
          '##......##',
          '####..####',
          '####..####',
        ],
        entities: [
          ['pickup', 4, 5, { kind: 'key' }],
          ['jellyfish', 4, 2],
        ],
      },
      '0,2,3': {
        name: 'Valve Passage',
        map: [
          '####..####',
          '####..####',
          '##......##',
          '#._____...',
          '#.........',
          '##......##',
          '####..####',
          '####..####',
        ],
        entities: [
          ['valve', 4, 2, { saveKey: 'd3_valve' }],
          ['keese', 6, 4],
        ],
      },
      '0,2,4': {
        name: 'Silt Cell',
        map: [
          '####..####',
          '####..####',
          '##.2222.##',
          '##.2222...',
          '##.2222...',
          '##.2222.##',
          '####..####',
          '####..####',
        ],
        entities: [
          ['zol', 2, 2],
          ['zol', 5, 4],
          ['leever', 4, 3],
        ],
        puzzle: {
          enemies: true,
          flag: 'd3_silt',
          reward: { spawn: [['pickup', 4, 3, { kind: 'key' }]], say: 'The silt gives up a key.' },
        },
      },
      '0,2,5': {
        name: 'Map Cell',
        map: [
          '####..####',
          '####..####',
          '##......##',
          '##........',
          '##........',
          '##..pp..##',
          '##########',
          '##########',
        ],
        entities: [
          ['pickup', 4, 3, { kind: 'dungeonMap' }],
          ['zol', 6, 2],
        ],
      },
      '0,3,1': {
        name: 'Gloomtide, the Lantern Bog',
        map: [
          '##########',
          '#........#',
          '#........#',
          '.....<....',
          '.....<....',
          '#....<...#',
          '#........#',
          '####..####',
        ],
        noTide: true,
        entities: [
          ['gloomtide', 4, 2],
        ],
        script: {
          onEvent(game, name) {
            if (name === 'bossDead') game.spawnPickup(80, 40, 'heartContainer', { grabDelay: 30 });
          },
        },
      },
      '0,3,2': {
        name: 'Sanctum Gate',
        map: [
          '####..####',
          '#........#',
          '####B#####',
          '.........#',
          '..22..22.#',
          '#........#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['leever', 6, 4],
        ],
      },
      '0,3,3': {
        name: 'Bog Lock',
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
          ['zol', 2, 4],
          ['leever', 6, 5],
        ],
      },
      '0,3,4': {
        name: 'The Drains',
        map: [
          '####..####',
          '#.44..44.#',
          '####L#####',
          '..........',
          '..........',
          '#.444444.#',
          '#.44..44.#',
          '####..####',
        ],
        entities: [
          ['leever', 4, 3],
          ['zol', 2, 2],
        ],
      },
      '0,3,5': {
        name: 'Sunken Nave',
        map: [
          '####..####',
          '#..q..q..#',
          '#.444444.#',
          '..........',
          '..........',
          '#.444444.#',
          '#..q..q..#',
          '####..####',
        ],
        entities: [
          ['zol', 4, 2],
          ['keese', 2, 5],
          ['barnacle', 7, 3],
          ['switch', 1, 2],
          ['switch', 8, 2],
          ['block', 1, 3],
          ['block', 8, 3],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd3_035_puzzle',
          reward: {
            spawn: [['pickup', 4, 3, { kind: 'bomb4' }]],
            say: 'A cache opens in the wall.',
          },
        },
      },
      '0,3,6': {
        name: 'Reed Landing',
        map: [
          '####..####',
          '#.4....4.#',
          '#.4....4.#',
          '#........#',
          '#........#',
          '#.4____4.#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['zol', 3, 3],
          ['leever', 6, 4],
          ['torch', 1, 1],
          ['torch', 8, 1],
          ['torch', 1, 6],
        ],
        puzzle: {
          torches: 'all',
          flag: 'd3_036_puzzle',
          reward: {
            spawn: [['pickup', 4, 3, { kind: 'rupee20' }]],
            say: 'A catch lets go under the floor.',
          },
        },
      },
      '0,3,7': {
        name: 'Sanctum Door',
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
          { x: 4, y: 7, to: { map: 'overworld', floor: 0, rx: 1, ry: 8, px: 64, py: 32, dir: 'down' } },
        ],
        readable: [
          [2, 3, 'Bog-script: "The water runs one way, at one height."'],
        ],
      },
      '0,4,1': {
        name: 'East Reliquary',
        map: [
          '##########',
          '##########',
          '##......##',
          '....44..##',
          '....44..##',
          '##......##',
          '##########',
          '##########',
        ],
        entities: [
          ['pickup', 4, 3, { kind: 'rupee20' }],
          ['barnacle', 2, 2],
        ],
      },
      '0,4,2': {
        name: 'Bosskey Sump',
        map: [
          '##########',
          '##########',
          '##......##',
          '#._____..#',
          '#........#',
          '##.4444.##',
          '####..####',
          '####..####',
        ],
        entities: [
          ['chest', 2, 2, { pickup: 'bossKey' }],
          ['zol', 6, 4],
        ],
      },
      '0,4,3': {
        name: 'Bogmaw Hollow',
        map: [
          '####..####',
          '##......##',
          '####L#####',
          '..........',
          '...""""...',
          '##......##',
          '##......##',
          '####..####',
        ],
        entities: [
          ['bogmaw', 4, 3],
        ],
        puzzle: {
          enemies: true,
          flag: 'd3_bogmaw',
          reward: { say: 'The bog closes over the maw and is still.' },
        },
      },
      '0,4,4': {
        name: 'Torchlit Cell',
        map: [
          '####..####',
          '####..####',
          '##...>..##',
          '.....>..##',
          '.....>..##',
          '##...>..##',
          '####..####',
          '####..####',
        ],
        entities: [
          ['torch', 2, 2],
          ['torch', 7, 5],
          ['zol', 4, 3],
        ],
        puzzle: {
          torches: 'all',
          flag: 'd3_torch',
          reward: { spawn: [['pickup', 4, 4, { kind: 'key' }]], say: 'Light finds the lock.' },
        },
      },
      '0,4,5': {
        name: 'Compass Cell',
        map: [
          '####..####',
          '####..####',
          '##..pp..##',
          '........##',
          '........##',
          '##......##',
          '##########',
          '##########',
        ],
        entities: [
          ['chest', 4, 3, { pickup: 'chartstone' }],
          ['keese', 2, 4],
        ],
      },
      '0,5,3': {
        name: 'Bracelet Vault',
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
          ['chest', 4, 3, { big: true, item: 'cleats', level: 1 }],
        ],
      },
    },
  });

  // --- Dungeon 4: Cliffside Cistern ----------------------------------------
  // Tide theme: drown-walls. At LOW and MID they are walls; at HIGH they are
  // deep water you swim straight over. Half this dungeon is only a wall until
  // you raise the sea, and the Flippers found inside turn the trick on itself.
  //
  // Intended route:
  //   3,7 entrance -> 3,6 -> 3,5 hub -> 2,5 Dungeon Map -> 4,5 Small Key 1
  //   -> 3,4 drown-wall gallery -> 2,4 Compass -> 4,4 Small Key 2
  //   -> 3,3 locked -> 2,3 2,2 west wing (Small Key 3)
  //   -> 4,3 Ironknight (miniboss) -> 5,3 big chest: Zora's Flippers
  //   -> 4,2 Boss Key, reached by swimming the drown-wall at HIGH
  //   -> 3,2 boss door -> 3,1 Wyverna
  registerMap({
    id: 'd4',
    kind: 'dungeon',
    name: 'Cliffside Cistern',
    w: 8, h: 8, floors: 1,
    legend: 'dungeon',
    music: 'dungeon2',
    tint: 'cave',
    scroll: false,
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
      '0,2,1': {
        name: 'West Overlook',
        map: [
          '##########',
          '##########',
          '##......##',
          '##..99....',
          '##..99....',
          '##......##',
          '##########',
          '##########',
        ],
        entities: [
          ['pickup', 4, 3, { kind: 'fairy' }],
        ],
      },
      '0,2,2': {
        name: 'Overflow Cell',
        map: [
          '##########',
          '##########',
          '##.9999.##',
          '##........',
          '##........',
          '##.9999.##',
          '####..####',
          '####..####',
        ],
        entities: [
          ['pickup', 4, 3, { kind: 'key' }],
          ['tektite', 6, 4],
        ],
      },
      '0,2,3': {
        name: 'West Cistern',
        map: [
          '####..####',
          '####..####',
          '##......##',
          '#.........',
          '#._____...',
          '##......##',
          '####..####',
          '####..####',
        ],
        entities: [
          ['darknut', 4, 3],
        ],
        puzzle: {
          enemies: true,
          flag: 'd4_023_puzzle',
          reward: {
            spawn: [['pickup', 4, 2, { kind: 'heart' }]],
            say: 'Water drains out of a niche in the wall.',
          },
        },
      },
      '0,2,4': {
        name: 'Compass Vault',
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
          ['stalfos', 6, 4],
        ],
      },
      '0,2,5': {
        name: 'Map Vault',
        map: [
          '####..####',
          '####..####',
          '##......##',
          '##........',
          '##........',
          '##..pp..##',
          '##########',
          '##########',
        ],
        entities: [
          ['pickup', 4, 3, { kind: 'dungeonMap' }],
          ['keese', 6, 2],
        ],
      },
      '0,3,1': {
        name: 'Wyverna, the Sea Wyvern',
        map: [
          '##########',
          '#........#',
          '#........#',
          '.....>....',
          '.....>....',
          '#....>...#',
          '#........#',
          '####..####',
        ],
        noTide: true,
        entities: [
          ['wyverna', 4, 2],
        ],
        script: {
          onEvent(game, name) {
            if (name === 'bossDead') game.spawnPickup(80, 40, 'heartContainer', { grabDelay: 30 });
          },
        },
      },
      '0,3,2': {
        name: 'Cistern Gate',
        map: [
          '####..####',
          '#........#',
          '####B#####',
          '.........#',
          '..99..99.#',
          '#........#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['tektite', 6, 4],
        ],
      },
      '0,3,3': {
        name: 'Cistern Lock',
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
          ['stalfos', 2, 4],
          ['keese', 6, 5],
        ],
      },
      '0,3,4': {
        name: 'Drownwall Gallery',
        map: [
          '####..####',
          '#.99..99.#',
          '####L#####',
          '..9....9..',
          '..9....9..',
          '#........#',
          '#.99..99.#',
          '####..####',
        ],
        entities: [
          ['tektite', 4, 3],
          ['keese', 2, 2],
        ],
      },
      '0,3,5': {
        name: 'Deep Cistern',
        // The Squall Bellows' room. The sluice wheel sits behind a drowned
        // wall: solid at LOW and MID, deep at HIGH, so there is no tide level
        // at which you can stand next to it and turn it by hand. A sustained
        // gust crosses the wall and it does not.
        map: [
          '####..####',
          '#..q..q..#',
          '#.999999.#',
          '..........',
          '..........',
          '#.999999.#',
          '#..q..q..#',
          '####..####',
        ],
        script: {
          onEvent(game, name, data) {
            if (name === 'valve' && data && data.open) {
              game.spawnPickup(32, 96, 'key', { grabDelay: 14 });
            }
          },
        },
        entities: [
          ['wheel', 2, 1, { saveKey: 'd4Sluice' }],
          ['tektite', 4, 2],
          ['stalfos', 2, 5],
          ['switch', 1, 2],
          ['switch', 8, 2],
          ['block', 1, 3],
          ['block', 8, 3],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd4_035_puzzle',
          reward: {
            spawn: [['pickup', 4, 3, { kind: 'rupee5' }]],
            say: 'Loose stone shifts, and something rolls out.',
          },
        },
      },
      '0,3,6': {
        name: 'Cistern Landing',
        map: [
          '####..####',
          '#.9....9.#',
          '#.9....9.#',
          '#..""""..#',
          '#........#',
          '#.9____9.#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['tektite', 3, 3],
          ['keese', 6, 4],
          ['torch', 1, 1],
          ['torch', 8, 1],
          ['torch', 1, 6],
        ],
        puzzle: {
          torches: 'all',
          flag: 'd4_036_puzzle',
          reward: {
            spawn: [['pickup', 4, 3, { kind: 'fairy' }]],
            say: 'A light comes up out of the water.',
          },
        },
      },
      '0,3,7': {
        name: 'Cistern Head',
        map: [
          '####..####',
          '#........#',
          '#.p....p.#',
          '#........#',
          '#.99..99.#',
          '#........#',
          '#........#',
          '####/#####',
        ],
        warps: [
          { x: 4, y: 7, to: { map: 'overworld', floor: 0, rx: 1, ry: 3, px: 64, py: 32, dir: 'down' } },
        ],
        readable: [
          [2, 3, 'Chiselled deep: "A wall at low water is a door at high."'],
        ],
      },
      '0,4,1': {
        name: 'East Overlook',
        map: [
          '##########',
          '##########',
          '##......##',
          '....99..##',
          '....99..##',
          '##......##',
          '##########',
          '##########',
        ],
        entities: [
          ['pickup', 4, 3, { kind: 'rupee20' }],
          ['keese', 2, 2],
        ],
      },
      '0,4,2': {
        name: 'Bosskey Cistern',
        map: [
          '##########',
          '##########',
          '##.9999.##',
          '#........#',
          '##.9999.##',
          '##......##',
          '####..####',
          '####..####',
        ],
        entities: [
          ['chest', 4, 2, { pickup: 'bossKey' }],
          ['stalfos', 6, 5],
        ],
      },
      '0,4,3': {
        name: 'Ironknight Hall',
        map: [
          '####..####',
          '##......##',
          '####L#####',
          '..........',
          '...""""...',
          '##......##',
          '##......##',
          '####..####',
        ],
        entities: [
          ['ironknight', 4, 3],
        ],
        puzzle: {
          enemies: true,
          flag: 'd4_ironknight',
          reward: { say: 'The armour folds. Nothing was inside it.' },
        },
      },
      '0,4,4': {
        name: 'Switch Cistern',
        map: [
          '####..####',
          '####..####',
          '##......##',
          '...9..9.##',
          '........##',
          '##......##',
          '####..####',
          '####..####',
        ],
        entities: [
          ['switch', 2, 2],
          ['switch', 7, 5],
          ['block', 2, 3],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd4_switch',
          reward: { spawn: [['pickup', 4, 4, { kind: 'key' }]], say: 'Water gutters through an opening drain.' },
        },
      },
      '0,4,5': {
        name: 'Beamos Cell',
        map: [
          '####..####',
          '####..####',
          '##......##',
          '........##',
          '.....___##',
          '##......##',
          '##########',
          '##########',
        ],
        entities: [
          ['beamos', 4, 3],
          ['stalfos', 2, 4],
          ['stalfos', 7, 2],
        ],
        puzzle: {
          enemies: true,
          flag: 'd4_beamos',
          reward: { spawn: [['pickup', 4, 4, { kind: 'key' }]], say: 'The eye closes. A key drops.' },
        },
      },
      '0,5,3': {
        name: 'Bellows Vault',
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
          ['chest', 4, 3, { big: true, item: 'bellows', level: 1 }],
        ],
      },
    },
  });
}
