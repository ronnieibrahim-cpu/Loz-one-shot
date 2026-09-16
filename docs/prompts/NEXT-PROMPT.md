# Next session — finish the coral region, its second row

## Read first
- `docs/AUDITED-ROOMS.md` — 108 rows so far (S64-S86). Coast, marsh, dunes,
  wood, reef, salt and cliffs are all fully done. Coral is half done
  (4/8); abyss (8 rooms) and coral's second row are all that's left.
- `docs/prompts/LEDGER.md`'s "Known and deliberately unfixed" section: the
  three S72 visual patterns that look like defects and aren't, the two S77
  ledge notes, and the S78 reef-palette finding.
- S86's four coral verdicts in `docs/AUDITED-ROOMS.md` for the region's
  established patterns: `reefFlat`(6)/`reefDeep`(7) both read as water at
  every tide (only walkability changes, not always visible dryness), and a
  screenshot's default Link spawn point can land directly on a pickup
  tile and make it look "missing" — re-shoot with a different `--px/--py`
  before writing that up as a defect (Outer Coral's heart piece).
- **Eight-plus sessions across salt and cliffs have each found or ruled
  out a stray ledge sitting in open ground with nothing marking a real
  step — check every ledge in this batch (`ledgeCoral`) against its
  actual neighbouring TILE DATA, not the room's name or a guess by eye.**

## Why this, now
S86 opened coral and confirmed check-drift's audit count at 108 of 120.
This session finishes coral (its 2nd and last row, `overworld,8-11,5`) —
after it lands, only abyss (8 rooms) remains in the whole rotation, and
the region-art objective (#6, done at 120/120) will be one region away
from complete.

## The task
Same method as every session this rotation: `tools/shoot-rooms.mjs
overworld,<rx>,<ry> --tide=0/1/2` for each of the four rooms below (add
`--dpr=4`+ and/or a different `--px/--py` to zoom into a sprite or a tile
seam, or to move Link off an enemy's/pickup's own spawn tile), zoom every
ground boundary and every sprite, write one verdict row each to
`docs/AUDITED-ROOMS.md`. If a visual read is ambiguous, query
`room.tile(tx,ty,tide)` or sample raw pixels, or check the enemy's own
definition in `src/data/enemies.js` for its runtime palette/pose, rather
than trusting the screenshot crop alone.
Run `node tools/check-strands.mjs` once at the end of the batch and confirm
it's still at its baseline before calling the session done.
- `overworld,8,5` (Reef Wall), `overworld,9,5` (Coral Hollow)
- `overworld,10,5` (Spire Mouth), `overworld,11,5` (Coral Foot)

## Done means
- `node tools/check-drift.mjs`'s audit count goes from 108 to 112.
- `node tools/check-strands.mjs` still reports no new multi-cell region.
- Any real fix made is verified (screenshot + relevant checker).
- STATE.md gets one new session-log row, and notes the coral region as
  fully audited (8/8) if this row confirms clean.

## Out of scope
- Abyss — pick the first abyss room only after this row lands.
- Reopening npc-detail (#5) or enemy-roster (#4).
- Advancing `OBJECTIVE OF RECORD` — the actual overworld total is 120
  rooms (check-drift measures it directly), not the ~90 STATE.md's
  rotation text still says; 112/120 after this session is still 8 short.
  Don't rewrite the rotation table until check-drift's own count reaches
  120.
- Chasing the S78 reef-palette finding — it has no detour token yet.
