// PICK THE RIGHT ONE, BY THE SEA (S204, docs/briefs/PUZZLE-PASS.md kind H).
//
// Seasons' Ancient Ruins button is right or wrong on a coin flip. Ours is
// right when it stands in ankle-deep water, and a room that says so declares
//
//   tidePlates: { plates: [[x, y, sea], ...], loose: [[x, y], ...] }
//
// This proves, per room, in the real engine:
//
//   1. at every sea exactly one plate stands in wading water (shallow, not
//      deep), and it is the one the claim names for that sea — so the room
//      always shows its answer;
//   2. every plate pressed at its own sea stays down after Link steps off,
//      and lets nothing loose;
//   3. a plate under deep water is on the bottom and nobody presses it;
//      every plate pressed at any other sea it can be stood on lets the
//      claim's keese loose, stays up, and puts back up every plate that was
//      down;
//   4. pressed in turn, each at its sea, the plates pay out the room's
//      puzzle; and one wrong press after two right ones does not.
//
// Usage: node tools/check-tideplates.mjs
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { installRuntime } from './actor-runtime.mjs';
import { installData } from '../src/data/index.js';
import { MAPS } from '../src/world/maps.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
installData();

let pass = 0; const fail = [];
const check = (n, c, d) => c ? (pass++, console.log('  ok   ' + n))
  : (fail.push(n), console.log('  FAIL ' + n + (d ? ' — ' + d : '')));

const CLAIMS = [];
for (const [mapId, m] of MAPS) {
  for (const [key, def] of Object.entries(m.roomDefs || {})) {
    if (def.tidePlates) CLAIMS.push({ mapId, key, def, k: def.tidePlates });
  }
}
check('at least one room claims tide plates', CLAIMS.length > 0);

const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const full = join(ROOT, normalize(p)); const s = await stat(full).catch(() => null);
  if (!s || !s.isFile()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': extname(full) === '.html' ? 'text/html' : 'text/javascript' }); res.end(await readFile(full));
});
await new Promise(r => server.listen(0, r));
const browser = await chromium.launch().catch(() =>
  chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' }));
const page = await browser.newPage();
await page.goto(`http://localhost:${server.address().port}/index.html`);
await page.waitForFunction(() => window.__game && window.__harness);
await page.evaluate(installRuntime);

// Enter the room fresh at `sea`, nobody else in it, and run `presses`: each
// [plateIndex, sea] stands Link on that plate at that sea and walks him off.
async function play(c, presses) {
  const [f, rx, ry] = c.key.split(',').map(Number);
  await page.evaluate(([setup]) => window.__rp.beginRecord(setup, [['wait', 2]]), [{
    seed: 20260930, items: { sword: 1, conch: 1 }, equipA: 'sword', equipB: 'conch',
    maxHearts: 24, hearts: 24, tide: presses.length ? presses[0][1] : 0,
    enter: [c.mapId, f, rx, ry, 7 * 16, 5 * 16, 'down'],
  }]);
  await page.evaluate(() => window.__rp.pump(10));
  return page.evaluate(async ([plates, presses]) => {
    const g = window.__game, p = g.player, T = 16;
    const { FloorSwitch } = await import('/src/game/objects.js');
    const { F } = await import('/src/world/tileset.js');
    const step = (n) => { for (let i = 0; i < n; i++) window.__harness.step(1); if (g.dialogue) g.dialogue.active = false; g.mode = 'play'; };
    for (const e of g.entities) if (e.isEnemy) e.remove = true;
    step(1);
    p.invuln = 1e6;
    const plate = (i) => g.entities.find(e => e instanceof FloorSwitch
      && Math.floor(e.cx / T) === plates[i][0] && Math.floor(e.cy / T) === plates[i][1]);
    const wading = [0, 1, 2].map(s => {
      g.tide.setLevel(s, { instant: true });
      return plates.map(([x, y]) => { const fl = g.room.flagsAt(x, y, g.tide); return !!(fl & F.WATER) && !(fl & F.DEEP); });
    });
    const deep = [0, 1, 2].map(s => {
      g.tide.setLevel(s, { instant: true });
      return plates.map(([x, y]) => !!(g.room.flagsAt(x, y, g.tide) & F.DEEP));
    });
    const log = [];
    for (const [i, sea] of presses) {
      g.tide.setLevel(sea, { instant: true });
      const foes = g.entities.filter(e => e.isEnemy && !e.dead && !e.remove).length;
      p.x = plates[i][0] * T; p.y = plates[i][1] * T - 4;
      step(6);
      p.x = 7 * T; p.y = 5 * T;
      step(6);
      log.push({
        i, sea, down: plates.map((_, j) => !!plate(j) && plate(j).pressed),
        loosed: g.entities.filter(e => e.isEnemy && !e.dead && !e.remove).length - foes,
        done: !!g.room._puzzleDone,
        fairy: g.entities.some(e => e.kind === 'fairy' || (e.pickup === 'fairy')),
      });
      for (const e of g.entities) if (e.isEnemy) e.remove = true;
      step(1);
    }
    return { wading, deep, log };
  }, [c.k.plates, presses]);
}

for (const c of CLAIMS) {
  const name = `${c.mapId} ${c.key} (${c.def.name})`;
  const loose = c.k.loose.length;
  const first = await play(c, []);
  for (let s = 0; s < 3; s++) {
    const at = first.wading[s].map((w, i) => w ? i : -1).filter(i => i >= 0);
    const want = c.k.plates.map((pl, i) => pl[2] === s ? i : -1).filter(i => i >= 0);
    check(`${name}: at sea ${s} exactly the plate the claim names stands in wading water`,
      at.length === 1 && JSON.stringify(at) === JSON.stringify(want), `wading ${at}, claim ${want}`);
  }
  for (let i = 0; i < c.k.plates.length; i++) {
    for (let s = 0; s < 3; s++) {
      const r = (await play(c, [[i, s]])).log[0];
      if (first.deep[s][i]) {
        check(`${name}: plate ${i} under deep water at sea ${s} cannot be pressed`, !r.down[i] && r.loosed === 0, JSON.stringify(r));
      } else if (s === c.k.plates[i][2]) {
        check(`${name}: plate ${i} pressed at sea ${s} stays down and looses nothing`, r.down[i] && r.loosed === 0, JSON.stringify(r));
      } else {
        check(`${name}: plate ${i} pressed at sea ${s} looses ${loose} keese and stays up`, !r.down[i] && r.loosed === loose, JSON.stringify(r));
      }
    }
  }
  const order = c.k.plates.map((pl, i) => [i, pl[2]]).sort((a, b) => a[1] - b[1]);
  const run = await play(c, order);
  const last = run.log[run.log.length - 1];
  check(`${name}: pressed in turn at their seas, the plates pay out`, last.done && last.fairy, JSON.stringify(run.log));
  const wrongPlate = order[2][0], wrongSea = order[0][1];
  const spoil = await play(c, [order[0], order[1], [wrongPlate, wrongSea]]);
  const sl = spoil.log[2];
  check(`${name}: a wrong press after two right ones puts every plate back up`,
    sl.down.every(d => !d) && !sl.done && sl.loosed === loose, JSON.stringify(sl));
}

await browser.close(); server.close();
console.log(`\n=== ${pass} passed, ${fail.length} failed ===`);
process.exit(fail.length ? 1 : 0);
