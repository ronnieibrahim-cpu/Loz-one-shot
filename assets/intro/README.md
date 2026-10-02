# Source graphics for the opening

`oracles-disasm/seasons/` holds files copied verbatim from Stewmath's Oracle of
Seasons disassembly, **github.com/Stewmath/oracles-disasm**
(commit 21c924afdc8a13225e849214479d5113da2ec226). Credit to that project and
its contributors, who took the cartridge apart; the artwork is Nintendo's and
Capcom's. Fan-work use only — the same copyright note as
`assets/sheets/README.md` applies.

The opening (S168) is a story of our own — a ship on a calm sea, a storm, the
shore — told with the cartridge's pictures. `tools/rip-intro.py` reads these
files (and the object tables in `assets/effects/oracles-disasm/seasons/`,
identical at this commit) and writes `src/data/screens-intro.js`;
`tools/check-rippers.mjs` proves the rip reproduces byte for byte.

| File | From | Used for |
|---|---|---|
| `gfx_credits_linked_theend_{1,2}.png`, `map_credits_linked_theend.bin`, `flg_credits_linked_theend.bin` | `gfx_compressible/common/` | the sea and sky behind Seasons' linked ending (GFXH_CREDITS_LINKED_THE_END) |
| `spr_boat_theend.png` | `gfx_compressible/common/` | the ship and the gull of that scene (INTERAC_LINK_SHIP, object gfx $70) |
| `spr_projectiles_2.png` | `gfx_compressible/seasons/` | the lightning (PART_LIGHTNING, object gfx $8e) |
| `gfxHeaders.s`, `paletteHeaders.s`, `objectGfxHeaders.s` | `data/seasons/` | where each file lands in VRAM, PALH_SEASONS_aa (the ending's palettes), and which graphics an object uses |
