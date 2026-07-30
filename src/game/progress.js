// Player progress: the entire saveable state of a game, plus localStorage slots.
//
// Health is measured in quarter-hearts (HEART_UNITS = 4), matching how the Oracle
// games could take a quarter heart off you. Enemy `damage` values are in the same
// units, so `damage: 2` is half a heart.

export const HEART_UNITS = 4;
export const SAVE_KEY = 'oracleOfTides.save.v1';
export const SLOTS = 3;

export function newProgress(name = 'LINK') {
  return {
    version: 1,
    name,
    // health
    hearts: 3 * HEART_UNITS,
    maxHearts: 3 * HEART_UNITS,
    heartPieces: 0,
    // currency & consumables
    rupees: 0,
    bombs: 0, maxBombs: 0,
    seeds: { ember: 0, scent: 0, pegasus: 0, gale: 0, mystery: 0 },
    maxSeeds: 0,
    // items: id -> level (1+). Absent or 0 means not owned.
    items: {},
    equipB: null, equipA: null,
    // magic rings
    rings: {}, ringSlots: 1, ringsEquipped: [null, null],
    // quest
    essences: [],            // dungeon indices whose essence has been claimed
    keys: {},                // mapId -> small key count
    bossKeys: {},            // mapId -> true
    dungeonMaps: {},         // mapId -> true
    compasses: {},           // mapId -> true
    beaten: {},              // mapId -> true (boss defeated)
    flags: {},               // arbitrary story/world flags
    chests: {},              // "mapId:roomKey:index" -> true
    doors: {},               // "mapId:roomKey:tx,ty" -> 'open'
    secrets: {},             // one-shot world changes
    trade: { stage: 0, item: null },
    // world state
    tide: 1,
    // position
    pos: { map: 'overworld', floor: 0, rx: 4, ry: 7, px: 72, py: 64, dir: 'down' },
    respawn: { map: 'overworld', floor: 0, rx: 4, ry: 7, px: 72, py: 64, dir: 'down' },
    // stats
    deaths: 0, frames: 0, rupeesTotal: 0, kills: 0,
    createdAt: Date.now(),
  };
}

// --- item helpers ----------------------------------------------------------

export function itemLevel(p, id) { return p.items[id] || 0; }
export function hasItem(p, id) { return (p.items[id] || 0) > 0; }

export function giveItem(p, id, level = 1) {
  const cur = p.items[id] || 0;
  p.items[id] = Math.max(cur, level);
  return p.items[id] > cur;
}

export function flag(p, k) { return !!p.flags[k]; }
export function setFlag(p, k, v = true) { p.flags[k] = v; }

export function keyCount(p, mapId) { return p.keys[mapId] || 0; }
export function addKey(p, mapId, n = 1) { p.keys[mapId] = (p.keys[mapId] || 0) + n; }
export function useKey(p, mapId) {
  if ((p.keys[mapId] || 0) <= 0) return false;
  p.keys[mapId]--;
  return true;
}

export function addRupees(p, n) {
  p.rupees = Math.max(0, Math.min(999, p.rupees + n));
  if (n > 0) p.rupeesTotal += n;
}

export function heal(p, units) {
  p.hearts = Math.min(p.maxHearts, p.hearts + units);
}

export function addHeartContainer(p) {
  p.maxHearts += HEART_UNITS;
  p.hearts = p.maxHearts;
}

/** Four pieces make a container. Returns true if a container was completed. */
export function addHeartPiece(p) {
  p.heartPieces++;
  if (p.heartPieces >= 4) {
    p.heartPieces = 0;
    addHeartContainer(p);
    return true;
  }
  return false;
}

export function addSeeds(p, kind, n) {
  if (!(kind in p.seeds)) return 0;
  const before = p.seeds[kind];
  p.seeds[kind] = Math.max(0, Math.min(p.maxSeeds, before + n));
  return p.seeds[kind] - before;
}

export function addBombs(p, n) {
  const before = p.bombs;
  p.bombs = Math.max(0, Math.min(p.maxBombs, p.bombs + n));
  return p.bombs - before;
}

// --- persistence -----------------------------------------------------------

function readAll() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return {};
    const o = JSON.parse(raw);
    return (o && typeof o === 'object') ? o : {};
  } catch (e) {
    console.warn('[save] unreadable, starting fresh', e);
    return {};
  }
}

function writeAll(all) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(all));
    return true;
  } catch (e) {
    console.warn('[save] write failed', e);
    return false;
  }
}

export function listSaves() {
  const all = readAll();
  const out = [];
  for (let i = 0; i < SLOTS; i++) {
    const s = all['slot' + i];
    out.push(s ? summarise(s) : null);
  }
  return out;
}

function summarise(p) {
  return {
    name: p.name,
    hearts: p.hearts, maxHearts: p.maxHearts,
    essences: (p.essences || []).length,
    rupees: p.rupees,
    deaths: p.deaths,
    minutes: Math.floor((p.frames || 0) / 60 / 60),
    raw: p,
  };
}

export function saveSlot(slot, progress) {
  const all = readAll();
  all['slot' + slot] = progress;
  return writeAll(all);
}

export function loadSlot(slot) {
  const all = readAll();
  const p = all['slot' + slot];
  if (!p) return null;
  return migrate(p);
}

export function deleteSlot(slot) {
  const all = readAll();
  delete all['slot' + slot];
  return writeAll(all);
}

/** Fill in any fields added since the save was written. */
function migrate(p) {
  const base = newProgress(p.name || 'LINK');
  const out = { ...base, ...p };
  for (const k of ['seeds', 'items', 'keys', 'bossKeys', 'dungeonMaps', 'compasses',
    'beaten', 'flags', 'chests', 'doors', 'secrets', 'rings', 'trade', 'pos', 'respawn']) {
    out[k] = { ...base[k], ...(p[k] || {}) };
  }
  if (!Array.isArray(out.essences)) out.essences = [];
  if (!Array.isArray(out.ringsEquipped)) out.ringsEquipped = [null, null];
  return out;
}
