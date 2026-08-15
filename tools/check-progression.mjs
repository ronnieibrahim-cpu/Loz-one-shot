// Progression checker. Plain Node, no browser.
//
// THE QUESTION NO OTHER CHECKER ASKS. `check-overworld.mjs` proves the world is
// reachable WITH EVERYTHING and that each gate shuts its own region. Both are
// true of a world that cannot be played at all, and before P9 both were true of
// this one: the Cliffs of Kell were held shut by a boulder and the Abyssal
// approach by an iron plug, and BOTH want the Dredge Line — which is the item
// the Abyssal Keep hands over, at the far end of the approach. Four dungeons of
// the six were behind a key found inside one of them. Every checker in the repo
// was green.
//
// So this asks the other question: walking out of Tidewatch with nothing, and
// gaining exactly what each dungeon hands over, can the dungeons be reached in
// order at all?
//
//   1. ANTI-LOCK. Dungeon N's mouth must be reachable holding only items from
//      dungeons before it. This is the assertion that would have failed.
//   2. THE TIERS ARE REAL. Each tier's dungeons open at that tier and NOT at the
//      one before it, so "the whole world is open from the start" cannot pass.
//   3. NOTHING IS ORPHANED. Every gate flag placed in the world belongs to a
//      tier, so a gate keyed on an item nobody has yet is a failure rather than
//      a screen nobody visits.
//
// Usage: node check-progression.mjs [-v]

import { installData } from '../src/data/index.js';
import { MAPS, getRoom, sealEssences, essenceCount } from '../src/world/maps.js';
import { getTileDef, F } from '../src/world/tileset.js';
import { GAP_HOP_MAX_SPAN } from '../src/data/feel.js';

installData();

const W = 10, H = 8, OW = 12, OH = 10;
const m = MAPS.get('overworld');
const VERBOSE = process.argv.includes('-v');

// Where the player starts, and where each dungeon is entered. Read off the
// overworld's own warp lists rather than written down, so a moved mouth moves
// this too.
const START = [4, 7];
const MOUTH = {};
for (const [k, def] of Object.entries(m.roomDefs)) {
  const [, rx, ry] = k.split(',').map(Number);
  for (const w of def.warps || []) {
    const to = Array.isArray(w) ? w[2] : w.to && w.to.map;
    if (typeof to === 'string' && /^d\d+$/.test(to)) MOUTH[to] = [rx, ry];
  }
}

// WHAT EACH TIER OF THE GAME CAN DO, and where it got it.
//
// `caps` is cumulative and is the only thing the flood reads. It is deliberately
// coarse — this models REGIONS, not rooms, so "can cross deep water" is one bit
// and which Cleat mode does it is check-cleats.mjs's business.
const TIERS = [
  {
    name: 'out of Tidewatch with a sword',
    caps: {},
    opens: ['d1', 'd2'],
  },
  {
    name: 'Bombs, from the Coral Spire',
    caps: { bombs: true },
    opens: ['d3'],
  },
  {
    name: 'the Kelp-Soled Cleats, from the Bogwater Sanctum',
    caps: { bombs: true, swim: true },
    opens: ['d4', 'd5'],
  },
  {
    // The one tier that is not an item. See F.SEAL in src/world/tileset.js:
    // the last dungeon cannot be locked with an item, because every item that
    // could express a gate is either spent on an earlier region or is the one
    // that dungeon hands over.
    name: `${sealEssences()} Essences`,
    caps: { bombs: true, swim: true, sealed: true },
    opens: ['d6'],
  },
];

let pass = 0; const fail = [];
const check = (n, c, d) => c ? pass++ : (fail.push(n), console.log('  FAIL ' + n + (d ? ' — ' + d : '')));

// ---------------------------------------------------------------- the flood
//
// Deliberately the same model as check-overworld.mjs's: tile by tile across
// screen seams, a tile passable if ANY tide level allows it (the player owns
// the conch from the first screen), and the base hop read out of feel.js.
const NAMES = new Map();
for (const k of Object.keys(m.roomDefs)) {
  const [f, rx, ry] = k.split(',').map(Number);
  const room = getRoom('overworld', f, rx, ry);
  NAMES.set(k, Array.from({ length: H }, (_, y) =>
    Array.from({ length: W }, (_, x) => room.baseName(x, y))));
}
function defAt(name, tide) {
  let d = getTileDef(name);
  for (let i = 0; i < 4 && d && d.tide; i++) d = getTileDef(d.tide[tide]);
  return d;
}
const GATE_FLAGS = [
  ['bombs', F.BOMBABLE], ['swim', F.SWIMGATE], ['sealed', F.SEAL],
  ['rod', F.VANE], ['dredge', F.HEAVY | F.MAGNETIC],
];

function reach(caps) {
  const open = GATE_FLAGS.reduce((mask, [c, f]) => mask | (caps[c] ? f : 0), 0);
  const walk = (name, tide) => {
    const d = defAt(name, tide);
    if (!d) return false;
    if (open && (d.flags & open)) return true;
    if (caps.swim && (d.flags & F.DEEP) && !(d.flags & (F.SOLID | F.VOID))) return true;
    return !(d.flags & (F.VOID | F.SOLID | F.PIT | F.DEEP | F.LEDGE | F.HAZARD
      | F.JUMPABLE | F.SEAL));
  };
  const isGap = n => { const d = defAt(n, 1); return !!(d && (d.flags & F.JUMPABLE)); };
  const run = (l, x, y, dx, dy) => {
    let n = 1;
    for (let i = 1; ; i++) {
      const nx = x + dx * i, ny = y + dy * i;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || !isGap(l[ny][nx])) break;
      n++;
    }
    for (let i = 1; ; i++) {
      const nx = x - dx * i, ny = y - dy * i;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || !isGap(l[ny][nx])) break;
      n++;
    }
    return n;
  };
  const passable = (l, x, y) => {
    const ch = l[y][x];
    if ([0, 1, 2].some(t => walk(ch, t))) return true;
    return isGap(ch) && (run(l, x, y, 1, 0) < GAP_HOP_MAX_SPAN
      || run(l, x, y, 0, 1) < GAP_HOP_MAX_SPAN);
  };

  // Start on the first passable tile of the starting screen, so a moved
  // doorway does not read as an unreachable world.
  const l0 = NAMES.get(`0,${START[0]},${START[1]}`);
  const seeds = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (passable(l0, x, y)) seeds.push([START[0], START[1], x, y]);
  const seen = new Set(seeds.map(s => s.join(',')));
  const screens = new Set([`${START[0]},${START[1]}`]);
  const stack = seeds.slice();
  while (stack.length) {
    const [rx, ry, x, y] = stack.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      let nrx = rx, nry = ry, nx = x + dx, ny = y + dy;
      if (nx < 0) { nrx--; nx = W - 1; } if (nx >= W) { nrx++; nx = 0; }
      if (ny < 0) { nry--; ny = H - 1; } if (ny >= H) { nry++; ny = 0; }
      if (nrx < 0 || nry < 0 || nrx >= OW || nry >= OH) continue;
      const l = NAMES.get(`0,${nrx},${nry}`);
      if (!l || !passable(l, nx, ny)) continue;
      const key = `${nrx},${nry},${nx},${ny}`;
      if (seen.has(key)) continue;
      seen.add(key); screens.add(`${nrx},${nry}`); stack.push([nrx, nry, nx, ny]);
    }
  }
  return screens;
}

// --- 0. the roster the tiers claim ----------------------------------------
const listed = TIERS.flatMap(t => t.opens);
const known = Object.keys(MOUTH).sort();
check('every dungeon on the overworld is placed in a tier',
  known.every(d => listed.includes(d)) && listed.every(d => known.includes(d)),
  `world has ${known.join(',')}; tiers list ${listed.sort().join(',')}`);
check('the seal wants every Essence but the last',
  sealEssences() === essenceCount() - 1,
  `${sealEssences()} of ${essenceCount()}`);

// --- 1. the anti-lock assertion -------------------------------------------
//
// The one that matters, stated the way the bug was: a dungeon may not be held
// shut by anything the player can only get by finishing it, or by finishing one
// that comes after it.
const reached = TIERS.map(t => reach(t.caps));
TIERS.forEach((tier, i) => {
  for (const d of tier.opens) {
    const [x, y] = MOUTH[d] || [];
    check(`${d} is reachable with ${tier.name}`,
      MOUTH[d] && reached[i].has(`${x},${y}`), `mouth ${x},${y}`);
  }
});

// --- 2. the tiers are real -------------------------------------------------
TIERS.forEach((tier, i) => {
  if (i === 0) return;
  for (const d of tier.opens) {
    const [x, y] = MOUTH[d] || [];
    check(`${d} is NOT reachable one tier earlier (${TIERS[i - 1].name})`,
      !reached[i - 1].has(`${x},${y}`), `mouth ${x},${y} was already open`);
  }
});

// --- 3. the world grows, and finishes ---------------------------------------
for (let i = 1; i < TIERS.length; i++) {
  check(`${TIERS[i].name} opens ground the tier before it could not reach`,
    reached[i].size > reached[i - 1].size,
    `${reached[i - 1].size} -> ${reached[i].size} screens`);
}

// --- 4. every gate flag in the world belongs to a tier ----------------------
//
// A gate keyed on something no tier hands out is a region nobody can enter, and
// it looks exactly like a region nobody has authored a route to.
{
  const held = TIERS[TIERS.length - 1].caps;
  const orphan = new Map();
  for (const [k, l] of NAMES) {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      for (const t of [0, 1, 2]) {
        const d = defAt(l[y][x], t);
        if (!d) continue;
        for (const [cap, flag] of GATE_FLAGS) {
          // The Resonance Rod and the Dredge Line gate optional pockets rather
          // than a dungeon's region, so they are not a tier — they are listed
          // here so a gate that quietly stops being reachable is still seen.
          if ((d.flags & flag) && !held[cap] && !['rod', 'dredge'].includes(cap)) {
            orphan.set(`${k} ${x},${y}`, d.name);
          }
        }
      }
    }
  }
  check('no gate is keyed on something no tier hands out', orphan.size === 0,
    [...orphan].slice(0, 4).map(([w, n]) => `${w} ${n}`).join(' | '));
}

// --- 5. the heart economy --------------------------------------------------
//
// P9's third clause: three hearts at the start, and six Heart Containers plus
// the Pieces should land the cap at 14-16. The piece count had been left at the
// EIGHT-dungeon assumption — eighteen of them, which is not a multiple of four,
// so two of the eighteen could never be spent on anything and the cap sat at 13.
// A piece that buys nothing is worse than no piece: it is a reward the player
// collects and is not paid for.
{
  const START_HEARTS = 3;                 // progress.js: `hearts: 3 * HEART_UNITS`
  const PER_CONTAINER = 4;                // four pieces make one
  let pieces = 0;
  for (const map of MAPS.values()) {
    for (const def of Object.values(map.roomDefs || {})) {
      for (const e of def.entities || []) {
        if (e[0] === 'pickup' && e[3] && e[3].kind === 'heartPiece') pieces++;
      }
      for (const b of def.buried || []) if (b[2] === 'heartPiece') pieces++;
      // A piece can also be a puzzle's payout rather than a thing lying on the
      // floor. Counting only `entities` reads that one as missing and hands
      // back a total that is one short — which is exactly how a count that is
      // supposed to divide by four ends up not dividing by four.
      for (const s of (def.puzzle && def.puzzle.reward && def.puzzle.reward.spawn) || []) {
        if (s[0] === 'pickup' && s[3] && s[3].kind === 'heartPiece') pieces++;
      }
    }
  }
  // One Heart Container per dungeon, dropped by its boss — counted off the
  // dungeon roster rather than written down, the same way essenceCount() is.
  const containers = essenceCount();
  const cap = START_HEARTS + containers + Math.floor(pieces / PER_CONTAINER);
  check('every Piece of Heart can be spent', pieces % PER_CONTAINER === 0,
    `${pieces} pieces leaves ${pieces % PER_CONTAINER} that buy nothing`);
  check('the heart cap lands in 14-16', cap >= 14 && cap <= 16,
    `${START_HEARTS} + ${containers} containers + ${pieces}/4 pieces = ${cap}`);
  console.log(`\n  hearts: ${START_HEARTS} at the start, ${containers} containers, `
    + `${pieces} pieces -> a cap of ${cap}`);
}

console.log('');
TIERS.forEach((t, i) => {
  console.log(`  ${String(reached[i].size).padStart(3)}/120 screens  `
    + `opens ${t.opens.join(' ')}  with ${t.name}`);
});
if (VERBOSE) {
  for (const [d, [x, y]] of Object.entries(MOUTH)) console.log(`  ${d} mouth at ${x},${y}`);
}

console.log(`\n=== ${pass} passed, ${fail.length} failed ===`);
process.exit(fail.length ? 1 : 0);
