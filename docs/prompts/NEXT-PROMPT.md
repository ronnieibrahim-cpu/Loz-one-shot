# Next session — give the last fight a margin

## Read first
- `docs/prompts/STATE.md` — the whole file.
- `docs/prompts/LEDGER.md`'s "Settled at S133" and "Settled at S124" sections.
- `docs/NEXT-SESSION.md`, the S133 entry only.
- `tools/measure-boss-combat.mjs`'s `ROUTE_ARENA` `d6` row.
- `tools/playthrough-route.mjs`'s D6 boss leg and the two steps above it.

## Why this, now
S133 measured Nereth the way the route arrives at him — his own doorway, the
28 of 48 quarter-hearts the run carries, the charm the run wears — and he
wins 3 of 5, never by more than two hearts. The real run beats him the same
way: barely. Every earlier session that tried to widen a margin did it by
guessing, and S124 is the one that found the obvious answer makes things
worse. Now the measurement exists, so the fix can be chosen by sweeping it.

## The task
Raise Nereth's win rate above 4 of 5 with a margin of at least four hearts,
by changing WHAT THE KEEP PAYS OUT on the way to his door — a placed heart or
fairy in a room the route already crosses, in `src/data/dungeons-b.js`. Sweep
each candidate at the same five seeds with `node tools/measure-boss-combat.mjs
d6 --qh=N`, raising `qh` to what that pickup would actually buy, BEFORE
placing anything. Place one, update the `d6` `ROUTE_ARENA` row's `qh` from the
new trace, and re-sweep in the real arena.

## Done means
- The before-and-after five-seed spread in `docs/NEXT-SESSION.md`, in the
  route's own arena, with the remaining quarter-hearts on every win.
- `node tools/check-playthrough.mjs` green, ending in `d6/1,3,1` with six
  Essences and no deaths.
- `node tools/check-hearts.mjs`, `node tools/check-placement.mjs`,
  `node tools/check-ground.mjs`, `node tools/walk-dungeons.mjs`,
  `node tools/check-dungeon-strands.mjs` — a placed pickup touches all five.
- `node tools/check-drift.mjs`, `node tools/test.mjs`, `node tools/replay.mjs`.
- `npm run build` with `dist/oracle-of-tides.html` committed.
- A person reads the spread and sees the end of the game stop being a coin flip.

## Out of scope
- Any `dBoss` option, on any fight. `openRetreat` is settled twice over.
- Any charm. S124 measured the one-free-hit charm making every fight WORSE,
  and the case slots are already full at MID and HIGH.
- Any enemy's or boss's contact `damage`, or Nereth's own hp. `check-hearts`
  asserts the damage ladder and the fight is not the thing to soften.
- Transcribing `ROUTE_ARENA` rows for D1, D2, D4, D5 or the minibosses. They
  are worth doing and they are not this.
- The 460-frame pickup fuse. It is a real finding from S124 and it waits.
