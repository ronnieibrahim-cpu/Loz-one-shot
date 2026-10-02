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
// The 160px budget, left to right, in Seasons' two layouts (code/bank2.s
// loadStatusBarMap: the second once Link has MORE than 14 hearts, which takes
// one tile from the item slots so the hearts can run eight to a row):
//
//                 up to 14 hearts           15 or 16 hearts
//   B slot        0..31                     0..31
//   A slot        33..64                    32..57 (no letter, as Seasons)
//   tide gauge    66..78                    59..71
//   money column  80..103                   72..95
//   hearts        104..159, 7 a row         96..159, 8 a row
//
// Each slot is the letter, a bracket, the item's 8px tile and Seasons' two
// "extra" tiles (L-1, or a count) on its lower half, and a bracket. The money
// column is Seasons' own: three digits of the bar's bold font under a rupee,
// or, in a dungeon, under key x count (the rupee tile is swapped for the key).
// The tide gauge is ours and takes the room Seasons leaves between the slots
// and the money.
//
// The panel is a warm tan rather than the text box's near-white on purpose:
// most item icons use palette `ui`, whose lightest index is #f8f8e8, and on a
// near-white bar they wash out to nothing. The tan is what makes them read.

import { SCREEN_W, HUD_H } from '../core/screen.js';
import { drawText, drawTextCentered, textWidth } from '../gfx/font.js';
import { sprites } from '../gfx/art.js';
import { HEART_UNITS } from './progress.js';
import { itemIcon, itemExtra, ITEMS } from './items.js';
import { TIDE_NAMES } from './tide.js';

const PANEL = '#f0e0b0';       // parchment
const INK = '#181c18';         // glyphs and brackets, same as the text box
const FAINT = '#c0a870';       // the panel's under-shadow and gauge ticks
const TEAL = '#186878';        // essences

// One row per layout: [B slot, A slot, A letter?, tide, money, hearts, per row].
const LAYOUT = {
  normal: { b: 0, a: 33, aLetter: true, tide: 66, money: 80, hearts: 104, perRow: 7 },
  squeezed: { b: 0, a: 32, aLetter: false, tide: 59, money: 72, hearts: 96, perRow: 8 },
};
/** Seasons squeezes the bar once max health is past 14 hearts (cp 14*4+1). */
const SQUEEZE_ABOVE = 14 * HEART_UNITS;
const EXTRA_Y = 7;

/** Which of the two bars a max health (in quarter hearts) gets. */
export function hudLayout(maxHearts) {
  return maxHearts > SQUEEZE_ABOVE ? LAYOUT.squeezed : LAYOUT.normal;
}      // the extra tiles' top: their ink rows sit over the bar's lower line

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

  const L = hudLayout(p.maxHearts);
  drawSlot(ctx, L.b, p.equipB, p, 'B');
  drawSlot(ctx, L.a, p.equipA, p, L.aLetter ? 'A' : null);
  drawTideGauge(ctx, game, L.tide);
  drawMoney(ctx, game, L.money);
  drawHearts(ctx, p, L.hearts, L.perRow);

  sprites.setTint(tint, tintKey);
}

/**
 * `B[icon L-1]`: the button letter, then the item and what Seasons writes
 * beside it, framed by the cartridge's own bracket tiles (S169;
 * tools/rip-hud-tiles.py): "B[" or "A[" over the bottom of a "[", and the
 * same bottom tile flipped for the "]". Each "[" stands in its tile's
 * seventh column and each "]" in its second, so the tiles sit a pixel either
 * side of the uprights `l` and `l + 25`. With no letter (the squeezed bar's
 * A slot) a bare "[" takes the letter's place, as Seasons' does.
 */
function drawSlot(ctx, x, itemId, p, label) {
  const l = label ? x + 6 : x;
  sprites.draw(ctx, label === 'B' ? 'hud_slot_b' : label === 'A' ? 'hud_slot_a' : 'hud_brk_tl', l - 6, 0);
  sprites.draw(ctx, 'hud_brk_bl', l - 6, 8);
  sprites.draw(ctx, 'hud_brk_tr', l + 24, 0);
  sprites.draw(ctx, 'hud_brk_br', l + 24, 8);

  if (!itemId || !ITEMS[itemId]) return;
  const def = ITEMS[itemId];
  const lv = p.items[itemId] || 1;
  // The icon is an 8px picture centred in a 16px cell: its own tile starts 4
  // in, one pixel clear of the bracket, and the extra tiles follow it.
  sprites.draw(ctx, itemIcon(itemId, lv), l - 3, 0, { pal: def.pal });
  drawItemExtra(ctx, itemId, p, l + 9, EXTRA_Y);
}

/**
 * Seasons' "extra tiles" beside an item (code/bank2.s drawTreasureExtraTiles):
 * two 8x8 tiles of the status bar's own font, the first at (x, y). A levelled
 * item gets "L-" and its level; a counted one gets its count as two digits,
 * tens first, "07" not " 7" (the count is BCD there and the tens tile is
 * always written). Both the A/B buttons and the menu draw it, as the
 * cartridge's one routine does for both.
 */
export function drawItemExtra(ctx, id, p, x, y) {
  const kind = itemExtra(id);
  if (kind === 'level') {
    sprites.draw(ctx, 'hud_lv', x, y);
    sprites.draw(ctx, 'hud_d' + Math.min(9, p.items[id] || 1), x + 8, y);
  } else if (kind === 'count') {
    const n = Math.max(0, Math.min(99, p[ITEMS[id].counted] || 0));
    sprites.draw(ctx, 'hud_d' + Math.floor(n / 10), x, y);
    sprites.draw(ctx, 'hud_d' + (n % 10), x + 8, y);
  }
}

function drawHearts(ctx, p, x0, perRow) {
  const total = Math.ceil(p.maxHearts / HEART_UNITS);
  for (let i = 0; i < total; i++) {
    const x = x0 + (i % perRow) * 8;
    const y = Math.floor(i / perRow) * 8;
    const filled = Math.max(0, Math.min(HEART_UNITS, p.hearts - i * HEART_UNITS));
    sprites.draw(ctx, 'hud_heart' + filled, x, y);
  }
}

/**
 * Seasons' money column: the rupee over three digits of the bar's own bold
 * font. In a dungeon the rupee tile gives way to the key, the "x" and the
 * count of small keys (bank2.s @loadMoneyGraphic / updateStatusBar_body).
 * Ours adds one thing beside the rupee out of doors, where Seasons leaves the
 * two tiles blank: the Essence count, in the spark the menu draws them with.
 */
function drawMoney(ctx, game, x) {
  const p = game.progress;
  const map = game.map;
  if (map && map.kind === 'dungeon') {
    sprites.draw(ctx, 'hud_key', x, 0);
    sprites.draw(ctx, 'hud_x', x + 8, 0);
    sprites.draw(ctx, 'hud_d' + Math.min(9, p.keys[map.id] || 0), x + 16, 0);
  } else {
    sprites.draw(ctx, 'hud_rupee', x, 0);
    if (p.essences.length) {
      drawText(ctx, '\x06', x + 9, 0, TEAL);
      sprites.draw(ctx, 'hud_d' + Math.min(9, p.essences.length), x + 16, 0);
    }
  }
  const s = String(Math.min(999, p.rupees)).padStart(3, '0');
  for (let i = 0; i < 3; i++) sprites.draw(ctx, 'hud_d' + s[i], x + i * 8, EXTRA_Y);
}

/**
 * The tide gauge: a basin with the water drawn at the current level, plus one
 * letter. It is the player's main read on the game's core mechanic, so it is
 * always visible — the Oracle bar has no equivalent, so it takes the gap those
 * games leave between the item slots and the rupee counter.
 */
function drawTideGauge(ctx, game, x) {
  const lvl = game.tide.level;
  const y = 0;
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
