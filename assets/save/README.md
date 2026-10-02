# Source graphics for the save screen and the game over

`oracles-disasm/seasons/` holds files copied verbatim from Stewmath's Oracle of
Seasons disassembly, **github.com/Stewmath/oracles-disasm**
(commit 21c924afdc8a13225e849214479d5113da2ec226). Credit to that project and
its contributors, who took the cartridge apart; the artwork is Nintendo's and
Capcom's. Fan-work use only — the same copyright note as
`assets/sheets/README.md` applies.

Seasons' game over is its save-and-quit screen with the banner swapped and
the palette changed (code/bank2.s runSaveAndQuitMenu). `tools/rip-save.py`
reads these files and writes `src/data/screens-save.js`;
`tools/check-rippers.mjs` proves the rip reproduces byte for byte.

| File | From | Used for |
|---|---|---|
| `gfx_fileselect.png`, `gfx_hud.png`, `spr_fileselect_decorations.png` | `gfx_compressible/common/`, `gfx_compressible/seasons/` | the bark frame, and the leaves and acorn (GFXH_FILE_MENU_GFX) |
| `map_*`, `flg_*` (file_menu_top, save_menu_middle, save_menu_bottom) | `gfx_compressible/common/` | the screen's tile and attribute maps (GFXH_SAVE_MENU_LAYOUT) |
| `gfx_savescreen.png` | `gfx_compressible/common/` | the SAVE banner and the three choices' English words (GFXH_SAVE_MENU_GFX) |
| `gfx_gameover.png` | `gfx_compressible/common/` | the GAME OVER banner laid over it (GFXH_GAME_OVER_GFX) |
| `*.properties` | beside each png | which pngs are stored as 8x16 columns |
| `gfxHeaders.s`, `paletteHeaders.s`, `paletteData.s` | `data/seasons/` | where each file lands in VRAM, and PALH_05 (save) / PALH_06 (game over) |
