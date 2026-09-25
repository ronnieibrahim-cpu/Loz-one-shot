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
  {
    name: 'Slackwater Cave: at LOW the mouth is dry, and the Piece of Heart is inside',
    setup: setup({ items: { sword: 1, conch: 1 }, equipA: 'sword', equipB: 'conch', tide: 0,
      enter: ['overworld', 0, 1, 2, 48, 64, 'up'] }),
    steps: [['goto', 3, 2, 400], ['hold', ['up'], 60], ['wait', 60],
      ['goto', 4, 5, 400], ['hold', ['up'], 30], ['wait', 200]],
    expect: `g.mapId === 'cave6' && g.progress.heartPieces === 1 || ('in ' + g.mapId + ', pieces ' + g.progress.heartPieces)`,
  },
  {
    name: 'Slackwater Cave: the conch is held inside, and the way out is dry',
    setup: setup({ items: { sword: 1, conch: 1 }, equipA: 'sword', equipB: 'conch', tide: 0,
      enter: ['cave6', 0, 0, 0, 72, 81, 'up'] }),
    steps: [['use', 'conch', 2, 140], ['goto', 5, 5, 300], ['hold', ['down'], 60], ['wait', 60]],
    expect: `g.mapId === 'overworld' && g.tide.level === 0 && !g.player.inDeep || ('in ' + g.mapId + ' at tide ' + g.tide.level)`,
  },
  ...[1, 2].map(t => ({
    name: `Slackwater Cave: at ${t === 1 ? 'MID' : 'HIGH'} the sea stands in the mouth`,
    setup: setup({ items: { sword: 1, conch: 1 }, equipA: 'sword', equipB: 'conch', tide: t,
      enter: ['overworld', 0, 1, 2, 48, 48, 'up'] }),
    steps: [['hold', ['up'], 180], ['wait', 30]],
    expect: `g.mapId === 'overworld' || ('got into ' + g.mapId + ' at tide ' + g.tide.level)`,
  })),
  {
    name: 'The ledger: found on the South Sands, carried to the shop, paid for with a Piece of Heart',
    setup: setup({ items: { sword: 1 }, equipA: 'sword', tide: 0, enter: ['overworld', 0, 5, 9, 64, 32, 'right'] }),
    steps: [['goto', 8, 2, 400], ['wait', 90], ['travel', 5, 8, 3000], ['wait', 30], ['travel', 5, 7, 3000], ['wait', 30],
      ['goto', 4, 5, 600], ['hold', ['up'], 40], ['wait', 60], ['errand', 'ledgerDone', 1500], ['wait', 60]],
    expect: `g.progress.flags.foundLedger && g.progress.flags.ledgerDone && g.progress.heartPieces === 1 || ('ledger ' + !!g.progress.flags.foundLedger + ', pieces ' + g.progress.heartPieces)`,
  },
  {
    name: 'The ledger: the shopkeeper pays nothing until it is home',
    setup: setup({ items: { sword: 1 }, equipA: 'sword', enter: ['houseShop', 0, 0, 0, 72, 81, 'up'] }),
    steps: [['errand', 'ledgerDone', 600]],
    expectError: /never landed/,
    expect: `g.progress.heartPieces === 0 || 'paid without the ledger'`,
  },
  {
    name: 'The kite: blown out of the tree with the Bellows, carried home, paid for with a Piece of Heart',
    setup: setup({ items: { sword: 1, bellows: 1 }, equipA: 'sword', equipB: 'bellows',
      enter: ['overworld', 0, 3, 6, 112, 64, 'up'] }),
    steps: [['goto', 7, 2, 400], ['hold', ['up'], 6], ['wait', 5], ['hold', ['b'], 80], ['wait', 200],
      ['travel', 3, 7, 3000], ['wait', 30], ['travel', 4, 7, 3000], ['wait', 30],
      ['goto', 2, 5, 600], ['hold', ['up'], 40], ['wait', 60], ['errand', 'kiteDone', 1500], ['wait', 60]],
    expect: `g.progress.flags.foundKite && g.progress.flags.kiteDone && g.progress.heartPieces === 1 || ('kite ' + !!g.progress.flags.foundKite + ', pieces ' + g.progress.heartPieces + ' in ' + g.mapId)`,
  },
  {
    name: 'The kite: a sword does not bring it down',
    setup: setup({ items: { sword: 1 }, equipA: 'sword', enter: ['overworld', 0, 3, 6, 112, 64, 'up'] }),
    steps: [['goto', 7, 2, 400], ['hold', ['up'], 6], ['tap', 'a', 30], ['tap', 'a', 30], ['tap', 'a', 30], ['wait', 60]],
    expect: `!g.progress.flags.foundKite && g.entities.some(e => e.perched) || 'the kite came down without a wind'`,
  },
  // The bog is a long way from the village and the actor's travel planner does
  // not cross the marsh on its own, so this errand is proved in its two halves:
  // the jar is picked up where it lies, and the netmaker pays for it at home.
  // That Bog Head can be walked to at all is check-overworld's and
  // check-progression's to prove, and they do.
  {
    name: 'The bog water: the jar can be picked up at Bog Head',
    setup: setup({ items: { sword: 1, bombs: 1 }, equipA: 'sword', tide: 0,
      enter: ['overworld', 0, 0, 6, 128, 64, 'left'] }),
    steps: [['goto', 4, 5, 600], ['wait', 200]],
    expect: `g.progress.flags.foundBogWater || 'the jar was not picked up'`,
  },
  {
    name: 'The bog water: the netmaker pays a hundred rupees for it',
    setup: setup({ items: { sword: 1 }, equipA: 'sword', flags: ['foundBogWater'], rupees: 0,
      enter: ['houseHearth', 0, 0, 0, 72, 81, 'up'] }),
    steps: [['errand', 'bogwaterDone', 1500], ['wait', 60]],
    expect: `g.progress.rupees === 100 && g.progress.heartPieces === 0 || ('rupees ' + g.progress.rupees)`,
  },
  {
    name: 'The bog water: nothing is paid before the jar is home',
    setup: setup({ items: { sword: 1 }, equipA: 'sword', rupees: 0, enter: ['houseHearth', 0, 0, 0, 72, 81, 'up'] }),
    steps: [['errand', 'bogwaterDone', 600]],
    expectError: /never landed/,
    expect: `g.progress.rupees === 0 || 'paid without the jar'`,
  },
  {
    name: 'The race: at LOW the sand path gets you to Pip inside the clock, for a Piece of Heart',
    setup: setup({ items: { sword: 1 }, equipA: 'sword', tide: 0, enter: ['overworld', 0, 3, 9, 48, 48, 'left'] }),
    steps: [['race', 600], ['goto', 1, 6, 300], ['hold', ['right'], 600], ['wait', 200]],
    expect: `g.progress.flags.raceWon && g.progress.heartPieces === 1 && !g.race || ('won ' + !!g.progress.flags.raceWon + ', pieces ' + g.progress.heartPieces)`,
  },
  {
    name: 'The race: won again, it pays rupees, not a second piece',
    setup: setup({ items: { sword: 1 }, equipA: 'sword', tide: 0, flags: ['raceWon'], rupees: 0,
      enter: ['overworld', 0, 3, 9, 48, 48, 'left'] }),
    steps: [['race', 600], ['goto', 1, 6, 300], ['hold', ['right'], 600], ['wait', 200]],
    expect: `g.progress.rupees === 20 && g.progress.heartPieces === 0 || ('rupees ' + g.progress.rupees + ', pieces ' + g.progress.heartPieces)`,
  },
  {
    name: 'The race: dawdle at the start and the clock runs out',
    setup: setup({ items: { sword: 1 }, equipA: 'sword', tide: 0, enter: ['overworld', 0, 3, 9, 48, 48, 'left'] }),
    steps: [['race', 600], ['wait', 150], ['goto', 1, 6, 300], ['hold', ['right'], 600], ['wait', 200]],
    expect: `!g.progress.flags.raceWon && g.progress.heartPieces === 0 && !g.race || 'won after dawdling'`,
  },
  ...[1, 2].map(t => ({
    name: `The race: at ${t === 1 ? 'MID' : 'HIGH'} the sand path is under the sea and Pip cannot be reached`,
    setup: setup({ items: { sword: 1 }, equipA: 'sword', tide: t, enter: ['overworld', 0, 3, 9, 48, 48, 'left'] }),
    steps: [['race', 600], ['hold', ['down'], 60], ['hold', ['right'], 600], ['wait', 200]],
    expect: `!g.progress.flags.raceWon && !g.race || 'reached Pip at tide ' + g.tide.level`,
  })),
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
  // A scenario that is SUPPOSED to be refused names the refusal it expects.
  if (sc.expectError) {
    if (!err || !sc.expectError.test(err)) err = 'expected a refusal matching ' + sc.expectError + ', got ' + (err || 'none');
    else err = null;
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
