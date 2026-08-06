#!/usr/bin/env python3
"""Extract background terrain tiles from the reference sheets.

  python3 tools/rip-terrain.py          # rewrite src/data/tiles-terrain.js

`docs/ART-DIRECTION.md` names `assets/sheets/custom-oracle-style-overworld.png`
and `assets/sheets/oracle-seasons-dungeon-backgrounds.png` the references for
overworld and dungeon terrain, and says to extract from them rather than
approximate. Both sheets are assembled *maps*, not tile palettes, so there is no
cell grid to walk the way `rip-enemies.py` walks the enemy sheet — each map
block sits at its own origin. `PICKS` below therefore records one hand-verified
16x16 source rectangle per tile.

How each rectangle was found, so it can be redone for a tile not listed here:

  A ground tile is the 16x16 window that repeats at +16 in x *and* +16 in y. A
  window that passes that test is both correctly phased and seamless by
  construction, which is exactly the property `docs/ART-DIRECTION.md` demands of
  terrain. Scanning a region for windows that pass, collapsing the 256 cyclic
  phase shifts of each hit onto one key and ranking by area covered hands back
  the region's tile set. The scratch script that does it is not committed; the
  paragraph above is the whole algorithm.

What this tool deliberately does NOT do:

  * It does not touch the palettes. Every tile here keeps the palette its
    definition in `tiles-core.js` already binds, so the palette-swap variants
    (`grassDark`, `saltFlat`, `iceFloor`, `rockFloorRust`, ...) keep working and
    the game's colour scheme does not shift under the extracted enemy sprites.
    The four source colours are emitted alongside as `*_SRC` for reference.
  * It does not extract animated tiles. The sheets are static maps and hold no
    second frame, so water stays hand-drawn.

Source sheets are Nintendo's artwork (dungeon backgrounds) and a fan-made
Oracle-style tileset; see `assets/sheets/README.md` for ripper credit.
"""

import os
import sys
from collections import Counter

try:
    from PIL import Image, ImageDraw
except ImportError:
    sys.exit("rip-terrain: needs Pillow — run `pip install pillow`")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OW = os.path.join(ROOT, 'assets/sheets/custom-oracle-style-overworld.png')
DG = os.path.join(ROOT, 'assets/sheets/oracle-seasons-dungeon-backgrounds.png')
AG = os.path.join(ROOT, 'assets/sheets/oracle-ages-overworld.png')
SB = os.path.join(ROOT, 'assets/sheets/oracle-seasons-tileset-subrosia.png')
OUT = os.path.join(ROOT, 'src/data/tiles-terrain.js')

# art name -> (sheet, x, y, note). The note is what the tile is on the sheet,
# which is worth recording because the coordinates alone say nothing.
PICKS = [
    ('grassTuft',   OW, 1611,  307, 'grass with scattered tufts'),
    ('tallgrass',   OW,  886, 1049, 'tall blades, the cuttable kind'),
    ('sand',        OW, 1788,   65, 'dry sand, sparse grain'),
    ('sandWet',     OW, 1933,   81, 'damp sand, denser grain'),
    ('sandRipple',  OW,  484,    1, 'wind-rippled dune'),
    ('mud',         OW, 2206,  154, 'churned bog'),
    ('rockFloor',   OW,  645, 1549, 'cobbled paving'),
    ('dFloor',      DG,  547,   42, 'dungeon floor, mottled flagstone'),
    ('dWall',       DG,  483,   26, 'dungeon wall run, lit top and hatched base'),
]

# Props are a different shape of problem from ground, and need their own pass.
#
# A ground tile fills its cell; a prop is an object with ground showing around
# it, so it carries transparency and a base tile underneath (`underArt`). It is
# therefore NOT found by the seamless-window scan that found the nine above —
# nothing about a prop repeats — and it cannot be quantised the same way,
# because the ground it sits on must become transparent rather than an index.
#
# Almost every prop on the overworld sheet is ~30x30, i.e. TWO game tiles wide
# and two tall (see docs/HANDOFF.md). `flowers` is the one that fits a single
# 16x16 cell, which is why it is the only entry here.
#
# `slots` maps the prop's own colours, lightest first, onto palette indices.
# It is explicit rather than 0,1,2,3 for the reason recorded in HANDOFF: index
# 1 is the *field* tone of a region's ground palette, so any prop pixel placed
# there sinks into the ground it is standing on. Flowers take (0, 2, 3) — a
# bright body, a dark shade, a near-black outline — which is what makes the
# shape read against grass.
PROPS = [
    ('flowers', OW, 2061, 1469, (0, 2, 3), 'leafy flowering plant, on the forest path'),

    # From the Labrynna Present overworld — a real Oracle of Ages background rip
    # rather than the fan-made assembled map, which is why these two exist at
    # all. On that sheet the props are single 16x16 cells sitting on their own
    # ground, on a strict grid at phase (2, 8). `--props` found them; see
    # docs/HANDOFF.md for what else it found and what it could not.
    ('rock', AG, 418, 936, (1, 2, 3), 'liftable boulder, beside the dirt clearing'),

    # NOT extracted, deliberately: the Ages shrub at AG 450,920 is the sheet's
    # cuttable bush and is authentic, but it is the same four-leaf rosette as
    # `flowers` above — extracting it makes a tile the player must cut look
    # identical to one that is scenery. `bush` stays hand-drawn until `flowers`
    # is re-picked as something actually floral, at which point 450,920 is the
    # right source for it. See docs/HANDOFF.md.
]

# Objects that are BIGGER THAN A TILE, cut into their four 16x16 quadrants.
#
# Every tree in every Oracle sheet — Seasons, Ages, the fan-made map — is 32x32.
# There is no 16x16 tree anywhere to find, so a faithful tree cannot be one
# tile, and the hand-drawn one it replaces was a 16x16 impression of a 32x32
# object. That is why the game's trees never looked like the source's.
#
# The engine reassembles them: a tile def carrying `quad: 'treeQ'` draws
# `treeQ_<x&1><y&1>` instead of its own art, so a 2x2 patch of tree tiles is one
# whole source tree and a longer run is a correctly-phased forest canopy — the
# same way the source games' own maps are authored. No room grid changes.
#
# `bg` is stated because a quadrant's corner pixel is often the object's own
# outline rather than the ground behind it.
QUADS = []


def lum(c):
    return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]


def quantise(block):
    """16x16 RGB -> (grid of 0-3, four source colours lightest first).

    Deliberately not `ripkit.quantise`: that pads a short palette by repeating
    its last colour and then picks indices by nearest-distance search, which
    ties and is not reproducible (see docs/HANDOFF.md). Here the four kept
    colours are ranked by a total order and every pixel is a direct lookup, so
    the output is byte-identical run to run.
    """
    cnt = Counter(p for row in block for p in row)
    # Ties broken on the RGB tuple so the choice does not depend on dict order.
    ranked = sorted(cnt.items(), key=lambda kv: (-kv[1], kv[0]))
    keep = sorted((c for c, _ in ranked[:4]), key=lambda c: (-lum(c), c))
    remap = {c: min(keep, key=lambda k: ((lum(k) - lum(c)) ** 2, k)) for c in cnt}
    idx = {c: i for i, c in enumerate(keep)}
    grid = [''.join(str(idx[remap[p]]) for p in row) for row in block]
    return grid, keep


def quantise_quad(block, colmap, bg):
    """16x16 RGB -> grid of 0-3 and '.', mapping colours by an EXPLICIT table.

    Quadrants cannot use `quantise_prop`'s slot list. That ranks the colours
    *present in this cell* by luminance and indexes by rank — and each quadrant
    of an object holds a different subset, so the same green lands on a
    different index in every quarter. The tree came out with a brown canopy that
    way. An object bigger than a cell has one palette, so it needs one table,
    written per colour and shared by all four quarters.
    """
    out = []
    for row in block:
        line = []
        for p in row:
            if p == bg:
                line.append('.')
                continue
            key = '#%02x%02x%02x' % p
            if key not in colmap:
                raise SystemExit('rip-terrain: quad colour %s not in the map' % key)
            line.append(str(colmap[key]))
        out.append(''.join(line))
    return out


def quantise_prop(block, slots, bg=None):
    """16x16 RGB -> (grid of 0-3 and '.', the prop's own colours lightest first).

    The ground the prop stands on becomes transparent, but only where it is
    reachable from the cell border. Source colour *enclosed* by the prop's own
    outline is artwork, not background — the same trap `rip-hud.py` hit with the
    Seed Satchel's highlight, recorded in docs/HANDOFF.md. Flood-filling inward
    rather than testing colour equality is what keeps a flower's pale centre.
    """
    # The background must be stated for a quadrant of a larger object: its
    # corner pixel is as likely to be the object's own outline as the ground,
    # and sniffing it there eats the outline and then the whole sprite.
    #
    # Stating it also changes what it MEANS. Sniffed, the flood fill only clears
    # background reachable from the border, so colour walled in by the object
    # stays artwork — that is what keeps a flower's pale centre. Stated, the
    # caller is asserting "this colour is ground wherever it appears", which is
    # what a tree needs: the sky between its roots is ground showing through and
    # must let the grass under it out, even though the outline encloses it.
    grid = [[None] * 16 for _ in range(16)]
    if bg is not None:
        for cy in range(16):
            for cx in range(16):
                if block[cy][cx] == bg:
                    grid[cy][cx] = '.'
        kept = sorted({block[cy][cx] for cy in range(16) for cx in range(16)
                       if grid[cy][cx] is None}, key=lambda c: (-lum(c), c))
        if len(kept) > len(slots):
            raise SystemExit('rip-terrain: prop has %d colours, %d slots given'
                             % (len(kept), len(slots)))
        idx = {c: slots[i] for i, c in enumerate(kept)}
        for cy in range(16):
            for cx in range(16):
                if grid[cy][cx] is None:
                    grid[cy][cx] = str(idx[block[cy][cx]])
        return [''.join(r) for r in grid], kept
    bg = block[0][0]
    stack = [(i, e) for i in range(16) for e in (0, 15)]
    stack += [(e, i) for i in range(16) for e in (0, 15)]
    seen = set()
    while stack:
        cx, cy = stack.pop()
        if not (0 <= cx < 16 and 0 <= cy < 16) or (cx, cy) in seen:
            continue
        if block[cy][cx] != bg:
            continue
        seen.add((cx, cy))
        grid[cy][cx] = '.'
        stack += [(cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)]

    kept = sorted({block[cy][cx] for cy in range(16) for cx in range(16)
                   if grid[cy][cx] is None}, key=lambda c: (-lum(c), c))
    if len(kept) > len(slots):
        raise SystemExit('rip-terrain: prop has %d colours, %d slots given'
                         % (len(kept), len(slots)))
    idx = {c: slots[i] for i, c in enumerate(kept)}
    for cy in range(16):
        for cx in range(16):
            if grid[cy][cx] is None:
                grid[cy][cx] = str(idx[block[cy][cx]])
    return [''.join(r) for r in grid], kept


def hexc(c):
    return '#%02x%02x%02x' % c


def seamless_scan(path, x0, y0, x1, y1, top=24):
    """Rank the seamless 16x16 tiles in a region of a sheet.

    This is the scan the module header describes, and it is committed now
    because it was not before — `docs/HANDOFF.md` recorded the algorithm in
    prose and left the next person to rewrite it, which is a session's work to
    recover something that fits on a screen.

    A ground tile is the 16x16 window that repeats at +16 in x AND +16 in y.
    Passing that test means the window is correctly phased and tiles seamlessly
    with itself, which is exactly what `docs/ART-DIRECTION.md` demands of
    terrain — so the test does not just find candidates, it proves the property.

    Every hit has 256 cyclic phase shifts that are the same tile, so hits are
    deduplicated on their raw bytes first and only the distinct ones are
    canonicalised. Doing it the other way round is what makes the naive version
    too slow to run on a whole sheet.
    """
    im = Image.open(path).convert('RGB')
    W, H = im.size
    x1, y1 = min(x1, W - 32), min(y1, H - 32)
    px = im.load()

    def row(x, y):
        return bytes(b for i in range(16) for b in px[x + i, y])

    rows = {}

    def block(x, y):
        out = []
        for j in range(16):
            k = (x, y + j)
            r = rows.get(k)
            if r is None:
                r = rows[k] = row(x, y + j)
            out.append(r)
        return out

    hits = Counter()
    for y in range(y0, y1):
        for x in range(x0, x1):
            b = block(x, y)
            if block(x + 16, y) != b:
                continue
            if block(x, y + 16) != b:
                continue
            hits[b''.join(b)] += 1

    # Collapse the 256 phase shifts of each distinct hit onto one key.
    def canonical(raw):
        grid = [raw[j * 48:(j + 1) * 48] for j in range(16)]
        best = None
        for dy in range(16):
            rot = grid[dy:] + grid[:dy]
            for dx in range(16):
                s = b''.join(r[dx * 3:] + r[:dx * 3] for r in rot)
                if best is None or s < best:
                    best = s
        return best

    groups = {}
    for raw, n in hits.items():
        k = canonical(raw)
        g = groups.setdefault(k, [0, raw])
        g[0] += n
    ranked = sorted(groups.values(), key=lambda g: -g[0])[:top]

    print(f'{path}  region ({x0},{y0})-({x1},{y1})')
    print(f'  {sum(hits.values())} seamless windows, {len(groups)} distinct tiles\n')
    for i, (n, raw) in enumerate(ranked):
        # Report a real origin for the tile so it can go straight into PICKS.
        origin = next(xy for xy, r in
                      ((xy, b''.join(block(*xy))) for xy in
                       ((x, y) for y in range(y0, y1) for x in range(x0, x1)))
                      if r == raw)
        cols = len({raw[k:k + 3] for k in range(0, len(raw), 3)})
        print(f'  [{i:2}] {n:6} windows  origin {origin[0]},{origin[1]}  {cols} colours')
    return ranked


def prop_scan(path, px, py, x0, y0, x1, y1, out_png=None, top=120):
    """Find candidate PROPS on a sheet whose tile grid has phase (px, py).

    The seamless scan finds ground, and by construction it cannot find props:
    a prop does not repeat, which is the whole test. A prop is instead a cell
    that is *mostly* the ground around it with an object sitting in the middle —
    so this walks the grid, measures how much of each cell is the ground colour
    dominating its 3x3 neighbourhood, and keeps the cells that are neither
    empty ground nor solid object.

    It reports candidates, not answers. Read the contact sheet it writes and
    pick by eye, the way `docs/briefs/AGENTS.md` section J says to.
    """
    im = Image.open(path).convert('RGB')
    W, H = im.size
    px_ = im.load()

    def cell(x, y):
        return [px_[x + i, y + j] for j in range(16) for i in range(16)]

    found = {}
    for y in range(y0 + (py - y0) % 16, min(y1, H - 16), 16):
        for x in range(x0 + (px - x0) % 16, min(x1, W - 16), 16):
            here = cell(x, y)
            ring = []
            for dy in (-16, 0, 16):
                for dx in (-16, 0, 16):
                    if dx == 0 and dy == 0:
                        continue
                    if 0 <= x + dx < W - 16 and 0 <= y + dy < H - 16:
                        ring += cell(x + dx, y + dy)
            if not ring:
                continue
            ground = Counter(ring).most_common(1)[0][0]
            share = sum(1 for p in here if p == ground) / 256.0
            # Neither bare ground nor a solid block of something else.
            if not (0.25 <= share <= 0.80):
                continue
            if len(set(here)) > 8:          # too busy to be a clean prop
                continue
            found.setdefault(bytes(b for p in here for b in p), (x, y, share))

    ranked = list(found.values())[:top]
    if out_png:
        S, COLS = 4, 16
        rows = (len(ranked) + COLS - 1) // COLS
        sheet = Image.new('RGB', (COLS * (16 * S + 10), max(1, rows) * (16 * S + 18)), (32, 32, 32))
        d = ImageDraw.Draw(sheet)
        for i, (x, y, _) in enumerate(ranked):
            sheet.paste(im.crop((x, y, x + 16, y + 16)).resize((16 * S, 16 * S), Image.NEAREST),
                        ((i % COLS) * (16 * S + 10) + 4, (i // COLS) * (16 * S + 18) + 2))
            d.text(((i % COLS) * (16 * S + 10) + 4, (i // COLS) * (16 * S + 18) + 16 * S + 2),
                   str(i), fill=(225, 225, 225))
        sheet.save(out_png)
        print(f'  contact sheet -> {out_png}')
    for i, (x, y, share) in enumerate(ranked):
        print(f'  [{i:3}] {x},{y}  ground {share:.0%}')
    return ranked


def main():
    if '--props' in sys.argv:
        a = sys.argv[sys.argv.index('--props') + 1:]
        sheet = {'ow': OW, 'dg': DG, 'ag': AG, 'sb': SB}[a[0]]
        prop_scan(sheet, int(a[1]), int(a[2]), int(a[3]), int(a[4]), int(a[5]), int(a[6]),
                  out_png=a[7] if len(a) > 7 else None)
        return

    if '--scan' in sys.argv:
        a = sys.argv[sys.argv.index('--scan') + 1:]
        sheet = {'ow': OW, 'dg': DG, 'ag': AG, 'sb': SB}[a[0]]
        seamless_scan(sheet, int(a[1]), int(a[2]), int(a[3]), int(a[4]))
        return

    sheets = {}
    arts, pals, dropped = [], [], []
    for name, path, x, y, note in PICKS:
        im = sheets.get(path)
        if im is None:
            im = sheets[path] = Image.open(path).convert('RGB')
        block = [[im.getpixel((x + cx, y + cy)) for cx in range(16)] for cy in range(16)]
        before = len({p for row in block for p in row})
        grid, keep = quantise(block)
        if before > 4:
            dropped.append((name, before))
        arts.append((name, note, os.path.basename(path), x, y, grid))
        pals.append((name, keep))

    for name, path, x, y, bg, colmap, note in QUADS:
        im = sheets.get(path)
        if im is None:
            im = sheets[path] = Image.open(path).convert('RGB')
        for qy in (0, 1):
            for qx in (0, 1):
                ox, oy = x + qx * 16, y + qy * 16
                block = [[im.getpixel((ox + cx, oy + cy)) for cx in range(16)] for cy in range(16)]
                grid = quantise_quad(block, colmap, bg)
                keep = [tuple(int(k[i:i + 2], 16) for i in (1, 3, 5)) for k in colmap]
                arts.append((f'{name}_{qx}{qy}', f'{note} ({"TL" if (qx, qy) == (0, 0) else "TR" if qx else "BL" if qy == 1 and not qx else "BR"})',
                             os.path.basename(path), ox, oy, grid))
                pals.append((f'{name}_{qx}{qy}', keep))

    for name, path, x, y, slots, note in PROPS:
        im = sheets.get(path)
        if im is None:
            im = sheets[path] = Image.open(path).convert('RGB')
        block = [[im.getpixel((x + cx, y + cy)) for cx in range(16)] for cy in range(16)]
        grid, keep = quantise_prop(block, slots)
        arts.append((name, note, os.path.basename(path), x, y, grid))
        pals.append((name, keep))

    lines = [
        '// GENERATED by tools/rip-terrain.py — do not edit by hand.',
        '//',
        '// Background terrain extracted from the reference sheets in assets/sheets/,',
        '// which docs/ART-DIRECTION.md makes the canonical source for terrain. Each',
        '// tile is a 16x16 window that repeats at +16 in both axes on its sheet, so it',
        '// is correctly phased and tiles seamlessly with itself by construction.',
        '//',
        '// These override the hand-drawn art of the same name in tiles-core.js. Only the',
        '// pixels change: every tile keeps the palette its definition there already',
        '// binds, which is what keeps the palette-swap variants (grassDark, saltFlat,',
        '// iceFloor, rockFloorRust, ...) rendering. TERRAIN_SRC_PALETTES records the',
        '// four colours each tile actually has on the sheet, for reference.',
        '',
        'export const TERRAIN_ART = {',
    ]
    for name, note, sheet, x, y, grid in arts:
        lines.append('  // %s — %s @ %d,%d' % (note, sheet, x, y))
        lines.append('  %s: `' % name)
        lines.extend('    ' + r for r in grid[:-1])
        lines.append('    ' + grid[-1] + '`,')
        lines.append('')
    lines.append('};')
    lines.append('')
    lines.append('// The source colours, lightest first — not installed, kept for reference.')
    lines.append('export const TERRAIN_SRC_PALETTES = {')
    for name, keep in pals:
        lines.append("  %s: [%s]," % (name, ', '.join("'%s'" % hexc(c) for c in keep)))
    lines.append('};')
    lines.append('')

    with open(OUT, 'w') as f:
        f.write('\n'.join(lines))
    print('emitted %d terrain tiles (%d ground, %d props) -> %s'
          % (len(arts), len(PICKS), len(PROPS), OUT))
    for name, n in dropped:
        print('  note: %s had %d colours on the sheet, merged down to 4' % (name, n))


if __name__ == '__main__':
    main()
