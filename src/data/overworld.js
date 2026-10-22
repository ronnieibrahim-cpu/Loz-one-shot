// The overworld of Thalassia: a 17x10 grid of screens, all 170 present.
// Rooms are keyed 'floor,x,y'. See world/room.js for the room contract and
// data/legends.js for the character vocabulary (digits are always tide tiles).
//
// Region layout follows docs/GAME-PLAN.md. Screens connect on a shared seam
// table, so a walkable east edge always has a walkable west edge facing it;
// every other edge tile is barrier, and the world border is solid all round.
//
// Region gates use what the tileset can actually enforce. Four gates exist —
// see tools/check-overworld.mjs, which proves each one seals its region
// without the item and opens it with the item:
//   Sunken Marsh, Cliffs of Kell   cracked cliff / rockfall   Bombs
//   Salt Pans                      a vane                     Resonance Rod
//                                   (also holds the Reef Palace approach
//                                   shut, since the Palace is reached only
//                                   through the Pans)
//   the Bog Stair (optional)       boulders                   Dredge Line
//   Abyssal approach                deep water                the Maku Tree,
//                                                              at five
//                                                              Essences —
//                                                              a story gate,
//                                                              not an item
// The Coral Reef and the Drowned Wood are not gated at all; the gap-hop is
// base moveset, not a Roc's Feather unlock, and there is no Zora's Flippers
// or Power Bracelet or Magnetic Gloves in this game.
//
// The Marsh has exactly two ways in — Bog Causeway (2,7) from the Coast and Bog
// Stair (1,6) down from the Cliffs — and both are now sealed by a `cliffCracked`
// tile with a solid cliff run beside it, so each entrance is a one-tile pocket
// you stand in until you have Bombs. Sealing only the Coast side would have
// gated nothing, because the Cliffs back door reaches the same screens.

import { registerMap } from '../world/maps.js';
import { FARORE_SWAY_HOLD } from './feel.js';

export const OVERWORLD_W = 17;
export const OVERWORLD_H = 10;

// THE OVERWORLD HAS BEEN WIDENED, and a save remembers screens by position.
// S157 inserted three columns after old x=5 (Tidewatch grew to Horon Village's
// five screens by two) and two after old x=9 (Sandpiper Row, three screens):
// twelve screens across became seventeen. tools/oneshot/widen-overworld.mjs
// moved every screen reference in the game; `widenOverworldX` moves the ones in
// a save written before, and progress.js's `migrate` calls it for any save
// whose `worldW` is not today's width.
export const OVERWORLD_WIDENINGS = [
  { fromW: 12, toW: 17, inserts: [{ after: 5, count: 3 }, { after: 9, count: 2 }] },
];

/** An overworld screen column in a save written at width `fromW`, moved to
 *  today's grid. */
export function widenOverworldX(x, fromW) {
  let w = fromW;
  for (const step of OVERWORLD_WIDENINGS) {
    if (w !== step.fromW) continue;
    x += step.inserts.filter(i => x > i.after).reduce((a, i) => a + i.count, 0);
    w = step.toW;
  }
  return x;
}

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
      '*LL..11~~*',
      '*LL...11~1',
      '*LL?gg?ggg',
      '*LL.gggggg',
      '*g..ggoggg',
      '*11.ggg###',
      '***1ggg###',
    ],
    // THE DARK LIGHTHOUSE (S200, side content): the tower in the corner of
    // the world, its door the two cells of its bottom row. Its keeper wants
    // the three parts of the lamp the sea took (src/data/errands.js); lit,
    // the lamp's beam sweeps this shore and shows the cove below.
    warps: [
      { x: 1, y: 4, to: { map: 'lighthouse', floor: 0, rx: 0, ry: 0, px: 72, py: 96 } },
      { x: 2, y: 4, to: { map: 'lighthouse', floor: 0, rx: 0, ry: 0, px: 72, py: 96 } },
    ],
    entities: [
      ['keese', 5, 2], ['keese', 6, 4],
      ['beam', 1, 1, { flag: 'lighthouseLit' }],
      // The Rod's overworld verb: struck here, the bell points at the hole
      // with the Heart Piece in it. A direction, never a distance — it
      // narrows the search and does not finish it. And the note carries twice
      // as far at HIGH tide, which is what makes this shore worth revisiting.
      ['bell', 8, 5, { points: [3, 3], say: 'The bell leans toward the near hole.' }],
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
      '*~1.DD.11*',
      '1..gDD.g11',
      'gg..g.gggg',
      'ggg.gg.ggg',
      'ggg.gggoog',
      '##g..ggg##',
      '###g.gg###',
    ],
    warps: [
      { x: 4, y: 2, to: { map: 'd6', floor: 1, rx: 3, ry: 7, px: 112, py: 144 } },
      // Both halves of the arch enter. A two-tile-wide door whose
      // right half is scenery is a door the player bumps into.
      { x: 5, y: 2, to: { map: 'd6', floor: 1, rx: 3, ry: 7, px: 112, py: 144 } },
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
      '1gg....gg1',
      'gg.9999.gg',
      'gg..gg..gg',
      'ggg9999ggg',
      '#gggg.ggg#',
      '###1111###',
    ],
    entities: [
      ['wizzrobe', 4, 4],
      ['sign', 1, 6, { text: 'THE BLACK CAUSEWAY\nNo conch works here. Bring your own sea, in a bottle!' }],
    ],
  },
  '0,3,0': {
    name: 'Rustfall',
    // Its Piece of Heart is the tide-pool race's prize now (S155, side
    // content); a rupee keeps the spot.
    legend: 'abyss', music: 'abyss',
    // THE SECOND OUTDOOR BELLOWS FIXTURE, and it is the Cliff Face's turned on
    // its end the way the Long Race turns the Drowned Sill: the shelf is at the
    // bottom of the fissure and the wheel at the top, so the gust goes UP and
    // you are blowing at something you have to crane to see. Same two closures
    // as the Cliff Face — a drown-wall you can only swim over at HIGH, a
    // fissure two tiles deep that nothing crosses and air ignores — and a
    // different shape to read.
    map: [
      '**********',
      '*1111111#*',
      '1g..oo5#1*',
      'gg.ggg5#J*',
      'gg..oo5#J#',
      'gg..gg59g#',
      '#ggggg5g##',
      '###gg15###',
    ],
    bellowsRoom: {
      wheel: [8, 2], stand: [8, 5], face: 'up', at: 2, gives: 'rupee100',
    },
    entities: [
      ['wheel', 8, 2, { needTurns: 45 }],
      ['darknut', 4, 3], ['pickup', 2, 5, { kind: 'rupee20' }],
    ],
    script: {
      onEnter(game) {
        if (game.progress.flags.rustfallWheel && !game.progress.secrets.rustfallCreel) {
          game.spawnPickup(128, 80, 'rupee100', { grabDelay: 14, saveKey: 'rustfallCreel' });
        }
      },
      onEvent(game, name, data) {
        if (name !== 'valve' || !data || !data.open) return;
        game.progress.flags.rustfallWheel = true;
        if (game.progress.secrets.rustfallCreel) return;
        game.spawnPickup(128, 80, 'rupee100', { grabDelay: 14, saveKey: 'rustfallCreel' });
      },
    },
  },
  // ---- salt --------------------------------------------------------------
  '0,4,0': {
    name: 'North Pan',
    legend: 'salt', music: 'salt',
    map: [
      '**********',
      '*11333311*',
      '*1.333..g1',
      '*1..gg..gg',
      '#..g222.gg',
      '#g.22222.g',
      '##g.22..g#',
      '##g.1111.#',
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
      '*11133311*',
      '1g.333.gg1',
      'gg..2..o.g',
      'g.g.g..22g',
      'g..g..222g',
      '##gg.222.#',
      '##..1151g#',
    ],
    entities: [
      // The Piece of Heart that lay here is the shopkeeper's thanks for his
      // ledger now (S155, side content); a rupee keeps the spot.
      ['beetle', 4, 4], ['pickup', 6, 4, { kind: 'rupee20' }],
    ],
  },
  '0,9,0': {
    name: 'Boiling Pan',
    legend: 'salt', music: 'salt',
    map: [
      '**********',
      '*1122111.*',
      '1g..222.g1',
      'gg.2..22gg',
      'gg.2...2gg',
      'gg..222.gg',
      '#g....g.g#',
      '##.gggg.##',
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
  '0,10,0': {
    name: 'East Crust',
    legend: 'salt', music: 'salt',
    // THE LIGHTHOUSE OIL (S200): a cask the high sea set down in a one-cell
    // hollow of salt wall (`9`, a pan wall the high sea covers). Nothing
    // walks in; at HIGH the walls are under water and Link swims over them.
    map: [
      '**********',
      '*1133111.*',
      '1g5o.9o.1*',
      'gg5.9.9.1*',
      'gg5o.9o.g#',
      'gg55..g.g#',
      '#gg5g.ggg#',
      '###51gg###',
    ],
    entities: [
      ['moblin', 3, 3],
      ['pickup', 5, 3, { kind: 'e_oil' }],
    ],
  },
  // ---- reef --------------------------------------------------------------
  '0,11,0': {
    name: 'Coral Gate',
    legend: 'reef', music: 'reef',
    map: [
      '**********',
      '*1166111.*',
      '*1677611g1',
      '*16776..gg',
      '#g166.o.gg',
      '#gg11..ggg',
      '#ggg...gg#',
      '###1gg1###',
    ],
    entities: [
      ['jellyfish', 4, 5],
    ],
  },
  '0,12,0': {
    name: 'Palace Wall',
    legend: 'reef', music: 'reef',
    map: [
      '**********',
      '*11166611*',
      '1g..6761g1',
      'gg.67776gg',
      'gg..666.gg',
      'gg....oggg',
      '#ggg..ggg#',
      '###g11g###',
    ],
    entities: [
      // The Piece of Heart that lay here moved to the Hollow Den behind Bluff
      // Hollow's cracked wall (S155, side content); a rupee keeps the spot.
      ['octorokSea', 4, 3], ['pickup', 2, 5, { kind: 'rupee20' }],
    ],
  },
  '0,15,0': {
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
  '0,16,0': {
    name: 'East Spire',
    legend: 'reef', music: 'reef',
    map: [
      '**********',
      '*1166.111*',
      '1g.677.o1*',
      'gg..66..1*',
      'gg.o.6671*',
      'gg..q.661*',
      '#ggg..g11*',
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
    // The lighthouse cove (S200): the cliff at 8,0 is a cave mouth once the
    // lamp on the Drowned Shore is lit (`cliffAbyssCove`, a story gate). The
    // warp is listed from the start and is inert until then.
    warps: [
      { x: 8, y: 0, to: { map: 'cave18', floor: 0, rx: 0, ry: 0, px: 72, py: 96 } },
    ],
    map: [
      '***1ggg#u#',
      '*1..ggggg#',
      '*1.?gg.ggg',
      '*1g??ggggg',
      '*1g??.ggg1',
      '*1g...gg55',
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
      '###g.gg###',
      '#gg..ggg##',
      'gg.??..ggg',
      'gg???g....',
      '111.??gggg',
      '55555.gggg',
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
      '#gg1111gg#',
      'gg.9999ggg',
      '...ggggggg',
      'gg..gggggg',
      'gg.....ogg',
      '#ggVVVVgg#',
      '###gggg###',
    ],
    entities: [
      ['sign', 6, 5, { text: 'Down: the Cliffs of Kell.\nUp: the Abyssal Keep.' }],
    ],
  },
  '0,3,1': {
    name: 'Iron Watch',
    legend: 'abyss', music: 'abyss',
    map: [
      '###gg15###',
      '#gggg1555#',
      'gg.q.qq.5#',
      'gg..gg..5#',
      'gg.o.o..5#',
      'ggggggg15#',
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
      '##g.1111.#',
      '#gg1111.g#',
      '#g.13331gg',
      '#g.13331.g',
      '#gg.111.gg',
      '#gggg..ggg',
      '##gggggg.#',
      '##.gggg.##',
    ],
    entities: [
      ['leever', 5, 3],
    ],
  },
  '0,5,1': {
    name: 'Salters Rest',
    legend: 'salt', music: 'salt',
    map: [
      '##..1151.#',
      '#g15551gg#',
      'g55.b.b.gg',
      'gg......gg',
      'gg.q.q..gg',
      'gggggggggg',
      '#ggggggg.#',
      '##.gggg.##',
    ],
    entities: [
      ['npc', 4, 3, { sprite: 'npc_hood_red', dialogue: 'salterElder', after: 'salterElderAfter', needEssences: 4 }],
      ['sign', 6, 5, { text: 'THE SALT PANS\nLet the sea in, let it dry, and you get salt!' }],
    ],
  },
  '0,9,1': {
    name: 'Vault Approach',
    legend: 'salt', music: 'salt',
    map: [
      '##.gggg.##',
      '#g###..gg#',
      'gg#C#.o.g5',
      'gg..g...g5',
      'g.122.22g5',
      'g.1222..g5',
      '#g.11.ggg#',
      '###11gg###',
    ],
    warps: [
      { x: 3, y: 2, to: { map: 'cave3', floor: 0, rx: 0, ry: 0, px: 72, py: 96 } },
    ],
    entities: [
      ['sign', 5, 2, { text: 'SALT PAN VAULT\nThe Salters keep a bottle of the sea in here.' }],
      ['beetle', 6, 5],
    ],
  },
  '0,10,1': {
    name: 'Windward Pan',
    legend: 'salt', music: 'salt',
    map: [
      '###51gg###',
      '#5551..gg#',
      '5511....Vg',
      '5g.qq.q.Vg',
      '5g......Vg',
      '5g..g.ggVg',
      '#g.ggg..g#',
      '###1ggg###',
    ],
    entities: [
      ['wisp', 4, 4], ['moblin', 2, 4],
    ],
  },
  // ---- reef --------------------------------------------------------------
  '0,11,1': {
    name: 'Reefway',
    legend: 'reef', music: 'reef',
    map: [
      '###1gg1###',
      '#11.gg11g#',
      'g16..g661g',
      'gg6....1gg',
      'g166.o..gg',
      'gg11..1ggg',
      '#gggg.ggg#',
      '###gggg###',
    ],
    entities: [
      ['crab', 4, 3], ['crab', 6, 4],
    ],
  },
  '0,12,1': {
    name: 'Hooked Channel',
    legend: 'reef', music: 'reef',
    map: [
      '###g11g###',
      '#gg11.1gg#',
      'gg.6677.gg',
      'g..q775.gg',
      'gg1.675.gg',
      'ggg1o15ggg',
      '#ggggg5gg#',
      '###ggg5###',
    ],
    entities: [
      ['octorokSea', 5, 3],
    ],
  },
  '0,15,1': {
    name: 'Palace Mouth',
    legend: 'reef', music: 'reef',
    map: [
      '###gg#####',
      '#gg..##gg#',
      'ggg..CCggg',
      'gg.6676.gg',
      'gg.o677.gg',
      'gg11..gggg',
      '#gg11.ggg#',
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
      ['sign', 2, 3, { text: 'REEF PALACE\nSunk up to its arches. Only the porch is left above water.' }],
      ['siren', 6, 4],
    ],
  },
  '0,16,1': {
    name: 'Spire Shallows',
    legend: 'reef', music: 'reef',
    map: [
      '###ggg1***',
      '#g..66111*',
      'gg.6776.1*',
      'gg..66..1*',
      'gg.o..661*',
      'gg.q.6761*',
      '#ggg..g11*',
      '###ggg1***',
    ],
    entities: [
      ['barnacle', 4, 2], ['jellyfish', 5, 5],
    ],
  },
  // ---- cliffs ------------------------------------------------------------
  '0,0,2': {
    name: 'Kell Head',
    legend: 'cliffs', music: 'kell',
    map: [
      '****######',
      '*11gg#####',
      '*1gggggg55',
      '*11gg1gog1',
      '*1ggg11ggg',
      '*1gggo##gg',
      '*11ggg##g#',
      '***gggg###',
    ],
    entities: [
      ['tektite', 4, 3],
    ],
  },
  '0,1,2': {
    name: 'Wind Shelf',
    legend: 'cliffs', music: 'kell',
    // THE SEA CAVE (S155 side content). Its mouth at 3,1 is `seaCaveMouth`:
    // above water only at LOW, when the channel in front of it is wadeable
    // too. At MID and HIGH the sea stands in the mouth and the warp is inert.
    // Not in row 0: a doorway on the seam would disagree with the screen above.
    map: [
      '##########',
      '###&##1gg#',
      '5555gogggg',
      '11gggg##gg',
      'gggggg##gg',
      'gggggogggg',
      '#gggggg###',
      '###g##g###',
    ],
    warps: [
      { x: 3, y: 1, to: { map: 'cave6', floor: 0, rx: 0, ry: 0, px: 72, py: 96 } },
    ],
    entities: [
      // The first tektite stood at 3,3, on the sea cave's doorstep, and met
      // everyone coming out of it (S155).
      ['tektite', 4, 3], ['tektite', 8, 5],
    ],
  },
  '0,2,2': {
    name: 'Upper Kell',
    legend: 'cliffs', music: 'kell',
    // THE SEAL'S UPPER COURSE. These four were boulders, and the four plugs one
    // screen north on the Abyss Stair were the other half of the same gate:
    // nothing at all lies between them, so opening one course alone buys the
    // player a single screen of dead end. Both courses are the Keep's seal now
    // and both open together, at five Essences, when the Maku Tree opens the
    // road. See `keepSeal` in src/data/tiles-core.js.
    map: [
      '###gggg###',
      '#ggVVVVgg#',
      'gggggggg11',
      'gggg99g155',
      'gggg9ggg1g',
      'gggggggggg',
      '#gg5gggg##',
      '###5ggg###',
    ],
    entities: [
      ['keese', 3, 3], ['sign', 6, 5, { text: 'At HIGH tide the low walls go under. Swim over them!' }],
    ],
  },
  '0,3,2': {
    name: 'Kell Corner',
    legend: 'cliffs', music: 'kell',
    map: [
      '##########',
      '#15##C####',
      '115gggg###',
      '55gggoggg#',
      'g1ggggggg#',
      'gggoggggg#',
      '#gggggg###',
      '###gggg###',
    ],
    // THE GULLWIND EYRIE (S160), an optional dungeon: the Ferryman's Coin's.
    // Its mouth is cut in the north cliff. See src/data/dungeons-optional.js.
    warps: [
      { x: 5, y: 1, to: { map: 'eyrie', floor: 0, rx: 1, ry: 2, px: 112, py: 128, dir: 'up' } },
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
      '##.gggg.##',
      '#1133311.#',
      '#11333..gg',
      '#g11..g.gg',
      '#g.g..2.gg',
      '#gg..222gg',
      '##gggg22g#',
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
      '##.gggg.##',
      '#g.222.1g#',
      'gg.2..2211',
      'gg2...2211',
      'g.22..22gg',
      'gg.2222.gg',
      '#gg....gg#',
      '##########',
    ],
    entities: [
      ['zol', 4, 3], ['crab', 2, 2],
    ],
  },
  '0,9,2': {
    name: 'Vault Steps',
    legend: 'salt', music: 'salt',
    map: [
      '###11gg###',
      '#g.11ggg.#',
      '1g.11oo.gg',
      '1g.1111.gg',
      'gg..222.gg',
      'gg.222..gg',
      '#ggVVVVgg#',
      '###gggg###',
    ],
    entities: [
      ['sign', 2, 5, { text: 'South, past the gap: the Drowned Wood.' }],
    ],
  },
  '0,10,2': {
    name: 'Pan Corner',
    legend: 'salt', music: 'salt',
    map: [
      '###1ggg###',
      '#g555555.#',
      'gg5.oo..5#',
      'gg5..g..g#',
      'gg..oo..g#',
      'gg.g..g.g#',
      '#gggggggg#',
      '##########',
    ],
    entities: [
      ['beetle', 4, 3],
    ],
  },
  // ---- reef --------------------------------------------------------------
  '0,11,2': {
    name: 'Sunken Colonnade',
    legend: 'reef', music: 'reef',
    map: [
      '###gggg###',
      '#gg.11ggg#',
      '#q.1771q.g',
      '#g.67776gg',
      '#q.6776qgg',
      '#g..66.ggg',
      '#gq.gg.qg#',
      '###11gg###',
    ],
    entities: [
      ['octorokSea', 4, 4],
    ],
  },
  '0,12,2': {
    name: 'Reef Market',
    legend: 'reef', music: 'reef',
    map: [
      '###ggg5###',
      '#gg.g1555#',
      'gg.b..1555',
      'gg....1.55',
      'gg.b.b.155',
      'ggg...1555',
      '#gggg..gg#',
      '###gggg###',
    ],
    entities: [
      ['npc', 4, 3, { sprite: 'npc_reefkin_r', dialogue: 'reefFisher', after: 'reefFisherAfter', needEssences: 1 }],
    ],
  },
  '0,15,2': {
    name: 'Drowned Steps',
    legend: 'reef', music: 'reef',
    map: [
      '###1111###',
      '#g.67771g#',
      '5g.777611g',
      '5g..6...gg',
      '5g..888ogg',
      '5gg____ggg',
      '#gg.gg.gg#',
      '###11gg###',
    ],
    entities: [
      ['siren', 3, 2], ['barnacle', 6, 4],
    ],
  },
  '0,16,2': {
    name: 'Outer Reef',
    legend: 'reef', music: 'reef',
    map: [
      '###ggg1***',
      '#g.666111*',
      'gg.6776.1*',
      'gg..6.###*',
      'gg.q..#&#*',
      'gg..64441*',
      '#ggg.gg11*',
      '###ggg1***',
    ],
    // A sea rock whose mouth is only above water at LOW: Lantern Rock (S193).
    warps: [
      { x: 7, y: 4, to: { map: 'cave16', floor: 0, rx: 0, ry: 0, px: 72, py: 96 } },
    ],
    entities: [
      ['jellyfish', 4, 5],
    ],
  },
  // ---- cliffs ------------------------------------------------------------
  '0,0,3': {
    name: 'Cistern Path',
    legend: 'cliffs', music: 'kell',
    // THE THIRD OUTDOOR BELLOWS FIXTURE, on the screen you walk to the Cistern
    // along — so the first thing the Bellows meet on the way back out is a
    // headland you have passed a dozen times. The gust goes LEFT, out to sea:
    // the wheel is a bar of tide-rock in the water at the foot of the headland,
    // with the open sea hard against its far side and the fissure on its near
    // one, so there has never been anywhere to stand beside it.
    map: [
      '***gggg###',
      '*11gggggg#',
      '*####...gg',
      '*1JJg9..gg',
      '*####...gg',
      '*g###___gg',
      '*1ggggggg#',
      '***1ggg###',
    ],
    bellowsRoom: {
      wheel: [1, 3], stand: [4, 3], face: 'left', at: 2, gives: 'rupee100',
    },
    entities: [
      ['wheel', 1, 3, { needTurns: 45 }],
      ['tektite', 6, 4],
    ],
    script: {
      onEnter(game) {
        if (game.progress.flags.cisternPathWheel && !game.progress.secrets.cisternPathCreel) {
          game.spawnPickup(64, 48, 'rupee100', { grabDelay: 14, saveKey: 'cisternPathCreel' });
        }
      },
      onEvent(game, name, data) {
        if (name !== 'valve' || !data || !data.open) return;
        game.progress.flags.cisternPathWheel = true;
        if (game.progress.secrets.cisternPathCreel) return;
        game.spawnPickup(64, 48, 'rupee100', { grabDelay: 14, saveKey: 'cisternPathCreel' });
      },
    },
  },
  '0,1,3': {
    name: 'Cistern Mouth',
    legend: 'cliffs', music: 'kell',
    map: [
      '###g##g###',
      '##ggDDgg##',
      'ggggDDggg5',
      'gggoggg1g5',
      'g##g11ggg5',
      'g##gg1ggg5',
      '#gggggggg#',
      '###5511###',
    ],
    warps: [
      { x: 4, y: 2, to: { map: 'd4', floor: 0, rx: 3, ry: 7, px: 112, py: 144 } },
      // Both halves of the arch enter. A two-tile-wide door whose
      // right half is scenery is a door the player bumps into.
      { x: 5, y: 2, to: { map: 'd4', floor: 0, rx: 3, ry: 7, px: 112, py: 144 } },
    ],
    entities: [
      ['sign', 2, 3, { text: 'CLIFFSIDE CISTERN\nDeep water hides the spikes.' }],
      ['keese', 7, 4],
    ],
  },
  '0,2,3': {
    name: 'Kell Ledges',
    legend: 'cliffs', music: 'kell',
    map: [
      '###5ggg###',
      '#g15gggg##',
      '5115gogggg',
      '55g1gggggg',
      '5ggggggogg',
      '5g##gggggg',
      '#g##ggggg#',
      '###gggg###',
    ],
    entities: [
      // The Piece of Heart that lay under this rock is the village child's
      // thanks for a kite now (S155, side content); a rupee keeps the spot.
      ['tektite', 4, 5], ['pickup', 6, 3, { kind: 'rupee20' }],
    ],
  },
  '0,3,3': {
    name: 'Cliff Face',
    legend: 'cliffs', music: 'kell',
    // THE FIRST BELLOWS FIXTURE OUT OF DOORS, and it is the Drowned Sill
    // (d4 `0,2,3`) carried outside rather than a new idea: a shelf you can
    // only get onto while the sea is up, and a wheel that only the cone can
    // free once you are on it. What the cliff supplies that the Cistern could
    // not is the barrier — a fissure two tiles wide, which the Loft cannot
    // clear and the gust crosses without noticing, because a hole in the
    // ground is not a wall to moving air.
    //
    // The shelf at 5,3 is walled in stone on three sides and closed on the
    // fourth by the drown-wall band; at LOW and MID that band is cliff and the
    // shelf is a notch you can see and not enter, at HIGH it is water and you
    // swim over it. The wheel across the fissure is a bar of sandbar rock:
    // under at HIGH, clear one level down. So the sea has to be up for you to
    // be standing there and down for the wheel to turn, and the cone is the
    // only thing that does both at once.
    map: [
      '###gggg###',
      '#g11111gg#',
      'gg19######',
      'gg..9gJJ1#',
      'gg199#####',
      'ggg11gggg#',
      '#gggggggg#',
      '###gggg###',
    ],
    bellowsRoom: {
      wheel: [8, 3], stand: [5, 3], face: 'right', at: 2, gives: 'rupee100',
    },
    entities: [
      ['wheel', 8, 3, { needTurns: 40 }],
      ['keese', 2, 3], ['keese', 6, 5],
    ],
    script: {
      // A SCRIPT-SPAWNED PICKUP EXISTS ONLY IN THE FRAME IT WAS RELEASED IN,
      // and out of doors the player leaves a screen by walking off the edge of
      // it, which is easier to do by accident than walking out of a dungeon
      // room. Same answer as the Cistern Gauge: the wheel sets a flag, the
      // prize carries a save key, and coming back puts it out again if it was
      // released and never picked up.
      onEnter(game) {
        if (game.progress.flags.cliffFaceWheel && !game.progress.secrets.cliffFaceCreel) {
          game.spawnPickup(80, 48, 'rupee100', { grabDelay: 14, saveKey: 'cliffFaceCreel' });
        }
      },
      onEvent(game, name, data) {
        if (name !== 'valve' || !data || !data.open) return;
        game.progress.flags.cliffFaceWheel = true;
        if (game.progress.secrets.cliffFaceCreel) return;
        game.spawnPickup(80, 48, 'rupee100', { grabDelay: 14, saveKey: 'cliffFaceCreel' });
      },
    },
  },
  // ---- wood --------------------------------------------------------------
  '0,4,3': {
    name: 'Wood Edge',
    legend: 'wood', music: 'wood',
    map: [
      'TTTTTTobTT',
      'TTTTTTggTT',
      'TTggggggTT',
      'TTg~~~ggTT',
      'TT~==~~ggg',
      'TT~===~ggg',
      'TTTT~~ggTT',
      'TTTTgg.gTT',
    ],
    entities: [
      ['zol', 7, 3],
    ],
  },
  '0,5,3': {
    name: 'Rotting Grove',
    legend: 'wood', music: 'wood',
    map: [
      'TTTTTTTTTT',
      'TTTTTTTTTT',
      'TTg111gggg',
      'TT11=11ggg',
      'gg1===11gg',
      'ggg1111gGg',
      'TTggTTggTT',
      'TTg.TT.gTT',
    ],
    entities: [
      ['wisp', 4, 3], ['keese', 1, 5],
    ],
  },
  '0,9,3': {
    name: 'Wood Gate',
    legend: 'wood', music: 'wood',
    map: [
      'TTbggggoTT',
      'TTgg.gggTT',
      'ggf..ggggg',
      'gggg.g1111',
      'ggg..g1=11',
      'gggg.gg11g',
      'TTggg..gTT',
      'TTg..gggTT',
    ],
    entities: [
      ['sign', 2, 2, { text: 'North: the Salt Pans.' }],
      ['moblin', 5, 4],
    ],
  },
  '0,10,3': {
    name: 'The Gyre',
    legend: 'wood', music: 'wood',
    // A closed circulation: east along the top, south down the right, west
    // along the bottom, north up the left. Swim it and it carries you round
    // instead of across; sink and you walk the floor straight through it, which
    // is the Kelp-Soled Cleats' whole argument in one screen. Passability is
    // unchanged from the deep ring that was here before — a riptide is `waterD`
    // that moves — so nothing is sealed by it.
    map: [
      'TTTTTTTTTT',
      'Tg=EEEE=fT',
      'g1N....SgT',
      '11N."".SgT',
      '11N....SgT',
      'g1=WWWW=gT',
      'TT.ggff1go',
      'TTg..gggbo',
    ],
    entities: [
      ['anglerfry', 4, 5],
      ['sign', 4, 6, { text: 'The water here runs in a circle. Swimmers get carried round. Walk through instead!' }],
    ],
  },
  // ---- reef --------------------------------------------------------------
  '0,11,3': {
    name: 'Reef Foot',
    legend: 'reef', music: 'reef',
    map: [
      '###11gg###',
      '#g11ggg.g#',
      '#11661..gg',
      '#g67....gg',
      '#gg.....gg',
      '#gg.....gg',
      '######Z###',
      '##########',
    ],
    // A crack in the foot of the reef cliff: a bomb opens it to Pot Cellar (S193).
    warps: [
      { x: 6, y: 6, to: { map: 'cave15', floor: 0, rx: 0, ry: 0, px: 72, py: 96 } },
    ],
    entities: [
      ['crab', 4, 3],
    ],
  },
  '0,12,3': {
    name: 'Barnacle Bank',
    legend: 'reef', music: 'reef',
    map: [
      '###gggg###',
      '#gg..gggg#',
      'gg.6677.gg',
      'g.67777.gg',
      'gg.677..gg',
      'gg.o...ggg',
      '#ggg..ggg#',
      '##########',
    ],
    entities: [
      ['barnacle', 3, 3], ['barnacle', 6, 3],
    ],
  },
  '0,15,3': {
    name: 'Palace Causeway',
    legend: 'reef', music: 'reef',
    map: [
      '###11gg###',
      '#11888.1g#',
      'g1188.881g',
      'gg1..8.1gg',
      'gg.6676.gg',
      'ggTT.o..gg',
      '#gg...ggg#',
      '##########',
    ],
    entities: [
      ['octorokSea', 5, 4],
    ],
  },
  '0,16,3': {
    name: 'Reef Edge',
    legend: 'reef', music: 'reef',
    map: [
      '###ggg1***',
      '#g..66111*',
      'gg.o..661*',
      'gg.....61*',
      'gg.677.q1*',
      'ggTT.6..1*',
      '#ggg..111*',
      '######****',
    ],
    entities: [
      ['pickup', 4, 3, { kind: 'fairy' }],
    ],
  },
  // ---- cliffs ------------------------------------------------------------
  '0,0,4': {
    name: 'Low Kell',
    legend: 'cliffs', music: 'kell',
    map: [
      '***1ggg###',
      '*11ggg####',
      '*1gggg##gg',
      '*1g11ggggg',
      '*1gg1gggog',
      '*11gggoggg',
      '**11gggg##',
      '***1555###',
    ],
    entities: [
      ['tektite', 5, 3],
    ],
  },
  '0,1,4': {
    name: 'Boulder Run',
    legend: 'cliffs', music: 'kell',
    map: [
      '###5511###',
      '#gg5511g##',
      'gggg515555',
      'gogggg11og',
      'gggooggggg',
      'gggggggogg',
      '#ggggggg##',
      '###gggg###',
    ],
    entities: [
      ['beetle', 4, 5], ['moblin', 2, 2],
    ],
  },
  '0,2,4': {
    name: 'Kell Basin',
    legend: 'cliffs', music: 'kell',
    map: [
      '###gggg###',
      '##gggg####',
      '5g1ggg##gg',
      'gg115ggggg',
      'ggg151oggg',
      'gggg11gggg',
      '##ggggggg#',
      '###gggg###',
    ],
    entities: [
      ['tektite', 2, 4], ['tektite', 6, 3],
    ],
  },
  '0,3,4': {
    name: 'The Deep Cut',
    legend: 'cliffs', music: 'kell',
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
      '#ggg111gg#',
      'gg.====.Xg',
      'gg.====.Xg',
      'gg......Xg',
      'gg______Xg',
      '#gggggggg#',
      '###gggg###',
    ],
    entities: [
      ['sign', 2, 2, { text: 'East across the water: the Drowned Wood. Swim it, blow the raft across, or grow a bridge!' }],
      // Moored, not patrolling: `range: 0` and `needTide: 0` make it a raft
      // that sits where it is until something blows it.
      ['raft', 3, 3, { axis: 'x', range: 0, needTide: 0 }],
    ],
  },
  // ---- wood --------------------------------------------------------------
  '0,4,4': {
    name: 'Shrine Path',
    legend: 'wood', music: 'wood',
    map: [
      'TTTTg..gTT',
      'TTTTgg.gTT',
      'gggggg.gTT',
      '........TT',
      'ggg.TT....',
      'ggg.TTg...',
      'TTggggg...',
      'TTggGggg..',
    ],
    entities: [
      ['zol', 6, 5], ['keese', 2, 3],
    ],
  },
  '0,5,4': {
    name: 'Shrine Mouth',
    legend: 'wood', music: 'wood',
    map: [
      'TTg.##.gTT',
      'TT.gDDg.TT',
      'TTg.DD.ggg',
      'TTf....ggg',
      '......TTgg',
      '..gg..TTgg',
      'g.gG.gTTTT',
      'gggg.gTTTT',
    ],
    warps: [
      { x: 4, y: 2, to: { map: 'd5', floor: 0, rx: 3, ry: 7, px: 112, py: 144 } },
      // Both halves of the arch enter. A two-tile-wide door whose
      // right half is scenery is a door the player bumps into.
      { x: 5, y: 2, to: { map: 'd5', floor: 0, rx: 3, ry: 7, px: 112, py: 144 } },
    ],
    entities: [
      ['sign', 2, 3, { text: 'DROWNED WOOD SHRINE\nHop on anything that floats!' }],
      ['wisp', 8, 5],
    ],
  },
  '0,9,4': {
    name: 'Log Drift',
    // Its Piece of Heart is Dov's thanks for his cargo now (S155, side
    // content); a rupee keeps the spot.
    legend: 'wood', music: 'wood',
    map: [
      'TTgggg.gTT',
      'TTg..gg1TT',
      'gg..TT1=TT',
      '..g.TT11TT',
      'ggggTTg...',
      'gggfgg..g.',
      'TTTTg..ggg',
      'TTTTggg.gg',
    ],
    entities: [
      ['anglerfry', 7, 2], ['pickup', 2, 5, { kind: 'rupee20' }],
    ],
  },
  '0,10,4': {
    name: 'Drowned Hollow',
    legend: 'wood', music: 'wood',
    map: [
      'TTg..gggTT',
      'TTggg11gTT',
      'TTg11==1TT',
      'TT1====1TT',
      '..1====1TT',
      'g.g1===1TT',
      'ggg11=11TT',
      'ggggggGgTT',
    ],
    entities: [
      ['anglerfry', 5, 3], ['jellyfish', 3, 5],
    ],
  },
  // ---- coral -------------------------------------------------------------
  '0,11,4': {
    name: 'Coral Shelf',
    legend: 'coral', music: 'reef',
    map: [
      '##########',
      '#g166661g#',
      '#1677661.1',
      '#16..6..gg',
      '#g1..o...1',
      '#gg.....gg',
      '#gg..ggg.#',
      '###gggg###',
    ],
    entities: [
      ['crab', 4, 3], ['urchin', 6, 4],
    ],
  },
  '0,12,4': {
    name: 'Anemone Field',
    legend: 'coral', music: 'reef',
    map: [
      '##########',
      '#g1..11gg#',
      '1g.66..6gg',
      'gg.6676.gg',
      '1g..676.gg',
      'gggo.11.gg',
      '#ggg..1gg#',
      '###gggg###',
    ],
    entities: [
      ['urchin', 3, 3], ['urchin', 6, 3], ['jellyfish', 4, 4],
    ],
  },
  '0,15,4': {
    name: 'Spire Coral',
    legend: 'coral', music: 'reef',
    map: [
      '##########',
      '#g11661gg#',
      'g116771.gg',
      'gg.6776.gg',
      'gg.o77.ggg',
      'ggg..1.ggg',
      '#g.gg..gg#',
      '###g##g###',
    ],
    entities: [
      ['octorokSea', 4, 4],
    ],
  },
  '0,16,4': {
    name: 'Outer Coral',
    legend: 'coral', music: 'reef',
    map: [
      '######****',
      '#g.666611*',
      'gg.6776.1*',
      'gg.o....1*',
      'gg..q66.1*',
      'ggg6...61*',
      '#gggg.g11*',
      '###ggg1***',
    ],
    entities: [
      ['crab', 4, 3], ['pickup', 5, 5, { kind: 'heartPiece' }],
    ],
  },
  // ---- cliffs ------------------------------------------------------------
  '0,0,5': {
    name: 'Kell Foot',
    legend: 'cliffs', music: 'kell',
    map: [
      '***1555###',
      '*11g555g##',
      '*1ggg51g55',
      '*1gog1ggg1',
      '*1ggoggggg',
      '*1TTggTTgg',
      '*11gggggg#',
      '****######',
    ],
    entities: [
      ['beetle', 4, 3],
    ],
  },
  '0,1,5': {
    name: 'Marsh Stair',
    legend: 'cliffs', music: 'kell',
    map: [
      '###gggg###',
      '#11gggg###',
      '551ggog##g',
      '11gggggggg',
      'gggggggogg',
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
    legend: 'cliffs', music: 'kell',
    map: [
      '###gggg###',
      '#ggggggg##',
      'gg11gggg55',
      'gg151goggg',
      'gggg1ggggg',
      'ggTTggTTgg',
      '###ggggg##',
      '##########',
    ],
    entities: [
      ['keese', 5, 3],
    ],
  },
  '0,3,5': {
    name: 'Kell Spur',
    legend: 'cliffs', music: 'kell',
    map: [
      '###gggg###',
      '#ggggg#Z##',
      '5ggggg#g##',
      'gg11ggggg#',
      'ggg15gogg#',
      'gggg1gggg#',
      '#ggggggg##',
      '##########',
    ],
    // THE QUARRYMAN'S DOOR (S195): a crack in the east cliff at 7,1; a bomb
    // opens it on Quarry Hollow (cave17) and its bigger bomb bag.
    warps: [
      { x: 7, y: 1, to: { map: 'cave17', floor: 0, rx: 0, ry: 0, px: 72, py: 96 } },
    ],
    entities: [
      ['moblin', 4, 3], ['pickup', 2, 2, { kind: 'rupee20' }],
    ],
  },
  // ---- wood --------------------------------------------------------------
  '0,4,5': {
    name: 'Bog Trees',
    legend: 'wood', music: 'wood',
    map: [
      'TTggggg..g',
      'TTg111g..g',
      'TT1==1g...',
      'TT1==1gggg',
      'TT111gTTTT',
      'TTggggTTTT',
      'TTTTggggTT',
      'TTTTg.ggTT',
    ],
    entities: [
      ['zol', 8, 2], ['keese', 6, 2],
    ],
  },
  '0,5,5': {
    name: 'Wood Heart',
    legend: 'wood', music: 'wood',
    map: [
      'gggg.gTTTT',
      'ggg..gTTTT',
      '.....ggggg',
      'gggg..gggg',
      'TT111.gggg',
      'TT1==1.ggg',
      'TT1111..TT',
      'TTggg..gTT',
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
  '0,9,5': {
    name: 'Sunken Glade',
    legend: 'wood', music: 'wood',
    map: [
      'TTTTgg.ggg',
      'TTTTg.gg.g',
      'gg...gggg.',
      '..g.gGg.gg',
      'ggggTTggTT',
      'g.ggTTgfTT',
      'TTgg.gTTTT',
      'TTg.ggTTTT',
    ],
    entities: [
      ['zol', 3, 4], ['moblin', 6, 3],
    ],
  },
  '0,10,5': {
    name: 'Wood Verge',
    legend: 'wood', music: 'wood',
    map: [
      'ggggggggTT',
      '.gg111ggTT',
      'gg1==11gTT',
      'gg1===1gTT',
      'TTg111ggTT',
      'TTggggGgTT',
      'TTTTTTTTTT',
      'TTTTTTTTTT',
    ],
    entities: [
      ['anglerfry', 4, 3],
    ],
  },
  // ---- coral -------------------------------------------------------------
  '0,11,5': {
    name: 'Reef Wall',
    legend: 'coral', music: 'reef',
    map: [
      '###gggg###',
      '#g11661gg#',
      '#1667..ggg',
      '#g6.6..ggg',
      '#gTT...o.g',
      '#gg.....gg',
      '#ggg..gg.#',
      '##########',
    ],
    entities: [
      ['urchin', 4, 3],
    ],
  },
  '0,12,5': {
    name: 'Coral Hollow',
    legend: 'coral', music: 'reef',
    map: [
      '###gggg###',
      '#gg..gggg#',
      'gg.b..b.gg',
      'g.....1.gg',
      'gg.6676.gg',
      'gg.TT...gg',
      '#g....ggg#',
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
  '0,15,5': {
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
      '###gggg###',
    ],
    warps: [
      { x: 4, y: 2, to: { map: 'd2', floor: 0, rx: 3, ry: 7, px: 112, py: 144 } },
      // Both halves of the arch enter. A two-tile-wide door whose
      // right half is scenery is a door the player bumps into.
      { x: 5, y: 2, to: { map: 'd2', floor: 0, rx: 3, ry: 7, px: 112, py: 144 } },
    ],
    entities: [
      ['sign', 2, 3, { text: 'CORAL SPIRE\nLet the sea carry you up.' }],
    ],
  },
  '0,16,5': {
    name: 'Coral Foot',
    legend: 'coral', music: 'reef',
    map: [
      '###ggg1***',
      '#g.666111*',
      'gg.6776.1*',
      'gg..6...1*',
      'gg6.o.661*',
      'ggTT..611*',
      '#ggg..111*',
      '######****',
    ],
    entities: [
      ['crab', 5, 3], ['urchin', 2, 4],
    ],
  },
  // ---- marsh -------------------------------------------------------------
  '0,0,6': {
    name: 'Bog Head',
    legend: 'marsh', music: 'marsh',
    map: [
      '****TTTTTT',
      '*1*gTTTTTT',
      '*11ggfTTgg',
      '*1g!!gTTgg',
      '*1.!!!g.gg',
      '*11g..###g',
      '*11#######',
      '***#######',
    ],
    entities: [
      ['zol', 8, 3],
      // The jar the village house's netmaker left filling at the spring
      // (S155 errand).
      ['pickup', 4, 5, { kind: 'e_bogwater' }],
    ],
  },
  '0,1,6': {
    name: 'Bog Stair',
    legend: 'marsh', music: 'marsh',
    map: [
      'TToggggoTT',
      'TTg.gg.gTT',
      'g.!!g.TT.g',
      'g!!!g.TTgg',
      'gg!!...fgg',
      'ggg....ggg',
      '###____#gg',
      '###....###',
    ],
    entities: [
      ['leever', 5, 4], ['sign', 2, 5, { text: 'North: boulders, and the cliffs beyond.' }],
    ],
  },
  '0,2,6': {
    name: 'Reedbank',
    legend: 'marsh', music: 'marsh',
    map: [
      'TTTTTTTTTT',
      'TTTTTTTTTT',
      'ggg.g!!gTT',
      'g.!~==~gTT',
      'gg!~==!gTT',
      'gf.!!!.gTT',
      'gg.f.g##TT',
      '########TT',
    ],
    entities: [
      ['zol', 1, 4], ['keese', 3, 2],
    ],
  },
  // ---- coast -------------------------------------------------------------
  '0,3,6': {
    name: 'Bluff Hollow',
    legend: 'coast', music: 'overworld',
    // THE CRACKED WALL (S155 side content). A short bluff face standing in the
    // treeline, drawn the way West Bluff's grotto is drawn one screen south:
    // `###` over `#Z#`. The crack at 4,1 is `cliffCrackedCave`; a bomb leaves
    // a cave mouth, and the warp below has been listed on that cell all along.
    map: [
      'TTT###TTTT',
      'TgT#Z#TTfT',
      'Tg.b..b.gT',
      'Tf......gT',
      'Tf.x..o.gT',
      'Tgg....ggT',
      'Tgg....ggT',
      'TToggggoTT',
    ],
    warps: [
      { x: 4, y: 1, to: { map: 'cave5', floor: 0, rx: 0, ry: 0, px: 72, py: 96 } },
    ],
    entities: [
      ['sign', 6, 3, { text: 'Someone has been digging here.\nThe bluff behind has a crack in it.' }],
      // The village child's kite (S155 errand), up the tree east of the bluff.
      // Only a gust of the Squall Bellows brings it down.
      ['treeSnag', 7, 1, { drops: 'e_kite', hideFlag: 'foundKite' }],
    ],
    buried: [[3, 4, 'rupee20']],
  },
  // ---- wood --------------------------------------------------------------
  '0,4,6': {
    name: 'South Wood',
    legend: 'wood', music: 'wood',
    map: [
      'TTTTggggTT',
      'TTTTg11gTT',
      'TT11==1gTT',
      'TT1====1TT',
      'TT11=11ggg',
      'TTg111gggg',
      'TTTTTTTTTT',
      'TTTTTTTTTT',
    ],
    entities: [
      ['zol', 7, 5],
    ],
  },
  '0,5,6': {
    name: 'The Wading',
    legend: 'wood', music: 'wood',
    map: [
      'TTggg..gTT',
      'TTgg..ggTT',
      'TTg.gggggg',
      'TT.g111ggg',
      'gg.g1=1ggg',
      'ggf.g11gGg',
      'TTg..gggTT',
      'TTo...goTT',
    ],
    entities: [
      ['sign', 2, 5, { text: 'South: Tidewatch Village.\nNorth: the Drowned Wood Shrine.' }],
    ],
  },
  '0,9,6': {
    name: 'Wood Foot',
    legend: 'wood', music: 'wood',
    map: [
      'TTg.ggTTTT',
      'TTgg.gTTTT',
      'ggggg.ggTT',
      '....gg1gTT',
      'gggf1==1TT',
      'ggggg111TT',
      'TTTTTTTTTT',
      'TTTTTTTTTT',
    ],
    entities: [
      ['keese', 4, 3], ['pickup', 7, 3, { kind: 'rupee20' }],
    ],
  },
  // ---- dunes -------------------------------------------------------------
  '0,10,6': {
    name: 'Dune Head',
    legend: 'dunes', music: 'dunes',
    map: [
      'TTTTOOTTTT',
      'TTT.O.TT..',
      'TT.......g',
      'T...gggggg',
      'OO.ggg11gg',
      'O..gg1==1g',
      'TT..TT11gg',
      'TT...ggggg',
    ],
    entities: [
      ['crab', 4, 3],
    ],
  },
  '0,11,6': {
    name: 'North Dunes',
    legend: 'dunes', music: 'dunes',
    map: [
      'TTTTTTOOTT',
      '..TT..O...',
      'g.......gg',
      'ggg....111',
      'ggTT..11==',
      'gg....1===',
      'ggg...11==',
      'gggg...111',
    ],
    entities: [
      ['leever', 4, 3], ['crab', 6, 4],
    ],
  },
  '0,12,6': {
    name: 'Sandbar Run',
    legend: 'dunes', music: 'dunes',
    map: [
      'TTTTTTTTTT',
      '..g.TT....',
      'gg........',
      '11gg...ggg',
      '==1gg.TTgg',
      '==1gg...gg',
      '=11g...ggg',
      '11g...gggg',
    ],
    entities: [
      ['crab', 3, 3], ['octorokSea', 1, 5],
    ],
  },
  '0,15,6': {
    name: 'Feather Gap',
    legend: 'dunes', music: 'dunes',
    map: [
      'TToggggoTT',
      'T..gggg..T',
      '..gggg....',
      '..gg......',
      '..TT......',
      '..........',
      '........TT',
      '........TT',
    ],
    entities: [
      ['sign', 4, 4, { text: 'North lies the reef.\nSouth, the dunes run down to the sea.' }],
    ],
  },
  '0,16,6': {
    name: 'East Dunes',
    legend: 'dunes', music: 'dunes',
    map: [
      'TTTTTT****',
      'TgTTTTT*1*',
      'gg....O11*',
      '........1*',
      '...11...1*',
      '..1==1.g1*',
      'TT.11g111*',
      'TT....1***',
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
      '***#######',
      '*1g###gggg',
      '*11g..TTgg',
      '*1.!!.TTgg',
      '**1~==TTgg',
      '*11.~~TTgg',
      '**1.....gg',
      '***1....gg',
    ],
    entities: [
      ['leever', 4, 2],
    ],
  },
  '0,1,7': {
    name: 'Sanctum Path',
    legend: 'marsh', music: 'marsh',
    map: [
      '###....###',
      'g##g..g###',
      'gggg......',
      'g.TT..g.fg',
      'g.TT..TTg.',
      'g.TT..TTgg',
      'g.!...g.gg',
      'g.og##go.g',
    ],
    entities: [
      ['zol', 8, 5], ['pickup', 5, 2, { kind: 'rupee20' }],
    ],
  },
  '0,2,7': {
    name: 'Bog Causeway',
    legend: 'marsh', music: 'marsh',
    map: [
      '######TTTT',
      '###ggfTTgT',
      '.......gXg',
      'g.~55~..%g',
      'gg~555~.%g',
      'g..~55TT%g',
      '.gg....ggT',
      'g.og..goTT',
    ],
    entities: [
      ['sign', 2, 2, { text: 'The causeway wades only at LOW tide.' }],
      ['zol', 4, 6],
    ],
  },
  // ---- coast -------------------------------------------------------------
  '0,3,7': {
    name: 'West Bluff',
    legend: 'coast', music: 'overworld',
    map: [
      'TToggggoTT',
      'Tg###..ggT',
      'gg#C#>..gg',
      'gf...>..gg',
      'gfGgg>gGgg',
      'ggg..>.ggg',
      'Tgg....ggT',
      'TTog51goTT',
    ],
    warps: [
      { x: 3, y: 2, to: { map: 'cave1', floor: 0, rx: 0, ry: 0, px: 72, py: 96 } },
    ],
    entities: [
      ['sign', 4, 4, { text: 'A cave in the bluff. Something\'s glittering inside!' }],
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
    name: "Tidewatch Village",
    // TIDEWATCH IS HORON VILLAGE'S SIZE (S157): five screens by two, 0,4,7 to
    // 0,8,8, drawn as one 50x16 plan and cut into screens so the roads and yards
    // run across the seams. Horon's own ground and plaza (legend 'horon'). The
    // town's ways out are where they always were: west to West Bluff and Shell
    // Beach, north to The Wading, south to the Fishing Stones and South Sands,
    // east to Sunken Reef and East Strand.
    // The Hearth house and the Maku Tree's hollow.
    legend: 'horon', music: 'tidewatch',
    map: [
      'TTTTTTTTTT',
      'TTTTCTTTTT',
      'yjjj.gffyy',
      'yjjj.gyyyy',
      'yjjj.ggggg',
      '..........',
      'TTggg.gvvg',
      'TTggg.gvvg',
    ],
    warps: [
      { x: 2, y: 4, to: { map: 'houseHearth', floor: 0, rx: 0, ry: 0, px: 72, py: 96 } },
      { x: 4, y: 1, to: { map: 'houseMaku', floor: 0, rx: 0, ry: 0, px: 72, py: 96 } },
    ],
    entities: [
      ['sign', 2, 6, { text: 'TIDEWATCH VILLAGE\nEast: the square, the shop, and the\nShallows beyond.' }],
      ['giver', 8, 4, {
        ...FOLK.salter, dialogue: 'digger', waiting: 'diggerWait',
        after: 'diggerAfter', flag: 'gotCoin', item: 'coin', level: 1,
        needEssences: 3,
        // The Moss Key, once the fourth Essence is in (S154).
        beat: { scene: 'mossKey', need: 4, flag: 'keyD5' },
      }],
    ],
  },
  '0,5,7': {
    name: "Village East",
    // The shop, one building a screen as Horon has it.
    legend: 'horon', music: 'tidewatch',
    map: [
      'TTogg.goTT',
      'TTggg.ggTT',
      'yHHHy.TTgg',
      'yHHHy.TTgg',
      'yHHHy.gggg',
      '..........',
      'gvvvg.gfyg',
      'gvvvg.gyyg',
    ],
    warps: [
      { x: 2, y: 4, to: { map: 'houseShop', floor: 0, rx: 0, ry: 0, px: 72, py: 96 } },
    ],
    entities: [
      ['npc', 8, 3, { sprite: 'npc_child', wander: true, dialogue: 'villageChild', after: 'child1', needEssences: 2 }],
    ],
  },
  '0,9,7': {
    name: 'Sunken Reef',
    legend: 'coast', music: 'overworld',
    map: [
      'TTTTTTTTTT',
      'Tgg###.gfT',
      'gg.1C1111g',
      '1111111.gg',
      '1111111.gg',
      'gg111..gfg',
      'Tgf1gggggT',
      'TToggggoTT',
    ],
    warps: [
      { x: 4, y: 2, to: { map: 'cave2', floor: 0, rx: 0, ry: 0, px: 72, py: 96 } },
    ],
    entities: [
      ['crab', 6, 4], ['sign', 1, 2, { text: 'At LOW tide the reef is a road.' }],
    ],
  },
  // ---- dunes -------------------------------------------------------------
  '0,10,7': {
    name: 'Shallows Gate',
    legend: 'dunes', music: 'dunes',
    map: [
      'TT..gggggg',
      'TT.ggggggg',
      '...gg.1111',
      '....111==1',
      'g...11===1',
      'g...11111.',
      'TT..TT....',
      'TT.g......',
    ],
    entities: [
      ['sign', 2, 2, { text: 'THE SHALLOWS\nAt LOW tide the sandbar walks you east.' }],
      ['crab', 2, 5],
    ],
  },
  '0,11,7': {
    name: 'Grotto Approach',
    legend: 'dunes', music: 'dunes',
    map: [
      'gggg...111',
      '..gg....11',
      '11..B.....',
      '11........',
      '11........',
      '..........',
      '..o.gg..TT',
      '..og##goTT',
    ],
    entities: [
      ['octorok', 4, 3], ['crab', 6, 4],
    ],
  },
  '0,12,7': {
    name: 'Dune Bowl',
    legend: 'dunes', music: 'dunes',
    map: [
      '11g....ggg',
      '1g........',
      '..........',
      '..........',
      '....555555',
      '..55555555',
      'TT......TT',
      'TTO....OTT',
    ],
    entities: [
      ['leever', 4, 3], ['leever', 6, 3],
    ],
  },
  '0,15,7': {
    name: 'Tidepools',
    legend: 'dunes', music: 'dunes',
    map: [
      '..gg....TT',
      '.g22g...TT',
      'TT222.....',
      'TT2222....',
      '..222.....',
      '5.........',
      'TT........',
      'TT........',
    ],
    entities: [
      ['crab', 4, 3], ['urchin', 6, 4],
    ],
  },
  '0,16,7': {
    name: 'Far Dunes',
    legend: 'dunes', music: 'dunes',
    map: [
      'TT....1***',
      'TT....O*1*',
      'g.....O11*',
      '.g.22...1*',
      '..2222..1*',
      '...22.gg1*',
      '..gg..g11*',
      '...g..1***',
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
      '***1....gg',
      '*1*.g.f.gg',
      '*11.!!!.gg',
      '*1.!~=~!.g',
      '**1!~=TTgg',
      '*11.!!TTgg',
      '*1g..b...g',
      '***1.....g',
    ],
    entities: [
      ['leever', 8, 3], ['leever', 4, 6],
    ],
  },
  '0,1,8': {
    name: 'Sanctum Mouth',
    legend: 'marsh', music: 'marsh',
    map: [
      '..og##go..',
      '.gf.DD.gg.',
      'ggf.DD.ggg',
      'gg.!!!!.gg',
      'g.g.TT.g.g',
      'gg..TT..fg',
      'g.f.....TT',
      'g...g...TT',
    ],
    warps: [
      { x: 4, y: 2, to: { map: 'd3', floor: 1, rx: 3, ry: 7, px: 112, py: 144 } },
      // Both halves of the arch enter. A two-tile-wide door whose
      // right half is scenery is a door the player bumps into.
      { x: 5, y: 2, to: { map: 'd3', floor: 1, rx: 3, ry: 7, px: 112, py: 144 } },
    ],
    entities: [
      ['sign', 2, 3, { text: 'BOGWATER SANCTUM\nThe current only pushes swimmers.' }],
      ['zol', 7, 4],
    ],
  },
  '0,2,8': {
    name: 'Sunken Reeds',
    legend: 'marsh', music: 'marsh',
    map: [
      '..og..goTT',
      '.g...gg.TT',
      'g..!!!..TT',
      'g.!~=~!.TT',
      'g.TT~!.gTT',
      'g.TT..fgTT',
      'TT....g.TT',
      'TTg.....TT',
    ],
    entities: [
      ['keese', 6, 1], ['zol', 6, 2],
    ],
  },
  // ---- coast -------------------------------------------------------------
  '0,3,8': {
    name: 'Shell Beach',
    legend: 'coast', music: 'overworld',
    map: [
      'TTog51goTT',
      'Tgg.511ggT',
      'Tg..111ogg',
      'Tg.111111g',
      'Tg1111111g',
      'Tgf...1ggg',
      'TgfggfgggT',
      'TToggggoTT',
    ],
    entities: [
      ['crab', 4, 4], ['octorok', 2, 2],
      // THE WEST COAST'S FAIRY, and it is here because the long walk is here.
      //
      // The world had exactly one fairy — Reef Edge, `0,11,3`, out on the far
      // eastern reef — and the whole western half of the map, which is where
      // the Coastwise Chain does its zig-zagging, had nothing at all. A run
      // that walks the chain end to end leaves the Drowned Wood Shrine nearly
      // full and reaches the Abyssal Keep's arch on a heart and a half: it is
      // not a fight it loses anywhere, it is two quarter-hearts a screen for
      // forty-odd screens with nothing anywhere on the road to put them back.
      // This is the thing that puts them back.
      //
      // WHY THIS SCREEN. The chain crosses Shell Beach twice — out to the
      // marsh links and home again — and the road to the Cliffs of Kell does
      // not cross it at all, so the fairy is found by the player who is doing
      // the walk that costs, and not handed to the one who is merely passing
      // through the bluffs on the way to a dungeon.
      //
      // WHY THIS TILE. 8,2 is the sheltered pocket beside the rock at 7,2, off
      // the beach's east edge and above the tide pool: you have to come up the
      // east side and round the rock to be standing in it. A fairy in the
      // middle of the sand would be a healing station on the main road; one in
      // a corner you have to turn into is a place you go. It sits at 8,2 and
      // not the tile above it because the tree line along the top of this
      // screen is two tiles deep on screen and one in the data, and 8,1 is
      // under its canopy — see check-ground.mjs's overhang sweep.
      ['pickup', 8, 2, { kind: 'fairy' }],
    ],
  },
  // The village's waterfront: the net-mender's cottage, a paling fence and the
  // tide pool that was already here. The pool is deep at HIGH and the cottage
  // door is not on it, which is the rule for a town — a building may narrow a
  // route and may never be the reason a screen has none. See check-towns.mjs.
  '0,4,8': {
    name: "Village Shore",
    // The Net-mender's house.
    legend: 'horon', music: 'tidewatch',
    map: [
      'TTggg.gvvg',
      'TTggg.gvvg',
      'gyhhh.yffy',
      'gyhhh.yyyy',
      'gyhhh.gggg',
      '..........',
      'TTggg.ggTT',
      'TTogg.goTT',
    ],
    warps: [
      { x: 3, y: 4, to: { map: 'houseNets', floor: 0, rx: 0, ry: 0, px: 72, py: 96 } },
    ],
    entities: [
      ['trader', 6, 3, {
        sprite: 'npc_child', waiting: 'coastChild', after: 'pellAfter',
        deals: [{ stage: 2, wants: 'float', gives: 'claw', text: 'pellTrade' }],
      }],
    ],
  },
  // The village's timber yard, on the screen already named for the wood that
  // washes up on it: the chopping stump and a length of paling fence. No door
  // and no building — a settlement is not only the houses, and the kit's job
  // here is to make a screen look worked rather than decorated.
  '0,5,8': {
    name: "Driftwood Strand",
    // The timber yard: the chopping stump, crates and a paling fence.
    legend: 'horon', music: 'tidewatch',
    map: [
      'gvvvg.gggg',
      'gvvvg.gggg',
      'yuuuy.gggg',
      'yuuuy.gnng',
      'yyezi.gnng',
      '..........',
      'TTggg.ggTT',
      'TTogg.goTT',
    ],
    entities: [
      ['pickup', 9, 3, { kind: 'rupee20' }],
      ['trader', 6, 3, {
        ...FOLK.salter, dir: 'left', waiting: 'timberSalter', after: 'hullaAfter',
        deals: [{ stage: 3, wants: 'claw', gives: 'brick', text: 'hullaTrade' }],
      }],
    ],
  },
  '0,9,8': {
    name: 'East Strand',
    legend: 'coast', music: 'overworld',
    // THE LIGHTHOUSE LENS (S200, the dark lighthouse quest) lies under the
    // sandbar at 4,3: dry sand at LOW, so the Dredge Line finds it only once
    // the sea covers that floor. Dredged and left lying, it comes back on the
    // next visit until it is carried off.
    buried: [[4, 3, 'e_lens']],
    script: {
      onEnter(game) {
        if (game.progress.flags.foundLens) return;
        if (!game.progress.secrets['overworld:0,9,8:dredge:4,3']) return;
        game.spawnPickup(64, 48, 'e_lens', { grabDelay: 14 });
      },
    },
    map: [
      'TToggggoTT',
      'Tfg..11ggT',
      'gf...111gg',
      'gg.1111.gg',
      'gg.1111.gg',
      'gf111..ggg',
      'Tff11ggggT',
      'TToggggoTT',
    ],
    entities: [
      ['crab', 3, 3], ['crab', 6, 4],
    ],
  },
  // ---- dunes -------------------------------------------------------------
  '0,10,8': {
    name: 'Dune Crossing',
    legend: 'dunes', music: 'dunes',
    map: [
      'OO.gg.....',
      'O.ggg.....',
      '..gg.11...',
      '.gg.1111..',
      'gg.11==11.',
      'g...111.g.',
      'TT......TT',
      'TTO....OTT',
    ],
    entities: [
      ['octorok', 4, 3], ['crab', 7, 5],
    ],
  },
  '0,11,8': {
    name: 'Grotto Mouth',
    legend: 'dunes', music: 'dunes',
    map: [
      '..og##goTT',
      '.gg.DD.ggT',
      'ggg.DD.ggg',
      'gg.1111.gg',
      'gg......gg',
      'gg.....ggg',
      'TT.....gTT',
      'TTo....oTT',
    ],
    warps: [
      { x: 4, y: 2, to: { map: 'd1', floor: 0, rx: 3, ry: 7, px: 112, py: 144 } },
      // Both halves of the arch enter. A two-tile-wide door whose
      // right half is scenery is a door the player bumps into.
      { x: 5, y: 2, to: { map: 'd1', floor: 0, rx: 3, ry: 7, px: 112, py: 144 } },
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
  '0,12,8': {
    name: 'Sandpiper Row',
    // SANDPIPER ROW IS THREE SCREENS (S157), 0,12,8 to 0,14,8: a street of
    // houses along one sandy lane. Sandpiper Cottage where it always was; the
    // way north to Dune Bowl and south to Deep Bar are this screen's.
    legend: 'townDunes', music: 'sandpiper',
    map: [
      'TToGGGGoTT',
      'TTg....gTT',
      'gjjjgg..gg',
      'gjjjg...gg',
      'gjjjg..ggg',
      '..........',
      'TTg....gTT',
      'TToGGGGoTT',
    ],
    warps: [
      { x: 2, y: 4, to: { map: 'houseSandpiper', floor: 0, rx: 0, ry: 0, px: 72, py: 96 } },
    ],
    entities: [
      ['sign', 5, 1, { text: 'SANDPIPER ROW\nTwo houses, one boat, no harbour.' }],
      ['npc', 5, 5, { sprite: 'npc_fisher', wander: true, dialogue: 'fisher1', after: 'fisher1After', needEssences: 2,
        // The Coral Key, once the first Essence is in (S154).
        beat: { scene: 'coralKey', need: 1, flag: 'keyD2' } }],
    ],
  },
  '0,15,8': {
    name: 'Shell Flats',
    legend: 'dunes', music: 'dunes',
    map: [
      'TT.g......',
      'TT.g11g...',
      '..g1444g..',
      '.g144441gg',
      'gg144444gg',
      'g.g1111.gg',
      'TT.gg..gTT',
      'TTO....OTT',
    ],
    entities: [
      ['urchin', 4, 3], ['pickup', 6, 4, { kind: 'heartPiece' }],
    ],
  },
  '0,16,8': {
    name: 'Dune Corner',
    legend: 'dunes', music: 'dunes',
    map: [
      '......1***',
      '......O*1*',
      '...x..O11*',
      'g..gg...1*',
      'gg.1111.1*',
      'gg.1==.g1*',
      'TT.gg.g11*',
      'TToggg1***',
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
    // THE THIRD ANCHOR GATE OUT OF DOORS. The other two lay the bar on bare
    // seafloor; the marsh has no bare seafloor, so this one is laid on a
    // channel — water the whole time, shallow enough to wade at LOW and
    // running too deep above it. It goes where the seafloor goes and it does
    // not look like it, which is the point of doing the third one in a region
    // with its own ground rather than a fourth one on sand.
    map: [
      '***1..g..g',
      '*1*g.b.ggg',
      '*11!!..ggg',
      '*1..!!..gg',
      '*11.oo.1gg',
      '*1*******1',
      '*1555$$$1*',
      '**********',
    ],
    anchorGate: { from: [1, 6], to: [8, 6] },
    entities: [
      ['leever', 5, 2],
    ],
    script: {
      onEnter(game) {
        if (game.progress.secrets.bogFootBlank) return;
        game.spawnPickup(128, 96, 'blank', { grabDelay: 14, saveKey: 'bogFootBlank' });
      },
    },
  },
  '0,1,9': {
    name: 'Witchs Hollow',
    legend: 'marsh', music: 'marsh',
    map: [
      'gg..g...TT',
      'g.f....gTT',
      'g.TT.bb.gg',
      'gfTT....gg',
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
    // The third outdoor Reefseed grove — item-reuse (docs/prompts/STATE.md).
    // South Shallows (`0,7,9`) and Worlds Edge (`0,11,9`) proved the fixture
    // in `dunes`, both fixed at the tile level. This is the first placement
    // in a region whose own cliffs were never asked whether they need the
    // same fix: `marsh` doesn't override `9`/`drownWall`, so the bar renders
    // in the base `cliff`/`cliffTop` pair (`pal:'stone'`) while every other
    // wall marsh actually authors is `cliffDk` (`pal:'stonedk'`) — the exact
    // shape of gap `cliffSand` had before S100, untested until now.
    //
    // Same shape as the first two: bank at 5,3 (was `!`/mudflat, now plain
    // `.`/mud so it's dry at every tide, not just some), bar at 5,4 (was a
    // `1`/sandbar cell, now `9`), stake at 5,5 with the swim-around at 4,5
    // and 6,5 (both `=`/plain `waterD`, open to the Cleats), snarl at 5,6
    // boxed by border `*`. Carved into what was open sea south of the
    // mudflat band; the zol at 4,3 and the mudflat cells either side of the
    // bank are untouched.
    map: [
      'TTg.....TT',
      'TT.f...gTT',
      'gg......gT',
      'gg.!!.!.fT',
      'gg1119111*',
      '11**===*1*',
      '*1***k**1*',
      '**********',
    ],
    reefseedRoom: {
      entry: [4, 1],
      stakes: [
        { at: [5, 5], from: [5, 3], face: 'down', sea: 2 },
      ],
      snarl: [5, 6], cutFrom: [5, 5],
    },
    entities: [
      ['zol', 4, 3],
    ],
  },
  // ---- coast -------------------------------------------------------------
  '0,3,9': {
    name: 'South Bluff',
    legend: 'coast', music: 'overworld',
    // THE TIDE-POOL RACE (S155 side content) starts here. Row 6 is a sand
    // path through the sea (`4`, seafloor: dry at LOW, deep above), running
    // east through Fishing Stones to an islet on the South Sands where the
    // finish is. It is the only way to the islet on foot.
    map: [
      'TToggggoTT',
      'Tff....ggT',
      'Tg.o.oo.gg',
      'Tg......gg',
      '*11x1111gg',
      '*1******11',
      '*144444444',
      '**********',
    ],
    entities: [
      ['octorok', 6, 3],
      ['racer', 2, 3, {
        race: 'shore', sprite: 'npc_child', ask: 'raceAsk', busy: 'raceBusy',
        win: 'raceWin', lose: 'raceLose', prize: 'heartPiece', again: 'rupee20', flag: 'raceWon',
      }],
    ],
    buried: [[3, 4, 'rupee20']],
  },
  '0,4,9': {
    name: 'Fishing Stones',
    legend: 'coast', music: 'overworld',
    // Row 6 is the tide-pool race's sand path (see South Bluff).
    map: [
      'TToggggoTT',
      'Tgg....ggT',
      'gg......gg',
      'gg.3333.gg',
      'gg133331gg',
      '11******11',
      '4444444444',
      '**********',
    ],
    entities: [
      // Coastwise Chain, link 10. He hooked the kettle off the stones, which is
      // where a kettle that went out on an ebb from the village shore would end
      // up — the chain walks the whole coast to bring it back two screens.
      ['trader', 2, 2, {
        sprite: 'npc_fisher', waiting: 'stoneFisher', after: 'teelAfter',
        deals: [{ stage: 10, wants: 'jar', gives: 'kettle', text: 'teelTrade' }],
        // THE FIRST PERSON A NEW GAME MEETS (S158): the tide left Link on
        // his stones. No crab here any more: the game opens on this screen
        // with an empty hand.
        beat: { scene: 'wakeBeach', flag: 'metFisher' },
      }],
    ],
  },
  '0,5,9': {
    name: 'South Sands',
    legend: 'coast', music: 'overworld',
    // The tide-pool race's finish (S155): the sand path along row 6 ends at
    // the islet at 7,6, which nothing else reaches on foot. Not in row 5: the
    // sandbars in row 4 would wade to it at MID.
    map: [
      'TToggggoTT',
      'Tfg....fgT',
      'gg......gg',
      'gg.1111.gg',
      'gg111111gg',
      '11******11',
      '4444444.**',
      '**********',
    ],
    entities: [
      ['octorok', 4, 3],
      ['raceGoal', 7, 6, { race: 'shore', sprite: 'npc_villager2', dialogue: 'raceGoalWait' }],
      // The shopkeeper's ledger (S155 errand), blown down the beach.
      ['pickup', 8, 2, { kind: 'e_ledger' }],
    ],
  },
  '0,9,9': {
    name: 'Reef Pocket',
    legend: 'coast', music: 'overworld',
    // THE SECOND ANCHOR GATE OUT OF DOORS, and it is Deep Bar's run backwards:
    // you start on the far spit and the prize is on the near one, so the whole
    // crossing happens with the shore in front of you rather than behind. The
    // screen already carried a sign saying only the drained sea shows this
    // floor, which is half the answer and the half that is not enough — the
    // drained sea shows the floor and fills nothing, and the filled sea takes
    // the floor away. The iron is what holds one of them still.
    map: [
      'TToggggoTT',
      'TggggggggT',
      'gg......gT',
      'gf.4444.gT',
      'gf1444411*',
      '1*******1*',
      '*1$$$4441*',
      '**********',
    ],
    anchorGate: { from: [8, 6], to: [1, 6] },
    entities: [
      ['pickup', 4, 4, { kind: 'rupee20' }],
      ['sign', 2, 2, { text: 'This floor only shows at LOW tide.' }],
    ],
    script: {
      onEnter(game) {
        if (game.progress.secrets.reefPocketBlank) return;
        game.spawnPickup(16, 96, 'blank', { grabDelay: 14, saveKey: 'reefPocketBlank' });
      },
    },
  },
  // ---- dunes -------------------------------------------------------------
  '0,10,9': {
    name: 'South Shallows',
    legend: 'dunes', music: 'overworld',
    // The first outdoor Reefseed grove — item-reuse (docs/prompts/STATE.md).
    // S98 found the overworld half of the rotation's four single-use items
    // grep-deep "structurally blocked" and S99 withdrew that: neither
    // `check-overworld.mjs` (it keys `reached` on the room, not the cell) nor
    // `check-strands.mjs` (a baseline, `--record` and all) actually forbids a
    // gated pocket. This is the room that tests it, not argues it.
    //
    // Same fixture every grove in the Drowned Wood Shrine uses — bank, bar,
    // stake, snarl, one tile apart in a line — just built from tiles the
    // overworld already owns instead of the Shrine's own set. `9` is the
    // bar: solid at LOW/MID, open water at HIGH, the same shape as `dSnag`.
    // It reads as `cliffSand` here, not plain `drownWall` — see
    // `drownWallSand`'s and `cliffSandTop`'s tiledef comments in
    // tiles-core.js for the two-part reason a one-row outdoor wall needed
    // both a region body AND a region top before it stopped looking like a
    // grey box dropped on the beach. `=`/plain `waterD` is the stake,
    // always deep so nothing stands there until a pillar does. `k`/
    // `seaSnarl` is the snarl, the Keep's own `reef`-palette kelp rather
    // than the Shrine's oak-trunked one — see its tiledef comment for why
    // that one and not the other.
    //
    // The pocket sits south of the plaza in what was open sea. Bank at 5,3,
    // thrown down at HIGH into the bar at 5,4, into the stake at 5,5 — and
    // the bar is solid at LOW same as `dBole` is, so the pillar it grows
    // needs the same answer the Shrine's own groves give it: plain `waterD`
    // either side of the stake (4,5 and 6,5), open to a swimmer, so the
    // route to what was grown runs AROUND the bar rather than through it —
    // the one piece of the fixture's geometry that isn't legible from a
    // single row and cost this room its first failed run
    // (`check-reefseed.mjs`: "nothing reaches the stake once it is grown").
    // The snarl at 5,6 gets none of that width — boxed by border `*` on
    // both flanks, same as before, so the only blade that reaches it is the
    // one standing on the stake. Nothing beyond it is needed for anything —
    // it is a find, same as the Keep's own.
    map: [
      'TToggggoTT',
      'Tgg....ggT',
      'Tg.g....gg',
      'Tg.11.1.gg',
      '*1111911gg',
      '*1**===*11',
      '*1***k**1*',
      '**********',
    ],
    reefseedRoom: {
      entry: [4, 1],
      stakes: [
        { at: [5, 5], from: [5, 3], face: 'down', sea: 2 },
      ],
      snarl: [5, 6], cutFrom: [5, 5],
    },
    entities: [
      ['crab', 4, 3],
      ['sign', 6, 2, { text: 'Plant seeds at HIGH tide. Stand on what grows at LOW tide!' }],
    ],
  },
  '0,11,9': {
    name: 'Wrecked Hull',
    legend: 'dunes', music: 'overworld',
    // THE SALVAGE DIVE (S155 side content). The deep pool in rows 5-6 is where
    // Dov's cargo went down; it is deep at every tide, so only the Cleats'
    // floor mode walks it. The casks appear once Dov has asked for them
    // (`needFlag`), and all of them come up in one breath or none (Game.salvage).
    map: [
      'TToggggoTT',
      'Tgg....ggT',
      'gg.qq.q.gg',
      'gg......gg',
      'gg144441gg',
      '11======11',
      '*1======1*',
      '**********',
    ],
    entities: [
      // Coastwise Chain, link 5. He has been waiting on his boat since before
      // the chain existed, and he is still waiting on it afterwards.
      ['trader', 2, 2, {
        sprite: 'npc_villager', waiting: 'wreckSurvivor', after: 'dovAfter',
        deals: [{ stage: 5, wants: 'eel', gives: 'lead', text: 'dovTrade' }],
        // His own errand, asked whenever the chain is not at his link (S155).
        errand: { need: 'salvageDone', prize: 'heartPiece', flag: 'diveDone', ask: 'diveAsk',
          asked: 'diveAsked', thanks: 'diveThanks' },
      }],
      ['crab', 6, 4],
      ['pickup', 2, 5, { kind: 'salvage', needFlag: 'diveAsked', hideFlag: 'salvageDone' }],
      ['pickup', 4, 6, { kind: 'salvage', needFlag: 'diveAsked', hideFlag: 'salvageDone' }],
      ['pickup', 5, 5, { kind: 'salvage', needFlag: 'diveAsked', hideFlag: 'salvageDone' }],
      ['pickup', 7, 6, { kind: 'salvage', needFlag: 'diveAsked', hideFlag: 'salvageDone' }],
      ['pickup', 7, 5, { kind: 'salvage', needFlag: 'diveAsked', hideFlag: 'salvageDone' }],
    ],
  },
  '0,12,9': {
    name: 'Deep Bar',
    legend: 'dunes', music: 'overworld',
    // THE FIRST ANCHOR GATE OUT OF DOORS. Every one before it stood in D1 or
    // D2, and it could not stand anywhere else: from D3 the player swims and
    // base HIGH already goes wherever an anchor could, which is the thing
    // `tools/check-anchor.mjs` asserts over the tile table rather than
    // remembers. Out of doors on foot the picture is D1's again, so this is
    // D1's Iron Pipe carried outside — a run that is only dry at LOW beside a
    // run that is only open above it, and the sea cannot be in two places.
    //
    // The bar out to the old spit: three tiles of seafloor, bare at LOW and
    // under deep water above it, then three sinkholes, a drop at LOW and
    // wading depth once the sea is in. Walk it at LOW and the holes stop you;
    // wait for the sea and the seafloor is gone from under you. Pin the
    // seafloor with the iron, then sound the conch, and for one crossing the
    // bar is dry where it was dry and filled where it was empty.
    //
    // The spit's own link to the shore (`8,5`) is open sea now. It was a dead
    // end before and it is the far side of the gate after, and the gate is
    // not a gate while you can walk round the back of it.
    map: [
      'TToggggoTT',
      'Tgg.....gT',
      'gg..oo...g',
      'g.1111.1.g',
      'g.444441.g',
      '11*******1',
      '*1444$$$1*',
      '**********',
    ],
    anchorGate: { from: [1, 6], to: [8, 6] },
    entities: [
      ['urchin', 4, 3], ['octorokSea', 6, 4],
    ],
    script: {
      onEnter(game) {
        if (game.progress.secrets.deepBarBlank) return;
        game.spawnPickup(128, 96, 'blank', { grabDelay: 14, saveKey: 'deepBarBlank' });
      },
    },
  },
  '0,15,9': {
    name: 'Sunken Cove',
    legend: 'dunes', music: 'overworld',
    map: [
      'TToggggoTT',
      'Tg......gT',
      'g..*44*..g',
      '.1**44*1**',
      '1***44*1**',
      '1****4*$**',
      '*1*****$**',
      '**********',
    ],
    // Where each buoy can be rung ALONE, at exactly which seas, and where
    // the whole bay rings at once (see the entities below).
    buoyRoom: {
      alone: {
        1: { seas: [0, 1], from: [0, 4] }, 2: { seas: [0, 1], from: [2, 1] },
        3: { seas: [0], from: [5, 5] }, 4: { seas: [0, 1], from: [7, 1] },
        5: { seas: [1], from: [7, 5] },
      },
      all: { sea: 2, from: [5, 1] },
    },
    entities: [
      // THE BELL-BUOY ECHO (S201): five buoys, note 1 lowest, and the sailor
      // who plays tunes on them. Where each can be rung ALONE (the Rod rings
      // every bell in earshot): 1, 2 and 4 from the beach at LOW or MID; 3
      // only from the sandbar spit's tip at LOW; 5 only from the sinkhole
      // channel, waded at MID. At HIGH the note reaches the whole bay.
      // tools/check-buoys.mjs proves each claim (`buoyRoom`) in the engine.
      ['buoy', 1, 4, { note: 1 }], ['buoy', 3, 2, { note: 2 }], ['buoy', 3, 6, { note: 3 }],
      ['buoy', 6, 2, { note: 4 }], ['buoy', 8, 6, { note: 5 }],
      ['buoyKeeper', 8, 2, {
        sprite: 'npc_fisher', tunes: [[2, 4, 2], [1, 4, 3, 2], [3, 1, 5, 4, [1, 2, 3, 4, 5]]],
        prize: 'seedBag', again: 'rupee20', flag: 'buoysWon',
        ask: 'buoyAsk', noRod: 'buoyNoRod', turn: 'buoyTurn', sour: 'buoySour',
        next: ['buoyNext1', 'buoyNext2'], win: 'buoyWin', winAgain: 'buoyWinAgain',
      }],
    ],
  },
  '0,16,9': {
    name: 'Worlds Edge',
    legend: 'dunes', music: 'overworld',
    // The second outdoor Reefseed grove — item-reuse (docs/prompts/STATE.md),
    // same fixture South Shallows (`0,7,9`) proved: bank/bar/stake/snarl in a
    // line, carved out of what was open sea south of the room's own dry
    // sandbar band. Same region (`dunes`), so `drownWallSand`'s repointed
    // `cliffSandTop` edge already reads right here — no new palette work
    // needed, see South Shallows' own comment for the two-part reason a bare
    // `drownWall` did.
    map: [
      'TToggg1***',
      'TgggggT*1*',
      'g..O.O.11*',
      '*g......1*',
      '*g1119111*',
      '****===*1*',
      '*****k**1*',
      '**********',
    ],
    reefseedRoom: {
      entry: [4, 1],
      stakes: [
        { at: [5, 5], from: [5, 3], face: 'down', sea: 2 },
      ],
      snarl: [5, 6], cutFrom: [5, 5],
    },
    entities: [
      ['sign', 4, 3, { text: 'Nothing past here but open sea.' }],
    ],
    // THE LIGHTHOUSE REFLECTOR (S200) is caught in the snarl at 5,6, which
    // only a blade standing on the grove's stake reaches: cut it and the
    // reflector is lying in the water where it was.
    script: {
      onEnter(game) {
        if (game.progress.flags.foundMirror) return;
        if (!game.progress.doors['overworld:0,16,9:5,6']) return;
        game.spawnPickup(80, 96, 'e_mirror', { grabDelay: 14 });
      },
      onEvent(game, name, data) {
        if (name !== 'tile' || !data || data.tx !== 5 || data.ty !== 6) return;
        if (game.progress.flags.foundMirror) return;
        game.spawnPickup(80, 96, 'e_mirror', { grabDelay: 14 });
      },
    },
  },

  // ---- S157/S158: the widened columns -----------------------------------
  // Written as placeholders by tools/oneshot/widen-overworld.mjs (S157), each
  // one its west neighbour's east edge repeated; re-authored by hand in S158 as
  // quiet extensions of their regions. Each screen's west edge is its west
  // neighbour's east edge and its east edge the east neighbour's west edge,
  // tile for tile, so every crossing the old seam had is still there at the
  // same rows and the same tides; and the tops and bottoms are closed, so no
  // new north-south way in exists anywhere a gate (the Pans vane, the Reef
  // Palace approach) could be walked round.
  '0,6,0': {
    name: "Brine Flats",
    legend: 'salt', music: 'salt',
    map: [
      '**********',
      '*11111111*',
      '1g..11..g1',
      'gg.2222.gg',
      'gG.2222.Gg',
      'gggggg..gg',
      '#ggg##..##',
      '######..##',
    ],
    entities: [
      ['leever', 5, 5, { phase: 0 }],
    ],
  },
  '0,6,1': {
    name: "Pan Hollow",
    legend: 'salt', music: 'salt',
    map: [
      '######..##',
      '##gg##..g#',
      'gg..gg...g',
      'gg.2222.g#',
      'gG.2222.gg',
      'gggggggggg',
      '#ggg##ggg#',
      '####gg####',
    ],
    entities: [
      ['beetle', 5, 2],
    ],
  },
  '0,6,2': {
    name: "Bleached Reach",
    legend: 'salt', music: 'salt',
    map: [
      '####gg####',
      '#gggg2222#',
      '1111..1111',
      '11.1111.11',
      'gg.o..G.gg',
      'gggggggggg',
      '#gggggggg#',
      '##########',
    ],
    entities: [
      ['crab', 5, 5],
    ],
  },
  '0,6,3': {
    name: "Hollow Oaks",
    legend: 'wood', music: 'wood',
    map: [
      'TTTT####TT',
      'TTTT#Z##TT',
      'gg.b...gTT',
      'gg.....fTT',
      'gg..TT..gg',
      'gf..TT.ggg',
      'TTg..gTTTT',
      'TTg..gTTTT',
    ],
    warps: [
      { x: 5, y: 1, to: { map: 'cave7', floor: 0, rx: 0, ry: 0, px: 72, py: 96 } },
    ],
    entities: [
      ['wisp', 7, 3], ['keese', 2, 5],
    ],
  },
  '0,6,4': {
    name: "Fern Hollow",
    legend: 'wood', music: 'wood',
    map: [
      'TTg..gTTTT',
      'TTgf..TTTT',
      'gg......gg',
      'ggG..f..gg',
      'ggTTTT..gg',
      'gfTTTT.ggg',
      'TTTTg..gTT',
      'TTTTg..gTT',
    ],
    entities: [
      ['wisp', 4, 2],
    ],
  },
  '0,6,5': {
    name: "Sallow Glade",
    legend: 'wood', music: 'wood',
    map: [
      'TTTTg..gTT',
      'TTTTg..fTT',
      'gg......gg',
      'gg.000..gg',
      'ggTT..f.gg',
      'g.TT....gg',
      'TTTT..TTTT',
      'TTTTg.TTTT',
    ],
    entities: [
      ['zol', 5, 2],
    ],
  },
  '0,6,6': {
    name: "Low Copse",
    legend: 'wood', music: 'wood',
    map: [
      'TTTTg.TTTT',
      'TTTT..TTTT',
      'gg.f....gg',
      'gg.0000.gg',
      'gg.0000.TT',
      'gfg0000.TT',
      'TTTTTTTTTT',
      'TTTTTTTTTT',
    ],
    entities: [
      ['keese', 4, 1],
    ],
  },
  '0,6,7': {
    name: "Tidewatch Square",
    // The square: dirt, the fountain, four stools, as Horon's is.
    legend: 'horon', music: 'tidewatch',
    map: [
      'TTTTTTTTTT',
      'TTTTTTTTTT',
      'f........f',
      'y.s.FF.s.y',
      'y...FF...y',
      '..........',
      'g.s....s.g',
      'g........g',
    ],
    entities: [
      ['scrimshander', 3, 6, {}],
      ['npc', 6, 6, { ...FOLK.brine, wander: true, dialogue: 'villager1', after: 'elder1', needEssences: 4,
        // The Peat Key, once the second Essence is in (S154).
        beat: { scene: 'peatKey', need: 2, flag: 'keyD3' } }],
    ],
  },
  '0,6,8': {
    name: "The Gardens",
    // Flower beds and a row of bushes in a yard.
    legend: 'horon', music: 'tidewatch',
    map: [
      'gyffyyffyg',
      'gyyyyyyyyg',
      'gfffllfffg',
      'gfffyyfffg',
      'gbbybbybbg',
      '..........',
      'TTTTTTTTTT',
      'TTTTTTTTTT',
    ],
    entities: [
    ],
  },
  '0,6,9': {
    name: "Gull Sands",
    // THE SHIPWRIGHT'S HOLLOW (S158): the first blade, as Seasons' Hero's
    // Cave holds its first. A mouth in a low bluff above the beach.
    legend: 'coast', music: 'overworld',
    map: [
      'TT######TT',
      'TT##C#ggTT',
      'gg......gg',
      'gg.,,.o.gg',
      'gg..111..g',
      '1111111111',
      '*111****11',
      '**********',
    ],
    entities: [
      ['sign', 6, 2, { text: 'Scratched on a plank: "Gone till the sea calms down. Blade\'s inside. Push the door!"' }],
    ],
    warps: [
      { x: 4, y: 1, to: { map: 'caveShipwright', floor: 0, rx: 0, ry: 0, px: 72, py: 96 } },
    ],
  },
  '0,7,0': {
    name: "Shoal Rows",
    legend: 'salt', music: 'salt',
    map: [
      '**********',
      '*111**111*',
      '11.g11g.11',
      'gg..o...gg',
      'gg.3333.gg',
      'ggg...oggg',
      '#gggggggg#',
      '##########',
    ],
    entities: [
      ['zol', 2, 4], ['beetle', 7, 3],
    ],
  },
  '0,7,1': {
    name: "Salt Works",
    legend: 'salt', music: 'salt',
    // THE LENS OUT OF DOORS (S166), the use docs/ITEMS.md always gave it: which
    // pan wall the high sea covers cannot be seen from the shore. Two drops
    // off the walkway, one into each pocket, and between the pockets a walled
    // nook with the prize. The sea is pinned at MID here, the conch refused;
    // each pocket's valve raises it one step. The east pocket's wall is a low
    // one (`9`) and goes under at HIGH; the west's is the terrace itself.
    // From the walkway both are the same marble — the Lens shows which turns
    // to water. Either pocket drops out to the side, so a wrong guess is a
    // walk round, never a trap; and the nook is a prize, never a way on, so
    // the Lens is still no gate (tools/check-lens.mjs proves both).
    map: [
      '##########',
      '#gggggggg#',
      'gggggggggg',
      '##_####_##',
      'g<g#gg9g>g',
      'g#g#gg#g#g',
      '##########',
      '##########',
    ],
    tideForce: 1,
    lensRoom: {
      pin: 1, reveals: 2, decide: [4, 2], prize: true,
      branches: [
        { name: 'the west pocket', land: [2, 4], probe: [3, 4], onward: [4, 4], escape: [0, 4] },
        { name: 'the east pocket', land: [7, 4], probe: [6, 4], onward: [5, 4], escape: [9, 4] },
      ],
    },
    entities: [
      ['valve', 2, 5],
      ['valve', 7, 5],
      ['pickup', 4, 5, { kind: 'rupee100' }],
      ['sign', 8, 1, { text: 'The pans are walled in with salt. HIGH tide washes over some of the walls, but not all of them.' }],
    ],
    script: {
      onEvent(game, name) {
        if (name === 'valve') game.forceTideStep();
      },
    },
  },
  '0,7,2': {
    name: "Sandbar Pans",
    legend: 'salt', music: 'salt',
    map: [
      '##########',
      '#gg2222gg#',
      '11.2222.11',
      '11......11',
      'gg.3333.gg',
      'gggggggggg',
      '#gggggggg#',
      '##########',
    ],
    entities: [
      ['leever', 4, 3, {phase: 0}],
    ],
  },
  '0,7,3': {
    name: "Moss Stair",
    legend: 'wood', music: 'wood',
    map: [
      'TTTTTTTTTT',
      'TTTTTTTTTT',
      'TT.G..TTTT',
      'TT....TTTT',
      'ggTT....gg',
      'ggTT..f.gg',
      'TTg....gTT',
      'TTg....gTT',
    ],
    entities: [
      ['moblin', 4, 3],
    ],
  },
  '0,7,4': {
    name: "Drowned Ring",
    legend: 'wood', music: 'wood',
    map: [
      'TTg....gTT',
      'TTg.f..gTT',
      'gg.~==~.gg',
      'g.~====~.g',
      'g~======~g',
      'g~======~g',
      'TT======TT',
      'TT======TT',
    ],
    entities: [
      ['anglerfry', 5, 4], ['keese', 4, 1],
    ],
  },
  '0,7,5': {
    name: "Stump Pool",
    legend: 'wood', music: 'wood',
    map: [
      'TT======TT',
      'TT======TT',
      'g~==##==~g',
      'g.~=#&=~.g',
      'gg.~11~.gg',
      'gg..11..gg',
      'TTg....gTT',
      'TT.gg..gTT',
    ],
    warps: [
      { x: 5, y: 3, to: { map: 'cave8', floor: 0, rx: 0, ry: 0, px: 72, py: 96 } },
    ],
    entities: [
      ['anglerfry', 3, 0],
    ],
  },
  '0,7,6': {
    name: "Kelp Meadow",
    legend: 'wood', music: 'wood',
    map: [
      'TT.gg..gTT',
      'TT...G.gTT',
      'g.......gg',
      'gg.00000gg',
      'TT.....Ggg',
      'TT.f....gg',
      'TTTTTTTTTT',
      'TTTTTTTTTT',
    ],
    entities: [
      ['moblin', 5, 4],
    ],
  },
  '0,7,7': {
    name: "Palisade Row",
    // A house nobody opens, inside a log palisade.
    legend: 'horon', music: 'tidewatch',
    map: [
      'TTTTTTTTTT',
      'TTTTTTTTTT',
      'gylkkklyTT',
      'gylkkklyTT',
      'gylkkklygg',
      '..........',
      'ggTTvg.ggg',
      'ggTTvg.ggg',
    ],
    entities: [
      // Wenna. Until the player holds a blade, she says where one is (S158).
      ['npc', 1, 6, { sprite: 'npc_villager2', wander: true, dialogue: 'villager2', after: 'villager2After', needEssences: 3,
        beat: { scene: 'bladeHint', flag: 'heardBlade', unlessItem: 'sword' } }],
    ],
  },
  '0,7,8': {
    name: "Wellside",
    // The well, in its yard, and a stand of tall grass.
    legend: 'horon', music: 'tidewatch',
    map: [
      'ggTTgg.ggg',
      'ggTTgg.ggg',
      'gywwyg.vvv',
      'gywwyg.vvv',
      'gyyyyg.vvv',
      '..........',
      'TTTTTTTTTT',
      'TTTTTTTTTT',
    ],
    entities: [
      ['npc', 5, 4, { ...FOLK.salter, dialogue: 'shoreSalter', after: 'shoreSalterAfter', needEssences: 3,
        // The Cistern Key, once the third Essence is in (S154).
        beat: { scene: 'cisternKey', need: 3, flag: 'keyD4' } }],
    ],
  },
  '0,7,9': {
    name: "Shell Bank",
    // THE SOUTH SHORE'S SECRET (S192): a sea rock off the bank with a cave
    // mouth that is only above water at LOW, walked to over the seafloor.
    legend: 'coast', music: 'overworld',
    map: [
      'TTTTTTTTTT',
      'TTTTTTTTTT',
      'gg.f..gggg',
      'g..,...ggg',
      'g..,,.###g',
      '1111.1#&#1',
      '114444444*',
      '**********',
    ],
    entities: [
      ['crab', 3, 3],
    ],
    warps: [
      { x: 7, y: 5, to: { map: 'cave14', floor: 0, rx: 0, ry: 0, px: 72, py: 96 } },
    ],
  },
  '0,8,0': {
    name: "Crust Shelf",
    legend: 'salt', music: 'salt',
    map: [
      '**********',
      '*1111111**',
      '1g.2222.g1',
      'gg.2222.gg',
      'ggG....Ggg',
      'ggg.oo.ggg',
      '#g..gggg##',
      '##..######',
    ],
    entities: [
      ['crab', 2, 5],
    ],
  },
  '0,8,1': {
    name: "Brine Steps",
    legend: 'salt', music: 'salt',
    map: [
      '##..######',
      '##..##Z###',
      'gg....g.gg',
      '#g.1111.gg',
      'gg.1221.gg',
      'gg.1111.gg',
      '#gggg..g##',
      '#####..###',
    ],
    warps: [
      { x: 6, y: 1, to: { map: 'cave9', floor: 0, rx: 0, ry: 0, px: 72, py: 96 } },
    ],
    entities: [
      ['zol', 2, 5], ['leever', 7, 3, { phase: 0 }],
    ],
  },
  '0,8,2': {
    name: "Pan's End",
    legend: 'salt', music: 'salt',
    map: [
      '#####..###',
      '#ggg....g#',
      '1111gg1111',
      '11.1111.11',
      'ggGo..oGgg',
      'gggggggggg',
      '#gggggggg#',
      '##########',
    ],
    entities: [
      ['zol', 5, 5],
    ],
  },
  '0,8,3': {
    name: "Mire Gap",
    legend: 'wood', music: 'wood',
    map: [
      'TTTTTTTTTT',
      'TTTTTTTTTT',
      'TT......gg',
      'TTf.11..gg',
      'ggTTTT..gg',
      'ggTTTT.fgg',
      'TTg..f.gTT',
      'TTg....gTT',
    ],
    entities: [
      ['zol', 6, 2],
    ],
  },
  '0,8,4': {
    name: "Rootwater",
    legend: 'wood', music: 'wood',
    map: [
      'TTg....gTT',
      'TT.f...gTT',
      'ggTTTT..gg',
      'ggTTTT.Ggg',
      'gg..TT..gg',
      'g...TTf.gg',
      'TTg...g.TT',
      'TTgg...gTT',
    ],
    entities: [
      ['moblin', 6, 1],
    ],
  },
  '0,8,5': {
    name: "Wisp Reach",
    legend: 'wood', music: 'wood',
    map: [
      'TTgg...gTT',
      'TT.f...gTT',
      'gg......gg',
      'g.f..G..gg',
      'ggTTTT..gg',
      'ggTTTT.fgg',
      'TTg..g.gTT',
      'TT.g...gTT',
    ],
    entities: [
      ['wisp', 3, 2],
    ],
  },
  '0,8,6': {
    name: "Wood Hem",
    legend: 'wood', music: 'wood',
    map: [
      'TT.g...gTT',
      'TTg..f.gTT',
      'gg......gg',
      'gg.1111.gg',
      'ggTT....gg',
      'ggTT.f..gg',
      'TTTTTTTTTT',
      'TTTTTTTTTT',
    ],
    entities: [
      ['wisp', 6, 2],
    ],
  },
  '0,8,7': {
    name: "Tide Gate",
    // The east gate. The tide pool in the yard, and the sandbar creek
    // Sunken Reef has at its west edge (rows 3-4) carried to the seam.
    legend: 'horon', music: 'tidewatch',
    map: [
      'TTTTTTTTTT',
      'TTTTTTTTTT',
      'Ty2222yggg',
      'Ty2222y111',
      'giyyyey111',
      '..........',
      'ggffygggTT',
      'ggyyygggTT',
    ],
    entities: [
      ['trader', 2, 4, {
        sprite: 'npc_fisher2', waiting: 'coastFisher', after: 'mirrenAfter',
        deals: [{ stage: 4, wants: 'brick', gives: 'eel', text: 'mirrenTrade' }],
      }],
    ],
  },
  '0,8,8': {
    name: "East Lawn",
    // The south-east lawn, a grove, and the gate to East Strand.
    legend: 'horon', music: 'tidewatch',
    map: [
      'ggggvvvgTT',
      'ggggvvvgTT',
      'gyTTTTnngg',
      'gyTTTTnngg',
      'gygggggggg',
      '..........',
      'TTTTTTTTTT',
      'TTTTTTTTTT',
    ],
    entities: [
    ],
  },
  '0,8,9': {
    name: "Tern Point",
    // FARORE'S SHRINE (S158): the Oracle of Secrets lives out on the point,
    // where the villagers say she does, and hands the Moon Conch over in
    // person. A house of the town kit, on the coast's own grass.
    legend: 'town', music: 'overworld',
    map: [
      'TTTTTTTTTT',
      'TTTTTTTTTT',
      'gg.hhh.fgg',
      'gg.hhh..gg',
      'gg.hhh..gg',
      '11..,...11',
      '*11*******',
      '**********',
    ],
    entities: [
      ['sign', 7, 4, { text: "FARORE'S SHRINE\nKnock, and mind the step." }],
    ],
    warps: [
      { x: 4, y: 4, to: { map: 'faroreShrine', floor: 0, rx: 0, ry: 0, px: 72, py: 96 } },
    ],
  },
  '0,13,0': {
    name: "Reef Shelf",
    legend: 'reef', music: 'reef',
    map: [
      '**********',
      '**111****1',
      '1g..1166.6',
      'gg.6666666',
      'gg..6666..',
      'ggo......g',
      '##g..g####',
      '###..#####',
    ],
    entities: [
      ['siren', 5, 3],
    ],
  },
  '0,13,1': {
    name: "Kelp Steps",
    legend: 'reef', music: 'reef',
    map: [
      '###..#####',
      '#g...g7777',
      'gg..q.7777',
      'gg...777..',
      'ggTT.777.g',
      'ggTT.....g',
      '#gg.g..#.#',
      '####..####',
    ],
    entities: [
      ['octorokSea', 7, 2],
    ],
  },
  '0,13,2': {
    name: "Market Channel",
    legend: 'reef', music: 'reef',
    map: [
      '####..####',
      '#g....ggg#',
      '5555885555',
      '555...b555',
      '5555...555',
      '5555588555',
      '#gggg..gg#',
      '#####..###',
    ],
    entities: [
      ['octorokSea', 1, 3],
    ],
  },
  '0,13,3': {
    name: "Palm Bank",
    legend: 'reef', music: 'reef',
    map: [
      '#####..###',
      '#gg....gg#',
      'g.TT..TT.g',
      'g.TT..TT.g',
      'gg.....ggg',
      'ggg....ggg',
      '####Z#####',
      '##########',
    ],
    entities: [
      ['barnacle', 5, 4],
    ],
    warps: [
      { x: 4, y: 6, to: { map: 'cave10', floor: 0, rx: 0, ry: 0, px: 72, py: 96 } },
    ],
  },
  '0,13,4': {
    name: "Anemone Drift",
    legend: 'coral', music: 'reef',
    map: [
      '##########',
      '#gg.666..#',
      'g.TT666..g',
      'g.TT....gg',
      'gg...77.gg',
      'gg...77..g',
      '#gg.....g#',
      '###..#####',
    ],
    entities: [
      ['urchin', 5, 3],
    ],
  },
  '0,13,5': {
    name: "Coral Sill",
    legend: 'coral', music: 'reef',
    map: [
      '###..#####',
      '#g.....gg#',
      'gg.6666..g',
      'g.......gg',
      'g.TT.77.gg',
      'g.TT.77..g',
      '#gg......#',
      '##########',
    ],
    entities: [
      ['urchin', 6, 3],
    ],
  },
  '0,13,6': {
    name: "Palm Flats",
    legend: 'dunes', music: 'dunes',
    map: [
      'TTTTTTTTTT',
      '....TT....',
      '..TT..TT..',
      '..TT......',
      '....TT....',
      'g......g..',
      'ggTT..ggg.',
      'gg..gggg..',
    ],
    entities: [
      ['crab', 3, 4],
    ],
  },
  '0,13,7': {
    name: "Leever Bowl",
    legend: 'dunes', music: 'dunes',
    map: [
      'g...gggg..',
      '...gggg...',
      '..TT......',
      '..TT...555',
      '5555555555',
      '555555....',
      'TT.oTT..TT',
      'TTOOTTOOTT',
    ],
    entities: [
      ['leever', 4, 3, { phase: 0 }],
    ],
  },
  '0,13,8': {
    name: 'Sandpiper Row',
    // The Row's other house, shut, between two drying racks — and (S158) a
    // lane south through the palms, down to the Sandbar Shallows beach.
    legend: 'townDunes', music: 'sandpiper',
    map: [
      'TTTTTTTTTT',
      'TTTTTTTTTT',
      'gnGkkkGngg',
      'gnGkkkGngg',
      'GGGkkkGGGG',
      '..........',
      'TTTTggTTTT',
      'TTTTggTTTT',
    ],
    entities: [
    ],
  },
  '0,13,9': {
    name: "Sandbar Shallows",
    legend: 'dunes', music: 'overworld',
    map: [
      'TTTTggTTTT',
      'TTTTggTTTT',
      'g...gg..Og',
      'gg......gg',
      '.1111..11.',
      '11**11**11',
      '*1****1***',
      '**********',
    ],
    entities: [
      ['crab', 2, 3],
      ['octorokSea', 6, 6],
    ],
  },
  '0,14,0': {
    name: "Barnacle Rise",
    legend: 'reef', music: 'reef',
    map: [
      '**********',
      '1***1111**',
      '6.111.TTg1',
      '6666..TTgg',
      '.666....gg',
      'g..88...gg',
      '####g..g##',
      '#####..###',
    ],
    entities: [
      ['crab', 5, 4],
    ],
  },
  '0,14,1': {
    name: "Pearl Bed",
    legend: 'reef', music: 'reef',
    map: [
      '#####..###',
      '7777g...g#',
      '7777..o.gg',
      '..7.....gg',
      'g.7.6666gg',
      'g...6666gg',
      '#..g##ggg#',
      '###..#####',
    ],
    entities: [
      ['barnacle', 5, 4],
    ],
  },
  '0,14,2': {
    name: "Sunk Pier",
    legend: 'reef', music: 'reef',
    map: [
      '###..#####',
      '#gg..g.gg#',
      '5558855555',
      '55.....555',
      '55.q.b.555',
      '5555588555',
      '#ggg...gg#',
      '####..####',
    ],
    entities: [
      ['siren', 8, 4],
    ],
  },
  '0,14,3': {
    name: "Barnacle Reach",
    legend: 'reef', music: 'reef',
    map: [
      '####..####',
      '#g...gggg#',
      'gg.6666.gg',
      'gg.6666.gg',
      'gg..TT..gg',
      'gg..TT.ggg',
      '#g.....gg#',
      '##########',
    ],
    entities: [
      ['siren', 4, 2],
    ],
  },
  '0,14,4': {
    name: "Pink Shallows",
    legend: 'coral', music: 'reef',
    map: [
      '##########',
      '####Z#####',
      'gg..g..6gg',
      'g.7777.66g',
      'g.7777..gg',
      'gg....b.gg',
      '#g.....gg#',
      '###..#####',
    ],
    entities: [
      ['jellyfish', 3, 3],
    ],
    warps: [
      { x: 4, y: 1, to: { map: 'cave11', floor: 0, rx: 0, ry: 0, px: 72, py: 96 } },
    ],
  },
  '0,14,5': {
    name: "Spire Lee",
    legend: 'coral', music: 'reef',
    map: [
      '###..#####',
      '#g.....gg#',
      'gg.b..TTgg',
      'g.....TT.g',
      'g.7777...g',
      'gg7777.ggg',
      '#gg.....g#',
      '##########',
    ],
    entities: [
      ['octorokSea', 4, 4],
    ],
  },
  '0,14,6': {
    name: "Dune Crest",
    legend: 'dunes', music: 'dunes',
    map: [
      'TTTTTTTTTT',
      '....TT..TT',
      '........O.',
      '..........',
      '..TT...O..',
      '...g.O.L..',
      '..ggg.....',
      '..gggg....',
    ],
    entities: [
      ['leever', 3, 5, { phase: 0 }],
    ],
    warps: [
      { x: 7, y: 5, to: { map: 'cave12', floor: 0, rx: 0, ry: 0, px: 72, py: 96 } },
    ],
  },
  '0,14,7': {
    name: "Channel Dunes",
    legend: 'dunes', music: 'dunes',
    map: [
      '..gggg....',
      '.gg.......',
      'gg......TT',
      '555.....TT',
      '5555555...',
      '..55555555',
      'TT.gTT..TT',
      'TTOOTT..TT',
    ],
    entities: [
      ['crab', 4, 4],
    ],
  },
  '0,14,8': {
    name: 'Sandpiper Row',
    // The net racks, and the way east to Shell Flats — and (S158) a lane
    // north through the palms into Channel Dunes, so the Row is a place with
    // several ways out, as Horon is, rather than one street in a hedge.
    legend: 'townDunes', music: 'sandpiper',
    map: [
      'TTTTTTggTT',
      'TTTTTTggTT',
      'gnGnGnGggg',
      'gnGnGnGggg',
      'GGGGGGGzgg',
      '..........',
      'TTTTTTTTTT',
      'TTTTTTTTTT',
    ],
    entities: [
      ['trader', 7, 3, {
        sprite: 'npc_hood_blue', waiting: 'sandpiperKid', after: 'sennitAfter',
        deals: [{ stage: 6, wants: 'lead', gives: 'whelk', text: 'sennitTrade' }],
      }],
    ],
  },
  '0,14,9': {
    name: "Pale Strand",
    legend: 'dunes', music: 'overworld',
    map: [
      'TTTTTTTTTT',
      'TTTTTTTTTT',
      'g..bA..g.g',
      'g..b..b..g',
      'gg.1111..1',
      '11*1111*11',
      '*1***11***',
      '**********',
    ],
    entities: [
      ['crab', 6, 4],
    ],
    warps: [
      { x: 4, y: 2, to: { map: 'cave13', floor: 0, rx: 0, ry: 0, px: 72, py: 96 } },
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
          // His errand (S155): the ledger, lost on the South Sands, for a
          // Piece of Heart. He talks shop again once it is home.
          ['npc', 2, 2, { sprite: 'npc_shopkeeper', dialogue: 'shopkeeper', after: 'shopkeeper2', needEssences: 3,
            errand: { need: 'foundLedger', prize: 'heartPiece', flag: 'ledgerDone', ask: 'ledgerAsk', thanks: 'ledgerThanks' } }],
          ['shopItem', 4, 3, { item: 'shield', level: 1, price: 30, once: true, saveKey: 'shopShield' }],
          ['shopItem', 6, 3, { pickup: 'bomb4', price: 20, name: 'Bombs' }],
          ['shopItem', 8, 3, { pickup: 'heart', price: 10, name: 'Heart' }],
          ['shopItem', 4, 5, { pickup: 'bottle', price: 40, name: 'Bottled Tide' }],
          ['shopItem', 2, 5, { charm: 'ballastHeart', price: 80, once: true, saveKey: 'shopCharm' }],
        ],
        // Out of the shop's door and back onto the yard in front of it. The
        // shop moved east when the village became two screens — its door is
        // the middle cell of its front row on `0,5,7`, at 4,4 — so this lands
        // one tile below it, on 0,5,7 rather than on the square.
        warps: [{ x: 5, y: 6, to: { map: 'overworld', floor: 0, rx: 5, ry: 7, px: 32, py: 88, dir: 'down' } }],
      },
    },
  });

  registerMap({
    id: 'houseMaku',
    kind: 'interior',
    name: 'The Maku Tree',
    w: 1, h: 1, floors: 1,
    // THE SEASONS GROVE, WHOLE. The room is one extracted screen of the
    // original Maku Tree's clearing (tools/rip-maku.py), placed as a single
    // block; the cave tint that suited a stone room is gone with the room.
    legend: 'makuGrove', music: 'maku', scroll: false,
    rooms: {
      '0,0,0': {
        map: [
          'MMMMMMMMMM',
          'MMMMMMMMMM',
          'MMMMMMMMMM',
          'MMMMMMMMMM',
          'MMMMMMMMMM',
          'MMMMMMMMMM',
          'MMMMMMMMMM',
          'MMMMMMMMMM',
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
          // She stands at the foot of her own trunk, where Link can face her
          // from the clearing, and draws her face up on the bark.
          ['makuTree', 4, 3, {
            sprite: null, face: 'maku_face', faceAt: [48, 0],
            waiting: 'makuWait', after: 'makuAfter',
            deals: [{
              stage: 12, wants: 'bellrope', item: 'rod', level: 1,
              text: 'makuTree', flag: 'gotRod',
              needEssences: 1, blocked: 'makuBlocked',
            }],
            scene: 'makuMaster', sceneNeed: 5, sceneFlag: 'makuOpenedKeep',
            sceneAfter: 'makuOpened',
            // The first meeting: the Barnacle Key, before anything else she has.
            // Asleep until a wader with a blade speaks to her (S158).
            beat: { scene: 'makuKey', need: 0, flag: 'keyD1', needItem: 'sword' },
          }],
        ],
        // The hollow is at 4,1 in the tree line at the top of the square. It is drawn
        // with `treeHollow`, not the cave arch — see the town legend.
        // The way out is the open bottom edge of the clearing, as in Seasons.
        warps: [
          { x: 4, y: 7, to: { map: 'overworld', floor: 0, rx: 4, ry: 7, px: 64, py: 40, dir: 'down' } },
          { x: 5, y: 7, to: { map: 'overworld', floor: 0, rx: 4, ry: 7, px: 64, py: 40, dir: 'down' } },
        ],
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

  // Farore's shrine on Tern Point (S158). She gives the Moon Conch the first
  // time she is spoken to, and lives here for the rest of the game.
  //
  // HER ROOM IS SEASONS' OWN (S168, the human: "give her a desk"). Oracle of
  // Seasons sits Farore behind a desk, drawn from the waist up, her book on
  // it, braziers either side, a rug behind her and two pillars a side, in
  // blue flagstone (group 4 room $e8; tileset $4b; legend `faroreRoom`).
  // That room is 15x11 with a corridor down its east side; this is its
  // shrine half, the same pieces in the same order, closed to one screen
  // with the cartridge's own south door. You speak to her across the desk.
  registerMap({
    id: 'faroreShrine', kind: 'interior', name: "Farore's Shrine",
    w: 1, h: 1, floors: 1,
    legend: 'faroreRoom', music: 'house', scroll: false,
    rooms: {
      '0,0,0': {
        map: [
          'ANNNNNNNNB',
          'WPrrrrrrPE',
          'WprrrrrrpE',
          'W.(====).E',
          'WP..cc..PE',
          'Wp......pE',
          'W........E',
          'CSSS[o]SSD',
        ],
        entities: [
          ['torch', 2, 2, { lit: true }], ['torch', 7, 2, { lit: true }],
          ['torch', 1, 3, { lit: true }], ['torch', 8, 3, { lit: true }],
          // Centred on the desk, as Seasons centres her on hers.
          ['npc', 4.5, 2, { sprite: 'npc_farore_0', frames: { down: ['npc_farore_0', 'npc_farore_1'] }, rate: FARORE_SWAY_HOLD, faceOnTalk: false, dialogue: 'faroreHome', after: 'faroreHomeAfter', needEssences: 5,
            beat: { scene: 'faroreConch', flag: 'gotConch' } }],
          // Her book, standing on the desk where Seasons stands it.
          ['npc', 2.5, 3, { sprite: 'npc_farore_book', faceOnTalk: false, perched: true }],
        ],
        warps: [{ x: 5, y: 7, to: { map: 'overworld', floor: 0, rx: 8, ry: 9, px: 64, py: 88, dir: 'down' } }],
      },
    },
  });

  home('houseHearth', 'A Village House', 'house', [
    // Her errand (S155): the jar of bog water left at Bog Head's spring, for
    // a hundred rupees. The only errand that pays in rupees.
    ['npc', 3, 2, { sprite: 'npc_brinewife', dialogue: 'hearthWife', after: 'hearthWifeAfter', needEssences: 3,
      errand: { need: 'foundBogWater', prize: 'rupee100', flag: 'bogwaterDone', ask: 'bogwaterAsk', thanks: 'bogwaterThanks' } }],
    // The child's errand (S155): the kite, up a tree in Bluff Hollow, for a Piece of
    // Heart found under the doorstep in the flood.
    ['npc', 7, 4, { sprite: 'npc_child', wander: true, dialogue: 'hearthChild', after: 'hearthChildAfter', needEssences: 2,
      errand: { need: 'foundKite', prize: 'heartPiece', flag: 'kiteDone', ask: 'kiteAsk', thanks: 'kiteThanks' } }],
    ['pickup', 2, 4, { kind: 'rupee5' }],
  ], { rx: 4, ry: 7, px: 32, py: 88 });

  // Ossa opens the Coastwise Chain and closes it. Both of her deals live on one
  // entity, which is what the trader's `deals` list is for: the chain's stage
  // counter picks which of them is live, so she hands over the float on the
  // first visit and takes the kettle back on the eleventh, and says the same
  // flat thing about it not being her kettle on every visit in between.
  home('houseNets', "The Net-mender's", 'house', [
    ['trader', 4, 2, {
      sprite: 'npc_zelda', waiting: 'ossaWait', after: 'ossaAfter',
      deals: [
        { stage: 1, gives: 'float', text: 'ossaStart' },
        { stage: 11, wants: 'kettle', gives: 'bellrope', text: 'ossaEnd' },
      ],
    }],
  ], { rx: 4, ry: 8, px: 48, py: 88 });

  // THE LIGHTHOUSE (S200, the dark lighthouse quest). Two floors: the
  // keeper's room at the foot of the stair, and the lamp room above it. He
  // asks for the lamp's three parts (`need` is a list, NPC.errandTalk), and
  // with all three back his errand sets `lampReady`; then the lamp takes the
  // Kilnshell's fire (`Lamp`, src/game/objects.js), and lit it sets
  // `lighthouseLit` for good.
  registerMap({
    id: 'lighthouse', kind: 'interior', name: 'The Lighthouse',
    w: 1, h: 1, floors: 2,
    legend: 'house', music: 'house', tint: 'cave', scroll: false,
    rooms: {
      '0,0,0': {
        map: [
          '##########',
          '#.......p#',
          '#.......p#',
          '#........#',
          '#........#',
          '#.......p#',
          '#/...o...#',
          '##########',
        ],
        entities: [
          ['npc', 4, 2, { sprite: 'npc_elder', dialogue: 'keeperLight', after: 'keeperAfter', afterFlag: 'lighthouseLit',
            errand: { need: ['foundLens', 'foundMirror', 'foundOil'], prize: null, flag: 'lampReady',
              ask: 'keeperAsk', partial: 'keeperPartial', thanks: 'keeperThanks' } }],
        ],
        warps: [
          { x: 5, y: 6, to: { map: 'overworld', floor: 0, rx: 0, ry: 0, px: 24, py: 80, dir: 'down' } },
          { x: 1, y: 6, to: { map: 'lighthouse', floor: 1, rx: 0, ry: 0, px: 32, py: 96, dir: 'right' } },
        ],
      },
      '1,0,0': {
        map: [
          '##########',
          '#........#',
          '#........#',
          '#........#',
          '#........#',
          '#........#',
          '#/.......#',
          '##########',
        ],
        entities: [
          ['lamp', 4.5, 3, { dialogue: 'lampLit' }],
          ['sign', 7, 5, { text: 'THE LAMP\nNeeds oil, a lens and a reflector. Then fire!' }],
        ],
        warps: [
          { x: 1, y: 6, to: { map: 'lighthouse', floor: 0, rx: 0, ry: 0, px: 32, py: 96, dir: 'right' } },
        ],
      },
    },
  });

  home('houseSandpiper', 'Sandpiper Cottage', 'house', [
    ['npc', 5, 2, { sprite: 'npc_elder', dialogue: 'sandpiper', after: 'netMender', needEssences: 2 }],
    ['pickup', 7, 4, { kind: 'rupee5' }],
  ], { rx: 12, ry: 8, px: 32, py: 88 });
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
