// Scratch: rewrite the tile coordinates (and optionally the type) of one entity
// inside a room's `entities:` list, in the data source. Textual, so comments and
// formatting survive; it refuses anything it cannot match exactly once ACROSS
// every data file — room keys repeat between dungeons, so uniqueness has to be
// global rather than per-file.
import { readFileSync, writeFileSync } from 'node:fs';

const MOVES = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const FILES = ['src/data/overworld.js', 'src/data/dungeons-a.js', 'src/data/dungeons-b.js'];
const src = new Map(FILES.map(f => [f, readFileSync(f, 'utf8')]));

function spans(text, key) {
  const out = [];
  const needle = `'${key}': {`;
  for (let i = text.indexOf(needle); i >= 0; i = text.indexOf(needle, i + 1)) {
    // Close on a `},` at the KEY'S OWN indent. Overworld rooms sit at two
    // spaces and dungeon rooms at six, so a fixed indent silently swallowed
    // every room after the one being edited.
    const bol = text.lastIndexOf('\n', i) + 1;
    const indent = text.slice(bol, i);
    const j = text.indexOf(`\n${indent}},`, i);
    out.push([i, j < 0 ? text.length : j]);
  }
  return out;
}

let done = 0;
for (const mv of MOVES) {
  const re = new RegExp(`\\['${mv.type}',\\s*${mv.tx},\\s*${mv.ty}(?=[,\\]])`, 'g');
  const hits = [];
  for (const [file, text] of src) {
    for (const [a, b] of spans(text, mv.room)) {
      const body = text.slice(a, b);
      const n = (body.match(re) || []).length;
      if (n) hits.push({ file, a, b, n });
    }
  }
  const total = hits.reduce((s, h) => s + h.n, 0);
  if (total !== 1) throw new Error(`${mv.map}/${mv.room} ${mv.type} ${mv.tx},${mv.ty}: ${total} matches`);
  const { file, a, b } = hits[0];
  const text = src.get(file);
  const to = mv.becomes || mv.type;
  const body = text.slice(a, b).replace(re, `['${to}', ${mv.nx}, ${mv.ny}`);
  src.set(file, text.slice(0, a) + body + text.slice(b));
  done++;
}
for (const [f, t] of src) writeFileSync(f, t);
console.log(`moved ${done} of ${MOVES.length}`);
