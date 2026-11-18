#!/usr/bin/env python3
"""S253 proposal: the Penstock's ice block, now vs two Cistern-coloured ones.

python3 docs/briefs/s253/art/make-penstock.py <scratch>
<scratch> holds pen-now.png, pen-grey.png, pen-blue.png from tools/shoot-mock.mjs
(d4 0,1,6 at LOW), the grey and blue ones needing the ripper change in the
separate S253 commit (o_iceblock_cistern_grey / _blue).
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFont

SCR = sys.argv[1]
OUT = os.path.join('docs', 'briefs', 's253', 'art')
FONT = ImageFont.load_default(size=13)
shots = [('NOW: the Keep\'s ice block', 'pen-now.png'),
         ('GREY: Dancing Dragon palette 3 (stone)', 'pen-grey.png'),
         ('BLUE: Dancing Dragon palette 5 (pale blue)', 'pen-blue.png')]
ims = [Image.open(os.path.join(SCR, f)).convert('RGB') for _, f in shots]

# whole rooms, 3x, stacked
S = 3
W, H = ims[0].width * S, ims[0].height * S
out = Image.new('RGB', (W * 3 + 40, H + 34), (34, 34, 38))
d = ImageDraw.Draw(out)
for k, ((lab, _), im) in enumerate(zip(shots, ims)):
    out.paste(im.resize((W, H), Image.NEAREST), (10 + k * (W + 10), 28))
    d.text((10 + k * (W + 10), 6), lab, fill=(240, 240, 240), font=FONT)
out.save(os.path.join(OUT, 'penstock-rooms.png'))

# the block close up (tile 12,8) on its floor, 8x, with the stone wall beside it
Z = 8
cell = 16 * Z
close = Image.new('RGB', (3 * (cell + 20) + 10, cell + 40), (34, 34, 38))
d = ImageDraw.Draw(close)
for k, ((lab, _), im) in enumerate(zip(shots, ims)):
    t = im.crop((12 * 16, 8 * 16, 13 * 16, 9 * 16)).resize((cell, cell), Image.NEAREST)
    close.paste(t, (10 + k * (cell + 20), 8))
    d.text((10 + k * (cell + 20), cell + 14), lab.split(':')[0], fill=(240, 240, 240), font=FONT)
close.save(os.path.join(OUT, 'penstock-block-closeup.png'))
