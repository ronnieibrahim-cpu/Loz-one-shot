# Source graphics for the map screens

`oracles-disasm/` holds files copied verbatim from Stewmath's Oracle of Seasons
and Oracle of Ages disassembly, **github.com/Stewmath/oracles-disasm**
(commit 21c924afdc8a13225e849214479d5113da2ec226). Credit to that project and
its contributors, who took the cartridges apart; the artwork is Nintendo's and
Capcom's. Fan-work use only — the same copyright note as
`assets/sheets/README.md` applies.

`tools/rip-map.py` reads these files and writes `src/data/screens-map.js`
(Seasons' overworld and dungeon map screens, code/bank2.s runMapMenu, and the
dungeon name box); `tools/check-rippers.mjs` proves the rip reproduces byte
for byte. `src/data/sprites-map-drawn.js` holds the two letters no box on
either cartridge has (K, V), drawn to match.

| File | From | Used for |
|---|---|---|
| `seasons/gfx_minimap_tiles_holodrum_1.png`, `_2.png`, `map_holodrum_minimap.bin`, `flg_holodrum_minimap.bin` | `gfx_compressible/seasons/` | the sky row over the map, and the square over a screen not yet visited |
| `seasons/spr_minimap_icons.png` | `gfx_compressible/seasons/` | Link's arrow, the corner popup's frame and pictures |
| `seasons/gfx_minimap_tiles_dungeon.png`, `map_dungeon_minimap.bin`, `flg_dungeon_minimap.bin` | `gfx_compressible/common/` | the dungeon map's frame, rooms, floor list and cursors (and the overworld cursor) |
| `seasons/spr_map_compass_keys.png` | `gfx_compressible/seasons/` | the Map, compass, Boss Key and small key on the dungeon map |
| `seasons/gfx_blurb_d1`-`d8`, `heroscave.png` | `gfx_compressible/seasons/` | the name box, its "L - n" lines and letters |
| `seasons/gfx_blurb_roomofrites.png` | `gfx_compressible/common/` | letters (the only lowercase f) |
| `ages/gfx_blurb_d2`-`d6`, `d8`, `blacktowerturret`, `makupath.png` | `gfx_compressible/ages/` | letters (B, T, b, ...) |
| `ages/gfx_minimap_tiles_present_1.png`, `_common.png`, `_present_2.png`, `map_present_minimap.bin`, `flg_present_minimap.bin` | `gfx_compressible/ages/` | the open sea round the overworld map |
| `seasons/paletteData.s`, `paletteHeaders.s`; `ages/` the same | `data/seasons/`, `data/ages/` | PALH_07, PALH_09, PALH_0f |
