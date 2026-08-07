#!/usr/bin/env python3
"""Extract HUD and item-gear icons from the Oracle of Seasons HUD/Gear sheet.

Sprites ripped by Mister Mike via spriters-resource.com; the original artwork is
Nintendo's. Fan-work use only. Credit requested by the ripper and given here and
in the generated module's header.

Only icons whose Oracle equivalent is the *same object* are taken. Items this
game has that Seasons does not — Zora's Flippers, the Mermaid Suit, the
Hookshot, the Moon Conch, the dungeon Map and Compass — keep their hand-drawn
art, which is the rule in docs/ART-DIRECTION.md: extract when a sheet has it,
draw to match when it does not.

Cells are addressed by explicit coordinates rather than find_cells: this sheet
is a mosaic of labelled plates on a green field, and every icon sits on a tan
plate whose width (24px) is the icon plus its "L-1"/"L-2" label, so a grid
detector would take the label with it.

Regenerate with:  python3 tools/rip-hud.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from ripkit import load, emit_module

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHEET = os.path.join(ROOT, 'assets', 'sheets', 'oracle-seasons-hud-gear.png')

# The plates are tan, not the sheet's green border, so that is the colour that
# has to read as transparent — passing the border green instead would bake a tan
# box around every icon.
PLATE = (255, 214, 140)

# The "True Colors" half of the sheet. The left half is the same art shifted to
# the washed-out GBC LCD ramp, which is a display artefact, not the artwork.
GRID_COLS = [510, 535, 560, 585, 610, 635]
GRID_ROWS = [28, 45, 62, 79, 96, 113, 130]

# name -> (grid row, grid col)
GRID = {
    'i_sword1': (0, 0), 'i_sword2': (0, 1), 'i_sword3': (0, 2),
    'i_shield1': (0, 3), 'i_shield2': (0, 4), 'i_shield3': (0, 5),
    'i_bomb': (2, 3),
    'i_shovel': (2, 5),
    'i_satchel': (4, 3),            # Seed Satchel
    'i_slingshot': (5, 3), 'i_hyperslingshot': (5, 4),
    'i_unknown': (6, 0),            # the red '?'
}

# name -> (x, y, w, h) for icons that are not on the 6x7 gear grid.
# The Slingshot and Hyper Slingshot cells are the same art under different
# captions in the original too, so both come out identical here — the level is
# communicated by the HUD's 'L2' badge, exactly as the Oracle bar does it.
RECTS = {
    'i_ringbox': (394, 126, 11, 16),   # 11 wide: a maroon swatch fills the rest
    # Magnetic Gloves, the blue S-polarity plate. 8 wide because the 'S' caption
    # sits beside the glove rather than past LABEL_X, so strip_label misses it.
    'i_magnet': (610, 96, 8, 16),
    'i_ring': (419, 126, 16, 16),
    'hud_rupee': (345, 100, 8, 8),
    # satchel order matches REQUIRED_SPRITES.ui, which is the satchel's own order
    'i_seed_ember': (424, 100, 8, 8),
    'i_seed_scent': (433, 100, 8, 8),
    'i_seed_pegasus': (442, 100, 8, 8),
    'i_seed_gale': (451, 100, 8, 8),
    'i_seed_mystery': (460, 100, 8, 8),
    # five fill levels, empty through full — exactly hud_heart0..4
    'hud_heart0': (354, 113, 8, 8), 'hud_heart1': (363, 113, 8, 8),
    'hud_heart2': (372, 113, 8, 8), 'hud_heart3': (381, 113, 8, 8),
    'hud_heart4': (390, 113, 8, 8),
}

# Cells where a quantity swatch shares the plate with the icon. Painting the
# swatch out before quantising keeps it from becoming a fourth colour.
SWATCH = {(255, 255, 0), (0, 255, 255), (255, 0, 0), (0, 255, 0), (255, 128, 0)}

# Shapes whose enclosed plate is the bar showing through, not a highlight.
HOLLOW = {'hud_heart0', 'hud_heart1', 'hud_heart2', 'hud_heart3'}


def centre(rows, w, h):
    """Re-centre a sprite that does not fill its cell (the bomb is 8px wide)."""
    xs = [x for y, r in enumerate(rows) for x, c in enumerate(r) if c != '.']
    ys = [y for y, r in enumerate(rows) for x, c in enumerate(r) if c != '.']
    if not xs:
        return rows
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    dx = (w - (x1 - x0 + 1)) // 2 - x0
    dy = (h - (y1 - y0 + 1)) // 2 - y0
    out = [['.'] * w for _ in range(h)]
    for y, r in enumerate(rows):
        for x, c in enumerate(r):
            if c == '.':
                continue
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w:
                out[ny][nx] = c
    return [''.join(r) for r in out]


def lum(c):
    return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]


def quantise_exact(px, ox, oy, w, h, bg, hollow=False):
    """Map a cell's colours to indices directly, with no nearest-colour search.

    ripkit's `quantise` picks each pixel's index by scanning for the smallest
    squared distance and keeping the first minimum. When it pads a short palette
    by repeating a colour, several indices tie at distance zero and which one
    wins is not pinned down, so the same cell can emit different indices from run
    to run — this rip was three pixels unstable across runs before this.

    Every cell on this sheet has at most four colours, so no snapping is needed:
    sort the distinct colours light to dark, break ties on the RGB tuple so the
    order is total, and look each pixel up. Byte-identical every time.
    """
    # Plate colour enclosed by a sprite's own outline is ARTWORK, not plate —
    # the Seed Satchel, ring box and gloves all use it as a highlight. Erase only
    # plate reachable from the edge of the cell, exactly as docs/HANDOFF.md warns
    # under sprite-sheet extraction; treating every plate pixel as transparent
    # punches holes straight through those sprites.
    # …except where the shape is *meant* to be see-through. A part-filled heart
    # is an outline with the bar showing through it, not a heart with a tan
    # middle, so those opt out and keep every plate pixel transparent.
    outside = set()
    if hollow:
        outside = {(x, y) for y in range(h) for x in range(w)
                   if px[ox + x, oy + y] == bg}
    stack = [] if hollow else [(x, 0) for x in range(w)] + [(x, h - 1) for x in range(w)] \
        + [(0, y) for y in range(h)] + [(w - 1, y) for y in range(h)]
    stack = [q for q in stack if px[ox + q[0], oy + q[1]] == bg]
    outside.update(stack)
    while stack:
        cx, cy = stack.pop()
        for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
            if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in outside \
                    and px[ox + nx, oy + ny] == bg:
                outside.add((nx, ny))
                stack.append((nx, ny))

    seen = {}
    for y in range(h):
        for x in range(w):
            if (x, y) in outside:
                continue
            p = px[ox + x, oy + y]
            seen[p] = seen.get(p, 0) + 1
    if not seen:
        return None, None
    cols = sorted(seen, key=lambda c: (-lum(c), c))[:4]
    idx = {c: i for i, c in enumerate(cols)}
    pal = list(cols)
    while len(pal) < 4:
        pal.append(pal[-1])
    rows = []
    for y in range(h):
        row = []
        for x in range(w):
            p = px[ox + x, oy + y]
            row.append('.' if (x, y) in outside else str(idx[p]))
        rows.append(''.join(row))
    return rows, ['#%02x%02x%02x' % c for c in pal]


LABEL_X = 10        # "L-1"/"L-2" starts at this column of every gear cell


def strip_label(px, ox, oy):
    """Erase the cell's level label.

    Each 24px plate is a ~9px icon plus an "L-1"/"L-2" caption, and the caption
    starts inside the 16px square the icon is cropped from — so a plain crop
    takes the letters with it. The icon is one connected blob and the caption is
    separate glyphs, so anything whose every pixel sits at or past LABEL_X is
    caption and gets painted back to plate.
    """
    seen = [[False] * 16 for _ in range(16)]
    for sy in range(16):
        for sx in range(16):
            if seen[sy][sx] or px[ox + sx, oy + sy] == PLATE:
                continue
            comp, stack = [], [(sx, sy)]
            seen[sy][sx] = True
            while stack:
                cx, cy = stack.pop()
                comp.append((cx, cy))
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < 16 and 0 <= ny < 16 and not seen[ny][nx] \
                            and px[ox + nx, oy + ny] != PLATE:
                        seen[ny][nx] = True
                        stack.append((nx, ny))
            if min(c[0] for c in comp) >= LABEL_X:
                for cx, cy in comp:
                    px[ox + cx, oy + cy] = PLATE


def main():
    im, px, W, H = load(SHEET)
    # Paint the quantity swatches out so they cannot survive quantisation.
    for x in range(W):
        for y in range(H):
            if px[x, y] in SWATCH and x >= 345:
                px[x, y] = PLATE

    cells = {}
    for name, (r, c) in GRID.items():
        ox, oy = GRID_COLS[c], GRID_ROWS[r]
        strip_label(px, ox, oy)
        cells[name] = (ox, oy, 16, 16)
    cells.update(RECTS)

    art, pals = {}, {}
    for name, (x, y, w, h) in sorted(cells.items()):
        rows, pal = quantise_exact(px, x, y, w, h, PLATE, name in HOLLOW)
        if rows is None:
            print('skip (empty):', name)
            continue
        small = (w == 8 and h == 8)
        art[name] = centre(rows, 8 if small else 16, 8 if small else 16)
        pals[name] = pal

    header = '\n'.join([
        '// HUD and item-gear icons extracted from the Oracle of Seasons HUD/Gear sheet.',
        '//',
        '// Generated by tools/rip-hud.py — edit that, not this file.',
        '// Source sprites ripped by Mister Mike via spriters-resource.com, who asks',
        "// for credit if used; the original artwork is Nintendo's. Fan-work art only.",
        '//',
        '// Taken from the sheet\'s "True Colors" half — the other half is the same art',
        '// shifted to the washed-out GBC LCD ramp, which is a display artefact.',
        '//',
        '// Only icons whose Oracle equivalent is the same object are here. The',
        '// Flippers, Mermaid Suit, Hookshot, Moon Conch, Map and Compass have no',
        '// counterpart on this sheet and keep their hand-drawn art.',
        '//',
        '// Each sprite carries its own colours, so draw sites must NOT pass a palette',
        "// for these names — art.js bake() resolves `palName || d.pal`, so an explicit",
        '// palette would override the extracted one and render them wrong.',
    ])
    emit_module('src/data/sprites-hud.js', header, art, pals,
                'HUD_ART', 'installHudSprites', 'ui')
    print('emitted', len(art), 'HUD/gear sprites')


if __name__ == '__main__':
    main()
