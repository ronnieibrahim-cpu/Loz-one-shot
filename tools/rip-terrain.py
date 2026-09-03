#!/usr/bin/env python3
"""Extract background terrain tiles from the reference sheets.

  python3 tools/rip-terrain.py                  # rewrite src/data/tiles-terrain.js
  python3 tools/rip-terrain.py --scan ow X0 Y0 X1 Y1     # rank a region's tiles
  python3 tools/rip-terrain.py --supercells ow [N]       # multi-cell ground?
  python3 tools/rip-terrain.py --phase sp X0 Y0 X1 Y1     # where is the grid?

`docs/ART-DIRECTION.md` names `assets/sheets/custom-oracle-style-overworld.png`
and `assets/sheets/oracle-seasons-dungeon-backgrounds.png` the references for
overworld and dungeon terrain, and says to extract from them rather than
approximate. Both sheets are assembled *maps*, not tile palettes, so there is no
cell grid to walk the way `rip-enemies.py` walks the enemy sheet — each map
block sits at its own origin. `PICKS` below therefore records one hand-verified
16x16 source rectangle per tile.

How each rectangle was found, so it can be redone for a tile not listed here:

  A ground tile is the 16x16 window that repeats at +16 in x *and* +16 in y. A
  window that passes that test is both correctly phased and seamless by
  construction, which is exactly the property `docs/ART-DIRECTION.md` demands of
  terrain. Scanning a region for windows that pass, collapsing the 256 cyclic
  phase shifts of each hit onto one key and ranking by area covered hands back
  the region's tile set. The scratch script that does it is not committed; the
  paragraph above is the whole algorithm.

What this tool deliberately does NOT do:

  * It does not touch the palettes. Every tile here keeps the palette its
    definition in `tiles-core.js` already binds, so the palette-swap variants
    (`grassDark`, `saltFlat`, `iceFloor`, `rockFloorRust`, ...) keep working and
    the game's colour scheme does not shift under the extracted enemy sprites.
    The four source colours are emitted alongside as `*_SRC` for reference.
  * It does not extract animated tiles. The sheets are static maps and hold no
    second frame, so water stays hand-drawn.

Source sheets are Nintendo's artwork (dungeon backgrounds) and a fan-made
Oracle-style tileset; see `assets/sheets/README.md` for ripper credit.
"""

import os
import sys
from collections import Counter

try:
    from PIL import Image, ImageDraw
except ImportError:
    sys.exit("rip-terrain: needs Pillow — run `pip install pillow`")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OW = os.path.join(ROOT, 'assets/sheets/custom-oracle-style-overworld.png')
DG = os.path.join(ROOT, 'assets/sheets/oracle-seasons-dungeon-backgrounds.png')
AG = os.path.join(ROOT, 'assets/sheets/oracle-ages-overworld.png')
SB = os.path.join(ROOT, 'assets/sheets/oracle-seasons-tileset-subrosia.png')
SP = os.path.join(ROOT, 'assets/sheets/oracle-seasons-overworld-spring.png')
OUT = os.path.join(ROOT, 'src/data/tiles-terrain.js')

# art name -> (sheet, x, y, note). The note is what the tile is on the sheet,
# which is worth recording because the coordinates alone say nothing.
PICKS = [
    # THE GROUND YOU STAND ON. `grass` had never been extracted: it was a
    # hand-drawn field of one tone with about fourteen dark speckles in a fixed
    # constellation, and repeated across a screen those speckles ARE the visible
    # grid docs/SESSION-HANDOFF.md `A2` describes. Rendered as a whole 10x8 room
    # it reads as a regular lattice of dots, because the eye locks onto sparse
    # marks that recur on a 16-pixel pitch.
    #
    # This is Seasons' own field grass: a fine, dense, irregular speckle of the
    # LIGHT tone over the mid one, at a density where no individual mark is a
    # landmark, so there is nothing for the eye to line up. Tiled across a room
    # it has no grid at all — not because it is varied, but because it has no
    # feature large enough to repeat.
    ('grass',       SP, 1095,  420, 'field grass, fine even speckle'),
    ('grassTuft',   OW, 1611,  307, 'grass with scattered tufts'),

    # A SECOND TUFT CELL, so `grass` has something to scatter that is not the
    # tile an author placed deliberately with `G`. Same tonal family as
    # grassTuft to three significant figures (78% mid, 17% dark, 3% light),
    # which is the property that matters: a variant whose dominant index
    # differs from its base does not read as variation, it reads as a patch.
    ('grassClump',  OW, 2367,  847, 'grass with low clumps, sparser than grassTuft'),
    ('tallgrass',   OW,  886, 1049, 'tall blades, the cuttable kind'),
    ('sand',        OW, 1788,   65, 'dry sand, sparse grain'),
    ('sandWet',     OW, 1933,   81, 'damp sand, denser grain'),
    ('sandRipple',  OW,  484,    1, 'wind-rippled dune'),
    ('mud',         OW, 2206,  154, 'churned bog'),
    # THE GROUND YOU STAND ON IN A ROCKY PLACE, and the reason Link looked
    # like he was walking over a boulder field for the life of the project.
    #
    # This was OW 645,1549, whose note said "cobbled paving" and which is a
    # fan-sheet cobble: a quarter of its 256 pixels are the darkest index,
    # drawn as an outline round every cobble. At 16x16 in a four-tone ramp
    # whose darkest tone is near-black — `stone`, `stonedk`, and every other
    # palette this tile family wears — each cobble reads as a rounded LUMP, so
    # 39 overworld screens of walkable ground came out as a heap of stones with
    # the player standing on top of it. Nothing was wrong with the collision,
    # the flags or the palette wiring; the tile was a picture of rocks.
    #
    # Subrosia's own floor is the thing itself, and it is built like every
    # other ground tile already here: one mid tone over 72% of the cell with a
    # sparse speckle of light and dark, no feature big enough for the eye to
    # lock onto. 5% darkest against the cobble's 25%. Three colours, so the
    # near-black index every stone palette carries goes unused, which is what
    # stops it drawing outlines.
    ('rockFloor',   SB,    8,  440, 'Subrosian rock floor, sparse speckle'),

    # THE CLIFFS, and the reason they never read as cliffs.
    #
    # `cliffTop` is placed ZERO times in the whole overworld — 1,307 cells of
    # `#` and not one `^` — so every cliff in the game is a solid mass of body
    # tile with no edge anywhere. The art being hand-drawn was the smaller half
    # of the problem; the larger half is that the game had one piece where the
    # source has a SET, so a cliff could only ever read as a wall of bricks.
    #
    # These two come off Seasons' own terraced cliffs. `cliffTop` is the lip:
    # a light overhang band with a hard dark line under it, over the first
    # masonry course. `cliff` is two more courses, and it is VERTICALLY SEAMLESS
    # with itself, which is what lets a cliff mass be any depth. The engine now
    # picks between them from the neighbours (see `edgeArt` in
    # src/world/tileset.js), so no room grid changes and no author has to
    # remember to place a lip.
    #
    # Found by grid reference, not by the seamless scan: a cliff face is one or
    # two cells tall on the sheet and so never repeats at +16 in y, which the
    # scan requires. The phase came from `--phase`, measured LOCALLY over the
    # cliff region — the whole-sheet average is wrong, because these map rips
    # are mostly not map.
    ('cliffTop',    SP, 1224,  726, "cliff lip: overhang band over the first course"),
    ('cliff',       SP, 1224,  742, 'cliff face, two masonry courses, tiles in y'),
    ('dFloor',      DG,  547,   42, 'dungeon floor, mottled flagstone'),
    ('dWall',       DG,  483,   26, 'dungeon wall run, lit top and hatched base'),
    # FLOWERS THAT ARE ACTUALLY FLOWERS. The previous pick was a leafy rosette
    # on the fan-made map, and the Ages shrub taken for `bush` below is the SAME
    # rosette — so the tile the player must cut looked exactly like the tile
    # that is scenery, and that is why `bush` sat un-extracted for two sessions.
    # Put the two 16x16 cells side by side and you cannot tell them apart.
    #
    # Seasons' spring overworld is the obvious source and had never been read:
    # spring is when Holodrum is covered in blooms. This is a seamless flower
    # field, five-petal blooms with dark centres over leaves, and it is ground
    # rather than a prop because that is what it is on the sheet — the same
    # reason the trees are 32x32 and not 16x16.
    #
    # The game's `grass` palette applies, not the sheet's, so the pink does not
    # survive and was never the point: what separates scenery from a cuttable
    # bush at a glance is MASS and SHAPE, and a blossom field shares neither
    # with a shrub.
    ('flowers',     SP,   33,  291, 'spring flower field, blooms over leaves'),

    # A CAVE MOUTH THAT IS A CAVE MOUTH. The hand-drawn one was a rectangular
    # frame with a hole in it, and it is on record as the reason three doors in
    # a row read as holes in the grass rather than as three ways in — see
    # docs/NEXT-SESSION.md, where a first pass at Tidewatch was cut for it.
    #
    # This is a full-cell PICK rather than a PROP even though a cave mouth has
    # ground around it on the sheet, and the reason is what the tile IS here:
    # `caveMouth` carries `mask: 0` and F.WARP and fills its cell, in cliffs and
    # dunes and marsh alike. Flooding the sheet's Subrosian grass out of it
    # would need an `underArt`, and there is no one ground that is right under
    # every cave in the game. Ranked whole, the ground becomes the mid tone of
    # whichever palette the tiledef already binds, so the surround reads as the
    # rock the mouth is cut into.
    ('caveMouth',   SB,  176, 1632, 'cave mouth, arched and cut into rock'),

    # THE BANK, and the reason every shoreline in the game was a flat colour
    # seam instead of a tile. docs/ART-BACKLOG.md's top entry (S19) named the
    # crop and the shape: "The source draws a BANK: a brown earth strip with a
    # pale rim, on the LAND side of the join, with the water butting flat
    # against it. It is a hard-edged tile like any other and it does not
    # animate." S20 found the actual tile inside that crop, off a shoreline
    # around a garden pool at `oracle-ages-overworld.png @ 50,1200 500x300`
    # (a plain lake edge, not the canal/lock puzzle area at 1400,1900 the S19
    # note pointed at — that region turned out to be Ambi's moat and its walls
    # read as masonry, not turf; this pool is bordered by ordinary grass and
    # dune sand on the same source sheet).
    #
    # `--phase ag 60 1190 260 1350` put the grid at x=1+16n, y=10+16n, which
    # landed a straight run and a real corner on grid-aligned windows: a
    # horizontal bank (water below, land above) and the rounded corner where
    # it turns to run vertically. Every other orientation is derived from
    # these two by rotation/mirror — see TRANSFORMS below — rather than
    # picked separately: the window one grid cell further along the same
    # vertical run looked like a second real capture at low zoom, but its
    # 4-colour render came out visibly striped (see GROUND_MERGE's note for
    # why) and a derived orientation of a verified-clean tile beat a second
    # real crop that could not be trusted without the same rework.
    ('bankEdgeS',     AG, 545, 1226, 'shore bank, water below — rim on top, earth below'),
    ('bankCornerSE',  AG,  97, 1226, 'shore bank outer corner, water down and right'),
]

# Explicit dropped-colour overrides for specific PICKS, keyed by name — see
# `quantise`'s own note. `bankEdgeS` has 6 source colours (rim: black, two
# blues, a cream sparkle; earth: brown body, gold highlight) and only 4
# slots.
#
# GROUND_KEEP forces which 4 survive. Ranked by raw pixel count the
# automatic choice is brown+black (clear) plus two of {dark blue, light
# blue, cream} tied at 32px each — and the ascending-tuple tie-break keeps
# the two blues over the cream. Side by side with the source crop
# (`oracle-ages-overworld.png @ 50,1200`) the cream sparkle is the single
# most visually distinctive part of the rim, brighter than either blue, and
# losing it is the one thing that actually reads as different from the
# reference. Keeping it forces dropping the LIGHT blue instead — the dark
# blue and black together already carry the "this is a rim, not open
# ground" read, so the light blue is the more affordable loss of the three.
#
# GROUND_MERGE then aims the two colours GROUND_KEEP drops: the gold
# highlight (#c88808, lum 140.5) sits almost exactly on the rim's light
# blue by nearest-LUMINANCE (140.5 vs 141.2) and the automatic guess welded
# a blue fleck into the middle of the earth course — send it to the earth
# body instead. The light blue itself, now dropped, goes to dark blue
# rather than to brown (nearer by raw luminance, 55.9 vs 74.2, but a blue
# rim pixel turning earth-brown is a worse-looking guess than it staying a
# duller blue).
GROUND_KEEP = {
    'bankEdgeS': [(248, 248, 192), (128, 80, 0), (0, 80, 176), (0, 0, 0)],
}
GROUND_MERGE = {
    'bankEdgeS': {(200, 136, 8): (128, 80, 0), (32, 176, 248): (0, 80, 176)},
}

# THE OTHER SIX ORIENTATIONS OF THE BANK, rotated or mirrored rather than
# redrawn. This is still extraction, not authoring: every pixel comes from one
# of the two PICKS above, reordered — see the CLAUDE.md note on compositing
# being authorship, which this is not, because no two source tiles are ever
# blended into one cell, only one tile's own pixels rotated or reflected. It
# is sound specifically because the source's own lighting rule (pale rim
# toward land, dark earth toward water) is rotationally consistent — turning
# the bank a quarter-turn puts the rim on the new land-facing edge exactly
# where a real capture of the bank at that angle would put it.
#
# (new name, source PICK name, op)
ROT_CW, ROT_CCW, ROT_180, FLIP_H, FLIP_V = 'cw', 'ccw', '180', 'h', 'v'
TRANSFORMS = [
    ('bankEdgeN',    'bankEdgeS',    ROT_180),  # water above, land below
    ('bankEdgeE',    'bankEdgeS',    ROT_CCW),  # water to the right, land left
    ('bankEdgeW',    'bankEdgeS',    ROT_CW),   # water to the left, land right
    ('bankCornerSW', 'bankCornerSE', FLIP_H),   # water down and left
    ('bankCornerNE', 'bankCornerSE', FLIP_V),   # water up and right
    ('bankCornerNW', 'bankCornerSE', ROT_180),  # water up and left
]


def transform_grid(grid, op):
    n = len(grid)
    if op == FLIP_V:
        return grid[::-1]
    if op == FLIP_H:
        return [r[::-1] for r in grid]
    if op == ROT_180:
        return [r[::-1] for r in grid[::-1]]
    if op == ROT_CW:
        return [''.join(grid[n - 1 - c][r] for c in range(n)) for r in range(n)]
    if op == ROT_CCW:
        return [''.join(grid[c][n - 1 - r] for c in range(n)) for r in range(n)]
    raise SystemExit('rip-terrain: unknown transform op %r' % op)

# Props are a different shape of problem from ground, and need their own pass.
#
# A ground tile fills its cell; a prop is an object with ground showing around
# it, so it carries transparency and a base tile underneath (`underArt`). It is
# therefore NOT found by the seamless-window scan that found the nine above —
# nothing about a prop repeats — and it cannot be quantised the same way,
# because the ground it sits on must become transparent rather than an index.
#
# Almost every prop on the overworld sheet is ~30x30, i.e. TWO game tiles wide
# and two tall (see docs/HANDOFF.md). `flowers` is the one that fits a single
# 16x16 cell, which is why it is the only entry here.
#
# `slots` maps the prop's own colours, lightest first, onto palette indices.
# It is explicit rather than 0,1,2,3 for the reason recorded in HANDOFF: index
# 1 is the *field* tone of a region's ground palette, so any prop pixel placed
# there sinks into the ground it is standing on. Flowers take (0, 2, 3) — a
# bright body, a dark shade, a near-black outline — which is what makes the
# shape read against grass.
PROPS = [

    # From the Labrynna Present overworld — a real Oracle of Ages background rip
    # rather than the fan-made assembled map, which is why these two exist at
    # all. On that sheet the props are single 16x16 cells sitting on their own
    # ground, on a strict grid at phase (2, 8). `--props` found them; see
    # docs/HANDOFF.md for what else it found and what it could not.
    ('rock', AG, 418, 936, (1, 2, 3), 'liftable boulder, beside the dirt clearing'),

    # ...and now that `flowers` is floral, the Ages shrub can finally be taken.
    # This is the sheet's own cuttable bush, and the reason it was left behind
    # for two sessions is fixed one line above rather than worked around.
    ('bush', AG, 450, 920, (0, 1, 3), 'cuttable shrub, beside the dirt clearing'),

    # A POT WITH A RIM. The hand-drawn `pot` was a brown sphere: a circle with
    # a highlight and no lip, no shoulder and no base, in 21 placements across
    # the dungeons. A Zelda pot is read at a glance by its RIM — the dark
    # opening at the top and the band under it — and a sphere has none, so it
    # sat in dungeon rooms looking like a boulder that had been polished.
    #
    # Seasons' own dungeon pots, in rows of six against the ice room's north
    # wall. Found by colour rather than by the seamless scan (a pot does not
    # repeat, which is the whole definition of a prop): the two orange tones
    # occur in runs 16 apart in both axes from 902,43, which puts the cell at
    # 900,42 with one pixel of margin all round.
    #
    # Three colours plus the floor it stands on. Slots (0, 1, 3) rather than
    # (0, 2, 3): the two body tones on the sheet are a bright and a medium, not
    # a bright and a dark, so `pot`'s own mid tan is the honest partner for the
    # highlight and the near-black stays the outline.
    ('pot', DG, 900, 42, (0, 1, 3), 'dungeon pot, rim and shoulder, against the ice room wall'),
]

# Objects that are BIGGER THAN A TILE, cut into their four 16x16 quadrants.
#
# Every tree in every Oracle sheet — Seasons, Ages, the fan-made map — is 32x32.
# There is no 16x16 tree anywhere to find, so a faithful tree cannot be one
# tile, and the hand-drawn one it replaces was a 16x16 impression of a 32x32
# object. That is why the game's trees never looked like the source's.
#
# The engine reassembles them: a tile def carrying `quad: 'treeQ'` draws
# `treeQ_<x&1><y&1>` instead of its own art, so a 2x2 patch of tree tiles is one
# whole source tree and a longer run is a correctly-phased forest canopy — the
# same way the source games' own maps are authored. No room grid changes.
#
# `bg` is stated because a quadrant's corner pixel is often the object's own
# outline rather than the ground behind it.
QUADS = []

# --------------------------------------------------------------------------
# OBJECTS TALLER AND WIDER THAN A TILE, kept whole.
#
# A tree is 32x32 in every Oracle sheet — that much of the note above QUADS is
# right. What that note gets wrong is the CONCLUSION. It proposes cutting the
# tree into four quadrants and having a 2x2 patch of tree tiles reassemble it.
# Counted out of this game's own world data, only **18% of the 1559 tree tiles
# placed are inside a full 2x2 block**; 41% have no tree above or below them at
# all, because this world uses trees as a ONE-TILE-THICK border around screens.
# A quadrant scheme would therefore render four fifths of the game's trees as
# fragments — worse than the hand-drawn lollipop it replaces.
#
# So the tree stays WHOLE and one tile draws all of it, overhanging its
# neighbours, which is what the source games do with a 32x32 object anyway.
#
# It is split into two halves rather than four quadrants because that is the
# real constraint: the canopy is 3 colours and the roots are 4, and no single
# 4-colour palette holds both. On hardware the canopy tiles and the root tiles
# carry different palettes; two halves is the smallest split that reproduces
# that, and it is a straight extraction with nothing composited.
#
# `bg` is a SET here. The tree stands on a rendered map, not on a flat key
# colour: sage grass, a paler halo, a darker tuft tone. All of them are ground,
# including the pale gaps BETWEEN the roots — see quantise_prop's own note.
_TREE_GROUND = {(182, 182, 127), (117, 137, 70), (223, 217, 181), (252, 230, 198)}

# The dune sand the palm stands on: two tones in a diagonal stripe, both ground.
_SAND_GROUND = {(252, 232, 177), (227, 161, 77)}

# WHOLE 32x32 OBJECTS, cut into four 16x16 quadrants after extraction.
#
# (name, sheet, x, y, w, h, bg, flood, topSlots, botSlots, note)
#
# TWO THINGS ARE DELIBERATE HERE AND BOTH WERE PAID FOR.
#
# 1. HOW BACKGROUND IS DECIDED IS PER-OBJECT, and both objects here need a
#    DIFFERENT answer, which is why `flood` is a field rather than a policy.
#    THE OAK FLOODS. Its pale cream is the halo the map draws where grass meets
#    tree AND the highlight inside its roots — the same colour meaning two
#    things. Clearing it by colour punched holes through the roots and left the
#    quadrants looking like torn paper, which is what a person playing spotted.
#    Flooding inward from the border clears the halo and keeps the highlight,
#    because the highlight is walled in by the tree's own outline.
#
#    THE PALM DOES NOT. Its background is dune sand, which appears nowhere in
#    the palm itself, so it is unambiguous — and the gaps BETWEEN its fronds are
#    ground showing through even though the fronds enclose them. Flooding would
#    keep those gaps opaque and give the palm a solid sand-coloured middle.
#
# 2. THE MASK IS COMPUTED ON THE WHOLE OBJECT, THEN THE OBJECT IS SLICED.
#    Doing it per-quadrant would call a root gap "enclosed" or "reachable"
#    depending on which 16x16 window it happened to touch, so the same pixel
#    could be art in one quadrant and background in its neighbour.
#
# The two halves quantise separately because a canopy and its roots do not fit
# in one four-colour palette — on hardware they are separate tiles with separate
# palettes, and this is the same split.
#
# 3. THE WINDOW IS THE OBJECT'S OWN BOUNDING BOX, TO THE PIXEL, and both of
#    these were off by a couple and had been since they were ripped. The oak's
#    outline-to-outline width is 32 starting two pixels right of where the
#    window did, so its RIGHT outline column fell outside and every oak in the
#    game ran off its own edge without one — a person playing saw it before any
#    of this was measured. The palm was one row low, which cut the tips off its
#    top fronds. On this sheet the objects TOUCH their neighbours, so neither
#    box can be found by looking for background around them: measure the
#    outline columns, per row, and take the extremes.
BIGPROPS = [
    # The root half keeps SIX colours once the halo is flooded away rather than
    # cleared by colour, so it is reduced deliberately: cream highlight and tan
    # root take slots 0 and 1, the canopy's own shadow keeps a green at slot 2,
    # and the root shadow joins the tan rather than the green — roots read as
    # two tones and the leaf shadow above them stays a leaf shadow. Two stray
    # canopy pixels overhanging the join go to the green with it.
    ('treeOak', OW, 2222, 1597, 32, 32, _TREE_GROUND, True, (0, 1, 3), (0, 1, 2, 1, 2, 3),
     'oak: round canopy over visible roots, standing on grass'),
    # THE PALM IS A DIFFERENT TREE, not the oak recoloured. The dunes are a
    # third of every tree in the game (510 of 1559 tiles) and recolouring an
    # oak would have given the desert broadleaf woodland in beige. Its fronds
    # and base share one colour set, so both halves index one palette.
    # Three colours in the frond half, not four. The old window clipped the top
    # fronds and caught four stray trunk pixels instead, so it had one more
    # colour than the palm actually has up there; with the window on the palm's
    # real bounding box the outline is the third colour, and slotting it as the
    # second painted every frond edge trunk-brown.
    ('palm', OW, 403, 307, 32, 32, _SAND_GROUND, False, (0, 1, 3), (1, 2, 3),
     'date palm: fronds over a trunk and sand mound'),
]

# --------------------------------------------------------------------------
# THE TOWN KIT.
#
# A BUILDING IS NOT A TILE. The ones on the Subrosia tileset are three cells
# wide and three tall, which is the same problem the 32x32 trees have and a
# worse one, because a building is not square and does not repeat: cutting one
# into nine unrelated tiles hands an author nine characters that only mean
# anything in one arrangement, and nothing to catch the arrangement being
# wrong. So a block is extracted, registered and PLACED as one object — see
# `registerBlocks` in src/world/tileset.js and the footprint expansion in
# src/world/room.js. A room grid draws the building's outline as a rectangle of
# one character and the loader resolves each cell.
#
# `assets/sheets/oracle-seasons-tileset-subrosia.png` is the source for all of
# it: the only true TILESET in the repo, 16 cells wide, phase 0, so every pick
# here is a grid reference rather than a survey. The kit is inventoried in
# assets/sheets/README.md.
#
# UNLIKE THE GROUND PICKS ABOVE, THIS INSTALLS ITS PALETTES. Those tiles keep
# the palette their tiledef in tiles-core.js already binds, because the game
# has been drawing grass and sand for its whole life and a swapped ramp moves
# every region's colour scheme. A roof has never been drawn in this game at
# all, so there is no palette to preserve and the cartridge's own colours are
# what make a blue shop read as the source's blue shop. Same argument, and the
# same conclusion, as tools/rip-dungeon-themes.py.
#
# Each cell names its own palette, because a building is not one object in one
# ramp: the roof is roof-coloured and the front is timber, and the source draws
# them from two palettes for exactly that reason. Colours map to indices by an
# EXPLICIT table (the palette's own order, lightest first) rather than by rank
# — a rank is per cell, and the same green would land on a different index in
# every cell of the same roof.
TOWN_PALETTES = {
    'sbRoofBlue':  ['#f8f8b0', '#1860f8', '#001888', '#000000'],
    # The shop's front row carries the SHOP plate, and the plate's yellow and
    # the wall's white trim cannot both be index 0. The plate wins: it is the
    # one tile in the kit that says what the building IS, and what it costs is
    # ten pixels of edge highlight per side cell going yellow instead of cream.
    'sbShopFront': ['#f0f838', '#1860f8', '#001888', '#000000'],
    'sbRoofGreen': ['#f0f838', '#08c850', '#086018', '#000000'],
    'sbRoofRed':   ['#f8d088', '#e80818', '#680828', '#000000'],
    'sbWood':      ['#f0f838', '#c08820', '#704820', '#000000'],
    'sbTimber':    ['#f8e878', '#b86038', '#783828', '#000000'],
}

BLUE, SIGN = 'sbRoofBlue', 'sbShopFront'
GRN, RED = 'sbRoofGreen', 'sbRoofRed'
WOOD, TIMBER = 'sbWood', 'sbTimber'

# Colours that turn up in a cell without belonging to its palette. Every one is
# a handful of pixels of one ramp bleeding into a cell drawn in the other —
# the SHOP plate's gold shading crossing into the wall cells beside it, and the
# ground's tufts around the stump. Stated per palette rather than merged by
# nearest luminance, so the choice is a decision somebody made and not an
# arithmetic accident.
TOWN_MERGE = {
    SIGN: {'#f8f8b0': 0, '#c08820': 0, '#704820': 3},
}

# name, w, h, note, cells. A cell is (col, row, palette) on the tileset.
#
# `bg` names the colours the surrounding GROUND is drawn in on the sheet. They
# are flooded out from the block's border inward and become transparency, so
# the tile under a building's rounded roof corner is the region's own ground
# rather than a nub of Subrosian dirt. Flooding from the border rather than
# testing colour equality is what keeps the roof's yellow trim, which on the
# green house is the same yellow as the dirt behind it.
TOWN = [
    ('bShop', 3, 3, 'blue shop: roof, and the signed front', ['#f0f838'], [
        [(4, 7, BLUE), (5, 7, BLUE), (6, 7, BLUE)],
        [(4, 8, BLUE), (5, 8, BLUE), (6, 8, BLUE)],
        [(4, 9, SIGN), (5, 9, SIGN), (6, 9, SIGN)],
    ]),
    ('bHouseGreen', 3, 3, 'green-roofed house: window, doorway, window', ['#f0f838'], [
        [(7, 7, GRN), (8, 7, GRN), (9, 7, GRN)],
        [(7, 8, GRN), (8, 8, GRN), (9, 8, GRN)],
        [(9, 9, WOOD), (8, 9, WOOD), (9, 9, WOOD)],
    ]),
    ('bHouseRed', 3, 3, 'red-roofed house: window, doorway, window', ['#f8d088'], [
        [(10, 7, RED), (11, 7, RED), (12, 7, RED)],
        [(10, 8, RED), (11, 8, RED), (12, 8, RED)],
        [(9, 9, WOOD), (8, 9, WOOD), (9, 9, WOOD)],
    ]),
    # The same house with the sheet's CLOSED door in the middle instead of its
    # open one. A town needs more buildings than it has interiors, and a
    # shuttered door is how the source says so — the affordance is the art,
    # which is why this is a different building and not a flag on the last one.
    ('bHouseShut', 3, 3, 'green-roofed house, door shut', ['#f0f838'], [
        [(7, 7, GRN), (8, 7, GRN), (9, 7, GRN)],
        [(7, 8, GRN), (8, 8, GRN), (9, 8, GRN)],
        [(9, 9, WOOD), (7, 9, WOOD), (9, 9, WOOD)],
    ]),
    ('bWell', 2, 2, 'stone well', ['#c08820'], [
        [(13, 8, WOOD), (14, 8, WOOD)],
        [(13, 9, WOOD), (14, 9, WOOD)],
    ]),
    ('bStump', 3, 2, 'cut stump, the size of a table', ['#f8e878', '#e09000', '#a06000', '#c08820', '#704820'], [
        [(7, 10, TIMBER), (8, 10, TIMBER), (9, 10, TIMBER)],
        [(7, 11, TIMBER), (8, 11, TIMBER), (9, 11, TIMBER)],
    ]),
    ('bFence', 1, 2, 'paling fence, one post pair', ['#f8e878'], [
        [(11, 11, TIMBER)],
        [(11, 12, TIMBER)],
    ]),
    ('bBarrels', 1, 1, 'two barrels', ['#f0f838'], [[(10, 9, WOOD)]]),
    ('bCrate', 1, 1, 'a crate and a chest', ['#c08820'], [[(11, 9, WOOD)]]),
    ('bCrates', 1, 1, 'stacked crates', ['#c08820'], [[(12, 9, WOOD)]]),
]


def lum(c):
    return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]


def quantise(block, merge=None, keep=None):
    """16x16 RGB -> (grid of 0-3, four source colours lightest first).

    Deliberately not `ripkit.quantise`: that pads a short palette by repeating
    its last colour and then picks indices by nearest-distance search, which
    ties and is not reproducible (see docs/HANDOFF.md). Here the four kept
    colours are ranked by a total order and every pixel is a direct lookup, so
    the output is byte-identical run to run.

    A dropped colour falls back to nearest LUMINANCE, which is blind to hue —
    `bankEdgeS`'s masonry highlight (a gold `#c88808`) sits almost exactly on
    the rim's light-blue shade by that measure (140.5 vs 141.2) and the
    automatic guess welded a blue speckle into the middle of the earth
    course. `merge` overrides specific dropped colours to a specific kept one
    explicitly, the same fix `TOWN_MERGE` already uses for the same reason —
    see the note above it: "stated ... rather than merged by nearest
    luminance, so the choice is a decision somebody made and not an
    arithmetic accident."

    `keep` overrides which 4 colours survive, when the automatic top-4-by-
    frequency choice throws out something a side-by-side with the source
    shows is load-bearing. `bankEdgeS` ranked BY COUNT keeps two near-
    identical blues (32px each) over the rim's bright cream sparkle (also
    32px, lost on the tuple tie-break) — technically correct, but the sparkle
    is the most visually distinctive part of the rim in the source crop, and
    dropping it is the difference a side-by-side comparison actually catches.
    """
    cnt = Counter(p for row in block for p in row)
    if keep:
        keep = sorted(keep, key=lambda c: (-lum(c), c))
    else:
        # Ties broken on the RGB tuple so the choice does not depend on dict order.
        ranked = sorted(cnt.items(), key=lambda kv: (-kv[1], kv[0]))
        keep = sorted((c for c, _ in ranked[:4]), key=lambda c: (-lum(c), c))
    remap = {c: min(keep, key=lambda k: ((lum(k) - lum(c)) ** 2, k)) for c in cnt}
    if merge:
        for c, target in merge.items():
            if c in remap and target in keep:
                remap[c] = target
    idx = {c: i for i, c in enumerate(keep)}
    grid = [''.join(str(idx[remap[p]]) for p in row) for row in block]
    return grid, keep


def quantise_quad(block, colmap, bg):
    """16x16 RGB -> grid of 0-3 and '.', mapping colours by an EXPLICIT table.

    Quadrants cannot use `quantise_prop`'s slot list. That ranks the colours
    *present in this cell* by luminance and indexes by rank — and each quadrant
    of an object holds a different subset, so the same green lands on a
    different index in every quarter. The tree came out with a brown canopy that
    way. An object bigger than a cell has one palette, so it needs one table,
    written per colour and shared by all four quarters.
    """
    out = []
    for row in block:
        line = []
        for p in row:
            if p == bg:
                line.append('.')
                continue
            key = '#%02x%02x%02x' % p
            if key not in colmap:
                raise SystemExit('rip-terrain: quad colour %s not in the map' % key)
            line.append(str(colmap[key]))
        out.append(''.join(line))
    return out


def quantise_town(block, w, h, bgs, cells):
    """A w x h CELL block of the town kit -> one 16x16 grid of '0-3'/'.' per cell.

    Two things make this neither `quantise_quad` nor `quantise_prop`:

    * The transparency is flooded from the BLOCK's border, not each cell's. A
      cell in the middle of a building has no ground in it at all, and a cell
      at its edge has ground on one side only — flooding per cell would let the
      sky in through the gap between two roofs, and testing colour equality
      would punch the yellow trim out of a green roof, because on this sheet
      the trim and the dirt behind it are the same yellow.
    * Every cell names its own palette and colours map to indices by that
      palette's own order. A rank-based map is per cell, and a building's roof
      spans three of them.
    """
    W, H = w * 16, h * 16
    grid = [[None] * W for _ in range(H)]
    bgset = {tuple(int(c[i:i + 2], 16) for i in (1, 3, 5)) for c in bgs}
    stack = [(i, e) for i in range(W) for e in (0, H - 1)]
    stack += [(e, i) for i in range(H) for e in (0, W - 1)]
    seen = set()
    while stack:
        cx, cy = stack.pop()
        if not (0 <= cx < W and 0 <= cy < H) or (cx, cy) in seen:
            continue
        if block[cy][cx] not in bgset:
            continue
        seen.add((cx, cy))
        grid[cy][cx] = '.'
        stack += [(cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)]

    out = []
    for cy in range(h):
        row = []
        for cx in range(w):
            pal = cells[cy][cx][2]
            idx = {tuple(int(c[i:i + 2], 16) for i in (1, 3, 5)): n
                   for n, c in enumerate(TOWN_PALETTES[pal])}
            merge = {tuple(int(c[i:i + 2], 16) for i in (1, 3, 5)): n
                     for c, n in TOWN_MERGE.get(pal, {}).items()}
            lines = []
            for y in range(16):
                line = []
                for x in range(16):
                    gx, gy = cx * 16 + x, cy * 16 + y
                    if grid[gy][gx] == '.':
                        line.append('.')
                        continue
                    p = block[gy][gx]
                    n = idx.get(p, merge.get(p))
                    if n is None:
                        raise SystemExit(
                            'rip-terrain: colour #%02x%02x%02x at cell (%d,%d) is in '
                            'neither palette %s nor its merge table' % (p + (cx, cy, pal)))
                    line.append(str(n))
                lines.append(''.join(line))
            row.append(lines)
        out.append(row)
    return out


def flood_background(block, bgset):
    """True where a pixel is background REACHABLE FROM THE BORDER.

    Colour alone cannot answer this: the pale tone around a tree is both the
    halo the map draws under it and the highlight inside its roots. Flooding
    inward keeps anything the object's own outline walls in.
    """
    H, W = len(block), len(block[0])
    clear = [[False] * W for _ in range(H)]
    stack = [(i, e) for i in range(W) for e in (0, H - 1)]
    stack += [(e, i) for i in range(H) for e in (0, W - 1)]
    while stack:
        cx, cy = stack.pop()
        if not (0 <= cx < W and 0 <= cy < H) or clear[cy][cx]:
            continue
        if block[cy][cx] not in bgset:
            continue
        clear[cy][cx] = True
        stack += [(cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)]
    return clear


def quantise_masked(block, clear, slots):
    """Index a block to 0-3 and '.', with transparency already decided."""
    H, W = len(block), len(block[0])
    kept = sorted({block[cy][cx] for cy in range(H) for cx in range(W)
                   if not clear[cy][cx]}, key=lambda c: (-lum(c), c))
    if len(kept) > len(slots):
        raise SystemExit('rip-terrain: %d colours, %d slots given: %s'
                         % (len(kept), len(slots), kept))
    idx = {c: slots[i] for i, c in enumerate(kept)}
    rows = []
    for cy in range(H):
        rows.append(''.join('.' if clear[cy][cx] else str(idx[block[cy][cx]])
                            for cx in range(W)))
    return rows, kept


def _detached(grid, Wd, H):
    """Cells of every opaque component except the biggest one.

    Eight-connected on purpose: a diagonal touch is still the same object, and
    an object's own outline steps diagonally all the time.
    """
    seen = [[False] * Wd for _ in range(H)]
    best, rest = [], []
    for sy in range(H):
        for sx in range(Wd):
            if seen[sy][sx] or grid[sy][sx] == '.':
                continue
            comp, stack = [], [(sx, sy)]
            seen[sy][sx] = True
            while stack:
                cx, cy = stack.pop()
                comp.append((cx, cy))
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        nx, ny = cx + dx, cy + dy
                        if 0 <= nx < Wd and 0 <= ny < H and not seen[ny][nx] and grid[ny][nx] != '.':
                            seen[ny][nx] = True
                            stack.append((nx, ny))
            if len(comp) > len(best):
                rest.extend(best)
                best = comp
            else:
                rest.extend(comp)
    return rest


def quantise_prop(block, slots, bg=None):
    """16x16 RGB -> (grid of 0-3 and '.', the prop's own colours lightest first).

    The ground the prop stands on becomes transparent, but only where it is
    reachable from the cell border. Source colour *enclosed* by the prop's own
    outline is artwork, not background — the same trap `rip-hud.py` hit with the
    Seed Satchel's highlight, recorded in docs/HANDOFF.md. Flood-filling inward
    rather than testing colour equality is what keeps a flower's pale centre.
    """
    # The background must be stated for a quadrant of a larger object: its
    # corner pixel is as likely to be the object's own outline as the ground,
    # and sniffing it there eats the outline and then the whole sprite.
    #
    # Stating it also changes what it MEANS. Sniffed, the flood fill only clears
    # background reachable from the border, so colour walled in by the object
    # stays artwork — that is what keeps a flower's pale centre. Stated, the
    # caller is asserting "this colour is ground wherever it appears", which is
    # what a tree needs: the sky between its roots is ground showing through and
    # must let the grass under it out, even though the outline encloses it.
    # Size comes from the block, not from a 16 written eight times: a 32-wide
    # tree half goes through this same function. `bg` may be one colour or a
    # SET of them — the ground around an object on a rendered map is rarely one
    # flat tone (this tree stands on sage grass with a paler halo and a darker
    # tuft tone, three colours that are all equally "not the tree").
    H = len(block)
    Wd = len(block[0])
    bgset = bg if isinstance(bg, (set, frozenset)) else ({bg} if bg is not None else None)
    grid = [[None] * Wd for _ in range(H)]
    if bgset is not None:
        for cy in range(H):
            for cx in range(Wd):
                if block[cy][cx] in bgset:
                    grid[cy][cx] = '.'
        kept = sorted({block[cy][cx] for cy in range(H) for cx in range(Wd)
                       if grid[cy][cx] is None}, key=lambda c: (-lum(c), c))
        if len(kept) > len(slots):
            raise SystemExit('rip-terrain: prop has %d colours, %d slots given'
                             % (len(kept), len(slots)))
        idx = {c: slots[i] for i, c in enumerate(kept)}
        for cy in range(H):
            for cx in range(Wd):
                if grid[cy][cx] is None:
                    grid[cy][cx] = str(idx[block[cy][cx]])
        return [''.join(r) for r in grid], kept
    bg = block[0][0]
    stack = [(i, e) for i in range(Wd) for e in (0, H - 1)]
    stack += [(e, i) for i in range(H) for e in (0, Wd - 1)]
    seen = set()
    while stack:
        cx, cy = stack.pop()
        if not (0 <= cx < Wd and 0 <= cy < H) or (cx, cy) in seen:
            continue
        if block[cy][cx] != bg:
            continue
        seen.add((cx, cy))
        grid[cy][cx] = '.'
        stack += [(cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)]

    # A PROP IS ONE OBJECT, so anything left over that is not joined to it came
    # from the cell next door. `rock` sits one pixel from its neighbour on the
    # Ages map and took a dotted column of that neighbour's brown down its left
    # edge — and the flood above cannot clear it, because those pixels are the
    # boulder's own colours and the flood only eats the sniffed ground. On
    # screen it was a stripe of grit hanging in the air beside the boulder, in
    # every room with a rock in it, from the day it was extracted.
    #
    # Only on this path. The stated-`bg` path above is what the tree quads use,
    # and a tree's root lobes are genuinely several components.
    for cx, cy in _detached(grid, Wd, H):
        grid[cy][cx] = '.'

    kept = sorted({block[cy][cx] for cy in range(H) for cx in range(Wd)
                   if grid[cy][cx] is None}, key=lambda c: (-lum(c), c))
    if len(kept) > len(slots):
        raise SystemExit('rip-terrain: prop has %d colours, %d slots given'
                         % (len(kept), len(slots)))
    idx = {c: slots[i] for i, c in enumerate(kept)}
    for cy in range(H):
        for cx in range(Wd):
            if grid[cy][cx] is None:
                grid[cy][cx] = str(idx[block[cy][cx]])
    return [''.join(r) for r in grid], kept


def hexc(c):
    return '#%02x%02x%02x' % c


def seamless_scan(path, x0, y0, x1, y1, top=24):
    """Rank the seamless 16x16 tiles in a region of a sheet.

    This is the scan the module header describes, and it is committed now
    because it was not before — `docs/HANDOFF.md` recorded the algorithm in
    prose and left the next person to rewrite it, which is a session's work to
    recover something that fits on a screen.

    A ground tile is the 16x16 window that repeats at +16 in x AND +16 in y.
    Passing that test means the window is correctly phased and tiles seamlessly
    with itself, which is exactly what `docs/ART-DIRECTION.md` demands of
    terrain — so the test does not just find candidates, it proves the property.

    Every hit has 256 cyclic phase shifts that are the same tile, so hits are
    deduplicated on their raw bytes first and only the distinct ones are
    canonicalised. Doing it the other way round is what makes the naive version
    too slow to run on a whole sheet.
    """
    im = Image.open(path).convert('RGB')
    W, H = im.size
    x1, y1 = min(x1, W - 32), min(y1, H - 32)
    px = im.load()

    def row(x, y):
        return bytes(b for i in range(16) for b in px[x + i, y])

    rows = {}

    def block(x, y):
        out = []
        for j in range(16):
            k = (x, y + j)
            r = rows.get(k)
            if r is None:
                r = rows[k] = row(x, y + j)
            out.append(r)
        return out

    hits = Counter()
    for y in range(y0, y1):
        for x in range(x0, x1):
            b = block(x, y)
            if block(x + 16, y) != b:
                continue
            if block(x, y + 16) != b:
                continue
            hits[b''.join(b)] += 1

    # Collapse the 256 phase shifts of each distinct hit onto one key.
    def canonical(raw):
        grid = [raw[j * 48:(j + 1) * 48] for j in range(16)]
        best = None
        for dy in range(16):
            rot = grid[dy:] + grid[:dy]
            for dx in range(16):
                s = b''.join(r[dx * 3:] + r[:dx * 3] for r in rot)
                if best is None or s < best:
                    best = s
        return best

    groups = {}
    for raw, n in hits.items():
        k = canonical(raw)
        g = groups.setdefault(k, [0, raw])
        g[0] += n
    ranked = sorted(groups.values(), key=lambda g: -g[0])[:top]

    print(f'{path}  region ({x0},{y0})-({x1},{y1})')
    print(f'  {sum(hits.values())} seamless windows, {len(groups)} distinct tiles\n')
    for i, (n, raw) in enumerate(ranked):
        # Report a real origin for the tile so it can go straight into PICKS.
        origin = next(xy for xy, r in
                      ((xy, b''.join(block(*xy))) for xy in
                       ((x, y) for y in range(y0, y1) for x in range(x0, x1)))
                      if r == raw)
        cols = len({raw[k:k + 3] for k in range(0, len(raw), 3)})
        print(f'  [{i:2}] {n:6} windows  origin {origin[0]},{origin[1]}  {cols} colours')
    return ranked


def phase_scan(path, box=None):
    """Where is this sheet's 16x16 tile grid?

    Committed because it is the thing that blocks picking any tile that is not
    ground. `seamless_scan` finds ground WITHOUT knowing the phase — a window
    that repeats at +16 in both axes is correctly phased by construction — but
    a cliff face, a shoreline or a building front is one or two cells tall and
    never repeats, so the only way to pick one is to read it off the grid, and
    for that the grid has to be found first.

    Hard edges in pixel art land ON cell boundaries far more often than inside
    cells, so the phase is the offset whose columns (and rows) carry the most
    gradient. Sum |difference| between adjacent columns, fold onto 16, take the
    peak.

    **MEASURE LOCALLY, OVER THE REGION YOU ARE PICKING FROM.** These sheets are
    assembled maps with large non-map margins, and the whole-sheet average is
    dominated by content that is not on the map's grid: the Seasons spring sheet
    reports (0, 12) whole-sheet and (8, 6) over its cliffs, and only the second
    one produces cells that contain whole tiles. Pass a box.
    """
    im = Image.open(path).convert('RGB')
    W, H = im.size
    x0, y0, x1, y1 = box if box else (0, 0, W, H)
    px = im.load()
    cols = [0] * 16
    rows = [0] * 16
    for y in range(y0, min(y1, H)):
        for x in range(x0, min(x1, W) - 1):
            a, b = px[x, y], px[x + 1, y]
            cols[(x + 1) % 16] += abs(a[0] - b[0]) + abs(a[1] - b[1]) + abs(a[2] - b[2])
    for y in range(y0, min(y1, H) - 1):
        for x in range(x0, min(x1, W)):
            a, b = px[x, y], px[x, y + 1]
            rows[(y + 1) % 16] += abs(a[0] - b[0]) + abs(a[1] - b[1]) + abs(a[2] - b[2])
    pxp = max(range(16), key=lambda i: cols[i])
    pyp = max(range(16), key=lambda i: rows[i])
    print(f'{path}')
    print(f'  region ({x0},{y0})-({x1},{y1})')
    print(f'  x-phase = {pxp}   y-phase = {pyp}')
    print(f'  so cells start at x = {pxp} + 16n, y = {pyp} + 16n')
    return pxp, pyp


def supercell_scan(path, n=32, step=2, top=24):
    """Rank the NxN ground SUPERCELLS in a sheet — a field built from more than
    one alternating cell.

    Committed because the question it answers is one a session will otherwise
    ask again, and the answer is a negative result that is expensive to
    reproduce.

    `seamless_scan` tests for a repeat at +16 in both axes, so a field made of a
    2x2 set of alternating cells is INVISIBLE to it — and that is exactly where
    multi-cell ground variation would live. This scan tests for a repeat at +N
    instead and rejects any hit whose N/16-by-N/16 sub-cells are all identical,
    which is the 16x16 case already covered.

    THE ANSWER, measured 2026-08-29 across every sheet in assets/sheets/:

      custom-oracle-style-overworld   758 supercell windows   (4,129 at 16x16
                                                               in ONE region)
      oracle-seasons-overworld-spring   9 supercell windows
      oracle-ages-overworld             0 supercell windows

    **The source games do not build ground out of multi-cell patterns.** Their
    fields are single-cell repeats, and the variety on screen comes from a
    person placing detail cells by hand. That is why this game scatters variants
    with a hash instead of hunting for supercells: see `tileVariant` in
    src/world/tileset.js, and `T63` in docs/SESSION-HANDOFF.md.
    """
    im = Image.open(path).convert('RGB')
    W, H = im.size
    px = im.load()
    rows = {}

    def row(x, y, w):
        k = (x, y, w)
        r = rows.get(k)
        if r is None:
            r = rows[k] = bytes(b for i in range(w) for b in px[x + i, y])
        return r

    def block(x, y, w, h):
        return b''.join(row(x, y + j, w) for j in range(h))

    hits = Counter()
    origin = {}
    c = n // 16
    for y in range(0, H - 2 * n, step):
        rows.clear()
        for x in range(0, W - 2 * n, step):
            b = block(x, y, n, n)
            if block(x + n, y, n, n) != b or block(x, y + n, n, n) != b:
                continue
            if len({block(x + i * 16, y + j * 16, 16, 16)
                    for i in range(c) for j in range(c)}) < 2:
                continue          # really a 16x16 tile; seamless_scan has it
            hits[b] += 1
            origin.setdefault(b, (x, y))
    print(f'{path}  {n}x{n} supercells')
    print(f'  {sum(hits.values())} windows, {len(hits)} distinct\n')
    for i, (raw, k) in enumerate(sorted(hits.items(), key=lambda kv: -kv[1])[:top]):
        ox, oy = origin[raw]
        cols = len({raw[j:j + 3] for j in range(0, len(raw), 3)})
        print(f'  [{i:2}] {k:6} windows  origin {ox},{oy}  {cols} colours')
    return hits


def prop_scan(path, px, py, x0, y0, x1, y1, out_png=None, top=120):
    """Find candidate PROPS on a sheet whose tile grid has phase (px, py).

    The seamless scan finds ground, and by construction it cannot find props:
    a prop does not repeat, which is the whole test. A prop is instead a cell
    that is *mostly* the ground around it with an object sitting in the middle —
    so this walks the grid, measures how much of each cell is the ground colour
    dominating its 3x3 neighbourhood, and keeps the cells that are neither
    empty ground nor solid object.

    It reports candidates, not answers. Read the contact sheet it writes and
    pick by eye, the way `docs/briefs/AGENTS.md` section J says to.
    """
    im = Image.open(path).convert('RGB')
    W, H = im.size
    px_ = im.load()

    def cell(x, y):
        return [px_[x + i, y + j] for j in range(16) for i in range(16)]

    found = {}
    for y in range(y0 + (py - y0) % 16, min(y1, H - 16), 16):
        for x in range(x0 + (px - x0) % 16, min(x1, W - 16), 16):
            here = cell(x, y)
            ring = []
            for dy in (-16, 0, 16):
                for dx in (-16, 0, 16):
                    if dx == 0 and dy == 0:
                        continue
                    if 0 <= x + dx < W - 16 and 0 <= y + dy < H - 16:
                        ring += cell(x + dx, y + dy)
            if not ring:
                continue
            ground = Counter(ring).most_common(1)[0][0]
            share = sum(1 for p in here if p == ground) / 256.0
            # Neither bare ground nor a solid block of something else.
            if not (0.25 <= share <= 0.80):
                continue
            if len(set(here)) > 8:          # too busy to be a clean prop
                continue
            found.setdefault(bytes(b for p in here for b in p), (x, y, share))

    ranked = list(found.values())[:top]
    if out_png:
        S, COLS = 4, 16
        rows = (len(ranked) + COLS - 1) // COLS
        sheet = Image.new('RGB', (COLS * (16 * S + 10), max(1, rows) * (16 * S + 18)), (32, 32, 32))
        d = ImageDraw.Draw(sheet)
        for i, (x, y, _) in enumerate(ranked):
            sheet.paste(im.crop((x, y, x + 16, y + 16)).resize((16 * S, 16 * S), Image.NEAREST),
                        ((i % COLS) * (16 * S + 10) + 4, (i // COLS) * (16 * S + 18) + 2))
            d.text(((i % COLS) * (16 * S + 10) + 4, (i // COLS) * (16 * S + 18) + 16 * S + 2),
                   str(i), fill=(225, 225, 225))
        sheet.save(out_png)
        print(f'  contact sheet -> {out_png}')
    for i, (x, y, share) in enumerate(ranked):
        print(f'  [{i:3}] {x},{y}  ground {share:.0%}')
    return ranked


def main():
    if '--props' in sys.argv:
        a = sys.argv[sys.argv.index('--props') + 1:]
        sheet = {'ow': OW, 'dg': DG, 'ag': AG, 'sb': SB, 'sp': SP}[a[0]]
        prop_scan(sheet, int(a[1]), int(a[2]), int(a[3]), int(a[4]), int(a[5]), int(a[6]),
                  out_png=a[7] if len(a) > 7 else None)
        return

    if '--phase' in sys.argv:
        a = sys.argv[sys.argv.index('--phase') + 1:]
        sheet = {'ow': OW, 'dg': DG, 'ag': AG, 'sb': SB, 'sp': SP}[a[0]]
        box = tuple(int(v) for v in a[1:5]) if len(a) >= 5 else None
        phase_scan(sheet, box)
        return

    if '--supercells' in sys.argv:
        a = sys.argv[sys.argv.index('--supercells') + 1:]
        sheet = {'ow': OW, 'dg': DG, 'ag': AG, 'sb': SB, 'sp': SP}[a[0]]
        supercell_scan(sheet, int(a[1]) if len(a) > 1 else 32)
        return

    if '--scan' in sys.argv:
        a = sys.argv[sys.argv.index('--scan') + 1:]
        sheet = {'ow': OW, 'dg': DG, 'ag': AG, 'sb': SB, 'sp': SP}[a[0]]
        seamless_scan(sheet, int(a[1]), int(a[2]), int(a[3]), int(a[4]))
        return

    sheets = {}
    arts, pals, dropped = [], [], []
    for name, path, x, y, note in PICKS:
        im = sheets.get(path)
        if im is None:
            im = sheets[path] = Image.open(path).convert('RGB')
        block = [[im.getpixel((x + cx, y + cy)) for cx in range(16)] for cy in range(16)]
        before = len({p for row in block for p in row})
        grid, keep = quantise(block, merge=GROUND_MERGE.get(name), keep=GROUND_KEEP.get(name))
        if before > 4:
            dropped.append((name, before))
        arts.append((name, note, os.path.basename(path), x, y, grid))
        pals.append((name, keep))

    by_name = {a[0]: a for a in arts}
    VERB = {ROT_CW: 'rotated 90° clockwise', ROT_CCW: 'rotated 90° counter-clockwise',
            ROT_180: 'rotated 180°', FLIP_H: 'mirrored left-right', FLIP_V: 'mirrored top-to-bottom'}
    for newname, srcname, op in TRANSFORMS:
        _, note, sheet, x, y, grid = by_name[srcname]
        turned = transform_grid(grid, op)
        arts.append((newname, '%s, %s from %s' % (note, VERB[op], srcname), sheet, x, y, turned))
        pals.append((newname, dict(pals)[srcname]))
        by_name[newname] = arts[-1]

    for name, path, x, y, bg, colmap, note in QUADS:
        im = sheets.get(path)
        if im is None:
            im = sheets[path] = Image.open(path).convert('RGB')
        for qy in (0, 1):
            for qx in (0, 1):
                ox, oy = x + qx * 16, y + qy * 16
                block = [[im.getpixel((ox + cx, oy + cy)) for cx in range(16)] for cy in range(16)]
                grid = quantise_quad(block, colmap, bg)
                keep = [tuple(int(k[i:i + 2], 16) for i in (1, 3, 5)) for k in colmap]
                arts.append((f'{name}_{qx}{qy}', f'{note} ({"TL" if (qx, qy) == (0, 0) else "TR" if qx else "BL" if qy == 1 and not qx else "BR"})',
                             os.path.basename(path), ox, oy, grid))
                pals.append((f'{name}_{qx}{qy}', keep))

    town = []
    im = sheets.get(SB)
    if im is None:
        im = sheets[SB] = Image.open(SB).convert('RGB')
    for name, w, h, note, bgs, cells in TOWN:
        if len(cells) != h or any(len(r) != w for r in cells):
            raise SystemExit('rip-terrain: %s declares %dx%d and lists %d rows'
                             % (name, w, h, len(cells)))
        # The cells are gathered into one image first, so the flood that makes
        # the ground transparent can run across the whole building.
        blk = [[None] * (w * 16) for _ in range(h * 16)]
        for cy in range(h):
            for cx in range(w):
                sc, sr, _ = cells[cy][cx]
                for y in range(16):
                    for x in range(16):
                        blk[cy * 16 + y][cx * 16 + x] = im.getpixel((sc * 16 + x, sr * 16 + y))
        grids = quantise_town(blk, w, h, bgs, cells)
        townart = []
        for cy in range(h):
            for cx in range(w):
                sc, sr, pal = cells[cy][cx]
                townart.append(('%s_%d_%d' % (name, cx, cy),
                                'cell (%d,%d) — tileset c%d,r%d' % (cx, cy, sc, sr),
                                grids[cy][cx], pal))
        town.append((name, w, h, note, cells, townart))

    for name, path, x, y, w, h, bg, flood, topSlots, botSlots, note in BIGPROPS:
        im = sheets.get(path)
        if im is None:
            im = sheets[path] = Image.open(path).convert('RGB')
        block = [[im.getpixel((x + cx, y + cy)) for cx in range(w)] for cy in range(h)]
        clear = (flood_background(block, bg) if flood
                 else [[c in bg for c in row] for row in block])
        halves = []
        for hy, slots in ((0, topSlots), (1, botSlots)):
            sub = [row[:] for row in block[hy * 16:hy * 16 + 16]]
            submask = [r[:] for r in clear[hy * 16:hy * 16 + 16]]
            grid, keep = quantise_masked(sub, submask, slots)
            halves.append((grid, keep))
            pals.append(('%s%s' % (name, 'TB'[hy]), keep))
        for hy, (grid, keep) in enumerate(halves):
            for qx in range(2):
                q = [row[qx * 16:qx * 16 + 16] for row in grid]
                arts.append(('%s%s%s' % (name, 'TB'[hy], 'LR'[qx]), note,
                             os.path.basename(path), x + qx * 16, y + hy * 16, q))

    for name, path, x, y, slots, note in PROPS:
        im = sheets.get(path)
        if im is None:
            im = sheets[path] = Image.open(path).convert('RGB')
        block = [[im.getpixel((x + cx, y + cy)) for cx in range(16)] for cy in range(16)]
        grid, keep = quantise_prop(block, slots)
        arts.append((name, note, os.path.basename(path), x, y, grid))
        pals.append((name, keep))

    lines = [
        '// GENERATED by tools/rip-terrain.py — do not edit by hand.',
        '//',
        '// Background terrain extracted from the reference sheets in assets/sheets/,',
        '// which docs/ART-DIRECTION.md makes the canonical source for terrain. Each',
        '// tile is a 16x16 window that repeats at +16 in both axes on its sheet, so it',
        '// is correctly phased and tiles seamlessly with itself by construction.',
        '//',
        '// These override the hand-drawn art of the same name in tiles-core.js. Only the',
        '// pixels change: every tile keeps the palette its definition there already',
        '// binds, which is what keeps the palette-swap variants (grassDark, saltFlat,',
        '// iceFloor, rockFloorRust, ...) rendering. TERRAIN_SRC_PALETTES records the',
        '// four colours each tile actually has on the sheet, for reference.',
        '',
        'export const TERRAIN_ART = {',
    ]
    for name, note, sheet, x, y, grid in arts:
        lines.append('  // %s — %s @ %d,%d' % (note, sheet, x, y))
        lines.append('  %s: `' % name)
        lines.extend('    ' + r for r in grid[:-1])
        lines.append('    ' + grid[-1] + '`,')
        lines.append('')
    lines.append('};')
    lines.append('')
    lines.append('// The source colours, lightest first — not installed, kept for reference.')
    lines.append('export const TERRAIN_SRC_PALETTES = {')
    for name, keep in pals:
        lines.append("  %s: [%s]," % (name, ', '.join("'%s'" % hexc(c) for c in keep)))
    lines.append('};')
    lines.append('')

    lines += [
        '// ---- the town kit -------------------------------------------------------',
        '//',
        '// A BUILDING IS NOT A TILE. Each entry below is one object several cells',
        '// across, extracted whole off the Subrosia tileset and reassembled by the',
        '// block machinery in src/world/tileset.js: a room grid draws the building as',
        '// a rectangle of one legend character and the loader resolves each cell to',
        '// the art here. Nine loose tiles an author has to arrange by hand would be',
        '// nine ways to get one building wrong.',
        '//',
        '// UNLIKE THE TERRAIN ABOVE, THESE PALETTES ARE INSTALLED — the cartridge\'s',
        '// own colours, because this game has never drawn a roof and so has no',
        '// palette to preserve. tiles-core.js installs them before it registers the',
        '// tiledefs that name them.',
        'export const TOWN_PALETTES = {',
    ]
    for name, cols in TOWN_PALETTES.items():
        lines.append("  %s: [%s]," % (name, ', '.join("'%s'" % c for c in cols)))
    lines.append('};')
    lines.append('')
    lines.append('export const TOWN_ART = {')
    for name, w, h, note, cells, townart in town:
        for art, cnote, grid, pal in townart:
            lines.append('  // %s %s' % (name, cnote))
            lines.append('  %s: `' % art)
            lines.extend('    ' + r for r in grid[:-1])
            lines.append('    ' + grid[-1] + '`,')
            lines.append('')
    lines.append('};')
    lines.append('')
    lines += [
        '// Each block: its size in cells, and the art + palette of every cell, in',
        '// reading order. tiles-core.js turns this into one tiledef per cell and one',
        '// registerBlock call; what each cell DOES (solid, the doorway that warps) is',
        '// design and is declared there, not here.',
        'export const TOWN_BLOCKS = {',
    ]
    for name, w, h, note, cells, townart in town:
        lines.append('  // %s' % note)
        lines.append('  %s: { w: %d, h: %d, cells: [' % (name, w, h))
        i = 0
        for cy in range(h):
            row = []
            for cx in range(w):
                row.append("['%s', '%s']" % (townart[i][0], townart[i][3]))
                i += 1
            lines.append('    [%s],' % ', '.join(row))
        lines.append('  ] },')
    lines.append('};')
    lines.append('')

    with open(OUT, 'w') as f:
        f.write('\n'.join(lines))
    ncells = sum(b[1] * b[2] for b in TOWN)
    print('emitted %d terrain tiles (%d ground, %d props) and %d town blocks '
          '(%d cells, %d palettes) -> %s'
          % (len(arts), len(PICKS) + len(TRANSFORMS), len(PROPS), len(TOWN), ncells,
             len(TOWN_PALETTES), OUT))
    for name, n in dropped:
        print('  note: %s had %d colours on the sheet, merged down to 4' % (name, n))


if __name__ == '__main__':
    main()
