# Source key-item graphics

`oracles-disasm/` holds files copied verbatim from Stewmath's Oracle of
Seasons / Ages disassembly, **github.com/Stewmath/oracles-disasm**
(commit 7584d8723afcf8861c5c1c46fb07d747a12bc655). Credit to that project and
its contributors, who took the cartridges apart; the artwork is Nintendo's and
Capcom's. Fan-work use only — the same copyright note as
`assets/sheets/README.md` applies.

No sheet in `assets/sheets/` carries the key items. `tools/rip-keys.py` cuts
six of the cartridges' seven key shapes (Seasons' Gnarled, Floodgate and
Dragon Keys; Ages' Graveyard, Crown and Mermaid Keys) and writes
`src/data/sprites-keys.js`, in our own colours: the keys are ours (S154), the
shapes are the Oracles'. `tools/check-rippers.mjs` proves the rip reproduces
byte for byte.

| File | From | Used for |
|---|---|---|
| `seasons/spr_map_compass_keys.png` | `gfx_compressible/seasons/` | the inventory screen's key sprites, 2 bits a pixel |
| `ages/spr_map_compass_keys_bookofseals.png` | `gfx_compressible/ages/` | the same, Ages |
| `*/treasureDisplayData.s` | `data/seasons/`, `data/ages/` | which sprite and palette each key item is drawn with |
| `*/paletteData.s` | `data/seasons/`, `data/ages/` | `standardSpritePaletteData`: which ink is outline, fill and light |
