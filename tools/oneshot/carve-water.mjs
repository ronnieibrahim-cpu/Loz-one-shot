// Give Thalassia's INTERIOR a sea — creeks that run inland from the coast, and
// a strand around every pool that was already there.
//
// f5f4604 gave the world a coast. Counted with the engine's own flags the rim's
// 40 screens are 22.6% water at LOW and 41.9% at HIGH, while the 80 interior
// screens are 2.2% and 7.7% — a dry continent with a wet border, in a game
// about the tide. Sixteen interior screens hold no water at any level at all.
//
// TWO PASSES, BOTH IN SANDBAR ('1' in every legend: dry at LOW, wading at MID,
// deep at HIGH). A tide tile is the only safe way to add water, because every
// flood in the checker table counts a tile passable if it is walkable at ANY
// level, and `check-overworld`'s field flood models the conch honestly — you
// may change level only where the tile you are standing on survives the change.
// So a creek of sandbar changes what the world LOOKS like without changing
// where a player can get to.
//
//   1. STRAND. Plain ground orthogonally touching water becomes sandbar, twice
//      over, so every pool inland gets the same two-tile shoreline the rim got.
//   2. CREEKS. From each interior screen with no water in reach, the shortest
//      path of plain ground to water already on the map is painted CHANNEL
//      ('5'), which is wadeable at LOW and deep above it — the one tide tile
//      that is wet at every level, so the interior gains water at low water
//      too rather than only when the sea comes up. A creek is therefore a
//      crossing you take at low tide and swim at high, which is the whole
//      premise of the game stated in terrain.
//      Paths cross screen seams freely, which is what makes them read as one
//      drainage running down to the coast rather than as puddles.
//
// WHAT IS NEVER PAINTED, and why each one cost somebody a session:
//   * anything that is not plain ground — cliffs, trees, bushes, rocks, posts,
//     ledges, cave mouths, dungeon gates, region gates, dig spots, existing
//     tide tiles;
//   * a tile within one of a LEDGE. A ledge must land dry at every tide (S13),
//     and a ledge is solid from three sides, so water beside one is a trap;
//   * a tile within one of a CAVE MOUTH, a dungeon gate or a WARP — art over a
//     doorway is the fault the tree pass already paid for once;
//   * a tile an ENTITY is standing on, or next to. Drowning a signpost is
//     exactly what tools/check-placement.mjs was written to catch;
//   * anything in a TOWN. `check-towns` floods ON FOOT at all three levels by
//     design, and a sandbar is deep at HIGH, so one painted tile in a town is a
//     failure the moment it lands.
//
// Usage: node tools/oneshot/carve-water.mjs [--dry] [--max=N]
import { readFileSync, writeFileSync } from 'node:fs';
import { installData } from '../../src/data/index.js';
import { MAPS } from '../../src/world/maps.js';

installData();
const DRY = process.argv.includes('--dry');
const MAX_PER_SCREEN = Number((process.argv.find(a => a.startsWith('--max=')) || '=10').split('=')[1]);
const STRAND_ROUNDS = Number((process.argv.find(a => a.startsWith('--strand=')) || '=2').split('=')[1]);

const W = 12, H = 10, RW = 10, RH = 8;
const m = MAPS.get('overworld');

// Plain ground in every legend that the overworld uses. Deliberately a short
// allow-list rather than a deny-list: a character this does not know about is
// left alone, which is the safe direction.
const GROUND = new Set(['g', 'G', 'f', 'v', '.', ',', ':', 'd', 'm', 'R', 'r']);
// Characters that already carry water at some level. Digits are tide tiles by
// the project's own convention; these are the ones that are ever wet.
const WET = new Set(['~', '=', '*', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '!', 'N', 'S', 'E', 'W']);
// Things a creek must keep its distance from.
const KEEPOUT = new Set(['_', '"', '>', '<', 'C', 'c', 'D', '/', 'K', 'J', 'M', 'X', 'V', 'x']);

const key = (rx, ry) => `0,${rx},${ry}`;
const grid = new Map();      // key -> array of 10-char arrays
const original = new Map();  // key -> the room's grid as it was on disk
const legend = new Map();
const blocked = new Map();   // key -> Set of "x,y" that must never be painted

for (let ry = 0; ry < H; ry++) for (let rx = 0; rx < W; rx++) {
  const d = m.roomDefs[key(rx, ry)];
  grid.set(key(rx, ry), d.map.map(r => r.split('')));
  original.set(key(rx, ry), d.map.slice());
  legend.set(key(rx, ry), d.legend || m.legend);
  const b = new Set();
  const mark = (x, y, r = 1) => {
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) b.add(`${x + i},${y + j}`);
  };
  for (const e of d.entities || []) {
    const [, ex, ey] = Array.isArray(e) ? e : [e.t, e.x, e.y];
    mark(ex, ey);
  }
  for (const wp of d.warps || []) mark(wp.x, wp.y);
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
    if (KEEPOUT.has(d.map[y][x])) mark(x, y);
  }
  blocked.set(key(rx, ry), b);
}

// EVERY town legend, not just 'town'. Sandpiper Row is `townDunes` and the
// first cut only knew the one name, so it carved a channel through a town and
// `check-towns` — which floods ON FOOT at all three levels by design — cut the
// screen in half at HIGH. The four town keys are listed as well, so a town that
// stops declaring a town legend does not quietly become paintable.
const TOWN_LEGENDS = new Set(['town', 'townDunes']);
const TOWN = new Set(['0,4,7', '0,4,8', '0,5,8', '0,9,8']);
for (let ry = 0; ry < H; ry++) for (let rx = 0; rx < W; rx++) {
  if (TOWN_LEGENDS.has(legend.get(key(rx, ry)))) TOWN.add(key(rx, ry));
}

const paintable = (rx, ry, x, y) => {
  const k = key(rx, ry);
  if (TOWN.has(k)) return false;
  if (blocked.get(k).has(`${x},${y}`)) return false;
  return GROUND.has(grid.get(k)[y][x]);
};
const wet = (rx, ry, x, y) => WET.has(grid.get(key(rx, ry))[y][x]);
const rim = (rx, ry) => rx === 0 || ry === 0 || rx === W - 1 || ry === H - 1;

let painted = 0;
const perScreen = new Map();
const mine = new Map();      // "rx,ry,x,y" -> the character that was there before
// A per-screen budget, so no screen becomes a lake. The bank pass gets its own
// small allowance on top: it runs last, and on a screen where the creek spent
// the whole budget the creek came out with no shoreline at all — deep water
// straight against dry salt, which is the one thing the coast pass was for.
let capBonus = 0;
function paint(rx, ry, x, y, ch) {
  const k = key(rx, ry);
  const n = perScreen.get(k) || 0;
  if (n >= MAX_PER_SCREEN + capBonus) return false;
  const id = `${rx},${ry},${x},${y}`;
  if (!mine.has(id)) mine.set(id, grid.get(k)[y][x]);
  grid.get(k)[y][x] = ch;
  perScreen.set(k, n + 1);
  painted++;
  return true;
}
function unpaint(rx, ry, x, y) {
  const id = `${rx},${ry},${x},${y}`;
  if (!mine.has(id)) return;
  grid.get(key(rx, ry))[y][x] = mine.get(id);
  mine.delete(id);
  painted--;
}

// ---- pass 1: the strand round every pool already inland -------------------
// Recomputed from a snapshot each round so a round cannot chase its own output
// across the whole screen.
function strand(rounds) {
  for (let round = 0; round < rounds; round++) {
    const todo = [];
    for (let ry = 1; ry < H - 1; ry++) for (let rx = 1; rx < W - 1; rx++) {
      for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
        if (!paintable(rx, ry, x, y)) continue;
        const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
          const nx = x + dx, ny = y + dy;
          return nx >= 0 && ny >= 0 && nx < RW && ny < RH && wet(rx, ry, nx, ny);
        });
        if (near) todo.push([rx, ry, x, y]);
      }
    }
    for (const [rx, ry, x, y] of todo) paint(rx, ry, x, y, '1');
  }
}
strand(STRAND_ROUNDS);
const afterStrand = painted;

// ---- pass 2: creeks -------------------------------------------------------
// One global BFS over all 9600 tiles, seeded from every wet tile in the world,
// walking only through paintable ground. `from` records the step that reached
// each tile, so the path back to the sea is a walk up the tree.
function bfsFromWater() {
  const from = new Map();
  const q = [];
  for (let ry = 0; ry < H; ry++) for (let rx = 0; rx < W; rx++) {
    for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
      if (wet(rx, ry, x, y)) { const k = `${rx},${ry},${x},${y}`; from.set(k, null); q.push([rx, ry, x, y]); }
    }
  }
  for (let head = 0; head < q.length; head++) {
    const [rx, ry, x, y] = q[head];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      let nx = x + dx, ny = y + dy, nrx = rx, nry = ry;
      if (nx < 0) { nrx--; nx = RW - 1; } else if (nx >= RW) { nrx++; nx = 0; }
      if (ny < 0) { nry--; ny = RH - 1; } else if (ny >= RH) { nry++; ny = 0; }
      if (nrx < 0 || nry < 0 || nrx >= W || nry >= H) continue;
      const k = `${nrx},${nry},${nx},${ny}`;
      if (from.has(k)) continue;
      if (!paintable(nrx, nry, nx, ny)) continue;
      from.set(k, [rx, ry, x, y]);
      q.push([nrx, nry, nx, ny]);
    }
  }
  return from;
}

// Which interior screens still have no water of their own? Those are the ones
// a creek is for. Take the tile of each that is FURTHEST from the sea (the
// deepest point of the screen's own dry ground) as the creek's head, so the
// channel runs the whole way in rather than clipping a corner.
const dryScreens = [];
for (let ry = 1; ry < H - 1; ry++) for (let rx = 1; rx < W - 1; rx++) {
  let any = false;
  for (let y = 0; y < RH && !any; y++) for (let x = 0; x < RW; x++) if (wet(rx, ry, x, y)) { any = true; break; }
  if (!any && !TOWN.has(key(rx, ry))) dryScreens.push([rx, ry]);
}

let creeks = 0;
for (const [rx, ry] of dryScreens) {
  const from = bfsFromWater();
  let head = null, best = -1;
  // Depth is the BFS distance, which needs recomputing per screen because the
  // previous creek changed the water. Walk the chain to measure it.
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
    const k = `${rx},${ry},${x},${y}`;
    if (!from.has(k) || from.get(k) === null) continue;
    let n = 0, cur = from.get(k);
    while (cur) { n++; cur = from.get(`${cur[0]},${cur[1]},${cur[2]},${cur[3]}`); }
    if (n > best) { best = n; head = [rx, ry, x, y]; }
  }
  if (!head) { console.log(`  ${rx},${ry}: no route to water through open ground`); continue; }
  let cur = head, n = 0;
  while (cur) {
    if (!wet(cur[0], cur[1], cur[2], cur[3])) { if (!paint(cur[0], cur[1], cur[2], cur[3], '5')) break; n++; }
    cur = from.get(`${cur[0]},${cur[1]},${cur[2]},${cur[3]}`);
  }
  creeks++;
  console.log(`  ${rx},${ry}: creek of ${n} tiles to the sea`);
}

// ---- pass 2b: banks -------------------------------------------------------
// A CREEK WITH NO BANK IS A CANAL. The first cut ran the strand before the
// creeks, so every creek came out as a one-tile rectangle of bright water with
// a hard edge against dry salt or grass — legible as a channel and readable as
// pasted on. One more strand round gives each creek the same shoreline the
// pools already had, and it is the shoreline that makes it look like water
// found its way there rather than like somebody drew a line.
const beforeBanks = painted;
capBonus = 4;
strand(1);
console.log(`banks: ${painted - beforeBanks} tiles of shoreline along the new creeks`);

// ---- pass 3: seams --------------------------------------------------------
// A SCREEN EDGE IS SHARED. `check-overworld` compares WALKABILITY tile for tile
// across every seam at every tide level, so a converted edge tile whose partner
// on the next screen still reads differently is a hole the player walks into.
// S13 hit this doing the coast; it is the same rule here.
//
// Reconciled by asking the ENGINE rather than by matching characters: a first
// cut paired "did I paint this" against "did I paint that", which is not the
// question — a tile painted next to an existing tide tile can disagree with it
// without either being newly painted. `tileWalkable` (tools/lib/collision.mjs)
// is `Room.solidAt`, so this is the same rule check-overworld will apply.
const { getRoom, resetRooms } = await import('../../src/world/maps.js');
const { tileWalkable, ROUTE_AVOID } = await import('../lib/collision.mjs');
const CAPS = { jumping: false, swim: false, cutting: false };
// check-overworld's own `walkableAt`, minus the item mask (nothing here is
// holding an item). A tile behind a story flag is shut, and a checker that
// forgets that disagrees with the one whose verdict actually matters.
const walkableAt = (room, x, y, t) => {
  const d = room.tile(x, y, t);
  if (d && d.openFlag) return false;
  return tileWalkable(room, x, y, t, CAPS, ROUTE_AVOID);
};

function applyGrids() {
  for (let ry = 0; ry < H; ry++) for (let rx = 0; rx < W; rx++) {
    m.roomDefs[key(rx, ry)].map = grid.get(key(rx, ry)).map(r => r.join(''));
  }
  resetRooms();
}

let reverted = 0;
for (let pass = 0; pass < 12; pass++) {
  applyGrids();
  const rooms = new Map();
  for (let ry = 0; ry < H; ry++) for (let rx = 0; rx < W; rx++) {
    rooms.set(key(rx, ry), getRoom('overworld', 0, rx, ry));
  }
  const bad = [];
  for (let ry = 0; ry < H; ry++) for (let rx = 0; rx < W; rx++) {
    for (const [dx, dy] of [[1, 0], [0, 1]]) {
      const bx = rx + dx, by = ry + dy;
      if (bx >= W || by >= H) continue;
      const ra = rooms.get(key(rx, ry)), rb = rooms.get(key(bx, by));
      const n = dx ? RH : RW;
      for (let i = 0; i < n; i++) {
        const ax = dx ? RW - 1 : i, ay = dx ? i : RH - 1;
        const nx = dx ? 0 : i, ny = dx ? i : 0;
        for (const t of [0, 1, 2]) {
          if (walkableAt(ra, ax, ay, t) !== walkableAt(rb, nx, ny, t)) {
            bad.push([rx, ry, ax, ay, bx, by, nx, ny]);
            break;
          }
        }
      }
    }
  }
  if (!bad.length) { console.log(`seams: clean after ${pass} reconciliation pass(es), ${reverted} tile(s) put back`); break; }
  let did = 0;
  for (const [arx, ary, ax, ay, brx, bry, bx2, by2] of bad) {
    const A = [arx, ary, ax, ay], B = [brx, bry, bx2, by2];
    const ma = mine.has(A.join(',')), mb = mine.has(B.join(','));
    // First choice is always to carry the water ACROSS the seam rather than to
    // pull it back: a creek that crosses a screen boundary is the whole point
    // of a creek, and reverting both halves of one leaves a puddle.
    if (ma !== mb) {
      const [src, dst] = ma ? [A, B] : [B, A];
      if (paintable(dst[0], dst[1], dst[2], dst[3])
        && paint(dst[0], dst[1], dst[2], dst[3], grid.get(key(src[0], src[1]))[src[3]][src[2]])) {
        did++; continue;
      }
    }
    for (const t of [A, B]) {
      if (mine.has(t.join(','))) { unpaint(t[0], t[1], t[2], t[3]); reverted++; did++; }
    }
  }
  if (!did) {
    console.log(`seams: ${bad.length} mismatch(es) NOT of this pass's making — left alone`);
    for (const b of bad.slice(0, 6)) console.log('   ', JSON.stringify(b), 'mineA=', mine.has([b[0],b[1],b[2],b[3]].join(',')), 'mineB=', mine.has([b[4],b[5],b[6],b[7]].join(',')));
    break;
  }
}
applyGrids();

console.log(`\nstrand ${afterStrand} tiles, creeks ${painted - afterStrand} tiles over ${creeks} screens`
  + `, ${painted} in total`);

if (DRY) process.exit(0);

// ---- write it back --------------------------------------------------------
const FILE = 'src/data/overworld.js';
let text = readFileSync(FILE, 'utf8');
let rewritten = 0;
for (let ry = 0; ry < H; ry++) for (let rx = 0; rx < W; rx++) {
  const k = key(rx, ry);
  const before = original.get(k);
  const after = grid.get(k).map(r => r.join(''));
  if (before.every((r, i) => r === after[i])) continue;
  const i = text.indexOf(`'${k}': {`);
  if (i < 0) throw new Error(`no room block for ${k}`);
  const j = text.indexOf('\n  },', i);
  const body = text.slice(i, j);
  // POSITIONAL, NOT BY CONTENT. A first cut replaced each changed row by
  // searching the block for its old text — and a screen with two identical
  // rows (a border of trees, a run of open sand) then had the FIRST one
  // rewritten whichever row had actually changed. The rows came out shuffled,
  // the tool reported its own grids clean, and check-overworld disagreed with
  // it about seams it had already reconciled.
  const ms = body.indexOf('map: [');
  if (ms < 0) throw new Error(`${k}: no map array`);
  const me = body.indexOf('],', ms);
  const head = body.slice(0, ms), tail = body.slice(me);
  const seg = body.slice(ms, me);
  let row = 0;
  const nseg = seg.replace(/'[^']*'/g, (lit) => (row < RH ? `'${after[row++]}'` : lit));
  if (row !== RH) throw new Error(`${k}: found ${row} rows in its map array`);
  const nb = head + nseg + tail;
  text = text.slice(0, i) + nb + text.slice(j);
  rewritten++;
}
writeFileSync(FILE, text);
console.log(`rewrote ${rewritten} screens in ${FILE}`);
