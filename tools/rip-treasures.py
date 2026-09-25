#!/usr/bin/env python3
"""Cut the treasures that lie in the world out of Oracle of Seasons' own graphics (S155).

Regenerate with:  python3 tools/rip-treasures.py

Source: assets/treasures/oracles-disasm/seasons/, copied verbatim from
Stewmath's oracles-disasm (github.com/Stewmath/oracles-disasm, commit 7584d87).
Credit: the oracles-disasm project and its contributors, who took the cartridge
apart; the artwork is Nintendo's and Capcom's. Fan-work use only.

WHY THIS AND NOT A SHEET. No sheet in assets/sheets/ carries the rupees,
hearts, Pieces of Heart, keys and dungeon map as they lie on the ground, so
they were hand-drawn to match the HUD icons — and the human saw the
difference (S155: "the item sprite seems to change to a hand drawn
alternative when Link is holding it up ... fix the sprites of other overworld
items like rupees, heart pieces etc that have Oracles equivalents to look the
same"). The cartridge has every one of them, and says exactly how to draw it:

  * A TREASURE lying in the world or held up is interaction $60, one subid per
    look (data/seasons/interactionData.s, interaction60SubidData): a graphics
    header (objectGfxHeaders.s -> which .png), a tile index into that .png, a
    palette (bits 4-6) and an animation (bits 0-3). The animation's first
    frame names an OAM layout (interactionAnimations.s ->
    interaction60OamDataPointers -> interactionOamData.s): how many 8x16
    hardware sprites, where, and which are mirrored — a Heart Container is one
    half-heart sprite drawn twice, the second flipped.
  * An enemy's DROP is part $01 (object_code/common/parts/itemDrop.s): its own
    table of tile offset and palette per drop, on the same graphics
    (partData.s b0 = $5c), laid out by partAnimations.s / partOamData.s.

Colours are the cartridge's standard sprite palettes (paletteData.s,
standardSpritePaletteData), RGB555 scaled to 8 bits the way the GBC does.

WHAT COMES OUT. src/data/sprites-treasures.js: one 16x16 sprite per name, the
hardware sprites placed in the cell exactly where the OAM layout puts them
around the object's centre, in art indices by brightness (0 light, 1 mid,
3 darkest) with one palette per sprite. Installed after the hand-drawn packs,
so these names are the only definitions left.
"""
import os
import re

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets', 'treasures', 'oracles-disasm', 'seasons')
OUT = os.path.join(ROOT, 'src', 'data', 'sprites-treasures.js')

# Our sprite name -> what it is on the cartridge.
#   ('treasure', subid of interaction $60, why)
#   ('drop', ITEM_DROP index, why)
WANT = [
    ('p_rupee', 'drop', 2, 'ITEM_DROP_1_RUPEE: the green one-rupee gem'),
    ('p_rupee5', 'drop', 3, 'ITEM_DROP_5_RUPEES: the red five'),
    ('p_rupee20', 'treasure', 0x2b, 'TREASURE_OBJECT_RUPEES_03, twenty rupees'),
    ('p_rupee100', 'treasure', 0x2c, 'TREASURE_OBJECT_RUPEES_05, a hundred rupees'),
    ('p_heart', 'drop', 1, 'ITEM_DROP_HEART: a recovery heart'),
    ('p_bomb', 'drop', 4, 'ITEM_DROP_BOMBS'),
    ('p_heartpiece', 'treasure', 0x3a, 'TREASURE_OBJECT_HEART_PIECE'),
    ('p_heartcontainer', 'treasure', 0x3b, 'TREASURE_OBJECT_HEART_CONTAINER'),
    ('p_key', 'treasure', 0x42, 'TREASURE_OBJECT_SMALL_KEY'),
    ('p_bosskey', 'treasure', 0x43, 'TREASURE_OBJECT_BOSS_KEY'),
    ('i_map', 'treasure', 0x40, 'TREASURE_OBJECT_MAP: the dungeon map'),
]

DROP_PART_GFX = 0x5c   # partData.s, part $01 (PART_ITEM_DROP), b0


def lines(name):
    with open(os.path.join(SRC, name)) as f:
        return f.read().split('\n')


def after(ls, label):
    """The lines after `label:` (and any labels stacked directly under it)."""
    i = next(k for k, l in enumerate(ls) if l.split(';')[0].strip() == label + ':')
    i += 1
    while i < len(ls) and re.match(r'^\w+:', ls[i]):
        i += 1
    return ls[i:]


def dbs(line):
    return [int(x, 16) for x in re.findall(r'\$(\w+)', line.split(';')[0])]


def dws(ls, label):
    """The .dw words from `label` on. They run ON past blank lines and the
    next table's labels, because the ROM does: the boss key's animation frame
    names OAM pointer 4 of interaction $60's four-entry table, which is the
    first entry of the table assembled right after it."""
    out = []
    for l in after(ls, label):
        m = re.match(r'\s*\.dw (\w+)', l)
        if m:
            out.append(m.group(1))
        elif l.strip() and not re.match(r'^\w+:', l):
            break
    return out


def gfx_file(index):
    for l in lines('objectGfxHeaders.s'):
        m = re.match(r'\s*/\* \$(\w+) \*/ m_ObjectGfxHeader (\w+)', l)
        if m and int(m.group(1), 16) == index:
            return m.group(2) + '.png'
    raise SystemExit(f'gfx header ${index:02x} not found')


def treasure(subid):
    """(gfx .png, tile, palette, oam entries) of interaction $60 `subid`."""
    ls = after(lines('interactionData.s'), 'interaction60SubidData')
    rows = [dbs(l) for l in ls if 'm_InteractionSubidData' in l]
    gfx, tile, b2 = rows[subid]
    anim = after(lines('interactionAnimations.s'), 'interaction60Animations')
    anims = []
    for l in anim:
        m = re.match(r'\s*\.dw (\w+)', l)
        if not m:
            break
        anims.append(m.group(1))
    frame = dbs(after(lines('interactionAnimations.s'), anims[b2 & 0x0f])[0])
    oams = dws(lines('interactionAnimations.s'), 'interaction60OamDataPointers')
    return gfx_file(gfx), tile, (b2 >> 4) & 7, oam(lines('interactionOamData.s'), oams[frame[1] // 2])


def drop(index):
    """(gfx .png, tile, palette, oam entries) of item drop `index`."""
    ls = lines('itemDrop.s')
    # The table of (tile offset, palette): the block documented as
    # "b0: Offset relative to oamTileIndexBase".
    k = next(i for i, l in enumerate(ls) if 'Offset relative to oamTileIndexBase' in l)
    rows = [dbs(l) for l in ls[k:] if re.match(r'\s*\.db \$', l)]
    tile, pal = rows[index]
    anims = dws(lines('partAnimations.s'), 'part01Animations')
    frame = dbs(after(lines('partAnimations.s'), anims[index])[0])
    oams = dws(lines('partAnimations.s'), 'part01OamDataPointers')
    return gfx_file(DROP_PART_GFX), tile, pal, oam(lines('partOamData.s'), oams[frame[1] // 2])


def oam(ls, label):
    body = after(ls, label)
    n = dbs(body[0])[0]
    return [dbs(body[1 + i]) for i in range(n)]


def palette(index):
    ls = lines('paletteData.s')
    start = ls.index('standardSpritePaletteData:') + 1
    cols = []
    for l in ls[start:]:
        m = re.search(r'm_RGB16 \$(\w+) \$(\w+) \$(\w+)', l)
        if m:
            cols.append(tuple(int(m.group(k), 16) for k in (1, 2, 3)))
        if len(cols) == (index + 1) * 4:
            return [tuple((c << 3) | (c >> 2) for c in rgb) for rgb in cols[index * 4:]]


def render(png, tile, pal, entries):
    im = Image.open(os.path.join(SRC, png))
    assert im.mode == 'P', f'{png} is not indexed'
    # A 16x24 canvas: the cell is the top 16 rows; the rest catches a layout
    # that sits lower, and is asserted empty below.
    grid = [[0] * 16 for _ in range(24)]
    used = set()
    for y, x, t, flags in entries:
        col = (tile + t) // 2
        top, left = y - 8, x
        for yy in range(16):
            for xx in range(8):
                sx = 7 - xx if flags & 0x20 else xx
                sy = 15 - yy if flags & 0x40 else yy
                v = im.getpixel((col * 8 + sx, sy))
                if v:
                    grid[top + yy][left + xx] = v
                    used.add(v)
    # A drop sits a few pixels low in its cell (partOamData y $0b); the art is
    # never taller than the cell, so lift it back in when it overhangs.
    low = max((r for r in range(24) if any(grid[r])), default=0)
    if low >= 16:
        shift = low - 15
        assert not any(grid[r] for r in range(shift)), 'sprite taller than its cell'
        grid = grid[shift:] + [[0] * 16 for _ in range(shift)]
    cols = palette(pal)
    lum = {v: 3 * cols[v][0] + 6 * cols[v][1] + cols[v][2] for v in used}
    order = sorted(used, key=lambda v: -lum[v])       # lightest first
    digit = {}
    if len(order) == 3:
        digit = {order[0]: '0', order[1]: '1', order[2]: '3'}
    elif len(order) == 2:
        digit = {order[0]: '0', order[1]: '3'}
    else:
        digit = {order[0]: '3'}
    inks = {d: '#%02x%02x%02x' % cols[v] for v, d in digit.items()}
    ramp = [inks.get('0', inks.get('1', '#000000')), inks.get('1', inks.get('0', '#000000')),
            inks.get('1', inks.get('0', '#000000')), inks['3']]
    rows = [''.join(digit[v] if v else '.' for v in grid[r]) for r in range(16)]
    return rows, ramp


def build():
    art, pals, notes = {}, {}, []
    for name, kind, index, why in WANT:
        png, tile, pal, entries = treasure(index) if kind == 'treasure' else drop(index)
        rows, ramp = render(png, tile, pal, entries)
        assert any(c != '.' for r in rows for c in r), f'{name}: empty sprite'
        art[name] = rows
        pals[name] = ramp
        notes.append(f'//   {name}: {why} — {png} tile ${tile:02x}, palette {pal}, '
                     f'{len(entries)} hardware sprite{"s" if len(entries) > 1 else ""}')
    return art, pals, notes


HEADER = '''// The treasures that lie in the world, cut from Oracle of Seasons' own graphics.
//
// Generated by tools/rip-treasures.py — edit that, not this file.
// Source: Stewmath's oracles-disasm (github.com/Stewmath/oracles-disasm,
// commit 7584d87), assets/treasures/oracles-disasm/seasons/: the item and
// quest-item sprite graphics, the tables that say which tile, palette and
// layout each treasure and each enemy drop is drawn with, and the standard
// sprite palettes. Credit: the oracles-disasm project and its contributors;
// the artwork is Nintendo's and Capcom's. This is fan-work art only.
//
// Each sprite carries its own colours: draw sites must NOT pass a palette.
//'''


def emit(art, pals, notes):
    out = HEADER.split('\n') + ['// Built from:'] + notes + [
        '', "import { sprites } from '../gfx/art.js';",
        "import { registerPalettes } from '../gfx/palettes.js';", '',
        'export const TREASURE_ART = {']
    for name in art:
        out.append('  // extracted — pulled straight off the source graphics named '
                   'in this file\'s own header, by this ripper.')
        out.append(f"  {name}: {{ pal: '{name}', art: `")
        for r in art[name]:
            out.append('    ' + r)
        out[-1] += '` },'
    out.append('};')
    out.append('')
    out.append('const TREASURE_PALETTES = {')
    for name in pals:
        out.append(f"  {name}: [{', '.join(repr(c) for c in pals[name])}],")
    out.append('};')
    out += ['', 'export function installTreasureSprites() {',
            '  registerPalettes(TREASURE_PALETTES);',
            "  sprites.add(TREASURE_ART, 'ui');", '}', '']
    with open(OUT, 'w') as f:
        f.write('\n'.join(out))


if __name__ == '__main__':
    a, p, n = build()
    emit(a, p, n)
    print('rip-treasures: wrote', len(a), 'sprites ->', os.path.relpath(OUT, ROOT))
