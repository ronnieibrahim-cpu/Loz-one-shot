// Nothing is standing on ground its screen does not have.
//
// A prop is a transparent tile — a tree, a rock, a post, a sign, a ledge — and
// it names the ground to draw underneath it: `rock` says `grass`. That name is
// a property of the TILE TABLE, not of the place the tile was put, so a rock
// dropped on a reef brings a lawn with it and lands as a hard green square in
// the middle of rust and sand. `Room.underGround` is the rule that stops it,
// and this is the assertion that the rule is working.
//
// THE TEST IS PALETTE, NOT NAME. `sand` and `sandRipple` are one material in
// two dressings and read identically under a boulder; `grass` on a screen made
// of `grassDark` and `mud` does not. Counting names would call the first pair a
// fault and would never be satisfiable.
//
// R4: the ground under a prop is decided by `Room.underGround` and this file
// calls it. It does not re-derive the vote, and if the rule changes this moves
// with it — which is the point, because the fault this catches is not "the
// rule is wrong" but "the rule was never asked about this cell".
//
// 274 cells failed it when it was written: every oak in the marsh on a square
// of Holodrum grass, four posts and four boulders on the Salt Pans' reef each
// carrying a green rectangle, the Keep's seal on imported stone, and a scatter
// of dungeon posts and pots standing on the default brick floor in themed
// rooms that use none of it.

import { installData } from '../src/data/index.js';
import { MAPS, getRoom } from '../src/world/maps.js';
import { F, getTileDef } from '../src/world/tileset.js';

installData();

let passed = 0; const failures = [];
function check(name, cond, detail) {
  if (cond) { passed++; console.log('  ok   ' + name); }
  else { failures.push(name + (detail ? ' — ' + detail : '')); console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); }
}

const bad = [];
let props = 0, rooms = 0;

for (const [mapId, m] of MAPS) {
  for (const key of Object.keys(m.roomDefs)) {
    const [floor, rx, ry] = key.split(',').map(Number);
    const room = getRoom(mapId, floor, rx, ry);
    if (!room) continue;
    rooms++;
    // EVERY TIDE LEVEL. A screen that is sand at LOW and seafloor at HIGH is
    // two different grounds, and a prop only has to be wrong at one of them to
    // be wrong on screen.
    for (const tide of [0, 1, 2]) {
      const pals = new Set();
      for (let y = 0; y < room.th; y++) for (let x = 0; x < room.tw; x++) {
        const d = room.tile(x, y, tide);
        if (d.underArt || d.over || d.anim || d.quad || d.big) continue;
        if (d.flags & (F.VOID | F.SOLID | F.WARP | F.WET)) continue;
        pals.add(d.pal);
      }
      for (let y = 0; y < room.th; y++) for (let x = 0; x < room.tw; x++) {
        const d = room.tile(x, y, tide);
        if (!d.underArt) continue;
        if (tide === 0) props++;
        // A PROP THAT STANDS IN WATER KEEPS ITS WATER. The census above counts
        // dry ground only — the static layer is what `underGround` paints, and
        // water is drawn over it afterwards — so a wet declaration always looks
        // absent and would report every snarl in the Drowned Wood.
        if (getTileDef(d.underArt).flags & F.WET) continue;
        const u = room.underGround(d, x, y, tide);
        if (u.flags & F.WET) continue;
        if (pals.has(u.pal)) continue;
        bad.push(`${mapId}/${key} (${x},${y}) ${d.name} on ${u.name}[${u.pal}]`
          + ` at tide ${tide}; the screen has ${[...pals].join('/') || 'no ground at all'}`);
      }
    }
  }
}

console.log(`check-ground: ${rooms} rooms, ${props} prop cells`);
for (const b of bad.slice(0, 12)) console.log('  stuck  ' + b);
if (bad.length > 12) console.log(`  ... and ${bad.length - 12} more`);

check('every prop stands on ground its own screen has', bad.length === 0,
  bad.length ? `${bad.length} cells` : '');

// --- and nothing 32x32 is allowed to grow over a doorway --------------------
//
// `Room.quadMayCover` refuses to overhang a tile carrying F.WARP, F.SOLID or
// F.VOID, or one holding a prop — the Maku Tree's hollow sits in a tree line
// and an earlier cut drew a whole oak over it, art covering a warp, which no
// checker in the table can see because the tile is still there and still warps.
//
// A room's `warps` list is a SECOND kind of doorway and it does not have to
// carry the flag: it is a coordinate the room script warps from. On plain
// ground, `quadMayCover` says yes, so a warp put one tile under a treeline
// would vanish under a canopy. None do today; this is the assertion that keeps
// it that way, and it reads the engine's own predicate rather than restating
// which flags protect a cell.
const covered = [];
for (const [mapId, m] of MAPS) {
  for (const [key, def] of Object.entries(m.roomDefs)) {
    if (!def.warps) continue;
    const [floor, rx, ry] = key.split(',').map(Number);
    const room = getRoom(mapId, floor, rx, ry);
    if (!room) continue;
    for (const w of def.warps) {
      for (const tide of [0, 1, 2]) {
        // `q` is the quad set asking to cover; any name that is not this
        // cell's own asks the general question, which is the one that matters.
        if (room.quadMayCover(w.x, w.y, tide, '\u0000none')) {
          covered.push(`${mapId}/${key} warp at ${w.x},${w.y} at tide ${tide}`
            + ` on '${room.baseName(w.x, w.y)}' — a tree may grow over it`);
          break;
        }
      }
    }
  }
}
for (const c of covered.slice(0, 8)) console.log('  cover  ' + c);
check('no doorway is on a tile a 32x32 object may overhang', covered.length === 0,
  covered.length ? `${covered.length} warps` : '');
// A checker that swept nothing passes for the wrong reason. The world has
// roughly two thousand prop cells; anything near zero means the sweep broke,
// not that the world got tidy.
check('the sweep actually found props to check', props > 500, `${props} found`);

console.log(`\n=== ${passed} passed, ${failures.length} failed ===`);
if (failures.length) { console.log('\nFailures:'); failures.forEach(f => console.log('  - ' + f)); }
process.exit(failures.length ? 1 : 0);
