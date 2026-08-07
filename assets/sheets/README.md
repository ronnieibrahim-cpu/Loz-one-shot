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
| `oracle-seasons-dungeon-backgrounds.png` | Oracle of Seasons | Mister Mike | `tools/rip-terrain.py`, `tools/rip-dungeon-maps.py` | `src/data/tiles-terrain.js` — dungeon ground; `assets/tilesets/seasons-dungeons.*` — the deduplicated full-floor tileset |
| `custom-oracle-style-overworld.png` | fan-made, Oracle style | community edit | `tools/rip-terrain.py` | `src/data/tiles-terrain.js` — overworld ground |
| `oracle-ages-overworld.png` | Oracle of Ages | *unattributed — see below* | `tools/rip-terrain.py` | `src/data/tiles-terrain.js` — overworld props |
| `oracle-seasons-tileset-subrosia.png` | Oracle of Seasons | KOOLKID6789 | `tools/rip-terrain.py` | `src/data/tiles-terrain.js` — the tree |
| `oracle-seasons-overworld-spring.png` | Oracle of Seasons | Mister Mike | — | not yet extracted from — Holodrum, spring |
| `oracle-seasons-overworld-winter.png` | Oracle of Seasons | Mister Mike | — | not yet extracted from — Holodrum, winter palette |
| `oracle-seasons-maku-tree.png` | Oracle of Seasons | Mister Mike | — | not yet extracted from |
| `oracle-seasons-fairies.png` | Oracle of Seasons | Mister Mike | — | not yet extracted from |
| `oracle-seasons-effects.png` | Oracle of Seasons | Darth RPG | — | not yet extracted from |
| `oracle-seasons-title-screen.gif` | Oracle of Seasons | Tails585 | — | reference only |
| `oracle-seasons-nonhuman-races.png` | Oracle of Seasons | Mister Mike | — | not yet extracted from |
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
| Door | c7, r9 | |
| Open doorway (enterable) | c8, r9 | the black one — this is the warp tile |
| Window | c9, r9 | |
| Twin posts / barrels | c10, r9 | |
| Crates | c11-c12, r9 | |
| Stone well | c13-c14, r8-r9 | 2x2 |
| Stump / table | c5, r10-r11 | |
| Picket fence | c3-c7, r32 | a run, not one tile |
| Pots and barrels | c12-c15, r30-r32 | |

**The furniture repeats per season**, same columns, at r7-r9 (spring), r17-r19
(autumn) and r27-r29 (winter), plus further bands down the sheet. This game has
no seasons — it has tides — so the bands are a **palette** resource: the same
building in four moods, which is exactly what a region-tinted village wants.

**A building is not a tile.** Three wide and two-to-three tall, the same problem
the 32x32 trees had and solved with the `quad:` machinery in `tools/rip-terrain.py`
and `src/world/tileset.js`. A 3x3 block needs that generalised, not worked
around by cutting a building into nine unrelated tiles.

`oracle-seasons-nonhuman-races.png` is the other half of a lived-in town: the
Maku Tree, the Great Fairy, and rows of Subrosian, Goron, Zora and Tokay NPCs.
Nothing has been extracted from it yet.

`oracle-ages-overworld.png` is the Labrynna Present outdoor background, True
Colors half, and it is **the real overworld reference** — the one to reach for
after the tileset. `custom-oracle-style-overworld.png` is a fan-made assembled map and its
props are merged into masses; the Ages sheet has standalone props on a strict
16px grid at phase (2, 8), which is what makes them extractable at all. It was
supplied without a ripper credit in its filename; it is from
spriters-resource.com like the others, and the credit should be filled in here
if anyone finds it rather than guessed at.

**Extract rather than redraw.** If one of these sheets has the thing you need,
take it from the sheet — fidelity to the source is the point of the project,
and an extraction is reproducible where a hand-drawing drifts. The two sheets
marked "not yet extracted from" are opportunities, not exclusions. See
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
