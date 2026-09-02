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
//   Reef Palace   posts over deep water    Dredge Line     (as planned)
//   Sunken Marsh  cracked cliff             Bombs           (as planned)
//   Salt Pans     a deep gap and boulders (Feather + Bracelet) — the plan
//                 calls for the Resonance Rod, which gates nothing here.
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

// The peoples of Thalassia, as an NPC entity says them. The art is extracted
// (tools/rip-races.py); who they are is ours.
//
//   Salters   hooded in orange oilskin — the salt pans and the working shore
//   Kelpers   the same hood in green — the Drowned Wood and the Bogwater
//   Brinekin  blue-capped seafarers — Tidewatch and the fishing hamlets
//   Reefkin   speckled and web-footed — the Coral Reef
//
// `frames` is the NPC's own directional table (game/objects.js spriteName), and
// it had never been used by anything: every townsperson in the game faced the
// camera whichever way they walked. A people with a back and a side reads as
// somebody going about their day rather than a portrait on a post. A missing
// direction falls back to `down`, which is why the Brinekin — whose sheet has
// no side view — declare only the two the sheet actually draws.
const FOLK = {
  salter: { sprite: 'npc_salter_d', frames: { down: ['npc_salter_d'], up: ['npc_salter_u'], side: ['npc_salter_s'] } },
  kelper: { sprite: 'npc_kelper_d', frames: { down: ['npc_kelper_d'], up: ['npc_kelper_u'], side: ['npc_kelper_s'] } },
  brine: { sprite: 'npc_brine_d', frames: { down: ['npc_brine_d'], up: ['npc_brine_u'] } },
};

const rooms = {
  // ---- abyss -------------------------------------------------------------
  '0,0,0': {
    name: 'Drowned Shore',
    legend: 'abyss', music: 'abyss',
    map: [
      '**********',
      '*11111111*',
      '*1..GG..g1',
      '*1g?gg?ggg',
      '*1..GG..gg',
      '*gg____ggg',
      '*11gggggg#',
      '***1ggg###',
    ],
    entities: [
      ['keese', 2, 3], ['keese', 6, 4],
      // The Rod's overworld verb: struck here, the bell points at the hole
      // with the Heart Piece in it. A direction, never a distance — it
      // narrows the search and does not finish it. And the note carries twice
      // as far at HIGH tide, which is what makes this shore worth revisiting.
      ['bell', 1, 5, { points: [3, 3], say: 'The bell leans toward the near hole.' }],
    ],
    // `abyssHole` is deep at every tide level. Nothing on this shore has ever
    // been able to reach what is in them; the Dredge Line reads the same
    // `buried` list the shovel did, and the world is water, so its floor is
    // where the caches are. See docs/ITEMS.md.
    buried: [[3, 3, 'heartPiece'], [6, 3, 'rupee20']],
  },
  '0,1,0': {
    name: 'Gate of the Keep',
    legend: 'abyss', music: 'abyss',
    map: [
      '**********',
      '*111DD111*',
      '1gg.DD.gg1',
      'gg.GGG>.gg',
      'ggg.gg>ggg',
      'gggggg>ggg',
      '#gggggggg#',
      '###gggg###',
    ],
    warps: [
      { x: 4, y: 2, to: { map: 'd6', floor: 0, rx: 3, ry: 7, px: 72, py: 96 } },
      // Both halves of the arch enter. A two-tile-wide door whose
      // right half is scenery is a door the player bumps into.
      { x: 5, y: 2, to: { map: 'd6', floor: 0, rx: 3, ry: 7, px: 72, py: 96 } },
    ],
    entities: [
      ['sign', 2, 4, { text: 'THE ABYSSAL KEEP\nNereth waits below the water.' }],
      ['darknut', 6, 6],
    ],
  },
  '0,2,0': {
    name: 'Black Causeway',
    legend: 'abyss', music: 'abyss',
    // The one place on the map the conch does not reach. The Keep holds the
    // water here fast, so the causeway is whatever it was when you arrived —
    // and a Bottled Tide is the only thing that moves it. It is the Bottled
    // Tide's overworld room, and it is why the item is not just boss-room
    // furniture.
    //
    // Nothing is sealed by this: the walkable rows either side of each
    // drowned-wall band run the full width of the screen at every tide level,
    // so the causeway is a shortcut and never a gate.
    noTide: true,
    map: [
      '**********',
      '*11999911*',
      '1g......g1',
      'gg.9999.gg',
      'gg......gg',
      'ggg9999ggg',
      '#gggggggg#',
      '###1111###',
    ],
    entities: [
      ['wizzrobe', 4, 4],
      ['sign', 1, 6, { text: 'THE BLACK CAUSEWAY\nThe Keep holds this water. No shell\nsounds here. Bring your own sea.' }],
    ],
  },
  '0,3,0': {
    name: 'Rustfall',
    legend: 'abyss', music: 'abyss',
    map: [
      '**********',
      '*11111111*',
      '1g..oo5.1*',
      'gg.GGG5.1*',
      'gg..oo5.g#',
      'ggGGGG5Gg#',
      '#ggggg5gg#',
      '###gg15###',
    ],
    entities: [
      ['darknut', 4, 3], ['pickup', 2, 5, { kind: 'heartPiece' }],
    ],
  },
  // ---- salt --------------------------------------------------------------
  '0,4,0': {
    name: 'North Pan',
    legend: 'salt', music: 'salt',
    map: [
      '**********',
      '*11222211*',
      '*1.2222.g1',
      '*1G....Ggg',
      '#g.3333.gg',
      '#gg____ggg',
      '#gggggggg#',
      '###1111###',
    ],
    entities: [
      ['leever', 3, 4], ['leever', 6, 2],
    ],
  },
  '0,5,0': {
    name: 'Salt Terraces',
    legend: 'salt', music: 'salt',
    map: [
      '**********',
      '*11111111*',
      '1g......g1',
      'ggG.oo.Ggg',
      'gg......gg',
      'ggG""""Ggg',
      '#gggggggg#',
      '###1151###',
    ],
    entities: [
      ['beetle', 4, 4], ['pickup', 6, 4, { kind: 'heartPiece' }],
    ],
  },
  '0,6,0': {
    name: 'Boiling Pan',
    legend: 'salt', music: 'salt',
    map: [
      '**********',
      '*12222221*',
      '1g2.GG.2g1',
      'gg2.GG.2gg',
      'gg2....2gg',
      'gg222222gg',
      '#gggggggg#',
      '###gggg###',
    ],
    entities: [
      ['zol', 4, 3], ['zol', 2, 4],
      // The Boiling Pan is ringed in `tidePool`, which is walkable wet sand at
      // LOW and water above it — so the pan is a shortcut exactly once per
      // cycle, and exactly then it is full of leevers. The Brineglass Lens is
      // what turns "sound the conch and find out" into a decision: raise it at
      // MID and the LOW pan is drawn with its ambush already in it.
      ['leever', 3, 2, { phase: 0 }],
      ['leever', 6, 4, { phase: 0 }],
    ],
  },
  '0,7,0': {
    name: 'East Crust',
    legend: 'salt', music: 'salt',
    map: [
      '**********',
      '*11111111*',
      '1g5o..o.1*',
      'gg5.....1*',
      'gg5o..o.g#',
      'gg55GGGGg#',
      '#gg5ggggg#',
      '###51gg###',
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
      '**********',
      '*16666661*',
      '*16.qq.6g1',
      '*16....6gg',
      '#g6.qq.6gg',
      '#g666666gg',
      '#gggggggg#',
      '###1gg1###',
    ],
    entities: [
      ['jellyfish', 4, 5],
    ],
  },
  '0,9,0': {
    name: 'Palace Wall',
    legend: 'reef', music: 'reef',
    map: [
      '**********',
      '*11111111*',
      '1g.7777.g1',
      'gg.7777.gg',
      'gg.7777.gg',
      'gggggggggg',
      '#gggggggg#',
      '###g11g###',
    ],
    entities: [
      ['octorokSea', 4, 3], ['pickup', 2, 5, { kind: 'heartPiece' }],
    ],
  },
  '0,10,0': {
    name: 'Tide Steps',
    legend: 'reef', music: 'reef',
    map: [
      '**********',
      '*11888811*',
      '1g.8888.g1',
      'gg......gg',
      'gg.6666.gg',
      'ggg6666ggg',
      '#gggggggg#',
      '###gg#####',
    ],
    entities: [
      ['siren', 4, 2],
    ],
  },
  '0,11,0': {
    name: 'East Spire',
    legend: 'reef', music: 'reef',
    map: [
      '**********',
      '*11111111*',
      '1g.qqqq.1*',
      'gg......1*',
      'gg.7777.1*',
      'gg......1*',
      '#gggggg11*',
      '###ggg1***',
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
      '***1ggg###',
      '*11....gg#',
      '*1.?..?.gg',
      '*1g....ggg',
      '*1.?..?.g1',
      '*1g....g55',
      '*11155555#',
      '****######',
    ],
    entities: [
      ['jellyfish', 3, 4],
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
      '111????.gg',
      '555555..gg',
      '#11115ggg#',
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
      '###1111###',
      '#g111111g#',
      'g11999911g',
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
      '###gg15###',
      '#gGGG1555#',
      'gg.qqqq.5#',
      'gg......5#',
      'gg.oooo.5#',
      'ggGGGGG15#',
      '#gggggg15#',
      '##########',
    ],
    entities: [
      ['darknut', 3, 3], ['wizzrobe', 6, 3],
    ],
  },
  // ---- salt --------------------------------------------------------------
  '0,4,1': {
    name: 'Pan Road',
    legend: 'salt', music: 'salt',
    map: [
      '###1111###',
      '#gg1111gg#',
      '#g133331gg',
      '#g.1....gg',
      '#g133331gg',
      '#gg1gggggg',
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
      '###1151###',
      '#155551gg#',
      'g55bbbb.gg',
      'gg......gg',
      'gg.qqqq.gg',
      'gggggggggg',
      '#gggggggg#',
      '###gggg###',
    ],
    entities: [
      ['npc', 4, 3, { sprite: 'npc_hood_red', dialogue: 'salterElder', after: 'salterElderAfter', needEssences: 4 }],
      ['sign', 6, 5, { text: 'The pans drink the sea and give back stone.' }],
    ],
  },
  '0,6,1': {
    name: 'Vault Approach',
    legend: 'salt', music: 'salt',
    map: [
      '###gggg###',
      '#g###..gg#',
      'gg#C#.o.g5',
      'gg......g5',
      'g112222Gg5',
      'g112222gg5',
      '#g111gggg#',
      '###11gg###',
    ],
    warps: [
      { x: 3, y: 2, to: { map: 'cave3', floor: 0, rx: 0, ry: 0, px: 72, py: 96 } },
    ],
    entities: [
      ['sign', 5, 2, { text: 'SALT PAN VAULT\nThe pan keeps one swallow of the sea.' }],
      ['beetle', 6, 5],
    ],
  },
  '0,7,1': {
    name: 'Windward Pan',
    legend: 'salt', music: 'salt',
    map: [
      '###51gg###',
      '#5551GGGg#',
      '5511....Vg',
      '5g.qqqq.Vg',
      '5g......Vg',
      '5g______Vg',
      '#gggggggg#',
      '###1ggg###',
    ],
    entities: [
      ['wisp', 4, 4], ['moblin', 2, 4],
    ],
  },
  // ---- reef --------------------------------------------------------------
  '0,8,1': {
    name: 'Reefway',
    legend: 'reef', music: 'reef',
    map: [
      '###1gg1###',
      '#1111g11g#',
      'g166..661g',
      'gg1.....gg',
      'g166..661g',
      'gg1ggggggg',
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
      '###g11g###',
      '#gg1111gg#',
      'gg.q77q.gg',
      'gg.q77q.gg',
      'gg.q77q.gg',
      'ggg11151gg',
      '#ggg1g5gg#',
      '###ggg5###',
    ],
    entities: [
      ['octorokSea', 5, 3],
    ],
  },
  '0,10,1': {
    name: 'Palace Mouth',
    legend: 'reef', music: 'reef',
    map: [
      '###gg#####',
      '#gg..##gg#',
      'ggg..CCggg',
      'gg.6666.gg',
      'gg.6666.gg',
      'gg111ggggg',
      '#gg11gggg#',
      '###1111###',
    ],
    warps: [
      // One column east of where the other mouths sit. Column 4 of the screen
      // above is the lane tools/replays/tide-steps-split walks, and the anchor
      // patch that replay measures is thrown from a fixed tile in it, so the
      // rock face this porch is cut into is kept off that column.
      { x: 5, y: 2, to: { map: 'cave4', floor: 0, rx: 0, ry: 0, px: 72, py: 96 } },
      // Both halves of the arch enter. A two-tile-wide door whose
      // right half is scenery is a door the player bumps into.
      { x: 6, y: 2, to: { map: 'cave4', floor: 0, rx: 0, ry: 0, px: 72, py: 96 } },
    ],
    entities: [
      ['sign', 2, 3, { text: 'REEF PALACE\nDrowned to the arches. The porch is all\nthat is left of it.' }],
      ['siren', 6, 4],
    ],
  },
  '0,11,1': {
    name: 'Spire Shallows',
    legend: 'reef', music: 'reef',
    map: [
      '###ggg1***',
      '#g6666661*',
      'gg6....61*',
      'gg.____.1*',
      'gg6....61*',
      'gg6666661*',
      '#gggggg11*',
      '###ggg1***',
    ],
    entities: [
      ['barnacle', 4, 2], ['jellyfish', 5, 5],
    ],
  },
  // ---- cliffs ------------------------------------------------------------
  '0,0,2': {
    name: 'Kell Head',
    legend: 'cliffs', music: 'overworld',
    map: [
      '****######',
      '*111GGGGg#',
      '*1.9999555',
      '*1......g1',
      '*1.9999.gg',
      '*1GGGGGGgg',
      '*1g""""gg#',
      '***gggg###',
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
      '#555551gg#',
      '55.oooo.gg',
      '11......gg',
      'gg.GGGG.gg',
      'ggg____ggg',
      '#gggggggg#',
      '###g##g###',
    ],
    entities: [
      ['tektite', 3, 3], ['tektite', 6, 4],
    ],
  },
  '0,2,2': {
    name: 'Upper Kell',
    legend: 'cliffs', music: 'overworld',
    // THE SEAL'S UPPER COURSE. These four were boulders, and the four plugs one
    // screen north on the Abyss Stair were the other half of the same gate:
    // nothing at all lies between them, so opening one course alone buys the
    // player a single screen of dead end. Both courses are the Keep's seal now
    // and both open together, at five Essences, when the Maku Tree opens the
    // road. See `keepSeal` in src/data/tiles-core.js.
    map: [
      '###gggg###',
      '#ggVVVVgg#',
      'gg.9999.11',
      'gg1...1555',
      'g119999.1g',
      'ggg11..ggg',
      '#gg5ggggg#',
      '###5ggg###',
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
      '#155551Gg#',
      '115o..o.g#',
      '555.....g#',
      'g1.o..o.g#',
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
      '#11333311#',
      '#11333311g',
      '#g11....gg',
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
      '#g2222221#',
      'gg2...1211',
      'gg2.GG1211',
      'g12...12gg',
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
      '###11gg###',
      '#gggggggg#',
      '1gG1oo1Ggg',
      '1g111111gg',
      'ggg222211g',
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
      '###1ggg###',
      '#g5555555#',
      'gg5oooo.5#',
      'gg5.....g#',
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
      '#gg1111gg#',
      '#gq1771qgg',
      '#g..7711gg',
      '#gq.771qgg',
      '#ggggg1ggg',
      '#gggggggg#',
      '###11gg###',
    ],
    entities: [
      ['octorokSea', 4, 4],
    ],
  },
  '0,9,2': {
    name: 'Reef Market',
    legend: 'reef', music: 'reef',
    map: [
      '###ggg5###',
      '#gggg1555#',
      'gg.bbbb155',
      'gg......15',
      'gg.bbbb.15',
      'ggggggggg5',
      '#gggggggg#',
      '###gggg###',
    ],
    entities: [
      ['npc', 4, 3, { sprite: 'npc_reefkin_r', dialogue: 'reefFisher', after: 'reefFisherAfter', needEssences: 1 }],
    ],
  },
  '0,10,2': {
    name: 'Drowned Steps',
    legend: 'reef', music: 'reef',
    map: [
      '###1111###',
      '#gg777711#',
      '5g.777711g',
      '5g......gg',
      '5g.8888.gg',
      '5gg____ggg',
      '#gggggggg#',
      '###11gg###',
    ],
    entities: [
      ['siren', 3, 2], ['barnacle', 6, 4],
    ],
  },
  '0,11,2': {
    name: 'Outer Reef',
    legend: 'reef', music: 'reef',
    map: [
      '###ggg1***',
      '#g6666661*',
      'gg6.qq.61*',
      'gg......1*',
      'gg6.qq.61*',
      'gg6666661*',
      '#gggggg11*',
      '###ggg1***',
    ],
    entities: [
      ['jellyfish', 4, 5],
    ],
  },
  // ---- cliffs ------------------------------------------------------------
  '0,0,3': {
    name: 'Cistern Path',
    legend: 'cliffs', music: 'overworld',
    map: [
      '***gggg###',
      '*11GGGGGg#',
      '*1......gg',
      '*1.8888.gg',
      '*1......gg',
      '*g______gg',
      '*1ggggggg#',
      '***1ggg###',
    ],
    entities: [
      ['tektite', 5, 3],
    ],
  },
  '0,1,3': {
    name: 'Cistern Mouth',
    legend: 'cliffs', music: 'overworld',
    map: [
      '###g##g###',
      '#gg.DD.gg#',
      'ggg.DD.gg5',
      'gg.9999.g5',
      'gg......g5',
      'ggG""""Gg5',
      '#gggggggg#',
      '###5511###',
    ],
    warps: [
      { x: 4, y: 2, to: { map: 'd4', floor: 0, rx: 3, ry: 7, px: 72, py: 96 } },
      // Both halves of the arch enter. A two-tile-wide door whose
      // right half is scenery is a door the player bumps into.
      { x: 5, y: 2, to: { map: 'd4', floor: 0, rx: 3, ry: 7, px: 72, py: 96 } },
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
      '###5ggg###',
      '#5551..gg#',
      '551oooo.gg',
      '51......gg',
      '51.oooo.gg',
      '5gg....ggg',
      '#gggggggg#',
      '###gggg###',
    ],
    entities: [
      ['tektite', 4, 5], ['pickup', 6, 3, { kind: 'heartPiece' }],
    ],
  },
  '0,3,3': {
    name: 'Cliff Face',
    legend: 'cliffs', music: 'overworld',
    map: [
      '###gggg###',
      '#g11111Gg#',
      'gg199991g#',
      'gg......g#',
      'gg19999.g#',
      'ggG11GGGg#',
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
      'T11000011T',
      'T10....011',
      'T1."""".gg',
      'T10....01g',
      'Tg100001gg',
      'Tgg11ggggT',
      'TTTggggTTT',
    ],
    entities: [
      ['zol', 4, 4],
    ],
  },
  '0,5,3': {
    name: 'Rotting Grove',
    legend: 'wood', music: 'overworld',
    map: [
      'TTTTTTTTTT',
      'TgTT..TTgT',
      '1g....11fg',
      'gg.000011g',
      'gg....11gg',
      'gfTT..TTfg',
      'TgggggggfT',
      'TTTg##gTTT',
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
      'gg.oooo.g1',
      'gf..1...g1',
      'g110000.g1',
      'ggTT1.TTf1',
      'Tggg1gggfT',
      'TTT1111TTT',
    ],
    entities: [
      ['sign', 2, 2, { text: 'North, over the gap: the Salt Pans.' }],
      ['moblin', 6, 4],
    ],
  },
  '0,7,3': {
    name: 'The Gyre',
    legend: 'wood', music: 'overworld',
    // A closed circulation: east along the top, south down the right, west
    // along the bottom, north up the left. Swim it and it carries you round
    // instead of across; sink and you walk the floor straight through it, which
    // is the Kelp-Soled Cleats' whole argument in one screen. Passability is
    // unchanged from the deep ring that was here before — a riptide is `waterD`
    // that moves — so nothing is sealed by it.
    map: [
      'TTTTTTTTTT',
      'T1=EEEE=1T',
      '11N....S1T',
      '11N."".S1T',
      '11N....S1T',
      '11=WWWW=1T',
      'TgggffgggT',
      'TTTggggTTT',
    ],
    entities: [
      ['anglerfry', 4, 5],
      ['sign', 4, 6, { text: 'The water here runs in a ring.\nSwimmers go round. Walkers go through.' }],
    ],
  },
  // ---- reef --------------------------------------------------------------
  '0,8,3': {
    name: 'Reef Foot',
    legend: 'reef', music: 'reef',
    map: [
      '###11gg###',
      '#g11111gg#',
      '#g166661gg',
      '#g....1.gg',
      '#g166661gg',
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
      '###11gg###',
      '#11888811#',
      'g11888811g',
      'gg.1....gg',
      'gg16666.gg',
      'ggTTTTTTgg',
      '#gggggggg#',
      '##########',
    ],
    entities: [
      ['octorokSea', 5, 4],
    ],
  },
  '0,11,3': {
    name: 'Reef Edge',
    legend: 'reef', music: 'reef',
    map: [
      '###ggg1***',
      '#g.....11*',
      'gg.oooo.1*',
      'gg......1*',
      'gg.7777.1*',
      'ggTTTTTT1*',
      '#ggggg111*',
      '######****',
    ],
    entities: [
      ['pickup', 4, 3, { kind: 'fairy' }],
    ],
  },
  // ---- cliffs ------------------------------------------------------------
  '0,0,4': {
    name: 'Low Kell',
    legend: 'cliffs', music: 'overworld',
    map: [
      '***1ggg###',
      '*11GGGGGg#',
      '*1......gg',
      '*1.8888.gg',
      '*1......gg',
      '*1G""""Ggg',
      '*11gggggg#',
      '***1555###',
    ],
    entities: [
      ['tektite', 4, 3],
    ],
  },
  '0,1,4': {
    name: 'Boulder Run',
    legend: 'cliffs', music: 'overworld',
    map: [
      '###5511###',
      '#gg.55551#',
      'gg.oooo555',
      'gg.o..o11g',
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
      '#gg1111gg#',
      '55.9999.gg',
      'gg......gg',
      'gg.9999.gg',
      'ggg1111ggg',
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
    // The Squall Bellows' overworld room. The raft in the cut goes wherever it
    // is blown and takes you with it; the long way round the north shelf is
    // still open, so this is a shortcut you earn rather than a gate.
    //
    // THE ROCKFALL ON THE EAST BANK IS THE WAY INTO THE CLIFFS OF KELL, and
    // through them the only way to everything north of here — D4's door, the
    // Abyss Stair, the Keep. It was four boulders, so it only opened to the
    // Dredge Line, which is D6's item and sits inside what it sealed.
    //
    // All four are cracked, not one. A run where three tiles are still
    // boulders is not a Bombs gate, it is a Dredge Line gate with a hole in
    // it: the Line drags the other three and the player is through, so
    // check-overworld could no longer say which item holds the Cliffs shut and
    // "without Bombs the Cliffs are sealed" would quietly stop being true.
    map: [
      '###gggg###',
      '#gGG111Gg#',
      'gg.====.Xg',
      'gg.====.Xg',
      'gg......Xg',
      'gg______Xg',
      '#gggggggg#',
      '###5511###',
    ],
    entities: [
      ['sign', 2, 2, { text: 'East across the cut: the Drowned Wood.\nSwim it, blow the raft, or grow a bridge.' }],
      // Moored, not patrolling: `range: 0` and `needTide: 0` make it a raft
      // that sits where it is until something blows it.
      ['raft', 3, 3, { axis: 'x', range: 0, needTide: 0 }],
    ],
  },
  // ---- wood --------------------------------------------------------------
  '0,4,4': {
    name: 'Shrine Path',
    legend: 'wood', music: 'overworld',
    map: [
      'TTTggggTTT',
      'TgG000011T',
      'gg...111gg',
      'gg.TT.T.gg',
      'gg11...1fg',
      'gg100001gg',
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
      'TTTg##gTTT',
      'Tgg.DD.ggT',
      'ggf.DD.ggg',
      'gg.0000.gg',
      'gg..11..gg',
      'ggTT11TTgg',
      'TggggggggT',
      'TTTg111TTT',
    ],
    warps: [
      { x: 4, y: 2, to: { map: 'd5', floor: 0, rx: 3, ry: 7, px: 72, py: 96 } },
      // Both halves of the arch enter. A two-tile-wide door whose
      // right half is scenery is a door the player bumps into.
      { x: 5, y: 2, to: { map: 'd5', floor: 0, rx: 3, ry: 7, px: 72, py: 96 } },
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
      'TTT1111TTT',
      'Tg11111ggT',
      'gg155551gg',
      'gg....1.gg',
      'gg.55551gg',
      'ggg...1ggg',
      'TffgfffggT',
      'TTTggggTTT',
    ],
    entities: [
      ['anglerfry', 4, 4], ['pickup', 2, 5, { kind: 'heartPiece' }],
    ],
  },
  '0,7,4': {
    name: 'Drowned Hollow',
    legend: 'wood', music: 'overworld',
    map: [
      'TTTggggTTT',
      'T1======1T',
      'g111...11T',
      'g11====1fT',
      'gf......gT',
      'gg======gT',
      'TggggggggT',
      'TTTggggTTT',
    ],
    entities: [
      ['anglerfry', 5, 3], ['jellyfish', 3, 5],
    ],
  },
  // ---- coral -------------------------------------------------------------
  '0,8,4': {
    name: 'Coral Shelf',
    legend: 'coral', music: 'reef',
    map: [
      '##########',
      '#16666661#',
      '#16____611',
      '#1......1g',
      '#16....611',
      '#16666661g',
      '#g11ggggg#',
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
      '#g111111g#',
      '1g.6666.gg',
      'gg.6666.gg',
      '1g.6666.gg',
      'gggggg11gg',
      '#ggggg1gg#',
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
      '#g111111g#',
      'g11777711g',
      'gg....1.gg',
      'gg177771gg',
      'ggg...1ggg',
      '#gggggggg#',
      '###g##g###',
    ],
    entities: [
      ['octorokSea', 4, 4],
    ],
  },
  '0,11,4': {
    name: 'Outer Coral',
    legend: 'coral', music: 'reef',
    map: [
      '######****',
      '#g6666661*',
      'gg6.oo.61*',
      'gg......1*',
      'gg6.oo.61*',
      'gg6666661*',
      '#gggggg11*',
      '###ggg1***',
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
      '***1555###',
      '*11GGG555#',
      '*1.oooo.55',
      '*1......g1',
      '*1.oooo.gg',
      '*1TTTTTTgg',
      '*111ggggg#',
      '****######',
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
      '#11....gg#',
      '555o..o.gg',
      '1151....gg',
      'ggg....ggg',
      'ggg____ggg',
      '#MM....MM#',
      '###gggg###',
    ],
    entities: [
      ['sign', 6, 3, { text: 'North: the Cliffs of Kell.\nSouth: the bog.' }],
    ],
  },
  '0,2,5': {
    name: 'Sunken Shelf',
    legend: 'cliffs', music: 'overworld',
    map: [
      '###gggg###',
      '#g11111gg#',
      'gg199991gg',
      'gg....1.gg',
      'gg199991gg',
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
      '###5511###',
      '#gGG55551#',
      'gg.oooo51#',
      'gg.....5g#',
      'gg.oooo55#',
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
      'Tg1.....fg',
      'T110000.fg',
      'Tg1...11gg',
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
      'TTTg111TTT',
      'Tgg.1111gT',
      'gg.000011g',
      'gg.000011g',
      'gg.0000.gg',
      'ggg____fgg',
      'TggggggffT',
      'TTT111gTTT',
    ],
    entities: [
      // Coastwise Chain, link 8.
      ['wisp', 4, 3],
      ['trader', 2, 2, {
        sprite: 'npc_hood_blue', waiting: 'woodChild', after: 'wickAfter',
        deals: [{ stage: 8, wants: 'pearl', gives: 'cup', text: 'wickTrade' }],
      }],
    ],
  },
  '0,6,5': {
    name: 'Sunken Glade',
    legend: 'wood', music: 'overworld',
    map: [
      'TTTggggTTT',
      'Tg111111gT',
      'g115555.fg',
      'gg......fg',
      'gg.0000.gg',
      'ggg..11ffg',
      'TggggggggT',
      'TTTggggTTT',
    ],
    entities: [
      ['zol', 3, 4], ['moblin', 6, 3],
    ],
  },
  '0,7,5': {
    name: 'Wood Verge',
    legend: 'wood', music: 'overworld',
    map: [
      'TTTggggTTT',
      'TgTTTTTTgT',
      'g11====11T',
      'gg1...11gT',
      'g11====11T',
      'gfTTTTTTfT',
      'TggggggffT',
      'TTTTTTTTTT',
    ],
    entities: [
      ['anglerfry', 4, 4],
    ],
  },
  // ---- coral -------------------------------------------------------------
  '0,8,5': {
    name: 'Reef Wall',
    legend: 'coral', music: 'reef',
    map: [
      '###gggg###',
      '#16666661#',
      '#11...111g',
      '#1166661gg',
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
      'gg1...11gg',
      'g11666611g',
      'ggTTTTTTgg',
      '#gggggggg#',
      '##########',
    ],
    entities: [
      // Coastwise Chain, link 7.
      ['trader', 4, 3, {
        sprite: 'npc_reefkin_d', waiting: 'coralDiver', after: 'corriwigAfter',
        deals: [{ stage: 7, wants: 'whelk', gives: 'pearl', text: 'corriwigTrade' }],
      }],
    ],
  },
  '0,10,5': {
    name: 'Spire Mouth',
    legend: 'coral', music: 'reef',
    map: [
      '###g##g###',
      '#gg.DD.gg#',
      'ggg.DD.1gg',
      'gg.666611g',
      'gg......gg',
      'ggg""""ggg',
      '#gg....gg#',
      '###1gg1###',
    ],
    warps: [
      { x: 4, y: 2, to: { map: 'd2', floor: 0, rx: 3, ry: 7, px: 72, py: 96 } },
      // Both halves of the arch enter. A two-tile-wide door whose
      // right half is scenery is a door the player bumps into.
      { x: 5, y: 2, to: { map: 'd2', floor: 0, rx: 3, ry: 7, px: 72, py: 96 } },
    ],
    entities: [
      ['sign', 2, 3, { text: 'CORAL SPIRE\nLet the sea carry you up.' }],
    ],
  },
  '0,11,5': {
    name: 'Coral Foot',
    legend: 'coral', music: 'reef',
    map: [
      '###ggg1***',
      '#g6666661*',
      'gg6____61*',
      'gg......1*',
      'gg6....61*',
      'ggTTTTTT1*',
      '#ggggg111*',
      '######****',
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
      '****TTTTTT',
      '*1*T..TTgT',
      '*11.....gg',
      '*1.!!!!.gg',
      '*1......gg',
      '*1TT..TTgg',
      '*11ggggggT',
      '***1gggTTT',
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
      'Tg1#X##1gT',
      'g11!!!!11g',
      'gg1...11gg',
      'gg.!!!!11g',
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
      'TgTT1.TTgT',
      'gg111...gT',
      'gg.5555.gT',
      'gf...111gT',
      'ggTT.1TTgT',
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
      ['sign', 6, 3, { text: 'Someone has been digging here.' }],
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
      'Tg1...11gg',
      'T11000011g',
      'Tg1...11gg',
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
      'TTT111gTTT',
      'Tgg1111ggT',
      'gg1====1fg',
      'gf1====1fg',
      'gf.====1gg',
      'gfg.1..ggg',
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
      'gf1...11gT',
      'g110000.gT',
      'gg1.....gT',
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
      'Tg1...11gg',
      'T11111111g',
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
      'gJ.vvvv.gg',
      'gJ......gg',
      'gJ.1111.gg',
      'gJg....ggg',
      'TggJJJJggT',
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
      'Tg111111gT',
      'gg.111111g',
      'gg.1111.gg',
      'gg.1111.gg',
      'ggg....ggg',
      'TggJJJJggT',
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
      'TTT1gg1TTT',
      'Tg11111ggT',
      'gg1=11=1gg',
      'gg....1.gg',
      'gg1=..=1gg',
      'ggg....ggg',
      'TggJJJJggT',
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
      'TTTTTT****',
      'TgTTTTT*1*',
      'gg.OO.O11*',
      'gg......1*',
      'gg.1111.1*',
      'ggg....g1*',
      'TggJJJJ11*',
      'TTTggg1***',
    ],
    entities: [
      ['leever', 4, 3], ['pickup', 6, 3, { kind: 'rupee20' }],
    ],
  },
  // ---- marsh -------------------------------------------------------------
  '0,0,7': {
    name: 'Mire',
    legend: 'marsh', music: 'marsh',
    map: [
      '***1gggTTT',
      '*1*TTTTTgT',
      '*11!!!!.gg',
      '*1......gg',
      '*1.!!!!.fg',
      '*1TTTTTTfg',
      '*11ggggggT',
      '***1gggTTT',
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
      'gg.....1gg',
      'gg.!!!!11g',
      'gg......gg',
      'ggf""""ggg',
      'TggggggffT',
      'TTTg##gTTT',
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
      'gf..111.Xg',
      'gg.5555.%g',
      'g115555.%1',
      'ggTTTTTT%1',
      'TgffgggggT',
      'TTTggggTTT',
    ],
    entities: [
      ['sign', 2, 2, { text: 'The causeway wades only at LOW tide.' }],
      ['zol', 6, 4],
    ],
  },
  // ---- coast -------------------------------------------------------------
  '0,3,7': {
    name: 'West Bluff',
    legend: 'coast', music: 'overworld',
    map: [
      'TTTggggTTT',
      'T5###..ggT',
      'g5#C#>..gg',
      'g5...>..gg',
      '151gg>gGgg',
      '15g..>.ggg',
      'T555...ggT',
      'TTT5gggTTT',
    ],
    warps: [
      { x: 3, y: 2, to: { map: 'cave1', floor: 0, rx: 0, ry: 0, px: 72, py: 96 } },
    ],
    entities: [
      ['sign', 4, 4, { text: 'A grotto in the bluff.\nSomething glitters within.' }],
      ['octorok', 6, 4],
    ],
  },
  // TIDEWATCH VILLAGE, and it is a village now.
  //
  // It used to be two cave mouths cut into the tree line with a hedge in the
  // middle — the whole settlement was a name on a signpost, which is what PT
  // in docs/EXECUTION-PLAN.md exists to fix. It is now a square with buildings
  // round it: the blue SHOP on the east side and a house on the west, both
  // extracted whole off the Subrosia tileset and placed as BLOCKS (one legend
  // character drawn as the building's footprint — see src/data/legends.js).
  //
  // THE SEAM ROWS AND COLUMNS ARE UNTOUCHED. Row 0, row 7 and columns 0 and 9
  // are character for character what they were, because a building on a screen
  // edge changes what the neighbouring screen must have facing it, and this
  // screen has four neighbours. Everything below is interior.
  //
  // The Maku Tree keeps its hollow at 3,1 rather than moving into a house: it
  // is a tree, and a doorway in the wood at the top of the square says so.
  '0,4,7': {
    name: 'Tidewatch Village',
    legend: 'town', music: 'overworld',
    map: [
      'TTTTTTTTTT',
      'TTTTCTgggT',
      'gjjjgHHHgg',
      'gjjjgHHHgg',
      'gjjjgHHHgg',
      'gggggggggg',
      'TzgggggeiT',
      'TTTggggTTT',
    ],
    warps: [
      // Each door is the middle cell of its building's front row, which is the
      // one cell of a block that is not solid. Walk into it from the square.
      { x: 6, y: 4, to: { map: 'houseShop', floor: 0, rx: 0, ry: 0, px: 72, py: 96 } },
      { x: 2, y: 4, to: { map: 'houseHearth', floor: 0, rx: 0, ry: 0, px: 72, py: 96 } },
      { x: 4, y: 1, to: { map: 'houseMaku', floor: 0, rx: 0, ry: 0, px: 72, py: 96 } },
    ],
    entities: [
      ['sign', 8, 4, { text: 'TIDEWATCH VILLAGE\nEast: the Shallows. Mind the tide.' }],
      // The scrimshander works outdoors on the west side of the square, off
      // the path between the doors — an NPC is an entity, not a tile, so she
      // narrows the square without touching its connectivity.
      ['scrimshander', 2, 6, {}],
      // Brinekin, and re-dressed rather than joined by one. Adding an entity to
      // the STARTING room shifts every entity id allocated after it, and
      // `every(e, n)` phases an enemy off its id — so one extra villager here
      // re-phases every enemy in the game and the d1-descent replay walks into
      // a hit it used to dodge. Recorded in docs/HANDOFF.md.
      ['npc', 7, 1, { ...FOLK.brine, wander: true, dialogue: 'villager1', after: 'elder1', needEssences: 4 }],
      ['npc', 6, 6, { sprite: 'npc_villager2', wander: true, dialogue: 'villager2', after: 'villager2After', needEssences: 3 }],
      ['npc', 6, 1, { sprite: 'npc_child', wander: true, dialogue: 'villageChild', after: 'child1', needEssences: 2 }],
      ['giver', 8, 2, {
        ...FOLK.salter, dialogue: 'digger', waiting: 'diggerWait',
        after: 'diggerAfter', flag: 'gotCoin', item: 'coin', level: 1,
        needEssences: 3,
      }],
    ],
  },
  '0,5,7': {
    name: 'Village East',
    legend: 'coast', music: 'overworld',
    map: [
      'TTTggggTTT',
      'TgTT..TT1T',
      'gg..<.1111',
      'gg.v<.111g',
      'gf..<.111g',
      'ggTT..TT1g',
      'Tggggggg1T',
      'TTTggggTTT',
    ],
    entities: [
      // 2,3 rather than the 3,4 check-placement.mjs offered. This octorok spent
      // the project inside the ledge column at 4,3 and could not move; freed, it
      // meets whoever crosses this screen, and 3,4 is in the lane. The
      // suggestion is a legal tile, not a good one — see the tool's own note.
      ['octorok', 2, 3],
      // Coastwise Chain, link 4.
      ['trader', 6, 4, {
        sprite: 'npc_fisher', waiting: 'coastFisher', after: 'mirrenAfter',
        deals: [{ stage: 4, wants: 'brick', gives: 'eel', text: 'mirrenTrade' }],
      }],
    ],
  },
  '0,6,7': {
    name: 'Sunken Reef',
    legend: 'coast', music: 'overworld',
    map: [
      'TTTTTTTTTT',
      'Tgg###11fT',
      '1g.1C1111g',
      'g111111.gg',
      'g111111.gg',
      'gg111..gfg',
      'Tgf1gggggT',
      'TTTggggTTT',
    ],
    warps: [
      { x: 4, y: 2, to: { map: 'cave2', floor: 0, rx: 0, ry: 0, px: 72, py: 96 } },
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
      'Tgg.111ggT',
      'gg..1111gg',
      'g111111.gg',
      'g111111.gg',
      'gg111..ggg',
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
      'gg1.....gg',
      'g111111.gg',
      'gg111..ggg',
      'Tgg11ggggT',
      'TTTg##gTTT',
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
      'T155...ggT',
      'g15vv<v.gg',
      'g15v.<v.gg',
      'g15vv<v.gg',
      'gg5..<.ggg',
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
      'Tg11111ggT',
      'gg122221gg',
      'gg......gg',
      'gg12222.gg',
      'ggg11..ggg',
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
      'TTTggg1***',
      'TgTTTTT*1*',
      'gg.O..O11*',
      'gg......1*',
      'gg.1111.1*',
      'ggg....g1*',
      'Tgggggg11*',
      'TTTggg1***',
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
      '***1gggTTT',
      '*1*TTTTTfT',
      '*11!!!!.fg',
      '*1.!!!!.gg',
      '*1.!!!!.gg',
      '*1TTTTTTgg',
      '*11ggggggT',
      '***1gggTTT',
    ],
    entities: [
      ['leever', 3, 3], ['leever', 6, 4],
    ],
  },
  '0,1,8': {
    name: 'Sanctum Mouth',
    legend: 'marsh', music: 'marsh',
    map: [
      'TTTg##gTTT',
      'Tgf.DD.ggT',
      'ggf.DD.ggg',
      'gg.!!!!.gg',
      'gg......gg',
      'ggg""""ggg',
      'TggggggggT',
      'TTTggggTTT',
    ],
    warps: [
      { x: 4, y: 2, to: { map: 'd3', floor: 0, rx: 3, ry: 7, px: 72, py: 96 } },
      // Both halves of the arch enter. A two-tile-wide door whose
      // right half is scenery is a door the player bumps into.
      { x: 5, y: 2, to: { map: 'd3', floor: 0, rx: 3, ry: 7, px: 72, py: 96 } },
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
      'gg1.....gT',
      'g115555.gT',
      'gg1...11gT',
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
      'TTT5gggTTT',
      'Tgg.511ggT',
      'Tg..111ogg',
      'Tg.111111g',
      'Tg111111gg',
      'Tgf...1ggg',
      'TgfggfgggT',
      'TTTggggTTT',
    ],
    entities: [
      ['crab', 4, 4], ['octorok', 2, 2],
    ],
  },
  // The village's waterfront: the net-mender's cottage, a paling fence and the
  // tide pool that was already here. The pool is deep at HIGH and the cottage
  // door is not on it, which is the rule for a town — a building may narrow a
  // route and may never be the reason a screen has none. See check-towns.mjs.
  '0,4,8': {
    name: 'Village Shore',
    legend: 'town', music: 'overworld',
    map: [
      'TTTggggTTT',
      'Tgg...zigT',
      'gg......gg',
      'gghhh222gg',
      'gghhh222gg',
      'gghhhww.gg',
      'TggggwwggT',
      'TTTggggTTT',
    ],
    warps: [
      { x: 3, y: 5, to: { map: 'houseNets', floor: 0, rx: 0, ry: 0, px: 72, py: 96 } },
    ],
    entities: [
      // Coastwise Chain, link 2. Pell keeps the line he always had — it is
      // what he says until the chain reaches him — and a boy who has been
      // pinched by a crab the size of a dog is exactly who is holding the claw.
      ['trader', 3, 2, {
        sprite: 'npc_child', waiting: 'coastChild', after: 'pellAfter',
        deals: [{ stage: 2, wants: 'float', gives: 'claw', text: 'pellTrade' }],
      }],
      ['npc', 8, 1, { ...FOLK.salter, dialogue: 'shoreSalter', after: 'shoreSalterAfter', needEssences: 3 }],
      ['crab', 6, 4],
    ],
  },
  // The village's timber yard, on the screen already named for the wood that
  // washes up on it: the chopping stump and a length of paling fence. No door
  // and no building — a settlement is not only the houses, and the kit's job
  // here is to make a screen look worked rather than decorated.
  '0,5,8': {
    name: 'Driftwood Strand',
    legend: 'town', music: 'overworld',
    map: [
      'TTTggggTTT',
      'Tgg....fgT',
      'gguuu.q.gg',
      'gguuu...gg',
      'gg.1111.gg',
      'ggg...nggg',
      'TgggfgnfgT',
      'TTTggggTTT',
    ],
    entities: [
      ['octorok', 4, 4], ['pickup', 7, 3, { kind: 'rupee20' }],
      // Coastwise Chain, link 3.
      ['trader', 6, 3, {
        ...FOLK.salter, dir: 'left', waiting: 'timberSalter', after: 'hullaAfter',
        deals: [{ stage: 3, wants: 'claw', gives: 'brick', text: 'hullaTrade' }],
      }],
    ],
  },
  '0,6,8': {
    name: 'East Strand',
    legend: 'coast', music: 'overworld',
    map: [
      'TTTggggTTT',
      'Tfg..11ggT',
      'gf...111gg',
      'gg.1111.gg',
      'gg.1111.gg',
      'gf111..ggg',
      'Tff11ggggT',
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
      'gg1.....gg',
      'g111111.gg',
      'gg111..ggg',
      'Tgg11ggggT',
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
      'TTTg##gTTT',
      'Tgg.DD.ggT',
      'ggg.DD.ggg',
      'gg.1111.gg',
      'gg......gg',
      'ggg""""ggg',
      'TggggggggT',
      'TTTggggTTT',
    ],
    warps: [
      { x: 4, y: 2, to: { map: 'd1', floor: 0, rx: 3, ry: 7, px: 72, py: 96 } },
      // Both halves of the arch enter. A two-tile-wide door whose
      // right half is scenery is a door the player bumps into.
      { x: 5, y: 2, to: { map: 'd1', floor: 0, rx: 3, ry: 7, px: 72, py: 96 } },
    ],
    entities: [
      ['sign', 2, 3, { text: 'TIDEWASH GROTTO\nDrain it, then walk it.' }],
      ['crab', 7, 4],
    ],
  },
  // SANDPIPER ROW, the Shallows' fishing hamlet — the second settlement, and
  // the reason the town kit has two sets of tiles for one set of art: these
  // are the `Sand` variants, so the grass that shows through a roof's rounded
  // corner in Tidewatch is dune sand here. Same characters, same buildings.
  //
  // One cottage opens and one is shuttered. A town needs more buildings than
  // it has interiors and the source says which is which with the door it draws
  // — that is why a shut house is a different building and not a flag.
  '0,9,8': {
    name: 'Sandpiper Row',
    legend: 'townDunes', music: 'overworld',
    map: [
      'TTTggggTTT',
      'Tgg....ggT',
      'gjjjgkkkgg',
      'gjjjgkkkgg',
      'gjjjgkkkgg',
      'gg......ng',
      'TizggggenT',
      'TTTggggTTT',
    ],
    warps: [
      { x: 2, y: 4, to: { map: 'houseSandpiper', floor: 0, rx: 0, ry: 0, px: 72, py: 96 } },
    ],
    entities: [
      ['sign', 2, 1, { text: 'SANDPIPER ROW\nTwo houses, one boat, no harbour.' }],
      ['npc', 5, 5, { sprite: 'npc_fisher', wander: true, dialogue: 'fisher1', after: 'fisher1After', needEssences: 2 }],
      // Coastwise Chain, link 6.
      ['trader', 4, 6, {
        sprite: 'npc_hood_blue', waiting: 'sandpiperKid', after: 'sennitAfter',
        deals: [{ stage: 6, wants: 'lead', gives: 'whelk', text: 'sennitTrade' }],
      }],
      ['crab', 6, 1],
    ],
  },
  '0,10,8': {
    name: 'Shell Flats',
    legend: 'dunes', music: 'overworld',
    map: [
      'TTTggggTTT',
      'Tgg1111ggT',
      'gg144441gg',
      'gg14444.gg',
      'gg14444.gg',
      'ggg11..ggg',
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
      'TTTggg1***',
      'TgTTTTT*1*',
      'gg.x..O11*',
      'gg......1*',
      'gg.1111.1*',
      'ggg....g1*',
      'Tgggggg11*',
      'TTTggg1***',
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
      '***1gggTTT',
      '*1*TTTTTgT',
      '*11!!!!.gg',
      '*1......gg',
      '*11oooo1gg',
      '*1******11',
      '*1******1*',
      '**********',
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
      'gf1x11x1gg',
      '11******11',
      '*1******1*',
      '**********',
    ],
    entities: [
      // Coastwise Chain, link 9 — and the only link behind a gate: the Marsh
      // opens to bombs, so the chain cannot be finished before the Coral Spire
      // hands them over. tools/check-trade.mjs proves the whole chain is
      // reachable with bombs and nothing else the Rod would have to unlock.
      ['trader', 5, 3, {
        ...FOLK.kelper, waiting: 'bogWitch', after: 'yarrowAfter',
        deals: [{ stage: 9, wants: 'cup', gives: 'jar', text: 'yarrowTrade' }],
      }],
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
      'gg1111111*',
      '11******1*',
      '*1******1*',
      '**********',
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
      '*11x1111gg',
      '*1******11',
      '*1******1*',
      '**********',
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
      'gg133331gg',
      '11******11',
      '*1******1*',
      '**********',
    ],
    entities: [
      // Coastwise Chain, link 10. He hooked the kettle off the stones, which is
      // where a kettle that went out on an ebb from the village shore would end
      // up — the chain walks the whole coast to bring it back two screens.
      ['trader', 2, 2, {
        sprite: 'npc_fisher', waiting: 'stoneFisher', after: 'teelAfter',
        deals: [{ stage: 10, wants: 'jar', gives: 'kettle', text: 'teelTrade' }],
      }],
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
      'gg111111gg',
      '11******11',
      '*1******1*',
      '**********',
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
      'gf1444411*',
      '11******1*',
      '*1******1*',
      '**********',
    ],
    entities: [
      ['pickup', 4, 4, { kind: 'rupee20' }],
      ['sign', 2, 2, { text: 'Only the drained sea shows this floor.' }],
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
      '*1111111gg',
      '*1******11',
      '*1******1*',
      '**********',
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
      'gg144441gg',
      '11******11',
      '*1******1*',
      '**********',
    ],
    entities: [
      // Coastwise Chain, link 5. He has been waiting on his boat since before
      // the chain existed, and he is still waiting on it afterwards.
      ['trader', 2, 2, {
        sprite: 'npc_villager', waiting: 'wreckSurvivor', after: 'dovAfter',
        deals: [{ stage: 5, wants: 'eel', gives: 'lead', text: 'dovTrade' }],
      }],
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
      'gg144441gg',
      '11******11',
      '*1******1*',
      '**********',
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
      'gg155551gg',
      '11******11',
      '*1******1*',
      '**********',
    ],
    entities: [
      ['octorokSea', 4, 3], ['siren', 6, 4],
    ],
  },
  '0,11,9': {
    name: 'Worlds Edge',
    legend: 'dunes', music: 'overworld',
    map: [
      'TTTggg1***',
      'TgTTTTT*1*',
      'gg.OOOO11*',
      'gg......1*',
      'gg1111111*',
      '11******1*',
      '*1******1*',
      '**********',
    ],
    entities: [
      ['sign', 4, 3, { text: 'Nothing past here but open sea.' }],
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
          ['npc', 2, 2, { sprite: 'npc_shopkeeper', dialogue: 'shopkeeper', after: 'shopkeeper2', needEssences: 3 }],
          ['shopItem', 4, 3, { item: 'shield', level: 1, price: 30, once: true, saveKey: 'shopShield' }],
          ['shopItem', 6, 3, { pickup: 'bomb4', price: 20, name: 'Bombs' }],
          ['shopItem', 8, 3, { pickup: 'heart', price: 10, name: 'Heart' }],
          ['shopItem', 4, 5, { pickup: 'bottle', price: 40, name: 'Bottled Tide' }],
          ['shopItem', 2, 5, { charm: 'ballastHeart', price: 80, once: true, saveKey: 'shopCharm' }],
        ],
        // Out of the shop's door and back onto the square in front of it. The
        // door moved when the village was rebuilt — it is the middle cell of
        // the SHOP's front row now, at 6,5 — so this lands one tile below it.
        warps: [{ x: 5, y: 6, to: { map: 'overworld', floor: 0, rx: 4, ry: 7, px: 96, py: 88, dir: 'down' } }],
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
          // THE MAKU TREE HAS TWO BEATS, and they came from two branches that
          // each thought they were the only one. She is the last link of the
          // Coastwise Chain AND she is the tree that opens the road to the
          // Abyssal Keep. Both survive here; see MakuTree in src/game/objects.js
          // for why that class now extends Trader.
          //
          // Beat one — the trade. She wants the Tide Bell's own rope AND one
          // Essence: the rope is what the Rod is made of, the Essence is what
          // wakes her enough to make it. `gotRod` still lands exactly where it
          // did when she gave the Rod for the Essence alone, so every save and
          // every reader of that flag is untouched by the chain being built.
          //
          // Beat two — the road. `makuMaster` at five Essences grants the
          // level-3 sword and sets `makuOpenedKeep`. THIS IS THE LOAD-BEARING
          // HALF: the Keep's gate reads `makuOpenedKeep` and nothing else in
          // the game sets it. Drop these four lines to keep the trade tidy and
          // the world becomes uncompletable while check-trade.mjs stays green —
          // which is the exact shape of failure CLAUDE.md warns that a model
          // cannot see and only check-playthrough.mjs can.
          ['makuTree', 4, 2, {
            sprite: 'npc_maku', waiting: 'makuWait', after: 'makuAfter',
            deals: [{
              stage: 12, wants: 'bellrope', item: 'rod', level: 1,
              text: 'makuTree', flag: 'gotRod',
              needEssences: 1, blocked: 'makuBlocked',
            }],
            scene: 'makuMaster', sceneNeed: 5, sceneFlag: 'makuOpenedKeep',
            sceneAfter: 'makuOpened',
          }],
          ['npc', 7, 4, { sprite: 'npc_farore_0', dialogue: 'faroreHome', after: 'faroreHomeAfter', needEssences: 5 }],
        ],
        // The hollow is at 4,1 in the tree line at the top of the square. It is drawn
        // with `treeHollow`, not the cave arch — see the town legend.
        warps: [{ x: 5, y: 6, to: { map: 'overworld', floor: 0, rx: 4, ry: 7, px: 64, py: 40, dir: 'down' } }],
      },
    },
  });

  // The three houses the town kit opened. Each is one room with somebody in
  // it, because a door that opens onto nothing is worse than a door that does
  // not open — the shuttered house exists for the buildings we do not furnish.
  const home = (id, name, music, entities, back) => registerMap({
    id, kind: 'interior', name,
    w: 1, h: 1, floors: 1,
    legend: 'house', music, tint: 'cave', scroll: false,
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
        entities,
        warps: [{ x: 5, y: 6, to: { map: 'overworld', floor: 0, ...back, dir: 'down' } }],
      },
    },
  });

  home('houseHearth', 'A Village House', 'village', [
    ['npc', 3, 2, { sprite: 'npc_villager2', dialogue: 'hearthWife', after: 'hearthWifeAfter', needEssences: 3 }],
    ['npc', 7, 4, { sprite: 'npc_child', wander: true, dialogue: 'hearthChild', after: 'hearthChildAfter', needEssences: 2 }],
    ['pickup', 2, 4, { kind: 'rupee5' }],
  ], { rx: 4, ry: 7, px: 32, py: 88 });

  // Ossa opens the Coastwise Chain and closes it. Both of her deals live on one
  // entity, which is what the trader's `deals` list is for: the chain's stage
  // counter picks which of them is live, so she hands over the float on the
  // first visit and takes the kettle back on the eleventh, and says the same
  // flat thing about it not being her kettle on every visit in between.
  home('houseNets', "The Net-mender's", 'village', [
    ['trader', 4, 2, {
      sprite: 'npc_fisher', waiting: 'ossaWait', after: 'ossaAfter',
      deals: [
        { stage: 1, gives: 'float', text: 'ossaStart' },
        { stage: 11, wants: 'kettle', gives: 'bellrope', text: 'ossaEnd' },
      ],
    }],
  ], { rx: 4, ry: 8, px: 48, py: 104 });

  home('houseSandpiper', 'Sandpiper Cottage', 'village', [
    ['npc', 5, 2, { sprite: 'npc_villager', dialogue: 'sandpiper', after: 'netMender', needEssences: 2 }],
    ['pickup', 7, 4, { kind: 'rupee5' }],
  ], { rx: 9, ry: 8, px: 32, py: 88 });
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
