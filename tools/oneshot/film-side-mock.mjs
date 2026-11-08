// Film Link in a MOCK side-view passage (S241). NOT a checker: it asserts
// nothing. A scenario JSON gives a side legend, a 15x11 grid, the sea, the
// Cleats or not, Link's start (px) and steps [[held buttons], frames]; it
// writes a PNG every `every` frames and prints Link's state every 8.
//   node tools/oneshot/film-side-mock.mjs docs/briefs/s241/side-mock/mid.json <outDir>
import { createServer } from 'node:http';
import { readFile, stat, writeFile, mkdir } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const [scenPath, outDir] = process.argv.slice(2);
const scen = JSON.parse(await readFile(scenPath, 'utf8'));
await mkdir(outDir, { recursive: true });
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const full = join(ROOT, normalize(p)); const s = await stat(full).catch(() => null);
  if (!s || !s.isFile()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': extname(full) === '.html' ? 'text/html' : 'text/javascript' }); res.end(await readFile(full));
});
await new Promise(r => server.listen(0, r));
const browser = await chromium.launch().catch(() =>
  chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' }));
const page = await browser.newPage();
page.on('console', m => { if (m.type() === 'error') console.log('ERR', m.text()); });
page.on('pageerror', e => console.log('PAGEERR', e.message));
await page.goto(`http://localhost:${server.address().port}/index.html`);
await page.waitForFunction(() => window.__game && window.__harness);
const out = await page.evaluate(async (scen) => {
  const g = window.__game; window.__harness.takeOver();
  g.newGame(0, 'LINK', 20260930);
  g.cutscene = null; g.mode = 'play'; g.dialogue.active = false;
  const { registerMap } = await import('/src/world/maps.js');
  registerMap({ id: 'svmock', kind: 'dungeon', name: 'Mock', w: 1, h: 1, floors: 1, cell: [15, 11],
    legend: scen.legend, tint: 'cave', music: 'dungeon3',
    rooms: { "0,0,0": { name: "Passage", side: true, map: scen.map, entities: scen.entities || [] } } });
  // `alias`: { tile: otherTile } draws a tile as another one (a colour trial
  // for the human, S243: the Cistern's water in the Poison Moth's blue).
  if (scen.alias) {
    const { tiles } = await import('/src/gfx/art.js');
    const { TILES } = await import('/src/world/tileset.js');
    for (const [a, b] of Object.entries(scen.alias)) { tiles.defs.set(a, tiles.defs.get(b)); const d = TILES.get(a); if (d) d.pal = TILES.get(b).pal; }
    tiles.flush();
  }
  if (scen.cleats) { const { giveItem } = await import('/src/game/progress.js'); giveItem(g.progress, 'cleats'); }
  if (scen.equipB) { const { giveItem } = await import('/src/game/progress.js'); giveItem(g.progress, scen.equipB); g.progress.equipB = scen.equipB; }
  g.tide.clearOverrides(); g.tide.setLevel(scen.tide, { instant: true });
  g.enterMap('svmock', 0, 0, 0, scen.start[0], scen.start[1], 'up', { instant: true });
  g.dialogue.active = false; g.bannerTime = 0;
  const frames = []; const log = [];
  const shot = () => {
    const r = g.room; const c = document.createElement('canvas'); c.width = r.pw; c.height = r.ph;
    const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false; g.drawScene(ctx, 0, 0); return c.toDataURL('image/png');
  };
  const raw = g.input._raw;
  let f = 0;
  for (const [keys, n] of scen.steps) {
    for (const b of ['up', 'down', 'left', 'right', 'a', 'b']) raw[b] = keys.includes(b);
    for (let i = 0; i < n; i++) {
      window.__harness.step(1); f++;
      g.dialogue.active = false;
      if (f % scen.every === 0) frames.push(shot());
      const p = g.player;
      if (f % 8 === 0) log.push(`${f} ${keys} x=${p.x} y=${p.y} fall=${p.svFall} climb=${p.svClimb} deep=${p.inDeep} uw=${p.underwater} wash=${p.washing} hp=${g.progress.hearts} rup=${g.progress.rupees} room=${g.room.key} tide=${g.tide.level} B=${g.progress.equipB} play=${p.playing||p.conchT||0}`);
    }
  }
  return { frames, log };
}, scen);
for (let i = 0; i < out.frames.length; i++) await writeFile(join(outDir, `f${String(i).padStart(4, '0')}.png`), Buffer.from(out.frames[i].split(',')[1], 'base64'));
console.log(out.log.join('\n'));
await browser.close(); server.close();
