// Where a float (the Cliffside Cistern's moving platform, src/game/objects.js
// Float) can ever be: the tiles its 32x32 slab covers anywhere along its path.
// Pure, with no game or browser in it, so the dungeon flood (tools/lib/
// dungeon-flood.mjs) asks the same question of the same script the engine runs
// rather than keeping a private model of it.
import { FLOAT_SPEED } from '../data/feel.js';

export const FLOAT_DIRS = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };

/** Set of 'x,y' tiles the float placed at tile (tx, ty) ever overlaps. */
export function floatSweep(tx, ty, path) {
  const cells = new Set();
  let x = tx * 16 * 256, y = ty * 16 * 256, speed = FLOAT_SPEED;
  const cover = () => {
    const px = Math.floor(x / 256), py = Math.floor(y / 256);
    for (let cy = Math.floor(py / 16); cy <= Math.floor((py + 31) / 16); cy++) {
      for (let cx = Math.floor(px / 16); cx <= Math.floor((px + 31) / 16); cx++) cells.add(cx + ',' + cy);
    }
  };
  cover();
  // One pass of the script: a `loop` only repeats what was already swept.
  for (const [op, arg] of path || []) {
    if (op === 'speed') { speed = arg; continue; }
    const d = FLOAT_DIRS[op];
    if (!d) continue;
    for (let i = 0; i < arg; i++) { x += d[0] * speed; y += d[1] * speed; cover(); }
  }
  return cells;
}

/**
 * The tiles the float covers at each of its WAITS, one pass of the script
 * (a `loop` only repeats them): where it stands still on its own, so where a
 * rider steps off without anything stopping it. A list of Sets of 'x,y'.
 */
export function floatStations(tx, ty, path) {
  const out = [];
  let x = tx * 16 * 256, y = ty * 16 * 256, speed = FLOAT_SPEED;
  const cover = () => {
    const cells = new Set();
    const px = Math.floor(x / 256), py = Math.floor(y / 256);
    for (let cy = Math.floor(py / 16); cy <= Math.floor((py + 31) / 16); cy++) {
      for (let cx = Math.floor(px / 16); cx <= Math.floor((px + 31) / 16); cx++) cells.add(cx + ',' + cy);
    }
    return cells;
  };
  for (const [op, arg] of path || []) {
    if (op === 'speed') { speed = arg; continue; }
    if (op === 'wait') { out.push(cover()); continue; }
    const d = FLOAT_DIRS[op];
    if (d) { x += d[0] * speed * arg; y += d[1] * speed * arg; }
  }
  return out;
}
