// Legends: the character vocabulary map authors write rooms in.
//
// Convention that runs through every legend:
//   DIGITS 0-9 ARE ALWAYS TIDE TILES. If a character is a digit, that cell
//   changes with the tide. Everything else is fixed terrain. This makes a room's
//   tide behaviour readable at a glance from its text grid.
//
// Rooms are 8 rows of exactly 10 characters.

import { registerLegend } from '../world/room.js';

export function installLegends() {
  // ---- base: shared by every outdoor region ------------------------------
  registerLegend('base', {
    ' ': 'void',
    // fixed ground
    'g': 'grass', 'G': 'grassTuft', 'f': 'flowers', 'v': 'tallgrass',
    '.': 'sand', ',': 'sandWet', ':': 'sandRipple', 'd': 'sandDeep',
    'm': 'mud', 'R': 'rockFloor', 'r': 'rockFloorDk',
    '~': 'waterS', '=': 'waterD',
    // barriers and props
    '#': 'cliff', '^': 'cliffTop', '%': 'cliffDk', 'X': 'cliffCracked',
    'T': 'tree', 'Y': 'treeSand', 'P': 'palm',
    'b': 'bush', 'B': 'bushSand', 'o': 'rock', 'O': 'rockSand',
    'q': 'post', 'Q': 'postSand', 'x': 'digSpot',
    // transitions
    // region gates. In `base` rather than per region: a region's boundary
    // screen frequently belongs to the NEIGHBOURING region's legend, so a gate
    // char scoped to one region is undefined precisely where it must be placed.
    'K': 'grateOw',      // metal: only the Resonance Rod retracts it
    'J': 'chasm',        // Roc's Feather   — 1 tile, clearable at 2.27 tiles
    'M': 'boulder',      // Dredge Line     — drag it out of the way
    'C': 'caveMouth', 'c': 'caveMouthSolid', '/': 'stairsDown', '_': 'ledgeS',
    '"': 'ledgeN', '>': 'ledgeE', '<': 'ledgeW',
    // TIDE TILES (digits)
    '1': 'sandbar',    // dry at low, wadeable at mid, deep at high
    '2': 'tidePool',   // wet sand at low, wadeable, then deep
    '3': 'shoal',      // dry until high tide covers it
    '4': 'seafloor',   // walkable only at low tide
    '5': 'channel',    // wadeable only at low tide
    '6': 'reefFlat',   // reef exposed at low
    '7': 'reefDeep',   // reef channel: wadeable at low, deep above
    '8': 'tideRock',   // stepping stone that only drowns at high tide
    '9': 'drownWall',  // a low wall you can swim over at high tide
    '0': 'tideGrass',  // meadow that floods at high tide
    '!': 'mudflat',
    '?': 'abyssHole',
    // Riptides: deep water that carries a swimmer. Sink mode ignores them.
    'N': 'riptideN', 'S': 'riptideS', 'E': 'riptideE', 'W': 'riptideW',
  });

  // ---- coast: the default overworld look ---------------------------------
  registerLegend('coast', {}, 'base');

  // ---- reef: bright shallow-sea region -----------------------------------
  registerLegend('reef', {
    'g': 'rockFloor', 'G': 'rockFloor', 'f': 'rockFloor', '_': 'ledgeRock',
    '"': 'ledgeRockN', '>': 'ledgeRockE', '<': 'ledgeRockW',
    '~': 'waterSReef', '=': 'waterDReef',
    'T': 'palm', 'b': 'bushSand',
  }, 'base');

  // ---- marsh: sunken, muddy region ---------------------------------------
  registerLegend('marsh', {
    'g': 'grassDark', 'G': 'grassDark', 'f': 'flowersDark', '.': 'mud', ',': 'mud', '_': 'ledgeDk',
    '"': 'ledgeDkN', '>': 'ledgeDkE', '<': 'ledgeDkW',
    'T': 'tree', '#': 'cliffDk', 'X': 'cliffCrackedDk',
  }, 'base');

  // ---- dunes: the sandbar flats ------------------------------------------
  registerLegend('dunes', {
    'g': 'sandRipple', 'G': 'sand', 'f': 'sand', 'v': 'sandDeep',
    'T': 'palm', 'b': 'bushSand', 'o': 'rockSand', 'q': 'postSand',
    '#': 'cliffSand', '^': 'cliffSand', '_': 'ledgeSand',
    '"': 'ledgeSandN', '>': 'ledgeSandE', '<': 'ledgeSandW',
  }, 'base');

  // ---- cliffs: high stone shelves over deep water ------------------------
  registerLegend('cliffs', {
    'g': 'rockFloor', 'G': 'rockFloorDk', 'f': 'rockFloor',
    'T': 'treeDead', 'b': 'bush', 'o': 'rock',
    '#': 'cliffDk', '^': 'cliffTop', '%': 'cliffDk', '_': 'ledgeRock',
    '"': 'ledgeRockN', '>': 'ledgeRockE', '<': 'ledgeRockW',
  }, 'base');

  // ---- drowned wood: sunken forest --------------------------------------
  registerLegend('wood', {
    'g': 'grassDark', 'G': 'grassTuft', 'f': 'flowersDark',
    'T': 'treeDark', 'P': 'treeDark',
    'b': 'bush', '#': 'cliffDk', '_': 'ledgeDk',
    '"': 'ledgeDkN', '>': 'ledgeDkE', '<': 'ledgeDkW',
  }, 'base');

  // ---- salt flats: bleached pans that flood ------------------------------
  registerLegend('salt', {
    'g': 'saltFlat', 'G': 'saltCrust', 'f': 'saltFlat', '.': 'saltCrust', ',': 'saltFlat',
    'T': 'treeDead', 'b': 'bushSand', 'o': 'rockSand',
    '#': 'cliffMarble', '^': 'cliffMarble', '_': 'ledgeSalt',
    'V': 'saltVane',        // region gate: only the Resonance Rod rings it
    '"': 'ledgeSaltN', '>': 'ledgeSaltE', '<': 'ledgeSaltW',
  }, 'base');

  // ---- abyss: the deepest water, endgame region -------------------------
  registerLegend('abyss', {
    'g': 'rockFloorDk', 'G': 'rockFloorRust', 'f': 'rockFloorDk',
    '.': 'sandRust', ',': 'sandRust',
    '~': 'waterD', '=': 'waterAbyss',
    'T': 'treeDead', 'o': 'rock', '#': 'cliffAbyss', '^': 'cliffAbyss',
    'V': 'abyssPlug',       // region gate: only the Dredge Line shifts it
    '_': 'ledgeAbyss',
    '"': 'ledgeAbyssN', '>': 'ledgeAbyssE', '<': 'ledgeAbyssW',
  }, 'base');

  // ---- coral: the reef city ---------------------------------------------
  registerLegend('coral', {
    'g': 'rockFloorCoral', 'G': 'sandCoral', 'f': 'rockFloorCoral',
    '.': 'sandCoral', ',': 'sandCoral',
    '~': 'waterSReef', '=': 'waterDReef',
    'T': 'palm', 'b': 'bushSand', 'o': 'rock', '#': 'cliffCoral', '^': 'cliffCoral',
    '_': 'ledgeCoral',
    '"': 'ledgeCoralN', '>': 'ledgeCoralE', '<': 'ledgeCoralW',
  }, 'base');

  // ---- dungeon: shared indoor vocabulary ---------------------------------
  registerLegend('dungeon', {
    ' ': 'void',
    '.': 'dFloor', ',': 'dFloorCrack', 'w': 'dWaterS', 'W': 'dWaterD',
    '#': 'dWall', 'X': 'dWallCracked', '=': 'dBlock', 'q': 'dPost',
    'O': 'dPit', '^': 'spikes', 'p': 'pot',
    'D': 'dDoorClosed', 'o': 'dDoorOpen', 'L': 'dDoorLocked', 'B': 'dDoorBoss',
    'G': 'grate',      // metal: only the Resonance Rod retracts it
    '/': 'dStairs',
    // Themed scenery, extracted by tools/rip-dungeon-themes.py. These had
    // tiledefs and a comment saying "for P8 to place" from the moment P7.5
    // step 8 landed, and no legend character — so no room grid could name
    // them and the art sat in the build unreachable. BOTH ARE SOLID: read the
    // traps list in CLAUDE.md before placing one, and re-run
    // walk-dungeons.mjs, because a solid tile can strand a room while
    // rendering perfectly and validating clean.
    'M': 'dLionHead',  // a gilded lion mask
    'U': 'dUrn',       // a wide-bellied urn
    'R': 'rockFloor', 'r': 'rockFloorDk', '_': 'dLedge',
    '"': 'dLedgeN', '>': 'dLedgeE', '<': 'dLedgeW',
    // TIDE TILES (digits) — the indoor versions
    // Riptides. `W` is already dWaterD indoors, so the indoor set is the three
    // that were free; a westward drain wants `riptideW` written as an inline
    // legend override on the room that needs it.
    'N': 'riptideN', 'S': 'riptideS', 'E': 'riptideE',
    // Torrents: the same water running harder than a swimmer can. NOT digits,
    // because a digit means a tide tile and a torrent is deep at every level —
    // its whole job is to be the same barrier whatever the conch says, so that
    // the only answer to it is the Cleats' floor mode.
    'T': 'dTorrentE', 't': 'dTorrentW', 'V': 'dTorrentS', 'A': 'dTorrentN',
    '0': 'dSump',      // an open pit at low tide, and OVER YOUR HEAD above it
    '1': 'dSluice',    // dry floor -> shallow -> deep
    '2': 'dBasin',     // dry -> damp -> shallow
    '3': 'dWell',      // shallow -> deep -> deep
    '4': 'dDrain',     // an open pit at low tide, water above it
    '5': 'channel',
    '6': 'dRaceE', '7': 'dRaceW',   // wadeable at LOW, a current above it
    '8': 'tideRock',
    '9': 'drownWall',
  });

  // ---- dungeon THEMES ----------------------------------------------------
  //
  // Each of these is the shared `dungeon` legend with SIX characters pointed
  // at a themed tile: floor, cracked floor, wall, bombable wall, block and urn.
  // Everything else — doors, stairs, pits, spikes, ledges, the lion mask, and
  // every tide digit — is inherited unchanged, which is the entire point of
  // doing it this way: A DUNGEON CHANGES ITS LOOK BY CHANGING ONE `legend:`
  // FIELD, and not one character of one room grid moves.
  //
  // That also means a theme cannot alter passability by accident. The six
  // tiles below carry exactly the flags their shared counterparts carry —
  // floors none, walls SOLID, the cracked wall SOLID|BOMBABLE, the block and
  // the urn SOLID — so walk-dungeons and solve-switches see the identical
  // world before and after.
  //
  // ADDING A SEVENTH CHARACTER, since the sixth is now the worked example:
  // give every theme a tiledef for it in tiles-core.js, add the parameter
  // here, and add the pair to SHARED in tools/validate.mjs so the flags are
  // checked. Miss the last step and a theme is free to change the rules.
  //
  // Tiles and palettes come from tools/rip-dungeon-themes.py, off the Seasons
  // dungeon map. See src/data/tiles-dungeon-themes.js.
  const theme = (name, floor, alt, wall, cracked, block, urn) => registerLegend(name, {
    '.': floor, ',': alt, '#': wall, 'X': cracked, '=': block, 'U': urn,
  }, 'dungeon');

  theme('dungeonGrotto',  'dFloorGrotto',  'dFloorGrottoAlt',  'dWallGrotto',  'dWallGrottoX',  'dBlockGrotto',  'dUrnGrotto');
  theme('dungeonCoral',   'dFloorCoral',   'dFloorCoralAlt',   'dWallCoral',   'dWallCoralX',   'dBlockCoral',   'dUrnCoral');
  theme('dungeonBog',     'dFloorBog',     'dFloorBogAlt',     'dWallBog',     'dWallBogX',     'dBlockBog',     'dUrnBog');
  theme('dungeonCistern', 'dFloorCistern', 'dFloorCisternAlt', 'dWallCistern', 'dWallCisternX', 'dBlockCistern', 'dUrnCistern');
  theme('dungeonWood',    'dFloorWood',    'dFloorWoodAlt',    'dWallWood',    'dWallWoodX',    'dBlockWood',    'dUrnWood');
  theme('dungeonSalt',    'dFloorSalt',    'dFloorSaltAlt',    'dWallSalt',    'dWallSaltX',    'dBlockSalt',    'dUrnSalt');
  theme('dungeonPalace',  'dFloorPalace',  'dFloorPalaceAlt',  'dWallPalace',  'dWallPalaceX',  'dBlockPalace',  'dUrnPalace');
  theme('dungeonAbyss',   'dFloorAbyss',   'dFloorAbyssAlt',   'dWallAbyss',   'dWallAbyssX',   'dBlockAbyss',   'dUrnAbyss');

  // ---- cave / interior ---------------------------------------------------
  registerLegend('cave', {
    ' ': 'void',
    '.': 'rockFloorDk', 'g': 'rockFloor', '#': 'cliffDk', '%': 'cliffDk',
    '~': 'waterS', '=': 'waterD', 'O': 'dPit', 'p': 'pot', 'o': 'rock',
    '/': 'stairsDown', 'C': 'caveMouth', 'q': 'dPost', '_': 'ledgeRockDk',
    '"': 'ledgeRockDkN', '>': 'ledgeRockDkE', '<': 'ledgeRockDkW',
    '1': 'sandbar', '2': 'tidePool', '3': 'shoal', '4': 'seafloor',
    '5': 'channel', '8': 'tideRock', '9': 'drownWall',
  });

  registerLegend('house', {
    ' ': 'void',
    '.': 'dFloor', '#': 'dWall', 'p': 'pot', '/': 'dStairs',
    'o': 'dDoorOpen', 'D': 'dDoorClosed',
  });
}
