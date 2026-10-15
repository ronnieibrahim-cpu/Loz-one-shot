// The Abyssal Keep's Hold (S189): "what the sea puts down, the line brings up".
//
// Proves, in the real engine, every piece of the machine and every claim a
// room makes about it with `holdRoom`:
//
//   * EVERY SHAFT in the world (a tile whose tiledef says `shaft` at some sea)
//     is a hole at LOW and flooded water at MID and HIGH on 1F, and a hole at
//     LOW and MID and flooded only at HIGH on 2F (S190: the sea rises through
//     the Keep floor by floor), has a room directly beneath it — found by
//     place on the map, as a wide room upstairs stands over more than one —
//     and the cell beneath is somewhere a chunk can rest at every sea; in the
//     Hold it is marked with the darker ring or a plate (on 1F nothing marks
//     the cell under a 2F shaft: the brief's "the Crossed Shafts says it,
//     from above");
//   * to LINK a shaft is a pit (Seasons' rule, the human's S189 choice): he
//     walks into a dry one and is put back on his own floor;
//   * a chunk resting over a dry shaft goes down it to the same cell one
//     floor down, at every sea it is dry; over a flooded one it floats there
//     and stays on its floor;
//   * the Dredge Line cast over a flooded shaft brings up a chunk lying on the
//     cell beneath, into Link's hands, and over a dry one — at every sea it
//     is dry — brings up nothing;
//   * holding a chunk, Link stands on a stair and it does not take him
//     (Seasons' checkTileWarps); set down, it does;
//   * ICE: on Seasons' ice Link keeps sliding when the d-pad is let go, and
//     holding it against him brings him to a stop sooner; off the ice he
//     stops at once.
//   * every `holdRoom.plate` is reached by NO FOOT on its own floor at any
//     sea, and by NO THROW: a chunk thrown in the real engine from every
//     standing pixel near it (every other pixel, all four ways, at every sea)
//     never comes to rest on it — and each of its `feeds` (thrown in that
//     room) or `drops` (thrown down a shaft from the room above) does put a
//     chunk on it, which then holds the plate, sets the room's puzzle flag,
//     and is still there after a save and a load. A room may claim several
//     `plates` (the Crossed Shafts' two, S190): each is fed in turn with the
//     ones before it still held, and the puzzle is solved only by the last;
//   * every `hauls` claim brings a chunk up at its sea and not at LOW, and
//     every `catches` claim brings a chunk lying across the shafts home.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const server = createServer(async (req, res) => {
  try {
    const u = decodeURIComponent(req.url.split('?')[0]);
    const p = join(ROOT, u === '/' ? 'index.html' : u);
    res.writeHead(200, { 'Content-Type': extname(p) === '.js' ? 'text/javascript' : 'text/html' });
    res.end(await readFile(p));
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(0, r));
async function launch() {
  try { return await chromium.launch(); }
  catch (err) {
    const f = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium';
    if (!existsSync(f)) throw err;
    return chromium.launch({ executablePath: f });
  }
}
const browser = await launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
await page.goto(`http://localhost:${server.address().port}/index.html?seed=20260806`);
await page.waitForFunction(() => !!window.__game && !!window.__harness);

let pass = 0; const fail = [];
const check = (n, c, d) => c ? (pass++, console.log('  ok   ' + n)) : (fail.push(n), console.log('  FAIL ' + n + (d ? ' — ' + d : '')));

const out = await page.evaluate(async () => {
  const g = window.__game;
  window.__harness.takeOver();
  const { MAPS, getRoom, cellBeneath } = await import('/src/world/maps.js');
  const { F, getTileDef } = await import('/src/world/tileset.js');
  const { spawnEntity, canOccupy, groundFlags } = await import('/src/game/entity.js');
  const { giveItem, exportCode, importCode } = await import('/src/game/progress.js');
  const { FloorSwitch } = await import('/src/game/objects.js');
  const TILE = 16;
  const res = [];
  const ok = (name, cond, detail) => res.push([name, !!cond, detail || '']);

  g.newGame(0, 'LINK', 20260806);
  g.cutscene = null; g.mode = 'play'; g.dialogue.active = false;
  for (const id of ['sword', 'conch', 'dredge', 'cleats']) giveItem(g.progress, id, 1);
  g.progress.equipA = 'dredge'; g.progress.equipB = 'conch';
  g.progress.maxHearts = g.progress.hearts = 80;

  const seaNames = ['LOW', 'MID', 'HIGH'];
  const quiet = () => {
    g.entities = g.entities.filter(e => e === g.player);
    if (g.dialogue) g.dialogue.active = false;
    g.itemShow = null; g.bannerTime = 0;
  };
  const enter = (map, key, sea, px = 16, py = 16, dir = 'down') => {
    const [f, x, y] = key.split(',').map(Number);
    g.tide.setLevel(sea, { instant: true });
    g.enterMap(map, f, x, y, px, py, dir, { instant: true });
    g.fadeAmount = 0; g.fadeDir = 0; g.fadeThen = null;
    g.tide.setLevel(sea, { instant: true });
    const p = g.player;
    p.invuln = 9999; p.carrying = null; p.dredge = null; p.falling = 0; p.ice = null;
    return p;
  };
  // Drive the game with a held mask (the same Input the robot uses).
  const held = { up: false, down: false, left: false, right: false, a: false, b: false, start: false, select: false };
  const realInput = g.input;
  // The game calls `input.update()` at the top of every frame, as the
  // robot's ScriptedInput expects: it latches what is held for that frame.
  g.input = {
    cur: { ...held }, prev: { ...held },
    update() { this.prev = this.cur; this.cur = { ...held }; },
    down(b) { return !!this.cur[b]; }, pressed(b) { return !!this.cur[b] && !this.prev[b]; },
    released(b) { return !this.cur[b] && !!this.prev[b]; },
    anyDir() { const c = this.cur; return c.up || c.down || c.left || c.right; }, takeExtra() { return null; },
  };
  const setHeld = (keys) => { for (const k of Object.keys(held)) held[k] = keys.includes(k); };
  const step = (n, keys = []) => { for (let i = 0; i < n; i++) { setHeld(keys); g.update(); } setHeld([]); };

  const ledger = () => g.progress.chunks;
  const placeChunk = (id, floor, rx, ry, tx, ty) => { g.progress.chunks[id] = { map: g.mapId, floor, rx, ry, tx, ty }; };

  // ----------------------------------------------------- every shaft
  const shafts = [];
  for (const m of MAPS.values ? MAPS.values() : Object.values(MAPS)) {
    for (const key of Object.keys(m.roomDefs || {})) {
      const r = getRoom(m.id, ...key.split(',').map(Number));
      if (!r) continue;
      for (let ty = 0; ty < r.th; ty++) for (let tx = 0; tx < r.tw; tx++) {
        let any = false;
        for (let lv = 0; lv < 3; lv++) if (r.tile(tx, ty, lv).shaft) any = true;
        if (any) shafts.push({ map: m.id, key, r, tx, ty });
      }
    }
  }
  ok(`there are shafts to check (${shafts.length})`, shafts.length >= 4);
  for (const s of shafts) {
    const { r, tx, ty } = s;
    const name = `${s.map} ${s.key} ${tx},${ty}`;
    const f = [0, 1, 2].map(lv => r.flagsAt(tx, ty, lv));
    const sh = [0, 1, 2].map(lv => r.tile(tx, ty, lv).shaft);
    // 1F floods at MID, 2F only at HIGH: the first sea it is water at.
    const wet = r.floor >= 2 ? 2 : 1;
    const shape = [0, 1, 2].every(lv => lv < wet
      ? (f[lv] & F.PIT) && !(f[lv] & F.DROP) && !(f[lv] & F.DEEP)
      : (f[lv] & F.DEEP) && !(f[lv] & F.PIT));
    ok(`${name}: on floor ${r.floor} a hole below ${seaNames[wet]}, flooded from it, a shaft at all three`,
      shape && sh.every(Boolean), f.map(x => x.toString(16)).join(' '));
    const cb = cellBeneath(s.map, r, tx, ty);
    ok(`${name}: a room beneath it`, !!cb);
    if (!cb) continue;
    const br = cb.room;
    const fb = [0, 1, 2].map(lv => br.flagsAt(cb.tx, cb.ty, lv));
    ok(`${name}: the cell beneath (${br.key} ${cb.tx},${cb.ty}) holds a chunk at every sea`, fb.every(x => !(x & (F.SOLID | F.PIT | F.VOID | F.DEEP))));
    if (br.def.legend === 'dungeonAbyssIce') {
      const plate = (br.def.entities || []).some(e => e[0] === 'switch' && e[1] === cb.tx && e[2] === cb.ty);
      const ring = br.baseName(cb.tx, cb.ty) === br.legend[','];
      ok(`${name}: the cell beneath in the Hold is marked (the ring, or a plate)`, plate || ring, br.baseName(cb.tx, cb.ty));
    }
    const below = cb.floor;

    // To Link it is a pit: he walks in at LOW and is put back on his floor.
    let p = enter(s.map, s.key, 0, tx * TILE, ty * TILE - 14, 'down');
    quiet();
    const fl = g.room.floor;
    step(90, ['down']); step(120);
    ok(`${name}: Link walking into it at LOW falls as into a pit and stays on his floor`,
      g.room.floor === fl && g.room.key === s.key, `room ${g.room.key}`);

    // A chunk at rest over it at every dry sea goes down to the same cell;
    // at the first wet sea it floats, on its own floor.
    for (let sea = 0; sea <= wet; sea++) {
      enter(s.map, s.key, sea, 16, 16);
      quiet();
      delete g.progress.chunks.__probe;
      const c = spawnEntity(g, 'icechunk', tx, ty, { id: '__probe' });
      g.flushPending();
      c.settle(g);
      step(2);
      const L = ledger().__probe;
      if (sea < wet) {
        ok(`${name}: a chunk over it at ${seaNames[sea]} goes down to the cell beneath`,
          L && L.floor === below && L.rx === cb.rx && L.ry === cb.ry && L.tx === cb.tx && L.ty === cb.ty, JSON.stringify(L));
      } else {
        ok(`${name}: a chunk over it at ${seaNames[sea]} floats there and stays on its floor`,
          L && L.floor === r.floor && c.floating && !c.remove, JSON.stringify(L));
      }
      delete g.progress.chunks.__probe;
    }

    // The line: from each side of it that Link can stand on, at its wet sea
    // it brings up a chunk lying beneath; at every dry sea nothing.
    const sides = [[0, -1, 'down'], [0, 1, 'up'], [-1, 0, 'right'], [1, 0, 'left']];
    let castFrom = 0, hauled = 0, dry = 0, dryCasts = 0;
    for (const [dx, dy, face] of sides) {
      const sx = tx + dx, sy = ty + dy;
      for (let sea = wet; sea >= 0; sea--) {
        p = enter(s.map, s.key, sea, sx * TILE, sy * TILE, face);
        quiet();
        if (!canOccupy(g, p, sx * TILE, sy * TILE) || (groundFlags(g, p) & (F.PIT | F.DEEP))) break;
        placeChunk('__probe', below, cb.rx, cb.ry, cb.tx, cb.ty);
        p.dir = face;
        // The line is on A.
        step(1, ['a']); step(160);
        const got = !!(p.carrying && p.carrying.chunkId === '__probe');
        if (sea === wet) { castFrom++; if (got) hauled++; } else { dryCasts++; if (!got && ledger().__probe && ledger().__probe.floor === below) dry++; }
        delete g.progress.chunks.__probe;
        p.carrying = null;
      }
    }
    ok(`${name}: the line cast over it at ${seaNames[wet]} brings up the chunk beneath, from every side Link stands (${hauled}/${castFrom})`,
      castFrom > 0 && hauled === castFrom);
    ok(`${name}: and over it dry brings up nothing (${dry}/${dryCasts})`, dryCasts > 0 && dry === dryCasts);
  }

  // ----------------------------------------------------- a stair and a held chunk
  {
    // On the Rime Landing's stair (1,9), holding a chunk.
    let p = enter('d6', '0,6,3', 0, 2 * TILE, 9 * TILE, 'left');
    quiet();
    step(20);
    p.x = 1 * TILE; p.y = 9 * TILE - 4;
    const c = spawnEntity(g, 'icechunk', 4, 9, { id: '__probe' });
    g.flushPending();
    p.carrying = c; c.carried = true;
    step(60);
    const stayed = g.room.key === '0,6,3' && g.room.floor === 0;
    ok('holding a chunk, Link stands on the stair and it does not take him', stayed,
      `room ${g.room.key}, at ${p.x},${p.y}`);
    // Let go (A throws) where he stands, and the stair takes him.
    step(1, ['a']); step(90);
    ok('the moment his hands are empty the stair he stands on takes him', g.room.floor === 1, `room ${g.room.key}`);
    delete g.progress.chunks.__probe;
  }

  // ----------------------------------------------------- ice
  {
    // The Rime Landing's ice band is rows 4-7, wall to wall.
    let p = enter('d6', '0,6,3', 0, 1 * TILE, 5 * TILE, 'right');
    quiet();
    step(80, ['right']);
    const x0 = p.x;
    step(120);
    const slid = p.x - x0;
    ok(`on ice, let go at speed, Link slides on (${slid} px)`, slid >= 16);
    p = enter('d6', '0,6,3', 0, 1 * TILE, 5 * TILE, 'right');
    quiet();
    step(80, ['right']);
    const x1 = p.x;
    step(120, ['left']);
    const back = p.x - x1;
    ok(`held against him he stops sooner and turns back (${back} px)`, back < slid);
    p = enter('d6', '0,6,3', 0, 3 * TILE, 9 * TILE, 'right');
    quiet();
    step(40, ['right']);
    const x2 = p.x;
    step(30);
    ok('off the ice he stops the frame he is let go', p.x - x2 <= 1, `${p.x - x2} px`);
  }

  // ----------------------------------------------------- plate claims
  const claims = [];
  for (const m of MAPS.values ? MAPS.values() : Object.values(MAPS)) {
    for (const [key, def] of Object.entries(m.roomDefs || {})) if (def.holdRoom) claims.push({ map: m.id, key, def, H: def.holdRoom });
  }
  ok(`there are holdRoom claims (${claims.length})`, claims.length >= 4);

  // The tiles of this room Link's feet reach at this sea, from its doors and
  // stairs, swimming allowed (the engine's own canOccupy).
  const footFlood = () => {
    const p = g.player, r = g.room, seen = new Set(), q = [];
    const can = (tx, ty) => r.inBounds(tx, ty) && canOccupy(g, p, tx * TILE, ty * TILE, { swim: true, jumping: false })
      && !(r.flagsAt(tx, ty, g.tide) & F.PIT);
    for (let ty = 0; ty < r.th; ty++) for (let tx = 0; tx < r.tw; tx++) {
      const edge = tx === 0 || ty === 0 || tx === r.tw - 1 || ty === r.th - 1;
      if ((edge || r.warpAt(tx, ty)) && can(tx, ty)) { seen.add(tx + ',' + ty); q.push([tx, ty]); }
    }
    while (q.length) {
      const [x, y] = q.pop();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const k = (x + dx) + ',' + (y + dy);
        if (!seen.has(k) && can(x + dx, y + dy)) { seen.add(k); q.push([x + dx, y + dy]); }
      }
    }
    return seen;
  };
  // Every standing pixel near (px, py) at this sea, every other pixel, whose
  // feet are on a tile the foot flood reaches.
  const standings = (sea, cx, cy, reach) => {
    const p = g.player, list = [], reached = footFlood();
    for (let y = Math.max(0, cy - reach); y <= Math.min(g.room.ph - 16, cy + reach); y += 2) {
      for (let x = Math.max(0, cx - reach); x <= Math.min(g.room.pw - 16, cx + reach); x += 2) {
        if (!canOccupy(g, p, x, y)) continue;
        p.x = x; p.y = y;
        if (groundFlags(g, p) & (F.PIT | F.DEEP | F.WARP)) continue;
        const fx = Math.floor((x + p.hb.x + p.hb.w / 2) / TILE), fy = Math.floor((y + p.hb.y + p.hb.h - 2) / TILE);
        if (!reached.has(fx + ',' + fy)) continue;
        list.push([x, y]);
      }
    }
    return list;
  };
  // Throw a probe chunk from (x, y) facing `dir`, in the engine; where does it rest?
  const throwFrom = (x, y, dir) => {
    const p = g.player;
    p.x = x; p.y = y; p.dir = dir; p.liftT = 0;
    const c = spawnEntity(g, 'icechunk', 0, 0, {});
    g.flushPending();
    p.carrying = c; c.carried = true;
    p.throwCarried(g);
    for (let i = 0; i < 90 && c.flight && !c.remove; i++) c.update(g);
    const at = c.remove ? null : c.restTile();
    c.remove = true;
    g.entities = g.entities.filter(e => e !== c);
    return at;
  };

  for (const cl of claims) {
    const { H, key } = cl;
    const name = `${cl.map} ${key} (${cl.def.name})`;
    const plates = H.plates || (H.plate ? [{ plate: H.plate, feeds: H.feeds, drops: H.drops }] : []);
    const kept = {};
    for (let pi = 0; pi < plates.length; pi++) {
      const P = plates[pi], last = pi === plates.length - 1;
      const [px, py] = P.plate;
      // No foot: flood over the engine's own canOccupy, swimming allowed.
      let footReached = false;
      for (let sea = 0; sea < 3 && !footReached; sea++) {
        enter(cl.map, key, sea, 16, 16); quiet();
        if (footFlood().has(px + ',' + py)) footReached = true;
      }
      ok(`${name}: no foot reaches the plate at ${px},${py} at any sea`, !footReached);
      // No throw from its own floor — unless the claim says a throw in this
      // very room is how it is fed (`feeds`), when the feeds are the proof.
      let thrown = 0, hit = null;
      for (let sea = 0; sea < 3 && !hit && !P.feeds; sea++) {
        enter(cl.map, key, sea, 16, 16); quiet();
        g.player.freeze = true;
        for (const [x, y] of standings(sea, px * TILE, py * TILE, 24 * TILE)) {
          for (const dir of ['up', 'down', 'left', 'right']) {
            thrown++;
            const at = throwFrom(x, y, dir);
            if (at && at.tx === px && at.ty === py) { hit = `${seaNames[sea]} from ${x},${y} ${dir}`; break; }
          }
          if (hit) break;
        }
        g.player.freeze = false;
      }
      if (!P.feeds) ok(`${name}: no chunk thrown from any of ${thrown} standing places in the room lands on the plate`, thrown > 100 && !hit, hit || '');
      // Fed for real, with every plate before it still held.
      const fid = '__feed' + pi;
      for (const fd of [...(P.feeds || []).map(x => ({ ...x, room: key, same: true })), ...(P.drops || [])]) {
        g.progress.chunks = { ...kept };
        g.progress.flags = {};
        const [ax, ay] = fd.at;
        enter(cl.map, fd.room, fd.sea, ax, ay, fd.face); quiet();
        const at = throwFrom(ax, ay, fd.face);
        // A probe has no id; throw a real one so the save keeps it.
        const p = g.player;
        p.x = ax; p.y = ay; p.dir = fd.face;
        const c = spawnEntity(g, 'icechunk', 0, 0, { id: fid });
        g.flushPending();
        p.carrying = c; c.carried = true;
        p.throwCarried(g);
        step(90);
        const L = ledger()[fid];
        const [cf] = key.split(',').map(Number);
        ok(`${name}: a chunk thrown from ${ax},${ay} ${fd.face} at ${seaNames[fd.sea]} in ${fd.room} comes to rest on the plate at ${px},${py}`,
          L && L.floor === cf && L.tx === px && L.ty === py, JSON.stringify(L) + ' probe ' + JSON.stringify(at));
        enter(cl.map, key, fd.sea, 16, 16);
        step(3);
        const sw = g.entities.find(e => e instanceof FloorSwitch && Math.floor(e.cx / TILE) === px && Math.floor(e.cy / TILE) === py);
        const pz = cl.def.puzzle;
        const solved = !pz || !pz.flag || !!g.progress.flags[pz.flag];
        if (last) {
          ok(`${name}: and holds it, and the room's puzzle (${pz && pz.flag}) is solved`, sw && sw.pressed && solved);
        } else {
          ok(`${name}: and holds it, and the room's puzzle (${pz && pz.flag}) is NOT solved by ${pi + 1} of ${plates.length}`, sw && sw.pressed && !solved);
        }
        // A save and a load.
        const back = importCode(exportCode(g.progress));
        g.progress = back;
        enter(cl.map, key, fd.sea, 16, 16);
        g.dialogue.active = false;
        step(3);
        const sw2 = g.entities.find(e => e instanceof FloorSwitch && Math.floor(e.cx / TILE) === px && Math.floor(e.cy / TILE) === py);
        ok(`${name}: and after a save and a load it is still on the plate`, sw2 && sw2.pressed);
        if (L) kept[fid] = L;
      }
    }
    for (const h of H.hauls || []) {
      const [fx, fy] = h.from, [bx, by] = h.below;
      const cb = cellBeneath(cl.map, getRoom(cl.map, ...key.split(',').map(Number)), bx, by);
      const got = [];
      const seas = [h.sea]; for (let lv = 0; lv < h.sea; lv++) seas.push(lv);
      for (const sea of seas) {
        g.progress.chunks = { __haul: { map: cl.map, floor: cb.floor, rx: cb.rx, ry: cb.ry, tx: cb.tx, ty: cb.ty } };
        const p = enter(cl.map, key, sea, fx * TILE, fy * TILE, h.face); quiet();
        // Anything the room queued on entry (the Brinehulk) goes too.
        g.flushPending(); quiet();
        p.dir = h.face;
        step(1, ['a']); step(160);
        got.push(!!(p.carrying && p.carrying.chunkId === '__haul'));
        p.carrying = null;
      }
      ok(`${name}: the line cast ${h.face} from ${fx},${fy} at ${seaNames[h.sea]} brings up the chunk from ${cb.room.key} ${cb.tx},${cb.ty}`, got[0]);
      ok(`${name}: and at every lower sea it does not`, got.slice(1).every(x => !x));
    }
    for (const h of H.catches || []) {
      const [fx, fy] = h.from, [cx, cy] = h.at;
      const [f, rx, ry] = key.split(',').map(Number);
      g.progress.chunks = { __catch: { map: cl.map, floor: f, rx, ry, tx: cx, ty: cy } };
      const p = enter(cl.map, key, h.sea, fx * TILE, fy * TILE, h.face); quiet();
      g.flushPending(); quiet();
      p.dir = h.face;
      g.progress.chunks = { __catch: { map: cl.map, floor: f, rx, ry, tx: cx, ty: cy } };
      spawnEntity(g, 'icechunk', cx, cy, { id: '__catch' }); g.flushPending();
      step(1, ['a']); step(160);
      ok(`${name}: a chunk lying at ${cx},${cy} is caught by the line cast ${h.face} from ${fx},${fy} and comes home`,
        !!(p.carrying && p.carrying.chunkId === '__catch'));
      p.carrying = null;
    }
  }
  g.input = realInput;
  return res;
});
for (const [n, c, d] of out) check(n, c, d);
check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
console.log(`\n=== ${pass} passed, ${fail.length} failed ===`);
await browser.close(); server.close();
process.exit(fail.length ? 1 : 0);
