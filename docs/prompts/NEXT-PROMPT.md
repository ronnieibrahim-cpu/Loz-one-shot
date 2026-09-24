# Next session — rebuild the Drowned Wood Shrine at Oracle size

## Read first
- `docs/prompts/STATE.md` — the whole file.
- `docs/prompts/LEDGER.md`'s "Settled at S140" and "Settled at S137" sections.
- `docs/NEXT-SESSION.md`, the S140 and S137 entries only (S137 has the recipe).
- `src/data/dungeons-a.js`: the rebuilt `d4` block (the latest worked
  example); `src/data/dungeons-b.js`: the `d5` block you are replacing.
- `tools/rip-dungeon-themes.py`: the `x*` Dancing Dragon picks and their comment.

## Why this, now
The human asked for every dungeon at real Oracle room size (15x11, wall ring,
scrolling camera, one-tile doors, key doors in the ring). D1 to D4 are
rebuilt and played to THE END. D5 is next in order and is still ten-by-eight
rooms, on two floors. The human allows more rooms when that makes the puzzles
better.

## The task
Rebuild `d5` Drowned Wood Shrine at `cell: [15, 11]`, keeping its room graph,
its Reefseed groves (every one still proved by `tools/check-reefseed.mjs`),
its Lens fork (`tools/check-lens.mjs`) and its item placement; move its key
and boss doors into the ring. Give it its own Seasons kit: the Ancient Ruins
sheet in `assets/sheets/` is the last per-dungeon sheet not yet used (gold
floor, brown stone) — look at its True Colors half, find its plain ring room
and its door key strip the way S140 did for the Dancing Dragon, and check
whether it draws jambs. Cut it as `r*` picks in `tools/rip-dungeon-themes.py`
(the existing `ruinFloor`/`ruinFloorAlt` picks are from the map sheet; keep
them unless nothing draws them). Point `dWallWood`'s `ring` and the Wood
theme at them; decide whether `ring.faces` suits it; give `5`/`Y`/`k` the
Shrine's own look where they now draw outdoor art. Update
`src/data/overworld.js`'s d5 arrival to the new mouth (px 112, py 144).

Re-route `tools/playthrough-route.mjs`'s D5 section room by room
(`tools/route-prefix.mjs` plays the real run up to any directive in seconds;
`tools/try-room.mjs` for single rooms), re-record the `d5-*` replays, and re-read `ROUTE_ARENA.d5` and the
`thornvine` row in `tools/measure-boss-combat.mjs` from the new trace.

Deepen one or two rooms with a second use of the Reefseed, proved both ways
by `tools/check-reefseed.mjs`, with a readable hint in the room. Nothing
obscure.

## Done means
- `node tools/validate.mjs`, `walk-dungeons.mjs`, `check-dungeon-strands.mjs`,
  `check-reefseed.mjs`, `check-lens.mjs`, `solve-switches.mjs`,
  `check-placement.mjs`, `check-ground.mjs`, `check-exits.mjs`,
  `check-tilesets.mjs`, `check-bosses.mjs`, `check-rippers.mjs`,
  `check-hearts.mjs`, `check-progression.mjs` all green.
- `node tools/replay.mjs` and `node tools/test.mjs` green.
- `node tools/check-playthrough.mjs` green, ending on THE END with six
  Essences and no deaths.
- `node tools/check-drift.mjs` OK; `npm run build` with `dist/` committed.
- A person looks at `node tools/shoot-rooms.mjs --whole` shots of every D5
  room, at LOW and HIGH, and the rooms read as a Seasons dungeon.

## Out of scope
- D6. One dungeon per session; it gets its own Seasons kit.
- Push blocks drawing the generic block sprite in every themed dungeon
  (NEXT-SESSION S140 "Open"): it touches all five rebuilt dungeons.
- Direction art for torrent tiles (NEXT-SESSION S139): its own session.
- D1 and D2's flat interior walls: their look was approved; `ring.faces`
  stays off for them.
- Re-balancing any boss beyond what the new arena size forces; measure first
  over thirteen seeds with `tools/measure-boss-combat.mjs` and write down
  what moved. NEVER pass `--at=route`.
- The pause menu's look, which the human has not ruled on.
