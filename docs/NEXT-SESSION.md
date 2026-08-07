# Prompt for the next session

Paste the fenced block below into a fresh Claude Code session on this repo. It
is written to be self-contained: it names the branch, the remaining jobs, the
traps that are already paid for, and how to prove the work rather than assert
it.

Keep this file updated as work lands — it is the cheapest thing in the repo to
maintain and the most expensive thing to not have.

---

## What the last session did (P8 / D1: Tidewash Grotto re-authored)

**One dungeon only.** D1 is done to the P8 brief. D2-D6 are untouched and are
five more sessions, one each.

`src/data/dungeons-a.js`'s D1 block is rewritten end to end: **26 rooms across
2 floors** (was 21 across 1), and the whole north half is written against the
Tidewright's Anchor's one verb.

### The dungeon's grammar, which is the interesting part

At D1's moveset there are no Cleats, so deep water is a wall — and that turns
two of the indoor tide tiles into exact opposites:

| tile | LOW | MID | HIGH | passable at |
|---|---|---|---|---|
| `4` `dDrain` | pit | wadeable | deep | **MID only** |
| `3` `dWell` | wadeable | deep | deep | **LOW only** |
| `1` `dSluice` | dry | wadeable | deep | LOW or MID |
| `2` `dBasin` | dry | damp | wadeable | always |

A route that crosses a `4` band and then a `3` band cannot be walked at any
single tide level. Six rooms are built on that, in a fixed shape:

```
row k     GATE   '3' (or '4')  — passable only at the BASE level
row k+1   SHELF  '4' (or '3')  — passable only at the HELD level
row k+2   SHELF
row k+3   BANK   plain floor   — where you stand and throw
```

The patch is a square of radius `ANCHOR_RADIUS_TILES` (2), so an anchor laid on
the bank holds rows k+1..k+5 and leaves the gate to the conch. **That spacing is
the puzzle and it is load-bearing** — see the trap note in CLAUDE.md and in
HANDOFF. Two rooms run the polarity the other way (shelf `3` held at LOW, gate
`4` opened by raising the sea) and one runs the whole thing sideways, as
columns rather than rows.

### `tools/check-anchor.mjs` is new and is what makes the claim honest

A room declares `anchorGate: { from: [x,y], to: [x,y] }` and the tool proves
both halves in-engine:

1. **No single tide level opens it.** The room is flooded from `from` to `to` at
   a uniform LOW, MID and HIGH, and all three must fail. This is the design rule
   in the execution plan — "if a room's puzzle would still work at a fixed tide
   level, it is the wrong puzzle" — restated as an assertion.
2. **Some anchor placement does.** The throw is modelled the way the item
   behaves: walk the room at a uniform held level, throw cardinally up to four
   tiles over anything that is not a wall, hold a radius-2 square, then set a
   *different* base — and the tile you threw from has to still be standable
   under the resulting field, because `Anchor.land` refuses a bite that strands
   its thrower rather than surviving it.

13/13 across the six gated rooms. It reads both radii out of `feel.js` rather
than writing them down, so it moves when the constant moves.

### The route, and where things sit

```
0,3,7 entrance -> 3,6 (the conch: the floor is water, let it out)
 -> 3,5 hub -> 2,5 Dungeon Map -> 2,4 Crab Pit (Small Key 1)
 -> 4,5 CHARTSTONE -> 4,4 Switch Room (Small Key 2)
 -> 3,4 Tide Gallery: locked door north, stairs down to the Undercroft
 -> 1F 3,4 landing -> 1F 2,4 / 4,4 -> 1F 3,3 locked -> 1F 3,2 BIG CHEST: the
    TIDEWRIGHT'S ANCHOR (room 13 of 26 — halfway, as the brief asks)
 -> back up through 3,4's locked door -> 3,3 Held Water  [gate 1]
 -> 4,3 Shell Corridor [gate 2] -> 5,3 Barnacle Bend [gate 3]
 -> 5,2 CLAWCRAB, the miniboss (room 17 of 26 — two thirds)
 -> 2,3 Weeping Wall [gate 4] -> 1,3 Cistern Corner (Small Key 3) [gate 5]
 -> 1,2 Old Sluice -> 2,2 Drip Passage -> 2,1 North Cell [gate 6]
 -> 4,2 Anchorage: locked door -> BOSS KEY -> 4,1
 -> 3,2 Storm Gate -> boss door -> 3,1 Gohmaraq -> Heart Container, essence 1
```

Three Small Keys, three locked doors, one Boss Key, one Chartstone, one
miniboss, one Heart Container from `onEvent('bossDead')`, essence index 1.

### Two long-standing bugs closed on the way

- **The Compass was uncollectable and now the Chartstone is not.** A chest
  spawns its prize one tile above itself with no standability check, and a pot
  sat on that tile. The pots moved below the chest; `d1-descent` now records
  `chartstone: true`.
- **`0,3,4`'s enemies are gone**, because a chasable enemy and a stairs warp in
  the same open room is a trapdoor — the replay actor chased a crab down the
  stairs and recorded eleven directives in the wrong floor.

### `d1-descent` was re-recorded and the route is new

5721 frames, 25 kills, the Dungeon Map, the Chartstone *collected*, a full conch
cycle, a Small Key earned in the Crab Pit and spent on the Tide Gallery's door,
ending in Held Water. It still is not a full clear and the name still says so —
it now stops exactly where the dungeon stops being walkable without an anchor,
which is a better place to stop than the old arbitrary one. Teaching the actor
to throw and recall an anchor is the single change that would extend it.

### What is weak about it

- **Nobody has played it.** Four rooms were screenshotted at two tide levels and
  they read well — the shelf and the gate are plainly different water — but no
  human has thrown an anchor in any of these rooms. `check-anchor.mjs` proves a
  placement exists; it does not prove one is *findable*, and there is still no
  in-world signal for where the held patch ends (see the P5 notes below).
- **The six gate rooms share one shape.** Three variations on it — polarity
  flipped, turned ninety degrees, bank-in-the-doorway — but a player will see
  the trick once and then recognise it. A second anchor idiom would be worth
  more to this dungeon than a seventh room of the first one.
- **The Undercroft is thin.** Five rooms, conch-only, and two of them are side
  cells with a pickup. It exists to put the Anchor halfway through and to give
  the grotto a second floor; it does not have an idea of its own.
- **The miniboss does not require the Anchor**, and neither does Gohmaraq. Both
  are the fights P5/P6 left; the chain sweep is *available* in them and the
  boss room still suppresses the conch, but nothing in either fight is written
  against the item. That is the biggest gap against "every room after it
  requires the verb".
- **`heartPiece` count.** The Clawcrab now drops one and Held Water holds one,
  so D1 alone hands out two of the four a container is worth. P9 re-tunes the
  heart economy and should re-count these.
- **The two removed dungeons' rooms have not been folded anywhere.** The brief
  says the game is six dungeons; d7 and d8 still exist in the data and D1 is not
  their neighbour, so that fold belongs to whichever session re-authors D5/D6.

---

## What the session before that did (P6: the item roster)

`docs/ITEMS.md` is new and is the authoritative roster. Nine items in, ten out,
one commit each, every checker run between them.

**Added.** Brineglass Lens, Kelp-Soled Cleats, Squall Bellows, Reefseed, Dredge
Line, Resonance Rod, Ferryman's Coin, Chartstone, Bottled Tide. Each has an
entry in `src/game/items.js`, a hand-drawn icon in `src/data/sprites-gear.js`,
a HUD icon, a desc, constants in `feel.js` tagged `guessed` with units, and one
overworld use and one dungeon use. `docs/ITEMS.md` names all three verbs for
each, and says out loud where one is missing.

**Removed.** `feather`, `bracelet`, `boomerang`, `hookshot`, `magnet`,
`shovel`, `satchel` and all five seeds, `slingshot`, `flippers`, `ringbox`. The
registry is now `sword shield conch bombs map` plus the ten roster items, and
`tools/check-items.mjs` asserts exactly that.

**`tools/check-items.mjs` is new and is the interesting part.** 78 assertions
that press each item's button in-engine and check what it did. It exists
because nothing else could see an item at all: `validate` reads room data,
`walk-dungeons` walks tiles, and neither runs a button press. It caught six
real defects during the session, listed in HANDOFF — including a chest that
went on granting a deleted item in complete silence, and two edits that deleted
items nobody meant to touch.

### P5 IS MERGED IN. The tide is a field and the Anchor is obtainable.

`src/game/tidelocal.js` is gone — it existed only to carry the Squall Bellows
until P5 landed, and it did. What survived the collapse:

- The Bellows' cone is an ordinary entry in `tide.overrides`, with a `'cone'`
  footprint in `Tide.covers` and a `delta` alternative to the absolute `level`
  in `Tide.levelAt`. **The delta is load-bearing**: the Anchor is absolute
  because it is holding out against the conch, the Bellows is relative because
  it holds the water back one step from wherever the conch has it. Do not
  collapse the two into one number.
- Because the cone is a real override, `Room.render` draws the drained wedge
  through the field and the stamp invalidates the cache. There is no second
  draw path.
- `Tide.viewAt(base)` is a read-only view of the field at another base level.
  The Brineglass Lens renders through it so an anchored patch previews as the
  one part of the room that will NOT change when the tide does.
- `Room.renderAt` is keyed by `cacheKeyFor`, the same function `render` uses.
  Keying it on the raw argument would cache a field render under
  `"[object Object]"` and draw stale water for ever, silently.

**The Tidewright's Anchor is in D1's big chest.** P5 built it and left placement
alone; P6 had reserved the slot for it; the merge closed that.

### Two verbs are base moveset now

- **The hop.** Not on a button — walking into a one-tile gap hops it, reusing
  `ledgeHop`'s arc. `GAP_HOP_MAX_SPAN` decides the width and
  `check-overworld`'s flood reads that constant.
- **The lift.** On the context button. **A is context-first**, so standing next
  to a pot with an item bound to A means the pot comes up; `test.mjs` had to
  turn Link around before its conch section for exactly this.

### The overworld gates moved

| Gate | Was | Is |
|---|---|---|
| Salt Pans | Magic Boomerang | **Resonance Rod**, and its range doubles at HIGH — the only gate whose key is the core mechanic. Both halves asserted in `check-gates`. |
| Abyssal approach | Magnetic Gloves | **Dredge Line** |
| Cliffs of Kell | Power Bracelet | **Dredge Line** (the boulder is `liftLevel: 2`, past bare hands) |
| Coral Reef | Roc's Feather | **nothing**, on purpose. P9 re-gates. |

### What is weak about it

- **Nobody has watched any of this in motion.** Every claim above is from
  checkers. The Lens overlay, the sink-mode palette, the gust cone's redraw and
  the coral pillar's growth are all things whose whole point is how they LOOK,
  and none has been seen on screen.
- **Every new constant in `feel.js` is `guessed`, and cannot be otherwise** —
  none of these items exists in the source games, so `measured` is not
  available even in principle. `BELLOWS_RANGE`, `ROD_LOCK_FRAMES`,
  `REEFSEED_GROW_FRAMES` and `CLEATS_BREATH_FRAMES` are the four most likely to
  be wrong, because they are the four the player waits on.
- **Item placement is minimum-churn, not designed.** Each new item sits where
  the item it displaced sat, so every dungeon's key economy survived P6
  untouched. P8 re-authors all six dungeons and will move them.
- **The Reefseed's coral, the grates and the riptides reuse existing tile art**
  in new palettes rather than being drawn. That is the `grassDark` pattern and
  it is deliberate, but it means three mechanics are told apart by their flags
  and not by their drawing. Worth a screenshot pass.
- **`src/game/rings.js` and the menu's ring tab are still standing.** The Ring
  Box is gone from the registry but the system it fed is P7's to delete, because
  removing it means changing the save format.
- **The Cleats' sink mode does not change WHERE you can go, only how.** The
  brief asked for the behavioural difference (speed, currents, knockback, sword,
  carry, breath) and that is all implemented; a genuinely separate seafloor
  ROUTE layer — tiles that block the surface and not the floor — is not.

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
## What the last session did (P5: the tide became a field, and the Anchor)

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
  docs/EXECUTION-PLAN.md - the roadmap. P0-P6 are done and merged, and P8's
                           first dungeon (D1 Tidewash Grotto) is done. P7
                           (scrimshaw), PT (towns) and P7.5/P7.6 are open and
                           independent; P8 D2-D6 are five more sessions, one
                           dungeon each. NOTE P7.5 and P7.6 have NOT landed, so
                           the P8 amendment about dungeon tilesets and
                           multi-screen rooms could not be honoured for D1 —
                           every room is still 1x1 and the shared dungeon
                           legend.
  docs/ITEMS.md          - the item roster. Authoritative. tools/check-items.mjs
                           asserts the registry is exactly this document.
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
                                               about fx_slash_d0/fx_slash_d1)
  node tools/test.mjs                          57/57, 0 unauthored art names
  node tools/replay.mjs                        12/12, all three replays to the
                                               pixel (the third walks a room
                                               that is MID in one half and HIGH
                                               in the other)
  node tools/walk-dungeons.mjs                 28/28, 88 ledge runs
  node tools/check-overworld.mjs               17/17, three tile gates, the base
                                               hop modelled against
                                               GAP_HOP_MAX_SPAN, and the honest
                                               FIELD flood (a conch sets ONE
                                               level and you must survive the
                                               change where you stand)
  node tools/check-gates.mjs                   15/15, three item gates in-engine
                                               and the base hop (the ONLY
                                               harness that hops — see the
                                               jump-reach note below)
  node tools/check-items.mjs                   78/78, every item's verbs proved
                                               in-engine, and the registry
                                               matched against docs/ITEMS.md
  node tools/check-motion.mjs                   8/8, enemies on the 8px lattice
  node tools/test.mjs                          55/55, 0 unauthored art names
  node tools/replay.mjs                        12/12, all THREE replays to the
                                               pixel
  node tools/walk-dungeons.mjs                 28/28, 88 ledge runs
  node tools/check-overworld.mjs               19/19, all gates, plus the field
                                               flood (~30s of its runtime)
  node tools/check-gates.mjs                   15/15, both item gates in-engine
                                               (the ONLY harness that jumps —
                                               see the jump-reach note below)
  node tools/solve-switches.mjs                16 rooms, one push per block
  node tools/check-anchor.mjs                  13/13 — D1's six anchor gates are
                                               shut at all three tide levels and
                                               opened by a modelled throw
  python3 tools/rip-terrain.py                 regenerates tiles-terrain.js
                                               BYTE-IDENTICAL; if it does not,
                                               someone hand-edited a generated
                                               file. --scan <ow|dg> x0 y0 x1 y1
                                               finds seamless tiles in a region.
  node tools/scan-sprites.mjs --strict         0 hard findings
  npm run build                                48 modules -> one HTML file
  node tools/check-build.mjs                   the built file boots from file://

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

NEXT UP: P8 DUNGEON 2 (Coral Spire). D1 is done — read the D1 section at the
top of this file first, especially the anchor gate/shelf/bank spacing and
tools/check-anchor.mjs, because every later dungeon inherits the Anchor and can
reuse both. P7 (scrimshaw), PT (towns), P7.5/P7.6 and P9 are all still open.
P1-P6 are in.

TWO PARAGRAPHS OF THE P8 PROMPT ARE CURRENTLY UNCASHABLE, AND THEY ARE THE TWO
MOST LIKELY TO BE PLANNED AROUND BEFORE ANYONE CHECKS:

  "Rooms may now be 1x1, 2x1, 1x2, 2x2 or 3x1 screens. Use the larger sizes
   deliberately, not decoratively: a multi-screen room should exist because the
   puzzle or the fight needs the space, and a dungeon where every room is 2x2
   reads as flat as one where every room is 1x1. Reference the map rips in
   assets/sheets/ for how Seasons paces this — most rooms are one screen, and
   the large ones land on set pieces.

   Use the tilesets from P7.5 for this dungeon's visual identity. Each of the
   six dungeons should be identifiable from a single screenshot."

NEITHER IS BUILT YET. P7.6 has not landed: src/world/room.js is hard-coded to
one 10x8 screen per room, there is no {sw, sh}, and the camera does not follow
inside a room — every seam is a transition. P7.5 has not landed either: there is
no tools/rip-dungeon-maps.py and none of the four Seasons dungeon map rips are
in assets/sheets/, so `dungeon` is the only indoor legend there is and all six
dungeons share it. Verify both yourself in thirty seconds rather than trusting
this paragraph, which rots the moment either lands.

If they are still missing when you take D2: author against what exists and say
so, do NOT build P7.5 or P7.6 on the way. Each is its own session and doing one
inside a dungeon session gets a bad version of both. D1 was taken under exactly
this constraint and is 1x1 rooms in the shared legend throughout — so if you
would rather have the dungeons look distinct, the cheaper order is to take
P7.5 and P7.6 NEXT, before any more dungeons are authored, and revisit D1 once
with the other five.

P5 IS MERGED. This branch carries both the tide field and the item roster, and
every checker is green across the pair. Nothing about the tide is outstanding.

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

NEXT UP: P6, the item roster, in docs/EXECUTION-PLAN.md. It is unblocked now
and P5 existed to unblock it — every remaining item assumes `levelAt`. Note the
Tidewright's Anchor is ALREADY DONE and must not be re-implemented; it does
need a chest to come out of, which belongs to D1 in P8.

BEFORE P6, IF YOU CAN: settle ANCHOR_RADIUS_TILES by playing it. Give yourself
the anchor, go to overworld 0,10,0 (Tide Steps), and throw it at each setting
KeyU offers, with KeyO on to see the patch outlined and KeyY to try the disc.
It is a design constant with nothing to measure against, so it needs a person,
and everything in P6 and P8 gets built on top of whatever it ends up being.

P4 (grid-lock enemy motion) and P2 (the intermittent test) are still open and
independent. P4 is the higher-value of the two and P3 left it set up: enemy
positions are already on the 8.8 grid, so "a direction change may only happen
at an 8px boundary" is a test you can write, and moveDir is the single funnel
every ground AI goes through. P4 also inherits the two knockback decays and
ENEMY_TURN_CHANCE, which FEEL-SPEC still flags as wrong on purpose.

Do the work yourself rather than spawning subagents - past sessions hit usage
limits that way and lost the work.

Tell me plainly what is done, what is weak, and what you skipped.
```

---

## What is already done — do not redo any of this

- engine, renderer, tide system, save/load, menus, cutscene runner
- the 120-screen overworld and all 8 dungeons (303 rooms, all solvable)
- 56 enemy sprites and a 22-type enemy roster
- all 16 boss and miniboss fights (`src/data/bosses.js`), verified beatable
- every effect, pickup, object, projectile and item icon
- the whole story: 20 dialogue ids, 15 cutscenes, all verified to terminate
- all 49 boss and miniboss sprites; `scan-sprites --strict` is 0 hard findings
- music: 22 tracks (14 looping + 8 jingles), every name resolves
- one-way ledges in all four cardinals: 88 runs, all verified in-engine
- all three tile-expressible region gates, proved in both directions
- **the single-file build.** `npm run build` flattens `index.html` plus every
  module reachable from `src/main.js` into `dist/oracle-of-tides.html` — one
  classic `<script>`, playable from a `file://` URL with no server and no
  network. That file is committed and must be rebuilt at the end of every
  session. `tools/check-build.mjs` boots it from a real `file://` URL and fails
  on a console error, an off-document request, a black canvas or a frozen
  `game.frame`.
- **the feel spec, the seeded RNG and the replay harness (P1)**
- **8.8 fixed-point positions, un-normalised diagonals, a re-derived walk speed
  and the sword-hold state (P3)**
- **a deterministic `test.mjs` (P2)** — it takes the clock off the wall-clock
  loop and pins the save seed, so it no longer flakes under load
- **grid-locked enemy motion and scripted knockback (P4)**
- **the item roster (P6)** — `docs/ITEMS.md`, nine items added and ten removed,
  plus `tools/check-items.mjs`, which proves each item's verbs in-engine and
  asserts the registry is exactly that document's roster
- **the tide as a field and the Tidewright's Anchor (P5)**, merged into P6 —
  `tide.levelAt(tx, ty, room)`, room-scoped overrides, a render cache keyed on
  the field's stamp, and the checkers reasoning over the field rather than a
  scalar

## What is left

P5 (if it has not landed in parallel), then P7, P8 and P9 in
`docs/EXECUTION-PLAN.md`. Plus, carried over:
- **the tide as a field, and the Tidewright's Anchor (P5).** `tide.levelAt`,
  room-scoped overrides, the checkers reasoning over the field, and a replay
  proving one room at two levels at once. The Anchor still needs a chest to
  come out of — that is D1's job in P8.

## What is left

P6, then PT, then P7 through P9 in `docs/EXECUTION-PLAN.md`. P2 and P4 are open
and independent of that spine.

**PT (towns, buildings and terrain polish) is a stated top design priority.**
Thalassia's villages are a name on a signpost and a few doors cut into a cliff;
the Oracles' towns read as places people live, and that is most of what makes
their overworld feel like a world. The tileset that does it has been in the repo
all along — `assets/sheets/oracle-seasons-tileset-subrosia.png`, the only true
tileset here — and only the tree has ever been taken off it. Its town kit is
inventoried with cell coordinates in `assets/sheets/README.md`: three roof
colours, a signed SHOP front, doors, an enterable dark doorway, windows, crates,
barrels, a stone well, a fence run, stumps, repeated per season. Read PT before
touching it; the first job is generalising the tree's `quad:` machinery, because
a building is 3 wide and 2-3 tall and cutting one into nine loose tiles is the
wrong answer.

Plus, carried over:

   `tree` is the big one and it is a **content** decision, not an art one:
   Ages trees are 32x32, four cells (worked example at AG 50,936), and the game
   spends one tile on a tree. Taking them means re-cutting every overworld room
   grid that has a tree in it.
2. **Water is still hand-drawn**, and unlike the props this one really is
   blocked: both terrain sheets are assembled static maps, so there is no
   second animation frame on them to extract. It needs a sheet that has one.
3. **A full-D1-clear replay**, per the section above.
4. **A checker for chests whose pickup lands on a solid tile** — see the
   Compass bug in HANDOFF. (`tools/check-items.mjs` now proves a chest names a
   REAL item; it does not yet prove the pickup lands somewhere collectable.)
5. **Nobody has watched P6's items in motion.** The Lens overlay, sink mode's
   palette, the gust cone's redraw and the coral pillar's growth are all things
   whose point is how they look, and all are green from checkers only.
1. **Settle `ANCHOR_RADIUS_TILES` by playing it.** See the P5 section above and
   `docs/FEEL-SPEC.md`. Cheap, needs a human, and everything after it is built
   on the answer.

2. **Give the Anchor a chest.** It exists and works; nothing in the world hands
   it over. Belongs to D1 in P8.

3. **The overworld terrain that is still hand-drawn** — this is PT's item 5, and
   the list below is the ranking it refers to. Twelve tiles are
   extracted now (ten ground, two props). Thirty distinct art blocks are not,
   though most are palette-swap variants that one extraction would cover. In
   rough order of value:

   - **the `cliff` family** — one extraction covers eight tiles (`cliff`,
     `cliffDk`, `cliffSand`, `cliffRust`, `cliffCoral`, `cliffMarble`,
     `cliffAbyss`, `stairsDown`) and cliffs are on most screens. NOT a simple
     swap: the Oracles build a cliff from several tiles (face, lit top, corner)
     and this game spends one tile on all of it, so it is the same shape of
     content decision the 32x32 trees were. Read the tree QUADS machinery first.
   - **the `ledge` families** — four directions, nine palette variants each.
   - `palm`, `pot`, `sign`, `dBlock`, `dStairs`, `spikes`, `caveMouth`.

   `python3 tools/rip-terrain.py --scan <ow|dg|ag|sb|sp> x0 y0 x1 y1` finds
   seamless ground; `--props <sheet> px py x0 y0 x1 y1 out.png` writes a contact
   sheet of candidate props. **Open the PNG and look at it** — the flowers pick
   went through three contact sheets before a cell that was actually floral and
   actually four colours turned up.

4. **Water is still hand-drawn**, and this one really is blocked: every terrain
   sheet in the repo is an assembled static map, so there is no second animation
   frame to extract. It needs a sheet that has one.

5. **A full-D1-clear replay** — see the P1 section above for the three verbs the
   recording actor is missing.

6. **A checker for chests whose pickup lands on a solid tile** — see the Compass
   bug in HANDOFF.

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
- Deleting an entry from `ITEMS` by slicing between banner comments takes its
  neighbours with it. Match the whole entry, brace-counted.

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
