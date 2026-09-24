# Next session — rebuild the Abyssal Keep at Oracle size

## Read first
- `docs/prompts/STATE.md` — the whole file.
- `docs/prompts/LEDGER.md`'s "Settled at S141" and "Settled at S137" sections.
- `docs/NEXT-SESSION.md`, the S141 and S137 entries only (S137 has the recipe).
- `src/data/dungeons-b.js`: the rebuilt `d5` block (the latest worked
  example) and the `d6` block you are replacing, with its header comment.
- `tools/rip-dungeon-themes.py`: the `r*` Ancient Ruins picks and their comment.

## Why this, now
The human asked for every dungeon at real Oracle room size (15x11, wall ring,
scrolling camera, one-tile doors, key doors in the ring). D1 to D5 are
rebuilt and played to THE END. D6 is the last, still ten-by-eight rooms, on
two floors. S141 the human asked for dungeons that GROW the way the Oracle
games' do, with less creative restraint: D6 is the largest, >=46 screens
(33 today). See STATE.md's ladder.

## The task
Rebuild `d6` Abyssal Keep at `cell: [15, 11]`, keeping its room graph on both
floors, its Dredge Line crossings and caches (every one still proved by
`tools/check-dredge.mjs`), its Lens fork, the Colonnade's grate and its item
placement; move its key and boss doors into the ring. Nereth's throne room
is 2x1 today (S66, a measured fairness call): keep it wide. Give the Keep
its own Seasons kit: the per-dungeon sheets are all used, so look at the
other dungeons on `oracle-seasons-dungeon-backgrounds.png`'s True Colors half
(D1 took the blue one at 1456,26) and pick the darkest one that is not the
Grotto's; find its ring room, its jambs and its doors the way S140/S141 did,
and cut `k*` picks. Point `dWallAbyss`'s `ring` and the Abyss theme at them;
decide whether `ring.faces` suits it. Update `src/data/overworld.js`'s d6
arrival to the new mouth.

Re-route `tools/playthrough-route.mjs`'s D6 section room by room
(`tools/route-prefix.mjs` plays the real run to any directive in seconds;
`tools/try-room.mjs` for single rooms), re-record the `d6-*` replays, and
re-read `ROUTE_ARENA.d6` and the `tideshade` and `brinehulk` rows in
`tools/measure-boss-combat.mjs` from the new trace (all three are stale by
~18k frames since S140-S141).

Grow it to at least 46 screens: new rooms and wings built on the Dredge
Line and the Keep's tide theme (the line crosses what the sea uncovers, the
floor gives up what the sea covers), each proved both ways by
`tools/check-dredge.mjs`, with readable hints. Bold, never obscure.

## Done means
- `node tools/validate.mjs`, `walk-dungeons.mjs`, `check-dungeon-strands.mjs`,
  `check-dredge.mjs`, `check-lens.mjs`, `check-trade.mjs`,
  `solve-switches.mjs`, `check-placement.mjs`, `check-ground.mjs`,
  `check-exits.mjs`, `check-tilesets.mjs`, `check-bosses.mjs`,
  `check-rippers.mjs`, `check-hearts.mjs`, `check-items.mjs` all green.
- `node tools/replay.mjs` and `node tools/test.mjs` green.
- `node tools/check-playthrough.mjs` green, ending on THE END with six
  Essences and no deaths.
- `node tools/check-drift.mjs` OK; `npm run build` with `dist/` committed.
- STATE.md's objective 10 done-condition ticked, and the next objective left
  to the human (the rotation is retired).
- A person looks at `node tools/shoot-rooms.mjs --whole` shots of every D6
  room, at LOW and HIGH, and the rooms read as a Seasons dungeon.

## Out of scope
- Any other dungeon. Each has its approved kit now.
- Push blocks drawing the generic block sprite in every themed dungeon
  (NEXT-SESSION S140 "Open"): it touches all six dungeons.
- Direction art for torrent tiles (NEXT-SESSION S139): its own session.
- D1 and D2's flat interior walls: their look was approved; `ring.faces`
  stays off for them.
- Re-balancing any boss beyond what the new arena size forces; measure first
  over thirteen seeds with `tools/measure-boss-combat.mjs` and write down
  what moved. NEVER pass `--at=route`.
- The pause menu's look, which the human has not ruled on.
