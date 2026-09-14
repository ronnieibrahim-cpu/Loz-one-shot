# Next session — audit the six rooms ringing the village

## Read first
- `docs/AUDITED-ROOMS.md` — 4 rows so far (Tidewatch Village's own 4
  screens, S64). Same format, same standard, one row each for 6 more.
- `docs/ART-DIRECTION.md` — the rules each room gets checked against.
- `docs/prompts/STATE.md` — objective #6 and its allowlist.

## Why this, now
S64 proved the process on the 4 village screens: screenshot at all 3
tides, zoom every ground-type boundary to confirm a composited edge (not
a hard pixel cut), check every sprite for register consistency, write an
honest verdict either way. Zero defects found there. Region-art needs 90
of ~120 rooms audited; this keeps building outward from the village
rather than jumping to a random distant room, so a defect that spans a
seam between two already-audited screens (a real risk CLAUDE.md's own
traps list calls out — see `check-strands.mjs`'s entry) stays visible.

## The task
Audit the six overworld rooms directly adjacent to the four already-done
village screens: `overworld,3,7` (West Bluff), `overworld,6,7` (Sunken
Reef), `overworld,7,7` (Shallows Gate), `overworld,3,8` (Shell Beach),
`overworld,6,8` (East Strand), `overworld,7,8` (Dune Crossing). Same
method S64 used:
1. `tools/shoot-rooms.mjs overworld,<rx>,<ry> --tide=0/1/2` for each.
2. Look at every ground-type boundary (crop and zoom, don't judge from
   the thumbnail) for a composited edge; look at every sprite for
   anything that reads as a different register than its neighbours;
   check nothing decorative is clipped or standing on the wrong ground
   material (`check-ground.mjs` already asserts this mechanically —
   this is the "does it also look right" pass on top of that, per
   `docs/ART-DIRECTION.md`'s own framing).
3. One row per room in `docs/AUDITED-ROOMS.md`, region "Tidewatch
   Village" to match the existing 4 rows (still the same coastal
   cluster) unless a room clearly reads as a different named stretch —
   check `docs/ART-BACKLOG.md`'s prose for an existing name before
   inventing one.
4. A real defect is in scope to fix (`src/data/overworld.js`/
   `tiles-terrain.js` on the allowlist) — re-screenshot and re-run the
   relevant CLAUDE.md checker afterward. Don't go looking for extra
   polish beyond what the audit actually finds; S64 found none in 4
   rooms and that's a fine outcome here too if it holds.

## Done means
- `node tools/check-drift.mjs`'s audit count goes from 4 to 10.
- Any fix made is verified (screenshot + checker), not just asserted.
- STATE.md gets one new session-log row.

## Out of scope
- Rooms outside the six named above — keep building the audited area
  contiguously, one ring at a time, not scattered across the map.
- Re-opening npc-detail (#5) or enemy-roster (#4) — both closed by an
  explicit human decision.
- Advancing `OBJECTIVE OF RECORD` — #6 needs 90 of ~120, not 10.
- Assuming S64's "no defects" result means this batch will match — audit
  each room on its own, especially Sunken Reef and Shallows Gate, which
  by name alone sound more tide-sensitive than the village screens were.
