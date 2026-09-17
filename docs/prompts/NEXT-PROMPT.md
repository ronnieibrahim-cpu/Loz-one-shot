# Next session — build a second outdoor Reefseed grove

## Read first
- `docs/prompts/LEDGER.md`, "Known and deliberately unfixed", the S100
  entry (two paragraphs, starts "S98's... is CONFIRMED WITHDRAWN") — the
  swim-around geometry and the `cliffTop` palette gap, both real, both
  worth not re-discovering from scratch.
- `docs/NEXT-SESSION.md` S100 for the blow-by-blow of what failed first
  and why, if the LEDGER entry alone isn't enough.
- `src/data/overworld.js`, room `0,7,9` (South Shallows) — the working
  example to build the second one from. Same fixture, same shape.

## Why this, now
South Shallows proved the overworld half of item-reuse is NOT blocked for
the Reefseed: `check-reefseed.mjs` 117/117, no new stranded region,
full suite and `check-playthrough.mjs` green. `reefseed overworld
screens` is 1; the rotation's own bar is >=3. The fixture, the tile
choices and the one real gap (`cliffTop` always grey) are now written
down, so the second room should be cheaper than the first, not a repeat
of the same investigation.

## The task
Build a SECOND outdoor Reefseed grove in `src/data/overworld.js`, same
shape as South Shallows: bank (plain dry ground), bar (`9`, solid at
LOW/MID, open at HIGH), stake (`=`, always deep) with plain `waterD`
flanking it on the row EITHER SIDE of the bar's axis (the swim-around —
skip this and the first assertion after growth fails, see LEDGER), snarl
(`k`/`seaSnarl`) one tile past the stake with only the stake as a dry
neighbour. Pick a screen NOT already carrying a `reefseedRoom`, with a
genuine unused pocket — do not move existing entities or signs to make
room.

Before trusting the colour, check whether the screen's region legend
already overrides `9`/`cliff`'s `edgeArt.up`, the way `dunes` now does
via `cliffSandTop`. If the region is `dunes` again, it's already fixed.
Any OTHER region (`coast`, `marsh`, `wood`, `salt`, `reef`, `coral`,
`cliffs`, `abyss`) may hit the identical gap `cliffTop`'s always-grey lip
has for every palette that isn't already stone-toned — `cliffs` and
`abyss` are fine (their own ground is grey), the rest are unverified.
Screenshot BEFORE assuming; fix the same narrow way (one `cliffXTop` tile,
repoint only that region's own cliff variant) if it's wrong.

## Done means
- `node tools/check-reefseed.mjs` passes with two overworld rooms
  declared, and `node tools/check-drift.mjs` reads `reefseed overworld
  screens: 2`.
- `node tools/shoot-rooms.mjs` run on the new screen at LOW and HIGH, and
  the shot actually looked at.
- `check-overworld.mjs`, `check-strands.mjs`, `check-placement.mjs`,
  `check-ground.mjs`, `check-progression.mjs`, `check-playthrough.mjs`,
  `test.mjs`, `npm run build` with `dist/` committed.
- If a run fails, fix it and re-run — do not hand a red assertion to the
  next session unexplained.

## Out of scope
- The Anchor's and the Lens's dungeon-reuse ceilings: both need a real
  swim-model change inside their own checkers (`tools/`), outside this
  objective's file allowlist regardless of token count.
- The Bellows' overworld ceiling: LEDGER says it needs a new tile with
  `dPit`'s exact flag combination (impassable in every mode, not SOLID) —
  a real unknown, not a build-from-a-known-shape task like this one. A
  separate session's work.
- A third grove, or touching any dungeon Reefseed room — one screen, one
  fixture, one honest result, same as last time.
- Repainting `cliffTop` itself, or any cliff palette besides the one the
  new room's own region needs. Six variants share it on purpose.
