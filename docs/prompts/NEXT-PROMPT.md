# Next session — transcribe the four untranscribed boss arenas

## Read first
- `docs/prompts/STATE.md` — the whole file.
- `docs/prompts/LEDGER.md`'s "Settled at S134", "Settled at S133" and
  "Settled at S132" sections.
- `docs/NEXT-SESSION.md`, the S134 entry only.
- `tools/measure-boss-combat.mjs`'s `ROUTE_ARENA` table and the comment above it.
- `tools/check-playthrough.mjs --trace`, the `boss` steps for d1, d2, d4, d5.

## Why this, now
Two of the six bosses are set up the way the run arrives at them. The other
four are still fought in the middle of an empty room on invented health, and
S132 proved that is a different fight: a change that won D3 every time in the
empty room lost it in the real one. Every measurement anyone makes of D1, D2,
D4 or D5 is currently a measurement of a fight nobody plays. S134 is what a
transcribed row buys — the d6 row is what let the last fight be fixed by
sweeping instead of by guessing.

## The task
Add `ROUTE_ARENA` rows for `d1`, `d2`, `d4` and `d5` in
`tools/measure-boss-combat.mjs`, each transcribed off the route's own trace:
the `at` and `facing` the run enters on, its `qh` and `maxQh` at that step, its
settle, its frame, and its `charms` if it is wearing any by then. Then sweep
each at the five seeds `20260806 1 2 3 4` and record, per boss, the win rate
and the quarter-hearts left on a win — before and after the row, so the gap
between the empty room and the real one is on the record for all four.

## Done means
- Four new rows, each with a comment naming the trace step it came from.
- A before/after five-seed table per boss in `docs/NEXT-SESSION.md`.
- `node tools/check-playthrough.mjs` green, ending in `d6/1,3,1` with six
  Essences and no deaths.
- `node tools/check-bosses.mjs`, `node tools/check-drift.mjs`,
  `node tools/test.mjs`, `node tools/replay.mjs`.
- `npm run build` with `dist/oracle-of-tides.html` committed.
- A person reads four tables and can say which fights are harder than the
  harness has been claiming, and which are easier.

## Out of scope
- Changing any fight. This session measures; it does not tune. A row that
  reads badly is a finding for `docs/NEXT-SESSION.md`, not a fix.
- The nine minibosses. They have their own table and they are the session
  after this one.
- Nereth. He is settled at S134 and seed 3's 1.25 hearts is in the fight, not
  in the health — which is not a health session's problem.
- Any route change. The trace is the input here, not the output.
- The 460-frame pickup fuse. It bit for the first time at S134 and it is still
  unaudited everywhere else; it waits.
