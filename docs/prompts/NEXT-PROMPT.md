# Next session — make torrents and drowned wheels readable

## Read first
- `docs/prompts/STATE.md` — objective 11 polish, area (b) legible, pass 1.
- `docs/prompts/QUEUE.md`'s "POLISH ROTATION", stub (b).
- `docs/ART-BACKLOG.md`: "A CURRENT IS INVISIBLE" and "A DROWNED WHEEL
  LOOKS EXACTLY LIKE A WORKING ONE" — both entries in full.
- `docs/ART-DIRECTION.md`, and `docs/briefs/AGENTS.md` section J.
- `docs/NEXT-SESSION.md`, the S146 entry only.

## Why this, now
Area (a) pass 1 closed at S146: all 22 enemies flinch and die. Next in
the rotation is (b). The Bogwater Sanctum's torrents draw the same pixels
as still water (only `animRate` differs, 13 against 4) and say nothing
about direction; the Cliffside Cistern's wheels draw one sprite whether
they turn or are drowned. Both mechanics are proved; neither is visible.

## The task
Two fixes, in this order.
1. Torrents: directional foam. A travelling surface streak drawn over
   every `dTorrentE/W/N/S` tile (`src/data/tiles-core.js`), offset along
   its push vector, in the water's own palette — NOT a different blue.
   Look for foam/current art on the sheets first (the effects sheet and
   the overworld sheets); draw to match only if none. It must survive
   the tide-variant machinery and the `animCells` path in `room.js`.
2. Wheels: a drowned sprite. `GustWheel.drowned` (`src/game/objects.js`)
   is already computed every frame; give it a second sprite (weeded or
   pale, the way the source games draw a submerged object) and return it
   from `spriteName()` while drowned.
Target: a person shown the Undertow (d3,0,2,3) and d4,0,1,3 at MID and
HIGH says which water moves, which way, and which wheel will turn.

## Done means
- `node tools/shoot-rooms.mjs --tide=1 --px=80 d3,0,2,3` and the two
  d4,0,1,3 commands in ART-BACKLOG, before and after, sent to the human.
- `node tools/check-ground.mjs`, `node tools/check-cleats.mjs`,
  `node tools/check-bellows.mjs`, `node tools/test.mjs` green.
- `node tools/replay.mjs` green, or re-recorded only for the frames the
  overlay changes, with the reason in the commit.
- `node tools/check-playthrough.mjs` green to THE END.
- `node tools/check-drift.mjs` OK; `npm run build` with `dist/` committed.

## Out of scope
- The Lens's three blues, the tide gauge fixture, the Keep's mooring
  ring: pass 2 of (b).
- Making MID and HIGH water different colours (ART-BACKLOG forbids it).
- Enemy placement — (a) pass 2, next time round.
- The palette flash on hit noted at S146 — that is (d) feel.
- Any change to how a torrent pushes or when a wheel jams.
