# Next session — open the cliffs region, its first row

## Read first
- `docs/AUDITED-ROOMS.md` — 88 rows so far (S64-S81). Coast, marsh, dunes,
  wood, reef and salt are fully done. Cliffs, coral and abyss (32 rooms)
  are the only ones left.
- `docs/prompts/LEDGER.md`'s "Known and deliberately unfixed" section:
  the three S72 visual patterns that look like defects and aren't, the
  two S77 ledge notes, and the S78 reef-palette finding.
- `docs/prompts/STATE.md` — objective #6 and its allowlist.
- **Five sessions running (S76, S77, S79, S80, and S76's own original
  sweep) have each found a stray ledge sitting in open ground with
  nothing marking a real step — check every ledge in this batch against
  its actual neighbouring tiles (not the room's name), same method as
  the salt region.** S81 also found a case that looked like a tide bug
  but was cross-run RNG variance (see its AUDITED-ROOMS.md row for
  Pan Corner) — when a screenshot looks wrong only in one shot, check
  whether it reproduces in a single continuous session before writing
  it up as a defect.

## Why this, now
S81 finished the salt region (12/12) and confirmed check-drift's audit
count at 88 of 120. The only regions left are cliffs (16 rooms, the
Cliffside Cistern's overworld surroundings), coral (8) and abyss (8).
Cliffs is the biggest, so it goes first, split across two sessions like
salt was: this one takes its first row (`overworld,0-3,2`), the next
takes its second (`overworld,0-3,3`), then two more rows finish it.

## The task
Same method as every session this rotation: `tools/shoot-rooms.mjs
overworld,<rx>,<ry> --tide=0/1/2` for each of the four rooms below (add
`--dpr=4`+ and/or a different `--px/--py` to zoom into a sprite or a tile
seam, or to move Link off an enemy's own spawn tile), zoom every ground
boundary and every sprite, write one verdict row each to
`docs/AUDITED-ROOMS.md`. If a visual read is ambiguous, query
`room.tile(tx,ty,tide)` or sample raw pixels (see S78's Barnacle Bank
verdict, or S81's Pan Corner verdict for the live-entity-probe method)
rather than trusting the screenshot crop alone.
Run `node tools/check-strands.mjs` once at the end of the batch and
confirm it's still at its baseline before calling the session done.
- `overworld,0,2` (Kell Head), `overworld,1,2` (Wind Shelf)
- `overworld,2,2` (Upper Kell), `overworld,3,2` (Kell Corner)

## Done means
- `node tools/check-drift.mjs`'s audit count goes from 88 to 92.
- `node tools/check-strands.mjs` still reports no new multi-cell region.
- Any real fix made is verified (screenshot + relevant checker).
- STATE.md gets one new session-log row.

## Out of scope
- Any other region (coral, abyss, or the rest of cliffs) — pick the
  next batch only after this row is done.
- Re-opening npc-detail (#5) or enemy-roster (#4).
- Advancing `OBJECTIVE OF RECORD` — #6 needs 90+, this batch alone
  isn't enough even after it lands.
- Chasing the S78 reef-palette finding — it has no detour token yet.
