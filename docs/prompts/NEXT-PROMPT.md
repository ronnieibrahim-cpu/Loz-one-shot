# Next session — grow the Drowned Wood Shrine to 40 screens

## Read first
- `docs/prompts/STATE.md` — the whole file.
- `docs/prompts/LEDGER.md`'s "Settled at S142", "Settled at S141" and
  "Settled at S137" sections.
- `docs/NEXT-SESSION.md`, the S142 entry (how the Keep was grown: a required
  wing that examines the item before the next door, optional rooms with
  charms) and S141 (D5 at Oracle size).
- `src/data/dungeons-b.js`: the `d5` block and its header comment.
- `tools/check-reefseed.mjs`'s header: what a grove, a stake and a snarl
  must prove.

## Why this, now
All six dungeons are Oracle size (S137-S142) and the Keep is grown to 47
screens. S141 the human asked for dungeons that GROW the way the Oracle
games' do, with less creative restraint. STATE.md's ladder: D3 >=32,
D4 >=36, D5 >=40. D5 is 27.

## The task
Grow `d5` Drowned Wood Shrine to at least 40 screens with rooms built on
the Reefseed and the Shrine's tide theme (the sea in two states in order).
Follow S142's shape: a REQUIRED wing that asks for the item in a new way
before a door the route needs, and optional rooms with real rewards
(unplaced charms: dunerunner, saltEtched, beachcomber, strandwalker,
dryKindling, gullsTally, chandlersEye, quartermaster, lamplighter,
potHauler, riptideFin, anemonesGift, drownedLantern, brineSkin,
ballastLung, wrackbone, fishermansRegret, deadweight, seawolfsTooth).
Each Reefseed room declares `reefseedRoom` so `check-reefseed.mjs` proves
it. Heart Pieces stay 24 in total. Then D4 (>=36), then D3 (>=32).

## Done means
- `validate`, `walk-dungeons`, `check-dungeon-strands`, `check-reefseed`,
  `check-bellows`, `check-lens`, `check-placement`, `check-ground`,
  `check-exits`, `check-hearts`, `check-items` green; `replay` and
  `test.mjs` green.
- `node tools/check-playthrough.mjs` green to THE END with no deaths.
- `check-drift` OK; `npm run build` with `dist/` committed.
- STATE.md's ladder brackets updated.

## Out of scope
- Re-kitting any dungeon; push-block art; torrent direction art; the pause
  menu's look. Re-balancing a boss beyond what a changed arena forces
  (measure over 13 seeds first; NEVER pass `--at=route`).
