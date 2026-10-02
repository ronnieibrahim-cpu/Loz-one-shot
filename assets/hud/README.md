# Source status-bar graphics

`oracles-disasm/seasons/` holds files copied verbatim from Stewmath's Oracle of
Seasons disassembly, **github.com/Stewmath/oracles-disasm**
(commit 21c924afdc8a13225e849214479d5113da2ec226). Credit to that project and
its contributors, who took the cartridge apart; the artwork is Nintendo's and
Capcom's. Fan-work use only — the same copyright note as
`assets/sheets/README.md` applies.

The "L-1"/"L-2" beside a levelled item, the two-digit count beside a counted
one, the rupee count and the dungeon's key x count are all written in the
status bar's own bold font, which no sheet in `assets/sheets/` carries as
tiles. `tools/rip-hud-tiles.py` cuts them and writes
`src/data/sprites-hud-tiles.js`; `tools/check-rippers.mjs` proves the rip
reproduces byte for byte.

| File | From | Used for |
|---|---|---|
| `gfx_hud.png` | `gfx_compressible/seasons/` | the status bar's tiles (GFXH_HUD, $9000): digits $10-$19, "L-" $1a, "x" $1b |
| `gfx_key_orechunk.png` | `gfx/seasons/` | the key tile Seasons copies over the rupee's in a dungeon (bank2.s @loadMoneyGraphic) |
| `gfx_inventory_hud_1.png` | `gfx_compressible/seasons/` | the inventory's cursor brackets, sprite tile $0c (GFXH_INVENTORY_SCREEN at $8000; bank2.s inventorySubscreen0_drawCursor) |
| `paletteData.s` | `data/seasons/` | the status bar's palette (paletteData4830, PALH_0a) |
| `treasureDisplayData.s` | `data/seasons/` | which items show a level (b5 $00) and which a count ($01) — read by people, not the ripper |

The rules the game follows, from code/bank2.s (not copied: it is 9000 lines):
`drawTreasureExtraTiles` writes the two tiles; `drawTreasureDisplayDataToBg`
puts them one row down and one tile right of the item in the inventory;
`loadStatusBarMap` and `drawHeartDisplay` switch to eight hearts a row, and the
squeezed bar, once max health passes 14 hearts (`cp 14*4+1`).
