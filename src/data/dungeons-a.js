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
// A PUSH BLOCK MOVES EXACTLY ONE TILE, EVER — UNLESS IT SAYS `once: false`
// (S204: Seasons' own $10-$12 blocks stay pushable, and Ages builds rooms on
// them; a room built on those declares `blockRoom` and check-blocks.mjs
// searches it). Otherwise `PushBlock` takes `once: true` by
// default and sets `moved` when its single slide lands, so a block placed two
// tiles from the switch it is meant to cover can never reach it. Every `block`
// in a `switches` puzzle is therefore seated orthogonally ADJACENT to its
// switch, with plain floor behind it for the player to push from. Where a room
// has fewer blocks than switches the player stands on the last one. This was
// wrong in every switch room in the game at one point, and each of those rooms
// rewards a Small Key, so it silently cost the dungeon a key.

import { registerMap } from '../world/maps.js';
import { F } from '../world/tileset.js';

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
      entrance: { map: 'overworld', floor: 0, rx: 11, ry: 8, px: 64, py: 32 },
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
          { x: 7, y: 10, to: { map: 'overworld', floor: 0, rx: 11, ry: 8, px: 64, py: 32, dir: 'down' } },
        ],
        readable: [
          [3, 7, 'Carved by the door: "The sea took this floor. Take it back!"'],
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
          [13, 9, 'A rusted plate: "Lower the sea, and you can wade across."'],
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
        // PICK THE RIGHT ONE (S204, docs/briefs/PUZZLE-PASS.md kind H). Seasons'
        // Ancient Ruins has a button that is right or wrong on a coin flip
        // (scriptHelper.s D6getRandomButtonResult) and lets ropes loose when
        // it is wrong. Here the sea decides, and you can see it: each plate
        // stands in its own pool, a well (`3`, ankle-deep at LOW), a sluice
        // (`1`, at MID) and a basin (`2`, at HIGH), so at every sea exactly
        // one plate is in wading water. Pressed there it stays down; pressed
        // dry it lets two keese loose and every plate comes back up. All
        // three down is the fairy. The pools sit in three corners, clear of
        // the hub's four doors, so the hall crosses as it always did.
        // `tools/check-tideplates.mjs` proves it in the engine.
        map: [
          '#######.#######',
          '#.333.....111.#',
          '#.333.....111.#',
          '#.333.....111.#',
          '#.............#',
          '...............',
          '#.............#',
          '#.222.........#',
          '#.222.........#',
          '#.222.........#',
          '#######.#######',
        ],
        entities: [
          ['zol', 7, 3],
          ['crab', 11, 7],
          ['switch', 3, 2],
          ['switch', 11, 2],
          ['switch', 3, 8],
        ],
        readable: [
          [13, 9, 'Scratched by the pools: "Ankle-deep, or not at all."'],
        ],
        tidePlates: { plates: [[3, 2, 0], [11, 2, 1], [3, 8, 2]], loose: [[7, 2], [7, 8]] },
        script: {
          onEvent(game, name, sw) {
            const room = game.room;
            if (name !== 'switch' || !sw || !sw.pressed || room._puzzleDone) return;
            const tx = Math.floor(sw.cx / 16), ty = Math.floor(sw.cy / 16);
            const f = room.flagsAt(tx, ty, game.tide);
            if ((f & F.WATER) && !(f & F.DEEP)) { sw.hold = false; return; }
            for (const e of game.entities) {
              if (e !== sw && e.hold === false && e.spriteName && 'pressed' in e) { e.hold = true; e.pressed = false; }
            }
            game.applyReward({ spawn: room.def.tidePlates.loose.map(([x, y]) => ['keese', x, y]), sfx: 'deny' });
          },
        },
        puzzle: {
          flag: 'd1_035_puzzle',
          condition: (g, r) => r.def.tidePlates.plates.every(([x, y]) =>
            g.entities.some(e => 'pressed' in e && e.pressed && e.hold === false
              && Math.floor(e.cx / 16) === x && Math.floor(e.cy / 16) === y)),
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
          ['chest', 7, 5, { pickup: 'dungeonMap' }],
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
        // THE FIRST REAL BLOCK PUZZLE (S204, docs/briefs/PUZZLE-PASS.md A).
        // Ages' Crown Dungeon builds rooms on blocks pushed many times; this
        // is ours, with the sea in it. Each plate sits in a one-tile pocket of
        // the dais, and each pocket has ONE mouth: the west a well (`3`,
        // shallow only at LOW), the east a drain (`4`, an open hole at LOW
        // that a block goes down, shallow at MID). A block crosses shallow
        // water and refuses deep, so no single sea fills both pockets: push
        // one in at LOW, sound the conch, push the other in at MID. Drop one
        // down the drain and the room comes back when you leave.
        // `tools/check-blocks.mjs` searches it in the engine.
        map: [
          '###############',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#....=====....#',
          '.....3.=.4....#',
          '#....=====....#',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['switch', 6, 5],
          ['switch', 8, 5],
          ['block', 4, 3, { once: false }],
          ['block', 10, 7, { once: false }],
        ],
        blockRoom: { pockets: [[6, 5], [8, 5]], seas: [0, 1] },
        puzzle: {
          switches: 'all',
          blocks: [[6, 5], [8, 5]],
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
          [3, 3, 'The sluicegate plate: "Drop the Anchor where you want the water to stay put."'],
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
        // THE BLOCK PUZZLE'S STEP UP (S204): the Switch Room's two bands laid
        // end to end in one lane, the gate primitive above with a block in
        // it. The block crosses the four wells only at LOW and the drains only
        // at MID, and there is no dry tile between them to change the sea
        // from — so the Anchor holds the wells at LOW while the conch raises
        // the drains, and Link walks the held wells behind the block. Without
        // it the block sits on the last well and Link cannot stand behind it.
        map: [
          '#######.#######',
          '#.............#',
          '#.............#',
          '#.............#',
          '#..========...#',
          '#..333344.=...#',
          '#..========...#',
          '#.............#',
          '#.............#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['crab', 7, 9],
          ['switch', 9, 5],
          ['block', 2, 2, { once: false }],
        ],
        blockRoom: { door: [7, 0], pockets: [[9, 5]], seas: [0, 1], anchor: { at: [4, 5], from: [2, 5], level: 0 } },
        puzzle: {
          switches: 'all',
          blocks: [[9, 5]],
          flag: 'd1_013_puzzle',
          reward: {
            spawn: [['pickup', 7, 3, { kind: 'rupee20' }]],
            say: 'A catch lets go under the floor.',
          },
        },
      },
      '0,1,1': {
        name: 'The Drip Vault',
        // THE GAUGES' STEP UP (S205). Three marks: the two wells in the floor
        // empty, and the basin between the lion masks full. The basin is set
        // into the masonry three tiles from any floor, so no bite's patch
        // reaches it and only the sea fills it: the base has to be HIGH. Then
        // ONE iron has to hold both wells at LOW, and they are four apart — so
        // it goes in the gap between them, not on either. The Two Gauges
        // teaches that the held patch has an edge; this room, that it is an
        // area. tools/check-anchor.mjs proves the iron on any one mark opens
        // nothing and the basin is the sea's alone.
        map: [
          '###############',
          '#....#M3M#....#',
          '#....#####....#',
          '#....#####....#',
          '#.............#',
          '#.............D',
          '#....3...3....#',
          '#.............#',
          '#.............#',
          '#..pp.........#',
          '#######.#######',
        ],
        entities: [
          ['keese', 3, 3],
        ],
        readable: [
          [12, 4, 'Three marks beside the door: both wells empty, the basin full.'],
        ],
        puzzle: {
          condition: (g, r) => r.def.anchorGauges.marks.every(([x, y, l]) => g.tide.levelAt(x, y, r) === l),
          flag: 'd1_gauges_west',
          reward: {
            openDoors: [[14, 5]],
            say: 'All three marks read at once. The door gives.',
          },
        },
        anchorGauges: { marks: [[5, 6, 0], [9, 6, 0], [7, 1, 2]], door: [14, 5], from: [7, 9] },
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
      entrance: { map: 'overworld', floor: 0, rx: 15, ry: 5, px: 64, py: 32 },
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
          { x: 7, y: 10, to: { map: 'overworld', floor: 0, rx: 15, ry: 5, px: 64, py: 32, dir: 'down' } },
        ],
        readable: [
          [2, 7, 'Coral script over the door: "Rising water carries you up. Falling water shows the way. Look before you drop!"'],
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
          ['chest', 6, 5, { pickup: 'dungeonMap' }],
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
        // THE RED AND BLUE BLOCKS (S205), taught. Every tide change swaps
        // which colour stands. The plate is up past three bands: the wells
        // (LOW only), the red, the middle row of sluice, the blue and the
        // drains (MID only). The middle row floods at HIGH, so it allows ONE
        // press, LOW to MID — and that one press has to drop the blue as it
        // fills the drains. So the blocks are set in the hall first: LOW with
        // red down. The plate opens the north shutter and drops the floor-0
        // Small Key, the one the Stair Coil's door in the west wall wants.
        // The nooks at either end of the block rows are what keep the
        // Anchor from stranding you on one; the plate's dais drops off both
        // ends to the side aisles, one way, so the way back is a hop.
        // tools/check-toggles.mjs proves it.
        map: [
          '#######D#######',
          '#.<.........>.#',
          '#.==4444444==.#',
          '#.=.bbbbbbb.=.#',
          '#.==1111111==.#',
          'L.=.aaaaaaa.=..',
          '#.==3333333==.#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#######.#######',
        ],
        entities: [
          ['switch', 7, 1],
          ['keese', 3, 8],
        ],
        toggleRoom: { from: [7, 9], to: [7, 1] },
        puzzle: {
          switches: 'all',
          flag: 'd2_034_puzzle',
          reward: {
            openDoors: [[7, 0]],
            spawn: [['pickup', 9, 1, { kind: 'key' }]],
            say: 'The door lifts, and something small rattles loose.',
          },
        },
        readable: [
          [12, 7, 'Cut in the wall: "Each turn of the tide turns the red and the blue."'],
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
          '#..S..........#',
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
          [12, 8, 'A pane of green glass in the wall. Through it, the room looks a little deeper in water than it really is.'],
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
          [2, 9, 'You can hear wings flapping, but the room is empty. The tide here won\'t change to show you what they are.'],
          [12, 9, 'Scratched by the door: "Look through the glass to see what lives at the other tide. What you can see, your sword can hit."'],
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
          [7, 8, 'Cut into the shelf: "Two shafts. One fills with water. The other stays dry."'],
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
          [6, 9, 'Scratched into the coral: "The coral bar goes under at HIGH tide. Nothing else in here changes."'],
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
          // S203: Anemos was the hardest fight in the game (23 quarter-hearts
          // in, 2 left), so a fairy waits under his door, as Nereth's does.
          ['pickup', 7, 3, { kind: 'fairy', life: 1e9 }],
        ],
      },
      '1,2,3': {
        name: 'The Turning Pool',
        // THE BLOCKS' STEP UP, AND THE ANCHOR'S (S205; it was the Drowned
        // Cell, a pool with nothing in it). Red stands at the way in and at the
        // way out. In from the east over the well column at LOW; out north
        // over the drains at MID; the pool between floods at HIGH, so the
        // conch gives one press there, and one press always flips the red. The
        // conch alone cannot. The Anchor holds water and not blocks: hold the
        // wells (or the pool) and press on round, and the red comes down again
        // at MID. The blue door on the west is the way back out of the drains.
        // tools/check-toggles.mjs proves all of it.
        map: [
          '#######.#######',
          '#....=...=....#',
          '#....=aaa=....#',
          '#....=444=....#',
          '#....b444=....#',
          '#....=1113a...L',
          '#....=1113a...#',
          '#....=1113a...#',
          '#....=====....#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['urchin', 3, 8],
          ['pickup', 12, 1, { kind: 'rupee20' }],
        ],
        toggleRoom: { from: [13, 5], to: [7, 0], anchor: true },
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
          [7, 8, 'Three marks on the shelf, and under them: "One you can wade. One stays a pit. One is over your head."'],
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

  // A stair in the Sanctum (S181): standing on (x, y) takes you to `to`.
  const P3 = (floor, rx, ry, px, py, dir) => ({ map: 'd3', floor, rx, ry, px: px * 16, py: py * 16, dir });
  const stair3 = (x, y, to) => ({ x, y, to });
  registerMap({
    id: 'd3',
    kind: 'dungeon',
    name: 'Bogwater Sanctum',
    w: 8, h: 8, floors: 2,
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
    // GROWN TO 32 SCREENS (S143). A required east wing, the Sounding wing
    // (the Sounding Pool, the Two Weights), off the Eel Vault's east wall,
    // holds the key the Eel Hall's north door wants — the Vault's clearing now
    // opens the wing instead. It asks for the floor mode a new way: A PLATE
    // UNDER DEEP WATER IS ON THE BOTTOM, and only Link walking the seafloor
    // presses it (`FloorSwitch.sunk`; proved by check-cleats' sunkPlates
    // clause). Two optional rooms want the Cleats before they are owned: the
    // Sluice Bed off the Map Cell (a plate at the head of a torrent: Ballast
    // Lung) and the Current Garden off the Bell Cell (Deadweight).
    //
    // The route (22 rooms before S143, one floor, the Cleats at room 11; the
    // Sounding wing comes between the Eel Vault and the Eel Hall's key door):
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
    music: 'dungeon3',
    tint: 'cave',
    dungeon: {
      index: 3,
      item: 'cleats', itemLevel: 1,
      essence: 3,
      boss: 'gloomtide',
      bossRoom: '1,3,1',
      startRoom: '1,3,7',
      entrance: { map: 'overworld', floor: 0, rx: 1, ry: 8, px: 64, py: 32 },
    },
    rooms: {
      '1,3,7': {
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
          [2, 7, 'Bog script: "You can swim on top of the water, or walk along the bottom."'],
        ],
      },
      '1,3,6': {
        name: 'Drowned Nave',
        // P1 (S181): THE FIRST HOLE. The pool in the middle is a shaft — an
        // open hole at LOW, the sea's above it — and the room under it, the
        // Undercroft Landing, leads to the Three Pens' corridor. A hole is a
        // door, and you land where you fell. The fenced stair in the north-west
        // corner is where the Landing's stair comes back up: the dais is
        // left by its ledge, so it is never a way down.
        map: [
          '#######.#######',
          '#/=...........#',
          '#.=..=.....=..#',
          '#_=...........#',
          '#.....555.....#',
          '#.....555......',
          '#.....555.....#',
          '#.............#',
          '#....=.....=..#',
          '#.............#',
          '#######.#######',
        ],
        entities: [
          ['keese', 10, 3],
          ['crab', 3, 8],
        ],
        warps: [stair3(1, 1, P3(0, 3, 6, 1, 2, 'down'))],
        // Not the only way down (the Hub's pens are left into the same
        // corridor), and not meant to be: the first hole is the safe one.
        shaftRoom: {},
        puzzle: {
          enemies: true,
          flag: 'd3_nave',
          reward: {
            spawn: [['pickup', 7, 1, { kind: 'fairy' }]],
            say: 'The bog lets something go.',
          },
        },
      },
      '1,4,6': {
        name: 'Bell Cell',
        map: [
          '###############',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#....,,,,,....#',
          '.....,,,,,.....',
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
      '1,3,5': {
        name: 'Bog Hub',
        // P2 (S181): FOUR HOLES, AND WHICH ONE. Each shaft is the roof of
        // whatever stands under it in the Three Pens: three walled pens and a
        // pit. The key is in one pen, seen from the Pens' corridor; the answer
        // is counting the position. The east door is the first key door, into
        // the Sluice Cell.
        map: [
          '#######.#######',
          '#.............#',
          '#..55.....55..#',
          '#..55.....55..#',
          '#.............#',
          '..............L',
          '#.............#',
          '#..55.....55..#',
          '#..55.....55..#',
          '#.............#',
          '#######.#######',
        ],
        entities: [
          ['keese', 7, 8],
          ['urchin', 7, 2],
        ],
        // The key pen is under the south-east hole and is reached by nothing
        // else; the south-west hole is over the Pens' pit, so it is a pit.
        shaftRoom: { lands: [[11, 8]], decoy: [[3, 7], [4, 7], [3, 8], [4, 8]] },
      },
      '1,2,5': {
        name: 'Map Cell',
        // The Silt Stair's way back up (S181) arrives on the dais in the
        // south-east corner, which is left by its ledge: never a way down.
        map: [
          '###############',
          '#.............#',
          '#.p.........p.#',
          '#.............#',
          '#.............#',
          '...............',
          '#.............#',
          '#..........=="#',
          '#.p........=/.#',
          '#..........=..#',
          '###############',
        ],
        entities: [
          ['chest', 7, 5, { pickup: 'dungeonMap' }],
          ['urchin', 10, 3],
        ],
        warps: [stair3(12, 8, P3(0, 2, 5, 12, 9, 'down'))],
      },
      '1,4,5': {
        name: 'Sluice Cell',
        // P3 (S181): TWO SEAS AT ONCE. The shaft in the middle of the pool
        // lands in the Drain Weir's drain: a dry pit at LOW (no landing), wading
        // at MID (but the shaft is flooded shut), deep at HIGH. Drop the Anchor
        // by the shaft at LOW and sound the conch to MID: the held patch keeps
        // the hole open while the cellar fills, and the drop lands in water you
        // can wade. The Anchor stays where it bit when you leave the room.
        map: [
          '###############',
          '#.............#',
          '#.U.........U.#',
          '#....==1==....#',
          '#....=111=....#',
          'L....=151=....#',
          '#....=111=....#',
          '#....==1==....#',
          '#.............#',
          '#.U.........U.#',
          '###############',
        ],
        entities: [
          ['keese', 3, 6],
        ],
        shaftRoom: { anchor: { from: [7, 7], at: 0, then: 1 }, lands: [[7, 5]] },
      },
      '1,3,4': {
        name: 'The Weir',
        // Its key door is in the north wall and gates the Cistern Floor, not
        // the room: the Chartstone and the Piece of Heart either side of it
        // are walked with the key still in hand.
        //
        // P6 (S182): THE CRACK IN THE POOL. At LOW the sluice pool is dry, and
        // a crack in its middle shows (above LOW the water hides it). It is on
        // the line from the south door to the north one, so it is walked over
        // on the way to the Cleats and never breaks; stood on, it gives way
        // into the Reliquary, which no water may touch. The alcove in the
        // north-east corner is where the Reliquary's stair comes up: walled in
        // and left by its ledge, so it is never a way down.
        map: [
          '#######L#######',
          '#..........#./#',
          '#..U.......#..#',
          '#..........#__#',
          '#.............#',
          '...............',
          '#.............#',
          '#.11111811111.#',
          '#.............#',
          '#.............#',
          '#######.#######',
        ],
        warps: [stair3(13, 1, P3(0, 3, 4, 13, 2, 'down'))],
        shaftRoom: { lands: [[7, 7]] },
        entities: [
          ['crab', 3, 6],
          ['urchin', 11, 4],
        ],
      },
      '1,2,4': {
        name: 'Silt Cell',
        // P4 (S181): THE FIRST CRACK, in the alcove beside the well. Stand on it
        // and it gives way into the Root Cellar, where the Chartstone is;
        // walking across it never does.
        map: [
          '###############',
          '#...#.........#',
          '#.K.#.......U.#',
          '#...#.........#',
          '##.##.........#',
          '#..............',
          '#....3333.....#',
          '#....3333.....#',
          '#.U.........U.#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['urchin', 11, 6],
        ],
        shaftRoom: { lands: [[2, 2]] },
      },
      '1,4,4': {
        name: 'Reed Cell',
        // A crack in the dry north-east corner (S182) lets down into the Reed
        // Undercroft, which is optional; its stair comes back up onto the
        // fenced step in the south-west corner, left by its ledge.
        map: [
          '###############',
          '#.............#',
          '#...3333333.K.#',
          '#...3333333...#',
          '#...3333333...#',
          '....3333333...#',
          '#...3333333...#',
          '#"=...........#',
          '#.=...........#',
          '#/=...........#',
          '###############',
        ],
        warps: [stair3(1, 9, P3(0, 4, 4, 2, 8, 'down'))],
        shaftRoom: { lands: [[12, 2]] },
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
      '1,5,4': {
        name: 'Eel Vault',
        map: [
          '#######.#######',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#.............#',
          '#.............D',
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
          // Since S143 the clearing opens the Sounding wing, and the Small Key
          // the Eel Hall's north door wants is in the Two Weights.
          reward: {
            openDoors: [[14, 5]],
            say: 'A gate grinds open in the east wall.',
          },
        },
      },
      '1,3,3': {
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
        //
        // P5 (S182): THE WELL. North of the island a sluice basin — dry at LOW,
        // shallow at MID, deep at HIGH — holds a shaft over the Sump. At LOW it
        // is a hole over the Sump's dry pits, and a fall is only a fall; above
        // LOW it is flooded, and a player walking the bottom with the Cleats he
        // has just opened goes down it to the Sump's floor.
        map: [
          '###############',
          '#WWWW11111WWWW#',
          '#WWWW15551WWWW#',
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
        // The Sump's plate is reached by nothing but this well.
        shaftRoom: { lands: [[24, 5]] },
        readable: [],
      },
      '1,2,3': {
        name: 'The Undertow',
        // The west door is shut until the plate on the Sump's floor is pressed
        // (P5, S182): the west wing — the Vestry, Bogmaw — is behind it.
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
          'D.TTTTTTTTTTT..',
          '#.TTTTTTTTTTT.#',
          '#.TTTTTTTTTTT.#',
          '#.TTTTTTTTTTT.#',
          '#.TTTTTTTTTTT.#',
          '###############',
        ],
        cleatRoom: { from: [14, 5], to: [1, 5] },
        readable: [],
      },
      '1,1,3': {
        name: 'Sunken Vestry',
        // Two blocks, two plates, and each block is pushed sideways toward the
        // middle of the room rather than up, the way the Sluice Cell's are.
        map: [
          '#######L#######',
          '#.............#',
          '#.............#',
          '#.............#',
          '#....11111....#',
          '#....11111....D',
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
      '1,1,4': {
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
      '1,2,2': {
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
      '1,1,2': {
        name: 'Drain Gallery',
        // Small Key 4 stands inside a ring of wells — wading water at LOW and
        // over your head above it. The ring is open to the south. It was the
        // Boss Key until S182 (now the Reliquary's); this key opens the Eel
        // Hall's west door, so the west wing is the way to the east.
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
          ['chest', 7, 4, { pickup: 'key' }],
          // A KEESE, NOT A JELLYFISH. A jellyfish is kept on wet tiles by
          // `terrainOk`, and at LOW there are none here to be on: it was
          // scenery with a hitbox. See tools/check-placement.mjs.
          ['keese', 2, 8],
        ],
      },
      '1,2,1': {
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
      '1,4,3': {
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
          '..ttttttttttt.L',
          '#.ttttttttttt.#',
          '#.ttttttttttt.#',
          '#.ttt.....ttt.#',
          '#.ttt..U..ttt.#',
          '###############',
        ],
        cleatRoom: { from: [0, 5], to: [13, 5] },
        entities: [
          ['pickup', 7, 8, { kind: 'fairy' }],
        ],
      },
      '1,5,3': {
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
          'L............ttttttttttttttttttttttttttttt..#',
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
        cleatRoom: { from: [1, 5], to: [43, 5] },
        readable: [
          [10, 2, 'Scratched into the statue: "The current carries swimmers back. Walk along the bottom instead!"'],
        ],
      },
      '1,4,2': {
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
          [20, 8, 'A plate on the lock wall: "The current carries a swimmer round to the last gate, and no further. Sink there, and walk the rest."'],
        ],
      },
      '1,3,2': {
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
      // ------------------------------------------ the sounding wing (S143)
      //
      // THE SOUNDING WING, REQUIRED, off the Eel Vault's east wall: the Vault's
      // clearing opens it now instead of paying out a key, and the key the
      // Eel Hall's north door wants is in here. The Cleats' floor mode, asked
      // a new way: A PLATE UNDER DEEP WATER IS ON THE BOTTOM
      // (`FloorSwitch.sunk`). A swimmer floats over it and nothing happens;
      // only a body walking the seafloor presses it. The water has two floors,
      // and this is the first thing that cares which one you are on.
      '1,6,4': {
        name: 'The Sounding Pool',
        // The rule, taught alone: one plate in the middle of a deep pool. It
        // stays down once pressed and opens the way on.
        size: [2, 1],
        map: [
          '##############################',
          '#............................#',
          '#..U.....WWWWWWWWWWWW....U...#',
          '#........WWWWWWWWWWWW........#',
          '#........WWWWWWWWWWWW........#',
          'D........WWWWWWWWWWWW........#',
          '#........WWWWWWWWWWWW........#',
          '#........WWWWWWWWWWWW........#',
          '#..U.....WWWWWWWWWWWW....U...#',
          '#............................#',
          '######################D#######',
        ],
        sunkPlates: [[14, 5]],
        entities: [
          ['switch', 14, 5, { hold: false }],
          ['jellyfish', 11, 3],
          ['crab', 24, 7],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd3_sounding',
          reward: { openDoors: [[22, 10]], say: 'Something heavy shifts in the south wall.' },
        },
        readable: [
          [3, 2, 'Bog script on the statue: "The switch is on the bottom. Swimmers float right over it."'],
        ],
      },
      '1,6,5': {
        name: 'The Two Weights',
        // Two plates that must be held at once. The west one is a single well
        // square — shallow at LOW, deep above — and a block will not go into
        // deep water, so the block is pushed onto it at LOW. The east one is
        // at the bottom of a pool deep at every sea, and only Link walking the
        // floor presses it. One of each weight; the key falls when both hold.
        size: [2, 1],
        map: [
          '######################D#######',
          '#............................#',
          '#..U........U................#',
          '#............................#',
          '#...............WWWWWWWWWWW..#',
          '#.....3.........WWWWWWWWWWW..#',
          '#...............WWWWWWWWWWW..#',
          '#...............WWWWWWWWWWW..#',
          '#..U........U...WWWWWWWWWWW..#',
          '#............................#',
          '##############################',
        ],
        sunkPlates: [[21, 6]],
        entities: [
          ['switch', 6, 5],
          ['block', 7, 5],
          ['switch', 21, 6],
          ['jellyfish', 25, 8],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd3_weights',
          reward: {
            spawn: [['pickup', 11, 3, { kind: 'key' }]],
            say: 'Both plates hold. A key rattles loose.',
          },
        },
        readable: [
          [3, 2, 'Scratched by the well: "A block won\'t go into deep water. Push it on at LOW tide! The other switch is on the bottom of the pool. Walk the floor to it."'],
        ],
      },

      // ---------------------------------------------- optional rooms (S143)
      '1,1,5': {
        name: 'Sluice Bed',
        // Optional, off the Map Cell's west wall, and it wants the Cleats the
        // first time it is seen. A plate at the head of a channel that runs
        // south harder than anyone swims: a swimmer is put back out of the
        // mouth, a floor-walker goes up the bed and stands on it.
        map: [
          '###############',
          '#,,,##VVV#....#',
          '#,,,##VVV#....#',
          '#,,,##VVV#..U.#',
          '##D###VVV#....#',
          '#....#VVV#.....',
          '#....#VVV#....#',
          '#.U..#VVV#....#',
          '#....#VVV#....#',
          '#.............#',
          '###############',
        ],
        cleatRoom: { from: [14, 5], to: [7, 1] },
        sunkPlates: [[7, 1]],
        entities: [
          ['switch', 7, 1, { hold: false }],
          ['chest', 2, 2, { charm: 'ballastLung' }],
          ['urchin', 11, 7],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd3_sluicebed',
          reward: { openDoors: [[2, 4]], say: 'A grate lifts in the west wall.' },
        },
      },
      '1,5,6': {
        name: 'Current Garden',
        // Optional, off the Bell Cell's east wall. The whole floor runs west,
        // back at the door, and the chest is on an island two screens out:
        // swum, the current hands you back; walked on the bottom, nothing does.
        size: [2, 1],
        map: [
          '##############################',
          '#...ttttttttttttttttttttttttt#',
          '#.U.ttttt#ttttt#ttttttttttttt#',
          '#...ttttttttttttttttttttttttt#',
          '#...tttttttttttttttttt...tttt#',
          '....tttttttttttttttttt...tttt#',
          '#...tttttttttttttttttt...tttt#',
          '#...ttttttttttttttttttttttttt#',
          '#.U.ttttt#ttttt#ttttttttttttt#',
          '#...ttttttttttttttttttttttttt#',
          '##############################',
        ],
        cleatRoom: { from: [0, 5], to: [22, 5] },
        entities: [
          ['chest', 23, 5, { charm: 'deadweight' }],
          ['keese', 2, 3],
        ],
      },
      '1,3,1': {
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
      // ---- floor 0: the Undercroft (S181) -------------------------------
      //
      // Ten screens under the middle of the Bog in the D3 brief; P1-P4's five
      // are built (S181), the Reliquary, the Sump, the Undertow Cellar and the
      // Reed Undercroft come with P5 and P6. Every hole upstairs lands on the
      // same spot of the room directly below (`Game.dropThroughHole`).
      '0,3,6': {
        name: 'Undercroft Landing',
        // P1 lands here: lit, empty, and its stair straight back up to the
        // Nave's dais. The north door is the Three Pens' corridor.
        map: [
          '#######.#######',
          '#S............#',
          '#.............#',
          '#..U.......U..#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#..U.......U..#',
          '#.............#',
          '#.............#',
          '###############',
        ],
        warps: [stair3(1, 1, P3(1, 3, 6, 1, 2, 'down'))],
      },
      '0,3,5': {
        name: 'The Three Pens',
        // P2: under the Bog Hub's four shafts, three raised pens and a pit.
        // A pen has no door: it is a raised floor left by its ledge (the Lair's
        // wall face along its front) into the corridor. The
        // Small Key is in the south-east pen, under the Hub's south-east hole.
        // The east door is the Drain Weir's shutter, opened from that side.
        map: [
          '###############',
          '#....=...=....#',
          '#....=...=..p.#',
          '#....=...=....#',
          '#____=...=____#',
          '#.............D',
          '#=====...=""""#',
          '#OOOO=...=....#',
          '#OOOO=...=....#',
          '#OOOO=...=....#',
          '#######.#######',
        ],
        entities: [
          ['chest', 12, 8, { pickup: 'key' }],
          ['keese', 3, 2],
        ],
      },
      '0,4,5': {
        name: 'The Drain Weir',
        // P3 lands here, in the drain under the Sluice Cell's shaft: a pit at
        // LOW, wading at MID, over your head at HIGH. The Small Key is on the
        // dry floor; taking it opens the shutter west into the Pens.
        map: [
          '###############',
          '#.............#',
          '#.U...444...U.#',
          '#..444444444..#',
          '#..444444444..#',
          'D..444444444..#',
          '#..444444444..#',
          '#.....444.....#',
          '#.....444.....#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['chest', 12, 8, { pickup: 'key' }],
        ],
        puzzle: {
          flag: 'd3_drainweir',
          condition: (g, r) => !!g.progress.chests[`d3:${r.key}:0`],
          reward: { openDoors: [[0, 5]] },
        },
      },
      '0,2,4': {
        name: 'The Root Cellar',
        // P4 lands here, under the Silt Cell's crack: the Chartstone, and the
        // way on through the Silt Stair. North is the Undertow Cellar (S182),
        // so the cellar is also walked into from the Sump's side — which is why
        // the crack lands on a raised corner, left by its ledge, with the
        // Chartstone on it: the floor is a loop, the corner is the crack's.
        map: [
          '#######.#######',
          '#...>.........#',
          '#...>.........#',
          '#...>.....=...#',
          '#___=.........#',
          '#.............#',
          '#.............#',
          '#...=.....=...#',
          '#.............#',
          '#.............#',
          '#######.#######',
        ],
        entities: [
          ['chest', 3, 2, { pickup: 'chartstone' }],
        ],
      },
      // ---- P5 and P6 (S182) ------------------------------------------------
      '0,3,3': {
        name: 'The Sump',
        // P5: UNDER THE CISTERN FLOOR'S WELL, two screens wide. At LOW its floor
        // is a field of dry pits and the well above is a hole into one of them;
        // above LOW it is over your head, and a player who sinks down the well
        // with the Cleats lands on the bottom. The plate is on that bottom, in a
        // basin deep at every sea, and only a body walking the floor presses it
        // (`FloorSwitch.sunk`). It opens two doors: the Undertow's west door
        // upstairs, the way to the west wing, and this room's own shutter, the
        // way out through the Undertow Cellar. A switch here, a gate there.
        size: [2, 1],
        map: [
          '##############################',
          '#0000000000000==0000000000000#',
          '#0000000000000==0000=00000000#',
          '#..00000000000==000000WWWWW00#',
          '#..0000000000000000000WWWWW00#',
          'D..0000000000000000000WWWWW00#',
          '#..0000000000000000000WWWWW00#',
          '#..00000000000==000000WWWWW00#',
          '#00000=000=000==0000=00000000#',
          '#0000000000000==0000000000000#',
          '##############################',
        ],
        sunkPlates: [[24, 5]],
        entities: [
          ['switch', 24, 5, { hold: false }],
          ['jellyfish', 23, 3],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd3_sump',
          reward: {
            openDoors: [[0, 5]],
            openDoorsIn: [['1,2,3', 0, 5]],
            say: 'Far above, a gate grinds open.',
          },
        },
      },
      '0,2,3': {
        name: 'The Undertow Cellar',
        // Under the Undertow. Met early, from the Root Cellar, as a fight and a
        // shut door east; the Sump opens it from the other side.
        map: [
          '###############',
          '#.U.........U.#',
          '#.............#',
          '#...=.....=...#',
          '#.....222.....#',
          '#.....222.....D',
          '#.....222.....#',
          '#...=.....=...#',
          '#.............#',
          '#.U.........U.#',
          '#######.#######',
        ],
        entities: [
          ['crab', 4, 5],
          ['keese', 10, 2],
        ],
      },
      '0,3,4': {
        name: 'The Reliquary',
        // P6: UNDER THE WEIR'S CRACK, and the room no water may touch: DAMP, so
        // the Kilnshell will not strike here, and sealed — the only way in is
        // the hole. Two torches stand either side of the Boss Key's dais. The
        // fire has to come down from the Weir, dry, at LOW: Link lets go of
        // what he holds as he falls (as in Seasons), and a lit shell that goes
        // down a hole lands here still burning (Game.dropObjectThrough). The
        // stair goes up into the Weir's walled alcove, left by its ledge.
        damp: true,
        map: [
          '###############',
          '#.U..........S#',
          '#...,,,,,,,...#',
          '#...,,,,,,,...#',
          '#...,,,,,,,...#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.U.........U.#',
          '###############',
        ],
        warps: [stair3(13, 1, P3(1, 3, 4, 13, 2, 'down'))],
        entities: [
          ['torch', 5, 3],
          ['torch', 9, 3],
          ['chest', 7, 3, { pickup: 'bossKey', needFlag: 'd3_reliquary' }],
        ],
        kilnRoom: { descend: { from: '1,3,4', hole: [7, 7] }, torches: [[5, 3], [9, 3]] },
        puzzle: {
          torches: 'all',
          flag: 'd3_reliquary',
          reward: { reveal: true, say: 'The two flames answer each other.\nSomething rises between them.' },
        },
        readable: [
          [2, 1, 'Cut in the urn: "No water gets in here. Any fire here came down from above, dry."'],
        ],
      },
      '0,4,4': {
        name: 'The Reed Undercroft',
        // Optional, under the Reed Cell's crack: a fight round the reed wells,
        // and a chest for the player who stood still where nothing told him to.
        // The stair goes back up onto the Reed Cell's fenced step.
        map: [
          '###############',
          '#.............#',
          '#.............#',
          '#...33333.....#',
          '#...33333..U..#',
          '#...33333.....#',
          '#.............#',
          '#.U...........#',
          '#.............#',
          '#.S...........#',
          '###############',
        ],
        warps: [stair3(2, 9, P3(1, 4, 4, 1, 8, 'up'))],
        entities: [
          ['jellyfish', 6, 4],
          ['crab', 10, 7],
          ['keese', 12, 6],
          ['chest', 7, 8, { pickup: 'rupee100', needFlag: 'd3_reedunder' }],
        ],
        puzzle: {
          enemies: true,
          flag: 'd3_reedunder',
          reward: { reveal: true, say: 'The reeds go still.' },
        },
      },
      '0,2,5': {
        name: 'The Silt Stair',
        // A fight, and the stair up to the Map Cell's dais.
        map: [
          '#######.#######',
          '#.............#',
          '#..=.......=..#',
          '#.............#',
          '#.....===.....#',
          '#.............#',
          '#.....===.....#',
          '#.............#',
          '#..=........S.#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['crab', 4, 6],
          ['keese', 10, 3],
        ],
        warps: [stair3(12, 8, P3(1, 2, 5, 12, 9, 'down'))],
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
  // GROWN TO 36 SCREENS (S143). A required west wing, the Spillway (Spill
  // Gate, the Ebb Cell, the Spill Vault), holds the key to the Long Race's
  // west door, and it asks the dungeon's question a new way: the Ebb Cell's
  // stand is only reached at HIGH and its wheel is two levels under at HIGH,
  // so the conch is sounded from INSIDE the cell. Three optional rooms (the
  // Siphon Stair off the Spill Gate, the Gull Roost off the Cliffside Cell,
  // the Wind Gallery off the Cliff Walk) each hold a charm behind a sill.
  //
  // Intended route (24 rooms before S143, one floor, the Bellows at room 12;
  // the Spillway comes after the Squall Loft and before the Drowned Sill):
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
  const P4 = (floor, rx, ry, px, py, dir) => ({ map: 'd4', floor, rx, ry, px: px * 16, py: py * 16, dir });
  const stair4 = (x, y, to) => ({ x, y, to });
  registerMap({
    id: 'd4',
    kind: 'dungeon',
    name: 'Cliffside Cistern',
    w: 8, h: 8, floors: 3,
    cell: [15, 11],
    legend: 'dungeonCistern',
    music: 'dungeon4',
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
          [2, 8, 'Chiselled deep: "Everything here was worked from the far bank. Nothing is meant to be reached by hand."'],
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
          ['chest', 7, 2, { pickup: 'dungeonMap' }],
          ['keese', 11, 7],
        ],
      },
      '0,4,6': {
        name: 'Spike Basin',
        // N1, SPIKES ALONE (S183; docs/briefs/D4-CLIFFSIDE-CISTERN.md). The
        // first Small Key on a dais in a spike pool (`5`): the Dragon's own
        // spike floor at LOW and MID, deep water over it at HIGH. The top of
        // the tide is the only sea it is safe at, and the Cleats swim it.
        map: [
          '#######.#######',
          '#.............#',
          '#..555555555..#',
          '#..555555555..#',
          '#..555...555..#',
          '...555...555..#',
          '#..555...555..#',
          '#..555555555..#',
          '#..555555555..#',
          '#.............#',
          '###############',
        ],
        spikeRoom: { from: [1, 5], target: [7, 6], sea: 2 },
        entities: [
          ['chest', 7, 5, { pickup: 'key' }],
          ['stalfos', 1, 1],
          ['tektite', 12, 5],
          ['keese', 10, 9],
        ],
        readable: [
          [1, 9, 'Scratched in the basin wall: "The spikes are only safe at HIGH tide, under deep water."'],
        ],
      },
      '0,3,5': {
        name: 'The Weir',
        // N2, A FLOAT ALONE (S183). The key door north is across a two-tile
        // hole, and a float (Seasons' moving platform) shuttles along it,
        // waiting under the door's notch and at its west end. It runs only
        // while its race does — the channel along the south wall, wading
        // water at LOW and a current above — so at LOW it stops where it is.
        map: [
          '#######L#######',
          '#######.#######',
          '#OOOOOOOOOOOOO#',
          '#OOOOOOOOOOOOO#',
          '#.............#',
          '...............',
          '#.............#',
          '#.............#',
          '#.U...........#',
          '#........7777.#',
          '#######.#######',
        ],
        floatRoom: { stop: [7, 1], race: [10, 9], board: [7, 4], station: true },
        entities: [
          ['float', 7, 2, { race: [10, 9], path: [['wait', 64], ['left', 160], ['wait', 64], ['right', 160], ['loop', 0]] }],
          ['tektite', 7, 7],
          ['keese', 3, 6],
        ],
        readable: [
          [2, 8, 'Cut into the weir: "The float only moves while its channel runs. At LOW tide, it stops."'],
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
          '...............',
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
          [2, 2, 'A winch plate, bolted shut: "The wheels are where no hand can reach. Bring wind!"'],
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
          '..............D',
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
          [6, 7, 'A plate on the loft: "The wheel turns in the wind, but not underwater. Blow the water off it!"'],
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
          [3, 2, 'Scratched under the sill: "This wheel is only underwater at HIGH tide."'],
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
          '..............L',
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
        // N3, THE FLOAT AND THE WIND (S183). The only way from the Winding
        // Stair to the Ironknight is a float across a long hole, and halfway
        // it passes under a notch in the north wall with a Small Key in it —
        // and never stops there. Its race is a pool in the hole below the
        // notch. Ride it at MID, and as he comes under the notch, face the
        // race and pump: the cone takes the race down to LOW, the current
        // stops, and the float stops under him. (At HIGH the cone leaves a
        // current, but the conch does it instead: HIGH -> LOW stops it dead.)
        // The key opens the east door, which is the way on.
        //
        // Until S183 this room held sills 4a and 4b, the second behind the
        // first; the Squall Loft and the Drowned Sill already teach both.
        map: [
          '###############',
          '#######.#######',
          '#######.#######',
          '#..OOOOOOOOO..#',
          '#..OOOOOOOOO..#',
          'L..OOOOOOOOO..L',
          '#..OOO777OOO..#',
          '#..OOOOOOOOO..#',
          '#..OOOOOOOOO..#',
          '#U.OOOOOOOOO.U#',
          '###############',
        ],
        floatRoom: { stop: [7, 2], race: [7, 6], board: [2, 4], brake: 1 },
        entities: [
          ['float', 3, 3, { race: [7, 6], path: [['wait', 32], ['right', 224], ['wait', 32], ['left', 224], ['loop', 0]] }],
          ['pickup', 7, 1, { kind: 'key' }],
          ['stalfos', 1, 7],
          ['keese', 2, 8],
        ],
        readable: [
          [1, 9, 'A plate by the race: "If the float won\'t stop, the wind can stop it."'],
        ],
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
          'L.............99.............#',
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
        // S184: the stair up to the Sealed Cistern comes out of the floor of
        // the east half when the armour folds, as a Seasons stair does after
        // a miniboss, and the warp waits on the same flag.
        warps: [{ x: 24, y: 8, needFlag: 'd4_ironknight', to: P4(1, 6, 3, 9, 7, 'up') }],
        puzzle: {
          enemies: true,
          flag: 'd4_ironknight',
          reward: {
            openDoors: [[7, 0]],
            tiles: [[24, 8, 'dStairsUpCistern']],
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
          'L..............',
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
        // Until S184 the Boss Key was behind this room's two sills, one of
        // each shape; the Squall Loft and the Drowned Sill teach both, and the
        // key is upstairs in the East Tank now. What stays is the way home.
        //
        // THE WEST DOOR IS THE SHORTCUT HOME, and it is this room's to open:
        // the plate beside it on this side lets a player holding the Boss Key
        // walk straight into the Cistern Gate instead of five rooms back round
        // by the Long Race. Only this side has the plate, so it cannot be used
        // to reach the room early from the west — the Bogwater Sanctum's Lock
        // Gallery precedent (S139).
        map: [
          '#######.#######',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#....,,,,,....#',
          'D....,,,,,....L',
          '#....,,,,,....#',
          '#.............#',
          '#.............#',
          '#.U.........U.#',
          '###############',
        ],
        entities: [
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
          [2, 9, 'Carved by the gate: "The Boss Key is where the water has to drop two levels."'],
        ],
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
      // ------------------------------------------ the spillway (S143, required)
      //
      // THE SPILLWAY WING, off the Squall Loft's west wall, and the key to the
      // Long Race is in it. Every sill before this one is worked at ONE sea:
      // pick it, walk to the stand, blow. This one cannot be. The stand is a
      // cell behind drown-wall, so you only get in on the flood — and the wheel
      // stands in a well two levels deep at the flood, and the cone takes one.
      // So you swim in, and sound the conch STANDING IN THE CELL: the sea goes
      // out, the drown-wall comes up round you as stone, and the wheel is in a
      // shallow puddle three tiles away. Blow. Then bring the flood back to
      // swim out. `enter` in the declaration is check-bellows' clause for it.
      '0,0,3': {
        name: 'Spill Gate',
        map: [
          '#######.#######',
          '#.............#',
          '#.U.......U...#',
          '#....33333....#',
          '#....33333....#',
          '#....33333.....',
          '#....33333....#',
          '#.............#',
          '#.U.......U...#',
          '#.............#',
          '#######.#######',
        ],
        entities: [
          ['jellyfish', 7, 5],
          ['keese', 11, 8],
        ],
        readable: [
          [2, 8, 'A plate over the spillway: "You can only get into the cell below at HIGH tide, and its wheel only turns at LOW."'],
        ],
      },
      '0,0,4': {
        name: 'The Ebb Cell',
        // Two screens: a well hall to cross, then the cell. The cell is two
        // squares of floor in the south-east corner, walled by drown-wall on
        // the landward side and by a pit on the other, and the wheel is at the
        // end of it in `3` — deep at MID and HIGH, shallow at LOW. At HIGH the
        // cone makes it MID and it is still under; the player sees it bubble.
        size: [1, 2],
        map: [
          '#######.#######',
          '#.............#',
          '#..U.......U..#',
          '#.............#',
          '#...3333333...#',
          '#...3333333...#',
          '#...3333333...#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#..U..........#',
          '#.............#',
          '#.............#',
          '#.............D',
          '#.............#',
          '#.........99###',
          '#........9..O3#',
          '#........######',
          '###############',
        ],
        bellowsRoom: {
          wheel: [13, 19], stand: [10, 19], face: 'right', enter: 2, at: 0, opens: [[14, 16]],
        },
        entities: [
          ['wheel', 13, 19, { needTurns: 40 }],
          ['jellyfish', 5, 5],
          ['jellyfish', 9, 4],
          ['keese', 11, 12],
          ['tektite', 5, 15],
        ],
        readable: [
          [3, 13, 'Cut beside the cell: "Swim in over the low wall at HIGH tide. Then sound the conch for LOW, and blow on the wheel!"'],
        ],
        script: {
          onEvent(game, name, data) {
            if (name === 'valve' && data && data.open) game.applyReward({ openDoors: [[14, 16]] });
          },
        },
      },
      '0,1,5': {
        name: 'Spill Vault',
        map: [
          '###############',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#....,,,,,....#',
          'D....,,,,,....#',
          '#....,,,,,....#',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['chest', 7, 5, { pickup: 'key' }],
        ],
      },

      // ---------------------------------------------- optional rooms (S143)
      '0,0,1': {
        name: 'The Siphon Stair',
        // Optional, off the Spill Gate's north door: the Ebb Cell's lesson
        // asked again, and then the Loft's, in order. The lower cell (enter at
        // the flood, work at the ebb) opens the gate in the middle wall; the
        // upper wheel is a sump shelf at MID and opens the alcove with the
        // charm in it.
        size: [1, 2],
        map: [
          '###############',
          '#,,,######.OO3#',
          '#,,,######.####',
          '#,,,######0####',
          '##D#######0####',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#....33333....#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#######D#######',
          '#.U.........U.#',
          '#.............#',
          '#..3333333....#',
          '#..3333333....#',
          '#.........99###',
          '#........9..O3#',
          '#........######',
          '#.............#',
          '#######.#######',
        ],
        bellowsRoom: [
          { wheel: [13, 18], stand: [10, 18], face: 'right', enter: 2, at: 0, opens: [[7, 12]] },
          { wheel: [13, 1], stand: [10, 1], face: 'right', at: 1, opens: [[2, 4]], after: [[7, 12]] },
        ],
        entities: [
          ['wheel', 13, 18, { needTurns: 40 }],
          ['wheel', 13, 1, { needTurns: 40 }],
          ['chest', 2, 2, { charm: 'saltEtched' }],
          ['tektite', 5, 13],
          ['keese', 11, 7],
          ['jellyfish', 7, 8],
        ],
        script: {
          onEvent(game, name, data) {
            if (name !== 'valve' || !data || !data.open) return;
            game.applyReward({ openDoors: [data.y >= 11 * 16 ? [7, 12] : [2, 4]] });
          },
        },
      },
      '0,6,5': {
        name: 'Gull Roost',
        // Optional, off the Cliffside Cell. Pits and light things over them —
        // the gust shoves what it can — and at the far end a drown-wall cell
        // worked at HIGH, whose wheel opens the alcove in the corner.
        size: [2, 1],
        map: [
          '##############################',
          '#........................#,,,#',
          '#.U.OO....OO....OO...U...#,,,#',
          '#...OO....OO....OO.......#,,,#',
          '#........................##D##',
          '.............................#',
          '#............................#',
          '#...OO....OO....OO..........##',
          '#.U.OO....OO....OO...U..#9####',
          '#.......................9.OO1#',
          '##############################',
        ],
        bellowsRoom: {
          wheel: [28, 9], stand: [25, 9], face: 'right', at: 2, opens: [[27, 4]],
        },
        entities: [
          ['wheel', 28, 9, { needTurns: 40 }],
          ['chest', 27, 2, { charm: 'gullsTally' }],
          ['keese', 7, 2],
          ['keese', 13, 8],
          ['keese', 19, 3],
          ['zol', 14, 5],
        ],
        readable: [
          [21, 8, 'Scratched by the cell: "Gulls nest where the wind is. The wheel in the corner only turns when you come in at HIGH tide."'],
        ],
        script: {
          onEvent(game, name, data) {
            if (name === 'valve' && data && data.open) game.applyReward({ openDoors: [[27, 4]] });
          },
        },
      },
      '0,6,2': {
        name: 'Wind Gallery',
        // Optional, off the Cliff Walk. The stand is at the top of a drain —
        // an open pit at LOW, a wade at MID, over your head at HIGH — so at MID
        // you WALK up to it, the only sill in the Cistern you do not swim to.
        map: [
          '###############',
          '#.......#.OO3##',
          '#.U.....#4#####',
          '#.......#4#####',
          '#.............#',
          '..............#',
          '#.........##D##',
          '#.........#,,,#',
          '#.U...U...#,,,#',
          '#.........#,,,#',
          '###############',
        ],
        bellowsRoom: {
          wheel: [12, 1], stand: [9, 1], face: 'right', at: 1, opens: [[12, 6]],
        },
        entities: [
          ['wheel', 12, 1, { needTurns: 40 }],
          ['chest', 12, 8, { charm: 'seawolfsTooth' }],
          ['keese', 4, 3],
          ['gel', 6, 7],
        ],
        script: {
          onEvent(game, name, data) {
            if (name === 'valve' && data && data.open) game.applyReward({ openDoors: [[12, 6]] });
          },
        },
      },

      // ================================================ 2F, THE SEALED CISTERN
      //
      // S184 (docs/briefs/D4-CLIFFSIDE-CISTERN.md, N4-N9). Five rooms over the
      // middle of 1F, every one `noTide`: the conch is not heard up here, and
      // the water is whatever sea the player climbed with. Each of the three
      // tanks has a sluice gate in its north wall (`H`, `J`, `Q`) and a `tank`
      // declaration: once the wheel directly above it on 3F is turned, the
      // tank's water stands one level under the sea for good (`Tide.resolve`).
      // The sea is chosen in one place and lived with in another.
      '1,6,3': {
        name: 'The Intake',
        // N4, THE SEA YOU CLIMBED WITH. The stair from the Ironknight Gallery
        // comes up south of a spike pool the width of the room, and the doors
        // are north of it. At HIGH the pool is deep and the Cleats swim it; at
        // anything else it is bare spikes, and the only answer is to go back
        // down, sound the conch, and climb again. The north door is the East
        // Tank's shutter, opened from the other side: the way home.
        map: [
          '#######D#######',
          '#.............#',
          '..U.........U.#',
          '#.............#',
          '#5555555555555#',
          '#5555555555555#',
          '#5555555555555#',
          '#.............#',
          '#.U....../.U..#',
          '#.............#',
          '###############'
        ],
        noTide: true, sealed: true,
        warps: [stair4(9, 8, P4(0, 5, 3, 24, 7, 'down'))],
        spikeRoom: { from: [9, 7], target: [7, 2], sea: 2 },
        entities: [
          ['keese', 11, 2],
        ],
        readable: [
          [2, 8, 'A plate by the stair: "The sea below fills these tanks. Your conch can\'t be heard up here."'],
        ],
      },
      '1,5,3': {
        name: 'Spike Gallery',
        // A fight among spike strips, and the shutter north into the Float
        // Tank opens when it is won.
        map: [
          '#######D#######',
          '#.............#',
          '#..............',
          '#..^^.....^^..#',
          '#..^^.....^^..#',
          '#.............#',
          '#.....^^^.....#',
          '#.............#',
          '#..^^.....^^..#',
          '#.............#',
          '###############'
        ],
        noTide: true, sealed: true,
        entities: [
          ['stalfos', 4, 6],
          ['stalfos', 10, 6],
        ],
        puzzle: {
          enemies: true,
          flag: 'd4_spikeGallery',
          reward: { openDoors: [[7, 0]], say: 'The shutter to the north grinds open.' },
        },
      },
      '1,5,2': {
        name: 'The Float Tank',
        // N5 and N8. A float rides north and south over the tank's pit, from
        // the Spike Gallery's door to the West Tank's, and halfway it passes a
        // one-tile ledge with a drown-wall gap behind it and the East Tank's
        // locked door beyond. Its race is a pool in the pit to the west, and
        // the gate drains only that pool. At HIGH — the only sea that crosses
        // the Intake — the wind takes the race to MID, which still runs, so
        // the float carries on past the ledge (N5: seen, not yet usable).
        // With the gate open the race stands at MID, the wind takes it to LOW,
        // and the float stops at the ledge; the drown-wall gap, which was not
        // drained, is deep, and the Cleats swim it (N8).
        map: [
          '#######J#######',
          '#.............#',
          '..............#',
          '#OOOOOOOOOOOOO#',
          '#OOO77OOOO#####',
          '#OOO77OOO.9...L',
          '#OOO77OOOO#####',
          '#OOOOOOOOOOOOO#',
          '#.............#',
          '#.U.........U.#',
          '#######D#######'
        ],
        noTide: true, sealed: true,
        tank: { flag: 'd4GateF', rect: [4, 4, 5, 6] },
        tankRoom: { stop: [9, 5], beyond: [11, 5], race: [5, 5], board: [7, 8], sea: 2, kind: 'brake' },
        entities: [
          ['float', 7, 3, { race: [5, 5], path: [['wait', 64], ['down', 96], ['wait', 64], ['up', 96], ['loop', 0]] }],
        ],
        readable: [
          [2, 9, 'Cut over the pit: "Wind alone won\'t stop this float. Drain its channel first."'],
        ],
      },
      '1,4,2': {
        name: 'The West Tank',
        // N7, DRAINED: THE BLOCKS MOVE. The stair from the Wind Loft comes
        // down on a landing, and the tank is behind drown-wall: in at HIGH
        // only, where the sluice floor is deep and no block will move. With
        // its gate open it stands at MID, wading, and the two blocks go onto
        // their two plates — too far apart for one Anchor's patch — and a
        // chest with the sixth Small Key rises on the landing.
        map: [
          '#######H#######',
          '#111111111#US.#',
          '#111111111#....',
          '#1111111119...#',
          '#111111111#...#',
          '#111111111#.U.#',
          '#111111111#...#',
          '#111111111#...#',
          '#111111111#...#',
          '#111111111#...#',
          '###############'
        ],
        noTide: true, sealed: true,
        tank: { flag: 'd4GateW', rect: [1, 1, 9, 9] },
        tankRoom: { blocks: true, sea: 2 },
        warps: [stair4(12, 1, P4(2, 4, 2, 12, 3, 'down'))],
        entities: [
          ['block', 2, 2, { axis: 'y' }],
          ['block', 8, 7, { axis: 'x' }],
          ['switch', 2, 3],
          ['switch', 9, 7],
          ['chest', 13, 3, { pickup: 'key', needFlag: 'd4_westTank' }],
        ],
        puzzle: {
          switches: 'all',
          blocks: [[2, 3], [9, 7]],
          flag: 'd4_westTank',
          reward: { say: 'A chest rises on the landing.' },
        },
        readable: [
          [11, 1, 'A plate on the landing: "Blocks won\'t move in deep water. Open the west gate, and this tank drops a level."'],
        ],
      },
      '1,6,2': {
        name: 'The East Tank',
        // N9, THE BOSS KEY: TWO LEVELS UNDER. The wheel stands in a walled
        // well across a pit, and its stand is one square ringed by drown-wall,
        // so it is only stood on at HIGH — where the well is deep, and one
        // level of wind leaves it deep: the wheel bubbles. With the gate open
        // the well reads MID, the wind takes it to LOW, and the wheel turns:
        // the Boss Key's chest rises. The plate by the south shutter opens the
        // way home to the Intake, from this side only.
        map: [
          '#######Q#######',
          '#.............#',
          '#.U.........U.#',
          '#....#####....#',
          '#....#333#....#',
          'L....#OOO#....#',
          '#....##9##....#',
          '#.....9.9.....#',
          '#......9......#',
          '#.............#',
          '#######D#######'
        ],
        noTide: true, sealed: true,
        tank: { flag: 'd4GateE', rect: [6, 4, 8, 4] },
        bellowsRoom: { wheel: [7, 4], stand: [7, 7], face: 'up', at: 2, gate: 'd4GateE' },
        tankRoom: { wheel: true, sea: 2 },
        entities: [
          ['wheel', 7, 4, { needTurns: 40, sets: 'd4EastWheel' }],
          ['chest', 7, 2, { pickup: 'bossKey', needFlag: 'd4EastWheel' }],
          ['switch', 5, 9, { hold: false }],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd4_eastShutter',
          reward: { openDoors: [[7, 10]], say: 'The south shutter grinds open.' },
        },
        readable: [
          [2, 2, 'Carved over the well: "Wind lowers the water one level. The gate lowers it another."'],
        ],
        script: {
          onEvent(game, name, data) {
            if (name !== 'valve' || !data || !data.open) return;
            game.spawnFlagged('d4EastWheel');
          },
        },
      },

      // ================================================ 3F, THE WIND LOFT
      '2,4,2': {
        name: 'The Wind Loft',
        // N6. Open to the sky, so the conch is heard again. Three wheels along
        // the north wall, each directly over a tank of the Sealed Cistern and
        // each a sill of its own shape: the west a sump shelf worked at MID
        // (the Squall Loft's), the middle across a spike pool, swum to at HIGH
        // and freed by one level of wind (the Drowned Sill's, with spikes for
        // a moat), the east beyond a pit, reached on a float, worked at MID.
        // Turning one lifts the gate of the tank beneath it, for good. The sea
        // the player goes back down with is the sea 2F gets, so this is the
        // second place to choose it.
        size: [3, 1],
        map: [
          '#############################################',
          '#3OO.###############1##########.......#..OO3#',
          '####.###..../.######O##########.......#..####',
          '####0###......######O##########.......#OOOOO#',
          '#...0.............55.55...............#OOOOO#',
          '#.................55555...............#OOO7O#',
          '#.................55555...............#OOOOO#',
          '#..U.....................U............#OOOOO#',
          '#...........................................#',
          '#.............##.............##..U..........#',
          '#############################################'
        ],
        warps: [stair4(12, 2, P4(1, 4, 2, 12, 2, 'down'))],
        bellowsRoom: [
          { wheel: [1, 1], stand: [4, 1], face: 'left', at: 1, drains: 'd4GateW' },
          { wheel: [20, 1], stand: [20, 4], face: 'up', at: 2, drains: 'd4GateF' },
          { wheel: [43, 1], stand: [40, 1], face: 'right', at: 1, drains: 'd4GateE' },
        ],
        entities: [
          ['wheel', 1, 1, { needTurns: 30, sets: 'd4GateW', say: 'Far below, the west tank\'s gate grinds open.' }],
          ['wheel', 20, 1, { needTurns: 40, sets: 'd4GateF', say: 'Far below, the float tank\'s gate grinds open.' }],
          ['wheel', 43, 1, { needTurns: 40, sets: 'd4GateE', say: 'Far below, the east tank\'s gate grinds open.' }],
          ['float', 39, 6, { race: [42, 5], path: [['wait', 64], ['up', 96], ['wait', 64], ['down', 96], ['loop', 0]] }],
          ['stalfos', 10, 8],
          ['stalfos', 24, 8],
          ['keese', 6, 6],
        ],
        readable: [
          [3, 7, 'A plate under the west wheel: "The west tank is below."'],
          [25, 7, 'A plate under the middle wheel: "The float tank is below."'],
          [33, 9, 'A plate under the east wheel: "The east tank is below."'],
        ],
        script: {
          // A gate opened from here changes rooms nobody is standing in, and
          // their drawn water is cached against the field's stamp: bump it.
          onEvent(game, name, data) {
            if (name === 'valve' && data && data.open) game.tide.touch();
          },
        },
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
