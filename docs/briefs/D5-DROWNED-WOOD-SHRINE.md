# D5 — the Drowned Wood Shrine, grown to two floors (S185 design; NOT BUILT)

**Status (S185): designed and mocked, shown to the human, waiting on their
answers to the open questions at the end.** Written against
docs/briefs/DUNGEON-DESIGN-LANGUAGE.md; read that first.

Pictures, all in `d5-mock/`:

- `mock-belts.png` — Seasons' Ancient Ruins 2F `$c6` (its belt room, rendered
  from the cartridge by `tools/oneshot/oracle-study/run.sh`) beside our
  Hollow Crown at LOW, MID and HIGH.
- `mock-drop.png` — the Belt Bough (a seed on a belt; the stake as a buffer),
  the Grove Crown (a knot-hole) over the Standing Grove (1F, reworked: a hold
  plate nothing below can reach), before and after the drop, and at HIGH.

Our rooms are drawn in the real engine by `tools/shoot-mock.mjs
docs/briefs/d5-mock/mock-spec.json <out>` (S185 taught it `tiles`, to stand a
grown pillar in a room). Belts do not exist yet, so `gen-spec.py` writes a
belt as the Ruins' second floor at LOW/MID and deep water at HIGH, and
`compose.py <study>/study <mock> <out>` paints the Ancient Ruins' own belt
tile (cut from the `$c6` render) over it with an arrow for its direction.

## What it is now

40 screens on one floor (36 rooms), the Ancient Ruins kit. Its theme: **the
sea in two states, in order** — a stake (a Reefseed pillar) is planted at one
sea and used at another, and the order cannot be reversed, because what you
build at the first sea is what you stand on at the second. Five grove rooms
state it five ways (`reefseedRoom`, proved by check-reefseed.mjs). What it
lacks against S179's measure: a second floor, cross-room and cross-floor
links, interior geometry (most rooms are an empty box with one pool), and a
new piece of terrain.

## The machine, in one sentence

**The Canopy plants the Shrine: belts in the crowns of the drowned trees
carry a seed while it grows, and a knot-hole in the boughs drops it into
the room beneath, where it takes root in a place no hand below could put
it — and stays.**

| State | Set where | Read where |
|---|---|---|
| Which stakes stand below | the Canopy (2F): each knot-hole drops a seed to the one cell beneath it | the 1F rooms under the Canopy, for good |
| Which belts turn | the sea (the conch works up here): a drowned belt does not turn | every belt |
| What each stake IS | the sea at the stake: a step at LOW, a wall at MID, a reef at HIGH | wherever it stands |

The Ages lesson (language brief §5 kinds 2 and 3): a hole is a choice of
where something arrives, and a change upstairs is a different room
downstairs. The connection is always VISIBLE before it is understood: every
target below is in plain sight on the first visit (a plate on a dais in a
ring of sump, a notch nothing can be thrown into), and every knot-hole
upstairs shows the floor beneath it.

**Why it is D5's and no one else's.** D3 put holes in a floor for LINK (the
bog opens at LOW and he drops into the cellar). Here the holes are for the
SEED: Link can fall through a knot-hole too, harmlessly (it is the quick way
down), but nothing he does down there replaces what a seed does from above.
D4 used a current to drive a float; here the sea STOPS the machinery (a
drowned belt does not turn), and the only thing that rides it that matters is
a seed that is busy growing.

## Size and shape

- **1F, the Shrine** — the 40 screens there now, keeping their places, names
  and save keys; four reworked (the Standing Grove, the Long Ford, the
  Rootbound Hall, the Shrine Ford).
- **2F, the Canopy** — 7 new screens over the middle of 1F: the Hollow Crown
  (3,4), the Belt Bough (3,3), the Grove Crown (3,5), the Ford Crown (4,3) and
  the High Bough (4..6,2, three screens, over the Shrine Ford).
- **47 screens on 2 floors** (S179's target was ~44 on 2). Seasons' own
  Ancient Ruins is 45 on five.
- The hub is the Hollow Crown, over the Rootbound Hall: the stair up is a
  hollow trunk in the Hall, and the Crown's knot-holes drop you back into it.
  Every trip to the Canopy starts and ends there.
- Floors as D3's and D4's: 1F stays floor 0, so no save moves; 2F is floor 1.

## The new piece: belts (Seasons', with a tide twist and a seed on them)

**From the cartridge, exactly:** Ancient Ruins' own conveyor metatiles and
their animation (TILETYPE_UP/RIGHT/DOWN/LEFTCONVEYOR, ripped by
rip-dungeon-themes.py); Link carried at SPEED_80 (0.5 px/f) in the belt's
direction on top of his own walking, not while riding something
(specialObjects/commonCode.s @tileType_conveyor); enemies carried the same
way (enemyConveyorTilesTable). A belt carrying an enemy over a hole drops it
in — with S185's falling-into-a-hole animation, which is how Seasons does it.

**Ours:**

1. **A seed rides a belt while it grows.** A Reefseed that lands on a belt is
   carried at the belt's speed for its two seconds (REEFSEED_GROW_FRAMES), so
   it comes up about four tiles further on. The delay — the item's whole
   design — becomes a distance.
2. **A drowned belt does not turn.** Belts sit in the boughs' channels: a
   HIGH BOUGH's belt runs at LOW and MID and is deep, still water at HIGH; a
   LOW BOUGH's runs only at LOW (shallow and still at MID, deep at HIGH). So
   the sea chooses which belts carry, and where a seed riding one stops.
3. **A seed carried over a knot-hole falls through** and grows in the room
   beneath, on the cell directly under it (the Kilnshell already falls
   through drop holes this way, S182). A stake grown from above is
   REMEMBERED: one per knot-hole, kept in the save, regrown when the room
   loads. (Stakes thrown the ordinary way still go when you leave the room.)

## The puzzles, in the order they are met

Each new piece is shown alone first (language brief §4). The five groves
stay as the Reefseed's "safe" and "twist" beats.

**K1 — The Hollow Crown (2F 3,4). Belts, alone.** (`mock-belts.png`) Up the
hollow trunk from the Rootbound Hall. Two rows of belt run east into two
knot-holes, between the stair and the way north. At LOW and MID you are
carried as you cross; cross near the holes and you drop back into the Hall,
unhurt. At HIGH the belts are under water and still: you swim across. *Aha:
a drowned belt does not turn.* Reachable before the Reefseed, and costs
nothing to get wrong.

**K2 — The Belt Bough (2F 3,3). A seed on a belt.** (`mock-drop.png`) The
way on is a snarl in the north wall, cut from the belt tile under it — and a
swing on a running belt is carried on into the knot-hole at its end. The row
under the belt is sump, so no throw reaches the end of it. Throw a seed onto
the start of the belt: it rides while it grows and comes up one tile short of
the hole. At MID that stake is a wall, and the belt pushes you against it and
holds you still under the snarl. At LOW it is a step the belt carries you
over. *Aha: the belt carries the seed, and at MID the stake is a buffer.*

**K3 — The Grove Crown over the Standing Grove (2F 3,5 / 1F 3,5). The first
drop.** (`mock-drop.png`) The Standing Grove is the third room of the
dungeon, and from the first visit it shows a hold plate on a one-tile dais in
a ring of sump two tiles wide — the Shrine's own tile that nothing can stand
on or be planted in, at any sea. No throw, no perch and no block reaches it.
Upstairs, a knot-hole sits right over it. Throw a seed in: it falls, grows on
the plate, and holds it for good. *Aha: a hole in the boughs is a place in
the room below.* The plate opens the notch beside it (Small Key).

**K4 — The Ford Crown over the Long Ford (2F 4,3 / 1F 4,3). The sea chooses
the road.** A high-bough belt crosses a low-bough belt. At LOW a seed rides
the low belt to a knot-hole over the Long Ford's east notch; at MID the low
belt is still, so a seed on the high belt crosses it and goes on to a second
knot-hole over the Ford's middle. Each stake below is what one half of the
Long Ford needs (one a step at LOW onto the notch's sill, one a wall at MID
the Ford's block is pushed against). *Aha: the sea decides where the belt
stops.* Visible before understood: both notches and the block are in the
Long Ford from the first time you cross it.

**K5 — The Boss Key: the High Bough over the Shrine Ford (2F 4..6,2 / 1F
4..6,2).** The Shrine Ford (three screens, already the Boss Key's room) gets
three sealed alcoves, each with a hold plate behind sump, seen every time the
Ford is crossed. The High Bough above has three knot-holes over them and a
network of high and low belts. One seed can only be got to its hole at LOW,
one only at MID; the third needs a stake grown first as a buffer on the belt
(K2's lesson) so the next seed stops over its hole instead of being carried
past. When all three plates are held, the Boss Key's chest rises below (Ages
D5 `$bc`: four buttons, each held by something you made). *Aha: everything
you plant up here is something holding down there.*

The Rootmaw and the boss door are unchanged.

## Key economy (to be settled in the build)

The five groves keep their keys. New: Small Key from K3 (the Standing
Grove's notch) and from K4 (the Long Ford's notch); the Boss Key moves from
grove 5 to K5. Two new locks, each a loop back toward the Hollow Crown.
Every key from a puzzle; every key door a loop or a shortcut home.

## Engine and tools the build needs

- Belts: the Ruins' four conveyor tiles ripped (with their animation, from
  the cartridge's tile-animation tables), legend characters, a tile flag;
  Link and enemies carried at SPEED_80 (feel.js, derived); a belt tile that
  is a tide tile (high bough / low bough), still where it is under water.
- Reefseed: a bud on a belt rides it while it grows; a seed or bud over a
  knot-hole falls through and grows on the cell below; stakes from above
  persisted per knot-hole.
- Hold plates a pillar can hold (a plate that accepts a stake: today
  `noPlant` keeps every pillar off every plate).
- The dungeon flood taught, in the same commit: belts (a one-way carry at the
  seas they run), knot-holes (a drop to the floor below), and stakes from
  above (a cell below that becomes a step/wall/reef once its knot-hole has
  been fed).
- **Checkers, one per puzzle**, "cannot be skipped" and "can be solved":
  `check-belts.mjs` (every belt: carries Link and enemies at SPEED_80 at the
  seas it runs and not where drowned; a seed rides it; every `beltRoom`
  claim — K1, K2, K4's routing) and `check-canopy.mjs` (every knot-hole has a
  cell beneath; a seed dropped through grows there and is still there after a
  save and load; every `dropRoom` target cannot be planted from below at any
  sea — the plantable flood, perches included — and can from above; K3, K4,
  K5); check-reefseed for the groves; check-placement, check-ground;
  check-side's whole-dungeon run; check-playthrough re-routed.

## What stays out

- **Cracked floors.** S179's board offered them for D5 as well, but the
  Bogwater Sanctum already teaches them; D5's new piece is belts alone.
- Trampolines and magnet balls (Ancient Ruins has both): not ours to need.

## Open questions for the human

1. **The machine** — "the Canopy plants the Shrine": a new upper floor of 7
   screens, whose knot-holes drop seeds into the rooms below, where they take
   root where nothing else can reach, and stay. Yes?
2. **Belts** — Seasons' own (the Ancient Ruins art, its speed, carrying Link
   and enemies), plus ours: a seed rides a belt while it grows, and a
   drowned belt does not turn (high boughs stop at HIGH, low boughs at MID
   and HIGH). Yes?
3. **Stakes from above are kept for good** (one per knot-hole), while stakes
   thrown the ordinary way still vanish when you leave the room. Fine, or
   should every stake be kept?
4. **No cracked floors here** (D3 has them). Agreed?
5. **Two building sessions**: first the belts and 1F's reworks with K1-K3
   and their checkers; then K4, K5, the robot and the guide.
