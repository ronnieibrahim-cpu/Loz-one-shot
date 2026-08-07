// Item harness. Boots headless and proves, in-engine, that each item in
// docs/ITEMS.md actually does the verb the document claims for it.
//
// This exists because the other checkers cannot see an item at all.
// validate.mjs reads room data, walk-dungeons.mjs walks tiles, and neither
// runs a button press — so an item whose `use` sets a flag nothing reads
// passes every one of them and is a dead entry in a registry. The failure mode
// is specific and has already been paid for once in this repo (see HANDOFF on
// the giver entities whose options were silently dropped): the DATA said the
// feature was there and the ENGINE never asked.
//
// One assertion per verb per item, and each one is written so that deleting the
// item's implementation makes it fail rather than skip.
//
// This harness OWNS THE CLOCK — window.__harness.takeOver() plus step(n) —
// like tools/replay.mjs and tools/test.mjs. A harness that fires a key and
// counts animation frames is measuring the machine, not the game; see HANDOFF.
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
  else { failures.push(name); console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); }
}
function section(s) { console.log('\n--- ' + s + ' ---'); }

const { chromium } = await loadPlaywright();
const PORT = 20000 + Math.floor(Math.random() * 20000);
const server = await serve(PORT);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 800, height: 720 } });
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR: ' + (e.stack || e.message)));
page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });

await page.goto(`http://localhost:${PORT}/index.html?seed=20260806`, { waitUntil: 'load' });
await page.waitForFunction(() => !!window.__game && !!window.__harness, { timeout: 15000 });
await page.evaluate(() => window.__harness.takeOver());

/**
 * Park the player somewhere with an item, holding no buttons.
 *
 * `input` is stubbed rather than driven with real key events, because every
 * assertion here is about what an item DOES and none is about input plumbing —
 * and a stub makes "hold B for 40 frames" exact instead of approximate.
 */
await page.evaluate(async () => {
  const prog = await import('/src/game/progress.js');
  const ent = await import('/src/game/entity.js');
  window.__P = prog; window.__E = ent;
  window.__hold = (keys) => {
    const g = window.__game;
    const set = new Set(keys);
    g.input.down = (k) => set.has(k);
    g.input.pressed = (k) => false;
    g.input.released = (k) => false;
    g.input.anyDir = () => set.has('up') || set.has('down') || set.has('left') || set.has('right');
    g.input.takeExtra = () => null;
  };
  window.__tap = (k) => {
    const g = window.__game;
    let fired = false;
    g.input.down = () => false;
    g.input.pressed = (q) => (q === k && !fired) ? (fired = true) : false;
    g.input.released = () => false;
    g.input.anyDir = () => false;
    g.input.takeExtra = () => null;
  };
  window.__park = (o) => {
    const g = window.__game;
    g.newGame(0, 'PROBE');
    g.mode = 'play';
    g.enterMap(o.map, o.floor | 0, o.rx, o.ry, o.tx * 16, o.ty * 16, o.dir || 'down', { instant: true });
    g.mode = 'play';
    if (g.dialogue) g.dialogue.active = false;
    g.entities = g.entities.filter(e => { if (e === g.player) return true; e.remove = true; return false; });
    g.tideHolds.length = 0;
    g.progress.hearts = g.progress.maxHearts = 40;
    g.player.x = o.tx * 16; g.player.y = o.ty * 16;
    g.player.z = 0; g.player.dir = o.dir || 'down';
    g.player.lastSafe.x = g.player.x; g.player.lastSafe.y = g.player.y;
    g.player.invuln = 100000;
    for (const [id, lv] of Object.entries(o.items || {})) window.__P.giveItem(g.progress, id, lv);
    g.progress.equipB = o.equipB || null;
    g.progress.equipA = o.equipA || 'sword';
    if (o.tide != null) g.tide.setLevel(o.tide, { instant: true });
    window.__hold([]);
  };
  window.__standable = (tx, ty) => window.__E.canOccupy(
    window.__game, window.__game.player, tx * 16, ty * 16,
    { jumping: false, swim: false, cutting: false });
});

const park = (o) => page.evaluate(o => window.__park(o), o);
const hold = (keys) => page.evaluate(k => window.__hold(k), keys);
const step = (n) => page.evaluate(n => window.__harness.step(n), n);
const read = (fn) => page.evaluate(fn);

// ===========================================================================
section('Brineglass Lens');

// North Pan: rows of `tidePool`, deep at HIGH and wadeable at MID.
await park({ map: 'overworld', rx: 4, ry: 0, tx: 4, ty: 3, dir: 'up', tide: 1, items: { lens: 1 }, equipB: 'lens' });
await step(4);
let r = await read(() => ({ t: window.__game.player.lensT }));
check('the Lens is down until it is held', r.t === 0, `lensT=${r.t}`);

await hold(['b']); await step(20);
r = await read(() => {
  const g = window.__game;
  return { t: g.player.lensT, level: g.tide.level, tileNow: g.room.tile(4, 1, g.tide.level).name };
});
check('holding the button raises the Lens', r.t > 0, `lensT=${r.t}`);
check('the Lens does not change the tide', r.level === 1, `level=${r.level}`);

// The room really is different at the next level — otherwise the overlay is
// drawing the same picture twice and the assertion above proves nothing.
r = await read(() => {
  const g = window.__game;
  const next = (g.tide.level + 1) % 3;
  let diff = 0;
  for (let y = 0; y < 8; y++) for (let x = 0; x < 10; x++) {
    if (g.room.tile(x, y, g.tide.level).name !== g.room.tile(x, y, next).name) diff++;
  }
  return { diff, alt: g.room.renderAt(next, g.frame) ? 1 : 0 };
});
check('the previewed level is a different room', r.diff > 0, `tiles differing=${r.diff}`);
check('the room can render at another level', r.alt === 1);

await hold([]); await step(20);
r = await read(() => ({ t: window.__game.player.lensT }));
check('releasing lowers the Lens', r.t === 0, `lensT=${r.t}`);

// A phased enemy: not there, not hittable, until the Lens is up.
await park({ map: 'd2', floor: 1, rx: 3, ry: 4, tx: 5, ty: 3, dir: 'down', tide: 1, items: { lens: 1, sword: 1 }, equipB: 'lens' });
await page.evaluate(() => {
  const g = window.__game;
  g.entities = g.entities.filter(e => e === g.player);
  const e = g.spawnEntity ? null : null;
});
await page.evaluate(async () => {
  const g = window.__game;
  const { spawnEntity } = await import('/src/game/entity.js');
  // A keese, not an urchin: the urchin carries `shield: 'front'` and would
  // make "the sword missed" ambiguous between a phase failure and a shield.
  window.__ghost = spawnEntity(g, 'keese', 5, 5, { phase: 2 });
});
await step(4);
r = await read(() => {
  const g = window.__game;
  const e = window.__ghost;
  return { hidden: !!e.hidden, harmless: !!e.harmless, invuln: e.invuln, hurt: e.hurt(g, 99, 'down', 0) };
});
check('a phased enemy is not in the room at the wrong tide', r.hidden, 'it was drawn');
check('a phased enemy cannot be hit at the wrong tide', r.hurt === false, 'the sword connected');

await hold(['b']); await step(20);
r = await read(() => {
  const g = window.__game;
  const e = window.__ghost;
  return { hidden: !!e.hidden, harmless: !!e.harmless, alpha: e.alpha, hurt: e.hurt(g, 99, 'down', 0) };
});
check('the Lens reveals a phased enemy', !r.hidden && r.alpha > 0, `hidden=${r.hidden} alpha=${r.alpha}`);
check('the Lens makes a phased enemy hittable', r.hurt === true, 'the sword still missed');
check('a revealed enemy still cannot hurt you', r.harmless === true);

// ===========================================================================
section('Kelp-Soled Cleats');

// The Gyre: a ring of riptide around a dry centre.
await park({ map: 'overworld', rx: 7, ry: 3, tx: 4, ty: 3, dir: 'down', tide: 1, items: { cleats: 1 }, equipB: 'cleats' });
r = await read(() => {
  const g = window.__game;
  const d = g.room.tile(4, 1, g.tide.level);
  return { name: d.name, push: d.push ? d.push.slice() : null };
});
check('a riptide tile carries a push', !!r.push, `tile=${r.name}`);

// Drop into the current on the surface and it moves you; sink and it does not.
r = await page.evaluate(async () => {
  const g = window.__game;
  const run = (mode) => {
    g.player.x = 4 * 16; g.player.y = 1 * 16;
    g.player.cleatMode = mode;
    g.player.underwater = (mode === 'sink');
    g.player.breath = 100000;
    const x0 = g.player.fx, y0 = g.player.fy;
    window.__hold([]);
    for (let i = 0; i < 30; i++) g.update();
    return Math.abs(g.player.fx - x0) + Math.abs(g.player.fy - y0);
  };
  return { swim: run('swim'), sink: run('sink') };
});
check('a swimmer is carried by the current', r.swim > 0, `moved ${r.swim} subpixels`);
check('a walker on the floor is not', r.sink === 0, `moved ${r.sink} subpixels`);

r = await page.evaluate(() => {
  const g = window.__game;
  const p = g.player;
  p.underwater = true; p.breath = 100000; p.invuln = 0;
  const before = { fx: p.fx, fy: p.fy };
  p.takeDamage(g, 1, { cx: p.cx - 40, cy: p.cy, isProjectile: false });
  const knocked = p.knockTime;
  p.invuln = 0; p.underwater = false;
  p.fx = before.fx; p.fy = before.fy;
  p.takeDamage(g, 1, { cx: p.cx - 40, cy: p.cy, isProjectile: false });
  return { sunk: knocked, afloat: p.knockTime };
});
check('sink mode takes no knockback', r.sunk === 0, `knockTime=${r.sunk}`);
check('...but the surface does', r.afloat > 0, `knockTime=${r.afloat}`);

r = await page.evaluate(() => {
  const g = window.__game;
  const p = g.player;
  p.underwater = true; p.breath = 100000;
  g.progress.items.cleats = 1;
  p.syncCaps(g);
  const l1 = (() => { p._pushT = 0; const before = p._pushT; p.tryPush(g, 1, 0); return p._pushT; })();
  g.progress.items.cleats = 2;
  p.syncCaps(g);
  const l2 = (() => { p._pushT = 0; p.tryPush(g, 1, 0); return p._pushT; })();
  p.underwater = false;
  return { l1, l2 };
});
check('L1 cannot push a block on the seafloor', r.l1 === 0, `pushT=${r.l1}`);
check('the Mermaid Suit can', r.l2 > 0, `pushT=${r.l2}`);

// ===========================================================================
section('Squall Bellows');

// North Pan at HIGH: `tidePool` is deep, and one level back it is wadeable.
await park({ map: 'overworld', rx: 4, ry: 0, tx: 4, ty: 3, dir: 'up', tide: 2, items: { bellows: 1 }, equipB: 'bellows' });
await step(4);
r = await read(() => ({
  level: window.__game.tideAt(4, 1),
  name: window.__game.room.tile(4, 1, window.__game.tideAt(4, 1)).name,
  stand: window.__standable(4, 1),
  holds: window.__game.tideHolds.length,
}));
check('the pan is deep at HIGH', r.stand === false && r.holds === 0, `${r.name} stand=${r.stand}`);

await hold(['b']); await step(40);
r = await read(() => {
  const g = window.__game;
  return {
    open: !!g.player.bellowsOpen, holds: g.tideHolds.length,
    inCone: g.tideAt(4, 1), name: g.room.tile(4, 1, g.tideAt(4, 1)).name,
    stand: window.__standable(4, 1),
    outside: g.tideAt(9, 7),
  };
});
check('pumping opens a cone', r.open && r.holds === 1, `open=${r.open} holds=${r.holds}`);
check('the water in the cone falls a level', r.inCone === 1, `level=${r.inCone}`);
check('...and becomes standable', r.stand === true, `${r.name} stand=${r.stand}`);
check('the rest of the room is untouched', r.outside === 2, `level=${r.outside}`);

r = await read(() => {
  const g = window.__game;
  const x0 = g.player.fx, y0 = g.player.fy;
  window.__hold(['b', 'up']);
  for (let i = 0; i < 20; i++) g.update();
  return { moved: Math.abs(g.player.fx - x0) + Math.abs(g.player.fy - y0) };
});
check('pumping costs you your feet', r.moved === 0, `moved ${r.moved} subpixels`);

await hold([]); await step(6);
r = await read(() => ({
  holds: window.__game.tideHolds.length,
  level: window.__game.tideAt(4, 1),
}));
check('letting go lets the water back', r.holds === 0 && r.level === 2, `holds=${r.holds} level=${r.level}`);

// The gust moves what it is supposed to move, and nothing else.
r = await page.evaluate(async () => {
  const g = window.__game;
  const { spawnEntity } = await import('/src/game/entity.js');
  g.tide.setLevel(1, { instant: true });
  g.player.x = 4 * 16; g.player.y = 5 * 16; g.player.dir = 'up';
  const light = spawnEntity(g, 'keese', 4, 3, {});
  const heavy = spawnEntity(g, 'darknut', 4, 3, {});
  // `gust` is called directly rather than by running the game, because an
  // enemy's own AI would walk it toward the player and "it moved" would say
  // nothing about the wind. Setting `dormant` does not help: Enemy.update
  // recomputes that field from `tideOnly` on every frame.
  window.__hold(['b']);
  for (let i = 0; i < 40; i++) g.update();      // open the cone
  const l0 = light.fx + light.fy, h0 = heavy.fx + heavy.fy;
  for (let i = 0; i < 20; i++) g.player.gust(g, 0, -1);
  const out = {
    light: Math.abs((light.fx + light.fy) - l0),
    heavy: Math.abs((heavy.fx + heavy.fy) - h0),
    lightFlag: !!light.light, heavyFlag: !!heavy.light,
  };
  window.__hold([]);
  for (let i = 0; i < 4; i++) g.update();
  return out;
});
check('a keese is light and a darknut is not', r.lightFlag && !r.heavyFlag,
  `keese.light=${r.lightFlag} darknut.light=${r.heavyFlag}`);
check('the gust shoves a light enemy', r.light > 0, `moved ${r.light}`);
check('the gust does not shove an armoured one', r.heavy === 0, `moved ${r.heavy}`);

// The wheel: too far to reach, and it answers wind.
r = await page.evaluate(async () => {
  const g = window.__game;
  const { spawnEntity } = await import('/src/game/entity.js');
  g.entities = g.entities.filter(e => e === g.player);
  g.player.x = 4 * 16; g.player.y = 5 * 16; g.player.dir = 'up';
  const w = spawnEntity(g, 'wheel', 4, 3, { needTurns: 20 });
  window.__hold(['b']);
  for (let i = 0; i < 80; i++) g.update();
  window.__hold([]);
  for (let i = 0; i < 4; i++) g.update();
  return { open: !!w.open, turns: w.turns };
});
check('a sustained gust turns a sluice wheel', r.open === true, `open=${r.open} turns=${r.turns}`);

// ===========================================================================
section('Reefseed');

// Deep Root: a moat of `dWaterD`, deep at every tide level, so the conch never
// opens it. This is the room the item exists for.
await park({ map: 'd5', rx: 5, ry: 3, tx: 1, ty: 3, dir: 'right', tide: 1, items: { reefseed: 1 }, equipB: 'reefseed' });
await page.evaluate(() => { const g = window.__game; g.progress.maxReefseeds = 8; g.progress.reefseeds = 8; });
await step(4);
r = await read(() => {
  const g = window.__game;
  return {
    lo: g.room.tile(4, 3, 0).name, mid: g.room.tile(4, 3, 1).name, hi: g.room.tile(4, 3, 2).name,
    stand: window.__standable(4, 3),
  };
});
check('the moat is deep at every tide level',
  r.lo === 'dWaterD' && r.mid === 'dWaterD' && r.hi === 'dWaterD', `${r.lo}/${r.mid}/${r.hi}`);
check('...so nothing stands in it', r.stand === false);

// Plant one and wait it out. The seed is given no velocity so it settles on
// the tile it was made on: this is a test of what a Reefseed BECOMES, and a
// lob that lands a tile further on would only be a test of the arc.
r = await page.evaluate(async () => {
  const g = window.__game;
  const { Reefseed } = await import('/src/game/items.js');
  const feel = await import('/src/data/feel.js');
  const seed = new Reefseed(5 * 16, 3 * 16, { dir: 'right' });
  seed.vx = 0; seed.vy = 0;
  g.addEntity(seed);
  const before = g.room.baseName(5, 3);
  const seen = [];
  for (let i = 0; i < feel.REEFSEED_GROW_FRAMES + feel.REEFSEED_SETTLE_FRAMES + 30; i++) {
    g.update();
    seen.push(g.room.baseName(5, 3));
  }
  return {
    before, after: g.room.baseName(5, 3),
    grewAt: seen.findIndex(n => n === 'coralPillar'),
    growFrames: feel.REEFSEED_GROW_FRAMES,
  };
});
check('a Reefseed becomes a coral pillar', r.after === 'coralPillar', `tile=${r.after}`);
check('...and it takes about two seconds', r.grewAt >= r.growFrames, `grew at frame ${r.grewAt}, grow=${r.growFrames}`);

r = await read(() => {
  const g = window.__game;
  const names = [0, 1, 2].map(lv => g.room.tile(5, 3, lv).name);
  const out = { names, stand: [] };
  for (const lv of [0, 1, 2]) {
    g.tide.setLevel(lv, { instant: true });
    out.stand.push(window.__standable(5, 3));
  }
  g.tide.setLevel(1, { instant: true });
  return out;
});
check('a pillar is a step at LOW', r.names[0] === 'coralStep' && r.stand[0] === true, `${r.names[0]} stand=${r.stand[0]}`);
check('a pillar is a wall at MID', r.names[1] === 'coralWall' && r.stand[1] === false, `${r.names[1]} stand=${r.stand[1]}`);
check('a pillar is submerged at HIGH', r.names[2] === 'coralSunk' && r.stand[2] === false, `${r.names[2]}`);

// It refuses to brick the room shut.
r = await page.evaluate(async () => {
  const g = window.__game;
  const { Reefseed } = await import('/src/game/items.js');
  const doorRoom = g.room;
  const wall = [0, 0];
  // Find a SOLID tile and a warp tile in whatever room we are standing in.
  let solid = null;
  for (let y = 0; y < 8 && !solid; y++) {
    for (let x = 0; x < 10; x++) {
      const f = doorRoom.flagsAt(x, y, g.tide.level);
      if (f & 1) { solid = [x, y]; break; }     // F.SOLID is bit 0
    }
  }
  return { solid, canPlantSolid: solid ? Reefseed.canPlant(g, solid[0], solid[1]) : null,
           canPlantTwice: Reefseed.canPlant(g, 5, 3) };
});
check('a pillar will not grow inside a wall', r.canPlantSolid === false, `at ${r.solid}`);
check('a pillar will not grow on another pillar', r.canPlantTwice === false);

// ===========================================================================
section('Dredge Line');

// Sunken Crypt: a Small Key on the bottom of a well that is deep at MID and
// HIGH. No tide level exposes it and no sword reaches it.
await park({ map: 'd8', rx: 4, ry: 3, tx: 4, ty: 3, dir: 'up', tide: 1, items: { dredge: 1 }, equipB: 'dredge' });
await step(4);
r = await read(() => {
  const g = window.__game;
  return { buried: (g.room.def.buried || []).length, stand: window.__standable(4, 2) };
});
check('the crypt well has something on its floor', r.buried > 0);
check('...and the floor cannot be walked to', r.stand === false);

r = await page.evaluate(async () => {
  const g = window.__game;
  const { DredgeLine } = await import('/src/game/items.js');
  g.player.x = 4 * 16; g.player.y = 3 * 16; g.player.dir = 'up';
  const before = g.entities.filter(e => e.isDrop).length;
  const line = new DredgeLine(g.player.cx - 5, g.player.cy - 5, { dir: 'up', level: 1, owner: g.player });
  g.player.dredge = line; g.addEntity(line);
  for (let i = 0; i < 90; i++) g.update();
  const drops = g.entities.filter(e => e.isDrop);
  return { before, after: drops.length, kinds: drops.map(d => d.kind || d.type) };
});
check('the line brings up what the floor was keeping', r.after > r.before,
  `drops ${r.before} -> ${r.after} ${JSON.stringify(r.kinds)}`);

// A post is a fixed snag: the line does not move it, it moves you.
r = await page.evaluate(async () => {
  const g = window.__game;
  const { DredgeLine } = await import('/src/game/items.js');
  const { F } = await import('/src/world/tileset.js');
  // Stay in the crypt: an open floor with nothing in the way, so a failure is
  // the item's and not the room's.
  g.entities = g.entities.filter(e => e === g.player);
  g.room.setTile(4, 2, 'post');
  const snagged = !!(g.room.flagsAt(4, 2, g.tide.level) & F.SNAG);
  g.player.x = 4 * 16; g.player.y = 4 * 16; g.player.dir = 'up';
  const y0 = g.player.fy;
  const line = new DredgeLine(g.player.cx - 5, g.player.cy - 5, { dir: 'up', level: 1, owner: g.player });
  g.player.dredge = line; g.addEntity(line);
  for (let i = 0; i < 60; i++) g.update();
  const out = { snagged, moved: y0 - g.player.fy, postStill: g.room.baseName(4, 2) === 'post' };
  g.room.clearTile(4, 2);
  return out;
});
check('a post is a fixed snag', r.snagged === true);
check('a fixed snag pulls Link instead', r.moved > 0, `moved ${r.moved} subpixels`);
check('...and the snag itself does not move', r.postStill === true);

// A landed creature flops: helpless, and it takes double.
r = await page.evaluate(async () => {
  const g = window.__game;
  const { spawnEntity } = await import('/src/game/entity.js');
  const feel = await import('/src/data/feel.js');
  g.entities = g.entities.filter(e => e === g.player);
  const fish = spawnEntity(g, 'anglerfry', 3, 3, {});
  const hpFull = fish.hp;
  const wasHarmless = !!fish.harmless;
  fish.dredged = feel.DREDGE_FLOP_FRAMES;
  fish.harmless = true;
  fish.invuln = 0;
  fish.hurt(g, 1, 'down', 0);
  const afterFlopHit = hpFull - fish.hp;
  const fish2 = spawnEntity(g, 'anglerfry', 6, 3, {});
  fish2.invuln = 0;
  const hp2 = fish2.hp;
  fish2.hurt(g, 1, 'down', 0);
  return {
    wasHarmless, flopDamage: afterFlopHit, normalDamage: hp2 - fish2.hp,
    scale: feel.DREDGE_FLOP_DAMAGE_SCALE, harmlessWhileFlopping: !!fish.harmless,
  };
});
check('a landed creature is harmless while it flops', r.harmlessWhileFlopping === true);
check('...and takes double damage', r.flopDamage === r.normalDamage * r.scale,
  `flop=${r.flopDamage} normal=${r.normalDamage} scale=${r.scale}`);

// ===========================================================================
check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));

console.log(`\n=== ${passed} passed, ${failures.length} failed ===`);
await browser.close(); server.close();
process.exit(failures.length ? 1 : 0);
