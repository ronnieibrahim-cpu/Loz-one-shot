# Next session — open the cliffs region, its second row

## Read first
- `docs/AUDITED-ROOMS.md` — 92 rows so far (S64-S82). Coast, marsh, dunes,
  wood, reef and salt are fully done. Cliffs' first row (4 rooms) just
  landed; coral, abyss and the rest of cliffs (28 rooms) are all that's left.
- `docs/prompts/LEDGER.md`'s "Known and deliberately unfixed" section: the
  three S72 visual patterns that look like defects and aren't, the two S77
  ledge notes, and the S78 reef-palette finding.
- **Six sessions running (S76, S77, S79, S80, S81 the hard way, and S76's
  own original sweep) have each found or ruled out a stray ledge sitting
  in open ground with nothing marking a real step — check every ledge in
  this batch against its actual neighbouring TILE DATA (which legend
  character is on each side), not the room's name or a guess by eye.**
  S82 (Wind Shelf) is the latest confirmed-real example: `GGGG` above,
  `g` below, two different tiles by data. When a screenshot looks
  ambiguous (a sprite's colour, a pool's extent), check it against the
  room's own map/entity data or probe the live tile/entity in-engine
  before writing it up as a defect — S81's Pan Corner and S82's Kell
  Corner beetle are both worked examples of a false alarm resolved this way.

## Why this, now
S82 opened cliffs (4/16) and confirmed check-drift's audit count at 92 of
120. Cliffs is the biggest remaining region, split across two sessions like
salt was: S82 took its first row (`overworld,0-3,2`), this one takes its
second (`overworld,0-3,3`), then two more rows finish it.

## The task
Same method as every session this rotation: `tools/shoot-rooms.mjs
overworld,<rx>,<ry> --tide=0/1/2` for each of the four rooms below (add
`--dpr=4`+ and/or a different `--px/--py` to zoom into a sprite or a tile
seam, or to move Link off an enemy's own spawn tile), zoom every ground
boundary and every sprite, write one verdict row each to
`docs/AUDITED-ROOMS.md`. If a visual read is ambiguous, query
`room.tile(tx,ty,tide)` or sample raw pixels, or check the enemy's own
definition in `src/data/enemies.js` for its runtime palette/pose (see S82's
Kell Corner verdict), rather than trusting the screenshot crop alone.
Run `node tools/check-strands.mjs` once at the end of the batch and confirm
it's still at its baseline before calling the session done.
- `overworld,0,3`, `overworld,1,3`
- `overworld,2,3`, `overworld,3,3`

## Done means
- `node tools/check-drift.mjs`'s audit count goes from 92 to 96.
- `node tools/check-strands.mjs` still reports no new multi-cell region.
- Any real fix made is verified (screenshot + relevant checker).
- STATE.md gets one new session-log row.

## Out of scope
- Any other region (coral, abyss, or the rest of cliffs) — pick the next
  batch only after this row is done.
- Reopening npc-detail (#5) or enemy-roster (#4).
- Advancing `OBJECTIVE OF RECORD` — the actual overworld total is 120 rooms
  (check-drift measures it directly), not the ~90 STATE.md's rotation text
  still says; 96/120 after this session is still 24 short. Don't rewrite
  the rotation table until check-drift's own count reaches 120.
- Chasing the S78 reef-palette finding — it has no detour token yet.
