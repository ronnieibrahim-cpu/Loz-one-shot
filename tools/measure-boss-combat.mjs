// Real-combat boss measurement. NOT a checker — it asserts nothing and always
// exits 0. `tools/check-bosses.mjs` runs every boss fight in GOD MODE, which
// proves structure (the boss spawns, its shell opens) but says nothing about
// whether a real player survives it, by its own comment. Three sessions in a
// row measured a real (non-god-mode) fight by hand — "12 quarter-hearts, no
// god mode, seed 20260806" appears twice in docs/NEXT-SESSION.md's history —
// and rebuilt the harness from memory each time because nothing was ever
// committed. This is that harness, committed once.
//
// It plays `['boss', N]` from `tools/actor-runtime.mjs` at THREE HEARTS (12
// quarter-hearts, no god mode — "what a real player brings to D1"), and logs
// every point of damage the player takes: the frame, the amount, whether the
// source was a projectile or a body touch, the distance to the boss, and the
// boss's own `weakOpen`/`stun`/`charging` state at that instant — reconstructed
// from state alone, not from anything the actor exposes, so this measures the
// fight without changing what it measures.
//
// Usage: node tools/measure-boss-combat.mjs [dungeonId] [--god] [--budget=N]
//   Where a fight has a row in `ROUTE_ARENA` below, it is set up the way the
//   ROUTE arrives at it — the doorway, the hearts the route carries, and the
//   route's own settle — because a harness that fights a different fight from
//   the run cannot decide anything about the run. `--empty-arena` restores the
//   old middle-of-the-room setup, and `--settle=N` overrides the settle.
//   --god       god mode (unlimited health) instead of the real 3-heart
//               fight — use this to ask "does more health/time help?"
//               separately from "does the player survive?". Answered once
//               already: a 60000-frame god-mode Gohmaraq run never lands a
//               hit past 14 hp, proving that fight's ceiling is the verb's
//               positioning, not the player's survivability.
//   --budget=N  frames to give the ['boss', N] step (default 18000; a
//               god-mode run asking "does it EVER win" wants far more).
//               Raised from 9000 after D4 seed 3 read as "still alive after
//               9000 frames (never finished)" while taking ZERO damage the
//               entire time — not a losing fight, a slow-but-perfectly-safe
//               one: re-run at --budget=20000 it wins outright at frame
//               13220, 44 of 44, on only 14 of 24 quarter-hearts. 9000 was
//               never a fairness ceiling (nothing in this game times the
//               player out of a fight), just a convenience default sized to
//               the FAST fights — Wyverna's evasive-flight pattern on this
//               particular seed needed more clock than that to land enough
//               hits, and the old default silently reported that as a loss.
//   --tide=N    fight at tide level N (0 LOW, 1 MID, 2 HIGH) instead of the
//               boss's design tide. Asks "is this winnable when the player uses
//               the conch correctly?" — for a boss with no shell the design
//               tide can be the level the boss itself wants.
//   --qh=N      quarter-hearts to fight at. Defaults to the IN-ORDER count for
//               the dungeon (d1 12, d2 16 ... d6 32) — 3 starting hearts plus
//               one Heart Container per boss already beaten, counting no heart
//               pieces. Fighting D6 at 12 qh asks a question no player is ever
//               in; pass this explicitly only to binary-search a threshold.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { installRuntime } from './actor-runtime.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
// The seed. One seed is one sample, and a boss fight is a small deterministic
// simulation in which any change to the actor reshuffles the whole fight's
// timing — three sessions in a row have now mistaken a single seed's swing for
// a fix. `--seed=N` is how a change is shown to be a real improvement rather
// than a lucky reshuffle: sweep it.
const DEFAULT_SEED = 20260806;
const LOW = 0, MID = 1, HIGH = 2;

// Same fights and design tide as check-bosses.mjs's FIGHTS table (kept in
// sync by hand — see that file's own comment for why each tide is right).
const FIGHTS = {
  // `openRetreat`, as the route carries it since S137 (see the route's own
  // note at the Gohmaraq step).
  d1: { boss: 'gohmaraq', tide: LOW, opts: { openRetreat: true }, items: { sword: 1, conch: 1, anchor: 1 } },
  d2: { boss: 'anemos', tide: HIGH, items: { sword: 1, conch: 1, anchor: 1, lens: 1, bombs: 1 } },
  // LOW, not MID: MID is the tide Gloomtide WANTS (1.7x speed against 0.65x
  // everywhere else). See the long note in check-bosses.mjs's own table.
  // `clearAdds`: this fight is the one in the roster whose plan is to bury you
  // in summons, so the actor is told to cut them down — the same option the
  // route carries for it. Every other row leaves it off and is measured
  // exactly as it always was; see `dBoss`'s summons branch for the four fights
  // that measured WORSE with it on.
  // `openRetreat` is deliberately NOT here, so this row keeps matching the
  // route's. Pass `--open-retreat` to ask what it does. In the EMPTY arena
  // (`--empty-arena`) it looks like a clean win: 16/dead/5/8/19 becomes
  // 10/14/7/14/8, five in five. IN THE ROUTE'S ARENA, which is what this row
  // now sets up, it does not: 2 wins in 5 becomes 3 in 5, and seed 1 flips
  // from a win to a death. That is the same verdict the real run gave at S131,
  // arrived at in one fight's frames instead of the whole run's, which is what
  // this harness was rebuilt for.
  d3: { boss: 'gloomtide', tide: LOW, opts: { clearAdds: true },
        items: { sword: 1, conch: 1, anchor: 1, lens: 1, bombs: 1, cleats: 1 } },
  // sword 1, not 2: at D4 the player holds three Essences and the L2 blade's
  // cave wants four (`needEssences: 4`, src/data/caves.js). S113 caught the
  // same error in d3's row and named this one; d5 and d6 are correct, because
  // by then the cave is open.
  d4: { boss: 'wyverna', tide: LOW, items: { sword: 1, conch: 1, anchor: 1, lens: 1, bombs: 1, cleats: 1, bellows: 1 } },
  d5: { boss: 'rootmaw', tide: LOW, items: { sword: 2, conch: 1, anchor: 1, lens: 1, bombs: 1, reefseed: 1 } },
  // `breakPin`, as the route carries it since S144: 12 of 13 on the real
  // stream with it, 8 of 13 without. This rig reads 11 and 12 of 13.
  d6: { boss: 'nereth', tide: MID, opts: { breakPin: true }, items: { sword: 3, conch: 1, anchor: 1, lens: 1, bombs: 1, cleats: 2, bellows: 1, reefseed: 1, rod: 1, dredge: 1 } },
};

// The minibosses, which `FIGHTS` cannot hold because A MINIBOSS IS NOT
// `g.boss`. `defineBoss` builds both, but a miniboss's `init` clears `isBoss`
// (src/data/bosses.js says why: `progress.beaten` is keyed off the MAP, so a
// miniboss counted as a boss would mark its whole dungeon beaten). Two things
// follow, and both are why this needed its own table rather than a row in the
// one above:
//
//   - the target has to be NAMED — `['boss', N, 'clawcrab']` — because
//     `g.boss` is null in a miniboss arena;
//   - `progress.beaten` is never set, so it is NOT the ground truth for a win.
//     The fact to assert is the room's own puzzle flag: a `puzzle:
//     { enemies: true }` room sets its `flag` when the last enemy in it dies,
//     and that is what pays out the Piece of Heart.
//
// `room` is the arena, `qh` is what the ROUTE actually walks in holding, which
// for the Clawcrab is the cap — see the S129 ledger.
//
// S136: EVERY ROW BELOW NOW CARRIES ITS ROUTE ARENA TOO. `at`, `facing`, `qh`,
// `maxQh`, `settle` and `frame` mean exactly what they mean in `ROUTE_ARENA`,
// and a mini row that has an `at` IS its own route arena — see the `route`
// binding further down. Each is transcribed off `check-playthrough.mjs
// --trace`: the step that lands in the arena gives the frame, the step
// immediately before the `boss` directive gives the position and the health,
// and `settle` is the gap between the two. `items` was read out of
// `progress.items` at that same step rather than copied off the dungeon's
// boss row, because a miniboss is fought BEFORE its dungeon is finished and
// the two sets are not the same — the Reefguard has the Lens and no bombs.
const MINIS = {
  // RE-READ AT S137, after D2's rebuild at Oracle size. The FIELDS are the
  // current trace; the step numbers and frames quoted in the comments below
  // are the ones each row was first transcribed from, kept for the story.
  // d1 0,5,3, arena entered at step 132 (`exit down`) f13940, boss at f14081.
  // The Clawcrab is met on a FULL bar and that is as full as it goes there.
  clawcrab: { dungeon: 'd1', room: '0,5,3', flag: 'd1_clawcrab', tide: MID, qh: 12,
              items: { sword: 1, conch: 1, anchor: 1 },
              at: [112, 8], facing: 'down', maxQh: 12, settle: 141, frame: 13940 },
  // d2 1,4,2, step 308 (`hold up` through the door) f36606: `17,103 hp 15/20
  // tide 1 [reefguard+urchin]`. The boss directive begins the same frame, so
  // the settle is 0 — the route walks in and swings.
  reefguard: { dungeon: 'd2', room: '1,4,2', flag: 'd2_reefguard', tide: MID, qh: 20,
               items: { sword: 1, conch: 1, anchor: 1, lens: 1 },
               at: [47, 153], facing: 'up', maxQh: 20, settle: 0, frame: 49244 },
  // d3 0,2,2, step 477 (`travel` in by the west door) f72075: `7,79 hp
  // 21/28 tide 0 [bogmaw]`, and the boss step begins at once. S139: THE
  // ROUTE FIGHTS BOGMAW FOR THE FIRST TIME — the Kelp Locks are one way now
  // and the walk home comes back through this hall, so it is fought on the
  // way east from the Boss Key rather than skipped.
  bogmaw: { dungeon: 'd3', room: '0,2,2', flag: 'd3_bogmaw', tide: LOW, qh: 21,
            items: { sword: 1, conch: 1, anchor: 1, lens: 1, bombs: 1, cleats: 1 },
            opts: { openRetreat: true },
            at: [7, 79], facing: 'right', maxQh: 28, settle: 0, frame: 72075 },
  // d4 0,5,3, step 692 (`hold up`) f76801, boss at f76921: `47,95 hp 26/32
  // tide 2 [ironknight+keese]`. There is a keese in the room with him.
  // S140, after D4's rebuild at Oracle size: step 683 (`exit right` from the
  // Long Race) f105042: `7,81 hp 29/32 tide 2 [ironknight+keese]`, then
  // `wait 90`. He is met through the west door of a 30x11 gallery now.
  // S144, after the Spillway (S143): step 743 f112720, `7,79 hp 23/32`.
  ironknight: { dungeon: 'd4', room: '0,5,3', flag: 'd4_ironknight', tide: HIGH, qh: 23,
                items: { sword: 1, conch: 1, anchor: 1, lens: 1, bombs: 1, cleats: 1, bellows: 1 },
                at: [7, 79], facing: 'right', maxQh: 32, settle: 90, frame: 113587 },
  // S140, after D5's rebuild at Oracle size: step 927 (`hold right` in
  // through the west door of his room) f147504: `34,81 hp 30/40 tide 0
  // [thornvine]`. Straight in, no settle. S142, after the Shrine's west
  // wing: step 979 f152463, `38,81 hp 30/40`.
  // S144: step 1047 f160937, `38,81 hp 30/40`.
  thornvine: { dungeon: 'd5', room: '0,5,3', flag: 'd5_thornvine', tide: LOW, qh: 30,
               items: { sword: 2, conch: 1, anchor: 1, lens: 1, bombs: 1, cleats: 1,
                        bellows: 1, reefseed: 1 },
               at: [38, 81], facing: 'right', maxQh: 40, settle: 0, frame: 160937 },
  // d6 1,4,5, S142 at Oracle size: step 1294 (`travel`) f198171: `7,79 hp
  // 36/44 tide 0 [tideshade]`, after the east wing. NO CHARMS — the route does not put one on until step 1326,
  // two rooms later, so this is the last fight in the game fought bare.
  // S144: step 1414 f211618, `7,79 hp 36/44`.
  tideshade: { dungeon: 'd6', room: '1,4,5', flag: 'd6_tideshade', tide: LOW, qh: 36,
               items: { sword: 3, conch: 1, anchor: 1, lens: 1, bombs: 1, cleats: 1,
                        bellows: 1, reefseed: 1, kilnshell: 1, rod: 1, dredge: 1 },
               opts: { breakContact: true },
               at: [7, 79], facing: 'right', maxQh: 44, settle: 0, frame: 211618 },
  // d6 1,4,2, step 1390 (`equip`) f163176: `227,97 hp 25/44 tide 2
  // [brinehulk+beamos+keese]`. THE ONE ROW WHOSE FRAME IS NOT A ROOM ENTRY:
  // the Crossed Shafts are entered thousands of frames earlier and both
  // crossings are made with the colossus already awake, so the frame is the
  // instant the boss directive begins and the settle is nominal. He is fought
  // on the FAR ISLAND at HIGH, which is the only sea he can be hurt at, with
  // a beamos and a keese still in the room, and both charms on.
  // S142, the Keep at Oracle size with the far island widened: step 1364
  // (`tide` up, on the landing) f209346: `305,95 hp 46/48 tide 2`.
  // S144: step 1532 (`equip`) f222672, `305,95 hp 45/48 tide 2`.
  brinehulk: { dungeon: 'd6', room: '1,4,2', flag: 'd6_brinehulk', tide: HIGH, qh: 45,
               items: { sword: 3, conch: 1, anchor: 1, lens: 1, bombs: 1, cleats: 2,
                        bellows: 1, reefseed: 1, kilnshell: 1, rod: 1, dredge: 1 },
               charms: { mid: 'coilrope', high: 'gillcarve' },
               at: [305, 95], facing: 'right', maxQh: 48, settle: 8, frame: 222672 },
};

// THE FIGHT THE ROUTE ACTUALLY PLAYS.
//
// Everything above sets up a fight of this harness's own devising: the player
// in the middle of the room, on the in-order heart count, thirty frames after
// the room was built. The route's fight is a different one, and S131 spent
// itself proving that the difference is big enough to reverse a result —
// `openRetreat` wins Gloomtide five times in five here and loses him in the
// run.
//
// These rows are READ OFF THE ROUTE'S OWN TRACE (`node
// tools/check-playthrough.mjs --trace`, the directive immediately before the
// `boss` one), so they are a transcription, not a guess. Each records the
// state the route is in at the instant its boss step begins:
//
//   at        where the player is standing — the DOORWAY, not the middle
//   facing    the direction he walked in on
//   qh        the hearts he actually carries, which is not the in-order count
//   maxQh     his bar, which is not the same as what is in it
//   settle    frames the room ran before the boss step — the route's own
//             `wait`, during which the boss is already moving and summoning
//
//   frame     the CLOCK the route arrives on. Every animation phase in the
//             game is derived from `g.frame`, and this harness used to start
//             every fight at frame 0 — a phase no player is ever in.
//             MEASURED AND NEGATED: stamping the route's frame on the room
//             changes nothing. All ten runs of the five-seed sweep came out
//             bit-identical with it and without it. It is kept because it is
//             one more thing that no longer has to be argued about, and
//             because a future fight may not be so indifferent — but the
//             clock is NOT what makes this harness's fight different from the
//             run's, and that was worth a session finding out.
//
// ONE THING THIS STILL CANNOT REPRODUCE, and it is stated here rather than
// hidden: the route arrives having DRAWN sixty thousand frames' worth of the
// global RNG stream. The per-room stream is derived from the seed and the room
// (src/core/rng.js), so that half does match; the global one does not, short
// of replaying the whole run. A sweep here is a sweep of the route's ARENA and
// its CLOCK, not of its RNG history.
//
// `--empty-arena` restores the old middle-of-the-room setup, so the two can be
// put side by side.
const ROUTE_ARENA = {
  // Every row below is transcribed off `check-playthrough.mjs --trace`: the
  // step that LANDS in the boss room gives `at`, `facing`, `qh` and `frame`,
  // and `settle` is the gap to the next step — the frames the route spends
  // standing in the doorway with the boss already awake. `maxQh` is the bar,
  // not what is in it, and it is the one field a trace line does not print;
  // it was read out of `progress.maxHearts` at those same steps (S135).
  //
  // d1 0,3,1, trace step 206 (`exit up`) at f21285: `65,101 hp 16/16 tide 0
  // foes 1 [gohmaraq]`. The first boss in the game is met on a FULL bar, and
  // 16 is four quarter-hearts more than `IN_ORDER_QH` assumes, because the run
  // has already found four Pieces of Heart by then.
  //
  // S137: D1 IS AN ORACLE DUNGEON NOW (15x11 rooms). The route walks in
  // through the boss door in the south wall at step 201, f26522: `113,150 hp
  // 16/16 tide 0 [gohmaraq]`, and waits 90.
  d1: { at: [113, 150], facing: 'up', qh: 16, maxQh: 16, settle: 90, frame: 26522 },
  // S137: D2 IS AN ORACLE DUNGEON NOW. Walked in through the boss door at
  // step 353, f55424: `112,150 hp 24/24 tide 2 [anemos]`, then 90 + 216.
  // The rows below it were re-read from the same trace (every clock moved);
  // d3's settle is 150 now, re-swept (see the route).
  // d2 1,3,1, trace step 361 (`exit up`) at f41457: `64,101 hp 24/24 tide 2
  // foes 1 [anemos]`. Also full, also 8 above the in-order count, and the
  // settle is 306 frames because the route takes two `wait`s here, not one.
  d2: { at: [112, 150], facing: 'up', qh: 24, maxQh: 24, settle: 306, frame: 55424 },
  // d3 0,3,1, trace step 553 (`wait 90`) at f60233: `65,112 hp 24 tide 0
  // foes 1 [gloomtide]`. The bar is 32 by then — three Heart Containers and
  // the pieces the Sanctum pays out — so 24 of 32 is a player at three
  // quarters, not the 20 of 20 this file was fighting at.
  // CORRECTED AT S135: the bar is 28 here, not the 32 this row carried from
  // S133. Read out of `progress.maxHearts` at the step itself rather than
  // inferred from the Heart Containers the run had banked.
  // S139: D3 IS AN ORACLE DUNGEON NOW. Walked in through the boss door in
  // the Lock Gallery's north wall; the trace's `wait 150` (step 546) lands at
  // f78723: `111,160 hp 23/28 tide 0 [gloomtide]`.
  // S144, after the Sounding wing (S143): `111,160 hp 20/28` — four
  // quarter-hearts fewer, all of them the Eel Hall crab, crossed twice. The
  // route kills it on the way in now: the `wait` at step 593 ends f83797,
  // `111,160 hp 24/28`.
  d3: { at: [111, 160], facing: 'up', qh: 24, maxQh: 28, settle: 165, frame: 83632 },
  // d4 0,3,1, trace step 776 (`hold up` through the door) at f85158:
  // `63,99 hp 17/32 tide 0 foes 1 [wyverna]`. SEVENTEEN OF THIRTY-TWO — the
  // route meets the fourth boss on barely half a bar, and this file has been
  // fighting her on 24 of 24.
  // S140: D4 IS AN ORACLE DUNGEON NOW. Walked in through the boss door in
  // the Cistern Gate's north wall at step 727 (`hold up`), f110730: `113,149
  // hp 29/32 tide 0 [wyverna]`, then `wait 120`. The Crossed Sluices' plate
  // opens a shortcut straight to the Gate, so the walk to her no longer goes
  // five rooms round by the Long Race — and she is met on 29 of 32, not 17.
  // S144, after the Spillway (S143): step 796 f119395, `113,149 hp 23/32`.
  d4: { at: [113, 149], facing: 'up', qh: 23, maxQh: 32, settle: 120, frame: 119275 },
  // d5 0,3,1, trace step 1003 (`hold up` through the door) at f119421:
  // `65,99 hp 21/40 tide 0 foes 1 [rootmaw]`. Twenty-one of forty, against a
  // file that has been fighting Rootmaw on 28 of 28.
  // S140: D5 IS AN ORACLE DUNGEON NOW. Walked in through the boss door in
  // Rootmaw Arch's north wall at step 961 (`hold up`), f150199: `113,149 hp
  // 28/40 tide 0 [rootmaw]`, then `wait 120`.
  // S142, after the Shrine grew: step 1013 f155154, `113,149 hp 28/40`.
  // S144: step 1082 f163748, `113,149 hp 28/40`.
  d5: { at: [113, 149], facing: 'up', qh: 28, maxQh: 40, settle: 120, frame: 163628 },
  // d6 1,3,1, trace step 1423 (the throne-room `dialogue`) at f166238:
  // `63,101 hp 44 tide 1 foes 1 [nereth]`. The settle is 24 frames, not a
  // `wait`: the route opens Nereth's own dialogue on the way in, and that is
  // what the arena runs for before the fight starts.
  //
  // 44 of 48, NOT the 28 this row was transcribed at in S133. The Keep Gate's
  // north chamber holds a fairy now (S134) and it is behind the boss door, so
  // the run drinks it between the lock and the stair — which is the whole of
  // the difference between a King who wins three of five and one who loses
  // five of five. 48 is the cap and there is nothing past this room to heal
  // on, so this row is as high as the Keep can ever set it.
  //
  // `charms` is why this row needed a field the D3 one did not. The route
  // reaches this fight WEARING one — `coilrope` in the MID case, which is the
  // case this fight is played at — and no measurement of Nereth had ever had
  // it on. A charm is not an item and `setup.items` cannot grant one; see the
  // stamp below.
  // S142: THE KEEP IS AN ORACLE DUNGEON NOW, and the throne room is 1,3,0,
  // entered from the Stairhead through the boss door in its south wall:
  // step 1445 (`exit up`) f214007, `111,150 hp 48/48 tide 1 [nereth]` (with the
  // east wing in the route).
  // After the Shrine grew (S142): step 1501 f219836.
  // S144: step 1566 (`dialogue`) f227271.
  d6: { at: [111, 150], facing: 'up', qh: 48, maxQh: 48, settle: 24, frame: 227247,
        charms: { mid: 'coilrope', high: 'gillcarve' } },
};

const args = process.argv.slice(2);
const seedArg = args.find(a => a.startsWith('--seed='));
const SEED = seedArg ? Number(seedArg.slice('--seed='.length)) : DEFAULT_SEED;
// Where in the arena the fight starts. The default, 72,80, is the middle of a
// ONE-SCREEN room — and the Clawcrab Den is the one 2x1 room in the game, so
// 72,80 drops the player at its far west end and the whole fight is walked the
// length of the hall into the fire. The route arrives through the north door
// instead, and those are different fights: measured at S130, the same Clawcrab
// change read as a rout from 72,80 and as noise from the door. `--at=x,y` is
// how the second question gets asked.
const atArg = args.find(a => a.startsWith('--at='));
const AT = atArg ? atArg.slice('--at='.length).split(',').map(Number) : null;
const miniArg = args.find(a => a.startsWith('--mini='));
const MINI = miniArg ? miniArg.slice('--mini='.length) : null;
if (MINI && !MINIS[MINI]) {
  console.error(`unknown miniboss '${MINI}' — one of ${Object.keys(MINIS).join(', ')}`);
  process.exit(1);
}
const mini = MINI ? MINIS[MINI] : null;
const dungeonId = mini ? mini.dungeon : (args.find(a => !a.startsWith('--')) || 'd1');
const godMode = args.includes('--god');
// Turn off the actor's hazard-avoidance (`safe` in dBoss) and fight with the
// verb exactly as it was before it existed. Kept so the trade that shipped it
// — D1 unwinnable to won on every seed, D2/D3/D5 the other way — stays a thing
// anyone can re-measure rather than a paragraph in a handoff doc.
const noEvade = args.includes('--no-evade');
// Turn `dBoss`'s contact-chain guard on for this fight, on top of whatever the
// row above already carries. The guard is opt-in PER FIGHT (see `breakContact`
// in tools/actor-runtime.mjs for the measured reason), and until this flag
// existed the only way to ask "would this fight be steadier with it?" was to
// edit the route and run a hundred and seventy thousand frames — which is how
// S130 ended up unable to tell a real improvement from a downstream reshuffle.
// Asking it here costs one fight's frames and re-rolls nothing.
const breakContactFlag = args.includes('--break-contact');
// The same, for `dBoss`'s open-floor retreat. Same reason: ask the question in
// one fight's worth of frames instead of the whole run's.
const openRetreatFlag = args.includes('--open-retreat');
// And for `dBoss`'s pin guard (S144): walk away from a summon that just landed
// a touch.
const breakPinFlag = args.includes('--break-pin');
const budgetArg = args.find(a => a.startsWith('--budget='));
const BUDGET = budgetArg ? Number(budgetArg.slice('--budget='.length)) : 18000;

// The health a player clearing dungeons IN ORDER actually carries: 3 starting
// hearts plus one Heart Container per boss already beaten, in quarter-hearts.
// Measuring D6 at 12 qh asks a question no player is ever in — this table is
// the honest default, and `--qh=N` overrides it for a binary search.
// Deliberately counts NO heart pieces, so it is a conservative floor: the real
// route also collects 2 per dungeon plus 2 in the overworld caves.
const IN_ORDER_QH = { d1: 12, d2: 16, d3: 20, d4: 24, d5: 28, d6: 32 };
const qhArg = args.find(a => a.startsWith('--qh='));
// The tide to fight at. Defaults to the FIGHTS table above, which records each
// boss's DESIGN tide — the level its weak point opens at. For a boss with no
// shell that concept does not apply, and the table's entry can be the level the
// BOSS wants: Gloomtide moves at 1.7x at MID and 0.65x anywhere else, so
// measuring it at MID measures it at its strongest and calls the result unfair.
// A player's correct answer to that fight is the conch. This flag is how the
// question "is it winnable played correctly?" gets asked separately from "is it
// winnable at the design tide?".
const tideArg = args.find(a => a.startsWith('--tide='));
const fight = mini
  ? { boss: MINI, tide: mini.tide, items: mini.items, opts: mini.opts || null }
  : FIGHTS[dungeonId];
if (!fight) { console.error(`unknown dungeon '${dungeonId}' — one of ${Object.keys(FIGHTS).join(', ')}`); process.exit(1); }
// The route's own arena, for the fights that have a row above. On by default
// where one exists, because the route's fight is the fight that matters and a
// harness that quietly fights a different one is what cost S131 its result.
// `--empty-arena` asks the old question instead. A miniboss, an explicit
// `--at=` or `--qh=` opts out of the part it names.
const emptyArena = args.includes('--empty-arena');
// A mini row that carries an `at` is its own route arena, so the two kinds of
// fight are set up by one code path and cannot drift apart (S136). A mini
// without one falls back to the middle of the room, the way all of them did.
const route = emptyArena ? null
  : mini ? (mini.at ? mini : null)
  : (ROUTE_ARENA[dungeonId] || null);
const QH = qhArg ? Number(qhArg.slice('--qh='.length))
  : route ? route.qh : mini ? mini.qh : (IN_ORDER_QH[dungeonId] || 12);
// The BAR, which is not what is in it. `hearts` above is what the route
// carries; this is what the route could carry, and the two are only the same
// in a harness that invented both. A fairy or a heart drop mid-fight heals up
// to this, so a fight measured with the bar set to the carried count is a
// fight in which nothing can ever heal — which is not the route's fight.
const MAXQH = route && !qhArg ? route.maxQh : QH;
// Frames the arena runs before the actor engages. The route's is its own
// `wait` after walking through the door, and the boss is awake for all of it.
const settleArg = args.find(a => a.startsWith('--settle='));
const SETTLE = settleArg ? Number(settleArg.slice('--settle='.length))
  : route ? route.settle : 30;

let bossOpts = fight.opts || null;
if (breakContactFlag) bossOpts = { ...(bossOpts || {}), breakContact: true };
if (openRetreatFlag) bossOpts = { ...(bossOpts || {}), openRetreat: true };
if (breakPinFlag) bossOpts = { ...(bossOpts || {}), breakPin: true };

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png',
};
function serve(port) {
  const server = createServer(async (req, res) => {
    try {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (p.endsWith('/')) p += 'index.html';
      const full = join(ROOT, normalize(p).replace(/^(\.\.[/\\])+/, ''));
      const s = await stat(full).catch(() => null);
      if (!s || !s.isFile()) { res.writeHead(404).end('nf'); return; }
      res.writeHead(200, { 'Content-Type': MIME[extname(full)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(await readFile(full));
    } catch (e) { res.writeHead(500).end(String(e)); }
  });
  return new Promise(r => server.listen(port, () => r(server)));
}
async function loadPlaywright() {
  let mod;
  try { mod = await import('playwright'); }
  catch (e) {
    const { execSync } = await import('node:child_process');
    const root = execSync('npm root -g', { encoding: 'utf8' }).trim();
    mod = await import(join(root, 'playwright', 'index.js'));
  }
  return mod.chromium ? mod : mod.default;
}

const { chromium } = await loadPlaywright();
const PORT = 20000 + Math.floor(Math.random() * 20000);
const server = await serve(PORT);
let browser;
try { browser = await chromium.launch({ headless: true }); }
catch (e) { browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' }); }
const page = await browser.newPage({ viewport: { width: 800, height: 720 } });
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR: ' + (e.stack || e.message)));

await page.goto(`http://localhost:${PORT}/index.html?seed=${SEED}`, { waitUntil: 'load' });
await page.waitForFunction(() => !!window.__game && !!window.__harness, { timeout: 20000 });
await page.evaluate(installRuntime);
await page.evaluate(v => { window.__ACTOR_NO_EVADE = v; }, noEvade);

// Instrument every point of damage taken, without touching the actor: log
// amount, source shape, distance to the boss, and the boss's own tell state
// at that instant, purely from state `dBoss` itself already reads.
await page.evaluate(async () => {
  const mod = await import('/src/game/player.js');
  const orig = mod.Player.prototype.takeDamage;
  window.__dmgLog = [];
  mod.Player.prototype.takeDamage = function (game, amount, source, o) {
    const before = game.progress.hearts;
    const r = orig.call(this, game, amount, source, o);
    const after = game.progress.hearts;
    if (after !== before) {
      const b = game.boss;
      window.__dmgLog.push({
        f: game.frame, lost: before - after,
        isProjectile: !!(source && source.isProjectile), src: source ? source.type : null,
        dist: b ? Math.round(Math.abs(b.cx - this.cx) + Math.abs(b.cy - this.cy)) : null,
        weakOpen: b ? !!b.weakOpen : null, stun: b ? b.stun : null, charging: b ? !!b.charging : null,
        // WHERE THE PLAYER WAS STANDING, and how much room it had left to give.
        // `dist` alone cannot tell a hit taken in the open from one taken with
        // the back against a wall, and those are different faults with
        // different fixes: the first is the approach closing too far, the
        // second is `dBoss`'s post-swing retreat being silently fenced to
        // nothing. `edge` is the smallest gap to any of the four room edges,
        // in the same terms `dBoss`'s own `fence` uses (it strips a direction
        // at 12), so a run of hits at edge<=12 IS the retreat being refused.
        px: Math.round(this.cx), py: Math.round(this.cy),
        edge: game.room ? Math.round(Math.min(
          this.x, this.y, game.room.pw - 16 - this.x, game.room.ph - 16 - this.y)) : null,
      });
    }
    return r;
  };
});

const info = await page.evaluate(async (id) => {
  const { dungeons } = await import('/src/world/maps.js');
  const d = dungeons().find(x => x.id === id);
  return { room: d.dungeon.bossRoom, name: d.name };
}, dungeonId);
const arena = mini ? mini.room : info.room;
const [fl, rx, ry] = arena.split(',').map(Number);

console.log(`${dungeonId.toUpperCase()} ${info.name}: ${fight.boss} at ${arena}, tide ${fight.tide}`
  + (mini ? '  (MINIBOSS — ground truth is the room flag `' + mini.flag + '`)' : ''));
console.log(godMode
  ? `GOD MODE — unlimited health, budget ${BUDGET} frames, seed ${SEED} — asks "does more time/health help?", not "is this fair"\n`
  : `REAL COMBAT — no god mode, ${QH / 4} of ${MAXQH / 4} hearts (${QH} of ${MAXQH} quarter-hearts`
    + `${qhArg ? '' : route ? ", the route's own count" : ', the in-order count for ' + dungeonId.toUpperCase()}), `
    + `budget ${BUDGET} frames, seed ${SEED}`);
console.log(route
  ? `ARENA: the route's — enters at ${route.at[0]},${route.at[1]} facing ${route.facing}, `
    + `${SETTLE} frames of settle before the actor engages. `
    + `(--empty-arena for the old middle-of-the-room setup.)\n`
  : `ARENA: ${AT ? AT[0] + ',' + AT[1] : '72,80'}, ${SETTLE} frames of settle`
    + `${emptyArena && ROUTE_ARENA[dungeonId] ? '  — --empty-arena: NOT the fight the route plays' : ''}\n`);

await page.evaluate(([setup, steps]) => window.__rp.beginRecord(setup, steps), [{
  seed: SEED, godMode, items: fight.items, equipA: 'sword', equipB: 'conch',
  maxHearts: MAXQH, hearts: QH, tide: tideArg ? Number(tideArg.slice('--tide='.length)) : fight.tide,
  enter: [dungeonId, fl, rx, ry,
    AT ? AT[0] : route ? route.at[0] : 72,
    AT ? AT[1] : route ? route.at[1] : 80,
    route && !AT ? route.facing : 'up'],
}, [
  ['wait', SETTLE],
  ['boss', BUDGET, MINI, bossOpts],
  ['wait', 240],
]]);

// Stamp the route's clock on the room. `boot` zeroes `g.frame` deliberately —
// a replay must not depend on how long the page took to load — but the route
// is not at frame zero when it walks through that door, and every animation
// phase in the game is derived from this counter.
if (route && route.frame) {
  await page.evaluate(f => { window.__game.frame = f; }, route.frame);
}
// Put the route's charms on. `setup.items` cannot: a charm lives in
// `progress.charms` and a slotted one in `progress.charmSlots`, and neither is
// an item id. The run has worn one since S123 and no boss measurement ever
// had, which made every sweep in this file a fight the route does not play.
if (route && route.charms) {
  const slotted = await page.evaluate(async (want) => {
    const s = await import('/src/game/scrimshaw.js');
    const p = window.__game.progress;
    for (const slot of Object.keys(want)) {
      // The cases open on the ESSENCE count (`openCharmCases`), and this
      // harness boots a new game that holds none. The route is holding five
      // by the time it reaches a `ROUTE_ARENA` fight, so its cases are open —
      // open them here rather than silently failing to slot, which is what
      // happened to the HIGH case on the first run of this row.
      if (p.charmOpen) p.charmOpen[slot] = true;
      s.giveCharm(p, want[slot]);
      s.slotCharm(p, slot, 0, want[slot]);
    }
    return JSON.parse(JSON.stringify(p.charmSlots));
  }, route.charms);
  console.log(`charms worn, as the route wears them: ${JSON.stringify(slotted)}`);
}

let done = false, err = null, guard = 0;
let lastHp = null, lastQh = null;
let rosterAtStart = null, startedAt = null;
let peakFoes = 0, died = false;
const timeline = [];
while (!done && guard++ < Math.ceil(BUDGET / 20) + 400) {
  let r;
  try { r = await page.evaluate(n => window.__rp.pump(n), 20); }
  catch (e) { err = String(e.message || e).replace(/^page\.evaluate: /, '').split('\n')[0]; break; }
  done = r.done;
  if (r.error) { err = String(r.error); break; }
  const m = await page.evaluate(([id, miniName, miniFlag]) => {
    const g = window.__game;
    // A miniboss is not `g.boss` (null in its arena), so find it by name in
    // the room's own entity list — the same list `dBoss` targets.
    const live = miniName
      ? g.entities.find(e => e.type === miniName && !e.dead && !e.remove)
      : null;
    // THE NAMED TARGET, HELD BY REFERENCE (S137). A miniboss's win is the
    // miniboss dying, whatever else is still standing: the route's `boss`
    // directive names one target and does not clear the room, so the room's
    // puzzle flag (below) cannot be the verdict — a dead Reefguard beside a
    // live urchin read as "still alive after 18000 frames" for the whole of
    // S136. The find above loses the entity the frame it dies, so the first
    // one seen is kept and asked directly. A death rebuilds the room with
    // fresh entities and leaves this one alive at its last hp, so a respawn
    // can never read as a kill here — the fault S131 found in the route.
    if (miniName && live && !window.__miniRef) window.__miniRef = live;
    const ref = miniName ? window.__miniRef : null;
    const b = miniName ? (ref && !ref.dead && !ref.remove ? ref : null) : g.boss;
    const killed = !!(ref && (ref.dead || ref.remove || ref.hp <= 0));
    return {
      hp: b ? b.hp : (killed ? 0 : null), dead: b ? b.dead : (killed ? true : null),
      killed, deaths: g.progress ? g.progress.deaths : 0,
      roomFlag: miniFlag ? !!(g.progress && g.progress.flags && g.progress.flags[miniFlag]) : null,
      // GROUND TRUTH, and the whole reason this line exists. `g.boss` goes NULL
      // once the entity is removed, so `b.dead` reads null on a KILL and the
      // outcome fell through to "still alive after N frames (never finished)".
      // Wyverna and Rootmaw were both being reported as unfinished fights that
      // the actor had in fact won outright — the inverse of T39: there, "the
      // enemy is gone" was wrongly read as a victory; here it was wrongly read
      // as a failure. Either way the fix is the same and T38 already said it:
      // assert the positive fact, and `progress.beaten` is that fact.
      // `progress.beaten` is keyed off the MAP and a miniboss never sets it,
      // so a miniboss's win is its room's `puzzle.flag` instead — the same
      // fact that pays out the Piece of Heart.
      // For a miniboss this is now the KILL; the flag rides alongside as
      // `roomFlag` and the summary says which of the two happened.
      beaten: miniFlag
        ? killed
        : !!(g.progress && g.progress.beaten && g.progress.beaten[id]),
      qh: g.progress ? g.progress.hearts : null, frame: g.frame,
      // WHO ELSE IS IN THE ROOM. The claim that cost S131 its result was that
      // the route's arena "still has a zol in it" and this one does not; the
      // only way that stops being an argument is for the harness to say out
      // loud what it is fighting, every run.
      foes: g.entities.filter(e => e.isEnemy && !e.dead && !e.remove).map(e => e.type).sort(),
      px: g.player ? Math.round(g.player.cx) : null, py: g.player ? Math.round(g.player.cy) : null,
    };
  }, [dungeonId, MINI, mini ? mini.flag : null]);
  if (rosterAtStart === null && m.frame >= (route && route.frame ? route.frame : 0) + SETTLE) {
    rosterAtStart = m.foes; startedAt = [m.px, m.py, m.frame, m.qh];
  }
  if (m.hp !== lastHp || m.qh !== lastQh) { timeline.push(m); lastHp = m.hp; lastQh = m.qh; }
  if (m.foes.length > peakFoes) peakFoes = m.foes.length;
  if (m.deaths > 0) { died = true; timeline.push(m); break; }
  if (m.beaten) {
    timeline.push(m);
    // A miniboss's room flag pays out when the LAST enemy dies, which may be
    // some frames after the named one. Keep pumping briefly so a fight that
    // does clear the room is reported as having done so, rather than racing
    // the flag; stop early the moment it lands.
    //
    // And the fight is not over the frame the target dies: a projectile it
    // threw is still in the air. Tideshade's last shot lands seven frames
    // after its death on every seed — three quarter-hearts the old loop,
    // which ran on until the flag, counted and a stop-at-the-kill would not.
    // So both kinds of fight run 60 more frames and the health is read after.
    for (let k = 0; k < (mini ? 30 : 3); k++) {
      const r2 = await page.evaluate(n => window.__rp.pump(n), 20);
      const s2 = await page.evaluate(fl => ({
        f: fl ? !!window.__game.progress.flags[fl] : false,
        qh: window.__game.progress.hearts, deaths: window.__game.progress.deaths,
        frame: window.__game.frame }), mini ? mini.flag : null);
      if (s2.deaths > 0) { died = true; break; }
      if (s2.f) m.roomFlag = true;
      if (k >= 2) { m.qh = s2.qh; m.frame = s2.frame; }
      if ((k >= 2 && (!mini || m.roomFlag)) || r2.done) break;
    }
    break;
  }
  if (m.qh === 0 || m.dead) break;
}

if (rosterAtStart) {
  console.log(`the arena the actor engages, at frame ${startedAt[2]}: `
    + `player ${startedAt[0]},${startedAt[1]} on ${startedAt[3]} quarter-hearts, `
    + `in the room [${rosterAtStart.join(', ')}]\n`);
}
console.log('timeline (boss.hp / player quarter-hearts, on change):');
for (const t of timeline) console.log(`  f=${t.frame}  boss.hp=${t.hp}  dead=${t.dead}  player.qh=${t.qh}`);
if (err) console.log(`\ndid not finish: ${err}`);

const dmgLog = await page.evaluate(() => window.__dmgLog);
console.log('\ndamage taken by the player, in order:');
for (const d of dmgLog) console.log('  ' + JSON.stringify(d));

const final = timeline[timeline.length - 1] || {};
const startHp = timeline[0] ? timeline[0].hp : null;
const won = !died && !!(final.beaten || final.dead);
// The last hp anyone actually saw. A killed boss's entity is gone by the final
// sample, so reading `final.hp` alone printed "? of 44" for a flawless win.
const lastSeenHp = won ? 0 : [...timeline].reverse().find(t => t.hp != null)?.hp;
console.log('\n=== SUMMARY ===');
console.log(`outcome: ${won ? (mini ? 'MINIBOSS DIED — the actor won this fight' : 'BOSS DIED — the actor won this fight')
  : died || final.qh === 0 ? 'PLAYER DIED' : `still alive after ${BUDGET} frames (never finished)`}`);
// Which of the two a miniboss fight did, said out loud: the named target dying
// is the win, and the room flag is the room — only the second pays the piece.
if (mini) console.log(`room flag \`${mini.flag}\`: ${final.roomFlag ? 'SET — the room was cleared too'
  : won ? 'NOT set — the miniboss died and something else in the room is still alive' : 'not set'}`);
console.log(`boss damage dealt: ${startHp != null && lastSeenHp != null ? startHp - lastSeenHp : '?'} of ${startHp}`);
console.log(`player damage taken: ${dmgLog.reduce((s, d) => s + d.lost, 0)} quarter-hearts, in ${dmgLog.length} hits`
  + ` (${dmgLog.filter(d => d.isProjectile).length} projectile, ${dmgLog.filter(d => !d.isProjectile).length} contact)`);
console.log(`frames: ${final.frame}`);
console.log(`most foes alive at once during the fight: ${peakFoes}`
  + ` (the arena started with ${rosterAtStart ? rosterAtStart.length : '?'})`);
if (won) console.log(`player finished on ${final.qh} of ${QH} quarter-hearts`);
// One line per run, so a five-seed sweep can be read without assembling it
// by hand the way S136 had to.
console.log(`RESULT ${MINI || dungeonId} seed=${SEED} ${route ? 'arena=route' : 'arena=empty'} `
  + `${won ? 'WIN qh=' + final.qh : died || final.qh === 0 ? 'DEAD' : 'UNFINISHED'}`
  + `${mini ? ' flag=' + (final.roomFlag ? 1 : 0) : ''} dealt=${startHp != null && lastSeenHp != null ? startHp - lastSeenHp : '?'}/${startHp}`);
if (errs.length) console.log('page errors: ' + errs.slice(0, 3).join(' | '));

await browser.close(); server.close();
process.exit(0);
