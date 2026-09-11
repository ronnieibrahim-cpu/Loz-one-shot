// Ordinary-enemy hurt (flinch) and death frames.
//
// HAND-DRAWN, and for a structural reason rather than a stylistic one:
// `assets/sheets/oracle-seasons-enemies.png` was surveyed cell by cell for a
// second pose per creature (tools/rip-enemies.py found 344 boxes, only 56
// used) and it has none — the source games only ever drew a distinct
// mid-recoil pose for BOSSES (see sprites-bosses.js's own `_hurt` frames);
// an ordinary enemy's "hurt" reaction there is the invincibility flicker
// alone (Entity.draw's own flicker skip-frame, unconditionally free for
// every enemy already), and its death is a shared 'puff' effect plus instant
// removal, not a per-species pose. So there is nothing on either sheet to
// extract for what this file holds — CLAUDE.md's "if no sheet has it, draw
// it to match" path, not a shortcut past extraction. (S76 surveyed for a
// hurt pose specifically; S77 did not find a death pose either, on the same
// sheet, in the same pass.)
//
// Same register as everywhere else: docs/ART-DIRECTION.md's three colours
// plus transparency, a hard 1px outline, no anti-aliasing, silhouette held
// (this is the same creature reacting, not a new one) with the one feature
// the eye actually reads changed to sell the moment.
//
// Read by `Enemy.spriteName()`/`Enemy.die()` (src/game/enemy.js): a species
// with `hurtFrame` shows that sprite while `flicker` is counting down from a
// hit (the same mechanism `Boss.spriteName` already uses); a species with
// `deathFrame` holds that sprite for `ENEMY_DEATH_FRAMES` once `hp` reaches
// 0, before the entity is actually removed (the same "hold, then really
// die" shape `Boss.beginDeath` already uses for its own boom sequence,
// scaled down and with no boom). Each entry below carries its OWN default
// palette because, unlike in play (where the enemy's live `pal` field always
// wins), `tools/shoot-sprites.mjs`'s contact sheet bakes every sprite with
// no palette override — the default here is what that sheet actually shows.

import { sprites } from '../gfx/art.js';

export const ENEMY_STATE_ART = {
  // Wisp (Spark): the same spiky ring held in place — no room in 16x16 for a
  // whole-body flinch the way a 32x32 boss gets one — with its face pinched
  // shut instead of the open grin both idle frames (wisp_0/wisp_1) wear:
  // the eye ticks widen into short shut lines and the wide smile band
  // narrows to a small clenched notch. Compare against wisp_0/wisp_1 in
  // src/data/sprites-enemies.js before changing either. Default palette
  // 'magic' matches wisp's own `pal` in src/data/enemies.js.
  wisp_hurt: {
    pal: 'magic', art: `
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
    ....03300330....` },

  // Gel: the same round blob (gel_0/gel_1 in src/data/sprites-enemies.js,
  // 9x12 centred in the 16x16 cell) squashed into a flat, wide splat — a
  // slime's death reads as "it stopped holding its shape", not a flinch or
  // a fade, and this is the whole silhouette change that says so. Default
  // palette 'slime' matches gel's own `pal` in src/data/enemies.js.
  gel_death: {
    pal: 'slime', art: `
    ................
    ................
    ................
    ................
    ................
    ................
    ................
    ................
    .33333333333333.
    .31111111111113.
    .31111111111113.
    .33333333333333.
    ................
    ................
    ................
    ................` },
};

export function installEnemyStateSprites() {
  sprites.add(ENEMY_STATE_ART);
}
