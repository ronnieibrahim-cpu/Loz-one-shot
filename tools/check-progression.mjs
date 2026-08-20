// Progression checker. Plain Node, no browser.
//
// THIS IS THE ONLY TOOL THAT ASKS THE QUESTION IN ORDER.
//
// `check-overworld.mjs` proves each gate twice — the region is sealed without
// its item, and open with it — by dropping ONE gate while holding all the
// others. That is the right question for "is this gate a gate", and it is
// blind to the only bug that can make a finished world unfinishable: a CYCLE.
// If gate A is opened by an item behind gate B and gate B is opened by an item
// behind gate A, then every single-drop run walks through the other gate and
// both look fine. The world was shipped in exactly that state — the Cliffs of
// Kell and the road to the Keep were both sealed by tiles only the Dredge
// Line opened, and the Dredge Line is the item in the Abyssal Keep, behind
// both of them. Seventeen green assertions, and D4 and D6 unreachable.
//
// So this tool starts a new game holding what the intro hands over and nothing
// else, floods the overworld, and asks what it can actually walk to. Whatever
// dungeon doors it reaches, it opens — adding EXACTLY the items that dungeon
// grants, read out of that dungeon's own chests rather than written down here
// — and floods again. It repeats until nothing new is reachable.
//
// If all six dungeons come out of that loop, the world has no cycle. If some
// do not, the ones left name the lock.
//
// WHAT IT DOES NOT PROVE. This is a flood over the overworld's tiles: it says
// a dungeon's DOOR is reachable, not that the dungeon behind it is beatable.
// `walk-dungeons.mjs` proves the inside, `check-playthrough.mjs` plays it, and
// this tool assumes a dungeon whose door you reach is a dungeon you finish —
// which is the same assumption the acquisition order itself is built on.
//
// Usage: node check-progression.mjs [--verbose]

import { installData } from '../src/data/index.js';
import { MAPS, getRoom, dungeons } from '../src/world/maps.js';
import { getTileDef, F } from '../src/world/tileset.js';
import { GAP_HOP_MAX_SPAN } from '../src/data/feel.js';
import { defWalkable, capsForMode, ROUTE_AVOID } from './lib/collision.mjs';
import { STORY_CUTSCENES } from '../src/data/story.js';

installData();

const VERBOSE = process.argv.includes('--verbose');
const W = 10, H = 8, OW = 12, OH = 10;
const START = '0,4,7';                 // Tidewatch Village, where a new game begins
const m = MAPS.get('overworld');

let pass = 0; const fail = [];
const check = (n, c, d) => c ? pass++ : (fail.push(n), console.log('  FAIL ' + n + (d ? ' — ' + d : '')));

// --------------------------------------------------------------------------
// Which item answers which gate flag.
//
// The tile flags say "this tile is a gate"; they cannot say what opens it,
// because a flag is a bit and an item is an id. This table is the join, and it
// is the one thing in this file that is written down rather than read out of
// the data — so it is short on purpose, and `check-overworld.mjs` proves each
// of these gates seals the region this assumes it seals.
// --------------------------------------------------------------------------
const GATE_ITEM = [
  [F.BOMBABLE, 'bombs'],
  [F.VANE, 'rod'],
  [F.HEAVY, 'dredge'],
  [F.SWIMGATE, 'cleats'],
  [F.GRAPPLE, 'dredge'],
];

// What a new game starts with: the intro cutscene's own `give` steps.
const START_ITEMS = [['conch', 1], ['sword', 1]];

// --------------------------------------------------------------------------
// The inventory is a LEVEL PER ITEM, not a set of ids.
//
// D3 grants the Cleats and D6 grants the Cleats again — L1 and L2, the Mermaid
// Suit. Held as a set of ids that reads as "D6 is gated on an item D6 grants",
// which is false and is exactly the kind of near-miss that gets an assertion
// deleted instead of fixed. A grant is (id, level) and so is a holding.
// --------------------------------------------------------------------------
const heldLevel = (inv, id) => inv.get(id) || 0;
const holds = (inv, id, level = 1) => heldLevel(inv, id) >= level;
const grant = (inv, id, level) => inv.set(id, Math.max(heldLevel(inv, id), level));

// --------------------------------------------------------------------------
// The world, read once.
// --------------------------------------------------------------------------
const NAMES = new Map();
for (const [k, d] of Object.entries(m.roomDefs)) {
  const [f, rx, ry] = k.split(',').map(Number);
  const room = getRoom('overworld', f, rx, ry);
  NAMES.set(d, Array.from({ length: H }, (_, y) =>
    Array.from({ length: W }, (_, x) => room.baseName(x, y))));
}
const legendOf = (def) => NAMES.get(def);
function defAt(name, tide) {
  let d = getTileDef(name);
  for (let i = 0; i < 4 && d && d.tide; i++) d = getTileDef(d.tide[tide]);
  return d;
}

/** Everywhere on the overworld a warp leads, screen by screen. */
const WARPS = [];                       // { screen, map }
for (const [k, d] of Object.entries(m.roomDefs)) {
  for (const w of d.warps || []) if (w.to && w.to.map) WARPS.push({ screen: k, map: w.to.map });
}
const screensLeadingTo = (mapId) => WARPS.filter(w => w.map === mapId).map(w => w.screen);

// --------------------------------------------------------------------------
// What each dungeon hands over — read out of the dungeon, not written here.
//
// The dungeon's own `item` is only its headline. D2's Bomb Vault and D6's
// Mermaid Vault hand over a second item each, and a checker that only read the
// headline would think Bombs came from nowhere. So every chest and giver in
// every room of the map is asked what it grants.
// --------------------------------------------------------------------------
function grantsOf(mapId) {
  const map = MAPS.get(mapId);
  const out = [];
  for (const def of Object.values(map.roomDefs)) {
    for (const [type, , , o] of def.entities || []) {
      if (!o || !o.item) continue;
      if (type === 'chest' || type === 'giver' || type === 'makuTree') {
        out.push({ item: o.item, level: o.level || 1 });
      }
    }
  }
  return out;
}
const grantLabel = (g) => g.map(x => `${x.item} L${x.level}`).join(', ');

const DUNGEONS = dungeons().map(d => ({
  id: d.id,
  index: d.dungeon.index,
  name: d.name,
  essence: d.dungeon.essence,
  entrances: screensLeadingTo(d.id),
  grants: grantsOf(d.id),
}));

// --------------------------------------------------------------------------
// The grants that are not in a dungeon: an NPC or a chest that waits for a
// number of Essences. The Maku Tree's two beats are both here — the Rod at
// one, and the flag that opens the road to the Keep at five — and so is the
// Noble Sword. Each one also names the screen you have to be able to WALK to
// before it can hand anything over, which is the point: a grant behind a gate
// is not a grant you have.
// --------------------------------------------------------------------------
const OFFERS = [];                       // { where, need, items, flags, label, whereAll }
const CHAIN = [];                        // every link of the Coastwise Chain, with its door
const TRADER_KINDS = new Set(['trader', 'makuTree']);
for (const map of MAPS.values()) {
  if (map.kind === 'dungeon') continue;
  // Where on the overworld you enter this map. An overworld screen is its own
  // door; anything else is reached through a warp.
  const doors = map.id === 'overworld' ? null : screensLeadingTo(map.id);
  if (doors && !doors.length) continue;
  for (const [k, def] of Object.entries(map.roomDefs)) {
    for (const [type, , , o] of def.entities || []) {
      if (!o) continue;
      const where = doors || [k];
      if ((type === 'giver' || type === 'makuTree' || type === 'chest') && o.item && o.needEssences) {
        OFFERS.push({ where, need: o.needEssences, items: [{ item: o.item, level: o.level || 1 }],
          flags: [], label: `${map.name}: ${o.item} L${o.level || 1} at ${o.needEssences} Essence(s)` });
      }
      // THE COASTWISE CHAIN. A trader's real-item payout does not live in
      // `o.item` where every other grant in this file lives — it lives in a
      // DEAL, because the Maku Tree stopped being a giver and became the last
      // link of an eleven-link trade. That is why this tool reported the Salt
      // Pans unreachable by a finished game: the Resonance Rod is the Pans'
      // key, and nothing here had ever looked inside `deals`.
      if (TRADER_KINDS.has(type) && Array.isArray(o.deals)) {
        for (const d of o.deals) CHAIN.push({ where, stage: d.stage, deal: d });
      }
      if (type === 'makuTree' && o.scene) {
        // A cutscene hands over its own items and sets its own flags, so both
        // are read out of the scene. The Master Sword is granted HERE and
        // nowhere else in the world — for the whole life of the project this
        // scene had no trigger, so a real player's sword never left level 1.
        const steps = STORY_CUTSCENES[o.scene] || [];
        const items = steps.filter(st => st.give)
          .map(st => ({ item: st.give.item, level: st.give.level || 1 }));
        const sceneFlags = steps.filter(st => st.flag).map(st => st.flag);
        OFFERS.push({ where, need: o.sceneNeed || 0, items, flags: sceneFlags,
          label: `${map.name}: ${o.scene} at ${o.sceneNeed || 0} Essence(s) -> `
            + `${[grantLabel(items), sceneFlags.map(f => `'${f}'`).join(', ')].filter(Boolean).join(' + ')}` });
      }
    }
  }
}

// --------------------------------------------------------------------------
// The flood. Same model as check-overworld.mjs: tile by tile, a tile counts as
// passable if it is walkable at ANY tide level, plus the base gap hop.
// --------------------------------------------------------------------------
// No swim, no jump, no cutting: the progression flood walks. Gaps are the base
// hop and are asked separately, via `hoppable`.
const CAPS = capsForMode('foot');

function walkable(name, tide, held, flags) {
  const d = defAt(name, tide);
  if (!d) return false;
  for (const [bit, item] of GATE_ITEM) if ((d.flags & bit) && holds(held, item)) return true;
  if (d.openFlag) return flags.has(d.openFlag);
  // THIS TOOL ARRIVED ON A BRANCH THAT NEVER SAW THE COLLISION CONSOLIDATION,
  // so it was born with the tenth private copy of "is this tile solid" — the
  // one the other nine had just been taken off. It is not a style fix. The
  // private formula ignores `mask`, so it reads every F.SOLID-flagged tile as
  // fully blocking, when the engine reads `mask: 0` as "the flags say wall,
  // the mask says open" — which is exactly what a DOORWAY and a CAVE MOUTH
  // are. That is why this checker reported the Salt Pans unreachable by a
  // FINISHED game holding every item in the world: not a gate bug, a flood
  // that could not walk through a door. docs/HANDOFF.md records the identical
  // bug being found in check-overworld.mjs, where it had sat unnoticed for the
  // whole life of that tool.
  return defWalkable(d, CAPS, ROUTE_AVOID);
}
const isGap = (ch) => { const d = defAt(ch, 1); return !!(d && (d.flags & F.JUMPABLE)); };
function runLen(l, x, y, dx, dy) {
  let n = 1;
  for (let i = 1; ; i++) { const nx = x + dx * i, ny = y + dy * i;
    if (nx < 0 || ny < 0 || nx >= W || ny >= H || !isGap(l[ny][nx])) break; n++; }
  for (let i = 1; ; i++) { const nx = x - dx * i, ny = y - dy * i;
    if (nx < 0 || ny < 0 || nx >= W || ny >= H || !isGap(l[ny][nx])) break; n++; }
  return n;
}
const hoppable = (l, x, y) => isGap(l[y][x])
  && (runLen(l, x, y, 1, 0) < GAP_HOP_MAX_SPAN || runLen(l, x, y, 0, 1) < GAP_HOP_MAX_SPAN);

function flood(held, flags) {
  const ok = (rk, x, y) => {
    const def = m.roomDefs[rk]; if (!def) return false;
    const l = legendOf(def);
    return [0, 1, 2].some(t => walkable(l[y][x], t, held, flags)) || hoppable(l, x, y);
  };
  const seen = new Set(), q = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (ok(START, x, y)) { seen.add(`${START}:${x},${y}`); q.push([START, x, y]); }
  }
  while (q.length) {
    const [rk, x, y] = q.pop();
    const [, rx, ry] = rk.split(',').map(Number);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      let trk = rk, tx = nx, ty = ny;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) {
        trk = `0,${rx + (nx < 0 ? -1 : nx >= W ? 1 : 0)},${ry + (ny < 0 ? -1 : ny >= H ? 1 : 0)}`;
        if (!m.roomDefs[trk]) continue;
        tx = (nx + W) % W; ty = (ny + H) % H;
      }
      const k = `${trk}:${tx},${ty}`;
      if (seen.has(k) || !ok(trk, tx, ty)) continue;
      seen.add(k); q.push([trk, tx, ty]);
    }
  }
  return new Set([...seen].map(k => k.split(':')[0]));
}

// --------------------------------------------------------------------------
// The run: a new game, and then only what the world lets you have.
// --------------------------------------------------------------------------
const held = new Map(START_ITEMS);
const flags = new Set();
const cleared = new Set();
const taken = new Set();
let essences = 0;
const stages = [];                       // one per round, for the report
const enteredWith = new Map();           // dungeon id -> items held when its door was first reached

// --------------------------------------------------------------------------
// The chain, as one offer per real item it pays out.
//
// A CHAIN IS NOT REACHED, IT IS WALKED. Every other offer in this file is
// earned by standing on one screen, so `where` is a list of alternatives and
// any one of them will do. This one is earned by standing on ELEVEN screens in
// order, so it carries `whereAll`: a list of link-doors, every one of which
// has to be inside the flood before the payout is owed. Granting the Rod for
// reaching the Maku Tree alone would model a player who was handed the last
// trade without doing the other ten — which is the same class of lie this tool
// exists to catch, told about a quest instead of a dungeon.
//
// This is deliberately not a re-proof of the chain's internal order. That is
// tools/check-trade.mjs's job and it does it properly, in-engine. All this
// asks is the progression question: can the chain be COMPLETED at the point
// the world starts needing what it pays out.
// --------------------------------------------------------------------------
for (const link of CHAIN) {
  const d = link.deal;
  if (!d.item) continue;
  OFFERS.push({
    where: link.where,
    whereAll: CHAIN.map(l => l.where),
    need: d.needEssences || 0,
    items: [{ item: d.item, level: d.level || 1 }],
    flags: d.flag ? [d.flag] : [],
    label: `the Coastwise Chain: ${d.item} L${d.level || 1} at stage ${d.stage}`
      // `CHAIN.length` counts DEALS, not traders — Ossa alone holds two (she
      // hands over the float at stage 1 and takes the kettle back at stage 11,
      // which is what makes the chain a circle). Saying "stages" keeps this
      // line from disagreeing with docs/TRADING.md's count of the traders.
      + `, ${CHAIN.length} stages${d.needEssences ? `, ${d.needEssences} Essence(s)` : ''}`,
  });
}

console.log(`  a new game holds: ${START_ITEMS.map(([i, l]) => `${i} L${l}`).join(', ')}`);

for (let round = 1; round <= DUNGEONS.length + OFFERS.length + 2; round++) {
  const reached = flood(held, flags);

  // Anything an NPC or a chest owes you, that you can now walk to.
  let gained = false;
  for (const [i, off] of OFFERS.entries()) {
    if (taken.has(i) || essences < off.need) continue;
    if (!off.where.some(s => reached.has(s))) continue;
    // Every link, not just the payout's own doorstep.
    if (off.whereAll && !off.whereAll.every(w => w.some(s => reached.has(s)))) continue;
    taken.add(i); gained = true;
    for (const g of off.items) grant(held, g.item, g.level);
    for (const f of off.flags) flags.add(f);
    stages.push({ round, kind: 'offer', label: off.label });
  }
  if (gained) continue;                  // re-flood: a flag may have opened a road

  // Every dungeon whose door is now reachable and which is not done yet.
  const open = DUNGEONS.filter(d => !cleared.has(d.id) && d.entrances.some(s => reached.has(s)));
  if (!open.length) break;
  for (const d of open) {
    enteredWith.set(d.id, new Map(held));
    cleared.add(d.id);
    essences++;
    for (const g of d.grants) grant(held, g.item, g.level);
    stages.push({ round, kind: 'dungeon', label:
      `${d.id.toUpperCase()} ${d.name} at ${d.entrances[0]} -> ${grantLabel(d.grants)}` });
  }
}

for (const s of stages) console.log(`    round ${s.round}: ${s.label}`);
const finalReach = flood(held, flags);
console.log(`  reached ${finalReach.size}/${OW * OH} screens with ${cleared.size}/${DUNGEONS.length} dungeons cleared`);
if (VERBOSE) {
  console.log('  held at the end: '
    + [...held].map(([i, l]) => `${i} L${l}`).sort().join(', '));
}

// --- 1. no dungeon is locked behind itself ---------------------------------
//
// The assertion the whole tool exists for. A dungeon's door has to be
// reachable while its own item is still inside it — that is what "in
// acquisition order" means, and it is the exact shape of the bug that shipped.
for (const d of DUNGEONS) {
  const had = enteredWith.get(d.id);
  check(`${d.id.toUpperCase()}'s door is reachable before ${d.id.toUpperCase()} is entered`,
    !!had, 'never reached');
  if (!had) continue;
  // At the level it grants. Walking into the Keep with the Cleats it upgrades
  // is not the Keep gating itself; walking in with the Dredge Line it hands
  // over would be.
  const own = d.grants.filter(g => holds(had, g.item, g.level));
  check(`${d.id.toUpperCase()} is not gated on an item ${d.id.toUpperCase()} grants`,
    own.length === 0, `held ${grantLabel(own)} on the way in`);
}

// --- 2. the world finishes ------------------------------------------------
const stuck = DUNGEONS.filter(d => !cleared.has(d.id));
check('every dungeon is reachable in acquisition order',
  stuck.length === 0, stuck.map(d => `${d.id} (${d.entrances.join('/')})`).join(', '));

// --- 3. every Essence-gated offer is actually collectable ------------------
// A grant nobody can walk to is a grant that does not exist. The Maku Tree's
// road to the Keep is one of these, and it was the missing one.
for (const [i, off] of OFFERS.entries()) {
  check(`offer is reachable when it is owed — ${off.label}`, taken.has(i), 'never collectable');
}

// --- 4. the whole map opens by the end ------------------------------------
const unreached = [];
for (let y = 0; y < OH; y++) for (let x = 0; x < OW; x++) {
  if (!finalReach.has(`0,${x},${y}`)) unreached.push(`0,${x},${y}`);
}
check('a finished game can walk the whole overworld', unreached.length === 0, unreached.join(','));

// --- 5. the order is a real order -----------------------------------------
// Every dungeon must be entered in a strictly later round than one whose item
// it needs; a round in which nothing at all is gained is a stall, and the loop
// above breaks on it rather than spinning, so an empty stage list means the
// very first flood reached nothing.
check('the run made progress', stages.length > 0, 'no dungeon was ever reachable');

console.log(`\n=== ${pass} passed, ${fail.length} failed ===`);
process.exit(fail.length ? 1 : 0);
