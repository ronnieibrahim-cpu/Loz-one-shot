# Art backlog

Work that is identified, scoped and not done. Each entry says what blocks it.

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

## The 60-tile limit — where the cut actually fell

P7.5 says to stop after the 60 most common tiles and log the rest here. The
tiledef pass took **21 tiles, 14 of them from the top 60**; the other 7 are
lower-frequency walls and props chosen on purpose, because frequency finds
FLOORS (a floor covers a room) and the rarer entries are where the masonry and
the set dressing live.

The remaining **2160** tiles are not lost and do not need re-ripping: they are
all in `assets/tilesets/seasons-dungeons.png` with their counts and one map
coordinate each in the matching `.json`, in frequency order. "The top 60" is
`doc.tiles.slice(0, 60)`.

The untaken half of that top 60 is the first place P8 should look. Each row is
index, occurrences, and the coordinate on
`oracle-seasons-dungeon-backgrounds.png` to pass to `rip-dungeon-themes.py`:

| idx | count | at | |
|---|---|---|---|
| 0 | 1244 | 1986,42 | TAKEN |
| 1 | 1243 | 531,42 |  |
| 2 | 1196 | 531,1290 | TAKEN |
| 3 | 1196 | 1986,1290 |  |
| 4 | 1164 | 756,154 |  |
| 5 | 1038 | 81,2799 | TAKEN |
| 6 | 1037 | 1536,2799 |  |
| 7 | 710 | 49,42 |  |
| 8 | 710 | 1504,42 |  |
| 9 | 636 | 884,1104 |  |
| 10 | 574 | 932,1120 |  |
| 11 | 494 | 868,1104 |  |
| 12 | 424 | 900,1104 |  |
| 13 | 324 | 611,1467 |  |
| 14 | 324 | 2066,1467 | TAKEN |
| 15 | 298 | 17,26 |  |
| 16 | 298 | 1472,26 |  |
| 17 | 296 | 17,186 |  |
| 18 | 296 | 1472,186 |  |
| 19 | 270 | 483,1290 |  |
| 20 | 270 | 1938,1290 |  |
| 21 | 266 | 17,58 | TAKEN |
| 22 | 266 | 1472,58 |  |
| 23 | 236 | 2002,1708 | TAKEN |
| 24 | 235 | 547,1708 |  |
| 25 | 232 | 515,1740 |  |
| 26 | 223 | 547,1434 | TAKEN |
| 27 | 223 | 2002,1434 |  |
| 28 | 209 | 499,1274 | TAKEN |
| 29 | 209 | 1954,1274 |  |
| 30 | 206 | 707,1290 |  |
| 31 | 206 | 2162,1290 |  |
| 32 | 202 | 2114,42 |  |
| 33 | 201 | 659,42 | TAKEN |
| 34 | 196 | 1,42 | TAKEN |
| 35 | 196 | 1456,42 |  |
| 36 | 195 | 225,42 |  |
| 37 | 195 | 1680,42 |  |
| 38 | 135 | 242,203 | TAKEN |
| 39 | 135 | 1697,203 |  |
| 40 | 134 | 258,927 |  |
| 41 | 120 | 531,1628 |  |
| 42 | 120 | 1986,1628 |  |
| 43 | 94 | 756,1290 | TAKEN |
| 44 | 94 | 2211,1290 |  |
| 45 | 89 | 581,2336 |  |
| 46 | 89 | 2036,2336 |  |
| 47 | 80 | 900,42 | TAKEN |
| 48 | 80 | 2355,42 |  |
| 49 | 73 | 547,1338 |  |
| 50 | 73 | 2002,1338 |  |
| 51 | 72 | 884,396 |  |
| 52 | 65 | 740,1499 | TAKEN |
| 53 | 65 | 2195,1499 |  |
| 54 | 64 | 418,122 |  |
| 55 | 64 | 1873,122 |  |
| 56 | 56 | 1238,2191 |  |
| 57 | 56 | 2693,2191 |  |
| 58 | 50 | 17,42 |  |
| 59 | 47 | 242,299 |  |

**Before taking any of them, render a 4x4 tiling and look at it.** Roughly a
third of the high-frequency entries are directional wall runs or carry a stripe
of the stitched map's room frame, and neither is visible in a single cell. Both
traps are written up above.

## What P7.5 step 8 decided about each thing on its list

The brief names floor, wall, pit, water, block, stairs and door. All seven have
an answer now, and three of them are "deliberately not themed":

| | |
|---|---|
| floor, wall, block | themed, extracted, eight ways |
| stairs, door (closed/open) | themed as PALETTE SWAPS of the shared art — a door's silhouette must be recognisable instantly in all eight dungeons; only the stone around it takes the colour |
| pit | NOT themed. A hole is absence, not masonry, and must look identical everywhere so the player never re-learns what a fall looks like |
| water | BLOCKED, not declined. `dWaterS`/`dWaterD` are animated and every terrain sheet here is a static map with no second frame |
| locked and boss doors | NOT themed. Gold in all eight: a gameplay signal before scenery, and a themed lock makes "you need a key" something you read per dungeon |

## Carried over from docs/NEXT-SESSION.md

- **The `cliff` family** — one extraction covers eight tiles and cliffs are on
  most screens. A content decision, not a swap: the Oracles build a cliff from
  several tiles and this game spends one tile on all of it.
- **The `ledge` families** — four directions, nine palette variants each.
- `palm`, `pot`, `sign`, `dBlock`, `dStairs`, `spikes`, `caveMouth`.
- **Water is still hand-drawn** and is genuinely blocked: every terrain sheet
  in the repo is an assembled static map, so there is no second animation frame
  to extract. It needs a sheet that has one.
