# Next session — find out what the first dungeon costs

## Read first
- `docs/prompts/STATE.md` — the whole file.
- `docs/prompts/LEDGER.md`'s "Settled at S128" section.
- `docs/NEXT-SESSION.md`, the S128 entry only.
- `tools/playthrough-route.mjs`'s D1 leg, the `0,5,3` room in particular.
- `src/data/dungeons-a.js`, D1's `0,5,3`.

## Why this, now
The Abyssal Keep is finished and comfortable: every room played, the run enters
the throne room on 34 of 48 and troughs at 13. The whole game's worst moment is
now 2 of 48 in D1's Tide Gallery, and the second worst is `d1/0,5,3`, which
takes EIGHT quarter-hearts off a run that walks in holding twelve. Those are
the numbers a first-time player meets in the first twenty minutes, and nobody
has ever looked at them as numbers rather than as a stretch the harness
survived.

## The task
Measure what D1 costs and report it, before changing anything. For each room in
the D1 leg, read `node tools/check-playthrough.mjs`'s room table and write down
what takes health and why — contact damage crossing, a fight the route picks,
or a hazard. Then make ONE change to the worst of them, in
`tools/playthrough-route.mjs` if it is a routing cost and in
`src/data/dungeons-a.js` if the room itself is the fault, and say which it was.
`0,5,3` is the candidate: eight quarter-hearts out of twelve.

## Done means
- D1's cost written out room by room in `docs/NEXT-SESSION.md`.
- One change made, and the run's lowest point in D1 above 4.
- `node tools/check-playthrough.mjs` green, still ending in `d6/1,3,1` with six
  Essences and its Keep trough at 13 or better.
- `node tools/check-drift.mjs`, `node tools/test.mjs`, `node tools/replay.mjs`,
  `node tools/walk-dungeons.mjs`, `node tools/check-hearts.mjs`,
  `node tools/check-placement.mjs`, `node tools/check-ground.mjs`.
- `npm run build` with `dist/oracle-of-tides.html` committed.
- A person reads the room table and sees where the first dungeon hurts.

## Out of scope
- The Abyssal Keep. It is finished; leave it alone.
- Another fairy, heart or heart piece anywhere, including in D1. A first
  dungeon that is frightening is correct; one that is unsurvivable is not, and
  the run survives it.
- Weakening any enemy's contact damage. `check-hearts` asserts the damage
  ladder and it is the ladder, not one enemy, that would have to move.
- Turning `breakContact` on for anything but the tideshade.
- Auditing the 460-frame fuse on every placed pickup. Written down, not this.
