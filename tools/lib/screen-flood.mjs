// The on-foot cell flood over a map of 10x8 screens: the overworld and every
// interior (caves, houses). Lifted out of check-strands.mjs (S240) so the
// overworld strand baseline and check-placement's "every chest can be walked
// up to" clause for caves ask the SAME question and cannot drift apart — the
// dungeon side already shares tools/lib/dungeon-flood.mjs the same way.
//
// What it models, unchanged from check-strands:
//   - On foot. No swimming (the Cleats), no jumping, no cutting.
//   - Every gate held open (HEAVY, BOMBABLE, VANE, and every story gate and
//     keyhole): this asks whether the TERRAIN strands anything; a gate is
//     meant to strand things and check-overworld proves gates one at a time.
//   - The player controls the tide, so a tile is passable if any level allows.
//   - The base hop over a gap run shorter than GAP_HOP_MAX_SPAN on one axis.
//
// PASSABILITY IS NEVER RE-DERIVED HERE: tools/lib/collision.mjs asks the real
// `Room.solidAt` (CLAUDE.md, Hard rules).

import { MAPS, getRoom } from '../../src/world/maps.js';
import { F } from '../../src/world/tileset.js';
import { GAP_HOP_MAX_SPAN } from '../../src/data/feel.js';
import { tileWalkable, ROUTE_AVOID } from './collision.mjs';

export const SCREEN_W = 10, SCREEN_H = 8;
const W = SCREEN_W, H = SCREEN_H;

// Every gate held open: this is about terrain, not gates.
const openMask = F.HEAVY | F.BOMBABLE | F.VANE;
// Every story gate and keyhole held open (S154: the six dungeon keys).
const openStory = new Set(['makuOpenedKeep', 'openedD1', 'openedD2', 'openedD3', 'openedD4', 'openedD5', 'openedD6']);
const CAPS = { jumping: false, swim: false, cutting: false };

function walkableAt(room, x, y, t) {
  if (openMask && (room.flagsAt(x, y, t) & openMask)) return true;
  const d = room.tile(x, y, t);
  if (d && d.openFlag) return openStory.has(d.openFlag);
  return tileWalkable(room, x, y, t, CAPS, ROUTE_AVOID);
}

// A gap tile is crossable when the run containing it is shorter than
// GAP_HOP_MAX_SPAN along at least one axis, as check-overworld models it.
const isGap = (r, x, y) => !!(r.flagsAt(x, y, 1) & F.JUMPABLE);
function runLen(r, x, y, dx, dy) {
  let n = 1;
  for (let i = 1; ; i++) { const nx = x + dx * i, ny = y + dy * i; if (nx < 0 || ny < 0 || nx >= W || ny >= H || !isGap(r, nx, ny)) break; n++; }
  for (let i = 1; ; i++) { const nx = x - dx * i, ny = y - dy * i; if (nx < 0 || ny < 0 || nx >= W || ny >= H || !isGap(r, nx, ny)) break; n++; }
  return n;
}
const hoppable = (r, x, y) => isGap(r, x, y)
  && (runLen(r, x, y, 1, 0) < GAP_HOP_MAX_SPAN || runLen(r, x, y, 0, 1) < GAP_HOP_MAX_SPAN);
const passable = (r, x, y) => [0, 1, 2].some(t => walkableAt(r, x, y, t));
export const passableAt = (r, x, y) => passable(r, x, y) || hoppable(r, x, y);

export const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/** Every room of a screen map, built once, keyed `floor,rx,ry`. */
export function screenRooms(mapId) {
  const m = MAPS.get(mapId), rooms = new Map();
  for (const k of Object.keys(m.roomDefs)) {
    const [f, rx, ry] = k.split(',').map(Number);
    rooms.set(k, getRoom(mapId, f, rx, ry));
  }
  return rooms;
}

/** Where a step lands, crossing into the neighbouring screen; null at the rim. */
export function stepScreen(m, rk, x, y, dx, dy) {
  const [f, rx, ry] = rk.split(',').map(Number);
  const nx = x + dx, ny = y + dy;
  if (nx >= 0 && ny >= 0 && nx < W && ny < H) return [rk, nx, ny];
  const trk = `${f},${rx + (nx < 0 ? -1 : nx >= W ? 1 : 0)},${ry + (ny < 0 ? -1 : ny >= H ? 1 : 0)}`;
  if (!m.roomDefs[trk]) return null;
  return [trk, (nx + W) % W, (ny + H) % H];
}

/**
 * Flood on foot from `starts` (a list of [roomKey, x, y], each kept only if it
 * is passable). Returns the set of `roomKey:x,y` cells reached.
 */
export function floodScreens(mapId, starts, rooms = screenRooms(mapId)) {
  const m = MAPS.get(mapId);
  const seen = new Set(), q = [];
  for (const [rk, x, y] of starts) {
    const r = rooms.get(rk);
    if (!r || !passableAt(r, x, y)) continue;
    const k = `${rk}:${x},${y}`;
    if (!seen.has(k)) { seen.add(k); q.push([rk, x, y]); }
  }
  while (q.length) {
    const [rk, x, y] = q.pop();
    for (const [dx, dy] of DIRS) {
      const s = stepScreen(m, rk, x, y, dx, dy);
      if (!s) continue;
      const [trk, tx, ty] = s, tr = rooms.get(trk);
      if (!tr || !passableAt(tr, tx, ty)) continue;
      const k = `${trk}:${tx},${ty}`;
      if (seen.has(k)) continue;
      seen.add(k); q.push([trk, tx, ty]);
    }
  }
  return seen;
}

/** Every cell of a screen: the overworld's flood starts on all of Tidewatch's. */
export function allCells(rk) {
  const out = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) out.push([rk, x, y]);
  return out;
}

/**
 * The cells an interior is entered on: every doorway (a WARP tile at the
 * middle sea) in it. A cave's way in is its way out.
 */
export function doorCells(mapId, rooms = screenRooms(mapId)) {
  const out = [];
  for (const [rk, r] of rooms) {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (r.flagsAt(x, y, 1) & F.WARP) out.push([rk, x, y]);
    }
  }
  return out;
}
