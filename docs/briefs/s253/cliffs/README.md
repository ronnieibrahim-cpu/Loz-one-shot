# Cliffs: Oracle of Ages' fuller set against ours

A proposal for you to look at and choose from. Nothing in the game was changed:
no screen, no tile, no rule. These are pictures only.

## What is in this folder

**01-ages-pieces-vs-ours.png** - the sheet. Top: the nine cliff pieces I cut
out of Oracle of Ages' overworld (the top edge, the middle, the bottom foot, and
the left and right ends of each), shown as Ages draws them, then again in our
grey stone colours. Below that, six more pieces Ages has for cliffs that turn a
corner or run down the side of a drop (not used in the mocks). At the bottom, the
two tiles we have now, and a small block of each so you can see how a cliff
"mass" builds up: ours on the left, Ages in our stone colours on the right.

**02 to 05** - four real screens, each shown twice. Left is the screen exactly as
the game draws it today. Right is the same screen with Ages' pieces laid over
every plain cliff square:

- 02-kell-cliffs: Cliffs of Kell (dark grey cliff, plus the lighter grey ledge
  with the pits and the crate).
- 03-dunes: a sandy basin ringed by plain grey cliff, with a wall along the bottom.
- 04-coral-reef: the pink cliff, a screen that is mostly cliff.
- 05-salt-pans: the white marble cliff, lots of short walls and gaps.

## How the mock was made

Each cliff square looks at the four squares touching it. If the square above is
not cliff, it gets Ages' top edge (the pale band). If the square below is not
cliff, it gets the foot. If the left or right side is open, it gets that rounded
end. Anything else gets the plain middle piece. A cliff running off the edge of
the screen counts as continuing, so it grows no edge there. Cracked walls and cave
mouths are left exactly as they are.

Ages' pieces are brown with a blue-white band. I recoloured them to match the
cliff in each region: dark grey for Kell, grey for the dunes, pink for the reef,
cream marble for the pans. I mapped each of Ages' colours to the matching shade
of the region's own four-colour set (outline to darkest, rock to the main shade,
highlighted courses and the band to the lightest). It is a stand-in, not a final
colour choice. The mock was done by pasting over the real screenshot, not by the
game itself.

## What would change on screen

- The cliff top would get a proper band along its whole length, and the ends of a
  cliff would curve round (visible at the bottom corners of the coral reef screen)
  instead of stopping square.
- Each cliff row looks like one stacked layer with a dark line under it, instead
  of our stippled stone texture. It is smoother and plainer.
- The game already puts a lip on the top edge today. In the pictures, the coral
  and marble screens show it in grey, because the lip is shared by every cliff
  colour. In the mock it takes the region's colour, which is probably a gain
  on its own.
- If you choose to go ahead, no screen has to be redrawn and nothing about where
  you can walk would change; every cliff square stays solid.

## Things that look wrong or unfinished in the mock

- **Ages draws a plateau edge seen from above; ours is a wall seen from the front.**
  Ages' band is the lip you would step off. Where a cliff is a tall wall with ground
  at its foot (the dunes' bottom wall, the reef's bottom corners) it reads more
  like a stepped terrace than a rock face. Where a cliff is a ledge around sand,
  as in the Dunes, it sits well.
- **Thin cliffs.** Ages' cliff is three rows (top, middle, foot). A cliff that is
  one row tall (the marble screen's short walls) only gets the top piece, so
  it ends flat with no foot. A two-row cliff gets top plus foot with no middle.
- **No inside corners.** Where a cliff turns a corner, so that a diagonal square is
  open, Ages has special pieces (the extras on the sheet). The mock only looks
  at the four touching squares, so those corners show a plain square join. That
  is the main thing the real version would have to add.
- **Tall rounded ends.** The end pieces curve outward at the foot, which in the
  Kell and reef screens leaves small notches where a short wall meets another.
- **Ground behind curves.** Behind the rounded corners I filled in the ground
  from the neighbouring square, so a few corner pixels may not match the ground
  texture exactly.
- **The right-hand end is Ages' own** (cut from the end of its cliff beside a
  staircase), not a mirror image, so its light falls slightly differently from
  the left.
- **Lost texture.** Our stippled stone and the dark rim line vanish. If you like
  the grittier look of ours, option 1 (swap the art only) is the one to ask for
  with less change; a hybrid, with our face and Ages' lip, is also possible.

## Where the pieces come from

`assets/sheets/oracle-ages-overworld.png`. The backlog gives the grid as
(2, 8); the pieces here sit at x=2 and y=2 on a 16 pixel grid in this part
of the sheet (top edge at 402,242, middle 402,258, foot 402,274, left end
386 column, right end 354 column). A one-pixel green seam line, an artefact of
how the sheet was stitched, crosses the middle row; it was repaired by copying the
matching row of the next course. All of this was done for the pictures only, not
through a ripper, because nothing is going into the game yet. If you choose
Ages' pieces, they would be added to the terrain ripper
(`tools/rip-terrain.py`), as the backlog and CLAUDE.md require.
