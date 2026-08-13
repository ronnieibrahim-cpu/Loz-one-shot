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
    legend: 'dungeonGrotto',
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
      // ---- the south half: no Anchor, and the conch is the only tool -------
      '0,3,7': {
        name: 'Grotto Mouth',
        map: [
          '####..####',
          '#........#',
          '#.p....p.#',
          '#........#',
          '#..1..1..#',
          '#..1..1..#',
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
        name: 'The Drinking Floor',
        // The first lesson, and it is one press long: the whole middle of the
        // room is well, four rows of it, so there is no walking round and no
        // hopping it either. Sound the conch to LOW and the wells are ankle
        // deep. Nothing here needs anything the player does not already have.
        map: [
          '####..####',
          '#........#',
          '#33333333#',
          '.33333333#',
          '.33333333#',
          '#33333333#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['crab', 2, 1],
          ['crab', 6, 6],
          ['keese', 4, 1],
        ],
        readable: [
          [7, 6, 'A rusted plate: "Shut the sluice, and the grotto drinks."'],
        ],
      },
      '0,2,6': {
        name: 'Bone Cell',
        map: [
          '##########',
          '#........#',
          '#..2222..#',
          '#..2222...',
          '#..2222...',
          '#..2222..#',
          '#........#',
          '##########',
        ],
        entities: [
          ['pickup', 4, 3, { kind: 'blank' }],
          ['keese', 2, 1],
        ],
        readable: [
          [7, 1, 'Scratched deep: "The carver in Tidewatch wants bone, not gold."'],
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
      '0,2,5': {
        name: 'Map Alcove',
        map: [
          '##########',
          '##########',
          '##......##',
          '##.....2..',
          '##.....2..',
          '##......##',
          '##########',
          '##########',
        ],
        entities: [
          ['pickup', 4, 3, { kind: 'dungeonMap' }],
          ['keese', 3, 2],
        ],
      },
      '0,4,5': {
        name: 'Chartstone Alcove',
        map: [
          '##########',
          '##########',
          '##......##',
          '.........#',
          '.........#',
          '##......##',
          '##########',
          '##########',
        ],
        entities: [
          ['chest', 5, 3, { pickup: 'chartstone' }],
          ['keese', 7, 4],
        ],
      },
      '0,3,4': {
        name: 'Tide Gallery',
        map: [
          '####..####',
          '#........#',
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
      '0,2,4': {
        name: 'Crab Pit',
        map: [
          '##########',
          '##########',
          '##......##',
          '##.1111...',
          '##.1111...',
          '##......##',
          '##########',
          '##########',
        ],
        entities: [
          ['crab', 3, 2],
          ['crab', 6, 4],
          ['crab', 4, 3],
        ],
        puzzle: {
          enemies: true,
          flag: 'd1_crabpit',
          reward: {
            // (4,3), not (4,2): a dropped pickup pops about five pixels up and
            // never comes back down, so it comes to rest straddling the tile
            // ABOVE the one it was spawned on. Spawned on the top row of the
            // basin it would settle against the wall above and be a Small Key
            // the player can only just touch. See docs/HANDOFF.md.
            spawn: [['pickup', 4, 3, { kind: 'key' }]],
            say: 'Something clatters onto the wet stone.',
          },
        },
      },
      '0,4,4': {
        name: 'Switch Room',
        map: [
          '##########',
          '##########',
          '##......##',
          '...=..=.##',
          '........##',
          '##......##',
          '##########',
          '##########',
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
      '0,3,3': {
        name: 'The Locked Stair',
        map: [
          '####..####',
          '#........#',
          '####L#####',
          '.........#',
          '.........#',
          '#..q..q..#',
          '#..,,,,..#',
          '####..####',
        ],
        entities: [
          ['zol', 2, 4],
          ['zol', 6, 5],
        ],
      },
      '0,2,3': {
        name: 'Weeping Wall',
        // The first charm in the world that is not shop stock. Split Fang is a
        // MID charm on purpose: one essence in, the MID case is the only one
        // the scrimshander has cut, so a LOW or HIGH charm placed here would be
        // a reward the player could not switch on for two more dungeons. See
        // docs/NEXT-SESSION.md — charm PLACEMENT is a P8 job and this is it.
        map: [
          '##########',
          '#........#',
          '#..3333..#',
          '#..3..3...',
          '#..3..3...',
          '#..3333..#',
          '#........#',
          '##########',
        ],
        entities: [
          ['chest', 4, 3, { charm: 'splitFang' }],
          ['keese', 2, 1],
          ['zol', 7, 6],
        ],
        puzzle: {
          enemies: true,
          flag: 'd1_023_puzzle',
          reward: {
            spawn: [['pickup', 4, 6, { kind: 'rupee20' }]],
            say: 'Loose stone shifts, and something rolls out.',
          },
        },
      },

      // ---- the middle: the Anchor, and the door it does not open -----------
      '0,3,2': {
        name: 'The Sluicegate',
        map: [
          '####..####',
          '#........#',
          '####B#####',
          '..........',
          '..........',
          '#..1111..#',
          '#..1111..#',
          '####..####',
        ],
        entities: [
          ['chest', 4, 4, { big: true, item: 'anchor', level: 1 }],
        ],
        readable: [
          [2, 3, 'The sluicegate plate: "Iron remembers. Sink it where you want the sea to stay."'],
        ],
      },

      // ---- east wing -------------------------------------------------------
      '0,4,2': {
        name: 'The Iron Pipe',
        // Gate, wells near. See the primitive at the top of the dungeon.
        map: [
          '##########',
          '##########',
          '##########',
          '.3333444..',
          '.3333444..',
          '##########',
          '##########',
          '##########',
        ],
        anchorGate: { from: [0, 3], to: [9, 3] },
      },
      '0,5,2': {
        name: 'The Drowned Chamber',
        // Not a gate — a fight the tide is a weapon in. The pool is drain, so
        // at MID it is shallow water the anglerfry hunt in and at LOW it is a
        // floor of holes: an aquatic enemy out of water flops and dies
        // (ENEMY_BEACHED_FRAMES), and `tideOnly` puts it to sleep before that.
        // The dry ring round the edge is what keeps the room honest — the fight
        // is optional and the crossing never depends on the iron.
        map: [
          '####..####',
          '#........#',
          '#.444444.#',
          '..444444.#',
          '..444444.#',
          '#.444444.#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['anglerfry', 3, 3],
          ['anglerfry', 6, 4],
          ['crab', 1, 6],
        ],
      },
      '0,5,1': {
        name: 'The Long Race',
        // Gate, wells near, entered from the east and crossed westward.
        map: [
          '##########',
          '##########',
          '##########',
          '..4443333.',
          '..4443333.',
          '#########.',
          '####......',
          '####..####',
        ],
        anchorGate: { from: [9, 3], to: [0, 3] },
      },
      '0,4,1': {
        name: 'The Keyvault',
        map: [
          '##########',
          '#........#',
          '#.11..11.#',
          '#.11..11..',
          '#.11..11..',
          '#.11..11.#',
          '#........#',
          '##########',
        ],
        entities: [
          ['chest', 4, 2, { pickup: 'key' }],
          ['keese', 7, 1],
        ],
      },
      '0,5,3': {
        // THE ONE MULTI-SCREEN ROOM IN THE GAME, and the worked example for
        // P8's remaining five dungeons. It is 2x1: eight rows of TWENTY
        // characters, one grid, not two screens laid side by side. It owns map
        // cells 5,3 and 6,3, so nothing else may be keyed to 6,3.
        //
        // WHY THIS ROOM AND NOT ANOTHER.
        //
        //   * It is the dungeon's set piece. The P8 amendment says the large
        //     rooms land on set pieces and most rooms stay one screen; a
        //     miniboss arena is the clearest thing in D1 that a 10-tile room
        //     was cramping. The Clawcrab now sits at the far end and the walk
        //     to it is the fight starting.
        //   * It is NOT an anchor gate. All three of D1's gates and both of its
        //     gauge rooms are proved impassable-without-the-iron by
        //     `tools/check-anchor.mjs`, and re-proving one of those at a new
        //     width is a second job, not this one.
        //   * Converting it creates no new seam with anything. The cell it
        //     grows into, 6,3, has no neighbours: 7,3, 6,2 and 6,4 are all
        //     empty. Its own three doorways — north at x=4,5 into the Drowned
        //     Chamber, west at rows 3 and 4 into the Two Gauges, and the locked
        //     door at 2,3 — are all in the western screen and are untouched, so
        //     every facing wall in every neighbour is the wall it always was.
        //
        // The pinch at columns 9-10 on rows 1 and 6 is what keeps it reading as
        // one den with two lobes rather than as one twenty-tile box.
        //
        // THE LOCKED DOOR AT 2,3 IS THE ONLY WAY BETWEEN THE DEN AND THE WEST
        // ANTECHAMBER, and columns 0-1 of rows 2 and 5 are wall to make that
        // true. It was not true before — row 2 ran clear from column 1, so a
        // player standing in the antechamber could step up, round the door and
        // straight on, and key 3 bought nothing. That was so in the original
        // 10-wide room too; the widening did not cause it, it only made someone
        // walk the room and notice. Nothing in the toolchain catches a lock
        // with a way round it: `walk-dungeons.mjs` spends a key on any lock it
        // can reach and then asks only whether every room is reachable, so a
        // bypassable lock reads as a lock that got opened. If you add a locked
        // door anywhere, wall the four tiles round it yourself.
        //
        // The door is load-bearing in one direction that matters: `0,4,3`, the
        // gauge room with the Piece of Heart, is entered ONLY through it.
        //
        // THE SCENERY IN THE EAST LOBE IS THE POINT OF THE `M`/`U` WIRING.
        //
        // `U` is `dUrnGrotto` and `M` is `dLionHead`, both extracted by
        // `tools/rip-dungeon-themes.py` in P7.5 and both unreachable from any
        // room grid until now — they had tiledefs and a comment saying "for P8
        // to place" and no legend character, so the art shipped in the build
        // with nothing able to name it. These four tiles are the first use.
        //
        // Placed the way the source places them: masks set INTO the far wall,
        // urns standing against it. Both are SOLID, and they are seated in the
        // outer row of the lobe where nothing routes through — a solid tile in
        // the middle of this room would narrow the arena the widening bought.
        //
        // THE FLOOR IS STILL DELIBERATELY PLAIN, AND `,` IS NOT AVAILABLE HERE.
        //
        // Twenty tiles of one floor tile is the failure mode a wide room
        // invites, and the obvious answer is the theme's own variant — `,`,
        // `dFloorGrottoAlt`, extracted by `tools/rip-dungeon-themes.py` in the
        // same P7.5 pass that gave this dungeon its walls and floor. It was
        // laid in as a scoured track under the claw, screenshotted, and taken
        // straight back out: `dFloorGrottoAlt` and `dFloorWet` — the MID form
        // of the `dBasin` tide tile this room is dotted with — carry the SAME
        // PALETTE, `stonef`. So the decoration read as standing water, in a
        // room whose four real damp patches are the only thing on the floor
        // that is supposed to. A floor variant that lies about the tide is
        // worse than a bare floor.
        //
        // This is a property of three of the eight themes, not of this room:
        // Grotto, Cistern and Salt all have an Alt floor in `stonef`. In those
        // dungeons `,` is a wet-looking tile and must be treated as one. Coral,
        // Bog, Wood, Palace and Abyss are clear and can use it freely.
        name: 'Clawcrab Den',
        size: [2, 1],
        map: [
          '####..#######M##M###',
          '#........##.U....U.#',
          '##2....2....2....2.#',
          '..L................#',
          '..#................#',
          '##2....2....2....2.#',
          '#........##........#',
          '####################',
        ],
        entities: [
          ['clawcrab', 14, 3],
        ],
        puzzle: {
          enemies: true,
          flag: 'd1_clawcrab',
          reward: { say: 'The claw stops moving. The way west is quiet.' },
        },
      },
      '0,4,3': {
        name: 'The Two Gauges',
        // Anchor room, and the one that fits in a room this size without a
        // corridor: the door reads two wells five tiles apart and wants one
        // drained and the other drowned. The held patch is five across, so it
        // cannot cover both — one gauge is the base and the other is under the
        // iron, whichever way round the player works it out.
        map: [
          '##########',
          '#........#',
          '#.3....3.#',
          '#.........',
          '#.........',
          '####D#####',
          '#....../.#',
          '##########',
        ],
        entities: [
          ['keese', 6, 1],
          // Sealed in behind the door the gauges open, and visible from the
          // moment the player walks in, which is what makes the door worth
          // solving rather than worth ignoring.
          ['pickup', 2, 6, { kind: 'heartPiece' }],
        ],
        warps: [
          { x: 7, y: 6, to: { map: 'd1', floor: 0, rx: 3, ry: 4, px: 64, py: 48, dir: 'down' } },
        ],
        readable: [
          [4, 4, 'Two marks over the door: one well empty, one well full.'],
        ],
        puzzle: {
          condition: (g, r) => g.tide.levelAt(2, 2, r) === 0 && g.tide.levelAt(7, 2, r) === 2,
          flag: 'd1_gauges_east',
          reward: {
            openDoors: [[4, 5]],
            say: 'Both marks read at once. The door gives.',
          },
        },
        anchorGauges: { a: [2, 2], aLevel: 0, b: [7, 2], bLevel: 2, door: [4, 5] },
      },

      // ---- west wing -------------------------------------------------------
      '0,2,2': {
        name: 'The Long Sluice',
        // Gate, DRAINS near: the mirror sequence. Sound MID, sink the iron in
        // the drain so it keeps its water, then conch to LOW so the well ahead
        // empties. Entered from the east.
        map: [
          '##########',
          '##########',
          '##########',
          '..3334444.',
          '..3334444.',
          '##########',
          '##########',
          '##########',
        ],
        anchorGate: { from: [9, 3], to: [0, 3] },
      },
      '0,1,2': {
        name: 'Cistern Turn',
        map: [
          '####..####',
          '#........#',
          '#..2222..#',
          '#..2222...',
          '#..2222...',
          '#..2222..#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['zol', 2, 1],
          ['crab', 6, 6],
        ],
      },
      '0,1,3': {
        name: 'Weeping Cistern',
        map: [
          '####..####',
          '#........#',
          '#..1111..#',
          '#..1111..#',
          '#..1111..#',
          '#........#',
          '#........#',
          '##########',
        ],
        entities: [
          ['crab', 4, 6],
          ['switch', 1, 1],
          ['switch', 8, 1],
          ['block', 1, 2],
          ['block', 8, 2],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd1_013_puzzle',
          reward: {
            spawn: [['pickup', 4, 6, { kind: 'rupee20' }]],
            say: 'A catch lets go under the floor.',
          },
        },
      },
      '0,1,1': {
        name: 'The Drip Vault',
        // The second pair of gauges, stacked instead of side by side — five
        // rows apart, which the patch cannot span either.
        map: [
          '##########',
          '#...3....#',
          '#........#',
          '#.......D.',
          '#........#',
          '#..pp....#',
          '#...3....#',
          '####..####',
        ],
        entities: [
          ['keese', 2, 2],
        ],
        readable: [
          [7, 4, 'Two marks beside the door: the upper well empty, the lower full.'],
        ],
        puzzle: {
          condition: (g, r) => g.tide.levelAt(4, 1, r) === 0 && g.tide.levelAt(4, 6, r) === 2,
          flag: 'd1_gauges_west',
          reward: {
            openDoors: [[8, 3]],
            say: 'Both marks read at once. The door gives.',
          },
        },
        anchorGauges: { a: [4, 1], aLevel: 0, b: [4, 6], bLevel: 2, door: [8, 3] },
      },
      '0,2,1': {
        name: 'Bosskey Vault',
        map: [
          '##########',
          '#..pp....#',
          '#........#',
          '.........#',
          '.........#',
          '#..../...#',
          '#........#',
          '##########',
        ],
        entities: [
          ['chest', 4, 3, { pickup: 'bossKey' }],
          ['keese', 7, 6],
        ],
        warps: [
          { x: 5, y: 5, to: { map: 'd1', floor: 0, rx: 3, ry: 3, px: 64, py: 64, dir: 'down' } },
        ],
      },
      '0,3,1': {
        name: 'Gohmaraq, the Tidewash Claw',
        // A boss room that KEEPS the mechanic instead of switching it off. The
        // conch is still suppressed — `noTide` — so the arena is whatever it
        // was when you walked in, and the only thing that moves it is a
        // Bottled Tide, or the boss itself: Gohmaraq calls unlockTide on its
        // intro and hands the conch back for the length of the fight. The floor
        // is basin, which is walkable at all three levels, because a locked
        // room has to work at whichever one the player brought.
        map: [
          '##########',
          '#..2222..#',
          '#..2222..#',
          '#..2222..#',
          '#..2222..#',
          '#..2222..#',
          '#........#',
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
    },
  });

  // --- Dungeon 2: Coral Spire ----------------------------------------------
  //
  // TIDE THEME: COMMIT-BLIND BECOMES PLAN-FIRST. The Grotto taught you to hold
  // the water still. The Spire teaches you that you cannot always see what the
  // water is about to do, and then makes you bet on it. The Brineglass Lens is
  // the answer and this dungeon is where you are taught it: look before you
  // drop, because after you drop there is no looking and no climbing back.
  //
  // THE COMMIT PRIMITIVE, stated once because three rooms are built out of it.
  // Written down a column, from the shelf the player arrives on:
  //
  //     .    the shelf — the last tile you can turn back from
  //     "    \
  //     "     |  three tiles of one-way lip
  //     "    /
  //     8    the sump floor: tideRock, standable at every level
  //     1/4  the sill: dSluice or dDrain, and at HIGH they are the same water
  //     2    the lip of the room, walkable at every level
  //
  // The room is `tideForce: 2` and `noTide: true`, and both halves of that are
  // load-bearing:
  //
  //   * `tideForce` PINS THE WATER AT HIGH on entry, so the choice is always
  //     made at the one level where `dSluice` and `dDrain` are the same tile.
  //     At HIGH both are `dWaterD` — same art, same palette, same flags — so
  //     the two sumps are not merely similar, they are the identical picture.
  //     Take the pin away and the player walks in at LOW, reads the pit off
  //     the floor, and the Lens is decoration.
  //   * `noTide` REFUSES THE CONCH, so a wrong sump cannot be undone where you
  //     stand. Without it the player drops into the drain, sounds the conch to
  //     MID, and wades out over the water that was a hole a second ago.
  //
  // What moves the sea is the PLATE on the sump floor: stepping on it steps the
  // water exactly one level, HIGH -> LOW, which is exactly the level the Lens
  // draws (`Game.drawLensGhost` previews `(level + 1) % 3`). That equality is
  // the whole dungeon in one line: THE THING THE LENS SHOWS YOU IS THE THING
  // THE DROP PRODUCES. `tools/check-lens.mjs` asserts it per room rather than
  // trusting this comment, and calls each room's script to prove the plate
  // still steps the sea.
  //
  // Why three tiles of lip and not one. Every other ledge in the game is one
  // tile deep, and a one-tile lip is NOT one-way: `room.solidAt` lets a jumping
  // player through `F.LEDGE`, and a hop carries 2.29 tiles (feel.js), so a
  // player with the base moveset simply jumps back up it. Three tiles puts the
  // far side four tiles away and out of reach. A commit room built on a
  // one-tile lip would read exactly like this one and hold nobody.
  //
  // Why the sumps are 1x1 rooms and not one wide room. A 2x1 would fit three
  // sumps, and it would also put the third one off the side of the camera —
  // and then the Lens would be needed because the branch is off-screen rather
  // than because it is at another tide level, which is the wrong reason and
  // P7.6's own brief warns about it. Everything the player is choosing between
  // is on one screen, at all times, drawn identically. The only thing that is
  // not on the screen is the future, and that is what the Lens is for.
  //
  // What a wrong guess costs, and why it is never a softlock: each sump has a
  // chute cut in its floor — one-way stairs back down to the hub (floor 0) or
  // the Upper Landing (floor 1). Guess wrong and you pay the walk back up. The
  // chute is in both sumps, at the same place in each, because anything present
  // in one sump and absent in the other would be the answer written on the
  // wall.
  //
  // The three instances, and how they differ:
  //   0,4,3 The Sounding Drop  west is the way on. First one; the chute drops
  //                            you at the hub, three rooms back.
  //   1,3,4 The Split Cistern  EAST is the way on — the first room's answer is
  //                            the wrong answer here, which is the point.
  //   1,3,2 The Crown Sump     west again, and it is the last thing between you
  //                            and Anemos: the boss door is already behind you
  //                            when you make it.
  //
  // Intended route (23 rooms; the Lens is room 10 of 23):
  //   3,7 mouth -> 3,6 the landing (learn: a plate underfoot steps the sea)
  //   -> 4,6 bone cell (a blank, and the Bosun's Whistle — a MID charm, which
  //      is the only case open to a player holding one essence)
  //   -> 3,5 hub -> 2,5 Dungeon Map -> 4,5 torches (key 1)
  //   -> 3,4 switches (key 2) -> 2,4 the weeping cell (Piece of Heart)
  //   -> 3,3 the Coral Shaft [locked, key 2] (Chartstone; 1x2, the game's first
  //      room that is taller than the screen)
  //   -> 4,4 the Sealed Cell [locked, key 1] THE BRINEGLASS LENS
  //   -> 4,3 [commit] -> 4,2 stair up
  //   1F: 3,5 landing -> 2,5 Piece of Heart -> 4,5 Reefguard (miniboss)
  //   -> 3,4 [commit] -> 3,3 upper hall -> 2,3 switches (key 3)
  //   -> 2,2 Boss Key -> 4,3 [locked, key 3] -> 5,3 big chest: Bombs
  //   -> boss door -> 3,2 [commit] -> 3,1 Anemos
  registerMap({
    id: 'd2',
    kind: 'dungeon',
    name: 'Coral Spire',
    w: 8, h: 8, floors: 2,
    legend: 'dungeonCoral',
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
      '0,3,7': {
        name: 'Spire Mouth',
        map: [
          '##M#..#M##',
          '#U......U#',
          '#........#',
          '#..8..8..#',
          '#..8..8..#',
          '#........#',
          '#........#',
          '####/#####',
        ],
        warps: [
          { x: 4, y: 7, to: { map: 'overworld', floor: 0, rx: 10, ry: 5, px: 64, py: 32, dir: 'down' } },
        ],
        readable: [
          [2, 2, 'Coral script: "What rises, carries. What falls, reveals."'],
        ],
      },
      '0,3,6': {
        name: 'Coral Landing',
        // The plate, taught where it costs nothing. Every plate in this dungeon
        // steps the sea one level; this is the only one the player meets before
        // anything depends on it, and it fires ONCE EVER rather than once per
        // entry — a room on the main route that shoved the tide every time you
        // walked through it would be a tax, not a lesson.
        map: [
          '####..####',
          '#........#',
          '#.222222.#',
          '#.222222..',
          '#.222222..',
          '#.222222.#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['switch', 4, 6, { hold: false }],
          ['urchin', 3, 2],
          ['crab', 6, 4],
        ],
        readable: [
          [7, 6, 'Coral script: "The floor keeps the count. Step, and the sea steps."'],
        ],
        script: {
          onEvent(game, name, data) {
            if (name !== 'switch' || !data || !data.pressed) return;
            if (game.progress.flags.d2_plate_taught) return;
            game.progress.flags.d2_plate_taught = true;
            game.forceTideStep();
            game.say('The plate sinks under you, and somewhere below\nthe Spire the sea takes a step.');
          },
        },
      },
      '0,4,6': {
        name: 'Bone Cell',
        map: [
          '##########',
          '#U......U#',
          '#........#',
          '.........#',
          '.........#',
          '#.,,,,,,.#',
          '#........#',
          '##########',
        ],
        entities: [
          // A MID charm, deliberately. The player walks into this dungeon
          // holding one essence, so the MID case is the only case open to them
          // and a LOW or HIGH charm here would be a reward nobody can switch
          // on. See docs/EXECUTION-PLAN.md, "P7 is CLOSED".
          ['chest', 4, 2, { charm: 'bosunsWhistle' }],
          ['pickup', 6, 4, { kind: 'blank' }],
          ['urchin', 6, 2],
        ],
      },
      '0,3,5': {
        name: 'Spire Well',
        // The hub, and the room every chute in the dungeon empties into.
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
        ],
      },
      '0,2,5': {
        name: 'Map Nook',
        map: [
          '##########',
          '#U......U#',
          '#........#',
          '#.........',
          '#.........',
          '#..pp....#',
          '#........#',
          '##########',
        ],
        entities: [
          ['pickup', 4, 3, { kind: 'dungeonMap' }],
          ['urchin', 6, 2],
        ],
      },
      '0,4,5': {
        name: 'Torch Cell',
        map: [
          '##########',
          '#U......U#',
          '#........#',
          '.........#',
          '.........#',
          '#........#',
          '#..,,,,..#',
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
      '0,3,4': {
        name: 'Rising Chamber',
        // Each block is seated orthogonally ADJACENT to its switch with clear
        // floor behind it — a block moves exactly one tile, ever.
        map: [
          '####..####',
          '#........#',
          '#........#',
          '..........',
          '..........',
          '#.2....2.#',
          '#.2....2.#',
          '####..####',
        ],
        entities: [
          ['switch', 2, 2],
          ['switch', 7, 2],
          ['block', 2, 3],
          ['block', 7, 3],
          ['jellyfish', 4, 4],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd2_rising',
          reward: {
            spawn: [['pickup', 4, 1, { kind: 'key' }]],
            say: 'Water drains out of a niche in the wall.',
          },
        },
      },
      '0,2,4': {
        name: 'Weeping Cell',
        map: [
          '##########',
          '#........#',
          '#..3333..#',
          '#..3333...',
          '#..3333...',
          '#..3333..#',
          '#........#',
          '##########',
        ],
        entities: [
          ['urchin', 2, 1],
          ['crab', 7, 6],
        ],
        puzzle: {
          enemies: true,
          flag: 'd2_weeping',
          reward: {
            spawn: [['pickup', 4, 6, { kind: 'heartPiece' }]],
            say: 'Something rolls out of the weeping wall.',
          },
        },
      },
      '0,3,2': {
        name: 'Coral Shaft',
        // 1x2 — TWO SCREENS TALL, and the first room in the game that is taller
        // than the screen rather than wider. Sixteen rows of ten characters,
        // owning map cells 3,3 and 3,2; nothing else may be keyed in that
        // footprint and validate.mjs fails if it is.
        //
        // Picked with the same three tests d1 0,5,3 was: it is not a commit
        // room, so nothing check-lens.mjs proves had to be re-proved; the cell
        // it grows into (3,2) has no neighbours at all, so no facing wall in
        // any other room moved; and its only doorway is in its southern screen
        // and is untouched. It exists because the vertical camera axis had
        // never moved in a running game.
        size: [1, 2],
        map: [
          '##M##M####',
          '#U..pp..U#',
          '#........#',
          '#.222222.#',
          '#.222222.#',
          '#........#',
          '#.___....#',
          '#........#',
          '#.######.#',
          '#.#3333#.#',
          '#.######.#',
          '#........#',
          '####L#####',
          '#........#',
          '#..8..8..#',
          '####..####',
        ],
        entities: [
          ['chest', 4, 2, { pickup: 'chartstone' }],
          ['keese', 6, 7],
          ['crab', 3, 13],
          ['urchin', 7, 11],
        ],
      },
      '0,4,4': {
        name: 'Sealed Cell',
        map: [
          '########.#',
          '#..#.....#',
          '#..#.....#',
          '...#.....#',
          '...L.....#',
          '#..#.....#',
          '#..#.....#',
          '##########',
        ],
        entities: [
          ['chest', 6, 3, { big: true, item: 'lens', level: 1 }],
          ['pickup', 6, 5, { kind: 'rupee20' }],
          ['keese', 7, 2],
        ],
      },
      '0,4,3': {
        name: 'The Sounding Drop',
        // The commit primitive; see the dungeon header. West is the way on.
        map: [
          '##########',
          '/4448<<<.#',
          '####/###.#',
          '#####....#',
          '#####....#',
          '/1118<<<.#',
          '####/###.#',
          '########.#',
        ],
        noTide: true,
        tideForce: 2,
        lensRoom: {
          at: 2, resolve: 0,
          decide: [8, 3],
          to: [0, 5],
          branches: [
            { name: 'upper well', region: [0, 1, 4, 2], land: [4, 1], plate: [4, 1], back: [4, 2] },
            { name: 'lower well', region: [0, 5, 4, 6], land: [4, 5], plate: [4, 5], back: [4, 6] },
          ],
        },
        // Four stairs, and two of them are pairs. The chutes at 4,2 and 4,6 go
        // back the way you came; the stairs at 0,1 and 0,5 go on. Only one of
        // the two ways on is ever reachable — the drain in front of the other
        // never drains — and the unreachable one is not an oversight: a stair
        // present in one well and absent from the other would be the answer
        // written on the wall, and a player who guessed wrong is meant to stand
        // in the water and look at the steps he cannot get to.
        //
        // The sill is THREE tiles, not one. One tile of pit is not a barrier:
        // the hop in the base moveset carries 2.29 tiles, so a single drain is
        // a stride. check-lens.mjs found that in this room on its first run,
        // which is the whole argument for writing the prover before the rooms.
        warps: [
          { x: 4, y: 2, to: { map: 'd2', floor: 0, rx: 3, ry: 5, px: 64, py: 16, dir: 'down' } },
          { x: 4, y: 6, to: { map: 'd2', floor: 0, rx: 3, ry: 5, px: 64, py: 16, dir: 'down' } },
          { x: 0, y: 1, to: { map: 'd2', floor: 0, rx: 4, ry: 2, px: 64, py: 48, dir: 'up' } },
          { x: 0, y: 5, to: { map: 'd2', floor: 0, rx: 4, ry: 2, px: 64, py: 48, dir: 'up' } },
        ],
        entities: [
          ['switch', 4, 1, { hold: false }],
          ['switch', 4, 5, { hold: false }],
        ],
        readable: [
          [7, 6, 'Coral script: "Two throats, one drinker. Choose before you know."'],
        ],
        script: {
          onEvent(game, name, data) {
            if (name !== 'switch' || !data || !data.pressed) return;
            game.forceTideStep();
          },
        },
      },
      '0,4,2': {
        name: 'Stair Coil',
        map: [
          '##########',
          '#U......U#',
          '#........#',
          '#..8..8..#',
          '#..8..8..#',
          '#....../.#',
          '#........#',
          '##########',
        ],
        warps: [
          { x: 7, y: 5, to: { map: 'd2', floor: 1, rx: 3, ry: 5, px: 64, py: 16, dir: 'down' } },
        ],
        entities: [
          ['keese', 3, 2],
        ],
      },
      '1,3,5': {
        name: 'Upper Landing',
        map: [
          '########.#',
          '#........#',
          '#.8....8.#',
          '..........',
          '..........',
          '#........#',
          '#/.......#',
          '##########',
        ],
        warps: [
          { x: 1, y: 6, to: { map: 'd2', floor: 0, rx: 3, ry: 5, px: 64, py: 16, dir: 'down' } },
        ],
        entities: [
          ['keese', 3, 4],
        ],
      },
      '1,2,5': {
        name: 'Cistern Cell',
        map: [
          '##########',
          '#U......U#',
          '#..3333..#',
          '#..3333...',
          '#..3333...',
          '#..3333..#',
          '#........#',
          '##########',
        ],
        entities: [
          ['urchin', 2, 1],
          ['jellyfish', 7, 6],
        ],
        puzzle: {
          enemies: true,
          flag: 'd2_cistern',
          reward: {
            spawn: [['pickup', 4, 6, { kind: 'heartPiece' }]],
            say: 'A light comes up out of the water.',
          },
        },
      },
      '1,4,5': {
        name: 'Reefguard Hall',
        map: [
          '##########',
          '#........#',
          '#..,,,,..#',
          '.........#',
          '.........#',
          '#..,,,,..#',
          '#........#',
          '##########',
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
      '1,3,4': {
        name: 'The Split Cistern',
        // The same primitive as 0,4,3 with the answer on the other side. That
        // is the whole variation and it is deliberate: the first room teaches
        // that the left throat drains, and this one is where a player who
        // learned the ROOM rather than the RULE pays for it.
        map: [
          '##########',
          '/1118<<<.#',
          '####/###.#',
          '#####....#',
          '#####....#',
          '/4448<<<.#',
          '####/###.#',
          '########.#',
        ],
        noTide: true,
        tideForce: 2,
        lensRoom: {
          at: 2, resolve: 0,
          decide: [8, 3],
          to: [0, 1],
          branches: [
            { name: 'upper well', region: [0, 1, 4, 2], land: [4, 1], plate: [4, 1], back: [4, 2] },
            { name: 'lower well', region: [0, 5, 4, 6], land: [4, 5], plate: [4, 5], back: [4, 6] },
          ],
        },
        // Four stairs, and two of them are pairs. The chutes at 4,2 and 4,6 go
        // back the way you came; the stairs at 0,1 and 0,5 go on. Only one of
        // the two ways on is ever reachable — the drain in front of the other
        // never drains — and the unreachable one is not an oversight: a stair
        // present in one well and absent from the other would be the answer
        // written on the wall, and a player who guessed wrong is meant to stand
        // in the water and look at the steps he cannot get to.
        //
        // The sill is THREE tiles, not one. One tile of pit is not a barrier:
        // the hop in the base moveset carries 2.29 tiles, so a single drain is
        // a stride. check-lens.mjs found that in this room on its first run,
        // which is the whole argument for writing the prover before the rooms.
        warps: [
          { x: 4, y: 2, to: { map: 'd2', floor: 1, rx: 3, ry: 5, px: 64, py: 16, dir: 'down' } },
          { x: 4, y: 6, to: { map: 'd2', floor: 1, rx: 3, ry: 5, px: 64, py: 16, dir: 'down' } },
          { x: 0, y: 1, to: { map: 'd2', floor: 1, rx: 3, ry: 3, px: 64, py: 64, dir: 'up' } },
          { x: 0, y: 5, to: { map: 'd2', floor: 1, rx: 3, ry: 3, px: 64, py: 64, dir: 'up' } },
        ],
        entities: [
          ['switch', 4, 1, { hold: false }],
          ['switch', 4, 5, { hold: false }],
        ],
        script: {
          onEvent(game, name, data) {
            if (name !== 'switch' || !data || !data.pressed) return;
            game.forceTideStep();
          },
        },
      },
      '1,3,3': {
        name: 'Upper Hall',
        // Arrived at by the Split Cistern's stair, not by a doorway — its south
        // wall is solid, which is what stops a player walking back down into a
        // sump whose water is pinned at HIGH.
        map: [
          '########.#',
          '########B#',
          '########.#',
          '..........',
          '..........',
          '#........#',
          '#..3333..#',
          '##########',
        ],
        entities: [
          ['crab', 2, 4],
          ['urchin', 6, 5],
        ],
      },
      '1,2,3': {
        name: 'Salt Cell',
        map: [
          '####..####',
          '#........#',
          '#........#',
          '#.........',
          '#.........',
          '#.2....2.#',
          '#.2....2.#',
          '##########',
        ],
        entities: [
          ['switch', 2, 2],
          ['switch', 7, 2],
          ['block', 2, 3],
          ['block', 7, 3],
          ['keese', 4, 4],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd2_salt',
          reward: {
            spawn: [['pickup', 4, 1, { kind: 'key' }]],
            say: 'Stone settles into stone.',
          },
        },
      },
      '1,2,2': {
        name: 'Coral Vault',
        map: [
          '##########',
          '#U......U#',
          '#........#',
          '#..8..8..#',
          '#..8..8..#',
          '#........#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['chest', 4, 3, { pickup: 'bossKey' }],
          ['jellyfish', 2, 5],
        ],
      },
      '1,4,3': {
        name: 'Whelk Hall',
        map: [
          '##########',
          '#....#...#',
          '#....#...#',
          '.....#....',
          '.....L....',
          '#....#...#',
          '#....#...#',
          '##########',
        ],
        entities: [
          ['barnacle', 2, 5],
          ['keese', 7, 2],
        ],
      },
      '1,5,3': {
        name: 'Bomb Vault',
        map: [
          '##########',
          '#........#',
          '#..,,,,..#',
          '.........#',
          '.........#',
          '#..,,,,..#',
          '#........#',
          '##########',
        ],
        entities: [
          ['chest', 4, 3, { big: true, item: 'bombs', level: 1 }],
        ],
      },
      '1,3,2': {
        name: 'The Crown Sump',
        // The third and last, and the only one the player meets with the boss
        // door already behind them. West is the way on again.
        map: [
          '##########',
          '/4448<<<.#',
          '####/###.#',
          '#####....#',
          '#####....#',
          '/1118<<<.#',
          '####/###.#',
          '########.#',
        ],
        noTide: true,
        tideForce: 2,
        lensRoom: {
          at: 2, resolve: 0,
          decide: [8, 3],
          to: [0, 5],
          branches: [
            { name: 'upper well', region: [0, 1, 4, 2], land: [4, 1], plate: [4, 1], back: [4, 2] },
            { name: 'lower well', region: [0, 5, 4, 6], land: [4, 5], plate: [4, 5], back: [4, 6] },
          ],
        },
        // Four stairs, and two of them are pairs. The chutes at 4,2 and 4,6 go
        // back the way you came; the stairs at 0,1 and 0,5 go on. Only one of
        // the two ways on is ever reachable — the drain in front of the other
        // never drains — and the unreachable one is not an oversight: a stair
        // present in one well and absent from the other would be the answer
        // written on the wall, and a player who guessed wrong is meant to stand
        // in the water and look at the steps he cannot get to.
        //
        // The sill is THREE tiles, not one. One tile of pit is not a barrier:
        // the hop in the base moveset carries 2.29 tiles, so a single drain is
        // a stride. check-lens.mjs found that in this room on its first run,
        // which is the whole argument for writing the prover before the rooms.
        warps: [
          { x: 4, y: 2, to: { map: 'd2', floor: 1, rx: 3, ry: 5, px: 64, py: 16, dir: 'down' } },
          { x: 4, y: 6, to: { map: 'd2', floor: 1, rx: 3, ry: 5, px: 64, py: 16, dir: 'down' } },
          { x: 0, y: 1, to: { map: 'd2', floor: 1, rx: 2, ry: 1, px: 64, py: 64, dir: 'up' } },
          { x: 0, y: 5, to: { map: 'd2', floor: 1, rx: 2, ry: 1, px: 64, py: 64, dir: 'up' } },
        ],
        entities: [
          ['switch', 4, 1, { hold: false }],
          ['switch', 4, 5, { hold: false }],
        ],
        readable: [
          [7, 6, 'Coral script: "The crown drinks last. Look, then fall."'],
        ],
        script: {
          onEvent(game, name, data) {
            if (name !== 'switch' || !data || !data.pressed) return;
            game.forceTideStep();
          },
        },
      },
      '1,2,1': {
        name: 'Crown Landing',
        // Where the Crown Sump's stair comes out, and the boss's own approach.
        // It exists because the sump cannot open straight into the arena: a
        // boss room is `noTide`, and every walkable tile in a tide-locked room
        // has to be reachable from a way in at all three levels.
        map: [
          '##########',
          '#U......U#',
          '#........#',
          '#.........',
          '#.........',
          '#..8..8..#',
          '#........#',
          '##########',
        ],
        entities: [
          ['keese', 3, 2],
        ],
      },
      '1,3,1': {
        name: 'Anemos, the Crowned Column',
        // Boss rooms keep `noTide`: the arena is whatever level you brought,
        // which after the Crown Sump is always LOW. The floor is plain stone
        // because a locked room has to work at whichever level the player
        // arrives with.
        map: [
          '##########',
          '#........#',
          '#........#',
          '.........#',
          '.........#',
          '#........#',
          '#........#',
          '##########',
        ],
        noTide: true,
        entities: [
          ['anemos', 5, 2],
        ],
        script: {
          onEvent(game, name) {
            if (name === 'bossDead') game.spawnPickup(80, 40, 'heartContainer', { grabDelay: 30 });
          },
        },
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
    legend: 'dungeonBog',
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
    legend: 'dungeonCistern',
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
