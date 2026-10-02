# Source NPC graphics

`oracles-disasm/seasons/` holds files copied verbatim from Stewmath's Oracle of
Seasons disassembly, **github.com/Stewmath/oracles-disasm**
(commit 21c924afdc8a13225e849214479d5113da2ec226). Credit to that project and
its contributors, who took the cartridge apart; the artwork is Nintendo's and
Capcom's. Fan-work use only — the same copyright note as
`assets/sheets/README.md` applies.

The NPC sheet in `assets/sheets/` has no oracle, so Farore was a townswoman from
it dyed green until S168. `tools/rip-npcs.py` now cuts her from the cartridge:
INTERAC_FARORE ($10) uses object gfx $4b, this file, in its default animation 2
and standard sprite palette 0 (the tables are read from
`assets/effects/oracles-disasm/seasons/`, identical at this commit).

| File | From | Used for |
|---|---|---|
| `spr_farore_ralph.png` | `gfx_compressible/seasons/` | Farore, both frames of her sway |
| `spr_springflower_makuleaf_farorebook.png` | `gfx_compressible/seasons/` | Farore's book on her desk (INTERAC $1c, object gfx $51, S168) |
