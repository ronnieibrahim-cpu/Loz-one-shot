# Next session — audit the next ring, marsh's sanctum and the dune bowl

## Read first
- `docs/AUDITED-ROOMS.md` — 16 rows so far (S64-S66), 3 regions
  (Tidewatch Village, Marsh, Dunes). Same format for 6 more.
- `docs/ART-DIRECTION.md` and `docs/ART-BACKLOG.md`'s "shore has a rim"
  entry — by now-established patterns: shallow water gets a composited
  rim, deep water (`waterD`) is a deliberate hard edge, a one-tile-wide
  channel degrades to a rim on only one side (all three are KNOWN, not
  new findings if seen again — say so plainly rather than re-flagging).
- `docs/prompts/STATE.md` — objective #6 and its allowlist.

## Why this, now
S64-S66 audited 16 rooms across 3 legends (coast/marsh/dunes) with zero
real defects — the composited-edge rule, the shore-rim exceptions, and
the extracted-art register have all held up so far. This batch pushes
one ring further out: `overworld,1,7`/`1,8` continue into the marsh
("Sanctum Path"/"Sanctum Mouth" — likely approaching a dungeon or shrine
entrance, worth a close look at any structure art), `overworld,9,7`/
`9,8` continue the dunes ("Dune Bowl"/"Sandpiper Row" — Sandpiper Row is
where Sennit and the sandpiper family live, already seen in earlier
screenshots for the NPC work), and `overworld,3,9`/`6,9` fill in the
coast band south of the village ("South Bluff"/"Reef Pocket").

## The task
Same method as the last 3 sessions: `tools/shoot-rooms.mjs
overworld,<rx>,<ry> --tide=0/1/2` for each of the six rooms below, zoom
every ground boundary and every sprite, write one verdict row each to
`docs/AUDITED-ROOMS.md`.
- `overworld,1,7` (Sanctum Path) and `overworld,1,8` (Sanctum Mouth) —
  region "Marsh". If either contains a structure (shrine, ruin, dungeon
  mouth), check it against `docs/ART-DIRECTION.md`'s structure/prop
  rules specifically, not just ground texture.
- `overworld,9,7` (Dune Bowl) and `overworld,9,8` (Sandpiper Row) —
  region "Dunes". Sandpiper Row already appears in `docs/NPCS.md` (S61's
  `sandpiper`/`netMender` reassignment) — this is the first ART pass on
  a room this project's NPC work already touched; confirm the
  reassigned `npc_elder` sprite reads correctly in its actual overworld
  room, not just the interior screenshot S61 used.
- `overworld,3,9` (South Bluff) and `overworld,6,9` (Reef Pocket) —
  region "Tidewatch Village" (same `coast` legend as the earlier batch).

## Done means
- `node tools/check-drift.mjs`'s audit count goes from 16 to 22.
- Any real fix made is verified (screenshot + relevant checker).
- STATE.md gets one new session-log row.

## Out of scope
- Rooms outside the six named above.
- Re-opening npc-detail (#5) or enemy-roster (#4).
- Advancing `OBJECTIVE OF RECORD` — #6 needs 90 of ~120, not 22.
- Re-flagging a hard water edge as a defect without first checking it
  isn't deep water or a one-tile channel — both already documented.
