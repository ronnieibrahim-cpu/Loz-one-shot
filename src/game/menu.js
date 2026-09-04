// Pause menu: item grid with A/B assignment, dungeon or overworld map, quest
// status, and save. Opened with START, closed with START or B on the first tab.

import { SCREEN_W, SCREEN_H, HUD_H, VIEW_W, VIEW_H } from '../core/screen.js';
import { drawText, drawTextCentered, textWidth, wrapText } from '../gfx/font.js';
import { sprites, tiles } from '../gfx/art.js';
import { getPalette } from '../gfx/palettes.js';
import { tileArt } from '../world/tileset.js';
import { drawPanel, drawBox } from './dialogue.js';
import { ITEMS, itemIcon, itemName, equippableItems } from './items.js';
import {
  CHARMS, CHARM_SLOTS, CHARM_COUNT, ownedCharms, charmsForSlot, slotCharm,
  caseSize, slotOpen, equippedIn,
} from './scrimshaw.js';
import { HEART_UNITS } from './progress.js';
import { essenceCount } from '../world/maps.js';
import { MAPS, getMap, hasRoom, getRoom, roomKeyAt } from '../world/maps.js';
import { TIDE_NAMES, TIDE_COUNT } from './tide.js';
import { tradeName, tradeIcon } from '../data/trade.js';
import { MENU_DESC_DWELL, MENU_DESC_HOLD } from '../data/feel.js';

/**
 * The pixel width a description is wrapped to, per panel. Exported because
 * tools/check-text.mjs proves every description fits one of them — a single
 * word too long to break is the one thing wrapText cannot fix, and it would
 * run off the edge of the panel — and a checker with its own copy of the
 * number is a checker that stops describing the game the moment the panel
 * moves.
 */
export const DESC_WRAP_W = { item: SCREEN_W - 22, charm: SCREEN_W - 20 };

// The Chartstone's pips, LOW to HIGH. Sand, shallow, deep — the same three
// tones the water itself is drawn in, so the mark needs no key to read.
const TIDE_PIP = ['#e0c078', '#58b0e0', '#1848a0'];

/**
 * Which tide levels CHANGE a room, as a 3-bit mask. This is the Chartstone,
 * and it is information the game already computes on every room load and then
 * throws away.
 *
 * Level n is marked when the room's grid at n differs from the grid at the
 * level below it — that is, when ARRIVING at n is an event. LOW is compared
 * against HIGH, because the conch cycles round rather than sliding up and down.
 *
 * Cached per room: it is a pure function of authored data and never changes
 * during a run, and the map screen would otherwise do eighty tile lookups per
 * room per frame.
 */
const CHART_CACHE = new Map();
function tideMarks(mapId, floor, rx, ry) {
  const key = mapId + ':' + floor + ',' + rx + ',' + ry;
  if (CHART_CACHE.has(key)) return CHART_CACHE.get(key);
  let mask = 0;
  const room = getRoom(mapId, floor, rx, ry);
  if (room) {
    for (let lv = 0; lv < TIDE_COUNT; lv++) {
      const prev = (lv + TIDE_COUNT - 1) % TIDE_COUNT;
      let differs = false;
      for (let y = 0; y < room.th && !differs; y++) {
        for (let x = 0; x < room.tw; x++) {
          if (room.tile(x, y, lv).name !== room.tile(x, y, prev).name) { differs = true; break; }
        }
      }
      if (differs) mask |= 1 << lv;
    }
  }
  CHART_CACHE.set(key, mask);
  return mask;
}

// --------------------------------------------------------------------------
// The overworld map is a PICTURE, drawn one pixel per tile
// --------------------------------------------------------------------------
//
// Thalassia is 12x10 screens and every screen is 10x8 tiles, so the whole
// world is 120x80 tiles — and the space under the map title is 160x88 px.
// That is the whole idea: the map is the world at 1:1 tile-to-pixel, not a
// diagram of it. A coastline drawn this way is the actual coastline, because
// it IS the tiles; nothing here decides what the land looks like.
//
// This is also why the region `legend` is NOT what gets drawn. The legends are
// blocked out in straight 4x2 and 4x4 rectangles (verified: the 12x10 legend
// grid is nine rectangular blocks), so colouring by region would produce a
// patchwork quilt with ruler-straight borders — a diagram of the authoring,
// not a picture of the place.
//
// COLOURS ARE DERIVED FROM THE TERRAIN ART, never hand-picked. A tile's map
// pixel is the most common colour in that tile's own 16x16 art, resolved
// through that art's own palette. Hand-authoring a name->colour table would
// be a second source of truth that silently drifts the first time a terrain
// tile is re-extracted; this cannot drift, because it is reading the same
// pixels the room draws.
const MAP_COLOUR = new Map();
function tileMapColour(def) {
  const name = def.name;
  let c = MAP_COLOUR.get(name);
  if (c !== undefined) return c;
  const art = tiles.defs.get(tileArt(def, 0));
  if (!art) { MAP_COLOUR.set(name, null); return null; }
  // ONE PIXEL PER TILE IS A DOWNSAMPLE, so the pixel wants the tile's MEAN
  // tone — not its most common colour. The modal index was tried first and is
  // wrong: terrain art carries a lot of dark detail (tufts, rock speckle,
  // outlines), so the mode lands on the detail colour often enough that the
  // whole map reads as stipple instead of as land and water.
  //
  // But a raw mean would put colours on screen that are in no palette in the
  // game, which is how a GBC-shaped picture starts looking like a JPEG. So the
  // mean is SNAPPED BACK to the nearest of that tile's own four colours: every
  // map pixel is a colour the tile itself is actually drawn in, chosen for
  // being the closest thing to how the tile reads from a distance.
  //
  // The palette is on the tile DEFINITION, not on the art entry — `Room.render`
  // draws every tile with `{ pal: d.pal }`, and the art's own `pal` is only the
  // registration-time default. Reading the wrong one produced a map of the
  // whole world in the grey 'stone' fallback, which looked like plausible
  // terrain noise rather than like a bug.
  const pal = getPalette(def.pal || art.pal);
  const rgb = pal.map(hx => [
    parseInt(hx.slice(1, 3), 16), parseInt(hx.slice(3, 5), 16), parseInt(hx.slice(5, 7), 16),
  ]);
  let r = 0, gg = 0, b = 0, n = 0;
  for (let i = 0; i < art.art.px.length; i++) {
    const v = art.art.px[i];
    if (v >= 4) continue;
    r += rgb[v][0]; gg += rgb[v][1]; b += rgb[v][2]; n++;
  }
  if (!n) { MAP_COLOUR.set(name, null); return null; }
  r /= n; gg /= n; b /= n;
  let best = 0, bestD = Infinity;
  for (let i = 0; i < 4; i++) {
    const d = (rgb[i][0] - r) ** 2 + (rgb[i][1] - gg) ** 2 + (rgb[i][2] - b) ** 2;
    if (d < bestD) { bestD = d; best = i; }
  }
  c = pal[best];
  MAP_COLOUR.set(name, c);
  return c;
}

// The rendered world, cached. Rebuilding it walks 120 rooms x 80 tiles, which
// is far too much to do per frame, and the tide changes what it looks like —
// so it is keyed on the tide field's STAMP, exactly as Room's own render cache
// is, and for exactly the reason in CLAUDE.md: a key made from the LEVEL alone
// would not notice an anchor moving the field under one screen.
let WORLD_CANVAS = null;
let WORLD_KEY = '';

/**
 * Paint the whole overworld into an offscreen canvas at one pixel per tile.
 *
 * This DOES instantiate every room on the map, via `getRoom`, and that is a
 * deliberate decision rather than an oversight — see `T75`. The caution at the
 * old `drawMap` said an instantiated room "is one `liveRooms` will then save
 * and restore the state of"; `liveRooms` has no callers, nothing saves or
 * restores from the room cache, and `resetRooms()` clears it on new game and
 * load. The alternative — decoding each room's legend characters here — would
 * mean re-deriving `expandBlocks`, tide-tile resolution and overrides outside
 * the engine, which is the mistake `R4` exists to prevent. So it asks Room
 * what tile is there, and pays for it once per tide change rather than once
 * per frame.
 */
function buildWorldCanvas(game, m) {
  const tw = 10, th = 8;                       // tiles per screen
  const W = m.w * tw, H = m.h * th;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  for (let sy = 0; sy < m.h; sy++) {
    for (let sx = 0; sx < m.w; sx++) {
      const room = getRoom(m.id, 0, sx, sy);
      if (!room) continue;
      for (let ty = 0; ty < th; ty++) {
        for (let tx = 0; tx < tw; tx++) {
          const col = tileMapColour(room.tile(tx, ty, game.tide));
          if (!col) continue;
          g.fillStyle = col;
          g.fillRect(sx * tw + tx, sy * th + ty, 1, 1);
        }
      }
    }
  }
  return c;
}

function worldCanvas(game, m) {
  const key = m.id + '|' + (game.tide ? game.tide.stamp : 0) + '|' + m.w + 'x' + m.h;
  if (WORLD_CANVAS && WORLD_KEY === key) return WORLD_CANVAS;
  WORLD_CANVAS = buildWorldCanvas(game, m);
  WORLD_KEY = key;
  return WORLD_CANVAS;
}

/** Dropped when a new game or a load resets the world under us. */
export function invalidateWorldMap() { WORLD_CANVAS = null; WORLD_KEY = ''; MAP_COLOUR.clear(); }

const TABS = ['ITEMS', 'MAP', 'CHARM', 'QUEST', 'SAVE'];

// The three cases are drawn HIGH at the top and LOW at the bottom, because
// that is where the water is. Reading the screen top to bottom is reading the
// tide falling, and the highlighted row is where it is right now.
const CASE_ROWS = ['high', 'mid', 'low'];
const COLS = 5;

export class Menu {
  constructor(game) {
    this.game = game;
    this.tab = 0;
    this.cursor = 0;
    this.caseRow = 1;        // index into CASE_ROWS; starts on MID, the one you own
    this.poolCursor = 0;
    this.saveCursor = 0;
    this.message = '';
    this.messageTime = 0;
    this.descKey = '';
    this.descT = 0;
  }

  open() { this.game.mode = 'menu'; this.tab = 0; this.cursor = 0; }
  close() { this.game.mode = 'play'; this.game.audio.sfx('pause'); }

  get items() { return equippableItems(this.game.progress); }

  update() {
    const g = this.game;
    const i = g.input;
    if (this.messageTime > 0) this.messageTime--;
    this.tickDesc();

    if (i.pressed('start')) { this.close(); return; }

    // Tab switching with SELECT, or left/right at the row edges.
    if (i.pressed('select')) {
      this.tab = (this.tab + 1) % TABS.length;
      this.cursor = 0;
      g.audio.sfx('cursor');
      return;
    }

    if (this.tab === 0) this.updateItems();
    else if (this.tab === 1) this.updateMap();
    else if (this.tab === 2) this.updateCharms();
    else if (this.tab === 3) this.updateQuest();
    else this.updateSave();
  }

  updateItems() {
    const g = this.game, i = g.input, list = this.items;
    const n = list.length;
    if (!n) { if (i.pressed('b')) this.close(); return; }
    const rows = Math.ceil(n / COLS);
    let c = this.cursor;
    if (i.pressed('left')) { c = (c % COLS === 0) ? c + Math.min(COLS - 1, n - 1 - c) : c - 1; g.audio.sfx('cursor'); }
    if (i.pressed('right')) { c = (c % COLS === COLS - 1 || c === n - 1) ? c - (c % COLS) : c + 1; g.audio.sfx('cursor'); }
    if (i.pressed('up')) { c = (c - COLS + rows * COLS) % (rows * COLS); g.audio.sfx('cursor'); }
    if (i.pressed('down')) { c = (c + COLS) % (rows * COLS); g.audio.sfx('cursor'); }
    this.cursor = Math.max(0, Math.min(n - 1, c));

    const sel = list[this.cursor];
    if (!sel) return;

    // Seed satchel: cycle which seed is selected with up/down on the item itself.
    if ((sel.id === 'satchel' || sel.id === 'slingshot') && i.pressed('select')) {
      g.audio.sfx('cursor');
    }
    if (i.pressed('a')) { this.assign(sel.id, 'A'); }
    if (i.pressed('b')) { this.assign(sel.id, 'B'); }
  }

  assign(id, slot) {
    const p = this.game.progress;
    const other = slot === 'A' ? 'equipB' : 'equipA';
    const mine = slot === 'A' ? 'equipA' : 'equipB';
    if (p[other] === id) p[other] = p[mine];
    p[mine] = id;
    this.game.audio.sfx('confirm');
    this.flash(`${itemName(id, p.items[id])} on ${slot}`);
  }

  updateMap() {
    const g = this.game, i = g.input;
    if (i.pressed('b')) { this.tab = 0; g.audio.sfx('cursor'); }
    if (this.game.map && this.game.map.floors > 1) {
      if (i.pressed('up')) this.mapFloor = Math.min(this.game.map.floors - 1, (this.mapFloor || 0) + 1);
      if (i.pressed('down')) this.mapFloor = Math.max(0, (this.mapFloor || 0) - 1);
    }
  }

  updateQuest() {
    const g = this.game, i = g.input;
    if (i.pressed('b')) { this.tab = 0; g.audio.sfx('cursor'); }
  }

  /** The case currently highlighted, and the charms that could go in it. */
  get caseSlot() { return CASE_ROWS[this.caseRow]; }
  get pool() { return charmsForSlot(this.game.progress, this.caseSlot); }

  // ------------------------------------------------- scrolling descriptions
  //
  // The description panel is ONE line of this font tall — the item grid is
  // above it and the button hint below, and neither has a row to give — while
  // several item descriptions wrap to three lines at that width. They used to
  // be cut with `.slice(0, 33) + '…'`, which is not a summary: "Throw it to
  // hold the tide where it lands. Press again to recall it." became "Throw it
  // to hold the tide where…", and the half that says how to get the thing
  // BACK was unreachable from inside the game. So the panel scrolls: the text
  // is wrapped to the panel and cycles a line at a time, and every word an
  // item's description has is eventually on screen.
  //
  // The cycle is driven from update() rather than from draw(), because draw()
  // runs at the display's rate and update() runs at the fixed step — a
  // description that scrolled in draw() would go faster on a 120Hz screen and
  // would not replay.

  /** Identifies what the cursor is on, so moving it restarts the scroll. */
  descId() {
    if (this.tab === 0) {
      const it = this.items[this.cursor];
      return it ? 'item:' + it.id + ':' + it.level : 'item:';
    }
    if (this.tab === 2) return 'charm:' + (this.pool[this.poolCursor] || '');
    return '';
  }

  tickDesc() {
    const id = this.descId();
    if (id !== this.descKey) { this.descKey = id; this.descT = 0; }
    else this.descT++;
  }

  /**
   * The `visible` lines of `text` that are on screen this frame, wrapped to
   * `maxW`, plus whether there are more of them than fit.
   *
   * The first line is held for MENU_DESC_HOLD longer than the rest: the cycle
   * wraps from the bottom straight back to the top, and a beat there is what
   * makes that read as the sentence starting again.
   */
  descWindow(text, maxW, visible = 1) {
    const lines = wrapText(text || '', maxW);
    if (lines.length <= visible) return { lines, more: false };
    const stops = lines.length - visible + 1;
    let t = this.descT % (stops * MENU_DESC_DWELL + MENU_DESC_HOLD);
    t = Math.max(0, t - MENU_DESC_HOLD);
    const at = Math.min(stops - 1, Math.floor(t / MENU_DESC_DWELL));
    return { lines: lines.slice(at, at + visible), more: true, at, stops };
  }

  /**
   * The dots beside a description that has more lines than the panel shows —
   * one per line of the wrapped text, the current one lit. Without it a player
   * who looks away for a beat comes back to a different sentence and has no
   * way to know the panel is cycling rather than that they moved the cursor.
   * Drawn as pixels rather than glyphs: this font has no dot small enough.
   */
  drawScrollMark(ctx, x, y, w) {
    // The dots have one line of text to live in, so they tighten up rather
    // than growing out of the panel when a description wraps far enough.
    const pitch = w.stops <= 3 ? 3 : 2;
    for (let i = 0; i < w.stops; i++) {
      ctx.fillStyle = i === w.at ? '#a8f0f8' : '#485868';
      ctx.fillRect(x, y + 1 + i * pitch, 2, 2);
    }
  }

  updateCharms() {
    const g = this.game, i = g.input, p = g.progress;
    if (i.pressed('b')) { this.tab = 0; g.audio.sfx('cursor'); return; }
    if (i.pressed('up')) { this.caseRow = (this.caseRow + 2) % 3; this.poolCursor = 0; g.audio.sfx('cursor'); }
    if (i.pressed('down')) { this.caseRow = (this.caseRow + 1) % 3; this.poolCursor = 0; g.audio.sfx('cursor'); }

    const pool = this.pool;
    if (!pool.length) { this.poolCursor = 0; return; }
    if (i.pressed('left')) { this.poolCursor = (this.poolCursor + pool.length - 1) % pool.length; g.audio.sfx('cursor'); }
    if (i.pressed('right')) { this.poolCursor = (this.poolCursor + 1) % pool.length; g.audio.sfx('cursor'); }
    this.poolCursor = Math.min(this.poolCursor, pool.length - 1);

    if (!i.pressed('a')) return;
    const slot = this.caseSlot;
    const id = pool[this.poolCursor];
    if (!slotOpen(p, slot)) {
      g.audio.sfx('deny');
      this.flash('That case is still shut.');
      return;
    }
    const inCase = equippedIn(p, slot);
    if (inCase.includes(id)) {
      // A press on something already in the case takes it out. One button does
      // both, because at 160x144 a second one would need a legend nobody reads.
      slotCharm(p, slot, p.charmSlots[slot].indexOf(id), null);
      g.audio.sfx('cursor');
      this.flash(CHARMS[id].name + ' off');
      return;
    }
    const size = caseSize(p);
    let at = p.charmSlots[slot].slice(0, size).indexOf(null);
    if (at < 0) at = size - 1;              // full: the newest replaces the last
    slotCharm(p, slot, at, id);
    g.audio.sfx('confirm');
    this.flash(CHARMS[id].name + ' on ' + slot.toUpperCase());
  }

  updateSave() {
    const g = this.game, i = g.input;
    if (i.pressed('b')) { this.tab = 0; g.audio.sfx('cursor'); return; }
    if (i.pressed('up') || i.pressed('down')) { this.saveCursor = 1 - this.saveCursor; g.audio.sfx('cursor'); }
    if (i.pressed('a')) {
      if (this.saveCursor === 0) {
        const ok = g.save();
        g.audio.sfx(ok ? 'confirm' : 'deny');
        this.flash(ok ? 'Saved.' : 'Could not save.');
      } else {
        g.save();
        g.mode = 'title';
        g.title.reset();
        g.audio.play('title');
      }
    }
  }

  flash(msg) { this.message = msg; this.messageTime = 90; }

  // ------------------------------------------------------------------- draw

  draw(ctx) {
    const g = this.game;
    ctx.fillStyle = '#080c10';
    ctx.fillRect(0, HUD_H, VIEW_W, VIEW_H);

    // tab strip
    const tw = Math.floor(SCREEN_W / TABS.length);
    for (let i = 0; i < TABS.length; i++) {
      const on = i === this.tab;
      ctx.fillStyle = on ? '#586878' : '#182028';
      ctx.fillRect(i * tw, HUD_H + 1, tw - 1, 11);
      drawTextCentered(ctx, TABS[i], i * tw + tw / 2, HUD_H + 3, on ? '#f8f8e8' : '#687888');
    }

    if (this.tab === 0) this.drawItems(ctx);
    else if (this.tab === 1) this.drawMap(ctx);
    else if (this.tab === 2) this.drawCharms(ctx);
    else if (this.tab === 3) this.drawQuest(ctx);
    else this.drawSave(ctx);

    if (this.messageTime > 0) {
      drawTextCentered(ctx, this.message, SCREEN_W / 2, SCREEN_H - 12, '#a8f0f8');
    } else {
      drawTextCentered(ctx, 'SELECT: tab   START: close', SCREEN_W / 2, SCREEN_H - 11, '#485868');
    }
  }

  drawItems(ctx) {
    const g = this.game, p = g.progress;
    const list = this.items;
    const x0 = 8, y0 = HUD_H + 17, cw = 29, ch = 22;
    list.forEach((it, i) => {
      const cx = x0 + (i % COLS) * cw, cy = y0 + Math.floor(i / COLS) * ch;
      const sel = i === this.cursor;
      ctx.fillStyle = sel ? '#586878' : '#182028';
      ctx.fillRect(cx, cy, cw - 3, ch - 3);
      sprites.draw(ctx, itemIcon(it.id, it.level), cx + 3, cy + 1, { pal: it.def.pal });
      if (p.equipB === it.id) drawText(ctx, 'B', cx + cw - 9, cy + 10, '#a8f0f8');
      if (p.equipA === it.id) drawText(ctx, 'A', cx + cw - 9, cy + 1, '#f8e890');
    });
    const sel = list[this.cursor];
    const infoY = SCREEN_H - 38;
    drawPanel(ctx, 4, infoY, SCREEN_W - 8, 24);
    if (sel) {
      drawText(ctx, itemName(sel.id, sel.level), 8, infoY + 3, '#f8f8e8');
      const w = this.descWindow(sel.def.desc, DESC_WRAP_W.item);
      drawText(ctx, w.lines[0] || '', 8, infoY + 13, '#a8b0a0');
      if (w.more) this.drawScrollMark(ctx, SCREEN_W - 12, infoY + 13, w);
    } else {
      drawText(ctx, 'No items yet.', 8, infoY + 3, '#a8b0a0');
    }
  }

  /** Two different screens that used to be one loop. See each one's own note. */
  drawMap(ctx) {
    const g = this.game;
    const m = g.map;
    if (!m) return;
    drawTextCentered(ctx, m.name, SCREEN_W / 2, HUD_H + 15, '#f8f8e8');
    if (m.kind === 'dungeon') this.drawDungeonMap(ctx, m);
    else this.drawWorldMap(ctx, m);
  }

  /**
   * A picture of Thalassia at one pixel per tile — see the note above
   * `tileMapColour`. What it says is exactly what the grid of rectangles it
   * replaces said (which screens have been seen, and where you are), drawn as
   * a place instead of as a table.
   */
  drawWorldMap(ctx, m) {
    const g = this.game;
    const tw = 10, th = 8;
    const W = m.w * tw, H = m.h * th;
    const ox = Math.round((SCREEN_W - W) / 2), oy = HUD_H + 28;

    // A frame, so the sea reads as ending at a coast rather than at the edge
    // of the drawing.
    ctx.fillStyle = '#101820';
    ctx.fillRect(ox - 1, oy - 1, W + 2, H + 2);
    ctx.drawImage(worldCanvas(g, m), ox, oy);

    // Unexplored screens are painted back out. Doing it this way — cached
    // terrain underneath, the mask on top — is what keeps the expensive part
    // keyed on the tide alone: walking into a new screen changes the mask, and
    // the mask is at most 120 rectangles.
    for (let sy = 0; sy < m.h; sy++) {
      for (let sx = 0; sx < m.w; sx++) {
        if (g.progress.secrets['seen:' + m.id + ':0,' + sx + ',' + sy]) continue;
        ctx.fillStyle = '#0c1218';
        ctx.fillRect(ox + sx * tw, oy + sy * th, tw, th);
      }
    }

    // Landmarks, read off each room DEFINITION's own warps — a warp into a map
    // whose kind is 'dungeon' is a dungeon door, and it is drawn at the tile it
    // actually stands on. Nothing here is a hand-kept list that could fall out
    // of step with the world; move a dungeon entrance and the mark moves.
    for (let sy = 0; sy < m.h; sy++) {
      for (let sx = 0; sx < m.w; sx++) {
        if (!g.progress.secrets['seen:' + m.id + ':0,' + sx + ',' + sy]) continue;
        const def = m.roomDefs['0,' + sx + ',' + sy];
        if (!def || !def.warps) continue;
        for (const w of def.warps) {
          const to = w.to && getMap(w.to.map);
          if (!to || to.kind !== 'dungeon') continue;
          const px = ox + sx * tw + (w.x | 0), py = oy + sy * th + (w.y | 0);
          ctx.fillStyle = '#101820';
          ctx.fillRect(px - 1, py - 1, 3, 3);
          ctx.fillStyle = '#f0c048';
          ctx.fillRect(px, py, 1, 1);
        }
      }
    }

    // YOU ARE HERE. It alternates between two high-contrast colours rather
    // than blinking on and off: the source games blink this because the marker
    // has to be findable over any terrain, and a marker that spends half its
    // time absent is not findable at all — it is just harder to see.
    if (g.room && g.room.mapId === m.id) {
      const cx = ox + g.room.rx * tw + Math.floor(tw / 2);
      const cy = oy + g.room.ry * th + Math.floor(th / 2);
      ctx.fillStyle = '#101820';
      ctx.fillRect(cx - 2, cy - 2, 5, 5);
      ctx.fillStyle = ((g.frame >> 4) & 1) ? '#f8f8e8' : '#e04858';
      ctx.fillRect(cx - 1, cy - 1, 3, 3);
    }

    // The key, only once there is something on the map to key.
    if (Object.keys(g.progress.secrets).some(k => k.startsWith('seen:' + m.id + ':'))) {
      ctx.fillStyle = '#101820';
      ctx.fillRect(5, SCREEN_H - 25, 3, 3);
      ctx.fillStyle = '#f0c048';
      ctx.fillRect(6, SCREEN_H - 24, 1, 1);
      drawText(ctx, 'RUIN', 11, SCREEN_H - 26, '#a8b0a0');
    }
  }

  /** Dungeon floor grid. Unchanged: `A3` says why it is already right. */
  drawDungeonMap(ctx, m) {
    const g = this.game;
    const isDungeon = true;
    const haveMap = !!g.progress.dungeonMaps[m.id];
    const haveChart = !!g.progress.charts[m.id];

    const floor = this.mapFloor || 0;
    const cell = 10;
    const gw = m.w * cell, gh = m.h * cell;
    const ox = Math.round((SCREEN_W - gw) / 2), oy = HUD_H + 28;

    // A MULTI-SCREEN ROOM IS ONE CELL SPANNING SEVERAL, as the source's dungeon
    // maps draw them. The grid is walked cell by cell, but a cell that is
    // COVERED by a room keyed further up or left is skipped: only the room's
    // own top-left cell draws, and it draws sw x sh cells wide. Drawing every
    // covered cell instead would paint a 2x1 room as two rooms with a seam
    // between them, which is exactly the lie the whole feature is against.
    for (let y = 0; y < m.h; y++) {
      for (let x = 0; x < m.w; x++) {
        if (!hasRoom(m.id, floor, x, y)) continue;
        // Read from the DEFINITION, not from a Room: opening the map screen
        // must not instantiate every room on the floor, because an instantiated
        // room is one `liveRooms` will then save and restore the state of.
        const key = floor + ',' + x + ',' + y;
        if (roomKeyAt(m.id, floor, x, y) !== key) continue;      // a covered cell
        const sz = m.roomDefs[key].size || [1, 1];
        const sw = sz[0] | 0, sh = sz[1] | 0;
        const seen = g.progress.secrets['seen:' + m.id + ':' + floor + ',' + x + ',' + y];
        if (!seen && !haveMap) continue;
        const here = g.room && g.room.rx === x && g.room.ry === y && g.room.floor === floor;
        ctx.fillStyle = here ? '#f8f8e8' : (seen ? '#58b0e0' : '#304858');
        ctx.fillRect(ox + x * cell, oy + y * cell, sw * cell - 1, sh * cell - 1);

        // THE CHARTSTONE. A room is marked with one pip per tide level that
        // CHANGES it — which is information the game already computes on every
        // room load and then throws away. The pips are stacked LOW at the
        // bottom and HIGH at the top, matching how water is drawn everywhere
        // else in this game, so the mark is readable without a key.
        if (!haveChart || !isDungeon) continue;
        const marks = tideMarks(m.id, floor, x, y);
        if (!marks) continue;
        for (let lv = 0; lv < 3; lv++) {
          if (!(marks & (1 << lv))) continue;
          ctx.fillStyle = TIDE_PIP[lv];
          ctx.fillRect(ox + x * cell + sw * cell - 3, oy + y * cell + (2 - lv) * 3, 2, 2);
        }
      }
    }
    if (isDungeon) {
      drawText(ctx, 'FLOOR ' + (floor + 1) + '/' + m.floors, 6, SCREEN_H - 24, '#a8b0a0');
      if (!haveMap) drawText(ctx, 'No map found', 6, SCREEN_H - 34, '#e04858');
      if (haveChart) {
        // The key, in the same stacking order as the pips.
        let kx = SCREEN_W - 46;
        for (let lv = 2; lv >= 0; lv--) {
          ctx.fillStyle = TIDE_PIP[lv];
          ctx.fillRect(kx, SCREEN_H - 24, 2, 2);
          drawText(ctx, TIDE_NAMES[lv][0], kx + 4, SCREEN_H - 26, '#a8b0a0');
          kx += 13;
        }
      }
    }
  }

  drawQuest(ctx) {
    const g = this.game, p = g.progress;
    let y = HUD_H + 16;
    drawText(ctx, 'ESSENCES OF THE TIDE', 6, y, '#a8f0f8'); y += 11;
    for (let i = 1; i <= essenceCount(); i++) {
      const got = p.essences.includes(i);
      sprites.draw(ctx, 'p_essence' + i + (got ? '_0' : '_dim'), 6 + (i - 1) * 18, y, { pal: got ? 'essence' + i : 'uidark' });
    }
    y += 20;
    drawText(ctx, `Hearts ${Math.ceil(p.hearts / HEART_UNITS)}/${Math.ceil(p.maxHearts / HEART_UNITS)}`
      + `   Pieces ${p.heartPieces}/4`, 6, y, '#f8f8e8');
    y += 11;
    drawText(ctx, `Rupees ${p.rupees}   Deaths ${p.deaths}`, 6, y, '#f8f8e8');
    y += 13;
    drawText(ctx, 'SCRIMSHAW ' + ownedCharms(p).length + '/' + CHARM_COUNT, 6, y, '#a8f0f8');
    y += 10;
    drawText(ctx, `Blanks ${p.blanks || 0}`
      + (p.carve ? `   Carving: ${p.carve.turns} tide${p.carve.turns === 1 ? '' : 's'}` : ''),
      6, y, '#f8f8e8');
    // Tighter than the gaps above it: this is the last block on a 144-pixel
    // screen and the footer sits at SCREEN_H - 11, so a 16-pixel icon on a
    // 13-pixel step overlaps 'SELECT: tab'.
    y += 9;

    // The Coastwise Chain. This screen is the ONLY place the player can look up
    // what they are carrying — a trade item is not in the item grid, because it
    // is not an item and putting it there would offer to equip it to a button.
    // The line is drawn only once the chain has started, so a new game's quest
    // screen does not advertise a quest nobody has met yet.
    if (p.trade && p.trade.stage) {
      drawText(ctx, 'COASTWISE CHAIN', 6, y, '#a8f0f8');
      y += 10;
      if (p.trade.item) {
        sprites.draw(ctx, tradeIcon(p.trade.item), 4, y - 4);
        drawText(ctx, tradeName(p.trade.item), 22, y, '#f8f8e8');
      } else {
        drawText(ctx, 'Nothing left to carry.', 6, y, '#687888');
      }
    }
  }

  // ------------------------------------------------------------ scrimshaw

  /**
   * Three cases stacked as tide levels, HIGH at the top. The live one is
   * highlighted, which is the entire teaching job this screen has: a charm in
   * a case that is not lit is a charm doing nothing, and that has to be
   * obvious at a glance and at 160x144.
   */
  drawCharms(ctx) {
    const g = this.game, p = g.progress;
    const live = g.scrim.liveSlots;
    const size = caseSize(p);
    let y = HUD_H + 16;

    for (let r = 0; r < CASE_ROWS.length; r++) {
      const slot = CASE_ROWS[r];
      const lv = CHARM_SLOTS.indexOf(slot);
      const on = live.has(slot) && slotOpen(p, slot);
      const here = r === this.caseRow;

      if (on) { ctx.fillStyle = '#203848'; ctx.fillRect(2, y - 2, SCREEN_W - 4, 13); }
      if (here) { ctx.fillStyle = '#f8f8e8'; ctx.fillRect(2, y - 2, 1, 13); }

      // The tide pip, the same three tones the water itself is drawn in, so
      // the row needs no key to read as a tide level.
      ctx.fillStyle = TIDE_PIP[lv];
      ctx.fillRect(6, y + 1, 5, 5);
      drawText(ctx, TIDE_NAMES[lv], 14, y, on ? '#f8f8e8' : '#687888');

      if (!slotOpen(p, slot)) {
        drawText(ctx, 'shut', 48, y, '#485868');
      } else {
        for (let i = 0; i < size; i++) {
          const id = p.charmSlots[slot][i];
          const cx = 48 + i * 13;
          if (id) sprites.draw(ctx, 'i_charm', cx, y - 1, { pal: CHARMS[id].color });
          else { ctx.strokeStyle = '#485868'; ctx.strokeRect(cx + 0.5, y - 0.5, 9, 9); }
        }
      }
      y += 14;
    }

    // The pool: everything owned that fits the highlighted case.
    const pool = this.pool;
    y += 3;
    drawText(ctx, this.caseSlot.toUpperCase() + ' CASE  ' + pool.length + ' fit', 6, y, '#a8f0f8');
    y += 10;
    if (!pool.length) {
      drawText(ctx, 'Nothing carved for this case.', 6, y, '#a8b0a0');
      return;
    }
    const inCase = equippedIn(p, this.caseSlot);
    pool.forEach((id, i) => {
      const cx = 6 + i * 12;
      if (cx > SCREEN_W - 12) return;
      sprites.draw(ctx, 'i_charm', cx, y, { pal: CHARMS[id].color });
      if (inCase.includes(id)) { ctx.fillStyle = '#48c868'; ctx.fillRect(cx, y - 2, 9, 1); }
      if (i === this.poolCursor) { ctx.fillStyle = '#f8f8e8'; ctx.fillRect(cx, y + 10, 9, 1); }
    });
    y += 14;
    const sel = CHARMS[pool[this.poolCursor]];
    if (!sel) return;
    drawText(ctx, sel.name, 6, y, '#f8f8e8');
    const w = this.descWindow(sel.desc, DESC_WRAP_W.charm);
    drawText(ctx, w.lines[0] || '', 6, y + 9, '#a8b0a0');
    if (w.more) this.drawScrollMark(ctx, SCREEN_W - 11, y + 9, w);
  }

  drawSave(ctx) {
    const opts = ['Save game', 'Save and quit to title'];
    let y = HUD_H + 34;
    for (let i = 0; i < opts.length; i++) {
      drawText(ctx, (i === this.saveCursor ? '\x02 ' : '  ') + opts[i], 20, y + i * 14, '#f8f8e8');
    }
    drawText(ctx, 'Slot ' + (this.game.slot + 1), 20, y + 34, '#a8b0a0');
  }
}
