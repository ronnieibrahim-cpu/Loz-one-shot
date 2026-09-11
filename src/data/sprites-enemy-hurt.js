// Ordinary-enemy hurt (flinch) frames.
//
// HAND-DRAWN, and for a structural reason rather than a stylistic one:
// `assets/sheets/oracle-seasons-enemies.png` was surveyed cell by cell for a
// second pose per creature (tools/rip-enemies.py found 344 boxes, only 56
// used) and it has none — the source games only ever drew a distinct
// mid-recoil pose for BOSSES (see sprites-bosses.js's own `_hurt` frames);
// an ordinary enemy's "hurt" reaction there is the invincibility flicker
// alone (Entity.draw's own flicker skip-frame, unconditionally free for
// every enemy already). So there is nothing on the sheet to extract for
// this — CLAUDE.md's "if no sheet has it, draw it to match" path, not a
// shortcut past extraction.
//
// Same register as everywhere else: docs/ART-DIRECTION.md's three colours
// plus transparency, a hard 1px outline, no anti-aliasing, silhouette held
// (this is the same creature, not a new one) with the one feature the eye
// actually reads — the face — changed to sell the recoil, exactly the
// "eyes shut or squinted, body flinched a pixel" convention the boss frames
// already use, scaled down to what a 16x16 cell can actually show.
//
// Read by `Enemy.spriteName()` (src/game/enemy.js): a species with
// `hurtFrame` in its `defineEnemy` spec shows this sprite while `flicker` is
// counting down from a hit, the same mechanism `Boss.spriteName` already
// uses. Always drawn through the enemy's own `pal`, never a colour baked in
// here — see wisp's `pal: 'magic'` in src/data/enemies.js.

import { sprites } from '../gfx/art.js';

export const ENEMY_HURT_ART = {
  // Wisp (Spark): the same spiky ring held in place — no room in 16x16 for a
  // whole-body flinch the way a 32x32 boss gets one — with its face pinched
  // shut instead of the open grin both idle frames (wisp_0/wisp_1) wear:
  // the eye ticks widen into short shut lines and the wide smile band
  // narrows to a small clenched notch. Compare against wisp_0/wisp_1 in
  // src/data/sprites-enemies.js before changing either.
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
    3300033003300033
    3330000330000333
    0030000330000300
    .03300000000330.
    .33333000033333.
    ..300333333003..
    ....03300330....`,
};

export function installEnemyHurtSprites() {
  sprites.add(ENEMY_HURT_ART, 'magic');
}
