# Next session — open the abyss region, its first row

## Read first
- `docs/AUDITED-ROOMS.md` — 112 rows so far (S64-S87). Coast, marsh,
  dunes, wood, reef, salt, cliffs and coral are all fully done. Abyss (8
  rooms) is the ONLY region left in the whole rotation.
- `docs/prompts/LEDGER.md`'s "Known and deliberately unfixed" section: the
  three S72 visual patterns that look like defects and aren't, the two S77
  ledge notes, and the S78 reef-palette finding.
- S86/S87's coral verdicts for the region-transition patterns that keep
  recurring: a tide digit shared by two regions still floods correctly
  (only walkability, not always visible dryness, changes at some tide
  steps); a screenshot's default Link spawn point can land directly on a
  pickup tile and make it look "missing" — re-shoot with a different
  `--px/--py` before writing that up as a defect.
- `src/data/legends.js`'s `abyss` legend before screenshotting — it has
  its own `waterD`/`waterAbyss` deep-water tiles (not tide digits, always
  deep, same shape as `The Deep Cut`'s torrent) and `rockFloorRust`, a
  ground variant no other region uses. `caveMouthAbyss` and the `keepSeal`
  story gate (`V`, the Maku Tree's five-Essence seal, same fixture as
  Upper Kell) both live here too.
- **Eight-plus sessions across salt and cliffs have each found or ruled
  out a stray ledge sitting in open ground with nothing marking a real
  step — check every ledge in this batch (`ledgeAbyss`) against its
  actual neighbouring TILE DATA, not the room's name or a guess by eye.**

## Why this, now
S87 finished coral (8/8) and confirmed check-drift's audit count at 112 of
120. Abyss is the last region in the whole region-art rotation (#6),
split across two sessions like every other region this size: this one
takes its first row (`overworld,0-3,0`), the next takes its second
(`overworld,0-3,1`) — after which the objective's own done-condition
(120/120) is met and `OBJECTIVE OF RECORD` advances to the next rotation
item per STATE.md's own instructions (rewrite the allowlist at that point,
don't do it early).

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
- `overworld,0,0` (Drowned Shore), `overworld,1,0` (Gate of the Keep)
- `overworld,2,0` (Black Causeway), `overworld,3,0` (Rustfall)

## Done means
- `node tools/check-drift.mjs`'s audit count goes from 112 to 116.
- `node tools/check-strands.mjs` still reports no new multi-cell region.
- Any real fix made is verified (screenshot + relevant checker).
- STATE.md gets one new session-log row.

## Out of scope
- Abyss's second row — pick it only after this row is done.
- Reopening npc-detail (#5) or enemy-roster (#4).
- Advancing `OBJECTIVE OF RECORD` — 116/120 after this session is still 4
  short. Don't rewrite the rotation table until check-drift's own count
  reaches 120 (next session, if this row confirms clean).
- Chasing the S78 reef-palette finding — it has no detour token yet.
