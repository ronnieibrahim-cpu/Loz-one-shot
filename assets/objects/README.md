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
| `tilesetMappings{00,24,25,27,29,2a}.bin` | `tileset_layouts/seasons/` | the metatile layouts (8 bytes a metatile) |
| `gfx_tileset_*.png` | `gfx_compressible/seasons/` | the tile graphics |
| `gfx_animations_3.png` | `gfx/seasons/` | the flame tiles |
