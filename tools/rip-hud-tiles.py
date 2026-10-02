#!/usr/bin/env python3
"""Cut the status bar's own digits and its "L-" out of Oracle of Seasons' HUD graphics (S167).

Regenerate with:  python3 tools/rip-hud-tiles.py

Source: assets/hud/oracles-disasm/seasons/, copied verbatim from Stewmath's
oracles-disasm (github.com/Stewmath/oracles-disasm, commit 21c924a).
Credit: the oracles-disasm project and its contributors, who took the
cartridge apart; the artwork is Nintendo's and Capcom's. Fan-work use only.

WHAT THESE ARE. Beside an item that comes in levels Seasons writes "L-1",
"L-2", and beside a counted one its count, "10" or "07" — on the A/B buttons
and in the inventory alike. Neither is a sprite: code/bank2.s
drawTreasureExtraTiles writes two BACKGROUND tiles out of gfx_hud (loaded at
$9000, gfx header GFXH_HUD): tile $1a, an "L" with its dash, then digit tile
$10+n (display mode $00, level); or the tens digit then the units digit
(mode $01, quantity). Which mode an item uses is treasureDisplayData.s b5.
Those tiles are the bold digits this file emits:

  hud_d0 .. hud_d9   tiles $10-$19
  hud_lv             tile $1a, "L-" (the dash reaches the tile's right edge,
                     so the digit tile beside it completes "L-1")
  hud_x              tile $1b, the "x" between the key and its count

and from gfx_key_orechunk, the tile Seasons copies over the rupee's ($9090)
when Link is in a dungeon (code/bank2.s loadCommonGraphics_body,
@loadMoneyGraphic), so the top of the money column reads key, x, count:

  hud_key            gfx_key_orechunk tile 0

and (S169) the frames round the A and B items, which map_hud_normal builds
from three tiles: hud_slot_b ($05, "B["), hud_slot_a ($08, "A["), and $06,
the bottom of a "[", in the four flips its attribute bytes ask for
(hud_brk_bl / _tl / _br / _tr). And the inventory's cursor brackets,
menu_cursor_l / _r (see CURSOR below).

Each tile is 8x8, 2 bits a pixel. Index 3 is the ink; indices 0-2 are the
paper the tile sits on, which on the cartridge is the panel's own colour, so
here they are transparent and the glyph lies on whatever panel draws it. The
ink colour is BG palette 0 colour 3 of paletteData4830 (the status bar's
palette, PALH_0a), RGB555 scaled to 8 bits the way the GBC does.
"""
import os
import re
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from ripkit import emit_module

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets', 'hud', 'oracles-disasm', 'seasons')
OUT = os.path.join(ROOT, 'src', 'data', 'sprites-hud-tiles.js')

# name -> (graphics file, tile index in it)
TILES = {**{f'hud_d{n}': ('gfx_hud.png', 0x10 + n) for n in range(10)},
         'hud_lv': ('gfx_hud.png', 0x1a), 'hud_x': ('gfx_hud.png', 0x1b),
         'hud_key': ('gfx_key_orechunk.png', 0),
         # The A and B buttons' frames (S169): the BG tiles GFXH_HUD_LAYOUT_NORMAL
         # (map_hud_normal / flg_hud_normal) lays round each item. Tile $05 is
         # "B" and the top of its "[", $08 the same for "A", and $06 the bottom
         # of a "["; the map draws every other corner as $06 flipped by its
         # attribute byte ($a0 x, $e0 x and y), which is what the third field
         # here says.
         'hud_slot_b': ('gfx_hud.png', 0x05), 'hud_slot_a': ('gfx_hud.png', 0x08),
         'hud_brk_bl': ('gfx_hud.png', 0x06),
         'hud_brk_tl': ('gfx_hud.png', 0x06, 'y'),
         'hud_brk_br': ('gfx_hud.png', 0x06, 'x'),
         'hud_brk_tr': ('gfx_hud.png', 0x06, 'xy')}


def palette(label, index):
    """The four colours of palette `index` under `label` in paletteData.s."""
    with open(os.path.join(SRC, 'paletteData.s')) as f:
        ls = [l.split(';')[0].rstrip() for l in f.read().split('\n')]
    k = next(i for i, l in enumerate(ls) if re.match(r'^' + label + r':', l))
    cols = []
    for l in ls[k + 1:]:
        m = re.search(r'm_RGB16 \$(\w+) \$(\w+) \$(\w+)', l)
        if m:
            cols.append(tuple(int(v, 16) for v in m.groups()))
        elif re.match(r'^\w+:', l):
            break
    return [tuple((c << 3) | (c >> 2) for c in rgb) for rgb in cols[index * 4:index * 4 + 4]]


# The inventory's cursor (S169): code/bank2.s inventorySubscreen0_drawCursor
# lays two 8x16 sprites, tile $0c of GFXH_INVENTORY_SCREEN's sprite graphics
# (gfx_inventory_hud_1 at $8000) in sprite palette 2 of PALH_0a
# (standardSpritePaletteData) — the left one with attribute $22, mirrored, the
# right one $02. Unlike the bar's tiles these are sprites, so index 0 is the
# transparent one and the bracket is colour 1.
CURSOR = {'menu_cursor_l': 'x', 'menu_cursor_r': ''}


def main():
    pal = ['#%02x%02x%02x' % c for c in palette('paletteData4830', 0)]
    art, pals = {}, {}
    cur = Image.open(os.path.join(SRC, 'gfx_inventory_hud_1.png'))
    spal = ['#%02x%02x%02x' % c for c in palette('standardSpritePaletteData', 2)]
    for name, flip in CURSOR.items():
        rows = []
        for y in range(16):
            t = 0x0c + y // 8
            x0, y0 = (t % 16) * 8, (t // 16) * 8
            rows.append(''.join(str(v) if v else '.' for v in (
                cur.getpixel((x0 + (7 - x if flip else x), y0 + y % 8)) & 3 for x in range(8))))
        art[name] = rows
        pals[name] = spal
    for name, (src, t, *flip) in sorted(TILES.items()):
        flip = flip[0] if flip else ''
        im = Image.open(os.path.join(SRC, src))
        per = im.width // 8
        x0, y0 = (t % per) * 8, (t // per) * 8
        rows = []
        for y in range(8):
            sy = 7 - y if 'y' in flip else y
            rows.append(''.join('3' if (im.getpixel((x0 + (7 - x if 'x' in flip else x), y0 + sy)) & 3) == 3
                                else '.' for x in range(8)))
        art[name] = rows
        pals[name] = pal

    header = '\n'.join([
        "// The status bar's own digits and its \"L-\", cut from Oracle of Seasons' HUD",
        '// graphics (gfx_hud, tiles $10-$1b) and its dungeon key (gfx_key_orechunk).',
        '//',
        '// Generated by tools/rip-hud-tiles.py — edit that, not this file.',
        "// Source: Stewmath's oracles-disasm (github.com/Stewmath/oracles-disasm),",
        '// copied into assets/hud/oracles-disasm/. Credit to that project and its',
        "// contributors; the artwork is Nintendo's and Capcom's. Fan-work use only.",
        '//',
        '// Ink only: the paper of each tile is transparent, so a glyph lies on',
        '// whatever panel draws it, as the cartridge\'s tiles lie on its own.',
    ])
    emit_module(OUT, header, art, pals, 'HUD_TILE_ART', 'installHudTileSprites', 'ui')
    print('emitted', len(art), 'HUD tiles')


if __name__ == '__main__':
    main()
