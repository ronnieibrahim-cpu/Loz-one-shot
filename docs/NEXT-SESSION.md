# Prompt for the next session

Paste the fenced block below into a fresh Claude Code session on this repo. It
is written to be self-contained: it names the branch, the two remaining jobs,
the traps that are already paid for, and how to prove the work rather than
assert it.

Keep this file updated as work lands — it is the cheapest thing in the repo to
maintain and the most expensive thing to not have.

---

```
Continue building "Oracle of Tides", a GBC-style Zelda fan game.

Branch: claude/zelda-style-game-piqt8v — fetch it. That is the single
canonical branch: `main` is an empty README, and
claude/zelda-boss-behavior-jgbfwo is a leftover alias pointing at the same
commit, not a parallel line of work. Everything is committed and pushed; the
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
  node tools/validate.mjs                      clean (one expected warning
                                               about fx_slash_d1)
  node tools/test.mjs                          35/35, 0 unauthored art names
  node tools/scan-sprites.mjs --skip-bosses    0 hard findings
  node tools/preview.mjs <pack> --scale=2      renders

test.mjs is timing-flaky under CPU load and always has been - if it goes red
right after a long harness run, wait a few seconds and re-run before believing
it. Confirm a red run by reproducing it twice. Details in HANDOFF.md, Tooling.

WHAT IS ALREADY DONE - do not redo any of this
  - engine, renderer, tide system, save/load, menus, cutscene runner
  - the 120-screen overworld and all 8 dungeons (179 rooms, all solvable)
  - 56 enemy sprites and a 22-type enemy roster
  - all 16 boss and miniboss fights (src/data/bosses.js), verified beatable
    with a 264-assertion harness
  - every effect, pickup, object, projectile and item icon - test.mjs reports
    0 unauthored art names
  - the whole story: 20 dialogue ids, 15 cutscenes, all verified to terminate
  - sprite-integrity fixes: leaked strips and see-through holes in the
    extracted art, fixed in ripkit.py and re-extracted

TWO JOBS ARE LEFT. Work them in order, committing and pushing after each.

  1. Boss and miniboss art (49) - src/data/sprites-bosses.js, brief section C.
     BOSS_ART is 33 names at 32x32, MINIBOSS_ART is 16 at 24x24.
     What is there now is script-generated blobs: smooth, soft, low-contrast,
     and they do not read as their creatures. ART-DIRECTION.md names this exact
     failure as the thing it exists to prevent. These are the set pieces, and
     every one now has a real fight attached that the player stares at for a
     minute at a time, so this is the biggest remaining visual problem.
     Eight sprites in this pack also still have a row that renders detached
     from the body (boss_wyverna_0/_hurt, boss_nereth_2/_hurt,
     mini_reefguard_0/1). `node tools/scan-sprites.mjs` lists them. A full
     redraw fixes those by construction - do not patch the blobs.

  2. Music - src/data/audio.js, brief section I. 6 tracks exist, ~14 wanted.
     Keep the entire SFX object exactly as it is; only extend or replace
     TRACKS. The tracker format is defined in the top comment of
     src/core/audio.js. A `music:` name referenced by map data that does not
     exist in TRACKS plays nothing, silently - so assert every referenced name
     resolves.

Do the work yourself rather than spawning subagents - past sessions hit usage
limits that way and lost the work.

VERIFICATION IS PART OF THE TASK, NOT AN OPTIONAL EXTRA
  - For art: `node tools/preview.mjs <pack> --scale=2` and actually LOOK at the
    PNG with the Read tool. preview clips to the viewport, so a higher scale
    silently drops the rightmost column. Then write a throwaway script in /tmp
    that boots headlessly, spawns each boss into a room and screenshots it, and
    look at those too - preview renders a whole pack in ONE palette, so it
    shows silhouette but not in-game colour. Dimensional validity and "it
    validated" prove nothing about whether a sprite reads as its creature.
  - Also run `node tools/scan-sprites.mjs --strict`. It catches rows split by a
    see-through slot or shifted off the body; validate.mjs cannot see that
    class, and it is what made several sprites look broken before.
  - For music: write a throwaway harness that plays every track, runs ~600
    ticks, and asserts the scheduler advanced (audio.track set, _orderIdx/_row
    moving) and nothing threw.
  The harness patterns - including the three ways the boss harness misled me
  before it was right - are written up in docs/HANDOFF.md under "Verification
  harnesses". Read that before writing one.

main.js only publishes window.__game. Anything else a harness needs
(spawnEntity, MAPS, getText, CUTSCENES) must be pulled out of the live module
graph with a dynamic import from inside the page; there is a worked snippet in
HANDOFF.md.

Known-weak, fix only if it is cheap: the i_compass icon reads as a tablet
rather than a compass.

Tell me plainly what is done, what is weak, and what you skipped.
```

---

## If you are picking this up cold, the short version

- **Everything structural is finished.** The game can be started, played
  through eight dungeons, and completed. Nothing blocks that any more.
- **The two remaining jobs are both cosmetic**, and both are the kind of work
  where the validator happily reports success while the result looks wrong.
  Look at the output; do not trust the exit code.
- **The biggest risk is spending context re-deriving what is already known.**
  The traps in `HANDOFF.md` under "Hard-won lessons" are all real and all cost
  hours the first time. Read them before writing code, not after a harness
  fails.

## Commits in the pass this file describes

Eight commits, from the boss behaviour pass through to the sprite-integrity
fixes. To see them without them going stale in this file:

```sh
git log --oneline c23096c..HEAD
```

`c23096c` is the last commit of the previous pass (the enemy, overworld and
dungeon work).
