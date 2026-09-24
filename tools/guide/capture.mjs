// Capture the raw pictures the player's guide (docs/guide/) is built from.
// NOT a checker — it asserts nothing about the game.
//
// Two kinds of picture, both drawn by the game's own renderer:
//
//   ROUTE shots. The playthrough route (tools/playthrough-route.mjs) is played
//   from a new game, exactly as check-playthrough and route-prefix play it, and
//   the game is photographed at named moments: `after: N` is the frame the
//   route's directive N finishes on, `plus` frames later. Every guide picture
//   of Link doing something is therefore a picture of the run that is proven to
//   finish the game, standing where that run stood. Drawing does not consume
//   randomness (see src/main.js), so photographing the run does not change it.
//
//   STATIC shots. A room entered cold at a stated tide, with nobody in it,
//   for the "this is what the room looks like at LOW / at HIGH" pictures and
//   for the stitched dungeon maps.
//
// Each shot writes <id>.png (the 160x144 screen, or with `whole` the whole
// room at 1x) and <id>.json (room name, camera, Link's position, tide, the
// entities) into the raw directory, for tools/guide/annotate.mjs.
//
//   node tools/guide/capture.mjs [--only=prefix] [--raw=dir]
import { createServer } from 'node:http';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const args = process.argv.slice(2);
const opt = (k, d) => { const a = args.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const RAW = resolve(opt('raw', join(ROOT, 'tools/guide/raw')));
const ONLY = opt('only', '');
await mkdir(RAW, { recursive: true });

const { installRuntime } = await import(ROOT + '/tools/actor-runtime.mjs');
const { ROUTE, SEED } = await import(ROOT + '/tools/playthrough-route.mjs');
const { ROUTE_SHOTS, STATIC_SHOTS } = await import(HERE + '/shots.mjs?' + Date.now());

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const full = join(ROOT, normalize(p)); const s = await stat(full).catch(() => null);
  if (!s || !s.isFile()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[extname(full)] || 'application/octet-stream' }); res.end(await readFile(full));
});
await new Promise(r => server.listen(0, r));
const PORT = server.address().port;
const browser = await chromium.launch().catch(() =>
  chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' }));

// In-page: photograph the current state. `whole` draws the whole room through
// drawScene into a room-sized canvas; otherwise the 160x144 screen exactly as
// game.draw() paints it. `noPlayer` leaves Link out of a whole-room picture.
function snapInPage({ whole, noPlayer, noBanner, noDialogue }) {
  const g = window.__game;
  const saved = { banner: g.bannerTime, dlg: g.dialogue && g.dialogue.active, player: g.player };
  if (noBanner) g.bannerTime = 0;
  if (noDialogue && g.dialogue) g.dialogue.active = false;
  let url, w, h;
  if (whole && g.room) {
    const r = g.room;
    const c = document.createElement('canvas');
    c.width = r.pw; c.height = r.ph;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    if (noPlayer) g.player = null;
    g.drawScene(ctx, 0, 0);
    g.player = saved.player;
    url = c.toDataURL('image/png'); w = r.pw; h = r.ph;
  } else {
    g.draw();
    const cv = document.getElementById('screen');
    url = cv.toDataURL('image/png'); w = cv.width; h = cv.height;
  }
  g.bannerTime = saved.banner;
  if (g.dialogue) g.dialogue.active = saved.dlg;
  g.draw();
  const p = g.player;
  const meta = {
    map: g.mapId, mapName: g.map && g.map.name, room: g.room ? g.room.key : null,
    roomName: g.room ? (g.room.name || null) : null,
    pw: g.room ? g.room.pw : 0, ph: g.room ? g.room.ph : 0,
    cam: g.camera ? { x: g.camera.x, y: g.camera.y } : { x: 0, y: 0 },
    player: p ? { x: Math.round(p.x), y: Math.round(p.y), dir: p.dir,
      tx: Math.floor((p.x + 8) / 16), ty: Math.floor((p.y + 13) / 16) } : null,
    tide: g.tide.level, mode: g.mode, frame: g.frame,
    hearts: g.progress.hearts, maxHearts: g.progress.maxHearts,
    equipA: g.progress.equipA, equipB: g.progress.equipB,
    keys: g.progress.keys[g.mapId] || 0,
    dialogue: g.dialogue && g.dialogue.active ? [].concat(g.dialogue.pages[g.dialogue.page] || []).join(' ') : null,
    ents: g.entities.filter(e => !e.isEffect && e !== p).map(e => ({
      t: e.kind || e.type || e.constructor.name, x: Math.round(e.x), y: Math.round(e.y),
      tx: Math.floor((Math.round(e.x) + 8) / 16), ty: Math.floor((Math.round(e.y) + 8) / 16) })),
    whole: !!whole, w, h,
  };
  return { url, meta };
}

async function save(id, got, extra) {
  await writeFile(join(RAW, id + '.png'), Buffer.from(got.url.split(',')[1], 'base64'));
  await writeFile(join(RAW, id + '.json'), JSON.stringify({ id, ...got.meta, ...extra }, null, 1));
}

// ------------------------------------------------------------ route shots
// Shots are taken in the order they are listed, each one moving the run
// forward from wherever the last one left it: first to the end of directive
// `after` (if the run is not already past it), then, with `until`, on to the
// first frame an in-page condition holds (`g` is the game), then `plus` more
// frames. Listed out of order, a shot is simply taken late.
const want = ROUTE_SHOTS.filter(s => !ONLY || s.id.startsWith(ONLY));
if (want.length) {
  const last = Math.max(...want.map(s => s.after)) + 2;
  const page = await browser.newPage();
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  await page.goto(`http://localhost:${PORT}/index.html?seed=${SEED}`);
  await page.waitForFunction(() => !!window.__game && !!window.__harness);
  await page.evaluate(installRuntime);
  await page.evaluate(steps => window.__rp.beginPlaythrough(steps), ROUTE.slice(0, Math.min(ROUTE.length, last + 1)));
  // THE TRAIL: where Link actually walked, every fourth frame, tagged with the
  // directive it was walked under. annotate.mjs draws the route on a map from
  // this, so the line on a map is the run's own footsteps, never a hand-drawn
  // guess at them.
  await page.evaluate(() => {
    const rp = window.__rp, orig = rp.pump.bind(rp);
    window.__trailRec = [];
    rp.pump = (n) => {
      const r = orig(n);
      const g = window.__game, p = g.player;
      if (p && g.room && g.frame % 4 === 0 && g.mode === 'play' && !g.transition) {
        const st = rp._trace.length ? rp._trace[rp._trace.length - 1].step + 1 : 0;
        window.__trailRec.push([st, g.mapId, g.room.floor, g.room.rx, g.room.ry, Math.round(p.x), Math.round(p.y)]);
      }
      return r;
    };
  });
  for (const s of want) {
    const r = await page.evaluate(({ after, plus, until, by }) => {
      const rp = window.__rp, g = window.__game;
      const doneStep = () => rp._trace.length ? rp._trace[rp._trace.length - 1].step : -1;
      let n = 0;
      while (doneStep() < after && !rp._done) { rp.pump(1); if (++n > 400000) return { err: 'runaway' }; }
      if (until) {
        const pred = new Function('g', 'return (' + until + ');');
        let k = 0;
        // Never chase a condition past `by` (default: three directives on):
        // a condition that never holds must not drag every later shot with it.
        while (!pred(g) && !rp._done) {
          rp.pump(1);
          if (++k > 20000 || doneStep() > by) return { err: 'until never held by step ' + by, at: doneStep() };
        }
      }
      for (let i = 0; i < (plus || 0) && !rp._done; i++) rp.pump(1);
      return { at: doneStep(), done: rp._done, frame: g.frame };
    }, { after: s.after, plus: s.plus || 0, until: s.until || null, by: s.by == null ? s.after + 3 : s.by });
    if (r.err || r.at < s.after) { console.log(`  MISS ${s.id}: stopped at step ${r.at} ${r.err || ''}`); continue; }
    if (s.whole !== 'only') {
      const got = await page.evaluate(snapInPage, { whole: false, noBanner: s.noBanner, noDialogue: s.noDialogue });
      await save(s.id, got, { kind: 'route', after: s.after, plus: s.plus || 0 });
    }
    if (s.whole) {
      const got = await page.evaluate(snapInPage, { whole: true, noPlayer: false });
      await save(s.id + (s.whole === 'only' ? '' : '-whole'), got, { kind: 'route', after: s.after, plus: s.plus || 0 });
    }
    const m = JSON.parse(await readFile(join(RAW, s.id + '.json'), 'utf8').catch(() => '{}'));
    console.log(`  ok   ${s.id.padEnd(28)} step ${r.at} f${r.frame} ${m.map} ${m.room} "${m.roomName}" tide ${m.tide} hp ${m.hearts}/${m.maxHearts}` +
      (m.player ? ` at ${m.player.tx},${m.player.ty} ${m.player.dir}` : '') + (m.dialogue ? ' DLG' : ''));
  }
  if (!ONLY) await writeFile(join(RAW, 'trail.json'), JSON.stringify(await page.evaluate(() => window.__trailRec)));
  await page.close();
}

// ----------------------------------------------------------- static shots
const stat2 = STATIC_SHOTS.filter(s => !ONLY || s.id.startsWith(ONLY));
if (stat2.length) {
  const page = await browser.newPage();
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  await page.goto(`http://localhost:${PORT}/index.html?seed=${SEED}`);
  await page.waitForFunction(() => !!window.__game && !!window.__harness);
  await page.evaluate(installRuntime);
  // The title screen, before anything is pressed.
  for (const s of stat2.filter(s => s.title)) {
    await page.evaluate((n) => { window.__harness.takeOver(); window.__harness.step(n); }, s.frames || 120);
    const got = await page.evaluate(snapInPage, { whole: false });
    await save(s.id, got, { kind: 'static' });
    console.log(`  ok   ${s.id.padEnd(28)} title`);
  }
  // A new game from the title, through the intro, then take the clock.
  await page.evaluate(steps => window.__rp.beginPlaythrough(steps), [ROUTE[0]]);
  await page.evaluate(() => { while (!window.__rp._done) window.__rp.pump(1); });
  for (const s of stat2.filter(s => !s.title)) {
    const [mapId, floor, rx, ry] = s.room;
    const ok = await page.evaluate(({ mapId, floor, rx, ry, tide, px, py, dir, prep }) => {
      const g = window.__game;
      g.mode = 'play';
      if (prep && prep.progress) Object.assign(g.progress, prep.progress);
      if (prep && prep.flags) for (const f of prep.flags) g.progress.flags[f] = true;
      g.tide.clearOverrides && g.tide.clearOverrides();
      g.enterMap(mapId, floor, rx, ry, px == null ? 80 : px, py == null ? 72 : py, dir || 'down', { instant: true });
      g.tide.setLevel(tide, { instant: true });
      if (g.room) g.room.invalidate();
      if (prep && prep.clearEnemies) g.entities = g.entities.filter(e => !e.isEnemy);
      for (let i = 0; i < 40; i++) window.__harness.step(1);
      if (g.dialogue) g.dialogue.active = false;
      g.bannerTime = 0;
      if (prep && prep.script) new Function('g', 'H', prep.script)(g, window.__harness);
      return g.room ? g.mapId + ',' + g.room.floor + ',' + g.room.rx + ',' + g.room.ry : null;
    }, { mapId, floor, rx, ry, tide: s.tide == null ? 1 : s.tide, px: s.px, py: s.py, dir: s.dir, prep: s.prep });
    if (ok !== `${mapId},${floor},${rx},${ry}`) { console.log(`  MISS ${s.id}: landed ${ok}`); continue; }
    const got = await page.evaluate(snapInPage, { whole: s.whole !== false, noPlayer: s.player !== true,
      noBanner: !s.keepBanner, noDialogue: !s.keepDialogue });
    await save(s.id, got, { kind: 'static' });
    console.log(`  ok   ${s.id.padEnd(28)} ${ok} "${got.meta.roomName}" tide ${got.meta.tide} ${got.meta.w}x${got.meta.h}`);
  }
  await page.close();
}
await browser.close(); server.close();
