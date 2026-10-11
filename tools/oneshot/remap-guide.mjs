// Move the guide's route step numbers (tools/guide/shots.mjs `after`/`by`,
// tools/guide/figures.mjs trail `from`/`to`) from the ROUTE at a commit to
// today's, by a longest-common-subsequence match of the two directive lists
// — the way S159, S178 and S183 did it by hand. A directive that changed maps
// to the slot it replaced; one that was deleted maps to the next survivor.
//
//   node tools/oneshot/remap-guide.mjs <rev>     rev = where the numbers were right
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const rev = process.argv[2];
if (!rev) throw new Error('usage: remap-guide.mjs <rev>');
const dir = mkdtempSync(join(tmpdir(), 'remap-'));
const oldSrc = execSync(`git -C ${ROOT} show ${rev}:tools/playthrough-route.mjs`, { encoding: 'utf8' })
  .replace(/from '\.\.\/src\//g, `from '${ROOT}/src/`).replace(/from '\.\//g, `from '${ROOT}/tools/`);
writeFileSync(join(dir, 'old.mjs'), oldSrc);
const OLD = (await import(join(dir, 'old.mjs'))).ROUTE;
const NEW = (await import(join(ROOT, 'tools/playthrough-route.mjs'))).ROUTE;
const a = OLD.map(d => JSON.stringify(d)), b = NEW.map(d => JSON.stringify(d));
const n = a.length, m = b.length;
const L = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) {
  L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
}
const map = new Array(n + 1).fill(-1);
let i = 0, j = 0;
while (i < n && j < m) {
  if (a[i] === b[j]) { map[i] = j; i++; j++; }
  else if (L[i + 1][j] >= L[i][j + 1]) { map[i] = -1; i++; }
  else j++;
}
map[n] = m;
// Unmatched: the next matched index after it (a deleted/changed directive's
// slot is taken by what follows it).
for (let k = n - 1; k >= 0; k--) if (map[k] < 0) map[k] = map[k + 1];
let changed = 0;
const move = (num) => { const v = map[num]; if (v !== num) changed++; return v; };
for (const [file, re] of [
  ['tools/guide/shots.mjs', /\b(after|by): (\d+)/g],
  ['tools/guide/figures.mjs', /\b(from|to): (\d+)/g],
]) {
  const p = join(ROOT, file);
  const s = readFileSync(p, 'utf8').replace(re, (_, k, v) => `${k}: ${move(+v)}`);
  writeFileSync(p, s);
}
console.log(`old ${n} directives, new ${m}, common ${L[0][0]}; ${changed} numbers moved`);
