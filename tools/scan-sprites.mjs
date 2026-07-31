// Sprite integrity scan: find sprites whose rows are broken apart.
//
// validate.mjs checks that a sprite is the right size and uses legal
// characters. It cannot see the defect this catches: a row of a sprite that is
// split by a see-through slot, or shifted out past the rest of the body, so
// one line renders detached from the creature it belongs to. Every one of
// those passes validation and looks wrong on screen.
//
//   node tools/scan-sprites.mjs              report everything
//   node tools/scan-sprites.mjs --strict     exit 1 if anything is found
//   node tools/scan-sprites.mjs --pack=fx    one manifest pack only
//   node tools/scan-sprites.mjs --skip-bosses
//
// It runs against the RESOLVED registry — the art the engine actually draws
// after every pack has installed and later packs have overridden earlier ones.
// That matters: 37 of the 40 names in LINK_ART are shadowed by PLAYER_ART, so
// scanning the source packs reports defects in art nobody ever sees.
//
// Three checks, all on the decoded pixel buffer so source indentation is
// irrelevant:
//
//   hole      a gap of 1-2px inside a row that the rows above AND below draw
//             straight through — a slot punched across the body
//   outdent   a row whose drawn span starts or ends 3px or more beyond both
//             of its neighbours — a line sticking out of the silhouette
//   detached  a run of 2px or more that touches nothing above or below
//
// `detached` is the noisiest: rings, diagonal chains and deliberate sparkles
// trip it legitimately, so it is reported separately and excluded from
// --strict. `hole` is almost never intentional.

import { installData } from '../src/data/index.js';
import { sprites } from '../src/gfx/art.js';
import { REQUIRED_SPRITES } from '../src/data/sprite-manifest.js';

const args = process.argv.slice(2);
const flag = (n) => args.includes('--' + n);
const opt = (n) => {
  const a = args.find(v => v.startsWith('--' + n + '='));
  return a ? a.slice(n.length + 3) : null;
};
const PACK = opt('pack');
const STRICT = flag('strict');
const SKIP_BOSSES = flag('skip-bosses');

installData();

const TRANSPARENT = 255;
const only = PACK ? new Set(REQUIRED_SPRITES[PACK] || []) : null;
if (PACK && !REQUIRED_SPRITES[PACK]) {
  console.error(`unknown pack '${PACK}' — one of: ${Object.keys(REQUIRED_SPRITES).join(', ')}`);
  process.exit(2);
}

const isBossArt = (n) => n.startsWith('boss_') || n.startsWith('mini_');
const holes = [], outdents = [], detached = [];

for (const [name, def] of sprites.defs) {
  if (only && !only.has(name)) continue;
  if (SKIP_BOSSES && isBossArt(name)) continue;
  const { w, h, px } = def.art;
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? TRANSPARENT : px[y * w + x];
  const drawn = (x, y) => at(x, y) !== TRANSPARENT;
  const span = (y) => {
    let a = -1, b = -1;
    for (let x = 0; x < w; x++) if (drawn(x, y)) { if (a < 0) a = x; b = x; }
    return [a, b];
  };
  const render = (y) => {
    let s = '';
    for (let x = 0; x < w; x++) s += at(x, y) === TRANSPARENT ? '.' : at(x, y);
    return s;
  };

  for (let y = 0; y < h; y++) {
    const [a, b] = span(y);
    if (a < 0) continue;

    for (let x = a; x <= b; x++) {
      if (drawn(x, y)) continue;
      let e = x;
      while (e <= b && !drawn(e, y)) e++;
      const gap = e - x;
      if (gap <= 2) {
        let up = true, dn = true;
        for (let i = x; i < e; i++) { if (!drawn(i, y - 1)) up = false; if (!drawn(i, y + 1)) dn = false; }
        if (up && dn) holes.push([name, y, `${gap}px see-through slot at x=${x}`, render(y)]);
      }
      x = e - 1;
    }

    const [ua, ub] = span(y - 1), [da, db] = span(y + 1);
    if (ua >= 0 && da >= 0) {
      const outL = Math.min(ua, da) - a, outR = b - Math.max(ub, db);
      if (outL >= 3) outdents.push([name, y, `starts ${outL}px left of both neighbours`, render(y)]);
      if (outR >= 3) outdents.push([name, y, `ends ${outR}px right of both neighbours`, render(y)]);
    }

    for (let x = a; x <= b; x++) {
      if (!drawn(x, y)) continue;
      let e = x;
      while (e <= b && drawn(e, y)) e++;
      let touching = false;
      for (let i = x - 1; i <= e && !touching; i++) if (drawn(i, y - 1) || drawn(i, y + 1)) touching = true;
      if (!touching && (e - x) >= 2) detached.push([name, y, `${e - x}px run at x=${x} touches nothing above or below`, render(y)]);
      x = e - 1;
    }
  }
}

function report(title, list, show = 40) {
  console.log(`\n=== ${title}: ${list.length} ===`);
  for (const [name, y, why, row] of list.slice(0, show)) {
    console.log(`  ${name} row ${y}: ${why}`);
    console.log(`      ${row}`);
  }
  if (list.length > show) console.log(`  ... and ${list.length - show} more`);
}

console.log(`scan-sprites: ${sprites.defs.size} resolved sprites${PACK ? `, pack '${PACK}'` : ''}`);
report('holes (a slot punched across the body — almost never intentional)', holes);
report('outdents (a row sticking out past both neighbours)', outdents);
report('detached runs (informational: rings and sparkles trip this legitimately)', detached, 12);

const hard = holes.length + outdents.length;
console.log(`\n${hard} hard finding(s), ${detached.length} informational.`);
if (STRICT && hard) process.exit(1);
