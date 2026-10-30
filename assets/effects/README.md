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
| `spr_dungeon_sprites.png` | `gfx/seasons/` (commit 21c924a; the interaction tables are byte-identical there) | INTERAC_MOVING_PLATFORM ($79), the Cliffside Cistern's floats (S183) |
| `partData.s`, `partAnimations.s`, `partOamData.s` | `data/seasons/` | PART_ENEMY_DESTROYED ($02): tile base, oam flags, frames and their holds |
| `itemAnimations.s`, `itemOamData.s` | `data/` | ITEM_BOMB's fuse (animation 0) and blast (animation 1) |
| `paletteData.s` | `data/seasons/` | the standard sprite palettes |
| `bombs.s` | `object_code/common/items/` | the blast's tile base and oam flags (itemInitializeBombExplosion); the blast's reach per frame |
| `enemyDestroyed.s` | `object_code/common/parts/` | the kill puff's palette flicker; the drop and room count waiting for its end |
| `itemDrop.s` | `object_code/common/parts/` | a drop's pop and bounce; the fairy's flight (feel.js reads, not the ripper) |

**S217.** The leaves a cut bush throws (INTERAC_GRASSDEBRIS $00), the splash
(INTERAC_SPLASH $03), what a pot or rock breaks into (INTERAC_ROCKDEBRIS $06)
and the sword's clink (INTERAC_CLINK $07) are cut from the same files above —
`spr_common_sprites.png` and the interaction tables — by `debris()` in
`tools/rip-effects.py`. They replaced hand-drawn `fx_cut*`, `fx_splash*` and
`fx_spark*`. Which one Seasons spawns where was read from the disassembly's
`object_code/common/interactions/breakTileDebris.s` (all thirteen share one
routine: play animation 0, delete on its $ff frame),
`data/seasons/tile_properties/breakableTiles.s` (`breakableTileModes`' low
nibble: 0 for bushes and grass, 6 for pots and rocks), and
`code/breakableTiles.s` (a thrown pot breaks as its tile would). The leaves
fly further than 16 px from their centre, so they are cut 48x48.

**S218.** The dust (INTERAC_FALLDOWNHOLE subid 1, its animation 1, on the same
common sprites) and the twinkle (INTERAC_SPARKLE's subid table: gfx header $50,
tile base $0a, animation 1) are cut by `dust()` and `twinkle()` in
`tools/rip-effects.py`. They replaced hand-drawn `fx_dust*` and `fx_sparkle*`.
Added, verbatim from commit 7584d87:

| File | From | Used for |
|---|---|---|
| `spr_triforce_sparkle.png` | `gfx_compressible/seasons/` | the twinkle's tiles (objectGfxHeaders.s $50) |
| `sparkle.s` | `object_code/seasons/interactions/` | which subid draws which palette and how long it lives (reference; the ripper does not read it) |
| `fallDownHole.s` | `object_code/common/interactions/` | the dust's animation and its every-frame blink (reference) |

The twinkle is drawn in standard sprite palette 3 (orange) where ours was gold
and 2 (red, subid 1's own) where it was coral: the human's choice. Seasons
draws no dust when Link lands (link.s plays SND_LAND alone), so the game no
longer does either.

**S219.** The last hand-drawn effects are gone. Cut by `tools/rip-effects.py`:
the shadow of anything in the air and the little splash at a wader's feet
(`terrain()`, from `terrainEffects.s`: raw oam on the common sprites, drawn by
code/bank0.s `_drawObjectTerrainEffects` — the shadow on alternate frames, the
splash one picture every 8 frames of the global counter); the bubble
(`bubble()`, INTERAC_BUBBLE $91, Ages' underwater swimmer's, whose interaction
data Seasons carries too); and an ember seed's fire (`ember()`, item20's loop
with the flags and tile base from `seeds.s` @data). Added, verbatim from
commit 7584d87:

| File | From | Used for |
|---|---|---|
| `terrainEffects.s` | `data/` | the shadow and the splash at the feet (read by the ripper) |
| `bubble.s` | `object_code/common/interactions/` | the bubble's rise, wobble and flicker (reference; feel.js RISE_BUBBLE_*) |
| `seeds.s` | `object_code/common/items/` | the ember fire's oam flags and tile base (read by the ripper) |

Where no original matches exactly the human chose the nearest (S219): the
Squall Bellows' gust puffs in Seasons' dust, Nereth's seal glints with the
twinkle, the Resonance Rod's reach is eight twinkles flying to its edge (the
Rod of Seasons throws the same twinkle), and Gloomtide's foam and Thalassor's
whirlpool swirl are Seasons' splash.
