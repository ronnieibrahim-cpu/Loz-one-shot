#!/usr/bin/env python3
"""Extract the Oracle of Seasons title, file-select, save and inventory screens.

Regenerate with:  python3 tools/rip-screens.py

SOURCES, and their credit:
  * assets/sheets/oracle-seasons-title-screen.gif — ripped by Tails585 via
    spriters-resource.com ("give credit and don't steal"). The artwork is
    Nintendo's. Three rows of three 160x144 screens: the opening pan up the
    tree, the sky, and the logo.
  * assets/footage/frames/*.png — still screens cut from the Seasons TAS in
    assets/footage/ by tools/grab-footage-frames.py (S147). No sheet anywhere
    in the repo holds the file select, the save prompt or the inventory page.

WHAT IS OURS IN THE OUTPUT, AND WHAT IS NOT. Every pixel here is the source's
except three things, each done by rule rather than by hand:
  1. TEXT IS LIFTED OUT. Japanese labels, the SEASONS name, the copyright line
     and the rod's orb are removed and the gap refilled from the SAME ROW of the
     same surface (the nearest pixel on that row that is not text) — the wood
     grain on these plaques runs horizontally, so a row fill reads as grain.
     The game draws its own words over the blank art at run time.
  2. TIDES is set in the SEASONS plaque. E and S are the plaque's own letters,
     lifted as they are; T, I and D are drawn to the same eleven-pixel serif,
     two-pixel stem and orange accent (CLAUDE.md: if no sheet has it, draw it
     to match). They are the only drawn pixels in the file.
  3. The Rod of Seasons' orb is taken out; its vines stay. The title draws the
     Moon Conch there, the way the Seasons card shows its own marquee item.

Colours are the sources' own; a screen can hold more than four, so the output
is an INDEXED IMAGE per screen — a palette and one character per pixel —
which src/gfx/art.js paints to a cached canvas. `.` is transparent.
"""
import os
import sys

try:
    from PIL import Image
except ImportError:
    sys.exit('rip-screens: needs Pillow — run `pip install pillow`')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TITLE = os.path.join(ROOT, 'assets', 'sheets', 'oracle-seasons-title-screen.gif')
FRAMES = os.path.join(ROOT, 'assets', 'footage', 'frames')
OUT = os.path.join(ROOT, 'src', 'data', 'screens-seasons.js')

W, H = 160, 144
KEYS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'


def load(path, box=None):
    im = Image.open(path).convert('RGB')
    if box:
        im = im.crop(box)
    w, h = im.size
    return [[im.getpixel((x, y)) for x in range(w)] for y in range(h)]


def hexc(c):
    return '#%02x%02x%02x' % c


def rgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def row_fill(img, box, is_text):
    """Replace every text pixel in `box` with the nearest non-text pixel on its
    own row, searching outward from the pixel (left first on a tie). Pixels
    outside the box are never changed; the search may read them."""
    x0, y0, x1, y1 = box
    for y in range(y0, y1):
        src = img[y][:]
        for x in range(x0, x1):
            if not is_text(src[x], x, y):
                continue
            for d in range(1, W):
                hit = None
                for xx in (x - d, x + d):
                    if 0 <= xx < len(src) and not is_text(src[xx], xx, y):
                        hit = src[xx]
                        break
                if hit is not None:
                    img[y][x] = hit
                    break


def dilate_fill(img, box, is_hole, avoid=()):
    """Fill hole pixels from their nearest filled neighbour, ring by ring —
    for a patch (the orb, the copyright line) that is not a row of text."""
    x0, y0, x1, y1 = box
    holes = {(x, y) for y in range(y0, y1) for x in range(x0, x1) if is_hole(img[y][x], x, y)}
    while holes:
        done = {}
        for (x, y) in sorted(holes, key=lambda p: (p[1], p[0])):
            cand = [(x + dx, y + dy) for dx, dy in ((-1, 0), (0, -1), (1, 0), (0, 1))]
            cand = [n for n in cand if n not in holes and 0 <= n[0] < W and 0 <= n[1] < H]
            good = [n for n in cand if img[n[1]][n[0]] not in avoid] or cand
            if good:
                done[(x, y)] = img[good[0][1]][good[0][0]]
        if not done:
            break
        for (x, y), c in done.items():
            img[y][x] = c
        holes -= set(done)


def indexed(img, transparent=None):
    pal, rows = [], []
    for row in img:
        line = ''
        for p in row:
            if p is None or (transparent and p == transparent):
                line += '.'
                continue
            if p not in pal:
                pal.append(p)
                if len(pal) > len(KEYS):
                    raise SystemExit('rip-screens: more colours than keys')
            line += KEYS[pal.index(p)]
        rows.append(line)
    return {'w': len(img[0]), 'h': len(img), 'pal': [hexc(c) for c in pal], 'rows': rows}


# ---------------------------------------------------------------- the title
# The logo screen without PRESS START (sheet x=6, y=301) and the same screen
# with it (x=171) — the difference between the two IS the prompt.
LOGO = (6, 301, 166, 445)
LOGO_PRESS = (171, 301, 331, 445)

RED, WHITE, ORANGE, BROWN = rgb('#a50000'), rgb('#fffbef'), rgb('#c67100'), rgb('#bd6100')
ORB = {rgb(h) for h in ('#3971a5', '#e7389c', '#7b2852', '#b53084', '#31baef', '#ff61f7')}
VINE = {rgb(h) for h in ('#085139', '#4a9252', '#4adb6b', '#319a4a')}

# T, I and D in the plaque's own serif: 11 rows, a two-pixel stem, a serif
# foot one pixel out either side, and the orange accent where a stroke turns.
# W = the letters' cream, c = the orange accent, . = the plaque's red.
DRAWN = {
    'T': ['WWWWWWWWWW',
          'W...WW...W',
          '....WW....',
          '....WW....',
          '....WW....',
          '....WW....',
          '....WW....',
          '....WW....',
          '....WW....',
          '....WW....',
          '..cWWWWc..'],
    'I': ['WWWW',
          '.WW.',
          '.WW.',
          '.WW.',
          '.WW.',
          '.WW.',
          '.WW.',
          '.WW.',
          '.WW.',
          '.WW.',
          'WWWW'],
    'D': ['WWWWWWc...',
          '.WW..cWWc.',
          '.WW....WWc',
          '.WW....cWW',
          '.WW.....WW',
          '.WW.....WW',
          '.WW.....WW',
          '.WW....cWW',
          '.WW....WWc',
          '.WW..cWWc.',
          'WWWWWWc...'],
}
# E and S as the plaque draws them, lifted: (x0, x1) columns of the letter in
# the logo screen, rows 90..100. S is the first letter of SEASONS, E the second.
LIFT = {'S': (45, 52), 'E': (54, 62)}
PLAQUE_ROWS = (90, 101)
PLAQUE_TEXT = (43, 89, 121, 102)   # everything inside the plaque that is lettering


def glyph_from(img, x0, x1):
    y0, y1 = PLAQUE_ROWS
    out = []
    for y in range(y0, y1):
        line = ''
        for x in range(x0, x1):
            p = img[y][x]
            line += 'W' if p == WHITE else 'c' if p in (ORANGE, BROWN) else '.'
        out.append(line)
    return out


def title_screens():
    base = load(TITLE, LOGO)
    press = load(TITLE, LOGO_PRESS)

    glyphs = dict(DRAWN)
    for ch, (x0, x1) in LIFT.items():
        glyphs[ch] = glyph_from(base, x0, x1)

    # 1. SEASONS out of the plaque (and its TM), the plaque's red back in.
    x0, y0, x1, y1 = PLAQUE_TEXT
    for y in range(y0, y1):
        for x in range(x0, x1):
            p = base[y][x]
            if p == WHITE or p == ORANGE or (p == BROWN and x < 117):
                # the rounded right end of the plaque carries its own brown
                # and cream; only the lettering left of it is lifted
                if x < 118 or y < 93:
                    base[y][x] = RED

    # 2. TIDES, centred on the plaque, two pixels between letters.
    word = 'TIDES'
    gap = 2
    width = sum(len(glyphs[c][0]) for c in word) + gap * (len(word) - 1)
    x = (42 + 118 - width) // 2
    for ch in word:
        g = glyphs[ch]
        for dy, line in enumerate(g):
            for dx, v in enumerate(line):
                if v == 'W':
                    base[PLAQUE_ROWS[0] + dy][x + dx] = WHITE
                elif v == 'c':
                    base[PLAQUE_ROWS[0] + dy][x + dx] = ORANGE
        x += len(g[0]) + gap

    # 3. The orb out; the title draws the conch there. Filled from whatever
    # is round it that is not the rod's own vine, so the hole takes the
    # backdrop and the sky rather than a blot of leaf.
    dilate_fill(base, (110, 60, 145, 95), lambda p, x, y: p in ORB, avoid=VINE)

    # 4. The copyright line out. It is a solid plate over the clouds, nine
    # rows tall, so each column is refilled from the sky directly above and
    # below it, mirrored — the cloud bands carry on through the gap.
    xs = [x for y in range(118, 144) for x in range(W) if base[y][x] == rgb('#5a4100')]
    ys = [y for y in range(118, 144) for x in range(W) if base[y][x] == rgb('#5a4100')]
    x0, x1, y0, y1 = min(xs), max(xs) + 1, min(ys), max(ys) + 1
    mid = (y0 + y1) // 2
    for x in range(x0, x1):
        for y in range(y0, y1):
            src = (2 * y0 - 1 - y) if y < mid else (2 * y1 - 1 - y)
            base[y][x] = base[min(H - 1, max(0, src))][x]

    # PRESS START: the pixels where the prompt screen differs from the plain one.
    prompt = [[press[y][x] if press[y][x] != load_cache[1][y][x] else None
               for x in range(W)] for y in range(112, 128)]
    return base, prompt


# ------------------------------------------------------ footage screens

def fs_screens():
    fs = load(os.path.join(FRAMES, 'seasons-file-select.png'))
    sv = load(os.path.join(FRAMES, 'seasons-save.png'))
    inv = load(os.path.join(FRAMES, 'seasons-inventory.png'))
    BLACK = (0, 0, 0)

    # The cursor: the red seed beside slot 1, on the file select's black.
    cursor = [[fs[y][x] if fs[y][x] != BLACK else None for x in range(7, 16)] for y in range(53, 66)]

    # FILE SELECT, blank. Banner lettering; the cursor and the kana name; the
    # right panel's portrait, hearts and number; the lower panel's two lines.
    dark = lambda p, x, y: p == BLACK
    # THE BANNER. Both screens hang the same plank; the save screen's word is
    # the short one, so its banner is cleaned and used for both. The plank's
    # grain runs across, so the lettering's span is refilled with the clean
    # grain to its right, a slice at a time.
    for y in range(7, 22):
        for x in range(46, 110):
            sx = 110 + (x - 46) % 22
            sv[y][x] = sv[y][sx]
    for y in range(4, 24):
        for x in range(12, 148):
            fs[y][x] = sv[y][x]
    for y in range(52, 67):
        for x in range(6, 16):
            fs[y][x] = BLACK
        for x in range(23, 34):
            fs[y][x] = BLACK
    # The panels are three yellows (face, grain, shade); anything else on them
    # is lettering or a sprite.
    # The panels are flat yellow inside a dotted rim; their insides are
    # repainted in the face colour, rim untouched.
    face = (240, 216, 48)
    for (x0, y0, x1, y1) in ((76, 59, 149, 102), (12, 117, 148, 144)):
        for y in range(y0, y1):
            for x in range(x0, x1):
                fs[y][x] = face

    # SAVE, blank: the banner, and the three plaques without their words or
    # the cursor. The plaques are cut out separately so the game can place
    # them; the screen behind them keeps its own dark floor.
    plaque_rows = [(58, 73), (82, 97), (106, 121)]
    floor = sv[76][80]
    plaque = [row[32:129] for row in sv[plaque_rows[0][0]:plaque_rows[0][1]]]
    plaque = [r[:] for r in plaque]
    grain = lambda p, x, y: p[0] + p[1] + p[2] < 200
    row_fill(plaque, (6, 1, 95, 14), grain)
    for (a, b) in plaque_rows:
        for y in range(a, b):
            for x in range(30, 130):
                sv[y][x] = floor

    # INVENTORY, blank: white page and white strip, the block border kept.
    page = inv[40][80]
    for (x0, y0, x1, y1) in ((8, 24, 152, 112), (8, 124, 152, 136)):
        for y in range(y0, y1):
            for x in range(x0, x1):
                inv[y][x] = page
    return fs, sv, plaque, cursor, inv


load_cache = [None, None]


def main():
    load_cache[1] = load(TITLE, LOGO)
    title, prompt = title_screens()
    fs, sv, plaque, cursor, inv = fs_screens()
    screens = {
        'titleLogo': indexed(title),
        'titlePress': dict(indexed(prompt), y=112),
        'fileSelect': indexed(fs),
        'saveScreen': indexed(sv),
        'savePlaque': indexed(plaque),
        'seedCursor': indexed(cursor),
        'inventory': indexed(inv),
    }
    lines = [
        '// GENERATED by tools/rip-screens.py — do not edit by hand; edit the ripper',
        '// and re-run it. See its header for what is extracted and the three',
        '// things done by rule.',
        '//',
        '// Sources: assets/sheets/oracle-seasons-title-screen.gif, ripped by Tails585',
        '// via spriters-resource.com (credit requested); and still screens cut from',
        '// assets/footage/seasons-tas-rooster-adventure.mp4 by',
        '// tools/grab-footage-frames.py. The artwork is Nintendo\'s. Fan-work use only.',
        '//',
        '// Each screen is an indexed image: `pal` is its colours, and each character',
        '// of `rows` is an index into it (0-9, a-z, A-Z); `.` is transparent.',
        '',
        'export const SEASONS_SCREENS = {',
    ]
    for name, s in screens.items():
        lines.append('  %s: {' % name)
        lines.append('    w: %d, h: %d,%s' % (s['w'], s['h'], (' y: %d,' % s['y']) if 'y' in s else ''))
        lines.append('    pal: [%s],' % ', '.join("'%s'" % c for c in s['pal']))
        lines.append('    rows: [')
        for r in s['rows']:
            lines.append("      '%s'," % r)
        lines.append('    ],')
        lines.append('  },')
    lines.append('};')
    lines.append('')
    with open(OUT, 'w') as f:
        f.write('\n'.join(lines))
    print('emitted %d screens -> %s' % (len(screens), OUT))


if __name__ == '__main__':
    main()
