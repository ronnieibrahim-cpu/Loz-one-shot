# Prompt for the next session

Paste the fenced block below into a fresh Claude Code session on this repo. It
is written to be self-contained: it names the branch, the remaining jobs, the
traps that are already paid for, and how to prove the work rather than assert
it.

Keep this file updated as work lands — it is the cheapest thing in the repo to
maintain and the most expensive thing to not have.

---

## THE BOARD, UPDATED AGAIN — title screen art, P9's health economy, P9.5's trading sequence, and the checker collision-model consolidation all landed

Four branches merged into this board at once: the title screen is drawn art
now (`claude/title-screen-art-j2lyg9`), P9's health-economy audit found and
fixed a wrong maximum-health cap (`claude/p9-heart-health-economy-crpqyb`),
the Coastwise Chain trading sequence now exists and pays out the Resonance
Rod (`claude/p9-5-trading-sequence-ama7n7`), and every `tools/*.mjs` checker
that used to carry its own private copy of tile passability now asks the
engine's own `Room.solidAt`/`canOccupy` via `tools/lib/collision.mjs`
(`claude/consolidate-movement-models-f1bqez`). Full detail for each follows
as its own section below.

**The merge itself found one gap the consolidation's own inventory couldn't
see:** `check-hearts.mjs` and `check-trade.mjs` didn't exist yet on the branch
the consolidation was cut from, so neither was converted, and both tripped
`tools/test.mjs`'s new `checkNoPrivateCollisionLogic` guard the moment all
four branches landed together (`check-hearts.mjs:210` masked
`PIT|HAZARD|DEEP`, `check-trade.mjs:160` masked seven flags). Both now call
`defWalkable`/`ROUTE_AVOID` from `tools/lib/collision.mjs` instead; no
assertion moved in either (114/114, 43/43). Every other `tools/*.mjs` file
was swept by hand for the same pattern and each remaining raw-flag site is a
narrow, verb-specific test already documented as intentionally out of scope
(gap-hop tracing, cast/dredge stop rules, throw-flight stops) — none
reimplements general passability.

**Also found, not fixed, not blocking:** `node tools/scan-sprites.mjs
--strict` reports 82 hard findings, all in `title_splash` (holes and
outdents in the mottled backdrop/rings). This predates the trading and
consolidation merges — confirmed identical right after the title-screen
merge alone — and is a pixel-art quality question about the title
backdrop, not a manifest-resolution problem: `scan-sprites` reports all 308
sprite names resolved (both the `title` and `trade` packs installed and
readable, nothing missing). Worth a look next session; not touched here
since it isn't a merge conflict and this session was scoped to not write
new game content.

### Title screen is drawn art now — branch `claude/title-screen-art-j2lyg9`

`src/game/title.js` used to draw the game's name as system-font text over a
procedural sea, with a comment saying it was drawn that way "so the title
needs no art" — a placeholder that had survived to be the first screen
anyone sees. It is now a real title card, built to the Oracle-series title
grammar (that card was the reference held up for it):

| piece | what it is |
|---|---|
| `title_caption` | "THE LEGEND OF", small caps, flat fill + outline |
| `title_wordmark` | "ZELDA", 99x28, ornate display serif, bevelled |
| `title_sub` | "ORACLE OF", small caps |
| `title_pill` | "TIDES" in a stadium: pale ring, deep fill, pale letters |
| `title_conch` | the Moon Conch emblem, 32x35 |
| `title_splash` | the mottled backdrop the text sits on |
| `title_press` | "PRESS START", drawn rather than system text |

Read top to bottom that is **THE LEGEND OF ZELDA / ORACLE OF TIDES**, which
is the source cards' exact four-tier structure.

**`src/data/sprites-title.js`** holds all of it. No sheet has this game's
name on it, so per ART-DIRECTION rule 2 this is drawn-to-match, and it is
hand-authored source — NOT a ripper output, so the generated-file rule does
not apply and there is nothing to re-emit.

The important structural point for whoever edits it next: **the letterforms
are hand-drawn silhouettes**, literal `#`/`.` tables, one per display glyph,
drawn stem by stem with 4px stems, 3px bars and flared serif feet. What is
computed is only the shading — a bevel pass (index 0 on every top/left edge,
index 2 on every bottom/right, index 1 inside) and an outline dilation
(index 3). The first version of this file generated the letters by upscaling
a 5x7 sans font, and it read as exactly what it was; no amount of palette
work fixes letterforms. If you need a new display glyph, draw it into
`DISPLAY` at 20 rows and let the passes shade it. `setType` bottom-aligns on
a common baseline and sizes the block to its tallest glyph, which is what
lets the 26-row `Z` rise above the 20-row `ELDA` the way the source's does —
that one oversized leading letter is most of the logo's silhouette.

Design points worth not re-litigating:

- **The series line is deliberate and must not be "fixed".** Mid-session a
  pass replaced "THE LEGEND OF ZELDA" with an invented line, reading Goal 2
  as a rule about names. It is not — it is a rule about mechanics, items,
  dungeons and story. This is an openly-labelled personal fan game that
  stars Link and runs on ripped sheets; the series line belongs on it. The
  owner reverted that call explicitly and CLAUDE.md now says so at the top.
  **Do not strip it again.**
- **`ZELDA` is the hero word, `ORACLE OF` is the subtitle line, `TIDES` is
  in the pill** — the source's exact split, where the full game title reads
  across the small line and the pill together.
- **The Moon Conch is the marquee-item emblem**, overlapping the wordmark's
  lower right where the source cards put the Rod of Seasons and the Rod of
  Ages. It fills the same role in this game (it is what moves the tide), and
  unlike the branding it IS ours, so it is the worked example of where the
  line actually falls. Its shape follows the 16x16 `i_conch` icon so emblem
  and inventory icon read as one object. If you redraw it: the stepped left
  edge is doing the work — a smooth taper read as a striped leaf, and the
  whorl sutures are what make it a shell.
- **The tide waterline is the one piece of scenery** (item 3 of the brief;
  a moon was the alternative). It crosses the full screen width, not just
  the logo — a waterline that stopped at the logo's edges read as a
  highlight on the logo rather than as a sea level. It sits at the pill's
  ankles: an earlier pass ran it through the middle of the hero word and cut
  it in half like a scanline.
- **All three stages (logo, file select, erase) share the gold frame** and
  the same sea behind them. File-select and erase kept their exact existing
  layout, per the brief — only the border and background changed.

All seven sprite names are registered in `src/data/sprite-manifest.js`
(`REQUIRED_SPRITES.title` and `expectedSize`), with the sizes stated by hand
rather than imported from the module that makes them, so a glyph-table edit
that changes an assembled size is a `validate.mjs --strict` failure instead
of a silent stretch.

**Verified by looking at it, which is the only thing that proves a title
screen.** All three stages were screenshotted in the real palette and read
correctly; `preview.mjs` is explicitly not enough here and could not have
caught any of the four problems that took a pass each to find (halo eating
the backdrop, backdrop reading as TV static, waterline bisecting the hero
word, pill letters washing out). Shots went to a throwaway dir and are not
checked in — `node tools/test.mjs --shots` gets the logo and file-select;
the erase stage needs a one-off script that sets
`window.__game.title.cursor = 3` before the second Enter, and the logo needs
`title.t` parked on an even 16-frame boundary or PRESS START is caught
mid-blink.

Not touched, per the brief: save-file logic, input handling, the intro
sequence.

### Two environment notes for the next session

1. **`replay.mjs`, `walk-dungeons.mjs`, `solve-switches.mjs` and
   `check-gates.mjs` cannot launch a browser in this sandbox.** The
   installed playwright package does not match the installed browser build.
   `test.mjs` and `check-build.mjs` already carry a fallback to
   `/opt/pw-browsers/chromium` for exactly this; the other four do not, and
   die on launch before loading a line of game code. All four were verified
   green this session by patching that same fallback in temporarily and
   reverting it — 50/51 replays, 22 walk-dungeons, 14 check-gates, all 9
   switch rooms. **Giving those four the fallback their siblings already
   have is a real five-line fix and a good first job**; it was left out of
   this commit only because a title-screen diff is the wrong place for it.
2. **Every browser-based checker reports one failure, "no page errors — 404
   Failed to load resource".** It is pre-existing and unrelated — confirmed
   by stashing this session's work and re-running. Do not chase it as a
   regression, but it is worth ten minutes to find and delete the dead
   reference.

### P9's health economy: the cap was 13 and nothing could see it

**P9 step 3 is done. Steps 1, 2 and 4 — the region re-gating — are NOT, and are
the next session's job.** See `docs/EXECUTION-PLAN.md`'s P9 block, which now
says which of its four steps landed.

**The headline: maximum health is a SUM, no file contains it, and it was
wrong.** `tools/check-hearts.mjs` (new, in CLAUDE.md's verification table)
computes it from the loaded data. Its first run read:

```
  start                3 hearts
  Heart Containers     6   (one per dungeon boss)
  heart pieces         18  = 4 containers + 2 ORPHANED
  CAP                  13 hearts
```

Thirteen, against a brief asking for 14-16 — and **two of the eighteen pieces
could never complete a container**. Collectable, jingle, counter ticks, paid
nothing, for ever. (The starting prompt for this session said 19 pieces; the
real count was 18 — 14 `entities` pickups, 4 `buried`, and one of those
"placed" is a `puzzle.reward.spawn` in d3. The discrepancy did not change the
direction of the work, since either number is short.)

**Now 24 pieces, cap 15** — the middle of the window, and a shape worth keeping:
six containers from the six bosses, six more from exploration, plus the three
you start with. Half the maximum is fought for, half is searched for. The six
added:

| Where | Why there |
|---|---|
| `d1/0,5,3` Clawcrab Den | its `puzzle.reward` paid out a **sentence and nothing else** — the only fight in D1 that cost health and returned none |
| `d2/1,5,4` Whelk Cell | the Spire's far-east cul-de-sac |
| `d4/0,4,1` East Overlook | corner furthest from the door |
| `d5/0,5,5` Bower Cell | the Shrine's south-east dead end |
| `cave1` Bluff Grotto | had only a rupee chest |
| `cave2` Reef Hollow | on the seafloor patch — LOW tide only; the room's own carving ("walk where fish swam") is the puzzle |

**None of the six sits on a recorded route.** All 51 replays and
`check-playthrough.mjs`'s 19 checks were unchanged, which is the proof they are
rewards for leaving the path rather than things handed to a passer-by. The
instrumented D1 health table is byte-identical to the one in the archived board
below.

**`d3/0,2,2` Bogmaw Hall has the same empty-reward bug as the Clawcrab Den did**
— miniboss killed, one sentence, nothing dropped. It was left alone only because
d3 is already at its two-piece quota. It should get *something*.

**The distribution is now pinned by the checker: every dungeon carries exactly
two.** This is the guard against the way it broke in the first place — a heart
piece is placed while thinking about a room, and the total it moves lives
nowhere. A future session that wants a different split has to edit
`PER_DUNGEON`, which is the point.

**The damage half was re-derived in the same pass, and deliberately not
applied.** Raising the cap is a difficulty change even when no damage value
moves, which is exactly why the two could not be tuned in separate sessions. The
ladder is now pinned in `check-hearts.mjs` — every enemy on a named rung, a new
enemy fails the checker until someone puts it on one:

```
  tier      dmg  in hearts  at start    at cap
  chip       1 qh  0.25 hearts    12        60   2 types
  ordinary   2 qh  0.5 hearts      6        30   13 types   <- P9's anchor, already correct
  heavy      3 qh  0.75 hearts     4        20   7 types
  miniboss   3 qh  0.75 hearts     4        20   8 types
  boss       4 qh  1 heart         3        15   8 types
```

A miniboss hits for exactly what a jellyfish hits for, and at the new cap the
final boss needs fifteen connections to kill a maxed player. The derived fix, on
the half-heart grid the source games deal on: **heavy 3 -> 4 qh, miniboss 3 -> 6
qh, boss 4 -> 8 qh.**

**Why it was not landed — measurement, not caution.** Every enemy it touches in
the only instrumented dungeon (D1's two anglerfry at `0,5,2`, the Clawcrab at
`0,5,3`, Gohmaraq at `0,3,1`) sits *past the Sluicegate*, in the half of D1 the
route cannot reach. The instrumented run would have shown **no change at all**
while the numbers went in looking proven, it would re-open the D1 economy the
previous session closed by measurement, and it would cost a re-record of all 51
replays. **Its prerequisite is job 1 below.** Full reasoning in
`docs/FEEL-SPEC.md`, "The cap and the damage ladder", and in the checker's own
comment.

Two things the checker found on the way that were NOT bugs, and cost a red each
before the data was checked by hand — the same lesson `walk-dungeons.mjs` learned
about one-way ledges: **a buried piece is dredged, not stood on** (the Drowned
Shore's is under an `abyssHole`, deep water, with a bell NPC leaning at it), and
**a piece on a liftable rock is reached by lifting the rock** (three independent
placements use that idiom). The checker was wrong; the data was right.

**Also found and fixed on the way:** two enemies, `brinehulk` (the Abyssal
Keep's second fight, standing in front of Nereth) and `thalassor` (built,
placed nowhere at all), are bosses in every respect but are declared by no
dungeon — so any tool that infers "boss" from `map.dungeon.boss` mis-classifies
them. `check-hearts.mjs` pins bosses by name and cross-checks the declarations
against that list rather than deriving it from them.

**Next session's job, in order:**

1. **Teach the actor an anchor-placement verb** (sink at a chosen tile, walk
   away, recall) and extend `playthrough-route.mjs` past the Sluicegate —
   unchanged from the previous board, and now blocking the damage ladder as
   well as D1's second-half health reading.
2. **P9 steps 1, 2 and 4: the region re-gating.** Eight regions gated on items
   that no longer exist; five gates should be tile-flag-shaped so
   `check-overworld.mjs` can prove them both ways; the Brineglass Lens must
   never be a region gate.
3. Apply the derived damage ladder once job 1 makes it measurable, and
   re-record the replays against it.
4. Give `d3/0,2,2` Bogmaw Hall a real reward.
5. The 32 stale branches are still undeleted (see the archived board below);
   branch deletion still 403s from the proxy.

### The trading sequence exists, and it pays out the Rod — P9.5

**The fourth gap in the content audit below is closed.** The trading sequence
was `progress.trade = {stage, item}` declared, saved, and read by nothing, with
three orphan dialogue lines and no `trader` entity type. It is now the
**Coastwise Chain**: eleven traders, eleven objects, twelve links, ending at the
Maku Tree, who takes the Tide Bell's own rope and one Essence and hands back the
**Resonance Rod**. Full writeup in `docs/TRADING.md`; the short version:

- **One new entity type, `trader`, holding a list of DEALS.** A deal is live
  when `p.trade.stage === stage - 1`, so exactly one deal in the whole world is
  live at a time — a trader further along has nothing to say to you yet even
  while you are holding what they will eventually ask for. Deals live on the
  trader rather than one-per-NPC, which is the only reason the chain can be a
  circle: **Ossa the net-mender is stage 1 and stage 11**, handing over the
  cracked float on the first visit and taking her kettle back on the eleventh.
- **Ten of the eleven traders were already-placed NPCs that changed type in
  place.** No entity id moved, nothing re-phased, and all 51 replays passed
  unchanged on the first run. Each keeps its old flavour line as the trader's
  `waiting` text, so a player who never starts the chain hears the same coast.
- **The Maku Tree still sets `gotRod`**, at the same moment it always did, so
  the Abyssal Keep's Colonnade grate — the one thing in the game that asks
  whether the player went and did the trade — is untouched. `check-trade.mjs`
  proves it in-engine anyway: it takes the Rod the chain paid out down to
  `d6/1,2,4` and rings the grate open.
- **The Rod now costs the chain AND one Essence.** It used to cost the Essence
  alone. That is a real gate — the Rod opens the Salt Pans' vanes — which is
  why `check-trade.mjs` floods the overworld from the village with **bombs
  only** and asserts every link can be stood next to without it. Bombs (from
  the un-gated Coral Spire) are the chain's one item gate: Yarrow is in the
  Marsh.
- **Eleven hand-drawn 16x16 icons** in `src/data/sprites-trade.js`, and they are
  hand-drawn on purpose: `assets/sheets/oracle-seasons-trading-characters.png`
  carries Seasons' own trade items and every one of them is a thing that game
  is about. The people are extracted; the objects are ours.
- **A trade item is not an inventory item.** It never enters `progress.items`,
  is not in `docs/ITEMS.md`'s roster (which `check-items.mjs` asserts the
  registry matches exactly), and the **Quest screen** is the only place to look
  up what you are carrying.

**Everything green after it**: validate, walk-dungeons 23, check-overworld 17,
check-gates 15, solve-switches, check-motion 8, check-music, check-charms 63,
check-towns 58, check-items 82, anchor 14, cleats 15, lens 24, bellows 60,
reefseed 87, dredge 103, replay 51, test 58, check-playthrough 19, and
check-trade 43.

**One thing a future session should know**: the Maku Tree is a `trader` now, not
a `giver`. Gap 2 below — `makuMaster` never plays, so the level-3 sword is
unobtainable and `makuOpenedKeep` is written by a scene that never runs — is
still open, and whoever wires it up should hang it off a second deal or a
cutscene trigger on that same entity rather than adding a second Maku.

### Checkers no longer define their own collision/passability/push logic — `claude/consolidate-movement-models-f1bqez`

**The trigger:** a prior session found that 550 assertions were once green
while no block in the game could actually be pushed, because
`solve-switches.mjs` and `walk-dungeons.mjs` each modelled movement with a
private copy of the collision rule instead of asking the engine. This session
was scoped to find and eliminate EVERY such private model in `tools/`, not
just those two.

**Inventory (found by grepping for the `F.VOID | F.SOLID | F.PIT | F.DEEP |
F.LEDGE | F.HAZARD`-shaped fingerprint and its variants across `tools/*.mjs`,
then verifying each hit by eye):**

- `tools/walk-dungeons.mjs` — its dungeon-reachability flood (`walkableAt`),
  the tide-locked-room flood, and the locked-door-separates-its-room check
  each re-derived walkability from raw tile flags instead of asking a real
  `Room` (via `getRoom`, already imported in the page) for `solidAt`.
- `tools/check-overworld.mjs` — same shape, plain Node, already building real
  `Room` objects via `getRoom` for tile *names* but not asking them for
  *solidity*.
- `tools/solve-switches.mjs` — already called the engine's real
  `game.tryPushBlock` for the push itself (good), but its `notStandable`
  check (can the player stand behind the block to push it) re-derived
  standability from raw flags instead of calling `canOccupy`.
- `tools/find-ledges.mjs` — its `plain()` placement filter re-derived
  walkability from raw flags on top of legitimate placement-only curation
  (no warp/door/stairs/bombable-wall as a lip).
- `tools/check-anchor.mjs`, `check-bellows.mjs`, `check-cleats.mjs`,
  `check-dredge.mjs`, `check-lens.mjs`, `check-reefseed.mjs`,
  `find-crossings.mjs`, `check-towns.mjs` — every one of these carried its own
  `walkableDef`/`occupiable`/`walkable` function reimplementing the exact
  formula `Room.solidAt` already computes, several of them byte-for-byte
  identical copies of each other (a mode-aware `occupiable(d, mode)` appears
  nearly verbatim in four separate files). `check-reefseed.mjs` additionally
  carried a full second copy of `solidAt`'s body in a `Board.solid` method,
  and a copy of `Reefseed.canPlant`'s terrain-block mask.

**What was NOT touched, and why:** a handful of sites combine exactly
`F.SOLID | F.VOID` to ask "does this stop a flying/thrown thing" — the Dredge
Line's cast-stop rule, a hop's mid-flight clearance check, an Anchor throw's
flight. That is a genuinely different, narrower, irreducible question from a
walking body's passability (a projectile crosses DEEP/PIT/HAZARD/LEDGE freely
and only a wall stops it), it cannot be expressed by composing
`tileWalkable`'s `caps`/`avoid` parameters, and every instance already matches
the real engine formula it mirrors (`DredgeLine.update` in
`src/game/items.js`) — verified by reading the source, not assumed. These are
left as direct, narrow, single-purpose flag tests. `tools/test.mjs`'s new
guard (below) is deliberately tuned to leave them alone: it only fires on a
mask naming three or more collision-shaped flags, and `F.SOLID | F.VOID` is
two.

**What changed:**

1. New `tools/lib/collision.mjs` — the one place outside `src/` allowed to
   name a raw tile flag as "solid". It composes `Room.solidAt` (via
   `tileWalkable`/`tileSolid`) and a small extracted engine function,
   `tileDefSolid` (new export in `src/world/tileset.js` — the exact body that
   used to live only inside `Room.solidAt`, pulled out so a checker with a
   resolved `TileDef` in hand, not a pixel to sample, can ask the SAME
   function rather than a copy of it; `Room.solidAt` now calls it too). An
   `avoid` flag mask parameter is how a checker expresses "and also treat
   this as a wall for route-planning" (F.PIT/F.HAZARD, exported as
   `ROUTE_AVOID`) — the same composition pattern `canOccupy` already uses for
   an enemy's `avoidFlags`, not a new rule. `capsForMode('foot'|'swim'|'sink')`
   gives the Cleats' two modes a name instead of writing the capability object
   out at every call site.
2. Every file in the inventory above now calls into `tools/lib/collision.mjs`
   (or, for `walk-dungeons.mjs`/`find-ledges.mjs`/`solve-switches.mjs`, the
   real engine's `canOccupy`/`room.solidAt`/`getRoom`, live in the page —
   these already boot a real headless-Chromium instance of the game and can
   `await import('/src/game/entity.js')` etc.). `check-reefseed.mjs`'s
   `plantableTerrain` now imports a new export, `REEFSEED_PLANT_BLOCK`, from
   `src/game/items.js` (the exact mask `Reefseed.canPlant` uses) instead of
   retyping it — this checker has no live `game` to call `canPlant` on
   directly, so importing the same constant is the strongest link available
   short of running it inside a browser.
3. `tools/test.mjs` gained a guard, `checkNoPrivateCollisionLogic`: it fails
   if any `tools/*.mjs` file outside `tools/lib/collision.mjs` combines three
   or more collision-shaped flags (`SOLID, VOID, PIT, DEEP, LEDGE, HAZARD,
   JUMPABLE, BUSH, ROCK`) in a bitwise-OR mask. Verified against the
   pre-refactor tree (via `git show HEAD:...`) that it actually catches the
   originals, and confirmed silent on the consolidated tree.

**Results, before vs. after — nothing that asserts moved. Two things that
only REPORT a number did, and both are real, both are explained, and both
make the checker MORE correct, not less:**

- `check-overworld.mjs`: 17/17 passed, unchanged. Reported tile/state counts
  rose slightly (2928→2941 tiles in the unheld flood; states similarly) because
  the private formula treated every `F.SOLID`-flagged tile as fully blocking
  regardless of `mask`, while `Room.solidAt` correctly reads `mask: 0` (a
  doorway/cave-mouth cut into a nominally-solid tile) as open. The old
  checker was silently refusing to walk the flood onto cave mouths and town
  doors; no screen's reachability verdict depended on it, so no `check()`
  moved, but the flood's own node count was quietly wrong for the whole life
  of the checker.
- `find-ledges.mjs`: reporter only, no assertions. Candidate count dropped
  942→810 (overworld alone: 322→190) because the private `plain()` filter
  never excluded `F.BUSH`/`F.ROCK` tiles, so it was offering bush and
  liftable-rock tiles as valid ledge-lip placements — tiles a player cannot
  actually stand on as "plain floor" without first clearing them. Confirmed
  by direct count: the data has 87 BUSH-tide-instances and 414 ROCK-tide-
  instances across all rooms. This is a bug the private model was hiding,
  now caught.
- Every other checker touched (`walk-dungeons.mjs`, `solve-switches.mjs`,
  `check-anchor.mjs`, `check-bellows.mjs`, `check-cleats.mjs`,
  `check-dredge.mjs`, `check-lens.mjs`, `check-reefseed.mjs`,
  `find-crossings.mjs`, `check-towns.mjs`) produced BYTE-IDENTICAL output to
  its pre-refactor baseline (diffed directly, not eyeballed). `check-gates.mjs`,
  `check-items.mjs`, `check-motion.mjs` and `check-playthrough.mjs` (19/19,
  matching the board's documented current state) were re-run as a sanity check
  on the `src/world/room.js`/`tileset.js` refactor and are also unchanged.
  `tools/test.mjs` is 59/59 including the new guard.

**Left for later, deliberately not chased this session (out of scope: these
are verb-specific tile-flag tests, not passability):** `castStops`/`snagAt`
in `walk-dungeons.mjs` and `check-dredge.mjs`, `hoppableDef`/throw-flight
stops in `check-anchor.mjs`, `check-items.mjs`'s single `f & 1` scan to find
a fixture tile. Each was read against its real engine counterpart and
confirmed to already match it exactly; none reimplements walkability.

**Not in this session's inventory, because they did not exist yet on the
branch this was cut from: `check-hearts.mjs` and `check-trade.mjs`** (both
landed by the other two branches merged into this same board). Whether either
carries its own private collision/push model, unconverted, needs checking the
next time either is touched.

---

## THE BOARD, UPDATED AGAIN — the route retuned past the push-block blocker, D1's health economy instrumented and fixed

**`tools/playthrough-route.mjs` was stale in exactly the way the previous
board's first job said it was**, and this session did that job: the route now
drives past both locked doors and the Sluicegate to the Anchor chest
(`d1/0,3,2`), using `travel` for room-to-room movement instead of hand-picked
`goto` waypoints (which is what broke — a `goto` aimed at a tile a push block
now solidly occupies fails to path at all, and the whole rest of the old
route quietly played out inside the wrong room). `GOAL.blocked` is gone;
`GOAL.needsVerb` replaces it, naming the real remaining gap honestly: past
the Sluicegate every room is gated by the Anchor's OWN placement verb (sink
on a tile, walk, recall), and `actor-runtime.mjs` has no directive for that —
`dUse` presses whichever button an item is on, which is right for the conch
and wrong for placing something at a chosen tile. That is real dungeon
engineering (the Iron Pipe / Long Race gate pair, two anchor-gauge rooms) and
is the next session's dungeon job, not a bug to route around.

**Two real bugs in the shared actor (`tools/actor-runtime.mjs`) were found
and fixed getting there, both in `dLoot`, both proven behaviour-preserving
(all 51 replays still pass unchanged — a well-behaved pickup is still
collected on the first attempt, so neither fix's code path is exercised by
any existing recorded tape):**

1. A puzzle-reward pickup spawned mid-sweep (mid-`grabDelay`) read as
   "nothing here" and was abandoned for good. The Sunken Hall's fairy — D1's
   only unconditional heal, only reachable at all now that push blocks
   work — sat uncollected on the floor for the rest of every run this way.
2. A reward pickup that pops and settles one tile above its logical spawn
   tile (documented in `dungeons-a.js`'s own comment on the Crab Pit's key —
   "the player can only just touch it") was approached at the WRONG tile
   (its centre-Y, one tile too low) and never collected. `dLoot` now retries
   one tile further north before giving up.

**Health at every room boundary is now instrumented, not guessed.**
`tools/check-playthrough.mjs` prints a table (room, frame span, hearts
in/out, trough, damage, healing) plus the three worst stretches computed
from it. Full writeup, including exactly which enemies' drop odds moved and
why the trough needed a GUARANTEED heal rather than a probability bump, is
in `docs/FEEL-SPEC.md` under "Health economy — D1, instrumented rather than
guessed". The short version:

**Before** (route fixed, looter fixed, no balance changes — seed `20260806`):

```
   room                    frames      in   out   min   dmg  heal
   d1/0,3,6 Drinking Floor  1938-2970  12    10     6     6     4
   d1/0,3,5 Sunken Hall     2970-3954  10    12    10     0     2   <- the fairy, now collectable post-dLoot-fix
   d1/0,2,4 Crab Pit        5477-6050  10    10     6     4     4
   d1/0,3,4 Tide Gallery(3) 6763-7298   8     4     4     4     0
   d1/0,3,3 Locked Stair    7298-8658   4     4     4     0     0
   d1/0,3,2 Sluicegate      8658-8900   4     4     4     0     0
worst stretches: 2850-frame drought (Switch Room -> Sluicegate, no heal at
all); deepest trough 4/12 qh (1 heart) at the Tide Gallery's third pass;
spikes >1/3 max at the Drinking Floor (6qh), Crab Pit (4qh) and Tide
Gallery (4qh).
```

**After** (`drops: 'good'` on the Drinking Floor / Tide Gallery / Locked
Stair enemies, plus one GUARANTEED heart pickup added to the Switch Room's
puzzle reward, both in `src/data/dungeons-a.js`):

```
   room                    frames      in   out   min   dmg  heal
   d1/0,3,6 Drinking Floor  1938-2970  12     6     6     6     0
   d1/0,3,5 Sunken Hall     2970-3954   6    12     6     0     6
   d1/0,2,4 Crab Pit        5477-6050  10    10     6     4     4
   d1/0,4,4 Switch Room     6256-6771   8    12     8     0     4   <- the guaranteed heal
   d1/0,3,4 Tide Gallery(3) 6771-7127  12    12    12     0     0
   d1/0,3,3 Locked Stair    7127-8487  12    12    12     0     0
   d1/0,3,2 Sluicegate      8487-8729  12    12    12     0     0
worst stretches: deepest trough now 6/12 qh (half a heart's worth of max —
i.e. exactly half, at the Drinking Floor, the first fight in the game) and
the run reaches the Sluicegate at FULL health.
```

The Drinking Floor's own trough (half health, first fight) was left alone on
purpose: it is the game's very first combat, the room's odds were already
raised to `good` and simply did not draw a heart on this seed, and a second
guaranteed heal there would push the run's floor above half — which the
brief explicitly ruled out ("a run that never drops below half is as wrong
as one that dies"). Three hits of half-heart contact damage in the tutorial
fight of a three-heart-start game is inside P9's curve, not a violation of
it.

`node tools/check-playthrough.mjs` is 19/19. Every other checker in the
CLAUDE.md table was re-run after the `dungeons-a.js` edits and is unchanged:
`validate.mjs` OK, `test.mjs` 58/58, `replay.mjs` 51/51 (unchanged — proof
the `dLoot` fix is behaviour-preserving), `walk-dungeons.mjs` 23/23,
`check-overworld.mjs` 17/17, `check-gates.mjs` 15/15, `check-anchor.mjs`
14/14, `check-items.mjs` 82/82, `solve-switches.mjs` 9/9.

**Next session's job, in order:**

1. **Teach the actor an anchor-placement verb** (sink at a chosen tile, walk
   away, recall) and extend `playthrough-route.mjs` past the Sluicegate —
   the Iron Pipe/Long Race gate pair, the two anchor-gauge rooms, the
   Clawcrab Den miniboss, the Boss Key, and finally Gohmaraq. `GOAL.room`
   moves to `d1/0,3,1` (or the essence pickup) once it does.
2. Once the route reaches the boss and beyond, the health-economy
   instrumentation should be re-read for D1's SECOND half (the Anchor
   gate rooms, the Clawcrab Den, the boss fight) — nothing here says
   anything about whether THAT stretch is thin, only about the stretch a
   route could actually reach.
3. The 32 stale branches from the branch-audit session are still
   undeleted (see the archived board section below) — branch deletion was
   still 403ing from this session's outbound proxy too; try again.

---

## THE BOARD, UPDATED AGAIN — three branches merged, 32 stale branches classified

**A branch-audit session merged the three branches carrying real unmerged
work, in order: `claude/entity-solid-collision-pdxrhy` (the solid-entity
fix), `claude/playthrough-route-end-714gkr` (docs, declined to extend the
route), `claude/audio-track-structure-mhglzh` (music bridges, adds
`tools/check-music.mjs` to the CLAUDE.md table). All three are `--no-ff`
merge commits on `main`, not squashed. Every checker in the CLAUDE.md
verification table was run after each merge; counts were unchanged
throughout except where the merges' own content changed them (51/51 replays
stayed 51/51 — the branch's own re-recording already covered it; 82 items,
58 unit tests, 24 legends/310 tiles/273 rooms all held).

**`check-playthrough.mjs` moved, and this was expected, not a surprise.**
The `entity-solid-collision-pdxrhy` merge is a real behavior change (push
blocks can be pushed now), so the run gets further than before — it now ends
at `d1/0,2,5` instead of dying earlier — but `check-playthrough.mjs`'s
assertions (and `tools/playthrough-route.mjs`'s `GOAL`/`ROUTE` data) still
describe the pre-fix world, so 5 of its 20 checks now FAIL: `no push block
ever moved`, `keys in hand`, `doors opened`, `chests`, and the stop-room
assertion. This is exactly the retuning job the merged branch itself flagged
(see the archived board section below, "solid entities land, and the route
data is now stale") — **not fixed in this session**, per this session's own
scope (branch consolidation only, no game-code changes beyond what the
merges brought). This is the next session's first job; see below.

**32 other `claude/*` branches were classified and none were merged/deleted
in git** (branch deletion — both `git push --delete` and the GitHub REST API
`DELETE /git/refs/...` — returned HTTP 403 from this session's outbound
proxy: "Write access to this GitHub API path is not permitted through this
proxy." This is an infrastructure restriction, not a judgment call — the
classification itself is done and is safe to act on):

*MERGED (ahead 0 — safe to delete, no unique commits)*: `audit-consolidate-branches-5knfli`,
`dungeon-5-iteration-polish-o6gpys`, `dungeon-6-p8-polish-9vwxpy`,
`dungeon-p8-d4-iteration-1n9lfb`, `enemy-grid-aligned-movement-n2xv16`,
`engine-feel-determinism-lel1me`, `gbc-zelda-movement-sword-r1vxqv`,
`next-session-iteration-o1zrx7`, `oracle-tides-continued-ebfuit`,
`oracle-tides-polish-aqche8`, `oracle-tides-polish-grjnhj`,
`p7-6-multi-screen-rooms-s3m1ms`, `p8-dungeon-generation-muve1i`,
`p8-execution-dungeon-audit-ruwmru`, `playthrough-test-harness-jq9z5o`,
`project-iteration-p7-n3k9cq`, `spatial-tide-level-t2d9kv`,
`tide-levels-test-flakiness-73jc39`, `tidewright-items-impl-nrpd3y`,
`towns-construction-b67b20`.

*SUPERSEDED (ahead >0, but the work reached main another way — safe to
delete)*: `coral-spire-reauth-s93w9t` (1 ahead — superseded by `0a3776f`/
`2980fe4`, the Coral Spire rebuilt around the Brineglass Lens, merged as
P8/D2) · `next-session-iteration-6cyssw` (2 ahead — superseded by `25c3111`/
`d197078`, Thalassia's towns given faces, merged as PT) ·
`next-session-iteration-b2tuo7` (5 ahead) and `next-session-iteration-erdixn`
(10 ahead) — both superseded by `ade9153`, the PT step-5 cliff survey merge
· `oracle-build-script-coklp7` (2 ahead — superseded, per this session's
starting brief) · `p7-6-camera` (7 ahead — superseded by
`p7-6-multi-screen-rooms-s3m1ms`, already merged into trunk) ·
`p8-dungeon-generation-faqood` (1 ahead — superseded by `0a3776f`, identical
commit message, redone on trunk) · `p8-execution-plan-jh6exl` (2 ahead —
superseded by `b235a10`, Tidewash Grotto rebuilt around the Anchor, merged as
P8/D1) · `oracle-tides-boss-music-4c24tm` (32 ahead), `oracle-tides-polish-nphkj0`
(7 ahead), `zelda-boss-behavior-jgbfwo` (28 ahead), `zelda-style-game-piqt8v`
(28 ahead) — all four are the pre-`docs/BRANCHING.md` lineage (the original
engine/sprite/dungeon/boss/HUD/music build, before trunk consolidation was
written down); every deliverable they carry (engine core, extracted sprites,
all dungeons, bosses, HUD, story, music tracks) already exists on `main` in
evolved form via the post-consolidation trunk workflow.

No branch was classified UNCLEAR.

**Next session's first job: retune `tools/playthrough-route.mjs` and
`check-playthrough.mjs`'s stale assertions** now that push blocks work — see
the archived board section immediately below for the full diagnosis (why it
stops at `d1/0,2,5`, what `GOAL.blocked` gets wrong, what needs to change).
**Second job: delete the 32 branches listed above** (`git push origin
--delete claude/<name>` for each) once branch-deletion access is available
again — nothing further needs auditing, only the deletion itself.

---

## THE BOARD, UPDATED — solid entities land, and the route data is now stale

**`Entity.solid` is read now.** `canOccupy` (`src/game/entity.js`) rejects any
position whose hitbox overlaps a non-dead entity with `solid` set, skipping
the check while airborne (`e.flying || e.z > 2`), and an entity never collides
with itself. Verified in-engine before touching any replay: a player stood one
tile south of a spawned block, held `up` for 120 frames, and the block moved
one tile north with the player following flush behind it — the one assertion
550 existing green checks could not make. **Push blocks can be pushed now.
Chests, torches and signposts block the player too.**

**All 51 replays re-verified; 4 changed, and each is explained, not
adjusted-to-match:**

- `d1-descent` and `d2-fork-wrong` diverge a pixel or two within the first few
  hundred to few thousand frames — the actor is now genuinely colliding with
  solid objects it used to walk through, so its path bends slightly. Both
  re-recorded runs complete further than the old (buggy) baselines: d1-descent
  now reaches d1 0,3,3 (the Locked Stair) instead of dying on the overworld,
  which is exactly the room `check-playthrough.mjs`'s stale `GOAL` names as
  the historic blocker.
- `village-walk` diverges ~10px around frame 240: the actor's pathfinder now
  routes slightly differently around the three wandering NPCs, who are real
  obstacles for the first time. No assert on this plan; it still completes the
  same route.
- `village-shop-door` is the one that needed a real look, not just a
  re-record. Its synthetic spawn point (`enter: [...,96,88,'down']`) sat 8px
  from the wandering villager's home tile (6,6 → pixel 96,96); the two
  hitboxes clipped by 2px. That used to be invisible. Now `canOccupy` fails at
  that spawn point, `reconcileWithTide` (called on every `enterMap`, written
  for tide safety but generic in what it checks) invokes `findSafeTile`, and
  the player is relocated flush against the shop's solid wall *before a single
  button is read* — stranding the scripted `hold up` for the rest of the run.
  This is not a bug in the fix; it is a real, if tiny, coincidence in test
  data (the replay's own synthetic start position, not anything in
  `src/data/`). Fixed by moving that one replay's `enter` y from 88 to 80 in
  `tools/replay-plans.mjs`, 8px clear of the villager's hitbox, with the
  reasoning written inline. The scenario is unchanged; it now completes
  (`roomChanges: 2`) as originally intended.
- **This is worth generalising, not just patching once**: any door's
  return-warp coordinate that happens to land within a stationary or
  home-tile NPC's hitbox will now silently relocate the player via
  `reconcileWithTide`/`findSafeTile` on room entry. No checker currently
  looks for this across the whole map. `check-towns.mjs` proves stationary
  NPCs don't sever a screen's connectivity; it does not check whether a
  warp's *landing pixel* clips one. Worth a pass before trusting other towns'
  return warps.

**Every checker in the CLAUDE.md table re-run and green, with the numbers
UNCHANGED except where noted:**
`validate.mjs` OK · `test.mjs` 58/58 · `replay.mjs` 51/51 · `walk-dungeons.mjs`
23/23 (unchanged — it's a separate model that already simulated pushing
abstractly) · `check-overworld.mjs` 17/17 · `check-gates.mjs` 15/15 ·
`check-towns.mjs` 58/58 · `check-items.mjs` 82/82 · `check-charms.mjs` 63/63 ·
`check-anchor.mjs` 14/14 · `check-lens.mjs` 24/24 · `check-cleats.mjs` 15/15 ·
`check-bellows.mjs` 60/60 · `check-reefseed.mjs` 87/87 · `check-dredge.mjs`
103/103 · `check-motion.mjs` 8/8 · `solve-switches.mjs` 9/9 (unchanged — same
reason as walk-dungeons) · `scan-sprites.mjs --strict` 0/0 · all four rippers
reproduce byte-identical · `npm run build` + `check-build.mjs` OK.
**`solve-switches` and `walk-dungeons` did NOT move**, which the prompt that
started this session flagged as something to report either way: both are pure
models of the world that already assumed a push resolves the way `PushBlock`
data says it does, so making the real engine agree with that model changed
nothing they can see.

### `check-playthrough.mjs`: it does NOT yet pass the Locked Stair, and here is why

Push blocks genuinely move in a full playthrough now — the run's own block
audit shows `blocksMoved > 0` (the printed count, e.g. "2955 of 4", is a
pre-existing display bug in `actor-runtime.mjs`'s `_audit_tick`: once
`_blockHome` records a block as `' moved'`, every later frame's position
string differs from that sentinel too, so `blocksMoved` increments once per
frame rather than once per block — cosmetic only, not touched here since it's
outside this session's scope).

But the run does not reach d1 0,3,3 the way `check-playthrough.mjs` still
narrates. **`tools/playthrough-route.mjs`'s `GOAL.blocked` block is stale
data** — it unconditionally prints "THE GAME CANNOT BE FINISHED... stops at
d1/0,3,3" whenever `GOAL.blocked` is set, regardless of what the run actually
did (see `check-playthrough.mjs` lines ~217-222). The run's *actual* new
`ended` room is **d1/0,2,5**, short of 0,3,3, not past it: the `ROUTE` array's
`goto`/`travel`/`use` directives were tuned against the old walk-through
physics, and at least one of them now runs into real collision (a solid
object it used to pass through, most likely inside a room the route
pathfinds through with a fixed frame budget) and the run ends there — cleanly,
no death, no console errors, just short of where the route data expects it to
get.

**This is exactly the follow-up job NEXT-SESSION.md already named**: delete
`GOAL.blocked`, retune `ROUTE`'s directives for the now-real collision (most
likely the `goto`/`travel` legs need either more frames or an explicit path
around whatever it's snagging on), extend the route through the Switch Room
and Crab Pit block puzzles now that pushing works, and past the Sluicegate.
Also fix `check-playthrough.mjs`'s `GOAL.blocked` message to be conditional on
what the run actually hit, not printed unconditionally — it actively misled
this session's first read of the output. **Not done here**, deliberately: it
is real design/tuning work (retracing 83 directives against genuine collision)
and this session's commit is scoped to the one-line fix plus the re-baseline
it required.

### What this session did NOT touch, on purpose

The health economy, the equip order (conch on B / sword on A from a new
game), `check-playthrough.mjs`'s stale `GOAL.blocked` message, and
`playthrough-route.mjs`'s route data are all unchanged. All are real, all are
next.

---

## THE BOARD — read this, not the archive below

**Somebody has now played it, and the game cannot be finished.**
`tools/check-playthrough.mjs` is new: it drives a new game from the title screen
with real button presses, grants nothing, warps nowhere, sets no flag, and plays
on the three hearts a new game actually starts with. It reaches **d1 0,3,3, the
Locked Stair**, and stops, because the world stops there.

### The blocker, and it is one line that was never written

> `Entity.solid` is never read by anything in the movement path. `canOccupy`
> samples TILES only; `moveEntity` asks nothing else.

The player walks through every push block, chest, torch and signpost in the
game. `Player.tryPush` only fires on a movement HIT, so **no block has ever been
pushed, or can be.** Proved in-engine: a player stood one tile south of a block,
holding `up` for 120 frames, ends up NORTH of it with the block still on its
spawn tile.

**D1 therefore cannot be completed.** Two locked doors stand between a new game
and the Tidewright's Anchor; the two keys that open them are the Crab Pit's and
the Switch Room's, and the Switch Room wants both blocks on both `hold` switches
at once. The hub's fairy — the dungeon's only heal — is behind an identical
pair.

`solve-switches.mjs` reports all nine switch rooms "solvable by pushing" and
`walk-dungeons.mjs` counts the key as available, because **both model a push the
engine cannot perform.** That is the gap between a model and a game, and it is
exactly what no flood in this repo could ever have closed.

### THE NEXT SESSION'S FIRST JOB — make the blocks solid

Five lines in `src/game/entity.js`: after `canOccupy`'s tile loop, reject a
position overlapping a non-dead entity with `solid` set (skip when `airborne`).
**It was tried on this branch and reverted, and the reason matters:** the
recorded baseline MOVES. `d1-descent` diverges at frame 1620 and ends dead on
the overworld; `d2-fork-wrong` diverges at frame 240 and never leaves its first
room. So the job is the fix PLUS re-recording all 51 replays PLUS re-verifying
every checker — and it is worth doing on its own, with nothing else in the
commit, because the playthrough harness's determinism proof rests on that
baseline.

When it is done: delete `GOAL.blocked` from `tools/playthrough-route.mjs`, point
`GOAL.room` at the boss room, and extend the route past the Sluicegate. The
Essence assertions in `check-playthrough.mjs` go live on their own.

### What the harness is, so it is not rebuilt

| File | What it is |
|---|---|
| `tools/check-playthrough.mjs` | The beatability test. 20 assertions. Runs the route, then replays its tape blind and compares to the pixel |
| `tools/playthrough-route.mjs` | The route as data, plus `GOAL` — the furthest point the world allows and the blocker stopping it |
| `tools/actor-runtime.mjs` | The page-side actor, EXTRACTED UNCHANGED from replay.mjs so both share one pathfinder and one swordsman. All 51 replays passing to the pixel is the proof the move was behaviour-preserving |
| `tools/playthroughs/playthrough-d1.json` | The recorded tape. NOT in `tools/replays/` — replay.mjs boots everything in there through `beginReplay(doc.setup, …)` and a playthrough tape has no `setup` |

Four directives are new and are playthrough-only: `newgame` (title screen and
intro, real presses), `use` (press whichever button an ITEM is on), `travel`
(screen-level BFS with learned blocked edges — the route planner), and `loot`
(walk over what the fight dropped).

### Two smaller findings from the same run

- **A new game puts the CONCH on B and the SWORD on A.** The intro gives the
  conch first and `autoEquip` fills B before A. Every replay pins
  `equipB: 'sword'`, so the actor's hardcoded `BIT.b` was always right and would
  have sounded the conch at the first enemy of a real run. Fixed in the actor
  (it reads the slot). Whether the DEFAULT is right is an unanswered design
  question — it is the opposite of the convention the source games set.
- **The health economy is thin.** With drops collected the run reaches the
  Locked Stair on 4 of 12 quarter-hearts. Without collecting them it dies in the
  Tide Gallery. The optional Weeping Wall, one room off the route, kills it.
  Some of that is the actor being a worse player than a human; not all of it.

### THE CONTENT AUDIT — what is actually built, and the four gaps

Done after the harness, by reading the data rather than the notes. Several
things the old prompts list as missing are in fact built; several things nobody
listed as missing are not.

**Built and wired:** all six dungeons (item, essence, boss, boss room,
entrance); all six bosses including Nereth with his tide-pinning phases; the
scrimshaw carving quest and seven placed charms; 17 Pieces of Heart and a
container from every boss; the shop's five lines of stock; the Ferryman's Coin;
the Bottled Tide (a big chest in the Salt Pan Vault, and buyable); 22 talking
NPCs and 29 signs. **The Resonance Rod IS obtainable** — the Maku Tree gives it
at `needEssences: 1`, so the old "nothing states where the Rod is found" note is
stale, as is the one about `boulder` and `abyssPlug` being unplaced.

**Every music track content asks for exists**: abyss, cave, dungeon, dungeon2,
ending, finalBoss, marsh, overworld, reef, salt, shop, village, plus title, boss
and eight jingles.

The four gaps, in the order they cost the player something:

1. **THERE IS NO ABYSSAL SEAL.** The story says five Essences open the road to
   Nereth. There is no essence gate anywhere in the data — no seal tile, no
   five-essence check. The Keep's gate screen (`0,1,0`) is ordinary floor with a
   signpost. Worse, `check-overworld` reports the northern region sealed by
   `dredge`/`dredgePlug` and `0,1,0` is in that set — **the Keep may sit behind
   the Dredge Line, which is found inside it.** That would be a second circular
   gate. NOTHING ON TRUNK CAN SETTLE THIS: the flood is an optimistic upper
   bound and answers no ordering question, and `check-progression.mjs` — named
   in the old prompts' baseline — does not exist. Settle it before extending the
   playthrough past D1.
2. **`makuMaster` never plays.** It is the Maku Tree's five-essence beat, and it
   does two jobs: it grants the **level-3 sword**, which is otherwise
   unobtainable, and it sets `flag: 'makuOpenedKeep'`, which **nothing reads**.
   So the sword never leaves level 1 and the flag meant to open the Keep is
   written by a scene that never runs.
3. **`nerethIntro` never plays.** The final boss has a written introduction and
   it is never triggered. You walk in and fight.
4. ~~**The trading sequence is dead data.**~~ **DONE — P9.5.** It is the
   Coastwise Chain now: eleven traders, eleven objects, terminating at the Maku
   Tree, who takes the Tide Bell's own rope plus one Essence and hands back the
   Resonance Rod. `progress.trade` is read and advanced, there is a `trader`
   entity type, and `tools/check-trade.mjs` plays the whole thing in-engine.
   See `docs/TRADING.md` and the P9.5 section at the top of this file. (The
   `tradeKettle` cutscene is the one piece NOT used — the kettle is handed over
   by a trader like everything else, and a cutscene for it would stop the game
   dead in the middle of a conversation.)

**Three sounds are silently missing.** `Audio.sfx` is `if (!d) return;`, so an
unknown name is a no-op with no error and no warning — which is why nothing has
ever caught these. `swim` (player.js, every time you swim), `hookshot`
(items.js, the Dredge Line's cast) and `rumble` (items.js plus two tile
transforms, hauling a boulder or an abyss plug) are all called and none is
defined in `src/data/audio.js`. Five spare dialogue lines (`child1`, `elder1`,
`shopkeeper2`, `signCoast`, `villager3`) are unreferenced ON PURPOSE — story.js
labels them spares — and are not bugs.

**There is no deployment.** No CI, no GitHub Actions workflow, no Pages setup.
The playable artefact is `dist/oracle-of-tides.html`, committed, which runs from
a `file://` URL. "Live" does not exist yet.

### What this did NOT do

Jobs 2, 3 and 4 from the prompt (the three unplaced enemies, the ART-BACKLOG
legibility findings, the ledge families) are untouched. PT step 5 is untouched.
So is extending the playthrough to D2-D6 — there is no point until a new game
can leave D1.

**Note on the prompt that started this session:** it described a baseline that
does not match trunk. `tools/check-progression.mjs` does not exist; P9 is not
done; `walk-dungeons.mjs` is 23/23, not 29/29. The archive below is accurate and
the board above is the state.

---

## What this session did (music track structure, not the D1 blocker)

**This session did NOT touch the solid-entity blocker above.** It worked
`src/data/audio.js` only: `boss`, `village`, `cave`, `title`, `dungeon`,
`shop` and `salt` were single- or double-pattern loops (a 3.2s-25s loop on
tracks that play under the longest fights and in the most-revisited room).
Each now has a new `B` and/or bridge `C` pattern and plays `['A','B','A','C']`,
every new pattern using all four channels (p1/p2/wav/noi), even where the
bridge thins the texture on purpose. `overworld`, `dungeon2`, `finalBoss`,
`reef`, `marsh`, `salt`(was 2, now 3), `abyss`, `ending` already had 3+
patterns and were **not** touched. The six-note jingles (`fanfare`,
`fanfareShort`, `essence`, `bossClear`, `gameOver`, `itemGet`, `secret`,
`heartPiece` — the file actually has eight `loop: false` one-shots, not six;
worth checking which the prompt meant if it matters) were **not** touched.

`finalBoss` was named as a priority target in the prompt but already had
`order: ['A','A','B','A','C']` with three patterns — it already meets the
A-B-A-C-with-bridge bar, so nothing was changed there. Worth a human
double-check that this wasn't supposed to mean something else (a fourth
section? a longer bridge?).

New: `tools/check-music.mjs`, added to the CLAUDE.md verification table. It
proves every track's `order` resolves, every melodic hold (`-`) follows an
actual sounding note (the closest a monophonic per-row format has to
"overlapping notes"), every note's frequency is inside real Game Boy hardware
range for its channel (pulse floor 64 Hz, wave floor 32 Hz — this is *not*
`measured` against a reference, it is derived from the documented GB APU
frequency-register formula, `131072/(2048-x)` for pulse and half that for
wave), and the noise channel never carries a pitched note. All 22 tracks and
55 SFX defs pass.

**Also fixed, incidentally:** `tools/test.mjs` had no Chromium
executablePath fallback for a Playwright/browser-build version mismatch that
`check-build.mjs` already handled; without it `test.mjs` could not launch at
all in this environment. Same fallback pattern, copied over. `test.mjs` now
passes 57/58 — the one "failure" is the browser's own automatic
`/favicon.ico` request 404ing against the dev server, confirmed pre-existing
and unrelated to this change (reproduces on `main` too, once the fallback
lets the harness run at all).

**What was not verified: whether any of this sounds good.** Nothing in this
repo can hear. `check-music.mjs` proves structure, not taste — listen to the
new patterns (files sent alongside this commit) before trusting them.

**Follow-up in the same session: asked to make an overworld theme literally
the Hyrule/Oracle theme.** Refused the literal transcription — reproducing
the actual Oracle of Seasons/Ages overworld theme (itself built on Koji
Kondo's copyrighted Zelda material) note-for-note is reproducing someone
else's copyrighted composition, not a stylistic reference, and that holds
regardless of what CLAUDE.md says this project can override for itself.
Landed a compromise the user accepted: `overworld` gained a new pattern
**D**, a "call to adventure" fanfare flourish with **original pitches** that
borrows only the genre-standard GESTURE (repeated call, upward leap, scalar
run to a held high tonic) rather than any specific copyrighted melody.
`order` is now `['A','A','B','C','D']`. If a future session is asked for
this again, the same answer applies — don't transcribe the real Nintendo
theme even "briefly"; a gesture-homage in original pitches is the ceiling.

---

## Where the towns stand (PT), in one line

**PT steps 1-4 are DONE: the block machinery exists, the Subrosia town kit is
extracted, four screens are settlements with three working doors, and the people
standing in them come off the races sheet.** Step 5, the terrain backlog and the
`cliff` family, is untouched and is the whole of what PT has left.

### What the last session did (PT step 4, the peoples of Thalassia)

**`oracle-seasons-nonhuman-races.png` had never been touched and now supplies
fourteen frames** through `tools/rip-races.py` -> `src/data/sprites-races.js`.
The sheet's geometry is not the one any other ripper here uses: the sprite area
is a grid of 16x16 frames on WHITE cell backings laid over the sheet's own
green, at a pitch of 17, so a frame carries **two** background colours and
neither can be sniffed from a corner. Both are flooded inward from the frame's
border — the same argument `quantise_prop` makes in `rip-terrain.py`, and the
reason a colour the sprite encloses survives. The side frames on that sheet face
LEFT and are flipped on the way out.

**Four peoples, and the design is ours.** The sheet supplies four silhouettes;
one hood in four colours is four peoples, which is the source games' own
palette-swap trick and the reason a town on that cartridge is full of faces
without being full of drawings.

| People | Where | Art |
|---|---|---|
| **Salters** | the pans and the working shore | the hood in orange, front/back/side |
| **Kelpers** | the Drowned Wood and the Bogwater | the same hood in green, front/back/side |
| **Brinekin** | Tidewatch and the fishing hamlets | blue-capped seafarers, front/back |
| **Reefkin** | the Coral Reef | speckled and web-footed, three poses |

**The scrimshander and the digger no longer share a face.** That was the named
weakness: `Scrimshander`'s class default was `npc_elder` and so was the digger's
sprite, two characters standing on one screen with one head between them. She is
Brinekin (`npc_brinewife`) and he is a Salter. The Salt Pans elder, the bog
witch and both reef NPCs also moved onto their own peoples, and four new lines
in `story.js` let them complain about each other, which is how a people gets
said out loud without a lore dump.

**`NPC.frames` had never been used by anything.** The directional table has been
in `game/objects.js` since the entity was written, and every townsperson in the
game faced the camera whichever way they walked. The hooded peoples declare
`down`/`up`/`side`; the Brinekin declare only the two the sheet actually draws,
because a missing direction falls back to `down` and inventing the third would
be drawing, not extracting.

**`check-towns.mjs` grew a sixth clause and it earned itself immediately.** An
NPC is SOLID, and the geometry rule that cost four layouts never cared what was
standing in the corridor. The new pass takes each walkable tile out, re-floods,
and calls it a CUT TILE if a way in or a door goes unreachable — then fails a
stationary entity standing on one. On its first run it failed against content
that had already shipped: **the coast child on Village Shore stood on 5,2, the
only row that crosses that screen, at all three tide levels**, and the Sandpiper
Row signpost stood in its top corridor. Both were moved. A wanderer cannot be
proved this way and is not pretended to be — it is printed as a note, and
`PINCH=1 node tools/check-towns.mjs` prints every town's cut tiles for whoever
is placing the next townsperson.

**The trap that decided how Tidewatch got its Brinekin.** `nextId` in
`src/game/entity.js` is one global counter and `every(e, n)` phases an entity off
its id, so **an entity added to the STARTING room re-phases every enemy in the
game.** One extra villager in Tidewatch made the `d1-descent` actor walk into a
hit it used to dodge, die three rooms later and finish the run on the overworld.
So Tidewatch's Brinekin is a RE-DRESSED villager, not a new one — the entity
count of the starting room is unchanged, and all 51 replays pass untouched. The
three towns no replay walks through did get new people.

**Seen on screen.** `tools/shots/room-overworld_{4_7,4_8,5_8,9_8}-tide1-px80.png`.
The square now has a blue-capped Brinekin, an orange Salter digging by the trees
and the red-kerchiefed scrimshander in the corner, and no two of them are the
same drawing.

### What is weak about the peoples

- **Nobody walks two frames.** Every direction is ONE frame; the sheet's second
  walk frames were not identified confidently enough to take, so a townsperson
  turns but does not stride. The frames are on the sheet — a later session that
  wants them should re-run the component dump described in the ripper's header.
- **The Brinekin have no side view**, so they face the camera when they walk
  east or west. That is the sheet's limit, and inventing one would be drawing.
- **The Maku Tree and the Great Fairy are still hand-drawn** while that sheet
  carries both of them at full size. `npc_maku` is a 16x16 impression of a
  32x32 object, which is the exact complaint the tree had.
- **Nobody has talked to any of them.** The new lines are proved by `validate`
  and by nothing else.

### What the last session did (PT, towns and buildings)

**A BUILDING IS NOT A TILE, and now the engine agrees.** `registerBlocks` in
`src/world/tileset.js` plus `Room.expandBlocks` in `src/world/room.js`: a block
is registered once as its grid of cell tiles, and a room grid places it as a
RECTANGLE OF ONE LEGEND CHARACTER —

```
'gjjjgHHHgg'     one house and one shop, not eighteen tiles that
'gjjjgHHHgg'     happen to line up
'gjjjgHHHgg'
```

The expansion claims each rectangle top-left-first, so six H's in a row are two
shops rather than an ambiguity, and a footprint that is not exactly the block's
size THROWS with the room's key. Nothing downstream knows blocks exist: the
cells are ordinary tiles with ordinary flags, so collision, the tide field and
every checker are untouched. **The tree's `quad:` machinery that the brief said
to generalise was never on trunk** — `QUADS` in the ripper is empty and no
engine code reads a `quad` field. Blocks replace it and cover the 2x2 tree case
if a session ever wants it.

**The kit is extracted whole off `oracle-seasons-tileset-subrosia.png`** by the
`TOWN` table in `tools/rip-terrain.py`: the blue SHOP, a green house, a red
house, a shuttered house, the 2x2 well, the 3x2 stump, the paling fence,
barrels and two crate stacks. 10 blocks, 51 cells, in two ground variants each.
Three things about the extraction a later session will need:

- **It installs its palettes**, unlike every other pick in that tool. Those
  keep the palette their tiledef already binds because the game has been
  drawing grass for its whole life; a roof has never been drawn at all, so
  there is no palette to preserve and the cartridge's colours are the point.
  Six palettes, and cells within one building name different ones — a roof is
  roof-coloured and a front is timber, which is how the source draws them.
- **Transparency is flooded from the BLOCK's border, not the cell's.** A roof's
  rounded corner has to show the region's own grass, and on the green house the
  roof's yellow trim is the same yellow as the dirt behind it — so colour
  equality would punch holes in the trim and a per-cell flood would let the sky
  in between two roofs.
- **Two coordinates in `assets/sheets/README.md` were wrong** and are corrected
  there: the stump is 3 cells at c7-c9 r10-r11, and the spring band's fence is
  the wooden paling at c11 r11-r12 (the r32 picket is the winter band's).

**Four screens are towns**, all in `src/data/overworld.js`, all proved by
`tools/check-towns.mjs` (54 assertions):

| Screen | What is on it |
|---|---|
| `0,4,7` Tidewatch Village | The square: the SHOP, a house you can enter, the Maku Tree's hollow in the treeline, crates and barrels. Three doors |
| `0,4,8` Village Shore | The net-mender's cottage, the well, the tide pool that was already there |
| `0,5,8` Driftwood Strand | The timber yard: the chopping stump and a fence. No doors — a settlement is not only its houses |
| `0,9,8` Sandpiper Row | The Shallows' fishing hamlet, on SAND variants: one cottage open, one shuttered |

Three new one-room interiors (`houseHearth`, `houseNets`, `houseSandpiper`)
with people in them, and the shop's and Maku's return warps moved to the doors'
new positions.

**`tools/check-towns.mjs` earned itself on its first run, nine failures deep**,
and the load-bearing one is that **its flood is ON FOOT**. Written with the
overworld checker's flood — which grants swimming, because the player
eventually owns the Cleats — three of the four towns passed while being severed
at HIGH by a tide pool. Adding `F.DEEP` to the impassable mask turned them all
red. It also proves each door is a warp and each warp is a door, that every
interior warps back onto ground that is not the doorway itself, and that no
entity is standing inside a building.

**The geometry rule that cost four layouts:** a 10x8 screen holding two 3x3
buildings has exactly ONE row left that crosses it. A 2x2 well or a 3x2 stump
dropped in that row severs the screen — usually only at HIGH, where the tide
has already closed the other way round. Only 1x1 dressing goes in the road; the
well and the stump live on screens with one building. Village East (`0,5,7`) was
reverted for the same reason: its one-way ledge run leaves it a single corridor,
and nothing three tiles wide fits in it.

**Two things outside the towns had to change:**

- **`check-overworld.mjs` reads tile NAMES now, not legend characters.** A
  character used to be enough — one character, one tile, anywhere. Nine H's are
  nine different tiles, and `getTileDef('block:bShop')` returns the empty tile
  whose flags are 0, so the flood walked straight through the shop and reported
  17/17. It builds every screen and reads `room.baseName`. **Any tool that
  resolves `def.map[y][x]` through a legend has the same hole.**
- **A new game started in an alley.** `progress.pos` was 72,64, which the
  rebuilt square turned into the gap between two buildings; three movement
  probes in `test.mjs` failed honestly. The start is 72,72 now — the middle of
  the square, facing the shopfront — and the probes moved with it.

**Seen on screen, and for once it is all good news.** `tools/shots/room-
overworld_{4_7,4_8,5_8,9_8}-tide1-px80.png`, and 4,7 at all three levels. The
village reads as a village at a glance: a red house and a blue SHOP either side
of a square, a dark doorway in each front, the Maku hollow as one opening in
the treeline (three framed cave mouths in a row read as holes in the grass —
that was the first cut). The well, the stump and the paling fence all read as
what they are.

**`village-shop-door`** is a new replay: stand in the square, walk north into
the middle cell of the shopfront, come out again. `roomChanges: 2` is the
assertion with teeth — the door fires once each way and the return does not
bounce back through it. `village-walk` was re-recorded for the rebuilt square
(704 frames); its counts are not comparable with the pre-town recording,
because the world moved rather than the movement.

### What is weak about the towns

- **Tidewatch does not answer the tide.** There is no tide tile in the square,
  so the village looks identical at LOW, MID and HIGH. The Shore has the pool
  and Sandpiper has its bars; the village itself is a dry screen in a game
  about water, and a slipway or a flooding gutter along one edge is the obvious
  fix. It was left out because every candidate placement severed the square.
- **Nobody has walked a town.** The door is proved in-engine by one replay; the
  other two doors, the fence, the stump and every route are a checker's word.
- **Four buildings, one plan.** The green, red and shuttered houses are the
  same 3x3 with a different roof colour and a different middle cell. That is
  what the sheet gives, and it means a town is legible but not varied.
- **Step 4 is done** — see the session above. What is left of that sheet is the
  Maku Tree, the Great Fairy, the Gorons and several more Zora and Tokay poses.
- **Five ground variants are registered and unplaced** (`bShopSand`,
  `bHouseGreenSand`, `bHouseShut`, `bWellSand`, `bStumpSand`).
  `check-towns.mjs` prints them as a note rather than failing: a variant is a
  ground, not a building, and requiring a sandy shop before there is a sandy
  town that wants one is a checker commissioning content.
- **The town legends are `town` and `townDunes` only.** A marsh, cliff or salt
  settlement needs a third ground variant and a third legend; the pattern is
  two lines in `tiles-core.js` (`TOWN_GROUNDS`) and two in `legends.js`.

---

## The prompt to paste — PT step 5, the terrain backlog

This is the next session. PT steps 1-4 are done and written up above; step 5 is
all that is left of PT, and P9 is what PT was blocking. The general-purpose
block further down this file is still accurate for anything else.

**Step 5 is started, and the expensive half of the cliff job is already paid
for.** `caveMouth` is extracted (the Subrosia tileset at 176,1632 — the
hand-drawn one was a frame with a hole in it, which is why Tidewatch's first
layout read as holes in the grass). The CLIFF SURVEY is done and written up in
`docs/ART-BACKLOG.md`: the source is `oracle-ages-overworld.png` at phase
(2, 8), every piece of a complete family has its cell coordinates listed, and
the one thing left is a DESIGN decision the survey cannot make — the Ages cliff
is a plateau edge seen from above and this game's cliff is a wall seen from the
front. The backlog recommends autotiling the tiles the game already has, because
it changes no flags and re-authors no screens. **Read that entry before opening
a sheet.** `palm` is surveyed too and is 32x32 like every Oracle tree, so it is
a block-and-re-author job rather than a swap.

```
Finish PT step 5, the terrain backlog. The `cliff` family is the whole of the
difficulty and THE SURVEY FOR IT IS ALREADY DONE — docs/ART-BACKLOG.md has the
sheet, the phase, the cell coordinates of a complete family, and the design
decision that is all that is left. Read that entry first; do not re-survey a
sheet somebody already read.

`main` is trunk. Branch from it. One prompt = one session = one branch.
Run `git ls-remote --heads origin` before you start and look for a branch that
has already done this.

READ, IN THIS ORDER:
  CLAUDE.md               the hard rules, including "if a sheet has it, extract
                          it" and the traps list. They are hard rules.
  docs/ART-DIRECTION.md   binding for anything visual. Rule 1 is EXTRACT, NOT
                          DRAW.
  docs/ART-BACKLOG.md     the ranked list. "Carried over from NEXT-SESSION" at
                          the bottom is step 5's actual scope.
  docs/briefs/AGENTS.md   section J is the extraction workflow.
  assets/sheets/README.md which sheet has what, and which are still untouched.
  docs/HANDOFF.md         environment setup FIRST, then the hard-won lessons.

ENVIRONMENT, BEFORE ANYTHING ELSE. Playwright asks for a browser revision the
pre-installed Chromium does not match, so every headless harness dies with
"Executable doesn't exist" until you shim it. Exact commands are in HANDOFF
under "Environment setup a fresh container needs". `pip install pillow` before
any rip-*.py tool will run.

WHY THE CLIFF IS NOT A SWAP, and this is the whole job. The Oracles build a
cliff out of SEVERAL tiles — a face, a top edge, two outside corners, two
inside corners, and the stair — and this game spends ONE tile on all of it. So
extracting a cliff face is not enough: every screen that currently draws a
cliff has to be re-authored to say which PART of a cliff each of its tiles is,
or the new art will look worse than the impression it replaces. Decide the tile
vocabulary FIRST, on paper, then extract to it. `node tools/preview.mjs --tiles
--scale=2` shows what the game currently has.

THE ORDER docs/ART-BACKLOG.md ranks it in:
  1. the `cliff` family — one extraction covers eight tiles, cliffs are on most
     screens, and it is a content decision rather than a swap;
  2. the `ledge` families — four directions, nine palette variants each;
  3. `palm`, `pot`, `sign`, `dBlock`, `dStairs`, `spikes`, `caveMouth`;
  4. water is BLOCKED and should not be attempted — every terrain sheet in the
     repo is an assembled static map, so there is no second animation frame to
     extract. It needs a sheet that has one.

CONSTRAINTS, and the first has cost a session before.
  - A CLIFF IS SOLID AND SOLID TILES SEVER SCREENS. Run node tools/validate.mjs,
    node tools/check-overworld.mjs and node tools/check-towns.mjs after EVERY
    screen you re-author, not at the end of a batch.
  - EXTRACTION LANDS IN A GENERATED FILE. Add the cell to the ripper's
    coordinate map and re-emit. Removing something means removing its entry and
    re-emitting, not deleting lines from the output. Run every ripper once
    before you change anything to confirm each still reproduces byte-identically.
  - A TILEDEF FIELD THE REGISTRAR DOES NOT NAME IS DISCARDED. `registerTiles`
    in src/world/tileset.js copies field by field.
  - DO NOT ADD AN ENTITY TO A ROOM A REPLAY WALKS THROUGH. `nextId` is one
    global counter and `every(e, n)` phases enemies off it, so one new NPC in
    the starting room re-phases every enemy in the game. Re-dress an existing
    one instead. See HANDOFF, hard-won lessons.
  - SCREENSHOT EVERY SCREEN YOU FINISH AND LOOK AT IT.
    `node tools/shoot-rooms.mjs --tide=1 --px=80 overworld,4,7` writes a real
    in-game frame in the real palette; `tools/preview.mjs` renders one palette
    and proves silhouette only. Every terrain fault this project has hit
    validated clean and previewed fine.

BASELINE — confirm it before changing anything and keep every line green.
THE CHECKERS TAKE A WHILE. Run them; do not reason about correctness instead.

  node tools/validate.mjs           clean (two expected fx_slash warnings)
  node tools/test.mjs               58/58
  node tools/replay.mjs             51/51, eleven replays to the pixel
  node tools/walk-dungeons.mjs      23/23 over six dungeons
  node tools/check-overworld.mjs    17/17
  node tools/check-gates.mjs        15/15
  node tools/check-towns.mjs        58/58   <- PINCH=1 prints each town's cuts
  node tools/check-items.mjs        82/82
  node tools/check-charms.mjs       63/63
  node tools/check-anchor.mjs       14/14
  node tools/check-lens.mjs         24/24
  node tools/check-cleats.mjs       15/15
  node tools/check-bellows.mjs      60/60
  node tools/check-reefseed.mjs     87/87
  node tools/check-dredge.mjs       103/103
  node tools/check-motion.mjs       8/8
  node tools/solve-switches.mjs     9 switch rooms, one push per block
  node tools/scan-sprites.mjs --strict   0 hard findings
  python3 tools/rip-terrain.py      regenerates tiles-terrain.js BYTE-IDENTICAL.
                                    Same for rip-hud.py, rip-dungeon-themes.py
                                    and rip-races.py. If one does not, someone
                                    hand-edited a generated file.
  npm run build && node tools/check-build.mjs

EVERY SESSION ENDS BY RUNNING `npm run build` AND COMMITTING
dist/oracle-of-tides.html. That file is the playable game. A commit that changes
src/ and leaves the build stale ships a game that is not the game.

Update docs/NEXT-SESSION.md losslessly before you finish, and record any
surprise in docs/HANDOFF.md under hard-won lessons.

Do the work yourself rather than spawning subagents — past sessions hit usage
limits that way and lost the work.

Tell me plainly what is done, what is weak, and what you skipped.
```

---

## Where P8 stands, in one line

**P8 IS COMPLETE. All six dungeons are done and compliant, the six-versus-eight
consolidation is done, and P9 may start.** Do not re-author a finished dungeon.

### What P9 inherits, and the four things it should look at first

1. **NOBODY HAS PLAYED ANY OF IT.** Six dungeons, six different fixtures, and
   every claim on the board is a checker's. No session has compared them, so
   nobody knows whether the difficulty curve across the six goes the right way,
   or at all. This is the largest open item in the project and it is the one
   thing no tool in the repo can close.
2. **Three enemies are registered and unplaced** after the fold: `thalassor`,
   `saltwraith` and `gustharpy`. Hand-drawn art sitting in the shipped build
   that nothing in the world draws. Either place them or take them out with
   their sprites — and if you take them out, remove the cell from the ripper's
   map and re-emit rather than editing the generated file.
3. **The overworld is still gated for eight dungeons.** P9's own brief is the
   re-gate; the fold means the Salt Pans and the Reef Palace are now one-room
   ruins rather than dungeon approaches, so the routing through those two
   regions wants a second look.
4. **`docs/ART-BACKLOG.md` has four legibility findings** from D2, D3 and D4,
   all the same shape: the mechanic is legible when it works and silent when it
   does not. D5's bole and D6's lintel are the two that got this right and they
   are the argument for how to fix the others — when the answer wants to be a
   shade of water, reach for a whole tile of art instead.

### What the last session did (P8/D6, the Abyssal Keep and the Dredge Line)

**D6 is re-authored around the Dredge Line, it is the last dungeon, and the same
session did the consolidation.** 26 rooms over two floors, the line at room 13,
three crossings, three caches, `tools/check-dredge.mjs` (103 assertions) and the
`d6-mooring` replay. The dungeon's header comment in `src/data/dungeons-b.js`
states the primitive once and builds the rooms out of it.

**The finding that decided the design, and it is the one the whole game had been
building toward.** The player of the sixth dungeon owns the Cleats, so deep
water is a road and no sea level is a wall. A barrier in the Keep has to be a
PIT — the only thing left that neither Cleat mode crosses and no conch fills. So
every crossing here is a shaft, and what gets you over one is a mooring ring the
line hauls you to.

> THE LINE CROSSES WHAT THE SEA UNCOVERS, AND THE FLOOR GIVES UP ONLY WHAT THE
> SEA COVERS.

**One engine change carries the whole dungeon.** `ITEMS.dredge.use` refuses
while `inDeep || underwater`, on exactly the grounds the Bellows and the
Reefseed refuse — a weighted line is thrown from your heels. Without it the
answer to every mooring is to swim into the middle of the shaft and cast from
there, and no arrangement of ground can be made to matter.

**Two crossing shapes, so three rooms are not one idea three times.** The
DROWNED STAND is worked at LOW (`3`/`dWell` is wading depth at LOW and over your
head above it, so the ground you brace on is the tide decision). The SUNKEN BAR
is worked at HIGH (`7`/`dLintel` is new: the Keep's own masonry across a shaft,
stone until HIGH covers it, and a cast stops dead on `F.SOLID`). They are exact
opposites, and **the Crossed Shafts** — 2x1, the Boss Key — is the only room
holding both: in at HIGH, on at LOW, and you cannot hold two seas.

**The tide theme, and it is the only one of the six that wants the water ON.**
`DredgeLine.dragBack` searches a tile the weight passed over only if that tile
carries `F.WET | F.SLOW` at the level it resolves at. `6`/`dSilt` is new — one
extracted art in two palettes, bleached on the dry pan and blue once the sea is
over it — so **the floor gives up what it is holding only while the sea is on
it.** Every room past the item is therefore a crossing at one sea and a cache at
another, and the order cannot be reversed.

**`tools/check-dredge.mjs` proves eleven things and it earned itself**, unlike
`check-lens.mjs`, failing four on its first run. The load-bearing clause is "no
other sea crosses it", and getting it right took two attempts — see HANDOFF.
Every closure clause is proved TWICE, once at the line's reach and once at the
Coilrope's, because the charm that lengthens the line is hand-placed in this
dungeon and the second pass is what caught a cache one tile inside it.

**Seen on screen, and it is good news for the second dungeon running.**
`tools/shots/room-d6_1_2_3-tide1-px80.png` and `-tide2-` are the same room one
conch apart: at MID a slab of grey masonry stands in the shaft, at HIGH it is a
square of open water, and nothing else in the room has moved. A whole tile of
art appearing and disappearing, the way D5's bole does. That is the first time a
CROSSING mechanic in this project has been legible in a still frame.

**Four things changed outside D6:**

- **`walk-dungeons.mjs` can cast**, from the dungeon that hands the line over.
  A post within reach with nothing solid in front of it makes the tile before it
  passable. Without it the Keep's whole upper floor reads as stranded.
- **`walk-dungeons.mjs` counts a `buried` key.** `room.buried` was invisible to
  every sweep in that file and the Keep's fourth Small Key lives in it, so the
  dungeon was walked believing it had three keys for four locks.
- **`essenceCount()` is new in `src/world/maps.js`.** The HUD, the quest screen
  and the save slots all hard-coded `/8` against a plan that has always said
  six.
- **`dPostAbyss`** puts the shared mooring post over the Keep's own floor. The
  shared `dPost` names the BRICK floor in its `underArt`, so every post in an
  abyss room had been drawing another dungeon's flagstones round its own feet.

### The consolidation, and how it was settled

`docs/ITEMS.md`'s primary roster gives D6 as the Abyssal Keep holding the Dredge
Line, and CLAUDE.md says content disagreeing with that file is wrong. So `d6` IS
the Abyssal Keep. `d7` and `d8` are gone from the data; the Reef Palace and the
Salt Pan Vault are one-room ruins on the overworld, each keeping the item its
dungeon used to hand over — the Bottled Tide case in the Vault, and the Mermaid
Suit moved into the Keep behind its miniboss. The Brinehulk was given a new home
keeping the Boss Key. The story counts to six now instead of eight. Full table
in `docs/DUNGEON-STATUS.md`.

### What is weak about D6

- **Three crossings, two shapes.** Two shelf crossings on different axes and one
  lintel, with the Crossed Shafts composing both. One shape more than D5 had and
  still not four.
- **The cache marker reads better dry than wet.** The ring is visible at both
  seas, which is right, but it is clearer at the sea where it does nothing. What
  actually tells the player is the whole pan turning blue.
- **Nothing makes the player walk into the teaching room.** The Slack Water is
  one room east of the vault and holds only a Piece of Heart.
- **Nobody has played it.** One crossing and one cache are proved in-engine by
  the replay. The rest are a checker's word.

**`docs/DUNGEON-STATUS.md` is the board and it is what a dungeon session opens
first.** Every dungeon with its status and the commit it landed in, the
checklist that defines "done", and each outstanding dungeon written out as a
to-do with the problem it has to solve. Tick it before you finish — a dungeon
session that leaves that file unchanged has not reported its work. It also
carries the reason it exists: D2 was finished on a branch that was never merged,
so trunk said "outstanding" for a dungeon that was done and it was nearly built
twice. **Run `git ls-remote --heads origin` before you start.**

### What the session before that did (P8/D5, the Drowned Wood Shrine and the Reefseed)

**D5 is re-authored around the Reefseed, and the hard part was that the item
cannot open a path at all.** 24 rooms, one floor, the Reefseed at room 14, five
groves, `tools/check-reefseed.mjs` (87 assertions) and the `d5-overthrow`
replay. The dungeon's header comment in `src/data/dungeons-b.js` states the
primitive once and builds five rooms out of it.

**The finding that decided the whole design, and it took most of the session.**
`Reefseed.canPlant` refuses SOLID, PIT and VOID at EVERY tide level, not merely
the current one. So a pillar may only be grown where the player could already
stand or already swim: the item can never make a route, only close one or dry
one. What is left are the two things nothing else in the game does —

> A PILLAR IS GROUND AT LOW AND AT LOW ALONE, AND YOU CANNOT PLANT A STAKE FROM
> THE WATER.

The second half is one new guard in `ITEMS.reefseed.use`, refusing while
`inDeep || underwater` on the same grounds the Squall Bellows refuse. It is what
makes throwing range mean anything: a seed carries **exactly two tiles**, so a
stake more than two tiles from dry footing can only be planted from another
stake.

**The fixture, and it is a straight line.** `bank — bole — STAKE — snarl`.
`dSnag` is a drowned tree: solid at LOW and MID, open water at HIGH, and
`room.solidAt` refuses a SOLID tile to a thrown seed exactly as it does to a
walking body — so the throw only clears it at HIGH, and the pillar it leaves is
only ground at LOW. `dSnarl` is a kelp snarl whose ONLY transform is `cut`;
`Player.startSwing` returns early while `inDeep`, so a swimmer beside one cannot
touch it and a bomb finds nothing to break. The stake is the only dry square
next to it.

**Why the line matters, and this is the geometry a later session will break.**
A bole or a snarl two tiles from a standable tile does not block a seed, it
CATCHES one — the seed flies over the square between and is stopped by the
solid, planting on the square between. So the two solids must be opposite each
other across the stake, with water on one perpendicular side (how you reach the
stake at LOW) and a `0` sump on the other (neither standable nor plantable, so a
stray seed can do nothing with it). Any other arrangement gives the room a
second answer, and `check-reefseed.mjs`'s closure clause is what says so.

**A structural dead end, so nobody spends a session on it twice.** The groves
were first designed as push-block crossings — a block cannot enter deep water,
so a pillar is the only road across, and the tide decides whether the road is
there. It cannot be made to work. The player pushing a block INTO a stake is
always standing exactly two tiles from that stake with a non-solid square (the
block's own tile) between them, so they can always throw the seed from the same
square they push from and the room falls to a fixed LOW. There is no arrangement
that fixes it.

**`tools/check-reefseed.mjs` proves ten things**, and two of them are new in
kind. The load-bearing one is that **LOW does not build the room**: fix the sea
at LOW, plant every seed that can be thrown from dry footing the player can
reach, do it again with those pillars in place, and keep going up to
`REEFSEED_CAPACITY` — every landing, not only the declared stakes, because a
pillar on an ordinary square of water is somewhere new to stand and can be the
solid a later seed is caught against. The other is that **nothing the player can
build can brick the room**: a pillar is permanent and SOLID at MID, so for every
tile a seed can come to rest on, a pillar there must leave the room's doorways
joined at SOME sea. That is CLAUDE.md's "a solid tile can strand a room" trap
with the player holding the trowel, and no other tool in the repo can see it.

**Three things changed outside D5:**

- **`progress.giveItem` now stocks a counted item.** The rule that a Reefseed, a
  bomb or a bottle arrives with something in it lived inside `Game.openChest`
  and nowhere else, so a giver, a cutscene or a harness handed over a working
  inventory entry attached to an empty pouch. The replay is what found it: a run
  that threw a seed which did not exist, recorded perfectly deterministically,
  with every checker green.
- **`walk-dungeons.mjs` knows a snarl is a door**, the same exemption a puzzle
  door and a wheel door already had. Without it two thirds of d5 is stranded.
- **`replay.mjs` spans carry `probeNames`** — what the probe TILES currently
  are. `d5-overthrow` exists to check the prover's reproduction of the seed's
  flight against the engine's own, and the only evidence that settles it is the
  name of the tile the seed came down on. It reads `coralPillar|dSnarl`.

**Seen on screen, and for once it is good news.** The bole is a whole tile of
art that appears and disappears: a tree at LOW and MID, open water at HIGH, and
in the Standing Grove at 3,5 there are two 2x2 stands of them doing it before
anything depends on it. Unmissable in a still frame, which is the first time in
four dungeons that the mechanic has been legible at all — D2's three blues, D3's
invisible torrents and D4's silent failing drain were all the same complaint.
The argument to carry into D6: when the answer wants to be a shade of water,
reach for a whole tile instead.

### What is weak about D5

- **Five groves, one fixture.** Four orientations of the line and one double,
  and the geometry above is why. Honest, and still repetitive.
- **The snarl is a bush** — the extracted bush in the dark-oak palette. It reads
  correctly as "cut this" and identically to every bush a bomb DOES open.
- **The replay does not cut a snarl.** A replay's equipment is fixed in its
  setup and the grove wants the Reefseed, the conch and the sword in two slots.
  It proves the throw and the sea; `check-items.mjs` owns the swing.
- **Nobody has played it.** One grove is proved in-engine. Four are a checker's.

### What the last session did (P8/D4, the Cliffside Cistern and the Squall Bellows)

**D4 is re-authored around the Bellows, and the hard part was that the item
takes your feet.** 24 rooms, one floor, the Bellows at room 12, five sill rooms
holding six wheels, `tools/check-bellows.mjs` (60 assertions) and the
`d4-drowned-sill` replay. The constraint table is in `docs/EXECUTION-PLAN.md`
under "P8 status", and the dungeon's header comment in `src/data/dungeons-a.js`
states the primitive once and builds five rooms out of it.

**The problem, because D5 and D6 will each have their own version of it.** The
Anchor did not FIT. The Lens could not be REQUIRED. The Cleats gated nothing.
The Bellows' problem is that the cone lasts exactly as long as the button is
down and `Player.updateBellows` returns before the mover runs — so a room you
cross by holding the button and walking is not a Bellows room. What the cone
opens has to be used by something that is not you:

> a drowned wheel does not turn, and the only thing that takes the water off one
> is the gust that has to turn it.

`GustWheel.drowned` is four new lines: a wheel standing in deep water loses its
turns rather than banking them, so pumping at it under water for long enough
cannot open it. The cone's `delta: -1` is what un-drowns it, and the cone is
also what turns it, and you cannot walk into it to check.

**Two shapes, so that five sills are not one idea five times.** The SUMP SHELF
is worked at MID (`0` is a pit at LOW and deep above; `3` is shallow at LOW and
drowned above), the DROWN-WALL SHELF at HIGH (`9` is stone until HIGH covers it;
`1` is dry, wading, drowned). Every wheel sits across a trench of `O` — pits,
not water, because the player of this dungeon owns the Cleats and a moat is a
road. The Crossed Sluices (`0,4,2`) holds one of each and the Boss Key behind
both, so the room is the dungeon's idea said out loud: you cannot hold two seas.

**`tools/check-bellows.mjs` proves seven things per sill**, and reads the cone's
reach out of feel.js: no hand reaches the wheel at any level in any mode; it is
drowned at the sea the room is played at; one level down it is not; **no sea
level frees it anywhere you could stand and pump** (the load-bearing one — drop
it and the answer is "sound the conch to LOW and blow"); the declared stand is
reachable, dry, and has the wheel in its cone; the stand is unreachable at every
level where the wheel is already clear; and every door a wheel opens is a shut
door that separates its room at all three levels. It also sweeps the game for a
wheel outside a declared room.

**One soft lock found by asking what happens if you walk away.** The Gauge's
key and the Boss Key are spawned by room scripts, and a wheel fires once and is
open forever after — so leaving either room without collecting lost the reward
with nothing left that could release another. Both rooms now put it back in
`onEnter`, guarded by a `saveKey` so a collected reward does not return, and
`check-bellows.mjs` fails any sill that `gives` something without an `onEnter`.
Verified live in all four directions.

**Four things changed outside D4:**

- **`Tide.blows` — the cone no longer blows through stone.** `covers` was pure
  geometry, so a sealed wheel could be turned through two walls. Line of sight
  resolves at the BASE level, never through the field, or the call does not
  terminate.
- **`GustWheel` restores its open state from the save.** The flag was written
  from day one and never read.
- **`walk-dungeons.mjs` knows a wheel door (`bellowsRoom.opens`) is passable and
  a wheel payout (`bellowsRoom.gives`) is countable.** A script spawn is
  invisible to every sweep in that tool.
- **`shoot-rooms.mjs --bellows --dir=`** holds the item down through a real key
  event so a cone can be photographed. Setting `player.bellowsHeld` from outside
  survives zero frames — `handleInput` clears it at the top of every frame.

**Seen on screen, and it is half good news.** At MID with the cone open the
wheel's tile goes (38,76,140) -> (70,133,175) while the undrained shaft three
tiles away stays deep: two water levels in one room in one frame, unmissable. At
HIGH the cone is working just as hard and the tile does not change at all,
because `dWell` draws the same tile at MID and HIGH — so pumping at the wrong
sea looks exactly like pumping out of range. The wheel's sprite never says it is
drowned either. Top entry in `docs/ART-BACKLOG.md`.

### What is weak about D4

- **The failing case is invisible.** See above. It is the third dungeon in a row
  whose mechanic is legible when it works and silent when it does not.
- **Six wheels, two shapes.** The Loft and the Gauge are the same sump shelf
  with a different approach; the Sill and the Long Race are the same drown-wall
  shelf on different axes. The Crossed Sluices is the only room that composes
  them, and it is the last one.
- **The Cliff Walk is decoration.** Light enemies over pits is the gust's combat
  verb and nothing in the room requires it, so a player who never blows anything
  into a hole loses nothing.
- **Nobody has played it.** The replay proves the engine agrees with the model
  at one sill. The other five are a checker's word.
- **The trench is always two pits and the stand is always one tile.** That is
  the geometry the cone's reach of 3 forces in a 10-tile room, and it means
  every sill looks like the same fixture. A 2x1 sill room would buy a different
  shape and none of the five is one.

### What the last session did (P8/D3, the Bogwater Sanctum and the Cleats)

**D3 is re-authored around the Cleats' two modes, and the hard part was that
the item gates nothing.** 22 rooms, one floor, the Cleats at room 11, three
torrent rooms, `tools/check-cleats.mjs` (15 assertions) and the `d3-undertow`
replay. The constraint table is in `docs/EXECUTION-PLAN.md` under "P8 status",
and the dungeon's header comment in `src/data/dungeons-a.js` states the torrent
primitive once and builds three rooms out of it.

**The problem, because D4-D6 will each have their own version of it.** The
Anchor did not FIT in a room. The Lens could not be REQUIRED by terrain at all.
The Cleats are required by every deep tile in the game the moment they exist —
so proving "this room needs the Cleats" proves nothing. What is worth proving is
the axis inside the item:

> the surface route does not get there, and the floor route does.

That is provable because the difference between the modes is data:
`Player.updateTerrain` applies a tile's `push` only while `inDeep &&
!underwater`, so comparing the push to `SWIM_SPEED` settles it in arithmetic.
`TORRENT_PUSH` (new, in feel.js, `derived`) is deliberately GREATER than swim
speed; an ordinary riptide at 0.55 px/f is less, which is why the riptides that
already existed could not carry this dungeon — they are a tax on the surface
route, not a barrier. check-cleats asserts that inequality globally before it
looks at a single room.

**`tools/check-cleats.mjs` proves four things per declared room**, and reads
every number out of feel.js: no route without the item; no route on the surface
at any tide level; a route on the floor; and the longest unbroken dive fits
inside `CLEATS_BREATH_FRAMES` at `SINK_SPEED`, printed as a margin (the Kelp
Locks is 14 tiles, 359f of 800, 55%). It also sweeps every room in the game for
a torrent outside a declared room — a current nothing proves a way past.

**Three things changed outside D3:**

- **`walk-dungeons.mjs` can swim** in any dungeon of index 3 or higher, because
  by then the player owns the Cleats. Off for d1/d2, so nothing already proved
  about those two moved. Without it every room past the Sanctum's item read as
  stranded.
- **`Player.updateTerrain` dives on entry** when the soles are already set to
  sink. `cleatMode` had been a flag that `toggleCleats` set, that the item's own
  dialogue promised, and that nothing ever read again.
- **`dTorrentN/S/E/W`** are new tiles built from existing art, and `T`/`t`/`V`/
  `A` are new characters in the shared dungeon legend. They are LETTERS, not
  digits: a digit means a tide tile, and a torrent is deep at every level, which
  is the whole reason no conch answers one.

**Seen on screen, and it is not good news.** `tools/shots/room-d3_0_2_3-tide1-
px80.png`: the Undertow reads as a handsome flooded drain and gives no hint
whatever that the water in it is moving. A torrent is drawn as ordinary deep
water — same art, same palette, same blue — and the only difference is a faster
ripple. In a still it is invisible; in motion it is nearly so; which way it runs
is not signalled at all. **The dungeon's whole mechanic is currently learned by
being swept out of a room once.** Written up as the top entry in
`docs/ART-BACKLOG.md` with what to draw and in what order to try it.

### What is weak about D3

- **The torrent rooms are bare corridors**, for the same reason D1's anchor
  gates were: a niche in the wall of a torrent room is somewhere to stand, and
  somewhere to stand is somewhere the current is not. Lion masks in the walls
  are the whole of the decoration.
- **The three torrent rooms are one idea three times.** Two horizontal channels
  running opposite ways and one long one. The Bogwater Drain's alcove — a thing
  only the floor route ever sees — is the only variation, and it is optional
  content rather than a second idea.
- **Sink mode's other costs are unused.** No sword, no jump, no knockback and
  carrying-things-underwater are all real differences and D3 builds on none of
  them. The carry verb in particular (`dropCarried` fires on the surface and not
  on the floor) is a whole puzzle mechanic nobody has used.
- **The replay proves the surface half hard and the floor half softly.** The
  swim phase is pinned at x=136 by the current, which is the assertion with
  teeth; the sink phase crosses and leaves the room, asserted as
  `roomChanges: 1`.
- **`TORRENT_PUSH` is `derived`, not `measured`.** It is derived from
  SWIM_SPEED, which is itself derived from WALK_SPEED, which is a guess.

## What the last session did (P8/D2, the Coral Spire and the Brineglass Lens)

**D2 is re-authored around the Lens, and the hard part was making an
informational item required at all.** 24 rooms over two floors, the Lens at room
14 of 24, and `tools/check-lens.mjs` is new and proves both forks in five
directions. The constraint-by-constraint table is in `docs/EXECUTION-PLAN.md`
under "P8 status: D2 done", and the dungeon's own header comment in
`src/data/dungeons-a.js` states the fork primitive once and builds two rooms out
of it.

### The problem D2 had to solve, because D3-D6 will each have their own version

The Anchor's problem was geometry. The Lens's problem is that **no arrangement
of terrain is passable with it and impassable without it.** It shows you things;
it cannot move you. So a Lens room is not a gate and must not be built like one
(P9 forbids it, and `docs/ITEMS.md` says so).

What makes it required is that the player has to **commit before the answer
exists**, and three engine features that were sitting unused turned out to be
exactly what that needs:

- **`tideForce: 0`** pins the room to LOW and REFUSES the conch. No room in the
  game had ever declared it. **This is the load-bearing assertion and the one a
  later session will want to drop:** without the pin the player sounds the conch,
  looks at the room one level up with their own eyes, sounds it back, and the
  Lens is a shortcut rather than the answer.
- **A one-way ledge** (`F.LEDGE`, solid from three sides) is the commitment.
- **A TideValve plus `game.forceTideStep()`**, at the BOTTOM of each branch —
  past the point of no return, so turning it can only confirm a choice already
  made. `TideValve` existed; nothing had ever wired its `roomEvent('valve')` to
  anything.

### The primitive, and why it is provable rather than asserted

Three shafts, and at LOW all three are **the same tile** — not three tiles that
resemble each other. `dDrain`'s LOW form, the new `dSump`'s LOW form and a plain
`dPit` all resolve to the tile `dPit`. One level up they are wading depth, a
hole and deep water. `check-lens.mjs` can therefore compare tile NAMES rather
than pixels, and a screenshot confirmed it: all three throats sample to exactly
(14, 15, 34) at LOW.

`src/data/tiles-core.js` gained one tiledef, `dSump: ['dPit','dWaterD','dWaterD']`
— a shaft that fills over your head — and `legends.js` gained the digit `0` for
it. No new art: it composes tiles that already exist.

### `tools/check-lens.mjs` is new, 24 assertions, and it passed first run

Modelled on `check-anchor.mjs`: pure Node, no browser, reaches out of `feel.js`
(`LEDGE_MAX_SPAN`, `GAP_HOP_MAX_SPAN`) rather than written down. Per declared
room it proves the pin; that `reveals` is exactly what a level-1 Lens draws; that
every branch is takeable from the decision tile and NONE leads back to it or
across to another at ANY level; that no branch pays off at the pinned level;
that at least one pays off one level up and at least one does not; that every
branch is the same tile where the player decides and the winner differs from
every loser one level up; and that every losing branch has a way out, so being
wrong is a walk back rather than a soft lock. It also fails if nothing declares
a fork, and if a fork is declared outside D2.

**It did not earn itself the way `check-anchor.mjs` did.** check-anchor failed
all three D1 gates on its first run; this passed 24/24 on its first. That is not
evidence the tool is weak — it was written before the rooms, which is exactly
what the brief asked for, so the rooms were authored against it.

### The two forks

- **`1,4,3` The First Fork** — two shafts, `4` dDrain (fills) and `O` dPit
  (never). The teaching one.
- **`1,2,2` The Sounding Fork** — three, adding `0` dSump: wading depth, a hole,
  and drowning. Guards the Boss Key.

Both are 1x1 **on purpose, and the reasoning is the answer to a question the
brief asked to be decided deliberately**: the whole of the choice is that every
branch is in front of you and none can be told apart, so a fork spread across
two screens would need the Lens because half of it was off camera — the right
requirement for the wrong reason. The two large rooms in D2 are the Reefguard
Hall (`1,4,2`, 2x1) and the Spire Ascent (`1,3,2`, 1x2), where size is the point
and nothing is hidden. The 1x2 is also the first room in the game whose camera
moves on the vertical axis.

### Seen on screen, and the finding is bad news

**The Lens draws three dark blues.** `dWaterS`, `dWaterD` and `dPit` are the
three answers a fork has, and through the ghosted overlay they come out 4-6 RGB
units apart. Measured at three opacities; `LENS_GHOST_ALPHA` went 0.55 -> 0.80,
which is a real improvement and is not the fix — opacity cannot separate three
colours that are already the same colour. The numbers, the command that
reproduces them, and three candidate fixes are in `docs/ART-BACKLOG.md` under
"The Lens shows three dark blues", and the table is repeated beside the constant
in `feel.js`.

Honest state: **water vs no water reads. Shallow vs deep reads weakly**, and
that is exactly the read the Sounding Fork turns on. What genuinely separates
them on screen is texture and motion (ripple lines at rate 11, speckle at 13,
and a pit that does not animate at all), and a screenshot throws all of that
away. **This one wants a person holding the button.** `shoot-rooms.mjs` grew
`--lens` for it.

### The charm-case decision, which could not slip, and did not

`CHARM_LOW_ESSENCES` is 2 and D2 is the second essence, and `checkUnlocks` was
called from `Scrimshander.interact` and nowhere else — so shipping D2 unchanged
meant a real save in which the player owns charms they can never switch on,
having no reason to walk back to Tidewatch. **Settled: the shard opens the
case.** `openCharmCases(progress)` is new in `scrimshaw.js` and is called from
`Game.claimEssence`; the line is held until the essence cutscene lets go. The
scrimshander keeps her line and says it the first time you see her afterwards,
gated on the new `progress.charmTold`. She is the acknowledgement now, not the
gate.

D2 hand-places one charm — **Barnacle Skin in `0,3,3`**, a MID charm, because MID
is the only case the player owns for the whole of this dungeon.
`check-charms.mjs` prints all three hand-placed charms.

### `walk-dungeons.mjs` learned to hop a ledge

Its flood treated `F.LEDGE` as a wall, which was harmless for as long as no
ledge was the only way into anywhere — true of every dungeon until this one. It
reported eight of D2's rooms stranded in a dungeon that walks fine in the
engine. It now models `Player.tryLedgeHop` exactly: into the FACE of the ledge
only, clearing the run behind it, landing on a standable tile. Directional, so
it adds no route back. **If you add a movement verb to the player, add it to the
flood in the same commit.**

### The replay

**`d2-fork-wrong`** (679 frames) takes the WRONG shaft on purpose and proves the
four things a checker cannot: the setup asks for `tide: 1` and the first
checkpoint reads LOW, so the pin holds; the actor hops the east ledge and the
shelf is gone; one press of A on the sluice takes the sea to MID and nothing
else does; and after 80 frames of holding `up` into the shaft it has moved seven
pixels and stopped, because the hole is still a hole. Then it takes the stair,
and `roomChanges: 1` asserts it left the room exactly once and by that route.

### What is weak about it

- **Shallow-vs-deep through the Lens.** See above. It is the weakest thing in
  the dungeon and it is the read the second fork depends on.
- **Both forks are the same primitive**, the way D1's three gates were. The
  second adds a third answer and higher stakes and that is all it adds. D3 will
  need more than "the same idea with an extra branch".
- **`check-lens.mjs` passed first run**, so unlike `check-anchor.mjs` it has
  never caught anything. Its model is only as good as its movement verbs, and it
  has no swimming in it — it asserts every declared fork is in D2, which is what
  will catch the first D3 room that tries.
- **Nobody has played a fork.** The cost of being wrong is a stair back to the
  Upper Landing (fork 1) or to the Spire Ascent (fork 2) — three rooms and two
  rooms of walking. Those are guesses about how much a wrong guess should hurt,
  and nobody has felt either of them.
- **The miniboss is at 71% and the Lens at 58%**, both a shade later than D1's.
  Stated rather than rounded.
- **`walk-dungeons.mjs` does not model `tideForce`.** Its flood grants any tide
  level, so a pinned room reads as freely crossable. That is sound here — the
  valve really does supply MID — but it means the walker cannot tell a pinned
  room that is solvable from one that is not, and `check-lens.mjs` is the only
  thing that can.
- **D2 dropped a switch room.** `solve-switches.mjs` reports 16 rooms, not 17;
  the old `1,4,5` block puzzle is gone with the rooms it lived in.
- **The two removed dungeons are still in the data.** Eight dungeons, six in the
  plan. Neither D1 nor D2 needed the consolidation; D7/D8 folding is still owed.

## What the last session did (P7.6, multi-screen dungeon rooms)

**A dungeon room may now be bigger than one screen, and one room in the game
is.** All seven steps of `docs/briefs/P7.6-PLAN.md` plus both additions from
`docs/briefs/P7.6-PROMPT.md`. Sizes are `1x1`, `2x1`, `1x2`, `2x2`, `3x1`;
anything else throws at construction.

**The single most important thing for a future session is not in this file.**
`docs/EXECUTION-PLAN.md` now has a section in P8 called "ROOM SIZE — everything
a dungeon session needs, in one place": the grid width each size implies, the
anchor-gate arithmetic restated as a sizing rule (what fits in 10 tiles, what
fits in 20, what a 2x2 buys that a 2x1 does not), the pacing number, and the
worked example. A D2-D6 session should read that and nothing else about room
size.

### What actually changed in the engine

- **`Room` gained `sw`/`sh` (screens) and the four derived extents `tw`/`th`
  (tiles) and `pw`/`ph` (pixels).** Every one of the 30 `ROOM_W`/`ROOM_H`/
  `VIEW_W`/`VIEW_H` uses the P7.6 survey found was one of three things, and they
  were separated: the room's tile extent, the room's pixel extent, and the size
  of the window on screen. `VIEW_W`/`VIEW_H` now mean only the third.
- **`src/game/camera.js` is new.** Deadzone, not centring: a box in view space,
  and the camera moves only when Link leaves it, capped at `CAM_MAX_SPEED`. It
  clamps to `[0, room.pw - VIEW_W]`, which is an empty range in a 1x1 room, so
  it is provably a no-op in all 23 of D1's other rooms and in every overworld
  screen. It is never part of the render cache key and never calls
  `invalidate()`. **KeyI** draws the deadzone box, the camera's window position
  in the room, and the room's size.
- **The room render cache is now `pw x ph`** and `drawScene` blits the camera
  window out of it. `cacheKeyFor` is untouched, exactly as P5 left it.
- **`registerMap` throws on a `size` in an overworld room**, and
  `validate.mjs` reports it. Structural, not a comment. `check-overworld.mjs`
  needed no edit at all, which is itself the assertion that the overworld path
  did not move.
- **Cell lookups resolve through an occupancy index** (`roomKeyAt`). A
  multi-screen room owns every cell it spans and only the top-left one has a
  `roomDef`; `validate.mjs` fails if another room is keyed inside the footprint.
- **The minimap draws a multi-screen room as one cell spanning `sw x sh`**, and
  skips the covered cells.
- **`check-anchor.mjs`, `walk-dungeons.mjs` and `find-ledges.mjs` learned
  `room.tw`/`room.th`.** check-anchor still passes 14/14 on the unchanged D1
  rooms. `solve-switches.mjs` needed no change — it works through live `Room`
  objects rather than raw grids.

### The one converted room, and the replay that proves it

**`d1` `0,5,3`, the Clawcrab Den, is 2x1** — eight rows of twenty characters,
owning cells `5,3` and `6,3`. Picked with the tools, not by eye: it is the
dungeon's set piece (the miniboss), it is NOT an anchor gate so nothing
`check-anchor.mjs` proves had to be re-proved, and the cell it grows into has no
neighbours at all, so no facing wall in any other room moved. The reasoning is
in the room's own header comment.

**`d1-clawcrab-den-wide`** (893 frames) walks in from the Two Gauges, crosses to
the far wall and back, and asserts `roomChanges: 1`, `camMaxX: 160`,
`camEndX: 0`, `camMaxY: 0`. The first of those is the real claim: the internal
screen seam is crossed twice and fires nothing, so the one transition in the run
is the actual room boundary. Note that D1 is `scroll: false`, so a transition
there is a warp and a fade rather than a sliding `game.transition` — the harness
counts room-key changes, which is true of both kinds.

`tools/replay.mjs` now records a `span` (transitions fired, camera extremes) and
a plan may carry an `assert` block against it. Existing replays are unaffected:
`diffState` iterates the STORED keys, so new fields in the observed state are
ignored.

### Seen on screen

Shot at both camera clamps and at MID and HIGH with
`tools/shoot-rooms.mjs --px=N --tide=N`, and driven live with the KeyI overlay.
At `cam=0` the west lobe reads as an ordinary room; at `cam=160` the east lobe
is fully drawn with no torn edge; at `cam=88` the window straddles the internal
seam with no artefact at all — no gap, no doubled column. Holding `right` from
the west end, Link crosses the deadzone, the box gives way, and he stays pinned
on its right edge until the camera hits 160 and he walks off the boundary to the
wall. The deadzone at 96x64 felt right rather than merely working; it is still
`guessed` and stays that way. `shoot-rooms.mjs` grew `--px`/`--py`/`--cam` for
this, and its settle went from 8 frames to 30 because a wide room's tide wipe
takes the full `TIDE_SWEEP_FRAMES` to cross the ROOM.

### What is weak about it

- **The deadzone numbers have been watched by nobody but the session that chose
  them.** 96x64 and a 2px cap are one person's taste on one room. `KeyI` exists
  so the next person can argue.
- **Only one room in the game is multi-screen**, so 1x2, 2x2 and 3x1 are proved
  by the constructor and the validator and by nothing that has been walked. The
  vertical camera axis in particular has never moved in a running game — the one
  wide room is one screen tall.
- **A transition between rooms of DIFFERENT sizes has never happened.** The
  entry-position clamp and the global-coordinate seam arithmetic that exist for
  it are reasoned, and reduce provably to the old code when sizes match, but no
  test walks them. The first 1x2 room next to a 1x1 is where that gets exercised.
- **The scroll transition path is untested at width.** Every dungeon is
  `scroll: false`, and the overworld cannot have a wide room, so the
  camera-aware slide in `drawTransition` has no room in the game that can reach
  it.
- **Enlarging the miniboss arena is a balance change nobody has played.** The
  Clawcrab now has twenty tiles to fight in and sits at the far end.
- **The east lobe's floor is bare** and has to stay that way: the theme's floor
  variant is a water-coloured tile in this dungeon (see below). Twenty tiles of
  one floor tile is the thing a wide room invites and there is currently no
  answer to it in the Grotto, Cistern or Salt themes.

### Two bugs found by walking the room, and both are fixed

Neither was findable by reading, and each was hiding the other.

**D1's Clawcrab Den had a locked door that locked nothing.** Row 2 ran clear
past the door in the room's west wall, so Small Key 3 bought nothing and the
Piece of Heart behind it was free. True of the original 1x1 grid too — verified
against the pre-conversion data, so the widening did not cause it, it only put
someone in the room. Columns 0-1 of rows 2 and 5 are now wall and the door is
the only way between the den and the west antechamber, at all three tide levels.

**Sealing it then failed `walk-dungeons.mjs`** with `0,4,3` unreachable: D1 has
three locks and the walker could only count two keys, because the third is a
`{ pickup: 'key' }` chest and the counter knew only `{ item: 'key' }`. Both are
real forms — `openChest` grants one and spawns the other. The undercount was
harmless for exactly as long as one lock was bypassable.

**`walk-dungeons.mjs` now asserts every locked door separates its room**, on one
axis, at all three tide levels — 35 doors, all passing. The three-levels clause
is the part with teeth: a door that separates at LOW and not at HIGH is a locked
door plus a conch, and the player always has the conch. If you place a locked
door in D2-D6, wall the four tiles round it.

### The P7.5 theme tiles, and one that cannot be used here

D1 already wears the Grotto theme from P7.5 step 8 — its floor, wall, bombable
wall and block are all extracted tiles, so "use the P7.5 tilesets" was already
true of this room. The one thing left to add was `,`, the theme's floor variant,
laid as a scoured track to break up twenty tiles of identical floor. It went in,
was screenshotted, and came straight back out: **`dFloorGrottoAlt` is registered
in the `stonef` palette, which is the palette of `dFloorWet` — the MID form of
the `dBasin` tide tile this room is dotted with.** The decoration read as
standing water in a room whose only other grey tiles are the damp patches that
are meant to.

**Grotto, Cistern and Salt all have this collision; Coral, Bog, Wood, Palace and
Abyss are clear.** `validate.mjs` asserts a theme never changes a tile's flags,
which is the right check and is precisely blind to a theme changing what a tile
appears to say. In a tide game the floor palette is vocabulary.

Pulling that thread found a bigger one: **in six of the eight themes `,` is not
a second tile at all, it is the same art recoloured.** Only Wood and Palace have
a genuinely different alt floor. So "break the floor up with the variant" is not
available in most of the game, and it wants a new pick rather than a workaround.

### Extracted art that no room could name, and it had always been so

`lionHead` and `urn` were extracted in P7.5, given tiledefs, and commented in the
file "Themed scenery, for P8 to place" — and never given a legend character. A
room grid can only name a tile through its legend, so both shipped in every
`dist/` drawable by nothing, for the whole life of the feature, with every
checker green. Extraction is a four-link chain — sheet, ripper, tiledef, legend
— and everything checked links 1 to 3.

Both are wired now. `M` is a lion mask to set INTO a wall; `U` is an urn to stand
against one. The urn needed more than wiring: its cell carries 64 pixels of the
source room's floor, so it drew a rectangle of one dungeon's flagstones into
every other dungeon's. The ripper now keys the border-connected background out
to transparency and each theme has its own urn naming its own floor as
`underArt` — `underArt` is a fixed tile name, which is why there are eight urns
and not one. That made the urn the SIXTH themed character, so the "adding a
seventh" path in `legends.js` is worked rather than warned about.

`validate.mjs` now fails on extracted theme art no tiledef draws, and on a
tiledef built on extracted art that no legend, tide variant or transform can
reach. Both were verified by breaking them — removing the new legend characters
reproduces the original bug as a named failure. Two picks are exempt with the
reason and a screenshot: `hatchWall` and `forgeWall` are wall RUNS and read as
railings repeated (`tools/shots/wallruns.png`).

`d1` `0,5,3`'s east lobe is the first use, and "DUNGEON LOOK" in
`docs/EXECUTION-PLAN.md` is what a dungeon session reads: what a theme gives you,
what it does not, and the seven steps for adding a themed tile.

## What the session before that did (P8, dungeon 1: Tidewash Grotto)

**D1 is re-authored around the Tidewright's Anchor, and the claim is proved
rather than asserted.** 24 rooms, one floor, the Anchor at room 12 of 24, and
every room after it behind an anchor gate. The full constraint-by-constraint
table is in `docs/EXECUTION-PLAN.md` under "P8 status", and the dungeon's own
header comment in `src/data/dungeons-a.js` states the gate primitive once and
then builds five rooms out of it. Also there: the P7 audit and how D1 fits the
charm gating, which is the other half of what the session was asked for.

### `tools/check-anchor.mjs` is new, and it is the point

Pure Node, no browser, 14 assertions. For every room declaring `anchorGate` or
`anchorGauges` it proves BOTH directions: that no sequence of walking, hopping
and sounding the conch crosses it, and that one anchor placement does. It reads
the patch radius, the throw arc and the hop reach out of `feel.js` rather than
writing them down, so retuning `WALK_SPEED` or `ANCHOR_RADIUS_TILES` re-proves
every gate instead of quietly breaking one. It prints the solution it found for
each room, so the tool output is the record of each room's intended answer.

**It earned itself on its first run by failing all three gates.** Each had a
forgiving tile of `dSluice` between its two bands, put there so the five-tile
held patch would spill onto something harmless — and since `dSluice` is dry at
LOW and shallow at MID, it was somewhere to STAND, and the conch can be sounded
anywhere you can stand. All three gates fell to one button press while reading
as anchor rooms in the data. That is exactly the failure the dungeon walker
cannot see, because its flood grants every tile whichever level suits it.

### The Anchor does not fit in a 10x8 room, and that is a P7.6 argument

The patch is 5x5 and the throw carries two tiles, so one gate needs
`stand + 4 + 3 + far side` — a whole room row, with the rest of the room walled
off so the player cannot walk round it. Hence three bare corridors, and no room
holding two gates or a gate and anything else. A 2x1 room is 20 tiles wide and
turns anchor geometry from a fit problem into a design space. Weigh that into
P7.6's value: D3 onwards will keep hitting it.

### Things that changed outside D1

- **`openChest` grew a `charm` branch.** `Chest` accepted `{ charm: ... }` in
  room data and `openChest` fell through to "Nothing but sand." — an opened
  chest, a saved flag, no charm. `check-charms.mjs` now proves the branch grants
  in-engine, sweeps every room in the game for a `charm:` that names a charm not
  in `CHARMS`, and prints the hand-placed list (2: the shop's Ballast Heart and
  D1's Split Fang).
- **`walk-dungeons.mjs` understands puzzle-opened doors.** A tile named in any
  room's `puzzle.reward.openDoors` is passable to the flood. Without it the Boss
  Key room behind D1's gauge puzzle read as stranded.
- **A fourth replay, `d1-sluicegate`**, crosses a real gate in the engine: throw,
  conch, hold `right`, and the probes read LOW at (2,3) and MID at (7,3) in the
  same frame while the player ends at x=112 on 12/12 hearts — no wash, no fall.
  462 frames. `d1-descent` was rewritten for the new layout and re-recorded
  (6365 frames); its frame counts are not comparable with the pre-P8 recording,
  because the world changed rather than the movement.
- **The Compass-on-a-pot bug is gone in D1** — the Chartstone chest has floor
  above it and `d1-descent` collects it. The engine defect behind it is
  untouched and five dungeons are unaudited for it.

### Seen on screen, for once

Four rooms were screenshot at LOW and MID with `tools/shoot-rooms.mjs` and
looked at: the gates read (shallow water one side, black pits the other), the
drinking floor at MID is unmistakably a chamber you have to drain, and the gauge
room shows its door, its heart piece and its return stairs from the doorway. The
gauges themselves are the weak part — see the new entry in `docs/ART-BACKLOG.md`
for the fixture they want.

### What is weak about it

- **The three gates are the same primitive twice over.** Two orderings (wells
  near, drains near) and three instances. The gauge rooms are the only other
  anchor idea in the dungeon, and they are also duplicated (side by side, then
  stacked). D1 is a tutorial dungeon so repetition is defensible; D3 will need
  more than this, and P7.6 is what buys it.
- **The gate corridors are visually bare** — two open rows in a room of wall,
  because anything else in the room is either a way round the gate or a place to
  stand and sound the conch. Decorating them safely needs care: a niche off the
  corridor broke the gate in the first cut.
- **Nothing in the post-item half has been played by a human**, only proved. The
  gauge rooms in particular ask the player to infer a rule from a plaque.
- **`0,5,2` and the boss room do not require the Anchor**, only being reached
  through a gate does. Stated as an exception rather than papered over.
- **check-anchor's model has no swimming in it**, so it is only sound before the
  Cleats. It asserts that no declared anchor room is in a later dungeon, which
  is what will catch the first D3 room that tries.
- **The two removed dungeons are still in the data.** Eight dungeons, six in the
  plan. D1 did not need the consolidation; D7/D8 folding is still owed.

## What the session before that did (P7: scrimshaw, plus P7.5 and P7.6)

### P7 — the ring system is gone and scrimshaw replaced it

`src/game/scrimshaw.js` is new; `src/game/rings.js` is deleted along with the
ring shop stock, the menu's ring tab, `hasRing`, and the extracted `i_ring`
icon — whose cell was removed from `tools/rip-hud.py` and the file re-emitted,
not hand-edited.

**The rule.** Thirty charms slot into three cases named for the tide levels, and
a charm only works while the water is at its level. One case (MID) at the
start; LOW and HIGH are cut by the scrimshander at 2 and 4 essences, and at 6
every case takes two charms.

**The load-bearing decision, which a future session will want to "fix":** the
level that decides is `tideAt(game, player)` — the level under the player's own
FEET — not `tide.level`. So standing inside the Tidewright's Anchor's held
patch keeps that patch's charms alive while the rest of the room has moved on.
That is deliberate, it gives the Anchor a second use, and it is the reading a
player assumes the first time they try it.

**The two transition charms** are the design payoff and both work: the Neap
Charm holds a case awake for `NEAP_GRACE_FRAMES` after the tide leaves it
(resolved off the PREVIOUS frame's live set, so a charm that has already gone
dark cannot be what keeps itself alive), and the Fisherman's Regret wakes the
case one level below the water.

**The scrimshander** works the west side of Tidewatch square. A blank plus
`CARVE_PRICE` rupees, and she carves what the bone wants to be — the charm is
chosen AT COMMISSION off the global stream, not on collection, so reloading
before collecting is not a re-roll button. It is finished by `CARVE_TIDE_TURNS`
changes of the tide, counted in `onTideChanged`, so a player who never sounds
the conch never gets one. Blanks come off the seafloor via the Dredge Line (the
new `dredged` drop table, where they are common) and off the `good` and `rich`
enemy tables, where they are not.

**`tools/check-charms.mjs` is new, 60 assertions, and its last one is the
interesting part.** A charm is pure data and nothing forces a system to read
it, so an entry in `CHARMS` with no reader gives you a charm that carves,
slots, highlights, saves and does nothing — with every other checker green. So
the harness sweeps `src/` and fails on any charm not named outside
`scrimshaw.js`. Two charms act on the slotting rule itself and are named as
explicit exemptions rather than left as a hole. Verified by deleting one
charm's implementation and watching both the effect assertion and the orphan
sweep fire.

### P7.5 — the tool is built; the decision it opens with is BLOCKED

`tools/rip-dungeon-maps.py` turns a stitched full-floor map into a
deduplicated 16x16 tileset plus a JSON manifest carrying each tile's occurrence
count and one map coordinate. Frequency is the point: on a map it is the only
signal that separates a wall from a decoration without a human looking.

Proven on `oracle-seasons-dungeon-backgrounds.png` — 24389 cells, 18 bands, 157
blocks, **2181 unique**, byte-identical on re-emission, asserted by
`tools/check-tilesets.mjs` (6/6).

**The four maps the brief was written against — Ancient Ruins, Explorer's
Crypt, Poison Moth's Lair, Dancing Dragon Dungeon — are NOT in the repo.** So
steps 1-3 (which colour register the sheets came from) cannot be done: the test
is to compare a tile appearing in both an existing sheet and a new map, and
there is no new map. The evidence that CAN be gathered without them is
tabulated with numbers in `docs/ART-DIRECTION.md` and is genuinely
inconclusive — the terrain sheets carry the raw ROM register's signature
(channels in multiples of 8), the sprite sheets do not, and the two groups have
not been shown to agree. **Do not pick a register from that table.** The brief
says an inconsistency is the user's call, and it is.

Step 8 (tiledefs) is blocked with it. Step 9 said to author no rooms anyway.

### P7.5 step 8 — the eight dungeons no longer look the same

The tile pack got used. `tools/rip-dungeon-themes.py` extracts 21 themed tiles
off the Seasons dungeon map into `src/data/tiles-dungeon-themes.js`
(GENERATED — edit the tool's PICKS and re-emit), each citing its map coordinate
and occurrence count. Eight themes are wired up, one per dungeon, and every one
is identifiable from a single screenshot.

**A theme is a legend, not a room edit.** `registerLegend(name, overrides,
'dungeon')` repoints five characters and inherits the rest, so a dungeon
changes its look with one `legend:` field and no room grid moves.
`validate.mjs` asserts each themed tile carries exactly the flags of the shared
tile it replaces — a theme may change the look, never the rules. Verified by
adding F.SLOW to a themed floor and watching it fail.

Unlike `rip-terrain.py`, this ripper INSTALLS its palettes: those tiles are new
and have no game palette to preserve, and the cartridge's own colours are what
make one dungeon look unlike another. Where a theme names a palette from
palettes.js instead, that is a deliberate swap into a colour the game already
uses.

### P7.6 — planned, deliberately not built

The brief says "use plan mode and show me the plan before you touch code", so
this session wrote `docs/briefs/P7.6-PLAN.md` and stopped. (It was approved and
executed later; see the top of this file.)

The survey finding that makes it tractable: `ROOM_W`/`ROOM_H`/`VIEW_W`/`VIEW_H`
appear 30 times across six files, and every use means one of three separable
things — the room's size in tiles, the room's size in pixels, or the size of
the window on screen. The engine already treats "the room's extent" as one
concept and has just been spelling it with the viewport constant. The work is
separating those meanings, not inventing a camera.

### What is weak about all of it

- **Nobody has watched any of it in motion.** Every claim above is from
  checkers. The CHARM menu screen, the Wrecker's Eye glimmer, the lantern
  charms' lit radius and the scrimshander's dialogue are all things whose point
  is how they look, and none has been seen on screen by a person.
- **Every scrimshaw constant is `guessed` and cannot be otherwise** — no Oracle
  system slots a passive by world state. `NEAP_GRACE_FRAMES` is the one to
  settle first, because it is the width of the whole transition window the
  design payoff depends on.
- **Charm BALANCE is unexamined.** Thirty charms exist and each does what its
  line says; no two have been compared for value. The Hagstone (a quarter of
  hits ignored) is probably the strongest thing in the game and cost nothing to
  write.
- **Only one charm is placed in the world.** The shop sells the Ballast Heart.
  Everything else comes from the scrimshander's random carve, so a run cannot
  seek a specific charm. That is arguably right for a bone carver and it means
  the whole roster is un-designed as PLACEMENT — P8 should hand-place some.
- **The scrimshander reuses `npc_elder`'s sprite**, which the digger also uses.
  Two different characters share a face.
- **The case unlocks are keyed on essence count only.** They fire on talking to
  her, so a player who never returns to Tidewatch never opens the LOW or HIGH
  case and never learns the system has more to it.
- **The three replays were re-recorded** because adding one NPC re-phased every
  enemy in the game (see HANDOFF). They pass to the pixel, but they are not
  comparable across this commit.

## What the session before that did (P4: grid-locked enemy motion)

P4 was written against the pre-P3 engine and merged onto it afterwards, so the
lattice is stated in the 8.8 subpixel arithmetic P3 introduced rather than in
floats. **P2 is still outstanding** — the flaky tide assertion has not been
root-caused.

- **The 8px lattice.** A ground enemy no longer has a velocity. It stands on a
  lattice point, decides, and takes a whole `ENEMY_GRID_STEP` step which runs to
  its end; nothing turns it mid-step and nothing draws from the room's stream
  mid-step. `wander` now commits to `ENEMY_DECIDE_STEPS` (3) whole steps and
  then draws a direction — a fixed cadence, not a per-frame coin flip.
  `chase`, `flee` and `patrol` remake their choice at lattice points and
  nowhere else. `hop` is a lattice step with a parabola fitted between its two
  endpoints, so the landing pixel and the landing frame are both known when the
  hop starts (it used to integrate a velocity against a gravity constant and
  land wherever that came out).
- **`bounceDiag`, `orbit` and `charge` are untouched and continuous**, as the
  brief asked. So are bosses, minibosses, fliers and aquatic enemies —
  `gridLocked()` says who is on the lattice and why.
- **Knockback is a scripted displacement.** Fixed distance, fixed frame count,
  constant speed, no decay, for the player, enemies and bosses alike. The
  `KNOCK_*` constants changed **units**: px/f before, total px now. Both
  numbers for all three cases are tabulated in `docs/FEEL-SPEC.md`.
- **`tools/check-motion.mjs`** — spawns one of every enemy in an emptied room
  (one pass dry, one wet), runs 600 deterministic frames, and asserts every
  lattice enemy is 8px-aligned on every frame it is not mid-step, mid-charge,
  mid-knockback or submerged. It also asserts the converse, that fliers and
  swimmers *do* leave the lattice, so a change that quietly grid-locks
  everything fails too. 8/8.
- Three call-site fixes the lattice exposed: the pincer's lunge was reeled home
  by a proportional lerp that never quite arrived (it is two lattice steps out
  and two back now), a split zol spawned its gels 9px apart onto a shifted
  lattice, and a resurfacing leever came up wherever the angle put it.

Both replays were re-recorded and pass to the pixel. Every other checker is
green.

### What it cost, and what is weak

The lattice makes enemies harder to juke — a committed step cannot be
deflected. That is the design, and a human handles it by reading the
commitment. `replay.mjs`'s recording actor cannot read anything, so it takes
substantially more contact damage through Tidewash Grotto and, on three hearts,
dies in the Crab Pit. `d1-descent`'s plan now starts it on five hearts with a
comment saying why. **That is a statement about the actor, not a difficulty
decision** — if P9 re-tunes difficulty, do not treat the five hearts as
evidence of anything.

Three actor fixes were needed, all written up in HANDOFF. The one that
mattered: the swordsman attacked `shield: 'front'` enemies from the front and
swung into the shield forever, which made the Crab Pit unclearable and lost the
Small Key. It now prefers the axis that is not looking back at it. `dExit` also
stopped pressing while the player was still on the room seam, so the next
directive bounced straight back through it.

And one engine defect the re-recording exposed, which is NOT from P4: a dropped
pickup pops about five pixels upward and never comes back down, so a reward key
comes to rest straddling the tile above the one it was spawned on. Full write-up
in HANDOFF. It is worth fixing on its own — it moves every drop in the game and
re-baselines both replays.

Not done, and worth knowing: nobody has watched this in motion. Every claim
above is from checkers. The lattice is the kind of change whose whole point is
how it *looks*, and `ENEMY_DECIDE_STEPS = 3` in particular is a taste number
that has never been seen on screen.

---
## And before that (P5: the tide became a field, and the Anchor)

All four parts of the P5 brief landed, plus the sprite and documentation work
asked for alongside it. Reasoning is in `docs/FEEL-SPEC.md` (new section: "The
Anchor's radius is settled by play") and every mistake it cost is in
`docs/HANDOFF.md` under "The tide field (P5), and the four things it cost".

1. **`tide.levelAt(tx, ty, room)` is the field.** `tide.level` stays as the
   base. An override is `{mapId, roomKey, tx, ty, r, shape, level, src}` and is
   ROOM-SCOPED, which is what makes a room-slide transition correct for free:
   each room resolves against its own overrides in the same frame. Overlapping
   overrides are last-placed-wins, defined rather than accidental.
   `Room.tile/flagsAt/solidAt/render` all take EITHER a plain 0/1/2 or the field
   — the number is kept working on purpose, because "what would this room be at
   HIGH everywhere" is a question the checkers need to ask.
2. **65 call sites audited.** ~12 genuinely want the base (HUD gauge, save,
   music, the conch's own plumbing, cutscene steps). The rest read the field.
   `tideAt(game, e)` in `entity.js` is the level under an entity's own feet and
   is what the 24 boss reads and the raft now use. `puzzle.tide` still reads the
   base — a room-level clause has no tile to ask about — and gains an optional
   `tideAt: [tx, ty]` for puzzles that want the local level.
3. **The Tidewright's Anchor.** Throw it, it bites where it lands and holds its
   patch at the level the water was on at that moment. Press again from anywhere
   in the world to recall. The chain damages along its whole line on both throw
   and recall. It cannot strand you — `findSafeTile` searches the FIELD now, and
   a placement with nowhere to stand is refused rather than survived. A placed
   anchor survives leaving the room (the override is the truth, the entity is
   its picture, and `Game.respawnAnchor` redraws it); one still in the air when
   the room changes simply returns.
4. **The checkers reason over the field**, and the interesting part is that the
   old model was optimistic in a way nobody could see before: "walkable at ANY
   tide level" grants a different level on every tile at once, which no conch
   can do. `check-overworld` now also floods properly — a state is a screen, a
   tile and a level, and you may only change level where you are standing on
   ground that survives the change. It reaches 120/120 that way too.
   `walk-dungeons` gained the check that only the field could express: the seven
   `noTide` rooms (the boss rooms) must work at all three levels independently,
   because the conch is refused in them.
5. **A replay proving one room at two levels at once**, `tide-steps-split`.
   Nine consecutive checkpoints read MID at one probe and HIGH at another in the
   same frame, with different rendered pixels. See the weakness note below.
6. **`flowers` re-picked, `bush` extracted at last**, and the publication
   restrictions removed from the docs.

### What is weak about it

- **`ANCHOR_RADIUS_TILES = 2` and `ANCHOR_SHAPE = 'square'` are guesses about
  design, not about the source games, and there is nothing to measure them
  against** — no Oracle item holds part of the world at one state. KeyU cycles
  the radius 1-4 in game, KeyY swaps square for disc, both re-apply to an anchor
  already down, and KeyO outlines the patch. **This is the one thing in the
  session that wants a human**: throw it in Tide Steps (overworld 0,10,0) at
  each setting and pick. FEEL-SPEC says why 3 and 4 are already ruled out.
- **The Anchor is not obtainable in play.** It has an ITEMS entry, art, an
  icon and a manifest entry, but no chest anywhere grants it — D1 is re-authored
  in P8 and that is where it belongs. Today only a harness or a `giveItem` call
  puts it in your hands.
- **There is no in-world signal for where the held patch ends.** The debug key
  outlines it; normal play has only the water itself, and at a boundary between
  two shallow tiles the edge is genuinely hard to see. That is an art job — a
  tide line, foam, something — and it should probably happen before the radius
  is settled, since it changes what "legible" means.
- **The anchor's throw distance is not tuned.** It reuses the pot-throwing arc,
  which puts it about three tiles out. That is a number nobody chose.
- **The chain sweep damages on a straight line from Link to the anchor**, which
  is right while it flies and a lie while it is held — the chain would slacken.
  Nothing draws a slack chain and nothing damages on one.
- **The overworld field flood is 2.9M states and takes ~30s.** Fine now; it will
  not survive being asked for two anchors.
- **The new `flowers` is darker and busier than the grass around it**, so
  walkable scenery is now more visually prominent than the cuttable bush beside
  it. That hierarchy is backwards and a lighter re-pick may be wanted; the
  blocking problem (flowers and bush being the same rosette) is fixed either way.

## What the session before that did (P3: fixed-point movement and the sword-hold)

All five parts of the P3 brief landed. Full reasoning is in `docs/FEEL-SPEC.md`
(new sections: "Positions are 8.8 fixed-point", "Diagonals", "The sword is
three verbs") and the cost of each mistake is in `docs/HANDOFF.md` under
"Fixed-point movement, and the four things it cost".

1. **8.8 fixed-point positions.** New `src/core/fixed.js`. Every entity has
   integer subpixel accumulators `fx`/`fy`/`fz`; `x`/`y`/`z` are accessors
   returning derived integer pixels via `>> 8`. `moveEntity` takes
   **subpixels**. `art.js`'s `x | 0` is gone — it truncated toward zero, so it
   misdrew every entity at negative x, which is every entity on every room
   transition.
2. **Diagonals are no longer normalised.** `DIAGONAL_FACTOR` is deleted, not
   set to 1 — a scale factor sitting there is an invitation to tune it back.
3. **`WALK_SPEED` re-derived to 256 sp/f** (exactly 1 px/f, 16 frames to the
   tile). `ROOM_EXIT_MARGIN` is 1 and the hack comment is gone. The constraint
   is tighter than it looks: a speed must be exact in 8.8 *and* divide 16px,
   so it must be a power of two in subpixels — 256 is the only candidate that
   is not a crawl or a dash.
4. **The sword-hold.** Holding the button after a swing keeps the blade out:
   its own pose, reduced walk speed, contact damage, cutting, and a clink off
   walls. Charge-to-spin still runs underneath. The pose is
   `link_hold_down/up/side`, **extracted** from the sheet's Charge band by
   `tools/rip-link.py` — in the Oracles, holding the button is the charge, so
   those are the frames the source game draws for this exact state. They are
   the only Link sprites that are not 16x16 (16x30, 16x28, 28x16), because the
   blade runs past the edge of the cell; `Player.draw` derives the anchor from
   the sprite's own size. Note the CLAUDE.md rule changed with this: Link's
   frames may be extracted, everything else is still drawn.
5. **Both replays re-recorded** and passing; `tools/shots-link-baseline/`
   diffed and refreshed.

### What is weak about it

- **`tools/replay.mjs`'s swordsman was retuned to survive the new speed.** At
  1 px/f, backing out of contact range on one axis is too slow, and the actor
  died in the D1 crab room. It now backs off diagonally and is fenced against
  walking out of the room. That is a legitimate change — a player would route
  diagonally too — but it does mean the actor's competence moved in the same
  commit as the movement model, so the two cannot be compared across it.
- **`d1-descent` ends holding one foe alive** in `0,3,3` and gives up on two
  in `0,3,5` (a stale-count bail, same as the previous recording did). It
  still spends the Small Key, takes the Dungeon Map, opens the Compass chest
  and ends in the north half on 8/12 quarter-hearts.
- **Nothing is tuned around diagonals being the fast direction.** Cardinal
  movement got 26% slower and diagonal got 4% faster. No enemy, gap or dodge
  window has been re-examined against that, and it is a real balance lever.
- **`SWORD_HOLD_DAMAGE`, `KNOCK_HOLD`, `SWORD_HOLD_SPEED` and the two hold
  timings are all `guessed`.** The hold's *existence* and its *art* are the
  fidelity claims; its numbers are not.
- **A non-16x16 player sprite is new ground.** Three of them exist now and only
  `Player.draw` knows how to anchor them. Anything else that draws Link — a
  cutscene, a future menu portrait — will place them wrong. There is no guard
  against that beyond `expectedSize` asserting the dimensions.
- **Enemy knockback still decays exponentially** and enemies still turn on a
  per-frame probability. Both are P4, untouched here beyond making the
  arithmetic integer. **P4 does both** — see the section above.

---
## What the session before that did (P2: root-cause the intermittent test)

`tools/test.mjs` intermittently failed "all three tide levels reachable".
HANDOFF blamed load flakiness because it passed on re-run and the failing
commits touched only sprite and audio data. That was wrong, and the paragraph
saying it has been deleted.

**What was actually happening.** `hold(key, n)` did not hold a key for n game
frames. It dispatched keydown, waited for n frames to elapse, then dispatched
keyup — while `main.js`'s wall-clock loop kept stepping the game throughout
every CDP round trip in between. So the real hold was n frames *plus* however
long the machine took to answer, and on a busy box Link walked roughly twice
as far as the test intended. He ended up standing on the village child (`npc_child`,
Tidewatch Village tile 8,4) instead of back in the middle of the square. A is
the context button before it is the item button, so `x` talked to the child
instead of sounding the conch; `Game.update` then returns early for as long as
a text box is up, so the press produced no tide change and later presses only
fed the box. `seen.size` came out 2. Which asset file the commit touched was
coincidence — `newProgress()` seeds from `Date.now()`, so *every* run was
already playing a different world.

Reproduced by modelling the round-trip latency against the fixed-step driver:
at 30 seeds x 61 latencies, 63 runs opened a text box during the conch section
and 2 came out with `size=2, tides=[1,1,1,2,2]` — the observed failure exactly.

**What changed.**

- `tools/test.mjs` takes the clock with `window.__harness.takeOver()` and steps
  with `step(n)`, the same driver `replay.mjs` uses. Real Playwright key events
  are kept — `keyboard.down` resolves once the event is in the page and nothing
  steps until the test says so — so every hold and tap now lasts exactly the
  number of updates it says on any machine.
- The save seed is pinned. `?seed=N` sets `Game.seedOverride`, which `newGame`
  falls back to; `test.mjs` passes `--seed=` (default 20260806). Play is
  unaffected and still seeds from the clock.
- The conch section stands Link somewhere known first, and two new assertions
  name the failure if a villager ever eats the press again.
- The gap between conch presses went from 64 frames to 80. The real lock-out is
  69 (the sweep, during which the player's own timers stall, plus
  `CONCH_FRAMES`), so the old gap sat *inside* it and half those presses were
  being swallowed even on an idle machine.

**A game bug found on the way.** `Game.update` called `this.tide.update()`
twice on every frame of a sweep — once at the top of play mode and again inside
the `if (this.tide.busy)` guard. The wave front therefore crossed in 23 frames
while `TIDE_SWEEP_FRAMES` said 44, so the constant described nothing. The
second call is gone and the constant is 23, which is what the game has always
looked like: the number moved to match the screen, not the other way round.
Both replays — including `d1-descent`, which cycles the conch — still pass to
the pixel, which is the proof that the wipe is unchanged.

**Verified**: the assertion 200/200 under six-way CPU load, one single distinct
outcome; `test.mjs` 38/38; `replay.mjs` 8/8 to the pixel; every other checker
green; the build rebuilt and `check-build` clean.

No retry was added anywhere.

## And the one before that (P1: feel spec, seeded RNG, replay harness)

Landed in full:

- **`src/data/feel.js`** — every timing and speed constant in the game, each
  with a unit and a provenance tag. The module-level constants are gone from
  `player.js`, `entity.js`, `game.js`, the enemy toolkit, `tide.js`,
  `projectile.js`, `objects.js` and `effects.js`; they all import now.
  **Nothing is tagged `measured`.** Everything carried over from the old code
  is `guessed`, and says so.
- **`docs/FEEL-SPEC.md`** — why the file exists, what the three provenance
  tags mean, how to earn a `measured`, and the three constants that are known
  wrong on purpose (`DIAGONAL_FACTOR`, the two knockback decays,
  `ENEMY_TURN_CHANCE`) with the prompt that fixes each.
- **`src/core/rng.js`** — mulberry32. One global stream seeded from
  `progress.seed`, plus `game.rng`, a per-room stream derived from the save
  seed and the room's identity and rebuilt on every room entry, so a room
  replays identically. All 23 `Math.random` call sites under `src/` are gone —
  the brief said 20; the count in the tree was 23, across seven files.
- **`tools/test.mjs`** — greps `src/` for `Math.random` and fails. Runs before
  the browser starts, strips comments first so it does not flag its own
  documentation. Verified by injecting a `Math.random` and watching it fire.
- **`tools/replay.mjs` + `tools/replays/`** — records a seed plus a flat list
  of per-frame button masks to JSON, replays it headlessly, and asserts the
  final position by **exact float equality** plus a checkpoint every 60 frames
  that names the first frame of any divergence. Two replays are committed.
  Verified by injecting a `Math.random` into NPC wander and watching the draw
  count diverge at frame 120 while the position still matched — which is
  precisely why the draw counters are asserted.

Both replays pass. So do all six pre-existing checkers.

### What P1 did NOT land, and what it would take

**The second replay is `d1-descent`, not a full D1 clear.** It is a real run:
eleven room entries, 21 kills, a chest opened, the Dungeon Map taken, a Small
Key earned by clearing the crab room and spent on a locked door, the conch
cycled all the way round, ending on 5 of 12 quarter-hearts in room `0,3,3`.
4036 frames. It stops at the locked door in `3,3`'s north wall.

(P4 re-recorded it: same route, same ending room, 4218 frames, and it now
starts on 20 quarter-hearts rather than 12 — see the P4 section above for why.
Everything below is unchanged.)

It stops there because the recording actor has three verbs — walk, open, swing
— and everything past that door needs more:

1. **A `push` directive.** The second Small Key is in `0,4,4`, whose puzzle is
   push-blocks onto floor switches. `tryPushBlock` needs the player to lean on
   a block for `PUSH_DELAY_FRAMES`, and a block moves exactly one tile ever
   (see the traps list). This is the single highest-value addition: it unlocks
   the rest of the spine.
2. **A miniboss and a boss routine.** The Clawcrab is in `0,5,2`; Gohmaraq has
   `shell: true` and is only vulnerable during its `open` windows, so the
   standoff swordsman in `replay.mjs` will swing into a blocked shell forever.
   It needs to read `e.weakOpen`.
3. **Roc's Feather.** The Boss Key in `0,3,2` is behind a feather gap, so the
   actor needs a jump verb and the big chest in `0,4,2` first.

Do **not** shortcut this by granting keys, the feather and the Boss Key in the
replay's `setup` block. The setup block states a world state, which is fine,
but a "full D1 clear" that skipped every puzzle would be a replay that proves
determinism while lying about what it is. Either teach the actor the verbs or
keep the honest name.

### A content bug found on the way

`d1` room `0,4,5`'s Compass is uncollectable. `Game.openChest` spawns the
pickup one tile above the chest with no check that the tile is standable, and
that tile is a pot. Measured, written up in `docs/HANDOFF.md`. Left unfixed —
it is dungeon content and P8 re-authors D1.

---

```
Continue building "Oracle of Tides", a GBC-style Zelda fan game.

`main` is trunk. Branch from it. One prompt = one session = one branch.

Read, in this order:
  CLAUDE.md              - the hard rules. They are hard rules.
  docs/EXECUTION-PLAN.md - the roadmap. P0-P8 are DONE. P9 (overworld
                           re-gating and difficulty) is next; read "P8 status"
                           and the P7 audit in it before touching either. P7.6 is DONE — if you are
                           authoring rooms, read "ROOM SIZE — everything a
                           dungeon session needs, in one place" in the P8
                           section and nothing else about room size. P7.5 is
                           BLOCKED on four missing dungeon map rips (see
                           ART-BACKLOG.md). PT (towns) is independent and can be
                           taken whenever a session wants content.
  docs/ITEMS.md          - the item roster. Authoritative. tools/check-items.mjs
                           asserts the registry is exactly this document.
  src/game/scrimshaw.js  - the charm roster and the slotting rule. Each charm's
                           one-line desc IS its specification, and
                           tools/check-charms.mjs proves each in-engine and
                           fails on any charm nothing reads.
  docs/ART-BACKLOG.md    - identified, scoped, not done, and what blocks each.
  docs/EXECUTION-PLAN.md - the roadmap. P0, P1, P3 and P5 are done. P6 (the
                           item roster) is now unblocked and is the big one —
                           P5 existed to unblock it. PT (towns and buildings)
                           is a stated top design priority and is independent
                           of the systems spine, so it can be taken whenever a
                           session wants content. P2 (the intermittent test)
                           and P4 (grid-lock enemy motion) are still open.
  docs/FEEL-SPEC.md      - what every timing constant means and how sure we are
  docs/HANDOFF.md        - current state, environment setup, and every trap
                           already paid for. Read the environment section
                           FIRST: Playwright needs a symlink shim before any
                           headless harness will run, and `pip install pillow`
                           before any rip-*.py tool will.
  docs/GAME-PLAN.md      - regions, dungeons, items, bosses
  docs/ART-DIRECTION.md  - binding for anything visual. Rule 1 is EXTRACT, NOT
                           DRAW: fidelity to the source games is the product,
                           so if a sheet in assets/sheets/ has the thing, take
                           it from the sheet via the tools/rip-*.py workflow
                           (AGENTS.md section J) instead of hand-drawing an
                           approximation. Extractions are GENERATED files —
                           edit the ripper's coordinate map and re-emit, never
                           the output. Hand-draw only what no sheet contains,
                           and match the extracted art next to it.
  docs/briefs/AGENTS.md  - authoring spec per work area, sections A-J

ENVIRONMENT, before anything else. Playwright asks for a browser revision the
pre-installed Chromium does not match, so every headless harness dies with
"Executable doesn't exist" until you shim it. The exact commands are in
HANDOFF under "Environment setup a fresh container needs" — check the revision
number in the error message. It has been 1234 every time so far, and the
installed one has been 1194.

Confirm the baseline before changing anything, and keep every line below green:
  node tools/validate.mjs                      clean (two expected warnings
                                               about fx_slash_d0/fx_slash_d1);
                                               also asserts no dungeon theme
                                               changes a tile's flags
  python3 tools/rip-dungeon-themes.py          regenerates tiles-dungeon-themes.js
                                               BYTE-IDENTICAL. --sheet writes a
                                               contact sheet of every pick.
  node tools/test.mjs                          58/58
  node tools/replay.mjs                        46/46, all TEN replays to the
                                               pixel. Six of them also assert a
                                               `span` — transitions fired, the
                                               camera's extremes, and what the
                                               probe TILES became.
  node tools/walk-dungeons.mjs                 23/23 over SIX dungeons (d1, d2,
                                               d4 and d5 are 24 rooms each, d3
                                               is 22, d6 is 26; the dungeon list
                                               is read out of the map registry
                                               rather than written down). The
                                               flood hops one-way ledges, swims
                                               from d3 on, CASTS A DREDGE LINE
                                               AT A MOORING from d6 on, and
                                               treats a door a gust wheel or a
                                               kelp snarl opens the way it
                                               treats a puzzle-opened one. One
                                               check asserts every locked door
                                               actually separates its room.
  node tools/check-lens.mjs                    24/24, every Lens fork proved
                                               pinned, one-way, unanswerable at
                                               the level it is chosen at, and
                                               drawn as ONE tile there
  node tools/check-cleats.mjs                  15/15, every torrent room proved
                                               unreachable on foot and on the
                                               surface, reachable on the floor,
                                               and inside one breath
  node tools/check-bellows.mjs                 60/60, every Cistern sill proved
                                               out of reach by hand, drowned at
                                               the sea it is played at, freed by
                                               one level of cone and by nothing
                                               else, and stood in only while it
                                               is still drowned
  node tools/check-overworld.mjs               17/17 (the field flood is ~30s
                                               of its runtime)
  node tools/check-gates.mjs                   15/15 (pins ?seed= and owns the
                                               clock since the flake below)
  node tools/check-items.mjs                   82/82
  node tools/check-reefseed.mjs                87/87, every grove proved
                                               unbuildable at LOW and unbrickable
                                               by a stray pillar
  node tools/check-dredge.mjs                  103/103, every Keep crossing
                                               proved across a pit nothing walks,
                                               reachable at one sea and no other,
                                               and every cache proved to give up
                                               nothing on a dry pan. Each closure
                                               clause runs TWICE — once at the
                                               line's reach and once at the
                                               Coilrope's.
  node tools/check-anchor.mjs                  14/14, every room that claims to
                                               need the Anchor proved impassable
                                               with the conch alone and passable
                                               with one placement
  node tools/check-charms.mjs                  63/63, every charm proved
                                               in-engine, no charm orphaned, and
                                               no room handing over a charm that
                                               does not exist
  node tools/check-motion.mjs                   8/8
  node tools/solve-switches.mjs                9 switch rooms, one push per
                                               block
  node tools/check-tilesets.mjs                 6/6 (needs Pillow; it SKIPS
                                               with exit 2 rather than passing
                                               quietly if Pillow is missing)
  python3 tools/rip-terrain.py                 regenerates tiles-terrain.js
                                               BYTE-IDENTICAL; if it does not,
                                               someone hand-edited a generated
                                               file. Same for rip-hud.py and
                                               `rip-dungeon-maps.py --verify`.
  node tools/scan-sprites.mjs --strict         0 hard findings
  npm run build                                51 modules -> one HTML file
  node tools/check-build.mjs                   the built file boots from file://

THE CHECKERS TAKE A WHILE. check-overworld, check-items and check-charms are
minutes each. Run them; do not reason about correctness instead.

EVERY SESSION ENDS BY RUNNING `npm run build` AND COMMITTING
dist/oracle-of-tides.html. That file is the playable game — one self-contained
HTML document that runs from a file:// URL with no server and no network, on a
phone as well as a desktop. A commit that changes src/ and leaves the build
stale ships a game that is not the game. See CLAUDE.md, Workflow.

THE BUILD - what it assumes, and what breaks it
  tools/build.mjs is a bundler, so it hard-fails rather than guessing:
  - It refuses to build if the game ever starts loading something at runtime
    (fetch, XMLHttpRequest, new Image/Audio, createImageBitmap, WebSocket, an
    .png/.wav/.json reference, an <img>/<audio>/<link src=>). The whole
    single-file trick rests on the game being procedural sprites plus WebAudio
    synthesis. If you add a real asset, the build tells you instead of shipping
    a file that 404s from file://. Teach it to embed the asset as a data: URI;
    do not delete the guard. It scans code with comments and string literals
    blanked out, so provenance comments naming .png sheets and room-grid
    strings that happen to spell "ogg" do not trip it, and `new Audio()` is
    allowed in src/core/audio.js because that module declares its own
    `class Audio`.
  - It understands exactly one import form, `import { … } from './x.js'`, and
    the export forms already in use (`export const/let/var/function/class` and
    `export { A as B }`). No default export, no `export *`, no re-export, no
    dynamic import, no multi-declarator `export const A = 1, B = 2`. Any of
    those is a build error naming the file and line. THIS BINDS src/data/feel.js
    IN PARTICULAR: it is a long list of single-declarator `export const`s and
    must stay that way — collapsing two constants onto one line would publish
    only half of them, silently.
  - IT REFUSES IMPORT CYCLES. Imports become destructuring from an eagerly
    evaluated module, so a cycle would snapshot `undefined`. src/core/rng.js
    and src/data/feel.js import nothing, which is deliberate — they sit at the
    bottom of the graph precisely because everything else imports them.
  - src/data/sprite-manifest.js is not reachable from main.js, so it is not
    bundled and the build says so. That is correct — it is tooling data.
  - The output must stay a CLASSIC script. A `<script type="module">`, even
    inline with no imports, is fetched with an opaque origin and blocked by
    file:// in every browser. That constraint is the reason for the whole
    module-registry design; do not "simplify" it back to a module.

DETERMINISM IS NOW LOAD-BEARING. Two rules, both easy to break by accident:

  - Never call Math.random() in src/. One global stream seeded from the save
    plus a per-room derived stream, both in src/core/rng.js. test.mjs greps
    for violations and fails.
  - Nothing in a DRAW path may consume randomness. draw() runs at display
    rate, update() runs at a fixed 60 Hz step, so a draw-time draw from a
    stream advances it a different number of times on a slow machine and the
    run silently desyncs. Use noise1/noise2 from rng.js — pure hashes that
    consume no state. The screen shake is the worked example.

EVERY TIMING AND SPEED CONSTANT LIVES IN src/data/feel.js. No module-level
`const WALK_SPEED = ...` anywhere else. Each export carries a unit and a
provenance comment: measured, derived, or guessed. NOTHING is `measured`. Most
values are guesses carried over from the old code; P3 made a handful `derived`,
which means computed from a stated constraint with the arithmetic in the
comment, NOT checked against a reference. Never upgrade a tag because the game
feels fine; `measured` means someone frame-stepped a recording.

POSITIONS ARE 8.8 FIXED-POINT (src/core/fixed.js). Four things about it:

  - `fx`/`fy`/`fz` are integer subpixel accumulators, 256 to the pixel.
    `x`/`y`/`z` are ACCESSORS returning derived integer pixels via `>> 8`.
    `e.x = 40` works and is right. `e.x += 0.5` does NOT — the read gives whole
    pixels, so a sub-pixel step rounds away every frame and the entity freezes
    in place with no error. Add to `fx`, or go through `moveEntity`.
  - `moveEntity(game, e, sdx, sdy)` takes SUBPIXELS. Enemy and projectile data
    still says `speed: 0.45` in px/f; the conversion happens at named edges —
    `moveDir`, the `Projectile` constructor, `hop`'s `power`, `driftWithTide`'s
    `perLevel`, `Entity.hurt`'s `knock`. If you change a constant's unit, grep
    src/data/ for anyone overriding it, or the override arrives in the wrong
    unit and silently does nothing.
  - NEVER floor a coordinate with `| 0`. It truncates toward zero, so it is a
    pixel wrong for every negative coordinate — and the player is at negative x
    on every room transition. Use `toPx`/`>> 8`.
  - Nothing in a draw path may round. Every draw coordinate is already whole.

A JUMP'S REACH IS A FUNCTION OF WALK_SPEED, not of the jump:
`reach = 2 * JUMP_POWER / JUMP_GRAVITY * WALK_SPEED`. Change the walk speed and
you change the length of every gap in the game. Only check-gates.mjs catches
it — it is the only harness that jumps, and both replays stayed green while
Roc's Feather stopped clearing the Coral Reef chasm. Re-derive the three jump
constants in the same commit.

FOR ANYTHING AT ALL: `npm run build && node tools/check-build.mjs`, then
commit the rebuilt dist/oracle-of-tides.html. A green src/ with a stale build
is a red session.

AFTER ANY CHANGE TO A FEEL CONSTANT OR TO MOVEMENT/COMBAT:
  node tools/replay.mjs                 expect it to FAIL
  node tools/replay.mjs --record-all    re-baseline
  ...and commit the new replays in the same change as the constant. A feel
  change that leaves stale replays behind is one nobody can review.
  If a movement constant changes and every replay still passes, either the
  constant is dead code or the replays do not exercise it. Both matter.

TEST HARNESSES OWN THE CLOCK. main.js steps the game a variable number of
times per animation frame, so a harness that fires a key and then counts frames
holds that key for as long as its own round trips take. test.mjs and replay.mjs
both call window.__harness.takeOver() and step(n) instead, and test.mjs pins the
save seed with ?seed=. If you write a new harness, do both — otherwise it is
measuring the machine, not the game. test.mjs is no longer load-flaky; a
failure there is now yours.

P8 IS COMPLETE. All six dungeons are authored against the constraint list, each
has a prover written before its rooms, each has a replay walking its own idea
in-engine, and the six-versus-eight consolidation is done — the Reef Palace and
the Salt Pan Vault are one-room ruins now and `d7`/`d8` are gone from the data.
docs/DUNGEON-STATUS.md is the board and it names the commit each landed in. DO
NOT RE-AUTHOR A FINISHED DUNGEON.

NEXT UP, and pick ONE. **Note the plan's own ordering before you pick P9:**
EXECUTION-PLAN Part 4 puts PT (towns) at step 8 and P9 at step 16, and says so
deliberately — "a gate is a tile flag dropped into a finished screen; a town is
the screen itself", so re-gating a finished village is a small edit and
re-towning a gated screen is not. P9 is UNBLOCKED (its gates were P6 and P8,
both done) but PT is the step the plan wants first, and PT has never been
started.

  - PT, towns and buildings. Step 8 of the order, still open, gates P9, and a
    stated top design priority. The world has villages that are a name on a
    signpost and a few doors cut into a cliff. It needs no decision from anybody
    and it is the only remaining item the plan puts before P9.
  - P9, overworld re-gating and difficulty. Unblocked, and the fold above
    changed its inputs: two regions that used to be dungeon approaches are now
    ruins, so the routing through the Salt Pans and the Reef Palace wants a
    second look before anything is gated. Taking this before PT means re-gating
    screens PT will then rebuild.
  - PLAY THE GAME. This is the largest open item in the project and no tool in
    the repo can close it. Six dungeons, six different fixtures — a held patch,
    a blind fork, a torrent, a drowned wheel, a bole and a snarl, a mooring and
    a drowned cache — and no session has ever compared two of them. Nobody knows
    whether the difficulty curve across the six goes the right way, or at all.
  - THREE ENEMIES ARE REGISTERED AND UNPLACED after the fold: thalassor,
    saltwraith and gustharpy. Hand-drawn art shipping in dist/ that nothing in
    the world draws. Place them or remove them with their sprites — and if you
    remove them, take the cell out of the ripper's map and re-emit rather than
    editing the generated file.
  - (superseded, kept for the reasoning) P8 for D5, the Drowned Wood Shrine and
    the Reefseed.
  - (superseded, kept for the reasoning) P8 for D4, the Cliffside Cistern and
    the Squall Bellows.
  - (superseded, kept for the reasoning) P8 for D3, the Bogwater Sanctum and
    the Kelp-Soled Cleats, and then D4-D6.
    D1 and D2 are DONE and each solved a different shape of problem: D1's item
    did not FIT in a room (geometry), D2's item could not be REQUIRED by terrain
    at all (it only shows you things). Read both "P8 status" tables in
    EXECUTION-PLAN before designing, and read the header comment at the top of
    d2 in src/data/dungeons-a.js for how an item that cannot gate is made
    necessary anyway. D3's item introduces SWIMMING, which is the thing both
    check-anchor.mjs and check-lens.mjs say in their own headers they cannot
    model — teaching one of them to swim is part of that session, not an extra.
  - A room that claims to need its dungeon's item should DECLARE that in its
    room data and be proved by a checker, both ways. There are SIX worked
    examples now — check-anchor, check-lens, check-cleats, check-bellows,
    check-reefseed and check-dredge — and they are different shapes on purpose: the anchor's
    is a state-space flood over (tile, level), the Lens's is a fixed-level
    flood plus a tile-identity claim, the Cleats' is an arithmetic comparison
    of two speeds, the Bellows' is a reachability claim crossed with a cone
    footprint, the Reefseed's is a fixed-point closure over everything the
    player could build, and the Dredge Line's is a simulated cast crossed with
    a flood from where it drops you. Write the checker BEFORE the rooms.
    AND ASK WHICH CHARM CHANGES THE ANSWER: check-dredge proves every closure
    clause twice, once at the line's reach and once at the Coilrope's, and the
    second pass failed on its first run. AND DO NOT COPY ANOTHER
    PROVER'S FLOOD WITHOUT READING IT: check-cleats hops anything that is not
    solid, which is wrong for pits, and copying it cost D4 three false
    failures.
  - P7.5's remainder is BLOCKED: it needs four dungeon map rips that are not
    in this repo. Do not start it by inventing the colour-register decision.

P7 IS CLOSED. There is no P7 follow-up session. What scrimshaw still owes is
assigned per dungeon in EXECUTION-PLAN under "P7 is CLOSED" — read that table
before starting any P8 session, and do the charm-gating audit it asks for.

THE CHARM CASES NOW OPEN ON THE ESSENCE, settled by D2. `openCharmCases` in
scrimshaw.js is called from Game.claimEssence, and the scrimshander says her
line the first time you see her afterwards (progress.charmTold). Before this
the unlock fired only from Scrimshander.interact, so a player who never walked
back to Tidewatch owned charms they could never switch on — with every checker
green, because the system worked and simply was not on.

ONE MORE THING D1 SURFACED AND LEFT ALONE: at one essence the MID case is the
only case open, and D1's design is "take the sea down to LOW", so the player's
one charm is dark for most of the first dungeon. Leave it, open LOW at one
essence, or place the Neap Charm early — the argument for each is in the same
section. It is a taste call and it wants play, not analysis.

SCRIMSHAW IS IN AND THE RING SYSTEM IS GONE. `game.charm(id)` replaced
`hasRing`. A charm is live only while the tide UNDER THE PLAYER'S FEET matches
its case — `tideAt(game, player)`, never `tide.level` — so an anchored patch
keeps its charms alive. If you add a charm, something in src/ outside
scrimshaw.js must READ it, or check-charms fails you. A charm PLACED in a
dungeon must fit a case the player has open at that point in the game: at one
essence that is MID and nothing else, so a LOW charm in D1 is a reward nobody
can switch on for two dungeons. check-charms prints every hand-placed charm.

AN INFORMATIONAL ITEM CAN ONLY BE REQUIRED WHERE THE INFORMATION CANNOT BE
BOUGHT SOME OTHER WAY. D2's forks work because the room declares `tideForce`,
which pins the tide and REFUSES the conch — otherwise the player sounds it,
looks at the room one level up with their own eyes, sounds it back, and the
Lens is a convenience. The pin, a one-way ledge, and a TideValve at the BOTTOM
of each branch (past the point of no return) are the three parts, and
check-lens.mjs asserts all of them. Do not unpin a fork room.

A DUNGEON ROOM MAY BE BIGGER THAN ONE SCREEN. Sizes are 1x1 (the default and
still most rooms), 2x1, 1x2, 2x2 and 3x1, declared as `size: [2, 1]` in the room
def. The `map` is ONE grid — a 2x1 room is eight rows of TWENTY characters — and
a multi-screen room OWNS every map cell it spans, so nothing else may be keyed
inside its footprint. validate.mjs fails on both mistakes. The overworld may not
declare a size at all and registerMap throws if it does. Everything else — the
camera, the render cache, the minimap, the seam arithmetic — is done and every
checker reasons over room.tw/room.th. `d1` `0,5,3` is the worked example; the
sizing rule and the pacing number are in EXECUTION-PLAN under "ROOM SIZE".

A LOCKED DOOR MUST WALL OFF WHAT IT LOCKS. walk-dungeons.mjs now asserts every
dDoorLocked/dDoorBoss tile separates its room on one axis at ALL THREE tide
levels. D1 shipped one that did not — you could step round it along the next row
— and nothing caught it, because the dungeon flood spends a key on any lock it
can reach and then only asks whether every room came out reachable. Wall the
four tiles round a door when you place it.

A DUNGEON THEME'S FLOOR VARIANT `,` IS WATER-COLOURED IN THREE OF THE EIGHT
THEMES. Grotto, Cistern and Salt register their Alt floor in `stonef`, which is
the palette of dFloorWet — the MID form of the dBasin tide tile. Decorating a
floor with it in those dungeons says "there is water here". Coral, Bog, Wood,
Palace and Abyss are clear. validate.mjs checks that a theme never changes a
tile's FLAGS and is blind to it changing what a tile appears to SAY, so look at
the room.

AN ANCHOR GATE IS ONE RULE PLUS GEOMETRY. No tile between the two bands may be
walkable at BOTH levels — the conch can be sounded anywhere the player can
stand, so one forgiving tile in the middle turns the whole gate into a button
press. That mistake was made and caught by tools/check-anchor.mjs in the same
session, in all three gates at once. Bands are 4 near and 3 far because the hop
clears two whole tiles and the patch is five across; both numbers come out of
feel.js, not out of memory.

ANYTHING THAT TOUCHES POSITIONS TOUCHES THE LATTICE. `beginStep`/`advanceStep`
in src/game/enemy.js must go on landing exactly on multiples of
`ENEMY_GRID_STEP * FP_ONE` (8px = 2048 subpixels). They recompute progress from
the step's origin every frame and assign the exact destination on the last one,
rather than accumulating a velocity, precisely so nothing carries a remainder.
`node tools/check-motion.mjs` is what tells you if that survived, and it asserts
on `fx`/`fy` rather than `x`/`y` for the same reason.
THE TIDE IS A FIELD. `game.tide.level` is the BASE — the HUD gauge, the music,
the save file and the conch's own plumbing. Everything about the world reads
`game.tide.levelAt(tx, ty, room)`, or passes `game.tide` straight to a room
query, which resolves per tile. `tideAt(game, e)` in entity.js is the level
under an entity's own feet and is what an enemy, a boss or a raft wants. If you
add a call site that says `tide.level` and means "the water here", it will be
right until the first anchor lands near it and wrong forever after.

A DUNGEON ITEM'S GUARDS ARE PART OF ITS GEOMETRY. Three items now refuse to be
used while `inDeep || underwater` — the Squall Bellows, the Reefseed and the
Dredge Line — and in each case the guard is what makes range and footing mean
anything. Without it the answer to every mooring in the Abyssal Keep is to swim
into the middle of the shaft and cast from there, and no arrangement of ground
can be made to matter. If you add an item that is aimed from where you stand,
decide whether the water is somewhere you can stand, and write it down.

A PIT IS THE ONLY BARRIER LEFT AFTER D3. The Kelp-Soled Cleats make deep water a
road in both modes and no sea level fills a hole, so a late-game room that says
"you cannot get over there" has to mean `dPit`. The Cistern found it, the Keep is
built on it, and it is the first thing to check when a late room reads as
crossable and should not be.

THE ESSENCE COUNT IS COMPUTED, NOT WRITTEN DOWN. `essenceCount()` in
src/world/maps.js counts dungeons that grant one. The HUD, the quest screen and
the save slots all print `/8` until they ask it — which they had been doing for
the whole life of the project, against a plan that has always said six.

Do the work yourself rather than spawning subagents - past sessions hit usage
limits that way and lost the work.

Tell me plainly what is done, what is weak, and what you skipped.
```

---

## What is already done — do not redo any of this

- engine, renderer, tide system, save/load, menus, cutscene runner
- the 120-screen overworld and all SIX dungeons (the fold took the room count
  down; walk-dungeons reports the live figure and it is what to trust)
- 56 enemy sprites and a 22-type enemy roster
- all 16 boss and miniboss fights, verified beatable
- every effect, pickup, object, projectile and item icon
- the whole story: 20 dialogue ids, 15 cutscenes, all verified to terminate
- music: 22 tracks; one-way ledges in all four cardinals; the region gates
- **the single-file build.** `npm run build` flattens into
  `dist/oracle-of-tides.html`, playable from a `file://` URL. Rebuild and
  commit it at the end of EVERY session.
- **the feel spec, the seeded RNG and the replay harness (P1)**
- **a deterministic `test.mjs` (P2)**
- **8.8 fixed-point positions, un-normalised diagonals, the sword-hold (P3)**
- **grid-locked enemy motion and scripted knockback (P4)**
- **the tide as a field and the Tidewright's Anchor (P5)**
- **the item roster (P6)** — `docs/ITEMS.md` plus `tools/check-items.mjs`
- **scrimshaw (P7)** — thirty tide-slotted charms, the scrimshander, the CHARM
  menu screen, and `tools/check-charms.mjs`. The ring system is deleted.
- **`tools/rip-dungeon-maps.py` (P7.5, partial)** — stitched floor maps to
  deduplicated tilesets, byte-identical, checked by `check-tilesets.mjs`
- **D1 re-authored around the Anchor (P8, dungeon 1 of 6)** — 24 rooms, three
  gate corridors, two gauge rooms, the item at the halfway point, and
  `tools/check-anchor.mjs` proving each anchor room in both directions
- **the eight dungeon themes (P7.5 step 8)** — `tools/rip-dungeon-themes.py`
  plus a themed legend per dungeon. Every dungeon is now identifiable from one
  screenshot, and no room grid changed to do it.
- **D2 re-authored around the Brineglass Lens (P8, dungeon 2 of 6)** — 24
  rooms, two floors, two pinned Lens forks, `tools/check-lens.mjs` proving each
  in five directions, and the charm cases moved onto the essence
- **multi-screen dungeon rooms (P7.6)** — a room may declare `size` in screens;
  a camera with a deadzone follows Link inside one and clamps to zero in a 1x1
  room, which is why no existing room moved. `d1` `0,5,3` is the one converted
  room and `d1-clawcrab-den-wide` is its replay.

## What is left

**P8 IS COMPLETE and PT steps 1-4 are done.** Six dungeons, six provers, the
eight-into-six fold, and four town screens built out of extracted buildings.
Read `docs/DUNGEON-STATUS.md` before touching a dungeon and the PT section at
the top of this file before touching a town.

1. **PT step 5 — the terrain backlog, and it is the biggest art job left.**
   `docs/ART-BACKLOG.md` ranks it. The `cliff` family is the head of it: the
   Oracles build a cliff out of several tiles and this game spends ONE tile on
   all of it, so one extraction covers eight tiles and it is a content decision
   rather than a swap. Water is genuinely blocked (no sheet in the repo has a
   second animation frame).

2. **PT step 4 — populate the towns properly.** The buildings are extracted and
   the doors work; the people are not. `assets/sheets/oracle-seasons-nonhuman-races.png`
   has still never been extracted from and carries the Maku Tree, the Great
   Fairy and rows of townsfolk, and the scrimshander still shares a face with
   the digger. This is the half of PT that is one ripper away.

   Two town-shaped follow-ups worth doing in the same session: **Tidewatch does
   not answer the tide** (no tide tile in the square, so the village looks
   identical at all three levels — a slipway or a flooding gutter along one edge
   is the fix, and `check-towns.mjs` will say whether it severs the square), and
   **a third town legend** for a marsh, cliff or salt settlement, which is two
   lines in `TOWN_GROUNDS` and two in `legends.js`.

3. **P9 — overworld re-gating and difficulty.** Its inputs are satisfied and it
   CAN start. It is deliberately not first: `docs/EXECUTION-PLAN.md` Part 4 puts
   PT at step 8 and P9 at step 16, because a gate is a tile flag dropped into a
   finished screen and a town is the screen itself — re-gating a village is a
   small edit, re-towning a gated screen is not.

4. **NOBODY HAS PLAYED ANY OF IT.** Not a dungeon, not a town. Every claim in
   this repo is a checker's or a replay's. It is not a box on any checklist and
   it is the largest open item in the project.

5. **P7.5's remainder — BLOCKED ON ASSETS.** Four dungeon map rips are missing.
   See `docs/ART-BACKLOG.md`. The colour-register decision is explicitly yours,
   not a session's.

Carried over, and none of it blocking:

- **Settle `ANCHOR_RADIUS_TILES` and `NEAP_GRACE_FRAMES` by playing them.**
  Both are design constants with nothing to measure against, both have debug
  keys or are one edit away, and everything built on top assumes an answer.
- **Charm balance and charm placement.** Thirty charms work; none has been
  compared to another, and only one is placed in the world by hand.
- **The overworld terrain that is still hand-drawn.** Ranked in
  `docs/ART-BACKLOG.md`; the `cliff` family is the big one and is a content
  decision, not a swap.
- **Water is still hand-drawn** and genuinely blocked — every terrain sheet in
  the repo is a static map with no second animation frame.
- **A full-D1-clear replay.** The actor needs a push verb, a boss routine, and
  — new with P8 — a way to aim a throw at a named tile and then sound the conch
  in order, since every room past the Anchor needs that. `d1-sluicegate` is a
  hand-scripted stand-in for one gate.
- **A checker for chests whose pickup lands on a solid tile.** D1's instance is
  fixed by re-authoring; the engine defect and five dungeons are not.
- **A tide-gauge fixture** so the two gauge rooms signal their rule with
  something other than a plaque. See `docs/ART-BACKLOG.md`.
- **The Lens draws three dark blues.** Shallow water, deep water and a pit
  separate by 4-6 RGB units through the ghosted overlay, and D2's second fork
  turns on exactly that read. Measured at three opacities, written up in
  `docs/ART-BACKLOG.md` with three candidate fixes. Wants a person holding the
  button, not another table.

## Traps that pass every validator

These are in HANDOFF in full. The short list, because each one cost a session:

- A push block moves exactly one tile, ever (`once: true` by default).
- An open dialogue freezes every entity while `mode` is still 'play'. This is
  also what stalled the first D1 replay recording for 2000 frames; every
  waiting directive in `tools/replay.mjs` now taps through one.
- An explicit palette at a draw site overrides a sprite's own.
- A solid tile is never hit by a projectile's own rect.
- An entity dropped from `game.entities` must be marked `remove` first.
- A gate tile sits inside a screen, not on its boundary row.
- `>` and `<` ledge runs are COLUMNS, not rows. A lip is solid from three
  sides, so a run across a corridor strands rooms and still validates — use
  `find-ledges.mjs` rather than placing by eye.
- Digits 0–9 in a room grid are always tide tiles.
- A chest can hand over an item that does not exist, in total silence.
- A tiledef field `registerTiles` does not name is silently discarded.
- A floor drop that speaks freezes the fight that dropped it. Jingle, never
  `game.say`.
- Adding an entity to an EARLY room re-phases every enemy in the game — ids are
  global and `every()` hashes the id — so it re-baselines all three replays.
- A new pickup weight taken out of the `heart` entries is a difficulty change
  wearing a costume; take it from `null` or the small rupees.
- Deleting an entry from `ITEMS` by slicing between banner comments takes its
  neighbours with it. Match the whole entry, brace-counted.
- A counted item used to arrive with an empty pouch: the capacity rule lived in
  `Game.openChest` alone. It is in `progress.giveItem` now, with the grant.
- A solid tile two squares away does not block a thrown Reefseed, it CATCHES it
  onto the square between. Every grove in d5 is laid out around that fact.
- A pillar the player grew is a SOLID tile at MID that no room author placed.
  `check-reefseed.mjs` is the only thing in the repo that can see it strand a
  room, and it only knows about the rooms that declare a `reefseedRoom`.

## Engine-API details a harness gets wrong on the first try

- `main.js` publishes `window.__game` and `window.__harness`. Everything else
  a harness needs comes out of the live module graph with a dynamic import
  from inside the page; there are worked examples in every committed harness.
- `window.__harness.takeOver()` stops the wall-clock loop stepping the game;
  `step(n)` then advances exactly n fixed updates. That is how `replay.mjs`
  gets a deterministic clock. `release()` hands it back.
- `enterMap` is `(mapId, FLOOR, rx, ry, px, py, dir)` — floor is the second
  argument, and passing `rx` there silently lands you in the wrong room.
- MAPS is a Map keyed by map id, holding room definitions under `roomDefs`,
  whose grids are under `map`. Cutscenes export as `STORY_CUTSCENES`.
- Equipped items are `progress.equipB` / `progress.equipA`; `giveItem` comes
  from `src/game/progress.js`. `progress.seed` is the root of every random
  decision the run makes — `newProgress(name, seed)` pins it.
- After `room.setTile` you must call `room.invalidate()`.
- Keys are KeyZ = B and KeyX = A (`src/core/input.js`), Enter = START.
- `game.tryPushBlock(tx, ty, dx, dy)` takes the BLOCK's tile, not the player's.
- Reset `g.mode` to 'play' and refill hearts between probes, or the first room
  that kills a parked player drops the run into gameover.
- Park probes on CLEAR floor.
- `newGame` does NOT grant the sword — the intro cutscene does. A probe that
  clears the cutscene must `giveItem(g.progress, 'sword', 1)` itself, or every
  sword input is silently swallowed by `useEquipped` and the probe looks like a
  broken feature rather than a broken setup.
- Reading a feel constant from inside a harness: `await import('/src/data/feel.js')`
  in the page. Prefer that to writing the number down in the tool — a frame
  budget hard-coded against a constant rots the moment the constant moves, and
  `check-gates.mjs` had exactly that bug.
