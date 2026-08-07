// The status bar: item slots, hearts, rupees, the tide gauge, and dungeon keys.
// Occupies the top 16 scanlines; the playfield starts below it.
//
// Laid out after the Oracle of Seasons / Ages status bar: a parchment panel
// rather than a black one, the two equipped items shown as `B[icon]` and
// `A[icon]` inside tall drawn brackets, a rupee counter with the icon stacked
// over its three digits, and the hearts right-aligned in two rows of seven.
// Seven per row is exactly right for this game — 3 starting hearts + 8 boss
// containers + 8 heart pieces caps at 13.
//
// The 160px budget, left to right:
//   0..27    B slot           29..56   A slot
//   58..70   tide gauge       73..91   rupees, icon over digits
//   94..103  keys / essences  104..159 hearts (7 per row, 8px each)
//
// The panel is a warm tan rather than the text box's near-white on purpose:
// most item icons use palette `ui`, whose lightest index is #f8f8e8, and on a
// near-white bar they wash out to nothing. The tan is what makes them read.

import { SCREEN_W, HUD_H } from '../core/screen.js';
import { drawText, drawTextCentered, textWidth } from '../gfx/font.js';
import { sprites } from '../gfx/art.js';
import { HEART_UNITS } from './progress.js';
import { itemIcon, ITEMS } from './items.js';
import { TIDE_NAMES } from './tide.js';

const PANEL = '#f0e0b0';       // parchment
const INK = '#181c18';         // glyphs and brackets, same as the text box
const FAINT = '#c0a870';       // the panel's under-shadow and gauge ticks
const GOLD = '#785010';        // keys
const TEAL = '#186878';        // essences

const SLOT_B_X = 0;
const SLOT_A_X = 29;
const TIDE_X = 58;
const RUPEE_X = 73;
const INFO_X = 94;
const HEART_X = 104;
const HEARTS_PER_ROW = 7;

export function drawHud(ctx, game) {
  const p = game.progress;

  // The room tint is set on the whole sprite atlas, so without this the hearts
  // and item icons dim with the room — barely visible on the old black bar, but
  // on a light panel it reads as a rendering fault, and the Oracle bar it copies
  // never changes colour. Safe to toggle without flushing: `bake` keys its cache
  // on tintKey, so the tinted and untinted versions simply coexist.
  const tint = sprites.tint, tintKey = sprites.tintKey;
  sprites.setTint(null, 'hud');

  ctx.fillStyle = PANEL;
  ctx.fillRect(0, 0, SCREEN_W, HUD_H);
  ctx.fillStyle = FAINT;
  ctx.fillRect(0, HUD_H - 2, SCREEN_W, 1);
  ctx.fillStyle = INK;
  ctx.fillRect(0, HUD_H - 1, SCREEN_W, 1);

  drawSlot(ctx, SLOT_B_X, p.equipB, p, 'B');
  drawSlot(ctx, SLOT_A_X, p.equipA, p, 'A');
  drawTideGauge(ctx, game);
  drawRupees(ctx, p);
  drawDungeonInfo(ctx, game);
  drawHearts(ctx, p);

  sprites.setTint(tint, tintKey);
}

/**
 * `B[icon]`: the button letter, then the item framed by two drawn brackets.
 * The brackets are pixel art rather than font glyphs so they can stand the full
 * height of the icon, which is what makes the Oracle bar read as a bar.
 */
function drawSlot(ctx, x, itemId, p, label) {
  drawText(ctx, label, x, 4, INK);
  bracket(ctx, x + 6, 1, 1);
  bracket(ctx, x + 26, 1, -1);

  if (!itemId || !ITEMS[itemId]) return;
  const def = ITEMS[itemId];
  const lv = p.items[itemId] || 1;
  sprites.draw(ctx, itemIcon(itemId, lv), x + 9, 0, { pal: def.pal });

  // Counted items show their quantity; levelled ones show the level, both
  // tucked into the icon's bottom-right the way the Oracle bar does.
  if (def.counted === 'bombs') corner(ctx, String(p.bombs), x + 25);
  else if (itemId === 'satchel' || itemId === 'slingshot') {
    corner(ctx, String(p.seeds[p.seedSelected || 'ember'] || 0), x + 25);
  } else if (lv > 1) corner(ctx, 'L' + lv, x + 25);
}

/** One half of the pair framing an item. `dir` 1 draws '[', -1 draws ']'. */
function bracket(ctx, x, y, dir) {
  ctx.fillStyle = INK;
  ctx.fillRect(x, y, 1, 13);                 // the upright
  ctx.fillRect(dir > 0 ? x : x - 1, y, 2, 1);          // top nub
  ctx.fillRect(dir > 0 ? x : x - 1, y + 12, 2, 1);     // bottom nub
}

/**
 * A small right-aligned badge over the bottom of an item icon. Light on dark,
 * because it has to stay readable over a bomb, a sword or a leaf alike.
 */
function corner(ctx, s, rightX) {
  const w = textWidth(s);
  ctx.fillStyle = INK;
  ctx.fillRect(rightX - w - 1, 8, w + 1, 7);
  drawText(ctx, s, rightX - w, 7, PANEL);
}

function drawHearts(ctx, p) {
  const total = Math.ceil(p.maxHearts / HEART_UNITS);
  for (let i = 0; i < total; i++) {
    const x = HEART_X + (i % HEARTS_PER_ROW) * 8;
    const y = Math.floor(i / HEARTS_PER_ROW) * 8;
    const filled = Math.max(0, Math.min(HEART_UNITS, p.hearts - i * HEART_UNITS));
    sprites.draw(ctx, 'hud_heart' + filled, x, y);
  }
}

/** Rupee icon stacked over a three-digit count, as in the Oracle bar. */
function drawRupees(ctx, p) {
  sprites.draw(ctx, 'hud_rupee', RUPEE_X, 0);
  const s = String(Math.min(999, p.rupees)).padStart(3, '0');
  drawText(ctx, s, RUPEE_X, 8, INK);
}

/**
 * The tide gauge: a basin with the water drawn at the current level, plus one
 * letter. It is the player's main read on the game's core mechanic, so it is
 * always visible — the Oracle bar has no equivalent, so it takes the gap those
 * games leave between the item slots and the rupee counter.
 */
function drawTideGauge(ctx, game) {
  const lvl = game.tide.level;
  const x = TIDE_X, y = 0;
  ctx.fillStyle = INK;
  ctx.fillRect(x, y, 13, 8);
  ctx.fillStyle = '#f8f8f0';
  ctx.fillRect(x + 1, y + 1, 11, 6);
  const h = [2, 4, 6][lvl];
  ctx.fillStyle = ['#e0c078', '#58b0e0', '#2878c0'][lvl];
  ctx.fillRect(x + 1, y + 7 - h, 11, h);
  ctx.fillStyle = FAINT;
  ctx.fillRect(x + 4, y + 1, 1, 6);
  ctx.fillRect(x + 8, y + 1, 1, 6);
  const label = TIDE_NAMES[lvl][0];
  drawText(ctx, label, x + Math.round((13 - textWidth(label)) / 2), 8, INK);

  // The gauge shows the BASE — what the conch last set — because that is what
  // the player pressed a button to choose. Since the Anchor that can disagree
  // with the water Link is actually standing in, and a gauge that quietly
  // reports the wrong one is worse than no gauge. When they differ, a pip in
  // the corner carries the local level, coloured like its own water.
  const p = game.player;
  if (p && game.room) {
    const here = game.tide.levelAt(
      Math.floor(p.cx / 16), Math.floor(p.cy / 16), game.room);
    if (here !== lvl) {
      ctx.fillStyle = INK;
      ctx.fillRect(x + 9, y, 4, 4);
      ctx.fillStyle = ['#e0c078', '#58b0e0', '#2878c0'][here];
      ctx.fillRect(x + 10, y + 1, 2, 2);
    }
  }
}

/** Keys and boss key in dungeons; essence count in the overworld. */
function drawDungeonInfo(ctx, game) {
  const p = game.progress;
  const map = game.map;
  if (!map || map.kind !== 'dungeon') {
    if (p.essences.length) {
      drawText(ctx, '\x06', INFO_X, 0, TEAL);
      drawText(ctx, String(p.essences.length), INFO_X, 8, INK);
    }
    return;
  }
  drawText(ctx, '\x04', INFO_X, 0, GOLD);
  drawText(ctx, String(p.keys[map.id] || 0), INFO_X, 8, INK);
  if (p.bossKeys[map.id]) {
    ctx.fillStyle = GOLD;
    ctx.fillRect(INFO_X + 7, 2, 3, 3);
    ctx.fillRect(INFO_X + 8, 5, 1, 4);
  }
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
