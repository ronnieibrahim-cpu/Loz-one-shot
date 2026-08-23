// Deterministic replay harness.
//
// A replay is a seed plus a start state plus a flat list of button masks, one
// per fixed 60 Hz update. Replaying it steps the engine exactly that many times
// with exactly those buttons and asserts the final player position, health and
// world state match what was recorded — to the pixel, by exact float equality,
// not within a tolerance. A tolerance would hide the very drift this exists to
// catch.
//
// This is the check that makes every later fidelity claim mean anything. If a
// replay diverges, the engine has non-determinism in it and no measurement of
// how the game feels can be trusted until it is found.
//
//   node tools/replay.mjs                    replay every committed replay
//   node tools/replay.mjs village-walk       replay one by name
//   node tools/replay.mjs --record <name>    re-record it from its plan
//   node tools/replay.mjs --record-all       re-record every plan
//   node tools/replay.mjs --shots            also screenshot the final frame
//   node tools/replay.mjs --headed           watch it in a real browser
//
// WHY IT CAN PROVE ANYTHING
//
// Recording runs an actor — a pathfinder and a crude swordsman — that decides
// what to press and writes down the buttons. Replaying does NOT run the actor.
// It reads the buttons back and presses them blind. So a replay that lands on
// the same pixel proves the engine reached the same state from the same seed
// and the same inputs, which is exactly the property being claimed.
//
// The wall-clock loop in main.js cannot do this: how many fixed steps it takes
// per animation frame depends on how busy the machine is. `window.__harness`
// takes the clock away from it and steps by hand. Drawing keeps running, which
// is why nothing in a draw path may consume randomness — see the screen shake
// in game.js.

import { createServer } from 'node:http';
import { readFile, readdir, stat, mkdir, writeFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PLANS } from './replay-plans.mjs';
import { installRuntime } from './actor-runtime.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const REPLAY_DIR = join(HERE, 'replays');
const SHOT_DIR = join(HERE, 'shots-replay');

const argv = process.argv.slice(2);
const WANT_SHOTS = argv.includes('--shots');
const HEADED = argv.includes('--headed');
const RECORD_ALL = argv.includes('--record-all');
const RECORD_AT = argv.indexOf('--record');
const RECORD = RECORD_AT >= 0 ? argv[RECORD_AT + 1] : null;
const NAMED = argv.filter(a => !a.startsWith('--') && a !== RECORD);

// How many frames to advance per round trip into the page. Big enough that the
// round trips are not the cost, small enough that no single evaluate() blocks
// long enough to look like a hang.
const CHUNK = 3000;

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

// ESM ignores NODE_PATH, so fall back to the global install explicitly.
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

let passed = 0;
const failures = [];
function check(name, cond, detail) {
  if (cond) { passed++; console.log('  ok   ' + name); }
  else { failures.push(name + (detail ? ' — ' + detail : '')); console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); }
}

// The page-side runtime lives in tools/actor-runtime.mjs, because
// tools/check-playthrough.mjs drives the same actor. It is serialised into the
// browser by page.evaluate below and may not close over anything from either
// file. Moving it changed no behaviour: all 51 replays still land to the pixel,
// which is the only proof of that worth having.

// ===========================================================================
// Node side
// ===========================================================================

async function listReplays() {
  await mkdir(REPLAY_DIR, { recursive: true });
  const files = (await readdir(REPLAY_DIR)).filter(f => f.endsWith('.json')).sort();
  return files.map(f => basename(f, '.json'));
}

async function newPage(browser) {
  const page = await browser.newPage({ viewport: { width: 800, height: 720 } });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + (e.stack || e.message)));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  page._errs = errs;
  return page;
}

async function prepare(page, port) {
  await page.goto(`http://localhost:${port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__game && !!window.__harness, { timeout: 20000 });
  await page.evaluate(installRuntime);
}

async function drain(page, label) {
  let r = { done: false, frames: 0 };
  let rounds = 0;
  while (!r.done) {
    r = await page.evaluate(n => window.__rp.pump(n), CHUNK);
    if (++rounds > 400) throw new Error(`${label}: exceeded ${400 * CHUNK} frames — a directive is not terminating`);
  }
  return page.evaluate(() => window.__rp.result());
}

async function record(browser, port, name) {
  const plan = PLANS[name];
  if (!plan) throw new Error(`no plan named "${name}" in tools/replay-plans.mjs`);
  const page = await newPage(browser);
  await prepare(page, port);
  await page.evaluate(([s, st]) => window.__rp.beginRecord(s, st), [plan.setup, plan.steps]);
  const res = await drain(page, name);
  const buttons = await page.evaluate(() => window.__rpButtons);

  const doc = {
    name,
    note: plan.note,
    engine: 1,
    setup: plan.setup,
    // What the run is CLAIMING, over and above replaying identically. Recorded
    // from the plan rather than from the run, so a recording that fails to make
    // the claim is caught the moment it is played back rather than baking the
    // wrong number in as the new truth.
    assert: plan.assert || null,
    span: res.span,
    buttons,
    frames: res.frames,
    input: res.input,
    trailEvery: 60,
    trail: res.trail,
    expect: res.state,
  };
  await mkdir(REPLAY_DIR, { recursive: true });
  await writeFile(join(REPLAY_DIR, name + '.json'), JSON.stringify(doc, null, 1) + '\n');
  for (const t of res.trace) {
    console.log(`    [${String(t.step).padStart(2)}] ${t.kind.padEnd(9)} f=${String(t.frame).padStart(6)} ` +
      `${t.room.padEnd(12)} (${t.x},${t.y}) hp=${t.hp} tide=${t.tide} foes=${t.foes} ` +
      `keys=${t.keys} doors=${t.doors}`);
  }
  console.log(`  recorded ${name}: ${res.frames} frames, ${res.input.length} input runs`);
  console.log(`    ends at ${doc.expect.mapId} ${doc.expect.room} (${doc.expect.x}, ${doc.expect.y}) ` +
    `hearts ${doc.expect.hearts}/${doc.expect.maxHearts} draws ${doc.expect.roomDraws}`);
  if (page._errs.length) console.log('    page errors: ' + page._errs.slice(0, 3).join(' | '));
  await page.close();
  return doc;
}

function diffState(want, got) {
  const bad = [];
  for (const k of Object.keys(want)) {
    const a = want[k], b = got[k];
    const same = Array.isArray(a) ? JSON.stringify(a) === JSON.stringify(b) : a === b;
    if (!same) bad.push(`${k}: expected ${JSON.stringify(a)}, got ${JSON.stringify(b)}`);
  }
  return bad;
}

async function replay(browser, port, name) {
  const doc = JSON.parse(await readFile(join(REPLAY_DIR, name + '.json'), 'utf8'));
  const page = await newPage(browser);
  await prepare(page, port);
  await page.evaluate(([s, r]) => window.__rp.beginReplay(s, r), [doc.setup, doc.input]);
  const res = await drain(page, name);

  console.log(`\n--- ${name} — ${doc.note || ''}`);
  console.log(`    seed ${doc.setup.seed}, ${doc.frames} frames`);
  check(`${name}: replays the same number of frames`, res.frames === doc.frames,
    `${doc.frames} -> ${res.frames}`);

  // Find the first divergence along the trail, so a failure names a frame
  // rather than just an endpoint. A run that goes wrong at frame 400 and a run
  // that goes wrong at frame 40000 look identical at the end.
  let firstBad = null;
  const n = Math.min(doc.trail.length, res.trail.length);
  for (let i = 0; i < n; i++) {
    const a = doc.trail[i], b = res.trail[i];
    if (a.x !== b.x || a.y !== b.y || a.hp !== b.hp || a.e !== b.e || a.d !== b.d || a.r !== b.r) {
      firstBad = { i, frame: a.f, want: a, got: b };
      break;
    }
  }
  check(`${name}: every checkpoint matches`, firstBad === null,
    firstBad ? `first divergence at frame ${firstBad.frame}: ` +
      `want ${JSON.stringify(firstBad.want)} got ${JSON.stringify(firstBad.got)}` : '');

  const bad = diffState(doc.expect, res.state);
  check(`${name}: final state matches to the pixel`, bad.length === 0, bad.slice(0, 6).join('; '));

  // A plan may claim something about the SHAPE of the run — how many
  // transitions fired, how far the camera travelled — on top of replaying
  // identically. Those are the claims a wide-room replay exists to make, and a
  // state diff cannot express them because the state is only the last frame.
  if (doc.assert) {
    const sbad = diffState(doc.assert, res.span);
    check(`${name}: ${Object.entries(doc.assert).map(([k, v]) => k + '=' + v).join(', ')}`,
      sbad.length === 0, sbad.join('; '));
  }
  check(`${name}: no page errors`, page._errs.length === 0, page._errs.slice(0, 3).join(' | '));

  if (WANT_SHOTS) {
    await mkdir(SHOT_DIR, { recursive: true });
    const el = await page.$('#screen');
    if (el) await el.screenshot({ path: join(SHOT_DIR, name + '.png') });
  }
  if (!HEADED) await page.close();
  return res;
}

// --------------------------------------------------------------------------

const { chromium } = await loadPlaywright();
const PORT = 20000 + Math.floor(Math.random() * 20000);
const server = await serve(PORT);
// Fall back to a system Chromium when the installed browser build does not
// match the installed playwright package (see check-build.mjs / test.mjs).
const browser = await chromium.launch({ headless: !HEADED }).catch(async (err) => {
  const { existsSync } = await import('node:fs');
  const fallback = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium';
  if (!existsSync(fallback)) throw err;
  return chromium.launch({ headless: !HEADED, executablePath: fallback });
});

if (RECORD || RECORD_ALL) {
  const names = RECORD_ALL ? Object.keys(PLANS) : [RECORD];
  console.log('\n--- recording ---');
  for (const n of names) await record(browser, PORT, n);
  console.log('\nRe-run `node tools/replay.mjs` to prove the recordings replay.');
} else {
  const names = NAMED.length ? NAMED : await listReplays();
  if (!names.length) {
    console.log('No replays in tools/replays/. Record one with --record <name>.');
  }
  for (const n of names) await replay(browser, PORT, n);
  console.log('\n=== ' + passed + ' passed, ' + failures.length + ' failed ===');
  if (failures.length) {
    console.log('\nFailures:');
    for (const f of failures) console.log('  - ' + f);
  }
}

if (!HEADED) { await browser.close(); server.close(); }
process.exit(failures.length ? 1 : 0);
