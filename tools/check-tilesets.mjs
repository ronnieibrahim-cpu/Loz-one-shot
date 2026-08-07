// Proves the dungeon-map tilesets in assets/tilesets/ are reproducible.
//
// P7.5 step 7. The tileset PNG and its JSON manifest are GENERATED files and
// carry the same rule as every other generated file in this repo: you change
// the tool and re-emit, never the output. This is what notices when someone
// has not — and it is also what notices a change to the ripper that silently
// re-orders or re-crops what comes out.
//
// It re-runs the ripper and diffs. Pillow is required (`pip install pillow`);
// without it the checker says so and skips rather than passing quietly, since
// "the tool did not run" and "the output matched" must never look the same.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'assets', 'tilesets');

let passed = 0; const failures = [];
function check(name, cond, detail) {
  if (cond) { passed++; console.log('  ok   ' + name); }
  else { failures.push(name); console.log('  FAIL ' + name + (detail ? ' — ' + detail : '')); }
}

let hasPillow = true;
try {
  execFileSync('python3', ['-c', 'import PIL'], { stdio: 'pipe' });
} catch { hasPillow = false; }

if (!hasPillow) {
  console.log('  SKIP no Pillow — `pip install pillow` and re-run.');
  console.log('\n=== 0 passed, 0 failed (skipped: no Pillow) ===');
  process.exit(2);
}

check('assets/tilesets/ exists', existsSync(OUT));
const files = existsSync(OUT) ? readdirSync(OUT) : [];
check('a tileset PNG and manifest are committed',
  files.some(f => f.endsWith('.png')) && files.some(f => f.endsWith('.json')),
  `found [${files.join(', ')}]`);

let out = '';
let ran = true;
try {
  out = execFileSync('python3', [join(ROOT, 'tools', 'rip-dungeon-maps.py'), '--verify'],
    { cwd: ROOT, encoding: 'utf8' });
} catch (e) {
  ran = false;
  out = (e.stdout || '') + (e.stderr || '');
}
process.stdout.write(out.split('\n').map(l => l ? '       ' + l : l).join('\n'));

check('the ripper re-emits byte-identically', ran && /byte-identical/.test(out),
  out.trim().split('\n').slice(-1)[0]);

// A manifest that lost its frequency counts is a manifest that cannot tell a
// wall from a decoration, which is the only reason it exists.
if (files.some(f => f.endsWith('.json'))) {
  const { readFileSync } = await import('node:fs');
  for (const f of files.filter(f => f.endsWith('.json'))) {
    const doc = JSON.parse(readFileSync(join(OUT, f), 'utf8'));
    check(`${f}: tiles carry a frequency and a map coordinate`,
      doc.tiles.length > 0 && doc.tiles.every(t => t.count > 0 && Array.isArray(t.at)),
      `${doc.tiles.length} tiles`);
    check(`${f}: tiles are in frequency order`,
      doc.tiles.every((t, i) => i === 0 || doc.tiles[i - 1].count >= t.count));
    check(`${f}: deduplication actually deduplicated`,
      doc.unique < doc.scanned / 2, `${doc.unique} unique of ${doc.scanned} scanned`);
  }
}

console.log(`\n=== ${passed} passed, ${failures.length} failed ===`);
process.exit(failures.length ? 1 : 0);
