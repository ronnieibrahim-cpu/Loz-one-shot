// Sprite pack: enemies. 16x16 each.
//
// Art grammar: see src/gfx/art.js ('.' transparent, '0'..'3' light to dark).
// Required names: see REQUIRED_SPRITES.enemies in src/data/sprite-manifest.js.
// Directional sets use _d (down), _u (up), _s (side, facing RIGHT).

import { sprites } from '../gfx/art.js';

export const ENEMY_ART = {};

export function installEnemySprites() {
  sprites.add(ENEMY_ART, 'enemyg');
}
