// A PLAY-TEST PASS, run by a harness rather than by a person.
//
// docs/PLAYTEST.md says the checkers cannot see the things only a person
// triggers, and lists them: leaving a room mid-puzzle and coming back, saving
// and reloading, dying inside the mechanic, doing it in the wrong order. That
// list is not unautomatable — it is merely un-CHECKED, because every existing
// tool either floods a static map or drives one scripted route.
//
// This drives the five region gates the way a player meets them and then does
// the awkward things to each. It is the SECOND half of P9: the re-gate is
// proved statically by check-progression.mjs and in-engine at one press by
// check-gates.mjs, and neither of them ever leaves the room.
//
// WHY A REGION GATE IS THE RIGHT PLACE TO SPEND THIS. A dungeon door that
// forgets it was opened costs a walk back. A REGION gate that forgets is a soft
// lock: the player is on the far side of a wall whose key is behind it. Every
// gate here carries `persist: true` for that reason, and `persist: true` writes
// to two places — `progress.doors` and the Room's own override grid — which are
// restored by different code on different paths (`restoreRoomState` on entry,
// the save file on load). Nothing has ever checked that all three agree.
//
// It asserts, per transform gate:
//   * the gate is shut when you first meet it, and the wrong item leaves it shut
//   * the right item opens it
//   * IT IS STILL OPEN AFTER LEAVING THE ROOM AND COMING BACK
//   * IT IS STILL OPEN AFTER A SAVE AND A RELOAD
//   * and, for the traversal gate, that the far side is actually stood on
//
// Usage: node tools/play-gates.mjs

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
  try { mod = await import('playwright'); } catch {
    const { execSync } = await import('node:child_process');
    mod = await import(join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'playwright', 'index.js'));
  }
  return mod.chromium ? mod : mod.default;
}

let passed = 0; const failures = [];
const check = (n, c, d) => c ? (passed++, console.log('  ok   ' + n))
  : (failures.push(n + (d ? ' — ' + d : '')), console.log('  FAIL ' + n + (d ? ' — ' + d : '')));

const { chromium } = await loadPlaywright();
const PORT = 20000 + Math.floor(Math.random() * 20000);
const server = await serve(PORT);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 800, height: 720 } });
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR: ' + (e.stack || e.message)));
page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });

// Pin the seed: `newProgress` falls back to Date.now(), which is what made
// check-gates.mjs fail two assertions in ten runs on an idle machine.
await page.goto(`http://localhost:${PORT}/index.html?seed=20260806`, { waitUntil: 'load' });
await page.waitForFunction(() => !!window.__game && !!window.__harness, { timeout: 15000 });
await page.evaluate(() => window.__harness.takeOver());

const frames = (n) => page.evaluate((k) => window.__harness.step(k), n);
const tap = async (code) => {
  await page.keyboard.down(code); await frames(2);
  await page.keyboard.up(code); await frames(1);
};
const hold = async (code, n) => {
  await page.keyboard.down(code); await frames(n);
  await page.keyboard.up(code); await frames(2);
};

await tap('Enter'); await frames(6);
await tap('Enter'); await frames(20);
for (let i = 0; i < 140 && await page.evaluate(() => window.__game.mode === 'cutscene'); i++) {
  await tap('Enter'); await frames(4);
}

// Only the plain fields cross the CDP boundary — a spread of a gate entry
// carries its `open`/`deny` closures with it and Playwright cannot serialise a
// function, which is a confusing failure a long way from its cause.
const plain = (o) => ({
  rx: o.rx, ry: o.ry, px: o.px, py: o.py, dir: o.dir,
  item: o.item, level: o.level, tide: o.tide, clean: o.clean,
  awayX: o.awayX, awayY: o.awayY,
});

/** Put the player in front of a gate holding one item, with the world clean. */
const park = (o0) => page.evaluate(async (b) => {
  const g = window.__game;
  g.mode = 'play';
  // A clean world every time: a gate opened by an earlier probe must not make
  // the next probe's "it starts shut" assertion pass for the wrong reason.
  if (b.clean) { g.progress.doors = {}; g.progress.secrets = {}; }
  g.progress.items = {};
  if (b.item) window.__harness.giveItem(b.item, b.level || 1);
  g.progress.equipB = b.item || null;
  g.enterMap('overworld', 0, b.rx, b.ry, b.px, b.py, b.dir, { instant: true });
  window.__harness.step(3);
  if (g.dialogue) g.dialogue.active = false;
  g.mode = 'play';
  g.progress.hearts = g.progress.maxHearts;
  g.player.invuln = 1e6;
  if (g.player.carrying) { g.player.carrying.remove = true; g.player.carrying = null; }
  g.player.ledgeHop = null; g.player.jumping = false; g.player.z = 0;
  g.entities = g.entities.filter(e => { if (e === g.player) return true; e.remove = true; return false; });
  g.tide.setLevel(b.tide == null ? 1 : b.tide, { instant: true });
}, plain(o0));

const nameAt = (tx, ty) => page.evaluate(([x, y]) => window.__game.room.baseName(x, y), [tx, ty]);
const where = () => page.evaluate(() => ({
  map: window.__game.mapId, room: window.__game.room && window.__game.room.key,
  x: Math.round(window.__game.player.x), y: Math.round(window.__game.player.y),
}));

// Leave the room and walk back in — the cheapest version of "walk away and
// come back", and the one that exercises `restoreRoomState` rather than the
// Room object's own memoised override grid.
const leaveAndReturn = async (o0) => page.evaluate(async (b) => {
  const g = window.__game;
  g.enterMap('overworld', 0, b.awayX, b.awayY, 80, 64, 'down', { instant: true });
  window.__harness.step(4);
  g.enterMap('overworld', 0, b.rx, b.ry, b.px, b.py, b.dir, { instant: true });
  window.__harness.step(4);
}, plain(o0));

// Save, wipe every trace in memory, load. This is the path a player takes when
// they put the game down, and no tool in the repo has ever walked it.
//
// It goes through `saveSlot`/`loadSlot` rather than deep-copying the progress
// object, because the two are not the same test: the real path serialises to
// storage and runs `migrate` on the way back, and a field that does not survive
// that round trip is exactly the kind of thing that only bites a player.
//
// It also DROPS EVERY MEMOISED ROOM. `getRoom` caches Room instances for the
// life of the process, so a gate can appear to persist purely because the
// object holding its override grid never went away — which is not persistence
// at all, and is what a fresh boot would expose and nothing here would.
const saveAndReload = async (o0) => page.evaluate(async (b) => {
  const g = window.__game;
  const prog = await import('/src/game/progress.js');
  const maps = await import('/src/world/maps.js');
  prog.saveSlot(7, g.progress);
  for (const [, m] of maps.MAPS) if (m._rooms) m._rooms.clear();
  const loaded = prog.loadSlot(7);
  if (!loaded) throw new Error('play-gates: the save slot came back empty');
  g.progress = loaded;
  g.room = null;
  g.enterMap('overworld', 0, b.rx, b.ry, b.px, b.py, b.dir, { instant: true });
  window.__harness.step(4);
  prog.deleteSlot(7);
  return Object.keys(g.progress.doors || {}).length;
}, plain(o0));

// --------------------------------------------------------------------------
// The three transform gates, in the order a player meets them.
//
// Each entry: where the gate is, where to stand, what opens it, what does not.
const GATES = [
  {
    name: 'the Bog Stair crack (Bombs, from the Coral Spire)',
    rx: 1, ry: 6, gx: 4, gy: 1, px: 72, py: 40, dir: 'up',
    away: [1, 7], item: 'bombs', wrong: 'sword', tile: 'cliffCrackedDk',
    // A bomb is placed and then goes off; the swing is instant.
    open: async () => { await tap('KeyZ'); await frames(120); },
    deny: async () => { await tap('KeyZ'); await frames(24); },
  },
  {
    name: 'the Windward Pan vane (Resonance Rod, from the Maku Tree)',
    rx: 7, ry: 1, gx: 8, gy: 3, px: 112, py: 56, dir: 'right',
    away: [7, 2], item: 'rod', wrong: 'sword', tile: 'saltVane',
    open: async () => { await tap('KeyZ'); await frames(30); },
    deny: async () => { await tap('KeyZ'); await frames(24); },
  },
  {
    name: 'the Abyss Stair sluice (Squall Bellows, from the Cistern)',
    rx: 2, ry: 1, gx: 4, gy: 6, px: 72, py: 88, dir: 'down',
    away: [2, 2], item: 'bellows', wrong: 'sword', tile: 'kellSluice',
    // The cone needs BELLOWS_WARMUP_FRAMES before it opens, so it is HELD.
    open: async () => { await hold('KeyZ', 90); },
    deny: async () => { await tap('KeyZ'); await frames(24); },
  },
];

for (const g of GATES) {
  console.log(`\n--- ${g.name} ---`);

  // 1. shut when you meet it, and the wrong item leaves it shut.
  await park({ ...g, clean: true, item: g.wrong });
  check('shut when you first meet it', await nameAt(g.gx, g.gy) === g.tile, await nameAt(g.gx, g.gy));
  await g.deny();
  check('the wrong item leaves it shut', await nameAt(g.gx, g.gy) === g.tile, await nameAt(g.gx, g.gy));

  // 2. the right item opens it.
  await park({ ...g, clean: true, item: g.item });
  await g.open();
  const opened = await nameAt(g.gx, g.gy);
  check('the right item opens it', opened !== g.tile, opened);

  // 3. still open after leaving and coming back.
  //
  // WEAKER THAN IT LOOKS, and this is worth knowing before trusting it: rooms
  // are MEMOISED by `getRoom` for the life of the process, so walking out and
  // back in hands you the same Room object with the same override grid. This
  // assertion passes with `persist: true` deleted from the transform — it was
  // run that way to check. It proves the walk-back path does not CLEAR the
  // change; only the reload below proves the change was ever written down.
  await leaveAndReturn({ ...g, awayX: g.away[0], awayY: g.away[1] });
  const afterWalk = await nameAt(g.gx, g.gy);
  check('still open after leaving the screen and walking back', afterWalk === opened, afterWalk);

  // 4. still open after a save and a reload, with every Room rebuilt.
  const doorKeys = await saveAndReload(g);
  const afterLoad = await nameAt(g.gx, g.gy);
  check('still open after a save and a reload', afterLoad === opened,
    `${afterLoad} (${doorKeys} persisted tile(s) in the save)`);
}

// --------------------------------------------------------------------------
// The traversal gate. Nothing about the tile changes — the player simply gets
// across — so the only proof is standing on the far side, and the only proof
// that it is a GATE is failing to without the item.
console.log('\n--- the Deep Cut channel (Kelp-Soled Cleats, from the Sanctum) ---');
{
  // 0,3,4 The Deep Cut: the channel is column 8, rows 2-5. Stand at col 7 and
  // walk east. Without the Cleats deep water is a wall; with them it is a road.
  const CUT = { rx: 3, ry: 4, px: 120, py: 56, dir: 'right', away: [3, 3] };
  const CROSS = 90;

  await park({ ...CUT, clean: true, item: 'sword' });
  const startX = (await where()).x;
  await hold('ArrowRight', CROSS);
  const bare = await where();
  check('without the Cleats the channel is a wall', bare.x < startX + 16,
    `walked from x=${startX} to x=${bare.x} in ${CROSS} frames`);
  check('...and did not fall through to another screen', bare.room === '0,3,4', bare.room);

  await park({ ...CUT, clean: true, item: 'cleats' });
  await hold('ArrowRight', CROSS);
  const shod = await where();
  check('with the Cleats the channel is crossed', shod.x > startX + 16 || shod.room !== '0,3,4',
    `walked from x=${startX} to x=${shod.x}, room ${shod.room}`);
}

// --------------------------------------------------------------------------
// A gate must not shut behind you. Every one of these carries `persist: true`
// for exactly this reason, and the assertion above proves it per gate; this is
// the whole-run version — open all three, then walk the world and come back.
console.log('\n--- no gate shuts behind the player ---');
{
  const opened = [];
  for (const g of GATES) {
    await park({ ...g, clean: opened.length === 0, item: g.item });
    await g.open();
    opened.push([g, await nameAt(g.gx, g.gy)]);
  }
  // A long walk through unrelated screens, then back to each in turn.
  for (const k of [[4, 7], [8, 8], [10, 5], [1, 8], [0, 0]]) {
    await page.evaluate(([x, y]) => {
      window.__game.enterMap('overworld', 0, x, y, 80, 64, 'down', { instant: true });
      window.__harness.step(3);
    }, k);
  }
  for (const [g, was] of opened) {
    await park({ ...g, clean: false, item: g.item });
    const now = await nameAt(g.gx, g.gy);
    check(`${g.tile} is still open after crossing the world`, now === was, `${now} was ${was}`);
  }
}

// --------------------------------------------------------------------------
// DUNGEON DOORS, and the one failure in this game that would be UNWINNABLE.
//
// A locked door spends the key BEFORE it opens: `useKey` decrements, then
// `setTile` and `persistTile`. So if the persisted tile does not survive a save
// and a reload, the player comes back to a shut door with the key already gone
// — and small keys are finite, one per lock. That is not a walk-back, it is a
// save file that can never be finished, and it would be invisible to every
// checker in the repo because all of them read the map rather than play it.
//
// Boss doors are the same shape with a worse tail: the boss key is not spent,
// but a boss door that reverts leaves the dungeon's last room sealed.
//
// One locked door and one boss door per dungeon. Positions come from the data
// rather than being typed here — a door that moves must not silently stop
// being tested, which is exactly what happened to check-gates.mjs's boulder.
console.log('\n--- a key spent on a door stays spent, and the door stays open ---');
{
  const doors = await page.evaluate(async () => {
    const maps = await import('/src/world/maps.js');
    const out = [];
    for (const [id, m] of maps.MAPS) {
      if (!/^d[1-6]$/.test(id)) continue;
      let locked = null, boss = null;
      for (const key of Object.keys(m.roomDefs || {})) {
        const [f, x, y] = key.split(',').map(Number);
        const r = maps.getRoom(id, f, x, y);
        if (!r) continue;
        for (let ty = 0; ty < r.th && !(locked && boss); ty++) {
          for (let tx = 0; tx < r.tw; tx++) {
            const n = r.baseName(tx, ty);
            if (!locked && n === 'dDoorLocked') locked = { key, tx, ty };
            if (!boss && n === 'dDoorBoss') boss = { key, tx, ty };
          }
        }
      }
      out.push({ id, locked, boss });
    }
    return out;
  });

  for (const d of doors) {
    for (const [kind, spot] of [['locked', d.locked], ['boss', d.boss]]) {
      if (!spot) { check(`${d.id} has a ${kind} door to test`, false, 'none found'); continue; }
      const r = await page.evaluate(async ([id, s, kind]) => {
        const g = window.__game;
        const maps = await import('/src/world/maps.js');
        const prog = await import('/src/game/progress.js');
        // A clean slate, then exactly enough key to open one door.
        g.progress.doors = {}; g.progress.secrets = {};
        g.progress.keys = {}; g.progress.bossKeys = {};
        if (kind === 'locked') g.progress.keys[id] = 2; else g.progress.bossKeys[id] = true;
        const [f, x, y] = s.key.split(',').map(Number);
        g.mode = 'play';
        g.enterMap(id, f, x, y, 80, 64, 'down', { instant: true });
        window.__harness.step(3);
        if (g.dialogue) g.dialogue.active = false;
        g.mode = 'play';
        const before = g.room.baseName(s.tx, s.ty);
        // Open it the way the A button does, through the engine's own path.
        g.tileInteract(s.tx, s.ty, g.player);
        window.__harness.step(2);
        const opened = g.room.baseName(s.tx, s.ty);
        const keysAfterOpen = kind === 'locked' ? (g.progress.keys[id] || 0) : 1;
        // Save, drop every memoised Room, load. The player put the game down.
        prog.saveSlot(7, g.progress);
        for (const [, m] of maps.MAPS) if (m._rooms) m._rooms.clear();
        const loaded = prog.loadSlot(7);
        g.progress = loaded; g.room = null;
        g.enterMap(id, f, x, y, 80, 64, 'down', { instant: true });
        window.__harness.step(3);
        prog.deleteSlot(7);
        return {
          before, opened,
          after: g.room.baseName(s.tx, s.ty),
          keysAfterOpen,
          keysAfterLoad: kind === 'locked' ? (g.progress.keys[id] || 0) : 1,
          bossAfterLoad: !!g.progress.bossKeys[id],
        };
      }, [d.id, spot, kind]);

      check(`${d.id} ${kind} door opens`, r.opened === 'dDoorOpen', `${r.before} -> ${r.opened}`);
      check(`${d.id} ${kind} door is STILL OPEN after a save and a reload`,
        r.after === 'dDoorOpen', `${r.after} — the key is spent and the door is shut`);
      if (kind === 'locked') {
        check(`${d.id} opening a door spends exactly one key`, r.keysAfterOpen === 1,
          `2 -> ${r.keysAfterOpen}`);
        check(`${d.id} the spent key does not come back on reload`,
          r.keysAfterLoad === r.keysAfterOpen, `${r.keysAfterOpen} -> ${r.keysAfterLoad}`);
      } else {
        check(`${d.id} the boss key survives the reload`, r.bossAfterLoad);
      }
    }
  }
}

check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));

console.log(`\n=== ${passed} passed, ${failures.length} failed ===`);
for (const f of failures) console.log('  ' + f);
await browser.close();
server.close();
process.exit(failures.length ? 1 : 0);
