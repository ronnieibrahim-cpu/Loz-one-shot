# Next session — open the reef region's north row

## Read first
- `docs/AUDITED-ROOMS.md` — 60 rows so far (S64-S73). Coast, marsh, dunes
  and the whole Drowned Wood (15/15) are fully done. Reef is untouched.
- `docs/prompts/LEDGER.md`'s "Known and deliberately unfixed" section,
  the S72 bullet on three visual patterns that look like defects and
  aren't (flying-enemy shadows, a shore-adjacent `grassTuft` variant, a
  tree canopy overhanging a water cell) — don't re-spend a session
  chasing any of the three again. Also the S70/S73 pattern: if the
  default screenshot spot puts Link on top of an enemy's own spawn tile
  and the two sprites blend oddly, re-shot with a different `--px/--py`
  before calling it a defect.
- `docs/prompts/STATE.md` — objective #6 and its allowlist.

## Why this, now
S73 finished the whole Drowned Wood, including a careful look at the two
rooms (The Gyre, Drowned Hollow) CLAUDE.md flags by name for a historical
tree-crown severing — both confirmed clean, `check-strands.mjs` still at
its established baseline. The reef region (legend `reef`, `rx` 8-11 x
`ry` 0-3, 16 rooms) is the next fully self-contained block and has not
been touched this rotation.

## The task
Same method as the last 10 sessions: `tools/shoot-rooms.mjs
overworld,<rx>,<ry> --tide=0/1/2` for each of the six rooms below (add
`--dpr=4`+ and/or a different `--px/--py` to zoom into a sprite or a tile
seam, or to move Link off an enemy's own spawn tile), zoom every ground
boundary and every sprite, write one verdict row each to
`docs/AUDITED-ROOMS.md`. If a visual read is ambiguous, query
`room.tile(tx,ty,tide)` or the relevant `Room` method directly in a
throwaway Playwright script rather than trusting the screenshot crop.
Run `node tools/check-strands.mjs` once at the end of the batch and
confirm it's still at its baseline before calling the session done.
- `overworld,8,0` (Coral Gate), `overworld,9,0` (Palace Wall),
  `overworld,10,0` (Tide Steps), `overworld,11,0` (East Spire) — reef's
  whole top row.
- `overworld,8,1` (Reefway), `overworld,9,1` (Hooked Channel) — the start
  of reef's row 1.

## Done means
- `node tools/check-drift.mjs`'s audit count goes from 60 to 66.
- `node tools/check-strands.mjs` still reports no new multi-cell region.
- Any real fix made is verified (screenshot + relevant checker).
- STATE.md gets one new session-log row.

## Out of scope
- `overworld,10,1` / `overworld,11,1` and the rest of reef's rows 2-3 —
  next session's batch, not this one's.
- Re-opening npc-detail (#5) or enemy-roster (#4).
- Advancing `OBJECTIVE OF RECORD` — #6 needs many more than 66.
- Re-flagging a flying-enemy shadow, a wet-neighbour `grassTuft` variant,
  a tree canopy overhanging a water cell, or a spawn-position sprite
  overlap as a defect without first checking the S72/S73 ledger entries.
