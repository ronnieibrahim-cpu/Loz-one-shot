// The per-cell reachability flood for one dungeon interior — every locked
// door counted against the dungeon's own key supply, the boss door counted
// against its Boss Key, every one-way ledge, every puzzle-opened door and
// gust-wheel sill and kelp snarl, the Dredge Line's mooring cast, and the
// Kelp-Soled Cleats' swim, the Sunken Palace's whirlpools, all taught in
// exactly one place.
//
// This used to live only inside tools/walk-dungeons.mjs, which reduces it to
// room-level reachability. tools/check-dungeon-strands.mjs needs the same
// flood at CELL granularity — the same room-keyed blind spot check-strands.mjs
// already fixed for the overworld (CLAUDE.md: "A screen whose only reachable
// cells are the four tiles of a doorway is indistinguishable from a screen you
// can walk all of"). Extracting it here means the two tools ask the same
// question about the same graph instead of one of them silently drifting —
// see CLAUDE.md's own trap note: "a private model does not fail when the real
// rule changes under it — it just quietly starts being wrong."
//
// Plain Node, no browser. Call installData() before use — every caller
// already does, for its own reasons.

import { MAPS, getRoom } from '../../src/world/maps.js';
import { cellTiles } from '../../src/world/room.js';
import { F, transformFor, setToggleState, toggleState } from '../../src/world/tileset.js';
import { DREDGE_RANGE, COIN_THROW_SPEED, COIN_SETTLE_FRAMES } from '../../src/data/feel.js';
import { tileWalkable, ROUTE_AVOID, capsForDungeonIndex } from './collision.mjs';
import { floatSweep, floatStations } from '../../src/game/float-path.js';
import { drainedBase } from '../../src/game/tide.js';

const DREDGE_TILES = Math.floor(DREDGE_RANGE / 16);
// Where a thrown Ferryman's Coin comes down: its flight (speed x settle
// frames, in 8.8 subpixels) plus the six pixels it leaves the hand ahead of
// Link (`coin.use` in src/game/items.js), in whole tiles.
const COIN_TILES = Math.round((COIN_THROW_SPEED * COIN_SETTLE_FRAMES / 256 + 6) / 16);

// A room declares one sill or a list of them; normalise before reading.
function sillsOf(def) {
  return !def.bellowsRoom ? [] : (Array.isArray(def.bellowsRoom) ? def.bellowsRoom : [def.bellowsRoom]);
}

/**
 * Flood one dungeon map from its start room. `opts.whirl: false` floods as
 * if no whirlpool took anyone anywhere (tools/check-whirlpool.mjs asks it);
 * `opts.drop: false` as if no drop hole or cracked floor did, `opts.float:
 * false` as if no float ran (tools/check-floats.mjs), and
 * `opts.dropSkip: rk` as if room rk's did not (tools/check-shafts.mjs),
 * and `opts.gates: false` as if no sluice gate ever opened
 * (tools/check-sluices.mjs).
 *
 * A SEALED FLOOR (S184, the Cliffside Cistern's 2F) is flooded per sea. In
 * a `noTide` room the conch is refused, so the player is held at whatever
 * sea he walked in with: a cell there is a cell AT a sea, reached from the
 * cell beside it at the same sea, and the sea only changes back in a room
 * the conch is heard in. Every other room keeps the old rule, that a cell is
 * passable if it is at any sea. `seen` still holds 'rk:x,y' for every cell
 * reached at any sea; `seenSea` holds 'rk:x,y@t' for the sealed ones.
 *
 * A SLUICE GATE (S184) opens once the flood has stood in the room holding the
 * wheel whose sill `drains` its flag, the way a puzzle door opens once its
 * room is stood in; from then on its tank reads one under the sea
 * (`drainedBase`, the engine's own rule), and every sealed state is walked
 * again under the new water.
 *
 * Returns:
 *   seen         Set<'rk:x,y'>  every cell the flood actually stood on
 *   dims         Map<rk, {f,rx,ry,sw,sh,W,H}>
 *   ROOMS        Map<rk, Room>  the engine's own Room instances
 *   stepOut(rk,nx,ny) -> [rk,x,y]|null   step off rk's own screen extent,
 *                landing in whichever room owns the cell beyond it (handles a
 *                size:[w,h]>1x1 room's seam the same way the flood itself does)
 *   warpsOut     Map<'rk:x,y', 'rk:x,y'>   stairs/floor warps, one-directional
 *   floorAt(rk,x,y) -> bool   the "floor universe": every cell the flood ever
 *                treats as a destination — ordinary passable floor, a puzzle-
 *                /wheel-/snarl-opened door, or a lock/boss door (which the
 *                engine swaps to `dDoorOpen` once its key is spent, so once
 *                open it IS floor). This is the set a strand checker asks
 *                about; `seen` is the subset of it this flood actually
 *                reached.
 *   reachedRooms Set<rk>
 *   missed       string[]  room keys never reached
 *   bossReached  bool
 *   total        number
 */
export function floodDungeon(mapId, opts = {}) {
  const m = MAPS.get(mapId);
  // Tiles per map cell: the screen, or an Oracle room. The engine's own rule.
  const [SW, SH] = cellTiles(m);

  // The dungeon that hands the Dredge Line over, found rather than written
  // down, so a future consolidation moving it needs no edit here.
  let DREDGE_INDEX = 99;
  for (const m0 of MAPS.values()) {
    if (m0.dungeon && m0.dungeon.item === 'dredge') DREDGE_INDEX = Math.min(DREDGE_INDEX, m0.dungeon.index | 0);
  }

  const sizeOf = (rk) => { const sz = (m.roomDefs[rk].size) || [1, 1]; return [sz[0] | 0, sz[1] | 0]; };
  const dims = new Map();                 // rk -> {rx, ry, sw, sh, W, H}
  const owner = new Map();                // 'f,cx,cy' -> rk
  for (const rk of Object.keys(m.roomDefs)) {
    const [f0, rx0, ry0] = rk.split(',').map(Number);
    const [sw0, sh0] = sizeOf(rk);
    dims.set(rk, { f: f0, rx: rx0, ry: ry0, sw: sw0, sh: sh0, W: sw0 * SW, H: sh0 * SH });
    for (let j = 0; j < sh0; j++) for (let i = 0; i < sw0; i++) owner.set(`${f0},${rx0 + i},${ry0 + j}`, rk);
  }
  const stepOut = (rk, nx, ny) => {
    const D = dims.get(rk);
    const gx = D.rx * SW + nx, gy = D.ry * SH + ny;
    const nrk = owner.get(`${D.f},${Math.floor(gx / SW)},${Math.floor(gy / SH)}`);
    if (!nrk) return null;
    const N = dims.get(nrk);
    return [nrk, gx - N.rx * SW, gy - N.ry * SH];
  };

  // THE OTHER SIDE OF A DOOR IN AN ORACLE WALL RING. A key door there is one
  // door drawn by both rooms (`Game.openDoorAt`), so opening it — by a key, a
  // puzzle or anything else — opens the tile across the seam too, for free.
  // Null anywhere but a ring cell of an Oracle-size room.
  const partnerOf = (rk, x, y) => {
    if (SW !== 15) return null;
    const D = dims.get(rk);
    let ox = x, oy = y;
    if (y === 0) oy = -1; else if (y === D.H - 1) oy = D.H;
    else if (x === 0) ox = -1; else if (x === D.W - 1) ox = D.W;
    else return null;
    return stepOut(rk, ox, oy);
  };

  const ROOMS = new Map();
  for (const rk of Object.keys(m.roomDefs)) {
    const [f0, rx0, ry0] = rk.split(',').map(Number);
    ROOMS.set(rk, getRoom(mapId, f0, rx0, ry0));
  }

  // Passable if walkable at ANY tide level — the player controls the tide.
  // AND FROM D3 ONWARD THE PLAYER CAN SWIM (the Kelp-Soled Cleats). Off for
  // d1/d2, where the player provably does not have them yet.
  const CAPS = capsForDungeonIndex(m.dungeon.index);
  // AND AT EITHER STATE OF THE RED AND BLUE BLOCKS (S205): every tide change
  // flips them, so the player controls them exactly as he controls the sea,
  // and this upper bound takes both. Which state a route needs WHEN is
  // tools/check-toggles.mjs's to prove.
  const walkableAt = (room, x, y, t) => {
    const was = toggleState();
    try {
      for (const p of [0, 1]) {
        setToggleState(p);
        if (room.flagsAt(x, y, t) & F.STAIRS) return true;
        if (tileWalkable(room, x, y, t, CAPS, ROUTE_AVOID)) return true;
      }
      return false;
    } finally { setToggleState(was); }
  };
  const passable = (room, x, y) => [0, 1, 2].some(t => walkableAt(room, x, y, t));

  // The sealed floor and its gates.
  const sealed = (rk) => !!m.roomDefs[rk].noTide;
  const gateRoom = new Map();          // flag -> the room whose wheel drains it
  for (const [rk, def] of Object.entries(m.roomDefs)) {
    for (const B of sillsOf(def)) if (B.drains) gateRoom.set(B.drains, rk);
  }
  const gateFlags = {};                // the flags of every gate opened so far
  const levelOf = (rk, x, y, t) => drainedBase(m.roomDefs[rk], t, x, y, { flags: gateFlags });
  const passAt = (rk, x, y, t) => walkableAt(ROOMS.get(rk), x, y, levelOf(rk, x, y, t));

  // NO HOP (S162). This flood hopped a one-tile DEEP/JUMPABLE gap, a
  // Roc's-Feather move the game no longer has (nothing calls
  // `Player.startJump`): a one-wide sump in the Lower Vault, which the engine
  // refuses at every sea, read as walkable here. check-anchor dropped the
  // same phantom hop in the same session.

  // A one-way ledge is traversal: walking into its FACE clears the lip (plus
  // any further ledge tiles behind it) and lands on the first standable tile
  // past them. Directional, so it adds no route back.
  const ledgeDir = (room, x, y) => {
    for (const t of [0, 1, 2]) { const d = room.tile(x, y, t); if (d.flags & F.LEDGE) return d.ledge || null; }
    return null;
  };
  const DIR_OF = { '1,0': 'right', '-1,0': 'left', '0,1': 'down', '0,-1': 'up' };

  // A mooring is traversal too: the Dredge Line snags a post and hauls the
  // player to it, crossing a chasm wider than a hop. On from the dungeon that
  // hands the line over, off before it — the same rule as the Cleats above.
  const canDredge = (m.dungeon.index | 0) >= DREDGE_INDEX;

  // THE FERRYMAN'S COIN IS TRAVERSAL (S160), in a dungeon that says it is
  // built on it (`dungeon.coin`): thrown, it flies COIN_TILES over anything a
  // flier crosses — a chasm, deep water — and stops at a wall; on the next
  // tide change Link and the coin trade places. So a cell four tiles along a
  // clear line is reachable if, at some sea L, nothing on the line is solid,
  // the landing is somewhere the coin can rest (standable at L) and somewhere
  // Link can stand when he arrives, one conch step later ((L + 1) % 3). The
  // main dungeons do not declare it: the coin comes at three Essences, and
  // whether it breaks D4-D6 open is a question this flood does not ask of
  // them. tools/check-coin.mjs proves each crossing in the engine.
  const canCoin = !!m.dungeon.coin;
  const flierBlocked = (room, x, y, t) => !!(room.flagsAt(x, y, t) & F.SOLID);
  const snagAt = (room, x, y) => [0, 1, 2].some(t => room.flagsAt(x, y, t) & F.SNAG);
  const castStops = (room, x, y) => [0, 1, 2].every(t => room.flagsAt(x, y, t) & (F.SOLID | F.VOID));

  // A door a PUZZLE, a GUST WHEEL, or growing a coral pillar (a kelp snarl)
  // opens is not a wall — the flood cannot solve a puzzle, turn a wheel, or
  // grow a pillar; asserting each is actually achievable is solve-switches.mjs
  // / check-bellows.mjs / check-reefseed.mjs's job, not this flood's.
  //
  // A PUZZLE IS SOLVED IN ITS OWN ROOM (S181). Each door remembers the room
  // whose puzzle opens it, and is only a way through once the flood has stood
  // in that room: the Drain Weir's shutter opens from the Drain Weir, and
  // before this the flood walked in through it from the Pens. A door that is
  // met before its room is reached waits in `puzzleWait` and is released by
  // the same outer loop that spends keys.
  const puzzleOwner = new Map();   // 'rk:x,y' -> the room whose puzzle opens it
  for (const [rk, def] of Object.entries(m.roomDefs)) {
    for (const [dx0, dy0] of def.puzzle?.reward?.openDoors || []) puzzleOwner.set(`${rk}:${dx0},${dy0}`, rk);
    // A door in ANOTHER room (S182, the Sump's plate and the Undertow's west
    // door): still opened by standing in THIS room.
    for (const [ork, dx0, dy0] of def.puzzle?.reward?.openDoorsIn || []) puzzleOwner.set(`${ork}:${dx0},${dy0}`, rk);
    for (const B of sillsOf(def)) {
      for (const [dx0, dy0] of B.opens || []) puzzleOwner.set(`${rk}:${dx0},${dy0}`, rk);
    }
    if (def.reefseedRoom && def.reefseedRoom.snarl) {
      const [sx0, sy0] = def.reefseedRoom.snarl;
      puzzleOwner.set(`${rk}:${sx0},${sy0}`, rk);
    }
  }
  for (const [k, own] of [...puzzleOwner]) {
    const [rk0, xy0] = k.split(':');
    const [x0, y0] = xy0.split(',').map(Number);
    const p0 = partnerOf(rk0, x0, y0);
    if (p0) puzzleOwner.set(`${p0[0]}:${p0[1]},${p0[2]}`, own);
  }
  const puzzleDoors = new Set(puzzleOwner.keys());
  const roomsStood = new Set();
  const puzzleWait = new Set();
  // Is this puzzle door open to a flood that has stood in `roomsStood`? A door
  // that is not, but will be, is remembered for the outer loop.
  const puzzleOpen = (rk, x, y, t) => {
    const k = `${rk}:${x},${y}`;
    const own = puzzleOwner.get(k);
    if (own == null) return false;
    if (roomsStood.has(own)) return true;
    puzzleWait.add(k + '|' + (t == null ? '' : t));
    return false;
  };
  // FIRE IS TRAVERSAL TOO (S160). Drift-tangle and the Salt Pan's dry kelp
  // burn, and burnt they are floor — the Kilnshell's movement verb. The shell
  // comes out of the Reef Hollow on foot with nothing but the conch, so every
  // dungeon's player holds it; a tile that burns at ANY sea is a way through
  // (the kelp only at LOW, which the player can always sound). Whether the
  // fire can actually be GOT to it — thrown over a sump, carried into a damp
  // room — is tools/check-kiln.mjs's to prove, the way solve-switches proves a
  // puzzle door this flood already walks through.
  const burnable = (room, x, y) => [0, 1, 2].some(t => {
    const d = room.tile(x, y, t);
    return !!(transformFor(room.baseName(x, y), 'fire') || (d && transformFor(d.name, 'fire')));
  });
  // A DROP HOLE IS TRAVERSAL, AND SO IS A CRACKED FLOOR (S181, the Bogwater
  // Sanctum). A cell that is a drop hole at some sea (F.DROP: open at LOW,
  // sunk down with the Cleats when flooded) or a cracked floor (which becomes
  // one when stood on) takes the player to the same cell of the room directly
  // beneath, one floor down (`Game.dropThroughHole`) — if that cell is
  // somewhere he can land at some sea, and not a pit. Only down. The flood
  // steps INTO a hole from beside it, since at LOW the hole itself is not
  // standable. Which sea makes which hole land is tools/check-shafts.mjs's to
  // prove in the engine; this, like every clause here, asks only whether a
  // way exists at some sea — the Anchor is held from D1, so two floors at two
  // seas is always on the table.
  const dropAt = (room, x, y) => [0, 1, 2].some(t => {
    const d = room.tile(x, y, t);
    return !!((d.flags & F.DROP) || d.crack);
  });
  const landAt = (room, x, y) => x >= 0 && y >= 0 && x < room.tw && y < room.th
    && [0, 1, 2].some(t => !(room.flagsAt(x, y, t) & F.PIT) && walkableAt(room, x, y, t));
  const tryDrop = (rk, x, y) => {
    if (opts.drop === false || opts.dropSkip === rk) return;
    const D = dims.get(rk);
    if (!dropAt(ROOMS.get(rk), x, y)) return;
    const below = `${D.f - 1},${D.rx},${D.ry}`;
    if (m.roomDefs[below] && landAt(ROOMS.get(below), x, y)) push(below, x, y);
  };
  // A FLOAT IS TRAVERSAL (S183, the Cliffside Cistern). Seasons' moving
  // platform: board it from any cell beside the tiles it ever covers, and get
  // off onto any cell beside them — at its stops, or anywhere it can be
  // stopped (the conch from HIGH, the Bellows' cone on its race at MID). It
  // runs only while its race carries a current, so a float whose race never
  // does at any sea is no way across. Where it can actually be stopped, and
  // that a notch it passes needs stopping, is tools/check-floats.mjs's to prove.
  const floatsIn = new Map();   // rk -> [{ cells, edge }]
  for (const [rk, def] of Object.entries(m.roomDefs)) {
    const room = ROOMS.get(rk);
    for (const e of def.entities || []) {
      if (e[0] !== 'float') continue;
      const o = e[3] || {};
      if (o.race && ![0, 1, 2].some(t => room.tile(o.race[0], o.race[1], t).push)) continue;
      const cells = floatSweep(e[1], e[2], o.path);
      const stations = floatStations(e[1], e[2], o.path);
      const edge = [];
      for (const c of cells) {
        const [cx, cy] = c.split(',').map(Number);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const k = (cx + dx) + ',' + (cy + dy);
          if (!cells.has(k)) edge.push([cx + dx, cy + dy]);
        }
      }
      if (!floatsIn.has(rk)) floatsIn.set(rk, []);
      const near = (set, [ex, ey]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => set.has((ex + dx) + ',' + (ey + dy)));
      floatsIn.get(rk).push({ cells, edge, race: o.race, station: edge.filter(c => stations.some(st => near(st, c))) });
    }
  }
  // ON A SEALED FLOOR a float is a way across only at a sea its race runs
  // at, and a rider gets off where it waits — or anywhere along it if the
  // Bellows' cone on its race (one level under, on top of any gate) stops
  // it there. The conch cannot brake it up here; that is the Float Tank.
  const raceRuns = (rk, race, t) => race == null
    || !!ROOMS.get(rk).tile(race[0], race[1], t < 0 ? 0 : t).push;
  const tryFloat = (rk, x, y, t) => {
    if (opts.float === false) return;
    for (const fl of floatsIn.get(rk) || []) {
      if (!fl.edge.some(([ex, ey]) => ex === x && ey === y)) continue;
      const room = ROOMS.get(rk);
      if (t == null) {
        for (const [ex, ey] of fl.edge) if (ex >= 0 && ey >= 0 && ex < room.tw && ey < room.th && passable(room, ex, ey)) push(rk, ex, ey);
        continue;
      }
      const lv = fl.race ? levelOf(rk, fl.race[0], fl.race[1], t) : t;
      if (!raceRuns(rk, fl.race, lv)) continue;
      const brakes = !raceRuns(rk, fl.race, lv - 1);
      for (const [ex, ey] of brakes ? fl.edge : fl.station) {
        if (ex >= 0 && ey >= 0 && ex < room.tw && ey < room.th && passAt(rk, ex, ey, t)) push(rk, ex, ey, t);
      }
    }
  };
  const isLock = (room, x, y) => room.baseName(x, y) === 'dDoorLocked';
  const isBossDoor = (room, x, y) => room.baseName(x, y) === 'dDoorBoss';

  // Floors are joined by warps, not just seams.
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

  // Count keys available in the whole dungeon, spent as doors are opened. A
  // chest hands one over in three different shapes; a gust wheel and a buried
  // cache in two more. See tools/walk-dungeons.mjs for the fault history.
  let keys = 0;
  for (const def of Object.values(m.roomDefs)) {
    for (const e of def.entities || []) {
      const o = e[3] || {};
      if (e[0] === 'pickup' && o.kind === 'key') keys++;
      if (e[0] === 'chest' && (o.item === 'key' || o.pickup === 'key')) keys++;
    }
    for (const s of def.puzzle?.reward?.spawn || []) if (s[3] && s[3].kind === 'key') keys++;
    for (const B of sillsOf(def)) if (B.gives === 'key') keys++;
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
  // passable tile in the matching row/column. A queued state is [rk, x, y, t]:
  // t is the sea in a sealed room and null everywhere else.
  const seen = new Set();
  const seenSea = new Set();
  const lockedSeen = new Set();        // 'rk:x,y|t' or 'rk:x,y|t|boss'
  const opened = new Set();            // locks a key has been spent on
  const q = [];
  let regate = false;
  const stand = (rk) => {
    if (roomsStood.has(rk)) return;
    roomsStood.add(rk);
    if (opts.gates === false) return;
    for (const [fl, wr] of gateRoom) if (wr === rk && !gateFlags[fl]) { gateFlags[fl] = true; regate = true; }
  };
  const push = (rk, x, y, t) => {
    if (sealed(rk)) {
      if (t == null) {
        // Into the sealed floor from a room the conch is heard in: at any sea
        // the cell can be stood at (a doorway, at all three).
        let ts = [0, 1, 2].filter(s => passAt(rk, x, y, s));
        if (!ts.length) ts = [0, 1, 2];
        for (const s of ts) push(rk, x, y, s);
        return;
      }
      const ks = rk + ':' + x + ',' + y + '@' + t;
      if (seenSea.has(ks)) return;
      seenSea.add(ks); seen.add(rk + ':' + x + ',' + y); q.push([rk, x, y, t]);
      stand(rk);
      return;
    }
    const k = rk + ':' + x + ',' + y;
    if (seen.has(k)) return;
    seen.add(k); q.push([rk, x, y, null]);
    stand(rk);
  };
  const sdD = dims.get(seedRoom);
  const sdRoom = ROOMS.get(seedRoom);
  for (let y = 0; y < sdD.H; y++) for (let x = 0; x < sdD.W; x++) if (passable(sdRoom, x, y)) push(seedRoom, x, y);

  let progress = true;
  while (progress) {
    progress = false;
    while (q.length) {
      const [rk, x, y, t] = q.pop();
      const room = ROOMS.get(rk);
      // The sea carried into the next cell: kept between two sealed rooms,
      // let go of anywhere the conch is heard.
      const seaTo = (rk2) => (t != null && sealed(rk2) ? t : null);
      const pass = (rk2, nx, ny) => (t != null && sealed(rk2)
        ? passAt(rk2, nx, ny, t) : passable(ROOMS.get(rk2), nx, ny));
      const w = warpsOut.get(rk + ':' + x + ',' + y);
      if (w) { const [wrk, wxy] = w.split(':'); const [wx, wy] = wxy.split(',').map(Number); push(wrk, wx, wy, seaTo(wrk)); }
      const D = dims.get(rk);
      const W = D.W, H = D.H;
      // A WHIRLPOOL IS TRAVERSAL (S161, the Sunken Palace): a cell that is a
      // whirlpool at some sea takes the player to the same cell of the room
      // directly beneath, one floor down (`Game.enterWhirlpool`). Only down:
      // the way back up is a stair. tools/check-whirlpool.mjs proves each one.
      if (opts.whirl !== false && [0, 1, 2].some(s => room.flagsAt(x, y, s) & F.WHIRL)) {
        const below = `${D.f - 1},${D.rx},${D.ry}`;
        if (m.roomDefs[below]) push(below, x, y);
      }
      tryDrop(rk, x, y);
      tryFloat(rk, x, y, t);
      if (canCoin) {
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const lx = x + dx * COIN_TILES, ly = y + dy * COIN_TILES;
          if (lx < 0 || ly < 0 || lx >= W || ly >= H) continue;
          for (const s of [0, 1, 2]) {
            let clear = true;
            for (let n = 1; n < COIN_TILES && clear; n++) if (flierBlocked(room, x + dx * n, y + dy * n, s)) clear = false;
            if (clear && walkableAt(room, lx, ly, s) && walkableAt(room, lx, ly, (s + 1) % 3)) { push(rk, lx, ly); break; }
          }
        }
      }
      if (canDredge) {
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          for (let n = 1; n <= DREDGE_TILES; n++) {
            const cx = x + dx * n, cy = y + dy * n;
            if (cx < 0 || cy < 0 || cx >= W || cy >= H) break;
            if (snagAt(room, cx, cy)) {
              const lx = cx - dx, ly = cy - dy;
              if (lx !== x || ly !== y) push(rk, lx, ly, t);
              break;
            }
            if (castStops(room, cx, cy)) break;
          }
        }
      }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < W && ny < H) {
          tryDrop(rk, nx, ny);
          if (pass(rk, nx, ny) || puzzleOpen(rk, nx, ny, t) || burnable(room, nx, ny)) push(rk, nx, ny, t);
          else if (ledgeDir(room, nx, ny) === DIR_OF[dx + ',' + dy]) {
            let n = 1;
            while (n < 3) {
              const cx = nx + dx * n, cy = ny + dy * n;
              if (cx < 0 || cy < 0 || cx >= W || cy >= H || !ledgeDir(room, cx, cy)) break;
              n++;
            }
            const lx = nx + dx * n, ly = ny + dy * n;
            if (lx >= 0 && ly >= 0 && lx < W && ly < H && pass(rk, lx, ly)) push(rk, lx, ly, t);
          }
          else if (isLock(room, nx, ny)) lockedSeen.add(rk + ':' + nx + ',' + ny + '|' + (t == null ? '' : t));
          else if (isBossDoor(room, nx, ny) && bossKey) lockedSeen.add(rk + ':' + nx + ',' + ny + '|' + (t == null ? '' : t) + '|boss');
          continue;
        }
        const out = stepOut(rk, nx, ny);
        if (!out) continue;
        const [nk, tx, ty] = out;
        if (pass(nk, tx, ty) || puzzleOpen(nk, tx, ty, seaTo(nk)) || burnable(ROOMS.get(nk), tx, ty)) push(nk, tx, ty, seaTo(nk));
      }
    }
    // A gate that has just opened changes the water under every sealed
    // state already walked: walk them all again.
    if (regate) {
      regate = false;
      for (const ks of seenSea) {
        const [rk0, rest] = ks.split(':');
        const [xy0, t0] = rest.split('@');
        const [x0, y0] = xy0.split(',').map(Number);
        q.push([rk0, x0, y0, Number(t0)]);
      }
      progress = true;
      continue;
    }
    // A puzzle door whose room the flood has now stood in is open: step
    // through it from whichever side met it.
    for (const kw of [...puzzleWait]) {
      const [k, ts] = kw.split('|');
      const [rk0, xy0] = k.split(':');
      if (!roomsStood.has(puzzleOwner.get(k))) continue;
      puzzleWait.delete(kw);
      const [x0, y0] = xy0.split(',').map(Number);
      const t0 = ts === '' ? null : Number(ts);
      const was = t0 == null || !sealed(rk0) ? seen.has(k) : seenSea.has(k + '@' + t0);
      if (!was) { push(rk0, x0, y0, sealed(rk0) ? t0 : null); progress = true; }
    }
    if (progress) continue;
    for (const l of lockedSeen) {
      const [k, ts, boss] = l.split('|');
      const isBoss = boss === 'boss';
      const [rk, xy] = k.split(':');
      const [x, y] = xy.split(',').map(Number);
      const t0 = ts === '' ? null : Number(ts);
      const was = t0 == null || !sealed(rk) ? seen.has(k) : seenSea.has(k + '@' + t0);
      if (was) { lockedSeen.delete(l); continue; }
      if (!isBoss && !opened.has(k)) {
        if (keys <= 0) continue;
        keys--;
        opened.add(k);
        const pr0 = partnerOf(rk, x, y);
        if (pr0) opened.add(`${pr0[0]}:${pr0[1]},${pr0[2]}`);
      }
      push(rk, x, y, sealed(rk) ? t0 : null);
      const pr = partnerOf(rk, x, y);
      if (pr) {
        const pd = ROOMS.get(pr[0]);
        if (isLock(pd, pr[1], pr[2]) || isBossDoor(pd, pr[1], pr[2])) {
          push(pr[0], pr[1], pr[2], t0 != null && sealed(pr[0]) ? t0 : null);
        }
      }
      lockedSeen.delete(l);
      progress = true;
      break;
    }
  }

  const reachedRooms = new Set([...seen].map(k => k.split(':')[0]));
  const all = Object.keys(m.roomDefs);
  const missed = all.filter(r => !reachedRooms.has(r));

  // The "floor universe": every cell the flood treats as a destination, once
  // any door it can pass through is open. Locked and boss doors are included
  // even when this particular flood never got a key to them — the leaky-lock
  // check (walk-dungeons.mjs part 2c) is what proves a lock actually gates
  // anything; this just needs to know the tile becomes floor once it does.
  const floorAt = (rk, x, y) => {
    const room = ROOMS.get(rk);
    if (!room) return false;
    return passable(room, x, y) || puzzleDoors.has(`${rk}:${x},${y}`) || burnable(room, x, y)
      || isLock(room, x, y) || isBossDoor(room, x, y);
  };

  return {
    seen, seenSea, dims, ROOMS, stepOut, warpsOut, floorAt, gateFlags,
    reachedRooms, missed, bossRoom: m.dungeon.bossRoom,
    bossReached: reachedRooms.has(m.dungeon.bossRoom), total: all.length,
  };
}
