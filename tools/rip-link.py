#!/usr/bin/env python3
"""Extract Link's frames from the Oracle of Ages sprite sheet into the game's
art format.

The sheet's "True Colors" half uses exactly three colours plus a white
transparent background, which maps cleanly onto the engine's 4-index format:

    white  (255,255,255) -> '.'  transparent
    skin   (255,214,140) -> '0'  skin and blond hair
    tunic  (16,173,66)   -> '1'  green tunic
    black  (0,0,0)       -> '3'  outline

Sprites on the sheet face LEFT; the engine's convention is side art faces RIGHT,
so side frames are mirrored on the way out.

Usage:
    python3 tools/rip-link.py --dump X Y          print one cell as text
    python3 tools/rip-link.py --scan Y            list cell origins on a row band
    python3 tools/rip-link.py --emit              write the art module
"""
import sys, json, os

from PIL import Image

SHEET = os.environ.get('LINK_SHEET') or os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    'assets', 'sheets', 'oracle-ages-link.png')

SHEET_GREEN = (0, 128, 0)
WHITE = (255, 255, 255)
MAP = {
    (255, 255, 255): '.',
    (255, 214, 140): '0',
    (16, 173, 66): '1',
    (0, 0, 0): '3',
    # GBC-LCD half, in case it is ever preferred
    (252, 230, 198): '0',
    (59, 180, 112): '1',
}

im = Image.open(SHEET).convert('RGB')
W, H = im.size
px = im.load()


def cell(ox, oy, w=16, h=16, flip=False):
    """Return a list of rows in the engine's art grammar."""
    rows = []
    for y in range(h):
        row = []
        for x in range(w):
            sx = ox + (w - 1 - x if flip else x)
            p = px[sx, oy + y] if 0 <= sx < W and 0 <= oy + y < H else WHITE
            row.append(MAP.get(p, '.'))
        rows.append(''.join(row))
    return rows


def scan(y, x0=888, x1=None):
    """Cell origins on the row band starting at y: runs of white on its top row."""
    x1 = x1 or W
    out, x = [], x0
    while x < x1:
        if px[x, y] == WHITE:
            x2 = x
            while x2 + 1 < x1 and px[x2 + 1, y] == WHITE:
                x2 += 1
            if x2 - x + 1 >= 8:
                out.append((x, x2 - x + 1))
            x = x2 + 1
        else:
            x += 1
    return out


def band_tops(x0=888):
    """Row indices where a band of sprite content begins."""
    tops, inb = [], False
    for y in range(H):
        n = sum(1 for x in range(x0, W, 2) if px[x, y] != SHEET_GREEN)
        if n > 0 and not inb:
            tops.append(y)
            inb = True
        elif n == 0:
            inb = False
    return tops


# ---------------------------------------------------------------------------
# Frame map: sheet coordinates for each engine sprite name.
# Sheet sprites face LEFT, so side frames are mirrored to the engine's
# right-facing convention. Down/up walk cycles use the original plus its mirror,
# which is how the games themselves animate those directions.
# ---------------------------------------------------------------------------

IDLE_Y, ACT_Y = 38, 69

# A frame is (x, y, flip) for a 16x16 cell, or (x, y, flip, w, h) for one that
# is not 16x16. Only the held-blade poses need the second form — see HOLD below.

FRAMES = {
    'link_walk_down_0': (895, IDLE_Y, False),
    'link_walk_down_1': (895, IDLE_Y, True),
    'link_walk_up_0':   (912, IDLE_Y, False),
    'link_walk_up_1':   (912, IDLE_Y, True),
    'link_walk_side_0': (929, IDLE_Y, True),
    'link_walk_side_1': (946, IDLE_Y, True),

    'link_swim_down_0': (967, IDLE_Y, False),
    'link_swim_down_1': (984, IDLE_Y, False),
    'link_swim_up_0':   (1001, IDLE_Y, False),
    'link_swim_up_1':   (1018, IDLE_Y, False),
    'link_swim_side_0': (1035, IDLE_Y, True),
    'link_swim_side_1': (1052, IDLE_Y, True),
    'link_dive':        (1086, IDLE_Y, False),

    'link_sword_down':  (1086, ACT_Y, False),
    'link_sword_up':    (1103, ACT_Y, False),
    'link_sword_side':  (1069, ACT_Y, True),

    'link_push_down':   (1226, ACT_Y, False),
    'link_push_up':     (1192, ACT_Y, False),
    'link_push_side':   (1260, ACT_Y, True),

    'link_carry_down':  (1370, ACT_Y, False),
    'link_carry_up':    (1387, ACT_Y, False),
    'link_carry_side':  (1404, ACT_Y, True),

    # Digging reuses the crouched push pose; the shovel effect sells the action.
    'link_dig_0':       (1226, ACT_Y, False),
    'link_dig_1':       (1243, ACT_Y, False),

    # Hurt reuses the walk pose: Link flashes while invulnerable, so the pose
    # barely registers, and the sheet's death frames are a spin, not a recoil.
    'link_hurt_down':   (895, IDLE_Y, False),
    'link_hurt_up':     (912, IDLE_Y, False),
    'link_hurt_side':   (929, IDLE_Y, True),

    # The four slash frames read as a rotation, which is what the spin needs.
    'link_spin_0':      (1086, ACT_Y, False),
    'link_spin_1':      (1069, ACT_Y, True),
    'link_spin_2':      (1103, ACT_Y, False),
    'link_spin_3':      (1069, ACT_Y, False),

    # Sounding the conch: arms raised, same read as carrying something aloft.
    'link_conch_down':  (1370, ACT_Y, False),
    'link_conch_up':    (1387, ACT_Y, False),
    'link_conch_side':  (1404, ACT_Y, True),

    # ---- walking with the blade held out -----------------------------------
    #
    # The sheet's "Charge" band. In the Oracles, holding the button IS the
    # charge, and these are the frames it draws: Link with the blade extended,
    # walking. Four frames per direction — the last two are the charged flash,
    # with the blade tinted; the first is the plain held pose and the one the
    # engine wants.
    #
    # THESE ARE NOT 16x16 AND MUST NOT BE CROPPED TO IT. The blade runs 13px
    # past Link's feet facing the viewer, 11px past his head facing away, and
    # 12px past his shoulder in profile. A 16x16 window keeps the body and
    # throws the sword away, which is the one thing the pose exists to show.
    # They are emitted at their native size; the engine derives the draw anchor
    # from the sprite's own dimensions so the BODY lands on the same pixel a
    # 16x16 frame would put it on. See Player.draw.
    'link_hold_down':   (895, 362, False, 16, 30),
    'link_hold_up':     (967, 362, False, 16, 28),
    'link_hold_side':   (895, 397, True, 28, 16),
}


def shrink(rows, size):
    """Nearest-neighbour shrink of a 16x16 grid, centred in a 16x16 cell."""
    out = [['.'] * 16 for _ in range(16)]
    off = (16 - size) // 2
    for y in range(size):
        for x in range(size):
            sy = int(y * 16 / size)
            sx = int(x * 16 / size)
            out[off + y][off + x] = rows[sy][sx]
    return [''.join(r) for r in out]


def emit(path):
    art = {}
    for name, spec in FRAMES.items():
        ox, oy, flip = spec[0], spec[1], spec[2]
        w, h = (spec[3], spec[4]) if len(spec) > 3 else (16, 16)
        # Emitted rows are kept exactly as cut. art.js strips leading and
        # trailing rows that are WHITESPACE-only, and a row of '.' is not
        # whitespace — so a fully transparent row survives the parse and counts
        # toward the sprite's height. Trimming them here would silently shrink
        # every frame and move the held-blade anchor, which is derived from the
        # sprite's height at draw time.
        art[name] = cell(ox, oy, w, h, flip)
    base = cell(895, IDLE_Y)
    art['link_fall_0'] = shrink(base, 13)
    art['link_fall_1'] = shrink(base, 9)
    art['link_fall_2'] = shrink(base, 5)

    lines = []
    lines.append('// Link, extracted from the Oracle of Ages sprite sheet.')
    lines.append('//')
    lines.append('// Generated by tools/rip-link.py — edit that, not this file.')
    lines.append('// Source sprites ripped by Mister Mike (spriters-resource.com);')
    lines.append('// the original artwork is Nintendo\'s. This is fan-work art only.')
    lines.append('//')
    lines.append('// The sheet uses three colours plus a transparent background, mapping')
    lines.append('// exactly onto the engine\'s indices: 0 skin/hair, 1 tunic, 3 outline.')
    lines.append('// Sheet art faces LEFT; side frames are mirrored here because the engine')
    lines.append('// draws side art facing RIGHT and flips it for left.')
    lines.append('')
    lines.append("import { sprites } from '../gfx/art.js';")
    lines.append('')
    lines.append('export const PLAYER_ART = {')
    for name in sorted(art):
        lines.append(f'  {name}: `')
        for r in art[name]:
            lines.append('    ' + r)
        lines[-1] = lines[-1] + '`,'
    lines.append('};')
    lines.append('')
    lines.append('// Registered after sprites-link.js so this art wins for any shared name.')
    lines.append('export function installPlayerSprites() {')
    lines.append("  sprites.add(PLAYER_ART, 'link');")
    lines.append('}')
    open(path, 'w').write('\n'.join(lines) + '\n')
    return len(art)


if __name__ == '__main__':
    a = sys.argv[1:]
    if a and a[0] == '--dump':
        ox, oy = int(a[1]), int(a[2])
        flip = '--flip' in a
        for r in cell(ox, oy, flip=flip):
            print(r)
    elif a and a[0] == '--scan':
        y = int(a[1])
        print(f'y={y}:', scan(y))
    elif a and a[0] == '--bands':
        print(band_tops())
    elif a and a[0] == '--emit':
        import os as _os
        out = _os.path.join(_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__))),
                            'src', 'data', 'sprites-player.js')
        print('emitted', emit(out), 'frames ->', out)
    else:
        print(__doc__)
