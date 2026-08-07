# Prompt for the next session

Paste the fenced block below into a fresh Claude Code session on this repo. It
is written to be self-contained: it names the branch, the remaining jobs, the
traps that are already paid for, and how to prove the work rather than assert
it.

Keep this file updated as work lands — it is the cheapest thing in the repo to
maintain and the most expensive thing to not have.

---

## What the last session did (P7: scrimshaw, plus P7.5 and P7.6)

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
this session wrote `docs/briefs/P7.6-PLAN.md` and stopped. **The plan needs
approval before the next session executes it.**

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
  docs/EXECUTION-PLAN.md - the roadmap. P0-P7 are done. P7.5 is BLOCKED on
                           four missing dungeon map rips (see ART-BACKLOG.md);
                           P7.6 is PLANNED and awaiting approval in
                           docs/briefs/P7.6-PLAN.md. PT (towns) is independent
                           and can be taken whenever a session wants content.
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
  node tools/replay.mjs                        12/12, all three replays to the
                                               pixel
  node tools/walk-dungeons.mjs                 28/28
  node tools/check-overworld.mjs               17/17 (the field flood is ~30s
                                               of its runtime)
  node tools/check-gates.mjs                   15/15 (pins ?seed= and owns the
                                               clock since the flake below)
  node tools/check-items.mjs                   78/78
  node tools/check-charms.mjs                  60/60, every charm proved
                                               in-engine and no charm orphaned
  node tools/check-motion.mjs                   8/8
  node tools/solve-switches.mjs                17 rooms, one push per block
  node tools/check-tilesets.mjs                 6/6 (needs Pillow; it SKIPS
                                               with exit 2 rather than passing
                                               quietly if Pillow is missing)
  python3 tools/rip-terrain.py                 regenerates tiles-terrain.js
                                               BYTE-IDENTICAL; if it does not,
                                               someone hand-edited a generated
                                               file. Same for rip-hud.py and
                                               `rip-dungeon-maps.py --verify`.
  node tools/scan-sprites.mjs --strict         0 hard findings
  npm run build                                49 modules -> one HTML file
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

NEXT UP, and pick ONE:
  - P7.6, multi-screen dungeon rooms. The plan is written and needs your
    approval first: docs/briefs/P7.6-PLAN.md. Highest value of the three,
    because P8 is much better with it than without it.
  - PT, towns and buildings. Independent of everything, stated top design
    priority, and the only one that needs no decision from anybody.
  - P8, the six dungeon sessions. Better after P7.6.
  - P7.5's remainder is BLOCKED: it needs four dungeon map rips that are not
    in this repo. Do not start it by inventing the colour-register decision.

SCRIMSHAW IS IN AND THE RING SYSTEM IS GONE. `game.charm(id)` replaced
`hasRing`. A charm is live only while the tide UNDER THE PLAYER'S FEET matches
its case — `tideAt(game, player)`, never `tide.level` — so an anchored patch
keeps its charms alive. If you add a charm, something in src/ outside
scrimshaw.js must READ it, or check-charms fails you.

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
- **the eight dungeon themes (P7.5 step 8)** — `tools/rip-dungeon-themes.py`
  plus a themed legend per dungeon. Every dungeon is now identifiable from one
  screenshot, and no room grid changed to do it.

## P7.6 — where it actually is

**Live and playable.** A room has a size; the camera follows with a deadzone
and clamps; everything draws through it; exits fire at the room's edge; the
minimap spans. `d1` room `0,1,3` is a 1x2 and is the first room in the game
bigger than the screen.

**Not done, in the order the plan wants them:**

1. **The boss/enemy/projectile arena audit (step 8), BEFORE any boss room grows.**
   Known offenders, found by grep and not yet fixed:
   `src/game/enemy.js` clamps a repositioning enemy to `VIEW_W/VIEW_H`, and
   `src/game/projectile.js` removes a shot that leaves `VIEW_W/VIEW_H`. In a
   wide room both mean "the first screen", so a projectile dies at an invisible
   line mid-room and a teleporting enemy lands back in the first screen. Neither
   is reachable today because no converted room has enemies past the seam — the
   1x2's second crab is inside the first screen's width. **Fix these before
   converting anything with a fight in the far half.**
2. **A 2x1 and a 2x2.** `d1` `0,5,3` can grow east into empty (6,3);
   `0,5,2` (the Clawcrab Den) can too, but it is a miniboss room and belongs
   after step 8. A D2 2x2 hub has not been surveyed.
3. **A recorded replay** through the wide room. `check-wide-rooms.mjs` proves
   the behaviour; a replay would pin the pixels.
4. **The camera constants want a human.** `CAM_DEADZONE_W/H` and
   `CAM_MAX_SPEED` are `guessed`. KeyC draws the deadzone box. See FEEL-SPEC —
   a reference EXISTS, in Poison Moth's Lair and Ancient Ruins.

**One trap this session paid for twice:** a checker that cannot fail reads as
evidence. Two of `check-wide-rooms.mjs`'s assertions passed against a
deliberately broken engine on their first cut — one because the camera was
clamped rather than held by the deadzone, one because nothing lay beyond the
room's span in either direction. Both were rewritten until breaking the engine
broke the test. Do that for every assertion here; the camera is exactly the
kind of feature whose tests pass for the wrong reason.

## OPEN DESIGN QUESTION for P8 — the Anchor in a large room

**Not settled, and deliberately not settled by P7.6.** Recording it so it is
decided with rooms in front of you rather than in the abstract.

The Tidewright's Anchor freezes a patch of the tide field at a fixed radius.
`ANCHOR_RADIUS_TILES = 2` makes a disc of 13 tiles. In a 10x8 room that is 16%
of the floor and it splits the space in two, which is the puzzle. In a 3x1 room
it is about 5%, and it splits nothing — it becomes a small local convenience
instead of a decision about the room.

Three options, none chosen:

1. **Large rooms do not use the Anchor.** Cheapest, and honest: not every item
   has to work in every room. Costs a verb in exactly the rooms with the space
   to use it.
2. **The radius scales with room size.** Keeps the item's meaning constant as a
   FRACTION of the room. But the radius is a number the player has learned by
   sight, and an item that covers a different amount of ground depending on
   where you stand is one you cannot plan with.
3. **Large rooms permit two anchors at once.** The most interesting, and the
   most expensive: `check-overworld`'s field flood is already 2.9M states and
   ~30s of its runtime, and NEXT-SESSION has flagged since P5 that it will not
   survive being asked for two anchors.

**Do not change the engine for this during P7.6.** P7.6's own note records that
the anchor's disc not growing is a design consequence the brief WANTED, and the
P5 strand checks must keep asserting "the anchor cannot strand you" over the
larger room without compensating by scaling the radius.

## What is left

1. **P7.6 — multi-screen dungeon rooms.** PLANNED, NOT BUILT, awaiting your
   approval: `docs/briefs/P7.6-PLAN.md`. Do the plan, not a fresh design.

2. **PT — towns, buildings and terrain polish.** A stated top design priority,
   independent of the systems spine, and blocked on nothing. Thalassia's
   villages are a signpost and a few doors in a cliff. The tileset that fixes
   it has been in the repo all along —
   `assets/sheets/oracle-seasons-tileset-subrosia.png`, the only true tileset
   here, and the one sheet that is 99% raw-register colours. Its town kit is
   inventoried with cell coordinates in `assets/sheets/README.md`. The first
   job is generalising the tree's `quad:` machinery, because a building is 3
   wide and 2-3 tall and cutting one into nine loose tiles is the wrong answer.

3. **P7.5's remainder — BLOCKED ON ASSETS.** Four dungeon map rips are missing.
   See `docs/ART-BACKLOG.md`. The colour-register decision is explicitly yours,
   not a session's.

4. **P8 and P9.** Better after P7.6.

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
  a jump.
- **A checker for chests whose pickup lands on a solid tile.**

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
