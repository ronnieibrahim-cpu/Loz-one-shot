// Town checker. Plain Node, no browser.
//
//   node tools/check-towns.mjs
//
// A TOWN IS A MAZE OF SOLID TILES, which makes it the worst case for the trap
// at the top of CLAUDE.md: a solid tile can sever a screen while rendering
// perfectly and validating clean. A building is nine of them at once, dropped
// into a screen that four neighbours walk into, so "it looked right in the
// shot" is worth nothing here.
//
// What this proves, per screen that uses a town legend:
//
//   1. every building is a legal footprint — checked by construction, since
//      `Room.expandBlocks` throws on a footprint that is not exactly the
//      block's size, and constructing every town screen is how that is run;
//   2. THE SCREEN STILL WORKS AT EVERY TIDE LEVEL: every edge the player can
//      walk in through, and every door, is reachable from every other one, at
//      LOW and MID and HIGH. Not "the screen has a route" — a route from each
//      way in to each way in, three times. A shop you cannot reach at high
//      water is a bug in a tide game and in no other kind;
//   3. every door is a door: every tile carrying F.WARP is named by the room's
//      `warps` list, and every warp in the room stands on a F.WARP tile. Both
//      directions, because the two failures are different — a doorway with no
//      warp is a building you walk into and nothing happens, and a warp with
//      no doorway is a hole in the grass that swallows you;
//   4. every door LEADS somewhere and COMES BACK: the target map and room
//      exist, and that room has a warp back to this screen, landing on a tile
//      you can stand on that is NOT the doorway itself (which would bounce the
//      player straight back through it);
//   6. THE SCREEN ANSWERS THE CONCH: at least one of its cells draws a
//      different tile at HIGH than at LOW, and every cell that does is still
//      walkable at all three levels or is off every route (which clause 2
//      settles, since it floods on foot at each level in turn). Tidewatch
//      shipped as a dry screen — identical at LOW, MID and HIGH, on the screen
//      the player sees more than any other, in a game whose whole subject is
//      the water. Nothing caught it because nothing was looking: a town that
//      ignores the tide validates, walks, renders and reads as a bug only to a
//      person. This is that person, written down;
//
//   5. nothing is standing inside a wall: every entity in the screen is on a
//      tile it can occupy at some tide level. Rebuilding a screen moves the
//      ground out from under the NPCs that were on it, and an NPC inside a
//      building is invisible and unreachable rather than obviously wrong.
//
// It also sweeps every map for a room that uses a town legend and is not in
// TOWNS below — the same discipline as check-anchor.mjs asserting no anchor
// room is outside D1. A town screen nobody declared is a town screen nobody
// proved.

import { installData } from '../src/data/index.js';
import { MAPS, getRoom } from '../src/world/maps.js';
import { F } from '../src/world/tileset.js';
import { BLOCKS } from '../src/world/tileset.js';

installData();

// The settlements, and the legend each is built in. Adding a town means adding
// it here; the sweep at the end fails if a screen uses a town legend and is
// not listed.
const TOWNS = [
  { key: '0,4,7', name: 'Tidewatch Village' },
  { key: '0,4,8', name: 'Village Shore' },
  { key: '0,5,8', name: 'Driftwood Strand' },
  { key: '0,9,8', name: 'Sandpiper Row' },
];
const TOWN_LEGENDS = ['town', 'townDunes'];

const W = 10, H = 8;
let pass = 0; const fail = [];
const check = (n, c, d) => c ? pass++ : (fail.push(n), console.log(`  FAIL ${n}${d ? ' — ' + d : ''}`));

/**
 * Can the player occupy this tile at this level?
 *
 * `mask: 0` is the whole subtlety. A doorway carries F.SOLID *and* mask 0 —
 * the flags say "a wall" so nothing spawns in it or is thrown through it, and
 * the mask says every quadrant is clear, which is what `Room.solidAt` reads
 * and therefore what the player's feet obey. Reading the flag alone would call
 * every door in every town a wall, and the flood would report a shop nobody
 * can enter in a village that plays fine.
 */
function walkable(room, x, y, tide) {
  const d = room.tile(x, y, tide);
  if (d.flags & F.VOID) return false;
  if (d.flags & F.SOLID) return d.mask === 0;
  return !(d.flags & (F.PIT | F.HAZARD | F.LEDGE | F.JUMPABLE | F.DEEP));
}
// A TOWN IS WALKED, NOT SWUM, and that is the strong half of the claim below.
//
// The flood could grant swimming — the overworld checker's does, because the
// player eventually owns the Kelp-Soled Cleats and every stretch of ocean
// stops being a wall. A town must not need them. Tidewatch is the screen the
// game starts three steps from, and Sandpiper Row sits on the road to the
// first dungeon; a village whose east half is reachable only by swimming at
// HIGH is a village the player of that hour cannot cross. So this is the same
// flood minus F.DEEP, and it is what turns "the screen has a route" into "the
// screen has a route on foot at every sea".
const passable = walkable;

function flood(room, tide, from) {
  const seen = new Set([`${from[0]},${from[1]}`]);
  const q = [from];
  while (q.length) {
    const [x, y] = q.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const k = `${nx},${ny}`;
      if (seen.has(k) || !passable(room, nx, ny, tide)) continue;
      seen.add(k); q.push([nx, ny]);
    }
  }
  return seen;
}

const overworld = MAPS.get('overworld');

for (const town of TOWNS) {
  const [floor, rx, ry] = town.key.split(',').map(Number);
  const def = overworld.roomDefs[town.key];
  if (!def) { check(`${town.name} exists`, false); continue; }
  // 1. Constructing the screen runs the block expansion, which is what proves
  //    every footprint. `getRoom` throws with the room's own key if one is
  //    short, so this assertion is the footprint assertion.
  let room = null;
  try { room = getRoom('overworld', floor, rx, ry); } catch (e) {
    check(`${town.name}: every building footprint is legal`, false, e.message);
    continue;
  }
  check(`${town.name}: every building footprint is legal`, true);

  const blocksHere = new Set();
  for (const [ch, t] of Object.entries(room.legend)) {
    if (typeof t === 'string' && t.startsWith('block:') && def.map.some(r => r.includes(ch))) {
      blocksHere.add(t.slice(6));
    }
  }
  check(`${town.name}: is built out of blocks at all`, blocksHere.size > 0,
    'no legend character in the grid names a block — this is not a town, it is a field');

  // 3. Doors are doors, both ways.
  const doorTiles = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (room.tile(x, y, 1).flags & F.WARP) doorTiles.push([x, y]);
  }
  const warps = def.warps || [];
  const unwarped = doorTiles.filter(([x, y]) => !warps.some(w => w.x === x && w.y === y));
  check(`${town.name}: every doorway has a warp`, unwarped.length === 0,
    unwarped.map(d => d.join(',')).join(' '));
  const undoored = warps.filter(w => !doorTiles.some(([x, y]) => x === w.x && y === w.y));
  check(`${town.name}: every warp stands on a doorway`, undoored.length === 0,
    undoored.map(w => `${w.x},${w.y}`).join(' '));

  // 4. Each door leads somewhere with a way back.
  for (const w of warps) {
    const to = w.to;
    const tm = MAPS.get(to.map);
    const label = `${town.name}: the door at ${w.x},${w.y} -> ${to.map}`;
    if (!tm) { check(`${label} exists`, false); continue; }
    const tkey = `${to.floor | 0},${to.rx},${to.ry}`;
    if (!tm.roomDefs[tkey]) { check(`${label} exists`, false, `no room ${tkey}`); continue; }
    check(`${label} exists`, true);
    const back = (tm.roomDefs[tkey].warps || []).filter(b =>
      b.to.map === 'overworld' && b.to.rx === rx && b.to.ry === ry);
    check(`${label} and back`, back.length > 0, 'the interior has no warp back to this screen');
    for (const b of back) {
      const bx = Math.floor((b.to.px ?? 0) / 16), by = Math.floor((b.to.py ?? 0) / 16);
      check(`${label}: comes back onto ground at ${bx},${by}`,
        bx >= 0 && by >= 0 && bx < W && by < H && walkable(room, bx, by, 1));
      // Landing ON the doorway would step straight back through it. The engine
      // has a `_warpLock` that survives exactly one frame of that; a return
      // position on the door is a coin flip, not a design.
      check(`${label}: does not come back onto the doorway itself`,
        !(bx === w.x && by === w.y));
    }
  }

  // 2. The screen still works, at every tide level.
  //
  // The ways in are the walkable tiles on the border ring — that is what a
  // neighbouring screen walks through — plus the square in front of every
  // door, which is where the player has to be able to get to.
  for (const tide of [0, 1, 2]) {
    const ways = [];
    for (let x = 0; x < W; x++) {
      if (walkable(room, x, 0, tide)) ways.push([x, 0]);
      if (walkable(room, x, H - 1, tide)) ways.push([x, H - 1]);
    }
    for (let y = 0; y < H; y++) {
      if (walkable(room, 0, y, tide)) ways.push([0, y]);
      if (walkable(room, W - 1, y, tide)) ways.push([W - 1, y]);
    }
    const doorsteps = doorTiles.map(([x, y]) => [x, y]);
    const targets = [...ways, ...doorsteps];
    if (!ways.length) { check(`${town.name}: has a way in at tide ${tide}`, false); continue; }
    const seen = flood(room, tide, ways[0]);
    const stranded = targets.filter(([x, y]) => !seen.has(`${x},${y}`));
    check(`${town.name}: every way in and every door reach each other at tide ${tide}`,
      stranded.length === 0,
      stranded.map(t => t.join(',')).join(' ') + ` (flooded from ${ways[0]})`);
  }

  // 6. The screen answers the conch.
  //
  // Tile NAMES, not pixels: `resolveTile` hands back the concrete tile a cell
  // becomes at a level, so "this cell is grass at LOW and shallow water at
  // HIGH" is a string comparison and needs no renderer. Counting the cells
  // rather than stopping at the first one makes the failure legible — a town
  // with one changing cell in a corner is technically green and not what this
  // is for, so the count is printed either way.
  const moved = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const lo = room.tile(x, y, 0).name, hi = room.tile(x, y, 2).name;
    if (lo !== hi) moved.push(`${x},${y}`);
  }
  check(`${town.name}: answers the conch — the screen is not the same at LOW and HIGH`,
    moved.length > 0, 'not one cell on this screen changes with the tide');
  if (moved.length) console.log(`    ${town.name}: ${moved.length} cell(s) change with the tide`);

  // 5. Nobody is standing in a wall.
  const buried = [];
  for (const e of (def.entities || [])) {
    const [type, x, y] = e;
    if (![0, 1, 2].some(t => walkable(room, x, y, t))) buried.push(`${type}@${x},${y}`);
  }
  check(`${town.name}: every entity is standing on ground`, buried.length === 0, buried.join(' '));
}

// --- the sweep -------------------------------------------------------------
const undeclared = [];
for (const m of MAPS.values()) {
  for (const [key, def] of Object.entries(m.roomDefs)) {
    const legend = def.legend || m.legend;
    if (!TOWN_LEGENDS.includes(legend)) continue;
    if (m.id !== 'overworld' || !TOWNS.some(t => t.key === key)) undeclared.push(`${m.id}/${key}`);
  }
}
check('no screen uses a town legend without being declared here', undeclared.length === 0,
  undeclared.join(' '));

// Every block the kit registers is placed somewhere, or it is art nobody can
// see. validate.mjs proves a legend can NAME each block; this proves a town
// actually uses one, which is the difference between a vocabulary and a place.
const placed = new Set();
for (const town of TOWNS) {
  const def = overworld.roomDefs[town.key];
  const room = getRoom('overworld', 0, ...town.key.split(',').slice(1).map(Number));
  for (const [ch, t] of Object.entries(room.legend)) {
    if (typeof t === 'string' && t.startsWith('block:') && def.map.some(r => r.includes(ch))) placed.add(t.slice(6));
  }
}
// Judged per BUILDING, not per ground variant. `bShop` and `bShopSand` are one
// extraction and one building standing on two different grounds, and requiring
// a sandy shop before there is a sandy town that wants one would be a checker
// commissioning content. The variants that are registered and unplaced are
// printed instead — they are a legend entry away from being usable, which
// validate.mjs already proves.
const base = (n) => n.replace(/(Sand)$/, '');
const bases = new Set([...BLOCKS.keys()].map(base));
const placedBases = new Set([...placed].map(base));
const unplaced = [...bases].filter(b => !placedBases.has(b));
check('every extracted building is standing in some town', unplaced.length === 0, unplaced.join(' '));
const spare = [...BLOCKS.keys()].filter(b => !placed.has(b));
if (spare.length) console.log(`  note: ${spare.length} ground variants registered and unplaced: ${spare.join(' ')}`);

console.log(`\n=== ${pass} passed, ${fail.length} failed ===`);
process.exit(fail.length ? 1 : 0);
