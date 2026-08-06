// check-build.mjs — prove dist/oracle-of-tides.html actually runs.
//
// The build succeeding says the module graph flattened; it says nothing about
// whether the result boots. This opens the built file from a real file:// URL
// (no server, so it also proves the no-server claim), lets it run for a few
// seconds, and asserts three things: nothing was logged as an error or thrown,
// the canvas is painting something other than a black rectangle, and the game
// loop advanced.

import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FILE = join(ROOT, 'dist', 'oracle-of-tides.html');
const RUN_MS = 4000;

const fail = (msg) => { console.error('check-build: FAIL — ' + msg); process.exit(1); };

if (!existsSync(FILE)) fail(`${FILE} does not exist. Run \`npm run build\` first.`);

const html = readFileSync(FILE, 'utf8');
if (/<script[^>]*\btype=["']module["']/.test(html)) {
  fail('the bundle still contains a module script; file:// blocks those');
}
if (/\bsrc\s*=\s*["'](?!data:)[^"']*\.js["']/i.test(html)) {
  fail('the bundle still references an external .js file');
}

// Prefer Playwright's own download; fall back to a system Chromium when the
// installed browser build does not match the installed playwright package
// (which is the normal state on a machine where the browser was provisioned
// separately from node_modules).
async function launch() {
  try {
    return await chromium.launch();
  } catch (err) {
    const fallback = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium';
    if (!existsSync(fallback)) {
      fail('cannot launch Chromium and no fallback binary at ' + fallback + '\n  ' + err.message);
    }
    return await chromium.launch({ executablePath: fallback });
  }
}

const browser = await launch();
const page = await browser.newPage({ viewport: { width: 900, height: 700 } });

const problems = [];
page.on('console', (msg) => { if (msg.type() === 'error') problems.push('console.error: ' + msg.text()); });
page.on('pageerror', (err) => problems.push('uncaught: ' + (err.stack || err.message)));
page.on('requestfailed', (req) => problems.push('failed request: ' + req.url()));

// Any request at all off the document is a runtime asset load we did not inline.
page.on('request', (req) => {
  if (req.url() !== pathToFileURL(FILE).href) problems.push('unexpected network/file request: ' + req.url());
});

await page.goto(pathToFileURL(FILE).href);
await page.waitForTimeout(RUN_MS);

// The page's own error overlay catches anything the shim in index.html saw.
const overlay = await page.evaluate(() => {
  const box = document.getElementById('err');
  return box && box.style.display !== 'none' ? box.textContent.trim() : '';
});
if (overlay) problems.push('on-page error overlay: ' + overlay);

const state = await page.evaluate(() => {
  const canvas = document.getElementById('screen');
  if (!canvas) return { error: 'no #screen canvas' };
  const ctx = canvas.getContext('2d');
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const seen = new Set();
  let lit = 0;
  for (let i = 0; i < data.length; i += 4) {
    seen.add((data[i] << 16) | (data[i + 1] << 8) | data[i + 2]);
    if (data[i] || data[i + 1] || data[i + 2]) lit++;
  }
  return {
    w: canvas.width,
    h: canvas.height,
    colours: seen.size,
    litFraction: lit / (data.length / 4),
    frames: window.__game ? window.__game.frameCount ?? null : null,
    mode: window.__game ? window.__game.mode : null,
    bootHidden: document.getElementById('boot')?.classList.contains('hidden') ?? false,
    hasTouchLayer: !!document.getElementById('touch'),
    touchButtons: document.querySelectorAll('#touch .tbtn').length,
  };
});

if (state.error) problems.push(state.error);
if (state.w !== 160 || state.h !== 144) problems.push(`canvas is ${state.w}x${state.h}, expected 160x144`);
if (!state.bootHidden) problems.push('the LOADING overlay never went away, so boot() did not finish');
if (state.colours < 4) problems.push(`canvas shows ${state.colours} distinct colour(s); it is not rendering`);
if (state.litFraction < 0.02) problems.push('canvas is effectively black');
if (!state.hasTouchLayer || state.touchButtons < 8) {
  problems.push(`touch control layer missing or incomplete (${state.touchButtons} buttons, expected 8)`);
}
if (state.mode == null) problems.push('window.__game was never installed');

// A second sample: the loop must still be running, not stalled on frame one.
// Game.frame ticks once per fixed 60 Hz update, so ~600ms must move it.
const before = await page.evaluate(() => window.__game?.frame ?? null);
await page.waitForTimeout(600);
const after = await page.evaluate(() => window.__game?.frame ?? null);
if (before === null || after === null) {
  problems.push('window.__game.frame is missing; the loop cannot be checked');
} else if (after <= before) {
  problems.push(`the game loop is not advancing (frame stuck at ${before})`);
}

await browser.close();

if (problems.length) fail('\n  ' + problems.join('\n  '));

console.log(
  `check-build: OK — ${FILE.replace(ROOT + '/', '')} boots from file://, ` +
  `canvas ${state.w}x${state.h} rendering ${state.colours} colours, ` +
  `mode "${state.mode}", touch layer intact, no console errors.`
);
