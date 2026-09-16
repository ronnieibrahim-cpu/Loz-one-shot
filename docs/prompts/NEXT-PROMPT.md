# Next session — finish the salt region, its last row

## Read first
- `docs/AUDITED-ROOMS.md` — 84 rows so far (S64-S80). Coast, marsh,
  dunes, wood and reef are fully done. Salt is 8/12 (rows 0-1 done).
- `docs/prompts/LEDGER.md`'s "Known and deliberately unfixed" section:
  the three S72 visual patterns that look like defects and aren't, the
  two S77 ledge notes, and the S78 reef-palette finding (not salt's
  problem — check whether it recurs here before assuming either way).
- `docs/prompts/STATE.md` — objective #6 and its allowlist.
- **Three sessions running (S76, S77, S79, S80 — four counting S76's
  original sweep) have each found a stray ledge sitting in open ground
  with nothing marking a real step.** It is worth specifically checking
  every ledge in this last salt row against its actual neighbours (not
  the room's name, not whether the room has a cliff char anywhere) before
  calling the room clean — this pattern has recurred in every region
  audited except reef's own row 0-2 batches.

## Why this, now
S79-S80 worked through the salt region's top two rows. Its last row
(`overworld,4-7,2`) finishes the region: South Pan, Cracked Basin, Vault
Steps, Pan Corner — all four already glimpsed in earlier reads of
`src/data/overworld.js` but never actually screenshotted or checked.

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
- `overworld,4,2` (South Pan), `overworld,5,2` (Cracked Basin)
- `overworld,6,2` (Vault Steps), `overworld,7,2` (Pan Corner)

## Done means
- `node tools/check-drift.mjs`'s audit count goes from 84 to 88.
- `node tools/check-strands.mjs` still reports no new multi-cell region.
- Any real fix made is verified (screenshot + relevant checker).
- STATE.md gets one new session-log row. If salt is now fully audited,
  say so (it does not close the rotation objective by itself — 88 of
  120 is still short of 90).

## Out of scope
- Any other region (cliffs, coast, coral, abyss) — pick the next one
  only after salt is fully closed out.
- Re-opening npc-detail (#5) or enemy-roster (#4).
- Advancing `OBJECTIVE OF RECORD` — #6 needs many more than 88.
- Chasing the S78 reef-palette finding — it has no detour token yet.
