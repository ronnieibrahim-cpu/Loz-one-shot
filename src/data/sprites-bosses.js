// Sprite pack: bosses (32x32) and minibosses (24x24).
//
// Art grammar: see src/gfx/art.js ('.' transparent, '0'..'3' light to dark).
// Required names: see REQUIRED_SPRITES.bosses / .minibosses in
// src/data/sprite-manifest.js.

import { sprites } from '../gfx/art.js';

export const BOSS_ART = {};
export const MINIBOSS_ART = {};

export function installBossSprites() {
  sprites.add(BOSS_ART, 'enemyr');
  sprites.add(MINIBOSS_ART, 'enemyk');
}
