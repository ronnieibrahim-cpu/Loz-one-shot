# Next session — build tools/shoot-sprites.mjs, no tagging yet

## Read first
- `docs/prompts/CHARTER.md` — the standing rules for every session; run it
  verbatim before reading anything else here.
- `docs/prompts/STATE.md` — current objective, file allowlist, detour tokens.
- `tools/check-drift.mjs`'s own comment block above `SPRITE_FILES` (search
  for "no sprites-*.js file actually tags entries this way") for the EXACT
  shape a provenance tag has to have to be counted: a `//` or `/** */`
  comment directly above a 2-space-indented `name: {`/`` name: ` ``/`name: [`
  entry line, containing exactly one of `extracted`/`derived`/`drawn` as a
  whole word. A file-level header saying "extracted from the Oracle sheet"
  does not count — it describes the sheet, not any one entry's own path onto
  it, and the checker deliberately ignores it.

## Why this, now
STATE.md's objective of record is rotation #2, art-provenance, with two
separate done-conditions: every sprite entry tagged, AND
`tools/shoot-sprites.mjs` exists (one contact-sheet PNG of every sprite,
every enemy animation state, and every NPC, at 1x and 3x). 561 entries
across 12 files is not a one-session tagging job, and `docs/ART-BACKLOG.md`
already warns that a composited or recoloured tile "needs an in-game
screenshot across several regions before it is believed" — the same is true
of a `derived`/`drawn` sprite CLAIM. Build the verification tool before the
claims it will need to verify, the same order rotation #1 used
(`check-drift.mjs` before any room was widened).

## The task
Write `tools/shoot-sprites.mjs`. `tools/preview.mjs` already renders a whole
sprite pack to one PNG, but in ONE flat palette — CLAUDE.md's own words,
"proves silhouette and nothing about colour." This tool is different: it
needs the REAL in-game palette per sprite (the way `tools/shoot-rooms.mjs`
screenshots a real room instead of a flat preview), and it needs to be
organised by what a provenance reviewer will actually want to compare —
every sprite, every enemy's walk/attack/hurt/death frames where they exist,
and every NPC — at both 1x and 3x scale in the same output. Look at how
`tools/shoot-rooms.mjs` boots the real engine in a headless page (it's the
right pattern: real art, not a re-rendered guess) and at
`src/data/sprite-manifest.js` for the full sprite/size roster to draw from.

## Done means
- `node tools/shoot-sprites.mjs` runs and writes a contact-sheet PNG (or a
  small set of them, if one image is unworkable at 561 entries — say why in
  the tool's own header comment if you split it) covering every sprite,
  every enemy's available animation states, and every NPC, at 1x and 3x.
- The output is actually looked at, not just generated — at least a few
  entries per file cross-checked against the sprite's real appearance
  in-game (e.g. via `tools/shoot-rooms.mjs` on a room that places it).
- No sprite data file is touched this session — this is a viewer, not a
  tagging pass. Tagging is the next session's job, once this exists.
- `npm run build` re-run, `dist/oracle-of-tides.html` committed only if the
  build changed (it shouldn't, unless the tool needs a small shared helper).
- STATE.md gets one new session-log row.

## Out of scope
- Tagging any sprite entry with `extracted`/`derived`/`drawn` — that's a
  separate, later session, once this tool exists to verify against.
- Touching any generated `sprites-*.js` file's content — five of the twelve
  are ripper output (`sprites-player.js`, `sprites-npcs.js`,
  `sprites-races.js`, `sprites-enemies.js`, `sprites-hud.js`) plus
  `sprites-fairies.js`; CLAUDE.md's hard rule is that a generated file is
  never hand-edited, tags included — that fight is for the tagging session.
- Redesigning `tools/preview.mjs` — build the new tool alongside it, don't
  replace it; they answer different questions (silhouette vs. real colour).
- Spending the detour token on anything found while building this — record
  it in `docs/NEXT-SESSION.md` per the charter's step 5 and keep going.
