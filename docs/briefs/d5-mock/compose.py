#!/usr/bin/env python3
"""S185: the D5 mock's pictures. Pastes the Ancient Ruins' own belt tile (cut
from the cartridge render of Ancient Ruins 2F $c6, made by
tools/oneshot/oracle-study/run.sh) over every belt cell of the shoot-mock
renders, draws which way each belt runs, and lays the pictures out.

    python3 compose.py <study dir> <mock dir> <out dir>
"""
import json, os, sys
from PIL import Image, ImageDraw, ImageFont

STUDY, MOCK, OUT = sys.argv[1:4]
H = os.path.dirname(os.path.abspath(__file__))
BELTS = json.load(open(os.path.join(H, 'belts.json')))
F = ImageFont.load_default()

f1 = Image.open(os.path.join(STUDY, 'seasons-d06-f1.png')).convert('RGB')
c6 = f1.crop((488, 357, 488 + 240, 357 + 176))
BELT = c6.crop((32, 32, 48, 48))          # a belt tile of Ancient Ruins $c6
ARROW = {'e': (1, 0), 'w': (-1, 0), 'n': (0, -1), 's': (0, 1)}


def room(name, sea):
    im = Image.open(os.path.join(MOCK, name)).convert('RGB')
    key = name.split('-')[0]
    if sea < 2 and BELTS.get(key):
        d = ImageDraw.Draw(im)
        # Paint the belt only where the render still shows the placeholder
        # floor, so a pillar, Link or anything else on the belt stays on top.
        ref = Image.open(os.path.join(MOCK, key + '-0.png')).convert('RGB')
        x0, y0 = BELTS[key][0][0], BELTS[key][0][1]
        alt = ref.crop((x0 * 16, y0 * 16, x0 * 16 + 16, y0 * 16 + 16))
        for x, y, c in BELTS.get(key, []):
            for yy in range(16):
                for xx in range(16):
                    if im.getpixel((x * 16 + xx, y * 16 + yy)) == alt.getpixel((xx, yy)):
                        im.putpixel((x * 16 + xx, y * 16 + yy), BELT.getpixel((xx, yy)))
        for x, y, c in BELTS.get(key, []):
            if (x + y) % 3: continue
            dx, dy = ARROW[c]
            cx, cy = x * 16 + 8, y * 16 + 8
            d.line((cx - dx * 5, cy - dy * 5, cx + dx * 5, cy + dy * 5), fill=(255, 255, 255), width=2)
            d.polygon([(cx + dx * 7, cy + dy * 7), (cx + dx * 2 - dy * 4, cy + dy * 2 + dx * 4),
                       (cx + dx * 2 + dy * 4, cy + dy * 2 - dx * 4)], fill=(255, 255, 255))
    return im


def sheet(cells, cols, title, out, scale=2):
    w, h = 240 * scale, 176 * scale
    rows = (len(cells) + cols - 1) // cols
    S = Image.new('RGB', (cols * (w + 8) + 8, 30 + rows * (h + 26)), (24, 24, 28))
    d = ImageDraw.Draw(S)
    d.text((8, 8), title, fill=(240, 240, 240), font=F)
    for i, (label, im) in enumerate(cells):
        x, y = 8 + (i % cols) * (w + 8), 30 + (i // cols) * (h + 26)
        d.text((x, y), label, fill=(220, 220, 200), font=F)
        S.paste(im.resize((w, h), Image.NEAREST), (x, y + 14))
    S.save(os.path.join(OUT, out))


sheet([
    ('Seasons: Ancient Ruins 2F $c6 (the cartridge)', c6),
    ('Ours: the Hollow Crown, LOW (belts run)', room('hollow_crown-0.png', 0)),
    ('Ours: the Hollow Crown, MID (belts run)', room('hollow_crown-1.png', 1)),
    ('Ours: the Hollow Crown, HIGH (drowned: still, swum)', room('hollow_crown-2.png', 2)),
], 2, 'Belts, alone. A belt carries Link (and enemies) half a pixel a frame, as Seasons does; a drowned belt does not turn.', 'mock-belts.png')

sheet([
    ('The Belt Bough: the belt runs into a knot-hole; the snarl is over a belt tile', room('belt_bough-1.png', 1)),
    ('...a seed rides the belt while it grows: at MID the stake stops Link under the snarl', room('belt_bough-stake-1.png', 1)),
    ('The Grove Crown (2F): a knot-hole over the plate below', room('grove_crown-0.png', 0)),
    ('The Standing Grove (1F) under it, MID: a hold plate nothing can reach', room('standing_grove-1.png', 1)),
    ('...the seed falls through and grows on the plate: held for good', room('standing_grove-held-1.png', 1)),
    ('The Standing Grove at HIGH: the boles are gone; the plate is still out of reach', room('standing_grove-2.png', 2)),
], 2, 'A seed on a belt, then the first drop: the Canopy plants the Shrine.', 'mock-drop.png')
print('wrote mock-belts.png, mock-drop.png')
