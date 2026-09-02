// Placement harness. Proves that every entity the room data places can
// actually BE where it was put — asked of the engine, with the entity itself
// constructed, at every tide level.
//
// Why this needs a live page rather than a flag sweep: the answer depends on
// caps that only exist on a CONSTRUCTED entity. `Enemy` derives `avoidFlags`
// from its spec's `terrain` (src/game/enemy.js), `flying` from the same field,
// and aquatic enemies carry `terrainOk`, which is a rule about WET tiles that
// no static table holds. Counting `F.SOLID` off the grid instead reports the
// raft, every jellyfish, every urchin, the anglerfry, the sirens and all the
// keese as misplaced, and misses nothing the engine would not have caught —
// which is to say it is wrong in both directions at once.
//
// So this asks the engine's own question, the same composite `enemy.js` asks
// before it steps anywhere (`canOccupy(g, e, x, y) && e.terrainOk(...)`):
//
//   * TILES — can this entity occupy its own spawn tile, at SOME tide level?
//     Nothing in this world is placed for a tide that never comes, so an
//     entity that fits at no level is inside the scenery. That is the hard
//     assertion, and it is deliberately the weakest one that is certainly a
//     bug: a sign that drowns at HIGH is a judgement call, a sign buried in a
//     tree is not.
//   * NEIGHBOURS — two SOLID entities may not overlap. `canOccupy` reads
//     `Entity.solid` for every other entity in the room, so a chest standing
//     on a signpost is a wall a player can walk into and never explain.
//
// The tide sweep is not decoration. `Room.solidAt` resolves tide tiles through
// the field, so the same cell is floor at LOW and deep water at HIGH; asking
// once would either condemn every strand pickup or excuse everything on a
// sandbar. R4 applies throughout: this file defines no collision rule, it
// calls `canOccupy` and `terrainOk`.
//
// Boot pattern copied from tools/check-gates.mjs.
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

const VERBOSE = process.argv.includes('--verbose');
// --suggest: for every entity that fits nowhere, ask the engine which nearby
// tiles it COULD stand on, and print the nearest. It is a suggestion and not a
// fix: a solid entity dropped into the one row that crosses a screen severs it
// (see CLAUDE.md on town screens), so a move still has to be run past
// check-overworld / walk-dungeons / check-towns afterwards.
const SUGGEST = process.argv.includes('--suggest');
// --json=<path>: write the stuck list, with the engine's own suggestions, for a
// fixer to read. The moves themselves are a judgement call — see --suggest.
const JSON_OUT = (process.argv.find(a => a.startsWith('--json=')) || '').split('=')[1] || '';

let passed = 0; const failures = [];
function check(name, cond, detail) {
  if (cond) { passed++; console.log('  ok   ' + name); }
  else { failures.push(name + (detail ? ' — ' + detail : '')); console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); }
}

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

// Pin the seed: `newProgress` falls back to Date.now(), and a room's entity
// list is filtered by progress flags. An unpinned run sweeps a different world.
await page.goto(`http://localhost:${PORT}/index.html?seed=20260806`, { waitUntil: 'load' });
await page.waitForFunction(() => !!window.__game && !!window.__harness, { timeout: 15000 });
await page.evaluate(() => window.__harness.takeOver());

const report = await page.evaluate(async () => {
  const g = window.__game;
  const { MAPS } = await import('/src/world/maps.js');
  const { canOccupy } = await import('/src/game/entity.js');
  const { TILE } = await import('/src/core/screen.js');

  // A fresh save with nothing in it, so the sweep sees the entities the room
  // data declares rather than the ones this run's flags happen to allow. The
  // hidden ones are still checked: `needFlag`/`hideFlag` entities are visited
  // in a second pass below by forcing each flag on in turn would be a much
  // larger harness, so instead the pass records how many were skipped.
  g.mode = 'play';

  const rows = [];
  let skippedByFlag = 0;
  let rooms = 0;

  for (const [mapId, m] of MAPS) {
    for (const key of Object.keys(m.roomDefs)) {
      const [floor, rx, ry] = key.split(',').map(Number);
      const def = m.roomDefs[key];
      const declared = (def.entities || []).length;
      g.enterMap(mapId, floor, rx, ry, 8, 8, 'down', { instant: true });
      if (g.dialogue) g.dialogue.active = false;
      g.mode = 'play';
      rooms++;
      const ents = g.entities.filter(e => e !== g.player && !e.remove && !e.dead);
      skippedByFlag += Math.max(0, declared - ents.length);
      if (!ents.length) continue;
      const all = g.entities;
      for (const e of ents) {
        const row = {
          map: mapId, room: key, type: e.type || e.constructor.name,
          tx: Math.round(e.x / TILE), ty: Math.round(e.y / TILE),
          x: e.x, y: e.y,
          flying: !!e.flying, terrain: e.terrain || null, solid: !!e.solid,
          tile: [], full: [], why: [], under: [],
        };
        for (let L = 0; L < 3; L++) {
          g.tide.setLevel(L, { instant: true });
          // TILES ONLY: hide every other entity from `canOccupy` so a
          // neighbour's solidity cannot be mistaken for scenery. The engine's
          // function is still the one answering.
          g.entities = [e];
          const occ = canOccupy(g, e, e.x, e.y);
          const terr = (!e.terrainOk || e.terrainOk(g, e.x, e.y));
          const tileOk = occ && terr;
          // WHICH tile said no, and why. Every question below is put to the
          // engine (`Room.solidAt`, `Room.flagsAt`) — this scans the hitbox to
          // find the offender, it does not decide solidity itself.
          let why = '';
          if (!occ) {
            const airborne = (e.flying || e.z > 2);
            const avoid = (!airborne && e.avoidFlags) ? e.avoidFlags : 0;
            const r = { x: e.x + e.hb.x, y: e.y + e.hb.y, w: e.hb.w, h: e.hb.h };
            outer:
            for (let py = r.y; py < r.y + r.h; py++) {
              for (let px = r.x; px < r.x + r.w; px++) {
                const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
                if (px < 0 || py < 0 || px >= g.room.pw || py >= g.room.ph) {
                  why = 'offroom'; break outer;
                }
                if (g.room.solidAt(px, py, g.tide, { jumping: airborne, swim: !!e.swimming, cutting: false })) {
                  why = 'solid ' + g.room.baseName(tx, ty)
                    + (tx !== row.tx || ty !== row.ty ? `@${tx},${ty}` : '');
                  break outer;
                }
                if (avoid && (g.room.flagsAt(tx, ty, g.tide) & avoid)) {
                  why = 'avoids ' + g.room.baseName(tx, ty)
                    + (tx !== row.tx || ty !== row.ty ? `@${tx},${ty}` : '');
                  break outer;
                }
              }
            }
            if (!why) why = 'entity';
          } else if (!terr) {
            why = 'notwet ' + g.room.baseName(row.tx, row.ty);
          }
          row.why.push(why);
          row.under.push(g.room.baseName(row.tx, row.ty));
          g.entities = all;
          const fullOk = canOccupy(g, e, e.x, e.y)
            && (!e.terrainOk || e.terrainOk(g, e.x, e.y));
          row.tile.push(tileOk);
          row.full.push(fullOk);
        }
        if (!row.tile.some(Boolean)) {
          // Where COULD it stand? Sweep the room, ask the engine the same
          // composite question at every tide level, and keep the nearest cell
          // that answers yes at the most levels.
          const cands = [];
          for (let ty = 0; ty < g.room.th; ty++) {
            for (let tx = 0; tx < g.room.tw; tx++) {
              let n = 0;
              for (let L = 0; L < 3; L++) {
                g.tide.setLevel(L, { instant: true });
                g.entities = [e];
                const ok = canOccupy(g, e, tx * TILE, ty * TILE)
                  && (!e.terrainOk || e.terrainOk(g, tx * TILE, ty * TILE));
                g.entities = all;
                if (ok) n++;
              }
              if (n) cands.push({ tx, ty, n,
                d: Math.abs(tx - row.tx) + Math.abs(ty - row.ty) });
            }
          }
          cands.sort((a, b) => (b.n - a.n) || (a.d - b.d) || (a.ty - b.ty) || (a.tx - b.tx));
          row.best = cands.slice(0, 4);
        }
        rows.push(row);
      }
      g.tide.setLevel(1, { instant: true });
    }
  }
  return { rows, rooms, skippedByFlag };
});

const { rows, rooms, skippedByFlag } = report;
const LV = ['LOW', 'MID', 'HIGH'];
const where = r => `${r.map}/${r.room} (${r.tx},${r.ty}) ${r.type}`
  + (r.terrain ? ` [${r.terrain}]` : '') + (r.flying ? ' [flying]' : '')
  + `  ${r.why.map((w, i) => LV[i] + ':' + (w || 'ok')).join('  ')}`;

// --- the hard assertion ----------------------------------------------------
const stuck = rows.filter(r => !r.tile.some(Boolean));
console.log(`\nswept ${rooms} rooms, ${rows.length} entities`
  + (skippedByFlag ? `, ${skippedByFlag} not spawned on this save (needFlag/hideFlag)` : ''));
for (const r of stuck) {
  console.log('       inside scenery at every tide: ' + where(r));
  if (SUGGEST) {
    console.log('              could stand at: ' + ((r.best || []).length
      ? r.best.map(c => `(${c.tx},${c.ty}) ${c.n}/3 levels`).join(',  ')
      : 'NOWHERE IN THIS ROOM'));
  }
}
check('no entity is inside the scenery at every tide level',
  stuck.length === 0, `${stuck.length} of ${rows.length}`);

// --- solid entities may not share a tile -----------------------------------
// A row that the tiles allow and the full room refuses is being blocked by
// another entity, which for two solid things means they are standing in each
// other.
const overlaps = rows.filter(r => r.tile.some(Boolean)
  && r.tile.some((t, i) => t && !r.full[i]));
for (const r of overlaps) console.log('       overlapping another solid entity: ' + where(r));
check('no two solid entities are standing in each other',
  overlaps.length === 0, `${overlaps.length} pairs`);

// --- the soft report -------------------------------------------------------
// Placements that are legal at some levels and not others. Most are correct by
// design — a jellyfish is in deep water and a strand pickup dries out — so
// this is printed, never asserted. Read it when the tide work moves.
const partial = rows.filter(r => r.tile.some(Boolean) && !r.tile.every(Boolean));
console.log(`\n${partial.length} entities are legal at some tide levels and not others`
  + ' (design, unless the tide work just moved):');
const byType = new Map();
for (const r of partial) {
  const k = `${r.type}${r.terrain ? ' [' + r.terrain + ']' : ''}`;
  byType.set(k, (byType.get(k) || 0) + 1);
}
for (const [k, n] of [...byType].sort((a, b) => b[1] - a[1])) console.log(`       ${n}x ${k}`);
if (VERBOSE) {
  for (const r of partial) {
    console.log('       ' + where(r) + '  ok at '
      + LV.filter((_, i) => r.tile[i]).join('/'));
  }
}

if (JSON_OUT) {
  const { writeFileSync } = await import('node:fs');
  writeFileSync(JSON_OUT, JSON.stringify(stuck, null, 1));
  console.log(`\nwrote ${stuck.length} stuck placements to ${JSON_OUT}`);
}

check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));

console.log(`\n=== ${passed} passed, ${failures.length} failed ===`);
await browser.close(); server.close();
process.exit(failures.length ? 1 : 0);
