// Brineglass Lens prover. Runs in plain Node (no DOM, no browser) against the
// game's own data modules and feel constants. Modelled on check-anchor.mjs and
// deliberately the same shape: one state-space flood, both directions proved,
// every reach read out of feel.js rather than written down here.
//
// WHY THIS TOOL IS NOT check-anchor WITH THE NOUNS CHANGED
//
// The Anchor makes a tile passable, so an anchor gate is proved by "no conch
// crosses this, one placement does". The Lens makes NOTHING passable — it is
// informational and P9 forbids it ever being a gate — so there is no
// arrangement of terrain the Lens gets you through and the conch does not.
// Proving "the Lens is required" therefore cannot be a reachability claim about
// the item at all. It is a claim about INFORMATION:
//
//   the room forces a choice that cannot be taken back, and which branch is
//   the right one is not visible at the level the choice is made at.
//
// That is what this tool proves, in the three parts docs/EXECUTION-PLAN.md
// specifies under "D2 decision", plus the two the rooms turned out to need:
//
//   1. the decision tile is one-way — from inside a branch, the tile the
//      player chose from is unreachable at every tide level;
//   2. at least one branch is a dead end at the level it resolves to, and
//      exactly one is not;
//   3. which branch is which is NOT determinable at the deciding level: the
//      branch regions must render IDENTICALLY there — same art, same palette,
//      same flags, same animation — and must differ at the level the commit
//      resolves to;
//   4. the commit cannot be scouted: the room pins the tide (`tideForce`) so
//      the choice is always made at one level, and refuses the conch
//      (`noTide`) so a wrong branch cannot be undone where you stand;
//   5. a wrong branch is a cost, never a softlock: from every branch, at the
//      level it resolves to, some way out of the room is still reachable.
//
// AND THE ONE THAT TIES IT TO THE ITEM. `Game.drawLensGhost` previews level
// `(tide.level + 1) % TIDE_COUNT`. The plate in the sump steps the sea exactly
// once. So `resolve === (at + 1) % TIDE_COUNT` is not bookkeeping: it is the
// assertion that the thing the Lens draws is precisely the thing the commit
// produces. Break that and the room still works and the Lens stops answering
// it, which is the failure no other checker in the repo can see.
//
// THE MODEL, and where its edges are
//
//   * A state is a tile. The level is FIXED per flood — that is the whole
//     point of these rooms, and it is why this tool does not carry
//     check-anchor's "sound the conch where the ground survives it" rule: in a
//     room with `noTide` there is no conch, and assertion 4 is what proves the
//     room really is one of those.
//   * A one-way ledge is crossed in its own direction only, exactly as
//     `Player.tryLedgeHop` does it: walk into the face of the lip, clear the
//     whole run of ledge tiles behind it, land on the first tile past it, and
//     the landing must be standable. Nothing crosses a lip the other way,
//     which is what makes a commit a commit.
//   * A hop clears up to HOP_TILES of anything that is not SOLID. Same
//     arithmetic as check-anchor, same reason: a jump's reach is a function of
//     WALK_SPEED and moves whenever that does.
//   * NO SWIMMING. The Kelp-Soled Cleats are the D3 item, so deep water is a
//     wall here. The assertion about which dungeons may declare a lens room is
//     what will catch the first D3+ room that needs this relaxed.
//
// Usage: node tools/check-lens.mjs [--verbose]

import { MAPS } from '../src/world/maps.js';
import { getLegend } from '../src/world/room.js';
import { F, getTileDef } from '../src/world/tileset.js';
import { installData } from '../src/data/index.js';
import { JUMP_POWER, JUMP_GRAVITY, WALK_SPEED } from '../src/data/feel.js';

installData();

const VERBOSE = process.argv.includes('--verbose');
const LEVELS = [0, 1, 2];
const LEVEL_NAME = ['LOW', 'MID', 'HIGH'];
const TIDE_COUNT = 3;

let passed = 0; const failures = [];
function check(name, cond, detail) {
  if (cond) { passed++; console.log('  ok   ' + name); }
  else { failures.push(name + (detail ? ' — ' + detail : '')); console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); }
}

// The hop, derived rather than remembered. Identical to check-anchor.mjs.
const HOP_PX = (2 * JUMP_POWER / JUMP_GRAVITY) * (WALK_SPEED / 256);
const HOP_TILES = Math.floor(HOP_PX / 16);
console.log(`  hop reach ${HOP_PX.toFixed(1)}px (${HOP_TILES} whole tiles)`);

// --- tiles ------------------------------------------------------------------
function defAt(legend, ch, level) {
  let d = getTileDef(legend[ch]);
  for (let i = 0; i < 4 && d && d.tide; i++) d = getTileDef(d.tide[level]);
  return d;
}

/** Walkable on foot, with no swimming and nothing equipped. */
function walkableDef(d) {
  if (!d) return false;
  if (d.flags & F.STAIRS) return true;
  return !(d.flags & (F.VOID | F.SOLID | F.PIT | F.DEEP | F.LEDGE | F.HAZARD));
}

/** A hop passes over anything that is not a wall. */
function hoppableDef(d) {
  return !!d && !(d.flags & (F.VOID | F.SOLID));
}

/**
 * What a tile LOOKS LIKE once the tide has resolved it. Two tide tiles that
 * come out here equal are the same pixels on screen at that level: `dSluice`
 * and `dDrain` at HIGH are both deep water and a player cannot tell them
 * apart, which is the entire mechanism these rooms run on. Compared by
 * appearance rather than by tile NAME on purpose — the name is exactly the
 * thing the player cannot see.
 */
function appearance(legend, ch, level) {
  const d = defAt(legend, ch, level);
  if (!d) return 'MISSING:' + ch;
  return [d.art, d.pal, d.flags | 0, (d.anim || []).join('/'), d.animRate | 0,
    (d.push || []).join('/'), d.underArt || ''].join('|');
}

// --- the flood --------------------------------------------------------------
/**
 * Every tile reachable on foot from `start` with the sea at `level`, obeying
 * one-way ledges. Returns a Set of 'x,y'.
 */
function flood(room, start, level, block = null) {
  const { grid, legend, W, H } = room;
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? null : defAt(legend, grid[y][x], level));
  const blocked = (x, y) => !!block && block[0] === x && block[1] === y;
  const walk = (x, y) => !blocked(x, y) && walkableDef(at(x, y));
  const seen = new Set(), q = [];
  const push = (x, y) => {
    const k = x + ',' + y;
    if (seen.has(k)) return;
    seen.add(k); q.push([x, y]);
  };
  if (!walk(start[0], start[1])) return seen;
  push(start[0], start[1]);
  while (q.length) {
    const [x, y] = q.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (walk(nx, ny)) { push(nx, ny); continue; }
      const d = at(nx, ny);
      // A ledge, walked into from the uphill side: clear the whole run and
      // land past it. Player.tryLedgeHop, in three lines.
      if (d && (d.flags & F.LEDGE) && d.ledge === dirName(dx, dy)) {
        let n = 1;
        while (n < 8) {
          const dd = at(x + dx * (n + 1), y + dy * (n + 1));
          if (!dd || !(dd.flags & F.LEDGE)) break;
          n++;
        }
        const lx = x + dx * (n + 1), ly = y + dy * (n + 1);
        if (walk(lx, ly)) push(lx, ly);
        continue;
      }
      // Roc's Feather over a gap, deep water or a pit — never over a wall.
      for (let n = 1; n <= HOP_TILES; n++) {
        let clear = true;
        for (let i = 1; i <= n; i++) if (!hoppableDef(at(x + dx * i, y + dy * i))) { clear = false; break; }
        if (!clear) break;
        if (walk(x + dx * (n + 1), y + dy * (n + 1))) push(x + dx * (n + 1), y + dy * (n + 1));
      }
    }
  }
  return seen;
}

const dirName = (dx, dy) => (dx ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down'));
const has = (seen, [x, y]) => seen.has(x + ',' + y);

// --- collect the declared rooms --------------------------------------------
const rooms = [];
for (const [mapId, m] of MAPS) {
  for (const [key, def] of Object.entries(m.roomDefs || {})) {
    if (!def.lensRoom) continue;
    const sz = def.size || [1, 1];
    rooms.push({
      mapId, key, name: def.name || key, kind: m.kind,
      W: (sz[0] | 0) * 10, H: (sz[1] | 0) * 8,
      grid: def.map, legend: getLegend(def.legend || m.legend), def,
      L: def.lensRoom,
    });
  }
}

check('at least one room declares a lens room', rooms.length > 0, 'nothing to prove');
// The model cannot swim, so it is only sound before the Cleats. And the Lens
// is never a gate at region scope — an overworld screen must never declare one.
const late = rooms.filter(r => !['d1', 'd2'].includes(r.mapId));
check('every declared lens room is in a pre-Cleats dungeon', late.length === 0,
  late.map(r => `${r.mapId} ${r.key}`).join(', ') + ' — teach this tool to swim first');
const outdoors = rooms.filter(r => r.kind !== 'dungeon');
check('no overworld screen declares a lens room', outdoors.length === 0,
  outdoors.map(r => `${r.mapId} ${r.key}`).join(', ') + ' — the Lens is never a gate at region scope');

// --- per room ---------------------------------------------------------------
for (const r of rooms) {
  const where = `${r.mapId} ${r.key} (${r.name})`;
  const { at, decide, to, branches } = r.L;
  const resolve = (at + 1) % TIDE_COUNT;

  // 4. The commit cannot be scouted.
  check(`${where}: the room pins the tide at ${LEVEL_NAME[at]}`, r.def.tideForce === at,
    `tideForce is ${r.def.tideForce} — without it the player walks in at whatever level shows the answer`);
  check(`${where}: the conch is refused in it`, r.def.noTide === true,
    'without noTide the wrong branch is undone by one button press');

  // The linchpin: what the Lens draws is what the commit produces.
  check(`${where}: the Lens previews exactly the level the commit resolves to`,
    resolve === (at + 1) % TIDE_COUNT && r.L.resolve === resolve,
    `declared resolve ${r.L.resolve}, Lens shows ${resolve} — drawLensGhost previews (level + 1) % 3`);

  // The plate. Proved by CALLING the room's script, not by reading it: a
  // script that no longer steps the sea leaves every other assertion here true
  // and the room unsolvable.
  let stepped = false;
  const fake = {
    forceTideStep() { stepped = true; return true; },
    roomEvent() {}, say() {}, audio: { sfx() {}, jingle() {} },
  };
  if (r.def.script && r.def.script.onEvent) {
    r.def.script.onEvent(fake, 'switch', { pressed: true });
  }
  check(`${where}: pressing the plate steps the sea`, stepped,
    'the room script did not call forceTideStep on a switch press');

  const inRegion = (b, [x, y]) =>
    x >= b.region[0] && y >= b.region[1] && x <= b.region[2] && y <= b.region[3];
  for (const b of branches) {
    check(`${where}: ${b.name} has a plate on it`,
      (r.def.entities || []).some(e => e[0] === 'switch' && e[1] === b.plate[0] && e[2] === b.plate[1]),
      `no switch entity at ${b.plate} — nothing trips the sea in this branch`);
    check(`${where}: ${b.name}'s landing and plate are inside its region`,
      inRegion(b, b.land) && inRegion(b, b.plate),
      `land ${b.land} / plate ${b.plate} outside region ${b.region}`);
    // Same relative position in every branch, or the plate itself is the tell.
    const rel = (p) => [p[0] - b.region[0], p[1] - b.region[1]].join(',');
    const ref = branches[0];
    const refRel = (p) => [p[0] - ref.region[0], p[1] - ref.region[1]].join(',');
    check(`${where}: ${b.name}'s plate sits where every other branch's does`,
      rel(b.plate) === refRel(ref.plate) && rel(b.land) === refRel(ref.land),
      `plate at ${rel(b.plate)} vs ${refRel(ref.plate)}`);
  }

  // 1. One-way, at every level rather than only the two that matter: a branch
  //    you can climb out of at some other level is a branch you can scout from.
  for (const b of branches) {
    const back = LEVELS.filter(l => has(flood(r, b.land, l), decide));
    check(`${where}: ${b.name} cannot get back to the choice`, back.length === 0,
      'reaches the decision tile at ' + back.map(l => LEVEL_NAME[l]).join('/'));
  }

  // and the branches cannot reach each other, or the choice is not a choice.
  for (const b of branches) {
    const others = branches.filter(o => o !== b);
    const leak = [];
    for (const l of LEVELS) {
      const seen = flood(r, b.land, l);
      for (const o of others) if (has(seen, o.land)) leak.push(`${o.name}@${LEVEL_NAME[l]}`);
    }
    check(`${where}: ${b.name} is sealed from the other branches`, leak.length === 0, leak.join(', '));
  }

  // 2. Exactly one branch is progress at the level the commit resolves to.
  //
  // "Progress" is leaving the room ON FOOT — a tile on the room's edge — and
  // NOT the chute, which is a warp and goes backwards. Asking only whether the
  // declared `to` tile is reachable is not enough and this tool passed a
  // broken room to prove it: swap the trap sill for `dWell`, which is the same
  // deep water at HIGH but WADEABLE at LOW, and the losing sump opens onto its
  // own edge tile and out of the room. `to` is still asserted, because it is
  // the room's statement of which way is the intended one, but the claim with
  // teeth is the one below it.
  // Every tile a branch can leave the room by: a tile on the room's edge, or a
  // warp. Asking only whether the declared `to` tile is reachable is not
  // enough, and this tool passed a broken room to prove it — swap the trap
  // sill for `dWell`, the same deep water at HIGH but WADEABLE at LOW, and the
  // losing sump walks out of its own edge while `to` stays unreachable. It
  // also caught the room as first written: ONE tile of pit is not a barrier,
  // because the base moveset hops two, so the drain was a stride and the trap
  // was scenery.
  const waysOut = (b) => {
    const out = new Set();
    for (const k of flood(r, b.land, resolve)) {
      const [x, y] = k.split(',').map(Number);
      const d = defAt(r.legend, r.grid[y][x], resolve);
      if ((x === 0 || y === 0 || x === r.W - 1 || y === r.H - 1) || (d && (d.flags & (F.WARP | F.STAIRS)))) out.add(k);
    }
    return out;
  };
  const wins = branches.filter(b => has(flood(r, b.land, resolve), to));
  check(`${where}: exactly one branch reaches the way on at ${LEVEL_NAME[resolve]}`,
    wins.length === 1, wins.length ? 'these do: ' + wins.map(b => b.name).join(', ') : 'none of them does');
  check(`${where}: the rest are dead ends at ${LEVEL_NAME[resolve]}`,
    branches.length - wins.length >= 1, 'every branch is a way on — nothing is being chosen');
  for (const b of branches) {
    const want = new Set([b.back.join(',')]);
    if (b === wins[0]) want.add(to.join(','));
    const got = waysOut(b);
    const extra = [...got].filter(k => !want.has(k));
    const missing = [...want].filter(k => !got.has(k));
    check(`${where}: ${b.name} leaves the room by exactly ${[...want].join(' and ')}`,
      extra.length === 0 && missing.length === 0,
      (extra.length ? 'also by ' + extra.join(' ') : '') + (missing.length ? ' cannot reach ' + missing.join(' ') : ''));
  }

  // The plate is not optional in the branch that wins: with it treated as a
  // wall the way on must be out of reach, so the sea has always stepped by the
  // time the player leaves. A plate you can walk round is a commit room whose
  // commit never happens.
  for (const b of wins) {
    check(`${where}: ${b.name} cannot reach the way on without the plate`,
      !has(flood(r, b.land, resolve, b.plate), to),
      'there is a path round the plate');
  }

  // 3. THE ONE WITH TEETH. Identical at the deciding level, different after.
  const shape = (b) => [b.region[2] - b.region[0], b.region[3] - b.region[1]].join('x');
  const shapes = new Set(branches.map(shape));
  check(`${where}: the branch regions are the same shape`, shapes.size === 1, [...shapes].join(', '));
  const picture = (b, level) => {
    const out = [];
    for (let y = b.region[1]; y <= b.region[3]; y++) {
      for (let x = b.region[0]; x <= b.region[2]; x++) out.push(appearance(r.legend, r.grid[y][x], level));
    }
    return out.join(';');
  };
  if (shapes.size === 1) {
    const atPics = branches.map(b => picture(b, at));
    const same = atPics.every(p => p === atPics[0]);
    check(`${where}: the branches are indistinguishable at ${LEVEL_NAME[at]}`, same,
      'a player can read the answer off the tiles without the Lens');
    if (!same && VERBOSE) {
      for (let i = 0; i < branches.length; i++) console.log(`       ${branches[i].name}: ${atPics[i]}`);
    }
    const resPics = branches.map(b => picture(b, resolve));
    check(`${where}: and tell each other apart at ${LEVEL_NAME[resolve]}`,
      new Set(resPics).size > 1, 'the Lens would show the same picture for both');
  }

  // 5. A wrong branch is a cost, not a softlock: the chute is reachable at
  //    every level, not only the one the commit resolves to — a player who
  //    never trips the plate is still standing in the sump at HIGH.
  for (const b of branches) {
    const stuck = LEVELS.filter(l => !has(flood(r, b.land, l), b.back));
    check(`${where}: ${b.name}'s chute is reachable at every level`, stuck.length === 0,
      'not at ' + stuck.map(l => LEVEL_NAME[l]).join('/') + ' — a wrong guess is a softlock');
    const w = (r.def.warps || []).find(o => o.x === b.back[0] && o.y === b.back[1]);
    check(`${where}: ${b.name}'s chute actually warps somewhere`, !!w,
      `no warp entry at ${b.back} — the stairs are a picture of stairs`);
  }

  console.log(`       decide at ${LEVEL_NAME[at]} on ${decide}, `
    + `${branches.length} branches, resolves at ${LEVEL_NAME[resolve]}, `
    + `way on ${to} via ${wins.map(b => b.name).join('/') || 'nothing'}`);
}

console.log(`\n=== ${passed} passed, ${failures.length} failed ===`);
for (const f of failures) console.log('  ' + f);
process.exit(failures.length ? 1 : 0);
