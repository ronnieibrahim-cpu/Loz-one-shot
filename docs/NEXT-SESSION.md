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

Branch: claude/oracle-tides-polish-grjnhj — fetch it. That is the current
canonical branch. `main` is an empty README; claude/zelda-style-game-piqt8v,
claude/zelda-boss-behavior-jgbfwo, claude/oracle-tides-boss-music-4c24tm and
claude/oracle-tides-polish-nphkj0 are the older line this branch was built on
and are behind it, not parallel work. Everything is committed and pushed; the
tree is clean.

Read, in this order:
  docs/HANDOFF.md        - current state, environment setup, and every trap
                           already paid for. Read the environment section
                           FIRST: Playwright needs a symlink shim before any
                           headless harness will run, and `pip install pillow`
                           before any rip-*.py tool will.
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

WHAT IS ALREADY DONE - do not redo any of this
  - engine, renderer, tide system, save/load, menus, cutscene runner
  - the 120-screen overworld and all 8 dungeons (179 rooms, all solvable)
  - 56 enemy sprites and a 22-type enemy roster
  - all 16 boss and miniboss fights (src/data/bosses.js), verified beatable
  - every effect, pickup, object, projectile and item icon
  - the whole story: 20 dialogue ids, 15 cutscenes, all verified to terminate
  - ALL 49 boss and miniboss sprites, drawn by hand and each checked in its own
    arena in its own palette. scan-sprites --strict is 0 hard findings across
    the whole registry.
  - music: 22 tracks (14 looping + 8 jingles). Every `music:` name in room, map
    AND cutscene data resolves, and every jingle in TRACKS is now PLAYED -
    itemGet on presentItem, heartPiece on the pickup, secret on a buried dig
    and on a puzzle reward that changes the room.
  - every dungeon room has something to do in it; Small Keys equal locked doors
    in all eight dungeons; every switch puzzle is solvable by pushing (blocks
    move ONE tile only - see HANDOFF).
  - the Sunken Marsh is gated on Bombs via a bombable `cliffCracked` tile.
  - the status bar is rebuilt after the Oracle of Seasons / Ages HUD, 32 HUD
    and gear icons are EXTRACTED from that game's sheet (tools/rip-hud.py), and
    the rest are hand-drawn to match in src/data/sprites-gear.js. No
    placeholder item icons remain. EVERY item icon binds its own palette, so no
    item carries a `pal` and no draw site passes one.
  - NINE terrain tiles are extracted from the two terrain sheets
    (tools/rip-terrain.py): grassTuft, tallgrass, sand, sandWet, sandRipple,
    mud, rockFloor, dFloor, dWall. Only the pixels changed - every tile keeps
    the palette tiles-core.js binds, so the palette-swap variants still work.
  - ONE-WAY LEDGES WORK. The hop is in src/game/player.js and room.solidAt
    blocks F.LEDGE on the ground, which is the half that makes it one-way.

WHAT IS LEFT - in rough order of payoff. Pick up as much as fits.

  1. PLACE LEDGES. The hop works and nothing uses it: `_` is in both legends in
     src/data/legends.js and appears ZERO times across all 303 room grids. This
     is now pure content work and it is the cheapest real verticality the
     dungeons can get. Two things first: `ledgeS`'s art is a thin dark line and
     does not read as the lip of a drop, so redraw it (a lit top edge over a
     short shadowed face, like the cliff tiles); and a ledge is SOLID from
     three sides, so it can strand a room the way a mis-stamped doorway can -
     rerun the dungeon walker over anything you place.

  2. More terrain. Nine tiles are extracted; cliff, cliffTop, tree, bush, rock,
     flowers, stump and palm are still hand-drawn. These are harder than the
     nine that landed: they are structured (a cliff needs a top, a face and
     corners - no single 16x16 window supplies that) and they carry
     transparency and an `underArt`. The seamless-window trick documented in
     tools/rip-terrain.py's header does NOT find them; they have to be picked
     by eye from a region dump. Run every rip-*.py first and confirm an empty
     git diff before changing anything shared.

  3. Two overworld region gates still do not match GAME-PLAN.md: the Salt Pans
     want the Magic Boomerang and the Abyssal approach the Magnetic Gloves,
     and nothing in the tileset can express a gap only those items cross. The
     Marsh gate shows the shape of the fix (a tile with a flag plus a
     transform) but these two need engine support or a plan change.

  4. Water is still hand-drawn and stays that way until someone finds a second
     animation frame: both terrain sheets are static maps, not tile palettes.

Do the work yourself rather than spawning subagents - past sessions hit usage
limits that way and lost the work.

VERIFICATION IS PART OF THE TASK, NOT AN OPTIONAL EXTRA
  - For art: `node tools/preview.mjs <pack> --scale=2` (or `--tiles`) and
    actually LOOK at the PNG with the Read tool. preview clips to the viewport,
    so a higher scale silently drops the rightmost column. Then write a
    throwaway script in /tmp that boots headlessly, warps to each room and
    screenshots it, and look at those too - preview renders a whole pack in ONE
    palette, so it shows silhouette but not in-game colour. That is exactly how
    the dungeon floor's blotchiness and a wall-textured "floor" tile were
    caught; both had validated clean.
  - Also run `node tools/scan-sprites.mjs --strict`. It catches rows split by a
    see-through slot or shifted off the body; validate.mjs cannot see that
    class, and it is what made several sprites look broken before.
  - For anything touching dungeon data, rebuild the dungeon walker and the
    switch-puzzle solver described in HANDOFF.md under "Verification
    harnesses". Counting keys statically is NOT enough - it is exactly what
    hid seven unearnable Small Keys until a harness pushed the blocks.
  The harness patterns are all written up in docs/HANDOFF.md. Read that before
  writing one.

FIVE TRAPS THAT PASS EVERY VALIDATOR - all cost real time to find
  - A PUSH BLOCK MOVES EXACTLY ONE TILE, EVER (`once: true` by default). Every
    switch puzzle in the game was authored with its blocks two-plus tiles from
    the switch, so none was solvable, and seven rewarded an unearnable Small
    Key. Blocks now sit ADJACENT to their switch.
  - AN OPEN DIALOGUE FREEZES EVERY ENTITY while `mode` is still 'play'. A
    reward's `say` from one room leaves the box open and the NEXT room a
    harness visits looks completely inert. Clear game.dialogue.active between
    rooms.
  - AN EXPLICIT PALETTE AT A DRAW SITE OVERRIDES A SPRITE'S OWN. art.js bake()
    resolves `palName || d.pal`. Every item icon now binds its own palette, so
    no item carries a `pal` and no draw site passes one. Keep it that way.
  - PLATE COLOUR ENCLOSED BY A SPRITE'S OUTLINE IS ARTWORK, not background.
    Erasing all of it punches holes through the Seed Satchel, ring box and
    gloves. rip-hud.py flood-fills from the cell border; a part-filled heart
    opts out via HOLLOW because there the bar really is showing through.
  - A SOURCE TILE'S CONTRAST IS NOT THE GAME'S CONTRAST. The extracted dungeon
    flagstone is three near-identical blues; replayed through `brick`'s full
    light-to-dark spread it became loud blotches across all 179 rooms. `brickf`
    and `stonef` in palettes.js are narrow ramps added for that.
  Also: ripkit.quantise is NOT deterministic when it pads a short palette (it
  ties on distance and the winner is not pinned down). rip-hud.py and
  rip-terrain.py use their own exact quantiser instead. If another rip ever
  starts drifting, that is why.

main.js only publishes window.__game. Anything else a harness needs
(spawnEntity, MAPS, getText, STORY_CUTSCENES) must be pulled out of the live
module graph with a dynamic import from inside the page; there is a worked
snippet in HANDOFF.md. Note MAPS is a Map keyed by map id, and holds room
definitions under `roomDefs`, whose grids are under `map` (not `rooms`, not
`grid`). Cutscenes export as STORY_CUTSCENES, not CUTSCENES.

Four engine-API details a harness gets wrong on the first try:
  - enterMap is (mapId, FLOOR, rx, ry, px, py, dir) - floor is the second
    argument, and passing rx there silently lands you in the wrong room.
  - the equipped items are progress.equipB / progress.equipA. Setting
    progress.b does nothing and the game happily keeps whatever was equipped,
    so a "the hookshot did not fire" result is usually this.
  - after room.setTile you must call room.invalidate(), or the room keeps
    drawing from its cached bake.
  - keys are KeyZ = B and KeyX = A (src/core/input.js), Enter = START.

Tell me plainly what is done, what is weak, and what you skipped.
```

---

## If you are picking this up cold, the short version

- **The game is content-complete.** Engine, world, dungeons, bosses, story, art
  and music are all done, and the dungeons are *interesting* rather than merely
  solvable.
- **What is left is one content job and one art job.** Placing ledges is pure
  data now that the hop exists. The rest of the terrain extraction is real art
  work: the easy, seamless-by-construction ground tiles have been taken, and
  what remains is structured and directional.
- **The biggest risk is spending context re-deriving what is already known.**
  The traps in `HANDOFF.md` under "Hard-won lessons" are all real and all cost
  hours the first time. Read them before writing code, not after a harness
  fails. Every one of them passes `validate.mjs` while being wrong on screen or
  unwinnable in play.

## Commits in the pass this file describes

Four: the nine-tile terrain extraction; the three silent jingles wired up
alongside two redrawn icons; the one-way ledge hop; and the docs.

```sh
git log --oneline 6bc7d59..HEAD
```

`6bc7d59` is the last commit of the previous pass (the HUD/gear extraction).
