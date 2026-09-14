# Next session — audit the next ring, first non-village terrain

## Read first
- `docs/AUDITED-ROOMS.md` — 10 rows so far (S64/S65, all "Tidewatch
  Village"). Same format for 6 more, but this batch leaves that region.
- `docs/ART-DIRECTION.md` and `docs/ART-BACKLOG.md`'s "shore has a rim"
  entry — the composited-edge rule and its known exceptions (deep water
  is deliberately hard-edged; a one-tile-wide channel with land on both
  sides degrades to a rim on only one edge). S65 hit the second
  exception once (West Bluff) and correctly logged it as known, not new.
- `docs/prompts/STATE.md` — objective #6 and its allowlist.

## Why this, now
S64/S65 audited 10 rooms, all still inside the village's own coastal
grass/sand palette, and found zero new defects. This batch is the first
to leave that palette: `overworld,2,7`/`2,8` are legend `'marsh'` (Bog
Causeway, Sunken Reeds), `overworld,8,7`/`8,8` are legend `'dunes'`
(Grotto Approach, Grotto Mouth), and `4,9`/`5,9` are legend `'coast'`
again (Fishing Stones, South Sands) — three different tile vocabularies
in one batch. A terrain-register mismatch is exactly the kind of defect
that would NOT show up auditing one palette 10 times in a row.

## The task
Same method as S64/S65: `tools/shoot-rooms.mjs overworld,<rx>,<ry>
--tide=0/1/2` for each of the six rooms below, zoom every ground
boundary and every sprite, write one verdict row each to
`docs/AUDITED-ROOMS.md`.
- `overworld,2,7` (Bog Causeway) and `overworld,2,8` (Sunken Reeds) —
  region "Marsh" (matches `docs/ART-BACKLOG.md`'s and `story.js`'s own
  "Marsh, Cliffs, Wood" naming). Marsh terrain hasn't been audited yet
  anywhere in this file — look especially hard for a register mismatch
  here (does the marsh ground actually look distinct from the coast
  sand, or does it read as sand recoloured without a real texture
  change).
- `overworld,8,7` (Grotto Approach) and `overworld,8,8` (Grotto Mouth) —
  region "Dunes". A `'dunes'` legend has not been audited yet either.
- `overworld,4,9` (Fishing Stones) and `overworld,5,9` (South Sands) —
  region "Tidewatch Village" (same `'coast'` legend as the first 10
  rooms), a control pair to confirm the coast palette still holds up
  this far from the village centre.

## Done means
- `node tools/check-drift.mjs`'s audit count goes from 10 to 16, with at
  least 2 rows under region names other than "Tidewatch Village" (the
  self-check doesn't enforce this, but a batch that ships 6 more
  "Tidewatch Village" rows without touching the new legends missed the
  actual point of this session).
- Any real fix made is verified (screenshot + relevant checker).
- STATE.md gets one new session-log row.

## Out of scope
- Rooms outside the six named above.
- Re-opening npc-detail (#5) or enemy-roster (#4).
- Advancing `OBJECTIVE OF RECORD` — #6 needs 90 of ~120, not 16.
- Treating a hard water edge as a defect without first checking whether
  it's deep water (`waterD`) or a one-tile channel — both are already
  documented, deliberate cases per `docs/ART-BACKLOG.md`.
