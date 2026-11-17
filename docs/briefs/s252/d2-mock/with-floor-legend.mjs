// Runs a tool from tools/ after adding the legend entries the proposed tide-floor
// room needs to the Coral Spire's legend. Option B's six characters are not in
// src/data/legends.js today (the build adds them there); this is the only
// thing the mock needs to stand in for them. No file under src/ is touched.
//
//   node docs/briefs/s252/d2-mock/with-floor-legend.mjs check-tidefloor.mjs --mock <spec.json>
//
// It extends `dungeonCoral` itself, which is what the build will do.
import { installData } from '../../../../src/data/index.js';
import { registerLegend } from '../../../../src/world/room.js';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

installData();
// The same six names Wood's own tide floor uses (legends.js), on letters the
// Coral legend leaves free: its `a`/`b` are the red and blue BLOCKS.
registerLegend('dungeonCoral', {
  e: 'dTileRed', h: 'dTileBlue', c: 'dTileRedLow', d: 'dTileBlueLow',
  f: 'dTileRedMid', g: 'dTileBlueMid',
}, 'dungeonCoral');

const here = dirname(fileURLToPath(import.meta.url));
const [tool, ...rest] = process.argv.slice(2);
process.argv = [process.argv[0], tool, ...rest];
await import(pathToFileURL(resolve(here, '../../../../tools', tool)).href);
