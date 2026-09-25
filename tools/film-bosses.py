#!/usr/bin/env python3
"""Turn tools/film-bosses.mjs's frame folders into something a person watches.

    python3 tools/film-bosses.py <filmDir> [--scale 2] [--every 3] [--max 40]

For each fight folder: <name>.gif, the fight at real speed (each frame held
for `every` sixtieths of a second, the rate it was filmed at), clipped to its
first `--max` seconds; and <name>-strip.png, twelve frames spread evenly over
the whole fight, left to right, top to bottom. Asserts nothing.
"""
import argparse, json, os
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument('film')
ap.add_argument('--scale', type=int, default=2)
ap.add_argument('--every', type=int, default=3)
ap.add_argument('--max', type=float, default=40)
a = ap.parse_args()

for d in sorted(os.listdir(a.film)):
    p = os.path.join(a.film, d)
    if not os.path.isdir(p):
        continue
    names = sorted(f for f in os.listdir(p) if f.endswith('.png'))
    if not names:
        continue
    keep = names[:int(a.max * 60 / a.every)]
    frames = [Image.open(os.path.join(p, n)).convert('RGB') for n in keep]
    big = [f.resize((f.width * a.scale, f.height * a.scale), Image.NEAREST) for f in frames]
    pal = [b.quantize(colors=64, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE) for b in big]
    pal[0].save(os.path.join(a.film, d + '.gif'), save_all=True, append_images=pal[1:],
                duration=round(a.every * 1000 / 60), loop=0, disposal=1)
    pick = [names[round(i * (len(names) - 1) / 11)] for i in range(12)]
    w, h = 160 * a.scale, 144 * a.scale
    sheet = Image.new('RGB', (4 * w + 3 * 4, 3 * h + 2 * 4), (40, 40, 40))
    for i, n in enumerate(pick):
        im = Image.open(os.path.join(p, n)).convert('RGB').resize((w, h), Image.NEAREST)
        sheet.paste(im, ((i % 4) * (w + 4), (i // 4) * (h + 4)))
    sheet.save(os.path.join(a.film, d + '-strip.png'))
    print(d, len(names), 'frames ->', len(keep), 'in gif')
