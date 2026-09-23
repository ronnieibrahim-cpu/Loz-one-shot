# Next session — rebuild the Coral Spire at Oracle size

## Read first
- `docs/prompts/STATE.md` — the whole file.
- `docs/prompts/LEDGER.md`'s "Settled at S137" section.
- `docs/NEXT-SESSION.md`, the S137 entry only.
- `src/data/dungeons-a.js`: the rebuilt `d1` block (the worked example) and
  the `d2` block you are replacing.
- `tools/rip-dungeon-themes.py`: the `g*` Grotto kit picks and their comment.

## Why this, now
The human asked for every dungeon at real Oracle room size (15x11, wall ring,
scrolling camera, one-tile doors, key doors in the ring). D1 landed at S137
with the engine, every checker and the playthrough route taught Oracle cells.
D2 is the next in order, and it is still ten-by-eight rooms drawn with a
single repeating wall tile — the gap the human called out.

## The task
Rebuild `d2` Coral Spire at `cell: [15, 11]`, keeping its 25 rooms, both
floors, its room graph, its Lens forks and its item placement; move its key
and boss doors into the ring. Give it its own Seasons kit the way D1 got the
blue dungeon's: pick ONE Seasons dungeon whose colour suits a coral spire
(the pink/violet Explorer's Crypt sheet is the obvious candidate), cut its
ring corners, runs, jambs, key doors, shutters, floor, second floor, block and
pot as `c*` picks in `tools/rip-dungeon-themes.py`, and point
`dWallCoral`'s `ring` and the Coral theme's tiles at them. Re-route
`tools/playthrough-route.mjs`'s D2 section for the new tiles, re-record the
`d2-*` replays, and update `ROUTE_ARENA.d2` and the Reefguard row in
`tools/measure-boss-combat.mjs` from the new trace.

Deepen one or two rooms the way D1's Long Sluice was deepened (a second use
of the dungeon's own item, proved both ways by its checker), with a readable
hint in the room. Nothing obscure.

## Done means
- `node tools/validate.mjs`, `walk-dungeons.mjs`, `check-dungeon-strands.mjs`,
  `check-lens.mjs`, `solve-switches.mjs`, `check-anchor.mjs`,
  `check-placement.mjs`, `check-ground.mjs`, `check-exits.mjs`,
  `check-tilesets.mjs`, `check-bosses.mjs`, `check-rippers.mjs` all green.
- `node tools/replay.mjs` and `node tools/test.mjs` green.
- `node tools/check-playthrough.mjs` green, ending on THE END with six
  Essences and no deaths.
- `node tools/check-drift.mjs` OK; `npm run build` with `dist/` committed.
- A person looks at `node tools/shoot-rooms.mjs --whole` shots of every D2
  room, at LOW and HIGH, and the rooms read as a Seasons dungeon.

## Out of scope
- D3 to D6. One dungeon per session; each gets its own Seasons kit.
- The overworld, towns and caves: they are screens, not Oracle rooms.
- Re-balancing any boss beyond what the new arena size forces; measure first
  with `tools/measure-boss-combat.mjs` over thirteen seeds, and write down
  what moved.
- A boss-door art cut: no sheet in the repo has one; `dDoorBoss` keeps its
  own art in the ring until a sheet does.
- The pause menu's look, which the human has not ruled on.
