# Source treasure graphics

`oracles-disasm/seasons/` holds files copied verbatim from Stewmath's Oracle of
Seasons disassembly, **github.com/Stewmath/oracles-disasm**
(commit 7584d8723afcf8861c5c1c46fb07d747a12bc655). Credit to that project and
its contributors, who took the cartridge apart; the artwork is Nintendo's and
Capcom's. Fan-work use only — the same copyright note as
`assets/sheets/README.md` applies.

No sheet in `assets/sheets/` carries the rupees, hearts, keys and map as they
lie in the world. `tools/rip-treasures.py` draws each one exactly as the
cartridge does and writes `src/data/sprites-treasures.js` (S155);
`tools/check-rippers.mjs` proves the rip reproduces byte for byte.

| File | From | Used for |
|---|---|---|
| `spr_common_items.png` | `gfx_compressible/seasons/` | rupees, recovery heart, bomb (2 bits a pixel, 8x16 sprites) |
| `spr_quest_items_5.png` | `gfx_compressible/seasons/` | Piece of Heart, Heart Container |
| `spr_map_compass_keys.png` | `gfx_compressible/seasons/` | small key, boss key, dungeon map |
| `interactionData.s` | `data/seasons/` | interaction $60 (a treasure): graphics, tile, palette, animation per subid |
| `interactionAnimations.s`, `interactionOamData.s` | `data/seasons/` | how many hardware sprites a treasure is, where, and which are mirrored |
| `objectGfxHeaders.s` | `data/seasons/` | which graphics file a header index names |
| `itemDrop.s` | `object_code/common/parts/` | each enemy drop's tile and palette |
| `partAnimations.s`, `partOamData.s` | `data/seasons/` | how a drop is laid out |
| `paletteData.s` | `data/seasons/` | the standard sprite palettes |
