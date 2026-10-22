# Next session (S206) — the puzzle pass continues in D3

## Read first
- CLAUDE.md, all of it.
- docs/briefs/PUZZLE-PASS.md (the plan, the audit and the order).
- docs/NEXT-SESSION.md S205 and S204; docs/HANDOFF.md lessons (top ten);
  docs/DUNGEON-STATUS.md "S205" and "S204".

## State
- S204: D1's Switch Room, Weeping Cistern (check-blocks) and Sunken Hall
  (check-tideplates).
- S205: D1's Drip Vault (three marks, one Anchor between two wells;
  check-anchor `marks`); D2's red and blue blocks, flipped by every tide
  change (check-toggles, tools/lib/toggle-flood.mjs): the Rising Chamber and
  the Turning Pool (was the Drowned Cell).
- Whole table green; check-playthrough 49/49, THE END, never died.

## The task
- Next in the plan: D3, kinds E and G. E: torches that burn out, and a rising
  sea puts out any torch it reaches (Ages' timed flames). G: a key from above
  (Seasons' Explorer's Crypt) / holes that open only at LOW. Replace the
  Sunken Vestry's one-push room (1,1,3). Mock each room beside the cartridge
  room it borrows from (tools/oneshot/oracle-study renders them; the S205
  mocks show the side-by-side) and show the human before building.
- Every new kind gets its own prover, written first, with a `--mock` mode to
  design against; every room change re-times the robot (sweep the next
  boss's entry wait if a fight moves: Bogmaw and Gloomtide are the thin ones).
- New lines follow the rule in src/data/story.js's header.

## Done means
- Whole table green; check-playthrough 49/49 or more, THE END, never died;
  npm run build, dist/ committed; NEXT-SESSION.md and this file updated;
  pushed; merged to main when done.

## Out of scope
- Enemy damage and health (S150). A camera that frames bosses (S153).
