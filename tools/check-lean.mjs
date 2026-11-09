// Signs and the things Link leans on, Oracle of Seasons' way (S225), driven
// in the real engine with a real player pressing real buttons.
//
//   node tools/check-lean.mjs
//
// 1. A SIGN IS READ FROM THE FRONT ONLY (code/interactableTiles.s
//    nextToSignTile -> checkFacingBottomOfTileAndPressedA): standing below it
//    facing up, A shows its words; from either side or from behind, facing
//    it, A says TX_510e "You can't read it from here!" and not its words.
//    Every sign in the world is tried from below (check-placement proves each
//    has floor there); one is tried from every side.
// 2. LEANING ON WHAT CANNOT BE MOVED SAYS WHAT IT IS, ONCE A SCREEN
//    (nextToTileWithInfoText, showInfoTextForTile, wInformativeTextsShown):
//    a boulder too heavy to lift (TX_5104), and indoors a cracked wall
//    (TX_5106/7) and an unlit torch (TX_5108). The first one of each kind the
//    world holds is found, Link is stood against it, and he leans: the hint
//    comes after the lean a block takes and not before, and leaning again on
//    the same screen says nothing. An overworld cracked cliff says nothing
//    (Seasons' overworld table has no cracked wall).
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { installRuntime } from './actor-runtime.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
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
const errs = [];
page.on('pageerror', e => errs.push(e.message));
await page.goto(`http://localhost:${server.address().port}/index.html?seed=20260806`);
await page.waitForFunction(() => !!window.__game && !!window.__harness);
await page.evaluate(installRuntime);
await page.evaluate(() => {
  const g = window.__game, orig = g.say.bind(g);
  window.__said = [];
  g.say = (t, o) => { window.__said.push({ text: String(t), frame: g.frame }); return orig(t, o); };
});

let passed = 0; const failures = [];
const check = (name, ok, detail = '') => {
  if (ok) { passed++; console.log(`  ok   ${name}`); }
  else { failures.push(name + (detail ? ' — ' + detail : '')); console.log(`  FAIL ${name}${detail ? ' — ' + detail : ''}`); }
};

const SETUP = { seed: 20260806, items: { sword: 1 }, equipA: 'sword', maxHearts: 12, hearts: 12, tide: 0 };
// Runs one plan from a stated place and returns what was said, with the frame
// the plan started on.
async function run(enter, steps, tide = 0, plant = null) {
  return page.evaluate(async ([setup, steps, plant]) => {
    window.__said.length = 0;
    window.__rp.beginRecord(setup, steps);
    if (plant) window.__game.room.setTile(plant[0], plant[1], plant[2]);
    let r;
    for (let i = 0; i < 400; i++) { r = window.__rp.pump(50); if (r.done || r.error) break; }
    const g = window.__game;
    return { said: window.__said.slice(), error: r && r.error, at: g.player && [g.player.x, g.player.y, g.player.dir], room: g.mapId + ' ' + (g.room && g.room.key) };
  }, [{ ...SETUP, tide, enter }, steps, plant]);
}

// ------------------------------------------------------------------ the world
const world = await page.evaluate(async () => {
  const g = window.__game;
  const maps = await import('/src/world/maps.js');
  const ent = await import('/src/game/entity.js');
  const { Player } = await import('/src/game/player.js');
  const { Torch } = await import('/src/game/objects.js');
  const { F, getTileDef } = await import('/src/world/tileset.js');
  const { LIFT_STRENGTH } = await import('/src/data/feel.js');
  const signs = [], found = {};
  const SIDES = [['up', 0, 1], ['down', 0, -1], ['left', 1, 0], ['right', -1, 0]];
  // A place Link can stand beside (tx, ty), facing it, at LOW.
  const besides = (tx, ty) => {
    const out = [];
    for (const [dir, ox, oy] of SIDES) {
      const x = (tx + ox) * 16, y = (ty + oy) * 16;
      if (!g.room.inBounds(tx + ox, ty + oy)) continue;
      const p = new Player(x, y);
      if (ent.canOccupy(g, p, x, y)) out.push({ dir, x, y });
    }
    return out;
  };
  g.newGame(0, 'LINK', 20260806);
  for (const map of maps.MAPS.values()) {
    for (const key of Object.keys(map.roomDefs || {})) {
      const def = map.roomDefs[key];
      const [f, rx, ry] = key.split(',').map(Number);
      g.enterMap(map.id, f, rx, ry, -999, -999, 'down', { instant: true });
      g.tide.setLevel(0, { instant: true });
      for (const s of (def.entities || []).filter(s => s[0] === 'sign')) {
        signs.push({ enter: [map.id, f, rx, ry, s[1] * 16, s[2] * 16 + 16, 'up'], text: s[3] && s[3].text, at: `${map.id}/${key} ${s[1]},${s[2]}`, sides: besides(s[1], s[2]) });
      }
      const indoors = map.id !== 'overworld';
      const want = (kind, tx, ty) => {
        if (found[kind]) return;
        const b = besides(tx, ty);
        if (b.length) found[kind] = { enter: [map.id, f, rx, ry, b[0].x, b[0].y, b[0].dir], dir: b[0].dir, at: `${map.id}/${key} ${tx},${ty}` };
      };
      for (const e of g.entities) {
        if (indoors && e instanceof Torch && !e.lit) want('torch', Math.floor(e.cx / 16), Math.floor(e.cy / 16));
      }
      for (let ty = 0; ty < g.room.th; ty++) for (let tx = 0; tx < g.room.tw; tx++) {
        const name = g.room.baseName(tx, ty), d = getTileDef(name);
        if (!d) continue;
        if (d.liftLevel && d.liftLevel > LIFT_STRENGTH) want('boulder', tx, ty);
        if ((d.flags & F.BOMBABLE) && !name.startsWith('boulder')) want(indoors ? 'crackedWall' : 'crackedCliff', tx, ty);
        // No dungeon of ours has a cracked wall today (every one is an
        // overworld cliff), so one is PLANTED in the first dungeon wall Link
        // can stand against, and the rule is tried on that.
        if (map.kind === 'dungeon' && !found.plant && name.startsWith('dWall') && getTileDef(name + 'X')) {
          const b = besides(tx, ty);
          if (b.length) found.plant = { enter: [map.id, f, rx, ry, b[0].x, b[0].y, b[0].dir], dir: b[0].dir, at: `${map.id}/${key} ${tx},${ty} (planted)`, plant: [tx, ty, name + 'X'] };
        }
      }
    }
  }
  return { signs, found };
});

// ------------------------------------------------------------------- 1. signs
console.log(`check-lean: ${world.signs.length} signs, each read from below`);
const notRead = [];
for (const s of world.signs) {
  const r = await run(s.enter, [['wait', 4], ['tap', 'a', 20]]);
  if (!r.said.some(x => x.text === s.text)) notRead.push(`${s.at}: said ${JSON.stringify(r.said.map(x => x.text))}`);
}
for (const l of notRead.slice(0, 8)) console.log('  ' + l);
check('every sign is read standing below it facing up', world.signs.length > 0 && notRead.length === 0, `${notRead.length} not`);
const REFUSE = 'You can\'t read\nit from here!';
const probe = world.signs.find(s => s.sides.filter(x => x.dir !== 'up').length >= 2);
check('a sign with floor on more than one side exists to try', !!probe);
if (probe) {
  const bad = [];
  for (const side of probe.sides.filter(x => x.dir !== 'up')) {
    const e = probe.enter.slice(); e[4] = side.x; e[5] = side.y; e[6] = side.dir;
    const r = await run(e, [['wait', 4], ['tap', 'a', 20]]);
    const said = r.said.map(x => x.text);
    if (!(said.includes(REFUSE) && !said.includes(probe.text))) bad.push(`${side.dir} at ${side.x},${side.y}: ${JSON.stringify(said)}`);
  }
  check(`from any other side it says "You can't read it from here!" (${probe.at})`, bad.length === 0, bad.join('; '));
}

// ------------------------------------------------------------- 2. lean hints
const HINTS = {
  boulder: 'Oof! It\'s heavy,\nlike a rock!',
  crackedWall: 'This wall is\ncracked.\nIt looks like it\ncould be broken!',
  torch: 'This torch\nneeds lighting.',
};
const { PUSH_DELAY_FRAMES } = await import('../src/data/feel.js');
if (!world.found.crackedWall) world.found.crackedWall = world.found.plant;
for (const [kind, text] of Object.entries(HINTS)) {
  const f = world.found[kind];
  check(`the world has a ${kind} to lean on`, !!f);
  if (!f) continue;
  // Short of the lean: nothing. Then the lean, the box read, and a second lean.
  const short = await run(f.enter, [['wait', 4], ['hold', [f.dir], PUSH_DELAY_FRAMES - 4]], 0, f.plant);
  check(`${kind} (${f.at}): leaning short of ${PUSH_DELAY_FRAMES} frames says nothing`,
    !short.said.some(x => x.text === text), JSON.stringify(short.said.map(x => x.text)));
  const r = await run(f.enter, [['wait', 4], ['hold', [f.dir], 60], ['dialogue', 600], ['hold', [f.dir], 90], ['wait', 4]], 0, f.plant);
  const n = r.said.filter(x => x.text === text).length;
  check(`${kind}: leaning on it says so, once on the screen`, n === 1, `said ${n}x: ${JSON.stringify(r.said.map(x => x.text))}`);
}
const cliff = world.found.crackedCliff;
check('the overworld has a cracked cliff to lean on', !!cliff);
if (cliff) {
  const r = await run(cliff.enter, [['wait', 4], ['hold', [cliff.dir], 60]]);
  check(`an overworld cracked cliff says nothing (${cliff.at}), as in Seasons`, r.said.length === 0, JSON.stringify(r.said.map(x => x.text)));
}
// ----------------------------------------------------------- 3. gauge torches
// S245 (the human's choice: lit only when right). Every room whose door reads
// wells (`anchorGauges`) has one gauge torch per mark, reading that mark at
// the level the door wants, and no gauge torch stands anywhere else; in the
// engine each burns exactly while its mark reads right — at every sea held,
// and with the iron down — catches light with the torch's sound, is silent
// walking in on it already lit, and fire does nothing to it.
const gauges = await page.evaluate(async () => {
  const g = window.__game;
  const maps = await import('/src/world/maps.js');
  const { GaugeTorch } = await import('/src/game/objects.js');
  const out = { rooms: [], stray: [], wrong: [], tides: [], held: [], sound: [], fire: [] };
  const sounds = [];
  const orig = g.audio.sfx.bind(g.audio);
  g.audio.sfx = (n, o) => { sounds.push(n); return orig(n, o); };
  const settle = (n) => { for (let i = 0; i < n; i++) for (const e of g.entities) if (e instanceof GaugeTorch) e.update(g); };
  const torches = () => g.entities.filter(e => e instanceof GaugeTorch);
  const truth = (t) => g.tide.levelAt(t.well[0], t.well[1], g.room) === t.level;
  g.newGame(0, 'LINK', 20260806);
  for (const map of maps.MAPS.values()) {
    for (const key of Object.keys(map.roomDefs || {})) {
      const def = map.roomDefs[key];
      const placed = (def.entities || []).filter(s => s[0] === 'gaugeTorch');
      const where = `${map.id}/${key} ${def.name || ''}`;
      if (!def.anchorGauges) { if (placed.length) out.stray.push(where); continue; }
      const ag = def.anchorGauges;
      const marks = ag.marks || [[...ag.a, ag.aLevel], [...ag.b, ag.bLevel]];
      out.rooms.push(where);
      for (const m of marks) {
        const n = placed.filter(s => s[3] && s[3].well[0] === m[0] && s[3].well[1] === m[1] && s[3].level === m[2]).length;
        if (n !== 1) out.wrong.push(`${where}: mark ${m} has ${n} torches`);
      }
      if (placed.length !== marks.length) out.wrong.push(`${where}: ${placed.length} torches for ${marks.length} marks`);
      const [f, rx, ry] = key.split(',').map(Number);
      for (const sea of [0, 1, 2]) {
        g.tide.clearOverrides();
        g.tide.setLevel(sea, { instant: true });
        g.enterMap(map.id, f, rx, ry, ag.from[0] * 16, ag.from[1] * 16, 'up', { instant: true });
        sounds.length = 0;
        settle(2);
        for (const t of torches()) if (t.lit !== truth(t)) out.tides.push(`${where} at sea ${sea}: torch ${t.well} lit=${t.lit}`);
        if (sounds.includes('fire')) out.sound.push(`${where}: walking in at sea ${sea} made a sound`);
      }
      // The iron down on each mark in turn, the base at the other level the
      // door wants: the held mark's torch comes alight, with the sound.
      for (const m of marks) {
        const other = marks.find(o => o[2] !== m[2]);
        g.tide.clearOverrides();
        g.tide.setLevel(other[2], { instant: true });
        g.enterMap(map.id, f, rx, ry, ag.from[0] * 16, ag.from[1] * 16, 'up', { instant: true });
        settle(2);
        const t = torches().find(t => t.well[0] === m[0] && t.well[1] === m[1]);
        const was = t && t.lit;
        sounds.length = 0;
        g.tide.addOverride({ mapId: map.id, roomKey: g.room.key, tx: m[0], ty: m[1], r: 0, shape: 'square', level: m[2], src: 'check' });
        g.tide.touch();
        settle(2);
        if (!t || was || !t.lit) out.held.push(`${where}: mark ${m} held — was ${was}, now ${t && t.lit}`);
        else if (sounds.filter(s => s === 'fire').length !== 1) out.sound.push(`${where}: mark ${m} caught light with ${JSON.stringify(sounds)}`);
        for (const u of torches()) if (u.lit !== truth(u)) out.held.push(`${where}: with ${m} held, torch ${u.well} lit=${u.lit}`);
        // Fire over a dark one does nothing.
        const dark = torches().find(u => !u.lit);
        if (dark) {
          g.checkTileAction({ x: dark.x - 16, y: dark.y - 16, w: 48, h: 48 }, 'fire');
          settle(1);
          if (dark.lit) out.fire.push(`${where}: fire lit torch ${dark.well}`);
        }
      }
      g.tide.clearOverrides();
    }
  }
  g.audio.sfx = orig;
  return out;
});
console.log(`check-lean: gauge torches in ${gauges.rooms.length} rooms (${gauges.rooms.join('; ')})`);
check('there are rooms that read wells, and each has its gauge torches', gauges.rooms.length >= 2 && gauges.wrong.length === 0, gauges.wrong.join('; '));
check('no gauge torch stands in a room that reads no wells', gauges.stray.length === 0, gauges.stray.join('; '));
check('at every sea held, each gauge torch burns exactly while its mark reads right', gauges.tides.length === 0, gauges.tides.slice(0, 4).join('; '));
check('the iron held on a mark lights that mark\'s torch, and only the right ones burn', gauges.held.length === 0, gauges.held.slice(0, 4).join('; '));
check('a gauge torch catches light with the torch\'s sound, once, and walking in on one lit is silent', gauges.sound.length === 0, gauges.sound.slice(0, 4).join('; '));
check('fire does nothing to a gauge torch', gauges.fire.length === 0, gauges.fire.join('; '));

check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));

console.log(`\n=== ${passed} passed, ${failures.length} failed ===`);
if (failures.length) { console.log('\nFailures:'); failures.forEach(f => console.log('  - ' + f)); }
await browser.close(); server.close();
process.exit(failures.length ? 1 : 0);
