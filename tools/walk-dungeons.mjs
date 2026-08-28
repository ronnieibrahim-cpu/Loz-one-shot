// Dungeon walker + ledge harness. Boots headless, enters every room of every
// dungeon, checks it renders and nothing falls through to `void`, then floods
// each dungeon from its entrance treating locked doors as walls until a key is
// spent and the boss door until the Boss Key is found, and asserts every room
// and the boss room is reached.
//
// Also proves the placed ledges: for every ledge run in the data it walks a
// live player into the lip from the high side and asserts the hop fires and
// lands, then walks into it from the low side and asserts it is refused.
//
// All four cardinals are covered. `_` and `"` are horizontal runs probed along
// y; `>` and `<` are VERTICAL runs — a lip facing east is a column, not a row —
// and are probed along x. Scanning every direction as if it were a row was the
// first version of this and it silently reported zero east/west ledges while
// they were sitting in the data.
//
// Boot pattern copied from tools/test.mjs.

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

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

// ESM ignores NODE_PATH, so fall back to the global install explicitly. Same
// shape as tools/test.mjs.
async function loadPlaywright() {
  let mod;
  try {
    mod = await import('playwright');
  } catch (e) {
    const { execSync } = await import('node:child_process');
    const root = execSync('npm root -g', { encoding: 'utf8' }).trim();
    mod = await import(join(root, 'playwright', 'index.js'));
  }
  return mod.chromium ? mod : mod.default;
}

let passed = 0; const failures = [];
function check(name, cond, detail) {
  if (cond) { passed++; console.log('  ok   ' + name); }
  else { failures.push(name + (detail ? ' \u2014 ' + detail : '')); console.log('  FAIL ' + name + (detail ? ' \u2014 ' + detail : '')); }
}

const { chromium } = await loadPlaywright();
// Random high port: concurrent runs must not fight over a fixed one.
const PORT = 20000 + Math.floor(Math.random() * 20000);
const server = await serve(PORT);
// Fall back to a system Chromium when the installed browser build does not
// match the installed playwright package (see check-build.mjs / test.mjs).
const browser = await chromium.launch({ headless: true }).catch(async (err) => {
  const { existsSync } = await import('node:fs');
  const fallback = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium';
  if (!existsSync(fallback)) throw err;
  return chromium.launch({ headless: true, executablePath: fallback });
});
const page = await browser.newPage({ viewport: { width: 800, height: 720 } });
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR: ' + (e.stack || e.message)));
page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });

await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'load' });
await page.waitForFunction(() => !!window.__game, { timeout: 15000 });

// Every wait from here on is measured in exact game frames, not wall clock —
// `window.__harness.takeOver()` (src/main.js) stops the real-time loop from
// calling `game.update()` on its own, and `step(n)` calls it exactly n times.
// The intro-skip below used to wait on wall-clock `requestAnimationFrame`
// polling instead, which measures a FIXED NUMBER OF GAME UPDATES against
// however much real time the browser actually took to deliver that many
// animation-frame callbacks — usually the same thing, but not exactly, and
// this loop's own exit condition (`mode === 'cutscene'`) means a one-frame
// difference in when a press lands can cost or save a WHOLE extra iteration,
// leaving the player object with different residual state (`frozen`, from
// the intro's own conch-grant) for the rest of the run. Proved this mattered
// directly: a change with NO functional effect on this file at all (padding
// an unrelated module with two comment lines) was enough to shift the real
// time/game-frame ratio here and change how many iterations the intro-skip
// loop took, which in turn changed a completely unrelated overworld ledge
// hop's outcome many rooms later — `page.keyboard` still drives which keys
// are HELD (that's real DOM key state, not timing), only the frame
// advancement itself is no longer at the mercy of the clock.
await page.evaluate(() => window.__harness.takeOver());
const step = (n) => page.evaluate(n => window.__harness.step(n), n);

// main.js only publishes window.__game; everything else comes out of the live
// module graph, which returns the same instances the game is using.
await page.evaluate(async () => {
  const maps = await import('/src/world/maps.js');
  const room = await import('/src/world/room.js');
  const ts = await import('/src/world/tileset.js');
  // PASSABILITY IS NEVER RE-DERIVED HERE. `tileWalkable`/`tileSolid` ask the
  // real `Room.solidAt` — the same function `canOccupy`/`moveEntity` use in
  // the running game — rather than re-deriving which flags block movement.
  // See tools/lib/collision.mjs and CLAUDE.md, Hard rules.
  const col = await import('/tools/lib/collision.mjs');
  window.__MAPS = maps.MAPS;
  window.__getRoom = maps.getRoom;
  window.__getLegend = room.getLegend;
  window.__getTileDef = ts.getTileDef;
  window.__F = ts.F;
  window.__tileWalkable = col.tileWalkable;
  window.__tileSolid = col.tileSolid;
  window.__ROUTE_AVOID = col.ROUTE_AVOID;
  // The Dredge Line's reach, out of feel.js rather than written down here, so
  // retuning the line re-walks every dungeon instead of quietly breaking one.
  const feel = await import('/src/data/feel.js');
  window.__DREDGE_TILES = Math.floor(feel.DREDGE_RANGE / 16);
});

// New game, skip the intro.
await page.keyboard.press('Enter'); await step(6);
await page.keyboard.press('Enter'); await step(20);
for (let i = 0; i < 140 && await page.evaluate(() => window.__game.mode === 'cutscene'); i++) {
  await page.keyboard.press(i % 2 ? 'Enter' : 'x'); await step(4);
}

// ---------------------------------------------------------------- part 1: walk
// Six dungeons, and six is now what the data holds: the Reef Palace and the
// Abyssal Keep were folded into d6 by the P8/D6 consolidation. Read out of the
// map registry rather than listed, so the next fold needs no edit here.
const DUNGEONS = await page.evaluate(() => [...window.__MAPS.values()]
  .filter(m => m.dungeon)
  .sort((a, b) => (a.dungeon.index | 0) - (b.dungeon.index | 0))
  .map(m => m.id));

for (const id of DUNGEONS) {
  const res = await page.evaluate(async (mapId) => {
    const g = window.__game;
    const m = window.__MAPS.get(mapId);
    const out = { rooms: [], bad: [] };
    for (const key of Object.keys(m.roomDefs)) {
      const [f, rx, ry] = key.split(',').map(Number);
      // enterMap is (mapId, FLOOR, rx, ry, px, py, dir) — floor is second.
      g.enterMap(mapId, f, rx, ry, 80, 64, 'down', { instant: true });
      // An open dialogue freezes every entity while mode is still 'play', and a
      // reward `say` from the previous room would make this one look inert.
      if (g.dialogue) g.dialogue.active = false;
      const room = g.room;
      if (!room) { out.bad.push(`${key}: no room`); continue; }
      let voids = 0, unknown = [];
      // The ROOM's extent. A 2x1 room is 20x8 and checking the first ten
      // columns of it would leave half of it unproved.
      for (let y = 0; y < room.th; y++) for (let x = 0; x < room.tw; x++) {
        for (const tide of [0, 1, 2]) {
          const d = room.tile(x, y, tide);
          if (!d) { unknown.push(`${x},${y}`); continue; }
          if (d.name === 'void' && !(m.roomDefs[key].map[y][x] === ' ')) voids++;
        }
      }
      if (unknown.length) out.bad.push(`${key}: unresolved tiles ${unknown.slice(0, 3)}`);
      if (voids) out.bad.push(`${key}: ${voids} tiles fell through to void`);
      out.rooms.push(key);
    }
    return out;
  }, id);
  check(`${id}: every room enters and renders`, res.bad.length === 0, res.bad.slice(0, 4).join('; '));
}

// ------------------------------------------------- part 2: dungeon reachability
const reach = await page.evaluate((ids) => {
  const F = window.__F, getRoom = window.__getRoom;
  const tileWalkable = window.__tileWalkable, ROUTE_AVOID = window.__ROUTE_AVOID;
  const SW = 10, SH = 8;                    // one SCREEN, in tiles
  const DREDGE_TILES = window.__DREDGE_TILES;
  // The dungeon that hands the Dredge Line over, found rather than written
  // down, so the consolidation moving it from d8 to d6 needs no edit here.
  let DREDGE_INDEX = 99;
  for (const m0 of window.__MAPS.values()) {
    if (m0.dungeon && m0.dungeon.item === 'dredge') DREDGE_INDEX = Math.min(DREDGE_INDEX, m0.dungeon.index | 0);
  }
  const report = [];
  // A room declares one sill or a list of them; normalise before reading.
  const sillsOf = (def) => !def.bellowsRoom ? []
    : (Array.isArray(def.bellowsRoom) ? def.bellowsRoom : [def.bellowsRoom]);
  for (const mapId of ids) {
    const m = window.__MAPS.get(mapId);
    // Every room's size in screens, and which map cell each room owns. A
    // multi-screen room covers sw x sh cells from its key, so a seam is
    // resolved by asking which room owns the cell on the other side of it
    // rather than by adding one to the room's x. For an all-1x1 dungeon —
    // every dungeon today — `owner` is the identity on room keys and the flood
    // below walks exactly the graph it always did.
    const sizeOf = (rk) => {
      const sz = (m.roomDefs[rk].size) || [1, 1];
      return [sz[0] | 0, sz[1] | 0];
    };
    const dims = new Map();                 // rk -> {rx, ry, sw, sh, W, H}
    const owner = new Map();                // 'f,cx,cy' -> rk
    for (const rk of Object.keys(m.roomDefs)) {
      const [f0, rx0, ry0] = rk.split(',').map(Number);
      const [sw0, sh0] = sizeOf(rk);
      dims.set(rk, { f: f0, rx: rx0, ry: ry0, sw: sw0, sh: sh0, W: sw0 * SW, H: sh0 * SH });
      for (let j = 0; j < sh0; j++) for (let i = 0; i < sw0; i++) owner.set(`${f0},${rx0 + i},${ry0 + j}`, rk);
    }
    // A tile step that leaves `rk` lands in whichever room owns the screen cell
    // it fell into. Returns null off the end of the map.
    const stepOut = (rk, nx, ny) => {
      const D = dims.get(rk);
      const gx = D.rx * SW + nx, gy = D.ry * SH + ny;
      const nrk = owner.get(`${D.f},${Math.floor(gx / SW)},${Math.floor(gy / SH)}`);
      if (!nrk) return null;
      const N = dims.get(nrk);
      return [nrk, gx - N.rx * SW, gy - N.ry * SH];
    };
    // Every room this map declares, as the engine's own `Room` — built by
    // `getRoom`, the same function the running game calls, rather than a
    // second resolution of the legend/tide-chain here.
    const ROOMS = new Map();
    for (const rk of Object.keys(m.roomDefs)) {
      const [f0, rx0, ry0] = rk.split(',').map(Number);
      ROOMS.set(rk, getRoom(mapId, f0, rx0, ry0));
    }
    // Passable if walkable at ANY tide level — the player controls the tide.
    //
    // Since the tide became a field this is an UPPER BOUND rather than an
    // equality, and deliberately so. A tile's walkability depends only on the
    // level IT resolves at, and the Anchor's only power is to change that level
    // for a patch of tiles — so no placement can make a tile passable that is
    // impassable at all three levels. Anything this flood cannot reach, no
    // arrangement of held water reaches either.
    //
    // The direction that bound does not cover is the one the level-aware flood
    // in check-overworld.mjs measures: this model grants a different level on
    // every tile at once, which the conch alone cannot do. Here that gap is
    // narrower than it looks, because the Anchor is recallable from anywhere —
    // every field it can create is reversible, so the state that has to be
    // connected is the base state, and the base state is what this walks.
    //
    // AND FROM D3 ONWARD THE PLAYER CAN SWIM. The Kelp-Soled Cleats are the
    // third dungeon's item, so by the time the Bogwater Sanctum is entered deep
    // water is floor — in both modes, since swimming and sinking cross exactly
    // the same tiles and differ only in what the crossing costs. A flood that
    // still treated DEEP as a wall reported every room past the Sanctum's item
    // as stranded, which is a harness limitation and not a dungeon bug, the
    // same shape as the jump exemption below it. It stays OFF for d1 and d2,
    // where the player provably does not have the Cleats yet, so nothing
    // already proved about those two moves.
    //
    // Passability itself is never re-derived here: `walkableAt` asks the real
    // `Room.solidAt` (via tools/lib/collision.mjs's `tileWalkable`), with the
    // player's own capability shape as `caps` — exactly how the engine already
    // expresses "what can this mover cross" — plus one checker-local override
    // (STAIRS is always a valid flood node, since you stand on a stair to use
    // it) that is not a collision rule, it is this tool choosing to treat a
    // warp trigger as passable rather than re-deriving what makes it solid.
    const canSwim = (m.dungeon.index | 0) >= 3;
    const CAPS = { jumping: false, swim: canSwim, cutting: false };
    const walkableAt = (room, x, y, t) => {
      if (room.flagsAt(x, y, t) & F.STAIRS) return true;
      return tileWalkable(room, x, y, t, CAPS, ROUTE_AVOID);
    };
    const passable = (room, x, y) => [0, 1, 2].some(t => walkableAt(room, x, y, t));
    // The level a tile resolves at under a field: the held level inside the
    // anchor's patch, the base outside it. Rooms are 10x8 and the patch is a
    // square of radius ANCHOR_RADIUS_TILES.
    const R = 2;
    const levelAt = (x, y, base, a) =>
      (a && Math.abs(x - a.tx) <= R && Math.abs(y - a.ty) <= R) ? a.level : base;
    // Roc's Feather clears a one-tile gap, and `solidAt` lets a jumping player
    // through DEEP and JUMPABLE alike. Half of d4 is a one-tile drown-wall band
    // that is a wall at LOW/MID and deep water at HIGH — the intended crossing
    // is to raise the sea and jump it. A flood that cannot jump reports 15 of
    // d4's 18 rooms stranded, which is a harness limitation, not a dungeon bug.
    const jumpable = (room, x, y) => [0, 1, 2].some(t => room.flagsAt(x, y, t) & (F.DEEP | F.JUMPABLE));
    // A ONE-WAY LEDGE IS TRAVERSAL, and this flood used to treat it as a wall.
    // That was harmless for as long as no ledge was the ONLY way into
    // anywhere — true of every dungeon until D2, whose Lens forks are entered
    // by dropping off a lip you cannot climb back up, and which therefore read
    // as eight stranded rooms in a dungeon that walks fine in the engine.
    //
    // `Player.tryLedgeHop`: walking into the FACE of a ledge (its own `ledge`
    // direction must equal the direction of travel) clears the lip plus any
    // further ledge tiles behind it, and lands on the first tile past them if
    // that tile is standable. Directional, so it adds no route back.
    const ledgeDir = (room, x, y) => {
      for (const t of [0, 1, 2]) {
        const d = room.tile(x, y, t);
        if (d.flags & F.LEDGE) return d.ledge || null;
      }
      return null;
    };
    const DIR_OF = { '1,0': 'right', '-1,0': 'left', '0,1': 'down', '0,-1': 'up' };
    // AND A MOORING IS TRAVERSAL. The Dredge Line snags a fixed post and hauls
    // the PLAYER to it — `moveEntity` with `{ jumping: true, swim: true }`, so
    // nothing but a wall stops the pull and a pit under it is simply crossed.
    // It is the only verb in the game that crosses a chasm wider than a hop,
    // and the Abyssal Keep is built out of exactly that, so a flood that cannot
    // do it reports the whole of the Keep's upper floor as stranded.
    //
    // The same rule as the Cleats above: on from the dungeon that hands the
    // line over, off before it, so nothing already proved about d1-d5 moves.
    // What proves each crossing is really a crossing — and, far more to the
    // point, that no OTHER sea also crosses it — is check-dredge.mjs. This only
    // needs to know that the route exists.
    const canDredge = (m.dungeon.index | 0) >= DREDGE_INDEX;
    const snagAt = (room, x, y) => [0, 1, 2].some(t => room.flagsAt(x, y, t) & F.SNAG);
    // The line's own cast-stop rule, not a re-derivation of it: `DredgeLine`
    // (src/game/items.js) stops a cast on exactly `F.SOLID | F.VOID`, ignoring
    // every other flag (it flies over water, pits and ledges alike), which is
    // a different question from "can the player stand here" and is why this
    // does not route through `tileWalkable`.
    const castStops = (room, x, y) => [0, 1, 2].every(t => room.flagsAt(x, y, t) & (F.SOLID | F.VOID));
    // A door a PUZZLE opens is not a wall. `reward.openDoors` names the tiles a
    // solved room switches to their open form, so those tiles are passable in
    // the connectivity model — the flood cannot solve a puzzle, and asserting
    // the puzzle is solvable is a different tool's job (solve-switches.mjs for
    // switch rooms, check-anchor.mjs for the tide-gauge rooms). Without this a
    // room behind a puzzle door reads as stranded and the dungeon looks broken.
    //
    // A DOOR A GUST WHEEL OPENS IS THE SAME CASE. The Cliffside Cistern's
    // sills are shut `dDoorClosed` tiles that a room script opens when its
    // wheel comes round, and the flood can no more turn a wheel than it can
    // solve a puzzle. `bellowsRoom.opens` names those tiles, and
    // check-bellows.mjs is what proves each of them is actually reachable —
    // in both directions, including that the wheel cannot be turned any other
    // way. Without this the whole second half of d4 reads as stranded.
    //
    // AND SO IS A KELP SNARL. The Drowned Wood Shrine's groves are shut by a
    // `dSnarl` — SOLID at every sea, and opened by one thing, a sword swing
    // taken from a coral pillar the player grows. The flood can no more grow a
    // pillar than it can turn a wheel, so without this every grove's far side
    // reads as stranded and two thirds of d5 disappears. What proves each snarl
    // is genuinely openable — and that no other blade in the room reaches it —
    // is check-reefseed.mjs.
    const puzzleDoors = new Set();
    for (const [rk, def] of Object.entries(m.roomDefs)) {
      for (const [dx0, dy0] of def.puzzle?.reward?.openDoors || []) puzzleDoors.add(`${rk}:${dx0},${dy0}`);
      for (const B of sillsOf(def)) {
        for (const [dx0, dy0] of B.opens || []) puzzleDoors.add(`${rk}:${dx0},${dy0}`);
      }
      if (def.reefseedRoom && def.reefseedRoom.snarl) {
        const [sx0, sy0] = def.reefseedRoom.snarl;
        puzzleDoors.add(`${rk}:${sx0},${sy0}`);
      }
    }
    const isLock = (room, x, y) => room.baseName(x, y) === 'dDoorLocked';
    const isBossDoor = (room, x, y) => room.baseName(x, y) === 'dDoorBoss';
    // Floors are joined by warps, not by seams. A flood that only crosses room
    // edges never leaves floor 0, which reads as "every upper room stranded".
    const warpsOut = new Map();   // 'rk:x,y' -> 'rk:x,y'
    for (const [rk, def] of Object.entries(m.roomDefs)) {
      for (const w0 of def.warps || []) {
        const w = Array.isArray(w0)
          ? { x: w0[0], y: w0[1], to: { map: w0[2], floor: w0[3] | 0, rx: w0[4], ry: w0[5] } }
          : w0;
        if (w.to.map !== mapId) continue;      // leaving the dungeon: not our problem
        const dst = `${w.to.floor},${w.to.rx},${w.to.ry}`;
        if (!m.roomDefs[dst]) continue;
        const px = Math.floor((w.to.px ?? 80) / 16), py = Math.floor((w.to.py ?? 64) / 16);
        warpsOut.set(`${rk}:${w.x},${w.y}`, `${dst}:${px},${py}`);
      }
    }

    // Count keys available in the whole dungeon, spent as doors are opened.
    //
    // A CHEST HANDS OVER A KEY IN TWO DIFFERENT SHAPES and this used to know
    // only one. `Game.openChest` takes `item:` (grant the item) OR `pickup:`
    // (spawn the pickup on the floor), and D1's third key is a
    // `{ pickup: 'key' }` chest — so the dungeon was walked believing it had two
    // keys for three locks. It stayed invisible because the third lock had a way
    // round it, so the flood never asked for the key it could not count: two
    // faults that each concealed the other, and sealing the door is what made
    // this one fail out loud. The boss-key sweep below already read all three
    // spellings; this now matches it.
    let keys = 0;
    for (const def of Object.values(m.roomDefs)) {
      for (const e of def.entities || []) {
        const o = e[3] || {};
        if (e[0] === 'pickup' && o.kind === 'key') keys++;
        if (e[0] === 'chest' && (o.item === 'key' || o.pickup === 'key')) keys++;
      }
      for (const s of def.puzzle?.reward?.spawn || []) if (s[3] && s[3].kind === 'key') keys++;
      // A gust wheel pays out in a room script, which is invisible to every
      // sweep here, so the sill declares what it releases and check-bellows
      // proves the wheel can be turned. Miss this and d4 is walked believing
      // it has two keys for three locks.
      for (const B of sillsOf(def)) if (B.gives === 'key') keys++;
      // AND SO IS A THING LYING ON THE BOTTOM. `room.buried` is the Dredge
      // Line's own list — the one the shovel used to read — and it is invisible
      // to every sweep in this file, so the Keep was walked believing it had
      // three keys for four locks. check-dredge.mjs is what proves each cache
      // can actually be fished out.
      for (const b of def.buried || []) if (b[2] === 'key') keys++;
    }
    let bossKey = false;
    for (const def of Object.values(m.roomDefs)) {
      for (const e of def.entities || []) {
        const o = e[3] || {};
        if (String(o.pickup || o.item || o.kind || '').toLowerCase() === 'bosskey') bossKey = true;
      }
      for (const B of sillsOf(def)) if (String(B.gives || '').toLowerCase() === 'bosskey') bossKey = true;
      for (const b of def.buried || []) if (String(b[2] || '').toLowerCase() === 'bosskey') bossKey = true;
    }

    const start = m.dungeon.startRoom;
    const startKey = start.includes(',') && start.split(',').length === 3 ? start : '0,' + start;
    const seedRoom = m.roomDefs[startKey] ? startKey : Object.keys(m.roomDefs)[0];

    // Flood tile-by-tile across rooms: a seam is crossed when both sides have a
    // passable tile in the matching row/column.
    const seen = new Set();
    const lockedSeen = new Set();
    const q = [];
    const push = (rk, x, y) => {
      const k = rk + ':' + x + ',' + y;
      if (seen.has(k)) return;
      seen.add(k); q.push([rk, x, y]);
    };
    // seed anywhere passable in the start room
    const sdD = dims.get(seedRoom);
    const sdRoom = ROOMS.get(seedRoom);
    for (let y = 0; y < sdD.H; y++) for (let x = 0; x < sdD.W; x++) if (passable(sdRoom, x, y)) { push(seedRoom, x, y); }

    let progress = true;
    while (progress) {
      progress = false;
      while (q.length) {
        const [rk, x, y] = q.pop();
        const room = ROOMS.get(rk);
        const w = warpsOut.get(rk + ':' + x + ',' + y);
        if (w) { const [wrk, wxy] = w.split(':'); const [wx, wy] = wxy.split(',').map(Number); push(wrk, wx, wy); }
        const D = dims.get(rk);
        const W = D.W, H = D.H;
        // A cast, before the ordinary steps: look along each axis for a post
        // within the line's reach with nothing solid in front of it, and land
        // on the tile before it.
        if (canDredge) {
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            for (let n = 1; n <= DREDGE_TILES; n++) {
              const cx = x + dx * n, cy = y + dy * n;
              if (cx < 0 || cy < 0 || cx >= W || cy >= H) break;
              if (snagAt(room, cx, cy)) {
                const lx = cx - dx, ly = cy - dy;
                if (lx !== x || ly !== y) push(rk, lx, ly);
                break;
              }
              if (castStops(room, cx, cy)) break;
            }
          }
        }
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < W && ny < H) {
            if (passable(room, nx, ny) || puzzleDoors.has(`${rk}:${nx},${ny}`)) push(rk, nx, ny);
            else if (jumpable(room, nx, ny)) {
              const jx = x + dx * 2, jy = y + dy * 2;
              if (jx >= 0 && jy >= 0 && jx < W && jy < H && passable(room, jx, jy)) push(rk, jx, jy);
            }
            else if (ledgeDir(room, nx, ny) === DIR_OF[dx + ',' + dy]) {
              let n = 1;
              while (n < 3) {
                const cx = nx + dx * n, cy = ny + dy * n;
                if (cx < 0 || cy < 0 || cx >= W || cy >= H || !ledgeDir(room, cx, cy)) break;
                n++;
              }
              const lx = nx + dx * n, ly = ny + dy * n;
              if (lx >= 0 && ly >= 0 && lx < W && ly < H && passable(room, lx, ly)) push(rk, lx, ly);
            }
            else if (isLock(room, nx, ny)) lockedSeen.add(rk + ':' + nx + ',' + ny);
            else if (isBossDoor(room, nx, ny) && bossKey) lockedSeen.add(rk + ':' + nx + ',' + ny + ':boss');
            continue;
          }
          // stepping off the ROOM edge into whichever room owns the cell beyond
          const out = stepOut(rk, nx, ny);
          if (!out) continue;
          const [nk, tx, ty] = out;
          if (passable(ROOMS.get(nk), tx, ty)) push(nk, tx, ty);
        }
      }
      // spend a key on one still-closed lock we can see
      for (const l of lockedSeen) {
        const parts = l.split(':');
        const isBoss = parts[2] === 'boss';
        if (!isBoss && keys <= 0) continue;
        const [rk, xy] = parts;
        const [x, y] = xy.split(',').map(Number);
        if (seen.has(rk + ':' + x + ',' + y)) continue;
        if (!isBoss) keys--;
        push(rk, x, y);
        lockedSeen.delete(l);
        progress = true;
        break;
      }
    }
    const reachedRooms = new Set([...seen].map(k => k.split(':')[0]));
    const all = Object.keys(m.roomDefs);
    const missed = all.filter(r => !reachedRooms.has(r));
    report.push({ mapId, missed, boss: m.dungeon.bossRoom, bossReached: reachedRooms.has(m.dungeon.bossRoom), total: all.length });
  }
  return report;
}, DUNGEONS);

for (const r of reach) {
  check(`${r.mapId}: all ${r.total} rooms reachable`, r.missed.length === 0, r.missed.join(','));
  check(`${r.mapId}: boss room reachable`, r.bossReached, r.boss);
}

// ------------------------------------------- part 2b: the tide-locked rooms
//
// `passable` above lets the flood pick whichever tide level suits each tile,
// on the grounds that the player controls the tide. In a room with `noTide`
// they do not: the conch is refused, so they are stuck on whatever level they
// walked in with, and every other room in the dungeon can hand them any of the
// three. A locked room therefore has to work at ALL THREE levels independently
// — and nothing checked that, because with a scalar tide there was no way to
// say "this room, at this level, on its own".
//
// This is the check the field makes expressible. It is also the one that will
// matter most when P8 re-authors these rooms around the Anchor: an anchor laid
// inside a locked room holds the level you brought, which is the only tide
// mechanic a boss room has left.
const locked = await page.evaluate((ids) => {
  const F = window.__F, getRoom = window.__getRoom;
  const tileWalkable = window.__tileWalkable, ROUTE_AVOID = window.__ROUTE_AVOID;
  // On foot, no items — a locked room's own flood does not vary by dungeon
  // index the way the main reachability flood's `canSwim` does, because the
  // whole point of `noTide` is that nothing about the room adapts to what the
  // player is carrying.
  const CAPS = { jumping: false, swim: false, cutting: false };
  const walk = (room, x, y, t) => (room.flagsAt(x, y, t) & F.STAIRS) || tileWalkable(room, x, y, t, CAPS, ROUTE_AVOID);
  const out = [];
  for (const mapId of ids) {
    const m = window.__MAPS.get(mapId);
    for (const [key, def] of Object.entries(m.roomDefs || {})) {
      if (!def.noTide) continue;
      const sz = def.size || [1, 1];
      const W = (sz[0] | 0) * 10, H = (sz[1] | 0) * 8;
      const [f0, rx0, ry0] = key.split(',').map(Number);
      const room = getRoom(mapId, f0, rx0, ry0);
      for (const t of [0, 1, 2]) {
        // Flood from every walkable tile on the room's border — the ways in —
        // and require it to cover every walkable tile in the room. An island
        // of floor the player cannot get to is the failure being looked for.
        const walkable = [];
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (walk(room, x, y, t)) walkable.push(x + ',' + y);
        if (!walkable.length) { out.push(`${mapId} ${key} @${t}: no floor at all`); continue; }
        const seen = new Set(), q = [];
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const border = x === 0 || y === 0 || x === W - 1 || y === H - 1;
          if (border && walk(room, x, y, t)) { const k = x + ',' + y; if (!seen.has(k)) { seen.add(k); q.push([x, y]); } }
        }
        while (q.length) {
          const [x, y] = q.pop();
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
            const k = nx + ',' + ny;
            if (seen.has(k) || !walk(room, nx, ny, t)) continue;
            seen.add(k); q.push([nx, ny]);
          }
        }
        const stranded = walkable.filter(k => !seen.has(k));
        if (stranded.length) out.push(`${mapId} ${key} @${t}: ${stranded.length} tiles cut off (${stranded.slice(0, 3)})`);
      }
    }
  }
  return out;
}, DUNGEONS);
check('every tide-locked room works at all three levels on its own',
  locked.length === 0, locked.slice(0, 4).join(' | '));

// ------------------------------------------- part 2c: locks that lock something
//
// NOTHING USED TO CHECK THAT A LOCKED DOOR LOCKS ANYTHING, and the flood above
// structurally cannot: it spends a key on any lock it can reach and then asks
// only whether every room came out reachable. A door with a way round it
// therefore reads exactly like a door that got opened, and the key it charges
// for reads exactly like a key that got spent. D1's Clawcrab Den shipped with
// one — row 2 ran clear past the door in the room's west wall, so the Piece of
// Heart behind it was free and Small Key 3 bought nothing. It survived every
// checker in the repo and was found by walking the room.
//
// The claim here is local and cheap: a `dDoorLocked` or `dDoorBoss` tile must
// SEPARATE its room. Flood from the tile on one side of it with the door
// treated as solid, and the tile on the other side must not be reachable.
//
// AT ALL THREE TIDE LEVELS, on the same axis. A door that separates at LOW and
// not at HIGH is not a locked door, it is a locked door and a conch — and the
// conch is the one tool the player always has.
//
// It says nothing about whether the far side is worth anything, or whether the
// key is reachable first; those are the flood's job and it already does them.
const leaky = await page.evaluate((ids) => {
  const F = window.__F, getRoom = window.__getRoom;
  const tileWalkable = window.__tileWalkable, ROUTE_AVOID = window.__ROUTE_AVOID;
  const CAPS = { jumping: false, swim: false, cutting: false };
  const walk = (room, x, y, t) => (room.flagsAt(x, y, t) & F.STAIRS) || tileWalkable(room, x, y, t, CAPS, ROUTE_AVOID);
  const out = []; let total = 0;
  for (const mapId of ids) {
    const m = window.__MAPS.get(mapId);
    for (const [key, def] of Object.entries(m.roomDefs || {})) {
      const sz = def.size || [1, 1];
      const W = (sz[0] | 0) * 10, H = (sz[1] | 0) * 8;
      const [f0, rx0, ry0] = key.split(',').map(Number);
      const room = getRoom(mapId, f0, rx0, ry0);
      // Does the door at (x,y) cut its two neighbours along (ax,ay) apart?
      const cuts = (x, y, ax, ay, t) => {
        const a = [x - ax, y - ay], b = [x + ax, y + ay];
        if (a[0] < 0 || a[1] < 0 || b[0] >= W || b[1] >= H) return false;
        if (!walk(room, a[0], a[1], t) || !walk(room, b[0], b[1], t)) return false;
        const seen = new Set([a.join(',')]), q = [a];
        while (q.length) {
          const [cx, cy] = q.pop();
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = cx + dx, ny = cy + dy;
            if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
            if (nx === x && ny === y) continue;              // the door is shut
            const k = nx + ',' + ny;
            if (seen.has(k) || !walk(room, nx, ny, t)) continue;
            seen.add(k); q.push([nx, ny]);
          }
        }
        return !seen.has(b.join(','));
      };
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const name = room.baseName(x, y);
        if (name !== 'dDoorLocked' && name !== 'dDoorBoss') continue;
        total++;
        const held = [[1, 0], [0, 1]].some(([ax, ay]) => [0, 1, 2].every(t => cuts(x, y, ax, ay, t)));
        if (!held) out.push(`${mapId} ${key} (${def.name || ''}) door at ${x},${y}`);
      }
    }
  }
  return { out, total };
}, DUNGEONS);
check(`every locked door separates its room at all three tide levels (${leaky.total} doors)`,
  leaky.out.length === 0, leaky.out.slice(0, 4).join(' | ') + ' — there is a way round it');

// ------------------------------------------------------- part 3: the ledges
// The four ledge characters, each with the unit vector the player hops along
// and the unit vector its run extends along (always the perpendicular).
const LEDGE_CHARS = {
  '_': { dir: 'down',  ux: 0, uy: 1,  ax: 1, ay: 0 },
  '"': { dir: 'up',    ux: 0, uy: -1, ax: 1, ay: 0 },
  '>': { dir: 'right', ux: 1, uy: 0,  ax: 0, ay: 1 },
  '<': { dir: 'left',  ux: -1, uy: 0, ax: 0, ay: 1 },
};

const placements = await page.evaluate((CHARS) => {
  const out = [];
  for (const [mapId, m] of window.__MAPS) {
    for (const [key, def] of Object.entries(m.roomDefs || {})) {
      const grid = def.map || [];
      const at = (x, y) => (grid[y] || '')[x];
      const seen = new Set();
      for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < (grid[y] || '').length; x++) {
          const ch = at(x, y);
          const spec = CHARS[ch];
          if (!spec || seen.has(`${ch}${x},${y}`)) continue;
          // Walk to the end of the run along the lip's own axis, marking as we
          // go so the rest of the run is not re-reported as its own placement.
          let len = 0, cx = x, cy = y;
          while (at(cx, cy) === ch) {
            seen.add(`${ch}${cx},${cy}`);
            len++; cx += spec.ax; cy += spec.ay;
          }
          out.push({ mapId, key, ch, x0: x, y0: y, len, ...spec });
        }
      }
    }
  }
  return out;
}, LEDGE_CHARS);

const byDir = {};
for (const p of placements) byDir[p.dir] = (byDir[p.dir] || 0) + 1;
console.log(`  ${placements.length} ledge runs placed (${
  Object.entries(byDir).map(([d, n]) => `${d} ${n}`).join(', ') || 'none'})`);

const KEY = { down: 'ArrowDown', up: 'ArrowUp', left: 'ArrowLeft', right: 'ArrowRight' };
const OPP = { down: 'up', up: 'down', left: 'right', right: 'left' };

let hopOk = 0, hopFail = [], blockOk = 0, blockFail = [];
for (const p of placements) {
  const [f, rx, ry] = p.key.split(',').map(Number);
  // The midpoint of the run, measured along the lip's own axis.
  const mx = p.x0 + p.ax * (p.len >> 1);
  const my = p.y0 + p.ay * (p.len >> 1);
  // The lip's coordinate on the hop axis, and which way "past it" points.
  const sign = p.ux || p.uy;
  const lipC = p.ux ? p.x0 : p.y0;
  const tileOf = (a) => (p.ux ? a.tx : a.ty);
  const beyond = (t) => (sign > 0 ? t > lipC : t < lipC);
  // --- downhill: walk into the lip from the high side, expect a hop that lands
  const place = async (a, tx, ty, dir) => page.evaluate(async (b) => {
    const g = window.__game;
    // Rooms are full of live enemies. A parked player dies, the game drops into
    // 'gameover' where nothing updates, and EVERY later probe in the run reads
    // as "the hop did not fire" — the same trap the boss harness documents.
    g.mode = 'play';
    g.progress.hearts = g.progress.maxHearts;
    g.enterMap(b.mapId, b.f, b.rx, b.ry, 80, 64, b.dir, { instant: true });
    window.__harness.step(3);
    // An open dialogue freezes every entity while mode is still 'play'.
    if (g.dialogue) g.dialogue.active = false;
    g.mode = 'play';
    g.progress.hearts = g.progress.maxHearts;
    g.player.invuln = 100000;               // nothing may interrupt the probe
    g.entities = g.entities.filter(e => e === g.player);
    g.tide.setLevel(1);
    g.player.z = 0; g.player.vz = 0; g.player.jumping = false; g.player.ledgeHop = null;
    g.player.x = b.tx * 16; g.player.y = b.ty * 16;
    g.player.lastSafe.x = g.player.x; g.player.lastSafe.y = g.player.y;
    window.__harness.step(2);
    // Clear the text box LAST. A room script or a reward `say` can reopen it
    // during the settle, and an open dialogue freezes every entity while `mode`
    // is still 'play' — the player simply ignores the key and the probe reads
    // as "the hop did not fire".
    if (g.dialogue) g.dialogue.active = false;
    g.mode = 'play';
    return {
      x0: g.player.x, y0: g.player.y,
      tx: Math.floor((g.player.x + 8) / 16), ty: Math.floor((g.player.y + 8) / 16),
      rk: g.room.key, mode: g.mode, dlg: !!(g.dialogue && g.dialogue.active),
    };
  }, { ...a, tx, ty, dir });

  const at = { mapId: p.mapId, f, rx, ry };
  const down = await place(at, mx - p.ux, my - p.uy, p.dir);
  // 22 frames is far enough to clear a 1-3 tile lip and short enough that the
  // player never reaches the room edge — walking out of the room and arriving in
  // the next one reads exactly like a failed hop.
  await page.keyboard.down(KEY[p.dir]);
  await step(22);
  await page.keyboard.up(KEY[p.dir]);
  // The hop drives z along a scripted arc; measuring mid-arc reads as a fail.
  await page.evaluate(() => {
    for (let n = 0; n < 60; n++) {
      if (!window.__game.player.ledgeHop && window.__game.player.z === 0) break;
      window.__harness.step(1);
    }
  });
  const after = await page.evaluate(() => ({
    x: window.__game.player.x, y: window.__game.player.y, z: window.__game.player.z,
    tx: Math.floor((window.__game.player.x + 8) / 16),
    ty: Math.floor((window.__game.player.y + 8) / 16),
  }));
  const where = `${p.mapId} ${p.key} '${p.ch}' ${p.dir} @${p.x0},${p.y0}`;
  if (tileOf(down) !== lipC - sign || down.rk !== p.key || down.mode !== 'play' || down.dlg) {
    hopFail.push(`${where}: harness failed to place the player (at ${down.tx},${down.ty} in ${down.rk})`);
  } else if (beyond(tileOf(after)) && after.z === 0) hopOk++;
  else hopFail.push(`${where}: ${down.x0},${down.y0} -> ${after.x},${after.y} (tile ${after.tx},${after.ty}, z ${after.z})`);

  // --- uphill: walk into the same lip from the low side, expect to be refused
  const up0 = await place(at, mx + p.ux, my + p.uy, OPP[p.dir]);
  await page.keyboard.down(KEY[OPP[p.dir]]);
  await step(22);
  await page.keyboard.up(KEY[OPP[p.dir]]);
  await step(4);
  const up = await page.evaluate(() => ({
    tx: Math.floor((window.__game.player.x + 8) / 16),
    ty: Math.floor((window.__game.player.y + 8) / 16),
  }));
  if (tileOf(up0) !== lipC + sign || up0.rk !== p.key || up0.mode !== 'play' || up0.dlg) {
    blockFail.push(`${where}: harness failed to place the player (at ${up0.tx},${up0.ty})`);
  } else if (beyond(tileOf(up))) blockOk++;
  else blockFail.push(`${where}: walked up onto/past the lip (tile ${up.tx},${up.ty})`);
}
check(`every ledge run hops downhill (${hopOk}/${placements.length})`, hopFail.length === 0, hopFail.slice(0, 6).join(' | '));
check(`every ledge run blocks uphill (${blockOk}/${placements.length})`, blockFail.length === 0, blockFail.slice(0, 6).join(' | '));

check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));

console.log(`\n=== ${passed} passed, ${failures.length} failed ===`);
for (const f of failures) console.log('  ' + f);
await browser.close(); server.close();
process.exit(failures.length ? 1 : 0);
