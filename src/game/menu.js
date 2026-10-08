// The pause menus, as Seasons has them (S176). START opens the item menu:
// three pages, turned with SELECT, sliding in from the right — the items; the
// treasures and the charm cases (where Seasons keeps its ring box); the
// Essences, the heart pieces and SAVE. SELECT out in the field opens the map
// instead, and START and SELECT together go straight to the save screen
// (bank2.s b2_updateMenus, menuStateFadeIntoMenu). No page has a title.

import { SCREEN_W, SCREEN_H, HUD_H, VIEW_W, VIEW_H } from '../core/screen.js';
import { drawText, drawTextCentered, textWidth, wrapText } from '../gfx/font.js';
import { sprites, tiles } from '../gfx/art.js';
import { getPalette } from '../gfx/palettes.js';
import { tileArt } from '../world/tileset.js';
import { ITEMS, itemIcon, itemName, inventorySlots, INVENTORY_SLOTS } from './items.js';
import { drawItemExtra } from './hud.js';
import {
  CHARMS, CHARM_SLOTS, CHARM_COUNT, ownedCharms, charmsForSlot, slotCharm,
  caseSize, slotOpen, equippedIn,
} from './scrimshaw.js';
import { flag, itemLevel } from './progress.js';
import { essenceCount } from '../world/maps.js';
import { MAPS, getMap, hasRoom, getRoom, roomKeyAt } from '../world/maps.js';
import { TIDE_NAMES, TIDE_COUNT } from './tide.js';
import { tradeName, tradeIcon } from '../data/trade.js';
import { DUNGEON_KEYS } from '../data/keys.js';
import {
  MENU_DESC_DWELL, MENU_DESC_HOLD, MENU_FADE_CLOSE, MENU_SAVE_FADE, GAMEOVER_PICK_FRAMES,
  MENU_PAGE_SLIDE, MENU_PAGE_SLIDE_W,
} from '../data/feel.js';
import { drawScreen, screenImage } from '../gfx/screens.js';

// THE SEASONS INVENTORY PAGES (tools/rip-menu.py, off the cartridge): a white
// page in a frame of olive blocks, dividers, and a strip under it where the
// source names the thing under the cursor. Everything below draws dark on
// that white, in the page's own ink. The map screen still draws on page 1's
// frame: Seasons' own map screens are not ripped yet.

const PAGE = { x: 8, y: 24, w: 144, h: 88 };   // the white page
const STRIP_Y = 126;                             // the line in the strip
const INK = '#202020';                           // body text
const BLUE = '#285088';                          // the strip's ink, off the page
const DIM = '#98a0a0';                           // what is not there yet
const CURSOR = '#285088';
const PAPER = '#ffffff';                         // the page's white (rip-menu.py)

/**
 * The pixel width a description is wrapped to, per panel. Exported because
 * tools/check-text.mjs proves every description fits one of them — a single
 * word too long to break is the one thing wrapText cannot fix, and it would
 * run off the edge of the panel — and a checker with its own copy of the
 * number is a checker that stops describing the game the moment the panel
 * moves.
 */
export const DESC_WRAP_W = { item: SCREEN_W - 28, charm: SCREEN_W - 28 };

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


/** The three pages of the item menu, in the order SELECT turns them. */
export const PAGES = ['items', 'treasures', 'quest'];

// The charm cases on page 2's ring-box row, in tide order HIGH -> LOW, left
// to right; each case is two cells wide (CHARM_CASE_MAX), at these columns.
const CASE_ROWS = ['high', 'mid', 'low'];
const CASE_COL = [4, 9, 14];
const CASE_ROW = 12;

// Page 2's treasures: Seasons' fifteen places (subscreen1TreasureData), five
// across at columns 3, 6, 9, 12, 15 and three down at rows 3, 6, 9, a
// treasure's 8x16 picture in the left one of its two cells.
const TREASURE_SLOTS = 15;
const treasureAt = i => ({ x: (3 + 3 * (i % 5)) * 8, y: (3 + 3 * Math.floor(i / 5)) * 8 });

// Page 3's Essences. Seasons rings its eight round the left of the page
// (itemSubmenu2EssencePositions); this game has six, so they stand at
// Seasons' four corner places — top pair, bottom pair — and halfway down
// either side, where its two side pairs would meet.
const ESSENCE_AT = [[32, 32], [56, 32], [72, 60], [56, 88], [32, 88], [16, 60]];
// What each Essence is called on its title card (src/data/story.js).
const ESSENCE_NAMES = ['the Shallow Bell', 'the Coral Bell', 'the Bog Bell', 'the Cliff Bell',
  'the Drowned Bell', "the Drowned King's Bell"];
// Page 3's right column, below the season's place: the heart box and SAVE
// (inventorySubmenu2_drawCursor @offsets 9 and 10).
const RIGHT_AT = [[112, 72], [112, 96]];

// The charm chooser: a box of the page's own blocks over page 2's treasures,
// columns 1-18 and rows 4-9, holding two rows of eight.
const POP = { c0: 1, c1: 18, r0: 4, r1: 9, per: 8 };

export class Menu {
  constructor(game) {
    this.game = game;
    this.kind = 'inventory';   // 'inventory' | 'map' | 'save'
    this.page = 0;
    this.slide = 0;            // frames into a page turn; 0 when still
    this.slideFrom = 0;
    this.cursor = 0;           // page 1: the sixteen places
    this.cursor2 = 0;          // page 2: 0-14 treasures, 15-17 the cases
    this.cursor3 = 0;          // page 3: 0-5 Essences, 6 hearts, 7 SAVE
    this.popup = null;         // page 2's charm chooser: { row, at }
    this.mapFloor = 0;
    this.saveCursor = 0;
    this.savePicked = -1;
    this.savePickT = 0;
    this.message = '';
    this.messageTime = 0;
    this.descKey = '';
    this.descT = 0;
  }

  /**
   * Bring a menu up; the fade to white in front of it is the caller's. The
   * item menu always opens on page 1 (inventoryMenuState0 zeroes
   * wInventorySubmenu), and each page's cursor stays where it was left, as
   * Seasons' wInventorySubmenu0CursorPos does.
   */
  open(kind = 'inventory') {
    const g = this.game;
    g.mode = 'menu';
    this.kind = kind;
    this.page = 0;
    this.slide = 0;
    this.popup = null;
    this.saveCursor = 0;          // Seasons' save screen opens on CONTINUE
    this.savePicked = -1;
    if (g.map && g.room && g.room.mapId === g.map.id) this.mapFloor = g.room.floor || 0;
    // SND_OPENMENU comes with the page, after the fade (menuStateFadeIntoMenu
    // @openMenu), and not for the save screen.
    if (kind !== 'save') g.audio.sfx('pause');
  }

  /** Through white again, the way it came (MENU_FADE_CLOSE); closeMenu plays
   *  SND_CLOSEMENU except out of the save screen. */
  close() {
    const g = this.game;
    if (this.kind !== 'save') g.audio.sfx('unpause');
    g.fadeOut(() => { g.mode = 'play'; }, true, MENU_FADE_CLOSE);
  }

  /** Which page the item menu is showing ('items', 'treasures', 'quest'). */
  get pageName() { return PAGES[this.page]; }

  /** The inventory's sixteen places, each `{ id, level, def }` or null. */
  get items() {
    const p = this.game.progress;
    return inventorySlots(p).map(id => id ? { id, level: itemLevel(p, id), def: ITEMS[id] } : null);
  }

  update() {
    const g = this.game;
    const i = g.input;
    if (this.messageTime > 0) this.messageTime--;
    this.tickDesc();
    // Nothing answers while it is fading in or out.
    if (g.fadeDir || g.fadeHold > 0) return;

    if (this.kind === 'save') { this.updateSave(); return; }
    if (this.kind === 'map') { this.updateMap(); return; }

    if (this.slide) { this.updateSlide(); return; }
    if (this.popup) { this.updatePopup(); return; }
    if (i.pressed('start')) { this.close(); return; }
    if (i.pressed('select')) {
      // inventoryMenuState3: the next page comes in from the right, and the
      // turn plays SND_OPENMENU.
      this.slideFrom = this.page;
      this.page = (this.page + 1) % PAGES.length;
      this.slide = 1;
      g.audio.sfx('pause');
      return;
    }
    if (this.page === 0) this.updateItems();
    else if (this.page === 1) this.updateTreasures();
    else this.updateQuest();
  }

  /**
   * The page turn: the frame SELECT is pressed shows the old page still (the
   * window is only set up then, inventoryMenuState3 @subState0), then the new
   * page comes in MENU_PAGE_SLIDE a frame, and the frame it reaches 0 is the
   * page standing still again (@subState2), answering from the next.
   */
  updateSlide() {
    this.slide++;
    if (this.slideX() <= 0) this.slide = 0;
  }

  /** Where the incoming page stands this frame (0 once it has arrived). */
  slideX() { return Math.max(0, MENU_PAGE_SLIDE_W - MENU_PAGE_SLIDE * (this.slide - 1)); }

  /**
   * SEASONS' ITEM PAGE (S169; code/bank2.s inventoryMenuState1 @subscreen0):
   * sixteen places, four by four; the cursor steps one place across or four
   * down and runs on round all sixteen (`and $0f`). A or B swaps the place
   * under the cursor with that button's item — the item comes off the page and
   * the button's goes into its place, and an empty place takes the item off
   * the button.
   */
  updateItems() {
    const g = this.game, i = g.input;
    let c = this.cursor;
    if (i.pressed('right')) c += 1;
    else if (i.pressed('left')) c -= 1;
    else if (i.pressed('up')) c -= 4;
    else if (i.pressed('down')) c += 4;
    if (c !== this.cursor) {
      this.cursor = (c + INVENTORY_SLOTS) % INVENTORY_SLOTS;
      g.audio.sfx('cursor');
    }
    if (i.pressed('a')) this.assign('A');
    else if (i.pressed('b')) this.assign('B');
  }

  assign(slot) {
    const p = this.game.progress;
    const s = inventorySlots(p);
    const key = slot === 'A' ? 'equipA' : 'equipB';
    const here = s[this.cursor];
    s[this.cursor] = p[key] || null;
    p[key] = here;
    this.game.audio.sfx('confirm');
  }

  // ------------------------------------------------------------ page 2

  /**
   * Page 2's treasures, by place: the six dungeon keys held (the first five
   * across the top row, the sixth starting the second), the Coastwise Chain's
   * object in hand, and the scrimshaw — the charms owned and the blanks
   * carried. Each `{ icon, pal?, count?, name, desc }`, or null where there
   * is nothing. Seasons gives every treasure a fixed place; so does this.
   */
  get treasures() {
    const p = this.game.progress;
    const out = new Array(TREASURE_SLOTS).fill(null);
    DUNGEON_KEYS.forEach((k, n) => {
      if (flag(p, k.flag)) out[n] = { icon: k.icon, name: k.name, desc: k.desc };
    });
    if (p.trade && p.trade.item) {
      out[6] = { icon: tradeIcon(p.trade.item), name: tradeName(p.trade.item), desc: '' };
    }
    const owned = ownedCharms(p).length;
    if (owned || p.blanks || p.carve) {
      const carving = p.carve ? ` One is being carved: ${p.carve.turns} tide${p.carve.turns === 1 ? '' : 's'} to go.` : '';
      out[7] = {
        icon: 'i_charm', pal: 'i_charm', count: p.blanks || 0,
        name: `Scrimshaw ${owned}/${CHARM_COUNT}`,
        desc: `Blanks carried: ${p.blanks || 0}.${carving}`,
      };
    }
    return out;
  }

  /** The cases that can be chosen on page 2's bottom row: the open ones. */
  get openCases() { return CASE_ROWS.filter(s => slotOpen(this.game.progress, s)); }

  /** The case the page 2 cursor is on, or null on a treasure. */
  get caseSlot() {
    return this.cursor2 >= TREASURE_SLOTS ? CASE_ROWS[this.cursor2 - TREASURE_SLOTS] : null;
  }

  /** The charms that fit the case the chooser is open on. */
  get pool() {
    return this.popup ? charmsForSlot(this.game.progress, CASE_ROWS[this.popup.row]) : [];
  }

  /**
   * The cursor runs round all fifteen treasure places and on to the open
   * cases, left and right; up and down step a row of five, and the bottom
   * row of treasures steps down onto the case under it and back
   * (inventorySubmenu1CheckDirectionButtons, @ringBoxRowPositionMappings).
   * A on a case opens its chooser.
   */
  updateTreasures() {
    const g = this.game, i = g.input;
    const open = CASE_ROWS.map(s => slotOpen(g.progress, s));
    const stops = [];
    for (let k = 0; k < TREASURE_SLOTS; k++) stops.push(k);
    open.forEach((o, k) => { if (o) stops.push(TREASURE_SLOTS + k); });
    const caseUnder = col => [0, 0, 1, 2, 2][col];
    const colOver = k => [0, 2, 4][k];
    let c = this.cursor2;
    if (!stops.includes(c)) c = 0;
    const was = c;
    const nearestCase = k => {
      // A shut case passes the cursor to the nearest open one, or back up.
      for (const d of [0, 1, -1, 2, -2]) if (open[k + d]) return TREASURE_SLOTS + k + d;
      return -1;
    };
    if (i.pressed('right') || i.pressed('left')) {
      const at = stops.indexOf(c) + (i.pressed('right') ? 1 : -1);
      c = stops[(at + stops.length) % stops.length];
    } else if (i.pressed('down')) {
      if (c >= TREASURE_SLOTS) c = colOver(c - TREASURE_SLOTS);
      else if (c >= 10) { const k = nearestCase(caseUnder(c - 10)); c = k >= 0 ? k : c - 10; }
      else c += 5;
    } else if (i.pressed('up')) {
      if (c >= TREASURE_SLOTS) c = 10 + colOver(c - TREASURE_SLOTS);
      else if (c < 5) { const k = nearestCase(caseUnder(c)); c = k >= 0 ? k : c + 10; }
      else c -= 5;
    }
    if (c !== was) { this.cursor2 = c; g.audio.sfx('cursor'); }
    else this.cursor2 = c;
    if (i.pressed('a') && this.caseSlot) {
      // The chooser opens on the first charm already in the case, if any.
      const row = this.cursor2 - TREASURE_SLOTS;
      this.popup = { row, at: 0 };
      const inCase = equippedIn(g.progress, CASE_ROWS[row]);
      const k = this.pool.findIndex(id => inCase.includes(id));
      this.popup.at = Math.max(0, k);
      g.audio.sfx('cursor');
    }
  }

  /**
   * THE CHARM CHOOSER, laid out the way Seasons opens a submenu off an item
   * (the satchel's seeds, inventoryMenuState2): a box over the page, the
   * choice marked with the submenu's own arrow. Left and right walk it, up and
   * down step a row, A puts the charm in the case — or, pressed on one
   * already there, takes it out — and B or START puts the box away.
   */
  updatePopup() {
    const g = this.game, i = g.input, p = g.progress;
    const pool = this.pool;
    if (i.pressed('b') || i.pressed('start')) { this.popup = null; g.audio.sfx('cursor'); return; }
    if (!pool.length) {
      if (i.pressed('a')) { this.popup = null; g.audio.sfx('cursor'); }
      return;
    }
    let at = Math.min(this.popup.at, pool.length - 1);
    const was = at;
    if (i.pressed('right')) at = (at + 1) % pool.length;
    else if (i.pressed('left')) at = (at + pool.length - 1) % pool.length;
    else if (i.pressed('down') || i.pressed('up')) {
      const to = at + (i.pressed('down') ? POP.per : -POP.per);
      if (to >= 0 && to < pool.length) at = to;
    }
    if (at !== was) g.audio.sfx('cursor');
    this.popup.at = at;
    if (!i.pressed('a')) return;
    const slot = CASE_ROWS[this.popup.row];
    const id = pool[at];
    const inCase = equippedIn(p, slot);
    if (inCase.includes(id)) {
      slotCharm(p, slot, p.charmSlots[slot].indexOf(id), null);
      g.audio.sfx('cursor');
      this.flash(CHARMS[id].name + ' off');
    } else {
      const size = caseSize(p);
      let k = p.charmSlots[slot].slice(0, size).indexOf(null);
      if (k < 0) k = size - 1;              // full: the newest replaces the last
      slotCharm(p, slot, k, id);
      g.audio.sfx('confirm');
      this.flash(CHARMS[id].name + ' on ' + slot.toUpperCase());
    }
    this.popup = null;
  }

  // ------------------------------------------------------------ page 3

  /**
   * Page 3: the cursor goes round the six Essences on the left, and left or
   * right crosses to the column on the right, where up and down step between
   * the heart box and SAVE — the season's place above them is never a stop
   * here, as it is not in Seasons' dungeons (inventorySubmenu2CheckDirection-
   * Buttons). A on SAVE goes to the save screen.
   */
  updateQuest() {
    const g = this.game, i = g.input;
    let c = this.cursor3;
    const n = essenceCount();
    if (i.pressed('left') || i.pressed('right')) c = c < n ? n : 0;
    else if (i.pressed('up') || i.pressed('down')) {
      const d = i.pressed('down') ? 1 : -1;
      if (c < n) c = (c + d + n) % n;
      else c = c === n ? n + 1 : n;
    }
    if (c !== this.cursor3) { this.cursor3 = c; g.audio.sfx('cursor'); }
    if (i.pressed('a') && this.cursor3 === n + 1) {
      g.audio.sfx('confirm');
      g.fadeOut(() => { this.kind = 'save'; this.saveCursor = 0; this.savePicked = -1; },
        true, MENU_SAVE_FADE);
    }
  }

  /** The dungeon map changes floor with up and down; B or SELECT puts the
   *  map away (bank2.s runMapMenu @checkInput). START does nothing there. */
  updateMap() {
    const g = this.game, i = g.input;
    if (i.pressed('b') || i.pressed('select')) { this.close(); return; }
    if (g.map && g.map.floors > 1) {
      if (i.pressed('up')) this.mapFloor = Math.min(g.map.floors - 1, (this.mapFloor || 0) + 1);
      if (i.pressed('down')) this.mapFloor = Math.max(0, (this.mapFloor || 0) - 1);
    }
  }

  // ------------------------------------------------- scrolling descriptions
  //
  // The description panel is ONE line of this font tall — the item grid is
  // above it and the page's frame below, and neither has a row to give — while
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
    if (this.kind !== 'inventory' || this.slide) return '';
    if (this.page === 0) {
      const it = this.items[this.cursor];
      return it ? 'item:' + it.id + ':' + it.level : 'item:';
    }
    if (this.page === 1) {
      if (this.popup) return 'charm:' + (this.pool[this.popup.at] || '');
      return 'treasure:' + this.cursor2;
    }
    return 'quest:' + this.cursor3;
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


  /**
   * SEASONS' SAVE SCREEN (runSaveAndQuitMenu, S169): CONTINUE, SAVE & CONT.,
   * SAVE & QUIT. The cursor stops at either end, A or START chooses, and a
   * choice flickers the acorn for GAMEOVER_PICK_FRAMES before it takes effect
   * — the same screen and the same rules as the game over
   * (Game.updateGameOver). B goes straight back to the game (@bPressed).
   */
  updateSave() {
    const g = this.game, i = g.input;
    if (this.savePicked >= 0) {
      if (--this.savePickT <= 0) this.saveChoose(this.savePicked);
      return;
    }
    if (i.pressed('b')) { this.close(); return; }
    if (i.pressed('up') && this.saveCursor > 0) { this.saveCursor--; g.audio.sfx('cursor'); }
    if (i.pressed('down') && this.saveCursor < 2) { this.saveCursor++; g.audio.sfx('cursor'); }
    if (i.pressed('a') || i.pressed('start')) {
      this.savePicked = this.saveCursor;
      this.savePickT = GAMEOVER_PICK_FRAMES;
      g.audio.sfx('confirm');
    }
  }

  saveChoose(n) {
    const g = this.game;
    this.savePicked = -1;
    if (n === 0) { this.close(); return; }
    const ok = g.save();
    if (!ok) { g.audio.sfx('deny'); this.flash('Could not save.'); return; }
    if (n === 1) { this.close(); return; }
    g.mode = 'title';
    g.title.reset();
    g.audio.play('title');
  }

  flash(msg) { this.message = msg; this.messageTime = 90; }


  // ------------------------------------------------------------------- draw

  draw(ctx) {
    if (this.kind === 'save') { this.drawSave(ctx); return; }
    if (this.kind === 'map') {
      drawScreen(ctx, 'invPage1', 0, HUD_H);
      const strip = this.drawMap(ctx);
      const line = this.messageTime > 0 ? this.message : strip;
      if (line) drawTextCentered(ctx, line, SCREEN_W / 2, STRIP_Y, BLUE);
      return;
    }
    // The pages, under the status bar, which is the game's own and holds
    // still while they turn.
    ctx.save();
    ctx.beginPath(); ctx.rect(0, HUD_H, SCREEN_W, SCREEN_H - HUD_H); ctx.clip();
    if (this.slide === 1) {
      this.drawPage(ctx, this.slideFrom, 0, false);
    } else if (this.slide) {
      this.drawPage(ctx, this.slideFrom, -(MENU_PAGE_SLIDE * (this.slide - 1)), false);
      this.drawPage(ctx, this.page, this.slideX(), false);
    } else {
      this.drawPage(ctx, this.page, 0, true);
    }
    ctx.restore();
  }

  /**
   * One page at `ox` across. While a page turns, the new page's strip is
   * empty (func_02_55b2 clears the text) and nothing is under a cursor.
   */
  drawPage(ctx, page, ox, live) {
    ctx.save();
    ctx.translate(Math.round(ox), 0);
    drawScreen(ctx, ['invPage1', 'invPage2', 'invPage3'][page], 0, HUD_H);
    let strip = null;
    if (page === 0) strip = this.drawItems(ctx, live);
    else if (page === 1) strip = this.drawTreasures(ctx, live);
    else strip = this.drawQuest(ctx, live);
    if (live) {
      // The item page hands back its strip with the scroll it is part of.
      if (strip && typeof strip === 'object') {
        if (strip.w.more) this.drawScrollMark(ctx, SCREEN_W - 12, STRIP_Y, strip.w);
        strip = strip.text;
      }
      const line = this.messageTime > 0 ? this.message : strip;
      if (line) drawTextCentered(ctx, line, SCREEN_W / 2, STRIP_Y, BLUE);
    }
    ctx.restore();
  }

  /** The page's two brackets either side of a cell `w` wide at (x, y). */
  drawBrackets(ctx, x, y, w = 16) {
    sprites.draw(ctx, 'menu_cursor_l', x - 8, y);
    sprites.draw(ctx, 'menu_cursor_r', x + w, y);
  }

  /** Fill tile columns c0..c1, rows r0..r1 with the page's block. */
  fillBlocks(ctx, c0, r0, c1, r1) {
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) drawScreen(ctx, 'invBlock', c * 8, r * 8);
  }

  /**
   * The places where Seasons draws them (inventorySubscreen0_drawStoredItems
   * @itemPositions): an item's 8x16 picture at tile (3 + 4 col, 3 + 3 row) of
   * the screen, its level or count one tile right and one down, and the
   * cursor's two brackets a tile either side (inventorySubscreen0_drawCursor).
   * The name and then the description run in the strip below the page.
   */
  drawItems(ctx, live = true) {
    const p = this.game.progress;
    const list = this.items;
    list.forEach((it, i) => {
      const x = 24 + (i & 3) * 32, y = 24 + (i >> 2) * 24;
      if (live && i === this.cursor) this.drawBrackets(ctx, x, y, 24);
      if (!it) return;
      // The icon is an 8px picture centred in a 16px cell.
      sprites.draw(ctx, itemIcon(it.id, it.level), x - 4, y, { pal: it.def.pal });
      drawItemExtra(ctx, it.id, p, x + 8, y + 8);
    });
    const sel = list[this.cursor];
    if (!sel) return null;
    const name = itemName(sel.id, sel.level);
    const w = this.descWindow(name + '\n' + (sel.def.desc || ''), DESC_WRAP_W.item);
    return { text: w.lines[0] || '', w };
  }

  /**
   * Page 2 (inventorySubscreen1_drawTreasures): the treasures in their
   * places, then the ring box's row — here the three charm cases. With no
   * case open the row is filled with the page's block, as Seasons fills it
   * before Link has a ring box (@ringBoxClearTiles, level 0), and a shut case
   * or a cell the case is not yet big enough for is blocked over the same way.
   */
  drawTreasures(ctx, live = true) {
    const g = this.game, p = g.progress;
    const list = this.treasures;
    list.forEach((t, k) => {
      const { x, y } = treasureAt(k);
      if (live && !this.popup && this.cursor2 === k) this.drawBrackets(ctx, x, y);
      if (!t) return;
      sprites.draw(ctx, t.icon, x - 4, y, t.pal ? { pal: t.pal } : undefined);
      if (t.count != null) {
        const n = Math.max(0, Math.min(99, t.count));
        sprites.draw(ctx, 'hud_d' + Math.floor(n / 10), x + 8, y + 8);
        sprites.draw(ctx, 'hud_d' + (n % 10), x + 16, y + 8);
      }
    });

    const open = this.openCases;
    if (!open.length) {
      this.fillBlocks(ctx, 1, CASE_ROW, 18, CASE_ROW + 2);
    } else {
      const size = caseSize(p);
      const live2 = g.scrim.liveSlots;
      CASE_ROWS.forEach((slot, k) => {
        const c = CASE_COL[k], x = c * 8, y = CASE_ROW * 8;
        if (!slotOpen(p, slot)) { this.fillBlocks(ctx, c, CASE_ROW, c + 1, CASE_ROW + 1); return; }
        for (let n = 0; n < 2; n++) {
          if (n >= size) { this.fillBlocks(ctx, c + n, CASE_ROW, c + n, CASE_ROW + 1); continue; }
          const id = p.charmSlots[slot][n];
          if (id) sprites.draw(ctx, 'i_charm', x + n * 8 - 4, y, { pal: CHARMS[id].color });
        }
        // The case's tide, in the three tones the water is drawn in: filled
        // for the case the sea is at now, hollow for the other two.
        const lv = CHARM_SLOTS.indexOf(slot);
        ctx.fillStyle = TIDE_PIP[lv];
        if (live2.has(slot)) ctx.fillRect(x + 18, y + 10, 4, 4);
        else { ctx.fillRect(x + 18, y + 10, 4, 1); ctx.fillRect(x + 18, y + 13, 4, 1);
               ctx.fillRect(x + 18, y + 10, 1, 4); ctx.fillRect(x + 21, y + 10, 1, 4); }
        if (live && !this.popup && this.caseSlot === slot) this.drawBrackets(ctx, x, y);
      });
    }

    if (this.popup && live) return this.drawPopup(ctx);
    const c = this.caseSlot;
    if (c) {
      const ids = (p.charmSlots[c] || []).filter(Boolean);
      return c.toUpperCase() + ' case: ' + (ids.length ? ids.map(id => CHARMS[id].name).join(', ') : 'empty');
    }
    const t = list[this.cursor2];
    if (!t) return null;
    const w = this.descWindow(t.desc ? t.name + '\n' + t.desc : t.name, DESC_WRAP_W.item);
    return { text: w.lines[0] || '', w };
  }

  /** The charm chooser over page 2 (see updatePopup). */
  drawPopup(ctx) {
    const p = this.game.progress;
    const slot = CASE_ROWS[this.popup.row];
    this.fillBlocks(ctx, POP.c0, POP.r0, POP.c1, POP.r0);
    this.fillBlocks(ctx, POP.c0, POP.r1, POP.c1, POP.r1);
    this.fillBlocks(ctx, POP.c0, POP.r0, POP.c0, POP.r1);
    this.fillBlocks(ctx, POP.c1, POP.r0, POP.c1, POP.r1);
    ctx.fillStyle = PAPER;
    ctx.fillRect((POP.c0 + 1) * 8, (POP.r0 + 1) * 8, (POP.c1 - POP.c0 - 1) * 8, (POP.r1 - POP.r0 - 1) * 8);
    const pool = this.pool;
    if (!pool.length) return 'Nothing carved fits the ' + slot.toUpperCase() + ' case.';
    const inCase = equippedIn(p, slot);
    pool.forEach((id, k) => {
      const x = (POP.c0 + 1) * 8 + (k % POP.per) * 16 + 4, y = (POP.r0 + 1) * 8 + Math.floor(k / POP.per) * 16;
      sprites.draw(ctx, 'i_charm', x - 4, y, { pal: CHARMS[id].color });
      if (inCase.includes(id)) { ctx.fillStyle = '#28a048'; ctx.fillRect(x, y, 8, 1); }
      if (k === this.popup.at) drawScreen(ctx, 'invSubCursor', x, y + 10);
    });
    const sel = CHARMS[pool[this.popup.at]];
    if (!sel) return null;
    const w = this.descWindow(sel.name + '\n' + sel.desc, DESC_WRAP_W.charm);
    return { text: w.lines[0] || '', w };
  }

  /**
   * Page 3 (inventorySubscreen2_drawTreasures): the Essences held — an
   * Essence not yet found is simply not there, as the cartridge clears it —
   * the season's place blocked over as Seasons blocks it in a dungeon (this
   * game has no season to show there), the heart box filled a quarter for
   * each piece held with the count beside it, and SAVE.
   */
  drawQuest(ctx, live = true) {
    const p = this.game.progress;
    const n = essenceCount();
    this.fillBlocks(ctx, 13, 2, 18, 5);
    for (let k = 0; k < n; k++) {
      const [x, y] = ESSENCE_AT[k];
      if (p.essences.includes(k + 1)) sprites.draw(ctx, 'p_essence' + (k + 1) + '_0', x, y, { pal: 'essence' + (k + 1) });
      if (live && this.cursor3 === k) this.drawBrackets(ctx, x, y);
    }
    const pieces = Math.max(0, Math.min(3, p.heartPieces | 0));
    if (pieces) {
      const h = screenImage('invHeart' + pieces);
      drawScreen(ctx, 'invHeart' + pieces, h.ax, HUD_H + h.ay);
    }
    // The count, in the page's own digit (w4TileMap+$14f: row 10, column 15).
    const dg = screenImage('invDigits');
    ctx.drawImage(dg.canvas, pieces * 8, 0, 8, 8, 15 * 8, 10 * 8, 8, 8);
    if (live && this.cursor3 >= n) {
      const [x, y] = RIGHT_AT[this.cursor3 - n];
      this.drawBrackets(ctx, x, y, 32);
    }
    if (this.cursor3 < n) {
      return p.essences.includes(this.cursor3 + 1) ? 'Essence: ' + ESSENCE_NAMES[this.cursor3] : null;
    }
    if (this.cursor3 === n) return `Pieces of Heart: ${pieces} of 4`;
    return 'Save your progress';
  }

  drawMap(ctx) {
    const g = this.game;
    const m = g.map;
    if (!m) return null;
    if (m.kind === 'dungeon') this.drawDungeonMap(ctx, m);
    else this.drawWorldMap(ctx, m);
    return m.name;
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
    // THE WORLD IS WIDER THAN THE PAGE (S157). Seventeen screens at one pixel
    // a tile is 170 pixels and the page is 144, so the picture is a window
    // that slides to keep Link's screen in the middle, stopping at the world's
    // edges, with an arrow on a side where there is more. Nothing is shrunk:
    // a squeezed picture would no longer be one pixel per tile.
    const VW = Math.min(W, PAGE.w - 8);
    const here = g.room && g.room.mapId === m.id ? g.room.rx * tw + (tw >> 1) : W >> 1;
    const left = W > VW ? Math.max(0, Math.min(W - VW, here - (VW >> 1))) : 0;
    const vx = Math.round((SCREEN_W - VW) / 2);
    const ox = vx - left, oy = PAGE.y + Math.max(2, Math.round((PAGE.h - H) / 2));

    // A frame, so the sea reads as ending at a coast rather than at the edge
    // of the drawing.
    ctx.fillStyle = '#101820';
    ctx.fillRect(vx - 1, oy - 1, VW + 2, H + 2);
    ctx.save();
    ctx.beginPath(); ctx.rect(vx, oy, VW, H); ctx.clip();
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

    ctx.restore();
    // More world past the page's edge: a small arrow in the margin that side.
    ctx.fillStyle = '#101820';
    const my = oy + (H >> 1);
    if (left > 0) for (let i = 0; i < 3; i++) ctx.fillRect(vx - 5 + i, my - i, 1, 2 * i + 1);
    if (left < W - VW) for (let i = 0; i < 3; i++) ctx.fillRect(vx + VW + 4 - i, my - i, 1, 2 * i + 1);

    // The key, only once there is something on the map to key.
    if (Object.keys(g.progress.secrets).some(k => k.startsWith('seen:' + m.id + ':'))) {
      // In the strip's right-hand end, under the page: the map fills the page.
      ctx.fillStyle = '#101820';
      ctx.fillRect(PAGE.x + PAGE.w - 32, STRIP_Y + 2, 3, 3);
      ctx.fillStyle = '#f0c048';
      ctx.fillRect(PAGE.x + PAGE.w - 31, STRIP_Y + 3, 1, 1);
      drawText(ctx, 'RUIN', PAGE.x + PAGE.w - 26, STRIP_Y, DIM);
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
    const ox = Math.round((SCREEN_W - gw) / 2), oy = PAGE.y + 11;

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
        ctx.fillStyle = here ? '#e04858' : (seen ? '#58b0e0' : '#b8c8d0');
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
      const fl = 'FLOOR ' + (floor + 1) + '/' + m.floors;
      drawText(ctx, fl, PAGE.x + 2, PAGE.y + 1, INK);
      // The Boss Key, once held, in the page's corner — on the map screen, where
      // Seasons shows it. It used to be a mark on the status bar, which now
      // carries Seasons' key x count in that place and has no room for two keys.
      if (g.progress.bossKeys[m.id]) sprites.draw(ctx, 'p_bosskey', PAGE.x + PAGE.w - 18, PAGE.y + PAGE.h - 17);
      if (!haveMap) drawText(ctx, 'NO MAP', PAGE.x + 2, PAGE.y + PAGE.h - 9, '#c01830');
      if (haveChart) {
        // The key, in the same stacking order as the pips.
        let kx = PAGE.x + PAGE.w - 40;
        for (let lv = 2; lv >= 0; lv--) {
          ctx.fillStyle = TIDE_PIP[lv];
          ctx.fillRect(kx, PAGE.y + 3, 2, 2);
          drawText(ctx, TIDE_NAMES[lv][0], kx + 4, PAGE.y + 1, INK);
          kx += 13;
        }
      }
    }
  }


  /** Seasons' save screen, off the cartridge (tools/rip-save.py). */
  drawSave(ctx) {
    drawScreen(ctx, 'saveMenu');
    if (!(this.savePicked >= 0 && (this.savePickT & 4))) {
      const a = screenImage('saveAcorn');
      drawScreen(ctx, 'saveAcorn', a.ax, a.ay + 24 * this.saveCursor);
    }
    if (this.messageTime > 0) drawTextCentered(ctx, this.message, SCREEN_W / 2, 130, '#f8f8f8');
  }
}
