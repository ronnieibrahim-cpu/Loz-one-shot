// Dredge Line prover. Plain Node, no DOM, no browser. The sixth and last of the
// item provers, after check-anchor, check-lens, check-cleats, check-bellows and
// check-reefseed.
//
// WHAT IT IS FOR
//
// Every item before this one had its own reason its rooms were hard to prove.
// The Anchor did not FIT in a room. The Lens could not be REQUIRED by terrain at
// all. The Cleats were required by every deep tile in the game the moment they
// existed. The Bellows took your feet while you used them. The Reefseed could
// not open a path. The Dredge Line's problem is the last one left and it is the
// one the whole game has been building toward:
//
//   THE PLAYER OF THE SIXTH DUNGEON OWNS THE CLEATS, SO WATER IS A ROAD.
//
// Deep water stopped being a barrier in dungeon three. A room in the Abyssal
// Keep that says "you cannot get over there" has to mean a PIT, because a pit
// is the only thing left in the game that neither mode of the Cleats crosses
// and no sea level fills. That is the Cistern's finding restated, and it decides
// the shape of every crossing in this dungeon before a tile is placed.
//
// So what is left to prove is the axis INSIDE the item, and there are two of
// them, and both are decided in arithmetic by clauses that already exist:
//
//   1. THE LINE CROSSES WHAT THE SEA OPENS. `DredgeLine.update`'s cast stops
//      dead on `F.SOLID | F.VOID` and snags on `F.SNAG`, and `ITEMS.dredge.use`
//      now refuses while `inDeep || underwater` — the same guard the Bellows and
//      the Reefseed carry, and for the same reason: a weighted line is thrown
//      from your heels. So a crossing is a question about THREE tiles that the
//      tide moves independently — the ground you brace on, everything between,
//      and the post itself.
//   2. THE FLOOR ONLY GIVES UP WHAT THE SEA COVERS. `DredgeLine.dragBack`
//      searches a tile the weight passed over only if that tile carries
//      `F.WET | F.SLOW` AT THE LEVEL IT IS RESOLVED AT. A silted cache on a dry
//      pan is dragged straight over and yields nothing; put the sea on it and
//      the same drag comes up with what is down there.
//
// The second one is the inverse of the entire game to this point. Five dungeons
// have asked the player to take the water OFF something. This one is the only
// place in the game that wants it ON, and that is the Keep's tide theme.
//
// WHAT IS PROVED, per room declaring
//
//   dredgeRoom: {
//     entry: [x, y],                                  // the doorway it is played from
//     moorings: [{ post:[x,y], from:[x,y], land:[x,y], face, sea, entry? }, ...],
//     returns:  [{ post:[x,y], from:[x,y], land:[x,y], face, sea, entry? }, ...],
//     caches:   [{ at:[x,y],   from:[x,y], face, sea }, ...],
//     teaches: true,                                  // optional, see R1
//     opens: [[x,y], ...], gives: 'key',              // optional
//   }
//
// A mooring may name its own `entry` when it is the SECOND crossing of a room —
// its near side is a bank that only exists once the first crossing is made, and
// every claim about it is made from there rather than from the room's door.
//
// Per mooring:
//
//   M1. THE FAR SIDE IS NOT WALKABLE TO. `land` cannot be reached from `entry`
//       by walking, hopping, swimming or sinking, at ANY tide level. This is the
//       "no route without the item" clause and it is where the pit does its work.
//   M2. AND THE LINE GETS THERE. The cast is simulated frame by frame off
//       feel.js from `from`, facing `face`, at the declared sea, and it must
//       snag on `post`.
//   M3. FROM SOMEWHERE YOU CAN BRACE. `from` is walkable — not deep, not the
//       seafloor — at that sea, and can be reached from `entry` at that sea.
//   M4. AND THE PULL LANDS YOU SOMEWHERE REAL. `land` is the tile the pull stops
//       on, and at the declared sea it is standable and is not a pit or a hazard
//       waiting for `hookPulling` to let go.
//   M5. AND NO OTHER SEA WILL DO. THIS IS THE LOAD-BEARING ASSERTION. From every
//       tile the player can reach from `entry` at every level, in every facing:
//       a cast that puts them somewhere new, from which `land` is then reachable,
//       happens ONLY at the declared sea. Drop this clause and the answer to
//       every room in the Keep is "stand somewhere and cast", and the conch is
//       decoration. Note the shape of the question — "can I get to the far side"
//       rather than "does a cast snag" — because a room with a mooring on both
//       banks is full of casts that land you where you already were.
//
//   And per `returns` entry, the mirror of all of that: the cast works from the
//   far bank, and where it puts you IS the near side. A crossing is one-way by
//   construction, so a room without one is a room the player can be walked into
//   and not out of — a save-file bug no other checker in the tree can see.
//
// Per cache:
//
//   C1. THE ROOM ACTUALLY BURIES SOMETHING THERE. `room.buried` is the engine's
//       own list and a cache the room does not bury is a drag that finds nothing.
//   C2. AND THE SEA HAS TO BE ON IT. Searchable at the declared sea — `F.WET |
//       F.SLOW`, read out of the tile at that level exactly as `dragBack` reads
//       it — and NOT searchable at LOW, so the dry pan really is dry.
//   C3. AND YOU CAN CAST AT IT FROM SOMEWHERE YOU CAN STAND. `from` is walkable
//       and reachable at that sea and the cast's path crosses `at`.
//   C4. AND THE NEAR SIDE CANNOT REACH IT. In a room that has a mooring, no cast
//       from anywhere reachable from `entry` without the line touches the cache
//       at any sea. The cache is behind the crossing or it is not a reward.
//
// Per room:
//
//   R1. THE ROOM NEEDS TWO SEAS. The declared seas are not all the same, so no
//       fixed tide level answers the room. This is the P8 constraint stated as
//       arithmetic. A room saying `teaches: true` is exempt — it is a room the
//       player is meant to get wrong for free — and pays for the exemption by
//       being forbidden to hold anything the dungeon needs.
//
//   AND EVERY CLOSURE CLAUSE IS PROVED TWICE, once at the line's own reach and
//   once at the Coilrope's. The charm adds a tile to every cast and this dungeon
//   hands it out, so a room that is airtight at four tiles and answered at five
//   is a room the player breaks by putting on the bone they were given for
//   finding it. It caught the Drowned Sill's cache on the first run.
//   R2. EVERY DOOR IT OPENS IS A DOOR. Each tile in `opens` is shut and
//       separates its room on one axis at all three levels.
//   R3. AND A REWARD IT SPAWNS COMES BACK. A room that `gives` from a script
//       restores it in `onEnter`, which is the Cistern's soft lock: a script
//       fires once and a player who walks out without the key has lost it.
//
// Globally: at least one room declares a dredge room; no dredge room comes
// before the dungeon that hands the Dredge Line over; every `F.SNAG` tile inside
// that dungeon is a post some room declares (an undeclared mooring is a second
// answer nobody proved); and every `buried` list inside it is a declared cache.
//
// THE MODEL, and where its edges are
//
//   * The cast is REPRODUCED from feel.js frame by frame rather than imported,
//     for the same reason check-bellows reproduces the cone and check-reefseed
//     reproduces the throw: items.js reaches for a canvas on the way in. It is
//     re-derived from DREDGE_CAST_SPEED and DREDGE_RANGE rather than from a
//     number written here, so retuning the line re-proves every room. What
//     confirms the reproduction against the engine is the `d6-mooring` replay.
//   * The pull is modelled as "stop on the tile before the post". `moveEntity`
//     carries `{ jumping: true, swim: true }` during a pull, so nothing but a
//     SOLID stops it, and M2 has already proved nothing solid stands between.
//   * A state is a tile and the level is a parameter, as in check-bellows and
//     check-reefseed. Proving each level independently is stricter than
//     modelling the conch.
//
// Usage: node tools/check-dredge.mjs [--verbose]

import { MAPS } from '../src/world/maps.js';
import { getLegend } from '../src/world/room.js';
import { F, getTileDef } from '../src/world/tileset.js';
import { installData } from '../src/data/index.js';
import {
  DREDGE_RANGE, DREDGE_CAST_SPEED, COILROPE_RANGE, GAP_HOP_MAX_SPAN,
} from '../src/data/feel.js';
import { defWalkable, capsForMode, ROUTE_AVOID } from './lib/collision.mjs';

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

function walkableDef(d) {
  if (!d) return false;
  if (d.flags & F.STAIRS) return true;
  return defWalkable(d, capsForMode('foot'), ROUTE_AVOID);
}

/**
 * Can a body in this mode occupy the tile at all? Both Cleat modes cross
 * deep. Asked of the engine's own `tileDefSolid` via `defWalkable`/
 * `capsForMode` (tools/lib/collision.mjs), not a private re-derivation.
 */
function occupiable(d, mode) {
  if (!d) return false;
  if (d.flags & F.STAIRS) return true;
  return defWalkable(d, capsForMode(mode), ROUTE_AVOID);
}

/**
 * Somewhere the line may be cast from. `ITEMS.dredge.use` refuses while
 * `inDeep || underwater`, so the sea is not a casting position however
 * comfortably the player is floating in it. Shallow water is: you have your
 * heels on the floor.
 */
const canCastFrom = (d) => walkableDef(d);

/**
 * `DredgeLine.dragBack`'s own test, and the whole of the second axis: the weight
 * searches a tile it passed over only if that tile is WET or SLOW at the level
 * it is resolved at.
 */
const searchable = (d) => !!d && !!(d.flags & (F.WET | F.SLOW));

// --- a room as a grid of tile names -----------------------------------------
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
  inside(x, y) { return x >= 0 && y >= 0 && x < this.W && y < this.H; }
  name(x, y) { return this.inside(x, y) ? this.names[y][x] : null; }
  def(x, y, l) { return this.inside(x, y) ? defOf(this.names[y][x], l) : null; }
}

/** Every tile reachable at one level in one mode, from the given seeds. */
function flood(board, level, mode, seeds) {
  const ok = (x, y) => occupiable(board.def(x, y, level), mode);
  const seen = new Set(), q = [];
  const push = (x, y) => { const k = x + ',' + y; if (!seen.has(k)) { seen.add(k); q.push([x, y]); } };
  for (const [x, y] of seeds) if (ok(x, y)) push(x, y);
  while (q.length) {
    const [x, y] = q.pop();
    const here = board.def(x, y, level);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (ok(nx, ny)) { push(nx, ny); continue; }
      // The hop, exactly as the engine has it: F.JUMPABLE and nothing else, from
      // dry footing, never from the seafloor.
      if ((here && (here.flags & F.DEEP)) || mode === 'sink') continue;
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

/** Everywhere the player gets to from these seeds at this level, in any mode. */
function reachFrom(board, level, seeds) {
  const out = new Set();
  for (const mode of MODES) for (const k of flood(board, level, mode, seeds)) out.add(k);
  return out;
}

/**
 * The cast, frame by frame, as `DredgeLine.update`'s 'cast' branch has it.
 *
 * The weight is spawned at the player's centre less five pixels on both axes
 * and probes the tile under its own centre — `floor((x + 5) / TILE)` — one step
 * ahead of itself. It snags on F.SNAG, stops dead on F.SOLID or F.VOID, and
 * gives up once it has travelled DREDGE_RANGE from where it started. The order
 * of those three tests is the order the engine asks them in, and it matters: a
 * post inside a wall is a snag, not a wall.
 *
 * Returns { snag, blocked, path } — `path` being the tiles the weight went over,
 * near to far, which is the list `dragBack` searches on the way home.
 */
function cast(board, tx, ty, dir, level, range = DREDGE_RANGE) {
  const [dx, dy] = DIR_VEC[dir];
  const cx = tx * TILE + 8, cy = ty * TILE + 8;      // a tile-aligned 16x16 body
  const ox = cx - 5, oy = cy - 5;
  let fx = ox * FP, fy = oy * FP;
  const path = [];
  for (let i = 0; i < 400; i++) {
    const nfx = fx + dx * DREDGE_CAST_SPEED, nfy = fy + dy * DREDGE_CAST_SPEED;
    const ptx = Math.floor((toPx(nfx) + 5) / TILE), pty = Math.floor((toPx(nfy) + 5) / TILE);
    if (!board.inside(ptx, pty)) return { snag: null, blocked: null, path };
    const d = board.def(ptx, pty, level);
    const f = d ? d.flags : F.VOID;
    if (f & F.SNAG) return { snag: [ptx, pty], blocked: null, path };
    if (f & (F.SOLID | F.VOID)) return { snag: null, blocked: [ptx, pty], path };
    fx = nfx; fy = nfy;
    const last = path[path.length - 1];
    if (!last || last[0] !== ptx || last[1] !== pty) path.push([ptx, pty]);
    if (Math.hypot(toPx(fx) - ox, toPx(fy) - oy) >= range) return { snag: null, blocked: null, path };
  }
  return { snag: null, blocked: null, path };
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

// --- collect the declared rooms ---------------------------------------------
const rooms = [];
for (const [mapId, m] of MAPS) {
  for (const [key, def] of Object.entries(m.roomDefs || {})) {
    if (!def.dredgeRoom) continue;
    const sz = def.size || [1, 1];
    rooms.push({
      mapId, key, name: def.name || key,
      index: (m.dungeon && m.dungeon.index) | 0,
      W: (sz[0] | 0) * 10, H: (sz[1] | 0) * 8,
      grid: def.map, legend: getLegend(def.legend || m.legend),
      def, R: def.dredgeRoom,
    });
  }
}

// THE COILROPE IS PART OF THE GEOMETRY, and it is a charm rather than an item,
// so nothing else in the repo would ever have thought to ask about it. It adds
// COILROPE_RANGE to every cast the moment it is slotted, and the player of this
// dungeon owns all three charm cases — so every closure clause below is proved
// TWICE, once at each reach. A room that is airtight at four tiles and answered
// at five is a room the player breaks by putting on a bone they were given for
// finding it, with every checker in the tree still green.
const REACHES = [DREDGE_RANGE, DREDGE_RANGE + COILROPE_RANGE];
const REACH_NAME = ['bare', 'with the Coilrope'];

console.log(`  the line carries ${(DREDGE_RANGE / TILE).toFixed(2)} tiles `
  + `at ${(DREDGE_CAST_SPEED / FP).toFixed(2)} px/f, `
  + `${((DREDGE_RANGE + COILROPE_RANGE) / TILE).toFixed(2)} with the Coilrope`);

check('at least one room declares a dredge room', rooms.length > 0, 'nothing to prove');

// The dungeon that hands the Dredge Line over, and nothing before it.
const HOME = [...MAPS.values()].find(m => m.dungeon && m.dungeon.item === 'dredge');
check('some dungeon hands the Dredge Line over', !!HOME, 'no dungeon has item: dredge');
if (HOME) {
  const early = rooms.filter(r => r.index < HOME.dungeon.index);
  check('no dredge room comes before the Dredge Line', early.length === 0,
    early.map(r => `${r.mapId} ${r.key}`).join(', '));
}

// Every mooring post inside that dungeon is one a room declares. A post nobody
// declares is a crossing nobody proved, and it is exactly how a room acquires a
// second answer: the whole of M5 is about which casts snag, and a stray `q` in
// the scenery is a snag.
if (HOME) {
  const declared = new Set();
  for (const r of rooms) {
    if (r.mapId !== HOME.id) continue;
    for (const m of r.R.moorings || []) declared.add(`${r.key}:${m.post.join(',')}`);
    for (const m of r.R.returns || []) declared.add(`${r.key}:${m.post.join(',')}`);
  }
  const strays = [];
  for (const [key, def] of Object.entries(HOME.roomDefs || {})) {
    const legend = getLegend(def.legend || HOME.legend);
    const sz = def.size || [1, 1];
    for (let y = 0; y < (sz[1] | 0) * 8; y++) {
      for (let x = 0; x < (sz[0] | 0) * 10; x++) {
        const nm = legend[def.map[y][x]];
        if (!LEVELS.some(l => (defOf(nm, l).flags & F.SNAG))) continue;
        if (!declared.has(`${key}:${x},${y}`)) strays.push(`${key} ${x},${y} (${nm})`);
      }
    }
  }
  check(`every mooring in ${HOME.id} is one a room declares`, strays.length === 0,
    strays.slice(0, 6).join(', '));

  // And every cache. `buried` is invisible to every other checker in the repo:
  // nothing else in the tree knows the list exists.
  const declaredCaches = new Set();
  for (const r of rooms) {
    if (r.mapId !== HOME.id) continue;
    for (const c of r.R.caches || []) declaredCaches.add(`${r.key}:${c.at.join(',')}`);
  }
  const undeclared = [];
  for (const [key, def] of Object.entries(HOME.roomDefs || {})) {
    for (const b of def.buried || []) {
      if (!declaredCaches.has(`${key}:${b[0]},${b[1]}`)) undeclared.push(`${key} ${b[0]},${b[1]}`);
    }
  }
  check(`every cache in ${HOME.id} is one a room declares`, undeclared.length === 0,
    undeclared.join(', '));
}

// --- per room ---------------------------------------------------------------
for (const r of rooms) {
  const where = `${r.mapId} ${r.key} (${r.name})`;
  const board = new Board(r);
  const entry = r.R.entry;
  const moorings = r.R.moorings || [];
  const caches = r.R.caches || [];
  const near = (l, from) => reachFrom(board, l, [from || entry]);

  for (let i = 0; i < moorings.length; i++) {
    const M = moorings[i];
    const tag = `${where} mooring ${i + 1}`;
    const P = M.post.join(','), L = M.land.join(',');
    // A room with two crossings in series — the Crossed Shafts is one — has a
    // second near side that is only a near side once the first crossing is
    // made. Such a mooring names the tile the previous one lands on, and every
    // claim below is made from there rather than from the room's own door.
    const nearOf = (l) => near(l, M.entry);

    // M1. the far side is not walkable to, at any sea, in any mode.
    {
      const got = LEVELS.filter(l => nearOf(l).has(L));
      check(`${tag}: ${L} cannot be walked or swum to at any sea`, got.length === 0,
        'reachable at ' + got.map(l => LEVEL_NAME[l]).join('/') + ' — the crossing is decoration');
    }

    // M2. and the line gets there.
    {
      const c = cast(board, M.from[0], M.from[1], M.face, M.sea);
      check(`${tag}: cast from ${M.from.join(',')} facing ${M.face} at ${LEVEL_NAME[M.sea]} snags ${P}`,
        !!c.snag && c.snag[0] === M.post[0] && c.snag[1] === M.post[1],
        c.snag ? 'it snags ' + c.snag.join(',')
          : c.blocked ? 'it stops on ' + c.blocked.join(',') + ' (' + board.name(c.blocked[0], c.blocked[1]) + ')'
            : 'it reaches the end of its rope');
    }

    // M3. from somewhere you can brace.
    {
      const d = board.def(M.from[0], M.from[1], M.sea);
      check(`${tag}: ${M.from.join(',')} is footing at ${LEVEL_NAME[M.sea]}`, canCastFrom(d),
        `${d ? d.name : 'nothing'} — a line cannot be cast from the water`);
      check(`${tag}: and it can be got to at ${LEVEL_NAME[M.sea]}`, nearOf(M.sea).has(M.from.join(',')),
        'nothing reaches ' + M.from.join(','));
    }

    // M4. and the pull lands you somewhere real.
    //
    // The pull runs `moveEntity` with `{ jumping: true, swim: true }` and stops
    // against the first SOLID, which M2 has proved is the post itself; so the
    // player comes to rest on the tile before it. Then `finish` clears
    // `hookPulling` and `updateHazards` runs for the first time since the cast,
    // which is the frame a pit or a spike collects on the crossing.
    {
      const [dx, dy] = DIR_VEC[M.face];
      const stop = [M.post[0] - dx, M.post[1] - dy];
      check(`${tag}: the pull stops on ${L}`, stop[0] === M.land[0] && stop[1] === M.land[1],
        'it stops on ' + stop.join(',') + ' — the declared landing is not where the line puts you');
      const d = board.def(M.land[0], M.land[1], M.sea);
      check(`${tag}: and ${L} is standable at ${LEVEL_NAME[M.sea]}`, walkableDef(d),
        `${d ? d.name : 'nothing'} — the line drops you into it the frame it lets go`);
    }

    // M5. AND NO OTHER SEA WILL DO.
    //
    // From every tile the near side can reach, at every level, in every facing:
    // if a cast snags something and the tile it would drop the player on is on
    // the far side, that sea answers the crossing. Exactly one may.
    // The question is "can the player get to the FAR SIDE at this sea", not
    // "does any cast snag anything" — a room with a mooring on both banks is
    // full of casts that land you where you already were, and the Crossed
    // Shafts has one crossing whose return mooring is castable from the near
    // side of the other. So: take every cast that puts the player somewhere new
    // and ask whether `land` is reachable from there.
    for (let ri = 0; ri < REACHES.length; ri++) {
      const answers = new Set();
      for (const l of LEVELS) {
        const reach = nearOf(l);
        for (const k of reach) {
          const [x, y] = k.split(',').map(Number);
          if (!canCastFrom(board.def(x, y, l))) continue;
          for (const dir of Object.keys(DIR_VEC)) {
            const c = cast(board, x, y, dir, l, REACHES[ri]);
            if (!c.snag) continue;
            const [dx, dy] = DIR_VEC[dir];
            const sx = c.snag[0] - dx, sy = c.snag[1] - dy;
            const stop = sx + ',' + sy;
            if (reach.has(stop) || !walkableDef(board.def(sx, sy, l))) continue;
            if (reachFrom(board, l, [[sx, sy]]).has(L)) answers.add(l);
          }
        }
      }
      check(`${tag}: and no other sea crosses it (${REACH_NAME[ri]})`,
        answers.size === 1 && answers.has(M.sea),
        'crossable at ' + [...answers].map(l => LEVEL_NAME[l]).join('/')
        + ' — the declared sea is ' + LEVEL_NAME[M.sea]);
    }
  }

  // --- the way home -------------------------------------------------------
  //
  // A crossing is one-way by construction: the pull is aimed, and the far bank
  // of a shaft has no reason to hold a ring pointing back unless somebody put
  // one there. Every crossing in the Keep does, and this is what says so —
  // because a room the player can be walked into and not out of is a save-file
  // bug that no other checker in the tree can see. The claim is the mirror of a
  // mooring's: the cast works from the far side, and where it puts you IS the
  // near side, which is the one thing a mooring must never do.
  for (let i = 0; i < (r.R.returns || []).length; i++) {
    const M = r.R.returns[i];
    const tag = `${where} return ${i + 1}`;
    const c = cast(board, M.from[0], M.from[1], M.face, M.sea);
    check(`${tag}: cast from ${M.from.join(',')} facing ${M.face} at ${LEVEL_NAME[M.sea]} snags ${M.post.join(',')}`,
      !!c.snag && c.snag[0] === M.post[0] && c.snag[1] === M.post[1],
      c.snag ? 'it snags ' + c.snag.join(',')
        : c.blocked ? 'it stops on ' + c.blocked.join(',') : 'it reaches the end of its rope');
    check(`${tag}: ${M.from.join(',')} is footing at ${LEVEL_NAME[M.sea]}`,
      canCastFrom(board.def(M.from[0], M.from[1], M.sea)), 'you cannot cast from the water');
    check(`${tag}: and ${M.land.join(',')} is standable at ${LEVEL_NAME[M.sea]}`,
      walkableDef(board.def(M.land[0], M.land[1], M.sea)), 'the line drops you into it');
    // "Home" is the bank the matching crossing was made FROM, which in a room
    // with two crossings in series is not the room's door — the Crossed Shafts'
    // second return puts you back on the middle island, which is exactly right.
    check(`${tag}: and it really does lead home`, near(M.sea, M.entry).has(M.land.join(',')),
      `${M.land.join(',')} is not on the bank this crossing was made from`);
  }

  // --- the caches ---------------------------------------------------------
  for (let i = 0; i < caches.length; i++) {
    const C = caches[i];
    const tag = `${where} cache ${i + 1}`;
    const A = C.at.join(',');

    // C1. the room actually buries something there.
    {
      const has = (r.def.buried || []).some(b => b[0] === C.at[0] && b[1] === C.at[1]);
      check(`${tag}: the room buries something at ${A}`, has,
        'nothing in `buried` — the drag comes home empty and every other checker calls it solved');
    }

    // C2. and the sea has to be on it.
    {
      const wet = LEVELS.filter(l => searchable(board.def(C.at[0], C.at[1], l)));
      check(`${tag}: ${A} is searchable at ${LEVEL_NAME[C.sea]}`, wet.includes(C.sea),
        'it is dry there — dragBack skips a tile carrying neither WET nor SLOW');
      check(`${tag}: and the dry pan really is dry`, !wet.includes(0),
        'searchable at LOW too — the floor gives up what it holds with the sea off it');
    }

    // C3. and you can cast at it from somewhere you can stand.
    {
      const d = board.def(C.from[0], C.from[1], C.sea);
      check(`${tag}: ${C.from.join(',')} is footing at ${LEVEL_NAME[C.sea]}`, canCastFrom(d),
        `${d ? d.name : 'nothing'} — a line cannot be cast from the water`);
      const c = cast(board, C.from[0], C.from[1], C.face, C.sea);
      check(`${tag}: and the cast passes over ${A}`,
        c.path.some(p => p[0] === C.at[0] && p[1] === C.at[1]),
        c.blocked ? 'it stops on ' + c.blocked.join(',') : 'it never gets there');
    }

    // C4. and the near side cannot reach it — in a room that has a crossing.
    if (moorings.length) {
      for (let ri = 0; ri < REACHES.length; ri++) {
        const bad = [];
        for (const l of LEVELS) {
          if (!searchable(board.def(C.at[0], C.at[1], l))) continue;
          const reach = near(l);
          for (const k of reach) {
            const [x, y] = k.split(',').map(Number);
            if (!canCastFrom(board.def(x, y, l))) continue;
            for (const dir of Object.keys(DIR_VEC)) {
              const c = cast(board, x, y, dir, l, REACHES[ri]);
              if (c.path.some(p => p[0] === C.at[0] && p[1] === C.at[1])) bad.push(`${LEVEL_NAME[l]} from ${k} ${dir}`);
            }
          }
        }
        check(`${tag}: and the near side cannot fish it out (${REACH_NAME[ri]})`, bad.length === 0,
          bad.slice(0, 3).join(', ') + ' — the crossing buys nothing');
      }
    }
  }

  // --- per room -----------------------------------------------------------

  // R1. the room needs two seas.
  //
  // Unless it says `teaches: true`, which is a room the player is meant to get
  // wrong for free — the Slack Water is the one, and it exists because four
  // dungeons in a row shipped a mechanic that was legible when it worked and
  // silent when it did not. A teaching room is exempt from the two-sea rule and
  // in exchange may hold NOTHING THE DUNGEON NEEDS: no door it opens, no
  // payout, and nothing in its floor but treasure. Written as an assertion
  // rather than left as a hole, so a later session cannot quietly promote a
  // fixed-tide room by adding one word to it.
  if (r.R.teaches) {
    const keys = (r.def.buried || []).filter(b => /^(key|bosskey)$/i.test(String(b[2])));
    check(`${where}: the teaching room holds nothing the dungeon needs`,
      keys.length === 0 && !(r.R.opens || []).length && !r.R.gives,
      'it pays out ' + (r.R.gives || keys.map(k => k[2]).join(',') || 'a door'));
  } else {
    const seas = new Set([...moorings.map(m => m.sea), ...caches.map(c => c.sea)]);
    check(`${where}: no fixed tide answers the room`, seas.size >= 2,
      'everything in it is done at ' + [...seas].map(l => LEVEL_NAME[l]).join('/'));
  }

  // R2. every door it opens is a door.
  for (const [x, y] of r.R.opens || []) {
    const d = board.def(x, y, 0);
    check(`${where}: the door at ${x},${y} is shut`, !!d && !!(d.flags & F.SOLID),
      `${d ? d.name : 'nothing'} — it is already open`);
    check(`${where}: and it separates the room at all three seas`, doorSeparates(board, x, y),
      'there is a way round it');
  }

  // R3. and a reward it spawns comes back.
  if (r.R.gives) {
    const s = r.def.script;
    check(`${where}: the ${r.R.gives} it pays out is restored on re-entry`,
      !!(s && typeof s.onEnter === 'function'),
      'a script fires once — a player who walks out without it has lost it for the run');
  }

  if (VERBOSE || true) {
    const bits = [
      ...moorings.map((m, i) => `mooring #${i + 1} ${m.post.join(',')} from ${m.from.join(',')} at ${LEVEL_NAME[m.sea]}`),
      ...caches.map((c, i) => `cache #${i + 1} ${c.at.join(',')} from ${c.from.join(',')} at ${LEVEL_NAME[c.sea]}`),
    ];
    if (bits.length) console.log('       ' + bits.join('; '));
  }
}

console.log(`\n=== ${passed} passed, ${failures.length} failed ===`);
for (const f of failures) console.log('  ' + f);
process.exit(failures.length ? 1 : 0);
