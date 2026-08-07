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
  //
  // TIDE THEME: TWO LEVELS IN ONE ROOM. This is the Tidewright's Anchor's
  // dungeon and the whole north half is written against its one verb — throw
  // it, and the patch of grotto it lands in stops obeying the conch while
  // everything around it goes on obeying it.
  //
  // The vocabulary the grotto is built out of, at D1's moveset (no Cleats, so
  // deep water is a wall):
  //
  //   '4' dDrain  pit at LOW, wadeable at MID, deep at HIGH  -> MID ONLY
  //   '3' dWell   wadeable at LOW, deep at MID and HIGH      -> LOW ONLY
  //   '1' dSluice dry at LOW, wadeable at MID, deep at HIGH  -> LOW or MID
  //   '2' dBasin  dry, damp, then wadeable                   -> always
  //
  // '4' and '3' are exact opposites and that is the dungeon. A route that
  // crosses both cannot be walked at any single tide level, so the north half
  // is a run of rooms shaped:
  //
  //     row k     the GATE   '3' (or '4')  — passable only at the BASE level
  //     row k+1   the SHELF  '4' (or '3')  — passable only at the HELD level
  //     row k+2   the SHELF
  //     row k+3   the BANK   plain floor   — where you stand and throw
  //
  // The anchor's patch is a square of radius ANCHOR_RADIUS_TILES (2), so an
  // anchor laid on the BANK holds rows k+1..k+5 and leaves the GATE on row k
  // to the conch. THAT SPACING IS THE PUZZLE AND IT IS LOAD-BEARING: put the
  // gate one row closer and the patch swallows it, the gate freezes with the
  // shelf, and the room becomes unsolvable while still validating. The throw
  // is cardinal and carries about three tiles, so the reliable move is to
  // stand on the bank and throw ALONG it — that lands the anchor on the bank
  // row, which is what the spacing above is measured from.
  //
  // tools/check-anchor.mjs proves both halves of that for every gated room: no
  // single tide level opens the route, and some anchor placement does.
  //
  // Intended route (26 rooms, 2 floors, the Anchor at room 13 of 26):
  //   0,3,7 entrance -> 3,6 (the conch: the floor is water, let it out)
  //   -> 3,5 hub -> 2,5 Dungeon Map -> 2,4 Crab Pit (Small Key 1)
  //   -> 4,5 Chartstone -> 4,4 Switch Room (Small Key 2)
  //   -> 3,4 Tide Gallery: locked door north, and stairs down to the Undercroft
  //   -> 1F: 3,4 landing -> 2,4 / 4,4 side cells -> 3,3 locked -> 3,2 BIG CHEST:
  //      the Tidewright's Anchor
  //   -> back up, through 3,4's locked door -> 3,3 Held Water (the first gate)
  //   -> east wing 4,3 -> 5,3 -> 5,2 Clawcrab (miniboss)
  //   -> west wing 2,3 -> 1,3 (Small Key 3) -> 1,2 -> 2,2 -> 2,1
  //   -> 4,2 Anchorage: locked door -> Boss Key, and 4,1
  //   -> 3,2 Storm Gate -> boss door -> 3,1 Gohmaraq
  registerMap({
    id: 'd1',
    kind: 'dungeon',
    name: 'Tidewash Grotto',
    w: 8, h: 8, floors: 2,
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

      // ===================================================================
      // Floor 0 — the grotto. South half is the conch alone; north half is
      // the Anchor, every room of it.
      // ===================================================================

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

      '0,3,6': {
        name: 'Drowned Landing',
        // The first lesson and it is the conch's, not the anchor's: the floor
        // is under water and there is no way north until you let the sea out.
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

      '0,3,5': {
        name: 'Sunken Hall',
        // The hub. Its four ways out are cut by sluice channels, so at HIGH
        // water the hall is a dead end in three directions — the first time
        // the game asks you to think about where the tide is before you move.
        map: [
          '####..####',
          '#..q..q..#',
          '#........#',
          '...1..1...',
          '...1..1...',
          '#........#',
          '#..q..q..#',
          '####..####',
        ],
        entities: [
          ['zol', 4, 5],
          ['crab', 2, 2],
          ['crab', 7, 2],
        ],
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

      '0,2,4': {
        name: 'Crab Pit',
        // Small Key 1. The sluice floor is dry at LOW and a swimming pool at
        // HIGH, so the fight is one you choose the footing for.
        map: [
          '##########',
          '##########',
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
          reward: {
            spawn: [['pickup', 4, 3, { kind: 'key' }]],
            say: 'Something clatters onto the wet stone.',
          },
        },
      },

      '0,4,5': {
        name: 'Chart Alcove',
        // The Chartstone. The pots are BELOW the chest on purpose: a chest
        // spawns its prize one tile ABOVE itself with no check that the tile
        // is standable, and a pot up there made the old Compass uncollectable
        // for the whole life of the room. See docs/HANDOFF.md.
        map: [
          '####..####',
          '####..####',
          '##......##',
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

      '0,4,4': {
        name: 'Switch Room',
        // Small Key 2. The way back out south is under the sluice band, so
        // solving this at HIGH leaves you shut in until you drop the water.
        map: [
          '##########',
          '##########',
          '##......##',
          '...=..=.##',
          '........##',
          '##.1111.##',
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
          reward: {
            spawn: [['pickup', 4, 4, { kind: 'key' }]],
            say: 'A catch releases somewhere below.',
          },
        },
      },

      '0,3,4': {
        name: 'Tide Gallery',
        // The junction. North is locked; the stairs in the west corner go
        // down to the Undercroft, and the Anchor is at the bottom of them.
        map: [
          '####..####',
          '#..2..2..#',
          '####L#####',
          '..........',
          '..........',
          '#.2....2.#',
          '#.2..../.#',
          '####..####',
        ],
        warps: [
          { x: 7, y: 6, to: { map: 'd1', floor: 1, rx: 3, ry: 4, px: 64, py: 32, dir: 'down' } },
        ],
        // No enemies. The stairs are a warp tile sitting in an open room, and
        // anything that can chase the player across it — or be chased — turns a
        // junction into a trapdoor. It reads as a quiet gallery, which is what
        // a room with a notice board on the wall should read as anyway.
        readable: [
          [5, 6, 'A tidewright\'s notice: "Down. The well does not answer the moon."'],
        ],
      },

      // ---- the north half. Everything below here is the Anchor's. --------

      '0,3,3': {
        name: 'Held Water',
        // GATE ROOM 1, and the one that teaches the shape. Bank on row 5,
        // shelf of '4' on rows 3-4, gate of '3' on row 2, and a Piece of
        // Heart in the alcove behind it. Stand on the bank at MID, throw the
        // anchor along the bank, let the sea out to LOW, and walk up over
        // water that is still where you left it.
        map: [
          '##########',
          '#..,,,,..#',
          '#33333333#',
          '#44444444#',
          '#44444444#',
          '..........',
          '#..q..q..#',
          '####..####',
        ],
        entities: [
          ['keese', 3, 6],
          ['zol', 6, 6],
        ],
        readable: [
          [1, 5, 'Cut into the shelf: "Hold the water you need. Let the rest go."'],
          [4, 1, 'The alcove is dry, and has been for a long time.'],
        ],
        anchorGate: { from: [4, 6], to: [4, 1] },
      },

      '0,4,3': {
        name: 'Shell Corridor',
        // GATE ROOM 2, turned ninety degrees: the shelf is three COLUMNS and
        // the gate is the column past it, so the anchor goes down with a
        // throw up or down the corridor rather than along it.
        map: [
          '##########',
          '#..4443..#',
          '#..4443..#',
          '#..4443..#',
          '...4443...',
          '...4443...',
          '#..4443..#',
          '##########',
        ],
        entities: [
          ['crab', 1, 4],
          ['tektite', 8, 2],
        ],
        anchorGate: { from: [1, 4], to: [8, 4] },
      },

      '0,5,3': {
        name: 'Barnacle Bend',
        // GATE ROOM 3, polarity reversed: the shelf is '3' and only exists at
        // LOW, and the gate is a single '4' door that only exists at MID. Hold
        // the low water under you and raise the sea to open the door.
        map: [
          '####..####',
          '#####4####',
          '#33333333#',
          '#33333333#',
          '..........',
          '#..p..p..#',
          '#........#',
          '##########',
        ],
        entities: [
          ['barnacle', 2, 5],
          ['barnacle', 7, 5],
          ['crab', 4, 4],
        ],
        anchorGate: { from: [4, 5], to: [5, 0] },
      },

      '0,5,2': {
        name: 'Clawcrab Den',
        // Miniboss, two thirds of the way in. The basin floor is dry at LOW
        // and wadeable at HIGH, so the fight has a footing you pick — and the
        // chain sweep is the anchor's combat verb, which is what this room is
        // for.
        map: [
          '##########',
          '#........#',
          '#..2222..#',
          '#..2222..#',
          '...2222..#',
          '#..2222..#',
          '#........#',
          '#####.####',
        ],
        entities: [
          ['clawcrab', 5, 3],
        ],
        puzzle: {
          enemies: true,
          flag: 'd1_clawcrab',
          reward: {
            spawn: [['pickup', 5, 5, { kind: 'heartPiece' }]],
            say: 'The claw stops moving. The way west is quiet.',
          },
        },
      },

      '0,2,3': {
        name: 'Weeping Wall',
        // GATE ROOM 4. The west wing, and the mirror of Held Water: the shelf
        // is '3' held at LOW and the gate is '4' opened by raising the sea.
        map: [
          '####..####',
          '#........#',
          '#44444444#',
          '#33333333#',
          '#33333333#',
          '..........',
          '#........#',
          '##########',
        ],
        entities: [
          ['zol', 3, 5],
          ['keese', 6, 6],
        ],
        anchorGate: { from: [4, 6], to: [4, 0] },
      },

      '0,1,3': {
        name: 'Cistern Corner',
        // Small Key 3, on the floor of the room, and a gate north to the old
        // sluice. The switches are the plain kind — the tide work here is the
        // gate, not the catch.
        map: [
          '####..####',
          '#........#',
          '#33333333#',
          '#44444444#',
          '#44444444#',
          '#.........',
          '#........#',
          '##########',
        ],
        entities: [
          ['crab', 4, 6],
          ['switch', 2, 6],
          ['switch', 7, 6],
          ['block', 2, 5],
          ['block', 7, 5],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd1_013_puzzle',
          reward: {
            spawn: [['pickup', 4, 6, { kind: 'key' }]],
            say: 'A catch lets go under the floor.',
          },
        },
        anchorGate: { from: [4, 6], to: [4, 0] },
      },

      '0,1,2': {
        name: 'Old Sluice',
        // The valve is the grotto's own answer to the anchor and it is a much
        // worse one: it moves a single stuck door, once, and only here.
        map: [
          '##########',
          '#........#',
          '#.2222...#',
          '#.2222....',
          '#.2222....',
          '#......#D#',
          '#......#.#',
          '####..####',
        ],
        entities: [
          ['valve', 2, 1, { saveKey: 'd1_valve' }],
          ['pickup', 8, 6, { kind: 'fairy' }],
          ['keese', 7, 1],
        ],
        script: {
          onEvent(game, name, data) {
            if (name !== 'valve' || !data || !data.open) return;
            game.room.setTile(8, 5, 'dDoorOpen');
            game.persistTile(8, 5, 'dDoorOpen');
          },
        },
        readable: [
          [7, 2, 'A rusted plate: "Shut the sluice, and the grotto drinks."'],
        ],
      },

      '0,2,2': {
        name: 'Drip Passage',
        map: [
          '####..####',
          '#..q..q..#',
          '#........#',
          '...1111..#',
          '...1111..#',
          '#........#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['keese', 4, 1],
          ['zol', 6, 5],
          ['torch', 1, 2],
          ['torch', 8, 2],
          ['torch', 1, 5],
        ],
        puzzle: {
          torches: 'all',
          flag: 'd1_022_puzzle',
          reward: {
            spawn: [['pickup', 4, 2, { kind: 'heart' }]],
            say: 'Water drains out of a niche in the wall.',
          },
        },
      },

      '0,2,1': {
        name: 'North Cell',
        // GATE ROOM 5, and the tightest: the bank is the doorway itself, so
        // the anchor has to be thrown into the wall beside you.
        map: [
          '##########',
          '##########',
          '##......##',
          '##333333##',
          '##444444##',
          '##444444##',
          '##......##',
          '####..####',
        ],
        entities: [
          ['keese', 3, 2],
        ],
        readable: [
          [6, 2, 'Somebody scratched a tally here and stopped counting.'],
        ],
        anchorGate: { from: [4, 6], to: [4, 2] },
      },

      '0,4,2': {
        name: 'Anchorage',
        // The Boss Key, behind the third locked door.
        map: [
          '####..####',
          '#........#',
          '####L#####',
          '#.2222...#',
          '..2222....',
          '#.2222...#',
          '#..pp....#',
          '##########',
        ],
        entities: [
          ['chest', 6, 1, { pickup: 'bossKey' }],
          ['keese', 2, 4],
        ],
      },

      '0,4,1': {
        name: 'East Cell',
        map: [
          '##########',
          '##########',
          '##......##',
          '##.1111.##',
          '##.1111.##',
          '##......##',
          '####..####',
          '####..####',
        ],
        entities: [
          ['pickup', 4, 2, { kind: 'fairy' }],
        ],
      },

      '0,3,2': {
        name: 'Storm Gate',
        map: [
          '####..####',
          '#........#',
          '####B#####',
          '#........#',
          '#.11..11..',
          '#.11..11.#',
          '#........#',
          '##########',
        ],
        entities: [
          ['zol', 2, 6],
          ['keese', 7, 6],
        ],
      },

      '0,3,1': {
        name: 'Gohmaraq, the Tidewash Claw',
        // A boss room that KEEPS the mechanic instead of switching it off. The
        // conch is still suppressed — `noTide` — so the arena is whatever it
        // was when you walked in, and the only things that move it are an
        // anchor laid before the door shut and a Bottled Tide. See
        // docs/ITEMS.md.
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

      // ===================================================================
      // Floor 1 — the Undercroft. Reached by the stairs in 0,3,4 and left the
      // same way; the Anchor is at the top of it behind the second locked
      // door. Everything down here is still conch-only, on purpose: it is the
      // last stretch of the game that is.
      // ===================================================================

      '1,3,4': {
        name: 'Undercroft Landing',
        map: [
          '####..####',
          '#........#',
          '#........#',
          '..111111..',
          '..111111..',
          '#......./#',
          '#........#',
          '##########',
        ],
        warps: [
          { x: 8, y: 5, to: { map: 'd1', floor: 0, rx: 3, ry: 4, px: 96, py: 96, dir: 'down' } },
        ],
        entities: [
          ['keese', 2, 6],
          ['zol', 6, 6],
        ],
      },

      '1,2,4': {
        name: 'Silt Store',
        // The drain floor is an open pit at LOW and deep at HIGH, so there is
        // exactly one height at which this room has a floor at all.
        map: [
          '##########',
          '#........#',
          '#..4444..#',
          '#..4444...',
          '#..4444...',
          '#..4444..#',
          '#........#',
          '##########',
        ],
        entities: [
          ['zol', 4, 1],
          ['crab', 4, 6],
        ],
        puzzle: {
          enemies: true,
          flag: 'd1_124_puzzle',
          reward: {
            spawn: [['pickup', 4, 6, { kind: 'rupee20' }]],
            say: 'Loose stone shifts, and something rolls out.',
          },
        },
      },

      '1,4,4': {
        name: 'The Sump',
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
          ['pickup', 4, 1, { kind: 'heart' }],
          ['barnacle', 2, 6],
        ],
        readable: [
          [7, 6, 'The sump never empties. Somebody wrote "GOOD" beside that.'],
        ],
      },

      '1,3,3': {
        name: 'Undercroft Lock',
        map: [
          '####..####',
          '#........#',
          '####L#####',
          '#........#',
          '#.111111.#',
          '#.111111.#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['keese', 2, 3],
          ['zol', 7, 6],
        ],
      },

      '1,3,2': {
        name: "The Tidewright's Well",
        map: [
          '##########',
          '#........#',
          '#.222222.#',
          '#.222222.#',
          '#.222222.#',
          '#........#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['chest', 4, 3, { big: true, item: 'anchor', level: 1 }],
        ],
        readable: [
          [2, 6, 'The tidewright\'s mark: "The moon owns the sea. This owns a piece of it."'],
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
