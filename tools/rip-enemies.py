#!/usr/bin/env python3
"""Extract the 56 enemy sprites from the Oracle of Seasons enemy sheet.

Sprites ripped by Mister Mike via spriters-resource.com; the original artwork
is Nintendo's. Fan-work use only.

Regenerate with:  python3 tools/rip-enemies.py

How cells are found
-------------------
`ripkit.find_cells` assumes sprites sit in bands it can split on a pitch, which
this sheet defeats: it is a mosaic of independently-positioned white plates,
each holding one creature's frames, interleaved with black label text. So this
script segments differently — it flood-fills islands of non-background pixels
and keeps the ones big enough to be a sprite. That yields one box per frame,
sorted top-to-bottom then left-to-right, and FRAMES below maps those indices to
engine sprite names. The index map was read off tools/shots/idx-p*.png, a
numbered contact sheet of exactly these boxes.

Five enemy names in this game have no equivalent on the sheet, so each borrows
the nearest real creature; every substitution is noted inline in FRAMES.
"""
import os
import sys
from collections import deque

sys.path.insert(0, os.path.dirname(__file__))
from ripkit import load, background, quantise, emit_module  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHEET = os.path.join(ROOT, 'assets', 'sheets', 'oracle-seasons-enemies.png')

# The sheet carries the same art twice: "GBC LCD Colors" on the left simulates
# the handheld screen, "True Colors" on the right is the raw palette. Read the
# right-hand half, as the other rip tools do.
X0, X1 = 719, 1427

SIZE = 16
WHITE = (255, 255, 255)


def strip_plates(px, W, H, bg):
    """Erase the white plates the sheet mounts each sprite on.

    Every frame sits on a white rectangle, and `background` only reports the
    green surrounding those plates — so without this the plate quantises as the
    sprite's lightest colour and every creature ends up in a white box.

    Only white *connected to the green* is erased. White enclosed by the
    creature's own outline is part of the artwork (bones, eyes, foam) and is
    left alone, which a blanket white->transparent rule would destroy.
    """
    q = deque()
    plate = [[False] * W for _ in range(H)]
    for y in range(H):
        for x in range(W):
            if px[x, y] != WHITE:
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < W and 0 <= ny < H and px[nx, ny] == bg:
                    plate[y][x] = True
                    q.append((x, y))
                    break
    n = 0
    while q:
        x, y = q.popleft()
        px[x, y] = bg
        n += 1
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < W and 0 <= ny < H and not plate[ny][nx] and px[nx, ny] == WHITE:
                plate[ny][nx] = True
                q.append((nx, ny))
    return n


def find_boxes(px, W, H, bg):
    """One bounding box per sprite: islands of non-background pixels.

    Label text is dropped by the minimum size, which no glyph reaches but every
    sprite does.
    """
    seen = [[False] * (X1 - X0) for _ in range(H)]
    boxes = []
    for y in range(H):
        for x in range(X0, X1):
            if px[x, y] == bg or seen[y][x - X0]:
                continue
            q = deque([(x, y)])
            seen[y][x - X0] = True
            x_lo = x_hi = x
            y_lo = y_hi = y
            while q:
                cx, cy = q.popleft()
                x_lo = min(x_lo, cx); x_hi = max(x_hi, cx)
                y_lo = min(y_lo, cy); y_hi = max(y_hi, cy)
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        nx, ny = cx + dx, cy + dy
                        if X0 <= nx < X1 and 0 <= ny < H \
                                and not seen[ny][nx - X0] and px[nx, ny] != bg:
                            seen[ny][nx - X0] = True
                            q.append((nx, ny))
            if y_hi - y_lo + 1 >= 12 and x_hi - x_lo + 1 >= 10:
                boxes.append((x_lo, y_lo, x_hi - x_lo + 1, y_hi - y_lo + 1))
    # Row-major within an 8px vertical tolerance, matching how the eye reads it.
    boxes.sort(key=lambda b: (b[1] // 8, b[0]))
    return boxes


# name -> (box index, ax, ay, flip)
#   ax/ay pick which 16x16 window to take from a box larger than one cell:
#   0 = left/top, 0.5 = centre, 1 = right/bottom.
#   flip mirrors horizontally, for sheet art that faces left where the engine
#   wants `_s` facing RIGHT.
FRAMES = {
    # Octorok — front and side. See HAND_ART for the back view the sheet lacks.
    'octorok_d0': (220, 0.5, 0.5, False),
    'octorok_d1': (221, 0.5, 0.5, False),
    'octorok_s0': (222, 0.5, 0.5, False),
    'octorok_s1': (223, 0.5, 0.5, False),

    # Sand Crab.
    'crab_0': (280, 0.5, 0.5, False),
    'crab_1': (281, 0.5, 0.5, False),

    # Zol: round at rest, stretched tall mid-hop — which is exactly the two
    # frames the engine's hop() alternates between.
    'zol_0': (342, 0.5, 1.0, False),
    'zol_1': (343, 0.5, 1.0, False),

    # Keese, wings spread. The wings-folded frame is in RECTS: its plate is
    # only nine pixels wide, below the box finder's minimum.
    'keese_0': (125, 0.5, 0.5, False),

    # Leever, surfaced. The buried frames are unused: the engine hides the
    # sprite outright while submerge() has it under the sand.
    'leever_0': (138, 0.5, 1.0, False),
    'leever_1': (139, 0.5, 1.0, False),

    # Anti-Fairy, the skull-in-a-bubble hazard.
    'bubble_0': (1, 0.5, 0.5, False),
    'bubble_1': (2, 0.5, 0.5, False),

    # Beamos: the sheet has eight frames of its eye sweeping round. Take two
    # that read as clearly different directions.
    'beamos_0': (16, 0.5, 0.5, False),
    'beamos_1': (19, 0.5, 0.5, False),

    # Spiked Beetle: upright when wandering, balled up when it charges — which
    # is what the engine's charge() does with the side frames.
    'beetle_d0': (284, 0.5, 0.5, False),
    'beetle_d1': (285, 0.5, 0.5, False),
    'beetle_s0': (286, 0.5, 0.5, False),
    'beetle_s1': (287, 0.5, 0.5, False),

    # Tektite.
    'tektite_0': (297, 0.5, 0.5, False),
    'tektite_1': (298, 0.5, 0.5, False),

    # Wisp — "floating flame with a face". SUBSTITUTION: no wisp on the sheet,
    # so this is Spark, which is precisely that shape.
    'wisp_0': (282, 0.5, 0.5, False),
    'wisp_1': (283, 0.5, 0.5, False),

    # Urchin — "spiky ball". SUBSTITUTION: original to this game, so it borrows
    # Spiny Beetle, an armoured ball of grey spines.
    'urchin_0': (292, 0.5, 0.5, False),
    'urchin_1': (293, 0.5, 0.5, False),

    # Moblin: idle frame, then the same angle with its spear raised.
    'moblin_d0': (163, 0.5, 0.5, False),
    'moblin_d1': (172, 0.5, 0.0, False),
    'moblin_u0': (164, 0.5, 0.5, False),
    # Raised spear, so the body sits at the bottom of a 26-tall box.
    'moblin_u1': (174, 0.5, 1.0, False),
    'moblin_s0': (165, 0.5, 0.5, False),
    'moblin_s1': (166, 0.5, 0.5, False),

    # Stalfos: the plain skeleton for the front frames; the side frames come
    # from Sword Stalfos, the only stalfos on the sheet drawn in profile. Its
    # blade points left there, so mirror it — `_s` must face RIGHT.
    'stalfos_d0': (304, 0.5, 0.5, False),
    'stalfos_d1': (305, 0.5, 0.5, False),
    # The sheet draws these two facing opposite ways — blade left on the first,
    # blade right on the second — so only the first is mirrored.
    'stalfos_s0': (316, 1.0, 0.0, True),
    'stalfos_s1': (317, 0.0, 0.0, False),

    # Darknut.
    'darknut_d0': (56, 0.5, 0.5, False),
    'darknut_d1': (82, 0.5, 0.0, False),
    'darknut_s0': (58, 0.5, 0.5, False),
    'darknut_s1': (59, 0.5, 0.5, False),

    # Wizzrobe: hood-only as it phases in, then the full sorcerer.
    'wizzrobe_0': (337, 0.5, 0.5, False),
    'wizzrobe_1': (336, 0.5, 0.5, False),

    # Anglerfry — "anglerfish with a lure". SUBSTITUTION: original to this game,
    # so it borrows Cheep-Cheep, the sheet's only fish.
    'anglerfry_0': (43, 0.5, 0.5, False),
    'anglerfry_1': (44, 0.5, 0.5, False),

    # Barnacle — "a cluster that opens". SUBSTITUTION: original to this game,
    # so it borrows Like Like, a ridged tube that gapes open and shut.
    'barnacle_0': (140, 0.5, 0.5, False),
    'barnacle_1': (143, 0.5, 0.5, False),

    # Jellyfish. SUBSTITUTION in name only: this is Bari, which already is one.
    'jellyfish_0': (12, 0.5, 0.5, False),
    'jellyfish_1': (13, 0.5, 0.5, False),

    # Siren — "mermaid-like singer". SUBSTITUTION: original to this game, so it
    # borrows River Zora, which surfaces and sings a shot at you.
    'siren_0': (256, 0.5, 0.5, False),
    'siren_1': (257, 0.5, 0.5, False),

    # Pincer: head lunging out, then the body coiled back.
    'pincer_0': (233, 0.5, 0.5, False),
    'pincer_1': (234, 0.5, 0.5, False),
}

# Frames taken from an explicit sheet rectangle instead of a detected box,
# because the sprite is smaller than the detector's minimum.
#   name -> (x, y, w, h)
RECTS = {
    # Gel: two frames of the red Color-Changing Gel, 8px blobs the box finder
    # discards along with the label text.
    'gel_0': (1086, 74, 9, 12),
    'gel_1': (1095, 74, 9, 12),
    # Keese with its wings folded, on a plate too narrow for the box finder.
    'keese_1': (841, 201, 11, 16),
}

# The sheet's Octorok has front and side frames but no back view, so the two
# back frames are drawn here to match. Note the index ramp: quantise() collapses
# these sprites to three real colours — 0 light (skin), 1 mid (red body), 2 and
# 3 both the black outline — so the body must be '1'. Using '2' as a mid tone,
# which the four-colour grammar invites, would render the octorok solid black.
# Bound to octorok_d0's palette below so the colours match exactly.
HAND_ART = {
    'octorok_u0': """
        ................
        .....3333.......
        ...33111133.....
        ..3111111113....
        .311111111113...
        3111111111111333
        3110111111011133
        3110111111011133
        3111111111111333
        .311111111113...
        ..3111111113....
        ...311111113....
        ...3111111133...
        ...3011.1103....
        ...3003.3003....
        ....33...33.....""",
    'octorok_u1': """
        ................
        .....3333.......
        ...33111133.....
        ..3111111113....
        .311111111113...
        3311111111113333
        3011011110111103
        3011011110111103
        3311111111113333
        .311111111113...
        ..3111111113....
        ...311111113....
        ....31111113....
        ...30113.3103...
        ...3003...003...
        ....33.....33...""",
}

HAND_PAL_OF = {'octorok_u0': 'octorok_d0', 'octorok_u1': 'octorok_d0'}


def window(box, ax, ay):
    """The SIZExSIZE source rectangle to take from a box."""
    x, y, w, h = box
    sx = x + int(round((w - SIZE) * ax)) if w > SIZE else x - (SIZE - w) // 2
    sy = y + int(round((h - SIZE) * ay)) if h > SIZE else y - (SIZE - h) // 2
    return sx, sy


def pad_to_cell(rows):
    """Centre horizontally, bottom-align vertically, in a SIZExSIZE cell."""
    rows = [r for r in rows]
    w = len(rows[0]) if rows else 0
    if w < SIZE:
        left = (SIZE - w) // 2
        rows = ['.' * left + r + '.' * (SIZE - w - left) for r in rows]
    elif w > SIZE:
        off = (w - SIZE) // 2
        rows = [r[off:off + SIZE] for r in rows]
    if len(rows) < SIZE:
        rows = ['.' * SIZE] * (SIZE - len(rows)) + rows
    elif len(rows) > SIZE:
        rows = rows[len(rows) - SIZE:]
    return rows


def normalise_ramp(rows, pal):
    """Re-slot indices so the darkest colour always lands on 3, the outline.

    `quantise` returns four palette entries by repeating the last colour when a
    sprite uses fewer, which leaves a three-colour sprite writing its black
    outline as index 2. That renders correctly in the sprite's own palette but
    wrong in every other: the game's enemy palettes put a mid tone at 2 and the
    near-black at 3, so the hard 1px outline the art direction requires washes
    out to grey the moment the roster asks for `enemyg` or `slime`. Spreading
    the ramp to the canonical slots makes each sprite read the same under any
    palette, which is the whole point of indexing colour instead of baking it.
    """
    distinct = []
    for c in pal:
        if c not in distinct:
            distinct.append(c)
    n = len(distinct)
    if n >= 4:
        return rows, pal
    slots = {1: [3], 2: [0, 3], 3: [0, 1, 3]}[n]
    remap = {str(old): str(slots[distinct.index(c)]) for old, c in enumerate(pal)}
    rows = [''.join(remap.get(ch, ch) for ch in r) for r in rows]
    out = [None] * 4
    for i, s in enumerate(slots):
        out[s] = distinct[i]
    carry = distinct[0]
    for i in range(4):
        if out[i] is None:
            out[i] = carry
        else:
            carry = out[i]
    return rows, out


def seal_holes(rows):
    """Fill a lone transparent pixel that has drawn pixels on both sides.

    Legal in the grammar but it punches a see-through hole through a sprite,
    and the validator rejects it. Quantisation can create these where a fifth
    colour was snapped away.
    """
    out = [list(r) for r in rows]
    for y, row in enumerate(out):
        for x in range(1, SIZE - 1):
            if row[x] != '.':
                continue
            if row[x - 1] != '.' and row[x + 1] != '.':
                row[x] = row[x - 1]
            elif 0 < y < SIZE - 1 and out[y - 1][x] != '.' and out[y + 1][x] != '.':
                row[x] = out[y - 1][x]
    return [''.join(r) for r in out]


def main():
    im, px, W, H = load(SHEET)
    bg = background(px, W, H)
    # Box detection runs first, on the untouched sheet: the plates are what make
    # each frame one solid island to find. Only then are they erased, so the
    # indices FRAMES refers to stay stable.
    boxes = find_boxes(px, W, H, bg)
    print(f'{len(boxes)} sprite boxes found in the True Colors half')
    print('erased', strip_plates(px, W, H, bg), 'white plate pixels')

    art, pals = {}, {}
    for name, (idx, ax, ay, flip) in FRAMES.items():
        if idx >= len(boxes):
            print('SKIP (no such box):', name, idx)
            continue
        sx, sy = window(boxes[idx], ax, ay)
        rows, pal = quantise(px, sx, sy, SIZE, SIZE, bg, flip=flip)
        if rows is None:
            print('SKIP (empty):', name)
            continue
        rows, pal = normalise_ramp(rows, pal)
        art[name] = seal_holes(pad_to_cell(rows))
        pals[name] = pal

    for name, (x, y, w, h) in RECTS.items():
        rows, pal = quantise(px, x, y, w, h, bg)
        if rows is None:
            print('SKIP (empty rect):', name)
            continue
        rows, pal = normalise_ramp(rows, pal)
        art[name] = seal_holes(pad_to_cell(rows))
        pals[name] = pal

    for name, src in HAND_ART.items():
        rows = [r.strip() for r in src.strip('\n').split('\n')]
        art[name] = rows
        pals[name] = pals[HAND_PAL_OF[name]]

    header = '\n'.join([
        '// Enemy sprites extracted from the Oracle of Seasons enemy sheet.',
        '//',
        '// Generated by tools/rip-enemies.py — edit that, not this file.',
        '// Source sprites ripped by Mister Mike via spriters-resource.com;',
        "// the original artwork is Nintendo's. This is fan-work art only.",
        '//',
        '// Each sprite carries its own four colours, quantised light to dark, so the',
        '// palettes below are registered at load time rather than reusing the',
        '// hand-authored set.',
        '//',
        '// Five enemies are original to this game and have no sheet equivalent, so',
        '// each borrows the nearest real creature: anglerfry <- Cheep-Cheep,',
        '// barnacle <- Like Like, jellyfish <- Bari, siren <- River Zora,',
        '// urchin <- Spiny Beetle. Wisp borrows Spark for the same reason. The',
        "// Octorok's two back frames are drawn by hand — the sheet has front and",
        '// side views only — and share octorok_d0\'s palette so they colour-match.',
    ])
    out = os.path.join(ROOT, 'src', 'data', 'sprites-enemies.js')
    emit_module(out, header, art, pals, 'ENEMY_ART', 'installEnemySprites', 'enemyg')
    print('emitted', len(art), 'enemy sprites ->', out)


if __name__ == '__main__':
    main()
