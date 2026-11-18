# S253 art proposals: mooring post, Penstock ice block, waterfall

Pictures only. Nothing in the game changes. The one code change (job 2's two
extra block colourings) is in its own commit and nothing uses it. The scripts
that made the pictures sit beside them (`make-*.py`).

## 1. The Keep's mooring post

Today it is a plain grey square (`mooring-candidates.png`, first picture).
The cartridges have no mooring ring or cleat that I could find in the tile
sheets I can read (Seasons' overworld, dungeons and caves; Ages' Ancient Tomb,
Mermaid's Cave, underwater). I looked through all of them. What they do have:

- **A. Bollard** (Ages Ancient Tomb, metatile $10, its own greys). A squat
  round capstan with a dark hole in the top. It reads as something you tie
  to. The catch: the Keep's gold urn is this very tile in the Keep's colours,
  so the post would look like a grey twin of the urn.
  Room picture: `mooring-room-A-bollard.png`.
- **C. Wooden pilings** (Seasons overworld, metatile $b9). Two brown dock
  posts with gold caps. By far the clearest "boats tie up here" signal, and
  not like anything else in the Keep. The catch: it is wood in a stone hall.
  Room picture: `mooring-room-C-pilings.png`.
- **B. Ring in a stone plate** (Ages underwater, $8a, greyed). Shown in
  the candidate strip only. It is a ring, but at game size it reads as a
  pale disc. Not recommended; it was left out of the room pictures.

Both room pictures are The Draw (d6, floor 1, the room with the two posts),
current on the left, candidate on the right. They are the real room with the
tile pasted on, not yet a built tile.

**Recommendation: C, the wooden pilings.** If wood in the Keep feels wrong,
take A. Either one is a drop-in for the post tile (the post stays solid and
hookable). Recolouring the pilings in the Keep's stone ramp is possible if you
want it greyer.

## 2. An ice block for the Penstock

The Penstock's block is the Abyssal Keep's ice block (from the Sword & Shield
Maze). Neither cartridge has another pushable ice block: the Cistern's own
tileset (Dancing Dragon Dungeon) only has the ordinary push block. So the only
real option is the same picture in the Cistern's own colour ramps
(`penstock-rooms.png`, `penstock-block-closeup.png`):

- **Now** (pale blue and slate): reads as ice, sits fine on the green floor.
- **Grey** (Dancing Dragon palette 3, its stone): turns it into a grey stone
  block. It matches the walls but loses the ice look, and looks like the
  ordinary push block's cousin.
- **Blue** (Dancing Dragon palette 5, cream and deep blue): the cartridge's
  own blue-and-cream ramp. Loud and yellowish, a poor ice.

**Recommendation: leave it as it is.** The current block already reads as ice,
which is what the puzzle needs, and nothing in the Cistern's colours does
better. The two alternatives are real, ready to use (separate commit, art names
`o_iceblock_cistern_grey` and `_blue`) but I would not pick either.

## 3. Where a waterfall could go

The two waterfall tiles (from Ages) are solid and animated. A waterfall needs
a cliff with water above it and water or a pool at its foot. Only three
screens have anything like that, and the pictures show the honest result
(`waterfall-N-*.png`, now on the left, with the fall on the right). In each,
every cell I would change is a cliff cell today, which is solid and not walkable,
so the swap is solid-for-solid and cannot cut off a path.

1. **Rustfall (0,3,0)** - **recommended.** Column 7, rows 2 to 4: the top piece
   at row 2, falling water on rows 3 and 4. A shallow river runs along the top
   and pours over the cliff into the pool below. The cells are cliff now.
   This is the only one that reads as a waterfall. (The top piece looks like
   flat deep water for its one cell; the falling part below it is convincing.)
   Close-up: `waterfall-1-rustfall-closeup.png`.
2. **Cliff Face (0,3,3)** - weak. Column 4, row 2 only (cliff now, water above
   and below it). One cell tall is just a blue gap in the cliff line. Take it
   only if the next fall below it is made taller.
3. **Cistern Path (0,0,3)** - weak. Column 1, row 2 (cliff now). The same
   one-cell problem, and it sits beside the sea at the screen's edge.

I did not find a fourth: the other screens with water near a cliff either sit
on a screen seam or put the cliff in the middle of a lake.

### Exact cells (not applied; the overworld is unchanged in this commit)
Map characters needed: add to `legends.js` base `'W': 'waterfallTop'` and
`'w': 'waterfall'`, then in `overworld.js`:
- 0,3,0 rows 2, 3, 4: change the `#` at column 7 to `W`, `w`, `w`.
- 0,3,3 row 2: change the `#` at column 4 to `W`.
- 0,0,3 row 2: change the `#` at column 1 to `W`.
After placing, run `check-strands`, `check-overworld`, `check-placement` and
`check-ground`, as the tile rules ask.

The pictures were made by temporarily making those edits, shooting with
`tools/shoot-region.mjs`, and restoring the files.
