# Next session — build one outdoor Reefseed grove and run it

## Read first
- `docs/prompts/LEDGER.md`, "Known and deliberately unfixed", the last two
  entries — the withdrawn "structurally blocked" claim and what is
  actually true about the two overworld checkers, plus the borrowed-tile
  art trap. Both are corrections of earlier sessions; read them before
  trusting anything else written about this objective.
- `docs/NEXT-SESSION.md` S99 (the audit) and S98 (what it corrected).
- `docs/prompts/STATE.md` — DETOUR TOKENS is 0. This session is
  `objective` and stays inside the file allowlist.

## Why this, now
The overworld half of item-reuse was written up as structurally
impossible and escalated as a decision. It is neither: that came from a
grep, not from running anything. `check-overworld.mjs` keys its `reached`
set on the ROOM, so a gated pocket inside a screen the player can walk
into is invisible to it. `check-strands.mjs` is a baseline with
`--record`, and its own header names two kinds of legitimately
unreachable cell already recorded; the baseline file already carries a
ten-cell region. So the real question was never "is it possible" but
"what does the suite actually say", and nobody has asked it.

The tile vocabulary is confirmed present: `drownWall` (digit `9`) is
`['cliff', 'cliff', 'waterD']`, the same tide shape a bole needs, and
`waterD` (`=`) is the always-deep stake tile. `check-reefseed.mjs`'s
overworld filter was fixed in S98 and is correct.

## The task
Build ONE outdoor Reefseed grove in `src/data/overworld.js` and run the
suite on it. Use `drownWall` for the bar and `waterD` for the stake;
the snarl needs a cuttable tile whose `pal` and `underArt` suit the
region it stands in — read the S99 art entry in the LEDGER before
picking one, and give the region its own variant if the shared tile
does not fit, exactly as `dSnarlAbyss` did for the Keep.

Pick the screen FIRST and pick it for space: the fixture needs four
cells in a line plus a real far side, and every screen is already
audited region art, so prefer one with several rows of open sea on an
edge (`*`/`openSea` is solid to a swimmer and makes a natural flanking
wall). `Worlds Edge` (`0,11,9`, dunes) has the most open sea on the map
and holds only a sign; `South Bluff`, `Reef Pocket` and `South Shallows`
are the next-emptiest. Do not retrofit into a screen whose existing
content has to be moved to make room.

Then run it and believe the output, not your reasoning about it. If
`check-strands.mjs` reports a new region, that is the DECISION POINT,
not a failure: either record it with `--record` and write the reason
into the baseline commit, or conclude the cells should not be gated that
way. Say which you did and why.

## Done means
- `node tools/check-reefseed.mjs` passes with an overworld room declared,
  and `node tools/check-drift.mjs` reads `reefseed overworld screens: 1`.
- `node tools/shoot-rooms.mjs` run on the new screen at LOW and HIGH, and
  the shot actually looked at — Goal 1 is not defended by any checker.
- `check-overworld.mjs`, `check-strands.mjs`, `check-placement.mjs`,
  `check-ground.mjs`, `check-progression.mjs`, `check-playthrough.mjs`,
  `test.mjs`, `npm run build` with `dist/` committed.
- If it does not work, the LEDGER gets the specific reason — which
  assertion, which tile, what was tried — not a general conclusion.

## Out of scope
- The Anchor's and Lens's dungeon ceilings: both need a swim-model change
  inside their own checkers, which is a `tools/` change and there is no
  token.
- Re-deriving whether the overworld is "blocked" by reading source. That
  is what produced the withdrawn claim. Build the room.
- Any second grove, or a dungeon room for any item — one screen, one
  fixture, one honest result.
- Chasing `check-hearts`' 2 pre-existing failures (they predate all of
  this; see the S99 log row). Note them, leave them.
