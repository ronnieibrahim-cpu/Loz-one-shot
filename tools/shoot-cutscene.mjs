// Play each cutscene and photograph it mid-scene.
//
// `T53` in one sentence: headless assertions prove EXISTENCE, never
// VISIBILITY — every boss's dramatic reveal rendered as an empty room for the
// project's whole life while assertions happily proved the boss existed. A
// cutscene is the single most `T53`-shaped thing in the game: it is pure
// presentation, nothing about it is load-bearing for progression, and a scene
// that renders as an empty screen still "runs" perfectly.
//
//   node tools/shoot-cutscene.mjs                 # every scene with a picture
//   node tools/shoot-cutscene.mjs essence3 ending
//   node tools/shoot-cutscene.mjs --all           # all 13, picture or not
//   node tools/shoot-cutscene.mjs --nereth        # prove nerethIntro FIRES
//
// HOW IT FINDS THE RIGHT FRAME. A scene's `show` step may sit behind several
// `say` steps, and pressing A to get past them would also skip the sprite —
// A/B dismiss a held sprite, by design, so a player is never stuck looking at
// one. So this closes dialogue boxes directly instead, and then waits for
// `cutscene.shownArt()` to report a sprite actually on screen before taking
// the picture. A scene with no `show` at all is shot on its first caption.

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { mkdirSync, existsSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
               '.png': 'image/png', '.json': 'application/json' };

const args = process.argv.slice(2);
const shotDir = (args.find(a => a.startsWith('--shot-dir=')) || '').split('=')[1]
  || join(ROOT, 'tools/shots-cutscene');
const ALL = args.includes('--all');
const NERETH = args.includes('--nereth');
const named = args.filter(a => !a.startsWith('--'));

// The scenes that hold a picture up. The rest are dialogue-only and are shot
// on their caption when --all is given.
const WITH_ART = ['intro', 'essence1', 'essence2', 'essence3', 'essence4', 'essence5',
                  'essence6', 'essenceGeneric', 'nerethIntro', 'ending'];
const DIALOGUE_ONLY = ['makuSatchel', 'makuMaster', 'tradeKettle'];

const server = createServer(async (req, res) => {
  try {
    const p = join(ROOT, decodeURIComponent(req.url.split('?')[0]) === '/' ? 'index.html'
      : decodeURIComponent(req.url.split('?')[0]));
    const buf = await readFile(p);
    res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' });
    res.end(buf);
  } catch { res.writeHead(404); res.end('nope'); }
});
await new Promise(r => server.listen(0, r));
const port = server.address().port;

mkdirSync(shotDir, { recursive: true });
async function launchChromium() {
  try { return await chromium.launch(); }
  catch (err) {
    const fallback = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium';
    if (!existsSync(fallback)) throw err;
    return await chromium.launch({ executablePath: fallback });
  }
}
const browser = await launchChromium();
const page = await browser.newPage({ viewport: { width: 480, height: 432 } });
const errors = [];
const problems = [];
page.on('pageerror', e => errors.push(String(e)));
await page.goto(`http://localhost:${port}/index.html`);
await page.waitForFunction(() => !!window.__game, { timeout: 15000 });

const frames = (n) => page.evaluate((k) => new Promise(res => {
  const start = window.__game.frame;
  const tick = () => (window.__game.frame - start >= k) ? res(window.__game.frame) : requestAnimationFrame(tick);
  tick();
}), n);

await page.keyboard.press('Enter'); await frames(6);
await page.keyboard.press('Enter'); await frames(20);
for (let i = 0; i < 140 && await page.evaluate(() => window.__game.mode === 'cutscene'); i++) {
  await page.keyboard.press(i % 2 ? 'Enter' : 'x'); await frames(4);
}

// --------------------------------------------------------------------------
// Nereth: prove the scene actually FIRES, rather than that it exists
// --------------------------------------------------------------------------
if (NERETH) {
  const r = await page.evaluate(async () => {
    const g = window.__game;
    g.mode = 'play';
    delete g.progress.flags.heardNereth;
    // Straight into the throne room. The boss spawns with the room.
    g.enterMap('d6', 1, 3, 1, 80, 100, 'up', { instant: true });
    const hasBoss = !!(g.boss || g.entities.some(e => e.isBoss));
    // The held pose is `intro: 120` frames; the scene fires as it ends.
    await new Promise(res => {
      let n = 0;
      const tick = () => (++n > 400 || g.mode === 'cutscene') ? res() : requestAnimationFrame(tick);
      tick();
    });
    return { hasBoss, mode: g.mode, track: g.audio.trackName || null };
  });
  console.log(`  nereth: boss present=${r.hasBoss} mode=${r.mode} track=${r.track}`);
  if (!r.hasBoss) problems.push('no boss in d6/1,3,1 — nothing to introduce');
  if (r.mode !== 'cutscene') problems.push(`nerethIntro did not fire: mode is '${r.mode}', not 'cutscene'`);

  // Drive it to the end and confirm it hands over to the final boss theme,
  // which nothing else in the game plays.
  const end = await page.evaluate(async () => {
    const g = window.__game;
    await new Promise(res => {
      let n = 0;
      const tick = () => {
        if (g.dialogue && g.dialogue.active) g.dialogue.close();
        return (++n > 3000 || g.mode !== 'cutscene') ? res() : requestAnimationFrame(tick);
      };
      tick();
    });
    return { mode: g.mode, track: g.audio.trackName || null };
  });
  console.log(`  nereth: scene ended, mode=${end.mode} track=${end.track}`);
  if (end.track !== 'finalBoss') {
    problems.push(`after nerethIntro the track is '${end.track}', not 'finalBoss' — ` +
      `the final boss theme is played by nothing else in the game`);
  }
}

// --------------------------------------------------------------------------
// The pictures
// --------------------------------------------------------------------------
const SHOTS = named.length ? named : (ALL ? [...WITH_ART, ...DIALOGUE_ONLY] : WITH_ART);

for (const id of SHOTS) {
  const got = await page.evaluate(async (id) => {
    const g = window.__game;
    g.mode = 'play';
    if (g.dialogue) g.dialogue.active = false;
    if (!g.startCutscene(id, { data: { index: 1 } })) return { err: 'no such cutscene' };
    // Advance without touching A/B: closing the box steps past a `say`, and
    // unlike a keypress it does not also dismiss the sprite we came to see.
    const r = await new Promise(res => {
      let n = 0;
      const tick = () => {
        const art = g.cutscene && g.cutscene.shownArt ? g.cutscene.shownArt() : null;
        if (art) return res({ art, waited: n });
        if (g.mode !== 'cutscene') return res({ art: null, waited: n, ended: true });
        if (n > 40 && g.dialogue && g.dialogue.active) g.dialogue.close();
        return (++n > 1200) ? res({ art: null, waited: n }) : requestAnimationFrame(tick);
      };
      tick();
    });
    return r;
  }, id);

  if (got && got.err) { console.log(`  MISS ${id.padEnd(16)} ${got.err}`); problems.push(`${id}: ${got.err}`); continue; }
  await frames(2);
  const name = `cutscene-${id}.png`;
  await page.locator('canvas').screenshot({ path: join(shotDir, name) });
  const what = got.art ? `showing ${got.art}` : (got.ended ? 'ENDED before any picture' : 'no picture');
  console.log(`  ok   ${id.padEnd(16)} ${what} (after ${got.waited}f) -> ${name}`);
  if (WITH_ART.includes(id) && !got.art) {
    problems.push(`${id}: is listed as holding a picture and never showed one`);
  }
  await page.evaluate(() => { window.__game.mode = 'play'; window.__game.cutscene = null; });
  await frames(2);
}

await browser.close();
server.close();
if (errors.length) {
  console.log(`\n${errors.length} page error(s):`);
  for (const e of errors.slice(0, 5)) console.log('  ' + e);
  process.exit(1);
}
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log(`shoot-cutscene: ${SHOTS.length} scene(s) -> ${shotDir}`);
