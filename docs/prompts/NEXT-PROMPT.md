# Next session — audit the village screens' art

## Read first
- `docs/AUDITED-ROOMS.md` — currently empty (header only). This session
  writes its first real rows.
- `docs/ART-DIRECTION.md` — the measured rules to check each room
  against (colour count, outline, no anti-aliasing, ground boundaries
  as a straight composited edge not a hard pixel cut, no mixed
  registers). `docs/ART-BACKLOG.md`'s landed entries (the shore rim,
  ground-boundary work) for what's already been fixed project-wide —
  don't re-flag those as new findings.
- `docs/prompts/STATE.md` — objective #6 (region-art) and its allowlist.

## Why this, now
Objective #5 (npc-detail) closed S63 with the person running these
sessions confirming the remaining sprite gaps should stay as documented,
not hand-drawn. Rotation moves to #6, region-art: "done when 90 of ~90
overworld rooms are in docs/AUDITED-ROOMS.md with a verdict." That file
is completely empty — every mechanical checker in CLAUDE.md's table
(`check-ground.mjs`, `check-placement.mjs`, `check-strands.mjs`, etc.)
already passes for the whole map, but none of them looks at a room and
asks "does this actually read as an Oracle of Seasons/Ages screen" —
that's a visual judgement call no automated tool makes, which is the
entire reason this rotation objective exists.

## The task
Audit the four Tidewatch Village screens — the smallest, most central
cluster, and a reasonable first batch to establish the process other
sessions will repeat: `overworld,4,7` (Tidewatch Village), `overworld,5,7`
(Village East), `overworld,4,8` (Village Shore), `overworld,5,8`.
1. Screenshot each at all three tide levels worth checking (`tools/
   shoot-rooms.mjs overworld,4,7 --tide=0`, `--tide=1`, `--tide=2` — a
   room can look right at one tide and wrong at another; terrain that
   changes with the tide is exactly where a seam is most likely).
2. Look at each shot against `docs/ART-DIRECTION.md`'s rules: does the
   ground read as one of the source games' own tile vocabularies, are
   boundaries between ground types composited rather than a hard pixel
   cut, is every decorative object (rock/tree/bush) drawn whole rather
   than clipped, does anything look hand-drawn next to extracted art in
   a way that betrays which is which.
3. Write one row per room per this file's own header format (key,
   region — use "Tidewatch Village" for all four, name, date,
   one-sentence verdict) to `docs/AUDITED-ROOMS.md`. A verdict that
   found nothing wrong is still a verdict — "checked against
   ART-DIRECTION.md at all 3 tides, no defect found" is a complete,
   honest row, not a placeholder.
4. If a real defect turns up, it's in scope to fix (allowlist covers
   `src/data/overworld.js`/`tiles-terrain.js` for exactly this) — but
   re-screenshot and re-run the relevant checker from CLAUDE.md's table
   afterward, and don't go looking for extra polish beyond what the
   audit actually found.

## Done means
- `docs/AUDITED-ROOMS.md` has 4 new rows, correctly formatted (`node
  tools/check-drift.mjs`'s "Overworld room audits" count goes from 0 to
  4 and self-checks stay green).
- Any fix made is verified (screenshot + the relevant checker), not just
  asserted.
- STATE.md gets one new session-log row.

## Out of scope
- Auditing rooms outside the four named above — this is deliberately one
  small batch to prove the process, not the whole map in one session.
- Re-opening npc-detail (#5) or enemy-roster (#4) — both closed by an
  explicit human decision, not this session's to revisit.
- Advancing `OBJECTIVE OF RECORD` — #6 needs 90 of ~90 rooms audited,
  not 4.
- Inventing a canonical region-name partition — `tools/check-drift.mjs`
  already notes none exists; use plain names consistently, don't design
  a taxonomy.
