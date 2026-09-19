# Next session — transcribe Nereth's arena from the route

## Read first
- `docs/prompts/STATE.md` — the whole file.
- `docs/prompts/LEDGER.md`'s "Settled at S132" section.
- `docs/NEXT-SESSION.md`, the S132 entry only.
- `tools/measure-boss-combat.mjs`'s `ROUTE_ARENA` table and its `enter:` setup.
- `tools/playthrough-route.mjs`'s D6 boss leg.

## Why this, now
S132 gave `measure-boss-combat.mjs` a `ROUTE_ARENA` row for D3 — the doorway,
the carried health, the route's own settle — and the harness's verdict stopped
disagreeing with the run's. Every other fight in the tool still starts in the
middle of an empty room on a made-up heart count, which is the setup that
produced two sessions of contradiction. Nereth is the one that matters most:
he is the end of the game and he has the thinnest margin in it.

## The task
Add a `ROUTE_ARENA` row for `d6`, transcribed off `node
tools/check-playthrough.mjs --trace` — the directive immediately before the
final `['boss', 20000, null]`. Take its `x,y`, its `hp`, the run's `maxHearts`,
and the length of the preceding `wait`, exactly as the D3 row's comment does.
Then sweep Nereth at five seeds in that arena, plain, and print the roster line
the tool now emits. Add rows for `d1`, `d2`, `d4` and `d5` the same way if the
D6 row lands cleanly and there is room left in the session.

## Done means
- Nereth's five-seed spread in `docs/NEXT-SESSION.md`, in the route's own
  arena, next to the empty-arena numbers the tool's header already carries.
- The roster line quoted for D6, so what is in that room is on the record.
- `node tools/check-playthrough.mjs` green, ending in `d6/1,3,1` with six
  Essences and no deaths.
- `node tools/check-bosses.mjs`, `node tools/check-drift.mjs`,
  `node tools/test.mjs`, `node tools/replay.mjs`.
- `npm run build` with `dist/oracle-of-tides.html` committed.
- A person reads the spread and can say whether the last fight in the game has
  a margin or a coin flip.

## Out of scope
- Changing any `dBoss` option on any fight. `openRetreat` is settled twice over
  now; do not re-open it, on D3 or anywhere else.
- Adding health, moving a fairy, or touching any enemy's contact `damage`.
  `check-hearts` asserts the ladder and the budget is not the fault.
- The Clawcrab patch. Still waiting on a run that can absorb it, and a
  `ROUTE_ARENA` row for a miniboss is a different table.
- Chasing the unmatched RNG history. It is stated in the tool's header as the
  remaining gap and closing it means replaying the whole run.
- Re-measuring the clock. Stamping the route's frame on the arena was swept at
  ten runs and changed nothing.
