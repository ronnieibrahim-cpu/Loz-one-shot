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

const main = async () => {
  console.log('\n--- determinism ---');
  await checkNoMathRandom();

  const { chromium } = await loadPlaywright();
  // Random high port: concurrent runs must not fight over a fixed one.
  const PORT = Number(arg('port', 0)) || (20000 + Math.floor(Math.random() * 20000));
  const server = await serve(PORT);
  const browser = await chromium.launch({ headless: !HEADED });
  const page = await browser.newPage({ viewport: { width: 800, height: 720 } });

  const logs = [];
  page.on('console', m => logs.push(m.type() + ': ' + m.text()));
  page.on('pageerror', e => logs.push('PAGEERROR: ' + (e.stack || e.message)));

  await mkdir(SHOT_DIR, { recursive: true });

  const G = (fn, ...args) => page.evaluate(fn, ...args);
  const frames = (n) => page.evaluate((k) => new Promise(res => {
    const start = window.__game.frame;
    const tick = () => (window.__game.frame - start >= k) ? res(window.__game.frame) : requestAnimationFrame(tick);
    tick();
  }), n);
  const shot = async (name) => {
    if (!WANT_SHOTS) return;
    const el = await page.$('#screen');
    await el.screenshot({ path: join(SHOT_DIR, name + '.png') });
  };
  const hold = async (key, n) => {
    await page.keyboard.down(key);
    await frames(n);
    await page.keyboard.up(key);
    await frames(2);
  };
  const tap = async (key) => { await page.keyboard.press(key); await frames(4); };

  await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__game, { timeout: 15000 });

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
    p.fx = 64 * 256; p.fy = 64 * 256;
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
  await G(() => { window.__game.progress.equipA = 'conch'; });
  const t0 = await G(() => window.__game.tide.level);
  await tap('x');                                   // A -> play the conch
  await frames(60);
  const t1 = await G(() => window.__game.tide.level);
  check('conch changed the tide', t1 !== t0, `${t0} -> ${t1}`);
  check('tide cycles within 0..2', t1 >= 0 && t1 <= 2, String(t1));
  await shot('05-tide-changed');
  // Cycle all the way round.
  const seen = new Set([t0, t1]);
  for (let i = 0; i < 4; i++) { await tap('x'); await frames(60); seen.add(await G(() => window.__game.tide.level)); }
  check('all three tide levels reachable', seen.size === 3, [...seen].join(','));

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

  console.log('\n--- room transitions ---');
  await G(() => {
    const g = window.__game;
    g.tide.setLevel(1, { instant: true });
    g.enterMap('overworld', 0, 4, 7, 72, 56, 'down', { instant: true });
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

  console.log('\n--- HUD, menu, save ---');
  await tap('Enter');
  check('menu opens', await G(() => window.__game.mode === 'menu'));
  await shot('11-menu-items');
  await tap('Tab'); await shot('12-menu-map');
  await tap('Tab'); await shot('13-menu-quest');
  await tap('Tab');
  check('reached the save tab', await G(() => window.__game.menu.tab === 3));
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
