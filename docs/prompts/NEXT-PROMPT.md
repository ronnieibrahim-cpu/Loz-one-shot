# Next session — play floor 1 of the Abyssal Keep

## Read first
- `docs/prompts/STATE.md` — the whole file.
- `docs/prompts/QUEUE.md` item 0. Every room, every trap, and the shape of
  each leg; the directives were authored and proved at S121.
- `docs/prompts/LEDGER.md`'s "Settled at S124" section.
- `docs/NEXT-SESSION.md`, the S124 entry only.
- `tools/playthrough-route.mjs`'s Abyssal Keep leg.

## Why this, now
The margin is real again: the run enters Nereth's hall on 35 of 44 and bottoms
out at 3, and nothing in the verification table is red. Five rooms of the last
dungeon have still never been played, and they were parked at S121 for one
reason — the run could not afford them. It can now afford some of them. The
Colonnade of the Drowned is the one to have: the Coilrope behind its grate is
the only thing in the Keep that asks whether the player did the coast trade.

## The task
Add floor 1's west wing to `tools/playthrough-route.mjs` — the Shade Cell
crossed, the Colonnade's grate rung with the Resonance Rod, the Coilrope taken,
and back. It was measured at NINE quarter-hearts entering on twenty-six. Run
`node tools/check-playthrough.mjs --trace` and read what it actually costs
before deciding whether the east wing fits as well; the east wing opens with a
miniboss and is the more expensive half. Expect the frame shift to move things
downstream: a fight that regresses regressed because its timing moved, not
because it got harder.

## Done means
- `node tools/check-playthrough.mjs` green, ending in `d6/1,3,1` with six
  Essences, its deepest trough still outside the Abyssal Keep.
- `coilrope` in the audit's charms line, and a new assertion naming the
  Colonnade.
- `node tools/check-drift.mjs`, `node tools/test.mjs`, `node tools/replay.mjs`,
  `node tools/check-charms.mjs`, `node tools/check-dredge.mjs`,
  `node tools/check-bosses.mjs`, `node tools/walk-dungeons.mjs`,
  `node tools/check-dungeon-strands.mjs`.
- `npm run build` with `dist/oracle-of-tides.html` committed.
- A person reads the room table and sees the Colonnade in it.

## Out of scope
- The Barnacle Skin. Measured at S123 and S124 and it is not worth a re-tune.
- Giving the Brinehulk `drops: 'rich'`. It loses the game. Settled at S124.
- Another fairy, another heart piece, or moving the two the Keep already has.
- Weakening Nereth, the Brinehulk, the tideshade or any contact damage.
- Auditing the 460-frame fuse on every placed pickup in the game. It is written
  down in STATE.md; it is not this task.
