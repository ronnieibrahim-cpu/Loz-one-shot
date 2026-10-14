#!/usr/bin/env python3
"""S188: the D6 mock sheets. Upstairs rooms rendered in the real engine
(tools/shoot-mock.mjs with mock-spec.json), the Hold from Seasons' own ice
tiles (hold.py), Seasons' Sword & Shield Maze ice half beside them.

    python3 compose.py <dir with both renders> <outDir>
"""
import sys
from PIL import Image, ImageDraw, ImageFont
src, out = sys.argv[1], sys.argv[2]
F = ImageFont.load_default()
BG = (24, 24, 30)
S = 2
RED, CYAN, ORANGE, WHITE = (255, 70, 60), (60, 230, 255), (255, 170, 30), (255, 255, 255)

def load(n):
    im = Image.open(f'{src}/{n}.png').convert('RGB')
    return im.resize((im.width * S, im.height * S), Image.NEAREST)

def arrow(d, pts, col):
    pts = [(x * 16 * S + 16, y * 16 * S + 16) for x, y in pts]
    d.line(pts, fill=col, width=4)
    (x0, y0), (x1, y1) = pts[-2], pts[-1]
    dx, dy = (x1 > x0) - (x1 < x0), (y1 > y0) - (y1 < y0)
    px, py = -dy, dx
    d.polygon([(x1 + dx * 8, y1 + dy * 8), (x1 - dx * 6 + px * 8, y1 - dy * 6 + py * 8),
               (x1 - dx * 6 - px * 8, y1 - dy * 6 - py * 8)], fill=col)

def box(d, x, y, col):
    d.rectangle([x * 32 + 1, y * 32 + 1, x * 32 + 30, y * 32 + 30], outline=col, width=3)

def panel(name, title, arrows=(), boxes=()):
    im = load(name)
    d = ImageDraw.Draw(im)
    for pts, col in arrows: arrow(d, pts, col)
    for x, y, col in boxes: box(d, x, y, col)
    lines = title.split('\n')
    p = Image.new('RGB', (im.width, im.height + 12 * len(lines) + 6), BG)
    for i, l in enumerate(lines):
        ImageDraw.Draw(p).text((2, 3 + 12 * i), l, fill=(235, 235, 225), font=F)
    p.paste(im, (0, 12 * len(lines) + 6))
    return p

def sheet(rows, name):
    W = max(sum(p.width for p in r) + 8 * (len(r) + 1) for r in rows)
    H = sum(max(p.height for p in r) for r in rows) + 8 * (len(rows) + 1)
    sh = Image.new('RGB', (W, H), BG)
    y = 8
    for r in rows:
        x = 8
        for p in r:
            sh.paste(p, (x, y)); x += p.width + 8
        y += max(p.height for p in r) + 8
    sh.save(f'{out}/{name}')
    print(name, sh.size)

sheet([
    [panel('seasons_84', "Seasons: Sword & Shield Maze, ice half $84\n(the grabbable ice sits in the alcove)"),
     panel('seasons_78', "Seasons $78: ice, holes into the\nfire floor below"),
     panel('seasons_7c', "Seasons $7c: a hole field")],
    [panel('hold_landing', "Ours: B1 the Rime Landing - ice, alone\n(stair up to the Draw; chunks on the dais)"),
     panel('hold_sounding', "B1 the Sounding Floor, under the Slack Water:\nthe plate on the islet is under the east well"),
     panel('hold_plumb', "B1 the Plumb's Foot, under the Weighhouse:\nthe dark ring is under its well")],
], 'mock-hold.png')

sheet([
    [panel('slack_mid', "1F the Slack Water at MID: the wells are flooded.\nCast over the west well: the line comes back with\nthe chunk lying on the floor BELOW. Set it on the plate.",
           [([(5, 7.4), (5, 8.6)], CYAN)], [(5, 8, CYAN), (11, 9, WHITE)]),
     panel('slack_low', "...at LOW the wells are holes. Throw the chunk\ninto the east one: it falls to the floor below.",
           [([(9, 6.6), (9, 7.6)], RED)], [(9, 8, RED)]),
     panel('hold_sounding', "B1 below: the chunk lands on the islet's plate,\nthree tiles from any shore. A key falls.",
           [([(5, 8), (5, 7.2)], CYAN)], [(9, 8, RED)])],
], 'mock-sounding.png')

sheet([
    [panel('tally_mid', "1F the Tally Hall at MID: haul the chunk up\nthrough the south well (the Hold has no way across)",
           [([(11, 18.6), (11, 17.2)], CYAN)], [(11, 18, CYAN), (11, 6, RED)]),
     panel('tally_low', "...carry it round (Draw, Hauling Pit) to the\nnorth bank; at LOW drop it down the north well",
           [([(11, 4.6), (11, 5.6)], RED)], [(11, 6, RED)]),
     panel('hold_hall', "B1 the Rime Hall: chunks on the south ice,\nthe plate past the chasm, under the north well",
           [], [(11, 6, RED), (11, 18, CYAN)])],
], 'mock-over.png')

sheet([
    [panel('weigh_mid', "1F the Weighhouse (new): the Plumb's well at\n7,4. Haul a chunk up at MID; the plate opens the\nGarden door. Orange: under the 2F shaft above",
           [([(7, 3.4), (7, 4.4)], CYAN)], [(7, 4, CYAN), (4, 8, WHITE), (9, 5, ORANGE)]),
     panel('hold_plumb', "B1 the Plumb's Foot: the Hold's chunks.\nEvery one goes up through the Weighhouse",
           [], [(7, 4, CYAN)]),
     panel('garden_high', "1F the Drowned Garden, opened east.\nOrange: under the 2F middle shaft",
           [], [(13, 5, ORANGE)])],
    [panel('cs_mid', "2F the Crossed Shafts at MID: its two shafts are still holes - the sea has not\nreached this floor. Plates (white) on the middle island and the far island.",
           [], [(13, 5, ORANGE), (24, 5, ORANGE), (15, 3, WHITE), (23, 3, WHITE)])],
    [panel('cs_high', "...at HIGH they flood, and only then can the line reach down to 1F and bring a chunk up\nonto each island. Both plates held: the Boss Key's chest.",
           [([(24, 4.4), (24, 5.4)], CYAN)], [(13, 5, CYAN), (24, 5, CYAN), (15, 3, WHITE), (23, 3, WHITE)])],
], 'mock-plumb.png')
