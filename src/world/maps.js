// Map registry. A "map" is any addressable collection of rooms: the overworld,
// a dungeon (multi-floor), a cave, a house interior. Unifying them means the
// camera, room transitions and warps have exactly one code path.
//
// MAP DEFINITION FORMAT (contract for map data files):
//
//   {
//     id: 'd1',
//     kind: 'dungeon',            // 'overworld' | 'dungeon' | 'cave' | 'interior'
//     name: 'Tidewash Grotto',
//     w: 8, h: 8, floors: 2,
//     legend: 'grotto',           // default legend for rooms that omit one
//     music: 'dungeon1',
//     tint: 'cave',
//     scroll: false,              // true = slide between rooms, false = hard cut
//     rooms: {
//       '0,3,7': { map: [...], entities: [...], warps: [...] },   // 'floor,x,y'
//     },
//     dungeon: {                  // dungeons only
//       index: 1,
//       item: 'feather',
//       essence: 'tideEssence1',
//       boss: 'gohmaCrab',
//       bossRoom: '0,3,1',
//       entrance: { map: 'overworld', floor: 0, rx: 4, ry: 6, px: 80, py: 100 },
//     },
//   }

import { Room } from './room.js';
import { ROOM_W, ROOM_H } from '../core/screen.js';

export const MAPS = new Map();

export function registerMap(def) {
  const m = {
    id: def.id,
    kind: def.kind || 'overworld',
    name: def.name || def.id,
    w: def.w || 1, h: def.h || 1, floors: def.floors || 1,
    legend: def.legend || 'base',
    music: def.music || null,
    tint: def.tint || null,
    dark: !!def.dark,
    scroll: def.scroll !== false,
    dungeon: def.dungeon || null,
    roomDefs: def.rooms || {},
    _rooms: new Map(),
  };
  // P7.6: MULTI-SCREEN ROOMS ARE A DUNGEON FEATURE, STRUCTURALLY.
  //
  // The overworld is a grid of exactly one-screen rooms with a scroll on each
  // seam, and that is correct and is not changing. This is a throw rather than
  // a comment saying so, because "overworld rooms are 1x1" has to be a fact the
  // engine enforces and not a convention an author can forget. `kind` defaults
  // to 'overworld', so a map that declares no kind is covered too.
  if (m.kind === 'overworld') {
    for (const [key, def] of Object.entries(m.roomDefs)) {
      if (def && def.size) {
        throw new Error(`[maps] ${m.id}:${key} declares size ${JSON.stringify(def.size)}; `
          + 'only dungeon and interior rooms may span more than one screen');
      }
    }
  }
  MAPS.set(m.id, m);
  return m;
}

export function getMap(id) { return MAPS.get(id) || null; }

export function roomKey(floor, x, y) { return `${floor | 0},${x | 0},${y | 0}`; }

/** Instantiate (and memoise) a Room. Returns null if that cell is empty. */
export function getRoom(mapId, floor, x, y) {
  const m = MAPS.get(mapId);
  if (!m) return null;
  const key = roomKey(floor, x, y);
  let r = m._rooms.get(key);
  if (r) return r;
  const def = m.roomDefs[key];
  if (!def) return null;
  r = new Room(def, key, m);
  if (!r.music) r.music = m.music;
  if (!r.tint) r.tint = m.tint;
  if (m.dark && def.dark === undefined) r.dark = true;
  m._rooms.set(key, r);
  return r;
}

export function hasRoom(mapId, floor, x, y) {
  const m = MAPS.get(mapId);
  return !!(m && m.roomDefs[roomKey(floor, x, y)]);
}

/** Every room instance that has been created so far (for save/restore of state). */
export function liveRooms(mapId) {
  const m = MAPS.get(mapId);
  return m ? [...m._rooms.values()] : [];
}

/** Reset all instantiated rooms (used on new game / load). */
export function resetRooms() {
  for (const m of MAPS.values()) m._rooms.clear();
}

/** All dungeon maps in index order. */
export function dungeons() {
  return [...MAPS.values()].filter(m => m.kind === 'dungeon' && m.dungeon)
    .sort((a, b) => a.dungeon.index - b.dungeon.index);
}

/** A room def's span in screens, defaulting to one. Tolerant: validateMaps
 *  must be able to REPORT a bad size rather than throw on one. */
export function roomSpan(def) {
  const size = def && def.size;
  if (!size) return [1, 1];
  const [w, h] = Array.isArray(size) ? size : [size.w, size.h];
  return [Number(w) || 1, Number(h) || 1];
}

/**
 * Structural validation: every warp resolves, every grid matches its declared
 * size, and NO TWO ROOMS CLAIM THE SAME GRID CELL.
 */
export function validateMaps() {
  const problems = [];
  for (const m of MAPS.values()) {
    // P7.6 [A2]: which grid cell belongs to which room. Built per map per
    // floor BEFORE anything else, because a stranded-room report from a
    // connectivity checker is meaningless while two rooms are fighting over a
    // cell — you cannot tell which of them the walker was walking.
    const owner = new Map();          // "f,x,y" -> room key that covers it
    for (const [key, def] of Object.entries(m.roomDefs)) {
      const parts = key.split(',');
      if (parts.length !== 3 || parts.some(p => p === '' || isNaN(Number(p)))) continue;
      const [f, x, y] = parts.map(Number);
      const [sw, sh] = roomSpan(def);
      if (x + sw > m.w || y + sh > m.h) {
        problems.push(`${m.id}/${key}: a ${sw}x${sh} room starting there runs off the `
          + `${m.w}x${m.h} grid`);
      }
      for (let dy = 0; dy < sh; dy++) {
        for (let dx = 0; dx < sw; dx++) {
          const cell = `${f},${x + dx},${y + dy}`;
          const prev = owner.get(cell);
          if (prev !== undefined && prev !== key) {
            // HARD FAILURE. Two rooms answering to one cell is silent and
            // awful: getRoom returns whichever the Map happened to store, so
            // which room a door leads to depends on authoring order.
            problems.push(`${m.id}: rooms '${prev}' and '${key}' both claim cell ${cell}`);
          } else {
            owner.set(cell, key);
          }
        }
      }
    }

    for (const [key, def] of Object.entries(m.roomDefs)) {
      const parts = key.split(',');
      if (parts.length !== 3 || parts.some(p => p === '' || isNaN(Number(p)))) {
        problems.push(`${m.id}: bad room key '${key}' (expected 'floor,x,y')`);
        continue;
      }
      const [f, x, y] = parts.map(Number);
      if (f < 0 || f >= m.floors || x < 0 || x >= m.w || y < 0 || y >= m.h) {
        problems.push(`${m.id}: room '${key}' is outside the map bounds ${m.w}x${m.h}x${m.floors}`);
      }
      // The grid must match the DECLARED size exactly. This is what stops a
      // 3x1 room being authored as three 1x1 grids by accident: without it the
      // extra columns are silently read as ' ' and become void.
      const [sw, sh] = roomSpan(def);
      const wantRows = sh * ROOM_H, wantCols = sw * ROOM_W;
      const rows = def.map || [];
      if (rows.length !== wantRows) {
        problems.push(`${m.id}/${key}: map has ${rows.length} rows, expected ${wantRows}`
          + (sh > 1 ? ` (${sw}x${sh} screens)` : ''));
      }
      rows.forEach((r, i) => {
        const t = r.replace(/\s+$/, '');
        if (t.length !== wantCols) {
          problems.push(`${m.id}/${key}: row ${i} has ${t.length} chars, expected ${wantCols}`
            + (sw > 1 ? ` (${sw}x${sh} screens)` : ''));
        }
      });
      for (const w of (def.warps || [])) {
        const to = Array.isArray(w) ? { map: w[2], floor: w[3] | 0, rx: w[4], ry: w[5] } : w.to;
        if (!to) { problems.push(`${m.id}/${key}: warp with no destination`); continue; }
        if (!MAPS.has(to.map)) { problems.push(`${m.id}/${key}: warp targets unknown map '${to.map}'`); continue; }
        if (!hasRoom(to.map, to.floor || 0, to.rx, to.ry)) {
          problems.push(`${m.id}/${key}: warp targets missing room ${to.map} ${to.floor || 0},${to.rx},${to.ry}`);
        }
      }
    }
  }
  return problems;
}
