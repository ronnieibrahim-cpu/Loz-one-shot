// THE BOGWATER SANCTUM'S DROP HOLES AND CRACKED FLOORS (S181).
//
// The Sanctum's machine is "the bog is a sieve over a cellar": every hole
// lands on the same spot of the room below, the sea decides what each hole is,
// and the Anchor — which stays where it bit when you leave the room — is how
// two floors stand at two different seas (docs/briefs/D3-BOGWATER-SANCTUM.md).
// The shaft (`F.DROP`) is a tide tile: an open hole at LOW and ONLY at LOW (the
// human's choice, S181), flooded above it. A drop whose landing is no landing
// — a pit below, a wall, deep water with no Cleats — is a pit fall upstairs.
// The cracked floor gives way under a player who STANDS on it for
// CRACK_BREAK_FRAMES, never under one who walks across, and becomes a shaft.
//
// This proves, for EVERY drop and crack cell in the world (found in the room
// data, not declared):
//
//   1. a shaft is a hole at LOW and nowhere else, flooded at MID and HIGH, and
//      a cracked floor in a pool shows only while the pool is dry;
//   2. there is a room directly beneath it, with somewhere to land at some sea;
//   3. in the real engine, Link stepping into the hole at LOW falls, arrives
//      in the room beneath at the same cell, unhurt, standing — or, where the
//      cell below is no landing at LOW, is put back upstairs a pit fall the
//      poorer; and at MID, with no Cleats, he does not go down at all.
//
// And the room claims (`shaftRoom`), each proved both ways:
//
//   * `lands: [[x, y]]` — a cell of the room beneath that this room's holes
//     (or its crack) are the ONLY way to: the dungeon flood
//     (tools/lib/dungeon-flood.mjs) reaches it, and does not with this room's
//     drops taken out of the world. The Bog Hub's key pen, the Sluice Cell's
//     Drain Weir, the Silt Cell's Root Cellar. (The Drowned Nave's hole is the
//     first and the safe one, and the Hub's pens lead to the same corridor.)
//   * `anchor: { from, at, then }` — the Sluice Cell's two seas at once, in the
//     engine: walking from `from` into the shaft does NOT land at sea `at`, at
//     `then`, or at HIGH; and with the Anchor biting beside the shaft at `at`
//     and the conch then sounded to `then`, it does, standing.
//   * a crack: walked across, it holds; stood on one frame short, it holds; at
//     CRACK_BREAK_FRAMES it gives way, for good, and drops him through.
//
// Usage: node tools/check-shafts.mjs
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { installRuntime } from './actor-runtime.mjs';
import { installData } from '../src/data/index.js';
import { MAPS, getRoom } from '../src/world/maps.js';
import { F } from '../src/world/tileset.js';
import { floodDungeon } from './lib/dungeon-flood.mjs';
import { CRACK_BREAK_FRAMES } from '../src/data/feel.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
installData();

let pass = 0; const fail = [];
const check = (n, c, d) => c ? (pass++, console.log('  ok   ' + n))
  : (fail.push(n), console.log('  FAIL ' + n + (d ? ' — ' + d : '')));

// --- every drop and crack cell in the world, found rather than declared ------
const SHAFTS = [];   // { mapId, key, x, y, drop: [levels], pit: [levels], deep: [levels] }
const CRACKS = [];   // { mapId, key, x, y, levels }
for (const [mapId, m] of MAPS) {
  for (const key of Object.keys(m.roomDefs || {})) {
    const room = getRoom(mapId, ...key.split(',').map(Number));
    for (let y = 0; y < room.th; y++) for (let x = 0; x < room.tw; x++) {
      const at = (mask) => [0, 1, 2].filter(t => (room.flagsAt(x, y, t) & mask) === mask);
      const drop = at(F.DROP);
      if (drop.length) SHAFTS.push({ mapId, key, x, y, m, room, drop, hole: at(F.DROP | F.PIT), deep: at(F.DROP | F.DEEP) });
      const crack = [0, 1, 2].filter(t => room.tile(x, y, t).crack);
      if (crack.length) CRACKS.push({ mapId, key, x, y, m, room, levels: crack });
    }
  }
}
check('there are drop holes in the world', SHAFTS.length > 0);
check('there is cracked floor in the world', CRACKS.length > 0);
console.log(`       ${SHAFTS.length} shaft cells in ${new Set(SHAFTS.map(p => p.mapId + ' ' + p.key)).size} rooms, `
  + `${CRACKS.length} cracked cells`);

const landsAt = (m, key, x, y) => {
  const [f, rx, ry] = key.split(',').map(Number);
  const below = `${f - 1},${rx},${ry}`;
  if (!m.roomDefs[below]) return null;
  const r = getRoom(m.id, f - 1, rx, ry);
  // Standable at that sea on foot, or deep water a Cleats-wearer swims in —
  // the same question Game.holeLanding asks, without a player to ask it of.
  return [0, 1, 2].filter(t => {
    const fl = r.flagsAt(x, y, t);
    return !(fl & (F.SOLID | F.VOID | F.PIT));
  });
};

// A hole over nothing a player can land on is a pit, and only a room that
// says so (`shaftRoom.decoy`) may have one: the Bog Hub's fourth hole.
const decoy = (s) => {
  const d = s.m.roomDefs[s.key].shaftRoom;
  return !!(d && d.decoy && d.decoy.some(([x, y]) => x === s.x && y === s.y));
};
for (const s of SHAFTS) {
  const where = `${s.mapId} ${s.key} ${s.x},${s.y}`;
  check(`${where}: an open hole at LOW and only at LOW`, JSON.stringify(s.hole) === '[0]', `hole at ${s.hole}`);
  check(`${where}: flooded at MID and HIGH`, JSON.stringify(s.deep) === '[1,2]', `deep at ${s.deep}`);
  const l = landsAt(s.m, s.key, s.x, s.y);
  if (decoy(s)) check(`${where}: a declared decoy — a room beneath it, and no landing at any sea`, l && l.length === 0, l ? `lands at ${l}` : 'no room beneath');
  else check(`${where}: a room beneath it with somewhere to land`, l && l.length > 0, l ? `lands at ${l}` : 'no room beneath');
}
for (const c of CRACKS) {
  const where = `${c.mapId} ${c.key} ${c.x},${c.y}`;
  // A crack shows only while its cell is dry: never a cracked floor under water.
  const wet = c.levels.filter(t => c.room.flagsAt(c.x, c.y, t) & F.WET);
  check(`${where}: a cracked floor only while it is dry`, wet.length === 0, `under water at ${wet}`);
  const l = landsAt(c.m, c.key, c.x, c.y);
  check(`${where}: a room beneath it with somewhere to land`, l && l.length > 0, l ? `lands at ${l}` : 'no room beneath');
}

// --- the claims: somewhere only this room's holes reach ----------------------
const CLAIMS = [];
for (const [mapId, m] of MAPS) {
  for (const [key, def] of Object.entries(m.roomDefs || {})) if (def.shaftRoom) CLAIMS.push({ mapId, key, def, m });
}
check('at least three rooms claim a floor only their holes reach', CLAIMS.filter(c => (c.def.shaftRoom.lands || []).length).length >= 3);
const full = new Map();
for (const c of CLAIMS) {
  if (!full.has(c.mapId)) full.set(c.mapId, floodDungeon(c.mapId));
  const withD = full.get(c.mapId);
  const without = floodDungeon(c.mapId, { dropSkip: c.key });
  const [f, rx, ry] = c.key.split(',').map(Number);
  const below = `${f - 1},${rx},${ry}`;
  for (const [x, y] of c.def.shaftRoom.lands || []) {
    const k = `${below}:${x},${y}`;
    check(`${c.mapId} ${c.key} (${c.def.name}): ${below} ${x},${y} is reached through its holes`, withD.seen.has(k));
    check(`${c.mapId} ${c.key} (${c.def.name}): ...and by nothing else`, !without.seen.has(k));
  }
}

// --- in the engine ------------------------------------------------------------
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const fp = join(ROOT, normalize(p)); const st = await stat(fp).catch(() => null);
  if (!st || !st.isFile()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': extname(fp) === '.html' ? 'text/html' : 'text/javascript' }); res.end(await readFile(fp));
});
await new Promise(r => server.listen(0, r));
const browser = await chromium.launch().catch(() =>
  chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' }));
const page = await browser.newPage();
const errs = [];
page.on('pageerror', e => errs.push(String(e.message || e)));
await page.goto(`http://localhost:${server.address().port}/index.html`);
await page.waitForFunction(() => window.__game && window.__harness);
await page.evaluate(installRuntime);

/**
 * Boot into `key` of `mapId` at sea `tide`, stand Link at tile (sx, sy), run
 * `pre` (an anchor, a change of sea), then hold `dir` for `walk` frames and
 * let `settle` more go by. Enemies are cleared every frame: what is asked is
 * the hole's, not a keese's.
 */
async function run(o) {
  const [f, rx, ry] = o.key.split(',').map(Number);
  await page.evaluate(([setup, steps]) => window.__rp.beginRecord(setup, steps), [{
    seed: 20260930, items: { sword: 1, conch: 1, anchor: 1, ...(o.items || {}) },
    equipA: 'sword', equipB: 'conch', maxHearts: 24, hearts: 24, tide: o.tide,
    enter: [o.mapId, f, rx, ry, o.sx * 16, o.sy * 16, o.dir || 'down'],
  }, [['wait', 2], ...(o.dir ? [['hold', [o.dir], o.walk || 0]] : []), ['wait', o.settle || 200]]]);
  return page.evaluate(async (o) => {
    const g = window.__game, pl = g.player;
    const clear = () => { for (const e of g.entities) if (e.isEnemy) e.remove = true; };
    clear();
    if (o.anchor) {
      const [ax, ay, lv] = o.anchor;
      g.tide.addOverride({ mapId: g.mapId, roomKey: g.room.key, tx: ax, ty: ay, r: 2, shape: 'square', level: lv, src: 'anchor' });
      g.respawnAnchor();
    }
    if (o.then != null) g.tide.setLevel(o.then, { instant: true });
    if (o.sunk) { pl.underwater = true; pl.cleatMode = 'sink'; pl.breath = 9999; }
    // Feet (the point groundFlags asks about) in the middle of tile (sx, sy).
    pl.x = o.sx * 16 + 8 - (pl.hb.x + pl.hb.w / 2); pl.y = o.sy * 16 + 8 - (pl.hb.y + pl.hb.h - 2);
    pl.lastSafe.x = pl.x; pl.lastSafe.y = pl.y;
    pl.invuln = 0; pl.hurtTime = 0;
    const hp = g.progress.hearts;
    let crackBroke = -1, fell = false;
    for (let i = 0; i < 2000; i++) {
      // Clearing a room of its enemies can pay out its puzzle, and the line
      // that says so would stop him where he stands.
      clear();
      if (g.dialogue) g.dialogue.active = false;
      if (o.crack && crackBroke < 0 && !g.room.tile(o.crack[0], o.crack[1], g.tide).crack && g.room.floor === o.f) crackBroke = i;
      if (pl.falling > 0) fell = true;
      const r = window.__rp.pump(1);
      if (r.done) break;
    }
    if (g.dialogue) g.dialogue.active = false;
    return {
      floor: g.room.floor, rx: g.room.rx, ry: g.room.ry, map: g.mapId,
      at: [Math.floor(pl.cx / 16), Math.floor((pl.y + pl.hb.y + pl.hb.h - 2) / 16)],
      hurt: g.progress.hearts < hp, fell, crackBroke,
      standing: pl.falling === 0 && !pl.droppingIn && pl.collapsed === 0 && pl.washing === 0,
      persisted: Object.keys(g.progress.doors).filter(k => k.startsWith(g.mapId + ':')),
    };
  }, { ...o, f });
}

// Each shaft room: one walk into each of its holes' cells at LOW. A shaft
// cell is walked into from the floor beside it — arriving ON a hole is not
// how anyone meets one.
const byRoom = new Map();
for (const s of SHAFTS) {
  const k = s.mapId + ' ' + s.key;
  if (!byRoom.has(k)) byRoom.set(k, []);
  byRoom.get(k).push(s);
}
const DIRS = [['up', 0, 1], ['down', 0, -1], ['left', 1, 0], ['right', -1, 0]];
for (const [k, cells] of byRoom) {
  for (const s of cells) {
    // A neighbour that is plain standing floor at LOW, to walk in from.
    let from = null;
    for (const [dir, dx, dy] of DIRS) {
      const fx = s.x + dx, fy = s.y + dy;
      if (fx < 1 || fy < 1 || fx >= s.room.tw - 1 || fy >= s.room.th - 1) continue;
      if (s.room.flagsAt(fx, fy, 0) & (F.SOLID | F.PIT | F.DEEP | F.LEDGE | F.WARP)) continue;
      from = { dir, sx: fx, sy: fy }; break;
    }
    if (!from) continue;     // the middle of a run of hole: its edge cells answer for it
    const [f, rx, ry] = s.key.split(',').map(Number);
    const l = landsAt(s.m, s.key, s.x, s.y);
    const where = `${s.mapId} ${s.key} ${s.x},${s.y} (from ${from.sx},${from.sy})`;
    const low = await run({ mapId: s.mapId, key: s.key, tide: 0, ...from, walk: 24 });
    if (l.includes(0)) {
      check(`${where}: at LOW, he falls and lands below at the same cell, unhurt and standing`,
        low.fell && low.floor === f - 1 && low.rx === rx && low.ry === ry && !low.hurt && low.standing
          && Math.abs(low.at[0] - s.x) + Math.abs(low.at[1] - s.y) <= 1, JSON.stringify(low));
    } else {
      check(`${where}: at LOW the cell below is no landing, so it is a pit: he stays up, hurt`,
        low.fell && low.floor === f && low.hurt, JSON.stringify(low));
    }
    const mid = await run({ mapId: s.mapId, key: s.key, tide: 1, ...from, walk: 24 });
    check(`${where}: at MID, with no Cleats, he does not go down`, mid.floor === f && !mid.fell, JSON.stringify(mid));
  }
  // The flooded shaft is sunk down with the Cleats: one cell per room.
  const s = cells[0];
  const [f, rx, ry] = s.key.split(',').map(Number);
  const l = landsAt(s.m, s.key, s.x, s.y);
  const lv = [1, 2].find(t => l.includes(t));
  if (lv != null) {
    const sunk = await run({ mapId: s.mapId, key: s.key, tide: lv, sx: s.x, sy: s.y, sunk: true,
      items: { cleats: 1 }, settle: 120 });
    check(`${k} ${s.x},${s.y}: walking the bottom with the Cleats at ${['LOW', 'MID', 'HIGH'][lv]}, he goes down the flooded shaft`,
      sunk.floor === f - 1 && sunk.rx === rx && sunk.ry === ry, JSON.stringify(sunk));
  }
}

// The Anchor claims: two floors at two seas.
for (const c of CLAIMS) {
  const A = c.def.shaftRoom.anchor;
  if (!A) continue;
  const [f, rx, ry] = c.key.split(',').map(Number);
  const [sx, sy] = A.from;
  const [hx, hy] = (c.def.shaftRoom.lands || [[sx, sy - 1]])[0];
  // Walk from `from` straight at the shaft.
  const dir = hx === sx ? (hy < sy ? 'up' : 'down') : (hx < sx ? 'left' : 'right');
  const walk = (Math.abs(hx - sx) + Math.abs(hy - sy)) * 16 + 8;
  const nm = `${c.mapId} ${c.key} (${c.def.name})`;
  const went = (r) => r.floor === f - 1 && r.rx === rx && r.ry === ry;
  for (const t of [A.at, A.then, 2]) {
    const r = await run({ mapId: c.mapId, key: c.key, tide: t, sx, sy, dir, walk });
    check(`${nm}: with no Anchor, at ${['LOW', 'MID', 'HIGH'][t]} the shaft does not land`, !went(r), JSON.stringify(r));
  }
  const ok = await run({ mapId: c.mapId, key: c.key, tide: A.at, sx, sy, dir, walk,
    anchor: [hx, hy + (hy < sy ? 1 : -1), A.at], then: A.then });
  check(`${nm}: the Anchor biting beside the shaft at ${['LOW', 'MID', 'HIGH'][A.at]}, then the conch to ${['LOW', 'MID', 'HIGH'][A.then]}: he lands below, standing`,
    went(ok) && ok.standing && !ok.hurt, JSON.stringify(ok));
  const high = await run({ mapId: c.mapId, key: c.key, tide: A.at, sx, sy, dir, walk,
    anchor: [hx, hy + (hy < sy ? 1 : -1), A.at], then: 2 });
  check(`${nm}: ...and not with the conch at HIGH instead (no landing in deep water without the Cleats)`,
    !went(high), JSON.stringify(high));
}

// The cracks: walked across it holds; stood on it gives way at the frame.
for (const c of CRACKS) {
  const [f, rx, ry] = c.key.split(',').map(Number);
  const where = `${c.mapId} ${c.key} ${c.x},${c.y}`;
  const lv = c.levels[0];
  // Across: from the tile west of it, walk east two tiles.
  const across = await run({ mapId: c.mapId, key: c.key, tide: lv, sx: c.x - 1, sy: c.y, dir: 'right', walk: 32, settle: 10, crack: [c.x, c.y] });
  check(`${where}: walked across, it holds`, across.crackBroke < 0 && across.floor === f, JSON.stringify(across));
  // Stood on, one frame short and then the whole count.
  const short = await page.evaluate(async ([x, y, n]) => {
    const g = window.__game, pl = g.player;
    g.input.setMask(0);
    pl.x = x * 16 + 8 - (pl.hb.x + pl.hb.w / 2); pl.y = y * 16 + 8 - (pl.hb.y + pl.hb.h - 2);
    pl.crackT = 0; pl.crackAt = -1;
    for (let i = 0; i < n; i++) window.__harness.step(1);
    return { held: !!g.room.tile(x, y, g.tide).crack, floor: g.room.floor };
  }, [c.x, c.y, CRACK_BREAK_FRAMES - 1]);
  check(`${where}: stood on for ${CRACK_BREAK_FRAMES - 1} frames, it holds`, short.held && short.floor === f, JSON.stringify(short));
  const stood = await run({ mapId: c.mapId, key: c.key, tide: lv, sx: c.x, sy: c.y, settle: 400, crack: [c.x, c.y] });
  check(`${where}: stood on, it gives way at frame ${CRACK_BREAK_FRAMES} and drops him to the room beneath, standing`,
    stood.crackBroke >= CRACK_BREAK_FRAMES - 2 && stood.crackBroke <= CRACK_BREAK_FRAMES + 2
      && stood.floor === f - 1 && stood.rx === rx && stood.ry === ry && stood.standing && !stood.hurt, JSON.stringify(stood));
  check(`${where}: and it stays broken (saved)`, stood.persisted.some(k => k.endsWith(`${c.key}:${c.x},${c.y}`)), JSON.stringify(stood.persisted));
}

check('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
await browser.close(); server.close();
console.log(`\n=== ${pass} passed, ${fail.length} failed ===`);
process.exit(fail.length ? 1 : 0);
