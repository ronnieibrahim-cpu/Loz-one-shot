# Roadmap — Oracle of Tides

Written 2026-08-29, after reconciling 72 unmerged branches and auditing the
game against one standard: **would this read as a shipped Capcom/Flagship
Oracle game to someone who has played both for years?**

---

## The three documents

This file is one of three that work together. **Do not duplicate material
between them** — that is what went stale last time.

| File | Holds |
|---|---|
| **`docs/SESSION-HANDOFF.md`** | **The facts.** Current verified state (`§1`, `§2`/`A…`), the numbered trap catalogue (`§3`/`T…`), the verification protocol (`§4`/`V…`), the house rules (`§5`/`R…`), and the close-out checklist. **Every prompt cites it by id.** |
| **`docs/SESSION-PROMPTS.md`** | **The prompts.** Eleven paste-ready session prompts, each short because it cites the handoff instead of restating it. |
| **`docs/ROADMAP.md`** (this file) | **The reasoning.** Why this order, why this model, what the audit found, and what I argue against doing at all. |

The per-session entries below keep the goal, the failure condition, the model
choice, the dependencies and the verification split. **The prompt bodies live in
`docs/SESSION-PROMPTS.md` and only there.**

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

**Prompt:** see `docs/SESSION-PROMPTS.md`.

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

**Prompt:** see `docs/SESSION-PROMPTS.md`.

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

**Prompt:** see `docs/SESSION-PROMPTS.md`.

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

**Prompt:** see `docs/SESSION-PROMPTS.md`.

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

**Prompt:** see `docs/SESSION-PROMPTS.md`.

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

**Prompt:** see `docs/SESSION-PROMPTS.md`.

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

**Prompt:** see `docs/SESSION-PROMPTS.md`.

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

**Prompt:** see `docs/SESSION-PROMPTS.md`.

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

**Prompt:** see `docs/SESSION-PROMPTS.md`.

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

**Prompt:** see `docs/SESSION-PROMPTS.md`.

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

**Prompt:** see `docs/SESSION-PROMPTS.md`.

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
