# Next session — open the coral region, its first row

## Read first
- `docs/AUDITED-ROOMS.md` — 104 rows so far (S64-S85). Coast, marsh, dunes,
  wood, reef, salt and cliffs are all fully done. Only coral (8 rooms) and
  abyss (8 rooms) are left in the whole rotation.
- `docs/prompts/LEDGER.md`'s "Known and deliberately unfixed" section: the
  three S72 visual patterns that look like defects and aren't, the two S77
  ledge notes, and the S78 reef-palette finding — the last one is about the
  REEF region specifically but is worth rereading now that coral (a
  different, adjacent legend) is starting, in case the same shared-tide-
  digit pattern shows up there too.
- **Eight sessions running across salt and cliffs (S76, S77, S79, S80,
  S81, S82, S83, S84) have each found or ruled out a stray ledge sitting
  in open ground with nothing marking a real step — check every ledge in
  this batch against its actual neighbouring TILE DATA (which legend
  character is on each side), not the room's name or a guess by eye.**
  When a screenshot looks ambiguous (a sprite's colour/pose, a pool's
  extent), zoom in tighter (`--dpr=5`+, a `--px/--py` near the feature)
  before writing it up as a defect — S84's Boulder Run and Deep Cut
  verdicts are worked examples of a false alarm resolved exactly that way.
- `src/data/legends.js`'s `coral` legend (registered near the `abyss` one)
  for which characters this region uses before screenshotting — coral has
  its own ground tiles (`rockFloorCoral`/`sandCoral`) and its own reef-teal
  water variants (`waterSReef`/`waterDReef`), distinct from both `cliffs`
  and the already-audited `reef` region.

## Why this, now
S85 finished cliffs (16/16) and confirmed check-drift's audit count at 104
of 120. Coral is the smaller of the two remaining regions (8 rooms vs.
abyss's 8), split across two sessions: this one takes its first row
(`overworld,8-11,4`), the next takes its second (`overworld,8-11,5`).

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
- `overworld,8,4` (Coral Shelf), `overworld,9,4` (Anemone Field)
- `overworld,10,4` (Spire Coral), `overworld,11,4` (Outer Coral)

## Done means
- `node tools/check-drift.mjs`'s audit count goes from 104 to 108.
- `node tools/check-strands.mjs` still reports no new multi-cell region.
- Any real fix made is verified (screenshot + relevant checker).
- STATE.md gets one new session-log row.

## Out of scope
- Abyss, or coral's second row — pick the next batch only after this row
  is done.
- Reopening npc-detail (#5) or enemy-roster (#4).
- Advancing `OBJECTIVE OF RECORD` — the actual overworld total is 120
  rooms (check-drift measures it directly), not the ~90 STATE.md's
  rotation text still says; 108/120 after this session is still 12 short.
  Don't rewrite the rotation table until check-drift's own count reaches
  120.
- Chasing the S78 reef-palette finding — it has no detour token yet.
