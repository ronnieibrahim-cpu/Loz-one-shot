// Scratch: how wet is each overworld screen, at each tide level, by the
// engine's own flags. Prints a 12x10 grid of percentages plus rim/interior
// aggregates.
import { installData } from '../../src/data/index.js';
import { getRoom } from '../../src/world/maps.js';
import { F } from '../../src/world/tileset.js';
installData();
const W = 12, H = 10;
const pct = (n, d) => (100 * n / d).toFixed(1);
const stats = [];
for (let ry = 0; ry < H; ry++) for (let rx = 0; rx < W; rx++) {
  const room = getRoom('overworld', 0, rx, ry);
  const rec = { rx, ry, wet: [0, 0, 0], stand: [0, 0, 0], n: room.tw * room.th };
  for (let L = 0; L < 3; L++) {
    const tide = { levelAt: () => L, level: L, stamp: L + 1 };
    for (let ty = 0; ty < room.th; ty++) for (let tx = 0; tx < room.tw; tx++) {
      const f = room.flagsAt(tx, ty, tide);
      if (f & F.WET) rec.wet[L]++;
      if ((f & F.WET) && !(f & F.SOLID)) rec.stand[L]++;
    }
  }
  stats.push(rec);
}
for (const L of [0, 2]) {
  console.log(`\n--- wet % per screen, tide ${L === 0 ? 'LOW' : 'HIGH'}`);
  for (let ry = 0; ry < H; ry++) {
    console.log('  ' + Array.from({ length: W }, (_, rx) =>
      String(Math.round(100 * stats[ry * W + rx].wet[L] / 80)).padStart(4)).join(''));
  }
}
const rim = s => s.rx === 0 || s.ry === 0 || s.rx === W - 1 || s.ry === H - 1;
for (const [label, sel] of [['rim', rim], ['interior', s => !rim(s)]]) {
  const g = stats.filter(sel);
  const tot = g.reduce((a, s) => a + s.n, 0);
  const w = L => g.reduce((a, s) => a + s.wet[L], 0);
  const st = L => g.reduce((a, s) => a + s.stand[L], 0);
  console.log(`\n${label}: ${g.length} screens  wet ${pct(w(0), tot)}% / ${pct(w(1), tot)}% / ${pct(w(2), tot)}%`
    + `   standable water ${pct(st(0), tot)}% / ${pct(st(1), tot)}% / ${pct(st(2), tot)}%`);
}
const dry = stats.filter(s => s.wet[2] === 0);
console.log(`\n${dry.length} screens with NO water at any level: `
  + dry.map(s => `${s.rx},${s.ry}`).join(' '));
