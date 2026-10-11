// The Drowned Wood Shrine's Canopy (S186): "a hole in the boughs is a place
// in the room below".
//
// A Reefseed that goes down a knot-hole comes down one floor, on the cell
// directly under the hole, and takes root there for good (Game.plantFromAbove,
// kept in the save like an opened door). A stake plate (`['switch', x, y,
// { stake: true }]`) is held by a pillar standing on it. The puzzle is a
// plate NO HAND BELOW CAN REACH — so this proves both halves, in the real
// engine, by throwing rather than by argument:
//
//   * every knot-hole in the world (found, not declared: a dKnotHole* tile)
//     has a room directly beneath it with that cell inside it;
//   * every `dropRoom` claim (the room BELOW declares `{ from, hole, plate }`):
//       - no foot reaches the plate (the dungeon flood), and no foot reaches
//         the knot-hole above it or any cell beside it — Link cannot drop
//         onto the plate himself;
//       - NO THROW from below reaches it: from every pixel Link can stand on
//         in that room (the flood's cells, the engine's canOccupy) within
//         four tiles of the plate in line with it, at every sea, facing it,
//         a seed is thrown in the engine and comes down anywhere but the
//         plate. (A seed flies 2-3 tiles depending on where in his tile Link
//         stands, so tile centres are not enough; S186 found that a ring two
//         holes wide is crossed by a throw from the very lip.)
//       - FROM ABOVE it is: thrown into the knot-hole from a standing place
//         in the room above, at each sea, the seed goes down, the pillar is
//         on the plate, the plate is held and the room's puzzle pays out
//         when Link walks in below; and after a save and a load it is still
//         there.
//   * every `beltRoom.plate` (K2): no foot reaches the plate or the belt that
//     carries a seed to it, and no throw lands on the plate directly — the
//     same throw sweep. That the belt does carry one there is
//     check-belts.mjs's.
//   * a stake grown the ordinary way is gone when Link leaves the room and
//     comes back; a stake from above is not.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { installData } from '../src/data/index.js';
import { MAPS, getRoom } from '../src/world/maps.js';
import { floodDungeon } from './lib/dungeon-flood.mjs';

installData();
let pass = 0; const fail = [];
const check = (n, c, d) => c ? (pass++, console.log('  ok   ' + n)) : (fail.push(n), console.log('  FAIL ' + n + (d ? ' — ' + d : '')));

// --- knot-holes and claims, from the data -------------------------------------
const holes = [], drops = [], plates = [];
const floods = new Map();
const flood = (id) => { if (!floods.has(id)) floods.set(id, floodDungeon(id)); return floods.get(id); };
const cellsOf = (id, rk) => [...flood(id).seen].filter(k => k.startsWith(rk + ':')).map(k => k.split(':')[1]);
for (const m of MAPS.values()) {
  for (const [rk, def] of Object.entries(m.roomDefs || {})) {
    const [f, rx, ry] = rk.split(',').map(Number);
    const room = getRoom(m.id, f, rx, ry);
    if (!room) continue;
    for (let y = 0; y < room.th; y++) for (let x = 0; x < room.tw; x++) {
      if (!/^dKnotHole/.test(room.baseName(x, y))) continue;
      const below = `${f - 1},${rx},${ry}`;
      const rb = m.roomDefs[below] && getRoom(m.id, f - 1, rx, ry);
      holes.push({ map: m.id, rk, x, y, ok: !!rb && rb.inBounds(x, y) });
    }
    if (def.dropRoom) drops.push({ map: m.id, rk, def });
    if (def.beltRoom && def.beltRoom.plate) plates.push({ map: m.id, rk, def });
  }
}
const badHoles = holes.filter(h => !h.ok);
check(`every knot-hole has a room directly beneath it (${holes.length} knot-hole cells)`, holes.length > 0 && !badHoles.length,
  badHoles.map(h => `${h.map} ${h.rk} ${h.x},${h.y}`).join('; '));

const jobs = [];
for (const d of drops) {
  const D = d.def.dropRoom;
  const seenBelow = new Set(cellsOf(d.map, d.rk));
  const seenAbove = new Set(cellsOf(d.map, D.from));
  check(`${d.map} ${d.def.name}: no foot reaches the plate (dungeon flood)`, !seenBelow.has(D.plate.join(',')));
  const [hx, hy] = D.hole;
  const near = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => seenAbove.has(`${hx + dx},${hy + dy}`));
  check(`${d.map} ${d.def.name}: no foot reaches the knot-hole above it, or any cell beside it`, !near.length, JSON.stringify(near));
  jobs.push({ kind: 'below', map: d.map, rk: d.rk, name: d.def.name, target: D.plate, cells: [...seenBelow] });
  jobs.push({ kind: 'above', map: d.map, rk: D.from, below: d.rk, name: d.def.name, target: D.hole, plate: D.plate, cells: [...seenAbove], flag: d.def.puzzle && d.def.puzzle.flag });
}
for (const b of plates) {
  const seen = new Set(cellsOf(b.map, b.rk));
  const room = getRoom(b.map, ...b.rk.split(',').map(Number));
  const beltCells = [];
  for (let y = 0; y < room.th; y++) for (let x = 0; x < room.tw; x++) if ([0, 1, 2].some(t => room.tile(x, y, t).belt)) beltCells.push(`${x},${y}`);
  const trod = beltCells.filter(c => seen.has(c));
  check(`${b.map} ${b.def.name}: no foot reaches the plate or the belt that carries a seed to it`, !seen.has(b.def.beltRoom.plate.join(',')) && !trod.length, trod.join(' '));
  jobs.push({ kind: 'below', map: b.map, rk: b.rk, name: b.def.name, target: b.def.beltRoom.plate, cells: [...seen], direct: true });
}

// --- in the engine -------------------------------------------------------------
const ROOT = resolve(import.meta.dirname, '..');
const server = createServer(async (req, res) => {
  try {
    const u = decodeURIComponent(req.url.split('?')[0]);
    const p = join(ROOT, u === '/' ? 'index.html' : u);
    res.writeHead(200, { 'Content-Type': extname(p) === '.js' ? 'text/javascript' : 'text/html' });
    res.end(await readFile(p));
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(0, r));
async function launch() {
  try { return await chromium.launch(); }
  catch (err) {
    const f = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium';
    if (!existsSync(f)) throw err;
    return chromium.launch({ executablePath: f });
  }
}
const browser = await launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
await page.goto(`http://localhost:${server.address().port}/index.html`);
await page.waitForFunction(() => !!window.__game);

const out = await page.evaluate(async (jobs) => {
  const g = window.__game;
  window.__harness.takeOver();
  const { canOccupy, groundTile, groundFlags } = await import('/src/game/entity.js');
  const { giveItem, flag } = await import('/src/game/progress.js');
  const { ITEMS, Reefseed } = await import('/src/game/items.js');
  const { F } = await import('/src/world/tileset.js');
  const { resetRooms } = await import('/src/world/maps.js');
  const FE = await import('/src/data/feel.js');
  const step = (n) => { for (let i = 0; i < n; i++) g.update(); };
  g.newGame(0, 'LINK', 20261011);
  g.cutscene = null; g.mode = 'play'; g.dialogue.active = false;
  for (const id of ['sword', 'conch', 'reefseed', 'cleats']) giveItem(g.progress, id);
  const enter = (map, rk, sea) => {
    const [f, rx, ry] = rk.split(',').map(Number);
    g.tide.clearOverrides();
    g.tide.setLevel(sea, { instant: true });
    g.enterMap(map, f, rx, ry, 7 * 16, 9 * 16, 'up', { instant: true });
    g.mode = 'play'; g.cutscene = null; g.dialogue.active = false;
    g.entities = g.entities.filter(e => !e.isEnemy);
    const p = g.player; p.invuln = 0; p.frozen = 1e9;
    return p;
  };
  const DV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  let nothrow = 0;
  // Throw one seed from Link's centre (cx, cy) facing `dir`; where does it
  // come down? Returns the tile it planted on, 'hole' if it went down one, or
  // null if it came to nothing. With `grow`, waits for the pillar.
  const throwFrom = (cx, cy, dir, grow) => {
    const p = g.player;
    p.x = cx - 8; p.y = cy - 8; p.dir = dir; p.inDeep = false; p.underwater = false;
    g.progress.reefseeds = 10;
    const before = g.entities.length;
    ITEMS.reefseed.use(g, p, 1);
    g.flushPending();
    const seed = g.entities.find(e => e instanceof Reefseed && !e.remove);
    if (!seed) { nothrow++; return null; }
    const drop = g.plantFromAbove;
    let dropped = null;
    g.plantFromAbove = (x, y) => { dropped = [x, y]; return drop.call(g, x, y); };
    let n = 0;
    while (!seed.remove && !seed.planted && n < 60) { step(1); n++; }
    let res = null;
    if (seed.planted) {
      if (grow) { while (!seed.remove && n < 400) { step(1); n++; } }
      res = grow ? null : [Math.floor(seed.cx / 16), Math.floor(seed.cy / 16)];
      if (grow) for (let y = 0; y < g.room.th; y++) for (let x = 0; x < g.room.tw; x++) if (g.room.baseName(x, y) === 'coralPillar') res = [x, y];
    } else if (dropped) res = 'hole';
    seed.remove = true;
    g.plantFromAbove = drop;
    g.entities = g.entities.filter(e => !(e instanceof Reefseed));
    g.room.clearGrown();
    return dropped ? { hole: dropped } : res;
  };
  // Every pixel Link can stand on in the room's reached cells, in line with
  // the target and within four tiles of it, facing it.
  const sweep = (job, sea, onHit, grow) => {
    const p = g.player;
    // A dry run: a seed that goes down a hole is recorded, not planted.
    const real = g.plantFromAbove;
    g.plantFromAbove = () => true;
    const [tx, ty] = job.target;
    const cells = new Set(job.cells);
    let tried = 0, hits = [];
    for (const dir of ['up', 'down', 'left', 'right']) {
      const [dx, dy] = DV[dir];
      for (let along = 4; along <= 64; along++) {
        for (let perp = 0; perp < 16; perp++) {
          // Link's centre, `along` px back from the target's near edge.
          let cx, cy;
          if (dx) { cx = dx > 0 ? tx * 16 - along : tx * 16 + 15 + along; cy = ty * 16 + perp; }
          else { cy = dy > 0 ? ty * 16 - along : ty * 16 + 15 + along; cx = tx * 16 + perp; }
          const x = cx - 8, y = cy - 8;
          if (!canOccupy(g, p, x, y)) continue;
          p.x = x; p.y = y;
          const gt = groundTile(g, p);
          if (!cells.has(gt.tx + ',' + gt.ty)) continue;
          const fl = groundFlags(g, p);
          if (fl & (F.DEEP | F.PIT)) continue;
          tried++;
          const r = throwFrom(cx, cy, dir, grow);
          if (onHit(r)) hits.push([cx, cy, dir]);
        }
      }
    }
    g.plantFromAbove = real;
    return { tried, hits: hits.slice(0, 4), n: hits.length };
  };

  const res = [];
  for (const job of jobs) {
    if (job.kind === 'below') {
      for (const sea of [0, 1, 2]) {
        enter(job.map, job.rk, sea);
        const r = sweep(job, sea, (r) => Array.isArray(r) && r[0] === job.target[0] && r[1] === job.target[1], false);
        res.push({ ...job, cells: null, sea, ...r });
      }
    } else {
      const seas = [];
      for (const sea of [0, 1, 2]) {
        g.progress.doors = {};
        for (const k of Object.keys(g.progress.flags || {})) if (k === job.flag) delete g.progress.flags[k];
        resetRooms();
        enter(job.map, job.rk, sea);
        // One throw that goes down the hole is enough; find it, and plant.
        let hit = null;
        const r = sweep(job, sea, (r) => { if (r && r.hole && !hit) hit = r.hole; return !!(r && r.hole); }, false);
        const key = `${job.map}:${job.below}:${job.plate[0]},${job.plate[1]}`;
        // The sweep cleared each try; a real drop now from the first good spot.
        const kept = !!r.n && g.progress.doors[key] === undefined;
        g.progress.doors = {};
        let planted = false, pressed = false, flagSet = false, chest = false, afterLoad = false;
        if (r.n) {
          const [cx, cy, dir] = r.hits[0];
          enter(job.map, job.rk, sea);
          throwFrom(cx, cy, dir, false);
          planted = g.progress.doors[key] === 'coralPillar';
          // Walk in below.
          const [f, rx, ry] = job.below.split(',').map(Number);
          g.enterMap(job.map, f, rx, ry, 1 * 16, 5 * 16, 'right', { instant: true });
          g.player.frozen = 1e9;
          step(3);
          const plate = g.entities.find(e => e.stake);
          pressed = !!(plate && plate.pressed) && g.room.baseName(job.plate[0], job.plate[1]) === 'coralPillar';
          flagSet = !job.flag || flag(g.progress, job.flag);
          chest = g.entities.some(e => e.constructor.name === 'Chest' || e.type === 'chest' || (e.opts && e.opts.needFlag === job.flag));
          // Save, load, and look again.
          g.slot = 2; g.save(); g.loadGame(2);
          g.cutscene = null; g.mode = 'play';
          g.enterMap(job.map, f, rx, ry, 1 * 16, 5 * 16, 'right', { instant: true });
          afterLoad = g.room.baseName(job.plate[0], job.plate[1]) === 'coralPillar';
          for (const k of Object.keys(g.progress.flags || {})) if (k === job.flag) delete g.progress.flags[k];
        }
        seas.push({ sea, tried: r.tried, n: r.n, planted, pressed, flagSet, chest, afterLoad });
      }
      res.push({ ...job, cells: null, seas });
    }
  }
  // An ordinary stake goes when Link leaves; a stake from above stays.
  {
    g.progress.doors = {};
    const p = enter('d5', '0,3,5', 0);
    g.room.setTile(2, 1, 'coralPillar');
    g.progress.doors['d5:0,3,5:7,5'] = 'coralPillar';
    g.room.setTile(7, 5, 'coralPillar');
    g.enterMap('d5', 0, 3, 4, 7 * 16, 9 * 16, 'down', { instant: true });
    g.enterMap('d5', 0, 3, 5, 7 * 16, 1 * 16, 'down', { instant: true });
    res.push({ kind: 'leave', ordinary: g.room.baseName(2, 1), above: g.room.baseName(7, 5) });
    g.progress.doors = {};
  }
  res.push({ kind: 'nothrow', n: nothrow });
  return res;
}, jobs);

for (const r of out) {
  if (r.kind === 'below') {
    check(`${r.map} ${r.name}: no throw from this room comes down on the plate at ${['LOW', 'MID', 'HIGH'][r.sea]} (${r.tried} standing places tried)`,
      r.tried > 0 && r.n === 0, JSON.stringify(r.hits));
  } else if (r.kind === 'above') {
    for (const s of r.seas) {
      const L = ['LOW', 'MID', 'HIGH'][s.sea];
      check(`${r.map} ${r.name}: at ${L} a seed thrown into the knot-hole above grows on the plate below, holds it, pays out, and is there after a load`,
        s.n > 0 && s.planted && s.pressed && s.flagSet && s.chest && s.afterLoad, JSON.stringify(s));
    }
  } else if (r.kind === 'nothrow') {
    check('every throw the sweep asked for was thrown (the sweep is not vacuous)', r.n === 0, `${r.n} refused`);
  } else if (r.kind === 'leave') {
    check('a stake grown the ordinary way is gone when Link leaves the room; a stake from above is not',
      r.ordinary !== 'coralPillar' && r.above === 'coralPillar', JSON.stringify(r));
  }
}
check('no page errors', !errors.length, errors.slice(0, 2).join(' | '));
await browser.close(); server.close();
console.log(`\n=== ${pass} passed, ${fail.length} failed ===`);
process.exit(fail.length ? 1 : 0);
