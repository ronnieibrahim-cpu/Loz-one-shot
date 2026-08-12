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
  // TIDE THEME: COMMIT-BLIND BECOMES PLAN-FIRST. The grotto taught you to make
  // the sea do two things at once. The spire takes that away and asks a
  // different question: what will this room BE, one turn of the conch from now,
  // and are you willing to bet a walk back on your answer? Its floors are cut
  // through with shaft mouths that are open drops until the sea comes up level
  // with the lip, so the spire is a building you can only be inside of at one
  // tide at a time — and the choices it puts in front of you cannot be undone.
  //
  // THE LENS PRIMITIVE, stated once because three rooms are built out of it.
  //
  // The Brineglass Lens cannot make a tile passable. It shows you the room at
  // the NEXT tide level and nothing else, so a room that "requires" it can
  // never be a gate — P9 forbids that outright and the D2 decision in
  // docs/EXECUTION-PLAN.md settles why both rules stand. What it can be is a
  // room that makes you COMMIT before you know. Written as a shape:
  //
  //     ...........0000000000..........      the wading floor: `0` dFlood,
  //     ...........#___##___#..........      a shaft mouth, walkable at HIGH
  //     ...........#/22##22/#..........      and at neither level below it
  //     ...........##11##99##..........      two cells under two one-way ledges
  //     ...........##11##99##..........      two channels, one road, one rock
  //
  // At HIGH `1` (dSluice) and `9` (drownWall) are BOTH deep water — not merely
  // similar, the same tile: `waterD` and `dWaterD` are two names for one
  // definition, so on a 160x144 screen the two channels are one sheet of water.
  // At LOW one is wet floor you walk out along and the other is rock. The
  // ledges are one-way, so the cell you drop into is the cell you are in.
  //
  // THREE THINGS HAD TO BE TRUE, and each one is a way the room could have been
  // a Lens room in the data and two button presses in the hand:
  //
  //   1. NOWHERE BEFORE THE CHOICE MAY SURVIVE A CHANGE OF THE TIDE. This is
  //      the whole reason `dFlood` exists. Every other tide tile in the game
  //      GAINS footing as the water leaves; a wading floor made of any of them
  //      is somewhere to stand, sound the conch, read the answer off the screen
  //      and sound it back — and then the Lens has saved the player three
  //      button presses and nothing else. `0` is walkable at HIGH and at no
  //      other level, so sounding the conch in the gallery does not show you
  //      the answer, it drops you into a cell. Committing IS what the conch
  //      does here, which is exactly the sentence in docs/ITEMS.md that the
  //      item was designed against.
  //   2. THE WRONG BRANCH MUST BE WRONG AT EVERY LEVEL, not just at the one it
  //      resolves to. `4` dDrain looks like the obvious dead end — an open pit
  //      when the water goes — but it is wadeable at MID, so a player who
  //      guessed wrong would sound the conch once more and walk out. `9` is a
  //      wall at LOW and at MID and deep water at HIGH: shut, always.
  //   3. THE TWO CELLS MUST BE MIRRORS, down to the drain. Both hold a stair
  //      back down into the spire, in mirrored corners. One cell with a visible
  //      way out and one without would tell the player which was which from the
  //      wading floor, and the room would reward looking rather than the Lens.
  //
  // These rooms are 1x1 AND THAT IS A DECISION, not an oversight. A Lens room
  // wants both branches on the screen at once: the information the item hides
  // is hidden in TIME, not in space. Widen the room and the branches go
  // off-camera — at which point the Lens does not help either, because it
  // redraws the room the camera is already showing. The one wide room in this
  // dungeon is the Drowned Concourse, and it is wide because it is the room
  // that TEACHES `0` — twenty tiles of wading floor with the spire's shafts
  // under it, read in one glance, before any of it is a bet.
  //
  // The Sounding Shaft is the same primitive turned over. The choice is made at
  // LOW off a `3` dWell shelf (wadeable at LOW, drowned above), and the two
  // channels are `4` dDrain and `O` dPit — at LOW they are the same tile, a
  // hole; at MID one of them has filled to a ford and the other is still a
  // hole. `tools/check-lens.mjs` proves both rooms, both directions.
  //
  // Intended route (26 rooms; the Lens is room 12 of 26):
  //   0F: 3,7 mouth -> 3,6 landing -> 2,6 bone cell (a blank)
  //       -> 4,6 anemone cell (Barnacle Skin, the charm placed by hand)
  //       -> 3,5 hub -> 2,5 Dungeon Map -> 1,5 Piece of Heart
  //       -> 3,4 rising chamber (switches open the north door)
  //       -> 2,4 Chartstone -> 3,3 Small Key 1
  //       -> 4,5 THE DROWNED CONCOURSE (2x1, learn `0`)
  //       -> 4,4 Sealed Cell [locked, key 1] THE BRINEGLASS LENS
  //       -> 4,3 stair up
  //   1F: 4,2 upper landing -> 3,2 THE WADING GALLERY [lens]
  //       -> 3,3 the sump -> 4,3 Reefguard (miniboss) -> 5,3 Bombs
  //       -> 4,4 Small Key 2 -> 3,4 THE SOUNDING SHAFT [lens]
  //       -> 3,5 balcony [locked, key 2] -> 2,5 Small Key 3
  //       -> 2,4 stair [locked, key 3] -> 2,3 Boss Key -> 2,2 boss door
  //       -> 2,1 Anemos
  //
  // Both Lens rooms drain: every cell, right or wrong, has a stair in its back
  // corner that dumps the player into the Spire Well two floors down. That is
  // load-bearing three times over — it is what makes the wrong cell a walk back
  // rather than a soft lock, it is what keeps the two cells identical from
  // above, and it is why the dungeon can afford one-way ledges at all.
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
      bossRoom: '1,2,1',
      startRoom: '3,7',
      entrance: { map: 'overworld', floor: 0, rx: 10, ry: 5, px: 64, py: 32 },
    },
    rooms: {
      // ---- floor 0: the lower spire, and the tile the dungeon is built on --
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
          [2, 3, 'Coral script: "The spire is only a building\nat one tide. Choose which."'],
        ],
      },
      '0,3,6': {
        name: 'Coral Landing',
        map: [
          '####..####',
          '#........#',
          '#.3....3.#',
          '..........',
          '..........',
          '#.3....3.#',
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
      '0,2,6': {
        name: 'Bone Cell',
        map: [
          '##########',
          '##########',
          '##......##',
          '#.........',
          '#.........',
          '##..pp..##',
          '##########',
          '##########',
        ],
        entities: [
          ['pickup', 4, 3, { kind: 'blank' }],
          ['keese', 6, 2],
        ],
      },
      '0,4,6': {
        name: 'Anemone Cell',
        // THE CHARM PLACED BY HAND IN THIS DUNGEON, and it is a MID charm on
        // purpose. The player walks into the Coral Spire holding one essence,
        // so the MID case is the only case open for the whole of it and it
        // holds exactly one charm. A LOW or HIGH charm here would be a reward
        // nobody could switch on until after the boss.
        //
        // Barnacle Skin — one free hit per room — is the one on the roster that
        // belongs in THIS dungeon rather than any other: every Lens room is a
        // bet, and the dungeon that charges you for guessing wrong is the one
        // where a hit you get to spend is worth carrying.
        map: [
          '##########',
          '##########',
          '##......##',
          '.........#',
          '.........#',
          '##..UU..##',
          '##########',
          '##########',
        ],
        entities: [
          ['chest', 4, 3, { charm: 'barnacleSkin' }],
          ['urchin', 2, 2],
        ],
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
      '0,2,5': {
        name: 'Map Nook',
        map: [
          '##########',
          '##########',
          '##......##',
          '..........',
          '..........',
          '##..pp..##',
          '##########',
          '##########',
        ],
        entities: [
          ['pickup', 4, 3, { kind: 'dungeonMap' }],
          ['urchin', 6, 2],
        ],
      },
      '0,1,5': {
        name: 'Whelk Cell',
        map: [
          '##########',
          '##########',
          '##......##',
          '##........',
          '##........',
          '##..pp..##',
          '##########',
          '##########',
        ],
        entities: [
          ['pickup', 4, 3, { kind: 'heartPiece' }],
          ['barnacle', 6, 4],
        ],
      },
      '0,3,4': {
        name: 'Rising Chamber',
        // Two switches, two blocks, and the door they open is the only way
        // north. Each block is seated orthogonally adjacent to its switch with
        // plain floor behind it to push from — a PushBlock slides exactly one
        // tile, ever, so a block two tiles out can never reach.
        map: [
          '####.#####',
          '#........#',
          '####D#####',
          '#.444444.#',
          '..444444.#',
          '..444444.#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['switch', 2, 1],
          ['block', 3, 1],
          ['switch', 7, 1],
          ['block', 6, 1],
          ['jellyfish', 4, 4],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd2_034_puzzle',
          reward: {
            openDoors: [[4, 2]],
            say: 'Water drains out of a niche, and the door above lifts.',
          },
        },
      },
      '0,2,4': {
        name: 'Chart Cell',
        map: [
          '##########',
          '##########',
          '##......##',
          '##......##',
          '##........',
          '##........',
          '##......##',
          '##########',
        ],
        entities: [
          ['chest', 4, 4, { pickup: 'chartstone' }],
          ['keese', 3, 2],
        ],
      },
      '0,3,3': {
        name: 'Coral Cistern',
        map: [
          '##########',
          '##......##',
          '##.2222.##',
          '##.2222.##',
          '##......##',
          '####.#####',
          '####.#####',
          '####.#####',
        ],
        entities: [
          ['chest', 4, 1, { pickup: 'key' }],
          ['urchin', 6, 3],
        ],
      },
      '0,4,5': {
        name: 'The Drowned Concourse',
        // THE ONE MULTI-SCREEN ROOM IN THIS DUNGEON: 2x1, eight rows of TWENTY
        // characters, one grid. It owns map cells 4,5 and 5,5, so nothing else
        // may be keyed to 5,5 and its east neighbour would be 6,5.
        //
        // WHY THIS ROOM. It is where `0` dFlood is taught, and it is the only
        // room in the game where the tile is not a bet. At HIGH it is a wading
        // hall with a dry island in the middle of it; sound the conch and the
        // floor is simply not there — twenty tiles of open shaft with the
        // island stranded in the centre. That reads in ONE GLANCE at this
        // width and it does not read at ten tiles, where half the hall is
        // off-camera and the player learns the tile one screen at a time.
        //
        // Everything the Wading Gallery and the Sounding Shaft charge the
        // player for is on this screen first, for free.
        //
        // The floor variant `,` is safe in Coral — it is `dFloorCoralAlt` in
        // the `coral` palette, not the `stonef` recolour that reads as standing
        // water in Grotto, Cistern and Salt. It is used on the island only, so
        // the one dry thing in the hall is also the one thing with a texture.
        size: [2, 1],
        map: [
          '####..##############',
          '#00000000000000000.#',
          '#0000##00,,00##000.#',
          '.00000#0,,,,0#0000.#',
          '.00000#0,,,,0#0000.#',
          '#0000##00,,00##000.#',
          '#00000000000000000.#',
          '####################',
        ],
        entities: [
          ['jellyfish', 3, 3],
          ['jellyfish', 15, 4],
          ['pickup', 10, 3, { kind: 'rupee20' }],
        ],
        readable: [
          [18, 4, 'A tide-mark cut high on the wall, and under it:\n"What holds you up is the sea, not the floor."'],
        ],
      },
      '0,4,4': {
        name: 'Sealed Cell',
        // The locked door is a full wall row, so it separates the room on the
        // y axis at all three tide levels. A door you can step round along the
        // next row is a key that bought nothing, and walk-dungeons.mjs cannot
        // tell one from the other on its own — it spends a key on any lock it
        // can reach and then only asks whether every room came out reachable.
        map: [
          '####..####',
          '#........#',
          '####L#####',
          '#........#',
          '#.3....3.#',
          '#.p....p.#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['chest', 4, 3, { big: true, item: 'lens', level: 1 }],
          ['crab', 2, 6],
        ],
      },
      '0,4,3': {
        name: 'Stair Coil',
        map: [
          '##########',
          '##########',
          '##......##',
          '##......##',
          '##...../##',
          '##......##',
          '####..####',
          '####..####',
        ],
        warps: [
          { x: 7, y: 4, to: { map: 'd2', floor: 1, rx: 4, ry: 2, px: 64, py: 64 } },
        ],
        entities: [
          ['crab', 3, 3],
        ],
      },

      // ---- floor 1: everything past the Lens -------------------------------
      '1,4,2': {
        name: 'Upper Landing',
        map: [
          '##########',
          '##......##',
          '##....../#',
          '.........#',
          '.........#',
          '##......##',
          '##########',
          '##########',
        ],
        warps: [
          { x: 8, y: 2, to: { map: 'd2', floor: 0, rx: 4, ry: 3, px: 64, py: 80, dir: 'down' } },
        ],
        entities: [
          ['keese', 4, 4],
        ],
      },
      '1,3,2': {
        name: 'The Wading Gallery',
        // `9` here is dSillCoral, not drownWall — this dungeon's own wall at
        // LOW and MID, deep water at HIGH. See legends.js for why it is scoped
        // to a legend rather than repointed for the whole game.
        legend: 'dungeonCoralSill',
        // LENS ROOM. Read the primitive in this dungeon's header; this is the
        // worked example of it.
        //
        // The wading floor is `0` end to end, including the doorway, so the
        // player can only be in this room at HIGH and there is nowhere in it to
        // stand and sound the conch. Two one-way ledges, two mirrored cells,
        // each with a drain in its outer corner. Under the west cell `1`
        // dSluice; under the east cell `9` drownWall. At HIGH both are the same
        // sheet of deep water. At LOW one is a wet floor out of the room and
        // the other is rock, and it is rock at MID as well, so guessing wrong
        // is not a conch press away from being right.
        //
        // What it costs to guess wrong: the drain in the back of the cell puts
        // you in the Spire Well on floor 0, and the walk back is the Concourse,
        // the Sealed Cell, the stair and the Upper Landing.
        map: [
          '##########',
          '#00000000#',
          '#00000000#',
          '#000000000',
          '#___##___#',
          '#/22##22/#',
          '##11##99##',
          '##11##99##',
        ],
        warps: [
          { x: 1, y: 5, to: { map: 'd2', floor: 0, rx: 3, ry: 5, px: 64, py: 16, dir: 'down' } },
          { x: 8, y: 5, to: { map: 'd2', floor: 0, rx: 3, ry: 5, px: 64, py: 16, dir: 'down' } },
        ],
        readable: [
          [6, 1, 'Cut into the lip: "Two cells, one road.\nThe water is the only thing telling you which."'],
        ],
        lensRoom: {
          at: 2,
          decide: [2, 3],
          onward: [2, 7],
          branches: [
            { name: 'west cell', enter: [2, 5], run: [[2, 6], [3, 7]] },
            { name: 'east cell', enter: [7, 5], run: [[6, 6], [7, 7]] },
          ],
        },
      },
      '1,3,3': {
        name: 'The Sump',
        // The `3` run in front of the south doorway is deliberate: the Sounding
        // Shaft below is a LOW room and this is where the player is made to
        // take the sea down before he can step into it.
        map: [
          '##..######',
          '#........#',
          '#.2222...#',
          '#.2222....',
          '#.2222....',
          '#........#',
          '#...33...#',
          '####33####',
        ],
        entities: [
          ['crab', 6, 5],
          ['urchin', 2, 1],
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
          '##......##',
          '##......##',
          '####..####',
        ],
        entities: [
          ['reefguard', 6, 3],
        ],
        puzzle: {
          enemies: true,
          flag: 'd2_reefguard',
          reward: { say: 'The guard sinks back into the coral.' },
        },
      },
      '1,5,3': {
        name: 'Bomb Vault',
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
          ['chest', 4, 3, { big: true, item: 'bombs', level: 1 }],
        ],
      },
      '1,4,4': {
        name: 'Cell of Blanks',
        map: [
          '####..####',
          '##......##',
          '##......##',
          '##......##',
          '##......##',
          '##......##',
          '##########',
          '##########',
        ],
        entities: [
          ['switch', 3, 3],
          ['block', 4, 3],
          ['pickup', 7, 1, { kind: 'blank' }],
          ['keese', 6, 4],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd2_144_puzzle',
          reward: {
            spawn: [['pickup', 4, 1, { kind: 'key' }]],
            say: 'Stone settles into stone.',
          },
        },
      },
      '1,3,4': {
        name: 'The Sounding Shaft',
        // LENS ROOM, and the primitive turned over. The choice is made at LOW,
        // off a `3` dWell shelf that drowns at every level above it, so again
        // there is nowhere to stand and sound the conch first.
        //
        // The two channels are `4` dDrain and `O` dPit. AT LOW THEY ARE THE
        // SAME TILE — both resolve to `dPit`, not merely to something similar —
        // so the screen genuinely does not carry the answer. At MID the drain
        // has filled to a ford and the pit is still a pit. The Lens held on the
        // shelf is the only thing in the game that draws that difference.
        map: [
          '####33####',
          '#33333333#',
          '#33333333#',
          '#33333333#',
          '#___##___#',
          '#/22##22/#',
          '##44##OO##',
          '##44##OO##',
        ],
        warps: [
          { x: 1, y: 5, to: { map: 'd2', floor: 0, rx: 3, ry: 5, px: 64, py: 16, dir: 'down' } },
          { x: 8, y: 5, to: { map: 'd2', floor: 0, rx: 3, ry: 5, px: 64, py: 16, dir: 'down' } },
        ],
        lensRoom: {
          at: 0,
          decide: [2, 3],
          onward: [2, 7],
          branches: [
            { name: 'west shaft', enter: [2, 5], run: [[2, 6], [3, 7]] },
            { name: 'east shaft', enter: [7, 5], run: [[6, 6], [7, 7]] },
          ],
        },
      },
      '1,3,5': {
        name: 'Coral Balcony',
        // The Lens's combat verb, and the only room in the dungeon that uses
        // it. Both urchins here belong to HIGH: below it they are not drawn,
        // not dangerous and not hittable, and the Lens is what makes them
        // targets. The locked door is a full column, so it separates the room
        // on the x axis at all three levels.
        map: [
          '##..######',
          '##.......#',
          '##.......#',
          '.L.......#',
          '##.......#',
          '##.......#',
          '##.......#',
          '##########',
        ],
        entities: [
          ['urchin', 6, 2, { phase: 2 }],
          ['urchin', 4, 5, { phase: 2 }],
          ['crab', 7, 4],
        ],
      },
      '1,2,5': {
        name: 'The Reliquary',
        map: [
          '####..####',
          '#........#',
          '#.p....p.#',
          '#.........',
          '#........#',
          '#.2222...#',
          '#........#',
          '##########',
        ],
        entities: [
          ['chest', 4, 4, { pickup: 'key' }],
          ['barnacle', 7, 5],
        ],
      },
      '1,2,4': {
        name: 'Coral Stair',
        map: [
          '####..####',
          '#........#',
          '####L#####',
          '#........#',
          '#.3....3.#',
          '#........#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['jellyfish', 2, 4],
        ],
      },
      '1,2,3': {
        name: 'Bosskey Well',
        map: [
          '####..####',
          '#........#',
          '#.3....3.#',
          '#........#',
          '#........#',
          '#.3....3.#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['chest', 4, 3, { pickup: 'bossKey' }],
          ['keese', 7, 4],
        ],
      },
      '1,2,2': {
        name: 'Crown Approach',
        map: [
          '####..####',
          '#........#',
          '####B#####',
          '#........#',
          '#..UMMU..#',
          '#........#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['urchin', 2, 5],
        ],
      },
      '1,2,1': {
        name: 'Anemos, the Crowned Column',
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
          ['anemos', 4, 2],
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
