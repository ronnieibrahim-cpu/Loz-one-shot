// Motion harness. Proves that ground enemies actually walk the 8px lattice.
//
//   node tools/check-motion.mjs            run it
//   node tools/check-motion.mjs --verbose  print a per-enemy table
//
// WHAT IT DOES
//
// Spawns one of every enemy in the roster into an emptied room — every tile
// replaced with plain ground, every warp removed, the player parked in the
// middle and frozen — and steps the engine 600 fixed frames with a fixed seed,
// inspecting every entity after every single frame.
//
// WHAT IT PROVES
//
// For every enemy on the lattice (see `gridLocked` in src/game/enemy.js: not a
// boss or miniboss, not a flier, not aquatic), on every one of those 600
// frames:
//
//   * its subpixel accumulators are whole integers, and
//   * both are multiples of 8 pixels (8 * FP_ONE subpixels), UNLESS it is
//     mid-step, mid-charge, mid-knockback or submerged.
//
// The check is on `fx`/`fy` rather than `x`/`y` on purpose. `x` is `fx >> 8`,
// so a pixel-level check would pass an enemy sitting up to 255 subpixels off a
// lattice point — which is precisely the drift a step that accumulated a
// velocity would produce, and precisely what this exists to catch.
//
// The exemption list is the interesting part, so it is deliberately short. A
// step is the only way a lattice enemy is allowed to be between lattice points,
// and a step is bounded: it begins on a lattice point, ends on one, and cannot
// be interrupted into leaving the enemy somewhere else. Charge and knockback
// are continuous by design and both end by putting the enemy back on the
// lattice, so the exemption covers the frames they are running and not one
// frame more.
//
// A test that only checked alignment could be passed by an enemy that never
// moves, or by one that is permanently exempt. So it also asserts that each
// lattice enemy that moved at all spent frames standing still ON a lattice
// point, and that the roster as a whole took a healthy number of whole steps.
//
// AND THE OTHER HALF: bounceDiag, orbit and charge are supposed to feel
// different, which means NOT being on the lattice. So it also asserts that
// fliers and aquatic enemies — the continuous half of the roster — do visit
// positions the lattice does not contain. If a future change quietly grid-locks
// everything, that check is what fails.
//
// Boot pattern copied from tools/check-gates.mjs.

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const VERBOSE = process.argv.includes('--verbose');

const FRAMES = 600;
const SEED = 20260806;

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
  else { failures.push(name + (detail ? ' — ' + detail : '')); console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); }
}

// ===========================================================================
// The page-side run. Serialised into the browser, so it may close over nothing.
// ===========================================================================

async function runInPage([ground, wet, frames, seed]) {
  const ent = await import('/src/game/entity.js');
  const enemy = await import('/src/game/enemy.js');
  const feel = await import('/src/data/feel.js');
  const screen = await import('/src/core/screen.js');
  const fixed = await import('/src/core/fixed.js');
  // Positions are 8.8 fixed point, so the lattice is asserted on the SUBPIXEL
  // accumulators, not on the derived pixel positions. `x` is `fx >> 8`, so a
  // pixel-level check would pass for an enemy sitting 255 subpixels off a
  // lattice point — which is exactly the drift a step that accumulated a
  // velocity would produce.
  const GRID = feel.ENEMY_GRID_STEP * fixed.FP_ONE;
  const ROOM_W = screen.ROOM_W, ROOM_H = screen.ROOM_H;

  const g = window.__game;
  window.__harness.takeOver();
  g.newGame(0, 'LINK', seed);
  // newGame opens the intro cutscene; this harness starts from a stated state.
  g.cutscene = null;
  g.mode = 'play';
  g.dialogue.active = false;
  g.enterMap('overworld', 0, 4, 7, 72, 64, 'down', { instant: true });
  g.fadeAmount = 0; g.fadeDir = 0; g.fadeThen = null;
  g.bannerTime = 0; g.itemShow = null;
  g.dialogue.active = false;
  // Mid tide: the enemies that only exist in water need it, and the ones that
  // only wake when the water rises (urchin) would otherwise stand still and
  // pass every alignment check by doing nothing.
  g.tide.setLevel(1, { instant: true });
  g.frame = 0;

  // ---- empty the room ----------------------------------------------------
  // One tile everywhere, no warps, nothing else alive. The room's outer edge
  // is still a wall as far as canOccupy is concerned (it refuses to leave the
  // view), so enemies are contained without needing a drawn border — and they
  // meet a block often enough that the blocked-step path is exercised.
  for (let ty = 0; ty < ROOM_H; ty++) {
    for (let tx = 0; tx < ROOM_W; tx++) g.room.setTile(tx, ty, ground);
  }
  g.room.warps = [];
  g.entities = g.entities.filter(e => e === g.player);
  g.pendingAdd = [];

  // Park the player in the middle and stop it updating. A live player would
  // take contact damage, get knocked about and change what the chasers do from
  // one engine revision to the next; a frozen one still gives every AI
  // something to aim at.
  const p = g.player;
  p.x = 72; p.y = 56; p.update = function () { };
  p.invincible = true;

  // ---- populate ----------------------------------------------------------
  const spots = [];
  for (let ty = 1; ty < ROOM_H - 1; ty++) {
    for (let tx = 1; tx < ROOM_W - 1; tx++) spots.push([tx, ty]);
  }
  const watch = [];
  let si = 0;
  for (const name of ent.ENTITY_TYPES.keys()) {
    const spot = spots[si % spots.length];
    let e = null;
    try { e = ent.spawnEntity(g, name, spot[0], spot[1]); } catch (err) { e = null; }
    if (!e) continue;
    // Enemies only, and not the six dungeon bosses — those need their arena and
    // their intro to do anything. Minibosses DO come through here, because they
    // clear `isBoss` in their init, and that is worth having: they are the
    // sharpest test that the lattice did not swallow the set pieces.
    if (!e.isEnemy || e.isBoss) { g.pendingAdd = g.pendingAdd.filter(x => x !== e); continue; }
    const aquatic = e.terrain === 'water';
    // One room per medium: an aquatic enemy dropped on dry land beaches and
    // dies 90 frames in, and would spend the rest of the run proving nothing.
    if (aquatic !== wet) { g.pendingAdd = g.pendingAdd.filter(x => x !== e); continue; }
    si++;
    watch.push({
      name, e,
      grid: enemy.gridLocked(e),
      speed: e.speed,
      px: e.fx, py: e.fy,
      bad: [],            // alignment violations: {f, x, y}
      idleAligned: 0,     // frames standing still, on a lattice point
      offLattice: 0,      // frames at a position the lattice does not contain
      steps: 0,           // whole lattice steps begun
      moved: 0,           // total pixels travelled
      wasStepping: false,
    });
  }

  // ---- run ---------------------------------------------------------------
  for (let f = 0; f < frames; f++) {
    window.__harness.step(1);
    for (const w of watch) {
      const e = w.e;
      if (e.dead || e.remove) continue;
      w.moved += Math.abs(e.fx - w.px) + Math.abs(e.fy - w.py);
      w.px = e.fx; w.py = e.fy;
      if (e.stepping && !w.wasStepping) w.steps++;
      w.wasStepping = !!e.stepping;

      const onLattice = Number.isInteger(e.fx) && Number.isInteger(e.fy)
        && e.fx % GRID === 0 && e.fy % GRID === 0;
      if (!onLattice) w.offLattice++;
      if (!w.grid) continue;
      // The complete exemption list. Everything else must be on the lattice.
      const busy = e.stepping || e.charging || e.knockTime > 0 || e.stun > 0
        || e.hidden || e.dormant;
      if (busy) continue;
      if (onLattice) { w.idleAligned++; continue; }
      if (w.bad.length < 6) w.bad.push({ f, x: e.x, y: e.y, dir: e.dir });
      else w.bad.push(null);
    }
  }

  return watch.map(w => ({
    name: w.name, grid: w.grid, speed: w.speed,
    bad: w.bad.filter(Boolean), badCount: w.bad.length,
    idleAligned: w.idleAligned, offLattice: w.offLattice,
    steps: w.steps, moved: Math.round(w.moved / fixed.FP_ONE),
    alive: !(w.e.dead || w.e.remove),
  }));
}

// ===========================================================================
// Node side
// ===========================================================================

const { chromium } = await loadPlaywright();
const PORT = 20000 + Math.floor(Math.random() * 20000);
const server = await serve(PORT);
// See test.mjs's own comment on this same fallback: the installed browser
// build does not always match the installed playwright package here.
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
await page.waitForFunction(() => !!window.__game && !!window.__harness, { timeout: 20000 });

console.log(`\n--- ${FRAMES} frames, seed ${SEED} ---`);

const dry = await page.evaluate(runInPage, ['grass', false, FRAMES, SEED]);
// A fresh page: the second room must not inherit the first one's streams.
const page2 = await browser.newPage({ viewport: { width: 800, height: 720 } });
page2.on('pageerror', e => errs.push('PAGEERROR: ' + (e.stack || e.message)));
page2.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
await page2.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'load' });
await page2.waitForFunction(() => !!window.__game && !!window.__harness, { timeout: 20000 });
const wet = await page2.evaluate(runInPage, ['waterS', true, FRAMES, SEED]);

const all = [...dry, ...wet];
const gridded = all.filter(r => r.grid);
const free = all.filter(r => !r.grid);

if (VERBOSE) {
  console.log('\n  enemy          lattice  speed  steps  moved  idle@grid  off-lattice  bad');
  for (const r of all) {
    console.log('  ' + r.name.padEnd(14) +
      (r.grid ? ' yes    ' : ' no     ') +
      String(r.speed).padStart(5) +
      String(r.steps).padStart(7) +
      String(r.moved).padStart(7) +
      String(r.idleAligned).padStart(11) +
      String(r.offLattice).padStart(13) +
      String(r.badCount).padStart(5));
  }
  console.log('');
}

check('the roster spawned', all.length >= 15, `${all.length} enemies`);
check('some of them are on the lattice', gridded.length >= 8, `${gridded.length} lattice enemies`);
check('some of them are not', free.length >= 4, `${free.length} continuous enemies`);

// --- the assertion this file exists for -----------------------------------
const offenders = gridded.filter(r => r.badCount > 0);
check('every ground enemy is 8px-aligned on every frame it is not mid-step',
  offenders.length === 0,
  offenders.slice(0, 4).map(r =>
    `${r.name}: ${r.badCount} frame(s), first ` +
    r.bad.slice(0, 2).map(b => `f${b.f} (${b.x},${b.y}) ${b.dir}`).join(', ')).join(' | '));

// --- and it did not pass by standing still --------------------------------
// Steps, not pixels: an enemy that only ever teleported (a wizzrobe blinking
// in, a leever surfacing) has moved without walking, and proves nothing about
// the lattice.
const walkers = gridded.filter(r => r.steps > 0);
check('the ground enemies actually walked the lattice', walkers.length >= 10,
  `${walkers.length} of ${gridded.length} took whole steps`);

const neverIdle = walkers.filter(r => r.idleAligned === 0);
check('every walking ground enemy was caught standing on a lattice point',
  neverIdle.length === 0,
  `${neverIdle.map(r => r.name).join(', ')} were exempt for the whole run`);

// --- the other half: continuous motion stayed continuous ------------------
const movingFree = free.filter(r => r.moved > 0);
const stuckToGrid = movingFree.filter(r => r.offLattice === 0);
check('fliers and swimmers still move continuously', movingFree.length > 0 && stuckToGrid.length === 0,
  movingFree.length === 0 ? 'nothing continuous moved at all'
    : `${stuckToGrid.map(r => r.name).join(', ')} never left the lattice`);

check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));

console.log('\n=== ' + passed + ' passed, ' + failures.length + ' failed ===');
if (failures.length) {
  console.log('\nFailures:');
  for (const f of failures) console.log('  - ' + f);
}

await browser.close();
server.close();
process.exit(failures.length ? 1 : 0);
