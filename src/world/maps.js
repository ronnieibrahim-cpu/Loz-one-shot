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

/** Structural validation: every warp must resolve to a room that exists. */
export function validateMaps() {
  const problems = [];
  for (const m of MAPS.values()) {
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
      const rows = def.map || [];
      if (rows.length !== 8) problems.push(`${m.id}/${key}: map has ${rows.length} rows, expected 8`);
      rows.forEach((r, i) => {
        const t = r.replace(/\s+$/, '');
        if (t.length !== 10) problems.push(`${m.id}/${key}: row ${i} has ${t.length} chars, expected 10`);
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
