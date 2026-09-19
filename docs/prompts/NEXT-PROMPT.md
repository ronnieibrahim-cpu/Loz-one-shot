# Next session — close the three standing defects

## Read first
- `docs/prompts/STATE.md` — the whole file, especially the three defects.
- `docs/NEXT-SESSION.md`, the S121 entry only.
- `docs/prompts/LEDGER.md`'s "Settled at S121" section.
- `node tools/check-hearts.mjs` and `node tools/check-charms.mjs` output.

## Why this, now
The objective of record is met: the game plays from the title screen to the
ending and `check-playthrough.mjs` proves it. There is no next rotation item,
so what is left is the red. Three things are failing or fragile and every one
of them has been named for several sessions without being touched.

## The task
Fix the two red checkers, in this order, and leave the third alone unless the
first two land early.
1. `check-charms`: the Gillcarve does not stop the breath draining —
   `plain=0 charmed=0` means the checker never sees a breath move at all.
   Find out whether the fault is the charm's hook in `src/game/items.js` or
   the checker's own setup, and say which in the commit message.
2. `check-hearts`: 23 pieces leaves 3 that can never complete a container, and
   D5 holds 1 piece rather than 2. The second is the cause of the first — a
   24th piece in `src/data/dungeons-a.js`'s Drowned Wood Shrine fixes both at
   once. It must be reachable: `check-hearts` floods for that, and
   `check-placement` and `check-ground` both have to stay green.
3. Only if 1 and 2 are done: the run's low-water mark is ONE quarter-heart
   inside Nereth's fight. Widen it, and the cheapest widening is already
   written out — `docs/prompts/QUEUE.md` item 0, floor 1 of the Keep.

## Done means
- `node tools/check-charms.mjs` and `node tools/check-hearts.mjs` both green.
- `node tools/check-playthrough.mjs` still green and still ending in
  `d6/1,3,1` with six Essences — re-record the tape if a heart piece moved.
- `node tools/check-drift.mjs`, `node tools/test.mjs`, `node tools/replay.mjs`,
  `node tools/check-placement.mjs`, `node tools/check-ground.mjs`,
  `node tools/walk-dungeons.mjs`, `node tools/check-items.mjs`.
- `npm run build` with `dist/oracle-of-tides.html` committed.
- A person reads the checker output and sees no red anywhere in the table.

## Out of scope
- Floor 1 of the Abyssal Keep's two wings, unless 1 and 2 are finished first.
- Weakening Nereth, the Brinehulk or any enemy's contact damage. The fight is
  won as it stands.
- Re-measuring the Keep's health budget or moving the Keep Gate's fairy.
- Changing `PER_DUNGEON` in `check-hearts.mjs` to make the count fit. The
  checker is right; the world is short a piece.
- Adding a third heart piece to `d6` for any reason.
