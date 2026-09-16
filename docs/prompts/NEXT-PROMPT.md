# Next session — finish the abyss region, the whole rotation's last row

## Read first
- `docs/AUDITED-ROOMS.md` — 116 rows so far (S64-S88). Every region except
  abyss is fully done. This row is the LAST ROW OF THE ENTIRE #6
  region-art OBJECTIVE — after it lands clean, check-drift's audit count
  reaches 120/120, the objective's own done-condition in STATE.md.
- `docs/prompts/LEDGER.md`'s "Known and deliberately unfixed" section: the
  three S72 visual patterns that look like defects and aren't, the two S77
  ledge notes, and the S78 reef-palette finding.
- S88's Drowned Shore and Black Causeway verdicts in `docs/AUDITED-ROOMS.md`
  for two worked examples of ambiguity resolved by reading the engine
  source or sampling live canvas pixels rather than trusting a screenshot
  crop: `noTide` only blocks a conch press (`src/game/tide.js`), it does
  not freeze rendering; and a tile that "looks unchanged" across tides can
  be Link's own `canOccupy` repositioning masking the real tile underneath
  him, provable with a raw pixel sample at the tile's centre if a re-shoot
  with a different `--px/--py` doesn't settle it.
- Abyss Stair (`overworld,2,1`) carries the SECOND HALF of the `keepSeal`
  (`V`) story gate whose first half is Upper Kell (audited S82) — read
  that room's own code comment in `src/data/overworld.js` before judging
  whether this half's gate art is consistent with its twin.
- `src/data/legends.js`'s `abyss` legend for any character this row's
  rooms use that S88 didn't already see (Iron Watch uses `q`, not yet
  looked up).

## Why this, now
S88 opened abyss and confirmed check-drift's audit count at 116 of 120.
This is the rotation's last unaudited row anywhere in the world. If it
comes back clean, `## The task` below is followed by a SECOND, mandatory
step: advance `OBJECTIVE OF RECORD` in STATE.md from `6 region-art` to
`7 item-reuse` (the next rotation item in the FIXED order STATE.md
itself lists — do not skip or reorder it) and rewrite the FILE ALLOWLIST
to match #7's own scope, per the charter's own step 6 instruction ("if
the objective's done-condition in STATE.md is now met, advance..."). Add
a one-line note to STATE.md the same way #2-#5's completions were noted.
Do NOT do this early — only if this row's own audit is clean and the
count actually reaches 120.

## The task
Same method as every session this rotation: `tools/shoot-rooms.mjs
overworld,<rx>,<ry> --tide=0/1/2` for each of the four rooms below (add
`--dpr=4`+ and/or a different `--px/--py` to zoom into a sprite or a tile
seam, or to move Link off an enemy's/pickup's own spawn tile), zoom every
ground boundary and every sprite, write one verdict row each to
`docs/AUDITED-ROOMS.md`. If a visual read is ambiguous, query
`room.tile(tx,ty,tide)`, sample raw canvas pixels (S88's Drowned Shore
verdict has a working Playwright snippet, written to `tools/probe-tmp.mjs`
and deleted after use — don't commit a scratch probe script), or check
the enemy's own definition in `src/data/enemies.js`, rather than trusting
the screenshot crop alone.
Run `node tools/check-strands.mjs` once at the end of the batch and confirm
it's still at its baseline before calling the session done.
- `overworld,0,1` (Sunless Flat), `overworld,1,1` (The Long Drop)
- `overworld,2,1` (Abyss Stair), `overworld,3,1` (Iron Watch)

## Done means
- `node tools/check-drift.mjs`'s audit count goes from 116 to 120.
- `node tools/check-strands.mjs` still reports no new multi-cell region.
- Any real fix made is verified (screenshot + relevant checker).
- STATE.md gets one new session-log row, AND — only if this row is
  clean — the `OBJECTIVE OF RECORD`/allowlist rewrite described above.

## Out of scope
- Starting item-reuse (#7) work itself this session — advancing the
  objective marker is this session's job if earned; doing #7's actual
  task is not.
- Reopening npc-detail (#5) or enemy-roster (#4).
- Chasing the S78 reef-palette finding — it has no detour token yet.
- Rewriting the rotation table's numbering or order — only the
  `OBJECTIVE OF RECORD` line and allowlist move; the fixed list itself
  is untouched.
