# Prompt for the next session

Paste the fenced block below into a fresh Claude Code session on this repo. It
is written to be self-contained: it names the branch, the remaining jobs, the
traps that are already paid for, and how to prove the work rather than assert
it.

Keep this file updated as work lands — it is the cheapest thing in the repo to
maintain and the most expensive thing to not have.

---

```
Continue building "Oracle of Tides", a GBC-style Zelda fan game.

Branch: claude/oracle-tides-continued-ebfuit — fetch it. That is the current
canonical branch. `main` is an empty README; claude/zelda-style-game-piqt8v,
claude/zelda-boss-behavior-jgbfwo, claude/oracle-tides-boss-music-4c24tm,
claude/oracle-tides-polish-nphkj0, claude/oracle-tides-polish-grjnhj and
claude/oracle-tides-polish-3p8g1s are the older line this branch was built on
and are behind it, not parallel work. Everything is committed and pushed; the
tree is clean.

Read, in this order:
  docs/HANDOFF.md        - current state, environment setup, and every trap
                           already paid for. Read the environment section
                           FIRST: Playwright needs a symlink shim before any
                           headless harness will run, and `pip install pillow`
                           before any rip-*.py tool will. `pip install numpy`
                           too if you are going to scan a sheet.
  docs/GAME-PLAN.md      - authoritative: regions, 8 dungeons, items, bosses
  docs/ART-DIRECTION.md  - binding for anything visual
  docs/briefs/AGENTS.md  - authoring spec per work area, sections A-J

ENVIRONMENT, before anything else. Playwright asks for a browser revision the
pre-installed Chromium does not match, so every headless harness dies with
"Executable doesn't exist" until you shim it. The exact commands are in
HANDOFF under "Environment setup a fresh container needs" — check the revision
number in the error message, it was 1234 both times so far.

Confirm the baseline before changing anything, and keep all six green:
  node tools/validate.mjs                      clean (two expected warnings
                                               about fx_slash_d0/fx_slash_d1)
  node tools/test.mjs                          35/35, 0 unauthored art names
  node tools/scan-sprites.mjs --strict         0 hard findings
  node tools/walk-dungeons.mjs                 27/27, 88 ledge runs
  node tools/check-overworld.mjs               12/12, all three gates
  node tools/check-gates.mjs                    9/9, both item gates in-engine
  node tools/solve-switches.mjs                17 rooms, one push per block
  node tools/preview.mjs <pack> --scale=2      renders

test.mjs is timing-flaky under CPU load and always has been - if it goes red
right after a long harness run, wait a few seconds and re-run before believing
it. Confirm a red run by reproducing it twice. Details in HANDOFF.md, Tooling.

FIVE HARNESSES ARE COMMITTED - run them after touching any room data
  node tools/walk-dungeons.mjs     every dungeon room enters and renders, every
                                   room and boss room is reachable, and every
                                   ledge run in all four cardinals hops downhill
                                   and refuses uphill with a live player
  node tools/check-overworld.mjs   seams at all three tide levels, a solid world
                                   border, a tile-by-tile flood, every overworld
                                   ledge, and all three item gates proved BOTH
                                   ways - sealed without the item, open with it,
                                   and sealing nothing outside their own branch
  node tools/check-gates.mjs       the same two item gates in-engine with a live
                                   player and the real items: the plain
                                   boomerang must NOT open a salt vane, the
                                   Magic one must, the gloves must pull a plug
  node tools/solve-switches.mjs    all 17 switch rooms, ONE push per block
  node tools/find-ledges.mjs       reports where a ledge can go without walling
                                   a room off (a reporter, not a check)

check-overworld and check-gates are deliberately redundant and both are needed:
the first proves the MAP side but never runs the game, so a gate whose transform
names an action nothing fires floods correctly there and is still impassable in
play. That gap is exactly where two real bugs lived this session.

The boss harness, tide probe, story harness, music harness and audio harness are
still uncommitted and still described in HANDOFF under "Verification harnesses".

WHAT IS ALREADY DONE - do not redo any of this
  - engine, renderer, tide system, save/load, menus, cutscene runner
  - the 120-screen overworld and all 8 dungeons (179 rooms, all solvable)
  - 56 enemy sprites and a 22-type enemy roster
  - all 16 boss and miniboss fights (src/data/bosses.js), verified beatable
  - every effect, pickup, object, projectile and item icon
  - the whole story: 20 dialogue ids, 15 cutscenes, all verified to terminate
  - ALL 49 boss and miniboss sprites; scan-sprites --strict is 0 hard findings
  - music: 22 tracks (14 looping + 8 jingles), every name resolves, every
    jingle is played somewhere
  - every dungeon room has something to do in it; Small Keys equal locked doors
    in all eight dungeons; every switch puzzle is solvable by pushing (blocks
    move ONE tile only - see HANDOFF)
  - the status bar, 32 HUD and gear icons, and NINE extracted terrain tiles
  - ONE-WAY LEDGES ARE DONE IN ALL FOUR CARDINALS. 88 runs placed (down 38,
    right 14, up 27, left 9), 36 regional tile variants, `_ " > <` in every
    legend that declares one. All 88 verified in-engine.
  - ALL THREE TILE-EXPRESSIBLE REGION GATES ARE DONE and match GAME-PLAN:
    Bombs/`cliffCracked` (Marsh), Magic Boomerang/`saltVane` (Salt Pans),
    Magnetic Gloves/`abyssPlug` (Abyssal approach). A transform may now carry
    `level`, which is what lets a gate name the MAGIC boomerang rather than any
    boomerang.

WHAT IS LEFT - in rough order of payoff. Pick up as much as fits.

  1. More terrain. Nine tiles are extracted; cliff, cliffTop, tree, bush, rock,
     flowers, stump and palm are still hand-drawn. HANDOFF records three
     findings from a session spent on this - read them before starting, they
     will save you the same dead end. Short version: there IS a scan that finds
     structured terrain (repeats at +16 in x and NOT in y), it returns no
     natural cliff face on the overworld sheet, and the sheet's props are 16x32
     against the game's 16x16. `flowers` at 2061,1469 on the overworld sheet is
     the one clean standalone 16x16 prop found so far. Run every rip-*.py first
     and confirm an empty git diff before changing anything shared.

  2. Water is still hand-drawn and stays that way until someone finds a second
     animation frame: both terrain sheets are static maps, not tile palettes.

  3. More ledges, if wanted. `node tools/find-ledges.mjs` reports ~660 further
     tiles that would take one safely. That is a taste ceiling now, not a
     technical one - place at most one run per room and re-run the walker.

  4. The four remaining GAME-PLAN gates (Roc's Feather, Power Bracelet, Zora's
     Flippers, Hookshot) are terrain-shaped rather than tile-shaped, so no
     checker can prove them and they rest on level design alone. Giving them
     tiles the way the other three now have would make the whole progression
     machine-checkable. ASK before starting - it is a real scope call.

Do the work yourself rather than spawning subagents - past sessions hit usage
limits that way and lost the work.

VERIFICATION IS PART OF THE TASK, NOT AN OPTIONAL EXTRA
  - For art: `node tools/preview.mjs <pack> --scale=2` (or `--tiles`) and
    actually LOOK at the PNG with the Read tool. preview clips to the viewport,
    so a higher scale silently drops the rightmost column. Then boot headlessly,
    warp to each room and screenshot it, and look at those too - preview renders
    a whole pack in ONE palette, so it shows silhouette but not in-game colour.
    That is how the dungeon floor's blotchiness, a wall-textured "floor" tile
    and a ledge that vanished into the Drowned Wood's greens were all caught;
    every one of them had validated clean.
  - Also run `node tools/scan-sprites.mjs --strict`.
  - For anything touching room data, run the four committed checkers above.

NINE TRAPS THAT PASS EVERY VALIDATOR - all cost real time to find
  - A PUSH BLOCK MOVES EXACTLY ONE TILE, EVER (`once: true` by default).
  - AN OPEN DIALOGUE FREEZES EVERY ENTITY while `mode` is still 'play'. Clear
    game.dialogue.active LAST, after the room has settled - a room script can
    reopen it during the settle.
  - AN EXPLICIT PALETTE AT A DRAW SITE OVERRIDES A SPRITE'S OWN. art.js bake()
    resolves `palName || d.pal`. No item carries a `pal`; keep it that way.
  - PLATE COLOUR ENCLOSED BY A SPRITE'S OUTLINE IS ARTWORK, not background.
  - A SOURCE TILE'S CONTRAST IS NOT THE GAME'S CONTRAST. `brickf` and `stonef`
    in palettes.js are narrow ramps added for exactly that.
  - A TILE DRAWN IN ITS REGION'S OWN GROUND PALETTE DISAPPEARS INTO THAT
    GROUND. Every ledge variant takes its region's CLIFF palette for this
    reason, and the abyss plug takes `rust` because a grey plate sank into the
    abyss's blue-grey stone on the first pass.
  - A SOLID TILE IS NEVER HIT BY A PROJECTILE'S OWN RECT. The boomerang
    ricochets off it BEFORE its rect overlaps, so `checkTileAction(this.rect())`
    finds nothing and a solid gate reads as ordinary rock. `Boomerang.strikeTile`
    probes the tile past the leading edge instead. Any future "projectile opens
    a solid tile" mechanic needs the same probe.
  - AN ENTITY DROPPED FROM `game.entities` MUST BE MARKED `remove` FIRST. The
    player holds direct references to its own projectiles and the item guards
    read `.remove`. Filtering without setting it left `player.boomerang`
    dangling: throw it, change rooms, and you could never throw it again for
    the rest of the run. Nothing validated it and nothing errored.
  - A GATE TILE SITS INSIDE A SCREEN, NOT ON ITS BOUNDARY ROW, or the seam check
    fails - the two sides of the seam disagree about passability.
  Also: ripkit.quantise is NOT deterministic when it pads a short palette.
  rip-hud.py and rip-terrain.py use their own exact quantiser instead.
  Also: `>` and `<` LEDGE RUNS ARE COLUMNS, NOT ROWS. Scanning every direction
  as if it were a row reports zero east/west ledges while they sit in the data.
  A lip is SOLID from three sides, so a run across a corridor strands rooms and
  still validates - use find-ledges.mjs rather than placing by eye.

main.js only publishes window.__game. Anything else a harness needs must be
pulled out of the live module graph with a dynamic import from inside the page;
there are worked examples in all the committed harnesses. Note MAPS is a Map
keyed by map id and holds room definitions under `roomDefs`, whose grids are
under `map`. Cutscenes export as STORY_CUTSCENES, not CUTSCENES.

Engine-API details a harness gets wrong on the first try:
  - enterMap is (mapId, FLOOR, rx, ry, px, py, dir) - floor is the second
    argument, and passing rx there silently lands you in the wrong room.
  - the equipped items are progress.equipB / progress.equipA, and giveItem
    comes from src/game/progress.js.
  - after room.setTile you must call room.invalidate().
  - keys are KeyZ = B and KeyX = A (src/core/input.js), Enter = START.
  - game.tryPushBlock(tx, ty, dx, dy) takes the BLOCK's tile, not the player's.
  - reset g.mode to 'play' and refill hearts between probes, or the first room
    that kills a parked player drops the run into gameover and every later
    subject looks inert.
  - park probes on CLEAR floor. A boomerang test aimed down a row of `q` posts
    bounces off the first post and reports a working gate for the wrong reason.

Tell me plainly what is done, what is weak, and what you skipped.
```
