# Next session — grow the Cliffside Cistern to 36 screens

## Read first
- `docs/prompts/STATE.md` — the whole file.
- `docs/prompts/LEDGER.md`'s "Settled at S142", "Settled at S141" and
  "Settled at S137" sections.
- `docs/NEXT-SESSION.md`, the S142 entry (how the Keep and the Shrine were
  grown: a required wing that asks for the item a new way before a door the
  route needs, optional rooms with charms) and S140 (D4 at Oracle size).
- `docs/HANDOFF.md`'s first five hard-won lessons (S142).
- `src/data/dungeons-a.js`: the `d4` block and its header comment.
- `tools/check-bellows.mjs`'s header: what a wheel, a stand and a sill
  must prove.

## Why this, now
All six dungeons are Oracle size (S137-S142); the Keep is 47 screens and
the Shrine 40. S141 the human asked for dungeons that GROW the way the
Oracle games' do, with less creative restraint. STATE.md's ladder: D3 >=32,
D4 >=36. D4 is 27.

## The task
Grow `d4` Cliffside Cistern to at least 36 screens with rooms built on
the Squall Bellows and the Cistern's tide theme (the sea in two states at
one instant).
Follow S142's shape: a REQUIRED wing that asks for the item in a new way
before a door the route needs, and optional rooms with real rewards
(unplaced charms: saltEtched, beachcomber, dryKindling, gullsTally,
chandlersEye, quartermaster, potHauler, drownedLantern, brineSkin,
ballastLung, wrackbone, fishermansRegret, deadweight, seawolfsTooth).
Each Bellows room declares `bellowsRoom` so `check-bellows.mjs` proves it.
Heart Pieces stay 24 in total. Then D3 (>=32).

## Done means
- `validate`, `walk-dungeons`, `check-dungeon-strands`, `check-bellows`,
  `solve-switches`, `check-lens`, `check-placement`, `check-ground`,
  `check-exits`, `check-hearts`, `check-items` green; `replay` and
  `test.mjs` green.
- `node tools/check-playthrough.mjs` green to THE END with no deaths.
- `check-drift` OK; `npm run build` with `dist/` committed.
- STATE.md's ladder brackets updated.

## Out of scope
- Re-kitting any dungeon; push-block art; torrent direction art; the pause
  menu's look. Re-balancing a boss beyond what a changed arena forces
  (measure over 13 seeds first; NEVER pass `--at=route`).
