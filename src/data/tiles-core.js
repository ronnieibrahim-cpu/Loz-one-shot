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

  // A boulder: deliberately bigger and rounder than `rock`, and drawn to the
  // tile edge on all four sides, so a player can tell at a glance that it is
  // not the ordinary liftable rock standing next to it.
  boulder: `
    ......3333......
    ....33111133....
    ..331111111133..
    .33111111111133.
    3311011111111133
    3110111111111233
    3101111111112233
    3011111111122233
    3011111111222233
    3011111112222233
    3011111122222233
    .30111122222233.
    .33012222222233.
    ..332222222233..
    ....33222233....
    ......3333......`,

  // ---- props (transparent, need underArt) ---------------------------------
  // A whole tree in ONE cell, because the game's rooms place trees one cell at
  // a time — 643 of its vertical tree runs are a single row tall. Every tree in
  // every Oracle sheet is 32x32, so this is drawn to match rather than
  // extracted: the source's silhouette (light crown, scalloped foliage line,
  // flared trunk) at the size the map actually uses. Index 2 is the trunk, so
  // it needs a palette with wood in it — see `treeoak` in gfx/palettes.js.
  tree: `
    ....33333333....
    ..333300003333..
    .33000000000033.
    3300000000000033
    3000000000000003
    3001100000011003
    3011110000111103
    3111111001111113
    3111111111111113
    .33111111111133.
    ..333322223333..
    ....33222233....
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

  // The lip of a one-way drop, facing south. The old art was two dark bands and
  // read as a painted line on the floor rather than an edge you can fall off.
  //
  // Three things make a drop read in a top-down game, and the tile needs all
  // three: a *lit* top edge catching the light, a face tall enough to be a
  // height rather than a border, and a shadow that falls onto the ground below.
  // The face is nine rows here — a thin one is what made the first attempt
  // vanish into the Drowned Wood's greens.
  //
  // Both ends are transparent on purpose. The top two rows let the room's own
  // ground run right up to the brink, so the lip sits flush with whatever
  // terrain is above it instead of stamping a strip of some other colour there;
  // the bottom two let the ground at the foot of the drop show through the
  // ragged shadow fringe, which is what sells the two levels as different
  // heights. `underArt` is what shows in both.
  ledgeS: `
    ................
    ................
    0000000000000000
    0000000000000000
    2222222222222222
    2222322222232222
    2223322222233222
    2222322222232222
    3222322223232222
    3222222223232223
    3232333323333233
    3333333333333333
    3333333333333333
    .33.33333.333.3.
    ................
    ................`,

  // The two region gates. Both must read as MECHANISMS rather than terrain —
  // a player who cannot tell a lock from a rock just concludes the region is
  // scenery and stops looking for the way in.
  //
  // A salt vane: a bladed crossbar on a post, struck by the Magic Boomerang.
  // The blade is the widest thing on the tile so a run of them reads as a line
  // of machinery across the pass rather than a fence.
  saltVane: `
    ................
    ................
    ..333333333333..
    ..311111111113..
    ..312222222213..
    ..311111111113..
    ..333333333333..
    ......3113......
    ......3113......
    ......3113......
    ......3113......
    ......3113......
    ....33333333....
    ....31111113....
    ....32222223....
    ....33333333....`,

  // An iron plug: a riveted plate the Magnetic Gloves haul out of the socket.
  // Four corner rivets and a square bolt head, all in hard 1px dark, so it
  // reads as worked metal. It takes `rust`, not a grey: the abyss is blue-grey
  // stone throughout, and a grey plate sank into it in the first pass.
  abyssPlug: `
    3333333333333333
    3111111111111113
    3122222222222233
    3123132222313233
    3121032222103233
    3123332222333233
    3122223333222233
    3122223013222233
    3122223113222233
    3122223333222233
    3123132222313233
    3121032222103233
    3123332222333233
    3122222222222233
    3133333333333333
    3333333333333333`,

  // The other three faces. `tryLedgeHop` has always handled all four cardinals
  // and every legend only ever declared the south one, so ledgeN/E/W are a
  // tile-data gap, not an engine one.
  //
  // East and west are the south lip rotated a quarter turn, which keeps the
  // speckle and the 2/3 face weight identical rather than re-inventing them:
  // two transparent columns on the high side, the lit brink, the face darkening
  // across the tile, and the ragged fringe where the shadow meets the ground
  // below. Rotating puts the light on the high side of the drop in both, which
  // is what makes them read as the same cliff seen from a different side.
  ledgeE: `
    ..00222223333...
    ..002222223333..
    ..00222222233...
    ..002232223333..
    ..002333333333..
    ..002222223333..
    ..00222233333...
    ..002222222333..
    ..002222223333..
    ..002222223333..
    ..002222223333..
    ..002333323333..
    ..00223222233...
    ..002222223333..
    ..002222222333..
    ..00222233333...`,

  ledgeW: `
    ...33333222200..
    ..333222222200..
    ..333322222200..
    ...33222232200..
    ..333323333200..
    ..333322222200..
    ..333322222200..
    ..333322222200..
    ..333222222200..
    ...33333222200..
    ..333322222200..
    ..333333333200..
    ..333322232200..
    ...33222222200..
    ..333322222200..
    ...33332222200..`,

  // North is NOT the south lip flipped. A drop that faces away from the camera
  // shows almost no face — you are standing on the high ground looking over the
  // brink, and the nine-row wall that sells `ledgeS` would read as a dark stripe
  // painted across the floor. So the face is six rows, not nine, and the order
  // top to bottom is: the ground beyond the drop, the shadow the cliff casts
  // into it, then the lit brink of the ground you are standing on.
  ledgeN: `
    ................
    ................
    ................
    ................
    ................
    ................
    .33.33333.333.3.
    3333333333333333
    3333333333333333
    3232333323333233
    2222322222232222
    2222222222222222
    2222222222222222
    0000000000000000
    0000000000000000
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
    // The extracted `flowers` is a transparent prop rather than a filled ground
    // tile, so it needs a base drawn under it like `bush` and `rock` do. Still
    // walkable, and still cuts down to plain grass (see TRANSFORMS below).
    flowers: { art: ART.flowers, pal: 'grass', underArt: 'grass' },
    flowersDark: { art: ART.flowers, pal: 'grassdk', underArt: 'grassDark' },
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

    // --- riptides ---------------------------------------------------------
    // Deep water that moves. `push` is px/f and is applied to anything
    // SWIMMING on it (Player.updateTerrain); a walker on the seafloor in sink
    // mode is not touched by it, which is the trade the Kelp-Soled Cleats
    // exist to offer. See docs/ITEMS.md.
    //
    // No new art: a riptide is `waterD` running its own animation faster, in
    // the same palette. The source games signal a current by how the water
    // moves, not by a different blue, and inventing a "current tile" drawing
    // would be exactly the hand-drawn drift ART-DIRECTION warns about.
    riptideN: { art: ART.waterD0, pal: 'deep', flags: F.DEEP, push: [0, -0.55], anim: ['waterD0', 'waterD1', 'waterD2', 'waterD1'], animRate: 6 },
    riptideS: { art: ART.waterD0, pal: 'deep', flags: F.DEEP, push: [0, 0.55], anim: ['waterD0', 'waterD1', 'waterD2', 'waterD1'], animRate: 6 },
    riptideE: { art: ART.waterD0, pal: 'deep', flags: F.DEEP, push: [0.55, 0], anim: ['waterD0', 'waterD1', 'waterD2', 'waterD1'], animRate: 6 },
    riptideW: { art: ART.waterD0, pal: 'deep', flags: F.DEEP, push: [-0.55, 0], anim: ['waterD0', 'waterD1', 'waterD2', 'waterD1'], animRate: 6 },

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
    // A race: wadeable at LOW, and a running current above it. Passability is
    // identical to `dWell` at every level, so a run of these can be dropped
    // into an authored room without changing where anything can go — the only
    // difference is that a SWIMMER on it is carried and a walker on the
    // seafloor is not. That is the Kelp-Soled Cleats' whole trade.
    dRaceE: { tide: ['dWaterS', 'riptideE', 'riptideE'] },
    dRaceW: { tide: ['dWaterS', 'riptideW', 'riptideW'] },

    // --- Reefseed coral ---------------------------------------------------
    // What a Reefseed grows into. One tile, three lives:
    //
    //   LOW    a low step you walk over — a pillar grown in water is a bridge
    //          once the water leaves
    //   MID    a wall, chest high — it blocks a charge and a line of fire
    //   HIGH   submerged; you swim over it, and the Resonance Rod can ring it
    //
    // No new art. `rock` in the coral palette is the pillar and `waterD` is it
    // drowned, which is the same trick `grassDark` and `cliffCoral` already
    // use: ART-DIRECTION says extract rather than draw, and where no sheet has
    // the thing, reusing art the sheets DID supply beats inventing a look for
    // it. What tells the three states apart is the flags, not the drawing.
    coralStep: { art: ART.rockFloor, pal: 'coral' },
    coralWall: { art: ART.rock, pal: 'coral', flags: F.SOLID | F.RING },
    coralSunk: { art: ART.waterD0, pal: 'coral', flags: F.DEEP | F.RING, anim: ['waterD0', 'waterD1', 'waterD2', 'waterD1'], animRate: 13 },
    coralPillar: { tide: ['coralStep', 'coralWall', 'coralSunk'] },

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
    // The two region gates GAME-PLAN.md asks for. The Marsh gate proved the
    // shape — a solid tile with a flag, plus a transform naming what opens it —
    // and these two only add `level`, so the gate can name the MAGIC boomerang
    // rather than any boomerang.
    saltVane: { art: ART.saltVane, pal: 'marble', flags: F.SOLID | F.VANE, underArt: 'saltFlat' },
    abyssPlug: { art: ART.abyssPlug, pal: 'rust', flags: F.SOLID | F.MAGNETIC, underArt: 'rockFloorDk' },

    // ---- the four terrain-shaped region gates ------------------------------
    // Each carries TWO flags: the ordinary one that tells the engine what the
    // tile physically is, and a marker naming the item that gets you past it.
    // The engine already knows how to cross all of these — `Room.solidAt` lets
    // a jumping player through JUMPABLE and a swimming one through DEEP — so
    // none of this needed an engine change. The marker is purely so a checker
    // can tell "gated on the Hookshot" from "unreachable".
    //
    // WIDTH IS PART OF THE GATE for three of them, and no flag can express it:
    // a jumping player crosses DEEP as well as JUMPABLE, so a one-tile channel
    // is not a Flippers gate, and a one-tile chasm is not a Hookshot gate.
    // `tools/check-gates.mjs` measures the reach in-engine rather than trusting
    // this comment; the widths it proved are recorded there.
    chasm: {
      art: ART.dPit, pal: 'abyss', flags: F.JUMPABLE | F.GAP,
    },
    boulder: {
      art: ART.boulder, pal: 'stonedk', flags: F.SOLID | F.ROCK | F.HEAVY,
      underArt: 'rockFloor', liftLevel: 1,
    },
    cliffCrackedDk: { art: ART.cliffCracked, pal: 'stonedk', flags: F.SOLID | F.BOMBABLE },
    treeDead: { art: ART.tree, pal: 'treeoakdd', flags: F.SOLID, underArt: 'grassBog' },
    treeDark: { art: ART.tree, pal: 'treeoakdk', flags: F.SOLID, underArt: 'grassDark' },
    tree: { art: ART.tree, pal: 'treeoak', flags: F.SOLID, underArt: 'grass' },
    treeSand: { art: ART.tree, pal: 'treeoak', flags: F.SOLID, underArt: 'sand' },
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
    // One-way ledges. The art is one tile; what changes per region is the
    // palette and the ground drawn under its transparent top and foot, the same
    // palette-swap trick every cliff variant uses. Without these a ledge in the
    // dunes was a green lip on yellow sand, and the dungeons had no ledge
    // character in their legend at all.
    //
    // Every variant takes its region's CLIFF palette, not its ground palette.
    // A ledge is the lip of a short cliff — exposed rock, not grass seen edge
    // on — and that is also the only choice that guarantees contrast: the first
    // pass gave the Drowned Wood's ledge the region's own `grassdk`, and the
    // drop vanished into the grass it was cut out of.
    ledgeS: { art: ART.ledgeS, pal: 'stone', flags: F.LEDGE, ledge: 'down', underArt: 'grass' },
    ledgeDk: { art: ART.ledgeS, pal: 'stonedk', flags: F.LEDGE, ledge: 'down', underArt: 'grassDark' },
    ledgeSand: { art: ART.ledgeS, pal: 'sand', flags: F.LEDGE, ledge: 'down', underArt: 'sand' },
    ledgeRock: { art: ART.ledgeS, pal: 'stonedk', flags: F.LEDGE, ledge: 'down', underArt: 'rockFloor' },
    ledgeRockDk: { art: ART.ledgeS, pal: 'stonedk', flags: F.LEDGE, ledge: 'down', underArt: 'rockFloorDk' },
    ledgeSalt: { art: ART.ledgeS, pal: 'marble', flags: F.LEDGE, ledge: 'down', underArt: 'saltFlat' },
    ledgeCoral: { art: ART.ledgeS, pal: 'coral', flags: F.LEDGE, ledge: 'down', underArt: 'rockFloorCoral' },
    ledgeAbyss: { art: ART.ledgeS, pal: 'abyss', flags: F.LEDGE, ledge: 'down', underArt: 'rockFloorDk' },
    // Indoors the lip wants contrast against the tan flagstone, so it takes the
    // wall's palette rather than the floor's narrow `stonef` ramp — three
    // near-identical greys would lose the lit top edge entirely.
    dLedge: { art: ART.ledgeS, pal: 'stonedk', flags: F.LEDGE, ledge: 'down', underArt: 'dFloor' },

    // The same nine families facing the other three cardinals. Each keeps its
    // family's palette and `underArt` exactly — only the art and the `ledge`
    // direction change — so a north drop in the dunes is the same rock as the
    // south drop beside it rather than a second, subtly different cliff.
    ledgeN: { art: ART.ledgeN, pal: 'stone', flags: F.LEDGE, ledge: 'up', underArt: 'grass' },
    ledgeE: { art: ART.ledgeE, pal: 'stone', flags: F.LEDGE, ledge: 'right', underArt: 'grass' },
    ledgeW: { art: ART.ledgeW, pal: 'stone', flags: F.LEDGE, ledge: 'left', underArt: 'grass' },

    ledgeDkN: { art: ART.ledgeN, pal: 'stonedk', flags: F.LEDGE, ledge: 'up', underArt: 'grassDark' },
    ledgeDkE: { art: ART.ledgeE, pal: 'stonedk', flags: F.LEDGE, ledge: 'right', underArt: 'grassDark' },
    ledgeDkW: { art: ART.ledgeW, pal: 'stonedk', flags: F.LEDGE, ledge: 'left', underArt: 'grassDark' },

    ledgeSandN: { art: ART.ledgeN, pal: 'sand', flags: F.LEDGE, ledge: 'up', underArt: 'sand' },
    ledgeSandE: { art: ART.ledgeE, pal: 'sand', flags: F.LEDGE, ledge: 'right', underArt: 'sand' },
    ledgeSandW: { art: ART.ledgeW, pal: 'sand', flags: F.LEDGE, ledge: 'left', underArt: 'sand' },

    ledgeRockN: { art: ART.ledgeN, pal: 'stonedk', flags: F.LEDGE, ledge: 'up', underArt: 'rockFloor' },
    ledgeRockE: { art: ART.ledgeE, pal: 'stonedk', flags: F.LEDGE, ledge: 'right', underArt: 'rockFloor' },
    ledgeRockW: { art: ART.ledgeW, pal: 'stonedk', flags: F.LEDGE, ledge: 'left', underArt: 'rockFloor' },

    ledgeRockDkN: { art: ART.ledgeN, pal: 'stonedk', flags: F.LEDGE, ledge: 'up', underArt: 'rockFloorDk' },
    ledgeRockDkE: { art: ART.ledgeE, pal: 'stonedk', flags: F.LEDGE, ledge: 'right', underArt: 'rockFloorDk' },
    ledgeRockDkW: { art: ART.ledgeW, pal: 'stonedk', flags: F.LEDGE, ledge: 'left', underArt: 'rockFloorDk' },

    ledgeSaltN: { art: ART.ledgeN, pal: 'marble', flags: F.LEDGE, ledge: 'up', underArt: 'saltFlat' },
    ledgeSaltE: { art: ART.ledgeE, pal: 'marble', flags: F.LEDGE, ledge: 'right', underArt: 'saltFlat' },
    ledgeSaltW: { art: ART.ledgeW, pal: 'marble', flags: F.LEDGE, ledge: 'left', underArt: 'saltFlat' },

    ledgeCoralN: { art: ART.ledgeN, pal: 'coral', flags: F.LEDGE, ledge: 'up', underArt: 'rockFloorCoral' },
    ledgeCoralE: { art: ART.ledgeE, pal: 'coral', flags: F.LEDGE, ledge: 'right', underArt: 'rockFloorCoral' },
    ledgeCoralW: { art: ART.ledgeW, pal: 'coral', flags: F.LEDGE, ledge: 'left', underArt: 'rockFloorCoral' },

    ledgeAbyssN: { art: ART.ledgeN, pal: 'abyss', flags: F.LEDGE, ledge: 'up', underArt: 'rockFloorDk' },
    ledgeAbyssE: { art: ART.ledgeE, pal: 'abyss', flags: F.LEDGE, ledge: 'right', underArt: 'rockFloorDk' },
    ledgeAbyssW: { art: ART.ledgeW, pal: 'abyss', flags: F.LEDGE, ledge: 'left', underArt: 'rockFloorDk' },

    dLedgeN: { art: ART.ledgeN, pal: 'stonedk', flags: F.LEDGE, ledge: 'up', underArt: 'dFloor' },
    dLedgeE: { art: ART.ledgeE, pal: 'stonedk', flags: F.LEDGE, ledge: 'right', underArt: 'dFloor' },
    dLedgeW: { art: ART.ledgeW, pal: 'stonedk', flags: F.LEDGE, ledge: 'left', underArt: 'dFloor' },

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
    dPost: { art: ART.dPost, pal: 'stone', flags: F.SOLID | F.SNAG, underArt: 'dFloor' },
    post: { art: ART.dPost, pal: 'wood', flags: F.SOLID | F.SNAG, underArt: 'grass' },
    postSand: { art: ART.dPost, pal: 'wood', flags: F.SOLID | F.SNAG, underArt: 'sand' },
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
    flowersDark: { cut: 'grassDark', fx: 'cut', sfx: 'cut' },
    rock: { lift: 'grass', drop: 'common' },
    rockSand: { lift: 'sand', drop: 'common' },
    pot: { lift: 'dFloor', drop: 'common' },
    sign: { cut: 'sign' },
    dWallCracked: { bomb: 'dFloor', fx: 'boom', persist: true, sfx: 'break' },
    cliffCracked: { bomb: 'sand', fx: 'boom', persist: true, sfx: 'break' },
    boulder: {
      lift: 'rockFloor', drop: 'none', persist: true,
      deny: 'Far too heavy to shift bare-handed.',
    },
    cliffCrackedDk: { bomb: 'mud', fx: 'boom', persist: true, sfx: 'break' },
    saltVane: {
      boomerang: 'saltFlat', level: 2, fx: 'cut', persist: true, sfx: 'break',
      deny: 'The vane is set too far to reach. Something must strike it and come back.',
    },
    abyssPlug: {
      magnet: 'rockFloorDk', fx: 'spark', persist: true, sfx: 'magnet',
      deny: 'Iron, sunk deep. Nothing here will shift it by hand.',
    },
    dFloorCrack: { bomb: 'dPit', fx: 'boom', persist: true, sfx: 'break' },
    digSpot: { dig: 'sand', drop: 'common' },
    sandDeep: { dig: 'sand' },
    mud: { dig: 'mud' },
  });
}

export { ART as CORE_TILE_ART };
