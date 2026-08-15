// Progression prover. Plain Node, no browser.
//
// WHAT IT IS FOR, AND WHAT IT CAUGHT
//
// `check-overworld.mjs` proves every region gate twice — sealed without its
// item, open with it — and it passed, for the whole life of this project, on a
// world that could not be finished.
//
// Two of the five gates were the Dredge Line's. The Dredge Line is the SIXTH
// dungeon's item. Between them those two gates held shut the Cliffs of Kell,
// where the FOURTH dungeon is, and the Abyssal approach, where the sixth is.
// So the Cistern and the Keep were each locked behind an item found inside
// them, and nineteen checkers were green. Nothing in the repo asked the only
// question that would have noticed:
//
//   WHEN THE PLAYER ARRIVES AT DUNGEON N'S DOOR, ARE THE ITEMS THAT OPENED THE
//   WAY THERE ONES THEY COULD ALREADY HAVE?
//
// That is what this file asks, and it asks it as a fixed point rather than as
// a hand-written table of which gate belongs to which dungeon: start with
// nothing, flood, collect whatever the reachable dungeons and givers hand over,
// flood again, and keep going until nothing new is reachable. If the closure
// does not contain every dungeon mouth, the game cannot be finished — and the
// step at which each mouth first appears IS the intended order, so the tool
// prints it and asserts it is the order the design claims.
//
// THE MODEL, and where its edges are
//
//   * The flood is `check-overworld.mjs`'s optimistic one — a tile is passable
//     if it is walkable at ANY tide level, because the player controls the
//     conch — plus the base hop, modelled against GAP_HOP_MAX_SPAN the same
//     way. Sharing the model matters more than sharpening it: this tool exists
//     to ask a DIFFERENT question of the same world, not a harder one.
//   * A dungeon is treated as handing over its item the moment its MOUTH is
//     reachable. That is optimistic — it assumes the dungeon is completable —
//     and it is exactly right here, because `walk-dungeons.mjs` already proves
//     completability and there is no point proving it twice.
//   * Non-dungeon keys are declared with what they cost. The Resonance Rod is
//     the Maku Tree's and wants one essence, so it arrives with D1.
//   * IT DOES NOT MODEL THE TIDE FIELD OR THE ANCHOR. `check-overworld.mjs`'s
//     section 5b does, and reaches the same 120 screens; if that ever stops
//     being true this tool's answer is the optimistic one.

import { installData } from '../src/data/index.js';
import { MAPS, getRoom } from '../src/world/maps.js';
import { getTileDef, F } from '../src/world/tileset.js';
import { GAP_HOP_MAX_SPAN } from '../src/data/feel.js';

installData();

const W = 10, H = 8, OW = 12, OH = 10;
const m = MAPS.get('overworld');
const START = '0,4,7';           // Tidewatch Village, where a new game begins

let passed = 0; const failures = [];
const check = (n, c, d) => c ? (passed++, console.log('  ok   ' + n))
  : (failures.push(n + (d ? ' — ' + d : '')), console.log('  FAIL ' + n + (d ? ' — ' + d : '')));

// --------------------------------------------------------------------------
// THE DESIGN, declared. Everything below is derived from these three tables,
// and each is a claim some other document already makes.

// docs/DUNGEON-STATUS.md's board: which dungeon is behind which door, in order.
const DUNGEONS = [
  { n: 1, map: 'd1', mouth: '0,8,8', name: 'Tidewash Grotto', gives: [] },
  { n: 2, map: 'd2', mouth: '0,10,5', name: 'Coral Spire', gives: ['bombs'] },
  { n: 3, map: 'd3', mouth: '0,1,8', name: 'Bogwater Sanctum', gives: ['cleats'] },
  { n: 4, map: 'd4', mouth: '0,1,3', name: 'Cliffside Cistern', gives: ['bellows'] },
  { n: 5, map: 'd5', mouth: '0,5,4', name: 'Drowned Wood Shrine', gives: [] },
  { n: 6, map: 'd6', mouth: '0,1,0', name: 'Abyssal Keep', gives: ['dredge'] },
];

// Keys that are not a dungeon's, and what they cost. `after` is the number of
// dungeons that must be finished first — the Maku Tree's giver declares
// `needEssences: 1`, so the Rod arrives with the first essence and not before.
const GIVERS = [
  { key: 'rod', after: 1, where: 'the Maku Tree, for one essence' },
];

// The flag each key opens, which is the contract between an item and a tile.
// A key with no flag opens no region and is simply absent from here.
const KEY_FLAG = {
  rod: F.VANE,
  bombs: F.BOMBABLE,
  cleats: F.SWIMGATE,
  bellows: F.GUSTGATE,
  dredge: F.MAGNETIC | F.HEAVY,
};

// Everything else worth reaching, so the closure is asserted to cover the whole
// world and not merely the critical path.
const SIDE = {
  cave3: '0,6,1',      // the Salt Pan Vault ruin — the Bottled Tide
  cave4: '0,10,1',     // the Reef Palace ruin
};

// --------------------------------------------------------------------------
// The flood, deliberately the same one check-overworld.mjs uses.

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
let openMask = 0;
function walkableAt(name, tide) {
  const d = defAt(name, tide);
  if (!d) return false;
  if (openMask && (d.flags & openMask)) return true;
  return !(d.flags & (F.VOID | F.SOLID | F.PIT | F.DEEP | F.LEDGE | F.HAZARD | F.JUMPABLE));
}
const passable = (n) => [0, 1, 2].some(t => walkableAt(n, t));
const isGap = (n) => { const d = defAt(n, 1); return !!(d && (d.flags & F.JUMPABLE)); };
function runLen(l, x, y, dx, dy) {
  let n = 1;
  for (let i = 1; ; i++) { const nx = x + dx * i, ny = y + dy * i; if (nx < 0 || ny < 0 || nx >= W || ny >= H || !isGap(l[ny][nx])) break; n++; }
  for (let i = 1; ; i++) { const nx = x - dx * i, ny = y - dy * i; if (nx < 0 || ny < 0 || nx >= W || ny >= H || !isGap(l[ny][nx])) break; n++; }
  return n;
}
const hoppable = (l, x, y) => isGap(l[y][x])
  && (runLen(l, x, y, 1, 0) < GAP_HOP_MAX_SPAN || runLen(l, x, y, 0, 1) < GAP_HOP_MAX_SPAN);
const passableAt = (l, x, y) => passable(l[y][x]) || hoppable(l, x, y);

function flood(keys) {
  openMask = [...keys].reduce((mask, k) => mask | (KEY_FLAG[k] || 0), 0);
  const seen = new Set(); const q = [];
  const sl = legendOf(m.roomDefs[START]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (passableAt(sl, x, y)) { seen.add(`${START}:${x},${y}`); q.push([START, x, y]); }
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
      if (seen.has(k)) continue;
      if (!passableAt(legendOf(m.roomDefs[trk]), tx, ty)) continue;
      seen.add(k); q.push([trk, tx, ty]);
    }
  }
  return new Set([...seen].map(k => k.split(':')[0]));
}

// --------------------------------------------------------------------------
// 1. The closure. Start with nothing; take everything reachable; repeat.

console.log('--- the game can be finished, starting from nothing ---');

const keys = new Set();
const cleared = new Set();       // dungeons whose mouth has been reached
const firstSeen = new Map();     // mouth key -> the step it became reachable
let step = 0, reached = flood(keys);

for (const [k, v] of Object.entries(SIDE)) if (reached.has(v)) firstSeen.set(k, 0);
for (const d of DUNGEONS) if (reached.has(d.mouth)) firstSeen.set(d.map, 0);

for (; step < 24; step++) {
  const before = keys.size + cleared.size;
  for (const d of DUNGEONS) {
    if (cleared.has(d.map) || !reached.has(d.mouth)) continue;
    cleared.add(d.map);
    for (const g of d.gives) keys.add(g);
  }
  for (const g of GIVERS) if (!keys.has(g.key) && cleared.size >= g.after) keys.add(g.key);
  if (keys.size + cleared.size === before) break;
  reached = flood(keys);
  for (const [k, v] of Object.entries(SIDE)) if (!firstSeen.has(k) && reached.has(v)) firstSeen.set(k, step + 1);
  for (const d of DUNGEONS) if (!firstSeen.has(d.map) && reached.has(d.mouth)) firstSeen.set(d.map, step + 1);
}

const unenterable = DUNGEONS.filter(d => !cleared.has(d.map));
check('every dungeon mouth is reachable from a new game with no items',
  unenterable.length === 0,
  unenterable.map(d => `${d.map} ${d.name} at ${d.mouth}`).join(', ')
  + ' — locked behind an item you cannot get without entering it');

const unseen = Object.entries(SIDE).filter(([k]) => !firstSeen.has(k));
check('every side destination is reachable too', unseen.length === 0,
  unseen.map(([k, v]) => `${k} at ${v}`).join(', '));

check('the closure opens the whole world', reached.size === 120,
  `${reached.size}/120 screens`);

// --------------------------------------------------------------------------
// 2. THE ORDER. A dungeon may not become reachable before the one before it.
//
// This is weaker than "each dungeon is gated on the previous one's item" and
// deliberately so: the Oracles leave several regions open from the start and
// let the essence count do the sequencing. What must never happen is a LATER
// dungeon opening a door an EARLIER one is still behind.

// A dungeon whose region has no gate at all opens at step 0 and will invert
// against anything gated. That is a REAL GAP and it is named here rather than
// argued away, so every run prints it: an exemption with a reason is the
// difference between a known gap and an accident nobody noticed. Same idiom as
// check-autotile.mjs's EXEMPT list and check-towns.mjs's unplaced-variant note.
const UNGATED = new Map([
  ['d5', 'the Drowned Wood has no region gate. It borders the village, the '
    + 'Cliffs, the dunes and the salt pans — four seams — so gating it is the '
    + 'one re-gate P9 did not attempt, and a player may walk into the fifth '
    + 'dungeon first. Not a break: the Shrine hands over the Reefseed its own '
    + 'later rooms need, so it is enterable early and not finishable early. '
    + 'The obvious key is the Cleats, which already own a tile (seaChannel) '
    + 'and would put the Wood level with the Cistern.'],
]);

console.log('\n--- no dungeon opens before the one before it ---');
for (let i = 1; i < DUNGEONS.length; i++) {
  const a = DUNGEONS[i - 1], b = DUNGEONS[i];
  const sa = firstSeen.get(a.map), sb = firstSeen.get(b.map);
  if (UNGATED.has(b.map)) {
    console.log(`  note  d${b.n} ${b.name} opens at step ${sb}, before d${a.n} at ${sa}:`);
    console.log(`        ${UNGATED.get(b.map).replace(/(.{68}) /g, '$1\n        ')}`);
    continue;
  }
  check(`d${b.n} ${b.name} does not open before d${a.n} ${a.name}`,
    sa != null && sb != null && sb >= sa, `d${a.n} at step ${sa}, d${b.n} at step ${sb}`);
}
// An exemption must name a real dungeon, or it is a typo that silently turns an
// assertion off — the failure mode every skip list in this repo has to guard.
for (const [map] of UNGATED) {
  check(`the ungated exemption '${map}' names a real dungeon`,
    DUNGEONS.some(d => d.map === map));
}

// --------------------------------------------------------------------------
// 3. NO KEY MAY OPEN A DOOR THAT STANDS IN FRONT OF ITSELF.
//
// The bug this file was written for, stated directly and checked directly, so
// it cannot come back through a gate this tool's closure happens to route
// around. For each dungeon's own key: flood with everything EXCEPT that key,
// and assert the dungeon's own mouth is still reachable.

console.log('\n--- no dungeon is locked behind its own item ---');
const allKeys = new Set([...DUNGEONS.flatMap(d => d.gives), ...GIVERS.map(g => g.key)]);
for (const d of DUNGEONS) {
  for (const key of d.gives) {
    if (!KEY_FLAG[key]) continue;                 // opens no region: nothing to prove
    const without = new Set([...allKeys].filter(k => k !== key));
    const r = flood(without);
    check(`d${d.n} ${d.name} is reachable without '${key}', which is its own`,
      r.has(d.mouth), `its mouth ${d.mouth} needs the item it hands over`);
    // ...and the same for every EARLIER dungeon, since a key found in d6 must
    // not stand in front of d4 either. That is the exact shape of what shipped.
    for (const e of DUNGEONS) {
      if (e.n >= d.n) continue;
      check(`  ...and so is d${e.n} ${e.name}, which comes before it`,
        r.has(e.mouth), `${e.mouth} is behind d${d.n}'s key`);
    }
  }
}

// --------------------------------------------------------------------------
// 4. THE HEART ECONOMY, which was also scaled for eight dungeons.
//
// P9's brief: three hearts at the start, half-heart contact damage from
// ordinary enemies, and six Heart Containers plus pieces landing the cap at
// 14–16. The first two were already true and are asserted here so they stay
// true; the third was not — eighteen pieces at four to a container is four
// containers and TWO WASTED PIECES, for a cap of thirteen.
//
// The count is read out of the world rather than written down, because a piece
// added or removed by a later session is exactly what this is here to catch.

console.log('\n--- the heart economy ---');
{
  const { newProgress, HEART_UNITS } = await import('../src/game/progress.js');
  const { ENEMY_SPECS } = await import('../src/game/enemy.js');
  const p = newProgress();
  const startHearts = p.maxHearts / HEART_UNITS;
  check('a new game starts with 3 hearts', startHearts === 3, String(startHearts));

  let pieces = 0;
  for (const [, map] of MAPS) {
    for (const [, d] of Object.entries(map.roomDefs || {})) {
      pieces += (JSON.stringify(d).match(/heartPiece/g) || []).length;
    }
  }
  const containers = DUNGEONS.length;               // one per boss
  const fromPieces = Math.floor(pieces / 4);
  const cap = startHearts + containers + fromPieces;
  console.log(`  ${pieces} Pieces of Heart, ${pieces % 4} of them spare;`
    + ` ${startHearts} + ${containers} containers + ${fromPieces} = ${cap} hearts`);
  check(`the heart cap lands in P9's 14-16 (it is ${cap})`, cap >= 14 && cap <= 16);
  check('no Piece of Heart is dead weight', pieces % 4 === 0,
    `${pieces % 4} piece(s) can never complete a container`);

  // "Half-heart contact damage from ordinary enemies": damage is in QUARTER
  // hearts, so half a heart is 2. Bosses and minibosses are allowed to hurt
  // more and are exempted by name; what must not happen is an ordinary enemy
  // taking a whole heart off a player who starts with three of them.
  //
  // ENEMY_SPECS holds only `defineEnemy` — bosses and minibosses go through
  // `defineBoss` and are not in it — so every entry here IS an ordinary enemy
  // and the rule applies to all of them with no exemption list to rot.
  const heavy = [...ENEMY_SPECS.entries()]
    .filter(([, s]) => (s.damage || 0) >= 4).map(([k, s]) => `${k}=${s.damage}`);
  const worst = Math.max(...[...ENEMY_SPECS.values()].map(s => s.damage || 0));
  console.log(`  ${ENEMY_SPECS.size} ordinary enemies, worst contact ${worst} quarter-hearts`
    + ` (${worst / 4} heart); bosses are defineBoss and are not counted here`);
  check('no ordinary enemy takes a whole heart on contact', heavy.length === 0, heavy.join(' '));
}

// --------------------------------------------------------------------------
// 5. The report. Printed rather than asserted: this IS the intended order and
// a session that changes it should see it change.

console.log('\n--- the order the world actually enforces ---');
const label = new Map(DUNGEONS.map(d => [d.map, `d${d.n} ${d.name}`]));
const rows = [...firstSeen.entries()].sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]));
for (const [k, s] of rows) {
  console.log(`  step ${s}: ${label.get(k) || k}`);
}
console.log(`  keys collected: ${[...keys].join(' ') || '(none)'}`);

console.log(`\n=== ${passed} passed, ${failures.length} failed ===`);
for (const f of failures) console.log('  ' + f);
process.exit(failures.length ? 1 : 0);
