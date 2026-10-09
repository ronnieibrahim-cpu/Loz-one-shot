// The pause menus, as Seasons has them (S176). START opens the item menu:
// three pages, turned with SELECT, sliding in from the right — the items; the
// treasures and the charm cases (where Seasons keeps its ring box); the
// Essences, the heart pieces and SAVE. SELECT out in the field opens the map
// instead, and START and SELECT together go straight to the save screen
// (bank2.s b2_updateMenus, menuStateFadeIntoMenu). No page has a title.

import { SCREEN_W, SCREEN_H, HUD_H } from '../core/screen.js';
import { drawText, drawTextCentered, wrapText } from '../gfx/font.js';
import { sprites } from '../gfx/art.js';
import { ITEMS, itemIcon, itemName, inventorySlots, INVENTORY_SLOTS } from './items.js';
import { drawItemExtra } from './hud.js';
import {
  CHARMS, CHARM_SLOTS, CHARM_COUNT, ownedCharms, charmsForSlot, slotCharm,
  caseSize, slotOpen, equippedIn,
} from './scrimshaw.js';
import { flag, itemLevel } from './progress.js';
import { essenceCount } from '../world/maps.js';
import { tradeName, tradeIcon } from '../data/trade.js';
import { DUNGEON_KEYS } from '../data/keys.js';
import {
  MENU_DESC_DWELL, MENU_DESC_HOLD, MENU_FADE_CLOSE, MENU_SAVE_FADE, GAMEOVER_PICK_FRAMES,
  MENU_PAGE_SLIDE, MENU_PAGE_SLIDE_W, MENU_SUBMENU_GROW,
} from '../data/feel.js';
import { drawScreen, screenImage } from '../gfx/screens.js';
import { MapScreen, invalidateMapScreens } from './mapscreen.js';

// THE SEASONS INVENTORY PAGES (tools/rip-menu.py, off the cartridge): a white
// page in a frame of olive blocks, dividers, and a strip under it where the
// source names the thing under the cursor. Everything below draws dark on
// that white, in the page's own ink. The map screens are their own
// (src/game/mapscreen.js).

const STRIP_Y = 126;                             // the line in the strip
const BLUE = '#285088';                          // the strip's ink, off the page
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

/** Dropped when a new game or a load resets the world under us. */
export function invalidateWorldMap() { invalidateMapScreens(); }


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
// How far the chooser has grown after `step` steps (inventoryMenuState2
// @func_02_57f3): two columns a step from the middle at one row high, then a
// row a step; null once it is whole and the step after has come (its
// contents are drawn then).
function popupGrowth(step) {
  const full = POP.c1 - POP.c0 + 1, deep = POP.r1 - POP.r0 + 1;
  const across = Math.ceil(full / 2);
  if (step > across + deep - 1) return null;
  const w = Math.min(full, 2 * Math.min(step, across));
  const h = step <= across ? 1 : 1 + step - across;
  const mid = POP.c0 + full / 2;
  return { c0: mid - w / 2, c1: mid + w / 2 - 1, r1: POP.r0 + h - 1 };
}

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
    this.mapScreen = new MapScreen(game);
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
    if (kind === 'map') this.mapScreen.open();
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
    if (this.kind === 'map') { this.mapScreen.update(); return; }

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

  /** The chooser's growth this frame, or null once it is whole. The first
   *  step is taken on the frame it opens. */
  get popupGrowing() {
    return this.popup ? popupGrowth(Math.floor(this.popup.t / MENU_SUBMENU_GROW) + 1) : null;
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
      this.popup = { row, at: 0, t: 0 };
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
    // Growing open: nothing answers until it is whole (@subState1).
    if (this.popupGrowing) { this.popup.t++; return; }
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
    if (this.kind === 'map') { this.mapScreen.draw(ctx); return; }
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
    const grow = this.popupGrowing;
    if (grow) {
      if (grow.c1 >= grow.c0) this.fillBlocks(ctx, grow.c0, POP.r0, grow.c1, grow.r1);
      return null;
    }
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
