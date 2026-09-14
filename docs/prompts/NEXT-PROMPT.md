# Next session — finish the Drowned Wood except its two flagged rooms

## Read first
- `docs/AUDITED-ROOMS.md` — 52 rows so far (S64-S72). Wood is 7/15 (South
  Wood, The Wading, Wood Foot, Bog Trees, Wood Heart, Sunken Glade, Wood
  Verge). Coast, marsh and dunes are fully done.
- `docs/prompts/LEDGER.md`'s "Known and deliberately unfixed" section, the
  S72 bullet on three visual patterns that look like defects and aren't
  (flying-enemy shadows, a shore-adjacent `grassTuft` variant, tree canopy
  overhanging a water cell via `Room.quadCanopySolid`) — don't re-spend a
  session chasing any of the three again.
- CLAUDE.md's own hard-won-lessons list, the "solid tile can strand a
  room" entry — it names **The Gyre** (`0,7,3`) and **Drowned Hollow**
  (`0,7,4`) by name as rooms a tree-crown fix once silently severed while
  every checker but `check-strands.mjs` stayed green. They are NOT in
  this session's list (see "Out of scope").
- `docs/prompts/STATE.md` — objective #6 and its allowlist.

## Why this, now
S72 finished wood's rows 5 and 6. Rows 3 and 4 are the only wood rooms
left, and two of those eight (The Gyre, Drowned Hollow) are the exact
rooms CLAUDE.md flags as having been silently severed once already — they
need a dedicated, careful session, not a rushed add-on to a six-room
batch. Doing the other six now keeps the batch honest instead of skipping
straight past the whole row because two of its rooms are risky.

## The task
Same method as the last 9 sessions: `tools/shoot-rooms.mjs
overworld,<rx>,<ry> --tide=0/1/2` for each of the six rooms below (add
`--dpr=4`+ and/or a different `--px/--py` to zoom into a sprite or a tile
seam), zoom every ground boundary and every sprite, write one verdict row
each to `docs/AUDITED-ROOMS.md`. If a visual read is ambiguous, query
`room.tile(tx,ty,tide)` or the relevant `Room` method directly in a
throwaway Playwright script rather than trusting the screenshot crop (see
S70/S72's own STATE.md rows for the method). Run `node
tools/check-strands.mjs` once at the end of the batch and confirm it's
still at its baseline before calling the session done.
- `overworld,4,3` (Wood Edge), `overworld,5,3` (Rotting Grove),
  `overworld,6,3` (Wood Gate) — row 3, skipping `overworld,7,3` (The Gyre).
- `overworld,4,4` (Shrine Path), `overworld,5,4` (Shrine Mouth),
  `overworld,6,4` (Log Drift) — row 4, skipping `overworld,7,4` (Drowned
  Hollow).

## Done means
- `node tools/check-drift.mjs`'s audit count goes from 52 to 58.
- `node tools/check-strands.mjs` still reports no new multi-cell region.
- Any real fix made is verified (screenshot + relevant checker).
- STATE.md gets one new session-log row.

## Out of scope
- `overworld,7,3` (The Gyre) and `overworld,7,4` (Drowned Hollow)
  specifically — CLAUDE.md's own hard-won-lessons list names both as
  already having been silently severed once; they need their own
  dedicated session with `check-strands.mjs` run per-room, not folded
  into this six-room batch.
- Re-opening npc-detail (#5) or enemy-roster (#4).
- Advancing `OBJECTIVE OF RECORD` — #6 needs many more than 58.
- Re-flagging a flying-enemy shadow, a wet-neighbour `grassTuft` variant,
  or a tree canopy overhanging a water cell as a defect without first
  checking the S72 ledger entry — all three are traced, deliberate engine
  behaviour, not bugs.
