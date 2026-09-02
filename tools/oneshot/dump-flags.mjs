// Scratch: per-tile name + WET/SOLID/DEEP at each tide level for one room.
import { installData } from '../../src/data/index.js';
import { getRoom } from '../../src/world/maps.js';
import { F } from '../../src/world/tileset.js';
installData();
for (const spec of process.argv.slice(2)) {
  const p = spec.split(',');
  const mapId = p[0];
  const [floor, rx, ry] = p.length === 4 ? p.slice(1).map(Number) : [0, +p[1], +p[2]];
  const room = getRoom(mapId, floor, rx, ry);
  console.log(`\n=== ${spec}`);
  for (let L = 0; L < 3; L++) {
    const tide = { levelAt: () => L, level: L, stamp: L + 1 };
    console.log(' tide ' + L);
    for (let ty = 0; ty < room.th; ty++) {
      let line = '';
      for (let tx = 0; tx < room.tw; tx++) {
        const f = room.flagsAt(tx, ty, tide);
        line += (f & F.SOLID ? '#' : (f & F.DEEP ? 'D' : (f & F.WET ? 'w' : '.')));
      }
      console.log('   ' + line);
    }
  }
  let names = new Set();
  for (let ty = 0; ty < room.th; ty++) for (let tx = 0; tx < room.tw; tx++) names.add(room.baseName(tx, ty));
  console.log('   tiles: ' + [...names].join(' '));
}
