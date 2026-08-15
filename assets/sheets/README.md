# Source sprite sheets

**These sheets are the canonical reference for every visual in this project**,
including assets drawn from scratch — see `docs/ART-DIRECTION.md` for the rules
they impose.

Reference sheets the extraction tools in `tools/` read from. They are committed
so the extractions are reproducible in any checkout — `tools/rip-link.py` and
`tools/rip-npcs.py` resolve paths here relative to the repo root, and both
regenerate byte-identical output.

| File | Game | Ripped by | Tool | Generates |
|---|---|---|---|---|
| `oracle-ages-link.png` | Oracle of Ages | Mister Mike | `tools/rip-link.py` | `src/data/sprites-player.js` — 40 Link frames |
| `oracle-seasons-npcs.png` | Oracle of Seasons | Trailsdegamer | `tools/rip-npcs.py` | `src/data/sprites-npcs.js` — 9 NPC sprites |
| `oracle-seasons-enemies.png` | Oracle of Seasons | Mister Mike | `tools/rip-enemies.py` | `src/data/sprites-enemies.js` — 56 enemy sprites |
| `oracle-seasons-hud-gear.png` | Oracle of Seasons | Mister Mike | `tools/rip-hud.py` | `src/data/sprites-hud.js` |
| `oracle-seasons-dungeon-backgrounds.png` | Oracle of Seasons | Mister Mike | `tools/rip-terrain.py`, `tools/rip-dungeon-maps.py`, `tools/rip-dungeon-themes.py` | `src/data/tiles-terrain.js` — dungeon ground; `assets/tilesets/seasons-dungeons.*` — the deduplicated full-floor tileset; `src/data/tiles-dungeon-themes.js` — the eight per-dungeon themes |
| `custom-oracle-style-overworld.png` | fan-made, Oracle style | community edit | `tools/rip-terrain.py` | `src/data/tiles-terrain.js` — overworld ground |
| `oracle-ages-overworld.png` | Oracle of Ages | *unattributed — see below* | `tools/rip-terrain.py` | `src/data/tiles-terrain.js` — overworld props, and the whole cliff family |
| `oracle-seasons-tileset-subrosia.png` | Oracle of Seasons | KOOLKID6789 | `tools/rip-terrain.py` | `src/data/tiles-terrain.js` — the whole town kit |
| `oracle-seasons-overworld-spring.png` | Oracle of Seasons | Mister Mike | — | not yet extracted from — Holodrum, spring |
| `oracle-seasons-overworld-winter.png` | Oracle of Seasons | Mister Mike | — | not yet extracted from — Holodrum, winter palette |
| `oracle-seasons-maku-tree.png` | Oracle of Seasons | Mister Mike | — | not yet extracted from |
| `oracle-seasons-fairies.png` | Oracle of Seasons | Mister Mike | — | not yet extracted from |
| `oracle-seasons-effects.png` | Oracle of Seasons | Darth RPG | — | not yet extracted from |
| `oracle-seasons-title-screen.gif` | Oracle of Seasons | Tails585 | — | reference only |
| `oracle-seasons-nonhuman-races.png` | Oracle of Seasons | Mister Mike | `tools/rip-races.py` | `src/data/sprites-races.js` — 14 frames, the four peoples |
| `oracle-seasons-trading-characters.png` | Oracle of Seasons | Mister Mike | — | not yet extracted from |

**`oracle-seasons-tileset-subrosia.png` is the only true TILESET here** — 16
cells wide, 163 tall, phase 0, with all four seasons banded down it. Everything
else is an assembled map you have to find the grid phase in. Reach for the
tileset first: picking a tile off it is reading a grid reference, not a survey.

### The town kit on that tileset

It carries a complete set of village furniture that this project has barely
touched — only the tree has been taken off it. Coordinates are (column, row) in
16px cells, so the pixel address is (col*16, row*16).

| What | Cells | Notes |
|---|---|---|
| Blue **SHOP** building | c4-c6, r7-r9 | 3 wide; roof r7-r8, signed wall r9 |
| Green-roof building | c7-c9, r7-r8 | roof only — build the wall row from below |
| Red-roof building | c10-c12, r7-r8 | as above |
| Door, shut | c7, r9 | a panelled door in a dark wall |
| Open doorway (enterable) | c8, r9 | the black one — this is the warp tile |
| Window | c9, r9 | |
| Twin posts / barrels | c10, r9 | |
| Crates | c11-c12, r9 | two different stacks |
| Stone well | c13-c14, r8-r9 | 2x2 |
| Stump / table | **c7-c9, r10-r11** | 3x2, cell-aligned; NOT c5 |
| Paling fence | **c11, r11-r12** | 1x2, repeats side by side |
| Picket fence | c3-c7, r32 | the WINTER band's fence, in snow colours |
| Pots and barrels | c12-c15, r30-r32 | also the winter band |

**Two of those coordinates were wrong** and are corrected above: the stump is
three cells wide at c7-c9 and the spring band's fence is the wooden paling at
c11, not the snow-topped picket at r32. Both were found by measuring the
objects' bounding boxes rather than by eye, which is worth doing before adding
a pick — several of these objects do not sit where a glance at the sheet says.

**All of it is extracted** by `tools/rip-terrain.py` (the `TOWN` table) into
`src/data/tiles-terrain.js`, which is GENERATED. A building comes out as a
BLOCK — one object several cells across, placed by a room grid as a rectangle
of one legend character. Unlike the ground picks in the same tool, the town
kit INSTALLS its palettes: this game had never drawn a roof, so there was no
palette to preserve and the cartridge's own colours are what make a blue shop
read as the source's blue shop.

**The furniture repeats per season**, same columns, at r7-r9 (spring), r17-r19
(autumn) and r27-r29 (winter), plus further bands down the sheet. This game has
no seasons — it has tides — so the bands are a **palette** resource: the same
building in four moods, which is exactly what a region-tinted village wants.

**A building is not a tile**, and the engine agrees: `registerBlocks` in
`src/world/tileset.js` and `Room.expandBlocks` in `src/world/room.js` place a
building as a RECTANGLE OF ONE LEGEND CHARACTER. The `quad:` machinery this
paragraph used to point at was never on trunk — blocks replaced it and cover the
2x2 tree case too.

### The peoples on the races sheet

`oracle-seasons-nonhuman-races.png` is the other half of a lived-in town, and
`tools/rip-races.py` now takes fourteen frames off it. **Its geometry is not the
one the other rippers use:** the sprite area is a grid of 16x16 frames on WHITE
cell backings laid over the sheet's green, at a pitch of 17. So a frame carries
two background colours and neither can be sniffed from a corner — both are
flooded inward from the frame's border, which is also what keeps a colour the
sprite encloses.

| Frames | Cells (x, y in pixels) | Used for |
|---|---|---|
| Hood, front / back / side | (815, 630) (832, 630) (849, 630) | the Salters |
| The same hood in green | (815, 601) (832, 601) (849, 601) | the Kelpers |
| The same hood, red and blue | (1215, 635) (1249, 635) | crowd, front only |
| Capped seafarer, front / back | (815, 555) (985, 555) | the Brinekin |
| Kerchiefed woman | (917, 555) | the scrimshander |
| Speckled reptile, three | (815, 653) (900, 653) (951, 653) | the Reefkin |

**The side frames on this sheet face LEFT** and are flipped on the way out; the
engine mirrors `_s` and never draws a left-facing frame. **One hood in four
colours is four peoples** — the source games' own palette-swap trick, and the
reason a town on that cartridge is full of faces without being full of drawings.
Still untouched on this sheet: the Maku Tree, the Great Fairy, the Gorons, and
several more Zora and Tokay poses.

`oracle-ages-overworld.png` is the Labrynna Present outdoor background, True
Colors half, and it is **the real overworld reference** — the one to reach for
after the tileset. `custom-oracle-style-overworld.png` is a fan-made assembled map and its
props are merged into masses; the Ages sheet has standalone props on a strict
16px grid at phase (2, 8), which is what makes them extractable at all. It was
supplied without a ripper credit in its filename; it is from
spriters-resource.com like the others, and the credit should be filled in here
if anyone finds it rather than guessed at.

**It is a stitched MAP, and the stitcher left screen guides in it.** A one-pixel
green (`#008000`) line sits at every screen boundary, and it is INSERTED rather
than drawn over: everything below one is shifted a pixel down, so a course that
runs on an 8px pitch above the line runs on 8px below it and 9px across it. A
window that straddles a guide takes a green row into the game. `y = 258` is the
one in the cliff band; the cliff picks in `tools/rip-terrain.py` are all chosen
clear of it, which is why the face is taken at 259 and not at 258.

**The cliff family comes off it**, at the same phase the props do. The three
rectangles and the ASCII dump that verified them are documented at "THE CLIFF
FAMILY" in `tools/rip-terrain.py`; the design decision they answer is in
`docs/ART-BACKLOG.md`.

**Extract rather than redraw.** If one of these sheets has the thing you need,
take it from the sheet — fidelity to the source is the point of the project,
and an extraction is reproducible where a hand-drawing drifts. The two sheets
still marked "not yet extracted from" are opportunities, not exclusions. See
`docs/ART-DIRECTION.md` for the rule and `docs/briefs/AGENTS.md` section J for
the workflow.

**Everything above is generated output.** Edit the tool's coordinate map and
re-run it; never hand-edit the file it writes.

All obtained via spriters-resource.com. Most sheets carry two halves: "GBC LCD
Colors" simulates the handheld screen, "True Colors" is the raw palette. The
extraction tools read the True Colors half.

## Credit

The per-sheet ripper credits in the table above are the one thing to preserve:
those people did the work of pulling this art off the cartridge and asked to be
named for it. Keep the column filled in, and fill in the one that is missing if
anyone ever identifies it.
