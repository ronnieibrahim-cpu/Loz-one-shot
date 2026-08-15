# Handoff — Oracle of Tides

State of the project as of this handoff, and what a fresh session needs to know.

## Where things stand

Branch: **`claude/oracle-tides-polish-aqche8`** — the single canonical branch.
It continues `claude/oracle-tides-polish-grjnhj`, which is now behind it.
Everything is committed and pushed.

Earlier branches (`claude/zelda-style-game-piqt8v`,
`claude/zelda-boss-behavior-jgbfwo`, `claude/oracle-tides-boss-music-4c24tm`)
are the line this was built on and are all behind it, not parallel work.
`main` is an empty README.

**The engine is complete and verified.** `node tools/test.mjs` boots the game in
headless Chromium and passes 35 assertions covering boot, movement, sword
combat, contact damage, the tide, room transitions, cave warps, the pause menu,
save/load round-tripping, death and respawn. Keep it green.

**`node tools/validate.mjs` is clean** — no problems, only warnings for the
sprite packs still to be drawn.

| Area | State |
|---|---|
| Engine, renderer, audio, save, menus, cutscene runner | Done |
| Tide system and tide-variant tiles | Done |
| Player, combat, items, enemy framework, boss framework | Done |
| Link sprites | Done — extracted from the Oracle of Ages sheet |
| NPC sprites (9 of 11) | Done — extracted from the Oracle of Seasons sheet |
| Terrain tiles, HUD | Done — hand-drawn |
| **Enemy sprites (56)** | **Done** — extracted from the Oracle of Seasons enemy sheet |
| **Enemy roster (22 types)** | **Done** — `src/data/enemies.js` |
| **Overworld** | **Done — all 120 screens** |
| **Dungeons 1-8** | **Done — 179 rooms, all solvable** |
| **Effects + item icons (83)** | **Done** — hand-drawn |
| **Pickups, objects, projectiles (37)** | **Done** — hand-drawn |
| **Boss/miniboss behaviour (16)** | **Done** — `src/data/bosses.js` |
| **Story and dialogue** | **Done** — 20 ids, 15 cutscenes |
| **Boss/miniboss art (49)** | **Done** — redrawn by hand |
| **Music (22 tracks)** | **Done** — 14 looping + 8 jingles, two dungeon themes wired |
| **Dungeon room puzzles** | **Done** — every room now has something in it |
| **Small Key economy** | **Done** — keys equal locks in all eight dungeons |
| **Marsh gate on Bombs** | **Done** — `cliffCracked`, both entrances |
| **Terrain art (9 tiles)** | **Done** — extracted, `tools/rip-terrain.py` |
| **One-way ledges** | **Done** — 88 runs, all four cardinals, 36 tile variants |
| **Region gates (5 of 9)** | **Done** — Bombs, Boomerang, Gloves, Feather, Bracelet |
| **Terrain art (10 tiles)** | **Done** — 9 ground + `flowers`, `tools/rip-terrain.py` |
| **itemGet / secret / heartPiece** | **Done** — wired to their moments |
| **Single-file build** | **Done** — `npm run build` → `dist/oracle-of-tides.html`, runs from `file://` |

### Five region gates are now machine-checkable

`check-overworld.mjs` proves five of the nine GAME-PLAN gates in both
directions, and `check-gates.mjs` proves four of them in-engine with a live
player. Roc's Feather (`chasm`, Coral Reef) and the Power Bracelet (`boulder`,
Cliffs of Kell) were added this session.

**Zora's Flippers and the Hookshot were built and reverted.** Both are recorded
under "The two gates that cannot be tiles" below; neither is a placement
problem and neither should be retried without reading that section first.

### Region gates and ledges are done

All three tile-expressible region gates match GAME-PLAN.md, and one-way ledges
face all four cardinals with 88 runs placed. Two engine bugs surfaced doing it —
a projectile's rect never touching the solid tile it bounced off, and a dangling
`player.boomerang` that disabled the item for the rest of a run — both recorded
under "Hard-won lessons" and both now covered by `tools/check-gates.mjs`.

### The game is now completable end to end

The blocker is gone: all sixteen bosses and minibosses are implemented and
verified beatable. `node tools/test.mjs` reports **0 unauthored art names**,
down from 17. What is left is polish — boss art and music — not structure.

## The two documents that matter

- **`docs/GAME-PLAN.md`** — authoritative. Region layout on the 12x10 overworld
  grid, all eight dungeons with their map ids, items, bosses, minibosses,
  overworld entrance screens and tide themes, the item progression table, and
  the damage/HP numbers. Content that disagrees with this is wrong.
- **`docs/ART-DIRECTION.md`** — binding for anything visual. Declares
  `assets/sheets/` the canonical art reference, gives the style rules measured
  from those sheets, and sets the rule: extract when a sheet has it, draw to
  match when it does not. New assets are held to the same standard as extracted
  ones.
- **`docs/briefs/AGENTS.md`** — a complete authoring spec per work area,
  sections A through J. Each section names the one file to edit and how to
  verify. Section J documents the sprite-sheet extraction workflow.
- **`docs/NEXT-SESSION.md`** — a ready-to-paste prompt for a fresh session,
  naming the branch, the two remaining jobs and how to prove them. Start there
  if you are picking this up cold, and keep it current as work lands.

## Tooling

```sh
npm run dev                          # play it at localhost:8080
node tools/validate.mjs              # structural checks, no browser
node tools/validate.mjs --strict     # also fail on unauthored sprites
node tools/validate.mjs --pack=enemies   # scope the sprite-coverage check
node tools/test.mjs --shots          # 35 assertions + screenshots
node tools/preview.mjs enemies --scale=6  # contact sheet of a sprite pack
node tools/scan-sprites.mjs --skip-bosses # rows split or floating off the body
python3 tools/rip-enemies.py         # regenerate src/data/sprites-enemies.js
python3 tools/rip-terrain.py         # regenerate src/data/tiles-terrain.js
node tools/preview.mjs --tiles --scale=2  # contact sheet of every tile
node tools/walk-dungeons.mjs         # every dungeon room + every ledge
node tools/check-overworld.mjs       # seams, border, tile-by-tile flood
node tools/check-overworld.mjs --bombs   # ...and the Marsh gate
node tools/solve-switches.mjs        # one push per block, every switch room
node tools/check-gates.mjs           # the two item gates, in-engine
node tools/find-ledges.mjs           # where a ledge can go without walling a room
node tools/check-overworld.mjs --items=bombs,boomerang,magnet
node tools/replay.mjs                # both committed replays, to the pixel
node tools/replay.mjs --record-all   # re-baseline them after a feel change
node tools/replay.mjs --shots        # ...and screenshot the final frame
```

`test.mjs` and `preview.mjs` take `--shot-dir=` and pick a random port, so
several can run at once.

**`test.mjs` used to be timing-flaky under CPU load. It is not any more, and a
failure is now yours.** It used to count frames with `requestAnimationFrame`
while `main.js`'s wall-clock loop kept stepping the game underneath, so
`hold(key, 30)` held the key for 30 frames *plus* every CDP round trip in
between; on a busy box Link walked roughly twice as far as the test thought,
and taps landed in whatever state that put him in. That produced the familiar
spurious cluster in "contact damage lands", "menu opens" and the save tab.

It now takes the clock off the loop with `window.__harness.takeOver()` — the
same fixed-step driver `tools/replay.mjs` uses — and pins the save seed with
`?seed=`, so every hold and tap lasts exactly the number of updates it says and
every run plays the same world. Do not go back to re-running it until it
passes; if it fails twice, it failed once.

### Environment setup a fresh container needs

1. `npm install`.
2. Playwright ships a browser revision the pre-installed Chromium does not
   match, so `tools/test.mjs` fails with "Executable doesn't exist". Point the
   expected path at the installed shell rather than downloading a browser:
   ```sh
   cd /opt/pw-browsers
   V=$(ls -d chromium_headless_shell-* | grep -v 1234 | head -1)
   mkdir -p chromium_headless_shell-1234/chrome-headless-shell-linux64
   for f in $V/chrome-linux/*; do
     ln -sf "/opt/pw-browsers/$f" "chromium_headless_shell-1234/chrome-headless-shell-linux64/$(basename $f)"
   done
   ln -sf /opt/pw-browsers/$V/chrome-linux/headless_shell \
     chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell
   touch chromium_headless_shell-1234/{INSTALLATION_COMPLETE,DEPENDENCIES_VALIDATED}
   ```
   (Check the revision `playwright` actually asks for in the error message; it
   was 1234 the first three times.) A headful `chromium.launch()` — which
   `check-build.mjs` uses, because a canvas assertion wants a real browser —
   needs the same shim for the full browser as well:
   ```sh
   mkdir -p /opt/pw-browsers/chromium-1234
   ln -sfn /opt/pw-browsers/chromium-1194/chrome-linux /opt/pw-browsers/chromium-1234/chrome-linux
   touch /opt/pw-browsers/chromium-1234/{INSTALLATION_COMPLETE,DEPENDENCIES_VALIDATED}
   ```
   `check-build.mjs` also falls back to `$CHROMIUM_PATH` or
   `/opt/pw-browsers/chromium` on its own if the launch throws, so it runs on an
   unshimmed container; the other harnesses do not, and still need the shim.
3. `pip install pillow` if you are going to run any of the `rip-*.py` tools.
   `rip-terrain.py` needs only Pillow; the scratch script that *finds* its
   source rectangles used numpy, but it is not committed and the tool does not
   import it.

## Determinism, feel constants and replays

`src/data/feel.js` is the single source of every timing and speed constant, and
`src/core/rng.js` is the single source of randomness. `docs/FEEL-SPEC.md` is
the why. Three things about them that are cheap to get wrong:

**Nothing in `feel.js` is `measured`.** Most values are guesses carried over
from the code as it stood and are labelled `guessed`. P3 turned a handful
`derived` — the walk speed and everything hanging off it, the room exit margin,
the jump arc — which means *computed from a stated constraint, with the
arithmetic in the comment*, not *checked against a reference*. `measured` means
someone frame-stepped a recording. It is not a synonym for "we like it". Do not
upgrade a tag because the game feels fine.

**Positions are 8.8 fixed-point** (`src/core/fixed.js`). `fx`/`fy`/`fz` are
integer subpixel accumulators; `x`/`y`/`z` are derived integer pixels. Assigning
`e.x = 40` is fine and goes through the accessor. `e.x += 0.5` is not — it
reads whole pixels, so a sub-pixel step rounds to nothing every frame and the
entity never moves. Add to `fx` or go through `moveEntity`, which takes
**subpixels**. Data-facing helpers convert px/f at their edge; see FEEL-SPEC.

**Nothing in a draw path may consume randomness.** `Game.draw` runs at display
rate; `Game.update` runs at a fixed 60 Hz step. A stream drawn from inside
`draw` advances a different number of times on a slow machine and the run
silently desyncs — no error, no warning, just two runs that disagree. The
screen shake was exactly this and now uses `noise1`, a pure hash of the frame
counter that consumes nothing. Any future draw-time jitter must do the same.

**`every(e, n)` hashes the entity id; it does not draw from a stream.** An
enemy asked both `every(e, 30)` and `every(e, 90)` would otherwise take its
phase from whichever call happened to run first, which depends on AI branch
order and is not stable. Same reasoning applies to anything else that wants a
stable per-entity constant.

**A new game seeds itself from `Date.now()`.** `newProgress()` defaults its
seed to the wall clock, which is right for play and useless for any tool that
needs the same world twice — P1's determinism stops at the front door unless
something pins it. `?seed=N` in the URL now does; `Game.seedOverride` carries
it, and `tools/test.mjs` passes it on every run. If you write a new harness,
pass the seed or you are testing a different game each time.

**A browser harness must own the clock, not count frames.** `main.js` steps the
game a variable number of times per animation frame, so a harness that fires a
key and then waits n frames holds that key for n frames *plus* however long its
own round trips took. That is a hidden multiplier on every movement in the
test, and it scales with how busy the machine is. `window.__harness.takeOver()`
exists for exactly this and both `replay.mjs` and `test.mjs` now use it. Real
Playwright key events are still fine — `keyboard.down` resolves once the event
is in the page, and nothing steps until you say so.

## Hard-won lessons — do not rediscover these

**The towns (PT), and the five things they cost.**

1. **A CHECKER THAT GRANTS SWIMMING CANNOT SEE A TOWN BREAK.** `check-towns.mjs`
   was written with the overworld checker's flood, which treats deep water as
   passable because the player eventually owns the Cleats. Under it, three of
   the four town screens passed. They were all severed at HIGH: the tide pool
   closes the middle of a screen and the buildings close the rest, and the only
   remaining route was a swim the player of that hour cannot make. One line —
   adding `F.DEEP` to the impassable mask — turned every one of them red. A
   town is walked, not swum, and the flood has to say so.

2. **A 10x8 SCREEN WITH TWO 3x3 BUILDINGS HAS EXACTLY ONE CORRIDOR.** Four
   layouts of Tidewatch died before this was believed. Buildings at rows 2-4
   leave the west seam column reachable only along row 5; put a 2x2 well or a
   3x2 stump in row 5-6 and the west half of the village is a pocket, or the
   east half is, or the door is. Nothing renders wrong. The rule that fell out
   of it: **the row the buildings do not occupy belongs to the road**, and only
   1x1 dressing goes in it.

3. **A DOORWAY IS `F.SOLID` WITH `mask: 0`, and a checker that reads the flag
   calls it a wall.** That is the pattern `caveMouth` has carried since the
   first cave — solid so nothing spawns in it or is thrown through it, mask 0 so
   the player's feet may enter — and every flood in the repo tests
   `flags & F.SOLID`. Read the mask, or every town reports a shop nobody can
   enter in a village that plays perfectly.

4. **CHECKERS THAT READ A ROOM AS CHARACTERS GO BLIND THE DAY A BLOCK LANDS.**
   `check-overworld.mjs` resolved a legend character to a tile: one character,
   one tile, anywhere. A block breaks that — nine H's are nine different tiles —
   and `getTileDef('block:bShop')` returns the empty tile, whose flags are 0, so
   the flood walked straight through the shop and reported 17/17. It now builds
   every screen and reads `room.baseName`, which is the engine's own answer. Any
   tool that reads `def.map[y][x]` through a legend has the same hole.

5. **AN NPC IS NOT MOVED BY MOVING THE GROUND.** Rebuilding the village put the
   scrimshander inside a house, the digger inside the shop and a crab inside a
   well, and all of it validated. `check-towns.mjs` asserts every entity in a
   town screen stands somewhere it could stand at some tide level. The same pass
   found a rupee that had been sitting inside a post on Driftwood Strand since
   long before this session.

   And the same class of thing bit the harness: `progress.pos` put a new game at
   72,64, which the rebuilt village turned into the alley between two buildings,
   so three movement tests in `test.mjs` failed for the honest reason that the
   world had moved under their probes. The start position is 72,72 now — the
   middle of the square, facing the shopfront — and the probes were moved to
   match, not the buildings.

**The Drowned Wood Shrine (P8/D5), and the four things it cost.**

1. **A COUNTED ITEM ARRIVED WITH AN EMPTY POUCH, AND EVERY CHECKER STAYED
   GREEN.** The rule that a Reefseed, a bomb or a bottle comes with something in
   it lived inside `Game.openChest` and nowhere else. `progress.giveItem` — the
   function a giver NPC, a cutscene, a debug grant and every test harness calls
   — recorded the item and left `maxReefseeds` at 0, so the inventory showed a
   perfectly good Reefseed and the B button played the deny sound for ever.
   `check-items.mjs` never saw it because its Reefseed section sets the counts by
   hand on the way past, which is exactly the shape of workaround that hides a
   bug for the life of a project. What found it was a REPLAY: a recorded run in
   which Link threw a seed that did not exist, swam past the tile he was meant to
   have built, and replayed deterministically and identically for ever. The rule
   is in `giveItem` now. **If you add a counted item, put its capacity there.**

2. **A SOLID TILE TWO SQUARES AWAY DOES NOT BLOCK A THROW, IT CATCHES IT.** The
   drowned bole was placed to stop a seed reaching a stake, which it does from
   distance 1. From distance 2 it does the opposite: the seed flies over the
   square between, is stopped by the bole, and plants on that square — which was
   the stake. Every grove in the Shrine is laid out around this. The rule is that
   the two solids (the bole and the snarl) must be OPPOSITE each other across
   the stake, with water on one perpendicular side and a `0` sump on the other,
   and any other arrangement gives the room a second answer.

3. **THE PLAYER CAN PUT A SOLID TILE WHERE NO AUTHOR PUT ONE.** A coral pillar
   is permanent and is `coralWall` at MID. So CLAUDE.md's "a solid tile can
   strand a room" trap has a version of itself that no amount of care in a room
   grid prevents, because the trowel is in the player's hands. `check-reefseed.mjs`
   enumerates every tile a seed can come to rest on and asserts that a pillar
   there still leaves the room's doorways joined at SOME sea — some, not all,
   because the conch is always available and a room that is walled at MID and
   open at LOW has cost a button press rather than a save.

4. **A WHOLE SESSION'S DESIGN CAN BE STRUCTURALLY IMPOSSIBLE, AND THE PROOF IS
   TWO SENTENCES.** The groves were first built as push-block crossings: a block
   cannot enter deep water (`PushBlock.push` asks `canOccupy` with
   `swim: false`), so a pillar is the only road across, and the pillar is only
   floor at LOW. It cannot be made tide-bound. The player pushing a block INTO a
   stake is always standing exactly two tiles from that stake with a non-solid
   square — the block's own tile — between them, so the seed can always be thrown
   from the square the push is made from and the room falls to a fixed LOW. No
   geometry fixes it. Write the two-sentence argument out before drawing rooms.

**The Cliffside Cistern (P8/D4), and the six things it cost.**

1. **A FOOTPRINT IS NOT A LINE OF SIGHT.** `Tide.covers` was pure geometry, so
   the Bellows' cone reached through walls: a wheel sealed in an alcove could
   be turned by a player standing on the far side of two walls facing roughly at
   it, and the drained wedge was drawn inside masonry. Nothing failed — the room
   simply had a second answer nobody had authored. `Tide.blows` is the fix, and
   the thing to know if you touch it is that **the line-of-sight walk must
   resolve tiles at the BASE level, never through the field**, because the field
   is what the call is in the middle of computing and asking it again does not
   terminate.

2. **A CHECKER THAT IS MORE CAPABLE THAN THE PLAYER FAILS HONEST ROOMS.** The
   first cut of `check-bellows.mjs` modelled the hop as "clear anything that is
   not solid", which is what `check-cleats.mjs` does. `Player.tryGapHop` clears
   `F.JUMPABLE` and nothing else, and `dPit` is not JUMPABLE — so the harness
   hopped the pit trenches that every sill in the dungeon is built on, and three
   rooms failed for a reason that was entirely in the tool. Copying a flood from
   another prover copies its approximations with it.

3. **A ROOM SCRIPT'S REWARD IS INVISIBLE TO EVERY SWEEP IN `walk-dungeons.mjs`.**
   It counts keys from entity tuples and from `puzzle.reward.spawn`, and a key
   spawned by `script.onEvent` is none of those. Declare it (`bellowsRoom.gives`)
   and teach the counter, or the dungeon is walked believing it has two keys for
   three locks — and the failure surfaces as an unrelated room reading stranded.

4. **A PUSHED BLOCK MOVES ONE TILE, EVER.** `solve-switches.mjs` says so in its
   header and it is easy to design past: a puzzle whose block needs three shoves
   to reach its plate is unsolvable in the engine and the tool is right to fail
   it. Seat every block one tile from the plate it is meant to hold down.

5. **A SCRIPT-SPAWNED REWARD EXISTS ONLY IN THE FRAME IT WAS RELEASED IN.** A
   room script that spawns a key when its wheel comes round has released that
   key exactly once, forever: the wheel is open afterwards, so the event never
   fires again, and walking out without picking it up loses the key with
   nothing left that can produce another. Every checker in the repo calls that
   a solved dungeon, because they all reason about a room rather than about
   leaving one. `checkPuzzle` already handles the puzzle-reward version of this
   — it re-applies the reward silently when it sees the flag on entry — and a
   script has to do the same thing by hand, in `onEnter`, guarded by a
   `saveKey` on the pickup so a collected reward does not come back. Verified
   live for both of D4's, in all four directions (spawns, survives leaving,
   does not duplicate, does not return once taken); `check-bellows.mjs` now
   fails any sill that `gives` something without an `onEnter`.

6. **A VALVE WROTE ITS SAVE FLAG AND NOTHING EVER READ IT.** `TideValve.interact`
   has set `progress.flags[saveKey]` since the day it was written, and no code
   path restored it — so a wheel you turned was shut again when you re-entered
   the room, while the door it opened stayed open because a persisted TILE is a
   different mechanism. The room was solved and the fixture in it was lying
   about how. Same shape as `liftLevel` and the Anchor's dropped `src`: the
   write end of a pair of features shipped and the read end never did.

**The Bogwater Sanctum (P8/D3), and the four things it cost.**

1. **AN ITEM WHOSE POSSESSION IS THE GATE CANNOT BE PROVED BY REACHABILITY.**
   The Cleats make every deep tile in the game passable, so "this room requires
   the Cleats" is true of any room with water in it and worth nothing. Two days
   of dungeon design can be spent before that lands. The way out is to find the
   axis INSIDE the item — here the two modes — and prove that: *the surface
   route does not get there and the floor route does.* It is provable only
   because the difference is DATA (`push` is applied while swimming and not
   while sunk), which is worth checking for D4-D6 before designing a room.

2. **ONE TILE OF ANYTHING IS NOT A BARRIER.** The base moveset hops 2.29 tiles,
   so a single pit, a single gap and a single ledge are all crossable — a
   one-tile drain in a torrent's sill was the first version of D2's fork trap
   and `check-lens.mjs` failed it immediately. Three tiles is the first width
   that holds. This is now true in two dungeons and will be true in the next
   four.

3. **`cleatMode` WAS A DEAD FLAG.** `toggleCleats` on dry land set it, said
   "you will walk under the next water you meet", and nothing ever read it
   again: entering deep water always started you swimming. Every deep room
   before D3 plays the same either way, which is why it survived. A dungeon
   about choosing your layer before you commit is where a promise the engine
   does not keep starts costing hearts. `Player.updateTerrain` now dives on
   entry when the soles are set.

4. **A REPLAY THAT DRIVES AN ITEM MUST KNOW WHETHER THE ITEM SPEAKS.**
   `toggleCleats` on land opens a text box; in deep water it does not. An open
   box freezes every entity while `mode` is still `'play'`, so the first cut of
   `d3-undertow` held LEFT for two hundred and sixty frames with the player
   standing still behind a dialogue, and read exactly like "the current is
   stronger than sink mode". Toggling in the water instead avoids the box
   entirely, and that is what the committed plan does.

**A FINISHED DUNGEON CAN SIT ON AN UNMERGED BRANCH AND BE BUILT A SECOND TIME.**
This one cost most of a session and it cost it twice over. D2 was re-authored
around the Lens, proved by a new checker, replayed, documented and committed —
on `claude/p8-dungeon-generation-faqood`, which was never merged. `main` still
carried the pre-P8 Coral Spire, and `NEXT-SESSION.md` and `EXECUTION-PLAN.md` on
`main` still said "D2 outstanding", because the session that finished D2 updated
them on its own branch. A later session read `main`, believed it, and rebuilt
the whole dungeon from scratch with a different primitive before anyone noticed.

Nothing was broken. Both dungeons worked and both were proved. The defect is
that **the record of what exists lived in a branch nobody thought to look at**,
and every document in the repo is written on the assumption that the last
session's work is on trunk.

Three things came out of it, and all three are cheap:

- `docs/DUNGEON-STATUS.md` is the board, and a dungeon is done only when that
  table says so AND NAMES THE COMMIT. A status sentence with no commit behind it
  is a claim, not a record.
- `git ls-remote --heads origin` before starting a dungeon. Branch names in this
  repo carry the work (`p8-dungeon-generation-*`), so the duplicate was visible
  in one command from the start.
- When two branches hold the same work, take the more complete one wholesale —
  `git revert` your own, then cherry-pick theirs — rather than merging two
  rewrites of the same rooms. Both versions of D2 replaced the entire dungeon;
  a merge would have produced a conflict in every room and a dungeon that was
  neither design.

**The Lens forks (P8/D2), and the four things they cost.**

1. **A CHECKER'S FLOOD IS ONLY AS GOOD AS ITS MOVEMENT VERBS, AND
   `walk-dungeons.mjs` DID NOT HAVE LEDGE HOPS.** Its flood knows how to walk,
   how to clear a one-tile gap, how to spend a key and how to take a warp — and
   treated `F.LEDGE` as a wall, because until D2 no ledge in the game was the
   ONLY way into anywhere. D2's forks are entered by dropping off a lip you
   cannot climb back up, and eight rooms came out "stranded" in a dungeon that
   walks perfectly in the engine. The fix is thirty lines and it is the same
   model `Player.tryLedgeHop` uses (into the FACE of the ledge only, clearing
   the run behind it, landing on a standable tile), which is the point: a
   checker that models the engine's moves catches things, and one that models a
   subset of them invents failures. **If you add a movement verb to the player,
   add it to the flood in the same commit.**

2. **`tideForce` HAD NEVER BEEN USED, and it is the reason the Lens can be
   required at all.** It has been in `Tide.applyRoomRules` and in
   `docs/briefs/AGENTS.md` from the beginning and no room had ever declared it.
   Without it there is no way to build a room the Lens is needed in: the player
   sounds the conch, looks at the room at the next level with their own eyes,
   sounds it back, and walks in knowing. **An informational item can only be
   required in a room where the information cannot be bought some other way**,
   and in this engine that means a room that refuses the conch. A later session
   that finds a pinned room heavy-handed and unpins it will make both of D2's
   forks decorative and no checker except `check-lens.mjs` will notice.

3. **THREE TILES THAT ARE THE SAME TILE BEAT THREE TILES THAT LOOK ALIKE.** The
   forks work because `dDrain` at LOW, `dSump` at LOW and `dPit` at every level
   all resolve to the SAME tile name — `dPit` — rather than to three similar
   ones. That is what lets `check-lens.mjs` assert indistinguishability by
   comparing tile names instead of comparing pixels, and it is what makes the
   claim true rather than approximately true. A screenshot confirmed it: all
   three throats sample to exactly (14, 15, 34).

4. **AND THEN THE PREVIEW OF THEM IS ALSO THREE DARK BLUES.** The same property
   that makes the fork provable makes it hard to read: `dWaterS`, `dWaterD` and
   `dPit` are three dark blues, so the Lens's ghost separates them by 4-6 RGB
   units. Raising `LENS_GHOST_ALPHA` from 0.55 to 0.80 helped and did not solve
   it. **The lesson is the order of operations**: the room was proved by a
   checker and then LOOKED AT, and the looking is what found the real problem.
   The full measurement and three candidate fixes are in `docs/ART-BACKLOG.md`.

**The charm cases used to open on a conversation nobody had to have.**
`checkUnlocks` was called from `Scrimshander.interact` and nowhere else, so
`CHARM_LOW_ESSENCES = 2` — the Coral Spire's own essence — landed on a player
with no reason to walk back to Tidewatch. Every checker was green the whole
time, because the charm system worked perfectly and simply was not switched on.
`openCharmCases` now fires from `Game.claimEssence` and the scrimshander is the
acknowledgement rather than the gate. **A progression flag that only a
conversation can set is a progression flag some saves will never get.**


**Multi-screen rooms (P7.6), and the five things they cost.**

1. **A ROOM'S KEY IS ITS TOP-LEFT CELL, AND THE CELLS IT SPANS HAVE NO
   `roomDef`.** This is the thing the plan did not anticipate and it is
   structural, not cosmetic. `hasRoom(mapId, f, x, y)` used to be
   `!!roomDefs['f,x,y']`, and with a 2x1 room at `0,5,3` the cell `0,6,3` is
   part of that room and has no def of its own. Every cell lookup — a seam, a
   warp destination, the minimap — has to resolve through an OCCUPANCY index
   (`roomKeyAt` in `world/maps.js`) or a player walking west into the far half
   of a wide room finds a hole and nothing at all happens. `getRoom` and
   `hasRoom` now both go through it, so the fix is invisible to callers, and
   `validate.mjs` fails if a room is keyed inside another room's footprint.

2. **THE SEAM ARITHMETIC IS `rx + sw`, NOT `rx + 1`, AND THE PERPENDICULAR AXIS
   IS A GLOBAL COORDINATE.** `checkRoomExit` computed the neighbour as
   `room.rx + d[0]`; a 2x1 room's east neighbour is two cells over, and which
   room is NORTH of it depends on which of its two screens the player is
   standing in. Likewise `entryPos` preserved `p.y` across a transition, which
   is only right when both rooms are keyed to the same row. Both now work in the
   map's global screen grid (`rx * VIEW_W + p.x`), which reduces to the old
   expression exactly when the two rooms share a cell — every transition the
   game has today, which is why no replay moved.

3. **THE TRANSITION SLIDE IS IN SCREEN SPACE AND NEEDS BOTH CAMERAS UP FRONT.**
   The outgoing room is snapshotted as a screen window with its camera offset
   baked in; the incoming room is a whole-room canvas that has to be blitted back
   by the camera it will ARRIVE under. So `camTo` is computed when the transition
   is created, not discovered when it lands, and the player's room-space target
   absorbs `camFrom - camTo` because he is drawn relative to the outgoing window
   for the whole slide. Get one of those three terms wrong and the player jumps a
   screen's width on the last frame of every transition — in a 1x1 room all three
   are 0, so nothing catches it until the first wide room.

4. **THE TIDE SWEEP'S SNAPSHOT IS ROOM-SIZED, NOT SCREEN-SIZED.** `Tide.setLevel`
   captured the room into a 160x128 offscreen and `drawSweep` ran the wave front
   across `VIEW_W`. In a 320px room that crops the snapshot at the halfway point
   and the wipe stops halfway. Both are now `room.pw`/`room.ph`, which is
   byte-identical at 1x1. A side effect worth knowing: the front crosses the
   whole ROOM in `TIDE_SWEEP_FRAMES`, so in a wide room it moves across the
   screen faster. That is the right behaviour — the wipe is an event in the
   room — but it means a screenshot tool has to settle for 23 frames, not 8.

5. **A LOCKED DOOR THAT NEVER LOCKED ANYTHING, AND THE SECOND FAULT THAT WAS
   HIDING BEHIND IT.** This is the one to read twice, because two bugs each
   concealed the other and the pair survived every checker in the repo.

   `0,5,3`'s door at `(2,3)` could be walked round via row 2 — in the original
   1x1 grid as much as in the 2x1 one, verified against the pre-conversion data.
   So Small Key 3 bought nothing and the Piece of Heart behind the door was
   free. `walk-dungeons.mjs` structurally cannot see that: it spends a key on
   any lock it can reach and then asks only whether every room came out
   reachable, so **a lock with a way round it is indistinguishable from a lock
   that got opened.**

   Sealing the door then failed the dungeon walker with `0,4,3` unreachable —
   because D1 has three locks and the walker could only count TWO keys. The
   third is a `{ pickup: 'key' }` chest, and the counter knew only
   `{ item: 'key' }`. Both are real forms: `Game.openChest` grants `item:` and
   spawns `pickup:`. The undercount had been harmless for as long as one of the
   three locks was bypassable, so the flood never asked for the key it could not
   count.

   **The lesson is about the shape of the failure, not the room.** Two defects
   in different files, each of which made the other invisible, in a dungeon that
   was green on ten checkers. Neither is findable by reading; the first was
   found by walking the room with a camera, and the second by fixing the first.

   Both are now closed, and `walk-dungeons.mjs` has a new assertion —
   **every `dDoorLocked`/`dDoorBoss` tile must separate its room, on one axis,
   at all three tide levels.** All 35 doors in the game pass. The three-levels
   clause matters: a door that separates at LOW and not at HIGH is not a locked
   door, it is a locked door and a conch, and the player always has the conch.
   **If you place a locked door, wall the four tiles round it**; the checker
   will tell you if you did not.

6. **THREE OF THE EIGHT DUNGEON THEMES HAVE AN ALT FLOOR THAT LOOKS LIKE
   WATER.** `,` is the theme's floor variant and the obvious way to break up a
   wide room's floor. In Grotto, Cistern and Salt it is registered in the
   `stonef` palette — which is the palette of `dFloorWet`, the MID form of the
   `dBasin` tide tile. So a decorative scour laid in the Clawcrab Den read as
   standing water in a room whose only other grey tiles are the damp patches
   that are supposed to. It was laid in, screenshotted, and taken straight back
   out. Coral, Bog, Wood, Palace and Abyss are clear.

   `validate.mjs` cannot catch this: it asserts a theme never changes a tile's
   FLAGS, which is the right check and is exactly blind to a theme changing what
   a tile appears to SAY. In a tide game the floor palette is vocabulary. Look at
   the room before you trust a variant tile.

   Looking further while writing that down: **in six of the eight themes `,` is
   not a second tile at all, it is the SAME art recoloured.** Only Wood and
   Palace have a genuinely different alt floor. So "break the floor up with the
   variant" is not available in most of the game, and a wide room has nothing to
   put on twenty tiles of floor. That is a real gap and it wants a new pick, not
   a workaround.

7. **EXTRACTED ART THAT NO ROOM COULD NAME, FOR THE WHOLE LIFE OF THE FEATURE.**
   `lionHead` and `urn` were extracted by `rip-dungeon-themes.py` in P7.5, given
   tiledefs in `tiles-core.js`, and commented — in the file — "Themed scenery,
   for P8 to place". No legend ever got a character for them. A room grid can
   only name a tile through its legend, so the art sat in the build, in every
   shipped `dist/`, drawable by nothing.

   **Every checker was green and none of them was asking the question.**
   `validate` proved themed tiles carry the right flags; `test.mjs` counts
   unauthored sprite names; `check-tilesets` proves the ripper re-emits
   byte-identically. Extraction has a four-link chain — sheet, ripper, tiledef,
   legend — and everything checked links 1-3.

   `validate.mjs` now fails on extracted theme art that no tiledef draws, and on
   a tiledef built on extracted art that no legend, tide variant or transform
   can reach. Both new checks were verified by breaking them: removing the
   legend characters reproduces the original bug as a named failure.

8. **A SCENERY TILE CUT FROM A ROOM CARRIES THE ROOM'S FLOOR.** Wiring `urn` up
   was not enough — its 16x16 cell has 64 pixels of the source room's floor
   around the object, so it drew a rectangle of one dungeon's flagstones into
   every other dungeon's floor. The ripper now keys the border-connected
   background out to transparency (`KEY_BACKGROUND`), border-connected rather
   than by colour so a highlight in the floor's own colour survives, and the
   tiledef names an `underArt` so the floor is drawn under it.

   **`underArt` is a fixed tile name, which is why there is one urn per theme
   and not one urn.** That was also the sixth themed character, so the "add a
   seventh" path in `legends.js` is now worked rather than warned about — and
   the step that matters is the last one: add the pair to `SHARED` in
   `validate.mjs`, or a themed tile is free to carry different flags from the
   tile it stands in for and it surfaces as a stranded room in a dungeon nobody
   edited.

   `panelFloor` in the ripper's own PICKS documents the same hazard from the
   other direction (a floor tile that caught a room's frame). ALWAYS look at the
   contact sheet, and for an object, look at it standing on a floor that is not
   the one it was cut from.

**Re-authoring D1 for the Anchor (P8), and the five things it cost.**

1. **A FORGIVING TILE IN THE MIDDLE OF A GATE IS THE GATE.** Every anchor gate
   in the first cut of D1 had one tile of `dSluice` between the LOW-only band
   and the MID-only band, put there so the five-tile held patch would spill onto
   something harmless. `dSluice` is dry at LOW and shallow at MID — which makes
   it somewhere to STAND, and the conch can be sounded anywhere you can stand.
   So all three gates were crossable by walking to the middle at LOW, pressing
   the conch once, and walking out at MID: the anchor was decorative and the
   rooms read as anchor rooms in the data. `tools/check-anchor.mjs` caught all
   three on its first run, which is the entire argument for writing it.
   **The rule the gate rests on is: no tile between the two bands may be
   walkable at both levels.** Everything else is geometry.
2. **The Anchor barely fits in a 10x8 room, and that is a P7.6 argument.** The
   patch is 5x5 (`ANCHOR_RADIUS_TILES` 2) and the throw carries about two tiles,
   so a gate needs `stand + 4 + 3 + far side` = the full width of a room row,
   with the rest of the room walled off. That is why D1's three gates are bare
   corridors and why a room cannot hold two of them, or hold one and anything
   else. A 2x1 room (20 tiles wide) is what makes anchor geometry a design space
   instead of a fit problem. Anyone estimating P7.6's value should read that as
   part of it.
3. **Band widths come out of the hop, not out of taste.** The hop clears two
   whole tiles, so a two-tile band of anything is not a barrier — it is a hop.
   Three is the minimum for the far band and four is the minimum for the near
   band, because the patch has to cover the near band without reaching the far
   one. `check-anchor.mjs` reads both reaches out of `feel.js` rather than
   hard-coding them, so retuning `WALK_SPEED` re-proves every gate.
4. **A door a puzzle opens is a wall to the dungeon walker.** `walk-dungeons`
   floods the tile grid and knows about locked doors and boss doors, not about
   `puzzle.reward.openDoors` — so the Boss Key room behind D1's gauge puzzle
   read as stranded and the dungeon looked broken. It now treats a tile named in
   any room's `openDoors` as passable, and proving the puzzle is actually
   solvable is left to the tool that can: `solve-switches.mjs` for switch rooms,
   `check-anchor.mjs` for the gauge rooms.
5. **`openChest` had no branch for a charm.** `Chest` accepted `{ charm: ... }`
   in room data and `openChest` fell through to "Nothing but sand." — an opened
   chest, a saved flag, and no charm, which is the same silent shape as the
   chest granting a deleted item. The branch exists now, `check-charms.mjs`
   proves it grants in-engine, and it also sweeps every room in the game for a
   `charm:` naming a charm that is not in `CHARMS`.

**The tide field (P5), and the four things it cost.**

1. **A dropped field on an options object is invisible.** `Tide.addOverride`
   destructured `{mapId, roomKey, tx, ty, r, level, shape}` and rebuilt the
   object from those names — so the `src: 'anchor'` the caller passed was
   silently thrown away. Everything worked: the anchor landed, the field split,
   the room rendered correctly, every flag query answered right. The only thing
   that failed was the item finding its own override again, so the anchor could
   be thrown and never recalled. Rebuilding an object field-by-field drops
   whatever you forget, and nothing type-checks it.

2. **A render cache keyed on a scalar silently survives a field.** `Room` cached
   its tile layer against the tide *level*. With a field the key has to be the
   field's version stamp, because the level no longer identifies the picture.
   Get this wrong and collision is right while the pixels are stale — the room
   draws yesterday's water and every test still passes. The stamp is monotonic
   and **must never be reset**, including by `clearOverrides` or a new game:
   Room objects outlive a new game, so a stamp that went back to zero could
   collide with a key a cached canvas is still holding.

3. **A single-pixel probe is not a pixel test.** The first version of the render
   assertion sampled one pixel at the centre of each band and passed on nothing,
   twice, for two different reasons. First: animated tiles — which is every kind
   of water — are pushed to `animCells` and deliberately left OUT of the cached
   canvas, so both bands read as transparent. Composite `render` + `drawAnim` +
   `drawOver` the way `drawScene` does. Second: shallow and deep reef water
   happen to share their colour at the tile's centre pixel, so even composited,
   one pixel reported them identical. Hash the whole 16x16 tile.

4. **`levelAt`'s default room is wrong in exactly one place.** It defaults to
   `game.room`, which is right for game logic and wrong during a room-slide
   transition, where two rooms are on screen and one of them is not `game.room`.
   Everything going through `room.tile`/`flagsAt`/`solidAt`/`render` is safe
   because `Room` passes itself; the rule binds direct callers in draw paths.

**A replay that walks somewhere proves less than it looks.** The two-level
replay would have passed just as well in a room held uniformly at one level —
the walk succeeds either way. What makes it a proof is the probe tiles either
side of the held patch, recorded at every checkpoint, in two independent senses:
what the engine believes the level is, and a hash of how the tile is actually
drawn. Also: use held directions, not `goto`. A pathfinder routes around the
interesting part of the room by the boring columns at its edge.

**The radius had to be checked against a real room before the replay was built.**
At radius 3 the held patch reaches from the reef flat into the tide-rock band
three rows away, both bands freeze together, and the replay walks a uniformly
MID room while claiming to prove a split. The margin between the probes is the
reason the radius is 2.

**`flowers` and `bush` were the same rosette, and that is why `bush` could not
be extracted.** Two sessions recorded "bush stays hand-drawn" as a constraint
when it was a consequence: the Ages shrub at AG 450,920 is authentic, but the
`flowers` tile was a leafy rosette from the fan-made map and the two cells are
indistinguishable. The fix was upstream — re-pick `flowers` from Seasons'
**spring** overworld (a sheet nothing had ever read from; spring is when
Holodrum is in bloom), and the shrub becomes available immediately. When a
extraction is blocked by "it would look like X", check whether X is the thing
that should move.


**Sprite-sheet extraction** (`tools/ripkit.py`; worked examples in
`tools/rip-link.py`, `tools/rip-npcs.py` and `tools/rip-enemies.py`):

1. Sheets **do not use a uniform row pitch**. Assuming 16px steps cuts every
   sprite in half. `find_cells` measures each sprite's own bounding box.
2. `find_cells` assumes banded art. The **enemy sheet defeats it** — it is a
   mosaic of independently-placed white plates interleaved with label text.
   `rip-enemies.py` segments by flood-filling islands of non-background pixels
   instead and keeps the ones too big to be a glyph.
3. Sprites sit on **white plates**, and `background()` only reports the green
   around them, so the plate quantises as the sprite's lightest colour and every
   creature lands in a white box. Erase only white *reachable from the green* —
   white enclosed by a creature's own outline is artwork.
4. **Find the boxes before erasing the plates.** The plates are what make each
   frame one connected island; stripping first splits sprites apart and
   renumbers every index the frame map refers to.
5. `quantise` pads a short palette by repeating its last colour, which leaves a
   three-colour sprite writing its **outline at index 2**. That renders right in
   the sprite's own palette and wrong in every other, because the game's enemy
   palettes put a mid tone at 2 and the near-black at 3 — so the hard 1px
   outline washes out to grey the moment the roster asks for `enemyg`.
   `normalise_ramp` in `rip-enemies.py` re-slots the ramp.
6. Full-colour sprites need **per-sprite palettes bound to the art** via the
   `{ art, pal }` form. Registering palettes without binding them makes
   everything render in the wrong colours.
7. Packed sheets **leak neighbouring pixels** into a cell; `_trim_slivers`
   drops edge columns disconnected from the sprite body.
8. **`_trim_slivers` only caught one-pixel leaks** until it was rewritten. It
   blanked an edge line only when the very next line was empty, so a leak two
   or three columns wide with a gap between it and the sprite survived and
   rendered as a bar floating beside it. It now groups each axis into runs and
   drops detached edge runs small enough to be a leak.
9. **Quantisation punches pinholes.** A pixel inside the body that happens to
   match the sheet background goes transparent and you get a see-through slot
   across the sprite. `_fill_pinholes` in `ripkit.py` fills any transparent
   pixel with all four orthogonal neighbours drawn.
10. **A single-pass hole filler does not converge.** `seal_holes` in
   `rip-enemies.py` skipped a two-pixel gap on its horizontal test, filled one
   of the two vertically, and never revisited the one-pixel hole left behind
   the cursor. Both fillers now iterate to a fixed point.
11. **Both extractors reproduce byte-identically**, which is what makes it safe
   to change `ripkit.py` and re-run: run them once before touching anything,
   confirm an empty `git diff`, then change and read the diff.
12. Always `preview.mjs` the pack and **look at the PNG**. Dimensional validity
   says nothing about whether a sprite reads as the creature it names. Note
   that `preview.mjs` screenshots the canvas clipped to the 1400px viewport, so
   at `--scale=6` the rightmost column is cut off — use `--scale=2` to see a
   whole pack.

**Terrain extraction** (`tools/rip-terrain.py`) — the two terrain sheets are
assembled **maps**, not tile palettes, so none of the cell-finding in
`ripkit.py` applies. Each map block sits at its own origin and there is no
global 16px grid: a search over all 256 offsets scores them nearly equally,
because the base ground tile is mostly flat and matches itself at any phase.

What does work: a ground tile is the 16x16 window that repeats at **+16 in x
and +16 in y**. A window that passes is correctly phased and tiles seamlessly
by construction, which is exactly what ART-DIRECTION demands of terrain. Two
things to know if you rebuild that scan:

1. **Collapse the phase shifts.** A seamless tile stays seamless when rolled,
   so every hit appears at all 256 offsets and a frequency ranking is nothing
   but shifted copies of one tile. Key each hit on the smallest of its 256
   cyclic shifts. Do it *after* deduplicating exact bytes — canonicalising
   half a million raw hits does not finish.
2. **It only finds ground.** `cliff`, `tree`, `bush` and the rest are
   structured and directional; no single window supplies a top, a face and
   corners, and the scan returns nothing for a tree grove. Those have to be
   picked by eye from a region dump.

Two judgement calls in the tool that are deliberate:

- **The extracted art keeps the game's palettes**, and only the pixels change.
  Binding the source colours instead would have shifted every region's scheme
  under the extracted Seasons enemies, and broken the palette-swap variants
  (`grassDark`, `saltFlat`, `iceFloor`, `rockFloorRust`) that are how this game
  gives each region a look without redrawing every tile. `TERRAIN_SRC_PALETTES`
  records the source colours for reference.
- **…but a palette can need narrowing.** The source dungeon flagstone is three
  near-identical blues. Replayed through `brick`'s full light-to-dark spread it
  became loud blotches across all 179 rooms, and it took an in-game screenshot
  to see — `preview.mjs --tiles` renders every tile in one palette. `brickf`
  and `stonef` in `palettes.js` are narrow ramps added for exactly this.

A first pick can also be simply wrong for its job: the original `rockFloor`
source was brick courses, which reads as a **wall** in a top-down game. It was
swapped for cobbles after looking at a screenshot, not after validating.

**Boss and miniboss behaviour** (`src/data/bosses.js`) — four traps, all paid
for, all of which produce a boss that *validates* and is *unwinnable*:

1. **A miniboss must clear `isBoss` in its `init`.** `game.onEnemyDefeated`
   keys `progress.beaten` off the **map id**, not the entity, so a miniboss
   counted as a boss marks its whole dungeon beaten. That deletes the real boss
   when you walk into its room (`spawnRoomEntities` removes it) *and* spawns the
   dungeon's essence in the miniboss room. It also blocks the miniboss room's
   own `puzzle: { enemies: true }` reward, because `onEnemyDefeated` returns
   early for bosses and never sets `room.cleared`.
2. **`submerge()` is sticky.** It parks the entity `hidden`, `harmless` and on
   `invuln: 9999`. A later phase that does not call `submerge` inherits all
   three and you get an invisible, invulnerable, unkillable boss standing in the
   room. Every boss that submerges in *any* phase calls `surface(e)` on *every*
   phase change.
3. **`e.stun` makes `Boss.update` return before the AI runs**, so an attack
   cannot be executed inline after setting a wind-up. The `windUp`/`runPending`
   pair in `bosses.js` parks the attack on the entity and fires it on the next
   live frame. Every heavy attack goes through it, which is also what guarantees
   every attack has a tell.
4. **A tide gate must never be a boss's only vulnerability.** Nereth pins the
   tide to MID in phase 1 — which is the level the player walks in at — so an
   unconditional "sealed while the tide sits at my level" made him invulnerable
   from the first frame with no way to learn otherwise. Every boss now has a
   timed window that does not depend on the conch; the tide widens it.

Boss rooms are authored `noTide: true`, which only sets `tide.locked` and only
stops the *conch* — `tide.setLevel` still works. Each boss calls `unlockTide` on
its intro to hand tide control back for the fight, and the late bosses force it
back to the level that suits them.

**Art** (`sprites-link.js`, `sprites-world.js`):

- **`validate.mjs` cannot see a broken sprite, only a wrong-sized one.** A row
  split by a see-through slot, or shifted out past the rest of the body so it
  renders as a detached line, passes validation and looks wrong on screen.
  `tools/scan-sprites.mjs` is the check for that class; run it after any art
  work. It scans the **resolved** registry, which matters because 37 of the 40
  names in `LINK_ART` are shadowed by `PLAYER_ART` — scan the source packs and
  you get a list of defects in art nobody ever sees.

- **Transparency, not outline, is what separates two shapes.** Five icons
  (conch, cape, gloves, flippers, magnet) came out as solid blobs because the
  gap between prongs/fingers/wings was drawn with `3` instead of `.`. At 16x16
  an outline pixel is just another coloured pixel.
- `preview.mjs` renders a whole pack in **one** palette, so it shows silhouette
  and shape but not in-game colour. That is the right tool for "does it read as
  the thing it names"; use `test.mjs --shots` for colour.
- The engine's `slashD` effect (`src/game/effects.js`) wants `fx_slash_d0` and
  `fx_slash_d1`, and `player.js` spawns it on **every sword swing** — but
  neither name is in `sprite-manifest.js`, so nothing flagged them and the
  most-seen effect in the game drew as a placeholder box for the whole project.
  If you add an effect to the engine, add its frames to the manifest.

**A ledge is solid from three sides, so it partitions the room it is in.**
Placing one is the same class of hazard as a mis-stamped doorway. The 38 runs
placed were chosen by a script that, for every candidate run, re-floods the room
at all three tide levels and rejects the run unless every tile reachable before
is still reachable after — walking only, no hop. Three further rules, each of
which a hand placement would get wrong:

- **The tile below the run must be dry at all three tide levels.** A ledge that
  drops you into water that is only shallow at LOW is a trap you cannot see in
  the grid.
- **Never in a switch, door, transition or boss room.** A solid lip in a switch
  room is a new way to make a one-tile push unreachable.
- **Ledges now face all four cardinals.** `_` south, `"` north, `>` east, `<`
  west, in every legend that declares `_`. Two things follow that a harness or
  a placement script gets wrong first try: **`>` and `<` runs are COLUMNS, not
  rows** — scanning every direction as if it were a row silently reports zero
  east/west ledges while they sit in the data — and a lip is **solid from three
  sides**, so a run dropped across a corridor makes rooms unreachable while
  still validating and still rendering. Use `tools/find-ledges.mjs`, which
  refuses any candidate without two plain tiles continuing past each end.

**A SOLID tile is never hit by a projectile's own rect.** The boomerang
ricochets off a solid tile *before* its rect ever overlaps it, so
`checkTileAction(this.rect(), ...)` finds nothing and a solid gate tile reads as
ordinary rock. `Boomerang.strikeTile` probes the tile just past the leading edge
instead, the way the hookshot probes ahead for a latch. Any future
"projectile opens a solid tile" mechanic needs the same probe — the rect test
that works fine for bushes silently does nothing here.

**An entity dropped from `game.entities` must be marked `remove` first.** The
player holds direct references to some of its own projectiles — `player.boomerang`
is the one that bit — and the guard in the item's `use` reads `.remove` to decide
whether the item is still in flight. `spawnRoomEntities` filtered the list
without setting the flag, so throwing the boomerang and then changing rooms left
a dangling reference that looked live forever: **you could never throw the
boomerang again for the rest of the run.** Nothing validated it, nothing errored,
the item just quietly stopped working. It now marks the dropped entities first,
which covers the whole class rather than the one case.

**A gate tile must sit INSIDE a screen, not on its boundary row.** The seam
check asserts both sides of a screen boundary agree about passability, and a
solid gate on the boundary makes them disagree. This is why the Marsh's cracked
cliff is one tile in, and the first placement of the salt vanes — directly on
the seam the scan reported — failed the seam check immediately.

**A push block moves exactly one tile, ever.** `PushBlock` takes `once: true`
by default and sets `moved` the moment its single slide lands, so a block placed
two tiles from the switch it is meant to cover can never reach it. Every switch
room in the game was authored that way, and each rewards a Small Key, so seven
dungeons silently had a key that could not be earned — and neither `validate.mjs`
nor the dungeon walker can see it, because both count keys statically from the
data. Blocks now sit orthogonally **adjacent** to their switch with plain floor
behind them to push from. If you add a switch puzzle, either do the same or pass
`{ once: false }`.

**An active dialogue freezes every entity while `mode` is still `'play'`.**
This is called out under the boss harness below, but it bites any harness that
visits several rooms in a row: a `puzzle.reward.say` from one room leaves a text
box open, and in the *next* room nothing updates — switches never press, blocks
never slide, and the room looks broken. Clear `game.dialogue.active` between
rooms before concluding anything.

**Data contracts drift from engine contracts, and nothing checks it.** Both
`giver` entities in `overworld.js` passed `giveFlag`, `waitingText`, `afterText`
and a `ready` function; `Giver` in `src/game/objects.js` reads `flag`,
`waiting`, `after` and `needEssences`. Every option was silently dropped, so the
Maku Tree and the digger handed over the Seed Satchel and the Shovel on first
contact with no Essence requirement and repeated it on every later talk. The
validator cannot see this. When wiring a data entity, read the class.

**Map authoring:**

- Rooms whose edges must line up are **not** worth hand-checking. Both the
  overworld and the dungeons were authored as 6x8 *interiors* with the border
  ring stamped on from a single shared seam table, which makes "walkable east
  edge implies walkable west edge on the neighbour" true by construction. The
  generators were throwaway scaffolding; the emitted files are the artifact and
  should be edited directly from here on.
- **A doorway needs floor behind it.** An interior authored with its own wall
  run will happily put a wall directly behind a stamped doorway, and the door
  then opens onto stone. Twelve of d2's twenty rooms were unreachable for
  exactly this reason. Carve one tile inward at every doorway.
- **…but that carve must not overwrite a door tile**, or a lock wall sitting on
  the first row behind a doorway is silently punched open.
- **Locked doors go inside rooms, never on a seam.** The engine places an
  arriving player just past the room edge, so a locked tile on a seam drops them
  inside solid stone from the far side. An interior wall with an `L` in it
  splits a room cleanly.
- Room grids are **exactly 8 rows of exactly 10 characters**, and digits 0-9 are
  always tide tiles.

**Extracted icons carry their own palette, so draw sites must not pass one.**
This is trap 6 under sprite-sheet extraction in a new place. `art.js` `bake()`
resolves `palName || d.pal`, so an explicit palette at the draw site silently
overrides the sprite's extracted colours and renders it in the wrong ramp. The
items in `src/game/items.js` whose icons come from `sprites-hud.js` therefore
have **no** `pal` field, and the draw sites in `hud.js`, `menu.js`, `game.js`
and `title.js` no longer fall back to `'ui'`. If you extract more icons, drop
the item's `pal` at the same time; if you add an item using hand-drawn art,
give it one.

**Plate colour enclosed by a sprite's own outline is ARTWORK.** This is trap 3
above, and `tools/rip-hud.py` hit it again from the other side: the Seed Satchel,
ring box and Power Gloves all use the plate tone as a highlight *inside* the
outline, so treating every plate pixel as transparent punched holes straight
through them. `quantise_exact` flood-fills the plate from the cell border and
only erases what is reachable from outside. When that first went in it filled the
empty heart's middle too — a part-filled heart is an outline with the bar showing
through, not a heart with a tan centre — so `HOLLOW` opts those four out. If a
new extraction shows see-through slots, this is the first thing to check; an
allowlist in `scan-sprites.mjs` would have hidden a real bug rather than fixed it.

**`ripkit.quantise` is not deterministic when it pads a short palette.** It pads
to four by repeating the last colour, then picks each pixel's index by scanning
for the smallest squared distance — with duplicate entries several indices tie at
zero and the winner is not pinned down, so the same cell emits different indices
from run to run. `rip-hud.py` was three pixels unstable across runs before
`quantise_exact` replaced the search with a direct lookup keyed on a total order
(`-luminance`, then the RGB tuple). Every cell on that sheet has at most four
colours so nothing needs snapping. **`rip-enemies.py`, `rip-link.py` and
`rip-npcs.py` still use `ripkit.quantise`** — they reproduce byte-identically
today, but if one ever starts drifting, this is why.

**The status bar is modelled on the Oracle of Seasons / Ages bar** — a parchment
panel, `B[icon]`/`A[icon]` in tall drawn brackets, the rupee icon stacked over
its three digits, hearts right-aligned in two rows of seven. Two things there
are deliberate and look like bugs if you do not know:

- **The panel is a warm tan (`#f0e0b0`), not the text box's near-white.** Most
  item icons use palette `ui`, whose lightest index is `#f8f8e8`; on a near-white
  bar a sword or a conch washes out to nothing. The tan is what makes them read.
- **`drawHud` suspends the room tint around itself.** `applyTint` sets the tint
  on the whole *sprite atlas*, so hearts and item icons would otherwise dim with
  the room — invisible on the old black bar, but on a light panel it reads as a
  rendering fault. It is safe to toggle without `flush()` because `bake` keys its
  cache on `tintKey`, so tinted and untinted bakes coexist rather than thrashing.

**Engine gotchas already fixed, worth not reintroducing:**

- Input latches key presses, so a tap shorter than one frame still registers.
- Room-exit detection needs a margin wider than one movement step, or exits
  never trigger.
- Warping sets `_warpLock` so arriving on a warp tile does not bounce straight
  back through it.
- The validator rejects a space between two drawn pixels: it is legal in the
  grammar but punches a transparent hole through a sprite.
- Rooms draw a tile by its **tile** name while art is keyed by **art** name, so
  every palette-swap tile (`grassDark` reusing `ART.grass`, and so on) rendered
  as a placeholder box until `installCoreTiles` started aliasing tile names to
  the art they declare. If you add a tile that reuses another's art, that alias
  loop already covers it.

**The single-file build** (`tools/build.mjs`, checked by `tools/check-build.mjs`).
`npm run build` flattens `index.html` and the 46 modules reachable from
`src/main.js` into `dist/oracle-of-tides.html`, which runs from a `file://` URL
with no server and no network. Five things that were not obvious:

1. **It has to be a classic `<script>`, not an inline module.** A
   `<script type="module">` is fetched with an opaque origin under `file://` and
   blocked by CORS in every browser — even inline, even with every import
   already resolved away. That single fact is the reason the build flattens the
   module graph into a tiny synchronous registry instead of just concatenating
   the modules and keeping `type="module"`. Anyone "simplifying" it back will
   produce a file that is blank on double-click and fine over `npm run dev`.
2. **The no-runtime-assets claim is real, and the build now enforces it.** There
   is no `fetch`, no `XMLHttpRequest`, no `new Image`, no `<img>`/`<audio>`
   anywhere: sprites are procedural JS, audio is WebAudio synthesis. The build
   greps for all of it and refuses rather than emitting a file that 404s. If a
   real asset ever lands, embed it as a `data:` URI — do not remove the guard.
3. **That grep must run over comment- and string-stripped code.** The naive
   version fired twice on innocent lines: `tiles-terrain.js` provenance comments
   name `.png` sheets, and the overworld room grid `'Tg.....ogg'` is tile
   letters that happen to spell an audio extension. `stripCommentsAndStrings`
   in build.mjs exists for exactly this.
4. **`new Audio()` in `src/core/audio.js` is not the DOM `Audio`.** That module
   declares its own `class Audio` — the synth. The asset scan skips a global
   that the module shadows with its own declaration, which is why the pattern
   table carries a `shadow` column.
5. **Imports become destructuring, so an import cycle would break silently.**
   Every export in `src/` is a `const`, `function` or `class` — nothing is
   reassigned — so snapshotting a binding is safe *provided* the dependency has
   already evaluated. The build therefore topologically sorts and hard-fails on
   a cycle, naming the loop. It also rejects the forms it cannot express
   (default exports, `export *`, re-exports, dynamic `import()`, and
   multi-declarator `export const A = 1, B = 2`, which the transform would
   publish only half of). Extend build.mjs rather than working around it.

Also: `dist/` is in `.gitignore`, which silently swallowed the built file the
first time. It is now `dist/*` plus `!dist/oracle-of-tides.html`, so the build
output is committed and nothing else in `dist/` is.

And: `check-build.mjs` is only worth anything if it fails. It was verified by
sabotaging the bundle's last line with a thrown error and confirming it went
red on six separate assertions at once. `window.__game.frame` is the frame
counter — there is no `tick` or `frameCount`, and a check that reads a field
which does not exist passes forever.

### Scrimshaw (P7), and the three things it cost

**A pickup that opens a text box freezes the fight that dropped it.** The blank
had a friendly first-time hint on collection. An open dialogue freezes every
entity while the mode is still `play` (this is already in the traps list), so
the hint stopped the game dead in the middle of whatever had just died to drop
it — and `tools/replay.mjs` showed it as the d1-descent actor standing still
and then dying. There is now a comment on the pickup saying why it is silent.
The rule generalises: **a floor drop may play a jingle and must not speak.**

**Adding one NPC to an early room re-phased every enemy in the game.** Entity
ids are a global counter, `every(e, n)` in `enemy.js` derives an enemy's cycle
offset from `hash32('phase', e.id, n)`, and the scrimshander spawns in
Tidewatch — which `newGame` enters before anything else. So every entity
created afterwards, for the whole run, got a different id and therefore a
different attack phase. All three replays diverged in rooms the change never
touched. This is correct behaviour and re-recording is the right answer, but
budget for it: **any new entity in an early room re-baselines every replay.**

**A new drop must not be a difficulty change.** The blank's weight first came
out of the `heart` entries in the `good` and `rich` tables, because that is
where there was room. The d1-descent actor promptly starved and died in a room
it had always cleared. The weight now comes out of `null` and the small rupees,
the heart weights are untouched, and there is a comment on the table saying so.

**Also worth knowing.** `game.charm(id)` is the successor to `hasRing` and is a
pure read of a set recomputed once per frame, so it is safe from a draw path —
`drawDarkness` and the Wrecker's Eye glimmer both call it at display rate. The
live case is decided by `tideAt(game, player)`, the level under the player's
own feet, NOT `tide.level`, so standing in the Anchor's held patch keeps that
patch's charms alive. That is deliberate and it is the interaction most likely
to be "fixed" by a future session that has not read this paragraph.

### check-gates was unseeded, and failed on an IDLE machine

`tools/check-gates.mjs` intermittently failed its two Resonance Rod vane
assertions — roughly twice in ten runs. The tell was backwards from the usual
one: it failed on an IDLE machine and PASSED under six-way CPU load, and adding
a single `console.log` between the setup and the press made it pass every time.

**The cause was that it never pinned the save seed.** `newProgress` falls back
to `Date.now()`, so every run of the harness played a different world. This is
the SAME defect P2 root-caused in `test.mjs`, in the one harness P2 never
reached — and the paragraph P2 wrote about it applies verbatim: which file a
commit touched was coincidence, because every run was already a different game.
`?seed=20260806` fixes it: 18 idle runs and 5 under load, no failures, against
a baseline of about two per ten.

**A diagnosis that was wrong, recorded so nobody repeats it.** The obvious
suspect was `page.keyboard.press()` firing keydown and keyup inside one game
frame and the edge-triggered `pressed()` swallowing it. That cannot happen:
`src/core/input.js` keeps a `_latch` precisely so a key that goes down and up
between two updates is still seen for exactly one frame. Read the latch before
blaming the press.

The harness was ALSO wall-clock driven — it polled `requestAnimationFrame`
against `game.frame` while `main.js` kept stepping — and it now calls
`takeOver()` and `step(n)` like `test.mjs` and `replay.mjs`. That is the
documented standard for a harness in this repo and it makes every hold exact
rather than approximate, but it is not what fixed the flake; the seed was.

### Dungeon themes, and the four things they cost

**A wall tile must tile with itself in BOTH axes, and a contact sheet cannot
tell you that.** Four dungeons were themed off single-cell previews with
`hatchWall` and `forgeWall`, which are wall RUNS — directional art meant for
the top course of a room. Repeated down a two-tile border they read as a picket
fence. Render a 4x4 tiling of a candidate and LOOK at it; the tiles that
survive that test are bevelled block grids and brick courses.

**`registerPalettes` silently ignores any palette that is not exactly four
colours.** A flat tile can quantise to two or three, so its palette registered
nothing, its tiledef named a palette that did not exist, and the tile drew in
the fallback. `validate.mjs` was the only thing that caught it. The ripper pads
to four now — and note `rip-terrain.py` emits the same short arrays and has
never noticed, because it does not install its palettes. If a future session
makes it install them, pad there too.

**A tile sitting on a room boundary in a stitched map carries the boundary.**
Both copies of one flagstone have a stripe of the stitcher's frame in the right
edge. The deduplicator cannot know that is not art — different pixels means a
different tile, and it dedupes to itself perfectly.

**Floor and wall must stay legible before a theme is allowed to be
atmospheric.** d5's floor and wall were both brick courses and the room read as
one texture with no line between walkable and not.

**The shape of the solution is worth reusing.** A theme is
`registerLegend(name, {five characters}, 'dungeon')` — it inherits the shared
legend and overrides floor, cracked floor, wall, bombable wall and block. No
room grid changed; a dungeon picks its look with one `legend:` field.
`validate.mjs` asserts every themed tile carries exactly the flags of the tile
it stands in for, so a theme can never move a wall.

### P7.5 is blocked on assets; P7.6 is built

The four Oracle of Seasons dungeon map rips P7.5 is written against are not in
`assets/sheets/`. The tool it asks for exists and works
(`tools/rip-dungeon-maps.py`, proven on the one stitched floor map that IS
here, byte-identical, checked by `tools/check-tilesets.mjs`), but the
colour-register decision that governs everything after it cannot be made
without them — the evidence that CAN be gathered is tabulated in
`docs/ART-DIRECTION.md` and is not conclusive. See `docs/ART-BACKLOG.md`.

**The alignment trap in that tool cost the most time and will recur:** gridding
a stitched sheet from the image's global content edge instead of from each
block's own corner turns one wall tile into a family of sixteen, and reports a
dedup ratio that looks like success. 4936 unique before, 2181 after.

P7.6 (multi-screen dungeon rooms) is **BUILT**. It was planned in
`docs/briefs/P7.6-PLAN.md` and executed against that plan. The survey finding
that made it tractable held up exactly: `ROOM_W/ROOM_H/VIEW_W/VIEW_H` appeared
30 times across six files and every use meant the room's tile extent
(`room.tw`/`room.th`), the room's pixel extent (`room.pw`/`room.ph`), or the
size of the window on screen (still `VIEW_W`/`VIEW_H`) — separating those three
was most of the work, and the camera was the small part. What a dungeon session
needs to know is in `docs/EXECUTION-PLAN.md` under "ROOM SIZE — everything a
dungeon session needs, in one place"; what it cost is at the top of the
hard-won-lessons section above.

### Fixed-point movement, and the four things it cost (P3)

All five are things that passed at least one green checker on the way through.

**1. A jump's reach is a function of the WALK speed, not the jump.** The player
keeps walking while airborne, so `reach = 2*power/gravity * WALK_SPEED`.
Re-deriving `WALK_SPEED` from 1.35 to 1.0 px/f cut Roc's Feather from 2.3 tiles
to 1.7 and made the Coral Reef chasm — a real region gate — uncrossable.
`validate`, `test`, `walk-dungeons`, `check-overworld` and **both replays** were
green; only `check-gates.mjs` caught it, because it is the only harness that
jumps. If you touch `WALK_SPEED`, re-derive the three jump constants in the same
commit. The formula is in `feel.js` above `JUMP_POWER`.

**2. A frame budget calibrated against a constant rots when the constant
moves.** `check-gates.mjs` held a direction for a flat 22 frames, which was 2.1
tiles at the old walk speed and 1.5 at the new one — so the Feather check
failed on a chasm the Feather still clears. The fix was not a bigger number: it
now reads `WALK_SPEED` out of the page and derives the budget. Any harness that
writes down "n frames" to mean "far enough" has this bug latent in it.

**3. Converting a constant's unit breaks any DATA that overrides it.**
`ENEMY_HOP_POWER` went from px/f to sp/f, and the zol's `power: 1.7` was then
read as 1.7 *subpixels* — the slime hopped a 150th of a pixel and nothing
errored. Same shape for `driftWithTide`'s `perLevel` and `Pickup`'s `vy`. When
you change a constant's unit, grep `src/data/` for anyone passing an override,
and make the fallback and the override explicitly different units at the edge.

**4. `e.x += 0.5` silently stops working.** `x` is now an accessor over an
integer accumulator, so a read gives whole pixels and a sub-pixel increment
rounds away to nothing every frame. Every `+=` on a position had to become an
add to `fx`/`fy`/`fz`. The ones that bit were `Effect.update`, `Pickup`'s pop,
the boomerang's return, the hookshot's retract and the pincer's reel-home —
all of which would have just frozen in place.

**5. An actor that retreats can retreat out of the room.** Teaching
`replay.mjs`'s swordsman to disengage diagonally (which it needs, now that
diagonals are the fast direction) made it back out through doorways mid-fight.
A `fight` directive that ends in a different room than it started in does not
fail — it records perfectly, and every directive after it is addressed to a
room the player is not in, so the rest of the route becomes fiction while still
producing a green replay. `dFight` now fences every mask it yields against the
room edges. Cost two recordings to find because the trace looks plausible.

Also worth knowing: the old replay baselines recorded final positions like
`x: 63.015805675746414`. They are integers now, which is what "asserts to the
pixel" was always supposed to mean.

### A sprite that does not fit its cell, and the two ways to get it wrong

The held-blade poses are the game's first non-16x16 player sprites. Two traps
came out of adding them:

**`parseArt` strips WHITESPACE-only rows, not transparent ones.** A row of
`................` is not blank — dots are not whitespace — so it survives the
parse and counts toward the sprite's height. A first attempt trimmed all-dot
rows in the ripper "to match", which silently shrank a dozen existing frames
(`link_swim_up_0` went 16x16 -> 16x13) and moved the anchor of the new ones.
`validate.mjs` caught it, because `expectedSize` asserts every sprite's
dimensions. Emit exactly what was cut.

**Derive the draw anchor from the sprite, not from a constant.** These frames
are anchored so Link's *body* lands where a 16x16 frame would put it, which
means offsetting by the overhang — 12px up for the up-facing frame, 12px left
when the side frame is mirrored. `Player.draw` reads `sprites.size(name)` and
computes it, so re-cutting the frames in `rip-link.py` cannot leave a stale
offset behind. Writing the numbers down would have been three lines shorter and
one silent bug away.

And the flip is about the sprite's own canvas, not the world: mirroring a
28-wide side frame carries the body to the far end of the canvas, so the offset
belongs to `flipX`, not to `dir === 'left'`.

### `tools/shots-link-baseline/` was three weeks stale

P3's brief said to diff it. Doing so showed 47–96% of pixels differing on most
shots, which looks like catastrophe and is not: the baseline was captured on
2026-07-31 mid-way through the art pass, when 38 sprites were still unauthored
placeholders and the HUD was not drawn. It had not been refreshed since, so it
had been silently useless through P1 and P2.

The honest P3 diff needs a *pre-change* capture, not that baseline:

```
git worktree add /tmp/pre HEAD
cd /tmp/pre && node tools/test.mjs --shots --shot-dir=shots-pre
```

Against that, P3 moves 0–5.7% of pixels, all accounted for: Link is a tile
behind at the same scripted frame count because he walks slower, and the
file-select screen's animated water is at a different phase. The baseline is
refreshed as of this session. Nothing in the repo compares against it
automatically, so it will go stale again unless someone refreshes it when the
art or the movement changes.

### A chest's pickup can land on a solid tile and be uncollectable

Found while recording the D1 replay, and it passes every existing checker.

`Game.openChest` spawns a `chest.pickup` at `chest.y - 12`, one tile above the
chest, with no check that the tile there is standable. In `d1` room `0,4,5` the
Compass chest sits at (4,3) with a **pot** at (4,2). The pickup settles at
y≈32.2, its rect is y 36.2–46.2, and no legally standable tile in the room
overlaps it — measured, not inferred. The chest opens, the jingle plays, the
save records the chest as opened, and the Compass is never collected. The pot
is liftable, so it becomes reachable once the player has the bracelet from a
later dungeon; on the intended first visit it is not.

Two things follow. Any chest with a solid tile directly above it has this bug,
so it is worth a checker rather than a one-room fix. And `openChest` spawning
into an unvalidated tile is the actual defect — `findSafeTile` already exists
for exactly this shape of problem.

Not fixed here: it is dungeon content, and P8 re-authors D1 anyway. The D1
replay opens the chest deliberately (an opened chest is persisted save state
worth asserting on) and its plan comment says the Compass is not collected.

**Update (P8, D1).** That room is re-authored: `0,4,5` holds the Chartstone in a
chest at (5,3) with plain floor at (5,2), and `d1-descent` now collects it. THE
ENGINE DEFECT IS UNTOUCHED — `openChest` still spawns into an unvalidated tile,
and five other dungeons are unaudited for it. The checker is still owed.

### A dropped pickup pops upward and never comes back down

Found while re-recording `d1-descent` after the P3/P4 merge, and it silently
loses a Small Key.

`Pickup.update` runs `fy += vy; vy += PICKUP_GRAVITY` for `PICKUP_SETTLE_FRAMES`
frames and then stops. With the current numbers that sums to about **five
pixels of net rise**, and nothing brings it back down — the settle window ends
while the pickup is still travelling upward. So a pickup spawned at tile
`(4, 3)` comes to rest straddling the tile above it, and a player standing on
`(4, 3)` overlaps its rect by about one pixel.

That was always true — the pre-P3 float constants netted ~3.8px — but P3's
snap to the subpixel grid took it to ~4.7px, which was enough to turn a
marginal overlap into a miss. The D1 Crab Pit's reward key stopped being
collectable, and **the failure is invisible**: the route walks on, the locked
door two rooms later simply never opens, every directive after it addresses a
room the player never reached, and the recording is still perfectly valid. It
was only caught because `expect.doorsChanged` came back 0.

Two things follow. `tools/replay.mjs`'s per-step trace now prints `keys=` and
`doors=`, because "the route continued without the thing it needed" is not
visible in a position. And the pop itself is a real defect worth fixing
properly — a drop should come to rest where it was dropped. Fixing it moves
every drop in the game by a few pixels and re-baselines both replays, so it
wants its own change rather than riding along with someone else's.

### A miniboss is not `isBoss`, and motion has to test the class

Cost a failing `check-motion.mjs` run and a confusing table. Minibosses are
built with `defineBoss` — they want its phases, intro hold and staged death —
and then **clear `isBoss` in their `init`**, because `onEnemyDefeated` keys
"dungeon beaten" off that flag and a miniboss counted as a boss marks its whole
dungeon complete. That is documented at the top of `src/data/bosses.js` and it
is correct.

The trap is that `e.isBoss` therefore answers a *progress bookkeeping*
question, not a "what kind of thing is this" question. `gridLocked()` in
`enemy.js` asked it and put all eight minibosses on the 8px lattice, which is
exactly what a set piece must not be on. It tests `instanceof Boss` now. Any
future code that wants to know whether something is a set piece has the same
choice to make, and the flag is the wrong side of it.

### Grid-locked enemies cost the replay actor about 60% more health

Not a bug, but it will look like one. The recording actor in `tools/replay.mjs`
lines up on one axis, swings, and stands still for the length of the swing. It
is tuned against enemies that drift continuously and can be nudged. An enemy on
the lattice commits to a whole 8px step and cannot be deflected mid-step —
which is the entire point of the design, and which a human handles by reading
the commitment and stepping out of it.

The actor cannot read anything. On three hearts it now dies in the Crab Pit.
`d1-descent`'s plan gives it five hearts, with a comment saying why. Two other
actor fixes were needed at the same time and are worth keeping in mind if a
route starts behaving oddly:

- **`dFight` chased the last foe out through a doorway** and carried on
  fighting in the next room, on whatever health was left. It now bails when the
  room changes: a `fight` directive means "clear *this* room".
- **`dExit` stopped pressing the moment the room changed**, which leaves the
  player one or two pixels inside the new room, still on the seam. The next
  directive's first step back toward it re-triggered the transition. It now
  keeps walking for ten frames after the change.

Both were latent before P4; the lattice is only what made them bite. P3 had
independently fixed the first of them with a `fence` that strips any direction
that would carry the player out of the room — that is the better mechanism and
it is what survived the merge; the room-change bail is kept as a backstop.

The one that actually mattered on the merged engine is different and worth
stating on its own: **the swordsman attacked shielded enemies from the front
and swung into the shield forever.** A `shield: 'front'` enemy blocks whatever
arrives at its facing side, and the nearest axis is very often exactly that
side. Three shielded crabs in the D1 Crab Pit is where it shows, and an
unclearable Crab Pit means no Small Key. `dFight` now prefers whichever axis is
*not* looking back at it, which is what a player does without thinking: a crab
patrols along x, so its facing is left or right nearly every frame, and coming
at it from above makes the shield irrelevant.

Two things that were tried first and were worse, so do not re-try them:
widening the standoff band to one full enemy step (16..24) — standing further
out means walking further in, and the extra approach frames cost more health
than the extra swings win — and raising the patience, which only made the actor
spend longer failing the same way.

### Merging P5 into P6, and the four things THAT cost

Both sessions ran in parallel against the same base and both were green alone.
Fifteen textual conflicts across six files, all of them "keep both". The
expensive part was, as HANDOFF has said twice now, **what merged cleanly**.

**1. The two branches disagreed about who owns the clock, and the merge hung.**
P5 branched from a commit BELOW the P2 merge, so its `test.mjs` had no
`takeOver()` and its new field section waited on `g.frame` from inside a
`page.evaluate`. Merged into a `test.mjs` that does own the clock, nothing ever
steps the game, so those waits never return: the run hung with **no output at
all** and no error, which reads as a broken browser rather than a broken test.
Every wait in that section is `window.__harness.step(n)` now. If you merge a
branch that predates P2, grep it for `requestAnimationFrame` and `g.frame`
before you trust a green run.

**2. A stand-in built to be deleted still has to be deleted carefully.**
`src/game/tidelocal.js` existed only so the Squall Bellows could hold water
back before P5 landed, and its header said exactly how to remove it. Following
that header was right, but it named five call sites and the real number was
nine — four more had appeared in `items.js` (the Dredge Line's drag, the
Resonance Rod's range and radius) after the header was written. A header that
lists call sites goes stale the moment someone adds one. `git grep tideAt` is
what actually finds them.

**3. The two items compose, and the naive merge would have made them lie.**
The Brineglass Lens draws the room at the next tide level. Rendering that from
a bare number is correct until a Tidewright's Anchor is down — and then the
preview shows the held patch changing, when the held patch is the one part of
the room that will not. `Tide.viewAt(base)` is a read-only view of the field
with a different base, so the Lens previews the FIELD. Neither branch could
have found this alone; it only exists in the merge.

**4. A parallel render cache has to be keyed the way the real one is.**
`Room.renderAt` was an array indexed by tide level, which is fine when the
argument is a number. P5's `render` takes the field too, keyed on
`tide.stamp`. Left alone, `renderAt(field)` would have cached under
`"[object Object]"` forever and drawn water that stopped being true several
anchors ago — silently, because a stale canvas throws nothing. It uses
`cacheKeyFor` now, the same function `render` uses.

**What the collapse actually looked like**, for the next person who has to do
one: the Bellows' cone became an ordinary entry in `tide.overrides` with two
small extensions to P5's structure — a `'cone'` footprint in `Tide.covers`, and
a `delta` alternative to the absolute `level` in `Tide.levelAt`. The delta is
the interesting half: the Anchor is absolute because it is holding out against
the conch, and the Bellows is relative because it holds the water back one step
from wherever the conch currently has it. One number could not have served
both, and collapsing them would have made one item quietly wrong.

Because the cone is a real override, `Room.render` draws the drained wedge
through the field and the field's stamp invalidates the cache — so
`Game.drawTideHolds`, the whole second draw path, deleted.

### The item roster (P6), and the six things it cost

Nine items in, ten out. `docs/ITEMS.md` is the roster and `tools/check-items.mjs`
is the proof. Six lessons, every one of which produced code that passed every
checker that existed at the time.

**1. A chest can hand over an item that does not exist, in total silence.**
`giveItem` records any id you give it. `itemName` returns the raw id and
`itemIcon` falls back to `i_unknown`. So a chest granting a DELETED item opens,
plays the item-get jingle, freezes Link in the pose, writes to the save and
hands over nothing — no error, no warning, no failing test. This happened: the
Tidewash Grotto went on granting Roc's Feather after the feather was deleted,
and `validate`, `walk-dungeons`, `test` and both replays stayed green through
it. `check-items.mjs` now walks every chest, giver, puzzle reward, cutscene
gift and dungeon declaration and asserts each names a real entry. It was
verified by re-running it against the broken data.

**2. A tiledef field the registrar does not name is discarded.**
`registerTiles` in `src/world/tileset.js` copies field by field rather than
spreading, so `liftLevel` and `liftSprite` had never reached a single tile —
`boulder` declared one, `Game.liftTile` read one, and the two had never met for
the whole life of the project. Nothing showed it because the boulder was ALSO
behind an item the player did not have yet, so the symptom had no way to
appear. Same class as the `giver` options above: data contracts drift from
engine contracts and nothing checks it. **If you add a field to a tiledef, add
it to `registerTiles` in the same commit.**

**3. Deleting an item from `ITEMS` by slicing between two banner comments will
take its neighbours with it.** Twice. The first slice ran from `feather:` to
`bombs:` and deleted five items that had been inserted between them; the second
ran from the "Seeds" banner to the "Resonance Rod" banner and took the
Ferryman's Coin, which sat between the two. Both compiled. Both passed
`validate`. `check-items.mjs` caught both within seconds, because it presses
each item's button. Delete by matching the whole entry, brace-counted, not by
slicing a range.

**4. A harness assertion that expects "nothing happened" cannot tell you why.**
`check-gates` asserted `tx === 0` for "the chasm cannot be walked across" —
which is also exactly what a key press that never arrives produces. It had been
passing for the wrong reason: `setup` left `player.carrying` dangling from the
previous probe (a direct reference that survives filtering the entity list, the
same shape as the old `player.boomerang` bug), and a carrying player refuses to
hop. Prefer assertions that expect a POSITIVE result; when you must assert a
negative, assert something else positive in the same probe.

**5. `setup` in a gate harness has to reset three things, not one.** A gate
transform with `persist: true` writes into `progress.secrets` AND into the
Room's own `override` grid, and rooms are memoised in `maps.js` — so re-entering
the room undoes neither, and a gate opened by one probe is still open for the
next. And `tide.setLevel(level)` without `{ instant: true }` starts a 23-frame
sweep during which `Game.update` returns early, so a probe that presses a
button immediately afterwards spends its whole frame budget inside the wipe and
reports a working item as broken. All three were harmless until an item in this
session moved the tide.

**6. Removing an EXTRACTED icon means editing the ripper, not the output.**
`src/data/sprites-hud.js` is generated by `tools/rip-hud.py`; deleting entries
from the generated file works right up until someone re-runs the ripper. Take
the name out of `GRID`/`RECTS` and re-emit. `pip install pillow` first, and run
the ripper once BEFORE changing anything to confirm it reproduces
byte-identically — it does, which is what makes the edit safe to read as a diff.

### The tide is still a scalar, and P6 was written not to fight P5 over it

P5 (`tide.levelAt(tx, ty)`) was being implemented in a parallel session while
this one ran, and `docs/HANDOFF.md` already records what building the same
mechanic twice costs. So P6 did **not** refactor the tide.

One item genuinely needs a local override — the Squall Bellows holds the water
back inside a cone — so `src/game/tidelocal.js` exists, and its header is
addressed to whoever merges P5. The shape is deliberately minimal:

- `game.tideAt(tx, ty)` is a one-line method on `Game`. Everything that asks
  "what is the water doing HERE" goes through it; everything that asks "what is
  the water doing" still reads `tide.level` and is right to.
- Six call sites are spatial today, all listed in that file's header.
- The Bellows' cone is an entry in `game.tideHolds`, which is a stand-in for
  P5's override list and **must not survive alongside it**.

Merging P5 should be: delete `tideLevelAt`'s body, forward to
`tide.levelAt(tx, ty)`, keep `Game.tideAt`, drop `game.tideHolds`. One function.

### Two verbs came out from behind items, and A got busier

Roc's Feather and the Power Bracelet are gone, and the hop and the lift are base
moveset. Both are genre grammar and this game gates on the tide, so a jump or a
lift behind an item was a lock wearing a costume.

The hop is **not on a button**: walking into a one-tile gap hops it, reusing
`ledgeHop` whole — one arc, one set of constants. `GAP_HOP_MAX_SPAN` is what
decides how wide a gap may be, and `check-overworld`'s flood reads that constant
rather than writing the number down, so the Coral Reef's four-tile decorative
chasm bands are still walls while its one-tile chasm is now free.

The lift is on the **context button**, which is where the Oracles put it once
you have the bracelet. The consequence is worth knowing before it looks like a
bug: **A is context-first, so standing next to a pot with an item bound to A
means the pot comes up instead.** That was already true of talking to a
villager — `tools/test.mjs` had to turn Link around before the conch section,
because the tile he was facing is one of the village rocks and it ate the press.

## The two gates that cannot be tiles

Roc's Feather and the Power Bracelet became real tile gates this session. The
other two were implemented, measured, and taken back out. The measurements are
the point — do not redo them:

**Roc's Feather travels 2.27 tiles while airborne** (28 airborne frames,
36.4px), measured by driving a real jump and sampling `player.z` and `player.x`
every frame. Everything below follows from that number.

**`Room.solidAt` lets a JUMPING player through `F.DEEP` as well as
`F.JUMPABLE`.** So deep water is not, by itself, a Flippers gate: any channel
the Feather can clear is crossed without Flippers, and the player has the
Feather from D1. A Flippers channel therefore has to be **at least 3 tiles
wide**, and so does anything meant to stop the Feather.

- **Zora's Flippers / Drowned Wood — sealed 68 of 120 screens.** At 3 tiles
  wide, gating the Wood's five crossings cuts the map in half, because the
  Drowned Wood sits in the middle of the 12x10 grid and nearly every route
  crosses it. This is a level-design fact, not a tuning problem: the Wood is a
  thoroughfare. Making it a hard gate needs the region moved or a second route
  around it, which is a map change, not a tile change.
- **Hookshot / Reef Palace — the post is always out of reach.** A span has to
  be 3 wide to stop the Feather. The player fires from the tile before the
  span, must land on solid ground, and the post has to be one tile beyond that
  landing — so the post sits 5 tiles (80px) from the player. `Hookshot.maxLen`
  is **64px at level 1** (104 at level 2). The arithmetic never closes at L1.
  A 2-wide span reaches, but the Feather crosses a 2-wide span — verified: on
  the 3-wide span a jumping player reached the second tile and no further.
  This needs an engine decision (a longer L1 hookshot) or a different mechanic.

**A gate whose action nothing fires is the failure mode to watch.** The first
Reef Palace span had no post to latch onto at all. It flooded correctly in
`check-overworld.mjs` and was impassable in play — exactly the gap the two
checkers exist to close, caught by the in-engine half.

### The two tile-finding scans are committed tools now

```
python3 tools/rip-terrain.py --scan  <ow|dg|ag> <x0> <y0> <x1> <y1>
python3 tools/rip-terrain.py --props <ow|dg|ag> <px> <py> <x0> <y0> <x1> <y1> [out.png]
```

`--props` is the counterpart to `--scan`, and it exists because **the seamless
scan cannot find a prop by construction**: a prop is exactly the thing that
does not repeat. It walks the tile grid at the phase you give it, works out the
ground colour dominating each cell's 3x3 neighbourhood, and keeps the cells
that are 25-80% ground — an object with ground showing round it, rather than
bare ground or a solid block of something else. It writes a numbered contact
sheet; read it and pick by eye, per `docs/briefs/AGENTS.md` section J.

You need the grid phase first, and the cheapest way to get it is `--scan`: any
ground tile it reports gives it to you as `(x % 16, y % 16)`. On the Ages
overworld sheet that is (2, 8).

This file used to describe the scan in prose and note that the script was not
committed, which meant the next person to need it had to rewrite it from the
paragraph. It is in the ripper now. A ground tile is the 16x16 window that
repeats at +16 in x **and** +16 in y; passing that test proves the window is
correctly phased and tiles seamlessly, which is the property terrain has to
have. It prints each distinct tile with a real origin you can paste into
`PICKS`, ranked by how much of the region it covers.

The one implementation note worth keeping: **deduplicate hits on raw bytes
before canonicalising them.** Every hit has 256 cyclic phase shifts that are
the same tile, and canonicalising every hit instead of every distinct hit is
the difference between seconds and not finishing.

What it found when it was run across the overworld sheet's green regions,
so nobody repeats the search: the sheet has exactly two seamless grass
textures worth having and **both are already extracted** — `tallgrass`
(886,1049) and `grassTuft` (1611,307). The dense herringbone at 1305,1194 that
looks like a promising base grass is `tallgrass` again at a different phase.
Base `grass` stays hand-drawn not because nobody tried but because the sheet's
only alternatives are a banded field (508,1549), a dither field (532,1500) and
a third tuft pattern (2287,670), none of which is better than the flat field
already there, and one of which would make `grass` and `tallgrass` read the
same — which matters, because `tallgrass` is the cuttable one.

### P4 was written pre-P3 and had to be redone on fixed-point, not merged

This section used to say the P4 branch could not be merged. It was right about
the reason and the reason has since been dealt with; both halves are worth
keeping, because the trap is a general one.

`claude/enemy-grid-aligned-movement-n2xv16` was written from the same base as
P2 — that is, **before P3** — and the two prompts disagreed about what a
position *is*:

```
P4:  e.x = x; e.y = y;                 // writes a float field
     if (!Number.isInteger(e.x) ...)   // guards against drift off the lattice
P3:  get x() { return toPx(this.fx); } // an accessor over integer subpixels
```

Under P3 every `e.x` is an integer by construction, so P4's realign guard would
have been **always true and quietly dead**. A textual merge would have
compiled, passed most checks, and silently dropped the one guarantee the prompt
exists to make. That is the worst outcome available, and it is why "there were
only eleven conflicts and they all resolved" is not evidence a merge is sound.

**What was actually done:** the lattice was rewritten on the subpixel grid
rather than merged onto it, which is what the objection asked for. It got
simpler, as predicted:

- a lattice point is a whole multiple of `ENEMY_GRID_STEP * FP_ONE` = **2048
  subpixels**, and `onLattice(e)` is `e.fx % 2048 === 0 && e.fy % 2048 === 0` —
  an exact integer test, which is what replaced the dead `Number.isInteger`
  guard
- `beginStep`/`advanceStep` work entirely in subpixels. Progress is recomputed
  from the step's origin every frame as `round(span * f / n)` rather than
  accumulated, and the final frame is an assignment, so no remainder can exist
- `tools/check-motion.mjs` asserts on `fx`/`fy`, never on `x`/`y`. A
  pixel-level check would pass an enemy sitting up to 255 subpixels off a
  lattice point — precisely the drift an accumulating step would produce, and
  precisely what the checker exists to catch

The knockback numbers, the lattice design and `check-motion.mjs` carried over
unchanged; only the arithmetic moved.

**The general lesson.** When two branches disagree about a representation
rather than about lines of text, the conflict markers understate the problem by
a lot: the dangerous case is the code that merges cleanly and stops meaning
anything. Before merging across a representation change, find the invariants
one side asserts and check each one is still expressible on the other side's
terms. If an assertion becomes trivially true, it has not survived the merge —
it has been deleted.

### P4 was then built a second time, in parallel, and the duplicate was binned

The note above ended with "redo P4 on fixed-point". **Two sessions read that
note and both did it**, neither aware of the other, and the second one finished
against a `main` that already had the first. Both were complete: a lattice, a
per-step turn cadence, scripted knockback, a `check-motion.mjs`, both replays
re-recorded, every checker green. The convergence was almost total — same 8px
step, same `round(span * f / n)` interpolation, same `instanceof Boss` test,
and both independently discovered that the D1 Crab Pit crabs carry
`shield: 'front'` and stall the replay actor.

The duplicate was **discarded whole**, not merged, and that was not a close
call. Two implementations of one mechanic do not combine into a better one;
they combine into a mechanic nobody can reason about. The comparison that
settled it took about ten minutes and was decided on three points where the
version already on trunk was simply better:

- it splits `PLAYER_HURT_FRAMES` from `PLAYER_KNOCK_FRAMES`, so the stun and
  the shove are separate durations rather than one number doing two jobs
- `beginStep` probes the destination before anything moves and `advanceStep`
  rewinds to the step's origin if the way closes mid-step, so a step is atomic
  and an interrupted enemy is still on the lattice
- its shield handling generalises (`shield: 'all'` as well as `'front'`, and it
  only switches axis if the perpendicular one is actually unshielded)

**How to not pay this again.** Before starting a numbered prompt, `git fetch`
and check whether `main` already contains it — the phase sections in
NEXT-SESSION.md and the "already done" list are the index, and they are only
worth anything if they are read first and written last. A stale "P4 is next"
line survived in this file's reading list even after P4 landed elsewhere in the
same file, which is exactly the kind of contradiction that starts a second
implementation. **When two statements in these docs disagree about what is
done, stop and check the repository rather than picking one.**

## Verification harnesses

**Five of these are now committed**, and that is a deliberate reversal. The
old note here said none was committed because "rewriting is better than trusting
a read-through". In practice rebuilding them from this prose reproduced five
separate harness bugs in one session — every one of which reads as a *game*
failure rather than a harness failure, which is the expensive kind. A working
harness beats an accurate description of one:

```sh
node tools/find-crossings.mjs    # every tile-level way into a region (reporter)
node tools/shoot-rooms.mjs       # screenshot named rooms in their real palettes
node tools/walk-dungeons.mjs     # every dungeon room, every ledge, all 4 faces
node tools/check-overworld.mjs   # seams, border, flood, all three item gates
node tools/solve-switches.mjs    # one push per block
node tools/check-gates.mjs       # the two item gates, in-engine, with real items
node tools/check-motion.mjs      # ground enemies on the 8px lattice, fliers off it
node tools/find-ledges.mjs       # reports where a ledge may go (not a check)
node tools/check-build.mjs       # the shipped single-file build boots from file://
```

Run the room checkers after touching any room data, and check-build.mjs after
touching anything at all — it is the only thing that proves the file the game
actually ships as still runs.

**`check-overworld.mjs` and `check-gates.mjs` are deliberately redundant, and
both are needed.** check-overworld proves the MAP side — the region is
unreachable without its item and reachable with it — but it never runs the
game, so a vane whose transform names an action nothing fires floods correctly
there and is still impassable in play. check-gates proves the ITEM side with a
live player. That gap is exactly where the two boomerang bugs below lived. The rest below are still
uncommitted and still worth rebuilding; all copy the boot pattern in
`tools/test.mjs`.

Two of them need engine internals that `main.js` does not publish. It only sets
`window.__game`; pull the rest out of the live module graph from inside the
page, which returns the same instances:

```js
await page.evaluate(async () => {
  const m = await import('/src/game/entity.js');
  window.__spawn = m.spawnEntity;              // and MAPS, getText, CUTSCENES
});
```

- **Boss harness** (brief section G) — for each of the 16 types: spawn it into
  its real arena, run ~1200 frames with the player attacking and ~1200 idle,
  and assert it moves or attacks, takes sword damage, opens a weak point if
  `shell`, reaches a later phase, damages an idle player, and dies. 264
  assertions. Three things this harness taught the hard way, which you will
  otherwise mis-attribute to the AI:
  - **Spawn minibosses on their real tile.** Bosses sit at `(4,2)`; minibosses
    at `(4,3)` or `(4,4)` depending on the dungeon. Dropping a miniboss at
    `(4,2)` puts it inside a wall, where it cannot move and looks inert.
  - **Keep the player alive between samples.** A boss that kills them drops the
    game into `gameover`, where nothing updates and *every later subject in the
    run* looks inert.
  - **Reset the game between subjects.** A boss's death drops an essence; the
    parked player collects it, which opens a text box and then an essence
    cutscene. An active dialogue freezes every entity **while `mode` stays
    `'play'`**, which is a genuinely confusing way to fail.
- **Tide probe** — hold the tide at each level for 600 frames per boss and
  record open-window percentage, distance travelled, `z` and self-healing.
  Proves the eight hooks actually differ instead of taking the comments' word
  for it. A companion probe pins the boss in place and measures how far the
  *player* is dragged, which is the only way to see Thalassor's whirlpool and
  Gustharpy's downdraught.
- **Story harness** (brief section H) — walk `MAPS` collecting every
  `dialogue`/`waiting`/`after` id any room entity references, assert each
  resolves via `getText`, then run every cutscene in `CUTSCENES` via
  `startCutscene`, pressing A/START until it completes, asserting each ends
  within 3000 frames. A cutscene that never ends soft-locks the game.

The two below predate this session and are still worth rebuilding.

- **Overworld checker** (`tools/check-overworld.mjs`) — imports
  `src/data/index.js` in plain Node (no browser), asserts all 120 screens exist, that every seam's walkable edge tiles
  agree at all three tide levels, that the world border is solid, and that a
  *tile-by-tile* flood from Tidewatch Village reaches every screen. Tile-by-tile
  matters: a screen-level flood misses an interior wall stranding an exit.
  Give it a `--bombs` mode that makes `F.BOMBABLE` passable and it also proves
  the Marsh gate: without Bombs 10 of the 12 marsh screens are unreachable, with
  Bombs all 120 are. The two boundary screens still count as reached either way,
  because the doorway pocket you stand in is inside them. Note the flood must
  treat a tile as passable if it is walkable at **any** tide level — the player
  controls the tide — which is also why this checker cannot prove the
  swim/feather gates, only the bombable one.

- **Music harness** — plays every track and asserts the scheduler advanced.
  `audio.update()` schedules against `ctx.currentTime`, so a synchronous loop of
  600 `update()` calls advances **nothing** and reports a false failure on every
  looping track; real frames have to elapse via the game's own rAF loop, and the
  context needs a keypress to unlock. Then assert every `music:` name in room,
  map and cutscene data resolves. Cutscenes are exported as **`STORY_CUTSCENES`**
  from `src/data/story.js`, not `CUTSCENES`; get that wrong and `finalBoss` and
  `ending` silently look unreferenced.

- **Ledge harness** — now best run over the *placed* ledges rather than painted
  ones: collect every `_` run out of `MAPS`, park the player on the tile above
  its middle, hold Down, and assert the landing tile is past the lip with
  `z === 0`; then park below and hold Up and assert it is refused. Four things
  that make this read as "the hop does not fire" when the hop is fine:
  **clear `game.dialogue.active` LAST**, after the room has settled, because a
  room script can reopen the box during the settle and an open dialogue freezes
  everything while `mode` is still `'play'`; **reset `mode` to `'play'` and
  refill hearts each probe**, or the first room that kills the parked player
  drops the run into `gameover` and every later probe looks inert; **hold the
  key ~22 frames, not 40**, or the player walks out of the room and arrives at
  the top of the next one, which is indistinguishable from never having moved;
  and **wait for `player.ledgeHop` to clear before measuring**, because the hop
  drives `z` along a scripted arc and mid-arc reads as a failure.
- **The dungeon walker must model Roc's Feather.** `solidAt` lets a jumping
  player through `F.DEEP` and `F.JUMPABLE` alike, and half of d4 is a one-tile
  drown-wall band — a wall at LOW and MID, deep water at HIGH — whose intended
  crossing is to raise the sea and jump it. A flood that cannot jump reports 15
  of d4's 18 rooms stranded and the dungeon unbeatable. It is not.
  The walker must also **follow warps**: floors are joined by stairs, not by
  seams, so an edge-only flood never leaves floor 0 and reports every upper
  room stranded. And the Boss Key is authored `['chest', x, y, { pickup:
  'bossKey' }]` — look for `pickup`, not `item` or `kind`.
- **Ledge harness (painting variant)** — paint a run of `ledgeS` into a live room with
  `room.setTile` and walk the player at it from each side: downhill clears it
  and lands with `z === 0`, uphill is blocked, along the lip is blocked, and a
  ledge with `cliff` behind it refuses the hop. `room.invalidate()` after
  setting tiles or the room draws from its cached bake.
- **Audio harness** — `audio.jingle(name)` sets `trackName` to
  `'$jingle:' + name`, which is what to assert on; the scheduler only advances
  over real frames. Wrapping `game.audio.jingle` and calling `presentItem` or
  `applyReward` is how to prove a moment plays the track it should.
- **Switch-puzzle solver** (`tools/solve-switches.mjs`) — the classes are
  `PushBlock` and `FloorSwitch` in `src/game/objects.js`, the switch's flag is
  `.pressed`, and `game.tryPushBlock(tx, ty, dx, dy)` takes the **block's** tile
  rather than the player's. Satisfy the puzzle's other clauses (`pz.tide`,
  `pz.enemies`) first or a switch room that also wants the room cleared reads as
  an unsolvable switch puzzle. For every room with a `switches` puzzle, call the
  engine's own `game.tryPushBlock` exactly **once** per block, park the player on
  any switch still unpressed, and assert `room._puzzleDone`. One push per block
  is the whole point: teleporting blocks onto switches passes even when the
  puzzle is unsolvable, which is how the one-tile bug above survived.
- **Dungeon walker** (`tools/walk-dungeons.mjs`) — boots headless, `enterMap`s into every room of every
  dungeon, and checks: no page errors, the room renders, no tile falls through
  to `void`, every entity type in the room resolves, every seam has a doorway
  facing its doorway, and a flood from the entrance — treating locked doors as
  walls until a key is spent, and the boss door until the Boss Key is found —
  reaches every room and the boss room. Deduplicate lock tiles when collecting
  them, or the walk spends several keys on the same door.

## Source sprite sheets are in the repo

The reference sheets live in `assets/sheets/` and are committed, so extractions
are reproducible in any checkout. All three extractors resolve their paths
relative to the repo root and produce byte-identical output to what is
committed. See `assets/sheets/README.md` for what each sheet contains, who
ripped it.

Sheets present but not yet used: non-human races and trading characters. The
HUD/Gear sheet is used by `tools/rip-hud.py`; the icons Seasons does not have
(Flippers, Mermaid Suit, Hookshot, Moon Conch, Map, Compass, and now the
Tidewright's Anchor) stay hand-drawn. The dungeon-background, fan-made
overworld, Ages overworld, Subrosia tileset and Seasons SPRING overworld sheets
are used by `tools/rip-terrain.py` for ten ground tiles and two props.

## What is left, highest value first

Art, music, dungeon interiors, the key economy and the Marsh gate are all done.
What remains, in rough order of payoff:

0. **The overworld sheet's props are 2x2 game tiles, not 1x1.** This is the
   finding that closes most of the terrain question. Measured this session:
   the bush at 1693,1307 is ~30x31, the ringed stump at 1802,1565 is ~30x28,
   and the tree was already known to be 16x32. The game's tiles are 16x16, so
   none of them extracts *into a single tile* — compositing a 2x2 source prop
   down to one game tile is authoring, not extraction. **`flowers` was the only
   prop on the sheet that fits a single cell** (2061,1469, a 14x14 leafy
   rosette) and it is now extracted and planted. Do not go looking for a
   one-cell version of the others again; the measurements above are final.

   **A correction, made after actually looking.** An earlier revision of this
   file suggested the fix was to spend two tiles on a tree and extract the
   canopy and trunk halves separately, on the reasoning that the source games
   draw a tree that way. That is true of the source games and false of *this
   sheet*. `custom-oracle-style-overworld.png` is a fan-made assembled map, and
   its trees are not standalone objects at all — they are a **connected forest
   mass**, canopies merged into each other with a root strip along the bottom
   edge of the run. There is no 16x16 or 16x32 window anywhere in it that is
   one tree. Rendered with a 16px grid over the forest at 1760,1390 this is
   obvious in one look; do that before theorising again.

   The same holds for `bush`, `rock` and `cliff`. What the sheet has are
   *masses*: a tiling foliage texture (645,1516), a tiling boulder-field
   texture (1949,1823), and no natural cliff face at all. Those tile into
   areas; they are not props you can stand next to.

   **That asset arrived.** `assets/sheets/oracle-ages-overworld.png` is the
   Labrynna Present outdoor background, and it is everything the fan-made map
   is not: real Oracle art, standalone props, on a strict 16px grid at phase
   **(2, 8)**. Everything below was found on it. Prefer it for anything
   overworld from now on.

### What the Ages overworld sheet actually yields

Found with `--props` (see below) and checked cell by cell, so nobody repeats it:

- **`rock` — extracted, AG 418,936.** A clean four-colour boulder. Slotted
  `(1, 2, 3)` rather than `(0, 2, 3)`: index 0 of `stone` is near-white and
  blew the highlight out: the boulder read as a snowball. Index 1 is only
  forbidden for *ground* palettes, where it is the field tone; `rock` sits on
  grass via `underArt` and uses `stone`, so it is free.
- **`bush` — found and deliberately NOT extracted, AG 450,920.** It is the
  sheet's real cuttable bush and it is authentic. It is also the same four-leaf
  rosette as `flowers`, so shipping it made a tile the player must cut look
  identical to one that is pure scenery — verified by rendering both in the
  `tree` palette side by side, where they are near-indistinguishable. Gameplay
  legibility beat provenance. The clean fix is to re-pick `flowers` as
  something actually floral and then take 450,920 for `bush`; the coordinates
  are here so that is a ten-minute job.
- **`grass` — checked and left alone.** The Ages base grass is a *flat* field
  with sprig decorations placed as separate tiles, so the hand-drawn flat field
  already in the game is not a worse approximation of it — it is the same idea.
  The dense weave at AG 162,952 that the seamless scan ranks first is the sheet's
  scrub, i.e. the `tallgrass` role, which is already filled.
- **`tree` — fixed, but NOT by extraction, and the failed attempt is the
  lesson.** Every tree in every Oracle sheet is 32x32. The obvious move is to
  cut one into four quadrants and let each tile draw its quarter, so a 2x2 patch
  of tree tiles becomes one whole source tree. That was built, and it looked
  broken in play: trees offset from tile to tile, half-canopies butting into
  each other.

  **Measure the data before designing against it.** The overworld's tree tiles
  are not authored in 2x2 blocks and never were:

  | shape | count |
  |---|---|
  | vertical tree runs 1 tile tall | 643 |
  | vertical runs 2 tall | 248 |
  | horizontal runs 1 wide | 341 |
  | horizontal runs 3 wide | 186 |
  | horizontal runs starting on an ODD column | 266 of 639 |

  A 32x32 object cannot be assembled out of runs that are one tile tall and
  three tiles wide. Two thirds of the tree tiles in the game had no partner to
  form a tree with, and every run starting on an odd column drew its halves in
  the wrong order — which is exactly what "offset from tile to tile" looked
  like. Column parity, neighbour-joining, run-relative indexing: none of them
  fix it, because the information needed is not in the map.

  So `tree` is a whole tree in ONE cell, drawn to match rather than extracted —
  rule 2 of `docs/ART-DIRECTION.md`, which is the correct rule when no sheet
  supplies the thing at the size needed. It carries the source's silhouette: a
  light crown, a scalloped foliage line, a flared trunk. The quadrant machinery
  (`tileFace`, `def.quad`, `QUADS`) was removed rather than left dormant,
  because leaving it invites the same wrong turn again.

  The one piece of that work worth keeping is the palettes. Trees need a
  **trunk**, and all three tree ramps were pure green because the hand-drawn
  tree they were built for had none. `treeoak`, `treeoakdk` and `treeoakdd` are
  those ramps with index 2 swapped for wood; the originals are untouched
  because `bush`, `bushSand` and `palm` still use them.

  If the overworld is ever re-authored to place trees as 2x2 blocks, the
  quadrant approach becomes right and the source coordinates are SB 224,32.
  Re-check the table above first.

- **`cliff` / `cliffTop` — the sheet's cliffs are low ledges,** one cell of
  banded rock over sand (AG 82,136 and its neighbours), not the tall faces the
  game builds plateaus from. Not obviously better than what is there.

1. **More terrain.** Ten tiles are extracted; `cliff`, `cliffTop`, `tree`,
   `bush`, `rock`, `stump` and `palm` are still hand-drawn. They are
   harder than the nine that landed because they are *structured* — a cliff
   needs a top, a face and corners, and no single 16x16 window supplies that —
   and because they carry transparency and an `underArt`. The seamless-window
   trick in `tools/rip-terrain.py`'s header does not find them; they have to be
   picked by eye from a region dump.

   **Three things a session was spent establishing, so do not redo them:**

   - There is a scan that *does* find structured terrain, and it is a one-line
     change from the ground scan: a band (cliff face, wall run, hedge) is the
     16x16 window that repeats at **+16 in x and NOT at +16 in y**. Collapse
     only the 16 *horizontal* phase shifts — vertical position is real
     information there, it is what tells a cliff top from a cliff face — and
     dedup on exact bytes before canonicalising, same as the ground scan.
     Ranked by frequency on the overworld sheet this returns desert dune
     shelves, roof tiles, plastered building walls and one grey brick wall.
   - **It returns no natural cliff face.** The overworld sheet is a fan-made
     assembled map that is mostly town and desert; its closest analogue to
     `cliff` is a sandy plateau edge, which is a corner piece, not a repeating
     face. `cliff` and `cliffTop` are the two tiles least likely to come off
     this sheet, not the most.
   - **The sheet's tree is 16 wide by 32 tall** — a canopy tile over a separate
     root/base tile — while the game's `tree` is one 16x16 with canopy *and*
     trunk. `x1760,y1400` on the overworld sheet is a clean grove to work from
     (stumps and grass tufts are in the same crop), but a straight 16x16
     extraction gives a canopy with no trunk. Compositing two source tiles into
     one game tile is authoring, not extraction, and needs an in-game
     screenshot across several regions before it is believed — `preview.mjs`
     renders a pack in one palette and cannot show it.
2. **Water is still hand-drawn** and stays that way until someone finds a
   second animation frame: both terrain sheets are static maps.
3. **More ledges, if wanted.** 88 runs are placed across all four cardinals and
   `node tools/find-ledges.mjs` reports ~660 more tiles that would take one
   without walling a room off. That is a taste ceiling now, not a technical
   one. Run the finder rather than placing by eye: a lip is SOLID from three
   sides, so a run dropped across a corridor makes rooms unreachable and still
   validates, still renders, and is only caught by a flood pass long after you
   have placed forty of them.

## Known soft spots in what has been done
- **Four legend characters were declared and never used.** `f` (flowers), `^`
  (cliffTop), `Y` (treeSand) and `P` (palm) appeared in 0 of 303 room grids, so
  their art was never rendered anywhere in the game. `f` is now placed (127
  tiles across the 40 grass screens). The other three are still dead, and all
  three are SOLID, which is the dangerous class to place — a solid tile can
  strand a room and still validate.
- **`chasm` uses the dungeon pit art**, which on open sand reads as a hard-edged
  dark rectangle with no lip. It is legible as a gap but it is the weakest new
  tile; a proper overworld chasm wants a lit rim the way `ledgeS` has one.
- **`f` resolves per region** (`flowersDark` in marsh and wood, each region's
  own ground in salt, abyss, coral and reef) rather than meaning grass-flowers
  everywhere. If you add a region legend, give it an `f`.
- **All three tile-expressible region gates now match GAME-PLAN.md**:
  Bombs/`cliffCracked` (Marsh), Magic Boomerang/`saltVane` (Salt Pans) and
  Magnetic Gloves/`abyssPlug` (Abyssal approach). The remaining plan gates —
  Feather, Bracelet, Flippers, Hookshot — are terrain-shaped rather than
  tile-shaped, so no checker can prove them; they are asserted by level design
  only. **The Salt Pans gate also holds the Reef Palace shut**, because the
  Palace's own gate is the Hookshot and the Hookshot is in D6 inside the Pans.
  That is intended and `check-overworld.mjs` encodes it in `GATES.boomerang.covers`;
  if you move a gate, move the `covers` rectangle with it.
- **Every placed ledge is a shortcut, never a route.** The selector rejected
  any run that changed the room's walking connectivity at any tide level, so no
  ledge is load-bearing and none can strand a room. That is deliberately
  conservative: it also means a ledge saves at most a ten-tile detour, because
  a room is only 10x8. Ledges here are verticality and texture first.
- **`underArt` under a ledge is one fixed tile per variant**, so where a region
  mixes grounds — sand beside salt crust, say — the two transparent rows at the
  top and foot of the drop show the variant's ground rather than the neighbouring
  tile. It is two pixels of mismatch and reads fine; matching exactly would need
  the tile to know what is beside it.
- **`itemGet`, `secret` and `heartPiece` exist in `TRACKS` but nothing plays
  them.** The engine reaches for `fanfare`/`fanfareShort` at each of those
  moments (`src/game/objects.js`, `src/game/game.js`). Wiring them up is an
  engine change, not a data one.
- The overworld's remaining item gates (Feather, Bracelet, Flippers, Hookshot)
  are terrain-shaped, so `check-overworld.mjs` cannot prove them the way it
  proves the three flag-shaped ones.
- **North-facing ledges are drawn shallower than the other three on purpose.**
  A drop facing away from the camera shows almost no face, and the nine-row
  wall that sells `ledgeS` reads as a dark stripe painted across the floor.
  `ledgeN`'s face is six rows. East and west are straight quarter-turn
  rotations of the south lip, which keeps the speckle and face weight identical.
- **`ledgeN`/`dLedgeN` sit close to a dungeon wall in silhouette**, because both
  take `stonedk` and a dungeon wall is also a dark horizontal band. The lit
  bottom lip is what separates them, and it does read in game — but if a future
  dungeon palette narrows that contrast, this is the tile that breaks first.
