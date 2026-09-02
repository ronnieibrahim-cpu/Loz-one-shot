// Scratch: which props are standing on ground that exists nowhere near them?
//
// A prop tile (anything with `underArt`) is transparent and needs a base tile
// drawn beneath it. It DECLARES one — `rock` says `grass` — and `Room.underGround`
// lets the room outvote that declaration when two or more of its plain-ground
// neighbours agree on something else. When they do not agree, the declaration
// stands, and on a screen with no grass anywhere the result is a hard green
// square in the middle of sand.
//
// So: ask the engine what it will actually draw under every prop in the world,
// and flag the ones whose answer is a ground that appears nowhere else on that
// screen.
import { installData } from '../../src/data/index.js';
import { MAPS, getRoom } from '../../src/world/maps.js';
import { F, getTileDef } from '../../src/world/tileset.js';

installData();

const counts = new Map();   // "under -> screen ground" -> n
const rows = [];

for (const [mapId, m] of MAPS) {
  for (const key of Object.keys(m.roomDefs)) {
    const [floor, rx, ry] = key.split(',').map(Number);
    const room = getRoom(mapId, floor, rx, ry);
    if (!room) continue;
    for (const tide of [0, 1, 2]) {
      // The plain grounds this screen actually shows: not props, not water,
      // not animated, not solid.
      const grounds = new Set();
      for (let y = 0; y < room.th; y++) for (let x = 0; x < room.tw; x++) {
        const d = room.tile(x, y, tide);
        if (d.underArt || d.over || d.anim || d.quad || d.big) continue;
        if (d.flags & (F.VOID | F.SOLID | F.WARP | F.WET)) continue;
        grounds.add(d.name);
      }
      for (let y = 0; y < room.th; y++) for (let x = 0; x < room.tw; x++) {
        const d = room.tile(x, y, tide);
        if (!d.underArt) continue;
        // A prop that stands IN WATER declares water and keeps it: the vote
        // deliberately excludes wet cells from the ground census (this is the
        // static layer; water is drawn over it), so a water declaration always
        // looks absent and is never evidence of a fault.
        const declW = getTileDef(d.underArt);
        if (declW.flags & F.WET) continue;
        const u = room.underGround(d, x, y, tide);
        if (grounds.has(u.name)) continue;
        // PALETTE IS THE TEST, not the name. `sand` and `sandRipple` are the
        // same material in two dressings and read identically under a rock;
        // `grass` in a marsh full of `grassDark` does not.
        if ([...grounds].some(g => getTileDef(g).pal === u.pal)) continue;
        // Nothing on this screen looks like what is about to be painted under
        // this prop. Report the palette too — two grounds with the same palette
        // read as the same material and are not a fault.
        const decl = getTileDef(d.underArt);
        rows.push({
          where: `${mapId}/${key}`, tide, x, y, prop: d.name,
          under: u.name, underPal: u.pal, declared: decl.name,
          screen: [...grounds].join('/') || '(none)',
        });
        const k = `${d.name} on ${u.name} (${u.pal})  where the screen has ${[...grounds].join('/') || '(none)'}`;
        counts.set(k, (counts.get(k) || 0) + 1);
      }
      break;   // props do not change with the tide; one level is the whole story
    }
  }
}

console.log(`${rows.length} prop cells draw a ground their screen does not have\n`);
for (const [k, n] of [...counts].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(4)}x  ${k}`);
}
if (process.argv.includes('--rows')) {
  console.log('');
  for (const r of rows) console.log(`  ${r.where} (${r.x},${r.y}) ${r.prop} -> ${r.under}`);
}
