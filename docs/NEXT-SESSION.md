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

Branch: claude/oracle-tides-polish-nphkj0 — fetch it. That is the current
canonical branch. `main` is an empty README; claude/zelda-style-game-piqt8v,
claude/zelda-boss-behavior-jgbfwo and claude/oracle-tides-boss-music-4c24tm
are the older line this branch was built on and are behind it, not parallel
work. Everything is committed and pushed; the tree is clean.

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
    arena in its own palette. rootmaw reads as a tree, thalassor as a gaping
    eel, thornvine's open frame as a bloom. scan-sprites --strict is 0 hard
    findings across the whole registry.
  - music: 22 tracks (14 looping + 8 jingles), two dungeon themes alternating
    across d1-d8. Every `music:` name in room, map AND cutscene data resolves.
  - every dungeon room has something to do in it: 28 formerly-plain rooms now
    carry switch, torch or clear-the-room puzzles with rewards.
  - Small Keys equal locked doors in all eight dungeons, and every switch
    puzzle is solvable by pushing (blocks move ONE tile only - see HANDOFF).
  - the Sunken Marsh is gated on Bombs via a bombable `cliffCracked` tile, at
    both of its entrances, proved with and without Bombs.
  - the status bar is rebuilt after the Oracle of Seasons / Ages HUD, and 29
    HUD and gear icons are EXTRACTED from that game's sheet rather than drawn
    (tools/rip-hud.py). Extracted icons bind their own palette, so their items
    carry no `pal` and the draw sites pass none - see HANDOFF before touching
    either.

WHAT IS LEFT - in rough order of payoff. Pick up as much as fits.

  1. Terrain art. assets/sheets/oracle-seasons-dungeon-backgrounds.png and
     custom-oracle-style-overworld.png are committed and completely unused;
     every tile in tiles-core.js is hand-drawn. ART-DIRECTION.md is explicit
     that these should be extracted from rather than approximated. This is the
     largest remaining visual upgrade in the project. Brief section J and
     tools/ripkit.py have the workflow; both existing extractors reproduce
     byte-identically, so run them first and confirm an empty git diff before
     changing ripkit.

  2. One-way ledges are DECLARED BUT NOT IMPLEMENTED. F.LEDGE exists in
     src/world/tileset.js and ledgeS sets ledge: 'down', but nothing under
     src/game ever reads either - grep and the only hits are the tileset
     assigning them. Implementing a hop-down in src/game/player.js would
     unlock real verticality in the dungeons. This is engine work, which the
     briefs put off limits for content agents; decide deliberately.

  3. Two overworld region gates still do not match GAME-PLAN.md: the Salt Pans
     want the Magic Boomerang and the Abyssal approach the Magnetic Gloves,
     and nothing in the tileset can express a gap only those items cross. The
     Marsh gate shows the shape of the fix (a tile with a flag plus a
     transform) but these two need engine support or a plan change.

  4. `itemGet`, `secret` and `heartPiece` are composed in TRACKS but nothing
     plays them - the engine reaches for fanfare/fanfareShort at each of those
     moments. Engine change, not a data one.

Do the work yourself rather than spawning subagents - past sessions hit usage
limits that way and lost the work.

VERIFICATION IS PART OF THE TASK, NOT AN OPTIONAL EXTRA
  - For art: `node tools/preview.mjs <pack> --scale=2` and actually LOOK at the
    PNG with the Read tool. preview clips to the viewport, so a higher scale
    silently drops the rightmost column. Then write a throwaway script in /tmp
    that boots headlessly, walks into each arena and screenshots it, and look
    at those too - preview renders a whole pack in ONE palette, so it shows
    silhouette but not in-game colour. Dimensional validity and "it validated"
    prove nothing about whether a sprite reads as its creature.
  - Also run `node tools/scan-sprites.mjs --strict`. It catches rows split by a
    see-through slot or shifted off the body; validate.mjs cannot see that
    class, and it is what made several sprites look broken before.
  - For anything touching dungeon data, rebuild the dungeon walker and the
    switch-puzzle solver described in HANDOFF.md under "Verification
    harnesses". Counting keys statically is NOT enough - it is exactly what
    hid seven unearnable Small Keys until a harness pushed the blocks.
  The harness patterns are all written up in docs/HANDOFF.md. Read that before
  writing one.

main.js only publishes window.__game. Anything else a harness needs
(spawnEntity, MAPS, getText, STORY_CUTSCENES) must be pulled out of the live
module graph with a dynamic import from inside the page; there is a worked
snippet in HANDOFF.md. Note MAPS is a Map keyed by map id, and holds room
definitions under `roomDefs`, whose grids are under `map` (not `rooms`, not
`grid`). Cutscenes export as STORY_CUTSCENES, not CUTSCENES.

Tell me plainly what is done, what is weak, and what you skipped.
```

---

## If you are picking this up cold, the short version

- **The game is content-complete.** Engine, world, dungeons, bosses, story, art
  and music are all done, and the dungeons are now *interesting* rather than
  merely solvable.
- **What is left is mostly engine work or a large art extraction.** The cheap
  data-only wins are gone; every remaining item on the list either needs a
  change under `src/game`, or a serious pass over the sprite sheets.
- **The biggest risk is spending context re-deriving what is already known.**
  The traps in `HANDOFF.md` under "Hard-won lessons" are all real and all cost
  hours the first time. Read them before writing code, not after a harness
  fails. Two of them were added by the pass this file describes and are the
  kind that pass every validator: a push block moves exactly one tile ever, and
  an open dialogue freezes every entity in the *next* room a harness visits.

## Commits in the pass this file describes

Four commits: the three weak sprites redrawn, the key/lock balance plus the
`dungeon2` wiring, the Marsh bomb gate, and the dungeon room puzzles with the
switch-room fix.

```sh
git log --oneline dc769da..HEAD
```

`dc769da` is the last commit of the previous pass (boss art, music, compass).
