// Real-combat boss measurement. NOT a checker — it asserts nothing and always
// exits 0. `tools/check-bosses.mjs` runs every boss fight in GOD MODE, which
// proves structure (the boss spawns, its shell opens) but says nothing about
// whether a real player survives it, by its own comment. Three sessions in a
// row measured a real (non-god-mode) fight by hand — "12 quarter-hearts, no
// god mode, seed 20260806" appears twice in docs/NEXT-SESSION.md's history —
// and rebuilt the harness from memory each time because nothing was ever
// committed. This is that harness, committed once.
//
// It plays `['boss', N]` from `tools/actor-runtime.mjs` at THREE HEARTS (12
// quarter-hearts, no god mode — "what a real player brings to D1"), and logs
// every point of damage the player takes: the frame, the amount, whether the
// source was a projectile or a body touch, the distance to the boss, and the
// boss's own `weakOpen`/`stun`/`charging` state at that instant — reconstructed
// from state alone, not from anything the actor exposes, so this measures the
// fight without changing what it measures.
//
// Usage: node tools/measure-boss-combat.mjs [dungeonId] [--god] [--budget=N]
//   --god       god mode (unlimited health) instead of the real 3-heart
//               fight — use this to ask "does more health/time help?"
//               separately from "does the player survive?". Answered once
//               already: a 60000-frame god-mode Gohmaraq run never lands a
//               hit past 14 hp, proving that fight's ceiling is the verb's
//               positioning, not the player's survivability.
//   --budget=N  frames to give the ['boss', N] step (default 9000; a
//               god-mode run asking "does it EVER win" wants far more).
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { installRuntime } from './actor-runtime.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const SEED = 20260806;
const LOW = 0, MID = 1, HIGH = 2;

// Same fights and design tide as check-bosses.mjs's FIGHTS table (kept in
// sync by hand — see that file's own comment for why each tide is right).
const FIGHTS = {
  d1: { boss: 'gohmaraq', tide: LOW, items: { sword: 1, conch: 1, anchor: 1 } },
  d2: { boss: 'anemos', tide: HIGH, items: { sword: 1, conch: 1, anchor: 1, lens: 1, bombs: 1 } },
  d3: { boss: 'gloomtide', tide: MID, items: { sword: 2, conch: 1, anchor: 1, lens: 1, bombs: 1, cleats: 1 } },
  d4: { boss: 'wyverna', tide: LOW, items: { sword: 2, conch: 1, anchor: 1, lens: 1, bombs: 1, cleats: 1, bellows: 1 } },
  d5: { boss: 'rootmaw', tide: LOW, items: { sword: 2, conch: 1, anchor: 1, lens: 1, bombs: 1, reefseed: 1 } },
  d6: { boss: 'nereth', tide: MID, items: { sword: 3, conch: 1, anchor: 1, lens: 1, bombs: 1, cleats: 2, bellows: 1, reefseed: 1, rod: 1, dredge: 1 } },
};

const args = process.argv.slice(2);
const dungeonId = args.find(a => !a.startsWith('--')) || 'd1';
const godMode = args.includes('--god');
const budgetArg = args.find(a => a.startsWith('--budget='));
const BUDGET = budgetArg ? Number(budgetArg.slice('--budget='.length)) : 9000;
const fight = FIGHTS[dungeonId];
if (!fight) { console.error(`unknown dungeon '${dungeonId}' — one of ${Object.keys(FIGHTS).join(', ')}`); process.exit(1); }

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

const { chromium } = await loadPlaywright();
const PORT = 20000 + Math.floor(Math.random() * 20000);
const server = await serve(PORT);
let browser;
try { browser = await chromium.launch({ headless: true }); }
catch (e) { browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' }); }
const page = await browser.newPage({ viewport: { width: 800, height: 720 } });
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR: ' + (e.stack || e.message)));

await page.goto(`http://localhost:${PORT}/index.html?seed=${SEED}`, { waitUntil: 'load' });
await page.waitForFunction(() => !!window.__game && !!window.__harness, { timeout: 20000 });
await page.evaluate(installRuntime);

// Instrument every point of damage taken, without touching the actor: log
// amount, source shape, distance to the boss, and the boss's own tell state
// at that instant, purely from state `dBoss` itself already reads.
await page.evaluate(async () => {
  const mod = await import('/src/game/player.js');
  const orig = mod.Player.prototype.takeDamage;
  window.__dmgLog = [];
  mod.Player.prototype.takeDamage = function (game, amount, source, o) {
    const before = game.progress.hearts;
    const r = orig.call(this, game, amount, source, o);
    const after = game.progress.hearts;
    if (after !== before) {
      const b = game.boss;
      window.__dmgLog.push({
        f: game.frame, lost: before - after,
        isProjectile: !!(source && source.isProjectile), src: source ? source.type : null,
        dist: b ? Math.round(Math.abs(b.cx - this.cx) + Math.abs(b.cy - this.cy)) : null,
        weakOpen: b ? !!b.weakOpen : null, stun: b ? b.stun : null, charging: b ? !!b.charging : null,
      });
    }
    return r;
  };
});

const info = await page.evaluate(async (id) => {
  const { dungeons } = await import('/src/world/maps.js');
  const d = dungeons().find(x => x.id === id);
  return { room: d.dungeon.bossRoom, name: d.name };
}, dungeonId);
const [fl, rx, ry] = info.room.split(',').map(Number);

console.log(`${dungeonId.toUpperCase()} ${info.name}: ${fight.boss} at ${info.room}, tide ${fight.tide}`);
console.log(godMode
  ? `GOD MODE — unlimited health, budget ${BUDGET} frames, seed ${SEED} — asks "does more time/health help?", not "is this fair"\n`
  : `REAL COMBAT — no god mode, 3 hearts (12 quarter-hearts), budget ${BUDGET} frames, seed ${SEED}\n`);

await page.evaluate(([setup, steps]) => window.__rp.beginRecord(setup, steps), [{
  seed: SEED, godMode, items: fight.items, equipA: 'sword', equipB: 'conch',
  maxHearts: 12, hearts: 12, tide: fight.tide,
  enter: [dungeonId, fl, rx, ry, 72, 80, 'up'],
}, [
  ['wait', 30],
  ['boss', BUDGET],
  ['wait', 240],
]]);

let done = false, err = null, guard = 0;
let lastHp = null, lastQh = null;
const timeline = [];
while (!done && guard++ < Math.ceil(BUDGET / 20) + 400) {
  let r;
  try { r = await page.evaluate(n => window.__rp.pump(n), 20); }
  catch (e) { err = String(e.message || e).replace(/^page\.evaluate: /, '').split('\n')[0]; break; }
  done = r.done;
  if (r.error) { err = String(r.error); break; }
  const m = await page.evaluate(() => {
    const g = window.__game; const b = g.boss;
    return { hp: b ? b.hp : null, dead: b ? b.dead : null, qh: g.progress ? g.progress.hearts : null, frame: g.frame };
  });
  if (m.hp !== lastHp || m.qh !== lastQh) { timeline.push(m); lastHp = m.hp; lastQh = m.qh; }
  if (m.qh === 0 || m.dead) break;
}

console.log('timeline (boss.hp / player quarter-hearts, on change):');
for (const t of timeline) console.log(`  f=${t.frame}  boss.hp=${t.hp}  dead=${t.dead}  player.qh=${t.qh}`);
if (err) console.log(`\ndid not finish: ${err}`);

const dmgLog = await page.evaluate(() => window.__dmgLog);
console.log('\ndamage taken by the player, in order:');
for (const d of dmgLog) console.log('  ' + JSON.stringify(d));

const final = timeline[timeline.length - 1] || {};
const startHp = timeline[0] ? timeline[0].hp : null;
console.log('\n=== SUMMARY ===');
console.log(`outcome: ${final.dead ? 'BOSS DIED' : final.qh === 0 ? 'PLAYER DIED' : `still alive after ${BUDGET} frames (never finished)`}`);
console.log(`boss damage dealt: ${startHp != null && final.hp != null ? startHp - final.hp : '?'} of ${startHp}`);
console.log(`player damage taken: ${dmgLog.reduce((s, d) => s + d.lost, 0)} quarter-hearts, in ${dmgLog.length} hits`
  + ` (${dmgLog.filter(d => d.isProjectile).length} projectile, ${dmgLog.filter(d => !d.isProjectile).length} contact)`);
console.log(`frames: ${final.frame}`);
if (errs.length) console.log('page errors: ' + errs.slice(0, 3).join(' | '));

await browser.close(); server.close();
process.exit(0);
