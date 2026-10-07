// Film Link's sword frame by frame — the swing each way, the poke, the spin —
// as a strip of native-resolution crops around him, for a person to compare
// with the cartridge. It asserts nothing (check-sword is the checker).
//
//   node tools/film-sword.mjs <out.png> [scale]
//
import { createServer } from 'node:http';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2] || 'sword.png';
const scale = +(process.argv[3] || 4);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const full = join(ROOT, normalize(p).replace(/^(\.\.[/\\])+/, ''));
  const s = await stat(full).catch(() => null);
  if (!s || !s.isFile()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[extname(full)] || 'application/octet-stream' });
  res.end(await readFile(full));
});
await new Promise(r => server.listen(0, r));
const browser = await chromium.launch().catch(() => chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }));
const page = await browser.newPage();
await page.goto(`http://localhost:${server.address().port}/index.html?seed=1`);
await page.waitForFunction(() => !!window.__game && !!window.__harness);
const data = await page.evaluate(async (scale) => {
  window.__harness.takeOver();
  const prog = await import('/src/game/progress.js');
  const feel = await import('/src/data/feel.js');
  const g = window.__game;
  const hold = (keys, tap, let_go) => {
    const set = new Set(keys); let fired = false, gone = false;
    g.input.down = k => set.has(k);
    g.input.pressed = k => (k === tap && !fired) ? (fired = true) : false;
    g.input.released = k => (k === let_go && !gone) ? (gone = true) : false;
    g.input.anyDir = () => ['up', 'down', 'left', 'right'].some(k => set.has(k));
    g.input.takeExtra = () => null;
  };
  const park = (dir, tx = 4, ty = 3) => {
    g.newGame(0, 'FILM'); g.mode = 'play';
    g.enterMap('overworld', 0, 4, 7, tx * 16, ty * 16, dir, { instant: true });
    g.mode = 'play'; if (g.dialogue) g.dialogue.active = false;
    g.entities = g.entities.filter(e => e === g.player);
    prog.giveItem(g.progress, 'sword', 1); g.progress.equipA = 'sword';
    g.player.x = tx * 16; g.player.y = ty * 16; g.player.dir = dir; g.player.invuln = 1e6;
    g.bannerTime = 0; g.itemBanner = null; g.roomBanner = null;
    hold([]); window.__harness.step(2);
  };
  const W = 48, rows = [];
  const grab = () => {
    g.draw();
    const c = g.screen.canvas, p = g.player;
    const sx = p.x - g.camera.x + 8 - W / 2, sy = p.y - g.camera.y + 8 - W / 2 + (c.height - 128);
    const t = document.createElement('canvas'); t.width = W; t.height = W;
    t.getContext('2d').drawImage(c, sx, sy, W, W, 0, 0, W, W);
    return t;
  };
  for (const dir of ['down', 'up', 'right', 'left']) {
    park(dir); const row = [];
    hold([], 'a'); window.__harness.step(1); row.push(grab()); hold([]);
    for (let i = 0; i < 17; i++) { window.__harness.step(1); row.push(grab()); }
    rows.push(row);
  }
  // The spin: hold the button until it charges, then let go.
  park('down'); const spin = [];
  hold(['a'], 'a'); window.__harness.step(60); hold([], null, 'a');
  for (let i = 0; i < 24; i++) { window.__harness.step(1); spin.push(grab()); }
  rows.push(spin);
  // The held blade, each way: standing, walking two steps' worth, then
  // charged (two frames a flash beat apart), then struck while holding it.
  // Walking is toward a free side so he really walks rather than poking.
  const walkTo = { down: 'left', up: 'right', right: 'down', left: 'up' };
  for (const dir of ['down', 'up', 'right', 'left']) {
    park(dir, 4, 3); const row = [];
    hold(['a'], 'a'); window.__harness.step(20); row.push(grab());
    hold(['a', walkTo[dir]]);
    for (let i = 0; i < 4; i++) { window.__harness.step(4); row.push(grab()); }
    hold(['a']); window.__harness.step(40); row.push(grab());
    window.__harness.step(4); row.push(grab());
    g.player.flicker = feel.PLAYER_FLICKER_FRAMES; g.player.invuln = 1e6; row.push(grab());
    rows.push(row);
  }
  const cols = Math.max(...rows.map(r => r.length));
  const o = document.createElement('canvas'); o.width = cols * (W + 2) * scale; o.height = rows.length * (W + 2) * scale;
  const x = o.getContext('2d'); x.imageSmoothingEnabled = false; x.fillStyle = '#fff'; x.fillRect(0, 0, o.width, o.height);
  rows.forEach((r, j) => r.forEach((c, i) => x.drawImage(c, i * (W + 2) * scale, j * (W + 2) * scale, W * scale, W * scale)));
  return o.toDataURL('image/png');
}, scale);
await writeFile(out, Buffer.from(data.split(',')[1], 'base64'));
await browser.close(); server.close();
console.log('wrote', out);
