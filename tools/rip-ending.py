#!/usr/bin/env python3
"""Cut Seasons' credits sky, its credits lettering and its THE END out of the cartridge (S213).

Regenerate with:  python3 tools/rip-ending.py

Source: assets/ending/oracles-disasm/seasons/, copied verbatim from Stewmath's
oracles-disasm (github.com/Stewmath/oracles-disasm, commit 21c924a). Credit:
the oracles-disasm project and its contributors, who took the cartridge
apart; the artwork is Nintendo's and Capcom's. Fan-work use only.

THE END OF SEASONS (code/seasons/cutscenes/endgameCutscenes.s). After its
four scenes and four story cards, Seasons loads GFXH_CREDITS_SCROLL with
PALH_SEASONS_a0 and rolls the rest of its staff up the screen in sprite
letters over a sky that scrolls down to a forest; then
endgameCutsceneHandler_0a_stage3 loads GFXH_CREDITS_THE_END with
PALH_SEASONS_a9 — the sunset card — and waits for a button. The story cards
are Seasons' story and are not taken (the human, S213); the sky, the
lettering and the sunset are.

  * `creditsSky`: the scroll's background, map_credits_bg (32x32 tiles at
    $9800) over gfx_credits_bg_1/2/3, read as the GBC reads a background —
    map byte -> tile ($9000 signed for 0-127, $8800 above), attribute bits
    0-2 palette, bit 3 VRAM bank, bits 5/6 flips — the 160 columns the
    screen shows, all 256 rows the scroll runs down.
  * `creditsTheEnd`: the sunset card, the screen at scroll 0.
  * `CREDITS_INKS`: those two palettes' inks 1-3, for the digits the
    cartridge's lettering does not have (drawn to match, S213).
  * `creditsFontW`, `creditsFontC`: spr_credits_font, the outlined capitals
    the staff names are spelt in (8x16 sprites, A-Z then . · - ~), in a row,
    in PALH_SEASONS_a0's two sprite palettes: 0 (white) and 1 (cyan). The
    order of the glyphs is CREDITS_GLYPHS below.

Files with `interleave: true` in their .properties are stored in the png as
8x16 columns (tools/gfx/gfx.py in the disasm), so they are read 8x16 and
split top then bottom; sprite files ("spr_") are interleaved by default.
"""
import os
import re

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets', 'ending', 'oracles-disasm', 'seasons')
OUT = os.path.join(ROOT, 'src', 'data', 'screens-ending.js')
KEYS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
# spr_credits_font's 8x16 glyphs, in the file's own order; '·' is the
# raised dot and '~' the swash the cartridge uses between words.
CREDITS_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ.·-~'


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
    default = name.startswith('spr_')
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


def load(header):
    """VRAM tiles by (bank, address) and the background maps by address."""
    vram, maps = {0: {}, 1: {}}, {}
    body = re.search(r'm_GfxHeaderStart \$\w+, ' + header + r'\n(.*?)m_GfxHeaderEnd',
                     text('gfxHeaders.s'), re.S).group(1)
    for line in body.split('\n'):
        m = re.match(r'\s*m_GfxHeader (\w+), \$(\w+)', line)
        if not m:
            continue                # w4TileMap and friends: not this screen's
        name, a = m.group(1), int(m.group(2), 16)
        if name.startswith(('gfx_', 'spr_')):
            if not os.path.exists(os.path.join(SRC, name + '.png')):
                continue            # sprites this rip does not draw
            for t, tile in enumerate(png_tiles(name)):
                vram[a & 1][(a & 0xfff0) + t * 16] = tile
        else:
            maps[a] = open(os.path.join(SRC, name + '.bin'), 'rb').read()
    return vram, maps


def background(header, pal, w, h):
    vram, maps = load(header)
    pals = palette_header(pal)['Bg']
    tmap, amap = maps[0x9800], maps[0x9801]
    img = [[None] * w for _ in range(h)]
    for ty in range(h // 8):
        for tx in range(w // 8):
            ad = ty * 32 + tx
            t, at = tmap[ad], amap[ad]
            tile = vram[(at >> 3) & 1][0x9000 + t * 16 if t < 0x80 else 0x8800 + (t - 0x80) * 16]
            p = pals[at & 7]
            for y in range(8):
                for x in range(8):
                    sx = 7 - x if at & 0x20 else x
                    sy = 7 - y if at & 0x40 else y
                    img[ty * 8 + y][tx * 8 + x] = p[tile[sy][sx]]
    return img


def font(palno):
    tiles = png_tiles('spr_credits_font')
    pal = palette_header('PALH_SEASONS_a0')['Spr'][palno]
    img = [[None] * (8 * len(CREDITS_GLYPHS)) for _ in range(16)]
    for g in range(len(CREDITS_GLYPHS)):
        for half in range(2):
            tile = tiles[g * 2 + half]
            for y in range(8):
                for x in range(8):
                    v = tile[y][x]
                    if v:
                        img[half * 8 + y][g * 8 + x] = pal[v]
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
    return {
        'creditsSky': indexed(background('GFXH_CREDITS_SCROLL', 'PALH_SEASONS_a0', 160, 256)),
        'creditsTheEnd': indexed(background('GFXH_CREDITS_THE_END', 'PALH_SEASONS_a9', 160, 144)),
        'creditsFontW': indexed(font(0)),
        'creditsFontC': indexed(font(1)),
    }


def emit(screens):
    lines = [
        '// GENERATED by tools/rip-ending.py — do not edit by hand. Re-run the ripper.',
        '// Source: assets/ending/oracles-disasm/seasons/, from Stewmath\'s oracles-disasm',
        '// (github.com/Stewmath/oracles-disasm, commit 21c924a). Credit: the',
        '// oracles-disasm project and its contributors; the artwork is Nintendo\'s',
        '// and Capcom\'s. Fan-work use only.',
        '//',
        '// Seasons\' credits sky, its credits lettering and its THE END sunset.',
        '',
        f"export const CREDITS_GLYPHS = '{CREDITS_GLYPHS}';",
        '',
        '// The two sprite palettes\' inks 1-3 (0 is see-through), for the letters',
        '// the cartridge never drew and src/data/sprites-credits-drawn.js draws.',
        'export const CREDITS_INKS = {',
    ] + [f"  {k}: [{', '.join(repr('#%02x%02x%02x' % c) for c in palette_header('PALH_SEASONS_a0')['Spr'][n][1:])}]," for k, n in (('W', 0), ('C', 1))] + [
        '};',
        '',
        'export const ENDING_SCREENS = {',
    ]
    for name, s in screens.items():
        lines.append(f'  {name}: {{ w: {s["w"]}, h: {s["h"]},')
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
