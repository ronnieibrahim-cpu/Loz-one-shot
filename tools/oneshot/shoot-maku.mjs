// Photograph the Maku Tree's faces in the game (S252). Asserts nothing.
//   node tools/oneshot/shoot-maku.mjs <outDir>
// Writes rest/talk/open/happy PNGs (3x), and talk-NN.png frames of her box
// typing, which `maku-talk.gif` is cut from (python3 -c, see the brief).
import { createServer } from 'node:http';
import { readFile, stat, writeFile, mkdir } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = process.argv[2];
await mkdir(outDir, { recursive: true });
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const full = join(ROOT, normalize(p)); const s = await stat(full).catch(() => null);
  if (!s || !s.isFile()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': extname(full) === '.html' ? 'text/html' : 'text/javascript' }); res.end(await readFile(full));
});
await new Promise(r => server.listen(0, r));
const browser = await chromium.launch().catch(() => chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }));
const page = await browser.newPage();
page.on('console', m => console.log(m.text()));
await page.goto(`http://localhost:${server.address().port}/index.html?seed=20260806`);
await page.waitForFunction(() => !!window.__game && !!window.__harness);
const shots = await page.evaluate(async () => {
  const g = window.__game, H = window.__harness; H.takeOver();
  g.newGame(0, 'LINK', 20260806); g.mode = 'play';
  g.enterMap('houseMaku', 0, 0, 0, 72, 96, 'up', { instant: true });
  H.step(300); g.player.x = 72; g.player.y = 56; H.step(2);
  const tree = g.entities.find(e => e.constructor.name === 'MakuTree');
  const out = {};
  const grab = (k) => {
    g.draw();
    const src = g.screen.canvas || document.querySelector('canvas');
    const c = document.createElement('canvas'); c.width = src.width * 3; c.height = src.height * 3;
    const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(src, 0, 0, c.width, c.height);
    out[k] = c.toDataURL('image/png');
  };
  grab('rest');
  // each face forced, to look at the seams
  const real = tree.faceNow;
  for (const f of ['talk', 'open', 'happy']) { tree.faceNow = () => 'maku_face_' + f; grab(f); }
  tree.faceNow = real;
  // her box typing, then waiting
  g.say('Hoo hoo! Little wader, you have come a long way to find me. Listen well, for the tide has a great deal to teach you about the bells.');
  for (let i = 0; i < 70; i++) {
    H.step(1);
    if (i % 2 === 0) grab('talk-' + String(i / 2).padStart(2, '0') + '-' + tree.faceNow(g).replace('maku_face', 'rest'));
  }
  return out;
});
for (const [k, v] of Object.entries(shots)) await writeFile(join(outDir, k + '.png'), Buffer.from(v.split(',')[1], 'base64'));
console.log('wrote', Object.keys(shots).length);
await browser.close(); server.close();
