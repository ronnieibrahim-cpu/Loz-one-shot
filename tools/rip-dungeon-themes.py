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
    'unicorn': 'meta:3b',
}
META_NAMES = {'meta:36': "the Hero's Cave", 'meta:38': "Snake's Remains", 'meta:3b': "Unicorn's Cave"}


def meta(name, m, note, sheet, **opt):
    """A pick of metatile `m` of a `meta:` sheet, in the (name, x, y, note, sheet) shape."""
    return (name, (m % 16) * 16, (m // 16) * 16, note, dict(sheet=sheet, **opt) if opt else sheet)


def render_tileset(index):
    """All 256 metatiles of Seasons tileset `index`, 16 to a row, as an RGB image.

    Each 8x8 quarter is drawn in its OWN palette, rather than asserting one
    palette a metatile the way rip-objects does: every metatile picked here is
    single-palette (the quantiser would say so), but the unpicked ones in the
    same image need not be."""
    import importlib.util
    spec = importlib.util.spec_from_file_location('rip_objects', os.path.join(ROOT, 'tools', 'rip-objects.py'))
    ro = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(ro)
    t = ro.Tileset(index)
    im = Image.new('RGB', (256, 256), (0, 0, 0))
    for m in range(256):
        tiles, attrs = t.map[m * 8:m * 8 + 4], t.map[m * 8 + 4:m * 8 + 8]
        for q in range(4):
            a = attrs[q]
            tile = t.vram[(a >> 3) & 1].get(ro.addr(tiles[q]))
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
        return render_tileset(int(path[5:], 16))
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
    meta('nStatue', 0x15, 'the green crystal, Snake\'s Remains', 'snakes'),
    meta('nArchC1', 0xe6, 'entrance pillar, west, Snake\'s Remains', 'snakes'),
    meta('nArchC2', 0x00, 'the lit way out, Snake\'s Remains', 'snakes'),
    meta('nArchC3', 0xe6, 'entrance pillar, east, Snake\'s Remains', 'snakes'),
    #
    # THE SUNKEN PALACE wears Unicorn's Cave: red rock round a lavender floor,
    # and the one Seasons dungeon built round standing water.
    meta('uRingTL', 0xb8, 'ring corner, north-west, Unicorn\'s Cave', 'unicorn'),
    meta('uRingN', 0xb0, 'ring run, north wall, Unicorn\'s Cave', 'unicorn'),
    meta('uRingTR', 0xb9, 'ring corner, north-east, Unicorn\'s Cave', 'unicorn'),
    meta('uRingW', 0xb3, 'ring run, west wall, Unicorn\'s Cave', 'unicorn'),
    meta('uRingE', 0xb1, 'ring run, east wall, Unicorn\'s Cave', 'unicorn'),
    meta('uRingBL', 0xba, 'ring corner, south-west, Unicorn\'s Cave', 'unicorn'),
    meta('uRingS', 0xb2, 'ring run, south wall, Unicorn\'s Cave', 'unicorn'),
    meta('uRingBR', 0xbb, 'ring corner, south-east, Unicorn\'s Cave', 'unicorn'),
    meta('uKeyN', 0x70, 'key door in a north wall, Unicorn\'s Cave', 'unicorn'),
    meta('uKeyE', 0x71, 'key door in an east wall, Unicorn\'s Cave', 'unicorn'),
    meta('uKeyS', 0x72, 'key door in a south wall, Unicorn\'s Cave', 'unicorn'),
    meta('uKeyW', 0x73, 'key door in a west wall, Unicorn\'s Cave', 'unicorn'),
    meta('uShutN', 0x78, 'shutter in a north wall, Unicorn\'s Cave', 'unicorn'),
    meta('uShutE', 0x79, 'shutter in an east wall, Unicorn\'s Cave', 'unicorn'),
    meta('uShutS', 0x7a, 'shutter in a south wall, Unicorn\'s Cave', 'unicorn'),
    meta('uShutW', 0x7b, 'shutter in a west wall, Unicorn\'s Cave', 'unicorn'),
    meta('uBossN', 0x74, 'boss door in a north wall, Unicorn\'s Cave', 'unicorn'),
    meta('uBossS', 0x76, 'boss door in a south wall, Unicorn\'s Cave', 'unicorn'),
    meta('uFill', 0xa6, 'the flat red of solid rock, Unicorn\'s Cave', 'unicorn'),
    meta('uFloor', 0xa0, 'the lavender diamond floor, Unicorn\'s Cave', 'unicorn'),
    meta('uFloorAlt', 0xa5, 'the violet four-square slab, Unicorn\'s Cave', 'unicorn'),
    meta('uBlock', 0x1d, 'the push block, Unicorn\'s Cave', 'unicorn'),
    meta('uPot', 0x10, 'the pot, on its own floor, Unicorn\'s Cave', 'unicorn'),
    meta('uStatue', 0x15, 'the olive crystal, Unicorn\'s Cave', 'unicorn'),
    meta('uArchC1', 0xe6, 'entrance pillar, west, Unicorn\'s Cave', 'unicorn'),
    meta('uArchC2', 0x00, 'the lit way out, Unicorn\'s Cave', 'unicorn'),
    meta('uArchC3', 0xe6, 'entrance pillar, east, Unicorn\'s Cave', 'unicorn'),
    ('gPot',     2195,  750, 'the Seasons pot, on its own floor'),
    ('gBlock',   2243,  798, 'the raised magenta block'),
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
KEY_BACKGROUND = {'hPot', 'hStatue', 'nPot', 'nStatue', 'uPot', 'uStatue', 'urn', 'gPot', 'cPot', 'bPot', 'bStatue', 'xPot', 'xStatue', 'rPot', 'rStatue', 'kPot', 'kStatue'}


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
    cnt = Counter(p for row in block for p in row)
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
    grid = [''.join(str(idx[remap[p]]) for p in row) for row in block]
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
        grid, keep = quantise(transform(pick, read(im, x, y)))
        q = Image.new('RGB', (16, 16))
        for yy in range(16):
            for xx in range(16):
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
        block = transform(pick, read(images[sheet], x, y))
        if flipped(pick):
            note += ' (mirrored)'
        if vflipped(pick):
            note += ' (turned over)'
        if rotation(pick):
            note += ' (turned %+d)' % rotation(pick)
        before = len({p for row in block for p in row})
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
        '// oracles-disasm, commit 7584d87), assets/objects/oracles-disasm/seasons/.',
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
            L.append('  // %s — Seasons tileset $%s (%s), metatile $%02x'
                     % (note, sheet[5:], META_NAMES[sheet], (y // 16) * 16 + x // 16))
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
