// The per-cell reachability flood for one dungeon interior — every locked
// door counted against the dungeon's own key supply, the boss door counted
// against its Boss Key, every one-way ledge, every puzzle-opened door and
// gust-wheel sill and kelp snarl, the Dredge Line's mooring cast, and the
// Kelp-Soled Cleats' swim, all taught in exactly one place.
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
import { F } from '../../src/world/tileset.js';
import { DREDGE_RANGE } from '../../src/data/feel.js';
import { tileWalkable, ROUTE_AVOID } from './collision.mjs';

const SW = 10, SH = 8;
const DREDGE_TILES = Math.floor(DREDGE_RANGE / 16);

// A room declares one sill or a list of them; normalise before reading.
function sillsOf(def) {
  return !def.bellowsRoom ? [] : (Array.isArray(def.bellowsRoom) ? def.bellowsRoom : [def.bellowsRoom]);
}

/**
 * Flood one dungeon map from its start room.
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
export function floodDungeon(mapId) {
  const m = MAPS.get(mapId);

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

  const ROOMS = new Map();
  for (const rk of Object.keys(m.roomDefs)) {
    const [f0, rx0, ry0] = rk.split(',').map(Number);
    ROOMS.set(rk, getRoom(mapId, f0, rx0, ry0));
  }

  // Passable if walkable at ANY tide level — the player controls the tide.
  // AND FROM D3 ONWARD THE PLAYER CAN SWIM (the Kelp-Soled Cleats). Off for
  // d1/d2, where the player provably does not have them yet.
  const canSwim = (m.dungeon.index | 0) >= 3;
  const CAPS = { jumping: false, swim: canSwim, cutting: false };
  const walkableAt = (room, x, y, t) => {
    if (room.flagsAt(x, y, t) & F.STAIRS) return true;
    return tileWalkable(room, x, y, t, CAPS, ROUTE_AVOID);
  };
  const passable = (room, x, y) => [0, 1, 2].some(t => walkableAt(room, x, y, t));

  // Roc's Feather-style crossing: a DEEP/JUMPABLE tile hoppable at any tide.
  const jumpable = (room, x, y) => [0, 1, 2].some(t => room.flagsAt(x, y, t) & (F.DEEP | F.JUMPABLE));

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
  const snagAt = (room, x, y) => [0, 1, 2].some(t => room.flagsAt(x, y, t) & F.SNAG);
  const castStops = (room, x, y) => [0, 1, 2].every(t => room.flagsAt(x, y, t) & (F.SOLID | F.VOID));

  // A door a PUZZLE, a GUST WHEEL, or growing a coral pillar (a kelp snarl)
  // opens is not a wall — the flood cannot solve a puzzle, turn a wheel, or
  // grow a pillar; asserting each is actually achievable is solve-switches.mjs
  // / check-bellows.mjs / check-reefseed.mjs's job, not this flood's.
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
  // passable tile in the matching row/column.
  const seen = new Set();
  const lockedSeen = new Set();
  const q = [];
  const push = (rk, x, y) => {
    const k = rk + ':' + x + ',' + y;
    if (seen.has(k)) return;
    seen.add(k); q.push([rk, x, y]);
  };
  const sdD = dims.get(seedRoom);
  const sdRoom = ROOMS.get(seedRoom);
  for (let y = 0; y < sdD.H; y++) for (let x = 0; x < sdD.W; x++) if (passable(sdRoom, x, y)) push(seedRoom, x, y);

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
        const out = stepOut(rk, nx, ny);
        if (!out) continue;
        const [nk, tx, ty] = out;
        if (passable(ROOMS.get(nk), tx, ty)) push(nk, tx, ty);
      }
    }
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

  // The "floor universe": every cell the flood treats as a destination, once
  // any door it can pass through is open. Locked and boss doors are included
  // even when this particular flood never got a key to them — the leaky-lock
  // check (walk-dungeons.mjs part 2c) is what proves a lock actually gates
  // anything; this just needs to know the tile becomes floor once it does.
  const floorAt = (rk, x, y) => {
    const room = ROOMS.get(rk);
    if (!room) return false;
    return passable(room, x, y) || puzzleDoors.has(`${rk}:${x},${y}`)
      || isLock(room, x, y) || isBossDoor(room, x, y);
  };

  return {
    seen, dims, ROOMS, stepOut, warpsOut, floorAt,
    reachedRooms, missed, bossRoom: m.dungeon.bossRoom,
    bossReached: reachedRooms.has(m.dungeon.bossRoom), total: all.length,
  };
}
