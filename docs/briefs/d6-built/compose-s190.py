#!/usr/bin/env python3
"""S190: the Weighhouse and the Crossed Shafts as built, in the game, beside
Seasons' own fire half of the Sword & Shield Maze.

    python3 compose-s190.py <pics dir> <out.png>

<pics dir> holds seasons_5e/6c/6d.png (room_img(5, r) of the oracle study's
render.py, as d6-mock/hold.py makes them); weigh-6/7/13.png and
cs-5/6/12.png (tools/shoot-steps.mjs captures); f1-crop.png, f2-mid-cs.png
and f2-high-cs.png (crops of tools/shoot-dungeon.mjs d6 --floor=1 --tide=1
and --floor=2 --tide=1/2).
"""
import sys
from PIL import Image, ImageDraw, ImageFont
d, out = sys.argv[1], sys.argv[2]
F = ImageFont.load_default()
BG = (24, 24, 30)

def panel(path, title, scale=1.0):
    im = Image.open(f'{d}/{path}').convert('RGB')
    if scale != 1.0:
        im = im.resize((int(im.width * scale), int(im.height * scale)), Image.NEAREST)
    lines = title.split('\n')
    p = Image.new('RGB', (max(im.width, 10), im.height + 12 * len(lines) + 6), BG)
    for i, l in enumerate(lines):
        ImageDraw.Draw(p).text((2, 3 + 12 * i), l, fill=(235, 235, 225), font=F)
    p.paste(im, (0, 12 * len(lines) + 6))
    return p

rows = [
    [panel('seasons_5e.png', "Oracle of Seasons: the Sword & Shield Maze,\nfire half ($5e): a field of holes"),
     panel('seasons_6c.png', "Seasons $6c: holes between statues"),
     panel('seasons_6d.png', "Seasons $6d: a floor button by the wall")],
    [panel('weigh-6.png', "Ours: the Weighhouse (new) at MID. The line\nis cast down the flooded well...", 0.5),
     panel('weigh-7.png', "...and comes back with the ice chunk\nthe Hold keeps on the floor beneath", 0.5),
     panel('weigh-13.png', "Thrown over the pit onto the plate in the\nnook: the shutter to the Garden opens", 0.5)],
    [panel('f2-mid-cs.png', "The Crossed Shafts at MID: the two new shafts are holes (the sea has not\nreached this floor); a plate in a nook on each island; the urn where the chest stood", 1.5)],
    [panel('f2-high-cs.png', "...and at HIGH they flood, and only then can the line reach down to the floor below", 1.5)],
    [panel('cs-5.png', "At HIGH on the middle island: the line\nhauls up the chunk left in the Garden below", 0.5),
     panel('cs-6.png', "In his hands, carried round the hole...", 0.5),
     panel('cs-12.png', "...and thrown onto the north plate. The\nfar island's is the same; both raise the chest", 0.5)],
    [panel('f1-crop.png', "1F at MID: the Drowned Garden (now with a way east), the Weighhouse, the Hauling Pit; below them\nthe Dredge Vault, the Slack Water (a new north door) and the Draw. The Weighhouse's south and east doors are the two new locks", 1.0)],
]
W = max(sum(p.width for p in r) + 8 * (len(r) + 1) for r in rows)
H = sum(max(p.height for p in r) for r in rows) + 8 * (len(rows) + 1)
sh = Image.new('RGB', (W, H), BG)
y = 8
for r in rows:
    x = 8
    for p in r:
        sh.paste(p, (x, y)); x += p.width + 8
    y += max(p.height for p in r) + 8
sh.save(out)
print(out, sh.size)
