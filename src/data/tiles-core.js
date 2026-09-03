// Core tile art: the universal tiles used by every region. Regional and dungeon
// tile packs extend this set. See gfx/art.js for the pixel grammar and
// world/tileset.js for the tile-definition contract.
//
// All background tiles are exactly 16x16. Tiles with transparent pixels declare
// `underArt` so a base tile is drawn beneath them.

import { tiles as tileSheet } from '../gfx/art.js';
import { registerTiles, registerBlocks, F, declareAnimArt, registerTransforms } from '../world/tileset.js';
import { TERRAIN_ART, TOWN_ART, TOWN_PALETTES, TOWN_BLOCKS } from './tiles-terrain.js';
import { registerPalettes } from '../gfx/palettes.js';
import { DUNGEON_THEME_ART, installDungeonThemePalettes } from './tiles-dungeon-themes.js';
import { TORRENT_PUSH } from './feel.js';

const HAND_ART = {
  // ---- ground -------------------------------------------------------------
  //
  // `grass` USED TO BE HERE and is gone: it is extracted now, from Seasons'
  // own field grass, by tools/rip-terrain.py. It was a flat field of one tone
  // with fourteen dark speckles in a fixed constellation, and repeated across a
  // screen that constellation was the visible grid — a regular lattice of dots
  // on a 16-pixel pitch. It is retired rather than kept as a fallback because
  // `R5` says extract what a sheet has, and a hand-drawn tile left next to the
  // extracted one that replaced it is how the two slowly diverge.

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

  // The same boulder with a fault line zigzagging down through it, so a
  // bombable boulder reads as cracked at a glance without leaving the terrain
  // register — the same trick, and the same grammar, as `cliffCracked`. The
  // silhouette is byte-identical to `boulder`: only interior pixels turn to
  // outline, so the two sit in one rockfall without either looking redrawn.
  boulderCracked: `
    ......3333......
    ....33113133....
    ..331111311133..
    .33111131111133.
    3311011311111133
    3110111131111233
    3101111131112233
    3011111311122233
    3011111311222233
    3011113112222233
    3011113122222233
    .30111322222233.
    .33012322222233.
    ..332223222233..
    ....33232233....
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

  // SUPERSEDED by the extracted pot in tiles-terrain.js (Seasons' own dungeon
  // pots, `rip-terrain.py` PROPS). Kept the way `sand` and `mud` are kept, as
  // the fallback if that pick is ever pulled — but do not edit it and do not
  // read it as what the game draws. What it was, and why it had to go: a brown
  // SPHERE. A circle with a highlight, no lip, no shoulder, no base. A Zelda
  // pot is read at a glance by its RIM, and in 21 placements across the
  // dungeons this one read as a polished boulder.
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



  // --------------------------------------------------------------------------
  // THE SIX DUNGEON DOORS.
  //
  // A dungeon was entered through the same cave arch as a grotto, so nothing on
  // the overworld said which holes in the rock were the six places the game is
  // actually about. These are carved gates, 32x32, cut into four quadrants and
  // stood up by `installDungeonPortals` as 2x2 blocks — the same machinery the
  // town's buildings use.
  //
  // THE GRAMMAR IS THE SOURCE'S AND THE BUILDING IS OURS. Every carved door in
  // Holodrum and Labrynna stacks the same four things: a crown that breaks the
  // top line so the shape is not a box, a cornice that overhangs, a frieze
  // carrying one plaque, and two pillars either side of a black arch. What is
  // ours is what is ON the plaque — each dungeon's own argument with the tide,
  // the one from docs/DUNGEON-STATUS.md — and the ramp it is cut in, which is
  // its region's rock with a near-black at index 3 so the doorway is a hole
  // rather than a dark brown rectangle.
  //
  // The gaps between the crown's merlons are transparent, so the cliff each
  // gate is set into shows through them. That is the whole reason the crown is
  // there: it is what stops a 32x32 slab from reading as a slab.
  //
  // Drawn rather than extracted because no sheet has these doors — they are
  // six dungeons the source games never had. Read ART-DIRECTION.md before
  // touching them: three colours plus transparency, a hard 1px outline, no
  // dithering, and they have to sit beside extracted terrain without betraying
  // which is which.
  // Tidewash Grotto — the sea goes down its throat
  portalD1TL: `
    ..333333....3333
    ..300003....3000
    ..311113....3111
    ..311113....3111
    .333333333333333
    3000000000000000
    3222222222222222
    3001111113333333
    3001111113200000
    3001111113200000
    3001111113220000
    3001111113222000
    3001111113222200
    3001111113222220
    3001111113222220
    3001111113333333`,
  portalD1TR: `
    3333....333333..
    0003....300003..
    1113....311113..
    1113....311113..
    333333333333333.
    0000000000000003
    2222222222222223
    3333333111111223
    0000023111111223
    0000023111111223
    0000223111111223
    0002223111111223
    0022223111111223
    0222223111111223
    0222223111111223
    3333333111111223`,
  portalD1BL: `
    3333333333333333
    3000000000000000
    3100111122111333
    3100111122113333
    3100111122133333
    3100111122333333
    3100111122333333
    3100111122333333
    3100111122333333
    3100111122333333
    3100111122333333
    3100111122333333
    3100111122333333
    3100111122333333
    3222222222333333
    .333333333333333`,
  portalD1BR: `
    3333333333333333
    0000000000000003
    3331110011112213
    3333110011112213
    3333310011112213
    3333330011112213
    3333330011112213
    3333330011112213
    3333330011112213
    3333330011112213
    3333330011112213
    3333330011112213
    3333330011112213
    3333330011112213
    3333332222222223
    333333333333333.`,

  // Coral Spire — the sea carries you up it
  portalD2TL: `
    ..333333....3333
    ..300003....3000
    ..311113....3111
    ..311113....3111
    .333333333333333
    3000000000000000
    3222222222222222
    3001111113333333
    3001111113222220
    3001111113222200
    3001111113222000
    3001111113220002
    3001111113200222
    3001111113222220
    3001111113222220
    3001111113333333`,
  portalD2TR: `
    3333....333333..
    0003....300003..
    1113....311113..
    1113....311113..
    333333333333333.
    0000000000000003
    2222222222222223
    3333333111111223
    0222223111111223
    0022223111111223
    0002223111111223
    2000223111111223
    2220023111111223
    0222223111111223
    0222223111111223
    3333333111111223`,
  portalD2BL: `
    3333333333333333
    3000000000000000
    3100111122111333
    3100111122113333
    3100111122133333
    3100111122333333
    3100111122333333
    3100111122333333
    3100111122333333
    3100111122333333
    3100111122333333
    3100111122333333
    3100111122333333
    3100111122333333
    3222222222333333
    .333333333333333`,
  portalD2BR: `
    3333333333333333
    0000000000000003
    3331110011112213
    3333110011112213
    3333310011112213
    3333330011112213
    3333330011112213
    3333330011112213
    3333330011112213
    3333330011112213
    3333330011112213
    3333330011112213
    3333330011112213
    3333330011112213
    3333332222222223
    333333333333333.`,

  // Bogwater Sanctum — one height, and only one
  portalD3TL: `
    ..333333....3333
    ..300003....3000
    ..311113....3111
    ..311113....3111
    .333333333333333
    3000000000000000
    3222222222222222
    3001111113333333
    3001111113222222
    3001111113200000
    3001111113200000
    3001111113222222
    3001111113200000
    3001111113200000
    3001111113222222
    3001111113333333`,
  portalD3TR: `
    3333....333333..
    0003....300003..
    1113....311113..
    1113....311113..
    333333333333333.
    0000000000000003
    2222222222222223
    3333333111111223
    2222223111111223
    0000023111111223
    0000023111111223
    2222223111111223
    0000023111111223
    0000023111111223
    2222223111111223
    3333333111111223`,
  portalD3BL: `
    3333333333333333
    3000000000000000
    3100111122111333
    3100111122113333
    3100111122133333
    3100111122333333
    3100111122333333
    3100111122333333
    3100111122333333
    3100111122333333
    3100111122333333
    3100111122333333
    3100111122333333
    3100111122333333
    3222222222333333
    .333333333333333`,
  portalD3BR: `
    3333333333333333
    0000000000000003
    3331110011112213
    3333110011112213
    3333310011112213
    3333330011112213
    3333330011112213
    3333330011112213
    3333330011112213
    3333330011112213
    3333330011112213
    3333330011112213
    3333330011112213
    3333330011112213
    3333332222222223
    333333333333333.`,

  // Cliffside Cistern — the keyhole the water turns
  portalD4TL: `
    ..333333....3333
    ..300003....3000
    ..311113....3111
    ..311113....3111
    .333333333333333
    3000000000000000
    3222222222222222
    3001111113333333
    3001111113222200
    3001111113222000
    3001111113222000
    3001111113222200
    3001111113222200
    3001111113222000
    3001111113220000
    3001111113333333`,
  portalD4TR: `
    3333....333333..
    0003....300003..
    1113....311113..
    1113....311113..
    333333333333333.
    0000000000000003
    2222222222222223
    3333333111111223
    0022223111111223
    0002223111111223
    0002223111111223
    0022223111111223
    0022223111111223
    0002223111111223
    0000223111111223
    3333333111111223`,
  portalD4BL: `
    3333333333333333
    3000000000000000
    3100111122111333
    3100111122113333
    3100111122133333
    3100111122333333
    3100111122333333
    3100111122333333
    3100111122333333
    3100111122333333
    3100111122333333
    3100111122333333
    3100111122333333
    3100111122333333
    3222222222333333
    .333333333333333`,
  portalD4BR: `
    3333333333333333
    0000000000000003
    3331110011112213
    3333110011112213
    3333310011112213
    3333330011112213
    3333330011112213
    3333330011112213
    3333330011112213
    3333330011112213
    3333330011112213
    3333330011112213
    3333330011112213
    3333330011112213
    3333332222222223
    333333333333333.`,

  // Drowned Wood Shrine — something that floats
  portalD5TL: `
    ..333333....3333
    ..300003....3000
    ..311113....3111
    ..311113....3111
    .333333333333333
    3000000000000000
    3222222222222222
    3001111113333333
    3001111113222220
    3001111113222220
    3001111113220000
    3001111113222000
    3001111113222222
    3001111113200220
    3001111113222002
    3001111113333333`,
  portalD5TR: `
    3333....333333..
    0003....300003..
    1113....311113..
    1113....311113..
    333333333333333.
    0000000000000003
    2222222222222223
    3333333111111223
    0222223111111223
    0222223111111223
    0000223111111223
    0002223111111223
    2222223111111223
    0220023111111223
    2002223111111223
    3333333111111223`,
  portalD5BL: `
    3333333333333333
    3000000000000000
    3100111122111333
    3100111122113333
    3100111122133333
    3100111122333333
    3100111122333333
    3100111122333333
    3100111122333333
    3100111122333333
    3100111122333333
    3100111122333333
    3100111122333333
    3100111122333333
    3222222222333333
    .333333333333333`,
  portalD5BR: `
    3333333333333333
    0000000000000003
    3331110011112213
    3333110011112213
    3333310011112213
    3333330011112213
    3333330011112213
    3333330011112213
    3333330011112213
    3333330011112213
    3333330011112213
    3333330011112213
    3333330011112213
    3333330011112213
    3333332222222223
    333333333333333.`,

  // Abyssal Keep — the seal Nereth set across the road
  portalD6TL: `
    ..333333....3333
    ..300003....3000
    ..311113....3111
    ..311113....3111
    .333333333333333
    3000000000000000
    3222222222222222
    3001111113333333
    3001111113202220
    3001111113220200
    3001111113222000
    3001111113200020
    3001111113222000
    3001111113220200
    3001111113202220
    3001111113333333`,
  portalD6TR: `
    3333....333333..
    0003....300003..
    1113....311113..
    1113....311113..
    333333333333333.
    0000000000000003
    2222222222222223
    3333333111111223
    0222023111111223
    0020223111111223
    0002223111111223
    0200023111111223
    0002223111111223
    0020223111111223
    0222023111111223
    3333333111111223`,
  portalD6BL: `
    3333333333333333
    3000000000000000
    3100111122111333
    3100111122113333
    3100111122133333
    3100111122333333
    3100111122333333
    3100111122333333
    3100111122333333
    3100111122333333
    3100111122333333
    3100111122333333
    3100111122333333
    3100111122333333
    3222222222333333
    .333333333333333`,
  portalD6BR: `
    3333333333333333
    0000000000000003
    3331110011112213
    3333110011112213
    3333310011112213
    3333330011112213
    3333330011112213
    3333330011112213
    3333330011112213
    3333330011112213
    3333330011112213
    3333330011112213
    3333330011112213
    3333330011112213
    3333332222222223
    333333333333333.`,

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
  // A salt vane: a bladed crossbar on a post, rung open by the Resonance Rod.
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

  // The Keep's seal: a riveted iron plate bolted across the road down. Four
  // corner rivets and a square bolt head, all in hard 1px dark, so it reads as
  // worked metal. It takes `rust`, not a grey: the abyss is blue-grey stone
  // throughout, and a grey plate sank into it in the first pass.
  //
  // It used to be `abyssPlug`, hauled out by the Dredge Line. Nothing hauls it
  // now — the Maku Tree's roots split it when the fifth Essence lands — so the
  // name says what it is rather than what used to move it.
  keepSeal: `
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

  // THE BODY OF AN OVERWORLD GAP: no border of its own, and no shading at the
  // top either. A single darker row per cell looked like depth in the art and
  // rendered as a RUNG every sixteen pixels down a vertical run, which reads as
  // four separate holes rather than one. `dPit` (below) keeps its frame because
  // a dungeon pit is a single cell cut into a brick floor.
  chasmBody: `
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

  // ...and its FAR LIP, drawn only by the cells whose northern neighbour is not
  // also a gap — the same `family` + `edgeArt` mechanism the cliffs use, and
  // the reason a vertical run of four gets one lip instead of four rungs.
  chasmTop: `
    0000000000000000
    1111111111111111
    1111111111111111
    2222222222222222
    2222222222222222
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

  siltFloor: `
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

  // THE SAME MARK, WITH NOTHING BEHIND IT. `digSpot` fills its cell with a flat
  // mid-sand, so a spade mark on a dithered beach was a hard tan RECTANGLE with
  // two rings in it — the tile boundary visible from across the screen. The
  // rings alone, over whatever the room is actually made of, is what the source
  // draws. The opaque one stays for the dungeon silt floors, which ARE ground.
  digSpot: `
    ................
    .....3333.......
    ...22..223......
    ..32.....22.....
    ..2.......32....
    ...2.....22.....
    ....3222........
    ................
    ................
    ........333.....
    ......322..3....
    .....32....23...
    .....2......2...
    ......32222.....
    ................
    ................`,

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
const ART = { ...HAND_ART, ...TERRAIN_ART, ...DUNGEON_THEME_ART, ...TOWN_ART };

// --------------------------------------------------------------------------
// THE TOWN KIT: what each extracted building DOES.
//
// The art, the cell layout and the palettes are generated (tools/rip-terrain.py
// -> tiles-terrain.js). This table is the half that is design rather than
// extraction, and it is small on purpose:
//
//   entrance  the cell that is a doorway. It carries F.WARP and is the tile a
//             room's `warps` list names; every other cell is SOLID. Exactly
//             the flags `caveMouth` has carried since the first cave, down to
//             `mask: 0` — SOLID so nothing spawns or is thrown into a doorway,
//             mask 0 so the player can walk in.
//   ground    the tile drawn UNDER the block. Every cell of the kit has
//             transparency at its edges — that is what makes a roof's rounded
//             corner show the region's own grass instead of a nub of Subrosian
//             dirt — so a block placed on grass and the same block placed on
//             sand are different tiles. Hence the variants: `bShop` stands on
//             grass, `bShopSand` on sand, `bShopPaved` on the village square.
//             Their ART is the same art; only what shows through changes.
//
// A shuttered house has no entrance and is solid throughout. That is not a
// flag on an ordinary house — it is a different building with a closed door
// drawn on it, because the player has to be able to see which doors open.
const TOWN_ENTRANCE = {
  bShop: [1, 2],
  bHouseGreen: [1, 2],
  bHouseRed: [1, 2],
};
const TOWN_GROUNDS = { '': 'grass', Sand: 'sand' };


// --------------------------------------------------------------------------
// THE SIX DUNGEON DOORS, stood up as 2x2 blocks.
//
// One per dungeon, one per region, because each region holds exactly one:
// dunes/d1, coral/d2, marsh/d3, cliffs/d4, wood/d5, abyss/d6. That is why the
// legends can all spell the door `D` and each mean its own — a room grid says
// what it is, and where it is says which.
//
// The bottom two cells are the doorway and carry F.WARP with `mask: 0`, the
// same flags a cave mouth has had since the first cave: SOLID so nothing
// spawns or is thrown into a doorway, mask 0 so the player can walk in. BOTH
// halves warp. A two-tile door whose right half is scenery is a door the
// player bumps into, and the arch is drawn across the seam.
//
// `ground` is what shows through the chamfered corners and the gaps in the
// crown. It is the tile the room actually has beside the gate, not the one the
// region is named after — see `Room.underGround` for the same problem one
// scale down.
const PORTALS = {
  portalD1: { pal: ['#e8d0a0', '#c0a068', '#8c6c40', '#241810'], ground: 'sand' },
  portalD2: { pal: ['#f0b0c8', '#c86888', '#8c3858', '#1c0c14'], ground: 'sandCoral' },
  portalD3: { pal: ['#d8d8a8', '#a0a870', '#687044', '#101408'], ground: 'mud' },
  portalD4: { pal: ['#d8dcd0', '#a0a898', '#646c64', '#14181a'], ground: 'sand' },
  portalD5: { pal: ['#d0b890', '#98764c', '#5c4028', '#140c08'], ground: 'sand' },
  portalD6: { pal: ['#8c9cd0', '#4c5c94', '#2c3458', '#06080f'], ground: 'sandRust' },
};

/** Tiledefs and the block registry for the six dungeon doors. */
function installDungeonPortals() {
  const pals = {}, defs = {}, blocks = {};
  for (const [name, p] of Object.entries(PORTALS)) {
    pals[name] = p.pal;
    const tiles = [];
    for (const [qy, row] of [['T', 0], ['B', 1]]) {
      const cells = [];
      for (const qx of ['L', 'R']) {
        const tile = name + qy + qx;
        defs[tile] = {
          art: ART[tile], pal: name, underArt: p.ground,
          flags: row ? F.SOLID | F.WARP : F.SOLID,
          ...(row ? { mask: 0 } : {}),
        };
        cells.push(tile);
      }
      tiles.push(cells);
    }
    blocks[name] = { w: 2, h: 2, tiles };
  }
  registerPalettes(pals);
  registerTiles(defs);
  registerBlocks(blocks);
  return defs;
}

/** Tiledefs for every cell of every block variant, plus the block registry. */
function installTownBlocks() {
  registerPalettes(TOWN_PALETTES);
  // The oak's two halves. Index 2 of the canopy is unused (it has three
  // colours), so it repeats the dark green rather than leaving a hole.
  //
  // The variants are palette swaps of the SAME extracted tree, which is how
  // `treeDark`/`treeDead` already worked and what keeps one piece of art
  // authoritative: a re-rip changes every wood in the game at once. The dark
  // set is the Drowned Wood's colder green, the dead set its bleached brown.
  registerPalettes({
    treeOakTop: ['#93a846', '#546d25', '#546d25', '#000000'],
    treeOakBot: ['#dfd9b5', '#b49d73', '#546d25', '#000000'],
    treeOakDkTop: ['#6c9848', '#3c6830', '#3c6830', '#08160c'],
    treeOakDkBot: ['#c4c4a4', '#8c6c44', '#3c6830', '#08160c'],
    treeOakDdTop: ['#c8b088', '#907048', '#907048', '#20140c'],
    treeOakDdBot: ['#e4dcc4', '#c8b088', '#907048', '#20140c'],
    // The palm's two halves share one palette — see the note in rip-terrain.py.
    palmFrond: ['#a7c947', '#5a9731', '#8c5527', '#000000'],
  });
  const defs = {}, blocks = {};
  for (const [name, b] of Object.entries(TOWN_BLOCKS)) {
    const door = TOWN_ENTRANCE[name] || null;
    for (const [suffix, ground] of Object.entries(TOWN_GROUNDS)) {
      const tiles = [];
      for (let y = 0; y < b.h; y++) {
        const row = [];
        for (let x = 0; x < b.w; x++) {
          const [art, pal] = b.cells[y][x];
          const isDoor = !!door && door[0] === x && door[1] === y;
          // `bShop_1_2` on grass, `bShopSand_1_2` on sand — same art, and the
          // tile named first is the art's own name so nothing has to alias it.
          const tile = suffix ? `${name}${suffix}_${x}_${y}` : art;
          defs[tile] = {
            art: ART[art], pal, underArt: ground,
            flags: isDoor ? F.SOLID | F.WARP : F.SOLID,
            ...(isDoor ? { mask: 0 } : {}),
          };
          row.push(tile);
        }
        tiles.push(row);
      }
      blocks[name + suffix] = { w: b.w, h: b.h, tiles };
    }
  }
  registerTiles(defs);
  registerBlocks(blocks);
  return defs;
}

export function installCoreTiles() {
  // The themed dungeon tiles bring their own colours off the cartridge, and
  // the tiledefs below name them. Must run before registerTiles.
  installDungeonThemePalettes();
  // THE BANK. Installed rather than added to gfx/palettes.js's own hand-tuned
  // ramps for the same reason TOWN_PALETTES is: this is new art with no
  // existing hand-drawn tile to preserve the colours of, so it carries the
  // cartridge's own extracted values — see tools/rip-terrain.py's PICKS note
  // on `bankEdgeS`/`bankCornerSE`. Two palettes, not one, because the straight
  // edges and the outer corners kept different four-colour sets off the
  // source (the corner's window has more rim, less earth) and a tiledef binds
  // exactly one palette.
  registerPalettes({
    bank: ['#20b0f8', '#805000', '#0050b0', '#000000'],
    bankCorner: ['#f8f8c0', '#20b0f8', '#0050b0', '#000000'],
  });
  tileSheet.add(ART, 'stone');
  // Animation frames are art without being tiles in their own right.
  declareAnimArt(Object.keys(ART));

  // Shared by every LAND tile that wants a bank against water — the source
  // draws the same earthen bank under grass and under dune sand alike (see
  // rip-terrain.py's PICKS note), so this is one object every land family
  // below points `edgeArt` at, not one per material.
  const BANK_EDGE_ART = {
    up: 'bankEdgeN', down: 'bankEdgeS', left: 'bankEdgeW', right: 'bankEdgeE',
    cornerUpLeft: 'bankCornerNW', cornerUpRight: 'bankCornerNE',
    cornerDownLeft: 'bankCornerSW', cornerDownRight: 'bankCornerSE',
  };

  const TILE_DEFS = {
    void: { art: ART.void, pal: 'abyss', flags: F.VOID | F.SOLID },

    // --- walkable ground ---
    // GROUND VARIANTS. `variants` names other art this tile may be drawn as;
    // `Room.render` picks with `tileVariant`, a pure hash of the room and the
    // cell (never the RNG stream — see `T2`). Nothing the simulation can see
    // changes: same flags, same palette, same tile.
    //
    // One cell in seven, not an even mix. An even mix of four good candidates
    // was rendered as a whole room and read as a patchwork quilt — worse than
    // the grid it replaced, because each tile is quantised against its own four
    // colours and a tonal seam appears wherever two of them meet. The rate was
    // settled by looking at 1-in-4 (busy), 1-in-7 (a meadow) and 1-in-12
    // (accidental) side by side at room scale.
    // THE SHORE. Land bordering water no longer stops at a flat colour seam —
    // `family`+`edgeAgainst` fire `edgeArt` only when the neighbour actually
    // resolves to 'water' (grass next to sand or mud stays the hard rectangle
    // docs/ART-BACKLOG.md tracks separately; only the land/water join is done).
    // The bank tiles themselves are plain walkable ground — no flags of their
    // own — because they replace grass at the edge cell, not add an obstacle.
    bankEdgeN: { art: ART.bankEdgeN, pal: 'bank' },
    bankEdgeS: { art: ART.bankEdgeS, pal: 'bank' },
    bankEdgeE: { art: ART.bankEdgeE, pal: 'bank' },
    bankEdgeW: { art: ART.bankEdgeW, pal: 'bank' },
    bankCornerNW: { art: ART.bankCornerNW, pal: 'bankCorner' },
    bankCornerNE: { art: ART.bankCornerNE, pal: 'bankCorner' },
    bankCornerSW: { art: ART.bankCornerSW, pal: 'bankCorner' },
    bankCornerSE: { art: ART.bankCornerSE, pal: 'bankCorner' },

    grass: {
      art: ART.grass, pal: 'grass', variants: ['grassClump', 'grassTuft'], variantOdds: 7,
      family: 'grass', edgeAgainst: 'water', edgeArt: BANK_EDGE_ART,
    },
    grassTuft: { art: ART.grassTuft, pal: 'grass' },
    grassClump: { art: ART.grassClump, pal: 'grass' },
    grassDark: { art: ART.grass, pal: 'grassdk', variants: ['grassClump', 'grassTuft'], variantOdds: 7 },
    // The extracted `flowers` is a transparent prop rather than a filled ground
    // tile, so it needs a base drawn under it like `bush` and `rock` do. Still
    // walkable, and still cuts down to plain grass (see TRANSFORMS below).
    flowers: { art: ART.flowers, pal: 'grass', underArt: 'grass' },
    flowersDark: { art: ART.flowers, pal: 'grassdk', underArt: 'grassDark' },
    tallgrass: { art: ART.tallgrass, pal: 'grassdk', flags: F.TALLGRASS },
    sand: {
      art: ART.sand, pal: 'sand', family: 'sand', edgeAgainst: 'water', edgeArt: BANK_EDGE_ART,
    },
    sandWet: { art: ART.sandWet, pal: 'sandwet' },
    sandRipple: {
      art: ART.sandRipple, pal: 'sand', family: 'sand', edgeAgainst: 'water', edgeArt: BANK_EDGE_ART,
    },
    sandDeep: { art: ART.sand, pal: 'sandwet', flags: F.SLOW },
    mud: { art: ART.mud, pal: 'bog', flags: F.SLOW },
    rockFloor: { art: ART.rockFloor, pal: 'stone' },
    rockFloorDk: { art: ART.rockFloor, pal: 'stonedk' },
    // Regional palette variants. Same art, different colours — this is how the
    // GBC games gave each region its own look without redrawing every tile.
    rockFloorRust: { art: ART.rockFloor, pal: 'rust' },
    rockFloorCoral: { art: ART.rockFloor, pal: 'coral' },
    grassBog: { art: ART.grass, pal: 'bog', variants: ['grassClump', 'grassTuft'], variantOdds: 7 },
    grassTuftBog: { art: ART.grassTuft, pal: 'bog' },
    saltFlat: { art: ART.sandRipple, pal: 'marble' },
    saltCrust: { art: ART.sand, pal: 'marble' },
    iceFloor: { art: ART.sandRipple, pal: 'ice', flags: F.ICE },
    sandCoral: { art: ART.sand, pal: 'coral' },
    sandRust: { art: ART.sand, pal: 'rust' },

    // --- water (concrete) ---
    // `family: 'water'` on the ordinary sea/lake water only — reef and abyss
    // water keep their own rocky shoreline treatment (rockFloor) and are
    // deliberately NOT tagged, so grass's bank never tries to grow along a
    // reef edge with the wrong art.
    waterS: { art: ART.waterS0, pal: 'water', flags: F.WATER, family: 'water', anim: ['waterS0', 'waterS1', 'waterS2', 'waterS1'], animRate: 11 },
    waterD: { art: ART.waterD0, pal: 'deep', flags: F.DEEP, family: 'water', anim: ['waterD0', 'waterD1', 'waterD2', 'waterD1'], animRate: 13 },
    waterSReef: { art: ART.waterS0, pal: 'reef', flags: F.WATER, anim: ['waterS0', 'waterS1', 'waterS2', 'waterS1'], animRate: 11 },
    waterDReef: { art: ART.waterD0, pal: 'reef', flags: F.DEEP, anim: ['waterD0', 'waterD1', 'waterD2', 'waterD1'], animRate: 13 },
    waterAbyss: { art: ART.waterD0, pal: 'abyss', flags: F.DEEP, anim: ['waterD0', 'waterD1', 'waterD2', 'waterD1'], animRate: 16 },
    // THE OPEN SEA. Thalassia is an archipelago and had no coastline: the whole
    // rim of the world was cliff, and so was the wall round every one of the
    // 120 screens, which is why solid sits at a flat 33% at every tide while
    // water never reaches 9%. A game about the tide was a walled garden with
    // puddles in it.
    //
    // SOLID AND DEEP TOGETHER, and the order in `tileDefSolid` is the point:
    // SOLID is answered first, so this stops a swimmer as well as a walker.
    // That is what the world's edge has to do — there is no screen out there to
    // swim to — and it is what the source games do with the water past the last
    // screen of Holodrum. Everything else about it is water: it animates, it
    // draws as the deep, and the map screen finally has something other than
    // grey to paint the edge of the world with.
    //
    // It is NOT a substitute for real sea inside the world. Anywhere the player
    // can reach, use `waterD` and let the Flippers mean something.
    openSea: { art: ART.waterD0, pal: 'deep', flags: F.DEEP | F.SOLID, family: 'water', anim: ['waterD0', 'waterD1', 'waterD2', 'waterD1'], animRate: 13 },
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

    // A TORRENT. The same water, running harder: `TORRENT_PUSH` is strictly
    // greater than a swimmer's own speed, so nobody on the surface makes
    // headway against one — while sink mode, which no current touches, walks
    // straight through. That inequality is what makes the Bogwater Sanctum's
    // rooms require the Cleats' floor mode rather than merely the Cleats, and
    // tools/check-cleats.mjs proves it by reading both numbers out of feel.js.
    // An ordinary riptide is deliberately weaker than swimming and stays that
    // way; it is a tax, and this is a wall.
    //
    // No new art, for the same reason the riptides have none: the source games
    // signal a current by how the water moves, not by a different blue. The
    // faster `animRate` is the tell, and it is the only one.
    dTorrentN: { art: ART.waterD0, pal: 'deep', flags: F.DEEP, push: [0, -TORRENT_PUSH], anim: ['waterD0', 'waterD1', 'waterD2', 'waterD1'], animRate: 4 },
    dTorrentS: { art: ART.waterD0, pal: 'deep', flags: F.DEEP, push: [0, TORRENT_PUSH], anim: ['waterD0', 'waterD1', 'waterD2', 'waterD1'], animRate: 4 },
    dTorrentE: { art: ART.waterD0, pal: 'deep', flags: F.DEEP, push: [TORRENT_PUSH, 0], anim: ['waterD0', 'waterD1', 'waterD2', 'waterD1'], animRate: 4 },
    dTorrentW: { art: ART.waterD0, pal: 'deep', flags: F.DEEP, push: [-TORRENT_PUSH, 0], anim: ['waterD0', 'waterD1', 'waterD2', 'waterD1'], animRate: 4 },

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

    // --- metal the Resonance Rod answers ----------------------------------
    // A grate is a wall until it is rung, and then it is not. Reusing the
    // dungeon block art in a bronze ramp rather than drawing a new one: the
    // thing that says "metal" here is that the Rod moves it and nothing else
    // does, which the player learns in one room.
    grate: { art: ART.dBlock, pal: 'rust', flags: F.SOLID | F.RING, underArt: 'dFloor' },
    grateOpen: { art: ART.dFloor, pal: 'brickf' },
    grateOw: { art: ART.dBlock, pal: 'rust', flags: F.SOLID | F.RING, underArt: 'rockFloor' },
    grateOwOpen: { art: ART.rockFloor, pal: 'stone' },

    // --- barriers ---
    // EVERY CLIFF IN THE GAME IS THE SAME MASS, whatever palette it wears, and
    // that is what `family` says. A region boundary where `cliffDk` meets
    // `cliff` is one hillside in two lights, not two hillsides, and without the
    // shared family a lip would be drawn down the seam between them.
    //
    // `edgeArt` is what makes a cliff read as a cliff. `cliffTop` was placed
    // ZERO times in the whole overworld — 1,307 cells of `#` and not one `^` —
    // so every cliff in the game was a solid mass of body tile with no edge
    // anywhere, which is why they read as brickwork rather than as terrain. The
    // renderer now puts the lip on the top row of every mass by looking at the
    // neighbours, so no room grid changes and no author has to remember. See
    // `Room.artAt` for why off the edge of the screen counts as the same mass.
    cliff: { art: ART.cliff, pal: 'stone', flags: F.SOLID, family: 'cliff', edgeArt: { up: 'cliffTop' } },
    cliffTop: { art: ART.cliffTop, pal: 'stone', flags: F.SOLID, family: 'cliff' },
    cliffDk: { art: ART.cliff, pal: 'stonedk', flags: F.SOLID, family: 'cliff', edgeArt: { up: 'cliffTop' } },
    cliffSand: { art: ART.cliff, pal: 'sand', flags: F.SOLID, family: 'cliff', edgeArt: { up: 'cliffTop' } },
    cliffRust: { art: ART.cliff, pal: 'rust', flags: F.SOLID, family: 'cliff', edgeArt: { up: 'cliffTop' } },
    cliffCoral: { art: ART.cliff, pal: 'coral', flags: F.SOLID, family: 'cliff', edgeArt: { up: 'cliffTop' } },
    cliffMarble: { art: ART.cliff, pal: 'marble', flags: F.SOLID, family: 'cliff', edgeArt: { up: 'cliffTop' } },
    cliffAbyss: { art: ART.cliff, pal: 'abyss', flags: F.SOLID, family: 'cliff', edgeArt: { up: 'cliffTop' } },
    // Outdoor bombable walls. dWallCracked is the indoor equivalent; these let
    // an overworld region be gated on Bombs, which GAME-PLAN.md asks for and
    // nothing outdoors could express before.
    // Part of the same mass — a cracked cliff is a cliff — but it keeps its own
    // art at the top row rather than the lip, because the crack IS the tell and
    // a lip drawn over it would hide the one thing the player has to see.
    cliffCracked: { art: ART.cliffCracked, pal: 'stone', flags: F.SOLID | F.BOMBABLE, family: 'cliff' },
    // The two region gates GAME-PLAN.md asks for. The Marsh gate proved the
    // shape — a solid tile with a flag, plus a transform naming what opens it —
    // and these two only add `level`, so the gate can name the MAGIC boomerang
    // rather than any boomerang.
    saltVane: { art: ART.saltVane, pal: 'marble', flags: F.SOLID | F.VANE | F.RING, underArt: 'saltFlat' },
    // THE KEEP'S SEAL IS NOT AN ITEM GATE. It is the one story gate in the
    // world: it opens when the Maku Tree opens the road at five Essences, and
    // no item in the game touches it.
    //
    // It was `abyssPlug`, F.SOLID | F.MAGNETIC, hauled by the Dredge Line —
    // and the Dredge Line is the Keep's own item, sitting behind this seal, so
    // the road to it was locked by the thing that unlocked the road. See
    // `openFlag` in src/world/tileset.js and `Game.applyStoryGates`.
    keepSeal: {
      art: ART.keepSeal, pal: 'rust', flags: F.SOLID, underArt: 'rockFloorDk',
      openFlag: 'makuOpenedKeep', openTo: 'rockFloorDk',
      openDeny: 'Iron, bolted across the road down.\nNothing you carry will shift it.',
    },

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
      art: ART.chasmBody, pal: 'pit', flags: F.JUMPABLE | F.GAP,
      family: 'chasm', edgeArt: { up: 'chasmTop' },
    },
    // The lip is a tile so the autotiler can name it, and it carries the SAME
    // flags as the body: a tiledef whose edge piece was passable where the body
    // is not would make the top row of every gap in the game walkable, which is
    // the invariant `validateTiles` asserts for ground variants and the same
    // reasoning applies here.
    chasmTop: {
      art: ART.chasmTop, pal: 'pit', flags: F.JUMPABLE | F.GAP, family: 'chasm',
    },
    boulder: {
      art: ART.boulder, pal: 'stonedk', flags: F.SOLID | F.ROCK | F.HEAVY,
      underArt: 'rockFloor', liftLevel: 2,
    },
    cliffCrackedDk: { art: ART.cliffCracked, pal: 'stonedk', flags: F.SOLID | F.BOMBABLE, family: 'cliff' },
    // A boulder already split by a fault: bombs open it, and nothing else
    // does. It carries NEITHER F.ROCK nor F.HEAVY on purpose — a boulder you
    // can also lift or also drag is not gated on bombs, it is gated on
    // whichever of the three you happen to have, and check-overworld would
    // read the gate as open under two different item sets.
    boulderCracked: {
      art: ART.boulderCracked, pal: 'stonedk', flags: F.SOLID | F.BOMBABLE,
      underArt: 'rockFloor',
    },
    treeDead: { art: ART.tree, pal: 'treeoakdd', flags: F.SOLID, underArt: 'grassBog',
      quad: 'treeOak', quadPalTop: 'treeOakDdTop', quadPalBot: 'treeOakDdBot' },
    treeDark: { art: ART.tree, pal: 'treeoakdk', flags: F.SOLID, underArt: 'grassDark',
      quad: 'treeOak', quadPalTop: 'treeOakDkTop', quadPalBot: 'treeOakDkBot' },
    // THE TREES ARE WHOLE 32x32 OBJECTS NOW, not 16x16 lollipops. `big` names
    // the pair of half-arts; see `registerTiles` and `Room.render`. `art` stays
    // as the fallback the rest of the engine (previews, the map screen's colour
    // sampler) reads when it wants one 16x16 cell to stand for this tile.
    tree: { art: ART.tree, pal: 'treeoak', flags: F.SOLID, underArt: 'grass',
      quad: 'treeOak', quadPalTop: 'treeOakTop', quadPalBot: 'treeOakBot' },
    treeSand: { art: ART.tree, pal: 'treeoak', flags: F.SOLID, underArt: 'sand',
      quad: 'treeOak', quadPalTop: 'treeOakTop', quadPalBot: 'treeOakBot' },
    palm: { art: ART.palmTree, pal: 'tree', flags: F.SOLID, underArt: 'sand',
      quad: 'palm', quadPalTop: 'palmFrond', quadPalBot: 'palmFrond' },
    bush: { art: ART.bush, pal: 'tree', flags: F.SOLID | F.BUSH, underArt: 'grass' },
    // DRIFT-TANGLE. A mat of sun-dried weed packed into a doorway: springy,
    // salt-stiff, and the one obstacle in the game a blade does nothing to —
    // a sword parts it and it closes again. It burns, and only burns, which is
    // what gives the Kilnshell a movement verb instead of two puzzle ones.
    //
    // It is the bush SILHOUETTE under the bog palette rather than new terrain
    // art: CLAUDE.md says extract rather than draw, and a recoloured existing
    // mass is the honest version of that when no sheet has the thing. It reads
    // as weed rather than hedge because of the palette, and it is deliberately
    // NOT given F.BUSH — that flag means "a blade clears this", and this is
    // the tile that exists to prove a blade does not.
    driftTangle: { art: ART.bush, pal: 'bog', flags: F.SOLID, underArt: 'grass' },
    driftTangleDk: { art: ART.bush, pal: 'bog', flags: F.SOLID, underArt: 'rockFloorDk' },
    bushSand: { art: ART.bush, pal: 'tree', flags: F.SOLID | F.BUSH, underArt: 'sand' },
    rock: { art: ART.rock, pal: 'stone', flags: F.SOLID | F.ROCK, underArt: 'grass' },
    rockSand: { art: ART.rock, pal: 'sand', flags: F.SOLID | F.ROCK, underArt: 'sand' },
    pot: { art: ART.pot, pal: 'pot', flags: F.SOLID | F.ROCK, underArt: 'dFloor' },
    sign: { art: ART.sign, pal: 'wood', flags: F.SOLID, underArt: 'grass' },
    // NO `stump` TILE. There was a hand-drawn one and no legend anywhere could
    // name it, so no room grid could place it — dead art carrying a SOLID flag.
    // The town kit's extracted `bStump` is the stump this game actually has.
    // Likewise no `dSwitchUp`/`dSwitchDown`: every floor switch in the game is
    // an ENTITY drawing `o_switch_up`/`o_switch_down`, and those two tiledefs
    // were an earlier design nothing had reached since.
    spikes: { art: ART.spikes, pal: 'stone', flags: F.HAZARD, underArt: 'dFloor' },

    // --- transitions ---
    //
    // A CAVE MOUTH IS A HOLE, NOT AN OBJECT. The extracted art is a dark arch
    // with a one-pixel lip and nothing else — on the Subrosia sheet the rock it
    // is cut into is supplied by the tiles AROUND it, and that is how the source
    // games do every cave in Holodrum and Labrynna too. Dropped on open sand or
    // open grass with no rock touching it, the same tile reads as a rectangle
    // somebody pasted on the ground, which is exactly what nine overworld
    // screens looked like until the rock went in above them. `family: 'cliff'`
    // is what makes that work: a cliff mass directly over a mouth is ONE mass,
    // so no lip is drawn along the seam between them and the mouth reads as
    // having been cut into the rock rather than parked under it.
    //
    // The palette variants are the same trick every cliff and every ledge here
    // already uses. A grey arch inside a sand-coloured cliff or a coral one is
    // the giveaway that the tile came from somewhere else, so each region's
    // mouth carries its own cliff's ramp — darker, because it is a hole.
    caveMouth: { art: ART.caveMouth, pal: 'stonedk', flags: F.SOLID | F.WARP, mask: 0, family: 'cliff' },
    caveMouthSolid: { art: ART.caveMouth, pal: 'stonedk', flags: F.SOLID, family: 'cliff' },
    caveMouthSand: { art: ART.caveMouth, pal: 'sandwet', flags: F.SOLID | F.WARP, mask: 0, family: 'cliff' },
    caveMouthCoral: { art: ART.caveMouth, pal: 'coraldk', flags: F.SOLID | F.WARP, mask: 0, family: 'cliff' },
    caveMouthAbyss: { art: ART.caveMouth, pal: 'abyss', flags: F.SOLID | F.WARP, mask: 0, family: 'cliff' },
    // A HOLLOW IS NOT A CAVE. Tidewatch's Maku Tree is entered through a gap in
    // the tree line at the top of the square — the room data has said so since
    // it was laid out — and it was drawn with the grey stone cave arch, so the
    // village had a rock doorway standing in a row of oaks with no rock
    // anywhere near it. Same silhouette, the dead-oak ramp, and the tree line's
    // own canopy showing through: a hollow trunk instead of a quarry.
    treeHollow: { art: ART.caveMouth, pal: 'treeoakdd', flags: F.SOLID | F.WARP, mask: 0 },
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


    // --- dungeon themes (P7.5) -------------------------------------------
    //
    // Eight dungeons shared one legend and therefore one look: `dFloor` and
    // `dWall` in a different palette, eight times. The source does the
    // opposite — each of its dungeons has its own masonry and its own floor
    // pattern, and you know which dungeon a screenshot is from before you
    // recognise the room. These are the tiles that fix that, extracted from
    // the Seasons dungeon map by tools/rip-dungeon-themes.py, which cites the
    // map coordinate and the occurrence count for every one.
    //
    // A theme is FLOOR + FLOOR-ALT + WALL + CRACKED WALL + BLOCK, and a
    // themed legend in legends.js remaps the shared characters onto them, so
    // NO ROOM GRID CHANGES. A dungeon picks its look with one `legend:` field.
    //
    // The cracked wall keeps the hand-drawn `dWallCracked` art in the theme's
    // wall palette rather than taking the theme's own wall art. A bombable
    // wall has to be visibly cracked — theming it into invisibility would be a
    // puzzle regression wearing a coat of paint.
    //
    // Where a tile names a palette from palettes.js rather than its own
    // extracted one, that is a deliberate swap into a colour the game already
    // uses, so a theme never invents a hue the rest of the world does not have.

    // d1 Tidewash Grotto — pale sea-cave flagstone, hatched walls.
    dFloorGrotto: { art: ART.paleFloor, pal: 'paleFloor' },
    dFloorGrottoAlt: { art: ART.paleFloor, pal: 'stonef' },
    dWallGrotto: { art: ART.brickWallBlue, pal: 'brickWallBlue', flags: F.SOLID },
    dWallGrottoX: { art: ART.dWallCracked, pal: 'brickWallBlue', flags: F.SOLID | F.BOMBABLE },
    dBlockGrotto: { art: ART.vaultBlock, pal: 'vaultBlock', flags: F.SOLID },
    dUrnGrotto: { art: ART.urn, pal: 'urn', flags: F.SOLID, underArt: 'dFloorGrotto' },

    // d2 Coral Spire — blue flagstone under coral-pink masonry.
    dFloorCoral: { art: ART.reefFloor, pal: 'reefFloor' },
    dFloorCoralAlt: { art: ART.reefFloor, pal: 'coral' },
    dWallCoral: { art: ART.coralWall, pal: 'coralWall', flags: F.SOLID },
    dWallCoralX: { art: ART.dWallCracked, pal: 'coral', flags: F.SOLID | F.BOMBABLE },
    dBlockCoral: { art: ART.vaultBlock, pal: 'coral', flags: F.SOLID },
    dUrnCoral: { art: ART.urn, pal: 'urn', flags: F.SOLID, underArt: 'dFloorCoral' },

    // d3 Bogwater Sanctum — a gold lattice sunk into swamp-green stone.
    dFloorBog: { art: ART.gildFloor, pal: 'gildFloor' },
    dFloorBogAlt: { art: ART.gildFloor, pal: 'bog' },
    dWallBog: { art: ART.knurlWall, pal: 'knurlWall', flags: F.SOLID },
    dWallBogX: { art: ART.dWallCracked, pal: 'knurlWall', flags: F.SOLID | F.BOMBABLE },
    dBlockBog: { art: ART.cryptBlock, pal: 'bog', flags: F.SOLID },
    dUrnBog: { art: ART.urn, pal: 'urn', flags: F.SOLID, underArt: 'dFloorBog' },

    // d4 Cliffside Cistern — sunken tan panels, cold studded walls.
    dFloorCistern: { art: ART.panelFloor, pal: 'panelFloor' },
    dFloorCisternAlt: { art: ART.panelFloor, pal: 'stonef' },
    dWallCistern: { art: ART.studWall, pal: 'stonef', flags: F.SOLID },
    dWallCisternX: { art: ART.dWallCracked, pal: 'stonef', flags: F.SOLID | F.BOMBABLE },
    dBlockCistern: { art: ART.vaultBlock, pal: 'vaultBlock', flags: F.SOLID },
    dUrnCistern: { art: ART.urn, pal: 'urn', flags: F.SOLID, underArt: 'dFloorCistern' },

    // d5 Drowned Wood Shrine — amber lozenge floor under brown brick walls.
    // The floor was `brickFloor` and the wall `emberWall`, and both are brick
    // COURSES: the room came out as one continuous texture with no visible
    // line between what you can walk on and what you cannot. A theme has to
    // keep floor and wall legible before it is allowed to be atmospheric.
    dFloorWood: { art: ART.forgeFloor, pal: 'forgeFloor' },
    dFloorWoodAlt: { art: ART.brickFloor, pal: 'brickFloor' },
    dWallWood: { art: ART.emberWall, pal: 'emberWall', flags: F.SOLID },
    dWallWoodX: { art: ART.dWallCracked, pal: 'emberWall', flags: F.SOLID | F.BOMBABLE },
    dBlockWood: { art: ART.cryptBlock, pal: 'wood', flags: F.SOLID },
    dUrnWood: { art: ART.urn, pal: 'urn', flags: F.SOLID, underArt: 'dFloorWood' },

    // d6 Salt Pan Vault — the ruin rosette bleached out to salt and bone.
    dFloorSalt: { art: ART.ruinFloorAlt, pal: 'marble' },
    dFloorSaltAlt: { art: ART.ruinFloorAlt, pal: 'stonef' },
    dWallSalt: { art: ART.vaultBlock, pal: 'marble', flags: F.SOLID },
    dWallSaltX: { art: ART.dWallCracked, pal: 'marble', flags: F.SOLID | F.BOMBABLE },
    dBlockSalt: { art: ART.vaultBlock, pal: 'marble', flags: F.SOLID },
    dUrnSalt: { art: ART.urn, pal: 'urn', flags: F.SOLID, underArt: 'dFloorSalt' },

    // d7 Reef Palace — the rosette in its own colours, walls studded gold.
    dFloorPalace: { art: ART.ruinFloor, pal: 'ruinFloor' },
    dFloorPalaceAlt: { art: ART.ruinFloorAlt, pal: 'ruinFloorAlt' },
    dWallPalace: { art: ART.studWall, pal: 'studWall', flags: F.SOLID },
    dWallPalaceX: { art: ART.dWallCracked, pal: 'gold', flags: F.SOLID | F.BOMBABLE },
    dBlockPalace: { art: ART.vaultBlock, pal: 'gold', flags: F.SOLID },
    dUrnPalace: { art: ART.urn, pal: 'urn', flags: F.SOLID, underArt: 'dFloorPalace' },

    // d8 Abyssal Keep — studded violet-black tiling, violet masonry.
    dFloorAbyss: { art: ART.abyssFloor, pal: 'abyssFloor' },
    dFloorAbyssAlt: { art: ART.abyssFloor, pal: 'abyss' },
    dWallAbyss: { art: ART.cryptWall, pal: 'cryptWall', flags: F.SOLID },
    dWallAbyssX: { art: ART.dWallCracked, pal: 'cryptWall', flags: F.SOLID | F.BOMBABLE },
    dBlockAbyss: { art: ART.cryptBlock, pal: 'cryptBlock', flags: F.SOLID },
    dUrnAbyss: { art: ART.urn, pal: 'urn', flags: F.SOLID, underArt: 'dFloorAbyss' },

    // THEMED SCENERY. `M` and `U` in the dungeon legend; the urn is themed per
    // dungeon just as the floor and wall are, so `U` in a Coral Spire room is a
    // urn standing on Coral Spire flagstones.
    //
    // Both are SOLID, so read the traps list in CLAUDE.md before putting one
    // anywhere: a solid tile can strand a room while rendering perfectly and
    // validating clean. Run walk-dungeons.mjs after placing one.
    //
    // THE URN NAMES AN `underArt` AND MUST. Its cell is an OBJECT, so the
    // ripper keys the floor the source drew behind it out to transparency
    // (KEY_BACKGROUND in rip-dungeon-themes.py) — without a floor drawn under
    // it, it is a hole. That is also why there is one per theme: `underArt` is
    // a fixed tile name, so the only way for an urn to stand on the right floor
    // is for each dungeon to have its own.
    //
    // The lion mask is NOT themed and needs no underArt: it is a wall feature
    // and its art fills the whole cell, so it reads as a decorated block in any
    // dungeon's masonry. Place it IN A WALL, not on a floor.
    dLionHead: { art: ART.lionHead, pal: 'lionHead', flags: F.SOLID },
    dUrn: { art: ART.urn, pal: 'urn', flags: F.SOLID, underArt: 'dFloor' },

    // --- dungeon ---
    // NO VARIANTS, DELIBERATELY. `dg 258,42` is the one tile on any sheet whose
    // tonal profile matches this one (34/50/14 against 27/53/18) and it was
    // extracted, wired and then reverted: it is a DIAGONAL STREAK against this
    // tile's SCALLOP, so scattered through a floor it read as random patches
    // rather than as masonry. Tone compatibility is necessary and not
    // sufficient — the motif has to match too. See docs/ART-BACKLOG.md.
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
    digSpot: { art: ART.digSpot, pal: 'sand', flags: F.SLOW, underArt: 'sand' },
    dBlock: { art: ART.dBlock, pal: 'stone', flags: F.SOLID },
    dWaterS: { art: ART.waterS0, pal: 'water', flags: F.WATER, anim: ['waterS0', 'waterS1', 'waterS2', 'waterS1'], animRate: 11 },
    dWaterD: { art: ART.waterD0, pal: 'deep', flags: F.DEEP, anim: ['waterD0', 'waterD1', 'waterD2', 'waterD1'], animRate: 13 },

    // Dungeon tide tiles: the same three-state trick indoors.
    dSluice: { tide: ['dFloorWet', 'dWaterS', 'dWaterD'] },
    dBasin: { tide: ['dFloor', 'dFloorWet', 'dWaterS'] },
    dWell: { tide: ['dWaterS', 'dWaterD', 'dWaterD'] },
    dDrain: { tide: ['dPit', 'dWaterS', 'dWaterD'] },
    // A shaft that fills OVER YOUR HEAD. It exists to be indistinguishable
    // from `dDrain` — and from a plain `dPit` — at LOW, where all three ARE
    // the same tile, `dPit`, rather than three tiles that resemble each other.
    // One level up they are three different answers: wading depth, a drop you
    // cannot climb, and a hole that never fills at all. That is the whole of
    // dungeon 2: you cannot see the bottom of a dry shaft, and the Brineglass
    // Lens is the only thing in the game that shows you which one you are
    // standing over before you are standing in it.
    dSump: { tide: ['dPit', 'dWaterD', 'dWaterD'] },

    // A drowned tree, and the Drowned Wood Shrine is built on it.
    //
    // It is the only barrier in the game that a THROW cares about and a WALK
    // does not, because it is the only one that stops being solid when the sea
    // comes up. `room.solidAt` refuses a SOLID tile to everything — a jump, a
    // flying entity, a thrown Reefseed — so a bole standing at LOW and MID
    // stops a seed dead at its foot, and at HIGH the same tile is open water a
    // seed sails straight over. Nothing else about the room has changed; only
    // where the throw ends up has.
    //
    // The trunk is `treeDark`'s art, which is the extracted oak in the wood
    // palette, over the Shrine's own flagstones rather than over grass — an
    // indoor tile standing on outdoor ground draws a hole around its own feet.
    dBole: { art: ART.tree, pal: 'treeoakdk', flags: F.SOLID, underArt: 'dFloorWood' },
    dSnag: { tide: ['dBole', 'dBole', 'dWaterD'] },

    // A snarl of drowned kelp across a gap in a wall, and the ONLY thing that
    // opens it is a sword swing. That is not a flavour note, it is the whole
    // reason the Shrine's groves can be proved: `Player.startSwing` returns
    // early while `inDeep`, so a swimmer floating next to a snarl cannot touch
    // it, and the only transform below is `cut` — a bomb applies 'bomb' and
    // finds nothing, so there is no second answer. The one place a blade comes
    // out beside a snarl is a coral pillar, and a pillar is dry ground at LOW
    // and at LOW only.
    dSnarl: { art: ART.bush, pal: 'treeoakdk', flags: F.SOLID, underArt: 'dWaterD' },

    // --- the Abyssal Keep -------------------------------------------------
    //
    // A mooring bollard on the Keep's own floor. The shared `dPost` is the
    // same art over `dFloor`, which is the BRICK floor — so a post placed in
    // an abyss room drew a square of somebody else's flagstones round its own
    // feet, exactly the way the urn did before P7.5 gave every theme its own.
    // `dungeonAbyss` repoints `q` at this one. Flags are `dPost`'s to the bit:
    // a theme may change the look and never the rules.
    dPostAbyss: { art: ART.dPost, pal: 'stone', flags: F.SOLID | F.SNAG, underArt: 'dFloorAbyss' },

    // A silted cache: the ring a heavy thing leaves in the floor when it has
    // been lying there long enough to settle. Two palettes of ONE extracted
    // art, which is the whole trick — bleached on the dry pan, blue once the
    // sea is over it — so the marker is in the same place at every sea and
    // only its colour says whether the line can work.
    //
    // The flags are the entire mechanism and they are worth stating plainly.
    // `DredgeLine.dragBack` searches a tile it passed over ONLY if that tile
    // carries `F.WET | F.SLOW` at the level it is resolved at. `dSiltDry`
    // carries neither. So the floor gives up what it is holding while the sea
    // is on it and gives up nothing at all while the sea is off it, and that
    // is the one thing in this game that wants the water UP.
    dSiltDry: { art: ART.siltFloor, pal: 'stonedk' },
    dSiltWet: { art: ART.siltFloor, pal: 'water', flags: F.WATER },
    dSilt: { tide: ['dSiltDry', 'dSiltWet', 'dSiltWet'] },

    // A lintel of the Keep's own stone, standing across a shaft, that the sea
    // covers at HIGH and only at HIGH. `drownWall` is the same three states and
    // is an outdoor CLIFF — it has been drawing a hillside inside four dungeons
    // for the whole life of the tile — so the Keep gets one in its own wall.
    //
    // It is the second half of the crossing, and the half that is legible: a
    // cast stops dead on F.SOLID, so a mooring behind a standing lintel cannot
    // be reached however well you are braced, and a whole tile of masonry going
    // under the water is what says the line will now go over it. The Drowned
    // Wood Shrine's bole is the argument for building it this way — when the
    // answer wants to be a shade of blue, reach for a whole tile instead.
    dLintel: { tide: ['dWallAbyss', 'dWallAbyss', 'dWaterD'] },
  };
  registerTiles(TILE_DEFS);
  // After the tiledefs, so a block cell can never be shadowed by one of them.
  const townDefs = installTownBlocks();
  Object.assign(TILE_DEFS, townDefs);
  Object.assign(TILE_DEFS, installDungeonPortals());

  // Rooms draw a tile by its *tile* name, but the art above is keyed by art
  // name — so every palette-swap tile (grassDark reusing ART.grass, treeDark
  // reusing ART.tree, and the rest) had no entry to find and rendered as a
  // placeholder box. Alias each tile name to the art it declared.
  //
  // NOTE THE `!(name in ART)`: a tile whose NAME is already an art name draws
  // that art and CANNOT BE POINTED AT ANOTHER ONE. Repointing `digSpot.art`
  // changed nothing at all and the tile went on drawing the art it shares its
  // name with — no warning, no missing entry, just the old pixels. If a tile
  // needs different art, rename the ART, not the tiledef.
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
    // FIRE AND NOTHING ELSE. No `cut`, no `bomb`, no `lift`: the whole point of
    // the tile is that the tools the player already has do not answer it.
    driftTangle: { fire: 'grass', fx: 'cut', sfx: 'cut', persist: true },
    driftTangleDk: { fire: 'rockFloorDk', fx: 'cut', sfx: 'cut', persist: true },
    flowers: { cut: 'grass', fx: 'cut', sfx: 'cut' },
    flowersDark: { cut: 'grassDark', fx: 'cut', sfx: 'cut' },
    // `cut` and nothing else, on purpose: see the tiledef. It persists because
    // a snarl you have already cut through is a door you have already opened,
    // and a barrier that grows back across the only route out of a room is not
    // a puzzle, it is a trap.
    dSnarl: { cut: 'dWaterS', fx: 'cut', sfx: 'cut', persist: true },
    rock: { lift: 'grass', drop: 'common' },
    rockSand: { lift: 'sand', drop: 'common' },
    pot: { lift: 'dFloor', drop: 'common' },
    sign: { cut: 'sign' },
    dWallCracked: { bomb: 'dFloor', fx: 'boom', persist: true, sfx: 'break' },
    cliffCracked: { bomb: 'sand', fx: 'boom', persist: true, sfx: 'break' },
    // The Power Bracelet is gone and lifting is base moveset, so a boulder
    // needs a reason to still be a boulder: `liftLevel: 2` puts it past bare
    // hands, and the Dredge Line drags it out of the way. That is the same
    // verb it uses on the abyss plug — a heavy fixed thing on a line — and it
    // keeps the Cliffs of Kell a real gate rather than losing 25 screens'
    // worth of gating to a removal. See docs/ITEMS.md.
    boulder: {
      lift: 'rockFloor', drop: 'none', persist: true,
      dredge: 'rockFloor', fx: 'puff', sfx: 'rumble',
      deny: 'Far too heavy to shift bare-handed.',
    },
    cliffCrackedDk: { bomb: 'mud', fx: 'boom', persist: true, sfx: 'break' },
    boulderCracked: { bomb: 'rockFloor', fx: 'boom', persist: true, sfx: 'break' },
    // The Magic Boomerang is gone. A vane is metal, and the thing in this game
    // with an opinion about metal is the Resonance Rod — which also means the
    // Salt Pans open to an item whose reach depends on the tide, so the vane a
    // player cannot quite ring at MID is one they can at HIGH. See
    // docs/ITEMS.md.
    saltVane: {
      ring: 'saltFlat', fx: 'spark', persist: true, sfx: 'break',
      deny: 'The vane is set too far to reach. Something must make it sing.',
    },
    // `keepSeal` HAS NO TRANSFORM AND MUST NOT GET ONE. It is a story gate:
    // `openFlag` opens it on room entry once the Maku Tree has opened the road,
    // and an item that also opened it would put the Keep back behind an item
    // again. Its refusal line lives on the tiledef as `openDeny`.
    dFloorCrack: { bomb: 'dPit', fx: 'boom', persist: true, sfx: 'break' },
    digSpot: { dredge: 'sand', drop: 'dredged', fx: 'puff', sfx: 'splash' },
    // The Rod retracts a grate. `persist: true` so a room stays open once it
    // has been opened, the way a bombed wall does.
    grate: { ring: 'grateOpen', fx: 'spark', persist: true, sfx: 'valve' },
    grateOw: { ring: 'grateOwOpen', fx: 'spark', persist: true, sfx: 'valve' },
  });
}

export { ART as CORE_TILE_ART };
