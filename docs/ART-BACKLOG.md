# Art backlog

Work that is identified, scoped and not done. Each entry says what blocks it.


## The Keep's mooring ring reads as a block, and its silt ring reads better dry

Two findings from P8/D6, and they are the small change left in an otherwise good
result. The Abyssal Keep is the second dungeon running whose mechanic is legible
in a still frame — `tools/shots/room-d6_1_2_3-tide1-px80.png` and `-tide2-` are
the same room one conch apart and a whole slab of masonry has gone under the sea
between them — so this is polish rather than the "silent failure" complaint that
D2, D3 and D4 all shipped with.

**The mooring is `ART.dPost` in the `stone` palette and it reads as a grey
block, not as something a line takes hold of.** It is the same art the game uses
for every post everywhere, which is correct extraction practice and is exactly
why it says nothing specific. What it wants is a RING or a cleat — a shape whose
silhouette says "hook this" — and `assets/sheets/` should be checked for one
before anything is drawn. This matters more here than it did for `dPost`'s old
decorative use, because in the Keep the post is the answer to the room.

**The silt cache is clearer on the dry pan than under the water.** `dSiltDry` is
dark rings on grey flagstone and `dSiltWet` is dark rings on light blue; both
read, but the marker is *sharper* at the sea where dredging it does nothing. The
thing that actually tells the player is the whole pan turning blue, which works —
so this is a second-order fix. A brighter or animated glint on the wet variant
would put the emphasis where the verb is. Compare
`tools/shots/room-d6_0_5_3-tide0-px80.png` against `-tide1-`.


## THE ONE THAT WORKED, AND WHY (P8/D5) — not a job, a precedent

Three dungeons in a row shipped with the same finding: the mechanic is legible
when it works and silent when it does not. D2's fork draws three dark blues four
RGB units apart. D3's torrents are ordinary deep water with a faster ripple. D4's
drained wheel is unmissable at MID and invisible at HIGH. All three are the same
mistake — **the state was carried by a shade of water.**

The Drowned Wood Shrine's bole is not. `dSnag` is `treeDark`'s trunk at LOW and
MID and `dWaterD` at HIGH: a whole 16x16 tile of art that is there or is not.
Nothing has to be compared to anything, it survives a still frame, it survives a
screenshot at 1x, and the Standing Grove at d5 3,5 teaches it with two 2x2 stands
before any room depends on it.

    node tools/shoot-rooms.mjs --tide=1 --px=72 --py=72 d5,0,3,5
    node tools/shoot-rooms.mjs --tide=2 --px=72 --py=72 d5,0,3,5

The precedent, and it is the answer to the three entries below as much as to
anything in D6: **when a tide state has to be readable, spend a tile on it, not
a shade.** The palette has nowhere near enough room to say four things in blue,
and every attempt to make it costs a session and lands on the backlog.

One job the Shrine did leave: **`dSnarl` is the extracted bush in the dark-oak
palette**, which reads correctly as "cut this" and identically to every bush in
the game that a BOMB also opens. A snarl is sword-only by construction — `cut`
is its only transform — so the sprite is telling the player something false about
which of their items to reach for. Wants a kelp/weed frame off the sheets rather
than a recolour.

## A DROWNED WHEEL LOOKS EXACTLY LIKE A WORKING ONE (P8/D4)

The Cliffside Cistern is built on paddle wheels that jam under deep water and
turn in shallow. The mechanic is proved, the rooms are proved, and **the wheel
never says which it is.** `o_valve` is one sprite in every state — dry, wading,
drowned — so the fixture that the whole dungeon turns on carries no information
about the one property that matters about it.

The water half of the read is good where it works and absent where it does not,
and both halves were measured off screenshots rather than argued:

| | wheel's tile | how it reads |
|---|---|---|
| MID, not pumping | (38, 76, 140) | deep |
| MID, cone open | (70, 133, 175) | shallow — **and the undrained shaft three tiles away is still (38,76,140), so the difference is on screen side by side** |
| HIGH, not pumping | (38, 76, 140) | deep |
| HIGH, cone open | (38, 76, 140) | **identical.** The cone IS working — the water inside it is at MID — but `dWell` draws the same tile at MID and at HIGH |

Reproduce both with:

    node tools/shoot-rooms.mjs --tide=1 --px=68 --py=18 --bellows --dir=left d4,0,1,3
    node tools/shoot-rooms.mjs --tide=2 --px=68 --py=18 --bellows --dir=left d4,0,1,3

So the successful case teaches itself and the failing case teaches nothing: a
player pumping at the wrong sea cannot tell "my cone is not reaching that far"
from "my cone is reaching and one level down is still too deep". Those want
completely different responses — walk closer, or sound the conch — and the
screen distinguishes them not at all.

What it wants, in the order it should be tried:

1. **A drowned state for the wheel.** `GustWheel.drowned` already computes it
   every frame; it needs a second sprite — the same wheel with weed on it, or
   pale and out of focus the way the source games draw a submerged object — and
   `spriteName()` returning it. This is the whole fix for the fixture and it is
   about twenty minutes of pixels.
2. **Something at the cone's mouth that is not water.** The gust puffs
   (`BELLOWS_PUFF_EVERY`) are drawn at the near end only, so a cone reaching
   three tiles is signalled at one of them. Puffs travelling the length of the
   cone would say "this is where the wind is going" independently of whether
   the water under it changed.
3. **Do NOT solve it by making MID and HIGH different blues.** That is a change
   to the whole game's water for one dungeon's fixture, and it would break the
   Lens's reads as well.

Blocked on nothing but the drawing.

## A CURRENT IS INVISIBLE (P8/D3) — the highest-value entry in this file

The Bogwater Sanctum is built on torrents: deep water that runs harder than a
swimmer can, so the surface route fails and the seafloor route works. The
mechanic is proved, the rooms are proved, and **the player cannot see it.**

`dTorrentE/W/N/S` reuse `waterD0` in the `deep` palette, exactly as the
riptides do, on the argument that the source games signal a current by how the
water MOVES rather than by a different blue. That argument is right about the
source games and wrong about what shipped here: the only difference between
still water and a torrent is `animRate` — 13 against 4 — so in a screenshot they
are the same pixels, and in motion the tell is a slightly faster ripple that
nobody has any reason to read as "this will carry you". Which WAY it runs is not
signalled at all.

Seen in `tools/shots/room-d3_0_2_3-tide1-px80.png`: the Undertow reads as a
handsome flooded drain and gives no hint that the water in it is moving.

What it wants, in the order it should be tried:

1. **Directional foam.** The Oracles draw moving water as a surface pattern that
   travels, not as a colour. Two or three frames of foam streaks offset along
   the push vector, drawn over the water tile, would say both "current" and
   "this way" in the source games' own vocabulary. It is a new animated overlay
   rather than a new tile, so it does not disturb the tide-variant machinery.
2. **A cheaper stopgap** if that is too much: reuse the existing wake/foam
   effect (`spawnEffect('foam', …)`) spawned along torrent tiles, which is
   already how wading is signalled.
3. **Do NOT solve it with a different blue.** That is the hand-drawn drift
   ART-DIRECTION warns about, and it would make a torrent read as a different
   substance rather than as the same water moving.

Blocked on nothing but the drawing. Until it lands, every torrent room in the
game is a room the player learns by being swept out of it once.

## Dungeon map rips (P7.5) — BLOCKED ON ASSETS

P7.5 is written against four Oracle of Seasons dungeon map rips: **Ancient
Ruins, Explorer's Crypt, Poison Moth's Lair and Dancing Dragon Dungeon**. They
are not in `assets/sheets/`. Everything in P7.5 that depends on them is
therefore not done:

- **The colour-register decision** (steps 1–3). See docs/ART-DIRECTION.md,
  "The colour register of the sheets" — the evidence that can be gathered
  without the maps is recorded there, and it is not enough to decide on. This
  is explicitly the user's call, not a session's.
- **Tiledefs for those four dungeons** (step 8). Nothing to derive them from.
  Note the EXISTING dungeon map did yield eight themes — see below — so what is
  blocked is the extra material those four would add, not the technique.
- Their entries in `MAPS` at the top of `tools/rip-dungeon-maps.py`. Adding
  them is the only change the tool needs once the files land.

## What P7.5 DID land

`tools/rip-dungeon-maps.py` exists, works, and is proven on the one stitched
full-floor map that IS in the repo, `oracle-seasons-dungeon-backgrounds.png`:

- 24389 cells scanned across 18 bands and 157 blocks, **2181 unique**.
- Output is `assets/tilesets/seasons-dungeons.png` (a 16-column deduplicated
  tileset, frequency-ordered) plus `seasons-dungeons.json`, which records for
  every tile its occurrence count and one map coordinate where it appears.
- `node tools/check-tilesets.mjs` re-runs the ripper and fails unless it is
  byte-identical, and also fails if the manifest loses its frequency counts or
  its ordering.

**The alignment trap, because it will happen again.** The first cut gridded
every band from the image's global content edge and reported 4936 unique tiles.
That number looks like a working deduplicator. It was noise: a stitched sheet
does not align its floors to a common origin, so a floor offset by 8px turns
one wall tile into a family of sixteen. The grid must start at each BLOCK's own
top-left corner — `blocks_in()` finds them by splitting each band on
all-background columns. The honest ratio is 2181/24389, and the most common
tile occurs 1244 times, which is what a wall should look like.

## Dungeon themes (P7.5 step 8) — LANDED

Eight dungeons shared one legend and therefore one look: `dFloor` and `dWall`
in a different palette, eight times. They now have eight themes, extracted from
the map by `tools/rip-dungeon-themes.py`:

| Dungeon | Floor | Wall |
|---|---|---|
| d1 Tidewash Grotto | pale scalloped flagstone | blue brick courses |
| d2 Coral Spire | blue scored flagstone | rose-bevelled blocks |
| d3 Bogwater Sanctum | gold lattice on olive | knurled gold-olive masonry |
| d4 Cliffside Cistern | sunken tan panels | cold studded wall |
| d5 Drowned Wood Shrine | amber lozenge tiling | brown brick courses |
| d6 Salt Pan Vault | bleached rosette | pale bevelled blocks |
| d7 Reef Palace | rosette flagstone | gold-studded wall |
| d8 Abyssal Keep | studded violet-black | violet capstone masonry |

**A theme is a legend, not a room edit.** `registerLegend(name, overrides,
'dungeon')` points five characters — floor, cracked floor, wall, bombable wall,
block — at themed tiles and inherits everything else. A dungeon changes its
look by changing one `legend:` field and not one character of one room grid
moves. `validate.mjs` asserts every themed tile carries EXACTLY the flags of
the shared tile it stands in for, so a theme can never change where the player
can walk.

### Three things this cost, all of which will recur

**A wall tile must tile with itself in BOTH axes.** The first cut picked
`hatchWall` and `forgeWall` for four dungeons off a single-cell contact sheet.
In game they came out as vertical stripes: both are wall RUNS, directional by
construction, and repeating one down a two-tile border reads as a picket fence.
There is no substitute for rendering a 4x4 tiling of a candidate and looking at
it. What does tile in both axes is bevelled block grids and brick courses.

**`registerPalettes` silently drops anything that is not exactly four
colours.** A flat tile can have two or three, so its palette registered
nothing, its tiledef named a palette that did not exist, and it drew in the
fallback. `validate.mjs` caught it and nothing else would have. The ripper pads
to four now. `rip-terrain.py` emits the same short arrays and has never
noticed, because it does not install its palettes.

**A tile on a room boundary carries the room frame.** Both copies of the pale
panelled flagstone on the map have a stripe of the stitcher's frame bled into
the right edge. The deduplicator cannot know that is not art — it is different
pixels, so it is a different tile, and it dedupes to itself perfectly. Always
check a pick against the contact sheet.

**And one legibility rule.** d5's floor and wall were both brick courses, so
the room read as one continuous texture with no line between what you can walk
on and what you cannot. A theme has to keep floor and wall legible before it is
allowed to be atmospheric.

## The 60-tile limit

P7.5 says to stop after the 60 most common tiles per dungeon and log the rest
here. That limit applies to the TILEDEF pass, which has not started — the
tileset and manifest carry all 2181 so the cut can be made against real
frequencies rather than re-ripped. The manifest is already in frequency order,
so "the top 60" is `doc.tiles.slice(0, 60)`.

## A tide gauge fixture (new, from P8/D1)

D1 has two rooms whose door opens only when one well reads drained and another
reads drowned (`0,4,3` and `0,1,1`). The rule is legible on paper and half
legible on screen: the two gauge tiles ARE wells, so their state is visible as
the water in them, and a plaque beside the door says what the door wants — but
nothing marks the two tiles as a matched pair, and nothing on the door shows
which of its two marks is currently satisfied.

What it wants is a small fixture: a carved mark or a float-and-chain that reads
lit/unlit, one beside each gauge and two on the door. It is a 16x16 with two
states, and it is the difference between the puzzle being read and being
stumbled into. Check `assets/sheets/oracle-seasons-tileset-subrosia.png` first —
it is the one true tileset in the repo and it carries dungeon fixtures.

Until it exists, both rooms lean on the plaque, and a session that plays them
should say whether the plaque is enough.

## The Lens shows three dark blues (new, from P8/D2)

**This is the biggest legibility problem the game has, and it was found by
looking rather than by a checker.** The Brineglass Lens draws the room at the
next tide level as a ghosted overlay. In D2's forks the player has to read that
overlay for the only question the dungeon asks: is that shaft going to be
ankle-deep water, an open hole, or over my head? The three answers are
`dWaterS`, `dPit` and `dWaterD`, and all three are dark blue. Under a
half-opacity ghost over a black pit they come out 4-6 units apart in RGB.

Measured, at three ghost opacities (mean RGB of a throat in `d2 1,2,2`; the
numbers and the command that reproduces them are in `src/data/feel.js` beside
`LENS_GHOST_ALPHA`):

| ghost | wadeable | a hole | drowning |
|---|---|---|---|
| 0.55 | (23, 33, 51) | (17, 21, 38) | (19, 27, 48) |
| 0.80 | (26, 38, 58) | (17, 21, 38) | (20, 29, 53) |
| 1.00 | (28, 40, 60) | (17, 20, 38) | (21, 30, 55) |

The opacity was raised from 0.55 to 0.80, which is a real improvement and is
not the fix. Opacity cannot separate three colours that are already the same
colour. What is genuinely different between the three on screen is TEXTURE and
MOTION — shallow water carries horizontal ripple lines and animates at rate 11,
deep water is speckled and animates at 13, a pit is flat and does not animate
at all — and a still screenshot throws all of that away. So the honest state is:

* **water vs no water reads.** A player will see which shafts fill.
* **shallow vs deep reads WEAKLY**, and that is the read D2's second fork turns
  on. It has not been watched in motion by a person.

Three things could fix it, in ascending cost:

1. **Give the ghost its own palette** rather than drawing the terrain's. The
   Lens already lays a cyan wash over the room; if the preview drew shallow
   water in a light tint and deep water in a dark one, the distinction would
   be carried by the Lens rather than borrowed from the terrain.
2. **A depth mark on the tile itself** — the source games mark a drop-off with a
   lighter lip. That is a terrain change, and it would help outside the Lens too.
3. **Sound.** Nothing in the Lens is audible.

Do not settle this from the table above. It wants a person holding the button.

## The Maku Tree and the Great Fairy are hand-drawn beside their own sheet

New from PT step 4, and cheap. `oracle-seasons-nonhuman-races.png` is extracted
from now (`tools/rip-races.py`, fourteen frames, the four peoples), and the two
biggest things on it were left behind: **the Maku Tree's face and the Great
Fairy, both at full size.** `npc_maku` is a 16x16 hand-drawn impression of an
object the source draws several cells across — the exact complaint that got the
trees rebuilt as blocks — and the Maku Tree is the character the player is sent
back to after every dungeon.

The block machinery that a multi-cell building needs already exists
(`registerBlocks`, `Room.expandBlocks`), but a Maku Tree is an ENTITY rather than
terrain, so this wants the sprite manifest's `expectedSize` route instead:
`link_hold_*` is the worked example of a frame larger than its cell and how it is
anchored. `assets/sheets/oracle-seasons-maku-tree.png` is a whole sheet of just
that character and has never been opened either.

Also still on the races sheet: the Gorons, and several more Zora and Tokay
poses — including the second walk frames that would let a townsperson stride
rather than merely turn.

## Carried over from docs/NEXT-SESSION.md

- **The `cliff` family** — one extraction covers eight tiles and cliffs are on
  most screens. A content decision, not a swap: the Oracles build a cliff from
  several tiles and this game spends one tile on all of it.
- **The `ledge` families** — four directions, nine palette variants each.
- `palm`, `pot`, `sign`, `dBlock`, `dStairs`, `spikes`, `caveMouth`.
- **Water is still hand-drawn** and is genuinely blocked: every terrain sheet
  in the repo is an assembled static map, so there is no second animation frame
  to extract. It needs a sheet that has one.
