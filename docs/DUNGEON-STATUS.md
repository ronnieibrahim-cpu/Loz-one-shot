# Dungeon status — the board

**This file is the answer to "which dungeon do I build next?" and it is the
first thing a P8 session reads.** Every other document describes what was done;
this one describes what is left, and it is the only place the two are kept in
the same table.

It exists because a finished dungeon was very nearly built twice. D2 was
re-authored, proved and committed on `claude/p8-dungeon-generation-faqood` and
never merged, so `main` still carried the pre-P8 Coral Spire and every document
still said "D2 outstanding". A later session read that, believed it, and built a
second D2 from scratch before anyone noticed the first. Nothing was wrong with
either dungeon; what was wrong was that the record of what exists lived in the
git history of a branch nobody thought to look at.

So: **a dungeon is not done when it is authored, it is done when this table says
so and names the commit.** If you cannot find the commit, the work is not done,
whatever a commit message elsewhere claims.

---

## The board

| D | Map | Name | Item | Status | Where it landed |
|---|---|---|---|---|---|
| 1 | `d1` | Tidewash Grotto | Tidewright's Anchor | **DONE** | `d655d1f`, merged to `main` |
| 2 | `d2` | Coral Spire | Brineglass Lens | **DONE** | `0a3776f` (authored on `claude/p8-dungeon-generation-faqood`) |
| 3 | `d3` | Bogwater Sanctum | Kelp-Soled Cleats | **DONE** | `a9eb63e` |
| 4 | `d4` | Cliffside Cistern | Squall Bellows | **DONE** | `5fd7301` |
| 5 | `d5` | Drowned Wood Shrine | Reefseed | **DONE** | `0db0eab` |
| 6 | `d6` | Abyssal Keep | Dredge Line | **DONE** | `84d14e5` |
| — | `d7` | Reef Palace | — | **FOLDED IN** | `84d14e5` |
| — | `d8` | Abyssal Keep | — | **FOLDED IN** | `84d14e5` |

### D1 IS PLAYED, NOT MODELLED (S19)

`node tools/check-playthrough.mjs` drives a new game with nothing granted and
walks out of Tidewash Grotto holding its Essence: three Small Keys, the Boss
Key, four Pieces of Heart and the Heart Container they make, both anchor gates
in each wing, both pairs of gauges, and Gohmaraq killed in real combat on four
hearts. 24,000 frames, no death, no warp, no flag set from outside. Landed in
`661e585`.

**That is one dungeon of six.** Nothing past D1 is routed, and until it is,
"D2 is DONE" in the table above means what it has always meant: authored,
flooded, and proved by models. See `GOAL` in `tools/playthrough-route.mjs`.

**S28 got 10 of D2's ~14 required rooms into a live-engine route** (Spire
Mouth through both Small Keys, the Lens, the Bombs, a heart piece and the
Boss Key) — not landed in `tools/playthrough-route.mjs` (still D1-only), but
verified against the real engine in a scratch harness and written up in full
in `docs/NEXT-SESSION.md` S28. Read S28 before attempting D2 again: it names
exactly which rooms are solid and saves re-deriving the switch puzzle, the
locked-door positions, both `lensRoom` fork sequences, and a real, general
`dTravel` gap (it cannot path through a `size:[w,h]>1x1` room's non-anchor
exits — hits both Reefguard Hall and Spire Ascent) from scratch.

**S28 also self-corrected a wrong diagnosis mid-session, kept on record
rather than silently fixed.** An earlier pass reported the Reefguard miniboss
as unwinnable and blamed `dBoss`'s wide-room combat AI. The real cause was a
route bug: equipping the Lens onto B displaced the sword (only ever bound
there), so every subsequent swing attempt pressed the Lens button instead.
`dBoss` needed no changes. What is NOT yet solved is the return leg from the
Boss Key room back to Spire Ascent's boss door — see S28's "open problem"
for exactly where it stalls and what was ruled out.

### Boss winnability, measured (S5)

`node tools/measure-boss-combat.mjs <id>` — real combat, no god mode, seed
20260806, at the **in-order** health a player carries (3 hearts + one Heart
Container per boss already beaten, counting **no heart pieces**: a deliberate
floor, since 24 pieces exist in the world).

| D | boss | in-order | before S5 | after S5 | wins at |
|---|---|---|---|---|---|
| 1 | Gohmaraq | 3 hearts | 16/24, died | **KILLED** (S19: 12 of 12 seeds) | **3 hearts** |
| 2 | Anemos | 4 hearts | 12/30, died | **KILLED**, 1 qh left | **4 hearts** |
| 3 | Gloomtide | 5 hearts | 28/36, died | **KILLED**, 8 qh left | **5 hearts** |
| 4 | Wyverna | 6 hearts | *reported* 40/44, died | **KILLED, unhurt** | **6 hearts** |
| 5 | Rootmaw | 7 hearts | *reported* 24/52, died | **KILLED**, 15 qh left | **7 hearts** |
| 6 | Nereth | 8 hearts | 0/80, died | **42/80**, died | **11 hearts** |

**Five of six are won at a floor that counts zero heart pieces.** D6 needs
three hearts' worth (12 of 24) — comfortably inside the route; 9 pieces sit in
the overworld and 3 in the caves before any dungeon is counted.

**S19 moved D1's row and put a caveat under it.** The verb learned not to walk
into things (`evade` in `tools/actor-runtime.mjs`) and now kills Gohmaraq on
three hearts on 12 of 12 seeds — but that measurement TELEPORTS into the arena
and starts from a standing position. Walked in through the south door with the
boss's intro already running, three hearts loses and four wins, which is why
`playthrough-route.mjs` collects a Heart Container before the door. The same
change costs Anemos, Gloomtide and Rootmaw a coin-flip each on the four seeds
swept; `measure-boss-combat.mjs --no-evade` reproduces the old row exactly.

Wyverna and Rootmaw were **already being won before this session** and the
harness was reporting them as unfinished fights: `g.boss` goes null when the
entity is removed, so `b.dead` read null on a kill. `progress.beaten` is the
ground truth (`T38` said so already) and the tool reads it now.

**A robot beating a boss is not a player beating a boss** (`§4.2`). These
numbers say the fights are *finishable*; whether they are *fair* is not a claim
any tool here can make.

**P8 is complete.** All fourteen boxes of the checklist below tick for all six
dungeons: each is authored against the constraint list, each has a prover
written before its rooms, each has a replay that walks its own idea in-engine,
each has been looked at on screen, and the six-versus-eight consolidation is
done. Audited by counting the live map data rather than by reading this table
back.

**What that does NOT mean.** "Nobody has played one" is not a box on the
checklist and it is still true of all six — see the bottom of this file. And P8
being finished does not make P9 the next thing by itself: `docs/EXECUTION-PLAN.md`
Part 4 puts **PT (towns) at step 8 and P9 at step 16**, deliberately, because
re-gating a finished village is a small edit and re-towning a gated screen is
not. P9's gates (P6 and P8) are satisfied, so it CAN start; PT is what the plan asks
for first, and its steps 1-4 have since landed — the block machinery, the
extracted town kit and four town screens, proved by `tools/check-towns.mjs`.
What is left of PT is the terrain backlog and the townsfolk sprites.

"DONE" means every box in the checklist below is ticked and every checker in
CLAUDE.md's table was green on the commit named. It does not mean the dungeon
has been played by a person — see "What no dungeon has yet" at the bottom.

---

## What "done" means, per dungeon

The P8 constraint list, as a checklist a session can tick. It is in
`docs/EXECUTION-PLAN.md` in prose; this is the same thing in a form you can
count.

- [ ] 22-32 rooms across 1-3 floors
- [ ] the dungeon's item is found roughly halfway through
- [ ] every room after the item requires the verb that item introduced, or the
      exception is stated in writing and is one or two rooms, not a wing
- [ ] the tide theme in the item table is the constraint: no room's puzzle
      survives being played at a fixed tide level
- [ ] Chartstone, 2-4 small keys against that many locks, one Boss Key
- [ ] one miniboss about two thirds of the way through
- [ ] a Heart Container from the boss room's `onEvent('bossDead')`
- [ ] essence index equals the dungeon number
- [ ] at most one room in six larger than 1x1, at most one larger than 2x1
- [ ] a charm placed by hand, in a case the player has open at that point
- [ ] **a prover, written BEFORE the rooms**, that proves in both directions
      that the rooms claiming to need the item actually do
- [ ] a replay that walks the dungeon's own idea and asserts it in-engine
- [ ] the rooms looked at on screen, at more than one tide level, and what was
      seen written down — including if it read badly
- [ ] this file updated, `docs/NEXT-SESSION.md` updated, `npm run build` run and
      `dist/oracle-of-tides.html` committed

---

## D3 — Bogwater Sanctum. DONE, and what it settled for D4-D6.

22 rooms, one floor, re-authored around the Cleats' two modes. Three torrent
rooms, `tools/check-cleats.mjs`, and the `d3-undertow` replay.

**The problem it had to solve.** D1's Anchor did not FIT. D2's Lens could not
be REQUIRED by terrain at all. D3's Cleats had the opposite problem: they are
required by every deep tile in the game the moment they exist, so "this room
needs the Cleats" is free and means nothing. The claim worth proving is about
the two MODES, not the item — *the surface route does not get there and the
floor route does* — and it is provable because the difference between the modes
is data. A tile's `push` is applied only while swimming, so comparing it to
SWIM_SPEED decides the question in arithmetic.

**The reusable part for D4-D6:** when an item's mere possession is the gate,
find the axis INSIDE the item and prove that instead.

**What it cost elsewhere**, both worth knowing before D4:

- `walk-dungeons.mjs` now swims in any dungeon of index 3 or higher, because
  the Cleats are the third dungeon's item. It stays off for d1/d2, so nothing
  already proved about those two moved.
- `Player.updateTerrain` gained four lines: entering water with the soles
  already set to sink now dives. `toggleCleats` on dry land had been setting
  `cleatMode`, saying "you will walk under the next water you meet", and then
  NOTHING EVER READ THE FLAG AGAIN.

**What is weak about it, and it is the same shape as D2's finding.** A torrent
is drawn as ordinary deep water. Same art, same palette, same blue; the only
difference is a faster ripple. In a screenshot it is invisible and in motion it
is nearly so, so a player has no way to know which water is a current or which
way it runs before swimming into it. The rooms are legible as drains and
illegible as currents. See `docs/ART-BACKLOG.md`.

## The consolidation, and how it was settled

**The plan said six dungeons and the data held eight.** It is six now.

**The item reconciliation, decided rather than papered over.** `docs/ITEMS.md`'s
primary roster — "The six dungeon items" — gives D6 as the Abyssal Keep holding
the Dredge Line, and CLAUDE.md says content that disagrees with that file is
wrong. So `d6` IS the Abyssal Keep: Dredge Line, essence 6, Nereth, entered from
the Gate of the Keep. The other two items the fold displaced kept their homes:

| Item | Was | Is |
|---|---|---|
| Dredge Line | `d8` Abyssal Keep | **`d6`, room 13 of 26** |
| Kelp-Soled Cleats L2 | `d7` Reef Palace | **`d6`, the Mermaid Vault behind the miniboss** |
| Bottled Tide (the case) | `d6` Salt Pan Vault | **`cave3`, at the Salt Pans mouth** |

**The two regions stayed on the map.** A region whose door leads nowhere is a
bug; a region with a sealed ruin on it is a place. The Salt Pans mouth opens on
the Salt Pan Vault, one room, holding the bottle case. The Reef Palace mouth
opens on the Palace Porch, one room, holding a Piece of Heart and a notice
saying the rest of it is under water. Their best rooms moved into the Keep —
`d8`'s Three Heights is the Keep's tide-vocabulary room and `d7`'s phasing fight
is the Tideshade Hall.

**The story counted to eight and now counts to five.** Farore breaks the Bell
into six, the Maku Tree asks for five and the sixth comes off Nereth's crown,
and `essenceCount()` in `src/world/maps.js` is the one place that knows the
number — the HUD, the quest screen and the save slots all read it. They had been
printing `/8` against a plan that said six for the whole life of the project.

**What the fold cost, stated rather than hidden.** Four hand-drawn enemies lost
their placements. The Brinehulk was given a new one — it keeps the Boss Key on
the far island of the Crossed Shafts, armoured at the one sea the crossing can
be made at — but `thalassor`, `saltwraith` and `gustharpy` are now registered
and unplaced. That is real content sitting in the build that nothing draws, and
it is a P9 job: either place them or take them out with their sprites.

---

## D4 — Cliffside Cistern. DONE, and what it settled for D5-D6.

24 rooms, one floor, re-authored around the Squall Bellows. Five sill rooms
holding six wheels, `tools/check-bellows.mjs` (60 assertions), and the
`d4-drowned-sill` replay.

**The problem it had to solve.** The Bellows are the Anchor inside out: the
cone lasts exactly as long as the button is down, follows your facing, and
takes your feet while it blows. So a room you cross by holding the button and
walking is not a Bellows room — the thing the cone frees has to act while you
stand still, somewhere you are not.

**The answer, stated once:** a paddle wheel drowned under deep water does not
catch the wind, and the only thing that takes the water off one tile while
leaving the room alone is the gust that has to turn it. Two shapes, because one
would have been the same idea five times:

* **the sump shelf, worked at MID** — `0` is a pit at LOW, deep above; `3` is
  shallow at LOW, drowned above. Standable from MID up, freeable from MID down.
* **the drown-wall shelf, worked at HIGH** — `9` is stone until HIGH; `1` is
  dry, wading, drowned. Both halves meet only at HIGH.

**The reusable part for D5-D6:** when the item is HELD rather than placed, the
room is somewhere the player is not. Ask what acts while they stand still.

**What it cost elsewhere**, all four worth knowing:

- **`Tide.blows` is new: the cone no longer blows through stone.** It was pure
  geometry, so a wheel sealed in an alcove could be turned through two walls by
  someone facing roughly at it. Line of sight resolves at the BASE level, never
  through the field — the field is what the call is computing.
- **`GustWheel` restores its open state from the save.** `interact` wrote
  `progress.flags[saveKey]` from the first day and nothing ever read it back.
- **`walk-dungeons.mjs` knows two new things**: a door a wheel opens
  (`bellowsRoom.opens`) is passable to the flood, the same exemption a
  puzzle-opened door already had, and a wheel that pays out
  (`bellowsRoom.gives`) is counted in the key and boss-key sweeps. A script
  spawn is invisible to every sweep in that tool.
- **`shoot-rooms.mjs --bellows`** pumps the item for a screenshot, because the
  cone is a held state and nothing about a sill can be seen without it.

**What is weak about it, and it is the same shape as D2's and D3's findings.**
The successful drain reads and the failed one does not. At MID with the cone
open the wheel's tile goes from (38,76,140) to (70,133,175) beside an undrained
tile of the same water — unmissable. At HIGH the cone is working just as hard
and the tile does not change at all, because `dWell` draws the same tile at MID
and HIGH, so a player pumping at the wrong sea cannot tell "my cone is not
reaching" from "my cone is reaching and one level is not enough". The wheel's
own sprite never says it is drowned. See `docs/ART-BACKLOG.md`.

---

## D5 — Drowned Wood Shrine. DONE, and what it settled for D6.

24 rooms, one floor, re-authored around the Reefseed. Five groves,
`tools/check-reefseed.mjs` (87 assertions), and the `d5-overthrow` replay.

**The problem it had to solve, and it was the flattest of the five.** A pillar
cannot open a path. `Reefseed.canPlant` refuses SOLID, PIT and VOID at EVERY
tide level, not merely the current one, so a seed may only be grown where the
player could already stand or already swim. Everything the item does, it does by
putting ground where there was sea — never by removing a wall. Three quarters of
this session went on discovering that and then on the two consequences of it
that no other item has:

* **A pillar is ground at LOW and at LOW alone** — floor, then `coralWall`, then
  `coralSunk`. So a grove is USED at LOW whatever else is true of it.
* **You cannot plant a stake from the water.** One new guard in
  `ITEMS.reefseed.use`, on the same grounds the Bellows refuse, and it is what
  makes throwing range mean anything: a seed carries exactly two tiles, so a
  stake more than two tiles from dry footing can only be planted from another
  stake.

**The answer, stated once:** a **drowned bole** (`dSnag`) is a tree that stands
at LOW and MID and is open water at HIGH, and `room.solidAt` refuses a SOLID
tile to a thrown seed exactly as it does to a walking body. So the throw is a
tide decision and the standing is the opposite one — throw at HIGH, sound the
conch to LOW, climb out of the water onto what you threw. What the stake buys is
a sword swing at a **kelp snarl** (`dSnarl`), whose only transform is `cut`:
`Player.startSwing` returns early while `inDeep`, so a swimmer beside a snarl
cannot touch it and a bomb finds nothing to break.

**The reusable part for D6:** the fixture is
`bank — bole — STAKE — snarl` in a straight line, with water on one
perpendicular side of the stake and a sump on the other, and the line matters.
A bole or a snarl two tiles from a standable tile CATCHES a seed onto the square
between them, so the two solids have to be opposite each other across the stake
or the room has a second answer. All four orientations of that line are used
once each; the fifth grove is two screens wide and builds it twice over.

**A structural dead end, written down because it cost the session its first
design.** The groves were originally push-block crossings — a block cannot enter
deep water, so a pillar is the only road across. It cannot be made to work: the
player pushing a block into a stake is ALWAYS standing exactly two tiles from
that stake with a non-solid square (the block's own tile) between, so they can
always throw the seed from the same square they push from, and the room falls to
a fixed LOW. Do not spend a session rediscovering it.

**What it cost elsewhere**, all three worth knowing:

- **`progress.giveItem` now stocks a counted item.** The rule that a Reefseed, a
  bomb or a bottle arrives with something in it lived inside `Game.openChest`
  and nowhere else, so every other grant path handed over an empty pouch. The
  replay found it: a run that threw a seed which did not exist, recorded
  perfectly deterministically, with every checker green.
- **`walk-dungeons.mjs` knows a snarl is a door.** Same exemption a puzzle door
  and a wheel door already had. Without it two thirds of d5 reads as stranded.
- **`replay.mjs` spans can claim what a TILE became** (`probeNames`). The whole
  point of `d5-overthrow` is to check the prover's reproduction of the seed's
  flight against the engine's own, and the only evidence that settles it is the
  name of the tile the seed came down on.

**What is GOOD about it, and it is the first dungeon of the five that can say
so.** D2, D3 and D4 all shipped with the same finding: the mechanic is legible
when it works and silent when it does not. The bole is not. It is a tree at LOW
and MID and open water at HIGH — a whole tile of art appearing and disappearing,
unmissable in a still frame, and the Standing Grove at 3,5 exists to show two
2x2 stands of them doing it before anything depends on it. A player who has
walked that room knows what a bole is.

**What is weak about it:**

- **Five groves, one fixture.** Four orientations and one double, and the
  engine argument above is why: any other arrangement of bole and snarl gives
  the room a second answer. It is honest and it is still repetitive.
- **The snarl is a bush.** It is the extracted bush in the dark-oak palette,
  which reads correctly as "cut this" and reads identically to every other bush
  in the game — including the ones a bomb DOES open.
- **Nobody has played it.** The replay proves the engine agrees with the model
  at one grove; the other four are a checker's word. And the replay does not cut
  a snarl, because a replay's equipment is fixed in its setup and the grove
  wants the Reefseed, the conch and the sword in two slots.

---

## D6 — the Abyssal Keep. DONE, and it closes P8.

26 rooms over two floors, the Dredge Line at room 13, three crossings, three
caches, `tools/check-dredge.mjs` (103 assertions) and the `d6-mooring` replay.

**The problem it had to solve, and it is the one the whole game had been
building toward: THE PLAYER OF THE SIXTH DUNGEON OWNS THE CLEATS, SO WATER IS A
ROAD.** Deep water stopped being a barrier in D3. A room here that says "you
cannot get over there" has to mean a PIT — the only thing left that neither
Cleat mode crosses and no sea level fills. That is the Cistern's own finding
restated, and it decided the shape of every crossing before a tile was placed.

**The answer, stated once:**

> THE LINE CROSSES WHAT THE SEA UNCOVERS, AND THE FLOOR GIVES UP ONLY WHAT THE
> SEA COVERS.

Three tiles decide whether a crossing can be made, and the tide moves all three
independently — the ground you brace on, everything between, and the post
itself. Two of them are built on:

* **the drowned stand, crossed at LOW** — a `3` (`dWell`) shelf is wading depth
  at LOW and over your head above it, and `ITEMS.dredge.use` now refuses while
  `inDeep || underwater`, so the only sea you can brace at is the only sea the
  room is crossed at.
* **the sunken bar, crossed at HIGH** — a `7` (`dLintel`) is the Keep's own
  masonry standing across a shaft, stone until HIGH covers it, and a cast stops
  dead on `F.SOLID`. The post is in plain sight from the doorway the whole time.

And the tide theme is the second half, which no earlier dungeon could have had:
**`DredgeLine.dragBack` searches a tile the weight passed over only if it
carries `F.WET | F.SLOW` at the level it resolves at.** A silted cache (`6`,
`dSilt`) on a dry pan is dragged straight over. Five dungeons have asked the
player to take the water OFF something; this is the only place in the game that
wants it ON.

**The reusable part, if anything ever needs it:** when the item's own guard is
what makes its geometry mean anything, ADD THE GUARD. The Bellows refuse from
the water, the Reefseed refuses from the water, and the Dredge Line now does
too — and without it the answer to every mooring in the Keep is to swim into the
middle of the shaft and cast from there, with no arrangement of ground able to
matter.

**What it cost elsewhere**, all five worth knowing:

- **`ITEMS.dredge.use` refuses while `inDeep || underwater`.** The guard above.
  It is the single change the whole dungeon rests on.
- **`walk-dungeons.mjs` can cast.** From the dungeon that hands the line over,
  a post within reach with nothing solid in front of it makes the tile before it
  passable. Without it the Keep's whole upper floor reads as stranded. The reach
  comes out of `feel.js`, and the dungeon index comes out of the map registry
  rather than being written down, so the fold needed no edit there.
- **`walk-dungeons.mjs` counts a `buried` key.** `room.buried` is the Dredge
  Line's own list and was invisible to every sweep in that file, so the Keep was
  walked believing it had three keys for four locks.
- **`essenceCount()` is new in `src/world/maps.js`**, because the HUD, the quest
  screen and the save slots all hard-coded `/8`.
- **`dPostAbyss`** is the shared mooring post over the Keep's own floor. The
  shared `dPost` names the BRICK floor in its `underArt`, so every post in an
  abyss room had been drawing a square of another dungeon's flagstones round its
  own feet — the same defect the urn had before P7.5 gave every theme one.

**What is GOOD about it.** The crossing is legible in a still frame, which is
the complaint D2, D3 and D4 all shipped with. `tools/shots/room-d6_1_2_3-tide1
-px80.png` and `-tide2-` are the same room one conch apart: at MID a slab of
grey masonry stands in the shaft, at HIGH it is a square of open water. Nothing
else in the room has moved. A player who has seen that knows what a lintel is,
the way a player who walked D5's Standing Grove knows what a bole is.

The prover also earned itself, unlike `check-lens.mjs`. It failed four things on
its first run: two decorative `q` posts inherited from the pre-P8 Keep (a `q` is
a SNAG and a snag is a crossing), a cache exactly within the Coilrope's reach of
the near bank, and a mooring whose closure clause was asking the wrong question.

**What is weak about it:**

- **Three crossings, two shapes.** The Drowned Stand and the Drowned Sill are
  the same shelf crossing on different axes; the Sunken Bar is the only lintel
  before the Crossed Shafts composes both. That is one shape more than D5 had
  and it is still not four.
- **The cache marker reads better dry than wet.** `dSiltDry` is dark grey rings
  on grey flagstone and `dSiltWet` is dark rings on light blue; the ring is
  visible at both seas, which is right, but it is *clearer* at the sea where it
  does nothing. What actually tells the player is the whole pan turning blue.
- **The Slack Water is the only room in the dungeon that teaches for free**, and
  `check-dredge` enforces that it holds nothing the dungeon needs — but nothing
  makes the player walk into it. It is one room east of the vault.
- **Nobody has played it.** The replay proves the engine agrees with the model
  at one crossing and one cache. The other two crossings and three caches are a
  checker's word.
- **Three enemies are registered and unplaced** after the fold. See above.

---

## What no dungeon has yet, and it is the same gap in all of them

- **Nobody has played one.** Every claim on this board is a checker's. The
  checkers prove a dungeon is completable and that its rooms mean what they say;
  they cannot say whether it is any good to walk through.
- **Five dungeons, five different fixtures, and no session has compared them.**
  D1 is a held patch, D2 a blind fork, D3 a torrent, D4 a drowned wheel, D5 a
  bole and a snarl. Each was designed against its own item and against nothing
  else, so nobody knows whether the Shrine is harder than the Cistern or whether
  the difficulty curve across the five goes the right way at all.
- **No dungeon has been balanced against another.** D1 and D2 both hand out one
  Piece of Heart or two and a fixed number of keys because that is what the
  constraint list asks for, not because anyone compared them.
- **The tide-gauge fixture and the fork's three-blues problem are open art
  jobs**, both in `docs/ART-BACKLOG.md`. The second one is a real legibility
  finding from D2 and it will recur in any dungeon whose answer is a shade of
  water — which is the argument for D5's bole, and the argument for reaching for
  a whole tile of art rather than a shade of blue next time the question comes
  up.
