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

// The placed OBJECTS a player walks up to, whose position is nobody's decision
// but the tile's. An enemy is not one: it leaves its spawn cell in the first
// second, and a spawn point is not a place anyone stands.
//
// PEOPLE ARE NOT ASSERTED, they are reported. An NPC stands beside the thing it
// belongs to — the scrimshander next to his own shack, a shopkeeper outside her
// shop — and Tidewatch Village is two buildings, two lanes and one thoroughfare,
// so "the nearest cell that is not overhung" put the scrimshander in the middle
// of the only straight route west and `test.mjs` reported that walking west no
// longer left the screen. check-towns had passed it: the screen was not severed,
// because row 6 goes round. A solid entity in a thoroughfare is legal for a
// flood and still wrong for a person walking. Moving one is a composition
// decision and wants an eye, so this prints them and leaves them.
const STATIC_ENTITIES = new Set(['sign', 'pickup', 'chest', 'essence', 'torch']);
const PEOPLE_ENTITIES = new Set(['npc', 'trader', 'giver', 'scrimshander', 'makuTree']);

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
// --- and a tree is the same size at every tide -------------------------------
//
// `Room.quadMayCover` decides whether a 32x32 object may overhang a cell, and it
// refuses an ANIMATED one — the canopy is painted into the static layer and the
// animated cells are drawn afterwards, so an overhang there would be scrubbed
// off. A TIDE TILE is animated at some levels and not at others: `sandbar` is
// plain sand at LOW and water at HIGH. So the same cell was overhung at LOW and
// bare at HIGH, and the woods grew and shrank as the conch was sounded. 66 cells
// did it. The rule now reads the tile's own NAME rather than what it resolves
// to, and this is the assertion that the answer no longer moves.
const flicker = [];
for (const [mapId, m] of MAPS) {
  for (const key of Object.keys(m.roomDefs)) {
    const [floor, rx, ry] = key.split(',').map(Number);
    const room = getRoom(mapId, floor, rx, ry);
    if (!room) continue;
    for (let by = 0; by < room.th; by += 2) {
      for (let bx = 0; bx < room.tw; bx += 2) {
        // The quad set this 2x2 block draws, if any. Read at one level: a block
        // that holds a tree holds it at every level (a tree is not a tide tile).
        let q = null;
        for (const [ox, oy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
          const d = room.tile(bx + ox, by + oy, 1);
          if (d.quad || d.big) { q = d.quad || d.big; break; }
        }
        if (!q) continue;
        for (const [ox, oy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
          const x = bx + ox, y = by + oy;
          const c = [0, 1, 2].map(t => room.quadMayCover(x, y, t, q));
          if (c[0] !== c[1] || c[1] !== c[2]) {
            flicker.push(`${mapId}/${key} (${x},${y}) '${room.baseName(x, y)}'`
              + ` overhung ${c.map(v => v ? 'y' : 'n').join('')} across LOW/MID/HIGH`);
          }
        }
      }
    }
  }
}
for (const f of flicker.slice(0, 8)) console.log('  grows  ' + f);
check('a 32x32 object overhangs the same cells at every tide', flicker.length === 0,
  flicker.length ? `${flicker.length} cells` : '');

// --- and a tree is only ever cut by something real ---------------------------
//
// A refused quadrant is not drawn at all, so the tree comes out with a dead
// straight edge down its middle — the exact fault the whole 32x32 tree system
// exists to avoid, arrived at from the other side. 146 of the game's 536 tree
// blocks were incomplete: 53 of them to avoid painting over a FLOWER, 18 to
// avoid painting over the open sea at the rim, and 60 because a tide tile is
// animated at some levels and the canopy could not go into the static layer.
//
// This does not restate `quadMayCover` — that would be asking the thing under
// test for its own limits (`T74`). It asks the DATA: a quadrant may only be
// refused where the cell holds something the player has to be able to SEE. A
// cell that is plain, flagless, dry ground at all three levels is not that, and
// a tree cut by one is a tree cut for nothing.
const cut = [];
for (const [mapId, m] of MAPS) {
  for (const key of Object.keys(m.roomDefs)) {
    const [floor, rx, ry] = key.split(',').map(Number);
    const room = getRoom(mapId, floor, rx, ry);
    if (!room) continue;
    for (let by = 0; by < room.th; by += 2) {
      for (let bx = 0; bx < room.tw; bx += 2) {
        let q = null;
        for (const [ox, oy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
          const d = room.tile(bx + ox, by + oy, 1);
          if (d.quad || d.big) { q = d.quad || d.big; break; }
        }
        if (!q) continue;
        for (const [ox, oy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
          const x = bx + ox, y = by + oy;
          if (room.quadMayCover(x, y, 1, q)) continue;
          // Nothing here needed protecting? A cell needs protecting when it
          // carries a FLAG the player has to read — solid, a hazard, a pit, a
          // doorway, water — or when it is itself part of another 32x32 object.
          // A FLAGLESS PROP IS NOT ONE: flowers are a transparent tile over
          // grass and nothing else, and refusing them is what cut 53 blocks.
          // Writing this as `!underArt` instead was the first cut, and its
          // negative test did not go red — it exempted the very thing the fix
          // was about.
          const plain = [0, 1, 2].every((lv) => {
            const d = room.tile(x, y, lv);
            return d.flags === 0 && !d.over && !d.quad && !d.big;
          });
          if (plain) cut.push(`${mapId}/${key} (${x},${y}) '${room.baseName(x, y)}'`
            + ` refuses ${q} and is plain ground at every tide`);
        }
      }
    }
  }
}
for (const c of cut.slice(0, 8)) console.log('  cut    ' + c);
check('no 32x32 object is cut short by plain ground', cut.length === 0,
  cut.length ? `${cut.length} quadrants` : '');

// --- and no decorative prop stands in a line of three ------------------------
//
// Sixteen screens had their rocks as `oooo`, four identical boulders in a row,
// five of them with a second such row and an `o..o` between — a hollow
// rectangle of boulders in open ground with the player walking about inside it.
// The source games place a rock singly or in twos, against something, to shape
// where you walk; a line of four in open sand is a fence, and from inside it
// what it reads as is Link standing on a field of rocks.
//
// GATES ARE EXEMPT and are identified by their flags rather than by name: a
// seal, a row of vanes, a cracked rockfall and a grate are all walls in a line
// on purpose. So are ledges, and so are trees, which are the border of nearly
// every screen in the game.
const GATEISH = F.RING | F.BOMBABLE | F.VANE | F.HEAVY;
const decorative = (d) => !!d.underArt && !!(d.flags & F.SOLID) && !d.quad && !d.big
  && !(d.flags & (F.LEDGE | GATEISH)) && !d.openFlag;
const lines = [];
for (const [mapId, m] of MAPS) {
  for (const key of Object.keys(m.roomDefs)) {
    const [floor, rx, ry] = key.split(',').map(Number);
    const room = getRoom(mapId, floor, rx, ry);
    if (!room) continue;
    const nameAt = (x, y) => { const d = room.tile(x, y, 1); return decorative(d) ? d.name : null; };
    const scan = (n, m2, at, label) => {
      for (let a = 0; a < n; a++) {
        let cur = null, run = 0;
        for (let b = 0; b <= m2; b++) {
          const v = b < m2 ? at(a, b) : null;
          if (v && v === cur) run++;
          else { if (cur && run >= 3) lines.push(`${mapId}/${key} ${run}x ${cur} in ${label} ${a}`); cur = v; run = 1; }
        }
      }
    };
    scan(room.th, room.tw, (y, x) => nameAt(x, y), 'row');
    scan(room.tw, room.th, (x, y) => nameAt(x, y), 'col');
  }
}
for (const l of lines.slice(0, 8)) console.log('  line   ' + l);
check('no decorative prop stands three in a straight line', lines.length === 0,
  lines.length ? `${lines.length} runs` : '');

// --- and nothing you walk up to is standing in the roots of a tree -----------
//
// A tree is 32x32 on a fixed 2x2 lattice, so a treeline one tile deep in the
// DATA is two tiles deep on the SCREEN: the canopy in the tree's own row and the
// root mound in the row below, painted over whatever ground is there. That is
// deliberate — every tree in Holodrum has roots — and it means the row under a
// treeline is walkable ground with a tree drawn on it. Twenty-one placed
// entities stood in one: two villagers and the scrimshander waist deep in
// Tidewatch Village's tree line, three signposts, a pickup, a trader.
//
// ENEMIES ARE EXEMPT. One walks out of the cell in the first second and a spawn
// point is not a place anyone stands. Everything static is not: a sign you read
// and a shopkeeper you talk to should not be inside a bush.
const shaded = [], shadedPeople = [];
for (const [mapId, m] of MAPS) {
  for (const [key, def] of Object.entries(m.roomDefs)) {
    if (!def.entities || !def.entities.length) continue;
    const [floor, rx, ry] = key.split(',').map(Number);
    const room = getRoom(mapId, floor, rx, ry);
    if (!room) continue;
    const covered = new Set();
    for (let by = 0; by < room.th; by += 2) {
      for (let bx = 0; bx < room.tw; bx += 2) {
        let q = null;
        for (const [ox, oy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
          const d = room.tile(bx + ox, by + oy, 1);
          if (d.quad || d.big) { q = d.quad || d.big; break; }
        }
        if (!q) continue;
        for (const [ox, oy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
          const x = bx + ox, y = by + oy;
          const d = room.tile(x, y, 1);
          if ((d.quad || d.big) === q) continue;
          if (room.quadMayCover(x, y, 1, q)) covered.add(`${x},${y}`);
        }
      }
    }
    if (!covered.size) continue;
    for (const e of def.entities) {
      const [type, ex, ey] = Array.isArray(e) ? e : [e.t, e.x, e.y];
      if (!covered.has(`${ex},${ey}`)) continue;
      if (PEOPLE_ENTITIES.has(type)) { shadedPeople.push(`${mapId}/${key} ${type} at ${ex},${ey}`); continue; }
      if (!STATIC_ENTITIES.has(type)) continue;
      shaded.push(`${mapId}/${key} ${type} at ${ex},${ey} is inside an overhang`);
    }
  }
}
for (const s2 of shaded.slice(0, 8)) console.log('  shade  ' + s2);
check('no placed object is standing in an overhang', shaded.length === 0,
  shaded.length ? `${shaded.length} entities` : '');
if (shadedPeople.length) {
  console.log(`  note: ${shadedPeople.length} people stand in one; each is beside`
    + ' the thing they belong to and moving one is a judgement, not a rule:');
  for (const p of shadedPeople) console.log('         ' + p);
}

// A checker that swept nothing passes for the wrong reason. The world has
// roughly two thousand prop cells; anything near zero means the sweep broke,
// not that the world got tidy.
check('the sweep actually found props to check', props > 500, `${props} found`);

console.log(`\n=== ${passed} passed, ${failures.length} failed ===`);
if (failures.length) { console.log('\nFailures:'); failures.forEach(f => console.log('  - ' + f)); }
process.exit(failures.length ? 1 : 0);
