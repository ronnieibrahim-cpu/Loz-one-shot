# Source graphics for the ending

`oracles-disasm/seasons/` holds files copied verbatim from Stewmath's Oracle of
Seasons disassembly, **github.com/Stewmath/oracles-disasm**
(commit 21c924afdc8a13225e849214479d5113da2ec226). Credit to that project and
its contributors, who took the cartridge apart; the artwork is Nintendo's and
Capcom's. Fan-work use only — the same copyright note as
`assets/sheets/README.md` applies.

`tools/rip-ending.py` reads these files and writes `src/data/screens-ending.js`
(S213); `tools/check-rippers.mjs` proves the rip reproduces byte for byte.

| File | From | Used for |
|---|---|---|
| `gfx_credits_bg_1/2/3.png`, `map_credits_bg.bin`, `flg_credits_bg.bin` | `gfx_compressible/common/` | the sky the last of the credits roll over (GFXH_CREDITS_SCROLL) |
| `spr_credits_font.png` (+ `.properties`) | `gfx_compressible/common/` | the outlined capitals the names are spelt in |
| `gfx_credits_theend_1/2.png` (+ `_2.properties`), `map_credits_theend.bin`, `flg_credits_theend.bin` | `gfx_compressible/common/` | the THE END sunset (GFXH_CREDITS_THE_END) |
| `gfxHeaders.s`, `paletteHeaders.s`, `paletteData.s` | `data/seasons/` | where each file lands, and PALH_SEASONS_a0 / a9 |

The sequence itself is `code/seasons/cutscenes/endgameCutscenes.s`
(endgameCutsceneHandler_0a_stage2/3), read but not copied.
