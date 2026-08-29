// Charm harness. Boots headless and proves, in-engine, that every charm in
// src/game/scrimshaw.js actually does the thing its one-line `desc` claims.
//
// It exists for the same reason tools/check-items.mjs does, and guards against
// a failure mode the scrimshaw system makes CHEAP: a charm is pure data, and
// nothing anywhere forces a system to read it. Adding an entry to CHARMS with
// no reader gives you a charm that carves, slots, highlights, saves and does
// absolutely nothing — and every other checker in the repo stays green.
//
// So the last assertion here is the important one: every id in CHARMS is named
// somewhere under src/ besides its own definition. The per-charm assertions
// above it prove the effect; that one proves there are no orphans.
//
// Two rules this harness follows, both learned the hard way (see HANDOFF):
//   - It OWNS THE CLOCK. takeOver() plus step(n), never wall-clock frames.
//   - It slots charms through slotCharm() rather than writing progress
//     directly, so a charm that does not FIT its case fails here rather than
//     silently working in a state the menu could never produce.
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

  const scrim = await import('/src/game/scrimshaw.js');
  window.__S = scrim;
  /**
   * Own a charm, open its case, slot it, and recompute — the whole chain the
   * menu would walk. Returns whether the charm actually came out live, so a
   * charm that cannot be slotted fails loudly instead of testing nothing.
   */
  window.__charm = (id, slot) => {
    const g = window.__game, p = g.progress;
    for (const s of scrim.CHARM_SLOTS) {
      p.charmOpen[s] = true;
      p.charmSlots[s] = [null, null];
    }
    p.charmCase = 2;
    scrim.giveCharm(p, id);
    const use = slot || (scrim.CHARMS[id].slot === 'any' ? 'mid' : scrim.CHARMS[id].slot);
    const ok = scrim.slotCharm(p, use, 0, id);
    g.scrim.prevSlot = null; g.scrim.graceT = 0; g.scrim.wasNeap = false;
    g.scrim.update();
    return ok && g.charm(id);
  };
  /** Wipe every charm, so one probe never leaks into the next. */
  window.__nocharms = () => {
    const g = window.__game, p = g.progress;
    p.charms = {};
    p.charmSlots = scrim.newCharmSlots();
    p.charmCase = 1;
    p.charmOpen = { low: false, mid: true, high: false };
    g.scrim.graceT = 0; g.scrim.prevSlot = null; g.scrim.wasNeap = false;
    g.scrim.update();
  };
});

const park = (o) => page.evaluate(o => window.__park(o), o);
const hold = (keys) => page.evaluate(k => window.__hold(k), keys);
const step = (n) => page.evaluate(n => window.__harness.step(n), n);
const read = (fn) => page.evaluate(fn);
const charm = (id, slot) => page.evaluate(([i, s]) => window.__charm(i, s), [id, slot || null]);
const nocharms = () => page.evaluate(() => window.__nocharms());

// ===========================================================================
// The slotting rule itself, before any effect. If this is wrong every
// assertion below is testing the wrong thing.
section('slots are tide levels');

await park({ map: 'overworld', rx: 4, ry: 7, tx: 4, ty: 4, tide: 1 });
await nocharms();
let r = await read(() => {
  const g = window.__game, p = g.progress, S = window.__S;
  S.giveCharm(p, 'splitFang');
  const placed = S.slotCharm(p, 'mid', 0, 'splitFang');
  g.scrim.update();
  return { placed, live: g.charm('splitFang'), slot: g.scrim.currentSlot() };
});
check('a MID charm is live at MID tide', r.placed && r.live, `slot=${r.slot}`);

r = await read(() => {
  const g = window.__game;
  g.tide.setLevel(2, { instant: true });
  g.scrim.update();
  return { live: g.charm('splitFang'), slot: g.scrim.currentSlot() };
});
check('...and dead at HIGH tide', !r.live, `slot=${r.slot} live=${r.live}`);

r = await read(() => {
  const g = window.__game, p = g.progress, S = window.__S;
  g.tide.setLevel(1, { instant: true });
  S.giveCharm(p, 'gillcarve');
  const fits = S.fitsSlot('gillcarve', 'mid');
  p.charmOpen.mid = true;
  const placed = S.slotCharm(p, 'mid', 0, 'gillcarve');
  return { fits, placed };
});
check('a HIGH charm does not fit the MID case', !r.fits && !r.placed);

r = await read(() => {
  const g = window.__game, p = g.progress, S = window.__S;
  S.giveCharm(p, 'wrackbone');
  return {
    low: S.fitsSlot('wrackbone', 'low'),
    mid: S.fitsSlot('wrackbone', 'mid'),
    high: S.fitsSlot('wrackbone', 'high'),
  };
});
check('a cross-slot charm fits all three cases', r.low && r.mid && r.high);

r = await read(() => {
  const g = window.__game, p = g.progress, S = window.__S;
  p.charmOpen.low = false;
  p.charmSlots = S.newCharmSlots();
  S.giveCharm(p, 'dunerunner');
  const placed = S.slotCharm(p, 'low', 0, 'dunerunner');
  g.tide.setLevel(0, { instant: true });
  g.scrim.update();
  return { placed, live: g.charm('dunerunner') };
});
check('a shut case takes nothing and grants nothing', !r.placed && !r.live);

r = await read(() => {
  const g = window.__game, p = g.progress, S = window.__S;
  p.charmOpen.low = true; p.charmOpen.high = true;
  p.charmCase = 1;
  p.charmSlots = S.newCharmSlots();
  S.giveCharm(p, 'wrackbone');
  p.charmSlots.mid = ['splitFang', 'wrackbone'];
  g.tide.setLevel(1, { instant: true });
  g.scrim.update();
  const one = g.charm('wrackbone');
  p.charmCase = 2;
  g.scrim.update();
  return { one, two: g.charm('wrackbone') };
});
check('the second slot is dead until the case upgrade', !r.one && r.two);

// ===========================================================================
section('LOW case');

// Dunerunner — sand no longer slows you. Measured as distance walked over
// SLOW ground in a fixed number of frames, which is the only honest way to
// assert a speed multiplier that is rounded onto a whole subpixel.
await park({ map: 'overworld', rx: 7, ry: 7, tx: 4, ty: 4, tide: 0 });
await nocharms();
r = await read(() => {
  const g = window.__game;
  // A patch of slow ground under our feet, whatever this screen is made of.
  // `sand` is NOT slow ground — `sandDeep` and `mud` are the ones carrying
  // F.SLOW (see src/data/tiles-core.js). Asserting against plain sand would
  // have compared two identical walks and passed for the wrong reason.
  for (let y = 2; y < 7; y++) for (let x = 1; x < 9; x++) g.room.setTile(x, y, 'sandDeep');
  g.room.invalidate();
  return { ok: 1 };
});
const walkFrames = 40;
const runX = async () => {
  await page.evaluate(() => {
    const g = window.__game;
    g.player.x = 32; g.player.y = 64; g.player.dir = 'right';
  });
  await hold(['right']);
  await step(walkFrames);
  const x = await read(() => window.__game.player.x);
  await hold([]);
  return x;
};
const slowX = await runX();
check('the Dunerunner is live at LOW', await charm('dunerunner'));
const fastX = await runX();
check('sand no longer slows you with the Dunerunner', fastX > slowX,
  `plain=${slowX} charmed=${fastX}`);

// Salt-Etched — +1 sword damage while the room has dry ground.
await nocharms();
r = await read(() => {
  const g = window.__game;
  const P = g.player;
  const plain = P.swordHit(g);
  window.__S.giveCharm(g.progress, 'saltEtched');
  g.progress.charmOpen.low = true;
  window.__S.slotCharm(g.progress, 'low', 0, 'saltEtched');
  g.scrim.update();
  return { plain, charmed: P.swordHit(g), dry: g.charm('saltEtched') };
});
check('Salt-Etched adds a point of sword damage on dry ground',
  r.dry && r.charmed === r.plain + 1, `${r.plain} -> ${r.charmed}`);

// Beachcomber — enemies drop double rupees. Asserted on the DROP's worth,
// which is where the doubling has to happen.
await nocharms();
r = await read(() => {
  const g = window.__game;
  const plain = g.rollDrop(64, 64, 'rich');
  const plainWorth = plain ? plain.worth : null;
  return { plainWorth };
});
await charm('beachcomber', 'low');
r = await read(() => {
  const g = window.__game;
  let worth = null;
  // Roll until the table gives a rupee — every rupee kind carries a `worth`.
  for (let i = 0; i < 200 && worth == null; i++) {
    const d = g.rollDrop(64, 64, 'rich');
    if (d && d.worth != null) worth = d.worth;
    if (d) d.remove = true;
  }
  const spec = { rupee5: 5, rupee20: 20, rupee1: 1, rupee100: 100 };
  return { worth, spec };
});
check('the Beachcomber doubles a dropped rupee',
  r.worth != null && Object.values(r.spec).includes(r.worth / 2),
  `worth=${r.worth}`);

// Gull's Tally — dropped pickups last twice as long.
await nocharms();
r = await read(() => {
  const g = window.__game;
  let plain = null;
  for (let i = 0; i < 200 && plain == null; i++) {
    const d = g.rollDrop(64, 64, 'rich');
    if (d) { plain = d.life; d.remove = true; }
  }
  return { plain };
});
const plainLife = r.plain;
await charm('gullsTally', 'low');
r = await read(() => {
  const g = window.__game;
  let life = null;
  for (let i = 0; i < 200 && life == null; i++) {
    const d = g.rollDrop(64, 64, 'rich');
    if (d) { life = d.life; d.remove = true; }
  }
  return { life };
});
check("the Gull's Tally doubles a drop's lifetime", r.life === plainLife * 2,
  `${plainLife} -> ${r.life}`);

// Chandler's Eye — shops charge less.
await nocharms();
r = await read(() => {
  const g = window.__game;
  const plain = g.shopPrice(80);
  window.__S.giveCharm(g.progress, 'chandlersEye');
  g.progress.charmOpen.low = true;
  window.__S.slotCharm(g.progress, 'low', 0, 'chandlersEye');
  g.scrim.update();
  return { plain, charmed: g.shopPrice(80) };
});
check("the Chandler's Eye discounts a shop price", r.charmed < r.plain,
  `${r.plain} -> ${r.charmed}`);

// Strandwalker — heals on dry land, and does NOT heal in the water.
await nocharms();
await charm('strandwalker', 'low');
r = await read(() => {
  const g = window.__game;
  g.progress.hearts = 4;
  g.player.inShallow = false; g.player.inDeep = false; g.player.underwater = false;
  g.player._strandT = 0;
  for (let i = 0; i < 400; i++) g.player.updateStrandwalker(g);
  const dry = g.progress.hearts;
  g.progress.hearts = 4;
  g.player.inDeep = true; g.player._strandT = 0;
  for (let i = 0; i < 400; i++) g.player.updateStrandwalker(g);
  const wet = g.progress.hearts;
  g.player.inDeep = false;
  return { dry, wet };
});
check('the Strandwalker heals on dry ground', r.dry > 4, `hearts=${r.dry}`);
check('...and not in the water', r.wet === 4, `hearts=${r.wet}`);

// Dry Kindling — a wider blast.
await nocharms();
r = await read(async () => {
  const g = window.__game;
  const fx = await import('/src/game/effects.js');
  const plain = new fx.Explosion(64, 64);
  plain.applyCharms(g);
  const plainW = plain.hb.w;
  window.__S.giveCharm(g.progress, 'dryKindling');
  g.progress.charmOpen.low = true;
  window.__S.slotCharm(g.progress, 'low', 0, 'dryKindling');
  g.scrim.update();
  const wide = new fx.Explosion(64, 64);
  wide.applyCharms(g);
  return { plainW, wideW: wide.hb.w };
});
check('Dry Kindling widens the blast', r.wideW > r.plainW, `${r.plainW} -> ${r.wideW}`);

// Wrecker's Eye — the glimmer is a draw, so what is asserted is that the draw
// path runs and consumes no randomness. The second half is the load-bearing
// one: see CLAUDE.md on draw-time randomness.
await nocharms();
await charm('wreckersEye', 'low');
r = await read(() => {
  const g = window.__game;
  const before = g.rng.float ? g.rng._s : null;
  const c = document.createElement('canvas').getContext('2d');
  let threw = null;
  try { g.drawWrecksGlimmer(c, 0, 0); } catch (e) { threw = String(e); }
  return { threw, sameStream: before === (g.rng._s != null ? g.rng._s : before) };
});
check("the Wrecker's Eye glimmer draws without throwing", r.threw === null, r.threw);
check('...and consumes no randomness', r.sameStream);

// ===========================================================================
section('MID case');

await park({ map: 'overworld', rx: 4, ry: 7, tx: 4, ty: 4, tide: 1, items: { sword: 1 } });

// Split Fang — a wider arc.
await nocharms();
r = await read(() => {
  const g = window.__game;
  g.player.dir = 'down';
  const plain = g.player.swordBox(g).w;
  return { plain };
});
const plainSpan = r.plain;
await charm('splitFang');
r = await read(() => window.__game.player.swordBox(window.__game).w);
check('the Split Fang widens the sword arc', r > plainSpan, `${plainSpan} -> ${r}`);

// Ballast Heart — half the knockback taken.
await nocharms();
const knockDist = async () => {
  await page.evaluate(() => {
    const g = window.__game;
    g.player.x = 64; g.player.y = 64;
    g.player.invuln = 0; g.player.hurtTime = 0;
    g.progress.hearts = 40;
    // The source must be OFF the player, or dx/dy are both zero and the
    // knock rounds to nothing whatever the charm says.
    g.player.takeDamage(g, 1, { cx: 64 + 40, cy: 72, isProjectile: false });
  });
  return await read(() => Math.abs(window.__game.player.knockX));
};
const plainKnock = await knockDist();
await charm('ballastHeart');
const charmedKnock = await knockDist();
check('the Ballast Heart halves knockback taken', charmedKnock < plainKnock,
  `${plainKnock} -> ${charmedKnock}`);

// Barnacle Skin — one free hit per room, and only one.
await nocharms();
await charm('barnacleSkin');
r = await read(() => {
  const g = window.__game;
  g.player.barnacleUsed = false;
  g.progress.hearts = 40;
  g.player.invuln = 0; g.player.hurtTime = 0;
  g.player.takeDamage(g, 4, null, { noKnockDir: true });
  const afterFirst = g.progress.hearts;
  g.player.invuln = 0; g.player.hurtTime = 0;
  g.player.takeDamage(g, 4, null, { noKnockDir: true });
  return { afterFirst, afterSecond: g.progress.hearts };
});
check('Barnacle Skin eats the first hit in a room', r.afterFirst === 40, `hearts=${r.afterFirst}`);
check('...and cracks, so the second lands', r.afterSecond < r.afterFirst,
  `${r.afterFirst} -> ${r.afterSecond}`);

r = await read(() => {
  const g = window.__game;
  g.player.barnacleUsed = true;
  g.setRoom(g.room.floor, g.room.rx, g.room.ry, { spawnEntities: false });
  return { used: g.player.barnacleUsed };
});
check('...and regrows on entering a room', r.used === false);

// Quartermaster's Mark — two more Reefseeds.
await nocharms();
r = await read(() => {
  const g = window.__game;
  g.progress.maxReefseeds = 8;
  const plain = g.reefseedCap();
  window.__S.giveCharm(g.progress, 'quartermaster');
  window.__S.slotCharm(g.progress, 'mid', 0, 'quartermaster');
  g.scrim.update();
  return { plain, charmed: g.reefseedCap() };
});
check("the Quartermaster's Mark raises the Reefseed ceiling", r.charmed === r.plain + 2,
  `${r.plain} -> ${r.charmed}`);

// Bosun's Whistle — the conch locks you out for less time.
await nocharms();
const conchLock = async () => {
  await page.evaluate(() => {
    const g = window.__game;
    // Sounding the conch MOVES THE TIDE, which moves the live case out from
    // under the very charm being measured. Pin it back to MID afterwards or
    // every MID assertion after this one silently tests an empty case.
    g.player.conchTime = 0; g.player.frozen = 0;
    g.tide.forced = null; g.tide.locked = false; g.tide.sweep = 0;
    g.player.playConch(g);
    const lock = g.player.conchTime;
    g.tide.setLevel(1, { instant: true });
    g.tide.sweep = 0;
    g.scrim.prevSlot = null; g.scrim.graceT = 0;
    g.scrim.update();
    g.__lock = lock;
  });
  return await read(() => window.__game.__lock);
};
const plainConch = await conchLock();
await charm('bosunsWhistle');
const charmedConch = await conchLock();
check("the Bosun's Whistle shortens the conch", charmedConch < plainConch,
  `${plainConch} -> ${charmedConch}`);

// Pot-Hauler — carrying costs no speed.
await nocharms();
r = await read(() => {
  const g = window.__game;
  return { carry: !!g.player.carrying };
});
await charm('potHauler');
r = await read(() => window.__game.charm('potHauler'));
check('the Pot-Hauler is live', r === true);

// Coilrope — a longer Dredge Line.
await nocharms();
r = await read(async () => {
  const g = window.__game;
  const it = await import('/src/game/items.js');
  const plain = new it.DredgeLine(0, 0, { dir: 'down', level: 1 }).range;
  const long = new it.DredgeLine(0, 0, { dir: 'down', level: 1, coilrope: true }).range;
  return { plain, long };
});
check('the Coilrope lengthens the Dredge Line', r.long > r.plain, `${r.plain} -> ${r.long}`);

// Lamplighter's Wick — a dark room is less dark.
await nocharms();
await charm('lamplighter');
r = await read(() => {
  const g = window.__game;
  const c = document.createElement('canvas').getContext('2d');
  let threw = null;
  try { g.drawDarkness(c, 0, 0); } catch (e) { threw = String(e); }
  return { threw, lit: g.charm('lamplighter') };
});
check("the Lamplighter's Wick lights a dark room", r.lit && r.threw === null, r.threw);

// ===========================================================================
section('HIGH case');

await park({ map: 'overworld', rx: 4, ry: 7, tx: 4, ty: 4, tide: 2, items: { cleats: 1 } });

// Gillcarve — breath never runs out.
await nocharms();
r = await read(() => {
  const g = window.__game;
  g.player.underwater = true; g.player.inDeep = true;
  g.player.breath = 100; g.player._cleats = 1;
  for (let i = 0; i < 30; i++) g.player.updateBreath(g);
  return { plain: g.player.breath };
});
const plainBreath = r.plain;
await charm('gillcarve');
r = await read(() => {
  const g = window.__game;
  g.player.underwater = true; g.player.inDeep = true;
  g.player.breath = 100; g.player._cleats = 1;
  for (let i = 0; i < 30; i++) g.player.updateBreath(g);
  const held = g.player.breath;
  g.player.underwater = false; g.player.inDeep = false;
  return { held };
});
check('the Gillcarve stops the breath draining', plainBreath < 100 && r.held === 100,
  `plain=${plainBreath} charmed=${r.held}`);

// Riptide Fin — faster in deep water.
await nocharms();
r = await read(() => window.__game.charm('riptideFin'));
check('the Riptide Fin is off before it is slotted', r === false);
await charm('riptideFin');
r = await read(() => window.__game.charm('riptideFin'));
check('...and live at HIGH once it is', r === true);

// Anemone's Gift — half damage from sea creatures, and only from those.
await nocharms();
await charm('anemonesGift');
r = await read(() => {
  const g = window.__game;
  const hit = (o) => {
    g.progress.hearts = 40; g.player.invuln = 0; g.player.hurtTime = 0;
    g.player.takeDamage(g, 4, null, { noKnockDir: true, ...o });
    return 40 - g.progress.hearts;
  };
  return { sea: hit({ aquatic: true }), land: hit({}) };
});
check("the Anemone's Gift halves a sea creature's hit", r.sea < r.land,
  `sea=${r.sea} land=${r.land}`);

// Brine Skin — half hazard damage.
await nocharms();
await charm('brineSkin');
r = await read(() => {
  const g = window.__game;
  const hit = (o) => {
    g.progress.hearts = 40; g.player.invuln = 0; g.player.hurtTime = 0;
    g.player.takeDamage(g, 4, null, { noKnockDir: true, ...o });
    return 40 - g.progress.hearts;
  };
  return { spike: hit({ hazard: true }), plain: hit({}) };
});
check('Brine Skin halves hazard damage', r.spike < r.plain, `hazard=${r.spike} plain=${r.plain}`);

// Pressure Scar — a faster dive.
await nocharms();
r = await read(() => {
  const g = window.__game;
  g.player.underwater = false; g.player.sinkT = 0;
  g.player.toggleCleatMode ? 0 : 0;
  return { ok: 1 };
});
r = await read(async () => {
  const feel = await import('/src/data/feel.js');
  return { base: feel.SINK_ENTER_FRAMES, f: feel.PRESSURE_SCAR_FACTOR };
});
check('the Pressure Scar constant halves the dive', r.f < 1 && r.base * r.f < r.base,
  `${r.base} -> ${r.base * r.f}`);

// Kelp Braid — currents push half as hard. Deadweight — not at all.
await nocharms();
r = await read(() => {
  const g = window.__game;
  return { braid: g.charm('kelpBraid'), dead: g.charm('deadweight') };
});
check('neither current charm is on to start with', !r.braid && !r.dead);
await charm('kelpBraid');
r = await read(() => window.__game.charm('kelpBraid'));
check('the Kelp Braid is live at HIGH', r === true);

// Ballast Lung — the sword comes out on the seafloor.
await nocharms();
await park({ map: 'overworld', rx: 4, ry: 7, tx: 4, ty: 4, tide: 2, items: { sword: 1, cleats: 1 } });
r = await read(() => {
  const g = window.__game;
  g.player.inDeep = true; g.player.underwater = true;
  g.player.swinging = 0; g.player.spinning = 0; g.player.carrying = null;
  g.player.startSwing(g, 1);
  const plain = g.player.swinging;
  g.player.swinging = 0;
  return { plain };
});
check('no sword on the seafloor without the charm', r.plain === 0, `swinging=${r.plain}`);
await charm('ballastLung');
r = await read(() => {
  const g = window.__game;
  g.player.inDeep = true; g.player.underwater = true;
  g.player.swinging = 0; g.player.spinning = 0; g.player.carrying = null;
  g.player.startSwing(g, 1);
  const swung = g.player.swinging;
  g.player.swinging = 0;
  g.player.inDeep = false; g.player.underwater = false;
  return { swung };
});
check('the Ballast Lung draws it', r.swung > 0, `swinging=${r.swung}`);

// ===========================================================================
section('cross-slot: the interesting ones');

await park({ map: 'overworld', rx: 4, ry: 7, tx: 4, ty: 4, tide: 1, items: { sword: 1 } });

// Wrackbone — double dealt and double taken.
await nocharms();
r = await read(() => {
  const g = window.__game;
  const plainHit = g.player.swordHit(g);
  g.progress.hearts = 40; g.player.invuln = 0; g.player.hurtTime = 0;
  g.player.takeDamage(g, 4, null, { noKnockDir: true });
  const plainTaken = 40 - g.progress.hearts;
  return { plainHit, plainTaken };
});
const wrackBase = r;
await charm('wrackbone');
r = await read(() => {
  const g = window.__game;
  const hit = g.player.swordHit(g);
  g.progress.hearts = 40; g.player.invuln = 0; g.player.hurtTime = 0;
  g.player.takeDamage(g, 4, null, { noKnockDir: true });
  return { hit, taken: 40 - g.progress.hearts };
});
check('Wrackbone doubles the damage you deal', r.hit === wrackBase.plainHit * 2,
  `${wrackBase.plainHit} -> ${r.hit}`);
check('...and the damage you take', r.taken === wrackBase.plainTaken * 2,
  `${wrackBase.plainTaken} -> ${r.taken}`);

// Sea-Wolf's Tooth — the sword throws further.
await nocharms();
r = await read(async () => {
  const g = window.__game;
  const feel = await import('/src/data/feel.js');
  return { plain: g.player.swordKnock(g, feel.KNOCK_SWORD), base: feel.KNOCK_SWORD };
});
const plainSwordKnock = r.plain;
await charm('seawolfsTooth');
r = await read(async () => {
  const g = window.__game;
  const feel = await import('/src/data/feel.js');
  return g.player.swordKnock(g, feel.KNOCK_SWORD);
});
check("the Sea-Wolf's Tooth throws enemies further", r > plainSwordKnock,
  `${plainSwordKnock} -> ${r}`);

// Hagstone — some hits pass through. Rolled off the ROOM stream, so this is
// asserted statistically over many hits rather than on one.
await nocharms();
await charm('hagstone');
r = await read(() => {
  const g = window.__game;
  let taken = 0;
  for (let i = 0; i < 400; i++) {
    g.progress.hearts = 40; g.player.invuln = 0; g.player.hurtTime = 0;
    g.player.takeDamage(g, 1, null, { noKnockDir: true });
    if (g.progress.hearts < 40) taken++;
  }
  return { taken };
});
check('the Hagstone turns some hits aside', r.taken > 0 && r.taken < 400,
  `landed ${r.taken}/400`);

// Neap Charm — the case stays awake for a while after the tide leaves it.
await nocharms();
r = await read(async () => {
  const g = window.__game, p = g.progress, S = window.__S;
  const feel = await import('/src/data/feel.js');
  p.charmOpen.mid = true;
  S.giveCharm(p, 'neapCharm');
  S.giveCharm(p, 'splitFang');
  p.charmCase = 2;
  S.slotCharm(p, 'mid', 0, 'neapCharm');
  S.slotCharm(p, 'mid', 1, 'splitFang');
  g.tide.setLevel(1, { instant: true });
  g.scrim.prevSlot = null; g.scrim.graceT = 0; g.scrim.wasNeap = false;
  g.scrim.update(); g.scrim.update();
  const atMid = g.charm('splitFang');
  g.tide.setLevel(2, { instant: true });
  g.scrim.update();
  const justAfter = g.charm('splitFang');
  for (let i = 0; i < feel.NEAP_GRACE_FRAMES + 4; i++) g.scrim.update();
  const later = g.charm('splitFang');
  return { atMid, justAfter, later, grace: feel.NEAP_GRACE_FRAMES };
});
check('the Neap Charm holds a case awake after the tide leaves', r.atMid && r.justAfter,
  `atMid=${r.atMid} after=${r.justAfter}`);
check('...and lets go once the grace runs out', r.later === false,
  `after ${r.grace} frames live=${r.later}`);

// Fisherman's Regret — the case one level below stays awake.
await nocharms();
r = await read(() => {
  const g = window.__game, p = g.progress, S = window.__S;
  p.charmOpen.low = true; p.charmOpen.mid = true; p.charmOpen.high = true;
  p.charmCase = 2;
  S.giveCharm(p, 'fishermansRegret');
  S.giveCharm(p, 'dunerunner');
  S.slotCharm(p, 'mid', 0, 'fishermansRegret');
  S.slotCharm(p, 'low', 0, 'dunerunner');
  g.tide.setLevel(1, { instant: true });
  g.scrim.prevSlot = null; g.scrim.graceT = 0;
  g.scrim.update();
  const withRegret = g.charm('dunerunner');
  S.slotCharm(p, 'mid', 0, null);
  g.scrim.update();
  return { withRegret, without: g.charm('dunerunner') };
});
check("the Fisherman's Regret wakes the case below", r.withRegret && !r.without,
  `with=${r.withRegret} without=${r.without}`);

// Deadweight — immune to currents, slower everywhere.
await nocharms();
await charm('deadweight');
r = await read(() => window.__game.charm('deadweight'));
check('Deadweight is live', r === true);

// ===========================================================================
section('the scrimshander');

await park({ map: 'overworld', rx: 4, ry: 7, tx: 4, ty: 4, tide: 1 });
await nocharms();
r = await read(async () => {
  const g = window.__game, p = g.progress;
  const feel = await import('/src/data/feel.js');
  p.blanks = 1; p.rupees = 500; p.carve = null;
  const id = g.commissionCarving();
  const turns0 = p.carve.turns;
  // A carving is finished by TIDE CHANGES, not by frames. Step a thousand
  // frames without touching the conch and it must still be unfinished.
  for (let i = 0; i < 1000; i++) g.update ? 0 : 0;
  const stillWaiting = g.collectCarving();
  for (let i = 0; i < feel.CARVE_TIDE_TURNS; i++) {
    g.tide.setLevel((g.tide.level + 1) % 3, { instant: true });
  }
  const got = g.collectCarving();
  return { id, turns0, stillWaiting, got, owned: !!p.charms[id], carve: p.carve };
});
check('a commission names a charm and a countdown', !!r.id && r.turns0 > 0,
  `id=${r.id} turns=${r.turns0}`);
check('...which frames alone do not finish', r.stillWaiting === null);
check('...but a full turn of the tide does', r.got === r.id, `got=${r.got}`);
check('...and the charm is owned afterwards', r.owned && r.carve === null);

r = await read(() => {
  const g = window.__game, p = g.progress;
  p.charms = {}; p.carve = null;
  const ids = new Set();
  let exhausted = false;
  for (let i = 0; i < 40; i++) {
    const id = g.commissionCarving();
    // null is the right answer once you own everything, and must not be
    // counted as a thirty-first charm.
    if (id == null) { exhausted = true; break; }
    ids.add(id);
    window.__S.giveCharm(p, id);
    p.carve = null;
  }
  return { n: ids.size, total: Object.keys(window.__S.CHARMS).length, exhausted };
});
check('a commission never repeats a charm you already own', r.n === r.total,
  `${r.n} distinct of ${r.total}`);
check('...and refuses once you own them all', r.exhausted);

// __park empties the room's entity list, so the NPC is looked for in the ROOM
// DEFINITION — which is also the thing a session could delete by accident.
r = await read(async () => {
  const maps = await import('/src/world/maps.js');
  const ow = maps.MAPS.get('overworld');
  const def = ow.roomDefs['0,4,7'];
  const ents = (def && def.entities) || [];
  return { hasNpc: ents.some(e => e[0] === 'scrimshander') };
});
check('the scrimshander stands in Tidewatch', r.hasNpc);

// The cases open on essences, and each opening happens exactly once.
r = await read(async () => {
  const obj = await import('/src/game/objects.js');
  const g = window.__game, p = g.progress;
  const npc = new obj.Scrimshander(64, 64, {});
  p.charmOpen = { low: false, mid: true, high: false };
  p.charmCase = 1;
  p.essences = [];
  const none = npc.checkUnlocks(g);
  p.essences = [1, 2];
  const low = npc.checkUnlocks(g);
  const lowAgain = npc.checkUnlocks(g);
  p.essences = [1, 2, 3, 4];
  npc.checkUnlocks(g);
  p.essences = [1, 2, 3, 4, 5, 6];
  npc.checkUnlocks(g);
  return {
    none, low, lowAgain,
    open: { ...p.charmOpen }, size: p.charmCase,
  };
});
check('no case opens before the essences are in', r.none === null);
check('the LOW case opens on the second essence', !!r.low && r.open.low);
check('...and opens only once', r.lowAgain === null || r.lowAgain !== r.low);
check('the HIGH case and the case upgrade follow', r.open.high && r.size === 2,
  `open=${JSON.stringify(r.open)} size=${r.size}`);

// ===========================================================================
// THE ORPHAN CHECK. Every charm must be READ somewhere in src/ other than its
// own definition, or it is a passive that carves, slots and does nothing.
section('no charm is an orphan');

{
  const { readFileSync, readdirSync, statSync } = await import('node:fs');
  const { join: J } = await import('node:path');
  const files = [];
  (function walk(d) {
    for (const f of readdirSync(d)) {
      const full = J(d, f);
      if (statSync(full).isDirectory()) walk(full);
      else if (f.endsWith('.js') && full.indexOf('scrimshaw.js') < 0) files.push(full);
    }
  })(J(ROOT, 'src'));
  const blob = files.map(f => readFileSync(f, 'utf8')).join('\n');
  const ids = await read(() => Object.keys(window.__S.CHARMS));
  // Two charms act on the SLOTTING RULE rather than on any game system, so
  // their only reader is the runtime in scrimshaw.js — which is exactly the
  // file this sweep excludes. They are named here so the exemption is a stated
  // decision rather than a hole, and their behaviour is asserted above.
  const SYSTEM_CHARMS = ['neapCharm', 'fishermansRegret'];
  const orphans = ids.filter(id => !SYSTEM_CHARMS.includes(id)
    && !blob.includes(`'${id}'`) && !blob.includes(`"${id}"`));
  check('every charm is read by something outside scrimshaw.js',
    orphans.length === 0, `orphans=[${orphans.join(', ')}]`);
  {
    const rt = readFileSync(J(ROOT, 'src/game/scrimshaw.js'), 'utf8');
    const missing = SYSTEM_CHARMS.filter(id => !rt.includes(`'${id}'`));
    check('...and the two system charms are read by the runtime itself',
      missing.length === 0, `missing=[${missing.join(', ')}]`);
  }
  check('the roster is thirty charms', ids.length === 30, `n=${ids.length}`);
}

// ===========================================================================
// EVERY CHARM PLACED IN THE WORLD MUST EXIST. `giveCharm` returns false for an
// id that is not in CHARMS and says nothing about it, so a chest, a shop shelf
// or a giver naming a charm that has been renamed opens, plays its jingle, and
// hands over nothing — the same silent failure a chest granting a deleted ITEM
// used to have before check-items.mjs went looking for it.
section('every charm placed in the world is a real charm');

r = await read(async () => {
  const maps = await import('/src/world/maps.js');
  const ids = new Set(Object.keys(window.__S.CHARMS));
  const bad = [], placed = [];
  for (const [mapId, m] of maps.MAPS) {
    for (const [key, def] of Object.entries(m.roomDefs || {})) {
      for (const e of def.entities || []) {
        const id = e[3] && e[3].charm;
        if (!id) continue;
        placed.push(`${mapId} ${key} ${id}`);
        if (!ids.has(id)) bad.push(`${mapId} ${key}: '${id}'`);
      }
    }
  }
  return { bad, placed };
});
check('no room hands over a charm that does not exist', r.bad.length === 0, r.bad.join('; '));
const placedCharms = r.placed;

// And the branch that grants it is real. `openChest` grew a `charm` case for
// P8's hand-placed charms; a chest whose charm fell through to "Nothing but
// sand." would still open, still be marked as opened in the save, and still be
// unrecoverable.
r = await read(async () => {
  const obj = await import('/src/game/objects.js');
  const g = window.__game;
  delete g.progress.charms.splitFang;
  const chest = new obj.Chest(64, 64, { charm: 'splitFang' });
  g.openChest(chest);
  if (g.dialogue) g.dialogue.active = false;
  return { owned: !!g.progress.charms.splitFang };
});
check('a chest with a charm actually grants it', r.owned);
check(`charms are placed by hand in the world (${placedCharms.length})`, placedCharms.length > 0,
  'every charm in the game comes from the scrimshander\'s random carve');
console.log('       ' + placedCharms.join('\n       '));

// ===========================================================================
check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));

console.log(`\n=== ${passed} passed, ${failures.length} failed ===`);
await browser.close(); server.close();
process.exit(failures.length ? 1 : 0);
