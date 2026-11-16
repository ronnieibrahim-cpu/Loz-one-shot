// The Mire Pool's stepping stones and raft, and the sand dollar's ground (S249).
//
// HAND-DRAWN. Searched first: both Oracles' overworld sheets (Labrynna, Holodrum
// spring, the fan-made assembled map) and the Ages tileset graphics in
// assets/objects/oracles-disasm/ages/ were scanned for a stone standing in
// shallows, a pillar with a standable top, a raft and a lily pad. What they hold
// of the kind is the Sea of Storms' reef rock (cyan, drowned, not stood on) and
// cliff edges; neither cartridge draws a stepping stone or a floating raft as a
// terrain tile. So these are ours, drawn to the register of the extracted
// `rock` and `waterD` beside them: three colours plus the ground, a hard
// outline all the way round, no anti-aliasing, a silhouette that reads black.
//
//   stepStoneLow   a flat wet slab barely above the mud
//   stepStoneTall  a stone post with a standable top, a different shape
//   stepRaft       logs lashed side by side, floating on deep water
//
// The two stones are transparent props drawn in `stonedk` over `mud` (like
// `rock` over grass). The raft is the Ages lake water's own four frames
// (TERRAIN_ART.waterD0..3, rip-terrain.py) with the raft laid over them, so the
// water around it ripples exactly as `waterD` does and the raft sits in the
// pool without a seam. Composed here at load, not copied, so a re-rip of the
// water is picked up for free. Its palette is `deep` with the two other slots
// given to the wood.

import { TERRAIN_ART } from './tiles-terrain.js';

export const STEPSTONE_ART = {
  // A flat, wet slab, barely above the mud: a lip of side showing under the face.
  stepStoneLow: `
    ................
    ................
    ................
    ................
    ................
    ....33333333....
    ...3000000003...
    ..300000001003..
    .30001000000013.
    .30000000101113.
    .32000000011123.
    ..322200112223..
    ...3222222223...
    ....33333333....
    ................
    ................`,

  // A stone post: a tall column with a standable top, courses of masonry down its
  // face. Taller and narrower than the slab, so the two read apart at a glance.
  stepStoneTall: `
    ................
    .....333333.....
    ...3300000033...
    ..300000000003..
    ..300000010003..
    ..300000001003..
    ..311000000223..
    ..311111112223..
    ..312222112223..
    ..311112112223..
    ..311111112223..
    ..311112222223..
    ..311111112223..
    ...3311111233...
    .....333333.....
    ................`,

};

// The raft: logs lashed side by side. '.' lets the water show through.
const RAFT = [
  '................',
  '................',
  '...3333333333...',
  '..322222222223..',
  '..333333333333..',
  '..322222222223..',
  '..322222222223..',
  '..333333333333..',
  '..322222222223..',
  '..322222222223..',
  '..333333333333..',
  '..322222222223..',
  '..322222222223..',
  '...3333333333...',
  '................',
  '................',
];

// One raft frame per water frame, so the pool ripples round it exactly as `waterD`.
for (let f = 0; f < 4; f++) {
  const water = TERRAIN_ART['waterD' + f].trim().split('\n').map(r => r.trim());
  STEPSTONE_ART['stepRaft' + f] = '\n' + water.map((w, y) =>
    '    ' + [...w].map((c, x) => (RAFT[y][x] === '.' ? c : RAFT[y][x])).join('')).join('\n');
}

// THE TALL STONE STANDING IN THE SEA (S249, at MID): the same post laid over
// the deep water's frames, so no square of mud shows round it. Four colours
// in all, the water's two among them, so the stone keeps its face (grey) and
// outline and its shadow takes the deep water's dark: a wet stone.
const TALL = STEPSTONE_ART.stepStoneTall.trim().split('\n').map(r => r.trim());
const WET = { '0': '2', '1': '2', '2': '1', '3': '3' };
for (let f = 0; f < 4; f++) {
  const water = TERRAIN_ART['waterD' + f].trim().split('\n').map(r => r.trim());
  STEPSTONE_ART['stepStoneTallWet' + f] = '\n' + water.map((w, y) =>
    '    ' + [...w].map((c, x) => (TALL[y][x] === '.' ? c : WET[TALL[y][x]])).join('')).join('\n');
}

// `deep`'s two water colours, then the wood: planks and the dark between them.
export const STEPSTONE_PALETTES = {
  stepRaft: ['#5898d8', '#2c60b0', '#c8964c', '#4a2c10'],
  stepStoneWet: ['#5898d8', '#2c60b0', '#7c847c', '#181c1a'],
};
