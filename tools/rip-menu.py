#!/usr/bin/env python3
"""Cut Seasons' three inventory pages out of the cartridge (S176).

Regenerate with:  python3 tools/rip-menu.py

Source: assets/menu/oracles-disasm/seasons/, copied verbatim from Stewmath's
oracles-disasm (github.com/Stewmath/oracles-disasm, commit 21c924a). Credit:
the oracles-disasm project and its contributors, who took the cartridge
apart; the artwork is Nintendo's and Capcom's. Fan-work use only.

THE PAGES AS THE CARTRIDGE LAYS THEM DOWN (code/bank2.s inventoryMenuState0,
func_02_55b2). GFXH_INVENTORY_SCREEN puts the frame's tiles in VRAM
(gfx_inventory_hud_1 at $8000, gfx_save at $8600, gfx_inventory_hud_2 at
$8e00) and the text bar's maps at row 15; then each page loads its own maps
over the same 32-wide tile map:

  * page 1 (the items): map_inventory_screen_1 at row 2, thirteen rows;
  * page 2 (treasures and the ring box): map_inventory_screen_2 at row 3,
    twelve rows — row 2 is left as page 1 drew it, and the pages only ever
    turn 1 -> 2 -> 3 -> 1, so it is always page 1's top edge;
  * page 3 (essences, season, heart pieces, SAVE): map_inventory_screen_3 at
    row 2, thirteen rows.

The background is read as the GBC reads one with LCDC's tile data at $8000
(unsigned map bytes), attribute bits 0-2 the palette, bit 3 the VRAM bank,
bits 5/6 the flips, in PALH_0a's colours. Rows 2-17 are emitted, 160x128:
the status bar above is the game's own.

WHAT IS LEFT OUT, AND WHY. Page 3's map holds Seasons' eight Essences as
background tiles (from spr_essences in VRAM bank 1), and the game itself
clears every one not yet held (inventorySubscreen2_drawTreasures,
fillRectangleInTilemap with tile 0). This game has six Essences of its own,
drawn as its own sprites, so every Essence cell is cleared here exactly as the
cartridge clears an Essence nobody has found: the page comes out as Seasons
shows it on a new file. The text bar's letter tiles ($20-$3f) are the text
engine's, written at run time; they are drawn blank (colour 0 of their own
palette), and the game writes its own words there.

  * `invBlock`: the block that fills a part of a page that has nothing to
    show (fillRectangleInTileMapWithMenuBlock: tile $e7, attribute $01) —
    the ring box's row before the ring box, the season's slot in a dungeon.
  * `invDigits`: the page's own digits, tiles $10-$19 (attribute $07), which
    the heart-piece box counts in (w4TileMap+$14f).
  * `invSubCursor`: the arrow that marks the choice in an item's submenu
    (the satchel's seeds), sprite tile $0e in sprite palette 3.
  * `invHeart1`-`invHeart3`: the heart box's quarters filled in for one, two
    and three pieces (itemSubmenu2HeartPieceDisplayData), drawn over the box.
"""
import os
import re

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets', 'menu', 'oracles-disasm', 'seasons')
OUT = os.path.join(ROOT, 'src', 'data', 'screens-menu.js')
KEYS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

# Where each file lands (data/seasons/gfxHeaders.s GFXH_INVENTORY_SCREEN, the
# ones this page's background reads).
GFX = (('gfx_inventory_hud_1', 0x8000), ('gfx_save', 0x8600), ('gfx_inventory_hud_2', 0x8e00))
TEXTBAR_ROW = 15
PAGES = (
    ('invPage1', (('map_inventory_screen_1', 'flg_inventory_screen_1', 2),)),
    ('invPage2', (('map_inventory_screen_1', 'flg_inventory_screen_1', 2),
                  ('map_inventory_screen_2', 'flg_inventory_screen_2', 3))),
    ('invPage3', (('map_inventory_screen_3', 'flg_inventory_screen_3', 2),)),
)
# itemSubmenu2EssencePositions: w4TileMap offsets of the eight 2x2 Essences.
ESSENCES = (0x084, 0x087, 0x0c9, 0x129, 0x167, 0x164, 0x122, 0x0c2)
# itemSubmenu2HeartPieceDisplayData, from the heart's top-left (w4TileMap+$ce):
# per piece, an offset and two (column, attribute) halves. A half is written by
# drawTreasureDisplayDataToBg@writeTile as an 8x16 COLUMN: tiles 2c and 2c+1,
# one above the other, in palette attribute+2 (bank 1 if 2c carries) — so
# $78 is tiles $f0/$f1 of gfx_inventory_hud_2, in palette 7.
HEART_AT = 0x0ce
HEART_PIECES = ((0x00, (0x78, 0x05), (0x79, 0x05)),
                (0x40, (0x7a, 0x05), (0x7b, 0x05)),
                (0x42, (0x7b, 0x25), (0x7a, 0x25)))
TEXT_TILES = range(0x20, 0x40)
SUB_CURSOR = (0x0e, 0x03)


def text(name):
    with open(os.path.join(SRC, name)) as f:
        return f.read()


def rgb555(label, count):
    t = text('paletteData.s')
    i = t.index(label + ':')
    cols = []
    for m in re.finditer(r'm_RGB16 \$(\w+) \$(\w+) \$(\w+)', t[i:]):
        cols.append(tuple((int(v, 16) << 3) | (int(v, 16) >> 2) for v in m.groups()))
        if len(cols) == count * 4:
            break
    return [cols[k * 4:k * 4 + 4] for k in range(count)]


def bg_palettes(name, kind='Bg'):
    body = re.search(r'm_PaletteHeaderStart \$\w+, ' + name + r'\n(.*?)m_PaletteHeaderEnd',
                     text('paletteHeaders.s'), re.S).group(1)
    out = [None] * 8
    for start, n, label in re.findall(r'm_PaletteHeader' + kind + r'\s+(\d+), (\d+), (\w+)', body):
        for k, p in enumerate(rgb555(label, int(n))):
            out[int(start) + k] = p
    return out


def png_tiles(name):
    """The file's 8x8 tiles in the order the cartridge holds them. A sprite
    file ("spr_") is stored as 8x16 columns (tools/gfx/gfx.py in the disasm),
    read top then bottom; none of these three is one, and none has a
    .properties saying it is interleaved."""
    im = Image.open(os.path.join(SRC, name + '.png'))
    assert im.mode == 'P', f'{name} is not indexed'
    w, h = im.size
    cell = 16 if name.startswith('spr_') else 8
    out = []
    for ty in range(h // cell):
        for tx in range(w // 8):
            for half in range(cell // 8):
                out.append([[im.getpixel((tx * 8 + x, ty * cell + half * 8 + y)) for x in range(8)]
                            for y in range(8)])
    return out


def vram():
    v = {}
    for name, at in GFX:
        for t, tile in enumerate(png_tiles(name)):
            v[(at - 0x8000) // 16 + t] = tile
    return v


def tile_map(layers):
    tmap, amap = {}, {}
    def put(mname, fname, row):
        m = open(os.path.join(SRC, mname + '.bin'), 'rb').read()
        f = open(os.path.join(SRC, fname + '.bin'), 'rb').read()
        for i in range(len(m)):
            tmap[row * 32 + i], amap[row * 32 + i] = m[i], f[i]
    put('map_inventory_textbar', 'flg_inventory_textbar', TEXTBAR_ROW)
    for mname, fname, row in layers:
        put(mname, fname, row)
    return tmap, amap


def draw_tile(img, tiles, pals, t, at, px, py):
    pal = pals[at & 7]
    if t in TEXT_TILES:
        # The text engine's letters, written at run time over the bar's own
        # paper: tile $02, the blank the bar's two end cells are drawn in.
        tile = tiles[0x02]
    else:
        assert not (at >> 3) & 1, f'tile {t:02x} reads VRAM bank 1'
        tile = tiles[t]
    for y in range(8):
        for x in range(8):
            sx = 7 - x if at & 0x20 else x
            sy = 7 - y if at & 0x40 else y
            img[py + y][px + x] = pal[tile[sy][sx]]


def page(layers, tiles, pals, clear_essences):
    tmap, amap = tile_map(layers)
    if clear_essences:
        for at in ESSENCES:
            for dy in (0, 32):
                for dx in (0, 1):
                    tmap[at + dy + dx], amap[at + dy + dx] = 0x00, 0x07
    img = [[None] * 160 for _ in range(128)]
    for ty in range(2, 18):
        for tx in range(20):
            ad = ty * 32 + tx
            draw_tile(img, tiles, pals, tmap[ad], amap[ad], tx * 8, (ty - 2) * 8)
    return img


def cell(tiles, pals, t, at):
    img = [[None] * 8 for _ in range(8)]
    draw_tile(img, tiles, pals, t, at, 0, 0)
    return img


def indexed(img):
    pal, rows = [], []
    for row in img:
        line = ''
        for p in row:
            if p is None:
                line += '.'
                continue
            if p not in pal:
                pal.append(p)
                assert len(pal) <= len(KEYS), 'more colours than keys'
            line += KEYS[pal.index(p)]
        rows.append(line)
    return {'w': len(img[0]), 'h': len(img), 'pal': ['#%02x%02x%02x' % c for c in pal], 'rows': rows}


def build():
    tiles, pals = vram(), bg_palettes('PALH_0a')
    out = {}
    for name, layers in PAGES:
        out[name] = indexed(page(layers, tiles, pals, name == 'invPage3'))
    out['invBlock'] = indexed(cell(tiles, pals, 0xe7, 0x01))
    digits = [[None] * 80 for _ in range(8)]
    for d in range(10):
        draw_tile(digits, tiles, pals, 0x10 + d, 0x07, d * 8, 0)
    out['invDigits'] = indexed(digits)
    # The item submenu's cursor (inventoryMenuState2 @cursorSprite: one 8x16
    # sprite, tile $0e, palette 3): the little arrow under the chosen seed.
    spal = bg_palettes('PALH_0a', 'Spr')[SUB_CURSOR[1]]
    arrow = [[None] * 8 for _ in range(16)]
    for half in (0, 1):
        for y in range(8):
            for x in range(8):
                v = tiles[SUB_CURSOR[0] + half][y][x]
                if v:
                    arrow[half * 8 + y][x] = spal[v]
    out['invSubCursor'] = indexed(arrow)
    # The heart's quarters, one picture per count held (1-3), over the heart
    # box's 32x32: `ax`/`ay` are where it sits on the page.
    hy, hx = HEART_AT // 32, HEART_AT % 32
    for n in range(1, 4):
        img = [[None] * 32 for _ in range(32)]   # only the filled quarters drawn
        for off, *halves in HEART_PIECES[:n]:
            for k, (c, b) in enumerate(halves):
                t, at = (c * 2) & 0xff, (b + 2) | (0x08 if c * 2 > 0xff else 0)
                for half in (0, 1):
                    draw_tile(img, tiles, pals, t + half, at, (off % 32 + k) * 8, (off // 32 + half) * 8)
        out[f'invHeart{n}'] = dict(indexed(img), ax=hx * 8, ay=(hy - 2) * 8)
    return out


def emit(screens):
    lines = [
        '// GENERATED by tools/rip-menu.py — do not edit by hand. Re-run the ripper.',
        '// Source: assets/menu/oracles-disasm/seasons/, from Stewmath\'s oracles-disasm',
        '// (github.com/Stewmath/oracles-disasm, commit 21c924a). Credit: the',
        '// oracles-disasm project and its contributors; the artwork is Nintendo\'s',
        '// and Capcom\'s. Fan-work use only.',
        '//',
        '// Seasons\' three inventory pages, below the status bar (rows 2-17), the',
        '// block that fills an empty part of one, and the page\'s own digits.',
        '',
        'export const MENU_SCREENS = {',
    ]
    for name, s in screens.items():
        extra = ''.join(f', {k}: {s[k]}' for k in ('ax', 'ay') if k in s)
        lines.append(f'  {name}: {{ w: {s["w"]}, h: {s["h"]}{extra},')
        lines.append('    pal: [' + ', '.join(f"'{c}'" for c in s['pal']) + '],')
        lines.append('    rows: [')
        for r in s['rows']:
            lines.append(f"      '{r}',")
        lines.append('    ] },')
    lines.append('};')
    lines.append('')
    with open(OUT, 'w') as f:
        f.write('\n'.join(lines))


if __name__ == '__main__':
    s = build()
    emit(s)
    print(f'wrote {OUT}: ' + ', '.join(f'{k} {v["w"]}x{v["h"]} {len(v["pal"])} colours' for k, v in s.items()))
