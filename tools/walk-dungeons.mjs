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
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 800, height: 720 } });
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR: ' + (e.stack || e.message)));
page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });

await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'load' });
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
  window.__MAPS = maps.MAPS;
  window.__getLegend = room.getLegend;
  window.__getTileDef = ts.getTileDef;
  window.__F = ts.F;
});

// New game, skip the intro.
await page.keyboard.press('Enter'); await frames(6);
await page.keyboard.press('Enter'); await frames(20);
for (let i = 0; i < 140 && await page.evaluate(() => window.__game.mode === 'cutscene'); i++) {
  await page.keyboard.press(i % 2 ? 'Enter' : 'x'); await frames(4);
}

// ---------------------------------------------------------------- part 1: walk
const DUNGEONS = ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8'];

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
      for (let y = 0; y < 8; y++) for (let x = 0; x < 10; x++) {
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
const reach = await page.evaluate((ids) => {
  const F = window.__F, getTileDef = window.__getTileDef, getLegend = window.__getLegend;
  const W = 10, H = 8;
  const report = [];
  for (const mapId of ids) {
    const m = window.__MAPS.get(mapId);
    const legend = getLegend(m.legend);
    const defOf = (ch, tide) => {
      let d = getTileDef(legend[ch]);
      for (let i = 0; i < 4 && d && d.tide; i++) d = getTileDef(d.tide[tide]);
      return d;
    };
    // Passable if walkable at ANY tide level — the player controls the tide.
    //
    // Since the tide became a field this is an UPPER BOUND rather than an
    // equality, and deliberately so. A tile's walkability depends only on the
    // level IT resolves at, and the Anchor's only power is to change that level
    // for a patch of tiles — so no placement can make a tile passable that is
    // impassable at all three levels. Anything this flood cannot reach, no
    // arrangement of held water reaches either.
    //
    // The direction that bound does not cover is the one the level-aware flood
    // in check-overworld.mjs measures: this model grants a different level on
    // every tile at once, which the conch alone cannot do. Here that gap is
    // narrower than it looks, because the Anchor is recallable from anywhere —
    // every field it can create is reversible, so the state that has to be
    // connected is the base state, and the base state is what this walks.
    const walkableAt = (ch, t) => {
      const d = defOf(ch, t);
      if (!d) return false;
      if (d.flags & F.STAIRS) return true;        // you stand on a stair to use it
      return !(d.flags & (F.VOID | F.SOLID | F.PIT | F.DEEP | F.LEDGE | F.HAZARD));
    };
    const passable = (ch) => [0, 1, 2].some(t => walkableAt(ch, t));
    // The level a tile resolves at under a field: the held level inside the
    // anchor's patch, the base outside it. Rooms are 10x8 and the patch is a
    // square of radius ANCHOR_RADIUS_TILES.
    const R = 2;
    const levelAt = (x, y, base, a) =>
      (a && Math.abs(x - a.tx) <= R && Math.abs(y - a.ty) <= R) ? a.level : base;
    // Roc's Feather clears a one-tile gap, and `solidAt` lets a jumping player
    // through DEEP and JUMPABLE alike. Half of d4 is a one-tile drown-wall band
    // that is a wall at LOW/MID and deep water at HIGH — the intended crossing
    // is to raise the sea and jump it. A flood that cannot jump reports 15 of
    // d4's 18 rooms stranded, which is a harness limitation, not a dungeon bug.
    const jumpable = (ch) => {
      for (const t of [0, 1, 2]) {
        const d = defOf(ch, t);
        if (d && (d.flags & (F.DEEP | F.JUMPABLE))) return true;
      }
      return false;
    };
    const isLock = (ch) => legend[ch] === 'dDoorLocked';
    const isBossDoor = (ch) => legend[ch] === 'dDoorBoss';
    // Floors are joined by warps, not by seams. A flood that only crosses room
    // edges never leaves floor 0, which reads as "every upper room stranded".
    const warpsOut = new Map();   // 'rk:x,y' -> 'rk:x,y'
    for (const [rk, def] of Object.entries(m.roomDefs)) {
      for (const w0 of def.warps || []) {
        const w = Array.isArray(w0)
          ? { x: w0[0], y: w0[1], to: { map: w0[2], floor: w0[3] | 0, rx: w0[4], ry: w0[5] } }
          : w0;
        if (w.to.map !== mapId) continue;      // leaving the dungeon: not our problem
        const dst = `${w.to.floor},${w.to.rx},${w.to.ry}`;
        if (!m.roomDefs[dst]) continue;
        const px = Math.floor((w.to.px ?? 80) / 16), py = Math.floor((w.to.py ?? 64) / 16);
        warpsOut.set(`${rk}:${w.x},${w.y}`, `${dst}:${px},${py}`);
      }
    }

    // Count keys available in the whole dungeon, spent as doors are opened.
    let keys = 0;
    for (const def of Object.values(m.roomDefs)) {
      for (const e of def.entities || []) if (e[0] === 'pickup' && e[3] && e[3].kind === 'key') keys++;
      for (const e of def.entities || []) if (e[0] === 'chest' && e[3] && e[3].item === 'key') keys++;
      for (const s of def.puzzle?.reward?.spawn || []) if (s[3] && s[3].kind === 'key') keys++;
    }
    let bossKey = false;
    for (const def of Object.values(m.roomDefs)) {
      for (const e of def.entities || []) {
        const o = e[3] || {};
        if (String(o.pickup || o.item || o.kind || '').toLowerCase() === 'bosskey') bossKey = true;
      }
    }

    const start = m.dungeon.startRoom;
    const startKey = start.includes(',') && start.split(',').length === 3 ? start : '0,' + start;
    const seedRoom = m.roomDefs[startKey] ? startKey : Object.keys(m.roomDefs)[0];

    // Flood tile-by-tile across rooms: a seam is crossed when both sides have a
    // passable tile in the matching row/column.
    const seen = new Set();
    const lockedSeen = new Set();
    const q = [];
    const push = (rk, x, y) => {
      const k = rk + ':' + x + ',' + y;
      if (seen.has(k)) return;
      seen.add(k); q.push([rk, x, y]);
    };
    // seed anywhere passable in the start room
    const sd = m.roomDefs[seedRoom];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (passable(sd.map[y][x])) { push(seedRoom, x, y); }

    let progress = true;
    while (progress) {
      progress = false;
      while (q.length) {
        const [rk, x, y] = q.pop();
        const def = m.roomDefs[rk];
        const w = warpsOut.get(rk + ':' + x + ',' + y);
        if (w) { const [wrk, wxy] = w.split(':'); const [wx, wy] = wxy.split(',').map(Number); push(wrk, wx, wy); }
        const [f, rx, ry] = rk.split(',').map(Number);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < W && ny < H) {
            const ch = def.map[ny][nx];
            if (passable(ch)) push(rk, nx, ny);
            else if (jumpable(ch)) {
              const jx = x + dx * 2, jy = y + dy * 2;
              if (jx >= 0 && jy >= 0 && jx < W && jy < H && passable(def.map[jy][jx])) push(rk, jx, jy);
            }
            else if (isLock(ch)) lockedSeen.add(rk + ':' + nx + ',' + ny);
            else if (isBossDoor(ch) && bossKey) lockedSeen.add(rk + ':' + nx + ',' + ny + ':boss');
            continue;
          }
          // stepping off the room edge into the neighbouring room
          const nk = `${f},${rx + (nx < 0 ? -1 : nx >= W ? 1 : 0)},${ry + (ny < 0 ? -1 : ny >= H ? 1 : 0)}`;
          const nd = m.roomDefs[nk];
          if (!nd) continue;
          const tx = (nx + W) % W, ty = (ny + H) % H;
          if (passable(nd.map[ty][tx])) push(nk, tx, ty);
        }
      }
      // spend a key on one still-closed lock we can see
      for (const l of lockedSeen) {
        const parts = l.split(':');
        const isBoss = parts[2] === 'boss';
        if (!isBoss && keys <= 0) continue;
        const [rk, xy] = parts;
        const [x, y] = xy.split(',').map(Number);
        if (seen.has(rk + ':' + x + ',' + y)) continue;
        if (!isBoss) keys--;
        push(rk, x, y);
        lockedSeen.delete(l);
        progress = true;
        break;
      }
    }
    const reachedRooms = new Set([...seen].map(k => k.split(':')[0]));
    const all = Object.keys(m.roomDefs);
    const missed = all.filter(r => !reachedRooms.has(r));
    report.push({ mapId, missed, boss: m.dungeon.bossRoom, bossReached: reachedRooms.has(m.dungeon.bossRoom), total: all.length });
  }
  return report;
}, DUNGEONS);

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
  const F = window.__F, getTileDef = window.__getTileDef, getLegend = window.__getLegend;
  const W = 10, H = 8;
  const out = [];
  for (const mapId of ids) {
    const m = window.__MAPS.get(mapId);
    for (const [key, def] of Object.entries(m.roomDefs || {})) {
      if (!def.noTide) continue;
      const legend = getLegend(def.legend || m.legend);
      const walk = (ch, t) => {
        let d = getTileDef(legend[ch]);
        for (let i = 0; i < 4 && d && d.tide; i++) d = getTileDef(d.tide[t]);
        if (!d) return false;
        if (d.flags & F.STAIRS) return true;
        return !(d.flags & (F.VOID | F.SOLID | F.PIT | F.DEEP | F.LEDGE | F.HAZARD));
      };
      for (const t of [0, 1, 2]) {
        // Flood from every walkable tile on the room's border — the ways in —
        // and require it to cover every walkable tile in the room. An island
        // of floor the player cannot get to is the failure being looked for.
        const walkable = [];
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (walk(def.map[y][x], t)) walkable.push(x + ',' + y);
        if (!walkable.length) { out.push(`${mapId} ${key} @${t}: no floor at all`); continue; }
        const seen = new Set(), q = [];
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const border = x === 0 || y === 0 || x === W - 1 || y === H - 1;
          if (border && walk(def.map[y][x], t)) { const k = x + ',' + y; if (!seen.has(k)) { seen.add(k); q.push([x, y]); } }
        }
        while (q.length) {
          const [x, y] = q.pop();
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
            const k = nx + ',' + ny;
            if (seen.has(k) || !walk(def.map[ny][nx], t)) continue;
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
    g.tide.setLevel(1);
    g.player.z = 0; g.player.vz = 0; g.player.jumping = false; g.player.ledgeHop = null;
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
