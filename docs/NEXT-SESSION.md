# Prompt for the next session

Paste the fenced block below into a fresh Claude Code session on this repo. It
is written to be self-contained: it names the branch, the remaining jobs, the
traps that are already paid for, and how to prove the work rather than assert
it.

Keep this file updated as work lands — it is the cheapest thing in the repo to
maintain and the most expensive thing to not have.

---

## What the last session did (P2: root-cause the intermittent test)

`tools/test.mjs` intermittently failed "all three tide levels reachable".
HANDOFF blamed load flakiness because it passed on re-run and the failing
commits touched only sprite and audio data. That was wrong, and the paragraph
saying it has been deleted.

**What was actually happening.** `hold(key, n)` did not hold a key for n game
frames. It dispatched keydown, waited for n frames to elapse, then dispatched
keyup — while `main.js`'s wall-clock loop kept stepping the game throughout
every CDP round trip in between. So the real hold was n frames *plus* however
long the machine took to answer, and on a busy box Link walked roughly twice
as far as the test intended. He ended up standing on the village child (`npc_child`,
Tidewatch Village tile 8,4) instead of back in the middle of the square. A is
the context button before it is the item button, so `x` talked to the child
instead of sounding the conch; `Game.update` then returns early for as long as
a text box is up, so the press produced no tide change and later presses only
fed the box. `seen.size` came out 2. Which asset file the commit touched was
coincidence — `newProgress()` seeds from `Date.now()`, so *every* run was
already playing a different world.

Reproduced by modelling the round-trip latency against the fixed-step driver:
at 30 seeds x 61 latencies, 63 runs opened a text box during the conch section
and 2 came out with `size=2, tides=[1,1,1,2,2]` — the observed failure exactly.

**What changed.**

- `tools/test.mjs` takes the clock with `window.__harness.takeOver()` and steps
  with `step(n)`, the same driver `replay.mjs` uses. Real Playwright key events
  are kept — `keyboard.down` resolves once the event is in the page and nothing
  steps until the test says so — so every hold and tap now lasts exactly the
  number of updates it says on any machine.
- The save seed is pinned. `?seed=N` sets `Game.seedOverride`, which `newGame`
  falls back to; `test.mjs` passes `--seed=` (default 20260806). Play is
  unaffected and still seeds from the clock.
- The conch section stands Link somewhere known first, and two new assertions
  name the failure if a villager ever eats the press again.
- The gap between conch presses went from 64 frames to 80. The real lock-out is
  69 (the sweep, during which the player's own timers stall, plus
  `CONCH_FRAMES`), so the old gap sat *inside* it and half those presses were
  being swallowed even on an idle machine.

**A game bug found on the way.** `Game.update` called `this.tide.update()`
twice on every frame of a sweep — once at the top of play mode and again inside
the `if (this.tide.busy)` guard. The wave front therefore crossed in 23 frames
while `TIDE_SWEEP_FRAMES` said 44, so the constant described nothing. The
second call is gone and the constant is 23, which is what the game has always
looked like: the number moved to match the screen, not the other way round.
Both replays — including `d1-descent`, which cycles the conch — still pass to
the pixel, which is the proof that the wipe is unchanged.

**Verified**: the assertion 200/200 under six-way CPU load, one single distinct
outcome; `test.mjs` 38/38; `replay.mjs` 8/8 to the pixel; every other checker
green; the build rebuilt and `check-build` clean.

No retry was added anywhere.

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
  docs/EXECUTION-PLAN.md - the roadmap. P0, P1 and P2 are done; P3 is next.
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
  node tools/test.mjs                          38/38, 0 unauthored art names
  node tools/replay.mjs                         8/8, both replays to the pixel
  node tools/walk-dungeons.mjs                 27/27, 88 ledge runs
  node tools/check-overworld.mjs               16/16, all three gates
  node tools/check-gates.mjs                   15/15, both item gates in-engine
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

TEST HARNESSES OWN THE CLOCK. main.js steps the game a variable number of
times per animation frame, so a harness that fires a key and then counts frames
holds that key for as long as its own round trips take. test.mjs and replay.mjs
both call window.__harness.takeOver() and step(n) instead, and test.mjs pins the
save seed with ?seed=. If you write a new harness, do both — otherwise it is
measuring the machine, not the game. test.mjs is no longer load-flaky; a
failure there is now yours.

NEXT UP: P3 (fixed-point movement and the sword-hold), in
docs/EXECUTION-PLAN.md. P2 is done — the write-up above says what the flaky
test actually was. Use plan mode for P3 and P5.

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
- **a deterministic `test.mjs` (P2)** — it takes the clock off the wall-clock
  loop and pins the save seed, so it no longer flakes under load

## What is left

P2 through P9 in `docs/EXECUTION-PLAN.md`, in that order. Plus, carried over:

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
