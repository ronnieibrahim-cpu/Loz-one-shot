#!/usr/bin/env python3
"""Shared helpers for turning ripped sprite sheets into the game's art format.

Sheets from the original games are full colour, while the engine draws every
sprite through a 4-colour palette. So each extracted sprite is quantised to at
most four colours ordered light to dark, and the rip tool emits a palette
alongside the art. gfx/palettes.js registerPalettes() takes those at load time.

Cells are found by looking for islands of non-background pixels; the background
is whichever colour dominates the sheet's border.
"""
import json
from collections import Counter

from PIL import Image


def load(path):
    im = Image.open(path).convert('RGB')
    return im, im.load(), im.size[0], im.size[1]


def background(px, W, H):
    """The sheet background: the most common colour along the outer border."""
    edge = Counter()
    for x in range(W):
        edge[px[x, 0]] += 1
        edge[px[x, H - 1]] += 1
    for y in range(H):
        edge[px[0, y]] += 1
        edge[px[W - 1, y]] += 1
    return edge.most_common(1)[0][0]


def find_sprites(px, W, H, bg, size=16, x0=0, x1=None, y0=0, y1=None, minink=40):
    """Locate sprite cells by finding each sprite, rather than by assuming a pitch.

    `find_cells` splits a band of content into runs and cuts each run every
    `pitch` pixels. That works while a sheet's sprites really are that far
    apart, and the Oracle of Seasons NPC sheet's are not — they sit about 17 to
    18 apart, so a 16-pixel cut drifts by a pixel per sprite and by the middle
    of a row the window is straddling two townspeople. Every villager, child,
    elder and shopkeeper in this game was half of one person and half of the
    one beside them, and it is visible from across the room.

    So: eight-connected components. A sprite on these sheets is one blob of ink
    with its own black outline all the way round, which is exactly what makes a
    component the right unit — the same reason the trees had to be measured
    outline-to-outline rather than found by looking for background. Components
    smaller than `minink` are dropped (stray marks, dividers, single-pixel
    joins), and each surviving one gets a `size` window centred on its own
    bounding box and anchored on its FEET, because a head may sit high in the
    cell but the ground line is what the engine draws against.

    Returned in reading order — top to bottom by row band, then left to right —
    so an index into this list means the same thing a person means when they
    count sprites off a contact sheet.
    """
    x1 = W if x1 is None else x1
    y1 = H if y1 is None else y1
    bgset = bg if isinstance(bg, (set, frozenset)) else {bg}
    seen = [[False] * W for _ in range(H)]
    boxes = []
    for sy in range(y0, y1):
        for sx in range(x0, x1):
            if seen[sy][sx] or px[sx, sy] in bgset:
                continue
            stack = [(sx, sy)]
            seen[sy][sx] = True
            bx0 = bx1 = sx
            by0 = by1 = sy
            n = 0
            while stack:
                cx, cy = stack.pop()
                n += 1
                if cx < bx0: bx0 = cx
                if cx > bx1: bx1 = cx
                if cy < by0: by0 = cy
                if cy > by1: by1 = cy
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        nx, ny = cx + dx, cy + dy
                        if x0 <= nx < x1 and y0 <= ny < y1 and not seen[ny][nx] \
                                and px[nx, ny] not in bgset:
                            seen[ny][nx] = True
                            stack.append((nx, ny))
            # A whole sheet's frame or divider is not a sprite either.
            if n < minink or (bx1 - bx0 + 1) > size * 2 or (by1 - by0 + 1) > size * 2:
                continue
            boxes.append((bx0, by0, bx1, by1))
    # Reading order: group into row bands by vertical overlap, then sort each
    # band left to right. Sorting on raw y alone shuffles a row whose sprites
    # are not all the same height, which on these sheets is most of them.
    boxes.sort(key=lambda b: (b[1], b[0]))
    bands, cur = [], []
    for b in boxes:
        if cur and b[1] > max(c[3] for c in cur):
            bands.append(cur); cur = []
        cur.append(b)
    if cur:
        bands.append(cur)
    cells = []
    for band in bands:
        for bx0, by0, bx1, by1 in sorted(band, key=lambda b: b[0]):
            w = bx1 - bx0 + 1
            cx = bx0 - (size - w) // 2
            cy = by1 - size + 1
            cells.append((max(0, min(cx, W - size)), max(0, min(cy, H - size))))
    return cells


def find_cells(px, W, H, bg, size=16, x0=0, x1=None, y0=0, y1=None, pitch=None):
    """Locate sprite cells as bands of content split into `size`-wide columns."""
    x1 = W if x1 is None else x1
    y1 = H if y1 is None else y1
    pitch = pitch or size
    cells = []
    y = y0
    while y < y1:
        if not any(px[x, y] != bg for x in range(x0, x1)):
            y += 1
            continue
        # band height: rows until a fully-background row
        yy = y
        while yy < y1 and any(px[x, yy] != bg for x in range(x0, x1)):
            yy += 1
        # Sheets do not use a uniform row pitch, so measure each sprite instead of
        # assuming one. Split the band into column runs, then within each run find
        # its own vertical content runs; every such run is one sprite.
        x = x0
        while x < x1:
            if any(px[x, ry] != bg for ry in range(y, yy)):
                xe = x
                while xe + 1 < x1 and any(px[xe + 1, ry] != bg for ry in range(y, yy)):
                    xe += 1
                for (ry0, ry1) in _vruns(px, x, xe + 1, y, yy, bg):
                    hgt = ry1 - ry0 + 1
                    if hgt < size // 2:
                        continue
                    # Anchor tall-ish sprites on their feet; the head may sit high.
                    top = ry1 - size + 1 if hgt >= size else ry0 - (size - hgt) // 2
                    top = max(0, min(top, H - size))
                    w = xe - x + 1
                    n = max(1, round(w / pitch))
                    for k in range(n):
                        cx = x + k * pitch
                        if cx + size <= x1:
                            cells.append((cx, top))
                x = xe + 1
            else:
                x += 1
        y = yy
    return cells


def _vruns(px, xa, xb, ya, yb, bg):
    """Contiguous vertical spans of content within a column range."""
    runs, start = [], None
    for y in range(ya, yb):
        has = any(px[x, y] != bg for x in range(xa, xb))
        if has and start is None:
            start = y
        elif not has and start is not None:
            runs.append((start, y - 1))
            start = None
    if start is not None:
        runs.append((start, yb - 1))
    return runs


def lum(c):
    return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]


def _own_mask(px, ox, oy, w, h, bgset):
    """The window's biggest connected blob of ink — the sprite, and only it.

    A 16x16 cell centred on a 13-wide character has three columns to spare, and
    on a packed sheet those columns belong to whoever is standing next to them.
    Farore came out of this sheet with two of a fence's posts either side of
    her, one column of each, because they fell inside her window; the boulder in
    `rip-terrain.py` took a dotted column of its neighbour's dirt for the same
    reason, one file over. The window has to stay 16 wide — that is the cell the
    engine draws — so what has to go is everything in it that is not the sprite.

    Eight-connected, so an outline that steps diagonally stays one blob.
    """
    seen = [[False] * w for _ in range(h)]
    best = set()
    for sy in range(h):
        for sx in range(w):
            if seen[sy][sx] or px[ox + sx, oy + sy] in bgset:
                continue
            comp, stack = set(), [(sx, sy)]
            seen[sy][sx] = True
            while stack:
                cx, cy = stack.pop()
                comp.add((cx, cy))
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        nx, ny = cx + dx, cy + dy
                        if 0 <= nx < w and 0 <= ny < h and not seen[ny][nx] \
                                and px[ox + nx, oy + ny] not in bgset:
                            seen[ny][nx] = True
                            stack.append((nx, ny))
            if len(comp) > len(best):
                best = comp
    return best


def quantise(px, ox, oy, w, h, bg, flip=False, own=False):
    """Return (rows, palette) with the sprite reduced to at most four colours.

    Colours are sorted light to dark so index 0 is the highlight and index 3 the
    outline, matching how the hand-authored art is written.

    `own=True` keeps only the window's biggest connected blob — see `_own_mask`.
    It is opt-in because a sprite drawn in two pieces (a held item away from the
    hand, a shadow under a jump) is a legitimate two-blob frame, and this must
    not quietly eat half of one.
    """
    bgset = bg if isinstance(bg, (set, frozenset)) else {bg}
    mask = _own_mask(px, ox, oy, w, h, bgset) if own else None
    seen = Counter()
    for y in range(h):
        for x in range(w):
            p = px[ox + x, oy + y]
            if mask is not None and (x, y) not in mask:
                continue
            if p not in bgset:
                seen[p] += 1
    if not seen:
        return None, None
    cols = [c for c, _ in seen.most_common()]
    if len(cols) > 4:
        # Keep the four most used, snap the rest to the nearest by luminance.
        cols = cols[:4]
    cols.sort(key=lum, reverse=True)
    while len(cols) < 4:
        cols.append(cols[-1])

    def nearest(p):
        best, bd = 0, 1e18
        for i, c in enumerate(cols):
            d = (c[0] - p[0]) ** 2 + (c[1] - p[1]) ** 2 + (c[2] - p[2]) ** 2
            if d < bd:
                bd, best = d, i
        return best

    rows = []
    for y in range(h):
        row = []
        for x in range(w):
            gx = (w - 1 - x if flip else x)
            p = px[ox + gx, oy + y]
            off = p in bgset or (mask is not None and (gx, y) not in mask)
            row.append('.' if off else str(nearest(p)))
        rows.append(''.join(row))
    rows = _trim_slivers(rows)
    rows = _fill_pinholes(rows)
    pal = ['#%02x%02x%02x' % c for c in cols]
    return rows, pal


def _fill_pinholes(rows):
    """Fill single transparent pixels that are enclosed by the sprite.

    A pixel inside the body that happens to match the sheet background quantises
    to transparent and punches a see-through pinhole — one row of the sprite
    reads as split, and whatever is behind it shows through. A gap that is
    genuinely part of the art (between two legs, inside a handle) is always open
    to the outside on at least one side, so requiring all four orthogonal
    neighbours to be drawn is a safe test.

    Filling one pinhole can enclose the next, so repeat until nothing changes.
    """
    if not rows:
        return rows
    grid = [list(r) for r in rows]
    h, w = len(grid), len(grid[0])
    changed = True
    while changed:
        changed = False
        for y in range(1, h - 1):
            for x in range(1, w - 1):
                if grid[y][x] != '.':
                    continue
                around = [grid[y - 1][x], grid[y + 1][x], grid[y][x - 1], grid[y][x + 1]]
                if any(c == '.' for c in around):
                    continue
                grid[y][x] = max(set(around), key=around.count)
                changed = True
    return [''.join(g) for g in grid]


def _trim_slivers(rows):
    """Blank leaked edge bands that are detached from the sprite body.

    Neighbouring sprites on a packed sheet leak into a cell. The original rule
    here only blanked an edge line when the very next line was empty, so it
    caught one-pixel leaks and nothing else: a leak two or three lines wide,
    with a gap between it and the body, survived and rendered as a bar floating
    beside the sprite. `npc_farore_1` carried exactly that — a three-column
    strip down the left edge with four empty columns between it and her.

    So group each axis into runs of non-empty lines, take the run holding the
    most pixels as the body, and drop any other run that touches an edge, is
    separated from the body by at least one empty line, and is small enough
    relative to the body to be a leak rather than a held sword or a wing.
    """
    if not rows:
        return rows
    grid = [list(r) for r in rows]
    h, w = len(grid), len(grid[0])

    def sweep(n, count_at, blank_at):
        filled = [count_at(i) for i in range(n)]
        runs, i = [], 0
        while i < n:
            if filled[i]:
                j = i
                while j < n and filled[j]:
                    j += 1
                runs.append((i, j, sum(filled[i:j])))
                i = j
            else:
                i += 1
        if len(runs) < 2:
            return
        body = max(runs, key=lambda r: r[2])
        for a, b, px in runs:
            if (a, b) == (body[0], body[1]):
                continue
            touches_edge = a == 0 or b == n
            detached = b <= body[0] or a >= body[1]     # a gap separates them
            if touches_edge and detached and px <= body[2] * 0.30:
                for i in range(a, b):
                    blank_at(i)

    sweep(w,
          lambda c: sum(1 for g in grid if g[c] != '.'),
          lambda c: [g.__setitem__(c, '.') for g in grid])
    sweep(h,
          lambda r: sum(1 for ch in grid[r] if ch != '.'),
          lambda r: grid.__setitem__(r, ['.'] * w))

    return [''.join(g) for g in grid]


def contact_sheet(im, cells, path, size=16, scale=4, cols=16):
    """Write a numbered contact sheet so cells can be identified by eye."""
    from PIL import ImageDraw
    rows = (len(cells) + cols - 1) // cols
    pad = 12
    out = Image.new('RGB', (cols * (size * scale + pad), rows * (size * scale + pad)), (28, 32, 38))
    d = ImageDraw.Draw(out)
    for i, (cx, cy) in enumerate(cells):
        ox = (i % cols) * (size * scale + pad)
        oy = (i // cols) * (size * scale + pad)
        out.paste(im.crop((cx, cy, cx + size, cy + size)).resize((size * scale, size * scale), Image.NEAREST), (ox, oy))
        d.text((ox + 1, oy + size * scale - 1), str(i), fill=(255, 255, 120))
    out.save(path)
    return out.size


def emit_module(path, header, art, palettes, const_name, install_name, default_pal):
    lines = [l for l in header.split('\n')]
    lines.append('')
    lines.append("import { sprites } from '../gfx/art.js';")
    lines.append("import { registerPalettes } from '../gfx/palettes.js';")
    lines.append('')
    # Each entry binds its own palette, so draw sites that pass no palette get
    # the sprite's original colours instead of a shared default.
    lines.append(f'export const {const_name} = {{')
    for name in sorted(art):
        lines.append(f'  {name}: {{ pal: \'{name}\', art: `')
        for r in art[name]:
            lines.append('    ' + r)
        lines[-1] += '` },'
    lines.append('};')
    lines.append('')
    lines.append('// One palette per sprite, taken from the source artwork.')
    lines.append(f'export const {const_name}_PALETTES = {{')
    for name in sorted(palettes):
        cols = ', '.join(f"'{c}'" for c in palettes[name])
        lines.append(f'  {name}: [{cols}],')
    lines.append('};')
    lines.append('')
    lines.append(f'export function {install_name}() {{')
    lines.append(f'  registerPalettes({const_name}_PALETTES);')
    lines.append(f"  sprites.add({const_name}, '{default_pal}');")
    lines.append('}')
    open(path, 'w').write('\n'.join(lines) + '\n')
