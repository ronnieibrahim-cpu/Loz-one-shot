# Next session — finish the reef, all four last rooms

## Read first
- `docs/AUDITED-ROOMS.md` — 72 rows so far (S64-S77). Coast, marsh, dunes
  and the whole Drowned Wood are fully done. Reef is 12/16 (rows 0-2 done).
- `docs/prompts/LEDGER.md`'s "Known and deliberately unfixed" section, the
  S72 bullet on three visual patterns that look like defects and aren't
  (flying-enemy shadows, a shore-adjacent `grassTuft` variant, a tree
  canopy overhanging a water cell) and the S77 note that a cave-mouth
  drip particle is a real, intentional effect, not a defect.
- `docs/prompts/STATE.md` — objective #6 and its allowlist.
- **A ledge is not automatically clear just because the room has border
  cliff chars.** S76's grep for violations ("zero cliff chars in the
  room") missed Spire Shallows because its map border is drawn in `#`
  (cliff) even though the ledge itself sat in open sand with no real
  elevation change nearby. Judge each ledge by what is actually adjacent
  to it, not by whether the room contains a cliff char anywhere at all.

## Why this, now
S75-S77 opened and worked through the whole reef region (legend `reef`,
rock-floor ruins) row by row. Four rooms are left — `0,8,3` through
`0,11,3` — and finishing them closes out the reef entirely, the same way
S75-S76 already closed the wood.

## The task
Same method as the last several sessions: `tools/shoot-rooms.mjs
overworld,<rx>,<ry> --tide=0/1/2` for each of the four rooms below (add
`--dpr=4`+ and/or a different `--px/--py` to zoom into a sprite or a tile
seam, or to move Link off an enemy's own spawn tile), zoom every ground
boundary and every sprite, write one verdict row each to
`docs/AUDITED-ROOMS.md`. If a visual read is ambiguous, query
`room.tile(tx,ty,tide)` or the relevant `Room` method directly in a
throwaway Playwright script rather than trusting the screenshot crop.
Run `node tools/check-strands.mjs` once at the end of the batch and
confirm it's still at its baseline before calling the session done.
- `overworld,8,3` (Reef Foot), `overworld,9,3` (Barnacle Bank)
- `overworld,10,3` (Palace Causeway), `overworld,11,3` (Reef Edge)

## Done means
- `node tools/check-drift.mjs`'s audit count goes from 72 to 76.
- `node tools/check-strands.mjs` still reports no new multi-cell region.
- Any real fix made is verified (screenshot + relevant checker).
- STATE.md gets one new session-log row. If the reef is now fully done,
  say so in that row (it does not close the rotation objective by
  itself — 76 of 120 is well short of 90).

## Out of scope
- Any other region — pick the next unaudited region only after this batch.
- Re-opening npc-detail (#5) or enemy-roster (#4).
- Advancing `OBJECTIVE OF RECORD` — #6 needs many more than 76.
- Re-flagging a flying-enemy shadow, a wet-neighbour `grassTuft` variant,
  a tree canopy overhanging a water cell, a cave-mouth drip particle, or
  a spawn-position sprite overlap as a defect without first checking the
  S72/S75/S77 ledger/session notes for the same pattern.
