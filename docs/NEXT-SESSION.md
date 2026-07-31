# Prompt for the next session

Paste the block below into a fresh Claude Code session on this repo. It is
written to be self-contained: it names the branch, the two remaining jobs, the
traps that are already paid for, and how to prove the work rather than assert
it.

Keep this file updated as work lands — it is the cheapest thing in the repo to
maintain and the most expensive thing to not have.

---

```
Continue building "Oracle of Tides", a GBC-style Zelda fan game, on branch
claude/zelda-boss-behavior-jgbfwo (fetch it — main is an empty README, and
claude/zelda-style-game-piqt8v is an older ancestor of this branch).

Read, in this order:
  docs/HANDOFF.md        - current state, environment setup, and the traps
                           already paid for; read the setup section FIRST,
                           the Playwright browser needs a symlink shim before
                           any harness will run
  docs/GAME-PLAN.md      - authoritative: regions, 8 dungeons, items, bosses
  docs/ART-DIRECTION.md  - binding for anything visual
  docs/briefs/AGENTS.md  - authoring spec per work area, sections A-J

Confirm the baseline before changing anything: `node tools/validate.mjs` clean
(one expected warning about fx_slash_d1) and `node tools/test.mjs` 35/35 with
0 unauthored art names. Keep all three that way. Note that test.mjs is
timing-flaky under CPU load and has always been - if it goes red right after a
long harness run, wait a few seconds and re-run before believing it. Details
in HANDOFF.md under Tooling.

The engine, the 120-screen overworld, all 8 dungeons (179 rooms), the 56 enemy
sprites, all 16 boss and miniboss fights, every effect/pickup/object/item icon,
and the whole story are done and verified. Two jobs are left. Work them in
order, committing and pushing after each:

  1. Boss and miniboss art (49) - src/data/sprites-bosses.js, brief section C.
     BOSS_ART is 33 names at 32x32, MINIBOSS_ART is 16 at 24x24. What is there
     now is script-generated blobs that pass the validator and look wrong on
     screen - ART-DIRECTION.md names this exact failure as the thing it exists
     to prevent. These are the set pieces, and every one now has a real fight
     attached that the player stares at for a minute at a time.

  2. Music - src/data/audio.js, brief section I. 6 tracks exist, ~14 wanted.
     Keep the entire SFX object exactly as it is; only extend or replace
     TRACKS. The tracker format is defined in the top comment of
     src/core/audio.js. A `music:` name referenced by map data that does not
     exist in TRACKS plays nothing, silently - so check every referenced name
     resolves.

Do the work yourself rather than spawning subagents - past sessions hit usage
limits that way and lost the work.

Verification is part of the task, not an optional extra.
  - For art: `node tools/preview.mjs <pack> --scale=2` and actually LOOK at
    the PNG with the Read tool. preview clips to the viewport, so a higher
    scale silently drops the rightmost column. Then write a throwaway script
    in /tmp that boots headlessly, spawns each boss into a room and
    screenshots it, and look at those too - preview renders a whole pack in
    one palette, so it shows silhouette but not in-game colour. Dimensional
    validity and "it validated" prove nothing about whether a sprite reads as
    its creature.
  - For music: write a throwaway harness that plays every track, runs ~600
    ticks, and asserts the scheduler advanced and nothing threw.
  The harness patterns, and the three ways the boss harness fooled me before
  it worked, are written up in docs/HANDOFF.md under "Verification harnesses".

Note that main.js only publishes window.__game. Anything else a harness needs
(spawnEntity, MAPS, getText, CUTSCENES) has to be pulled out of the live
module graph with a dynamic import from inside the page - there is a worked
snippet in HANDOFF.md.

Tell me plainly what is done, what is weak, and what you skipped.
```

---

## If you are picking this up cold, the short version

- **Everything structural is finished.** The game can be started, played
  through eight dungeons, and completed. Nothing is blocking that any more.
- **The two remaining jobs are both cosmetic**, and both are the kind of work
  where the validator will happily tell you everything is fine while the result
  is bad. Look at the output; do not trust the exit code.
- **The single biggest risk is spending context on re-derivation.** The traps in
  `HANDOFF.md` under "Hard-won lessons" are all real and all cost hours the
  first time. Read them before writing code, not after a harness fails.
