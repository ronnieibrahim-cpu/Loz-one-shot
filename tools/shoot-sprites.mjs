// One contact-sheet PNG per `src/data/sprites-*.js` file, at 1x and 3x, so a
// person can look at every sprite the game can draw without hunting through
// twelve data files or playing far enough to trigger each state.
//
// WHY THIS EXISTS. `docs/prompts/STATE.md`'s art-provenance objective needs
// a person to look at every sprite before tagging how it was made — the same
// argument `shoot-rooms.mjs` and `shoot-player.mjs` already make for rooms
// and Link's own states: a checker can prove a name is registered and drawn,
// never whether it is the RIGHT picture.
//
// It draws through the real Sheet (`src/gfx/art.js`'s `sprites` singleton),
// loaded by `import()`ing the same module URL the game's own `main.js`
// already loaded — so this is the exact cache the game draws from, not a
// second decoder that could drift from it. The list of names per file is
// read from each file's own source text (the same two-space-indent entry
// convention `tools/check-drift.mjs` already reads), then cross-checked
// against `sprites.names()` so a name present in a file but never actually
// registered is reported rather than silently skipped.
//
//   node tools/shoot-sprites.mjs                # every file, both scales
//   node tools/shoot-sprites.mjs sprites-npcs.js # one file only
//
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { extname, join, resolve, basename } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
               '.png': 'image/png', '.json': 'application/json' };
const SHOT_DIR = join(ROOT, 'tools/shots');

const SPRITE_FILES = [
  'sprites-bosses.js', 'sprites-enemies.js', 'sprites-enemy-hurt.js', 'sprites-fairies.js',
  'sprites-gear.js', 'sprites-hud.js', 'sprites-link.js', 'sprites-npcs.js',
  'sprites-player.js', 'sprites-races.js', 'sprites-title.js', 'sprites-trade.js',
  'sprites-world.js',
];
const ONLY = process.argv.slice(2).filter(a => !a.startsWith('--'));
const files = ONLY.length ? SPRITE_FILES.filter(f => ONLY.includes(f)) : SPRITE_FILES;

// Entry keys, in file order. Same line shape check-drift.mjs's sprite-provenance
// census matches: two spaces deep, `name:` followed by an object, template
// literal or array opener. That shape is NOT unique to a sprite's own art
// entry, though — `sprites-npcs.js` (and others) register a same-named
// PALETTE object lower in the same file (`npc_child: ['#ffd3...', ...]`),
// which matches identically and would otherwise draw every such sprite
// twice under one name. Deduping here, keeping the first (the actual art
// entry, which always precedes the palette table in every file checked),
// is a rendering-order fix for this tool, not a claim about what
// check-drift.mjs's own total should count — that regex is shared on
// purpose (see the module header) and its own census is a different
// question left for whoever does the provenance tagging.
const ENTRY_RE = /^  ([A-Za-z0-9_]+):\s*[{`[]/;
async function entryNames(file) {
  let text;
  try { text = await readFile(resolve(ROOT, 'src/data', file), 'utf8'); }
  catch (e) { return []; }
  const names = [];
  const seen = new Set();
  for (const line of text.split('\n')) {
    const m = line.match(ENTRY_RE);
    if (m && !seen.has(m[1])) { names.push(m[1]); seen.add(m[1]); }
  }
  return names;
}

const server = createServer(async (req, res) => { try {
  const p = join(ROOT, decodeURIComponent(req.url.split('?')[0]) === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0]));
  const b = await readFile(p);
  res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' });
  res.end(b);
} catch { res.writeHead(404); res.end('not found'); } });
await new Promise(r => server.listen(0, r));
const port = server.address().port;

mkdirSync(SHOT_DIR, { recursive: true });

let browser;
try { browser = await chromium.launch(); }
catch (e) { browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); }
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
await page.goto(`http://localhost:${port}/index.html`);
await page.waitForFunction(() => !!window.__game, { timeout: 15000 });

// The live registry, via the exact module URL main.js already loaded — same
// singleton, same bake cache, not a fresh import with its own state.
const registered = await page.evaluate(async () => {
  const { sprites } = await import('/src/gfx/art.js');
  window.__sprites = sprites;
  return sprites.names();
});
const registeredSet = new Set(registered);

let totalDrawn = 0;
const missing = []; // in a file's text but never registered
for (const file of files) {
  const names = (await entryNames(file)).filter(n => {
    if (registeredSet.has(n)) return true;
    missing.push(`${file}: ${n}`);
    return false;
  });
  if (!names.length) { console.log(`  skip  ${file} (no registered entries found)`); continue; }

  for (const scale of [1, 3]) {
    const dataUrl = await page.evaluate(async ({ names, scale }) => {
      const sprites = window.__sprites;
      const PAD = 6, FONT_PX = 10, LABEL_H = FONT_PX + 4;
      const COLS = Math.min(10, Math.max(1, Math.ceil(Math.sqrt(names.length))));
      const sizes = names.map(n => sprites.size(n));
      const maxSpriteW = Math.max(...sizes.map(s => s.w)) * scale;
      const maxSpriteH = Math.max(...sizes.map(s => s.h)) * scale;
      // Measure labels at their real render size FIRST, so a long name (not the
      // sprite) can be what actually sets the column width — a label clipped by
      // its own cell reads as two overlapping words, not as a shorter name.
      const probe = document.createElement('canvas').getContext('2d');
      probe.font = `${FONT_PX}px monospace`;
      const maxLabelW = Math.max(...names.map(n => probe.measureText(n).width));
      const cellW = Math.max(maxSpriteW, maxLabelW) + PAD * 2;
      const cellH = maxSpriteH + PAD * 2 + LABEL_H;
      const rows = Math.ceil(names.length / COLS);
      const canvas = document.createElement('canvas');
      canvas.width = COLS * cellW;
      canvas.height = rows * cellH;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#2a2a3a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${FONT_PX}px monospace`;
      ctx.fillStyle = '#e0e0e0';
      ctx.textAlign = 'center';
      names.forEach((name, i) => {
        const col = i % COLS, row = Math.floor(i / COLS);
        const cx = col * cellW, cy = row * cellH;
        const baked = sprites.bake(name);
        const w = baked.width * scale, h = baked.height * scale;
        const dx = cx + Math.floor((cellW - w) / 2);
        const dy = cy + PAD + (maxSpriteH - h);
        ctx.strokeStyle = '#4a4a5a';
        ctx.strokeRect(cx + 0.5, cy + 0.5, cellW - 1, cellH - 1);
        ctx.drawImage(baked, dx, dy, w, h);
        ctx.fillText(name, cx + cellW / 2, cy + cellH - 4);
      });
      return canvas.toDataURL('image/png');
    }, { names, scale });
    const base = basename(file, '.js');
    const out = join(SHOT_DIR, `${base}-${scale}x.png`);
    writeFileSync(out, Buffer.from(dataUrl.split(',')[1], 'base64'));
  }
  totalDrawn += names.length;
  console.log(`  ok    ${file}  ${names.length} sprite(s) -> ${basename(file, '.js')}-1x.png, -3x.png`);
}

await browser.close();
server.close();

console.log(`\n${totalDrawn} sprite(s) drawn across ${files.length} file(s), ${registered.length} registered in the live Sheet.`);
if (missing.length) {
  console.log(`${missing.length} name(s) found in a file's own text but never registered in the Sheet (not drawn):`);
  for (const m of missing) console.log(`  ${m}`);
}
console.log(`wrote contact sheets to ${SHOT_DIR}`);
