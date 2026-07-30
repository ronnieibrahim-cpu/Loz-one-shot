// Sprite pack: pickups, world objects, projectiles, and NPCs.
//
// Art grammar: see src/gfx/art.js ('.' transparent, '0'..'3' light to dark).
// Required names and sizes: see src/data/sprite-manifest.js.

import { sprites } from '../gfx/art.js';

// 16x16 pickups.
export const PICKUP_ART = {};

// 16x16 world objects.
export const OBJECT_ART = {};

// 8x8 projectiles.
export const SHOT_ART = {};

// 16x16 NPCs, drawn facing the viewer.
export const NPC_ART = {};

export function installWorldSprites() {
  sprites.add(PICKUP_ART, 'rupee');
  sprites.add(OBJECT_ART, 'wood');
  sprites.add(SHOT_ART, 'enemyr');
  sprites.add(NPC_ART, 'npc');
}
