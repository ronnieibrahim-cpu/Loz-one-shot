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
  });

  // ---- coast: the default overworld look ---------------------------------
  registerLegend('coast', {}, 'base');

  // ---- reef: bright shallow-sea region -----------------------------------
  registerLegend('reef', {
    'g': 'rockFloor', 'G': 'rockFloor', '_': 'ledgeRock',
    '"': 'ledgeRockN', '>': 'ledgeRockE', '<': 'ledgeRockW',
    '~': 'waterSReef', '=': 'waterDReef',
    'T': 'palm', 'b': 'bushSand',
  }, 'base');

  // ---- marsh: sunken, muddy region ---------------------------------------
  registerLegend('marsh', {
    'g': 'grassDark', 'G': 'grassDark', '.': 'mud', ',': 'mud', '_': 'ledgeDk',
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
    'g': 'grassDark', 'G': 'grassTuft', 'T': 'treeDark', 'P': 'treeDark',
    'b': 'bush', '#': 'cliffDk', '_': 'ledgeDk',
    '"': 'ledgeDkN', '>': 'ledgeDkE', '<': 'ledgeDkW',
  }, 'base');

  // ---- salt flats: bleached pans that flood ------------------------------
  registerLegend('salt', {
    'g': 'saltFlat', 'G': 'saltCrust', '.': 'saltCrust', ',': 'saltFlat',
    'T': 'treeDead', 'b': 'bushSand', 'o': 'rockSand',
    '#': 'cliffMarble', '^': 'cliffMarble', '_': 'ledgeSalt',
    'V': 'saltVane',        // region gate: only the Magic Boomerang turns it
    '"': 'ledgeSaltN', '>': 'ledgeSaltE', '<': 'ledgeSaltW',
  }, 'base');

  // ---- abyss: the deepest water, endgame region -------------------------
  registerLegend('abyss', {
    'g': 'rockFloorDk', 'G': 'rockFloorRust', '.': 'sandRust', ',': 'sandRust',
    '~': 'waterD', '=': 'waterAbyss',
    'T': 'treeDead', 'o': 'rock', '#': 'cliffAbyss', '^': 'cliffAbyss',
    'V': 'abyssPlug',       // region gate: only the Magnetic Gloves shift it
    '_': 'ledgeAbyss',
    '"': 'ledgeAbyssN', '>': 'ledgeAbyssE', '<': 'ledgeAbyssW',
  }, 'base');

  // ---- coral: the reef city ---------------------------------------------
  registerLegend('coral', {
    'g': 'rockFloorCoral', 'G': 'sandCoral', '.': 'sandCoral', ',': 'sandCoral',
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
    '/': 'dStairs',
    'R': 'rockFloor', 'r': 'rockFloorDk', '_': 'dLedge',
    '"': 'dLedgeN', '>': 'dLedgeE', '<': 'dLedgeW',
    // TIDE TILES (digits) — the indoor versions
    '1': 'dSluice',    // dry floor -> shallow -> deep
    '2': 'dBasin',     // dry -> damp -> shallow
    '3': 'dWell',      // shallow -> deep -> deep
    '4': 'dDrain',     // an open pit at low tide, water above it
    '5': 'channel',
    '8': 'tideRock',
    '9': 'drownWall',
  });

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
