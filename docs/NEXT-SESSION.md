# Prompt for the next session

Paste the fenced block below into a fresh Claude Code session on this repo. It
is written to be self-contained: it names the branch, the remaining jobs, the
traps that are already paid for, and how to prove the work rather than assert
it.

Keep this file updated as work lands — it is the cheapest thing in the repo to
maintain and the most expensive thing to not have.

---

## What the last session did (P4: grid-locked enemy motion)

**P4 landed out of order. P2 and P3 are still outstanding** — the flaky tide
assertion has not been root-caused, positions are still floats, `WALK_SPEED` is
still 1.35 and diagonals are still normalised. Nothing in P4 depended on them
and nothing in it blocks them.

- **The 8px lattice.** A ground enemy no longer has a velocity. It stands on a
  lattice point, decides, and takes a whole `ENEMY_GRID_STEP` step which runs to
  its end; nothing turns it mid-step and nothing draws from the room's stream
  mid-step. `wander` now commits to `ENEMY_DECIDE_STEPS` (3) whole steps and
  then draws a direction — a fixed cadence, not a per-frame coin flip.
  `chase`, `flee` and `patrol` remake their choice at lattice points and
  nowhere else. `hop` is a lattice step with a parabola fitted between its two
  endpoints, so the landing pixel and the landing frame are both known when the
  hop starts (it used to integrate a velocity against a gravity constant and
  land wherever that came out).
- **`bounceDiag`, `orbit` and `charge` are untouched and continuous**, as the
  brief asked. So are bosses, minibosses, fliers and aquatic enemies —
  `gridLocked()` says who is on the lattice and why.
- **Knockback is a scripted displacement.** Fixed distance, fixed frame count,
  constant speed, no decay, for the player, enemies and bosses alike. The
  `KNOCK_*` constants changed **units**: px/f before, total px now. Both
  numbers for all three cases are tabulated in `docs/FEEL-SPEC.md`.
- **`tools/check-motion.mjs`** — spawns one of every enemy in an emptied room
  (one pass dry, one wet), runs 600 deterministic frames, and asserts every
  lattice enemy is 8px-aligned on every frame it is not mid-step, mid-charge,
  mid-knockback or submerged. It also asserts the converse, that fliers and
  swimmers *do* leave the lattice, so a change that quietly grid-locks
  everything fails too. 8/8.
- Three call-site fixes the lattice exposed: the pincer's lunge was reeled home
  by a proportional lerp that never quite arrived (it is two lattice steps out
  and two back now), a split zol spawned its gels 9px apart onto a shifted
  lattice, and a resurfacing leever came up wherever the angle put it.

Both replays were re-recorded and pass to the pixel. Every other checker is
green.

### What it cost, and what is weak

The lattice makes enemies harder to juke — a committed step cannot be
deflected. That is the design. But `replay.mjs`'s recording actor cannot read a
commitment the way a human does, so it takes roughly 60% more contact damage
through Tidewash Grotto and, on three hearts, dies in the Crab Pit.
`d1-descent`'s plan now starts it on five hearts with a comment saying why.
**That is a statement about the actor, not a difficulty decision** — if P9
re-tunes difficulty, do not treat the five hearts as evidence of anything.

Two latent actor bugs had to be fixed at the same time, both written up in
HANDOFF: `dFight` chased the last foe out through a doorway and carried on
fighting in the next room, and `dExit` stopped pressing while the player was
still on the seam, so the next directive bounced straight back.

Not done, and worth knowing: nobody has watched this in motion. Every claim
above is from checkers. The lattice is the kind of change whose whole point is
how it *looks*, and `ENEMY_DECIDE_STEPS = 3` in particular is a taste number
that has never been seen on screen.

---

## What the session before that did (P1: feel spec, seeded RNG, replay harness)

Landed in full:

- **`src/data/feel.js`** — every timing and speed constant in the game, each
  with a unit and a provenance tag. The module-level constants are gone from
  `player.js`, `entity.js`, `game.js`, the enemy toolkit, `tide.js`,
  `projectile.js`, `objects.js` and `effects.js`; they all import now.
  **Nothing is tagged `measured`.** Everything carried over from the old code
  is `guessed`, and says so.
- **`docs/FEEL-SPEC.md`** — why the file exists, what the three provenance
  tags mean, how to earn a `measured`, and the three constants that are known
  wrong on purpose (`DIAGONAL_FACTOR`, the two knockback decays,
  `ENEMY_TURN_CHANCE`) with the prompt that fixes each.
- **`src/core/rng.js`** — mulberry32. One global stream seeded from
  `progress.seed`, plus `game.rng`, a per-room stream derived from the save
  seed and the room's identity and rebuilt on every room entry, so a room
  replays identically. All 23 `Math.random` call sites under `src/` are gone —
  the brief said 20; the count in the tree was 23, across seven files.
- **`tools/test.mjs`** — greps `src/` for `Math.random` and fails. Runs before
  the browser starts, strips comments first so it does not flag its own
  documentation. Verified by injecting a `Math.random` and watching it fire.
- **`tools/replay.mjs` + `tools/replays/`** — records a seed plus a flat list
  of per-frame button masks to JSON, replays it headlessly, and asserts the
  final position by **exact float equality** plus a checkpoint every 60 frames
  that names the first frame of any divergence. Two replays are committed.
  Verified by injecting a `Math.random` into NPC wander and watching the draw
  count diverge at frame 120 while the position still matched — which is
  precisely why the draw counters are asserted.

Both replays pass. So do all six pre-existing checkers.

### What P1 did NOT land, and what it would take

**The second replay is `d1-descent`, not a full D1 clear.** It is a real run:
eleven room entries, 21 kills, a chest opened, the Dungeon Map taken, a Small
Key earned by clearing the crab room and spent on a locked door, the conch
cycled all the way round, ending on 5 of 12 quarter-hearts in room `0,3,3`.
4036 frames. It stops at the locked door in `3,3`'s north wall.

(P4 re-recorded it: same route, same ending room, 4218 frames, and it now
starts on 20 quarter-hearts rather than 12 — see the P4 section above for why.
Everything below is unchanged.)

It stops there because the recording actor has three verbs — walk, open, swing
— and everything past that door needs more:

1. **A `push` directive.** The second Small Key is in `0,4,4`, whose puzzle is
   push-blocks onto floor switches. `tryPushBlock` needs the player to lean on
   a block for `PUSH_DELAY_FRAMES`, and a block moves exactly one tile ever
   (see the traps list). This is the single highest-value addition: it unlocks
   the rest of the spine.
2. **A miniboss and a boss routine.** The Clawcrab is in `0,5,2`; Gohmaraq has
   `shell: true` and is only vulnerable during its `open` windows, so the
   standoff swordsman in `replay.mjs` will swing into a blocked shell forever.
   It needs to read `e.weakOpen`.
3. **Roc's Feather.** The Boss Key in `0,3,2` is behind a feather gap, so the
   actor needs a jump verb and the big chest in `0,4,2` first.

Do **not** shortcut this by granting keys, the feather and the Boss Key in the
replay's `setup` block. The setup block states a world state, which is fine,
but a "full D1 clear" that skipped every puzzle would be a replay that proves
determinism while lying about what it is. Either teach the actor the verbs or
keep the honest name.

### A content bug found on the way

`d1` room `0,4,5`'s Compass is uncollectable. `Game.openChest` spawns the
pickup one tile above the chest with no check that the tile is standable, and
that tile is a pot. Measured, written up in `docs/HANDOFF.md`. Left unfixed —
it is dungeon content and P8 re-authors D1.

---

```
Continue building "Oracle of Tides", a GBC-style Zelda fan game.

`main` is trunk. Branch from it. One prompt = one session = one branch.

Read, in this order:
  CLAUDE.md              - the hard rules. They are hard rules.
  docs/EXECUTION-PLAN.md - the roadmap. P0 and P1 are done; P2 is next.
  docs/FEEL-SPEC.md      - what every timing constant means and how sure we are
  docs/HANDOFF.md        - current state, environment setup, and every trap
                           already paid for. Read the environment section
                           FIRST: Playwright needs a symlink shim before any
                           headless harness will run, and `pip install pillow`
                           before any rip-*.py tool will.
  docs/GAME-PLAN.md      - regions, dungeons, items, bosses
  docs/ART-DIRECTION.md  - binding for anything visual
  docs/briefs/AGENTS.md  - authoring spec per work area, sections A-J

ENVIRONMENT, before anything else. Playwright asks for a browser revision the
pre-installed Chromium does not match, so every headless harness dies with
"Executable doesn't exist" until you shim it. The exact commands are in
HANDOFF under "Environment setup a fresh container needs" — check the revision
number in the error message. It has been 1234 every time so far, and the
installed one has been 1194.

Confirm the baseline before changing anything, and keep every line below green:
  node tools/validate.mjs                      clean (two expected warnings
                                               about fx_slash_d0/fx_slash_d1)
  node tools/test.mjs                          36/36, 0 unauthored art names
  node tools/replay.mjs                         8/8, both replays to the pixel
  node tools/walk-dungeons.mjs                 27/27, 88 ledge runs
  node tools/check-overworld.mjs               16/16, all three gates
  node tools/check-gates.mjs                   15/15, both item gates in-engine
  node tools/check-motion.mjs                   8/8, enemies on the 8px lattice
  node tools/solve-switches.mjs                17 rooms, one push per block
  node tools/scan-sprites.mjs --strict         0 hard findings
  npm run build                                48 modules -> one HTML file
  node tools/check-build.mjs                   the built file boots from file://

EVERY SESSION ENDS BY RUNNING `npm run build` AND COMMITTING
dist/oracle-of-tides.html. That file is the playable game — one self-contained
HTML document that runs from a file:// URL with no server and no network, on a
phone as well as a desktop. A commit that changes src/ and leaves the build
stale ships a game that is not the game. See CLAUDE.md, Workflow.

THE BUILD - what it assumes, and what breaks it
  tools/build.mjs is a bundler, so it hard-fails rather than guessing:
  - It refuses to build if the game ever starts loading something at runtime
    (fetch, XMLHttpRequest, new Image/Audio, createImageBitmap, WebSocket, an
    .png/.wav/.json reference, an <img>/<audio>/<link src=>). The whole
    single-file trick rests on the game being procedural sprites plus WebAudio
    synthesis. If you add a real asset, the build tells you instead of shipping
    a file that 404s from file://. Teach it to embed the asset as a data: URI;
    do not delete the guard. It scans code with comments and string literals
    blanked out, so provenance comments naming .png sheets and room-grid
    strings that happen to spell "ogg" do not trip it, and `new Audio()` is
    allowed in src/core/audio.js because that module declares its own
    `class Audio`.
  - It understands exactly one import form, `import { … } from './x.js'`, and
    the export forms already in use (`export const/let/var/function/class` and
    `export { A as B }`). No default export, no `export *`, no re-export, no
    dynamic import, no multi-declarator `export const A = 1, B = 2`. Any of
    those is a build error naming the file and line. THIS BINDS src/data/feel.js
    IN PARTICULAR: it is a long list of single-declarator `export const`s and
    must stay that way — collapsing two constants onto one line would publish
    only half of them, silently.
  - IT REFUSES IMPORT CYCLES. Imports become destructuring from an eagerly
    evaluated module, so a cycle would snapshot `undefined`. src/core/rng.js
    and src/data/feel.js import nothing, which is deliberate — they sit at the
    bottom of the graph precisely because everything else imports them.
  - src/data/sprite-manifest.js is not reachable from main.js, so it is not
    bundled and the build says so. That is correct — it is tooling data.
  - The output must stay a CLASSIC script. A `<script type="module">`, even
    inline with no imports, is fetched with an opaque origin and blocked by
    file:// in every browser. That constraint is the reason for the whole
    module-registry design; do not "simplify" it back to a module.

DETERMINISM IS NOW LOAD-BEARING. Two rules, both easy to break by accident:

  - Never call Math.random() in src/. One global stream seeded from the save
    plus a per-room derived stream, both in src/core/rng.js. test.mjs greps
    for violations and fails.
  - Nothing in a DRAW path may consume randomness. draw() runs at display
    rate, update() runs at a fixed 60 Hz step, so a draw-time draw from a
    stream advances it a different number of times on a slow machine and the
    run silently desyncs. Use noise1/noise2 from rng.js — pure hashes that
    consume no state. The screen shake is the worked example.

EVERY TIMING AND SPEED CONSTANT LIVES IN src/data/feel.js. No module-level
`const WALK_SPEED = ...` anywhere else. Each export carries a unit and a
provenance comment: measured, derived, or guessed. NOTHING is currently
`measured` — every value was carried over from the old code and is a guess.
Never upgrade a `guessed` to `measured` because the game feels fine; that word
means someone frame-stepped a reference and wrote the number down.

FOR ANYTHING AT ALL: `npm run build && node tools/check-build.mjs`, then
commit the rebuilt dist/oracle-of-tides.html. A green src/ with a stale build
is a red session.

AFTER ANY CHANGE TO A FEEL CONSTANT OR TO MOVEMENT/COMBAT:
  node tools/replay.mjs                 expect it to FAIL
  node tools/replay.mjs --record-all    re-baseline
  ...and commit the new replays in the same change as the constant. A feel
  change that leaves stale replays behind is one nobody can review.
  If a movement constant changes and every replay still passes, either the
  constant is dead code or the replays do not exercise it. Both matter.

NEXT UP: P2 (root-cause the intermittent test) and P3 (fixed-point movement
and the sword-hold), in docs/EXECUTION-PLAN.md. P4 has landed ahead of both;
neither is blocked by it. P1 gave P2 the tool it needs: a fixed seed and a
deterministic stepper, so "run the assertion 200 times" is now a thing you can
actually do. Use plan mode for P3 and P5.

P3 TOUCHES THE LATTICE. Moving positions to 8.8 fixed point has to keep
`beginStep`/`advanceStep` in src/game/enemy.js landing exactly on multiples of
ENEMY_GRID_STEP — they round a fraction of the whole step to a pixel rather
than accumulating a velocity, precisely so the last frame lands on the lattice
however the arithmetic rounds. node tools/check-motion.mjs is what tells you if
that survived.

Do the work yourself rather than spawning subagents - past sessions hit usage
limits that way and lost the work.

Tell me plainly what is done, what is weak, and what you skipped.
```

---

## What is already done — do not redo any of this

- engine, renderer, tide system, save/load, menus, cutscene runner
- the 120-screen overworld and all 8 dungeons (303 rooms, all solvable)
- 56 enemy sprites and a 22-type enemy roster
- all 16 boss and miniboss fights (`src/data/bosses.js`), verified beatable
- every effect, pickup, object, projectile and item icon
- the whole story: 20 dialogue ids, 15 cutscenes, all verified to terminate
- all 49 boss and miniboss sprites; `scan-sprites --strict` is 0 hard findings
- music: 22 tracks (14 looping + 8 jingles), every name resolves
- one-way ledges in all four cardinals: 88 runs, all verified in-engine
- all three tile-expressible region gates, proved in both directions
- **the single-file build.** `npm run build` flattens `index.html` plus every
  module reachable from `src/main.js` into `dist/oracle-of-tides.html` — one
  classic `<script>`, playable from a `file://` URL with no server and no
  network. That file is committed and must be rebuilt at the end of every
  session. `tools/check-build.mjs` boots it from a real `file://` URL and fails
  on a console error, an off-document request, a black canvas or a frozen
  `game.frame`.
- **the feel spec, the seeded RNG and the replay harness (P1)**
- **grid-locked enemy motion and scripted knockback (P4)**

## What is left

P2, P3, then P5 through P9 in `docs/EXECUTION-PLAN.md` — P4 is done, out of
order. Plus, carried over:

1. **More terrain.** Nine tiles are extracted; cliff, cliffTop, tree, bush,
   rock, flowers, stump and palm are still hand-drawn. HANDOFF records three
   findings from a session spent on this — read them first. Short version:
   there IS a scan that finds structured terrain (repeats at +16 in x and NOT
   in y), it returns no natural cliff face on the overworld sheet, and the
   sheet's props are 16x32 against the game's 16x16.
2. **Water is still hand-drawn** and stays that way until someone finds a
   second animation frame: both terrain sheets are static maps, not tile
   palettes.
3. **A full-D1-clear replay**, per the section above.
4. **A checker for chests whose pickup lands on a solid tile** — see the
   Compass bug in HANDOFF.

## Traps that pass every validator

These are in HANDOFF in full. The short list, because each one cost a session:

- A push block moves exactly one tile, ever (`once: true` by default).
- An open dialogue freezes every entity while `mode` is still 'play'. This is
  also what stalled the first D1 replay recording for 2000 frames; every
  waiting directive in `tools/replay.mjs` now taps through one.
- An explicit palette at a draw site overrides a sprite's own.
- A solid tile is never hit by a projectile's own rect.
- An entity dropped from `game.entities` must be marked `remove` first.
- A gate tile sits inside a screen, not on its boundary row.
- `>` and `<` ledge runs are COLUMNS, not rows. A lip is solid from three
  sides, so a run across a corridor strands rooms and still validates — use
  `find-ledges.mjs` rather than placing by eye.
- Digits 0–9 in a room grid are always tide tiles.

## Engine-API details a harness gets wrong on the first try

- `main.js` publishes `window.__game` and `window.__harness`. Everything else
  a harness needs comes out of the live module graph with a dynamic import
  from inside the page; there are worked examples in every committed harness.
- `window.__harness.takeOver()` stops the wall-clock loop stepping the game;
  `step(n)` then advances exactly n fixed updates. That is how `replay.mjs`
  gets a deterministic clock. `release()` hands it back.
- `enterMap` is `(mapId, FLOOR, rx, ry, px, py, dir)` — floor is the second
  argument, and passing `rx` there silently lands you in the wrong room.
- MAPS is a Map keyed by map id, holding room definitions under `roomDefs`,
  whose grids are under `map`. Cutscenes export as `STORY_CUTSCENES`.
- Equipped items are `progress.equipB` / `progress.equipA`; `giveItem` comes
  from `src/game/progress.js`. `progress.seed` is the root of every random
  decision the run makes — `newProgress(name, seed)` pins it.
- After `room.setTile` you must call `room.invalidate()`.
- Keys are KeyZ = B and KeyX = A (`src/core/input.js`), Enter = START.
- `game.tryPushBlock(tx, ty, dx, dy)` takes the BLOCK's tile, not the player's.
- Reset `g.mode` to 'play' and refill hearts between probes, or the first room
  that kills a parked player drops the run into gameover.
- Park probes on CLEAR floor.
