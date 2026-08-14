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
| 5 | `d5` | Drowned Wood Shrine | Reefseed | **DONE** | `PENDING-D5` |
| 6 | `d6` | Salt Pan Vault | *see the consolidation below* | **TO DO — next** | — |
| — | `d7` | Reef Palace | Kelp-Soled Cleats L2 | TO DO — fold in | — |
| — | `d8` | Abyssal Keep | Dredge Line | TO DO — fold in | — |

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

## D6, and the consolidation that is still owed

**The plan says six dungeons and the data holds eight.** `d7` (Reef Palace) and
`d8` (Abyssal Keep) are pre-P8 dungeons that the six-dungeon plan folds into
their neighbours — their best rooms move, they are not deleted. Two consequences
a session will trip over:

- **`d6`'s item does not match the plan.** `docs/ITEMS.md` gives D6 as the
  Abyssal Keep holding the Dredge Line; the data has `d6` as the Salt Pan Vault
  holding the Bottled Tide, and the Dredge Line sitting in `d8`. Whoever takes
  D6 owns reconciling that, and it is a design decision before it is an edit.
- **`d7` hands out `cleats` at level 2**, so it is downstream of D3 whatever
  else happens to it.

None of D1-D5 needed the consolidation and none of them did it. **D6 is that
session**, and it should be recorded here when it happens.

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

## D6 — Salt Pan Vault. The next action item, and it is two jobs.

**What is there today:** the pre-P8 `d6`, 24 rooms over two floors, unaudited
against the constraint list, no room declaring it needs its item, no prover.

**Job one is a design decision and it is owed before any room is drawn.**
`docs/ITEMS.md` gives D6 as the Abyssal Keep holding the Dredge Line; the data
has `d6` as the Salt Pan Vault holding the Bottled Tide, and the Dredge Line
sitting in `d8`. Whoever takes D6 owns reconciling that. It is also the session
that owes the six-versus-eight consolidation above: `d7`'s and `d8`'s best rooms
move into their neighbours, they are not deleted, and `d7` hands out `cleats` at
level 2 so it is downstream of D3 whatever happens to it.

**Job two, and the problem to expect.** Whichever item it ends up being, ask the
same question the last three dungeons each had to answer in their own way: what
is the axis INSIDE the item, and can it be decided in arithmetic? D3 found it in
a tile's `push` against `SWIM_SPEED`. D4 found it in the cone's `delta: -1`
against a wheel's `drowned`. D5 found it in `canPlant`'s refusal of SOLID at
every level, and in the two tiles a throw carries. Write the prover first, and
write it against the constant rather than against a number copied out of it.

If it is the Bottled Tide: `Game.bottleTide` fires `roomEvent('bottle', {level})`
and the bottle stores a sea rather than a place, which is the inverse of the
Anchor and probably the axis. If it is the Dredge Line: `F.SNAG` and `F.HEAVY`
are already declared by tiles rather than discovered, so the checker has the
vocabulary it needs on day one.

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
