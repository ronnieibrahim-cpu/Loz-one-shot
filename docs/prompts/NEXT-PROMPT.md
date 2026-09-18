# Next session — answer the Squall Bellows' overworld half

## Read first
- `docs/prompts/STATE.md` — item 7, the note at the top, and the file allowlist.
- `docs/NEXT-SESSION.md`, the S108 entry only.
- `tools/check-bellows.mjs`'s header — what a Bellows room has to prove, and
  in particular how the cone is traced and what stops it.
- `docs/prompts/LEDGER.md`, the "Measured and rejected" section's first entry
  on the Reefseed — the Whelk Hollow is done and must not be rebuilt.
- `src/data/dungeons-a.js`, `0,2,3` The Drowned Sill — the worked fixture.

## Why this, now
The Reefseed is met (2 of 5 dungeons, 3 overworld screens, S108) and the Lens
was met at S105. The Anchor is proved at its ceiling of 1 and the only avenue
left there redefines what "requires the Anchor" means. So the Bellows is the
one item still short of item 7's bar, and objective 7 cannot close without it.
It is short on BOTH halves: 2 of 5 dungeons and 0 overworld screens.

## The task
FIRST, put one question to the human and wait for the answer, because every
outdoor Bellows fixture turns on it: **should the cone's line of sight be
stopped by `F.PIT`?** Indoors it never mattered — a Cistern sill has walls on
both sides of every gap. Outdoors a pit is the commonest thing between a
standing place and a drowned wheel, and the answer decides whether an outdoor
fixture is buildable at all or has to be walled in like an indoor one.

While waiting, do the half that does not depend on it: author ONE more
Bellows-gated obstacle in a DUNGEON above D4, in `src/data/dungeons-a.js` or
`src/data/dungeons-b.js`, taking the Bellows from 2 of 5 to 3 of 5. Copy the
Drowned Sill's fixture rather than inventing one — S108's grove passed on the
first build for exactly that reason — and give the dungeon its own material
for any tile the fixture needs, never the Cistern's.

## Done means
- `node tools/check-bellows.mjs` — the new room passes every clause, and D4's
  rooms still pass.
- `node tools/check-drift.mjs` reads `bellows ... dungeons: 3 of 5`.
- `node tools/validate.mjs`, `node tools/walk-dungeons.mjs`,
  `node tools/check-dungeon-strands.mjs`, `node tools/check-placement.mjs`,
  `node tools/check-ground.mjs`, `node tools/check-text.mjs`,
  `node tools/check-items.mjs`, `node tools/test.mjs`,
  `node tools/check-playthrough.mjs`.
- `npm run build`, with `dist/oracle-of-tides.html` committed.
- A person looks at `node tools/shoot-rooms.mjs --bellows` of the room with the
  cone up and can see which way the water has gone down.

## Out of scope
- Building a second early Reefseed grove. The Reefseed's done-condition is a
  number and S108 met it; another room is work that buys nothing.
- The Anchor. Proved at its ceiling in S106; the only avenue left redefines
  what "requires the Anchor" means and needs its own call.
- Opening a second way into a sealed grove pocket to quiet
  `check-dungeon-strands`. That fails the Reefseed prover's "the snarl is the
  only way to the far side" clause. The baseline entry is the right answer.
- `check-hearts.mjs`'s two standing failures (23 heart pieces; D5 holds 1 not
  2). They predate this objective and need a detour token.
- Guessing the `F.PIT` answer and building an outdoor fixture on the guess.
