# Next session — tag sprites-world.js's provenance

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #2 (art-provenance) and its file
  allowlist's generated-vs-hand-authored split.
- The "S71" and "S72" entries in `docs/NEXT-SESSION.md` for the two traps
  that will recur in this file specifically: (1) a tag comment must contain
  EXACTLY ONE of `extracted`/`derived`/`drawn` — pre-check the drafted
  sentence with a throwaway grep/regex before writing it, not after; (2) a
  same-named palette array or (elsewhere) a cross-file name collision can
  make a raw entry count misleading — dedupe by name and verify with
  `check-drift.mjs`'s own arithmetic (baseline + entries actually tagged),
  not just "the number went up".
- `src/data/sprites-world.js` lines 1-37 (`p_rupee`'s own comment) before
  writing anything — it already states its real provenance in the word
  "DERIVED", which is exactly why it currently reads as untagged: that same
  comment also says "THE EXTRACTED ONE", so the ambiguity guard already
  discards it. This is not a hypothetical, it is what the file says today.

## Why this, now
STATE.md's objective of record is #2, art-provenance. `check-drift.mjs`
reports `1 extracted, 1 derived, 96 drawn, 463 untagged` after three
sessions of hand-authored files (`sprites-bosses.js`, `sprites-trade.js`,
`sprites-gear.js`, `sprites-title.js`). `sprites-world.js` is next: it has
53 raw entries (pickups, world objects, projectiles, and two original
NPCs) and, per its own header, is explicitly mixed — most of `PICKUP_ART`
is derived from `sprites-hud.js`'s extracted rupee, most of `OBJECT_ART`
and `SHOT_ART` are likely drawn, and `NPC_ART` here is two ORIGINAL
characters plus placeholder entries for the nine `sprites-npcs.js` later
overrides by name (same mechanism S70 found).

## The task
Tag every real entry in `src/data/sprites-world.js` (`PICKUP_ART`,
`OBJECT_ART`, `SHOT_ART`, `NPC_ART`) with its actual provenance — read each
entry's own comment before assuming a file-wide answer, the way S72 did
for `sprites-gear.js`. Known findings to act on, not re-derive:
- `p_rupee` is `derived` from `sprites-hud.js`'s `hud_rupee` (extracted) —
  its own comment already explains the exact geometric relationship.
  Reword only as much as needed to remove the ambiguity (keep "derived",
  remove or rephrase "extracted").
- `NPC_ART` in this file only has TWO real characters (the header says the
  other nine entries here are placeholders `sprites-npcs.js` overrides by
  name later). Check which of `NPC_ART`'s keys survive into
  `sprites.names()` under THIS file's own art (not the later override) —
  `tools/shoot-sprites.mjs`'s missing-name report or a page-context check
  of `sprites.bake(name)` against this file's own `PICKUP_ART`/etc. text
  will show which. A name that gets overridden by `sprites-npcs.js` is
  still a real entry in THIS file's source and still needs a tag describing
  what THIS file's own pixels are (drawn placeholder), even though the
  final in-game art for that name comes from elsewhere.
- Before writing any tag sentence, grep it for the other two provenance
  words the way S72 did, and confirm with a throwaway script (like
  S72's) rather than trusting `check-drift.mjs`'s raw delta alone.

## Done means
- `node tools/check-drift.mjs`'s sprite-provenance counts move, and the
  session write-up shows the arithmetic (baseline + newly tagged = new
  total) rather than just the before/after numbers.
- `node --check src/data/sprites-world.js` and `node tools/validate.mjs`
  pass.
- `node tools/test.mjs` passes.
- `npm run build` re-run, `dist/oracle-of-tides.html` committed.
- STATE.md gets one new session-log row.

## Out of scope
- `sprites-link.js` — the last hand-authored file, four separate
  `sprites.add()` calls in one file, almost certainly its own session.
- Any of the six ripper-generated `sprites-*.js` files.
- Changing which NPC art actually wins the override (that's a design
  question, not a provenance-tagging one) — only describe what exists.
