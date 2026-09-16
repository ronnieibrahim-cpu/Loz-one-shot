# Next session — open the cliffs region, its third row

## Read first
- `docs/AUDITED-ROOMS.md` — 96 rows so far (S64-S83). Coast, marsh, dunes,
  wood, reef and salt are fully done. Cliffs is half done (8/16); coral,
  abyss and cliffs' last two rows (24 rooms) are all that's left.
- `docs/prompts/LEDGER.md`'s "Known and deliberately unfixed" section: the
  three S72 visual patterns that look like defects and aren't, the two S77
  ledge notes, and the S78 reef-palette finding.
- **Seven sessions running (S76, S77, S79, S80, S81, S82, S83) have each
  found or ruled out a stray ledge sitting in open ground with nothing
  marking a real step — check every ledge in this batch against its
  actual neighbouring TILE DATA (which legend character is on each side),
  not the room's name or a guess by eye.** S82/S83 (Wind Shelf, Cistern
  Path) are the latest confirmed-real examples: a terrace tile on one
  side, a plain-floor tile on the other, two different tiles by data.
  When a screenshot looks ambiguous (a sprite's colour/pose, a pool's
  extent), check it against the room's own map/entity data, the enemy's
  definition in `src/data/enemies.js`, or a live tile/entity probe before
  writing it up as a defect — S81's Pan Corner and S82's Kell Corner
  beetle are both worked examples of a false alarm resolved this way.

## Why this, now
S83 finished cliffs' second row and confirmed check-drift's audit count at
96 of 120. Cliffs is split across four sessions like salt was split across
two: S82 took row 1 (`overworld,0-3,2`), S83 took row 2 (`overworld,0-3,3`),
this one takes row 3 (`overworld,0-3,4`), and one more session finishes it.

## The task
Same method as every session this rotation: `tools/shoot-rooms.mjs
overworld,<rx>,<ry> --tide=0/1/2` for each of the four rooms below (add
`--dpr=4`+ and/or a different `--px/--py` to zoom into a sprite or a tile
seam, or to move Link off an enemy's own spawn tile), zoom every ground
boundary and every sprite, write one verdict row each to
`docs/AUDITED-ROOMS.md`. If a visual read is ambiguous, query
`room.tile(tx,ty,tide)` or sample raw pixels, or check the enemy's own
definition in `src/data/enemies.js` for its runtime palette/pose, rather
than trusting the screenshot crop alone.
Run `node tools/check-strands.mjs` once at the end of the batch and confirm
it's still at its baseline before calling the session done.
- `overworld,0,4`, `overworld,1,4`
- `overworld,2,4`, `overworld,3,4`

## Done means
- `node tools/check-drift.mjs`'s audit count goes from 96 to 100.
- `node tools/check-strands.mjs` still reports no new multi-cell region.
- Any real fix made is verified (screenshot + relevant checker).
- STATE.md gets one new session-log row.

## Out of scope
- Any other region (coral, abyss, or cliffs' last row) — pick the next
  batch only after this row is done.
- Reopening npc-detail (#5) or enemy-roster (#4).
- Advancing `OBJECTIVE OF RECORD` — the actual overworld total is 120
  rooms (check-drift measures it directly), not the ~90 STATE.md's
  rotation text still says; 100/120 after this session is still 20 short.
  Don't rewrite the rotation table until check-drift's own count reaches
  120.
- Chasing the S78 reef-palette finding — it has no detour token yet.
