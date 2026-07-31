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


def quantise(px, ox, oy, w, h, bg, flip=False):
    """Return (rows, palette) with the sprite reduced to at most four colours.

    Colours are sorted light to dark so index 0 is the highlight and index 3 the
    outline, matching how the hand-authored art is written.
    """
    seen = Counter()
    for y in range(h):
        for x in range(w):
            p = px[ox + x, oy + y]
            if p != bg:
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
            sx = ox + (w - 1 - x if flip else x)
            p = px[sx, oy + y]
            row.append('.' if p == bg else str(nearest(p)))
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
