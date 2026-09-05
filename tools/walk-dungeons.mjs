// Dungeon walker + ledge harness. Boots headless, enters every room of every
// dungeon, checks it renders and nothing falls through to `void`, then floods
// each dungeon from its entrance treating locked doors as walls until a key is
// spent and the boss door until the Boss Key is found, and asserts every room
// and the boss room is reached.
//
// Also proves the placed ledges: for every ledge run in the data it walks a
// live player into the lip from the high side and asserts the hop fires and
// lands, then walks into it from the low side and asserts it is refused.
//
// All four cardinals are covered. `_` and `"` are horizontal runs probed along
// y; `>` and `<` are VERTICAL runs — a lip facing east is a column, not a row —
// and are probed along x. Scanning every direction as if it were a row was the
// first version of this and it silently reported zero east/west ledges while
// they were sitting in the data.
//
// Boot pattern copied from tools/test.mjs.

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { installData } from '../src/data/index.js';
import { floodDungeon } from './lib/dungeon-flood.mjs';

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

// ESM ignores NODE_PATH, so fall back to the global install explicitly. Same
// shape as tools/test.mjs.
async function loadPlaywright() {
  let mod;
  try {
    mod = await import('playwright');
  } catch (e) {
    const { execSync } = await import('node:child_process');
    const root = execSync('npm root -g', { encoding: 'utf8' }).trim();
    mod = await import(join(root, 'playwright', 'index.js'));
  }
  return mod.chromium ? mod : mod.default;
}

let passed = 0; const failures = [];
function check(name, cond, detail) {
  if (cond) { passed++; console.log('  ok   ' + name); }
  else { failures.push(name + (detail ? ' \u2014 ' + detail : '')); console.log('  FAIL ' + name + (detail ? ' \u2014 ' + detail : '')); }
}

const { chromium } = await loadPlaywright();
// Random high port: concurrent runs must not fight over a fixed one.
const PORT = 20000 + Math.floor(Math.random() * 20000);
const server = await serve(PORT);
// Fall back to a system Chromium when the installed browser build does not
// match the installed playwright package (see check-build.mjs / test.mjs).
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

// `?seed=` pins the save seed a "New Game" started through the title screen
// below picks up (see main.js). Leaving it off — as this file always had —
// means `newProgress()` falls back to `Date.now()`, so the ledge probes
// later in this file share a session with entities (keese included) placed
// from a DIFFERENT random world every run. Most of the time no probe spawn
// point lands next to one; the run where it does reads as an unrelated,
// non-reproducible ledge-hop failure days apart from the actual cause. Same
// seed every other checker in this repo already pins.
const SEED = 20260806;
await page.goto(`http://localhost:${PORT}/index.html?seed=${SEED}`, { waitUntil: 'load' });
await page.waitForFunction(() => !!window.__game, { timeout: 15000 });

const frames = (n) => page.evaluate((k) => new Promise(res => {
  const start = window.__game.frame;
  const tick = () => (window.__game.frame - start >= k) ? res(window.__game.frame) : requestAnimationFrame(tick);
  tick();
}), n);

// main.js only publishes window.__game; everything else comes out of the live
// module graph, which returns the same instances the game is using.
await page.evaluate(async () => {
  const maps = await import('/src/world/maps.js');
  const room = await import('/src/world/room.js');
  const ts = await import('/src/world/tileset.js');
  // PASSABILITY IS NEVER RE-DERIVED HERE. `tileWalkable`/`tileSolid` ask the
  // real `Room.solidAt` — the same function `canOccupy`/`moveEntity` use in
  // the running game — rather than re-deriving which flags block movement.
  // See tools/lib/collision.mjs and CLAUDE.md, Hard rules.
  const col = await import('/tools/lib/collision.mjs');
  window.__MAPS = maps.MAPS;
  window.__getRoom = maps.getRoom;
  window.__getLegend = room.getLegend;
  window.__getTileDef = ts.getTileDef;
  window.__F = ts.F;
  window.__tileWalkable = col.tileWalkable;
  window.__tileSolid = col.tileSolid;
  window.__ROUTE_AVOID = col.ROUTE_AVOID;
  // The Dredge Line's reach, out of feel.js rather than written down here, so
  // retuning the line re-walks every dungeon instead of quietly breaking one.
  const feel = await import('/src/data/feel.js');
  window.__DREDGE_TILES = Math.floor(feel.DREDGE_RANGE / 16);
});

// New game, skip the intro. Booted directly rather than by pressing Enter
// through the title screen and mashing buttons through the cutscene — every
// other tool in this repo boots this way (see `boot()` in
// tools/actor-runtime.mjs) for exactly this reason: a real DOM keydown/keyup
// pair's delivery time relative to the render loop is not perfectly
// reproducible even in headless Chromium, so "press a key, wait N real
// frames, check whether the cutscene ended yet" is a race whose outcome can
// vary run to run by a frame or two. That was invisible for as long as every
// downstream probe happened to be insensitive to it; it stopped being
// invisible the day a probe's spawn point landed pixel-adjacent to a live
// enemy and a one-frame difference in when the room was entered decided
// whether that enemy's very first contact check landed before or after.
await page.evaluate((seed) => {
  const g = window.__game;
  g.newGame(0, 'LINK', seed);
  g.cutscene = null;
  g.mode = 'play';
  g.dialogue.active = false;
}, SEED);

// ---------------------------------------------------------------- part 1: walk
// Six dungeons, and six is now what the data holds: the Reef Palace and the
// Abyssal Keep were folded into d6 by the P8/D6 consolidation. Read out of the
// map registry rather than listed, so the next fold needs no edit here.
const DUNGEONS = await page.evaluate(() => [...window.__MAPS.values()]
  .filter(m => m.dungeon)
  .sort((a, b) => (a.dungeon.index | 0) - (b.dungeon.index | 0))
  .map(m => m.id));

for (const id of DUNGEONS) {
  const res = await page.evaluate(async (mapId) => {
    const g = window.__game;
    const m = window.__MAPS.get(mapId);
    const out = { rooms: [], bad: [] };
    for (const key of Object.keys(m.roomDefs)) {
      const [f, rx, ry] = key.split(',').map(Number);
      // enterMap is (mapId, FLOOR, rx, ry, px, py, dir) — floor is second.
      g.enterMap(mapId, f, rx, ry, 80, 64, 'down', { instant: true });
      // An open dialogue freezes every entity while mode is still 'play', and a
      // reward `say` from the previous room would make this one look inert.
      if (g.dialogue) g.dialogue.active = false;
      const room = g.room;
      if (!room) { out.bad.push(`${key}: no room`); continue; }
      let voids = 0, unknown = [];
      // The ROOM's extent. A 2x1 room is 20x8 and checking the first ten
      // columns of it would leave half of it unproved.
      for (let y = 0; y < room.th; y++) for (let x = 0; x < room.tw; x++) {
        for (const tide of [0, 1, 2]) {
          const d = room.tile(x, y, tide);
          if (!d) { unknown.push(`${x},${y}`); continue; }
          if (d.name === 'void' && !(m.roomDefs[key].map[y][x] === ' ')) voids++;
        }
      }
      if (unknown.length) out.bad.push(`${key}: unresolved tiles ${unknown.slice(0, 3)}`);
      if (voids) out.bad.push(`${key}: ${voids} tiles fell through to void`);
      out.rooms.push(key);
    }
    return out;
  }, id);
  check(`${id}: every room enters and renders`, res.bad.length === 0, res.bad.slice(0, 4).join('; '));
}

// ------------------------------------------------- part 2: dungeon reachability
// Shared with check-dungeon-strands.mjs (tools/lib/dungeon-flood.mjs) so the
// two tools cannot silently diverge on which movement verbs a dungeon has
// actually granted by that point. Plain data logic — no browser needed for
// this part, only for rendering (part 1) and the live ledge probes (part 3).
installData();
const reach = DUNGEONS.map((mapId) => {
  const { missed, bossRoom, bossReached, total } = floodDungeon(mapId);
  return { mapId, missed, boss: bossRoom, bossReached, total };
});

for (const r of reach) {
  check(`${r.mapId}: all ${r.total} rooms reachable`, r.missed.length === 0, r.missed.join(','));
  check(`${r.mapId}: boss room reachable`, r.bossReached, r.boss);
}

// ------------------------------------------- part 2b: the tide-locked rooms
//
// `passable` above lets the flood pick whichever tide level suits each tile,
// on the grounds that the player controls the tide. In a room with `noTide`
// they do not: the conch is refused, so they are stuck on whatever level they
// walked in with, and every other room in the dungeon can hand them any of the
// three. A locked room therefore has to work at ALL THREE levels independently
// — and nothing checked that, because with a scalar tide there was no way to
// say "this room, at this level, on its own".
//
// This is the check the field makes expressible. It is also the one that will
// matter most when P8 re-authors these rooms around the Anchor: an anchor laid
// inside a locked room holds the level you brought, which is the only tide
// mechanic a boss room has left.
const locked = await page.evaluate((ids) => {
  const F = window.__F, getRoom = window.__getRoom;
  const tileWalkable = window.__tileWalkable, ROUTE_AVOID = window.__ROUTE_AVOID;
  // On foot, no items — a locked room's own flood does not vary by dungeon
  // index the way the main reachability flood's `canSwim` does, because the
  // whole point of `noTide` is that nothing about the room adapts to what the
  // player is carrying.
  const CAPS = { jumping: false, swim: false, cutting: false };
  const walk = (room, x, y, t) => (room.flagsAt(x, y, t) & F.STAIRS) || tileWalkable(room, x, y, t, CAPS, ROUTE_AVOID);
  const out = [];
  for (const mapId of ids) {
    const m = window.__MAPS.get(mapId);
    for (const [key, def] of Object.entries(m.roomDefs || {})) {
      if (!def.noTide) continue;
      const sz = def.size || [1, 1];
      const W = (sz[0] | 0) * 10, H = (sz[1] | 0) * 8;
      const [f0, rx0, ry0] = key.split(',').map(Number);
      const room = getRoom(mapId, f0, rx0, ry0);
      for (const t of [0, 1, 2]) {
        // Flood from every walkable tile on the room's border — the ways in —
        // and require it to cover every walkable tile in the room. An island
        // of floor the player cannot get to is the failure being looked for.
        const walkable = [];
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (walk(room, x, y, t)) walkable.push(x + ',' + y);
        if (!walkable.length) { out.push(`${mapId} ${key} @${t}: no floor at all`); continue; }
        const seen = new Set(), q = [];
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const border = x === 0 || y === 0 || x === W - 1 || y === H - 1;
          if (border && walk(room, x, y, t)) { const k = x + ',' + y; if (!seen.has(k)) { seen.add(k); q.push([x, y]); } }
        }
        while (q.length) {
          const [x, y] = q.pop();
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
            const k = nx + ',' + ny;
            if (seen.has(k) || !walk(room, nx, ny, t)) continue;
            seen.add(k); q.push([nx, ny]);
          }
        }
        const stranded = walkable.filter(k => !seen.has(k));
        if (stranded.length) out.push(`${mapId} ${key} @${t}: ${stranded.length} tiles cut off (${stranded.slice(0, 3)})`);
      }
    }
  }
  return out;
}, DUNGEONS);
check('every tide-locked room works at all three levels on its own',
  locked.length === 0, locked.slice(0, 4).join(' | '));

// ------------------------------------------- part 2c: locks that lock something
//
// NOTHING USED TO CHECK THAT A LOCKED DOOR LOCKS ANYTHING, and the flood above
// structurally cannot: it spends a key on any lock it can reach and then asks
// only whether every room came out reachable. A door with a way round it
// therefore reads exactly like a door that got opened, and the key it charges
// for reads exactly like a key that got spent. D1's Clawcrab Den shipped with
// one — row 2 ran clear past the door in the room's west wall, so the Piece of
// Heart behind it was free and Small Key 3 bought nothing. It survived every
// checker in the repo and was found by walking the room.
//
// The claim here is local and cheap: a `dDoorLocked` or `dDoorBoss` tile must
// SEPARATE its room. Flood from the tile on one side of it with the door
// treated as solid, and the tile on the other side must not be reachable.
//
// AT ALL THREE TIDE LEVELS, on the same axis. A door that separates at LOW and
// not at HIGH is not a locked door, it is a locked door and a conch — and the
// conch is the one tool the player always has.
//
// It says nothing about whether the far side is worth anything, or whether the
// key is reachable first; those are the flood's job and it already does them.
const leaky = await page.evaluate((ids) => {
  const F = window.__F, getRoom = window.__getRoom;
  const tileWalkable = window.__tileWalkable, ROUTE_AVOID = window.__ROUTE_AVOID;
  const CAPS = { jumping: false, swim: false, cutting: false };
  const walk = (room, x, y, t) => (room.flagsAt(x, y, t) & F.STAIRS) || tileWalkable(room, x, y, t, CAPS, ROUTE_AVOID);
  const out = []; let total = 0;
  for (const mapId of ids) {
    const m = window.__MAPS.get(mapId);
    for (const [key, def] of Object.entries(m.roomDefs || {})) {
      const sz = def.size || [1, 1];
      const W = (sz[0] | 0) * 10, H = (sz[1] | 0) * 8;
      const [f0, rx0, ry0] = key.split(',').map(Number);
      const room = getRoom(mapId, f0, rx0, ry0);
      // Does the door at (x,y) cut its two neighbours along (ax,ay) apart?
      const cuts = (x, y, ax, ay, t) => {
        const a = [x - ax, y - ay], b = [x + ax, y + ay];
        if (a[0] < 0 || a[1] < 0 || b[0] >= W || b[1] >= H) return false;
        if (!walk(room, a[0], a[1], t) || !walk(room, b[0], b[1], t)) return false;
        const seen = new Set([a.join(',')]), q = [a];
        while (q.length) {
          const [cx, cy] = q.pop();
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = cx + dx, ny = cy + dy;
            if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
            if (nx === x && ny === y) continue;              // the door is shut
            const k = nx + ',' + ny;
            if (seen.has(k) || !walk(room, nx, ny, t)) continue;
            seen.add(k); q.push([nx, ny]);
          }
        }
        return !seen.has(b.join(','));
      };
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const name = room.baseName(x, y);
        if (name !== 'dDoorLocked' && name !== 'dDoorBoss') continue;
        total++;
        const held = [[1, 0], [0, 1]].some(([ax, ay]) => [0, 1, 2].every(t => cuts(x, y, ax, ay, t)));
        if (!held) out.push(`${mapId} ${key} (${def.name || ''}) door at ${x},${y}`);
      }
    }
  }
  return { out, total };
}, DUNGEONS);
check(`every locked door separates its room at all three tide levels (${leaky.total} doors)`,
  leaky.out.length === 0, leaky.out.slice(0, 4).join(' | ') + ' — there is a way round it');

// ------------------------------------------------------- part 3: the ledges
// The four ledge characters, each with the unit vector the player hops along
// and the unit vector its run extends along (always the perpendicular).
const LEDGE_CHARS = {
  '_': { dir: 'down',  ux: 0, uy: 1,  ax: 1, ay: 0 },
  '"': { dir: 'up',    ux: 0, uy: -1, ax: 1, ay: 0 },
  '>': { dir: 'right', ux: 1, uy: 0,  ax: 0, ay: 1 },
  '<': { dir: 'left',  ux: -1, uy: 0, ax: 0, ay: 1 },
};

const placements = await page.evaluate((CHARS) => {
  const out = [];
  for (const [mapId, m] of window.__MAPS) {
    for (const [key, def] of Object.entries(m.roomDefs || {})) {
      const grid = def.map || [];
      const at = (x, y) => (grid[y] || '')[x];
      const seen = new Set();
      for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < (grid[y] || '').length; x++) {
          const ch = at(x, y);
          const spec = CHARS[ch];
          if (!spec || seen.has(`${ch}${x},${y}`)) continue;
          // Walk to the end of the run along the lip's own axis, marking as we
          // go so the rest of the run is not re-reported as its own placement.
          let len = 0, cx = x, cy = y;
          while (at(cx, cy) === ch) {
            seen.add(`${ch}${cx},${cy}`);
            len++; cx += spec.ax; cy += spec.ay;
          }
          out.push({ mapId, key, ch, x0: x, y0: y, len, ...spec });
        }
      }
    }
  }
  return out;
}, LEDGE_CHARS);

const byDir = {};
for (const p of placements) byDir[p.dir] = (byDir[p.dir] || 0) + 1;
console.log(`  ${placements.length} ledge runs placed (${
  Object.entries(byDir).map(([d, n]) => `${d} ${n}`).join(', ') || 'none'})`);

const KEY = { down: 'ArrowDown', up: 'ArrowUp', left: 'ArrowLeft', right: 'ArrowRight' };
const OPP = { down: 'up', up: 'down', left: 'right', right: 'left' };

let hopOk = 0, hopFail = [], blockOk = 0, blockFail = [];
for (const p of placements) {
  const [f, rx, ry] = p.key.split(',').map(Number);
  // The midpoint of the run, measured along the lip's own axis.
  const mx = p.x0 + p.ax * (p.len >> 1);
  const my = p.y0 + p.ay * (p.len >> 1);
  // The lip's coordinate on the hop axis, and which way "past it" points.
  const sign = p.ux || p.uy;
  const lipC = p.ux ? p.x0 : p.y0;
  const tileOf = (a) => (p.ux ? a.tx : a.ty);
  const beyond = (t) => (sign > 0 ? t > lipC : t < lipC);
  // --- downhill: walk into the lip from the high side, expect a hop that lands
  const place = async (a, tx, ty, dir) => page.evaluate(async (b) => {
    const g = window.__game;
    // Rooms are full of live enemies. A parked player dies, the game drops into
    // 'gameover' where nothing updates, and EVERY later probe in the run reads
    // as "the hop did not fire" — the same trap the boss harness documents.
    g.mode = 'play';
    g.progress.hearts = g.progress.maxHearts;
    g.enterMap(b.mapId, b.f, b.rx, b.ry, 80, 64, b.dir, { instant: true });
    await new Promise(r => { const s = g.frame; const t = () => (g.frame - s >= 3 ? r() : requestAnimationFrame(t)); t(); });
    // An open dialogue freezes every entity while mode is still 'play'.
    if (g.dialogue) g.dialogue.active = false;
    g.mode = 'play';
    g.progress.hearts = g.progress.maxHearts;
    g.player.invuln = 100000;               // nothing may interrupt the probe
    g.entities = g.entities.filter(e => e === g.player);
    // Every other tide-setting call in this repo's harnesses passes
    // `{instant: true}` — a scripted probe never wants the sweep transition a
    // real conch press triggers. This one didn't, so `tide.busy` stayed true
    // (a fresh sweep) for the whole probe whenever the room the PREVIOUS
    // probe left behind wasn't already at MID.
    g.tide.setLevel(1, { instant: true });
    g.player.z = 0; g.player.vz = 0; g.player.jumping = false; g.player.ledgeHop = null;
    // A live enemy still shares this room for the 3-frame settle above (the
    // entity filter hasn't run yet, on purpose — see below), so a keese
    // parked next to a probe's fixed spawn point can land a contact hit
    // before this line ever executes. `knockTime`/`knockX`/`knockY` are the
    // one piece of that hit's state z/vz/jumping/ledgeHop above don't clear,
    // and left alone they silently override the probe's own key press for
    // however many frames of knockback were still in flight.
    g.player.knockTime = 0; g.player.knockX = 0; g.player.knockY = 0;
    g.player.x = b.tx * 16; g.player.y = b.ty * 16;
    g.player.lastSafe.x = g.player.x; g.player.lastSafe.y = g.player.y;
    await new Promise(r => { const s = g.frame; const t = () => (g.frame - s >= 2 ? r() : requestAnimationFrame(t)); t(); });
    // Clear the text box LAST. A room script or a reward `say` can reopen it
    // during the settle, and an open dialogue freezes every entity while `mode`
    // is still 'play' — the player simply ignores the key and the probe reads
    // as "the hop did not fire".
    if (g.dialogue) g.dialogue.active = false;
    g.mode = 'play';
    return {
      x0: g.player.x, y0: g.player.y,
      tx: Math.floor((g.player.x + 8) / 16), ty: Math.floor((g.player.y + 8) / 16),
      rk: g.room.key, mode: g.mode, dlg: !!(g.dialogue && g.dialogue.active),
    };
  }, { ...a, tx, ty, dir });

  const at = { mapId: p.mapId, f, rx, ry };
  const down = await place(at, mx - p.ux, my - p.uy, p.dir);
  // 22 frames is far enough to clear a 1-3 tile lip and short enough that the
  // player never reaches the room edge — walking out of the room and arriving in
  // the next one reads exactly like a failed hop.
  await page.keyboard.down(KEY[p.dir]);
  await frames(22);
  await page.keyboard.up(KEY[p.dir]);
  // The hop drives z along a scripted arc; measuring mid-arc reads as a fail.
  await page.evaluate(() => new Promise(res => {
    let n = 0;
    const t = () => (++n > 60 || (!window.__game.player.ledgeHop && window.__game.player.z === 0)) ? res() : requestAnimationFrame(t);
    t();
  }));
  const after = await page.evaluate(() => ({
    x: window.__game.player.x, y: window.__game.player.y, z: window.__game.player.z,
    tx: Math.floor((window.__game.player.x + 8) / 16),
    ty: Math.floor((window.__game.player.y + 8) / 16),
  }));
  const where = `${p.mapId} ${p.key} '${p.ch}' ${p.dir} @${p.x0},${p.y0}`;
  if (tileOf(down) !== lipC - sign || down.rk !== p.key || down.mode !== 'play' || down.dlg) {
    hopFail.push(`${where}: harness failed to place the player (at ${down.tx},${down.ty} in ${down.rk})`);
  } else if (beyond(tileOf(after)) && after.z === 0) hopOk++;
  else hopFail.push(`${where}: ${down.x0},${down.y0} -> ${after.x},${after.y} (tile ${after.tx},${after.ty}, z ${after.z})`);

  // --- uphill: walk into the same lip from the low side, expect to be refused
  const up0 = await place(at, mx + p.ux, my + p.uy, OPP[p.dir]);
  await page.keyboard.down(KEY[OPP[p.dir]]);
  await frames(22);
  await page.keyboard.up(KEY[OPP[p.dir]]);
  await frames(4);
  const up = await page.evaluate(() => ({
    tx: Math.floor((window.__game.player.x + 8) / 16),
    ty: Math.floor((window.__game.player.y + 8) / 16),
  }));
  if (tileOf(up0) !== lipC + sign || up0.rk !== p.key || up0.mode !== 'play' || up0.dlg) {
    blockFail.push(`${where}: harness failed to place the player (at ${up0.tx},${up0.ty})`);
  } else if (beyond(tileOf(up))) blockOk++;
  else blockFail.push(`${where}: walked up onto/past the lip (tile ${up.tx},${up.ty})`);
}
check(`every ledge run hops downhill (${hopOk}/${placements.length})`, hopFail.length === 0, hopFail.slice(0, 6).join(' | '));
check(`every ledge run blocks uphill (${blockOk}/${placements.length})`, blockFail.length === 0, blockFail.slice(0, 6).join(' | '));

check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));

console.log(`\n=== ${passed} passed, ${failures.length} failed ===`);
for (const f of failures) console.log('  ' + f);
await browser.close(); server.close();
process.exit(failures.length ? 1 : 0);
