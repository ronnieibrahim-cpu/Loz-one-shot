# Next session — tag sprites-trade.js's provenance

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #2 (art-provenance) and its file
  allowlist's generated-vs-hand-authored split.
- The "S70" entry in `docs/NEXT-SESSION.md` (search for "built the sprite
  contact-sheet tool") for the exact method used on `sprites-bosses.js`: one
  short comment line inserted directly above each entry's own key line —
  not a shared block above a group, because `check-drift.mjs`'s own
  comment-reader only looks at the line(s) immediately preceding one
  entry, and a multi-line sprite object always has its own prior entry's
  closing line in the way. That entry also has two findings about the
  shared entry-regex worth knowing before trusting a raw grep count again.
- `src/data/sprites-trade.js`'s file header — it already states its own
  provenance in one sentence.

## Why this, now
STATE.md's objective of record is #2, art-provenance: every sprite in
`src/data/sprites-*.js` carries a provenance tag. `check-drift.mjs` reports
`drawn: 59` (was 10) after last session tagged all 49 boss/miniboss
entries. `sprites-trade.js` is next because it is the same shape of task —
its header says "HAND-DRAWN, and deliberately so" for all eleven Coastwise
Chain objects, uniformly, with a written reason (importing Seasons' own
trade-item art would import that game's design) — so, like bosses, this
needs no per-entry research, only per-entry insertion.

## The task
Tag every entry in `src/data/sprites-trade.js` (`TRADE_ART`) `drawn` in
its own comment line, directly above that entry's key. Most entries
already carry a flavor comment immediately above them (see `i_t_float` at
the top of the file) — add the tag as one more line in that same block
rather than deleting the existing prose; `check-drift.mjs`'s comment
reader collects every directly-adjacent comment line and only needs the
word `drawn` to appear once, unambiguously, somewhere in the combined
text.

## Done means
- `node tools/check-drift.mjs`'s `drawn` count reads 70 (59 + 11).
- `node --check src/data/sprites-trade.js` and `node tools/validate.mjs`
  both pass (comment-only change, but confirm rather than assume).
- `node tools/test.mjs` passes.
- `npm run build` re-run, `dist/oracle-of-tides.html` committed.
- STATE.md gets one new session-log row.

## Out of scope
- Any other sprite file this session — `sprites-gear.js` is NOT uniform
  (its own header says some icons are measured against extracted art and
  others are original), and needs real per-entry judgement rather than one
  blanket reason; leave it for its own session.
- Any of the six ripper-generated `sprites-*.js` files — a tag there goes
  into the Python ripper, never a hand-edit.
- Re-litigating whether `check-drift.mjs`'s shared entry-regex should be
  fixed for the palette-array and font-glyph false positives S70 found.
