#!/usr/bin/env python3
"""S253 proposal: waterfall mocks, now vs placed. Joins screenshots made by
tools/shoot-region.mjs (3x, one screen) before and after a TEMPORARY edit of
src/data/overworld.js and legends.js (reverted; see README for the exact cells).

python3 docs/briefs/s253/art/make-waterfalls.py <scratch>/wf
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFont

D = sys.argv[1]
OUT = os.path.join('docs', 'briefs', 's253', 'art')
FONT = ImageFont.load_default(size=13)
SETS = [('rustfall', 'Rustfall (0,3,0): 3 cells tall at column 7, rows 2-4', 'waterfall-1-rustfall.png'),
        ('cliffface', 'Cliff Face (0,3,3): 1 cell at column 4, row 2', 'waterfall-2-cliffface.png'),
        ('cistern', 'Cistern Path (0,0,3): 1 cell at column 1, row 2', 'waterfall-3-cistern.png')]
for key, title, name in SETS:
    a = Image.open(os.path.join(D, f'now-{key}.png')).convert('RGB')
    b = Image.open(os.path.join(D, f'wf-{key}.png')).convert('RGB')
    im = Image.new('RGB', (a.width * 2 + 30, a.height + 54), (34, 34, 38))
    d = ImageDraw.Draw(im)
    d.text((10, 6), title, fill=(240, 240, 240), font=FONT)
    d.text((10, 28), 'NOW', fill=(200, 200, 200), font=FONT)
    d.text((a.width + 20, 28), 'WITH THE WATERFALL', fill=(200, 200, 200), font=FONT)
    im.paste(a, (10, 46))
    im.paste(b, (a.width + 20, 46))
    im.save(os.path.join(OUT, name))

# Rustfall's fall at 8x, three cells tall
b = Image.open(os.path.join(D, 'wf-rustfall.png')).convert('RGB')
c = b.crop((6 * 48, 1 * 48, 8 * 48, 6 * 48))
c.resize((c.width * 3, c.height * 3), Image.NEAREST).save(os.path.join(OUT, 'waterfall-1-rustfall-closeup.png'))
