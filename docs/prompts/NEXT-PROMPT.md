# Next session — fix check-bellows.mjs's overworld gap, then try one screen

## Read first
- `docs/prompts/STATE.md` — DETOUR TOKENS is 1 (regenerated after S92 and
  S93, both `objective`; unspent since). This session may spend it.
- `docs/prompts/LEDGER.md`, "Known and deliberately unfixed", the S94
  entry on `check-bellows.mjs`'s index filter — the exact bug and why it
  blocks Bellows' overworld half.
- `docs/NEXT-SESSION.md` S94 for the cone-geometry lesson from building
  D6's West Crypt, if this session ends up building a new sill room too.

## Why this, now
S93 and S94 gave the Squall Bellows a second and third home (D5's Bower
Cell, D6's West Crypt), closing the rotation's ">=2 dungeons" bar for
that item (`check-drift.mjs` reads `bellows dungeons: 2 of 5`). Its
overworld half is still 0 of the required 3, and S94 found why nothing
can be built there yet: `check-bellows.mjs` derives `index: (m.dungeon &&
m.dungeon.index) | 0` for every room, so an overworld screen (no
`m.dungeon`) always computes `index: 0` — and the tool's own `early =
rooms.filter(r => r.index < 4)` clause then rejects ANY declared overworld
`bellowsRoom` as "before the Bellows." This is the same shape of gap S91
found and fixed in `check-anchor.mjs` (a derived value with no
`overworld` case) — a one-line fix, not a design change like S92's Lens
finding, and DETOUR TOKENS is available to spend on it.

## The task
1. Fix `check-bellows.mjs`'s `early` filter so an overworld room is never
   rejected on this clause (something like `r.index < 4 &&
   r.mapId !== 'overworld'`, mirroring `check-anchor.mjs`'s own `late`
   filter after S91). Confirm the existing D4/D5/D6 sills are unaffected
   (still 78/78).
2. THEN, the way S91 did for the Anchor: build (or find) a REAL overworld
   screen using a Bellows sill, to prove the fix actually unblocks
   something rather than just changing a filter in the abstract. A
   windmill or gust wheel against the coast, gated the same way as the
   dungeon sills (wheel boxed by wall+pit, drowned at the sea the screen
   is played at, freed one level down, stand reached only through a
   tide-gated approach) is the obvious shape — nothing overworld has used
   this fixture before, so there is no existing overworld example to copy
   the way D6 could copy D4/D5.
3. If step 2 turns out to be blocked for a DEEPER reason once you try it
   (the way S91's Anchor overworld gate was — check `check-strands.mjs`/
   `check-overworld.mjs`'s hop model before assuming it is clear), STOP,
   revert the test placement, and write it up instead of spending a
   second token that does not exist. Do not repeat S91's shape by finding
   a second problem and trying to solve both in one session.

## Done means
- `node tools/check-bellows.mjs` still reads 78/78 (or more) after the
  filter fix, with the existing D4/D5/D6 rooms unchanged.
- Either: an overworld screen declares a `bellowsRoom` and
  `check-bellows.mjs` proves it, and `check-drift.mjs` reads
  `bellows overworld screens: 1` (or more) — up from 0; OR: a written-up
  finding says why the overworld half is blocked at a deeper level, same
  shape as S91's Anchor writeup.
- Full regression: `walk-dungeons.mjs`, `check-dungeon-strands.mjs`,
  `check-strands.mjs`, `check-overworld.mjs`, `check-progression.mjs`,
  `check-placement.mjs`, `check-ground.mjs`, `check-playthrough.mjs`,
  `test.mjs`, `npm run build`.
- `docs/prompts/STATE.md` logs this session as `detour` (a real `tools/`
  change) and decrements DETOUR TOKENS to 0.

## Out of scope
- The Lens and the overworld Anchor gate — both need a bigger model
  change than this session's one token covers (see LEDGER).
- The Reefseed — capped at 1 eligible dungeon under its own index filter,
  a separate question from this session's Bellows work.
- Do not use this session's token on anything besides the
  `check-bellows.mjs` filter fix and proving it with one overworld room.
  If the fix reveals a second, deeper problem, write it up rather than
  spending further effort chasing it in the same session.
