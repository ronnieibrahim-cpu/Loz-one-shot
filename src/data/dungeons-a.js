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
          '####CC####',
        ],
        warps: [
          // BOTH HALVES WARP. A two-tile arch whose right half is
          // scenery is a door the player bumps into — the same rule
          // the dungeon portals outside have carried since they landed.
          { x: 4, y: 7, to: { map: 'overworld', floor: 0, rx: 8, ry: 8, px: 64, py: 32, dir: 'down' } },
          { x: 5, y: 7, to: { map: 'overworld', floor: 0, rx: 8, ry: 8, px: 64, py: 32, dir: 'down' } },
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
        // Drop odds bumped from the roster's default `common` to `good` on all
        // three — see FEEL-SPEC.md's health-economy instrumentation entry. This
        // is the first fight in the game, and the playthrough harness measured
        // it costing 6 quarter-hearts (1.5 of the 3 hearts a new game starts
        // with) with only `common`'s 16% heart chance to answer it — the
        // single worst spike the instrumented run found. The room itself is
        // unchanged; only what these three specific enemies drop.
        entities: [
          ['crab', 2, 1, { drops: 'good' }],
          ['crab', 6, 6, { drops: 'good' }],
          ['keese', 4, 1, { drops: 'good' }],
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
        // This is the dungeon's crossroads — every route in and out of the
        // Crab Pit, the Switch Room and the Locked Stair passes through it, so
        // a real run (and the instrumented playthrough) meets these two
        // several times over. The instrumented run took contact damage here
        // on every pass and never once found a heal in it, six quarter-hearts
        // total across the run with nothing to answer it — see FEEL-SPEC.md.
        // Bumped from `common` to `good`, same reasoning as the Drinking
        // Floor's.
        entities: [
          ['tektite', 4, 3, { drops: 'good' }],
          ['crab', 2, 4, { drops: 'good' }],
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
          // The heart alongside the key is a deliberate, GUARANTEED heal, not
          // a drop-table roll — see FEEL-SPEC.md's health-economy entry. The
          // instrumented playthrough found this is the last room before a
          // long stretch with no heal source of any kind (the Tide Gallery's
          // third pass, the Locked Stair's fight, and the walk to the
          // Sluicegate), and a probabilistic drop is not provable against a
          // single deterministic seed the way a fixed placement is: raising
          // `common` to `good` on the rooms upstream of here still depends on
          // the room's own RNG stream actually rolling a heart, and on this
          // seed the pass that mattered most did not. This is the one heal in
          // the whole dungeon that a run can rely on rather than hope for.
          reward: {
            spawn: [
              ['pickup', 4, 4, { kind: 'key' }],
              ['pickup', 5, 4, { kind: 'heart' }],
            ],
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
        // The last fight before the Anchor, and the instrumented run reached
        // it on a single heart with nothing behind it: past here there is no
        // combat and no heal until the Anchor's own gates, which need a
        // placement verb this project's playthrough actor does not have yet
        // (see playthrough-route.mjs's GOAL). Bumped from `common` to `good`
        // as the last chance the dungeon gets to hand back some margin before
        // that stretch — see FEEL-SPEC.md.
        entities: [
          ['zol', 2, 4, { drops: 'good' }],
          // 6,4 rather than the 6,6 check-placement.mjs offered. Both are legal floor;
          // 6,6 is behind the post row, and this room's encounter is TWO ZOLS IN THE
          // OPEN — put one behind the posts and the fight becomes a chase around
          // furniture. The checker's suggestion is a starting point and says so.
          ['zol', 6, 4, { drops: 'good' }],
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
          // The Clawcrab is D1's miniboss and until P9 it paid out a sentence
          // and nothing else — the only fight in the dungeon that cost health
          // and returned none of it. The Piece of Heart is what it owes.
          //
          // (14, 4) and not (14, 3): a dropped pickup pops about five pixels
          // up and settles straddling the tile ABOVE the one it spawned on, so
          // this comes to rest mid-arena where the claw died. Same lesson as
          // the Crab Pit's key — see docs/HANDOFF.md.
          reward: {
            spawn: [['pickup', 14, 4, { kind: 'heartPiece' }]],
            say: 'The claw stops moving. The way west is quiet.',
          },
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
  // TIDE THEME: COMMIT-BLIND BECOMES PLAN-FIRST. The spire is a tower of dry
  // shafts, and a dry shaft tells you nothing. When the sea comes in, one of
  // them is water you can wade, one is water over your head, and one is still
  // a hole. You cannot tell them apart by looking down them, and by the time
  // the water arrives you have already chosen which one you are standing over.
  // The Brineglass Lens is the only thing in the game that draws the room as
  // it WILL be, and this dungeon is where you are taught to look before you
  // commit rather than after.
  //
  // THE FORK PRIMITIVE, stated once because two rooms are built out of it.
  // Written up a column, from the shelf the player decides on:
  //
  //     .          the way on          <- reachable only after the water moves
  //     4          the shaft, 2 tiles
  //     4
  //     .          the alcove floor    <- where the ledge drops you
  //     /          a stair back out    <- the cost of being wrong
  //     "          the ledge           <- ONE WAY. There is no climbing back.
  //     .          the shelf           <- the decision, and the Lens is read here
  //
  //   `4` dDrain   an open shaft at LOW, wading depth at MID
  //   `0` dSump    an open shaft at LOW, over your head at MID
  //   `O` dPit     an open shaft at every level, for ever
  //
  // AT LOW ALL THREE ARE THE SAME TILE. Not three tiles that resemble each
  // other — dDrain's LOW form and dSump's LOW form ARE `dPit`, the same art in
  // the same palette, which is why tools/check-lens.mjs can prove the room
  // instead of asserting it. One level up they are three different answers.
  //
  // THE ROOM PINS THE TIDE, and that is the load-bearing half of the design.
  // `tideForce: 0` sets the room to LOW on entry and REFUSES the conch, so the
  // player cannot sound their way to MID, look, and sound their way back. The
  // only thing that moves the water in here is the coral sluice at the bottom
  // of each alcove — and by the time you can put a hand on one, you have
  // already taken a ledge you cannot climb back up. Take the wrong shaft and
  // the stair beside you puts you back down the spire with the walk to do
  // again. check-lens.mjs asserts the pin, both the one-way-ness and the
  // no-way-across, that the room answers nothing at the level it is pinned to,
  // that exactly the right branches pay off one level up, and that every
  // branch draws THE SAME TILE where the player is standing when they choose.
  //
  // Neither shaft is one tile deep, and that is not decoration: a gap hop
  // clears exactly one JUMPABLE tile (GAP_HOP_MAX_SPAN), and while a dungeon
  // pit is not JUMPABLE at all, deep water is not either — two tiles is the
  // width at which no future retuning of the hop can open a fork by accident.
  //
  // WHY EVERY FORK IS ONE SCREEN. A large room was considered for these and
  // rejected on purpose. The whole of the choice is that all of the branches
  // are in front of you and none of them can be told apart; a fork spread
  // across two screens would need the Lens because half of it was off camera,
  // which is the right requirement for the wrong reason. The two large rooms
  // in this dungeon are the miniboss arena and the spire's inner stair, where
  // size is the point and nothing is being hidden.
  //
  // Intended route (24 rooms; the Lens is room 14 of 24):
  //   3,7 mouth -> 3,6 landing -> 2,6 bone cell (a blank) -> 3,5 gallery
  //   -> 2,5 Dungeon Map -> 4,5 torches (Small Key 1) -> 3,4 rising chamber
  //   -> 3,3 Barnacle Skin (the charm) -> 2,4 stair coil [locked, key 1]
  //   -> 1F: 2,4 landing -> 2,5 anemone cell -> 3,4 concourse
  //   -> 4,4 THE BRINEGLASS LENS -> 4,5 glass cell (phased, learn to look)
  //   -> 4,3 [FORK 1] -> 4,2 Reefguard (miniboss, Small Key 2)
  //   -> 5,3 Bombs -> 5,4 whelk cell -> 3,2 spire ascent (boss door)
  //   -> [locked, key 2] 2,3 drowned cell -> 2,2 [FORK 2] -> 2,1 Boss Key
  //   -> boss door -> 3,1 Anemos
  //
  // Every room after the Lens is behind a fork or needs the Lens in its own
  // right, with one stated exception: 3,1 is the boss room.
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
      // ---- floor 0: the flooded base. The conch is the only tool. ---------
      '0,3,7': {
        name: 'Spire Mouth',
        map: [
          '####..####',
          '#........#',
          '#.p....p.#',
          '#........#',
          '#.33..33.#',
          '#........#',
          '#U......U#',
          '####CC####',
        ],
        warps: [
          // BOTH HALVES WARP. A two-tile arch whose right half is
          // scenery is a door the player bumps into — the same rule
          // the dungeon portals outside have carried since they landed.
          { x: 4, y: 7, to: { map: 'overworld', floor: 0, rx: 10, ry: 5, px: 64, py: 32, dir: 'down' } },
          { x: 5, y: 7, to: { map: 'overworld', floor: 0, rx: 10, ry: 5, px: 64, py: 32, dir: 'down' } },
        ],
        readable: [
          [2, 3, 'Coral script over the door: "What rises, carries.\nWhat falls, reveals. Look before you fall."'],
        ],
      },
      '0,3,6': {
        name: 'Coral Landing',
        map: [
          '####..####',
          '#..q..q..#',
          '#.3....3.#',
          '..3....3.#',
          '..3....3.#',
          '#.3....3.#',
          '#..q..q..#',
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
          '#........#',
          '#..2222..#',
          '#..2222...',
          '#..2222...',
          '#..2222..#',
          '#........#',
          '##########',
        ],
        entities: [
          ['pickup', 2, 1, { kind: 'blank' }],
          ['keese', 7, 6],
        ],
        readable: [
          [7, 1, 'Scratched into the shell: "The carver in Tidewatch\nwants bone, not gold."'],
        ],
      },
      '0,3,5': {
        name: 'Tide Gallery',
        // The sluice floor is dry at LOW, ankle deep at MID and OVER YOUR HEAD
        // at HIGH — so the hub itself teaches that the tide takes things away
        // as well as giving them, and it does it in a room with a dry ring
        // round the outside where nobody can be stranded.
        map: [
          '####..####',
          '#..q..q..#',
          '#.111111.#',
          '..111111..',
          '..111111..',
          '#.111111.#',
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
          ['urchin', 6, 2],
        ],
      },
      '0,4,5': {
        name: 'Torch Cell',
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
          ['torch', 1, 1],
          ['torch', 8, 1],
          ['torch', 4, 6],
          ['keese', 5, 2],
        ],
        puzzle: {
          torches: 'all',
          flag: 'd2_torches',
          reward: {
            spawn: [['pickup', 4, 3, { kind: 'key' }]],
            say: 'The three flames answer each other.',
          },
        },
      },
      '0,3,4': {
        name: 'Rising Chamber',
        // The drain band splits the room east to west at LOW, so the Chartstone
        // and the stair coil are both behind a tide change rather than behind a
        // key. The switch pair opens the door north; both blocks are seated
        // orthogonally adjacent to their switch with floor behind to push from.
        map: [
          '####.#####',
          '####D#####',
          '#........#',
          '..444444..',
          '..444444..',
          '#........#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['switch', 1, 5],
          ['block', 2, 5],
          ['switch', 8, 6],
          ['block', 7, 6],
          ['barnacle', 4, 6],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd2_034_puzzle',
          reward: {
            openDoors: [[4, 1]],
            // THE FLOOR-0 SMALL KEY LIVES HERE NOW, and this is a completability
            // fix rather than a design preference. It used to be the only floor-0
            // key and it sat behind the Torch Cell's flames — but nothing lights a
            // torch before the Coral Spire's own Bombs, and the Bombs are on floor
            // 1, behind the Stair Coil's locked door, which is the door this key
            // opens. Two keys, two doors, and the first one locked behind an item
            // sealed inside it: the dungeon deadlocked at its own entrance and
            // took D3, D4 and the road to the Keep down with it, because the
            // Bombs gate the Marsh and the Cliffs.
            //
            // The Torch Cell KEEPS its key. It is simply no longer the only one:
            // it becomes a room you find early, cannot answer yet, and come back
            // to with bombs — which is what that room was always shaped like.
            spawn: [['pickup', 4, 2, { kind: 'key' }]],
            say: 'Water drains out of a niche, and the door lifts.\nSomething small rattles loose with it.',
          },
        },
        readable: [
          [8, 2, 'A rusted plate: "The floor of this room is a door.\nShut the sea out and it is only a hole."'],
        ],
      },
      '0,4,4': {
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
      '0,3,3': {
        name: 'Cistern Cell',
        // The hand-placed charm for this dungeon, and it is a MID charm on
        // purpose: the player walks into the Coral Spire holding one essence,
        // so the MID case is the only case they own, and a LOW or HIGH charm
        // here would be a reward nobody could switch on. See docs/ITEMS.md and
        // tools/check-charms.mjs, which prints every hand-placed charm.
        map: [
          '##########',
          '#........#',
          '#..2222..#',
          '#..2222..#',
          '#..2222..#',
          '#..2222..#',
          '#........#',
          '####.#####',
        ],
        entities: [
          ['chest', 2, 1, { charm: 'barnacleSkin' }],
          ['jellyfish', 6, 3],
        ],
      },
      '0,2,4': {
        name: 'Stair Coil',
        map: [
          '##########',
          '##########',
          '#./..#####',
          '#....L....',
          '#....#....',
          '#....#####',
          '##########',
          '##########',
        ],
        warps: [
          { x: 2, y: 2, to: { map: 'd2', floor: 1, rx: 2, ry: 4, px: 64, py: 48 } },
        ],
        entities: [
          ['crab', 7, 4],
        ],
      },

      // ---- floor 1: the spire, and the Lens ------------------------------
      '1,2,4': {
        name: 'Upper Landing',
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
          { x: 8, y: 2, to: { map: 'd2', floor: 0, rx: 2, ry: 4, px: 48, py: 48 } },
        ],
        entities: [
          ['keese', 3, 4],
        ],
      },
      '1,2,5': {
        name: 'Anemone Cell',
        map: [
          '####..####',
          '####..####',
          '##......##',
          '#..3333..#',
          '#..3333..#',
          '##......##',
          '##########',
          '##########',
        ],
        entities: [
          ['urchin', 2, 2],
          ['pickup', 7, 4, { kind: 'fairy' }],
        ],
      },
      '1,3,4': {
        name: 'Spire Concourse',
        map: [
          '##########',
          '#..q..q..#',
          '#........#',
          '..........',
          '..........',
          '#........#',
          '#..q..q..#',
          '##########',
        ],
        entities: [
          ['crab', 2, 2],
          ['keese', 7, 5],
        ],
      },
      '1,4,4': {
        name: 'Sealed Cell',
        map: [
          '####..####',
          '#........#',
          '#..3333..#',
          '...3333..#',
          '...3333..#',
          '#..3333..#',
          '#U......U#',
          '####..####',
        ],
        entities: [
          ['chest', 2, 1, { big: true, item: 'lens', level: 1 }],
          ['urchin', 7, 1],
        ],
        readable: [
          [7, 5, 'A pane of green glass set in the wall, and behind it\nthe room stands a hand deeper in water than it is.'],
        ],
      },
      '1,4,5': {
        name: 'Glass Cell',
        // The Lens's COMBAT verb, taught in the first room past the chest.
        // These two belong to the high water and are neither drawn nor
        // hittable without the Lens up — see updatePhaseShift in game.js.
        map: [
          '####..####',
          '####..####',
          '##......##',
          '#.......##',
          '#.......##',
          '##......##',
          '##########',
          '##########',
        ],
        entities: [
          ['keese', 3, 3, { phase: 2 }],
          ['keese', 6, 4, { phase: 2 }],
          ['pickup', 4, 2, { kind: 'heartPiece' }],
        ],
        readable: [
          [1, 4, 'Nothing here. The salt on the floor says otherwise.'],
        ],
      },
      '1,4,3': {
        name: 'The First Fork',
        // FORK 1 — the teaching one. Two shafts, and the west one fills.
        // See the primitive at the top of this dungeon; tools/check-lens.mjs
        // proves this room in both directions.
        map: [
          '#.######.#',
          '#4######O#',
          '#4######O#',
          '#.######.#',
          '#./####/.#',
          '#.<....>.#',
          '#..#..#..#',
          '####..####',
        ],
        tideForce: 0,
        entities: [
          ['valve', 2, 6],
          ['valve', 7, 6],
        ],
        warps: [
          { x: 2, y: 4, to: { map: 'd2', floor: 1, rx: 2, ry: 4, px: 64, py: 64, dir: 'down' } },
          { x: 7, y: 4, to: { map: 'd2', floor: 1, rx: 2, ry: 4, px: 64, py: 64, dir: 'down' } },
        ],
        script: {
          onEvent(game, name) {
            // The sluice is the ONLY thing that moves the water in here: the
            // room pins the tide and refuses the conch, and this is what makes
            // the fork a commitment rather than a thing to sound at twice.
            if (name === 'valve') game.forceTideStep();
          },
        },
        readable: [
          [4, 6, 'Cut into the shelf: "Two throats, one drinks.\nThe dry one keeps its own counsel."'],
        ],
        lensRoom: {
          pin: 0, reveals: 1, decide: [4, 5],
          branches: [
            { name: 'the west shaft', land: [1, 5], probe: [1, 2], onward: [1, 0], escape: [2, 4] },
            { name: 'the east shaft', land: [8, 5], probe: [8, 2], onward: [8, 0], escape: [7, 4] },
          ],
        },
      },
      '1,4,2': {
        name: 'Reefguard Hall',
        // 2x1 — TWENTY characters a row, one grid, and it owns map cell 5,2 as
        // well as its own, so nothing else may be keyed there. Size is the
        // point here rather than concealment: the Reefguard is the dungeon's
        // set piece and it wants room to circle in, which a 10x8 screen does
        // not give. Both of the First Fork's throats come up into this room's
        // south wall — one of them is walkable and one of them never is, and
        // they are the same tile from the shelf below.
        size: [2, 1],
        map: [
          '####################',
          '#........##........#',
          '#........##..3333..#',
          '.............3333..#',
          '.............3333..#',
          '#........##..3333..#',
          '#.U....U.##.U....U.#',
          '#.######.#####..####',
        ],
        entities: [
          ['reefguard', 4, 3],
          ['urchin', 15, 4],
        ],
        puzzle: {
          enemies: true,
          flag: 'd2_reefguard',
          reward: {
            spawn: [['pickup', 4, 1, { kind: 'key' }]],
            say: 'The guard sinks back into the coral, and something\nfalls out of it.',
          },
        },
      },
      '1,5,3': {
        name: 'Bomb Vault',
        map: [
          '####..####',
          '####..####',
          '##......##',
          '##......##',
          '##......##',
          '##......##',
          '####..####',
          '####..####',
        ],
        entities: [
          ['chest', 2, 4, { big: true, item: 'bombs', level: 1 }],
        ],
      },
      '1,5,4': {
        name: 'Whelk Cell',
        map: [
          '####..####',
          '####..####',
          '##......##',
          '##......##',
          '##......##',
          '##..pp..##',
          '##########',
          '##########',
        ],
        entities: [
          ['keese', 6, 3, { phase: 2 }],
          ['pickup', 3, 3, { kind: 'rupee20' }],
          // D2's second Piece of Heart. The Whelk Cell is the Spire's far-east
          // cul-de-sac — nothing routes through it and nothing else in the
          // dungeon needs it, which is exactly what a piece should cost:
          // a detour, not a key.
          ['pickup', 4, 4, { kind: 'heartPiece' }],
        ],
      },
      '1,3,2': {
        name: 'Spire Ascent',
        // 1x2 — SIXTEEN rows of ten, one grid, owning map cells 3,2 and 3,3.
        // The spire's inner stair, and the one room in the dungeon where the
        // camera moves on the vertical axis. Nothing is hidden by the size:
        // the boss door is at the top and the locked door is at the bottom and
        // neither is a choice, they are both just a long way apart.
        size: [1, 2],
        map: [
          '####..####',
          '#........#',
          '####B#####',
          '#.3....3..',
          '#.3....3..',
          '#........#',
          '#..q..q..#',
          '#........#',
          '#........#',
          '#..2222..#',
          '#..2222..#',
          '.L.2222..#',
          '#..2222..#',
          '#..2222..#',
          '#........#',
          '##########',
        ],
        entities: [
          ['jellyfish', 4, 10],
          ['crab', 6, 13],
          ['keese', 3, 5],
        ],
      },
      '1,2,3': {
        name: 'Drowned Cell',
        map: [
          '####..####',
          '#........#',
          '#..1111..#',
          '#..1111...',
          '#..1111..#',
          '#..1111..#',
          '#........#',
          '##########',
        ],
        entities: [
          ['urchin', 2, 6],
          ['pickup', 7, 1, { kind: 'rupee20' }],
        ],
      },
      '1,2,2': {
        name: 'The Sounding Fork',
        // FORK 2 — the same primitive with a third answer in it, and the third
        // answer is the one the first fork could not teach: a shaft that fills
        // OVER YOUR HEAD. At LOW all three throats are the same `dPit`. One
        // level up they are wading depth, a hole, and a drowning.
        map: [
          '#..#..#..#',
          '#44#OO#00#',
          '#44#OO#00#',
          '#..#..#..#',
          '#./#./#./#',
          '#"##"##"##',
          '#........#',
          '####..####',
        ],
        tideForce: 0,
        entities: [
          ['valve', 2, 3],
          ['valve', 5, 3],
          ['valve', 8, 3],
        ],
        warps: [
          { x: 2, y: 4, to: { map: 'd2', floor: 1, rx: 3, ry: 3, px: 64, py: 208, dir: 'down' } },
          { x: 5, y: 4, to: { map: 'd2', floor: 1, rx: 3, ry: 3, px: 64, py: 208, dir: 'down' } },
          { x: 8, y: 4, to: { map: 'd2', floor: 1, rx: 3, ry: 3, px: 64, py: 208, dir: 'down' } },
        ],
        script: {
          onEvent(game, name) {
            if (name === 'valve') game.forceTideStep();
          },
        },
        readable: [
          [4, 6, 'Three marks on the shelf, and beneath them:\n"One wades. One waits. One keeps you."'],
        ],
        lensRoom: {
          pin: 0, reveals: 1, decide: [4, 6],
          branches: [
            { name: 'the west throat', land: [1, 4], probe: [1, 1], onward: [1, 0], escape: [2, 4] },
            { name: 'the middle throat', land: [4, 4], probe: [4, 1], onward: [4, 0], escape: [5, 4] },
            { name: 'the east throat', land: [7, 4], probe: [7, 1], onward: [7, 0], escape: [8, 4] },
          ],
        },
      },
      '1,2,1': {
        name: 'Bosskey Cell',
        map: [
          '##########',
          '#........#',
          '#........#',
          '#..2222..#',
          '#..2222..#',
          '#........#',
          '#........#',
          '#..#..#..#',
        ],
        entities: [
          ['chest', 4, 2, { pickup: 'bossKey' }],
          ['jellyfish', 3, 4],
        ],
      },
      '1,3,1': {
        name: 'Anemos, the Crowned Column',
        // The conch is suppressed, so the arena is whatever the player walked
        // in with — and the floor is basin, which is walkable at all three
        // levels, because a locked room has to work at whichever one that was.
        map: [
          '##########',
          '#........#',
          '#........#',
          '#..2222..#',
          '#..2222..#',
          '#..2222..#',
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
  //
  // TIDE THEME: SURFACE ROUTE VS SEAFLOOR ROUTE. The Grotto held the water
  // still and the Spire made you bet on it. The Sanctum floods and stays
  // flooded: it is the first dungeon whose rooms are not crossed by choosing a
  // tide level at all. What you choose here is which LAYER of the water you
  // travel in, and the Kelp-Soled Cleats are both halves of that choice on one
  // button.
  //
  // THE TORRENT, stated once because three rooms are built out of it. Written
  // along a row, from the shelf the player arrives on:
  //
  //     .  T T T T T T T T  .
  //     ^  the channel: dTorrentE, running back the way you came
  //   stand                                                    the way on
  //
  // `T` is deep at every tide level and it pushes at TORRENT_PUSH, which
  // feel.js derives to be STRICTLY GREATER than SWIM_SPEED. So:
  //
  //   on the surface  you cannot make headway against it. Not slowly, not with
  //                   patience — the arithmetic is the wrong side of zero, and
  //                   the current carries you back to the shelf you left.
  //   on the floor    nothing pushes you at all. `Player.updateTerrain` applies
  //                   a tile's push only while `inDeep && !underwater`, and
  //                   weighted soles are what the Cleats ARE.
  //
  // That is the whole dungeon. A channel whose far end is upstream is a wall to
  // a swimmer and a walk to a diver, and no setting of the conch changes it,
  // because a torrent is not a tide tile. `tools/check-cleats.mjs` proves each
  // declared room three ways — no route without the item, no route on the
  // surface, a route on the floor — and then proves the air lasts, reading the
  // swim speed, the sink speed and the breath out of feel.js rather than
  // writing them down.
  //
  // WHY A NEW CURRENT AND NOT THE RIPTIDES THAT ALREADY EXISTED. A riptide
  // pushes at 0.55 px/f and a swimmer moves at 0.75, so a riptide is a TAX on
  // the surface route — slow, annoying, crossable. Every room built on one
  // would have read as a Cleats room in the data and fallen to patience. The
  // torrent is the same water and the same art, running harder, and the
  // inequality between the two numbers is asserted globally by check-cleats
  // before any room is looked at.
  //
  // WHAT THE FLOOR COSTS, so the choice is a choice: sink mode is slower
  // (SINK_SPEED), draws no sword, hops nothing, and runs on CLEATS_BREATH_
  // FRAMES of air. The Kelp Locks is two screens wide precisely so that the
  // breath number stops being decorative — eighteen tiles of seafloor in one
  // dive, which check-cleats prints as a margin rather than a pass.
  //
  // AND WHAT THE SURFACE IS STILL FOR: the Bogwater Drain's current empties
  // into a pocket the floor route never sees. Taking the wrong layer there is
  // not punished, it is paid — the swimmer gets the fairy and comes back.
  //
  // Intended route (24 rooms; the Cleats are room 11 of 24):
  //   3,7 mouth -> 3,6 the drowned nave -> 4,6 bell cell (Wrecker's Eye, and
  //      the first charm the player can slot in the LOW case — it opened on the
  //      essence they carried out of the Spire)
  //   -> 3,5 hub -> 2,5 Dungeon Map -> 4,5 sluice (key 1)
  //   -> 3,4 the weir [locked, key 1] -> 2,4 Chartstone -> 4,4 reed cell
  //   -> 3,3 THE KELP-SOLED CLEATS
  //   west: 2,3 [torrent] -> 1,3 (key 2) -> 1,4 silt vault
  //         -> 2,2 Bogmaw [locked, key 2] -> 1,2 Boss Key
  //   east: 4,3 [torrent] -> 5,3 eel hall -> 5,4 (key 3)
  //         -> 4,2 the Kelp Locks [torrent, 2x1] -> 3,2 [locked, key 3]
  //         -> boss door -> 3,1 Gloomtide
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
      '0,3,7': {
        name: 'Sanctum Mouth',
        map: [
          '##M#..#M##',
          '#U......U#',
          '#........#',
          '#..2..2..#',
          '#..2..2..#',
          '#........#',
          '#........#',
          '####CC####',
        ],
        warps: [
          // BOTH HALVES WARP. A two-tile arch whose right half is
          // scenery is a door the player bumps into — the same rule
          // the dungeon portals outside have carried since they landed.
          { x: 4, y: 7, to: { map: 'overworld', floor: 0, rx: 1, ry: 8, px: 64, py: 32, dir: 'down' } },
          { x: 5, y: 7, to: { map: 'overworld', floor: 0, rx: 1, ry: 8, px: 64, py: 32, dir: 'down' } },
        ],
        readable: [
          [2, 2, 'Bog script: "The water has two floors. Only one of them drowns you."'],
        ],
      },
      '0,3,6': {
        name: 'Drowned Nave',
        map: [
          '####..####',
          '#........#',
          '#.111111.#',
          '#.111111..',
          '#.111111..',
          '#.111111.#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['jellyfish', 4, 3],
          ['crab', 2, 5],
        ],
        puzzle: {
          enemies: true,
          flag: 'd3_nave',
          reward: {
            spawn: [['pickup', 4, 1, { kind: 'fairy' }]],
            say: 'The bog lets something go.',
          },
        },
      },
      '0,4,6': {
        name: 'Bell Cell',
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
          // A LOW charm, and the first one in the game that could be placed.
          // The LOW case opens at two essences and the player walked out of the
          // Coral Spire with the second, so this dungeon is the first place a
          // LOW charm is a reward rather than a locked box. It is also the beat
          // that tells them the case exists.
          ['chest', 4, 2, { charm: 'wreckersEye' }],
          ['pickup', 6, 4, { kind: 'blank' }],
          ['keese', 6, 2],
        ],
      },
      '0,3,5': {
        name: 'Bog Hub',
        map: [
          '####..####',
          '#..q..q..#',
          '#.111111.#',
          '..111111..',
          '..111111..',
          '#.111111.#',
          '#..q..q..#',
          '####..####',
        ],
        entities: [
          ['jellyfish', 4, 4],
          ['urchin', 2, 2],
        ],
      },
      '0,2,5': {
        name: 'Map Cell',
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
        name: 'Sluice Cell',
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
          ['switch', 2, 2],
          ['switch', 7, 2],
          ['block', 2, 3],
          ['block', 7, 3],
          ['keese', 4, 4],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd3_sluice',
          reward: {
            spawn: [['pickup', 4, 1, { kind: 'key' }]],
            say: 'A grate lifts somewhere below the floor.',
          },
        },
      },
      '0,3,4': {
        name: 'The Weir',
        map: [
          '####..####',
          '#........#',
          '####L#####',
          '..........',
          '..........',
          '#.111111.#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['crab', 2, 4],
          ['urchin', 7, 3],
        ],
      },
      '0,2,4': {
        name: 'Silt Cell',
        map: [
          '##########',
          '#U......U#',
          '#........#',
          '#.........',
          '#.........',
          '#..3333..#',
          '#........#',
          '##########',
        ],
        entities: [
          ['chest', 4, 2, { pickup: 'chartstone' }],
          ['urchin', 6, 4],
        ],
      },
      '0,4,4': {
        name: 'Reed Cell',
        map: [
          '##########',
          '#U......U#',
          '#..3333..#',
          '...3333...',
          '...3333...',
          '#..3333..#',
          '#........#',
          '##########',
        ],
        entities: [
          ['jellyfish', 3, 2],
          ['crab', 7, 6],
        ],
        puzzle: {
          enemies: true,
          flag: 'd3_reed',
          reward: {
            spawn: [['pickup', 4, 6, { kind: 'heartPiece' }]],
            say: 'The reeds part over something round and bright.',
          },
        },
      },
      '0,5,4': {
        name: 'Eel Vault',
        map: [
          '####..####',
          '#U......U#',
          '#........#',
          '#........#',
          '#........#',
          '#..,,,,..#',
          '#........#',
          '##########',
        ],
        entities: [
          ['barnacle', 4, 4],
          ['keese', 2, 2],
        ],
        puzzle: {
          enemies: true,
          flag: 'd3_eel',
          reward: {
            spawn: [['pickup', 4, 2, { kind: 'key' }]],
            say: 'Something drops out of the weed.',
          },
        },
      },
      '0,3,3': {
        name: 'The Cistern Floor',
        // The item room. The chest stands on the only dry island in it, so the
        // first thing the Cleats are used for is getting off the rock you
        // opened them on.
        map: [
          '##########',
          '#WWWWWWWW#',
          '#WW....WW#',
          '.WW....WW.',
          '.WW....WW.',
          '#WW....WW#',
          '#WWWWWWWW#',
          '####..####',
        ],
        entities: [
          ['chest', 4, 3, { big: true, item: 'cleats', level: 1 }],
        ],
      },
      '0,2,3': {
        name: 'The Undertow',
        // Torrent room 1. The channel runs east, back toward the shelf you
        // arrived on, and the way out is at its head. Bare on purpose: a niche
        // in the wall of a torrent room is somewhere to stand, and somewhere to
        // stand is somewhere the current is not.
        map: [
          '##########',
          '###M##M###',
          '##########',
          '.TTTTTTTT.',
          '.TTTTTTTT.',
          '##########',
          '###M##M###',
          '##########',
        ],
        cleatRoom: { from: [9, 3], to: [0, 3] },
        readable: [],
      },
      '0,1,3': {
        name: 'Sunken Vestry',
        map: [
          '###..#####',
          '#U......U#',
          '#........#',
          '#.........',
          '#.........',
          '#..1111..#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['switch', 2, 2],
          ['switch', 7, 2],
          ['block', 2, 3],
          ['block', 7, 3],
          ['urchin', 4, 4],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd3_vestry',
          reward: {
            spawn: [['pickup', 4, 1, { kind: 'key' }]],
            say: 'Stone settles into stone.',
          },
        },
      },
      '0,1,4': {
        name: 'Silt Vault',
        map: [
          '####..####',
          '#U......U#',
          '#........#',
          '#..3333..#',
          '#..3333..#',
          '#........#',
          '#........#',
          '##########',
        ],
        entities: [
          ['pickup', 4, 5, { kind: 'rupee20' }],
          ['keese', 6, 2],
        ],
      },
      '0,2,2': {
        name: 'Bogmaw Hall',
        map: [
          '####..####',
          '#........#',
          '#..,,,,..#',
          '..........',
          '..........',
          '#..,,,,..#',
          '#........#',
          '##########',
        ],
        entities: [
          ['bogmaw', 4, 3],
        ],
        puzzle: {
          enemies: true,
          flag: 'd3_bogmaw',
          reward: { say: 'The bogmaw sinks back into the silt.' },
        },
      },
      '0,1,2': {
        name: 'Drain Gallery',
        map: [
          '##########',
          '#U...#...#',
          '#....#...#',
          '#....#....',
          '#....L....',
          '#....#...#',
          '#....#..U#',
          '###..#####',
        ],
        entities: [
          ['chest', 7, 3, { pickup: 'bossKey' }],
          // A KEESE, NOT A JELLYFISH. There is no water in this room at any tide, so
          // the jellyfish that stood here could never move: `terrainOk` keeps an
          // aquatic enemy on wet tiles and there were none to be on. It was
          // scenery with a hitbox. d3 fields five keese already and a flier is
          // what a dry stone gallery wants. See tools/check-placement.mjs.
          ['keese', 2, 5],
        ],
      },
      '0,2,1': {
        name: 'Vestry Roof',
        map: [
          '##########',
          '#U......U#',
          '#........#',
          '#..,,,,..#',
          '#..,,,,..#',
          '#........#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['pickup', 4, 4, { kind: 'heartPiece' }],
          ['keese', 6, 2],
        ],
      },
      '0,4,3': {
        name: 'The Bogwater Drain',
        // Torrent room 2, and the current runs the other way — a player who
        // learned "swim east" in the Undertow learns nothing here. The alcove
        // under the channel is the other half of the trade: it opens off the
        // seafloor and the surface never sees it, so the slow layer is the one
        // that finds things. Nothing in it is required, which is the point of
        // putting it there.
        map: [
          '##########',
          '###M##M###',
          '##########',
          '.tttttttt.',
          '.tttttttt.',
          '####..####',
          '###....###',
          '##########',
        ],
        cleatRoom: { from: [0, 3], to: [9, 3] },
        entities: [
          ['pickup', 4, 6, { kind: 'fairy' }],
        ],
      },
      '0,5,3': {
        name: 'Eel Hall',
        map: [
          '####..####',
          '#U......U#',
          '####L#####',
          '.........#',
          '.........#',
          '#..1111..#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['urchin', 3, 3],
          ['crab', 6, 4],
        ],
      },
      '0,4,2': {
        name: 'The Kelp Locks',
        // 2x1 — TWENTY tiles of channel, and the only room in the dungeon where
        // the breath number is not decorative. One dive, eighteen tiles of
        // seafloor, no shelf in the middle to come up on. check-cleats.mjs
        // prints the margin every run.
        //
        // Picked for the same three reasons d1 0,5,3 and d2 1,3,2 were: the
        // cells it grows into have no other neighbours, its doorways are all in
        // its eastern screen, and widening it changed no facing wall anywhere.
        size: [2, 1],
        map: [
          '####################',
          '###M##M######M##M###',
          '####################',
          '.TTTTTTTTTTTTTTTTTT#',
          '.TTTTTTTTTTTTTTTTTT#',
          '##############..####',
          '###M##M#######..####',
          '##############..####',
        ],
        cleatRoom: { from: [14, 7], to: [0, 3] },
      },
      '0,3,2': {
        name: 'The Lock Gallery',
        map: [
          '####..####',
          '#........#',
          '####B#####',
          '..........',
          '..........',
          '#..,,,,..#',
          '#........#',
          '##########',
        ],
        entities: [
          ['crab', 2, 4],
          ['urchin', 7, 4],
        ],
      },
      '0,3,1': {
        name: 'Gloomtide, the Bogwater Maw',
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
  // Intended route (24 rooms, one floor, the Bellows at room 12):
  //   3,7 entrance -> 3,6 landing -> 2,6 Dungeon Map / 4,6 Small Key 1
  //   -> 3,5 the Weir (lock 1) -> 2,5 Chartstone / 4,5 rungs / 5,5 charm
  //   -> 4,4 the Cistern Floor (Small Key 2) -> 3,4 -> 2,4 winch (lock 2)
  //   -> 1,4 BELLOWS -> 1,3 Squall Loft (sill 1) -> 2,3 Drowned Sill (sill 2)
  //   -> 2,2 Cistern Gauge (sill 3, Small Key 3) -> back east:
  //      3,3 -> 4,3 the Long Race (sill 4) -> 5,3 Ironknight (miniboss)
  //   -> 5,2 Cliff Walk (lock 3) -> 4,2 the Crossed Sluices (sills 5 and 6,
  //      Boss Key) -> 2,2 -> 3,2 boss door -> 3,1 Wyverna
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
      // ---------------------------------------------------- the way in
      '0,3,7': {
        name: 'Cistern Head',
        map: [
          '####..####',
          '#U......U#',
          '#........#',
          '#..2222..#',
          '#..2222..#',
          '#........#',
          '#........#',
          '####CC####',
        ],
        warps: [
          // BOTH HALVES WARP. A two-tile arch whose right half is
          // scenery is a door the player bumps into — the same rule
          // the dungeon portals outside have carried since they landed.
          { x: 4, y: 7, to: { map: 'overworld', floor: 0, rx: 1, ry: 3, px: 64, py: 32, dir: 'down' } },
          { x: 5, y: 7, to: { map: 'overworld', floor: 0, rx: 1, ry: 3, px: 64, py: 32, dir: 'down' } },
        ],
        readable: [
          [2, 3, 'Chiselled deep: "This cistern is worked from the far bank. Nothing here is meant to be reached."'],
        ],
      },
      '0,3,6': {
        name: 'Rainwater Landing',
        map: [
          '####..####',
          '#........#',
          '#.9....9.#',
          '..........',
          '..........',
          '#.9....9.#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['keese', 6, 2],
          ['tektite', 3, 5],
        ],
      },
      '0,2,6': {
        name: 'Overflow Sluice',
        map: [
          '####..####',
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
        name: 'Cracked Basin',
        map: [
          '####..####',
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
          flag: 'd4_basin',
          reward: {
            spawn: [['pickup', 4, 6, { kind: 'key' }]],
            say: 'Something falls out of the cracked basin.',
          },
        },
      },
      '0,3,5': {
        name: 'The Weir',
        // The sump band, taught before it is ever load-bearing: at LOW these
        // four squares have no floor at all and at MID they are over your head.
        // The tiles above and below the lock are plain floor on purpose —
        // walk-dungeons asserts a locked door separates its room at all three
        // levels, and a door standing on a pit cannot be shown to separate
        // anything at LOW.
        map: [
          '####..####',
          '#........#',
          '####L#####',
          '..00..00..',
          '..00..00..',
          '#........#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['tektite', 4, 5],
          ['keese', 2, 1],
        ],
        readable: [
          [1, 6, 'Cut into the weir: "At low water the sluices have no floor. Mind your feet."'],
        ],
      },
      '0,2,5': {
        name: 'Drowned Stair',
        map: [
          '####..####',
          '#U......U#',
          '#........#',
          '#..3333...',
          '#..3333...',
          '#........#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['chest', 4, 2, { pickup: 'chartstone' }],
          ['urchin', 4, 4],
        ],
      },
      '0,4,5': {
        name: 'Rung Gallery',
        // A drown-wall box with one square of floor inside it. At LOW and MID
        // it is four walls; at HIGH it is four squares of deep water and the
        // Cleats swim you in over the top. The teaching room for every sill in
        // the second half, and it costs nothing to fail.
        map: [
          '####..####',
          '#........#',
          '#.999....#',
          '..9.9.....',
          '..999.....',
          '#........#',
          '#.11.....#',
          '####..####',
        ],
        entities: [
          ['pickup', 3, 3, { kind: 'heartPiece' }],
          ['tektite', 6, 2],
          ['keese', 7, 5],
        ],
      },
      '0,5,5': {
        name: 'Cliffside Cell',
        map: [
          '####..####',
          '#U......U#',
          '#........#',
          '.........#',
          '.........#',
          '#..,,,,..#',
          '#........#',
          '##########',
        ],
        entities: [
          ['chest', 4, 2, { charm: 'bosunsWhistle' }],
          ['stalfos', 7, 4],
        ],
      },
      '0,4,4': {
        name: 'The Cistern Floor',
        // Two screens wide, and the only room in the dungeon that is. It owns
        // the cell at 5,4 as well as its own, so nothing else may be keyed
        // there. The whole floor is `3` — wading at LOW, swimming above it —
        // so the room is a different shape depending on what the conch last
        // said, which is the argument for making it the big one.
        size: [2, 1],
        map: [
          '####################',
          '#..................#',
          '#..33333333333333..#',
          '...33333333333333..#',
          '...33333333333333..#',
          '#..33333333333333..#',
          '#..................#',
          '####..########..####',
        ],
        entities: [
          // Two plates and one block, at opposite ends of twenty tiles: the
          // block holds the west plate and you have to be standing on the east
          // one. The dungeon's own idea, rehearsed before the item that makes
          // it — you cannot be in two places, so something else has to hold.
          ['switch', 3, 1],
          ['switch', 16, 6],
          ['block', 4, 1],
          ['jellyfish', 8, 3],
          ['urchin', 12, 4],
          ['keese', 3, 6],
        ],
        puzzle: {
          switches: 'all',
          flag: 'd4_floor',
          reward: {
            spawn: [['pickup', 10, 6, { kind: 'key' }]],
            say: 'A grating opens under the far wall.',
          },
        },
      },
      '0,3,4': {
        name: 'Barnacle Cell',
        map: [
          '##########',
          '#U......U#',
          '#..1111..#',
          '..1111111.',
          '..1111111.',
          '#..1111..#',
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
        name: 'Winch Room',
        map: [
          // The lock sits in a one-tile corridor with its pocket sealed on both
          // sides. The first cut of this room left the column at x=1 running
          // from the pot shelf down to the floor, so the door had a way round
          // it and bought nothing — exactly D1's Clawcrab Den bug, caught here
          // by walk-dungeons' door check rather than by a person walking it.
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
          [5, 5, 'A winch plate, bolted shut: "The wheels are set where no hand goes. Bring wind."'],
        ],
      },
      '0,1,4': {
        name: 'Bellows Vault',
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
          ['chest', 4, 2, { big: true, item: 'bellows', level: 1 }],
        ],
      },

      // ---------------------------------------------------- the sills
      '0,1,3': {
        name: 'Squall Loft',
        // SILL 1, a sump shelf, worked at MID. The first one, and it is the
        // shape at its plainest: a shaft in the west wall with the wheel at the
        // top of it, a pit trench you cannot cross, and a two-square ledge on
        // the far side of a sump that is a hole at LOW.
        //
        // Stand on 4,1 — the landing at 4,2 has a wall between it and the wheel
        // and the cone does not blow through stone, so even the first sill asks
        // you to take one step before you pump.
        map: [
          '##########',
          '#3OO.#...#',
          '####.#...#',
          '####0#..D.',
          '#...0....#',
          '#........#',
          '#........#',
          '####..####',
        ],
        bellowsRoom: {
          wheel: [1, 1], stand: [4, 1], face: 'left', at: 1, opens: [[8, 3]],
        },
        entities: [
          ['wheel', 1, 1, { needTurns: 30 }],
          ['keese', 7, 5],
        ],
        script: {
          onEvent(game, name, data) {
            if (name === 'valve' && data && data.open) game.applyReward({ openDoors: [[8, 3]] });
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
          '####..####',
          '####D#####',
          '#........#',
          '..........',
          '#.......##',
          '#...#9####',
          '#...9.OO1#',
          '##########',
        ],
        bellowsRoom: {
          wheel: [8, 6], stand: [5, 6], face: 'right', at: 2, opens: [[4, 1]],
        },
        entities: [
          ['wheel', 8, 6, { needTurns: 40 }],
          ['tektite', 3, 3],
          ['keese', 7, 2],
        ],
        script: {
          onEvent(game, name, data) {
            if (name === 'valve' && data && data.open) game.applyReward({ openDoors: [[4, 1]] });
          },
        },
      },
      '0,2,2': {
        name: 'Cistern Gauge',
        // SILL 3, a sump shelf again, and the variation is the approach: the
        // shelf is at the end of a flooded gallery you swim DOWN rather than a
        // ledge you swim UP to, and what it pays out is a key rather than a
        // door. The two dry squares at 6,3 and beyond are close enough to see
        // the wheel from and too far to blow it — the reach is three.
        map: [
          '####..####',
          '#........#',
          '#####....#',
          '#3OO.0....',
          '#####0....',
          '#........#',
          '#........#',
          '####..####',
        ],
        bellowsRoom: {
          wheel: [1, 3], stand: [4, 3], face: 'left', at: 1, gives: 'key',
        },
        entities: [
          ['wheel', 1, 3, { needTurns: 40 }],
          ['jellyfish', 5, 4],
          ['keese', 6, 6],
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
              game.spawnPickup(64, 48, 'key', { grabDelay: 14, saveKey: 'd4GaugeKey' });
            }
          },
          onEvent(game, name, data) {
            if (name !== 'valve' || !data || !data.open) return;
            game.progress.flags.d4GaugeWheel = true;
            if (game.progress.secrets.d4GaugeKey) return;
            game.spawnPickup(64, 48, 'key', { grabDelay: 14, saveKey: 'd4GaugeKey' });
          },
        },
      },
      '0,2,1': {
        name: 'West Overlook',
        map: [
          '##########',
          '#U......U#',
          '#........#',
          '#..3333..#',
          '#..3333..#',
          '#........#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['pickup', 4, 2, { kind: 'fairy' }],
          ['keese', 7, 5],
        ],
      },
      '0,3,3': {
        name: 'Winding Stair',
        map: [
          '##########',
          '#........#',
          '#..2222..#',
          '..2....2.#',
          '#........#',
          '#..1111..#',
          '#.........',
          '##########',
        ],
        entities: [
          ['tektite', 3, 4],
          ['keese', 6, 1],
        ],
      },
      '0,4,3': {
        name: 'The Long Race',
        // SILL 4, a drown-wall shelf turned on its end: the wheel is at the top
        // of the shaft and the stand is under it, so the gust goes UP. The
        // shelf is a single square with drown-wall on three sides — at HIGH you
        // swim up into it from the corridor, at anything else it is a hole in
        // the masonry you can see and not enter.
        map: [
          '##########',
          '##1##....#',
          '##O##....#',
          '##O##....#',
          '#9.9#....#',
          '##9##....#',
          '........D.',
          '##########',
        ],
        bellowsRoom: {
          wheel: [2, 1], stand: [2, 4], face: 'up', at: 2, opens: [[8, 6]],
        },
        entities: [
          ['wheel', 2, 1, { needTurns: 50 }],
          ['darknut', 6, 3],
          ['keese', 7, 1],
        ],
        script: {
          onEvent(game, name, data) {
            if (name === 'valve' && data && data.open) game.applyReward({ openDoors: [[8, 6]] });
          },
        },
      },
      '0,5,3': {
        name: 'Ironknight Gallery',
        // The miniboss, at room 17 of 24. Two screens wide because the
        // Ironknight charges in straight lines and a 10-tile room gives it
        // nowhere to do that. The drown-wall pair in the middle is cover at LOW
        // and MID and simply gone at HIGH, which is the only decision the fight
        // offers and is worth having.
        size: [2, 1],
        map: [
          '####..##############',
          '####D###############',
          '#.U............U...#',
          '#..................#',
          '#........99........#',
          '#........99........#',
          '...................#',
          '####################',
        ],
        entities: [
          ['ironknight', 12, 3],
          ['keese', 4, 5],
        ],
        puzzle: {
          enemies: true,
          flag: 'd4_ironknight',
          reward: {
            openDoors: [[4, 1]],
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
          '##########',
          '#........#',
          '#.OO..OO.#',
          '#.OO..OO.#',
          '#........#',
          '#........#',
          '.L.......#',
          '####..####',
        ],
        entities: [
          ['keese', 3, 1],
          ['keese', 6, 1],
          ['keese', 4, 4],
        ],
      },
      '0,4,2': {
        name: 'The Crossed Sluices',
        // SILLS 5 AND 6, one of each shape, in one room, and the Boss Key is
        // behind both. The west wheel is a sump shelf and wants MID; the east
        // wheel is a drown-wall shelf and wants HIGH. You cannot hold two seas,
        // so you work one side, walk out, sound the conch, and work the other —
        // which is the dungeon's whole idea said out loud in one room.
        map: [
          '####..####',
          '#3#....#1#',
          '#O#....#O#',
          '#O#....#O#',
          '#.#....#.#',
          '#0#....#9#',
          '#.........',
          '##########',
        ],
        bellowsRoom: [
          { wheel: [1, 1], stand: [1, 4], face: 'up', at: 1 },
          { wheel: [8, 1], stand: [8, 4], face: 'up', at: 2, gives: 'bossKey' },
        ],
        entities: [
          ['wheel', 1, 1, { needTurns: 40 }],
          ['wheel', 8, 1, { needTurns: 40 }],
          ['stalfos', 5, 3],
        ],
        script: {
          // Put the Boss Key back if it was released and never collected — see
          // the Cistern Gauge for why. This is the room where getting that
          // wrong ends the dungeon.
          onEnter(game) {
            if (game.progress.flags.d4Sluices && !game.progress.secrets.d4BossKey) {
              game.spawnPickup(64, 64, 'bossKey', { grabDelay: 14, saveKey: 'd4BossKey' });
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
            game.spawnPickup(64, 64, 'bossKey', { grabDelay: 14, saveKey: 'd4BossKey' });
          },
        },
      },
      '0,4,1': {
        name: 'East Overlook',
        map: [
          '##########',
          '#U......U#',
          '#........#',
          '#..1111..#',
          '#..1111..#',
          '#........#',
          '#........#',
          '####..####',
        ],
        entities: [
          ['pickup', 4, 2, { kind: 'rupee20' }],
          ['stalfos', 6, 5],
          // D4's second Piece of Heart, in the corner of the overlook furthest
          // from the door — a room you climb to for the view and leave by the
          // way you came.
          ['pickup', 2, 6, { kind: 'heartPiece' }],
        ],
      },
      '0,3,2': {
        name: 'Cistern Gate',
        map: [
          '####..####',
          '#........#',
          '####B#####',
          '.........#',
          '.........#',
          '#........#',
          '#........#',
          '##########',
        ],
        entities: [
          ['tektite', 6, 4],
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
    },
  });
}
