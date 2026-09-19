# Next session — transcribe the miniboss arenas

## Read first
- `docs/prompts/STATE.md` — the whole file.
- `docs/prompts/LEDGER.md`'s "Settled at S135" and "Settled at S132" sections.
- `docs/NEXT-SESSION.md`, the S135 entry only.
- `tools/measure-boss-combat.mjs`'s `MINIS` table and the `ROUTE_ARENA` table
  above it — the six rows there are the worked examples.
- `node tools/check-playthrough.mjs --trace`, every `boss` and `fight` step
  that is not one of the six dungeon bosses.

## Why this, now
All six bosses are transcribed and three of them read worse in the route's
arena than the harness had been claiming — Wyverna went from five in five to
three. `MINIS` has exactly one row, the Clawcrab, and every other miniboss in
the game is still fought in the middle of an empty room on an invented heart
count. The Clawcrab is the one the project already knows is the hardest thing
in D1; nobody has looked at the rest.

## The task
Give every miniboss the route fights a `MINIS` row carrying the same fields the
`ROUTE_ARENA` rows carry: `at`, `facing`, `qh`, `maxQh`, `settle` and `frame`,
each transcribed off the trace step that lands in its room, plus `charms` where
the route is wearing one. `maxQh` is not printed by the trace and is not
inferrable — read it out of `progress.maxHearts` with a throwaway probe and
revert the probe. Then sweep each at the five seeds `20260806 1 2 3 4` and
record the win rate and the quarter-hearts left on a win, before and after.

## Done means
- One row per miniboss, each with a comment naming its trace step.
- A before/after five-seed table per miniboss in `docs/NEXT-SESSION.md`, and a
  plain sentence saying which ones read worse than the harness claimed.
- `node tools/check-playthrough.mjs` green, ending in `d6/1,3,1` with six
  Essences and no deaths.
- `node tools/check-bosses.mjs`, `node tools/check-drift.mjs`,
  `node tools/test.mjs`, `node tools/replay.mjs`.
- `npm run build` with `dist/oracle-of-tides.html` committed.

## Out of scope
- Changing any fight, any enemy's damage, any boss option. This session reads.
  A fight that reads badly is a finding for `docs/NEXT-SESSION.md`.
- The six dungeon bosses. They were settled at S135 and re-sweeping them is
  not this.
- Any route change. The trace is the input here, not the output.
- Reading the rig's default seed as the run's own attempt. It does not restore
  the RNG stream's history; only the five-seed spread means anything.
- The 460-frame pickup fuse, still unaudited outside the Abyssal Keep.
