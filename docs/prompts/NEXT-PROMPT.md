# Next session — build tools/shoot-sprites.mjs

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — objective #2 (art-provenance), its file
  allowlist, and the GENERATED-vs-hand-authored split for the twelve
  `sprites-*.js` files. Read that split before touching any of them.
- `CLAUDE.md`'s "Extraction lands in a generated file" rule and its table of
  which `sprites-*.js` file belongs to which `tools/rip-*.py` script.
- `tools/shoot-rooms.mjs` and `tools/shoot-player.mjs` for the existing
  pattern: a headless server + Playwright page that boots the real game and
  reads its actual sprite data, rather than a second renderer.

## Why this, now
STATE.md's objective of record is #2, art-provenance, which has two parts:
tagging every sprite entry with how it was made, and a contact-sheet tool
to look at the result. The tagging half needs real per-file research (which
sheet, which cell, or a written reason none exists) that does not fit in
one session alongside a new tool — attempting both in one sitting is how a
detour eats the session. This prompt is scoped to the tool alone.

## The task
Write `tools/shoot-sprites.mjs`: one contact-sheet PNG of every sprite in
every `src/data/sprites-*.js` file, every enemy's animation frames (walk at
minimum; attack/hurt/death wherever they exist under the `<name>_atk`-style
keys `check-drift.mjs`'s enemy-roster metric already looks for), and every
NPC, rendered at both 1x and 3x scale. Load the real sprite data through the
game itself (Playwright against the built page, the way `shoot-rooms.mjs`
does), not a reimplementation of the sprite decoder — a second decoder can
drift from the real one silently. Lay sprites out in a grid with their data
key as a label; group by source file. Write output PNGs under `tools/shots/`
(gitignored, same as every other `shoot-*` tool).

Do not add provenance tags to any sprite file this session — that is the
next slice, and STATE.md's allowlist marks six of the twelve files as
ripper-generated, where a tag has to go into the Python ripper and get
re-emitted rather than hand-edited into the `.js`.

## Done means
- `node tools/shoot-sprites.mjs` runs and produces at least one contact-sheet
  PNG covering all twelve `sprites-*.js` files, with every enemy's available
  animation states and every NPC visibly present and labelled.
- Look at the output: every sprite must be legible at 3x (not a blank cell,
  not a decode error swallowed into a blank tile — `test.mjs`'s existing
  "art coverage" check already proves 0 unauthored names, so a blank cell
  here would mean the new tool's own rendering is wrong, not the data).
- `node tools/test.mjs` still passes (no engine code touched).
- STATE.md gets one new session-log row.
- `npm run build` re-run, `dist/oracle-of-tides.html` committed only if
  `src/` changed (it shouldn't for a new `tools/` script — confirm before
  claiming this bullet, don't assume).

## Out of scope
- Tagging any sprite with `extracted`/`derived`/`drawn` this session.
- Hand-editing any of the six ripper-generated `sprites-*.js` files.
- Touching `docs/DUNGEON-STATUS.md` or anything dungeon-related — that
  objective is closed; this is a new one.
- Building a `rip-bosses.py` (that is rotation #3, not this one).
