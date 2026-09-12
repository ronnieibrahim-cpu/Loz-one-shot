// Hand-drawn enemy hurt/death frames — the ordinary-enemy counterpart to
// sprites-bosses.js's `boss_*_hurt` art, one flinch or death pose per enemy
// that has one. NOT generated: `sprites-enemies.js` is the ripper's own file
// and stays off limits (CLAUDE.md), so a per-species frame the sheet doesn't
// have lands here instead, following the same "hand-draw only once
// extraction is checked and comes up empty" discipline the boss roster used.
//
// Same grammar as every other sprite pack (src/gfx/art.js): silhouette first,
// a hard 1px '3' outline, flat 0-2 light-to-dark ramp, no gradients. Drawn to
// the boss precedent (sprites-bosses.js's own header): the SAME creature
// caught mid-recoil, not a recolour — eyes shut or squinted, expression
// changed a few pixels, body silhouette untouched so it still reads as the
// same thing on the same frame the walk cycle would have drawn. `_death`
// frames are the one deliberate exception to "silhouette untouched": a death
// pose is a collapsed final state, not a recoil, so the shape is allowed to
// change as long as the creature is still legibly itself (see stalfos_death
// below).

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

  // Stalfos death — drawn: assets/sheets/oracle-seasons-enemies.png's Sword
  // Stalfos has no collapse pose, only the standing walk frames stalfos_d0/
  // d1/s0/s1 already in sprites-enemies.js. A skeleton's own death is the one
  // case in this roster where "the same creature caught mid-recoil" doesn't
  // apply (see header) — a stalfos does not flinch when it dies, it comes
  // apart. Drawn as its own skull (same rounded cranium and two eye-socket
  // notches as stalfos_d0's head, rows 5-10 here) fallen onto a heap of its
  // own bones (rows 11-15), rather than a recolour or a generic cloud, so it
  // still reads as "this is what was chasing you" and not a shared effect.
  // Drawn in `enemyk`'s own four bone tones at runtime (stalfos already
  // passes `pal: 'enemyk'` — see src/data/enemies.js — so the palette here is
  // only the fallback for a direct lookup with no runtime override).
  stalfos_death: `
    ................
    ................
    ................
    ................
    ................
    ......3333......
    .....300003.....
    ....30300303....
    ....30000003....
    .....300003.....
    ......3333......
    ....30000003....
    ..300000000003..
    .30000000000003.
    .30111111111103.
    .33333333333333.` ,
};

export function installEnemyHurtSprites() {
  sprites.add(ENEMY_HURT_ART, 'magic');
}
