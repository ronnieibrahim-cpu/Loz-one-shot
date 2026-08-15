// Autotile prover. Plain Node, no DOM, no browser.
//
// WHAT IT IS FOR
//
// `Room.autotile` rewrites the authored grid of every room in the game before
// anything else sees it: a cliff character becomes whichever of sixteen family
// pieces matches its neighbours, so a mass gets a lit top, a base shadow, side
// returns and an outline that no author wrote. That is a cosmetic feature that
// edits SOLID TILES IN 273 ROOMS, and CLAUDE.md's most expensive trap is a
// solid tile that severs a screen while rendering fine and validating clean.
//
// `validate.mjs` proves the flags of each piece against its base, which is the
// static half. This is the dynamic half, and it is the assertion that actually
// matters:
//
//   BUILD EVERY ROOM TWICE — once as the game builds it, once with the
//   autotiler switched off — AND ASSERT THAT EVERY TILE OF EVERY ROOM HAS
//   IDENTICAL FLAGS AT ALL THREE TIDE LEVELS.
//
// If that holds, autotiling provably cannot have stranded a room, opened a
// gate, moved a wall or changed a single answer any other checker in the repo
// gives. Nothing short of comparing the two worlds says so: the flags live on
// the tiledefs, the pieces are chosen at construction, and every downstream
// tool sees only the finished grid.
//
// It proves four more things and prints the census:
//
//   * the pass never crosses palettes — a `cliffDk` becomes a `cliffDk_*` and
//     never a `cliffMarble_*`, which is how a region keeps its colour;
//   * OFF-ROOM COUNTS AS SAME, so no tile on a room's border carries an open
//     bit pointing out of the room. A cliff running off a screen must grow no
//     coping against the seam or every screen boundary in the game gets a
//     bright line down it;
//   * every tile that declares an autotile family is either autotiled or on a
//     short, named exemption list. This is the one that will catch the next
//     session: adding a `cliffTide` variant and forgetting to register its
//     family table leaves one cliff in the world with no edges and nothing
//     else notices;
//   * a family the world never places is reported as a note, the way
//     check-towns.mjs reports an unplaced ground variant — a checker that
//     failed on it would be commissioning content.

import { installData } from '../src/data/index.js';
import { TILES, AUTOTILE } from '../src/world/tileset.js';
import { MAPS, getRoom } from '../src/world/maps.js';
import { Room } from '../src/world/room.js';

installData();

let passed = 0;
const failures = [];
function check(what, ok, detail) {
  if (ok) { passed++; console.log('  ok   ' + what); }
  else { failures.push(what + (detail ? ' — ' + detail : '')); console.log('  FAIL ' + what + (detail ? ' — ' + detail : '')); }
}

// The tiles that are in a family for MATCHING but are deliberately never
// replaced. Each needs a reason, because "it does not autotile" is otherwise
// indistinguishable from "somebody forgot".
const EXEMPT = new Map([
  ['cliffTop', 'a plateau top an author places on purpose, in the middle of a mass'],
  ['cliffCracked', 'a fault line runs the height of the tile; a coping over it hides the crack'],
  ['cliffCrackedDk', 'the same, in the dark palette'],
]);

// Which piece belongs to which base, resolved once so the comparison below
// does not have to parse names.
const OWNER = new Map();
for (const [base, pieces] of AUTOTILE) {
  for (let m = 0; m < 16; m++) OWNER.set(pieces[m], { base, mask: m });
}

// --- every room, built both ways -------------------------------------------
console.log('--- autotiling changes the look and nothing else ---');

const rooms = [];
for (const [id, map] of MAPS) {
  for (const key of Object.keys(map.roomDefs || {})) {
    const [f, x, y] = key.split(',').map(Number);
    const live = getRoom(id, f, x, y);
    if (live) rooms.push({ id, key, map, def: map.roomDefs[key], live });
  }
}

const census = new Map();
const masks = new Array(16).fill(0);
let placedTiles = 0, placedRooms = 0;
let crossed = 0, seamOpen = 0, unplacedPieceNames = 0;

for (const r of rooms) {
  let hit = false;
  for (let i = 0; i < r.live.base.length; i++) {
    const own = OWNER.get(r.live.base[i]);
    if (!own) continue;
    hit = true;
    placedTiles++;
    masks[own.mask]++;
    census.set(own.base, (census.get(own.base) || 0) + 1);
  }
  if (hit) placedRooms++;
}
check(`the autotiler fires: ${placedTiles} tiles in ${placedRooms} of ${rooms.length} rooms`,
  placedTiles > 0, 'no room in the game contains an autotiled tile');

// Now switch it off and rebuild. AUTOTILE is the registry `Room.autotile`
// consults, so emptying it makes the pass a no-op without a flag threaded
// through the engine for a checker's benefit. `getRoom` memoises, so these are
// constructed directly rather than fetched.
const saved = [...AUTOTILE.entries()];
AUTOTILE.clear();
const plain = rooms.map(r => new Room(r.def, r.key, r.map));
for (const [k, v] of saved) AUTOTILE.set(k, v);

let flagDiffs = 0, sizeDiffs = 0, nameDiffs = 0, firstDiff = null;
for (let n = 0; n < rooms.length; n++) {
  const a = rooms[n].live, b = plain[n];
  if (a.tw !== b.tw || a.th !== b.th) { sizeDiffs++; continue; }
  for (let ty = 0; ty < a.th; ty++) {
    for (let tx = 0; tx < a.tw; tx++) {
      const i = ty * a.tw + tx;
      for (let lvl = 0; lvl < 3; lvl++) {
        if (a.flagsAt(tx, ty, lvl) !== b.flagsAt(tx, ty, lvl)) {
          flagDiffs++;
          if (!firstDiff) firstDiff = `${rooms[n].id}/${rooms[n].key} ${tx},${ty} at level ${lvl}: `
            + `'${a.base[i]}' ${a.flagsAt(tx, ty, lvl)} vs '${b.base[i]}' ${b.flagsAt(tx, ty, lvl)}`;
        }
      }
      // The only names allowed to differ are a base and one of its own pieces.
      if (a.base[i] !== b.base[i]) {
        const own = OWNER.get(a.base[i]);
        if (!own || own.base !== b.base[i]) { nameDiffs++; }
        if (own && own.base !== b.base[i]) crossed++;
      }
    }
  }
}

check('every room builds to the same size with the autotiler off', sizeDiffs === 0,
  `${sizeDiffs} room(s) differ`);
check('every tile of every room has identical flags at all three tide levels',
  flagDiffs === 0, firstDiff || `${flagDiffs} difference(s)`);
check('the only names that changed are a family base becoming one of its own pieces',
  nameDiffs === 0, `${nameDiffs} tile(s) changed into something else`);
check('no tile crossed families: a region keeps its palette', crossed === 0,
  `${crossed} tile(s) took another family's piece`);

// --- off-room counts as same ------------------------------------------------
//
// A cliff run leaving the screen must grow no edge against the seam. The bit
// layout is 1 N, 2 E, 4 S, 8 W.
console.log('\n--- a mass running off the screen grows no edge against the seam ---');
for (const r of rooms) {
  const a = r.live;
  for (let ty = 0; ty < a.th; ty++) {
    for (let tx = 0; tx < a.tw; tx++) {
      const own = OWNER.get(a.base[ty * a.tw + tx]);
      if (!own) continue;
      const bad = (ty === 0 && (own.mask & 1)) || (tx === a.tw - 1 && (own.mask & 2))
        || (ty === a.th - 1 && (own.mask & 4)) || (tx === 0 && (own.mask & 8));
      if (bad) {
        seamOpen++;
        if (seamOpen === 1) console.log(`       first: ${r.id}/${r.key} ${tx},${ty} mask ${own.mask}`);
      }
    }
  }
}
check('no border tile carries an open bit pointing out of its room', seamOpen === 0,
  `${seamOpen} tile(s) drew an edge against a screen seam`);

// --- nothing in a family is left without one --------------------------------
console.log('\n--- every tile that declares a family is autotiled or named as an exception ---');
const orphans = [];
for (const [name, d] of TILES) {
  if (!d.family) continue;
  if (OWNER.has(name)) continue;              // a piece is not a base
  if (AUTOTILE.has(name)) continue;
  if (EXEMPT.has(name)) continue;
  orphans.push(name);
}
check('no tile declares a family without a piece table or a reason', orphans.length === 0,
  orphans.join(' '));
for (const [name, why] of EXEMPT) {
  check(`'${name}' is deliberately not autotiled: ${why}`, TILES.has(name), 'no such tile');
}

// --- census -----------------------------------------------------------------
console.log('\n--- census ---');
for (const [base] of AUTOTILE) {
  const n = census.get(base) || 0;
  console.log(`  ${base.padEnd(14)} ${String(n).padStart(5)} tile(s)`);
}
const unplaced = [...AUTOTILE.keys()].filter(b => !census.has(b));
if (unplaced.length) {
  console.log(`  note: ${unplaced.length} family/families registered and unplaced: ${unplaced.join(' ')}`);
}
console.log('  masks (1 N, 2 E, 4 S, 8 W open): '
  + masks.map((v, i) => `${i}:${v}`).filter(s => !s.endsWith(':0')).join('  '));

console.log(`\n=== ${passed} passed, ${failures.length} failed ===`);
for (const f of failures) console.log('  ' + f);
process.exit(failures.length ? 1 : 0);
