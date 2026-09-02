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
const legend = new Map();
const blocked = new Map();   // key -> Set of "x,y" that must never be painted

for (let ry = 0; ry < H; ry++) for (let rx = 0; rx < W; rx++) {
  const d = m.roomDefs[key(rx, ry)];
  grid.set(key(rx, ry), d.map.map(r => r.split('')));
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

const TOWN = new Set();
for (let ry = 0; ry < H; ry++) for (let rx = 0; rx < W; rx++) {
  if (legend.get(key(rx, ry)) === 'town') TOWN.add(key(rx, ry));
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
function paint(rx, ry, x, y, ch) {
  const k = key(rx, ry);
  const n = perScreen.get(k) || 0;
  if (n >= MAX_PER_SCREEN) return false;
  grid.get(k)[y][x] = ch;
  perScreen.set(k, n + 1);
  painted++;
  return true;
}

// ---- pass 1: the strand round every pool already inland -------------------
// Two rounds, recomputed from a snapshot each time so a round cannot chase its
// own output across the whole screen.
for (let round = 0; round < 2; round++) {
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

console.log(`\nstrand ${afterStrand} tiles, creeks ${painted - afterStrand} tiles over ${creeks} screens`
  + `, ${painted} in total`);

if (DRY) process.exit(0);

// ---- write it back --------------------------------------------------------
const FILE = 'src/data/overworld.js';
let text = readFileSync(FILE, 'utf8');
let rewritten = 0;
for (let ry = 0; ry < H; ry++) for (let rx = 0; rx < W; rx++) {
  const k = key(rx, ry);
  const before = m.roomDefs[k].map;
  const after = grid.get(k).map(r => r.join(''));
  if (before.every((r, i) => r === after[i])) continue;
  const i = text.indexOf(`'${k}': {`);
  if (i < 0) throw new Error(`no room block for ${k}`);
  const j = text.indexOf('\n  },', i);
  const body = text.slice(i, j);
  let nb = body;
  for (let row = 0; row < RH; row++) {
    if (before[row] === after[row]) continue;
    const needle = `'${before[row]}',`;
    const at = nb.indexOf(needle);
    if (at < 0) throw new Error(`${k} row ${row}: cannot find ${needle}`);
    nb = nb.slice(0, at) + `'${after[row]}',` + nb.slice(at + needle.length);
  }
  text = text.slice(0, i) + nb + text.slice(j);
  rewritten++;
}
writeFileSync(FILE, text);
console.log(`rewrote ${rewritten} screens in ${FILE}`);
