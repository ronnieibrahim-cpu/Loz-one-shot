// Pause menu: item grid with A/B assignment, dungeon or overworld map, quest
// status, and save. Opened with START, closed with START or B on the first tab.

import { SCREEN_W, SCREEN_H, HUD_H, VIEW_W, VIEW_H, ROOM_W, ROOM_H } from '../core/screen.js';
import { drawText, drawTextCentered, textWidth } from '../gfx/font.js';
import { sprites } from '../gfx/art.js';
import { drawPanel, drawBox } from './dialogue.js';
import { ITEMS, itemIcon, itemName, equippableItems, SEED_KINDS, SEED_INFO } from './items.js';
import { RINGS, ownedRings, equipRing } from './rings.js';
import { HEART_UNITS } from './progress.js';
import { MAPS, getMap, hasRoom } from '../world/maps.js';

const TABS = ['ITEMS', 'MAP', 'QUEST', 'SAVE'];
const COLS = 5;

export class Menu {
  constructor(game) {
    this.game = game;
    this.tab = 0;
    this.cursor = 0;
    this.ringCursor = 0;
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
    else if (this.tab === 2) this.updateQuest();
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
      const cur = SEED_KINDS.indexOf(g.progress.seedSelected || 'ember');
      g.progress.seedSelected = SEED_KINDS[(cur + 1) % SEED_KINDS.length];
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
    const rings = ownedRings(g.progress);
    if (i.pressed('b')) { this.tab = 0; g.audio.sfx('cursor'); return; }
    if (!rings.length) return;
    if (i.pressed('left')) { this.ringCursor = (this.ringCursor + rings.length - 1) % rings.length; g.audio.sfx('cursor'); }
    if (i.pressed('right')) { this.ringCursor = (this.ringCursor + 1) % rings.length; g.audio.sfx('cursor'); }
    if (i.pressed('a')) {
      equipRing(g.progress, rings[this.ringCursor], 0);
      g.audio.sfx('confirm');
    }
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
    else if (this.tab === 2) this.drawQuest(ctx);
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
        const k = p.seedSelected || 'ember';
        drawText(ctx, SEED_INFO[k].name + ' x' + (p.seeds[k] || 0), 8, infoY + 13, '#a8f0f8');
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
      }
    }
    if (isDungeon) {
      drawText(ctx, 'FLOOR ' + (floor + 1) + '/' + m.floors, 6, SCREEN_H - 24, '#a8b0a0');
      if (!haveMap) drawText(ctx, 'No map found', 6, SCREEN_H - 34, '#e04858');
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
    const rings = ownedRings(p);
    drawText(ctx, 'RINGS ' + rings.length + '/' + Object.keys(RINGS).length, 6, y, '#a8f0f8');
    y += 10;
    if (rings.length) {
      rings.forEach((id, i) => {
        const on = p.ringsEquipped.includes(id);
        const cx = 6 + i * 11;
        sprites.draw(ctx, 'i_ring', cx, y, { pal: RINGS[id].color });
        if (i === this.ringCursor) { ctx.fillStyle = '#f8f8e8'; ctx.fillRect(cx, y + 10, 8, 1); }
        if (on) { ctx.fillStyle = '#48c868'; ctx.fillRect(cx, y - 1, 8, 1); }
      });
      const sel = RINGS[rings[this.ringCursor]];
      if (sel) {
        drawText(ctx, sel.name, 6, y + 13, '#f8f8e8');
        drawText(ctx, sel.desc.slice(0, 36), 6, y + 22, '#a8b0a0');
      }
    } else {
      drawText(ctx, 'None yet.', 6, y, '#a8b0a0');
    }
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
