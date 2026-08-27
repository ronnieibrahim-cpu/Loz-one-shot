// The Coastwise Chain harness. Two halves, and they prove different things.
//
// OFFLINE (plain Node, the top half) proves the chain is a chain: that the
// placed `trader` entities form one total order with no gap, no fork and no
// cycle, that every link's stated want is the previous link's gift, that the
// objects being passed round all exist and are all used, and — the assertion
// this tool exists for — that every link stands somewhere a player can get to
// WITHOUT the Resonance Rod. The chain's reward is the Rod, the Rod opens the
// Salt Pans, and a link placed inside the Pans would be a gate holding its own
// key: circular, silent, and invisible to every other checker in the repo,
// because none of them knows the chain exists.
//
// IN-ENGINE (headless, the bottom half) plays it. It talks to all eleven
// traders in order with the real entity, the real dialogue box and the real
// grant, checks that talking to the wrong one does nothing at all, that the
// Maku Tree refuses the rope until an Essence is in hand, and that what comes
// out of the far end is the Resonance Rod — and then takes that Rod down to the
// Abyssal Keep's Colonnade of the Drowned and rings the grate the whole chain
// was built to justify. CLAUDE.md's warning is the reason both halves are here:
// a model of a quest is not a quest, and seven hundred green assertions once
// described a world that could not be finished.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { installData } from '../src/data/index.js';
import { MAPS, getRoom } from '../src/world/maps.js';
import { getTileDef, F } from '../src/world/tileset.js';
import { defWalkable, ROUTE_AVOID } from './lib/collision.mjs';
import { GAP_HOP_MAX_SPAN } from '../src/data/feel.js';
import { TRADE_ITEMS } from '../src/data/trade.js';
import { DIALOGUE } from '../src/data/story.js';
import { ITEMS } from '../src/game/items.js';

installData();

let passed = 0; const failures = [];
function check(name, cond, detail) {
  if (cond) { passed++; console.log('  ok   ' + name); }
  else { failures.push(name); console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); }
}
function section(s) { console.log('\n--- ' + s + ' ---'); }

// ===========================================================================
section('the chain, as placed');

// Every trader in the world, wherever it is: the chain is not allowed to be a
// list somewhere that the placed data then disagrees with, so this is read off
// the maps and nothing else.
//
// A LINK IS ANY ENTITY THAT HOLDS DEALS, not any entity spelled 'trader'. The
// Maku Tree is the chain's last link and its entity kind is 'makuTree',
// because she is a Trader with a second beat bolted on (the road to the Keep
// at five Essences — see MakuTree in src/game/objects.js). Matching the string
// 'trader' alone would have dropped stage 12 out of the chain, and the failure
// would not have read as "the Maku Tree is missing": it would have read as a
// chain with a gap at the end, sending the next session hunting a data bug in
// the eleven links that were fine.
const TRADER_KINDS = new Set(['trader', 'makuTree']);
const traders = [];
for (const [mapId, m] of MAPS) {
  for (const [key, def] of Object.entries(m.roomDefs || {})) {
    for (const e of def.entities || []) {
      if (!TRADER_KINDS.has(e[0])) continue;
      traders.push({ mapId, key, tx: e[1], ty: e[2], o: e[3] || {} });
    }
  }
}
check('the world places traders at all', traders.length > 0, 'none found');

// stage -> deal, and the trader holding it.
const deals = new Map();
const dupes = [];
for (const t of traders) {
  for (const d of t.o.deals || []) {
    if (deals.has(d.stage)) dupes.push(`stage ${d.stage}`);
    deals.set(d.stage, { ...d, at: t });
  }
}
check('no two links claim the same stage', dupes.length === 0, dupes.join(', '));

const stages = [...deals.keys()].sort((a, b) => a - b);
const N = stages.length;
check(`the chain runs 1..${N} with no gap`,
  stages.every((s, i) => s === i + 1), stages.join(','));
check('the chain is 9 to 13 links long', N >= 9 && N <= 13, `N=${N}`);

// Each link takes exactly what the last one gave. This is the assertion that
// makes it a CHAIN: break it and you have a set of errands that happen to be
// numbered.
const breaks = [];
for (const s of stages) {
  const d = deals.get(s);
  const prev = s === 1 ? null : (deals.get(s - 1).gives || null);
  if ((d.wants || null) !== prev) breaks.push(`stage ${s} wants ${d.wants || 'nothing'}, stage ${s - 1} gave ${prev || 'nothing'}`);
}
check('every link takes exactly what the last one gave', breaks.length === 0, breaks.join(' | '));
check('the first link asks for nothing', !deals.get(1).wants, String(deals.get(1).wants));

// The terminus: one real item, at the end, and nowhere else.
const granting = stages.filter(s => deals.get(s).item);
check('exactly one link hands over a real item', granting.length === 1, granting.join(','));
check('it is the last one', granting[0] === N, `stage ${granting[0]} of ${N}`);
const last = deals.get(N);
check('the terminal reward is the Resonance Rod', last.item === 'rod', String(last.item));
check('the terminus still sets gotRod', last.flag === 'gotRod', String(last.flag));
check('the last link hands over no further trade item', !last.gives, String(last.gives));

// ===========================================================================
section('the objects');

const given = stages.map(s => deals.get(s).gives).filter(Boolean);
const unknown = given.filter(id => !TRADE_ITEMS[id]);
check('every object passed along is in the trade registry', unknown.length === 0, unknown.join(','));
const unused = Object.keys(TRADE_ITEMS).filter(id => !given.includes(id));
check('every object in the registry is actually passed along', unused.length === 0, unused.join(','));
const twice = given.filter((id, i) => given.indexOf(id) !== i);
check('no object is handed over twice', twice.length === 0, twice.join(','));

// A trade item is NOT an inventory item, and an id in both registries would be
// exactly the kind of collision that reads correctly right up until something
// calls itemName on it and gets the raw id back (see CLAUDE.md on chests that
// hand over items which do not exist).
const collide = Object.keys(TRADE_ITEMS).filter(id => ITEMS[id]);
check('no trade object shares an id with a real item', collide.length === 0, collide.join(','));

// Every line the chain can say has to exist, or the box comes up empty and the
// trade still happens — which is worse than a crash, because it is invisible.
const lines = [];
for (const t of traders) {
  for (const k of ['waiting', 'after']) if (t.o[k]) lines.push([t.o[k], `${t.mapId} ${t.key} ${k}`]);
  for (const d of t.o.deals || []) {
    for (const k of ['text', 'blocked']) if (d[k]) lines.push([d[k], `stage ${d.stage} ${k}`]);
  }
}
const missingText = lines.filter(([id]) => !DIALOGUE[id]).map(([id, where]) => `${id} (${where})`);
check('every line the chain can say exists', missingText.length === 0, missingText.join(', '));
const noText = stages.filter(s => !deals.get(s).text);
check('every link says something when it trades', noText.length === 0, noText.join(','));

// ===========================================================================
section('reachable without the thing the chain gives you');
//
// The flood is the overworld one, tile by tile, from the village square, with
// the Marsh's bombable wall open and NOTHING else — no Rod, no Dredge Line. A
// trader the flood cannot stand next to is a link behind a gate its own reward
// opens.

const W = 10, H = 8, OW = 12, OH = 10;
const ow = MAPS.get('overworld');
const NAMES = new Map();
for (const [k, d] of Object.entries(ow.roomDefs)) {
  const [f, rx, ry] = k.split(',').map(Number);
  const room = getRoom('overworld', f, rx, ry);
  NAMES.set(d, Array.from({ length: H }, (_, y) =>
    Array.from({ length: W }, (_, x) => room.baseName(x, y))));
}
const legendOf = def => NAMES.get(def);
// Bombs only: the Coral Spire hands those over and the Spire is not gated.
const OPEN = F.BOMBABLE;
// The intro always hands over the sword before the player can move (see
// check-playthrough.mjs); no other item is assumed.
const CAPS = { jumping: false, swim: false, cutting: true };
function defAt(name, tide) {
  let d = getTileDef(name);
  for (let i = 0; i < 4 && d && d.tide; i++) d = getTileDef(d.tide[tide]);
  return d;
}
function walkableAt(name, tide) {
  const d = defAt(name, tide);
  if (!d) return false;
  if (d.flags & OPEN) return true;
  return defWalkable(d, CAPS, ROUTE_AVOID);
}
const passable = ch => [0, 1, 2].some(t => walkableAt(ch, t));
const isGap = ch => { const d = defAt(ch, 1); return !!(d && (d.flags & F.JUMPABLE)); };
function runLen(l, x, y, dx, dy) {
  let n = 1;
  for (let i = 1; ; i++) { const nx = x + dx * i, ny = y + dy * i; if (nx < 0 || ny < 0 || nx >= W || ny >= H || !isGap(l[ny][nx])) break; n++; }
  for (let i = 1; ; i++) { const nx = x - dx * i, ny = y - dy * i; if (nx < 0 || ny < 0 || nx >= W || ny >= H || !isGap(l[ny][nx])) break; n++; }
  return n;
}
const hoppable = (l, x, y) => isGap(l[y][x])
  && (runLen(l, x, y, 1, 0) < GAP_HOP_MAX_SPAN || runLen(l, x, y, 0, 1) < GAP_HOP_MAX_SPAN);
const passableAt = (l, x, y) => passable(l[y][x]) || hoppable(l, x, y);

const seen = new Set();
{
  const start = '0,4,7';
  const sl = legendOf(ow.roomDefs[start]);
  const q = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (passableAt(sl, x, y)) { const k = `${start}:${x},${y}`; seen.add(k); q.push([start, x, y]); }
  }
  while (q.length) {
    const [rk, x, y] = q.pop();
    const [, rx, ry] = rk.split(',').map(Number);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      let trk = rk, tx = nx, ty = ny;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) {
        trk = `0,${rx + (nx < 0 ? -1 : nx >= W ? 1 : 0)},${ry + (ny < 0 ? -1 : ny >= H ? 1 : 0)}`;
        if (!ow.roomDefs[trk]) continue;
        tx = (nx + W) % W; ty = (ny + H) % H;
      }
      const k = `${trk}:${tx},${ty}`;
      if (seen.has(k)) continue;
      if (!passableAt(legendOf(ow.roomDefs[trk]), tx, ty)) continue;
      seen.add(k); q.push([trk, tx, ty]);
    }
  }
}
console.log(`  flood (bombs only): ${new Set([...seen].map(k => k.split(':')[0])).size}/120 screens`);

// An interior is reached through its door, so a trader indoors is reachable
// exactly when the overworld tile that warps to their map is.
const doorTile = new Map();
for (const [k, d] of Object.entries(ow.roomDefs)) {
  for (const w of d.warps || []) if (w.to && w.to.map) doorTile.set(w.to.map, `${k}:${w.x},${w.y}`);
}
// Reached, or standing next to something reached. Both an NPC and a doorway
// need this rather than a hit on their own tile: you TALK to somebody from the
// tile beside them, and a door is a tile in a building's footprint, which is
// solid by construction — the flood stops on the doorstep, which is exactly
// where the player stops too.
const beside = (key, tx, ty) => [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
  const x = tx + dx, y = ty + dy;
  if (x < 0 || y < 0 || x >= W || y >= H) return false;
  return seen.has(`${key}:${x},${y}`);
});
const stranded = [];
for (const t of traders) {
  if (t.mapId === 'overworld') {
    if (!beside(t.key, t.tx, t.ty)) stranded.push(`${t.mapId} ${t.key} @${t.tx},${t.ty}`);
  } else {
    const door = doorTile.get(t.mapId);
    if (!door) { stranded.push(`${t.mapId} (no door warps to it)`); continue; }
    const [dk, dxy] = door.split(':');
    const [dx, dy] = dxy.split(',').map(Number);
    if (!beside(dk, dx, dy)) stranded.push(`${t.mapId} (door ${door})`);
  }
}
check('every link can be reached with bombs and no Rod', stranded.length === 0, stranded.join(' | '));

// And the assertion that says WHY: the Rod's own gate is the Salt Pans, so no
// link may stand on a screen the vanes seal.
const PANS = [[4, 7, 0, 2], [8, 11, 0, 3]];
const inPans = traders.filter(t => t.mapId === 'overworld').filter(t => {
  const [, x, y] = t.key.split(',').map(Number);
  return PANS.some(([x0, x1, y0, y1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1);
});
check('no link stands behind the vanes the Rod opens', inPans.length === 0,
  inPans.map(t => t.key).join(','));

// ===========================================================================
// In-engine: play it.
// ===========================================================================
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
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
page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });

await page.goto(`http://localhost:${PORT}/index.html?seed=20260806`, { waitUntil: 'load' });
await page.waitForFunction(() => !!window.__game && !!window.__harness, { timeout: 15000 });
await page.evaluate(() => window.__harness.takeOver());

// Walk into a trader's room, find them, talk, and dismiss the box so the
// dialogue's onClose — which is where the trade actually happens — runs.
await page.evaluate(() => {
  window.__go = (mapId, key) => {
    const g = window.__game;
    const [f, rx, ry] = key.split(',').map(Number);
    g.mode = 'play';
    g.enterMap(mapId, f, rx, ry, 72, 72, 'down', { instant: true });
    g.mode = 'play';
    g.progress.hearts = g.progress.maxHearts;
    g.player.invuln = 100000;
    const t = g.entities.find(e => e.deals);
    return !!t;
  };
  window.__talk = () => {
    const g = window.__game;
    const t = g.entities.find(e => e.deals);
    if (!t) return { error: 'no trader in the room' };
    t.interact(g, g.player);
    const said = g.dialogue.active ? g.dialogue.pages.flat().join(' ') : '';
    // Page through and close, exactly as a player mashing A would.
    for (let i = 0; i < 12 && g.dialogue.active; i++) g.dialogue.close();
    return {
      said,
      stage: g.progress.trade.stage, item: g.progress.trade.item,
      rod: g.progress.items.rod || 0, gotRod: !!g.progress.flags.gotRod,
    };
  };
});
const go = (mapId, key) => page.evaluate(([m, k]) => window.__go(m, k), [mapId, key]);
const talk = () => page.evaluate(() => window.__talk());

await page.evaluate(() => { window.__game.newGame(0, 'CHAIN'); window.__game.mode = 'play'; });

section('playing the chain');

// Talking to a link whose turn has not come must do NOTHING. This is the
// failure a stage counter is there to prevent: a trader who takes what you are
// holding because it happens to be what they asked for skips half the chain.
{
  const d5 = deals.get(5).at;
  await go(d5.mapId, d5.key);
  const r = await talk();
  check('a link whose turn has not come trades nothing',
    r.stage === 0 && !r.item, `stage=${r.stage} item=${r.item}`);
  check('...and still says its own line', !!r.said, 'the box was empty');
}

let ok = true;
for (const s of stages) {
  const d = deals.get(s);
  const there = await go(d.at.mapId, d.at.key);
  if (!there) { check(`stage ${s}: the trader is in ${d.at.mapId} ${d.at.key}`, false); ok = false; break; }
  // The Maku Tree wants an Essence as well, and must refuse without one.
  if (d.needEssences) {
    const before = await talk();
    check(`stage ${s} refuses without ${d.needEssences} Essence(s)`,
      before.stage === s - 1, `stage=${before.stage}`);
    await page.evaluate(n => { for (let i = 1; i <= n; i++) window.__game.claimEssence(i); }, d.needEssences);
  }
  const r = await talk();
  const want = d.gives || null;
  const got = r.stage === s && (r.item || null) === want;
  check(`stage ${s}: ${d.wants || 'nothing'} -> ${d.gives || d.item}`, got,
    `stage=${r.stage} holding=${r.item}`);
  if (!got) { ok = false; break; }
  if (s === N) {
    check('the chain ends with the Resonance Rod in the inventory', r.rod >= 1, `rod=${r.rod}`);
    check('...and gotRod set, which is the flag the world already reads', r.gotRod);
  }
}
check('the whole chain can be walked end to end', ok);

// Coming back to a spent link says the line written for afterwards, and takes
// nothing: a chain you can run twice is a chain that can hand out two Rods.
{
  const d2 = deals.get(2).at;
  await go(d2.mapId, d2.key);
  const r = await talk();
  check('a spent link trades nothing when you come back',
    r.stage === N, `stage=${r.stage}`);
}

section('the consumer: the Abyssal Keep grate');
//
// The one thing in the game that asks whether the player went and did the trade
// (dungeons-b.js, Colonnade of the Drowned). It was written against the Rod
// before the chain existed, and it has to still work now that the Rod comes out
// of the chain instead of out of an Essence count.
{
  const r = await page.evaluate(async () => {
    const g = window.__game;
    const { F } = await import('/src/world/tileset.js');
    g.mode = 'play';
    g.enterMap('d6', 1, 2, 4, 4 * 16, 5 * 16, 'up', { instant: true });
    g.mode = 'play';
    g.progress.items.rod = 1;
    g.progress.equipB = 'rod';
    g.player.x = 4 * 16; g.player.y = 5 * 16; g.player.invuln = 100000;
    const grates = [];
    for (let y = 0; y < 8; y++) for (let x = 0; x < 10; x++) {
      if (g.room.flagsAt(x, y, g.tide) & F.RING) grates.push([x, y]);
    }
    const before = grates.map(([x, y]) => g.room.tile(x, y, g.tide.level).name);
    const { ringResonance } = await import('/src/game/items.js');
    ringResonance(g, g.player, 1);
    window.__harness.step(4);
    const after = grates.map(([x, y]) => g.room.tile(x, y, g.tide.level).name);
    const solidAfter = grates.filter(([x, y]) => g.room.flagsAt(x, y, g.tide) & F.SOLID).length;
    const chest = g.entities.filter(e => e.constructor && e.constructor.name === 'Chest').length;
    return { n: grates.length, before, after, solidAfter, chest };
  });
  check('the Colonnade still has a grate on it', r.n > 0, `${r.n} ringable tiles`);
  check('the grate is solid until it is rung', r.before.length > 0);
  check('the Rod retracts it', r.solidAfter === 0,
    `${r.solidAfter} of ${r.n} still solid: ${r.before.join(',')} -> ${r.after.join(',')}`);
  check('and there is still a chest behind it', r.chest > 0, `${r.chest} chests`);
}

check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));

await browser.close();
server.close();

console.log(`\n=== ${passed} passed, ${failures.length} failed ===`);
if (failures.length) process.exit(1);
