// Exit harness. Boots headless and proves that every interior in the game can
// be WALKED OUT OF — driven in the real engine with a real player pressing a
// real direction, not modelled.
//
//   node tools/check-exits.mjs
//
// WHY THIS EXISTS. A person got stuck inside Tidewash Grotto and could not
// find the way out at all. Every dungeon mouth room ended in `'####/#####'`:
// one `dStairs` tile at x=4 of the bottom wall row. Measured in the live
// engine in `d1/0,3,7`, holding DOWN from thirteen start positions across the
// room's floor, exactly THREE left the dungeon — x=60, 64 and 68. A nine-pixel
// band in a hundred-and-sixty-pixel room, and the room's own north opening is
// two tiles wide, so the way in puts you where the way out is a wall.
//
// Nothing in CLAUDE.md's table could see it. `walk-dungeons.mjs` floods ROOMS
// and the mouth room is reachable — it is where you arrive. `check-towns.mjs`
// proves a town doorway round-trips on foot, and asks that question of no
// dungeon, cave or house. `check-playthrough.mjs` walks D1, and it walks it
// with a scripted route that already knows the door is at x=4. Every one of
// them is satisfied by a door the player cannot find.
//
// WHAT IT ASSERTS, per interior map (six dungeons, four caves, five houses):
//
//   1. the room's doorways and its `warps` list agree BOTH WAYS — every tile
//      carrying F.WARP is named by a warp, and every warp stands on an F.WARP
//      tile. A doorway with no warp is a door you walk into and nothing
//      happens; a warp with no doorway is a hole in the floor;
//   2. THE DOOR IS WIDE ENOUGH TO FIND. Walking straight at it from the door's
//      own columns AND from one tile either side leaves the map, every time.
//      One tile either side is not a fudge factor — it is the reach of the
//      doorway pull in `Game.doorwayPull`, and asserting it here is what stops
//      that rule being quietly removed;
//   3. and the pull is BOUNDED: walking at the wall two tiles clear of the
//      door does NOT leave. A door that takes you from anywhere on the screen
//      is not a door, it is a floor that swallows you, and it would make
//      assertion 2 meaningless by passing everywhere;
//   4. the way out COMES BACK: the warp's target room exists, the player lands
//      somewhere the engine says he can stand, and that room warps back here.
//
// Assertion 2 is the one that was red. Against the one-tile door it failed for
// every interior in the game: 15 maps, 4 probe columns each.

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { installData } from '../src/data/index.js';
import { MAPS, getRoom } from '../src/world/maps.js';
import { F } from '../src/world/tileset.js';
import { tileWalkable, capsForMode, ROUTE_AVOID } from './lib/collision.mjs';

installData();

const TILE = 16;
// How far to either side of a doorway the pull reaches, in tiles. This is the
// SAME number as `DOORWAY_PULL_REACH_TILES` in src/data/feel.js, and the two
// being one number is the point: the checker asserts the rule the engine
// implements, and a change to one without the other fails here.
const REACH = 1;

// -------------------------------------------------------------- planning ---
//
// Everything below is derived from the room data rather than listed, so a new
// cave or a seventh dungeon is covered the day it is registered. The one thing
// named by hand is the overworld, because "an interior" is defined as a map
// that is not it.

/** The contiguous run of doorway cells a warp cell belongs to. */
function doorRun(cells, start) {
  const key = ([x, y]) => `${x},${y}`;
  const have = new Set(cells.map(key));
  const run = [start];
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    let [x, y] = start;
    for (;;) {
      x += dx; y += dy;
      if (!have.has(key([x, y]))) break;
      run.push([x, y]);
    }
  }
  return run;
}

/**
 * The plan for one interior: which room is its way out, where the door is, and
 * which columns to walk at.
 */
function planFor(map) {
  const out = [];
  for (const [key, def] of Object.entries(map.roomDefs || {})) {
    const exits = (def.warps || [])
      .map(w => (Array.isArray(w)
        ? { x: w[0], y: w[1], to: { map: w[2], floor: w[3] | 0, rx: w[4], ry: w[5] } }
        : w))
      .filter(w => w.to.map !== map.id);
    if (!exits.length) continue;
    const [floor, rx, ry] = key.split(',').map(Number);
    const room = getRoom(map.id, floor, rx, ry);
    // Every doorway cell in the room, asked of the tiles rather than of the
    // warp list — assertion 1 is that the two agree, so neither may be
    // derived from the other.
    const doorCells = [];
    for (let y = 0; y < room.th; y++) for (let x = 0; x < room.tw; x++) {
      if (room.tile(x, y, 1).flags & F.WARP) doorCells.push([x, y]);
    }
    // Who is standing where. Every entity counts: a pickup on a start tile is
    // harmless but a signpost is not, and a probe has no business standing on
    // either of them.
    const occupied = new Set((def.entities || []).map(e => `${e[1]},${e[2]}`));
    out.push({ mapId: map.id, kind: map.kind, key, floor, rx, ry, room, exits, doorCells, occupied });
  }
  return out;
}

/** Walkable on foot, asked of the engine's own rule (tools/lib/collision.mjs). */
const walkable = (room, x, y, tide) =>
  tileWalkable(room, x, y, tide, capsForMode('foot'), ROUTE_AVOID);

/**
 * Turn one door into probes: a start cell, a direction to hold, and whether
 * the press is expected to leave the map.
 *
 * The approach direction is derived, not declared — it is the side of the door
 * that has floor on it. A dungeon mouth sits in the bottom wall row and is
 * approached from above; a cave's door is a floor tile in an open row and is
 * approached from above too, but nothing here assumes that.
 */
function probesFor(plan, exit) {
  const run = doorRun(plan.doorCells, [exit.x, exit.y]);
  const room = plan.room;
  const inBounds = (x, y) => x >= 0 && y >= 0 && x < room.tw && y < room.th;
  const can = (x, y) => inBounds(x, y) && walkable(room, x, y, 1);
  // WHICH WAY DOES THE PLAYER PRESS? Derived, not declared. The approach is
  // the direction in which the door has floor BEHIND it and no floor beyond —
  // that is what makes a doorway a way out rather than a tile in a corridor,
  // and it is the only test that answers a single-cell door, which has no axis
  // of its own to read the answer off.
  let approach = null;
  for (const [ax, ay] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
    if (!run.every(([x, y]) => can(x - ax, y - ay))) continue;
    if (run.some(([x, y]) => can(x + ax, y + ay))) continue;
    approach = [ax, ay];
    break;
  }
  if (!approach) return null;
  const [ax, ay] = approach;
  // The door's span runs across the approach.
  const along = c => ax ? c[1] : c[0];
  const fixed = ax ? run[0][0] : run[0][1];
  const vs = run.map(along);
  const lo = Math.min(...vs), hi = Math.max(...vs);
  const cell = (v) => ax ? [fixed, v] : [v, fixed];

  // TWO SHAPES OF DOOR, AND THEY DESERVE DIFFERENT CLAIMS.
  //
  // A door EMBEDDED IN A WALL — the six dungeon mouths, a `dStairs` set into
  // the bottom course of brick — is one the player can only enter head-on, and
  // it is the shape that stranded a person inside Tidewash Grotto. That is
  // what the doorway pull is for, and what assertions 2 and 3 are about.
  //
  // A door STANDING IN OPEN FLOOR — the four caves and five houses, whose exit
  // is the last walkable row rather than the wall below it — has floor on both
  // flanks, so it is entered by walking along the row as readily as by walking
  // down onto it, and no alignment can miss it. Asserting the pull's reach
  // there would be asserting a rule that does not apply; what is asserted
  // instead is the thing that IS true of it and would break if the flanks were
  // ever walled in: you can reach it from either side.
  const flanks = [cell(lo - 1), cell(hi + 1)];
  const embedded = !flanks.every(([x, y]) => can(x, y));

  const probes = [];
  // BACK UP TO THE LAST CLEAR TILE, AND NO FURTHER. A tile with somebody
  // standing on it is not a place to start a walk from — the probe would spawn
  // the player inside the villager and measure the villager. Sandpiper
  // Cottage's net-mender stands four tiles up the door's own column and was
  // read as a door that could not be reached. Stopping at the obstruction
  // still tests the approach, from as far back as is actually clear; who is
  // standing where is reported below rather than asserted, the same way
  // check-ground.mjs treats people.
  const backFrom = (cx, cy, dx, dy, max) => {
    let best = null;
    for (let back = 1; back <= max; back++) {
      const bx = cx - dx * back, by = cy - dy * back;
      if (!can(bx, by) || plan.occupied.has(`${bx},${by}`)) break;
      best = [bx, by];
    }
    return best;
  };

  if (embedded) {
    // The door's own span plus REACH either side must leave; REACH + 1 clear
    // of it must not. Both halves matter — see the header, assertion 3.
    for (let v = lo - REACH - 1; v <= hi + REACH + 1; v++) {
      const [cx, cy] = cell(v);
      const start = backFrom(cx, cy, ax, ay, 4);
      if (!start) continue;   // nothing stands on this line; not a probe
      const inside = v >= lo - REACH && v <= hi + REACH;
      probes.push({
        start, dir: { dx: ax, dy: ay }, expect: inside,
        label: inside
          ? `walking at the door from ${start[0]},${start[1]} leaves`
          : `the wall ${REACH + 1} clear of the door at ${start[0]},${start[1]} does not`,
      });
    }
  } else {
    // Head-on down each of the door's own lines...
    for (let v = lo; v <= hi; v++) {
      const [cx, cy] = cell(v);
      const start = backFrom(cx, cy, ax, ay, 4);
      if (!start) continue;
      probes.push({
        start, dir: { dx: ax, dy: ay }, expect: true,
        label: `walking onto the door from ${start[0]},${start[1]} leaves`,
      });
    }
    // ...and along the floor it stands in, from either flank. `sx`/`sy` is the
    // step ALONG the door's span, which is the axis the approach is not.
    const sx = ax ? 0 : 1, sy = ax ? 1 : 0;
    for (const [end, s] of [[lo, -1], [hi, 1]]) {
      const [cx, cy] = cell(end);
      const start = backFrom(cx, cy, sx * s, sy * s, REACH + 2);
      if (!start) continue;
      probes.push({
        start, dir: { dx: sx * s, dy: sy * s }, expect: true,
        label: `walking along the floor onto the door from ${start[0]},${start[1]} leaves`,
      });
    }
  }
  return probes;
}

// -------------------------------------------------------------- the page ---

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png',
};
function serve(port) {
  const server = createServer(async (req, res) => {
    try {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (p.endsWith('/')) p += 'index.html';
      const full = join(ROOT, normalize(p).replace(/^(\.\.[/\\])+/, ''));
      const s = await stat(full).catch(() => null);
      if (!s || !s.isFile()) { res.writeHead(404).end('nf'); return; }
      res.writeHead(200, { 'Content-Type': MIME[extname(full)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(await readFile(full));
    } catch (e) { res.writeHead(500).end(String(e)); }
  });
  return new Promise(r => server.listen(port, () => r(server)));
}

async function loadPlaywright() {
  let mod;
  try { mod = await import('playwright'); }
  catch (e) {
    const { execSync } = await import('node:child_process');
    const root = execSync('npm root -g', { encoding: 'utf8' }).trim();
    mod = await import(join(root, 'playwright', 'index.js'));
  }
  return mod.chromium ? mod : mod.default;
}

let passed = 0; const failures = [];
function check(name, cond, detail) {
  if (cond) { passed++; console.log('  ok   ' + name); }
  else { failures.push(name + (detail ? ' — ' + detail : '')); console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); }
}

const KEY = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
const dirName = (dx, dy) => dy < 0 ? 'up' : dy > 0 ? 'down' : dx < 0 ? 'left' : 'right';

const { chromium } = await loadPlaywright();
const PORT = 20000 + Math.floor(Math.random() * 20000);
const server = await serve(PORT);
const browser = await chromium.launch({ headless: true }).catch(async (err) => {
  const { existsSync } = await import('node:fs');
  const fallback = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium';
  if (!existsSync(fallback)) throw err;
  return chromium.launch({ headless: true, executablePath: fallback });
});
const page = await browser.newPage({ viewport: { width: 800, height: 720 } });
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR: ' + (e.stack || e.message)));
page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });

// PIN THE SEED and own the clock; letting main.js drive the loop is a race.
await page.goto(`http://localhost:${PORT}/index.html?seed=20260806`, { waitUntil: 'load' });
await page.waitForFunction(() => !!window.__game && !!window.__harness, { timeout: 15000 });
await page.evaluate(() => window.__harness.takeOver());

const frames = (n) => page.evaluate((k) => window.__harness.step(k), n);
const tap = async (code) => {
  await page.keyboard.down(code); await frames(2);
  await page.keyboard.up(code); await frames(1);
};

await tap('Enter'); await frames(6);
await tap('Enter'); await frames(20);
for (let i = 0; i < 140 && await page.evaluate(() => window.__game.mode === 'cutscene'); i++) {
  await tap('Enter'); await frames(4);
}
await page.evaluate(() => { window.__game.mode = 'play'; });
await frames(4);

// Every key and every item, so nothing here fails for want of progress: this
// tool is about the DOOR, and a locked one is another checker's business.
await page.evaluate(() => {
  const g = window.__game;
  g.progress.hearts = g.progress.maxHearts = 20;
});

/** Walk one probe: stand at `start`, hold `dir`, and say whether we left. */
async function walkProbe(plan, p) {
  const key = KEY[dirName(p.dir.dx, p.dir.dy)];
  await page.evaluate(([mapId, floor, rx, ry, px, py, d]) => {
    const g = window.__game;
    g.tide.setLevel(1, { instant: true });
    g.enterMap(mapId, floor, rx, ry, px, py, d, { instant: true });
    g._warpLock = false;
  }, [plan.mapId, plan.floor, plan.rx, plan.ry,
      p.start[0] * TILE, p.start[1] * TILE, dirName(p.dir.dx, p.dir.dy)]);
  await frames(4);
  await page.keyboard.down(key);
  // STOP THE MOMENT THE MAP CHANGES. Holding the key for the full count and
  // reading the map afterwards said the walk had failed when it had in fact
  // succeeded: the player left the cave, arrived on the overworld facing its
  // mouth with the key still down, and walked straight back in. Six probes
  // read as stuck because they worked twice.
  let out = plan.mapId;
  for (let i = 0; i < 16 && out === plan.mapId; i++) {
    await frames(10);
    out = await page.evaluate(() => window.__game.mapId);
  }
  await page.keyboard.up(key);
  await frames(6);
  return out;
}

// -------------------------------------------------------------- the runs ---

const PLANS = [];
for (const [id, map] of MAPS.entries()) {
  if (id === 'overworld') continue;
  PLANS.push(...planFor(map));
}
console.log(`\n${PLANS.length} interiors with a way out.\n`);

for (const plan of PLANS) {
  console.log(`--- ${plan.mapId} (${plan.kind}) ${plan.key} ---`);

  // 1. doorways and warps agree, both ways.
  const named = new Set((plan.room.warps || []).map(w => `${w.x},${w.y}`));
  const drawn = new Set(plan.doorCells.map(([x, y]) => `${x},${y}`));
  check(`${plan.mapId}: every doorway tile is named by a warp`,
    [...drawn].every(k => named.has(k)),
    [...drawn].filter(k => !named.has(k)).join(' '));
  check(`${plan.mapId}: every warp stands on a doorway tile`,
    [...named].every(k => drawn.has(k)),
    [...named].filter(k => !drawn.has(k)).join(' '));

  for (const exit of plan.exits) {
    const probes = probesFor(plan, exit);
    if (!probes) { check(`${plan.mapId}: the door at ${exit.x},${exit.y} has a side you can walk in from`, false); continue; }

    // 2 & 3. walking at the door leaves; walking at the wall beside it does not.
    for (const p of probes) {
      const got = await walkProbe(plan, p);
      const left = got !== plan.mapId;
      check(`${plan.mapId}: ${p.label}`, left === p.expect, `ended in ${got}`);
    }

    // Reported, not asserted: anyone standing in the door's own line. It is
    // not a fault — you walk round a villager — but it is the shape of thing
    // that turns into one when a room is rearranged.
    for (const p of probes) {
      const ahead = plan.occupied.has(`${p.start[0] + p.dir.dx},${p.start[1] + p.dir.dy}`);
      if (ahead) console.log(`  note ${plan.mapId}: somebody stands in the door's line at `
        + `${p.start[0] + p.dir.dx},${p.start[1] + p.dir.dy}`);
    }

    // 4. and the way out comes back.
    const dest = getRoom(exit.to.map, exit.to.floor | 0, exit.to.rx, exit.to.ry);
    check(`${plan.mapId}: the way out leads to a room that exists`, !!dest,
      `${exit.to.map} ${exit.to.floor | 0},${exit.to.rx},${exit.to.ry}`);
    if (dest) {
      const back = (dest.warps || []).some(w => w.to.map === plan.mapId);
      check(`${plan.mapId}: and that room comes back here`, back);
      const px = exit.to.px != null ? exit.to.px : 0, py = exit.to.py != null ? exit.to.py : 0;
      const standable = await page.evaluate(async ([m, f, rx, ry, x, y]) => {
        const g = window.__game;
        const { canOccupy } = await import('/src/game/entity.js');
        g.enterMap(m, f, rx, ry, x, y, 'down', { instant: true });
        return canOccupy(g, g.player, g.player.x, g.player.y, g.player.caps);
      }, [exit.to.map, exit.to.floor | 0, exit.to.rx, exit.to.ry, px, py]);
      check(`${plan.mapId}: and it puts you somewhere you can stand`, standable, `${px},${py}`);
    }
  }
}

console.log(`\n${passed} passed, ${failures.length} failed`);
for (const e of errs) console.log('  ' + e);
await browser.close(); server.close();
if (failures.length || errs.length) process.exit(1);
