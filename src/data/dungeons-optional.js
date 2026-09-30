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
}
