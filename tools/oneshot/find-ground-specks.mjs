// Scratch: where does a screen's ground change material for one tile and change
// straight back?
//
// The coast legend spells grass `g` and sand `.`, and a screen that mixes them
// without meaning to gets a hard-edged tan shape in the middle of a lawn — there
// are no transition tiles, so every boundary between two grounds is a straight
// pixel edge. A BEACH is fine: sand that reaches the sea, or the screen's edge,
// or a big enough patch to read as a place. What is not fine is a speck — one
// or two tiles of a material with nothing of its own kind around them.
//
// Ground here means what the engine will actually PAINT: `Room.underGround` for
// a prop, the tile itself otherwise, compared by PALETTE rather than by name,
// because `sand` and `sandRipple` are one material in two dressings.
import { installData } from '../../src/data/index.js';
import { MAPS, getRoom } from '../../src/world/maps.js';
import { F, getTileDef } from '../../src/world/tileset.js';

installData();
const TIDE = 1;
const rows = [];

for (const [mapId, m] of MAPS) {
  if (mapId !== 'overworld') continue;
  for (const key of Object.keys(m.roomDefs)) {
    const room = getRoom(mapId, ...key.split(',').map(Number));
    if (!room) continue;
    const pal = [];
    for (let y = 0; y < room.th; y++) {
      pal.push([]);
      for (let x = 0; x < room.tw; x++) {
        const d = room.tile(x, y, TIDE);
        // Water, walls and warps are not ground and do not vote.
        if (d.flags & (F.VOID | F.SOLID | F.WARP | F.WET)) { pal[y].push(null); continue; }
        const u = d.underArt ? room.underGround(d, x, y, TIDE) : d;
        pal[y].push(u.pal);
      }
    }
    // Connected components of each palette, 4-connected.
    const seen = new Set();
    const specks = [];
    for (let y = 0; y < room.th; y++) for (let x = 0; x < room.tw; x++) {
      const p = pal[y][x];
      if (p == null || seen.has(`${x},${y}`)) continue;
      const q = [[x, y]], cells = [];
      seen.add(`${x},${y}`);
      while (q.length) {
        const [cx, cy] = q.pop();
        cells.push([cx, cy]);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = cx + dx, ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= room.tw || ny >= room.th) continue;
          if (pal[ny][nx] !== p || seen.has(`${nx},${ny}`)) continue;
          seen.add(`${nx},${ny}`); q.push([nx, ny]);
        }
      }
      // A patch of one or two tiles, not touching the screen's border (a border
      // patch is the corner of the next screen's beach and is somebody else's
      // to judge).
      const border = cells.some(([cx, cy]) => cx === 0 || cy === 0 || cx === room.tw - 1 || cy === room.th - 1);
      if (cells.length <= 2 && !border) specks.push({ pal: p, cells });
    }
    if (specks.length) rows.push({ key, specks });
  }
}

let n = 0;
for (const r of rows) {
  console.log(`  ${r.key}`);
  for (const s of r.specks) { n++; console.log(`      ${s.pal.padEnd(10)} ${s.cells.map(c => c.join(',')).join(' ')}`); }
}
console.log(`\n${n} ground speck(s) across ${rows.length} screen(s)`);
