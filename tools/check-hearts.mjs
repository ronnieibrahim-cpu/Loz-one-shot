// Heart economy census and proof.
//
// P9's curve: 3 hearts at start, half-heart contact damage from ordinary
// enemies, six Heart Containers plus heart pieces landing the cap at 14-16.
//
// This tool is the thing that proves the cap, because the cap is not written
// down anywhere in the code — it is an EMERGENT SUM of where heart pieces were
// dropped across six dungeon files, the overworld and the caves, four pieces to
// a container, plus one container per boss. Every previous session that touched
// a dungeon changed this number without being able to see it.
//
// Checks:
//   * every heart piece placement in the game, counted from the loaded data
//   * every Heart Container source, counted from the registered bosses
//   * the cap those two land on, against P9's 14-16 window
//   * no heart piece is stranded in a room no route reaches
//   * every ordinary enemy deals P9's half-heart contact damage
//
// Usage: node tools/check-hearts.mjs [--verbose]

import { installData } from '../src/data/index.js';
import { MAPS, getRoom } from '../src/world/maps.js';
import { F } from '../src/world/tileset.js';
import { defWalkable, capsForMode, ROUTE_AVOID } from './lib/collision.mjs';
import { ENTITY_TYPES } from '../src/game/entity.js';
import { Boss } from '../src/game/enemy.js';
import { newProgress, HEART_UNITS } from '../src/game/progress.js';

const VERBOSE = process.argv.includes('--verbose');

installData();

const fails = [];
const notes = [];
let checks = 0;
function check(ok, label) {
  checks++;
  if (!ok) fails.push(label);
  return ok;
}

// ---------------------------------------------------------------------------
// 1. Heart pieces, counted from the data the game actually loads.
// ---------------------------------------------------------------------------
//
// A piece reaches the player by one of three routes, and all three are counted
// here because all three have been used in the world already: an entity placed
// in the room's `entities`, a `buried` item under a diggable tile, and a
// `puzzle.reward.spawn` that drops one when a room is solved.

const pieces = [];

function scanSpawnList(list, where, how) {
  if (!Array.isArray(list)) return;
  for (const ent of list) {
    if (!Array.isArray(ent)) continue;
    const [kind, x, y, opts] = ent;
    if (kind === 'pickup' && opts && opts.kind === 'heartPiece') {
      pieces.push({ where, how, x, y });
    }
  }
}

for (const [mapId, map] of MAPS) {
  for (const [key, room] of Object.entries(map.roomDefs || {})) {
    const where = `${mapId}/${key}`;
    scanSpawnList(room.entities, where, 'placed');
    // `buried` is [x, y, kind] triples, not entity tuples.
    for (const b of room.buried || []) {
      if (Array.isArray(b) && b[2] === 'heartPiece') {
        pieces.push({ where, how: 'buried', x: b[0], y: b[1] });
      }
    }
    if (room.puzzle && room.puzzle.reward) {
      scanSpawnList(room.puzzle.reward.spawn, where, 'puzzle reward');
    }
  }
}

// ---------------------------------------------------------------------------
// 2. Heart Containers.
// ---------------------------------------------------------------------------
//
// One per dungeon boss, spawned from the boss room's own `onEvent('bossDead')`
// closure. A closure cannot be read without running it, so the containers are
// counted from the registered dungeons instead: `map.dungeon.boss` is the
// declaration, and the closure is what honours it. The two are cross-checked
// against each other below so a dungeon that declares a boss but forgets to
// spawn the container is caught rather than silently costing the player a
// heart.

const dungeons = [...MAPS.values()].filter(m => m.kind === 'dungeon' && m.dungeon);
const containers = dungeons.filter(d => d.dungeon.boss);

// The closure is a string, not data — but it is a string we can read.
// `spawnPickup(..., 'heartContainer', ...)` inside a boss room's `script.onEvent`
// handler is
// the only way a container reaches the player, so its presence is checkable
// by source even though its behaviour is not.
const containerSrc = [];
for (const d of dungeons) {
  const room = d.roomDefs[d.dungeon.bossRoom];
  const src = room && room.script && room.script.onEvent ? String(room.script.onEvent) : '';
  if (src.includes('heartContainer')) containerSrc.push(d.id);
}

// ---------------------------------------------------------------------------
// 3. The cap.
// ---------------------------------------------------------------------------

const START = newProgress().maxHearts / HEART_UNITS;
const fromPieces = Math.floor(pieces.length / 4);
const leftover = pieces.length % 4;
const cap = START + containers.length + fromPieces;

console.log('Heart economy census');
console.log('====================');
console.log(`  start                ${START} hearts`);
console.log(`  Heart Containers     ${containers.length}  (one per dungeon boss)`);
console.log(`  heart pieces         ${pieces.length}  = ${fromPieces} containers`
  + (leftover ? ` + ${leftover} orphaned piece${leftover === 1 ? '' : 's'}` : ''));
console.log(`  CAP                  ${cap} hearts`);
console.log('');

if (VERBOSE) {
  console.log('  heart piece placements:');
  const byMap = new Map();
  for (const p of pieces) {
    const m = p.where.split('/')[0];
    if (!byMap.has(m)) byMap.set(m, []);
    byMap.get(m).push(p);
  }
  for (const [m, list] of [...byMap].sort()) {
    console.log(`    ${m} (${list.length})`);
    for (const p of list.sort((a, b) => a.where.localeCompare(b.where))) {
      console.log(`      ${p.where.padEnd(16)} ${String(p.x)},${p.y}  ${p.how}`);
    }
  }
  console.log('');
}

// P9's window. Both ends are asserted: a cap BELOW 14 means the pieces never
// scaled up from the eight-dungeon assumption, and a cap ABOVE 16 means the
// damage curve was tuned against a player who is harder to kill than the one
// the curve was written for.
check(cap >= 14, `cap is ${cap}, below P9's floor of 14 hearts`);
check(cap <= 16, `cap is ${cap}, above P9's ceiling of 16 hearts`);

// An orphaned piece is a piece the player can find, collect, hear the jingle
// for, and never get a heart out of — the counted-item trap in a different
// costume. Four to a container means the total must divide by four.
check(leftover === 0,
  `${pieces.length} heart pieces leaves ${leftover} that can never complete a container`);

// Every dungeon that declares a boss must actually spawn the container.
for (const d of dungeons) {
  check(!d.dungeon.boss || containerSrc.includes(d.id),
    `${d.id} declares boss '${d.dungeon.boss}' but its boss room never spawns a heartContainer`);
}
// And nothing may spawn one that has not declared a boss to justify it.
for (const id of containerSrc) {
  const d = dungeons.find(x => x.id === id);
  check(d && d.dungeon.boss,
    `${id} spawns a heartContainer without declaring a boss`);
}

// ---------------------------------------------------------------------------
// 4. Where the pieces are, and whether the player can stand there.
// ---------------------------------------------------------------------------
//
// Two pieces stacked on one tile read as one piece to the player and silently
// cost the run a quarter of a container.
const seen = new Set();
for (const p of pieces) {
  const key = `${p.where}@${p.x},${p.y}`;
  check(!seen.has(key), `two heart pieces stacked on ${key}`);
  seen.add(key);
}

// A piece on a tile the player can never reach is worse than a missing one: it
// is visible, it is counted here, and it is worthless. But "reach" is not one
// verb, and this checker learned that the hard way — its first cut called two
// long-standing, correct placements broken because it only knew how to walk:
//
//   * A BURIED piece is not stood on at all. It comes up when the Dredge Line
//     drags back over the tile (`game.dredgeTile`), and the Drowned Shore's
//     sits under an `abyssHole` — deep water, with a bell NPC in the room
//     leaning toward it. The test is the Dredge Line's OWN predicate from
//     `items.js` dragBack, `F.WET | F.SLOW`, not walkability.
//
//   * A piece on a liftable ROCK is reached by lifting the rock. Three
//     independent placements use this idiom — this heart piece at Kell Ledges,
//     a fairy at 0,11,3 and a rupee at 0,11,6 — so it is the world's grammar,
//     not a slip.
//
// The tide is the third verb: `4` (seafloor) is walkable at LOW and drowned
// above it, so the test is never "walkable" but "reachable at SOME tide level".
//
// This is deliberately a TILE test and not a flood. Whether the ROOM can be
// reached is walk-dungeons.mjs's and check-overworld.mjs's job, and a second
// flood here would be a second model of the same thing, free to drift from the
// first. What nothing else checks is the tile the piece is actually on.
function reachable(room, x, y, tide, how) {
  const d = room.tile(x, y, tide);
  if (d.flags & F.VOID) return false;
  // The Dredge Line searches water and soft ground and needs no footing.
  if (how === 'buried') return !!(d.flags & (F.WET | F.SLOW));
  // A liftable rock is a tile you stand on one moment later.
  if (d.flags & F.ROCK) return true;
  return defWalkable(d, capsForMode('foot'), ROUTE_AVOID);
}

for (const p of pieces) {
  const [mapId, key] = p.where.split('/');
  const [f, rx, ry] = key.split(',').map(Number);
  let room;
  try { room = getRoom(mapId, f, rx, ry); } catch { room = null; }
  if (!room) { check(false, `${p.where}: heart piece in a room that will not build`); continue; }
  const levels = [0, 1, 2].filter(t => reachable(room, p.x, p.y, t, p.how));
  check(levels.length > 0,
    `${p.where}@${p.x},${p.y}: heart piece on a tile no verb reaches at any tide`);
  if (VERBOSE && levels.length && levels.length < 3) {
    notes.push(`${p.where}@${p.x},${p.y} is reachable only at tide ${levels.join('/')}`);
  }
}

// ---------------------------------------------------------------------------
// 4b. The quota that keeps the cap where P9 put it.
// ---------------------------------------------------------------------------
//
// The cap is a SUM, and a sum is the easiest number in a project to break by
// accident: a dungeon session that adds a room with a piece in it, or drops one
// while rebuilding a floor, moves the game's maximum health without ever
// touching a file that sounds like it is about health. That is how the count sat
// at 18 — four containers' worth plus two pieces that could never become
// anything — through six dungeon builds.
//
// So the distribution is pinned, not just the total: every dungeon carries
// exactly two, and the rest sit in the overworld and the caves. A future
// session that wants a different split has to change this line, which is the
// point — it makes the cap something you decide rather than something you drift
// into.
const PER_DUNGEON = 2;
const byMapCount = new Map();
for (const p of pieces) {
  const m = p.where.split('/')[0];
  byMapCount.set(m, (byMapCount.get(m) || 0) + 1);
}
for (const d of dungeons) {
  const n = byMapCount.get(d.id) || 0;
  check(n === PER_DUNGEON,
    `${d.id} (${d.name}) holds ${n} heart piece${n === 1 ? '' : 's'}, not ${PER_DUNGEON}`);
}

// ---------------------------------------------------------------------------
// 5. The damage ladder, pinned.
// ---------------------------------------------------------------------------
//
// P9 asks for "half-heart contact damage from ordinary enemies". That is the
// ONE hard number in the brief and it is asserted below. The rest of this
// section exists because the cap moving 13 -> 15 changes what every OTHER rung
// is worth, and the only way to keep that honest is to write the ladder down
// somewhere that runs.
//
// Every enemy is pinned to a tier here by name. A new enemy fails this checker
// until someone puts it on a rung, and changing an existing enemy's damage means
// changing this table too — which is the point. Damage is the other half of the
// health economy and it drifted for six dungeon builds without anyone able to
// see the shape it had drifted into.
//
// HITS TO KILL is the number that actually matters, and it is why the cap and
// the damage curve had to be derived together rather than one after the other:
// raising the cap is a difficulty change even when no damage value moves.

const TIERS = {
  // The nuisance rung. A quarter heart is the one sub-half value the source
  // games do use, and it is what a bat is worth.
  chip: { qh: 1, of: ['gel', 'keese'] },
  // P9'S ANCHOR. Half a heart, six hits to kill a new player. Do not move this
  // without moving the brief.
  ordinary: {
    qh: 2,
    of: ['barnacle', 'beamos', 'beetle', 'bubble', 'crab', 'leever', 'octorok',
      'octorokSea', 'stalfos', 'tektite', 'urchin', 'wisp', 'zol'],
  },
  // The tougher overworld and late-dungeon roster.
  heavy: {
    qh: 3,
    of: ['anglerfry', 'darknut', 'jellyfish', 'moblin', 'pincer', 'siren', 'wizzrobe'],
  },
  // Bosses are pinned by NAME like everything else, and deliberately not by
  // "whichever enemy a dungeon declares". Two of them are not declared by any
  // dungeon and would have been mis-tiered as minibosses: `brinehulk` is the
  // Abyssal Keep's second fight standing in front of Nereth, and `thalassor` is
  // built and placed nowhere at all. The declarations are cross-checked against
  // this list below rather than used as the source of it.
  boss: {
    qh: 4,
    of: ['anemos', 'brinehulk', 'gloomtide', 'gohmaraq', 'nereth', 'rootmaw',
      'thalassor', 'wyverna'],
  },
  // Everything else built on the Boss class: the per-dungeon miniboss.
  miniboss: { qh: 3, of: null },
};

function tierOf(name, e) {
  if (TIERS.boss.of.includes(name)) return 'boss';
  if (e instanceof Boss) return 'miniboss';
  for (const [t, spec] of Object.entries(TIERS)) {
    if (spec.of && spec.of.includes(name)) return t;
  }
  return null;
}

const ladder = new Map(Object.keys(TIERS)
  .sort((a, b) => TIERS[a].qh - TIERS[b].qh || a.localeCompare(b))
  .map(t => [t, []]));
for (const [name, f] of ENTITY_TYPES) {
  let e;
  try { e = f(0, 0, {}, null); } catch { continue; }
  if (!e || !e.isEnemy) continue;
  const t = tierOf(name, e);
  if (!t) { check(false, `${name} is on no rung of the damage ladder — add it to TIERS`); continue; }
  check(e.damage === TIERS[t].qh,
    `${name} deals ${e.damage} qh but sits on the '${t}' rung, which is ${TIERS[t].qh}`);
  ladder.get(t).push(name);
}

// Every dungeon's declared boss must be on the boss rung. This is the
// cross-check that the tier list and the map data still agree about who the
// bosses are.
for (const d of dungeons) {
  if (!d.dungeon.boss) continue;
  check(TIERS.boss.of.includes(d.dungeon.boss),
    `${d.id} declares boss '${d.dungeon.boss}', which is not on the boss rung`);
}

// P9's literal requirement, asserted on its own so it cannot be lost in a
// wholesale edit of the table above.
const HALF_HEART = HEART_UNITS / 2;
check(TIERS.ordinary.qh === HALF_HEART,
  `P9: ordinary enemies must deal half a heart (${HALF_HEART} qh), not ${TIERS.ordinary.qh}`);

console.log('Damage ladder                    hits to kill');
console.log('  tier      dmg  in hearts  at start    at cap');
for (const [t, names] of ladder) {
  const qh = TIERS[t].qh;
  const inHearts = qh / HEART_UNITS;
  const label = inHearts === 1 ? '1 heart' : `${inHearts} hearts`;
  console.log(`  ${t.padEnd(9)} ${String(qh).padStart(2)} qh  ${label.padEnd(11)}`
    + `${String(Math.ceil(START * HEART_UNITS / qh)).padStart(6)}`
    + `${String(Math.ceil(cap * HEART_UNITS / qh)).padStart(10)}`
    + `   ${names.length} type${names.length === 1 ? '' : 's'}`);
}
console.log('');

// A DERIVATION THIS CHECKER RECORDS BUT DOES NOT ENFORCE.
//
// Two rungs are off the half-heart grid the source games deal on, and the cap
// rising to 15 hearts makes both worse rather than better:
//
//   heavy     3 qh  ->  4 qh (one heart)      15 hits at cap, not 20
//   miniboss  3 qh  ->  6 qh (a heart and a half)
//   boss      4 qh  ->  8 qh (two hearts)      8 hits at cap, not 15
//
// As it stands a miniboss hits for exactly what a jellyfish hits for, and the
// final boss needs fifteen connections to kill a maxed player.
//
// It is NOT applied here, and the reason is measurement rather than caution.
// Every enemy the change would touch — D1's two anglerfry (0,5,2), the Clawcrab
// (0,5,3) and Gohmaraq (0,3,1) — sits in the half of D1 that
// `check-playthrough.mjs` cannot yet reach: the route stops at the Sluicegate
// (0,3,2) for want of an anchor-placement directive in the actor. So the one
// instrumented run in the project would show no change at all, and the numbers
// above would go in as `guessed` while looking like they had been proven.
// See docs/FEEL-SPEC.md and docs/NEXT-SESSION.md.

// ---------------------------------------------------------------------------

if (notes.length) {
  console.log('Notes (not failures):');
  for (const n of notes) console.log(`  - ${n}`);
  console.log('');
}

if (fails.length) {
  console.log(`FAIL ${fails.length}/${checks}`);
  for (const f of fails) console.log(`  x ${f}`);
  process.exit(1);
}
console.log(`OK ${checks}/${checks}`);
