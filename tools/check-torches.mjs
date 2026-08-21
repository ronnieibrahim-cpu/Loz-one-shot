// Torch checker. Plain Node, no browser.
//
// WHY THIS EXISTS. `Torch.ignite` (src/game/objects.js) is reachable only from
// `checkTileAction(rect, 'fire', …)`, and for the whole life of the project
// NOTHING IN src/ EVER PASSED 'fire'. The tile system understood the action,
// effects.js had a flame, a charm called Dry Kindling was painted fire-coloured
// — and no lamp, no carried torch and no flame projectile existed to emit it.
// Every torch in the game was unlightable, and three puzzle rooms paid for it:
//
//   d2/0,4,5 Torch Cell  -> Small Key   (fatal: see below)
//   d6/0,4,4 Black Kiln  -> Small Key
//   d6/0,3,5 Drowned Hall-> rupees      (money only)
//
// The D2 one deadlocked the game. The Coral Spire has two keys and two locked
// doors; that key's door is the Stair Coil, the only way to floor 1, so the
// Lens, the Bombs, the Boss Key and Anemos were all sealed behind a key that
// needed a fire nothing could make — and since the Bombs gate the Sunken Marsh
// and the Cliffs of Kell, D3, D4 and the Maku Tree's road to the Keep went with
// it.
//
// NOTHING CAUGHT IT, and the reasons are worth keeping: `walk-dungeons.mjs`
// counts a puzzle-reward key as available once its ROOM is reachable (on
// purpose — proving puzzles solvable is another tool's job), `solve-switches.mjs`
// covers only the nine push-block rooms, and nobody had ever written the torch
// equivalent. This is that tool.
//
// WHAT IT ASSERTS
//   1. Something in src/ actually emits the 'fire' action. If this fails, every
//      torch in the game is scenery and every torch puzzle is unsolvable.
//   2. Every torch puzzle's fire source is obtainable BEFORE the puzzle's reward
//      is required — i.e. no torch-gated key is the only key standing between
//      the player and the item that lights it. That is the circular shape that
//      actually broke the game, and it is invisible to a checker that only asks
//      "is this room reachable".
//
// Usage: node tools/check-torches.mjs

import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { installData } from '../src/data/index.js';
import { MAPS } from '../src/world/maps.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
installData();

let pass = 0; const failures = [];
const check = (n, c, d) => c ? (pass++, console.log('  ok   ' + n))
  : (failures.push(n + (d ? ' — ' + d : '')), console.log('  FAIL ' + n + (d ? ' — ' + d : '')));

// --------------------------------------------------------------------------
// 1. Is there an emitter at all?
// --------------------------------------------------------------------------
function walkSrc(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walkSrc(p, out);
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}
const files = walkSrc(join(ROOT, 'src'));
const emitters = [];
/**
 * Strip comments before scanning. THE FIRST CUT OF THIS TOOL DID NOT, and it
 * happily passed against a codebase whose only emitter was commented out —
 * `// game.checkTileAction(this.rect(), 'fire');` matches the pattern exactly
 * as well as the live call does. A checker that a comment can satisfy is worse
 * than no checker, because it is trusted. Caught by deleting the emitter on
 * purpose and watching this stay green.
 */
const stripComments = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
for (const f of files) {
  const text = stripComments(readFileSync(f, 'utf8'));
  const re = /(checkTileAction|breakTilesInRect|applyTileAction)\s*\([^;]*?['"]fire['"]/gs;
  let m;
  while ((m = re.exec(text))) {
    const line = text.slice(0, m.index).split('\n').length;
    emitters.push(`${f.replace(ROOT + '/', '')}:${line}`);
  }
}
check('something in src/ emits the \'fire\' tile action',
  emitters.length > 0,
  'no call site passes \'fire\' — every torch in the game is unlightable');
if (emitters.length) console.log('       emitters: ' + emitters.join(', '));

// --------------------------------------------------------------------------
// 2. Every torch puzzle, and what it is worth.
// --------------------------------------------------------------------------
const torchRooms = [];
for (const [mapId, m] of MAPS) {
  for (const [key, def] of Object.entries(m.roomDefs || {})) {
    if (!def.puzzle || !def.puzzle.torches) continue;
    const torches = (def.entities || []).filter(e => e[0] === 'torch').length;
    const spawn = (def.puzzle.reward && def.puzzle.reward.spawn) || [];
    torchRooms.push({
      mapId, key, name: def.name || key, torches,
      rewards: spawn.map(s => (s[3] && s[3].kind) || s[0]),
    });
  }
}
check('the world places torch puzzles at all', torchRooms.length > 0, 'none found');
console.log(`  ${torchRooms.length} torch puzzle(s):`);
for (const t of torchRooms) {
  console.log(`    ${t.mapId}/${t.key} ${t.name}: ${t.torches} torches -> ${t.rewards.join(', ') || 'no spawn'}`);
}

// --------------------------------------------------------------------------
// 3. THE CIRCULAR ONE. A dungeon must not need a torch-gated key to reach the
//    thing that lights torches. Today the emitter is the bomb blast, so the
//    test is concrete: in a dungeon whose own item chain runs through Bombs, a
//    torch-gated key may not be the ONLY key on the floor the player starts on.
// --------------------------------------------------------------------------
for (const t of torchRooms) {
  const m = MAPS.get(t.mapId);
  if (!m || m.kind !== 'dungeon') continue;
  if (!t.rewards.includes('key')) continue;          // rupees can be gated freely
  const floor = t.key.split(',')[0];
  // Every key obtainable on this floor, torch-gated or not.
  let keysOnFloor = 0, torchKeysOnFloor = 0;
  for (const [key, def] of Object.entries(m.roomDefs)) {
    if (key.split(',')[0] !== floor) continue;
    const spawn = (def.puzzle && def.puzzle.reward && def.puzzle.reward.spawn) || [];
    for (const s of spawn) {
      if (!(s[3] && s[3].kind === 'key')) continue;
      keysOnFloor++;
      if (def.puzzle.torches) torchKeysOnFloor++;
    }
    for (const e of def.entities || []) {
      if (e[0] === 'pickup' && e[3] && e[3].kind === 'key') keysOnFloor++;
      if (e[0] === 'chest' && e[3] && e[3].key) keysOnFloor++;
    }
  }
  check(`${t.mapId} floor ${floor}: a torch-gated key is not the only key there`,
    keysOnFloor > torchKeysOnFloor,
    `${keysOnFloor} key(s) on the floor and all ${torchKeysOnFloor} are behind flames — `
    + `the floor's locked doors cannot be opened without the fire the player has not got yet`);
}

console.log(`\n=== ${pass} passed, ${failures.length} failed ===`);
process.exit(failures.length ? 1 : 0);
