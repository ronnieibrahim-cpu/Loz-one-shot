# Next session — open the salt region, its top row

## Read first
- `docs/AUDITED-ROOMS.md` — 76 rows so far (S64-S78). Coast, marsh, dunes,
  the whole Drowned Wood, and the whole reef are all fully done.
- `docs/prompts/LEDGER.md`'s "Known and deliberately unfixed" section: the
  three S72 visual patterns that look like defects and aren't, plus the
  two S77 ledge notes (a cave-mouth drip particle isn't a bug; a ledge
  isn't automatically clear just because the room has border cliff chars
  — judge what's actually adjacent to it).
- `docs/NEXT-SESSION.md`'s top entry (S78, unlabelled heading) — a
  region-wide finding about the reef's ordinary tide tiles never using
  the reef water palette, logged but not chased. Don't re-discover it as
  new if the salt region turns out to share tiles with reef.
- `docs/prompts/STATE.md` — objective #6 and its allowlist.

## Why this, now
S64-S78 closed out coast, marsh, dunes, wood and reef in region order.
Salt (`legend: 'salt'`, the Salt Pans) is next: a clean 4x3 grid at
`overworld,4-7,0-2`, 12 rooms total, never touched this rotation.

## The task
Same method as every session this rotation: `tools/shoot-rooms.mjs
overworld,<rx>,<ry> --tide=0/1/2` for each of the four rooms below (add
`--dpr=4`+ and/or a different `--px/--py` to zoom into a sprite or a tile
seam, or to move Link off an enemy's own spawn tile), zoom every ground
boundary and every sprite, write one verdict row each to
`docs/AUDITED-ROOMS.md`. If a visual read is ambiguous, query
`room.tile(tx,ty,tide)` (or sample raw pixels, per S78) rather than
trusting the screenshot crop alone. Run `node tools/check-strands.mjs`
once at the end of the batch and confirm it's still at its baseline
before calling the session done.
- `overworld,4,0` (North Pan), `overworld,5,0` (Salt Terraces)
- `overworld,6,0` (Boiling Pan), `overworld,7,0` (East Crust)

## Done means
- `node tools/check-drift.mjs`'s audit count goes from 76 to 80.
- `node tools/check-strands.mjs` still reports no new multi-cell region.
- Any real fix made is verified (screenshot + relevant checker).
- STATE.md gets one new session-log row.

## Out of scope
- Salt's rows 1-2 (`overworld,4-7,1` and `4-7,2`) — later batches.
- Any other region (cliffs, coast, coral, abyss) — salt first, in full.
- Re-opening npc-detail (#5) or enemy-roster (#4).
- Advancing `OBJECTIVE OF RECORD` — #6 needs many more than 80.
- Chasing the S78 reef-palette finding — it has no detour token yet and
  isn't this region's problem to fix.
