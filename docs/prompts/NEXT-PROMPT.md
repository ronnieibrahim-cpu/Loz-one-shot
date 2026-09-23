# Next session — rebuild the Bogwater Sanctum at Oracle size

## Read first
- `docs/prompts/STATE.md` — the whole file.
- `docs/prompts/LEDGER.md`'s "Settled at S138" and "Settled at S137" sections.
- `docs/NEXT-SESSION.md`, the S138 and S137 entries only (S137 has the recipe).
- `src/data/dungeons-a.js`: the rebuilt `d2` block (the latest worked
  example) and the `d3` block you are replacing.
- `tools/rip-dungeon-themes.py`: the `c*` Crypt kit picks and their comment.

## Why this, now
The human asked for every dungeon at real Oracle room size (15x11, wall ring,
scrolling camera, one-tile doors, key doors in the ring). D1 landed at S137,
D2 at S138, both played to THE END. D3 is next in order and is still ten-by-
eight rooms with a single repeating wall tile.

## The task
Rebuild `d3` Bogwater Sanctum at `cell: [15, 11]` (drop its `scroll: false`),
keeping its room count, its room graph, its Cleats rooms and its item
placement; move its key and boss doors into the ring. Give it its own Seasons
kit: the Poison Moth's Lair sheet (`assets/sheets/oracle-seasons-dungeon-
poison-moths-lair.png`) is the obvious candidate for a swamp sanctum — look
at it before committing to it. Cut its ring corners, runs, jambs, fill,
floor, second floor, block and pot as `b*` picks in
`tools/rip-dungeon-themes.py` and point `dWallBog`'s `ring` and the Bog
theme's tiles at them. Re-route `tools/playthrough-route.mjs`'s D3 section
(use `tools/try-room.mjs` room by room), re-record the `d3-*` replays
(`node tools/replay.mjs --record d3-undertow`), and update `ROUTE_ARENA.d3`
in `tools/measure-boss-combat.mjs` from the new trace. Gloomtide's `wait`
will need re-sweeping: it is a frame-phase fight (see the route comment).

Deepen one or two rooms with a second use of the Cleats, proved both ways by
`tools/check-cleats.mjs`, with a readable hint in the room. Nothing obscure.
S138 did not get to D2's deepening; if D3 goes quickly, that is the other
candidate (see NEXT-SESSION S138, "Open").

## Done means
- `node tools/validate.mjs`, `walk-dungeons.mjs`, `check-dungeon-strands.mjs`,
  `check-cleats.mjs`, `solve-switches.mjs`, `check-placement.mjs`,
  `check-ground.mjs`, `check-exits.mjs`, `check-tilesets.mjs`,
  `check-bosses.mjs`, `check-rippers.mjs`, `check-dredge.mjs` all green.
- `node tools/replay.mjs` and `node tools/test.mjs` green.
- `node tools/check-playthrough.mjs` green, ending on THE END with six
  Essences and no deaths.
- `node tools/check-drift.mjs` OK; `npm run build` with `dist/` committed.
- A person looks at `node tools/shoot-rooms.mjs --whole` shots of every D3
  room, at LOW and HIGH, and the rooms read as a Seasons dungeon.

## Out of scope
- D4 to D6. One dungeon per session; each gets its own Seasons kit.
- The overworld, towns and caves: they are screens, not Oracle rooms.
- Re-balancing any boss beyond what the new arena size forces; measure first
  with `tools/measure-boss-combat.mjs` over thirteen seeds, and write down
  what moved. NEVER pass `--at=route`: the route arena is the default, and
  `--at=` with a non-number puts the actor in the wrong doorway.
- A boss-door art cut: no sheet in the repo has one.
- The pause menu's look, which the human has not ruled on.
