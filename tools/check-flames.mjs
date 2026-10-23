// TORCHES THAT BURN OUT, AND A RISING SEA THAT PUTS THEM OUT (S206,
// docs/briefs/PUZZLE-PASS.md kind E; the Sunken Vestry and the Silt Vault).
//
// Seasons' timed torches (PART_LIGHTABLE_TORCH subid 1: Snake's Remains'
// Agunima room, the Explorer's Crypt's Poe rooms) burn TORCH_BURN_FRAMES and
// go dark. Ours do too, and any torch the sea reaches goes out the moment the
// water is over its foot, shallow or deep, and cannot be lit there. A room
// built on them declares
//
//   flameRoom: { from: [[x, y], ...], lights: [[seas], ...], anchor?: true }
//
// `from` is where Link walks in; `lights[i]` the seas at which the room's
// i-th burning torch (in room order) can be lit at all, by any means. This
// proves, per room, over tools/lib/flame-flood.mjs (tile, sea, the Anchor,
// which torches burn), every throw in it the ENGINE's own throw:
//
//   1. every torch the room's puzzle counts burns out (`burn`), and the claim
//      names them all;
//   2. each torch can be lit at exactly its claimed seas — set down, or
//      thrown lit from any tile Link can stand on (a table of real throws,
//      every standing pixel on a 6 px grid, each way, at each sea);
//   3. THE SEA MATTERS: with the water held at any one level, never all at
//      once;
//   4. without `anchor`, the conch alone lights them all; with `anchor`, it
//      cannot and one Anchor can (it is the Anchor's room);
//   5. NO TRAP: from everywhere the search reaches, a way in is reached again;
//
// and then in the real engine:
//
//   6. a lit torch burns exactly TORCH_BURN_FRAMES; the sea rising over a
//      lit one puts it out, going out again does not relight it, and while
//      it is under water it cannot be lit; a torch on dry floor outlives every
//      tide change;
//   7. the fewest-press solution, played at walking pace (16 frames a tile,
//      22 swimming), the conch really sounded and the Anchor really thrown,
//      has every torch burning before the first burns out, and pays out;
//   8. once solved, the torches burn on past TORCH_BURN_FRAMES, and a save
//      and a load bring them back lit.
//
// Usage: node tools/check-flames.mjs
//        node tools/check-flames.mjs --mock spec.json   (model only, every
//        throw counted as nothing: spec { legend, rooms: {name: grid},
//        torches: {name: [[x, y], ...]}, claims: {name: claim}, index? })
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { installData } from '../src/data/index.js';
import { MAPS, getRoom, registerMap } from '../src/world/maps.js';
import { TORCH_BURN_FRAMES } from '../src/data/feel.js';
import { capsForDungeonIndex } from './lib/collision.mjs';
import { makeFlameModel } from './lib/flame-flood.mjs';
import { F } from '../src/world/tileset.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
installData();

let pass = 0; const fail = [];
const check = (n, c, d) => c ? (pass++, console.log('  ok   ' + n))
  : (fail.push(n), console.log('  FAIL ' + n + (d ? ' — ' + d : '')));
const SEA = ['LOW', 'MID', 'HIGH'];
const MOCK = process.argv.includes('--mock') ? process.argv[process.argv.indexOf('--mock') + 1] : null;

const CLAIMS = [];
if (MOCK) {
  const spec = JSON.parse(await readFile(MOCK, 'utf8'));
  for (const [name, grid] of Object.entries(spec.rooms)) {
    if (!spec.claims[name]) continue;
    const id = 'mock_' + name;
    const ents = spec.torches[name].map(([x, y]) => ['torch', x, y, { burn: true }]);
    registerMap({
      id, kind: 'dungeon', name: 'Mock', w: 1, h: 1, floors: 1, cell: [15, 11], legend: spec.legend,
      dungeon: { index: spec.index || 3 }, rooms: { '0,0,0': { name, map: grid, entities: ents } },
    });
    CLAIMS.push({ mapId: id, key: '0,0,0', def: { name, map: grid, entities: ents }, k: spec.claims[name], index: spec.index || 3 });
  }
} else {
  for (const [mapId, m] of MAPS) {
    for (const [key, def] of Object.entries(m.roomDefs || {})) {
      const burns = (def.entities || []).some(e => Array.isArray(e) && e[0] === 'torch' && e[3] && e[3].burn);
      if (def.flameRoom) CLAIMS.push({ mapId, key, def, k: def.flameRoom, index: m.dungeon ? m.dungeon.index : 0 });
      else if (burns) check(`${mapId} ${key} (${def.name}): has torches that burn out and claims them`, false, 'no flameRoom');
    }
  }
  check('at least one room claims torches that burn out', CLAIMS.length > 0);
}

const torchesOf = (def) => (def.entities || []).filter(e => Array.isArray(e) && e[0] === 'torch').map(e => [e[1], e[2], !!(e[3] && e[3].burn)]);
const solidsOf = (def) => (def.entities || []).filter(e => Array.isArray(e) && ['chest', 'block', 'sign', 'statue'].includes(e[0])).map(e => [e[1], e[2]]);

// ---- the engine's throws ------------------------------------------------
let page = null, browser = null, server = null;
if (!MOCK) {
  const { chromium } = await import('playwright');
  const { installRuntime } = await import('./actor-runtime.mjs');
  server = createServer(async (req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
    const full = join(ROOT, normalize(p)); const s = await stat(full).catch(() => null);
    if (!s || !s.isFile()) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': extname(full) === '.html' ? 'text/html' : 'text/javascript' }); res.end(await readFile(full));
  });
  await new Promise(r => server.listen(0, r));
  browser = await chromium.launch().catch(() =>
    chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' }));
  page = await browser.newPage();
  await page.goto(`http://localhost:${server.address().port}/index.html`);
  await page.waitForFunction(() => window.__game && window.__harness);
  await page.evaluate(installRuntime);
}

async function enter(c, sea, at) {
  const [f, rx, ry] = c.key.split(',').map(Number);
  await page.evaluate(([setup]) => window.__rp.beginRecord(setup, [['wait', 2]]), [{
    seed: 20261023, items: { sword: 1, conch: 1, anchor: 1, kilnshell: 1, cleats: 1 }, equipA: 'sword', equipB: 'kilnshell',
    maxHearts: 24, hearts: 24, tide: sea,
    enter: [c.mapId, f, rx, ry, at[0] * 16, at[1] * 16, 'down'],
  }]);
  await page.evaluate(() => window.__rp.pump(10));
  await page.evaluate(() => {
    const g = window.__game;
    for (const e of g.entities) if (e.isEnemy) e.remove = true;
    window.__harness.step(1);
    g.player.invuln = 1e6;
  });
}

/** `${x},${y},${sea},${dir}` -> mask of torches a lit shell thrown from that tile lights. */
async function throwTable(c, torches, tiles) {
  await enter(c, 0, c.k.from[0]);
  return page.evaluate(async ([torches, tiles]) => {
    const g = window.__game, p = g.player, T = 16;
    const { Torch } = await import('/src/game/objects.js');
    const { Kilnshell } = await import('/src/game/items.js');
    const { canOccupy } = await import('/src/game/entity.js');
    const step = (n) => { for (let i = 0; i < n; i++) window.__harness.step(1); if (g.dialogue) g.dialogue.active = false; g.mode = 'play'; };
    const ts = torches.map(([x, y]) => g.entities.find(e => e instanceof Torch && Math.floor(e.cx / T) === x && Math.floor(e.cy / T) === y));
    g.room._puzzleDone = true;            // a sweep never pays the room out
    const out = {};
    let thrown = 0;
    for (const sea of [0, 1, 2]) {
      g.tide.clearOverrides(); g.tide.setLevel(sea, { instant: true }); step(1);
      for (const [x, y] of tiles[sea]) {
        for (const dir of ['up', 'down', 'left', 'right']) {
          let mask = 0;
          for (const ox of [0, 6, 12]) for (const oy of [0, 6, 12]) {
            const px = x * T + ox - 6, py = y * T + oy - 6;
            if (!canOccupy(g, p, px, py)) continue;
            for (const t of ts) { t.lit = false; t.left = 0; }
            for (const e of g.entities) if (e instanceof Kilnshell) e.remove = true;
            step(1);
            p.x = px; p.y = py; p.fx = px * 256; p.fy = py * 256; p.dir = dir;
            const sh = new Kilnshell(px, py, { lit: true });
            sh.carried = true; g.addEntity(sh); step(1);
            p.carrying = sh; p.throwCarried(g); thrown++;
            step(70);
            ts.forEach((t, i) => { if (t.lit) mask |= 1 << i; });
          }
          if (mask) out[`${x},${y},${sea},${dir}`] = mask;
        }
      }
    }
    for (const t of ts) { t.lit = false; t.left = 0; }
    g.room._puzzleDone = false;
    return { out, thrown };
  }, [torches, tiles]);
}

for (const c of CLAIMS) {
  const name = `${c.mapId} ${c.key} (${c.def.name})`;
  const room = getRoom(c.mapId, ...c.key.split(',').map(Number));
  const caps = capsForDungeonIndex(c.index);
  const all = torchesOf(c.def);
  const torches = all.map(([x, y]) => [x, y]);
  const solids = solidsOf(c.def);

  // 1.
  check(`${name}: every torch in the room burns out`, all.length > 0 && all.every(t => t[2]));
  check(`${name}: the claim names a sea list for every torch`, (c.k.lights || []).length === torches.length);
  if (c.def.puzzle) check(`${name}: its puzzle is all of its torches`, c.def.puzzle.torches === 'all');

  // Where Link can stand at each sea (any route, conch and Anchor allowed),
  // near enough a torch for a throw to matter.
  const reach = makeFlameModel(room, torches, { caps, anchor: true, solids, noLight: true });
  const near = (x, y) => torches.some(([tx, ty]) => Math.max(Math.abs(tx - x), Math.abs(ty - y)) <= 4);
  const tiles = [new Set(), new Set(), new Set()];
  for (const s of reach.search(reach.startsAt(c.k.from)).states.values()) {
    const lv = s.a && reach.m.inPatch(s.x, s.y, s.a) ? s.a.level : s.base;
    if (near(s.x, s.y) && !(room.flagsAt(s.x, s.y, lv) & F.DEEP)) tiles[s.base].add(s.x + ',' + s.y);
  }
  const tileLists = tiles.map(st => [...st].map(k => k.split(',').map(Number)));
  let table = {};
  if (page) {
    const t = await throwTable(c, torches, tileLists);
    table = t.out;
    check(`${name}: the throw table was really thrown (${t.thrown} throws)`, t.thrown > 100);
  }
  // A throw counts at the sea under Link's own feet.
  const throwsAt = (s) => {
    const lv = s.a && reach.m.inPatch(s.x, s.y, s.a) ? s.a.level : s.base;
    let mask = 0;
    for (const dir of ['up', 'down', 'left', 'right']) mask |= table[`${s.x},${s.y},${lv},${dir}`] || 0;
    return mask;
  };
  const model = (opts) => {
    const fm = makeFlameModel(room, torches, { caps, solids, ...opts });
    const base = fm.moves;
    fm.moves = function* (s) {
      yield* base(s);
      if (opts.noLight) return;
      const add = throwsAt(s) & ~s.lit;
      const lv = opts.fixedSea;
      if (add && (lv == null || lv === s.base)) {
        let ok = 0;
        torches.forEach((_, i) => { if ((add >> i) & 1 && !fm.drowned(i, s)) ok |= 1 << i; });
        if (ok) yield [{ ...s, lit: s.lit | ok }, 0, { throwAt: [s.x, s.y], lit: ok }];
      }
    };
    return fm;
  };

  // 2. each torch lights at exactly its seas.
  {
    const fm = model({ anchor: false });
    const r = fm.search(fm.startsAt(c.k.from));
    const seas = torches.map(() => new Set());
    for (const s of r.states.values()) {
      for (const dir of ['up', 'down', 'left', 'right']) {
        const m = fm.lightFrom(s, dir) | throwsAt(s);
        torches.forEach((_, i) => { if ((m >> i) & 1 && !fm.drowned(i, s)) seas[i].add(s.base); });
      }
    }
    torches.forEach(([x, y], i) => {
      const got = [...seas[i]].sort(), want = [...(c.k.lights[i] || [])].sort();
      check(`${name}: the torch at ${x},${y} can be lit at ${want.map(l => SEA[l]).join(', ') || 'no sea'} and no other`,
        JSON.stringify(got) === JSON.stringify(want), `lit at ${got.map(l => SEA[l]).join(', ')}`);
    });
  }

  // 3. not at any one sea.
  for (const sea of [0, 1, 2]) {
    const fm = model({ anchor: false, fixedSea: sea });
    check(`${name}: not with the sea held at ${SEA[sea]}`, !fm.startsAt(c.k.from).some(s => fm.solve(s)));
  }
  // 4. the conch alone, or the Anchor.
  const conch = model({ anchor: false });
  const conchOk = conch.startsAt(c.k.from).some(s => conch.solve(s));
  let best = null;
  if (c.k.anchor) {
    const anch = model({ anchor: true });
    for (const s of anch.startsAt(c.k.from)) {
      const r = anch.solve(s);
      if (r && (!best || r.presses < best.presses)) best = r;
    }
    check(`${name}: not with the conch alone`, !conchOk);
    check(`${name}: with one Anchor`, !!best);
  } else {
    check(`${name}: the conch alone lights them all`, conchOk);
    best = null;
    for (const s of conch.startsAt(c.k.from)) {
      const r = conch.solve(s);
      if (r && (!best || r.presses < best.presses)) best = r;
    }
  }
  const describe = (r) => r.steps.map(st => st.conch ? `sound at ${st.conch}`
    : st.light ? `light ${st.dir} from ${st.light}` : st.throwAt ? `throw from ${st.throwAt}`
      : st.throw ? `anchor ${st.dir} from ${st.throw} onto ${st.bite}` : `recall at ${st.recall}`).join('; ');
  if (best) console.log(`       ${best.presses} presses: ${describe(best)}`);

  // 5. no trap. (Over the places reached with no Anchor out: an Anchor
  // can always be recalled, so a state with one out is one recall from these.)
  {
    const fm = model({ anchor: false, noLight: true });
    const r = fm.search(fm.startsAt(c.k.from));
    const froms = new Set(c.k.from.map(([x, y]) => x + ',' + y));
    let stuck = null;
    const seen = new Set();
    for (const s of r.states.values()) {
      const k = `${s.x},${s.y},${s.base},${s.a ? s.a.x + ',' + s.a.y + ',' + s.a.level : '-'}`;
      if (seen.has(k)) continue; seen.add(k);
      if (seen.size > 4000) break;
      const back = fm.search([{ ...s, lit: 0 }]);
      if (![...back.states.values()].some(n => froms.has(n.x + ',' + n.y))) { stuck = k; break; }
    }
    check(`${name}: no place the search reaches strands you`, !stuck, stuck);
  }

  if (!page || !best) continue;

  // 6. the engine's torches.
  {
    const dryI = torches.findIndex((_, i) => [0, 1, 2].every(l => !(room.flagsAt(torches[i][0], torches[i][1], l) & (F.WATER | F.DEEP))));
    const wetI = torches.findIndex((_, i) => (c.k.lights[i] || []).includes(0)
      && [1, 2].some(l => room.flagsAt(torches[i][0], torches[i][1], l) & (F.WATER | F.DEEP)));
    await enter(c, 0, c.k.from[0]);
    const r = await page.evaluate(async ([torches, dryI, wetI, B]) => {
      const g = window.__game, T = 16;
      const { Torch } = await import('/src/game/objects.js');
      const step = (n) => { for (let i = 0; i < n; i++) window.__harness.step(1); if (g.dialogue) g.dialogue.active = false; g.mode = 'play'; };
      const ts = torches.map(([x, y]) => g.entities.find(e => e instanceof Torch && Math.floor(e.cx / T) === x && Math.floor(e.cy / T) === y));
      g.room._puzzleDone = true;
      const out = {};
      const w = ts[wetI];
      if (w) {
        out.lit0 = w.ignite(g); step(B - 2); out.before = w.lit; step(4); out.after = w.lit;
        w.ignite(g); step(2);
        const wet = [1, 2].find(l => { g.tide.setLevel(l, { instant: true }); return w.drowned(g); });
        g.tide.setLevel(0, { instant: true }); w.lit = false; w.ignite(g); step(2);
        g.tide.setLevel(wet, { instant: true }); step(2); out.drownedOut = !w.lit;
        out.refused = !w.ignite(g) && !w.lit;
        g.tide.setLevel(0, { instant: true }); step(2); out.notRelit = !w.lit;
      }
      const d = ts[dryI];
      if (d) {
        g.tide.setLevel(0, { instant: true }); d.lit = false; d.ignite(g);
        out.dry = [];
        for (const l of [1, 2, 0, 1]) { g.tide.setLevel(l, { instant: true }); step(2); out.dry.push(d.lit); }
      }
      for (const t of ts) t.lit = false;
      g.room._puzzleDone = false;
      return out;
    }, [torches, dryI, wetI, TORCH_BURN_FRAMES]);
    if (wetI >= 0) {
      check(`${name}: a lit torch burns exactly TORCH_BURN_FRAMES (${TORCH_BURN_FRAMES})`, r.lit0 && r.before && !r.after, JSON.stringify(r));
      check(`${name}: the sea rising over a lit torch puts it out`, r.drownedOut, JSON.stringify(r));
      check(`${name}: under water it cannot be lit`, r.refused, JSON.stringify(r));
      check(`${name}: the sea going out does not relight it`, r.notRelit, JSON.stringify(r));
    }
    if (dryI >= 0) check(`${name}: a torch on dry floor outlives every tide change`, r.dry.every(Boolean), JSON.stringify(r));
  }

  // 7. the solution at walking pace.
  const path = [];
  {
    const fm = model({ anchor: !!c.k.anchor });
    let s = null;
    // Recover the start: the state before the first step's.
    for (const s0 of fm.startsAt(c.k.from)) {
      const r = fm.solve(s0);
      if (r && r.presses === best.presses && describe(r) === describe(best)) { s = { ...s0 }; break; }
    }
    const walkTo = (s, goal) => {
      const prev = new Map([[`${s.x},${s.y}`, null]]); const q = [[s.x, s.y]];
      while (q.length) {
        const [x, y] = q.shift();
        if (x === goal[0] && y === goal[1]) break;
        for (const [n] of fm.m.moves({ ...s, x, y })) {
          if (n.base !== s.base || n.a !== s.a || !fm.walkOk(n.x, n.y, n)) continue;
          const k = `${n.x},${n.y}`; if (prev.has(k)) continue;
          prev.set(k, [x, y]); q.push([n.x, n.y]);
        }
      }
      if (!prev.has(`${goal[0]},${goal[1]}`)) return null;
      const out = [];
      for (let at = goal; at; at = prev.get(`${at[0]},${at[1]}`)) out.unshift(at);
      return out;
    };
    path.start = s;
    for (const st of best.steps) {
      const at = st.conch || st.light || st.throwAt || st.throw || st.recall;
      path.push({ walk: walkTo(s, at) });
      path.push(st.conch ? { conch: true } : st.light ? { light: st.dir } : st.throwAt ? { throwAt: true }
        : st.throw ? { anchor: st.dir, bite: st.bite } : { recall: true });
      s = st.state;
    }
  }
  if (path.start) {
    await enter(c, path.start.base, [path.start.x, path.start.y]);
    const played = await page.evaluate(async ([path, torches, B, flagName]) => {
      const g = window.__game, p = g.player, T = 16;
      const { Torch } = await import('/src/game/objects.js');
      const { ITEMS, placedKilnshell } = await import('/src/game/items.js');
      const { F } = await import('/src/world/tileset.js');
      const step = (n) => { for (let i = 0; i < n; i++) window.__harness.step(1); if (g.dialogue) g.dialogue.active = false; g.mode = 'play'; };
      const ts = () => torches.map(([x, y]) => g.entities.find(e => e instanceof Torch && Math.floor(e.cx / T) === x && Math.floor(e.cy / T) === y));
      let t = 0, first = null;
      const tick = (n) => { step(n); t += n; };
      for (const leg of path) {
        if (leg.walk) {
          for (const [x, y] of leg.walk.slice(1)) {
            p.x = x * T; p.y = y * T; p.fx = p.x * 256; p.fy = p.y * 256;
            tick((g.room.flagsAt(x, y, g.tide) & F.DEEP) ? 22 : 16);
          }
        } else if (leg.light) {
          p.dir = leg.light;
          if (placedKilnshell(g)) ITEMS.kilnshell.use(g, p, 1);
          ITEMS.kilnshell.use(g, p, 1); tick(8);
        } else if (leg.conch) {
          const lv = g.tide.level; p.conchTime = 0; p.playConch(g); tick(80);
          if (g.tide.level === lv) return { bad: `conch refused at ${p.x / T},${p.y / T}` };
        } else if (leg.anchor) {
          p.dir = leg.anchor; ITEMS.anchor.use(g, p, 1); tick(40);
          const o = g.tide.overrides.find(o => o.src === 'anchor');
          if (!o || o.tx !== leg.bite[0] || o.ty !== leg.bite[1]) return { bad: `the Anchor bit at ${o ? o.tx + ',' + o.ty : 'nothing'}, model ${leg.bite}` };
        } else if (leg.recall) {
          ITEMS.anchor.use(g, p, 1); tick(40);
        } else if (leg.throwAt) return { bad: 'a throw in the solution (play it by hand)' };
        if (first == null && ts().some(x => x && x.lit)) first = t;
      }
      step(4);
      return { done: !!g.room._puzzleDone, flag: !!(flagName && g.progress.flags && g.progress.flags[flagName]), lit: ts().map(x => x && x.lit), span: t - first, B };
    }, [path, torches, TORCH_BURN_FRAMES, c.def.puzzle && c.def.puzzle.flag]);
    check(`${name}: the fewest-press solution, at walking pace, has every torch burning and pays out`,
      !played.bad && played.done, JSON.stringify(played));
    if (!played.bad) console.log(`       first torch to last: ${played.span} of ${TORCH_BURN_FRAMES} frames`);

    // 8. burns on, and a save and a load.
    const after = await page.evaluate(async ([torches, B]) => {
      const g = window.__game, p = g.player, T = 16;
      const { Torch } = await import('/src/game/objects.js');
      const step = (n) => { for (let i = 0; i < n; i++) window.__harness.step(1); if (g.dialogue) g.dialogue.active = false; g.mode = 'play'; };
      const ts = () => torches.map(([x, y]) => g.entities.find(e => e instanceof Torch && Math.floor(e.cx / T) === x && Math.floor(e.cy / T) === y));
      step(B + 30);
      const burns = ts().every(x => x && (x.lit || x.drowned(g)));
      g.slot = 2; g.save(); g.loadGame(2); step(4);
      return { burns, loaded: ts().every(x => x && (x.lit || x.drowned(g))) };
    }, [torches, TORCH_BURN_FRAMES]);
    check(`${name}: once solved they burn on past TORCH_BURN_FRAMES`, after.burns, JSON.stringify(after));
    check(`${name}: and a save and a load bring them back lit`, after.loaded, JSON.stringify(after));
  } else check(`${name}: the solution's start was found again`, false);
}

if (browser) { await browser.close(); server.close(); }
console.log(`\n=== ${pass} passed, ${fail.length} failed ===`);
process.exit(fail.length ? 1 : 0);
