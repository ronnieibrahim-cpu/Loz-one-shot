# The player's guide

`index.html` is the illustrated walkthrough: one self-contained file (every
picture inlined) that opens from `file://` on a phone or a desktop. `img/` holds
the same pictures as separate PNGs.

Every picture is a real frame of the game, taken while
`tools/playthrough-route.mjs` plays from a new game to the ending — the same
route `check-playthrough.mjs` proves — so the guide describes a run that is
known to finish. To regenerate after the world or the route changes:

    node tools/guide/capture.mjs --raw=<scratch dir>    # raw frames + trail.json
    node tools/guide/annotate.mjs --raw=<scratch dir>   # docs/guide/img/*.png
    node tools/guide/build.mjs                          # docs/guide/index.html

- `tools/guide/shots.mjs` names the moments (a route directive index, plus
  frames or an in-page condition) and the empty rooms used for maps.
- `tools/guide/figures.mjs` is the markup on each picture, in room tiles.
- `tools/guide/guide.html` is the text; `tools/guide/shell.html` the page.

Route step numbers in `shots.mjs` are indices into `ROUTE`. If the route is
edited, re-run `node tools/route-prefix.mjs 0` and move the numbers with it,
then look at the pictures: a shot that lands in the wrong room still renders.
`docs/GUIDE.md` is the older text-only guide and predates the Oracle-size
dungeon rebuild; this one supersedes it for players.
