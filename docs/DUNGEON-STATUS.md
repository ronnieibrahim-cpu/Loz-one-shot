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
| 4 | `d4` | Cliffside Cistern | Squall Bellows | **TO DO — next** | — |
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

## D4 — Cliffside Cistern, and the Squall Bellows. The next action item.

**What is there today:** 18 rooms, one floor, pre-P8 content, under the 22-room
floor, no room declaring it needs the Bellows, no prover.

**The problem to expect.** The Bellows hold the tide back one level, in a cone,
in front of you, WHILE YOU HOLD THE BUTTON. So it is the Anchor's problem
turned inside out: the Anchor's held patch persists and can be walked away from,
and the Bellows' does not — the water comes back the moment you let go, and you
cannot be in two places at once. A room that is crossed by holding the button
and walking is not a Bellows room; a room where the thing you free has to act
while you stand still holding it, is. Write `check-bellows.mjs` before the rooms
and make it model the cone travelling with the player.

Note also that `Player` already surfaces the hard part: `bellowsOpen` blocks
the item while `inDeep || underwater`, so a Bellows room may not be flooded in
the way a Sanctum room is.

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
