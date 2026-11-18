#!/usr/bin/env python3
"""S253 proposal: candidate mooring-post tiles for the Abyssal Keep.

Run from the repo root:  python3 docs/briefs/s253/art/make-mooring.py <scratch>
where <scratch> holds draw-now.png and draw-nopost.png (shoot-mock.mjs of the
Draw, d6 1,6,3, with and without its two posts). Reads the cartridges' own
tilesets through tools/rip-objects.py's Tileset; nothing in src/ is touched.
"""
import importlib.util
import os
import sys

from PIL import Image, ImageDraw, ImageFont

spec = importlib.util.spec_from_file_location('ro', 'tools/rip-objects.py')
ro = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ro)

SCR = sys.argv[1]
OUT = os.path.join('docs', 'briefs', 's253', 'art')
FONT = ImageFont.load_default(size=13)


def tile(idx, m, key=True, pal=None):
    """RGBA 16x16 of metatile m; the ground flooded out from the edge."""
    ts = ro.Tileset(idx)
    g, p = ts.metatile(m)
    pal = pal or p
    kg = ro.key_ground(g) if key else g
    im = Image.new('RGBA', (16, 16), (0, 0, 0, 0))
    for y in range(16):
        for x in range(16):
            v = kg[y][x]
            if v is not None:
                im.putpixel((x, y), tuple(pal[v]) + (255,))
    return im


def current_post():
    """The game's dPost as drawn now: the hand-drawn grid in the stone ramp."""
    src = open('src/data/tiles-core.js').read()
    body = src.split('dPost: `')[1].split('`')[0]
    rows = [r.strip() for r in body.strip().split('\n')]
    ramp = [(0xe0, 0xe0, 0xd0), (0xa0, 0xa8, 0x98), (0x60, 0x68, 0x60), (0x24, 0x2c, 0x28)]
    im = Image.new('RGBA', (16, 16), (0, 0, 0, 0))
    for y, r in enumerate(rows):
        for x, c in enumerate(r):
            if c != '.':
                im.putpixel((x, y), ramp[int(c)] + (255,))
    return im


STONE = [(208, 208, 200), (144, 150, 144), (70, 78, 76), (20, 24, 28)]
CANDS = [
    ('NOW: dPost\n(hand-drawn grey\nblock)', current_post()),
    ('A: bollard, Ages Ancient\nTomb metatile $10,\nits own greys',
     tile(('ages', 64), 0x10)),
    ('(for reference) the same tile in\nthe Keep\'s own colours: this is\nalready the Keep\'s gold urn',
     tile(0x42, 0x10)),
    ('B: ring in a stone plate,\nAges underwater\nmetatile $8a, greyed',
     tile(('ages', 95), 0x8a, key=False, pal=STONE)),
    ('C: wooden pilings,\nSeasons overworld\nmetatile $b9',
     tile(0, 0xb9)),
]


def up(im, s):
    return im.resize((im.width * s, im.height * s), Image.NEAREST)


def label(d, xy, text, fill=(240, 240, 240)):
    d.multiline_text(xy, text, fill=fill, font=FONT, spacing=2)


# (a) the candidates on the Keep's floor, 6x
floor = Image.open(os.path.join(SCR, 'draw-nopost.png')).convert('RGBA')
# a plain floor tile of the Keep, cut from the room (tile 3,3)
ft = floor.crop((3 * 16, 3 * 16, 4 * 16, 4 * 16))
S = 6
cw = 16 * S + 150
sheet = Image.new('RGB', (cw * len(CANDS), 16 * S + 90), (34, 34, 38))
d = ImageDraw.Draw(sheet)
for k, (lab, im) in enumerate(CANDS):
    bg = ft.copy()
    bg.alpha_composite(im)
    sheet.paste(up(bg, S).convert('RGB'), (k * cw + 12 + 25, 12))
    label(d, (k * cw + 8, 16 * S + 20), lab)
sheet.save(os.path.join(OUT, 'mooring-candidates.png'))

# (b) the real room, now vs candidate, 3x; both posts at (12,8) and (7,8)
now = Image.open(os.path.join(SCR, 'draw-now.png')).convert('RGBA')


def with_post(im):
    r = floor.copy()
    for tx, ty in ((12, 8), (7, 8)):
        r.alpha_composite(im, (tx * 16, ty * 16))
    return r


def room_pair(name, cand_label, cand_im, scale=3):
    a = up(now, scale)
    b = up(with_post(cand_im), scale)
    W = a.width
    out = Image.new('RGB', (W * 2 + 30, a.height + 36), (34, 34, 38))
    out.paste(a.convert('RGB'), (10, 28))
    out.paste(b.convert('RGB'), (W + 20, 28))
    dd = ImageDraw.Draw(out)
    label(dd, (10, 6), 'NOW')
    label(dd, (W + 20, 6), cand_label)
    out.save(os.path.join(OUT, name))


room_pair('mooring-room-A-bollard.png', 'A: bollard (Ages Ancient Tomb greys)', CANDS[1][1])
room_pair('mooring-room-C-pilings.png', 'C: wooden pilings (Seasons overworld)', CANDS[4][1])
