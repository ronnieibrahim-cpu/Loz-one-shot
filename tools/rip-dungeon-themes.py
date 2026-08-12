#!/usr/bin/env python3
"""Extract per-dungeon themed terrain from the Seasons dungeon map.

  python3 tools/rip-dungeon-themes.py          # rewrite tiles-dungeon-themes.js
  python3 tools/rip-dungeon-themes.py --sheet  # contact sheet of every pick

WHY THIS EXISTS
---------------
Before this, the whole game had exactly TWO extracted dungeon tiles — `dFloor`
and `dWall` — and all eight dungeons used the one shared `dungeon` legend. Every
dungeon was therefore the same room in a different palette, which is the
opposite of the source: Seasons gives each dungeon its own masonry, its own
floor pattern and its own colour, and you know which dungeon a screenshot is
from before you recognise the room.

HOW THE PICKS WERE FOUND, so a future session can add to them
-------------------------------------------------------------
`tools/rip-dungeon-maps.py` deduplicates the stitched floor map and writes
`assets/tilesets/seasons-dungeons.json`, which records for every distinct tile
how OFTEN it occurs and one map coordinate where it appears. Frequency is what
separates a wall from a decoration without a human looking: the tiles below were
chosen by rendering the manifest in frequency order, looking at it, and reading
off the coordinate of the family wanted. The `x` in each comment is that count.

The picks cite the coordinate on the ORIGINAL sheet, not an index into the
tileset, deliberately. An index would silently point at a different tile the
moment the deduplicator's ordering changed; a coordinate keeps meaning the same
pixels, and it is also the citation P7.5 step 8 asks for in a tiledef comment.

THE PALETTES ARE INSTALLED HERE, unlike rip-terrain.py's
--------------------------------------------------------
`rip-terrain.py` deliberately keeps the game's own palettes, because it is
replacing the pixels of tiles that already existed and must not shift the
colour scheme under them. This tool is the opposite case: these tiles are NEW,
they have no palette in the game to preserve, and the source colours are
precisely what makes one dungeon distinguishable from another. So the four
colours each tile actually has on the cartridge are emitted and registered, and
the tiledefs in tiles-core.js name them.

Source sheet is Nintendo's artwork, ripped by Mister Mike; see
assets/sheets/README.md for credit.
"""

import os
import sys
from collections import Counter

try:
    from PIL import Image, ImageDraw
except ImportError:
    sys.exit("rip-dungeon-themes: needs Pillow — run `pip install pillow`")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DG = os.path.join(ROOT, 'assets/sheets/oracle-seasons-dungeon-backgrounds.png')
OUT = os.path.join(ROOT, 'src/data/tiles-dungeon-themes.js')

# name, x, y, note.  The note's "xN" is the tile's occurrence count on the map,
# straight out of assets/tilesets/seasons-dungeons.json.
PICKS = [
    # ---- floors ----------------------------------------------------------
    ('ruinFloor',   531, 1290, 'x1196 sunken rosette flagstone, the ruin floor'),
    ('ruinFloorAlt', 756, 1290, 'x94 the same flagstone, worn smooth'),
    ('paleFloor',  1986,   42, 'x1244 pale mottled flagstone, the commonest floor on the map'),
    ('reefFloor',   659,   42, 'x201 pale blue flagstone with a scored ring'),
    ('abyssFloor',   81, 2799, 'x1038 dark tiling, studded — the deepest floors'),
    ('brickFloor',  547, 1434, 'x223 red brick laid in courses, cracked through'),
    ('forgeFloor',  579,  621, 'x8 amber lozenge tiling'),
    # A pale panelled flagstone was wanted here and there is no clean copy of
    # one: BOTH instances on the map (693,2352 and 2148,2352) carry a stripe of
    # the room frame bled into the right edge. On a stitched map a tile touching
    # a room boundary carries the boundary, and the deduplicator cannot know
    # that is not part of the art — it is different pixels, so it is a different
    # tile, and it dedupes to itself perfectly. ALWAYS look at the contact sheet
    # before trusting a pick. The Salt Pan Vault uses `paleFloor` instead.
    ('panelFloor',  740, 1499, 'x65 tan floor in four sunken panels'),
    ('gildFloor',  2725,  444, 'x19 olive floor under a gold lattice'),

    # ---- walls -------------------------------------------------------------
    #
    # A WALL TILE IN THIS ENGINE MUST TILE WITH ITSELF IN BOTH AXES, because one
    # tile fills the whole wall region — the source builds a wall from a lit
    # face, a hatched base and corner pieces, and this game spends one tile on
    # all of it (the same shape of problem as the 32x32 trees and the cliffs).
    #
    # There is no substitute for LOOKING at a 4x4 tiling of a candidate. The
    # first cut of this file picked `hatchWall` and `forgeWall` for four of the
    # eight dungeons on the strength of a single-cell contact sheet, and in game
    # they came out as vertical stripes: both are wall RUNS, directional by
    # construction, and repeating one down a two-tile border reads as a picket
    # fence. Both are kept below because they are the right art for the top
    # course of a room and P8 may want them — but NOT as a fill.
    #
    # What does tile in both axes is bevelled block grids and brick courses.
    # Every wall used by a theme is one of those.
    ('brickWallBlue', 242,  203, 'x135 blue brick in courses — tiles in both axes'),
    ('coralWall',      17,   58, 'x266 rose-bevelled block grid'),
    ('knurlWall',    2002, 1708, 'x236 knurled gold-and-olive masonry'),
    ('emberWall',     499, 1274, 'x209 brown brick in courses'),
    ('cryptWall',    2114,  428, 'x22 violet masonry with pale capstones'),
    ('studWall',      225,  396, 'x16 blue-grey wall banded with gold studs'),
    # DIRECTIONAL. A horizontal run, for the top course of a room. Never a fill.
    ('hatchWall',       1,   42, 'x196 pale wall RUN, lit face and hatched base'),
    # DIRECTIONAL. Vertical barrel-vaulting. Never a fill.
    ('forgeWall',       1, 1274, 'x12 amber wall RUN, barrel-vaulted'),

    # ---- blocks and props --------------------------------------------------
    ('cryptBlock',      1, 1370, 'x31 violet block, pale-capped, to match cryptWall'),
    ('vaultBlock',   2066, 1467, 'x324 deeply bevelled block — also tiles as a wall'),
    ('lionHead',      129,  412, 'x10 a gilded lion mask'),
    ('urn',           900,   42, 'x80 a wide-bellied urn'),
]

# Picks that are an OBJECT standing on a floor, not a floor or a wall.
#
# A 16x16 cell cut out of a room contains whatever the room's floor was behind
# the object, and the deduplicator has no way to know that is not part of the
# art — it is different pixels, so it is a different tile, and it dedupes to
# itself perfectly. `panelFloor` above documents the same hazard for a tile
# that caught a room's frame. Left alone, `urn` drew a rectangle of one
# dungeon's floor into every other dungeon's floor.
#
# So the background is keyed out to transparency and the tiledef names an
# `underArt`, which is the engine's own mechanism for a tile with holes in it:
# the floor is drawn first and the object over it. That also brings these tiles
# into line with the house art rule — three colours plus transparency.
#
# ONLY FOR OBJECTS. Keying a floor or a wall would eat the tile, because the
# border-connected run IS the tile.
KEY_BACKGROUND = {'urn'}


def lum(c):
    return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]


def quantise(block):
    """16x16 RGB -> (grid of 0-3, four source colours lightest first).

    Lifted verbatim from rip-terrain.py, and deliberately not ripkit's: that
    one pads a short palette by repeating its last colour and picks indices by
    nearest-distance search, which ties and is not reproducible. Here the kept
    colours have a total order and every pixel is a direct lookup, so the
    output is byte-identical run to run — which is what check-tilesets asserts.
    """
    cnt = Counter(p for row in block for p in row)
    ranked = sorted(cnt.items(), key=lambda kv: (-kv[1], kv[0]))
    keep = sorted((c for c, _ in ranked[:4]), key=lambda c: (-lum(c), c))
    remap = {c: min(keep, key=lambda k: ((lum(k) - lum(c)) ** 2, k)) for c in cnt}
    idx = {c: i for i, c in enumerate(keep)}
    grid = [''.join(str(idx[remap[p]]) for p in row) for row in block]
    # PAD TO FOUR. A flat tile can have two or three distinct colours, and
    # gfx/palettes.js registerPalettes() takes ONLY arrays of exactly four and
    # SILENTLY IGNORES anything else — so a three-colour tile registered
    # nothing, its tiledef named a palette that did not exist, and the tile
    # drew in the fallback. validate.mjs caught it; nothing else would have.
    # rip-terrain.py has the same short arrays and never noticed, because it
    # does not install its palettes. Repeating the darkest entry is safe: the
    # art only ever indexes colours that were actually kept.
    while len(keep) < 4:
        keep.append(keep[-1])
    return grid, keep


def key_background(grid):
    """Flood the border-connected run of the commonest EDGE index to '.'.

    Border-connected rather than "every pixel of that index": an urn with a
    highlight in the same colour as the floor keeps the highlight, because it
    does not touch the edge. Anything that reaches the frame is the room behind
    the object and nothing else can be.
    """
    g = [list(r) for r in grid]
    edge = ([g[0][x] for x in range(16)] + [g[15][x] for x in range(16)]
            + [g[y][0] for y in range(16)] + [g[y][15] for y in range(16)])
    bg = Counter(edge).most_common(1)[0][0]
    stack = [(x, y) for x in range(16) for y in (0, 15)]
    stack += [(x, y) for y in range(16) for x in (0, 15)]
    while stack:
        x, y = stack.pop()
        if not (0 <= x < 16 and 0 <= y < 16) or g[y][x] != bg:
            continue
        g[y][x] = '.'
        stack += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
    return [''.join(r) for r in g]


def hexc(c):
    return '#%02x%02x%02x' % c


def read(im, x, y):
    return [[im.getpixel((x + cx, y + cy)) for cx in range(16)] for cy in range(16)]


def contact_sheet(im, path):
    """Every pick, source above and 4-colour result below. LOOK AT IT."""
    S, COLS = 4, 6
    cw, ch = 16 * S + 8, 16 * S * 2 + 26
    out = Image.new('RGB', (COLS * cw, ((len(PICKS) + COLS - 1) // COLS) * ch), (24, 24, 32))
    dr = ImageDraw.Draw(out)
    for i, (name, x, y, note) in enumerate(PICKS):
        grid, keep = quantise(read(im, x, y))
        q = Image.new('RGB', (16, 16))
        for yy in range(16):
            for xx in range(16):
                q.putpixel((xx, yy), keep[int(grid[yy][xx])])
        gx, gy = (i % COLS) * cw, (i // COLS) * ch
        out.paste(im.crop((x, y, x + 16, y + 16)).resize((16 * S, 16 * S), Image.NEAREST), (gx + 4, gy + 2))
        out.paste(q.resize((16 * S, 16 * S), Image.NEAREST), (gx + 4, gy + 4 + 16 * S))
        dr.text((gx + 4, gy + 8 + 32 * S), name[:14], fill=(200, 200, 160))
    out.save(path)
    print('wrote ' + path)


def main():
    im = Image.open(DG).convert('RGB')

    if '--sheet' in sys.argv:
        contact_sheet(im, os.path.join(ROOT, 'dungeon-themes-contact.png'))
        return 0

    arts, pals, lossy = [], [], []
    for name, x, y, note in PICKS:
        block = read(im, x, y)
        before = len({p for row in block for p in row})
        grid, keep = quantise(block)
        if name in KEY_BACKGROUND:
            grid = key_background(grid)
        if before > 4:
            lossy.append((name, before))
        arts.append((name, note, x, y, grid))
        pals.append((name, keep))

    L = [
        '// GENERATED by tools/rip-dungeon-themes.py — do not edit by hand.',
        '//',
        '// Per-dungeon themed terrain, extracted from the Oracle of Seasons dungeon',
        '// map in assets/sheets/ (ripped by Mister Mike — see that folder\'s README).',
        '//',
        '// Before these existed the game had two extracted dungeon tiles, dFloor and',
        '// dWall, and all eight dungeons shared one legend — so every dungeon was the',
        '// same room in a different palette. The source does the opposite: each of its',
        '// dungeons has its own masonry and its own floor pattern, and you know which',
        '// dungeon a screenshot came from before you recognise the room.',
        '//',
        '// UNLIKE tiles-terrain.js, THE PALETTES HERE ARE INSTALLED. That file replaces',
        '// the pixels of tiles that already existed and must not shift the colour scheme',
        '// under them. These tiles are new, have no palette to preserve, and the source',
        '// colours are exactly what makes one dungeon look unlike another.',
        '//',
        '// Each pick cites its coordinate on the source sheet and how many times the',
        '// tile occurs on the map — frequency is what separates a wall from a one-off',
        '// decoration. See tools/rip-dungeon-maps.py and assets/tilesets/.',
        '//',
        '// A tile in KEY_BACKGROUND is an OBJECT, and the floor the source drew behind',
        '// it has been keyed to `.` — transparent. Its tiledef must name an `underArt`,',
        '// or it draws a hole.',
        '',
        "import { registerPalettes } from '../gfx/palettes.js';",
        '',
        'export const DUNGEON_THEME_ART = {',
    ]
    for name, note, x, y, grid in arts:
        L.append('  // %s — oracle-seasons-dungeon-backgrounds.png @ %d,%d' % (note, x, y))
        L.append('  %s: `' % name)
        L.extend('    ' + r for r in grid[:-1])
        L.append('    ' + grid[-1] + '`,')
        L.append('')
    L.append('};')
    L.append('')
    L.append('// The four colours each tile has on the cartridge, lightest first. These ARE')
    L.append('// installed — tiledefs in tiles-core.js name them.')
    L.append('export const DUNGEON_THEME_PALETTES = {')
    for name, keep in pals:
        L.append("  %s: [%s]," % (name, ', '.join("'%s'" % hexc(c) for c in keep)))
    L.append('};')
    L.append('')
    L.append('export function installDungeonThemePalettes() {')
    L.append('  registerPalettes(DUNGEON_THEME_PALETTES);')
    L.append('}')

    open(OUT, 'w').write('\n'.join(L) + '\n')
    print('emitted %d themed dungeon tiles -> %s' % (len(arts), os.path.relpath(OUT, ROOT)))
    if lossy:
        print('  quantised past 4 colours (check the contact sheet): '
              + ', '.join('%s(%d)' % t for t in lossy))
    return 0


if __name__ == '__main__':
    sys.exit(main())
