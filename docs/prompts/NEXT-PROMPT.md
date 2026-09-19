# Next session — play floor 1 of the Abyssal Keep

## Read first
- `docs/prompts/STATE.md` — the whole file.
- `docs/prompts/QUEUE.md` item 0. It has every room, every trap and the exact
  shape of each leg; the directives were authored and proved at S121.
- `docs/prompts/LEDGER.md`'s "Settled at S121" and "Settled at S122" sections.
- `docs/NEXT-SESSION.md`, the S121 entry only.
- `tools/playthrough-route.mjs`'s Abyssal Keep leg.

## Why this, now
The game plays end to end and every checker is green, so nothing is broken.
What is left is thin: the run's low-water mark is ONE quarter-heart, inside
Nereth's fight, and five rooms of the last dungeon have never been played
because the run cannot afford them. Both facts have the same cause and one fix.

## The task
Get floor 1's west and east wings into the run, in `tools/playthrough-route.mjs`.
Take them in the order QUEUE.md item 0 gives and stop at the first one that
cannot be paid for — the Colonnade of the Drowned is the cheapest and the most
worth having, because the Coilrope behind its grate is the one thing in the
Keep that asks whether the player did the coast trade. Widening the margin is
the point, so measure what each wing costs the run with
`node tools/check-playthrough.mjs --trace` before adding the next one. If a
wing cannot be paid for at the health the Keep leaves, say which and by how
much rather than putting another fairy in.

## Done means
- `node tools/check-playthrough.mjs` green, still ending in `d6/1,3,1` with six
  Essences, and its deepest trough deeper than one quarter-heart.
- A new assertion naming whichever wing rooms the run now visits.
- `node tools/check-drift.mjs`, `node tools/test.mjs`, `node tools/replay.mjs`,
  `node tools/check-lens.mjs`, `node tools/check-bosses.mjs`,
  `node tools/check-charms.mjs`, `node tools/check-hearts.mjs`,
  `node tools/walk-dungeons.mjs`, `node tools/check-dungeon-strands.mjs`.
- `npm run build` with `dist/oracle-of-tides.html` committed.
- A person reads the room table and sees the Coilrope in the run's charms.

## Out of scope
- Weakening Nereth, the Brinehulk, the tideshade or any enemy's contact damage.
- A second fairy anywhere in the Keep. One was added at S121 and it is enough
  to finish on; more is a tax on the fight rather than a fix for the route.
- A 25th heart piece. The world has 24, which is exactly six containers, and a
  25th puts the heart cap outside P9's window. Settled at S122.
- Teaching `travel` to cross a floor or plan a warp. Every stair in the Keep is
  named by hand and stays that way.
- Re-measuring the coast trade, the Keep's floor 0, or the Crossed Shafts.
