#!/usr/bin/env python3
"""Cut Seasons' save screen and its game-over screen out of the cartridge (S169).

Regenerate with:  python3 tools/rip-save.py

Source: assets/save/oracles-disasm/seasons/, copied verbatim from Stewmath's
oracles-disasm (github.com/Stewmath/oracles-disasm, commit 21c924a). Credit:
the oracles-disasm project and its contributors, who took the cartridge
apart; the artwork is Nintendo's and Capcom's. Fan-work use only.

ONE SCREEN, TWO FACES. Seasons' game over is not a screen of its own: it is
the save-and-quit menu (code/bank2.s runSaveAndQuitMenu) with one graphics
file swapped and one palette changed. Both load GFXH_FILE_MENU_GFX (the bark
and the leaves), GFXH_SAVE_MENU_LAYOUT (the tile and attribute maps) and
GFXH_SAVE_MENU_GFX (the banner and the three plaques' English words:
CONTINUE, SAVE & CONT., SAVE & QUIT). A game over then loads
GFXH_GAME_OVER_GFX over the first sixteen of those tiles — the banner, SAVE
becoming GAME OVER — and paints in PALH_06 where the menu paints in PALH_05.

  * `saveMenu` / `gameOverMenu`: the background, read as the GBC reads one —
    map byte -> tile ($9000 signed for 0-127, $8800 above), attribute bits 0-2
    palette, bit 3 VRAM bank, bits 5/6 flips — with the sixteen leaf sprites
    fileSelect_redrawDecorationsAndSetWramBank4 lays over every file screen
    (8x16 sprites from spr_fileselect_decorations at $8200, palette 5) drawn
    on top, as the hardware draws them.
  * `saveAcorn`: the cursor, saveQuitMenu_drawSprites' @acornSprite (tile
    $28, palette 4), on the plaque at y $48 + 24 per option, x $29.

Files with `interleave: true` in their .properties are stored in the png as
8x16 columns (tools/gfx/gfx.py in the disasm), so they are read 8x16 and
split top then bottom; sprite files ("spr_") are interleaved by default.
"""
import os
import re

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets', 'save', 'oracles-disasm', 'seasons')
OUT = os.path.join(ROOT, 'src', 'data', 'screens-save.js')
KEYS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

# Where the acorn sits on each plaque, and the leaves: code/bank2.s.
ACORN = (0x48, 0x29, 0x28, 0x04)
LEAVES = [
    (0x23, 0x0a, 0x20, 0x05), (0x23, 0x12, 0x22, 0x05), (0x33, 0x06, 0x20, 0x05),
    (0x33, 0x0e, 0x22, 0x05), (0x0f, 0x07, 0x26, 0x05), (0x3b, 0x16, 0x20, 0x25),
    (0x3b, 0x0e, 0x22, 0x25), (0x17, 0x0a, 0x24, 0x25), (0x21, 0x96, 0x20, 0x05),
    (0x21, 0x9e, 0x22, 0x05), (0x17, 0x9b, 0x26, 0x65), (0x14, 0x9d, 0x24, 0x05),
    (0x31, 0xa2, 0x20, 0x25), (0x31, 0x9a, 0x22, 0x25), (0x39, 0x92, 0x20, 0x05),
    (0x39, 0x9a, 0x22, 0x05),
]


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


def palette_header(name):
    body = re.search(r'm_PaletteHeaderStart \$\w+, ' + name + r'\n(.*?)m_PaletteHeaderEnd',
                     text('paletteHeaders.s'), re.S).group(1)
    out = {'Bg': [None] * 8, 'Spr': [None] * 8}
    for kind, start, n, label in re.findall(r'm_PaletteHeader(Bg|Spr)\s+(\d+), (\d+), (\w+)', body):
        for k, p in enumerate(rgb555(label, int(n))):
            out[kind][int(start) + k] = p
    return out


def interleaved(name):
    if name.startswith('spr_'):
        default = True
    else:
        default = False
    path = os.path.join(SRC, name + '.properties')
    if not os.path.exists(path):
        return default
    m = re.search(r'interleave:\s*(\w+)', text(name + '.properties'))
    return (m.group(1) == 'true') if m else default


def png_tiles(name):
    """The file's 8x8 tiles in the order the cartridge holds them."""
    im = Image.open(os.path.join(SRC, name + '.png'))
    assert im.mode == 'P', f'{name} is not indexed'
    w, h = im.size
    cell = 16 if interleaved(name) else 8
    out = []
    for t in range((w // 8) * (h // cell)):
        tx, ty = (t % (w // 8)) * 8, (t // (w // 8)) * cell
        for half in range(cell // 8):
            out.append([[im.getpixel((tx + x, ty + half * 8 + y)) for x in range(8)] for y in range(8)])
    return out


def load(header, vram, mem):
    body = re.search(r'm_GfxHeaderStart \$\w+, ' + header + r'\n(.*?)m_GfxHeaderEnd',
                     text('gfxHeaders.s'), re.S).group(1)
    for line in body.split('\n'):
        m = re.match(r'\s*m_GfxHeader (\w+), (\S+?)(?:,|$)', line)
        if not m:
            continue
        name, dest = m.groups()
        if name.startswith(('gfx_', 'spr_')):
            if name == 'spr_link' or name == 'spr_rod_of_seasons':
                continue           # the file panel's Link and rod: not on this screen
            a = int(dest[1:], 16)
            for t, tile in enumerate(png_tiles(name)):
                vram[a & 1][(a & 0xfff0) + t * 16] = tile
        else:
            which, off = re.match(r'w4(TileMap|AttributeMap)(?:\+\$(\w+))?', dest).groups()
            off = int(off, 16) if off else 0
            data = open(os.path.join(SRC, name + '.bin'), 'rb').read()
            for i, v in enumerate(data):
                mem[which][off + i] = v


def screen(game_over):
    vram, mem = {0: {}, 1: {}}, {'TileMap': {}, 'AttributeMap': {}}
    load('GFXH_FILE_MENU_GFX', vram, mem)
    load('GFXH_SAVE_MENU_LAYOUT', vram, mem)
    load('GFXH_SAVE_MENU_GFX', vram, mem)
    if game_over:
        load('GFXH_GAME_OVER_GFX', vram, mem)
    pals = palette_header('PALH_06' if game_over else 'PALH_05')
    img = [[None] * 160 for _ in range(144)]
    for ty in range(18):
        for tx in range(20):
            ad = ty * 32 + tx
            t, at = mem['TileMap'][ad], mem['AttributeMap'][ad]
            tile = vram[(at >> 3) & 1][0x9000 + t * 16 if t < 0x80 else 0x8800 + (t - 0x80) * 16]
            pal = pals['Bg'][at & 7]
            for y in range(8):
                for x in range(8):
                    sx = 7 - x if at & 0x20 else x
                    sy = 7 - y if at & 0x40 else y
                    img[ty * 8 + y][tx * 8 + x] = pal[tile[sy][sx]]
    # The leaves: hardware sprites, the earlier one in front.
    for y, x, t, f in reversed(LEAVES):
        sprite(img, vram, pals['Spr'], y, x, t, f)
    return img, vram, pals


def sprite(img, vram, pals, y, x, t, f):
    """An 8x16 hardware sprite, placed as code/bank0.s places one."""
    y, x = y - 16, x - 8
    pal = pals[f & 7]
    for yy in range(16):
        sy = 15 - yy if f & 0x40 else yy
        tile = vram[(f >> 3) & 1][0x8000 + ((t & 0xfe) + sy // 8) * 16]
        for xx in range(8):
            v = tile[sy % 8][7 - xx if f & 0x20 else xx]
            py, px = y + yy, x + xx
            if v and 0 <= py < len(img) and 0 <= px < len(img[0]):
                img[py][px] = pal[v]


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
    out = {}
    for name, go in (('saveMenu', False), ('gameOverMenu', True)):
        img, vram, pals = screen(go)
        out[name] = indexed(img)
    # The acorn alone, in a 8x16 box of its own; the screen places it.
    img, vram, pals = screen(False)
    box = [[None] * 8 for _ in range(16)]
    sprite(box, vram, pals['Spr'], 16, 8, ACORN[2], ACORN[3])
    out['saveAcorn'] = dict(indexed(box), ax=ACORN[1] - 8, ay=ACORN[0] - 16)
    return out


def emit(screens):
    lines = [
        '// GENERATED by tools/rip-save.py — do not edit by hand. Re-run the ripper.',
        '// Source: assets/save/oracles-disasm/seasons/, from Stewmath\'s oracles-disasm',
        '// (github.com/Stewmath/oracles-disasm, commit 21c924a). Credit: the',
        '// oracles-disasm project and its contributors; the artwork is Nintendo\'s',
        '// and Capcom\'s. Fan-work use only.',
        '//',
        '// Seasons\' save-and-quit screen, and the same screen as its game over.',
        '',
        'export const SAVE_SCREENS = {',
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
