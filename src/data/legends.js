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
    // `C` IS A CAVE AND `D` IS A DUNGEON, and they are different objects
    // because they are different promises. A dungeon door is a 2x2 BLOCK — a
    // carved gate with its own emblem — declared per region below, because
    // each region holds exactly one dungeon and each gate says which.
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
    'D': 'block:portalD3',  // the Bogwater Sanctum's gate
  }, 'base');

  // ---- dunes: the sandbar flats ------------------------------------------
  registerLegend('dunes', {
    'g': 'sandRipple', 'G': 'sand', 'f': 'sand', 'v': 'sandDeep',
    'T': 'palm', 'b': 'bushSand', 'o': 'rockSand', 'q': 'postSand',
    '#': 'cliffSand', '^': 'cliffSand', '_': 'ledgeSand',
    'C': 'caveMouthSand',   // cut into a sand cliff, so it wears the sand ramp
    'D': 'block:portalD1',  // the Tidewash Grotto's gate
    '"': 'ledgeSandN', '>': 'ledgeSandE', '<': 'ledgeSandW',
  }, 'base');

  // ---- cliffs: high stone shelves over deep water ------------------------
  registerLegend('cliffs', {
    'g': 'rockFloor', 'G': 'rockFloorDk', 'f': 'rockFloor',
    'T': 'treeDead', 'b': 'bush', 'o': 'rock',
    'X': 'boulderCracked',  // region gate: a boulder already split, bombs open it
    'V': 'keepSeal',        // story gate: the seal's upper course, on Upper Kell
    '#': 'cliffDk', '^': 'cliffTop', '%': 'cliffDk', '_': 'ledgeRock',
    '"': 'ledgeRockN', '>': 'ledgeRockE', '<': 'ledgeRockW',
    'D': 'block:portalD4',  // the Cliffside Cistern's gate
  }, 'base');

  // ---- drowned wood: sunken forest --------------------------------------
  registerLegend('wood', {
    'g': 'grassDark', 'G': 'grassTuft', 'f': 'flowersDark',
    'T': 'treeDark', 'P': 'treeDark',
    'b': 'bush', '#': 'cliffDk', '_': 'ledgeDk',
    '"': 'ledgeDkN', '>': 'ledgeDkE', '<': 'ledgeDkW',
    'D': 'block:portalD5',  // the Drowned Wood Shrine's gate
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
    'C': 'caveMouthAbyss',
    'D': 'block:portalD6',  // the Abyssal Keep's gate
    'V': 'keepSeal',        // story gate: the Maku Tree opens it at five Essences
    '_': 'ledgeAbyss',
    '"': 'ledgeAbyssN', '>': 'ledgeAbyssE', '<': 'ledgeAbyssW',
  }, 'base');

  // ---- coral: the reef city ---------------------------------------------
  registerLegend('coral', {
    'g': 'rockFloorCoral', 'G': 'sandCoral', 'f': 'rockFloorCoral',
    '.': 'sandCoral', ',': 'sandCoral',
    '~': 'waterSReef', '=': 'waterDReef',
    'T': 'palm', 'b': 'bushSand', 'o': 'rock', '#': 'cliffCoral', '^': 'cliffCoral',
    'C': 'caveMouthCoral',
    'D': 'block:portalD2',  // the Coral Spire's gate
    '_': 'ledgeCoral',
    '"': 'ledgeCoralN', '>': 'ledgeCoralE', '<': 'ledgeCoralW',
  }, 'base');

  // ---- towns -------------------------------------------------------------
  //
  // A BUILDING IS ONE CHARACTER, DRAWN AS ITS FOOTPRINT. The shop is three
  // cells wide and three tall, so it is nine H's in a 3x3 rectangle and the
  // loader resolves which cell each one is (see `expandBlocks` in
  // src/world/room.js). Two shops side by side are six H's in a row and are
  // two shops; a footprint that is not exactly the block's size THROWS, naming
  // the room, which is the whole reason a building is not nine loose tiles.
  //
  //     'ggghhhggg'       a house, with grass either side
  //     'ggghhhggg'
  //     'gggwwhhhg'       ...and a well tucked against it
  //
  // EVERY BUILDING IS SOLID except its doorway, so read the traps list in
  // CLAUDE.md before laying one out and run check-overworld.mjs after: a solid
  // tile can strand a screen while rendering perfectly and validating clean.
  // A town is a maze of solid tiles and is the worst case for it.
  //
  // The same characters mean the same buildings in both legends. The only
  // difference is what shows through the transparent pixels at a roof's
  // rounded corner — grass in the village, sand on the dunes — which is why
  // there are two sets of tiles for one set of art. Every character here is a
  // BLOCK reference: `tools/validate.mjs` fails on a registered block no
  // legend names, which is the check that `lionHead` and `urn` did not have.
  const townKit = (grass) => ({
    'H': 'block:bShop' + grass,          // the blue SHOP front. Enter at its middle.
    'h': 'block:bHouseGreen' + grass,    // green roof, window / doorway / window
    'j': 'block:bHouseRed' + grass,      // red roof, the same plan
    'k': 'block:bHouseShut' + grass,     // a house whose door is shut: no interior
    'w': 'block:bWell' + grass,          // 2x2 stone well
    'u': 'block:bStump' + grass,         // 3x2 stump, the size of a table
    'n': 'block:bFence' + grass,         // 1x2 paling fence; a run is a row of them
    'i': 'block:bBarrels' + grass,
    'e': 'block:bCrate' + grass,
    'z': 'block:bCrates' + grass,
  });
  // The village's one non-building doorway. `C` is the cave arch everywhere
  // else in the world; in a town it is the hollow at the top of the square that
  // the Maku Tree is reached through, and a grey cave mouth standing in a row
  // of oaks was the tell that the two had been sharing a tile.
  registerLegend('town', { ...townKit(''), 'C': 'treeHollow' }, 'coast');
  registerLegend('townDunes', townKit('Sand'), 'dunes');

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
  // The Drowned Wood Shrine needs one tide tile no other dungeon has, and every
  // digit in the shared vocabulary is already spoken for. `5` (`channel`) is an
  // OUTDOOR tile that no indoor room has ever placed — d7 and d8 use the
  // character, but they are on their own legends, so pointing it at the drowned
  // bole here moves nothing outside this one dungeon. It stays a DIGIT because
  // it stays a tide tile, which is the rule the digits carry.
  //
  // `k` is the kelp snarl the groves are gated on, and `0` (`dSump`) does a
  // second job here that it never did in the Cistern: it is the only tile in
  // the Shrine's vocabulary that is neither standable NOR plantable at any sea,
  // so it is what a grove is lined with to stop a stray seed growing a pillar
  // somewhere that would open the room from the wrong side.
  registerLegend('dungeonWood', { '5': 'dSnag', 'k': 'dSnarl' }, 'dungeonWood');
  theme('dungeonSalt',    'dFloorSalt',    'dFloorSaltAlt',    'dWallSalt',    'dWallSaltX',    'dBlockSalt',    'dUrnSalt');
  theme('dungeonPalace',  'dFloorPalace',  'dFloorPalaceAlt',  'dWallPalace',  'dWallPalaceX',  'dBlockPalace',  'dUrnPalace');
  theme('dungeonAbyss',   'dFloorAbyss',   'dFloorAbyssAlt',   'dWallAbyss',   'dWallAbyssX',   'dBlockAbyss',   'dUrnAbyss');
  // The Abyssal Keep needs one tile no other dungeon has, and every digit in
  // the shared vocabulary is already spoken for. `6` is `dRaceE`, one of the
  // Bogwater Sanctum's current races; no room outside d3 has ever placed it,
  // and repointing it inside this legend moves nothing outside this dungeon.
  // It stays a DIGIT because it stays a tide tile, which is the rule the
  // digits carry.
  //
  // `q` is the shared mooring post repointed at the Keep's own floor. The post
  // is transparent art over an `underArt` floor, and the shared one names the
  // BRICK floor — the same defect the urn had before every theme got its own.
  // `7` is `dRaceW`, the Sanctum's westward race, and the same argument applies.
  registerLegend('dungeonAbyss', { '6': 'dSilt', '7': 'dLintel', 'q': 'dPostAbyss' }, 'dungeonAbyss');

  // ---- cave / interior ---------------------------------------------------
  registerLegend('cave', {
    ' ': 'void',
    '.': 'rockFloorDk', 'g': 'rockFloor', '#': 'cliffDk', '%': 'cliffDk',
    '~': 'waterS', '=': 'waterD', 'O': 'dPit', 'p': 'pot', 'o': 'rock',
    '/': 'stairsDown', 'C': 'caveMouth', 'q': 'dPost', '_': 'ledgeRockDk',
    '"': 'ledgeRockDkN', '>': 'ledgeRockDkE', '<': 'ledgeRockDkW',
    '1': 'sandbar', '2': 'tidePool', '3': 'shoal', '4': 'seafloor',
    '5': 'channel', '8': 'tideRock', '9': 'drownWall',
    // Drift-tangle: burns, and burns only. See tiles-core.js.
    'T': 'driftTangleDk',
  });

  registerLegend('house', {
    ' ': 'void',
    '.': 'dFloor', '#': 'dWall', 'p': 'pot', '/': 'dStairs',
    'o': 'dDoorOpen', 'D': 'dDoorClosed',
  });
}
