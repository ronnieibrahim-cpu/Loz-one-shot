// Turn the raw captures (tools/guide/capture.mjs) into the guide's figures:
// scaled up with nearest-neighbour (never smoothed) and marked up with
// arrows, numbered circles, boxes and labels in one loud magenta that no
// Game Boy Color palette in the game uses, so markup can never be mistaken
// for game art. Figures are declared in tools/guide/figures.mjs.
//
// Coordinates in a figure are ROOM TILES ([tx, ty], centre of the tile, and
// fractions are fine). The tool turns them into pixels itself — through the
// camera for a 160x144 screen shot, straight for a whole-room picture, and
// through each room's place on the map for a stitched dungeon map — so a
// figure says "the block at 2,4" and not a pixel it had to work out by hand.
//
//   node tools/guide/annotate.mjs [--only=prefix] [--raw=dir] [--out=dir]
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { encodePNG } from './png.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const args = process.argv.slice(2);
const opt = (k, d) => { const a = args.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const RAW = resolve(opt('raw', join(ROOT, 'tools/guide/raw')));
const OUT = resolve(opt('out', join(ROOT, 'docs/guide/img')));
const ONLY = opt('only', '');
await mkdir(OUT, { recursive: true });
const { FIGURES } = await import(HERE + '/figures.mjs?' + Date.now());

const TILE = 16, HUD = 16, CELL_W = 240, CELL_H = 176;
const TRAIL = existsSync(join(RAW, 'trail.json')) ? JSON.parse(await readFile(join(RAW, 'trail.json'), 'utf8')) : [];

async function loadRaw(id) {
  const png = join(RAW, id + '.png'), js = join(RAW, id + '.json');
  if (!existsSync(png)) throw new Error('no raw capture ' + id);
  return { d: 'data:image/png;base64,' + (await readFile(png)).toString('base64'),
    meta: JSON.parse(await readFile(js, 'utf8')) };
}

// Resolve a figure into: a list of source images placed on a canvas (in
// source pixels), a function from [tx,ty] (optionally with a room) to canvas
// pixels, and the canvas size.
async function plan(fig) {
  if (fig.map) {
    // A stitched dungeon map: `rooms` are raw ids of whole-room pictures.
    const srcs = [];
    for (const id of fig.map.rooms) srcs.push(await loadRaw(id));
    const rxs = [], rys = [];
    for (const s of srcs) { const [, rx, ry] = s.meta.room.split(',').map(Number); rxs.push(rx); rys.push(ry); }
    const minX = Math.min(...rxs), minY = Math.min(...rys);
    const CELL_W = Math.min(...srcs.map(s => s.meta.w)), CELL_H = Math.min(...srcs.map(s => s.meta.h));
    const place = srcs.map((s, i) => ({ d: s.d, x: (rxs[i] - minX) * CELL_W, y: (rys[i] - minY) * CELL_H }));
    const w = Math.max(...place.map((p, i) => p.x + srcs[i].meta.w));
    const h = Math.max(...place.map((p, i) => p.y + srcs[i].meta.h));
    const at = (t) => {
      const [rx, ry, tx, ty] = t;
      return [(rx - minX) * CELL_W + tx * TILE + 8, (ry - minY) * CELL_H + ty * TILE + 8];
    };
    const mapId = srcs[0].meta.map, floor = Number(srcs[0].meta.room.split(',')[0]);
    const owned = new Map();
    srcs.forEach((s, i) => owned.set(s.meta.room, [rxs[i], rys[i]]));
    // A wide room answers for every cell it covers, so a footstep in its
    // east half (recorded against the room's own key) still lands.
    const trailXY = (t) => {
      const [, m, f, rx, ry, x, y] = t;
      if (m !== mapId || f !== floor || !owned.has(f + ',' + rx + ',' + ry)) return null;
      return [(rx - minX) * CELL_W + x + 8, (ry - minY) * CELL_H + y + 12];
    };
    return { place, w, h, at, crop: null, trailXY };
  }
  const s = await loadRaw(fig.src);
  const m = s.meta;
  const at = m.whole
    ? (t) => [t[0] * TILE + 8, t[1] * TILE + 8]
    : (t) => [t[0] * TILE + 8 - m.cam.x, t[1] * TILE + 8 - m.cam.y + HUD];
  const trailXY = (t) => {
    const [, mp, f, rx, ry, x, y] = t;
    if (mp !== m.map || (f + ',' + rx + ',' + ry) !== m.room) return null;
    return m.whole ? [x + 8, y + 12] : [x + 8 - m.cam.x, y + 12 - m.cam.y + HUD];
  };
  return { place: [{ d: s.d, x: 0, y: 0 }], w: m.w, h: m.h, at, meta: m, trailXY };
}

const browser = await chromium.launch().catch(() =>
  chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' }));
const page = await browser.newPage();

let made = 0;
for (const fig of FIGURES.filter(f => !ONLY || f.out.startsWith(ONLY))) {
  let p;
  try { p = await plan(fig); } catch (e) { console.log('  MISS', fig.out, e.message); continue; }
  const scale = fig.scale || 3;
  // Crop in source pixels: [x, y, w, h], or tiles via cropTiles [tx0,ty0,tx1,ty1].
  let crop = fig.crop || null;
  if (fig.cropTiles) {
    const [a, b, c, d] = fig.cropTiles;
    crop = [a * TILE, b * TILE, (c - a + 1) * TILE, (d - b + 1) * TILE];
  }
  // Resolve every mark to source pixels here, where `at` lives.
  const R = (t) => p.at(t);
  const marks = (fig.marks || []).map(m => {
    const o = { ...m };
    if (m.trail) {
      // Footsteps between two directives, split wherever they jump (a door,
      // a warp, a stair), thinned so the line reads as a route, not a scribble.
      const segs = []; let cur = [];
      for (const t of TRAIL) {
        if (t[0] < m.trail.from || t[0] > m.trail.to) continue;
        const q = p.trailXY(t);
        if (!q) { if (cur.length) segs.push(cur); cur = []; continue; }
        const last = cur[cur.length - 1];
        if (last && Math.hypot(q[0] - last[0], q[1] - last[1]) > 40) { segs.push(cur); cur = []; }
        if (!last || Math.hypot(q[0] - last[0], q[1] - last[1]) >= (m.trail.every || 6)) cur.push(q);
      }
      if (cur.length) segs.push(cur);
      o.trail = segs.filter(sg => sg.length > 1);
    }
    for (const k of ['at', 'ring', 'to', 'from']) if (m[k]) o[k] = R(m[k]);
    if (m.path) o.path = m.path.map(R);
    // Raw source pixels, for pointing at the HUD and other things that are
    // not on the room's tile grid.
    if (m.atpx) o.at = m.atpx;
    if (m.ringpx) o.ring = m.ringpx;
    if (m.pathpx) o.path = m.pathpx;
    if (m.boxpx) o.box = m.boxpx;
    if (m.box) { const a = R(m.box.slice(0, m.box.length / 2)), b = R(m.box.slice(m.box.length / 2)); o.box = [a[0] - 8, a[1] - 8, b[0] + 8, b[1] + 8]; }
    return o;
  });
  const url = await page.evaluate(async ({ place, w, h, scale, crop, marks }) => {
    const imgs = await Promise.all(place.map(pl => new Promise(r => { const im = new Image(); im.onload = () => r(im); im.src = pl.d; })));
    const base = document.createElement('canvas'); base.width = w; base.height = h;
    const bx = base.getContext('2d'); bx.imageSmoothingEnabled = false;
    bx.fillStyle = '#000'; bx.fillRect(0, 0, w, h);
    imgs.forEach((im, i) => bx.drawImage(im, place[i].x, place[i].y));
    const [cx, cy, cw, ch] = crop || [0, 0, w, h];
    const c = document.createElement('canvas'); c.width = cw * scale; c.height = ch * scale;
    const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    x.drawImage(base, cx, cy, cw, ch, 0, 0, cw * scale, ch * scale);
    const S = (pt) => [(pt[0] - cx) * scale, (pt[1] - cy) * scale];
    const K = Math.max(1, scale / 3);            // stroke unit: 1 at 3x
    const INK = '#c8ff00', DARK = '#000000', LIGHT = '#000000';
    const font = (px) => `bold ${px}px "DejaVu Sans", "Liberation Sans", sans-serif`;
    function stroke2(draw, wid) {
      x.lineCap = 'round'; x.lineJoin = 'round';
      x.strokeStyle = DARK; x.lineWidth = wid + 4 * K; draw(); x.stroke();
      x.strokeStyle = INK; x.lineWidth = wid; draw(); x.stroke();
    }
    function head(a, b, wid) {
      const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = 9 * wid / 2.2 * K + 8;
      const tri = () => { x.beginPath(); x.moveTo(b[0], b[1]);
        x.lineTo(b[0] - L * Math.cos(ang - 0.5), b[1] - L * Math.sin(ang - 0.5));
        x.lineTo(b[0] - L * Math.cos(ang + 0.5), b[1] - L * Math.sin(ang + 0.5)); x.closePath(); };
      x.lineJoin = 'round'; x.strokeStyle = DARK; x.lineWidth = 4 * K; tri(); x.stroke();
      x.fillStyle = INK; tri(); x.fill();
    }
    function badge(pt, txt, r) {
      r = r || 15 * K;
      x.beginPath(); x.arc(pt[0], pt[1], r + 2.5 * K, 0, 7); x.fillStyle = DARK; x.fill();
      x.beginPath(); x.arc(pt[0], pt[1], r, 0, 7); x.fillStyle = INK; x.fill();
      x.lineWidth = 1.5 * K; x.strokeStyle = LIGHT; x.stroke();
      x.fillStyle = LIGHT; x.font = font(Math.round((String(txt).length > 1 ? 18 : 22) * K));
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(txt), pt[0], pt[1] + 1 * K);
    }
    function pill(pt, txt, anchor, size) {
      const fs = Math.round((size || 14) * 1.45 * K);
      x.font = font(fs);
      const lines = String(txt).split('\n');
      const tw = Math.max(...lines.map(l => x.measureText(l).width)) + 12 * K, th = fs * 1.25 * lines.length + 6 * K;
      let [px, py] = pt;
      const a = anchor || 'c';
      if (a.includes('n')) py -= th; if (a.includes('s')) py += 0; if (!a.includes('n') && !a.includes('s')) py -= th / 2;
      if (a.includes('w')) px -= tw; if (a.includes('e')) px += 0; if (!a.includes('w') && !a.includes('e')) px -= tw / 2;
      px = Math.max(2, Math.min(c.width - tw - 2, px)); py = Math.max(2, Math.min(c.height - th - 2, py));
      x.fillStyle = DARK; x.beginPath(); x.roundRect(px - 2 * K, py - 2 * K, tw + 4 * K, th + 4 * K, 7 * K); x.fill();
      x.fillStyle = INK; x.beginPath(); x.roundRect(px, py, tw, th, 5 * K); x.fill();
      x.fillStyle = LIGHT; x.textAlign = 'left'; x.textBaseline = 'top';
      lines.forEach((l, i) => x.fillText(l, px + 6 * K, py + 3 * K + i * fs * 1.25 + 1));
    }
    for (const m of marks) {
      const wid = (m.w || 4) * K;
      if (m.trail) {
        for (const sg of m.trail) {
          const pts = sg.map(S);
          stroke2(() => { x.beginPath(); pts.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); }, wid);
          // A chevron at the end of every leg says which way it was walked.
          if (pts.length > 2 && m.heads !== false) head(pts[pts.length - 3], pts[pts.length - 1], wid);
        }
      }
      if (m.path) {
        const pts = m.path.map(S);
        if (m.dash) x.setLineDash([10 * K, 8 * K]);
        stroke2(() => { x.beginPath(); pts.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); }, wid);
        x.setLineDash([]);
        if (m.head !== false) head(pts[pts.length - 2], pts[pts.length - 1], wid);
      }
      if (m.ring) {
        const q = S(m.ring), r = (m.r || 13) * scale / 1.6;
        stroke2(() => { x.beginPath(); x.arc(q[0], q[1], r, 0, 7); }, 3.5 * K);
      }
      if (m.box) {
        const a = S([m.box[0], m.box[1]]), b = S([m.box[2], m.box[3]]);
        x.setLineDash(m.solid ? [] : [9 * K, 6 * K]);
        stroke2(() => { x.beginPath(); x.rect(a[0], a[1], b[0] - a[0], b[1] - a[1]); }, 3 * K);
        x.setLineDash([]);
      }
      if (m.n != null && m.at) {
        const q = S(m.at);
        const off = m.off || [0, 0];
        badge([q[0] + off[0] * scale, q[1] + off[1] * scale], m.n);
      }
      if (m.text && m.at && m.n == null) {
        const q = S(m.at); const off = m.off || [0, 0];
        pill([q[0] + off[0] * scale, q[1] + off[1] * scale], m.text, m.anchor, m.size);
      }
      if (m.tag) {
        // A corner caption, e.g. the tide the picture was taken at.
        x.font = font(Math.round(21 * K));
        const tw = x.measureText(m.tag).width + 16 * K, th = 32 * K;
        const px = (m.corner || 'tr').includes('r') ? c.width - tw - 6 * K : 6 * K;
        const py = (m.corner || 'tr').includes('b') ? c.height - th - 6 * K : ((m.corner || 'tr').includes('t') && m.belowHud ? 16 * scale + 6 * K : 6 * K);
        x.fillStyle = DARK; x.beginPath(); x.roundRect(px - 2 * K, py - 2 * K, tw + 4 * K, th + 4 * K, 7 * K); x.fill();
        x.fillStyle = '#ffffff'; x.beginPath(); x.roundRect(px, py, tw, th, 5 * K); x.fill();
        x.fillStyle = DARK; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillText(m.tag, px + 7 * K, py + th / 2 + 1);
      }
    }
    const data = x.getImageData(0, 0, c.width, c.height).data;
    let bin = '';
    for (let i = 0; i < data.length; i += 0x8000) bin += String.fromCharCode.apply(null, data.subarray(i, i + 0x8000));
    return { w: c.width, h: c.height, px: btoa(bin) };
  }, { place: p.place, w: p.w, h: p.h, scale, crop, marks });
  await writeFile(join(OUT, fig.out + '.png'), encodePNG(Buffer.from(url.px, 'base64'), url.w, url.h));
  made++;
}
console.log(`wrote ${made} figure(s) to ${OUT}`);
await browser.close();
