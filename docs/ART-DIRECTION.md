# Art direction

**`assets/sheets/` is the canonical reference for every visual in this project.**
This is a rule, not a suggestion. It applies to art extracted from those sheets
and equally to art drawn from scratch for things the sheets do not contain.

## The rule

1. **If a sheet has it, extract it.** Do not draw by hand something the source
   material already provides. Extraction is reproducible, exact, and free of
   drift. Follow the workflow in `docs/briefs/AGENTS.md` section J.

   This is the *first* rule because fidelity to the source games is the
   product. A hand-drawn approximation of something the sheet already has is
   strictly worse on every axis that matters: it is less faithful, it drifts
   toward whoever drew it, and it has to be re-judged by eye every time it
   changes, where an extraction is re-derived by running a script. Reach for
   the ripper before the pixel editor. "It is only three frames" is how a cast
   stops matching itself.

   **A frame need not fit a 16×16 cell.** The source draws past the cell in
   places — Link's held blade runs thirteen pixels past his feet. Cut what the
   sheet actually contains, declare the real size in
   `src/data/sprite-manifest.js`, and anchor it at the draw site. Cropping to
   16×16 to satisfy a convention throws away the thing that made the frame
   worth extracting.

   **But check what the MAP can hold before cutting a big object up.** Every
   tree in every Oracle sheet is 32×32, and the tempting move is to cut one into
   four quadrants so a 2×2 patch of tree tiles reassembles it. That was tried
   and reverted: this game's rooms place trees one cell at a time — 643 of its
   vertical tree runs are a single row tall — so most tiles had no partner and
   the result was half-trees offset against each other. Measure the data first.
   When the map cannot hold the source's object, rule 2 applies and you draw it
   to match at the size the map actually uses. See `docs/HANDOFF.md`.
2. **If no sheet has it, draw it to match.** Everything original to this game —
   the eight bosses, the minibosses, Nereth, the Essence orb, the tide valve,
   the Moon Conch, the tide-variant terrain — must be indistinguishable in
   style from the extracted art sitting next to it on screen.
3. **Never mix registers.** A screen containing an extracted Octorok and a
   hand-drawn boss should not betray which is which.
4. **Extractions are generated files. Never hand-edit one.** Add the frame to
   the tool's coordinate map and re-emit. A hand edit to a generated module
   survives exactly until the next person runs the ripper, and it leaves the
   file's header lying about where its pixels came from.

This governs the *art* only. The design rule is unchanged and this does not
touch it: mechanics, items, dungeons and story are ours. We borrow how the
source games look and move, never what they are about.

The failure mode this exists to prevent has already happened once: the first
pass at boss art was script-generated and produced smooth, soft blobs that
looked nothing like the rest of the cast. It was thrown away and redrawn.

## The style, measured from the sheets

Not opinion — these are counts taken across 194 enemy cells and 105 NPC cells in
`assets/sheets/`:

| Property | Measured value |
|---|---|
| Colours per sprite | median **3–4**, never more than 6 |
| Pure black (`#000000`) present | **84%** of enemies, **100%** of NPCs |
| Sprite fill | median **~65%** of the 16x16 cell |

What that means in practice:

- **Three colours plus transparency.** A sprite is a light-to-dark ramp of three
  tones and nothing else. The engine's four indices exist so index 3 can be the
  outline; indices 0–2 carry the form.
- **A hard black outline, one pixel, all the way round.** This is the single
  most important rule. It is what makes a sprite legible against grass, sand,
  stone and deep water alike. No exceptions for "soft" creatures.
- **No anti-aliasing and no gradients.** Every pixel is one of the four indices.
  There are no intermediate tones and no blending anywhere in the source art.
- **No dithering on characters.** Dither is used sparingly on *terrain* to
  suggest texture; creatures and objects are flat-shaded.
- **Fill the cell.** A 16x16 sprite that occupies a third of its cell reads as a
  speck. Aim for roughly two thirds coverage, feet near the bottom.
- **Chunky, readable silhouettes.** At this resolution the outline shape does
  almost all the communication. Draw the silhouette first; if it is not
  identifiable in pure black, no amount of interior shading will save it.
- **One focal point.** An eye, a mouth, a weak spot. The player needs somewhere
  to aim.

### Reference palettes

Taken directly from the source art, and the anchor for anything new:

```
Link       skin/hair #ffd68c   tunic #10ad42   outline #000000
```

Extracted sprites carry their own palettes, registered at load time by
`registerPalettes()` in `src/gfx/palettes.js`. Hand-drawn art should either
reuse a palette from `PALETTES` or add one in the same register — saturated but
not fluorescent, with a genuine dark step before the outline.

## Animation conventions

- Two-frame cycles, and the two frames must **differ by at least three pixels**.
  A one-pixel difference reads as a rendering glitch, not motion.
- Walk cycles change at the legs. Idles change at the eyes or a limb.
- `_d` faces the viewer, `_u` faces away, `_s` faces **RIGHT**. The engine
  mirrors `_s` for leftward movement, so a left-facing frame is never drawn.
- Down and up walk cycles in the source games often animate as a sprite plus its
  own mirror. That is a legitimate technique here too.

## Terrain

The same rules apply, with two differences: background tiles are fully opaque
(no transparency, no outline against neighbours), and light dithering is
acceptable to suggest sand grain, water chop or stone texture. Tiles must tile
seamlessly with themselves on all four edges.

`assets/sheets/oracle-ages-overworld.png` is the reference for overworld
terrain and props, and `oracle-seasons-dungeon-backgrounds.png` for dungeon
terrain. Both should be extracted from rather than approximated.
`custom-oracle-style-overworld.png` is a fan-made assembled map and is the
weaker source — it supplied the ground tiles below, but its props are merged
into masses. Prefer the Ages sheet, whose props are standalone cells on a
strict grid at phase (2, 8).
`tools/rip-terrain.py` lifts them and `src/data/tiles-terrain.js` overrides the
hand-drawn art of the same name. Nine ground tiles, the rock and the tree are
done. `cliff`, `cliffTop`, `bush`, `stump` and `palm` are not yet, and each is
a stated reason rather than an omission — see `docs/HANDOFF.md`, which records
what was searched for and what came back.

**Extracted terrain keeps the game's palettes.** Only the pixels are replaced.
That is what keeps the palette-swap variants (`grassDark`, `saltFlat`,
`iceFloor`, `rockFloorRust`) working, and it is how this game gives each region
a look without redrawing every tile — the same trick the GBC originals used.

The one exception so far, and the bar for making another: the extracted tree
needed a **trunk**, and all three tree ramps were pure green because the
hand-drawn tree they were built for had no trunk in it. No amount of index
juggling puts brown in a palette that has none, so `treeoak`, `treeoakdk` and
`treeoakdd` were added — the same ramps with index 2 swapped for wood. The
originals were left alone rather than edited, because `bush`, `bushSand` and
`palm` still use them. Add a palette when the source genuinely has a colour the
game's ramp cannot express; do not add one to avoid choosing an index. A
source tile's own contrast is not the game's contrast, though: check the result
in a screenshot, not in `preview.mjs --tiles`, which draws every tile in one
palette.

## The colour register of the sheets (P7.5, UNRESOLVED — needs a decision)

P7.5 asks which colour register `assets/sheets/` came from, because the dungeon
map rips it introduces contain the same floor twice: a left half labelled "GBC
LCD Colors" (corrected to simulate the physical GBC screen) and a right half
labelled "True Colors" (the raw palette from the ROM). Mixing the two across
the game would be a fidelity break that no checker can see.

**The decision cannot be made yet, and it is not mine to guess.** The test the
brief specifies is to sample a tile that appears in BOTH an existing sheet and
one of the new maps and compare RGB. The four maps it names — Ancient Ruins,
Explorer's Crypt, Poison Moth's Lair, Dancing Dragon Dungeon — are **not in
this repo**, so there is no second register to compare against.

What CAN be said now, measured rather than assumed. A GBC colour is five bits
per channel. The raw ROM register expands it as `v << 3`, so every channel is a
multiple of 8 and tops out at 248; an LCD-corrected register runs the value
through a matrix and produces arbitrary channel values and a black that is not
zero. Sampling every sheet for that signature:

| Sheet | distinct colours | channels multiple of 8 |
|---|---|---|
| `oracle-seasons-tileset-subrosia.png` | 138 | **99%** |
| `oracle-seasons-overworld-spring.png` | 123 | 76% |
| `oracle-seasons-overworld-winter.png` | 141 | 75% |
| `oracle-ages-overworld.png` | 115 | 69% |
| `oracle-seasons-maku-tree.png` | 103 | 42% |
| `oracle-seasons-dungeon-backgrounds.png` | 177 | 33% |
| the sprite sheets | 15–126 | 9–28% |

Every sheet contains pure black `(0,0,0)`.

**Read this carefully, because it is suggestive and not conclusive.** The
terrain sheets look like the raw `v << 3` register. The sprite sheets do not —
but they are also small palettes dominated by a chroma-key background
(`(0,128,0)` or `(0,255,255)`) and by pure white, which drag the ratio down
without saying anything about the art itself. So the honest summary is: the
terrain sheets are probably True Colors, the sprite sheets are unproven, and
the two groups have not been shown to agree.

That is precisely the case P7.5 says to stop on rather than resolve
unilaterally. **A future session must not pick a register from this table.**
Get the four maps in, run the tile-to-tile RGB comparison the brief describes,
and record the answer here with the numbers.

`tools/rip-dungeon-maps.py --half left|right|auto` is ready for whichever half
the answer turns out to be; `auto` detects the two-panel split by looking for a
tall run of background columns through the middle third of the image, and
reports `"half": "whole"` in the manifest when there is no split, which is the
case for every sheet in the repo today.

## Verifying a new asset

Dimensional validity proves nothing about whether art looks right. Both steps
are required:

```sh
node tools/validate.mjs --strict --pack=<pack>   # size, characters, coverage
node tools/preview.mjs <pack> --scale=6          # contact sheet PNG
```

Then **open the PNG and look at it**. Ask: does it read as the thing it is
named? Would it look out of place beside the extracted sprites? If either answer
is wrong, redraw it — do not ship it and note it as "acceptable".

For a final check, put it in the game and screenshot it:

```sh
node tools/test.mjs --shots --shot-dir=shots-check
```

## Credit, restated

The sheets carry ripper credits in `assets/sheets/README.md`. Keep them. They
cost nothing and they name the people who did the extraction work this project
is built on.
