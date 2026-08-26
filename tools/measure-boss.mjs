// Measure a boss fight in REAL COMBAT — no god mode, a real player's health
// total — and report exactly what landed, what was taken, and from what
// source. `check-bosses.mjs` proves STRUCTURE (spawns, shell opens) under
// god mode by design and says nothing about difficulty; this is the tool for
// the question god mode cannot answer, because god mode's `p.invuln` sits at
// 600 forever and every boss's contact/ranged damage is a no-op under it.
//
// It hooks `Player.prototype.takeDamage` and `Boss.prototype.hurt` directly,
// rather than polling `boss.hp`/`progress.hearts` between pumps — polling
// undercounts two hits landing within the same poll window as one. This is
// how "5 hits landed, identical to the frame" was told apart from "4 hits
// landed, close enough to look the same" across two sessions of tuning
// `tools/actor-runtime.mjs`'s `dBoss` (see docs/NEXT-SESSION.md).
//
// Usage: node tools/measure-boss.mjs [id] [hearts] [seed]
//   id      dungeon id, default d1 (gohmaraq) — the only fight under active
//           tuning as of this tool's introduction
//   hearts  starting/max quarter-hearts, default 12 (3 hearts)
//   seed    default 20260806, the repo's one deterministic seed

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { installRuntime } from './actor-runtime.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

const LOW = 0, MID = 1, HIGH = 2;
// Same fixtures as check-bosses.mjs's FIGHTS table (item load + design tide
// for each boss) — duplicated rather than imported because that file has no
// exports, only a script body.
const FIGHTS = {
  d1: { boss: 'gohmaraq',  tide: LOW,  items: { sword: 1, conch: 1, anchor: 1 } },
  d2: { boss: 'anemos',    tide: HIGH, items: { sword: 1, conch: 1, anchor: 1, lens: 1, bombs: 1 } },
  d3: { boss: 'gloomtide', tide: MID,  items: { sword: 2, conch: 1, anchor: 1, lens: 1, bombs: 1, cleats: 1 } },
  d4: { boss: 'wyverna',   tide: LOW,  items: { sword: 2, conch: 1, anchor: 1, lens: 1, bombs: 1, cleats: 1, bellows: 1 } },
  d5: { boss: 'rootmaw',   tide: LOW,  items: { sword: 2, conch: 1, anchor: 1, lens: 1, bombs: 1, reefseed: 1 } },
  d6: { boss: 'nereth',    tide: MID,  items: { sword: 3, conch: 1, anchor: 1, lens: 1, bombs: 1, cleats: 2, bellows: 1,
                                                 reefseed: 1, rod: 1, dredge: 1 } },
};

const id = process.argv[2] || 'd1';
const HEARTS = Number(process.argv[3] || 12);
const SEED = Number(process.argv[4] || 20260806);
const f = FIGHTS[id];
if (!f) { console.error(`unknown dungeon id "${id}" — one of ${Object.keys(FIGHTS).join(', ')}`); process.exit(2); }

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

// Hook takeDamage/hurt before the fight starts so every hit either side lands
// is recorded with its frame, amount and source — see the file header.
await page.evaluate(async () => {
  const { Player } = await import('/src/game/player.js');
  const { Boss } = await import('/src/game/enemy.js');
  const origP = Player.prototype.takeDamage;
  const origB = Boss.prototype.hurt;
  window.__hits = [];
  window.__landed = [];
  Player.prototype.takeDamage = function (game, amount, source, o) {
    const r = origP.call(this, game, amount, source, o);
    if (r !== false) {
      window.__hits.push({ frame: game.frame, amount, after: game.progress.hearts,
        src: source ? (source.isProjectile ? 'projectile:' + (source.sprite || '?')
          : (source.constructor && source.constructor.name) || '?') : (o && o.hazard ? 'hazard' : 'unknown') });
    }
    return r;
  };
  Boss.prototype.hurt = function (game, dmg, dir, knock) {
    const r = origB.call(this, game, dmg, dir, knock);
    if (r) window.__landed.push({ frame: game.frame, dmg, after: this.hp });
    return r;
  };
});

const info = await page.evaluate(async (id) => {
  const { dungeons } = await import('/src/world/maps.js');
  const d = dungeons().find(x => x.id === id);
  return { room: d.dungeon.bossRoom };
}, id);
const [fl, rx, ry] = info.room.split(',').map(Number);

console.log(`REAL COMBAT: ${id} ${f.boss}, seed ${SEED}, ${HEARTS} quarter-hearts (${HEARTS / 4} hearts), no god mode\n`);

await page.evaluate(([setup, steps]) => window.__rp.beginRecord(setup, steps), [{
  seed: SEED, godMode: false, items: f.items, equipA: 'sword', equipB: 'conch',
  maxHearts: HEARTS, hearts: HEARTS, tide: f.tide,
  enter: [id, fl, rx, ry, 72, 80, 'up'],
}, [
  ['wait', 30],
  ['boss', 9000],
  ['wait', 240],
  ['goto', 4, 3, 900],
  ['dialogue', 900],
  ['wait', 60],
]]);

const maxHp = await page.evaluate(() => (window.__game.boss ? window.__game.boss.hp : null));

// Stop the moment the fight resolves either way — game over eventually
// respawns (via the harness's own "press A/start past a blocking screen"
// fallback in dBoss), so waiting for the whole recorded plan to finish would
// read the mode back AFTER a respawn already put it back to 'play'.
let done = false, err = null, guard = 0, deadAt = null, wonAt = null;
while (!done && guard++ < 4000) {
  let r;
  try { r = await page.evaluate(n => window.__rp.pump(n), 60); }
  catch (e) { err = String(e.message || e).replace(/^page\.evaluate: /, '').split('\n')[0]; break; }
  done = r.done;
  if (r.error) { err = String(r.error); break; }
  const m = await page.evaluate(() => ({ mode: window.__game.mode, frame: window.__game.frame,
    bossGone: !window.__game.boss || window.__game.boss.dead }));
  if (m.mode === 'gameover' && deadAt === null) deadAt = m.frame;
  if (m.bossGone && wonAt === null) wonAt = m.frame;
  if (deadAt !== null || wonAt !== null) break;
}

const finalHp = await page.evaluate(() => (window.__game.boss ? window.__game.boss.hp : null));
const mode = deadAt !== null ? 'gameover' : await page.evaluate(() => window.__game.mode);
const landed = await page.evaluate(() => window.__landed || []);
const hits = await page.evaluate(() => window.__hits || []);

const dealt = landed.reduce((s, h) => s + h.dmg, 0);
const taken = hits.reduce((s, h) => s + h.amount, 0);
console.log(`hits landed on boss: ${landed.length} (${dealt} of ${maxHp} hp dealt${finalHp != null ? `, ${finalHp} hp left` : ''})`);
for (const h of landed) console.log(`  frame ${h.frame}: -${h.dmg}hp (-> ${h.after})`);
console.log(`hits taken: ${hits.length} (${taken}qh taken)`);
for (const h of hits) console.log(`  frame ${h.frame}: -${h.amount}qh (-> ${h.after}) src=${h.src}`);
console.log((deadAt !== null ? `\nDIED at frame ${deadAt}`
  : wonAt !== null ? `\nBOSS DEFEATED at frame ${wonAt}`
  : `\nfight did not resolve within budget (mode=${mode})`)
  + (err ? `: ${err}` : ''));
if (errs.length) console.log('page errors:', errs.slice(0, 3));

await browser.close(); server.close();
process.exit(0);
