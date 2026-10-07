#!/usr/bin/env python3
"""Extract Link's frames from the Oracle of Ages sprite sheet into the game's
art format — and the swing's two bodies and the sword's eight pictures from
Oracle of Seasons' own graphics (cartridge(), S173).

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
# is not 16x16. Nothing uses the second form since S174, when the held-blade
# poses went; it is kept for the next frame that runs past its cell.

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


    # THESE TWO WERE SWAPPED, and had been since the map was written: pushing
    # while facing the viewer drew Link's BACK and pushing away drew his FACE.
    # Read off the sheet's own Push band, left to right: 1192 and 1209 are the
    # front-facing pair, 1226 and 1243 the back-facing pair, 1260 the profile.
    'link_push_down':   (1192, ACT_Y, False),
    'link_push_up':     (1226, ACT_Y, False),
    'link_push_side':   (1260, ACT_Y, True),

    # ---- holding up something just got (S155) -----------------------------
    #
    # The sheet's "Pick up item" pair: one hand raised, then both. Seasons'
    # LINK_ANIM_MODE_GETITEM1HAND / GETITEM2HAND (oracles-disasm
    # constants/common/linkAnimations.s); which one a treasure uses is its grab
    # mode in data/seasons/treasureObjectData.s. Both face the viewer.
    'link_get_1':       (1353, IDLE_Y, False),
    'link_get_2':       (1370, IDLE_Y, False),

    'link_carry_down':  (1370, ACT_Y, False),
    'link_carry_up':    (1387, ACT_Y, False),
    'link_carry_side':  (1404, ACT_Y, True),

    # Digging reuses the crouched push pose; the shovel effect sells the action.
    # It follows the fix above: you dig facing the viewer, so these are the
    # FRONT-facing push pair (1192/1209), not the back-facing one. Before the
    # swap was found, digging drew Link's back.
    'link_dig_0':       (1192, ACT_Y, False),
    'link_dig_1':       (1209, ACT_Y, False),

    # Hurt reuses the walk pose: Link flashes while invulnerable, so the pose
    # barely registers, and the sheet's death frames are a spin, not a recoil.
    'link_hurt_down':   (895, IDLE_Y, False),
    'link_hurt_up':     (912, IDLE_Y, False),
    'link_hurt_side':   (929, IDLE_Y, True),

    # ---- lying where the sea left him (S168) ---------------------------------
    #
    # The last frame of the sheet's Hurt/Death band: Link flat on his back,
    # the pose the death spin ends in. The opening puts him on the beach in it.
    'link_lie':         (1465, 127, False),

    # ---- the spin attack -----------------------------------------------------
    #
    # The sheet's Spin Attack band was cut here until S173 (eight bodies and
    # eight blades). Seasons' spin draws neither: its body is the swing's own
    # full-reach body facing each cardinal in turn, and its blade the sword's
    # own eight pictures — both cut by cartridge() below.

    # Sounding the conch: arms raised, same read as carrying something aloft.
    'link_conch_down':  (1370, ACT_Y, False),
    'link_conch_up':    (1387, ACT_Y, False),
    'link_conch_side':  (1404, ACT_Y, True),

    # ---- walking with the blade held out -----------------------------------
    #
    # The sheet's "Charge" band (link_hold_*, cut at native size past the
    # cell) was drawn here until S174, with three blade cells off the Spin
    # Attack band (fx_blade_*) to find its blade for the charged flash. Seasons
    # draws neither: holding the sword, Link is in his own walking frames and
    # the sword is fx_sword_* at the swing's last phase (Player.draw,
    # HELD_PHASE).
}


# ---------------------------------------------------------------------------
# THE SWING, FROM THE CARTRIDGE (S173).
#
# The sheet's Slash band is one body per direction, and the swing drew that one
# body for all of its seventeen frames with a hand-placed blade and a
# hand-drawn white arc on top. Seasons' swing (LINK_ANIM_MODE_22,
# data/seasons/specialObjectAnimationData.s animationData19d1e) is two bodies:
# $ac+direction for the wind-up, $b0+direction from then on ($b4+direction is
# the SAME graphic as $b0 through an oam layout that moves it 3 px toward the
# facing — Player.draw applies that move, so it is not cut twice). The blade is
# ITEM_SWORD, its own object: eight pictures (itemAnimations.s item05
# animations through item05OamDataPointers in itemOamData.s) on spr_swords,
# which uncmpGfxHeader1a loads at tile $52 of VRAM bank 1 — the tile base
# itemData.s gives ITEM_SWORD — so the oam's own tile numbers index the file
# directly. The diagonal pictures carry their own swoosh; nothing else does.
#
# Read from assets/link/oracles-disasm/seasons/, copied verbatim from Stewmath's
# oracles-disasm (commit 21c924a). Drawn in Link's palette (sprite palette 0:
# 1 black, 2 green, 3 skin), so the digits are this file's own.
# ---------------------------------------------------------------------------

DISASM = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                      'assets', 'link', 'oracles-disasm', 'seasons')
GB_TO_ART = {1: '3', 2: '1', 3: '0'}
DIRS = ['up', 'right', 'down', 'left']


def _lines(name):
    with open(os.path.join(DISASM, name)) as f:
        return [l.split(';')[0].rstrip() for l in f.read().split('\n')]


def _after(ls, label):
    k = next(i for i, l in enumerate(ls) if l.startswith(label + ':'))
    return ls[k + 1:]


def _list(ls, label, kind):
    """The `kind` ('.dw' or a macro name) rows after `label`, past shared labels."""
    out = []
    for l in _after(ls, label):
        s = l.strip()
        if s.startswith(kind):
            out.append(s[len(kind):].replace(',', ' ').split())
        elif out:
            break
    return out


def _oam(ls, label):
    rows = [l for l in _after(ls, label) if l.strip()]
    n = int(rows[0].split()[1][1:], 16)
    return [[int(v[1:], 16) for v in rows[1 + i].split()[1:]] for i in range(n)]


def _place(png, tile0, entries, size, at):
    """Hardware sprites (8x16) placed as @drawObject places them, the object's
    position at `at` inside a size x size cell: y + oam y - 16, x + oam x - 8."""
    im = Image.open(os.path.join(DISASM, png))
    per_row = im.size[0] // 8
    grid = [['.'] * size for _ in range(size)]
    for y, x, t, f in reversed(entries):
        spr = (tile0 + t) // 2
        col, row = spr % per_row, spr // per_row
        top = at[1] + ((y - 16 + 128) & 0xff) - 128
        left = at[0] + ((x - 8 + 128) & 0xff) - 128
        for yy in range(16):
            for xx in range(8):
                v = im.getpixel((col * 8 + (7 - xx if f & 0x20 else xx),
                                 row * 16 + (15 - yy if f & 0x40 else yy)))
                if v:
                    assert 0 <= top + yy < size and 0 <= left + xx < size, png + ' outside its cell'
                    grid[top + yy][left + xx] = GB_TO_ART[v]
    return [''.join(r) for r in grid]


def cartridge():
    art = {}
    an = _lines('specialObjectAnimationData.s')
    gfx = _list(an, 'specialObject00GfxPointers', 'm_SpecialObjectGfxPointer')
    lay = [r[0] for r in _list(an, 'specialObject00OamDataPointers', '.dw')]
    so = _lines('specialObjectOamData.s')
    # The swing's own animation names its two bodies; read them, do not trust
    # the numbers in the comment above.
    modes = [r[0] for r in _list(an, 'specialObject00AnimationDataPointers', '.dw')]
    seq = [l.split()[1:] for l in _after(an, modes[0x22]) if l.strip().startswith('.db')]
    wind, body = int(seq[0][1][1:], 16), int(seq[1][1][1:], 16)
    for name, base in (('link_swing0_', wind), ('link_swing1_', body)):
        # Side frames face RIGHT here (direction 1), as every _side frame does.
        for d in (0, 1, 2):
            layout, png, off, _ = gfx[base + d]
            ents = _oam(so, lay[int(layout[1:], 16)])
            art[name + ('side' if d == 1 else DIRS[d])] = _place(
                png + '.png', int(off[1:], 16) // 16, ents, 16, (8, 8))
    ia = _lines('itemAnimations.s')
    io = _lines('itemOamData.s')
    ptrs = [r[0] for r in _list(ia, 'item05OamDataPointers', '.dw')]
    # itemData row 5 is ITEM_SWORD: gfx index, oamTileIndexBase, oamFlags.
    base = int(_list(_lines('itemData.s'), 'itemData', '.db')[0x05][1][1:], 16)
    hdr = [l for l in _after(_lines('uncmpGfxHeaders.s'), 'uncmpGfxHeader1a') if 'spr_swords' in l][0]
    loaded = ((int(hdr.split(',')[1].strip()[1:], 16) & 0xfff0) - 0x8000) // 16
    for k, p in enumerate(ptrs):
        art[f'fx_sword_{k}'] = _place('spr_swords.png', base - loaded, _oam(io, p), 32, (16, 16))
    return art


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
        # every frame.
        art[name] = cell(ox, oy, w, h, flip)
    base = cell(895, IDLE_Y)
    art['link_fall_0'] = shrink(base, 13)
    art['link_fall_1'] = shrink(base, 9)
    art['link_fall_2'] = shrink(base, 5)
    carts = cartridge()
    art.update(carts)

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
    lines.append('//')
    lines.append('// The swing\'s two bodies (link_swing0_*, link_swing1_*) and the sword\'s')
    lines.append('// eight pictures (fx_sword_*, 32x32 with the sword object\'s position at')
    lines.append('// 16,16) are cut from Oracle of Seasons\' own graphics and tables instead,')
    lines.append('// copied from Stewmath\'s oracles-disasm (github.com/Stewmath/oracles-disasm,')
    lines.append('// commit 21c924a) into assets/link/oracles-disasm/seasons/. Credit: the')
    lines.append('// oracles-disasm project and its contributors.')
    lines.append('')
    lines.append("import { sprites } from '../gfx/art.js';")
    lines.append('')
    lines.append('export const PLAYER_ART = {')
    # Provenance tags for tools/check-drift.mjs's art-provenance rotation
    # objective (docs/prompts/STATE.md #2). Every FRAMES entry is a direct crop
    # off the sheet (mirrored in place for a `flip` pose, which is orientation,
    # not recomposition) — extracted. The three fall frames are `shrink()` of
    # an already-extracted crop, a real resampling rather than a plain cut —
    # derived.
    fall_frames = {'link_fall_0', 'link_fall_1', 'link_fall_2'}
    for name in sorted(art):
        if name in carts:
            lines.append("  // extracted — cut from the cartridge's own graphics by this "
                          "file's cartridge() (see the header).")
        elif name in fall_frames:
            lines.append("  // derived — a nearest-neighbour shrink() of this file's own "
                          "idle crop, not a fresh cut from the sheet.")
        else:
            lines.append("  // extracted — a direct crop off the sheet named in this "
                          "file's own header (mirrored in place for a flipped pose).")
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
