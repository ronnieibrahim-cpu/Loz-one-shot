// Data validator. Runs in plain Node (no DOM) against the game's data modules and
// reports every structural problem it can find without launching a browser.
//
// Checks:
//   * every art string is rectangular and the expected size
//   * every tile definition is well formed and tide variants resolve
//   * every room grid matches its declared size in screens
//   * every extracted dungeon-theme tile can actually reach the screen
//   * every extracted town block is drawn, named by a legend, and constructs
//   * every legend character used by a room maps to a registered tile
//   * every warp resolves to a room that exists
//
// Usage: node tools/validate.mjs

import { parseArt } from '../src/gfx/art.js';
import { PALETTES } from '../src/gfx/palettes.js';
import { TILES, TRANSFORMS, BLOCKS, validateTiles } from '../src/world/tileset.js';
import { MAPS, validateMaps, getRoom } from '../src/world/maps.js';
import { LEGENDS, getLegend } from '../src/world/room.js';
import { installData, ART_PACKS, SPRITE_PACKS } from '../src/data/index.js';
import { DUNGEON_THEME_ART } from '../src/data/tiles-dungeon-themes.js';
import { TOWN_ART } from '../src/data/tiles-terrain.js';
import { REQUIRED_SPRITES, expectedSize, allRequired } from '../src/data/sprite-manifest.js';

const STRICT = process.argv.includes('--strict');
const ONLY = (process.argv.find(a => a.startsWith('--pack=')) || '').slice(7);

const problems = [];
const warn = [];

function checkArtPack(label, pack, expectW, expectH, { allowVariable = false, sizeFor = null } = {}) {
  for (const [name, entry] of Object.entries(pack)) {
    if (sizeFor) { const [w, h] = sizeFor(name); expectW = w; expectH = h; }
    // Entries are either a bare art string or { art, pal } binding a palette.
    const src = (entry && typeof entry === 'object') ? entry.art : entry;
    if (typeof src !== 'string') { problems.push(`${label}/${name}: art is not a string`); continue; }
    const lines = src.split('\n').map(l => l.trimEnd()).filter(l => l.trim() !== '');
    if (!lines.length) { problems.push(`${label}/${name}: art is empty`); continue; }
    const indent = Math.min(...lines.map(l => l.match(/^ */)[0].length));
    const rows = lines.map(l => l.slice(indent));
    const widths = [...new Set(rows.map(r => r.length))];
    if (widths.length > 1) {
      problems.push(`${label}/${name}: ragged rows, widths ${widths.join(',')} (rows must all be the same length)`);
    }
    const a = parseArt(src);
    if (!allowVariable) {
      if (a.w !== expectW || a.h !== expectH) {
        problems.push(`${label}/${name}: is ${a.w}x${a.h}, expected ${expectW}x${expectH}`);
      }
    }
    const bad = new Set();
    for (const r of rows) for (const c of r) if (!'0123. '.includes(c)) bad.add(c);
    if (bad.size) problems.push(`${label}/${name}: illegal characters ${[...bad].map(c => JSON.stringify(c)).join(',')} (only 0-3 and . allowed)`);

    // A space between two drawn pixels is nearly always a typo for '.' or a
    // missing pixel: it punches a transparent hole through the middle of a sprite.
    rows.forEach((r, y) => {
      if (/[0-3.] [0-3.]/.test(r)) {
        problems.push(`${label}/${name}: row ${y} has an interior space — use '.' for transparent, or fill the pixel: "${r}"`);
      }
    });
  }
}

installData();

// --- art ------------------------------------------------------------------
for (const [label, pack] of Object.entries(ART_PACKS)) {
  // Tiles consult the manifest for size exceptions too, not just sprites. A
  // tile used to be 16x16 without exception; the oak is drawn as a whole
  // 32x32 object overhanging its cell (see `big` in registerTiles), so its two
  // halves are 32x16 and the ONE place that records such an exception is
  // `expectedSize`. Without this the manifest could say 32x16 and the
  // validator would still insist on 16x16, which is two sources of truth.
  checkArtPack('tile:' + label, pack, 16, 16, { sizeFor: expectedSize });
}
for (const [label, pack] of Object.entries(SPRITE_PACKS)) {
  checkArtPack('sprite:' + label, pack, 16, 16, { sizeFor: expectedSize });
}

// --- sprite coverage against the manifest ---------------------------------
// Warnings by default so structural checks stay usable while art lands;
// --strict turns them into failures for the final gate.
const registered = new Set(Object.values(SPRITE_PACKS).flatMap(p => Object.keys(p)));
let missingTotal = 0;
for (const [pack, names] of Object.entries(REQUIRED_SPRITES)) {
  if (ONLY && ONLY !== pack) continue;
  const missing = names.filter(n => !registered.has(n));
  missingTotal += missing.length;
  if (!missing.length) continue;
  const line = `sprite pack '${pack}': ${missing.length}/${names.length} missing: ${missing.join(' ')}`;
  if (STRICT) problems.push(line); else warn.push(line);
}

// Extra sprites that nothing asks for usually mean a typo in a name.
const requiredSet = new Set(allRequired());
for (const name of registered) {
  if (!requiredSet.has(name)) {
    warn.push(`sprite '${name}' is registered but not in the manifest (typo, or add it to sprite-manifest.js)`);
  }
}

// --- tiles ----------------------------------------------------------------
for (const p of validateTiles()) problems.push('tile: ' + p);
for (const [name, d] of TILES) {
  if (!PALETTES[d.pal]) problems.push(`tile ${name}: unknown palette '${d.pal}'`);
  if (d.underArt && !TILES.has(d.underArt)) problems.push(`tile ${name}: underArt '${d.underArt}' is not a tile`);
}

// --- dungeon themes -------------------------------------------------------
//
// A theme is a look, never a rule. Each themed tile must carry EXACTLY the
// flags of the shared dungeon tile it stands in for, or a dungeon that only
// meant to change colour has quietly changed where the player can walk — and
// walk-dungeons would report it as a stranded room in a dungeon nobody edited.
{
  const THEMES = ['Grotto', 'Coral', 'Bog', 'Cistern', 'Wood', 'Salt', 'Palace', 'Abyss'];
  const SHARED = [['dFloor', 'dFloor%'], ['dFloorCrack', 'dFloor%Alt'],
    ['dWall', 'dWall%'], ['dWallCracked', 'dWall%X'], ['dBlock', 'dBlock%'],
    ['dUrn', 'dUrn%']];
  for (const th of THEMES) {
    for (const [base, pat] of SHARED) {
      const name = pat.replace('%', th);
      const a = TILES.get(base), b = TILES.get(name);
      if (!b) { problems.push(`theme ${th}: missing tile ${name}`); continue; }
      if (a.flags !== b.flags) {
        problems.push(`theme ${th}: ${name} flags ${b.flags} != ${base}'s ${a.flags}`
          + ' — a theme may change the look, never the rules');
      }
      // A tile the ripper keyed to transparency draws a hole without one, and
      // it has to be THIS theme's floor or the object stands on the wrong
      // dungeon's flagstones — which is the whole reason there is one per theme.
      if (base === 'dUrn') {
        const want = 'dFloor' + th;
        if (b.underArt !== want) {
          problems.push(`theme ${th}: ${name} underArt is ${JSON.stringify(b.underArt)},`
            + ` expected '${want}' — a keyed-out object without its own floor under it is a hole`);
        }
      }
    }
  }
}

// --- extracted art that nothing can put on screen -------------------------
//
// EXTRACTION IS ONLY WORTH ANYTHING IF A ROOM CAN NAME THE TILE, and two
// separate links in that chain broke silently in P7.5 step 8. `lionHead` and
// `urn` were extracted, given tiledefs, and commented "for P8 to place" — and
// no legend ever got a character for them, so no room grid could name them and
// the art shipped in the build unreachable for the whole life of the feature.
// Nothing caught it: `validate` checked that themed tiles carry the right
// FLAGS, `test.mjs` counts unauthored sprite names, and neither asks the
// question "can anyone actually use this".
//
// Two checks, one per link:
//   1. every entry in DUNGEON_THEME_ART is drawn by some tiledef;
//   2. every tiledef built on extracted art is REACHABLE — named by a legend,
//      or by another tile's tide variants, or as a transform target, or as
//      someone's underArt. The last three matter: `dFloorWet` is the MID form
//      of `dBasin` and `grateOpen` is what the Resonance Rod turns a grate
//      into, and neither has or wants a legend character.
//
// An entry in UNUSED_ART is a deliberate exemption and must carry the reason,
// the same discipline check-charms.mjs uses for the two charms that act on the
// slotting rule itself. An exemption is not a way to silence this — it is a
// note that the art was looked at and rejected, with what was seen.
{
  const UNUSED_ART = {
    hatchWall: 'a VERTICAL run. Rendered four-wide as a top course and 4x4 as a '
      + 'fill (tools/shots/wallruns.png): it reads as pale vertical striping both '
      + 'ways, like railings, never like masonry. No tiledef on purpose.',
    forgeWall: 'a horizontal run, and it does read as a barrel-vaulted top '
      + 'course over a floor — but "the top row of a room is a different tile" '
      + 'is a dungeon-wide authoring convention, not a tile, and no dungeon has '
      + 'adopted one. Wire it when a P8 session decides to.',
  };

  // Art is compared by VALUE, not by name: several picks are the same pixels
  // under different palettes (coralWall and vaultBlock, gildFloor and
  // ruinFloorAlt), so a name-keyed index silently collapses them.
  const drawnArt = new Set();
  for (const [, d] of TILES) if (d.art) drawnArt.add(d.art);
  for (const [name, art] of Object.entries(DUNGEON_THEME_ART)) {
    if (drawnArt.has(art)) {
      if (UNUSED_ART[name]) {
        problems.push(`theme art '${name}': listed as unused in validate.mjs but a tiledef draws it`
          + ' — remove the exemption');
      }
      continue;
    }
    if (UNUSED_ART[name]) continue;
    problems.push(`theme art '${name}': extracted by rip-dungeon-themes.py and no tiledef draws it`
      + ' — give it a tiledef, or add it to UNUSED_ART in validate.mjs with the reason');
  }

  const reachable = new Set();
  for (const [, map] of LEGENDS) for (const t of Object.values(map)) reachable.add(t);
  for (const [, d] of TILES) {
    if (d.tide) for (const t of d.tide) reachable.add(t);
    if (d.underArt) reachable.add(d.underArt);
  }
  for (const [, rules] of TRANSFORMS) {
    for (const [k, v] of Object.entries(rules)) {
      if (typeof v === 'string' && !['fx', 'drop', 'sfx', 'deny'].includes(k)) reachable.add(v);
    }
  }
  const themeArt = new Set(Object.values(DUNGEON_THEME_ART));
  for (const [name, d] of TILES) {
    if (!d.art || !themeArt.has(d.art) || reachable.has(name)) continue;
    problems.push(`tile '${name}': built on extracted theme art and no legend, tide variant or`
      + ' transform can reach it — a room cannot name it, so it can never appear');
  }

  // ...AND THE SAME QUESTION OF EVERY OTHER TILE, as a note.
  //
  // The check above only asks it of tiles built on extracted dungeon-theme art,
  // which is where it bit last. It bit again somewhere else: a hand-drawn
  // `stump` carrying F.SOLID that no legend could name, and `dSwitchUp` /
  // `dSwitchDown` left over from a design where floor switches were terrain
  // rather than entities. That pair was not merely waste — REEFSEED_PLANT_BLOCK
  // names F.SWITCHF and `dSwitchUp` was the only tile carrying it, so the guard
  // meant to stop a coral pillar sealing a switch room had no tile to fire on
  // and never had.
  //
  // A NOTE rather than a failure: a tile whose region has not been built yet is
  // a vocabulary waiting for a place, and failing on it would be a checker
  // commissioning content. What it must not do is stay invisible.
  for (const [, b] of BLOCKS) for (const row of b.tiles) for (const t of row) reachable.add(t);
  for (const [, d] of TILES) {
    if (d.variants) for (const t of d.variants) reachable.add(t);
    if (d.edgeArt) for (const t of Object.values(d.edgeArt)) reachable.add(t);
    // A ground fringe is reached through `edgePairs` — a map of a neighbour's
    // MATERIAL to that pair's 12 mask keys (see installGroundFringes in
    // tiles-core.js). Without this the 204 fringe tiles all read as unreachable
    // and drown the one warning this sweep exists to give.
    if (d.edgePairs) {
      for (const set of Object.values(d.edgePairs)) {
        for (const t of Object.values(set)) reachable.add(t);
      }
    }
  }
  // Set by code rather than by a grid; the call site is named so grep finds it
  // if one of these stops being reached.
  reachable.add('coralPillar');            // Reefseed.bloom, src/game/items.js
  const orphans = [...TILES.keys()].filter(n => !reachable.has(n));
  warn.push(orphans.length
    ? `${orphans.length} tile(s) no grid, block, transform or tiledef can reach: ${orphans.join(' ')}`
    : 'every registered tile is reachable from some grid, block, transform or tiledef');
}

// --- the town kit ---------------------------------------------------------
//
// The same two links the dungeon-theme check above exists for, for the blocks:
// art nothing draws, and a block no room can name. The second one is the one
// that bit before — `lionHead` and `urn` were extracted, given tiledefs and
// left without a legend character, so they shipped in the build unreachable
// with every checker green. A block is MORE exposed to it, not less: it needs
// a legend entry per ground variant, and the variant that has none looks
// exactly like the variant that has one from anywhere except here.
{
  const drawnArt = new Set();
  for (const [, d] of TILES) if (d.art) drawnArt.add(d.art);
  for (const [name, art] of Object.entries(TOWN_ART)) {
    if (!drawnArt.has(art)) {
      problems.push(`town art '${name}': extracted by rip-terrain.py and no tiledef draws it`);
    }
  }
  const named = new Set();
  for (const [, map] of LEGENDS) {
    for (const t of Object.values(map)) {
      if (typeof t === 'string' && t.startsWith('block:')) named.add(t.slice(6));
    }
  }
  for (const [name, b] of BLOCKS) {
    if (!named.has(name)) {
      problems.push(`block '${name}': registered and no legend names it — a room grid`
        + ' cannot place it, so it can never appear');
    }
    for (const row of b.tiles) {
      for (const t of row) if (!TILES.has(t)) problems.push(`block '${name}': cell tile '${t}' is not registered`);
    }
  }
}

// --- every room actually constructs ---------------------------------------
//
// Until blocks there was nothing in the constructor that could fail on data a
// static read of the grid passes, so this file checked grids rather than
// rooms. A BLOCK FOOTPRINT IS EXACTLY THAT KIND OF FAULT: a 3x3 shop drawn
// eight characters wide is a legal grid of legal characters and an illegal
// building, and the difference is only visible to the expansion pass.
for (const m of MAPS.values()) {
  for (const key of Object.keys(m.roomDefs)) {
    const [floor, x, y] = key.split(',').map(Number);
    try { getRoom(m.id, floor, x, y); }
    catch (e) { problems.push(`room ${m.id} ${key}: ${e.message}`); }
  }
}

// --- maps -----------------------------------------------------------------
for (const p of validateMaps()) problems.push('map: ' + p);

// legend coverage: every char a room actually uses must resolve
for (const m of MAPS.values()) {
  for (const [key, def] of Object.entries(m.roomDefs)) {
    const legend = getLegend(def.legend || m.legend);
    const missing = new Set();
    for (const row of (def.map || [])) {
      for (const ch of row) {
        if (ch === ' ') continue;
        const t = legend[ch];
        if (!t) missing.add(ch);
        // A legend entry is either a tile or a block reference. The block's
        // own cells are checked against TILES above, and its footprint is
        // checked when the room constructs.
        else if (t.startsWith('block:')) {
          if (!BLOCKS.has(t.slice(6))) problems.push(`map ${m.id}/${key}: legend '${ch}' -> unregistered block '${t}'`);
        } else if (!TILES.has(t)) problems.push(`map ${m.id}/${key}: legend '${ch}' -> unregistered tile '${t}'`);
      }
    }
    if (missing.size) {
      problems.push(`map ${m.id}/${key}: legend '${def.legend || m.legend}' has no entry for ${[...missing].map(c => JSON.stringify(c)).join(',')}`);
    }
  }
}

// --- reachability sanity: dungeons need an entrance and a boss room -------
for (const m of MAPS.values()) {
  if (m.kind !== 'dungeon') continue;
  const d = m.dungeon;
  if (!d) { problems.push(`map ${m.id}: dungeon map without a dungeon block`); continue; }
  if (!d.entrance) problems.push(`dungeon ${m.id}: no entrance defined`);
  if (d.bossRoom && !m.roomDefs[d.bossRoom]) problems.push(`dungeon ${m.id}: bossRoom '${d.bossRoom}' does not exist`);
  const roomCount = Object.keys(m.roomDefs).length;
  if (roomCount < 6) warn.push(`dungeon ${m.id}: only ${roomCount} rooms`);
}

// --- report ---------------------------------------------------------------
const counts = {
  tiles: TILES.size,
  legends: LEGENDS.size,
  maps: MAPS.size,
  rooms: [...MAPS.values()].reduce((a, m) => a + Object.keys(m.roomDefs).length, 0),
};
console.log(`validate: ${counts.tiles} tiles, ${counts.legends} legends, ${counts.maps} maps, ${counts.rooms} rooms`);
for (const w of warn) console.log('  warn: ' + w);

if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log('validate: OK');
