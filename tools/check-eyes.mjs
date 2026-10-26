// THE EYE STATUES (S211, docs/briefs/PUZZLE-PASS.md "More"; Seasons' eye
// puzzle, statueEyeball.s INTERAC_STATUE_EYEBALL subid 3/4 and bank1.s
// screenTransitionEyePuzzle, room $59c). The cartridge's room loops: every
// door but the one you came in by brings you back into the same room, the
// statues' eyes look anywhere but the way on, and the way on taken enough
// times in a row lets you out. OUR TWIST: the statues stand in basins and
// their eyes float, so every tide change turns each eye. No eye ever looks
// at the way on at ANY sea, but at any one sea at most one wrong door is
// watched — you must watch them through two tides to know.
//
// A room claims it:
//
//   eyeRoom: { back: 'W', exit: 'E', statues: [[x, y], ...],
//              passes: [{ answer: 'S', look: [[LOW, MID, HIGH], ...] }, ...] }
//
// `look[i]` is statue i's eye at each sea, one of 'N' 'E' 'S' 'W' (the
// cartridge's eyes take the four cardinal directions only: subid 4's `and 3;
// add a`). An eye watches the door on its side of the room. `back` is the way
// out of the loop (the cartridge's down); the other three are the candidates.
// The last pass's answer is `exit`, the way on.
//
// The model proves, for every claim:
//   1. every pass gives every statue an eye at every sea;
//   2. no eye looks at the pass's answer, at any sea;
//   3. at every single sea at least two candidate doors are unwatched — one
//      tide never tells you;
//   4. over the three seas both wrong doors are watched — the tides together
//      always do; and the pass needs at least two of them (a pair of seas
//      that does not resolve it is allowed, a single sea is not);
//   5. every statue's eye turns at least once in every pass (the twist);
//   6. the last answer is `exit`, there are at least three passes, and no two
//      passes in a row share an answer;
//   7. the room is walkable from every door you can arrive by to every door,
//      at every sea, with the statues standing (statues are solid).
// And, for a room built into a dungeon, in the engine:
//   8. the statues' eyes are what the claim says at each sea, and turn when
//      the conch is sounded;
//   9. the answer door brings Link back into the room at the opposite door
//      and counts the pass; a wrong door brings him back and starts again;
//      the back door leaves for the room behind; the exit door before the
//      last pass loops, and after it leaves for the room beyond;
//  10. a save and a load in the middle of the loop starts it again.
//
// Usage: node tools/check-eyes.mjs
//        node tools/check-eyes.mjs --mock spec.json   (model only: spec
//        { legend, rooms: { name: grid }, claims: { name: { eyes: {...eyeRoom} } } })
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { installData } from '../src/data/index.js';
import { MAPS, getRoom, registerMap } from '../src/world/maps.js';
import { tileWalkable, ROUTE_AVOID, capsForDungeonIndex } from './lib/collision.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
installData();

let pass = 0; const fail = [];
const check = (n, c, d) => c ? (pass++, console.log('  ok   ' + n))
  : (fail.push(n), console.log('  FAIL ' + n + (d ? ' — ' + d : '')));

const SIDES = ['N', 'E', 'S', 'W'];
const SEA = ['LOW', 'MID', 'HIGH'];
const OPP = { N: 'S', S: 'N', E: 'W', W: 'E' };

/** The doorway tile on each side of a 15x11 room: the gap in the ring. */
export function eyeDoors(room) {
  const W = room.tw, H = room.th, out = {};
  const gap = (x, y) => tileWalkable(room, x, y, 0, { swim: true }) || tileWalkable(room, x, y, 2, { swim: true });
  for (let x = 1; x < W - 1; x++) { if (gap(x, 0)) out.N = [x, 0]; if (gap(x, H - 1)) out.S = [x, H - 1]; }
  for (let y = 1; y < H - 1; y++) { if (gap(0, y)) out.W = [0, y]; if (gap(W - 1, y)) out.E = [W - 1, y]; }
  return out;
}

/** The candidate doors a pass's eyes watch at sea `lv`. */
export function watched(k, p, lv) {
  const cands = SIDES.filter(s => s !== k.back);
  return new Set(p.look.map(l => l[lv]).filter(s => cands.includes(s)));
}

const MOCK = process.argv.includes('--mock') ? process.argv[process.argv.indexOf('--mock') + 1] : null;
const CLAIMS = [];
if (MOCK) {
  const spec = JSON.parse(await readFile(MOCK, 'utf8'));
  for (const [name, grid] of Object.entries(spec.rooms)) {
    const k = spec.claims && spec.claims[name] && spec.claims[name].eyes;
    if (!k) continue;
    const id = 'mock_' + name;
    registerMap({ id, kind: 'dungeon', name: 'Mock', w: 3, h: 3, floors: 1, cell: [15, 11],
      legend: (spec.legends && spec.legends[name]) || spec.legend, dungeon: { index: 2 },
      rooms: { '0,0,0': { name, map: grid } } });
    CLAIMS.push({ mapId: id, key: '0,0,0', def: { name }, k, index: 2, mock: true });
  }
} else {
  for (const [mapId, m] of MAPS) {
    for (const [key, def] of Object.entries(m.roomDefs || {})) {
      if (!def.eyeRoom) continue;
      CLAIMS.push({ mapId, key, def, k: def.eyeRoom, index: m.dungeon ? m.dungeon.index : 0 });
    }
  }
}

console.log(`check-eyes: ${CLAIMS.length} eye room(s)${MOCK ? ' (mock)' : ''}`);
for (const c of CLAIMS) {
  const { k } = c, tag = `${c.mapId} ${c.key} (${c.def.name})`;
  const room = getRoom(c.mapId, ...c.key.split(',').map(Number));
  const cands = SIDES.filter(s => s !== k.back);
  // 1. a full table
  const shapeOk = k.passes.every(p => p.look.length === k.statues.length
    && p.look.every(l => l.length === 3 && l.every(s => SIDES.includes(s))) && cands.includes(p.answer));
  check(`${tag}: every pass gives each of its ${k.statues.length} statues an eye at every sea`, shapeOk);
  if (!shapeOk) continue;
  k.passes.forEach((p, i) => {
    const pt = `${tag} pass ${i + 1} (way on ${p.answer})`;
    // 2.
    const seen = [0, 1, 2].filter(lv => watched(k, p, lv).has(p.answer));
    check(`${pt}: no eye looks at the way on, at any sea`, !seen.length, seen.length ? 'watched at ' + seen.map(l => SEA[l]).join(',') : '');
    // 3.
    const lone = [0, 1, 2].filter(lv => cands.filter(s => !watched(k, p, lv).has(s)).length < 2);
    check(`${pt}: at every single sea two doors are still unwatched`, !lone.length,
      lone.length ? 'one sea tells: ' + lone.map(l => SEA[l]).join(',') : '');
    // 4.
    const all = new Set([0, 1, 2].flatMap(lv => [...watched(k, p, lv)]));
    const wrong = cands.filter(s => s !== p.answer);
    check(`${pt}: the three seas together watch both wrong doors`, wrong.every(s => all.has(s)));
    const pairs = [[0, 1], [1, 2], [2, 0]].filter(([a, b]) =>
      wrong.every(s => watched(k, p, a).has(s) || watched(k, p, b).has(s))).map(([a, b]) => SEA[a] + '+' + SEA[b]);
    console.log(`       ${pt}: told by ${pairs.join(', ') || 'all three seas only'}`);
    // 5.
    const still = p.look.map((l, j) => (l[0] === l[1] && l[1] === l[2]) ? j : -1).filter(j => j >= 0);
    check(`${pt}: every statue's eye turns with the tide`, !still.length, still.length ? 'still: statue ' + still.join(',') : '');
  });
  // 6.
  check(`${tag}: three passes or more, the last one's way on is the exit (${k.exit})`,
    k.passes.length >= 3 && k.passes[k.passes.length - 1].answer === k.exit);
  check(`${tag}: no two passes in a row share a way on`,
    k.passes.every((p, i) => !i || p.answer !== k.passes[i - 1].answer));
  // 7. walkable door to door at every sea, statues standing
  const doors = eyeDoors(room);
  check(`${tag}: a doorway on all four sides`, SIDES.every(s => doors[s]), JSON.stringify(doors));
  if (!SIDES.every(s => doors[s])) continue;
  const caps = capsForDungeonIndex(c.index);
  const stat = new Set(k.statues.map(([x, y]) => y * room.tw + x));
  const flood = (from, lv) => {
    const seen = new Set([from[1] * room.tw + from[0]]), q = [from];
    while (q.length) {
      const [x, y] = q.pop();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, key = ny * room.tw + nx;
        if (nx < 0 || ny < 0 || nx >= room.tw || ny >= room.th || seen.has(key) || stat.has(key)) continue;
        if (!tileWalkable(room, nx, ny, lv, caps, ROUTE_AVOID)) continue;
        seen.add(key); q.push([nx, ny]);
      }
    }
    return seen;
  };
  const arrive = [k.back, ...cands.map(s => OPP[s])];
  const cut = [];
  for (const a of new Set(arrive)) for (let lv = 0; lv < 3; lv++) {
    const r = flood(doors[a], lv);
    for (const s of SIDES) if (!r.has(doors[s][1] * room.tw + doors[s][0])) cut.push(`${a}->${s}@${SEA[lv]}`);
  }
  check(`${tag}: every door reaches every door at every sea, statues standing`, !cut.length, cut.slice(0, 6).join(' '));
  // 8-10, in the engine, for a built room.
  if (!c.mock) await engine(c, doors);
}

async function engine(c, doors) {
  const { chromium } = await import('playwright');
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
  const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.goto(`http://localhost:${server.address().port}/index.html`);
  await page.waitForFunction(() => window.__game && window.__harness);
  const tag = `${c.mapId} ${c.key} (${c.def.name})`;
  const r = await page.evaluate(async ([c, doors]) => {
    const g = window.__game, h = window.__harness, k = c.k;
    h.takeOver();
    g.newGame(0, 'LINK', 20261026); g.cutscene = null; g.mode = 'play'; g.dialogue.active = false;
    const [f, x, y] = c.key.split(',').map(Number);
    const OPP = { N: 'S', S: 'N', E: 'W', W: 'E' };
    const DIR = { N: 'up', S: 'down', E: 'right', W: 'left' };
    const out = { eyes: [], walks: [] };
    const calm = () => { g.dialogue.active = false; g.bannerTime = 0; g.cutscene = null; };
    // A pad that holds what it is told: the real one's edges, no keyboard.
    const pad = { held: {}, prev: {}, next: {},
      update() { this.prev = this.held; this.held = { ...this.next }; },
      down(b) { return !!this.held[b]; }, pressed(b) { return !!this.held[b] && !this.prev[b]; },
      released(b) { return !this.held[b] && !!this.prev[b]; },
      anyDir() { return ['up', 'down', 'left', 'right'].some(b => this.held[b]); }, takeExtra() { return null; } };
    g.input = pad;
    h.hold = (keys) => { pad.next = keys; };
    // Stand just inside door `from` and hold toward door `to` until the room
    // changes (or 600 frames pass): the real transition, whatever it does.
    const enterAt = (side, lv) => {
      const [dx, dy] = doors[side];
      const ix = dx === 0 ? 1 : dx === 14 ? 13 : dx, iy = dy === 0 ? 1 : dy === 10 ? 9 : dy;
      g.tide.clearOverrides(); g.tide.setLevel(lv, { instant: true });
      g.enterMap(c.mapId, f, x, y, ix * 16, iy * 16, DIR[OPP[side]], { instant: true });
      calm();
    };
    const walkOut = (side) => {
      const [dx, dy] = doors[side];
      const before = g.room.key + '|' + g.mapId, p = g.player;
      for (let i = 0; i < 900; i++) {
        const tx = dx * 16, ty = dy * 16;
        const keys = {};
        if (side === 'N' || side === 'S') { if (Math.abs(p.x - tx) > 1) keys[p.x < tx ? 'right' : 'left'] = true; else keys[DIR[side]] = true; }
        else { if (Math.abs(p.y - ty) > 1) keys[p.y < ty ? 'down' : 'up'] = true; else keys[DIR[side]] = true; }
        h.hold(keys); h.step(1); calm();
        if (g.transition == null && i > 4 && (g.room.key + '|' + g.mapId !== before || g._eyeLooped)) break;
      }
      h.hold({});
      for (let i = 0; i < 60; i++) { h.step(1); calm(); }
      const looped = !!g._eyeLooped; g._eyeLooped = false;
      return { map: g.mapId, room: g.room.key, x: Math.round(g.player.x / 16), y: Math.round(g.player.y / 16), pass: g.eyePass, looped };
    };
    // 8. the eyes, per sea, on entering at pass 0
    for (let lv = 0; lv < 3; lv++) {
      enterAt(k.back, lv);
      for (let i = 0; i < 10; i++) { h.step(1); calm(); }
      out.eyes.push(g.entities.filter(e => e.eyeIndex != null).sort((a, b) => a.eyeIndex - b.eyeIndex).map(e => e.eyeLook));
    }
    enterAt(k.back, 0); for (let i = 0; i < 10; i++) h.step(1);
    g.tide.setLevel(1);
    for (let i = 0; i < 120; i++) { h.step(1); calm(); }
    out.turned = g.entities.filter(e => e.eyeIndex != null).sort((a, b) => a.eyeIndex - b.eyeIndex).map(e => e.eyeLook);
    // 9. the walks
    enterAt(k.back, 0);
    out.walks.push(['wrong', walkOut(k.passes[0].answer === 'N' ? 'E' : 'N')]);
    for (let i = 0; i < k.passes.length; i++) out.walks.push(['right' + i, walkOut(k.passes[i].answer)]);
    enterAt(k.back, 0);
    if (k.passes[0].answer !== k.exit) out.walks.push(['exitEarly', walkOut(k.exit)]);
    enterAt(k.back, 0);
    out.walks.push(['back', walkOut(k.back)]);
    // 10. a save and a load mid-loop
    enterAt(k.back, 0);
    walkOut(k.passes[0].answer);
    const passBefore = g.eyePass;
    const snap = !!g.save; if (snap) g.save();
    if (snap && g.loadGame) g.loadGame(g.slot != null ? g.slot : 0);
    for (let i = 0; i < 30; i++) { h.step(1); calm(); }
    out.reload = { passBefore, passAfter: g.eyePass, snap };
    return out;
  }, [c, doors]).catch(e => ({ error: String(e) }));
  if (r.error) { check(`${tag}: the engine half ran`, false, r.error); await browser.close(); server.close(); return; }
  const k = c.k;
  for (let lv = 0; lv < 3; lv++) {
    const want = k.passes[0].look.map(l => l[lv]);
    check(`${tag}: at ${SEA[lv]} the eyes look ${want.join('')}`, JSON.stringify(r.eyes[lv]) === JSON.stringify(want), JSON.stringify(r.eyes[lv]));
  }
  check(`${tag}: sounding the conch turns the eyes`, JSON.stringify(r.turned) === JSON.stringify(k.passes[0].look.map(l => l[1])), JSON.stringify(r.turned));
  const W = Object.fromEntries(r.walks);
  check(`${tag}: a wrong door brings Link back into the room and starts again`,
    W.wrong.looped && W.wrong.room === c.key && W.wrong.pass === 0, JSON.stringify(W.wrong));
  for (let i = 0; i < k.passes.length - 1; i++) {
    const w = W['right' + i], a = k.passes[i].answer;
    const d = doors[OPP[a]];
    check(`${tag}: pass ${i + 1}'s way on (${a}) brings him back at the ${OPP[a]} door and counts`,
      w.looped && w.room === c.key && w.pass === i + 1 && Math.abs(w.x - d[0]) <= 1 && Math.abs(w.y - d[1]) <= 1, JSON.stringify(w));
  }
  const last = W['right' + (k.passes.length - 1)];
  check(`${tag}: the last way on (${k.exit}) leaves for the room beyond`, !last.looped && last.room !== c.key, JSON.stringify(last));
  if (W.exitEarly) check(`${tag}: the exit before the last pass loops`, W.exitEarly.looped && W.exitEarly.room === c.key, JSON.stringify(W.exitEarly));
  check(`${tag}: the back door (${k.back}) leaves the loop`, !W.back.looped && W.back.room !== c.key, JSON.stringify(W.back));
  check(`${tag}: a save and a load in the middle of the loop starts it again`,
    r.reload.passBefore === 1 && !r.reload.passAfter, JSON.stringify(r.reload));
  check(`${tag}: no console errors`, !errors.length, errors[0]);
  await browser.close(); server.close();
}

console.log(`\n=== ${pass} passed, ${fail.length} failed ===`);
process.exit(fail.length ? 1 : 0);
