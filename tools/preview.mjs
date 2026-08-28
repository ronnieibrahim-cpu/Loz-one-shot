// Render a sprite pack to a PNG contact sheet so art can actually be looked at.
//
//   node tools/preview.mjs bosses            one pack from sprite-manifest.js
//   node tools/preview.mjs link fx ui        several packs
//   node tools/preview.mjs --tiles           the background tile art instead
//   node tools/preview.mjs bosses --scale=6  bigger cells
//
// Writes tools/shots/preview-<name>.png.

import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const args = process.argv.slice(2);
const flag = (n, d) => {
  const a = args.find(v => v.startsWith('--' + n + '='));
  return a ? a.slice(n.length + 3) : d;
};
const SCALE = Number(flag('scale', 4));
const OUT = resolve(HERE, flag('out', 'shots'));
const TILES = args.includes('--tiles');
const packs = args.filter(a => !a.startsWith('--'));

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
  // Fall back to a system Chromium when the installed browser build does not
  // match the installed playwright package (see check-build.mjs / test.mjs).
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

  const names = packs.length ? packs : (TILES ? ['__tiles'] : ['link']);
  for (const pack of names) {
    const info = await page.evaluate(async ({ pack, scale, tiles }) => {
      const artMod = await import('/src/gfx/art.js');
      const man = await import('/src/data/sprite-manifest.js');
      const sheet = tiles ? artMod.tiles : artMod.sprites;
      const list = tiles ? sheet.names() : (man.REQUIRED_SPRITES[pack] || []);
      if (!list.length) return { error: 'no such pack: ' + pack };

      // Lay out a grid with a caption under each cell.
      const cell = 40, cols = Math.min(12, Math.ceil(Math.sqrt(list.length)) + 2);
      const rows = Math.ceil(list.length / cols);
      const c = document.createElement('canvas');
      c.width = cols * cell; c.height = rows * cell;
      const x = c.getContext('2d');
      x.imageSmoothingEnabled = false;
      x.fillStyle = '#202830';
      x.fillRect(0, 0, c.width, c.height);
      let missing = 0;
      list.forEach((name, i) => {
        const cx = (i % cols) * cell, cy = Math.floor(i / cols) * cell;
        x.fillStyle = (i % 2) ? '#28323c' : '#222b34';
        x.fillRect(cx, cy, cell, cell);
        if (!sheet.has(name)) missing++;
        const sz = sheet.size(name);
        const ox = cx + Math.round((cell - (sz.w || 16)) / 2);
        const oy = cy + Math.round((cell - (sz.h || 16)) / 2);
        sheet.draw(x, name, ox, oy, {});
      });
      // Upscale with nearest neighbour so pixels stay crisp.
      const big = document.createElement('canvas');
      big.width = c.width * scale; big.height = c.height * scale;
      const bx = big.getContext('2d');
      bx.imageSmoothingEnabled = false;
      bx.drawImage(c, 0, 0, big.width, big.height);
      document.body.innerHTML = '';
      document.body.style.margin = '0';
      document.body.style.background = '#202830';
      big.id = 'sheet';
      document.body.appendChild(big);
      return { count: list.length, missing, w: big.width, h: big.height };
    }, { pack, scale: SCALE, tiles: TILES });

    if (info.error) { console.error(info.error); continue; }
    const el = await page.$('#sheet');
    const file = join(OUT, `preview-${pack}.png`);
    await el.screenshot({ path: file });
    console.log(`${pack}: ${info.count} sprites, ${info.missing} missing -> ${file}`);
  }

  await browser.close();
  server.close();
};

main().catch(e => { console.error(e); process.exit(2); });
