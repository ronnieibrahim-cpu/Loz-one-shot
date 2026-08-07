#!/usr/bin/env python3
"""Turn a stitched FULL-FLOOR dungeon map into a deduplicated 16x16 tileset.

WHY THIS IS NOT rip-terrain.py
------------------------------
The existing rip tooling expects a TILESHEET: a grid where each cell appears
once and its position is its identity. A dungeon map rip is the opposite — it
is a picture of a whole floor, so the same wall tile appears two hundred times
and its position means nothing. So this tool grids the image, hashes every cell
on exact pixel content, and keeps one copy of each distinct cell along with how
often it occurred and one place it was seen.

FREQUENCY IS THE POINT. On a map, a wall is common and a decoration is a
one-off, and that count is the only signal in the image that tells them apart
without a human looking. The manifest carries it so the tiledef pass can be
ordered by it instead of by guesswork.

WHAT IT DOES NOT DO
-------------------
It does not assign flags, name tiles, or write anything under src/. Deciding
that a given tile is a pit rather than a dark floor is a judgement call that
wants the map coordinate cited in the tiledef comment — see P7.5 step 8 in
docs/EXECUTION-PLAN.md. This tool's whole output is a tileset PNG and a JSON
manifest, and both are byte-identical on a second run (see --verify).

THE TWO-PALETTE SPLIT
---------------------
P7.5 describes maps containing the SAME floor twice side by side, labelled
"GBC LCD Colors" and "True Colors". `--half left|right` crops to one of them,
and `--half auto` detects a split by looking for a tall run of background
columns near the middle. When no split is found the whole image is one map,
which is the case for every sheet currently in assets/sheets/ — see
docs/ART-DIRECTION.md for which register those came from.

Usage:
  python3 tools/rip-dungeon-maps.py <sheet.png> --name <id> [--half auto]
  python3 tools/rip-dungeon-maps.py --all          # every configured map
  python3 tools/rip-dungeon-maps.py --verify       # re-emit and diff
"""
import argparse
import hashlib
import json
import os
import sys
from collections import Counter, OrderedDict

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SHEETS = os.path.join(ROOT, 'assets', 'sheets')
OUT = os.path.join(ROOT, 'assets', 'tilesets')

TILE = 16

# Maps to rip. Each entry is (sheet filename, output id, half).
#
# The four Oracle of Seasons dungeon map rips P7.5 was written against —
# Ancient Ruins, Explorer's Crypt, Poison Moth's Lair and Dancing Dragon
# Dungeon — are NOT in assets/sheets/ in this tree. When they arrive, add them
# here; nothing else about this tool needs to change. See docs/ART-BACKLOG.md.
MAPS = [
    ('oracle-seasons-dungeon-backgrounds.png', 'seasons-dungeons', 'auto'),
]


def load(path):
    im = Image.open(path).convert('RGB')
    return im, im.load(), im.size[0], im.size[1]


def background(px, W, H):
    """The padding colour between rooms.

    Detected rather than hardcoded, per P7.5 step 4: it is the most common
    colour along the outer border, which on these rips is the green the
    stitcher laid between rooms. Hardcoding (0,255,0) would break on the first
    sheet whose author picked a different green — and they do differ.
    """
    edge = Counter()
    for x in range(W):
        edge[px[x, 0]] += 1
        edge[px[x, H - 1]] += 1
    for y in range(H):
        edge[px[0, y]] += 1
        edge[px[W - 1, y]] += 1
    return edge.most_common(1)[0][0]


def find_split(px, W, H, bg):
    """A tall run of all-background columns near the middle, or None.

    This is what tells a two-palette map (the same floor twice, side by side)
    from a single one. Only the middle third is considered: a map can easily
    have a background column at its edge, and treating that as the split would
    silently throw away most of the image.
    """
    lo, hi = W // 3, (2 * W) // 3
    best = None
    x = lo
    while x < hi:
        if all(px[x, y] == bg for y in range(0, H, 4)):
            s = x
            while x < hi and all(px[x, y] == bg for y in range(0, H, 4)):
                x += 1
            if best is None or (x - s) > (best[1] - best[0]):
                best = (s, x)
        else:
            x += 1
    # A split has to be wide enough to be a gutter rather than a coincidence.
    if best and (best[1] - best[0]) >= TILE:
        return best
    return None


def content_box(px, W, H, bg):
    """The bounding box of everything that is not padding."""
    x0, y0, x1, y1 = W, H, -1, -1
    for y in range(H):
        row = False
        for x in range(W):
            if px[x, y] != bg:
                if x < x0: x0 = x
                if x > x1: x1 = x
                row = True
        if row:
            if y < y0: y0 = y
            if y > y1: y1 = y
    if x1 < 0:
        return None
    return (x0, y0, x1 + 1, y1 + 1)


def row_bands(px, bg, box, W):
    """Rows of the map, split on fully-background scanlines.

    Used to find the appendix strips at the bottom (minimap panels, item icons,
    enemy sprites), which P7.5 step 6 says to discard: they sit below the last
    ROOM row and are separated from it by padding like every other band.
    """
    x0, y0, x1, y1 = box
    bands = []
    y = y0
    while y < y1:
        if all(px[x, y] == bg for x in range(x0, x1)):
            y += 1
            continue
        s = y
        while y < y1 and any(px[x, y] != bg for x in range(x0, x1)):
            y += 1
        bands.append((s, y))
    return bands


def blocks_in(px, bg, band, box):
    """The separate map blocks inside one horizontal band.

    THE GRID MUST START AT EACH BLOCK'S OWN CORNER, not at the image's. A
    stitched sheet does not align its floors to a common origin, so gridding
    everything from one global left edge cuts every misaligned floor half a
    tile off and turns one wall tile into sixteen "unique" ones. The first cut
    of this tool did exactly that and reported 4936 unique tiles out of 24885
    — a dedup ratio that looks like a working tool and is actually noise.
    """
    y0, y1 = band
    out = []
    x = box[0]
    while x < box[2]:
        if all(px[x, y] == bg for y in range(y0, y1)):
            x += 1
            continue
        s = x
        while x < box[2] and any(px[x, y] != bg for y in range(y0, y1)):
            x += 1
        out.append((s, x))
    return out


def cell_key(px, cx, cy, bg):
    """Exact pixel content of one cell, plus whether it is all padding."""
    h = hashlib.sha1()
    blank = True
    for y in range(cy, cy + TILE):
        for x in range(cx, cx + TILE):
            p = px[x, y]
            if p != bg:
                blank = False
            h.update(bytes(p))
    return h.hexdigest(), blank


def rip(sheet, name, half, quiet=False):
    path = os.path.join(SHEETS, sheet)
    im, px, W, H = load(path)
    bg = background(px, W, H)

    split = find_split(px, W, H, bg) if half == 'auto' else None
    if half in ('left', 'right') and split is None:
        split = find_split(px, W, H, bg)
    crop = None
    if split:
        crop = (0, 0, split[0], H) if half in ('auto', 'left') else (split[1], 0, W, H)
        im = im.crop(crop)
        px = im.load()
        W, H = im.size

    box = content_box(px, W, H, bg)
    if box is None:
        raise SystemExit(f'{sheet}: nothing but padding')

    bands = row_bands(px, bg, box, W)

    # The appendix: trailing bands shorter than a room. A room is 8 tiles tall
    # (128px) at minimum in these games, so anything under that at the BOTTOM
    # of the image is a panel strip rather than terrain. Bands are only
    # discarded from the end — a short band in the middle is a small room.
    room_min = 8 * TILE
    discarded = []
    while bands and (bands[-1][1] - bands[-1][0]) < room_min:
        discarded.append(bands.pop())
    discarded.reverse()

    tiles = OrderedDict()          # hash -> {count, at, img}
    scanned = 0
    blocks = 0
    for band in bands:
        for (bx0, bx1) in blocks_in(px, bg, band, box):
            blocks += 1
            by0, by1 = band
            for cy in range(by0, by1 - TILE + 1, TILE):
                for cx in range(bx0, bx1 - TILE + 1, TILE):
                    k, blank = cell_key(px, cx, cy, bg)
                    if blank:
                        continue
                    scanned += 1
                    t = tiles.get(k)
                    if t is None:
                        tiles[k] = {'count': 1, 'at': [cx, cy],
                                    'img': im.crop((cx, cy, cx + TILE, cy + TILE))}
                    else:
                        t['count'] += 1

    # Frequency order, ties broken by first-seen position so the output is
    # stable rather than dependent on dict ordering across Python versions.
    order = sorted(tiles.items(), key=lambda kv: (-kv[1]['count'], kv[1]['at'][1], kv[1]['at'][0]))

    cols = 16
    rows = (len(order) + cols - 1) // cols
    sheet_img = Image.new('RGB', (cols * TILE, max(1, rows) * TILE), bg)
    manifest = []
    for i, (k, t) in enumerate(order):
        gx, gy = (i % cols) * TILE, (i // cols) * TILE
        sheet_img.paste(t['img'], (gx, gy))
        manifest.append(OrderedDict([
            ('index', i),
            ('cell', [i % cols, i // cols]),
            ('count', t['count']),
            ('at', t['at']),
            ('sha1', k[:16]),
        ]))

    os.makedirs(OUT, exist_ok=True)
    png = os.path.join(OUT, name + '.png')
    js = os.path.join(OUT, name + '.json')
    sheet_img.save(png)
    doc = OrderedDict([
        ('source', sheet),
        ('half', half if split else 'whole'),
        ('split', list(split) if split else None),
        ('background', list(bg)),
        ('content', list(box)),
        ('tile', TILE),
        ('columns', cols),
        ('blocks', blocks),
        ('scanned', scanned),
        ('unique', len(order)),
        ('discardedBands', [list(b) for b in discarded]),
        ('tiles', manifest),
    ])
    with open(js, 'w') as f:
        json.dump(doc, f, indent=1)
        f.write('\n')

    if not quiet:
        print(f'{name}: {scanned} cells scanned, {len(order)} unique '
              f'({"split at %d-%d" % split if split else "no palette split"})')
        print(f'  background {bg}, content {box}, {len(bands)} bands, {blocks} blocks')
        if discarded:
            print(f'  discarded {len(discarded)} appendix band(s) below the last '
                  f'room row: {discarded}')
        else:
            print('  discarded no appendix bands')
        top = order[:5]
        print('  most common: ' + ', '.join(f'#{i} x{t["count"]}@{t["at"]}'
                                            for i, (_, t) in enumerate(top)))
    return png, js


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('sheet', nargs='?')
    ap.add_argument('--name')
    ap.add_argument('--half', default='auto', choices=['auto', 'left', 'right'])
    ap.add_argument('--all', action='store_true')
    ap.add_argument('--verify', action='store_true',
                    help='re-emit every configured map and fail unless byte-identical')
    a = ap.parse_args()

    if a.verify:
        before = {}
        for sheet, name, half in MAPS:
            for p in (os.path.join(OUT, name + '.png'), os.path.join(OUT, name + '.json')):
                before[p] = open(p, 'rb').read() if os.path.exists(p) else None
        for sheet, name, half in MAPS:
            rip(sheet, name, half, quiet=True)
        bad = [p for p, b in before.items()
               if b is not None and b != open(p, 'rb').read()]
        if bad:
            print('NOT byte-identical: ' + ', '.join(os.path.basename(p) for p in bad))
            return 1
        missing = [p for p, b in before.items() if b is None]
        if missing:
            print('emitted for the first time: '
                  + ', '.join(os.path.basename(p) for p in missing))
            return 0
        print(f'rip-dungeon-maps: byte-identical across {len(before)} file(s)')
        return 0

    if a.all or not a.sheet:
        for sheet, name, half in MAPS:
            rip(sheet, name, half)
        return 0

    rip(a.sheet, a.name or os.path.splitext(a.sheet)[0], a.half)
    return 0


if __name__ == '__main__':
    sys.exit(main())
