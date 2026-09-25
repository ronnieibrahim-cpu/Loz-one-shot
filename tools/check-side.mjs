// THE SIDE CONTENT CAN BE WON (S155).
//
// The human's rule for the side content: its heart-piece prizes are EXISTING
// pieces moved off the map, not new ones, and every prize is proved reachable
// by the robot or a checker. `check-hearts.mjs` proves the count still lands;
// this proves each prize can actually be taken, in the real engine, by the
// same actor directives the playthrough uses — a bomb set against the right
// wall, a race run inside its clock, an errand walked there and back.
//
// Each scenario is a stated world (`setup`, the replay shape: items, flags,
// tide, the room to start in) plus a handful of directives, and an assertion
// read off the live game at the end. Most prizes also carry a NEGATIVE
// scenario — the same walk without the thing that is supposed to be needed —
// because a prize that can be taken without its verb is a prize on the floor.
//
// The world the robot never plays: none of these prizes is on the
// playthrough's route, which is why the pieces moved were ones it never
// collected (NEXT-PROMPT S154). So nothing here may lean on the playthrough.
//
// Usage: node tools/check-side.mjs [--only <name>]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { installRuntime } from './actor-runtime.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ONLY = (() => { const i = process.argv.indexOf('--only'); return i > 0 ? process.argv[i + 1] : null; })();

const BASE = { seed: 20260806, maxHearts: 12, hearts: 12, tide: 1 };
const setup = (o) => ({ ...BASE, ...o });

// `expect` is evaluated in the page with the game as `g`; it returns true or
// a string saying what was wrong.
const SCENARIOS = [
  {
    name: 'Hollow Den: a bomb opens the cracked wall and the Piece of Heart is inside',
    setup: setup({ items: { sword: 1, bombs: 1 }, equipA: 'sword', equipB: 'bombs',
      enter: ['overworld', 0, 3, 6, 64, 64, 'up'] }),
    steps: [['goto', 4, 2, 400], ['hold', ['up'], 6], ['use', 'bombs', 1, 10],
      ['goto', 4, 4, 200], ['wait', 120], ['goto', 4, 2, 300], ['hold', ['up'], 60],
      ['wait', 60], ['goto', 4, 3, 400], ['hold', ['up'], 30], ['wait', 200]],
    expect: `g.mapId === 'cave5' && g.progress.heartPieces === 1 || ('in ' + g.mapId + ', pieces ' + g.progress.heartPieces)`,
  },
  {
    name: 'Hollow Den: without a bomb the crack is a wall',
    setup: setup({ items: { sword: 1 }, equipA: 'sword',
      enter: ['overworld', 0, 3, 6, 64, 64, 'up'] }),
    steps: [['goto', 4, 2, 400], ['hold', ['up'], 90], ['wait', 30]],
    expect: `g.mapId === 'overworld' || ('walked into ' + g.mapId + ' with no bomb')`,
  },
];

const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const full = join(ROOT, normalize(p)); const s = await stat(full).catch(() => null);
  if (!s || !s.isFile()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': extname(full) === '.html' ? 'text/html' : 'text/javascript' }); res.end(await readFile(full));
});
await new Promise(r => server.listen(0, r));
const PORT = server.address().port;
const browser = await chromium.launch().catch(() =>
  chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' }));

let pass = 0, fail = 0;
for (const sc of SCENARIOS) {
  if (ONLY && !sc.name.toLowerCase().includes(ONLY.toLowerCase())) continue;
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto(`http://localhost:${PORT}/index.html?seed=20260806`);
  await page.waitForFunction(() => !!window.__game && !!window.__harness);
  await page.evaluate(installRuntime);
  await page.evaluate(([s, st]) => window.__rp.beginRecord(s, st), [sc.setup, sc.steps]);
  let err = null;
  for (let i = 0; i < 8000; i++) {
    let r;
    try { r = await page.evaluate(n => window.__rp.pump(n), 100); } catch (e) { err = e.message.split('\n')[0]; break; }
    if (r.done || r.error) { if (r.error) err = r.error; break; }
  }
  let verdict = err ? 'directive failed: ' + err : null;
  if (!verdict) {
    const v = await page.evaluate(src => { const g = window.__game; return eval(src); }, sc.expect);
    verdict = v === true ? null : String(v);
  }
  if (!verdict && errs.length) verdict = 'page error: ' + errs[0];
  if (verdict) { fail++; console.log(`  FAIL ${sc.name}\n       ${verdict}`); }
  else { pass++; console.log(`  ok   ${sc.name}`); }
  await page.close();
}
await browser.close(); server.close();
console.log(`\n=== ${pass} passed, ${fail} failed ===`);
process.exit(fail ? 1 : 0);
