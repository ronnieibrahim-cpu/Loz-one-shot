// Region-gate harness. Boots headless and proves the two item gates GAME-PLAN
// asks for actually behave like gates, with a live player and the real items.
//
// check-overworld.mjs proves the MAP side of this — that the Salt Pans and the
// Abyssal approach are unreachable without their item and reachable with it.
// It cannot prove the ITEM side, because it never runs the game: a vane whose
// transform names an action nothing fires would flood correctly there and still
// be impassable in the actual game.
//
// So this asserts, in-engine:
//   * the plain boomerang (level 1) bounces off a salt vane and leaves it shut
//   * the Magic Boomerang (level 2) turns it, and the tile becomes floor
//   * the Magnetic Gloves haul an iron plug out of its socket
//   * the gloves shift the plug in FRONT, not the whole row
//   * the change persists across leaving and re-entering the room
//
// The level check is the whole point of the `level` field on a transform:
// without it "needs the Magic Boomerang" silently degrades to "needs any
// boomerang", and the Salt Pans open two dungeons early.
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
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 800, height: 720 } });
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR: ' + (e.stack || e.message)));
page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });

await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'load' });
await page.waitForFunction(() => !!window.__game, { timeout: 15000 });
await page.evaluate(async () => {
  const prog = await import('/src/game/progress.js');
  window.__giveItem = prog.giveItem;
});

const frames = (n) => page.evaluate((k) => new Promise(res => {
  const s = window.__game.frame;
  const t = () => (window.__game.frame - s >= k) ? res() : requestAnimationFrame(t);
  t();
}), n);

// New game, skip the intro.
await page.keyboard.press('Enter'); await frames(6);
await page.keyboard.press('Enter'); await frames(20);
for (let i = 0; i < 140 && await page.evaluate(() => window.__game.mode === 'cutscene'); i++) {
  await page.keyboard.press('Enter'); await frames(4);
}

// Park the player in a room holding one item at one level, equipped to B.
const setup = (o) => page.evaluate(async (b) => {
  const g = window.__game;
  g.mode = 'play';
  g.enterMap('overworld', 0, b.rx, b.ry, 80, 64, b.dir, { instant: true });
  await new Promise(r => { const s = g.frame; const t = () => (g.frame - s >= 3 ? r() : requestAnimationFrame(t)); t(); });
  if (g.dialogue) g.dialogue.active = false;
  g.mode = 'play';
  g.progress.hearts = g.progress.maxHearts;
  g.player.invuln = 100000;
  // Anything the player picked up in a PREVIOUS probe is still in his hands:
  // the entity list is filtered below, but `player.carrying` is a direct
  // reference and survives it (see docs/HANDOFF.md — the same shape of bug as
  // the dangling `player.boomerang`). A carrying player refuses to hop, so
  // this made the base-hop assertion look like a broken feature.
  if (g.player.carrying) { g.player.carrying.remove = true; g.player.carrying = null; }
  g.player.ledgeHop = null; g.player.jumping = false; g.player.z = 0;
  g.entities = g.entities.filter(e => { if (e === g.player) return true; e.remove = true; return false; });
  g.tide.setLevel(1);
  window.__giveItem(g.progress, b.item, b.level);
  g.progress.equipB = b.item;
  g.player.x = b.tx * 16; g.player.y = b.ty * 16;
  g.player.dir = b.dir;
  g.player.lastSafe.x = g.player.x; g.player.lastSafe.y = g.player.y;
  await new Promise(r => { const s = g.frame; const t = () => (g.frame - s >= 2 ? r() : requestAnimationFrame(t)); t(); });
  // Clear the text box LAST: a room script can reopen it during the settle, and
  // an open dialogue freezes every entity while mode is still 'play'.
  if (g.dialogue) g.dialogue.active = false;
  g.mode = 'play';
  return g.room.baseName(b.gx, b.gy);
}, o);

const nameAt = (gx, gy) => page.evaluate((b) =>
  window.__game.room.baseName(b.gx, b.gy), { gx, gy });

// --- the Salt Pans vane ----------------------------------------------------
// Room 0,7,1: a column of vanes at x=8, rows 2-5. The player stands three tiles
// west so BOTH boomerang levels are well in range (L1 reaches 64px, L2 108px,
// the vane is 48px away) — the only thing that may differ between the two runs
// is the level the gate asks for.
//
// Row 2, not row 3: row 3 is `gg.qqqq.Vg` and those posts are SOLID, so the
// boomerang rattles off the first post and never reaches the vane. Both levels
// then leave it shut and the harness reports a working gate for the wrong
// reason.
const VANE = { rx: 7, ry: 1, gx: 8, gy: 2, tx: 5, ty: 2, dir: 'right', item: 'boomerang' };

let before = await setup({ ...VANE, level: 1 });
check('the salt vane starts as a vane', before === 'saltVane', before);
await page.keyboard.press('KeyZ');
await frames(80);
const afterL1 = await nameAt(VANE.gx, VANE.gy);
check('the plain boomerang does NOT open the salt vane', afterL1 === 'saltVane', afterL1);

before = await setup({ ...VANE, level: 2 });
check('the vane is still shut at the start of the magic run', before === 'saltVane', before);
await page.keyboard.press('KeyZ');
await frames(80);
const afterL2 = await nameAt(VANE.gx, VANE.gy);
check('the Magic Boomerang opens the salt vane', afterL2 !== 'saltVane', afterL2);

// --- the change must survive leaving the room ------------------------------
await page.evaluate(async () => {
  const g = window.__game;
  g.enterMap('overworld', 0, 6, 1, 80, 64, 'down', { instant: true });
  await new Promise(r => { const s = g.frame; const t = () => (g.frame - s >= 3 ? r() : requestAnimationFrame(t)); t(); });
  g.enterMap('overworld', 0, 7, 1, 80, 64, 'down', { instant: true });
  await new Promise(r => { const s = g.frame; const t = () => (g.frame - s >= 3 ? r() : requestAnimationFrame(t)); t(); });
  if (g.dialogue) g.dialogue.active = false;
  g.mode = 'play';
});
const persisted = await nameAt(VANE.gx, VANE.gy);
check('the opened vane stays open after leaving the room', persisted !== 'saltVane', persisted);

// --- the Abyssal plug ------------------------------------------------------
// Room 0,2,1: plugs along row 6, cols 3-6. The player stands one tile north of
// one of them, facing it, and presses the gloves.
const PLUG = { rx: 2, ry: 1, gx: 4, gy: 6, tx: 4, ty: 5, dir: 'down', item: 'magnet', level: 1 };
const plugBefore = await setup(PLUG);
check('the abyssal plug starts as a plug', plugBefore === 'abyssPlug', plugBefore);
await page.keyboard.press('KeyZ');
await frames(20);
const plugAfter = await nameAt(PLUG.gx, PLUG.gy);
check('the Magnetic Gloves pull the abyssal plug', plugAfter !== 'abyssPlug', plugAfter);

// The gloves open the plug in front, not the whole row.
const neighbour = await nameAt(6, 6);
check('the gloves only shift the plug in front', neighbour === 'abyssPlug', neighbour);

// --- the four terrain-shaped gates -----------------------------------------
//
// These are traversal gates, not transform gates: nothing about the tile
// changes, the player simply gets past it. That makes the in-engine half of
// the proof MORE important rather than less, because the map-side flood in
// check-overworld.mjs is satisfied by a flag alone. A span with no post to
// latch floods exactly like one with a post, and is impassable in play — that
// is a bug this harness caught on the Reef Palace span.
//
// Width is load-bearing and no flag expresses it. `Room.solidAt` lets a
// JUMPING player through DEEP as well as JUMPABLE, and Roc's Feather was
// measured at 2.27 tiles of airborne travel, so the Hookshot span is 3 wide
// specifically to be out of the Feather's reach. The last check below is what
// keeps that true if anyone edits the map.

// How long to hold a direction for the player to cover three tiles, read from
// the engine's own walk speed rather than written down here. It used to be a
// flat 22 frames, which was 2.1 tiles at the walk speed of the day and 1.5
// tiles after P3 re-derived it — so the Feather check started failing on a
// chasm the Feather still clears. A frame budget calibrated against a constant
// has to be derived from that constant or it silently measures the wrong thing.
const walkPxPerFrame = await page.evaluate(async () => {
  const feel = await import('/src/data/feel.js');
  const fixed = await import('/src/core/fixed.js');
  return feel.WALK_SPEED / fixed.FP_ONE;
});
const CROSS_FRAMES = Math.ceil(3 * 16 / walkPxPerFrame);

// Hold a direction long enough to cross three tiles, then report the tile the
// player ends on. Three and no more: far enough that a cleared gap is
// unambiguous, near enough that the player does not walk out of the room, which
// would be indistinguishable from never having moved.
const walkAt = async (key, jump) => {
  await page.keyboard.down(key);
  if (jump) { await frames(3); await page.keyboard.press('KeyZ'); }
  await frames(CROSS_FRAMES);
  await page.keyboard.up(key);
  await frames(14);
  return page.evaluate(() => ({
    tx: Math.floor((window.__game.player.x + 8) / 16),
    ty: Math.floor((window.__game.player.y + 8) / 16),
    room: window.__game.room ? window.__game.room.key : '?',
    map: window.__game.mapId,
    mode: window.__game.mode,
  }));
};

// --- Power Bracelet: the Cliffs boulder ------------------------------------
// Room 0,2,2: boulders at row 1, cols 3-6, behind the north doorway.
const BOULDER = { rx: 2, ry: 2, gx: 4, gy: 1, tx: 4, ty: 0, dir: 'down' };
let b0 = await setup({ ...BOULDER, item: 'sword', level: 1 });
check('the cliff boulder starts as a boulder', b0 === 'boulder', b0);
await page.keyboard.press('KeyZ');
await frames(20);
const bSword = await nameAt(BOULDER.gx, BOULDER.gy);
check('a sword does not shift the boulder', bSword === 'boulder', bSword);

await setup({ ...BOULDER, item: 'bracelet', level: 1 });
await page.keyboard.press('KeyZ');
await frames(20);
const bLift = await nameAt(BOULDER.gx, BOULDER.gy);
check('the Power Bracelet lifts the boulder', bLift !== 'boulder', bLift);

// --- The Coral Reef chasm: no longer a gate --------------------------------
// Roc's Feather is gone and THE HOP IS BASE MOVESET. A one-tile chasm is
// therefore crossed by everyone, by walking into it — there is no item to be
// missing and no button to press. That is a deliberate loss of a gate, not an
// oversight: docs/EXECUTION-PLAN.md P9 re-gates the overworld for the new
// roster, and this checker's job here is to prove the HOP works, since nothing
// else in the suite walks into a gap.
//
// Room 0,8,6: a one-tile chasm at col 1, rows 2-5, behind the west doorway.
const CHASM = { rx: 8, ry: 6, gx: 1, gy: 3, tx: 0, ty: 3, dir: 'right' };
const c0 = await setup({ ...CHASM, item: 'sword', level: 1 });
check('the coral chasm is a chasm', c0 === 'chasm', c0);
const cWalk = await walkAt('ArrowRight', false);
check('walking into a one-tile chasm hops it', cWalk.tx >= 2, `ended ${JSON.stringify(cWalk)}`);

// --- Hookshot / Zora's Flippers: NOT expressible as tiles ------------------
// Both were built and both were reverted; docs/HANDOFF.md records the numbers.
// In short: a Flippers channel has to be 3 wide (a JUMPING player crosses DEEP,
// and the Feather reaches 2.27 tiles), and gating the Drowned Wood at that
// width seals 68 screens because the Wood is the map's central thoroughfare.
// A Hookshot span has the same 3-wide floor, which puts the post it must latch
// 5 tiles from the player, and the level-1 Hookshot reaches 64px = 4 tiles.
// Neither is a placement problem; both need a design or engine decision.

check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));

console.log(`\n=== ${passed} passed, ${failures.length} failed ===`);
await browser.close(); server.close();
process.exit(failures.length ? 1 : 0);
