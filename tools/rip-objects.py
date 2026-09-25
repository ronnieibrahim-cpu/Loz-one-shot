#!/usr/bin/env python3
"""Cut the chests, sign, torches, push blocks and floor buttons out of Oracle
of Seasons' own room graphics, and write src/data/sprites-objects.js.

  python3 tools/rip-objects.py           # rewrite sprites-objects.js
  python3 tools/rip-objects.py --sheet   # also write a contact sheet to /tmp

WHY THIS EXISTS
---------------
Until S156 the chest, the sign, the push block, the floor switch and the torch
were drawn by hand, in four greys and a named palette. In Seasons every one of
them is a BACKGROUND TILE — a 16x16 "metatile" of the room's own tileset, drawn
in the room's own colours — so no sprite sheet has them loose, and the ones on
the rendered map sheets are welded to the floor they stand on. The cartridge's
data has them whole, so this reads it the way the Game Boy does:

  tilesets.s          which graphics, palettes, layout and animation group a
                      tileset uses (8 bytes a tileset)
  gfxHeaders.s        which graphics file lands at which VRAM address and bank
  tilesetMappingsXX   the layout: 256 metatiles x 8 bytes — four 8x8 tile
                      indices (TL, TR, BL, BR), then four attribute bytes
                      (bits 0-2 palette, bit 3 VRAM bank, bit 5 x-flip,
                      bit 6 y-flip). Tile indices are the GBC's $8800
                      addressing: $00-$7f at $9000, $80-$ff at $8800.
  paletteHeaders.s    which palette data fills BG palettes 2-7 for a tileset;
  paletteData.s       BG palettes 0-1 are PALH_0f's, loaded for every room
  animationGroups.s   a lit torch's flame: the tileset's animation group names
  animationData.s     animation data, whose frames name gfx headers in
  animationGfxHeaders.s  that copy tiles from gfx_animations_3 over VRAM

The metatile numbers are the disassembly's own names for them
(constants/common/tileIndices.s): TILEINDEX_CHEST $f1, TILEINDEX_CHEST_OPENED
$f0, TILEINDEX_SIGN $f2, TILEINDEX_UNLIT_TORCH $08, TILEINDEX_LIT_TORCH $09,
TILEINDEX_BUTTON $0c, TILEINDEX_PRESSED_BUTTON $0d, TILEINDEX_PUSHABLE_BLOCK $1d.

WHICH SEASONS DUNGEON EACH OF OURS IS
-------------------------------------
Each of our dungeons already wears one Seasons dungeon's walls and floor
(tools/rip-dungeon-themes.py), so its push block and its floor button come
from THAT dungeon's tileset, in that dungeon's colours — the block in the
Bogwater Sanctum is the Poison Moth's Lair's purple one, not a grey stand-in.
Chests and torches are drawn in BG palette 0, which is the same in every room
of the game, so there is one of each.

WHAT IS KEYED OUT
-----------------
A metatile is opaque; an entity here is drawn over the floor the room already
has. A button's floor and a sign's grass are therefore made transparent by a
flood from the tile's edge over the colour most of its corners have — the
colour the source painted as "the ground here". Nothing else is changed: chests and
push blocks fill their cell edge to edge on the cartridge and do so here, and
the four dark corner pixels of a torch are the cartridge's too.

Seasons has one chest. The "big chest" names draw the same chest, as every
treasure in Seasons comes out of the same box.

Source: Stewmath's oracles-disasm, copied verbatim into
assets/objects/oracles-disasm/seasons/ (README there). The artwork is
Nintendo's and Capcom's.
"""

import os
import re
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets', 'objects', 'oracles-disasm', 'seasons')
OUT = os.path.join(ROOT, 'src', 'data', 'sprites-objects.js')

CHEST, CHEST_OPENED, SIGN = 0xf1, 0xf0, 0xf2
UNLIT_TORCH, LIT_TORCH = 0x08, 0x09
BUTTON, PRESSED_BUTTON, PUSHABLE_BLOCK = 0x0c, 0x0d, 0x1d

# Seasons tileset index -> what it is. The dungeon ones are the ones our
# dungeons are themed on (see the legend comments in tiles-core.js).
TILESETS = {
    0x00: 'the overworld in spring (Horon Village)',
    0x41: "the Sword & Shield Maze, ice half",
    0x3e: "the Explorer's Crypt",
    0x39: "the Poison Moth's Lair",
    0x3a: 'the Dancing Dragon Dungeon',
    0x3c: 'the Ancient Ruins',
    0x42: "the Sword & Shield Maze, fire half",
}

# Our dungeon legend -> (sprite suffix, Seasons tileset).
THEMES = [
    ('dungeonGrotto', 'grotto', 0x41),
    ('dungeonCoral', 'coral', 0x3e),
    ('dungeonBog', 'bog', 0x39),
    ('dungeonCistern', 'cistern', 0x3a),
    ('dungeonWood', 'wood', 0x3c),
    ('dungeonAbyss', 'abyss', 0x42),
]
# A block or button outside those six dungeons draws the Grotto's.
DEFAULT_THEME = 'grotto'


def text(name):
    with open(os.path.join(SRC, name)) as f:
        return f.read()


def rgb(line):
    m = re.search(r'm_RGB16 \$(\w+) \$(\w+) \$(\w+)', line)
    return tuple((int(m.group(k), 16) << 3) | (int(m.group(k), 16) >> 2) for k in (1, 2, 3)) if m else None


def palettes(label, count):
    ls = text('paletteData.s').split('\n')
    i = ls.index(label + ':') + 1
    cols = []
    for l in ls[i:]:
        c = rgb(l)
        if c:
            cols.append(c)
        if len(cols) == count * 4:
            break
    return [cols[k * 4:k * 4 + 4] for k in range(count)]


def tileset(index):
    """The 8 bytes of Seasons tileset `index`, as source tokens. A seasonal
    tileset is followed to its spring entry."""
    ls = text('tilesets.s').split('\n')
    i = ls.index('tilesetData:') + 1
    n, cur, recs, seasonal = 0, [], {}, {}
    while not ls[i].startswith('tileset00Seasons'):
        l = ls[i].split(';')[0].strip()
        if l.startswith('m_SeasonalTileset'):
            seasonal[n] = l.split()[1]
            n += 1
        elif l.startswith('.db'):
            cur += [x.strip() for x in l[3:].split(',')]
            if len(cur) == 8:
                recs[n], cur, n = cur, [], n + 1
        i += 1
    if index in seasonal:
        k = ls.index(seasonal[index] + ':') + 1
        cur = []
        while len(cur) < 8:
            l = ls[k].split(';')[0].strip()
            if l.startswith('.db'):
                cur += [x.strip() for x in l[3:].split(',')]
            k += 1
        return cur
    return recs[index]


def gfx_files(header):
    body = re.search(r'm_GfxHeaderStart \$\w+, ' + header + r'\n(.*?)m_GfxHeaderEnd',
                     text('gfxHeaders.s'), re.S).group(1)
    return [(f, int(a, 16)) for f, a in re.findall(r'm_GfxHeader (\w+), \$(\w+)', body)]


def png_tiles(name):
    im = Image.open(os.path.join(SRC, name + '.png'))
    assert im.mode == 'P', f'{name}.png is not indexed'
    w, h = im.size
    out = []
    for t in range((w // 8) * (h // 8)):
        tx, ty = (t % (w // 8)) * 8, (t // (w // 8)) * 8
        out.append([[im.getpixel((tx + x, ty + y)) for x in range(8)] for y in range(8)])
    return out


def load_vram(header):
    vram = {0: {}, 1: {}}
    for f, a in gfx_files(header):
        for t, tile in enumerate(png_tiles(f)):
            vram[a & 1][(a & 0xfff0) + t * 16] = tile
    return vram


def addr(index):
    return 0x9000 + index * 16 if index < 0x80 else 0x8800 + (index - 0x80) * 16


def bg_palettes(pal_header):
    m = re.search(r'PALH_' + pal_header[5:] + r'\n\s*m_PaletteHeaderBg\s+2, 6, (\w+)',
                  text('paletteHeaders.s'))
    common = re.search(r'PALH_0f\n\s*m_PaletteHeaderBg\s+0, 1, (\w+)', text('paletteHeaders.s'))
    # BG palette 1 is not loaded by PALH_0f; no object below is drawn in it.
    return palettes(common.group(1), 1) + [None] + palettes(m.group(1), 6)


class Tileset:
    def __init__(self, index):
        rec = tileset(index)
        self.index = index
        self.gfx, self.pal_header = rec[3], rec[4]
        self.layout = int(rec[5][1:], 16)
        self.anim_group = int(rec[7][1:], 16)
        self.vram = load_vram(self.gfx)
        self.pals = bg_palettes(self.pal_header)
        with open(os.path.join(SRC, f'tilesetMappings{self.layout:02x}.bin'), 'rb') as f:
            self.map = f.read()

    def metatile(self, m, vram=None):
        """(16x16 grid of colour indices, palette) of metatile `m`."""
        vram = vram or self.vram
        tiles, attrs = self.map[m * 8:m * 8 + 4], self.map[m * 8 + 4:m * 8 + 8]
        pals = {a & 7 for a in attrs}
        assert len(pals) == 1, f'metatile ${m:02x} mixes palettes {pals}'
        grid = [[0] * 16 for _ in range(16)]
        for q in range(4):
            a = attrs[q]
            tile = vram[(a >> 3) & 1][addr(tiles[q])]
            for y in range(8):
                for x in range(8):
                    sx = 7 - x if a & 0x20 else x
                    sy = 7 - y if a & 0x40 else y
                    grid[(q // 2) * 8 + y][(q % 2) * 8 + x] = tile[sy][sx]
        pal = self.pals[pals.pop()]
        assert pal, f'metatile ${m:02x} is drawn in a palette this ripper does not load'
        return grid, pal

    def metatile_vram(self, m):
        """The VRAM addresses (bank, address) metatile `m` reads."""
        tiles, attrs = self.map[m * 8:m * 8 + 4], self.map[m * 8 + 4:m * 8 + 8]
        return {((a >> 3) & 1, addr(t)) for t, a in zip(tiles, attrs)}

    def animation_frames(self, m):
        """[(frames held, 16x16 grid)] of metatile `m` through the tileset's
        animation, or [] when nothing animates it."""
        groups = re.search(r'animationGroup%02x:\n(?:animationGroup\w+:\n)*(.*?)\n\n' % self.anim_group,
                           text('animationGroups.s') + '\n\n', re.S)
        if not groups:
            ls = text('animationGroups.s')
            # A group can share its body with the labels stacked above it.
            k = ls.index('animationGroup%02x:' % self.anim_group)
            groups = re.search(r'(\s*\.db.*?)\n\n', ls[k:], re.S)
        datas = re.findall(r'\.dw (\w+)', groups.group(1))
        headers = re.findall(r'm_GfxHeaderAnim (\w+), \$(\w+), \$(\w+), \$(\w+)',
                             text('animationGfxHeaders.s'))
        need = self.metatile_vram(m)
        for label in datas:
            body = re.search(label + r':\n(.*?)m_AnimationLoop', text('animationData.s'), re.S).group(1)
            steps = [tuple(int(v, 16) for v in re.findall(r'\$(\w+)', l)) for l in body.split('\n') if '.db' in l]
            f0, d0, n0, _ = headers[steps[0][1]]
            dest, count = int(d0, 16), int(n0, 16)
            covered = {(dest & 1, (dest & 0xfff0) + i * 16) for i in range(count)}
            if not need & covered:
                continue
            frames = []
            for held, h in steps:
                f, d, n, off = headers[h]
                src = png_tiles(f)
                vram = {0: dict(self.vram[0]), 1: dict(self.vram[1])}
                dst = int(d, 16)
                for i in range(int(n, 16)):
                    vram[dst & 1][(dst & 0xfff0) + i * 16] = src[int(off, 16) // 16 + i]
                frames.append((held, self.metatile(m, vram)[0]))
            return frames
        return []


def key_ground(grid):
    """Make the ground transparent: flood from the edge over the colour most
    of the four corners have (a sign's top corners are its board, its bottom
    ones the grass). Returns rows with None for transparent."""
    corners = [grid[0][0], grid[0][15], grid[15][0], grid[15][15]]
    ground = max(set(corners), key=corners.count)
    assert corners.count(ground) >= 2, 'no two corners agree about the ground'
    out = [list(r) for r in grid]
    stack = [(x, y) for x in range(16) for y in (0, 15)] + [(x, y) for y in range(16) for x in (0, 15)]
    while stack:
        x, y = stack.pop()
        if 0 <= x < 16 and 0 <= y < 16 and out[y][x] == ground:
            out[y][x] = None
            stack += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
    return out


def rows(grid):
    return [''.join('.' if v is None else str(v) for v in r) for r in grid]


def ramp(pal):
    return ['#%02x%02x%02x' % c for c in pal]


def build():
    art, pals, notes, frames_held = {}, {}, [], None
    sets = {i: Tileset(i) for i in TILESETS}
    grotto = sets[dict((t, s) for _, t, s in THEMES)[DEFAULT_THEME]]

    def put(name, grid, pal, why, pal_name=None):
        pal_name = pal_name or name
        art[name] = rows(grid)
        pals[pal_name] = ramp(pal)
        notes.append(f'//   {name}: {why}')
        return pal_name

    # Chests: BG palette 0, the same in every room.
    g, p = grotto.metatile(CHEST)
    put('o_chest', g, p, f'TILEINDEX_CHEST $f1, {TILESETS[grotto.index]}, palette 0', 'o_chest')
    g, p = grotto.metatile(CHEST_OPENED)
    put('o_chest_open', g, p, 'TILEINDEX_CHEST_OPENED $f0, the same', 'o_chest')
    art['o_chestbig'], art['o_chestbig_open'] = art['o_chest'], art['o_chest_open']
    notes.append('//   o_chestbig, o_chestbig_open: the same chest — Seasons has one')

    # The sign: the overworld's wooden one, standing on nothing.
    ow = sets[0x00]
    g, p = ow.metatile(SIGN)
    put('o_sign', key_ground(g), p, f'TILEINDEX_SIGN $f2, {TILESETS[0]}, grass keyed out')

    # Torches: dungeon standard graphics, palette 0.
    g, p = grotto.metatile(UNLIT_TORCH)
    put('o_torch', g, p, 'TILEINDEX_UNLIT_TORCH $08', 'o_torch')
    lit = grotto.animation_frames(LIT_TORCH)
    assert lit, 'nothing animates the lit torch'
    for k, (held, g) in enumerate(lit):
        art[f'o_torch_lit{k}'] = rows(g)
        frames_held = frames_held or held
        assert held == frames_held, 'the flame frames are not held equally long'
    notes.append(f'//   o_torch_lit0..{len(lit) - 1}: TILEINDEX_LIT_TORCH $09 through animation group '
                 f'${grotto.anim_group:02x}, {len(lit)} frames of {frames_held} (TORCH_FLAME_FRAMES)')

    # Push blocks and buttons: each dungeon's own.
    themes = {}
    for legend, suffix, index in THEMES:
        ts = sets[index]
        themes[legend] = suffix
        g, p = ts.metatile(PUSHABLE_BLOCK)
        put(f'o_block_{suffix}', g, p, f'TILEINDEX_PUSHABLE_BLOCK $1d, {TILESETS[index]}')
        g, p = ts.metatile(BUTTON)
        put(f'o_switch_up_{suffix}', key_ground(g), p,
            f'TILEINDEX_BUTTON $0c, {TILESETS[index]}, floor keyed out', f'o_switch_{suffix}')
        g, p2 = ts.metatile(PRESSED_BUTTON)
        assert p2 == p
        put(f'o_switch_down_{suffix}', key_ground(g), p, 'TILEINDEX_PRESSED_BUTTON $0d, the same',
            f'o_switch_{suffix}')
    for base in ('o_block', 'o_switch_up', 'o_switch_down'):
        art[base] = art[f'{base}_{DEFAULT_THEME}']
    notes.append(f'//   o_block, o_switch_up, o_switch_down: the {DEFAULT_THEME} ones, for a room '
                 'outside the six dungeons')
    return art, pals, notes, themes, len(lit)


def pal_of(name):
    if name.startswith('o_chest'):
        return 'o_chest'
    if name.startswith('o_torch'):
        return 'o_torch'
    m = re.match(r'o_switch_(?:up|down)(?:_(\w+))?$', name)
    if m:
        return f'o_switch_{m.group(1) or DEFAULT_THEME}'
    m = re.match(r'o_block(?:_(\w+))?$', name)
    if m:
        return f'o_block_{m.group(1) or DEFAULT_THEME}'
    return name


HEADER = '''// Chests, the sign, torches, push blocks and floor buttons, cut from Oracle of
// Seasons' own room graphics.
//
// Generated by tools/rip-objects.py — edit that, not this file.
// Source: Stewmath's oracles-disasm (github.com/Stewmath/oracles-disasm,
// commit 7584d87), assets/objects/oracles-disasm/seasons/: the tileset
// graphics, layouts, palettes and animation tables. Credit: the oracles-disasm
// project and its contributors; the artwork is Nintendo's and Capcom's. This is
// fan-work art only.
//
// Each sprite carries its own colours: draw sites must NOT pass a palette.
//'''


def emit(art, pals, notes, themes, flame):
    out = HEADER.split('\n') + ['// Built from:'] + notes + [
        '', "import { sprites } from '../gfx/art.js';",
        "import { registerPalettes } from '../gfx/palettes.js';", '',
        '// Our dungeon legend -> the suffix of its own block and button.',
        'export const OBJECT_THEMES = {']
    for legend, suffix in themes.items():
        out.append(f"  {legend}: '{suffix}',")
    out += ['};', '', f'export const TORCH_FLAME_COUNT = {flame};', '',
            'export const OBJECT_ART = {']
    for name in art:
        out.append('  // extracted — pulled straight off the source graphics named '
                   'in this file\'s own header, by this ripper.')
        out.append(f"  {name}: {{ pal: '{pal_of(name)}', art: `")
        for r in art[name]:
            out.append('    ' + r)
        out[-1] += '` },'
    out.append('};')
    out.append('')
    out.append('const OBJECT_PALETTES = {')
    for name in pals:
        out.append(f"  {name}: [{', '.join(repr(c) for c in pals[name])}],")
    out.append('};')
    out += ['', 'export function installObjectSprites() {',
            '  registerPalettes(OBJECT_PALETTES);',
            "  sprites.add(OBJECT_ART, 'stone');", '}', '']
    with open(OUT, 'w') as f:
        f.write('\n'.join(out))


def sheet(art, pals):
    names = list(art)
    im = Image.new('RGB', (len(names) * 18, 18), (255, 0, 255))
    for i, n in enumerate(names):
        pal = pals[pal_of(n)]
        for y, r in enumerate(art[n]):
            for x, c in enumerate(r):
                if c != '.':
                    im.putpixel((i * 18 + 1 + x, 1 + y), tuple(int(pal[int(c)][k:k + 2], 16) for k in (1, 3, 5)))
    im.resize((im.width * 4, im.height * 4), Image.NEAREST).save('/tmp/rip-objects-sheet.png')


if __name__ == '__main__':
    a, p, n, t, f = build()
    emit(a, p, n, t, f)
    if '--sheet' in sys.argv:
        sheet(a, p)
    print('rip-objects: wrote', len(a), 'sprites ->', os.path.relpath(OUT, ROOT))
