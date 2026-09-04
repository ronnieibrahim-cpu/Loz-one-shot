// Every character the game can put on screen has a glyph to draw it with.
//
// `decode` in src/gfx/font.js ends in `GLYPHS[ch] || GLYPHS['?']`. A character
// with no glyph therefore does not crash, does not warn, and does not even
// leave a gap — it prints a QUESTION MARK, which reads as authored punctuation
// and is invisible in a diff, in a grep, and in every assertion in the checker
// table. Six Essence title cards said
//
//     Essence of the Tide
//     I ? the Shallow Bell
//
// for the whole life of the project, because the em-dash has never had a
// glyph. Nothing caught it until somebody took a screenshot (`T53`).
//
// This asks the font's own table via `hasGlyph` rather than keeping a second
// copy of the alphabet here — the same rule as a checker calling the engine's
// collision code instead of re-deriving it.
//
// WHAT IT READS. Every string the player can be shown: dialogue lines, cutscene
// captions and `say` steps, room and map names, item and charm names, and the
// trade chain's object names. If you add a new source of displayed text, add it
// here; a source this file does not know about is one it cannot protect.
//
// Usage: node tools/check-text.mjs [--verbose]

import { installData } from '../src/data/index.js';
import { MAPS } from '../src/world/maps.js';
import { DIALOGUE, STORY_CUTSCENES } from '../src/data/story.js';
import { hasGlyph } from '../src/gfx/font.js';
import { ITEMS } from '../src/game/items.js';
import { CHARMS } from '../src/game/scrimshaw.js';
import { TRADE_ITEMS } from '../src/data/trade.js';
import { wrapText, textWidth } from '../src/gfx/font.js';
import { DESC_WRAP_W } from '../src/game/menu.js';

const VERBOSE = process.argv.includes('--verbose');
installData();

const missing = new Map();   // char -> [where, ...]
let scanned = 0, chars = 0;

function scan(text, where) {
  if (typeof text !== 'string') return;
  scanned++;
  for (const ch of text) {
    chars++;
    if (ch === '\n' || hasGlyph(ch)) continue;
    if (!missing.has(ch)) missing.set(ch, []);
    missing.get(ch).push(where);
  }
}

for (const [k, v] of Object.entries(DIALOGUE)) {
  // A line may be a function of the game state; those are built at runtime and
  // cannot be scanned here. They are counted so the total is honest.
  scan(v, `DIALOGUE.${k}`);
}
for (const [k, steps] of Object.entries(STORY_CUTSCENES)) {
  for (const st of steps || []) {
    scan(st.text, `cutscene ${k}.text`);
    scan(st.say, `cutscene ${k}.say`);
  }
}
for (const m of MAPS.values()) {
  scan(m.name, `map ${m.id}.name`);
  for (const [key, def] of Object.entries(m.roomDefs || {})) {
    scan(def.name, `${m.id}/${key}.name`);
    for (const e of def.entities || []) {
      if (!Array.isArray(e)) continue;
      const o = e[3];
      if (o && typeof o === 'object') scan(o.text, `${m.id}/${key} ${e[0]}.text`);
    }
  }
}
for (const [k, v] of Object.entries(ITEMS || {})) {
  scan(v && v.name, `item ${k}`);
  scan(v && v.desc, `item ${k}.desc`);
}
for (const [k, v] of Object.entries(CHARMS || {})) {
  scan(v && v.name, `charm ${k}`);
  scan(v && v.desc, `charm ${k}.desc`);
}
for (const [k, v] of Object.entries(TRADE_ITEMS || {})) scan(v && v.name, `trade ${k}`);

console.log(`check-text: ${scanned} strings, ${chars} characters, ${missing.size} without a glyph`);

if (VERBOSE) {
  const seen = new Set();
  for (const [k, v] of Object.entries(DIALOGUE)) if (typeof v === 'string') for (const c of v) seen.add(c);
  console.log(`  distinct characters in dialogue: ${[...seen].sort().join('')}`);
}

if (missing.size) {
  console.error(`\n${missing.size} character(s) the game can display and the font cannot draw:`);
  for (const [ch, where] of missing) {
    const cp = 'U+' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
    console.error(`  ${JSON.stringify(ch)} (${cp}) in ${where.length} place(s), e.g. ${where[0]}`);
    if (VERBOSE) for (const w of where) console.error(`      ${w}`);
  }
  console.error(`\nEach of these renders as '?' — silently. Add the glyph to GLYPHS in ` +
    `src/gfx/font.js, or use a character that has one.`);
  process.exit(1);
}
// -------------------------------------------------------------------------
// Descriptions have to FIT the panel that scrolls them.
//
// The pause menu wraps an item or charm description to its panel and cycles it
// a line at a time, so length is no longer a reason to cut one — but wrapText
// is greedy on SPACES, and a single word wider than the panel is the one thing
// it cannot break. Such a word does not warn: it simply runs off the right
// edge of the panel and out of the screen, and the checker table would stay
// green. The widths come from the menu itself (DESC_WRAP_W), so this assertion
// follows the panel rather than describing a panel that used to exist.
const wide = [];
function fits(text, maxW, where) {
  if (typeof text !== 'string') return;
  for (const line of wrapText(text, maxW)) {
    const w = textWidth(line);
    if (w > maxW) wide.push(`${where}: "${line}" is ${w}px in a ${maxW}px panel`);
  }
}
for (const [k, v] of Object.entries(ITEMS || {})) fits(v && v.desc, DESC_WRAP_W.item, `item ${k}.desc`);
for (const [k, v] of Object.entries(CHARMS || {})) fits(v && v.desc, DESC_WRAP_W.charm, `charm ${k}.desc`);

if (wide.length) {
  console.error(`\n${wide.length} description line(s) too wide for the panel that shows them:`);
  for (const w of wide) console.error('  ' + w);
  console.error('\nA word that cannot be broken runs off the edge. Reword it.');
  process.exit(1);
}
console.log(`check-text: OK — every displayable character has a glyph, and every ` +
  `description wraps inside its panel`);
