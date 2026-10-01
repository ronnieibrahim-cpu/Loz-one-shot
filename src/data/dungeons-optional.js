// The three optional dungeons (S160). See docs/DUNGEON-STATUS.md, "The
// optional dungeons (S159 plan)": the human chose two small side dungeons and
// one big one, for the three bosses the six-dungeon fold left without a room.
//
// ALL THREE ARE SIDE CONTENT. Each declares `optional: true` and neither an
// Essence nor an item (src/world/maps.js), so `dungeons()` — the route — does
// not list them, and check-progression proves nothing in them can open
// anything the route needs. What they pay is Pieces of Heart (and the Sunken
// Palace a charm). Each leans on a tide consequence no main dungeon states,
// through a SIDE item the player already owns.
//
// Each is built at Oracle size, in the kit of a Seasons dungeon no main one
// had taken (`optionalKit` in tiles-core.js).

import { registerMap } from '../world/maps.js';

export function installOptionalDungeons() {

  // --- The Salt Pan's lower vault -----------------------------------------
  //
  // TIDE THEME: FIRE THE SEA PUTS OUT. The Kilnshell burns what it touches,
  // and deep water puts it out — on the ground, in your hands, or in the air.
  // Every room below the kiln is DAMP (`damp: true`): the brine in the air
  // will not let the shell strike, so the fire has to be struck in the one
  // dry room at the top of the stair and CARRIED down, lit, and thrown where
  // it is needed. A thrown shell flies Seasons' arc and lands still burning —
  // unless its line crossed deep water, and then it lands dark, and the only
  // way to get it back is to walk to the kiln and strike another.
  //
  // So the conch decides whether the fire survives the trip. A sump — an open
  // pit at LOW, over your head above it — is a gap no one can walk at any sea,
  // and a gap a flame can be thrown over only while the sea is out of it. And
  // the vault's kelp is drift-tangle stranded in the pan: dry and burnable at
  // LOW, too sodden to burn at all above it.
  //
  // `kilnRoom` states each room's claim and tools/check-kiln.mjs proves it in
  // the real engine: the room will not strike, the target cannot be walked
  // up to at any sea (unless `reach` says the claim is about the sea and not
  // the gap), and a lit shell thrown from `from` lights or burns it at exactly
  // `levels`.
  //
  // Intended route (6 rooms):
  //   1,2 the Kiln Stair: strike the shell, burn the tangle north
  //   -> 1,1 the Sump: carry it in lit; at LOW throw it to the brazier on
  //      the island; the east shutter opens
  //   -> 2,1 the Kelp Cell: at LOW wade the pool carrying it, throw it into
  //      the dry kelp; the Small Key is behind it
  //   -> 1,1 west [locked] -> 0,1 the Brine Gallery: burn the tangle in
  //      front of one brazier, light it, lift the shell again, and at LOW
  //      throw it to the second brazier's island; the north shutter opens
  //   -> 0,0 the Kiln Walk (dry again): strike, burn the tangle east
  //   -> 1,0 the Saltwraith's Pan: the Piece of Heart
  registerMap({
    id: 'vault',
    kind: 'dungeon',
    name: 'The Lower Vault',
    w: 3, h: 3, floors: 1,
    cell: [15, 11],
    legend: 'dungeonSalt',
    music: 'dungeon',
    tint: 'cave',
    dungeon: {
      optional: true,
      // The Salt Pans open with the Resonance Rod, the end of the Coastwise
      // Chain; check-progression finds the stair at two Essences.
      index: 2,
      opensAt: 2,
      boss: 'saltwraith',
      bossRoom: '0,1,0',
      startRoom: '1,2',
      entrance: { map: 'cave3', floor: 0, rx: 0, ry: 0, px: 112, py: 32 },
    },
    rooms: {
      '0,1,2': {
        name: 'The Kiln Stair',
        // The one dry room. The tangle across the only way on is the
        // Kilnshell's movement verb, taught where it costs nothing.
        // The pebbled floor (`,`) lies where Seasons' own Hero's Cave rooms
        // scatter theirs (rooms $504, $507, $505, $508, $503, $502 of
        // oracles-disasm, one to each room here), so the texture is theirs.
        map: [
          '#######.#######',
          '#....,,.,.....#',
          '#.p..,,,....p.#',
          '#######&#######',
          '#....,.,.,..,,#',
          '#..U.......U..#',
          '#,.....,.,..,.#',
          '#,,.........,.#',
          '#.,.........,.#',
          '#....,.....,,.#',
          '######(C)######',
        ],
        warps: [
          { x: 7, y: 10, to: { map: 'cave3', floor: 0, rx: 0, ry: 0, px: 112, py: 32, dir: 'down' } },
        ],
        readable: [
          [3, 5, 'Scratched in the salt: "Strike it here, where\nthe kiln keeps the air dry. Below, the\nbrine will not let it catch."'],
          [11, 5, 'Older: "What the sea puts out, the sea\nkeeps. Carry the fire. Mind the water."'],
        ],
      },
      '0,1,1': {
        name: 'The Sump',
        damp: true,
        // A brazier on an island, a sump two tiles wide all round it. The pit
        // at LOW is too wide to hop and the water above it is over your head,
        // so nobody walks to the brazier at any sea; a lit shell thrown from
        // the bank reaches it at LOW and drowns in flight above it.
        map: [
          '###############',
          '#...,......,..#',
          '#...0000000...#',
          '#,.,0000000...#',
          '#,..00...00...#',
          'L...00...00...D',
          '#,,.00..,00.,,#',
          '#,,.0000000...#',
          '#,,,0000000.,,#',
          '#.,,.......,,.#',
          '#######.#######',
        ],
        entities: [
          // In the middle of its island (S162): it stood ON the sump ring, so
          // a shell had to come down beside it in a hole, and the island is
          // now three tiles each way, room for a throw to land on.
          ['torch', 7, 5],
        ],
        puzzle: {
          torches: 'all',
          flag: 'vault_sump',
          reward: { openDoors: [[14, 5]], say: 'The brazier takes. Something grinds open to the east.' },
        },
        kilnRoom: { target: [7, 5], from: [3, 5], dir: 'right', levels: [0] },
        readable: [
          [1, 9, 'A plate by the stair: "Down here the fire\ngoes where it is thrown, and the sea\ndecides whether it arrives."'],
        ],
      },
      '0,2,1': {
        name: 'The Kelp Cell',
        damp: true,
        // The key behind a plug of kelp, and the kelp in a pool: shallow at
        // LOW, over your head above. It burns only dry — at LOW — and the only
        // place to throw from is standing in the pool, which is only possible
        // at LOW. Either way round, the sea has to be out.
        map: [
          '###############',
          '#....#...#..,,#',
          '#....#...#....#',
          '#....##5##....#',
          '#.,.3333333...#',
          'D...3333333...#',
          '#.,,3333333...#',
          '#....,........#',
          '#,p,,,,.....p.#',
          '#,,,,,,.....,.#',
          '###############',
        ],
        entities: [
          ['chest', 6, 2, { pickup: 'key' }],
        ],
        kilnRoom: { target: [7, 3], from: [7, 4], dir: 'up', levels: [0], reach: true },
      },
      '0,0,1': {
        name: 'The Brine Gallery',
        damp: true,
        // Two braziers and one shell. The near one stands at the head of a
        // blind passage stopped with tangle; the far one on an island in a
        // sump. Throw the shell up the passage and it burns the tangle and
        // drops where you can lift it again; throw it again and it lights the
        // near brazier and drops again. Only THEN throw it to the island, at
        // LOW — because a shell thrown at the island is not coming back.
        map: [
          '#######D#######',
          '#.,,..........#',
          '#,###....,.,..#',
          '#.#.#...,.....#',
          '#.#&#.......,.#',
          '#.............L',
          '#......0000...#',
          '#......0..0...#',
          '#......0..0,..#',
          '#......0000...#',
          '###############',
        ],
        entities: [
          ['torch', 3, 3],
          ['torch', 9, 8],
        ],
        puzzle: {
          torches: 'all',
          flag: 'vault_gallery',
          reward: { openDoors: [[7, 0]], say: 'Both braziers burn. The way north opens.' },
        },
        kilnRoom: { target: [9, 8], from: [9, 5], dir: 'down', levels: [0] },
      },
      '0,0,0': {
        name: 'The Kiln Walk',
        // Dry again: a second kiln, so the fight beyond it is never a long
        // walk back to the top of the stair. The tangle is its door.
        map: [
          '###############',
          '#.............#',
          '#.U...,....,U.#',
          '#..,....,.....#',
          '#.....,.....###',
          '#.,.,.......&..',
          '#......,.,..###',
          '#..,.,......,.#',
          '#.U....,.,.,U.#',
          '#.............#',
          '#######D#######',
        ],
        entities: [
          ['stalfos', 4, 3, { drops: 'good' }],
          ['stalfos', 9, 7, { drops: 'good' }],
        ],
      },
      '0,1,0': {
        name: "The Saltwraith's Pan",
        // The miniboss, in a pan the conch still reaches: brine blunts it, so
        // its bolts come thinner at HIGH (src/data/bosses.js).
        map: [
          '###############',
          '#......,......#',
          '#.,...........#',
          '#...2222222...#',
          '#...2222222...#',
          '....2222222,..#',
          '#..,2222222...#',
          '#...2222222...#',
          '#.............#',
          '#.......,.,...#',
          '###############',
        ],
        entities: [
          ['saltwraith', 7, 4],
        ],
        puzzle: {
          enemies: true,
          flag: 'vault_wraith',
          reward: {
            spawn: [['pickup', 7, 6, { kind: 'heartPiece' }]],
            say: 'The salt settles. Something glints where it stood.',
          },
        },
      },
    },
  });

  // --- The Gullwind Eyrie --------------------------------------------------
  //
  // TIDE THEME: THE TIDE CHANGE IS HOW YOU MOVE. The Ferryman's Coin, thrown,
  // flies four tiles over anything a flier crosses — a chasm, deep water — and
  // on the NEXT turn of the tide, Link and the coin trade places. Up here the
  // eyrie is cut by drops nobody walks, so every crossing is a throw and a
  // conch: and because the conch only ever turns the sea one way (LOW, MID,
  // HIGH, LOW), you always land one sea later than you threw. One wall of the
  // eyrie's own stone stands until HIGH covers it: the coin clears it only then,
  // and Link follows it down to LOW on the far side.
  //
  // `coinRoom` states each crossing (one, or a list) and tools/check-coin.mjs
  // proves it in the engine: the landing cannot be walked to from the throw,
  // and the coin thrown from `from` rests on `lands` and brings Link there at
  // exactly the seas in `levels`. `dungeon.coin` teaches the dungeon flood the
  // same verb (tools/lib/dungeon-flood.mjs).
  //
  // Intended route (6 rooms):
  //   1,2 the Gull Stair: throw the coin over the chasm, sound the conch
  //   -> 1,1 the Roost -> 2,1 the Key Ledge: swap onto the island, take the
  //      Small Key, and the coin — lying where you stood — swaps you home
  //   -> 1,1 west [locked] -> 0,1 the High Water Wall: at HIGH the coin
  //      clears the drowned wall and the chasm behind it; conch to LOW
  //   -> 0,0 the Updraft: coin to the pillar, recall it, coin to the ledge
  //   -> 1,0 the Gustharpy's Roost: the Piece of Heart
  registerMap({
    id: 'eyrie',
    kind: 'dungeon',
    name: 'Gullwind Eyrie',
    w: 3, h: 3, floors: 1,
    cell: [15, 11],
    legend: 'dungeonEyrie',
    music: 'dungeon',
    tint: 'cave',
    dungeon: {
      optional: true,
      // The coin comes from the village digger at three Essences; a player
      // who has it has the Cleats too.
      index: 3,
      opensAt: 2,
      coin: true,
      boss: 'gustharpy',
      bossRoom: '0,1,0',
      startRoom: '1,2',
      entrance: { map: 'overworld', floor: 0, rx: 3, ry: 2, px: 80, py: 32 },
    },
    rooms: {
      '0,1,2': {
        name: 'The Gull Stair',
        // The lesson in one room: a drop three tiles wide from wall to wall,
        // and the way on beyond it. Throw, sound the conch, and you are over.
        map: [
          '#######.#######',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#OOOOOOOOOOOOO#',
          '#OOOOOOOOOOOOO#',
          '#OOOOOOOOOOOOO#',
          '#.............#',
          '#.............#',
          '#.............#',
          '######(C)######',
        ],
        entities: [
          ['keese', 4, 5],
        ],
        warps: [
          { x: 7, y: 10, to: { map: 'overworld', floor: 0, rx: 3, ry: 2, px: 80, py: 32, dir: 'down' } },
        ],
        readable: [
          [2, 2, 'Scratched by the stair: "The gulls cross\nwhere nobody walks. Throw the fare over,\nand let the turning sea carry you after."'],
        ],
        coinRoom: { from: [7, 7], dir: 'up', lands: [7, 3], levels: [0, 1, 2] },
      },
      '0,1,1': {
        name: 'The Roost',
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
          '#######.#######',
        ],
        entities: [
          ['keese', 3, 5, { drops: 'good' }],
          ['keese', 11, 5, { drops: 'good' }],
        ],
      },
      '0,2,1': {
        name: 'The Key Ledge',
        // The key on an island, a drop three wide all round it. Swap onto it
        // — and the coin is lying where you stood, so the next turn of the
        // tide swaps you home. The coin is your way back as well as your way
        // there.
        map: [
          '###############',
          '#.............#',
          '#..OOOOOOOOO..#',
          '#..OOOOOOOOO..#',
          '#..OOO...OOO..#',
          '...OOO...OOO..#',
          '#..OOO...OOO..#',
          '#..OOOOOOOOO..#',
          '#..OOOOOOOOO..#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['chest', 7, 5, { pickup: 'key' }],
        ],
        coinRoom: { from: [2, 5], dir: 'right', lands: [6, 5], levels: [0, 1, 2] },
      },
      '0,0,1': {
        name: 'The High Water Wall',
        // A wall of the eyrie's own stone, and a drop behind it, between you
        // and the way north. At LOW and MID the wall stops the coin dead; at
        // HIGH the sea is over it, and the coin flies the wall and the drop
        // together. The conch goes round HIGH -> LOW, so you land on the far
        // side with the sea out.
        map: [
          '###.###########',
          '#...........###',
          '#...........###',
          '#OOOOOOOOOOO###',
          '#OOOOOOOOOOO###',
          '#99999999999..L',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.............#',
          '###############',
        ],
        coinRoom: { from: [3, 6], dir: 'up', lands: [3, 2], levels: [2] },
      },
      '0,0,0': {
        name: 'The Updraft',
        // Two drops and one pillar between them: the coin to the pillar, a
        // turn of the tide; recall it, the coin to the far ledge, another.
        map: [
          '###############',
          '#...OOOOOOO...#',
          '#...OOOOOOO...#',
          '#...OOOOOOO...#',
          '#...OOOOOOO...#',
          '#...OOO.OOO....',
          '#...OOOOOOO...#',
          '#...OOOOOOO...#',
          '#...OOOOOOO...#',
          '#...OOOOOOO...#',
          '###.###########',
        ],
        entities: [
          ['keese', 6, 2],
          ['keese', 8, 8],
        ],
        coinRoom: [
          { from: [3, 5], dir: 'right', lands: [7, 5], levels: [0, 1, 2] },
          { from: [7, 5], dir: 'right', lands: [11, 5], levels: [0, 1, 2] },
        ],
      },
      '0,1,0': {
        name: "The Gustharpy's Roost",
        // The miniboss. Its downdraught shoves you, and the shove is only as
        // strong as the sea under it (src/data/bosses.js): at LOW it has none.
        map: [
          '###############',
          '#.............#',
          '#..U.......U..#',
          '#.............#',
          '#.............#',
          '..............#',
          '#.............#',
          '#.............#',
          '#..U.......U..#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['gustharpy', 7, 4],
        ],
        puzzle: {
          enemies: true,
          flag: 'eyrie_harpy',
          reward: {
            spawn: [['pickup', 7, 6, { kind: 'heartPiece' }]],
            say: 'The wind drops. A feather of light settles on the floor.',
          },
        },
      },
    },
  });

  // --- The Sunken Palace ---------------------------------------------------
  //
  // TIDE THEME: THE SEA'S HEIGHT DECIDES WHICH FLOOR YOU'RE ON. The Palace is
  // two floors under the Palace Porch, and the sea is under both. Its pools
  // (`6`, `dWhirlpool`) are shallows at LOW, deep water at MID, and at HIGH a
  // WHIRLPOOL that takes whoever touches it to the same place in the room
  // directly beneath (`Game.enterWhirlpool`). Nothing but a stair takes you
  // back up. So LOW is a floor you walk across the pools on, and HIGH is the
  // way down — and the lower floor's own water runs the other way: its sumps
  // (`0`) are holes at LOW and a swim above it, and its drowned walls (`9`)
  // stand until HIGH covers them. Every place only a whirlpool reaches says so
  // with `whirlRoom`, and tools/check-whirlpool.mjs proves every whirlpool in
  // the world in the engine and every such claim against the dungeon flood.
  //
  // It is drawn in ORACLE OF AGES' Mermaid's Cave — its sunken past half —
  // and its whirlpool is the Ages sea's, as the sea draws it under water: the
  // human's choice, S161, from Ages and Seasons kits shown side by side.
  //
  // Floor 1 is the Palace; floor 0, the Undercroft beneath it. Route:
  //   1,1,2 the Palace Stair (in from the Porch): the pools teach the drop;
  //     its stair goes down too
  //   -> 0,1,2 Beneath the Stair -> 0,1,1 the Undercroft -> 0,0,1 Under the
  //      Gallery: its stair comes up on the island in 1,0,1 the Whirl
  //      Gallery, ringed by a hole — the Small Key
  //   -> 0,1,1 east [locked] -> 0,2,1 Under the Court: swim the sumps above
  //      LOW, up the stair to 1,2,1 the Sluice Court: the second Small Key, in
  //      a pool you wade at LOW (at HIGH it takes you back down)
  //   -> 0,2,1 north [locked] -> 0,2,0 Under the Weir -> up to 1,2,0 the
  //      Weir: at HIGH swim the drowned rim into the whirlpool, down into the
  //      sealed cellar under it — the Boss Key — and its stair up
  //   -> back to 1,1,1 the Hall of Tides, north [boss] -> 1,1,0 the Throne
  //      Pool: at HIGH, down into 0,1,0 Thalassor's Lair: a Piece of Heart
  // Off the route: across the drowned band north of Under the Gallery, 0,0,0
  // the Oyster Stair up to 1,0,0 the Pearl Vault — the Coilbone, inside a ring
  // of whirlpools (sound LOW and walk it); across the sumps south, 0,0,2 the
  // Chapel Crypt up to 1,0,2 the Sunken Chapel — a Piece of Heart behind a
  // drowned wall and a band of whirlpools: no one sea crosses both, and the
  // Tidewright's Anchor holds the pools at LOW while HIGH covers the wall.
  const P = (floor, rx, ry, px, py, dir) => ({ map: 'palace', floor, rx, ry, px: px * 16, py: py * 16, dir });
  const stair = (x, y, to) => ({ x, y, to });
  registerMap({
    id: 'palace',
    kind: 'dungeon',
    name: 'The Sunken Palace',
    w: 3, h: 3, floors: 2,
    cell: [15, 11],
    legend: 'dungeonPalace',
    music: 'dungeon',
    tint: 'cave',
    dungeon: {
      optional: true,
      // The Porch's hatch takes the Bell's Clapper, which the Maku Tree
      // gives at five Essences; a player who has it has the first five
      // dungeons' items.
      index: 5,
      opensAt: 5,
      boss: 'thalassor',
      bossRoom: '0,1,0',
      startRoom: '1,1,2',
      entrance: { map: 'cave4', floor: 0, rx: 0, ry: 0, px: 112, py: 80 },
    },
    rooms: {
      // ---- floor 1: the Palace -------------------------------------------
      '1,1,2': {
        name: 'The Palace Stair',
        map: [
          '#######.#######',
          '#.............#',
          '#.U.........U.#',
          '#....66666....#',
          '#....66666....#',
          '#....66666....#',
          '#.............#',
          '#.............#',
          '#.p........./.#',
          '#.............#',
          '######(C)######',
        ],
        warps: [
          { x: 7, y: 10, to: { map: 'cave4', floor: 0, rx: 0, ry: 0, px: 112, py: 80, dir: 'down' } },
          stair(12, 8, P(0, 1, 2, 12, 9, 'down')),
        ],
        readable: [
          [2, 2, 'Cut in the pillar: "The sea is under this\nfloor. When it stands high it opens it,\nand takes whoever swims in down to it."'],
          [12, 2, 'Older: "Low water, walk. High water, sink.\nThe stairs are for coming home."'],
        ],
      },
      '1,1,1': {
        name: 'The Hall of Tides',
        map: [
          '#######B#######',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#.............#',
          '..............#',
          '#.............#',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#######.#######',
        ],
        entities: [
          ['stalfos', 4, 4, { drops: 'good' }],
          ['stalfos', 10, 6, { drops: 'good' }],
        ],
      },
      '1,0,1': {
        name: 'The Whirl Gallery',
        // The Small Key on an island, a hole all round it: no sea crosses a
        // hole, and the island's only way is the stair from beneath it.
        map: [
          '###############',
          '#.............#',
          '#.66.OOOOOO.66#',
          '#.66.O....O.66#',
          '#....O....O...#',
          '#....O....O....',
          '#.66.O/...O.66#',
          '#.66.OOOOOO.66#',
          '#.............#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['chest', 8, 4, { pickup: 'key' }],
        ],
        warps: [stair(6, 6, P(0, 0, 1, 7, 6, 'down'))],
      },
      '1,2,1': {
        name: 'The Sluice Court',
        // The second key in the middle of a pool: wade it at LOW; at HIGH it
        // takes you back down to the room you came up from.
        map: [
          '###############',
          '#.............#',
          '#.............#',
          '#...66666.....#',
          '#...66666.....#',
          '#...66.66.../.#',
          '#...66666.....#',
          '#...66666.....#',
          '#.............#',
          '#.............#',
          '###############',
        ],
        entities: [
          ['chest', 6, 5, { pickup: 'key' }],
          // S162: a wizzrobe keeps the court, on the dry side, away from the
          // pool the key is waded for.
          ['wizzrobe', 11, 2, { drops: 'good' }],
        ],
        warps: [stair(12, 5, P(0, 2, 1, 12, 6, 'down'))],
      },
      '1,2,0': {
        name: 'The Weir',
        // A whirlpool behind a drowned rim. Below HIGH the rim is a wall; at
        // HIGH you swim it, and the whirlpool takes you into the cellar
        // sealed under it, where the Boss Key is.
        map: [
          '###############',
          '#.............#',
          '#..99999......#',
          '#..96669......#',
          '#..96669......#',
          '#..96669......#',
          '#..99999......#',
          '#.............#',
          '#.U........./.#',
          '#.............#',
          '###############',
        ],
        entities: [
          // S162: a darknut on the Weir's dry east side, clear of the rim.
          ['darknut', 10, 4, { drops: 'good' }],
        ],
        warps: [stair(12, 8, P(0, 2, 0, 12, 9, 'down'))],
        whirlRoom: { lands: [[5, 4]] },
      },
      '1,1,0': {
        name: 'The Throne Pool',
        // Behind the boss door, the palace's great whirlpool. Thalassor is
        // under it.
        map: [
          '###############',
          '#.............#',
          '#.U...999...U.#',
          '#....96669....#',
          '#....96669....#',
          '#....96669....#',
          '#.U...999...U.#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#######B#######',
        ],
        readable: [
          [2, 2, 'On the throne\'s step: "The king of this\nhouse is the eel beneath it. Go down at\nhigh water, and come up if you can."'],
        ],
        whirlRoom: { lands: [[7, 4]] },
      },
      '1,0,0': {
        name: 'The Pearl Vault',
        // The Coilbone in a ring of whirlpools. You came up here at HIGH —
        // the drowned band below needs it — so the ring takes you straight
        // back down. Sound LOW and walk it.
        map: [
          '###############',
          '#.............#',
          '#...6666666...#',
          '#...6.....6...#',
          '#...6.....6...#',
          '#...6.....6...#',
          '#...6666666...#',
          '#.............#',
          '#.........../.#',
          '#.U.........U.#',
          '###############',
        ],
        entities: [
          ['chest', 7, 4, { charm: 'coilbone' }],
        ],
        warps: [stair(12, 8, P(0, 0, 0, 12, 9, 'down'))],
      },
      '1,0,2': {
        name: 'The Sunken Chapel',
        // A Piece of Heart behind a drowned wall, and a band of whirlpools
        // right up against it. Below HIGH the wall stands; at HIGH the band
        // takes you down; and there is no dry step between the two to sound
        // the conch from. No one sea crosses both — the Tidewright's Anchor
        // holds the band at LOW while HIGH covers the wall.
        map: [
          '###############',
          '#....U...U....#',
          '#.............#',
          '#9999999999999#',
          '#6666666666666#',
          '#6666666666666#',
          '#6666666666666#',
          '#.............#',
          '#.............#',
          '#./...........#',
          '###############',
        ],
        entities: [
          ['pickup', 7, 2, { kind: 'heartPiece' }],
        ],
        warps: [stair(2, 9, P(0, 0, 2, 3, 9, 'down'))],
        anchorGate: { from: [3, 9], to: [7, 2] },
      },
      // ---- floor 0: the Undercroft ----------------------------------------
      '0,1,2': {
        name: 'Beneath the Stair',
        map: [
          '#######.#######',
          '#.............#',
          '#.U.........U.#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.p.........S.#',
          '#.............#',
          '###############',
        ],
        entities: [
          // S162: the Palace's underside is guarded. Two darknuts on the
          // dry floor, clear of both stairs.
          ['darknut', 4, 5, { drops: 'good' }],
          ['darknut', 10, 4, { drops: 'good' }],
        ],
        warps: [stair(12, 8, P(1, 1, 2, 12, 9, 'up'))],
      },
      '0,1,1': {
        name: 'The Undercroft',
        map: [
          '###############',
          '#.............#',
          '#.p.........p.#',
          '#....33333....#',
          '#....33333....#',
          '.....33333....L',
          '#....33333....#',
          '#....33333....#',
          '#.............#',
          '#.............#',
          '#######.#######',
        ],
        entities: [
          ['keese', 3, 5, { drops: 'good' }],
          ['keese', 11, 5, { drops: 'good' }],
        ],
      },
      '0,0,1': {
        name: 'Under the Gallery',
        // A drowned band to the north, crossed only at HIGH, and sumps to
        // the south, a hole at LOW.
        map: [
          '#######.#######',
          '#9999999999999#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#..............',
          '#.....S.......#',
          '#.............#',
          '#0000000000000#',
          '#0000000000000#',
          '#######.#######',
        ],
        entities: [
          // S162: gels on the dry band between the drowned wall and the sumps,
          // none under the Gallery's whirlpools.
          ['gel', 7, 3], ['gel', 10, 4], ['gel', 9, 6],
        ],
        warps: [stair(6, 6, P(1, 0, 1, 7, 6, 'up'))],
      },
      '0,2,1': {
        name: 'Under the Court',
        map: [
          '###########L###',
          '#.00..........#',
          '#.00..........#',
          '#.00..........#',
          '#.00..........#',
          'L.00........S.#',
          '#.00..........#',
          '#.00..........#',
          '#.00..........#',
          '#.00..........#',
          '###############',
        ],
        warps: [stair(12, 5, P(1, 2, 1, 12, 6, 'up'))],
      },
      '0,2,0': {
        name: 'Under the Weir',
        // The cellar under the Weir's whirlpool is sealed on every side; its
        // stair goes up and nothing comes down it.
        map: [
          '###############',
          '#.............#',
          '#.########....#',
          '#.#......#....#',
          '#.#......#....#',
          '#.#......#....#',
          '#.#.....S#....#',
          '#.########....#',
          '#...........S.#',
          '#.............#',
          '###########L###',
        ],
        entities: [
          // A row off the cellar's north wall (S162): a chest pops its key
          // out a tile ABOVE itself, and at 8,3 the Boss Key came to rest
          // inside the wall, where nothing could touch it.
          ['chest', 8, 4, { pickup: 'bossKey' }],
          // S162: keese in the corridor round the sealed cellar.
          ['keese', 12, 3, { drops: 'good' }],
          ['keese', 3, 9, { drops: 'good' }],
        ],
        warps: [
          stair(12, 8, P(1, 2, 0, 12, 9, 'up')),
          stair(8, 6, P(1, 2, 0, 11, 8, 'up')),
        ],
      },
      '0,0,0': {
        name: 'The Oyster Stair',
        map: [
          '###############',
          '#.............#',
          '#..U.......U..#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#..U.......U..#',
          '#...........S.#',
          '#.............#',
          '#######.#######',
        ],
        entities: [
          // Clear of the Pearl Vault's ring above: nobody lands on a keese.
          ['keese', 2, 5, { drops: 'good' }],
          ['keese', 12, 4, { drops: 'good' }],
        ],
        warps: [stair(12, 8, P(1, 0, 0, 12, 9, 'up'))],
      },
      '0,0,2': {
        name: 'The Chapel Crypt',
        map: [
          '#######.#######',
          '#.............#',
          '#..U.......U..#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.............#',
          '#.S...........#',
          '###############',
        ],
        entities: [
          // S162: the Chapel Crypt's dead, south of where the Chapel's
          // whirlpools put a swimmer down (rows 4-6).
          ['stalfos', 5, 8, { drops: 'good' }],
          ['stalfos', 10, 8, { drops: 'good' }],
        ],
        warps: [stair(2, 9, P(1, 0, 2, 3, 9, 'up'))],
      },
      '0,1,0': {
        name: "Thalassor's Lair",
        // Under the Throne Pool. The eel's whirlpool pulls only as hard as
        // the sea (src/data/bosses.js): LOW beaches it, and it thrashes.
        // The stair out goes up once the eel is beaten; nothing comes down it.
        map: [
          '###############',
          '#.............#',
          '#.33333333333.#',
          '#.33.......33.#',
          '#.33.......33.#',
          '#.33.......33.#',
          '#.33.......33.#',
          '#.33333333333.#',
          '#.............#',
          '#.S...........#',
          '###############',
        ],
        entities: [
          // Up in the north of the lair, clear of where the Throne Pool puts
          // you down.
          ['thalassor', 7, 1],
        ],
        puzzle: {
          enemies: true,
          flag: 'palace_eel',
          reward: {
            spawn: [['pickup', 7, 6, { kind: 'heartPiece' }]],
            say: 'The water goes still. Something glints where the eel went down.',
          },
        },
        // The stair out works once the eel is beaten: a fight is not left by
        // the back door.
        warps: [{ ...stair(2, 9, P(1, 1, 0, 2, 9, 'up')), needFlag: 'palace_eel' }],
      },
    },
  });
}
