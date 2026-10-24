# Oracle of Ages' colour cube

`oracles-disasm/ages/` holds files copied verbatim from Stewmath's Oracle of
Ages disassembly, **github.com/Stewmath/oracles-disasm** (commit
21c924afdc8a13225e849214479d5113da2ec226). Credit to that project and its
contributors, who took the cartridge apart; the artwork is Nintendo's and
Capcom's. Fan-work use only — the same copyright note as
`assets/sheets/README.md` applies.

`tools/rip-cube.py` reads them and writes `src/data/sprites-cube.js` (S207);
`tools/check-rippers.mjs` proves the rip reproduces byte for byte.

| File | From | Used for |
|---|---|---|
| `spr_colored_cube.png` | `gfx_compressible/ages/` | the cube's 8x16 sprite tiles |
| `interactionData.s` | `data/ages/` | INTERAC_COLORED_CUBE ($19): its graphics, tile base and palette |
| `interactionAnimations.s` | `data/ages/` | interaction19's 30 animations and its OAM frame list |
| `interactionOamData.s` | `data/ages/` | each frame's sprites |
| `paletteData.s` | `data/ages/` | sprite palette 5 and PALH_89's palettes 6 and 7 |
| `coloredCube.s` | `object_code/ages/interactions/` | which roll a push plays from each orientation, and each orientation's top colour |
