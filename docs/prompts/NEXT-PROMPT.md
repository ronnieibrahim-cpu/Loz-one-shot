# Next session (S186) — build D5's Canopy, first half

## Read first
- CLAUDE.md, all of it.
- docs/NEXT-SESSION.md S185; docs/HANDOFF.md lessons (top three).
- docs/briefs/D5-DROWNED-WOOD-SHRINE.md and its pictures in
  docs/briefs/d5-mock/ — and THE HUMAN'S ANSWERS to its five open
  questions (they are in the S185 chat; if they changed the design, the
  brief is updated first).
- docs/DUNGEON-STATUS.md.

## State
- S185 is on claude/s185-oracle-tides-vj56fe (not on main unless the human
  said so): Seasons' falling-into-a-hole for pots, blocks, enemies and drops
  (INTERAC_FALLDOWNHOLE), check-holes.mjs; D5 designed and mocked, not built.
  Whole table green; check-playthrough 47/47, THE END, never died.

## The task
1. If the human said yes: build the first half of the brief — belts (rip the
   Ancient Ruins' four conveyor tiles and their animation; Link and enemies
   carried at SPEED_80; high and low boughs drowned still), a seed riding a
   belt while it grows, knot-holes that drop a seed to the cell beneath and
   remember the stake, hold plates a stake can hold; 2F floor 1; K1 the
   Hollow Crown, K2 the Belt Bough, K3 the Grove Crown over the Standing
   Grove; check-belts.mjs and check-canopy.mjs; the flood taught belts and
   knot-holes in the same commit; the robot re-routed.
2. If they changed it: redesign and re-mock first, and ask again.

## Done means
- Whole table green; check-playthrough 47/47 or more, THE END, never died.
- npm run build, dist/ committed, NEXT-SESSION.md and this file updated,
  pushed; ask before moving main.

## Out of scope
- Enemy damage and health (S150). A camera that frames bosses (S153).
