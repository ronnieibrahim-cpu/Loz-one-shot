// THE BEATABILITY TEST — a new game driven to two Essences in the real
// engine, headless, with no developer shortcuts of any kind.
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
//   * No warp. There is no `enterMap` anywhere in this file. The run walks —
//     out of Tidewash Grotto, across the overworld, and into the Coral Spire,
//     the same as into and through each dungeon.
//   * No flag is set from outside, no key is added, no door is opened, no
//     tide level is assigned. The conch is sounded by pressing the conch.
//   * No heart is added by this file. The run DOES buy one from the Tidewatch
//     Shop with rupees it earned — that is a real in-game action available to
//     any player, not a shortcut, and D1's own boss fight leaves no margin for
//     the overworld crossing that follows it without one. Past that: `d1-descent`
//     plays on twenty hearts and says plainly why — the scripted swordsman
//     eats contact damage a human would step out of — and everything else
//     runs on whatever health was actually earned. If a stretch is not
//     survivable on that, that is a FINDING, not a number to raise.
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
//   * Small Keys were earned and spent on locked doors, in both dungeons
//   * two bosses were beaten in real combat, at a health budget that was
//     MEASURED rather than assumed (Anemos alone needs a full 40
//     quarter-hearts of survived damage against the current `dBoss` verb —
//     see the comment on the Anemos fight in `tools/playthrough-route.mjs`)
//   * the run never reloaded a save and health never reached zero
//   * zero console errors and zero unresolved tiles for the whole run
//   * it is deterministic: the tape is replayed blind and lands to the pixel
//
// WHAT ITS FIRST RUN FOUND, kept because the shape of the trap recurs: D1
// alone could not be finished at all, because no push block in the game
// could be pushed (`Entity.solid` was documented but nothing in the movement
// path read it) — fixed in `0b68e6b`. Extending past D1 into D2 found the
// same CLASS of gap one level up: nothing had ever asked whether the game
// could be finished ACROSS a dungeon boundary, and D1's own boss fight
// leaving no margin for the overworld immediately after it was invisible to
// every tool that only ever measured D1 alone (`docs/NEXT-SESSION.md` S40
// has the full account — the Tidewatch Shop purchase above is the fix).
//
//   node tools/check-playthrough.mjs            run, verify, and replay the tape
//   node tools/check-playthrough.mjs --record   re-record the tape from the route
//   node tools/check-playthrough.mjs --trace    print the per-directive trace
//   node tools/check-playthrough.mjs --headed   watch it in a real browser
//
// SCOPE. New game to D2's Essence — Tidewash Grotto and the Coral Spire, in
// order, nothing granted. `GOAL` in `tools/playthrough-route.mjs` names
// exactly where the run currently stops and what would need to change to
// extend it: four dungeons, the Coastwise Chain and four bosses are still
// unrouted past this point.

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
// Renamed from `playthrough-d1.json`: the tape now covers both dungeons, and
// the old name would have quietly stopped meaning what it said. `--record`
// on a stale D1-only tape from before this rename writes the new file
// fresh; nothing reads the old one any more.
const TAPE = join(TAPE_DIR, 'playthrough.json');

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

// ------------------------------------------------------------ health economy
//
// The instrument the health-economy session asked for: every room boundary,
// hearts in and out, damage taken, healing found — plus the three worst
// stretches, judged against the source games' curve (docs/EXECUTION-PLAN.md
// P9: 3 hearts at start, half-heart contact damage, 14-16 at cap), not
// against whether this particular scripted swordsman survives.

const qh = (n) => {
  const h = n / 4;
  return Number.isInteger(h) ? String(h) : h.toFixed(2).replace(/0$/, '');
};

function printHealthTable(rows, maxHearts) {
  if (!rows || !rows.length) return;
  console.log(`  --- health at every room boundary (quarter-hearts; ${qh(maxHearts)} hearts max) ---`);
  console.log('   room                    frames      in   out   min   dmg  heal');
  for (const r of rows) {
    console.log(`   ${r.room.padEnd(22)} ${String(r.enterFrame).padStart(6)}-${String(r.exitFrame).padEnd(6)} `
      + `${String(r.enterHearts).padStart(5)} ${String(r.exitHearts).padStart(5)} ${String(r.minHearts).padStart(5)} `
      + `${String(r.damage).padStart(5)} ${String(r.healing).padStart(5)}`);
  }
  console.log('  ------------------------------------------------------------------\n');
}

/**
 * The three worst stretches the brief asks for, computed from the same table
 * rather than eyeballed: the longest run of rooms with no healing anywhere in
 * them (a drought, in frames), the deepest trough any single room produced,
 * and every room that alone cost more than a third of the cap (P9's "half a
 * heart from an ordinary enemy" means a third of a 12-quarter-heart start is
 * three ordinary hits without a single one missed — a room that costs that on
 * its own is a spike, not a curve).
 */
function worstStretches(rows, maxHearts) {
  if (!rows || !rows.length) return null;
  let droughtFrames = 0, droughtStart = null, bestDrought = { frames: 0, from: null, to: null };
  for (const r of rows) {
    if (r.healing === 0) {
      if (droughtStart === null) droughtStart = r;
      droughtFrames += (r.exitFrame - r.enterFrame);
    } else {
      if (droughtFrames > bestDrought.frames) bestDrought = { frames: droughtFrames, from: droughtStart, to: r };
      droughtFrames = 0; droughtStart = null;
    }
  }
  if (droughtFrames > bestDrought.frames) bestDrought = { frames: droughtFrames, from: droughtStart, to: rows[rows.length - 1] };

  let trough = rows[0];
  for (const r of rows) if (r.minHearts < trough.minHearts) trough = r;

  const third = maxHearts / 3;
  const spikes = rows.filter(r => r.damage >= third).sort((a, b) => b.damage - a.damage);

  return { drought: bestDrought, trough, spikes };
}

function printWorstStretches(rows, maxHearts, label) {
  const w = worstStretches(rows, maxHearts);
  if (!w) return;
  console.log(`  --- worst stretches${label ? ' (' + label + ')' : ''} ---`);
  console.log(`  longest run with no heal available: ${w.drought.frames} frames`
    + (w.drought.from ? `, ${w.drought.from.room} through ${w.drought.to.room}` : ''));
  console.log(`  deepest trough: ${w.trough.minHearts}/${maxHearts} qh in ${w.trough.room}`);
  if (w.spikes.length) {
    console.log(`  room(s) costing >1/3 of max (${qh(maxHearts / 3)} hearts):`);
    for (const s of w.spikes) console.log(`    ${s.room}: ${s.damage} qh (${qh(s.damage)} hearts)`);
  } else {
    console.log('  no single room cost more than a third of max hearts.');
  }
  console.log('');
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
// Prefer Playwright's own download; fall back to a system Chromium when the
// installed browser build does not match the installed playwright package
// (see check-build.mjs / test.mjs, which have carried this fallback for a
// while — this file didn't, and died on launch before loading a line of
// game code in exactly that environment).
const browser = await chromium.launch({ headless: !HEADED }).catch(async (err) => {
  const { existsSync } = await import('node:fs');
  const fallback = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium';
  if (!existsSync(fallback)) throw err;
  return chromium.launch({ headless: !HEADED, executablePath: fallback });
});

console.log(`playthrough: seed ${SEED}, ${ROUTE.length} directives, target: the Essences of Tidewash Grotto and the Coral Spire\n`);

const page = await newPage(browser);
await prepare(page, PORT);
await page.evaluate(steps => window.__rp.beginPlaythrough(steps), ROUTE);
// A directive that throws inside the page loses the whole trace with it, and
// the trace is the only thing that says WHERE the run stopped being the run.
// So catch it, print what the actor got through, and then rethrow.
let run;
try {
  run = await drain(page, 'playthrough');
} catch (e) {
  const t = await page.evaluate(() => (window.__rp.result ? window.__rp.result().trace : [])).catch(() => []);
  console.log('  --- trace up to the throw ---');
  for (const x of (t || [])) {
    console.log(`  ${String(x.step).padStart(3)} ${x.kind.padEnd(9)} f${String(x.frame).padStart(6)} `
      + `${x.room}  ${x.x},${x.y} hp ${x.hp} tide ${x.tide} foes ${x.foes} keys ${x.keys}`);
  }
  throw e;
}

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

printHealthTable(a.roomHealth, s.maxHearts);
printWorstStretches(a.roomHealth, s.maxHearts);

// --- 1. how far a new game gets ---------------------------------------------
//
// This assertion has been a stopping point three times now — first the
// Sluicegate, then the Iron Pipe's far side, each time naming a verb the
// ACTOR did not have rather than a bug in the game; then D1's own boss fight
// leaving the run too low on health to survive the overworld crossing into
// D2, which was a real gap in the WORLD rather than in the actor (see
// `docs/NEXT-SESSION.md` S40). A run that reaches GOAL.room without both of
// GOAL.essences has fought a boss and lost; a run that stops short has
// broken somewhere earlier, and the room table above says where.

if (GOAL.needsVerb) {
  console.log(`  !! the route stops at ${GOAL.room}: the actor has no directive for `
    + `"${GOAL.needsVerb}", not a game blocker.\n`);
}

const ended = `${s.mapId}/${s.room}`;
check('the run gets as far as the route currently drives it (' + GOAL.room + ')',
  ended === GOAL.room, `stopped in ${ended}`);
check(`the run earned all ${GOAL.keysObtainable} Small Keys and spent them on locked doors`,
  s.doorsChanged >= GOAL.keysObtainable && a.blocksMoved >= 4,
  `doors ${s.doorsChanged}, blocks moved ${a.blocksMoved}`);
check('THE ESSENCES OF TIDEWASH GROTTO AND THE CORAL SPIRE ARE BOTH TAKEN',
  GOAL.essences.every(i => s.essences.includes(i)), `essences [${s.essences.join(',')}]`);
check('both bosses were beaten in real combat, with nothing granted',
  !!(s.beaten && s.beaten.d1 && s.beaten.d2), `beaten ${JSON.stringify(s.beaten || {})}`);
check('the run completed a second Heart Container mid-D2, on top of D1\'s own',
  s.maxHearts >= 20, `maxHearts ${s.maxHearts}`);

// --- 2. nothing was handed to it -------------------------------------------
//
// The strongest assertion in the file, and the one that makes every other one
// mean something. The harness grants nothing, so the inventory at the end is a
// list of things the run went and got — and each has a frame, so an item that
// somehow appeared at frame 0 would be visible as exactly that.
//
// ONE EXCEPTION, DELIBERATE AND NAMED: the run spends rupees it earned at the
// Tidewatch Shop for one Heart. That is not an item grant — `heal()` adds
// quarter-hearts, it never touches `progress.items` — and it costs the run
// something real (10 rupees) rather than materialising for free, which is
// exactly the line "nothing was handed to it" means to hold.

const intro = a.gained.filter(g => g.frame <= 600).map(g => g.id).sort();
check('the run starts empty and is given the conch and the sword by the intro',
  intro.join(',') === 'conch,sword', `first items: ${intro.join(',') || '(none)'}`);
check('every item the run ends with was acquired during the run',
  s.items.every(id => a.gained.some(g => g.id === id)),
  `unaccounted: ${s.items.filter(id => !a.gained.some(g => g.id === id)).join(',')}`);

// --- 3. both dungeons were actually played ---------------------------------

check('the run collected D1\'s Dungeon Map and Chartstone',
  !!(s.dungeonMaps && s.dungeonMaps.d1) && !!(s.charts && s.charts.d1),
  `dungeonMaps ${JSON.stringify(s.dungeonMaps)}, charts ${JSON.stringify(s.charts)}`);
check('the run opened chests', s.chestsOpened >= 1, `chests ${s.chestsOpened}`);
check('the run killed things', s.kills >= 5, `kills ${s.kills}`);
check('the run walked the overworld before each dungeon',
  a.rooms.some(r => r.startsWith('overworld/')) && a.rooms.some(r => r.startsWith('d1/'))
    && a.rooms.some(r => r.startsWith('d2/')),
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
  note: 'A new game driven to the Essences of Tidewash Grotto and the Coral Spire '
    + 'with no shortcuts. Recorded by tools/check-playthrough.mjs; see its header '
    + 'for what "no shortcuts" means.',
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
