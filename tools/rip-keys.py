#!/usr/bin/env python3
"""Cut the six dungeon keys out of the Oracle games' own key-item graphics (S154).

Regenerate with:  python3 tools/rip-keys.py

Source: assets/keys/oracles-disasm/, copied verbatim from Stewmath's
oracles-disasm (github.com/Stewmath/oracles-disasm, commit 7584d87):
the inventory screen's key graphics (spr_map_compass_keys*.png, 2 bits a
pixel, 8x16 sprites side by side), the table that says which of them each
key item is drawn with (treasureDisplayData.s), and the standard sprite
palettes (paletteData.s). Credit: the oracles-disasm project and its
contributors, who took the cartridge apart; the artwork is Nintendo's and
Capcom's. Fan-work use only.

WHY THIS AND NOT A SHEET. No sheet in assets/sheets/ has the key items; the
cartridges have seven between them (Seasons' Gnarled, Floodgate and Dragon
Keys; Ages' Graveyard, Crown, Mermaid and Library Keys). Each is ONE 8x16
hardware sprite: treasureDisplayData.s gives it as a sprite index into the
inventory screen's VRAM layout (gfx header $08, GFXH_INVENTORY_SCREEN), which
loads spr_map_compass_keys at $8600, so the index minus $30 is the 8-pixel
column of that file, and the attribute's low three bits are its palette.

WHAT IS OURS. The KEYS are ours — six keys to six dungeons the source games
never had, given by people they never had (docs/GAME-PLAN.md, S154). The
SHAPES are the cartridges', one per key, chosen for what each key is: the
Gnarled Key's spiral reads as a shell, the Dragon Key's horns as branching
coral. The colours are ours too, because a Seasons palette would say
"Gnarled Key" as loudly as its shape; the cartridge's palette is read only to
know which of the three inks is the outline, the fill and the light — the
standard palettes do not agree on that order (0-3 run white, black, colour,
skin; 4-5 run white, light, colour, black).

WHAT COMES OUT. src/data/sprites-keys.js: one 16x16 icon per key, the 8x16
sprite centred in the cell as the inventory draws it, in art indices
0 = light, 1 = fill, 3 = outline, and one palette per key.
"""
import os
import re

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets', 'keys', 'oracles-disasm')
OUT = os.path.join(ROOT, 'src', 'data', 'sprites-keys.js')

GFX = {
    'seasons': 'spr_map_compass_keys.png',
    'ages': 'spr_map_compass_keys_bookofseals.png',
}
VRAM_TILE = 0x60   # both games load the key graphics at $8600 in header $08

# Our key -> (game, treasure constant, why this shape, our colours:
# light, fill, outline).
KEYS = [
    ('i_key_d1', 'seasons', 'TREASURE_GNARLED_KEY', 'the Barnacle Key: the spiral is a shell',
     ['#f0e8d0', '#8ca0a8', '#000000']),
    ('i_key_d2', 'seasons', 'TREASURE_DRAGON_KEY', 'the Coral Key: the horns branch like coral',
     ['#f8d0d8', '#e05878', '#000000']),
    ('i_key_d3', 'seasons', 'TREASURE_FLOODGATE_KEY', 'the Peat Key: a drop of bog water',
     ['#d8b888', '#6c4c2c', '#000000']),
    ('i_key_d4', 'ages', 'TREASURE_CROWN_KEY', 'the Cistern Key: a square iron bow',
     ['#d0d8e0', '#58687c', '#000000']),
    ('i_key_d5', 'ages', 'TREASURE_MERMAID_KEY', 'the Moss Key: the bow grown over like a leaf',
     ['#c0e890', '#3c8848', '#000000']),
    ('i_key_d6', 'ages', 'TREASURE_GRAVEYARD_KEY', "the Bell's Clapper: a round bob on a stem",
     ['#f8e8a0', '#c89830', '#000000']),
]


def read(game, name):
    with open(os.path.join(SRC, game, name)) as f:
        return f.read().split('\n')


def display(game, treasure):
    """(sprite index, palette) of a treasure's inventory icon."""
    for line in read(game, 'treasureDisplayData.s'):
        m = re.match(r'\s*\.db (\w+),\s*\$(\w+), \$(\w+),', line)
        if m and m.group(1) == treasure:
            return int(m.group(2), 16), int(m.group(3), 16) & 7
    raise SystemExit(f'{treasure} is not in {game} treasureDisplayData.s')


def standard_palette(game, index):
    """Sprite palette `index` of standardSpritePaletteData, as RGB555 triples."""
    lines = read(game, 'paletteData.s')
    start = lines.index('standardSpritePaletteData:') + 1
    cols = []
    for line in lines[start:]:
        m = re.search(r'm_RGB16 \$(\w+) \$(\w+) \$(\w+)', line)
        if m:
            cols.append(tuple(int(m.group(k), 16) for k in (1, 2, 3)))
        if len(cols) == (index + 1) * 4:
            return cols[index * 4:]


def ink_order(pal):
    """GB colour index -> art index, by brightness: light 0, fill 1, outline 3."""
    lum = {v: 3 * r + 6 * g + b for v, (r, g, b) in enumerate(pal) if v}
    dark, mid, light = sorted(lum, key=lambda v: lum[v])
    return {light: '0', mid: '1', dark: '3'}


def build():
    art, pals, notes = {}, {}, []
    for name, game, treasure, why, colours in KEYS:
        index, palno = display(game, treasure)
        col = index - VRAM_TILE // 2
        im = Image.open(os.path.join(SRC, game, GFX[game]))
        assert im.mode == 'P', f'{GFX[game]} is not indexed'
        tile = im.crop((col * 8, 0, col * 8 + 8, 16))
        order = ink_order(standard_palette(game, palno))
        rows = []
        for y in range(16):
            row = '....'
            for x in range(8):
                v = tile.getpixel((x, y))
                row += order[v] if v else '.'
            rows.append(row + '....')
        assert any(c != '.' for r in rows for c in r), f'{name}: empty sprite'
        art[name] = rows
        pals[name] = [colours[0], colours[1], colours[1], colours[2]]
        notes.append(f'//   {name}: {game} {treasure} (${index:02x}, palette {palno}) — {why}')
    return art, pals, notes


HEADER = '''// The six dungeon keys, cut from the Oracle games' own key-item graphics.
//
// Generated by tools/rip-keys.py — edit that, not this file.
// Source: Stewmath's oracles-disasm (github.com/Stewmath/oracles-disasm,
// commit 7584d87), assets/keys/oracles-disasm/: the inventory screen's key
// sprites, the table naming each key item's sprite, and the standard sprite
// palettes. Credit: the oracles-disasm project and its contributors; the
// artwork is Nintendo's and Capcom's. This is fan-work art only.
//
// The shapes are the cartridges'; the keys, and their colours, are ours.
//'''


def emit(art, pals, notes):
    lines = HEADER.split('\n') + ['// Built from:'] + notes + [
        '', "import { sprites } from '../gfx/art.js';",
        "import { registerPalettes } from '../gfx/palettes.js';", '',
        'export const KEY_ART = {']
    for name in art:
        lines.append('  // extracted — pulled straight off the source graphics named '
                     'in this file\'s own header, by this ripper.')
        lines.append(f"  {name}: {{ pal: '{name}', art: `")
        for r in art[name]:
            lines.append('    ' + r)
        lines[-1] += '` },'
    lines += ['};', '', '// Ours: one palette per key.', 'export const KEY_PALETTES = {']
    for name in pals:
        lines.append(f"  {name}: [{', '.join(repr(c) for c in pals[name])}],")
    lines += ['};', '', 'export function installKeySprites() {',
              '  registerPalettes(KEY_PALETTES);',
              "  sprites.add(KEY_ART, 'ui');", '}', '']
    with open(OUT, 'w') as f:
        f.write('\n'.join(lines))


if __name__ == '__main__':
    a, p, n = build()
    emit(a, p, n)
    print(f'wrote {os.path.relpath(OUT, ROOT)}: {len(a)} keys')
