# Next session — finish the reef's row 1 and open row 2

## Read first
- `docs/AUDITED-ROOMS.md` — 66 rows so far (S64-S75). Coast, marsh, dunes
  and the whole Drowned Wood are fully done. Reef is 6/16 (Coral Gate,
  Palace Wall, Tide Steps, East Spire, Reefway, Hooked Channel).
- `docs/prompts/LEDGER.md`'s "Known and deliberately unfixed" section,
  the S72 bullet on three visual patterns that look like defects and
  aren't (flying-enemy shadows, a shore-adjacent `grassTuft` variant, a
  tree canopy overhanging a water cell). Also: if the default screenshot
  spot puts Link on top of an enemy's own spawn tile and the two sprites
  blend oddly, re-shoot with a different `--px/--py` before calling it a
  defect (S70, S73, S75 all hit this and it was never real).
- `docs/prompts/STATE.md` — objective #6 and its allowlist.

## Why this, now
S75 opened the reef region (legend `reef`, rock-floor ruins rather than
grass) with its top row and two rooms of row 1. The remaining two rooms
of row 1 plus the start of row 2 keep the region moving in the same
reading order (west to east, then down a row) the last several sessions
have used for every other region.

## The task
Same method as the last 11 sessions: `tools/shoot-rooms.mjs
overworld,<rx>,<ry> --tide=0/1/2` for each of the six rooms below (add
`--dpr=4`+ and/or a different `--px/--py` to zoom into a sprite or a tile
seam, or to move Link off an enemy's own spawn tile), zoom every ground
boundary and every sprite, write one verdict row each to
`docs/AUDITED-ROOMS.md`. If a visual read is ambiguous, query
`room.tile(tx,ty,tide)` or the relevant `Room` method directly in a
throwaway Playwright script rather than trusting the screenshot crop.
Run `node tools/check-strands.mjs` once at the end of the batch and
confirm it's still at its baseline before calling the session done.
- `overworld,10,1` (Palace Mouth), `overworld,11,1` (Spire Shallows) —
  the rest of reef's row 1.
- `overworld,8,2` (Sunken Colonnade), `overworld,9,2` (Reef Market),
  `overworld,10,2` (Drowned Steps), `overworld,11,2` (Outer Reef) —
  reef's row 2.

## Done means
- `node tools/check-drift.mjs`'s audit count goes from 66 to 72.
- `node tools/check-strands.mjs` still reports no new multi-cell region.
- Any real fix made is verified (screenshot + relevant checker).
- STATE.md gets one new session-log row.

## Out of scope
- `overworld,8,3`-`overworld,11,3` (reef's row 3) — next session's batch.
- Re-opening npc-detail (#5) or enemy-roster (#4).
- Advancing `OBJECTIVE OF RECORD` — #6 needs many more than 72.
- Re-flagging a flying-enemy shadow, a wet-neighbour `grassTuft` variant,
  a tree canopy overhanging a water cell, or a spawn-position sprite
  overlap as a defect without first checking the S72/S75 ledger/session
  notes for the same pattern.
