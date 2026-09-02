#!/usr/bin/env python3
"""Extract Thalassia's peoples from the Oracle of Seasons non-human races sheet.

Sprites ripped by Mister Mike via spriters-resource.com; the original artwork is
Nintendo's. Fan-work use only.

WHO THESE PEOPLE ARE IS OURS. The sheet supplies four silhouettes — a hooded
figure, a capped seafarer, a kerchiefed woman and a speckled reptile — and the
Oracles' own palette-swap trick supplies the rest: one hood in four colours is
four peoples, which is exactly how the source games fill a town. What they are
called, where they live and what they say is this game's, not theirs.

  Salters   hooded in orange oilskin — the salt pans and the working shore
  Kelpers   the same hood in green — the Drowned Wood and the Bogwater
  Brinekin  blue-capped seafarers — Tidewatch and the fishing hamlets
  Reefkin   speckled and web-footed — the Coral Reef

THE SHEET'S GEOMETRY, because it is not the one every other ripper here uses.
The sprite area is a grid of 16x16 frames on WHITE cell backings, laid over the
sheet's own green, at a pitch of 17 (one green column between frames). So a
frame carries TWO background colours and neither can be sniffed from the corner
of the cell: the white backing reaches the corner on some frames and the green
reaches it on others. Both are flooded inward from the frame's border instead,
which is also what keeps a colour the sprite encloses — see rip-terrain.py's
quantise_prop for the same argument and docs/HANDOFF.md for what it cost the
first time somebody tested colour equality instead.

The side frames on this sheet face LEFT. The engine mirrors `_s` and never draws
a left-facing frame, so they are flipped on the way out.

Regenerate with:  python3 tools/rip-races.py
"""
import sys, os

sys.path.insert(0, os.path.dirname(__file__))
from ripkit import load, lum, emit_module

SHEET = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    'assets', 'sheets', 'oracle-seasons-nonhuman-races.png')

# The two backgrounds a frame can sit on: the sheet's green and the cell backing.
BACKGROUNDS = [(0, 128, 0), (255, 255, 255)]

# Engine sprite name -> (x, y) of its 16x16 frame on the sheet, plus a flip flag
# for the frames the sheet draws facing left.
FRAMES = {
    # The hood, front / back / side. One drawing, four peoples.
    'npc_salter_d':   (815, 630, False),
    'npc_salter_u':   (832, 630, False),
    'npc_salter_s':   (849, 630, True),
    'npc_kelper_d':   (815, 601, False),
    'npc_kelper_u':   (832, 601, False),
    'npc_kelper_s':   (849, 601, True),
    # Front only: these two are the same drawing in the sheet's other two hood
    # colours, so they are dressing for a crowd rather than characters who walk.
    'npc_hood_red':   (1215, 635, False),
    'npc_hood_blue':  (1249, 635, False),

    # The capped seafarers. The sheet has no side view of this figure, and the
    # NPC's own spriteName() falls back to the down list, so none is invented.
    'npc_brine_d':    (815, 555, False),
    # 988, not 985. The window was three pixels left of the sprite, so it took
    # a stripe of the sheet's green down one side and left three columns of the
    # seafarer's back outside the cell. It is the tree lesson again: a window is
    # the object's bounding box, and on a packed sheet you cannot find that by
    # looking for background — measure the ink.
    'npc_brine_u':    (988, 555, False),
    'npc_brinewife':  (917, 555, False),

    # The reef people.
    'npc_reefkin_d':  (815, 653, False),
    'npc_reefkin_u':  (900, 653, False),
    'npc_reefkin_r':  (951, 653, False),
}


def _own_blob(clear):
    """The biggest eight-connected run of not-cleared cells in a 16x16 frame."""
    seen = [[False] * 16 for _ in range(16)]
    best = set()
    for sy in range(16):
        for sx in range(16):
            if seen[sy][sx] or clear[sy][sx]:
                continue
            comp, stack = set(), [(sx, sy)]
            seen[sy][sx] = True
            while stack:
                cx, cy = stack.pop()
                comp.add((cx, cy))
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        nx, ny = cx + dx, cy + dy
                        if 0 <= nx < 16 and 0 <= ny < 16 and not seen[ny][nx] and not clear[ny][nx]:
                            seen[ny][nx] = True
                            stack.append((nx, ny))
            if len(comp) > len(best):
                best = comp
    return best


def quantise_frame(px, ox, oy, flip):
    """One 16x16 frame -> (rows of '0-3'/'.', its own colours lightest first).

    Transparency is flooded inward from the frame's border across BOTH sheet
    backgrounds; everything the flood does not reach is artwork, including any
    white the sprite itself encloses.
    """
    bg = set(BACKGROUNDS)
    clear = [[False] * 16 for _ in range(16)]
    stack = [(i, e) for i in range(16) for e in (0, 15)]
    stack += [(e, i) for i in range(16) for e in (0, 15)]
    seen = set()
    while stack:
        cx, cy = stack.pop()
        if not (0 <= cx < 16 and 0 <= cy < 16) or (cx, cy) in seen:
            continue
        if px[ox + cx, oy + cy] not in bg:
            continue
        seen.add((cx, cy))
        clear[cy][cx] = True
        stack += [(cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)]

    # WHATEVER IS LEFT THAT IS NOT THIS SPRITE CAME FROM THE CELL NEXT DOOR.
    # The flood above clears background reachable from the border; it cannot
    # clear a neighbour's ink, which is the same colour as artwork. A 16-wide
    # cell around a 13-wide figure has columns to spare and on this sheet they
    # belong to whoever is standing in them.
    keep = _own_blob(clear)
    for y in range(16):
        for x in range(16):
            if not clear[y][x] and (x, y) not in keep:
                clear[y][x] = True

    cols = sorted({px[ox + x, oy + y] for y in range(16) for x in range(16)
                   if not clear[y][x]}, key=lambda c: (-lum(c), c))
    if not cols:
        return None, None
    if len(cols) > 4:
        raise SystemExit('rip-races: frame at (%d,%d) has %d colours, 4 slots'
                         % (ox, oy, len(cols)))
    idx = {c: i for i, c in enumerate(cols)}
    pal = ['#%02x%02x%02x' % c for c in cols]
    while len(pal) < 4:
        pal.append(pal[-1])

    rows = []
    for y in range(16):
        row = []
        for x in range(16):
            sx = 15 - x if flip else x
            row.append('.' if clear[y][sx] else str(idx[px[ox + sx, oy + y]]))
        rows.append(''.join(row))
    return rows, pal


def main():
    im, px, W, H = load(SHEET)
    art, pals = {}, {}
    for name, (x, y, flip) in FRAMES.items():
        rows, pal = quantise_frame(px, x, y, flip)
        if rows is None:
            print('skip (empty):', name)
            continue
        art[name] = rows
        pals[name] = pal

    header = '\n'.join([
        '// Thalassia\'s peoples, extracted from the Oracle of Seasons non-human',
        '// races sheet.',
        '//',
        '// Generated by tools/rip-races.py — edit that, not this file.',
        '// Source sprites ripped by Mister Mike via spriters-resource.com;',
        "// the original artwork is Nintendo's. This is fan-work art only.",
        '//',
        '// The sheet supplies the silhouettes; who these people are is this',
        "// game's. One hood in four colours is four peoples — the Oracles' own",
        '// palette-swap trick, and the reason a town on that cartridge is full',
        '// of faces without being full of drawings.',
        '//',
        '// Each sprite carries its own colours, quantised light to dark, so a',
        '// draw site that passes no palette gets the cartridge\'s.',
    ])
    emit_module('src/data/sprites-races.js', header, art, pals,
                'RACE_ART', 'installRaceSprites', 'npc')
    print('emitted', len(art), 'race sprites')


if __name__ == '__main__':
    main()
