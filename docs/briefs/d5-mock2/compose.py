#!/usr/bin/env python3
"""S187: the K4/K5 mock sheet. Rooms are rendered by the real engine
(tools/oneshot/mock-render.mjs with shots.json here; the same drawing path
as shoot-dungeon.mjs)
and set beside Seasons' Ancient Ruins 2F $c6, cut from s186-canopy.png.
Arrows show where a seed thrown from where Link stands goes.

    node tools/oneshot/mock-render.mjs docs/briefs/d5-mock2/shots.json <dir>
    (and ruins.png, cut from d5-built/s186-canopy.png, in <dir>)
    python3 compose.py <dir> <out.png>
"""
import sys
from PIL import Image, ImageDraw, ImageFont
src, out = sys.argv[1], sys.argv[2]
F = ImageFont.load_default()
BG = (24, 24, 30)
S = 2  # renders are 1x; drawn at 2x

def load(n):
    im = Image.open(f'{src}/{n}').convert('RGB')
    return im.resize((im.width * S, im.height * S), Image.NEAREST)

def arrow(d, pts, col):
    pts = [(x * 16 * S + 16, y * 16 * S + 16) for x, y in pts]
    d.line(pts, fill=col, width=4)
    (x0, y0), (x1, y1) = pts[-2], pts[-1]
    dx, dy = (x1 > x0) - (x1 < x0), (y1 > y0) - (y1 < y0)
    px, py = -dy, dx
    d.polygon([(x1 + dx * 8, y1 + dy * 8), (x1 - dx * 6 + px * 8, y1 - dy * 6 + py * 8), (x1 - dx * 6 - px * 8, y1 - dy * 6 - py * 8)], fill=col)

def panel(im, title, arrows=()):
    d = ImageDraw.Draw(im)
    for pts, col in arrows: arrow(d, pts, col)
    p = Image.new('RGB', (im.width, im.height + 18), BG)
    ImageDraw.Draw(p).text((2, 3), title, fill=(235, 235, 225), font=F)
    p.paste(im, (0, 18))
    return p

RED, CYAN, ORANGE = (255, 70, 60), (60, 230, 255), (255, 170, 30)
ruins = Image.open(f'{src}/ruins.png').convert('RGB')
rows = [
    [panel(ruins, "Seasons: Ancient Ruins 2F, its belt room (the cartridge)"),
     panel(load('fc_low.png'), "Ours: the Ford Crown at LOW - the crossing carries west", [([(3, 8.6), (3, 7), (1.2, 7)], RED)]),
     panel(load('fc_mid.png'), "...and at MID - the same throw goes east", [([(3, 8.6), (3, 7), (4.8, 7)], CYAN)])],
    [panel(load('lf_before.png'), "The Long Ford below: two sealed notches, a stair up"),
     panel(load('lf_after.png'), "...one stake from each sea holds both: a chest (Small Key)"),
     panel(load('fc_high.png'), "The Ford Crown at HIGH: drowned belts, no road")],
    [panel(load('hb_low.png'), "Ours: the High Bough (3 screens) at LOW - the low belt carries north (red); the crossing dumps a seed in a plain hole (orange)",
           [([(30, 5.6), (30, 2.3)], RED), ([(36.6, 4), (35, 4), (35, 5.7)], ORANGE)])],
    [panel(load('hb_mid.png'), "...at MID the crossing carries north (cyan); the third: plant a stake in the pool, stand on it at LOW, throw (red)",
           [([(36.6, 4), (35, 4), (35, 2.3)], CYAN), ([(40, 6.6), (40, 5)], (255, 255, 255)), ([(40, 5), (40, 2.3)], RED)])],
    [panel(load('sf_before.png'), "The Shrine Ford below: three sealed notches over the east hall; no Boss Key yet")],
    [panel(load('sf_after.png'), "...all three held: the Boss Key's chest rises in the west hall")],
]
W = max(sum(p.width for p in r) + 8 * (len(r) + 1) for r in rows)
H = sum(max(p.height for p in r) for r in rows) + 8 * (len(rows) + 1)
sheet = Image.new('RGB', (W, H), BG)
y = 8
for r in rows:
    x = 8
    for p in r:
        sheet.paste(p, (x, y)); x += p.width + 8
    y += max(p.height for p in r) + 8
sheet.save(out)
print(out, sheet.size)
