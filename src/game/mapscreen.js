// THE MAP SCREENS, as Seasons has them (S177): SELECT out in the field.
//
// Two screens, both bank2.s runMapMenu. Out of doors (and in a house or a
// cave, which show the screen you went in from) the OVERWORLD map: the whole
// world as a grid of 8x8 squares, one per screen, with a cursor that the
// arrows move a square at a time and A asking the name of a square you have
// been to. In a dungeon the DUNGEON map: the dungeon's name box, its floor
// list, and the floor drawn as rooms showing their ways out, scrolling a
// floor at a time.
//
// Everything that is the cartridge's own is ripped (tools/rip-map.py,
// src/data/screens-map.js). The one thing that is not is the squares
// themselves: Seasons' are a hand-drawn picture of each screen of Holodrum,
// and Thalassia is not Holodrum. So each square is drawn here from its own
// screen's ground, in the colours Seasons' map squares are drawn in (MAP_INK)
// — the human's choice at S177, over keeping the old one-pixel-a-tile picture.

import { SCREEN_W, SCREEN_H } from '../core/screen.js';
import { sprites } from '../gfx/art.js';
import { drawScreen, drawObject, screenImage, hasScreen } from '../gfx/screens.js';
import { F } from '../world/tileset.js';
import { MAPS, getMap, getRoom, roomKeyAt, cellPixels } from '../world/maps.js';
import { MAP_INK, BLURB_LAYOUT, DMAP_BLACK } from '../data/screens-map.js';
import {
  MENU_AUTOFIRE_DELAY, MENU_AUTOFIRE_EVERY, MAP_ARROW_BLINK, DMAP_FLICKER, DMAP_SCROLL_ROWS,
  MAP_POPUP_STEP, MAP_POPUP_SWAP,
} from '../data/feel.js';
import { TIDE_COUNT } from './tide.js';

// The Chartstone's pips, LOW to HIGH. Sand, shallow, deep — the same three
// tones the water itself is drawn in, so the mark needs no key to read. Ours:
// Seasons' compass shows chests and the boss, and the Chartstone that
// replaced it shows what the tide moves.
const TIDE_PIP = ['#e0c078', '#58b0e0', '#1848a0'];

// ------------------------------------------------------------------ squares
//
// What a screen's tile is, as the map draws it. Water by its flags; the rest
// by the family its name says it belongs to. A name nobody listed is ground,
// drawn as sand — the commonest ground in the world.
function material(d) {
  const n = d.name || '';
  if ((d.flags | 0) & (F.WATER | F.DEEP) || /^(water|openSea|riptide|seaSnarl)/.test(n)) return 'sea';
  if (/^(tree|palm|bush)/.test(n)) return 'tree';
  if (/^(cliffCoral|ledgeCoral)/.test(n)) return 'coralDark';
  // Grey stone and the cliffs round it in slate, the salt pans in white (S178:
  // both read as earth and sand beside the screens they stand for).
  if (/^(saltFlat|saltCrust)/.test(n)) return 'salt';
  if (/^(cliffMarble|ledgeSalt)/.test(n)) return 'stone';
  if (/^(cliff|ledge)(Dk|Abyss|Rock)?([NSEW]|$)/.test(n) || /^(keepSeal|caveMouth)/.test(n)) return 'stoneDark';
  if (/^(cliff|ledge|boulder)/.test(n)) return 'dark';
  if (/^(portal|b[A-Z])/.test(n)) return 'earth';
  if (/Coral/.test(n)) return 'coral';
  if (/^rockFloor(Dk)?$/.test(n)) return 'stone';
  if (/^rockFloor/.test(n)) return 'earth';
  if (/^(grass|hLawn|flowers|hFlowers|hTall|hYard)/.test(n) || /Lawn/.test(n)) return 'grass';
  if (/^(mud|chasm)/.test(n)) return 'dark';
  return 'sand';
}
// Every screen is walled round with woods or cliff, and at seven pixels a
// screen the wall would be every square's frame — a grid of boxes inside the
// grid, where Seasons' squares run into each other as land. So a wall counts
// for a little over half what ground does: it shows where it is thick, and
// the way through it shows as the ground it is. (S177, four weights shot side
// by side; 0.6 read most like Holodrum's squares.)
const WALL = { tree: 0.6, dark: 0.6, coralDark: 0.6, stoneDark: 0.6 };
// When two materials cover a pixel equally, the first of these wins.
const ORDER = ['sea', 'tree', 'dark', 'stoneDark', 'coralDark', 'earth', 'stone', 'coral', 'grass', 'salt', 'sand'];

/** The flecks of the sea (mapSea, Ages' own open sea), as a mask. */
let FOAM = null;
function foam() {
  if (FOAM) return FOAM;
  const s = screenImage('mapSea');
  const g = s.canvas.getContext('2d').getImageData(0, 0, 8, 8).data;
  const hex = MAP_INK.foam;
  const fr = parseInt(hex.slice(1, 3), 16), fg = parseInt(hex.slice(3, 5), 16), fb = parseInt(hex.slice(5, 7), 16);
  FOAM = [];
  for (let i = 0; i < 64; i++) FOAM.push(g[i * 4] === fr && g[i * 4 + 1] === fg && g[i * 4 + 2] === fb);
  return FOAM;
}

/**
 * One screen as a 7x7 square (the eighth row and column are the grid's
 * black): each pixel is whichever material covers most of its share of the
 * screen. Sea is flecked with the cartridge's own foam, at the same place in
 * the pattern the open sea round the grid has it, so the sea in the squares
 * and the sea round them are one sea; woods are green, dotted dark.
 */
function paintSquare(g, room, tide, ox, oy) {
  const tw = room.tw, th = room.th;
  const mats = [];
  for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) mats.push(material(room.tile(x, y, tide)));
  const fm = foam();
  for (let py = 0; py < 7; py++) {
    for (let px = 0; px < 7; px++) {
      const x0 = px * tw / 7, x1 = (px + 1) * tw / 7, y0 = py * th / 7, y1 = (py + 1) * th / 7;
      const area = {};
      for (let ty = Math.floor(y0); ty < Math.ceil(y1); ty++) {
        for (let tx = Math.floor(x0); tx < Math.ceil(x1); tx++) {
          const a = (Math.min(x1, tx + 1) - Math.max(x0, tx)) * (Math.min(y1, ty + 1) - Math.max(y0, ty));
          if (a > 0) { const m = mats[ty * tw + tx]; area[m] = (area[m] || 0) + a * (WALL[m] || 1); }
        }
      }
      let best = null;
      for (const m of ORDER) if (area[m] && (!best || area[m] > area[best] + 1e-9)) best = m;
      const gx = ox + 1 + px, gy = oy + 1 + py;
      let ink = MAP_INK[best === 'tree' ? ((gx & 1) || (gy & 1) ? 'grass' : 'dark') : best];
      if (best === 'sea' && fm[(gy & 7) * 8 + (gx & 7)]) ink = MAP_INK.foam;
      g.fillStyle = ink;
      g.fillRect(gx, gy, 1, 1);
    }
  }
}

// The whole grid, cached on the tide field's stamp (the sea is part of what a
// square shows, and an anchor moves the field under one screen).
let GRID = null, GRID_KEY = '';
function gridCanvas(game, m) {
  const key = m.id + '|' + (game.tide ? game.tide.stamp : 0);
  if (GRID && GRID_KEY === key) return GRID;
  const c = document.createElement('canvas');
  c.width = m.w * 8 + 1; c.height = m.h * 8 + 1;
  const g = c.getContext('2d');
  g.fillStyle = MAP_INK.grid;
  g.fillRect(0, 0, c.width, c.height);
  for (let sy = 0; sy < m.h; sy++) {
    for (let sx = 0; sx < m.w; sx++) {
      const room = getRoom(m.id, 0, sx, sy);
      if (room) paintSquare(g, room, game.tide, sx * 8, sy * 8);
    }
  }
  GRID = c; GRID_KEY = key;
  return c;
}

/** Dropped when a new game or a load resets the world under us. */
export function invalidateMapScreens() { GRID = null; GRID_KEY = ''; DUNGEON_CACHE.clear(); }

// ---------------------------------------------------------------- name box

/** The width of a line of the name box's letters, and where each one goes. */
function layoutLine(text) {
  const L = BLURB_LAYOUT;
  const out = [];
  let x = 0, prev = null;
  for (const ch of text) {
    if (ch === ' ') { x += L.space - L.gap; prev = null; continue; }
    const name = 'bl_' + ch.charCodeAt(0);
    if (!hasScreen(name)) { prev = null; continue; }
    if (prev) x += (prev.ch === 'T' && /[a-z]/.test(ch)) ? L.tKern - prev.w : L.gap;
    const w = screenImage(name).w;
    out.push({ name, x });
    x += w;
    prev = { ch, w };
  }
  return { glyphs: out, w: x };
}

/** A name broken into the box's lines, greedily, a word at a time. */
export function blurbLines(name) {
  const words = name.split(' ');
  const lines = [];
  for (const w of words) {
    const tryLine = lines.length ? lines[lines.length - 1] + ' ' + w : null;
    if (tryLine && layoutLine(tryLine).w <= BLURB_LAYOUT.maxWidth) lines[lines.length - 1] = tryLine;
    else lines.push(w);
  }
  return lines;
}

function drawBlurb(ctx, m) {
  drawScreen(ctx, 'blurbBox', 0, 0);
  // An optional dungeon has no level, as Seasons' Hero's Cave has none.
  const level = m.dungeon && !m.dungeon.optional && m.dungeon.index;
  if (level && hasScreen('blurbLevel' + level)) {
    const s = screenImage('blurbLevel' + level);
    drawScreen(ctx, 'blurbLevel' + level, s.ax, s.ay);
  }
  const lines = blurbLines(m.name).slice(0, 3);
  const set = (level ? BLURB_LAYOUT.level : BLURB_LAYOUT.plain)[lines.length]
    || BLURB_LAYOUT.plain[lines.length] || { top: 13, pitch: 11 };
  const laid = lines.map(layoutLine);
  const maxw = Math.max(...laid.map(l => l.w));
  const x0 = Math.floor((64 - maxw) / 2) + 1;
  laid.forEach((l, i) => {
    const base = set.top + BLURB_LAYOUT.cap + i * set.pitch;
    for (const gl of l.glyphs) {
      const s = screenImage(gl.name);
      drawScreen(ctx, gl.name, x0 + gl.x, base - s.ay);
    }
  });
}

// ------------------------------------------------------------- dungeon rooms

const DUNGEON_CACHE = new Map();

/**
 * Which ways out each cell of a dungeon floor has, as Seasons' room tiles
 * $b0-$bf draw them: bit 0 up, 1 right, 2 down, 3 left. A side is open if
 * any tile along it (corners aside) is something other than wall at the
 * current sea — a doorway, a door, a shutter, stairs — and a seam inside a
 * room that spans several cells is always open: it is one room.
 */
function cellExits(m, floor, x, y, tide) {
  const key = roomKeyAt(m.id, floor, x, y);
  if (!key) return 0;
  const room = getRoom(m.id, floor, x, y);
  const [, rx, ry] = key.split(',').map(Number);
  const [cw, ch] = [cellPixels(m)[0] / 16, cellPixels(m)[1] / 16];
  const i = x - rx, j = y - ry;
  const sw = room.tw / cw, sh = room.th / ch;
  const open = (tx, ty) => {
    const d = room.tile(tx, ty, tide);
    const f = d.flags | 0;
    if (f & F.BOMBABLE) return false;
    return !(f & F.SOLID) || !!(f & (F.DOOR | F.STAIRS | F.WARP));
  };
  const side = (pts) => pts.some(([tx, ty]) => open(tx, ty));
  const run = (n, fn) => Array.from({ length: n }, (_, k) => fn(k + 1));
  let bits = 0;
  if (j > 0 || side(run(cw - 2, k => [i * cw + k, 0]))) bits |= 1;
  if (i < sw - 1 || side(run(ch - 2, k => [room.tw - 1, j * ch + k]))) bits |= 2;
  if (j < sh - 1 || side(run(cw - 2, k => [i * cw + k, room.th - 1]))) bits |= 4;
  if (i > 0 || side(run(ch - 2, k => [0, j * ch + k]))) bits |= 8;
  return bits;
}

function exitsFor(game, m, floor, x, y) {
  const k = m.id + ':' + floor + ',' + x + ',' + y + '|' + (game.tide ? game.tide.stamp : 0)
    + '|' + Object.keys(game.progress.doors || {}).length;
  if (!DUNGEON_CACHE.has(k)) DUNGEON_CACHE.set(k, cellExits(m, floor, x, y, game.tide));
  return DUNGEON_CACHE.get(k);
}

/** Which tide levels change a room, as a 3-bit mask (the Chartstone). */
const CHART_CACHE = new Map();
function tideMarks(mapId, floor, x, y) {
  const key = mapId + ':' + floor + ',' + x + ',' + y;
  if (CHART_CACHE.has(key)) return CHART_CACHE.get(key);
  let mask = 0;
  const room = getRoom(mapId, floor, x, y);
  if (room) {
    for (let lv = 0; lv < TIDE_COUNT; lv++) {
      const prev = (lv + TIDE_COUNT - 1) % TIDE_COUNT;
      let differs = false;
      for (let ty = 0; ty < room.th && !differs; ty++) {
        for (let tx = 0; tx < room.tw; tx++) {
          if (room.tile(tx, ty, lv).name !== room.tile(tx, ty, prev).name) { differs = true; break; }
        }
      }
      if (differs) mask |= 1 << lv;
    }
  }
  CHART_CACHE.set(key, mask);
  return mask;
}

// --------------------------------------------------------------- the screen

const SKY_ROWS = 1;
const GRID_TOP = 32;           // the grid's top, tile-aligned, the world centred under the sky

export class MapScreen {
  constructor(game) { this.game = game; this.m = null; }

  seen(mapId, key) { return !!this.game.progress.secrets['seen:' + mapId + ':' + key]; }

  /** The overworld screen a house or a cave was entered from: the screen
   *  whose doorway leads into it. */
  homeOf(mapId) {
    const ow = getMap('overworld');
    for (const [key, def] of Object.entries(ow.roomDefs)) {
      for (const w of def.warps || []) {
        if (w.to && w.to.map === mapId) { const [, x, y] = key.split(',').map(Number); return [x, y]; }
      }
    }
    return [0, 0];
  }

  open() {
    const g = this.game;
    const here = g.map;
    this.t = 0;
    this.hold = 0;
    this.scrollLeft = 0;
    if (here && here.kind === 'dungeon') {
      const m = this.m = here;
      this.mode = 'dungeon';
      this.linkFloor = g.room && g.room.mapId === m.id ? (g.room.floor || 0) : 0;
      const [cw, chh] = cellPixels(m);
      const px = g.player ? Math.max(0, Math.floor(g.player.x / cw)) : 0;
      const py = g.player ? Math.max(0, Math.floor(g.player.y / chh)) : 0;
      this.linkCell = g.room ? [g.room.rx + px, g.room.ry + py] : [0, 0];
      this.floorIndex = m.floors - 1 - this.linkFloor;      // 0 is the top floor
      this.scrollY = this.floorIndex * 10;
      this.flicker = 0;
    } else {
      const m = this.m = getMap('overworld');
      this.mode = 'overworld';
      let x = 0, y = 0;
      if (here && here.id === 'overworld' && g.room) { x = g.room.rx; y = g.room.ry; } else if (here) [x, y] = this.homeOf(here.id);
      this.current = [x, y];
      this.cursor = [x, y];
      this.pop = { state: 0, size: 0, timer: 0, index: 0, at: null };
    }
  }

  // ------------------------------------------------------------- input

  update() {
    const g = this.game;
    this.t++;
    if (this.mode === 'dungeon') { this.updateDungeon(); return; }
    this.updatePopup();
    if (g.dialogue.active) { g.dialogue.update(); return; }
    const i = g.input;
    const dirs = [['right', 1, 0], ['left', -1, 0], ['up', 0, -1], ['down', 0, 1]];
    for (const [b, dx, dy] of dirs) {
      if (!i.pressed(b)) continue;
      // The cursor wraps at both edges (mapMenu_state1 @overworld).
      const m = this.m;
      this.cursor = [(this.cursor[0] + dx + m.w) % m.w, (this.cursor[1] + dy + m.h) % m.h];
      g.audio.sfx('cursor');
      return;
    }
    if (i.pressed('a')) { this.sayName(); return; }
    if (i.pressed('b') || i.pressed('select')) g.menu.close();
  }

  /** What A says about the square under the cursor, or null for a square
   *  nobody has been to (mapGetRoomTextOrReturn). A screen with a dungeon's
   *  door says the dungeon's name once the dungeon has been entered. */
  placeName(x, y) {
    const m = this.m;
    if (!this.seen(m.id, '0,' + x + ',' + y)) return null;
    const def = m.roomDefs['0,' + x + ',' + y];
    if (!def) return null;
    for (const w of def.warps || []) {
      const to = w.to && getMap(w.to.map);
      if (to && to.kind === 'dungeon' && Object.keys(this.game.progress.secrets)
        .some(k => k.startsWith('seen:' + to.id + ':'))) return to.name;
    }
    return def.name || null;
  }

  /** What the popup over a square holds: a picture per door into a house,
   *  a shop, the Maku Tree or a cave, at most two (presentMinimapPopups'
   *  two digits), on a square Link has been to — a cave's only once he has
   *  been inside it (minimapPopupType_cave). Seasons gives a dungeon's door
   *  no popup; A names it. */
  popupIcons(x, y) {
    const m = this.m;
    if (!this.seen(m.id, '0,' + x + ',' + y)) return [];
    const def = m.roomDefs['0,' + x + ',' + y];
    const out = [];
    for (const w of (def && def.warps) || []) {
      const to = w.to && getMap(w.to.map);
      if (!to || (to.kind !== 'interior' && to.kind !== 'cave')) continue;
      let icon = to.kind === 'cave' ? 'mapIconCave' : /Shop$/.test(to.id) ? 'mapIconShop'
        : /Maku$/.test(to.id) ? 'mapIconMaku' : 'mapIconHouse';
      if (to.kind === 'cave' && !Object.keys(this.game.progress.secrets).some(k => k.startsWith('seen:' + to.id + ':'))) continue;
      if (!out.includes(icon)) out.push(icon);
    }
    return out.slice(0, 2);
  }

  /** The popup's corner: top right, moving down when the cursor is in the
   *  lower half and left when it is in the right half (mapMenu_loadPopupData,
   *  b/c $20/$80, $70 and $20 past the middle), as a screen position. */
  popupAt() {
    const [x, y] = this.cursor, m = this.m;
    const b = y >= (m.h >> 1) ? 0x70 : 0x20, c = x >= (m.w >> 1) ? 0x20 : 0x80;
    return [c - 8, b - 16];
  }

  /** maupMenu_drawPopup @updatePopupVariables: grow a size every
   *  MAP_POPUP_STEP frames to four, then swap its two pictures every
   *  MAP_POPUP_SWAP; shrink away when there is nothing to show; start over
   *  when the corner it stands in changes. */
  updatePopup() {
    const p = this.pop;
    const at = this.popupAt();
    if (p.at && (p.at[0] !== at[0] || p.at[1] !== at[1])) Object.assign(p, { state: 0, size: 0, timer: 0, index: 0 });
    p.at = at;
    const has = this.popupIcons(...this.cursor).length > 0;
    switch (p.state) {
      case 0:
        if (has) Object.assign(p, { state: 1, size: 1, timer: MAP_POPUP_STEP });
        break;
      case 1:
        if (!has) { Object.assign(p, { state: 3, timer: 1 }); break; }
        if (--p.timer) break;
        p.timer = MAP_POPUP_STEP;
        if (++p.size >= 4) Object.assign(p, { state: 2, timer: MAP_POPUP_SWAP });
        break;
      case 2:
        if (!has) { Object.assign(p, { state: 3, timer: 1 }); break; }
        if (--p.timer) break;
        p.timer = MAP_POPUP_SWAP;
        p.index ^= 1;
        break;
      case 3:
        if (--p.timer) break;
        p.timer = MAP_POPUP_STEP;
        if (--p.size <= 0) Object.assign(p, { state: 0, size: 0, timer: 0, index: 0 });
        break;
    }
  }

  drawPopup(ctx) {
    const p = this.pop;
    if (!p || !p.size) return;
    const [px, py] = p.at;
    // The picture is listed before the frame, so it is in front of it.
    drawObject(ctx, 'mapPopup' + p.size, px, py);
    if (p.size === 4) {
      const icons = this.popupIcons(...this.cursor);
      const icon = icons[p.index & 1] || icons[0];
      if (icon) drawObject(ctx, icon, px, py);
    }
  }

  sayName() {
    const [x, y] = this.cursor;
    const name = this.placeName(x, y);
    if (!name) return;
    // The box goes to the half of the screen the cursor is not in.
    const low = y * 8 + GRID_TOP >= SCREEN_H / 2;
    this.game.dialogue.show(name, { y: low ? 8 : null, bottom: !low });
  }

  /** Can floor `f` be looked at: with the Map every floor, without it only
   *  a floor with a room walked into (dungeonMap_checkCanViewFloor). */
  canView(f) {
    const g = this.game, m = this.m;
    if (g.progress.dungeonMaps[m.id]) return true;
    return Object.keys(g.progress.secrets).some(k => k.startsWith('seen:' + m.id + ':' + f + ','));
  }

  /** The nearest floor up (-1) or down (+1) that can be looked at, as a
   *  number of floors to move, or 0 (dungeonMap_checkCanScrollUp/Down). */
  canScroll(dir) {
    const m = this.m;
    for (let k = 1; ; k++) {
      const fi = this.floorIndex + dir * k;
      if (fi < 0 || fi >= m.floors) return 0;
      if (this.canView(m.floors - 1 - fi)) return k;
    }
  }

  updateDungeon() {
    const g = this.game, i = g.input;
    if (this.scrollLeft) {
      this.scrollLeft--;
      this.scrollY += this.scrollDir * DMAP_SCROLL_ROWS;
      return;
    }
    if (i.pressed('b') || i.pressed('select')) { g.menu.close(); return; }
    if ((this.t & (DMAP_FLICKER - 1)) === 0) this.flicker ^= 1;
    // Up and down repeat when held (getInputWithAutofire).
    const fire = b => {
      if (i.pressed(b)) { this.hold = 0; return true; }
      if (!i.down(b)) return false;
      this.hold++;
      return this.hold >= MENU_AUTOFIRE_DELAY && (this.hold - MENU_AUTOFIRE_DELAY) % MENU_AUTOFIRE_EVERY === 0;
    };
    for (const [b, dir] of [['down', 1], ['up', -1]]) {
      if (!fire(b)) continue;
      const k = this.canScroll(dir);
      if (!k) return;
      this.floorIndex += dir * k;
      this.scrollDir = dir;
      this.scrollLeft = k * 10 / DMAP_SCROLL_ROWS;
      g.audio.sfx('cursor');
      return;
    }
  }

  // -------------------------------------------------------------- draw

  draw(ctx) {
    if (this.mode === 'dungeon') this.drawDungeon(ctx);
    else this.drawOverworld(ctx);
    this.game.dialogue.draw(ctx);
  }

  drawOverworld(ctx) {
    const g = this.game, m = this.m;
    for (let y = 0; y < SCREEN_H; y += 8) for (let x = 0; x < SCREEN_W; x += 8) drawScreen(ctx, 'mapSea', x, y);
    for (let r = 0; r < SKY_ROWS; r++) drawScreen(ctx, 'mapSky', 0, r * 8);
    const gw = m.w * 8, gh = m.h * 8;
    const ox = Math.floor((SCREEN_W - gw) / 2), oy = GRID_TOP;
    ctx.drawImage(gridCanvas(g, m), ox, oy);
    for (let sy = 0; sy < m.h; sy++) {
      for (let sx = 0; sx < m.w; sx++) {
        if (!this.seen(m.id, '0,' + sx + ',' + sy)) drawScreen(ctx, 'mapUnseen', ox + sx * 8, oy + sy * 8);
      }
    }
    // The grid's right and bottom edges (Seasons draws them in its frame).
    ctx.fillStyle = MAP_INK.grid;
    ctx.fillRect(ox + gw, oy, 1, gh + 1);
    ctx.fillRect(ox, oy + gh, gw + 1, 1);
    // The arrow over Link's screen blinks; the cursor stands round its square.
    const [hx, hy] = this.current;
    if (!(this.t & MAP_ARROW_BLINK)) drawScreen(ctx, 'mapArrow', ox + hx * 8, oy + hy * 8 - 10);
    const [cx, cy] = this.cursor;
    drawScreen(ctx, 'mapCursor', ox + cx * 8 - 4, oy + cy * 8 - 4);
    this.drawPopup(ctx);
  }

  /** The tile rows of the scrolling half: 5 rows of black, each floor from
   *  the top as 8 rows with 2 between, then 3 more (dungeonMap_
   *  generateScrollableTilemap). Row r of floor index fi is row 5+fi*10+r. */
  drawDungeon(ctx) {
    const g = this.game, m = this.m, p = g.progress;
    drawScreen(ctx, 'dmapFrame', 0, 0);
    drawBlurb(ctx, m);
    const haveMap = !!p.dungeonMaps[m.id], haveChart = !!p.charts[m.id];
    const scrolling = this.scrollLeft > 0;

    // The floor list: top floor first, a row each, from row 9.
    const LIST_ROW = 9;
    for (let fi = 0; fi < m.floors; fi++) {
      const f = m.floors - 1 - fi, y = (LIST_ROW + fi) * 8;
      if (!this.canView(f)) continue;
      const digits = screenImage('dmapDigits');
      ctx.drawImage(digits.canvas, ((f + 1) % 10) * 8, 0, 8, 8, 8, y, 8, 8);
      drawScreen(ctx, 'dmapF', 16, y);
      drawScreen(ctx, 'dmapFloorBox', 32, y);
    }

    // The floors, through the window: columns 10-17, all 18 rows.
    ctx.save();
    ctx.beginPath(); ctx.rect(80, 0, 64, SCREEN_H); ctx.clip();
    // dungeonMap_updateScroll writes these eight columns itself, the blank
    // tile $ad in palette 0: black, where the frame round them is palette 3's.
    ctx.fillStyle = DMAP_BLACK;
    ctx.fillRect(80, 0, 64, SCREEN_H);
    for (let fi = 0; fi < m.floors; fi++) {
      const f = m.floors - 1 - fi;
      if (!this.canView(f)) continue;
      for (let y = 0; y < 8 && y < m.h; y++) {
        const sy = (5 + fi * 10 + y - this.scrollY) * 8;
        if (sy < -8 || sy >= SCREEN_H) continue;
        for (let x = 0; x < 8 && x < m.w; x++) {
          const key = roomKeyAt(m.id, f, x, y);
          if (!key) continue;
          const sx = 80 + x * 8;
          if (this.seen(m.id, key)) drawScreen(ctx, 'dmapRoom' + exitsFor(g, m, f, x, y), sx, sy);
          else if (haveMap) drawScreen(ctx, 'dmapUnseen', sx, sy);
          else continue;
          if (haveChart && key === f + ',' + x + ',' + y) this.drawPips(ctx, m, f, x, y, key, sx, sy);
        }
      }
    }
    ctx.restore();

    // The things held for this dungeon, along the bottom left.
    if (haveMap) drawScreen(ctx, 'dmapMapItem', 8, 110);
    if (haveChart) sprites.draw(ctx, 'i_chart', 32, 110);
    if (p.bossKeys[m.id]) drawScreen(ctx, 'dmapBossKey', 8, 128);
    const keys = p.keys[m.id] || 0;
    if (keys) {
      drawScreen(ctx, 'dmapKey', 32, 128);
      drawScreen(ctx, 'dmapX', 40, 136);
      ctx.drawImage(screenImage('dmapKeyDigits').canvas, Math.min(keys, 9) * 8, 0, 8, 8, 48, 136, 8, 8);
    }

    // Link on the floor list, the floor cursor, and Link (or the cursor round
    // his room, turn about) on the floor shown.
    const top = (LIST_ROW - 1) * 8;
    drawScreen(ctx, 'dmapLink', 36, top + (m.floors - 1 - this.linkFloor) * 8);
    drawScreen(ctx, 'dmapFloorCursor', 22, top + this.floorIndex * 8);
    const [lx, ly] = this.linkCell;
    const ly8 = (5 + (m.floors - 1 - this.linkFloor) * 10 + ly - this.scrollY) * 8;
    if (this.flicker) {
      if (ly8 >= 0 && ly8 < SCREEN_H) drawScreen(ctx, 'dmapLink', 80 + lx * 8, ly8 - 8);
    } else if (!scrolling) {
      // The cursor stands where Link's room is on the floor at rest in the
      // window, whichever floor that is (dungeonMap_drawCursor ignores both
      // the floor and the scroll).
      drawScreen(ctx, 'dmapCursor', 76 + lx * 8, (5 + ly) * 8 - 4);
    }
    if (!scrolling) {
      if (this.canScroll(-1)) drawScreen(ctx, 'dmapArrowUp', 108, 20);
      if (this.canScroll(1)) drawScreen(ctx, 'dmapArrowDown', 108, 108);
    }
  }

  /** The Chartstone: one pip per tide level that changes the room, LOW at
   *  the bottom and HIGH at the top, in the room's top-right corner. */
  drawPips(ctx, m, f, x, y, key, sx, sy) {
    const marks = tideMarks(m.id, f, x, y);
    for (let lv = 0; lv < 3; lv++) {
      if (!(marks & (1 << lv))) continue;
      ctx.fillStyle = TIDE_PIP[lv];
      ctx.fillRect(sx + 5, sy + 1 + (2 - lv) * 2, 2, 1);
    }
  }
}
