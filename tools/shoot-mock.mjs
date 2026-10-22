// Photograph PROPOSED rooms in the real engine before they are built. NOT a
// checker — it asserts nothing. S180 wrote it so the human could see a
// dungeon's new rooms beside the cartridge's before a line of the dungeon
// itself was changed (CLAUDE.md: show a mock first).
//
//   node tools/shoot-mock.mjs <spec.json> <outDir>
//
// spec: { legend, rooms: { name: [15 rows] }, shots: [ { room, tide,
//         anchor?: [tx, ty, level], entities?: [[kind, tx, ty, opts]], out,
//         overrides?: [{ tx, ty, r, delta, shape, dx, dy }],
//         link?: { tx, ty, dir, bellows }, tiles?: [[tx, ty, name]], toggle?: 0|1 } ] }
// A room grid wider or taller than 15x11 is drawn as a room of that many
// screens (a 45-wide grid is a 3x1 room). `overrides` lays tide overrides
// after the sea is set: a Bellows cone is { shape: 'cone', delta: -1, r: 3,
// dx, dy } from Link's tile, and a drained basin (S183's D4 mock) is a
// square of delta -1 over it.
// Each room is registered as a one-room map of its own, entered at the stated
// sea, optionally with an Anchor held at [tx, ty] at `level`, and drawn whole
// through Game.drawScene with Link left out — tools/shoot-dungeon.mjs's way.
import { createServer } from 'node:http';
import { readFile, stat, writeFile, mkdir } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { installRuntime } from './actor-runtime.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [specPath, outDir] = process.argv.slice(2);
if (!specPath || !outDir) { console.error('usage: shoot-mock.mjs <spec.json> <outDir>'); process.exit(2); }
const spec = JSON.parse(await readFile(specPath, 'utf8'));
await mkdir(outDir, { recursive: true });

const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const full = join(ROOT, normalize(p)); const s = await stat(full).catch(() => null);
  if (!s || !s.isFile()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': extname(full) === '.html' ? 'text/html' : 'text/javascript' }); res.end(await readFile(full));
});
await new Promise(r => server.listen(0, r));
const browser = await chromium.launch().catch(() =>
  chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' }));
const page = await browser.newPage();
await page.goto(`http://localhost:${server.address().port}/index.html`);
await page.waitForFunction(() => window.__game && window.__harness);
await page.evaluate(installRuntime);

for (const shot of spec.shots) {
  const url = await page.evaluate(async ([spec, shot]) => {
    const g = window.__game;
    window.__harness.takeOver();
    if (!g._mockStarted) { g.newGame(0, 'LINK', 20260930); g._mockStarted = true; }
    g.cutscene = null; g.mode = 'play'; g.dialogue.active = false;
    const { registerMap, MAPS } = await import('/src/world/maps.js');
    const id = 'mock_' + shot.room + '_' + shot.out.replace(/\W/g, '');
    if (!MAPS.get(id)) {
      registerMap({
        id, kind: 'dungeon', name: 'Mock', w: 3, h: 3, floors: 1, cell: [15, 11],
        legend: spec.legend, tint: 'cave', music: 'dungeon3',
        rooms: { '0,0,0': {
          name: shot.room, map: spec.rooms[shot.room], entities: shot.entities || [],
          ...(spec.rooms[shot.room][0].length > 15 || spec.rooms[shot.room].length > 11
            ? { size: [spec.rooms[shot.room][0].length / 15, spec.rooms[shot.room].length / 11] } : {}),
        } },
      });
    }
    g.tide.clearOverrides();
    g.tide.setLevel(shot.anchor ? shot.anchor[2] : shot.tide, { instant: true });
    g.enterMap(id, 0, 0, 0, 7 * 16, 9 * 16, 'up', { instant: true });
    if (shot.anchor) {
      const [tx, ty, level] = shot.anchor;
      const oid = g.tide.addOverride({ mapId: id, roomKey: g.room.key, tx, ty, r: 2, shape: 'square', level, src: 'anchor' });
      g.respawnAnchor();
      g.tide.setLevel(shot.tide, { instant: true });
      g.room.invalidate && g.room.invalidate();
    }
    // `tiles: [[tx, ty, name]]` lays a tile over the grid after entering — a
    // grown coral pillar (`coralPillar`) in S185's D5 mock.
    for (const [tx, ty, name] of shot.tiles || []) g.room.setTile(tx, ty, name);
    // `toggle: 1` stands the blue blocks up instead of the red (S205).
    g.tide.setToggle(shot.toggle || 0);
    for (const o of shot.overrides || []) {
      g.tide.addOverride({ mapId: id, roomKey: g.room.key, shape: 'square', ...o, src: 'mock' });
    }
    g.tide.touch();
    g.dialogue.active = false; g.bannerTime = 0;
    for (let i = 0; i < 20; i++) window.__harness.step(1);
    g.dialogue.active = false; g.bannerTime = 0;
    const r = g.room;
    const c = document.createElement('canvas'); c.width = r.pw; c.height = r.ph;
    const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false;
    // `link: { tx, ty, dir, bellows }` stands Link on a tile for the picture,
    // planted and pumping if `bellows` (the pose only: the cone is an override).
    const p = g.player;
    if (shot.link) {
      p.x = shot.link.tx * 16; p.y = shot.link.ty * 16; p.dir = shot.link.dir || 'down';
      p.bellowsT = shot.link.bellows ? 20 : 0;
    } else g.player = null;
    g.drawScene(ctx, 0, 0);
    g.player = p;
    return c.toDataURL('image/png');
  }, [spec, shot]);
  await writeFile(join(outDir, shot.out), Buffer.from(url.split(',')[1], 'base64'));
  console.log('wrote ' + shot.out);
}
await browser.close(); server.close();
