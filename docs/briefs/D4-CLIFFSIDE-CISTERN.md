# D4 — the Cliffside Cistern, grown to three floors (S183 design; NOT BUILT)

**Status (S183): designed and mocked, shown to the human, awaiting approval.
Nothing in `src/` has changed.** Written against
docs/briefs/DUNGEON-DESIGN-LANGUAGE.md; read that first.

Pictures, all in `d4-mock/`:

- `d4-plan.png` — all three floors, what is kept, reworked and new.
- `mock-spikes.png` — Seasons' Dancing Dragon 1F `$67` (its spike floor)
  beside our Spike Basin at LOW, MID and HIGH.
- `mock-floats.png` — Dancing Dragon B1 `$5e` (a moving platform over holes)
  beside our Weir and Long Race, and the Long Race's float stopped by the wind.
- `mock-machine.png` — Ages' Jabu-Jabu 3F `$6d` (three buttons set the water
  of the floors below) and 1F `$5c`, beside our 2F Intake at MID and HIGH and
  the East and Float Tanks with and without their gate open.
- `mock-loft.png` — 3F, the Wind Loft (a sketch: the three wheels in a row).

Our rooms are drawn in the real engine by `tools/shoot-mock.mjs
docs/briefs/d4-mock/mock-spec.json <out>` (S183 taught it `overrides`, `link`
and rooms wider than one screen). The spike pool and the float do not exist
yet, so `gen-spec.py` writes the spike pool per sea ('^' dry, '3' deep) and
`compose.py` pastes the cartridge's own pictures on: the spike tile cut from
Dancing Dragon `$67`'s render, and the platform built from
`spr_dungeon_sprites` column 4 the way INTERAC_MOVING_PLATFORM's
`interactionOamData4de66` lays it (4x2 8x16 sprites, alternate ones flipped,
palette 0 of `standardSpritePaletteData`: a tan frame round green panels).
`compose.py <scratch> <out>` wants the oracle-study renders
(`tools/oneshot/oracle-study/run.sh`) and the shoot-mock output in
`<scratch>/study0/study` and `<scratch>/mock`.

## The machine, in one sentence

**The Sealed Cistern keeps the sea you climbed with, and the Wind Loft above
it holds three wheels; each wheel the wind turns lifts a gate in the tank
beneath it, and that tank stands one level under the sea from then on.**

So the dungeon's state has two halves, and each floor sets the other's:

| State | Set where | Read where |
|---|---|---|
| The sea on 2F | the conch, sounded on 1F (or 3F) before you take the stair | every 2F room — the conch is not heard there |
| Which tanks are drained | the three wheels on 3F | the three tanks on 2F, directly below |

That is the Ages lesson (language brief §10): a state set in one fixed place
and read in others — Jabu-Jabu's three buttons in one room setting the water
on the floors below. Our conch goes everywhere with the player, which is why
no earlier dungeon could do it; a floor the conch cannot reach is how it
becomes a fixed place.

**Why the sealed floor is needed, and not just a style.** On a floor where the
conch works, a drained basin is never strictly needed: the player stands where
the puzzle is and sounds the conch to the sea they want (the Ebb Cell's own
answer, S143). A one-level drain only matters where the sea cannot be changed
from inside. That is the Sealed Cistern.

**Its tide consequence, distinct from D1-D3:** D1 held a patch of sea in
place, D2 showed the next sea before you chose it, D3 gave one body of water
a surface and a floor and stacked rooms under holes. D4: **the sea is chosen
in one place and lived with in another**, and the only things that move water
up there are the wind in your hands (the Bellows, for as long as you pump) and
the gates (for good). The Bellows' cone is "one level under, while you hold
it"; a gate is the same one level, held for ever. The two add: a wheel two
levels under water is turned by a gate and the wind together.

## Size and shape (`d4-plan.png`)

- **1F, the Lower Cistern** — the 36 screens there now, keeping their places,
  names, sills and optional rooms; five reworked (green on the plan).
- **2F, the Sealed Cistern** — 5 new screens over the middle of 1F (x 4-6,
  y 2-3): the Intake, the Spike Gallery, the West, Float and East Tanks.
- **3F, the Wind Loft** — one new room, three screens wide (x 4-6, y 2),
  directly over the three tanks, one wheel over each.
- **44 screens on 3 floors** (the S179 target was ~43 on 2-3).
- The hub is the stair column: the Ironknight Gallery (1F, after the
  miniboss) ↔ the Intake (2F) ↔ the West Tank ↔ the Wind Loft (3F). The player
  crosses it every time they change the sea for 2F.
- Floors renumber as D3's did: 1F stays floor 0 (so no save moves), 2F is
  floor 1, 3F floor 2.

## The three new pieces, all from the cartridges

**1. Spikes** — Dancing Dragon's own spike tile (`$67`), Seasons' damage and
knock-back (already in the engine, `HAZARD_DAMAGE`, `SPIKE_*_FRAMES`, from
dealSpikeDamageToLink). Two tiles: plain spikes, and the **spike pool**, a
tide tile: spikes at LOW and MID, deep water at HIGH — *drowned and harmless
at the top of the tide* (S179's line). A drained spike pool never reaches HIGH,
so its spikes are bare for good: a gate can cost you a crossing.

Combat, optional: a jellyfish swimming over a spike pool at HIGH dies on the
spikes when the wind takes the water off under it.

**2. Floats** — Seasons' INTERAC_MOVING_PLATFORM: its picture, its path
script (wait / move up-down-left-right / jump), SPEED_80 (0.5 px/f), Link
carried by the platform's own velocity. Our twist: **a float runs only while
the race that drives it carries a current**, and a race (`6`/`7`, already in
the game) is wadeable at LOW and running at MID and HIGH. So:

| | LOW | MID | HIGH |
|---|---|---|---|
| A float | still, wherever it was | runs | runs |
| ...with the wind on its race | still | **stops** (race MID→LOW) | runs (race HIGH→MID) |
| ...in a drained tank | still | still | runs |
| ...drained, with the wind on its race | still | still | **stops** |

And one rule straight from the cartridge: a moving platform does not move
while Link is playing an instrument (`@substate1`: `wLinkPlayingInstrument`
→ `ret nz`), so **floats freeze while the conch sounds**.

**3. Sluice gates** — a shut gate in each 2F tank's wall, with a chain going
up; the wheel directly above it on 3F lifts it (Seasons' door-rumble, the
gate art from the Dancing Dragon kit). Opened, the tank's water reads one
level under the sea for good (a persisted, flag-gated region of the tide
field). Visible before understood: you see every shut gate before you reach
the Loft, and the Dungeon Map stacks the floors.

**Also, found while mocking:** the Cistern's pits are drawn with the shared
navy `dPit`; Dancing Dragon's holes are plain black (`$5e` above). The build
rips the Dragon's own hole tile.

## The puzzles, in the order they are met

Each new piece is shown alone first (language brief §4). Existing sills
(Squall Loft MID, Drowned Sill HIGH, Gauge, Ebb Cell) stay as the Bellows'
"safe" and "twist" beats.

**N1 — The Spike Basin (1F 4,6, was the Cracked Basin). Spikes, alone.**
(`mock-spikes.png`) The chest with Small Key 1 stands on a dais in the middle
of a spike pool. At LOW and MID the pool is bare spikes; at HIGH it is deep
and you swim to it. *Aha: the spikes are only safe under the top of the
tide.* Before the Bellows; costs nothing to get wrong but a heart.

**N2 — The Weir (1F 3,5). A float, alone.** (`mock-floats.png`) The Weir's
north door (the key-door shortcut) is now across a two-tile pit, and a float
shuttles along it; the race that drives it runs along the south wall. At
MID and HIGH it runs and you ride it to the door; at LOW it stops where it is.
*Aha: the float runs on the race, and the race runs on the sea.*

**N3 — The Long Race (1F 4,3). The float and the wind.** (`mock-floats.png`)
The vault and its two sills go. The room is a long pit, the only way from the
Winding Stair to the Ironknight; a float carries you across it, and passes
under a notch in the north wall holding a chest (Small Key) — without ever
stopping. Its race is a little pool in the pit below the notch. Ride the float
at MID; when you are under the notch, face the race and pump: the wind takes
the race down to LOW and the float stops under your feet; step off. *Aha: the
wind that holds the water back holds the float still.* (At HIGH the conch
does the same thing — HIGH→LOW stops the float where it is — and that is fine
on 1F: it is the lesson the Float Tank takes away.)

**The miniboss, then the stair.** The Ironknight falls and the stair in the
gallery's east half opens (its text already says "something grinds open
above").

**N4 — The Intake (2F 6,3). The sea you climbed with.** (`mock-machine.png`)
You arrive on a stair with a spike pool between you and everything else, and
the conch says "the conch will not sound in here". At HIGH the pool is deep
and you swim on; at anything else, you go back down, sound the conch in the
gallery, and climb again. A plate: "The intake fills these tanks from the sea
below. Nothing is heard above it." *Aha: choose the sea before you climb.*
This room is re-read every time you come up.

**The Spike Gallery (2F 5,3)** — a fight among spike strips and the Float
Tank's south door: traversal, interior geometry, a third of the rooms.

**N5 — The Float Tank (2F 5,2), first visit.** A float rides north–south over
a pit from the Spike Gallery's door to the north side (and the West Tank's
door); halfway, it passes a one-tile ledge with a drown-wall gap behind it
and the East Tank beyond. At HIGH (the only sea you can have up here and
cross the Intake) the float runs past the ledge, and the wind cannot stop it
(race HIGH→MID still runs). Seen, not yet usable. *Visible before
understood.*

**N6 — The Wind Loft (3F, 3x1).** (`mock-loft.png`) Open to the sky: the
conch works up here. Three wheels in a row along the north wall, each over a
tank's gate, each a sill of a different shape: the west a sump shelf (MID,
the Squall Loft's shape), the middle across a spike pool (reached at HIGH,
wheel freed by one level of wind), the east beyond a pit, reached on a float.
A plate over each names its tank. Turning one: the rumble, and the gate below
opens. *Aha: the wheels are the levers of the floor beneath.* (The sea you
come back down with is the sea 2F gets — so the Loft is a second place to
choose it.)

**N7 — The West Tank (2F 4,2). Drained: the blocks move.** The tank's floor
is sluice (`1`: dry, wading, deep) and its only door is over drown-wall, so
you are only ever in it at HIGH — where it is deep and a block will not move.
With its gate open it stands at MID: wading, and the two blocks go onto their
two plates. Small Key. The Anchor cannot stand in for the gate: the plates
are further apart than its patch. *Aha: a drained tank is a floor at the top
of the tide.*

**N8 — The Float Tank, re-read. Drained: the float can be braked at the
top.** (`mock-machine.png`) With its gate open the race stands at MID, so at
HIGH the wind takes it to LOW and the float stops at the ledge; step off,
swim the drown-wall gap (deep, because only the race was drained) into the
East Tank. Without the gate, wind alone leaves it running; at MID the gap is
stone. *Aha: the gate and the wind together brake what the wind alone
cannot.*

**N9 — The East Tank (2F 6,2). The Boss Key: two levels under.**
(`mock-machine.png`) The wheel stands in a walled well (`3`: deep at MID and
HIGH), and its stand is a single tile ringed by drown-wall — reached only at
HIGH. At HIGH the well is deep, and one level of wind leaves it deep: the
wheel bubbles. With its gate open the well reads MID, the wind takes it to
LOW, and the wheel turns: the Boss Key's chest rises. *Aha: the wind lifts
one level and the gate another.* The hardest instance of the machine, and it
needs the dungeon's whole knowledge: the sea chosen downstairs, the gate
chosen upstairs, the wind in your hands. Its south door (to the Intake) opens
from inside — the way home.

**Home.** Down the stair, out through the Cliff Walk to the Crossed Sluices
(its two wheels removed; its shortcut plate kept) and the Cistern Gate's boss
door. Wyverna stays where she is.

## Key economy

| Key | Where | Opens |
|---|---|---|
| Small Key 1 | Spike Basin (N1) | Weir north / Winch west (either first, as now) |
| Small Key 2 | the Cistern Floor's plates (as now) | the other one |
| Small Key 3 | Cistern Gauge sill (as now) | Winding Stair → Long Race |
| Small Key 4 | Spill Vault, behind the Ebb Cell (as now) | Cliff Walk → Crossed Sluices |
| Small Key 5 | Long Race's notch (N3, NEW) | the Ironknight Gallery's stair door |
| Small Key 6 | West Tank (N7, NEW) | the Spike Gallery → Float Tank door |
| Boss Key | East Tank (N9, moved from the Crossed Sluices) | Cistern Gate's boss door |

Every key from a puzzle; every key door a loop or a shortcut home (the build
may re-pair locks to keep that true).

## What goes

The Long Race's two wheels (4a, 4b) and the Crossed Sluices' two (5, 6):
their lessons are taught by the Squall Loft and the Drowned Sill already, and
the Boss Key moves upstairs. Wheels on the main path: 8 before, 8 after
(Loft, Drowned Sill, Gauge, Ebb, three in the Wind Loft, the East Tank).

## Engine and tools the build needs

- **Overrides that add.** The tide field returns the newest override and
  ignores the rest, so a cone over a drained tank reads one level under the
  sea, not two (the mock fakes it with a `-2` cone). A relative override has
  to stack on whatever is under it — the base, an Anchor, a gate.
- The spike pool tile (ripped), the Dragon's hole tile (ripped), the gate art.
- `Float` (Seasons' platform script, speed, riding, the instrument freeze,
  "runs iff its race tile has a current at the field's level"), its art
  ripped from `spr_dungeon_sprites` by a ripper.
- Gates: a flag-gated region of delta -1 on a room, set by a wheel in another
  room (`reward.drains` beside S182's `openDoorsIn`).
- `noTide` on every 2F room (it exists; the boss rooms use it).
- The dungeon flood taught, in the same commit: the spike pool, floats (a
  float joins its stops at seas its race runs, and a braked stop at seas the
  wind or the conch can brake it), gates (a tank's levels once its wheel's
  room is stood in), and a floor where the sea cannot change.
- **Checkers, one per puzzle**, each proving "cannot be skipped" and "can be
  solved", in the real engine where it matters:
  `check-floats.mjs` (every float: runs iff its race runs, carries Link,
  freezes while the conch sounds, a `floatRoom.stop` reached only by braking
  — N2, N3, N5/N8); `check-sluices.mjs` (every gate: its wheel opens it, its
  tank reads one under, every `tankRoom` claim unsolvable at every sea it can
  be entered at without its gate and solvable with it — N7, N8, N9; the
  Intake's claim that nothing on 2F is passed below HIGH); check-bellows for
  the Wind Loft's three sills; check-placement, check-ground for the new
  tiles; check-side's whole-dungeon run; check-playthrough re-routed.
- **The Bottled Tide** is the one thing that moves the sea on 2F (that is what
  it is for). It would let a player skip N9 (HIGH→LOW). The robot never owns
  one; the claims say "without the bottle", and a bottle spent there is a
  bottle spent. Flagged for the human below.

## Open questions for the human

1. **The Sealed Cistern.** 2F is a floor the conch cannot reach: the water is
   whatever sea you climbed with. Yes? (Without it a gate never really
   matters — the player sounds the conch from inside instead.)
2. **Floats driven by their race.** They stop at LOW, the wind stops them at
   MID, and they freeze while the conch plays (the cartridge's own rule). Or
   plain Seasons platforms that ignore the sea?
3. **The four wheels that go** (Long Race, Crossed Sluices), and the Boss Key
   moving up to the East Tank. Yes?
4. **The Bottled Tide** may skip the Boss Key puzzle once (it is spent). Fine,
   or should the East Tank refuse it?
5. **Two building sessions**: first the three pieces and 1F (N1-N3, the
   engine, the rips, their checkers); then 2F and 3F, the robot and the guide.
