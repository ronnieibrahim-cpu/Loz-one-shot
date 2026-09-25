// Film every boss and miniboss fight in the REAL playthrough, frame by frame.
// NOT a checker — it asserts nothing. It exists because every boss's art was
// approved from STILLS (S152), and a still cannot show how a creature moves,
// flashes, opens or dies, nor whether the camera cuts its head off when Link
// stands far below it.
//
//   node tools/film-bosses.mjs [outDir] [every]
//
// Plays the playthrough route from a new game to the end (the same run
// `check-playthrough.mjs` proves, same seed, same RNG history), and while a
// boss-class entity is alive in the room it draws the game every `every`
// frames (default 3, i.e. 20 fps) and writes the canvas as a PNG under
// outDir/<nn>-<map>-<kind>/. Drawing does not touch the run: `game.draw()` may
// not consume randomness (see the stepping hook in src/main.js), which is why
// the screenshots of `shoot-*` tools are safe too.
//
// It also writes outDir/fights.json: per fight, the frames filmed and how far
// the drawn art ran past the top of the play area (under the HUD) or off the
// bottom of the screen — the camera-crop question for the tall bosses, which
// a hitbox-based check cannot see because the art is taller than the hitbox.
// `tools/film-bosses.py` turns the folders into GIFs and contact strips.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { mkdirSync, writeFileSync } from 'node:fs';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(process.argv[2] || join(ROOT, 'tools', 'shots', 'boss-film'));
const EVERY = Number(process.argv[3] || 3);
const { installRuntime } = await import(ROOT + '/tools/actor-runtime.mjs');
const { ROUTE, SEED } = await import(ROOT + '/tools/playthrough-route.mjs');
mkdirSync(OUT, { recursive: true });

const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const full = join(ROOT, normalize(p)); const s = await stat(full).catch(() => null);
  if (!s || !s.isFile()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': extname(full) === '.html' ? 'text/html' : 'text/javascript' }); res.end(await readFile(full));
});
await new Promise(r => server.listen(0, r));
const PORT = server.address().port;
const browser = await chromium.launch().catch(() =>
  chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' }));
const page = await browser.newPage();
page.on('pageerror', e => console.log('PAGEERROR', e.message));
await page.goto(`http://localhost:${PORT}/index.html?seed=${SEED}`);
await page.waitForFunction(() => !!window.__game && !!window.__harness);
await page.evaluate(installRuntime);
await page.evaluate(async (every) => {
  const { bossRig } = await import('/src/game/enemy.js');
  const { HUD_H, SCREEN_H } = await import('/src/core/screen.js');
  const g = window.__game, orig = g.update.bind(g);
  window.__film = { fights: [], shots: [] };
  let cur = null, tail = 0;
  const bossesHere = () => g.entities.filter(e => e._bossClass && !e.dead);
  g.update = (...args) => {
    const r = orig(...args);
    if (g.mode === 'title' || !g.room) return r;
    const bs = bossesHere();
    if (bs.length) {
      const key = `${g.mapId}/${g.room.key}`;
      if (!cur || cur.key !== key) {
        cur = { key, map: g.mapId, kinds: [...new Set(bs.map(b => b.kind || b.type))], start: g.frame, end: g.frame,
          shots: 0, camTopOver: 0, worst: null, topOver: 0, topOverFrames: 0, botOver: 0, botOverFrames: 0, frames: 0 };
        window.__film.fights.push(cur);
      }
      tail = 90;
    } else if (cur && --tail <= 0) { cur = null; return r; }
    if (!cur) return r;
    cur.end = g.frame; cur.frames++;
    // How far each boss's drawn art runs past the play area, exactly as
    // Boss.draw places it: (ax, ay) on the centre of the hitbox.
    for (const b of bs) {
      const rig = bossRig(b.spriteName(g));
      const hb = b.spec.hb || { x: 0, y: 0, w: b.w, h: b.h };
      const cy = HUD_H + b.y + hb.y + (hb.h >> 1) - (b.z || 0) - g.camera.y;
      const top = rig ? cy - rig.ay : HUD_H + b.y - g.camera.y;
      const bot = rig ? top + rig.h : top + b.h;
      const over = HUD_H - top, under = bot - SCREEN_H;
      if (over > 0) { cur.topOverFrames++; if (over > cur.topOver) { cur.topOver = over; cur.worst = g.frame; } }
      // Past the top even with the camera as high as it goes: the art is
      // taller than the room above the boss, not merely scrolled away.
      if (over > 0 && g.camera.y <= 0) cur.camTopOver = Math.max(cur.camTopOver, over);
      if (under > 0) { cur.botOverFrames++; cur.botOver = Math.max(cur.botOver, under); }
    }
    if (g.frame % every === 0 && !g.transition) {
      g.draw();
      window.__film.shots.push([window.__film.fights.length - 1, g.frame, g.ctx.canvas.toDataURL('image/png')]);
      cur.shots++;
    }
    return r;
  };
}, EVERY);

await page.evaluate(steps => window.__rp.beginPlaythrough(steps), ROUTE);
const dirs = new Map();
let written = 0;
const drain = async () => {
  const { shots, fights } = await page.evaluate(() => { const s = window.__film.shots; window.__film.shots = []; return { shots: s, fights: window.__film.fights }; });
  for (const [fi, frame, url] of shots) {
    const f = fights[fi];
    if (!dirs.has(fi)) {
      const d = join(OUT, `${String(fi).padStart(2, '0')}-${f.map}-${f.kinds.join('+')}`);
      mkdirSync(d, { recursive: true }); dirs.set(fi, d);
    }
    writeFileSync(join(dirs.get(fi), `f${String(frame).padStart(7, '0')}.png`), Buffer.from(url.split(',')[1], 'base64'));
    written++;
  }
  return fights;
};
let r, fights = [];
for (let i = 0; i < 4000; i++) {
  r = await page.evaluate(n => window.__rp.pump(n), 3000);
  fights = await drain();
  if (r.done || r.error) break;
}
const res = await page.evaluate(() => window.__rp.result());
writeFileSync(join(OUT, 'fights.json'), JSON.stringify(fights.map((f, i) => ({ ...f, dir: dirs.get(i) })), null, 1));
for (const f of fights) console.log(`${f.map.padEnd(6)} ${f.key.padEnd(14)} ${f.kinds.join('+').padEnd(22)} ${String(f.end - f.start).padStart(5)}f  shots ${String(f.shots).padStart(4)}  top-cut ${f.topOver}px on ${f.topOverFrames}f (worst f${f.worst}; ${f.camTopOver}px with camera at top)  bottom-cut ${f.botOver}px on ${f.botOverFrames}f`);
console.log(`${fights.length} fights, ${written} frames written to ${OUT}; run ${r && r.done ? 'finished' : 'STOPPED'} at frame ${res.frames}`);
await browser.close(); server.close();
