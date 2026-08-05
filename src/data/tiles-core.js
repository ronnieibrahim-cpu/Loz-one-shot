// Core tile art: the universal tiles used by every region. Regional and dungeon
// tile packs extend this set. See gfx/art.js for the pixel grammar and
// world/tileset.js for the tile-definition contract.
//
// All background tiles are exactly 16x16. Tiles with transparent pixels declare
// `underArt` so a base tile is drawn beneath them.

import { tiles as tileSheet } from '../gfx/art.js';
import { registerTiles, F, declareAnimArt, registerTransforms } from '../world/tileset.js';
import { TERRAIN_ART } from './tiles-terrain.js';

const HAND_ART = {
  // ---- ground -------------------------------------------------------------
  grass: `
    1111111111111111
    1111111111111111
    1112111111111111
    1111111111112111
    1111111111111111
    1211111111111111
    1111111111111121
    1111111111111111
    1111111111111111
    1111211111111111
    1111111111121111
    1111111111111111
    1111111111111111
    1211111111111111
    1111111111111121
    1111111111111111`,

  grassTuft: `
    1111111111111111
    1112111111111111
    1122211111121111
    1112111111222111
    1111111111121111
    1111111111111111
    1111111211111111
    1111112221111111
    1111111211111111
    1111111111111111
    1211111111112111
    2221111111112221
    1211111111112111
    1111111111111111
    1111112111111111
    1111111111111111`,

  flowers: `
    1111111111111111
    1111111111111111
    1112111111101111
    1111011111011111
    1111111111111111
    1011111111111111
    1111111111111101
    1111111111111111
    1111111111111111
    1111011111111111
    1111111111101111
    1111111111011111
    1111111111111111
    1011111111111111
    1111111111111101
    1111111111111111`,

  tallgrass: `
    1121111211112111
    1121121211212111
    2112121121212121
    2112121121212121
    2212212212212212
    1221221221221221
    1122112211221122
    1121121121121121
    1121111211112111
    1121121211212111
    2112121121212121
    2112121121212121
    2212212212212212
    1221221221221221
    1122112211221122
    1121121121121121`,

  sand: `
    1111111111011111
    1111111111111111
    1121111111111111
    1111111111111211
    1111101111111111
    1111111111111111
    1111111112111111
    1011111111111111
    1111111111011111
    1111111111111111
    1121111111111111
    1111111111111211
    1111101111111111
    1111111111111111
    1111111112111111
    1011111111111111`,

  sandWet: `
    1111111111111111
    1101111111011111
    1111111111111111
    1111211111111211
    1111111111111111
    1111111111111111
    1011111101111111
    1111111111111111
    1111111111111111
    1101111111011111
    1111111111111111
    1111211111111211
    1111111111111111
    1111111111111111
    1011111101111111
    1111111111111111`,

  sandRipple: `
    1111111111111111
    2211112222111122
    1111111111111111
    1111111111111111
    1122221111222211
    1111111111111111
    1111111111111111
    2211112222111122
    1111111111111111
    1111111111111111
    1122221111222211
    1111111111111111
    1111111111111111
    2211112222111122
    1111111111111111
    1111111111111111`,

  mud: `
    1122111111221111
    1221111122111111
    1111111111111112
    2111112211111121
    1111121111111211
    1111211111112111
    1222111111221111
    1111111122111111
    1122111111221111
    1221111122111111
    1111111111111112
    2111112211111121
    1111121111111211
    1111211111112111
    1222111111221111
    1111111122111111`,

  // ---- water: three animation frames each ---------------------------------
  waterS0: `
    1111111111111111
    1111111111111111
    0011000011000011
    1111111111111111
    1111111111111111
    1111111111111111
    1100001100110000
    1111111111111111
    1111111111111111
    1111111111111111
    0011000011000011
    1111111111111111
    1111111111111111
    1111111111111111
    1100001100110000
    1111111111111111`,
  waterS1: `
    1111111111111111
    1111111111111111
    1100110000110000
    1111111111111111
    1111111111111111
    1111111111111111
    0011000011001100
    1111111111111111
    1111111111111111
    1111111111111111
    1100110000110000
    1111111111111111
    1111111111111111
    1111111111111111
    0011000011001100
    1111111111111111`,
  waterS2: `
    1111111111111111
    1111111111111111
    0000110011000011
    1111111111111111
    1111111111111111
    1111111111111111
    0000001100001100
    1111111111111111
    1111111111111111
    1111111111111111
    0000110011000011
    1111111111111111
    1111111111111111
    1111111111111111
    0000001100001100
    1111111111111111`,

  waterD0: `
    1111111111111111
    1121111111112111
    1111111111111111
    0111111001111110
    1111111111111111
    1111112111211111
    1111111111111111
    1111111111111111
    1111111111111111
    1121111111112111
    1111111111111111
    0111111001111110
    1111111111111111
    1111112111211111
    1111111111111111
    1111111111111111`,
  waterD1: `
    1111111111111111
    1111211111121111
    1111111111111111
    1001111110011111
    1111111111111111
    1112111112111111
    1111111111111111
    1111111111111111
    1111111111111111
    1111211111121111
    1111111111111111
    1001111110011111
    1111111111111111
    1112111112111111
    1111111111111111
    1111111111111111`,
  waterD2: `
    1111111111111111
    2111111121111111
    1111111111111111
    1110011111100111
    1111111111111111
    1211111211111121
    1111111111111111
    1111111111111111
    1111111111111111
    2111111121111111
    1111111111111111
    1110011111100111
    1111111111111111
    1211111211111121
    1111111111111111
    1111111111111111`,

  // Water meeting land: a foam edge, one per side.
  foamN: `
    0000000000000000
    1001100110011001
    1111111111111111
    1111111111111111
    1111111111111111
    1111111111111111
    1111111111111111
    1111111111111111
    1111111111111111
    1111111111111111
    1111111111111111
    1111111111111111
    1111111111111111
    1111111111111111
    1111111111111111
    1111111111111111`,

  // ---- rock / cliff -------------------------------------------------------
  cliff: `
    3333333333333333
    1111111111111111
    1111111111111111
    1211111111111121
    1111111111111111
    2222222222222222
    3333333333333333
    1111111111111111
    1111111111111111
    1111112112111111
    1111111111111111
    2222222222222222
    3333333333333333
    1111111111111111
    1111111111111111
    2222222222222222`,

  // The same courses as `cliff` with a fault line zigzagging down through them,
  // so a bombable stretch of cliff reads as cracked at a glance without leaving
  // the terrain register. Dithering is allowed on terrain; this is a hard line.
  cliffCracked: `
    3333333333333333
    1111113111111111
    1111131111111111
    1211311111111121
    1111311111111111
    2222322222222222
    3333333333333333
    1111311111111111
    1111131111111111
    1111132112111111
    1111113111111111
    2222223222222222
    3333333333333333
    1111113111111111
    1111131111111111
    2222232222222222`,

  cliffTop: `
    2222222222222222
    2111111111111112
    2111211111121112
    2111111111111112
    2112111111111212
    2111111111111112
    2111111211111112
    2222222222222222
    3333333333333333
    1111111111111111
    1111111111111111
    1211111111111121
    1111111111111111
    2222222222222222
    3333333333333333
    1111111111111111`,

  rockFloor: `
    1111211111112111
    1112111111121111
    1111111111111111
    2111111211111112
    1111111111111111
    1111112111111121
    1211111111211111
    1111111111111111
    1111211111112111
    1112111111121111
    1111111111111111
    2111111211111112
    1111111111111111
    1111112111111121
    1211111111211111
    1111111111111111`,

  // ---- props (transparent, need underArt) ---------------------------------
  tree: `
    ....33333333....
    ..333311113333..
    .33111111111133.
    3311101111011133
    3111111111111113
    3111121111211113
    3111111111111113
    3111112112111113
    .33111111111133.
    ..333322223333..
    ....33222233....
    ......3223......
    ......3223......
    ......3223......
    .....322233.....
    ....32222233....`,

  palmTree: `
    ......33........
    ...333113330....
    ..3111111111330.
    .3311011111113..
    3111133113311133
    ..33..3223..33..
    ......3223......
    ......3123......
    ......3123......
    ......3123......
    ......3123......
    ......3123......
    ......3123......
    .....331233.....
    ....3312233.....
    ...331122233....`,

  bush: `
    ................
    ................
    ....33333333....
    ..331111111133..
    .31110111101113.
    3111111111111113
    3111121111211113
    3111111111111113
    3111111111111113
    .31111111111113.
    ..331111111133..
    ....33222233....
    ......3223......
    ................
    ................
    ................`,

  rock: `
    ................
    ................
    ....33333333....
    ..331111111133..
    ..311101111113..
    ..311111111123..
    ..311111111223..
    ..311111122223..
    ..311111222223..
    ..331122222233..
    ....33222233....
    ................
    ................
    ................
    ................
    ................`,

  pot: `
    ................
    .....333333.....
    ....31111113....
    ...3111111113...
    ..311110111123..
    ..311111111223..
    ..311111112223..
    ..311111122223..
    ..311111222223..
    ..311112222223..
    ..331122222233..
    ...3312222333...
    ....33333333....
    ................
    ................
    ................`,

  sign: `
    ................
    ................
    .33333333333333.
    .30000000000003.
    .30333033303303.
    .30000000000003.
    .30330330330003.
    .30000000000003.
    .33333333333333.
    ......3223......
    ......3223......
    ......3223......
    ......3223......
    ......3223......
    .....332233.....
    ................`,

  stump: `
    ................
    ................
    ................
    ...3333333333...
    ..311111111113..
    .31122222221113.
    .31212222212213.
    .31221111122213.
    .31222111222213.
    .31222222222213.
    .31122222222113.
    ..311222222113..
    ...3311111133...
    .....333333.....
    ................
    ................`,

  // ---- transitions --------------------------------------------------------
  caveMouth: `
    3333333333333333
    3222222222222223
    3221111111111223
    3211133333311123
    3211333333331123
    3213333333333123
    3213333333333123
    3213333333333123
    3213333333333123
    3213333333333123
    3213333333333123
    3213333333333123
    3213333333333123
    3211333333331123
    3221133333311223
    3333333333333333`,

  stairsDown: `
    3333333333333333
    1111111111111111
    1111111111111111
    2222222222222222
    3333333333333333
    1111111111111111
    1111111111111111
    2222222222222222
    3333333333333333
    1111111111111111
    1111111111111111
    2222222222222222
    3333333333333333
    1111111111111111
    1111111111111111
    2222222222222222`,

  ledgeS: `
    1111111111111111
    1111111111111111
    1111111111111111
    1111111111111111
    1111111111111111
    1111111111111111
    2222222222222222
    3333333333333333
    3333333333333333
    2222222222222222
    2222222222222222
    3333333333333333
    ................
    ................
    ................
    ................`,

  // ---- dungeon ------------------------------------------------------------
  dFloor: `
    2222222222222222
    2111111221111112
    2111111221111112
    2111111221111112
    2111111221111112
    2111111221111112
    2111111221111112
    2222222222222222
    2222222222222222
    2111111221111112
    2111111221111112
    2111111221111112
    2111111221111112
    2111111221111112
    2111111221111112
    2222222222222222`,

  dFloorCrack: `
    2222222222222222
    2111111221111112
    2113111221111112
    2111311223111112
    2111131221311112
    2111113221131112
    2111111221113112
    2222222222222222
    2222222222222222
    2111111221111112
    2111111221111112
    2111311221111112
    2111131221111112
    2111111221111112
    2111111221111112
    2222222222222222`,

  dWall: `
    3333333333333333
    3011111111111113
    3111111111111123
    3111111111111123
    3111111111111123
    3111111111111123
    3222222222222223
    3333333333333333
    3333333333333333
    3011111111111113
    3111111111111123
    3111111111111123
    3111111111111123
    3111111111111123
    3222222222222223
    3333333333333333`,

  dWallCracked: `
    3333333333333333
    3011111111111113
    3111113111111123
    3111311111111123
    3113111113111123
    3111111311111123
    3222222222222223
    3333333333333333
    3333333333333333
    3011113111111113
    3111131111111123
    3111113111111123
    3111111311111123
    3111111131111123
    3222222222222223
    3333333333333333`,

  dPit: `
    3333333333333333
    3222222222222223
    3233333333333323
    3233333333333323
    3233333333333323
    3233333333333323
    3233333333333323
    3233333333333323
    3233333333333323
    3233333333333323
    3233333333333323
    3233333333333323
    3233333333333323
    3233333333333323
    3222222222222223
    3333333333333333`,

  dDoorClosed: `
    3333333333333333
    3111111111111113
    3122222222222213
    3123333333333213
    3123222222223213
    3123211111123213
    3123211111123213
    3123211111123213
    3123211111123213
    3123211111123213
    3123211111123213
    3123222222223213
    3123333333333213
    3122222222222213
    3111111111111113
    3333333333333333`,

  dDoorOpen: `
    3333333333333333
    3111111111111113
    3122222222222213
    3120000000000213
    3120000000000213
    3120000000000213
    3120000000000213
    3120000000000213
    3120000000000213
    3120000000000213
    3120000000000213
    3120000000000213
    3120000000000213
    3122222222222213
    3111111111111113
    3333333333333333`,

  dDoorLocked: `
    3333333333333333
    3111111111111113
    3122222222222213
    3123333333333213
    3123222222223213
    3123211111123213
    3123210001123213
    3123210101123213
    3123210001123213
    3123211011123213
    3123211011123213
    3123222222223213
    3123333333333213
    3122222222222213
    3111111111111113
    3333333333333333`,

  dStairs: `
    3333333333333333
    3111111111111113
    3111111111111113
    3222222222222223
    3333333333333333
    3111111111111113
    3111111111111113
    3222222222222223
    3333333333333333
    3111111111111113
    3111111111111113
    3222222222222223
    3333333333333333
    3111111111111113
    3111111111111113
    3222222222222223`,

  dSwitchUp: `
    2222222222222222
    2111111111111112
    2113333333333112
    2113111111113112
    2131111111111312
    2131111111111312
    2131111111111312
    2131111111111312
    2131111111111312
    2131111111111312
    2131111111111312
    2131111111111312
    2113111111113112
    2113333333333112
    2111111111111112
    2222222222222222`,

  dSwitchDown: `
    2222222222222222
    2111111111111112
    2111111111111112
    2113333333333112
    2130000000000312
    2130000000000312
    2130000000000312
    2130000000000312
    2130000000000312
    2130000000000312
    2130000000000312
    2130000000000312
    2113333333333112
    2111111111111112
    2111111111111112
    2222222222222222`,

  dBlock: `
    3333333333333333
    3011111111111113
    3011111111111113
    3011111111111113
    3011111111111113
    3011111111111113
    3011111111111113
    3011111111111113
    3011111111111113
    3011111111111113
    3011111111111113
    3011111111111113
    3111111111111123
    3122222222222223
    3222222222222223
    3333333333333333`,

  spikes: `
    ................
    ......33........
    .....3003.......
    .....3003..33...
    ..33.3003.3003..
    .3003300330033..
    3003300330033003
    0033003300330033
    ................
    ......33........
    .....3003.......
    ..33.3003..33...
    .3003300330033..
    3003300330033003
    0033003300330033
    ................`,

  dDoorBoss: `
    3333333333333333
    3111111111111113
    3122222222222213
    3103333333333013
    3103022222203013
    3103021111203013
    3103021001203013
    3103021301203013
    3103021001203013
    3103021111203013
    3103022222203013
    3103333333333013
    3122222222222213
    3111111111111113
    3111111111111113
    3333333333333333`,

  dPost: `
    ................
    ....33333333....
    ..331111111133..
    ..310000000213..
    ..311111111213..
    ..311222221213..
    ..311211121213..
    ..311212121213..
    ..311211121213..
    ..311222221213..
    ..311111111213..
    ..310000000213..
    ..331111111133..
    ....33333333....
    ................
    ................`,

  digSpot: `
    1111111111111111
    1111133331111111
    1112211223111111
    1132111112211111
    1121111111321111
    1112111112211111
    1111322211111111
    1111111111111111
    1111111111111111
    1111111133311111
    1111113221131111
    1111132111123111
    1111121111112111
    1111113222211111
    1111111111111111
    1111111111111111`,

  void: `
    3333333333333333
    3333333333333333
    3333333333333333
    3333333333333333
    3333333333333333
    3333333333333333
    3333333333333333
    3333333333333333
    3333333333333333
    3333333333333333
    3333333333333333
    3333333333333333
    3333333333333333
    3333333333333333
    3333333333333333
    3333333333333333`,
};

// Terrain extracted from assets/sheets/ wins over the hand-drawn tile of the
// same name — ART-DIRECTION.md's rule 1, "if a sheet has it, extract it". Only
// the pixels are replaced; every tile keeps the palette its definition below
// binds, so the palette-swap variants and the region colour schemes are
// untouched. Regenerate with `python3 tools/rip-terrain.py`.
const ART = { ...HAND_ART, ...TERRAIN_ART };

export function installCoreTiles() {
  tileSheet.add(ART, 'stone');
  // Animation frames are art without being tiles in their own right.
  declareAnimArt(Object.keys(ART));

  const TILE_DEFS = {
    void: { art: ART.void, pal: 'abyss', flags: F.VOID | F.SOLID },

    // --- walkable ground ---
    grass: { art: ART.grass, pal: 'grass' },
    grassTuft: { art: ART.grassTuft, pal: 'grass' },
    grassDark: { art: ART.grass, pal: 'grassdk' },
    flowers: { art: ART.flowers, pal: 'grass' },
    tallgrass: { art: ART.tallgrass, pal: 'grassdk', flags: F.TALLGRASS },
    sand: { art: ART.sand, pal: 'sand' },
    sandWet: { art: ART.sandWet, pal: 'sandwet' },
    sandRipple: { art: ART.sandRipple, pal: 'sand' },
    sandDeep: { art: ART.sand, pal: 'sandwet', flags: F.SLOW },
    mud: { art: ART.mud, pal: 'bog', flags: F.SLOW },
    rockFloor: { art: ART.rockFloor, pal: 'stone' },
    rockFloorDk: { art: ART.rockFloor, pal: 'stonedk' },
    // Regional palette variants. Same art, different colours — this is how the
    // GBC games gave each region its own look without redrawing every tile.
    rockFloorRust: { art: ART.rockFloor, pal: 'rust' },
    rockFloorCoral: { art: ART.rockFloor, pal: 'coral' },
    grassBog: { art: ART.grass, pal: 'bog' },
    grassTuftBog: { art: ART.grassTuft, pal: 'bog' },
    saltFlat: { art: ART.sandRipple, pal: 'marble' },
    saltCrust: { art: ART.sand, pal: 'marble' },
    iceFloor: { art: ART.sandRipple, pal: 'ice', flags: F.ICE },
    sandCoral: { art: ART.sand, pal: 'coral' },
    sandRust: { art: ART.sand, pal: 'rust' },

    // --- water (concrete) ---
    waterS: { art: ART.waterS0, pal: 'water', flags: F.WATER, anim: ['waterS0', 'waterS1', 'waterS2', 'waterS1'], animRate: 11 },
    waterD: { art: ART.waterD0, pal: 'deep', flags: F.DEEP, anim: ['waterD0', 'waterD1', 'waterD2', 'waterD1'], animRate: 13 },
    waterSReef: { art: ART.waterS0, pal: 'reef', flags: F.WATER, anim: ['waterS0', 'waterS1', 'waterS2', 'waterS1'], animRate: 11 },
    waterDReef: { art: ART.waterD0, pal: 'reef', flags: F.DEEP, anim: ['waterD0', 'waterD1', 'waterD2', 'waterD1'], animRate: 13 },
    waterAbyss: { art: ART.waterD0, pal: 'abyss', flags: F.DEEP, anim: ['waterD0', 'waterD1', 'waterD2', 'waterD1'], animRate: 16 },
    foamN: { art: ART.foamN, pal: 'water', flags: F.WATER },

    // --- TIDE TILES: the heart of the game -------------------------------
    // A tide tile resolves to a different concrete tile per tide level.
    // low (0)            mid (1)            high (2)
    sandbar: { tide: ['sand', 'waterS', 'waterD'] },              // beach that drowns
    tidePool: { tide: ['sandWet', 'waterS', 'waterD'] },
    shoal: { tide: ['sandRipple', 'sandWet', 'waterS'] },         // only floods at high
    seafloor: { tide: ['sandWet', 'waterD', 'waterD'] },          // exposed only at low
    channel: { tide: ['waterS', 'waterD', 'waterD'] },            // wadeable only at low
    reefFlat: { tide: ['rockFloor', 'waterSReef', 'waterDReef'] },
    reefDeep: { tide: ['waterSReef', 'waterDReef', 'waterDReef'] },
    tideRock: { tide: ['rockFloor', 'rockFloor', 'waterS'] },     // stepping stone
    drownWall: { tide: ['cliff', 'cliff', 'waterD'] },            // swim over it at high
    tideGrass: { tide: ['grass', 'grass', 'waterS'] },
    mudflat: { tide: ['mud', 'waterS', 'waterD'] },
    abyssHole: { tide: ['waterD', 'waterAbyss', 'waterAbyss'] },

    // --- barriers ---
    cliff: { art: ART.cliff, pal: 'stone', flags: F.SOLID },
    cliffTop: { art: ART.cliffTop, pal: 'stone', flags: F.SOLID },
    cliffDk: { art: ART.cliff, pal: 'stonedk', flags: F.SOLID },
    cliffSand: { art: ART.cliff, pal: 'sand', flags: F.SOLID },
    cliffRust: { art: ART.cliff, pal: 'rust', flags: F.SOLID },
    cliffCoral: { art: ART.cliff, pal: 'coral', flags: F.SOLID },
    cliffMarble: { art: ART.cliff, pal: 'marble', flags: F.SOLID },
    cliffAbyss: { art: ART.cliff, pal: 'abyss', flags: F.SOLID },
    // Outdoor bombable walls. dWallCracked is the indoor equivalent; these let
    // an overworld region be gated on Bombs, which GAME-PLAN.md asks for and
    // nothing outdoors could express before.
    cliffCracked: { art: ART.cliffCracked, pal: 'stone', flags: F.SOLID | F.BOMBABLE },
    cliffCrackedDk: { art: ART.cliffCracked, pal: 'stonedk', flags: F.SOLID | F.BOMBABLE },
    treeDead: { art: ART.tree, pal: 'treedead', flags: F.SOLID, underArt: 'grassBog' },
    treeDark: { art: ART.tree, pal: 'treedk', flags: F.SOLID, underArt: 'grassDark' },
    tree: { art: ART.tree, pal: 'tree', flags: F.SOLID, underArt: 'grass' },
    treeSand: { art: ART.tree, pal: 'tree', flags: F.SOLID, underArt: 'sand' },
    palm: { art: ART.palmTree, pal: 'tree', flags: F.SOLID, underArt: 'sand' },
    bush: { art: ART.bush, pal: 'tree', flags: F.SOLID | F.BUSH, underArt: 'grass' },
    bushSand: { art: ART.bush, pal: 'tree', flags: F.SOLID | F.BUSH, underArt: 'sand' },
    rock: { art: ART.rock, pal: 'stone', flags: F.SOLID | F.ROCK, underArt: 'grass' },
    rockSand: { art: ART.rock, pal: 'sand', flags: F.SOLID | F.ROCK, underArt: 'sand' },
    pot: { art: ART.pot, pal: 'pot', flags: F.SOLID | F.ROCK, underArt: 'dFloor' },
    sign: { art: ART.sign, pal: 'wood', flags: F.SOLID, underArt: 'grass' },
    stump: { art: ART.stump, pal: 'wood', flags: F.SOLID, underArt: 'grass' },
    spikes: { art: ART.spikes, pal: 'stone', flags: F.HAZARD, underArt: 'dFloor' },

    // --- transitions ---
    caveMouth: { art: ART.caveMouth, pal: 'stonedk', flags: F.SOLID | F.WARP, mask: 0 },
    caveMouthSolid: { art: ART.caveMouth, pal: 'stonedk', flags: F.SOLID },
    stairsDown: { art: ART.stairsDown, pal: 'stone', flags: F.WARP | F.STAIRS },
    ledgeS: { art: ART.ledgeS, pal: 'grass', flags: F.LEDGE, ledge: 'down', underArt: 'grass' },

    // --- dungeon ---
    dFloor: { art: ART.dFloor, pal: 'brickf' },
    dFloorCrack: { art: ART.dFloorCrack, pal: 'brick' },
    dFloorWet: { art: ART.dFloor, pal: 'stonef' },
    dWall: { art: ART.dWall, pal: 'stonedk', flags: F.SOLID },
    dWallCracked: { art: ART.dWallCracked, pal: 'stonedk', flags: F.SOLID | F.BOMBABLE },
    dPit: { art: ART.dPit, pal: 'abyss', flags: F.PIT },
    dDoorClosed: { art: ART.dDoorClosed, pal: 'stonedk', flags: F.SOLID | F.DOOR },
    dDoorOpen: { art: ART.dDoorOpen, pal: 'stonedk', flags: F.WARP | F.DOOR },
    dDoorLocked: { art: ART.dDoorLocked, pal: 'gold', flags: F.SOLID | F.DOOR },
    dDoorBoss: { art: ART.dDoorBoss, pal: 'gold', flags: F.SOLID | F.DOOR },
    dStairs: { art: ART.dStairs, pal: 'stonedk', flags: F.WARP | F.STAIRS },
    dPost: { art: ART.dPost, pal: 'stone', flags: F.SOLID | F.HOOKABLE, underArt: 'dFloor' },
    post: { art: ART.dPost, pal: 'wood', flags: F.SOLID | F.HOOKABLE, underArt: 'grass' },
    postSand: { art: ART.dPost, pal: 'wood', flags: F.SOLID | F.HOOKABLE, underArt: 'sand' },
    digSpot: { art: ART.digSpot, pal: 'sand', flags: F.SLOW },
    dSwitchUp: { art: ART.dSwitchUp, pal: 'brick', flags: F.SWITCHF },
    dSwitchDown: { art: ART.dSwitchDown, pal: 'brick' },
    dBlock: { art: ART.dBlock, pal: 'stone', flags: F.SOLID },
    dWaterS: { art: ART.waterS0, pal: 'water', flags: F.WATER, anim: ['waterS0', 'waterS1', 'waterS2', 'waterS1'], animRate: 11 },
    dWaterD: { art: ART.waterD0, pal: 'deep', flags: F.DEEP, anim: ['waterD0', 'waterD1', 'waterD2', 'waterD1'], animRate: 13 },

    // Dungeon tide tiles: the same three-state trick indoors.
    dSluice: { tide: ['dFloorWet', 'dWaterS', 'dWaterD'] },
    dBasin: { tide: ['dFloor', 'dFloorWet', 'dWaterS'] },
    dWell: { tide: ['dWaterS', 'dWaterD', 'dWaterD'] },
    dDrain: { tide: ['dPit', 'dWaterS', 'dWaterD'] },
  };
  registerTiles(TILE_DEFS);

  // Rooms draw a tile by its *tile* name, but the art above is keyed by art
  // name — so every palette-swap tile (grassDark reusing ART.grass, treeDark
  // reusing ART.tree, and the rest) had no entry to find and rendered as a
  // placeholder box. Alias each tile name to the art it declared.
  const aliases = {};
  for (const [name, def] of Object.entries(TILE_DEFS)) {
    if (def && def.art && !(name in ART)) aliases[name] = def.art;
  }
  tileSheet.add(aliases, 'stone');

  // What each tile becomes when acted upon. `persist: true` survives leaving the
  // room, which is right for walls you blew open and wrong for bushes.
  registerTransforms({
    bush: { cut: 'grass', bomb: 'grass', fire: 'grass', fx: 'cut', drop: 'common', sfx: 'cut' },
    bushSand: { cut: 'sand', bomb: 'sand', fire: 'sand', fx: 'cut', drop: 'common', sfx: 'cut' },
    tallgrass: { cut: 'grass', fire: 'grass', fx: 'cut', drop: 'hearts', sfx: 'cut' },
    flowers: { cut: 'grass', fx: 'cut', sfx: 'cut' },
    rock: { lift: 'grass', drop: 'common' },
    rockSand: { lift: 'sand', drop: 'common' },
    pot: { lift: 'dFloor', drop: 'common' },
    sign: { cut: 'sign' },
    dWallCracked: { bomb: 'dFloor', fx: 'boom', persist: true, sfx: 'break' },
    cliffCracked: { bomb: 'sand', fx: 'boom', persist: true, sfx: 'break' },
    cliffCrackedDk: { bomb: 'mud', fx: 'boom', persist: true, sfx: 'break' },
    dFloorCrack: { bomb: 'dPit', fx: 'boom', persist: true, sfx: 'break' },
    digSpot: { dig: 'sand', drop: 'common' },
    sandDeep: { dig: 'sand' },
    mud: { dig: 'mud' },
  });
}

export { ART as CORE_TILE_ART };
