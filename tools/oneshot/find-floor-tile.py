"""Scratch: find a 16x16 window on a sheet that reads as a FLAT FLOOR.

`rockFloor` was ripped from a window the ripper's note calls "cobbled paving".
Rendered at 16x16 in a four-colour ramp with a near-black darkest index it is
not paving, it is a heap of boulders — see any cliffs, reef or abyss screen,
where the walkable ground is a field of rounded grey lumps and Link stands on
top of them.

What a floor tile has to be, and what this scores for:
  * SEAMLESS AND PHASED. The window must equal the windows at +16,0 and 0,+16,
    which is the ripper's own rule and is what proves the window is aligned to
    the sheet's own grid rather than cutting across two tiles.
  * FOUR COLOURS OR FEWER, so nothing is lost quantising.
  * FLAT. The measure is the fraction of pixels in the DARKEST colour: a floor
    is mostly its two light tones with a sparse dark speckle. `rockFloor`'s
    window is 30% darkest, which is what draws an outline round every cobble
    and turns each into a lump.
  * NOT A GRADIENT. A tile whose top and bottom halves have very different
    mean brightness is a cliff face or a lip, not ground.
"""
import sys
from PIL import Image
from collections import Counter

SHEETS = sys.argv[1:] or ['assets/sheets/custom-oracle-style-overworld.png']

for path in SHEETS:
    im = Image.open(path).convert('RGB')
    W, H = im.size
    px = im.load()
    print(f'\n=== {path}  {W}x{H}')
    hits = []
    for y in range(0, H - 32, 8):
        for x in range(0, W - 32, 8):
            win = [px[x + i, y + j] for j in range(16) for i in range(16)]
            c = Counter(win)
            if len(c) > 4:
                continue
            # phased and seamless: the same content one tile right and one down
            if any(px[x + 16 + i, y + j] != win[j * 16 + i] for j in range(0, 16, 2) for i in range(0, 16, 2)):
                continue
            if any(px[x + i, y + 16 + j] != win[j * 16 + i] for j in range(0, 16, 2) for i in range(0, 16, 2)):
                continue
            ramp = sorted(c, key=lambda p: sum(p))
            darkest = ramp[0]
            darkfrac = c[darkest] / 256
            lum = lambda p: 0.3 * p[0] + 0.6 * p[1] + 0.1 * p[2]
            top = sum(lum(win[j * 16 + i]) for j in range(8) for i in range(16)) / 128
            bot = sum(lum(win[j * 16 + i]) for j in range(8, 16) for i in range(16)) / 128
            if abs(top - bot) > 18:
                continue
            if darkfrac > 0.12 or len(c) < 3:
                continue
            hits.append((darkfrac, x, y, len(c), ramp))
    hits.sort()
    seen = set()
    for darkfrac, x, y, n, ramp in hits:
        k = tuple(ramp)
        if k in seen:
            continue
        seen.add(k)
        print(f'  {x:5},{y:5}  colours {n}  darkest {darkfrac:.0%}  '
              + ' '.join('#%02x%02x%02x' % p for p in ramp))
        if len(seen) > 24:
            break
