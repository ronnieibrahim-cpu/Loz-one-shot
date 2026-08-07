// Anchor-gate solver. Proves, for every room that declares an `anchorGate`,
// the two halves of the claim P8 makes about Tidewash Grotto:
//
//   1. NO SINGLE TIDE LEVEL opens the route. The room is walked from its
//      `from` tile to its `to` tile at each of LOW, MID and HIGH with the tide
//      uniform across the whole room, and all three must fail. This is the
//      design rule in docs/EXECUTION-PLAN.md stated as an assertion: "if a
//      room's puzzle would still work at a fixed tide level, it is the wrong
//      puzzle."
//
//   2. SOME ANCHOR PLACEMENT DOES. A placement is modelled the way the item
//      actually behaves rather than the way it is convenient to model:
//
//        - the player sets the conch to L and walks the room at a UNIFORM L,
//          because that is the world they are standing in before they throw;
//        - they throw from a tile they can reach, cardinally, up to
//          ANCHOR_THROW_TILES tiles, over anything that is not a wall;
//        - the anchor holds a square of radius ANCHOR_RADIUS_TILES at L;
//        - the conch then goes to a DIFFERENT base B, and the tile they threw
//          from has to still be standable under the resulting field, because
//          an anchor whose own bite strands the thrower is refused in-engine
//          (Anchor.land) rather than survived;
//        - and only then is the route walked, against the FIELD.
//
// Both radii are read out of src/data/feel.js in the page rather than written
// down here. A frame budget hard-coded against a constant rots the moment the
// constant moves, and check-gates.mjs had exactly that bug.
//
// The spacing between a gate and its shelf is what makes these rooms work, and
// it is invisible in the room text: move a gate one row closer to its bank and
// the anchor's patch swallows it, the gate freezes shut with the shelf, and
// the room becomes unsolvable while rendering perfectly and validating clean.
// That is the failure this tool exists to catch.

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
  else { failures.push(name + (detail ? ' — ' + detail : '')); console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); }
}

const PORT = 20000 + Math.floor(Math.random() * 20000);
const server = await serve(PORT);
const { chromium } = await loadPlaywright();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 800, height: 720 } });
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR: ' + (e.stack || e.message)));
await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'load' });
await page.waitForFunction(() => !!window.__game, { timeout: 15000 });

const results = await page.evaluate(async () => {
  const { MAPS, getRoom } = await import('/src/world/maps.js');
  const { F } = await import('/src/world/tileset.js');
  const feel = await import('/src/data/feel.js');
  const R = feel.ANCHOR_RADIUS_TILES;
  // How far a cardinal throw carries, in tiles. Generous on purpose: the arc
  // is subpixel and the room is not, and a solver that is stricter than the
  // hand would report a solvable room unsolvable.
  const THROW = 4;
  const W = 10, H = 8;

  const walk = (room, x, y, field) => {
    const d = room.tile(x, y, field);
    if (!d) return false;
    if (d.flags & F.STAIRS) return true;
    return !(d.flags & (F.VOID | F.SOLID | F.PIT | F.DEEP | F.LEDGE | F.HAZARD));
  };
  const blocksThrow = (room, x, y, lvl) => {
    const d = room.tile(x, y, lvl);
    return !d || (d.flags & (F.VOID | F.SOLID));
  };
  const flood = (room, sx, sy, field) => {
    const seen = new Set();
    if (!walk(room, sx, sy, field)) return seen;
    const q = [[sx, sy]];
    seen.add(sx + ',' + sy);
    while (q.length) {
      const [x, y] = q.pop();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const k = nx + ',' + ny;
        if (seen.has(k) || !walk(room, nx, ny, field)) continue;
        seen.add(k); q.push([nx, ny]);
      }
    }
    return seen;
  };

  const out = [];
  for (const [mapId, m] of MAPS) {
    for (const [key, def] of Object.entries(m.roomDefs || {})) {
      const gate = def.anchorGate;
      if (!gate) continue;
      const [f, rx, ry] = key.split(',').map(Number);
      const room = getRoom(mapId, f, rx, ry);
      const [fx, fy] = gate.from, [tx, ty] = gate.to;
      const rec = { mapId, key, name: def.name, from: gate.from, to: gate.to, uniform: [], solution: null };

      // 1. no uniform level walks it
      for (const lv of [0, 1, 2]) {
        if (flood(room, fx, fy, lv).has(tx + ',' + ty)) rec.uniform.push(lv);
      }

      // 2. some legal anchor placement does
      outer:
      for (let held = 0; held < 3; held++) {
        const standing = flood(room, fx, fy, held);
        if (!standing.size) continue;
        for (let base = 0; base < 3; base++) {
          if (base === held) continue;
          for (const t of standing) {
            const [sx, sy] = t.split(',').map(Number);
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
              for (let d = 1; d <= THROW; d++) {
                const ax = sx + dx * d, ay = sy + dy * d;
                if (ax < 0 || ay < 0 || ax >= W || ay >= H) break;
                // the chain flies over water and pits, but a wall stops it
                if (blocksThrow(room, ax, ay, held)) break;
                const field = {
                  levelAt: (qx, qy) =>
                    (Math.abs(qx - ax) <= R && Math.abs(qy - ay) <= R) ? held : base,
                };
                // Anchor.land refuses a bite that leaves the thrower nowhere
                // to stand, so a placement that drowns its own thrower is not
                // a placement.
                if (!walk(room, sx, sy, field)) continue;
                if (flood(room, sx, sy, field).has(tx + ',' + ty)) {
                  rec.solution = { base, held, throwFrom: [sx, sy], anchor: [ax, ay] };
                  break outer;
                }
              }
            }
          }
        }
      }
      out.push(rec);
    }
  }
  return { radius: R, rooms: out };
});

const NAMES = ['LOW', 'MID', 'HIGH'];
console.log(`anchor radius ${results.radius} tiles, ${results.rooms.length} gated rooms\n`);
for (const r of results.rooms) {
  const where = `${r.mapId} ${r.key} ${r.name}`;
  check(`${where}: no single tide level opens it`,
    r.uniform.length === 0,
    r.uniform.length ? `walkable at ${r.uniform.map(l => NAMES[l]).join(', ')} with no anchor` : '');
  const s = r.solution;
  check(`${where}: an anchor does`, !!s,
    s ? '' : `no placement of a radius-${results.radius} patch walks ${r.from} -> ${r.to}`);
  if (s) {
    console.log(`         base ${NAMES[s.base]}, hold ${NAMES[s.held]}: `
      + `stand ${s.throwFrom}, anchor lands ${s.anchor}`);
  }
}

check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
console.log(`\n=== ${passed} passed, ${failures.length} failed ===`);
for (const f of failures) console.log('  ' + f);
await browser.close(); server.close();
process.exit(failures.length ? 1 : 0);
