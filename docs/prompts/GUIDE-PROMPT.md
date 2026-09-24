# Prompt — an illustrated walkthrough for Oracle of Tides

Paste everything below the line into a new session. This task is separate
from the standing session charter: do not run the charter, touch no game
code, and do not change the objective of record.

---

Write an illustrated walkthrough and guide for Oracle of Tides, the game in
this repository, for a person who is stuck: **they cannot beat the first
dungeon.** They will read it on a phone next to the game and in a desktop
browser. It must show them what to do with pictures, not only tell them.

## Who it is for, and how to talk to them

A player, not a programmer. Plain, friendly language — the tone of a printed
Nintendo Power-style guide. No file names, function names, room keys like
`d1/0,3,2`, or tile coordinates in the guide itself. Give places their
in-game names ("the Tide Gallery", "Tidewatch Village") and give directions
the way a player sees them ("the door in the north wall", "the second block
from the left"). Spoilers are fine, but each dungeon's section opens with a
one-line hint before the full solution, so a reader who only wants a nudge can
stop there.

## What already exists, and why it is not enough

`docs/GUIDE.md` and `docs/GUIDE.html` are a long text-only walkthrough written
before every dungeon was rebuilt at full Oracle room size (sessions S137-S143).
Its room layouts and coordinates are out of date. Use it only as a list of what
is in the world; check every claim against the game as it is now.

## The source of truth

- `tools/playthrough-route.mjs` is a complete, working solution: the exact
  route a robot plays from a new game to the ending, every room, every key,
  every puzzle, every boss. `node tools/check-playthrough.mjs` proves it
  finishes the game. **Follow it.** If the guide says to do something the
  route does not do, say why or cut it.
- `node tools/route-prefix.mjs <from> <to>` plays the real route up to any
  step in seconds. Use it to stand Link exactly where each screenshot should be
  taken.
- `node tools/shoot-rooms.mjs` screenshots any room at any tide
  (see its header for `--tide`, `--px`, `--py`, `--cam`); `tools/shoot-map.mjs`
  renders maps.
- The game's own text: `src/data/story.js` (dialogue), `docs/ITEMS.md` (what
  each item does), `docs/DUNGEON-STATUS.md` (dungeon order and themes).
- The controls are in `index.html` and the in-game signs.

## What to make

1. **The screenshots.** Real in-game frames at the game's native 160x144,
   scaled up 3x with nearest-neighbour (never blurred). For every room where
   the player has to do something, one picture of the room with arrows,
   numbers or circles drawn on it to show where to go and what to push, and in
   what order. Draw the markup in a clear colour that cannot be mistaken for
   game art. Where the tide matters, show the room at each tide level it needs.
   Save them under `docs/guide/img/` as PNGs.
2. **A dungeon map for each dungeon**, with the route through it marked and
   the keys, chests, the boss door and the boss numbered in the order you get
   them.
3. **The guide itself**: one self-contained HTML page, `docs/guide/index.html`,
   that works opened straight from the file on a phone or a desktop with no
   server and no internet. Mobile first: readable at 360px wide with no
   sideways scrolling; images fill the width and can be tapped to enlarge;
   a sticky contents menu; light and dark mode. Chapters:
   - How to play: controls on the phone's touch pad and on a keyboard, the
     screen and HUD explained with a labelled screenshot, how the tide conch
     works (the one idea the whole game is built on), saving.
   - **The first dungeon, Tidewash Grotto, in the most detail of all** —
     every room, what to do there and why, the Anchor and how to throw and
     recall it, the key doors, the crab miniboss and the boss, with the
     pattern of each fight and how to win it at low health. This is where the
     reader is stuck; it must be impossible to get lost with it.
   - Then the overworld between dungeons and each later dungeon in order,
     the same way but tighter.
   - The optional things (Heart Pieces, the Coastwise Chain trade, charms,
     caves) as a checklist at the back, with a picture of where each one is.
   - A short "stuck?" section per dungeon: the three things people miss.
4. **Publish it.** Build the page so it can also be published as an Artifact
   (the images inlined or published alongside it), publish it, and give the
   human the link as well as the file path.

## How to know it is right

- Walk every step of the first dungeon's section against the route with
  `route-prefix.mjs` and a screenshot: the picture in the guide must be what
  the game shows at that step.
- Every in-game name in the guide must match what the game shows (room
  banners, item names, NPC names).
- Open the page at 360px and 1280px wide in the headless browser and look at
  the screenshots of it: no overflow, no blurry images, contents menu works.
- Send the human three sample pages as images before finishing the rest, so
  they can say whether the style is right.
- Commit it (`docs/guide/`) with a message that says what a player gets. Do
  not change any game code; if you find a bug while writing, write it down in
  `docs/NEXT-SESSION.md` and keep going.
