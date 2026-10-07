# Source graphics for Link's sword

`oracles-disasm/seasons/` holds files copied verbatim from Stewmath's Oracle of
Seasons disassembly, **github.com/Stewmath/oracles-disasm**
(commit 21c924afdc8a13225e849214479d5113da2ec226). Credit to that project and
its contributors, who took the cartridge apart; the artwork is Nintendo's and
Capcom's. Fan-work use only — the same copyright note as
`assets/sheets/README.md` applies.

Link's other frames come from the Oracle of Ages sheet in `assets/sheets/`.
The sheet's Slash band has one body per direction and no blade; Seasons' swing
is two bodies and a separate sword object in eight pictures. `tools/rip-link.py`
(`cartridge()`) cuts those from here into `src/data/sprites-player.js`;
`tools/check-rippers.mjs` proves the rip reproduces byte for byte.

| File | From | Used for |
|---|---|---|
| `spr_link.png` | `gfx/common/` | Link's graphics (2 bits a pixel, 8x16 sprites): the swing's bodies $ac-$b3 |
| `spr_swords.png` | `gfx/common/` | the sword's tiles, loaded at tile $52 of VRAM bank 1 |
| `specialObjectAnimationData.s`, `specialObjectOamData.s` | `data/seasons/` | Link's animations (LINK_ANIM_MODE_22, the swing), the graphics pointer and oam layout of each frame |
| `itemAnimations.s`, `itemOamData.s` | `data/` | ITEM_SWORD's eight pictures (item05OamDataPointers) |
| `itemData.s` | `data/seasons/` | ITEM_SWORD's tile base ($52) |
| `uncmpGfxHeaders.s` | `data/seasons/` | where spr_swords is loaded (uncmpGfxHeader1a, $8521) |
