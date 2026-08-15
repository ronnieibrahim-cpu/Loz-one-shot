// Overworld checker. Plain Node, no browser.
//
// Asserts all 120 screens exist, every seam's walkable edge tiles agree at all
// three tide levels, the world border is solid, and a TILE-BY-TILE flood from
// Tidewatch Village reaches every screen. Tile-by-tile matters: a screen-level
// flood misses an interior wall stranding an exit.
//
// The flood treats a tile as passable if it is walkable at ANY tide level — the
// player controls the tide — which is also why this cannot prove the swim or
// terrain-shaped gates, only the ones expressed as a solid tile with a flag.
//
// ROC'S FEATHER IS GONE and the hop is base moveset, so F.GAP no longer gates
// anything: a one-tile chasm is crossed by walking into it. The Coral Reef
// entry is removed rather than left failing. P9 re-gates the overworld.
//
// THREE such gates exist, and this proves each one twice: that the region is
// sealed without its item, and that it opens with it.
//   Bombs           F.BOMBABLE   Sunken Marsh
//   Magic Boomerang F.VANE       Salt Pans
//   Magnetic Gloves F.MAGNETIC   Abyssal approach
//
// Usage: node check-overworld.mjs [--bombs] [--items=bombs,rod,dredge]
// `--bombs` is kept as an alias for `--items=bombs`.

import { installData } from '../src/data/index.js';
import { MAPS, getRoom } from '../src/world/maps.js';
import { getLegend } from '../src/world/room.js';
import { getTileDef, F } from '../src/world/tileset.js';
import { GAP_HOP_MAX_SPAN } from '../src/data/feel.js';

installData();
// Each gate: the flag its tile carries, and the region it holds shut.
// `covers` is every screen the gate may legitimately shut: its own region, plus
// any region that can ONLY be entered through it. The Salt Pans gate covers the
// Reef Palace too, because the Palace's own gate is the Hookshot and the
// Hookshot is in D6, inside the Pans — so the whole branch hangs off one vane.
// Asserting the sealed set falls inside `covers` is the point: "the count went
// down" also passes when a gate accidentally strands an unrelated corner.
const GATES = {
  bombs: {
    flag: F.BOMBABLE, region: 'Sunken Marsh',
    covers: [[0, 3, 6, 9]],
  },
  // P9 CUT THIS ONE. The Cliffs of Kell used to be held shut by boulders, which
  // want the Dredge Line — and the Dredge Line is inside the Abyssal Keep,
  // which is reached THROUGH the Cliffs. That was a lock on the game rather
  // than a gate in it, and no checker in the repo could see it, because every
  // one of them asks "is the world reachable with everything" and never "is it
  // reachable in the order the dungeons hand things over". tools/check-
  // progression.mjs is the answer to that and this is what it found.
  //
  // The Cliffs and the Drowned Wood are now deep channels no conch drains, so
  // both open on the Kelp-Soled Cleats — D3's item, two dungeons before either
  // of the dungeons they lead to.
  cleats: {
    flag: F.SWIMGATE, swim: true, region: 'Cliffs of Kell and the Drowned Wood',
    // Nearly the whole north of the world: the Cleats are the hinge item, and
    // the Salt Pans and the Reef are reached THROUGH the Drowned Wood, so a
    // run without them loses those too. Stated as the branch rather than
    // trimmed to the two regions, because "the count went down" also passes
    // when an unrelated corner falls off the map.
    covers: [[0, 3, 0, 6], [4, 7, 0, 6], [8, 11, 0, 3]],
  },
  // THE ONE GATE NO ITEM OPENS. See F.SEAL in src/world/tileset.js: the last
  // dungeon cannot be held shut by an item, so it is held shut by the Essences
  // of the five before it.
  essences: {
    flag: F.SEAL, region: 'Abyssal approach',
    covers: [[0, 3, 0, 1]],
  },
  rod: {
    flag: F.VANE, region: 'Salt Pans',
    covers: [[4, 7, 0, 2], [8, 11, 0, 3]],
  },
};
const covered = (g, k) => {
  const [, x, y] = k.split(',').map(Number);
  return GATES[g].covers.some(([x0, x1, y0, y1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1);
};
const ALL = Object.keys(GATES);
const argItems = process.argv.find(a => a.startsWith('--items='));
let HELD = argItems ? argItems.slice(8).split(',').filter(Boolean)
         : process.argv.includes('--bombs') ? ['bombs'] : [];
for (const it of HELD) if (!GATES[it]) { console.error(`unknown item '${it}'`); process.exit(2); }
const BOMBS = HELD.includes('bombs');
// The mask of gate flags the current run may walk through.
let openMask = HELD.reduce((m, it) => m | GATES[it].flag, 0);
// A gate may also change HOW the player moves, not just which tile opens.
// The Cleats are the only one: holding them makes every deep tile a road,
// which is why the flood cannot model them as a flag alone.
const swimMask = () => ALL.some(it => GATES[it].swim && (openMask & GATES[it].flag));
const W = 10, H = 8, OW = 12, OH = 10;
const m = MAPS.get('overworld');

let pass = 0; const fail = [];
const check = (n, c, d) => c ? pass++ : (fail.push(n + (d ? ' — ' + d : '')), console.log('  FAIL ' + n + (d ? ' — ' + d : '')));

// A ROOM IS READ AS TILE NAMES, NOT AS CHARACTERS.
//
// A legend character used to be enough: one character, one tile, anywhere on
// any screen. A BLOCK breaks that — the nine H's of a shop are nine different
// tiles and which one a cell is depends on where in the footprint it sits — so
// this asks the engine's own expansion (`Room.expandBlocks`) rather than the
// legend, by building every screen and reading its resolved grid. A checker
// that kept reading characters would resolve 'block:bShop' through
// `getTileDef`, get the empty tile back, and flood straight through the shop.
const NAMES = new Map();
for (const [k, d] of Object.entries(m.roomDefs)) {
  const [f, rx, ry] = k.split(',').map(Number);
  const room = getRoom('overworld', f, rx, ry);
  NAMES.set(d, Array.from({ length: H }, (_, y) =>
    Array.from({ length: W }, (_, x) => room.baseName(x, y))));
}
/** The screen's grid of resolved tile NAMES. Named `l` at the call sites. */
const legendOf = (def) => NAMES.get(def);
function defAt(_grid, name, tide) {
  let d = getTileDef(name);
  for (let i = 0; i < 4 && d && d.tide; i++) d = getTileDef(d.tide[tide]);
  return d;
}
function walkableAt(grid, name, tide) {
  const d = defAt(grid, name, tide);
  if (!d) return false;
  if (openMask && (d.flags & openMask)) return true;
  // Deep water is a road once the Cleats are on, and a wall before that.
  if (swimMask() && (d.flags & F.DEEP) && !(d.flags & (F.SOLID | F.VOID))) return true;
  // A SEAL is not in the barrier list below because it is not any of those
  // things — it is its own flag, and leaving it out reads a sealed tile as
  // walkable, which is the whole world reachable and no gate proved.
  return !(d.flags & (F.VOID | F.SOLID | F.PIT | F.DEEP | F.LEDGE | F.HAZARD | F.JUMPABLE | F.SEAL));
}

// --- the base hop ----------------------------------------------------------
//
// ROC'S FEATHER IS GONE and the hop is base moveset: walking into a gap hops
// it, if the run of gap tiles is short enough and there is somewhere to land.
// The engine's rule is in Player.tryGapHop and its width is GAP_HOP_MAX_SPAN,
// which this reads rather than writing down — a checker that hardcodes a
// constant rots the moment the constant moves, and check-gates.mjs already had
// exactly that bug once (see docs/HANDOFF.md).
//
// So a gap tile is crossable when the run containing it, along at least one
// axis, is shorter than GAP_HOP_MAX_SPAN. Blanket-passing every F.JUMPABLE
// would walk the flood straight through the four-tile decorative chasm bands
// along the bottom of the Coral Reef, which no hop clears.
function isGap(l, ch) {
  const d = defAt(l, ch, 1);
  return !!(d && (d.flags & F.JUMPABLE));
}
function runLen(l, def, x, y, dx, dy) {
  let n = 1;
  for (let i = 1; ; i++) {
    const nx = x + dx * i, ny = y + dy * i;
    if (nx < 0 || ny < 0 || nx >= W || ny >= H || !isGap(l, l[ny][nx])) break;
    n++;
  }
  for (let i = 1; ; i++) {
    const nx = x - dx * i, ny = y - dy * i;
    if (nx < 0 || ny < 0 || nx >= W || ny >= H || !isGap(l, l[ny][nx])) break;
    n++;
  }
  return n;
}
function hoppable(l, def, x, y) {
  if (!isGap(l, l[y][x])) return false;
  return runLen(l, def, x, y, 1, 0) < GAP_HOP_MAX_SPAN
      || runLen(l, def, x, y, 0, 1) < GAP_HOP_MAX_SPAN;
}
/** Flood-passability WITH position, so the hop can be modelled properly. */
function passableAt(l, def, x, y) {
  return passable(l, l[y][x]) || hoppable(l, def, x, y);
}
// The player controls the tide, so a tile is passable if any level allows it.
const passable = (legend, ch) => [0, 1, 2].some(t => walkableAt(legend, ch, t));

// --- 0. how many gaps the base hop actually clears --------------------------
// Reported, not asserted: a wide gap is legitimate level design (the Coral
// Reef's four-tile chasm bands are meant to be walls), and a narrow one is a
// route. What matters is that the flood below models both the same way the
// engine does, which is what `hoppable` is for.
{
  let hop = 0, wall = 0;
  for (let ry = 0; ry < OH; ry++) for (let rx = 0; rx < OW; rx++) {
    const def = m.roomDefs[`0,${rx},${ry}`];
    if (!def) continue;
    const l = legendOf(def);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!isGap(l, l[y][x])) continue;
      if (hoppable(l, def, x, y)) hop++; else wall++;
    }
  }
  console.log(`  gap tiles: ${hop} hoppable, ${wall} too wide (GAP_HOP_MAX_SPAN=${GAP_HOP_MAX_SPAN})`);
}

// --- 1. every screen exists ------------------------------------------------
const missing = [];
for (let y = 0; y < OH; y++) for (let x = 0; x < OW; x++) {
  if (!m.roomDefs[`0,${x},${y}`]) missing.push(`0,${x},${y}`);
}
check(`all ${OW * OH} screens exist`, missing.length === 0, missing.join(','));

// --- 2. grids are 8 rows of 10 ---------------------------------------------
const shape = [];
for (const [k, d] of Object.entries(m.roomDefs)) {
  if (!Array.isArray(d.map) || d.map.length !== H || d.map.some(r => r.length !== W)) shape.push(k);
}
check('every grid is 8 rows of 10', shape.length === 0, shape.join(','));

// --- 3. seams agree at all three tide levels -------------------------------
// If A's east edge tile is walkable at tide t, B's west edge tile at the same
// row must be too, or the player walks off the screen into a wall.
const seams = [];
for (let y = 0; y < OH; y++) for (let x = 0; x < OW; x++) {
  const a = m.roomDefs[`0,${x},${y}`];
  if (!a) continue;
  const la = legendOf(a);
  for (const [dx, dy] of [[1, 0], [0, 1]]) {
    const b = m.roomDefs[`0,${x + dx},${y + dy}`];
    if (!b) continue;
    const lb = legendOf(b);
    const n = dx ? H : W;
    for (let i = 0; i < n; i++) {
      const ca = dx ? la[i][W - 1] : la[H - 1][i];
      const cb = dx ? lb[i][0] : lb[0][i];
      for (const t of [0, 1, 2]) {
        if (walkableAt(la, ca, t) !== walkableAt(lb, cb, t)) {
          seams.push(`0,${x},${y}->${dx ? 'E' : 'S'} row ${i} tide ${t}: '${ca}' vs '${cb}'`);
        }
      }
    }
  }
}
check('every seam agrees at all three tide levels', seams.length === 0, seams.slice(0, 4).join(' | '));

// --- 4. the world border is solid ------------------------------------------
const leaks = [];
for (let y = 0; y < OH; y++) for (let x = 0; x < OW; x++) {
  const d = m.roomDefs[`0,${x},${y}`];
  if (!d) continue;
  const l = legendOf(d);
  if (x === 0) for (let i = 0; i < H; i++) if (passable(l, l[i][0])) leaks.push(`0,${x},${y} W row ${i}`);
  if (x === OW - 1) for (let i = 0; i < H; i++) if (passable(l, l[i][W - 1])) leaks.push(`0,${x},${y} E row ${i}`);
  if (y === 0) for (let i = 0; i < W; i++) if (passable(l, l[0][i])) leaks.push(`0,${x},${y} N col ${i}`);
  if (y === OH - 1) for (let i = 0; i < W; i++) if (passable(l, l[H - 1][i])) leaks.push(`0,${x},${y} S col ${i}`);
}
check('the world border is solid', leaks.length === 0, leaks.slice(0, 4).join(' | '));

// --- 5. tile-by-tile flood from Tidewatch Village --------------------------
//
// Wrapped in a function so the same flood can be run under several item sets:
// proving a gate needs BOTH directions — that the region opens with the item,
// and that it is actually shut without it. A gate only checked one way is a
// gate that might not be a gate.
function flood() {
  const seen = new Set();
  const start = '0,4,7';
  const sd = m.roomDefs[start], sl = legendOf(sd);
  const q = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (passableAt(sl, sd, x, y)) { const k = `${start}:${x},${y}`; if (!seen.has(k)) { seen.add(k); q.push([start, x, y]); } }
  }
  while (q.length) {
    const [rk, x, y] = q.pop();
    const def = m.roomDefs[rk], l = legendOf(def);
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
      if (!passableAt(legendOf(m.roomDefs[trk]), m.roomDefs[trk], tx, ty)) continue;
      seen.add(k); q.push([trk, tx, ty]);
    }
  }
  const reached = new Set([...seen].map(k => k.split(':')[0]));
  const unreached = [];
  for (let y = 0; y < OH; y++) for (let x = 0; x < OW; x++) {
    if (!reached.has(`0,${x},${y}`)) unreached.push(`0,${x},${y}`);
  }
  return { reached, seen, unreached };
}

// The run the caller asked for, reported the way this tool always has.
{
  const { reached, seen, unreached } = flood();
  const label = HELD.length ? ` (with ${HELD.join(', ')})` : '';
  console.log(`  flood${label}: ${reached.size}/120 screens, ${seen.size} tiles`);
  if (unreached.length) console.log('  gated: ' + unreached.join(','));
}

// Holding everything must open the whole world. If this fails, some region is
// walled off by terrain rather than by a gate, which no item will fix.
{
  openMask = ALL.reduce((mask, it) => mask | GATES[it].flag, 0);
  const { unreached } = flood();
  check('with every gate item, all 120 screens are reachable',
    unreached.length === 0, unreached.join(','));
}

// ...and dropping each item in turn must shut its region, and ONLY its region.
// Checking that the count goes down is not enough: an unrelated screen falling
// off the map also makes the count go down.
for (const drop of ALL) {
  openMask = ALL.filter(it => it !== drop).reduce((mask, it) => mask | GATES[it].flag, 0);
  const { unreached } = flood();
  check(`without ${drop}, the ${GATES[drop].region} is sealed`,
    unreached.length > 0, 'nothing was gated');
  // Every other gate is open, so anything unreachable must be behind this one —
  // and must therefore lie inside the branch this gate is allowed to hold shut.
  const stray = unreached.filter(k => !covered(drop, k));
  check(`without ${drop}, nothing outside its branch is sealed`,
    stray.length === 0, stray.join(','));
  openMask = ALL.reduce((mask, it) => mask | GATES[it].flag, 0);
  console.log(`    ${drop}: seals ${unreached.length} screen(s)`);
}
openMask = HELD.reduce((mask, it) => mask | GATES[it].flag, 0);

// --- 5b. the same flood, over the FIELD rather than the scalar -------------
//
// `passable` above says a tile is walkable if it is walkable at ANY tide level,
// "because the player controls the tide". That is optimistic, and it was
// optimistic in a way nobody could see until the tide became a field: it grants
// the player a different tide level on every tile at once, which is not a thing
// the conch can do. The conch sets ONE level for the whole world, and to change
// it you have to survive the change where you are standing.
//
// So this models it properly. A state is (screen, tile, level). You may step to
// an adjacent tile walkable at the level you are on, or change the level where
// you stand — but only onto a level this tile is also walkable at, because a
// conch press that drowns you is not a move, it is an accident.
//
// The Anchor adds exactly one thing to that, and it is the reason it exists:
// it holds a patch of tiles at the level they were on while the base moves, so
// you can carry a level across a boundary instead of having to choose one. That
// is modelled as: from any reachable state, lay a patch of radius R around your
// own tile, then change the base freely — the patch keeps its level.
//
// Both are reported. If the honest model reaches fewer screens than the
// optimistic one, the difference is real and worth knowing about.
const R = 2;                     // ANCHOR_RADIUS_TILES; square footprint
function floodField({ anchor = false } = {}) {
  const start = '0,4,7';
  const seen = new Set();
  const q = [];
  const push = (rk, x, y, lv, ax, ay, al) => {
    // The anchor's state is its centre and the level it holds, or -1 for none.
    // It only matters inside the screen it was laid in, so it is dropped at the
    // seam — which is exactly what the engine does, since an override names the
    // room it belongs to.
    const k = `${rk}:${x},${y},${lv},${ax},${ay},${al}`;
    if (seen.has(k)) return;
    seen.add(k); q.push([rk, x, y, lv, ax, ay, al]);
  };
  const heldAt = (x, y, lv, ax, ay, al) =>
    (al >= 0 && Math.abs(x - ax) <= R && Math.abs(y - ay) <= R) ? al : lv;
  const ok = (rk, x, y, lv, ax, ay, al) => {
    const def = m.roomDefs[rk];
    if (!def) return false;
    const l = legendOf(def);
    if (walkableAt(l, l[y][x], heldAt(x, y, lv, ax, ay, al))) return true;
    // THE BASE HOP. Roc's Feather is gone and walking into a one-tile gap hops
    // it, so a gap narrow enough to clear is crossable at every tide level.
    // `walkableAt` cannot know that — it is told one tile — so the field flood
    // has to ask the same question the scalar flood does, or the Coral Reef
    // reads as nine unreachable screens. `hoppable` reads GAP_HOP_MAX_SPAN, so
    // the Reef's four-tile chasm bands stay walls.
    return hoppable(l, def, x, y);
  };

  const sd = m.roomDefs[start], sl = legendOf(sd);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    for (const lv of [0, 1, 2]) if (walkableAt(sl, sl[y][x], lv)) push(start, x, y, lv, -1, -1, -1);
  }
  while (q.length) {
    const [rk, x, y, lv, ax, ay, al] = q.pop();
    const [, rx, ry] = rk.split(',').map(Number);
    // change the base where you stand — you must survive it standing here
    for (const nl of [0, 1, 2]) {
      if (nl !== lv && ok(rk, x, y, nl, ax, ay, al)) push(rk, x, y, nl, ax, ay, al);
    }
    // lay or lift the anchor at your feet
    if (anchor) {
      if (al < 0) push(rk, x, y, lv, x, y, heldAt(x, y, lv, ax, ay, al));
      else push(rk, x, y, lv, -1, -1, -1);
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < W && ny < H) {
        if (ok(rk, nx, ny, lv, ax, ay, al)) push(rk, nx, ny, lv, ax, ay, al);
        continue;
      }
      // Off the edge: the anchor stays behind in the room it was laid in.
      const trk = `0,${rx + (nx < 0 ? -1 : nx >= W ? 1 : 0)},${ry + (ny < 0 ? -1 : ny >= H ? 1 : 0)}`;
      if (!m.roomDefs[trk]) continue;
      const tx = (nx + W) % W, ty = (ny + H) % H;
      if (ok(trk, tx, ty, lv, -1, -1, -1)) push(trk, tx, ty, lv, -1, -1, -1);
    }
  }
  const reached = new Set([...seen].map(k => k.split(':')[0]));
  const unreached = [];
  for (let y = 0; y < OH; y++) for (let x = 0; x < OW; x++) {
    if (!reached.has(`0,${x},${y}`)) unreached.push(`0,${x},${y}`);
  }
  return { reached, unreached, states: seen.size };
}

{
  openMask = ALL.reduce((mask, it) => mask | GATES[it].flag, 0);
  const plain = floodField();
  const withAnchor = floodField({ anchor: true });
  console.log(`  field flood: ${plain.reached.size}/120 screens (${plain.states} states), `
    + `with the Anchor ${withAnchor.reached.size}/120 (${withAnchor.states} states)`);
  check('with every gate item, the whole world is reachable under the FIELD model',
    withAnchor.unreached.length === 0, withAnchor.unreached.join(','));
  // The Anchor may only ever ADD reach. It is recallable from anywhere, so
  // nothing it does can be permanent — if it ever subtracted, the item could
  // lock a player out of a screen and the recall would not be enough to undo it.
  const lost = [...plain.reached].filter(k => !withAnchor.reached.has(k));
  check('the Anchor never removes reachability', lost.length === 0, lost.join(','));
}

// NO ANCHOR PLACEMENT CAN OPEN A GATE, and it is worth being precise about why
// rather than re-running the search five more times.
//
// All the Anchor can do to a tile is change which tide level it resolves at.
// `passable` above already treats a tile as walkable if it is walkable at ANY
// of the three levels, so the optimistic flood is an UPPER BOUND on anything
// any placement could achieve: if a region is sealed under `passable`, no
// arrangement of held water opens it. The per-gate checks above therefore
// already cover the Anchor, and running an anchor-aware flood per gate would
// cost a minute and a half to re-derive an answer that is fixed in advance.
//
// What is worth asserting is that the bound really is a bound — that the field
// model never reaches a screen the optimistic model does not. If that ever
// fails, the reasoning above is wrong and every gate proof in this file with it.
{
  openMask = ALL.reduce((mask, it) => mask | GATES[it].flag, 0);
  const optimistic = flood();
  const field = floodField({ anchor: true });
  const beyond = [...field.reached].filter(k => !optimistic.reached.has(k));
  check('the optimistic flood really does bound the field flood',
    beyond.length === 0, beyond.join(','));
}
openMask = HELD.reduce((mask, it) => mask | GATES[it].flag, 0);

// --- 6. no ledge is the only way anywhere ----------------------------------
// A ledge is impassable to the flood above, so if the flood reaches every screen
// the ledges cannot be load-bearing. Assert the ledge tiles themselves are all
// approachable from the north and land on ground the flood already reached.
const ledgeBad = [];
for (const [rk, def] of Object.entries(m.roomDefs)) {
  const l = legendOf(def);
  def.map.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch !== '_') return;
      if (y === 0 || y === H - 1) { ledgeBad.push(`${rk} ${x},${y}: on the border ring`); return; }
      if (!passable(l, l[y - 1][x])) ledgeBad.push(`${rk} ${x},${y}: nothing to approach from`);
      for (const t of [0, 1, 2]) {
        if (!walkableAt(l, l[y + 1][x], t)) ledgeBad.push(`${rk} ${x},${y}: landing not dry at tide ${t}`);
      }
    });
  });
}
check('every overworld ledge is approachable and lands on dry ground', ledgeBad.length === 0, ledgeBad.slice(0, 4).join(' | '));

console.log(`\n=== ${pass} passed, ${fail.length} failed ===`);
process.exit(fail.length ? 1 : 0);
