# Source boss graphics

`oracles-disasm/` holds files copied verbatim from Stewmath's Oracle of
Seasons / Ages disassembly, **github.com/Stewmath/oracles-disasm**
(commit 7584d8723afcf8861c5c1c46fb07d747a12bc655). Credit to that project and
its contributors, who took the cartridge apart; the artwork is Nintendo's and
Capcom's. Fan-work use only — the same copyright note as
`assets/sheets/README.md` applies.

No sprite sheet in `assets/sheets/` carries a boss. The cartridge carries all
of them, as 8x16 hardware sprites plus the tables that place, flip and colour
them, so `tools/rip-bosses.py` assembles each frame the way the Game Boy does
and writes `src/data/sprites-bosses-seasons.js`. `tools/check-rippers.mjs`
proves the rip reproduces byte for byte.

| File | From | Used for |
|---|---|---|
| `gfx/spr_*.png` | `gfx_compressible/seasons/` | the boss sprite graphics, 2 bits a pixel |
| `objectGfxHeaders.s` | `data/seasons/` | which graphics files load together, in what order |
| `enemyData.s` | `data/seasons/` | each enemy's graphics header, palette and tile base |
| `enemyAnimations.s` | `data/seasons/` | each enemy's frame list (`enemyXXOamDataPointers`) |
| `enemyOamData.s` | `data/seasons/` | each frame's hardware sprites: offset, tile, flags |
| `paletteData.s` | `data/seasons/` | `standardSpritePaletteData` and each boss's own colours |
| `paletteHeaders.s` | `data/seasons/` | which colours a boss loads into sprite palettes 6-7 (`ld b,PALH_...` in its object_code) |

Which of our bosses is built from which Seasons boss is the `BOSSES` table in
`tools/rip-bosses.py`; the look is Seasons', what the boss does is ours.

## Ages (S159)

`../oracles-disasm-ages/` holds the same kind of files from Oracle of **Ages**,
copied verbatim from the same oracles-disasm commit (7584d87): `data/ages/`'s
`enemyData.s`, `enemyAnimations.s`, `enemyOamData.s`, `objectGfxHeaders.s`,
`paletteData.s`, `paletteHeaders.s`, and from `gfx_compressible/ages/` only
the sheets a boss actually draws from (`spr_swoop`, `spr_giantghini_1`,
`spr_anglerfish`). The human asked for Ages' creatures to be blended in with
Seasons' for Thalassor, Gustharpy and the Saltwraith; `tools/rip-bosses.py`
reads a part from Ages' tables when its source says `game='ages'`, and may
colour it with the other cartridge's palettes (`palgame`). Same credit and the
same fan-work note: the artwork is Nintendo's and Capcom's; the disassembly is
the oracles-disasm project's.
