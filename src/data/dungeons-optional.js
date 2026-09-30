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
          '#.........,.,.#',
          '#...0000000...#',
          '#,.,0000000...#',
          'L...00...00...D',
          '#,,.00..,00.,,#',
          '#,,.0000000...#',
          '#,,,.......,.,#',
          '#.,,.......,,.#',
          '#######.#######',
        ],
        entities: [
          ['torch', 6, 4],
        ],
        puzzle: {
          torches: 'all',
          flag: 'vault_sump',
          reward: { openDoors: [[14, 5]], say: 'The brazier takes. Something grinds open to the east.' },
        },
        kilnRoom: { target: [6, 4], from: [3, 5], dir: 'right', levels: [0] },
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
          '#......0000...#',
          '#......00.0,..#',
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
}
