// The Drowned Wood Shrine's belts (S186): the Ancient Ruins' conveyors, and
// what they carry.
//
// From the cartridge: a belt carries Link at SPEED_80 (0.5 px/f) in its
// direction on top of his own walking, not while he rides something
// (specialObjects/commonCode.s @tileType_conveyor), and carries an ordinary
// enemy the same way, with normal collisions (enemies/commonCode.s
// ecom_updateMovingPlatform, enemyConveyorTilesTable) — into a hole, if the
// belt runs into one. Ours: a drowned belt does not turn (a HIGH bough's is
// still water at HIGH, a LOW bough's at MID and HIGH), and a Reefseed bud on
// a belt rides it while it grows.
//
// Proves, for EVERY belt tile in the world (found, not declared): it runs at
// exactly the seas its bough says and is water at the others. Then in the
// real engine, on the Hollow Crown's belts: Link standing on one is carried
// BELT_SPEED a frame at LOW and MID and not at HIGH; walking against it he
// still makes headway (0.5 px/f) — which is why a belt never gates Link, only
// what cannot walk; carried into its knot-hole he lands in Rootbound Hall,
// unhurt; an enemy put on it is carried and goes down the hole. Then every
// `beltRoom` claim:
//   * `cross` (K1): the far side is reached from `from` (the dungeon flood);
//   * `seed` (K2): a seed thrown from `from` facing `face` comes up on
//     `lands` at LOW and at MID and holds the plate there; thrown at HIGH it
//     grows where it fell; and a seed thrown from ONE TILE NEARER the start
//     of the belt comes up short. That nothing else reaches the plate is
//     check-canopy.mjs's, which throws from every standing place.
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

// --- every belt in the world, by its tile -----------------------------------
const claims = [];
let belts = 0, crossings = 0;
const badCross = [];
const badSeas = [];
for (const m of MAPS.values()) {
  for (const [rk, def] of Object.entries(m.roomDefs || {})) {
    const [f, rx, ry] = rk.split(',').map(Number);
    const room = getRoom(m.id, f, rx, ry);
    if (!room) continue;
    if (def.beltRoom) claims.push({ map: m.id, rk, def, room });
    for (let y = 0; y < room.th; y++) for (let x = 0; x < room.tw; x++) {
      const runs = [0, 1, 2].map(t => !!room.tile(x, y, t).belt);
      if (!runs.some(Boolean)) continue;
      belts++;
      const name = room.baseName(x, y);
      const want = name.startsWith('dBeltLow') ? [true, false, false] : [true, true, false];
      const wet = [0, 1, 2].every(t => runs[t] || /Water/.test(room.tile(x, y, t).name));
      if (runs.join() !== want.join() || !wet) badSeas.push(`${m.id} ${rk} ${x},${y} ${name} runs ${runs.map(Number).join('')}`);
      // A crossing (S187) carries the low bough's way at LOW and the high
      // bough's at MID: dBeltCross + low + high.
      const cm = /^dBeltCross([NESW])([NESW])$/.exec(name);
      if (cm) {
        crossings++;
        const V = { N: '0,-1', E: '1,0', S: '0,1', W: '-1,0' };
        const at = [0, 1].map(t => String(room.tile(x, y, t).belt));
        if (at[0] !== V[cm[1]] || at[1] !== V[cm[2]]) badCross.push(`${m.id} ${rk} ${x},${y} ${name} carries ${at.join(' then ')}`);
      }
    }
  }
}
check(`every belt runs at its bough's seas and is still water at the others (${belts} belt tiles)`, belts > 0 && !badSeas.length, badSeas.slice(0, 4).join('; '));
check(`every crossing carries the low bough's way at LOW and the high bough's at MID (${crossings} crossings)`, crossings > 0 && !badCross.length, badCross.join('; '));

// The far side of a K1 crossing at every sea, by the dungeon flood.
for (const c of claims) {
  const B = c.def.beltRoom;
  if (!B.cross) continue;
  const fl = floodDungeon(c.map);
  const k = `${c.rk}:${B.cross.to[0]},${B.cross.to[1]}`;
  check(`${c.map} ${c.def.name}: the way across the belts is reached (dungeon flood)`, fl.seen.has(k));
}

// --- in the engine -----------------------------------------------------------
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

const r = await page.evaluate(async (claims) => {
  const g = window.__game;
  const { spawnEntity } = await import('/src/game/entity.js');
  const { giveItem } = await import('/src/game/progress.js');
  const { ITEMS } = await import('/src/game/items.js');
  const F = await import('/src/data/feel.js');
  const step = (n) => { for (let i = 0; i < n; i++) g.update(); };
  window.__harness.takeOver();
  const pad = { mask: {} };
  g.newGame(0, 'LINK', 20261011);
  // The real pad, its buttons taken from `pad.mask` instead of the keyboard.
  g.input.update = function () {
    for (const b of ['up', 'down', 'left', 'right', 'a', 'b', 'start', 'select']) { this.prev[b] = this.held[b]; this.held[b] = !!pad.mask[b]; }
  };
  g.cutscene = null; g.mode = 'play'; g.dialogue.active = false;
  for (const id of ['sword', 'conch', 'reefseed', 'cleats']) giveItem(g.progress, id);
  const enter = (map, f, rx, ry, tx, ty, sea, dir = 'up') => {
    g.tide.clearOverrides();
    g.tide.setLevel(sea, { instant: true });
    g.enterMap(map, f, rx, ry, tx * 16, ty * 16 - 4, dir, { instant: true });
    g.mode = 'play'; g.cutscene = null; g.dialogue.active = false;
    g.entities = g.entities.filter(e => !e.isEnemy);
    const p = g.player; p.invuln = 0; p.frozen = 0;
    return p;
  };
  const out = {};
  const S = F.BELT_SPEED / 256;

  // 1. Standing on a belt (Hollow Crown, row 3, running east), carried.
  out.carry = [];
  for (const sea of [0, 1, 2]) {
    const p = enter('d5', 1, 3, 4, 4, 4, sea);
    const x0 = p.x; step(16);
    out.carry.push({ sea, dx: p.x - x0, room: g.room.key });
  }
  // 2. Walking against it (holding left at LOW).
  {
    const p = enter('d5', 1, 3, 4, 8, 4, 0, 'left');
    pad.mask = { left: true }; step(2);
    const x0 = p.x;
    step(16);
    pad.mask = {};
    out.upstream = p.x - x0;
  }
  // 3. Carried into the knot-hole: lands in Rootbound Hall, unhurt.
  {
    const p = enter('d5', 1, 3, 4, 10, 4, 0, 'down');
    const hp = g.progress.hearts;
    let n = 0;
    while (n < 600 && !(g.room.floor === 0)) { step(1); n++; }
    step(120);
    out.drop = { room: g.room.key, hp0: hp, hp: g.progress.hearts, frames: n, standing: !g.player.falling && !g.player.droppingIn };
  }
  // 4. An enemy on the belt is carried and goes down the hole.
  {
    enter('d5', 1, 3, 4, 7, 8, 0);
    const e = spawnEntity(g, 'stalfos', 8, 3, {});
    e.ai = null; if (e.spec) e.spec = { ...e.spec, ai: null };
    const x0 = e.x;
    step(10);
    const dx = e.x - x0;
    let n = 0;
    while (n < 400 && !e.remove) { step(1); n++; }
    out.enemy = { dx, gone: !!e.remove, fell: !!e.dead, frames: n };
  }
  // 5. K2: a seed thrown at the belt.
  out.seeds = [];
  for (const c of claims) {
    const B = c.def.beltRoom;
    if (!B.seed) continue;
    const [f, rx, ry] = c.rk.split(',').map(Number);
    const [fx, fy] = B.seed.from;
    const tries = [
      { sea: 0, at: [fx, fy] }, { sea: 1, at: [fx, fy] }, { sea: 2, at: [fx, fy] },
      { sea: 0, at: [fx - 1, fy], short: true },
    ];
    for (const t of tries) {
      g.progress.flags = g.progress.flags || {};
      for (const k of Object.keys(g.progress.flags)) if (k.startsWith('d5_')) delete g.progress.flags[k];
      g.room && g.room.clearGrown && g.room.clearGrown();
      const p = enter(c.map, f, rx, ry, t.at[0], t.at[1], t.sea, B.seed.face);
      g.room.clearGrown(); g.room._puzzleDone = false;
      p.frozen = 9999;
      g.progress.reefseeds = 10;
      p.dir = B.seed.face;
      ITEMS.reefseed.use(g, p, 1);
      step(F.REEFSEED_GROW_FRAMES + 120);
      const grown = [];
      for (let y = 0; y < g.room.th; y++) for (let x = 0; x < g.room.tw; x++) if (g.room.baseName(x, y) === 'coralPillar') grown.push([x, y]);
      const plate = g.entities.find(e => e.stake);
      out.seeds.push({ room: c.def.name, sea: t.sea, short: !!t.short, at: t.at, grown, pressed: !!(plate && plate.pressed), lands: B.seed.lands });
    }
  }
  return out;
}, claims.map(c => ({ map: c.map, rk: c.rk, def: { name: c.def.name, beltRoom: c.def.beltRoom } })));

const C = r.carry;
check('on a running belt at LOW Link is carried BELT_SPEED a frame (8 px in 16 frames)', C[0].dx === 8, JSON.stringify(C[0]));
check('on a running high-bough belt at MID he is carried the same', C[1].dx === 8, JSON.stringify(C[1]));
check('at HIGH the belt is drowned and does not carry him', C[2].dx === 0, JSON.stringify(C[2]));
check('walking against a belt he still makes headway (0.5 px/f): a belt never gates Link', r.upstream === -8, String(r.upstream));
check('carried into its knot-hole he lands in the room beneath (Rootbound Hall), unhurt and standing',
  r.drop.room === '0,3,4' && r.drop.hp === r.drop.hp0 && r.drop.standing, JSON.stringify(r.drop));
check('an enemy on a belt is carried, and the belt takes it down the knot-hole', r.enemy.dx > 0 && r.enemy.gone, JSON.stringify(r.enemy));
for (const s of r.seeds) {
  const on = s.grown.some(([x, y]) => x === s.lands[0] && y === s.lands[1]);
  if (s.short) check(`${s.room}: thrown one tile nearer the belt's start, the seed comes up short of the plate`, !on && !s.pressed && s.grown.length === 1, JSON.stringify(s.grown));
  else if (s.sea === 2) check(`${s.room}: at HIGH the belt is still and the seed grows where it fell`, !on && !s.pressed && s.grown.length === 1, JSON.stringify(s.grown));
  else check(`${s.room}: at ${['LOW', 'MID'][s.sea]} a seed rides the belt while it grows and comes up on the plate, holding it`, on && s.pressed, JSON.stringify(s));
}
check('no page errors', !errors.length, errors.slice(0, 2).join(' | '));
await browser.close(); server.close();
console.log(`\n=== ${pass} passed, ${fail.length} failed ===`);
process.exit(fail.length ? 1 : 0);
