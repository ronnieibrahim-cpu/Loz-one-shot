# Roadmap — Oracle of Tides

Written 2026-08-29, after reconciling 45 unmerged branches and auditing the
game against one standard: **would this read as a shipped Capcom/Flagship
Oracle game to someone who has played both for years?**

---

## THIS ROADMAP IS VOID IF THE SESSIONS ARE RUN IN PARALLEL

**One session at a time. Merged to `main` before the next one starts.**

This is not a stylistic preference. The reconcile that produced this file found
**sixteen** `claude/next-session-iteration-*` branches from a three-day window.
**Five of them independently found and fixed the same `Boss.phase` /
`Entity.phase` collision.** Eight independently swept and reverted the same
boss-dodge variants. Every one of those sessions did honest, competent work, and
the pile of them added up to roughly one session's worth of progress, because
each branched from a `main` that did not yet know what the last one had learned.

A session's value is not its diff. It is what the *next* session no longer has
to find out. That value is destroyed by parallelism.

Before starting any session below: `git ls-remote --heads origin` and confirm
nothing else is already doing it.

---

## What the audit found, in one page

I opened the data and ran the checkers rather than trusting `docs/`. Everything
green: `test.mjs` 59/59, `check-hearts.mjs` 114/114, `check-music.mjs` OK,
`check-playthrough.mjs` 19/19.

**The engine is in genuinely good shape and is not the problem.** Y-sorting is
correct (`depth * 1000 + y + h`). The tide field, the fixed-point positions, the
room cache stamp, the trade chain, the six dungeons, the item verbs — all of
that is real, checked, and works. The gaps are almost entirely in **presentation
and feel**, which is exactly the half no checker in the CLAUDE.md table can see.

Ranked by how badly each one breaks the "shipped Oracle game" test:

1. **There is no hitstop anywhere in `src/`.** Not a tuned-wrong value — the
   concept does not exist. Every sword hit in both source games freezes the
   game for a few frames. Ours does not. This is felt on the single most
   repeated interaction in the game.
2. **The base terrain is hand-drawn, not extracted, and has no tiling
   variants.** `src/data/tiles-core.js` is 1,683 lines of hand-authored ASCII
   pixel art — `grass`, `cliff`, `cliffTop`, `waterS0..2`, `waterD0..2`, the
   trees. Only **13** terrain tiles are extracted (`tiles-terrain.js`), plus 51
   town pieces. **There is exactly ONE grass tile**, so a grass field is one
   16×16 cell repeated with zero variation — which is precisely the visible grid
   you noticed. This directly violates CLAUDE.md's own hard rule ("If a sheet
   has it, extract it… Terrain and scenery are covered by this too").
3. **The overworld map screen is a grid of coloured rectangles.** `Menu.drawMap`
   (`src/game/menu.js:270`) runs the same `fillRect` loop for the overworld as
   for a dungeon floor, changing only the cell size. The source games draw a
   *picture* of Holodrum/Labrynna. The dungeon map, by contrast, is genuinely
   good — multi-screen rooms span cells correctly, the Chartstone pips are a
   real idea well executed. The HUD is also good and I would not touch it.
4. **Music has no intros and the synth has no vibrato, echo or arpeggio.**
5. **Four sfx calls are silent no-ops** and three defined sfx are dead.
6. **Cutscenes cannot draw a picture** and `nerethIntro` has no trigger.
7. **Bosses**: structurally not winnable except Wyverna. See below.

### Two things on your list are closer to done than you think

**NPC dialogue coverage is not 13 ids against 52 entities.** I counted it out of
the data: **57 ids written, 51 of them referenced by map data, 43 placed
talkables** (12 npc, 29 sign, 1 giver, 1 shop). Six orphans. The reactive
machinery you want *already exists and is already used* — `npc`/`sign`/`giver`
each take `dialogue`, `waiting` and `after`, and every quest-giver uses it
(`makuWait`/`makuBlocked`/`makuTree`/`makuAfter`/`makuOpened`, `ossaStart`/
`ossaWait`/`ossaEnd`/`ossaAfter`, all ten `*Trade`/`*After` pairs).

The real gap is narrower and sharper: **~21 ordinary townspeople have exactly
one line, and it never changes for the whole game.** That is pure data work
against an engine that already supports it — a *half* session, not a full one.
**I am arguing against the session you had in mind here.** See S9.

**The music is not structureless.** Several tracks already have a labelled
bridge (`village` and `title` both run `order: ['A','B','A','C']` with C
commented "Bridge:"), and `overworld` runs `['A','A','B','C','D']` with a
call-to-adventure flourish in D. What is genuinely missing is narrower than "no
structure": no **intro** (a non-looping lead-in before the loop starts), and no
**channel technique** — `src/core/audio.js` supports per-channel `duty`, `decay`
and `glide`, and nothing else. No vibrato, no echo, no arpeggio. That is the gap
worth a session, and it is half engine, half composition. See S6/S7.

### Where the bosses actually stand

The full measurement corpus is now consolidated in
**`docs/HANDOFF.md` → "Negative results — the boss-verb corpus"**. Read it before
touching a boss. The short version:

- The `Boss.phase` / `Entity.phase` collision is **fixed on `main`**. Five
  branches fixed it independently; that is done.
- **The ceiling is structural, not tactical.** A 60,000-frame *unlimited-health*
  Gohmaraq run still sticks at 14 hp forever. Gohmaraq's phase-2 charge `range`
  is 130px, covering nearly the arena — so **its melee-vulnerable range is a
  strict subset of its charge-trigger range**, and reaching swing distance
  *itself* retriggers the charge. Eight dodge/approach strategies were measured
  and reverted; seven converge on the same wall.
- **Therefore: stop tuning `dBoss`.** The remaining work is boss *design* —
  numbers in `src/data/bosses.js` — not actor AI. That is S5.
- **Wyverna is winnable right now with zero code changes**, at 8 hearts, which
  the heart-piece arithmetic says a real in-order player carries. Cheapest win
  available; confirm it first.
- Nereth's zero-hit result is diagnosed: its trident volley fires from the same
  `windUp` callback as the opening it is supposed to reward. Anemos's lash range
  (44–52px) is larger than the ~24px approach distance, by design.

### Things I found that were not on your list

- **`tools/check-camera.mjs` and `tools/check-wide-rooms.mjs` were written, and
  never merged.** Multi-screen rooms shipped to `main` *without* their two
  checkers (they are on the deleted `claude/p7-6-camera`; commit `e00b6c5`).
  A shipped feature with no checker is exactly what this project's whole method
  is against.
- **`Dialogue.speed = 1.6` is hardcoded in `src/game/dialogue.js:33`**, and
  `this.speed * (fast ? 3 : 1)` at line 86. CLAUDE.md's hard rule says *every*
  timing constant lives in `src/data/feel.js`. This one does not. It is also
  precisely the constant that sets text cadence, which is on your feel list.
- **Nothing in `feel.js` is `measured`.** All 6 shake constants are `guessed`,
  and `docs/HANDOFF.md:181` says the same of the file generally. Fidelity is the
  stated product and the numbers behind it have never been frame-stepped
  against a reference.
- **`e.charging` can stick `true` forever** (`src/game/enemy.js`) — it is cleared
  only inside `charge()`'s own `if (e.charging)` branch on a later call, so a
  phase that stops calling `charge()` never clears it. Gohmaraq's final phase
  does exactly that.

---

## If you only run one session, run S1

**S1 (impact and game feel).** Three reasons.

It is the only item on the list that is felt on **every single frame of play**.
Terrain is the bigger fidelity gap in absolute terms, but terrain is a
multi-session extraction programme; S1 is one session that changes how the whole
game feels to hold. The absence of hitstop is the loudest single "this is not a
Capcom game" signal that a player registers *with their hands* rather than their
eyes, and it is a handful of lines against an engine that is otherwise ready for
it (`game.shake()` already exists and is already wired).

And it is the session that most needs your judgment earliest, because **no
checker can ever tell you whether a hit feels good.** If S1 lands wrong you will
know in ten seconds; if it lands right, every later session is being built on
top of a game that feels correct instead of one that does not.

---

## The sessions

Ordered by what a player notices first. Each one assumes every session above it
is merged.

---

### S1 — Impact: hitstop, shake weight, and the feel constants that are missing

**Goal:** a sword hit, an enemy death and a player hit each land with the weight
they have in the source games — hitstop first, then shake and poof timing tuned
around it.

**The one thing that would make this a failure:** shipping a hitstop that
freezes the *whole game* including the HUD, the music and the tide, rather than
the entity simulation. Oracle hitstop is a simulation pause, not a frame halt.
If the music stutters on every sword swing, this session failed.

**Model: Opus.** Nothing here is checker-definable. The entire deliverable is a
judgment about weight and timing that only a person playing it can settle.

**Dependencies:** none. Start here.

**Prompt:**

> Oracle of Tides has no hitstop. The concept does not exist anywhere in `src/`
> — `grep -rn "hitstop\|hitStop\|freezeFrame" src/` returns nothing. Both source
> games freeze on a connecting hit, and its absence is the loudest thing wrong
> with how this game feels to hold. Add it, then retune the impact constants
> around it.
>
> Read `docs/HANDOFF.md`'s hard-won-lessons section and `docs/FEEL-SPEC.md`
> first.
>
> **Scope:**
> 1. **Hitstop.** A short simulation pause on a connecting hit. Three weights:
>    the player's sword landing on an enemy, an enemy or hazard landing on the
>    player, and a boss dying. It must pause the ENTITY SIMULATION ONLY. The
>    HUD, the music, the tide sweep and the screen-shake offset all keep
>    running. A hitstop that stutters the audio is a failed session — check by
>    ear, not by assertion.
> 2. **Shake.** `SHAKE_SMALL/MEDIUM/LARGE` and their `_FRAMES` in
>    `src/data/feel.js` are all marked `guessed` and were tuned with no hitstop
>    in front of them. Retune them against the new hitstop. Shake reads
>    completely differently when a freeze precedes it.
> 3. **Text speed.** `src/game/dialogue.js:33` hardcodes `this.speed = 1.6`
>    characters per frame, and line 86 hardcodes the `fast ? 3 : 1` multiplier.
>    **This violates CLAUDE.md's hard rule that every timing constant lives in
>    `src/data/feel.js`.** Move both, with units and provenance comments, and
>    tune the cadence and the text beep against the source while you are there.
> 4. **Death poof timing and the item-get pose** — check them against the source
>    and adjust if they are off. Do not rewrite them if they are already right;
>    say so instead.
>
> **Traps already paid for — do not rediscover these:**
> - **Every constant you add goes in `src/data/feel.js` with a unit and a
>   provenance word** (`measured`, `derived`, `guessed`). Never upgrade a
>   `guessed` to `measured` unless you actually frame-stepped a reference.
>   `tools/test.mjs` greps for module-level timing constants elsewhere.
> - **A five-line change to the movement or combat path is never a five-line
>   change** — the recorded replays are downstream of it. `tools/replay.mjs`
>   compares against 51 recorded baselines and hitstop WILL move every one of
>   them. Re-record them deliberately, in the same commit, and say in the commit
>   message that you did and why. Do not "fix" a replay by loosening it.
> - **Fixing timing in one place perturbs unrelated recorded timing** — see the
>   HANDOFF entry on exactly this. Expect collateral replay churn; verify it is
>   churn and not a regression by watching one.
> - Do not use `Math.random()` anywhere in `src/` — `src/core/rng.js` only.
>
> **How to prove it rather than assert it:**
> - `node tools/test.mjs`, `node tools/replay.mjs`, `node tools/check-playthrough.mjs`
>   all green, with the replays re-recorded rather than relaxed.
> - Add a `feel.js` provenance line for every constant you touch.
> - **Then stop and hand it to me.** Build with `npm run build` and tell me
>   exactly what to do in `dist/oracle-of-tides.html` to feel the difference —
>   which room, which enemy, which two things to compare.
>
> Update `docs/NEXT-SESSION.md` losslessly and commit `dist/`.

**Verified by:** `test.mjs`, `replay.mjs`, `check-playthrough.mjs` prove nothing
broke.

**NO checker can verify — you must play it:** whether the hitstop weight is
right, whether the shake now reads as impact rather than noise, whether the
music is audibly unbroken across a swing, whether text cadence matches the
source. **This is the whole point of the session.** Budget ten minutes with the
build.

---

### S2 — Terrain extraction, pass 1: the ground you stand on

**Goal:** grass, sand and the ground textures come off the sheets with enough
variants that a field stops reading as one repeated cell.

**The one thing that would make this a failure:** hand-drawing new grass
variants "to match" instead of extracting them. That is the exact failure
CLAUDE.md's extraction rule exists to prevent, and it will not be visible in any
checker.

**Model: Opus.** Extraction placement and variant selection is an eye judgment;
a checker can only prove the ripper is reproducible, not that the result reads
right.

**Dependencies:** S1 merged.

**Prompt:**

> The base terrain in this game is hand-drawn, and CLAUDE.md's hard rule says it
> should not be. `src/data/tiles-core.js` is 1,683 lines of hand-authored ASCII
> pixel art including `grass`, `grassTuft`, `tallgrass`, `cliff`, `cliffTop`,
> `cliffCracked`, `waterS0..2`, `waterD0..2` and the trees. Only 13 tiles in
> `src/data/tiles-terrain.js` are extracted. **There is exactly one `grass`
> tile**, which is why a grass field reads as one 16×16 cell on a visible grid.
>
> This session does the ground only. Cliffs, water edges and town fronts are S3
> — do not start them.
>
> Read `docs/ART-DIRECTION.md` (the authority) and `docs/briefs/AGENTS.md`
> section J (the workflow) first.
>
> **Scope:**
> 1. Check `assets/sheets/` for grass, sand and ground-texture tiles. The sheets
>    are richest in exactly this. Extract every usable variant.
> 2. Add them to `tools/rip-terrain.py`'s coordinate map and re-emit
>    `src/data/tiles-terrain.js`. **`pip install pillow` and run the ripper
>    ONCE BEFORE you change anything, to confirm it reproduces
>    byte-identically.** If it does not, stop and report that — it means the
>    generated file has been hand-edited and that is a separate problem.
> 3. Wire the variants into the renderer so a field picks among them. **The
>    variant choice must be a deterministic function of tile coordinates, not a
>    draw from the RNG stream** — see below.
> 4. Retire the hand-drawn originals from `tiles-core.js` only where an
>    extracted tile actually replaces them. Leave anything the sheets do not
>    cover alone and list it for S3.
>
> **Traps already paid for — do not rediscover these:**
> - **Never hand-edit a generated file.** Add the frame to the ripper's
>   coordinate map and re-emit. Removing a tile means removing its map entry and
>   re-emitting, not deleting output lines.
> - **Never call `Math.random()` in `src/`, and nothing in a draw path may
>   consume randomness at all** — `Game.draw` runs at display rate and a variant
>   picked from the RNG would desync every replay and make the game flicker.
>   Hash the tile coordinates. `every(e, n)` is the existing precedent for
>   hashing rather than drawing.
> - **A room's render cache is keyed on the tide field's stamp.** If a variant
>   choice depends on anything not in that key, rooms will draw stale.
> - **Animated tiles are not in the room's render cache** — water, lava and
>   torches go to `animCells`. Sampling `room.render()` alone reads them as
>   transparent. Composite `render` + `drawAnim` + `drawOver` the way
>   `drawScene` does, and hash a whole 16×16 tile, not one pixel.
> - **A solid tile can strand a room and still validate clean.** If any new tile
>   carries `F.SOLID`, run `node tools/walk-dungeons.mjs` and
>   `node tools/check-overworld.mjs` immediately, not at the end of the batch.
> - **Keep the ripper credits** in `assets/sheets/README.md` and in every
>   generated file's header.
>
> **How to prove it rather than assert it:**
> - The ripper reproduces byte-identically before your change, and re-emits
>   cleanly after.
> - `node tools/test.mjs`, `node tools/validate.mjs`,
>   `node tools/walk-dungeons.mjs`, `node tools/check-overworld.mjs`,
>   `node tools/check-towns.mjs` all green.
> - `node tools/replay.mjs` green — a terrain change should NOT move a replay;
>   if it does, your variant choice is leaking into simulation.
> - **Render screenshots** with `node tools/shoot-rooms.mjs` across several
>   overworld regions and attach them. A grass field must not show a grid.
>
> Update `docs/ART-BACKLOG.md` with what the sheets could not supply, update
> `docs/NEXT-SESSION.md` losslessly, run `npm run build` and commit `dist/`.

**Verified by:** ripper reproducibility, `validate.mjs`, `walk-dungeons.mjs`,
`check-overworld.mjs`, `check-towns.mjs`, `replay.mjs`.

**NO checker can verify — you must look:** whether the grid is actually gone,
whether the extracted grass sits right next to the still-hand-drawn cliffs, and
whether variant density reads as natural rather than noisy. `tools/preview.mjs`
renders one palette and **cannot** settle this — it needs in-game screenshots
across regions, and ideally your eye on the build.

---

### S3 — Terrain extraction, pass 2: edges, cliffs and town fronts

**Goal:** cliff edges, water edges and the town-building fronts stop betraying a
hand, and the tree borders stop repeating on a visible period.

**The one thing that would make this a failure:** severing a town screen. See
the trap below — four separate layouts died of this before `check-towns.mjs`
existed.

**Model: Opus.** Same reason as S2.

**Dependencies:** S2 merged.

**Prompt:**

> Continue the terrain extraction started in S2. That session did the ground;
> this one does the edges and the built environment, which is where a hand shows
> most.
>
> Read `docs/ART-DIRECTION.md`, `docs/briefs/AGENTS.md` section J, and
> `docs/ART-BACKLOG.md` (S2 will have left you a list of what the sheets could
> not supply).
>
> **Scope, in this order:**
> 1. **Cliff edges** — `cliff`, `cliffTop`, `cliffCracked` and the corner/base
>    pieces in `tiles-core.js` are hand-drawn. Extract replacements and the
>    full corner set. A cliff that has a top, a base and corners but no
>    *inside* corner reads wrong immediately.
> 2. **Water edges** — the shoreline transition between water and every terrain
>    it touches. This game has three tide levels, so every shoreline tile has to
>    read correctly at all three.
> 3. **Tree borders.** You reported these repeat on a visible grid. The comment
>    at `tiles-core.js:406` explains why trees are one cell each ("643 of its
>    vertical tree runs are a single row tall"). Extract variants and break the
>    period; a border of identical trees is the tell.
> 4. **Town-building fronts** — 51 pieces in `TOWN_ART`. Audit which are
>    extracted and which are authored, and close the gap.
>
> **Traps already paid for — do not rediscover these:**
> - **A ledge is solid from three sides**, and a ledge run dropped across a
>   corridor makes rooms unreachable. Use `node tools/find-ledges.mjs` to pick
>   placements. **Never place by eye.**
> - **A building is not a tile, and a town screen has ONE corridor.** Town
>   buildings are 3×3 BLOCKS — one legend character expanded by
>   `Room.expandBlocks`, which throws if the rectangle is not exactly the
>   block's size. What no throw catches: a 10×8 screen holding two 3×3 buildings
>   has exactly **one** row left crossing it, so any object three tiles wide
>   dropped in that row severs the screen — usually only at HIGH, where the tide
>   has already taken the other route. **`check-towns.mjs`'s flood is
>   deliberately ON FOOT; granting swimming hides the failure entirely.** Four
>   layouts died of this.
> - **Compositing two source tiles into one game tile is authoring, not
>   extraction**, and needs an in-game screenshot across several regions before
>   it is believed. `tools/preview.mjs` renders one palette and cannot show it.
> - **Digits 0–9 in a room grid are always tide tiles** (`src/data/legends.js`).
>   Never reuse a digit.
> - **A tiledef field the registrar does not name is discarded** —
>   `registerTiles` copies field by field, not by spread. A new tiledef field
>   means adding it in `src/world/tileset.js` too.
> - Generated files are re-emitted from the ripper's coordinate map, never
>   hand-edited. Keep the ripper credits.
>
> **How to prove it rather than assert it:**
> - Rippers reproduce byte-identically before your change.
> - `node tools/validate.mjs`, `node tools/walk-dungeons.mjs`,
>   `node tools/check-overworld.mjs`, `node tools/check-towns.mjs`,
>   `node tools/check-progression.mjs`, `node tools/replay.mjs`,
>   `node tools/test.mjs` — all green. Run the town and dungeon floods after
>   **each** tile placement batch, not once at the end.
> - Screenshots via `tools/shoot-rooms.mjs`: every town screen at all three tide
>   levels, plus one cliff region and one shoreline at all three.
>
> Update `docs/ART-BACKLOG.md` and `docs/NEXT-SESSION.md`, build, commit `dist/`.

**Verified by:** `check-towns.mjs` (severance), `walk-dungeons.mjs` and
`check-overworld.mjs` (stranding), `validate.mjs`, `replay.mjs`.

**NO checker can verify — you must look:** whether the shoreline reads as a
shoreline at all three tides, whether the tree border's period is actually
broken, whether an extracted cliff and an authored building still look like they
came from the same cartridge. Screenshots at three tide levels are the minimum;
your eye is the standard.

---

### S4 — Sound: close the silent gaps

**Goal:** every player action and world event makes a sound, and no call site is
a silent no-op.

**The one thing that would make this a failure:** adding 20 new sfx and leaving
the four existing no-ops still silent. The bugs come first.

**Model: Sonnet** for the audit and the wiring — "which call sites resolve to a
defined sfx" is exactly a checker-definable property, and the session should
*write that checker*. **The new sound design itself needs an ear**, so the
session must hand the finished set to the user to listen to before it is called
done.

**Dependencies:** S1 merged (S1 may add impact sounds).

**Prompt:**

> Audit and close the sound gaps in Oracle of Tides. `src/data/audio.js` defines
> **55** sfx (not 77 — `check-music.mjs` prints the real count) and
> `src/core/audio.js` plays them.
>
> **Bugs first — these are silent no-ops that have survived six sessions.** A
> call to an undefined sfx name does nothing, silently:
> - `sfx('swim')` — `src/game/player.js:882`
> - `sfx('hookshot')` — `src/game/items.js:516` and `src/game/items.js:1091`
> - `sfx('rumble')` — `src/game/items.js:664`
> - `sfx('secret')` — `src/game/objects.js:1200`. **This one is a wrong-function
>   bug, not a missing asset**: a `secret` JINGLE exists and is called correctly
>   as `audio.jingle('secret')` at `game.js:714`, `game.js:850` and
>   `game.js:1304`. Decide whether this site wants the jingle or its own sfx.
>
> Note that `boss` and `title` are **music tracks** played via `audio.play()`,
> not sfx — they are correct, do not "fix" them.
>
> **Three defined sfx are genuinely dead** (no call site anywhere in `src/`):
> `dig`, `pegasus`, `shoot`. Either wire them to the verb they were written for
> or remove them — do not leave them. Note that `sword1/2/3`, `switchOn/Off`,
> `cut`, `break`, `stairs` and `enemyDie` LOOK dead to a naive grep but are
> called dynamically (`player.js:658`, `objects.js:909`, `game.js:553`,
> `game.js:663`, `entity.js:158`) — leave them alone.
>
> **Then the coverage audit.** Walk the player's verbs and the world's events and
> find what has no sound at all. Check at minimum: entering and leaving water at
> each tide, the tide sweep itself, every item's B-button verb in
> `docs/ITEMS.md`, taking a ledge, a locked door refusing, a heart piece versus a
> heart container, a boss's phase change, the low-health warning, menu open and
> close, saving. Report what you find before you write sounds for it.
>
> **Write the checker.** A tool that fails when `src/` calls an sfx name that
> `src/data/audio.js` does not define is a cheap, permanent fix for the class of
> bug above, and this project's whole method says a rule worth having is worth a
> checker. Add it to `tools/`, wire it into `tools/test.mjs`, and add a row to
> CLAUDE.md's verification table.
>
> **Traps already paid for:**
> - Sfx names are sometimes built dynamically (`o.sfx || 'charge'`,
>   `tr.sfx`, `reward.sfx`, `step.sfx`, `w.sfx`). Your checker must not
>   false-positive on a data-driven name, and must not miss one either — read
>   the call sites listed above before deciding how to handle them.
> - **`jingle()` and `sfx()` read different tables.** A name in one is not a name
>   in the other. That is the `secret` bug.
> - Every timing constant lives in `src/data/feel.js`, including anything you add
>   for sound scheduling.
>
> **How to prove it rather than assert it:**
> - The new checker fails on `main` before your fix and passes after — show both.
> - `node tools/test.mjs` and `node tools/check-music.mjs` green.
> - **Then hand it to me to listen to.** Build, and tell me the specific actions
>   to perform in `dist/oracle-of-tides.html` to hear each new sound.
>
> Update `docs/NEXT-SESSION.md`, build, commit `dist/`.

**Verified by:** the new sfx-reference checker (permanently, for every future
session), `test.mjs`, `check-music.mjs`.

**NO checker can verify — you must listen:** whether each new sound is right for
its verb, whether the set is coherent, whether anything is too loud in the mix.
A checker can only prove a sound *exists*.

---

### S5 — Bosses: make the fights winnable by design, not by AI

**Goal:** all six bosses are beatable by a real player at the hearts they would
realistically carry — achieved by changing boss *specifications*, not the actor.

**The one thing that would make this a failure:** spending the session tuning
`dBoss` in `tools/actor-runtime.mjs`. Eight strategies have been measured and
reverted and seven converge on the same wall. **A ninth is disproven before you
write it.**

**Model: Opus.** "Is this fight fair" is a design judgment. The checker can only
prove a fight is *finishable by a robot*, which is not the same claim.

**Dependencies:** S1 merged (hitstop changes every fight's feel and timing).

**Prompt:**

> Make Oracle of Tides' six bosses winnable by a real player. **Read
> `docs/HANDOFF.md` → "Negative results — the boss-verb corpus" IN FULL before
> writing anything.** It consolidates sixteen sessions of measurement and it
> will save you the entire session if you skip it.
>
> **The central finding: the ceiling is structural, not tactical.** A
> 60,000-frame UNLIMITED-HEALTH Gohmaraq run still sticks at 14 hp forever. If
> infinite health does not win, no dodge and no health buffer will.
> Gohmaraq's phase-2 charge `range` is 130px, covering nearly the whole arena,
> so **its melee-vulnerable range is a strict subset of its charge-trigger
> range** — reaching swing distance itself retriggers the charge, and charges
> chain with zero idle frames between.
>
> **Therefore this session changes `src/data/bosses.js`, not
> `tools/actor-runtime.mjs`.** The actor is a measuring instrument, not a
> player; your job is to make the fights fair, and then use the instrument to
> show that you did.
>
> **Work in this order:**
> 1. **Wyverna first — she may already be won.** She is one hit short at 6
>    hearts and wins at 8 with a quarter-heart to spare, unmodified. The
>    arithmetic says a real in-order player carries 8: `check-hearts.mjs` pins
>    `PER_DUNGEON = 2`, so D1–D3 hold 6 pieces, plus 2 in `cave1`/`cave2` which
>    need no items = 8 pieces = +2 hearts on the 6-heart floor. **Confirm this
>    with a route, not arithmetic.** If it holds, that is one boss done for free.
>    Her late-phase slowdown is diagnosed: being `terrain: 'air'` she can sit in
>    room row 0, which is entirely solid, where no grounded player can reach her.
> 2. **Gohmaraq — fix the range subset.** Its phase-2 charge `range` must not
>    cover the distance a player has to stand at to swing. This is a number in
>    `bosses.js`. Changing it is the whole fix; verify it does not make the
>    fight trivial.
> 3. **Nereth — fix the volley timing.** Its trident throw
>    (`spread(..., damage: 3)`) fires from **the same `windUp` callback as the
>    opening it is supposed to reward**, so the player walks into the volley at
>    ~40px the instant the ~55-frame window starts, takes a graze, and retreats
>    for the rest of it. Every opening, all 1,860 frames. Separate the volley
>    from the opening. **Do NOT go looking for a missing conch verb — that
>    hypothesis was checked and is WRONG**; `nerethPin`'s own comment says the
>    conch only widens the window.
> 4. **Anemos** — its lash range (44/48/52 across phases) is larger than the
>    ~24px a player must reach to swing, so every approach is punished before a
>    swing is thrown. This is a designed risk/reward, not a bug, but the
>    ratio may be wrong. Judge it; change it only if you conclude it is unfair.
> 5. **Gloomtide and Rootmaw** — measure them the same way and treat what you
>    find.
>
> **Fix this live bug while you are in the file:** `e.charging`
> (`src/game/enemy.js`) is set true when a dash starts and cleared ONLY inside
> `charge()`'s own `if (e.charging)` branch on a later call. Nothing else clears
> it. **Gohmaraq's final phase never calls `charge()`, so the flag sticks true
> forever** and any verb branching on it dodges a charge that is not happening.
>
> **Traps already paid for:**
> - **`check-bosses.mjs` runs in GOD MODE and says so.** It measures fights, it
>   does not claim them. A god-mode kill is not a winnable fight.
> - **`samples: 0` is not "the weak point never opened"** — a boss that dies
>   inside the first 400-frame sampling chunk leaves zero samples. `st.beaten`
>   is ground truth. This is already fixed on `main`; do not re-break it.
> - **A harness that walks out of a boss arena reports a flawless victory** —
>   no boss, full health, reads exactly like a kill. That is what `fence()`
>   defends against.
> - **"The enemy is gone" is not "the enemy is dead."** Assert the positive fact.
> - **A tide gate must never be a boss's only vulnerability** — a pure tide gate
>   means an invulnerable boss and no way to learn otherwise.
> - **Raising the health cap is a difficulty change even when no damage value
>   moves.** If you are tempted to solve a fight with hearts, you are changing
>   the whole game's difficulty; say so explicitly and get agreement first.
> - **`Boss.phase` vs `Entity.phase` is FIXED on `main`.** Five branches fixed it
>   independently. Do not fix it a sixth time.
> - Use `tools/measure-boss-combat.mjs` (already on `main`) for real-combat
>   numbers. Do not rebuild the harness by hand — three sessions did that.
>
> **How to prove it rather than assert it:**
> - `node tools/check-bosses.mjs` green, and state plainly that it is god mode.
> - `tools/measure-boss-combat.mjs` at the in-order heart count for each boss,
>   with the before/after table in the commit message.
> - `node tools/check-playthrough.mjs`, `node tools/walk-dungeons.mjs`,
>   `node tools/check-hearts.mjs`, `node tools/test.mjs` green.
> - **Then hand each fight to me.** A robot beating a boss is not a player
>   beating a boss.
>
> Update `docs/DUNGEON-STATUS.md` and `docs/NEXT-SESSION.md`, build, commit.

**Verified by:** `check-bosses.mjs` (structure only, god mode),
`measure-boss-combat.mjs` (real combat, robot player), `check-hearts.mjs`,
`check-playthrough.mjs`.

**NO checker can verify — you must play it:** whether a fight is *fair*. Every
tool here measures a robot with a fixed approach against a boss. A human dodges,
baits and waits in ways `dBoss` structurally cannot. **A boss that the actor
cannot beat may be perfectly fair, and a boss it beats easily may be boring.**
Only you can settle either.

---

### S6 — Music engine: vibrato, echo and arpeggio

**Goal:** `src/core/audio.js` grows the three channel techniques the source
games lean on constantly, so S7 has something to compose with.

**The one thing that would make this a failure:** implementing vibrato as a
smooth sine LFO on a continuous oscillator. The Game Boy retriggers pitch on a
frame grid; a smooth analogue wobble sounds like a synth pad, not a GBC.

**Model: Sonnet.** This is a well-specified DSP task against an existing synth
with a clear reference. Correctness here is definable — `check-music.mjs`
already validates note ranges and channel roles, and can be extended.

**Dependencies:** S4 merged (both touch the audio engine; do not run them
together).

**Prompt:**

> `src/core/audio.js` is a 4-channel Game Boy-style synth (two pulse channels
> with selectable duty, a wave channel, a noise channel). It supports per-channel
> `duty`, `decay` and `glide` and **nothing else**. The source Oracle games lean
> constantly on three techniques it cannot do: **vibrato**, **echo/delay** and
> **arpeggio**. Add all three, as data-driven per-channel and per-note options.
>
> **Scope:**
> 1. **Vibrato** — a pitch wobble on sustained notes, with a delay before onset
>    (the source almost never wobbles from the attack), a rate and a depth.
>    **It must step on a frame grid, not glide smoothly** — the hardware
>    retriggers pitch per frame and a smooth LFO sounds wrong immediately.
> 2. **Echo** — the classic GBC trick of a quieter, delayed repeat of the lead
>    on the second pulse channel. Decide whether this is a channel config or a
>    pattern-authoring convention and say why in a comment.
> 3. **Arpeggio** — a fast cycle through a chord's notes on one channel,
>    standing in for polyphony the hardware does not have. This is how the
>    source fakes chords.
>
> All three must be expressible in `src/data/audio.js`'s existing pattern format
> without breaking the 22 tracks already written. **A track that does not ask for
> the new options must sound byte-identical to how it sounds now** — prove it.
>
> **Traps already paid for:**
> - **Every timing constant lives in `src/data/feel.js`** with a unit and a
>   provenance comment. Vibrato rate and echo delay are timing constants.
> - **Nothing in a draw path may consume randomness**, and nothing here should
>   consume randomness at all. `src/core/rng.js` only, if you somehow need it.
> - `check-music.mjs` already asserts that every note is inside the Game Boy's
>   real frequency range for its channel and that the noise channel carries only
>   percussion. **Vibrato depth can push a note out of range at the extremes** —
>   extend the checker to validate the vibrato-swung extremes, not just the
>   written pitch.
> - The noise channel takes percussion only. Do not give it vibrato.
>
> **How to prove it rather than assert it:**
> - `node tools/check-music.mjs` green, extended as described.
> - `node tools/test.mjs` green.
> - **Render the same track before and after with no new options set, and show
>   the output is unchanged.** A regression here is silent.
> - **Then hand me one track using each technique** so I can hear whether the
>   vibrato is GBC-shaped or synth-shaped.
>
> Do NOT recompose the existing tracks — that is S7. Update
> `docs/NEXT-SESSION.md`, build, commit `dist/`.

**Verified by:** `check-music.mjs` (extended for vibrato extremes), byte-identical
render of untouched tracks, `test.mjs`.

**NO checker can verify — you must listen:** whether the vibrato sounds like a
Game Boy or like a synthesiser. This is the single judgment the session turns on
and there is no assertion for it.

---

### S7 — Music composition: intros and longer forms

**Goal:** the tracks stop being 8-bar loops — they get intros and enough
material that a player standing in a town for two minutes does not hear the same
eight bars fifteen times.

**The one thing that would make this a failure:** making tracks longer by adding
patterns that are variations of A. Length without development is worse than a
short loop, because it delays the repeat without hiding it.

**Model: Opus.** Composition is the definition of a judgment call.

**Dependencies:** S6 merged. This session needs vibrato/echo/arpeggio to exist.

**Prompt:**

> Oracle of Tides has 22 tracks in `src/data/audio.js`. Each is 3–4 patterns of
> 32 rows at `rowsPerBeat: 4` — **2 bars per pattern, ~8 bars per loop.** The
> source games' equivalents run considerably longer before repeating and open
> with a non-looping intro.
>
> **Be accurate about what is already there** — the audit found the framing
> "no bridge" is wrong. `village` and `title` both run `order: ['A','B','A','C']`
> with C explicitly commented as a bridge, and `overworld` runs
> `['A','A','B','C','D']` with a call-to-adventure flourish in D. **Do not
> rewrite what works.** What is genuinely missing:
> 1. **No track has an intro** — a non-looping lead-in played once before the
>    loop begins. The engine's `order`/`loop` model has no concept of one. Add
>    it (engine + data), then write intros where they earn their place. Not
>    every track wants one.
> 2. **Loop length.** Extend the tracks that a player hears longest — the
>    overworld, the towns, the dungeon themes — with genuinely NEW material, not
>    variations of A. If you cannot say in one sentence what a new pattern does
>    that the existing ones do not, do not add it.
> 3. **Use S6's vibrato, echo and arpeggio.** They exist now, and they are most
>    of what makes a source track sound like a source track rather than a
>    chiptune approximation. Sustained lead notes want vibrato; the second pulse
>    wants echo behind the lead; the wave channel wants arpeggios where the
>    harmony needs a chord.
>
> **Goal 2 still binds: the music is ours.** Borrow the genre's grammar — the
> fanfare gesture, the call-and-response, the modal shifts — never a melody.
> `overworld`'s pattern D already has a comment explaining exactly this
> distinction; follow it, and see `docs/HANDOFF.md` on why the literal Hyrule
> theme is not reproduced here.
>
> **Traps already paid for:**
> - `check-music.mjs` asserts every track's `order` references only patterns that
>   exist, no melodic channel holds a note that was never struck, every note is
>   inside the Game Boy's real frequency range for its channel, and the noise
>   channel carries only percussion. **An intro section is new structure — extend
>   the checker to cover it** rather than letting intros go unvalidated.
> - Every timing constant (tempo included, if you touch it) belongs in
>   `src/data/feel.js`.
> - `Game.draw` runs at display rate; music scheduling must not depend on it.
>
> **How to prove it rather than assert it:**
> - `node tools/check-music.mjs` green, extended for intros.
> - `node tools/test.mjs` green.
> - **Then hand me the three longest-heard tracks** — overworld, a town, a
>   dungeon — and tell me where to stand to hear a full loop.
>
> Update `docs/NEXT-SESSION.md`, build, commit `dist/`.

**Verified by:** `check-music.mjs` (structure, note ranges, channel roles),
`test.mjs`.

**NO checker can verify — you must listen:** whether the new material is
development or padding, whether the intros earn their place, and whether the
tracks now sound like a shipped game. A checker can prove a note is legal. It
cannot prove a phrase is good.

---

### S8 — The overworld map screen becomes a picture

**Goal:** opening the map on the overworld shows a drawn map of Thalassia, the
way the source games show Holodrum and Labrynna — not a grid of rectangles.

**The one thing that would make this a failure:** breaking the dungeon map,
which is genuinely good and shares this code path.

**Model: Opus.** This is a piece of art and a layout judgment.

**Dependencies:** S2 and S3 merged (the map should reflect the final terrain).

**Prompt:**

> `Menu.drawMap` (`src/game/menu.js:270`) draws the overworld map with the same
> `fillRect` grid loop it uses for a dungeon floor, changing only the cell size
> (8 vs 10). A player opening the map sees coloured squares. **In both source
> games the overworld map is a drawn picture of the land with recognisable
> landmarks**, and it is one of the screens a player looks at most.
>
> **The dungeon map is NOT the problem and must not regress.** It is genuinely
> good: multi-screen rooms correctly span cells (read the comment at
> `menu.js:284` — drawing every covered cell would paint a 2×1 room as two rooms
> with a seam, "exactly the lie the whole feature is against"), and the
> Chartstone tide-pips are a strong original idea, well executed. Leave it alone
> except to split the code path.
>
> **Scope:**
> 1. Split the overworld map from the dungeon map so they no longer share a
>    drawing routine.
> 2. Draw Thalassia as a picture: coastline, the regions, the towns, the
>    dungeon entrances as landmarks. Extract from `assets/sheets/` anything the
>    source map screens can supply; draw the rest to match, at three colours plus
>    transparency with a hard 1px black outline, per `docs/ART-DIRECTION.md`.
> 3. Keep every piece of information the grid currently carries: which screens
>    have been seen, where the player is now, and what the Chartstone reveals.
>    **A prettier map that tells the player less is a regression.**
> 4. The player marker must be legible against every part of the drawn map —
>    the source games blink it for exactly this reason.
>
> **Traps already paid for:**
> - **Do not instantiate rooms to draw the map.** The current code reads from the
>   room DEFINITION and says why: "an instantiated room is one `liveRooms` will
>   then save and restore the state of." Reading live rooms to draw a map would
>   silently corrupt save state.
> - `Game.draw` runs at display rate and **nothing in a draw path may consume
>   randomness.**
> - **Canvas 2D anti-aliases every path fill and there is no flag to stop it** —
>   see `docs/HANDOFF.md`. Draw the map from tiles/sprites or integer
>   `fillRect`s, never from paths, or it will be soft against a pixel-art game.
> - Three colours plus transparency, 1px black outline, no gradients, no
>   anti-aliasing. Light dithering on terrain only.
>
> **How to prove it rather than assert it:**
> - `node tools/test.mjs`, `node tools/replay.mjs`,
>   `node tools/check-playthrough.mjs` green.
> - **Screenshot the dungeon map before and after and show it is unchanged**,
>   including a multi-screen room and the Chartstone pips.
> - Screenshot the new overworld map at three states: nothing explored, partly
>   explored, fully explored with the Chartstone.
> - **Then hand it to me.**
>
> Update `docs/NEXT-SESSION.md`, build, commit `dist/`.

**Verified by:** `test.mjs`, `replay.mjs`, `check-playthrough.mjs`, plus
before/after dungeon-map screenshots proving no regression.

**NO checker can verify — you must look:** whether the map reads as a map of a
real place, whether it matches the terrain S2/S3 built, whether the player
marker is findable at a glance. Nothing can assert any of that.

---

### S9 — Townspeople react to the plot (HALF SESSION — I am arguing your scope down)

**Goal:** ordinary townspeople's lines move with the story, so the world
acknowledges what the player has done.

**The one thing that would make this a failure:** rewriting the existing lines.
The writing is good. This session adds states; it does not re-voice anybody.

**Model: Opus** — it is writing. But **scope it as half a session**: pair it with
S10, or accept a short one.

**Dependencies:** none strictly; run it after S5 so the lines can react to
beaten bosses.

**Prompt:**

> **First, correct the premise you may have been given.** The audit counted this
> out of the data: `src/data/story.js` defines **57 dialogue ids**, **51 of them
> are referenced by map data**, and there are **43 placed talkables** (12 `npc`,
> 29 `sign`, 1 `giver`, 1 `shop`). Coverage is not the problem. Six ids are
> orphans: `netMender`, `signCoast`, `villager3`, `elder1`, `child1`,
> `shopkeeper2` — either place them or delete them, but decide.
>
> **The reactive machinery already exists and is already used.** `npc`, `sign`
> and `giver` entities each accept `dialogue`, `waiting` and `after` options, and
> every quest-giver uses them: `makuWait`/`makuBlocked`/`makuTree`/`makuAfter`/
> `makuOpened`, `ossaStart`/`ossaWait`/`ossaEnd`/`ossaAfter`, `diggerWait`/
> `digger`/`diggerAfter`, and all ten `*Trade`/`*After` pairs. **No engine work is
> needed unless you find the two-state model genuinely insufficient** — and if
> you do, say so explicitly rather than quietly building a third system.
>
> **The actual gap:** roughly 21 ordinary townspeople have exactly ONE line that
> never changes for the entire game — `villager1`, `villager2`, `villageChild`,
> `shopkeeper`, `hearthWife`, `hearthChild`, `sandpiper`, `shoreSalter`,
> `timberSalter`, `sandpiperKid`, `faroreHome`, `coastFisher`, `fisher1`,
> `coastChild`, `wreckSurvivor`, `coralDiver`, `reefFisher`, `bogWitch`,
> `stoneFisher`, `woodChild`, `salterElder`. In the source games a townsperson's
> line moves with the plot; ours do not.
>
> **Scope:**
> - Give each ordinary townsperson at least one additional state keyed to a story
>   beat that a player in that town would plausibly know about — an Essence
>   taken, a dungeon cleared, the tide behaving differently, a trade completed.
> - **Do not rewrite the existing lines.** They are good and they establish the
>   voice: the four peoples of Thalassia say what they think of each other by
>   complaining, never by exposition. Match that register exactly. A new line
>   that explains the plot is wrong for this game.
> - Keep the format: three short lines, no line much past 34 characters without a
>   `\n` or a space to break on.
>
> **Traps already paid for:**
> - **An id the map asks for and `story.js` does not define shows an EMPTY BOX**,
>   silently. That is the failure mode; guard against it.
> - **Changing what an NPC IS can move an item out of the field a checker reads.**
>   If you touch a `giver` or the shop, re-run `check-items.mjs` and
>   `check-trade.mjs`.
> - **Converting an existing NPC into a trader is free; adding one is not** — see
>   `docs/HANDOFF.md`. Do not add NPCs to hang lines on; use the ones placed.
> - **A townsperson standing on the one tile that severs a town screen breaks
>   it** — if you move anybody, `check-towns.mjs` immediately.
>
> **How to prove it rather than assert it:**
> - A checker (or an extension of an existing one) proving **every id referenced
>   by map data is defined, and every defined id is referenced** — the empty-box
>   bug, permanently closed. Wire it into `tools/test.mjs`.
> - `node tools/check-towns.mjs`, `node tools/check-trade.mjs`,
>   `node tools/check-items.mjs`, `node tools/test.mjs` green.
> - Walk one town at three story stages and paste the lines you get.
>
> Update `docs/NEXT-SESSION.md`, build, commit `dist/`.

**Verified by:** the new dialogue-reference checker, `check-towns.mjs`,
`check-trade.mjs`, `check-items.mjs`.

**NO checker can verify — you must read them:** whether the new lines sound like
the same people, and whether the reactions land at the right beat. A checker can
prove a line exists and is reachable. It cannot prove it is in voice.

---

### S10 — Cutscenes can draw a picture, and Nereth gets an entrance

**Goal:** `src/game/cutscene.js` gains visual steps, and the orphaned
`nerethIntro` actually plays.

**The one thing that would make this a failure:** building a general animation
system. Add the specific steps the 13 existing cutscenes need and stop.

**Model: Opus** for what the scenes should show; the engine steps themselves are
mechanical.

**Dependencies:** S5 merged (`nerethIntro` is a boss intro).

**Prompt:**

> `src/game/cutscene.js` is 146 lines with a rich step vocabulary — `music`,
> `jingle`, `sfx`, `flag`, `shake`, `face`, `give`, `spawn`, `despawn`, `warp`,
> `tide`, `do`, `text`, `fade`, `say`, `wait`, `walk` — and **not one step that
> draws anything.** It can move the world and talk about it; it cannot show a
> picture. `src/data/story.js` defines 13 cutscenes (`intro`, `essence1..6`,
> `essenceGeneric`, `makuSatchel`, `makuMaster`, `nerethIntro`, `ending`,
> `tradeKettle`) all working within that limit.
>
> **`nerethIntro` (`story.js:237`) has no trigger anywhere in `src/`.** It is
> written and it has never played. Wire it to Nereth's boss room.
>
> **Scope — add only the steps the existing scenes actually want:**
> 1. A camera step: pan to a point, hold, return. The source uses this constantly
>    to show a door opening across the room.
> 2. A sprite/image step: draw a specific sprite or full-screen image for a
>    number of frames.
> 3. Whatever the 13 existing scenes are visibly working around. **Read all 13
>    first and let them tell you what is missing** — do not design the vocabulary
>    up front.
> 4. Then use the new steps to make the scenes that most need them land: the
>    opening, the essence gets, `nerethIntro`, and the ending.
>
> **Resist scope creep.** A general timeline/animation system is not the goal and
> will not be finished. Concrete steps, driven by the scenes that exist.
>
> **Traps already paid for:**
> - **Every boss's dramatic reveal used to render as an EMPTY ROOM** for the
>   whole life of the project — a health bar and no boss — because a field-name
>   collision set `hidden = true` during the intro. Fixed on `main`. **The lesson
>   stands: headless assertions proved the boss EXISTED the whole time; nothing
>   proved it was VISIBLE.** Screenshot every cutscene you touch.
> - **`Game.draw` runs at display rate and nothing in a draw path may consume
>   randomness.** Cutscene timing must be driven by logic frames.
> - **Every timing constant lives in `src/data/feel.js`** — pan speeds, hold
>   durations, fade lengths.
> - **A cutscene that warps or sets a flag is on the progression path.** Run
>   `check-progression.mjs` and `check-playthrough.mjs` after any `warp`, `flag`
>   or `give` change.
> - The camera already exists (`src/game/camera.js`, a deadzone follower that is
>   a no-op in a one-screen room). Use it; do not write a second one.
>
> **How to prove it rather than assert it:**
> - `node tools/check-playthrough.mjs`, `node tools/check-progression.mjs`,
>   `node tools/walk-dungeons.mjs`, `node tools/replay.mjs`,
>   `node tools/test.mjs` green.
> - **A screenshot of every cutscene you touch, mid-scene.** The trap above is
>   exactly why.
> - Prove `nerethIntro` fires by reaching Nereth's room in the harness.
>
> Update `docs/NEXT-SESSION.md`, build, commit `dist/`.

**Verified by:** `check-playthrough.mjs`, `check-progression.mjs`, `replay.mjs`,
`test.mjs`, plus a trigger test for `nerethIntro`.

**NO checker can verify — you must watch them:** whether a scene reads
dramatically, whether the pacing is right, whether a pan lands where the eye
expects. Watch all 13 end to end.

---

### S11 — Recover the orphaned checkers and pay down the feel.js measurement debt

**Goal:** multi-screen rooms get the two checkers that were written for them and
never merged, and `feel.js` stops being entirely guesses.

**The one thing that would make this a failure:** marking constants `measured`
without actually frame-stepping a reference. That word has a specific meaning
here and inflating it destroys the file's value permanently.

**Model: Sonnet** for the checker recovery (mechanical, and the checkers define
their own correctness). **Opus** for the frame-stepping, which is measurement
against a reference only a person can perform.

**Dependencies:** S1 merged (S1 will have moved several of these constants).

**Prompt:**

> Two jobs, both paying down debt the audit found.
>
> **Job 1 — recover two orphaned checkers.** Multi-screen rooms shipped to `main`
> (the camera, `room.pw`/`room.ph`, `size` in screens, the map screen's
> cell-spanning) **without their checkers.** `tools/check-camera.mjs` (170 lines)
> and `tools/check-wide-rooms.mjs` (320 lines) were written on the branch
> `claude/p7-6-camera`, commit `e00b6c5`, which has since been deleted as stale.
> **If the branch is gone, rewrite them from scratch against the current
> engine** — do not try to resurrect a deleted ref, and do not port code you
> cannot read.
>
> What they must prove: a room declaring a size in screens is internally
> consistent; the camera's deadzone follower behaves at every room size and is
> a genuine no-op in a one-screen room; the internal seams between screens are
> not boundaries; a wide room's exits are on its outer edge only. Wire both into
> `tools/test.mjs` and add rows to CLAUDE.md's verification table.
>
> **A shipped feature with no checker is exactly what this project's method is
> against**, which is the whole reason this job exists.
>
> **Job 2 — measure the feel constants.** `docs/HANDOFF.md:181` says "Nothing in
> `feel.js` is `measured`." Every value is a guess, in a project whose stated
> first goal is fidelity. Frame-step a reference and convert as many as you
> honestly can, starting with the ones a player feels most: walk speed, sword
> swing duration, knockback distance and duration, invulnerability frames, room
> transition duration, text speed (S1 will have moved this into the file).
>
> **The rule on the word `measured` is absolute: it means someone actually
> frame-stepped a reference and wrote the number down.** If you cannot measure
> one, leave it `guessed` and say why. **A derivation you cannot measure should
> be written down and left unapplied** — that is already a hard-won lesson in
> HANDOFF. Do not quietly upgrade provenance.
>
> **Traps already paid for:**
> - **Changing a feel constant moves every recorded replay.** `tools/replay.mjs`
>   compares 51 baselines. Re-record deliberately, in the same commit, and say
>   so. Never loosen a replay to make it pass.
> - **A test that fails intermittently is a real bug, not load flakiness.** If a
>   seeded run varies, the non-determinism is in initialisation order. Find it.
>   **Never add a retry.**
> - **Positions are 8.8 fixed-point.** Do not reintroduce float positions and do
>   not use `| 0` to floor a coordinate — it truncates toward zero and misrounds
>   across x=0, which happens on every room transition.
> - **Diagonal movement is deliberately not normalised.** Diagonal is faster than
>   cardinal and that is a signature of the source games. Do not "fix" it.
>
> **How to prove it rather than assert it:**
> - Both new checkers pass, and **demonstrably fail when fed a deliberately
>   broken room** — show that, or they prove nothing.
> - `node tools/test.mjs`, `node tools/replay.mjs`,
>   `node tools/check-playthrough.mjs` green.
> - A table in the commit message: constant, old value, new value, provenance,
>   and what reference was stepped.
>
> Update `docs/NEXT-SESSION.md` and CLAUDE.md's table, build, commit `dist/`.

**Verified by:** the two recovered checkers (permanently), `test.mjs`,
`replay.mjs`, `check-playthrough.mjs`.

**NO checker can verify — you must judge:** whether a re-measured constant makes
the game feel more like the source or merely more like the number. A measurement
can be correct and still wrong for this game, since our sprites and rooms are
not the source's. **Play it after every batch.**

---

## What I am arguing against

**Do not run another boss-AI tuning session.** Eight strategies have been
measured and reverted; seven converge on one wall. The corpus is in HANDOFF. S5
changes boss *data* instead, and if that does not settle it the answer is a
design change, not a ninth dodge variant.

**Do not run a full session on "NPC dialogue coverage."** The premise is wrong —
51 of 57 ids are wired and the reactive machinery is already built and already
used by every quest-giver. S9 is half a session.

**Do not touch the HUD.** The tide gauge, the bracketed item slots, the heart row
and the rupee counter are right. There is nothing to gain.

**Do not touch the dungeon map screen** except to split it from the overworld
map in S8. Multi-screen room spanning and the Chartstone tide-pips are among the
best original ideas in the game and they are already executed well.

**Do not rewrite the NPC dialogue.** The voice is established and good.

**Do not add a retry to any flaky test.** That is already a hard rule and it has
already been paid for.

---

## Session budget

| # | Session | Model | Depends on | Needs your eye/ear |
|---|---|---|---|---|
| S1 | Impact and game feel | Opus | — | **Yes — critically** |
| S2 | Terrain extraction: ground | Opus | S1 | Yes |
| S3 | Terrain extraction: edges and towns | Opus | S2 | Yes |
| S4 | Sound coverage and the sfx checker | Sonnet | S1 | Yes (listen) |
| S5 | Bosses winnable by design | Opus | S1 | **Yes — critically** |
| S6 | Music engine: vibrato, echo, arpeggio | Sonnet | S4 | Yes (listen) |
| S7 | Music composition: intros and forms | Opus | S6 | **Yes — critically** |
| S8 | Overworld map becomes a picture | Opus | S2, S3 | Yes |
| S9 | Townspeople react (half session) | Opus | S5 | Yes (read) |
| S10 | Cutscenes draw pictures; Nereth's intro | Opus | S5 | Yes (watch) |
| S11 | Orphaned checkers; feel.js measurement | Sonnet + Opus | S1 | Yes |

Seven of eleven need Opus, and **every one of them needs you** at the end. That
is not a scheduling flaw — it is what "would this read as a shipped Oracle game"
actually means. The judgment sessions are front-loaded on purpose: S1, S2 and S5
are the three that most need your eye, and they are first, second and fifth.


---

## Appendix — the branch reconcile of 2026-08-29

72 branches existed on `origin` besides `main`. Every one was assessed. The
decisions are below; the harvest is in `docs/HANDOFF.md` → "Negative results —
the boss-verb corpus" and in `docs/GUIDE.md` / `docs/GUIDE.html`.

**Deletion could not be executed from the session** — this environment's git
proxy refuses delete refspecs with HTTP 403, and the GitHub MCP server exposes
no delete-branch tool. Pushes work; only deletes are blocked. **The command is
below for you to run.** Nothing in this appendix depends on the deletion having
happened; the value was harvested first, on purpose.

### MERGED — taken onto `main` in commit `db48311`

| Branch | Why |
|---|---|
| `claude/guide-walkthrough-revision-jgs0uf` | **Real unmerged work.** `check-guide.mjs` was failing 3/4 on `main` — the guide had drifted six heart pieces behind the world and never mentioned the Kilnshell. Its `GUIDE.md` passes 4/4 against `main`'s current data. Took `GUIDE.md`, its mobile `GUIDE.html` build (which `main` lacked entirely), and its two HANDOFF lessons. |

### HARVESTED, THEN DELETE — the boss-verb pile (16 branches)

All of these duplicate a code fix already on `main`. Their **negative results**
are now consolidated in HANDOFF and are the only reason they were read.

| Branch | Decision |
|---|---|
| `next-session-iteration-x60p79` | Harvest → delete. The god-mode ceiling measurement and the "attacking roots the player" finding — the two most valuable results in the pile. Code (AABB contact, `measure-boss-combat.mjs`) already on `main`. |
| `next-session-iteration-i9v66l` | Harvest → delete. The first real-combat measurement of all six bosses, the Wyverna heart-piece arithmetic, and the direct Nereth/Anemos diagnoses. |
| `next-session-cleanup-wtwg3g` | Harvest → delete. The "67% of the stall is spent dodging charges" trace. Its doc-staleness fixes are superseded. |
| `iterate-next-session-t0pdp7` | Harvest → delete. The `walk-dungeons.mjs` wall-clock drift diagnosis and its `takeOver`/`release` fix, recorded verbatim in HANDOFF. |
| `next-session-iteration-xxmx25` | Harvest → delete. The ledge-hop player-drop race, recorded verbatim. Phase-fix code already on `main`. |
| `next-session-iteration-v4k2d6` | Harvest → delete. The `e.charging` sticks-true-forever bug — still live on `main`, now written down and assigned to S5. |
| `next-session-iteration-ny0ax7` | Harvest → delete. "Invuln has decayed to 0 is not I am safe now" — a timer is not a spatial condition. |
| `next-session-iteration-qbdwl5` | Harvest → delete. A directional input is a walk, not a face; derive contact geometry from `hb`, not a tuned constant. |
| `next-session-iteration-sx8679` | Harvest → delete. Phase-2 total-lockout proof. |
| `next-session-iteration-hw3pr3` | Harvest → delete. The 5-hit ceiling is a wall, not a slow race. |
| `iterate-next-session-mx0zs1` | Harvest → delete. The `BACKOFF` sweep is a mirage; two more ranged-dodge triggers ruled out. |
| `session-continuation-nextmd-kwm12k` | Harvest → delete. The `git checkout --` mid-session revert trap. |
| `next-session-iteration-w0iomi` | Delete. Duplicate of the contact-damage fix on `main`. |
| `next-session-iteration-b3hawy` | Delete. Sixth independent copy of the phase fix. |
| `next-session-iteration-90qt3z` | Delete. Duplicate; its Manhattan-vs-AABB writeup is superseded by x60p79's. |
| `next-session-iteration-jnyt1s` | Delete. Duplicate of the phase fix. |

### DELETE — superseded by later work on `main`

| Branch | Why |
|---|---|
| `next-session-iteration-erdixn`, `-b2tuo7`, `-6cyssw` | Progression checkers, cliff edges and townsfolk — all landed on `main` in better form (`check-progression.mjs` ships). |
| `playthrough-route-to-end-kxpd28`, `fix-playthrough-blocker-e72n4s` | The D1 Anchor route work is on `main`; `check-playthrough.mjs` passes 19/19. |
| `p8-execution-plan-jh6exl`, `p8-dungeon-generation-faqood`, `coral-spire-reauth-s93w9t` | Dungeon authoring superseded by the shipped D1–D6. |
| `link-sprite-progression-issues-rq48b6` | The lifted-rock fix is on `main` as `2b057ef`. |
| `oracle-tides-guide-7ak0mw` | An older guide regeneration, superseded by `jgs0uf` above. |
| `nextsession-iteration-c3zfhk`, `next-prompt-md-iterate-aaq0aj`, `game-playability-iteration-hju9b9` | Three more independent copies of the phase fix. |
| 13 branches dated 2026-07-31 → 08-07 (`gbc-zelda-movement-sword-r1vxqv`, `enemy-grid-aligned-movement-n2xv16`, `tide-levels-test-flakiness-73jc39`, `engine-feel-determinism-lel1me`, `oracle-build-script-coklp7`, `audit-consolidate-branches-5knfli`, `oracle-tides-continued-ebfuit`, the three `oracle-tides-polish-*`, `oracle-tides-boss-music-4c24tm`, `zelda-style-game-piqt8v`, `zelda-boss-behavior-jgbfwo`) | **Pre-rewrite archaeology.** Each carries its own "Initial commit" ahead of `main` — a different root — and each is 111–112 commits behind. The tide field, the Anchor, the towns, D1–D6 and the trade chain all landed after them. |
| 27 branches with zero commits ahead of `main` | Fully merged. Nothing to lose. |
| `zzz-delete-test-temp` | Scratch. |

### KEEP — one branch, deliberately

| Branch | Why |
|---|---|
| `claude/p7-6-camera` | **The only branch holding code that is not on `main` and was not recoverable into it.** It carries `tools/check-camera.mjs` (170 lines) and `tools/check-wide-rooms.mjs` (320 lines) — the two checkers for multi-screen rooms, a feature that shipped to `main` *without* them. The branch is 90 commits behind, so the files almost certainly do not run against the current engine and porting them blind would be worse than rewriting. **S11 rewrites them from scratch.** Keep this branch until S11 lands, as a reference for what they were meant to assert, then delete it. |

### The deletion command

Run from a checkout with push rights (this session's proxy blocks it):

```sh
git fetch origin --prune
git ls-remote --heads origin | awk '{print $2}' | sed 's|refs/heads/||' \
  | grep -v -x -e main -e claude/p7-6-camera -e claude/roadmap-branch-reconcile-0o24l8 \
  | xargs -n 20 git push origin --delete
```

That leaves `main`, `claude/p7-6-camera` (until S11) and this branch. Drop the
last exclusion once this branch is merged.
