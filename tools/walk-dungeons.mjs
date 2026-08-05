// Dungeon walker + ledge harness. Boots headless, enters every room of every
// dungeon, checks it renders and nothing falls through to `void`, then floods
// each dungeon from its entrance treating locked doors as walls until a key is
// spent and the boss door until the Boss Key is found, and asserts every room
// and the boss room is reached.
//
// Also proves the newly-placed ledges: for every `_` run in the data it walks a
// live player into the lip from above and asserts the hop fires and lands, and
// walks into it from below and asserts it is refused.
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
    const passable = (ch) => {
      for (const t of [0, 1, 2]) {
        const d = defOf(ch, t);
        if (!d) continue;
        if (d.flags & F.STAIRS) return true;      // you stand on a stair to use it
        if (!(d.flags & (F.VOID | F.SOLID | F.PIT | F.DEEP | F.LEDGE | F.HAZARD))) return true;
      }
      return false;
    };
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

// ------------------------------------------------------- part 3: the ledges
const placements = await page.evaluate(() => {
  const out = [];
  for (const [mapId, m] of window.__MAPS) {
    for (const [key, def] of Object.entries(m.roomDefs || {})) {
      (def.map || []).forEach((row, y) => {
        let i = 0;
        while (i < row.length) {
          if (row[i] !== '_') { i++; continue; }
          let j = i; while (row[j] === '_') j++;
          out.push({ mapId, key, y, x0: i, len: j - i });
          i = j;
        }
      });
    }
  }
  return out;
});
console.log(`  ${placements.length} ledge runs placed`);

let hopOk = 0, hopFail = [], blockOk = 0, blockFail = [];
for (const p of placements) {
  const [f, rx, ry] = p.key.split(',').map(Number);
  const mid = p.x0 + (p.len >> 1);
  // --- downhill: walk into the lip from above, expect a hop that lands below
  const place = async (a, row, dir) => page.evaluate(async (b) => {
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
    g.player.x = b.mid * 16; g.player.y = b.row * 16;
    g.player.lastSafe.x = g.player.x; g.player.lastSafe.y = g.player.y;
    await new Promise(r => { const s = g.frame; const t = () => (g.frame - s >= 2 ? r() : requestAnimationFrame(t)); t(); });
    // Clear the text box LAST. A room script or a reward `say` can reopen it
    // during the settle, and an open dialogue freezes every entity while `mode`
    // is still 'play' — the player simply ignores the key and the probe reads
    // as "the hop did not fire".
    if (g.dialogue) g.dialogue.active = false;
    g.mode = 'play';
    return { y0: g.player.y, tile: Math.floor((g.player.y + 8) / 16), rk: g.room.key, mode: g.mode, dlg: !!(g.dialogue && g.dialogue.active) };
  }, { ...a, row, dir });

  const down = await place({ mapId: p.mapId, f, rx, ry, mid }, p.y - 1, 'down');
  // 22 frames is far enough to clear a 1-3 tile lip and short enough that the
  // player never reaches the room edge — walking out of the room and arriving at
  // the top of the next one reads exactly like a failed hop.
  await page.keyboard.down('ArrowDown');
  await frames(22);
  await page.keyboard.up('ArrowDown');
  // The hop drives z along a scripted arc; measuring mid-arc reads as a fail.
  await page.evaluate(() => new Promise(res => {
    let n = 0;
    const t = () => (++n > 60 || (!window.__game.player.ledgeHop && window.__game.player.z === 0)) ? res() : requestAnimationFrame(t);
    t();
  }));
  const after = await page.evaluate(() => ({ y: window.__game.player.y, z: window.__game.player.z, tile: Math.floor((window.__game.player.y + 8) / 16) }));
  if (down.tile !== p.y - 1 || down.rk !== p.key || down.mode !== 'play' || down.dlg) hopFail.push(`${p.mapId} ${p.key}: harness failed to place the player (row ${down.tile} in ${down.rk})`);
  else if (after.tile > p.y && after.z === 0) hopOk++;
  else hopFail.push(`${p.mapId} ${p.key} row${p.y} x${p.x0}: y ${down.y0}->${after.y} (tile ${after.tile}, z ${after.z})`);

  // --- uphill: walk into the same lip from below, expect to be refused
  const up0 = await place({ mapId: p.mapId, f, rx, ry, mid }, p.y + 1, 'up');
  await page.keyboard.down('ArrowUp');
  await frames(22);
  await page.keyboard.up('ArrowUp');
  await frames(4);
  const up = await page.evaluate(() => ({ tile: Math.floor((window.__game.player.y + 8) / 16) }));
  if (up0.tile !== p.y + 1 || up0.rk !== p.key || up0.mode !== 'play' || up0.dlg) blockFail.push(`${p.mapId} ${p.key}: harness failed to place the player (row ${up0.tile})`);
  else if (up.tile > p.y) blockOk++;
  else blockFail.push(`${p.mapId} ${p.key} row${p.y}: walked up onto/past the lip (tile ${up.tile})`);
}
check(`every ledge run hops downhill (${hopOk}/${placements.length})`, hopFail.length === 0, hopFail.slice(0, 6).join(' | '));
check(`every ledge run blocks uphill (${blockOk}/${placements.length})`, blockFail.length === 0, blockFail.slice(0, 6).join(' | '));

check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));

console.log(`\n=== ${passed} passed, ${failures.length} failed ===`);
for (const f of failures) console.log('  ' + f);
await browser.close(); server.close();
process.exit(failures.length ? 1 : 0);
