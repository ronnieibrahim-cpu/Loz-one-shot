// Take the villagers out of the trees.
//
// A tree is a 32x32 object on a fixed 2x2 lattice, so a treeline one tile deep
// in the DATA is two tiles deep on the SCREEN: the canopy in the tree's own row
// and the root mound in the row below it, painted over whatever ground is
// there. That is deliberate and it is what the source does — every tree in
// Holodrum has roots. What is not deliberate is placing something in that row.
//
// Twenty-one placed entities stand inside an overhang. Four of them are in
// Tidewatch Village, where two villagers and the scrimshander are drawn waist
// deep in the roots of the tree line; three are signposts at (2,1), the cell
// directly under the top-left tree of a coast screen; the rest are enemies.
//
// ENEMIES ARE LEFT ALONE. One walks out of the cell in the first second and a
// spawn point is not a place anyone stands. Everything static is moved: an NPC,
// a sign, a trader, a pickup and a chest are all things a player walks up to
// and reads, and a thing you read should not be in a bush.
//
// The destination is the nearest cell that is not overhung, is walkable at some
// tide, and is not already occupied — searched DOWNWARD FIRST for the reason
// check-placement.mjs already records: everything in this world stands BELOW
// the thing it is next to, and a ring that tries up first walks a signpost into
// the seam corridor along a screen's top row, which is the way north.
//
// Usage: node tools/oneshot/unshade-entities.mjs [--dry]
import { readFileSync, writeFileSync } from 'node:fs';
import { installData } from '../../src/data/index.js';
import { MAPS, getRoom } from '../../src/world/maps.js';
import { F } from '../../src/world/tileset.js';
import { tileWalkable, ROUTE_AVOID } from '../lib/collision.mjs';

installData();
const DRY = process.argv.includes('--dry');
// --avoid=overworld/0,4,7:2,5;... — cells a previous run's CHECKERS rejected.
// The openness rule below is a proxy for "this is a square, not a passage" and
// a proxy is not a proof: `check-towns` floods each town ON FOOT at all three
// levels and is the authority on what severs a screen. When it names a cell,
// it goes here and the tool is run again. Two passes, and the second one is the
// one that ships.
const AVOID = new Set(((process.argv.find(a => a.startsWith('--avoid=')) || '').split('=')[1] || '')
  .split(';').filter(Boolean));

// Static things a player walks up to whose position is nobody's decision but
// the tile's — a signpost, a dropped rupee, a chest.
//
// PEOPLE ARE NOT ON THIS LIST, and that is the whole finding of the first cut.
// An NPC stands beside the thing it belongs to: the scrimshander is next to his
// own shack, a shopkeeper is outside her shop, and the village square's rows are
// two buildings, two lanes and one thoroughfare — so "the nearest cell that is
// not overhung" put the scrimshander in the middle of the only east-west route
// through the village and `test.mjs` immediately reported that walking west no
// longer leaves the screen. Moving a person is a composition decision and it
// wants an eye. They are listed at the end instead.
const STATIC = new Set(['sign', 'pickup', 'chest', 'essence', 'torch']);
const PEOPLE = new Set(['npc', 'trader', 'giver', 'scrimshander', 'makuTree']);
const CAPS = { jumping: false, swim: false, cutting: false };

const moves = [];
const people = [];

for (const [mapId, m] of MAPS) {
  for (const [key, def] of Object.entries(m.roomDefs)) {
    if (!def.entities || !def.entities.length) continue;
    const [floor, rx, ry] = key.split(',').map(Number);
    const room = getRoom(mapId, floor, rx, ry);
    if (!room) continue;

    // Which cells does a 32x32 object paint over that are not its own?
    const covered = new Set();
    for (let by = 0; by < room.th; by += 2) {
      for (let bx = 0; bx < room.tw; bx += 2) {
        let q = null;
        for (const [ox, oy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
          const d = room.tile(bx + ox, by + oy, 1);
          if (d.quad || d.big) { q = d.quad || d.big; break; }
        }
        if (!q) continue;
        for (const [ox, oy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
          const x = bx + ox, y = by + oy;
          const d = room.tile(x, y, 1);
          if ((d.quad || d.big) === q) continue;
          if (room.quadMayCover(x, y, 1, q)) covered.add(`${x},${y}`);
        }
      }
    }
    if (!covered.size) continue;

    // A DOORWAY AND THE TILE YOU STAND ON TO USE IT. A solid entity in either
    // is a shop nobody can enter: the first cut put a villager at 6,5, directly
    // below Tidewatch Village's shop door at 6,4, and `check-towns` did not
    // notice because it floods TILES and an NPC is an entity. Two replays and a
    // test.mjs assertion did — the shop-door replay simply stopped changing
    // rooms.
    const doorway = new Set();
    for (const w of def.warps || []) {
      doorway.add(`${w.x},${w.y}`);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        doorway.add(`${w.x + dx},${w.y + dy}`);
      }
    }
    for (let y = 0; y < room.th; y++) for (let x = 0; x < room.tw; x++) {
      if (!(room.tile(x, y, 1).flags & F.WARP)) continue;
      doorway.add(`${x},${y}`);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        doorway.add(`${x + dx},${y + dy}`);
      }
    }

    const taken = new Set(def.entities.map((e) => {
      const [, x, y] = Array.isArray(e) ? e : [e.t, e.x, e.y];
      return `${x},${y}`;
    }));

    def.entities.forEach((e, i) => {
      const [type, ex, ey] = Array.isArray(e) ? e : [e.t, e.x, e.y];
      if (PEOPLE.has(type) && covered.has(`${ex},${ey}`)) {
        people.push(`${mapId}/${key} ${type} at ${ex},${ey}`);
      }
      if (!STATIC.has(type)) return;
      if (!covered.has(`${ex},${ey}`)) return;
      // Rings outward, down first, then sideways, then up.
      let dest = null;
      for (let r = 1; r <= 6 && !dest; r++) {
        const ring = [];
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) === r) ring.push([dx, dy]);
          }
        }
        ring.sort((a, b) => (b[1] - a[1]) || (Math.abs(a[0]) - Math.abs(b[0])) || (a[0] - b[0]));
        for (const [dx, dy] of ring) {
          const nx = ex + dx, ny = ey + dy;
          if (nx < 0 || ny < 0 || nx >= room.tw || ny >= room.th) continue;
          // NOT ON THE OUTER RING. A screen's border row and column are the
          // seam corridors — the tiles a player walks through to reach the next
          // screen — and a solid NPC or signpost parked in one is a wall across
          // the way out. The first cut put a villager on the village's bottom
          // row and a sign in a screen's western seam.
          if (nx === 0 || ny === 0 || nx === room.tw - 1 || ny === room.th - 1) continue;
          if (covered.has(`${nx},${ny}`) || taken.has(`${nx},${ny}`)) continue;
          if (AVOID.has(`${mapId}/${key}:${nx},${ny}`)) continue;
          if (doorway.has(`${nx},${ny}`)) continue;
          // Walkable at SOME tide, which is the same bar check-placement sets:
          // a pickup on a sandbar is standing on dry land at low water.
          if (![0, 1, 2].some((t) => tileWalkable(room, nx, ny, t, CAPS, ROUTE_AVOID))) continue;
          // AND IN THE OPEN, not in a corridor. A solid entity dropped into the
          // one row that crosses a town screen severs it — CLAUDE.md's own trap
          // about the town kit, and the first cut of this tool walked the
          // scrimshander, a villager and a signpost straight into three of
          // them, which `check-towns` reported as three pinches. Requiring the
          // destination to keep at least three walkable neighbours ON FOOT at
          // every level is a cheap proxy for "this is a square, not a passage",
          // and check-towns is still the thing that proves it.
          const openness = Math.min(...[0, 1, 2].map((t) =>
            [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([ax, ay]) => {
              const px = nx + ax, py = ny + ay;
              return px >= 0 && py >= 0 && px < room.tw && py < room.th
                && tileWalkable(room, px, py, t, CAPS, ROUTE_AVOID);
            }).length));
          if (openness < 3) continue;
          dest = [nx, ny];
          break;
        }
      }
      if (!dest) { console.log(`  ${mapId}/${key} ${type} at ${ex},${ey}: nowhere clear`); return; }
      taken.delete(`${ex},${ey}`);
      taken.add(`${dest[0]},${dest[1]}`);
      moves.push({ mapId, key, i, type, from: [ex, ey], to: dest });
    });
  }
}

console.log(`${moves.length} placed objects are standing in an overhang`);
for (const mv of moves) {
  console.log(`  ${mv.mapId}/${mv.key} ${mv.type} ${mv.from.join(',')} -> ${mv.to.join(',')}`);
}
console.log(`\n${people.length} PEOPLE are standing in one, and are left where they are:`);
for (const p of people) console.log(`  ${p}`);
if (DRY) process.exit(0);

// ---- write it back --------------------------------------------------------
// Located by room block and then by the entity's own type-and-coordinates,
// required to match exactly once inside that block.
const FILES = ['src/data/overworld.js', 'src/data/dungeons-a.js', 'src/data/dungeons-b.js'];
const src = new Map(FILES.map((f) => [f, readFileSync(f, 'utf8')]));

function spans(text, key) {
  const out = [];
  const needle = `'${key}': {`;
  for (let i = text.indexOf(needle); i >= 0; i = text.indexOf(needle, i + 1)) {
    const bol = text.lastIndexOf('\n', i) + 1;
    const indent = text.slice(bol, i);
    const j = text.indexOf(`\n${indent}},`, i);
    out.push([i, j < 0 ? text.length : j]);
  }
  return out;
}

let done = 0;
for (const mv of moves) {
  const re = new RegExp(`\\['${mv.type}',\\s*${mv.from[0]},\\s*${mv.from[1]}(?=[,\\]])`, 'g');
  const hits = [];
  for (const [file, text] of src) {
    for (const [a, b] of spans(text, mv.key)) {
      const n = (text.slice(a, b).match(re) || []).length;
      if (n) hits.push({ file, a, b, n });
    }
  }
  const total = hits.reduce((s, h) => s + h.n, 0);
  if (total !== 1) throw new Error(`${mv.mapId}/${mv.key} ${mv.type} ${mv.from}: ${total} matches`);
  const { file, a, b } = hits[0];
  const text = src.get(file);
  const body = text.slice(a, b).replace(re, `['${mv.type}', ${mv.to[0]}, ${mv.to[1]}`);
  src.set(file, text.slice(0, a) + body + text.slice(b));
  done++;
}
for (const [f, t] of src) writeFileSync(f, t);
console.log(`moved ${done} of ${moves.length}`);
