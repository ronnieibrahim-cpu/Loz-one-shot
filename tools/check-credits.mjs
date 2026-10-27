// THE CREDITS (S213): Seasons' staff roll, our places and names
// (src/game/credits.js, src/data/credits.js).
//
// By the data:
//   1. every scene is two overworld screens side by side, and the screen above
//      or below them exists to fill the 16 px a status bar would cover;
//   2. every line fits the screen (20 letters) and every character in it is
//      in the cartridge's lettering or among the drawn digits — a missing
//      one would simply not be drawn, a gap nobody notices;
//   3. the ink is a heading's or a name's.
// In the engine:
//   4. the ending's last beat goes to the credits, not straight to THE END;
//   5. the roll plays every part in order and hands over to THE END, inside a
//      bound, with no console error;
//   6. while a scene is up nothing in the world moves (the player is not
//      drawn and the frame count is all that advances);
//   7. THE END is the cartridge's sunset, holds THE_END_HOLD_FRAMES against a
//      button, and then A goes to the title; the save says the game is finished.
//
// Usage: node tools/check-credits.mjs

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize, resolve } from 'node:path';
import { CREDITS_ROLL } from '../src/data/credits.js';
import { CREDITS_DIGITS } from '../src/data/sprites-credits-drawn.js';

const ROOT = resolve(import.meta.dirname, '..');
let pass = 0; const fail = [];
const check = (n, c, d) => c
  ? (pass++, console.log('  ok   ' + n))
  : (fail.push(n), console.log('  FAIL ' + n + (d ? ' — ' + d : '')));

// The glyph list lives in a generated module that also imports nothing, so
// it can be read here directly.
const { CREDITS_GLYPHS } = await import('../src/data/screens-ending.js');

// 2, 3.
const lines = CREDITS_ROLL.filter(p => p.names).flatMap(p => p.names).filter(l => l.length);
const bad = lines.filter(([, t]) => [...t].some(ch => ch !== ' ' && !CREDITS_GLYPHS.includes(ch) && !(ch in CREDITS_DIGITS)));
check('every character in the roll is in the lettering or the drawn digits', !bad.length, JSON.stringify(bad));
const long = lines.filter(([, t]) => t.length > 20);
check('every line fits the screen (20 letters)', !long.length, JSON.stringify(long));
check('every line is a heading (c) or a name (w)', lines.every(([k]) => k === 'c' || k === 'w'));
check('the roll alternates a place and names, four of each', CREDITS_ROLL.length === 8
  && CREDITS_ROLL.every((p, i) => (i % 2 ? !!p.names : !!p.scene)));
check('only the last roll scrolls the sky', CREDITS_ROLL.filter(p => p.sky).length === 1 && CREDITS_ROLL.at(-1).sky);

const { chromium } = await import('playwright');
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const full = join(ROOT, normalize(p)); const st = await stat(full).catch(() => null);
  if (!st || !st.isFile()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': extname(full) === '.html' ? 'text/html' : 'text/javascript' }); res.end(await readFile(full));
});
await new Promise(r => server.listen(0, r));
const browser = await chromium.launch().catch(() =>
  chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' }));
const page = await browser.newPage();
const errors = []; page.on('pageerror', e => errors.push(String(e)));
await page.goto(`http://localhost:${server.address().port}/index.html`);
await page.waitForFunction(() => window.__game && window.__harness);

const r = await page.evaluate(async (roll) => {
  const g = window.__game, h = window.__harness;
  const { getRoom } = await import('/src/world/maps.js');
  const { CREDITS_ROLL } = await import('/src/data/credits.js');
  const { THE_END_HOLD_FRAMES } = await import('/src/data/feel.js');
  const out = {};
  // 1.
  out.scenes = CREDITS_ROLL.filter(p => p.scene).map(({ scene: [f, x, y] }) => ({
    at: [f, x, y], pair: !!getRoom('overworld', f, x, y) && !!getRoom('overworld', f, x + 1, y),
    fill: (!!getRoom('overworld', f, x, y - 1) && !!getRoom('overworld', f, x + 1, y - 1))
      || (!!getRoom('overworld', f, x, y + 1) && !!getRoom('overworld', f, x + 1, y + 1)),
  }));
  // 4. The ending's last beat, played on its own.
  g.mode = 'play'; g.dialogue.active = false;
  g.startCutscene('ending');
  for (let i = 0; i < 20000 && g.mode === 'cutscene'; i++) {
    h.step(1);
    if (g.dialogue.active && i % 6 === 0) { g.input._raw.a = true; } else g.input._raw.a = false;
  }
  g.input._raw.a = false;
  out.afterEnding = g.mode;
  // 5, 6.
  const seen = []; let frames = 0;
  const px = g.player ? [g.player.x, g.player.y] : null;
  while (g.mode === 'credits' && frames < 8000) {
    if (!seen.includes(g.credits.part)) seen.push(g.credits.part);
    h.step(1); frames++;
  }
  out.seen = seen; out.frames = frames; out.mode = g.mode;
  out.playerStill = !px || (g.player.x === px[0] && g.player.y === px[1]);
  // 7. Past the fade in from white, still inside the hold.
  for (let i = 0; i < 30; i++) h.step(1);
  g.draw();
  const c = g.ctx.getImageData(80, 72, 1, 1).data;
  out.sunset = [c[0], c[1], c[2]];
  g.input._raw.a = true; h.step(1); g.input._raw.a = false; h.step(1);
  out.earlyA = g.mode;
  for (let i = 0; i < THE_END_HOLD_FRAMES; i++) h.step(1);
  g.input._raw.a = true; h.step(1); g.input._raw.a = false; h.step(1);
  out.lateA = g.mode;
  const { flag } = await import('/src/game/progress.js');
  out.finished = flag(g.progress, 'finishedGame');
  return out;
}, CREDITS_ROLL);

for (const s of r.scenes) {
  check(`scene ${s.at}: two screens side by side`, s.pair);
  check(`scene ${s.at}: a row of screens above or below fills the top strip`, s.fill);
}
check('the ending\'s last beat goes to the credits', r.afterEnding === 'credits', r.afterEnding);
check(`the roll plays every part in order (${r.seen.join(',')})`, r.seen.join() === CREDITS_ROLL.map((_, i) => i).join());
check(`and hands over to THE END (${r.frames} frames)`, r.mode === 'theend' && r.frames < 8000, r.mode);
check('nothing in the world moves under the roll', r.playerStill);
check('THE END is the cartridge\'s sunset (orange in the middle)', r.sunset[0] > 150 && r.sunset[2] < 120, JSON.stringify(r.sunset));
check('a button straight away does not leave THE END', r.earlyA === 'theend', r.earlyA);
check('after the hold, A goes to the title', r.lateA === 'title', r.lateA);
check('the run is saved as finished', r.finished);
check('no console errors', !errors.length, errors[0]);
await browser.close(); server.close();

console.log(`\n=== ${pass} passed, ${fail.length} failed ===`);
process.exit(fail.length ? 1 : 0);
