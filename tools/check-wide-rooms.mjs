// Wide-room harness. Boots headless and proves, in-engine, that a room bigger
// than the screen behaves.
//
// The assertions that matter are the ones a WRONG implementation passes.
// "The camera reached its clamp at both ends" is passed by a plain centring
// camera with no deadzone at all, and "exactly one transition fired" is passed
// by a room that never scrolled because nothing in it was ever off screen. So
// this checks the deadzone directly ([A9]) and checks that the room really is
// taller than the window before it believes anything else.
//
// This harness OWNS THE CLOCK and PINS THE SEED, for the reasons in
// docs/HANDOFF.md — the second one is what made check-gates flaky for a year.
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
section('the room is genuinely bigger than the window');

await page.evaluate(() => {
  const g = window.__game;
  g.newGame(0, 'WIDE', 20260806);
  g.mode = 'play';
  g.enterMap('d1', 0, 1, 3, 72, 40, 'down', { instant: true });
  g.mode = 'play';
  if (g.dialogue) g.dialogue.active = false;
  g.entities = g.entities.filter(e => e === g.player);
  g.progress.hearts = g.progress.maxHearts = 40;
  g.player.invuln = 100000;
  g.fadeAmount = 0; g.fadeDir = 0;
  window.__harness.step(2);
});

let r = await read(() => {
  const g = window.__game, rm = g.room;
  return { key: rm.key, sw: rm.sw, sh: rm.sh, tw: rm.tw, th: rm.th,
    pw: rm.pw, ph: rm.ph, lim: g.cam.limits(rm) };
});
check('0,1,3 is a 1x2 room', r.sw === 1 && r.sh === 2, `${r.sw}x${r.sh}`);
check('its grid is 10x16 tiles', r.tw === 10 && r.th === 16, `${r.tw}x${r.th}`);
check('it is taller than the viewport in pixels', r.ph > 128, `ph=${r.ph}`);
check('so the camera has somewhere to go', r.lim[1] > 0 && r.lim[0] === 0,
  `limits=${r.lim}`);

// The bottom half must be REAL — authored tiles, not the void a short grid
// would silently produce.
r = await read(() => {
  const g = window.__game;
  let solid = 0, floor = 0;
  for (let y = 8; y < 16; y++) {
    for (let x = 0; x < 10; x++) {
      const d = g.room.tile(x, y, g.tide);
      if (d.name === 'void') continue;
      if (d.flags & 1) solid++; else floor++;
    }
  }
  return { solid, floor };
});
check('the lower half is authored, not void', r.floor > 20 && r.solid > 10,
  `floor=${r.floor} solid=${r.solid}`);

// ===========================================================================
section('the camera — [A9], the assertion a centring camera fails');

// Drive the player down the room one pixel a frame, recording the camera.
// MID-ROOM, where the camera is free. At the top of the room it is clamped at
// 0 and stands still for that reason alone — an earlier cut of this test
// started there, and a plain centring camera passed it. The clamp, not the
// deadzone, was doing the holding.
r = await read(() => {
  const g = window.__game;
  g.player.fx = 72 << 8; g.player.fy = 120 << 8;
  // CENTRE the window on him rather than snapping. `snap` positions the camera
  // so he sits exactly ON the deadzone boundary, where tracking him 1:1 is
  // correct — start there and the deadzone can never be observed holding.
  const lim = g.cam.limits(g.room)[1];
  g.cam.y = Math.max(0, Math.min(lim, g.player.cy - 64));
  g.cam.x = 0;
  const trail = [];
  for (let i = 0; i < 130; i++) {
    g.player.fy += 256;                       // exactly one pixel
    g.cam.update(g.room, g.player.cx, g.player.cy);
    trail.push([g.player.y, g.cam.y]);
  }
  return { trail, lim: g.cam.limits(g.room)[1] };
});
const trail = r.trail, limY = r.lim;

// [A9] There must be a run of frames where Link moved and the camera did NOT.
let held = 0, run = 0;
for (let i = 1; i < trail.length; i++) {
  const movedPlayer = trail[i][0] !== trail[i - 1][0];
  const movedCam = trail[i][1] !== trail[i - 1][1];
  if (movedPlayer && !movedCam) { run++; held = Math.max(held, run); } else run = 0;
}
check('the camera holds still while Link crosses the deadzone', held >= 8,
  `longest still run = ${held} frames`);
// The still run must happen while the camera is OFF both clamps, or the clamp
// is what is holding it and this proves nothing about the deadzone.
{
  let offClampHeld = 0, run2 = 0;
  for (let i = 1; i < trail.length; i++) {
    const cy = trail[i][1];
    const free = cy > 0 && cy < limY;
    const movedPlayer = trail[i][0] !== trail[i - 1][0];
    const movedCam = cy !== trail[i - 1][1];
    if (free && movedPlayer && !movedCam) { run2++; offClampHeld = Math.max(offClampHeld, run2); }
    else run2 = 0;
  }
  check('...and does so while OFF both clamps, so it is the deadzone holding it',
    offClampHeld >= 4, `longest free-and-still run = ${offClampHeld} frames`);
}

// ...and it must move at some point, or "holds still" is passed by a camera
// welded in place.
const moved = trail.some(([, cy], i) => i && cy !== trail[i - 1][1]);
check('...and it does follow once he leaves it', moved);

check('it ends flush against the room floor', trail[trail.length - 1][1] === limY,
  `cam=${trail[trail.length - 1][1]} limit=${limY}`);
check('it never scrolls past the room', trail.every(([, cy]) => cy >= 0 && cy <= limY));

// The camera must never move faster than CAM_MAX_SPEED during play.
const feel = await read(async () => (await import('/src/data/feel.js')).CAM_MAX_SPEED);
const worst = trail.reduce((m, [, cy], i) => i ? Math.max(m, Math.abs(cy - trail[i - 1][1])) : m, 0);
check('and never faster than CAM_MAX_SPEED', worst <= feel, `worst step ${worst} > ${feel}`);

// ===========================================================================
section('an internal screen seam is not a boundary');

r = await read(() => {
  const g = window.__game;
  // Park him at the top, then walk DOWN across the internal seam at y=128
  // holding the key, the way checkRoomExit is actually driven.
  g.enterMap('d1', 0, 1, 3, 72, 40, 'down', { instant: true });
  g.mode = 'play';
  if (g.dialogue) g.dialogue.active = false;
  g.player.fx = 72 << 8; g.player.fy = 100 << 8;
  window.__hold(['down']);
  let transitions = 0;
  const startKey = g.room.key;
  for (let i = 0; i < 200; i++) {
    if (g.transition) transitions++;
    window.__harness.step(1);
  }
  window.__hold([]);
  return { transitions, room: g.room.key, startKey, y: g.player.y };
});
check('walking across the internal seam fires NO transition', r.transitions === 0,
  `${r.transitions} transition frames`);
check('...and the player is still in the same room', r.room === '0,1,3', r.room);
check('...having actually crossed the seam', r.y > 128, `y=${r.y}`);

// THE DISCRIMINATING ONE. The room's east side has an opening in its LOWER
// half, and the room below-right of it is a different room from the one
// below-right of its upper half. Leaving from the lower half must arrive in
// 0,2,4 — a room's edge is two cells long here and they are not the same
// place. Taking the room's origin instead would send it to 0,2,3, which is a
// door that lies, and no other assertion in this file would notice.
r = await read(() => {
  const g = window.__game;
  g.enterMap('d1', 0, 1, 3, 72, 40, 'down', { instant: true });
  g.mode = 'play';
  if (g.dialogue) g.dialogue.active = false;
  g.player.fx = 100 << 8; g.player.fy = 196 << 8;   // lower half, beside the gap
  g.cam.snap(g.room, g.player.cx, g.player.cy);
  window.__hold(['right']);
  for (let i = 0; i < 240; i++) window.__harness.step(1);
  window.__hold([]);
  return { room: g.room.key, x: g.player.x, y: g.player.y, pw: g.room.pw };
});
check('leaving the LOWER half eastward arrives in 0,2,4, not 0,2,3',
  r.room === '0,2,4', `arrived in ${r.room} at ${r.x},${r.y} pw=${r.pw}`);

// ===========================================================================
section('the minimap draws the span as one room');

r = await read(async () => {
  const maps = await import('/src/world/maps.js');
  const d1 = maps.MAPS.get('d1');
  const [sw, sh] = maps.roomSpan(d1.roomDefs['0,1,3']);
  return { sw, sh, coversOrigin: maps.roomOriginAt('d1', 0, 1, 3),
    coversFar: maps.roomOriginAt('d1', 0, 1, 4) };
});
check('the far cell resolves to the room that covers it',
  r.coversFar === '0,1,3', `got ${r.coversFar}`);
check('the origin resolves to itself', r.coversOrigin === '0,1,3');

r = await read(() => {
  const g = window.__game;
  g.progress.dungeonMaps.d1 = true;
  g.menu.tab = 1; g.mode = 'menu';
  const c = document.createElement('canvas').getContext('2d');
  let threw = null;
  try { g.menu.draw(c); } catch (e) { threw = String(e); }
  g.mode = 'play';
  return { threw };
});
check('the map screen draws a multi-screen room without throwing', r.threw === null, r.threw);

// ===========================================================================
check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));

console.log(`\n=== ${passed} passed, ${failures.length} failed ===`);
await browser.close(); server.close();
process.exit(failures.length ? 1 : 0);
