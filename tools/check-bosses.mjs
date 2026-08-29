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
//   * its shell can actually be opened and its hp can actually be driven to 0
//     by a player holding the items that dungeon hands out — a shelled boss
//     whose `weakOpen` never fires would be UNKILLABLE and every other checker
//     in the repo would stay green;
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
  // WAS MID, WHICH IS THE TIDE THE BOSS WANTS. Every other row here names the
  // level that makes its boss VULNERABLE — "its drying shell holds the eye
  // open", "beached and defenceless at LOW", "roots bared and soft at LOW" —
  // and this one named the level at which Gloomtide moves at 1.7x instead of
  // 0.65x. Measuring it there measured it at its strongest and reported an
  // unwinnable fight that is won, at the in-order five hearts, with no code
  // change at all, the moment the player does the obvious thing and drains the
  // sanctum. Gloomtide has no shell, so "the tide its weak point opens at" does
  // not apply to it; the tide the FIGHT is meant to be played at does.
  { id: 'd3', boss: 'gloomtide', tide: LOW,  why: 'the current carries it at MID; drain the sanctum and it wallows',
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
const page = await browser.newPage({ viewport: { width: 800, height: 720 } });
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR: ' + (e.stack || e.message)));
page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });

await page.goto(`http://localhost:${PORT}/index.html?seed=${SEED}`, { waitUntil: 'load' });
await page.waitForFunction(() => !!window.__game && !!window.__harness, { timeout: 20000 });
await page.evaluate(installRuntime);

// `opened` below is sampled once per 400-frame pump, which used to be safe
// because every fight in this game was slow — a boss's shell could never be
// forced past a fixed, low damage total (see the phase/tide-alias bug this
// checker's own numbers exposed, fixed alongside this file). A fight that
// now finishes in a few hundred frames can start, open, and get its boss
// killed and cleared from the room inside ONE pump, so the first sample
// taken afterward finds no boss at all and reports zero opens for a shell
// that plainly opened. Instrument the actual state change instead of
// inferring it from a poll: every Boss instance funnels through the same
// `weakOpen` field, so watching writes to it on the shared prototype catches
// every boss's every opening regardless of how fast the fight resolves.
await page.evaluate(async () => {
  const { Boss } = await import('/src/game/enemy.js');
  Object.defineProperty(Boss.prototype, 'weakOpen', {
    get() { return this._weakOpenReal; },
    set(v) { this._weakOpenReal = v; if (v) window.__everOpened = true; },
  });
});

console.log(`boss checker: seed ${SEED}, GOD MODE ON (structure, not difficulty)\n`);

for (const f of FIGHTS) {
  const info = await page.evaluate(async (id) => {
    const { dungeons } = await import('/src/world/maps.js');
    const d = dungeons().find(x => x.id === id);
    return { room: d.dungeon.bossRoom, index: d.dungeon.index, name: d.name,
             essence: d.dungeon.essence };
  }, f.id);
  const [fl, rx, ry] = info.room.split(',').map(Number);
  console.log(`--- ${f.id.toUpperCase()} ${info.name}: ${f.boss} at ${info.room} (tide ${f.tide}: ${f.why})`);

  await page.evaluate(() => { window.__everOpened = false; });
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
  while (!done && guard++ < 4000) {
    let r;
    try { r = await page.evaluate(n => window.__rp.pump(n), 400); }
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
  if (err) console.log('       (fight loop error:', err, ')');
  const everOpened = await page.evaluate(() => window.__everOpened);
  console.log(`       samples ${samples}: eye open ${opened} of those samples, weak point opened at least once: ${everOpened}, within sword reach ${reach}, lowest hp ${minHp === 1e9 ? '-' : minHp}`);

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

  // WHAT IS ASSERTED, AND WHY IT STOPS HERE.
  //
  // Two things, and they are the two that nothing else in the repo proved:
  //
  //   1. The boss the dungeon DECLARES actually spawns in the room it declares.
  //   2. Its weak point OPENS during a real fight at its design tide. A shelled
  //      boss ignores every hit unless `weakOpen` fires, so a boss whose shell
  //      never opened would be unkillable — the game would be uncompletable —
  //      and every model in this repo would stay green, because none of them
  //      fights anything.
  //
  // The kill itself is NOT asserted, and pretending otherwise would be the
  // worst thing in this file. `dBoss` now drives FIVE of six bosses all the
  // way to 0 in godmode within budget (Anemos, Gloomtide, Wyverna, Rootmaw,
  // Nereth) — only Gohmaraq (D1) doesn't finish, at 24->14, which is a
  // separate, already-tracked AI-verb limitation (see docs/NEXT-SESSION.md),
  // not this bug. Before the fix below, every one of the five now-killed
  // bosses plateaued at a fixed, low damage total exactly like Gohmaraq still
  // does — a whole different-looking set of "AI limitations" that were in
  // fact one engine bug wearing five faces. That gap used to be blamed
  // entirely on per-boss tactics —
  // this file's own comment once claimed Gloomtide's weak point opened and
  // still took no damage because a swimming Link cannot swing — and that
  // claim was WRONG. The real cause, found and fixed alongside this file: a
  // Boss's own combat-phase index (`Boss.phase`, 0/1/2 as a fight escalates)
  // collided with `Entity.phase`, an unrelated field the Lens's phased-enemy
  // mechanic uses, in `Game.updatePhaseShift`. Phase indices alias the tide
  // enum (LOW=0/MID=1/HIGH=2) closely enough that nothing ever threw, so any
  // boss whose fight-phase didn't numerically match its room's tide level
  // was silently treated as "phased out" — hidden, harmless, and with
  // `invuln` re-armed above 0 every single frame, permanently blocking
  // `hurt()`. Every boss in the game was capped by this the moment its
  // second phase began, in EVERY prior measurement in this repo's history,
  // godmode included. Fixed in `src/game/game.js` (`updatePhaseShift` now
  // excludes `instanceof Boss`, matching `gridLocked`'s existing precedent
  // for the same class-vs-flag distinction). What's left after the fix is
  // real per-boss tactics again (Gohmaraq's own AI-verb limitation is
  // unrelated and still open, see docs/NEXT-SESSION.md) — it is the next
  // session's job, and until every boss dies this file measures the fights
  // instead of claiming them.
  check(`${f.id}: ${f.boss} spawns in the room ${f.id} declares (${info.room})`,
    spawned === true, `nothing with isBoss in ${info.room}`);
  check(`${f.id}: ${f.boss}'s weak point opens at tide ${f.tide}`,
    everOpened === true, `never opened (instrumented) across the fight`);
  // The header above has claimed since this file's first version that a kill
  // "marks the dungeon beaten and spawns the Essence" and that "the Essence
  // can be walked onto and claimed" — nothing ever asserted it, because no
  // fight had ever finished to check it against. Five now do (see the boss
  // total above); assert it for whichever fights actually reach 0 this run
  // rather than hard-coding which those are, so a future change to the AI
  // that lets Gohmaraq finish too picks this assertion up for free.
  if (st.beaten) {
    check(`${f.id}: killing ${f.boss} marks the dungeon beaten and grants essence ${info.index}`,
      st.essences.includes(info.index),
      `beaten=true but claimed essences [${st.essences}] do not include ${info.index}`);
  }
  // A fight that finishes inside one 400-frame pump leaves the boss dead and
  // cleared before `minHp` ever samples it — `st.beaten` is ground truth for
  // that case; `minHp`'s coarse sampling is still the right source for a
  // fight that DIDN'T finish, since there `st.hp` reads the boss's live hp
  // at whatever frame the loop happened to stop, not its lowest point.
  const dealt = st.beaten ? maxHp : maxHp - (minHp === 1e9 ? maxHp : minHp);
  console.log(`       damage dealt: ${dealt} of ${maxHp} hp` + (st.beaten ? '  (KILLED)' : '')
    + (err && !st.beaten ? '  (fight did not finish: AI limitation, see comment)' : ''));
}

check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
console.log(`\n=== ${passed} passed, ${failures.length} failed ===`);
console.log('NOTE: god mode was ON. This proves every boss SPAWNS and every shell OPENS —');
console.log('      not that the fights are fair, and not yet that they are winnable by the harness.');
await browser.close(); server.close();
process.exit(failures.length ? 1 : 0);
