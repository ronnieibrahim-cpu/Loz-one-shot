# Next session — a third Reefseed grove, in an untested region

## Read first
- `docs/prompts/LEDGER.md`, "Known and deliberately unfixed", the S100 entry
  and its S101 addendum — the swim-around geometry, the `cliffTop`
  always-grey lip, and exactly which regions have and haven't been tested
  against it.
- `docs/NEXT-SESSION.md` S101 for the blow-by-blow of the second grove
  (Worlds Edge, `0,11,9`), built clean in one pass by staying in `dunes`.
- `src/data/overworld.js`, rooms `0,7,9` (South Shallows) and `0,11,9`
  (Worlds Edge) — both working examples of the fixture.

## Why this, now
Two `dunes` groves are green (`check-reefseed` 132/132, `reefseed overworld
screens: 2`) and the rotation's own bar is >=3. A third `dunes` room would
close the number but prove nothing new — the palette question is answered
for that one region only. `cliffRust` (salt), `cliffCoral` (coral),
`cliffMarble` (salt) and plain `cliff`/`cliffDk` (coast/marsh/wood) still
point at the shared grey `cliffTop` and have never been asked to draw their
own top edge, the exact gap `cliffSand` had before S100.

## The task
Build a THIRD outdoor Reefseed grove in `src/data/overworld.js`, in a
region OTHER than `dunes`, `cliffs` or `abyss` (those are done or already
grey-ground): `coast`, `marsh`, `wood`, `salt`, `reef` or `coral`. Same
fixture as the first two — bank (plain dry ground), bar (a `9`/`drownWall`
override solid at LOW/MID, open at HIGH), stake (`=`, always deep) with
plain `waterD` flanking it on the row EITHER SIDE of the bar's axis, snarl
(`k`/`seaSnarl`) one tile past the stake with only the stake as a dry
neighbour. Pick a screen not already carrying a `reefseedRoom`, with a
genuine unused pocket (open sea at a room's edge is the pattern both prior
grooves used) — do not move existing entities or signs.

Before assuming the `cliffTop` bug is present, check whether the chosen
region's own legend already overrides `cliff`'s `edgeArt.up` the way
`dunes` now does. If it doesn't (check `src/data/legends.js` and the
`cliff*` tiledefs in `src/data/tiles-core.js`), the bar will need its own
region-palette variant (a `drownWall<Region>` legend override plus a
`cliff<Region>Top` tiledef, same two-part shape `drownWallSand`/
`cliffSandTop` used) — screenshot BEFORE writing any new tile to confirm
the grey lip actually shows, the same way S100 did, rather than assuming
it from reading the code.

## Done means
- `node tools/check-reefseed.mjs` passes with three overworld rooms
  declared, and `node tools/check-drift.mjs` reads `reefseed overworld
  screens: 3` — the rotation's own done-condition for this half.
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
- A fourth grove, or touching any dungeon Reefseed room — one screen, one
  fixture, one honest result, same as the last two.
- Repainting `cliffTop` itself, or any cliff palette besides the one the
  new room's own region needs. The other five variants share it on purpose
  until each is individually proven to need its own top.
