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
| 3 | `d3` | Bogwater Sanctum | Kelp-Soled Cleats | **TO DO — next** | — |
| 4 | `d4` | Cliffside Cistern | Squall Bellows | TO DO | — |
| 5 | `d5` | Drowned Wood Shrine | Reefseed | TO DO | — |
| 6 | `d6` | Salt Pan Vault | *see the consolidation below* | TO DO | — |
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

## D3 — Bogwater Sanctum, and the Kelp-Soled Cleats. The next action item.

**What is there today:** 18 rooms, one floor, pre-P8 content. It is under the
22-room floor, no room declares that it needs the Cleats, and there is no
prover. Treat it the way D1 and D2 were treated — re-author it, do not decorate
it.

**The problem this one has to solve, because each item has had its own.** D1's
Anchor did not FIT (the patch is 5x5 in a 10x8 room). D2's Lens could not be
REQUIRED by terrain at all (it only shows you things). D3's Cleats introduce
**swimming**, and swimming is the first item that makes the world BIGGER rather
than different: every deep-water tile in the game becomes floor.

- **Both existing provers say in their own headers that they cannot swim.**
  `check-anchor.mjs` and `check-lens.mjs` each model deep water as a wall, which
  is sound only before this dungeon. `check-anchor.mjs` already asserts that no
  room outside `d1`/`d2` declares an anchor gate, so the first D3 room that
  tries will fail out loud rather than quietly prove nothing. **Teaching a
  prover to swim is part of the D3 session, not an extra**, and it is the first
  thing to do, before the rooms.
- **Every room in the game that is currently gated by deep water stops being
  gated** the moment the player owns the Cleats. That is a whole-world change,
  not a dungeon-local one, so `check-overworld.mjs` is part of this session's
  verification and not a formality.
- The item table gives D3's tide theme as "surface route vs. seafloor route" —
  two rooms in one, layered rather than adjacent. If a D3 room's puzzle would
  work with the water at a fixed level, it is the wrong puzzle.

## D4-D6, and the consolidation that is still owed

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

Neither D1 nor D2 needed the consolidation and neither did it. It belongs to
whichever session reaches D6, and it should be recorded here when it happens.

---

## What no dungeon has yet, and it is the same gap in all of them

- **Nobody has played one.** Every claim on this board is a checker's. The
  checkers prove a dungeon is completable and that its rooms mean what they say;
  they cannot say whether it is any good to walk through.
- **No dungeon has been balanced against another.** D1 and D2 both hand out one
  Piece of Heart or two and a fixed number of keys because that is what the
  constraint list asks for, not because anyone compared them.
- **The tide-gauge fixture and the fork's three-blues problem are open art
  jobs**, both in `docs/ART-BACKLOG.md`. The second one is a real legibility
  finding from D2 and it will recur in any dungeon whose answer is a shade of
  water.
