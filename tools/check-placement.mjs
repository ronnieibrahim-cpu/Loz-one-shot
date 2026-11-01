// Nothing is standing inside anything.
//
// Room data places 529 entities by tile. Nothing has ever asked whether the
// tile can hold what was put on it, and sixteen of them could not: six signs
// (two buried in trees), two traders inside bushes, three pickups inside
// rocks, a darknut, a beetle, two tektites and a zol on a dungeon post. A
// signpost growing out of a tree's root mound is visible from across the room
// and every checker in the table was green for it, because a placed entity
// exists, updates and draws exactly the same whether or not there is a rock in
// the same square (`T53`).
//
// THE RULE IS NOT RESTATED HERE (`R4`). It asks `canOccupy` — the same
// function `moveEntity` calls on every frame of the real game — and passes NO
// caps, so each entity's own nature answers: a flier ignores the ground, a
// swimmer is fine in deep water, an enemy refuses the terrain in its own
// `avoidFlags`. That is why this cannot be done from the room data in plain
// Node: caps live on constructed entities, so the world has to be built.
//
// AN ENTITY IS ONLY WRONG IF IT IS WRONG AT EVERY TIDE. The sea moves; a crab
// on a sandbar is standing on dry land at LOW and swimming at HIGH, and a room
// is allowed to be uncomfortable at one setting of the conch. What no room is
// allowed to do is put something where it can never be.
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
  try { mod = await import('playwright'); }
  catch (e) {
    const { execSync } = await import('node:child_process');
    mod = await import(join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'playwright', 'index.js'));
  }
  return mod.chromium ? mod : mod.default;
}

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
await page.goto(`http://localhost:${PORT}/index.html?seed=20260806`, { waitUntil: 'load' });
await page.waitForFunction(() => !!window.__game && !!window.__harness, { timeout: 15000 });
await page.evaluate(() => window.__harness.takeOver());

const report = await page.evaluate(async () => {
  const g = window.__game;
  const ent = await import('/src/game/entity.js');
  const maps = await import('/src/world/maps.js');
  const out = [];
  let checked = 0;
  for (const map of maps.MAPS.values()) {
    for (const key of Object.keys(map.roomDefs || {})) {
      const def = map.roomDefs[key];
      if (!def || !def.entities || !def.entities.length) continue;
      const [f, rx, ry] = key.split(',').map(Number);
      // The player is parked off the room so it can never be the thing an
      // entity is reported as standing in. Entity-on-entity is a real fault
      // and is reported below, but it has to be between PLACED entities.
      g.enterMap(map.id, f, rx, ry, -999, -999, 'down', { instant: true });
      // What the room's own script put down on the way in (Deep Bar's blank)
      // waits in pendingAdd until the next frame: flush it here, or it is
      // counted against whichever room this loop enters next (S201).
      g.flushPending();
      // A sunken plate (S143) stands on deep water by design: it is on the
      // bottom, and check-cleats.mjs proves the floor reaches it.
      const sunk = new Set((def.sunkPlates || []).map(p => p.join(',')));
      const placed = g.entities.filter(e => e !== g.player && !e.remove
        && !(e.constructor.name === 'FloorSwitch' && sunk.has(Math.floor(e.cx / 16) + ',' + Math.floor(e.cy / 16)))
        // A thing stuck up a tree (S155) is perched in the canopy, not standing
        // on it; check-side.mjs proves the Bellows brings it down.
        && !e.perched);
      for (const e of placed) {
        checked++;
        const stuck = [];
        for (const lv of [0, 1, 2]) {
          g.tide.setLevel(lv, { instant: true });
          // THE ENGINE'S OWN COMPOSITE, not half of it. `moveDir` in enemy.js
          // asks `canOccupy(...) && terrainOk(...)`, and the two carry
          // different halves of the rule: an aquatic enemy's avoid mask is 0,
          // so canOccupy alone will happily put a jellyfish on a footpath.
          if (!ent.canOccupy(g, e, e.x, e.y)
              || (e.terrainOk && !e.terrainOk(g, e.x, e.y))) stuck.push(lv);
        }
        if (stuck.length === 3) {
          const tx = Math.floor(e.cx / 16), ty = Math.floor(e.cy / 16);
          // The nearest tile the ENGINE says this entity could stand on, so a
          // fix is a tile the game agreed to rather than one a person liked the
          // look of. Rings outward from where it was placed; the first hit at
          // the smallest radius wins, ties broken up-left for determinism.
          //
          // DOWNWARD FIRST. A ring that tries up first walks a signpost into
          // the seam corridor along a screen's top row — which is walkable, so
          // the engine approves, and is the way north, so a player meets a sign
          // standing in a doorway. Everything in this world stands BELOW the
          // thing it is next to: a sign at the foot of a treeline, a prop on
          // the near side of a rock. Then sideways, then up as a last resort.
          let fix = null;
          for (let r = 1; r <= 9 && !fix; r++) {
            const ring = [];
            for (let dy = -r; dy <= r; dy++) {
              for (let dx = -r; dx <= r; dx++) {
                if (Math.max(Math.abs(dx), Math.abs(dy)) === r) ring.push([dx, dy]);
              }
            }
            ring.sort((a, b) => (b[1] - a[1]) || (Math.abs(a[0]) - Math.abs(b[0])) || (a[0] - b[0]));
            for (const [dx, dy] of ring) {
              if (fix) break;
              {
                const nx = tx + dx, ny = ty + dy;
                if (!g.room.inBounds(nx, ny)) continue;
                // AT SOME TIDE, matching the failure test above. Requiring all
                // three would refuse a pool that is only deep at HIGH, which is
                // exactly where a jellyfish belongs in a game about the sea.
                let ok = false;
                for (const lv of [0, 1, 2]) {
                  g.tide.setLevel(lv, { instant: true });
                  if (ent.canOccupy(g, e, nx * 16, ny * 16)
                      && (!e.terrainOk || e.terrainOk(g, nx * 16, ny * 16))) { ok = true; break; }
                }
                if (ok) fix = nx + ',' + ny;
              }
            }
          }
          out.push({
            where: map.id + '/' + key, type: e.type || e.constructor.name,
            tile: tx + ',' + ty, on: g.room.baseName(tx, ty), fix,
          });
        }
      }
    }
  }
  return { out, checked };
});

if (process.argv.includes('--json')) {
  // For a session applying the fixes: the same list the report prints, in a
  // shape a patch script can read. Deliberately not a --fix flag — moving an
  // entity is a judgement (a sign has to stay beside what it is about) and the
  // suggestion is a starting point, not an instruction.
  console.log(JSON.stringify(report.out, null, 2));
  await browser.close(); server.close();
  process.exit(0);
}
console.log(`check-placement: ${report.checked} placed entities, built in the real engine`);
for (const b of report.out) {
  console.log(`  stuck  ${b.where.padEnd(18)} ${b.type.padEnd(14)} at ${b.tile.padEnd(6)} inside '${b.on}'`
    + (b.fix ? `  -> ${b.fix} is clear` : '  -> NOTHING CLEAR ANYWHERE IN THE ROOM'));
}
check('every placed entity can stand where it was placed, at some tide',
  report.out.length === 0, report.out.length ? `${report.out.length} cannot, at any level` : '');

// NOBODY WANDERS INTO A TREE (S168). A townsperson with `wander` picks a
// direction every so often and walks it, and a tree's root mound is walkable
// ground with a trunk drawn on it — so the village child spent half the game
// standing inside the nearest oak, and nothing above can see it, because it
// only looks at where a person was PLACED. Every wanderer is walked for two
// minutes of game time in its own room at each tide, and its feet (its
// hitbox, as for Link: the sprite is 2px wider each side) must never be over a root mound (`Room.quadRootCover`, the engine's
// answer, which `canOccupy` refuses for anything carrying `avoidRoots`).
const wander = await page.evaluate(async () => {
  const g = window.__game;
  const maps = await import('/src/world/maps.js');
  const out = []; let walked = 0, moved = 0;
  for (const map of maps.MAPS.values()) {
    for (const key of Object.keys(map.roomDefs || {})) {
      const def = map.roomDefs[key];
      if (!(def.entities || []).some(s => s[3] && s[3].wander)) continue;
      const [f, rx, ry] = key.split(',').map(Number);
      g.enterMap(map.id, f, rx, ry, -999, -999, 'down', { instant: true });
      for (const lv of [0, 1, 2]) {
        g.tide.setLevel(lv, { instant: true });
        for (const e of g.entities.filter(e => e.wander)) {
          walked++;
          const x0 = e.x, y0 = e.y; let bad = null;
          for (let i = 0; i < 7200 && !bad; i++) {
            e.update(g);
            for (const px of [e.x + e.hb.x, e.x + 8, e.x + e.hb.x + e.hb.w - 1]) {
              for (const py of [e.y + e.hb.y, e.y + e.hb.y + e.hb.h - 1]) {
                const tx = Math.floor(px / 16), ty = Math.floor(py / 16);
                if (g.room.quadRootCover(tx, ty, g.tide)) bad = `${tx},${ty}`;
              }
            }
          }
          if (e.x !== x0 || e.y !== y0) moved++;
          if (bad) out.push(`${map.id}/${key} ${e.sprite} walked into the roots at ${bad} (tide ${lv})`);
          e.x = x0; e.y = y0;
        }
      }
    }
  }
  return { out, walked, moved };
});
console.log(`check-placement: ${wander.walked} wanderers walked for 7200 frames at each tide`);
for (const l of wander.out) console.log('  roots  ' + l);
check('no wandering townsperson walks into a tree', wander.walked > 0 && wander.moved > 0 && wander.out.length === 0,
  wander.out.length ? `${wander.out.length} did` : `${wander.walked} walked, ${wander.moved} moved`);

// WHAT A CHEST HANDS OUT IS HANDED OVER (S162, S224). A chest holding a key
// or a Boss Key used to pop a pickup out above itself, to settle a tile up
// and be walked into — and the Sunken Palace's Boss Key chest stood against
// the cellar's north wall, so the key came to rest INSIDE the wall and the
// dungeon could not be finished with every tool green. Since S224 every
// chest's prize rises out of it and is given the moment the lid opens, as in
// Seasons (TREASURE_SPAWN_MODE_FROM_CHEST_A): nothing pops, so nothing can be
// buried. This opens every chest that holds a pickup in the real engine and
// asserts that no pickup came out, the prize was held up over the chest, and
// a key or a Boss Key was counted.
const chests = await page.evaluate(async () => {
  const g = window.__game;
  const maps = await import('/src/world/maps.js');
  const out = []; let opened = 0;
  const holds = s => s[0] === 'chest' && s[3] && s[3].pickup;
  for (const map of maps.MAPS.values()) {
    for (const key of Object.keys(map.roomDefs || {})) {
      const def = map.roomDefs[key];
      if (!(def.entities || []).some(holds)) continue;
      const [f, rx, ry] = key.split(',').map(Number);
      g.enterMap(map.id, f, rx, ry, -999, -999, 'down', { instant: true });
      for (const chest of g.entities.filter(e => e.constructor.name === 'Chest' && e.pickup)) {
        const before = new Set(g.entities.concat(g.pendingAdd));
        const p = g.progress, keys = (p.keys || {})[g.mapId] || 0;
        g.itemShow = null;
        g.openChest(chest);
        g.flushPending();
        opened++;
        const where = `${map.id}/${key} chest at ${chest.x / 16},${chest.y / 16}`;
        if (g.entities.some(e => !before.has(e) && e.constructor.name === 'Pickup')) out.push(`${where}: its ${chest.pickup} popped out`);
        if (!g.itemShow || !g.itemShow.chest) out.push(`${where}: its ${chest.pickup} was not held up over the chest`);
        if (chest.pickup === 'key' && ((p.keys || {})[g.mapId] || 0) !== keys + 1) out.push(`${where}: the key was not counted`);
        if (chest.pickup === 'bossKey' && !p.bossKeys[g.mapId]) out.push(`${where}: the Boss Key was not given`);
        g.itemShow = null; g.dialogue.active = false;
        if (g.player) g.player.frozen = 0;
      }
    }
  }
  return { out, opened };
});
console.log(`check-placement: ${chests.opened} chests that hold a pickup, opened in the real engine`);
for (const l of chests.out) console.log('  ' + l);
check('every chest\'s pickup rises out of it and is given, none pops',
  chests.opened > 0 && chests.out.length === 0, chests.out.length ? `${chests.out.length} do not` : '');
// EVERY CHEST CAN BE OPENED FROM THE FRONT (S224). Seasons opens a chest
// only for a Link standing below it facing up, and so does ours now; a chest
// with a wall, water or a block under it could never be opened at all. This
// stands a real Player on the tile below each chest in the world and asks
// `canOccupy` at each sea.
const fronts = await page.evaluate(async () => {
  const g = window.__game;
  const ent = await import('/src/game/entity.js');
  const maps = await import('/src/world/maps.js');
  const { Player } = await import('/src/game/player.js');
  const out = []; let seen = 0;
  for (const map of maps.MAPS.values()) {
    for (const key of Object.keys(map.roomDefs || {})) {
      const def = map.roomDefs[key];
      if (!(def.entities || []).some(s => s[0] === 'chest')) continue;
      const [f, rx, ry] = key.split(',').map(Number);
      g.enterMap(map.id, f, rx, ry, -999, -999, 'down', { instant: true });
      // From the room's own list, not the live entities: a chest that waits
      // on a flag (`needFlag`, most Boss Keys) is not built until it rises.
      for (const s of def.entities.filter(s => s[0] === 'chest')) {
        seen++;
        const chest = { x: s[1] * 16, y: s[2] * 16 };
        const p = new Player(chest.x, chest.y + 16);
        // A grate below is the Colonnade's: the Resonance Rod retracts it and
        // check-trade proves that crossing, so the floor under it counts.
        const under = g.room.baseName(chest.x / 16, chest.y / 16 + 1);
        const ok = under === 'grate' || [0, 1, 2].some(lv => { g.tide.setLevel(lv, { instant: true }); return ent.canOccupy(g, p, chest.x, chest.y + 16); });
        if (!ok) out.push(`${map.id}/${key} chest at ${chest.x / 16},${chest.y / 16}: no floor in front of it ('${g.room.baseName(chest.x / 16, chest.y / 16 + 1)}')`);
      }
    }
  }
  return { out, seen };
});
console.log(`check-placement: ${fronts.seen} chests, each stood in front of`);
for (const l of fronts.out) console.log('  ' + l);
check('every chest has floor in front of it, where it opens from',
  fronts.seen > 0 && fronts.out.length === 0, fronts.out.length ? `${fronts.out.length} do not` : '');
check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));

console.log(`\n=== ${passed} passed, ${failures.length} failed ===`);
if (failures.length) { console.log('\nFailures:'); failures.forEach(f => console.log('  - ' + f)); }
await browser.close(); server.close();
process.exit(failures.length ? 1 : 0);
