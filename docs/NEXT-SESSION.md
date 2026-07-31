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

Branch: claude/oracle-tides-boss-music-4c24tm — fetch it. That is the current
canonical branch. `main` is an empty README; claude/zelda-style-game-piqt8v
and claude/zelda-boss-behavior-jgbfwo are the older line this branch was built
on and are behind it, not parallel work. Everything is committed and pushed;
the tree is clean.

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
  - ALL 49 boss and miniboss sprites, redrawn by hand. scan-sprites --strict
    is 0 hard findings across the whole registry, so the eight sprites that
    used to render a row detached from the body are fixed too.
  - music: 22 tracks (14 looping + 8 jingles). Every `music:` name referenced
    by room, map or cutscene data resolves to a real track.
  - i_compass now reads as a compass rather than a tablet.

WHAT IS LEFT - polish only, in rough order of payoff. Pick up as much as fits.

  1. Three sprites read weakly and are the best remaining art spend.
     `boss_rootmaw_*` reads as a green mass with a maw rather than as a TREE -
     the canopy branches are too small to carry the idea and the maw eats 18
     of the 32 columns. `boss_thalassor_*` reads closer to a coiled shell than
     to an eel with a gaping jaw. `mini_thornvine_1` is a wide oval where
     frame 0 is a clean round bloom. Everything else in the pack reads.

  2. Dungeon room interiors are correct and solvable but plain - corridors of
     pots and tide tiles. Adding `puzzle` blocks and one-way ledges to the
     middle rooms is cheap now that the structure is proved.

  3. The three overworld region gates that do not match GAME-PLAN.md. Adding a
     cracked-cliff tile to tiles-core.js plus a `bomb` transform would let the
     Marsh gate match the plan. See the overworld.js file header.

  4. Each of dungeons 5-8 carries one Small Key more than it has locked doors.

  5. `dungeon2` exists as a track but nothing references it yet. Wiring half
     the dungeons to it is a one-line-per-map change in the dungeon data.

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
  - For music: a throwaway harness that plays every track, runs ~600 ticks, and
    asserts the scheduler advanced (audio.track set, _orderIdx/_row moving) and
    nothing threw. Assert every referenced name resolves - and scan CUTSCENES
    as well as room/map data, because `finalBoss` and `ending` are referenced
    ONLY from cutscene steps in src/data/story.js.
  The harness patterns are written up in docs/HANDOFF.md under "Verification
  harnesses". Read that before writing one.

main.js only publishes window.__game. Anything else a harness needs
(spawnEntity, MAPS, getText, CUTSCENES) must be pulled out of the live module
graph with a dynamic import from inside the page; there is a worked snippet in
HANDOFF.md. Note MAPS holds room definitions under `roomDefs`, not `rooms`.

Tell me plainly what is done, what is weak, and what you skipped.
```

---

## If you are picking this up cold, the short version

- **Everything structural is finished, and so is the art and the music.** The
  game can be started, played through eight dungeons, and completed, with every
  boss drawn by hand and every region carrying its own theme.
- **What is left is taste, not scaffolding.** Three sprites that read weakly,
  dungeon interiors that are correct but plain, and a few small data
  mismatches. All of it is the kind of work where the validator happily reports
  success while the result looks or sounds wrong. Look at the output and listen
  to it; do not trust the exit code.
- **The biggest risk is spending context re-deriving what is already known.**
  The traps in `HANDOFF.md` under "Hard-won lessons" are all real and all cost
  hours the first time. Read them before writing code, not after a harness
  fails.

## Commits in the pass this file describes

Three commits: the 49-sprite boss art redraw, the music tracks, and the
compass icon. To see them without them going stale in this file:

```sh
git log --oneline f213b99..HEAD
```

`f213b99` is the last commit of the previous pass (boss behaviour, story and
sprite-integrity).
