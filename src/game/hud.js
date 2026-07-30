// The status bar: item slots, hearts, rupees, the tide gauge, and dungeon keys.
// Occupies the top 16 scanlines; the playfield starts below it.

import { SCREEN_W, HUD_H } from '../core/screen.js';
import { drawText, drawTextCentered, textWidth } from '../gfx/font.js';
import { sprites } from '../gfx/art.js';
import { HEART_UNITS } from './progress.js';
import { itemIcon, ITEMS } from './items.js';
import { TIDE_NAMES } from './tide.js';

const SLOT_B = { x: 1, y: 1, w: 14, h: 14 };
const SLOT_A = { x: 16, y: 1, w: 14, h: 14 };
const HEART_X = 32;
const HEARTS_PER_ROW = 10;
const RIGHT_X = 113;

export function drawHud(ctx, game) {
  const p = game.progress;

  ctx.fillStyle = '#101410';
  ctx.fillRect(0, 0, SCREEN_W, HUD_H);
  ctx.fillStyle = '#303c48';
  ctx.fillRect(0, HUD_H - 1, SCREEN_W, 1);

  drawSlot(ctx, SLOT_B, p.equipB, p, game, 'B');
  drawSlot(ctx, SLOT_A, p.equipA, p, game, 'A');
  drawHearts(ctx, p);
  drawRupees(ctx, p);
  drawTideGauge(ctx, game);
  drawDungeonInfo(ctx, game);
}

function drawSlot(ctx, r, itemId, p, game, label) {
  ctx.fillStyle = '#586878';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = '#080c10';
  ctx.fillRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
  if (itemId && ITEMS[itemId]) {
    const lv = p.items[itemId] || 1;
    sprites.draw(ctx, itemIcon(itemId, lv), r.x - 1, r.y - 1, { pal: ITEMS[itemId].pal || 'ui' });
    // counted items (bombs, seeds) show their quantity
    const def = ITEMS[itemId];
    if (def.counted === 'bombs') {
      drawNum(ctx, p.bombs, r.x + r.w - 1, r.y + r.h - 8, '#f8f8e8');
    } else if (itemId === 'satchel' || itemId === 'slingshot') {
      const k = p.seedSelected || 'ember';
      drawNum(ctx, p.seeds[k] || 0, r.x + r.w - 1, r.y + r.h - 8, '#f8f8e8');
    }
  } else {
    drawText(ctx, label, r.x + 5, r.y + 4, '#303c48');
  }
}

function drawNum(ctx, n, rightX, y, color) {
  const s = String(n);
  drawText(ctx, s, rightX - textWidth(s), y, color, '#080c10');
}

function drawHearts(ctx, p) {
  const total = Math.ceil(p.maxHearts / HEART_UNITS);
  for (let i = 0; i < total; i++) {
    const row = Math.floor(i / HEARTS_PER_ROW);
    const col = i % HEARTS_PER_ROW;
    const x = HEART_X + col * 8;
    const y = row * 8;
    const filled = Math.max(0, Math.min(HEART_UNITS, p.hearts - i * HEART_UNITS));
    sprites.draw(ctx, 'hud_heart' + filled, x, y, { pal: 'heart' });
  }
}

function drawRupees(ctx, p) {
  sprites.draw(ctx, 'hud_rupee', RIGHT_X - 1, -1, { pal: 'rupee' });
  const s = String(p.rupees).padStart(3, '0');
  drawText(ctx, s, RIGHT_X + 8, 0, '#f8f8e8');
}

/**
 * The tide gauge: three stacked cells with the active level lit, plus a wave
 * that sits at the current water height. It is the player's main read on the
 * game's core mechanic, so it is always visible.
 */
function drawTideGauge(ctx, game) {
  const lvl = game.tide.level;
  const x = RIGHT_X, y = 9;
  // A 20px basin with the water level drawn in it, plus one letter for clarity.
  ctx.fillStyle = '#303c48';
  ctx.fillRect(x, y, 20, 6);
  ctx.fillStyle = '#080c10';
  ctx.fillRect(x + 1, y + 1, 18, 4);
  const h = [1, 2, 4][lvl];
  ctx.fillStyle = ['#e0c078', '#58b0e0', '#b0e8f8'][lvl];
  ctx.fillRect(x + 1, y + 5 - h, 18, h);
  ctx.fillStyle = '#586878';
  ctx.fillRect(x + 7, y + 1, 1, 4);
  ctx.fillRect(x + 13, y + 1, 1, 4);
  drawText(ctx, TIDE_NAMES[lvl][0], x + 21, y - 1, '#a8b0a0');
}

/** Keys and boss key in dungeons; essence count in the overworld. */
function drawDungeonInfo(ctx, game) {
  const p = game.progress;
  const map = game.map;
  const x = RIGHT_X + 28;
  if (!map || map.kind !== 'dungeon') {
    if (p.essences.length) drawText(ctx, '\x06' + p.essences.length, x, 0, '#a8f0f8');
    return;
  }
  drawText(ctx, '\x04' + (p.keys[map.id] || 0), x, 0, '#e0c050');
  if (p.bossKeys[map.id]) drawText(ctx, '\x04', x + 9, 8, '#fff0a0');
}

/** Transient banner naming the area you just entered. */
export function drawAreaBanner(ctx, game) {
  if (game.bannerTime <= 0 || !game.bannerText) return;
  const t = game.bannerTime;
  const alpha = t > 90 ? (120 - t) / 30 : Math.min(1, t / 30);
  const w = textWidth(game.bannerText) + 12;
  const x = Math.round((SCREEN_W - w) / 2), y = HUD_H + 8;
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.fillStyle = '#080c10';
  ctx.fillRect(x, y, w, 13);
  ctx.fillStyle = '#586878';
  ctx.fillRect(x, y, w, 1);
  ctx.fillRect(x, y + 12, w, 1);
  drawTextCentered(ctx, game.bannerText, SCREEN_W / 2, y + 3, '#f8f8e8');
  ctx.globalAlpha = 1;
}

/** Boss health bar, drawn along the bottom of the playfield. */
export function drawBossBar(ctx, game) {
  const b = game.boss;
  if (!b || b.dead) return;
  const w = 96, x = Math.round((SCREEN_W - w) / 2), y = 138;
  ctx.fillStyle = '#080c10';
  ctx.fillRect(x - 1, y - 1, w + 2, 6);
  const frac = Math.max(0, b.hp / b.maxHp);
  ctx.fillStyle = '#982030';
  ctx.fillRect(x, y, w, 4);
  ctx.fillStyle = frac > 0.35 ? '#e04858' : '#f8b820';
  ctx.fillRect(x, y, Math.round(w * frac), 4);
}
