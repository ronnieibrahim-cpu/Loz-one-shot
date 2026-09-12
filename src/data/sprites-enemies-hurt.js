// Hand-drawn enemy hurt frames — the ordinary-enemy counterpart to
// sprites-bosses.js's `boss_*_hurt` art, one flinch pose per enemy that has
// one. NOT generated: `sprites-enemies.js` is the ripper's own file and stays
// off limits (CLAUDE.md), so a per-species flinch frame the sheet doesn't
// have lands here instead, following the same "hand-draw only once
// extraction is checked and comes up empty" discipline the boss roster used.
//
// Same grammar as every other sprite pack (src/gfx/art.js): silhouette first,
// a hard 1px '3' outline, flat 0-2 light-to-dark ramp, no gradients. Drawn to
// the boss precedent (sprites-bosses.js's own header): the SAME creature
// caught mid-recoil, not a recolour — eyes shut or squinted, expression
// changed a few pixels, body silhouette untouched so it still reads as the
// same thing on the same frame the walk cycle would have drawn.

import { sprites } from '../gfx/art.js';

export const ENEMY_HURT_ART = {
  // Wisp — drawn: assets/sheets/oracle-seasons-enemies.png has no flinch pose
  // for Spark (the creature wisp_0/wisp_1 substitute in), only the two
  // lit/unlit frames already in sprites-enemies.js. Same spiky halo
  // silhouette as wisp_0 (rows 0-5 and 12-15 are pixel-identical to it), the
  // grinning face squinted shut and the wide grin pulled in to a small wince.
  wisp_hurt: `
    ....03300330....
    ..300333333003..
    .33333000033333.
    .03300000000330.
    0030330000330300
    3330033003300333
    3300033003300033
    0303000000003030
    0303300000033030
    3300000000000033
    3330000330000333
    0030000000000300
    .03300000000330.
    .33333000033333.
    ..300333333003..
    ....03300330....` ,
};

export function installEnemyHurtSprites() {
  sprites.add(ENEMY_HURT_ART, 'magic');
}
