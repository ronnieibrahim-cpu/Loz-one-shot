# Next session — give the Anchor a second dungeon room

## Read first
- `docs/prompts/STATE.md` — DETOUR TOKENS is 0. This session must be
  `objective`; it is the 2nd of 2 consecutive needed, and the token
  regenerates at the end of it.
- `docs/prompts/LEDGER.md`'s S90 row ("the Anchor's first reuse outside
  D1") — the exact fixture and the checker call this session repeats.
- `docs/prompts/LEDGER.md`, "Known and deliberately unfixed", the S91
  entry on why the Anchor's OVERWORLD half is structurally blocked (no
  outdoor tide pair is impassable at every level the way `dWell`/`dDrain`
  are indoors). NOT this session's target — this session is the Anchor's
  DUNGEON half, which S90 already proved works.

## Why this, now
`check-drift.mjs` reads `anchor dungeons: 1 of 5, overworld screens: 0`.
The rotation's done-condition wants each of Anchor/Lens/Bellows/Reefseed in
`>=2` later dungeons. S90 proved the dungeon half is tractable — D2's Bone
Cell reused the exact `dWell`/`dDrain` pairing from D1's own Iron Pipe,
each half widened to 3 tiles (a 2-tile half is hoppable, `HOP_TILES` is 2,
which is why the first draft failed) — and that fixture needs NO legend
change: `3`(`dWell`)/`4`(`dDrain`) are in the shared `dungeon` legend every
theme inherits, unlike D5/D6's Reefseed digits which needed their own
override. This session repeats that exact, already-proven move in a
dungeon that doesn't have it yet (D3, D4, D5 or D6 — not D1/D2).

## The task
Read `tools/check-anchor.mjs`'s own file header for the fixture rules, and
D2's Bone Cell (`src/data/dungeons-a.js`, `id: 'd2'`, room `'0,2,6'`) as the
worked example: a `dWell` half and a `dDrain` half, each >=3 tiles wide so
neither is hoppable, gating something (there it was a relocated `blank`
pickup) behind an `anchorGate`/`anchorGauges`-style room the conch alone
cannot cross but one Anchor placement can. Pick ONE dungeon room in D3, D4,
D5 or D6 — prefer a side room off the critical path (`tools/playthrough-
route.mjs` doesn't visit it), the same choice S90 made for Bone Cell, so a
wrong first draft costs nothing on the route. Build or convert one room to
declare an `anchorGate`. Run `node tools/check-anchor.mjs` after every
change, not just at the end — S90's first 2+2 draft failed it once already.

## Done means
- `node tools/check-anchor.mjs` passes with the new room counted.
- `node tools/check-drift.mjs` reads `anchor dungeons: 2 of 5`, up from 1.
- Full regression: `walk-dungeons.mjs`, `check-dungeon-strands.mjs`,
  `check-progression.mjs`, `check-placement.mjs`, `check-ground.mjs`,
  `check-playthrough.mjs`, `test.mjs`, `npm run build`.
- `docs/prompts/STATE.md` logs this session as `objective` — the 2nd in a
  row, so DETOUR TOKENS goes back to 1.

## Out of scope
- The Anchor's overworld half, the Lens (either half), and the Bellows'
  overworld half — all structurally blocked under the current tool per
  LEDGER; none of them are a detour, they need a tool or tile change no
  token exists to cover this session.
- The Reefseed's dungeon count is capped at 1 of 5 by `check-reefseed.mjs`'s
  own `r.index < 5` filter (D6 is the only eligible dungeon) — do not try
  to raise it, that ceiling is already documented, not a shortfall.
- Touching `tools/` — no detour token exists this session.
- A second Anchor room in the SAME dungeon this session lands one in —
  pick a dungeon that has zero so far, the same spread S90 established.
