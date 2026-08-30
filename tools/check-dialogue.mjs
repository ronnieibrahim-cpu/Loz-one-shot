// Every dialogue id the world asks for is written, and every id written is
// asked for.
//
// `T47` is the reason this exists: `Game.startDialogue` looks an id up, and on
// a miss it warns to a console nobody is reading and shows the player an EMPTY
// BOX. A typo in a room's entity data is therefore invisible — the NPC still
// stands there, still turns to face you, still opens a dialogue box, and the
// box is blank. Nothing in the checker table could see it.
//
// The other direction matters too and is how the six orphans in `A6` were
// found: an id sitting in `story.js` that no entity references is a line
// somebody wrote and no player will ever read.
//
// WHERE IDS COME FROM. This walks the real entity data out of the registered
// maps rather than grepping source text, so it sees exactly what the game will
// construct. The fields that carry a dialogue ID are the ones the entity
// classes actually read (`src/game/objects.js`):
//   npc/giver/trader   dialogue, waiting, after, blocked
//   makuTree           the above, plus sceneAfter (`scene` is a CUTSCENE id,
//                      which is a different table and not checked here)
//   trader.deals[]     text, blocked, after — a deal's line is `text`, NESTED
//                      one level down, which is where ten of the eleven trade
//                      lines live
//   sign               NONE — `Sign` reads `o.text` and says it LITERALLY, so a
//                      sign's words are not an id and must not be counted as
//                      one. This is why `signCoast` is an orphan: it is a sign
//                      line written in the id table, and signs do not use the
//                      id table. This is also why `text` cannot simply be
//                      treated as an id field everywhere: on a sign it is
//                      prose, on a deal it is a key.
//
// Usage: node tools/check-dialogue.mjs [--verbose]

import { installData } from '../src/data/index.js';
import { MAPS } from '../src/world/maps.js';
import { DIALOGUE } from '../src/data/story.js';

const VERBOSE = process.argv.includes('--verbose');

installData();

// The entity option fields that hold a dialogue id. Keep this in step with
// `src/game/objects.js`; a field added there and not here is a reference this
// tool cannot see.
const ID_FIELDS = ['dialogue', 'waiting', 'after', 'blocked', 'sceneAfter'];
const DEAL_ID_FIELDS = ['text', 'blocked', 'after'];

const referenced = new Map();   // id -> [where, ...]
const problems = [];

for (const m of MAPS.values()) {
  for (const [key, def] of Object.entries(m.roomDefs || {})) {
    for (const e of def.entities || []) {
      if (!Array.isArray(e)) continue;
      const [kind, , , opts] = e;
      if (!opts || typeof opts !== 'object') continue;
      if (kind === 'sign') continue;            // its `text` is prose, not an id
      const note = (id, f) => {
        if (typeof id !== 'string') return;
        if (!referenced.has(id)) referenced.set(id, []);
        referenced.get(id).push(`${m.id}/${key} ${kind}.${f}`);
      };
      for (const f of ID_FIELDS) note(opts[f], f);
      for (const d of opts.deals || []) {
        for (const f of DEAL_ID_FIELDS) note(d[f], `deals[].${f}`);
      }
    }
  }
}

const defined = new Set(Object.keys(DIALOGUE));

// --- an id the world asks for and story.js does not define (T47) ------------
for (const [id, wheres] of referenced) {
  if (defined.has(id)) continue;
  problems.push(`'${id}' is referenced by ${wheres.length} place(s) but not defined in story.js — ` +
    `this shows the player an EMPTY BOX, silently (T47). First: ${wheres[0]}`);
}

// --- the second state actually FIRES ----------------------------------------
//
// Every check above is about ids existing. None of them would notice an NPC
// whose second line is wired correctly and never reached — a wrong threshold,
// or a condition that cannot be met, gives a townsperson a line no player will
// ever hear, and the symptom is indistinguishable from "they only had one
// line", which is the exact thing this session set out to fix.
//
// So each conditional NPC is CONSTRUCTED and its real `interact` is driven,
// once below its threshold and once at it, against a stub game. It asserts the
// engine's own line choice rather than re-deriving the rule.
const { NPC } = await import('../src/game/objects.js');
let proved = 0;
for (const m of MAPS.values()) {
  for (const [key, def] of Object.entries(m.roomDefs || {})) {
    for (const e of def.entities || []) {
      if (!Array.isArray(e) || e[0] !== 'npc') continue;
      const o = e[3];
      if (!o || !o.after) continue;
      const npc = new NPC(0, 0, o);
      npc.faceOnTalk = false;
      const run = (essences) => {
        const said = [];
        npc.interact({ progress: { essences, flags: {} }, startDialogue: id => said.push(id) },
          { cx: 0, cy: 0 });
        return said[0];
      };
      const need = o.needEssences || 0;
      const where = `${m.id}/${key} npc(${o.dialogue})`;
      if (!npc.conditional()) {
        problems.push(`${where}: has an 'after' line but no condition, so '${o.after}' would be ` +
          `the ONLY line it ever says and '${o.dialogue}' would be unreachable`);
        continue;
      }
      const before = run(new Array(Math.max(0, need - 1)).fill(1));
      const after = run(new Array(need).fill(1));
      if (before !== o.dialogue) {
        problems.push(`${where}: below its threshold it says '${before}', not '${o.dialogue}'`);
      }
      if (after !== o.after) {
        problems.push(`${where}: at ${need} essence(s) it says '${after}', not '${o.after}' — ` +
          `the second line is unreachable`);
      }
      if (need > 6) {
        problems.push(`${where}: needs ${need} essences and there are only 6 in the game — ` +
          `'${o.after}' can never be said`);
      }
      proved++;
    }
  }
}

// --- an id defined and never referenced -------------------------------------
const orphans = [...defined].filter(id => !referenced.has(id));

console.log(`check-dialogue: ${defined.size} ids written, ${referenced.size} referenced, ` +
  `${orphans.length} orphaned; ${proved} two-state NPC(s) proved in-engine`);

if (VERBOSE) {
  for (const [id, wheres] of [...referenced].sort()) {
    console.log(`  ${id.padEnd(20)} ${wheres.length}x  ${wheres[0]}`);
  }
}

if (orphans.length) {
  // An orphan is a line nobody will read. It is not automatically a failure —
  // a session may be mid-way through placing one — but it must be visible
  // rather than sitting in a --verbose nobody runs (T55), so it prints every
  // time and the count is asserted below.
  console.log(`\n${orphans.length} orphaned id(s) — written but nothing references them:`);
  for (const id of orphans) console.log('  ' + id);
}

if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
if (orphans.length) {
  console.error(`\nEvery written line must be reachable by a player. Place it on an entity, or delete it.`);
  process.exit(1);
}
console.log('check-dialogue: OK — every id the world asks for is written, and every id written is asked for');
