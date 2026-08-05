// Switch-puzzle solver. For every room with a `switches` puzzle, push each
// block exactly ONCE with the engine's own game.tryPushBlock, park the player
// on whatever switch is still unpressed, and assert room._puzzleDone.
//
// One push per block is the whole point: a block moves exactly one tile, ever,
// so teleporting blocks onto switches passes even when the puzzle cannot be
// solved by playing it. That is what hid seven unearnable Small Keys.

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

const PORT = 20000 + Math.floor(Math.random() * 20000);
const server = await serve(PORT);
const { chromium } = await loadPlaywright();
const b = await chromium.launch({ headless: true });
const page = await b.newPage({ viewport: { width: 800, height: 720 } });
const errs = [];
page.on('pageerror', e => errs.push(e.message));
await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'load' });
await page.waitForFunction(() => !!window.__game, { timeout: 15000 });
const frames = n => page.evaluate(k => new Promise(res => { const s = window.__game.frame; const t = () => (window.__game.frame - s >= k) ? res() : requestAnimationFrame(t); t(); }), n);
await page.evaluate(async () => { const m = await import('/src/world/maps.js'); window.__MAPS = m.MAPS; });
await page.keyboard.press('Enter'); await frames(6);
await page.keyboard.press('Enter'); await frames(20);
for (let i = 0; i < 140 && await page.evaluate(() => window.__game.mode === 'cutscene'); i++) { await page.keyboard.press(i % 2 ? 'Enter' : 'x'); await frames(4); }

const rooms = await page.evaluate(() => {
  const out = [];
  for (const [mapId, m] of window.__MAPS) {
    for (const [key, def] of Object.entries(m.roomDefs || {})) {
      if (def.puzzle && def.puzzle.switches) out.push({ mapId, key, name: def.name });
    }
  }
  return out;
});
console.log(`${rooms.length} switch rooms`);

const bad = [];
for (const r of rooms) {
  const [f, rx, ry] = r.key.split(',').map(Number);
  const res = await page.evaluate(async (a) => {
    const g = window.__game;
    g.mode = 'play';
    g.progress.hearts = g.progress.maxHearts;
    g.enterMap(a.mapId, a.f, a.rx, a.ry, 80, 64, 'down', { instant: true });
    await new Promise(r2 => { const s = g.frame; const t = () => (g.frame - s >= 3 ? r2() : requestAnimationFrame(t)); t(); });
    if (g.dialogue) g.dialogue.active = false;
    g.mode = 'play';
    g.player.invuln = 1e5;
    const room = g.room;
    const obj = await import('/src/game/objects.js');
    const pz = room.def.puzzle;
    // Satisfy the puzzle's other clauses so this run measures the switches only.
    if (pz.tide != null) g.tide.setLevel(pz.tide);
    if (pz.enemies) for (const e of g.entities) if (e.isEnemy) e.dead = true;
    const blocks = g.entities.filter(e => e instanceof obj.PushBlock && !e.dead);
    const switches = g.entities.filter(e => e instanceof obj.FloorSwitch && !e.dead);
    // Push each block exactly ONCE, toward the switch it is seated beside, and
    // through the engine's own entry point — tryPushBlock takes the BLOCK's tile.
    for (const bl of blocks) {
      const bx = Math.floor(bl.cx / 16), by = Math.floor(bl.cy / 16);
      let dir = null;
      for (const sw of switches) {
        const sx = Math.floor(sw.cx / 16), sy = Math.floor(sw.cy / 16);
        if (sx === bx && Math.abs(sy - by) === 1) { dir = [0, Math.sign(sy - by)]; break; }
        if (sy === by && Math.abs(sx - bx) === 1) { dir = [Math.sign(sx - bx), 0]; break; }
      }
      if (!dir) continue;
      g.tryPushBlock(bx, by, dir[0], dir[1]);
      await new Promise(r2 => { const s = g.frame; const t = () => (g.frame - s >= 30 ? r2() : requestAnimationFrame(t)); t(); });
    }
    // Park the player on any switch still unpressed — with fewer blocks than
    // switches, standing on the last one is the intended solution.
    const open = g.entities.filter(e => e instanceof obj.FloorSwitch && !e.pressed);
    if (open.length) { g.player.x = open[0].x; g.player.y = open[0].y; }
    await new Promise(r2 => { const s = g.frame; const t = () => (g.frame - s >= 40 ? r2() : requestAnimationFrame(t)); t(); });
    g.checkPuzzle();
    return { done: !!room._puzzleDone, blocks: blocks.length, switches: switches.length,
             open: g.entities.filter(e => e instanceof obj.FloorSwitch && !e.pressed).length };
  }, { mapId: r.mapId, f, rx, ry });
  if (!res.done) bad.push(`${r.mapId} ${r.key} ${r.name}: ${res.blocks} blocks, ${res.switches} switches, ${res.open} still open`);
}

console.log(bad.length ? `FAIL ${bad.length} unsolvable:` : 'all switch puzzles solvable by pushing');
for (const x of bad) console.log('  ' + x);
if (errs.length) console.log('page errors:', errs.slice(0, 3));
await b.close(); server.close();
process.exit(bad.length ? 1 : 0);
