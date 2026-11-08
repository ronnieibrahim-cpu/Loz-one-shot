// SIDE-VIEW PASSAGES (S242, docs/briefs/SIDE-VIEW.md stage 2 and 3): every
// room declaring `side: true` is proved in the model (tools/lib/side-flood.mjs,
// the same flood tools/lib/dungeon-flood.mjs walks passages with) and in the
// real engine.
//
// A passage declares
//   sideRoom: { entries: [[x, y], ...],
//               reach: [{ name, at: [x, y], from: [x, y], seas: [...], dry?, onFoot?, conch? }] }
// `entries` are where its warps put Link (on a ladder under a way out);
// each `reach` claim is a cell he gets to from `from`, with the Cleats, with
// the sea HELD at exactly the levels in `seas` and at no other; `dry` the
// levels it is reached at held without them (default none; `onFoot`: LOW).
// A `conch` claim (S243, the Float Shaft) is reached at NO sea held and is
// reached with the sea changed while he is inside, Cleats or not: a float
// carries him there.
//
// MODEL
//   1. every entry is a ladder, dry at every sea (the wash-back point), with
//      a way out directly above it; every way out (a warp tile) is a room
//      warp; every warp in from another room lands on an entry, and every way
//      out lands somewhere standable and goes back in by a warp.
//   2. each claim is reached at exactly its seas, held.
//   3. nothing strands Link: from every state reachable from every entry,
//      Cleats or not, the conch free, some way out is still reachable.
//   4. without the Cleats a claim is reached at no sea held, unless it says
//      `onFoot`, and then at LOW only.
// ENGINE (the real game, raw buttons, the real stairs)
//   5. down each stair at each sea: Link arrives in the passage on the
//      ladder at its entry, climbing, and stays put.
//   6. the plans below play each claim at its seas and fail at the others;
//      the prize is +100 rupees once, and is not there again after a leave
//      and a return.
//   7. the ways out: up the west ladder to the Bell Cell, up the east ladder
//      to the Current Garden, standing on floor.
//   8. no Cleats: the pool at LOW, and the conch raising the sea round him on
//      the floor, wash him back to the entry, on the ladder, once.
//   9. the model is an upper bound of the engine: deterministic wandering at
//      each sea held, every cell Link's middle is in is one the model says
//      he can be in at that sea.
//
//   node tools/check-sideview.mjs
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { installData } from '../src/data/index.js';
import { MAPS, getRoom } from '../src/world/maps.js';
import { canOccupy } from '../src/game/entity.js';
import { sideCells, sideFlood } from './lib/side-flood.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
installData();

let pass = 0, fail = 0;
const check = (name, ok, detail = '') => {
  if (ok) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); }
};
const SEAS = ['LOW', 'MID', 'HIGH'];

// ------------------------------------------------------------------ model
const passages = [];
for (const [mapId, m] of MAPS) {
  for (const [rk, def] of Object.entries(m.roomDefs || {})) {
    if (!def.side) continue;
    const [f, rx, ry] = rk.split(',').map(Number);
    passages.push({ mapId, m, rk, def, f, rx, ry, room: getRoom(mapId, f, rx, ry) });
  }
}
console.log(`check-sideview: ${passages.length} side-view passage(s)\n`);
check('there is at least one passage, and every one declares sideRoom',
  passages.length > 0 && passages.every(p => p.def.sideRoom), passages.filter(p => !p.def.sideRoom).map(p => p.rk).join(' '));

const warpOf = (w0) => (Array.isArray(w0)
  ? { x: w0[0], y: w0[1], to: { map: w0[2], floor: w0[3] | 0, rx: w0[4], ry: w0[5], px: w0[6], py: w0[7] } } : w0);

for (const P of passages) {
  const { mapId, m, rk, def, room } = P;
  const C = sideCells(room);
  const S = def.sideRoom;
  const tag = `${mapId} ${rk}`;
  console.log(`${tag} ${def.name}`);

  // 1. entries and ways out.
  const warps = (def.warps || []).map(warpOf);
  const entryKeys = new Set(S.entries.map(([x, y]) => x + ',' + y));
  for (const [x, y] of S.entries) {
    const dry = [0, 1, 2].every(t => C.ladder(x, y, t) && !C.wet(x, y, t));
    const out = [0, 1, 2].every(t => C.warp(x, y - 1, t)) && warps.some(w => w.x === x && w.y === y - 1);
    check(`${tag}: entry ${x},${y} is a ladder dry at every sea under a way out`, dry && out);
  }
  let tiles = 0;
  for (let y = 0; y < C.H; y++) for (let x = 0; x < C.W; x++) {
    if (![0, 1, 2].some(t => C.warp(x, y, t))) continue;
    tiles++;
    const w = warps.find(v => v.x === x && v.y === y);
    let ok = !!w, why = w ? '' : 'no warp';
    if (w) {
      const dm = MAPS.get(w.to.map);
      const dk = `${w.to.floor | 0},${w.to.rx},${w.to.ry}`;
      const dst = dm && dm.roomDefs[dk] && getRoom(w.to.map, w.to.floor | 0, w.to.rx, w.to.ry);
      const tx = Math.floor(w.to.px / 16), ty = Math.floor(w.to.py / 16);
      // Standable where it lands, at every sea, by the engine's own rule.
      const stand = dst && [0, 1, 2].every(t => canOccupy({ room: dst, tide: t, entities: [] }, { hb: { x: 3, y: 6, w: 10, h: 10 }, caps: {} }, w.to.px, w.to.py));
      // ...and a stair there goes back in, to an entry under this way out.
      const back = dst && (dst.def.warps || []).map(warpOf).find(v => v.to.map === mapId
        && `${v.to.floor | 0},${v.to.rx},${v.to.ry}` === rk && Math.abs(v.x - tx) + Math.abs(v.y - ty) <= 1);
      const backIn = back && entryKeys.has(`${Math.floor(back.to.px / 16)},${Math.floor(back.to.py / 16)}`)
        && Math.floor(back.to.px / 16) === x && Math.floor(back.to.py / 16) === y + 1;
      ok = !!(dst && stand && backIn);
      why = !dst ? 'no room there' : !stand ? 'lands on nothing standable' : 'no stair back to the entry under it';
    }
    check(`${tag}: the way out at ${x},${y} lands on floor and its stair comes back`, ok, why);
  }
  check(`${tag}: it has two ways out (a passage joins two rooms)`, tiles === 2, `${tiles}`);

  // 2. each claim at exactly its seas, held, with the Cleats.
  for (const c of S.reach) {
    if (c.conch) {
      const held = [0, 1, 2].filter(t => sideFlood(room, [c.from], { seas: [t], cleats: true }).cells.has(c.at.join(',')));
      const ride = [true, false].every(cleats => sideFlood(room, [c.from], { conch: true, cleats }).cells.has(c.at.join(',')));
      check(`${tag}: ${c.name} (${c.at}) is reached at no sea held, and with the conch (Cleats or not)`,
        held.length === 0 && ride, `held at ${held.map(t => SEAS[t]).join('+') || 'none'}, conch ${ride}`);
      continue;
    }
    const got = [0, 1, 2].filter(t => sideFlood(room, [c.from], { seas: [t], cleats: true }).cells.has(c.at.join(',')));
    check(`${tag}: ${c.name} (${c.at}) is reached at ${c.seas.map(t => SEAS[t]).join('+')} only`,
      got.join() === c.seas.join(), `reached at ${got.map(t => SEAS[t]).join('+') || 'none'}`);
    // 4. ...and needs the Cleats, unless the claim says `onFoot` (reached at
    //    LOW without them).
    const dry = [0, 1, 2].filter(t => sideFlood(room, [c.from], { seas: [t], cleats: false }).cells.has(c.at.join(',')));
    const want = c.dry || (c.onFoot ? [0] : []);
    const okDry = dry.join() === want.join();
    check(`${tag}: ${c.name} without the Cleats: ${want.length ? 'at ' + want.map(t => SEAS[t]).join('+') + ' only' : 'never'}`,
      okDry, `reached at ${dry.map(t => SEAS[t]).join('+') || 'none'}`);
  }

  // 3. no strands.
  let strands = [];
  for (const cleats of [true, false]) {
    for (const e of S.entries) {
      const all = sideFlood(room, [e], { conch: true, cleats });
      for (const k of all.at) {
        const [xy, t] = k.split('@');
        const [x, y] = xy.split(',').map(Number);
        const from = sideFlood(room, [[x, y]], { conch: true, cleats, seas: [0, 1, 2] });
        // A drowning sends him back to his entry, which is under a way out.
        if (!from.warps.size && !from.drowned) strands.push(`${k}${cleats ? '' : ' (no Cleats)'}`);
        if (strands.length > 5) break;
      }
    }
  }
  check(`${tag}: no state reachable from an entry is cut off from every way out`, strands.length === 0, strands.join(' '));
}

// ------------------------------------------------------------------ engine
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
const errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.goto(`http://localhost:${server.address().port}/index.html`);
await page.waitForFunction(() => window.__game && window.__harness);
await page.evaluate(async () => {
  const g = window.__game; window.__harness.takeOver();
  const { giveItem } = await import('/src/game/progress.js');
  window.__sv = {
    // A fresh game at sea t, with or without the Cleats, Link standing at
    // (px, py) in room (f, rx, ry) of the map.
    start(map, f, rx, ry, px, py, t, cleats, conch, calm) {
      g.newGame(0, 'LINK', 20260806);
      // A run that walked out of a passage's room may have left a slide to
      // the next room going (S243): it would land on the next run.
      g.transition = null; g.fadeThen = null;
      g.cutscene = null; g.mode = 'play'; g.dialogue.active = false;
      g.progress.maxHearts = 80; g.progress.hearts = 80;
      giveItem(g.progress, 'conch');
      if (cleats) giveItem(g.progress, 'cleats');
      g.progress.equipB = conch ? 'conch' : null;
      g.tide.clearOverrides(); g.tide.setLevel(t, { instant: true });
      g.enterMap(map, f, rx, ry, px, py, 'up', { instant: true });
      g.dialogue.active = false; g.bannerTime = 0;
      // `calm`: nothing in the room can touch him (a keese by a stair).
      if (calm) for (const e of g.entities) if (e.isEnemy) e.remove = true;
      this.release();
    },
    release() { const raw = g.input._raw; for (const b of ['up', 'down', 'left', 'right', 'a', 'b']) raw[b] = false; },
    state() {
      const p = g.player;
      return { room: g.room.key, map: g.mapId, x: p.x, y: p.y, climb: !!p.svClimb, fall: p.svFall | 0,
        wash: p.washing | 0, deep: !!p.inDeep, rupees: g.progress.rupees, hearts: g.progress.hearts,
        tide: g.tide.level, fade: !!g.veiled() };
    },
    // Hold `keys` for n frames; stop early when `until` (a state predicate
    // body) is true. Returns the states seen every frame if `trace`.
    // With `leave`, let go the moment he changes room.
    hold(keys, n, trace, leave) {
      const raw = g.input._raw; const out = []; const r0 = g.mapId + g.room.key;
      for (const b of ['up', 'down', 'left', 'right', 'a', 'b']) raw[b] = keys.includes(b);
      for (let i = 0; i < n; i++) {
        window.__harness.step(1); g.dialogue.active = false;
        if (trace) out.push(this.state());
        if (leave && g.mapId + g.room.key !== r0) break;
      }
      this.release();
      return out;
    },
    play(steps, trace) {
      let out = [];
      for (const [keys, n] of steps) out = out.concat(this.hold(keys, n, trace));
      return out;
    },
  };
});
const sv = (fn, ...a) => page.evaluate(([fn, a]) => window.__sv[fn](...a), [fn, a]);

// The plans: buttons held from the west entry (as filmed for the human,
// docs/briefs/s242/side-mock/*.json).
const PLANS = {
  prize: [[['down'], 30], [['right'], 88], [['up'], 12], [['up', 'right'], 30], [['right'], 8], [[], 40]],
  eastLedge: [[['down'], 80], [['right'], 205], [['up'], 12], [['up', 'right'], 30], [['right'], 40], [[], 10]],
  floor: [[['down'], 130], [['right'], 60], [['right'], 90], [['up', 'right'], 30], [['right'], 30], [[], 10]],
};

for (const P of passages.filter(p => p.mapId === 'd3' && p.rk === '0,4,6')) {
  const tag = `${P.mapId} ${P.rk}`;
  const [f, rx, ry] = [P.f, P.rx, P.ry];
  const ENTRY_W = [16, 16], ENTRY_E = [208, 16];
  const cellOf = s => [Math.floor((s.x + 8) / 16), Math.floor((s.y + 8) / 16)];

  // 5. down each stair, at each sea.
  for (const t of [0, 1, 2]) {
    for (const [name, room, at, entry] of [['the Bell Cell', [1, 4, 6], [16, 32], ENTRY_W], ['the Current Garden', [1, 5, 6], [16, 32], ENTRY_E]]) {
      await sv('start', 'd3', ...room, ...at, t, true, false, true);
      await sv('hold', ['up'], 40, false, true);
      for (let i = 0; i < 60 && (await sv('state')).fade; i++) await sv('hold', [], 4);
      const a = await sv('state');
      await sv('hold', [], 60);
      const b = await sv('state');
      check(`${tag}: down ${name}'s stair at ${SEAS[t]} Link arrives on the ladder at ${entry}, climbing, and stays`,
        a.room === P.rk && a.x === entry[0] && a.y === entry[1] && a.climb && b.x === a.x && b.y === a.y && !b.wash,
        JSON.stringify({ a, b }));
    }
  }

  // 6. the claims, played.
  const runPlan = async (plan, t, cleats = true) => {
    // `calm`: these plans are about the passage, not its strider (clause 10).
    await sv('start', P.mapId, f, rx, ry, ...ENTRY_W, t, cleats, false, true);
    const r0 = (await sv('state')).rupees;
    const tr = await sv('play', plan, true);
    return { tr, r0, end: tr[tr.length - 1] };
  };
  const seasOf = async (plan, ok) => {
    const got = [];
    for (const t of [0, 1, 2]) if (ok(await runPlan(plan, t))) got.push(t);
    return got;
  };
  const prizeSeas = await seasOf(PLANS.prize, r => r.end.rupees - r.r0 === 100);
  check(`${tag}: the prize plan takes the 100 rupees at HIGH and at no other sea`, prizeSeas.join() === '2', prizeSeas.join());
  const at = (cx, cy) => r => r.tr.some(s => s.room === P.rk && cellOf(s)[0] === cx && cellOf(s)[1] === cy && !s.fall && !s.deep && !s.wash);
  const ledgeSeas = await seasOf(PLANS.eastLedge, at(12, 5));
  check(`${tag}: the east-ledge plan stands on the ledge at MID only (HIGH reaches it by swimming; the model proves it)`,
    ledgeSeas.join() === '1', ledgeSeas.join());
  const floorSeas = await seasOf(PLANS.floor, at(12, 8));
  check(`${tag}: the floor plan stands on the east floor at LOW`, floorSeas.includes(0), floorSeas.join());

  // The prize once: taken, out by the west ladder, back down the stair.
  {
    const r = await runPlan(PLANS.prize, 2);
    // Out (any way: the ways out are clause 7's), then down the Bell Cell's
    // stair again.
    await page.evaluate(() => { const g = window.__game; g.enterMap('d3', 1, 4, 6, 16, 32, 'up', { instant: true }); });
    const out = await sv('state');
    await sv('hold', ['up'], 40, false, true);
    // The passage's strider (clause 10) is not this plan's business.
    await page.evaluate(() => { const g = window.__game; for (const e of g.entities) if (e.isEnemy) e.remove = true; });
    await sv('hold', [], 90);
    const back = await sv('state');
    const r1 = back.rupees;
    // Play the prize plan again from where he arrived.
    await sv('play', PLANS.prize);
    const again = await sv('state');
    check(`${tag}: the prize is taken once, and is not there after a leave and a return`,
      r.end.rupees - r.r0 === 100 && out.room === '1,4,6' && back.room === P.rk && again.rupees === r1,
      JSON.stringify({ out: out.room, back: back.room, r1, again: again.rupees }));
  }

  // 7. the ways out.
  {
    await sv('start', P.mapId, f, rx, ry, ...ENTRY_W, 0, false, false, true);
    await sv('hold', ['up'], 40, false, true); await sv('hold', [], 90);
    const w = await sv('state');
    check(`${tag}: up the west ladder comes out in the Bell Cell on floor`, w.room === '1,4,6' && w.x === 16 && w.y === 32, JSON.stringify(w));
    const r = await runPlan(PLANS.eastLedge, 1);
    // The Garden's keese waits by its stair: let it not knock him about.
    await page.evaluate(() => { window.__game.player.invuln = 100000; });
    await sv('hold', ['up'], 140, false, true); await sv('hold', [], 90);
    const e = await sv('state');
    check(`${tag}: from the east ledge at MID the ladder comes out in the Current Garden`, e.room === '1,5,6' && e.x === 16 && e.y === 32, JSON.stringify(e));
  }

  // 8. no Cleats.
  {
    await sv('start', P.mapId, f, rx, ry, ...ENTRY_W, 0, false, false, true);
    const h0 = (await sv('state')).hearts;
    const tr = await sv('play', [[['down'], 130], [['right'], 60], [[], 120]], true);
    const end = tr[tr.length - 1];
    const washes = tr.filter((s, i) => s.wash && !(i && tr[i - 1].wash)).length;
    check(`${tag}: no Cleats, the pool at LOW washes Link back to the entry, on the ladder, once`,
      washes === 1 && end.x === ENTRY_W[0] && end.y === ENTRY_W[1] && end.climb && end.hearts < h0, JSON.stringify({ washes, end }));
    await sv('start', P.mapId, f, rx, ry, ...ENTRY_W, 0, false, true, true);
    await sv('play', [[['down'], 130], [['right'], 10], [[], 10]]);
    const tr2 = await sv('play', [[['b'], 4], [[], 200]], true);
    const end2 = tr2[tr2.length - 1];
    const w2 = tr2.filter((s, i) => s.wash && !(i && tr2[i - 1].wash)).length;
    check(`${tag}: no Cleats, the conch raising the sea round him on the floor washes him back to the entry, once`,
      end2.tide === 1 && w2 === 1 && end2.x === ENTRY_W[0] && end2.y === ENTRY_W[1] && end2.climb, JSON.stringify({ w2, end2 }));
  }

}

// The Float Shaft (S243, d4 1,5,5): the plans, as filmed for the human
// (docs/briefs/s243/side-mock/*.json).
for (const P of passages.filter(p => p.mapId === 'd4' && p.rk === '1,5,5')) {
  const tag = `${P.mapId} ${P.rk}`;
  const [f, rx, ry] = [P.f, P.rx, P.ry];
  const W = [16, 16], E = [208, 16];
  const PRIZE = [[['down'], 50], [['right'], 95], [[], 30], [['right'], 60]];
  const RIDE = [[['left'], 62], [[], 10], [['b'], 4], [[], 160], [['right'], 110], [['up'], 90], [[], 90]];

  // 5. down each stair, at each sea.
  for (const t of [0, 1, 2]) {
    for (const [name, room, entry, at, key] of [['the Rung Gallery', [0, 4, 5], W, [208, 128], 'down'], ['the Cliffside Cell', [0, 5, 5], E, [16, 32], 'up']]) {
      await sv('start', 'd4', ...room, ...at, t, true, false, true);
      await sv('hold', [key], 40, false, true);
      for (let i = 0; i < 60 && (await sv('state')).fade; i++) await sv('hold', [], 4);
      const a = await sv('state');
      await sv('hold', [], 60);
      const b = await sv('state');
      check(`${tag}: down ${name}'s stair at ${SEAS[t]} Link arrives on the ladder at ${entry}, climbing, and stays`,
        a.room === P.rk && a.x === entry[0] && a.y === entry[1] && a.climb && b.x === a.x && b.y === a.y && !b.wash,
        JSON.stringify({ a, b }));
    }
  }

  const run = async (plan, t, cleats = true, from = W) => {
    await sv('start', P.mapId, f, rx, ry, ...from, t, cleats, true);
    const r0 = (await sv('state')).rupees;
    const tr = await sv('play', plan, true);
    return { tr, r0, end: tr[tr.length - 1] };
  };

  // 6. the prize at LOW only, once.
  {
    const got = [];
    for (const t of [0, 1, 2]) { const r = await run(PRIZE, t); if (r.end.rupees - r.r0 === 100) got.push(t); }
    check(`${tag}: down the shaft, the alcove's 100 rupees are taken at LOW and at no other sea`, got.join() === '0', got.join());
  }
  // ...and the float carries him out: on it, the conch, up to MID, out east.
  for (const cleats of [true, false]) {
    const r = await run(PRIZE.concat(RIDE), 0, cleats);
    const rode = r.tr.some(s => s.tide === 1 && s.y === 80 && s.room === P.rk && !s.deep && !s.wash);
    check(`${tag}: ${cleats ? '' : 'no Cleats: '}from the alcove, on the float, the conch carries Link up to MID and he climbs out into the Cliffside Cell`,
      rode && r.end.room === '0,5,5' && r.end.rupees - r.r0 === 100 && !r.tr.some(s => s.wash), JSON.stringify(r.end));
  }
  // The trap: the conch sounded from the alcove takes the float up without
  // him, and he cannot swim past it.
  {
    const r = await run(PRIZE.concat([[[], 10], [['b'], 4], [[], 200], [['left'], 95], [['up'], 60], [[], 30]]), 0);
    const ys = r.tr.slice(-60).map(s => s.y);
    check(`${tag}: the conch from the alcove leaves Link under the float at MID, swimming, held at its underside`,
      r.end.tide === 1 && r.end.deep && r.end.room === P.rk && Math.min(...ys) === 107, JSON.stringify(r.end));
    const n = await run(PRIZE.concat([[[], 10], [['b'], 4], [[], 120]]), 0, false);
    const washes = n.tr.filter((s, i) => s.wash && !(i && n.tr[i - 1].wash)).length;
    check(`${tag}: no Cleats, the same conch washes him back to the west ladder, once`,
      washes === 1 && n.end.x === W[0] && n.end.y === W[1] && n.end.climb, JSON.stringify({ washes, end: n.end }));
  }
  // At HIGH the float lies level with the west gallery: walked on, a bridge
  // to the shaft's east wall, and down nowhere.
  {
    const r = await run([[['down'], 50], [['right'], 110], [[], 60]], 2);
    check(`${tag}: at HIGH Link walks out onto the float level with the gallery and stands on it`,
      r.end.y === 64 && r.end.x > 96 && r.end.x < 128 && !r.tr.some(s => s.fall > 0), JSON.stringify(r.end));
  }
  // 7. from the east at MID: onto the float, the conch to HIGH, across the
  //    gallery and up the west ladder into the Rung Gallery.
  {
    const r = await run([[['down'], 80], [['left'], 104], [[], 10], [['b'], 4], [[], 200], [['left'], 110], [['up'], 90], [[], 90]], 1, true, E);
    check(`${tag}: from the east at MID the float carries Link up to the gallery at HIGH and the west ladder comes out in the Rung Gallery`,
      r.end.room === '0,4,5' && r.tr.some(s => s.tide === 2 && s.y === 64 && s.room === P.rk), JSON.stringify(r.end));
  }
}

// 10. THE STRIDER (S243, ours, the human's yes to docs/briefs/s243/
//     enemy-sketch.png): it stands on the surface of the water under it, the
//     conch lifts it and drops it, drained out from under it it flounders and
//     is gone, it never appears with no water to skate, it hurts Link to
//     touch and one sword cut kills it.
{
  const strider = () => page.evaluate(() => {
    const e = window.__game.entities.find(o => o.type === 'strider' && !o.remove && !o.dead);
    return e ? { x: e.x, y: e.y, dir: e.dir } : null;
  });
  // The Sounding Way's pool: LOW line row 9, MID row 6, HIGH row 3.
  const LINE = [9, 6, 3];
  for (const t of [0, 1, 2]) {
    await sv('start', 'd3', 0, 4, 6, 16, 16, t, true, false);
    await sv('hold', [], 30);
    const s = await strider();
    check(`strider: in the Sounding Way at ${SEAS[t]} it stands on the surface (row ${LINE[t]})`, s && s.y === LINE[t] * 16 - 13, JSON.stringify(s));
  }
  {
    await sv('start', 'd3', 0, 4, 6, 16, 16, 0, true, true);
    await sv('hold', [], 30);
    const xs = new Set();
    for (let i = 0; i < 20; i++) { await sv('hold', [], 10); const s = await strider(); xs.add(s && s.x); }
    await sv('hold', ['b'], 4); await sv('hold', [], 120);
    const mid = await strider();
    await sv('hold', ['b'], 4); await sv('hold', [], 120);
    const high = await strider();
    check(`strider: it paces the LOW pool, and the conch lifts it to the MID line and then the HIGH line`,
      xs.size > 5 && mid && mid.y === 6 * 16 - 13 && high && high.y === 3 * 16 - 13, JSON.stringify({ n: xs.size, mid, high }));
  }
  {
    // The Float Shaft's is on the east ledge's water, which only HIGH puts there.
    const here = [];
    for (const t of [0, 1, 2]) { await sv('start', 'd4', 1, 5, 5, 208, 16, t, true, false); await sv('hold', [], 10); here.push(!!(await strider())); }
    check(`strider: in the Float Shaft it is there at HIGH only (no water on the east ledge lower)`, here.join() === 'false,false,true', here.join());
    await sv('start', 'd4', 1, 5, 5, 208, 16, 2, true, true);
    await sv('hold', [], 10);
    await sv('hold', ['b'], 4);
    const fall = [];
    for (let i = 0; i < 25; i++) { await sv('hold', [], 10); fall.push(await strider()); }
    const landed = fall.find(s => s && s.y === 5 * 16 - 13 + 0) || fall.find(s => s);
    check(`strider: the conch drains the ledge from under it, it falls and is gone`, fall[fall.length - 1] === null && !!landed, JSON.stringify(fall.slice(0, 3)));
  }
  {
    // Touched, it hurts; one cut kills it.
    await sv('start', 'd3', 0, 4, 6, 16, 16, 1, true, false);
    await page.evaluate(async () => {
      const g = window.__game; const { giveItem } = await import('/src/game/progress.js');
      giveItem(g.progress, 'sword'); g.progress.equipA = 'sword';
      const e = g.entities.find(o => o.type === 'strider');
      g.player.x = e.x + 20; g.player.y = e.y + 4; g.player.dir = 'left'; g.player.invuln = 0;
    });
    const h0 = (await sv('state')).hearts;
    let hurt = false;
    for (let i = 0; i < 80 && !hurt; i++) { await sv('hold', ['left'], 1); hurt = (await sv('state')).hearts < h0; }
    check(`strider: swimming into it costs Link hearts`, hurt, '');
    await sv('start', 'd3', 0, 4, 6, 16, 16, 1, true, false);
    const gone = await page.evaluate(async () => {
      const g = window.__game; const { giveItem } = await import('/src/game/progress.js');
      giveItem(g.progress, 'sword'); g.progress.equipA = 'sword';
      const e = g.entities.find(o => o.type === 'strider');
      e.dir = 'right';
      g.player.x = e.x + 14; g.player.y = e.y + 2; g.player.dir = 'left';
      return true;
    });
    await sv('hold', ['left'], 1);
    await sv('hold', ['a'], 3);
    await sv('hold', [], 40);
    check(`strider: one sword cut kills it`, gone && (await strider()) === null, JSON.stringify(await strider()));
  }
}

// 9. the engine never goes where the model says it cannot (every passage).
for (const P of passages) {
  const tag = `${P.mapId} ${P.rk}`;
  const [f, rx, ry] = [P.f, P.rx, P.ry];
  const cellOf = s => [Math.floor((s.x + 8) / 16), Math.floor((s.y + 8) / 16)];
  const ENTRY_W = P.def.sideRoom.entries[0].map(v => v * 16), ENTRY_E = P.def.sideRoom.entries[1].map(v => v * 16);
  // 9. the engine never goes where the model says it cannot.
{
  let seed = 1234567;
  const rnd = (n) => { seed = (seed * 1103515245 + 12345) >>> 0; return (seed >>> 16) % n; };
  const MOVES = [['left'], ['right'], ['up'], ['down'], ['up', 'left'], ['up', 'right'], ['down', 'left'], ['down', 'right'], []];
  const bad = [];
  const where = {};
  let cellsSeen = 0;
  for (const t of [0, 1, 2]) {
    for (const cleats of [true, false]) {
      const model = sideFlood(P.room, P.def.sideRoom.entries, { seas: [t], cleats }).cells;
      const seen = new Set();
      for (let run = 0; run < 6; run++) {
        const entry = run % 2 ? ENTRY_E : ENTRY_W;
        await sv('start', P.mapId, f, rx, ry, ...entry, t, cleats, false, true);
        const steps = [];
        for (let k = 0; k < 30; k++) steps.push([MOVES[rnd(MOVES.length)], 8 + rnd(40)]);
        const tr = await sv('play', steps, true);
        for (const s of tr) {
          if (s.room !== P.rk || s.wash || s.fade) continue;
          const [cx, cy] = cellOf(s);
          if (!seen.has(cx + ',' + cy)) where[cx + ',' + cy + '@' + t] = `${s.x},${s.y}`;
          seen.add(cx + ',' + cy);
        }
      }
      cellsSeen += seen.size;
      for (const c of seen) if (!model.has(c)) bad.push(`${c}@${SEAS[t]}${cleats ? '' : ' no Cleats'} (at ${where[c + '@' + t]})`);
    }
  }
  check(`${tag}: wandering at each sea held, Link is never in a cell the model rules out (${cellsSeen} cells seen)`,
    bad.length === 0, bad.slice(0, 8).join(' '));
}
}
check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));

await browser.close(); server.close();
console.log(`\n=== ${pass} passed, ${fail} failed ===`);
process.exit(fail ? 1 : 0);
