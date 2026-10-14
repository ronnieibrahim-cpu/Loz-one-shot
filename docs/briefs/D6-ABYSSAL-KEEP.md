# D6 — the Abyssal Keep, grown to three floors (S188 design; NOT built)

**Status (S188): designed and mocked, shown to the human. Nothing in the
game has changed.** Written against docs/briefs/DUNGEON-DESIGN-LANGUAGE.md;
read that first. D5's brief (D5-DROWNED-WOOD-SHRINE.md) is the shape this
one follows.

Pictures, all in `d6-mock/`:

- `mock-hold.png` — Seasons' Sword & Shield Maze ice half (`$84` with its
  grabbable ice alcove, `$78` ice over holes into the fire floor, `$7c` a
  hole field), rendered from the cartridge by
  `tools/oneshot/oracle-study/run.sh`, above three of our Hold rooms.
- `mock-sounding.png` — K1 and K3: the Slack Water at MID (the line hauls a
  chunk up through a flooded well) and at LOW (a chunk thrown down a well),
  and the Sounding Floor beneath it.
- `mock-over.png` — K4: the Tally Hall at MID and LOW over the Rime Hall.
- `mock-plumb.png` — K5 and K6: the Weighhouse, the Plumb's Foot, the
  Drowned Garden, and the Crossed Shafts at MID (shafts dry) and HIGH
  (flooded).

How they are made: the rooms upstairs are drawn in the real engine by
`tools/shoot-mock.mjs docs/briefs/d6-mock/mock-spec.json <dir>` (written by
`gen-spec.py`; a 1F shaft is `4`/`dDrain`, an open pit at LOW and water
above, which is exactly the shaft's shape; a 2F shaft is drawn `O` at LOW
and MID and `4` at HIGH). Ice is not in the engine yet, so `hold.py` draws
the Hold from Seasons' own tileset `$41` metatiles (via rip-objects.py's
Tileset, the study's renderer) with the cartridge's ice chunk
(INTERAC_D8_GRABBABLE_ICE: tiles `$0a`/`$0c` of `spr_pedestal_ice`; its
palette chosen by eye — the cartridge's sprite palette 4 for this room is
not resolved). `compose.py <dir> docs/briefs/d6-mock` lays the sheets out.

## What it is now

47 screens on two floors (38 rooms), the Sword & Shield Maze's FIRE half.
Its theme (S96-S142): **the line crosses what the sea uncovers, and the
floor gives up only what the sea covers** — moorings braced at LOW over a
`dWell` shelf, posts reached at HIGH over a drowned `dLintel`, silted caches
searched only under water. Against S179's measure it lacks a third floor,
cross-floor links (the two floors meet only at one stair), interior geometry
in its first-half rooms, and a new piece of terrain. Most rooms are a box
with one pool; the Slack Water, which teaches the cache, is a dead end
nothing makes you walk into.

## The machine, in one sentence

**What the sea puts down, the line brings up: the Keep stands on the Hold,
its floors are pierced by shafts, and at LOW anything over a shaft falls to
the floor beneath — while with the sea in the shaft, the Dredge Line cast
across it reaches down to the floor beneath and hauls up whatever lies
there.**

The door has said it since the Keep was built: *"Everything the sea takes,
it keeps. Everything it keeps, it puts down."* The Hold is where it puts it.

| State | Set where | Read where |
|---|---|---|
| Where each ice chunk is — which floor, which room, which tile | dropped down a dry shaft (LOW), hauled up a flooded one (the line), carried by hand within a floor | plates on all three floors |
| Which shafts are flooded | the sea, floor by floor: at LOW none; at MID the 1F shafts (over the Hold); at HIGH the 2F shafts too | every shaft |

**The sea rises through the Keep floor by floor.** At LOW the sea is below
the Keep and every shaft is a hole. At MID it has filled the Hold's ceiling:
1F's shafts are flooded wells, 2F's are still holes. At HIGH it reaches 2F
and every shaft is flooded. So a chunk climbs the Keep one sea at a time —
up out of the Hold at MID or HIGH, up to 2F only at HIGH — and goes back
down only when the sea is out of the shaft it is over.

Why it is D6's and no one else's. Three dungeons have sent things DOWN a
floor: D3 drops Link through the bog at LOW, D5 drops a seed through a
knot-hole, the Sunken Palace takes Link down a whirlpool at HIGH. **Nothing
in the game has ever come UP.** The Dredge Line is the only thing that
reaches through water to a floor, and the Keep's own theme already says the
floor gives up only what the sea covers — a flooded shaft is the sea
covering the floor of the room beneath. And the language brief's fourth
kind of cross-floor puzzle, *an object carried between floors* (Ages D8's
slates, Seasons D8's ice), is the one kind no dungeon of ours has built
round an object the PLAYER moves.

The Ages lesson (language brief §5 and §7): the connection is visible
before it is understood. Every well upstairs shows its water or its hole;
every cell beneath one in the Hold is marked (a dark ring in the ice), and
every plate the machine needs is in sight from the room it is in.

## Size and shape

- **B1, the Hold** — NEW, 5 screens under 1F's east wing, in Seasons' ice
  half (the Sword & Shield Maze's other half: its own tileset `$41`): the
  Plumb's Foot (5,2), the Sounding Floor (5,3), the Rime Landing (6,3), the
  Rime Hall (7,2-7,3, 1x2).
- **1F, the Keep** — the 26 screens there now, keeping their names; one
  NEW room, **the Weighhouse (5,2)**, and five reworked (the Slack Water,
  the Draw, the Tally Hall, the Hauling Pit, the Drowned Garden).
- **2F, the Upper Keep** — unchanged but for the Crossed Shafts (4..5,2).
- **53 screens on 3 floors** (S179's target: ~52 on 3). Seasons' own
  Sword & Shield Maze is 51 on two.
- **The hub is the Plumb**: a column of three rooms at 5,2 — the Plumb's
  Foot in the Hold, the Weighhouse on 1F, the Crossed Shafts' far island on
  2F — joined by shafts one above the other. The Weighhouse sits between
  the Slack Water, the Hauling Pit and the Drowned Garden, so every trip
  through the east wing crosses it, and every chunk the dungeon needs goes
  up through it.
- **Floors and saves.** The Hold goes UNDER the Keep, so the Keep's floors
  move up one (B1 = floor 0, 1F = 1, 2F = 2), exactly as D3's did when the
  Undercroft went under the Bog (S181): `migrate` moves every remembered
  d6 place, door, chest and seen room up a floor behind a `d6Floors: 3`
  marker, and tools/test.mjs proves an old save moves.

## The new piece: Seasons' ice — the floor, and the chunks you lift off it

**From the cartridge, exactly (to be read and ripped in the build):**

- **The ice half's tileset**, `$41` (`mazeIce`, already named in
  rip-dungeon-themes.py, never ripped): floor, ice, wall ring and jambs,
  holes (`$f4`-`$f6`), blocks, pots, the button, the stair.
- **Ice underfoot** (`TILETYPE_ICE`, specialObjects/commonCode.s
  @tileType_ice sets `wIsTileSlippery`; Link's slippery movement in
  link.s): Link keeps his momentum and turns slowly. Speeds and the
  slide's acceleration read from link.s into feel.js, `derived`.
- **The grabbable ice** (INTERAC_D8_GRABBABLE_ICE,
  swordShieldMazeGrabbableIce.s): a chunk Link lifts and throws like a pot,
  that does NOT break where it lands; over a hole it goes down (S185's
  INTERAC_FALLDOWNHOLE ball); into water it splashes
  (`objectReplaceWithSplash`). In Seasons that is the dungeon's machine:
  ice from the ice floor, thrown down holes, freezes the lava of the fire
  floor beneath (INTERAC_D8_FREEZING_LAVA_EVENT reads the flag of the room
  ABOVE).

**Ours (the tide twist):**

1. **A chunk dropped down a shaft lands on the cell beneath, whole.** Over a
   dry shaft (LOW, or MID for a 2F shaft) a thrown or carried chunk falls
   and comes to rest on the same tile one floor down — on a plate, it holds
   it. (Seasons' falls into lava; ours into the Keep's rooms.)
2. **The line hauls up through a flooded shaft.** When the Dredge Line's
   weight is dragged back over a flooded shaft tile, it searches the cell
   directly beneath on the floor below: a chunk (or a key, or anything the
   line already catches) lying there comes up the shaft and home to Link.
   This is the line's own puzzle verb — *the floor gives up only what the
   sea covers* — reaching one floor further.
3. **The sea rises through the Keep floor by floor** (above): which way a
   chunk can travel between two floors is the sea's choice.
4. **Link does not carry a chunk up a stair** — he sets it down at the
   stair's foot. (To be checked against the cartridge before building: read
   what Seasons' warp does to a held object, S182's lesson. If Seasons lets
   him carry it, the design rule stands anyway and says so.)

What does not change: Link still falls down a dry shaft himself (D3's
verb; the quick way into the Hold) and, in the Cleats, sinks down a flooded
1F one. He comes back UP only by the stair. *You go down; things come up.*

## The puzzles, in the order they are met

Each new piece is shown alone first (language brief §4). Rooms are named
as they will be; coordinates are today's (1F = floor 0) plus B1.

**K1 — The Slack Water: the first sounding (1F 5,3, reworked; safe).**
(`mock-sounding.png`) Straight after the Dredge Vault, and no longer a dead
end: its east door to the Draw is now a shutter, and the room gains two
wells in the floor south of the pan and a plate by the shutter. At MID the
wells are flooded; cast across the west one and the line comes back with
an ice chunk from the floor below. Set it on the plate: the shutter opens.
The Piece of Heart in the pan's silt stays where it is. *Aha: the line
reaches down through the sea.* At LOW the wells are holes — the quick way
into the Hold.

**K2 — The Rime Landing: ice, alone (B1 6,3; traversal and a fight).**
(`mock-hold.png`) Down a new stair from the Draw's west half. Seasons' ice
across the middle of the room, a fight on it, chunks on a dais like
Seasons' `$84` alcove. Nothing else happens here. *Aha: the Hold is ice;
the chunks lift.*

**K3 — The Sounding Floor: down at LOW (B1 5,3 under the Slack Water).**
(`mock-sounding.png`) West of the Landing. Seen on the first visit: a plate
on an islet three tiles from any shore (S186's lesson: a throw crosses two
or three), and a dark ring in the ice where the K1 chunk lay. The islet is
under the Slack Water's EAST well. Upstairs at LOW, take the chunk off K1's
plate (its shutter stays open) and throw it down the east well: it lands on
the islet's plate and a Small Key falls in the Hold. *Aha: what goes down
at LOW lands where you cannot walk.*

**K4 — The Rime Hall: over, not across (B1 7,2-7,3 under the Tally Hall).**
(`mock-over.png`) East of the Landing, two screens tall: chunks on the
south ice, a chasm across the middle no throw crosses, and a plate on the
far side. The line can take Link over (the Keep's posts), but nobody casts
with a chunk in his hands. The Tally Hall above gains a well on each bank,
one over each half of the Hold below. Set a chunk on the south ring; go up;
at MID haul it up through the south well; carry it round (the Draw, the
Hauling Pit — the Tally Hall's own shafts are crossed only by the line);
at LOW drop it down the north well onto the plate. *Aha: what cannot cross
the Hold goes up into the Keep, round, and back down — up with the sea in,
down with the sea out.* Reward: the Keep's Compass, or a Small Key (see
the key economy).

**K5 — The Weighhouse: the Plumb (1F 5,2, NEW, and B1 5,2).**
(`mock-plumb.png`) Between the Slack Water (a new north door), the Hauling
Pit (a new west door) and the Drowned Garden (a new east door, a shutter).
A well at its heart over the Plumb's Foot, where the Hold keeps its chunks.
Haul one up at MID and set it on the plate: the Garden's shutter opens.
Seen from the first visit: nothing yet says the 2F shaft is overhead — the
Crossed Shafts says it, from above. Safe; the repeat that makes K6 a
recognition.

**K6 — The Boss Key: the Crossed Shafts, up two floors (2F 4..5,2,
reworked; the machine's hardest question).** (`mock-plumb.png`) The Crossed
Shafts keep both crossings (in over the bar at HIGH, on from the shelf at
LOW). New: a plate on the middle island and one on the far island, and a
shaft beside each — over the Drowned Garden and over the Weighhouse. At
LOW and MID they are holes (the sea has not reached 2F); at HIGH, flooded.
The Boss Key's chest rises when both plates are held. Each chunk: up out of
the Hold through the Plumb (MID), carried on 1F to the cell under its 2F
shaft (one in the Weighhouse, one through the new door into the Garden),
then up to 2F, across the shafts with the line, and at HIGH hauled up onto
its own island — because a chunk cannot cross a shaft in Link's hands any
more than in the Hold. *Aha: a chunk climbs the Keep one sea at a time.*
The Brinehulk still guards the far island.

The Draw, the Hauling Pit, the Tally Hall's crossings, the Coilrope, the
Tideshade, the Mermaid Vault and Nereth are unchanged.

## Everything before it, combined

The language brief's last dungeon is a museum. Each earlier item meets the
machine in the build, as optional rooms or as second answers the checkers
must prove harmless:

- **Squall Bellows** — its cone holds the sea one level down: pumped beside
  a flooded 1F well at MID it is a hole for as long as you pump, so a chunk
  can go down without lowering the sea (and Link cannot follow: "it cannot
  be the route you take yourself").
- **Tidewright's Anchor** — a held patch keeps a shaft flooded while the
  sea falls: haul at LOW.
- **Kelp-Soled Cleats** — sink down a flooded 1F shaft into the Hold.
- **Brineglass Lens** — shows which shafts the next sea floods.
- **Reefseed** — a stake is not a chunk; the plates refuse it (they are
  weight plates, not stake plates).

Each is a SECOND way through at most; check-shafts-style "cannot be
skipped" claims must hold with all of them owned.

## Key economy

Today: 5 Small Keys (Bone Cell, Drain Court, Black Kiln, Hauling Pit,
Drowned Sill's cache), 5 locks; Boss Key in the Crossed Shafts. New: a
Small Key from K3 and from K4; two new locks, each a loop — the Weighhouse's
east door into the Hauling Pit (the short way between the Hold's stair and
the Plumb) and the Rime Hall's (or the Sounding Floor's) way back to the
Landing. **7 keys, 7 locks**, as D5. The Boss Key moves from a chest anyone
who crosses the shafts can open to one only K6 raises. Every key from a
puzzle; every key door a loop or a shortcut home.

## Enemies

Toward Seasons D8's density, from the roster we have: zols and gels, keese,
bubbles, beamos, beetles, wisps, stalfos, darknuts and wizzrobes on the ice
(Seasons' D8 ice floor fields zols, hardhat beetles, sparks, gibdos,
moldorms, wizzrobes, blade traps). check-hearts' ladder and the robot's
health re-checked on every one.

## Engine and tools the build needs

- RIPPED: tileset `$41` into rip-dungeon-themes.py (a `dungeonAbyssIce`
  legend: floor, ice, ring, jambs, holes, stair, block, pot, button); the
  ice chunk into rip-objects.py (or rip-effects.py) with its real palette.
- Ice: a tiledef `ice` field (registered in tileset.js — S-lesson: a field
  the registrar does not name is discarded), Link's slippery movement,
  `derived` constants in feel.js; enemies on ice as Seasons moves them.
- The chunk: a liftable entity that does not break, falls down dry shafts
  to the cell beneath (and S185's ball on the way), holds weight plates,
  splashes into deep water (where the line can fish it back — the Keep's
  theme), set down at a stair.
- The Keep's shaft tile: the Keep's own hole art (Seasons D8 fire half),
  F.DROP over a room beneath; `[hole, water, water]` on 1F,
  `[hole, hole, water]` on 2F.
- DredgeLine.dragBack: a flooded F.DROP tile searches the cell beneath on
  the floor below; the hooked thing comes up.
- The floor move (`d6Floors`), the respawn point, the map screen's three
  floors (B1 listed), the Hold's music (Seasons' D8 theme is the Keep's).
- **The dungeon flood taught, in the same commit**: chunks are objects, not
  movement — so the flood needs nothing new for Link (falls and Cleats sinks
  are D3's), but every plate claim needs its own proof:
- **check-hold.mjs, NEW**, "cannot be skipped" and "can be solved", in the
  real engine: every shaft is a hole and a flooded well at exactly its
  floor's seas; a chunk over a dry shaft lands whole on the cell beneath;
  the line cast over a flooded one at every standing place near it brings
  up what lies beneath and nothing when it is dry; a chunk is set down at a
  stair; and every `holdRoom` claim — each plate reached by no foot and no
  throw on its own floor (S186's every-pixel sweep, Bellows and Anchor
  owned), and fed for real by the route the claim states, kept after a save
  and a load. K6 played whole, Hold to Boss Key.
- check-placement, check-ground, check-strands (dungeon), check-exits,
  check-camera, check-wide-rooms; check-side's whole-dungeon run; the robot
  re-routed (check-playthrough 47/47 or more, THE END, never died).

## What stays out

- **Lava, and freezing it.** Seasons' D8 machine is ice into lava; "fire
  the sea puts out" is the Salt Pan's sentence. Ours is ice up and down the
  Keep. The fire half keeps its look, not its lava.
- **Cracked ice** (Seasons' `@tileType_cracked_ice`): the Bogwater Sanctum
  already teaches a floor that gives way.
- **Side-view passages** (Seasons D8 `$5c`-`$62`): the water line would be
  the clearest picture of the sea in the game, but it is an engine of its
  own (gravity, ladders, side-on Link). Offered as a question, not designed.
- Trampolines and toggle floors: both need a jump the game does not have.

## Open questions for the human

1. **The machine** — "what the sea puts down, the line brings up": a new
   floor under the Keep, the Hold; at LOW things fall down the Keep's
   shafts, and with the sea in a shaft the Dredge Line hauls up what lies
   on the floor beneath. Yes?
2. **The new piece** — Seasons' ice half: its tiles, Link sliding on ice,
   and its liftable ice chunks, which fall down dry shafts and are hauled up
   flooded ones. Yes?
3. **The sea rises through the Keep floor by floor** — a 1F shaft floods at
   MID, a 2F shaft only at HIGH, so a chunk climbs one sea at a time. Keep
   it, or make every shaft flood at MID (simpler, and K6 loses its "aha")?
4. **Link sets a chunk down at a stair** (he cannot carry one between
   floors except by the shafts). Fine?
5. **Size** — 5 new screens below and the Weighhouse (53 on 3 floors), and
   7 keys. Fine?
6. **Two building sessions**: first the ice, the chunk, the shafts and the
   line's haul, the floor move, the Hold and K1-K4 with check-hold; then the
   Weighhouse, K5-K6, the Boss Key's move, the robot and the guide.
