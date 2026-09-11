// Contact sheets of every sprite the engine can draw, so an art-provenance
// tag can be checked against the actual pixels rather than taken on faith.
//
// `tools/preview.mjs` already renders a pack to a PNG, but with no per-cell
// label and only one scale per run — fine for "does this pack look right",
// not for "which exact entry is this frame, at both the size a player sees
// it and a size big enough to judge its outline and colour." This tool
// covers every pack in `src/data/sprite-manifest.js` (which is every sprite
// name the engine actually asks for, `enemies` included — the walk-cycle
// frames ARE its only animation state today; see check-drift.mjs's own
// "0 of 22 complete" line), draws each with the real `sprites.draw()` used
// in play, labels it with its name, and writes one 1x sheet and one 3x
// sheet PER PACK — one combined image would be either too small to read a
// label at 561 entries, or too large to open, so this splits by pack
// instead, the same unit `tools/preview.mjs` already uses.
//
//   node tools/shoot-sprites.mjs              every pack, both scales
//   node tools/shoot-sprites.mjs enemies npcs   only these packs
//
// Writes tools/shots/sprite-sheet-<pack>-1x.png and -3x.png.

import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const OUT = resolve(HERE, 'shots');
const args = process.argv.slice(2);
const only = args.filter(a => !a.startsWith('--'));

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript' };

function serve(port) {
  const s = createServer(async (req, res) => {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const full = join(ROOT, normalize(p).replace(/^(\.\.[/\\])+/, ''));
    const st = await stat(full).catch(() => null);
    if (!st || !st.isFile()) { res.writeHead(404).end('nf'); return; }
    res.writeHead(200, { 'Content-Type': MIME[extname(full)] || 'application/octet-stream' });
    res.end(await readFile(full));
  });
  return new Promise(r => s.listen(port, () => r(s)));
}

async function loadPlaywright() {
  let mod;
  try { mod = await import('playwright'); } catch (e) {
    const { execSync } = await import('node:child_process');
    mod = await import(join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'playwright', 'index.js'));
  }
  return mod.chromium ? mod : mod.default;
}

const main = async () => {
  const { chromium } = await loadPlaywright();
  const PORT = 20000 + Math.floor(Math.random() * 20000);
  const server = await serve(PORT);
  const browser = await chromium.launch({ headless: true }).catch(async (err) => {
    const { existsSync } = await import('node:fs');
    const fallback = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium';
    if (!existsSync(fallback)) throw err;
    return chromium.launch({ headless: true, executablePath: fallback });
  });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  page.on('pageerror', e => console.error('PAGEERROR', e.message));
  await mkdir(OUT, { recursive: true });

  await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__game, { timeout: 15000 });

  const packNames = await page.evaluate(async () => {
    const man = await import('/src/data/sprite-manifest.js');
    return Object.keys(man.REQUIRED_SPRITES);
  });
  const packs = only.length ? only : packNames;

  let total = 0, files = 0;
  for (const pack of packs) {
    if (!packNames.includes(pack)) { console.error(`no such pack: ${pack}`); continue; }
    for (const scale of [1, 3]) {
      const info = await page.evaluate(async ({ pack, scale }) => {
        const artMod = await import('/src/gfx/art.js');
        const man = await import('/src/data/sprite-manifest.js');
        const list = man.REQUIRED_SPRITES[pack] || [];
        if (!list.length) return { error: 'empty pack: ' + pack };

        // Cell = biggest expected size in the pack (bosses/minis are larger
        // than 16x16), plus room for a name label below.
        const sizes = list.map(n => man.expectedSize(n));
        const cw = Math.max(...sizes.map(s => s[0]), 16);
        const ch = Math.max(...sizes.map(s => s[1]), 16);
        const labelH = 9; // one line of 7px text, unscaled
        const padX = 4, padY = 4;
        const cellW = (cw + padX) * scale;
        const cellH = (ch + padY) * scale + labelH;
        const cols = Math.min(10, Math.ceil(Math.sqrt(list.length)) + 2);
        const rows = Math.ceil(list.length / cols);

        const c = document.createElement('canvas');
        c.width = cols * cellW; c.height = rows * cellH;
        const x = c.getContext('2d');
        x.imageSmoothingEnabled = false;
        x.fillStyle = '#202830';
        x.fillRect(0, 0, c.width, c.height);

        let missing = 0;
        list.forEach((name, i) => {
          const cx = (i % cols) * cellW, cy = Math.floor(i / cols) * cellH;
          x.fillStyle = (i % 2) ? '#28323c' : '#222b34';
          x.fillRect(cx, cy, cellW, cellH);
          if (!artMod.sprites.has(name)) missing++;

          // Draw the sprite scaled up via an intermediate canvas so the
          // pixels stay crisp (drawImage with a fractional scale on the
          // final canvas would blur them even with smoothing off, because
          // the sprite draw itself is 1:1 into `c`).
          const sz = artMod.sprites.size(name);
          const sw = sz.w || 16, sh = sz.h || 16;
          const tmp = document.createElement('canvas');
          tmp.width = sw; tmp.height = sh;
          const tx = tmp.getContext('2d');
          tx.imageSmoothingEnabled = false;
          artMod.sprites.draw(tx, name, 0, 0, {});
          const dw = sw * scale, dh = sh * scale;
          const dx = cx + Math.round(((cw + padX) * scale - dw) / 2);
          const dy = cy + Math.round((ch * scale - dh) / 2) + (padY * scale) / 2;
          x.drawImage(tmp, 0, 0, sw, sh, dx, dy, dw, dh);

          // Label: the sprite name, clipped to the cell width.
          x.fillStyle = '#e8e8e0';
          x.font = '7px monospace';
          x.textBaseline = 'top';
          const label = name.length > 18 ? name.slice(0, 17) + '…' : name;
          x.fillText(label, cx + 2, cy + cellH - labelH + 1, cellW - 4);
        });

        document.body.innerHTML = '';
        document.body.style.margin = '0';
        document.body.style.background = '#202830';
        c.id = 'sheet';
        document.body.appendChild(c);
        return { count: list.length, missing, w: c.width, h: c.height };
      }, { pack, scale });

      if (info.error) { console.error(info.error); continue; }
      const el = await page.$('#sheet');
      const file = join(OUT, `sprite-sheet-${pack}-${scale}x.png`);
      await el.screenshot({ path: file });
      console.log(`${pack} @${scale}x: ${info.count} sprites, ${info.missing} missing -> ${file}`);
      if (scale === 1) total += info.count;
      files++;
    }
  }

  console.log(`\n${total} sprite entries across ${packs.length} packs, ${files} sheet(s) written to ${OUT}`);

  await browser.close();
  server.close();
};

main().catch(e => { console.error(e); process.exit(2); });
