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
# A pick may name a different sheet as an optional 5th element. The per-dungeon
# Seasons sheets carry rooms the stitched map does not, and they are the reason
# the Salt Pan Vault stopped drawing its pushable block with its wall's pixels.
#
# EVERY ONE OF THESE SHEETS IS TWO HALVES: a "GBC LCD Colors" simulation of the
# handheld screen and the raw "True Colors" palette, side by side. Measured on
# ancient-ruins, the left half runs mean luminance 124 / saturation 0.54 and the
# right half 92 / 0.73 — washed out versus raw, which is the signature. THE RIGHT
# HALF IS THE ONE TO PICK FROM. A tile lifted from the left half is the LCD's
# idea of the colour, not the cartridge's, and it will not sit with anything
# extracted anywhere else in this project. `laceWall` below is at x=1280 on a
# 2421-wide sheet for exactly this reason; its washed twin sits at x=68 and
# reads as bone rather than violet, which is how the mistake presents.
SHEETS = {
    'ruins': os.path.join(ROOT, 'assets/sheets/oracle-seasons-dungeon-ancient-ruins.png'),
    'crypt': os.path.join(ROOT, 'assets/sheets/oracle-seasons-dungeon-explorers-crypt.png'),
    'moth': os.path.join(ROOT, 'assets/sheets/oracle-seasons-dungeon-poison-moths-lair.png'),
    'dragon': os.path.join(ROOT, 'assets/sheets/oracle-seasons-dungeon-dancing-dragon.png'),
    # NOT SHEETS: three Seasons dungeons read straight out of the cartridge's
    # own tileset data (S160), because no rendered sheet in assets/sheets/ has
    # them. `meta:NN` is Seasons tileset $NN, built the way the Game Boy builds
    # it — graphics, layout, palettes — by tools/rip-objects.py's `Tileset`,
    # from assets/objects/oracles-disasm/seasons/. The 256 metatiles are laid
    # out 16 to a row at a 16px pitch, so a pick's coordinate is just its
    # metatile number: see `meta()` below.
    'heros': 'meta:36',
    'snakes': 'meta:38',
    # The six main dungeons' own staircases (S164), out of the same Seasons
    # tilesets tools/rip-objects.py takes their push blocks and buttons from.
    'mazeIce': 'meta:41',
    'cryptMeta': 'meta:3e',
    'mothMeta': 'meta:39',
    'dragonMeta': 'meta:3a',
    'ruinsMeta': 'meta:3c',
    'mazeFire': 'meta:42',
    # ORACLE OF AGES (S161): `ages:NN` is Ages tileset $NN, read the same way
    # out of assets/objects/oracles-disasm/ages/. The Sunken Palace wears
    # Mermaid's Cave's sunken past half ($3d), the human's pick from three Ages
    # and Seasons kits shown side by side; its whirlpool is the Ages sea's own,
    # as it is drawn UNDER the sea ($5f, the underwater present) — Seasons has
    # no whirlpool at all. `@k` renders the tileset with every animation at its
    # k-th step, which is how a whirlpool's four frames are each one pick.
    'mermaid': 'ages:3d',
    # THE COLOUR CUBE'S SPOTS (S207): Mermaid's Cave's present half ($3b),
    # the room ($521) where one cube visits three coloured floor spots.
    'mermaidNow': 'ages:3b',
    # THE KEEP'S SLATE SLOTS (S211): Ages' Ancient Tomb ($40), the room
    # ($58a) where four slates go into four slots round the stair down.
    'tomb': 'ages:40',
    'whirl0': 'ages:5f@0',
    'whirl1': 'ages:5f@1',
    'whirl2': 'ages:5f@2',
    'whirl3': 'ages:5f@3',
    # THE CORAL SPIRE'S RED AND BLUE BLOCKS (S205): Ages' Crown Dungeon ($3a),
    # one of the three dungeons dungeonsUsingToggleBlocks.s names. Its
    # raised/lowered blocks are metatiles $0e (blue, palette 6) and $0f (red,
    # palette 7), and which of the two stands up is not the layout's doing but
    # the graphics': roomGfxChanges.s func_02_7a77 copies four tiles of
    # gfx_animations_2 over VRAM $8cc0 — UNCMP_GFXH_AGES_3d (blue up, red
    # down) or _3f (red up, blue down); the toggle cutscene shows _3e
    # (both half-way) between them. `!NN` draws the tileset with
    # uncmpGfxHeaderNN applied.
    'crownA': 'ages:3a!3d',
    'crownB': 'ages:3a!3f',
    # THE ANCIENT RUINS' BELTS (S186): tileset $3c with every animation at
    # its k-th step, so each of the four conveyor steps is one pick.
    'ruins0': 'meta:3c@0',
    'ruins1': 'meta:3c@1',
    'ruins2': 'meta:3c@2',
    'ruins3': 'meta:3c@3',
    # FARORE'S ROOM (S168): Seasons tileset $4b, the room she sits in
    # (group 4 room $e8, laid out from layout group 5's room $e8).
    'farore': 'meta:4b',
    # THE HOUSES (S215): Seasons tileset $2c, the indoors of Horon Village
    # (GFXH_TILESET_INDOORS, PALH_TILESET_INDOORS_A), whose rooms are layout
    # group 4's $80-$bf (rooms/seasons/small/room04xx: the shop $af, the
    # houses $80, $90, $a4, $8d).
    'house': 'meta:2c',
    # THE CAVES (S216): Seasons tileset $31 (GFXH_TILESET_CAVE,
    # PALH_TILESET_CAVE, layout $2f), the spiked rock and speckled floor of
    # Holodrum's caves (layout group 4's $b7 and $ab; group 5's caves are the
    # same set as tileset $4f).
    'cave': 'meta:31',
}
META_NAMES = {'meta:36': "the Hero's Cave", 'meta:38': "Snake's Remains",
              'meta:41': "the Sword & Shield Maze, ice half", 'meta:3e': "the Explorer's Crypt",
              'meta:39': "the Poison Moth's Lair", 'meta:3a': 'the Dancing Dragon Dungeon',
              'meta:3c': 'the Ancient Ruins', 'meta:42': "the Sword & Shield Maze, fire half",
              'ages:3d': "Mermaid's Cave, the sunken past", 'ages:5f': 'the sea floor',
              'meta:4b': "Farore's room", 'ages:3a': 'the Crown Dungeon',
              'ages:3b': "Mermaid's Cave, the present", 'ages:40': 'the Ancient Tomb',
              'meta:2c': "Horon Village's houses", 'meta:31': "Holodrum's caves"}


def meta(name, m, note, sheet, **opt):
    """A pick of metatile `m` of a `meta:` sheet, in the (name, x, y, note, sheet) shape."""
    return (name, (m % 16) * 16, (m // 16) * 16, note, dict(sheet=sheet, **opt) if opt else sheet)


def uncmp_vram(t, ro, header):
    """`t`'s VRAM with Ages' uncmpGfxHeader`header` applied: each line
    `m_GfxHeader file, $dest, $size, $offset` copies size+1 tiles... except
    that the toggle blocks' headers name $04 and sit $40 bytes (four tiles)
    apart in a 128-tile file, so this copies exactly the tiles the four
    metatile quarters read, four, and asserts the source has them."""
    import re as _re
    body = _re.search(r'uncmpGfxHeader%s:\n(.*?)m_GfxHeaderEnd' % header,
                      ro.text('uncmpGfxHeaders.s', ro.AGES), _re.S).group(1)
    vram = {0: dict(t.vram[0]), 1: dict(t.vram[1])}
    for f, d, n, off in _re.findall(r'm_GfxHeader (\w+), \$(\w+), \$(\w+), \$(\w+)', body):
        src = ro.png_tiles(f, ro.AGES)
        dst, first = int(d, 16), int(off, 16) // 16
        assert first + 4 <= len(src), 'uncmpGfxHeader%s runs off %s' % (header, f)
        for i in range(4):
            vram[dst & 1][(dst & 0xfff0) + i * 16] = src[first + i]
    return vram


def render_tileset(index, frame=None, uncmp=None):
    """All 256 metatiles of tileset `index`, 16 to a row, as an RGB image.
    `index` is a Seasons tileset number, or ('ages', number). With `frame`,
    every animated metatile is drawn at that step of its animation.

    Each 8x8 quarter is drawn in its OWN palette, rather than asserting one
    palette a metatile the way rip-objects does: every metatile picked here is
    single-palette (the quantiser would say so), but the unpicked ones in the
    same image need not be."""
    import importlib.util
    spec = importlib.util.spec_from_file_location('rip_objects', os.path.join(ROOT, 'tools', 'rip-objects.py'))
    ro = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(ro)
    t = ro.Tileset(index)
    base = uncmp_vram(t, ro, uncmp) if uncmp else t.vram
    im = Image.new('RGB', (256, 256), (0, 0, 0))
    for m in range(256):
        tiles, attrs = t.map[m * 8:m * 8 + 4], t.map[m * 8 + 4:m * 8 + 8]
        vram = base
        if frame is not None:
            steps = t.animation_vram(m)
            if steps:
                vram = steps[frame % len(steps)][1]
        for q in range(4):
            a = attrs[q]
            tile = vram[(a >> 3) & 1].get(ro.addr(tiles[q]))
            pal = t.pals[a & 7]
            if tile is None or pal is None:
                continue
            for y in range(8):
                for x in range(8):
                    sx = 7 - x if a & 0x20 else x
                    sy = 7 - y if a & 0x40 else y
                    im.putpixel(((m % 16) * 16 + (q % 2) * 8 + x, (m // 16) * 16 + (q // 2) * 8 + y),
                                pal[tile[sy][sx]])
    return im


def open_sheet(path):
    if path.startswith('meta:'):
        idx, _, frame = path[5:].partition('@')
        return render_tileset(int(idx, 16), int(frame) if frame else None)
    if path.startswith('ages:'):
        idx, _, uncmp = path[5:].partition('!')
        idx, _, frame = idx.partition('@')
        return render_tileset(('ages', int(idx, 16)), int(frame) if frame else None, uncmp or None)
    return Image.open(path).convert('RGB')
OUT = os.path.join(ROOT, 'src/data/tiles-dungeon-themes.js')

# name, x, y, note.  The note's "xN" is the tile's occurrence count on the map,
# straight out of assets/tilesets/seasons-dungeons.json.
PICKS = [
    # ---- floors ----------------------------------------------------------
    ('ruinFloor',   531, 1290, 'x1196 sunken rosette flagstone, the ruin floor'),
    # (`ruinFloorAlt` 756,1290: drawn by nothing once S160 gave the Salt and Palace
    # themes Seasons kits; removed from the rip.)
    ('paleFloor',  1986,   42, 'x1244 pale mottled flagstone, the commonest floor on the map'),
    ('reefFloor',   659,   42, 'x201 pale blue flagstone with a scored ring'),
    # (`abyssFloor` 81,2799 was the Keep's floor until S142.)
    # (`brickFloor` 547,1434 and `forgeFloor` 579,621 were the Drowned Wood
    # Shrine's until S140 gave it the Ancient Ruins' kit; nothing else drew them.)
    # A pale panelled flagstone was wanted here and there is no clean copy of
    # one: BOTH instances on the map (693,2352 and 2148,2352) carry a stripe of
    # the room frame bled into the right edge. On a stitched map a tile touching
    # a room boundary carries the boundary, and the deduplicator cannot know
    # that is not part of the art — it is different pixels, so it is a different
    # tile, and it dedupes to itself perfectly. ALWAYS look at the contact sheet
    # before trusting a pick. The Salt Pan Vault uses `paleFloor` instead.
    # (`panelFloor`, the tan four-panel floor at 740,1499, was the Cistern's
    # until S140 gave it the Dancing Dragon's kit; nothing else drew it.)
    # (`gildFloor` 2725,444: drawn by nothing once S160 gave the Salt and Palace
    # themes Seasons kits; removed from the rip.)

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
    ('coralWall',      17,   58, 'x266 rose-bevelled block grid'),
    # (`emberWall` 499,1274, brown brick in courses, was the Shrine's wall
    # until S140.)
    # (`cryptWall` 2114,428 was the Keep's wall until S142.)
    # (`studWall` 225,396: drawn by nothing once S160 gave the Salt and Palace
    # themes Seasons kits; removed from the rip.)
    # DIRECTIONAL. A horizontal run, for the top course of a room. Never a fill.
    ('hatchWall',       1,   42, 'x196 pale wall RUN, lit face and hatched base'),
    # DIRECTIONAL. Vertical barrel-vaulting. Never a fill.
    ('forgeWall',       1, 1274, 'x12 amber wall RUN, barrel-vaulted'),
    # THE SALT PAN VAULT'S OWN WALL, and the reason the ancient-ruins sheet is
    # in this repo. `vaultBlock` and `coralWall` quantise to BYTE-IDENTICAL art
    # (they are both bevelled block grids from different rooms), and d6 was
    # drawing its wall and its pushable block with that one grid in that one
    # `marble` palette — so a block you can push was pixel-for-pixel a wall you
    # cannot. An ornate lattice is the fix because it is not a bevel at all: no
    # palette swap can make it read as a block.
    #
    # Found by looking for 16x16 blocks whose own neighbour in BOTH axes is
    # itself, which is what "tiles in both axes" means and is a property of the
    # SOURCE rather than a judgement — see the wall note above for why that
    # matters. From the True Colors half; see SHEETS.
    # (`laceWall` 1280,1492: drawn by nothing once S160 gave the Salt and Palace
    # themes Seasons kits; removed from the rip.)

    # ---- blocks and props --------------------------------------------------
    # (`cryptBlock` 1,1370 was the Keep's and the Shrine's block until S141-S142.)
    ('vaultBlock',   2066, 1467, 'x324 deeply bevelled block — also tiles as a wall'),
    ('lionHead',      129,  412, 'x10 a gilded lion mask'),
    ('urn',           900,   42, 'x80 a wide-bellied urn'),

    # ---- THE ORACLE ROOM KIT: the Tidewash Grotto's ---------------------------
    #
    # An Oracle dungeon room is 15x11 with a one-tile wall ring, and the ring is
    # not a fill: it is eight directional pieces — four corners and four runs —
    # plus the two jambs that finish a run beside a doorway. Every piece below
    # is cut from ONE room of ONE Seasons dungeon (the blue one on the True
    # Colors half of the backgrounds sheet, rooms on a 241x177 pitch from
    # 1456,26), so the corners meet the runs they were drawn to meet. The room
    # is the one at 2179,734: four walls, one doorway north, pots down both
    # sides — the plainest room in the dungeon, which is why it is the kit.
    #
    # The kit's floor, pot, block and stair come from the same room, so the
    # Grotto stops being a dungeon whose walls and floor were picked from two
    # different cartridges' rooms.
    ('gRingTL',  2179,  734, 'ring corner, north-west'),
    ('gRingN',   2195,  734, 'ring run, north wall'),
    ('gRingTR',  2403,  734, 'ring corner, north-east'),
    ('gRingW',   2179,  750, 'ring run, west wall'),
    ('gRingE',   2403,  750, 'ring run, east wall'),
    ('gRingBL',  2179,  894, 'ring corner, south-west'),
    ('gRingS',   2195,  894, 'ring run, south wall'),
    ('gRingBR',  2403,  894, 'ring corner, south-east'),
    # The north run's two jambs, from the same room's doorway at column 5.
    ('gJambNW',  2243,  734, 'north wall ends, doorway to its east'),
    ('gJambNE',  2275,  734, 'north wall ends, doorway to its west'),
    # The south and east jambs are not in the kit room — it has one door — so
    # they come from its neighbour at 1456,557, which has a doorway in each.
    ('gJambSW',  1536,  717, 'south wall ends, doorway to its east'),
    ('gJambSE',  1600,  717, 'south wall ends, doorway to its west'),
    ('gJambEN',  1680,  637, 'east wall ends, doorway below it'),
    ('gJambES',  1680,  669, 'east wall ends, doorway above it'),
    # THE WEST JAMBS ARE THE EAST ONES MIRRORED. No room on the sheet has a
    # clean west doorway, and the ring is drawn left-right symmetric — the
    # west run is the east run flipped pixel for pixel (compare gRingW/gRingE
    # in the contact sheet) — so the mirror is the source's own art.
    ('gJambWN',  1680,  637, 'west wall ends, doorway below it', {'flip': True}),
    ('gJambWS',  1680,  669, 'west wall ends, doorway above it', {'flip': True}),
    # THE DOORS IN THE RING. A Seasons key door is its own tile in each of
    # the four walls — the keyhole is drawn the right way up for the wall it
    # is in — and it sits straight in the run with no jambs beside it. The
    # four are from four rooms of the same dungeon. The shutter is the
    # portcullis panel with its teeth into the room; the dungeon has it in a
    # north wall and a south wall only, and the east and west ones are the
    # north one TURNED, which is how the cartridge stores a door for a side
    # wall: the same drawing, rotated a quarter.
    ('gKeyN',    2018,  557, 'key door in a north wall'),
    ('gKeyS',    2018,  540, 'key door in a south wall'),
    ('gKeyE',    2644,  621, 'key door in an east wall'),
    ('gKeyW',    2661,  621, 'key door in a west wall'),
    ('gShutN',   1568,  203, 'shutter in a north wall, teeth into the room'),
    ('gShutS',   2709,  363, 'shutter in a south wall, teeth into the room'),
    ('gShutE',   1568,  203, 'shutter in an east wall', {'rot': 90}),
    ('gShutW',   1568,  203, 'shutter in a west wall', {'rot': -90}),
    ('gFloor',   2211,  750, 'the blue scale-pattern floor'),
    # The same dungeon's second floor, x105 on the sheet: the scale pattern
    # with an inset slab. The Grotto draws its damp patches and worn floor
    # with it, so they read as floor and not as water.
    ('gFloorAlt', 2114,   42, 'the scale floor with an inset slab'),

    # ---- THE ORACLE ROOM KIT: the Coral Spire's ----------------------------
    #
    # Cut from the Explorer's Crypt sheet's True Colors half — the pink
    # dungeon, and the one whose walls are the Spire's colour. The crypt draws
    # its side walls TWO tiles thick (pink outer stone, then the bevel), so
    # its rooms' rings sit one column in: the entrance room's ring runs
    # x=1713..1905, y=532..692. Only the bevel is cut; the outer stone is
    # outside the room. The south jambs are from the room directly above the
    # entrance, whose south door is the entrance's north door. THERE ARE NO
    # SIDE JAMBS: the only side doorway near here is a key door in a partition
    # wall, which the source runs its wall straight up to — so a side opening
    # in the Spire is framed by plain runs (`Room.ringArt` falls back to them).
    ('cRingTL',  1713,  532, 'ring corner, north-west', 'crypt'),
    ('cRingN',   1729,  532, 'ring run, north wall', 'crypt'),
    ('cRingTR',  1905,  532, 'ring corner, north-east', 'crypt'),
    ('cRingW',   1713,  548, 'ring run, west wall', 'crypt'),
    ('cRingE',   1905,  548, 'ring run, east wall', 'crypt'),
    ('cRingBL',  1713,  692, 'ring corner, south-west', 'crypt'),
    ('cRingS',   1729,  692, 'ring run, south wall', 'crypt'),
    ('cRingBR',  1905,  692, 'ring corner, south-east', 'crypt'),
    ('cJambNW',  1793,  532, 'north wall ends, doorway to its east', 'crypt'),
    ('cJambNE',  1825,  532, 'north wall ends, doorway to its west', 'crypt'),
    ('cJambSW',  1793,  515, 'south wall ends, doorway to its east', 'crypt'),
    ('cJambSE',  1825,  515, 'south wall ends, doorway to its west', 'crypt'),
    # The crypt's solid masonry: the flat pink stone its sheet shows wherever
    # there is no room — outside the ring and in every notch of an irregular
    # room. The Spire's thick interior walls are drawn with it.
    ('cFill',    1697,  548, 'the flat pink stone of solid masonry', 'crypt'),
    ('cFloor',   1777,  548, 'the violet swirl floor', 'crypt'),
    ('cFloorAlt', 1729, 548, 'the blue tile panel floor', 'crypt'),
    ('cBlock',   1729,  404, 'the gold-framed raised block', 'crypt'),
    ('cPot',     1857,  500, 'the crypt urn, on its own floor', 'crypt'),
    # THE WAY OUT: the entrance room's two pillars standing in the south wall
    # with the lit step between them. The gold-and-green arch roofed over
    # them in the source is six to eight colours a tile and would not survive
    # four, so it is left on the sheet; the pillars and the step are clean.
    ('cArchC1',  1793,  692, 'entrance arch pillar, west', 'crypt'),
    ('cArchC2',  1809,  692, 'entrance arch, the lit way out', 'crypt'),
    ('cArchC3',  1825,  692, 'entrance arch pillar, east', 'crypt'),

    # ---- THE ORACLE ROOM KIT: the Bogwater Sanctum's -----------------------
    #
    # Cut from the Poison Moth's Lair sheet's True Colors half: blue slate
    # walls over an olive floor, which is the Sanctum's bog. Rooms sit on the
    # 241x177 pitch from 1216,10. The ring is the plain room at 1698,1249 (a
    # full 15x11 with a shutter in its east wall). The Lair frames every
    # doorway with plain runs — its open doors are a gap in the ring, with no
    # jambs — so there are none to cut, exactly as in the Explorer's Crypt.
    #
    # THE DOORS ARE THE SHEET'S OWN DOOR KEY, the strip of loose tiles the
    # ripper laid out at 2273,1430 on a 17px pitch: shutters, key doors and the
    # Oracle boss door, each drawn for the wall it stands in (the lit edge is
    # the side away from the room). The sheet draws a key door for a north and
    # a west wall only; the south and east ones are those two turned over,
    # which is how the cartridge stores a door for the opposite wall.
    ('bRingTL',  1698,  1249, 'ring corner, north-west', 'moth'),
    ('bRingN',   1714,  1249, 'ring run, north wall', 'moth'),
    ('bRingTR',  1922,  1249, 'ring corner, north-east', 'moth'),
    ('bRingW',   1698,  1265, 'ring run, west wall', 'moth'),
    ('bRingE',   1922,  1265, 'ring run, east wall', 'moth'),
    ('bRingBL',  1698,  1409, 'ring corner, south-west', 'moth'),
    ('bRingS',   1714,  1409, 'ring run, south wall', 'moth'),
    ('bRingBR',  1922,  1409, 'ring corner, south-east', 'moth'),
    # The Lair's solid masonry: the flat slate-blue it shows wherever there is
    # no room. The Sanctum's thick interior walls are drawn with it.
    ('bFill',    1216,   364, 'the flat blue of solid masonry', 'moth'),
    ('bFloor',   1762,  1265, 'the olive swirl floor', 'moth'),
    ('bFloorAlt', 1553,  1426, 'the darker octagon floor, from the entrance hall', 'moth'),
    ('bBlock',   2019,   782, 'the raised magenta block', 'moth'),
    ('bPot',     1505,  1297, 'the purple pot, on its own floor', 'moth'),
    ('bStatue',  1537,  1442, 'the gold eye statue of the entrance hall', 'moth'),
    ('bKeyN',    2273, 1464, 'key door in a north wall', 'moth'),
    ('bKeyS',    2273, 1464, 'key door in a south wall', {'sheet': 'moth', 'vflip': True}),
    ('bKeyW',    2307, 1464, 'key door in a west wall', 'moth'),
    ('bKeyE',    2307, 1464, 'key door in an east wall', {'sheet': 'moth', 'flip': True}),
    ('bShutN',   2273, 1430, 'shutter in a north wall, teeth into the room', 'moth'),
    ('bShutS',   2273, 1447, 'shutter in a south wall, teeth into the room', 'moth'),
    ('bShutW',   2307, 1430, 'shutter in a west wall, teeth into the room', 'moth'),
    ('bShutE',   2307, 1447, 'shutter in an east wall, teeth into the room', 'moth'),
    # THE BOSS DOOR. The golden horned skull the Oracle games hang over the
    # door to a boss, drawn for a north wall.
    ('bBossN',   2307, 1481, 'boss door in a north wall', 'moth'),
    # THE WAY OUT: the entrance hall's two green pillars in the south wall with
    # the lit step between them.
    ('bArch1',   1553,  1586, 'entrance pillar, west', 'moth'),
    ('bArch2',   1569,  1586, 'entrance, the lit way out', 'moth'),
    ('bArch3',   1585,  1586, 'entrance pillar, east', 'moth'),

    # ---- THE ORACLE ROOM KIT: the Cliffside Cistern's ----------------------
    #
    # Cut from the Dancing Dragon Dungeon sheet's True Colors half: grey
    # bevelled stone round a green floor, and the dungeon of the Seasons set
    # with the most standing water in it, which is the Cistern's. Rooms sit on
    # the 241x177 pitch from 1456,1 (the rows after the first gap are offset:
    # 718, 895, ... and 1789, 1966). The ring is the plain room at 2179,1603.
    # Unlike the Lair and the Crypt, the Dragon DOES draw jambs either side of
    # a north or south doorway — the bevel turning into the gap — cut from the
    # same plain room (north) and the room at 1938,355 (south). A side doorway
    # is a plain gap between runs, so there are no side jambs to cut.
    #
    # The pink squares either side of many doorways on this sheet are the
    # ripper's own markers, not cartridge art; nothing is cut from them.
    #
    # THE DOORS ARE THE SHEET'S OWN DOOR KEY, the strip of loose tiles laid out
    # at 2297,2147 on a 17px pitch. It draws the shutters for all four walls,
    # but its key doors only for the side walls and its boss door only for a
    # side wall: the north and south ones are those turned a quarter, which is
    # how the cartridge stores a door for another wall.
    ('xRingTL',  2179,  1603, 'ring corner, north-west', 'dragon'),
    ('xRingN',   2195,  1603, 'ring run, north wall', 'dragon'),
    ('xRingTR',  2403,  1603, 'ring corner, north-east', 'dragon'),
    ('xRingW',   2179,  1619, 'ring run, west wall', 'dragon'),
    ('xRingE',   2403,  1619, 'ring run, east wall', 'dragon'),
    ('xRingBL',  2179,  1763, 'ring corner, south-west', 'dragon'),
    ('xRingS',   2195,  1763, 'ring run, south wall', 'dragon'),
    ('xRingBR',  2403,  1763, 'ring corner, south-east', 'dragon'),
    ('xJambNW',  2243,  1603, 'north wall ends, doorway to its east', 'dragon'),
    ('xJambNE',  2275,  1603, 'north wall ends, doorway to its west', 'dragon'),
    ('xJambSW',  1970,   515, 'south wall ends, doorway to its east', 'dragon'),
    ('xJambSE',  2002,   515, 'south wall ends, doorway to its west', 'dragon'),
    # The Dragon's solid masonry: the flat grey it shows wherever a room is
    # cut short by rock. The Cistern's thick interior walls are drawn with it.
    ('xFill',    2355,   387, 'the flat grey of solid masonry', 'dragon'),
    ('xFloor',   2195,  1619, 'the green swirl floor', 'dragon'),
    ('xFloorAlt', 2275, 1667, 'the grey paving', 'dragon'),
    ('xBlock',   2243,  1651, 'the raised magenta block', 'dragon'),
    ('xPot',     2034,   242, 'the brown pot, on its own floor', 'dragon'),
    ('xStatue',  2018,   644, 'the blue owl statue of the entrance hall', 'dragon'),
    ('xKeyN',    2331, 2215, 'key door in a north wall', {'sheet': 'dragon', 'rot': 90}),
    ('xKeyS',    2297, 2215, 'key door in a south wall', {'sheet': 'dragon', 'rot': 90}),
    ('xKeyW',    2331, 2215, 'key door in a west wall', 'dragon'),
    ('xKeyE',    2297, 2215, 'key door in an east wall', 'dragon'),
    ('xShutN',   2297, 2147, 'shutter in a north wall, teeth into the room', 'dragon'),
    ('xShutS',   2297, 2164, 'shutter in a south wall, teeth into the room', 'dragon'),
    ('xShutW',   2331, 2147, 'shutter in a west wall, teeth into the room', 'dragon'),
    ('xShutE',   2331, 2164, 'shutter in an east wall, teeth into the room', 'dragon'),
    # THE BOSS DOOR, the horned skull, drawn on the sheet for a side wall.
    ('xBossN',   2331, 2232, 'boss door in a north wall', {'sheet': 'dragon', 'rot': -90}),
    # THE WAY OUT: the entrance hall's two green pillars in the south wall
    # with the lit step between them.
    ('xArch1',   2034,   692, 'entrance pillar, west', 'dragon'),
    ('xArch2',   2050,   692, 'entrance, the lit way out', 'dragon'),
    ('xArch3',   2066,   692, 'entrance pillar, east', 'dragon'),

    # ---- THE ORACLE ROOM KIT: the Drowned Wood Shrine's --------------------
    #
    # Cut from the Ancient Ruins sheet's True Colors half: brown bevelled
    # stone round the gold hex floor — the Shrine's drowned timber and its
    # amber floor, in the source's own hand. Rooms sit on the 241x177 pitch
    # from 1216,364 (the row after each gap is offset: 1267.., 1807..). The
    # ring is the plain room at 1939,1621. The Ruins draw jambs either side of
    # a north doorway (the entrance hall at 1698,2338) and a south one (the
    # room at 1698,1807); a side doorway is a plain gap. Its solid masonry is
    # the flat tan it shows wherever rock cuts into a room.
    #
    # THE DOORS ARE THE SHEET'S OWN DOOR KEY at 2196,2519 on a 17px pitch:
    # shutters for all four walls, and a key door and the boss door drawn for
    # a NORTH wall only — the other walls' key doors are that one turned over
    # or turned a quarter.
    ('rRingTL',  1939,  1621, 'ring corner, north-west', 'ruins'),
    ('rRingN',   1955,  1621, 'ring run, north wall', 'ruins'),
    ('rRingTR',  2163,  1621, 'ring corner, north-east', 'ruins'),
    ('rRingW',   1939,  1637, 'ring run, west wall', 'ruins'),
    ('rRingE',   2163,  1637, 'ring run, east wall', 'ruins'),
    ('rRingBL',  1939,  1781, 'ring corner, south-west', 'ruins'),
    ('rRingS',   1955,  1781, 'ring run, south wall', 'ruins'),
    ('rRingBR',  2163,  1781, 'ring corner, south-east', 'ruins'),
    ('rJambNW',  1794,  2338, 'north wall ends, doorway to its east', 'ruins'),
    ('rJambNE',  1826,  2338, 'north wall ends, doorway to its west', 'ruins'),
    ('rJambSW',  1794,  1967, 'south wall ends, doorway to its east', 'ruins'),
    ('rJambSE',  1826,  1967, 'south wall ends, doorway to its west', 'ruins'),
    ('rFill',    1922,  1855, 'the flat tan of solid masonry', 'ruins'),
    ('rFloor',   1955,  1637, 'the gold hex floor', 'ruins'),
    ('rFloorAlt', 1746, 2370, 'the sunken four-pane floor of the entrance hall', 'ruins'),
    ('rBlock',   2003,  1669, 'the raised red block', 'ruins'),
    ('rPot',     1296,  2482, 'the brown pot, on its own floor', 'ruins'),
    ('rStatue',  1762,  2386, 'the purple eye statue of the entrance hall', 'ruins'),
    ('rKeyN',    2196, 2553, 'key door in a north wall', 'ruins'),
    ('rKeyS',    2196, 2553, 'key door in a south wall', {'sheet': 'ruins', 'vflip': True}),
    ('rKeyW',    2196, 2553, 'key door in a west wall', {'sheet': 'ruins', 'rot': -90}),
    ('rKeyE',    2196, 2553, 'key door in an east wall', {'sheet': 'ruins', 'rot': 90}),
    ('rShutN',   2196, 2519, 'shutter in a north wall, teeth into the room', 'ruins'),
    ('rShutS',   2196, 2536, 'shutter in a south wall, teeth into the room', 'ruins'),
    ('rShutW',   2230, 2519, 'shutter in a west wall, teeth into the room', 'ruins'),
    ('rShutE',   2230, 2536, 'shutter in an east wall, teeth into the room', 'ruins'),
    ('rBossN',   2230, 2553, 'boss door in a north wall', 'ruins'),
    # THE WAY OUT: the entrance hall's two green pillars in the south wall
    # with the lit step between them.
    ('rArch1',   1794,  2498, 'entrance pillar, west', 'ruins'),
    ('rArch2',   1810,  2498, 'entrance, the lit way out', 'ruins'),
    ('rArch3',   1826,  2498, 'entrance pillar, east', 'ruins'),

    # ---- THE ORACLE ROOM KIT: the Abyssal Keep's ---------------------------
    #
    # Cut from the Sword & Shield Maze on the backgrounds sheet's True Colors
    # half — Seasons' own last dungeon for this game's last dungeon: a rough
    # red-brown rock ring round olive and bone tiled floors. Its rooms sit on
    # the 241x177 pitch from 1456,1274 (the plain room is 2661,2159). It draws
    # jambs on all four sides of a doorway: north ones from 1938,2336, south
    # from 1938,2159, east from 1938,2336, west from 2179,2336. It has no lit
    # entrance step on this sheet, so the Keep leaves by a gap in the ring,
    # the way the Grotto does. Its solid masonry is the flat orange it shows
    # where rock cuts into a room.
    #
    # THE DOORS: the maze's door key at 2034,2517 (17px pitch) draws key doors
    # for all four walls, and shutters twice — in olive and in brown; the
    # brown ones are the ring's. The boss door is the horned skull standing
    # in the north wall of the room at 2179,1628.
    ('kRingTL',  2661,  2159, 'ring corner, north-west'),
    ('kRingN',   2677,  2159, 'ring run, north wall'),
    ('kRingTR',  2885,  2159, 'ring corner, north-east'),
    ('kRingW',   2661,  2175, 'ring run, west wall'),
    ('kRingE',   2885,  2175, 'ring run, east wall'),
    ('kRingBL',  2661,  2319, 'ring corner, south-west'),
    ('kRingS',   2677,  2319, 'ring run, south wall'),
    ('kRingBR',  2885,  2319, 'ring corner, south-east'),
    ('kJambNW',  2018,  2336, 'north wall ends, doorway to its east'),
    ('kJambNE',  2082,  2336, 'north wall ends, doorway to its west'),
    ('kJambSW',  2018,  2319, 'south wall ends, doorway to its east'),
    ('kJambSE',  2082,  2319, 'south wall ends, doorway to its west'),
    ('kJambEN',  2162,  2416, 'east wall ends, doorway to its south'),
    ('kJambES',  2162,  2448, 'east wall ends, doorway to its north'),
    ('kJambWN',  2179,  2416, 'west wall ends, doorway to its south'),
    ('kJambWS',  2179,  2448, 'west wall ends, doorway to its north'),
    ('kFill',    1986,  1628, 'the flat orange of solid rock'),
    ('kFloor',   1970,  2368, 'the bone diamond floor'),
    ('kFloorAlt', 2709, 2191, 'the olive ring tile'),
    ('kBlock',   2002,  2400, 'the blue block'),
    ('kPot',     2195,  2352, 'the yellow pot, on its own floor'),
    ('kStatue',  2677,  2175, 'the green sprout statue'),
    ('kKeyN',    2034, 2534, 'key door in a north wall'),
    ('kKeyS',    2034, 2551, 'key door in a south wall'),
    ('kKeyW',    2068, 2534, 'key door in a west wall'),
    ('kKeyE',    2068, 2551, 'key door in an east wall'),
    ('kShutN',   2034, 2602, 'shutter in a north wall, teeth into the room'),
    ('kShutS',   2034, 2619, 'shutter in a south wall, teeth into the room'),
    ('kShutW',   2068, 2602, 'shutter in a west wall, teeth into the room'),
    ('kShutE',   2068, 2619, 'shutter in an east wall, teeth into the room'),
    ('kBossN',   2227, 1628, 'boss door in a north wall'),

    # ---- THE THREE OPTIONAL DUNGEONS' KITS (S160) --------------------------
    #
    # Read out of the cartridge's tilesets rather than off a sheet: every
    # Seasons dungeon tileset lays its metatiles out on the same plan, which
    # the room layouts in oracles-disasm/rooms/seasons/large/ show directly
    # (counted over every room that tileset draws): the ring is $b8 $b0 $b9 /
    # $b3 $b1 / $ba $b2 $bb, key doors $70-$73 and boss doors $74-$77 and
    # shutters $78-$7b in the order N E S W, the lit way out $00 between two
    # pillars $e6, the pot $10, the push block $1d. None of the three draws a
    # jamb beside an open doorway — the ring runs straight to the gap, as the
    # Explorer's Crypt's does — so there are none to cut.
    #
    # THE SALT PAN'S LOWER VAULT wears the Hero's Cave: gold masonry round a
    # grey gravel floor, which is the salt pan's own ground gone underground.
    meta('hRingTL', 0xb8, 'ring corner, north-west, the Hero\'s Cave', 'heros'),
    meta('hRingN', 0xb0, 'ring run, north wall, the Hero\'s Cave', 'heros'),
    meta('hRingTR', 0xb9, 'ring corner, north-east, the Hero\'s Cave', 'heros'),
    meta('hRingW', 0xb3, 'ring run, west wall, the Hero\'s Cave', 'heros'),
    meta('hRingE', 0xb1, 'ring run, east wall, the Hero\'s Cave', 'heros'),
    meta('hRingBL', 0xba, 'ring corner, south-west, the Hero\'s Cave', 'heros'),
    meta('hRingS', 0xb2, 'ring run, south wall, the Hero\'s Cave', 'heros'),
    meta('hRingBR', 0xbb, 'ring corner, south-east, the Hero\'s Cave', 'heros'),
    meta('hKeyN', 0x70, 'key door in a north wall, the Hero\'s Cave', 'heros'),
    meta('hKeyE', 0x71, 'key door in an east wall, the Hero\'s Cave', 'heros'),
    meta('hKeyS', 0x72, 'key door in a south wall, the Hero\'s Cave', 'heros'),
    meta('hKeyW', 0x73, 'key door in a west wall, the Hero\'s Cave', 'heros'),
    meta('hShutN', 0x78, 'shutter in a north wall, the Hero\'s Cave', 'heros'),
    meta('hShutE', 0x79, 'shutter in an east wall, the Hero\'s Cave', 'heros'),
    meta('hShutS', 0x7a, 'shutter in a south wall, the Hero\'s Cave', 'heros'),
    meta('hShutW', 0x7b, 'shutter in a west wall, the Hero\'s Cave', 'heros'),
    meta('hBossN', 0x74, 'boss door in a north wall, the Hero\'s Cave', 'heros'),
    meta('hBossS', 0x76, 'boss door in a south wall, the Hero\'s Cave', 'heros'),
    meta('hFill', 0xb0, 'the gold masonry of a wall run, the Hero\'s Cave', 'heros'),
    meta('hFloor', 0xa0, 'the grey gravel floor, the Hero\'s Cave', 'heros'),
    meta('hFloorAlt', 0xa5, 'the pebbled gravel floor, the Hero\'s Cave', 'heros'),
    meta('hBlock', 0x1d, 'the push block, the Hero\'s Cave', 'heros'),
    meta('hPot', 0x10, 'the pot, on its own floor, the Hero\'s Cave', 'heros'),
    meta('hStatue', 0x15, 'the blue crystal, the Hero\'s Cave', 'heros'),
    meta('hArchC1', 0xe6, 'entrance pillar, west, the Hero\'s Cave', 'heros'),
    meta('hArchC2', 0x00, 'the lit way out, the Hero\'s Cave', 'heros'),
    meta('hArchC3', 0xe6, 'entrance pillar, east, the Hero\'s Cave', 'heros'),
    #
    # THE GULLWIND EYRIE wears Snake's Remains: bevelled violet stone round a
    # rose floor, and the black drops its rooms open onto.
    meta('nRingTL', 0xb8, 'ring corner, north-west, Snake\'s Remains', 'snakes'),
    meta('nRingN', 0xb0, 'ring run, north wall, Snake\'s Remains', 'snakes'),
    meta('nRingTR', 0xb9, 'ring corner, north-east, Snake\'s Remains', 'snakes'),
    meta('nRingW', 0xb3, 'ring run, west wall, Snake\'s Remains', 'snakes'),
    meta('nRingE', 0xb1, 'ring run, east wall, Snake\'s Remains', 'snakes'),
    meta('nRingBL', 0xba, 'ring corner, south-west, Snake\'s Remains', 'snakes'),
    meta('nRingS', 0xb2, 'ring run, south wall, Snake\'s Remains', 'snakes'),
    meta('nRingBR', 0xbb, 'ring corner, south-east, Snake\'s Remains', 'snakes'),
    meta('nKeyN', 0x70, 'key door in a north wall, Snake\'s Remains', 'snakes'),
    meta('nKeyE', 0x71, 'key door in an east wall, Snake\'s Remains', 'snakes'),
    meta('nKeyS', 0x72, 'key door in a south wall, Snake\'s Remains', 'snakes'),
    meta('nKeyW', 0x73, 'key door in a west wall, Snake\'s Remains', 'snakes'),
    meta('nShutN', 0x78, 'shutter in a north wall, Snake\'s Remains', 'snakes'),
    meta('nShutE', 0x79, 'shutter in an east wall, Snake\'s Remains', 'snakes'),
    meta('nShutS', 0x7a, 'shutter in a south wall, Snake\'s Remains', 'snakes'),
    meta('nShutW', 0x7b, 'shutter in a west wall, Snake\'s Remains', 'snakes'),
    meta('nBossN', 0x74, 'boss door in a north wall, Snake\'s Remains', 'snakes'),
    meta('nBossS', 0x76, 'boss door in a south wall, Snake\'s Remains', 'snakes'),
    meta('nFill', 0xa6, 'the flat lilac of solid stone, Snake\'s Remains', 'snakes'),
    meta('nFloor', 0xa0, 'the rose flagstone, Snake\'s Remains', 'snakes'),
    meta('nFloorAlt', 0xa4, 'the violet four-square slab, Snake\'s Remains', 'snakes'),
    meta('nBlock', 0x1d, 'the push block, Snake\'s Remains', 'snakes'),
    meta('nPot', 0x10, 'the pot, on its own floor, Snake\'s Remains', 'snakes'),
    # The room's standing obstacle is the corner bush Snake's Remains' own
    # rooms plant in pairs (room $525: $04 in all four corners), not the
    # tileset's green crystal, which no room of that dungeon places (S162,
    # the human's pick from the two side by side).
    meta('nStatue', 0x04, 'the corner bush, Snake\'s Remains (room $525)', 'snakes'),
    meta('nArchC1', 0xe6, 'entrance pillar, west, Snake\'s Remains', 'snakes'),
    meta('nArchC2', 0x00, 'the lit way out, Snake\'s Remains', 'snakes'),
    meta('nArchC3', 0xe6, 'entrance pillar, east, Snake\'s Remains', 'snakes'),
    # Snake's Remains' chasm: the black of a drop, and the same with the lip
    # of the floor above it (the room layouts put $f5 wherever floor is north
    # of the drop and $f4 everywhere else; room $527 is the plainest).
    meta('nPit', 0xf4, 'the black of a chasm, Snake\'s Remains', 'snakes'),
    meta('nPitN', 0xf5, 'a chasm with the floor\'s lip along its top, Snake\'s Remains', 'snakes'),
    #
    # THE SUNKEN PALACE wears Oracle of Ages' Mermaid's Cave (S161), its
    # sunken past half: blue-green stone round a drowned flagstone floor, the
    # human's choice over Seasons' Unicorn's Cave. Ages draws a jamb either
    # side of every gap in the ring (room $52e: $b7/$b6 north, $b5/$b4 south,
    # $b6/$b4 down an east wall), so this kit has them and the others do not.
    meta('uRingTL', 0xb8, 'ring corner, north-west, Mermaid\'s Cave', 'mermaid'),
    meta('uRingN', 0xb0, 'ring run, north wall, Mermaid\'s Cave', 'mermaid'),
    meta('uRingTR', 0xb9, 'ring corner, north-east, Mermaid\'s Cave', 'mermaid'),
    meta('uRingW', 0xb3, 'ring run, west wall, Mermaid\'s Cave', 'mermaid'),
    meta('uRingE', 0xb1, 'ring run, east wall, Mermaid\'s Cave', 'mermaid'),
    meta('uRingBL', 0xba, 'ring corner, south-west, Mermaid\'s Cave', 'mermaid'),
    meta('uRingS', 0xb2, 'ring run, south wall, Mermaid\'s Cave', 'mermaid'),
    meta('uRingBR', 0xbb, 'ring corner, south-east, Mermaid\'s Cave', 'mermaid'),
    meta('uJambNW', 0xb7, 'jamb west of a gap in a north wall, Mermaid\'s Cave', 'mermaid'),
    meta('uJambNE', 0xb6, 'jamb east of a gap in a north wall, Mermaid\'s Cave', 'mermaid'),
    meta('uJambSW', 0xb5, 'jamb west of a gap in a south wall, Mermaid\'s Cave', 'mermaid'),
    meta('uJambSE', 0xb4, 'jamb east of a gap in a south wall, Mermaid\'s Cave', 'mermaid'),
    meta('uJambWN', 0xb7, 'jamb north of a gap in a west wall, Mermaid\'s Cave', 'mermaid'),
    meta('uJambWS', 0xb5, 'jamb south of a gap in a west wall, Mermaid\'s Cave', 'mermaid'),
    meta('uJambEN', 0xb6, 'jamb north of a gap in an east wall, Mermaid\'s Cave', 'mermaid'),
    meta('uJambES', 0xb4, 'jamb south of a gap in an east wall, Mermaid\'s Cave', 'mermaid'),
    meta('uKeyN', 0x70, 'key door in a north wall, Mermaid\'s Cave', 'mermaid'),
    meta('uKeyE', 0x71, 'key door in an east wall, Mermaid\'s Cave', 'mermaid'),
    meta('uKeyS', 0x72, 'key door in a south wall, Mermaid\'s Cave', 'mermaid'),
    meta('uKeyW', 0x73, 'key door in a west wall, Mermaid\'s Cave', 'mermaid'),
    meta('uShutN', 0x78, 'shutter in a north wall, Mermaid\'s Cave', 'mermaid'),
    meta('uShutE', 0x79, 'shutter in an east wall, Mermaid\'s Cave', 'mermaid'),
    meta('uShutS', 0x7a, 'shutter in a south wall, Mermaid\'s Cave', 'mermaid'),
    meta('uShutW', 0x7b, 'shutter in a west wall, Mermaid\'s Cave', 'mermaid'),
    meta('uBossN', 0x74, 'boss door in a north wall, Mermaid\'s Cave', 'mermaid'),
    meta('uBossS', 0x76, 'boss door in a south wall, Mermaid\'s Cave', 'mermaid'),
    meta('uFill', 0xa7, 'the flat blue of solid stone (room $534 fills with it), Mermaid\'s Cave', 'mermaid'),
    meta('uFloor', 0xa0, 'the drowned flagstone, Mermaid\'s Cave', 'mermaid'),
    meta('uFloorAlt', 0xa1, 'the grey four-square slab, Mermaid\'s Cave', 'mermaid'),
    meta('uBlock', 0x1d, 'the push block, Mermaid\'s Cave', 'mermaid'),
    meta('uPot', 0x10, 'the pot, on its own floor, Mermaid\'s Cave', 'mermaid'),
    # Mermaid's Cave stands its rooms' obstacles in magenta blocks (rooms
    # $52e, $530: runs of $1d), not the green crystal, which none of them
    # places (S162, the human's pick from the two side by side).
    # The Coral Spire's red and blue blocks (S205), Ages' Crown Dungeon. Each
    # colour raised, lowered, and the half-way picture the toggle shows.
    meta('tgBlueUp', 0x0e, 'blue block raised, the Crown Dungeon (UNCMP_GFXH_AGES_3d)', 'crownA'),
    meta('tgRedDown', 0x0f, 'red block lowered, the same', 'crownA'),
    meta('tgBlueDown', 0x0e, 'blue block lowered (UNCMP_GFXH_AGES_3f)', 'crownB'),
    meta('tgRedUp', 0x0f, 'red block raised, the same', 'crownB'),
    meta('uStatue', 0x1d, 'the magenta block, Mermaid\'s Cave (rooms $52e, $530)', 'mermaid'),
    # Its own staircases (S162), in its own stone: Ages' indoor up and down
    # stairs (TILEINDEX_INDOOR_UPSTAIRCASE $44, _DOWNSTAIRCASE $45). Every
    # dungeon had shared one hand-drawn grey stair.
    meta('uStairsUp', 0x44, 'the stair up, Mermaid\'s Cave', 'mermaid'),
    meta('uStairsDown', 0x45, 'the stair down, Mermaid\'s Cave', 'mermaid'),
    meta('uArchC1', 0xe6, 'entrance pillar, west, Mermaid\'s Cave', 'mermaid'),
    meta('uArchC2', 0x00, 'the lit way out, Mermaid\'s Cave', 'mermaid'),
    meta('uArchC3', 0xe6, 'entrance pillar, east, Mermaid\'s Cave', 'mermaid'),
    # The Palace's water: Ages' dungeon puddle ($f9, TILETYPE_PUDDLE) and its
    # deep water ($fa, TILETYPE_WATER), and a hole ($f4, TILETYPE_HOLE).
    meta('uWaterS', 0xf9, 'the shallows, Mermaid\'s Cave', 'mermaid'),
    meta('uWaterD', 0xfa, 'deep water, Mermaid\'s Cave', 'mermaid'),
    meta('uPit', 0xf4, 'a hole in the floor, Mermaid\'s Cave', 'mermaid'),
    # THE WHIRLPOOL: TILEINDEX_WHIRLPOOL $e9, as the Ages sea draws it under
    # water (tileset $5f), through animationDataWhirlpool2's four steps.
    meta('uWhirl0', 0xe9, 'the whirlpool, step 1 of 4, the Ages sea floor', 'whirl0'),
    meta('uWhirl1', 0xe9, 'the whirlpool, step 2 of 4, the Ages sea floor', 'whirl1'),
    meta('uWhirl2', 0xe9, 'the whirlpool, step 3 of 4, the Ages sea floor', 'whirl2'),
    meta('uWhirl3', 0xe9, 'the whirlpool, step 4 of 4, the Ages sea floor', 'whirl3'),
    ('gPot',     2195,  750, 'the Seasons pot, on its own floor'),
    ('gBlock',   2243,  798, 'the raised magenta block'),
    #
    # THE SIX MAIN DUNGEONS' OWN STAIRS (S164). Every one of them drew the
    # shared hand-drawn grey `dStairs` until now; each Seasons dungeon tileset
    # has its own TILEINDEX_INDOOR_UPSTAIRCASE $44 and _DOWNSTAIRCASE $45 in
    # its own colours, read from the tileset each dungeon's push block and
    # button already come from (tools/rip-objects.py THEMES).
    meta('gStairsUp', 0x44, 'the stair up, the Sword & Shield Maze (ice)', 'mazeIce'),
    meta('gStairsDown', 0x45, 'the stair down, the Sword & Shield Maze (ice)', 'mazeIce'),
    meta('cStairsUp', 0x44, 'the stair up, the Explorer\'s Crypt', 'cryptMeta'),
    meta('cStairsDown', 0x45, 'the stair down, the Explorer\'s Crypt', 'cryptMeta'),
    meta('bStairsUp', 0x44, 'the stair up, the Poison Moth\'s Lair', 'mothMeta'),
    meta('bStairsDown', 0x45, 'the stair down, the Poison Moth\'s Lair', 'mothMeta'),
    # THE SANCTUM'S DROP HOLE AND CRACKED FLOOR (S181), from the same tileset.
    # TILEINDEX_WARP_HOLE $48 and its three neighbours: the cartridge lays a
    # run of hole with $49 where floor is above it (a lip on its top two rows),
    # $4a where floor is below (a lip on its bottom row) and $4b where both are
    # (room $553, the Moth's Lair 1F ring of holes). TILEINDEX_CRACKED_FLOOR
    # $4d is the floor that gives way (room $54c).
    meta('bHole', 0x48, 'the drop hole, inside a run, the Poison Moth\'s Lair', 'mothMeta'),
    meta('bHoleN', 0x49, 'the drop hole, floor above it, the Poison Moth\'s Lair', 'mothMeta'),
    meta('bHoleS', 0x4a, 'the drop hole, floor below it, the Poison Moth\'s Lair', 'mothMeta'),
    meta('bHoleNS', 0x4b, 'the drop hole, floor above and below, the Poison Moth\'s Lair', 'mothMeta'),
    meta('bCrack', 0x4d, 'the cracked floor, the Poison Moth\'s Lair', 'mothMeta'),
    # THE CISTERN'S SPIKES AND HOLES (S183), from the Dragon's own tileset:
    # tileTypeMappings.s @dungeons lists $60 as TILETYPE_SPIKE (room $567, the
    # spike floor of 1F) and $f4 as TILETYPE_HOLE (room $55e, the pit the
    # moving platform crosses before Gohma). The Cistern drew the shared navy
    # `dPit` until now; the Dragon's hole is plain black.
    meta('xSpike', 0x60, 'the spike floor, the Dancing Dragon Dungeon', 'dragonMeta'),
    meta('xHole', 0xf4, 'the hole, the Dancing Dragon Dungeon', 'dragonMeta'),
    # THE CISTERN'S FLOOR THAT GIVES WAY (S207): TILEINDEX_CRACKED_FLOOR $4d
    # in the Dragon's own tileset, the floor of room $573 that falls away
    # behind you (d4HolesFloortrapRoom.s).
    meta('xCrack', 0x4d, 'the cracked floor, the Dancing Dragon Dungeon', 'dragonMeta'),
    # THE GROTTO'S HELD BRIDGE (S211; Ages' INTERAC_EXTENDABLE_BRIDGE,
    # extendableBridge.s): TILEINDEX_VERTICAL_BRIDGE $6a and _HORIZONTAL_BRIDGE
    # $6d, the planks it lays one at a time, and the hole $f4 (TILETYPE_HOLE)
    # they span — in the Sword & Shield Maze's ice half, the Grotto's kit.
    meta('gBridgeV', 0x6a, 'the bridge, north-south, the Sword & Shield Maze (ice)', 'mazeIce'),
    meta('gBridgeH', 0x6d, 'the bridge, east-west, the Sword & Shield Maze (ice)', 'mazeIce'),
    meta('gHole', 0xf4, 'the hole, the Sword & Shield Maze (ice)', 'mazeIce'),
    # THE KEEP'S SLATE SLOTS (S211; Ages' INTERAC_SLATE_SLOT, slateSlot.s):
    # the four empty slots $d0-$d3, one per face of the Ancient Tomb's inner
    # chamber (room $58a), and TILEINDEX_FILLED_SLATE_1 $d4 onward, what
    # slateSlot_placeSlate sets each to (subid added).
    meta('aSlotS', 0xd0, 'the slot, south face, the Ancient Tomb', 'tomb'),
    meta('aSlotE', 0xd1, 'the slot, east face, the Ancient Tomb', 'tomb'),
    meta('aSlotN', 0xd2, 'the slot, north face, the Ancient Tomb', 'tomb'),
    meta('aSlotW', 0xd3, 'the slot, west face, the Ancient Tomb', 'tomb'),
    meta('aSlateS', 0xd4, 'the filled slot, south face, the Ancient Tomb', 'tomb'),
    meta('aSlateE', 0xd5, 'the filled slot, east face, the Ancient Tomb', 'tomb'),
    meta('aSlateN', 0xd6, 'the filled slot, north face, the Ancient Tomb', 'tomb'),
    meta('aSlateW', 0xd7, 'the filled slot, west face, the Ancient Tomb', 'tomb'),
    # THE COLOUR CUBE'S SPOTS (S207): Ages' TILEINDEX_RED/YELLOW/BLUE_TOGGLE_
    # FLOOR $ad-$af, the floor a cube must come to rest on showing that colour
    # (miscPuzzles.s subid $02, Mermaid's Cave room $521).
    meta('cSpotRed', 0xad, 'the red spot, Mermaid\'s Cave', 'mermaidNow'),
    meta('cSpotYellow', 0xae, 'the yellow spot, Mermaid\'s Cave', 'mermaidNow'),
    meta('cSpotBlue', 0xaf, 'the blue spot, Mermaid\'s Cave', 'mermaidNow'),
    meta('xStairsUp', 0x44, 'the stair up, the Dancing Dragon Dungeon', 'dragonMeta'),
    meta('xStairsDown', 0x45, 'the stair down, the Dancing Dragon Dungeon', 'dragonMeta'),
    meta('rStairsUp', 0x44, 'the stair up, the Ancient Ruins', 'ruinsMeta'),
    meta('rStairsDown', 0x45, 'the stair down, the Ancient Ruins', 'ruinsMeta'),
    # THE DROWNED WOOD SHRINE'S CANOPY (S186). The Ruins' own conveyors:
    # tileTypeMappings.s @dungeons maps $54-$57 to TILETYPE_UP/RIGHT/DOWN/
    # LEFTCONVEYOR (room $c6, 2F, is their belt room), each scrolled through
    # four steps by the tileset's animation (`.db $0f` a step). And its own
    # warp hole TILEINDEX_WARP_HOLE $48 with the three lipped neighbours,
    # as the Sanctum's are cut from the Moth's Lair: the knot-holes.
    *[meta('rBelt%s%d' % (d, k), m, 'the %s conveyor, step %d of 4, the Ancient Ruins' % (n, k + 1), 'ruins%d' % k)
      for d, m, n in (('N', 0x54, 'north'), ('E', 0x55, 'east'), ('S', 0x56, 'south'), ('W', 0x57, 'west'))
      for k in range(4)],
    meta('rHole', 0x48, 'the warp hole, inside a run, the Ancient Ruins', 'ruinsMeta'),
    meta('rHoleN', 0x49, 'the warp hole, floor above it, the Ancient Ruins', 'ruinsMeta'),
    meta('rHoleS', 0x4a, 'the warp hole, floor below it, the Ancient Ruins', 'ruinsMeta'),
    meta('rHoleNS', 0x4b, 'the warp hole, floor above and below, the Ancient Ruins', 'ruinsMeta'),
    meta('kStairsUp', 0x44, 'the stair up, the Sword & Shield Maze (fire)', 'mazeFire'),
    # THE KEEP'S SHAFTS (S189), the fire half's own holes (TILETYPE_HOLE
    # $f3-$f7, tileTypeMappings.s @dungeons): $f4 inside a run, $f5 with floor
    # above it (a lip on its top rows), $f6 with floor below, $f7 both, and
    # $f3 a hole alone in the floor, rimmed all round.
    meta('kHole', 0xf4, 'the hole, inside a run, the Sword & Shield Maze (fire)', 'mazeFire'),
    meta('kHoleN', 0xf5, 'the hole, floor above it, the Sword & Shield Maze (fire)', 'mazeFire'),
    meta('kHoleS', 0xf6, 'the hole, floor below it, the Sword & Shield Maze (fire)', 'mazeFire'),
    meta('kHoleNS', 0xf7, 'the hole, floor above and below, the Sword & Shield Maze (fire)', 'mazeFire'),
    meta('kHoleOne', 0xf3, 'a hole alone in the floor, the Sword & Shield Maze (fire)', 'mazeFire'),
    # THE HOLD (S189): the Sword & Shield Maze's ICE half, tileset $41, the
    # Abyssal Keep's new floor beneath it. Its floor $a0 and the darker ring
    # $a1 (the cell under a shaft is marked with it), the ice $8c
    # (TILETYPE_ICE), the fill $a6, the wall ring $b0-$bb and its jambs
    # $b4-$b7, the doors $70-$7b (key, boss, shutter, N E S W), the magenta
    # block $1d the ice rooms stand their obstacles in, the pot $10, and the
    # holes $f3-$f7 as above.
    meta('holdFloor', 0xa0, 'the blue cobble floor, the Sword & Shield Maze (ice)', 'mazeIce'),
    meta('holdFloorAlt', 0xa1, 'the dark cobble ring, the Sword & Shield Maze (ice)', 'mazeIce'),
    meta('holdIce', 0x8c, 'the ice (TILETYPE_ICE), the Sword & Shield Maze (ice)', 'mazeIce'),
    meta('holdFill', 0xa6, 'the fill of solid stone, the Sword & Shield Maze (ice)', 'mazeIce'),
    meta('holdRingTL', 0xb8, 'ring corner, north-west, the Sword & Shield Maze (ice)', 'mazeIce'),
    meta('holdRingN', 0xb0, 'ring run, north wall, the Sword & Shield Maze (ice)', 'mazeIce'),
    meta('holdRingTR', 0xb9, 'ring corner, north-east, the Sword & Shield Maze (ice)', 'mazeIce'),
    meta('holdRingW', 0xb3, 'ring run, west wall, the Sword & Shield Maze (ice)', 'mazeIce'),
    meta('holdRingE', 0xb1, 'ring run, east wall, the Sword & Shield Maze (ice)', 'mazeIce'),
    meta('holdRingBL', 0xba, 'ring corner, south-west, the Sword & Shield Maze (ice)', 'mazeIce'),
    meta('holdRingS', 0xb2, 'ring run, south wall, the Sword & Shield Maze (ice)', 'mazeIce'),
    meta('holdRingBR', 0xbb, 'ring corner, south-east, the Sword & Shield Maze (ice)', 'mazeIce'),
    meta('holdJambNW', 0xb7, 'north wall ends, doorway to its east, the Sword & Shield Maze (ice)', 'mazeIce'),
    meta('holdJambNE', 0xb6, 'north wall ends, doorway to its west, the Sword & Shield Maze (ice)', 'mazeIce'),
    meta('holdJambSW', 0xb5, 'south wall ends, doorway to its east, the Sword & Shield Maze (ice)', 'mazeIce'),
    meta('holdJambSE', 0xb4, 'south wall ends, doorway to its west, the Sword & Shield Maze (ice)', 'mazeIce'),
    meta('holdKeyN', 0x70, 'key door in a north wall, the Sword & Shield Maze (ice)', 'mazeIce'),
    meta('holdKeyE', 0x71, 'key door in an east wall, the Sword & Shield Maze (ice)', 'mazeIce'),
    meta('holdKeyS', 0x72, 'key door in a south wall, the Sword & Shield Maze (ice)', 'mazeIce'),
    meta('holdKeyW', 0x73, 'key door in a west wall, the Sword & Shield Maze (ice)', 'mazeIce'),
    meta('holdShutN', 0x78, 'shutter in a north wall, the Sword & Shield Maze (ice)', 'mazeIce'),
    meta('holdShutE', 0x79, 'shutter in an east wall, the Sword & Shield Maze (ice)', 'mazeIce'),
    meta('holdShutS', 0x7a, 'shutter in a south wall, the Sword & Shield Maze (ice)', 'mazeIce'),
    meta('holdShutW', 0x7b, 'shutter in a west wall, the Sword & Shield Maze (ice)', 'mazeIce'),
    meta('holdBlock', 0x1d, 'the magenta block, the Sword & Shield Maze (ice)', 'mazeIce'),
    meta('holdPot', 0x10, 'the pot, on its own floor, the Sword & Shield Maze (ice)', 'mazeIce'),
    meta('holdHole', 0xf4, 'the hole, inside a run, the Sword & Shield Maze (ice)', 'mazeIce'),
    meta('holdHoleN', 0xf5, 'the hole, floor above it, the Sword & Shield Maze (ice)', 'mazeIce'),
    meta('holdHoleS', 0xf6, 'the hole, floor below it, the Sword & Shield Maze (ice)', 'mazeIce'),
    meta('holdHoleNS', 0xf7, 'the hole, floor above and below, the Sword & Shield Maze (ice)', 'mazeIce'),
    meta('holdHoleOne', 0xf3, 'a hole alone in the floor, the Sword & Shield Maze (ice)', 'mazeIce'),
    meta('kStairsDown', 0x45, 'the stair down, the Sword & Shield Maze (fire)', 'mazeFire'),
    # ---- Farore's room (S168) ------------------------------------------------
    #
    # The human asked for Farore to have her desk. Oracle of Seasons sits her
    # behind one (INTERAC_FARORE at y$28 x$58 in group 4 room $e8, her book
    # INTERAC $1c on the desk), in a room of blue flagstone with a ring of
    # stone, two pillars a side and a rug behind the desk. Its tileset is $4b;
    # the layout is room $e8 of layout group 5 (rooms/seasons/large/room05e8).
    # The braziers either side are the game's lit Torch, not cut here: their
    # metatile mixes two palettes (flame and bowl), as the Torch entity does.
    meta('frRingTL', 0xb8, "ring corner, north-west, Farore's room", 'farore'),
    meta('frRingN', 0xb0, "ring run, north wall, Farore's room", 'farore'),
    meta('frRingTR', 0xb9, "ring corner, north-east, Farore's room", 'farore'),
    meta('frRingW', 0xb3, "ring run, west wall, Farore's room", 'farore'),
    meta('frRingE', 0xb1, "ring run, east wall, Farore's room", 'farore'),
    meta('frRingBL', 0xba, "ring corner, south-west, Farore's room", 'farore'),
    meta('frRingS', 0xb2, "ring run, south wall, Farore's room", 'farore'),
    meta('frRingBR', 0xbb, "ring corner, south-east, Farore's room", 'farore'),
    meta('frJambSW', 0xe2, "jamb west of the door in the south wall, Farore's room", 'farore'),
    meta('frDoor', 0xe3, "the door in the south wall, Farore's room", 'farore'),
    meta('frJambSE', 0xe4, "jamb east of the door in the south wall, Farore's room", 'farore'),
    meta('frFloor', 0xa0, "blue flagstone floor, Farore's room", 'farore'),
    meta('frCarpet', 0xa3, "the red carpet before the desk, Farore's room", 'farore'),
    meta('frRug', 0xac, "the rug behind the desk, Farore's room", 'farore'),
    meta('frPillarT', 0x68, "pillar, top half, Farore's room", 'farore'),
    meta('frPillarB', 0x69, "pillar, bottom half, Farore's room", 'farore'),
    meta('frDeskW', 0x8e, "her desk, west end, Farore's room", 'farore'),
    meta('frDesk', 0x8d, "her desk, a middle run, Farore's room", 'farore'),
    meta('frDeskE', 0x8f, "her desk, east end, Farore's room", 'farore'),
    # ---- The houses (S215) ---------------------------------------------------
    #
    # Our shop, homes and lighthouse were grey stone boxes. Seasons' houses
    # are these: a wooden ring, a plank floor, and the furniture, all laid
    # out in the cartridge's own rooms (see the `house` sheet above).
    meta('hwTL', 0xb8, "wall corner, north-west, Horon Village's houses", 'house'),
    meta('hwN', 0xb0, "wall, north, Horon Village's houses", 'house'),
    meta('hwTR', 0xb9, "wall corner, north-east, Horon Village's houses", 'house'),
    meta('hwW', 0xb3, "wall, west, Horon Village's houses", 'house'),
    meta('hwE', 0xb1, "wall, east, Horon Village's houses", 'house'),
    meta('hwBL', 0xba, "wall corner, south-west, Horon Village's houses", 'house'),
    meta('hwS', 0xb2, "wall, south, Horon Village's houses", 'house'),
    meta('hwBR', 0xbb, "wall corner, south-east, Horon Village's houses", 'house'),
    meta('hwDoorW', 0xe0, "the doorway in the south wall, west half, Horon Village's houses", 'house', quarters=[1]),
    meta('hwDoorWU', 0xe0, "the doorway in the south wall, west half, Horon Village's houses, the quarters in its other palette", 'house', quarters=[0, 2, 3]),
    meta('hwDoorE', 0xe1, "the doorway in the south wall, east half, Horon Village's houses", 'house', quarters=[0]),
    meta('hwDoorEU', 0xe1, "the doorway in the south wall, east half, Horon Village's houses, the quarters in its other palette", 'house', quarters=[1, 2, 3]),
    meta('hwClock', 0xdf, "the clock on the north wall, Horon Village's houses", 'house'),
    meta('hwFloor', 0xa0, "plank floor, Horon Village's houses", 'house'),
    meta('hwRug', 0xa1, "the green rug, Horon Village's houses", 'house'),
    meta('hwBack', 0xa6, "the floor behind the shop counter, Horon Village's houses", 'house'),
    meta('hwCounter', 0xe8, "the shop counter, Horon Village's houses", 'house', quarters=[0, 1]),
    meta('hwCounterU', 0xe8, "the shop counter, Horon Village's houses, the quarters in its other palette", 'house', quarters=[2, 3]),
    meta('hwBedT', 0x5e, "bed, head, Horon Village's houses", 'house', quarters=[0, 1]),
    meta('hwBedTU', 0x5e, "bed, head, Horon Village's houses, the quarters in its other palette", 'house', quarters=[2, 3]),
    meta('hwBedB', 0x5f, "bed, foot, Horon Village's houses", 'house'),
    meta('hwWardT', 0x58, "wardrobe, top, Horon Village's houses", 'house'),
    meta('hwWardB', 0x59, "wardrobe, foot, Horon Village's houses", 'house', quarters=[0, 1]),
    meta('hwWardBU', 0x59, "wardrobe, foot, Horon Village's houses, the quarters in its other palette", 'house', quarters=[2, 3]),
    meta('hwShelfT', 0x5a, "dresser, top, Horon Village's houses", 'house'),
    meta('hwShelfB', 0x5b, "dresser, foot, Horon Village's houses", 'house', quarters=[0, 1]),
    meta('hwShelfBU', 0x5b, "dresser, foot, Horon Village's houses, the quarters in its other palette", 'house', quarters=[2, 3]),
    meta('hwTableW', 0x89, "table, west half, Horon Village's houses", 'house'),
    meta('hwTableE', 0x8a, "table, east half, Horon Village's houses", 'house'),
    meta('hwStool', 0x88, "stool, Horon Village's houses", 'house'),
    meta('hwChair', 0x5d, "chair, Horon Village's houses", 'house'),
    meta('hwBox', 0x8b, "little table, Horon Village's houses", 'house'),
    meta('hwPot', 0x10, "the pot (TILEINDEX_DUNGEON_POT, 'dungeons, indoors'), Horon Village's houses", 'house'),
    meta('hwJar', 0x86, "green jar, Horon Village's houses", 'house'),
    meta('hwCabinet', 0x9c, "the shop cabinet, Horon Village's houses", 'house'),
    meta('hwHearthT', 0x80, "fireplace, top corner, Horon Village's houses", 'house'),
    meta('hwHearthTM', 0x83, "fireplace, top middle, Horon Village's houses", 'house', quarters=[0, 1]),
    meta('hwHearthTMU', 0x83, "fireplace, top middle, Horon Village's houses, the quarters in its other palette", 'house', quarters=[2, 3]),
    meta('hwHearthB', 0x81, "fireplace, foot corner, Horon Village's houses", 'house', quarters=[0, 1]),
    meta('hwHearthBU', 0x81, "fireplace, foot corner, Horon Village's houses, the quarters in its other palette", 'house', quarters=[2, 3]),
    meta('hwHearthBM', 0x82, "fireplace, the fire, Horon Village's houses", 'house', quarters=[0, 1]),
    meta('hwHearthBMU', 0x82, "fireplace, the fire, Horon Village's houses, the quarters in its other palette", 'house', quarters=[2, 3]),
    meta('hwStairsUp', 0x44, "the stair up, Horon Village's houses", 'house'),
    meta('hwStairsDown', 0x45, "the stair down, Horon Village's houses", 'house'),
    meta('hwCrate', 0x1c, "crate, Horon Village's houses", 'house'),
    meta('hwRugEdge', 0x92, "the rug's border at the foot of the beds, Horon Village's houses", 'house', quarters=[0, 1]),
    meta('hwRugEdgeU', 0x92, "the rug's border at the foot of the beds, Horon Village's houses, the quarters in its other palette", 'house', quarters=[2, 3]),
    meta('hwCupboard', 0x8c, "cupboard, Horon Village's houses", 'house'),
    meta('hwMat', 0xac, "the patterned mat in the shop's corner, Horon Village's houses", 'house'),
    meta('cvFloor', 0xa0, "speckled floor, Holodrum's caves", 'cave'),
    meta('cvFloorB', 0xa1, "speckled floor, the busier one, Holodrum's caves", 'cave'),
    meta('cvFill', 0xa7, "the rock behind the walls, Holodrum's caves", 'cave'),
    meta('cvN', 0xb0, "wall, north, Holodrum's caves", 'cave'),
    meta('cvE', 0xb1, "wall, east, Holodrum's caves", 'cave'),
    meta('cvS', 0xb2, "wall, south, Holodrum's caves", 'cave'),
    meta('cvW', 0xb3, "wall, west, Holodrum's caves", 'cave'),
    meta('cvCNW', 0xb4, "wall, the corner of a block whose faces look north and west, Holodrum's caves", 'cave'),
    meta('cvCNE', 0xb5, "wall, the corner of a block whose faces look north and east, Holodrum's caves", 'cave'),
    meta('cvCSW', 0xb6, "wall, the corner of a block whose faces look south and west, Holodrum's caves", 'cave'),
    meta('cvCSE', 0xb7, "wall, the corner of a block whose faces look south and east, Holodrum's caves", 'cave'),
    meta('cvTL', 0xb8, "wall corner, north-west, Holodrum's caves", 'cave'),
    meta('cvTR', 0xb9, "wall corner, north-east, Holodrum's caves", 'cave'),
    meta('cvBL', 0xba, "wall corner, south-west, Holodrum's caves", 'cave'),
    meta('cvBR', 0xbb, "wall corner, south-east, Holodrum's caves", 'cave'),
    meta('cvDoor', 0x36, "the way out in the south wall, Holodrum's caves", 'cave'),
    meta('cvPot', 0x10, "the pot, Holodrum's caves", 'cave'),
    meta('cvRock', 0x15, "the rock, Holodrum's caves", 'cave'),
    meta('cvStairsDown', 0x45, "the stair down, Holodrum's caves", 'cave'),
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
# `uStatue` is not in it (S162): Mermaid's Cave's magenta block fills its
# whole cell, so its dark faces ARE its border run, and keying ate them.
KEY_BACKGROUND = {'hPot', 'hStatue', 'nPot', 'nStatue', 'uPot', 'urn', 'gPot', 'cPot', 'bPot', 'bStatue', 'xPot', 'xStatue', 'rPot', 'rStatue', 'kPot', 'kStatue', 'holdPot'}


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
    # A pixel of None is outside the pick's `quarters` (S215): it is not a
    # colour, it is transparent, and it does not take one of the four slots.
    cnt = Counter(p for row in block for p in row if p is not None)
    ranked = sorted(cnt.items(), key=lambda kv: (-kv[1], kv[0]))
    keep = sorted((c for c, _ in ranked[:4]), key=lambda c: (-lum(c), c))
    # NEAREST IN RGB, NOT IN LUMINANCE. This used to read
    # `min(keep, key=lambda k: ((lum(k) - lum(c)) ** 2, k))`, which is hue-blind,
    # and on a tile that spends its four slots across two different hues the
    # dropped colours cross over into the wrong one. `studWall` — d4 Cliffside
    # Cistern's wall, and the only pick here with more than four colours — is
    # gold studs on blue, and it came out as neither: its mid-blue #5c8eb0
    # (luminance 131) landed on the GOLD #856b2b (108) rather than the blue
    # #85b2cf (168), while the light gold #dbb969 (186) landed on the pale BLUE
    # #abcfe6 (199). The two hues swapped, the black separators between the
    # courses dissolved, and a wall of clean vertical bands drew as gold
    # tracery scribbled over blue.
    #
    # STILL REPRODUCIBLE, which is the property the luminance version was
    # chosen for and the reason ripkit's search was rejected (see the docstring
    # above): the tie-break on `k` is what makes it deterministic, not the
    # metric, and it is kept. Squared RGB distance ties no more often than
    # squared luminance distance does, and the same tie-break settles both.
    #
    # ONLY TILES WITH MORE THAN FOUR COLOURS CAN MOVE. At four or fewer, `keep`
    # holds every colour the tile has and each one remaps to itself under any
    # metric — so this cannot disturb a pick that was already exact.
    remap = {c: min(keep, key=lambda k: (sum((a - b) ** 2 for a, b in zip(k, c)), k))
             for c in cnt}
    idx = {c: i for i, c in enumerate(keep)}
    grid = [''.join('.' if p is None else str(idx[remap[p]]) for p in row) for row in block]
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


def unpack(pick):
    """(name, x, y, note[, sheet | {sheet, flip}]) -> (name, x, y, note, path)."""
    if len(pick) == 5:
        o = pick[4]
        if isinstance(o, dict):
            return pick[0], pick[1], pick[2], pick[3], SHEETS[o['sheet']] if 'sheet' in o else DG
        return pick[0], pick[1], pick[2], pick[3], SHEETS[o]
    return pick[0], pick[1], pick[2], pick[3], DG


def flipped(pick):
    """Is this pick the source mirrored left-right."""
    return len(pick) == 5 and isinstance(pick[4], dict) and pick[4].get('flip')


def vflipped(pick):
    """Is this pick the source turned upside down."""
    return len(pick) == 5 and isinstance(pick[4], dict) and pick[4].get('vflip')


def rotation(pick):
    """Quarter turns clockwise to apply (90 or -90), or 0."""
    return pick[4].get('rot', 0) if len(pick) == 5 and isinstance(pick[4], dict) else 0


def transform(pick, block):
    """Apply a pick's mirror and quarter turn to a 16x16 block of pixels."""
    if flipped(pick):
        block = [row[::-1] for row in block]
    if vflipped(pick):
        block = block[::-1]
    r = rotation(pick)
    if r == 90:       # clockwise: new[y][x] = old[15-x][y]
        block = [[block[15 - x][y] for x in range(16)] for y in range(16)]
    elif r == -90:    # anticlockwise: new[y][x] = old[x][15-y]
        block = [[block[x][15 - y] for x in range(16)] for y in range(16)]
    return block


def quarters(pick, block):
    """Keep only the 8x8 quarters a pick names (`quarters`: 0 TL, 1 TR, 2 BL,
    3 BR) and make the rest transparent (None). A Seasons metatile draws each
    quarter in its own palette; one that mixes two is cut as two picks, one
    per palette, the second drawn exactly beneath the first (`underExact`),
    so neither is squeezed into four colours (S215, the houses)."""
    q = pick[4].get('quarters') if len(pick) == 5 and isinstance(pick[4], dict) else None
    if q is None:
        return block
    return [[p if ((y // 8) * 2 + x // 8) in q else None for x, p in enumerate(row)]
            for y, row in enumerate(block)]


def hexc(c):
    return '#%02x%02x%02x' % c


def read(im, x, y):
    return [[im.getpixel((x + cx, y + cy)) for cx in range(16)] for cy in range(16)]


def contact_sheet(images, path):
    """Every pick, source above and 4-colour result below. LOOK AT IT."""
    S, COLS = 4, 6
    cw, ch = 16 * S + 8, 16 * S * 2 + 26
    out = Image.new('RGB', (COLS * cw, ((len(PICKS) + COLS - 1) // COLS) * ch), (24, 24, 32))
    dr = ImageDraw.Draw(out)
    for i, pick in enumerate(PICKS):
        name, x, y, note, sheet = unpack(pick)
        im = images[sheet]
        grid, keep = quantise(quarters(pick, transform(pick, read(im, x, y))))
        q = Image.new('RGB', (16, 16))
        for yy in range(16):
            for xx in range(16):
                if grid[yy][xx] != '.':
                    q.putpixel((xx, yy), keep[int(grid[yy][xx])])
        gx, gy = (i % COLS) * cw, (i // COLS) * ch
        out.paste(im.crop((x, y, x + 16, y + 16)).resize((16 * S, 16 * S), Image.NEAREST), (gx + 4, gy + 2))
        out.paste(q.resize((16 * S, 16 * S), Image.NEAREST), (gx + 4, gy + 4 + 16 * S))
        dr.text((gx + 4, gy + 8 + 32 * S), name[:14], fill=(200, 200, 160))
    out.save(path)
    print('wrote ' + path)


def main():
    images = {}
    for pick in PICKS:
        sheet = unpack(pick)[4]
        if sheet not in images:
            images[sheet] = open_sheet(sheet)

    if '--sheet' in sys.argv:
        contact_sheet(images, os.path.join(ROOT, 'dungeon-themes-contact.png'))
        return 0

    arts, pals, lossy = [], [], []
    for pick in PICKS:
        name, x, y, note, sheet = unpack(pick)
        block = quarters(pick, transform(pick, read(images[sheet], x, y)))
        if flipped(pick):
            note += ' (mirrored)'
        if vflipped(pick):
            note += ' (turned over)'
        if rotation(pick):
            note += ' (turned %+d)' % rotation(pick)
        before = len({p for row in block for p in row if p is not None})
        grid, keep = quantise(block)
        if name in KEY_BACKGROUND:
            grid = key_background(grid)
        if before > 4:
            lossy.append((name, before))
        arts.append((name, note, x, y, grid, sheet))
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
        '// The three optional dungeons\' kits (S160) are read instead out of the',
        '// cartridge\'s own tilesets: Stewmath\'s oracles-disasm (github.com/Stewmath/',
        '// oracles-disasm, commit 7584d87), assets/objects/oracles-disasm/seasons/ —',
        '// and the Sunken Palace\'s (S161) out of Oracle of Ages\', from the same',
        '// commit, assets/objects/oracles-disasm/ages/.',
        '// Credit: the oracles-disasm project and its contributors; the artwork is',
        '// Nintendo\'s and Capcom\'s. Fan-work art only.',
        '//',
        '// A tile in KEY_BACKGROUND is an OBJECT, and the floor the source drew behind',
        '// it has been keyed to `.` — transparent. Its tiledef must name an `underArt`,',
        '// or it draws a hole.',
        '',
        "import { registerPalettes } from '../gfx/palettes.js';",
        '',
        'export const DUNGEON_THEME_ART = {',
    ]
    for name, note, x, y, grid, sheet in arts:
        if sheet.startswith('meta:'):
            base = sheet.split('@')[0]
            L.append('  // %s — Seasons tileset $%s (%s), metatile $%02x'
                     % (note, base[5:], META_NAMES[base], (y // 16) * 16 + x // 16))
        elif sheet.startswith('ages:'):
            base = sheet.split('@')[0].split('!')[0]
            L.append('  // %s — Ages tileset $%s (%s), metatile $%02x'
                     % (note, base[5:], META_NAMES[base], (y // 16) * 16 + x // 16))
        else:
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
