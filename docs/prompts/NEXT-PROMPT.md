# Next session — finish the cliffs region, its last row

## Read first
- `docs/AUDITED-ROOMS.md` — 100 rows so far (S64-S84). Coast, marsh, dunes,
  wood, reef and salt are fully done. Cliffs is three-quarters done
  (12/16); coral, abyss and cliffs' last row (20 rooms) are all that's left.
- `docs/prompts/LEDGER.md`'s "Known and deliberately unfixed" section: the
  three S72 visual patterns that look like defects and aren't, the two S77
  ledge notes, and the S78 reef-palette finding.
- **Eight sessions running (S76, S77, S79, S80, S81, S82, S83, S84) have
  each found or ruled out a stray ledge sitting in open ground with
  nothing marking a real step — check every ledge in this batch against
  its actual neighbouring TILE DATA (which legend character is on each
  side), not the room's name or a guess by eye.** `overworld,1,5` (Marsh
  Stair) has a `____` run worth checking this way first.
  When a screenshot looks ambiguous (a sprite's colour/pose, a pool's
  extent), zoom in tighter (`--dpr=5`+, a `--px/--py` near the feature)
  before writing it up as a defect — S84's Boulder Run and Deep Cut
  verdicts are worked examples of a false alarm resolved exactly that way.

## Why this, now
S84 finished cliffs' third row and confirmed check-drift's audit count at
100 of 120. This session finishes cliffs (its 4th and last row,
`overworld,0-3,5`) — after it lands, only coral (8 rooms) and abyss (8
rooms) remain in the whole rotation.

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
- `overworld,0,5` (Kell Foot), `overworld,1,5` (Marsh Stair)
- `overworld,2,5` (Sunken Shelf), `overworld,3,5` (Kell Spur)

## Done means
- `node tools/check-drift.mjs`'s audit count goes from 100 to 104.
- `node tools/check-strands.mjs` still reports no new multi-cell region.
- Any real fix made is verified (screenshot + relevant checker).
- STATE.md gets one new session-log row, and notes the cliffs region as
  fully audited (16/16) if this row confirms clean.

## Out of scope
- Coral or abyss — pick the first coral room only after this row lands.
- Reopening npc-detail (#5) or enemy-roster (#4).
- Advancing `OBJECTIVE OF RECORD` — the actual overworld total is 120
  rooms (check-drift measures it directly), not the ~90 STATE.md's
  rotation text still says; 104/120 after this session is still 16 short.
  Don't rewrite the rotation table until check-drift's own count reaches
  120.
- Chasing the S78 reef-palette finding — it has no detour token yet.
