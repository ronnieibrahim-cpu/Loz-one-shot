#!/usr/bin/env python3
"""Cut Seasons' two map screens out of the cartridge (S177).

Regenerate with:  python3 tools/rip-map.py

Source: assets/map/oracles-disasm/{seasons,ages}/, copied verbatim from
Stewmath's oracles-disasm (github.com/Stewmath/oracles-disasm, commit 21c924a).
Credit: the oracles-disasm project and its contributors, who took the
cartridges apart; the artwork is Nintendo's and Capcom's. Fan-work use only.

THE OVERWORLD MAP (code/bank2.s runMapMenu, mapMenu_state0, GFXH_OVERWORLD_MAP,
PALH_07). Seasons' map is one 8x8 tile per screen of Holodrum, every one of
them a hand-drawn picture of that screen, so the grid itself is not ripped:
Thalassia is not Holodrum, and the game draws each of its own screens into a
square at run time (src/game/menu.js). What is ripped is everything around
and over the grid:

  * `mapSky`: the top row of Seasons' map (row 0 of map_holodrum_minimap),
    the sky and its clouds.
  * `mapSea`: the open sea of Ages' present map (map_present_minimap, row 16
    column 19, in Ages' PALH_07): white flecks on blue. Seasons' Holodrum
    map is framed by land on three sides; Thalassia is islands, so the
    frame is the sea Ages draws Labrynna's coast into (the human, S177).
  * `mapUnseen`: the square a screen not yet visited is covered with
    (mapMenu_clearUnvisitedTiles: tile $04, attribute $0a).
  * `mapCursor`: the cursor (mapMenu_drawCursor: two 8x16 sprites of tile
    $88, palette 6, the right one flipped), 16x16 round a screen's square.
  * `mapArrow`: the arrow over Link's own screen (mapMenu_drawArrow: tile
    $0e, palette 7, flipped upside down), 8x16.
  * `mapPopup1`-`mapPopup4`: the popup that opens in a corner over a screen
    with a door in it, at each of its four sizes (mapIconBorderOamTable), and
    `mapIconHouse`, `mapIconMaku`, `mapIconCave`, `mapIconShop`, what it
    shows (mapIconOamTable 01, 04, 08, 0E).
  * `MAP_INK`: the colours a square is drawn in, read from paletteData4098
    (PALH_07's background palettes) — grass, sand, sea, earth, dark earth,
    coral and the black of the grid — so nothing on the grid is a colour the
    cartridge's map does not have.

THE DUNGEON MAP (mapMenu_state0 @dungeon, GFXH_DUNGEON_MAP, PALH_09; BG
palette 0 is the common one every tileset loads, PALH_0f). Everything here is
the cartridge's own, built the way dungeonMap_generateScrollableTilemap,
dungeonMap_drawFloorList and mapMenu_drawSprites build it:

  * `dmapFrame`: map_dungeon_minimap, 160x144, with the dungeon's name box
    (rows 0-4, columns 0-7: the blurb, tiles $c0-$e7) left out — it is drawn per dungeon.
  * `dmapRoom0`-`dmapRoom15`: a visited room, tile $b0 plus its exits (bit 0
    up, 1 right, 2 down, 3 left), palette 5; `dmapUnseen` ($af, palette 4),
    a room the Map shows but nobody has walked into.
  * `dmapDigits` ($90-$99), `dmapB` ($9b), `dmapF` ($9c), `dmapX` ($9a): the
    floor list's letters (palette 2) and, `dmapKeyDigits`, the small key
    count's (palette 3, the map's own attribute at w4TileMap+$226).
  * `dmapFloorBox` ($aa $ab, palette 4): the floor's little box.
  * Sprites (standardSpritePaletteData): `dmapLink` ($80, palette 0),
    `dmapBoss` ($82, 5), `dmapFloorCursor` ($84, 4), `dmapArrowUp` and
    `dmapArrowDown` ($86, 5), `dmapCursor` ($88, 4, two halves), and from
    spr_map_compass_keys `dmapMapItem` ($00 $02, 3), `dmapCompass` ($04 $06,
    1), `dmapBossKey` ($08 $0a, 5), `dmapKey` ($0c, 5).

THE NAME BOX (the "blurb", gfx_blurb_*): 64x40, eight tiles by five, in
palette 3. Seasons draws each dungeon's name into its box by hand. This game's
dungeons have their own names, so the box and its lettering are taken apart:

  * `blurbBox`: the Hero's Cave box with its words wiped (the paper inside
    the frame and its four corner ornaments).
  * `blurbLevel1`-`blurbLevel8`: the "L - n" line off Seasons' D1-D8 boxes.
  * `bl_<code>`: one letter each, cut from the boxes of both cartridges (see
    LINES), the commonest cut of each letter where boxes differ by a pixel,
    with `ay` the rows above its baseline. T is cut from Ages' "Turret",
    where it is kerned over the u: the u is taken off it. K and V are on no
    box anywhere and are drawn to match (src/data/sprites-map-drawn.js).
  * `BLURB_LAYOUT`: where the lines stand, measured off the boxes: with the
    level line two lines start at row 15 (Snake's Remains) and three at row
    11, nine apart (Gnarled Root Dungeon); without it, two at 13, eleven
    apart (Hero's Cave). The widest line is centred, the others start where
    it starts; letters stand one column apart, T lets a small letter in
    under its bar (`T_KERN`).
"""
import json
import os
import re
from collections import Counter

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets', 'map', 'oracles-disasm', 'seasons')
AGES = os.path.join(ROOT, 'assets', 'map', 'oracles-disasm', 'ages')
OUT = os.path.join(ROOT, 'src', 'data', 'screens-map.js')
KEYS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'


def text(name, src=SRC):
    with open(os.path.join(src, name)) as f:
        return f.read()


def rgb555(label, count, src=SRC):
    t = text('paletteData.s', src)
    i = t.index(label + ':')
    cols = []
    for m in re.finditer(r'm_RGB16 \$(\w+) \$(\w+) \$(\w+)', t[i:]):
        cols.append(tuple((int(v, 16) << 3) | (int(v, 16) >> 2) for v in m.groups()))
        if len(cols) == count * 4:
            break
    return [cols[k * 4:k * 4 + 4] for k in range(count)]


def palettes(header, kind, src=SRC, out=None):
    body = re.search(r'm_PaletteHeaderStart \$\w+, ' + header + r'\n(.*?)m_PaletteHeaderEnd',
                     text('paletteHeaders.s', src), re.S).group(1)
    out = out if out is not None else [None] * 8
    for start, n, label in re.findall(r'm_PaletteHeader' + kind + r'\s+(\d+), (\d+), (\w+)', body):
        for k, p in enumerate(rgb555(label, int(n), src)):
            out[int(start) + k] = p
    return out


def png_tiles(name, src=SRC):
    """A file's 8x8 tiles in the cartridge's order. A sprite file ("spr_") is
    stored as 8x16 columns (tools/gfx/gfx.py in the disasm): top, then bottom."""
    im = Image.open(os.path.join(src, name + '.png'))
    assert im.mode == 'P', f'{name} is not indexed'
    w, h = im.size
    cell = 16 if name.startswith('spr_') else 8
    out = []
    for ty in range(h // cell):
        for tx in range(w // 8):
            for half in range(cell // 8):
                out.append([[im.getpixel((tx * 8 + x, ty * cell + half * 8 + y)) for x in range(8)]
                            for y in range(8)])
    return out


def vram(files, src=SRC):
    """{(bank, tile number from $8000)} for a list of (file, destination) —
    the destination's low bit is the VRAM bank, as in m_GfxHeader."""
    v = {}
    for name, at in files:
        for t, tile in enumerate(png_tiles(name, src)):
            v[(at & 1, ((at & ~0xf) - 0x8000) // 16 + t)] = tile
    return v


def bg_tile(v, t, at):
    """A background tile through LCDC's $8800 addressing (gfxRegisterStates
    $07: the map screens), attribute bit 3 the bank."""
    return v[((at >> 3) & 1, 0x100 + t if t < 0x80 else t)]


def blank(w, h):
    return [[None] * w for _ in range(h)]


def put(img, tile, pal, px, py, at=0, zero=True):
    for y in range(8):
        for x in range(8):
            sx = 7 - x if at & 0x20 else x
            sy = 7 - y if at & 0x40 else y
            c = tile[sy][sx]
            if c or zero:
                img[py + y][px + x] = pal[c]


def sprite(v, t, pal, at=0):
    """One 8x16 sprite: tiles t&~1 and t|1, colour 0 clear, flipped as the
    attribute says (a vertical flip swaps the halves as well)."""
    img = blank(8, 16)
    top, bot = v[(0, t & ~1)], v[(0, t | 1)]
    if at & 0x40:
        top, bot = bot, top
    put(img, top, pal, 0, 0, at, zero=False)
    put(img, bot, pal, 0, 8, at, zero=False)
    return img


def beside(*imgs):
    h = imgs[0].__len__()
    return [sum((im[y] for im in imgs), []) for y in range(h)]


def indexed(img, **extra):
    pal, rows = [], []
    for row in img:
        line = ''
        for p in row:
            if p is None:
                line += '.'
                continue
            if p not in pal:
                pal.append(p)
                assert len(pal) <= len(KEYS), 'more colours than keys'
            line += KEYS[pal.index(p)]
        rows.append(line)
    out = {'w': len(img[0]), 'h': len(img), 'pal': ['#%02x%02x%02x' % c for c in pal], 'rows': rows}
    out.update(extra)
    return out


def hexc(c):
    return '#%02x%02x%02x' % c


# ------------------------------------------------------------- the overworld

# bank2.s mapIconBorderOamTable @entry1-4: (y, x, tile, attribute) per sprite,
# relative to the popup's position.
POPUP_BORDER = (
    ((0x08, 0x04, 0x00, 0x06),),
    ((0x08, 0x00, 0x02, 0x06), (0x08, 0x08, 0x02, 0x26)),
    tuple((y, x, t, a) for y, a0 in ((0x00, 0x06), (0x10, 0x46))
          for x, t, a in ((0xf8, 0x04, a0), (0x00, 0x06, a0), (0x08, 0x06, a0 | 0x20), (0x10, 0x04, a0 | 0x20))),
    tuple((y, x, t, a) for y, a0 in ((0x00, 0x06), (0x10, 0x46))
          for x, t, a in ((0xf8, 0x08, a0), (0x00, 0x0a, a0), (0x08, 0x0a, a0 | 0x20), (0x10, 0x08, a0 | 0x20))),
)
# mapIconOamTable, Seasons' half: the pictures this game's screens use.
POPUP_ICONS = {
    'mapIconHouse': ((0x08, 0x00, 0x22, 0x05), (0x08, 0x08, 0x22, 0x25)),   # @mapIcon01
    'mapIconMaku': ((0x08, 0x00, 0x28, 0x03), (0x08, 0x08, 0x2a, 0x03)),    # @mapIcon04
    'mapIconCave': ((0x08, 0x00, 0x20, 0x03), (0x08, 0x08, 0x20, 0x23)),    # @mapIcon08
    'mapIconShop': ((0x08, 0x00, 0x54, 0x06), (0x08, 0x08, 0x56, 0x06)),    # @mapIcon0E
}


def oam_image(v, spr, oam):
    """8x16 sprites at (y, x) offsets, the first listed drawn on top, as one
    picture whose `ax`/`ay` is the offsets' origin."""
    def sx(x):
        return x - 0x100 if x >= 0x80 else x
    x0 = min(sx(x) for _, x, _, _ in oam)
    y0 = min(y for y, _, _, _ in oam)
    w = max(sx(x) for _, x, _, _ in oam) + 8 - x0
    h = max(y for y, _, _, _ in oam) + 16 - y0
    img = blank(w, h)
    for y, x, t, a in reversed(oam):
        one = sprite(v, t, spr[a & 7], a)
        for yy in range(16):
            for xx in range(8):
                if one[yy][xx] is not None:
                    img[y - y0 + yy][sx(x) - x0 + xx] = one[yy][xx]
    return indexed(img, ax=-x0, ay=-y0)

def overworld(out):
    v = vram((('gfx_minimap_tiles_holodrum_1', 0x8801), ('gfx_minimap_tiles_holodrum_2', 0x9001),
              ('spr_minimap_icons', 0x8000), ('gfx_minimap_tiles_dungeon', 0x8800)))
    bg = palettes('PALH_07', 'Bg')
    spr = palettes('PALH_07', 'Spr')
    tmap = open(os.path.join(SRC, 'map_holodrum_minimap.bin'), 'rb').read()
    amap = open(os.path.join(SRC, 'flg_holodrum_minimap.bin'), 'rb').read()
    sky = blank(160, 8)
    for c in range(20):
        put(sky, bg_tile(v, tmap[c], amap[c]), bg[amap[c] & 7], c * 8, 0, amap[c])
    out['mapSky'] = indexed(sky)
    unseen = blank(8, 8)
    put(unseen, bg_tile(v, 0x04, 0x0a), bg[0x0a & 7], 0, 0, 0x0a)
    out['mapUnseen'] = indexed(unseen)
    out['mapCursor'] = indexed(beside(sprite(v, 0x88, spr[6]), sprite(v, 0x88, spr[6], 0x20)))
    out['mapArrow'] = indexed(sprite(v, 0x0e, spr[7], 0x40))
    # The popup's frame as it grows (mapIconBorderOamTable entries 1-4), and
    # the four pictures it can hold (mapIconOamTable), each laid out from its
    # OAM list with `ax`/`ay` the popup's own position in it.
    for n, oam in enumerate(POPUP_BORDER, 1):
        out[f'mapPopup{n}'] = oam_image(v, spr, oam)
    for name, oam in POPUP_ICONS.items():
        out[name] = oam_image(v, spr, oam)

    av = vram((('gfx_minimap_tiles_present_1', 0x8801), ('gfx_minimap_tiles_common', 0x9001),
               ('gfx_minimap_tiles_present_2', 0x9601)), AGES)
    abg = palettes('PALH_07', 'Bg', AGES)
    atm = open(os.path.join(AGES, 'map_present_minimap.bin'), 'rb').read()
    aam = open(os.path.join(AGES, 'flg_present_minimap.bin'), 'rb').read()
    at = 16 * 32 + 19
    sea = blank(8, 8)
    put(sea, bg_tile(av, atm[at], aam[at]), abg[aam[at] & 7], 0, 0, aam[at])
    out['mapSea'] = indexed(sea)

    # paletteData4098 (PALH_07's eight background palettes), by what the
    # Holodrum squares use each colour for.
    ink = {
        'grid': bg[0][3],
        'grass': bg[4][2], 'sand': bg[2][0], 'sea': bg[4][1], 'foam': bg[4][0],
        'earth': bg[3][1], 'dark': bg[3][2],
        'coral': bg[1][1], 'coralDark': bg[1][2],
    }
    return {k: hexc(c) for k, c in ink.items()}


# --------------------------------------------------------------- the dungeon

DUNGEON_TILES = (('spr_map_compass_keys', 0x8000), ('gfx_minimap_tiles_dungeon', 0x8800))


def dungeon(out):
    v = vram(DUNGEON_TILES)
    # BG palette 0 is the one every tileset loads (PALH_0f); 2-5 are
    # PALH_09's. 1, 6 and 7 are not read by anything on this screen.
    bg = palettes('PALH_0f', 'Bg')
    palettes('PALH_09', 'Bg', out=bg)
    spr = palettes('PALH_09', 'Spr')
    tmap = open(os.path.join(SRC, 'map_dungeon_minimap.bin'), 'rb').read()
    amap = open(os.path.join(SRC, 'flg_dungeon_minimap.bin'), 'rb').read()
    frame = blank(160, 144)
    for r in range(18):
        for c in range(20):
            t, a = tmap[r * 32 + c], amap[r * 32 + c]
            if r < 5 and c < 8:
                continue                       # the name box, drawn per dungeon
            put(frame, bg_tile(v, t, a), bg[a & 7], c * 8, r * 8, a)
    out['dmapFrame'] = indexed(frame)

    def tile(t, p):
        img = blank(8, 8)
        put(img, bg_tile(v, t, p), bg[p], 0, 0)
        return img
    for bits in range(16):
        out[f'dmapRoom{bits}'] = indexed(tile(0xb0 + bits, 5))
    out['dmapUnseen'] = indexed(tile(0xaf, 4))
    out['dmapDigits'] = indexed(beside(*[tile(0x90 + d, 2) for d in range(10)]))
    out['dmapKeyDigits'] = indexed(beside(*[tile(0x90 + d, 3) for d in range(10)]))
    out['dmapB'] = indexed(tile(0x9b, 2))
    out['dmapF'] = indexed(tile(0x9c, 2))
    out['dmapX'] = indexed(tile(0x9a, 3))
    out['dmapFloorBox'] = indexed(beside(tile(0xaa, 4), tile(0xab, 4)))

    out['dmapLink'] = indexed(sprite(v, 0x80, spr[0]))
    out['dmapBoss'] = indexed(sprite(v, 0x82, spr[5]))
    out['dmapFloorCursor'] = indexed(sprite(v, 0x84, spr[4]))
    out['dmapArrowUp'] = indexed(sprite(v, 0x86, spr[5]))
    out['dmapArrowDown'] = indexed(sprite(v, 0x86, spr[5], 0x40))
    out['dmapCursor'] = indexed(beside(sprite(v, 0x88, spr[4]), sprite(v, 0x88, spr[4], 0x20)))
    out['dmapMapItem'] = indexed(beside(sprite(v, 0x00, spr[3]), sprite(v, 0x02, spr[3])))
    out['dmapCompass'] = indexed(beside(sprite(v, 0x04, spr[1]), sprite(v, 0x06, spr[1])))
    out['dmapBossKey'] = indexed(beside(sprite(v, 0x08, spr[5]), sprite(v, 0x0a, spr[5])))
    out['dmapKey'] = indexed(sprite(v, 0x0c, spr[5]))
    return bg[0]


# ---------------------------------------------------------------- name boxes

# Each box's lines as they are written on it. A line whose letters cannot be
# told apart by a blank column (Ages' "Spirit's", "Grave", "Tower", Seasons'
# "Poison") is not listed; nothing below needs one. A line may instead be
# given as the runs of ink it cuts into, and a run of two letters that touch
# ("To" in "Tomb") is passed over: the b after it is the only lowercase b.
LINES = (
    (AGES, 'gfx_blurb_blacktowerturret', ('Black', None, None)),
    (AGES, 'gfx_blurb_d2', ('Wing', 'Dungeon')),
    (AGES, 'gfx_blurb_d3', ('Moonlit', 'Grotto')),
    (AGES, 'gfx_blurb_d4', ('Skull', 'Dungeon')),
    (AGES, 'gfx_blurb_d5', ('Crown', 'Dungeon')),
    (AGES, 'gfx_blurb_d6', ("Mermaid's", 'Cave')),
    (AGES, 'gfx_blurb_d8', ('Ancient', ('To', 'm', 'b'))),
    (AGES, 'gfx_blurb_makupath', (None, 'Path')),
    (SRC, 'gfx_blurb_roomofrites', ('Room of', 'Rites')),
    (SRC, 'gfx_blurb_d1', ('Gnarled', 'Root', 'Dungeon')),
    (SRC, 'gfx_blurb_d2', ("Snake's", 'Remains')),
    (SRC, 'gfx_blurb_d3', (None, "Moth's", 'Lair')),
    (SRC, 'gfx_blurb_d5', ("Unicorn's", 'Cave')),
    (SRC, 'gfx_blurb_d6', ('Ancient', 'Ruins')),
    (SRC, 'gfx_blurb_d7', ("Explorer's", 'Crypt')),
    (SRC, 'gfx_blurb_d8', ('Sword &', 'Shield', 'Dungeon')),
    (SRC, 'gfx_blurb_heroscave', ("Hero's", 'Cave')),
)
TEXT_X = (7, 57)          # inside the corner ornaments
TEXT_Y = (9, 38)          # below the level line
TEXT_Y_PLAIN = (2, 38)    # a box with no level line, whose ornaments
TEXT_X_PLAIN = (9, 55)    # reach in further than its words ever do


def blurb(name, src):
    """The box as the screen shows it: the file's left half is the box's top
    three rows (tiles $c0-$c7, $d0-$d7, $e0-$e7), its right half the bottom
    two ($c8-$cf, $d8-$df)."""
    im = Image.open(os.path.join(src, name + '.png'))
    return [[im.getpixel((x, y)) if y < 24 else im.getpixel((64 + x, y - 24)) for x in range(64)]
            for y in range(40)]


def bands(b, ys=TEXT_Y):
    rows = [y for y in range(*ys) if any(b[y][x] == 3 for x in range(*TEXT_X))]
    out = []
    for y in rows:
        if out and y == out[-1][1] + 1:
            out[-1][1] = y
        else:
            out.append([y, y])
    return out


def runs(b, y0, y1, xs=TEXT_X):
    out, x = [], xs[0]
    while x < xs[1]:
        if any(b[y][x] for y in range(y0, y1 + 1)):
            s = x
            while x < xs[1] and any(b[y][x] for y in range(y0, y1 + 1)):
                x += 1
            out.append((s, x))
        else:
            x += 1
    return out


def trimmed(b, y0, y1, s, e, base):
    rows = [tuple(b[y][x] for x in range(s, e)) for y in range(y0, y1 + 1)]
    top = y0
    while rows and not any(rows[0]):
        rows, top = rows[1:], top + 1
    while rows and not any(rows[-1]):
        rows = rows[:-1]
    return (base - top, tuple(rows))


def baseline(b, y0, y1):
    """The line's baseline: the bottom of its first letter, a capital."""
    x = min(x for x in range(*TEXT_X) if any(b[y][x] == 3 for y in range(y0, y1 + 1)))
    e = x
    while e + 1 < TEXT_X[1] and any(b[y][e + 1] for y in range(y0, y1 + 1)):
        e += 1
    return max(y for y in range(y0, y1 + 1) if any(b[y][xx] == 3 for xx in range(x, e + 1)))


def letters():
    cuts = {}
    for src, name, lines in LINES:
        b = blurb(name, src)
        level = re.match(r'gfx_blurb_d\d', name)
        bs = bands(b, TEXT_Y if level else TEXT_Y_PLAIN)
        xs = TEXT_X if level else TEXT_X_PLAIN
        assert len(bs) == len(lines), f'{name}: {len(bs)} lines of ink, {len(lines)} listed'
        for (y0, y1), line in zip(bs, lines):
            if line is None:
                continue
            base = baseline(b, y0, y1)
            rs = runs(b, y0, y1, xs)
            chars = list(line.replace(' ', '')) if isinstance(line, str) else list(line)
            assert len(rs) == len(chars), f'{name} {line!r}: {len(rs)} letters cut'
            for ch, (s, e) in zip(chars, rs):
                if len(ch) == 1:
                    cuts.setdefault(ch, []).append(trimmed(b, y0, y1, s, e, base))
    best = {ch: Counter(v).most_common(1)[0][0] for ch, v in cuts.items()}
    # T, off Ages' "Turret": kerned over the u, so the u is taken off it.
    b = blurb('gfx_blurb_blacktowerturret', AGES)
    y0, y1 = bands(b, TEXT_Y_PLAIN)[2]
    base = baseline(b, y0, y1)
    s, e = runs(b, y0, y1, TEXT_X_PLAIN)[0]
    up, urows = best['u']
    us = e - len(urows[0])
    for dy, row in enumerate(urows):
        for dx, c in enumerate(row):
            y = base - up + dy
            if c:
                assert b[y][us + dx] == c, 'the u of "Tu" is not the u'
                b[y][us + dx] = 0
    t = trimmed(b, y0, y1, s, e, base)
    t_kern = us - s
    while not any(r[-1] for r in t[1]):
        t = (t[0], tuple(r[:-1] for r in t[1]))
    best['T'] = t
    return best, t_kern


def level_lines(pal):
    out = {}
    for n in range(1, 9):
        b = blurb(f'gfx_blurb_d{n}', SRC)
        img = blank(40, 6)
        for y in range(6):
            for x in range(40):
                c = b[2 + y][12 + x]
                img[y][x] = pal[c] if c else None
        out[f'blurbLevel{n}'] = indexed(img, ax=12, ay=2)
    return out


def box(pal):
    b = blurb('gfx_blurb_heroscave', SRC)
    for y in range(40):
        for x in range(64):
            inside = (9 <= x <= 54 and 2 <= y <= 37) or (2 <= x <= 61 and 10 <= y <= 34)
            if inside:
                b[y][x] = 0
    return indexed([[pal[c] for c in row] for row in b])


def blurbs(out, pal):
    out['blurbBox'] = box(pal)
    out.update(level_lines(pal))
    best, t_kern = letters()
    for ch in sorted(best):
        up, rows = best[ch]
        img = [[pal[c] if c else None for c in row] for row in rows]
        out['bl_%d' % ord(ch)] = indexed(img, ay=up)
    return ''.join(sorted(best)), t_kern


def emit(screens, ink, chars, t_kern, black):
    lines = [
        '// GENERATED by tools/rip-map.py — do not edit by hand. Re-run the ripper.',
        "// Source: assets/map/oracles-disasm/, from Stewmath's oracles-disasm",
        '// (github.com/Stewmath/oracles-disasm, commit 21c924a). Credit: the',
        "// oracles-disasm project and its contributors; the artwork is Nintendo's",
        "// and Capcom's. Fan-work use only.",
        '//',
        "// Seasons' overworld and dungeon map screens: the frame round the grid,",
        "// the cursor and Link's arrow, the dungeon map's frame, rooms, floor list",
        "// and sprites, and the dungeon name box with letters cut off both",
        "// cartridges' boxes. tools/rip-map.py's header says what each one is.",
        '',
        '// The colours a screen\'s square on the overworld map is drawn in (PALH_07).',
        'export const MAP_INK = { ' + ', '.join(f"{k}: '{c}'" for k, c in ink.items()) + ' };',
        '',
        '// The dungeon map\'s background (tile $ad in PALH_0f\'s palette 0).',
        f"export const DMAP_BLACK = '{hexc(black[3])}';",
        '',
        '// The name box: letters cut (`bl_<char code>`), where its lines stand, and',
        '// how far a small letter tucks in under a T (Ages\' "Turret").',
        'export const BLURB_CHARS = ' + json.dumps(chars) + ';',
        'export const BLURB_LAYOUT = {',
        '  level: { 2: { top: 15, pitch: 11 }, 3: { top: 11, pitch: 9 } },',
        '  plain: { 1: { top: 18, pitch: 0 }, 2: { top: 13, pitch: 11 }, 3: { top: 7, pitch: 10 } },',
        '  cap: 6, gap: 1, space: 4, maxWidth: 50,',
        f'  tKern: {t_kern},',
        '};',
        '',
        'export const MAP_SCREENS = {',
    ]
    for name, s in screens.items():
        extra = ''.join(f', {k}: {s[k]}' for k in ('ax', 'ay') if k in s)
        lines.append(f'  {name}: {{ w: {s["w"]}, h: {s["h"]}{extra},')
        lines.append('    pal: [' + ', '.join(f"'{c}'" for c in s['pal']) + '],')
        lines.append('    rows: [')
        for r in s['rows']:
            lines.append(f"      '{r}',")
        lines.append('    ] },')
    lines.append('};')
    lines.append('')
    with open(OUT, 'w') as f:
        f.write('\n'.join(lines))


def build():
    out = {}
    ink = overworld(out)
    black = dungeon(out)
    pal3 = palettes('PALH_09', 'Bg')[3]
    chars, t_kern = blurbs(out, pal3)
    return out, ink, chars, t_kern, black


if __name__ == '__main__':
    s, ink, chars, t_kern, black = build()
    emit(s, ink, chars, t_kern, black)
    print(f'wrote {OUT}: {len(s)} pictures, letters {chars}, T kern {t_kern}')
