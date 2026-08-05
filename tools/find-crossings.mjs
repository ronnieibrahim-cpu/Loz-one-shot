// Report every tile-level way into a region. A reporter, not a check.
//
// Placing a region gate by eye is the same class of hazard as placing a ledge
// by eye, and worse: a gate that misses one crossing gates nothing, and a gate
// that catches a crossing some *other* region depends on seals half the map.
// Both still validate, both still render, and `check-overworld.mjs` only tells
// you afterwards that the numbers moved.
//
// A crossing is a passable tile inside the region orthogonally adjacent to a
// passable tile outside it. Runs of them are collapsed, because a four-tile
// causeway is one way in, not four.
//
//   node tools/find-crossings.mjs                 # every region in GAME-PLAN
//   node tools/find-crossings.mjs "Coral Reef"    # just one
//
// Passability matches check-overworld's flood: a tile counts if it is walkable
// at ANY tide level, because the player controls the tide.

import { installData } from '../src/data/index.js';
import { MAPS } from '../src/world/maps.js';
import { getLegend } from '../src/world/room.js';
import { getTileDef, F } from '../src/world/tileset.js';

installData();

// Region rectangles are [x0, x1, y0, y1] inclusive, straight from GAME-PLAN.md.
const REGIONS = {
  'Tidewatch Coast': [3, 6, 7, 9],
  'The Shallows': [7, 11, 6, 9],
  'Coral Reef': [8, 11, 4, 6],
  'Sunken Marsh': [0, 2, 6, 9],
  'Cliffs of Kell': [0, 3, 2, 5],
  'Drowned Wood': [4, 7, 3, 6],
  'Salt Pans': [4, 7, 0, 2],
  'Reef Palace': [8, 11, 0, 3],
  'Abyssal approach': [0, 3, 0, 1],
};

const W = 10, H = 8;
const m = MAPS.get('overworld');
const legendOf = (d) => getLegend(d.legend || m.legend);

function defAt(legend, ch, tide) {
  let d = getTileDef(legend[ch]);
  for (let i = 0; i < 4 && d && d.tide; i++) d = getTileDef(d.tide[tide]);
  return d;
}
function walkableAt(legend, ch, tide) {
  const d = defAt(legend, ch, tide);
  if (!d) return false;
  return !(d.flags & (F.VOID | F.SOLID | F.PIT | F.DEEP | F.LEDGE | F.HAZARD));
}
const passable = (legend, ch) => [0, 1, 2].some(t => walkableAt(legend, ch, t));

const inRegion = (r, sx, sy) => sx >= r[0] && sx <= r[1] && sy >= r[2] && sy <= r[3];

// world tile coords so runs can be collapsed across a screen seam
const wx = (sx, x) => sx * W + x;
const wy = (sy, y) => sy * H + y;

const only = process.argv.slice(2).filter(a => !a.startsWith('--'));

for (const [name, rect] of Object.entries(REGIONS)) {
  if (only.length && !only.includes(name)) continue;
  const crossings = [];
  for (let sy = 0; sy < 10; sy++) for (let sx = 0; sx < 12; sx++) {
    if (!inRegion(rect, sx, sy)) continue;
    const def = m.roomDefs[`0,${sx},${sy}`];
    if (!def) continue;
    const l = legendOf(def);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!passable(l, def.map[y][x])) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        let nsx = sx, nsy = sy, nx = x + dx, ny = y + dy;
        if (nx < 0) { nsx--; nx = W - 1; } else if (nx >= W) { nsx++; nx = 0; }
        if (ny < 0) { nsy--; ny = H - 1; } else if (ny >= H) { nsy++; ny = 0; }
        if (inRegion(rect, nsx, nsy)) continue;          // still inside
        const nd = m.roomDefs[`0,${nsx},${nsy}`];
        if (!nd || !passable(legendOf(nd), nd.map[ny][nx])) continue;
        crossings.push({
          sx, sy, x, y, ch: def.map[y][x],
          from: `${nsx},${nsy}:${nx},${ny}`,
          wx: wx(sx, x), wy: wy(sy, y),
          edge: y === 0 || y === H - 1 || x === 0 || x === W - 1,
        });
      }
    }
  }
  // collapse: several crossings on the same world row/column next to each other
  // are one causeway. Group by contiguous world coordinate.
  const seen = new Set();
  const groups = [];
  for (const c of crossings) {
    const k = `${c.wx},${c.wy}`;
    if (seen.has(k)) continue;
    seen.add(k);
    const g = [c];
    for (const o of crossings) {
      const ok = `${o.wx},${o.wy}`;
      if (seen.has(ok)) continue;
      if (g.some(q => Math.abs(q.wx - o.wx) + Math.abs(q.wy - o.wy) === 1)) {
        seen.add(ok); g.push(o);
      }
    }
    groups.push(g);
  }
  console.log(`\n=== ${name}  screens x${rect[0]}-${rect[1]} y${rect[2]}-${rect[3]} ===`);
  console.log(`  ${crossings.length} crossing tile(s) in ${groups.length} way(s) in`);
  for (const g of groups) {
    const s = g[0];
    const onEdge = g.filter(c => c.edge).length;
    console.log(`   way of ${String(g.length).padStart(2)} tile(s)  screen 0,${s.sx},${s.sy}` +
      `  tiles ${g.map(c => `${c.x},${c.y}'${c.ch}'`).join(' ')}` +
      (onEdge ? `   [${onEdge} on a screen edge — a gate must NOT go there]` : ''));
  }
}
