// Reefseed prover. Plain Node, no DOM, no browser. The fifth of the item
// provers, after check-anchor.mjs, check-lens.mjs, check-cleats.mjs and
// check-bellows.mjs.
//
// WHAT IT IS FOR
//
// The four items before this one each had a different reason their rooms were
// hard to prove. The Anchor did not FIT in a room. The Lens could not be
// REQUIRED by terrain at all. The Cleats were required by every deep tile in
// the game the moment they existed. The Bellows took your feet while you used
// them. The Reefseed's problem is the flattest of the five and it is worth
// writing down before anything else, because it decides the whole dungeon:
//
//   A PILLAR CANNOT OPEN A PATH.
//
// `Reefseed.canPlant` refuses any tile carrying SOLID, PIT or VOID at ANY tide
// level, not merely the current one. So a seed may only be grown where the
// player could already stand or already swim, and the tile it leaves behind is
// floor at LOW, a wall at MID and deep water at HIGH. Everything the item does,
// it does by putting ground where there was sea — never by removing a wall.
//
// That is not a defect, it is the design, and the Drowned Wood Shrine is built
// on the two consequences of it that no other item in the game has:
//
//   1. A PILLAR IS GROUND AT LOW AND AT LOW ONLY. A push block cannot be
//      shoved into deep water (`PushBlock.push` asks `canOccupy` with
//      `swim: false`), it cannot be shoved into a wall, and the pillar is
//      exactly one of those three things at each of the three seas. So a block
//      crosses a pillar at LOW and at no other level.
//   2. YOU CANNOT PLANT A STAKE FROM THE WATER. `ITEMS.reefseed.use` refuses
//      while `inDeep || underwater`, on the same grounds the Squall Bellows
//      refuse. That is what makes THROWING RANGE MEAN ANYTHING: a seed carries
//      exactly two tiles, so a stake more than two tiles from dry footing can
//      only be planted from another stake.
//
// And the tide is the constraint because those two pull against each other. A
// stake is thrown over a DROWNED BOLE (`dSnag`: a tree that is solid at LOW and
// MID and open water at HIGH) which no seed clears at any lower sea — so the
// first stake in a room must be thrown at HIGH. And a stake is only ground at
// LOW — so the second stake, thrown from the first, must be thrown at LOW.
// Neither half can be bought at the other's sea.
//
// WHAT IS PROVED, per room declaring
//
//   reefseedRoom: {
//     stakes: [{ at:[x,y], from:[x,y], face, sea }, ...],   // in order
//     block:  [x,y], target: [x,y],       // optional: a block that must cross
//     opens:  [[x,y], ...], gives: 'key', // optional
//   }
//
// Per stake, in the order the room is played, with every earlier stake already
// grown:
//
//   1. THE STAKE IS SEA, NOT GROUND. Deep water at every tide level as the
//      room ships, so nothing walks it and nothing is pushed onto it until a
//      pillar exists.
//   2. AND A PILLAR MAY LAWFULLY GROW THERE. `Reefseed.canPlant`'s terrain
//      clauses, re-derived here, at every level. A stake the engine would
//      refuse is a room that fails in total silence: the seed is spent, the
//      bud puffs, and every other checker still calls the dungeon solved.
//   3. A PILLAR THERE IS GROUND AT LOW AND ONLY AT LOW. Walkable at LOW; not
//      walkable and not enterable by a block at MID or HIGH.
//   4. THE DECLARED THROW LANDS ON IT. The seed's flight is simulated frame by
//      frame off feel.js — the arc, the two-pixel carry, and `room.solidAt`
//      with the thrown seed's own caps — from the declared tile, facing and sea.
//   5. THERE IS SOMEWHERE TO THROW FROM. The declared `from` tile is reachable
//      at that sea and is dry footing there, which for every stake after the
//      first means the previous pillar is what makes it so.
//   6. AND NO OTHER SEA WILL DO. THIS IS THE LOAD-BEARING ASSERTION. From
//      every tile the player can reach at every level, in every facing, in
//      any mode they own, a seed thrown from dry footing lands on this stake
//      ONLY at the declared sea. Drop this clause and the answer to every room
//      in the dungeon is "stand on the bank and throw", and the bole, the
//      order and the conch are all decoration.
//   7. THE ROOM NEEDS TWO SEAS. The stakes of a room are not all thrown at the
//      same level, so no fixed tide answers it.
//
// Per room:
//
//   8. NOTHING THE PLAYER CAN BUILD CAN BRICK THE ROOM. A pillar is permanent
//      and SOLID at MID, and the player may grow one anywhere a seed reaches.
//      So for every tile a stray seed can plant on, a pillar there must leave
//      every doorway of the room joined to every other, at all three levels.
//      This is CLAUDE.md's "a solid tile can strand a room" trap with the
//      player holding the trowel, and it is the one failure mode in this
//      dungeon that no other tool in the repo could ever see.
//   9. THE BLOCK CROSSES ON THE STAKES AND ON NOTHING ELSE. With the stakes
//      grown, at LOW, the declared block can be walked to its target one tile
//      per push, each push made from a tile the player can occupy — and with
//      the stakes absent it cannot reach the target at any level.
//  10. THE STAKES BUY SOMETHING. Every tile in `opens` is a shut door that
//      separates its room at all three levels, and a room that `gives` a
//      reward from a script puts it back in `onEnter` (D4's soft lock).
//
// And globally: no Reefseed room before the dungeon that hands the Reefseed
// over, every push block in a declared room is one the room declares, and no
// room asks for more seeds than the satchel holds.
//
// THE MODEL, and where its edges are
//
//   * The flight is REPRODUCED from feel.js, not imported, for the same reason
//     check-bellows.mjs reproduces the cone: items.js reaches for a canvas on
//     the way in. It is re-derived from the constants rather than from a number
//     written here, so retuning the throw re-proves every room. What confirms
//     the reproduction against the engine is the `d5-overthrow` replay, which
//     throws a real seed at a real bole and asserts where it lands.
//   * `moveEntity`'s corner nudge is not modelled. Every throw here is
//     cardinal and starts tile-aligned, so the nudge has nothing to free.
//   * A state is a tile and the level is a parameter, as in check-bellows.mjs.
//     Proving each level independently is stricter than modelling the conch.
//   * The player of dungeon five owns the Kelp-Soled Cleats, so deep water is
//     floor in two different ways and only walls and pits are barriers.
//
// Usage: node tools/check-reefseed.mjs [--verbose]

import { MAPS } from '../src/world/maps.js';
import { getLegend } from '../src/world/room.js';
import { F, getTileDef, transformFor } from '../src/world/tileset.js';
import { REEFSEED_PLANT_BLOCK } from '../src/game/items.js';
import { installData } from '../src/data/index.js';
import {
  REEFSEED_THROW_SPEED, REEFSEED_SETTLE_FRAMES, REEFSEED_CAPACITY,
  THROW_ARC_RISE, THROW_ARC_GRAVITY, GAP_HOP_MAX_SPAN,
} from '../src/data/feel.js';
import { defWalkable, defSolid, capsForMode, ROUTE_AVOID } from './lib/collision.mjs';

installData();

const VERBOSE = process.argv.includes('--verbose');
const LEVELS = [0, 1, 2];
const LEVEL_NAME = ['LOW', 'MID', 'HIGH'];
const TILE = 16;
const FP = 256;
const MODES = ['foot', 'swim', 'sink'];
const DIR_VEC = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const toPx = (v) => v >> 8;

let passed = 0; const failures = [];
function check(name, cond, detail) {
  if (cond) { passed++; console.log('  ok   ' + name); }
  else { failures.push(name + (detail ? ' — ' + detail : '')); console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); }
}

// --- tiles ------------------------------------------------------------------
function defOf(name, level) {
  let d = getTileDef(name);
  for (let i = 0; i < 4 && d && d.tide; i++) d = getTileDef(d.tide[level]);
  return d;
}
function defAt(legend, ch, level) { return defOf(legend[ch], level); }

const isDeep = (d) => !!d && !!(d.flags & F.DEEP);

function walkableDef(d) {
  if (!d) return false;
  if (d.flags & F.STAIRS) return true;
  return defWalkable(d, capsForMode('foot'), ROUTE_AVOID);
}

/**
 * Can a body in this mode occupy the tile at all? Cleats cross deep water.
 * Asked of the engine's own `tileDefSolid` via `defWalkable`/`capsForMode`
 * (tools/lib/collision.mjs), not a private re-derivation.
 */
function occupiable(d, mode) {
  if (!d) return false;
  if (d.flags & F.STAIRS) return true;
  return defWalkable(d, capsForMode(mode), ROUTE_AVOID);
}

/**
 * Somewhere a seed may be thrown from. `ITEMS.reefseed.use` refuses while
 * `inDeep || underwater`, so the sea is not a throwing position however
 * comfortably the player is floating in it. Shallow water is.
 */
const canThrowFrom = (d) => walkableDef(d);

/**
 * `PushBlock.push`'s test on the destination tile: `canOccupy` with
 * `{ jumping: false, swim: false }`, which is `room.solidAt` with no caps —
 * asked of the engine's own `defSolid` (tools/lib/collision.mjs), not a
 * private copy of the formula. Deep water, walls, ledges and gaps all refuse;
 * a pillar at LOW does not.
 */
function blockCanEnter(d) {
  return !defSolid(d, { jumping: false, swim: false, cutting: false });
}

/** `Reefseed.canPlant`'s terrain clauses, at every level — the engine's own
 * `REEFSEED_PLANT_BLOCK` mask, not a retyped copy of it. */
function plantableTerrain(nameAt) {
  for (const l of LEVELS) {
    const d = defOf(nameAt, l);
    if (!d) return false;
    if (d.flags & REEFSEED_PLANT_BLOCK) return false;
  }
  return getTileDef(nameAt) !== getTileDef('coralPillar');
}

// --- a room, as a grid of tile names we can overwrite with pillars -----------
class Board {
  constructor(r) {
    this.W = r.W; this.H = r.H;
    this.names = [];
    for (let y = 0; y < r.H; y++) {
      const row = [];
      for (let x = 0; x < r.W; x++) row.push(r.legend[r.grid[y][x]]);
      this.names.push(row);
    }
  }
  clone() { const b = Object.create(Board.prototype); b.W = this.W; b.H = this.H; b.names = this.names.map(r => r.slice()); return b; }
  inside(x, y) { return x >= 0 && y >= 0 && x < this.W && y < this.H; }
  name(x, y) { return this.inside(x, y) ? this.names[y][x] : null; }
  def(x, y, l) { return this.inside(x, y) ? defOf(this.names[y][x], l) : null; }
  plant(x, y) { this.names[y][x] = 'coralPillar'; }
  /** `room.solidAt` for a body with these caps, tile-resolution — asked of the
   * engine's own `defSolid` (tools/lib/collision.mjs), not a private copy. */
  solid(x, y, l, caps) {
    if (!this.inside(x, y)) return true;
    return defSolid(this.def(x, y, l), caps);
  }
}

/** Every tile reachable in one board at one level in one mode, from every way in. */
function flood(board, level, mode, seeds) {
  const ok = (x, y) => occupiable(board.def(x, y, level), mode);
  const seen = new Set(), q = [];
  const push = (x, y) => { const k = x + ',' + y; if (!seen.has(k)) { seen.add(k); q.push([x, y]); } };
  if (seeds) { for (const [x, y] of seeds) if (ok(x, y)) push(x, y); }
  else {
    for (let y = 0; y < board.H; y++) for (let x = 0; x < board.W; x++) {
      if ((x === 0 || y === 0 || x === board.W - 1 || y === board.H - 1) && ok(x, y)) push(x, y);
    }
  }
  while (q.length) {
    const [x, y] = q.pop();
    const here = board.def(x, y, level);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (ok(nx, ny)) { push(nx, ny); continue; }
      // A hop, and only from dry footing, exactly as check-bellows.mjs has it:
      // the engine hops F.JUMPABLE and nothing else.
      if (isDeep(here) || mode === 'sink') continue;
      const first = board.def(nx, ny, level);
      if (!first || !(first.flags & F.JUMPABLE) || (first.flags & F.NOFLY)) continue;
      let n = 1;
      while (n < GAP_HOP_MAX_SPAN) {
        const d = board.def(x + dx * (n + 1), y + dy * (n + 1), level);
        if (!d || !(d.flags & F.JUMPABLE)) break;
        n++;
      }
      if (n >= GAP_HOP_MAX_SPAN) continue;
      if (walkableDef(board.def(x + dx * (n + 1), y + dy * (n + 1), level))) push(x + dx * (n + 1), y + dy * (n + 1));
    }
  }
  return seen;
}

/** Everywhere the player can get to at this level, in any mode they own. */
function reachable(board, level) {
  const out = new Set();
  for (const mode of MODES) for (const k of flood(board, level, mode)) out.add(k);
  return out;
}

/**
 * Where a Reefseed thrown from tile (tx,ty) facing `dir` at this level plants,
 * or null if it never plants inside the room.
 *
 * `Reefseed`'s own numbers: it spawns at the player's centre offset six pixels
 * along the facing, carries REEFSEED_THROW_SPEED sp/f, rises at THROW_ARC_RISE
 * and falls by THROW_ARC_GRAVITY, and plants the frame its height reaches the
 * ground or its settle runs out — whichever comes first, which in practice is
 * always the arc. It flies with `{ jumping: true, swim: true }`, and
 * `room.solidAt` refuses a SOLID tile to a flying body exactly as it does to a
 * walking one. That last sentence is the whole of the drowned bole.
 */
function throwLands(board, tx, ty, dir, level) {
  const [dx, dy] = DIR_VEC[dir];
  let fx = (tx * TILE + dx * 6) * FP;
  let fy = (ty * TILE + dy * 6) * FP;
  let fz = 10 * FP;
  let vx = dx * REEFSEED_THROW_SPEED, vy = dy * REEFSEED_THROW_SPEED;
  let vz = THROW_ARC_RISE;
  let settle = REEFSEED_SETTLE_FRAMES;
  const caps = { jumping: true, swim: true, cutting: false };
  // The seed's hitbox is { x:4, y:5, w:8, h:8 }; sampleAxis on an 8-wide span
  // gives just the two edges.
  const free = (px, py) => {
    for (const sy of [py + 5, py + 12]) {
      for (const sx of [px + 4, px + 11]) {
        if (board.solid(Math.floor(sx / TILE), Math.floor(sy / TILE), level, caps)) return false;
      }
    }
    return true;
  };
  for (let i = 0; i < 240; i++) {
    fz += vz; vz -= THROW_ARC_GRAVITY;
    if (vx !== 0) {
      const nfx = fx + vx;
      if (free(toPx(nfx), toPx(fy))) fx = nfx; else vx = 0;
    }
    if (vy !== 0) {
      const nfy = fy + vy;
      if (free(toPx(fx), toPx(nfy))) fy = nfy; else vy = 0;
    }
    if (--settle > 0 && fz > 0) continue;
    const cx = toPx(fx) + 8, cy = toPx(fy) + 8;
    const px = Math.floor(cx / TILE), py = Math.floor(cy / TILE);
    return board.inside(px, py) ? [px, py] : null;
  }
  return null;
}

/** Does the door at (x,y) cut its two neighbours apart on some axis, at every level? */
function doorSeparates(board, x, y) {
  const walk = (px, py, t) => walkableDef(board.def(px, py, t));
  const cuts = (ax, ay, t) => {
    const a = [x - ax, y - ay], b = [x + ax, y + ay];
    if (!walk(a[0], a[1], t) || !walk(b[0], b[1], t)) return false;
    const seen = new Set([a.join(',')]), q = [a];
    while (q.length) {
      const [cx, cy] = q.pop();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy;
        if (nx === x && ny === y) continue;
        if (!occupiable(board.def(nx, ny, t), 'swim')) continue;
        const k = nx + ',' + ny;
        if (seen.has(k)) continue;
        seen.add(k); q.push([nx, ny]);
      }
    }
    return !seen.has(b.join(','));
  };
  return [[1, 0], [0, 1]].some(([ax, ay]) => LEVELS.every(t => cuts(ax, ay, t)));
}

/**
 * Can the block be walked from `start` to `target`, one tile per push?
 *
 * A push needs the destination occupiable by a BLOCK and the tile behind
 * occupiable by the PLAYER — and the player has to be able to get to that tile
 * with the block where it currently is, which is why the reachability is
 * recomputed per block position rather than once. Blocks are declared
 * `once: false` in this dungeon; a `once` block would move one tile ever and
 * the search below would be wrong in the generous direction, so it is refused.
 */
function blockRoute(board, start, target, level, playerFrom) {
  const key = (p) => p.join(',');
  const seen = new Set([key(start)]);
  const q = [start];
  while (q.length) {
    const b = q.shift();
    if (b[0] === target[0] && b[1] === target[1]) return true;
    // The block itself is solid to the player, so the flood is run on a board
    // with the block's tile walled off.
    const bb = board.clone();
    bb.names[b[1]][b[0]] = 'dWall';
    const reach = new Set();
    for (const mode of MODES) for (const k of flood(bb, level, mode, playerFrom)) reach.add(k);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const dest = [b[0] + dx, b[1] + dy];
      const behind = [b[0] - dx, b[1] - dy];
      if (!board.inside(dest[0], dest[1]) || !board.inside(behind[0], behind[1])) continue;
      if (!blockCanEnter(board.def(dest[0], dest[1], level))) continue;
      if (!reach.has(key(behind))) continue;
      if (seen.has(key(dest))) continue;
      seen.add(key(dest)); q.push(dest);
    }
  }
  return false;
}

/** Every doorway a room has: the openings on its border rows and columns. */
function doorways(board) {
  const out = [];
  for (let x = 0; x < board.W; x++) {
    for (const y of [0, board.H - 1]) if (LEVELS.some(l => walkableDef(board.def(x, y, l)))) out.push([x, y]);
  }
  for (let y = 0; y < board.H; y++) {
    for (const x of [0, board.W - 1]) if (LEVELS.some(l => walkableDef(board.def(x, y, l)))) out.push([x, y]);
  }
  return out;
}

// --- collect the declared rooms --------------------------------------------
const rooms = [];
for (const [mapId, m] of MAPS) {
  for (const [key, def] of Object.entries(m.roomDefs || {})) {
    if (!def.reefseedRoom) continue;
    const sz = def.size || [1, 1];
    rooms.push({
      mapId, key, name: def.name || key,
      index: (m.dungeon && m.dungeon.index) | 0,
      item: m.dungeon && m.dungeon.item,
      W: (sz[0] | 0) * 10, H: (sz[1] | 0) * 8,
      grid: def.map, legend: getLegend(def.legend || m.legend),
      def, R: def.reefseedRoom,
    });
  }
}

console.log(`  a seed carries ${(REEFSEED_THROW_SPEED / FP).toFixed(2)} px/f, `
  + `settles after ${REEFSEED_SETTLE_FRAMES}f, satchel holds ${REEFSEED_CAPACITY}`);

check('at least one room declares a Reefseed room', rooms.length > 0, 'nothing to prove');

{
  const early = rooms.filter(r => r.index < 5);
  check('no Reefseed room comes before the Reefseed', early.length === 0,
    early.map(r => `${r.mapId} ${r.key}`).join(', '));
}

// Every push block inside a declared room is one the room declares, and it is
// pushable more than once. A `once` block crosses one tile ever and no stake
// could carry it anywhere.
{
  const strays = [], sticky = [];
  for (const r of rooms) {
    for (const e of r.def.entities || []) {
      if (e[0] !== 'block') continue;
      const B = r.R.block;
      if (!B || B[0] !== e[1] || B[1] !== e[2]) { strays.push(`${r.mapId} ${r.key}: block at ${e[1]},${e[2]}`); continue; }
      if (!e[3] || e[3].once !== false) sticky.push(`${r.mapId} ${r.key}: block at ${e[1]},${e[2]} moves one tile ever`);
    }
    if (r.R.block && !(r.def.entities || []).some(e => e[0] === 'block' && e[1] === r.R.block[0] && e[2] === r.R.block[1])) {
      strays.push(`${r.mapId} ${r.key}: declares a block at ${r.R.block.join(',')} that is not there`);
    }
  }
  check('every push block in a stake room is one the room declares', strays.length === 0, strays.join(' | '));
  check('every push block in a stake room can be pushed more than once', sticky.length === 0, sticky.join(' | '));
}

// No room asks for more seeds than the satchel holds.
{
  const greedy = rooms.filter(r => r.R.stakes.length > REEFSEED_CAPACITY);
  check(`no room needs more than ${REEFSEED_CAPACITY} seeds`, greedy.length === 0,
    greedy.map(r => `${r.key} wants ${r.R.stakes.length}`).join(', '));
}

// --- per room ---------------------------------------------------------------
for (const r of rooms) {
  const where = `${r.mapId} ${r.key} (${r.name})`;
  const base = new Board(r);
  const built = base.clone();          // stakes accumulate into this one
  // Reachability as the PLAYER meets it: from the door the room is entered by,
  // with the snarl still standing. `reachable` floods from every border tile,
  // which is the right generosity for an unreachability claim and the wrong one
  // for "can I get there from here".
  const nearReach = (board, l) => {
    if (!r.R.entry) return reachable(board, l);
    const out = new Set();
    for (const mode of MODES) for (const k of flood(board, l, mode, [r.R.entry])) out.add(k);
    return out;
  };

  for (let i = 0; i < r.R.stakes.length; i++) {
    const s = r.R.stakes[i];
    const S = s.at.join(','), tag = `${where} stake ${i + 1}`;
    const before = built.clone();      // the room as it is when this seed flies

    // 1. the stake is sea, not ground
    {
      const bad = LEVELS.filter(l => !isDeep(base.def(s.at[0], s.at[1], l)));
      check(`${tag}: ${S} is open water at every sea`, bad.length === 0,
        'it is ' + bad.map(l => `${LEVEL_NAME[l]}:${(base.def(s.at[0], s.at[1], l) || {}).name}`).join(', ')
        + ' — something already stands there');
    }

    // 2. and a pillar may lawfully grow there
    check(`${tag}: the engine will let a pillar grow at ${S}`,
      plantableTerrain(base.name(s.at[0], s.at[1])),
      `canPlant refuses ${base.name(s.at[0], s.at[1])} — the seed is spent and nothing happens`);

    // 3. a pillar there is ground at LOW and only at LOW
    {
      const p = LEVELS.map(l => defOf('coralPillar', l));
      check(`${tag}: a pillar at ${S} is ground at LOW`, walkableDef(p[0]) && blockCanEnter(p[0]),
        `coralPillar is ${p[0].name} at LOW`);
      check(`${tag}: and is not ground at MID or HIGH`,
        !walkableDef(p[1]) && !blockCanEnter(p[1]) && !walkableDef(p[2]) && !blockCanEnter(p[2]),
        `MID ${p[1].name}, HIGH ${p[2].name}`);
    }

    // 4 & 5. the declared throw lands on it, from somewhere you can be
    {
      const land = throwLands(before, s.from[0], s.from[1], s.face, s.sea);
      check(`${tag}: thrown from ${s.from.join(',')} facing ${s.face} at ${LEVEL_NAME[s.sea]} it lands on ${S}`,
        !!land && land[0] === s.at[0] && land[1] === s.at[1],
        'it lands on ' + (land ? land.join(',') : 'nothing'));
      const d = before.def(s.from[0], s.from[1], s.sea);
      check(`${tag}: ${s.from.join(',')} is dry footing at ${LEVEL_NAME[s.sea]}`, canThrowFrom(d),
        `${d ? d.name : 'nothing'} — a seed cannot be planted from the water`);
      check(`${tag}: and it can be got to at ${LEVEL_NAME[s.sea]}`,
        nearReach(before, s.sea).has(s.from.join(',')),
        'nothing reaches ' + s.from.join(','));
    }

    built.plant(s.at[0], s.at[1]);
  }

  // 6. THE LOAD-BEARING CLAUSE: LOW does not build the room.
  //
  // Stated per room rather than per stake, and that is a correction rather
  // than a convenience. The first cut of this asked, of every stake, that no
  // tide but the declared one could put a seed on it — and that is both too
  // strong and too weak. Too strong, because a later stake in a chain may well
  // be reachable from two directions once an earlier one exists, and nothing
  // is wrong with that. Too weak, because what actually has to be true is
  // about the SET: that the player cannot stand at one sea, throw everything
  // the room needs, and never sound the conch again.
  //
  // And the sea it has to fail at is LOW, specifically. Clause 3 has already
  // proved a pillar is ground at LOW and at LOW alone, so every grove is USED
  // at LOW whatever else is true of it. If LOW also BUILDS it, the conch is
  // decoration and the bole is scenery; if LOW does not, the room has cost the
  // player a trip up the tide and back, whichever other sea they chose.
  //
  // So: fix LOW, plant every stake that can be thrown at LOW from dry footing
  // the player can reach, then do it again with those pillars in place, and
  // again, until nothing new appears. If the closure ever contains every
  // declared stake, the room has a fixed-sea answer.
  {
    const bad = [];
    for (const l of [0]) {
      const b = base.clone();
      const got = new Set();
      // EVERY landing is planted, not only the declared stakes. A player with a
      // satchel of seeds does not know which tiles the room considers load
      // bearing, and a pillar grown on an ordinary square of water is dry ground
      // at LOW like any other — so it is somewhere new to stand and throw from,
      // and it can be the solid a later seed is caught against. Modelling only
      // the declared stakes would prove the intended route unreachable at LOW
      // and miss the unintended one, which is the whole thing this clause is
      // for. Capped at REEFSEED_CAPACITY passes, because that is how many seeds
      // the player can actually be holding.
      const planted = new Set();
      for (let pass = 0; pass < REEFSEED_CAPACITY; pass++) {
        let grew = false;
        for (const k of nearReach(b, l)) {
          const [x, y] = k.split(',').map(Number);
          if (!canThrowFrom(b.def(x, y, l))) continue;
          for (const dir of Object.keys(DIR_VEC)) {
            const land = throwLands(b, x, y, dir, l);
            if (!land) continue;
            const key = land.join(',');
            if (planted.has(key) || !plantableTerrain(b.name(land[0], land[1]))) continue;
            planted.add(key); b.plant(land[0], land[1]); grew = true;
            if (r.R.stakes.some(t => t.at[0] === land[0] && t.at[1] === land[1])) got.add(key);
          }
        }
        if (!grew) break;
      }
      if (got.size === r.R.stakes.length) bad.push(LEVEL_NAME[l]);
    }
    check(`${where}: LOW does not build the room`, bad.length === 0,
      'every stake can be thrown at ' + bad.join('/')
      + ' — and every stake is used at LOW, so the conch is decoration');
  }

  // 7. nothing the player can build can brick the room
  //
  // A pillar is permanent and SOLID at MID, and the player may grow one
  // anywhere a seed reaches. This is CLAUDE.md's "a solid tile can strand a
  // room" trap with the player holding the trowel, and it is the one failure
  // mode in this dungeon that no other tool in the repo could ever see.
  //
  // The bar is that the doorways stay joined AT SOME SEA rather than at all
  // three, because the conch is always in the player's hand: a pillar that
  // walls a room at MID and is a road through it at LOW has cost them a button
  // press, not a save. What would be fatal is a pillar that cuts the room at
  // every level at once, and that is what this rejects.
  {
    const opened = built.clone();
    if (r.R.snarl) opened.names[r.R.snarl[1]][r.R.snarl[0]] = 'dWaterS';
    const doors = doorways(base);
    const joinedAt = (board, l) => {
      const open = doors.filter(([x, y]) => occupiable(board.def(x, y, l), 'swim'));
      if (open.length < 2) return true;
      const seen = flood(board, l, 'swim', [open[0]]);
      return open.every(([x, y]) => seen.has(x + ',' + y));
    };
    const spots = new Set();
    for (const l of LEVELS) {
      for (const k of reachable(opened, l)) {
        const [x, y] = k.split(',').map(Number);
        if (!canThrowFrom(opened.def(x, y, l))) continue;
        for (const dir of Object.keys(DIR_VEC)) {
          const land = throwLands(opened, x, y, dir, l);
          if (land && plantableTerrain(opened.name(land[0], land[1]))) spots.add(land.join(','));
        }
      }
    }
    const bricks = [];
    for (const k of spots) {
      const [x, y] = k.split(',').map(Number);
      const b = opened.clone(); b.plant(x, y);
      if (!LEVELS.some(l => joinedAt(b, l))) bricks.push(k);
    }
    check(`${where}: no stray pillar can seal the room`, bricks.length === 0,
      bricks.slice(0, 5).join(', ') + ' — a player can brick their own way out at every sea at once');
    if (VERBOSE) console.log(`       ${spots.size} tile(s) a seed can come to rest on`);
  }

  // 8, 9, 10. the snarl, and that the stake is the only blade that reaches it
  //
  // EVERY CLAIM BELOW IS MADE FROM THE DOOR THE ROOM IS ENTERED BY, not from
  // the generous every-border flood the rest of this file uses. That is the
  // one place generosity is the wrong direction here: a snarl has a far side,
  // the far side touches a doorway, and a flood that starts on both banks
  // reports the room as already open and every grove as already answered.
  if (r.R.snarl) {
    const [sx, sy] = r.R.snarl;
    const cut = r.R.cutFrom;
    const entry = r.R.entry;
    const nearSide = (board, l) => {
      const out = new Set();
      for (const mode of MODES) for (const k of flood(board, l, mode, [entry])) out.add(k);
      return out;
    };
    // The room as it is (snarl standing) and as it ends up (snarl cut), with
    // every stake grown in both.
    const shut = built.clone();
    const open = built.clone();
    // What the blade actually leaves behind, read out of the transform table
    // rather than written down here, so retuning the snarl re-proves every grove.
    const cutTr = transformFor(base.name(sx, sy), 'cut');
    open.names[sy][sx] = cutTr ? cutTr.to : base.name(sx, sy);

    // 8. the snarl is a wall at every sea, and the only way through.
    {
      const solidEverywhere = LEVELS.every(l => {
        const d = base.def(sx, sy, l);
        return d && (d.flags & F.SOLID);
      });
      check(`${where}: the snarl at ${sx},${sy} is a wall at every sea`, solidEverywhere,
        'it is ' + LEVELS.map(l => LEVEL_NAME[l] + ':' + (base.def(sx, sy, l) || {}).name).join(', '));

      // The far side is everything the cut reaches at SOME sea that the standing
      // snarl reaches at NONE. Union rather than per level, and that is not
      // laxity: a grove is played at LOW because the stake is only ground at
      // LOW, and at MID the same stake is a wall that closes its own doorway
      // again. Asking for a far side at every level would ask the room to work
      // at seas it is not for. What must hold — and does, per level — is that
      // while the snarl stands there is NO sea at which the far side opens.
      // If that set is empty the snarl is a fixture, not a lock, which is the
      // same claim walk-dungeons makes of a locked door.
      const shutAll = new Set();
      const openAll = new Set();
      for (const l of LEVELS) {
        for (const k of nearSide(shut, l)) shutAll.add(k);
        for (const k of nearSide(open, l)) openAll.add(k);
      }
      const far = [...openAll].filter(k => !shutAll.has(k));
      check(`${where}: and it is the only way to the far side`, far.length > 0,
        'cutting it reaches nothing the standing snarl does not — there is a way round it');
    }

    // 9. no blade but the stake's reaches it.
    //
    // `Player.startSwing` returns early while `inDeep`, so a swimmer beside a
    // snarl cannot touch it, and `dSnarl`'s only transform is `cut`, so a bomb
    // finds nothing. What is left to prove is geometric: that no tile the
    // player can STAND on, at any sea, on the near side, is next to the snarl —
    // except the stake, and the stake only at LOW.
    {
      const touch = [[sx + 1, sy], [sx - 1, sy], [sx, sy + 1], [sx, sy - 1]];
      const bad = [];
      for (const l of LEVELS) {
        const reach = nearSide(shut, l);
        for (const t of touch) {
          const k = t.join(',');
          if (!reach.has(k)) continue;
          if (!walkableDef(shut.def(t[0], t[1], l))) continue;   // the blade stays sheathed in the sea
          if (cut && t[0] === cut[0] && t[1] === cut[1] && l === 0) continue;
          bad.push(`${LEVEL_NAME[l]} from ${k}`);
        }
      }
      check(`${where}: no blade but the stake's reaches the snarl`, bad.length === 0,
        bad.slice(0, 4).join(', ') + ' — someone can stand there and swing');
    }

    // 10. and the stake really is somewhere you can stand and swing, at LOW.
    if (cut) {
      const isStake = r.R.stakes.some(t => t.at[0] === cut[0] && t.at[1] === cut[1]);
      check(`${where}: the cutting position ${cut.join(',')} is one of the stakes`, isStake,
        'it is not a tile this room grows');
      const adj = Math.abs(cut[0] - sx) + Math.abs(cut[1] - sy) === 1;
      check(`${where}: and the blade reaches the snarl from it`, adj,
        `${cut.join(',')} is not beside ${sx},${sy} — SWORD_REACH is one tile`);
      check(`${where}: and it can be got to at LOW`, nearSide(shut, 0).has(cut.join(',')),
        'nothing reaches the stake once it is grown');
    }
  }

  if (!VERBOSE) {
    console.log('       ' + r.R.stakes.map((s, i) =>
      `#${i + 1} ${s.at.join(',')} from ${s.from.join(',')} at ${LEVEL_NAME[s.sea]}`).join('; '));
  }
}

console.log(`\n=== ${passed} passed, ${failures.length} failed ===`);
for (const f of failures) console.log('  ' + f);
process.exit(failures.length ? 1 : 0);
