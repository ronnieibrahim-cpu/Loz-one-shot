// Pause menu: item grid with A/B assignment, dungeon or overworld map, quest
// status, and save. Opened with START, closed with START or B on the first tab.

import { SCREEN_W, SCREEN_H, HUD_H, VIEW_W, VIEW_H, ROOM_W, ROOM_H } from '../core/screen.js';
import { drawText, drawTextCentered, textWidth } from '../gfx/font.js';
import { sprites } from '../gfx/art.js';
import { drawPanel, drawBox } from './dialogue.js';
import { ITEMS, itemIcon, itemName, equippableItems } from './items.js';
import {
  CHARMS, CHARM_SLOTS, CHARM_COUNT, ownedCharms, charmsForSlot, slotCharm,
  caseSize, slotOpen, equippedIn,
} from './scrimshaw.js';
import { HEART_UNITS } from './progress.js';
import { MAPS, getMap, hasRoom, getRoom } from '../world/maps.js';
import { TIDE_NAMES, TIDE_COUNT } from './tide.js';

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
      for (let y = 0; y < ROOM_H && !differs; y++) {
        for (let x = 0; x < ROOM_W; x++) {
          if (room.tile(x, y, lv).name !== room.tile(x, y, prev).name) { differs = true; break; }
        }
      }
      if (differs) mask |= 1 << lv;
    }
  }
  CHART_CACHE.set(key, mask);
  return mask;
}

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
  }

  open() { this.game.mode = 'menu'; this.tab = 0; this.cursor = 0; }
  close() { this.game.mode = 'play'; this.game.audio.sfx('pause'); }

  get items() { return equippableItems(this.game.progress); }

  update() {
    const g = this.game;
    const i = g.input;
    if (this.messageTime > 0) this.messageTime--;

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
      const d = sel.def.desc || '';
      drawText(ctx, d.length > 34 ? d.slice(0, 33) + '…' : d, 8, infoY + 13, '#a8b0a0');
      if (sel.id === 'satchel' || sel.id === 'slingshot') {
      }
    } else {
      drawText(ctx, 'No items yet.', 8, infoY + 3, '#a8b0a0');
    }
  }

  /** Dungeon floor grid, or the overworld screen grid. */
  drawMap(ctx) {
    const g = this.game;
    const m = g.map;
    if (!m) return;
    const isDungeon = m.kind === 'dungeon';
    const haveMap = isDungeon ? !!g.progress.dungeonMaps[m.id] : true;
    const haveChart = !!g.progress.charts[m.id];
    drawTextCentered(ctx, m.name, SCREEN_W / 2, HUD_H + 15, '#f8f8e8');

    const floor = isDungeon ? (this.mapFloor || 0) : 0;
    const cell = isDungeon ? 10 : 8;
    const gw = m.w * cell, gh = m.h * cell;
    const ox = Math.round((SCREEN_W - gw) / 2), oy = HUD_H + 28;

    for (let y = 0; y < m.h; y++) {
      for (let x = 0; x < m.w; x++) {
        if (!hasRoom(m.id, floor, x, y)) continue;
        const seen = g.progress.secrets['seen:' + m.id + ':' + floor + ',' + x + ',' + y];
        if (!seen && !haveMap) continue;
        const here = g.room && g.room.rx === x && g.room.ry === y && g.room.floor === floor;
        ctx.fillStyle = here ? '#f8f8e8' : (seen ? '#58b0e0' : '#304858');
        ctx.fillRect(ox + x * cell, oy + y * cell, cell - 1, cell - 1);

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
          ctx.fillRect(ox + x * cell + cell - 3, oy + y * cell + (2 - lv) * 3, 2, 2);
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
    for (let i = 1; i <= 8; i++) {
      const got = p.essences.includes(i);
      sprites.draw(ctx, got ? 'p_essence0' : 'p_essence_dim', 6 + (i - 1) * 18, y, { pal: got ? 'essence' : 'uidark' });
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
    drawText(ctx, sel.desc.slice(0, 38), 6, y + 9, '#a8b0a0');
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
