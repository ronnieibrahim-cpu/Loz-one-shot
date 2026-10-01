# Source effect graphics

`oracles-disasm/seasons/` holds files copied verbatim from Stewmath's Oracle of
Seasons disassembly, **github.com/Stewmath/oracles-disasm**
(commit 7584d8723afcf8861c5c1c46fb07d747a12bc655). Credit to that project and
its contributors, who took the cartridge apart; the artwork is Nintendo's and
Capcom's. Fan-work use only — the same copyright note as
`assets/sheets/README.md` applies.

No sheet in `assets/sheets/` carries the puff things vanish in, the puff an
enemy dies in, or the bomb's blast; all three were hand-drawn until S165.
`tools/rip-effects.py` draws each exactly as the cartridge does and writes
`src/data/sprites-effects.js`; `tools/check-rippers.mjs` proves the rip
reproduces byte for byte.

| File | From | Used for |
|---|---|---|
| `spr_common_sprites.png` | `gfx_compressible/common/` | the common sprites every room keeps loaded in VRAM bank 1 (2 bits a pixel, 8x16 sprites) |
| `interactionData.s`, `interactionAnimations.s`, `interactionOamData.s` | `data/seasons/` | INTERAC_PUFF ($05): tile base, palette, frames and their holds |
| `partData.s`, `partAnimations.s`, `partOamData.s` | `data/seasons/` | PART_ENEMY_DESTROYED ($02): tile base, oam flags, frames and their holds |
| `itemAnimations.s`, `itemOamData.s` | `data/` | ITEM_BOMB's fuse (animation 0) and blast (animation 1) |
| `paletteData.s` | `data/seasons/` | the standard sprite palettes |
| `bombs.s` | `object_code/common/items/` | the blast's tile base and oam flags (itemInitializeBombExplosion); the blast's reach per frame |
| `enemyDestroyed.s` | `object_code/common/parts/` | the kill puff's palette flicker; the drop and room count waiting for its end |
| `itemDrop.s` | `object_code/common/parts/` | a drop's pop and bounce; the fairy's flight (feel.js reads, not the ripper) |
