#!/usr/bin/env python3
"""Cut the smoke puffs and the bomb blast out of Oracle of Seasons' own graphics (S165).

Regenerate with:  python3 tools/rip-effects.py

Source: assets/effects/oracles-disasm/seasons/, copied verbatim from
Stewmath's oracles-disasm (github.com/Stewmath/oracles-disasm, commit 7584d87).
Credit: the oracles-disasm project and its contributors, who took the cartridge
apart; the artwork is Nintendo's and Capcom's. Fan-work use only.

WHY THIS AND NOT A SHEET. The puff a thing vanishes in, the puff an enemy dies
in and the bomb's blast were hand-drawn (sprites-link.js, "no sheet in
assets/sheets/ has this art"). No sheet has them; the cartridge has all three,
on one graphics file every room keeps loaded (spr_common_sprites, VRAM bank 1,
gfx header GFXH_COMMON_SPRITES), and says exactly how to draw each:

  * THE PUFF is interaction $05, INTERAC_PUFF (interactionData.s: tile base,
    palette, VRAM bank), drawn by its animation 0 (interactionAnimations.s)
    through interaction05OamDataPointers (interactionOamData.s).
  * THE KILL PUFF is part $02, PART_ENEMY_DESTROYED (partData.s b5 tile base,
    b6 oam flags), what every ordinary enemy turns into when it dies
    (code/bank0.s enemyDie -> @enemyCreateDeathPuff), drawn by its animation 0
    (partAnimations.s) through part02OamDataPointers (partOamData.s). Its code
    (enemyDestroyed.s) flips palette bit 0 every other frame, so each frame is
    cut twice: `fx_kill<k>` in its own palette and `fx_kill<k>b` in the other.
  * THE BLAST is ITEM_BOMB's animation 1 (itemAnimations.s, item03Animations)
    through item03OamDataPointers (itemOamData.s), with the tile base and oam
    flags itemInitializeBombExplosion (bombs.s) loads when the fuse ends.

How long each frame is held is timing, so it is in src/data/feel.js
(PUFF_HOLDS, KILL_PUFF_HOLDS, EXPLOSION_HOLDS), read from the same tables; this
file emits only the pictures, in the order those holds walk them.

A hardware sprite is 8x16 (8x16 OBJ mode: even tile numbers). Placed as
code/bank0.s @drawObject places it: screen y = object y + oam y - 16, screen
x = object x + oam x - 8, mirrored by oam flag bits 5 and 6, coloured by
(object oam flags XOR oam flags) & 7. Every frame is cut into a 32x32 cell
with the object's position at (16, 16), so the engine draws one at
(centre - 16, centre - 16) and nothing moves.

Colours are the cartridge's standard sprite palettes (paletteData.s,
standardSpritePaletteData), RGB555 scaled to 8 bits the way the GBC does.
"""
import os
import re

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets', 'effects', 'oracles-disasm', 'seasons')
OUT = os.path.join(ROOT, 'src', 'data', 'sprites-effects.js')
SHEET = 'spr_common_sprites.png'
CELL = 32


def lines(name):
    with open(os.path.join(SRC, name)) as f:
        return [l.split(';')[0].rstrip() for l in f.read().split('\n')]


def after(ls, label):
    k = next(i for i, l in enumerate(ls) if re.match(r'^' + label + r':', l))
    return ls[k + 1:]


def dbs(line):
    return [int(x[1:], 16) for x in line.strip()[3:].split()]


def dws(ls, label):
    """The .dw labels that follow `label`, skipping labels that share the list."""
    out = []
    for l in after(ls, label):
        s = l.strip()
        if s.startswith('.dw'):
            out.append(s[3:].strip())
        elif re.match(r'^\w+:', s) and not out:
            continue
        else:
            break
    return out


def sequence(ls, label):
    """[(hold, oam index)] of an animation, up to the frame that ends it."""
    out = []
    for l in after(ls, label):
        s = l.strip()
        if not s.startswith('.db'):
            break
        hold, frame, param = dbs(s)
        if hold == 0xff or param == 0xff:
            break
        out.append((hold, frame // 2))
    return out


def oam(ls, label):
    body = [l for l in after(ls, label) if l.strip()]
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


def render(base, flags, entries):
    """One 32x32 frame: rows of palette indices, and the palette it is drawn in."""
    im = Image.open(os.path.join(SRC, SHEET))
    assert im.mode == 'P', f'{SHEET} is not indexed'
    per_row = im.size[0] // 8
    grid = [[0] * CELL for _ in range(CELL)]
    pals = set()
    # The earlier hardware sprite is drawn in front, as on the CGB: paint in
    # reverse so the first entry lands last.
    for y, x, t, f in reversed(entries):
        f ^= flags
        pals.add(f & 7)
        spr = ((base + t) & 0xff) // 2
        col, row = spr % per_row, spr // per_row
        top = (y - 16 + 16) & 0xff
        left = (x - 8 + 16) & 0xff
        for yy in range(16):
            for xx in range(8):
                sx = 7 - xx if f & 0x20 else xx
                sy = 15 - yy if f & 0x40 else yy
                v = im.getpixel((col * 8 + sx, row * 16 + sy))
                if v:
                    py, px = top + yy, left + xx
                    assert 0 <= py < CELL and 0 <= px < CELL, 'frame outside its 32x32 cell'
                    grid[py][px] = v
    assert len(pals) == 1, 'a frame in more than one palette'
    return grid, pals.pop()


def ink(grid, pal):
    """Art rows and a four-colour ramp, by brightness: 0 lightest, 3 darkest."""
    used = {v for r in grid for v in r if v}
    cols = palette(pal)
    lum = {v: 3 * cols[v][0] + 6 * cols[v][1] + cols[v][2] for v in used}
    order = sorted(used, key=lambda v: -lum[v])
    if len(order) == 3:
        digit = {order[0]: '0', order[1]: '1', order[2]: '3'}
    elif len(order) == 2:
        digit = {order[0]: '0', order[1]: '3'}
    else:
        digit = {order[0]: '3'}
    inks = {d: '#%02x%02x%02x' % cols[v] for v, d in digit.items()}
    mid = inks.get('1', inks.get('0', '#000000'))
    ramp = [inks.get('0', mid), mid, mid, inks['3']]
    return [''.join(digit[v] if v else '.' for v in r) for r in grid], ramp


def puff():
    """INTERAC_PUFF: (base, flags, [(hold, entries)])."""
    for l in lines('interactionData.s'):
        m = re.search(r'/\* \$05 \*/ m_InteractionData \$(\w+) \$(\w+) \$(\w+)', l)
        if m:
            b1, b2 = int(m.group(2), 16), int(m.group(3), 16)
            break
    # b2: bits 4-6 palette, bit 7 VRAM bank (the common sprites are bank 1).
    assert b2 & 0x80, 'the puff is not on the bank-1 common sprites'
    anim = dws(lines('interactionAnimations.s'), 'interaction05Animations')[0]
    ptrs = dws(lines('interactionAnimations.s'), 'interaction05OamDataPointers')
    seq = sequence(lines('interactionAnimations.s'), anim)
    io = lines('interactionOamData.s')
    return b1 & 0x7f, (b2 >> 4) & 7, [(h, oam(io, ptrs[k])) for h, k in seq]


def kill():
    """PART_ENEMY_DESTROYED: (base, flags, [(hold, entries)])."""
    rows = [dbs(l) for l in after(lines('partData.s'), 'partData') if l.strip().startswith('.db')]
    row = rows[0x02]
    anim = dws(lines('partAnimations.s'), 'part02Animations')[0]
    ptrs = dws(lines('partAnimations.s'), 'part02OamDataPointers')
    seq = sequence(lines('partAnimations.s'), anim)
    po = lines('partOamData.s')
    return row[5], row[6], [(h, oam(po, ptrs[k])) for h, k in seq]


def blast():
    """ITEM_BOMB exploding: (base, flags, [(hold, entries)])."""
    ls = after(lines('bombs.s'), 'itemInitializeBombExplosion')
    body = '\n'.join(ls[:20])
    flags = int(re.search(r'Item\.oamFlagsBackup\s+ld a,\$(\w+)', body).group(1), 16)
    base = int(re.search(r'ld \(hl\),\$(\w+)', body).group(1), 16)
    anim = dws(lines('itemAnimations.s'), 'item03Animations')[1]
    ptrs = dws(lines('itemAnimations.s'), 'item03OamDataPointers')
    seq = sequence(lines('itemAnimations.s'), anim)
    io = lines('itemOamData.s')
    return base, flags, [(h, oam(io, ptrs[k])) for h, k in seq]


def build():
    art, pals, notes = {}, {}, []

    def cut(prefix, src, alt=False):
        base, flags, seq = src
        names, seen = [], {}
        for hold, entries in seq:
            key = repr(entries)
            if key not in seen:
                seen[key] = len(seen)
                k = seen[key]
                grid, pal = render(base, flags, entries)
                for suffix, p in [('', pal)] + ([('b', pal ^ 1)] if alt else []):
                    name = f'{prefix}{k}{suffix}'
                    rows, ramp = ink(grid, p)
                    art[name] = rows
                    pals[name] = ramp
            names.append(f'{prefix}{seen[key]}')
        notes.append(f'//   {prefix}*: frames {" ".join(n[len(prefix):] for n in names)}'
                     f' (held {" ".join(str(h) for h, _ in seq)}), tile base ${base:02x}')
        return names

    cut('fx_puff', puff())
    cut('fx_kill', kill(), alt=True)
    cut('fx_boom', blast())
    return art, pals, notes


HEADER = '''// The smoke puffs and the bomb blast, cut from Oracle of Seasons' own graphics.
//
// Generated by tools/rip-effects.py — edit that, not this file.
// Source: Stewmath's oracles-disasm (github.com/Stewmath/oracles-disasm,
// commit 7584d87), assets/effects/oracles-disasm/seasons/: the common sprite
// graphics every room keeps loaded, the tables that lay out INTERAC_PUFF,
// PART_ENEMY_DESTROYED and the exploding ITEM_BOMB, and the standard sprite
// palettes. Credit: the oracles-disasm project and its contributors; the
// artwork is Nintendo's and Capcom's. This is fan-work art only.
//
// Every frame is 32x32 with the object's position at (16, 16), and carries
// its own colours: draw sites must NOT pass a palette. How long each is held
// is in src/data/feel.js (PUFF_HOLDS, KILL_PUFF_HOLDS, EXPLOSION_HOLDS); the
// frame order those holds walk is listed here.
//'''


def emit(art, pals, notes):
    out = HEADER.split('\n') + ['// Built from:'] + notes + [
        '', "import { sprites } from '../gfx/art.js';",
        "import { registerPalettes } from '../gfx/palettes.js';", '',
        'export const EFFECT_ART = {']
    for name in art:
        out.append('  // extracted — pulled straight off the source graphics named '
                   'in this file\'s own header, by this ripper.')
        out.append(f"  {name}: {{ pal: '{name}', art: `")
        for r in art[name]:
            out.append('    ' + r)
        out[-1] += '` },'
    out.append('};')
    out.append('')
    out.append('const EFFECT_PALETTES = {')
    for name in pals:
        out.append(f"  {name}: [{', '.join(repr(c) for c in pals[name])}],")
    out.append('};')
    out += ['', 'export function installEffectSprites() {',
            '  registerPalettes(EFFECT_PALETTES);',
            "  sprites.add(EFFECT_ART, 'ui');", '}', '']
    with open(OUT, 'w') as f:
        f.write('\n'.join(out))


if __name__ == '__main__':
    a, p, n = build()
    emit(a, p, n)
    print('rip-effects: wrote', len(a), 'sprites ->', os.path.relpath(OUT, ROOT))
    for line in n:
        print(line[4:])
