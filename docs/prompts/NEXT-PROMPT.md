# Next session — continue the Drowned Wood's south half

## Read first
- `docs/AUDITED-ROOMS.md` — 46 rows so far (S64-S71). Coast, marsh and
  every dunes-legend room labelled "Dunes" are fully done. Wood is 1/15
  (South Wood only).
- `docs/ART-DIRECTION.md` and `docs/ART-BACKLOG.md`'s "shore has a rim"
  entry — the usual known exceptions (composited rim vs hard deep-water
  edge, open sea always hard, a fixed-terrain patch surrounded by
  flooding tide tiles). Don't trust a visual water/land read over a
  direct engine query if the two seem to disagree — S70's STATE.md row
  has the throwaway-script method.
- CLAUDE.md's own hard-won-lessons list, the "solid tile can strand a
  room" entry specifically — it names **The Gyre** (`0,7,3`) and
  **Drowned Hollow** (`0,7,4`) by name as rooms a tree-crown fix once
  silently severed while every checker but `check-strands.mjs` stayed
  green. Those two rooms are NOT in this session's list (they need their
  own careful session) but are the reason `check-strands.mjs` gets run
  again this session even though the 6 rooms below aren't those two.
- `docs/prompts/STATE.md` — objective #6 and its allowlist.

## Why this, now
S71 opened the Drowned Wood with South Wood and ran `check-strands.mjs`
alongside the visual pass specifically because CLAUDE.md flags this
region as the one place a room can look fine and still be silently
broken. That pattern should continue for every wood room, not just the
first one, until the region is done.

## The task
Same method as the last 8 sessions: `tools/shoot-rooms.mjs
overworld,<rx>,<ry> --tide=0/1/2` for each of the six rooms below (add
`--dpr=4` and/or a different `--px/--py` to zoom into a sprite or a tile
seam, or to sidestep an enemy sitting on the default spawn point), zoom
every ground boundary and every sprite, write one verdict row each to
`docs/AUDITED-ROOMS.md`. Run `node tools/check-strands.mjs` once at the
end of the batch (not per room) and confirm it's still at its baseline
before calling the session done.
- `overworld,5,6` (The Wading), `overworld,6,6` (Wood Foot) — the rest of
  wood's row 6, continuing directly from South Wood.
- `overworld,4,5` (Bog Trees), `overworld,5,5` (Wood Heart),
  `overworld,6,5` (Sunken Glade), `overworld,7,5` (Wood Verge) — wood's
  row 5.

## Done means
- `node tools/check-drift.mjs`'s audit count goes from 46 to 52.
- `node tools/check-strands.mjs` still reports no new multi-cell region.
- Any real fix made is verified (screenshot + relevant checker).
- STATE.md gets one new session-log row.

## Out of scope
- Rooms outside the six named above — The Gyre and Drowned Hollow
  specifically need their own dedicated, careful session, not a rushed
  add-on to this one.
- Re-opening npc-detail (#5) or enemy-roster (#4).
- Advancing `OBJECTIVE OF RECORD` — #6 needs many more than 52.
- Re-flagging a hard water edge, an open-sea map edge, or a fixed-terrain
  patch that stays dry while its tide-tile neighbours flood, as a defect
  without first checking it isn't one of the already-documented
  exceptions.
