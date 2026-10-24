# Next session (S208) — the puzzle pass: the last two sills, then D5

## Read first
- CLAUDE.md, all of it.
- docs/briefs/PUZZLE-PASS.md (the plan, the audit and the order).
- docs/NEXT-SESSION.md S207 and S206; docs/HANDOFF.md lessons (top ten);
  docs/DUNGEON-STATUS.md "S207" and "S206".

## State
- S204-S206: D1, D2, D3 done (blocks, plates, toggles, torches, key drop).
- S207: D4's colour cube (Cistern Floor, Cistern Gauge, Spill Vault) and the
  floor that falls into the sea; check-cube. No one-push room left in D4.
- Whole table green; check-playthrough 49/49, THE END, never died.

## The task
- First the two optional wheel rooms that are still copies (the human's S207
  choice): the Gull Roost 0,6,5 and the Siphon Stair's upper wheel 0,0,1. A
  twist each (the cube, the falling floor, or something new), mocked beside
  the cartridge room first.
- Then PUZZLE-PASS.md step 6: C and F in D5 — the colour floor every tile the
  sea covers flips, and statues that copy you and will not enter water;
  replace the Sunken Bracken's one-push room and the one-stake copies.
- Every new kind gets its own prover, written first, with `--mock`; every
  room change re-times the robot (sweep the next boss's wait if a fight
  moves). New lines follow the rule in src/data/story.js's header.

## Done means
- Whole table green; check-playthrough 49/49 or more, THE END, never died;
  npm run build, dist/ committed; NEXT-SESSION.md and this file updated;
  pushed; merged to main when done.

## Out of scope
- Enemy damage and health (S150). A camera that frames bosses (S153).
