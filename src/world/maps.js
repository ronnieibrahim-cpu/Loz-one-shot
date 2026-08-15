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
//       // A dungeon room may declare a size in SCREENS (see room.js):
//       '0,4,4': { size: [2, 1], map: [...] },   // 8 rows of 20 chars
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

import { Room, normaliseSize } from './room.js';

export const MAPS = new Map();

export function registerMap(def) {
  const kind = def.kind || 'overworld';
  // Room size is validated HERE, at registration, not lazily when a room is
  // first walked into. A bad size in a room nobody visits during a test run
  // would otherwise sit in the data until a player found it.
  //
  // "The overworld is 1x1" is structural rather than conventional: the
  // overworld is a grid of screens with a scroll transition on every seam, and
  // a multi-screen overworld room would mean two different meanings for "the
  // next screen along". So it is refused, loudly, rather than documented.
  for (const [key, r] of Object.entries(def.rooms || {})) {
    if (!r || !r.size) continue;
    if (kind === 'overworld') {
      throw new Error(`${def.id}/${key}: overworld rooms may not declare a size`
        + ` (got ${r.size[0]}x${r.size[1]}); the overworld is a grid of 1x1 screens`);
    }
    normaliseSize(r.size, `${def.id}/${key}`);
  }
  const m = {
    id: def.id,
    kind,
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

/**
 * Which room OCCUPIES a map cell, as opposed to which room is keyed to it.
 *
 * A room's key is its top-left cell, and a multi-screen room covers
 * `sw x sh` cells from there. So the east neighbour of a 2x1 room at `0,4,4` is
 * whatever sits at `0,6,4`, and walking west into that same room from `0,7,4`
 * arrives at cell `0,6,4` — which has no `roomDef` of its own and must still
 * resolve to the room that owns it.
 *
 * Every cell lookup goes through this. `getRoom` and `hasRoom` resolve through
 * it too, so a warp or a seam that names a covered cell finds the room rather
 * than a hole. Built once per map and memoised; `roomDefs` never changes at
 * runtime.
 */
function occupancy(m) {
  if (m._occ) return m._occ;
  const occ = new Map();
  for (const [key, def] of Object.entries(m.roomDefs)) {
    const [f, x, y] = key.split(',').map(Number);
    let sw = 1, sh = 1;
    try { [sw, sh] = normaliseSize(def.size, `${m.id}/${key}`); } catch (e) { /* validate reports it */ }
    for (let j = 0; j < sh; j++) for (let i = 0; i < sw; i++) occ.set(roomKey(f, x + i, y + j), key);
  }
  m._occ = occ;
  return occ;
}

/** The key of the room occupying a cell, or null. */
export function roomKeyAt(mapId, floor, x, y) {
  const m = MAPS.get(mapId);
  if (!m) return null;
  return occupancy(m).get(roomKey(floor, x, y)) || null;
}

/** Instantiate (and memoise) a Room. Returns null if that cell is empty. */
export function getRoom(mapId, floor, x, y) {
  const m = MAPS.get(mapId);
  if (!m) return null;
  const key = occupancy(m).get(roomKey(floor, x, y));
  if (!key) return null;
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
  return !!roomKeyAt(mapId, floor, x, y);
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

/**
 * How many Essences of the Tide the world holds — one per dungeon that grants
 * one, counted rather than written down. The plan is six and the data carried
 * eight for the whole life of the project, so the HUD, the quest screen and the
 * save slots all said "/8" while the story said eight and the dungeons said
 * whatever they happened to say. Anything that prints a denominator asks here.
 */
export function essenceCount() {
  return dungeons().filter(m => m.dungeon.essence != null).length;
}

/**
 * How many Essences the Abyssal Seal wants: every one but the last dungeon's.
 *
 * DERIVED, not written down, for the same reason `essenceCount` is. The seal
 * holds the last dungeon shut, so the number it wants is "all of them except
 * the one behind me" — and a session that adds or folds a dungeon must not have
 * to remember that a tile somewhere counts to five.
 */
export function sealEssences() {
  return Math.max(1, essenceCount() - 1);
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
      // The grid must match the DECLARED size exactly. A 2x1 room is eight rows
      // of twenty characters; authoring it as two 10-wide grids gives sixteen
      // rows and is caught here rather than read as a room half full of void.
      let sw = 1, sh = 1;
      try {
        [sw, sh] = normaliseSize(def.size, `${m.id}/${key}`);
      } catch (e) { problems.push(e.message); }
      if (def.size && m.kind === 'overworld') {
        problems.push(`${m.id}/${key}: overworld rooms may not declare a size`);
      }
      // A multi-screen room OWNS the cells it spans. Another room keyed inside
      // them would be unreachable — every seam into those cells resolves to the
      // large room — and the minimap would draw two rooms in one place.
      if (sw > 1 || sh > 1) {
        if (x + sw > m.w || y + sh > m.h) {
          problems.push(`${m.id}/${key}: a ${sw}x${sh} room here runs off the map (${m.w}x${m.h})`);
        }
        for (let j = 0; j < sh; j++) for (let i = 0; i < sw; i++) {
          if (i === 0 && j === 0) continue;
          const c = roomKey(f, x + i, y + j);
          if (m.roomDefs[c]) {
            problems.push(`${m.id}/${key}: its ${sw}x${sh} footprint covers room '${c}'`);
          }
        }
      }
      const wantRows = 8 * sh, wantCols = 10 * sw;
      const rows = def.map || [];
      if (rows.length !== wantRows) {
        problems.push(`${m.id}/${key}: map has ${rows.length} rows, expected ${wantRows}`
          + ` (size ${sw}x${sh})`);
      }
      rows.forEach((r, i) => {
        const t = r.replace(/\s+$/, '');
        if (t.length !== wantCols) {
          problems.push(`${m.id}/${key}: row ${i} has ${t.length} chars, expected ${wantCols}`
            + ` (size ${sw}x${sh})`);
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
