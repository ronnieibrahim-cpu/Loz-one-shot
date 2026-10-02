#!/usr/bin/env python3
"""Cut the opening's pictures out of Oracle of Seasons' own graphics (S168).

Regenerate with:  python3 tools/rip-intro.py

Source: assets/intro/oracles-disasm/seasons/ and the object tables in
assets/effects/oracles-disasm/seasons/ (identical there at this commit), all
copied verbatim from Stewmath's oracles-disasm
(github.com/Stewmath/oracles-disasm, commit 21c924a). Credit: the
oracles-disasm project and its contributors, who took the cartridge apart; the
artwork is Nintendo's and Capcom's. Fan-work use only.

THE OPENING IS OURS; ITS PIECES ARE THE CARTRIDGE'S. The human asked for a
pixel-art opening "like Seasons and Ages" and chose, of three storyboards,
scenes of our own — a ship at sea, a storm, Link on the shore — played before
the title the way Seasons plays its ride. Nothing here is from either game's
intro. What the scenes are built of is:

  * THE SEA (`introSea`): the open sea and sky Seasons draws behind its linked
    ending, GFXH_CREDITS_LINKED_THE_END in PALH_SEASONS_aa — two graphics
    files, a tile map and an attribute map, placed in VRAM as gfxHeaders.s
    says and read the way the GBC reads a background: map byte -> tile
    ($9000 signed for 0-127, $8800 above), attribute bits 0-2 palette, bit 3
    VRAM bank, bits 5/6 flips. The visible 20x18 tiles only; the map's other
    twelve columns are filler the ending never scrolls to.
  * THE SHIP (`introShip`) and THE GULL (`introGull`): INTERAC_LINK_SHIP
    ($d4) subids 0 and 1 — interactionData.s gives each its graphics
    ($70, spr_boat_theend), tile base and palette, its default animation the
    oam frame, and PALH_SEASONS_aa's sprite palettes 4-7 colour them. The
    ship is two palettes (hull and sail), which is why every picture here is
    an indexed image rather than a four-colour sprite. How each one bobs is
    timing and lives in src/data/feel.js.
  * THE LIGHTNING (`introBolt0`..): PART_LIGHTNING ($27) — partData.s row
    $27 (spr_projectiles_2, tile base $0e, palette 4), its nine oam frames in
    the order partAnimation574dd walks them, in standard sprite palette 4.

A hardware sprite is 8x16, placed as code/bank0.s @drawObject places it:
screen y = object y + oam y - 16, screen x = object x + oam x - 8. Each
object's frames share one box, and `ax`/`ay` is where the object's own
position falls in it, so the engine draws one at (x - ax, y - ay).
"""
import os
import re

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets', 'intro', 'oracles-disasm', 'seasons')
TABLES = os.path.join(ROOT, 'assets', 'effects', 'oracles-disasm', 'seasons')
OUT = os.path.join(ROOT, 'src', 'data', 'screens-intro.js')
KEYS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'


def text(path):
    with open(path) as f:
        return f.read()


def lines(name):
    return [l.split(';')[0].rstrip() for l in text(os.path.join(TABLES, name)).split('\n')]


def after(ls, label):
    k = next(i for i, l in enumerate(ls) if re.match(r'^' + label + r':', l))
    return ls[k + 1:]


def dbs(line):
    return [int(x[1:], 16) for x in line.strip()[3:].split()]


def dws(ls, label):
    out = []
    for l in after(ls, label):
        s = l.strip()
        if s.startswith('.dw'):
            out.append(s[3:].strip())
        elif re.match(r'^\w+:', s) and not out:
            continue
        else:
            break
    return out


def oam(ls, label):
    body = [l for l in after(ls, label) if l.strip()]
    n = dbs(body[0])[0]
    return [dbs(body[1 + i]) for i in range(n)]


def rgb555(src, label, count):
    """`count` four-colour palettes starting at `label`, scaled as the GBC does."""
    t = text(src)
    i = t.index(label + ':')
    cols = []
    for m in re.finditer(r'm_RGB16 \$(\w+) \$(\w+) \$(\w+)', t[i:]):
        cols.append(tuple((int(v, 16) << 3) | (int(v, 16) >> 2) for v in m.groups()))
        if len(cols) == count * 4:
            break
    return [cols[k * 4:k * 4 + 4] for k in range(count)]


def palette_header(name):
    """{'bg': [8 palettes or None], 'spr': [...]} of a palette header."""
    body = re.search(r'm_PaletteHeaderStart \$\w+, ' + name + r'\n(.*?)m_PaletteHeaderEnd',
                     text(os.path.join(SRC, 'paletteHeaders.s')), re.S).group(1)
    out = {'Bg': [None] * 8, 'Spr': [None] * 8}
    pd = os.path.join(TABLES, 'paletteData.s')
    for kind, start, n, label in re.findall(r'm_PaletteHeader(Bg|Spr)\s+(\d+), (\d+), (\w+)', body):
        for k, p in enumerate(rgb555(pd, label, int(n))):
            out[kind][int(start) + k] = p
    return out


def png_tiles(path, h=8):
    """8 x `h` tiles of an indexed png, left to right then down."""
    im = Image.open(path)
    assert im.mode == 'P', f'{path} is not indexed'
    w, hh = im.size
    out = []
    for t in range((w // 8) * (hh // h)):
        tx, ty = (t % (w // 8)) * 8, (t // (w // 8)) * h
        out.append([[im.getpixel((tx + x, ty + y)) for x in range(8)] for y in range(h)])
    return out


def background(header, pal_header, base, cols=20, rows=18):
    """The visible screen of a background, as rows of RGB tuples."""
    body = re.search(r'm_GfxHeaderStart \$\w+, ' + header + r'\n(.*?)m_GfxHeaderEnd',
                     text(os.path.join(SRC, 'gfxHeaders.s')), re.S).group(1)
    vram, mem = {0: {}, 1: {}}, {}
    for name, a in re.findall(r'm_GfxHeader (\w+), \$(\w+)', body):
        a = int(a, 16)
        if name.startswith('gfx_'):
            for t, tile in enumerate(png_tiles(os.path.join(SRC, name + '.png'))):
                vram[a & 1][(a & 0xfff0) + t * 16] = tile
        else:
            data = open(os.path.join(SRC, name + '.bin'), 'rb').read()
            for i, v in enumerate(data):
                mem[((a & 0xfff0) + i, a & 1)] = v
    pals = palette_header(pal_header)['Bg']
    img = [[None] * (cols * 8) for _ in range(rows * 8)]
    for ty in range(rows):
        for tx in range(cols):
            ad = base + ty * 32 + tx
            t, at = mem[(ad, 0)], mem[(ad, 1)]
            tile = vram[(at >> 3) & 1][0x9000 + t * 16 if t < 0x80 else 0x8800 + (t - 0x80) * 16]
            pal = pals[at & 7]
            for y in range(8):
                for x in range(8):
                    sx = 7 - x if at & 0x20 else x
                    sy = 7 - y if at & 0x40 else y
                    img[ty * 8 + y][tx * 8 + x] = pal[tile[sy][sx]]
    return img


def sprite_frames(sheet, base, frames, palettes):
    """[(rows of RGB-or-None)] for each oam frame, all in one box; (ax, ay)."""
    tiles = png_tiles(os.path.join(SRC, sheet), 16)
    boxes = []
    for entries in frames:
        for y, x, t, f in entries:
            y, x = (y - 256 if y > 127 else y) - 16, (x - 256 if x > 127 else x) - 8
            boxes.append((x, y, x + 8, y + 16))
    x0, y0 = min(b[0] for b in boxes), min(b[1] for b in boxes)
    x1, y1 = max(b[2] for b in boxes), max(b[3] for b in boxes)
    out = []
    for entries in frames:
        img = [[None] * (x1 - x0) for _ in range(y1 - y0)]
        # The earlier hardware sprite is in front: paint in reverse.
        for y, x, t, f in reversed(entries):
            y, x = (y - 256 if y > 127 else y) - 16, (x - 256 if x > 127 else x) - 8
            tile = tiles[((base + t) & 0xff) // 2]
            pal = palettes[f & 7]
            for yy in range(16):
                for xx in range(8):
                    sx = 7 - xx if f & 0x20 else xx
                    sy = 15 - yy if f & 0x40 else yy
                    v = tile[sy][sx]
                    if v:
                        img[y - y0 + yy][x - x0 + xx] = pal[v]
        out.append(img)
    return out, -x0, -y0


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


def interaction(index, subid):
    """(gfx sheet, tile base, palette, oam frames) of an interaction subid."""
    ls = lines('interactionData.s')
    label = 'interaction%02xSubidData' % index
    rows = [l for l in after(ls, label) if 'm_InteractionSubidData ' in l]
    gfx, base, b2 = [int(v[1:], 16) for v in rows[subid].split()[1:4]]
    heads = re.findall(r'/\* \$(\w+) \*/ m_ObjectGfxHeader (\w+)',
                       text(os.path.join(SRC, 'objectGfxHeaders.s')))
    sheet = dict((int(k, 16), v) for k, v in heads)[gfx] + '.png'
    an = lines('interactionAnimations.s')
    anim = dws(an, 'interaction%02xAnimations' % index)[b2 & 0x0f]
    ptrs = dws(an, 'interaction%02xOamDataPointers' % index)
    seq = []
    for l in after(an, anim):
        if not l.strip().startswith('.db'):
            break
        seq.append(dbs(l)[1] // 2)
    io = lines('interactionOamData.s')
    return sheet, base, (b2 >> 4) & 7, [oam(io, ptrs[k]) for k in dict.fromkeys(seq)]


def lightning():
    """(sheet, tile base, palette, [oam frames in the animation's order])."""
    rows = [dbs(l) for l in after(lines('partData.s'), 'partData') if l.strip().startswith('.db')]
    row = rows[0x27]
    pa = lines('partAnimations.s')
    anim = dws(pa, 'part27Animations')[0]
    ptrs = dws(pa, 'part27OamDataPointers')
    seq = []
    for l in after(pa, anim):
        if not l.strip().startswith('.db'):
            break
        hold, frame, param = dbs(l)
        if param == 0xff:
            break
        seq.append(frame // 2)
    po = lines('partOamData.s')
    heads = dict((int(k, 16), v) for k, v in re.findall(
        r'/\* \$(\w+) \*/ m_ObjectGfxHeader (\w+)', text(os.path.join(SRC, 'objectGfxHeaders.s'))))
    return heads[row[0]] + '.png', row[5], row[6] & 7, [oam(po, ptrs[k]) for k in seq]


def build():
    screens = {'introSea': indexed(background('GFXH_CREDITS_LINKED_THE_END', 'PALH_SEASONS_aa', 0x9800))}
    spr = palette_header('PALH_SEASONS_aa')['Spr']
    for name, subid in (('introShip', 0), ('introGull', 1)):
        sheet, base, pal, frames = interaction(0xd4, subid)
        # The object's palette is XORed with each oam entry's (code/bank0.s).
        frames = [[(y, x, t, f ^ pal) for y, x, t, f in fr] for fr in frames]
        imgs, ax, ay = sprite_frames(sheet, base, frames, spr)
        assert len(imgs) == 1, f'{name}: one frame expected'
        screens[name] = dict(indexed(imgs[0]), ax=ax, ay=ay)
    sheet, base, pal, frames = lightning()
    std = rgb555(os.path.join(TABLES, 'paletteData.s'), 'standardSpritePaletteData', 8)
    frames = [[(y, x, t, f ^ pal) for y, x, t, f in fr] for fr in frames]
    imgs, ax, ay = sprite_frames(sheet, base, frames, std)
    for k, img in enumerate(imgs):
        screens['introBolt%d' % k] = dict(indexed(img), ax=ax, ay=ay)
    return screens


HEADER = '''// GENERATED by tools/rip-intro.py — do not edit by hand; edit the ripper
// and re-run it. The opening's pictures, cut from Oracle of Seasons' own
// graphics: the sea behind its linked ending, the ship and gull from that
// scene (INTERAC_LINK_SHIP), and its lightning (PART_LIGHTNING).
//
// Source: Stewmath's oracles-disasm (github.com/Stewmath/oracles-disasm,
// commit 21c924a), assets/intro/oracles-disasm/seasons/ and the object tables
// in assets/effects/oracles-disasm/seasons/. Credit: the oracles-disasm
// project and its contributors; the artwork is Nintendo's and Capcom's.
// Fan-work use only.
//
// Each picture is an indexed image, as src/data/screens-seasons.js: `pal` is
// its colours, each character of `rows` an index into it (0-9, a-z, A-Z),
// `.` transparent. `ax`/`ay` is where the object's own position falls in it.
'''


def main():
    screens = build()
    out = HEADER.split('\n') + ['export const INTRO_SCREENS = {']
    for name, s in screens.items():
        extra = ''.join(' %s: %d,' % (k, s[k]) for k in ('ax', 'ay') if k in s)
        out.append('  %s: {' % name)
        out.append('    w: %d, h: %d,%s' % (s['w'], s['h'], extra))
        out.append('    pal: [%s],' % ', '.join("'%s'" % c for c in s['pal']))
        out.append('    rows: [')
        for r in s['rows']:
            out.append("      '%s'," % r)
        out.append('    ],')
        out.append('  },')
    out += ['};', '']
    with open(OUT, 'w') as f:
        f.write('\n'.join(out))
    print('emitted %d pictures -> %s' % (len(screens), OUT))


if __name__ == '__main__':
    main()
