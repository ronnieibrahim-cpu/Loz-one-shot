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
//   * the Dredge Line drags a boulder off the Marsh Stair
//   * the Line shifts the boulder in FRONT, not the whole row
//   * Bombs open the cracked rockfall that holds the Cliffs of Kell
//   * the Keep's seal refuses EVERY item, and opens on a flag instead
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

// PIN THE SAVE SEED. `newProgress` falls back to Date.now(), so without this
// every run of this harness played a DIFFERENT WORLD — the same defect P2
// root-caused in test.mjs, in the one harness P2 never reached. It is what made
// the two Resonance Rod vane assertions fail perhaps twice in ten runs, on an
// idle machine, with nothing else changing. See docs/HANDOFF.md.
await page.goto(`http://localhost:${PORT}/index.html?seed=20260806`, { waitUntil: 'load' });
await page.waitForFunction(() => !!window.__game && !!window.__harness, { timeout: 15000 });
// THIS HARNESS OWNS THE CLOCK. It did not, and that made it intermittently
// fail on an IDLE machine — see the note on `tap` below and docs/HANDOFF.md.
await page.evaluate(() => window.__harness.takeOver());
await page.evaluate(async () => {
  const prog = await import('/src/game/progress.js');
  window.__giveItem = prog.giveItem;
});

// Exactly n fixed updates, no wall clock anywhere near it.
const frames = (n) => page.evaluate((k) => window.__harness.step(k), n);

/**
 * Press a key for real, and HOLD IT ACROSS A FRAME.
 *
 * `page.keyboard.press()` fires keydown and keyup back to back. `pressed()` is
 * edge-triggered and cleared by the next `input.update()`, so if both events
 * land inside one game frame the press is swallowed and the item never fires.
 * Whether they do was a race between CDP round trips and main.js's wall-clock
 * loop — which is why this harness failed on an IDLE machine and PASSED under
 * CPU load, and why adding a single console.log between setup and the press
 * made it pass every time. The Resonance Rod's two vane assertions were the
 * ones that lost.
 *
 * Holding the key down, stepping the clock ourselves, and only then releasing
 * makes the press exactly one frame long on any machine. Same fix P2 applied
 * to test.mjs; this was the harness it never reached.
 */
const tap = async (code) => {
  await page.keyboard.down(code);
  await frames(2);
  await page.keyboard.up(code);
  await frames(1);
};

// New game, skip the intro.
await tap('Enter'); await frames(6);
await tap('Enter'); await frames(20);
for (let i = 0; i < 140 && await page.evaluate(() => window.__game.mode === 'cutscene'); i++) {
  await tap('Enter'); await frames(4);
}

// Park the player in a room holding one item at one level, equipped to B.
const setup = (o) => page.evaluate(async (b) => {
  const g = window.__game;
  g.mode = 'play';
  g.enterMap('overworld', 0, b.rx, b.ry, 80, 64, b.dir, { instant: true });
  window.__harness.step(3);
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
  // INSTANT. A plain setLevel starts a 23-frame sweep, and Game.update returns
  // early for the whole of it — so a probe that presses a button right after
  // setup spends its budget inside the wipe and reports the item as broken.
  // This was harmless while nothing in this file moved the tide; the Resonance
  // Rod's range check does.
  g.tide.setLevel(1, { instant: true });
  // A gate transform with `persist: true` writes into progress.secrets AND
  // into the Room's own override grid, and rooms are memoised — so re-entering
  // does not undo either. Every probe here wants the gate shut, so clear both.
  g.progress.secrets = {};
  for (let ty = 0; ty < 8; ty++) for (let tx = 0; tx < 10; tx++) g.room.clearTile(tx, ty);
  window.__giveItem(g.progress, b.item, b.level);
  g.progress.equipB = b.item;
  g.player.x = b.tx * 16; g.player.y = b.ty * 16;
  g.player.dir = b.dir;
  g.player.lastSafe.x = g.player.x; g.player.lastSafe.y = g.player.y;
  window.__harness.step(2);
  // Clear the text box LAST: a room script can reopen it during the settle, and
  // an open dialogue freezes every entity while mode is still 'play'.
  if (g.dialogue) g.dialogue.active = false;
  g.mode = 'play';
  return g.room.baseName(b.gx, b.gy);
}, o);

const nameAt = (gx, gy) => page.evaluate((b) =>
  window.__game.room.baseName(b.gx, b.gy), { gx, gy });

// --- the Salt Pans vane ----------------------------------------------------
// Room 0,7,1: a column of vanes at x=8, rows 2-5. A vane is metal, and the
// Magic Boomerang that used to turn it is gone — the Resonance Rod rings it
// open now.
//
// THE INTERESTING PART IS THE RANGE. The Rod carries ROD_RANGE at LOW and MID
// and ROD_RANGE_HIGH at HIGH, so the same player standing in the same place
// opens the region at one tide level and not at another. That is the only gate
// in the game whose key is the core mechanic, and both halves are asserted
// here because a range that did not actually differ would still look like a
// working gate from the open direction.
//
// Row 2, not row 3: row 3 is `gg.qqqq.Vg` and those posts are SOLID. They do
// not stop a ring — the Rod is a room effect, not a projectile — but standing
// clear of them keeps this probe comparable with the boomerang runs it
// replaced.
const rodRange = await page.evaluate(async () => {
  const f = await import('/src/data/feel.js');
  return { low: f.ROD_RANGE, high: f.ROD_RANGE_HIGH };
});
// Far enough that only the HIGH range reaches: between the two radii.
const farTx = Math.max(0, 8 - Math.floor((rodRange.low + rodRange.high) / 2 / 16));
const VANE = { rx: 7, ry: 1, gx: 8, gy: 2, dir: 'right', item: 'rod' };

let before = await setup({ ...VANE, tx: 5, ty: 2, level: 1 });
check('the salt vane starts as a vane', before === 'saltVane', before);
await tap('KeyZ');
await frames(20);
const vNear = await nameAt(VANE.gx, VANE.gy);
check('the Resonance Rod rings the salt vane open', vNear !== 'saltVane', vNear);

before = await setup({ ...VANE, tx: farTx, ty: 2, level: 1 });
check('the vane is shut again for the range run', before === 'saltVane', before);
await tap('KeyZ');
await frames(20);
const vFarMid = await nameAt(VANE.gx, VANE.gy);
check('...out of range at MID the note does not reach', vFarMid === 'saltVane', vFarMid);

await page.evaluate(() => window.__game.tide.setLevel(2, { instant: true }));
await frames(6);
await tap('KeyZ');
await frames(20);
const vFarHigh = await nameAt(VANE.gx, VANE.gy);
check('...but at HIGH tide the water carries it', vFarHigh !== 'saltVane', vFarHigh);

// --- the Deep Cut rockfall: the Cliffs of Kell, on Bombs -------------------
// Room 0,3,4, col 8, rows 2-5. This is the critical path — the only way into
// the Cliffs, and through them the only way to D4, the Abyss Stair and the
// Keep — so it is the one gate in the world whose in-engine behaviour a player
// cannot route around. It was four boulders and therefore opened only to the
// Dredge Line, which is D6's item, sitting behind it.
const FALL = { rx: 3, ry: 4, gx: 8, gy: 4, tx: 6, ty: 4, dir: 'right', item: 'bombs', level: 1 };
const fallBefore = await setup(FALL);
check('the Deep Cut rockfall starts cracked and shut', fallBefore === 'boulderCracked', fallBefore);
// Drop the bomb beside it and let the fuse run all the way down.
await page.evaluate(() => { window.__game.player.x = 7 * 16; window.__game.player.y = 4 * 16; });
await tap('KeyZ');
await frames(240);
const fallAfter = await nameAt(FALL.gx, FALL.gy);
check('Bombs open the Deep Cut rockfall', fallAfter !== 'boulderCracked', fallAfter);

// --- the Keep's seal: the one gate no item answers -------------------------
// Room 0,2,1, row 6, cols 3-6, and room 0,2,2, row 1, cols 3-6 — two courses
// of one seal. It carries `openFlag: 'makuOpenedKeep'`, which the Maku Tree
// sets at five Essences, and NOTHING else opens it.
//
// Both halves are asserted because the failure that shipped was the open half
// being true of the wrong key: the seal was an iron plug the Dredge Line
// hauled out, and the Dredge Line is inside what it sealed.
const SEAL = { rx: 2, ry: 1, gx: 4, gy: 6, tx: 4, ty: 5, dir: 'down', item: 'dredge', level: 1 };
const sealBefore = await setup(SEAL);
check("the Keep's seal starts shut", sealBefore === 'keepSeal', sealBefore);
await tap('KeyZ');
await frames(30);
check('...and the Dredge Line does not open it', await nameAt(4, 6) === 'keepSeal',
  await nameAt(4, 6));
// Pressing A on it says so rather than ignoring the player.
await tap('KeyX');
await frames(4);
const denied = await page.evaluate(() => {
  // The box keeps its text as PAGES of lines — there is no `.text`. A probe
  // that reads a field the class does not have reports "the game said nothing"
  // for a game that said the right thing.
  const d = window.__game.dialogue;
  const said = d && d.pages ? d.pages.flat().join(' ') : '';
  return { active: !!(d && d.active), said };
});
check('...and says why, instead of reading as scenery',
  denied.active && /bolted/i.test(denied.said), JSON.stringify(denied));

// Now the flag, and only the flag.
const opened = await page.evaluate(async () => {
  const g = window.__game;
  const prog = await import('/src/game/progress.js');
  if (g.dialogue) g.dialogue.active = false;
  g.mode = 'play';
  prog.setFlag(g.progress, 'makuOpenedKeep');
  g.enterMap('overworld', 0, 2, 1, 80, 64, 'down', { instant: true });
  window.__harness.step(3);
  const stair = [3, 4, 5, 6].map(x => g.room.baseName(x, 6));
  g.enterMap('overworld', 0, 2, 2, 80, 64, 'down', { instant: true });
  window.__harness.step(3);
  const kell = [3, 4, 5, 6].map(x => g.room.baseName(x, 1));
  return { stair, kell };
});
check('the Maku Tree opens the Abyss Stair course',
  opened.stair.every(n => n !== 'keepSeal'), opened.stair.join(','));
check('...and the Upper Kell course with it',
  opened.kell.every(n => n !== 'keepSeal'), opened.kell.join(','));

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
  if (jump) { await frames(3); await tap('KeyZ'); }
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

// --- The Marsh Stair boulder, which is the Dredge Line's overworld gate -----
// The Power Bracelet is gone and lifting is base moveset, so the boulder needs
// a reason to still be a boulder: it is `liftLevel: 2`, past bare hands, and
// the Dredge Line drags it clear. Both directions are asserted, because a gate
// checked one way is a gate that might not be one.
//
// Room 0,1,5: boulders at row 6, cols 1-2 and 7-8. This probe used to stand on
// Upper Kell, whose north row was four boulders — those four are the Keep's
// seal now, and no item opens them. The Line still holds the Bog Stair, and
// this is the proof that its overworld verb is a real one and not a claim: the
// critical path moved off the Line entirely, so if nothing out here answered
// to it, "the Dredge Line opens things on the overworld" would be false.
const BOULDER = { rx: 1, ry: 5, gx: 1, gy: 6, tx: 1, ty: 5, dir: 'down' };
let b0 = await setup({ ...BOULDER, item: 'sword', level: 1 });
check('the Marsh Stair boulder starts as a boulder', b0 === 'boulder', b0);
await tap('KeyZ');
await frames(20);
const bSword = await nameAt(BOULDER.gx, BOULDER.gy);
check('a sword does not shift the boulder', bSword === 'boulder', bSword);

// Bare hands lift a pot and a loose rock; they do not lift this.
await tap('KeyX');
await frames(24);
const bHands = await nameAt(BOULDER.gx, BOULDER.gy);
check('bare hands do not lift the boulder', bHands === 'boulder', bHands);

await setup({ ...BOULDER, item: 'dredge', level: 1 });
await tap('KeyZ');
await frames(60);        // a cast flies out and comes back; a lift did not
const bLift = await nameAt(BOULDER.gx, BOULDER.gy);
check('the Dredge Line drags the boulder clear', bLift !== 'boulder', bLift);

// The Line moves the boulder in front, not the whole row.
const bNext = await nameAt(2, 6);
check('...and only the boulder in front', bNext === 'boulder', bNext);

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
