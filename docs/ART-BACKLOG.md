# Art backlog

Work that is identified, scoped and not done. Each entry says what blocks it.


## THE SHORE IS BANKED NOW (S21) — the land/water half of the entry below is DONE

`node tools/rip-terrain.py`'s PICKS gained `bankEdgeS`/`bankCornerSE` (the
other 6 orientations are rotations/mirrors of those two — see `TRANSFORMS`),
extracted off a plain garden-pool shore at `oracle-ages-overworld.png @
50,1200 500x300`, NOT the 1400,1900 crop the S19 entry below names — that
region turned out to be Ambi's moat, a canal/lock puzzle area, not a plain
shore; see docs/HANDOFF.md's hard-won-lessons for how that was found.
`tileEdgeArt` (src/world/tileset.js) is a real 4-neighbour mask now: 4
straight edges, 4 outer corners, and (where art exists — none does yet) 4
inner corners, replacing the old "first direction wins, no corners" rule.
A tile opts in with `family` + `edgeAgainst` (`edgeAgainst: 'water'` on
`grass`/`sand`/`sandRipple`) so a bank only grows against water — grass
meeting sand or mud is UNCHANGED, still the hard rectangle the entry below
describes, and is NOT this job.

**What is still open, in order of value:**

1. **The land/land fringe (grass vs sand vs mud vs stone) is not started.**
   This is the harder half of the S19 entry below and everything in it is
   still accurate: it needs its own per-pair art (a transition cell holds
   both materials' tones) and its own palette per ordered pair.
2. **Reef and abyss water were deliberately left unbanked.** `waterSReef`/
   `waterDReef`/`waterAbyss` do not carry `family: 'water'`, on purpose —
   those regions have their own rocky shore treatment (`rockFloor`) already
   and extending the same earthen bank there was out of scope; scoping
   whether they want the same bank or a rock-specific one is undone.
3. **Inner corners have no art.** The mask supports `innerUp/Down/Left/Right`
   (a tile nearly engulfed, connected to its own mass on one side only) and
   nothing defines them, so that case degrades to a single straight edge —
   graceful, not wrong, but not what a real peninsula tip should look like.
   Nothing in the current 273 rooms appears to need one (the room-shape pass
   below would be the place to find out for certain).
4. **The regional SHAPE of the ground (CLAUDE.md's Phase 2)** — grass and mud
   drawn as organic interlocking blobs rather than axis-aligned rectangles —
   is a room-DATA problem, not an art or engine one. This session did 8 of
   the wood region's 15 screens and 7 of the marsh region's 12 (the rest of
   each region is riptide/channel/gate rooms or sits on the sea rim — see
   docs/NEXT-SESSION.md for exactly which and why they were left). Every
   other region — `cliffs`, `dunes`, `reef`, `coral`, `salt`, `abyss`,
   `coast` — was surveyed by reading every room's grid and found NOT to have
   the same shape of problem: those regions' ground pairs are mostly one
   material and its own palette variant (already solved by `tileVariant`) or
   puzzle-room floors bounded by boulders/gates rather than meadows. If a
   future pass disagrees with that read, it should say which room and why
   before touching it — this is an eyes-on judgement call, not a census.


## EVERY GROUND BOUNDARY IS A STRAIGHT PIXEL EDGE, and the shore is not blocked

Investigated in S19, and its shore/bank half is DONE as of S21 (see the entry
above this one). The land/land fringe half below is still accurate and still
not done. Read this before the S3 entry below it, which is partly wrong.

**What the source actually does, checked rather than assumed.** Three regions
were cropped and looked at:

  * `oracle-ages-overworld.png @ 300,800 640x360` — two grasses meeting. The
    boundary between the green field and the dry yellow one is a WIGGLY,
    interlocking fringe, not a rectangle. There is a real transition tile set
    there and it is static.
  * `oracle-ages-overworld.png @ 1400,1900 500x380` — land meeting water. **The
    source does not draw foam. It draws a BANK**: a brown earth strip with a
    pale rim, on the LAND side of the join, with the water butting flat against
    it. It is a hard-edged tile like any other and it does not animate.
  * `oracle-seasons-overworld-spring.png @ 1280,880` — grass meeting a dirt
    path. This one IS a hard 16px edge, and the join reads fine anyway because
    both tiles are busy, the shape is an L rather than a rectangle, and trees
    stand along it.

**So the S3 entry below is wrong about the shore.** "Water edges are BLOCKED by
the sheets" was reasoned from FOAM, which is drawn on the water side and does
animate. The source's own answer is on the land side and is as static as
`cliffTop`. That is a whole job that was written off and is not blocked.

**What is actually blocking it is the ENGINE, and it is two specific things.**

1. `tileEdgeArt` (src/world/tileset.js) takes the FIRST direction that
   matches and stops. A patch of ground is a top edge and a left edge at once,
   and there are no corner pieces — the function's own comment says so, and it
   is why `cliffTop` is the only user. A ground fringe needs the 4-neighbour
   MASK, not the first hit: 4 straight edges, 4 outer corners, 4 inner
   corners.
2. `edgeArt` names one art per direction, with no way to say *which neighbour*.
   Grass meeting sand and grass meeting mud are different pictures. And a
   transition cell holds BOTH materials' tones, so it needs a combined
   palette — one tiledef binds one palette, so each ordered pair wants its own
   (`grasssand`, `grassmud`, ...). That is data, not a limitation, but it is
   what makes this per-PAIR rather than per-ground and therefore large.

**Do not ship a partial one.** Softening grass/sand while mud/grass and
stone/grass stay rectangular is worse than the uniform hard edge, for the same
reason S3 gives for one-sided foam: the eye reads the inconsistency
immediately. The job is one session's work for the mask autotiler plus one
pair, and the pairs that actually occur should be counted first
(`tools/oneshot/find-ground-specks.mjs` already walks every cell of every
screen and knows what meets what — it groups by PALETTE, which is the same
question).

**What was fixed instead this session:** nothing here. The pot was extracted
and the six Essences were given six icons (both were on this list); the ground
joins were investigated, scoped and left, and the scoping above is the
deliverable.


## S3 left these: water edges, tree borders, and the cliff corner set

S3 extracted `cliff` and `cliffTop` from Seasons' terraced cliffs and built the
autotiler (`family` + `edgeArt`) that draws the lip from the neighbours. What it
found and did not do:

**Water edges (S3 job 2) are BLOCKED by the sheets, not by effort.** The
mechanism is now in place and would fit exactly — `Room.artAt` resolves the tide
before it compares families, so a derived shoreline would be correct at all
three tide levels automatically, which is the property the job asks for and the
reason the existing `foamN` was never placed in a single legend (a foam tile
placed by hand is wrong at two levels out of three). **The blocker is that the
water is ANIMATED and every sheet in `assets/sheets/` is a static map** —
`rip-terrain.py`'s header has said so since it was written: "The sheets are
static maps and hold no second frame, so water stays hand-drawn." Foam for four
directions at three frames each cannot be extracted from them. Either a sheet
with animation frames has to be found, or the foam has to be drawn to match
(`T24`), which is `R5`'s second branch. **Do not ship a one-sided foam edge**:
50 of the 52 static water cells in the overworld touch land, and foam on the
north side only is the same "reads wrong immediately" failure the prompt warns
about for cliffs without inside corners.

**Tree borders (S3 job 3): the premise does not survive checking the source.**
The job is to "break the period", and the source games do not. Crops of Seasons'
own forests show **every tree identical and repeating**, spaced across the
ground rather than packed. So giving our trees varied crowns would be a
deviation from the source, and `R9` says fidelity wins. What IS different is
that our rooms pack identical trees shoulder to shoulder into an unbroken wall
while the source spaces them and mixes other objects in — **that is a room-data
question across 1,000+ cells, not an extraction one**, and it carries the full
`T10` stranding risk, so it wants its own session with the floods run after
every batch. The 32x32 constraint recorded at `tiles-core.js` is real and
confirmed: every tree on every sheet is 32x32, and 643 of this game's vertical
tree runs are one row tall, so a quad tree cannot be used for them. (The `QUADS`
machinery in the ripper is empty and **the `quad` field it describes does not
exist in the engine at all** — `registerTiles` never named it, which is `T15`
again. Either implement it or delete the comment.)

**The cliff corner set is still missing, and now it shows more.** S3 added the
top lip only. `tileEdgeArt` takes any of up/down/left/right and returns the
first that matches, so sides are a data change away — but a cliff with a top and
sides and no CORNER piece reads wrong at every turn, and the corners on the
Seasons sheet are structural (they include the map's own void beyond the
cliff) rather than clean reusable cells. Picking them needs a region where a
cliff turns a corner against ordinary ground on both sides. Use
`rip-terrain.py --phase` over that region first: the whole-sheet phase is wrong
(`T64`).


## S2 left these: what the sheets could NOT cover for the ground pass

S2 extracted `grass` (Seasons' own field grass) and `grassClump`, retired the
hand-drawn `grass`, and gave `grass`/`grassDark`/`grassBog` a one-in-seven
scatter. What it looked for and did not find:

**`rockFloor` has no partner on any sheet, and it grids.** It is `g` in the
reef, cliffs and abyss legends, so it is a large-area ground, and rendered as a
whole room its cobble motif repeats visibly (see the ground montage in S2's
`docs/NEXT-SESSION.md` entry). It is a full four-tone tile — 23/26/24/25 across
the palette indices — and **nothing on any sheet in `assets/sheets/` shares that
profile**; every floor candidate found is three-tone. Either a fourth tone has
to be found, or `rockFloor` needs a second cell drawn to match (`T24`), which is
`R5`'s "if no sheet has it" branch and wants a person's eye. This is the biggest
remaining piece of the grid.

**`dFloor` has a tonal match that is a MOTIF mismatch, and it was reverted.**
`oracle-seasons-dungeon-backgrounds.png @ 258,42` profiles at 34/50/14 against
`dFloor`'s 27/53/18 — the closest partner found anywhere. It was extracted,
wired at one-in-nine and **backed out**: `dFloor` is a scallop and 258,42 is a
diagonal streak, so scattered through a floor it read as random patches rather
than as masonry. Recorded here with its coordinates so the next session does not
re-hunt it. **The lesson generalises: matching tone is necessary and not
sufficient — the motif has to match too**, and no number catches that.

**A pale grass and a dark grass exist and are not variants of ours.** The scans
found two more coherent grass families the game does not use: an index-0
dominant *pale tuft* field (`sp 2374,1378`, `sp 1289,400`, `ow 854,549`, `sp
1450,1` — all 81/13/5) and an index-2 dominant *dense blade* field (`sp
1047,565`, `sp 1321,936`, `ow 1820,1194` — all 5/45/49). Neither can be
scattered into our `grass`, whose dominant index is 1: a variant with a
different dominant tone reads as a patch, not as variation. They are whole
REGIONAL grasses — a bright meadow and a dark wood floor — and that is an S3
question about what regions should look like, not an S2 one.

**Sand, `sandWet`, `sandRipple` and `mud` were measured and deliberately left
alone.** Rendered at room scale they are fine-grained enough that no lattice
appears; they are already extracted, and there was nothing to fix. Changing them
would have been churn.


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

## The cliff family — the survey is done, the decision is not

PT step 5's big item, and a session spent the expensive half of it: **finding
the art.** What follows is the survey, so the session that does the cliffs
starts at the design question rather than at a sprite sheet.

**The source is `assets/sheets/oracle-ages-overworld.png` at phase (2, 8)** —
the same phase `rock` and `bush` were taken at, verified against them
(418 mod 16 = 2, 936 mod 16 = 8). Labrynna Present is built almost entirely out
of cliff edges, so every case appears in situ rather than as a palette a ripper
has to guess the arrangement of. A complete run, checked against a grid overlay:

| Piece | Cell | What it is |
|---|---|---|
| N lip, interior | 402, 248 | the bright blue-white band, then rock |
| face, interior | 402, 264 | the repeating middle course |
| S foot, interior | 402, 280 | the base course, meeting ground below |
| NW corner | 386, 248 | the rounded outside corner |
| W edge | 386, 264 | |
| SW corner | 386, 280 | |
| a W-facing lip | 450, 280 | the vertical band, for a mass whose left side is the drop |
| an E edge against water | 466, 392 | |

`node tools/preview.mjs --tiles --scale=2` shows what the game has instead: one
`cliff` art, a texture of stone courses, palette-swapped eight ways
(`cliffDk`, `cliffSand`, `cliffRust`, `cliffCoral`, `cliffMarble`, `cliffAbyss`,
`cliffCracked`, plus `cliffTop`, which is the only piece an author places by
hand and the only one that admits a cliff has a top).

**THE DECISION, and it is the reason this is not a swap.** The Ages cliff is a
PLATEAU EDGE — a drop seen from above, with its bright lip on the side you would
fall off. This game's cliff is a WALL seen from the front. Those are different
objects and no coordinate list settles which one Thalassia has. Two honest
answers:

1. **Autotile the existing tiles.** A tiledef carries a `family`, the room picks
   the piece from which orthogonal neighbours share that family (off-room counts
   as SAME, so a cliff running off a seam grows no lip), and every screen in the
   game gains lips and corners with **no screen re-authored and no flag
   changed** — which is what makes it safe, because a cliff is F.SOLID and a
   solid tile severs screens. Needs the full 16-mask table, so it needs the four
   corner pieces above plus their mirrors, and `registerTiles` must be taught the
   new field IN THE SAME COMMIT (the `liftLevel` trap).
2. **Re-author by hand**, giving authors a vocabulary of named pieces. Truer to
   how the Oracles' own maps are built, and it is 120 screens of work with a
   connectivity checker to run after each one.

Option 1 is the recommendation. It is one function, it is testable against every
existing screen at once, and option 2 stays available on top of it.

## Carried over from docs/NEXT-SESSION.md

- **The `cliff` family** — surveyed above; the decision is what is left.
- **The `ledge` families** — four directions, nine palette variants each.
- ~~All six Essences share one orb~~ **DONE** (S19). They are six BELLS now:
  one silhouette — same loop, same rim, same clapper, so a row of them reads as
  a set — with a different mark on the body, which is the only part that
  varies and therefore the part that is legible at 16 pixels. Tide lines, a
  coral sprig, a bog reed, a terrace of steps, a ribbon of kelp, a crown, in
  that order, matching what the six are already CALLED in `src/data/story.js`.
  `p_tidebell_0/_1` is the unmarked bell the ending card holds up: six marked
  bells become one plain one. Hand-drawn — no sheet has our Essence — and the
  story cards had to be given `pal: 'essence'` explicitly, because the old orb
  used only index 0 and looked white in whatever palette it landed in.
- `sign`, `dBlock`, `dStairs`, `spikes`. Not found on a sheet yet; the
  Subrosia tileset is the one to mine, being the only true tileset in the repo.
- ~~`pot`~~ **DONE** (S19) — the Seasons dungeon backgrounds at 900,42, a PROP
  in `tools/rip-terrain.py`. It was NOT on the Subrosia tileset and that is why
  two sessions looked and did not find it: it is on the DUNGEON sheet, in rows
  of six against the ice room's north wall, and it was found by colour rather
  than by the seamless scan (a prop does not repeat, which is the definition of
  a prop). The hand-drawn one was a brown SPHERE — a circle with a highlight,
  no lip, no shoulder, no base — in 21 placements across the dungeons.
- ~~`caveMouth`~~ **DONE** — the Subrosia tileset at 176,1632, a full-cell PICK
  in `tools/rip-terrain.py`. The hand-drawn one was a rectangular frame with a
  hole in it and is on record as the reason three doors in a row once read as
  holes in the grass.
- **`palm` is 32x32, like every Oracle tree** — the Subrosia tileset at
  96,1616 through 127,1647, four cells on sand. It cannot be a straight swap:
  `palm` is one tile on the `dunes` legend's `T`, so taking the real one means
  making it a BLOCK (`registerBlocks` exists now) and re-authoring every dunes
  screen. Same shape of problem as the cliff below.
- **Water is still hand-drawn** and is genuinely blocked: every terrain sheet
  in the repo is an assembled static map, so there is no second animation frame
  to extract. It needs a sheet that has one.
