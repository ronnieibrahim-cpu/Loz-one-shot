// Boss checker. Headless, in-engine, and it is the first thing in this repo
// that has ever KILLED one.
//
// WHAT THIS PROVES, AND WHAT IT DOES NOT
//
// It runs in GOD MODE (`setup.godMode`), and that is stated on every run and in
// this comment because it changes what the green means. With god mode the
// player cannot be killed, so this says NOTHING about whether a fight is fair,
// whether three hearts is enough for Gohmaraq, or whether the damage ladder is
// tuned. It proves the STRUCTURE of every boss fight instead, which nothing in
// the repo proved before:
//
//   * the boss spawns in the room the dungeon says it does;
//   * its shell can actually be opened;
//   * its hp can actually be driven to 0 by a player holding the items that
//     dungeon hands out — true for all six as of this session (see the
//     per-fight comment below for the engine bug that made every one of them
//     unkillable past its first health-phase change);
//   * killing it marks the dungeon beaten and spawns the Essence;
//   * the Essence can be walked onto and claimed, and lands in the save.
//
// That is the difference between "the world is laid out so it could be
// finished" (check-progression.mjs, a model) and "the six fights that gate the
// ending can be finished" (this, played). Difficulty is check-hearts.mjs's job
// and is deliberately not asked here.
//
// Usage: node tools/check-bosses.mjs

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { installRuntime } from './actor-runtime.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const SEED = 20260806;

// The tide each boss is VULNERABLE at, from its own design note in
// src/data/bosses.js. This is not a convenience: several of these bosses are
// armoured at the wrong level, so a run at the wrong tide would report an
// unkillable boss and be describing the harness, not the game.
const LOW = 0, MID = 1, HIGH = 2;
const FIGHTS = [
  { id: 'd1', boss: 'gohmaraq',  tide: LOW,  why: 'drain the grotto and its drying shell holds the eye open',
    items: { sword: 1, conch: 1, anchor: 1 } },
  { id: 'd2', boss: 'anemos',    tide: HIGH, why: 'it blooms open to feed only while the water is up',
    items: { sword: 1, conch: 1, anchor: 1, lens: 1, bombs: 1 } },
  { id: 'd3', boss: 'gloomtide', tide: MID,  why: 'the sanctum current runs at MID and carries it',
    items: { sword: 2, conch: 1, anchor: 1, lens: 1, bombs: 1, cleats: 1 } },
  { id: 'd4', boss: 'wyverna',   tide: LOW,  why: 'flies at HIGH, beached and defenceless at LOW',
    items: { sword: 2, conch: 1, anchor: 1, lens: 1, bombs: 1, cleats: 1, bellows: 1 } },
  { id: 'd5', boss: 'rootmaw',   tide: LOW,  why: 'drinks and heals at HIGH; roots bared and soft at LOW',
    items: { sword: 2, conch: 1, anchor: 1, lens: 1, bombs: 1, reefseed: 1 } },
  { id: 'd6', boss: 'nereth',    tide: MID,  why: 'pins the tide per phase; break the pin to hurt him',
    items: { sword: 3, conch: 1, anchor: 1, lens: 1, bombs: 1, cleats: 2, bellows: 1,
             reefseed: 1, rod: 1, dredge: 1 } },
];

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
async function loadPlaywright() {
  let mod;
  try { mod = await import('playwright'); }
  catch (e) {
    const { execSync } = await import('node:child_process');
    const root = execSync('npm root -g', { encoding: 'utf8' }).trim();
    mod = await import(join(root, 'playwright', 'index.js'));
  }
  return mod.chromium ? mod : mod.default;
}

let passed = 0; const failures = [];
const check = (n, c, d) => c ? (passed++, console.log('  ok   ' + n))
  : (failures.push(n + (d ? ' — ' + d : '')), console.log('  FAIL ' + n + (d ? ' — ' + d : '')));

const { chromium } = await loadPlaywright();
const PORT = 20000 + Math.floor(Math.random() * 20000);
const server = await serve(PORT);
let browser;
try { browser = await chromium.launch({ headless: true }); }
catch (e) { browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' }); }
const errs = [];

console.log(`boss checker: seed ${SEED}, GOD MODE ON (structure, not difficulty)\n`);

for (const f of FIGHTS) {
  // A FRESH PAGE PER FIGHT, not one page reused for all six — cheap
  // insurance against the six fights leaking any state into each other now
  // that they actually run to completion instead of all six alike timing
  // out at 9000 frames. Tried first as the fix for a fast, sample-starved
  // Gloomtide read; it was not that (see the CHUNK comment below for the
  // real cause), but isolating each `beginRecord` in its own page is still
  // the more honest way to run six independent fights, so it stayed.
  const page = await browser.newPage({ viewport: { width: 800, height: 720 } });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + (e.stack || e.message)));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await page.goto(`http://localhost:${PORT}/index.html?seed=${SEED}`, { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__game && !!window.__harness, { timeout: 20000 });
  await page.evaluate(installRuntime);

  const info = await page.evaluate(async (id) => {
    const { dungeons } = await import('/src/world/maps.js');
    const d = dungeons().find(x => x.id === id);
    return { room: d.dungeon.bossRoom, index: d.dungeon.index, name: d.name,
             essence: d.dungeon.essence };
  }, f.id);
  const [fl, rx, ry] = info.room.split(',').map(Number);
  console.log(`--- ${f.id.toUpperCase()} ${info.name}: ${f.boss} at ${info.room} (tide ${f.tide}: ${f.why})`);

  await page.evaluate(([setup, steps]) => window.__rp.beginRecord(setup, steps), [{
    seed: SEED, godMode: true, items: f.items, equipA: 'sword', equipB: 'conch',
    maxHearts: 12, hearts: 12, tide: f.tide,
    enter: [f.id, fl, rx, ry, 72, 80, 'up'],
  }, [
    ['wait', 30],
    ['boss', 9000],
    // The Essence arrives on a delay after the death, then is walked onto.
    ['wait', 240],
    ['goto', 4, 3, 900],
    ['dialogue', 900],
    ['wait', 60],
  ]]);

  const spawned = await page.evaluate(() => {
    const g = window.__game;
    return !!(g.boss || g.entities.some(e => e.isBoss));
  });
  const maxHp = await page.evaluate(() => (window.__game.boss ? window.__game.boss.hp : 0));
  let done = false, err = null, guard = 0;
  let opened = 0, minHp = 1e9, samples = 0, reach = 0;
  // A 400-frame chunk with one sample taken at the end of it was fine while
  // every fight timed out at 9000 frames — it could not miss a fight that
  // never finished. It went blind the moment the invuln/hpPhase fix (see the
  // comment below) let a boss actually win: Gloomtide now dies inside 400
  // frames of engaging, its death animation clears within another ~70, and a
  // sample taken only once per 400-frame block can land after `g.boss` is
  // already gone — reading zero opens, zero reach, on a fight the very next
  // check down (`beaten`) reports won. Sampling in smaller chunks keeps at
  // least one sample inside the window a fast kill is still visibly fighting.
  const CHUNK = 40;
  while (!done && guard++ < 40000) {
    let r;
    try { r = await page.evaluate(n => window.__rp.pump(n), CHUNK); }
    catch (e) { err = String(e.message || e).replace(/^page\.evaluate: /, '').split('\n')[0]; break; }
    done = r.done;
    if (r.error) { err = String(r.error); break; }
    const m = await page.evaluate(() => {
      const g = window.__game; const b = g.boss, p = g.player;
      if (!b || !p) return null;
      return { wo: !!b.weakOpen, hp: b.hp,
               d: Math.abs(b.cx-p.cx) + Math.abs(b.cy-p.cy) };
    });
    if (m) { samples++; if (m.wo) opened++; if (m.d <= 24) reach++; if (m.hp < minHp) minHp = m.hp; }
  }
  console.log(`       samples ${samples}: eye open ${opened}, within sword reach ${reach}, lowest hp ${minHp === 1e9 ? '-' : minHp}`);

  const st = await page.evaluate((id) => {
    const g = window.__game;
    return {
      aliveBoss: !!(g.boss && !g.boss.dead),
      hp: g.boss ? g.boss.hp : null,
      beaten: !!(g.progress.beaten && g.progress.beaten[id]),
      essences: g.progress.essences.slice(),
      room: g.mapId + ' ' + (g.room ? g.room.key : '-'),
      frames: g.frame,
    };
  }, f.id);

  // WHAT IS ASSERTED.
  //
  //   1. The boss the dungeon DECLARES actually spawns in the room it declares.
  //   2. Its weak point OPENS during a real fight at its design tide. A shelled
  //      boss ignores every hit unless `weakOpen` fires, so a boss whose shell
  //      never opened would be unkillable — the game would be uncompletable —
  //      and every model in this repo would stay green, because none of them
  //      fights anything.
  //   3. The kill itself. This used to be deliberately NOT asserted, because
  //      `dBoss` landed real hits on some bosses and stalled at a fixed hp on
  //      every one of them past its first health-phase change — not a
  //      positioning gap, a genuine engine bug: `Boss` tracked its own combat
  //      phase in `this.phase`, the exact field `Entity.phase` uses for a
  //      level-authored tide-gate, and the moment a boss's phase index
  //      stopped matching the room's tide level `Game.updatePhaseShift`
  //      re-armed `invuln = 2` on it every single frame for the rest of the
  //      fight. Renamed to `Boss.hpPhase` in src/game/enemy.js. Every one of
  //      the six now dies outright in GOD MODE, Gloomtide included: an
  //      earlier pass here read its own "never opens" fail as a swimming
  //      problem ("at MID the player is SWIMMING and `Player.startSwing`
  //      refuses while `inDeep`, fighting it needs the Cleats' sink mode")
  //      and that diagnosis was wrong — it was the SAME invuln bug plus a
  //      second, harness-only artifact: sampling this loop once per 400
  //      frames was fine while every fight timed out at 9000 and could
  //      never be missed, and went blind the moment a fight got fast enough
  //      to start AND finish (kill, death animation, `g.boss` cleared)
  //      inside one un-sampled chunk — see the CHUNK comment above. Smaller
  //      chunks catch it: Gloomtide dies in god mode exactly like the rest.
  //   4. Killing it marks the dungeon beaten and spawns its essence.
  //
  // GOD MODE still means this proves killABILITY, not fairness: three hearts,
  // the real starting health, still loses to Gohmaraq on contact damage
  // before landing enough hits. See the STATUS comment on `dBoss` in
  // tools/actor-runtime.mjs for the measured (not guessed) numbers.
  check(`${f.id}: ${f.boss} spawns in the room ${f.id} declares (${info.room})`,
    spawned === true, `nothing with isBoss in ${info.room}`);
  check(`${f.id}: ${f.boss}'s weak point opens at tide ${f.tide}`,
    opened > 0, `never opened in ${samples} samples across the fight`);
  check(`${f.id}: ${f.boss} can be killed by a player holding what ${f.id} hands out (GOD MODE)`,
    st.beaten === true, `beaten=${st.beaten}, boss hp ${st.hp}, still alive=${st.aliveBoss}`);
  check(`${f.id}: killing it spawns essence ${info.essence} and it lands in the save`,
    !st.beaten || st.essences.includes(info.essence), `essences [${st.essences.join(',')}]`);
  console.log(`       damage dealt: ${maxHp - (minHp === 1e9 ? maxHp : minHp)} of ${maxHp} hp`
    + (err ? '  (fight did not finish)' : (st.beaten ? '  (KILLED)' : '')));
  await page.close();
}

check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
console.log(`\n=== ${passed} passed, ${failures.length} failed ===`);
console.log('NOTE: god mode was ON. All six bosses die outright now — that does not prove');
console.log('      any of the fights are FAIR at three hearts, the real starting health.');
await browser.close(); server.close();
process.exit(failures.length ? 1 : 0);
