// Game Boy Color palettes. Each is exactly 4 colours, ordered lightest -> darkest.
// Index 3 is conventionally the outline/shadow colour. For sprites, '.' in the art
// grid is transparent, so all 4 indices carry colour.
//
// Colours are picked from a deliberately narrow, slightly desaturated range so
// everything reads as one console's palette rather than arbitrary RGB.

export const PALETTES = {
  // --- terrain -------------------------------------------------------------
  grass:   ['#c8e878', '#78b048', '#3c7038', '#14301c'],
  grassdk: ['#88b858', '#4c8040', '#2c5830', '#0c2014'],
  tree:    ['#a8d868', '#4c9040', '#20582c', '#0c2414'],
  treedk:  ['#6c9848', '#3c6830', '#1c3c22', '#08160c'],
  treedead:['#c8b088', '#907048', '#584028', '#20140c'],
  // The extracted tree needs a TRUNK, and the three ramps above have none:
  // they are all-green because the hand-drawn tree they were built for was
  // all-green. The source draws a tree in five colours — two canopy greens, two
  // trunk browns, an outline — so a faithful one needs brown at index 2, with
  // the two browns merged to fit four indices. These are the same ramps with
  // index 2 swapped for wood; `tree`/`treedk`/`treedead` stay exactly as they
  // were, because `bush`, `bushSand` and `palm` still use them.
  treeoak:  ['#a8d868', '#4c9040', '#8c5c28', '#0c2414'],
  treeoakdk:['#6c9848', '#3c6830', '#5c3c1c', '#08160c'],
  treeoakdd:['#c8b088', '#907048', '#6c4c2c', '#20140c'],
  sand:    ['#f8e8b0', '#e0c078', '#a88048', '#584028'],
  sandwet: ['#d8c898', '#b09860', '#786040', '#382c20'],
  water:   ['#b0e8f8', '#58b0e0', '#2868b8', '#10305c'],
  deep:    ['#5898d8', '#2c60b0', '#183c80', '#08142c'],
  reef:    ['#a8e8d0', '#48b098', '#207060', '#0c2c28'],
  stone:   ['#e0e0d0', '#a0a898', '#606860', '#242c28'],
  stonedk: ['#98a098', '#687068', '#404840', '#181c1a'],
  brick:   ['#d8c0a0', '#a88860', '#705038', '#301c14'],
  // Deliberately narrow ramps for the two extracted dungeon floors. The source
  // flagstone in assets/sheets/oracle-seasons-dungeon-backgrounds.png is three
  // near-identical blues, so replaying it through `brick`'s full light-to-dark
  // spread turned a subtle mottle into loud blotches across all 179 rooms.
  brickf:  ['#cbb294', '#b39c7e', '#94795c', '#301c14'],
  stonef:  ['#9aa29a', '#868e88', '#6e766e', '#181c1a'],
  marble:  ['#f8f0e0', '#d0c8b8', '#908878', '#403c34'],
  coral:   ['#f8c0d0', '#e07898', '#a04060', '#481828'],
  // The reef city's rock, one stop down the ramp. A cave mouth is a HOLE, and
  // a hole drawn in `coral` proper came out the same brightness as the cliff
  // around it — pink on pink, with nothing reading as depth.
  coraldk: ['#c08098', '#a04060', '#682840', '#200810'],
  lava:    ['#f8d870', '#e88830', '#c03818', '#500c08'],
  ice:     ['#ffffff', '#d0e8f8', '#88a8d0', '#405068'],
  bog:     ['#b8c078', '#788048', '#4c5030', '#1c2014'],
  rust:    ['#e8c088', '#c08048', '#7c4828', '#341810'],
  abyss:   ['#7080b8', '#404c80', '#242c50', '#0a0c1c'],
  gold:    ['#fff0a0', '#e8c040', '#a87818', '#503408'],

  // --- characters ----------------------------------------------------------
  // Exact Oracle-series values: skin and blond hair share one tone, the tunic is
  // a single green, and everything else is the black outline. Index 2 is unused
  // by the ripped art but kept as a darker green for anything drawn by hand.
  link:    ['#ffd68c', '#10ad42', '#0b7a2e', '#000000'],   // skin / tunic / dark tunic / outline
  linkblue:['#f8e0b8', '#68a8e0', '#284878', '#181410'],
  linkred: ['#f8e0b8', '#e87058', '#983020', '#181410'],
  linkswim:['#f8e0b8', '#68c058', '#2868b8', '#181410'],
  zelda:   ['#f8e0b8', '#f0d060', '#d05878', '#201820'],
  farore:  ['#e8f8d8', '#78d888', '#2c8058', '#10281c'],
  npc:     ['#f8e0b8', '#d88860', '#7c4838', '#201810'],
  npc2:    ['#f8e0b8', '#8898d8', '#404c88', '#181828'],
  npc3:    ['#f8e0b8', '#d0c060', '#7c6c28', '#201c10'],
  maku:    ['#e0f0a0', '#90c050', '#4c7828', '#1c2c10'],

  // --- enemies -------------------------------------------------------------
  enemyg:  ['#c8f090', '#78c048', '#307030', '#101c10'],   // green: octorok etc
  enemyr:  ['#f8b090', '#e06848', '#983020', '#280c08'],   // red
  enemyb:  ['#a8d8f8', '#5888d0', '#284880', '#0c1428'],   // blue/aquatic
  enemyp:  ['#e0b0f8', '#a860d0', '#603080', '#1c0c28'],   // purple/magic
  enemyk:  ['#d8d8c0', '#909078', '#565640', '#181810'],   // bone/skeleton
  enemyy:  ['#f8e890', '#d8b040', '#907018', '#281c08'],   // wasp/electric
  slime:   ['#b8f8d8', '#58d090', '#207850', '#082818'],
  shadow:  ['#8878a8', '#584870', '#302848', '#0a0818'],

  // A HOLE IN THE GROUND, NOT A HOLE IN THE SCREEN. `chasm` drew `dPit`'s art
  // in the `abyss` palette, whose darkest tone is #0a0c1c, and `dPit`'s art is
  // 90% that tone — so the four dune screens with a gap in them had a flat
  // black rectangle sitting on golden sand, which reads as the tilemap failing
  // rather than as somewhere to jump over. A dungeon pit on brick is right to
  // be black; a hole in a dune is a sand rim over a dark throat.
  pit:     ['#c8a878', '#8a6840', '#3c2c1c', '#000000'],

  // --- objects / effects ---------------------------------------------------
  wood:    ['#e0b878', '#b08048', '#70502c', '#2c1c10'],
  pot:     ['#e8d0a8', '#c09060', '#805838', '#2c1c14'],
  chest:   ['#f8d878', '#c08838', '#7c4c20', '#2c1808'],
  key:     ['#fff0b0', '#e0c050', '#a08018', '#403008'],
  heart:   ['#f8b8c0', '#e04858', '#982030', '#380c14'],
  rupee:   ['#b8f8c8', '#48c868', '#1c8038', '#0c2c14'],
  bomb:    ['#c0c0c0', '#707078', '#383840', '#101014'],
  fire:    ['#fff0a0', '#f8b020', '#d84808', '#601000'],
  spark:   ['#ffffff', '#d8f8ff', '#78c0e8', '#284870'],
  magic:   ['#f8e0ff', '#c090f0', '#7040b0', '#200c38'],
  essence: ['#ffffff', '#a8f0f8', '#48a0d8', '#184068'],

  // --- UI ------------------------------------------------------------------
  ui:      ['#f8f8e8', '#a8b0a0', '#505850', '#101410'],
  uidark:  ['#98a8b8', '#586878', '#303c48', '#080c10'],
  textbox: ['#f8f8f0', '#c0c8c0', '#606860', '#181c18'],
};

// Global tint applied over a whole scene (cave darkness, underwater, night).
// Each entry maps a palette's 4 colours through a mixing colour + weight.
export const TINTS = {
  none:      null,
  cave:      { color: [24, 24, 48], amount: 0.28 },
  night:     { color: [32, 40, 96], amount: 0.42 },
  underwater:{ color: [24, 80, 160], amount: 0.34 },
  dusk:      { color: [120, 64, 48], amount: 0.24 },
  flooded:   { color: [16, 56, 120], amount: 0.20 },
};

function hexToRgb(h) {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}
function rgbToHex(r, g, b) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return '#' + c(r) + c(g) + c(b);
}

export function tintPalette(pal, tint) {
  if (!tint) return pal;
  const [tr, tg, tb] = tint.color, a = tint.amount;
  return pal.map(h => {
    const [r, g, b] = hexToRgb(h);
    return rgbToHex(r + (tr - r) * a, g + (tg - g) * a, b + (tb - b) * a);
  });
}

// Used by damage flashes and the boss-death whiteout.
export function brightenPalette(pal, amount) {
  return pal.map(h => {
    const [r, g, b] = hexToRgb(h);
    return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
  });
}

export function getPalette(name) {
  return PALETTES[name] || PALETTES.stone;
}

/**
 * Add palettes at load time. Sprites extracted from the original games each
 * carry their own four colours, so the rip tools emit a palette alongside the
 * art rather than forcing everything through the hand-authored set above.
 */
export function registerPalettes(defs) {
  for (const [name, colors] of Object.entries(defs)) {
    if (Array.isArray(colors) && colors.length === 4) PALETTES[name] = colors;
  }
}
