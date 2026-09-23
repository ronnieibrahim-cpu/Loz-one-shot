# Next session — rebuild the Cliffside Cistern at Oracle size

## Read first
- `docs/prompts/STATE.md` — the whole file.
- `docs/prompts/LEDGER.md`'s "Settled at S139" and "Settled at S137" sections.
- `docs/NEXT-SESSION.md`, the S139 and S137 entries only (S137 has the recipe).
- `src/data/dungeons-a.js`: the rebuilt `d3` block (the latest worked
  example) and the `d4` block you are replacing, with its header comment.
- `tools/rip-dungeon-themes.py`: the `b*` Moth's Lair picks and their comment.

## Why this, now
The human asked for every dungeon at real Oracle room size (15x11, wall ring,
scrolling camera, one-tile doors, key doors in the ring). D1, D2 and D3 are
rebuilt and played to THE END. D4 is next in order and is still ten-by-eight
rooms. The human now allows more rooms when that makes the puzzles better.

## The task
Rebuild `d4` Cliffside Cistern at `cell: [15, 11]`, keeping its room graph,
its Bellows sills (every one still proved by `tools/check-bellows.mjs`) and
its item placement; move its key and boss doors into the ring. Give it its
own Seasons kit: look at the Ancient Ruins and Dancing Dragon sheets in
`assets/sheets/` before choosing, and check whether the sheet carries its own
door key strip the way the Moth's Lair did (S139). Cut it as `x*` picks in
`tools/rip-dungeon-themes.py`, point `dWallCistern`'s `ring` and the Cistern
theme at them, and decide per the S139 note whether `ring.faces` suits it.
Update `src/data/overworld.js`'s d4 arrival to the new mouth.

Re-route `tools/playthrough-route.mjs`'s D4 section (`tools/try-room.mjs` room
by room), re-record the `d4-*` replays, and re-read `ROUTE_ARENA.d4` and the
`ironknight` row in `tools/measure-boss-combat.mjs` from the new trace. Walk
onto the Essence's own tile and wait out the pose before looting the Heart
Container (S139).

Deepen one or two rooms with a second use of the Bellows, proved both ways by
`tools/check-bellows.mjs`, with a readable hint in the room. Nothing obscure.

## Done means
- `node tools/validate.mjs`, `walk-dungeons.mjs`, `check-dungeon-strands.mjs`,
  `check-bellows.mjs`, `check-cleats.mjs`, `solve-switches.mjs`,
  `check-placement.mjs`, `check-ground.mjs`, `check-exits.mjs`,
  `check-tilesets.mjs`, `check-bosses.mjs`, `check-rippers.mjs`,
  `check-hearts.mjs` all green.
- `node tools/replay.mjs` and `node tools/test.mjs` green.
- `node tools/check-playthrough.mjs` green, ending on THE END with six
  Essences and no deaths.
- `node tools/check-drift.mjs` OK; `npm run build` with `dist/` committed.
- A person looks at `node tools/shoot-rooms.mjs --whole` shots of every D4
  room, at LOW and HIGH, and the rooms read as a Seasons dungeon.

## Out of scope
- D5 and D6. One dungeon per session; each gets its own Seasons kit.
- Direction art for torrent tiles (noted in NEXT-SESSION S139): it touches
  the overworld too, and is its own session.
- D1 and D2's flat interior walls: their look was approved; `ring.faces`
  stays off for them.
- Re-balancing any boss beyond what the new arena size forces; measure first
  over thirteen seeds with `tools/measure-boss-combat.mjs` and write down
  what moved. NEVER pass `--at=route`.
- The pause menu's look, which the human has not ruled on.
