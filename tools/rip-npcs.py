#!/usr/bin/env python3
"""Extract NPC sprites from the Oracle of Seasons NPC sheet (and Farore from
the cartridge's own graphics, via oracles-disasm — see below).

Sprites ripped by Trailsdegamer / edited by unknown, via spriters-resource.com;
the original artwork is Nintendo's. Fan-work use only.

Regenerate with:  python3 tools/rip-npcs.py
"""
import sys, os, re
sys.path.insert(0, os.path.dirname(__file__))
from ripkit import load, background, find_sprites, quantise, emit_module

SHEET = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    'assets', 'sheets', 'oracle-seasons-npcs.png')

# Sprite index -> engine sprite name, in the reading order `find_sprites`
# returns: top to bottom by row, then left to right.
#
# THE INDICES ARE ALL NEW, because what they index is. This used `find_cells`,
# which cuts a band of content every 16 pixels — and this sheet's townspeople
# sit about 17 to 18 apart, so the cut drifted a pixel per sprite and by the
# middle of a row the window held the right half of one villager and the left
# half of the next. Every NPC in the game was two half-people, and it is
# obvious from across the room once you look. `find_sprites` finds each sprite
# as its own connected blob of ink instead, which is the same lesson the trees
# taught one file over: measure the object, never assume the pitch.
#
# Picked off the contact sheet by eye, which is the half of this that is not
# mechanical — the sheet has soldiers, Zoras and Subrosians in it as well as
# townsfolk, and what this game wants is people standing still and facing you.
FRAMES = {
    'npc_villager': 2,       # dark-haired townsman, front
    'npc_villager2': 12,     # townswoman in red, arms out, front
    'npc_fisher': 49,        # blue-clad man, front
    'npc_child': 51,         # child, front
    'npc_elder': 17,         # bald elder, front
    'npc_shopkeeper': 20,    # fair-haired man in blue, front
    # A second, genuinely different coastal-worker pose: red kerchief, green
    # vest, both arms drawn low holding a red basket/creel against the body —
    # a different silhouette from npc_fisher's arms-at-sides stance, not a
    # recolour of it. Found by a whole-sheet pass (S62) after the sprite it
    # breaks a collision for (npc_fisher, shared by 3 named traders/villagers
    # as of S61) had no other unused extracted art left to spend.
    'npc_fisher2': 69,
    'npc_zelda': 59,         # the woman with the red bow
}

# FARORE IS CUT FROM THE CARTRIDGE (S168), not from the sheet. The sheet has
# no oracle, so for 160 sessions she was a townswoman from it dyed green — and
# the human asked for her to be fixed. Oracle of Seasons draws her as
# INTERAC_FARORE ($10): interactionData.s gives gfx header $4b
# (spr_farore_ralph), tile base $00 and b2 $02 — default animation 2,
# standard sprite palette 0. Animation 2 is interactionAnimation51d97, two
# oam frames held $10 frames each: interactionOamData4c130 (tiles 0, 2) and
# interactionOamData4c26b (the same two tiles swapped and mirrored), which is
# how the cartridge makes her sway at her desk. The tables are read from
# assets/effects/oracles-disasm/seasons/ (identical at commit 21c924a); the
# graphics are assets/npcs/oracles-disasm/seasons/spr_farore_ralph.png.
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TABLES = os.path.join(ROOT, 'assets', 'effects', 'oracles-disasm', 'seasons')
NPC_GFX = os.path.join(ROOT, 'assets', 'npcs', 'oracles-disasm', 'seasons')


def _lines(name):
    with open(os.path.join(TABLES, name)) as f:
        return [l.split(';')[0].rstrip() for l in f.read().split('\n')]


def _after(ls, label):
    k = next(i for i, l in enumerate(ls) if re.match(r'^' + label + r':', l))
    return ls[k + 1:]


def _dbs(line):
    return [int(x[1:], 16) for x in line.strip()[3:].split()]


def _dws(ls, label):
    out = []
    for l in _after(ls, label):
        t = l.strip()
        if t.startswith('.dw'):
            out.append(t[3:].strip())
        elif re.match(r'^\w+:', t) and not out:
            continue
        else:
            break
    return out


def cartridge_npc(interaction, gfx):
    """[(name suffix, rows, ramp)] for an interaction's default animation, one
    16x16 cell per distinct oam frame, the object's position at (8, 8)."""
    from PIL import Image
    for l in _lines('interactionData.s'):
        m = re.search(r'/\* \$%02x \*/ m_InteractionData \$(\w+) \$(\w+) \$(\w+)' % interaction, l)
        if m:
            b1, b2 = int(m.group(2), 16), int(m.group(3), 16)
            break
    anims = _lines('interactionAnimations.s')
    label = 'interaction%02xAnimations' % interaction
    anim = _dws(anims, label)[b2 & 0x0f]
    ptrs = _dws(anims, 'interaction%02xOamDataPointers' % interaction)
    seq = []
    for l in _after(anims, anim):
        t = l.strip()
        if not t.startswith('.db'):
            break
        seq.append(_dbs(t)[1] // 2)
    io = _lines('interactionOamData.s')
    pl = _lines('paletteData.s')
    start = pl.index('standardSpritePaletteData:') + 1
    cols = []
    for l in pl[start:]:
        m = re.search(r'm_RGB16 \$(\w+) \$(\w+) \$(\w+)', l)
        if m:
            cols.append(tuple(int(m.group(k), 16) for k in (1, 2, 3)))
    pi = (b2 >> 4) & 7
    pal = [tuple((c << 3) | (c >> 2) for c in rgb) for rgb in cols[pi * 4:pi * 4 + 4]]
    im = Image.open(os.path.join(NPC_GFX, gfx))
    per_row = im.size[0] // 8
    out, seen = [], set()
    for k in seq:
        if k in seen:
            continue
        seen.add(k)
        body = [l for l in _after(io, ptrs[k]) if l.strip()]
        entries = [_dbs(body[1 + i]) for i in range(_dbs(body[0])[0])]
        grid = [[0] * 16 for _ in range(16)]
        for y, x, t, f in reversed(entries):
            spr = ((b1 + t) & 0xff) // 2
            col, row = spr % per_row, spr // per_row
            for yy in range(16):
                for xx in range(8):
                    sx = 7 - xx if f & 0x20 else xx
                    sy = 15 - yy if f & 0x40 else yy
                    v = im.getpixel((col * 8 + sx, row * 16 + sy))
                    if v:
                        grid[y - 8 + yy][x + xx] = v
        used = sorted({v for r in grid for v in r if v},
                      key=lambda v: -(3 * pal[v][0] + 6 * pal[v][1] + pal[v][2]))
        digit = dict(zip(used, '013' if len(used) == 3 else '03'))
        inks = {d: '#%02x%02x%02x' % pal[v] for v, d in digit.items()}
        mid = inks.get('1', inks['0'])
        ramp = [inks['0'], mid, mid, inks['3']]
        out.append(([''.join(digit[v] if v else '.' for v in r) for r in grid], ramp))
    return out


def main():
    im, px, W, H = load(SHEET)
    bg = background(px, W, H)
    cells = find_sprites(px, W, H, bg, size=16, y1=200)
    art, pals = {}, {}
    for name, spec in FRAMES.items():
        idx, dx, dy = spec if isinstance(spec, tuple) else (spec, 0, 0)
        if idx >= len(cells):
            print('skip (no such cell):', name, idx)
            continue
        ox, oy = cells[idx]
        ox += dx
        oy += dy
        # `own=True`: a 16-wide cell around a 13-wide townsperson has columns
        # to spare, and on this sheet they belong to whoever is standing beside
        # them — Farore arrived with two of a fence's posts, one either side.
        rows, pal = quantise(px, ox, oy, 16, 16, bg, own=True)
        if rows is None:
            print('skip (empty):', name)
            continue
        art[name] = rows
        pals[name] = pal
    for i, (rows, ramp) in enumerate(cartridge_npc(0x10, 'spr_farore_ralph.png')):
        art['npc_farore_%d' % i] = rows
        pals['npc_farore_%d' % i] = ramp
    # Her book (S168): INTERAC $1c, which Seasons stands on her desk beside her.
    for rows, ramp in cartridge_npc(0x1c, 'spr_springflower_makuleaf_farorebook.png'):
        art['npc_farore_book'] = rows
        pals['npc_farore_book'] = ramp
    art = dict(sorted(art.items()))
    pals = {k: pals[k] for k in art}

    header = '\n'.join([
        '// NPC sprites extracted from the Oracle of Seasons NPC sheet.',
        '//',
        '// Generated by tools/rip-npcs.py — edit that, not this file.',
        '// Source sprites ripped by Trailsdegamer via spriters-resource.com;',
        "// the original artwork is Nintendo's. This is fan-work art only.",
        '//',
        '// Each sprite carries its own four colours, quantised light to dark, so',
        '// the palettes below are registered at load time rather than reusing the',
        '// hand-authored set.',
        '//',
        "// Farore (npc_farore_*) is not from the sheet: she is cut from Oracle of",
        "// Seasons' own graphics (spr_farore_ralph, INTERAC_FARORE's default",
        "// animation and palette) out of Stewmath's oracles-disasm",
        '// (github.com/Stewmath/oracles-disasm, commit 21c924a); credit to that',
        '// project and its contributors.',
    ])
    emit_module('src/data/sprites-npcs.js', header, art, pals,
                'NPC_ART', 'installNpcSprites', 'npc')
    print('emitted', len(art), 'NPC sprites')


if __name__ == '__main__':
    main()
