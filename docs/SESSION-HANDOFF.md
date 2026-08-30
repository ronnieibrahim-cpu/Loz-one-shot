# Session Handoff — Oracle of Tides

**This is the reference document every session prompt points at.** It holds the
shared material — current verified state, the trap catalogue, the verification
protocol, the house rules — so that individual prompts stay short and none of it
drifts out of sync across eleven copies.

`docs/SESSION-PROMPTS.md` holds the prompts. `docs/ROADMAP.md` holds the
sequencing, the audit reasoning and the arguments about scope. **This file holds
the facts.**

Every id in this document (`R1`, `T14`, `V6`, `A3`) is stable. Prompts cite them.
**If you add a trap, append a new number — never renumber, and never reuse a
retired one.**

Last verified against the tree: **2026-08-30**; `A5`, `§3` and `§4.1`
re-verified by S7 (music: intros, loop length, the S6 techniques in use).
Previously **2026-08-29**, commit `64a6561`; `§1`, `A5` and
`§3`/`§4.1` re-verified by S6 (music engine: vibrato, echo, arpeggio).
Previously re-verified against `0d435fc`; `§1`, `A1` and
`§3` re-verified by S1 (hitstop).

---

## §0 — How to use this document

You have been handed a prompt from `docs/SESSION-PROMPTS.md`. It names a set of
rules (`R…`), traps (`T…`) and verification steps (`V…`) from this file.

1. **Read every id your prompt cites, before you write anything.** They are
   short. Each one was paid for by a session that did not have it.
2. **Read `R1`–`R9` regardless of what your prompt cites.** They are
   unconditional.
3. **Re-verify anything in §1 or §2 you are about to rely on.** This file is
   dated. The tree moves. A fact here is a starting point, not an authority —
   if the tree disagrees with this document, **the tree is right and this
   document is stale**: fix it in your session.
4. Finish with `§5`, the close-out checklist.

### R0 — One session at a time

**The roadmap is void if its sessions are run in parallel.**

This is not style. On 2026-08-29 a reconcile found 72 unmerged branches,
including sixteen `claude/next-session-iteration-*` from a single three-day
window. **Five independently found and fixed the same `Boss.phase` /
`Entity.phase` collision. Eight independently swept and reverted the same
boss-dodge variants.** Every one did competent work; the pile added up to about
one session of progress, because each branched from a `main` that did not yet
know what the last had learned.

A session's value is not its diff — it is what the next session no longer has to
find out. Parallelism destroys exactly that.

**Before starting: `git ls-remote --heads origin`** and confirm nothing else is
already doing your session.

---

## §1 — Ground truth

Everything below was run against the tree, not read from a doc. **Treat every
"done" claim in `docs/` as unverified until you check it** — that instruction
produced most of §2.

### Checker state at last verification

| Command | Result |
|---|---|
| `node tools/test.mjs` | **71 passed, 0 failed** (S1 +6 hitstop, S3 +5 cliff-edge, S4 +1 sfx coverage) |
| `node tools/check-hearts.mjs` | 114/114 |
| `node tools/check-music.mjs` | OK — **23 tracks, 59 sfx** (S6 added `engineDemo`, an audition-only track) |
| `node tools/check-playthrough.mjs` | 19 passed, 0 failed |
| `node tools/check-items.mjs` | 91 passed, 0 failed *(could not launch at all before S1 — see `T60`)* |
| `node tools/check-charms.mjs` | 63 passed, 0 failed *(same)* |
| `node tools/check-trade.mjs` | 43 passed, 0 failed *(same)* |
| `node tools/check-guide.mjs` | 4 passed, 0 failed *(was 3 of 4 FAILING before `db48311`)* |

**The engine is in good shape and is not the problem.** Y-sorting is correct
(`src/game/game.js:1497`, `depth * 1000 + y + h`). The tide field, the
fixed-point positions, the room cache stamp, the trade chain, the six dungeons
and the item verbs are real, checked, and work.

**The gaps are almost entirely in presentation and feel** — which is precisely
the half that no checker in `CLAUDE.md`'s verification table can see. That is
why `§4.2` exists and why most sessions end by handing something to a person.

### Counts you will otherwise get wrong

These have all been miscounted in prior briefs. Measured out of the data:

| Thing | Real number | Notes |
|---|---|---|
| Music tracks | 22 | ~8-bar loops, 3–4 patterns of 32 rows at `rowsPerBeat: 4` |
| Sound effects | **59** | was 55. S4 removed 3 dead and added 7; `check-sfx.mjs` prints the true count |
| Silent sfx no-ops | **0** | there were SIX, not the four once listed — see `A4`. `V19` keeps it at zero |
| Dead sfx definitions | **0** | there were four (`seed` too); three removed, `seed` wired to the Reefseed |
| Dialogue ids written | **57** | in `src/data/story.js` |
| Dialogue ids wired to map data | **51** | coverage is *not* the problem — see `A6` |
| Placed talkable entities | **43** | 12 `npc`, 29 `sign`, 1 `giver`, 1 `shop` |
| Cutscenes defined | 13 | one (`nerethIntro`) has no trigger |
| Extracted terrain tiles | **17** | plus 51 town pieces — see `A2`. Was 13 before S2, 15 before S3 |
| Grass tiles | **3** | `grass` (extracted since S2), `grassTuft`, `grassClump`. The grid is gone |
| Recorded replay baselines | 51 | every one is downstream of movement/combat timing |

---

## §2 — Area status

Each area carries an id (`A1`…) so a prompt can cite it. **File:line anchors are
from commit `0d435fc`** — verify before relying on one.

### A1 — Game feel and impact

**Hitstop exists as of S1.** `Game.freeze(frames)` holds `Game.hitstop`, and
`Game.update` returns early on it — below `frame++`, `audio.update()`,
`updateTimers`, `updateFade`, the shake countdown and `tide.update()`, and above
`player.update` and the entity loop. So the entity simulation stops and the
music, the HUD, the animated water and the shake do not. Three weights, all
`guessed`: `HITSTOP_HIT_FRAMES` 3 (an attack connecting with an enemy),
`HITSTOP_HURT_FRAMES` 6 (something hitting the player), `HITSTOP_BOSS_DEATH_FRAMES`
18 (the killing blow on a boss). Wired at the three funnels every damage source
already passes through: `Entity.hurt`, `Boss.hurt` (which overrides rather than
extends it), `Player.takeDamage` and `Boss.beginDeath`. See `T58`, `T59`.

- Screen shake exists and is wired (`game.shake()`). S1 re-tuned the six
  constants around the new freeze — **durations came down, amplitudes did not**
  — and added four more (`SHAKE_RUMBLE`, `SHAKE_BOSS_SLAM`, `SHAKE_BOSS_BREAK`
  and their frame counts) so that `src/data/bosses.js`'s **fourteen bare shake
  literals** could stop being an `R3` violation. Before that, re-tuning the six
  named constants changed the shake of everything in the game except the bosses.
  All ten are still `guessed`.
- **Nothing in `feel.js` is `measured`.** Every value is a guess, in a project
  whose stated first goal is fidelity. `ITEM_PRESENT_FRAMES` is the one
  exception to being a bare guess: it is now `derived` from the `itemGet`
  jingle's own tempo (20 rows at bpm 132 / rowsPerBeat 4), because at 90 frames
  Link put every new item down 26 frames before his own fanfare finished.
  **This is still not `measured`** — see `R3`/`T4` and S11's Job 2.
- **Text cadence is in `feel.js` as of S1**: `TEXT_SPEED`, `TEXT_FAST_SCALE`
  and `TEXT_BEEP_EVERY`. `TEXT_SPEED` keeps its historical 1.6 ch/f rather than
  being re-guessed; the suspicion that both source games are nearer 0.5 is
  **written down in the constant's own comment and deliberately not applied**,
  because nobody has frame-stepped it. The text blip did change: it was
  `floor(chars) % 3 === 0`, tested against the running total, so at a
  non-integer speed the click was an artefact rather than a rhythm. It now
  counts revealed characters.

### A2 — Terrain and tiles

**Most of the base terrain is still hand-drawn, and this violates `R5`.** S2
did the ground; cliffs, water edges and town fronts are S3.

`src/data/tiles-core.js` still holds hand-authored ASCII pixel art for
`cliffCracked`, `waterS0..2`, `waterD0..2`, `foamN`, `tallgrass` and the trees.
**The town kit needs nothing: all 51 `TOWN_ART` cells and all 10 blocks are
already extracted** — S3 audited it and there was no gap to close. `src/data/tiles-terrain.js` (the generated, extracted file) holds **15**
terrain tiles plus 51 town pieces.

**`grass` is extracted as of S2 and the grid it caused is gone.** It was one
hand-drawn 16×16 cell — a flat field with about fourteen dark speckles in a
FIXED constellation — repeated with zero variation, and at room scale those
speckles read as a regular lattice on a 16-pixel pitch. It is now Seasons' own
field grass (`oracle-seasons-overworld-spring.png @ 1095,420`), whose speckle is
fine and irregular enough that no mark is a landmark. The hand-drawn original
was deleted rather than kept.

**`cliff` and `cliffTop` are extracted as of S3, and cliffs autotile.** A
tiledef may declare `family` (tiles that are the same MASS — every palette-swap
of a cliff still counts as cliff, so a region seam does not grow a lip) and
`edgeArt` (`{ up: 'cliffTop' }` — the art to draw when the neighbour that way is
a different family). `Room.artAt` does the neighbour lookup and **treats off the
edge of the screen as the same mass**, or every screen in the game would sprout
a lip along its top row on cliff that carries on into the room above.
`validateTiles` checks the directions and the art exist. Zero room grids
changed. See `T65` for why this mattered more than the art did.

**Ground tiles can now declare `variants`.** A tiledef names other art it may be
drawn as; `tileVariant` (src/world/tileset.js) picks with a pure hash of room
key and tile coordinates — never the RNG stream (`T2`) — and `validateTiles`
asserts a variant matches its base's flags, mask and `over`, so a variant can
never change what the simulation sees. `grass`, `grassDark` and `grassBog`
scatter `grassClump` and `grassTuft` at one cell in seven. **It is a SCATTER,
not an even mix — see `T61`.**

`CLAUDE.md` is explicit that this is in scope: *"Terrain and scenery are covered
by this too. Rocks, trees, bushes, stumps, cliffs and ground textures are exactly
the things the sheets are richest in and exactly the things most likely to betray
a hand doing an impression of the source. Extract them."*

The tree comment at `tiles-core.js:406` explains the one-cell-per-tree design
("643 of its vertical tree runs are a single row tall") — that constraint is real
and survives extraction.

### A3 — The map screen and the HUD

**The overworld map is a grid of coloured rectangles.** `Menu.drawMap`
(`src/game/menu.js:270`) runs the same `fillRect` loop for the overworld as for a
dungeon floor, changing only the cell size (8 vs 10). The source games draw a
*picture* of the land. This is a screen the player opens constantly.

**The numbers, counted out of the data (2026-08-30), so S8 does not have to:**
the overworld is **12x10 = 120 screens and all 120 are defined** — the grid's own
silhouette is a filled rectangle, so a coastline must be derived from screen
CONTENTS, not from the map's shape. **No overworld room is multi-screen**, so the
cell-spanning logic is dungeon-only in practice. The draw box is `96x80 px` at
`ox=32, oy=44`, inside `160x100` available. The overworld map carries exactly
three states per cell — unseen, seen, here — because `haveMap` is hardcoded
`true` for it and the Chartstone pips are gated `!isDungeon`, **a latent dead
feature**: `progress.charts` is keyed per map and an overworld Chartstone would
set it, but no pip would ever draw.

**The thing that makes S8 tractable: every screen already declares a `legend`** —
`dunes` 19, `reef` 16, `cliffs` 16, `wood` 15, `salt` 12, `marsh` 12, `coast` 10,
`abyss` 8, `coral` 8, `town` 3, `townDunes` 1. That is a per-screen terrain class
on the room DEFINITION, needing no `Room` instantiated, and its distribution is
already geographic.

**The dungeon map is genuinely good and must not regress.** Multi-screen rooms
correctly span cells — read the comment at `menu.js:284`, which explains that
drawing every covered cell would paint a 2×1 room as two rooms with a seam,
"exactly the lie the whole feature is against." The Chartstone tide-pips are a
strong original idea, well executed.

**The HUD is good. Do not touch it.** The tide gauge, the bracketed item slots,
the heart row and the rupee counter are all right.

### A4 — Sound

**Every silent no-op is closed as of S4, and `tools/check-sfx.mjs` (`V19`) now
makes the class impossible to reintroduce.** It was RED on the tree before the
fix with six failures and green after; it is wired into `V16`.

**There were SIX, not the four this document listed.** The two the old list
missed are exactly the two a hand-audit cannot see:

| Call | Site | Was | Now |
|---|---|---|---|
| `sfx('swim')` | `player.js:883` | undefined — and it is not swimming, it is the **Squall Bellows** puffing, so the name was wrong twice | `gust` |
| `sfx('hookshot')` ×2 | `items.js:516`, `items.js:1091` | undefined — and it is the Anchor's chain, named after the Oracle item it must not be (`R11`) | `reel` |
| `sfx('rumble')` | `items.js:664` | undefined | `rumble` (new) |
| **`sfx: 'rumble'`** | **`tiles-core.js:1680`** | **undefined, IN DATA** — the `boulder` transform the Dredge Line hauls. Invisible to a grep of `src/game/`, which is why it was missed | `rumble` |
| `sfx('secret')` | `objects.js:1200` | a JINGLE name played through `sfx()` (`T44`) | `chime` (its own voice — `secret` is the discovery fanfare and stays that) |

**Four sfx were dead, not three.** `dig`, `shoot` and `pegasus` were **removed**
(no shovel, no player projectile, and a Pegasus Seed would be a straight Oracle
port — `R11`). **`seed` was the opposite case**: the verb existed and had the
wrong sound. The Reefseed's `plant()` played the generic `place`; it plays
`seed` now.

**Six sfx that LOOK dead to a naive grep are called dynamically** — `sword1/2/3`,
`switchOn`/`switchOff`, `cut`/`break`, `stairs`, `enemyDie`. `check-sfx.mjs`
resolves literals through ternaries and `|| ` fallbacks, so it sees all of them
and does not false-positive. Fully data-driven sites (`tr.sfx`, `reward.sfx`,
`step.sfx`, `w.sfx`) are covered by its second pass over the data tables.

**`boss` and `title` are music tracks** played via `audio.play()`, not sfx. The
checker knows, and says so when an sfx name collides with a track name.

**Coverage gaps S4 found and filled** (none of these was a no-op — they were
verbs with no call at all, which no checker can find):

- **The tide sweep.** `src/game/tide.js` had **zero audio calls of any kind** —
  the game's one mechanic reshaped the world in silence. Now `tideSweep`, on a
  real sweep only (not `instant: true`, which is a save restore or a boss pin).
- **Leaving the water.** Entering played `splash`; leaving spawned the effect
  and no sound, so the sea sounded like something you could only fall into.
- **Taking a ledge.** Silent on the way off, `land` on arrival. Both launch
  paths now play `jump` pitched down — **there are two, and only one of them is
  findable by grepping the obvious function name.**
- **The low-health warning.** Did not exist. `lowHeart` pulses every
  `LOW_HEART_EVERY` frames at or below `LOW_HEART_THRESHOLD` (both in
  `feel.js`, `guessed`), above the dialogue and hitstop returns on purpose.
- **A boss phase change played `charged`** — the wind-up sound before EVERY
  heavy attack, so the one moment meaning "this fight changed" sounded like the
  twenty meaning "dodge". Now `bossPhase`. **A wrong sound is still a sound, so
  no checker in this document can find one of these** (`§4.2`).

**Still unjudged (`§4.2`): whether any of the eight new sounds is RIGHT.** A
checker proves a sound exists.

### A5 — Music

**The framing "no bridge, no structure" is wrong — do not act on it.** `village`
and `title` both run `order: ['A','B','A','C']` with C explicitly commented as a
bridge. `overworld` runs `['A','A','B','C','D']` with a call-to-adventure
flourish in D (whose comment explains it is a gesture, not a transcription —
follow that distinction, see `R8`).

**S6 is DONE.** `src/core/audio.js` now supports vibrato, echo and arpeggio,
all as data-driven `cfg`/pattern-token options that the engine's `_scheduleRow`
turns into Web Audio automation — see the file's own header comment for the
exact contract of each. None of the 22 tracks written before S6 were rewritten
or asked to use any of them; `tools/check-audio-render.mjs` (`V20`) proves
every one of them still schedules byte-for-byte the same Web Audio calls it
did before (`T71` explains why that tool traces instructions rather than
hashing rendered samples). A 23rd track, `engineDemo`, exists ONLY to audition
the three techniques in isolation (`game.audio.init(); game.audio.play
('engineDemo')` from the dev console) — it is not wired to any room or map and
is not "the game's music"; S7 owns actually composing with these. **Whether the
vibrato reads as a Game Boy or a synthesiser is unjudged (`§4.2`)** — that is
the whole point of the session per its own prompt.

**S7 IS DONE.** All three of the gaps below are closed. `intro:` is real
(`Audio._sequence()`), nine tracks have one, ten tracks were extended or
reworked, and the S6 techniques are in actual use rather than only in
`engineDemo`. `check-music.mjs` covers intros both statically and by DRIVING
the engine for two loops. **None of it has been listened to** (`§4.2`) — the
listening notes are at the end of S7's section in `docs/NEXT-SESSION.md`.

**The framing "the region themes should get intros too" is wrong — do not act
on it.** `Audio.play()` restarts on a name change, so a track you re-enter
constantly re-plays its lead-in constantly. Intros went to the nine tracks you
ARRIVE at (`title`, `overworld`, `village`, `dungeon`, `dungeon2`, `boss`,
`finalBoss`, `abyss`, `ending`) and deliberately not to `cave`, `reef`,
`marsh`, `salt`, `shop` or any jingle.

**What was genuinely missing, before S6:**

1. ~~**No intro.**~~ **DONE (S7).** A track may declare `intro: ['I']` —
   patterns played once as a non-looping lead-in, then left behind for the
   life of that playback. See `T72`.
2. ~~**No channel technique.**~~ **DONE.** `src/core/audio.js` used to support
   only per-channel `duty`, `decay` and `glide` (and `glide` itself was, and
   still is, dead — declared in `DEFAULT_CFG` and never read anywhere; S6 did
   not touch it because removing a dead field it did not add was out of
   scope). Vibrato, echo and arpeggio are real now.
3. ~~**Loop length.**~~ **DONE for the four long-heard tracks (S7).**
   `overworld` 10->14 bars, `village` 8->12, `dungeon` 8->12, `dungeon2` 8->10,
   plus a 2-bar intro on each. `reef`, `marsh`, `salt` and `shop` are still at
   ~8 bars and are the obvious next music session.

### A6 — NPC dialogue

**Coverage is not the problem, and a brief claiming 13 ids against 52 entities is
wrong.** Counted out of the data: **57 ids written, 51 referenced by map data, 43
placed talkables.** Six orphans: `netMender`, `signCoast`, `villager3`, `elder1`,
`child1`, `shopkeeper2`.

**The reactive machinery already exists and is already used.** `npc`, `sign` and
`giver` entities each accept `dialogue`, `waiting` and `after`. Every quest-giver
uses it: `makuWait`/`makuBlocked`/`makuTree`/`makuAfter`/`makuOpened`,
`ossaStart`/`ossaWait`/`ossaEnd`/`ossaAfter`, `diggerWait`/`digger`/`diggerAfter`,
and all ten `*Trade`/`*After` pairs. **No engine work is needed** unless the
two-state model proves genuinely insufficient — and if it does, say so rather
than quietly building a third system.

**The actual gap:** ~21 ordinary townspeople have exactly one line that never
changes for the whole game — `villager1`, `villager2`, `villageChild`,
`shopkeeper`, `hearthWife`, `hearthChild`, `sandpiper`, `shoreSalter`,
`timberSalter`, `sandpiperKid`, `faroreHome`, `coastFisher`, `fisher1`,
`coastChild`, `wreckSurvivor`, `coralDiver`, `reefFisher`, `bogWitch`,
`stoneFisher`, `woodChild`, `salterElder`.

**The writing is good. Do not rewrite it.** The register is established: the four
peoples of Thalassia say what they think of each other by complaining, never by
exposition. A new line that explains the plot is wrong for this game.

### A7 — Cutscenes

`src/game/cutscene.js` is **146 lines** with a rich step vocabulary — `music`,
`jingle`, `sfx`, `flag`, `shake`, `face`, `give`, `spawn`, `despawn`, `warp`,
`tide`, `do`, `text`, `fade`, `say`, `wait`, `walk` — and **not one step that
draws anything.** It can move the world and talk about it; it cannot show a
picture.

13 cutscenes are defined in `src/data/story.js` (`intro`, `essence1..6`,
`essenceGeneric`, `makuSatchel`, `makuMaster`, `nerethIntro`, `ending`,
`tradeKettle`), all working within that limit.

**`nerethIntro` (`story.js:237`) has no trigger anywhere in `src/`.** It is
written and has never played.

The camera already exists (`src/game/camera.js`, a deadzone follower that is a
no-op in a one-screen room). Use it; do not write a second one.

### A8 — Bosses and combat

**All six bosses are winnable as of S5, at heart counts a player reaches in
order.** The full measurement corpus is in `docs/HANDOFF.md` → "Negative
results — the boss-verb corpus"; it is still worth reading, and its central
finding is now CLOSED rather than open.

**`T33` IS CLOSED. The structural ceiling is gone.** A god-mode Gohmaraq run
used to stick at 14 hp across 60,000 frames; it now kills in **820**. The fix
was one number in `bosses.js`, exactly as `A8` predicted: a charge is a
gap-CLOSER, and `ENEMY_CHARGE_MIN_RANGE` (40px) stops it firing at a player
already in sword reach. `charge()` had no minimum at all, so walking into swing
distance *was* the retrigger. **`dBoss` was not touched** — see `T34`, still
live as a warning.

Real-combat measurement, `godMode: false`, seed 20260806, at the **in-order**
health (3 hearts + one Heart Container per boss already beaten, counting **no**
heart pieces — a floor, since 24 pieces exist):

```
        boss        in-order      before S5        after S5         wins at
  d1  gohmaraq     3 hearts     16/24 died     20/24 died          4 hearts
  d2  anemos       4 hearts     12/30 died     KILLED (1 qh)       4 hearts
  d3  gloomtide    5 hearts     28/36 died     KILLED (8 qh)       5 hearts
  d4  wyverna      6 hearts     "40/44 died"   KILLED, UNHURT      6 hearts
  d5  rootmaw      7 hearts     "24/52 died"   KILLED (15 qh)      7 hearts
  d6  nereth       8 hearts      0/80 died     42/80 died         11 hearts
```

**Wyverna and Rootmaw were already won and the harness said otherwise** — the
quoted rows above were never real. `g.boss` goes null when the entity is
removed, so `b.dead` read `null` on a kill and the outcome fell through to
"still alive ... never finished". `progress.beaten` is ground truth, `T38` had
already said so, and `measure-boss-combat.mjs` reads it now. **This is `T39`
inverted** and it is `T68`.

**Gloomtide needed no code change at all.** `check-bosses.mjs`'s FIGHTS table
fought it at MID, where `gloomCurrent` gives it **1.7x speed** against 0.65x
everywhere else — the tide the BOSS wants. Every other row in that table names
the level that makes its boss vulnerable; that one named the level that makes
it strong. Corrected to LOW in both tools. It is won at the in-order five hearts
the moment the player does the obvious thing and drains the sanctum. `T69`.

**Nereth: 0/80 → winnable.** Two separate faults, both diagnosed by measurement:
its volley fired from the SAME `windUp` callback as the opening it was meant to
reward (`nerethOpening` now delays by `NERETH_OPENING_DELAY`), and its four
phases summoned a wizzrobe, three stalfos, a darknut and four keese and **never
cleared any of them**, so the endgame was a nine-body brawl in which he happened
to be standing (`dismissSummons` on every phase change).

**Anemos: two findings.** Its 30 hp was **fifteen connected hits with a level-1
sword** — the longest fight in the game, at position two, more than Nereth's
fourteen; now 24 (twelve, level with D1). And its final phase fired into its own
window, the same fault as Nereth's. Its lash also gained
`ANEMOS_LASH_MIN_RANGE`, mirroring the charge fix — worth the least of the three
(12→14) and kept for consistency of the rule.

**A BOSS DOES NOT FIRE INTO ITS OWN WINDOW** is now written down above
`closeTick` in `bosses.js`. **It is a DIAGNOSTIC, not an invariant** — a
source-level checker enforcing it everywhere was written and removed because it
fires on Gohmaraq, Wyverna and Rootmaw, all three of which are won. `T70`.

**`T42` is fixed**: `Boss.update` clears `charging` (and any part-finished step)
on every phase transition.

**Still unjudged (`§4.2`): whether any of these fights is FAIR.** Every number
above is a robot with a fixed approach. A boss the actor cannot beat may be
perfectly fair; one it beats easily may be boring.

### A9 — Orphaned verification

**Multi-screen rooms shipped to `main` without their checkers.**
`tools/check-camera.mjs` (170 lines) and `tools/check-wide-rooms.mjs` (320 lines)
were written on `claude/p7-6-camera` (commit `e00b6c5`) and never merged. That
branch is **kept alive** for reference; it is 90 commits behind, so the files
almost certainly do not run against the current engine. **Rewrite from scratch —
do not port code you cannot read.**

A shipped feature with no checker is exactly what this project's method is
against.

---

## §3 — The trap catalogue

**Each of these cost a session, or was found by one that nearly lost one.** Cite
by number.

### Determinism and randomness

- **T1 — Never call `Math.random()` in `src/`.** All randomness comes from
  `src/core/rng.js`: one global stream seeded from the save, plus a per-room
  derived stream so a room replays identically. `tools/test.mjs` greps for
  violations and fails.
- **T2 — Nothing in a draw path may consume randomness.** `Game.draw` runs at
  display rate, so anything drawing from a stream desyncs every replay and makes
  the picture flicker. Hash instead: `every(e, n)` hashes the entity id and is
  the existing precedent.
- **T3 — A test that fails intermittently is a real bug, not load flakiness.** If
  a seeded, deterministic run varies, the non-determinism is in initialisation
  order. **Find it. Never add a retry.**

### Constants, feel and replays

- **T4 — Every timing and speed constant lives in `src/data/feel.js`**, with a
  unit and a provenance comment (`measured`, `derived`, `guessed`). No
  module-level `const WALK_SPEED = …` anywhere else. **Never silently upgrade a
  `guessed` to `measured`** — that word means someone actually frame-stepped a
  reference and wrote the number down.
- **T5 — A five-line change to the movement or combat path is never a five-line
  change.** The 51 recorded replays are downstream of it. `tools/replay.mjs`
  compares against them and they *will* all move. **Re-record deliberately, in
  the same commit, and say so. Never loosen a replay to make it pass.**
- **T6 — Fixing timing in one place perturbs unrelated recorded timing.** Expect
  collateral replay churn; verify it is churn and not a regression by watching
  one.
- **T7 — Positions are 8.8 fixed-point** (`src/core/fixed.js`): an integer
  subpixel accumulator plus a derived integer pixel position; rendering reads the
  integer. Do not reintroduce float positions, and **do not use `| 0` to floor a
  coordinate** — it truncates toward zero and misrounds across x=0, which happens
  on every room transition.
- **T8 — Diagonal movement is deliberately not normalised.** Full speed on both
  axes; diagonal is faster than cardinal. This is a signature of the source
  games. **Do not "fix" it.**

### Collision, rooms and the world

- **T9 — A checker may never define its own collision, passability or push
  logic; it calls the engine's.** `Room.solidAt`/`tileDefSolid` and
  `canOccupy`/`moveEntity` are the only place a "can something stand here"
  formula may live. `tools/lib/collision.mjs` is the one shim allowed to know
  which raw tile flags mean solid. **550 assertions were once green while no
  block in the game could be pushed**, because two tools each modelled movement
  privately — and a private model does not fail when the real rule changes under
  it, it just quietly starts being wrong.
- **T10 — A solid tile can strand a room and still validate clean.** Anything
  carrying `F.SOLID` can sever connectivity while rendering fine. Run
  `walk-dungeons.mjs` and `check-overworld.mjs` **after any tile placement, not
  at the end of a batch.**
- **T11 — A ledge is solid from three sides.** A ledge run dropped across a
  corridor makes rooms unreachable. Use `tools/find-ledges.mjs` to pick
  placements. **Do not place by eye.**
- **T12 — A checker's flood only knows the movement verbs somebody taught it.**
  `walk-dungeons.mjs` treated a one-way ledge as a wall for the project's whole
  life — harmless until D2 made a ledge the only way in, and eight rooms read as
  stranded in a dungeon that walks fine. **If you give the player a new way to
  move, add it to the flood in the same commit.**
- **T13 — A building is not a tile, and a town screen has ONE corridor.** Town
  buildings are 3×3 BLOCKS expanded by `Room.expandBlocks`, which throws if the
  rectangle is not exactly the block's size. What no throw catches: a 10×8 screen
  holding two 3×3 buildings has exactly **one** row crossing it, so any object
  three tiles wide in that row severs the screen — usually only at HIGH, where
  the tide has already taken the other route. **Four layouts died of this.**
  `check-towns.mjs`'s flood is deliberately **ON FOOT**; granting swimming hides
  the failure entirely.
- **T14 — Digits 0–9 in a room grid are always tide tiles** (`src/data/legends.js`).
  Never reuse a digit for anything else.
- **T15 — A tiledef field the registrar does not name is discarded.**
  `registerTiles` copies field by field rather than spreading, so `liftLevel` sat
  in the data and `liftTile` read it and the two never met, for the project's
  whole life. **Adding a tiledef field means adding it in
  `src/world/tileset.js` too.**
- **T16 — `F.PIT` is not solid, so "walkable" is not "safe".** `canOccupy`
  answers true over a pit.
- **T17 — `F.WET` is `F.WATER|F.DEEP`**, and an item that cares about water
  almost certainly does not mean both.

### Art and extraction

- **T18 — If a sheet has it, extract it; if no sheet has it, draw it to match.**
  Extraction is reproducible, drift-free, and cannot wander into someone's own
  style. `docs/ART-DIRECTION.md` is the authority; `docs/briefs/AGENTS.md`
  section J is the workflow.
- **T19 — Extraction lands in a generated file. NEVER hand-edit one.** Add the
  frame to the ripper's coordinate map and re-emit. **This cuts both ways:**
  removing an icon means removing its map entry and re-emitting, not deleting
  output lines. **Run the ripper once before you change anything** to confirm it
  reproduces byte-identically — if it does not, stop and report that.
- **T20 — Keep the ripper credits** in `assets/sheets/README.md` and in every
  generated file's header. They name the people who pulled the art off the
  cartridge and they are how a future session finds which sheet a tile came from.
- **T21 — Compositing two source tiles into one game tile is authoring, not
  extraction.** It needs an in-game screenshot across several regions before it
  is believed. **`tools/preview.mjs` renders one palette and cannot show it.**
- **T22 — Animated tiles are not in the room's render cache.** Water, lava and
  torches are pushed to `animCells` and drawn separately, so sampling
  `room.render()` alone reads them as transparent. Composite `render` +
  `drawAnim` + `drawOver` the way `drawScene` does, and **hash a whole 16×16
  tile, not one pixel** — shallow and deep reef water share their colour at the
  tile's centre.
- **T23 — Canvas 2D anti-aliases every path fill and there is no flag to stop
  it.** Draw from tiles/sprites or integer `fillRect`s, never from paths, or it
  will read soft against a pixel-art game.
- **T24 — Art rules when you must draw:** three colours plus transparency (index
  3 is the outline); a hard 1px black outline all the way round, no exceptions;
  no anti-aliasing, gradients or dithering on characters, light dithering on
  terrain only; fill roughly two thirds of the 16×16 cell, feet near the bottom;
  two-frame cycles differing by ≥3 pixels; `_d` faces the viewer, `_u` away,
  `_s` faces **right** (the engine mirrors it — never draw a left-facing frame);
  draw the silhouette first.

### The tide

- **T25 — The tide is a field, not a global.** Use `tide.levelAt(tx, ty, room)`,
  or pass `game.tide` to a room query. `tide.level` is the BASE — only the HUD
  gauge, the music, the save and the conch's plumbing should read it. Inside the
  world, `tideAt(game, e)` is the level under an entity's own feet. **A new call
  site that says `tide.level` and means "the water here" is right until the first
  anchor lands near it and wrong forever after.**
- **T26 — A room's render cache is keyed on the field's stamp, not a level.** The
  stamp is monotonic and never reset — not by `clearOverrides`, not by a new
  game. Rooms outlive a new game, so a stamp going backwards could collide with a
  key a cached canvas still holds, and the room would draw the wrong water while
  every collision query answered correctly.
- **T27 — A tile's name is not its tide behaviour. Read `room.flagsAt`, not the
  legend comment.** A write-up once claimed a room needed HIGH tide because its
  floor is `dBasin` and `dBasin` is "shallow only at HIGH" — true of the tile in
  the abstract, irrelevant to passability, because none of `dBasin`'s states ever
  carries `F.DEEP`. The room had no tide requirement at all.

### Items and progression

- **T28 — A chest can hand over an item that does not exist, silently.**
  `giveItem` records any id; `itemName` returns the raw id and `itemIcon` falls
  back to `i_unknown`. The chest opens, the jingle plays, the save records it,
  and the player gets nothing. `check-items.mjs` catches it.
- **T29 — A counted item must arrive with a full pouch.** The rule that a
  Reefseed, bomb or bottle comes with something in it now lives in
  `progress.giveItem`, with the grant — it used to live only in `Game.openChest`,
  so every other path produced a working inventory entry with zero ammunition and
  a B button that denied forever. **If you add a counted item, put its capacity
  there.**
- **T30 — Rebuilding an options object field by field drops what you forget.**
  `addOverride` did exactly that and silently discarded the tag the Anchor used
  to find its own override. Everything worked except the one thing.
- **T31 — A quest whose reward opens a region can be placed behind its own
  gate**, and a gate that two items open is not a gate on either of them.
- **T32 — Raising the health cap is a difficulty change even when no damage value
  moves.** If you are tempted to solve a fight with hearts, say so explicitly and
  get agreement first.

### Bosses and combat

- **T33 — The boss ceiling is STRUCTURAL, not tactical.** A 60,000-frame
  *unlimited-health* Gohmaraq run still sticks at 14 hp forever. Its phase-2
  charge `range` is 130px, covering nearly the arena, so **its melee-vulnerable
  range is a strict subset of its charge-trigger range** — reaching swing distance
  *is itself* the charge retrigger, and charges chain with zero idle frames.
  **If infinite health does not win, no dodge and no health buffer will.**
- **T34 — Eight dodge/approach strategies are ruled out by measurement.** Reactive
  ranged dodge; two further dodge triggers; a `BACKOFF` sweep (best value is a
  mirage); chaining a second swing (net negative); opening-edge grace;
  eye-open gating (the eye is already open 69–100% of the fight); free swing or
  closing during the tell (18 frames covers ~25px of a 60–130px trigger);
  chase-then-wait-for-recovery (gets 7 frames short and no closer). **Seven
  converge on the same ceiling. A ninth variant of "dodge better" is disproven
  before you write it.**
- **T35 — Attacking roots the player, so a swing cannot connect against a
  fast-moving target.** `Player.updateMovement` freezes the player for the whole
  swing ("attacking roots you in place, as in the GBC games"). ~2,822 gated swing
  attempts over 8,000 frames landed **zero** hits, because `startSwing`
  (`player.js:358`) stops the player dead while the dash covers 1.9px/f clean
  through the sword hitbox. **Lead the swing, or wait for a moment the target is
  ALSO stationary. "Get close mid-motion and swing" is not a strategy.**
- **T36 — "Lead the target" is a trap for a CHARGING boss.** The wall a boss
  patrols toward is the same wall its `charge()` dashes toward, so leading it puts
  the player exactly where the charge lands — which is the retrigger condition.
  Traced: distance locked at 13–14px for *thousands* of frames.
- **T37 — `check-bosses.mjs` runs in GOD MODE and says so.** It measures fights;
  it does not claim them. **A god-mode kill is not a winnable fight.**
- **T38 — `samples: 0` is not "the weak point never opened".** A boss dying inside
  the first 400-frame sampling chunk leaves zero samples. `st.beaten` is ground
  truth. Already fixed on `main` — do not re-break it.
- **T39 — A harness that walks out of a boss arena reports a flawless victory.**
  No boss, full health, reads exactly like a kill. That is what `fence()` defends
  against. **"The enemy is gone" is not "the enemy is dead" — assert the positive
  fact.**
- **T40 — A tide gate must never be a boss's only vulnerability.** A pure tide
  gate means an invulnerable boss and no way to learn otherwise.
- **T41 — `Boss.phase` / `Entity.phase` is FIXED on `main`. Do not fix it a sixth
  time.** Five branches fixed it independently. If you see "boss takes 0 damage"
  or "damage caps at a suspiciously round number", the shape to check is *a field
  name silently doing two jobs* — but this specific instance is closed.
- **T42 — LIVE BUG: `e.charging` can stick `true` forever.** `charge()`
  (`src/game/enemy.js`) sets it true when a dash starts and clears it only inside
  its own `if (e.charging)` branch on a *later* call. Nothing else clears it.
  **Gohmaraq's final phase never calls `charge()`**, so any verb branching on the
  flag dodges a charge that is not happening, for the rest of the fight.
- **T43 — Use `tools/measure-boss-combat.mjs`** (already on `main`) for
  real-combat numbers. **Three separate sessions rebuilt that harness by hand**
  because a doc sentence described it and no tool existed.

### Audio

- **T44 — `jingle()` and `sfx()` read different tables.** A name in one is not a
  name in the other. That is the `secret` bug (`A4`).
- **T45 — An `sfx()` call with an undefined name is a silent no-op.** No throw,
  no warning. Four have survived six sessions.
- **T46 — The noise channel takes percussion only**, and every note must sit
  inside the Game Boy's real frequency range for its channel. `check-music.mjs`
  asserts both.
- **T71 — Web Audio's own rendering is NOT bit-reproducible across script
  contexts, even for identical code.** Rendering real PCM through an
  `OfflineAudioContext` in headless Chromium and hashing the samples produced a
  DIFFERENT stable hash for the same track between two separate
  `browser.newPage()` calls in the same browser process — an exact-byte
  regression check built this way would flag unrelated commits as breaking the
  music. **Trace the Web Audio INSTRUCTIONS instead** (`setValueAtTime`,
  `start`, `stop` calls, via a tiny mock context whose nodes just record what
  was called on them) and compare those — that part is pure deterministic
  arithmetic on the track data with no browser DSP involved at all, and it is
  what actually determines the sound. `Audio.init(ctxOverride)` exists for
  exactly this. See `tools/check-audio-render.mjs` and `docs/HANDOFF.md`.

- **T72 — An intro is spent at the WRAP, and both ways of getting that wrong
  are silent.** `Audio._sequence()` returns `intro.concat(order)` until the
  first wrap and `order` after; `_introDone` is set AFTER the length test in
  `_scheduleRow`, which is the only ordering that makes the lead-in count
  toward the first wrap and no other. Drop the assignment and the intro
  replays every loop; move the test and the seam eats a bar of the body.
  **Neither is visible in the track data**, which is why `check-music.mjs`
  drives `Audio._scheduleRow` for two loops against the mock context in
  `tools/lib/mock-audio-ctx.mjs` and asks the engine which pattern it played,
  instead of modelling where the wrap ought to fall. Both sabotages were
  induced and both go red.
- **T73 — Echo is a CHANNEL config, so one authored token anywhere in the track
  disables it for that pattern**, silently and only there. A track whose `p2`
  is an echo must omit `p2` from EVERY pattern, intros included.
  `check-music.mjs` rejects a track carrying both — but the failure it is
  guarding against is a track that plays correctly in three patterns out of
  four.
- **T74 — A channel shorter than its pattern HOLDS, it does not rest, and the
  format comment says otherwise.** `src/core/audio.js`'s header claims a short
  channel is "silent for the remainder"; `resolveEvent` returns `off` only on
  row 0 and `hold` on every later row, so the last note rings on into the next
  pattern. `village`/B's `p2` was one token short of 32 for the whole life of
  the track and the symptom was a note releasing a sixteenth late, not a note
  vanishing. Ragged lengths are legal by design, so this is not checkable —
  count your tokens when you author a pattern.

- **T75 — The map screen's "do not instantiate rooms" comment gives a reason
  that is STALE, and the rule is already broken.** `menu.js:293` says an
  instantiated room "is one `liveRooms` will then save and restore the state
  of". **`liveRooms` (`src/world/maps.js:132`) has zero callers in `src/` or
  `tools/`** — nothing saves or restores from `m._rooms`, and `resetRooms()`
  clears it on new game and load (`game.js:139`, `:158`). Meanwhile the
  Chartstone pip path already instantiates: `tideMarks` calls `getRoom`, which
  does `new Room(...)` and caches it. So the save-corruption hazard the comment
  names **does not exist today**. The cost that IS real is frame time — 120
  overworld rooms built on every map open — and `def.legend` supplies terrain
  without building any. **Do not cite this comment as a reason for a decision
  without re-checking it**, and do not "fix" it by deleting the caution either:
  decide, and write down which you chose. The general shape of this trap is a
  comment that outlived the code it was describing.

### Story and dialogue

- **T47 — A dialogue id the map asks for and `story.js` does not define shows an
  EMPTY BOX**, silently.
- **T48 — Changing what an NPC IS can move an item out of the field a checker
  reads.** If you touch a `giver` or the shop, re-run `check-items.mjs` and
  `check-trade.mjs`.
- **T49 — Converting an existing NPC into a trader is free; adding one is not.**
  Do not add NPCs to hang lines on — use the ones already placed.
- **T50 — Story data that describes a design is not the design being wired.**

### Harness and process

- **T51 — LIVE BUG: the ledge-hop prober can drop the player.**
  `walk-dungeons.mjs` waits exactly 3 `g.frame` ticks after `enterMap()`, then
  filters `g.entities` down to the player — but room entry respawns entities on
  its own schedule and is occasionally still in flight, leaving `g.player`
  momentarily absent. The filter then yields an **empty array with the player
  filtered out too**, and nothing adds it back. Fix (reproduced 5/6 before, 5/5
  clean after):
  ```js
  await new Promise(r => { let n = 0;
    const t = () => (g.entities.includes(g.player) || ++n > 30) ? r() : requestAnimationFrame(t); t(); });
  ```
- **T52 — LIVE BUG: `game.frame`'s absolute value drifts with machine load.**
  `walk-dungeons.mjs`'s parts 1 and 2 call `page.evaluate` once per dungeon with
  no frame-waiting between, while the page's own `requestAnimationFrame` keeps
  ticking `game.frame` for however long each round trip takes. A change making
  boss code draw *strictly more* shifted that cost enough to fail one overworld
  ledge 100% reproducibly, **in a room with no boss, no phased entity and no
  touched code path** (frame 91 vs 92). **The fix is NOT a bigger margin on the
  tuned `frames(22)` constant** — it is removing the drift:
  `await page.evaluate(() => window.__harness.takeOver());` right after the
  intro-skip, and `window.__harness.release()` (which zeroes `acc` and restamps
  `last`) immediately before the first real keypress. **If a `walk-dungeons.mjs`
  ledge failure looks unrelated to what you just changed, suspect this before the
  ledge data.**
- **T53 — Headless assertions prove EXISTENCE, never VISIBILITY.** Every boss's
  dramatic reveal rendered as an empty room — a health bar and no boss — for the
  project's whole life, and nothing in the checker table could see it, because
  assertions proved the boss *existed* the entire time it shipped. **Screenshot
  anything whose bug would be visual.**
- **T54 — A `git checkout -- <file>` mid-session to isolate a change is a real
  revert.** One silently discarded a file's own unrelated good fixes for the rest
  of a session. **Save a patch (`git diff <file> > /tmp/x.patch`) BEFORE checking
  a file out for isolation, not after.**
- **T55 — A checker's "note" is a to-do with no owner**, and it will sit there
  until someone reads the verbose output again. `check-hearts.mjs --verbose` had
  printed a list of tide-restricted heart pieces since before the first guide
  rewrite; the guide called them "in the open" and no checker could catch it. **If
  it is worth printing, it is worth a line item in whatever document reads it.**
- **T56 — A checker that arrives on a branch is as stale as the branch it arrived
  on.**
- **T57 — One session's work is invisible to the next until it is merged.** This
  is how D2 came within a hair of being built twice. See `R0`.
- **T58 — A hitstop is one line away from being a frame halt, and the difference
  is inaudible in a screenshot.** `Game.update` freezes by returning early, and
  where that return sits is the whole feature: below `frame++`, `audio.update()`,
  `updateTimers`, `updateFade`, the shake countdown and `tide.update()` it is a
  simulation pause; above any of them it stutters the music on every sword
  swing, a hundred times a dungeon, while looking completely correct in every
  still. `tools/test.mjs`'s `--- hitstop ---` block asserts BOTH directions —
  that the entities stop and that `g.frame` and `progress.frames` do not — and
  both halves were proved to fail against a deliberately broken `freeze()`
  before being believed. **If you move that return, run those six assertions.**
- **T59 — A freeze belongs to the room it happened in.** `setRoom` clears
  `hitstop` for the same reason it rebuilds the room stream: an 18-frame boss
  death freeze carried through a warp would spend itself stalling a room the
  player has only just walked into, and nothing would look wrong — the room
  would just feel like it took a moment to start.
- **T61 — An even mix of ground variants is WORSE than the grid it replaces.**
  `rip-terrain.py` quantises each tile against its OWN four colours, so two
  tiles that look alike on a sheet can land on different palette indices, and
  their shared edge becomes a hard tonal seam. Four good grass candidates mixed
  at equal weight, rendered as a full 10x8 room, read as a **chessboard**. One
  variant in seven read as a meadow. **Render a whole room before believing a
  terrain change** — a tile judged alone, or as a 3x3 swatch, tells you nothing
  about this.
- **T62 — Matching tone is necessary and NOT sufficient; the motif has to match
  too.** The one tile on any sheet whose index distribution matched `dFloor`
  (34/50/14 against 27/53/18) was a diagonal streak against `dFloor`'s scallop,
  and scattered through a floor it read as random patches rather than masonry.
  It was extracted, wired and reverted. **No number catches this** — compare the
  two tiles as pictures, side by side, in the palette the game will use.
- **T63 — The seamless-window scan cannot see a multi-cell ground pattern, and
  it does not need to.** `rip-terrain.py --scan` finds 16x16 windows that repeat
  at +16 in both axes, so a field built from a 2x2 set of alternating cells is
  invisible to it. S2 wrote the 32x32 supercell scan to check, and the answer is
  that **the source games do not do this**: the whole overworld sheet yields 758
  supercell windows against 4,129 in one grass region alone at 16x16, the
  Seasons spring sheet yields 9, and the Ages sheet yields **zero**. Oracle's
  ground fields are genuinely single-cell repeats; variety comes from a person
  placing detail cells. Do not spend another session looking for this.
- **T68 — "The boss is gone" reads as "the fight did not finish", and that is
  `T39` inverted.** `measure-boss-combat.mjs` sampled `g.boss.dead`, but `g.boss`
  goes NULL once the entity is removed, so a KILL reported as
  `still alive after N frames (never finished)` with `? of 44` damage. **Wyverna
  and Rootmaw were being won and written up as losses**, and a session acting on
  that table would have "fixed" two fights that were already right. `T38` had
  already named the answer — `progress.beaten` is ground truth — for the
  opposite symptom. **Assert the positive fact, in both directions.**
- **T69 — A boss's "design tide" is the tide that makes it VULNERABLE, not the
  tide it is themed around.** `check-bosses.mjs`'s FIGHTS table fought Gloomtide
  at MID because "the sanctum current runs at MID and carries it" — which is a
  description of the boss being strong (1.7x speed against 0.65x elsewhere).
  Every other row names a weakness. Measured there, the fight looked unwinnable;
  at LOW it is won at the in-order five hearts with no code change. **A
  shell-less boss has no "tide its weak point opens at", so that column means
  something different for it — check which.**
- **T70 — A rule earned from two fights is a DIAGNOSTIC, not an invariant.**
  "A boss does not fire into its own window" fixed Nereth's and Anemos's final
  phases, both of which plateaued at a fixed hp no player health could move. A
  source-level checker demanding it of every shelled boss was then written — and
  it fires on Gohmaraq, Wyverna and Rootmaw, **all three of which are won**.
  Enforcing it there would have been changing balanced fights to satisfy a tool.
  Reach for the rule when a fight plateaus; leave the ones that work alone.
- **T66 — A silent sound has a twin that no checker can find: a WRONG sound.**
  `check-sfx.mjs` (`V19`) closes the class where `sfx()` is handed a name that
  does not exist. It cannot see a call that plays a defined sound which is the
  wrong one — a boss phase change played `charged`, the wind-up before every
  heavy attack, so the one moment meaning "this fight has changed" sounded
  exactly like the twenty meaning "dodge". **Audit by VERB, not by grep**: walk
  what the player and the world can do and ask what each one sounds like.
- **T67 — Half of a symmetric verb is where a missing sound hides.** Entering
  the water played `splash`; leaving it spawned the effect and played nothing.
  A ledge hop sounded on landing and not on the drop — **and it has TWO launch
  paths, only one of which is findable by grepping the obvious function name**.
  When you add a sound to one half of an enter/leave, up/down or start/finish
  pair, grep for the other half and count the call sites.
- **T64 — A sheet's tile grid phase must be measured LOCALLY, over the region
  you are picking from.** These sheets are assembled maps with large non-map
  margins, so a whole-sheet average is dominated by content that is not on the
  grid: `oracle-seasons-overworld-spring.png` reports phase (0, 12) whole-sheet
  and (8, 6) over its cliffs, and only the second produces cells containing
  whole tiles. `rip-terrain.py --phase <sheet> X0 Y0 X1 Y1`. **This blocks every
  pick that is not ground** — the seamless scan finds ground without knowing the
  phase, because a window repeating at +16 in both axes is correctly phased by
  construction, but a cliff face, a shoreline or a building front is one or two
  cells tall and never repeats, so it can only be read off the grid.
- **T65 — A tile can be dead data, and dead data is why a thing looks wrong.**
  `cliffTop` was registered, had art, and was placed **zero times** in the whole
  overworld: 1,307 cells of `#` and not one `^`. So every cliff in the game was
  a solid mass of body tile with no edge anywhere, and the reason cliffs read as
  brickwork was not only that the art was hand-drawn — it was that the game had
  ONE PIECE where the source has a set. `foamN` is in exactly the same state
  today (registered, no legend references it, 50 of 52 static water cells touch
  land with no foam). **Before blaming a tile's art, count how many times it is
  actually placed.**
- **T60 — Five checkers could not run at all in a clean container, and said so
  in a stack trace rather than a failure.** `check-items`, `check-charms`,
  `check-trade`, `find-ledges` and `preview` called `chromium.launch()` without
  the system-Chromium fallback that `test.mjs` and `solve-switches.mjs` already
  had, so V8 — the checker that proves every item does the verb `docs/ITEMS.md`
  claims — threw a Playwright install banner instead of running. **A checker
  that cannot launch is not a passing checker.** All five now carry the same
  `.catch` fallback; all five pass (91, 63 and 43 assertions respectively for
  the three that assert).

---

## §4 — The verification protocol

### §4.1 — What proves what

Run the cheap deterministic checkers instead of reasoning about correctness. They
are faster than you are and they do not rationalise.

| Id | Command | Proves |
|---|---|---|
| V1 | `node tools/validate.mjs` | Room grids are well-formed |
| V2 | `node tools/walk-dungeons.mjs` | Every dungeon is completable; no room stranded |
| V3 | `node tools/check-overworld.mjs` | Region gates seal and open correctly |
| V4 | `node tools/check-progression.mjs` | The world can be finished IN ORDER — the only tool that can see a gate CYCLE |
| V5 | `node tools/check-gates.mjs` | Gates hold in-engine with a live player |
| V6 | `node tools/solve-switches.mjs` | Every switch puzzle has a solution |
| V7 | `node tools/check-towns.mjs` | Every town screen's ways in and doors reach each other **on foot** at all three tides |
| V8 | `node tools/check-items.mjs` | Every item does the verb `docs/ITEMS.md` claims; nothing hands out a nonexistent item |
| V9 | `node tools/check-hearts.mjs` | Heart economy and the contact-damage ladder |
| V19 | `node tools/check-sfx.mjs` | Every sfx name reachable from a call site or a data table is defined (`T45`), and nothing is defined and never played. Wired into `V16` |
| V10 | `node tools/check-music.mjs` | Track orders, note ranges per channel including vibrato's swung extreme and every note of a '+' arpeggio chord, noise = percussion only. Since S7 also: a track's `intro` is a real, non-empty, loop-disjoint pattern list absent from jingles; no pattern is defined and never played; and — by DRIVING `Audio._scheduleRow` for two loops — the engine actually spends the lead-in exactly once (`T72`) |
| V20 | `node tools/check-audio-render.mjs` | A track using none of vibrato/echo/arpeggio schedules the exact same Web Audio instructions it always did (`T71`). Wired into `V16` |
| V11 | `node tools/replay.mjs` | Movement and combat are frame-identical to 51 recorded baselines |
| V12 | `node tools/check-bosses.mjs` | Every boss spawns and its weak point opens — **in GOD MODE, see T37** |
| V13 | `node tools/check-playthrough.mjs` | **The only tool that plays the game.** A new game, no items granted, no warps, no flags set from outside |
| V14 | `node tools/check-guide.mjs` | `docs/GUIDE.md` matches the world |
| V15 | `node tools/check-build.mjs` | The shipped single-file build boots and plays from a `file://` URL |
| V16 | `node tools/test.mjs` | Everything else — including, since S1, that hitstop freezes the entity simulation and NOT the frame counter, the audio pump or the play clock (`T58`) |
| V17 | `node tools/measure-boss-combat.mjs` | Real combat, no god mode, with a per-hit damage log |
| V18 | `node tools/shoot-rooms.mjs` | Renders in-game screenshots — the only way to check anything visual |

Item-specific: `check-anchor`, `check-cleats`, `check-lens`, `check-bellows`,
`check-reefseed`, `check-dredge`, `check-trade`, `check-torches`, `check-motion`,
`check-tilesets`, `find-ledges`, `find-crossings`.

**Every one of those proves a PART. `V13` is the only one that plays the game.**
The rest are models, and a model does not fight a boss, spend a key or press a
button — which is how seven hundred green assertions once described a world that
could not be finished.

### §4.2 — What NO checker can prove

**This is the half the audit found most of the gaps in.** If your session's
deliverable is on this list, it is not done when the checkers pass — it is done
when a person has looked or listened.

- **Whether a hit feels good.** Hitstop weight, shake as impact vs noise.
- **Whether art reads right.** Whether a grid is gone; whether extracted and
  authored art betray which is which; whether a shoreline reads as a shoreline.
- **Whether a sound is right for its verb**, or the mix is balanced. A checker
  proves a sound *exists*.
- **Whether music is development or padding**, and whether vibrato sounds like a
  Game Boy or a synthesiser.
- **Whether a fight is FAIR.** Every boss tool measures a robot with a fixed
  approach. A human dodges, baits and waits in ways `dBoss` structurally cannot.
  **A boss the actor cannot beat may be perfectly fair; one it beats easily may
  be boring.**
- **Whether a line is in voice**, and whether a reaction lands at the right beat.
- **Whether a scene reads dramatically**, and whether a pan lands where the eye
  expects.
- **Whether anything is VISIBLE** (`T53`).

**When you finish, do not say "verified" for anything on this list.** Say what
you checked, then tell the user exactly what to do in
`dist/oracle-of-tides.html` to judge the rest — which room, which enemy, which
two things to compare.

---

## §5 — House rules and close-out

### The unconditional rules

- **R1** — `T1`: no `Math.random()` in `src/`.
- **R2** — `T7`/`T8`: 8.8 fixed-point positions; diagonals stay un-normalised.
- **R3** — `T4`: every timing and speed constant lives in `src/data/feel.js` with
  a unit and a provenance word.
- **R4** — `T9`: a checker never defines its own collision rule; it calls the
  engine's.
- **R5** — `T18`/`T19`: extract what a sheet has; never hand-edit a generated
  file.
- **R6** — `T25`: the tide is a field. `tideAt(game, e)`, not `tide.level`.
- **R7** — **Goal 1: it must look and feel like Oracle of Seasons/Ages.** Aim for
  the closeness of a ROM hack. A feature that works but feels wrong is a
  regression, and so is art that reads as someone's impression of the source.
- **R8** — **Goal 2: the design must be original.** Mechanics, items, dungeons and
  story are ours; only the genre grammar is borrowed. **This is a rule about
  design, not branding** — the game stars Link, uses ripped sprite sheets, and its
  title screen says THE LEGEND OF ZELDA — ORACLE OF TIDES in the Oracle series'
  own layout. **That is deliberate. Do not "fix" it.** A session once stripped the
  series line reading Goal 2 as a rule about names.
- **R9** — Where R7 and R8 conflict, **fidelity wins**. We are not being different
  for its own sake.

### Design rules

- **R10** — **Every item needs three verbs**: movement, combat, puzzle. An item
  with fewer than two is a key wearing a costume. `docs/ITEMS.md` is the roster.
- **R11** — **No item may be a straight port of an Oracle item.** If it reduces
  to "it's the hookshot but wet," it is not done.
- **R12** — **Every dungeon leans on a different consequence of the tide.** If two
  dungeons' themes fit in the same sentence, one is wrong.

### Close-out checklist

Every session ends by doing all of these:

1. **Run the checkers your prompt cites**, plus `V16` (`test.mjs`). Paste the
   real output — not a claim about it.
2. **If you touched `src/`: `npm run build` and commit
   `dist/oracle-of-tides.html`.** That file is the playable game — one
   self-contained HTML document that runs from a `file://` URL with no server and
   no network, on a phone as well as a desktop. **A commit that changes `src/`
   and leaves the build stale ships a game that is not the game.**
3. **Update `docs/NEXT-SESSION.md` losslessly** — prepend, do not overwrite. A
   future session reading only that file must be able to continue.
4. **Record surprises in `docs/HANDOFF.md`'s hard-won-lessons section**, and
   **append any new trap to `§3` of this file with the next free number.**
5. **If your session changed a fact in `§1` or `§2`, update it here.** A stale
   handoff is worse than none.
6. **Commit messages describe what changed in the GAME, not what changed in the
   code.**
7. **Say plainly what you did NOT verify**, and give the user the steps to judge
   anything in `§4.2`.
