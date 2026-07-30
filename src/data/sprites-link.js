// Sprite pack: Link, visual effects, and every HUD / item icon.
//
// Art grammar: see src/gfx/art.js. One character per pixel:
//   '.' transparent   '0' lightest   '1' mid   '2' dark   '3' outline/darkest
// Required names and sizes: see src/data/sprite-manifest.js.
// Palettes: see src/gfx/palettes.js — sprites are drawn with the palette named
// at the draw site, so art here should read correctly as light->dark ramps.

import { sprites } from '../gfx/art.js';

// Link: 16x16. 'side' art faces RIGHT; the engine mirrors it for left.
export const LINK_ART = {};

// Effects: 16x16 (except fx_boom*, which are 32x32).
export const FX_ART = {};

// 32x32 explosion frames.
export const FX_BIG_ART = {};

// HUD and item icons. hud_heart0..4 and i_seed_* are 8x8; the rest are 16x16.
export const UI_ART = {};

export function installLinkSprites() {
  sprites.add(LINK_ART, 'link');
  sprites.add(FX_ART, 'spark');
  sprites.add(FX_BIG_ART, 'fire');
  sprites.add(UI_ART, 'ui');
}
