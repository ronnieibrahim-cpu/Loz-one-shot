// THE BEATABILITY TEST — a new game driven to an Essence in the real engine,
// headless, with no developer shortcuts of any kind.
//
// WHY IT EXISTS, and this is not hypothetical. Every other tool in this repo
// proves a PART. `validate.mjs` proves the grids are well-formed;
// `walk-dungeons.mjs` floods the room graph; `check-anchor.mjs` and its six
// siblings each prove one item's rooms are closed. Between them they carry over
// seven hundred assertions and they were ALL green on a world in which four of
// the six dungeons sat behind an item found inside one of them, so the game
// could not be finished. A flood is a model, and the model does not fight a
// boss, spend a key, survive a room, or press a button.
//
// This does. It is the only thing in the repo that says the game is still a
// game once the content has moved.
//
// WHAT "NO SHORTCUTS" MEANS HERE, precisely, because it is the whole value:
//
//   * No item is granted. `tools/replay.mjs` hands its actor `{ sword, conch,
//     shield }` in a `setup` block, which is correct for a replay — a replay
//     starts from a STATED world state — and is exactly what this may not do.
//     Everything the run holds at the end was picked up, opened or handed over
//     by a cutscene during the run, and the audit below prints the frame each
//     one arrived on.
//   * No warp. There is no `enterMap` anywhere in this file. The run walks.
//   * No flag is set from outside, no key is added, no door is opened, no
//     tide level is assigned. The conch is sounded by pressing the conch.
//   * No heart is added. `d1-descent` plays on twenty hearts and says plainly
//     why — the scripted swordsman eats contact damage a human would step out
//     of — and this runs on the three a new game actually starts with. If that
//     is not survivable, that is a FINDING, not a number to raise.
//
// The one thing that IS pinned is the seed, via `?seed=` on the URL, which sets
// `game.seedOverride` and is read by the `newGame` the title screen itself
// calls. That touches no progress and grants nothing; without it `newProgress`
// falls back to `Date.now()` and the harness plays a different world every run
// — the defect P2 root-caused in test.mjs and check-gates.mjs re-learned.
//
// WHAT IT PROVES, in one run:
//   * how far a new game gets with nothing handed to it
//   * every item the run ends with was acquired during the run
//   * a Small Key was earned and spent on a locked door
//   * the run never reloaded a save and health never reached zero
//   * zero console errors and zero unresolved tiles for the whole run
//   * it is deterministic: the tape is replayed blind and lands to the pixel
//
// AND WHAT IT FOUND ON ITS FIRST RUN, which is the reason it exists:
//
//   THE GAME CANNOT BE FINISHED. D1 puts two locked doors between a new game
//   and the Tidewright's Anchor, and only one of the two Small Keys that open
//   them can be obtained. The other is the Switch Room's, behind two `hold`
//   floor switches that want both blocks pushed onto them at once — and NO
//   PUSH BLOCK IN THIS GAME CAN BE PUSHED. `Entity.solid` is documented on the
//   field as "blocks the player like a pushable block" and nothing in the
//   movement path reads it: `canOccupy` samples tiles only. So the player walks
//   through the block, `Player.tryPush` never fires (it needs a movement HIT),
//   and the key never appears.
//
//   `solve-switches.mjs` reports all nine switch rooms "solvable by pushing"
//   and `walk-dungeons.mjs` counts the key as available, because both model a
//   push that the engine cannot perform. That is precisely the gap between a
//   model and a game, and it is why a flood cannot close this item.
//
//   The fix is small to write and NOT small to land: teaching `canOccupy` about
//   solid entities was tried on this branch and moves the recorded baseline —
//   d1-descent ends up dead on the overworld, d2-fork-wrong diverges by frame
//   240. Every replay would need re-recording and every checker re-verifying,
//   which is its own session. So this file reports the blocker instead of
//   working around it, and asserts it is still exactly where it was.
//
//   node tools/check-playthrough.mjs            run, verify, and replay the tape
//   node tools/check-playthrough.mjs --record   re-record the tape from the route
//   node tools/check-playthrough.mjs --trace    print the per-directive trace
//   node tools/check-playthrough.mjs --headed   watch it in a real browser
//
// SCOPE. This is step (a) of the brief's staged plan: new game to D1's Essence.
// The route reaches the Locked Stair and stops there because the world stops
// there. When the blocker is fixed, `GOAL.blocked` in tools/playthrough-route.mjs
// comes out and the Essence assertions go live on their own.

import { createServer } from 'node:http';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { installRuntime } from './actor-runtime.mjs';
import { ROUTE, SEED, GOAL } from './playthrough-route.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
// Its OWN directory, not tools/replays/. `replay.mjs` treats every .json in
// that folder as a replay and boots it through `beginReplay(doc.setup, ...)`;
// a playthrough tape has no `setup` — having none is the whole point of it —
// so dropping it in there takes all 51 replays down with a TypeError.
const TAPE_DIR = join(HERE, 'playthroughs');
const TAPE = join(TAPE_DIR, 'playthrough-d1.json');

const argv = process.argv.slice(2);
const RECORD = argv.includes('--record');
const TRACE = argv.includes('--trace');
const HEADED = argv.includes('--headed');

// How many frames to advance per round trip into the page. Big enough that the
// round trips are not the cost, small enough that no single evaluate() blocks
// long enough to look like a hang. Same number replay.mjs uses.
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
  else { failures.push(name + (detail ? ' — ' + detail : '')); console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); }
}

// ---------------------------------------------------------------- the driver

async function newPage(browser) {
  const page = await browser.newPage({ viewport: { width: 800, height: 720 } });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + (e.stack || e.message)));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  page._errs = errs;
  return page;
}

async function prepare(page, port) {
  // The seed goes on the URL, not into progress. See the header.
  await page.goto(`http://localhost:${port}/index.html?seed=${SEED}`, { waitUntil: 'load' });
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

// ------------------------------------------------------------------ the run

const { chromium } = await loadPlaywright();
const PORT = 20000 + Math.floor(Math.random() * 20000);
const server = await serve(PORT);
const browser = await chromium.launch({ headless: !HEADED });

console.log(`playthrough: seed ${SEED}, ${ROUTE.length} directives, target: the Essence of Tidewash Grotto\n`);

const page = await newPage(browser);
await prepare(page, PORT);
await page.evaluate(steps => window.__rp.beginPlaythrough(steps), ROUTE);
const run = await drain(page, 'playthrough');

if (TRACE) {
  console.log('  --- trace ---');
  for (const t of run.trace) {
    console.log(`  ${String(t.step).padStart(3)} ${t.kind.padEnd(9)} f${String(t.frame).padStart(6)} `
      + `${t.room.padEnd(12)} ${String(t.x).padStart(4)},${String(t.y).padStart(3)} `
      + `hp ${t.hp} tide ${t.tide} foes ${t.foes} keys ${t.keys} doors ${t.doors}`);
  }
  console.log('  -------------');
}

const s = run.state, a = run.audit;
console.log(`  ran ${run.frames} frames, ${run.span.roomChanges} room changes, `
  + `${a.rooms.length} distinct rooms, ended in ${s.mapId}/${s.room} mode "${s.mode}"`);
console.log(`  items at the end: ${s.items.join(', ') || '(none)'}`);
console.log(`  acquired: ${a.gained.map(g => `${g.id}@f${g.frame}`).join(', ') || '(nothing)'}`);
console.log(`  hearts: ended ${s.hearts}/${s.maxHearts}, low-water mark ${a.minHearts}, deaths ${a.deaths}`);
console.log(`  essences: [${s.essences.join(', ')}]  keys spent on doors: ${s.doorsChanged}  chests: ${s.chestsOpened}\n`);

// --- 1. how far a new game gets ---------------------------------------------
//
// The target is the Essence, and the run does not reach it, because the game
// cannot currently be finished — `GOAL.blocked` in the route file names the
// reason. So this asserts the two things that are both true and both worth
// keeping: the run gets as far as the world allows, and the blocker is still
// exactly the blocker. Lowering the target quietly to whatever passes is how a
// suite ends up green on an unfinishable world, which is the failure this whole
// harness was written to catch, so the miss is printed every run.

if (GOAL.blocked) {
  console.log('  !! THE GAME CANNOT BE FINISHED. The run stops at ' + GOAL.room + '.');
  console.log('  !! blocked on: ' + GOAL.blocked.what);
  console.log('  !! because: ' + GOAL.blocked.why);
  console.log(`  !! ${GOAL.blocked.keysNeeded} Small Keys stand between a new game and the Anchor; `
    + `${GOAL.blocked.keysObtainable} can be obtained.\n`);
}

const ended = `${s.mapId}/${s.room}`;
check('the run gets as far as the world currently allows (' + GOAL.room + ')',
  ended === GOAL.room, `stopped in ${ended}`);

if (GOAL.blocked) {
  // The blocker, proved by the run rather than reasoned about. The route leans
  // on both of the Switch Room's blocks for 120 frames each; if either ever
  // moves, the engine has gained entity collision and this harness should be
  // re-pointed at the boss room.
  check('...and the blocker is still the blocker: no push block ever moved',
    a.blocksMoved === 0 && a.blocksTouched >= 2,
    `${a.blocksMoved} of ${a.blocksTouched} blocks moved`);
  check('...so the second Small Key never arrives', s.keys === 0 && s.doorsChanged === 1,
    `keys in hand ${s.keys}, doors opened ${s.doorsChanged}`);
  check('the Essence is NOT reached, and that is the finding',
    !s.essences.includes(GOAL.essence), `essences [${s.essences.join(',')}]`);
} else {
  check('the run claims the Essence of Tidewash Grotto',
    s.essences.includes(GOAL.essence), `essences [${s.essences.join(',')}]`);
}

// --- 2. nothing was handed to it -------------------------------------------
//
// The strongest assertion in the file, and the one that makes every other one
// mean something. The harness grants nothing, so the inventory at the end is a
// list of things the run went and got — and each has a frame, so an item that
// somehow appeared at frame 0 would be visible as exactly that.

const intro = a.gained.filter(g => g.frame <= 600).map(g => g.id).sort();
check('the run starts empty and is given the conch and the sword by the intro',
  intro.join(',') === 'conch,sword', `first items: ${intro.join(',') || '(none)'}`);
check('every item the run ends with was acquired during the run',
  s.items.every(id => a.gained.some(g => g.id === id)),
  `unaccounted: ${s.items.filter(id => !a.gained.some(g => g.id === id)).join(',')}`);

// --- 3. the dungeon was actually played ------------------------------------

check('the run earned a Small Key and spent it on a locked door',
  s.doorsChanged >= 1 && a.gained.length >= 2, `doors ${s.doorsChanged}`);
check('the run opened chests', s.chestsOpened >= 1, `chests ${s.chestsOpened}`);
check('the run killed things', s.kills >= 5, `kills ${s.kills}`);
check('the run walked the overworld before the dungeon',
  a.rooms.some(r => r.startsWith('overworld/')) && a.rooms.some(r => r.startsWith('d1/')),
  a.rooms.slice(0, 4).join(' '));

// --- 4. it was never soft-locked -------------------------------------------
//
// The cheap version the brief asks for, and it is cheap on purpose: proving "no
// state cannot be left" in general is not something a single run can do. What a
// single run CAN say is that this one never had to be rescued. A death reloads
// from the last respawn, and a save reload re-enters mode 'title' — so both are
// visible in a trace of the modes the run passed through.

check('health never reached zero', a.minHearts > 0, `low-water mark ${a.minHearts}`);
check('the run never died', a.deaths === 0, `deaths ${a.deaths}`);
check('the run never returned to the title screen',
  a.modes.filter(m => m === 'title').length <= 1, `modes: ${a.modes.join(' -> ')}`);

// --- 5. it was clean -------------------------------------------------------

check('no console errors for the whole run', page._errs.length === 0, page._errs.slice(0, 3).join(' | '));

const unresolved = await page.evaluate(async () => {
  // Both registries live in gfx/art.js — `tiles` and `sprites`. They record
  // every name that was asked for and could not be drawn, so this is "did the
  // whole run ever draw a hole", not "does the data look complete".
  const art = await import('/src/gfx/art.js');
  return {
    tiles: [...(art.tiles.missing || [])],
    sprites: [...(art.sprites.missing || [])],
  };
});
check('no unresolved tiles were drawn during the run',
  unresolved.tiles.length === 0, unresolved.tiles.slice(0, 5).join(','));
check('no unresolved sprites were drawn during the run',
  unresolved.sprites.length === 0, unresolved.sprites.slice(0, 5).join(','));

// --- 6. it is a tape, and the tape replays ---------------------------------
//
// The determinism half, and it is the same argument tools/replay.mjs makes:
// recording runs the actor, replaying does NOT. The tape is pressed back blind
// and has to land on the same pixel with the same RNG draw counts. If it does
// not, the engine has non-determinism in it and nothing above can be trusted.

await mkdir(TAPE_DIR, { recursive: true });
const tape = {
  note: 'A new game driven to the Essence of Tidewash Grotto with no shortcuts. '
    + 'Recorded by tools/check-playthrough.mjs; see its header for what "no shortcuts" means.',
  seed: SEED,
  frames: run.frames,
  state: run.state,
  span: run.span,
  audit: run.audit,
  input: run.input,
};
const before = await readFile(TAPE, 'utf8').catch(() => null);
if (RECORD || !before) {
  await writeFile(TAPE, JSON.stringify(tape, null, 1) + '\n');
  console.log(`  ${before ? 're-recorded' : 'recorded'} ${TAPE} (${run.input.length} runs, ${run.frames} frames)`);
}

const rpage = await newPage(browser);
await prepare(rpage, PORT);
await rpage.evaluate(rle => window.__rp.beginPlaythroughReplay(rle), tape.input);
const back = await drain(rpage, 'playthrough-replay');

check('the tape replays the same number of frames',
  back.frames === run.frames, `${back.frames} vs ${run.frames}`);
const drift = Object.keys(run.state).filter(k =>
  JSON.stringify(back.state[k]) !== JSON.stringify(run.state[k]));
check('the tape replays to the pixel, blind', drift.length === 0,
  drift.map(k => `${k}: ${JSON.stringify(back.state[k])} != ${JSON.stringify(run.state[k])}`).slice(0, 4).join(' | '));
check('the replay took the same route', back.span.roomChanges === run.span.roomChanges,
  `${back.span.roomChanges} vs ${run.span.roomChanges}`);
check('the replay hit no console errors', rpage._errs.length === 0, rpage._errs.slice(0, 3).join(' | '));

// ---------------------------------------------------------------------------

console.log(`\n=== ${passed} passed, ${failures.length} failed ===`);
await browser.close(); server.close();
process.exit(failures.length ? 1 : 0);
