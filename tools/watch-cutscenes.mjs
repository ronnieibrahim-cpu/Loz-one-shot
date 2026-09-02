// Play every cutscene END TO END and write down what a person would see.
//
// `tools/shoot-cutscene.mjs` photographs ONE frame of each scene and proves the
// picture is not an empty room. It cannot see pacing, because pacing is a thing
// that happens over time: how long a card is up, how long the screen is empty
// between two lines, whether the scene ends or just stops.
//
// §4.2 IS STILL TRUE — pacing is not assertable, and this tool does not claim
// to judge it. What it does is the half a machine CAN do, so a person watching
// is spending their attention on the half only they can:
//
//   * it plays each scene at 60fps in the real engine, dismissing each
//     dialogue box after a READING TIME derived from the line's own length
//     rather than instantly, so the timeline is one a person could live in;
//   * it writes a beat-by-beat timeline — what fired, how long it held, and
//     whether anything was on screen while it did;
//   * it flags the two things that ARE decidable: a card held for less time
//     than its own text takes to read, and DEAD AIR, a stretch with no card,
//     no box, no picture and nothing else to look at;
//   * and it saves a filmstrip per scene, one frame every half second, which
//     is the closest a terminal gets to watching.
//
// Reading rate: READ_CPS below. It is a GUESS and it is labelled one — it is
// not in feel.js because it is this harness's yardstick, not the game's.
//
//   node tools/watch-cutscenes.mjs                 every scene
//   node tools/watch-cutscenes.mjs intro ending    named scenes
//   node tools/watch-cutscenes.mjs --strips        also write the filmstrips
//
// Exit code is non-zero only for a scene that never ends, which IS a bug.

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { mkdirSync, existsSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
               '.png': 'image/png', '.json': 'application/json' };
const args = process.argv.slice(2);
const STRIPS = args.includes('--strips');
const shotDir = (args.find(a => a.startsWith('--shot-dir=')) || '').split('=')[1]
  || join(ROOT, 'tools/shots-cutscene');
const named = args.filter(a => !a.startsWith('--'));

// A comfortable silent-reading rate for short lines on a handheld, in
// characters per second. This harness's own yardstick for how long to leave a
// DIALOGUE BOX up, so the timeline is one a person could live in. The game's
// own rate for CAPTIONS is CUTSCENE_READ_CPS in feel.js, and the check below
// reads that one rather than this one.
const READ_CPS = 14;
// A stretch with nothing on screen longer than this reads as the scene hanging.
const DEAD_AIR_FRAMES = 45;
const CAP_FRAMES = 60 * 90;

// The game's own floor, read from feel.js rather than restated here — a
// checker that keeps its own copy of a rule stops failing when the rule moves.
const { CUTSCENE_READ_CPS, CUTSCENE_READ_LEAD_FRAMES } = await import('../src/data/feel.js');
// The timeline records a card's first 36 characters, so the floor is measured
// off that prefix: it is a LOWER bound on the real one, which is the safe
// direction for an assertion.
const readFloor = (t) => CUTSCENE_READ_LEAD_FRAMES + Math.ceil((t.length / CUTSCENE_READ_CPS) * 60);

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

// Same fallback every other Playwright tool here uses: the container ships a
// chromium at a fixed path and no downloadable one.
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
page.on('pageerror', e => errors.push(String(e)));
await page.goto(`http://localhost:${port}/index.html`);
await page.waitForFunction(() => !!window.__game, { timeout: 15000 });

const frames = (n) => page.evaluate((k) => new Promise(res => {
  const start = window.__game.frame;
  const tick = () => (window.__game.frame - start >= k) ? res(window.__game.frame) : requestAnimationFrame(tick);
  tick();
}), n);

// Out of the title and the intro the boot sequence starts, into a plain
// standing world, so each scene is played from the same place. Real key
// presses, the way shoot-cutscene.mjs does it — the title screen reads the
// input layer, not a set on the game object.
await page.keyboard.press('Enter'); await frames(6);
await page.keyboard.press('Enter'); await frames(20);
for (let i = 0; i < 200 && await page.evaluate(() => window.__game.mode === 'cutscene'); i++) {
  await page.keyboard.press(i % 2 ? 'Enter' : 'x'); await frames(4);
}
await page.evaluate(() => { window.__game.mode = 'play'; window.__game.cutscene = null; });

const ids = named.length ? named : await page.evaluate(async () => {
  const m = await import('./src/game/cutscene.js');
  return Object.keys(m.CUTSCENES);
});

const report = [];
let failed = 0;
for (const id of ids) {
  const run = await page.evaluate(async ({ id, READ_CPS, CAP_FRAMES }) => {
    const g = window.__game;
    g.mode = 'play'; g.cutscene = null;
    if (!g.startCutscene(id, { data: { index: 1 } })) return { err: 'no such cutscene' };
    const timeline = [];
    // MEASURED IN GAME FRAMES, NOT rAF CALLBACKS. The fixed-step loop can tick
    // more than once between two animation frames, so a sampler that counts its
    // own callbacks reports a card held for 178 frames that the engine held for
    // 180 — and then a check with a one-frame slack fails at random.
    let frame = g.frame, hold = 0, last = null, lastPage = null, pageSince = g.frame;
    const shots = [];
    const canvas = document.querySelector('canvas');
    const first = g.frame;
    while (g.mode === 'cutscene' && g.frame - first < CAP_FRAMES) {
      const dt = Math.max(1, g.frame - frame);
      frame = g.frame;
      // What is on screen right now, as a person would describe it.
      const d = g.dialogue && g.dialogue.active ? g.dialogue : null;
      const art = g.cutscene && g.cutscene.shownArt ? g.cutscene.shownArt() : null;
      const cap = g.cutscene && g.cutscene.captionText ? g.cutscene.captionText() : null;
      const page = d ? d.currentText : '';
      const state = d ? 'say:' + page.slice(0, 36).replace(/\n/g, ' ')
        : cap ? 'card:' + cap.slice(0, 36).replace(/\n/g, ' ')
        : art ? 'show:' + art
        : g.fadeDir ? 'fade' : 'empty';
      if (state !== last) {
        if (last !== null) timeline.push({ state: last, frames: hold });
        last = state; hold = 0;
      }
      hold += dt;
      // Read the page the way a player does: wait for it to finish typing
      // itself out, then long enough to READ it, then press A — which turns
      // the page rather than closing the box, so a three-page speech takes
      // three reads. Calling dialogue.close() would skip pages two and three
      // and the scene would clock in at a third of its real length.
      if (d) {
        if (page !== lastPage) { lastPage = page; pageSince = frame; }
        const typed = d.chars >= d.pageLen;
        const need = 24 + Math.ceil((page.length / READ_CPS) * 60);
        if (typed && frame - pageSince >= need) { g.input._latch.a = true; pageSince = frame + 1e9; }
      } else { lastPage = null; }
      if (frame - (shots.length ? shots[shots.length - 1].frame : -99) >= 30) {
        shots.push({ frame, url: canvas.toDataURL('image/png') });
      }
      await new Promise(r => requestAnimationFrame(r));
    }
    if (last !== null) timeline.push({ state: last, frames: hold });
    return { timeline, frames: g.frame - first, ended: g.mode !== 'cutscene', shots };
  }, { id, READ_CPS, CAP_FRAMES });

  if (run.err) { console.log(`  ??   ${id.padEnd(16)} ${run.err}`); continue; }
  const secs = (run.frames / 60).toFixed(1);
  const dead = run.timeline.filter(t => t.state === 'empty' && t.frames >= DEAD_AIR_FRAMES);
  // The one decidable thing about pacing: a card that is gone before its own
  // words can be read. Measured off what was actually on screen, in engine, so
  // this catches the engine forgetting the floor as well as the data asking for
  // too little. Everything else here is a timeline for a person to read.
  // The +1 is a SAMPLING slack, not a tolerance on the rule. State is read at
  // the top of each frame and the hold is decremented inside it, so a card the
  // engine holds for exactly its floor is seen on one frame fewer.
  const short = run.timeline.filter(t =>
    t.state.startsWith('card:') && t.frames + 1 < readFloor(t.state.slice(5)));
  const bad = !run.ended || short.length > 0;
  if (bad) failed++;
  const tag = bad ? 'FAIL' : dead.length ? 'note' : ' ok ';
  console.log(`  ${tag} ${id.padEnd(16)} ${String(run.frames).padStart(5)}f ${secs.padStart(5)}s  ${run.timeline.length} beats`
    + (run.ended ? '' : '  — NEVER ENDS')
    + (dead.length ? `  — ${dead.length} dead-air stretch(es), longest ${Math.max(...dead.map(d => d.frames))}f` : '')
    + (short.length ? `  — ${short.length} card(s) gone before they can be read` : ''));
  report.push({ id, frames: run.frames, seconds: +secs, ended: run.ended, timeline: run.timeline });

  if (STRIPS) {
    const cols = 6, W = 480, H = 432;
    const strip = await page.evaluate(async ({ shots, cols, W, H }) => {
      const rows = Math.ceil(shots.length / cols);
      const c = document.createElement('canvas');
      c.width = cols * (W / 2); c.height = rows * (H / 2);
      const x = c.getContext('2d');
      x.fillStyle = '#000'; x.fillRect(0, 0, c.width, c.height);
      for (let i = 0; i < shots.length; i++) {
        const img = new Image();
        await new Promise(r => { img.onload = r; img.src = shots[i].url; });
        x.drawImage(img, (i % cols) * (W / 2), Math.floor(i / cols) * (H / 2), W / 2, H / 2);
      }
      return c.toDataURL('image/png');
    }, { shots: run.shots, cols, W, H });
    await writeFile(join(shotDir, `strip-${id}.png`), Buffer.from(strip.split(',')[1], 'base64'));
  }
}

await writeFile(join(shotDir, 'timeline.json'), JSON.stringify(report, null, 2));
console.log(`\nwatch-cutscenes: ${report.length} scene(s), ${failed} with a scene-level fault`);
console.log('  PACING ITSELF IS NOT ASSERTED and cannot be (§4.2). The timeline above is'
  + '\n  for a person to read, and the scenes are for a person to watch.');
console.log(`  timeline -> ${join(shotDir, 'timeline.json')}${STRIPS ? ', filmstrips beside it' : ''}`);
if (errors.length) { console.log('  page errors:'); errors.forEach(e => console.log('   ', e)); }
await browser.close(); server.close();
process.exit(failed ? 1 : 0);
