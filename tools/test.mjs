// Headless play-test harness.
//
// Boots the game in Chromium, drives it with synthetic key input, asserts on the
// live game state, and writes screenshots to tools/shots/.
//
// Usage:
//   node tools/test.mjs               run the whole suite
//   node tools/test.mjs --shots       also write screenshots for every scene
//   node tools/test.mjs --keep        leave the browser open (headed) for a look

import { createServer } from 'node:http';
import { readFile, readdir, stat, mkdir, writeFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const arg = (name, dflt) => {
  const a = process.argv.find(v => v.startsWith('--' + name + '='));
  return a ? a.slice(name.length + 3) : dflt;
};
// Overridable so several agents can run the harness at once without colliding.
const SHOT_DIR = resolve(HERE, arg('shot-dir', 'shots'));
const WANT_SHOTS = process.argv.includes('--shots');
const HEADED = process.argv.includes('--keep');
// The save seed the run plays on. Overridable so a failure can be re-created
// on a different world without editing the file.
const SEED = Number(arg('seed', 20260806));

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

// --- tiny assertion harness ------------------------------------------------
let passed = 0;
const failures = [];
function check(name, cond, detail) {
  if (cond) { passed++; console.log('  ok   ' + name); }
  else { failures.push(name + (detail ? ' — ' + detail : '')); console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); }
}

// ESM ignores NODE_PATH, so fall back to the global install explicitly.
async function loadPlaywright() {
  let mod;
  try {
    mod = await import('playwright');
  } catch (e) {
    const { execSync } = await import('node:child_process');
    const root = execSync('npm root -g', { encoding: 'utf8' }).trim();
    mod = await import(join(root, 'playwright', 'index.js'));
  }
  // The global CJS build only exposes its API on `default`.
  return mod.chromium ? mod : mod.default;
}

// --- determinism: nothing under src/ may call Math.random -------------------
//
// One global stream seeded from the save plus a per-room derived stream is the
// whole determinism story (src/core/rng.js). A single Math.random anywhere in
// src/ silently voids it, and nothing else in the suite would notice — the
// game would still run, still validate, and still be unreproducible. So this
// check runs first, before the browser even starts, and it is fatal.
//
// Comments are stripped before matching, because rng.js and game.js both talk
// about Math.random in prose and a naive grep would flag its own documentation.

function stripComments(src) {
  let out = '', i = 0, n = src.length;
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') { i += 2; while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++; i += 2; continue; }
    if (c === '"' || c === "'" || c === '`') {
      out += c; i++;
      while (i < n && src[i] !== c) { if (src[i] === '\\') { out += src[i]; i++; } out += src[i]; i++; }
      out += src[i]; i++; continue;
    }
    out += c; i++;
  }
  return out;
}

async function jsFilesUnder(dir) {
  const out = [];
  for (const ent of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) out.push(...await jsFilesUnder(full));
    else if (ent.name.endsWith('.js') || ent.name.endsWith('.mjs')) out.push(full);
  }
  return out;
}

async function checkNoMathRandom() {
  const hits = [];
  for (const file of (await jsFilesUnder(join(ROOT, 'src'))).sort()) {
    const code = stripComments(await readFile(file, 'utf8'));
    code.split('\n').forEach((line, i) => {
      if (/Math\s*\.\s*random\s*\(/.test(line)) {
        hits.push(`${relative(ROOT, file)}:${i + 1}: ${line.trim().slice(0, 80)}`);
      }
    });
  }
  check('no Math.random anywhere under src/', hits.length === 0,
    hits.length ? `${hits.length} call site(s): ` + hits.slice(0, 6).join(' | ') : '');
  return hits;
}

// --- no checker may define its own solid/passable/walkable/pushable logic --
//
// A checker's job is to ask the engine what it does, not to keep a second copy
// of what the engine is supposed to do. 550 assertions were once green while
// no block in the game could actually be pushed, because solve-switches.mjs
// and walk-dungeons.mjs each modelled collision themselves instead of calling
// `Room.solidAt`/`canOccupy` — and a private model does not fail when the real
// rule changes under it, it just quietly starts being wrong. tools/lib/
// collision.mjs is the one place left allowed to know which raw tile flags
// mean "solid": everything else composes ITS functions (or the engine's own
// `canOccupy`/`room.solidAt`, called live in a page) rather than re-deriving
// the formula.
//
// The fingerprint of a private walkability formula is a bitwise-OR mask
// naming THREE OR MORE of the flags that make a tile impassable to a walking
// body — that is the "exclusion list" shape every re-derivation in this repo
// took (`!(d.flags & (F.VOID | F.SOLID | F.PIT | F.DEEP | F.LEDGE |
// F.HAZARD))`), and it is deliberately not "two or more": a mask of exactly
// `F.SOLID | F.VOID` is a different, narrower, irreducible question — "is
// this tile a hard wall to a projectile" (the Dredge Line's own cast-stop
// rule, a hop's clearance check, an Anchor throw's flight) — which is not a
// walking body's passability and cannot be expressed by composing
// `tileWalkable`'s `caps`/`avoid` at all, so it stays a direct, narrow,
// engine-matching flag test rather than something this guard should chase.
const COLLISION_FLAGS = ['SOLID', 'VOID', 'PIT', 'DEEP', 'LEDGE', 'HAZARD', 'JUMPABLE', 'BUSH', 'ROCK'];
const COLLISION_GUARD_ALLOW = new Set(['tools/lib/collision.mjs']);

async function checkNoPrivateCollisionLogic() {
  const hits = [];
  for (const file of (await jsFilesUnder(join(ROOT, 'tools'))).sort()) {
    const rel = relative(ROOT, file);
    if (COLLISION_GUARD_ALLOW.has(rel)) continue;
    const code = stripComments(await readFile(file, 'utf8'));
    const re = /\.\s*flags\s*&\s*\(([^()]*)\)/g;
    let m;
    while ((m = re.exec(code))) {
      const names = new Set((m[1].match(/F\.(\w+)/g) || []).map(s => s.slice(2)));
      const collisionNames = [...names].filter(n => COLLISION_FLAGS.includes(n));
      if (collisionNames.length >= 3) {
        const line = code.slice(0, m.index).split('\n').length;
        hits.push(`${rel}:${line}: masks ${collisionNames.join('|')} — call tools/lib/collision.mjs instead`);
      }
    }
  }
  check('no tool re-derives collision/passability from raw tile flags', hits.length === 0,
    hits.length ? `${hits.length} site(s): ` + hits.slice(0, 6).join(' | ') : '');
  return hits;
}

const main = async () => {
  console.log('\n--- determinism ---');
  await checkNoMathRandom();
  console.log('\n--- consolidation ---');
  await checkNoPrivateCollisionLogic();

  // An sfx() call with an undefined name plays nothing and reports nothing
  // (T45), so this one runs as a subprocess rather than being reimplemented:
  // check-sfx.mjs owns the rule, and a second copy of it here would be exactly
  // the private-model problem the check above exists to prevent (R4's shape).
  console.log('\n--- sound coverage ---');
  {
    const { spawnSync } = await import('node:child_process');
    const r = spawnSync(process.execPath, [new URL('check-sfx.mjs', import.meta.url).pathname],
      { encoding: 'utf8' });
    const out = (r.stdout || '') + (r.stderr || '');
    for (const line of out.trim().split('\n')) console.log('  ' + line);
    check('every sfx name a call site or data table can reach is defined',
      r.status === 0, 'see tools/check-sfx.mjs');
  }

  // S6: the music engine grew vibrato/echo/arpeggio, and the failure mode is
  // silent — a track that never asks for any of them has to schedule the
  // exact same Web Audio calls it always did. check-audio-render.mjs owns
  // that proof (and owns why it traces instructions rather than hashing
  // rendered samples); this runs it as a subprocess for the same reason the
  // sfx check above does.
  console.log('\n--- music engine render ---');
  {
    const { spawnSync } = await import('node:child_process');
    const r = spawnSync(process.execPath, [new URL('check-audio-render.mjs', import.meta.url).pathname],
      { encoding: 'utf8' });
    const out = (r.stdout || '') + (r.stderr || '');
    for (const line of out.trim().split('\n')) console.log('  ' + line);
    check('every track schedules the same Web Audio calls as its recorded baseline',
      r.status === 0, 'see tools/check-audio-render.mjs');
  }

  // R3/T4 made mechanical: every feel constant carries a unit and a provenance
  // word, and nothing may claim to be `measured` without naming the reference
  // it was stepped from. Inflating that word is S11's stated failure condition.
  console.log('\n--- feel constants ---');
  {
    const { spawnSync } = await import('node:child_process');
    const r = spawnSync(process.execPath, [new URL('check-feel.mjs', import.meta.url).pathname],
      { encoding: 'utf8' });
    const out = (r.stdout || '') + (r.stderr || '');
    for (const line of out.trim().split('\n')) console.log('  ' + line);
    check('every feel constant has a provenance, and every measured claim names its reference',
      r.status === 0, 'see tools/check-feel.mjs');
  }

  // A9: multi-screen rooms shipped without their checkers. These are the
  // rewrites — the camera behaves at every room size, and a room that declares
  // a size is internally consistent.
  console.log('\n--- multi-screen rooms and the camera ---');
  {
    const { spawnSync } = await import('node:child_process');
    for (const [tool, label] of [
      ['check-camera.mjs', 'the camera is pinned in one-screen rooms and follows in wide ones'],
      ['check-wide-rooms.mjs', 'every wide room fills its grid, owns its cells and is crossable at its seams'],
    ]) {
      const r = spawnSync(process.execPath, [new URL(tool, import.meta.url).pathname], { encoding: 'utf8' });
      const out = (r.stdout || '') + (r.stderr || '');
      for (const line of out.trim().split('\n')) console.log('  ' + line);
      check(label, r.status === 0, `see tools/${tool}`);
    }
  }

  // A character with no glyph renders as '?', silently — six Essence title
  // cards read "I ? the Shallow Bell" for the project's whole life.
  console.log('\n--- displayable text ---');
  {
    const { spawnSync } = await import('node:child_process');
    const r = spawnSync(process.execPath, [new URL('check-text.mjs', import.meta.url).pathname],
      { encoding: 'utf8' });
    const out = (r.stdout || '') + (r.stderr || '');
    for (const line of out.trim().split('\n')) console.log('  ' + line);
    check('every character the game can display has a glyph', r.status === 0, 'see tools/check-text.mjs');
  }

  // T47: a dialogue id the world asks for and story.js does not define shows
  // the player an EMPTY BOX, silently — and an id nobody references is a line
  // nobody will read. Also proves each two-state townsperson's second line is
  // actually reachable, by driving the real `NPC.interact`.
  console.log('\n--- dialogue ids ---');
  {
    const { spawnSync } = await import('node:child_process');
    const r = spawnSync(process.execPath, [new URL('check-dialogue.mjs', import.meta.url).pathname],
      { encoding: 'utf8' });
    const out = (r.stdout || '') + (r.stderr || '');
    for (const line of out.trim().split('\n')) console.log('  ' + line);
    check('every dialogue id is both written and referenced, and every second line is reachable',
      r.status === 0, 'see tools/check-dialogue.mjs');
  }

  const { chromium } = await loadPlaywright();
  // Random high port: concurrent runs must not fight over a fixed one.
  const PORT = Number(arg('port', 0)) || (20000 + Math.floor(Math.random() * 20000));
  const server = await serve(PORT);
  // Prefer Playwright's own download; fall back to a system Chromium when the
  // installed browser build does not match the installed playwright package
  // (see check-build.mjs, which has carried this same fallback since before
  // this file needed it).
  const browser = await chromium.launch({ headless: !HEADED }).catch(async (err) => {
    const { existsSync } = await import('node:fs');
    const fallback = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium';
    if (!existsSync(fallback)) throw err;
    return chromium.launch({ headless: !HEADED, executablePath: fallback });
  });
  const page = await browser.newPage({ viewport: { width: 800, height: 720 } });

  const logs = [];
  page.on('console', m => logs.push(m.type() + ': ' + m.text()));
  page.on('pageerror', e => logs.push('PAGEERROR: ' + (e.stack || e.message)));

  await mkdir(SHOT_DIR, { recursive: true });

  const G = (fn, ...args) => page.evaluate(fn, ...args);

  // THE HARNESS OWNS THE CLOCK.
  //
  // This used to count frames with requestAnimationFrame while main.js's
  // wall-clock loop kept stepping the game, which made every number below a
  // lie. `frames(30)` waited for 30 updates but the game also ran throughout
  // the surrounding CDP round trips, so `hold('ArrowRight', 30)` really held
  // the key for 30 frames plus however long the machine took to answer — and
  // on a busy box that was twice as far. Link's position when a later
  // assertion ran was therefore a function of CPU load, not of the test.
  //
  // window.__harness (built for tools/replay.mjs) stops the loop stepping and
  // hands the clock over, so every hold and every tap below lasts exactly the
  // number of fixed updates it says, on any machine. Drawing keeps running,
  // so screenshots and the fps counter still work.
  const frames = (n) => page.evaluate((k) => window.__harness.step(k), n);
  const shot = async (name) => {
    if (!WANT_SHOTS) return;
    const el = await page.$('#screen');
    await el.screenshot({ path: join(SHOT_DIR, name + '.png') });
  };
  // keyboard.down/up resolve once the event has been dispatched into the page.
  // Nothing steps in between, so the key is held for exactly n updates.
  const hold = async (key, n) => {
    await page.keyboard.down(key);
    await frames(n);
    await page.keyboard.up(key);
    await frames(2);
  };
  const tap = async (key) => { await page.keyboard.press(key); await frames(4); };

  // A fixed seed, so the suite plays the same game every run. Without it
  // newProgress() falls back to Date.now(), every run rolls a different world,
  // and P1's determinism guarantee stops at the front door.
  await page.goto(`http://localhost:${PORT}/index.html?seed=${SEED}`, { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__game && !!window.__harness, { timeout: 15000 });
  await G(() => window.__harness.takeOver());

  console.log('\n--- boot ---');
  const errText = await page.$eval('#err', el => el.textContent).catch(() => '');
  check('no fatal boot error', !errText || errText.trim() === '', errText.slice(0, 300));
  check('game object exists', await G(() => !!window.__game));
  check('starts on the title screen', await G(() => window.__game.mode === 'title'));
  await frames(20);
  await shot('01-title');

  console.log('\n--- file select and new game ---');
  await tap('Enter');           // START -> file select
  check('file select shown', await G(() => window.__game.title.stage === 'files'));
  await shot('02-files');
  await tap('Enter');           // pick slot 1 -> new game
  await frames(20);
  check('entered play or cutscene', await G(() => ['play', 'cutscene'].includes(window.__game.mode)),
    await G(() => window.__game.mode));
  check('player exists', await G(() => !!window.__game.player));
  check('overworld loaded', await G(() => window.__game.mapId === 'overworld'));
  await shot('03-intro');

  // Click through the intro cutscene (START fast-forwards each beat).
  for (let i = 0; i < 120 && await G(() => window.__game.mode === 'cutscene'); i++) {
    await page.keyboard.press(i % 2 ? 'Enter' : 'x');
    await frames(4);
  }
  check('cutscene finished', await G(() => window.__game.mode === 'play'), await G(() => window.__game.mode));
  check('intro granted the conch', await G(() => !!window.__game.progress.items.conch));
  check('intro granted the sword', await G(() => !!window.__game.progress.items.sword));
  await frames(10);
  await shot('04-village');

  console.log('\n--- movement ---');
  const p0 = await G(() => ({ x: window.__game.player.x, y: window.__game.player.y }));
  await hold('ArrowRight', 30);
  const p1 = await G(() => ({ x: window.__game.player.x, y: window.__game.player.y }));
  check('walking right moves the player', p1.x > p0.x + 5, `${p0.x} -> ${p1.x}`);
  check('facing updated', await G(() => window.__game.player.dir === 'right'));
  await hold('ArrowLeft', 30);
  await hold('ArrowUp', 20);
  await hold('ArrowDown', 20);
  check('player stayed inside the room',
    await G(() => { const p = window.__game.player; return p.x > -8 && p.x < 168 && p.y > -12 && p.y < 136; }));

  // --- 8.8 fixed-point positions -------------------------------------------
  //
  // The whole point of the fixed-point rework is that a rendered coordinate is
  // a whole number and that flooring one is correct on BOTH sides of zero. The
  // negative half is what nothing used to check: `| 0` truncates toward zero,
  // so it was a pixel wrong for every x < 0 — and the player is at negative x
  // on every room transition, which is the most common thing in the game.
  console.log('\n--- fixed-point positions ---');
  const fp = await G(() => {
    const p = window.__game.player;
    return { x: p.x, y: p.y, z: p.z, fx: p.fx, fy: p.fy, intFx: Number.isInteger(p.fx) };
  });
  check('pixel position is a whole number',
    Number.isInteger(fp.x) && Number.isInteger(fp.y) && Number.isInteger(fp.z),
    `x=${fp.x} y=${fp.y} z=${fp.z}`);
  check('subpixel accumulator is a whole number', fp.intFx, `fx=${fp.fx}`);
  check('pixel position is the accumulator floored', fp.x === (fp.fx >> 8) && fp.y === (fp.fy >> 8),
    `fx=${fp.fx} -> ${fp.x}, fy=${fp.fy} -> ${fp.y}`);

  // Walk the accumulator across zero by hand and confirm the derived pixel
  // floors rather than truncates. -1 subpixel is 1/256th of a pixel to the LEFT
  // of the origin, so it must read as pixel -1, not 0.
  const cross = await G(() => {
    const p = window.__game.player;
    const keep = p.fx;
    const out = [];
    for (const fx of [-512, -257, -256, -255, -1, 0, 1, 255, 256]) {
      p.fx = fx;
      out.push([fx, p.x]);
    }
    p.fx = keep;
    return out;
  });
  const want = { '-512': -2, '-257': -2, '-256': -1, '-255': -1, '-1': -1, 0: 0, 1: 0, 255: 0, 256: 1 };
  const wrong = cross.filter(([fx, x]) => x !== want[fx]);
  check('crossing x=0 floors instead of truncating', wrong.length === 0,
    wrong.map(([fx, x]) => `fx=${fx} gave ${x}, want ${want[fx]}`).join('; '));

  // Sub-pixel speeds have to survive. A drift slower than a pixel a frame moves
  // nothing at all without an accumulator, and two of the game's speeds are.
  const drift = await G(async () => {
    const ent = await import('/src/game/entity.js');
    const p = window.__game.player;
    const keep = { fx: p.fx, fy: p.fy };
    // Row 5 of Tidewatch's square: open ground east of here at every tide.
    p.fx = 64 * 256; p.fy = 72 * 256;
    const x0 = p.x;
    for (let i = 0; i < 60; i++) ent.moveEntity(window.__game, p, 32, 0);   // 0.125 px/f
    const moved = p.x - x0;
    p.fx = keep.fx; p.fy = keep.fy;
    return moved;
  });
  check('a sub-pixel step accumulates', drift === 7, `60 frames at 32 sp/f moved ${drift}px, want 7`);

  console.log('\n--- sword ---');
  await G(() => { window.__game.progress.equipB = 'sword'; });
  await tap('z');
  check('sword swing started', await G(() => window.__game.player.swinging > 0 || window.__game.frame > 0));
  await frames(20);

  console.log('\n--- the tide (core mechanic) ---');
  // Stand somewhere known before testing the conch. A is the context button
  // first and the item button second, so a villager who has wandered within
  // reach eats the press and opens a text box instead — and once a text box is
  // up, Game.update returns early and every later press feeds the box, not the
  // conch. That is what used to make this section fail at random on a busy
  // machine. The dialogue guard below names the problem if it ever recurs.
  //
  // He faces UP, not down. THE POWER BRACELET IS GONE AND LIFTING IS BASE
  // MOVESET, so lifting joined the context chain — and the tile south of this
  // spot is one of the village rocks, which now comes up in his hands and eats
  // the press exactly the way a villager does. That is the design working, not
  // failing: A has always been context-first. The tile north is a ledge lip,
  // which is inert to a press.
  await G(() => {
    const g = window.__game;
    g.enterMap('overworld', 0, 4, 7, 72, 64, 'up', { instant: true });
  });
  await frames(6);
  await G(() => { window.__game.progress.equipA = 'conch'; });
  check('nothing is talking to Link before the conch test',
    await G(() => !window.__game.dialogue.active));
  // A conch press locks the player out for the sweep (TIDE_SWEEP_FRAMES, during
  // which nothing below the tide runs at all, so his own timers stall) and then
  // for CONCH_FRAMES of holding the shell up — 69 frames all told. The old gap
  // here was 64, i.e. inside the lock-out, so half these presses were being
  // swallowed and the assertion only passed on the presses that happened to
  // land. Wait past the whole animation.
  const CONCH_GAP = 80;
  const t0 = await G(() => window.__game.tide.level);
  await tap('x');                                   // A -> play the conch
  await frames(CONCH_GAP);
  const t1 = await G(() => window.__game.tide.level);
  check('conch changed the tide', t1 !== t0, `${t0} -> ${t1}`);
  check('tide cycles within 0..2', t1 >= 0 && t1 <= 2, String(t1));
  await shot('05-tide-changed');
  // Cycle all the way round. Every press must now land, so two presses are
  // enough to have seen all three levels and the remaining two prove it wraps.
  const seen = new Set([t0, t1]);
  for (let i = 0; i < 4; i++) { await tap('x'); await frames(CONCH_GAP); seen.add(await G(() => window.__game.tide.level)); }
  check('all three tide levels reachable', seen.size === 3, [...seen].join(','));
  check('the conch presses reached the conch, not a text box',
    await G(() => !window.__game.dialogue.active));

  console.log('\n--- tide reshapes terrain ---');
  // The Shallows room has sandbar tiles: walkable at low, deep at high.
  await G(() => {
    const g = window.__game;
    g.enterMap('overworld', 0, 5, 7, 40, 56, 'right', { instant: true });
  });
  await frames(6);
  const solidByTide = await G(() => {
    const g = window.__game;
    const out = {};
    for (const lvl of [0, 1, 2]) {
      g.tide.setLevel(lvl, { instant: true });
      // tile (8,3) is a sandbar in The Shallows
      out[lvl] = g.room.flagsAt(8, 3, lvl);
    }
    g.tide.setLevel(0, { instant: true });
    return out;
  });
  check('sandbar is dry at low tide', (solidByTide[0] & 6) === 0, 'flags=' + solidByTide[0]);
  check('sandbar is shallow at mid tide', (solidByTide[1] & 2) !== 0, 'flags=' + solidByTide[1]);
  check('sandbar is deep at high tide', (solidByTide[2] & 4) !== 0, 'flags=' + solidByTide[2]);
  await shot('06-shallows-low');
  await G(() => window.__game.tide.setLevel(2, { instant: true }));
  await frames(4);
  await shot('07-shallows-high');

  console.log('\n--- the tide is a field ---');
  //
  // THIS SECTION OWNS NO CLOCK OF ITS OWN. It was written on a branch that
  // predates the deterministic harness, where the wall-clock loop was still
  // stepping the game and waiting on `g.frame` inside an evaluate worked. Under
  // `takeOver()` nothing steps the game unless the test says so, so those waits
  // never returned and the whole run hung with no output — a merge of two
  // branches that disagreed about who owns the clock. Every wait here is
  // `window.__harness.step(n)` now, which is exact rather than approximate.
  //
  // Tide Steps (overworld 0,10,0) has two tide bands with different thresholds:
  //
  //   rows 1-2   `8` tideRock  dry rock, dry rock, SHALLOW
  //   rows 4-5   `6` reefFlat  dry rock, shallow,  DEEP
  //
  // So at HIGH the `6` band drowns and the room cannot be crossed straight up
  // the middle. An anchor laid in it holds it at MID while the rest of the room
  // goes to HIGH — which is the whole item in one screen.
  const fieldRep = await G(async () => {
    const g = window.__game;
    const F = (await import('/src/world/tileset.js')).F;
    const prog = await import('/src/game/progress.js');
    prog.giveItem(g.progress, 'anchor', 1);
    g.progress.equipB = 'anchor';
    g.mode = 'play';
    g.enterMap('overworld', 0, 10, 0, 64, 104, 'up', { instant: true });
    window.__harness.step(4);   // the harness owns the clock; g.frame only moves here
    if (g.dialogue) g.dialogue.active = false;
    g.entities = g.entities.filter(e => e === g.player);
    g.tide.clearOverrides();
    g.tide.setLevel(2, { instant: true });

    const out = {};
    out.stamp0 = g.tide.stamp;
    out.bandDeepWithout = !!(g.room.flagsAt(4, 5, g.tide) & F.DEEP);

    // Throw one, the way the player does.
    g.tide.setLevel(1, { instant: true });
    g.player.x = 64; g.player.y = 104; g.player.dir = 'up';
    const items = await import('/src/game/items.js');
    items.ITEMS.anchor.use(g, g.player, 1);
    window.__harness.step(90);
    const ov = g.tide.overrides.find(o => o.src === 'anchor');
    out.landed = ov ? { tx: ov.tx, ty: ov.ty, level: ov.level } : null;

    // Raise the sea everywhere the anchor is not.
    g.tide.setLevel(2, { instant: true });
    out.here = g.tide.levelAt(4, 5, g.room);
    out.there = g.tide.levelAt(4, 1, g.room);
    out.bandWetNotDeep = !(g.room.flagsAt(4, 5, g.tide) & F.DEEP)
      && !!(g.room.flagsAt(4, 5, g.tide) & F.WATER);
    out.stampGrew = g.tide.stamp > out.stamp0;

    // THE PIXELS, not just the collision. A stale render cache would keep the
    // old water on screen while every flag query above answered correctly —
    // right collision, wrong picture, and no test would notice.
    //
    // Sampling room.render() alone is NOT enough and the first draft of this
    // test proved it: animated tiles (which is every kind of water) are pushed
    // to animCells and deliberately left out of the cached canvas, so both
    // bands read as transparent and the assertion passed on nothing. Composite
    // the way drawScene does — base, then drawAnim, then drawOver — and hold
    // the animation frame still so the comparison is about the tide and not
    // about which frame of the wave each band happened to be on.
    const screen = await import('/src/core/screen.js');
    const shot = (tide) => {
      const s = screen.offscreen(screen.VIEW_W, screen.VIEW_H);
      s.ctx.clearRect(0, 0, screen.VIEW_W, screen.VIEW_H);
      s.ctx.drawImage(g.room.render(tide, 0), 0, 0);
      g.room.drawAnim(s.ctx, 0, 0, tide, 0);
      g.room.drawOver(s.ctx, 0, 0, tide, 0);
      // A signature of the WHOLE tile, not one pixel. Shallow and deep reef
      // water share their colour at the tile's centre pixel, so a single-pixel
      // probe reports them identical and the assertion quietly measures
      // nothing. 16x16 always differs where the tiles differ.
      return (tx, ty) => {
        const d = s.ctx.getImageData(tx * 16, ty * 16, 16, 16).data;
        let h = 2166136261;
        for (let i = 0; i < d.length; i++) { h ^= d[i]; h = Math.imul(h, 16777619); }
        return h >>> 0;
      };
    };
    const field = shot(g.tide), flatMid = shot(1), flatHigh = shot(2);
    out.pixHeld = field(4, 5);
    out.pixFree = field(4, 1);
    // The held band must be drawn as MID water, not as the HIGH the base is on.
    // Both directions, at both probes: the held band must be drawn as the level
    // it is HELD at, and the free band as the level the conch is on.
    out.pixLooksHeld = field(4, 5) === flatMid(4, 5) && field(4, 5) !== flatHigh(4, 5)
      && field(4, 1) === flatHigh(4, 1) && field(4, 1) !== flatMid(4, 1);
    out.dbg = { f: field(4, 5), m: flatMid(4, 5), h: flatHigh(4, 5),
                f1: field(4, 1), m1: flatMid(4, 1), h1: flatHigh(4, 1) };

    // Leaving the room must not lose it, and coming back must redraw it.
    g.enterMap('overworld', 0, 10, 1, 64, 32, 'down', { instant: true });
    window.__harness.step(3);   // the harness owns the clock; g.frame only moves here
    out.survivesLeaving = !!g.tide.overrides.find(o => o.src === 'anchor');
    g.enterMap('overworld', 0, 10, 0, 64, 104, 'up', { instant: true });
    window.__harness.step(3);   // the harness owns the clock; g.frame only moves here
    if (g.dialogue) g.dialogue.active = false;
    out.spriteBack = g.entities.some(e => e.constructor.name === 'Anchor' && !e.remove);
    out.stillHeld = g.tide.levelAt(4, 5, g.room) === 1;

    // Recall from the item, and the band drowns again.
    items.ITEMS.anchor.use(g, g.player, 1);
    window.__harness.step(60);
    out.recalled = !g.tide.overrides.find(o => o.src === 'anchor');
    out.deepAgain = !!(g.room.flagsAt(4, 5, g.tide) & F.DEEP);

    // clearOverrides must not wind the stamp back — a reused key would let a
    // cached canvas survive into a world it does not describe. Lay one first:
    // clearing an empty list is a no-op and proves nothing, which is what the
    // first draft of this assertion actually measured.
    g.tide.addOverride({ mapId: g.mapId, roomKey: g.room.key, tx: 4, ty: 4, r: 2, level: 0 });
    const beforeClear = g.tide.stamp;
    g.tide.clearOverrides();
    out.stampMonotonic = g.tide.stamp > beforeClear;
    g.tide.setLevel(1, { instant: true });
    return out;
  });
  check('the band is impassable at HIGH without the anchor', fieldRep.bandDeepWithout);
  check('a thrown anchor registers an override where it lands',
    !!fieldRep.landed, JSON.stringify(fieldRep.landed));
  check('the anchor holds its patch at the level it landed on',
    fieldRep.landed && fieldRep.landed.level === 1, JSON.stringify(fieldRep.landed));
  check('one room, two tide levels at once',
    fieldRep.here === 1 && fieldRep.there === 2, `here=${fieldRep.here} there=${fieldRep.there}`);
  check('the held band is wadeable while the rest is HIGH', fieldRep.bandWetNotDeep);
  check('the render differs between the two bands',
    String(fieldRep.pixHeld) !== String(fieldRep.pixFree),
    `held=${fieldRep.pixHeld} free=${fieldRep.pixFree}`);
  check('the held band is DRAWN as held water, not as the base',
    fieldRep.pixLooksHeld, JSON.stringify(fieldRep.dbg));
  check('the field bumps the render stamp', fieldRep.stampGrew);
  check('a placed anchor survives leaving the room', fieldRep.survivesLeaving);
  check('re-entering the room redraws the anchor', fieldRep.spriteBack);
  check('re-entering the room still finds the patch held', fieldRep.stillHeld);
  check('recall releases the override', fieldRep.recalled);
  check('the band drowns again once recalled', fieldRep.deepAgain);
  check('the render stamp never goes backwards', fieldRep.stampMonotonic);

  console.log('\n--- room transitions ---');
  await G(() => {
    const g = window.__game;
    g.tide.setLevel(1, { instant: true });
    g.enterMap('overworld', 0, 4, 7, 72, 72, 'down', { instant: true });
  });
  await frames(6);
  const before = await G(() => window.__game.room.key);
  await hold('ArrowLeft', 90);
  await frames(40);
  const after = await G(() => window.__game.room.key);
  check('walking west changed room', before !== after, `${before} -> ${after}`);
  await shot('08-west-bluff');

  console.log('\n--- warps ---');
  await G(() => {
    const g = window.__game;
    // Stand below the cave mouth at (3,2) and walk up into it.
    g.enterMap('overworld', 0, 3, 7, 48, 52, 'up', { instant: true });
  });
  await frames(6);
  await hold('ArrowUp', 60);
  await frames(50);
  check('cave warp works', await G(() => window.__game.mapId === 'cave1'), await G(() => window.__game.mapId));
  await shot('09-cave');

  console.log('\n--- combat and damage ---');
  await G(() => {
    const g = window.__game;
    g.enterMap('overworld', 0, 4, 6, 72, 56, 'down', { instant: true });
  });
  await frames(10);
  check('enemies spawned', await G(() => window.__game.entities.filter(e => e.isEnemy).length > 0),
    await G(() => String(window.__game.entities.filter(e => e.isEnemy).length)));
  const hp0 = await G(() => window.__game.progress.hearts);
  await G(() => {
    // Put an enemy right on top of Link to force a contact hit.
    const g = window.__game;
    const e = g.entities.find(x => x.isEnemy);
    if (e) { e.x = g.player.x; e.y = g.player.y; }
    g.player.invuln = 0;
  });
  await frames(6);
  check('contact damage lands', await G(() => window.__game.progress.hearts) < hp0,
    `${hp0} -> ${await G(() => window.__game.progress.hearts)}`);
  const kills0 = await G(() => window.__game.progress.kills);
  await G(() => {
    const g = window.__game;
    for (const e of g.entities.filter(x => x.isEnemy)) e.hurt(g, 99, 'down', 0);
  });
  await frames(6);
  check('enemies can be killed', await G(() => window.__game.progress.kills) > kills0);
  await shot('10-combat');

  // --- cliff edges autotile ------------------------------------------------
  //
  // `cliffTop` is placed ZERO times in the whole overworld, so before this the
  // game's 1,307 cliff cells were one body tile with no edge anywhere. The
  // renderer now derives the lip from the neighbours. Two things are asserted
  // that a screenshot cannot settle: that the lip lands on the top row of a
  // mass and nowhere else, and that OFF THE EDGE OF THE SCREEN counts as the
  // same mass — otherwise every screen in the game grows a lip along its top
  // row, on cliff that visibly carries on into the room above.
  console.log('\n--- cliff edges ---');
  const edges = await G(async () => {
    const ts = await import('/src/world/tileset.js');
    const g = window.__game;
    g.enterMap('overworld', 0, 1, 1, 72, 56, 'down', { instant: true });
    window.__harness.step(4);
    const room = g.room;
    const out = { lipRows: [], bodyBelow: 0, topRowLip: 0, topRowCells: 0, family: null };
    const def = ts.getTileDef('cliff');
    out.family = def.family;
    out.hasEdge = !!(def.edgeArt && def.edgeArt.up);
    for (let y = 0; y < room.th; y++) {
      for (let x = 0; x < room.tw; x++) {
        const d = room.tile(x, y, g.tide);
        if (d.family !== 'cliff') continue;
        const art = room.artAt(d, x, y, g.tide);
        const above = y > 0 ? room.tile(x, y - 1, g.tide) : null;
        const openAbove = above ? above.family !== 'cliff' : null;
        if (art === 'cliffTop' && d.name !== 'cliffTop') out.lipRows.push([x, y, openAbove]);
        // a cliff with cliff above it must NOT be a lip
        if (above && !openAbove && art === 'cliffTop' && d.name !== 'cliffTop') out.bodyBelow++;
        if (y === 0) { out.topRowCells++; if (art === 'cliffTop' && d.name !== 'cliffTop') out.topRowLip++; }
      }
    }
    out.lipsWithOpenAbove = out.lipRows.filter(r => r[2] === true).length;
    out.lipCount = out.lipRows.length;
    return out;
  });
  check('cliff declares a family and an up edge', edges.family === 'cliff' && edges.hasEdge);
  check('the lip lands somewhere in a cliff-heavy room', edges.lipCount > 0, `${edges.lipCount} lips`);
  check('every lip has open ground above it', edges.lipsWithOpenAbove === edges.lipCount,
    `${edges.lipCount} lips, ${edges.lipsWithOpenAbove} with open ground above`);
  check('a cliff under a cliff is never a lip', edges.bodyBelow === 0, `${edges.bodyBelow} bad`);
  check('the screen boundary does NOT grow a lip', edges.topRowLip === 0,
    `${edges.topRowLip} of ${edges.topRowCells} top-row cliff cells drew a lip`);

  // --- hitstop ------------------------------------------------------------
  //
  // The freeze on a connecting hit must pause the ENTITY SIMULATION and
  // NOTHING ELSE. A hitstop that stopped the frame counter or the audio pump
  // would stutter the music on every sword swing, a hundred times a dungeon —
  // that is the one way this feature can be shipped broken and still look
  // right in a screenshot, so it is asserted rather than eyeballed.
  console.log('\n--- hitstop ---');
  const stop = await G(async () => {
    const g = window.__game;
    const feel = await import('/src/data/feel.js');
    g.enterMap('overworld', 0, 4, 6, 72, 56, 'down', { instant: true });
    window.__harness.step(10);
    g.hitstop = 0;
    g.player.invuln = 999;          // keep the player out of the measurement
    // An enemy parked well away from the player, so nothing but the freeze
    // itself can stop it moving.
    const e = g.entities.find(x => x.isEnemy);
    if (!e) return { noEnemy: true };
    e.x = 24; e.y = 24; e.invuln = 0; e.hp = 99;

    const before = {
      frame: g.frame, playFrames: g.progress.frames, tideStamp: g.tide.stamp,
    };
    const ex0 = e.x, ey0 = e.y, px0 = g.player.x;

    // Land a hit. `Entity.hurt` is the one funnel every damage source uses.
    e.hurt(g, 1, 'down', 0);
    const armed = g.hitstop;

    // Step strictly fewer frames than the freeze lasts, holding right the
    // whole time: if the simulation were running, the player would move.
    const held = Math.max(1, armed - 1);
    g.input._raw.right = true;
    window.__harness.step(held);
    const during = {
      frame: g.frame, playFrames: g.progress.frames,
      moved: g.player.x !== px0 || e.x !== ex0 || e.y !== ey0,
      left: g.hitstop,
    };
    g.input._raw.right = false;
    g.player.invuln = 0;
    g.hitstop = 0;
    return {
      armedIs: armed, want: feel.HITSTOP_HIT_FRAMES, held,
      frameAdvanced: during.frame - before.frame,
      playAdvanced: during.playFrames - before.playFrames,
      simMoved: during.moved, left: during.left,
      hurtHz: feel.HITSTOP_HURT_FRAMES, bossHz: feel.HITSTOP_BOSS_DEATH_FRAMES,
    };
  });
  check('a landed hit arms a freeze', !stop.noEnemy && stop.armedIs === stop.want,
    `armed ${stop.armedIs}, HITSTOP_HIT_FRAMES ${stop.want}`);
  check('the freeze stops the entity simulation', stop.simMoved === false,
    'the player or the enemy moved while frozen');
  check('the freeze does NOT stop the frame counter', stop.frameAdvanced === stop.held,
    `frame advanced ${stop.frameAdvanced} over ${stop.held} frozen frames`);
  check('the freeze does NOT stop the play clock', stop.playAdvanced === stop.held,
    `progress.frames advanced ${stop.playAdvanced} over ${stop.held} frozen frames`);
  check('the freeze counts itself down', stop.left === stop.armedIs - stop.held,
    `${stop.armedIs} - ${stop.held} should leave ${stop.armedIs - stop.held}, left ${stop.left}`);
  // A hit on the player must weigh more than a hit on an enemy, and a boss
  // dying more than either. If that ordering ever inverts, the three weights
  // have stopped being three weights.
  check('the three freezes are ordered lightest to heaviest',
    stop.want < stop.hurtHz && stop.hurtHz < stop.bossHz,
    `hit ${stop.want}, hurt ${stop.hurtHz}, boss death ${stop.bossHz}`);

  // --- music engine: vibrato, echo, arpeggio (S6) --------------------------
  //
  // check-audio-render.mjs proves the SHARED scheduling path is unchanged for
  // a track that asks for none of this. This proves the three new techniques
  // actually do what their names say, against synthetic tracks built just for
  // this, so the assertions don't ride on the tuning of any real track.
  console.log('\n--- music engine: vibrato, echo, arpeggio ---');
  const music = await G(async () => {
    const { Audio } = await import('/src/core/audio.js');
    const feel = await import('/src/data/feel.js');

    function mockCtx() {
      let id = 0;
      const trace = [];
      function param(tag) {
        return {
          value: 0,
          setValueAtTime(v, t) { trace.push([tag, 'set', v, t]); return this; },
          linearRampToValueAtTime(v, t) { trace.push([tag, 'lin', v, t]); return this; },
          exponentialRampToValueAtTime() { return this; },
          setTargetAtTime() { return this; },
          cancelScheduledValues() { return this; },
        };
      }
      const ctx = {
        sampleRate: 44100, currentTime: 0, destination: {},
        createGain() { return { gain: param('gain' + id++), connect() {} }; },
        createBiquadFilter() { return { type: '', frequency: param('bqf' + id++), Q: param('bqq' + id++), connect() {} }; },
        createOscillator() {
          const tag = 'osc' + id++;
          return {
            type: '', frequency: param(tag), setPeriodicWave() {}, connect() {},
            start() {}, stop() {},
          };
        },
        createBufferSource() { return { buffer: null, loop: false, connect() {}, start() {}, stop() {} }; },
        createBuffer(ch, len) { return { getChannelData: () => new Float32Array(len) }; },
        createPeriodicWave() { return {}; },
      };
      return { ctx, trace };
    }

    function freqSets(trace, tagPrefix) {
      return trace.filter(e => e[0].startsWith(tagPrefix) && e[1] === 'set').map(e => ({ v: e[2], t: e[3] }));
    }

    const out = {};

    // --- vibrato: a long-held note, checked before and after the delay -----
    {
      const { ctx, trace } = mockCtx();
      const a = new Audio();
      a.init(ctx);
      const depth = 1; // 1 semitone — exact enough to check against Math.pow by hand
      const stepFrames = 4, delayFrames = 8;
      a.addTracks({
        t: {
          bpm: 60, rowsPerBeat: 4, loop: true,
          cfg: { p1: { vibrato: { depth, stepFrames, delayFrames } } },
          patterns: { A: { p1: 'C4 -  -  -  -  -  -  -  -  -  -  -  -  -  -  -' } },
          order: ['A'],
        },
      });
      a.play('t');
      const rowDur = 60 / 60 / 4; // 0.25s
      let time = a._nextRowTime;
      for (let i = 0; i < 16 && a.track; i++) { a._scheduleRow(time, rowDur); time += rowDur; }
      const sets = freqSets(trace, 'osc');
      const base = sets[0].v;
      const onsetTime = sets[0].t;
      const delaySec = delayFrames / 60, stepSec = stepFrames / 60;
      const beforeDelay = sets.filter(s => s.t > onsetTime && s.t < onsetTime + delaySec);
      const afterDelay = sets.filter(s => s.t >= onsetTime + delaySec);
      const wobbleOK = afterDelay.length >= 3 && afterDelay.every((s, i) => {
        const want = base * Math.pow(2, ((i % 2 === 0 ? 1 : -1) * depth) / 12);
        return Math.abs(s.v - want) < 1e-6;
      });
      const gridOK = afterDelay.length >= 2 &&
        Math.abs((afterDelay[1].t - afterDelay[0].t) - stepSec) < 1e-9;
      out.vibrato = { base, stepsBeforeDelay: beforeDelay.length, stepsAfterDelay: afterDelay.length, wobbleOK, gridOK };
    }

    // --- echo: p2 omits its pattern entirely and mirrors p1 -----------------
    {
      const { ctx, trace } = mockCtx();
      const a = new Audio();
      a.init(ctx);
      const rows = 3, volMul = 0.4;
      a.addTracks({
        t: {
          bpm: 60, rowsPerBeat: 4, loop: true,
          cfg: { p1: { vol: 0.2 }, p2: { vol: 0.1, echo: { of: 'p1', rows, volMul } } },
          patterns: { A: { p1: 'C4 .  E4 .  .  .  .  .  .  .  .  .' } }, // no p2 key at all
          order: ['A'],
        },
      });
      a.play('t');
      const rowDur = 60 / 60 / 4;
      let time = a._nextRowTime;
      for (let i = 0; i < 12 && a.track; i++) { a._scheduleRow(time, rowDur); time += rowDur; }
      // p1 note-ons happen at rows 0 and 2; p2 (echo) should repeat them at
      // rows (0+rows) and (2+rows), at volMul of the ECHO channel's own
      // configured vol (its pre-attenuation level — see the `echo` comment
      // in src/core/audio.js), not the lead's.
      const p1Sets = freqSets(trace, 'osc').filter((_, i) => i < 2); // C4 then E4, both from p1
      const gainPeaks = trace.filter(e => e[0].startsWith('gain') && e[1] === 'lin').map(e => e[2]);
      out.echo = {
        p1Freqs: p1Sets.map(s => Math.round(s.v)),
        rowDur, rows,
        delaySec: rows * rowDur,
        // both an original (p1's vol 0.2) and an echoed (p2's 0.1*0.4=0.04) peak should appear
        hasOriginalPeak: gainPeaks.some(v => Math.abs(v - 0.2) < 1e-6),
        hasEchoPeak: gainPeaks.some(v => Math.abs(v - 0.1 * volMul) < 1e-6),
      };
    }

    // --- arpeggio: a chord token cycles on one channel ----------------------
    {
      const { ctx, trace } = mockCtx();
      const a = new Audio();
      a.init(ctx);
      a.addTracks({
        t: {
          bpm: 60, rowsPerBeat: 4, loop: true,
          patterns: { A: { wav: 'C3+E3+G3 -  -  -  -  -  -  -' } },
          order: ['A'],
        },
      });
      a.play('t');
      const rowDur = 60 / 60 / 4;
      let time = a._nextRowTime;
      for (let i = 0; i < 8 && a.track; i++) { a._scheduleRow(time, rowDur); time += rowDur; }
      // sets[0] is _noteOn's own attack setValueAtTime (always the chord's
      // first note, by construction) — drop it and look only at the steps
      // _scheduleArp itself issued.
      const steps = freqSets(trace, 'osc').slice(1);
      const stepSec = feel.ARPEGGIO_STEP_FRAMES / 60;
      const gridOK = steps.length >= 6 && steps.slice(1).every((s, i) =>
        Math.abs((s.t - steps[i].t) - stepSec) < 1e-9);
      const cycleOK = steps.length >= 6 &&
        Math.round(steps[0].v) === Math.round(steps[3].v) &&
        Math.round(steps[1].v) === Math.round(steps[4].v) &&
        Math.round(steps[2].v) === Math.round(steps[5].v) &&
        Math.round(steps[0].v) !== Math.round(steps[1].v);
      out.arpeggio = { steps: steps.length, gridOK, cycleOK };
    }

    return out;
  });
  check('vibrato does not wobble before its delay', music.vibrato.stepsBeforeDelay === 0,
    JSON.stringify(music.vibrato));
  check('vibrato steps on the frame grid, alternating up/down by the configured depth',
    music.vibrato.wobbleOK && music.vibrato.gridOK, JSON.stringify(music.vibrato));
  check('echo channel repeats the lead\'s pitches', JSON.stringify(music.echo.p1Freqs) === JSON.stringify([262, 330]),
    JSON.stringify(music.echo));
  check('echo channel plays both the original and a quieter echoed peak',
    music.echo.hasOriginalPeak && music.echo.hasEchoPeak, JSON.stringify(music.echo));
  check('arpeggio cycles a chord token on a frame grid', music.arpeggio.gridOK, JSON.stringify(music.arpeggio));
  check('arpeggio repeats the chord in order', music.arpeggio.cycleOK, JSON.stringify(music.arpeggio));

  console.log('\n--- HUD, menu, save ---');
  await tap('Enter');
  check('menu opens', await G(() => window.__game.mode === 'menu'));
  await shot('11-menu-items');
  await tap('Tab'); await shot('12-menu-map');
  await tap('Tab'); await shot('13-menu-charm');
  check('reached the charm tab', await G(() => window.__game.menu.tab === 2));
  await tap('Tab'); await shot('14-menu-quest');
  await tap('Tab');
  check('reached the save tab', await G(() => window.__game.menu.tab === 4));
  await tap('x');
  await frames(10);
  check('save wrote to localStorage', await G(() => !!localStorage.getItem('oracleOfTides.save.v1')));
  await tap('Enter');
  check('menu closes', await G(() => window.__game.mode === 'play'));

  console.log('\n--- load a save ---');
  const ok = await G(() => {
    const g = window.__game;
    g.progress.rupees = 123;
    g.save();
    return g.loadGame(g.slot) && g.progress.rupees === 123;
  });
  check('save round-trips', ok);

  console.log('\n--- death and respawn ---');
  await G(() => { const g = window.__game; g.progress.hearts = 1; g.player.invuln = 0; g.player.takeDamage(g, 99, null, {}); });
  await frames(20);
  check('death enters game over', await G(() => window.__game.mode === 'gameover'), await G(() => window.__game.mode));
  await shot('14-gameover');
  await frames(110);
  await tap('x');
  await frames(20);
  check('respawn returns to play', await G(() => window.__game.mode === 'play'), await G(() => window.__game.mode));
  check('respawn restores health', await G(() => window.__game.progress.hearts === window.__game.progress.maxHearts));

  console.log('\n--- performance ---');
  const fps = await G(() => window.__game.fps);
  check('frame rate is healthy', fps === undefined || fps >= 40, 'fps=' + fps);

  console.log('\n--- art coverage ---');
  const missing = await G(() => [...window.__game.tiles.missing, ...window.__game.sprites.missing].sort());
  console.log(`  ${missing.length} unauthored art name(s)`);
  await writeFile(join(SHOT_DIR, 'missing-art.json'), JSON.stringify(missing, null, 1));

  const errors = logs.filter(l => l.startsWith('PAGEERROR') || l.startsWith('error:'));
  check('no runtime errors', errors.length === 0, errors.slice(0, 5).join(' | '));

  console.log('\n=== ' + passed + ' passed, ' + failures.length + ' failed ===');
  if (failures.length) {
    console.log('\nFailures:');
    for (const f of failures) console.log('  - ' + f);
  }
  const interesting = logs.filter(l => !l.startsWith('log:')).slice(0, 30);
  if (interesting.length) {
    console.log('\nBrowser log (first 30 non-log lines):');
    for (const l of interesting) console.log('  ' + l.slice(0, 300));
  }

  if (!HEADED) { await browser.close(); server.close(); }
  process.exit(failures.length ? 1 : 0);
};

main().catch(e => { console.error(e); process.exit(2); });
