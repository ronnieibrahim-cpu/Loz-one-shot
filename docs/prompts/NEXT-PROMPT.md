# Next session (S183) — grow D4, the Cliffside Cistern

## Read first
- CLAUDE.md, all of it.
- docs/briefs/DUNGEON-DESIGN-LANGUAGE.md; docs/DUNGEON-STATUS.md "S179" (D4's
  row: ~43 screens, 2-3 floors, spikes drowned at HIGH, moving platforms, "a
  wheel on one floor drains the shaft of the floor below").
- docs/briefs/D3-BOGWATER-SANCTUM.md (how D3 was designed, mocked and built)
  and d3-mock/s182-built.png.
- docs/NEXT-SESSION.md S182, then S181; docs/HANDOFF.md lessons (top five).

## State
- S182 is on claude/s182-bogwater-sump, which carries S181 too (neither is
  on main unless the human said so). D3 is finished: 42 screens, 2 floors.
- Whole table green; check-playthrough 47/47, THE END, never died.

## The task
1. Design D4 as an Ages-calibre dungeon of OUR mechanics, leaning on the
   Squall Bellows (held-back tide in a cone) and a different consequence of
   the tide from D1-D3. Write docs/briefs/D4-CLIFFSIDE-CISTERN.md with a map
   and each puzzle's "aha", and SHOW THE HUMAN A MOCK beside Seasons'/Ages'
   comparable rooms (tools/shoot-mock.mjs; tools/oneshot/oracle-study for
   the cartridge rooms) BEFORE building. Ask about anything that changes the
   design.
2. Then build what the human approves: new terrain ripped from the
   cartridges, its flood verb in the same commit, a checker per puzzle that
   proves it cannot be skipped and can be solved, a check-side whole-dungeon
   run, the robot re-routed, the guide re-shot.

## Done means
- Whole table green; check-playthrough 47/47 or more, THE END, never died.
- npm run build, dist/ committed, NEXT-SESSION.md and this file updated,
  pushed; ask before moving main.

## Out of scope
- Enemy damage and health (S150). A camera that frames bosses (S153).
