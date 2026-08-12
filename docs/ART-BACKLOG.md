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

## Carried over from docs/NEXT-SESSION.md

- **The `cliff` family** — one extraction covers eight tiles and cliffs are on
  most screens. A content decision, not a swap: the Oracles build a cliff from
  several tiles and this game spends one tile on all of it.
- **The `ledge` families** — four directions, nine palette variants each.
- `palm`, `pot`, `sign`, `dBlock`, `dStairs`, `spikes`, `caveMouth`.
- **Water is still hand-drawn** and is genuinely blocked: every terrain sheet
  in the repo is an assembled static map, so there is no second animation frame
  to extract. It needs a sheet that has one.
