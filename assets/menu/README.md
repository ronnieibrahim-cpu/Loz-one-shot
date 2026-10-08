# Source graphics for the inventory pages

`oracles-disasm/seasons/` holds files copied verbatim from Stewmath's Oracle of
Seasons disassembly, **github.com/Stewmath/oracles-disasm**
(commit 21c924afdc8a13225e849214479d5113da2ec226). Credit to that project and
its contributors, who took the cartridge apart; the artwork is Nintendo's and
Capcom's. Fan-work use only — the same copyright note as
`assets/sheets/README.md` applies.

`tools/rip-menu.py` reads these files and writes `src/data/screens-menu.js`
(Seasons' three inventory pages, code/bank2.s inventoryMenuState0 and
func_02_55b2); `tools/check-rippers.mjs` proves the rip reproduces byte for
byte.

| File | From | Used for |
|---|---|---|
| `gfx_inventory_hud_1.png`, `gfx_inventory_hud_2.png` | `gfx_compressible/seasons/` | the page's paper, frame, dividers, heart box and digits ($8000, $8e00) |
| `gfx_save.png` | `gfx_compressible/common/` | page 3's SAVE button ($8600) |
| `map_*`, `flg_*` (inventory_screen_1, _2, textbar) | `gfx_compressible/common/` | pages 1 and 2 and the text bar: tile and attribute maps |
| `map_inventory_screen_3.bin`, `flg_inventory_screen_3.bin` | `gfx_compressible/seasons/` | page 3 |
| `gfxHeaders.s`, `paletteHeaders.s`, `paletteData.s` | `data/seasons/` | where each file lands (GFXH_INVENTORY_SCREEN), and PALH_0a |
