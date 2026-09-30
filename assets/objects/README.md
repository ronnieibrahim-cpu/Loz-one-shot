# Source room-object graphics

`oracles-disasm/seasons/` holds files copied verbatim from Stewmath's Oracle of
Seasons disassembly, **github.com/Stewmath/oracles-disasm**
(commit 7584d8723afcf8861c5c1c46fb07d747a12bc655). Credit to that project and
its contributors, who took the cartridge apart; the artwork is Nintendo's and
Capcom's. Fan-work use only — the same copyright note as
`assets/sheets/README.md` applies.

In Seasons a chest, a sign, a torch, a push block and a floor button are
background tiles of the room's tileset, so no sheet has them loose.
`tools/rip-objects.py` reads them out of these files the way the Game Boy
does and writes `src/data/sprites-objects.js` (S156); `tools/check-rippers.mjs`
proves the rip reproduces byte for byte.

| File | From | Used for |
|---|---|---|
| `tilesets.s` | `data/seasons/` | which graphics, palette, layout and animation group a tileset uses |
| `gfxHeaders.s` | `data/seasons/` | which graphics file lands at which VRAM address |
| `paletteHeaders.s`, `paletteData.s` | `data/seasons/` | BG palettes 2-7 per tileset, and palette 0 (PALH_0f) |
| `animationGroups.s`, `animationData.s`, `animationGfxHeaders.s` | `data/seasons/` | the lit torch's four flame frames |
| `tilesetMappings{00,21,23,24,25,26,27,29,2a}.bin` | `tileset_layouts/seasons/` | the metatile layouts (8 bytes a metatile); 21, 23 and 26 (the Hero's Cave, Snake's Remains, Unicorn's Cave) added in S160 for the three optional dungeons' kits, which `tools/rip-dungeon-themes.py` reads through rip-objects' `Tileset` |
| `gfx_tileset_*.png` | `gfx_compressible/seasons/` | the tile graphics |
| `gfx_animations_3.png` | `gfx/seasons/` | the flame tiles |

## Oracle of Ages (S161)

`oracles-disasm/ages/` holds files copied verbatim from the same disassembly
and commit, from Oracle of **Ages**: the human asked (end of S160) for both
cartridges to be used, and chose Ages' Mermaid's Cave for the Sunken Palace
over Seasons' Unicorn's Cave. `tools/rip-objects.py`'s `Tileset` reads either
cartridge (an Ages tileset is named `('ages', index)`), and
`tools/rip-dungeon-themes.py` picks from it as `ages:NN` (`ages:NN@k` draws
the tileset at step `k` of its animations — the whirlpool's four frames).

| File | From | Used for |
|---|---|---|
| `tilesets.s`, `gfxHeaders.s`, `paletteHeaders.s`, `paletteData.s` | `data/ages/` | the same tables as Seasons'; Ages' tilesets.s has no seasonal entries |
| `animationGroups.s`, `animationData.s`, `animationGfxHeaders.s` | `data/ages/` | the whirlpool's four frames (animationDataWhirlpool2); Ages stacks group labels with no blank line and carries `; 0x...` comments on labels, which the parser allows for |
| `tilesetMappings26.bin`, `tilesetMappings10.bin` | `tileset_layouts/ages/` | Mermaid's Cave (tileset $3d, the sunken past) and the sea floor (tileset $5f, the underwater present) |
| `gfx_tileset_*.png` | `gfx_compressible/ages/` | the tile graphics |
| `gfx_animations_{1,2,3}.png` | `gfx/ages/` | the whirlpool's animated tiles |
