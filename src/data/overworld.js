// The overworld of Thalassia: a 12x10 grid of screens, all 120 present.
// Rooms are keyed 'floor,x,y'. See world/room.js for the room contract and
// data/legends.js for the character vocabulary (digits are always tide tiles).
//
// Region layout follows docs/GAME-PLAN.md. Screens connect on a shared seam
// table, so a walkable east edge always has a walkable west edge facing it;
// every other edge tile is barrier, and the world border is solid all round.
//
// Region gates use what the tileset can actually enforce:
//   Coral Reef   1-tile deep gaps          Roc's Feather   (as planned)
//   Cliffs of Kell  boulders               Power Bracelet  (as planned)
//   Drowned Wood  a wide deep channel      Zora's Flippers (as planned)
//   Reef Palace   posts over deep water    Hookshot        (as planned)
//   Sunken Marsh  cracked cliff             Bombs           (as planned)
//   Salt Pans     a deep gap and boulders (Feather + Bracelet) — the plan
//                 calls for the Magic Boomerang, which gates nothing here.
//   Abyssal app.  deep water and posts (Flippers + Hookshot) — the plan
//                 calls for the Magnetic Gloves, likewise.
//
// The Marsh has exactly two ways in — Bog Causeway (2,7) from the Coast and Bog
// Stair (1,6) down from the Cliffs — and both are now sealed by a `cliffCracked`
// tile with a solid cliff run beside it, so each entrance is a one-tile pocket
// you stand in until you have Bombs. Sealing only the Coast side would have
// gated nothing, because the Cliffs back door reaches the same screens.

import { registerMap } from '../world/maps.js';

export const OVERWORLD_W = 12;
export const OVERWORLD_H = 10;

const rooms = {
  // ---- abyss -------------------------------------------------------------
  '0,0,0': {
    name: 'Drowned Shore',
    legend: 'abyss', music: 'abyss',
    map: [
      '##########',
      '#gg....gg#',
      '#g..GG..gg',
      '#gg?gg?ggg',
      '#g..GG..gg',
      '#gg____ggg',
      '#gggggggg#',
      '###gggg###',
    ],
    entities: [
      ['keese', 2, 3], ['keese', 6, 4],
    ],
  },
  '0,1,0': {
    name: 'Gate of the Keep',
    legend: 'abyss', music: 'abyss',
    map: [
      '##########',
      '#gg.CC.gg#',
      'ggg....ggg',
      'gg.GGG>.gg',
      'ggg.gg>ggg',
      'gggggg>ggg',
      '#gggggggg#',
      '###gggg###',
    ],
    warps: [
      { x: 4, y: 1, to: { map: 'd8', floor: 0, rx: 3, ry: 7, px: 72, py: 96 } },
    ],
    entities: [
      ['sign', 2, 4, { text: 'THE ABYSSAL KEEP\nNereth waits below the water.' }],
      ['darknut', 6, 5],
    ],
  },
  '0,2,0': {
    name: 'Black Causeway',
    legend: 'abyss', music: 'abyss',
    map: [
      '##########',
      '#gg9999gg#',
      'gg......gg',
      'gg.9999.gg',
      'gg......gg',
      'ggg9999ggg',
      '#gggggggg#',
      '###gggg###',
    ],
    entities: [
      ['wizzrobe', 4, 3],
    ],
  },
  '0,3,0': {
    name: 'Rustfall',
    legend: 'abyss', music: 'abyss',
    map: [
      '##########',
      '#gGGGGGGg#',
      'gg..oo..g#',
      'gg.GGGG.g#',
      'gg..oo..g#',
      'ggGGGGGGg#',
      '#gggggggg#',
      '###gggg###',
    ],
    entities: [
      ['darknut', 4, 2], ['pickup', 2, 5, { kind: 'heartPiece' }],
    ],
  },
  // ---- salt --------------------------------------------------------------
  '0,4,0': {
    name: 'North Pan',
    legend: 'salt', music: 'salt',
    map: [
      '##########',
      '#gg2222gg#',
      '#g.2222.gg',
      '#gG....Ggg',
      '#g.3333.gg',
      '#gg____ggg',
      '#gggggggg#',
      '###gggg###',
    ],
    entities: [
      ['leever', 3, 4], ['leever', 6, 2],
    ],
  },
  '0,5,0': {
    name: 'Salt Terraces',
    legend: 'salt', music: 'salt',
    map: [
      '##########',
      '#gGGGGGGg#',
      'gg......gg',
      'ggG.oo.Ggg',
      'gg......gg',
      'ggG""""Ggg',
      '#gggggggg#',
      '###gggg###',
    ],
    entities: [
      ['beetle', 4, 3], ['pickup', 6, 4, { kind: 'heartPiece' }],
    ],
  },
  '0,6,0': {
    name: 'Boiling Pan',
    legend: 'salt', music: 'salt',
    map: [
      '##########',
      '#g222222g#',
      'gg2.GG.2gg',
      'gg2.GG.2gg',
      'gg2....2gg',
      'gg222222gg',
      '#gggggggg#',
      '###gggg###',
    ],
    entities: [
      ['zol', 4, 3], ['zol', 2, 4],
    ],
  },
  '0,7,0': {
    name: 'East Crust',
    legend: 'salt', music: 'salt',
    map: [
      '##########',
      '#gGGGGGGg#',
      'gg.o..o.g#',
      'gg......g#',
      'gg.o..o.g#',
      'ggGGGGGGg#',
      '#gggggggg#',
      '###gggg###',
    ],
    entities: [
      ['moblin', 4, 3],
    ],
  },
  // ---- reef --------------------------------------------------------------
  '0,8,0': {
    name: 'Coral Gate',
    legend: 'reef', music: 'reef',
    map: [
      '##########',
      '#g666666g#',
      '#g6.qq.6gg',
      '#g6....6gg',
      '#g6.qq.6gg',
      '#g666666gg',
      '#gggggggg#',
      '###gggg###',
    ],
    entities: [
      ['jellyfish', 4, 3],
    ],
  },
  '0,9,0': {
    name: 'Palace Wall',
    legend: 'reef', music: 'reef',
    map: [
      '##########',
      '#gggggggg#',
      'gg.7777.gg',
      'gg.7777.gg',
      'gg.7777.gg',
      'gggggggggg',
      '#gggggggg#',
      '###gggg###',
    ],
    entities: [
      ['octorokSea', 4, 3], ['pickup', 2, 5, { kind: 'heartPiece' }],
    ],
  },
  '0,10,0': {
    name: 'Tide Steps',
    legend: 'reef', music: 'reef',
    map: [
      '##########',
      '#gg8888gg#',
      'gg.8888.gg',
      'gg......gg',
      'gg.6666.gg',
      'ggg6666ggg',
      '#gggggggg#',
      '###gggg###',
    ],
    entities: [
      ['siren', 4, 2],
    ],
  },
  '0,11,0': {
    name: 'East Spire',
    legend: 'reef', music: 'reef',
    map: [
      '##########',
      '#g......g#',
      'gg.qqqq.g#',
      'gg......g#',
      'gg.7777.g#',
      'gg......g#',
      '#gggggggg#',
      '###gggg###',
    ],
    entities: [
      ['jellyfish', 5, 4],
    ],
  },
  // ---- abyss -------------------------------------------------------------
  '0,0,1': {
    name: 'Sunless Flat',
    legend: 'abyss', music: 'abyss',
    map: [
      '###gggg###',
      '#gg....gg#',
      '#g.?..?.gg',
      '#gg....ggg',
      '#g.?..?.gg',
      '#gg....ggg',
      '#gggggggg#',
      '##########',
    ],
    entities: [
      ['jellyfish', 3, 3],
    ],
  },
  '0,1,1': {
    name: 'The Long Drop',
    legend: 'abyss', music: 'abyss',
    map: [
      '###gggg###',
      '#g......g#',
      'gg.????.gg',
      'gg.????.gg',
      'gg.????.gg',
      'gg......gg',
      '#gggggggg#',
      '##########',
    ],
    entities: [
      ['keese', 2, 2], ['keese', 7, 5],
    ],
  },
  '0,2,1': {
    name: 'Abyss Stair',
    legend: 'abyss', music: 'abyss',
    map: [
      '###gggg###',
      '#g......g#',
      'ggg9999ggg',
      'gg..gg..gg',
      'ggg____ggg',
      'gg.GGGG.gg',
      '#ggVVVVgg#',
      '###gggg###',
    ],
    entities: [
      ['sign', 6, 5, { text: 'Below: the Cliffs of Kell.\nAbove: the end of everything.' }],
    ],
  },
  '0,3,1': {
    name: 'Iron Watch',
    legend: 'abyss', music: 'abyss',
    map: [
      '###gggg###',
      '#gGGGGGGg#',
      'gg.qqqq.g#',
      'gg......g#',
      'gg.oooo.g#',
      'ggGGGGGGg#',
      '#gggggggg#',
      '##########',
    ],
    entities: [
      ['darknut', 3, 3], ['wizzrobe', 6, 2],
    ],
  },
  // ---- salt --------------------------------------------------------------
  '0,4,1': {
    name: 'Pan Road',
    legend: 'salt', music: 'salt',
    map: [
      '###gggg###',
      '#gggggggg#',
      '#gG3333Ggg',
      '#g......gg',
      '#gG3333Ggg',
      '#ggggggggg',
      '#gggggggg#',
      '###gggg###',
    ],
    entities: [
      ['leever', 5, 3],
    ],
  },
  '0,5,1': {
    name: 'Salters Rest',
    legend: 'salt', music: 'salt',
    map: [
      '###gggg###',
      '#gggggggg#',
      'gg.bbbb.gg',
      'gg......gg',
      'gg.qqqq.gg',
      'gggggggggg',
      '#gggggggg#',
      '###gggg###',
    ],
    entities: [
      ['npc', 4, 3, { sprite: 'npc_elder', dialogue: 'salterElder' }],
      ['sign', 6, 4, { text: 'The pans drink the sea and give back stone.' }],
    ],
  },
  '0,6,1': {
    name: 'Vault Approach',
    legend: 'salt', music: 'salt',
    map: [
      '###gggg###',
      '#gg....gg#',
      'gg.C..o.gg',
      'gg......gg',
      'ggG2222Ggg',
      'ggg2222ggg',
      '#gggggggg#',
      '###gggg###',
    ],
    warps: [
      { x: 3, y: 2, to: { map: 'd6', floor: 0, rx: 3, ry: 7, px: 72, py: 96 } },
    ],
    entities: [
      ['sign', 5, 2, { text: 'SALT PAN VAULT\nWater kills the flame. Draw it off.' }],
      ['beetle', 6, 5],
    ],
  },
  '0,7,1': {
    name: 'Windward Pan',
    legend: 'salt', music: 'salt',
    map: [
      '###gggg###',
      '#gGGGGGGg#',
      'gg......Vg',
      'gg.qqqq.Vg',
      'gg......Vg',
      'gg______Vg',
      '#gggggggg#',
      '###gggg###',
    ],
    entities: [
      ['wisp', 4, 3], ['moblin', 2, 4],
    ],
  },
  // ---- reef --------------------------------------------------------------
  '0,8,1': {
    name: 'Reefway',
    legend: 'reef', music: 'reef',
    map: [
      '###gggg###',
      '#gggggggg#',
      'gg66..66gg',
      'gg......gg',
      'gg66..66gg',
      'gggggggggg',
      '#gggggggg#',
      '###gggg###',
    ],
    entities: [
      ['crab', 4, 3], ['crab', 6, 4],
    ],
  },
  '0,9,1': {
    name: 'Hooked Channel',
    legend: 'reef', music: 'reef',
    map: [
      '###gggg###',
      '#gggggggg#',
      'gg.q77q.gg',
      'gg.q77q.gg',
      'gg.q77q.gg',
      'gggggggggg',
      '#gggggggg#',
      '###gggg###',
    ],
    entities: [
      ['octorokSea', 5, 3],
    ],
  },
  '0,10,1': {
    name: 'Palace Mouth',
    legend: 'reef', music: 'reef',
    map: [
      '###gggg###',
      '#gg.CC.gg#',
      'ggg....ggg',
      'gg.6666.gg',
      'gg.6666.gg',
      'gggggggggg',
      '#gggggggg#',
      '###gggg###',
    ],
    warps: [
      { x: 4, y: 1, to: { map: 'd7', floor: 0, rx: 3, ry: 7, px: 72, py: 96 } },
    ],
    entities: [
      ['sign', 2, 3, { text: 'REEF PALACE\nThe currents only run one way.' }],
      ['siren', 7, 4],
    ],
  },
  '0,11,1': {
    name: 'Spire Shallows',
    legend: 'reef', music: 'reef',
    map: [
      '###gggg###',
      '#g666666g#',
      'gg6....6g#',
      'gg.____.g#',
      'gg6....6g#',
      'gg666666g#',
      '#gggggggg#',
      '###gggg###',
    ],
    entities: [
      ['barnacle', 4, 2], ['jellyfish', 5, 4],
    ],
  },
  // ---- cliffs ------------------------------------------------------------
  '0,0,2': {
    name: 'Kell Head',
    legend: 'cliffs', music: 'overworld',
    map: [
      '##########',
      '#gGGGGGGg#',
      '#g.9999.gg',
      '#g......gg',
      '#g.9999.gg',
      '#gGGGGGGgg',
      '#gg""""gg#',
      '###gggg###',
    ],
    entities: [
      ['tektite', 4, 3],
    ],
  },
  '0,1,2': {
    name: 'Wind Shelf',
    legend: 'cliffs', music: 'overworld',
    map: [
      '##########',
      '#gg....gg#',
      'gg.oooo.gg',
      'gg......gg',
      'gg.GGGG.gg',
      'ggg____ggg',
      '#gggggggg#',
      '###gggg###',
    ],
    entities: [
      ['tektite', 3, 2], ['tektite', 6, 4],
    ],
  },
  '0,2,2': {
    name: 'Upper Kell',
    legend: 'cliffs', music: 'overworld',
    map: [
      '###gggg###',
      '#gg....gg#',
      'gg.9999.gg',
      'gg......gg',
      'gg.9999.gg',
      'ggg....ggg',
      '#gggggggg#',
      '###gggg###',
    ],
    entities: [
      ['keese', 4, 3], ['sign', 6, 5, { text: 'The low walls drown at HIGH tide.\nSwim what you cannot climb.' }],
    ],
  },
  '0,3,2': {
    name: 'Kell Corner',
    legend: 'cliffs', music: 'overworld',
    map: [
      '##########',
      '#gGGGGGGg#',
      'gg.o..o.g#',
      'gg......g#',
      'gg.o..o.g#',
      'ggGGGGGGg#',
      '#gggggggg#',
      '###gggg###',
    ],
    entities: [
      ['beetle', 4, 3],
    ],
  },
  // ---- salt --------------------------------------------------------------
  '0,4,2': {
    name: 'South Pan',
    legend: 'salt', music: 'salt',
    map: [
      '###gggg###',
      '#gg3333gg#',
      '#g.3333.gg',
      '#g......gg',
      '#gG....Ggg',
      '#______ggg',
      '#gggggggg#',
      '##########',
    ],
    entities: [
      ['leever', 5, 4],
    ],
  },
  '0,5,2': {
    name: 'Cracked Basin',
    legend: 'salt', music: 'salt',
    map: [
      '###gggg###',
      '#g222222g#',
      'gg2....2gg',
      'gg2.GG.2gg',
      'gg2....2gg',
      'gg222222gg',
      '#gggggggg#',
      '##########',
    ],
    entities: [
      ['zol', 4, 3], ['crab', 2, 2],
    ],
  },
  '0,6,2': {
    name: 'Vault Steps',
    legend: 'salt', music: 'salt',
    map: [
      '###gggg###',
      '#gggggggg#',
      'ggG.oo.Ggg',
      'gg......gg',
      'ggg2222ggg',
      'ggg2222ggg',
      '#ggVVVVgg#',
      '###gggg###',
    ],
    entities: [
      ['sign', 2, 5, { text: 'South, past the gap: the Drowned Wood.' }],
    ],
  },
  '0,7,2': {
    name: 'Pan Corner',
    legend: 'salt', music: 'salt',
    map: [
      '###gggg###',
      '#gGGGGGGg#',
      'gg.oooo.g#',
      'gg......g#',
      'gg.oooo.g#',
      'ggGGGGGGg#',
      '#gggggggg#',
      '##########',
    ],
    entities: [
      ['beetle', 4, 3],
    ],
  },
  // ---- reef --------------------------------------------------------------
  '0,8,2': {
    name: 'Sunken Colonnade',
    legend: 'reef', music: 'reef',
    map: [
      '###gggg###',
      '#gggggggg#',
      '#gq.77.qgg',
      '#g..77..gg',
      '#gq.77.qgg',
      '#ggggggggg',
      '#gggggggg#',
      '###gggg###',
    ],
    entities: [
      ['octorokSea', 4, 4],
    ],
  },
  '0,9,2': {
    name: 'Reef Market',
    legend: 'reef', music: 'reef',
    map: [
      '###gggg###',
      '#gggggggg#',
      'gg.bbbb.gg',
      'gg......gg',
      'gg.bbbb.gg',
      'gggggggggg',
      '#gggggggg#',
      '###gggg###',
    ],
    entities: [
      ['npc', 4, 3, { sprite: 'npc_fisher', dialogue: 'reefFisher' }],
    ],
  },
  '0,10,2': {
    name: 'Drowned Steps',
    legend: 'reef', music: 'reef',
    map: [
      '###gggg###',
      '#gg7777gg#',
      'gg.7777.gg',
      'gg......gg',
      'gg.8888.gg',
      'ggg____ggg',
      '#gggggggg#',
      '###gggg###',
    ],
    entities: [
      ['siren', 3, 2], ['barnacle', 6, 4],
    ],
  },
  '0,11,2': {
    name: 'Outer Reef',
    legend: 'reef', music: 'reef',
    map: [
      '###gggg###',
      '#g666666g#',
      'gg6.qq.6g#',
      'gg......g#',
      'gg6.qq.6g#',
      'gg666666g#',
      '#gggggggg#',
      '###gggg###',
    ],
    entities: [
      ['jellyfish', 4, 3],
    ],
  },
  // ---- cliffs ------------------------------------------------------------
  '0,0,3': {
    name: 'Cistern Path',
    legend: 'cliffs', music: 'overworld',
    map: [
      '###gggg###',
      '#gGGGGGGg#',
      '#g......gg',
      '#g.8888.gg',
      '#g......gg',
      '#g______gg',
      '#gggggggg#',
      '###gggg###',
    ],
    entities: [
      ['tektite', 5, 3],
    ],
  },
  '0,1,3': {
    name: 'Cistern Mouth',
    legend: 'cliffs', music: 'overworld',
    map: [
      '###gggg###',
      '#gg.CC.gg#',
      'ggg....ggg',
      'gg.9999.gg',
      'gg......gg',
      'ggG""""Ggg',
      '#gggggggg#',
      '###gggg###',
    ],
    warps: [
      { x: 4, y: 1, to: { map: 'd4', floor: 0, rx: 3, ry: 7, px: 72, py: 96 } },
    ],
    entities: [
      ['sign', 2, 3, { text: 'CLIFFSIDE CISTERN\nWhat the water hides, the water opens.' }],
      ['keese', 7, 4],
    ],
  },
  '0,2,3': {
    name: 'Kell Ledges',
    legend: 'cliffs', music: 'overworld',
    map: [
      '###gggg###',
      '#gg....gg#',
      'gg.oooo.gg',
      'gg......gg',
      'gg.oooo.gg',
      'ggg....ggg',
      '#gggggggg#',
      '###gggg###',
    ],
    entities: [
      ['tektite', 4, 4], ['pickup', 6, 2, { kind: 'heartPiece' }],
    ],
  },
  '0,3,3': {
    name: 'Cliff Face',
    legend: 'cliffs', music: 'overworld',
    map: [
      '###gggg###',
      '#gGGGGGGg#',
      'gg.9999.g#',
      'gg......g#',
      'gg.9999.g#',
      'ggGGGGGGg#',
      '#gggggggg#',
      '###gggg###',
    ],
    entities: [
      ['keese', 4, 3], ['keese', 6, 4],
    ],
  },
  // ---- wood --------------------------------------------------------------
  '0,4,3': {
    name: 'Wood Edge',
    legend: 'wood', music: 'overworld',
    map: [
      'TTTTTTTTTT',
      'TgG0000GgT',
      'Tf0....0gg',
      'Tf."""".gg',
      'Tg0....0gg',
      'TgG0000Ggg',
      'TggfgggggT',
      'TTTggggTTT',
    ],
    entities: [
      ['zol', 4, 3],
    ],
  },
  '0,5,3': {
    name: 'Rotting Grove',
    legend: 'wood', music: 'overworld',
    map: [
      'TTTTTTTTTT',
      'TgTT..TTgT',
      'gg......fg',
      'gg.0000.gg',
      'gg......gg',
      'gfTT..TTfg',
      'TgggggggfT',
      'TTTggggTTT',
    ],
    entities: [
      ['wisp', 4, 3], ['keese', 2, 4],
    ],
  },
  '0,6,3': {
    name: 'Wood Gate',
    legend: 'wood', music: 'overworld',
    map: [
      'TTTggggTTT',
      'Tfg....ggT',
      'gg.oooo.gg',
      'gf......gg',
      'gg.0000.gg',
      'ggTT..TTfg',
      'TgggggggfT',
      'TTTggggTTT',
    ],
    entities: [
      ['sign', 2, 2, { text: 'North, over the gap: the Salt Pans.' }],
      ['moblin', 6, 4],
    ],
  },
  '0,7,3': {
    name: 'Still Water',
    legend: 'wood', music: 'overworld',
    map: [
      'TTTTTTTTTT',
      'Tg======fT',
      'gg=....=gT',
      'gg."""".gT',
      'gg=....=gT',
      'gg======gT',
      'TgggffgggT',
      'TTTggggTTT',
    ],
    entities: [
      ['anglerfry', 4, 3],
    ],
  },
  // ---- reef --------------------------------------------------------------
  '0,8,3': {
    name: 'Reef Foot',
    legend: 'reef', music: 'reef',
    map: [
      '###gggg###',
      '#gggggggg#',
      '#g.6666.gg',
      '#g......gg',
      '#g.6666.gg',
      '#gTTTTTTgg',
      '#gggggggg#',
      '##########',
    ],
    entities: [
      ['crab', 4, 3],
    ],
  },
  '0,9,3': {
    name: 'Barnacle Bank',
    legend: 'reef', music: 'reef',
    map: [
      '###gggg###',
      '#gggggggg#',
      'gg......gg',
      'gg.7777.gg',
      'gg......gg',
      'ggTTTTTTgg',
      '#gggggggg#',
      '##########',
    ],
    entities: [
      ['barnacle', 3, 3], ['barnacle', 6, 3],
    ],
  },
  '0,10,3': {
    name: 'Palace Causeway',
    legend: 'reef', music: 'reef',
    map: [
      '###gggg###',
      '#gg8888gg#',
      'gg.8888.gg',
      'gg......gg',
      'gg.6666.gg',
      'ggTTTTTTgg',
      '#gggggggg#',
      '##########',
    ],
    entities: [
      ['octorokSea', 5, 3],
    ],
  },
  '0,11,3': {
    name: 'Reef Edge',
    legend: 'reef', music: 'reef',
    map: [
      '###gggg###',
      '#g......g#',
      'gg.oooo.g#',
      'gg......g#',
      'gg.7777.g#',
      'ggTTTTTTg#',
      '#gggggggg#',
      '##########',
    ],
    entities: [
      ['pickup', 4, 2, { kind: 'fairy' }],
    ],
  },
  // ---- cliffs ------------------------------------------------------------
  '0,0,4': {
    name: 'Low Kell',
    legend: 'cliffs', music: 'overworld',
    map: [
      '###gggg###',
      '#gGGGGGGg#',
      '#g......gg',
      '#g.8888.gg',
      '#g......gg',
      '#gG""""Ggg',
      '#gggggggg#',
      '###gggg###',
    ],
    entities: [
      ['tektite', 4, 3],
    ],
  },
  '0,1,4': {
    name: 'Boulder Run',
    legend: 'cliffs', music: 'overworld',
    map: [
      '###gggg###',
      '#gg....gg#',
      'gg.oooo.gg',
      'gg.o..o.gg',
      'gg.oooo.gg',
      'ggg....ggg',
      '#gg""""gg#',
      '###gggg###',
    ],
    entities: [
      ['beetle', 4, 5], ['moblin', 2, 2],
    ],
  },
  '0,2,4': {
    name: 'Kell Basin',
    legend: 'cliffs', music: 'overworld',
    map: [
      '###gggg###',
      '#gg....gg#',
      'gg.9999.gg',
      'gg......gg',
      'gg.9999.gg',
      'ggg....ggg',
      '#gggggggg#',
      '###gggg###',
    ],
    entities: [
      ['tektite', 3, 3], ['tektite', 6, 3],
    ],
  },
  '0,3,4': {
    name: 'The Deep Cut',
    legend: 'cliffs', music: 'overworld',
    map: [
      '###gggg###',
      '#gGGGGGGg#',
      'gg......gg',
      'gg.====.gg',
      'gg......gg',
      'gg______gg',
      '#gggggggg#',
      '###gggg###',
    ],
    entities: [
      ['sign', 2, 2, { text: 'East across the cut: the Drowned Wood.\nYou will need to swim.' }],
    ],
  },
  // ---- wood --------------------------------------------------------------
  '0,4,4': {
    name: 'Shrine Path',
    legend: 'wood', music: 'overworld',
    map: [
      'TTTggggTTT',
      'TgG0000GgT',
      'gg......gg',
      'gg.TT.T.gg',
      'gg......fg',
      'ggG0000Ggg',
      'TggggggggT',
      'TTTggggTTT',
    ],
    entities: [
      ['zol', 5, 4], ['keese', 3, 2],
    ],
  },
  '0,5,4': {
    name: 'Shrine Mouth',
    legend: 'wood', music: 'overworld',
    map: [
      'TTTggggTTT',
      'Tgg.CC.ggT',
      'ggf....ggg',
      'gg.0000.gg',
      'gg......gg',
      'ggTT..TTgg',
      'TggggggggT',
      'TTTggggTTT',
    ],
    warps: [
      { x: 4, y: 1, to: { map: 'd5', floor: 0, rx: 3, ry: 7, px: 72, py: 96 } },
    ],
    entities: [
      ['sign', 2, 3, { text: 'DROWNED WOOD SHRINE\nRide what floats.' }],
      ['wisp', 7, 4],
    ],
  },
  '0,6,4': {
    name: 'Log Drift',
    legend: 'wood', music: 'overworld',
    map: [
      'TTTggggTTT',
      'Tgg....ggT',
      'gg.5555.gg',
      'gg......gg',
      'gg.5555.gg',
      'ggg....ggg',
      'TffgfffggT',
      'TTTggggTTT',
    ],
    entities: [
      ['anglerfry', 4, 3], ['pickup', 2, 5, { kind: 'heartPiece' }],
    ],
  },
  '0,7,4': {
    name: 'Drowned Hollow',
    legend: 'wood', music: 'overworld',
    map: [
      'TTTggggTTT',
      'Tg======gT',
      'gg......gT',
      'gf.====.fT',
      'gf......gT',
      'gg======gT',
      'TggggggggT',
      'TTTggggTTT',
    ],
    entities: [
      ['anglerfry', 5, 3], ['jellyfish', 3, 4],
    ],
  },
  // ---- coral -------------------------------------------------------------
  '0,8,4': {
    name: 'Coral Shelf',
    legend: 'coral', music: 'reef',
    map: [
      '##########',
      '#g666666g#',
      '#g6____6gg',
      '#g......gg',
      '#g6....6gg',
      '#g666666gg',
      '#gggggggg#',
      '###gggg###',
    ],
    entities: [
      ['crab', 4, 3], ['urchin', 6, 4],
    ],
  },
  '0,9,4': {
    name: 'Anemone Field',
    legend: 'coral', music: 'reef',
    map: [
      '##########',
      '#gggggggg#',
      'gg.6666.gg',
      'gg.6666.gg',
      'gg.6666.gg',
      'gggggggggg',
      '#gggggggg#',
      '###gggg###',
    ],
    entities: [
      ['urchin', 3, 3], ['urchin', 6, 3], ['jellyfish', 4, 4],
    ],
  },
  '0,10,4': {
    name: 'Spire Coral',
    legend: 'coral', music: 'reef',
    map: [
      '##########',
      '#gg....gg#',
      'gg.7777.gg',
      'gg......gg',
      'gg.7777.gg',
      'ggg....ggg',
      '#gggggggg#',
      '###gggg###',
    ],
    entities: [
      ['octorokSea', 4, 3],
    ],
  },
  '0,11,4': {
    name: 'Outer Coral',
    legend: 'coral', music: 'reef',
    map: [
      '##########',
      '#g666666g#',
      'gg6.oo.6g#',
      'gg......g#',
      'gg6.oo.6g#',
      'gg666666g#',
      '#gggggggg#',
      '###gggg###',
    ],
    entities: [
      ['crab', 4, 3], ['pickup', 5, 5, { kind: 'heartPiece' }],
    ],
  },
  // ---- cliffs ------------------------------------------------------------
  '0,0,5': {
    name: 'Kell Foot',
    legend: 'cliffs', music: 'overworld',
    map: [
      '###gggg###',
      '#gGGGGGGg#',
      '#g.oooo.gg',
      '#g......gg',
      '#g.oooo.gg',
      '#gTTTTTTgg',
      '#gggggggg#',
      '##########',
    ],
    entities: [
      ['beetle', 4, 3],
    ],
  },
  '0,1,5': {
    name: 'Marsh Stair',
    legend: 'cliffs', music: 'overworld',
    map: [
      '###gggg###',
      '#gg....gg#',
      'gg.o..o.gg',
      'gg......gg',
      'ggg....ggg',
      'ggg____ggg',
      '#gg....gg#',
      '###gggg###',
    ],
    entities: [
      ['sign', 6, 2, { text: 'North: the Cliffs of Kell.\nSouth: the bog.' }],
    ],
  },
  '0,2,5': {
    name: 'Sunken Shelf',
    legend: 'cliffs', music: 'overworld',
    map: [
      '###gggg###',
      '#gg....gg#',
      'gg.9999.gg',
      'gg......gg',
      'gg.9999.gg',
      'ggTTTTTTgg',
      '#gggggggg#',
      '##########',
    ],
    entities: [
      ['keese', 4, 3],
    ],
  },
  '0,3,5': {
    name: 'Kell Spur',
    legend: 'cliffs', music: 'overworld',
    map: [
      '###gggg###',
      '#gGGGGGGg#',
      'gg.oooo.g#',
      'gg......g#',
      'gg.oooo.g#',
      'ggTTTTTTg#',
      '#gggggggg#',
      '##########',
    ],
    entities: [
      ['moblin', 4, 3], ['pickup', 2, 2, { kind: 'rupee20' }],
    ],
  },
  // ---- wood --------------------------------------------------------------
  '0,4,5': {
    name: 'Bog Trees',
    legend: 'wood', music: 'overworld',
    map: [
      'TTTggggTTT',
      'TgTT..TTgT',
      'Tg......fg',
      'Tg.0000.fg',
      'Tg......gg',
      'TgTT..TTgg',
      'TggffgfggT',
      'TTTggggTTT',
    ],
    entities: [
      ['zol', 4, 3], ['keese', 6, 2],
    ],
  },
  '0,5,5': {
    name: 'Wood Heart',
    legend: 'wood', music: 'overworld',
    map: [
      'TTTggggTTT',
      'Tgg....ggT',
      'gg.0000.fg',
      'gg.0000.fg',
      'gg.0000.gg',
      'ggg____fgg',
      'TggggggffT',
      'TTTggggTTT',
    ],
    entities: [
      ['wisp', 4, 3], ['npc', 2, 2, { sprite: 'npc_child', dialogue: 'woodChild' }],
    ],
  },
  '0,6,5': {
    name: 'Sunken Glade',
    legend: 'wood', music: 'overworld',
    map: [
      'TTTggggTTT',
      'Tgg....ggT',
      'gg.5555.fg',
      'gg......fg',
      'gg.0000.gg',
      'ggg....ffg',
      'TggggggggT',
      'TTTggggTTT',
    ],
    entities: [
      ['zol', 3, 4], ['moblin', 6, 2],
    ],
  },
  '0,7,5': {
    name: 'Wood Verge',
    legend: 'wood', music: 'overworld',
    map: [
      'TTTggggTTT',
      'TgTTTTTTgT',
      'gg.====.gT',
      'gg......gT',
      'gg.====.fT',
      'gfTTTTTTfT',
      'TggggggffT',
      'TTTTTTTTTT',
    ],
    entities: [
      ['anglerfry', 4, 3],
    ],
  },
  // ---- coral -------------------------------------------------------------
  '0,8,5': {
    name: 'Reef Wall',
    legend: 'coral', music: 'reef',
    map: [
      '###gggg###',
      '#g666666g#',
      '#g......gg',
      '#g.6666.gg',
      '#g......gg',
      '#gTTTTTTgg',
      '#gggggggg#',
      '##########',
    ],
    entities: [
      ['urchin', 4, 3],
    ],
  },
  '0,9,5': {
    name: 'Coral Hollow',
    legend: 'coral', music: 'reef',
    map: [
      '###gggg###',
      '#gggggggg#',
      'gg.bbbb.gg',
      'gg......gg',
      'gg.6666.gg',
      'ggTTTTTTgg',
      '#gggggggg#',
      '##########',
    ],
    entities: [
      ['npc', 4, 2, { sprite: 'npc_villager2', dialogue: 'coralDiver' }],
    ],
  },
  '0,10,5': {
    name: 'Spire Mouth',
    legend: 'coral', music: 'reef',
    map: [
      '###gggg###',
      '#gg.CC.gg#',
      'ggg....ggg',
      'gg.6666.gg',
      'gg......gg',
      'ggg""""ggg',
      '#gg....gg#',
      '###gggg###',
    ],
    warps: [
      { x: 4, y: 1, to: { map: 'd2', floor: 0, rx: 3, ry: 7, px: 72, py: 96 } },
    ],
    entities: [
      ['sign', 2, 3, { text: 'CORAL SPIRE\nLet the sea carry you up.' }],
    ],
  },
  '0,11,5': {
    name: 'Coral Foot',
    legend: 'coral', music: 'reef',
    map: [
      '###gggg###',
      '#g666666g#',
      'gg6____6g#',
      'gg......g#',
      'gg6....6g#',
      'ggTTTTTTg#',
      '#gggggggg#',
      '##########',
    ],
    entities: [
      ['crab', 5, 3], ['urchin', 3, 4],
    ],
  },
  // ---- marsh -------------------------------------------------------------
  '0,0,6': {
    name: 'Bog Head',
    legend: 'marsh', music: 'marsh',
    map: [
      'TTTTTTTTTT',
      'TgTT..TTgT',
      'Tf......gg',
      'Tf.!!!!.gg',
      'Tg......gg',
      'TgTT..TTgg',
      'TggggggggT',
      'TTTggggTTT',
    ],
    entities: [
      ['zol', 4, 3],
    ],
  },
  '0,1,6': {
    name: 'Bog Stair',
    legend: 'marsh', music: 'marsh',
    map: [
      'TTTggggTTT',
      'Tgg#X##ggT',
      'gg.!!!!.gg',
      'gg......gg',
      'gg.!!!!.fg',
      'ggg....ffg',
      'Tgg""""ffT',
      'TTTggggTTT',
    ],
    entities: [
      ['leever', 4, 3], ['sign', 2, 5, { text: 'North: boulders, and the cliffs beyond.' }],
    ],
  },
  '0,2,6': {
    name: 'Reedbank',
    legend: 'marsh', music: 'marsh',
    map: [
      'TTTTTTTTTT',
      'TgTT..TTgT',
      'gg......gT',
      'gg.5555.gT',
      'gf......gT',
      'ggTT..TTgT',
      'TfggggfffT',
      'TTTggggTTT',
    ],
    entities: [
      ['zol', 3, 4], ['keese', 6, 2],
    ],
  },
  // ---- coast -------------------------------------------------------------
  '0,3,6': {
    name: 'Bluff Hollow',
    legend: 'coast', music: 'overworld',
    map: [
      'TTTTTTTTTT',
      'TgTTTTTTfT',
      'Tg.bbbb.gT',
      'Tf......gT',
      'Tf.x..o.gT',
      'Tgg....ggT',
      'Tgg....ggT',
      'TTTggggTTT',
    ],
    entities: [
      ['sign', 6, 2, { text: 'Someone has been digging here.' }],
    ],
    buried: [[3, 4, 'rupee20']],
  },
  // ---- wood --------------------------------------------------------------
  '0,4,6': {
    name: 'South Wood',
    legend: 'wood', music: 'overworld',
    map: [
      'TTTggggTTT',
      'TgTT..TTgT',
      'Tg......gg',
      'Tg.0000.fg',
      'Tg......gg',
      'TfTTTTTTgg',
      'TggggggggT',
      'TTTTTTTTTT',
    ],
    entities: [
      ['zol', 4, 3],
    ],
  },
  '0,5,6': {
    name: 'The Wading',
    legend: 'wood', music: 'overworld',
    map: [
      'TTTggggTTT',
      'Tgg....ggT',
      'gg.====.fg',
      'gf.====.fg',
      'gf.====.gg',
      'gfg....ggg',
      'Tfg....ggT',
      'TTTggggTTT',
    ],
    entities: [
      ['sign', 2, 5, { text: 'Only a swimmer goes north from here.' }],
    ],
  },
  '0,6,6': {
    name: 'Wood Foot',
    legend: 'wood', music: 'overworld',
    map: [
      'TTTggggTTT',
      'TgTT..TTfT',
      'gf......gT',
      'gg.0000.gT',
      'gg......gT',
      'ggTTTTTTgT',
      'TggggggfgT',
      'TTTTTTTTTT',
    ],
    entities: [
      ['keese', 4, 3], ['pickup', 6, 4, { kind: 'rupee20' }],
    ],
  },
  // ---- dunes -------------------------------------------------------------
  '0,7,6': {
    name: 'Dune Head',
    legend: 'dunes', music: 'overworld',
    map: [
      'TTTTTTTTTT',
      'TgTT..TTgT',
      'Tg......gg',
      'Tg.1111.gg',
      'Tg......gg',
      'Tgg""""ggg',
      'TggggggggT',
      'TTTggggTTT',
    ],
    entities: [
      ['crab', 4, 3],
    ],
  },
  '0,8,6': {
    name: 'North Dunes',
    legend: 'dunes', music: 'overworld',
    map: [
      'TTTTTTTTTT',
      'Tgg....ggT',
      'gg.vvvv.gg',
      'gg......gg',
      'gg.1111.gg',
      'ggg....ggg',
      'TggggggggT',
      'TTTggggTTT',
    ],
    entities: [
      ['leever', 4, 3], ['crab', 6, 4],
    ],
  },
  '0,9,6': {
    name: 'Sandbar Run',
    legend: 'dunes', music: 'overworld',
    map: [
      'TTTTTTTTTT',
      'Tgg....ggT',
      'gg.1111.gg',
      'gg.1111.gg',
      'gg.1111.gg',
      'ggg....ggg',
      'TggggggggT',
      'TTTggggTTT',
    ],
    entities: [
      ['crab', 3, 3], ['octorokSea', 6, 4],
    ],
  },
  '0,10,6': {
    name: 'Feather Gap',
    legend: 'dunes', music: 'overworld',
    map: [
      'TTTggggTTT',
      'Tgg....ggT',
      'gg.=..=.gg',
      'gg......gg',
      'gg.=..=.gg',
      'ggg....ggg',
      'TggggggggT',
      'TTTggggTTT',
    ],
    entities: [
      ['sign', 4, 4, { text: 'North lies the reef.\nThe gaps are a single stride wide.' }],
    ],
  },
  '0,11,6': {
    name: 'East Dunes',
    legend: 'dunes', music: 'overworld',
    map: [
      'TTTTTTTTTT',
      'TgTTTTTTgT',
      'gg.OO.O.gT',
      'gg......gT',
      'gg.1111.gT',
      'ggg....ggT',
      'TggggggggT',
      'TTTggggTTT',
    ],
    entities: [
      ['leever', 4, 3], ['pickup', 6, 2, { kind: 'rupee20' }],
    ],
  },
  // ---- marsh -------------------------------------------------------------
  '0,0,7': {
    name: 'Mire',
    legend: 'marsh', music: 'marsh',
    map: [
      'TTTggggTTT',
      'TgTTTTTTgT',
      'Tf.!!!!.gg',
      'Tf......gg',
      'Tg.!!!!.fg',
      'TgTTTTTTfg',
      'TggggggggT',
      'TTTggggTTT',
    ],
    entities: [
      ['leever', 4, 3],
    ],
  },
  '0,1,7': {
    name: 'Sanctum Path',
    legend: 'marsh', music: 'marsh',
    map: [
      'TTTggggTTT',
      'Tgg....ggT',
      'gg......gg',
      'gg.!!!!.gg',
      'gg......gg',
      'ggf""""ggg',
      'TggggggffT',
      'TTTggggTTT',
    ],
    entities: [
      ['zol', 5, 3], ['pickup', 2, 2, { kind: 'rupee20' }],
    ],
  },
  '0,2,7': {
    name: 'Bog Causeway',
    legend: 'marsh', music: 'marsh',
    map: [
      'TTTggggTTT',
      'TfTTTTTTgT',
      'gf......Xg',
      'gg.5555.%g',
      'gg.5555.%g',
      'ggTTTTTT%g',
      'TgffgggggT',
      'TTTggggTTT',
    ],
    entities: [
      ['sign', 2, 1, { text: 'The causeway wades only at LOW tide.' }],
      ['zol', 6, 4],
    ],
  },
  // ---- coast -------------------------------------------------------------
  '0,3,7': {
    name: 'West Bluff',
    legend: 'coast', music: 'overworld',
    map: [
      'TTTggggTTT',
      'Tgg....ggT',
      'gg.C.>..gg',
      'gf...>..gg',
      'gfGgg>gGgg',
      'ggg..>.ggg',
      'Tgg....ggT',
      'TTTggggTTT',
    ],
    warps: [
      { x: 3, y: 2, to: { map: 'cave1', floor: 0, rx: 0, ry: 0, px: 72, py: 96 } },
    ],
    entities: [
      ['sign', 5, 3, { text: 'A grotto in the bluff.\nSomething glitters within.' }],
      ['octorok', 6, 4],
    ],
  },
  '0,4,7': {
    name: 'Tidewatch Village',
    legend: 'coast', music: 'overworld',
    map: [
      'TTTTTTTTTT',
      'TgcCcgcCcT',
      'gg......fg',
      'ggG""""Gfg',
      'gf......gg',
      'ggb.oo.bgg',
      'TggggfgggT',
      'TTTggggTTT',
    ],
    warps: [
      { x: 3, y: 1, to: { map: 'houseShop', floor: 0, rx: 0, ry: 0, px: 72, py: 96 } },
      { x: 7, y: 1, to: { map: 'houseMaku', floor: 0, rx: 0, ry: 0, px: 72, py: 96 } },
    ],
    entities: [
      ['sign', 1, 4, { text: 'TIDEWATCH VILLAGE\nEast: the Shallows. Mind the tide.' }],
      ['npc', 6, 2, { sprite: 'npc_villager', pal: 'npc', wander: true, dialogue: 'villager1' }],
      ['npc', 3, 4, { sprite: 'npc_villager2', wander: true, dialogue: 'villager2' }],
      ['npc', 8, 4, { sprite: 'npc_child', wander: true, dialogue: 'villageChild' }],
      ['giver', 7, 2, {
        sprite: 'npc_elder', dialogue: 'digger', waiting: 'diggerWait',
        after: 'diggerAfter', flag: 'gotShovel', item: 'shovel', level: 1,
        needEssences: 2,
      }],
    ],
  },
  '0,5,7': {
    name: 'Village East',
    legend: 'coast', music: 'overworld',
    map: [
      'TTTggggTTT',
      'TgTT..TTgT',
      'gg..<.111g',
      'gg.v<.111g',
      'gf..<.111g',
      'ggTT..TTgg',
      'TggggggggT',
      'TTTggggTTT',
    ],
    entities: [
      ['octorok', 4, 3],
      ['npc', 6, 4, { sprite: 'npc_fisher', dialogue: 'coastFisher' }],
    ],
  },
  '0,6,7': {
    name: 'Sunken Reef',
    legend: 'coast', music: 'overworld',
    map: [
      'TTTTTTTTTT',
      'Tgg....gfT',
      'gg.1111.gg',
      'gg.1C11.gg',
      'gg.1.11.gg',
      'ggg....gfg',
      'TgffgggggT',
      'TTTggggTTT',
    ],
    warps: [
      { x: 4, y: 3, to: { map: 'cave2', floor: 0, rx: 0, ry: 0, px: 72, py: 96 } },
    ],
    entities: [
      ['crab', 6, 4], ['sign', 2, 1, { text: 'At LOW tide the reef is a road.' }],
    ],
  },
  // ---- dunes -------------------------------------------------------------
  '0,7,7': {
    name: 'Shallows Gate',
    legend: 'dunes', music: 'overworld',
    map: [
      'TTTggggTTT',
      'Tgg....ggT',
      'gg......gg',
      'gg.1111.gg',
      'gg.1111.gg',
      'ggg....ggg',
      'TggggggggT',
      'TTTggggTTT',
    ],
    entities: [
      ['sign', 2, 1, { text: 'THE SHALLOWS\nAt LOW tide the sandbar walks you east.' }],
      ['crab', 6, 4],
    ],
  },
  '0,8,7': {
    name: 'Grotto Approach',
    legend: 'dunes', music: 'overworld',
    map: [
      'TTTggggTTT',
      'Tgg....ggT',
      'gg.BB.B.gg',
      'gg......gg',
      'gg.1111.gg',
      'ggg....ggg',
      'TggggggggT',
      'TTTggggTTT',
    ],
    entities: [
      ['octorok', 4, 3], ['crab', 6, 4],
    ],
  },
  '0,9,7': {
    name: 'Dune Bowl',
    legend: 'dunes', music: 'overworld',
    map: [
      'TTTggggTTT',
      'Tgg....ggT',
      'gg.vv<v.gg',
      'gg.v.<v.gg',
      'gg.vv<v.gg',
      'ggg..<.ggg',
      'TggggggggT',
      'TTTggggTTT',
    ],
    entities: [
      ['leever', 4, 3], ['leever', 6, 4],
    ],
  },
  '0,10,7': {
    name: 'Tidepools',
    legend: 'dunes', music: 'overworld',
    map: [
      'TTTggggTTT',
      'Tgg....ggT',
      'gg.2222.gg',
      'gg......gg',
      'gg.2222.gg',
      'ggg....ggg',
      'TggggggggT',
      'TTTggggTTT',
    ],
    entities: [
      ['crab', 4, 3], ['urchin', 6, 4],
    ],
  },
  '0,11,7': {
    name: 'Far Dunes',
    legend: 'dunes', music: 'overworld',
    map: [
      'TTTggggTTT',
      'TgTTTTTTgT',
      'gg.O..O.gT',
      'gg......gT',
      'gg.1111.gT',
      'ggg....ggT',
      'TggggggggT',
      'TTTggggTTT',
    ],
    entities: [
      ['leever', 5, 3],
    ],
  },
  // ---- marsh -------------------------------------------------------------
  '0,0,8': {
    name: 'Deep Mire',
    legend: 'marsh', music: 'marsh',
    map: [
      'TTTggggTTT',
      'TgTTTTTTfT',
      'Tg.!!!!.fg',
      'Tg.!!!!.gg',
      'Tg.!!!!.gg',
      'TfTTTTTTgg',
      'TggggggggT',
      'TTTggggTTT',
    ],
    entities: [
      ['leever', 3, 3], ['leever', 6, 4],
    ],
  },
  '0,1,8': {
    name: 'Sanctum Mouth',
    legend: 'marsh', music: 'marsh',
    map: [
      'TTTggggTTT',
      'Tgf.CC.ggT',
      'ggf....ggg',
      'gg.!!!!.gg',
      'gg......gg',
      'ggg""""ggg',
      'TggggggggT',
      'TTTggggTTT',
    ],
    warps: [
      { x: 4, y: 1, to: { map: 'd3', floor: 0, rx: 3, ry: 7, px: 72, py: 96 } },
    ],
    entities: [
      ['sign', 2, 3, { text: 'BOGWATER SANCTUM\nThe current runs at one height only.' }],
      ['zol', 7, 4],
    ],
  },
  '0,2,8': {
    name: 'Sunken Reeds',
    legend: 'marsh', music: 'marsh',
    map: [
      'TTTggggTTT',
      'TgTTTTTTgT',
      'gg......gT',
      'gg.5555.gT',
      'gg......gT',
      'ggTTTTTTgT',
      'TggffggggT',
      'TTTggggTTT',
    ],
    entities: [
      ['keese', 4, 3], ['zol', 6, 2],
    ],
  },
  // ---- coast -------------------------------------------------------------
  '0,3,8': {
    name: 'Shell Beach',
    legend: 'coast', music: 'overworld',
    map: [
      'TTTggggTTT',
      'Tgg....ggT',
      'Tg.....ogg',
      'Tg.1111.gg',
      'Tg.1111.gg',
      'Tgf....ggg',
      'TgfggfgggT',
      'TTTggggTTT',
    ],
    entities: [
      ['crab', 4, 4], ['octorok', 2, 2],
    ],
  },
  '0,4,8': {
    name: 'Village Shore',
    legend: 'coast', music: 'overworld',
    map: [
      'TTTggggTTT',
      'Tgg....ggT',
      'gg......gg',
      'gg.2222.gg',
      'gg.2222.gg',
      'ggg....ggg',
      'TgggggfggT',
      'TTTggggTTT',
    ],
    entities: [
      ['npc', 2, 2, { sprite: 'npc_child', dialogue: 'coastChild' }],
      ['crab', 6, 4],
    ],
  },
  '0,5,8': {
    name: 'Driftwood Strand',
    legend: 'coast', music: 'overworld',
    map: [
      'TTTggggTTT',
      'Tgg....fgT',
      'gg.q..q.gg',
      'gg......gg',
      'gg.1111.gg',
      'ggg....ggg',
      'TgggfggfgT',
      'TTTggggTTT',
    ],
    entities: [
      ['octorok', 4, 4], ['pickup', 6, 2, { kind: 'rupee20' }],
    ],
  },
  '0,6,8': {
    name: 'East Strand',
    legend: 'coast', music: 'overworld',
    map: [
      'TTTggggTTT',
      'Tfg....ggT',
      'gf......gg',
      'gg.1111.gg',
      'gg.1111.gg',
      'gfg....ggg',
      'TffggggggT',
      'TTTggggTTT',
    ],
    entities: [
      ['crab', 3, 3], ['crab', 6, 4],
    ],
  },
  // ---- dunes -------------------------------------------------------------
  '0,7,8': {
    name: 'Dune Crossing',
    legend: 'dunes', music: 'overworld',
    map: [
      'TTTggggTTT',
      'Tgg....ggT',
      'gg.B..B.gg',
      'gg......gg',
      'gg.1111.gg',
      'ggg....ggg',
      'TggggggggT',
      'TTTggggTTT',
    ],
    entities: [
      ['octorok', 4, 3], ['crab', 6, 4],
    ],
  },
  '0,8,8': {
    name: 'Grotto Mouth',
    legend: 'dunes', music: 'overworld',
    map: [
      'TTTggggTTT',
      'Tgg.CC.ggT',
      'ggg....ggg',
      'gg.1111.gg',
      'gg......gg',
      'ggg""""ggg',
      'TggggggggT',
      'TTTggggTTT',
    ],
    warps: [
      { x: 4, y: 1, to: { map: 'd1', floor: 0, rx: 3, ry: 7, px: 72, py: 96 } },
    ],
    entities: [
      ['sign', 2, 3, { text: 'TIDEWASH GROTTO\nDrain it, then walk it.' }],
      ['crab', 7, 4],
    ],
  },
  '0,9,8': {
    name: 'Salt Bar',
    legend: 'dunes', music: 'overworld',
    map: [
      'TTTggggTTT',
      'Tgg....ggT',
      'gg.1111.gg',
      'gg......gg',
      'gg.1111.gg',
      'ggg....ggg',
      'TggggggggT',
      'TTTggggTTT',
    ],
    entities: [
      ['octorokSea', 4, 3], ['crab', 6, 4],
    ],
  },
  '0,10,8': {
    name: 'Shell Flats',
    legend: 'dunes', music: 'overworld',
    map: [
      'TTTggggTTT',
      'Tgg....ggT',
      'gg.4444.gg',
      'gg.4444.gg',
      'gg.4444.gg',
      'ggg....ggg',
      'TggggggggT',
      'TTTggggTTT',
    ],
    entities: [
      ['urchin', 4, 3], ['pickup', 6, 4, { kind: 'heartPiece' }],
    ],
  },
  '0,11,8': {
    name: 'Dune Corner',
    legend: 'dunes', music: 'overworld',
    map: [
      'TTTggggTTT',
      'TgTTTTTTgT',
      'gg.x..O.gT',
      'gg......gT',
      'gg.1111.gT',
      'ggg....ggT',
      'TggggggggT',
      'TTTggggTTT',
    ],
    entities: [
      ['leever', 5, 4],
    ],
    buried: [[2, 2, 'rupee20']],
  },
  // ---- marsh -------------------------------------------------------------
  '0,0,9': {
    name: 'Bog Foot',
    legend: 'marsh', music: 'marsh',
    map: [
      'TTTggggTTT',
      'TgTTTTTTgT',
      'Tg.!!!!.gg',
      'Tg......gg',
      'Tg.oooo.gg',
      'TfTTTTTTgg',
      'TgTTTTTTgT',
      'TTTTTTTTTT',
    ],
    entities: [
      ['leever', 4, 2],
    ],
  },
  '0,1,9': {
    name: 'Witchs Hollow',
    legend: 'marsh', music: 'marsh',
    map: [
      'TTTggggTTT',
      'Tgg....gfT',
      'gg.bbbb.gg',
      'gf......gg',
      'gf.x..x.gg',
      'ggTTTTTTgg',
      'TgTTTTTTgT',
      'TTTTTTTTTT',
    ],
    entities: [
      ['npc', 5, 2, { sprite: 'npc_elder', dialogue: 'bogWitch' }],
    ],
    buried: [[3, 4, 'heartPiece']],
  },
  '0,2,9': {
    name: 'Marsh Corner',
    legend: 'marsh', music: 'marsh',
    map: [
      'TTTggggTTT',
      'TgTTTTTTgT',
      'gg......gT',
      'gg.!!!!.fT',
      'gg......fT',
      'ggTTTTTTgT',
      'TgTTTTTTgT',
      'TTTTTTTTTT',
    ],
    entities: [
      ['zol', 4, 3],
    ],
  },
  // ---- coast -------------------------------------------------------------
  '0,3,9': {
    name: 'South Bluff',
    legend: 'coast', music: 'overworld',
    map: [
      'TTTggggTTT',
      'Tff....ggT',
      'Tg.oooo.gg',
      'Tg......gg',
      'Tg.x....gg',
      'TgTTTTTTfg',
      'TgTTTTTTgT',
      'TTTTTTTTTT',
    ],
    entities: [
      ['octorok', 6, 3],
    ],
    buried: [[3, 4, 'rupee20']],
  },
  '0,4,9': {
    name: 'Fishing Stones',
    legend: 'coast', music: 'overworld',
    map: [
      'TTTggggTTT',
      'Tgg....ggT',
      'gg......gg',
      'gg.3333.gg',
      'gg.3333.gg',
      'gfTTTTTTgg',
      'TfTTTTTTgT',
      'TTTTTTTTTT',
    ],
    entities: [
      ['npc', 2, 2, { sprite: 'npc_fisher', dialogue: 'stoneFisher' }],
      ['crab', 6, 4],
    ],
  },
  '0,5,9': {
    name: 'South Sands',
    legend: 'coast', music: 'overworld',
    map: [
      'TTTggggTTT',
      'Tfg....fgT',
      'gg......gg',
      'gg.1111.gg',
      'gg.1111.gg',
      'ggTTTTTTgg',
      'TgTTTTTTgT',
      'TTTTTTTTTT',
    ],
    entities: [
      ['octorok', 4, 3],
    ],
  },
  '0,6,9': {
    name: 'Reef Pocket',
    legend: 'coast', music: 'overworld',
    map: [
      'TTTggggTTT',
      'TgTTTTTTgT',
      'gg......gT',
      'gf.4444.gT',
      'gf.4444.fT',
      'ggTTTTTTgT',
      'TfTTTTTTgT',
      'TTTTTTTTTT',
    ],
    entities: [
      ['pickup', 4, 4, { kind: 'rupee20' }],
      ['sign', 2, 1, { text: 'Only the drained sea shows this floor.' }],
    ],
  },
  // ---- dunes -------------------------------------------------------------
  '0,7,9': {
    name: 'South Shallows',
    legend: 'dunes', music: 'overworld',
    map: [
      'TTTggggTTT',
      'Tgg....ggT',
      'Tg......gg',
      'Tg.1111.gg',
      'Tg.1111.gg',
      'TgTTTTTTgg',
      'TgTTTTTTgT',
      'TTTTTTTTTT',
    ],
    entities: [
      ['crab', 4, 3],
    ],
  },
  '0,8,9': {
    name: 'Wrecked Hull',
    legend: 'dunes', music: 'overworld',
    map: [
      'TTTggggTTT',
      'Tgg....ggT',
      'gg.qqqq.gg',
      'gg......gg',
      'gg.4444.gg',
      'ggTTTTTTgg',
      'TgTTTTTTgT',
      'TTTTTTTTTT',
    ],
    entities: [
      ['npc', 2, 2, { sprite: 'npc_villager', dialogue: 'wreckSurvivor' }],
      ['crab', 6, 4],
    ],
  },
  '0,9,9': {
    name: 'Deep Bar',
    legend: 'dunes', music: 'overworld',
    map: [
      'TTTggggTTT',
      'Tgg....ggT',
      'gg.4444.gg',
      'gg.4444.gg',
      'gg.4444.gg',
      'ggTTTTTTgg',
      'TgTTTTTTgT',
      'TTTTTTTTTT',
    ],
    entities: [
      ['urchin', 4, 3], ['octorokSea', 6, 4],
    ],
  },
  '0,10,9': {
    name: 'Sunken Cove',
    legend: 'dunes', music: 'overworld',
    map: [
      'TTTggggTTT',
      'Tgg....ggT',
      'gg......gg',
      'gg.5555.gg',
      'gg.5555.gg',
      'ggTTTTTTgg',
      'TgTTTTTTgT',
      'TTTTTTTTTT',
    ],
    entities: [
      ['octorokSea', 4, 3], ['siren', 6, 4],
    ],
  },
  '0,11,9': {
    name: 'Worlds Edge',
    legend: 'dunes', music: 'overworld',
    map: [
      'TTTggggTTT',
      'TgTTTTTTgT',
      'gg.OOOO.gT',
      'gg......gT',
      'gg.1111.gT',
      'ggTTTTTTgT',
      'TgTTTTTTgT',
      'TTTTTTTTTT',
    ],
    entities: [
      ['sign', 4, 2, { text: 'Nothing past here but open sea.' }],
    ],
  },
};

// Village interiors. Both are one-room maps warped into from Tidewatch Village.
function installHouses() {
  registerMap({
    id: 'houseShop',
    kind: 'interior',
    name: 'Tidewatch Shop',
    w: 1, h: 1, floors: 1,
    legend: 'house', music: 'shop', tint: 'cave', scroll: false,
    rooms: {
      '0,0,0': {
        map: [
          '##########',
          '#........#',
          '#........#',
          '#........#',
          '#........#',
          '#........#',
          '#....o...#',
          '##########',
        ],
        entities: [
          ['npc', 2, 2, { sprite: 'npc_shopkeeper', dialogue: 'shopkeeper' }],
          ['shopItem', 4, 3, { item: 'shield', level: 1, price: 30, once: true, saveKey: 'shopShield' }],
          ['shopItem', 6, 3, { pickup: 'bomb4', price: 20, name: 'Bombs' }],
          ['shopItem', 8, 3, { pickup: 'heart', price: 10, name: 'Heart' }],
          ['shopItem', 2, 5, { ring: 'power', price: 80, once: true, saveKey: 'shopRing' }],
        ],
        warps: [{ x: 5, y: 6, to: { map: 'overworld', floor: 0, rx: 4, ry: 7, px: 48, py: 40, dir: 'down' } }],
      },
    },
  });

  registerMap({
    id: 'houseMaku',
    kind: 'interior',
    name: 'The Maku Tree',
    w: 1, h: 1, floors: 1,
    legend: 'house', music: 'village', tint: 'cave', scroll: false,
    rooms: {
      '0,0,0': {
        map: [
          '##########',
          '#........#',
          '#........#',
          '#........#',
          '#........#',
          '#........#',
          '#....o...#',
          '##########',
        ],
        entities: [
          ['giver', 4, 2, {
            sprite: 'npc_maku', dialogue: 'makuTree', waiting: 'makuWait',
            after: 'makuAfter', flag: 'gotSatchel', item: 'satchel', level: 1,
            needEssences: 1,
          }],
          ['npc', 7, 4, { sprite: 'npc_farore_0', dialogue: 'faroreHome' }],
        ],
        warps: [{ x: 5, y: 6, to: { map: 'overworld', floor: 0, rx: 4, ry: 7, px: 112, py: 40, dir: 'down' } }],
      },
    },
  });
}

export function installOverworld() {
  registerMap({
    id: 'overworld',
    kind: 'overworld',
    name: 'Thalassia',
    w: OVERWORLD_W, h: OVERWORLD_H, floors: 1,
    legend: 'coast',
    music: 'overworld',
    scroll: true,
    rooms,
  });
  installHouses();
}

export { rooms as OVERWORLD_ROOMS };
