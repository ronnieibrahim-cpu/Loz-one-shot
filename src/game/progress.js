// Player progress: the entire saveable state of a game, plus localStorage slots.
//
// Health is measured in quarter-hearts (HEART_UNITS = 4), matching how the Oracle
// games could take a quarter heart off you. Enemy `damage` values are in the same
// units, so `damage: 2` is half a heart.

import { hash32 } from '../core/rng.js';
import { newCharmSlots, CHARM_SLOTS } from './scrimshaw.js';
import { REEFSEED_CAPACITY, BOTTLE_CAPACITY, BOMB_CAPACITY } from '../data/feel.js';

export const HEART_UNITS = 4;
export const SAVE_KEY = 'oracleOfTides.save.v1';
export const SLOTS = 3;

/**
 * How many overworld screen-to-screen crossings must pass before a killed
 * overworld enemy is eligible to respawn on its own screen again. Walking
 * off-screen and immediately back is not "far enough away" — the player has
 * to actually put ground between the kill and the return. Dungeon and cave
 * rooms have no such grace: an enemy killed indoors stays dead for the rest
 * of the save (see `Game.onEnemyDefeated`/`spawnRoomEntities`).
 */
export const OVERWORLD_RESPAWN_DISTANCE = 5;

/**
 * `seed` is the root of every random decision the run will ever make. It is
 * saved, so a reloaded game keeps rolling the same way, and tools/replay.mjs
 * pins it explicitly. Passing one makes a new game fully reproducible.
 */
export function newProgress(name = 'LINK', seed = (Date.now() >>> 0)) {
  return {
    version: 1,
    name,
    seed: seed >>> 0,
    // health
    hearts: 3 * HEART_UNITS,
    maxHearts: 3 * HEART_UNITS,
    heartPieces: 0,
    // currency & consumables
    rupees: 0,
    bombs: 0, maxBombs: 0,
    reefseeds: 0, maxReefseeds: 0,
    bottles: 0, maxBottles: 0,
    // items: id -> level (1+). Absent or 0 means not owned.
    items: {},
    equipB: null, equipA: null,
    // scrimshaw: carved charms, and the three tide-level cases they slot into.
    // You start with the MID case only; LOW and HIGH open over the game, and
    // the case upgrade raises charmCase to CHARM_CASE_MAX.
    charms: {},
    charmSlots: newCharmSlots(),
    charmOpen: { low: false, mid: true, high: false },
    // Which case openings the scrimshander has already remarked on. The cases
    // themselves open on the essence (see openCharmCases); this is only so she
    // says her line once.
    charmTold: {},
    charmCase: 1,
    blanks: 0,               // uncarved bone, the scrimshander's raw material
    carve: null,             // { id, turns } — commissioned, tide turns to go
    // quest
    essences: [],            // dungeon indices whose essence has been claimed
    keys: {},                // mapId -> small key count
    bossKeys: {},            // mapId -> true
    dungeonMaps: {},         // mapId -> true
    charts: {},              // mapId -> true (Chartstone; replaced the Compass)
    beaten: {},              // mapId -> true (boss defeated)
    flags: {},               // arbitrary story/world flags
    chests: {},              // "mapId:roomKey:index" -> true
    doors: {},               // "mapId:roomKey:tx,ty" -> 'open'
    secrets: {},             // one-shot world changes
    // Killed enemies that stay dead. Keyed the same as chests/secrets
    // ("mapId:roomKey:index"). A dungeon/cave entry is `{ perm: true }` and
    // never respawns; an overworld entry is `{ until: <owVisits value> }`
    // and respawns once `owVisits` reaches it. See `OVERWORLD_RESPAWN_DISTANCE`.
    slain: {},
    // Counts overworld screen-to-screen crossings, for the "far enough away"
    // clause above. Only overworld travel advances it — see
    // `Game.updateTransition`.
    owVisits: 0,
    trade: { stage: 0, item: null },
    // Where the Ferryman's Coin is lying, or null if it is in your hand.
    // Saved, because the coin's whole point is that it works across rooms.
    coin: null,
    // world state
    tide: 1,
    // position
    // The middle of Tidewatch's square, facing the shopfront. It used to be
    // 72,64 — which is now the alley between the two buildings the village
    // gained, and a new game opening in an alley is a worse first frame than
    // one opening in the square with the shop in front of it.
    pos: { map: 'overworld', floor: 0, rx: 4, ry: 7, px: 72, py: 72, dir: 'down' },
    // Where a death puts you back. This is the STARTING value only —
    // `Game.markRespawn` moves it every time the player crosses an overworld
    // seam and every time he walks into a dungeon, a cave or a house. It used
    // to be the only value it ever had, which meant dying anywhere in the
    // world sent you back to the village square. `tide` is the sea as it stood
    // when the point was taken, because MID is not a safe level everywhere.
    respawn: { map: 'overworld', floor: 0, rx: 4, ry: 7, px: 72, py: 72, dir: 'down', tide: 1 },
    // stats
    deaths: 0, frames: 0, rupeesTotal: 0, kills: 0,
    createdAt: Date.now(),
  };
}

// --- item helpers ----------------------------------------------------------

export function itemLevel(p, id) { return p.items[id] || 0; }
export function hasItem(p, id) { return (p.items[id] || 0) > 0; }

/**
 * Grant an item, and — if it is a COUNTED one — the ammunition that makes it an
 * item rather than an icon.
 *
 * The stocking used to live in `Game.openChest` and nowhere else, which meant
 * every OTHER way of handing an item over produced a working entry in the
 * inventory attached to an empty pouch: `maxReefseeds` 0, `reefseeds` 0, the
 * B button playing the deny sound for ever. A giver NPC, a cutscene, a debug
 * grant and a test harness all took that path. It cost a session here: the
 * Drowned Wood Shrine's replay threw a seed that did not exist and recorded a
 * perfectly deterministic run of Link swimming past the tile he was supposed to
 * have built, and every checker stayed green because the only tool that had
 * ever needed a seed set the counts by hand on its way past.
 *
 * So the rule lives with the grant. `Math.max` throughout: a second grant of an
 * item you already own must never take ammunition away, and the Quartermaster's
 * Mark may have raised the cap above the base already.
 */
export function giveItem(p, id, level = 1) {
  const cur = p.items[id] || 0;
  p.items[id] = Math.max(cur, level);
  const gained = p.items[id] > cur;
  if (gained && cur === 0) {
    if (id === 'bombs') {
      p.maxBombs = Math.max(p.maxBombs, BOMB_CAPACITY);
      p.bombs = Math.max(p.bombs, p.maxBombs);
    }
    if (id === 'reefseed') {
      p.maxReefseeds = Math.max(p.maxReefseeds, REEFSEED_CAPACITY);
      p.reefseeds = Math.max(p.reefseeds, p.maxReefseeds);
    }
    if (id === 'bottle') {
      p.maxBottles = Math.max(p.maxBottles, BOTTLE_CAPACITY);
      p.bottles = Math.max(p.bottles, p.maxBottles);
    }
  }
  return gained;
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

/**
 * `cap` overrides the satchel's own capacity, and exists for the
 * Quartermaster's Mark: the charm raises the CEILING rather than the satchel,
 * so `maxReefseeds` stays what the item is worth and taking the charm off
 * never destroys seeds already carried. Callers pass `game.reefseedCap()`.
 */
export function addReefseeds(p, n, cap = p.maxReefseeds) {
  const before = p.reefseeds;
  p.reefseeds = Math.max(0, Math.min(cap, before + n));
  return p.reefseeds - before;
}

export function addBottles(p, n) {
  const before = p.bottles;
  p.bottles = Math.max(0, Math.min(p.maxBottles, before + n));
  return p.bottles - before;
}

export function addBombs(p, n) {
  const before = p.bombs;
  p.bombs = Math.max(0, Math.min(p.maxBombs, p.bombs + n));
  return p.bombs - before;
}

// --- persistence -----------------------------------------------------------

/**
 * Safari's Intelligent Tracking Prevention evicts localStorage for a site
 * that hasn't been opened in ~7 days, and Private Browsing throws on every
 * access rather than just refusing to persist. Either way `localStorage`
 * itself can be present but unusable, so the only reliable test is a real
 * write-then-remove — reading `typeof localStorage` proves nothing.
 */
export function storageAvailable() {
  try {
    const k = '__oot_probe__';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return true;
  } catch (e) {
    return false;
  }
}

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

// --- export / import as a copyable text code --------------------------------
//
// A save that lives only in localStorage is a save iOS can evict on its own
// schedule with nothing the player did wrong. The code is the escape hatch:
// paste it somewhere durable, or onto another device, independent of this
// browser's storage at all.

const CODE_PREFIX = 'OOT1:';

export function exportCode(progress) {
  const json = JSON.stringify(progress);
  return CODE_PREFIX + btoa(unescape(encodeURIComponent(json)));
}

/** Returns a migrated progress object, or null if the code cannot be read. */
export function importCode(code) {
  try {
    const s = String(code).trim();
    const body = s.startsWith(CODE_PREFIX) ? s.slice(CODE_PREFIX.length) : s;
    const json = decodeURIComponent(escape(atob(body)));
    const obj = JSON.parse(json);
    if (!obj || typeof obj !== 'object') return null;
    return migrate(obj);
  } catch (e) {
    return null;
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
  for (const k of ['items', 'keys', 'bossKeys', 'dungeonMaps', 'charts',
    'beaten', 'flags', 'chests', 'doors', 'secrets', 'slain', 'charms', 'charmOpen',
    'charmTold',
    'trade', 'pos', 'respawn']) {
    out[k] = { ...base[k], ...(p[k] || {}) };
  }
  // The cases are arrays inside an object, so a spread would carry a stale
  // length through from a save written under a smaller CHARM_CASE_MAX.
  out.charmSlots = newCharmSlots();
  for (const s of CHARM_SLOTS) {
    const was = p.charmSlots && p.charmSlots[s];
    if (!Array.isArray(was)) continue;
    for (let i = 0; i < out.charmSlots[s].length && i < was.length; i++) {
      out.charmSlots[s][i] = was[i] || null;
    }
  }
  // A save written before seeds existed gets one derived from what it does
  // carry, so it is at least stable across loads rather than fresh each time.
  if (p.seed == null) out.seed = hash32('legacy', p.name || 'LINK', p.createdAt || 0);
  if (!Array.isArray(out.essences)) out.essences = [];
  return out;
}
