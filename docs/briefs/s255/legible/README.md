# Two readability fixes, as pictures (S255 proposal, nothing in the game changed)

Every picture here is a real screenshot of the real room with the candidate
pasted over it afterwards (a mock-up made with an image tool, not game code).
Everything is shown at double size. The art in the candidates is taken straight
off the cartridges; nothing is hand-drawn. The only thing changed is colour,
where said.

## 1. The silt cache in the Abyssal Keep

The room is The Slack Water (map d6, floor 1, room 5,3). The backlog's room
name `room-d6_0_5_3` is out of date; that room is the Sounding Floor and has no
silt. At low sea the ring sits on grey stone where dredging does nothing; at
mid sea the whole pan turns to water and dredging works. The ring itself is dark
blue on blue, so it is hardest to see exactly when it matters.

Pictures:

- `silt-rooms.png`: the whole room. Low sea now, mid sea now, then candidates A
  to D at mid sea.
- `silt-closeup-still.png`: low now, mid now, candidate A, zoomed.
- `silt-closeup-animated.png`: candidates B, C and D, four steps of their
  twinkle one after another.
- `silt-B-animated.gif`, `silt-C-animated.gif`, `silt-D-animated.gif`: the same
  moving (the game's own sparkle holds each step about 9 frames).

The candidates:

- **A, pale rings.** No new art at all: the same ring drawn in the palest
  colour the water already uses. It jumps out from the blue and still reads as
  "marks in the silt". Dry, it stays as it is, so the signal is wet = bright,
  dry = dull, which is the right way round.
- **B, one twinkle.** The little four-point glint Seasons draws
  (INTERAC_SPARKLE, the triforce-sparkle graphics, already in the game as the
  "twinkle" frames) beside the ring. I painted it white for the mock-up because
  its cartridge colours are orange. Subtle.
- **C, three twinkles out of step.** Same sparkle, three of them at different
  moments around the ring. Busy.
- **D, pale rings plus two twinkles.** A with a light touch of B.

Recommendation: **D** if you want it to feel like the games (the pale ring
reads in a still frame, the shimmer adds the "something is here" life), or **A
alone** for the smallest possible change. I would skip C, which crowds a ring
only a tile wide.

One thing I could not find: a stand-alone "shiny spot" tile in either
cartridge's tile data that I could be sure was a dig marker. The sparkle above
is the cartridges' own shiny thing, so B to D use it.

## 2. The snarl in the Drowned Wood Shrine

Room: The First Stake (map d5, floor 0, room 1,3). The snarl is the plant in the
narrow waterway on the right. Today it is the bush in oak colours, which says
"bush", and a bush can also be blown up. The snarl can only be cut.

Pictures:

- `snarl-rooms-low.png` and `snarl-rooms-high.png`: the whole room at low and
  high sea, now and candidates A to D.
- `snarl-closeup.png`: the plant and its surroundings zoomed.
- `snarl-closeup-animated.png`: A and B through their four sway steps.
- `snarl-A-animated.gif`, `snarl-B-animated.gif`: the same moving.

The candidates:

- **A, Ages' seaweed, native colours.** The seaweed from Oracle of Ages'
  underwater tileset (the sea-floor set, tileset $5f, metatile $c5; $c8 is the
  same weed arranged a little differently). In Ages it is already an animated
  tile (four frames, held 15 each, so it sways). Dark fronds over blue. It
  reads immediately as weed and cannot be mistaken for a bush. It sits on its
  own blue square, a little brighter than the Shrine's water.
- **B, the same seaweed with green fronds.** Same tile, fronds recoloured to
  the Shrine's own greens (two of the tile's four colours swapped), so it
  belongs to the Shrine and not to a sunken city. The best fit, I think.
- **C, Seasons' bramble.** Metatile $c8 in Seasons' spring overworld set, a
  dense round green thicket, in the Shrine's oak colours. Reads as "thorny",
  but it is still a round green lump like the bush. Not much better than today.
- **D, Seasons' grass blades.** Metatile $74, same set. Weak: its own square
  background had to be cut away and it looks ragged on the water. Shown for
  completeness; I would not use it.

Recommendation: **B** (Ages seaweed in Shrine greens), with A as the
no-recolouring fallback. Both are the cartridge's own picture of water weed you
cut, and both stop looking like a bush. I found no ready-made vine or thorn
tile in either cartridge's dungeon tilesets. Ages' overworld tileset is not in
the data folder in a form I could read, so any vine there is not covered.

## Not done

Nothing was added to a ripper, so there is no second commit. If one of these is
chosen, the next step is a small addition to the object ripper
(tools/rip-objects.py already reads Ages' tileset $5f; the seaweed would be
metatile $c5 with its four animation frames) plus the silt colour or sparkle
change in the tile table.
