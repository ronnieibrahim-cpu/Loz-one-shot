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
    g.tide.clearOverrides();   // no override from a previous probe survives
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
section('Kilnshell');

await park({ map: 'cave2', rx: 0, ry: 0, tx: 5, ty: 5, dir: 'left', tide: 0,
  items: { kilnshell: 1, conch: 1 }, equipB: 'kilnshell' });
await step(4);

// PRESSING THE BUTTON MAKES FIRE. That is the item.
await page.evaluate(async () => {
  const g = window.__game;
  const { ITEMS } = await import('/src/game/items.js');
  g.entities = g.entities.filter(e => e === g.player);
  g.player.dir = 'left';
  ITEMS.kilnshell.use(g, g.player, 1);
});
await step(8);
let k = await read(() => {
  const g = window.__game;
  const sh = g.entities.find(e => e.constructor.name === 'Kilnshell');
  return { there: !!sh, lit: sh ? !!sh.lit : null };
});
check('the Kilnshell can be set down', k.there === true, JSON.stringify(k));
check('...and it arrives alight', k.lit === true, 'pressing the button produced no fire');

// The tide's one word: deep water still takes it.
await page.evaluate(() => { window.__game.tide.setLevel(2, { instant: true }); });
await step(20);
k = await read(() => {
  const sh = window.__game.entities.find(e => e.constructor.name === 'Kilnshell');
  return { lit: sh ? !!sh.lit : null };
});
check('deep water puts it out', k.lit === false, 'it burned on under the sea');

await page.evaluate(() => { window.__game.tide.setLevel(0, { instant: true }); });
await step(8);

// MOVEMENT: drift-tangle is the one obstacle a blade does nothing to, and the
// burning shell opens it. Both halves are asserted, because "fire clears it"
// is only a verb if something else does not.
let t = await read(() => {
  const g = window.__game;
  return { before: g.room.baseName(7, 2) };
});
check('the niche is walled with drift-tangle', t.before === 'driftTangleDk', `tile=${t.before}`);
t = await read(() => {
  const g = window.__game;
  const solid = g.room.solidAt(7 * 16 + 8, 2 * 16 + 8, g.tide, { jumping: false, swim: true, cutting: true });
  g.checkTileAction({ x: 7 * 16, y: 2 * 16, w: 16, h: 16 }, 'cut');
  return { solidToABlade: solid, afterCut: g.room.baseName(7, 2) };
});
check('a blade does nothing to drift-tangle',
  t.solidToABlade === true && t.afterCut === 'driftTangleDk', JSON.stringify(t));
t = await read(() => {
  const g = window.__game;
  g.checkTileAction({ x: 7 * 16, y: 2 * 16, w: 16, h: 16 }, 'fire');
  return { after: g.room.baseName(7, 2) };
});
check('fire opens it', t.after !== 'driftTangleDk', `still ${t.after}`);

// PUZZLE / torches: a lit shell set beside a torch lights it. This is the verb
// the Coral Spire's Torch Cell is built on, and before the Kilnshell existed
// NOTHING IN THE GAME EMITTED 'fire' at all — see tools/check-torches.mjs.
//
// The torch is spawned rather than taken from the room: `park` clears every
// non-player entity, which is right for an isolated probe and does mean the
// Torch Cell's own three torches are not here. That the ROOM has them, and
// that its key is not the only one on its floor, is check-torches.mjs's job.
await park({ map: 'd2', rx: 4, ry: 5, tx: 4, ty: 3, dir: 'up', tide: 0,
  items: { kilnshell: 1, conch: 1 }, equipB: 'kilnshell' });
await step(4);
let tc = await page.evaluate(async () => {
  const g = window.__game;
  const { Kilnshell } = await import('/src/game/items.js');
  const { spawnEntity } = await import('/src/game/entity.js');
  const torch = spawnEntity(g, 'torch', 4, 1, {});
  g.addEntity(new Kilnshell(4 * 16, 2 * 16, { lit: true }));
  const before = !!torch.lit;
  for (let i = 0; i < 16; i++) window.__harness.step(1);
  return { before, after: !!torch.lit };
});
check('a torch starts unlit', tc.before === false);
check('a burning Kilnshell lights it', tc.after === true, 'the flame touched it and nothing happened');

// And a COLD shell does not. Otherwise the assertion above is proving that
// torches light when a shell is nearby, which is a different and useless rule.
tc = await page.evaluate(async () => {
  const g = window.__game;
  const { Kilnshell } = await import('/src/game/items.js');
  const { spawnEntity } = await import('/src/game/entity.js');
  g.entities = g.entities.filter(e => e === g.player);
  const torch = spawnEntity(g, 'torch', 7, 1, {});
  g.addEntity(new Kilnshell(7 * 16, 2 * 16, { lit: false }));
  for (let i = 0; i < 16; i++) window.__harness.step(1);
  return { lit: !!torch.lit };
});
check('...and a cold one does not', tc.lit === false, 'an unlit shell lit a torch');

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
  level: window.__game.tide.levelAt(4, 1),
  name: window.__game.room.tile(4, 1, window.__game.tide).name,
  stand: window.__standable(4, 1),
  holds: window.__game.tide.overrides.length,
}));
check('the pan is deep at HIGH', r.stand === false && r.holds === 0, `${r.name} stand=${r.stand}`);

await hold(['b']); await step(40);
r = await read(() => {
  const g = window.__game;
  return {
    open: !!g.player.bellowsOpen, holds: g.tide.overrides.length,
    inCone: g.tide.levelAt(4, 1), name: g.room.tile(4, 1, g.tide).name,
    stand: window.__standable(4, 1),
    outside: g.tide.levelAt(9, 7),
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
  holds: window.__game.tide.overrides.length,
  level: window.__game.tide.levelAt(4, 1),
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

// The First Stake, d5 1,3: the grove's pool is `dWaterD`, deep at every tide
// level, so the conch never opens it. This is the room the item exists for, and
// 6,4 is the tile the dungeon's own prover calls the stake.
await park({ map: 'd5', rx: 1, ry: 3, tx: 4, ty: 4, dir: 'right', tide: 1, items: { reefseed: 1 }, equipB: 'reefseed' });
await page.evaluate(() => { const g = window.__game; g.progress.maxReefseeds = 8; g.progress.reefseeds = 8; });
await step(4);
r = await read(() => {
  const g = window.__game;
  return {
    lo: g.room.tile(6, 3, 0).name, mid: g.room.tile(6, 3, 1).name, hi: g.room.tile(6, 3, 2).name,
    stand: window.__standable(6, 3),
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
  const seed = new Reefseed(6 * 16, 4 * 16, { dir: 'right' });
  seed.vx = 0; seed.vy = 0;
  g.addEntity(seed);
  const before = g.room.baseName(6, 4);
  const seen = [];
  for (let i = 0; i < feel.REEFSEED_GROW_FRAMES + feel.REEFSEED_SETTLE_FRAMES + 30; i++) {
    g.update();
    seen.push(g.room.baseName(6, 4));
  }
  return {
    before, after: g.room.baseName(6, 4),
    grewAt: seen.findIndex(n => n === 'coralPillar'),
    growFrames: feel.REEFSEED_GROW_FRAMES,
  };
});
check('a Reefseed becomes a coral pillar', r.after === 'coralPillar', `tile=${r.after}`);
check('...and it takes about two seconds', r.grewAt >= r.growFrames, `grew at frame ${r.grewAt}, grow=${r.growFrames}`);

r = await read(() => {
  const g = window.__game;
  const names = [0, 1, 2].map(lv => g.room.tile(6, 4, lv).name);
  const out = { names, stand: [] };
  for (const lv of [0, 1, 2]) {
    g.tide.setLevel(lv, { instant: true });
    out.stand.push(window.__standable(6, 4));
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
           canPlantTwice: Reefseed.canPlant(g, 6, 4) };
});
check('a pillar will not grow inside a wall', r.canPlantSolid === false, `at ${r.solid}`);
check('a pillar will not grow on another pillar', r.canPlantTwice === false);

// ===========================================================================
section('Dredge Line');

// The Slack Water, the Abyssal Keep's teaching room: one silted ring in the
// middle of a flat pan, and the SAME cast over the SAME tile from the SAME
// square answers differently depending only on where the sea is. That is the
// Dredge Line's whole second half and it is the one thing in the game that
// wants the water UP, so it is asserted here in both directions rather than
// once. `dragBack` skips a tile carrying neither F.WET nor F.SLOW.
await park({ map: 'd6', rx: 5, ry: 3, tx: 4, ty: 6, dir: 'up', tide: 0, items: { dredge: 1 }, equipB: 'dredge' });
await step(4);
r = await read(() => {
  const g = window.__game;
  return { buried: (g.room.def.buried || []).length, dry: g.room.tile(4, 4, g.tide).name };
});
check('the pan has something in its floor', r.buried > 0);
check('...and at LOW the ring is dry crust', r.dry === 'dSiltDry', r.dry);

const dragOnce = async () => page.evaluate(async () => {
  const g = window.__game;
  const { DredgeLine } = await import('/src/game/items.js');
  g.entities = g.entities.filter(e => e === g.player);
  g.player.x = 4 * 16; g.player.y = 6 * 16; g.player.dir = 'up';
  const line = new DredgeLine(g.player.cx - 5, g.player.cy - 5, { dir: 'up', level: 1, owner: g.player });
  g.player.dredge = line; g.addEntity(line);
  for (let i = 0; i < 90; i++) g.update();
  const drops = g.entities.filter(e => e.isDrop);
  return { after: drops.length, kinds: drops.map(d => d.kind || d.type) };
});

r = await dragOnce();
check('the dry pan gives up nothing', r.after === 0, `drops ${r.after} ${JSON.stringify(r.kinds)}`);

await page.evaluate(() => { window.__game.tide.setLevel(1, { instant: true }); });
await step(6);
r = await dragOnce();
check('the line brings up what the floor was keeping, once the sea is on it',
  r.after > 0, `drops ${r.after} ${JSON.stringify(r.kinds)}`);

// And it cannot be cast from the water at all: a weighted line is thrown from
// your heels, the same guard the Bellows and the Reefseed carry. Without it the
// answer to every mooring in the Keep is to swim out and cast from the middle.
r = await page.evaluate(async () => {
  const g = window.__game;
  const { ITEMS } = await import('/src/game/items.js');
  g.entities = g.entities.filter(e => e === g.player);
  g.player.dredge = null;
  g.player.inDeep = true;
  ITEMS.dredge.use(g, g.player, 1);
  const afloat = !!g.player.dredge;
  g.player.inDeep = false; g.player.underwater = true;
  ITEMS.dredge.use(g, g.player, 1);
  const under = !!g.player.dredge;
  g.player.underwater = false;
  ITEMS.dredge.use(g, g.player, 1);
  return { afloat, under, braced: !!g.player.dredge };
});
check('the line refuses to cast while swimming', r.afloat === false);
check('...or from the seafloor', r.under === false);
check('...and casts with both feet down', r.braced === true);

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
section('Resonance Rod');

// The Colonnade of the Drowned: the Keep's one optional reward, the Coilrope,
// sits in an alcove behind a grate. Metal, and only the Rod retracts metal.
await park({ map: 'd6', floor: 1, rx: 2, ry: 4, tx: 4, ty: 4, dir: 'up', tide: 1, items: { rod: 1 }, equipB: 'rod' });
await step(4);
r = await read(() => ({
  name: window.__game.room.baseName(4, 3),
  stand: window.__standable(4, 3),
  chest: window.__standable(4, 2),
}));
check('the boss key alcove is behind a grate', r.name === 'grate' && r.stand === false, `${r.name}`);

r = await page.evaluate(async () => {
  const g = window.__game;
  const { ringResonance } = await import('/src/game/items.js');
  ringResonance(g, g.player, 1);
  for (let i = 0; i < 4; i++) g.update();
  return { name: g.room.baseName(4, 3), stand: window.__standable(4, 3) };
});
check('the Rod retracts a grate', r.name === 'grateOpen' && r.stand === true, `${r.name} stand=${r.stand}`);

// Range doubles at HIGH, and it is the level AT LINK'S TILE that decides.
r = await page.evaluate(async () => {
  const g = window.__game;
  const feel = await import('/src/data/feel.js');
  const { ringResonance } = await import('/src/game/items.js');
  const out = {};
  for (const lv of [1, 2]) {
    g.tide.setLevel(lv, { instant: true });
    g.player.rodCool = 0;
    ringResonance(g, g.player, 1);
    out[lv] = g.player.rodRange;
  }
  g.tide.setLevel(1, { instant: true });
  out.low = feel.ROD_RANGE; out.high = feel.ROD_RANGE_HIGH;
  return out;
});
check('the Rod reaches further at HIGH tide', r[2] > r[1], `MID=${r[1]} HIGH=${r[2]}`);
check('...by roughly double', r[2] === r.high && r[1] === r.low, `${r[1]}/${r[2]} vs ${r.low}/${r.high}`);

// Armour is metal, and metal that is ringing is not blocking.
r = await page.evaluate(async () => {
  const g = window.__game;
  const { spawnEntity } = await import('/src/game/entity.js');
  const { ringResonance } = await import('/src/game/items.js');
  const feel = await import('/src/data/feel.js');
  g.entities = g.entities.filter(e => e === g.player);
  g.player.x = 4 * 16; g.player.y = 4 * 16; g.player.dir = 'up';
  const knight = spawnEntity(g, 'darknut', 4, 5, {});
  g.flushPending();          // addEntity queues; nothing sees it until flushed
  knight.dir = 'up';
  knight.invuln = 0;
  // From the front, before: the shield holds.
  const blocked = knight.hurt(g, 1, 'down', 0);
  knight.invuln = 0;
  g.player.rodCool = 0;
  ringResonance(g, g.player, 1);
  const locked = knight.rodLock;
  const through = knight.hurt(g, 1, 'down', 0);
  return { shield: knight.shield, blocked, locked, through, lockFrames: feel.ROD_LOCK_FRAMES };
});
check('an armoured enemy blocks a frontal hit', r.shield && r.blocked === false, `shield=${r.shield}`);
check('the Rod locks it rigid', r.locked === r.lockFrames, `rodLock=${r.locked}`);
check('...and its armour is no use while it rings', r.through === true);

// The bell points, and only when it is rung.
r = await page.evaluate(async () => {
  const g = window.__game;
  const { spawnEntity } = await import('/src/game/entity.js');
  const { ringResonance } = await import('/src/game/items.js');
  g.entities = g.entities.filter(e => e === g.player);
  const bell = spawnEntity(g, 'bell', 5, 4, { points: [8, 4] });
  g.flushPending();
  const before = { chime: bell.chime, fx: g.entities.filter(e => e.isEffect).length };
  g.player.rodCool = 0;
  ringResonance(g, g.player, 1);
  g.flushPending && g.flushPending();
  return { before, chime: bell.chime, sparks: g.entities.filter(e => e.isEffect).length };
});
check('a bell is silent until it is rung', r.before.chime === 0);
check('the Rod makes it chime and point', r.chime > 0 && r.sparks > r.before.fx,
  `chime=${r.chime} sparks=${r.before.fx}->${r.sparks}`);

// ===========================================================================
section("Ferryman's Coin");

await park({ map: 'overworld', rx: 4, ry: 7, tx: 4, ty: 4, dir: 'right', tide: 1, items: { coin: 1 }, equipB: 'coin' });
await step(4);
r = await page.evaluate(async () => {
  const g = window.__game;
  const { FerrymanCoin } = await import('/src/game/items.js');
  const c = new FerrymanCoin(7 * 16, 4 * 16, { placed: true });
  g.addEntity(c); g.flushPending();
  c.land(g);
  return { saved: JSON.parse(JSON.stringify(g.progress.coin || null)), px: g.player.x, py: g.player.y };
});
check('a thrown coin records where it lies', r.saved && r.saved.map === 'overworld', JSON.stringify(r.saved));

// The swap fires on the tide, not on the button.
r = await page.evaluate(async () => {
  const g = window.__game;
  const before = { px: g.player.x, py: g.player.y, coin: { ...g.progress.coin } };
  const pending0 = g.coinSwapPending || 0;
  g.tide.cycle();
  const pendingAfterCycle = g.coinSwapPending || 0;
  // Run past the sweep, the delay and the fade.
  for (let i = 0; i < 240; i++) g.update();
  return {
    pending0, pendingAfterCycle,
    before, after: { px: g.player.x, py: g.player.y, coin: { ...(g.progress.coin || {}) } },
  };
});
check('nothing happens until the tide turns', r.pending0 === 0);
check('the tide turning arms the swap', r.pendingAfterCycle > 0, `pending=${r.pendingAfterCycle}`);
check('Link ends up where the coin was',
  r.after.px === r.before.coin.px && r.after.py === r.before.coin.py,
  `player ${r.after.px},${r.after.py} vs coin ${r.before.coin.px},${r.before.coin.py}`);
check('...and the coin ends up where Link was',
  r.after.coin.px === r.before.px && r.after.coin.py === r.before.py,
  `coin ${r.after.coin.px},${r.after.coin.py} vs player ${r.before.px},${r.before.py}`);

// One coin, and it is recallable.
r = await page.evaluate(async () => {
  const g = window.__game;
  const { ITEMS, FerrymanCoin } = await import('/src/game/items.js');
  const had = !!g.progress.coin;
  ITEMS.coin.use(g, g.player, 1);
  g.entities = g.entities.filter(e => !e.remove);
  const onBoard = g.entities.filter(e => e instanceof FerrymanCoin).length;
  return { had, after: g.progress.coin, onBoard };
});
check('the coin can be recalled from anywhere', r.had === true && r.after === null);
check('...and only one is ever on the board', r.onBoard === 0, `${r.onBoard} coins`);

// ===========================================================================
section('Chartstone');

await park({ map: 'd1', rx: 3, ry: 7, tx: 4, ty: 4, dir: 'up', tide: 1, items: {} });
r = await page.evaluate(async () => {
  const g = window.__game;
  const { ITEMS } = await import('/src/game/items.js');
  return {
    exists: !!ITEMS.chartstone, passive: !!(ITEMS.chartstone && ITEMS.chartstone.passive),
    compassGone: !ITEMS.compass,
    charts: !!g.progress.charts, compasses: g.progress.compasses === undefined,
  };
});
check('the Chartstone exists and is never equipped', r.exists && r.passive);
check('the Compass is gone', r.compassGone && r.compasses, 'compass still in the registry or the save');

// It has to actually SEPARATE rooms, or the mark says nothing.
r = await page.evaluate(async () => {
  const { getMap, getRoom, hasRoom } = await import('/src/world/maps.js');
  const counts = { none: 0, some: 0, all: 0, total: 0 };
  for (const id of ['d1', 'd2', 'd3', 'd4', 'd5', 'd6']) {
    const m = getMap(id);
    if (!m) continue;
    for (let f = 0; f < m.floors; f++) {
      for (let y = 0; y < m.h; y++) {
        for (let x = 0; x < m.w; x++) {
          if (!hasRoom(id, f, x, y)) continue;
          const room = getRoom(id, f, x, y);
          let mask = 0;
          for (let lv = 0; lv < 3; lv++) {
            const prev = (lv + 2) % 3;
            let d = false;
            for (let ry = 0; ry < 8 && !d; ry++) {
              for (let rx = 0; rx < 10; rx++) {
                if (room.tile(rx, ry, lv).name !== room.tile(rx, ry, prev).name) { d = true; break; }
              }
            }
            if (d) mask |= 1 << lv;
          }
          counts.total++;
          if (mask === 0) counts.none++;
          else if (mask === 7) counts.all++;
          else counts.some++;
        }
      }
    }
  }
  return counts;
});
check('some dungeon rooms are unmoved by the tide', r.none > 0, JSON.stringify(r));
check('some are moved by it', r.none + r.some + r.all === r.total && r.total - r.none > 0, JSON.stringify(r));
check('...and the mark distinguishes WHICH level, not just whether',
  r.some > 0, `rooms changing at only some levels: ${r.some}`);

// ===========================================================================
section('Bottled Tide');

// The Black Causeway: the one overworld screen the conch does not reach.
await park({ map: 'overworld', rx: 2, ry: 0, tx: 4, ty: 2, dir: 'down', tide: 1, items: { bottle: 1, conch: 1 }, equipB: 'bottle' });
await page.evaluate(() => { const g = window.__game; g.progress.maxBottles = 4; g.progress.bottles = 4; });
await step(4);
r = await read(() => ({ blocked: window.__game.tide.blockedReason(), level: window.__game.tide.level }));
check('the causeway suppresses the conch', r.blocked === 'locked', `reason=${r.blocked}`);

r = await page.evaluate(async () => {
  const g = window.__game;
  const before = g.tide.level;
  const cycled = g.tide.cycle();
  const afterConch = g.tide.level;
  const { ITEMS } = await import('/src/game/items.js');
  const bottles = g.progress.bottles;
  ITEMS.bottle.use(g, g.player, 1);
  for (let i = 0; i < 40; i++) g.update();
  return {
    before, cycled, afterConch, afterBottle: g.tide.level,
    bottlesBefore: bottles, bottlesAfter: g.progress.bottles,
  };
});
check('the conch does nothing here', r.cycled === 'locked' && r.afterConch === r.before,
  `${r.before} -> ${r.afterConch} (${r.cycled})`);
check('a bottle moves it one step anyway', r.afterBottle === (r.before + 1) % 3,
  `${r.before} -> ${r.afterBottle}`);
check('...and costs exactly one bottle', r.bottlesAfter === r.bottlesBefore - 1,
  `${r.bottlesBefore} -> ${r.bottlesAfter}`);

// It refuses to be a second conch.
await park({ map: 'overworld', rx: 4, ry: 7, tx: 4, ty: 4, dir: 'down', tide: 1, items: { bottle: 1 }, equipB: 'bottle' });
await page.evaluate(() => { const g = window.__game; g.progress.maxBottles = 4; g.progress.bottles = 4; });
await step(4);
r = await page.evaluate(async () => {
  const g = window.__game;
  const { ITEMS } = await import('/src/game/items.js');
  const before = { level: g.tide.level, bottles: g.progress.bottles };
  ITEMS.bottle.use(g, g.player, 1);
  return { before, level: g.tide.level, bottles: g.progress.bottles };
});
check('a bottle does nothing where the conch works', r.level === r.before.level);
check('...and is not spent trying', r.bottles === r.before.bottles, `${r.before.bottles} -> ${r.bottles}`);

// A boss room that kept the mechanic.
r = await page.evaluate(async () => {
  const { getRoom } = await import('/src/world/maps.js');
  const room = getRoom('d1', 0, 3, 1);
  if (!room) return { found: false };
  let changes = 0;
  for (let y = 0; y < 8; y++) for (let x = 0; x < 10; x++) {
    if (room.tile(x, y, 0).name !== room.tile(x, y, 2).name) changes++;
  }
  return { found: true, noTide: !!room.def.noTide, changes };
});
check('the D1 boss arena still suppresses the conch', r.found && r.noTide);
check('...but its floor does move with the tide', r.changes > 0, `${r.changes} tiles differ LOW vs HIGH`);

// ===========================================================================
section('the roster as a whole');

// Every item any chest, giver, cutscene or dungeon declaration names must be
// a real entry in ITEMS. Nothing else checks this: giveItem happily records an
// id nobody defined, itemName returns the raw id and itemIcon falls back to
// i_unknown, so a chest granting a DELETED item opens, plays its jingle,
// writes to the save and hands over nothing — with no error anywhere. That is
// exactly what a removal session produces if it misses one.
r = await page.evaluate(async () => {
  const { ITEMS } = await import('/src/game/items.js');
  const { MAPS } = await import('/src/world/maps.js');
  const { CUTSCENES } = await import('/src/game/cutscene.js');
  const bad = [];
  const seen = new Set();
  const want = (id, where) => {
    if (id == null) return;
    seen.add(id);
    if (!ITEMS[id]) bad.push(`${where}: '${id}'`);
  };
  for (const [id, m] of MAPS) {
    if (m.dungeon) want(m.dungeon.item, `${id} dungeon.item`);
    for (const [key, def] of Object.entries(m.roomDefs || {})) {
      for (const e of def.entities || []) {
        const o = e[3] || {};
        want(o.item, `${id} ${key} ${e[0]}`);
      }
      const rw = def.puzzle && def.puzzle.reward;
      for (const sp of (rw && rw.spawn) || []) want((sp[3] || {}).item, `${id} ${key} reward`);
    }
  }
  for (const [name, steps] of Object.entries(CUTSCENES || {})) {
    for (const st of steps || []) if (st && st.give) want(st.give.item, `cutscene ${name}`);
  }
  return { bad, checked: seen.size, registry: Object.keys(ITEMS).sort() };
});
check('every item the world hands out actually exists', r.bad.length === 0, r.bad.slice(0, 5).join(' | '));

// And the roster is the one docs/ITEMS.md describes — no more, no less.
{
  const expected = [
    'anchor', 'bellows', 'bombs', 'bottle', 'chartstone', 'cleats', 'coin',
    'conch', 'dredge', 'kilnshell', 'lens', 'map', 'reefseed', 'rod', 'shield',
    'sword',
  ];
  const extra = r.registry.filter(id => !expected.includes(id));
  const missing = expected.filter(id => !r.registry.includes(id));
  check('the registry is exactly the roster in docs/ITEMS.md',
    extra.length === 0 && missing.length === 0,
    `extra=[${extra}] missing=[${missing}]`);
}

// ===========================================================================
check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));

console.log(`\n=== ${passed} passed, ${failures.length} failed ===`);
await browser.close(); server.close();
process.exit(failures.length ? 1 : 0);
