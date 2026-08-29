// Ledge candidate finder. Boots headless and reports every tile in every room
// where a one-way ledge could be placed without breaking the room.
//
// This exists because placing ledges by eye is how you wall a room off. A lip
// is SOLID from three sides, so a run dropped across a corridor silently makes
// rooms unreachable — and the room still validates, still renders, and only
// check-overworld's flood or walk-dungeons' reachability pass catches it, long
// after you have placed forty of them and no longer know which one did it.
//
// A candidate must satisfy all of:
//   * the lip tile is plain floor at EVERY tide level (a lip that is water at
//     high tide is not a lip), and carries no push block, animation or entity
//   * the tile on the high side and the landing tile past it are both plain
//     floor, so the hop has somewhere to start and somewhere to land
//   * two plain tiles continue past each END of the run, so the player can
//     always walk around rather than being funnelled over a one-way drop
//
// Directions: `_` south and `"` north are horizontal runs; `>` east and `<`
// west are VERTICAL runs — a lip facing east is a column, not a row.
//
// Usage:  node tools/find-ledges.mjs [--map=overworld] [--dir=">"] [--len=4]
// It only reports. Placing them is a hand edit to the room grids, and
// walk-dungeons.mjs is what proves the result.
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
// Fall back to a system Chromium when the installed browser build does not
// match the installed playwright package (see test.mjs / solve-switches.mjs).
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

await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'load' });
await page.waitForFunction(() => !!window.__game, { timeout: 15000 });

await page.evaluate(async () => {
  const maps = await import('/src/world/maps.js');
  const room = await import('/src/world/room.js');
  const ts = await import('/src/world/tileset.js');
  const col = await import('/tools/lib/collision.mjs');
  window.__MAPS = maps.MAPS; window.__getLegend = room.getLegend; window.__getRoom = maps.getRoom;
  window.__getTileDef = ts.getTileDef; window.__F = ts.F;
  window.__tileWalkable = col.tileWalkable; window.__ROUTE_AVOID = col.ROUTE_AVOID;
});

const argv = process.argv.slice(2);
const arg = (k, d) => {
  const hit = argv.find(a => a.startsWith(`--${k}=`));
  return hit ? hit.slice(k.length + 3) : d;
};
const ONLY_MAP = arg('map', null);
const ONLY_DIR = arg('dir', null);
const MIN_LEN = Number(arg('len', 3));
const AS_JSON = argv.includes('--json');

const out = await page.evaluate(({ ONLY_MAP, ONLY_DIR, MIN_LEN }) => {
  const F = window.__F, getRoom = window.__getRoom;
  const tileWalkable = window.__tileWalkable, ROUTE_AVOID = window.__ROUTE_AVOID;
  const res = [];
  const DIRS = [
    { ch: '_', ux: 0, uy: 1, ax: 1, ay: 0 },
    { ch: '"', ux: 0, uy: -1, ax: 1, ay: 0 },
    { ch: '>', ux: 1, uy: 0, ax: 0, ay: 1 },
    { ch: '<', ux: -1, uy: 0, ax: 0, ay: 1 },
  ].filter(d => !ONLY_DIR || d.ch === ONLY_DIR);
  const CAPS = { jumping: false, swim: false, cutting: false };
  // On top of hard collision (asked of the engine via `tileWalkable`), a lip
  // candidate also avoids tiles that are walkable but wrong to place a lip on
  // for reasons that are not about passability at all: a warp, a door, a
  // stairway, a still-bombable wall. That is placement curation, not a second
  // collision rule, so it composes as an extra `avoid` mask exactly the way
  // `tileWalkable`'s own parameter is meant to be used.
  const PLACEMENT_AVOID = ROUTE_AVOID | F.WET | F.WARP | F.DOOR | F.STAIRS | F.BOMBABLE;
  for (const [mapId, m] of window.__MAPS) {
    if (ONLY_MAP && mapId !== ONLY_MAP) continue;
    for (const [key, def] of Object.entries(m.roomDefs || {})) {
      const grid = def.map || [];
      const at = (x, y) => (grid[y] || '')[x];
      const [f0, rx0, ry0] = key.split(',').map(Number);
      const room = getRoom(mapId, f0, rx0, ry0);
      // Plain floor at EVERY tide: a lip must not be a tile that is water or a
      // pit some of the time, and digits are tide tiles by convention (the
      // digit check reads the raw legend character, since a resolved tile name
      // does not carry it).
      const plain = (x, y) => {
        const ch = at(x, y);
        if (ch === undefined || /[0-9]/.test(ch)) return false;
        for (const t of [0, 1, 2]) {
          if (!tileWalkable(room, x, y, t, CAPS, PLACEMENT_AVOID)) return false;
          const d = room.tile(x, y, t);
          if (d.push || d.anim) return false;
        }
        return true;
      };
      // Tiles an entity or object occupies must stay clear.
      const taken = new Set();
      for (const e of (def.entities || [])) {
        if (typeof e.x === 'number' && typeof e.y === 'number') {
          taken.add(`${Math.floor(e.x / 16)},${Math.floor(e.y / 16)}`);
        }
      }
      // The room's own extent, in tiles: a 2x1 room is 20 wide and a placement
      // sweep that stopped at column 10 would never offer half of it.
      const sz = def.size || [1, 1];
      const W = (sz[0] | 0) * 10, H = (sz[1] | 0) * 8;
      for (const d of DIRS) {
        // Sweep every start cell; a run extends along (ax, ay).
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          for (let len = 4; len >= MIN_LEN; len--) {
            const cells = [];
            let ok = true;
            for (let i = 0; i < len; i++) {
              const cx = x + d.ax * i, cy = y + d.ay * i;
              if (cx < 0 || cy < 0 || cx >= W || cy >= H) { ok = false; break; }
              if (!plain(cx, cy) || taken.has(`${cx},${cy}`)) { ok = false; break; }
              // high side and landing must both be walkable plain floor
              if (!plain(cx - d.ux, cy - d.uy) || !plain(cx + d.ux, cy + d.uy)) { ok = false; break; }
              cells.push([cx, cy]);
            }
            if (!ok) continue;
            // Leave a way around: two plain cells past each end of the run,
            // otherwise the lip walls the room off and the flood check fails.
            const bx = x - d.ax, by = y - d.ay;
            const ex = x + d.ax * len, ey = y + d.ay * len;
            const around = (px, py, sx, sy) => plain(px, py) && plain(px + sx, py + sy);
            if (!around(bx, by, -d.ax, -d.ay) || !around(ex, ey, d.ax, d.ay)) continue;
            res.push({ mapId, key, ch: d.ch, x, y, len });
            break;   // prefer the longest run from this cell
          }
        }
      }
    }
  }
  return res;
}, { ONLY_MAP, ONLY_DIR, MIN_LEN });

if (AS_JSON) {
  console.log(JSON.stringify(out));
} else {
  const byMap = {};
  for (const c of out) (byMap[c.mapId] ||= []).push(c);
  for (const [mapId, list] of Object.entries(byMap)) {
    const byDir = {};
    for (const c of list) byDir[c.ch] = (byDir[c.ch] || 0) + 1;
    console.log(`${mapId}: ${list.length} candidates (${
      Object.entries(byDir).map(([c, n]) => `'${c}' ${n}`).join(', ')})`);
    // one worked example per direction, so the shape is obvious at a glance
    for (const ch of Object.keys(byDir)) {
      const e = list.find(c => c.ch === ch);
      console.log(`    '${ch}'  room ${e.key}  at ${e.x},${e.y}  len ${e.len}`);
    }
  }
  console.log(`\n${out.length} candidate(s). Rooms already carrying a ledge are NOT excluded;`);
  console.log('place at most one run per room, then run tools/walk-dungeons.mjs.');
}
await browser.close(); server.close(); process.exit(0);
