#!/usr/bin/env python3
"""S188: the Hold (B1) drawn from Oracle of Seasons' OWN ice tiles — the Sword
& Shield Maze's ice half, tileset $41, metatiles read by rip-objects.py's
Tileset — because ice is not in the engine yet. Each room is laid out as our
grid says; the chunk is Seasons' INTERAC_D8_GRABBABLE_ICE picture (tiles $0a
and $0c of spr_pedestal_ice, its two 8x16 halves), in an ice palette chosen
by eye (the cartridge's sprite palette 4 for this room is not resolved here).

    ORACLE_STUDY=<dir with oracles-disasm/ and flat-seasons/> \
      python3 hold.py <outDir>
"""
import sys, os
OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
here = os.path.dirname(os.path.abspath(__file__))
root = os.path.abspath(os.path.join(here, '..', '..', '..'))
__file__ = os.path.join(root, 'tools/oneshot/oracle-study/render.py')
sys.argv = ['render.py', 'seasons']
exec(open(__file__).read().split('if __name__')[0])
from PIL import Image
TS_ICE = 0x41
M = {'.': 0xa0, 'i': 0x8c, 'B': 0x1d, 'p': 0x10, 'P': 0x0c, 'S': 0x45, 'r': 0xa1}

def ring(g, x, y):
    H, W = len(g), len(g[0])
    top, bot, lef, rig = y == 0, y == H - 1, x == 0, x == W - 1
    if top and lef: return 0xb8
    if top and rig: return 0xb9
    if bot and lef: return 0xba
    if bot and rig: return 0xbb
    if top: return 0xb0
    if bot: return 0xb2
    if lef: return 0xb3
    return 0xb1

def door_jamb(g, x, y):
    """A wall cell beside a doorway gap gets Seasons' jamb piece."""
    H, W = len(g), len(g[0])
    gap = lambda a, b: 0 <= a < W and 0 <= b < H and g[b][a] != '#'
    if y == 0 or y == H - 1:
        if gap(x + 1, y): return 0xb7 if y == 0 else 0xb5
        if gap(x - 1, y): return 0xb6 if y == 0 else 0xb4
    if x == 0 or x == W - 1:
        if gap(x, y + 1): return 0xb7 if x == 0 else 0xb6
        if gap(x, y - 1): return 0xb5 if x == 0 else 0xb4
    return None

def draw(g):
    H, W = len(g), len(g[0])
    im = Image.new('RGB', (W * 16, H * 16))
    for y in range(H):
        for x in range(W):
            c = g[y][x]
            edge = x in (0, W - 1) or y in (0, H - 1)
            if c == '#':
                m = (door_jamb(g, x, y) if edge else None) or (ring(g, x, y) if edge else 0xb0)
                if not edge: m = 0xa6
            elif c == 'O':
                up = y > 0 and g[y - 1][x] == 'O'; dn = y < H - 1 and g[y + 1][x] == 'O'
                m = 0xf4 if up and dn else (0xf5 if not up else 0xf6)
            else:
                m = M[c]
            im.paste(metatile(TS_ICE, m), (x * 16, y * 16))
    return im

DIS = os.environ['ORACLE_STUDY'] + '/oracles-disasm'
spr = Image.open(DIS + '/gfx_compressible/seasons/spr_pedestal_ice.png')
PAL = {1: (248, 248, 248), 2: (120, 200, 248), 3: (24, 40, 96)}
CHUNK = Image.new('RGBA', (16, 16), (0, 0, 0, 0))
for yy in range(16):
    for xx in range(16):
        v = spr.getpixel((40 + xx, yy))
        if v: CHUNK.putpixel((xx, yy), PAL[v] + (255,))

ROOMS = {
  # B1 5,3: under the Slack Water. Its west well (5,8) drops onto open ice;
  # its east well (9,8) onto a plate on an islet three tiles from any shore.
  'sounding': ['#######.#######',
               '#iiiiiiiiiiiii#',
               '#iiiiiiiiiiiii#',
               '#iiiiiiiiiiiii#',
               '#ii...........#',
               '#ii..OOOOOOO...',
               '#ii..OOOOOOO..#',
               '#ii..OOOOOOO..#',
               '#ii.rOOOPOOO..#',
               '#ii..OOOOOOO..#',
               '###############'],
  # B1 5,2: the Plumb's foot, under the Weighhouse's well (7,4).
  'plumb':    ['###############',
               '#.ppp.....ppp.#',
               '#.............#',
               '#..iiiiiiiii..#',
               '#..iiiirliii..#',
               '#..iiiiiiiii..#',
               '#..iiiiiiiii..#',
               '#..B.......B..#',
               '#.............#',
               '#.............#',
               '#######.#######'],
  # B1 6,3: the Rime Landing, at the foot of the Draw's new stair.
  'landing':  ['###############',
               '#.....BrrrB...#',
               '#.....BrrrB...#',
               '#.....BB.BB...#',
               '#iiiiiiiiiiiii#',
               'iiiiiiiiiiiiiii',
               '#iiiiiiiiiiiii#',
               '#iiiiiiiiiiiii#',
               '#.S...........#',
               '#.............#',
               '###############'],
  # B1 7,2 (1x2): the Rime Hall, under the Tally Hall. The plate (11,6) is
  # under the Tally Hall's north well; the ring (11,18) under its south one.
  'hall':     ['###############',
               '#.............#',
               '#.............#',
               '#....p...p....#',
               '#.............#',
               '#.............#',
               '#..........P..#',
               '#.............#',
               '#.............#',
               '#.............#',
               '#OOOOOOOOOOOOO#',
               '#OOOOOOOOOOOOO#',
               '#OOOOOOOOOOOOO#',
               '#OOOOOOOOOOOOO#',
               '#OOOOOOOOOOOOO#',
               '#iiiiiiiiiiiii#',
               'iiiiiiiiiiiiii#',
               '#iiiiiiiiiiiii#',
               '#iiiiiiiiiir..#',
               '#iiiiiiiiiiii.#',
               '#.............#',
               '###############'],
}
ROOMS['plumb'][4] = ROOMS['plumb'][4].replace('l', 'i')
CHUNKS = {'sounding': [(5, 8)], 'plumb': [(3, 8), (4, 8), (10, 8), (11, 8)],
          'landing': [(7, 1), (8, 1), (9, 2)], 'hall': [(3, 19), (4, 19)]}
for name, g in ROOMS.items():
    im = draw(g).convert('RGBA')
    for (x, y) in CHUNKS.get(name, []):
        im.alpha_composite(CHUNK, (x * 16, y * 16))
    im.convert('RGB').save(os.path.join(OUT, 'hold_%s.png' % name))
    print('wrote hold_%s.png' % name)
# and Seasons' own rooms, for beside them
for r in (0x84, 0x78, 0x7c):
    im, _, _ = room_img(5, r)
    im.save(os.path.join(OUT, 'seasons_%02x.png' % r))
