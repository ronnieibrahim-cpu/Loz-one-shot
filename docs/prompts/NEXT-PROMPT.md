# Next session — audit marsh's west edge and dunes' far east

## Read first
- `docs/AUDITED-ROOMS.md` — 22 rows so far (S64-S67), 3 regions
  (Tidewatch Village, Marsh, Dunes). Same format for 6 more.
- `docs/ART-DIRECTION.md` and `docs/ART-BACKLOG.md`'s "shore has a rim"
  entry — shallow water gets a composited rim, deep water (`waterD`) is a
  deliberate hard edge, a one-tile-wide channel or a fixed-terrain patch
  surrounded by flooding tide tiles degrades to a hard edge (all KNOWN,
  not new findings if seen again — say so plainly rather than re-flagging).
- `docs/prompts/STATE.md` — objective #6 and its allowlist.

## Why this, now
S64-S67 audited 22 rooms across coast/marsh/dunes with zero real defects.
Tidewatch Village's 4 rooms and every plain-`coast`-legend room but one
are now done. This batch finishes marsh's near ring and pushes to the
far edges of dunes, where no room has been looked at yet.

## The task
Same method as the last 4 sessions: `tools/shoot-rooms.mjs
overworld,<rx>,<ry> --tide=0/1/2` for each of the six rooms below (add
`--dpr=4` on any shot you want to zoom into for a sprite or a tile seam),
zoom every ground boundary and every sprite, write one verdict row each
to `docs/AUDITED-ROOMS.md`.
- `overworld,0,7` (Mire) and `overworld,0,8` (Deep Mire) — region
  "Marsh", the western edge of the marsh strip already covered by
  Sanctum Path/Mouth and Bog Causeway/Sunken Reeds.
- `overworld,1,6` (Bog Stair) — region "Marsh", the row north of Sanctum
  Path.
- `overworld,10,7` (Tidepools) and `overworld,11,7` (Far Dunes) — region
  "Dunes", the far east edge past Dune Bowl. Far Dunes' own map has
  `***` cells (open sea) at its east edge — confirm those read as sea,
  not a rendering gap.
- `overworld,3,6` (Bluff Hollow) — region "Tidewatch Village" (`coast`
  legend), the last plain-coast room near the village not yet audited.

## Done means
- `node tools/check-drift.mjs`'s audit count goes from 22 to 28.
- Any real fix made is verified (screenshot + relevant checker).
- STATE.md gets one new session-log row.

## Out of scope
- Rooms outside the six named above.
- Re-opening npc-detail (#5) or enemy-roster (#4).
- Advancing `OBJECTIVE OF RECORD` — #6 needs many more than 28.
- Re-flagging a hard water edge, or a fixed-terrain patch that stays dry
  while its tide-tile neighbours flood, as a defect without first
  checking it isn't one of the already-documented exceptions.
