# Next session — give the Reefseed its first room outside D5

## Read first
- `docs/prompts/STATE.md` — DETOUR TOKENS is 0. This session must be
  `objective`, and so must the one after it, before a token regenerates.
- `docs/prompts/LEDGER.md`, "Known and deliberately unfixed", the S95
  entry on why Bellows' and the Lens' and the Anchor's remaining halves
  are each blocked differently — this session's target (Reefseed) is
  NOT one of those; it is picked because it is NOT blocked, just capped.
- `docs/NEXT-SESSION.md` S95 for the outdoor-tile-vocabulary argument, if
  useful background (not required for this session's task).

## Why this, now
Three sessions running (S92, S94, S95) found the Lens, the Anchor's
overworld half, and now the Bellows' overworld half each blocked by a
different structural limit that needs a tool or tile change no detour
token currently covers. The Reefseed is different: `check-reefseed.mjs`'s
own filter is `r.index < 5` (blocks D1-D4, allows D5 and D6), so a
`reefseedRoom` in D6 is legal by the tool's own rules TODAY, the same way
S94 found D5/D6 legal for the Bellows. `check-drift.mjs` reads
`reefseed dungeons: 0 of 5` — building one D6 grove gets this to 1 of 5.

Worth saying plainly, so it isn't rediscovered as a surprise: D6 is the
ONLY dungeon after D5, so 1 of 5 is the ceiling here without a tool
change — same shape of cap as the Lens/Bellows problems, just already
known and out of scope. This session is not trying to close the rotation's
">=2 dungeons" bar for the Reefseed; it is making the one move that is
actually available.

## The task
Read `docs/ITEMS.md`'s Reefseed section and `tools/check-reefseed.mjs`'s
own file header in full before writing any room — it is the most
demanding of the four gate checkers (10 numbered assertions per room, plus
three global ones) and the fixture is exact: a bank, a drowned bole
(`dSnag`-shaped tile — D5's own dungeon legend override, NOT available in
`dungeonAbyss`; D6 will need ITS OWN override of a spare digit the same
way D5 overrode `5`, see `src/data/legends.js`'s `dungeonWood`/
`dungeonAbyss` entries), a stake, and a kelp snarl in a straight line,
water on one perpendicular side and a sump (`0`/`dSump`) on the other.
Find or build ONE room in D6 (`src/data/dungeons-b.js`, `id: 'd6'`) where
growing a pillar with the Reefseed is the answer. Read D5's five groves
first (`src/data/dungeons-b.js`, `id: 'd5'`) as the worked examples — do
not invent a new fixture shape; `check-reefseed.mjs`'s own header says a
second answer is exactly what a different arrangement produces.

Budget real iteration time: S94's Bellows room needed one real fix after
the first `check-bellows.mjs` run (a cone diagonal-reach leak); expect
`check-reefseed.mjs` to be at least as strict; run it after every change
rather than only at the end.

## Done means
- `node tools/check-reefseed.mjs` passes with a new room in D6 declaring
  a `reefseedRoom`.
- `node tools/check-drift.mjs` reads `reefseed dungeons: 1 of 5`, up from
  0.
- Full regression: `walk-dungeons.mjs`, `check-dungeon-strands.mjs`,
  `check-progression.mjs`, `check-placement.mjs`, `check-ground.mjs`,
  `check-playthrough.mjs`, `test.mjs`, `npm run build`.
- `docs/prompts/STATE.md` logs this session as `objective` — the first of
  the two needed before the detour token regenerates.

## Out of scope
- The Lens, the Anchor's overworld gate, and the Bellows' overworld half
  — all three need a tool or tile change no detour token exists to cover
  this session (see LEDGER).
- Trying to reach ">=2 dungeons" for the Reefseed — D6 is the only
  eligible dungeon under the current tool; 1 of 5 is this session's real
  ceiling, not a shortfall to work around.
- A new `dungeonAbyss` digit override for the bole needs picking (a spare
  digit, same as D5's `5`) — do this inside the task, not as a separate
  detour; it is data, not a `tools/` change.
- Any change to `tools/` — no detour token exists this session.
