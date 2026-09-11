# Next session — tag sprites-trade.js, the pilot for art-provenance

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — current objective, file allowlist, detour tokens.
- The S70 entry in `docs/NEXT-SESSION.md` (search for "built
  `tools/shoot-sprites.mjs`") for how to render `sprite-sheet-trade-1x.png`
  and `-3x.png` and look at every entry before tagging it, and for the exact
  tag shape `check-drift.mjs` counts (see below).

## Why this, now
STATE.md's objective of record is rotation #2, art-provenance: every entry
in `src/data/sprites-*.js` tagged `extracted`/`derived`/`drawn` in a comment
directly above its own line. 561 entries is not a one-session job. The 13
entries `check-drift.mjs` currently counts as tagged are ACCIDENTAL — prose
near those lines happens to contain a tag word, not a deliberate per-entry
comment — so this is a from-scratch start, not a head start. `sprites-trade.js`
(22 entries, the Coastwise Chain's items) is the smallest hand-authored file
and already has a single, uniform story in its own manifest comment: "Hand-
drawn: the Seasons trading sheet has trade items on it and every one of them
belongs to that game's design" — meaning the source sheet's items are Oracle
of Seasons' own designs (a feather, an egg, ...), not this game's Coastwise
Chain objects, so extraction was never possible for any of them. One file,
one uniform reason, no ripper involved — the right size to get the tag shape
right before scaling up.

## The task
`sprites-trade.js` has 11 real sprites (`REQUIRED_SPRITES.trade` in
`src/data/sprite-manifest.js`: `i_t_float`, `i_t_claw`, `i_t_brick`,
`i_t_eel`, `i_t_lead`, `i_t_whelk`, `i_t_pearl`, `i_t_cup`, `i_t_jar`,
`i_t_kettle`, `i_t_rope`) but `check-drift.mjs`'s entry-matching pattern
(a 2-space-indented `name:` followed by an object, template string, or
array) counts 22 lines in this file, because it also matches the 11 lines
of the separate `TRADE_PALETTES` object below `TRADE_ART` — a palette array
is not a sprite, but the checker can't tell the difference from the line
shape alone. `sprites-gear.js` has the same
two-object shape (`GEAR_ART` + `GEAR_PALETTES`); check before assuming any
other file does or doesn't. Decide, and write down which you picked: either
tag both the `TRADE_ART` entry AND its matching `TRADE_PALETTES` entry (so
the checker's count reaches the true 11-of-11), or tag only `TRADE_ART` and
accept the 11 palette lines will read as permanently untagged noise in the
total. Whichever you pick, say so in `docs/NEXT-SESSION.md` — this decision
will recur at every other file shaped like this one.

Tag each of the 11 sprites with a `drawn` comment naming the specific
object (not just repeating the file-level reason verbatim on every entry —
say what THIS sprite is, briefly) and confirming extraction was checked and
ruled out for that object specifically, not assumed from the file header.
Before tagging, run `node tools/shoot-sprites.mjs trade` and look at both
PNGs — confirm each object is genuinely hand-drawn pixel art, not an
already-extracted frame mis-filed here.

## Done means
- `node tools/check-drift.mjs`'s `drawn` column and `untagged` column both
  move by the same amount this session added (11 if only `TRADE_ART` is
  tagged, 22 if both objects are — see "The task").
- Every one of those entries' tags is a DELIBERATE comment placed this
  session, not a coincidence of nearby prose — re-run the detection snippet
  from `check-drift.mjs`'s own `entryComment`/`PROVENANCE_WORDS` logic (or
  just re-run `check-drift.mjs` itself and read the count) to confirm.
- `node tools/validate.mjs` and `node tools/test.mjs` still pass — a comment
  change should not be able to break either, but confirm rather than assume.
- `npm run build` re-run; `dist/oracle-of-tides.html` committed only if it
  changed (a comment-only change shouldn't move it, same as last session).
- STATE.md gets one new session-log row.

## Out of scope
- Any file other than `sprites-trade.js` — one file fully and correctly
  tagged beats five files half-tagged.
- Any GENERATED sprites file (`sprites-player.js`, `sprites-npcs.js`,
  `sprites-races.js`, `sprites-enemies.js`, `sprites-hud.js`,
  `sprites-fairies.js`) — those need their RIPPER edited to emit the tag,
  never a hand-edit of the output; that's a separate, later session.
- Re-tagging the 13 accidentally-matched entries in other files — leave them
  for whichever session tags their own file properly.
- Spending the detour token on anything found while looking at the trade
  sheet — record it in `docs/NEXT-SESSION.md` per the charter's step 5 and
  keep going.
