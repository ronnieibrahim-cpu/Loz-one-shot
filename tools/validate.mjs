// Data validator. Runs in plain Node (no DOM) against the game's data modules and
// reports every structural problem it can find without launching a browser.
//
// Checks:
//   * every art string is rectangular and the expected size
//   * every tile definition is well formed and tide variants resolve
//   * every room grid is exactly 8 rows x 10 columns
//   * every legend character used by a room maps to a registered tile
//   * every warp resolves to a room that exists
//
// Usage: node tools/validate.mjs

import { parseArt } from '../src/gfx/art.js';
import { PALETTES } from '../src/gfx/palettes.js';
import { TILES, validateTiles } from '../src/world/tileset.js';
import { MAPS, validateMaps } from '../src/world/maps.js';
import { LEGENDS, getLegend } from '../src/world/room.js';
import { installData, ART_PACKS, SPRITE_PACKS } from '../src/data/index.js';
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
  checkArtPack('tile:' + label, pack, 16, 16);
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
        else if (!TILES.has(t)) problems.push(`map ${m.id}/${key}: legend '${ch}' -> unregistered tile '${t}'`);
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
