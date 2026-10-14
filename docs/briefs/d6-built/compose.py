#!/usr/bin/env python3
"""S189: the Hold as built, in the game, beside Seasons' own ice half.

    python3 compose.py <seasons renders dir> <game shots dir> <out.png>

Seasons' rooms come from docs/briefs/d6-mock/hold.py (room_img of layout
group 5, the Sword & Shield Maze); ours are tools/shoot-steps.mjs captures.
"""
import sys
from PIL import Image, ImageDraw, ImageFont
sd, gd, out = sys.argv[1], sys.argv[2], sys.argv[3]
F = ImageFont.load_default()
BG = (24, 24, 30)

def panel(path, title, scale):
    im = Image.open(path).convert('RGB')
    im = im.resize((im.width * scale, im.height * scale), Image.NEAREST)
    lines = title.split('\n')
    p = Image.new('RGB', (im.width, im.height + 12 * len(lines) + 6), BG)
    for i, l in enumerate(lines):
        ImageDraw.Draw(p).text((2, 3 + 12 * i), l, fill=(235, 235, 225), font=F)
    p.paste(im, (0, 12 * len(lines) + 6))
    return p

rows = [
    [panel(f'{sd}/seasons_84.png', "Oracle of Seasons: the Sword & Shield Maze, ice half ($84)\nthe ice, and the grabbable ice in its alcove", 2),
     panel(f'{sd}/seasons_78.png', "Seasons $78: ice, and holes down to the fire floor", 2),
     panel(f'{sd}/seasons_7c.png', "Seasons $7c: a hole field", 2)],
    [panel(f'{gd}/landing-6.png', "Ours, in the game: the Rime Landing\nLink on the ice with a chunk lifted off the dais", 1),
     panel(f'{gd}/sounding-2.png', "The Sounding Floor: the chunk dropped from\nupstairs is on the islet plate; the key fell", 1),
     panel(f'{gd}/slack-1.png', "Upstairs, the Slack Water at MID: the line\nhas hauled the chunk up the flooded well", 1),
     panel(f'{gd}/slack-6.png', "...thrown onto the plate past the pit:\nthe shutter opens", 1)],
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
