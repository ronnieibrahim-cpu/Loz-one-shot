# Next session — finish dunes' north row, start its south edge

## Read first
- `docs/AUDITED-ROOMS.md` — 34 rows so far (S64-S69). Marsh is fully done
  (12/12) and coast is fully done. Dunes is 7/20, one room deep into its
  north row (Dune Head, `7,6`).
- `docs/ART-DIRECTION.md` and `docs/ART-BACKLOG.md`'s "shore has a rim"
  entry — shallow water gets a composited rim, deep water (`waterD`) is a
  deliberate hard edge, open sea (`*`) at a map edge is always a hard
  edge (it's the world's edge, not a shore), and a one-tile channel or a
  fixed-terrain patch surrounded by flooding tide tiles also hard-edges
  (all KNOWN, not new findings if seen again — say so, don't re-flag).
- `docs/prompts/STATE.md` — objective #6 and its allowlist.

## Why this, now
S64-S69 audited 34 rooms with zero real defects and just closed out
Marsh entirely. Dunes is the only region with a room touched so far
(Dune Head) but not finished — finishing its north row keeps one region
in flight instead of three, and starting the south row gives the next
session an obvious continuation.

## The task
Same method as the last 6 sessions: `tools/shoot-rooms.mjs
overworld,<rx>,<ry> --tide=0/1/2` for each of the six rooms below (add
`--dpr=4` and/or a different `--px/--py` to zoom into a sprite, a tile
seam, or to sidestep an enemy sitting on the default spawn point), zoom
every ground boundary and every sprite, write one verdict row each to
`docs/AUDITED-ROOMS.md`.
- `overworld,8,6` (North Dunes), `overworld,9,6` (Sandbar Run),
  `overworld,10,6` (Feather Gap), `overworld,11,6` (East Dunes) — region
  "Dunes". This finishes the whole north row (`7,6`-`11,6`); if all 4
  come back clean, say so plainly in the verdict and session log.
- `overworld,7,9` (South Shallows), `overworld,8,9` (Wrecked Hull) —
  region "Dunes", the west end of the south row (row 9 is otherwise
  marsh/coast, already fully audited).

## Done means
- `node tools/check-drift.mjs`'s audit count goes from 34 to 40.
- Any real fix made is verified (screenshot + relevant checker).
- STATE.md gets one new session-log row.

## Out of scope
- Rooms outside the six named above.
- Re-opening npc-detail (#5) or enemy-roster (#4).
- Advancing `OBJECTIVE OF RECORD` — #6 needs many more than 40.
- Re-flagging a hard water edge, an open-sea map edge, or a fixed-terrain
  patch that stays dry while its tide-tile neighbours flood, as a defect
  without first checking it isn't one of the already-documented
  exceptions.
