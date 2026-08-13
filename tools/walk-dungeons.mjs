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
const reach = await page.evaluate((ids) => {
  const F = window.__F, getTileDef = window.__getTileDef, getLegend = window.__getLegend;
  const SW = 10, SH = 8;                    // one SCREEN, in tiles
  const report = [];
  for (const mapId of ids) {
    const m = window.__MAPS.get(mapId);
    // Every room's size in screens, and which map cell each room owns. A
    // multi-screen room covers sw x sh cells from its key, so a seam is
    // resolved by asking which room owns the cell on the other side of it
    // rather than by adding one to the room's x. For an all-1x1 dungeon —
    // every dungeon today — `owner` is the identity on room keys and the flood
    // below walks exactly the graph it always did.
    const sizeOf = (rk) => {
      const sz = (m.roomDefs[rk].size) || [1, 1];
      return [sz[0] | 0, sz[1] | 0];
    };
    const dims = new Map();                 // rk -> {rx, ry, sw, sh, W, H}
    const owner = new Map();                // 'f,cx,cy' -> rk
    for (const rk of Object.keys(m.roomDefs)) {
      const [f0, rx0, ry0] = rk.split(',').map(Number);
      const [sw0, sh0] = sizeOf(rk);
      dims.set(rk, { f: f0, rx: rx0, ry: ry0, sw: sw0, sh: sh0, W: sw0 * SW, H: sh0 * SH });
      for (let j = 0; j < sh0; j++) for (let i = 0; i < sw0; i++) owner.set(`${f0},${rx0 + i},${ry0 + j}`, rk);
    }
    // A tile step that leaves `rk` lands in whichever room owns the screen cell
    // it fell into. Returns null off the end of the map.
    const stepOut = (rk, nx, ny) => {
      const D = dims.get(rk);
      const gx = D.rx * SW + nx, gy = D.ry * SH + ny;
      const nrk = owner.get(`${D.f},${Math.floor(gx / SW)},${Math.floor(gy / SH)}`);
      if (!nrk) return null;
      const N = dims.get(nrk);
      return [nrk, gx - N.rx * SW, gy - N.ry * SH];
    };
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
    // A door a PUZZLE opens is not a wall. `reward.openDoors` names the tiles a
    // solved room switches to their open form, so those tiles are passable in
    // the connectivity model — the flood cannot solve a puzzle, and asserting
    // the puzzle is solvable is a different tool's job (solve-switches.mjs for
    // switch rooms, check-anchor.mjs for the tide-gauge rooms). Without this a
    // room behind a puzzle door reads as stranded and the dungeon looks broken.
    const puzzleDoors = new Set();
    for (const [rk, def] of Object.entries(m.roomDefs)) {
      for (const [dx0, dy0] of def.puzzle?.reward?.openDoors || []) puzzleDoors.add(`${rk}:${dx0},${dy0}`);
    }
    // A ONE-WAY LEDGE IS A WAY THROUGH, IN ONE DIRECTION. This flood used to
    // treat every `F.LEDGE` tile as a wall, which was harmless while no room
    // depended on a lip for connectivity and silently wrong the moment one did
    // — d2's commit rooms are entered by hopping a three-tile lip, so without
    // this every room past the first one reads as stranded. Walking into the
    // face of a lip clears the whole run of ledge tiles behind it and lands on
    // the first tile past it, exactly as `Player.tryLedgeHop` does. Nothing
    // crosses a lip the other way, which is what makes the drop a commit.
    const ledgeDir = (ch) => {
      const d = defOf(ch, 0);
      return d && (d.flags & F.LEDGE) ? d.ledge : null;
    };
    const dirOf = (dx, dy) => (dx ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down'));
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
    //
    // A CHEST HANDS OVER A KEY IN TWO DIFFERENT SHAPES and this used to know
    // only one. `Game.openChest` takes `item:` (grant the item) OR `pickup:`
    // (spawn the pickup on the floor), and D1's third key is a
    // `{ pickup: 'key' }` chest — so the dungeon was walked believing it had two
    // keys for three locks. It stayed invisible because the third lock had a way
    // round it, so the flood never asked for the key it could not count: two
    // faults that each concealed the other, and sealing the door is what made
    // this one fail out loud. The boss-key sweep below already read all three
    // spellings; this now matches it.
    let keys = 0;
    for (const def of Object.values(m.roomDefs)) {
      for (const e of def.entities || []) {
        const o = e[3] || {};
        if (e[0] === 'pickup' && o.kind === 'key') keys++;
        if (e[0] === 'chest' && (o.item === 'key' || o.pickup === 'key')) keys++;
      }
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
    const sdD = dims.get(seedRoom);
    for (let y = 0; y < sdD.H; y++) for (let x = 0; x < sdD.W; x++) if (passable(sd.map[y][x])) { push(seedRoom, x, y); }

    let progress = true;
    while (progress) {
      progress = false;
      while (q.length) {
        const [rk, x, y] = q.pop();
        const def = m.roomDefs[rk];
        const w = warpsOut.get(rk + ':' + x + ',' + y);
        if (w) { const [wrk, wxy] = w.split(':'); const [wx, wy] = wxy.split(',').map(Number); push(wrk, wx, wy); }
        const D = dims.get(rk);
        const W = D.W, H = D.H;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < W && ny < H) {
            const ch = def.map[ny][nx];
            if (passable(ch) || puzzleDoors.has(`${rk}:${nx},${ny}`)) push(rk, nx, ny);
            else if (ledgeDir(ch) === dirOf(dx, dy)) {
              let n = 1;
              while (n < 3) {
                const bx = x + dx * (n + 1), by = y + dy * (n + 1);
                if (bx < 0 || by < 0 || bx >= W || by >= H || ledgeDir(def.map[by][bx]) == null) break;
                n++;
              }
              const lx = x + dx * (n + 1), ly = y + dy * (n + 1);
              if (lx >= 0 && ly >= 0 && lx < W && ly < H && passable(def.map[ly][lx])) push(rk, lx, ly);
            }
            else if (jumpable(ch)) {
              const jx = x + dx * 2, jy = y + dy * 2;
              if (jx >= 0 && jy >= 0 && jx < W && jy < H && passable(def.map[jy][jx])) push(rk, jx, jy);
            }
            else if (isLock(ch)) lockedSeen.add(rk + ':' + nx + ',' + ny);
            else if (isBossDoor(ch) && bossKey) lockedSeen.add(rk + ':' + nx + ',' + ny + ':boss');
            continue;
          }
          // stepping off the ROOM edge into whichever room owns the cell beyond
          const out = stepOut(rk, nx, ny);
          if (!out) continue;
          const [nk, tx, ty] = out;
          if (passable(m.roomDefs[nk].map[ty][tx])) push(nk, tx, ty);
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
  const out = [];
  for (const mapId of ids) {
    const m = window.__MAPS.get(mapId);
    for (const [key, def] of Object.entries(m.roomDefs || {})) {
      if (!def.noTide) continue;
      const sz = def.size || [1, 1];
      const W = (sz[0] | 0) * 10, H = (sz[1] | 0) * 8;
      const legend = getLegend(def.legend || m.legend);
      const walk = (ch, t) => {
        let d = getTileDef(legend[ch]);
        for (let i = 0; i < 4 && d && d.tide; i++) d = getTileDef(d.tide[t]);
        if (!d) return false;
        if (d.flags & F.STAIRS) return true;
        return !(d.flags & (F.VOID | F.SOLID | F.PIT | F.DEEP | F.LEDGE | F.HAZARD));
      };
      // The ways IN. A border tile is one; so is the landing of a one-way
      // ledge, and that half was missing — this check treated a lip as a wall,
      // so a pocket you drop into read as an island of floor nobody could
      // reach. d2's commit rooms are exactly that shape on purpose.
      const ledgeDir = (ch) => {
        const d = getTileDef(legend[ch]);
        return d && (d.flags & F.LEDGE) ? d.ledge : null;
      };
      const STEP = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
      const landings = (t) => {
        const out2 = [];
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const dir = ledgeDir(def.map[y][x]);
          if (!dir) continue;
          const [dx, dy] = STEP[dir];
          let n = 1;
          while (n < 3) {
            const bx = x + dx * n, by = y + dy * n;
            if (bx < 0 || by < 0 || bx >= W || by >= H || ledgeDir(def.map[by][bx]) == null) break;
            n++;
          }
          const lx = x + dx * n, ly = y + dy * n;
          if (lx >= 0 && ly >= 0 && lx < W && ly < H && walk(def.map[ly][lx], t)) out2.push([lx, ly]);
        }
        return out2;
      };
      // A tile the player can leave the room from: the border, or a warp.
      const isExit = (x, y, t) => {
        if (x === 0 || y === 0 || x === W - 1 || y === H - 1) return true;
        let d = getTileDef(legend[def.map[y][x]]);
        for (let i = 0; i < 4 && d && d.tide; i++) d = getTileDef(d.tide[t]);
        return !!d && !!(d.flags & (F.WARP | F.STAIRS));
      };
      const spread = (seeds, t) => {
        const seen = new Set(), q = [];
        for (const [x, y] of seeds) {
          const k = x + ',' + y;
          if (!seen.has(k) && walk(def.map[y][x], t)) { seen.add(k); q.push([x, y]); }
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
        return seen;
      };
      for (const t of [0, 1, 2]) {
        // Flood from every way in and require it to cover every walkable tile
        // in the room. An island of floor the player cannot get to is the
        // failure being looked for.
        const walkable = [];
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (walk(def.map[y][x], t)) walkable.push(x + ',' + y);
        if (!walkable.length) { out.push(`${mapId} ${key} @${t}: no floor at all`); continue; }
        const ways = [];
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const border = x === 0 || y === 0 || x === W - 1 || y === H - 1;
          if (border && walk(def.map[y][x], t)) ways.push([x, y]);
        }
        for (const l of landings(t)) ways.push(l);
        const seen = spread(ways, t);
        const stranded = walkable.filter(k => !seen.has(k));
        if (stranded.length) out.push(`${mapId} ${key} @${t}: ${stranded.length} tiles cut off (${stranded.slice(0, 3)})`);

        // AND THE OTHER HALF, which is new: every tile you can get INTO you
        // must be able to get OUT of. Reaching a pocket by a one-way lip and
        // finding no border and no warp in it is a softlock, and the check
        // above cannot see it — it only ever asked the question one way round.
        // A room whose floor is reachable and inescapable passes everything
        // else in this repo.
        const trapped = [];
        for (const k of seen) {
          const [x, y] = k.split(',').map(Number);
          // Walk out from this tile; something in what it reaches must be a
          // way out of the room.
          const from = spread([[x, y]], t);
          let ok = false;
          for (const j of from) {
            const [jx, jy] = j.split(',').map(Number);
            if (isExit(jx, jy, t)) { ok = true; break; }
          }
          if (!ok) trapped.push(k);
        }
        if (trapped.length) out.push(`${mapId} ${key} @${t}: ${trapped.length} tiles with no way out (${trapped.slice(0, 3)})`);
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
  const F = window.__F, getTileDef = window.__getTileDef, getLegend = window.__getLegend;
  const out = []; let total = 0;
  for (const mapId of ids) {
    const m = window.__MAPS.get(mapId);
    for (const [key, def] of Object.entries(m.roomDefs || {})) {
      const sz = def.size || [1, 1];
      const W = (sz[0] | 0) * 10, H = (sz[1] | 0) * 8;
      const legend = getLegend(def.legend || m.legend);
      const walk = (ch, t) => {
        let d = getTileDef(legend[ch]);
        for (let i = 0; i < 4 && d && d.tide; i++) d = getTileDef(d.tide[t]);
        if (!d) return false;
        if (d.flags & F.STAIRS) return true;
        return !(d.flags & (F.VOID | F.SOLID | F.PIT | F.DEEP | F.LEDGE | F.HAZARD));
      };
      // Does the door at (x,y) cut its two neighbours along (ax,ay) apart?
      const cuts = (x, y, ax, ay, t) => {
        const a = [x - ax, y - ay], b = [x + ax, y + ay];
        if (a[0] < 0 || a[1] < 0 || b[0] >= W || b[1] >= H) return false;
        if (!walk(def.map[a[1]][a[0]], t) || !walk(def.map[b[1]][b[0]], t)) return false;
        const seen = new Set([a.join(',')]), q = [a];
        while (q.length) {
          const [cx, cy] = q.pop();
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = cx + dx, ny = cy + dy;
            if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
            if (nx === x && ny === y) continue;              // the door is shut
            const k = nx + ',' + ny;
            if (seen.has(k) || !walk(def.map[ny][nx], t)) continue;
            seen.add(k); q.push([nx, ny]);
          }
        }
        return !seen.has(b.join(','));
      };
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const name = legend[def.map[y][x]];
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
