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

Branch: claude/oracle-tides-polish-aqche8 — fetch it. That is the current
canonical branch. `main` is an empty README; claude/zelda-style-game-piqt8v,
claude/zelda-boss-behavior-jgbfwo, claude/oracle-tides-boss-music-4c24tm,
claude/oracle-tides-polish-nphkj0 and claude/oracle-tides-polish-grjnhj are the
older line this branch was built on and are behind it, not parallel work.
Everything is committed and pushed; the tree is clean.

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

Confirm the baseline before changing anything, and keep all four green:
  node tools/validate.mjs                      clean (two expected warnings
                                               about fx_slash_d0/fx_slash_d1)
  node tools/test.mjs                          35/35, 0 unauthored art names
  node tools/scan-sprites.mjs --strict         0 hard findings
  node tools/preview.mjs <pack> --scale=2      renders

test.mjs is timing-flaky under CPU load and always has been - if it goes red
right after a long harness run, wait a few seconds and re-run before believing
it. Confirm a red run by reproducing it twice. Details in HANDOFF.md, Tooling.

THREE HARNESSES ARE NOW COMMITTED - run them after touching any room data
  node tools/walk-dungeons.mjs     27 assertions: every dungeon room enters and
                                   renders, every room and boss room is
                                   reachable, and every `_` ledge run hops
                                   downhill and refuses uphill with a live
                                   player
  node tools/check-overworld.mjs   seams at all three tide levels, a solid
                                   world border, a tile-by-tile flood, and
                                   every overworld ledge. `--bombs` proves the
                                   Marsh gate: 110/120 screens without Bombs,
                                   120/120 with
  node tools/solve-switches.mjs    all 17 switch rooms, ONE push per block

These replace three of the "rebuild it yourself" harnesses HANDOFF used to
describe. Rebuilding them from prose reproduced five separate harness bugs in
one session, all of which read as game failures rather than harness failures -
that is why they are committed now. The boss harness, tide probe, story
harness, music harness and audio harness are still uncommitted and still
described in HANDOFF under "Verification harnesses".

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
  - the Sunken Marsh is gated on Bombs via a bombable `cliffCracked` tile
  - the status bar, 32 HUD and gear icons, and NINE extracted terrain tiles
  - ONE-WAY LEDGES ARE DONE. The hop is in src/game/player.js, room.solidAt
    blocks F.LEDGE on the ground, `ledgeS` is redrawn as a lit lip over a
    nine-row shadowed face, there are nine regional variants (including
    `dLedge` indoors), `_` is in every legend, and 38 curated runs are placed
    across the overworld and all eight dungeons - all 38 verified in-engine

WHAT IS LEFT - in rough order of payoff. Pick up as much as fits.

  1. More terrain. Nine tiles are extracted; cliff, cliffTop, tree, bush, rock,
     flowers, stump and palm are still hand-drawn. HANDOFF now records three
     findings from a session spent on this - read them before starting, they
     will save you the same dead end. Short version: there IS a scan that finds
     structured terrain (repeats at +16 in x and NOT in y), it returns no
     natural cliff face on the overworld sheet, and the sheet's props are 16x32
     against the game's 16x16. `flowers` at 2061,1469 on the overworld sheet is
     the one clean standalone 16x16 prop found so far. Run every rip-*.py first
     and confirm an empty git diff before changing anything shared.

  2. Two overworld region gates still do not match GAME-PLAN.md: the Salt Pans
     want the Magic Boomerang and the Abyssal approach the Magnetic Gloves, and
     nothing in the tileset can express a gap only those items cross. The Marsh
     gate shows the shape of the fix (a tile with a flag plus a transform) but
     these two need engine support or a plan change - ASK before picking one.

  3. More ledges. 38 runs are placed and 169 more rooms take one safely; the 38
     were a taste judgement, not a limit. Ledges are also south-facing only:
     `ledgeS` is the only direction the tileset declares, and `tryLedgeHop`
     already handles all four, so ledgeN/ledgeE/ledgeW are a tile-data change,
     not an engine one.

  4. Water is still hand-drawn and stays that way until someone finds a second
     animation frame: both terrain sheets are static maps, not tile palettes.

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
  - For anything touching room data, run the three committed harnesses above.

SIX TRAPS THAT PASS EVERY VALIDATOR - all cost real time to find
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
    GROUND. The first ledge took each region's ground palette and the Drowned
    Wood's drop vanished; every variant now takes its region's CLIFF palette.
  Also: ripkit.quantise is NOT deterministic when it pads a short palette.
  rip-hud.py and rip-terrain.py use their own exact quantiser instead.

main.js only publishes window.__game. Anything else a harness needs must be
pulled out of the live module graph with a dynamic import from inside the page;
there are worked examples in all three committed harnesses. Note MAPS is a Map
keyed by map id and holds room definitions under `roomDefs`, whose grids are
under `map`. Cutscenes export as STORY_CUTSCENES, not CUTSCENES.

Engine-API details a harness gets wrong on the first try:
  - enterMap is (mapId, FLOOR, rx, ry, px, py, dir) - floor is the second
    argument, and passing rx there silently lands you in the wrong room.
  - the equipped items are progress.equipB / progress.equipA.
  - after room.setTile you must call room.invalidate().
  - keys are KeyZ = B and KeyX = A (src/core/input.js), Enter = START.
  - game.tryPushBlock(tx, ty, dx, dy) takes the BLOCK's tile, not the player's.
  - reset g.mode to 'play' and refill hearts between probes, or the first room
    that kills a parked player drops the run into gameover and every later
    subject looks inert.

Tell me plainly what is done, what is weak, and what you skipped.
```
