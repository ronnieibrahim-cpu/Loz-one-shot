// Squall Bellows prover. Plain Node, no DOM, no browser. The fourth of the
// item provers, after check-anchor.mjs, check-lens.mjs and check-cleats.mjs.
//
// WHAT IT IS FOR
//
// The Bellows are the Tidewright's Anchor turned inside out. The Anchor's held
// patch persists and can be walked away from; the Bellows' cone lasts exactly
// as long as the button is down, follows your facing, and COSTS YOU YOUR FEET
// (`Player.updateBellows` returns before the mover runs). So:
//
//   a room you cross by holding the button and walking is not a Bellows room.
//   a room where the thing you free has to act while you stand still, is.
//
// The Cliffside Cistern's answer to that is a drowned paddle wheel. A wheel
// under deep water does not catch the wind (`GustWheel.drowned`), and the only
// thing in the game that takes the water off one tile while leaving the rest of
// the room alone is the cone — which also has to be the thing turning it. One
// held breath does two incompatible jobs at once, three tiles away from you,
// and you cannot go and look.
//
// WHAT IS PROVED, per room declaring
//
//   bellowsRoom: { wheel: [x,y], stand: [x,y], face, at, opens: [[x,y],...] }
//
//   1. NO HAND REACHES THE WHEEL. At every tide level, in every mode the
//      player owns by dungeon four (walking, swimming, and walking the
//      seafloor), neither the wheel's tile nor any tile beside it is
//      reachable. `GustWheel.interactByHand` refuses anyway; this is what
//      makes the refusal true rather than merely enforced.
//   2. THE WHEEL IS DROWNED AT THE SEA THE ROOM IS PLAYED AT. Deep water over
//      it at `at`, so pumping alone does nothing.
//   3. AND THE CONE FREES IT. One level down — what the cone's `delta: -1`
//      gives — the same tile is not deep, and is not a wall either.
//   4. NO SEA LEVEL FREES IT WHERE YOU CAN STAND. For every level at which the
//      wheel is NOT drowned, no tile you can reach and pump from at that level
//      has the wheel in its cone, in any of the four facings. THIS IS THE
//      LOAD-BEARING ASSERTION and the one a later session will break by
//      widening a room: without it the answer is "sound the conch to LOW and
//      blow", and the cone is decoration.
//   5. THERE IS A PLACE TO STAND. The declared stand tile is reachable at `at`,
//      is somewhere the Bellows will actually open (not deep — the item is
//      refused while `inDeep || underwater`), and its cone in the declared
//      facing covers the wheel.
//   6. AND THE SEA HAS TO BE WHERE IT IS. The stand tile is unreachable at
//      every level where the wheel is not drowned, so the two halves of the
//      answer can never be bought separately.
//   7. THE WHEEL BUYS SOMETHING. Every tile in `opens` is a shut door in the
//      grid, and it separates its room at all three tide levels — the same
//      claim walk-dungeons.mjs makes of a locked door, for the same reason: a
//      door with a way round it is a fixture, not a lock.
//
// And globally: every `wheel` entity in the game stands on the tile its room
// declares, every declared Bellows room is in the dungeon that hands the
// Bellows over, and the cone's reach is read out of feel.js rather than
// written down here.
//
// THE MODEL, and where its edges are
//
//   * A state is a tile and the level is a parameter, as in check-cleats.mjs.
//     There is no conch axis inside a room: the player may arrive at any level
//     and change it anywhere they can stand, so proving each level
//     independently is both simpler and stricter than modelling the press.
//   * The flood starts from EVERY occupiable border tile — every way into the
//     room — which is generous, and generosity is the direction an
//     unreachability claim has to err in.
//   * The player of dungeon four owns the Kelp-Soled Cleats, so deep water is
//     floor in two different ways and only walls and pits are barriers. That
//     is why the wheels here sit across pits: a moat that a swimmer crosses is
//     not a moat any more.
//   * Breath is not modelled. Nothing in the Cistern asks for a dive longer
//     than three tiles; check-cleats.mjs owns that claim and the Cistern makes
//     no room that would need it.
//
// Usage: node tools/check-bellows.mjs [--verbose]

import { MAPS } from '../src/world/maps.js';
import { getLegend } from '../src/world/room.js';
import { F, getTileDef } from '../src/world/tileset.js';
import { installData } from '../src/data/index.js';
import { BELLOWS_RANGE, GAP_HOP_MAX_SPAN } from '../src/data/feel.js';

installData();

const VERBOSE = process.argv.includes('--verbose');
const LEVELS = [0, 1, 2];
const LEVEL_NAME = ['LOW', 'MID', 'HIGH'];
const TILE = 16;
const MODES = ['foot', 'swim', 'sink'];
const DIR_VEC = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

let passed = 0; const failures = [];
function check(name, cond, detail) {
  if (cond) { passed++; console.log('  ok   ' + name); }
  else { failures.push(name + (detail ? ' — ' + detail : '')); console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); }
}


/**
 * The cone's footprint, and it is `Tide.covers`'s 'cone' branch plus
 * `Tide.blows` verbatim: measured along a facing from the pumper's own tile,
 * widening one tile every two out, and stopped by anything solid in between.
 * Reproduced rather than imported because tide.js reaches for a canvas on the
 * way in, and re-derived from BELLOWS_RANGE rather than from a number written
 * here, so retuning the reach re-proves every room.
 *
 * `solidBetween` is the caller's, and it resolves at the BASE level exactly as
 * the engine's does — the level the room is being played at, not the drained
 * level inside the cone.
 */
function coneCovers(ox, oy, dx, dy, tx, ty, solidAt, r = BELLOWS_RANGE) {
  const rx = tx - ox, ry = ty - oy;
  const along = rx * dx + ry * dy;
  if (along < 0 || along > r) return false;
  if (Math.abs(rx * dy - ry * dx) > Math.floor(along / 2)) return false;
  if (!solidAt) return true;
  const n = Math.max(Math.abs(rx), Math.abs(ry));
  for (let i = 1; i < n; i++) {
    if (solidAt(ox + Math.round(rx * i / n), oy + Math.round(ry * i / n))) return false;
  }
  return true;
}

console.log(`  cone reach ${BELLOWS_RANGE} tiles, mouth ${2 * Math.floor(BELLOWS_RANGE / 2) + 1} tiles wide, `
  + `hop clears ${GAP_HOP_MAX_SPAN - 1} jumpable tile(s)`);

// --- tiles ------------------------------------------------------------------
function defAt(legend, ch, level) {
  let d = getTileDef(legend[ch]);
  for (let i = 0; i < 4 && d && d.tide; i++) d = getTileDef(d.tide[level]);
  return d;
}
const isDeep = (d) => !!d && !!(d.flags & F.DEEP);

function walkableDef(d) {
  if (!d) return false;
  if (d.flags & F.STAIRS) return true;
  return !(d.flags & (F.VOID | F.SOLID | F.PIT | F.DEEP | F.LEDGE | F.HAZARD));
}

/** Can a body in this mode occupy the tile at all? Cleats cross deep water. */
function occupiable(d, mode) {
  if (!d) return false;
  if (d.flags & F.STAIRS) return true;
  if (d.flags & (F.VOID | F.SOLID)) return false;
  if (d.flags & F.DEEP) return mode !== 'foot';
  return !(d.flags & (F.PIT | F.LEDGE | F.HAZARD));
}

/**
 * Somewhere the Bellows will actually open. `Player.updateBellows` refuses
 * while `inDeep || underwater`, so deep water is not a firing position however
 * comfortably the player is floating in it. Shallow water is.
 */
const canPumpFrom = (d) => walkableDef(d);

/** Every tile reachable in one room at one level in one mode, from every way in. */
function flood(room, level, mode) {
  const { grid, legend, W, H } = room;
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? null : defAt(legend, grid[y][x], level));
  const ok = (x, y) => occupiable(at(x, y), mode);
  const seen = new Set(), q = [];
  const push = (x, y) => { const k = x + ',' + y; if (!seen.has(k)) { seen.add(k); q.push([x, y]); } };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if ((x === 0 || y === 0 || x === W - 1 || y === H - 1) && ok(x, y)) push(x, y);
  }
  while (q.length) {
    const [x, y] = q.pop();
    const here = at(x, y);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (ok(nx, ny)) { push(nx, ny); continue; }
      // A hop, and only from dry footing: both hop paths refuse in the water.
      //
      // MODELLED EXACTLY AS `Player.tryGapHop` DOES IT, and the first cut of
      // this was not. It cleared anything that was not solid, which meant it
      // hopped pits — and a Cistern sill is a pit trench, so every sump shelf
      // in the dungeon read as reachable at LOW and three rooms failed for a
      // reason that was in the harness rather than in the rooms. The engine
      // hops F.JUMPABLE and nothing else: a chasm, not a hole in the floor.
      if (isDeep(here) || mode === 'sink') continue;
      const first = at(nx, ny);
      if (!first || !(first.flags & F.JUMPABLE) || (first.flags & F.NOFLY)) continue;
      let n = 1;
      while (n < GAP_HOP_MAX_SPAN) {
        const d = at(x + dx * (n + 1), y + dy * (n + 1));
        if (!d || !(d.flags & F.JUMPABLE)) break;
        n++;
      }
      if (n >= GAP_HOP_MAX_SPAN) continue;             // too wide to clear
      if (walkableDef(at(x + dx * (n + 1), y + dy * (n + 1)))) push(x + dx * (n + 1), y + dy * (n + 1));
    }
  }
  return seen;
}

/** Everywhere the player can get to at this level, in any mode they own. */
function reachable(room, level) {
  const out = new Set();
  for (const mode of MODES) for (const k of flood(room, level, mode)) out.add(k);
  return out;
}

/** Does the door at (x,y) cut its two neighbours apart on some axis, at every level? */
function doorSeparates(room, x, y) {
  const { grid, legend, W, H } = room;
  const walk = (px, py, t) => px >= 0 && py >= 0 && px < W && py < H
    && walkableDef(defAt(legend, grid[py][px], t));
  const cuts = (ax, ay, t) => {
    const a = [x - ax, y - ay], b = [x + ax, y + ay];
    if (!walk(a[0], a[1], t) || !walk(b[0], b[1], t)) return false;
    const seen = new Set([a.join(',')]), q = [a];
    while (q.length) {
      const [cx, cy] = q.pop();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy;
        if (nx === x && ny === y) continue;              // the door is shut
        // Deep water is floor to this player, so a moat is not a wall here.
        const d = (nx < 0 || ny < 0 || nx >= W || ny >= H) ? null : defAt(legend, grid[ny][nx], t);
        if (!occupiable(d, 'swim')) continue;
        const k = nx + ',' + ny;
        if (seen.has(k)) continue;
        seen.add(k); q.push([nx, ny]);
      }
    }
    return !seen.has(b.join(','));
  };
  return [[1, 0], [0, 1]].some(([ax, ay]) => LEVELS.every(t => cuts(ax, ay, t)));
}

/** Every sill a room declares, whether it declared one or a list of them. */
const sills = (def) => !def.bellowsRoom ? []
  : (Array.isArray(def.bellowsRoom) ? def.bellowsRoom : [def.bellowsRoom]);

// --- collect the declared rooms --------------------------------------------
const rooms = [];
for (const [mapId, m] of MAPS) {
  for (const [key, def] of Object.entries(m.roomDefs || {})) {
    if (!def.bellowsRoom) continue;
    const sz = def.size || [1, 1];
    // A room may hold more than one sill — the Crossed Sluices holds two — so
    // the declaration is normalised to a list and every claim below is made
    // per sill rather than per room.
    for (const B of sills(def)) {
      rooms.push({
        mapId, key, name: def.name || key,
        index: (m.dungeon && m.dungeon.index) | 0,
        item: m.dungeon && m.dungeon.item,
        W: (sz[0] | 0) * 10, H: (sz[1] | 0) * 8,
        grid: def.map, legend: getLegend(def.legend || m.legend),
        def, B,
      });
    }
  }
}

check('at least one room declares a Bellows room', rooms.length > 0, 'nothing to prove');

// The Bellows are dungeon four's item, so a Bellows room in an earlier dungeon
// is a room the player cannot answer. Same shape as check-anchor's clause.
{
  const early = rooms.filter(r => r.index < 4);
  check('no Bellows room comes before the Bellows', early.length === 0,
    early.map(r => `${r.mapId} ${r.key}`).join(', '));
}

// Every wheel in the game is in a room that declares itself, and stands where
// that declaration says. A wheel placed as scenery is a fixture nothing proves
// can be turned; a wheel one tile off its declaration is a proof about the
// wrong tile.
{
  const strays = [], misplaced = [];
  for (const [mapId, m] of MAPS) {
    for (const [key, def] of Object.entries(m.roomDefs || {})) {
      for (const e of def.entities || []) {
        if (e[0] !== 'wheel') continue;
        if (!def.bellowsRoom) { strays.push(`${mapId} ${key}`); continue; }
        if (!sills(def).some(B => B.wheel[0] === e[1] && B.wheel[1] === e[2])) {
          misplaced.push(`${mapId} ${key}: wheel at ${e[1]},${e[2]} is not one this room declares`);
        }
      }
    }
  }
  check('every gust wheel is in a room that declares itself', strays.length === 0,
    [...new Set(strays)].join(', ') + ' — a wheel nothing proves can be turned');
  check('every gust wheel stands where its room says it does', misplaced.length === 0,
    misplaced.join(' | '));
}

// --- per room ---------------------------------------------------------------
for (const r of rooms) {
  const where = `${r.mapId} ${r.key} (${r.name})`;
  const { wheel, stand, face, at } = r.B;
  const W = wheel.join(','), S = stand.join(',');
  const tileAt = (p, l) => defAt(r.legend, r.grid[p[1]][p[0]], l);
  const reach = LEVELS.map(l => reachable(r, l));
  // Solidity for the line-of-sight walk, at the level being asked about.
  const solidAtLevel = (l) => (x, y) => {
    if (x < 0 || y < 0 || x >= r.W || y >= r.H) return true;
    const d = defAt(r.legend, r.grid[y][x], l);
    return !d || !!(d.flags & (F.SOLID | F.VOID));
  };

  // 1. no hand reaches the wheel, at any level, in any mode
  {
    const touch = [wheel, [wheel[0] + 1, wheel[1]], [wheel[0] - 1, wheel[1]],
      [wheel[0], wheel[1] + 1], [wheel[0], wheel[1] - 1]];
    const bad = [];
    for (const l of LEVELS) for (const t of touch) {
      if (reach[l].has(t.join(','))) bad.push(`${LEVEL_NAME[l]} @${t.join(',')}`);
    }
    check(`${where}: no hand reaches the wheel`, bad.length === 0,
      'stood beside it at ' + bad.join(', '));
  }

  // 2 & 3. the wheel is drowned where the room is played, and one level down it is not
  {
    const now = tileAt(wheel, at), down = at > 0 ? tileAt(wheel, at - 1) : null;
    check(`${where}: the wheel is drowned at ${LEVEL_NAME[at]}`, isDeep(now),
      `it stands in ${now ? now.name : 'nothing'} — a plain gust would turn it`);
    check(`${where}: and the cone takes the water off it`,
      !!down && !isDeep(down) && !(down.flags & (F.SOLID | F.VOID)),
      at === 0 ? 'the room is played at LOW and there is nothing below it'
        : `one level down it is ${down ? down.name : 'nothing'}`);
  }

  // 4. no sea level frees it anywhere you could stand and pump
  {
    const bad = [];
    for (const l of LEVELS) {
      if (isDeep(tileAt(wheel, l))) continue;              // drowned: safe at this level
      for (const k of reach[l]) {
        const [x, y] = k.split(',').map(Number);
        if (!canPumpFrom(defAt(r.legend, r.grid[y][x], l))) continue;
        for (const [dx, dy] of Object.values(DIR_VEC)) {
          if (coneCovers(x, y, dx, dy, wheel[0], wheel[1], solidAtLevel(l))) bad.push(`${LEVEL_NAME[l]} from ${k}`);
        }
      }
    }
    check(`${where}: no sea level frees the wheel where you can stand`, bad.length === 0,
      [...new Set(bad)].slice(0, 4).join(', ') + ' — the conch alone answers this room');
  }

  // 5. there is a place to stand, and it is the one the room names
  {
    const d = tileAt(stand, at);
    const [dx, dy] = DIR_VEC[face] || [0, 0];
    check(`${where}: the stand is reachable at ${LEVEL_NAME[at]}`, reach[at].has(S),
      'nothing gets to ' + S);
    check(`${where}: the Bellows open there`, canPumpFrom(d),
      `${d ? d.name : 'nothing'} at ${S} — the item is refused in deep water`);
    check(`${where}: the cone reaches the wheel from it`,
      coneCovers(stand[0], stand[1], dx, dy, wheel[0], wheel[1], solidAtLevel(at)),
      `${S} facing ${face} does not cover ${W} at reach ${BELLOWS_RANGE} — out of the cone, or something solid is in the way`);
  }

  // 6. and the sea has to be where it is
  {
    const also = LEVELS.filter(l => l !== at && reach[l].has(S));
    const free = also.filter(l => !isDeep(tileAt(wheel, l)));
    check(`${where}: the stand is only reachable while the wheel is drowned`, free.length === 0,
      'stand reachable at ' + free.map(l => LEVEL_NAME[l]).join('/') + ' with the wheel already clear');
  }

  // 7. the wheel buys something
  for (const [x, y] of r.B.opens || []) {
    const name = r.legend[r.grid[y][x]];
    check(`${where}: the door at ${x},${y} is shut`, name === 'dDoorClosed',
      `it is ${name} — the wheel opens a tile that is not a shut door`);
    check(`${where}: the door at ${x},${y} separates the room`, doorSeparates(r, x, y),
      'there is a way round it at some tide level');
  }

  if (VERBOSE) {
    console.log(`       wheel ${W} ${LEVELS.map(l => `${LEVEL_NAME[l]}:${tileAt(wheel, l).name}`).join(' ')}`);
    console.log(`       stand ${S} reachable at ${LEVELS.filter(l => reach[l].has(S)).map(l => LEVEL_NAME[l]).join('/') || 'nowhere'}`);
  } else {
    console.log(`       ${W} is ${tileAt(wheel, at).name} at ${LEVEL_NAME[at]} and `
      + `${at > 0 ? tileAt(wheel, at - 1).name : '—'} inside the cone; `
      + `pumped from ${S} facing ${face}`);
  }
}

console.log(`\n=== ${passed} passed, ${failures.length} failed ===`);
for (const f of failures) console.log('  ' + f);
process.exit(failures.length ? 1 : 0);
