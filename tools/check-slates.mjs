// THE SLATE SLOTS (S211, docs/briefs/PUZZLE-PASS.md "More"; Ages'
// INTERAC_SLATE_SLOT, slateSlot.s and scriptHelper.s slateSlot_placeSlate,
// room $58a of the Ancient Tomb). The cartridge's four slates are found round
// the dungeon and pushed into four slots round its stair down; Link leans on
// a slot for ten frames and a slate goes in. OUR TWIST: each slot is cut at
// its own height in the wall, and the sea decides how high Link is. Standing
// dry he reaches a LOW slot, wading a MIDDLE one, and swimming (floated up)
// a HIGH one, so the conch decides which slot he can fill.
//
// A room claims it:
//
//   slateRoom: { slots: [{ at: [x, y], face: 'N'|'E'|'S'|'W', height: 'low'|'mid'|'high' }],
//                from: [x, y], opens: [x, y] }
//
// `face` is the side of the slot Link leans on it from; the tile there is
// where he stands. Proved by the model:
//
//   1. every slot is a slot tile, and the tile it is leaned on from is not;
//   2. every slot's standing tile can be reached from `from` at every sea
//      (the slots are a lock, not a maze: the sea is the whole question);
//   3. at exactly one sea Link is at that slot's height there (dry for low,
//      wading for mid, swimming for high), so exactly one sea fills it;
//   4. between them the slots need more than one sea;
//   5. for a room in a dungeon: the dungeon holds exactly as many slates as
//      the room has slots (S212: `pickup`s of kind `slate` in the Hold), each
//      lying on a cell no foot reaches (the dungeon flood never stands on
//      it), under a Keep shaft one floor up whose side the flood does stand
//      on — the Dredge Line is the only way to it.
// And, in the engine, for a built room:
//   5b. each slate: the line cast over its shaft at LOW (a dry hole) brings
//      nothing; at MID (flooded) it brings the slate up and into the count,
//      and a second cast brings nothing;
//   6. leaning on a slot at its sea for SLATE_PUSH_FRAMES puts a slate in,
//      and one frame short does not; at another sea it says why and keeps the
//      slate; with no slate it says so;
//   7. the last slate sinks the dais and stands the stair up at `opens`, and
//      the stair goes on; a save and a load keeps every slate in and the dais
//      down;
//   8. the inventory's second page shows the slates in hand, as Ages does.
//
// Usage: node tools/check-slates.mjs
//        node tools/check-slates.mjs --mock spec.json   (model only: spec
//        { legend, rooms: { name: grid }, claims: { name: { slates: {...} } } })
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { installData } from '../src/data/index.js';
import { MAPS, getRoom, registerMap, cellBeneath } from '../src/world/maps.js';
import { floodDungeon } from './lib/dungeon-flood.mjs';
import { F, getTileDef } from '../src/world/tileset.js';
import { tileWalkable, ROUTE_AVOID, capsForDungeonIndex } from './lib/collision.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
installData();
let pass = 0; const fail = [];
const check = (n, c, d) => c ? (pass++, console.log('  ok   ' + n))
  : (fail.push(n), console.log('  FAIL ' + n + (d ? ' — ' + d : '')));
const SEA = ['LOW', 'MID', 'HIGH'];
const FACE = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };

/** How high the sea puts Link on (x, y) at `lv`: 'low' dry, 'mid' wading, 'high' swimming. */
export function heightAt(room, x, y, lv) {
  const f = room.flagsAt(x, y, lv);
  if (f & F.DEEP) return 'high';
  if (f & F.WATER) return 'mid';
  return 'low';
}

/** Every slate lying in `mapId` (a `pickup` of kind `slate`), the shaft one
 *  floor above it, and a tile beside that shaft to cast from. */
function slatesOf(mapId) {
  const m = MAPS.get(mapId), out = [];
  const fl = floodDungeon(mapId);
  for (const [rk, def] of Object.entries(m.roomDefs)) {
    for (const e of def.entities || []) {
      if (e[0] !== 'pickup' || !e[3] || e[3].kind !== 'slate') continue;
      out.push({ rk, x: e[1], y: e[2], shaft: null, cast: null });
    }
  }
  for (const [rk, def] of Object.entries(m.roomDefs)) {
    const [f, rx, ry] = rk.split(',').map(Number);
    const room = getRoom(mapId, f, rx, ry);
    for (let y = 0; y < room.th; y++) for (let x = 0; x < room.tw; x++) {
      if (![0, 1, 2].some(lv => room.tile(x, y, lv).shaft)) continue;
      const c = cellBeneath(mapId, room, x, y);
      if (!c) continue;
      const sl = out.find(s => s.rk === c.room.key && s.x === c.tx && s.y === c.ty);
      if (!sl) continue;
      sl.shaft = { rk, x, y };
      for (const [face, [dx, dy]] of Object.entries(FACE)) {
        const sx = x - dx, sy = y - dy;
        if (fl.seen.has(`${rk}:${sx},${sy}`) && tileWalkable(room, sx, sy, 1, capsForDungeonIndex(m.dungeon.index), ROUTE_AVOID)) {
          sl.cast = { x: sx, y: sy, dir: { N: 'up', S: 'down', E: 'right', W: 'left' }[face] }; break;
        }
      }
    }
  }
  return out;
}

const MOCK = process.argv.includes('--mock') ? process.argv[process.argv.indexOf('--mock') + 1] : null;
const CLAIMS = [];
if (MOCK) {
  const spec = JSON.parse(await readFile(MOCK, 'utf8'));
  for (const [name, grid] of Object.entries(spec.rooms)) {
    const c = spec.claims && spec.claims[name];
    if (!c || !c.slates) continue;
    const id = 'mock_' + name;
    registerMap({ id, kind: 'dungeon', name: 'Mock', w: 3, h: 3, floors: 1, cell: [15, 11],
      legend: (spec.legends && spec.legends[name]) || spec.legend, dungeon: { index: c.index || 6 },
      rooms: { '0,0,0': { name, map: grid } } });
    CLAIMS.push({ mapId: id, key: '0,0,0', def: { name }, k: c.slates, index: c.index || 6, mock: true });
  }
} else {
  for (const [mapId, m] of MAPS) {
    for (const [key, def] of Object.entries(m.roomDefs || {})) {
      if (!def.slateRoom) continue;
      CLAIMS.push({ mapId, key, def, k: def.slateRoom, index: m.dungeon ? m.dungeon.index : 0, map: m });
    }
  }
}

console.log(`check-slates: ${CLAIMS.length} slate room(s)${MOCK ? ' (mock)' : ''}`);
for (const c of CLAIMS) {
  const { k } = c, tag = `${c.mapId} ${c.key} (${c.def.name})`;
  const room = getRoom(c.mapId, ...c.key.split(',').map(Number));
  const caps = capsForDungeonIndex(c.index);
  const stand = (s) => [s.at[0] + FACE[s.face][0], s.at[1] + FACE[s.face][1]];
  // 1.
  const isSlot = (x, y) => { const d = getTileDef(room.baseName(x, y)); return !!(d && d.slot); };
  check(`${tag}: every slot is a slot in the wall, leaned on from open floor`,
    k.slots.every(s => isSlot(...s.at) && !isSlot(...stand(s))));
  // 2.
  const flood = (lv) => {
    const W = room.tw, seen = new Set([k.from[1] * W + k.from[0]]), q = [k.from];
    while (q.length) {
      const [x, y] = q.pop();
      for (const [dx, dy] of Object.values(FACE)) {
        const nx = x + dx, ny = y + dy, kk = ny * W + nx;
        if (nx < 0 || ny < 0 || nx >= W || ny >= room.th || seen.has(kk)) continue;
        if (!tileWalkable(room, nx, ny, lv, caps, ROUTE_AVOID)) continue;
        seen.add(kk); q.push([nx, ny]);
      }
    }
    return seen;
  };
  const reach = [0, 1, 2].map(flood);
  const cut = [];
  k.slots.forEach((s, i) => { const [x, y] = stand(s); for (let lv = 0; lv < 3; lv++) if (!reach[lv].has(y * room.tw + x)) cut.push(`slot ${i}@${SEA[lv]}`); });
  check(`${tag}: every slot can be walked or swum to at every sea`, !cut.length, cut.join(' '));
  // 3.
  const seaOf = k.slots.map(s => [0, 1, 2].filter(lv => heightAt(room, ...stand(s), lv) === s.height));
  k.slots.forEach((s, i) => {
    check(`${tag}: slot ${i} (${s.height}, from the ${s.face}) is level with Link at exactly one sea`,
      seaOf[i].length === 1, seaOf[i].map(l => SEA[l]).join(',') || 'never');
  });
  // 4.
  check(`${tag}: the slots need more than one sea between them`, new Set(seaOf.map(a => a.join())).size > 1);
  console.log(`       ${tag}: ` + k.slots.map((s, i) => `${s.face}=${seaOf[i].map(l => SEA[l]).join('')}`).join(' '));
  // 5.
  if (!c.mock) {
    const slates = slatesOf(c.mapId);
    check(`${tag}: the dungeon holds as many slates as there are slots (${slates.length} of ${k.slots.length})`, slates.length === k.slots.length);
    const fl = floodDungeon(c.mapId);
    for (const sl of slates) {
      const st = `${sl.rk} ${sl.x},${sl.y}`;
      check(`${tag}: slate at ${st} lies where no foot reaches`, !fl.seen.has(`${sl.rk}:${sl.x},${sl.y}`));
      check(`${tag}: slate at ${st} lies under a Keep shaft`, !!sl.shaft, 'nothing above it');
      if (sl.shaft) check(`${tag}: slate at ${st}: the flood stands beside its shaft (${sl.shaft.rk} ${sl.shaft.x},${sl.shaft.y})`, !!sl.cast);
    }
    c.slates = slates;
  }
}

// 5b, 6, 7, in the engine.
const BUILT = CLAIMS.filter(c => !c.mock);
if (BUILT.length) {
  const { chromium } = await import('playwright');
  const { installRuntime } = await import('./actor-runtime.mjs');
  const { SLATE_PUSH_FRAMES: N } = await import('../src/data/feel.js');
  const server = createServer(async (req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
    const full = join(ROOT, normalize(p)); const st = await stat(full).catch(() => null);
    if (!st || !st.isFile()) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': extname(full) === '.html' ? 'text/html' : 'text/javascript' }); res.end(await readFile(full));
  });
  await new Promise(r => server.listen(0, r));
  const browser = await chromium.launch().catch(() =>
    chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' }));
  const page = await browser.newPage();
  const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.goto(`http://localhost:${server.address().port}/index.html`);
  await page.waitForFunction(() => window.__game && window.__harness);
  await page.evaluate(installRuntime);
  const run = (setup, plan) => page.evaluate(async ([setup, plan]) => {
    const g = window.__game;
    window.__rp.beginRecord(setup, plan);
    for (let i = 0; i < 4; i++) window.__rp.pump(1);
    for (const e of g.entities) if (e.isEnemy) e.remove = true;
    g.enemiesOff = true; g.player.invuln = 1e6;
    let err = null;
    try { for (let n = 0; n < 900 && !window.__rp.pump(100).done; n++); } catch (e) { err = String(e && e.message || e); }
    return { err, slates: g.progress.slates || 0, room: g.mapId + ' ' + g.room.key, tide: g.tide.level };
  }, [setup, plan]);
  const base = { seed: 20261026, items: { sword: 1, conch: 1, dredge: 1, cleats: 2 }, equipA: 'dredge', equipB: 'conch',
    maxHearts: 40, hearts: 40, bossKey: 'd6' };
  for (const c of BUILT) {
    const { k } = c, tag = `${c.mapId} ${c.key} (${c.def.name})`;
    // 5b. Each slate comes up its shaft at MID, and not at LOW.
    for (const sl of c.slates || []) {
      if (!sl.cast) continue;
      const [f, rx, ry] = sl.shaft.rk.split(',').map(Number);
      const enter = [c.mapId, f, rx, ry, sl.cast.x * 16, sl.cast.y * 16, sl.cast.dir];
      const low = await run({ ...base, tide: 0, slates: 0, enter }, [['dredge', sl.cast.x, sl.cast.y, sl.cast.dir, 'slate', 400]]);
      const mid = await run({ ...base, tide: 1, slates: 0, enter }, [['dredge', sl.cast.x, sl.cast.y, sl.cast.dir, 'slate', 1200],
        ['dredge', sl.cast.x, sl.cast.y, sl.cast.dir, 'slate', 400]]);
      const st = `${sl.rk} ${sl.x},${sl.y}`;
      check(`${tag}: slate at ${st}: cast over its dry shaft at LOW, nothing comes up`, !low.err && low.slates === 0, JSON.stringify(low));
      check(`${tag}: slate at ${st}: cast over its flooded shaft at MID, it comes up, once`, !mid.err && mid.slates === 1, JSON.stringify(mid));
    }
    // 6. Each slot, leaned on frame by frame.
    const [f, rx, ry] = c.key.split(',').map(Number);
    const HI = { low: 0, mid: 1, high: 2 };
    const DIR = { N: 'down', S: 'up', E: 'left', W: 'right' };
    const r = await page.evaluate(async ([setup, k, N, HI, DIR, FACE]) => {
      const g = window.__game, h = window.__harness, out = [];
      window.__rp.beginRecord(setup, [['wait', 2]]);
      for (let i = 0; i < 4; i++) window.__rp.pump(1);
      const p = g.player;
      const said = () => { const t = g.dialogue.active ? String(g.dialogue.pages ? g.dialogue.pages.join(' ') : g.dialogue.text || '') : ''; return t; };
      const lean = (s, lv, slates, frames) => {
        g.tide.clearOverrides(); g.tide.setLevel(lv, { instant: true });
        g.progress.slates = slates; g.dialogue.active = false;
        const [dx, dy] = FACE[s.face];
        const sx = s.at[0] + dx, sy = s.at[1] + dy;
        p.x = sx * 16; p.y = sy * 16; p.fx = p.x * 256; p.fy = p.y * 256; p._pushT = 0;
        const inp = g.input, upd = inp.update, d = DIR[s.face];
        inp.update = function () { for (const b of Object.keys(this.held)) { this.prev[b] = this.held[b]; this.held[b] = b === d; } };
        const before = g.room.baseName(s.at[0], s.at[1]);
        let fillAt = -1, firstPush = -1, text = '';
        for (let i = 0; i < frames; i++) {
          h.step(1);
          if (firstPush < 0 && p._pushT > 0) firstPush = i;
          if (fillAt < 0 && g.room.tile(s.at[0], s.at[1], lv).name !== g.room.baseTile?.(s.at[0], s.at[1])?.name
            && g.room.override[s.at[1] * g.room.tw + s.at[0]]) fillAt = i;
          if (!text && g.dialogue.active) text = JSON.stringify(g.dialogue.pages || g.dialogue.lines || g.dialogue.text || '');
          if (fillAt >= 0 || text) break;
        }
        inp.update = upd; h.step(1); g.dialogue.active = false;
        return { firstPush, fillAt, text, slates: g.progress.slates, before };
      };
      for (const s of k.slots) {
        const lv = HI[s.height];
        // A slot can be leaned on short of its frames: the first frame he
        // pushes is frame 1 of the count.
        const o = { s };
        o.none = lean(s, lv, 0, 120);
        o.wrong = [0, 1, 2].filter(l => l !== lv).map(l => ({ lv: l, ...lean(s, l, 1, 120) }));
        o.right = lean(s, lv, 1, 120);
        out.push(o);
      }
      // 7. All filled: the dais is down and the stair is up.
      out.stair = g.room.tile(k.opens[0], k.opens[1], 0).name;
      out.dais = (() => { const [x0, y0, x1, y1] = k.dais; const bad = [];
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
          if (x !== x0 && x !== x1 && y !== y0 && y !== y1) continue;
          if (k.slots.some(s => s.at[0] === x && s.at[1] === y)) continue;
          if (g.room.flagsAt(x, y, 0) & 1) bad.push(x + ',' + y);
        } return bad; })();
      g.save(); g.loadGame(g.slot != null ? g.slot : 0); for (let i = 0; i < 4; i++) { h.step(1); g.dialogue.active = false; }
      out.reload = { stair: g.room.tile(k.opens[0], k.opens[1], 0).name,
        filled: k.slots.map(s => !!g.room.override[s.at[1] * g.room.tw + s.at[0]]), room: g.room.key };
      return { slots: out.map(o => ({ ...o, s: undefined })), stair: out.stair, dais: out.dais, reload: out.reload };
    }, [{ ...base, tide: 0, slates: 0, enter: [c.mapId, f, rx, ry, k.from[0] * 16, k.from[1] * 16, 'up'] }, k, N, HI, DIR, FACE]);
    k.slots.forEach((s, i) => {
      const o = r.slots[i];
      check(`${tag}: slot ${i} (${s.face}, ${s.height}): with no slate it says something fits`,
        o.none.fillAt < 0 && /fits/.test(o.none.text), JSON.stringify(o.none));
      check(`${tag}: slot ${i}: at the other seas it says why and keeps the slate`,
        o.wrong.every(w => w.fillAt < 0 && w.slates === 1 && /high|under|above/i.test(w.text)), JSON.stringify(o.wrong));
      check(`${tag}: slot ${i}: at its sea the slate goes in after exactly ${N} frames of leaning`,
        o.right.fillAt >= 0 && o.right.fillAt - o.right.firstPush + 1 === N && o.right.slates === 0, JSON.stringify(o.right));
    });
    check(`${tag}: the last slate sinks the dais`, r.dais.length === 0, r.dais.join(' '));
    check(`${tag}: and stands the stair up at ${k.opens}`, /Stairs/.test(r.stair), r.stair);
    check(`${tag}: after a save and a load every slot holds its slate and the stair stands`,
      r.reload.filled.every(Boolean) && /Stairs/.test(r.reload.stair), JSON.stringify(r.reload));
    // 7b. The stair goes on.
    const w = (c.def.warps || []).find(w => w.x === k.opens[0] && w.y === k.opens[1]);
    const secrets = k.slots.map((_, i) => `${c.mapId}:${c.key}:slot${i}`);
    const up = await run({ ...base, tide: 0, slates: 0, secrets, enter: [c.mapId, f, rx, ry, k.from[0] * 16, k.from[1] * 16, 'up'] },
      [['goto', k.opens[0], k.opens[1] + 1, 1500], ['hold', ['up'], 40], ['wait', 60]]);
    const to = w && `${w.to.map} ${w.to.floor},${w.to.rx},${w.to.ry}`;
    check(`${tag}: the stair takes Link on (${to})`, !!w && up.room === to, JSON.stringify(up));
  }
  // 8. The inventory counts them as Ages does (S213): TREASURE_SLATE's place
  // on page 2, the tablet and "x" and the count, while any are in hand.
  const inv = await page.evaluate(() => {
    const g = window.__game, out = {};
    for (const n of [0, 1, 4]) {
      g.progress.slates = n;
      const t = g.menu.treasures[9];
      out[n] = t && { icon: t.icon, times: t.times };
    }
    return out;
  });
  check('the inventory shows the slates in hand on page 2, as "x" and a count',
    inv[1] && inv[1].icon === 'p_slate' && inv[1].times === 1 && inv[4] && inv[4].times === 4, JSON.stringify(inv));
  check('and nothing there with none in hand', inv[0] == null, JSON.stringify(inv));
  check('no console errors in the engine half', !errors.length, errors[0]);
  await browser.close(); server.close();
}

console.log(`\n=== ${pass} passed, ${fail.length} failed ===`);
process.exit(fail.length ? 1 : 0);
