// check-sword — the sword hits where Oracle of Seasons' sword hits.
//
// "Swinging next to an enemy often results in a miss that doesn't match the
// source games" (the human, S149). It did not match because the blade was a
// box straight out in front, live only in the middle of the swing. On the
// cartridge the blade is live on EVERY frame of the swing and its hit area
// travels: out to Link's side, then the diagonal, then full reach, then drawn
// back (SWORD_ARC in src/data/feel.js, read from the oracles-disasm
// disassembly). An enemy's hit area is 12x12 on the middle of its sprite.
//
// Each case parks Link on open ground, stands one frozen octorok at a place
// relative to him, taps the sword once, runs the whole swing in the real
// engine and asks whether the octorok was hurt. The expected answers are
// what the cartridge's own arc gives for that place — including the misses:
// a foe on the side the swing ENDS on, or behind him, is not struck.
//
//   node tools/check-sword.mjs
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

async function swingAt(dir, dx, dy, splitFang) {
  await park({ map: 'overworld', rx: 4, ry: 7, tx: 4, ty: 4, tide: 1, dir, items: { sword: 1 } });
  return page.evaluate(async ([dir, dx, dy]) => {
    const g = window.__game, p = g.player;
    const ent = await import('/src/game/entity.js');
    const e = ent.spawnEntity(g, 'octorok', 0, 0, {});
    e.x = p.x + dx; e.y = p.y + dy;
    e.update = () => {};          // frozen: the question is the blade, not the AI
    g.entities.push(e);
    const hp0 = e.hp;
    p.dir = dir;
    window.__tap('a');
    window.__harness.step(1);
    window.__hold([]);
    window.__harness.step(24);
    return { hurt: e.hp < hp0 || e.dead, hp0, hp: e.hp };
  }, [dir, dx, dy]);
}

// [facing, enemy dx, enemy dy (px, sprite to sprite), expected, why]
const CASES = [
  ['down', 0, 16, true, 'in front'],
  ['down', 0, 32, true, 'two tiles in front: full reach'],
  ['down', -16, 0, true, 'beside him on the side the swing STARTS'],
  ['down', -16, 16, true, 'on the diagonal the swing passes through'],
  ['down', 16, 0, false, 'beside him on the side the swing ends on'],
  ['down', 0, -16, false, 'behind him'],
  ['up', 0, -16, true, 'in front'],
  ['up', 16, 0, true, 'beside him on the side the swing starts'],
  ['up', 16, -16, true, 'on the diagonal'],
  ['up', 0, 16, false, 'behind him'],
  ['right', 16, 0, true, 'in front'],
  ['right', 0, -16, true, 'above him, where the swing starts'],
  ['right', 16, -16, true, 'on the diagonal'],
  ['right', 0, 16, false, 'below him, where no part of the swing goes'],
  ['right', -16, 0, false, 'behind him'],
  ['left', -16, 0, true, 'in front'],
  ['left', 0, -16, true, 'above him, where the swing starts'],
  ['left', -16, -16, true, 'on the diagonal'],
  ['left', 16, 0, false, 'behind him'],
];

section('where one swing lands');
for (const [dir, dx, dy, want, why] of CASES) {
  const r = await swingAt(dir, dx, dy);
  check(`facing ${dir}, a foe ${why} (${dx},${dy}) is ${want ? 'hit' : 'missed'}`, r.hurt === want, JSON.stringify(r));
}

section('the blade is live from the first frame');
{
  await park({ map: 'overworld', rx: 4, ry: 7, tx: 4, ty: 4, tide: 1, dir: 'down', items: { sword: 1 } });
  const r = await page.evaluate(async () => {
    const g = window.__game, p = g.player;
    const ent = await import('/src/game/entity.js');
    const e = ent.spawnEntity(g, 'octorok', 0, 0, {});
    e.x = p.x - 16; e.y = p.y; e.update = () => {}; g.entities.push(e);
    const hp0 = e.hp;
    p.dir = 'down';
    window.__tap('a');
    window.__harness.step(1);   // the press is read after the player's update: the swing starts here
    window.__hold([]);
    window.__harness.step(1);   // ...and this is its first frame
    return { hurt: e.hp < hp0 };
  });
  check('a foe at Link\'s side is struck on the swing\'s very first frame', r.hurt, JSON.stringify(r));
}

console.log(`\n=== ${passed} passed, ${failures.length} failed ===`);
if (errs.length) { console.log(errs.slice(0, 5).join('\n')); }
await browser.close(); server.close();
process.exit(failures.length || errs.length ? 1 : 0);
