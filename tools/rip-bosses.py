#!/usr/bin/env python3
"""Assemble boss frames from Oracle of Seasons' own boss graphics (S152).

Regenerate with:  python3 tools/rip-bosses.py

Source: assets/bosses/oracles-disasm/, copied verbatim from Stewmath's
oracles-disasm (github.com/Stewmath/oracles-disasm, commit 7584d87):
the boss sprite graphics (gfx/spr_*.png, 2 bits a pixel, 8x16 sprites side
by side), the object graphics headers that say which of them load together
(objectGfxHeaders.s), the enemy table (enemyData.s), the per-enemy frame
lists (enemyAnimations.s), the frame layouts (enemyOamData.s) and the
colours (paletteData.s, standardSpritePaletteData). Credit: the
oracles-disasm project and its contributors, who took the cartridge apart;
the artwork is Nintendo's and Capcom's. Fan-work use only.

Since S159 it also reads Oracle of Ages from assets/bosses/oracles-disasm-ages/
(the same commit's data/ages/ tables and the few gfx sheets used), for the
three bosses the human asked to be blends of both cartridges' creatures.

WHY THIS AND NOT A SHEET. No sheet in assets/sheets/ carries a boss. The
cartridge carries all of them, and a boss on the cartridge is not a picture:
it is a list of 8x16 hardware sprites, each placed at an offset from the
boss's position, flipped and coloured by its own attribute byte. So this
does what the Game Boy's drawing code does (code/bank0.s @drawObject):

  screen y = boss y + oam y - 16      screen x = boss x + oam x - 8
  tile     = oamTileIndexBase + oam tile     (8x16 mode: even tile numbers)
  flags    = the enemy's oamFlags XOR oam flags
             bit 5 mirror left-right, bit 6 mirror top-bottom, bits 0-2 palette

with oamFlags and oamTileIndexBase taken from the enemy's enemyData.s entry
(or its subid's), exactly as code/loadGraphics.s sets them. Within one frame
the earlier hardware sprite is drawn in front, as on the CGB.

A boss of ours is built from the Seasons boss whose SURFACE fits it; what it
does is ours (CLAUDE.md, Goal 2). A frame may combine several of the boss's
own parts — Gohma's body and its claw are separate objects on the cartridge,
the claw placed at the offset gohma.s gives it — and every offset below names
the line of object_code it was read from.

WHAT COMES OUT. src/data/sprites-bosses-seasons.js: one art string per frame
per palette (a frame drawn in two palettes is two non-overlapping layers,
since an art string carries four colours), the palettes as the cartridge's
RGB555 scaled by 255/31 — the scaling the enemy sheet's colours already use,
so Seasons' blue is the octorok's blue to the bit — and a rig per frame:
the frame's size, its layers, and where in it the boss's position falls.
The engine draws the rig with that point on the centre of the boss's hitbox,
so the art is placed and nothing about the fight moves.
"""
import os
import re
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets', 'bosses', 'oracles-disasm')
SRC_AGES = os.path.join(ROOT, 'assets', 'bosses', 'oracles-disasm-ages')
OUT = os.path.join(ROOT, 'src', 'data', 'sprites-bosses-seasons.js')

# ---------------------------------------------------------------------------
# The recipe. Each frame is a list of parts drawn back to front:
#   (enemy, oam frame index, dx, dy)
# where the oam frame index is into that enemy's enemyXXOamDataPointers and
# (dx, dy) is the part's offset from the boss's position. `canvas` is the
# frame's size and `origin` where the boss's position falls in it; every frame
# of one boss shares them, so the rig's anchor never jumps between frames.
# ---------------------------------------------------------------------------
GOHMA = dict(enemy=0x7b, gfx=0xb0, b3=0x10)   # enemyData.s 0x7b, subid 1: $b0 / $10

# gohma.s @updateNormalPosition: the claw stands at `ld bc,$08fa` from the
# body — 8 down, 6 left — animating $0d (frames 13 and 14). Blocking the eye
# (gohma_claw_updateBlockingPosition) it moves to `$07ff`, 7 down, 1 left,
# on animation $0e (frame 18).
CLAW = (8, -6)
BLOCK = (7, -1)

# medusaHead.s loads palette header $88 (`ld b,$88`, enemyBoss_initializeRoom):
# the sea-green of its mane is sprite palette 6.
MEDUSA = dict(enemy=0x7f, gfx=0xba, b3=0x00, palh=0x88)  # enemyData.s 0x7f: $ba / $00
# Manhandla's stalk (enemy7dSubidData, subid 1: $60) worn in Medusa's colours.
STALK = dict(enemy=0x7d, gfx=0xb6, b3=0x60, palh=0x88)

# S159: the three bosses the six-dungeon fold left without a room, given one
# each in the optional dungeons, and built — at the human's asking — as BLENDS
# of Seasons and Ages creatures. Ages' parts are read out of Ages' own tables
# (`game='ages'`, assets/bosses/oracles-disasm-ages/); a part may wear the
# other cartridge's colours (`palgame`).
SYGER_SEA = dict(enemy=0x74, gfx=0x9b, b3=0x60, palh=0x88)   # Syger $74, in Medusa's sea-green
NECK_SEA = dict(enemy=0x06, gfx=0xb8, b3=0x60, palh=0x88)    # Gleeok $06's neck, the same
SPIRAL = dict(enemy=0x72, gfx=0x96, b3=0x10)                 # Omuai $72's spiral, palette 1
LURE = dict(game='ages', enemy=0x76, gfx=0xb8, b3=0x10)      # Ages' Angler Fish $76, its lure
# Ages' Swoop $71 in Mothula's teal (Seasons palette header $82).
SWOOP_TEAL = dict(game='ages', palgame='seasons', enemy=0x71, gfx=0xaf, b3=0x60, palh=0x82)
VIRE = dict(enemy=0x75, gfx=0x30, b3=0x20)                   # Vire $75, palette 2
# Ages' Giant Ghini $70 in the pale lilac of Ages' palette header $c7.
GHINI_PALE = dict(game='ages', enemy=0x70, gfx=0xad, b3=0x60, palh=0xc7)
FLAME_ICE = dict(enemy=0x77, gfx=0xa0, b3=0x40)              # Frypolar $77's flame, palette 4


def eel(face, spiral, lift=0):
    """Syger's face (its top row) on three joints of Gleeok's neck, rising out
    of Omuai's whirlpool, with the Angler Fish's lure hung over its brow."""
    # Everything sits 8 px low so the boss's position — the centre of its
    # hitbox — falls on the head and upper neck, not the water.
    return [(SPIRAL, spiral, 0, 22), (NECK_SEA, 2, 1, 13), (NECK_SEA, 2, 0, 6),
            (SYGER_SEA, face, 0, 5 - lift, (0,)), (LURE, 12, 0, -16 - lift)]


BOSSES = {
    'gohmaraq': dict(
        source='Gohma (ENEMY_GOHMA $7b), Oracle of Seasons D4',
        canvas=(48, 32), origin=(24, 14),
        frames={
            # Shut: animation 6, frames 7,5,6 — the eye dark under its lid.
            'boss_gohmaraq_0': [(GOHMA, 7, 0, 0), (GOHMA, 13, CLAW[1], CLAW[0])],
            'boss_gohmaraq_1': [(GOHMA, 5, 0, 0), (GOHMA, 14, CLAW[1], CLAW[0])],
            'boss_gohmaraq_2': [(GOHMA, 6, 0, 0), (GOHMA, 13, CLAW[1], CLAW[0])],
            # Open: animation 2, frames 3,1,2 — the eye up and staring.
            'boss_gohmaraq_open_0': [(GOHMA, 3, 0, 0), (GOHMA, 13, CLAW[1], CLAW[0])],
            'boss_gohmaraq_open_1': [(GOHMA, 1, 0, 0), (GOHMA, 14, CLAW[1], CLAW[0])],
            'boss_gohmaraq_open_2': [(GOHMA, 2, 0, 0), (GOHMA, 13, CLAW[1], CLAW[0])],
            # Struck: animation 9's recoil, frame 8, the claw pulled in to guard.
            'boss_gohmaraq_hurt': [(GOHMA, 8, 0, 0), (GOHMA, 18, BLOCK[1], BLOCK[0])],
        },
    ),
    # The human asked for Medusa Head's crown kept and the rest less like it
    # (S152), and chose from four: the crown — the TOP ROW of Medusa's frame 0,
    # oam y 0 — on Manhandla's stalk (enemy $7d, subid 1-3: $b6 / $60), the
    # stalk in Medusa's own sea-green. An anemone: tentacles on a column.
    'anemos': dict(
        source="Medusa Head's crown (ENEMY_MEDUSA_HEAD $7f, D8) on Manhandla's "
               "stalk (ENEMY_MANHANDLA $7d, D6), both in Medusa's palette",
        canvas=(32, 52), origin=(16, 40),
        frames={
            # Swaying: Manhandla's animation 0 runs its stalk 0, 1, 0, 2.
            'boss_anemos_0': [(MEDUSA, 0, 0, -14, (0,)), (STALK, 0, 0, -4)],
            'boss_anemos_1': [(MEDUSA, 0, 0, -14, (0,)), (STALK, 1, 0, -4)],
            'boss_anemos_2': [(MEDUSA, 0, 0, -14, (0,)), (STALK, 2, 0, -4)],
            # Open to feed: the stalk stretched and gaping (its frames 3 and 4,
            # animations 1 and 2), the crown carried 8 px up with its head.
            'boss_anemos_open_0': [(MEDUSA, 0, 0, -22, (0,)), (STALK, 3, 0, -4)],
            'boss_anemos_open_1': [(MEDUSA, 0, 0, -22, (0,)), (STALK, 4, 0, -4)],
            'boss_anemos_open_2': [(MEDUSA, 0, 0, -22, (0,)), (STALK, 3, 0, -4)],
            # Struck: Medusa's mane thrown up (frame 7's top row, oam y -8).
            'boss_anemos_hurt': [(MEDUSA, 7, 0, -6, (248,)), (STALK, 0, 0, -4)],
        },
    ),
    # Thalassor, the eel. Its whirlpool is the one the fight drags you into.
    'thalassor': dict(
        source="Syger's face (ENEMY_SYGER $74, Seasons D5) on Gleeok's neck "
               "(ENEMY_GLEEOK $06, Seasons D7), rising out of Omuai's spiral "
               "(ENEMY_OMUAI $72, Seasons D2), with the lure of Ages' Angler "
               "Fish (ENEMY_ANGLER_FISH $76, Ages D7)",
        canvas=(24, 56), origin=(12, 27),
        frames={
            'boss_thalassor_0': eel(0, 0),
            'boss_thalassor_1': eel(1, 1),
            'boss_thalassor_2': eel(1, 0),
            'boss_thalassor_hurt': eel(0, 1, lift=3),
        },
    ),
    # Gustharpy: Ages' Swoop, wing-beat and all, wearing Vire's horned face.
    'gustharpy': dict(
        source="Ages' Swoop (ENEMY_SWOOP $71, Ages D2) in Mothula's teal "
               "(Seasons palette header $82), with Vire's face (ENEMY_VIRE $75)",
        canvas=(32, 28), origin=(16, 19),
        frames={
            'mini_gustharpy_0': [(SWOOP_TEAL, 0, 0, -4), (VIRE, 0, 0, -6, None, (4,))],
            'mini_gustharpy_1': [(SWOOP_TEAL, 1, 0, -4), (VIRE, 0, 0, -6, None, (4,))],
        },
    ),
    # The Saltwraith: Ages' Giant Ghini gone pale, Frypolar's flame burning
    # cold off the top of it.
    'saltwraith': dict(
        source="Ages' Giant Ghini (ENEMY_GIANT_GHINI $70, Ages D1) in Ages' "
               "palette header $c7, crowned with Frypolar's flame "
               "(ENEMY_FRYPOLAR $77, Seasons D8) in palette 4",
        canvas=(32, 43), origin=(16, 27),
        frames={
            'mini_saltwraith_0': [(GHINI_PALE, 0, 0, 0), (FLAME_ICE, 0, 0, -10, (255,))],
            'mini_saltwraith_1': [(GHINI_PALE, 1, 0, 0), (FLAME_ICE, 1, 0, -10, (255,))],
        },
    ),
}


# ---------------------------------------------------------------------------
# Reading the disassembly
# ---------------------------------------------------------------------------
class Cart:
    """One cartridge's disassembly: its tables, its graphics and its colours.

    Seasons is the default; a part whose source says `game='ages'` is read out
    of Ages' own tables instead (S159: the human asked for Ages' creatures in
    the blends too). Both were copied from the same oracles-disasm commit.
    """

    def __init__(self, src):
        self.src = src
        self.anim = self.labels('enemyAnimations.s')
        self.oam = self.labels('enemyOamData.s')
        self.gfx = {}
        for line in self.read('objectGfxHeaders.s'):
            m = re.search(r'/\* \$(\w+) \*/ m_ObjectGfxHeader (\w+)(, 1)?', line)
            if m:
                self.gfx[int(m.group(1), 16)] = (m.group(2), bool(m.group(3)))
        self._vram = {}

    def read(self, name):
        with open(os.path.join(self.src, name)) as f:
            return f.read().split('\n')

    def labels(self, name):
        """label -> list of ('db', [bytes]) / ('dw', label) / ('loop', label)."""
        out, cur = {}, None
        for line in self.read(name):
            line = line.split(';')[0].rstrip()
            m = re.match(r'^(\w+):', line)
            if m:
                cur = m.group(1)
                out[cur] = []
                continue
            if cur is None:
                continue
            s = line.strip()
            if s.startswith('.db'):
                out[cur].append(('db', [int(x[1:], 16) for x in s[3:].split()]))
            elif s.startswith('.dw'):
                out[cur].append(('dw', s[3:].strip()))
        return out

    def gfx_chain(self, index):
        """The graphics a header loads: it and the ones after it, up to the ', 1'."""
        files = []
        while True:
            name, last = self.gfx[index]
            files.append(name)
            index += 1
            if last:
                return files

    def palette_data(self, label, count):
        """`count` palettes of four colours from paletteData.s, starting at `label`."""
        lines = self.read('paletteData.s')
        start = lines.index(label + ':') + 1
        pals, cur = [], []
        for line in lines[start:]:
            m = re.search(r'm_RGB16 \$(\w+) \$(\w+) \$(\w+)', line)
            if not m:
                continue
            cur.append('#' + ''.join('%02x' % round(int(m.group(k), 16) * 255 / 31)
                                     for k in (1, 2, 3)))
            if len(cur) == 4:
                pals.append(cur)
                cur = []
            if len(pals) == count:
                return pals

    def boss_palettes(self, palh):
        """The eight sprite palettes in a boss fight.

        Sprite palettes 0-5 are standardSpritePaletteData, loaded once and never
        replaced; 6 and 7 belong to whoever loaded them last. A boss loads its own
        through enemyBoss_initializeRoom with a palette header (`ld b,PALH_...`
        in its object_code file), which paletteHeaders.s spells out.
        """
        pals = self.palette_data('standardSpritePaletteData', 6) + [None, None]
        if palh is None:
            return pals
        lines = self.read('paletteHeaders.s')
        at = next(i for i, l in enumerate(lines)
                  if re.match(r'm_PaletteHeaderStart \$%02x,' % palh, l))
        for line in lines[at + 1:]:
            if 'm_PaletteHeaderEnd' in line:
                break
            m = re.search(r'm_PaletteHeaderSpr (\d+), (\d+), (\w+)', line)
            if m:
                first, n = int(m.group(1)), int(m.group(2))
                pals[first:first + n] = self.palette_data(m.group(3), n)
        return pals

    def vram(self, index):
        """The files a header loads, opened only when a tile is read from one.

        Vire's header ($30) is the common one that loads a hundred files; only
        the few a boss actually draws from are copied into assets/.
        """
        return [(self, f) for f in self.gfx_chain(index)]

    def sheet(self, f):
        if f not in self._vram:
            self._vram[f] = Image.open(os.path.join(self.src, 'gfx', f + '.png'))
        return self._vram[f]

    def oam_entries(self, enemy, index):
        ptrs = [d for k, d in self.anim['enemy%02xOamDataPointers' % enemy]]
        rows = self.oam[ptrs[index]]
        n = rows[0][1][0]
        flat = sum((r[1] for r in rows[1:]), [])
        assert len(flat) >= n * 4, (enemy, index)
        return [flat[i * 4:i * 4 + 4] for i in range(n)]


CARTS = {'seasons': Cart(SRC), 'ages': Cart(SRC_AGES)}


def sprite_tile(ims, t):
    """8x16 sprite `t` (an even tile number): each 128x16 file holds 32 tiles."""
    cart, f = ims[t // 32]
    im = cart.sheet(f)
    c = (t % 32) // 2
    return im.crop((c * 8, 0, c * 8 + 8, 16))


def signed(v):
    return v - 256 if v > 127 else v


def draw_part(canvas, part, ox, oy):
    """Draw one object frame onto `canvas`: (x,y) -> ((cart, palette header, palette), index).

    A part is (source, oam frame, dx, dy[, rows[, cols]]): `rows` keeps only
    the hardware sprites whose oam y is listed and `cols` only those whose
    oam x is — one row or column of 8x16 sprites out of a frame, so a boss can
    wear one creature's crown, wings or face on another's body. Either may be
    None. A source reads its graphics from `game` (default Seasons) and its
    colours from `palgame` (default: the same cartridge).
    """
    src, index, dx, dy = part[:4]
    rows = part[4] if len(part) > 4 else None
    cols = part[5] if len(part) > 5 else None
    cart = CARTS[src.get('game', 'seasons')]
    palgame = src.get('palgame', src.get('game', 'seasons'))
    ims = cart.vram(src['gfx'])
    oam_flags = src['b3'] >> 4
    base = (src['b3'] & 0x0f) * 2
    # Earlier hardware sprites are in front: paint back to front.
    for y, x, t, f in reversed(cart.oam_entries(src['enemy'], index)):
        if rows is not None and y not in rows:
            continue
        if cols is not None and x not in cols:
            continue
        flags = oam_flags ^ f
        tile = sprite_tile(ims, (base + t) & 0xff)
        if flags & 0x20:
            tile = tile.transpose(Image.FLIP_LEFT_RIGHT)
        if flags & 0x40:
            tile = tile.transpose(Image.FLIP_TOP_BOTTOM)
        left = ox + dx + signed(x) - 8
        top = oy + dy + signed(y) - 16
        for yy in range(16):
            for xx in range(8):
                v = tile.getpixel((xx, yy))
                if v:
                    canvas[(left + xx, top + yy)] = ((palgame, src.get('palh'), flags & 7), v)


# GB colour index -> art index. The cartridge's sprite palettes run
# transparent, black, mid, light; an art string runs light (0) to dark (3).
TO_ART = {3: '0', 2: '1', 1: '3'}


def build():
    art, pals, rigs = {}, {}, {}
    for boss, spec in BOSSES.items():
        cw, ch = spec['canvas']
        ox, oy = spec['origin']
        for name, parts in spec['frames'].items():
            canvas = {}
            for part in parts:
                draw_part(canvas, part, ox, oy)
            for (x, y) in canvas:
                if not (0 <= x < cw and 0 <= y < ch):
                    sys.exit(f'{name}: pixel at {x},{y} falls outside its {cw}x{ch} canvas')
            used = sorted({p for p, v in canvas.values()}, key=lambda k: (k[0] != 'seasons', k[1] or 0, k[2]))
            layers = []
            for i, pal in enumerate(used):
                layer = name if i == 0 else f'{name}@{i}'
                rows = []
                for y in range(ch):
                    row = ''
                    for x in range(cw):
                        c = canvas.get((x, y))
                        row += TO_ART[c[1]] if c and c[0] == pal else '.'
                    rows.append(row)
                art[layer] = rows
                p = CARTS[pal[0]].boss_palettes(pal[1])[pal[2]]
                assert p, f'{name}: palette {pal[2]} is never loaded by header {pal[1]}'
                # light, mid, (mid), black — the '2' slot is never written.
                pals[layer] = [p[3], p[2], p[2], p[1]]
                layers.append(layer)
            rigs[name] = dict(w=cw, h=ch, ax=ox, ay=oy, layers=layers)
    return art, pals, rigs


HEADER = '''// Boss frames assembled from Oracle of Seasons' own boss graphics.
//
// Generated by tools/rip-bosses.py — edit that, not this file.
// Source: Stewmath's oracles-disasm (github.com/Stewmath/oracles-disasm,
// commit 7584d87), assets/bosses/oracles-disasm/ (Seasons) and
// assets/bosses/oracles-disasm-ages/ (Ages): the cartridges' boss
// sprite graphics, frame layouts and palettes. Credit: the oracles-disasm
// project and its contributors; the artwork is Nintendo's and Capcom's.
// This is fan-work art only.
//
// Each frame is the cartridge's own hardware sprites, placed, flipped and
// coloured the way the Game Boy draws them. A frame in more than one palette
// is split into non-overlapping layers ('name', 'name@1', ...). BOSS_RIG says,
// per frame, its size, its layers, and the pixel (ax, ay) where the boss's
// position falls — which the engine puts on the centre of the hitbox.
//'''


def emit(art, pals, rigs):
    sources = '\n'.join(f"//   {b}: {s['source']}" for b, s in BOSSES.items())
    lines = HEADER.split('\n') + ['// Built from:', sources, '',
             "import { sprites } from '../gfx/art.js';",
             "import { registerPalettes } from '../gfx/palettes.js';", '',
             'export const BOSS_SEASONS_ART = {']
    for name in sorted(art):
        lines.append('  // extracted — pulled straight off the source sheet named '
                     'in this file\'s own header, by this ripper.')
        lines.append(f"  '{name}': {{ pal: '{name}', art: `")
        for r in art[name]:
            lines.append('    ' + r)
        lines[-1] += '` },'
    lines += ['};', '', '// One palette per layer, the cartridge\'s own colours.',
              'export const BOSS_SEASONS_PALETTES = {']
    for name in sorted(pals):
        lines.append(f"  '{name}': [{', '.join(repr(c) for c in pals[name])}],")
    lines += ['};', '', 'export const BOSS_RIG = {']
    for name in sorted(rigs):
        r = rigs[name]
        ls = ', '.join(f"'{l}'" for l in r['layers'])
        lines.append(f"  {name}: {{ w: {r['w']}, h: {r['h']}, ax: {r['ax']}, "
                     f"ay: {r['ay']}, layers: [{ls}] }},")
    lines += ['};', '', 'export function installSeasonsBossSprites() {',
              '  registerPalettes(BOSS_SEASONS_PALETTES);',
              "  sprites.add(BOSS_SEASONS_ART, 'enemyr');", '}', '']
    with open(OUT, 'w') as f:
        f.write('\n'.join(lines))


if __name__ == '__main__':
    a, p, r = build()
    emit(a, p, r)
    print(f'wrote {os.path.relpath(OUT, ROOT)}: {len(r)} frames, {len(a)} layers')
