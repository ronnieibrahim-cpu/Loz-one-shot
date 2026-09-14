# Next session — finish dunes, open a new region

## Read first
- `docs/AUDITED-ROOMS.md` — 40 rows so far (S64-S70). Marsh and coast are
  fully done. Dunes is 13/20 — only its south-east corner is left.
- `docs/ART-DIRECTION.md` and `docs/ART-BACKLOG.md`'s "shore has a rim"
  entry — shallow water gets a composited rim, deep water (`waterD`) is a
  deliberate hard edge, open sea (`*`) at a map edge is always a hard
  edge, and a one-tile channel or fixed-terrain patch surrounded by
  flooding tide tiles also hard-edges (all KNOWN, not new findings if
  seen again). If a screenshot crop looks like it breaks the "dry at
  LOW" rule, don't trust the crop before querying the engine directly —
  S70's South Shallows looked wrong and wasn't; see that session's row
  in `docs/prompts/STATE.md` for the throwaway-script method that
  settled it.
- `docs/prompts/STATE.md` — objective #6 and its allowlist.

## Why this, now
S64-S70 audited 40 rooms with zero real defects and finished marsh and
coast entirely. Five rooms finish dunes outright — the third full region
closed — which is worth calling out plainly. `wood` (the Drowned Wood)
has never been touched by this rotation; CLAUDE.md's own trap list
records that a tree-crown fix once severed part of it silently while
every other checker stayed green, so it is worth a first, careful look
rather than being left for later.

## The task
Same method as the last 7 sessions: `tools/shoot-rooms.mjs
overworld,<rx>,<ry> --tide=0/1/2` for each of the six rooms below (add
`--dpr=4` and/or a different `--px/--py` to zoom into a sprite or a tile
seam, or to sidestep an enemy sitting on the default spawn point), zoom
every ground boundary and every sprite, write one verdict row each to
`docs/AUDITED-ROOMS.md`.
- `overworld,10,8` (Shell Flats), `overworld,11,8` (Dune Corner),
  `overworld,9,9` (Deep Bar), `overworld,10,9` (Sunken Cove),
  `overworld,11,9` (Worlds Edge) — region "Dunes". This is every
  remaining dunes room; if all 5 come back clean, say in the verdict AND
  the session log that Dunes is now fully audited (20/20).
- `overworld,4,6` (South Wood) — region "Wood" (the Drowned Wood), the
  first room in a region this rotation hasn't touched yet. Look
  specifically at tree-crown placement and any seam between rooms —
  CLAUDE.md's own hard-won-lessons note says a tree-crown fix once
  severed part of this region silently.

## Done means
- `node tools/check-drift.mjs`'s audit count goes from 40 to 46.
- Any real fix made is verified (screenshot + relevant checker).
- STATE.md gets one new session-log row.

## Out of scope
- Rooms outside the six named above.
- Re-opening npc-detail (#5) or enemy-roster (#4).
- Advancing `OBJECTIVE OF RECORD` — #6 needs many more than 46.
- Re-flagging a hard water edge, an open-sea map edge, or a fixed-terrain
  patch that stays dry while its tide-tile neighbours flood, as a defect
  without first checking it isn't one of the already-documented
  exceptions — and don't trust a visual water/land read over a direct
  engine query if the two seem to disagree (see S70).
