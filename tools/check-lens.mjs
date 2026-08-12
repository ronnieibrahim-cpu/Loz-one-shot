// Brineglass-Lens prover. Runs in plain Node (no DOM, no browser) against the
// game's own data modules and feel constants. Modelled on check-anchor.mjs, and
// deliberately: same state-space flood, same both-directions discipline, same
// rule that every reach it uses comes out of feel.js rather than being written
// down here.
//
// WHAT IT IS FOR
//
// P8 says every room after a dungeon's item requires the verb that item
// introduced. P9 says the Brineglass Lens is informational and must never be a
// gate. Both stand, because they are about different scopes (see "D2 decision"
// in docs/EXECUTION-PLAN.md) — but it leaves the D2 session holding an item
// that CANNOT make a tile passable and a requirement that it be required.
//
// The verb the Lens introduces is KNOWING BEFORE YOU COMMIT, so the room has to
// make you commit: a choice that cannot be taken back, where the branch you
// want depends on what the room will be at the NEXT tide level — which is
// exactly what is invisible while you are standing at this one.
//
// The failure mode this tool exists for is the same shape as the one
// check-anchor.mjs found in D1's gates on its first run: a room that reads as a
// Lens room in the data and is two button presses in the hand. Three ways that
// happens, and all three are checked below:
//
//   * the choice can be walked back, so guessing wrong costs nothing;
//   * both branches lead on anyway, so there is nothing to guess;
//   * THE PLAYER CAN SOUND THE CONCH WHERE HE IS STANDING, look at the answer,
//     and sound it back. This is the one with teeth and it is the reason the
//     Coral Spire has a tile that is walkable at HIGH and nowhere else. If
//     ANY tile in the room's pre-commitment region survives a change of the
//     base level, the room is a Lens room that rewards remembering the conch.
//
// THE MODEL, and where its edges are
//
//   * A state is (tile, base level), as in check-anchor. Walking moves between
//     adjacent states; sounding the conch changes the base and is allowed only
//     while the tile underfoot survives the change.
//   * A hop clears up to HOP_TILES of anything that is not SOLID and not a
//     LEDGE, and must land somewhere walkable. HOP_TILES comes out of feel.js.
//     Letting the hop cross deep water and pits is more than the engine
//     actually allows (tryGapHop wants F.JUMPABLE), and that is deliberate:
//     every claim this tool makes about a branch is a claim that the player
//     CANNOT get somewhere, so the model has to be generous about what he can
//     do or the proof is worth nothing.
//   * A LEDGE is the exception to that generosity, because the engine is not
//     generous about it either: `Room.solidAt` makes a ledge solid from every
//     side but its face, and `tryGapHop` refuses to start over one. It is
//     crossed only by walking into its face, which is `Player.tryLedgeHop`
//     re-implemented here against LEDGE_MAX_SPAN.
//   * NO SWIMMING. The Kelp-Soled Cleats are the D3 item, so deep water is a
//     wall. The assertion about which dungeons are covered is what catches a
//     later dungeon quietly declaring a lensRoom.
//
// THE ROOM DATA it proves. A room declares:
//
//   lensRoom: {
//     at: 2,                       // the level the choice is made at
//     decide: [x, y],              // the tile the player commits from
//     onward: [x, y],              // reaching this is "you chose right"
//     branches: [
//       { name: '...', enter: [x, y], run: [[x1, y1], [x2, y2]] },
//       ...
//     ],
//   }
//
// `run` is the straight line of tiles the branch is told apart by. Nothing
// about the outcome is taken on trust: which branch leads on is DERIVED by
// flooding it, and `at` is checked against the room rather than believed.
//
// Usage: node tools/check-lens.mjs [--verbose]

import { MAPS } from '../src/world/maps.js';
import { getLegend } from '../src/world/room.js';
import { F, getTileDef } from '../src/world/tileset.js';
import { installData } from '../src/data/index.js';
import {
  JUMP_POWER, JUMP_GRAVITY, WALK_SPEED, LEDGE_MAX_SPAN,
} from '../src/data/feel.js';

installData();

const VERBOSE = process.argv.includes('--verbose');
const LEVELS = [0, 1, 2];
const NAMES = ['LOW', 'MID', 'HIGH'];

let passed = 0; const failures = [];
function check(name, cond, detail) {
  if (cond) { passed++; console.log('  ok   ' + name); }
  else { failures.push(name + (detail ? ' — ' + detail : '')); console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); }
}

// --- the one reach, derived rather than remembered ---------------------------
// Airtime is 2 * JUMP_POWER / JUMP_GRAVITY frames, covering WALK_SPEED
// subpixels of ground per frame. Same arithmetic as check-anchor.mjs and
// FEEL-SPEC.md; retuning WALK_SPEED re-proves every room here.
const HOP_PX = (2 * JUMP_POWER / JUMP_GRAVITY) * (WALK_SPEED / 256);
const HOP_TILES = Math.floor(HOP_PX / 16);

console.log(`  hop reach ${HOP_PX.toFixed(1)}px (${HOP_TILES} whole tiles), `
  + `ledge span ${LEDGE_MAX_SPAN} tiles`);

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

/** A hop passes over anything that is not a wall — but never over a ledge. */
function hoppableDef(d) {
  return !!d && !(d.flags & (F.VOID | F.SOLID | F.LEDGE));
}

/**
 * WHAT THE TILE LOOKS LIKE, not what it is called.
 *
 * This is the whole of assertion 3 and it is the reason the comparison is a
 * fingerprint rather than a name. `drownWall` resolves to `waterD` at HIGH and
 * `dSluice` resolves to `dWaterD`; those are two entries in the tile registry
 * with different names and byte-identical definitions, so on a 160x144 screen
 * they are the same sheet of water. A checker comparing names would call that
 * a difference the player can see, which is exactly backwards.
 */
function look(d) {
  if (!d) return 'void';
  return JSON.stringify([d.art, d.pal, d.flags | 0, d.anim || null, d.animRate || 0,
    !!d.over, d.push || null, d.underArt || null]);
}

const DIRS = [[1, 0, 'right'], [-1, 0, 'left'], [0, 1, 'down'], [0, -1, 'up']];

/**
 * The state space. Returns the set of reachable "x,y,base" keys from `start`.
 *
 * `conch` false pins the base to `base0` — that is the pre-commitment flood,
 * and the point of pinning it is that the pre-commitment region is then checked
 * tile by tile for whether the conch could have been sounded at all.
 * `ledges` false forbids the one-way hop, which is what makes a flood
 * "everywhere you can get to WITHOUT committing".
 */
function flood(room, start, { conch = true, ledges = true, base0 = null } = {}) {
  const { grid, legend, noTide, W, H } = room;
  const inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const def = (x, y, b) => (inside(x, y) ? defAt(legend, grid[y][x], b) : null);
  const walk = (x, y, b) => walkableDef(def(x, y, b));

  const bases = base0 == null ? LEVELS : [base0];
  const seen = new Set(), q = [];
  const push = (x, y, b) => {
    const k = `${x},${y},${b}`;
    if (seen.has(k)) return;
    seen.add(k); q.push([x, y, b]);
  };
  for (const b of bases) if (walk(start[0], start[1], b)) push(start[0], start[1], b);

  while (q.length) {
    const [x, y, base] = q.pop();
    if (conch && !noTide) {
      for (const b of LEVELS) if (b !== base && walk(x, y, b)) push(x, y, b);
    }
    for (const [dx, dy, dir] of DIRS) {
      if (walk(x + dx, y + dy, base)) { push(x + dx, y + dy, base); continue; }
      // A one-way ledge, exactly as Player.tryLedgeHop reads it: walk into its
      // face, clear it and everything flagged LEDGE behind it, land past.
      const d0 = def(x + dx, y + dy, base);
      if (ledges && d0 && (d0.flags & F.LEDGE) && d0.ledge === dir) {
        let n = 1;
        while (n < LEDGE_MAX_SPAN) {
          const d = def(x + dx * (n + 1), y + dy * (n + 1), base);
          if (!d || !(d.flags & F.LEDGE)) break;
          n++;
        }
        const lx = x + dx * (n + 1), ly = y + dy * (n + 1);
        if (walk(lx, ly, base)) push(lx, ly, base);
        continue;
      }
      for (let n = 1; n <= HOP_TILES; n++) {
        let clear = true;
        for (let i = 1; i <= n; i++) if (!hoppableDef(def(x + dx * i, y + dy * i, base))) { clear = false; break; }
        if (!clear) break;
        if (walk(x + dx * (n + 1), y + dy * (n + 1), base)) push(x + dx * (n + 1), y + dy * (n + 1), base);
      }
    }
  }
  return seen;
}

const reaches = (seen, [x, y]) => LEVELS.some(b => seen.has(`${x},${y},${b}`));

/** Every tile (ignoring level) named in a flood. */
function tilesOf(seen) {
  const out = new Set();
  for (const k of seen) { const [x, y] = k.split(','); out.add(x + ',' + y); }
  return out;
}

/** The inclusive straight line of tiles a branch is told apart by. */
function runTiles([[x1, y1], [x2, y2]]) {
  const dx = Math.sign(x2 - x1), dy = Math.sign(y2 - y1);
  const n = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
  const out = [];
  for (let i = 0; i <= n; i++) out.push([x1 + dx * i, y1 + dy * i]);
  return out;
}

// --- collect the declared rooms ---------------------------------------------
const rooms = [];
for (const [mapId, m] of MAPS) {
  for (const [key, def] of Object.entries(m.roomDefs || {})) {
    if (!def.lensRoom) continue;
    const sz = def.size || [1, 1];
    rooms.push({
      mapId, key, name: def.name || key,
      W: (sz[0] | 0) * 10, H: (sz[1] | 0) * 8,
      grid: def.map, legend: getLegend(def.legend || m.legend),
      noTide: !!def.noTide, def, L: def.lensRoom,
    });
  }
}

// A prover with nothing to prove passes vacuously and says nothing.
check('at least one room declares a Lens room', rooms.length > 0, 'nothing to prove');
// The model has no swimming in it, so it is only sound before the Cleats.
const late = rooms.filter(r => !['d1', 'd2'].includes(r.mapId));
check('every declared Lens room is in a pre-Cleats dungeon', late.length === 0,
  late.map(r => `${r.mapId} ${r.key}`).join(', ') + ' — teach this tool to swim first');

for (const r of rooms) {
  const where = `${r.mapId} ${r.key} (${r.name})`;
  const { at, decide, onward, branches } = r.L;

  // --- 0: the room agrees with what it says about itself ---------------------
  const standable = LEVELS.filter(b => walkableDef(defAt(r.legend, r.grid[decide[1]][decide[0]], b)));
  check(`${where}: the choice is made at ${NAMES[at]} and at no other level`,
    standable.length === 1 && standable[0] === at,
    `the decision tile is standable at ${standable.map(b => NAMES[b]).join('/') || 'no level'}`);

  // The pre-commitment region: everywhere the player can get to from the
  // decision tile without hopping a ledge, with the base pinned.
  const pre = flood(r, decide, { conch: false, ledges: false, base0: at });
  const preTiles = tilesOf(pre);

  // --- 1: THE CONCH CANNOT BE USED TO SCOUT ---------------------------------
  //
  // Checked tile by tile rather than by flooding with the conch on, because
  // this is a claim about what the player can SEE and not about where he can
  // walk. If one tile of the approach survives the change of base, he stands on
  // it, sounds the conch, reads the answer off the screen and sounds it back.
  const survives = [];
  for (const t of preTiles) {
    const [x, y] = t.split(',').map(Number);
    for (const b of LEVELS) {
      if (b === at) continue;
      if (walkableDef(defAt(r.legend, r.grid[y][x], b))) survives.push(`${t}@${NAMES[b]}`);
    }
  }
  check(`${where}: nowhere before the choice survives a change of the tide`,
    survives.length === 0,
    survives.slice(0, 4).join(', ') + ' — sound the conch there and the answer is on the screen');

  // --- 2: the branches are entered ONLY by the one-way hop -------------------
  for (const br of branches) {
    check(`${where}: ${br.name} cannot be walked into`,
      !preTiles.has(br.enter.join(',')),
      'it is reachable from the decision tile without committing');
  }

  // The hop itself has to exist, or the room is not a choice, it is a wall.
  const withLedges = flood(r, decide, { conch: false, ledges: true, base0: at });
  for (const br of branches) {
    check(`${where}: ${br.name} can be hopped into from the choice`,
      withLedges.has(`${br.enter[0]},${br.enter[1]},${at}`),
      'no one-way ledge lands on it');
  }

  // --- 3: the choice cannot be taken back -----------------------------------
  const after = branches.map(br => flood(r, br.enter, { conch: true, ledges: true }));
  branches.forEach((br, i) => {
    check(`${where}: ${br.name} does not lead back to the choice`,
      !reaches(after[i], decide),
      'the player can walk back round and pick again for nothing');
  });

  // --- 4: the branches are not the same bet ---------------------------------
  const outcome = branches.map((br, i) => (reaches(after[i], onward) ? 'onward' : 'dead'));
  check(`${where}: at least one branch leads on`, outcome.includes('onward'),
    'no branch reaches ' + onward);
  check(`${where}: at least one branch is a dead end at every level it can reach`,
    outcome.includes('dead'), 'every branch leads on, so there is nothing to choose');

  // A DEAD END THAT TOUCHES THE ROOM EDGE IS NOT A DEAD END, and this model is
  // room-local, so it cannot see what is on the other side of the seam. It was
  // found by breaking the room on purpose: swapping the sealed channel for `4`
  // dDrain — a pit at LOW and a wadeable ford at MID, which is exactly the
  // near-miss the dungeon's own header warns about — left the branch classed
  // 'dead' only because the room BELOW happened to have wall facing it. Every
  // assertion here has to hold on this room's data alone, so a dead branch may
  // not reach the border at all.
  branches.forEach((br, i) => {
    if (outcome[i] !== 'dead') return;
    const edge = [...tilesOf(after[i])].filter(t => {
      const [x, y] = t.split(',').map(Number);
      return x === 0 || y === 0 || x === r.W - 1 || y === r.H - 1;
    });
    check(`${where}: ${br.name} never reaches the room's edge`, edge.length === 0,
      edge.slice(0, 4).join(', ') + ' — it opens onto a seam, and whether that is a way out is not this room\'s to say');
  });

  // --- 5: WHICH IS WHICH IS NOT ON THE SCREEN -------------------------------
  //
  // The teeth. Every branch's run must render IDENTICALLY, tile for tile, at
  // the level the choice is made at — and differ at the next one, or the Lens
  // has nothing to show.
  const runs = branches.map(br => runTiles(br.run));
  const len = runs[0].length;
  check(`${where}: the branches are told apart over the same span`,
    runs.every(rn => rn.length === len), runs.map(rn => rn.length).join(' vs '));

  if (runs.every(rn => rn.length === len)) {
    const at0 = runs.map(rn => rn.map(([x, y]) => look(defAt(r.legend, r.grid[y][x], at))));
    const same = at0.every(s => s.join('|') === at0[0].join('|'));
    const differs = [];
    for (let i = 0; i < len; i++) {
      const nx = runs.map(rn => look(defAt(r.legend, r.grid[rn[i][1]][rn[i][0]], (at + 1) % 3)));
      if (nx.some(s => s !== nx[0])) differs.push(i);
    }
    check(`${where}: the branches are indistinguishable at ${NAMES[at]}`, same,
      'the tiles on the screen already say which is which — this room rewards reading, not the Lens');
    check(`${where}: the branches differ at ${NAMES[(at + 1) % 3]}`, differs.length > 0,
      'the Lens shows the player nothing he did not already have');
    if (VERBOSE && differs.length) {
      console.log(`       they part at run index ${differs.join(', ')} of ${len}`);
    }
  }

  console.log(`       decide ${decide} at ${NAMES[at]}, `
    + branches.map((br, i) => `${br.name}=${outcome[i]}`).join(', '));
}

console.log(`\n=== ${passed} passed, ${failures.length} failed ===`);
for (const f of failures) console.log('  ' + f);
process.exit(failures.length ? 1 : 0);
