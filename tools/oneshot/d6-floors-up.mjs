// S189: the Abyssal Keep's floors move up one (the Hold goes in under them as
// floor 0), the way S181 moved the Bogwater Sanctum's. Rewrites the Keep's
// room keys, its startRoom/bossRoom, and every warp into it (in src/data) from
// floor N to N+1. Run once; it refuses to run twice (floors: 2 must be there).
import { readFileSync, writeFileSync } from 'node:fs';
const B = 'src/data/dungeons-b.js';
let s = readFileSync(B, 'utf8');
const start = s.indexOf("    id: 'd6',");
const open = s.lastIndexOf('registerMap({', start);
const next = s.indexOf('registerMap({', start);
const end = next < 0 ? s.length : next;
let body = s.slice(open, end);
if (!/w: 8, h: 8, floors: 2,/.test(body)) throw new Error('d6 is not on two floors; already moved?');
body = body.replace('w: 8, h: 8, floors: 2,', 'w: 8, h: 8, floors: 3,');
body = body.replace("bossRoom: '1,3,0',", "bossRoom: '2,3,0',");
body = body.replace("startRoom: '3,7',", "startRoom: '1,3,7',");
body = body.replace(/^(\s+)'(\d),(\d+),(\d+)': \{/gm, (m, ws, f, x, y) => `${ws}'${+f + 1},${x},${y}': {`);
s = s.slice(0, open) + body + s.slice(end);
s = s.replace(/map: 'd6', floor: (\d)/g, (m, f) => `map: 'd6', floor: ${+f + 1}`);
writeFileSync(B, s);
const O = 'src/data/overworld.js';
let o = readFileSync(O, 'utf8');
o = o.replace(/map: 'd6', floor: (\d)/g, (m, f) => `map: 'd6', floor: ${+f + 1}`);
writeFileSync(O, o);
console.log('d6 floors moved up one');
