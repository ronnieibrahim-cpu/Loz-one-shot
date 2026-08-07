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
  // Tide theme: nothing here is a floor, it is a raft. Tide rocks stand proud at
  // LOW and MID and vanish at HIGH; wells are water at every level and want a
  // raft or the Flippers. The shrine is crossed by choosing which surface you
  // want under you, and the Magic Boomerang inside turns switches you cannot
  // walk to.
  //
  // Intended route:
  //   3,7 entrance -> 3,6 -> 3,5 hub -> 2,5 Dungeon Map -> 4,5 Small Key 1
  //   -> 3,4 raft crossing -> 2,4 Compass -> 4,4 Small Key 2
  //   -> 3,3 locked -> stairs at 2,3 up to floor 1
  //   -> 1F 3,5 -> 4,5 Small Key 3 -> 2,5 Small Key 4 -> 3,4 locked
  //   -> 4,4 Thornvine (miniboss) -> 5,4 big chest: Magic Boomerang
  //   -> 4,3 locked -> 4,2 Boss Key -> 3,2 boss door -> 3,1 Rootmaw
  registerMap({
    id: 'd5',
    kind: 'dungeon',
    name: 'Drowned Wood Shrine',
    w: 8, h: 8, floors: 2,
    legend: 'dungeon',
    music: 'dungeon',
    tint: 'cave',
    scroll: false,
    dungeon: {
      index: 5,
      item: 'reefseed', itemLevel: 1,
      essence: 5,
      boss: 'rootmaw',
      bossRoom: '1,3,1',
      startRoom: '3,7',
      entrance: { map: 'overworld', floor: 0, rx: 5, ry: 4, px: 64, py: 32 },
    },
    rooms: {
      '0,2,3': {
        name: 'Root Stair',
        map: [
          '##########',
          '##....../#',
          '##......##',
          '##...>....',
          '##...>....',
          '##...>..##',
          '####..####',
          '####..####',
        ],
        warps: [
          { x: 8, y: 1, to: { map: 'd5', floor: 1, rx: 3, ry: 5, px: 72, py: 96 } },
        ],
        entities: [
          ['keese', 3, 4],
        ],
      },
      '0,2,4': {
        name: 'Compass Root',
        map: [
          '####..####',
          '####..####',
          '##..88..##',
          '##........',
          '##___.....',
          '##..88..##',
          '####..####',
          '####..####',
        ],
        entities: [
          ['chest', 4, 3, { pickup: 'compass' }],
          ['wisp', 6, 4],
        ],
      },
      '0,2,5': {
        name: 'Map Root',
        map: [
          '####..####',
          '####..####',
          '##......##',
          '##..33....',
          '##..33....',
          '##......##',
          '##########',
          '##########',
        ],
        entities: [
          ['pickup', 4, 3, { kind: 'dungeonMap' }],
          ['keese', 6, 2],
        ],
      },
      '0,3,2': {
        name: 'Lower Reliquary',
        map: [
          '##########',
          '##########',
          '##..88..##',
          '##......##',
          '##_____.##',
          '##..88..##',
          '####..####',
          '####..####',
        ],
        entities: [
          ['pickup', 4, 3, { kind: 'rupee20' }],
          ['wisp', 2, 2],
        ],
      },
      '0,3,3': {
        name: 'Shrine Lock',
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
          ['zol', 6, 5],
        ],
      },
      '0,3,4': {
        name: 'Raft Crossing',
        map: [
          '####..####',
          '#.33..33.#',
          '#.3.88.3.#',
          '..........',
          '..........',
          '#.3.88.3.#',
          '#.33..33.#',
          '####..####',
        ],
        entities: [
          ['raft', 2, 3],
          ['anglerfry', 6, 2],
        ],
      },
      '0,3,5': {
        name: 'Flooded Nave',
        map: [
          '####..####',
          '#..q..q..#',
          '#.333333.#',
          '..3.88.3..',
          '..3.88.3..',
          '#.333333.#',
          '#..q..q..#',
          '####..####',
        ],
        entities: [
          ['jellyfish', 4, 2],
          ['anglerfry', 2, 5],
          ['wisp', 7, 3],
        ],
        puzzle: {
          enemies: true,
          flag: 'd5_035_puzzle',
          reward: {
            spawn: [['pickup', 3, 3, { kind: 'bomb4' }]],
            say: 'A cache opens in the wall.',
          },
        },
      },
      '0,3,6': {
        name: 'Root Landing',
        map: [
          '####..####',
          '#.3....3.#',
          '#.3..>.3.#',
          '#....>...#',
          '#....>...#',
          '#.3..>.3.#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['zol', 3, 3],
          ['keese', 6, 4],
          ['switch', 1, 2],
          ['switch', 8, 2],
          ['block', 1, 3],
          ['block', 8, 3],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd5_036_puzzle',
          reward: {
            spawn: [['pickup', 4, 3, { kind: 'rupee20' }]],
            say: 'A catch lets go under the floor.',
          },
        },
      },
      '0,3,7': {
        name: 'Shrine Door',
        map: [
          '####..####',
          '#........#',
          '#.p....p.#',
          '#........#',
          '#.88..88.#',
          '#........#',
          '#........#',
          '####/#####',
        ],
        warps: [
          { x: 4, y: 7, to: { map: 'overworld', floor: 0, rx: 5, ry: 4, px: 64, py: 32, dir: 'down' } },
        ],
        readable: [
          [2, 3, 'Bark-cut letters: "Stand on nothing. Trust the water."'],
        ],
      },
      '0,4,3': {
        name: 'Drift Cell',
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
          ['anglerfry', 4, 2],
          ['pickup', 6, 4, { kind: 'rupee20' }],
        ],
      },
      '0,4,4': {
        name: 'Torch Root',
        map: [
          '####..####',
          '####..####',
          '##......##',
          '........##',
          '.._____.##',
          '##......##',
          '####..####',
          '####..####',
        ],
        entities: [
          ['torch', 2, 2],
          ['torch', 7, 2],
          ['torch', 2, 5],
          ['torch', 7, 5],
          ['keese', 4, 3],
        ],
        puzzle: {
          torches: 'all',
          flag: 'd5_torches',
          reward: { spawn: [['pickup', 4, 3, { kind: 'key' }]], say: 'Four flames, and the shrine remembers.' },
        },
      },
      '0,4,5': {
        name: 'Thorn Cell',
        map: [
          '####..####',
          '####..####',
          '##......##',
          '........##',
          '........##',
          '##......##',
          '##########',
          '##########',
        ],
        entities: [
          ['stalfos', 2, 2],
          ['stalfos', 7, 2],
          ['zol', 4, 4],
        ],
        puzzle: {
          enemies: true,
          flag: 'd5_thorncell',
          reward: { spawn: [['pickup', 4, 3, { kind: 'key' }]], say: 'The thorns loosen their grip on something bright.' },
        },
      },
      '0,5,3': {
        name: 'Deep Root',
        // The Reefseed's room. The moat is `dWaterD` — deep at LOW, MID and
        // HIGH alike — so the conch does not open it and never will. A seed
        // thrown into it grows a pillar, and the pillar is a step at LOW: you
        // plant, you sound the shell, and then you walk over what you planted.
        map: [
          '##########',
          '##########',
          '##WWWWW.##',
          '...WWWWW##',
          '...WWWWW##',
          '##WWWWW.##',
          '##########',
          '##########',
        ],
        entities: [
          ['jellyfish', 4, 2],
          ['pickup', 7, 2, { kind: 'heartPiece' }],
        ],
      },
      '1,2,3': {
        name: 'West Bough',
        map: [
          '##########',
          '##########',
          '##.8888.##',
          '#.........',
          '##........',
          '##......##',
          '####..####',
          '####..####',
        ],
        entities: [
          ['pickup', 4, 4, { kind: 'fairy' }],
          ['keese', 6, 2],
        ],
      },
      '1,2,4': {
        name: 'Windward Bough',
        map: [
          '####..####',
          '####..####',
          '##.8888.##',
          '##........',
          '##........',
          '##.8888.##',
          '####..####',
          '####..####',
        ],
        entities: [
          ['keese', 4, 3],
          ['pickup', 2, 2, { kind: 'rupee20' }],
        ],
      },
      '1,2,5': {
        name: 'Bough Cell',
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
          ['block', 2, 3],
          ['block', 7, 4],
          ['switch', 2, 2],
          ['switch', 7, 5],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd5_boughs',
          reward: { spawn: [['pickup', 4, 4, { kind: 'key' }]], say: 'The bough swings aside.' },
        },
      },
      '1,3,1': {
        name: 'Rootmaw, the Drowned Tree',
        map: [
          '##########',
          '#........#',
          '#........#',
          '#........#',
          '#........#',
          '#........#',
          '#........#',
          '####..####',
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
      '1,3,2': {
        name: 'Shrine Gate',
        map: [
          '####..####',
          '#........#',
          '####B#####',
          '#........#',
          '#.88..88.#',
          '#........#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['wisp', 6, 4],
        ],
      },
      '1,3,3': {
        name: 'Upper Nave',
        map: [
          '####..####',
          '#........#',
          '#.3..<.3.#',
          '.....<...#',
          '.....<...#',
          '#.3..<.3.#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['jellyfish', 4, 3],
          ['stalfos', 2, 2],
          ['torch', 1, 1],
          ['torch', 8, 1],
          ['torch', 1, 6],
        ],
        puzzle: {
          torches: 'all',
          flag: 'd5_133_puzzle',
          reward: {
            spawn: [['pickup', 4, 2, { kind: 'heart' }]],
            say: 'Water drains out of a niche in the wall.',
          },
        },
      },
      '1,3,4': {
        name: 'Canopy Lock',
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
          ['keese', 2, 4],
          ['wisp', 6, 5],
        ],
      },
      '1,3,5': {
        name: 'Canopy Landing',
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
          { x: 8, y: 1, to: { map: 'd5', floor: 0, rx: 2, ry: 3, px: 112, py: 40 } },
        ],
        entities: [
          ['keese', 3, 4],
        ],
      },
      '1,4,2': {
        name: 'Bosskey Bough',
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
          ['wizzrobe', 6, 4],
        ],
      },
      '1,4,3': {
        name: 'Upper Drift',
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
          ['anglerfry', 4, 3],
        ],
      },
      '1,4,4': {
        name: 'Thornvine Hollow',
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
          ['thornvine', 4, 4],
        ],
        puzzle: {
          enemies: true,
          flag: 'd5_thornvine',
          reward: { say: 'The vine goes slack and slides into the water.' },
        },
      },
      '1,4,5': {
        name: 'Hollow Cell',
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
          ['stalfos', 3, 3],
          ['stalfos', 6, 4],
          ['wizzrobe', 4, 2],
        ],
        puzzle: {
          enemies: true,
          flag: 'd5_hollow',
          reward: { spawn: [['pickup', 4, 3, { kind: 'key' }]], say: 'Something drops out of the hollow.' },
        },
      },
      '1,5,4': {
        name: 'Seedbed Vault',
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
          ['chest', 4, 3, { big: true, item: 'reefseed', level: 1 }],
        ],
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
    legend: 'dungeon',
    music: 'dungeon2',
    tint: 'cave',
    scroll: false,
    dungeon: {
      index: 6,
      item: 'hookshot', itemLevel: 1,
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
          ['chest', 4, 3, { pickup: 'compass' }],
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
          ['chest', 4, 3, { big: true, item: 'hookshot', level: 1 }],
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
    legend: 'dungeon',
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
          ['chest', 4, 3, { pickup: 'compass' }],
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
    legend: 'dungeon',
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
          ['chest', 4, 3, { pickup: 'compass' }],
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
