// Sprite pack: enemies original to this game, drawn by hand to sit beside the
// extracted Seasons cast (docs/ART-DIRECTION.md; CLAUDE.md "if no sheet has
// it, draw it to match"): three colours and a hard black outline, two frames
// differing by more than three pixels, in Seasons' own blue enemy palette
// (the octorok's and the bubble's: light, blue, blue, black).
//
// Art grammar: see src/gfx/art.js ('.' transparent, '0'..'3' light to dark).

import { sprites } from '../gfx/art.js';
import { registerPalettes } from '../gfx/palettes.js';

/** THE STRIDER (S243, docs/briefs/s243/enemy-sketch.png, the human's yes): a
 *  water-strider that skates the top of the sea in a side-view passage. Seen
 *  side on, facing right (the engine mirrors it); its feet are on row 14. */
export const ENEMY_DRAWN_ART = {
  strider_0: { pal: 'strider', art: `
    ................
    ................
    ................
    .........333....
    ....33333..13...
    ...3000113.0103.
    ..300111113111.3
    ..3011111223113.
    ...3111222233...
    ....3322233.3...
    ...2..22...2.2..
    ..2..2..2...2.2.
    .2..2....2...2.2
    2..2......2...2.
    1.1........1...1
    ................` },
  strider_1: { pal: 'strider', art: `
    ................
    ................
    ................
    ................
    .........333....
    ....33333..13...
    ...3000113.0103.
    ..300111113111.3
    ..3011111223113.
    ...3111222233...
    ....2222222.2...
    ...2..2.2...2...
    ..2..2...2..2...
    .2..2.....2..2..
    1..1.......1.1..
    ................` },
};

const PALETTES = {
  strider: ['#ffd68c', '#1984ff', '#1984ff', '#000000'],
};

export function installDrawnEnemySprites() {
  registerPalettes(PALETTES);
  sprites.add(ENEMY_DRAWN_ART, 'strider');
}
