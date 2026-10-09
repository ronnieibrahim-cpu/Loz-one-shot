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

## S159: merged and re-shot

The branch this guide was made on (claude/oracle-tides-guide-hb01hp) shares no
history with main, so it was copied over rather than merged. Everything was
re-captured on the current game: the route directive numbers in `shots.mjs`
and `figures.mjs` were moved with a longest-common-subsequence match of the
old ROUTE against the new one (48 of 1584 directives had changed); every
overworld reference was moved to the 17-screen map with `widenOverworldX`;
the static overworld shots read `OVERWORLD_W`. Chapter 2 is new (the S158
opening: Fishing Stones, Wenna, the Shipwright's Hollow, Farore's shrine,
the Maku Tree's key), each road chapter names who gives the next dungeon's
key (S154), and the edits that had only ever been made to the published
artifact (the side-content hearts, the Side quests table, chapter 12 in
plain words) are in `guide.html` now.

## S178: re-shot on the current game

Every picture was re-captured on the game as of S178 (the last capture was
S161). The route had changed in 17 directives since (boss re-timings, the
D5 keyhole, Farore's desk), so every `after`/`by` in `shots.mjs` and every
trail `from`/`to` in `figures.mjs` was moved with the same longest-common-
subsequence match as S159 (a changed directive maps to the slot it replaced).
Fights are shorter since the sword changes (S172-S175), so three fight shots
were re-timed by a scan (`plus` at 20-frame steps, looked at side by side).
`capture.mjs` now photographs a text box with its page typed out (the run is
not advanced for it) and the title shot starts the card and skips the
opening, so it shows the logo. The HUD figure's numbers follow S167's bar.
