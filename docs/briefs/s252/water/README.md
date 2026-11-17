# Oracle of Ages water: pool, waterfall, shore foam (comparison)

Nothing here is merged. The branch is for looking at; each change is its own
commit so you can keep or drop it.

`ages_strip_labelled_6x.png` shows the strip at the bottom-left of the Ages
overworld sheet with the cells used boxed and labelled. Every row of the strip
has all four animation frames and ends in a colour swatch.

## (a) Shallow pool water

Ages cell: row y=2903, lavender swatch, four frames at x=1, 18, 35, 52.
It is plain light-blue water with a few small pale dashes.

What changes on screen: the speckly, glittery look of our shallows becomes a
calm flat blue with tidy dashes, the way the pools in Ages look. It now has
four animation steps instead of three. The dark scalloped edge where water
meets land is kept and rebuilt on the new water. The new water is slower to
shimmer (a step every 13 frames, the same as the deep water).

Before / after (same screens, scale 3):
- `before_dunes_sea0.png` / `after_dunes_sea0.png` (also `_sea1`, `_sea2`): sand channel
- `before_woodedge_sea0.png` / `after_woodedge_sea0.png` (also `_sea1`, `_sea2`): forest pond, shallow ring around deep water
- `before_strand_sea1.png` / `after_strand_sea1.png`
- `before_ring_sea2.png` / `after_ring_sea2.png`
- `pool_before_after.gif`: the forest pond side by side, animated

I looked at all of them. No tile seams, and the colour fits next to the deep
water and the sand. The pool is a little paler and plainer than ours. Our old
water was a lake crop nudged to fake frames; this is the real thing with real
frames.

Opinion: Ages' is better. It is truer to the source, it tiles with no pattern
you can pick out, and its motion is the cartridge's own. The one cost is that
it is calmer and less sparkly. Since the old note worried about a "ladder"
look, I checked large pools: the dashes are sparse and offset, and it reads
fine at room size.

## (b) Waterfalls

Ages cells: body at y=2920 (yellow swatch), four frames, x=1..52; the top
piece under a dark cliff lip at x=179..230, y=2852 (brown swatch).

What changes on screen: nothing today. **Our game has no waterfall at all**, and
no room uses a waterfall tile, so there is no "before" picture. The hand-drawn
`foamN` is also unused. I added the Ages body and top as two new solid tiles
(`waterfall`, `waterfallTop`) that a room can place.

To show them I put a test waterfall into a forest screen (a cliff, the top
piece, two body rows, a pool at the foot):
- `after_waterfall_mock_00.png`
- `waterfall_ages_mock.gif` (animated)

It looks right: foamy white streaks falling over a dark lip, the same blue
family as the pool. The animation speed (a step every 8 frames) is my guess.
The body repeats every 8 rows, so it stacks to any height.

Opinion: take it whenever you want waterfalls. There is nothing to compare it
with, and it is clearly in the right style.

## (c) Surf / shore foam

Ages cells: y=2937 (olive swatch), x=1..52, plus two sand-corner pieces at
x=268, y=2886 and y=2903.

Honest finding: these are not surf. They are the foot of a waterfall landing on
a sandy bank (falling water on the top half, cream beach on the bottom). The
strip has no separate foam tile. Our shore edge today is the dark scalloped
line from (a), not the unused `foamN`.

I tried it anyway: the south piece used for the edge where shallow water meets
land, turned for the other three sides. The two corner pieces are the wrong
shape (sand in one quarter only), so water cells with land on two sides use a
straight edge instead.

- `surf_dunes_sea0.png`, `surf_woodedge_sea2.png`, `surf_strand_sea1.png`, `surf_ring_sea2.png` (all seas in the same set of names as above). Compare with the `after_*` files, which keep the dark edge.

What it looks like: every shoreline turns into a small waterfall, with pale
blue bands, falling streaks and a hard cut at the corners. Along the sand
channel it reads as a row of waterfalls, which is wrong for a lake or beach.

Opinion: no. Ages' own shore is the bank art already used for banks. Keep the
dark edge from (a). This is the second commit on the branch; drop it (revert
it) to get (a) + (b) only.

## Checks on this branch

`validate`: OK (warns that the two waterfall tiles are unreachable, as no room
places them). `check-rippers`: 45 passed, 0 failed. `check-ground`: 8 passed,
0 failed.
