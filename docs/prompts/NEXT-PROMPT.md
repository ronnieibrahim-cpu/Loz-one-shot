# Next session — continue the salt region, its middle row

## Read first
- `docs/AUDITED-ROOMS.md` — 80 rows so far (S64-S79). Coast, marsh,
  dunes, wood and reef are fully done. Salt is 4/12 (top row only).
- `docs/prompts/LEDGER.md`'s "Known and deliberately unfixed" section:
  the three S72 visual patterns that look like defects and aren't, the
  two S77 ledge notes, and the S78 reef-palette finding (not this
  region's problem — salt uses its own `saltFlat`/`saltCrust` water
  tiles, not reef's, so check whether the same shared-tide-digit issue
  recurs here before assuming it does or doesn't).
- `docs/NEXT-SESSION.md`'s top entry — the reef-palette finding, logged
  but not chased.
- `docs/prompts/STATE.md` — objective #6 and its allowlist.
- **A ledge needs an actual visible elevation change next to it, not
  just a room name that implies one.** Salt Terraces was named for a
  terrace that wasn't actually drawn — the ledge sat between two
  identically-dithered stretches of ground. Check what's really on
  screen, not what the room's name promises.

## Why this, now
S79 opened the salt region (legend `salt`) with its top row, a clean 4x3
grid at `overworld,4-7,0-2`. Continuing row by row (same order every
other region has used) means the middle row next.

## The task
Same method as every session this rotation: `tools/shoot-rooms.mjs
overworld,<rx>,<ry> --tide=0/1/2` for each of the four rooms below (add
`--dpr=4`+ and/or a different `--px/--py` to zoom into a sprite or a tile
seam, or to move Link off an enemy's own spawn tile), zoom every ground
boundary and every sprite, write one verdict row each to
`docs/AUDITED-ROOMS.md`. If a visual read is ambiguous, query
`room.tile(tx,ty,tide)` or sample raw pixels (see S78's Barnacle Bank
verdict for the method) rather than trusting the screenshot crop alone.
Run `node tools/check-strands.mjs` once at the end of the batch and
confirm it's still at its baseline before calling the session done.
- `overworld,4,1` (Pan Road), `overworld,5,1` (Salters Rest)
- `overworld,6,1` (Vault Approach), `overworld,7,1` (Windward Pan)

## Done means
- `node tools/check-drift.mjs`'s audit count goes from 80 to 84.
- `node tools/check-strands.mjs` still reports no new multi-cell region.
- Any real fix made is verified (screenshot + relevant checker).
- STATE.md gets one new session-log row.

## Out of scope
- Salt's row 2 (`overworld,4-7,2`) — next batch, closes out the region.
- Any other region (cliffs, coast, coral, abyss) — salt first, in full.
- Re-opening npc-detail (#5) or enemy-roster (#4).
- Advancing `OBJECTIVE OF RECORD` — #6 needs many more than 84.
- Chasing the S78 reef-palette finding — it has no detour token yet.
